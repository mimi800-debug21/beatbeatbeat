// Rendering + Event-Delegation fuer alle Screens.
// ui.js kennt KEINE Spiellogik - es rendert Templates und leitet Aktionen an app.js weiter.

(function () {
  const ui = {};

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function setRoot(html, opts) {
    const preserve = opts && opts.preserve;
    const y = preserve ? window.scrollY : 0;
    document.getElementById('app').innerHTML = html;
    const h = document.querySelector('#app h1');
    if (h && !h.hasAttribute('tabindex')) {
      h.setAttribute('tabindex', '-1');
      h.focus({ preventScroll: true });
    }
    if (!preserve) window.scrollTo(0, 0);
  }

  function announce(msg) {
    const live = document.getElementById('live');
    if (live) live.textContent = '';
    requestAnimationFrame(() => {
      if (live) live.textContent = msg;
    });
  }

  ui.esc = esc;
  ui.setRoot = setRoot;
  ui.announce = announce;

  function topbar(title, crumb, onToggleMute) {
    const muted = window.app && window.app.isMuted?.() ? ' muted' : '';
    return `
      <header class="topbar">
        <div class="brand">🧺 ${esc(title)}</div>
        <div class="crumb">${esc(crumb || '')}</div>
        <button type="button" class="icon-btn" data-action="toggle-mute" aria-label="Ton an oder aus">${muted ? '🔇' : '🔊'}</button>
      </header>`;
  }
  ui.topbar = topbar;

  // ============ Setup-Screen ============
  ui.renderSetup = function (categories, defaults) {
    const order = window.CATEGORY_ORDER || Object.keys(categories);
    const extra = Object.keys(categories).filter((k) => !order.includes(k));
    const catEntries = order.concat(extra).filter((k) => categories[k]).map((k) => [k, categories[k]]);
    const activeCat = categories[defaults.category];
    const poolSize = activeCat.items.length;
    const maxTarget = Math.floor(poolSize / 2);
    const catTiles = catEntries
      .map(([key, cat]) => {
        const active = key === defaults.category;
        return `
          <button type="button" class="cat-tile${active ? ' is-active' : ''}" data-action="pick-category" data-value="${key}" aria-pressed="${active}">
            <span class="cat-emoji" aria-hidden="true">${cat.emoji}</span>
            <span class="cat-name">${esc(cat.name)}</span>
            <span class="cat-count">${cat.items.length} Stück</span>
          </button>`;
      })
      .join('');
    const samples = activeCat.items.slice(0, 3).map((i) => i.name).join(', ');

    setRoot(`
      <header class="topbar">
        <div class="brand">🧺 Bieten &amp; Haben</div>
        <div class="crumb">Das Kirmes-Spiel</div>
        <button type="button" class="icon-btn" data-action="toggle-mute" aria-label="Ton an oder aus">${window.app.isMuted() ? '🔇' : '🔊'}</button>
      </header>

      <form id="setup-form" novalidate>
        <section class="panel" aria-labelledby="h-setup">
          <h1 id="h-setup" class="setup-title">Los geht's! 🎪</h1>
          <p class="setup-sub">Stellt alles ein und lasst das Glück die erste Auktion bestimmen.</p>

          <fieldset class="fieldset">
            <legend>Wer spielt?</legend>
            <div class="player-cols">
              <div class="player-setup p1">
                <label for="name1">Name von Spieler 1</label>
                <input id="name1" name="name1" type="text" maxlength="14" value="${esc(defaults.names[0])}" autocomplete="off">
              </div>
              <div class="player-setup p2">
                <label for="name2">Name von Spieler 2</label>
                <input id="name2" name="name2" type="text" maxlength="14" value="${esc(defaults.names[1])}" autocomplete="off">
              </div>
            </div>
          </fieldset>

          <fieldset class="fieldset" aria-labelledby="cat-legend">
            <legend id="cat-legend">Kategorie</legend>
            <div class="cat-gallery">
              <div class="cat-grid">${catTiles}</div>
            </div>
            <p class="hint">Zu ${esc(activeCat.name)} gehören z. B. ${esc(samples)}.</p>
          </fieldset>

          <fieldset class="fieldset" aria-describedby="numbers-hint">
            <legend>Spiel-Einstellungen</legend>
            <div class="num-row">
              <div class="num-field">
                <label for="budget">Budget pro Spieler</label>
                <div class="num-input">
                  <span>€</span>
                  <input id="budget" name="budget" type="number" inputmode="numeric" min="1" max="99" step="1" value="${defaults.budget}" required>
                </div>
              </div>
              <div class="num-field">
                <label for="target">Gegenstände pro Spieler</label>
                <div class="num-input">
                  <span>🔎</span>
                  <input id="target" name="target" type="number" inputmode="numeric" min="1" max="${maxTarget}" step="1" value="${defaults.target}" required>
                </div>
                <p class="hint" id="numbers-hint">Ziel sind 1–${maxTarget} Stück. Wer das Ziel schafft oder pleite ist, verschenkt den Rest.</p>
              </div>
            </div>
          </fieldset>

          <fieldset class="fieldset">
            <legend>Das Glücksrad</legend>
            <div class="radio-row" role="radiogroup" aria-label="Glücksrad-Modus">
              <label class="radio-card ${defaults.wheelMode === 'once' ? 'is-checked' : ''}">
                <input type="radio" name="wheelMode" value="once" ${defaults.wheelMode === 'once' ? 'checked' : ''}>
                <span class="rc-head">🪅 Nur am Anfang</span>
                <span class="rc-sub">Einmal drehen, danach wechselt der Start ab.</span>
              </label>
              <label class="radio-card ${defaults.wheelMode === 'each' ? 'is-checked' : ''}">
                <input type="radio" name="wheelMode" value="each" ${defaults.wheelMode === 'each' ? 'checked' : ''}>
                <span class="rc-head">🎡 Vor jedem Stück</span>
                <span class="rc-sub">Vor jeder Auktion wird neu gedreht.</span>
              </label>
            </div>
          </fieldset>

          <p class="form-error" id="setup-error" role="alert" hidden></p>
          <button type="submit" class="btn-start">🚀 Spiel starten</button>
        </section>
      </form>
    `);
  };

  // ============ Spieler-Leiste + Live-Anzeige ============
  ui.playerBar = function (game, opts = {}) {
    return `
      <div class="playerbar" aria-label="Übersicht der Spieler">
        ${game.players.map((p) => {
          const stats = window.game.statsFor(game, p.id);
          const isToMove = opts.highlight === p.id;
          const cls = p.id === 1 ? 'p1' : 'p2';
          const marker = isToMove ? `<span class="turn-tag">${opts.tag || 'am Zug'}</span>` : '';
          return `
          <div class="player-card ${cls}${isToMove ? ' is-turn' : ''}">
            <div class="pc-top">
              <span class="pc-name">${esc(p.name)}</span>
              ${marker}
            </div>
            <div class="pc-budget numeric">${p.budget} <small>€</small></div>
            <div class="pc-progress">
              <span class="pc-count numeric">${stats.count}/${game.settings.target}</span>
              <span class="pc-bar" style="--fill:${Math.min(100, (stats.count / game.settings.target) * 100)}%"></span>
            </div>
          </div>`;
        }).join('')}
      </div>`;
  };

  // ============ Glücksrad ============
  ui.wheelScreen = function (game, roundNumber) {
    const p1 = game.players[0];
    const p2 = game.players[1];
    return `
      ${topbar(catName(game), `Stück ${roundNumber} von ${game.settings.target * 2}`)}
      <div class="wheel-wrap">
        <h1 class="wheel-title">Wer darf zuerst bieten?</h1>
        <div class="wheelbox" id="wheel">
          <div class="wheel-disc" id="wheel-disc">
            <span class="ws-pill" data-player="1">${esc(p1.name)}</span>
            <span class="ws-pill ws-pill--opp" data-player="2">${esc(p2.name)}</span>
          </div>
          <div class="wheel-marker" aria-hidden="true"></div>
          <div class="wheel-cap" aria-hidden="true">🎡</div>
        </div>
        <button type="button" class="btn-spin" data-action="spin">🔄 Drehen!</button>
        <p class="wheel-hint" id="wheel-hint">Tippt auf den Knopf – dann dreht das Glück.</p>
      </div>`;
  };

  ui.spinButtonLabel = function () {
    return '🔄 Drehen!';
  };

  // ============ Auktion ============
  ui.auctionScreen = function (game) {
    const r = game.round;
    const me = window.game.player(game, r.toMoveId);
    const other = window.game.player(game, me.id === 1 ? 2 : 1);
    const budget = me.budget;
    const bid = r.bid;
    const stepBtns = [
      { step: 1, label: '+1&nbsp;€', avail: budget >= bid + 1 },
      { step: 2, label: '+2&nbsp;€', avail: budget >= bid + 2 },
      { step: 5, label: '+5&nbsp;€', avail: budget >= bid + 5 },
      { step: 10, label: '+10&nbsp;€', avail: budget >= bid + 10 }
    ]
      .map(
        (b) =>
          `<button type="button" class="bid-step" data-action="bid" data-step="${b.step}" ${b.avail ? '' : 'disabled'}>${b.label}</button>`
      )
      .join('');

    const canGiveUp = r.lastBidderId !== null;
    const turnLine = canGiveUp
      ? `${esc(me.name)}: überbieten <span class="turn-who">oder dem anderen lassen</span>`
      : `${esc(me.name)} setzt als Erster ein Gebot!`;

    return `
      ${topbar(catName(game), `${esc(r.item.emoji)} ${esc(r.item.name)}`)}
      ${ui.playerBar(game, { highlight: me.id, tag: 'bietet' })}
      <section class="stage" aria-label="Auktionsgegenstand">
        <div class="card" aria-label="${esc(r.item.name)}">
          <span class="card-emoji" aria-hidden="true">${r.item.emoji}</span>
          <h1 class="card-name">${esc(r.item.name)}</h1>
          <div class="price-sign quiet" aria-live="polite">
            <span class="price-eur numeric">${window.game.currentBid(game)}</span>
            <span class="price-currency">€</span>
          </div>
        </div>
      </section>

      <section class="bid-area" aria-label="Gebot abgeben">
        <p class="turn-line"><span class="turn-dot ${me.id === 1 ? 'p1' : 'p2'}"></span>${turnLine}</p>
        <div class="bid-row">${stepBtns}</div>
        <button type="button" class="btn-giveup" data-action="give-up" ${canGiveUp ? '' : 'disabled'}><span class="giveup-pulse" aria-hidden="true"></span><span aria-hidden="true">🤝</span> Kannst haben</button>
      </section>`;
  };

  // ============ Zuschlag ============
  ui.soldScreen = function (game) {
    const winner = window.game.player(game, game.round.winnerId);
    const loser = window.game.player(game, winner.id === 1 ? 2 : 1);
    const price = game.round.bid;
    const cls = winner.id === 1 ? 'p1' : 'p2';
    return `
      <section class="flash ${cls}" role="alert">
        <p class="flash-emoji">🔔</p>
        <h1>Abgeboten!</h1>
        <p class="flash-line">${esc(loser.name)} lässt ${esc(winner.name)} das Stück für <strong>${price} €</strong> haben.</p>
        <button type="button" class="btn-ghost" data-action="continue-sold" autofocus>Weiter →</button>
      </section>`;
  };

  // ============ Geschenke ============
  ui.giftScreen = function (game) {
    const gifts = window.game.giftInfo(game);
    const byPlayer = gifts.reduce((acc, g) => {
      (acc[g.playerId] = acc[g.playerId] || []).push(g.item);
      return acc;
    }, {});
    const rows = Object.entries(byPlayer)
      .map(([id, items]) => {
        const p = window.game.player(game, Number(id));
        const cls = p.id === 1 ? 'p1' : 'p2';
        const chips = items
          .map((it) => `<span class="gift-chip"><span aria-hidden="true">${it.emoji}</span> ${esc(it.name)}</span>`)
          .join('');
        return `<div class="gift-row ${cls}"><div><h2>${esc(p.name)} bekommt geschenkt!</h2><div class="gift-chips">${chips}</div></div></div>`;
      })
      .join('');
    return `
      ${topbar(catName(game), 'Überraschung')}
      <section class="gift-panel" aria-label="Geschenke">
        <h1 class="gift-title">🎁 Und weil grade zwei ein Glücksspiel sind ...</h1>
        <p class="gift-sub">Alle, die noch nicht fertig sind, bekommen den Rest umsonst.</p>
        <div class="gift-list">${rows}</div>
        <button type="button" class="btn-start" data-action="show-results">🏆 Zur Auswertung</button>
      </section>`;
  };

  // ============ Auswertung ============
  function scorePanel() {
    const score = window.app && window.app.score ? window.app.score() : null;
    if (!score || score.games <= 0) return '';
    const rows = Object.entries(score.players)
      .map(
        ([name, s]) => `
        <div class="score-row">
          <span class="score-name">${esc(name)}</span>
          <span class="score-stats numeric">${s.games} Partie${s.games === 1 ? '' : 'n'} · ${s.items} Stück ersteigert</span>
        </div>`
      )
      .join('');
    return `
      <section class="scorecard" aria-label="Eure Bilanz">
        <h2 class="score-title">📈 Eure Bilanz</h2>
        <p class="score-sub">Ihr habt schon <strong class="numeric">${score.games}</strong> Partie${score.games === 1 ? '' : 'n'} gespielt.</p>
        <div class="score-list">${rows}</div>
      </section>`;
  }

  ui.resultsScreen = function (game) {
    const p1 = window.game.statsFor(game, 1);
    const p2 = window.game.statsFor(game, 2);
    const decks = [
      { p: game.players[0], s: p1, cls: 'p1' },
      { p: game.players[1], s: p2, cls: 'p2' }
    ];
    const playerCol = ({ p, s, cls }) => `
      <section class="result-player ${cls}">
        <header class="rp-head">
          <h2>${esc(p.name)}</h2>
        </header>
        <dl class="rp-stats numeric">
          <div><dt>Restbudget</dt><dd>${s.budgetLeft} €</dd></div>
          <div><dt>ausgegeben</dt><dd>${s.spent} €</dd></div>
          <div><dt>geschenkt</dt><dd>${s.giftedCount}</dd></div>
        </dl>
        <ul class="rp-items">
          ${s.items
            .map((w) => {
              const tag = w.gifted ? '<span class="gift-tag">Geschenk</span>' : `<span class="price-tag numeric">${w.price} €</span>`;
              return `<li><span class="ri-emoji" aria-hidden="true">${w.item.emoji}</span>${esc(w.item.name)}${tag}</li>`;
            })
            .join('')}
        </ul>
      </section>`;

    return `
      <section class="results" aria-label="Auswertung">
        <header class="results-head">
          <h1 class="results-title">Das große Finale! 🏆</h1>
          <p class="results-sub">Jetzt entscheidet ihr gemeinsam: Wer hat gewonnen?</p>
        </header>
        <div class="results-grid">
          ${playerCol(decks[0])}
          ${playerCol(decks[1])}
        </div>
        ${scorePanel()}
        <div class="results-cta">
          <button type="button" class="btn-share" data-action="share">📣 Teilen</button>
          <button type="button" class="btn-start" data-action="play-again">🔁 Nochmal spielen</button>
          <button type="button" class="btn-ghost" data-action="new-game">⚙️ Neues Setup</button>
        </div>
      </section>`;
  };

  function catName(game) {
    return (window.CATEGORIES[game.settings.category] || {}).name || game.settings.category;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ui };
  } else {
    window.ui = ui;
  }
})();