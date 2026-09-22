// Reine Spiellogik (kein DOM-Zugriff) - in Node per node:test testbar.
// Im Browser wird das Objekt auf window.game gelegt.

(function () {
  const data =
    typeof module !== 'undefined' && module.exports
      ? require('./data.js')
      : { CATEGORIES: window.CATEGORIES };

  const game = {};

  function shuffle(arr, rng) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  }

  game.createGame = function (cfg) {
    const pool = data.CATEGORIES[cfg.category].items;
    const maxTarget = Math.max(1, Math.floor(pool.length / 2));
    const target = Math.min(maxTarget, Math.max(1, cfg.target || 1));
    const budget = Math.max(1, cfg.budget || 1);
    const rng = typeof cfg.rng === 'function' ? cfg.rng : Math.random;
    const deck = shuffle(pool, rng).slice(0, target * 2);
    return {
      settings: {
        category: cfg.category,
        budget,
        target,
        wheelMode: cfg.wheelMode === 'each' ? 'each' : 'once'
      },
      players: [
        { id: 1, name: cfg.names[0], color: cfg.colors[0], budget, budgetStart: budget },
        { id: 2, name: cfg.names[1], color: cfg.colors[1], budget, budgetStart: budget }
      ],
      deck,
      idx: 0,
      phase: 'wheel',
      round: null,
      won: [],
      gifts: [],
      roundsPlayed: 0,
      lastOpenerId: null,
      rng
    };
  };

  game.player = function (g, id) {
    return g.players.find((p) => p.id === id);
  };

  game.countWon = function (g, id) {
    return g.won.filter((w) => w.playerId === id).length;
  };

  function otherId(g, id) {
    return g.players[0].id === id ? g.players[1].id : g.players[0].id;
  }

  game.determineOpener = function (g) {
    if (g.settings.wheelMode === 'each' || g.roundsPlayed === 0) {
      return g.rng() < 0.5 ? 1 : 2;
    }
    return otherId(g, g.lastOpenerId);
  };

  game.startRound = function (g, openerId) {
    const item = g.deck[g.idx++];
    g.round = { item, bid: 0, openerId, toMoveId: openerId, lastBidderId: null, over: false, winnerId: null };
    g.roundsPlayed += 1;
    g.lastOpenerId = openerId;
    g.phase = 'auction';
  };

  // Angezeigter Preis einer Runde: das Startgebot von 2 Euro steht zu Beginn.
  game.currentBid = function (g) {
    return g.round && g.round.bid > 0 ? g.round.bid : 2;
  };

  game.startWheelRound = function (g) {
    if (g.phase !== 'wheel') return { ok: false, reason: 'phase' };
    const openerId = game.determineOpener(g);
    game.startRound(g, openerId);
    return { ok: true, openerId };
  };

  game.placeBid = function (g, playerId, amount) {
    const r = g.round;
    if (g.phase !== 'auction' || !r || r.over) return { ok: false, reason: 'phase' };
    if (playerId !== r.toMoveId) return { ok: false, reason: 'not-your-turn' };
    if (!Number.isInteger(amount) || amount < 2) return { ok: false, reason: 'invalid-amount' };
    if (amount <= r.bid || (r.bid > 0 && amount < r.bid + 2)) {
      return { ok: false, reason: 'too-low' };
    }
    if (amount > game.player(g, playerId).budget) return { ok: false, reason: 'no-budget' };
    r.bid = amount;
    r.lastBidderId = playerId;
    r.toMoveId = otherId(g, playerId);
    return { ok: true };
  };

  game.giveUp = function (g, playerId) {
    const r = g.round;
    if (g.phase !== 'auction' || !r || r.over) return { ok: false, reason: 'phase' };
    if (playerId !== r.toMoveId) return { ok: false, reason: 'not-your-turn' };
    if (r.lastBidderId === null) return { ok: false, reason: 'no-bid-yet' };
    const winner = game.player(g, r.lastBidderId);
    winner.budget -= r.bid;
    g.won.push({ playerId: winner.id, item: r.item, price: r.bid, gifted: false });
    r.over = true;
    r.winnerId = winner.id;
    g.phase = 'sold';
    return { ok: true, winnerId: winner.id, price: r.bid };
  };

  function anyStehtFest(g) {
    return (
      g.players.some((p) => p.budget <= 0) ||
      g.players.some((p) => game.countWon(g, p.id) >= g.settings.target)
    );
  }

  game.giftNeed = function (g) {
    if (!anyStehtFest(g)) return [];
    return g.players
      .filter((p) => game.countWon(g, p.id) < g.settings.target)
      .map((p) => ({ playerId: p.id, count: g.settings.target - game.countWon(g, p.id) }));
  };

  game.giftInfo = function (g) {
    return g.gifts;
  };

  game.advanceAfterSold = function (g) {
    if (g.phase !== 'sold') return;
    const need = game.giftNeed(g);
    if (need.length) {
      g.gifts = [];
      for (const n of need) {
        for (let i = 0; i < n.count; i++) {
          const item = g.deck[g.idx++];
          if (!item) break;
          g.won.push({ playerId: n.playerId, item, price: 0, gifted: true });
          g.gifts.push({ playerId: n.playerId, item });
        }
      }
      g.phase = 'gift';
      return;
    }
    if (g.settings.wheelMode === 'each') {
      g.phase = 'wheel';
      return;
    }
    game.startRound(g, game.determineOpener(g));
  };

  game.finishGifts = function (g) {
    if (g.phase === 'gift') g.phase = 'results';
  };

  game.statsFor = function (g, id) {
    const won = g.won.filter((w) => w.playerId === id);
    return {
      count: won.length,
      giftedCount: won.filter((w) => w.gifted).length,
      spent: won.reduce((s, w) => s + w.price, 0),
      budgetLeft: game.player(g, id).budget,
      items: won.map((w) => ({ item: w.item, price: w.price, gifted: w.gifted }))
    };
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = game;
  } else {
    window.game = game;
  }
})();