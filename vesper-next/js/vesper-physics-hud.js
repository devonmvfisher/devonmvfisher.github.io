/**
 * Compact physics readout — AU honesty for students (Elon/Kay: simple true model).
 * Radii are display-boosted; this chip never pretends otherwise.
 */
(function () {
  "use strict";
  let el = null;
  function ensure() {
    if (el) return el;
    el = document.createElement("div");
    el.id = "physics-hud";
    el.setAttribute("aria-live", "polite");
    el.style.cssText =
      "position:fixed;z-index:21;left:10px;top:max(52px,env(safe-area-inset-top));" +
      "padding:6px 10px;border-radius:8px;background:rgba(6,10,16,0.72);color:#c8d4e8;" +
      "font:11px/1.35 ui-monospace,Menlo,monospace;pointer-events:none;max-width:min(440px,78vw);" +
      "opacity:0.9;border:1px solid rgba(100,160,220,0.25)";
    document.body.appendChild(el);
    return el;
  }
  function fmt(n, d) {
    if (!Number.isFinite(n)) return "—";
    if (Math.abs(n) >= 100) return String(Math.round(n));
    return n.toFixed(d == null ? 2 : d);
  }
  function tick() {
    requestAnimationFrame(tick);
    const s = window.VesperSky;
    if (!s) return;
    const chip = ensure();
    if (
      document.body.classList.contains("hide-controls") ||
      document.body.classList.contains("cinema-mode")
    ) {
      chip.style.display = "none";
      return;
    }
    chip.style.display = "block";
    // Emphasize in Float·Learn; quieter in Pilot·Live fly
    const learn = document.body.dataset.product !== "live";
    chip.style.opacity = learn ? "0.92" : "0.55";
    const sc = s.getScale && s.getScale();
    const auUnit = (sc && sc.auUnit) || 16000;
    let rAu = 0;
    let look = (s.getLookingAt && s.getLookingAt()) || "";
    try {
      const pos = s.getFlightPos && s.getFlightPos();
      if (pos) rAu = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z) / auUnit;
    } catch (_) {}
    const walk = s.isWalking && s.isWalking();
    const body = walk ? s.getWalkBody && s.getWalkBody() : look;
    let vesc = "";
    try {
      const sci = window.VesperScience;
      const al = sci && sci.ALMANAC && body ? sci.ALMANAC[body] : null;
      // fact() is a sentence, so f.vesc was always missing and the chip
      // never showed escape speed.
      if (al && al.vesc != null && al.vesc !== "") vesc = " · v_esc≈" + al.vesc + " km/s";
    } catch (_) {}
    const mode = document.body.dataset.product === "live" ? "Pilot·Live" : "Float·Learn";
    chip.textContent =
      mode +
      " · r≈" +
      fmt(rAu, rAu < 2 ? 3 : 2) +
      " AU" +
      (body ? " · " + body : "") +
      vesc +
      " · radii display-boosted";
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => requestAnimationFrame(tick));
  } else requestAnimationFrame(tick);
})();
