const assert = require('node:assert/strict');
const test = require('node:test');

const G = require('../js/game.js');

function makeGame(overrides = {}) {
  return G.createGame(
    Object.assign(
      {
        category: 'freizeitpark',
        budget: 20,
        target: 5,
        wheelMode: 'once',
        names: ['Anna', 'Ben'],
        colors: ['#2563eb', '#e11d48'],
        rng: () => 0
      },
      overrides
    )
  );
}

function player(g, id) {
  return g.players.find((p) => p.id === id);
}

test('createGame baut Grundzustand korrekt', () => {
  const g = makeGame();
  assert.equal(g.players.length, 2);
  assert.equal(g.players[0].name, 'Anna');
  assert.equal(g.players[1].name, 'Ben');
  assert.equal(g.players[0].budget, 20);
  assert.equal(g.players[1].budget, 20);
  assert.equal(g.deck.length, 10);
  assert.equal(g.phase, 'wheel');
  assert.deepEqual(g.won, []);
  assert.equal(g.round, null);
});

test('createGame klampt Ziel auf maximal moegliche Deckgroesse', () => {
  const pool = require('../js/data.js').CATEGORIES.freizeitpark.items;
  const g = makeGame({ target: 100 });
  const maxTarget = Math.floor(pool.length / 2);
  assert.equal(g.settings.target, maxTarget);
  assert.equal(g.deck.length, maxTarget * 2);
  const g2 = makeGame({ target: 0 });
  assert.equal(g2.deck.length, 2);
});

test('Deck enthaelt Items aus dem Katalog und keine Duplikate', () => {
  const g = makeGame({ target: 3 });
  const names = new Set(g.deck.map((i) => i.name));
  assert.equal(names.size, g.deck.length);
  assert.equal(g.deck.every((i) => i.name && i.emoji), true);
});

test('Modus "once": Startbestimmung zufaellig, danach wechselt der Start', () => {
  const g = makeGame({ rng: () => 0 });
  G.startWheelRound(g);
  assert.equal(g.round.openerId, 1);
  assert.equal(g.roundsPlayed, 1);
  G.placeBid(g, 1, 1);
  G.giveUp(g, 2);
  G.advanceAfterSold(g);
  assert.equal(g.round.openerId, 2);
  G.placeBid(g, 2, 1);
  G.giveUp(g, 1);
  G.advanceAfterSold(g);
  assert.equal(g.round.openerId, 1);
});

test('Modus "each": Startbestimmung ist vor jeder Runde zufaellig', () => {
  const g = makeGame({ wheelMode: 'each', rng: () => 0 });
  G.startWheelRound(g);
  assert.equal(g.round.openerId, 1);
  G.placeBid(g, 1, 1);
  G.giveUp(g, 2);
  G.advanceAfterSold(g);
  assert.equal(g.phase, 'wheel'); // Raffel naechste Runde
  const g2 = makeGame({ wheelMode: 'each', rng: () => 1 });
  G.startWheelRound(g2);
  assert.equal(g2.round.openerId, 2);
});

test('startRound beginnt als Startgebot bei 1 und der Opener zieht zuerst', () => {
  const g = makeGame();
  G.startWheelRound(g);
  assert.equal(g.round.bid, 0);
  assert.equal(G.currentBid(g), 1);
  assert.equal(g.round.toMoveId, 1);
  assert.equal(g.round.lastBidderId, null);
});

test('placeBid erhoet Gebot und wechselt den Zug', () => {
  const g = makeGame();
  G.startWheelRound(g);
  assert.deepEqual(G.placeBid(g, 1, 3), { ok: true });
  assert.equal(g.round.bid, 3);
  assert.equal(G.currentBid(g), 3);
  assert.equal(g.round.lastBidderId, 1);
  assert.equal(g.round.toMoveId, 2);
});

test('placeBid lehnt ungueltige Gebote ab', () => {
  const g = makeGame();
  G.startWheelRound(g);
  assert.equal(G.placeBid(g, 2, 3).ok, false); // falscher Spieler (nicht am Zug)
  assert.equal(G.placeBid(g, 1, 0).ok, false); // kein Schritt nach oben
  assert.equal(G.placeBid(g, 1, 1.5).ok, false); // kein ganzer Euro
  assert.equal(G.placeBid(g, 1, null).ok, false);
  assert.equal(g.round.bid, 0); // nichts veraendert
  G.placeBid(g, 1, 3);
  assert.equal(G.placeBid(g, 1, 4).ok, false); // nicht mehr am Zug
  assert.equal(G.placeBid(g, 2, 4).ok, true);
});

test('Gebote duerfen das Restbudget nicht ueberschreiten', () => {
  const g = makeGame({ budget: 3 });
  G.startWheelRound(g);
  assert.equal(G.placeBid(g, 1, 4).ok, false);
  assert.equal(G.placeBid(g, 1, 3).ok, true);
});

test('Opener kann nicht direkt aufgeben (niemand hat geboten)', () => {
  const g = makeGame();
  G.startWheelRound(g);
  assert.equal(G.giveUp(g, 1).ok, false);
});

