const assert = require('node:assert/strict');
const test = require('node:test');

const { CATEGORIES } = require('../js/data.js');

test('Katalog enthält die Kategorie Freizeitpark', () => {
  assert.ok(CATEGORIES.freizeitpark, 'freizeitpark fehlt');
});

test('Freizeitpark hat mindestens 20 Items', () => {
  assert.ok(CATEGORIES.freizeitpark.items.length >= 20);
});

test('Alle Item-Namen sind eindeutig und nicht leer', () => {
  const names = CATEGORIES.freizeitpark.items.map((i) => i.name);
  assert.equal(new Set(names).size, names.length);
  names.forEach((n) => assert.ok(n.trim().length > 0));
});

test('Jedes Item hat ein Emoji', () => {
  CATEGORIES.freizeitpark.items.forEach((i) => {
    assert.ok(i.emoji.trim().length > 0, `kein Emoji fuer: ${i.name}`);
  });
});