// App-Start: State, Event-Delegation und Phasen-Uebergaenge.

(function () {
  const G = window.game;
  const ui = window.ui;
  const wheelUi = window.wheelUi;
  const sounds = window.sounds;

  const PREFS_KEY = 'bieten-haben-prefs';
  const SCORE_KEY = 'bieten-haben-score';
  // Kuerzeste sichtbare URL (ohne index.html) zum Teilen.
  const SHARE_URL = (() => {
    const path = location.pathname.replace(/index\.html$/, '').replace(/\/$/, '');
    return (location.origin + path) || '';
  })();
  let defaults = {
    category: 'freizeitpark',
    budget: 20,
    target: 5,
    wheelMode: 'once',
    names: ['Spieler 1', 'Spieler 2']
  };

  function loadPrefs() {
    try {
      const raw = JSON.parse(localStorage.getItem(PREFS_KEY) || 'null');
      if (raw) defaults = Object.assign({}, defaults, raw);
    } catch (e) {
      /* Ignoriere kaputte Prefs */
    }
  }

  function savePrefs(patch) {
    defaults = Object.assign({}, defaults, patch);
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(defaults));
    } catch (e) {
      /* Speichern ist optional */
    }
  }

  const state = {
    game: null,
    muted: false
  };

  let score = { games: 0, players: {} };

  function loadScore() {
    try {
      const raw = JSON.parse(localStorage.getItem(SCORE_KEY) || 'null');
      if (raw && typeof raw === 'object' && typeof raw.games === 'number') {
        score = Object.assign({ games: 0, players: {} }, raw);
      }
    } catch (e) {
      /* Ignoriere kaputte Bilanz */
    }
  }

  function saveScore() {
    try {
      localStorage.setItem(SCORE_KEY, JSON.stringify(score));
    } catch (e) {
      /* Speichern ist optional */
    }
  }

  // Einmal pro abgeschlossener Partie: gespielte Partien und Stuecke zaehlen.
  function recordGame() {
    const g = state.game;
    if (!g || g.phase !== 'results') return;
    score.games += 1;
    for (const p of g.players) {
      const entry = score.players[p.name] || { games: 0, items: 0 };
      entry.games += 1;
      entry.items += window.game.countWon(g, p.id);
      score.players[p.name] = entry;
    }
    saveScore();
  }

  function shareGame() {
    const g = state.game;
    if (!g) return;
    const resultLine = g.players
      .map((p) => {
        const s = window.game.statsFor(g, p.id);
        return `${p.name}: ${s.count} Stück für ${s.spent} €`;
      })
      .join(' · ');
    const streak = score.games > 1 ? ` Das war Partie Nr. ${score.games} bei uns.` : '';
    const text = `🎪 Bieten & Haben – Kirmes-Auktion für 2 Kinder auf einem Gerät.\n${resultLine}.${streak}\nGratis mitspielen: ${SHARE_URL}`;

    if (navigator.share) {
      navigator.share({ title: 'Bieten & Haben', text, url: SHARE_URL }).catch((e) => {
        if (!e || e.name !== 'AbortError') copyShareResult(`${text} ${SHARE_URL}`);
      });
      return;
    }
    copyShareResult(text);
  }

  function copyShareResult(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => ui.announce('Link und Ergebnis kopiert – jetzt weiterempfehlen!'))
        .catch(() => ui.announce('Teilen nicht möglich – Link: ' + SHARE_URL));
      return;
    }
    ui.announce('Link: ' + SHARE_URL);
  }

  let lastPhase = null;

  function render() {
    const g = state.game;
    if (!g) {
      ui.renderSetup(window.CATEGORIES, defaults);
      lastPhase = null;
      return;
    }
    const preserve = g.phase === lastPhase;
    lastPhase = g.phase;
    switch (g.phase) {
      case 'wheel':
        ui.setRoot(ui.wheelScreen(g, g.roundsPlayed + 1), { preserve: false });
        break;
      case 'auction':
        ui.setRoot(ui.auctionScreen(g), { preserve });
        break;
      case 'sold':
        ui.setRoot(ui.soldScreen(g), { preserve: false });
        break;
      case 'gift':
        ui.setRoot(ui.giftScreen(g), { preserve: false });
        break;
      case 'results':
        ui.setRoot(ui.resultsScreen(g), { preserve: false });
        break;
      default:
        ui.renderSetup(window.CATEGORIES, defaults);
    }
  }

  function startGame(cfg) {
    state.game = G.createGame(
      Object.assign(
        {
          names: defaults.names,
          colors: ['#2458e8', '#e2283c']
        },
        cfg
      )
    );
    savePrefs({
      category: cfg.category,
      budget: cfg.budget,
      target: cfg.target,
      wheelMode: cfg.wheelMode
    });
    render();
  }

  function handleSetup(form) {
    const data = Object.fromEntries(new FormData(form).entries());
    const poolSize = window.CATEGORIES[defaults.category].items.length;
    const maxTarget = Math.floor(poolSize / 2);
    const budget = Math.max(1, Math.min(99, parseInt(data.budget, 10) || 1));
    const target = Math.max(1, Math.min(maxTarget, parseInt(data.target, 10) || 1));
    const names = [data.name1.trim() || defaults.names[0], data.name2.trim() || defaults.names[1]];
    const wheelMode = data.wheelMode === 'each' ? 'each' : 'once';
    savePrefs({ names });
    startGame({ category: defaults.category, budget, target, wheelMode });
  }

  function spin() {
    const disc = document.getElementById('wheel-disc');
    if (!disc) return;
    const btn = document.querySelector('[data-action="spin"]');
    if (btn) {
      btn.disabled = true;
      btn.textContent = '🎡 Dreht ...';
    }
    sounds.whoosh();
    wheelUi.spin(disc, (winnerId) => {
      sounds.pling();
      const p = G.player(state.game, winnerId);
      const hint = document.getElementById('wheel-hint');
      if (hint) hint.textContent = `⚡ ${p.name} beginnt mit dem Bieten!`;
      ui.announce(`${p.name} beginnt mit dem Bieten.`);
      window.setTimeout(() => {
        G.startRound(state.game, winnerId);
        render();
      }, 950);
    });
  }

  function bid(step) {
    const g = state.game;
    if (!g || g.phase !== 'auction') return;
    const mover = g.round.toMoveId;
    const amount = g.round.bid + Number(step);
    const res = G.placeBid(g, mover, amount);
    if (!res.ok) return;
    sounds.click();
    ui.announce(`Jetzt bietet ${G.player(g, g.round.toMoveId).name} ${amount} Euro.`);
    render();
  }

  function giveUp() {
    const g = state.game;
    if (!g || g.phase !== 'auction') return;
    const res = G.giveUp(g, g.round.toMoveId);
    if (!res.ok) return;
    const winner = G.player(g, res.winnerId);
    const loser = G.player(g, winner.id === 1 ? 2 : 1);
    ui.announce(
      `${loser.name} lässt ${winner.name} ${state.game.round.item.name} für ${res.price} Euro`
    );
    sounds.fanfare();
    render();
  }

  function continueSold() {
    const g = state.game;
    if (!g || g.phase !== 'sold') return;
    G.advanceAfterSold(g);
    render();
  }

  function showResults() {
    const g = state.game;
    if (!g || g.phase !== 'gift') return;
    G.finishGifts(g);
    recordGame();
    sounds.jingle();
    render();
  }

  function playAgain() {
    const g = state.game;
    if (!g) return;
    startGame({
      category: g.settings.category,
      budget: g.settings.budget,
      target: g.settings.target,
      wheelMode: g.settings.wheelMode
    });
  }

  const actions = {
    'toggle-mute': () => {
      state.muted = !state.muted;
      sounds.setMuted(state.muted);
      if (!state.muted) sounds.click();
      render();
    },
    'pick-category': (el) => {
      defaults.category = el.dataset.value;
      savePrefs({ category: defaults.category });
      render();
    },
    start: null,
    spin,
    bid: (el) => bid(el.dataset.step),
    'give-up': giveUp,
    'continue-sold': continueSold,
    'show-results': showResults,
    'share': shareGame,
    'play-again': playAgain,
    'new-game': () => {
      state.game = null;
      sounds.click();
      render();
    }
  };

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el || el.disabled) return;
    const fn = actions[el.dataset.action];
    if (fn) fn(el);
  });

  document.addEventListener('submit', (e) => {
    if (e.target.matches('#setup-form')) {
      e.preventDefault();
      handleSetup(e.target);
    }
  });

  // Enter soll in Namensfeldern nicht versehentlich das Spiel starten.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.matches('#setup-form input[type="text"], #setup-form input[type="number"]')) {
      e.preventDefault();
    }
  });

  loadPrefs();
  loadScore();
  window.app = {
    isMuted() {
      return state.muted;
    },
    score() {
      return score;
    }
  };
  render();

  // Gelten auf dem ersten Tippen: Nutzer-Interaktion entriegelt den Sound.
  const unlock = () => sounds.setMuted(state.muted);
  document.addEventListener('pointerdown', unlock, { once: true });
})();