test('giveUp: der letzte Bieter gewinnt zum aktuellen Preis', () => {
  const g = makeGame();
  G.startWheelRound(g);
  G.placeBid(g, 1, 3);
  const res = G.giveUp(g, 2);
  assert.equal(res.ok, true);
  assert.equal(res.winnerId, 1);
  assert.equal(res.price, 3);
  assert.equal(player(g, 1).budget, 17);
  assert.equal(g.phase, 'sold');
  assert.equal(g.won[0].gifted, false);
  assert.equal(g.won[0].price, 3);
});

test('Gebotshoehe steigt: der hoehere Bieter gewinnt', () => {
  const g = makeGame();
  G.startWheelRound(g);
  G.placeBid(g, 1, 3);
  G.placeBid(g, 2, 5);
  G.giveUp(g, 1);
  assert.equal(g.won[0].playerId, 2);
  assert.equal(g.won[0].price, 5);
  assert.equal(player(g, 2).budget, 15);
});

test('Ziel-erreicht fuehrt zu Geschenken fuer den anderen', () => {
  const g = makeGame({ budget: 20, target: 2 });
  G.startWheelRound(g); // Opener: Spieler 1
  G.placeBid(g, 1, 1);
  G.giveUp(g, 2);
  G.advanceAfterSold(g); // 1/2 fuer Spieler 1 - kein Trigger
  assert.equal(g.phase, 'auction');
  assert.equal(G.countWon(g, 1), 1);
  G.placeBid(g, 2, 1); // Runde 2, Opener ist Spieler 2
  G.placeBid(g, 1, 2);
  G.giveUp(g, 2); // 2/2 fuer Spieler 1 -> Geschenk-Bedarf
  G.advanceAfterSold(g);
  assert.equal(g.phase, 'gift');
  const gifts = G.giftInfo(g);
  assert.equal(gifts.length, 2); // Spieler 2 bekommt 2 Items geschenkt
  assert.equal(gifts.every((x) => x.playerId === 2), true);
  G.finishGifts(g);
  assert.equal(g.phase, 'results');
  assert.equal(G.countWon(g, 1), 2);
  assert.equal(G.countWon(g, 2), 2);
});

test('0 Euro Restbudget fuehrt zu Geschenken', () => {
  const g = makeGame({ budget: 3, target: 2 });
  G.startWheelRound(g); // Opener: Spieler 1
  G.placeBid(g, 1, 1);
  G.giveUp(g, 2);
  G.advanceAfterSold(g);
  G.placeBid(g, 2, 1); // Runde 2, Opener: Spieler 2
  G.placeBid(g, 1, 2);
  G.giveUp(g, 2);
  G.advanceAfterSold(g); // Spieler 1 hat 0 Euro -> Geschenke
  assert.equal(g.phase, 'gift');
  const gifts = G.giftInfo(g);
  assert.equal(gifts.length, 2); // Spieler 2 bekommt beide fehlenden Items
  assert.equal(gifts.every((x) => x.playerId === 2), true);
  G.finishGifts(g);
  assert.equal(G.countWon(g, 1), 2);
  assert.equal(G.countWon(g, 2), 2);
  assert.equal(player(g, 1).budget, 0);
  assert.equal(player(g, 2).budget, 3);
});

test('gar keine negativen Budgets in einer ganzen Partie', () => {
  const g = makeGame({ budget: 20, target: 3 });
  let guard = 0;
  while (g.phase === 'auction' && guard++ < 100) {
    const mover = g.round.toMoveId;
    if (player(g, mover).budget >= g.round.bid + 1) {
      G.placeBid(g, mover, g.round.bid + 1);
    } else {
      const res = G.giveUp(g, mover);
      if (res.ok) G.advanceAfterSold(g);
    }
  }
  G.finishGifts(g);
  g.players.forEach((p) => assert.ok(p.budget >= 0));
});

test('statsFor liefert Auswertungszahlen', () => {
  const g = makeGame({ budget: 20, target: 5 });
  G.startWheelRound(g);
  G.placeBid(g, 1, 4);
  G.giveUp(g, 2);
  const s = G.statsFor(g, 1);
  assert.equal(s.count, 1);
  assert.equal(s.giftedCount, 0);
  assert.equal(s.spent, 4);
  assert.equal(s.budgetLeft, 16);
});

test('ganze Partie: Spieler 1 ersteigert alles, Spieler 2 wird aufgefuellt', () => {
  const g = makeGame({ budget: 20, target: 5 });
  G.startWheelRound(g);
  let guard = 0;
  while (g.phase === 'auction' && guard++ < 50) {
    const mover = g.round.toMoveId;
    if (mover === 1) {
      G.placeBid(g, 1, g.round.bid + 1);
    } else if (g.round.lastBidderId === null) {
      G.placeBid(g, 2, 1); // Spieler 2 als Opener muss zuerst bieten
    } else {
      G.giveUp(g, 2);
      G.advanceAfterSold(g);
    }
  }
  assert.equal(g.phase, 'gift');
  G.finishGifts(g);
  assert.equal(g.phase, 'results');
  assert.equal(G.countWon(g, 1), 5);
  assert.equal(G.countWon(g, 2), 5);
  assert.equal(player(g, 1).budget, 13); // 1 + 2 + 1 + 2 + 1 Euro
  assert.equal(player(g, 2).budget, 20);
});