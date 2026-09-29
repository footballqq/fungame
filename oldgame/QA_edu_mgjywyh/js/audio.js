/* audio.js — tiny WebAudio blips (no assets, no dependencies). */
(function () {
  "use strict";

  var ctx = null;
  var enabled = true;

  function ac() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC(); } catch (e) { return null; }
    }
    if (ctx.state === "suspended") { ctx.resume().catch(function () {}); }
    return ctx;
  }

  function blip(freq, dur, type, vol, when) {
    if (!enabled) return;
    var c = ac();
    if (!c) return;
    try {
      var t = c.currentTime + (when || 0);
      var o = c.createOscillator();
      var g = c.createGain();
      o.type = type || "square";
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(vol || 0.06, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + (dur || 0.12));
      o.connect(g); g.connect(c.destination);
      o.start(t); o.stop(t + (dur || 0.12) + 0.02);
    } catch (e) { /* audio is best-effort */ }
  }

  window.MGAudio = {
    setEnabled: function (v) { enabled = !!v; },
    isEnabled: function () { return enabled; },
    unlock: function () { ac(); },
    correct: function () { blip(660, .1); blip(880, .14, "square", .06, .09); blip(1320, .18, "square", .05, .2); },
    wrong: function () { blip(220, .2, "sawtooth", .05); blip(160, .28, "sawtooth", .05, .12); },
    tick: function () { blip(980, .04, "square", .025); },
    click: function () { blip(520, .05, "triangle", .05); },
    fanfare: function () {
      [523, 659, 784, 1047].forEach(function (f, i) { blip(f, .16, "square", .055, i * .12); });
    },
    gameover: function () {
      [392, 330, 262, 196].forEach(function (f, i) { blip(f, .2, "triangle", .06, i * .15); });
    }
  };
})();
