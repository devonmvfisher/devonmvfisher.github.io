/* Frame timing and scene outcomes. No performance claim is inferred from these readings. */
(function () {
  "use strict";
  let hiddenAt = null, bakeAt = null, previous = null, maximum = 0, over100 = 0;
  const recent = [];
  function tick(timestamp) {
    if (hiddenAt !== null && previous !== null && previous >= hiddenAt && timestamp >= hiddenAt) {
      const duration = timestamp - previous;
      maximum = Math.max(maximum, duration);
      if (duration > 100) over100++;
      recent.push(timestamp);
      while (recent.length && recent[0] < timestamp - 5000) recent.shift();
    }
    previous = timestamp;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  window.VesperPerf = {
    getLoaderHiddenAt: function () { return hiddenAt; },
    markLoaderHidden: function () { if (hiddenAt === null) hiddenAt = performance.now(); },
    markBakeDone: function () { if (bakeAt === null) bakeAt = performance.now(); }
  };
  window.vesperPerf = function () {
    const sky = window.VesperSky;
    let stations = 0, alive = false, gpu = "not available";
    try {
      const scene = sky && sky.getScene && sky.getScene();
      if (scene) scene.traverse(function (node) { if (node.name === "observationStation") stations++; });
      const renderer = sky && sky.getRenderer && sky.getRenderer();
      const gl = renderer && renderer.getContext();
      alive = !!(gl && !gl.isContextLost());
      if (alive) {
        const extension = gl.getExtension("WEBGL_debug_renderer_info");
        gpu = extension ? String(gl.getParameter(extension.UNMASKED_RENDERER_WEBGL)) : "not available";
      }
    } catch (_) {}
    const span = recent.length > 1 ? (recent[recent.length - 1] - recent[0]) / 1000 : 0;
    return { version: window.VesperVersion, loaderHiddenAtMs: hiddenAt, bakeDoneAtMs: bakeAt,
      maxFrameMsSinceLoaderHide: maximum, framesOver100msSinceLoaderHide: over100,
      fpsLast5s: span > 0 ? (recent.length - 1) / span : 0,
      uncaughtErrors: window.__vesperErrors ? window.__vesperErrors.count : 0,
      stations: stations, webglAlive: alive, gpu: gpu };
  };
})();
