/* One visible message; ordinary startup messages are dropped, never replayed. */
(function (root) {
  "use strict";
  function create(clock) {
    const now = clock || function () { return performance.now(); };
    let hiddenAt = null, current = null;
    const queue = [];
    function tick() {
      if (current && now() >= current.until) current = null;
      if (!current && queue.length) {
        current = queue.shift(); current.until = now() + current.duration;
      }
      return current;
    }
    return {
      markLoaderHidden: function (at) { if (hiddenAt === null) hiddenAt = at; },
      offer: function (text, duration, error, kind) {
        if (!text || (!error && (hiddenAt === null || now() - hiddenAt < 10000))) return false;
        const message = { text: String(text), duration: duration || 3000, error: !!error, kind: kind || "guide" };
        if (error) { current = null; queue.unshift(message); }
        else { if (queue.length >= 4) queue.shift(); queue.push(message); }
        tick();
        return true;
      },
      tick: tick,
      clear: function () { current = null; queue.length = 0; },
      dismiss: function (kind) {
        if (current && current.kind === kind) current = null;
        for (let i = queue.length - 1; i >= 0; i--) if (queue[i].kind === kind) queue.splice(i, 1);
      },
      visible: function () { const item = tick(); return item ? [item] : []; }
    };
  }
  root.VesperMessageCore = { create: create };
  if (typeof module === "object" && module.exports) module.exports = root.VesperMessageCore;
  if (typeof document === "undefined") return;
  const channel = document.getElementById("guide-toast");
  const core = create();
  let playerActive = false;
  function render() {
    const hiddenAt = root.VesperPerf && root.VesperPerf.getLoaderHiddenAt();
    if (hiddenAt != null) core.markLoaderHidden(hiddenAt);
    const item = core.tick();
    if (channel) {
      channel.hidden = !item;
      channel.textContent = item ? item.text : "";
      channel.classList.toggle("show", !!item);
      if (item) {
        const rect = channel.getBoundingClientRect();
        const blocked = Array.from(document.querySelectorAll("#hud button, #hud input, #hud select, #hud [role=button]")).some(function (control) {
          const other = control.getBoundingClientRect();
          const style = getComputedStyle(control);
          return other.width > 0 && other.height > 0 && style.visibility !== "hidden" && style.opacity !== "0" &&
            rect.left < other.right && rect.right > other.left && rect.top < other.bottom && rect.bottom > other.top;
        });
        if (blocked) { channel.hidden = true; core.clear(); }
      }
    }
    requestAnimationFrame(render);
  }
  root.VesperMessages = {
    show: function (text, duration, options) {
      const hiddenAt = root.VesperPerf && root.VesperPerf.getLoaderHiddenAt();
      if (hiddenAt != null) core.markLoaderHidden(hiddenAt);
      return core.offer(text, duration, options && options.error, options && options.kind);
    },
    clear: core.clear,
    dismiss: core.dismiss,
    playerActive: function () { return playerActive; }
  };
  root.addEventListener("pointerdown", function () { playerActive = true; }, { passive: true });
  root.addEventListener("keydown", function (event) {
    if (!event.ctrlKey && !event.altKey && !event.metaKey) playerActive = true;
  });
  requestAnimationFrame(render);
})(globalThis);
