/* Canvas upload layer. At most one completed job is applied per animation frame. */
(function () {
  "use strict";
  function toTex(THREE, canvasEl, name, isNormal) {
    const tex = new THREE.CanvasTexture(canvasEl);
    if (!isNormal) {
      tex.colorSpace = THREE.SRGBColorSpace || THREE.sRGBEncoding;
    }
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.anisotropy = 12;
    tex.needsUpdate = true;
    tex.name = name || "proc";
    return tex;
  }


  let active = null;
  function environment() {
    const low = (navigator.deviceMemory && navigator.deviceMemory <= 4) ||
      (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
      (typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches);
    const sky = window.VesperSky;
    return { low: !!low, tier: sky && sky.getQualityTier ? sky.getQualityTier() : "auto" };
  }
  function canvas(pixels, width, height) {
    const surface = document.createElement("canvas");
    surface.width = width; surface.height = height;
    const context = surface.getContext("2d");
    const image = context.createImageData(width, height);
    image.data.set(pixels);
    context.putImageData(image, 0, 0);
    return surface;
  }
  function nearest(queue) {
    const sky = window.VesperSky;
    if (!sky || !sky.getCamera || !sky._bodiesRef) return;
    const eye = sky.getCamera().position;
    const distances = new Map();
    sky._bodiesRef().forEach(function (body) {
      if (!body.group) return;
      const point = body.group.getWorldPosition(new window.THREE.Vector3());
      const key = String(body.def && body.def.key || body.name).toLowerCase();
      distances.set(key, point.distanceToSquared(eye));
    });
    queue.sort(function (a, b) {
      return (distances.get(a[0].toLowerCase()) ?? Infinity) - (distances.get(b[0].toLowerCase()) ?? Infinity);
    });
  }
  function start(THREE, callbacks) {
    if (active) return active;
    const painter = window.VesperProcPaint;
    const queue = painter.jobs(), out = {}, env = environment();
    let worker = null, inFlight = null, fallback = null, pending = null, finished = false;
    callbacks = callbacks || {};
    active = { out: out, worker: false, done: false };
    function useFallback() {
      if (worker) worker.terminate();
      worker = null; active.worker = false;
      if (inFlight) fallback = painter.begin(inFlight.options);
    }
    try {
      worker = new Worker("js/vesper-proc-worker.js");
      active.worker = true;
      worker.onmessage = function (event) {
        const message = event.data;
        if (!inFlight || message.key !== inFlight.key) { useFallback(); return; }
        if (message.error) { useFallback(); return; }
        pending = message;
      };
      worker.onerror = function (event) {
        event.preventDefault();
        useFallback();
      };
    } catch (_) { useFallback(); }
    function requestNext() {
      if (!queue.length || inFlight) return;
      nearest(queue);
      const next = queue.shift();
      inFlight = { key: next[0], options: painter.optionsFor(next[0], next[1], env) };
      if (worker) {
        try { worker.postMessage(inFlight); } catch (_) { useFallback(); }
      } else fallback = painter.begin(inFlight.options);
    }
    function frame() {
      if (finished) return;
      requestNext();
      if (fallback && !pending) {
        painter.step(fallback, 8);
        if (fallback.done) { pending = Object.assign({ key: inFlight.key }, fallback.result); fallback = null; }
      }
      if (pending) {
        const key = pending.key;
        out[key] = toTex(THREE, canvas(pending.color, pending.width, pending.height), key, false);
        out[key + "Normal"] = toTex(THREE, canvas(pending.normal, pending.width, pending.height), key + "N", true);
        window.__vesperProcTex = out;
        window.__vesperProcPartial = out;
        pending = null; inFlight = null;
        if (callbacks.onJob) callbacks.onJob(key, out);
      }
      if (!queue.length && !inFlight) {
        finished = true; active.done = true;
        if (worker) worker.terminate();
        if (window.VesperPerf) window.VesperPerf.markBakeDone();
        if (callbacks.onDone) callbacks.onDone(out);
        return;
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    return active;
  }
  window.VesperProcTex = { start: start };
})();
