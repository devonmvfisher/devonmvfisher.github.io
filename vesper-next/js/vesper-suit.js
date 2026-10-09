/**
 * Vesper flight suit chrome — helmet vignette + thin collar only.
 * No large translucent arm blobs (they fought the stick/thrusters).
 * Original design; not ME/Halo IP.
 */
(function () {
  "use strict";
  const LS = "vesper.suitChrome";
  let root = null;

  function ensure() {
    if (root) return root;
    root = document.createElement("div");
    root.id = "suit-chrome";
    root.setAttribute("aria-hidden", "true");
    root.innerHTML = [
      '<div class="suit-vignette"></div>',
      '<div class="suit-helmet-rim"></div>',
      '<div class="suit-collar"></div>',

    ].join("");
    document.body.appendChild(root);
    return root;
  }

  function sync() {
    ensure();
    const walk = document.body.dataset.walk === "1";
    const pilot = document.body.dataset.flightMode === "pilot";
    const hide = document.body.classList.contains("hide-controls");
    const cinema = document.body.classList.contains("cinema-mode");
    let on = true;
    try {
      if (localStorage.getItem(LS) === "0") on = false;
    } catch (_) {}
    // Subtle always; a touch stronger on walk/pilot — never opaque blobs over controls
    const show = on && !hide && !cinema;
    root.classList.toggle("show", show);
    root.classList.toggle("intense", !!(walk || pilot));
    root.classList.toggle("walk", walk);
    const sky = window.VesperSky;
    const body = sky && sky.getWalkBody && sky.getWalkBody();
    const line = walk ? "Suit · " + (body || "Surface") : pilot ? "Suit · Pilot" : "";
    if (show && line && line !== sync.last && window.VesperMessages && window.VesperMessages.playerActive()) {
      sync.last = line;
      window.VesperMessages.show(line, 3000);
    }

  }

  function boot() {
    ensure();
    sync();
    setInterval(sync, 500);
    try {
      new MutationObserver(sync).observe(document.body, {
        attributes: true,
        attributeFilter: ["class", "data-walk", "data-flight-mode"],
      });
    } catch (_) {}
  }

  window.addEventListener("vesper:ready", boot);
  window.addEventListener("vesper:hideControls", sync);
  if (document.readyState !== "loading") boot();
  else window.addEventListener("DOMContentLoaded", boot);

  window.VesperSuit = {
    setEnabled(on) {
      try {
        localStorage.setItem(LS, on ? "1" : "0");
      } catch (_) {}
      sync();
    },
  };
})();
