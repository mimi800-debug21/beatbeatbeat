const assert = require('node:assert/strict');
const test = require('node:test');

const { CATEGORIES, CATEGORY_ORDER } = require('../js/data.js');

test('Katalog enthält 20 Kategorien', () => {
  assert.equal(Object.keys(CATEGORIES).length, 20);
});

test('CATEGORY_ORDER listet alle Kategorien genau einmal', () => {
  assert.equal(CATEGORY_ORDER.length, 20);
  assert.equal(new Set(CATEGORY_ORDER).size, 20, 'doppelte Keys');
  for (const key of Object.keys(CATEGORIES)) {
    assert.ok(CATEGORY_ORDER.includes(key), `${key} fehlt`);
  }
});

test('Jede Kategorie hat einen Namen und ein Emoji', () => {
  for (const [key, cat] of Object.entries(CATEGORIES)) {
    assert.ok(cat.name.trim().length > 0, `${key}: Name fehlt`);
    assert.ok(cat.emoji.trim().length > 0, `${key}: Emoji fehlt`);
  }
});

test('Jede Kategorie hat mindestens 50 Items', () => {
  for (const [key, cat] of Object.entries(CATEGORIES)) {
    assert.ok(cat.items.length >= 50, `${key}: nur ${cat.items.length} Items`);
  }
});

test('Alle Item-Namen sind eindeutig und nicht leer', () => {
  for (const [key, cat] of Object.entries(CATEGORIES)) {
    const names = cat.items.map((i) => i.name);
    assert.equal(new Set(names).size, names.length, `${key}: doppelte Namen`);
    names.forEach((n) => assert.ok(n.trim().length > 0, `${key}: leerer Name`));
  }
});

test('Jedes Item hat ein Emoji', () => {
  for (const [key, cat] of Object.entries(CATEGORIES)) {
    cat.items.forEach((i) => {
      assert.ok(i.emoji.trim().length > 0, `${key}: kein Emoji fuer ${i.name}`);
    });
  }
});

test('Jede Kategorie hat genau 5 gelistete Gag-Items', () => {
  for (const [key, cat] of Object.entries(CATEGORIES)) {
    assert.ok(Array.isArray(cat.gags), `${key}: gags-Liste fehlt`);
    assert.equal(cat.gags.length, 5, `${key}: sollen 5 Gag-Items sein`);
    const names = new Set(cat.items.map((i) => i.name));
    cat.gags.forEach((g) => assert.ok(names.has(g), `${key}: Gag "${g}" ist kein Item`));
  }
});