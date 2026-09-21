// Kategorien-Katalog fuer "Bieten & Haben" (keine Logik, nur Daten).
// Item = { name: string, emoji: string }
// Im Browser: window.CATEGORIES. In Node: module.exports.CATEGORIES.

(function () {
  const CATEGORIES = {
    freizeitpark: {
      name: 'Freizeitpark',
      emoji: '🎡',
      items: [
        { name: 'Achterbahn', emoji: '🎢' },
        { name: 'Riesenrad', emoji: '🎡' },
        { name: 'Karussell', emoji: '🎠' },
        { name: 'Geisterbahn', emoji: '👻' },
        { name: 'Autoscooter', emoji: '🚗' },
        { name: 'Zuckerwatte', emoji: '🍭' },
        { name: 'Popcorn-Tüte', emoji: '🍿' },
        { name: 'Riesenrutsche', emoji: '🛝' },
        { name: 'Trampolin-Park', emoji: '🤸' },
        { name: 'Kletterwand', emoji: '🧗' },
        { name: 'Spiegellabyrinth', emoji: '🪞' },
        { name: 'Wasserrutsche', emoji: '💦' },
        { name: 'Piratenschiff', emoji: '⛵' },
        { name: 'Dosenwerfen', emoji: '🥫' },
        { name: 'Heißluftballon', emoji: '🎈' },
        { name: 'Geisterschloss', emoji: '🏰' },
        { name: 'Wings-Coaster', emoji: '🌀' },
        { name: 'Bungee-Trampolin', emoji: '🪂' },
        { name: 'Waffelstand', emoji: '🧇' },
        { name: 'Flossfahrt', emoji: '🚣' }
      ]
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CATEGORIES };
  } else {
    window.CATEGORIES = CATEGORIES;
  }
})();