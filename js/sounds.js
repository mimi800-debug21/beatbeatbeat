// Synthetische WebAudio-Sounds (keine Assets) + Mute-Toggle.
// Ton startet erst nach einer echten User-Geste (Autoplay-Policy).

(function () {
  let ctx = null;
  let muted = false;
  let master = null;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, t, dur, type, vol) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || 'triangle';
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.25, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  function fire(fn) {
    if (muted) return;
    if (!ensure()) return;
    if (!ctx) return;
    const t = ctx.currentTime;
    fn(t);
  }

  const sounds = {
    setMuted(m) {
      muted = !!m;
    },
    isMuted() {
      return muted;
    },
    click() {
      fire((t) => {
        tone(240, t, 0.06, 'square', 0.12);
        tone(480, t + 0.02, 0.05, 'square', 0.08);
      });
    },
    pling() {
      fire((t) => {
        tone(660, t, 0.12, 'triangle', 0.3);
        tone(990, t + 0.09, 0.2, 'triangle', 0.25);
      });
    },
    coin() {
      fire((t) => {
        tone(988, t, 0.09, 'square', 0.14);
        tone(1319, t + 0.09, 0.18, 'square', 0.14);
      });
    },
    whoosh() {
      fire((t) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(120, t);
        o.frequency.exponentialRampToValueAtTime(700, t + 0.9);
        g.gain.setValueAtTime(0.001, t);
        g.gain.linearRampToValueAtTime(0.1, t + 0.2);
        g.gain.linearRampToValueAtTime(0.001, t + 0.95);
        o.connect(g);
        g.connect(master);
        o.start(t);
        o.stop(t + 1);
      });
    },
    fanfare() {
      fire((t) => {
        [523, 659, 784].forEach((f, i) => tone(f, t + i * 0.16, 0.22, 'square', 0.16));
        [523, 659, 784, 1047].forEach((f, i) => tone(f, t + 0.5 + i * 0.09, 0.4, 'triangle', 0.2));
      });
    },
    jingle() {
      fire((t) => {
        [880, 1109, 1319].forEach((f, i) => tone(f, t + i * 0.12, 0.3, 'triangle', 0.2));
      });
    }
  };

  window.sounds = sounds;
})();