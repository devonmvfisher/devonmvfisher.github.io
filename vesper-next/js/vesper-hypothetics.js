/**
 * Vesper Hypothetics — speculative Sol secrets (fiction / unconfirmed).
 * Distinct HD meshes when Hyp on; Sol hides. Almanac + Travel ◈ entries.
 */
(function () {
  "use strict";

  function hypCanvasTex(T, colHex, seed, opts) {
    opts = opts || {};
    const size = opts.size || 512;
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const g = c.getContext("2d");
    const hex = "#" + ((colHex >>> 0) & 0xffffff).toString(16).padStart(6, "0");
    g.fillStyle = hex;
    g.fillRect(0, 0, size, size);
    // fBm-ish mottling
    for (let i = 0; i < (opts.blobs || 220); i++) {
      const x = (Math.sin(seed * 12.1 + i * 7.3) * 0.5 + 0.5) * size;
      const y = (Math.cos(seed * 9.7 + i * 5.1) * 0.5 + 0.5) * size;
      const r = (6 + (i % 28)) * (size / 1024);
      const bright = i % 3 === 0;
      g.fillStyle = bright ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.14)";
      g.beginPath();
      g.ellipse(x, y, r, r * (0.5 + (i % 5) * 0.12), i, 0, Math.PI * 2);
      g.fill();
    }
    if (opts.bands) {
      for (let y = 0; y < size; y += 3) {
        const n = Math.sin(y * 0.04 + seed) * 0.5 + 0.5;
        g.fillStyle = "rgba(255,255,255," + (0.04 + n * 0.06) + ")";
        g.fillRect(0, y, size, 2);
      }
    }
    if (opts.lava) {
      for (let i = 0; i < 40; i++) {
        const x = (Math.sin(i * 19.1 + seed) * 0.5 + 0.5) * size;
        const y = (Math.cos(i * 13.7 + seed) * 0.5 + 0.5) * size;
        const grd = g.createRadialGradient(x, y, 0, x, y, size * 0.08);
        grd.addColorStop(0, "rgba(255,120,40,0.55)");
        grd.addColorStop(1, "rgba(255,40,0,0)");
        g.fillStyle = grd;
        g.beginPath();
        g.arc(x, y, size * 0.08, 0, Math.PI * 2);
        g.fill();
      }
    }
    const tex = new T.CanvasTexture(c);
    tex.colorSpace = T.SRGBColorSpace || T.sRGBEncoding;
    tex.anisotropy = 8;
    tex.needsUpdate = true;
    return tex;
  }

  const LS = "vesper.hypothetics";

  const DEFS = [
    {
      name: "Counter-Earth",
      id: "antichthon",
      au: 1.0,
      phase: Math.PI,
      y: 0,
      color: 0x4a7aaa,
      emissive: 0x102030,
      r: 0.95,
      look: "terra",
      blurb:
        "Hypothetic · Counter-Earth / Antichthon — classical Greek antipode locked opposite Earth on the same orbit (fiction). Soft-land for a mirror-Earth postcard.",
    },
    {
      name: "Counter-Luna",
      id: "counterluna",
      au: 1.0,
      phase: Math.PI + 0.12,
      y: 12,
      color: 0xb8b8c0,
      emissive: 0x202028,
      r: 0.28,
      look: "luna",
      parentHint: "Counter-Earth",
      blurb:
        "Hypothetic · Counter-Luna — a twin Moon idea paired with Counter-Earth lore (fiction). Pale and quiet.",
    },
    {
      name: "Vulcan",
      id: "vulcan",
      au: 0.16,
      phase: 0.55,
      y: 2,
      color: 0xc07040,
      emissive: 0x401808,
      r: 0.32,
      look: "lava",
      blurb:
        "Hypothetic · Vulcan — 19th-c. intra-Mercurial planet proposed to explain Mercury's perihelion (fiction; GR explained it). Scorched rock near the Sun.",
    },
    {
      name: "Nemesis",
      id: "nemesis",
      au: 58,
      phase: 1.35,
      y: -20,
      color: 0x2a1810,
      emissive: 0x601808,
      r: 4.5,
      look: "dwarfstar",
      blurb:
        "Hypothetic · Nemesis — proposed distant red/brown-dwarf companion once invoked for periodic extinctions (fiction / unsupported). Dim ember in the dark.",
    },
    {
      name: "Tyche",
      id: "tyche",
      au: 450,
      phase: 2.2,
      y: 30,
      color: 0x5a7098,
      emissive: 0x152030,
      r: 3.8,
      look: "icegiant",
      blurb:
        "Hypothetic · Tyche — proposed gas giant in the Oort cloud from IRAS-era speculation (fiction / not found). Cold and remote.",
    },
    {
      name: "Planet Nine",
      id: "planetnine",
      au: 460,
      phase: 3.6,
      y: -25,
      color: 0x2a3858,
      emissive: 0x0a1528,
      r: 3.2,
      look: "icegiant",
      blurb:
        "Hypothetic · Planet Nine — Batygin–Brown hypothesized distant giant (unconfirmed). Distinct from fringe 'Nibiru' lore. Almanac marks it speculative science.",
    },
    {
      name: "Planet X",
      id: "planetx",
      au: 48,
      phase: 4.1,
      y: 8,
      color: 0x3a4860,
      emissive: 0x101820,
      r: 2.4,
      look: "icegiant",
      blurb:
        "Hypothetic · Planet X — historical standing label for a trans-Neptunian perturber before Pluto's demotion era (speculative). Not a confirmed body.",
    },
    {
      name: "Nibiru",
      id: "nibiru",
      au: 32,
      phase: 5.0,
      y: -8,
      color: 0x5a3020,
      emissive: 0x301008,
      r: 2.8,
      look: "fringe",
      blurb:
        "Hypothetic · Nibiru — fringe/Sitchin 'Planet X' doomsday lore (fiction). Separate from Planet Nine scientific hypothesis. Vesper ships it only as labeled speculation.",
    },
    {
      name: "PBH-Halo",
      id: "pbh",
      au: 9.2,
      phase: 0.95,
      y: 15,
      color: 0x08060c,
      emissive: 0x180828,
      r: 0.55,
      look: "pbh",
      blurb:
        "Hypothetic · Primordial black hole marker — speculative dark-matter / early-universe PBH idea (fiction visualization). Gravity-well look, no accretion disk IP.",
    },
    {
      name: "Theia",
      id: "theia",
      au: 0.98,
      phase: 0.2,
      y: 4,
      color: 0x8a7060,
      emissive: 0x201810,
      r: 0.7,
      look: "rock",
      blurb:
        "Hypothetic · Theia — Mars-sized impactor in the giant-impact Moon-forming hypothesis (deep-time reconstruction / fiction placement). Not present today.",
    },
    {
      name: "Phaeton",
      id: "phaeton",
      au: 2.7,
      phase: 1.8,
      y: 0,
      color: 0x907860,
      emissive: 0x181410,
      r: 0.55,
      look: "rubble",
      blurb:
        "Hypothetic · Phaeton — 18th–19th-c. idea of a destroyed planet between Mars and Jupiter (fiction; belt is primordial rubble). Shattered look.",
    },
  ];

  // Playable display distances (outer hyps compressed so they READ; blurbs keep science scale)
  const DISPLAY_AU = {
    "Counter-Earth": 1.0,
    "Counter-Luna": 1.0,
    Vulcan: 0.18,
    Nemesis: 14.5,
    Tyche: 16.5,
    "Planet Nine": 15.5,
    "Planet X": 12.0,
    Nibiru: 9.5,
    "PBH-Halo": 4.8,
    Theia: 0.92,
    Phaeton: 2.65,
  };

  let group = null;
  let enabled = false;
  let bodies = [];
  let blurbMap = {};

  function sky() {
    return window.VesperSky;
  }
  function THREE() {
    return window.THREE;
  }

  function loadPref() {
    try {
      return localStorage.getItem(LS) === "1";
    } catch (_) {
      return false;
    }
  }
  function savePref(on) {
    try {
      localStorage.setItem(LS, on ? "1" : "0");
    } catch (_) {}
  }

  function addPresenceHalos(T, g, rad, color) {
    const halo = new T.Mesh(
      new T.SphereGeometry(rad * 1.14, 32, 24),
      new T.MeshBasicMaterial({
        color: color || 0xa0b0c8,
        transparent: true,
        opacity: 0.28,
        side: T.BackSide,
        depthWrite: false,
        blending: T.AdditiveBlending,
        toneMapped: false,
      })
    );
    const halo2 = new T.Mesh(
      new T.SphereGeometry(rad * 1.32, 28, 20),
      new T.MeshBasicMaterial({
        color: color || 0xa0b0c8,
        transparent: true,
        opacity: 0.12,
        side: T.BackSide,
        depthWrite: false,
        blending: T.AdditiveBlending,
        toneMapped: false,
      })
    );
    g.add(halo, halo2);
  }

  function localFillLight() {
    // No fill lights. Basic materials do not need them, and an iPhone 11
    // does not get extra point lights on these fiction meshes.
    return null;
  }

  /** Phaeton — shattered rubble swarm (not a single rock) */
  function makePhaetonField(T, rad, hypMap, col, em) {
    const g = new T.Group();
    const mat = new T.MeshBasicMaterial({
      map: hypMap,
      color: 0xffffff,
      toneMapped: false,
      fog: false,
    });
    // Core shard
    const core = new T.Mesh(new T.DodecahedronGeometry(rad * 0.55, 1), mat);
    core.scale.set(1.3, 0.65, 1.05);
    g.add(core);
    // Swarm of fragments
    const n = 48;
    for (let i = 0; i < n; i++) {
      const u = i / n;
      const a = u * Math.PI * 2 * 3.7;
      const elev = (Math.sin(i * 1.7) * 0.5) * rad * 0.9;
      const rr = rad * (0.7 + (i % 7) * 0.18);
      const frag = new T.Mesh(
        i % 3 === 0
          ? new T.TetrahedronGeometry(rad * (0.08 + (i % 5) * 0.03), 0)
          : new T.DodecahedronGeometry(rad * (0.06 + (i % 4) * 0.025), 0),
        mat
      );
      frag.position.set(Math.cos(a) * rr, elev, Math.sin(a) * rr);
      frag.rotation.set(i * 0.7, i * 1.1, i * 0.4);
      frag.scale.setScalar(0.6 + (i % 5) * 0.25);
      g.add(frag);
    }
    // Dust disk
    const dust = new T.Mesh(
      new T.RingGeometry(rad * 0.5, rad * 2.8, 64),
      new T.MeshBasicMaterial({
        color: 0xb09070,
        transparent: true,
        opacity: 0.22,
        side: T.DoubleSide,
        depthWrite: false,
        blending: T.AdditiveBlending,
        toneMapped: false,
      })
    );
    dust.rotation.x = Math.PI / 2.05;
    g.add(dust);
    addPresenceHalos(T, g, rad * 1.2, col);
    localFillLight(T, g, rad, 0xffd0a0, 1.8);
    g.userData.core = core;
    return { group: g, mesh: core };
  }

  /** PBH — gravity-well visualization (fiction) */
  function makePBHWell(T, rad, col) {
    const g = new T.Group();
    const core = new T.Mesh(
      new T.SphereGeometry(rad * 0.35, 32, 24),
      new T.MeshBasicMaterial({ color: 0x000000 })
    );
    // Lensing shells
    for (let i = 0; i < 5; i++) {
      const s = rad * (0.7 + i * 0.45);
      const shell = new T.Mesh(
        new T.SphereGeometry(s, 36, 24),
        new T.MeshBasicMaterial({
          color: i % 2 ? 0x6a40a0 : 0x302060,
          transparent: true,
          opacity: 0.16 - i * 0.02,
          side: T.BackSide,
          depthWrite: false,
          blending: T.AdditiveBlending,
          toneMapped: false,
        })
      );
      g.add(shell);
    }
    // Accretion-ish dust ring (original — not IP)
    const ring = new T.Mesh(
      new T.TorusGeometry(rad * 1.6, rad * 0.12, 12, 64),
      new T.MeshBasicMaterial({
        color: 0xaa88ff,
        transparent: true,
        opacity: 0.45,
        blending: T.AdditiveBlending,
        toneMapped: false,
        depthWrite: false,
      })
    );
    ring.rotation.x = Math.PI / 2.3;
    // Photon-sphere hint
    const photon = new T.Mesh(
      new T.TorusGeometry(rad * 0.55, rad * 0.03, 8, 48),
      new T.MeshBasicMaterial({
        color: 0xffe8ff,
        transparent: true,
        opacity: 0.55,
        blending: T.AdditiveBlending,
        toneMapped: false,
        depthWrite: false,
      })
    );
    photon.rotation.x = Math.PI / 2;
    g.add(core, ring, photon);
    g.userData.core = core;
    return { group: g, mesh: core };
  }

  function makeLook(T, d, rad) {
    const g = new T.Group();
    const seed = (d.name || "x").length * 17 + Math.floor(rad * 10);
    const hypMap = hypCanvasTex(T, d.color || 0x888888, seed, {
      bands: d.look === "icegiant" || d.look === "terra",
      lava: d.look === "lava",
      blobs: d.look === "luna" || d.look === "rock" ? 280 : 200,
    });
    const col = d.color;
    const em = d.emissive || 0x111111;

    if (d.look === "pbh") {
      return makePBHWell(T, rad, col);
    }
    if (d.look === "rubble") {
      return makePhaetonField(T, rad, hypMap, col, em);
    }

    let mesh;
    if (d.look === "dwarfstar") {
      mesh = new T.Mesh(
        new T.SphereGeometry(rad, 48, 36),
        new T.MeshBasicMaterial({
          map: hypMap,
          color: 0xffffff,
          toneMapped: false,
          fog: false,
        })
      );
      const glow = new T.Mesh(
        new T.SphereGeometry(rad * 1.45, 32, 24),
        new T.MeshBasicMaterial({
          color: 0xff6622,
          transparent: true,
          opacity: 0.32,
          side: T.BackSide,
          depthWrite: false,
          blending: T.AdditiveBlending,
          toneMapped: false,
        })
      );
      g.add(mesh, glow);
      localFillLight(T, g, rad, 0xff8040, 4.5);
    } else if (d.look === "fringe") {
      mesh = new T.Mesh(
        new T.SphereGeometry(rad, 56, 40),
        new T.MeshBasicMaterial({
          map: hypMap,
          color: 0xffffff,
          toneMapped: false,
          fog: false,
        })
      );
      const warn = new T.Mesh(
        new T.TorusGeometry(rad * 1.65, rad * 0.07, 10, 48),
        new T.MeshBasicMaterial({
          color: 0xff8844,
          transparent: true,
          opacity: 0.55,
          blending: T.AdditiveBlending,
          toneMapped: false,
        })
      );
      warn.rotation.x = Math.PI / 2.4;
      g.add(mesh, warn);
      localFillLight(T, g, rad, 0xffa060, 3.2);
    } else {
      const segs = d.look === "icegiant" || d.look === "terra" ? 64 : 48;
      mesh = new T.Mesh(
        new T.SphereGeometry(rad, segs, Math.max(32, (segs * 0.7) | 0)),
        new T.MeshBasicMaterial({
          map: hypMap,
          color: 0xffffff,
          toneMapped: false,
          fog: false,
        })
      );
      g.add(mesh);
      if (d.look === "terra" || d.look === "icegiant") {
        const atmo = new T.Mesh(
          new T.SphereGeometry(rad * 1.08, 40, 28),
          new T.MeshBasicMaterial({
            color: d.look === "terra" ? 0x6ec8ff : 0x88aacc,
            transparent: true,
            opacity: 0.32,
            side: T.BackSide,
            depthWrite: false,
            blending: T.AdditiveBlending,
            toneMapped: false,
          })
        );
        g.add(atmo);
        addPresenceHalos(T, g, rad, d.look === "terra" ? 0x6ec8ff : 0x88aacc);
      } else {
        addPresenceHalos(T, g, rad, col);
      }
      if (d.look === "lava") {
        const heat = new T.Mesh(
          new T.SphereGeometry(rad * 1.06, 32, 24),
          new T.MeshBasicMaterial({
            color: 0xff6622,
            transparent: true,
            opacity: 0.28,
            side: T.BackSide,
            depthWrite: false,
            blending: T.AdditiveBlending,
            toneMapped: false,
          })
        );
        g.add(heat);
      }
      localFillLight(T, g, rad, d.look === "lava" ? 0xff8040 : 0xc8d8ff, 2.8);
    }

    // Fiction glyph ring
    const ring = new T.Mesh(
      new T.TorusGeometry(rad * 1.55, rad * 0.04, 8, 48),
      new T.MeshBasicMaterial({
        color: 0x9ab0c8,
        transparent: true,
        opacity: 0.45,
        blending: T.AdditiveBlending,
        toneMapped: false,
      })
    );
    ring.rotation.x = Math.PI / 2;
    g.add(ring);
    g.userData.core = mesh;
    return { group: g, mesh: mesh };
  }

  function upsertBody(s, body) {
    // Refresh stale mesh pointers when re-placing
    if (s.replaceBody) {
      s.replaceBody(body);
      return;
    }
    if (s.registerBody) {
      const names = (s.travelNames && s.travelNames()) || [];
      if (names.indexOf(body.name) < 0) s.registerBody(body);
      else if (s.updateBody) s.updateBody(body);
      else {
        // Manual refresh via bodies if exposed
        const list = s._bodiesRef && s._bodiesRef();
        if (list) {
          const i = list.findIndex((b) => b.name === body.name);
          if (i >= 0) {
            list[i].mesh = body.mesh;
            list[i].group = body.group;
            list[i].radius = body.radius;
            list[i].def = body.def;
            list[i].hypothetic = true;
            list[i].fixed = true;
            list[i].landable = body.landable;
          } else s.registerBody(body);
        } else s.registerBody(body);
      }
    }
  }

  function place() {
    const s = sky();
    const T = THREE();
    if (!s || !T || !s.system) return;
    const system = s.system();
    if (!system) return;
    if (group) {
      system.remove(group);
      group = null;
      bodies = [];
    }
    group = new T.Group();
    group.name = "vesperHypothetics";
    const scale = (s.getScale && s.getScale()) || {};
    const AU = scale.auUnit || 16000;
    const ER = scale.earthR || 520;
    blurbMap = {};
    DEFS.forEach((d) => {
      blurbMap[d.name] = d.blurb;
      // Presence radii — readable from cruise
      const rad = Math.max(ER * d.r * 0.55, d.look === "pbh" ? ER * 0.35 : ER * 0.22);
      const built = makeLook(T, d, rad);
      const g = built.group;
      g.name = d.name;
      const auShow = DISPLAY_AU[d.name] != null ? DISPLAY_AU[d.name] : Math.min(d.au, 18);
      const R = auShow * AU;
      g.position.set(Math.cos(d.phase) * R, (d.y || 0) * (ER / 180), Math.sin(d.phase) * R);
      group.add(g);
      const body = {
        name: d.name,
        group: g,
        mesh: built.mesh,
        def: { radius: rad, orbit: R, speed: 0, y: (d.y || 0) * (ER / 180) },
        angle: d.phase,
        radius: rad,
        landable: d.look !== "pbh" && d.look !== "dwarfstar",
        hypothetic: true,
        fixed: true,
        hypLook: d.look,
      };
      bodies.push(body);
      upsertBody(s, body);
    });
    if (s.getBlurb && !s._hypBlurb) {
      const orig = s.getBlurb.bind(s);
      s._hypBlurb = true;
      s.getBlurb = (name) => blurbMap[name] || orig(name);
    } else if (s.getBlurb) {
      const prev = s.getBlurb.bind(s);
      s.getBlurb = (name) => blurbMap[name] || prev(name);
    }
    system.add(group);
    applyVis();
    const sel = document.getElementById("travel-select");
    if (sel) {
      DEFS.forEach((d) => {
        let o = [...sel.options].find((x) => x.value === d.name);
        if (!o) {
          o = document.createElement("option");
          o.value = d.name;
          o.textContent = "◈ " + d.name;
          o.dataset.hyp = "1";
          sel.appendChild(o);
        } else {
          o.dataset.hyp = "1";
          if (o.textContent.indexOf("◈") < 0) o.textContent = "◈ " + d.name;
        }
      });
    }
  }

  function applyVis() {
    const s = sky();
    const straight = s && s.getStraightMan && s.getStraightMan();
    if (group) {
      group.visible = enabled && !straight;
      group.traverse((ch) => {
        if (ch.isMesh) ch.visible = group.visible;
      });
    }
    const sel = document.getElementById("travel-select");
    if (sel) {
      [...sel.options].forEach((o) => {
        if (o.dataset.hyp === "1") o.hidden = !enabled || !!straight;
      });
    }
    const tour = document.getElementById("tour-select");
    if (tour) {
      [...tour.options].forEach((o) => {
        if (o.value === "hypothetics") o.hidden = !enabled || !!straight;
      });
    }
  }

  function setEnabled(on) {
    enabled = !!on;
    savePref(enabled);
    if (enabled) place(); // always rebuild so meshes never go stale
    applyVis();
    const btn = document.getElementById("btn-hypothetics");
    if (btn) {
      btn.classList.toggle("active", enabled);
      btn.setAttribute("aria-pressed", enabled ? "true" : "false");
    }
    if (enabled && window.VesperMessages) {
      window.VesperMessages.show("Hyp on · labeled fiction. Sol stays. Sol button hides the fiction.", 4200);
    }
    window.dispatchEvent(new CustomEvent("vesper:hypothetics", { detail: { on: enabled } }));
  }

  function ensureBtn() {
    const actions =
      document.querySelector("#hud-secondary .secondary-actions") ||
      document.querySelector(".secondary-actions") ||
      document.querySelector(".row.actions");
    if (!actions || document.getElementById("btn-hypothetics")) return;
    const b = document.createElement("button");
    b.type = "button";
    b.className = "btn";
    b.id = "btn-hypothetics";
    b.title = "Hypothetics — speculative Sol secrets (fiction)";
    b.textContent = "Hyp";
    b.setAttribute("aria-pressed", "false");
    actions.appendChild(b);
    b.addEventListener("click", () => setEnabled(!enabled));
  }

  function init() {
    ensureBtn();
    enabled = loadPref();
    if (enabled) place();
    applyVis();
    // The button is born unpressed. The saved pref can already be on,
    // so the first tap turned fiction off while the button looked off.
    const btn = document.getElementById("btn-hypothetics");
    if (btn) {
      btn.classList.toggle("active", enabled);
      btn.setAttribute("aria-pressed", enabled ? "true" : "false");
    }
    window.VesperHypothetics = {
      setEnabled,
      enabled: () => enabled,
      names: () => DEFS.map((d) => d.name),
      defs: DEFS,
      rebuild: () => {
        if (enabled) place();
      },
    };
  }

  window.addEventListener("vesper:ready", () => setTimeout(init, 120));
  window.addEventListener("vesper:straight", applyVis);
  if (window.VesperSky && window.VesperSky.version) setTimeout(init, 160);
})();
