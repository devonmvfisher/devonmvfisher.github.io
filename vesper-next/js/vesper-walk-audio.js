/**
 * Soft walk ambience — wind / ice hiss / deck hum (privacy: on-device Web Audio).
 */
(function () {
  "use strict";
  let ctx = null;
  let gain = null;
  let nodes = [];
  let biome = null;

  function ac() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    gain = ctx.createGain();
    gain.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -28;
    comp.ratio.value = 3;
    gain.connect(comp);
    comp.connect(ctx.destination);
    return ctx;
  }

  function stop() {
    nodes.forEach((n) => {
      try {
        n.stop();
      } catch (_) {}
      try {
        n.disconnect();
      } catch (_) {}
    });
    nodes = [];
    if (gain && ctx) {
      gain.gain.cancelScheduledValues(ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
    }
    biome = null;
  }

  function noiseBuffer(c, sec) {
    const len = (c.sampleRate * sec) | 0;
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02; // brown-ish
      d[i] = last * 3.5;
    }
    return buf;
  }

  function start(b) {
    const c = ac();
    if (!c || !gain) return;
    if (c.state === "suspended") c.resume().catch(function () {});
    stop();
    biome = b || "rock";
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(c, 3);
    src.loop = true;
    const filt = c.createBiquadFilter();
    filt.type = "bandpass";
    filt.frequency.value =
      biome === "ice" || biome === "europa" || biome === "plume" || biome === "triton" || biome === "mimas" || biome === "rhea" || biome === "dione" || biome === "tethys" || biome === "eris" || biome === "haumea" || biome === "miranda" || biome === "ariel" || biome === "umbriel" || biome === "titania" || biome === "oberon" || biome === "orcus" || biome === "salacia" || biome === "hyperion" || biome === "halley" || biome === "encke" || biome === "janus" || biome === "epimetheus" || biome === "hiiaka" || biome === "namaka" || biome === "dysnomia" || biome === "tyche" || biome === "planetnine" || biome === "planetx"
        ? 1400
        : biome === "deck"
          ? 400
          : biome === "mars" || biome === "titan" || biome === "pluto" || biome === "sedna" || biome === "makemake" || biome === "charon" || biome === "ixion" || biome === "amalthea" || biome === "eros" || biome === "vulcan" || biome === "nibiru" || biome === "theia" || biome === "nemesis"
            ? 480
            : biome === "venus" || biome === "io"
              ? 350
              : biome === "luna" || biome === "mercury" || biome === "phobos" || biome === "deimos" || biome === "callisto" || biome === "iapetus" || biome === "vesta" || biome === "pallas" || biome === "ida" || biome === "himalia" || biome === "dactyl" || biome === "varuna" || biome === "weywot" || biome === "nereid"
                ? 620
                : biome === "ceres" || biome === "ganymede"
                  ? 900
                  : biome === "psyche"
                    ? 1100
                    : biome === "proteus" || biome === "larissa" || biome === "phoebe"
                      ? 550
                      : biome === "pbh"
                        ? 280
                        : biome === "phaeton"
                          ? 650
                          : 700;
    filt.Q.value = 0.7;
    src.connect(filt);
    filt.connect(gain);
    src.start();
    nodes.push(src);
    const vol = biome === "deck" ? 0.03 : 0.045;
    gain.gain.cancelScheduledValues(c.currentTime);
    gain.gain.linearRampToValueAtTime(vol, c.currentTime + 0.6);
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop();
  });

  window.VesperWalkAudio = { start: start, stop: stop };
})();
