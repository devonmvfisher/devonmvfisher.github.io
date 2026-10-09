/**
 * Educational Hohmann / synodic hints for students (display AU, not navigation-grade).
 * Sol-honest: rounded μ☉ = 1.327e20 m³/s²; results labeled approximate.
 */
(function () {
  "use strict";

  // AU in m, GM_sun m³/s²
  const AU_M = 1.495978707e11;
  const MU = 1.3271244e20;

  function hohmannDv(a1_au, a2_au) {
    if (!(a1_au > 0) || !(a2_au > 0) || a1_au === a2_au) return null;
    const r1 = a1_au * AU_M;
    const r2 = a2_au * AU_M;
    const aH = 0.5 * (r1 + r2);
    const v1 = Math.sqrt(MU / r1);
    const v2 = Math.sqrt(MU / r2);
    const vP = Math.sqrt(MU * (2 / r1 - 1 / aH));
    const vA = Math.sqrt(MU * (2 / r2 - 1 / aH));
    const dv1 = Math.abs(vP - v1);
    const dv2 = Math.abs(v2 - vA);
    const tof = Math.PI * Math.sqrt((aH * aH * aH) / MU); // s
    return {
      dv_kms: (dv1 + dv2) / 1000,
      dv1_kms: dv1 / 1000,
      dv2_kms: dv2 / 1000,
      tof_d: tof / 86400,
    };
  }

  function synodicDays(p1_d, p2_d) {
    if (!(p1_d > 0) || !(p2_d > 0) || p1_d === p2_d) return null;
    return Math.abs(1 / (1 / p1_d - 1 / p2_d));
  }

  let el = null;
  function ensure() {
    if (el) return el;
    el = document.createElement("div");
    el.id = "transfer-hud";
    el.style.cssText =
      "position:fixed;z-index:21;left:10px;top:max(72px,env(safe-area-inset-top));" +
      "padding:6px 10px;border-radius:8px;background:rgba(6,12,20,0.7);color:#a8c8e0;" +
      "font:11px/1.35 ui-monospace,monospace;pointer-events:none;max-width:min(380px,55vw);" +
      "opacity:0.8;border:1px solid rgba(80,140,200,0.25)";
    document.body.appendChild(el);
    return el;
  }

  function fmtAu(x) {
    if (x < 1) return x.toFixed(2);
    return Math.abs(x - Math.round(x)) < 0.05 ? String(Math.round(x)) : x.toFixed(1);
  }

  // Voyager, Halley, Parker, and Lucy ride a heliocentric rail.
  // The man-made branch was telling every one of them "not a solar orbit".
  // A parked craft (the ISS) still has no solar orbit.
  function solarRailLine(look) {
    try {
      const s = window.VesperSky;
      const bodies = s && s._bodiesRef && s._bodiesRef();
      if (!bodies || !window.THREE) return "";
      const target = bodies.find((b) => b && b.name === look && b.mesh);
      if (!target || target.isMoon) return "";
      if (target._parkedBy || target.fixed) return "";
      let sun = null;
      for (let i = 0; i < bodies.length; i++) if (bodies[i].name === "Sun") sun = bodies[i];
      if (!sun || !sun.mesh) return "";
      const sc = s.getScale && s.getScale();
      const au = (sc && sc.auUnit) || 16000;
      if (!(au > 0)) return "";
      if (!solarRailLine._a) {
        solarRailLine._a = new window.THREE.Vector3();
        solarRailLine._b = new window.THREE.Vector3();
      }
      target.mesh.getWorldPosition(solarRailLine._a);
      sun.mesh.getWorldPosition(solarRailLine._b);
      const skyAu = solarRailLine._a.distanceTo(solarRailLine._b) / au;
      if (!(skyAu > 0.02)) return "";
      const catalogAu = target.def && typeof target.def.au === "number" ? target.def.au : 0;
      let line = "display ≈ " + fmtAu(skyAu) + " AU";
      if (catalogAu > 0 && Math.abs(skyAu - catalogAu) / catalogAu > 0.12) {
        line += " · catalog " + fmtAu(catalogAu) + " AU compressed";
      }
      return line;
    } catch (_) {
      return "";
    }
  }

  function tick() {
    requestAnimationFrame(tick);
    const s = window.VesperSky;
    const sci = window.VesperScience;
    if (!s || !sci) return;
    const chip = ensure();
    if (
      document.body.classList.contains("hide-controls") ||
      document.body.classList.contains("cinema-mode") ||
      document.body.dataset.walk === "1"
    ) {
      chip.style.display = "none";
      return;
    }
    chip.style.display = "block";
    const look = s.getLookingAt && s.getLookingAt();
    const pos = s.getPos && s.getPos();
    const sc = s.getScale && s.getScale();
    if (!look || !pos || !sc) {
      chip.textContent = "Transfer · look at a body for Hohmann hint";
      return;
    }
    // The overlook sits a few radii off Earth. A Hohmann to Earth's
    // orbital radius was a 163 day burn while Earth filled the view.
    try {
      const bodies = s._bodiesRef && s._bodiesRef();
      const target = bodies && bodies.find((b) => b && b.name === look && b.mesh);
      if (target && window.THREE) {
        const tw = new window.THREE.Vector3();
        target.mesh.getWorldPosition(tw);
        const here = new window.THREE.Vector3(pos[0], pos[1], pos[2]);
        const alt = here.distanceTo(tw) - (target.radius || 0);
        const near = Math.max(800, (target.radius || 0) * 8);
        if (alt < near) {
          chip.textContent = "Transfer · already near " + look;
          return;
        }
      }
    } catch (_) {}
    const al = sci.ALMANAC[look];
    if (al && typeof al.a_au === "number" && al.a_au > 0) {
      // A Hohmann to the almanac circle misses a dot that was pulled in.
      // Sedna's burn went toward 506 AU. The sky holds that rock near 18.
      try {
        const bodies = s._bodiesRef && s._bodiesRef();
        const target = bodies && bodies.find((b) => b && b.name === look && b.mesh);
        let sun = null;
        if (bodies) for (let i = 0; i < bodies.length; i++) if (bodies[i].name === "Sun") sun = bodies[i];
        const au = (sc && sc.auUnit) || 16000;
        if (target && sun && sun.mesh && window.THREE && au > 0) {
          if (!tick._tw) {
            tick._tw = new window.THREE.Vector3();
            tick._sw = new window.THREE.Vector3();
          }
          const tw = tick._tw;
          const swv = tick._sw;
          target.mesh.getWorldPosition(tw);
          sun.mesh.getWorldPosition(swv);
          const skyAu = tw.distanceTo(swv) / au;
          if (Math.abs(skyAu - al.a_au) / al.a_au > 0.12) {
            const fmt = (x) =>
              Math.abs(x - Math.round(x)) < 0.05 ? String(Math.round(x)) : x.toFixed(1);
            chip.textContent =
              "Transfer · " + look +
              " · display ≈ " + fmt(skyAu) + " AU · almanac a ≈ " + al.a_au +
              " AU · the dot is closer than that burn";
            return;
          }
        }
      } catch (_) {}
    }
    if (!al || al.a_au == null || typeof al.a_au !== "number") {
      let why = "no solar distance";
      if (look === "Sun") why = "this is Sol";
      else if (al && al.type === "moon" && al.parent) why = "orbits " + al.parent;
      else if (al && typeof al.a_au === "string" && al.a_au) why = "a ≈ " + al.a_au + " AU · not one circle";
      else if (solarRailLine(look)) why = solarRailLine(look);
      else if (al && (al.type === "manmade" || al.type === "craft")) why = "not a solar orbit";
      chip.textContent = "Transfer · " + look + " · " + why;
      return;
    }
    // Current heliocentric r from Sun
    const bodies = s._bodiesRef && s._bodiesRef();
    let sun = null;
    if (bodies) for (let i = 0; i < bodies.length; i++) if (bodies[i].name === "Sun") sun = bodies[i];
    if (!sun || !sun.mesh || !window.THREE) {
      chip.textContent = "Transfer · await Sol";
      return;
    }
    const au = sc.auUnit || 16000;
    const THREE = window.THREE;
    const sp = new THREE.Vector3(pos[0], pos[1], pos[2]);
    const sw = new THREE.Vector3();
    sun.mesh.getWorldPosition(sw);
    const r_au = sp.distanceTo(sw) / au;
    const h = hohmannDv(Math.max(0.2, r_au), al.a_au);
    if (!h) {
      chip.textContent = "Transfer · r☉ ≈ " + r_au.toFixed(3) + " AU · at " + look;
      return;
    }
    let syn = "";
    const earth = sci.ALMANAC.Earth;
    if (earth && al.P_d && look !== "Earth") {
      const sd = synodicDays(earth.P_d, al.P_d);
      if (sd) syn = " · synodic ≈ " + Math.round(sd) + " d";
    }
    chip.textContent =
      "Hohmann→" +
      look +
      " · Δv≈" +
      h.dv_kms.toFixed(2) +
      " km/s · ToF≈" +
      Math.round(h.tof_d) +
      " d" +
      syn +
      " · approx";
  }

  window.VesperTransfer = { hohmannDv: hohmannDv, synodicDays: synodicDays };
  window.addEventListener("vesper:ready", function () {
    ensure();
    tick();
  });
})();
