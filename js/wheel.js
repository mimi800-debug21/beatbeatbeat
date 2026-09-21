// Gluecksrad: animiert die Drehung auf dem Element #wheel-disc und
// liefert das zufaellige Ergebnis (Spieler 1 oder 2) per Callback.
//
// Segment-Layout (8 Stuecke a 45deg, im Uhrzeigersinn ab 0deg = oben):
//   P1 | weiss | P2 | weiss | P1 | weiss | P2 | weiss
//   Zentren: P1=22.5deg, P2=112.5deg (und 202.5 / 292.5 fuer die Wiederholungen).
// Der Marker steht oben. Damit ein Spieler-Zentrum oben landet, wird der
// Disc um  (360 - zentrum) + k*360  Grad gedreht.

(function () {
  const CENTER = { 1: 22.5, 2: 112.5 };
  const TURNS = 3;

  function pick() {
    return Math.random() < 0.5 ? 1 : 2;
  }

  function spin(discEl, onDone) {
    const winner = pick();
    const target = 360 * TURNS + (360 - CENTER[winner]);
    discEl.style.transform = `rotate(${target}deg)`;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      if (onDone) onDone(winner);
      return winner;
    }
    const fire = () => {
      discEl.removeEventListener('transitionend', fire);
      if (onDone) onDone(winner);
    };
    discEl.addEventListener('transitionend', fire);
    return winner;
  }

  window.wheelUi = { spin, pick };
})();