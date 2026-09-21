// Reine Spiellogik (kein DOM-Zugriff) - in Node per node:test testbar.
// Im Browser wird das Objekt auf window.game gelegt.

(function () {
  const game = {};

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = game;
  } else {
    window.game = game;
  }
})();