/**
 * Vesper — Evening Planetarium
 * Textured solar system + 6DOF free flight (FLOAT / PILOT feel).
 * Three.js r160 (vendored). Solar System Scope textures (CC BY 4.0).
 *
 * SCALE (Stellaris-like readable, not pure 1:1 AU):
 *   Real orbital radius ratios are preserved.
 *   AU_UNIT = scene units per astronomical unit (Earth orbit = 1 AU).
 *   Body radii use scientific ratios to Earth, then SIZE_BOOST so planets stay
 *   visible at playable distances (true 1:1 AU makes planets invisible dots).
 *   Documented factor: DISTANCE compress ≈ real AU × AU_UNIT;
 *   SIZE_BOOST ≈ 18× vs true angular size at these compressed distances.
 */
(function () {
  "use strict";


  // Unlit stand-in for MeshStandardMaterial. Same bake as toUnlit
  // (emissive lerped into color) so a pad never compiles a lit shader.
  // No lights, no PMREM. iPhone 11 stays on MeshBasicMaterial.
  function VesperMat(opts) {
    opts = opts || {};
    const base = new THREE.Color(opts.color != null ? opts.color : 0xffffff);
    const em = new THREE.Color(opts.emissive != null ? opts.emissive : 0x000000);
    let ei = opts.emissiveIntensity || 0;
    const basic = new THREE.MeshBasicMaterial({
      color: base.clone(),
      map: opts.map || null,
      alphaMap: opts.alphaMap || null,
      transparent: !!opts.transparent,
      opacity: opts.opacity != null ? opts.opacity : 1,
      side: opts.side != null ? opts.side : THREE.FrontSide,
      depthWrite: opts.depthWrite !== false,
      depthTest: opts.depthTest !== false,
      polygonOffset: !!opts.polygonOffset,
      polygonOffsetFactor: opts.polygonOffsetFactor || 0,
      polygonOffsetUnits: opts.polygonOffsetUnits || 0,
      vertexColors: !!opts.vertexColors,
      fog: opts.fog !== false,
      wireframe: !!opts.wireframe,
    });
    if (opts.blending != null) basic.blending = opts.blending;
    if (opts.name) basic.name = opts.name;
    basic.userData._vesperUnlit = 1;
    function rebake() {
      // Prototype copy: basic.color.copy is wrapped and would recurse.
      THREE.Color.prototype.copy.call(basic.color, base);
      if (ei > 0.05 && em.r + em.g + em.b > 0.02) {
        THREE.Color.prototype.lerp.call(basic.color, em, Math.min(0.85, ei));
      }
    }
    function wrapColor(col) {
      col.set = function (v) { base.set(v); rebake(); return this; };
      col.setHex = function (hex) { base.setHex(hex); rebake(); return this; };
      col.copy = function (v) { base.copy(v); rebake(); return this; };
    }
    function wrapEm(col) {
      col.set = function (v) { THREE.Color.prototype.set.call(this, v); rebake(); return this; };
      col.setHex = function (hex) { THREE.Color.prototype.setHex.call(this, hex); rebake(); return this; };
      col.copy = function (v) { THREE.Color.prototype.copy.call(this, v); rebake(); return this; };
    }
    wrapColor(basic.color);
    wrapEm(em);
    rebake();
    // Getter stays undefined. three's basic-material refresh does
    // `material.emissive && uniforms.emissive.value`, and MeshBasic has no
    // emissive uniform. The setter still bakes the glow into the color.
    Object.defineProperty(basic, "emissive", {
      configurable: true,
      enumerable: false,
      get: function () { return undefined; },
      set: function (v) { em.set(v); },
    });
    Object.defineProperty(basic, "emissiveIntensity", {
      configurable: true,
      enumerable: true,
      get: function () { return ei; },
      set: function (v) { ei = +v || 0; rebake(); },
    });
    basic.clone = function () {
      return VesperMat({
        color: "#" + base.getHexString(),
        map: basic.map,
        alphaMap: basic.alphaMap,
        transparent: basic.transparent,
        opacity: basic.opacity,
        side: basic.side,
        depthWrite: basic.depthWrite,
        depthTest: basic.depthTest,
        polygonOffset: basic.polygonOffset,
        polygonOffsetFactor: basic.polygonOffsetFactor,
        polygonOffsetUnits: basic.polygonOffsetUnits,
        vertexColors: basic.vertexColors,
        fog: basic.fog,
        blending: basic.blending,
        wireframe: basic.wireframe,
        name: basic.name,
        emissive: "#" + em.getHexString(),
        emissiveIntensity: ei,
      });
    };
    return basic;
  }
  function VesperNoLight(color, intensity, distance, decay) {
    const o = new THREE.Object3D();
    o.name = "vesper-no-light";
    o.color = new THREE.Color(color != null ? color : 0xffffff);
    o.groundColor = new THREE.Color(0x000000);
    o.intensity = intensity || 0;
    o.distance = distance || 0;
    o.decay = decay == null ? 2 : decay;
    return o;
  }
  window.VesperMat = VesperMat;
  window.VesperNoLight = VesperNoLight;


  const $ = (sel) => document.querySelector(sel);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;
  const LOW_END =
    reduceMotion ||
    isTouch ||
    (typeof navigator !== "undefined" &&
      ((navigator.deviceMemory && navigator.deviceMemory <= 4) ||
        (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4)));
  // Quality tier: auto | high | ultra (ultra = max segs/aniso/nebula; mobile clamps)
  const LS_QUALITY = "vesper.quality";
  function loadQualityTier() {
    try {
      const v = localStorage.getItem(LS_QUALITY);
      if (v === "high" || v === "ultra" || v === "auto") return v;
    } catch (_) {}
    return "auto";
  }
  let qualityTier = loadQualityTier();
  // Touch phones: thrifty caps (lag fix) — desktop keeps richer belts
  const TOUCH_THRIFT = !!(typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches);
  const PERF = {
    low: qualityTier === "ultra" ? false : qualityTier === "high" ? false : (LOW_END || TOUCH_THRIFT),
    // Belt / Trojans / Kuiper / Oort — cut for phone lag
    beltDust: (LOW_END || TOUCH_THRIFT) ? 180 : 900,
    beltRocks: (LOW_END || TOUCH_THRIFT) ? 90 : 520,
    beltLand: (LOW_END || TOUCH_THRIFT) ? 10 : 55,
    trojanDust: (LOW_END || TOUCH_THRIFT) ? 48 : 220,
    trojanRocks: (LOW_END || TOUCH_THRIFT) ? 28 : 120,
    trojanLand: (LOW_END || TOUCH_THRIFT) ? 3 : 12,
    kuiperDust: (LOW_END || TOUCH_THRIFT) ? 80 : 400,
    kuiperRocks: (LOW_END || TOUCH_THRIFT) ? 45 : 240,
    kuiperLand: (LOW_END || TOUCH_THRIFT) ? 6 : 28,
    oortDust: (LOW_END || TOUCH_THRIFT) ? 100 : 550,
    oortComets: (LOW_END || TOUCH_THRIFT) ? 24 : 90,
    nebula: (LOW_END || TOUCH_THRIFT) ? 3 : 9,
    pixelRatioMax: (LOW_END || TOUCH_THRIFT) ? 1.1 : 2,
    // Distance LOD (scene units) — moons/atmospheres/rocks cull
    lodNear: 900,
    lodMid: 9000,
    lodFar: 72000,
    lodMoonHide: 240000, // keep Moon/Galileans in the big Sol picture (was 5500 on phone)
    lodAtmoHide: (LOW_END || TOUCH_THRIFT) ? 6500 : 42000,
    bodySegHi: (LOW_END || TOUCH_THRIFT) ? 28 : qualityTier === "ultra" ? 96 : 80,
    bodySegLo: (LOW_END || TOUCH_THRIFT) ? 16 : 36,
  };



  const TEX = "assets/textures/";
  const QUALITY = {
    tier: "2k",
    note: "Default 2K. Ultra 8K from solarsystemscope.com/textures (CC BY 4.0).",
  };

  // --- Playable celestial scale (vast — displayMul 100 vs v31) -------------
  // Orbital ratios ≈ real AU. Radii readable (not true angular size).
  // v51 was displayMul 10 (AU_UNIT 400). This pass ≈ ×10 again → ×100 vs v31.
  // Gears / soft / camera retuned so Travel + TRANSIT stay usable.
  // Sources: NASA/JPL planetary fact sheets (AU, Rm/Re), IAU dwarf definitions.
  // Distance kept at ×40 vs v51 (AU_UNIT 16000). Presence = TINY avatar, not bigger planets.
  // User mid-pass: do not keep scaling world up — shrink eye/near/walk instead.
  const DISPLAY_MUL = 400; // ×40 vs v51 AU (vast orbits); avatar scale handles "planetary huge"
  const AU_UNIT = 40 * DISPLAY_MUL; // 16000 scene units per AU
  const EARTH_R = 520; // v160+ presence — Mass Effect–like cruise read; AU spacing unchanged
  const SIZE_BOOST = EARTH_R;
  const DIST_MUL = AU_UNIT / 400; // 40 vs v51
  const SPEED_MUL = DIST_MUL;
  const SOFT_MUL = Math.sqrt(DIST_MUL); // ~6.3
  /** Human-scale eye height (Outer Wilds–like tiny presence on big worlds). */
  const PERSON_EYE = 0.16; // tinier avatar → worlds feel planetary on soft-land walk
  const SCALE_DOC = {
    auUnit: AU_UNIT,
    earthR: EARTH_R,
    physicsNote:
      "Orbital radius ratios ≈ real AU; body radii display-boosted for readability (not true angular size). Soft-land is playable, not geodetic. Starman Roadster is a labeled educational replica of the 2018 Falcon Heavy demo payload trajectory (heliocentric).",
    textureNote: "2K Solar System Scope maps + up to 1536–4096 procedural (desktop Ultra 8K-class); mip/aniso; mobile LOD lowers canvas.",
    sizeBoost: SIZE_BOOST,
    displayMul: DISPLAY_MUL,
    distMul: DIST_MUL,
    speedMul: SPEED_MUL,
    softMul: SOFT_MUL,
    // Playable Sun — must stay inside Mercury (0.387 AU) with skim room
    sunR: 980, // scales with EARTH_R presence; still << Mercury orbit
    realSunEarthRadii: 109.2,
    note:
      "SCALE MODEL v160: orbits unchanged (1 AU = " +
      AU_UNIT +
      " u). Body radii boosted for cruise presence; PERSON_EYE shrunk for planetary walk. " +
      "Soft pads ×sqrt(DIST). Cite: NASA Planetary Fact Sheet.",
  };

  function orbitAU(au) {
    return au * AU_UNIT;
  }
  function bodyR(earthRadii, mul) {
    return earthRadii * EARTH_R * (mul != null ? mul : 1);
  }

  // Free-flight speed authority: FLOAT/PILOT feel × cruise gears × hold-boost curve
  const MODES = {
    float: {
      label: "FLOAT",
      thrust: 10 * SPEED_MUL,
      boostMul: 1.7,
      damp: 3.4,
      lookSens: 0.00135,
      autoDrift: 0.08,
      maxSpeed: 18 * SPEED_MUL,
      exposureBias: 0.04,
      accelSmooth: 4.2,
    },
    pilot: {
      label: "PILOT",
      thrust: 36 * SPEED_MUL,
      boostMul: 2.2,
      damp: 1.15,
      lookSens: 0.00225,
      autoDrift: 0,
      maxSpeed: 52 * SPEED_MUL,
      exposureBias: 0.12,
      accelSmooth: 7.5,
    },
  };

  /** Cruise gears — variable thrust authority (variable speed bands). */
  const GEARS = [
    { id: "dock", label: "DOCK", mul: 0.16, maxMul: 0.12, hint: "Dock / inspect — fine control" },
    { id: "cruise", label: "CRUISE", mul: 0.38, maxMul: 0.34, hint: "Leisure cruise — slow enough to read a planet" },
    { id: "burn", label: "BURN", mul: 1.15, maxMul: 1.2, hint: "Hard burn — system hops" },
    { id: "transit", label: "TRANSIT", mul: 4.2, maxMul: 4.8, hint: "Transit — hold boost for AU hops" },
  ];
  const LS_GEAR = "vesper.gear";
  const LS_STRAIGHT = "vesper.straightMan";
  const LS_BUILD = "vesper.buildScene";
  const LS_HIDE = "vesper.hideControls";

  function loadGearIndex() {
    try {
      const v = localStorage.getItem(LS_GEAR);
      const i = parseInt(v, 10);
      if (Number.isFinite(i) && i >= 0 && i < GEARS.length) return i;
    } catch (_) {}
    return 1; // cruise
  }

  // Soft surface — TIGHT influence (wide influence = molasses wall)
  const SOFT = {
    influenceFrac: 0.42,
    sunInfluenceFrac: 0.16,
    influencePad: 8 * SOFT_MUL,
    hoverFrac: 0.038, // close soft pad — planet fills frame
    hoverMin: PERSON_EYE * 2.2,
    hoverFloorFrac: 0.09,
    hoverAbsMin: PERSON_EYE * 1.4,
    approachBandMul: 1.7,
    inwardKill: 0.92,
    skimDrag: 0.16,
    surfaceThrustFloat: 0.9,
    surfaceThrustPilot: 0.97,
    surfaceMaxSpeedMul: 0.72,
  };

  /** Outer Wilds–like surface walk when soft-landed (not on Sun). */
  const WALK = {
    // Tiny avatar: eye ~PERSON_EYE on big worlds; fraction cap on small rocks
    eyeFrac: 0.00115,
    eyeMin: 0.08,
    eyeMax: PERSON_EYE,
    enterSpeed: 28 * SOFT_MUL, // forgiving soft-land (mobile)
    enterAltMul: 0.55, // legacy; enter uses eyeH*mul below
    enterEyeMul: 12, // forgiving plant band — was 3.2 (nearly impossible on big worlds)
    exitAltMul: 3.5,
    walkAccel: PERSON_EYE * 48, // human stride on huge worlds
    walkMax: PERSON_EYE * 28,
    walkDamp: 8.5,
    // Impulse scaled in takeoffLeave() by body radius — PERSON_EYE*110 was << EARTH_R
    takeoffImpulse: PERSON_EYE * 110,
    takeoffRadiusFrac: 0.48, // eject ~48% of R — clears soft plant + atmo shells
    takeoffCooldownMs: 3200, // block re-enter walk after leave
    takeoffVert: 0.10, // clearer mobile thrust-up leave (less fighting deadzone)
    sunWalk: false,
    // Camera: bias up toward surface normal while walking
    alignUp: true,
    fogWalk: 0.000035,
    settleLerp: 14, // soft plant → walk height blend rate
    leaveBlendMs: 420, // brief FOV/up ease after leave
  };

  /** Hover standoff — floor scales with body radius (moons stay skimable). */
  function bodyHover(radius) {
    const fromFrac = radius * SOFT.hoverFrac;
    const floor = Math.min(
      SOFT.hoverMin,
      Math.max(SOFT.hoverAbsMin, radius * SOFT.hoverFloorFrac)
    );
    return Math.max(floor, fromFrac);
  }

  // Celestial clock — orbits/rotations only (flight uses wall-clock dt)
  const CLOCK_MODES = {
    paused: {
      label: "PAUSED",
      short: "⏸",
      orbitScale: 0,
      key: "0",
      hint: "Orbits frozen — you still fly",
    },
    realtime: {
      label: "REAL",
      short: "REAL",
      orbitScale: 0.12,
      key: "3",
      hint: "Slow crawl — a day takes most of a minute",
    },
    cruise: {
      label: "CRUISE",
      short: "CRUISE",
      orbitScale: 1.0,
      key: "4",
      hint: "One Earth day ≈ 6s. Moon lap ≈ 27 of those.",
    },
    fast: {
      label: "FAST",
      short: "FAST",
      orbitScale: 4,
      key: "5",
      hint: "Days rush by — still slower than the old clock",
    },
    cinematic: {
      label: "CINE",
      short: "CINE",
      orbitScale: 12,
      key: "6",
      hint: "Dramatic orbital sweep",
    },
  };

  // Wall seconds per Earth sidereal day when orbitScale is 1 (CRUISE).
  const SIM_DAY = 6;
  const ROT_DAYS = {
    Mercury: 58.65, Venus: -243.02, Earth: 0.997, Mars: 1.026,
    Jupiter: 0.414, Saturn: 0.444, Uranus: -0.718, Neptune: 0.671,
    Pluto: -6.387, Ceres: 0.378, Vesta: 0.223, Pallas: 0.326,
    Haumea: 0.163, Makemake: 0.95, Eris: 1.08, Quaoar: 0.37,
  };
  // Sidereal days. Negative = retrograde. Phoebe's 550 d orbit is retrograde.
  // Hyperion is chaotic (not locked, not 24h).
  const MOON_PERIOD_D = {
    Moon: 27.322, Phobos: 0.319, Deimos: 1.263,
    Amalthea: 0.498, Io: 1.769, Europa: 3.551, Ganymede: 7.155, Callisto: 16.69, Himalia: 250.6,
    Janus: 0.695, Epimetheus: 0.694, Mimas: 0.942, Enceladus: 1.370, Tethys: 1.888,
    Dione: 2.737, Rhea: 4.518, Titan: 15.945, Hyperion: 21.28, Iapetus: 79.32, Phoebe: -550.5,
    Miranda: 1.413, Ariel: 2.520, Umbriel: 4.144, Titania: 8.706, Oberon: 13.46,
    Larissa: 0.555, Proteus: 1.122, Triton: -5.877, Nereid: 360.1,
    Charon: 6.387, Nix: 24.856, "Hiʻiaka": 49.1, Namaka: 18.3, Dysnomia: 15.8, Weywot: 12.4,
  };
  const MOON_CHAOTIC = { Hyperion: true, Nix: true }; // Nix ~43.9 h retrograde, chaotic — not the 24.9 d orbit
  // Irregulars. A locked spin would keep one face toward the parent for a
  // 250–550 d orbit. These spin in hours (Phoebe 9.27365 h, Himalia 7.7819 h, Nereid 11.594 h).
  const MOON_FREE_SPIN_H = { Phoebe: 9.27365, Himalia: 7.7819, Nereid: 11.594 };

  const input = window.VesperInput;
  if (!input) throw new Error("The input table did not load.");
  const controlMap = () => ({ desktop: input.list(),
    mouse: "Click sky to fly; Esc returns cursor. Drag remains available.",
    mobile: "Left stick moves; sky drag looks; thruster pads lift; hold boost." });


  // --- Lazy-river (FLOAT idle autopilot) ---------------------------------
  // Dozens–hundred gentle randomized patterns. User input interrupts; resumes after idle.
  // prefers-reduced-motion disables river entirely.
  const RIVER_IDLE_MS = 3400;
  const RIVER_BLEND = 0.38; // gentler mix — evening pace
  const RIVER_SPEED = 0.42; // scales pattern fwd/strafe/lift

  function buildRiverPatterns() {
    const packs = [];
    const push = (id, name, pack, dur, fn) => {
      packs.push({ id, name, pack, dur, fn });
    };
    // Seeded-ish variety via parameter grids (deterministic list, runtime picks)
    const drifts = [0.35, 0.55, 0.75, 0.95, 1.15];
    const yaws = [0.04, 0.07, 0.1, -0.04, -0.08, 0.12];
    const lifts = [0.15, 0.28, -0.12, -0.22, 0.05, 0.4];
    const periods = [7, 9, 11, 14, 18, 22];

    // Pack A — forward lazy drifts (~36)
    let n = 0;
    drifts.slice(0, 4).forEach((d, di) => {
      yaws.slice(0, 3).forEach((y, yi) => {
        periods.slice(0, 3).forEach((p, pi) => {
          n++;
          const id = "A" + n;
          push(id, "Drift " + id, "drifts", 8 + (di + pi) * 1.2, (t, ctx) => {
            const w = Math.sin(t * ((Math.PI * 2) / p));
            return {
              fwd: d * (0.75 + 0.25 * Math.sin(t * 0.4)),
              strafe: y * 2.2 * w,
              lift: lifts[yi % lifts.length] * 0.35 * Math.sin(t * 0.55),
              yawRate: y * 0.55,
              pitchRate: 0.01 * Math.sin(t * 0.3),
            };
          });
        });
      });
    });

    // Pack B — gentle arcs / banking curves
    n = 0;
    for (let a = 0; a < 18; a++) {
      n++;
      const sign = a % 2 === 0 ? 1 : -1;
      const rad = 0.45 + (a % 6) * 0.08;
      const dur = 10 + (a % 5) * 1.5;
      push("B" + n, "Arc " + (a + 1), "arcs", dur, (t, ctx) => {
        const u = t / dur;
        return {
          fwd: rad,
          strafe: sign * 0.55 * Math.sin(u * Math.PI),
          lift: 0.12 * Math.sin(u * Math.PI * 2),
          yawRate: sign * (0.06 + 0.04 * Math.sin(u * Math.PI)),
          pitchRate: 0.015 * Math.cos(u * Math.PI),
        };
      });
    }

    // Pack C — helices / corkscrews (gentle)
    n = 0;
    for (let h = 0; h < 16; h++) {
      n++;
      const spir = 0.5 + (h % 4) * 0.12;
      const climb = ((h % 5) - 2) * 0.08;
      const per = 9 + (h % 6);
      push("C" + n, "Helix " + (h + 1), "helices", 12 + (h % 4), (t) => {
        const ang = (t / per) * Math.PI * 2;
        return {
          fwd: spir * 0.7,
          strafe: Math.cos(ang) * 0.45,
          lift: climb + Math.sin(ang) * 0.28,
          yawRate: 0.05 * Math.sin(ang * 0.5),
          pitchRate: 0.02 * Math.cos(ang),
        };
      });
    }

    // Pack D — rise-and-settle / porpoise
    n = 0;
    for (let p = 0; p < 14; p++) {
      n++;
      const amp = 0.25 + (p % 5) * 0.07;
      const per = 8 + (p % 6) * 1.4;
      push("D" + n, "Porpoise " + (p + 1), "porpoise", per * 1.1, (t) => {
        const s = Math.sin((t / per) * Math.PI * 2);
        return {
          fwd: 0.4 + 0.15 * Math.abs(s),
          strafe: ((p % 3) - 1) * 0.12 * s,
          lift: amp * s,
          yawRate: 0.02 * s,
          pitchRate: 0.04 * Math.cos((t / per) * Math.PI * 2),
        };
      });
    }

    // Pack E — figure-lean / weave
    n = 0;
    for (let w = 0; w < 14; w++) {
      n++;
      const per = 10 + (w % 5) * 1.6;
      push("E" + n, "Weave " + (w + 1), "weaves", per * 1.2, (t) => {
        const a = (t / per) * Math.PI * 2;
        return {
          fwd: 0.5,
          strafe: Math.sin(a) * 0.65,
          lift: Math.sin(a * 2) * 0.18,
          yawRate: Math.cos(a) * 0.07,
          pitchRate: Math.sin(a) * 0.02,
        };
      });
    }

    // Pack F — slow spin-look (yaw bias, soft hold)
    n = 0;
    for (let s = 0; s < 12; s++) {
      n++;
      const yaw = (s % 2 === 0 ? 1 : -1) * (0.035 + (s % 4) * 0.01);
      push("F" + n, "Gaze " + (s + 1), "gaze", 14 + (s % 3) * 2, (t) => {
        return {
          fwd: 0.22 + 0.1 * Math.sin(t * 0.25),
          strafe: 0.08 * Math.sin(t * 0.4),
          lift: 0.06 * Math.sin(t * 0.2),
          yawRate: yaw,
          pitchRate: 0.012 * Math.sin(t * 0.15 + s),
        };
      });
    }

    // Pack G — stillness breaths (almost hover, tiny motion — not permanent sink)
    n = 0;
    for (let b = 0; b < 10; b++) {
      n++;
      push("G" + n, "Breath " + (b + 1), "breath", 9 + b * 0.4, (t) => {
        const s = Math.sin(t * 0.35 + b);
        return {
          fwd: 0.08 + 0.05 * Math.abs(s),
          strafe: 0.06 * Math.cos(t * 0.3),
          lift: 0.1 * s, // oscillate — never constant negative sink
          yawRate: 0.015 * Math.sin(t * 0.2),
          pitchRate: 0.008 * s,
        };
      });
    }

    return packs;
  }

  const RIVER = {
    patterns: buildRiverPatterns(),
    idx: 0,
    t: 0,
    active: false,
    lastInputAt: 0,
    lastName: "",
    reduced: reduceMotion,
  };

  function markFlightInput() {
    RIVER.lastInputAt = performance.now();
    if (RIVER.active) {
      RIVER.active = false;
      syncRiverChip();
    }
  }

  function pickRiverPattern(preferPack) {
    const list = RIVER.patterns;
    if (!list.length) return null;
    // Prefer unused-ish: advance with light randomness
    let idx;
    if (preferPack) {
      const pool = [];
      for (let i = 0; i < list.length; i++) if (list[i].pack === preferPack) pool.push(i);
      idx = pool.length ? pool[(Math.random() * pool.length) | 0] : (Math.random() * list.length) | 0;
    } else {
      idx = (RIVER.idx + 1 + ((Math.random() * 5) | 0)) % list.length;
    }
    RIVER.idx = idx;
    RIVER.t = 0;
    RIVER.lastName = list[idx].name;
    return list[idx];
  }

  function syncRiverChip() {
    const chip = $("#river-chip");
    if (!chip) return;
    const show = state.mode === "float" && !RIVER.reduced;
    chip.hidden = !show;
    if (!show) {
      chip.classList.remove("river-live");
      return;
    }
    if (RIVER.active) {
      chip.textContent = "River · " + (RIVER.lastName || "…");
      chip.classList.add("river-live");
      chip.title = "Lazy-river pattern (FLOAT idle)";
    } else {
      chip.textContent = "River · idle";
      chip.classList.remove("river-live");
      chip.title = "FLOAT on — river resumes after idle";
    }
  }

  function riverSample(dt) {
    if (RIVER.reduced || state.mode !== "float" || state.paused) {
      RIVER.active = false;
      return null;
    }
    // Live holds count as input even if markFlightInput wasn't refreshed
    const liveInput =
      Math.hypot(flight.stickRaw.x, flight.stickRaw.y) > 0.04 ||
      Math.abs(flight.vertRaw) > 0.04 ||
      state.boost ||
      flight.dragging ||
      input.anyHeld() || Math.hypot(padFrame.move.x, padFrame.move.y) > 0.04;
    if (liveInput) {
      RIVER.lastInputAt = performance.now();
      RIVER.active = false;
      return null;
    }
    const now = performance.now();
    if (!RIVER.lastInputAt) RIVER.lastInputAt = now;
    const idle = now - RIVER.lastInputAt > RIVER_IDLE_MS;
    if (!idle) {
      RIVER.active = false;
      return null;
    }
    let pat = RIVER.patterns[RIVER.idx];
    if (!RIVER.active || !pat) {
      pat = pickRiverPattern();
      RIVER.active = !!pat;
      if (pat) {
        guideToast("River · " + pat.name, 1600);
        syncRiverChip();
      }
    }
    if (!pat) return null;
    RIVER.t += dt;
    if (RIVER.t > pat.dur) {
      pat = pickRiverPattern();
      if (pat) {
        guideToast("River · " + pat.name, 1400);
        syncRiverChip();
      }
    }
    if (!pat) return null;
    const s = pat.fn(RIVER.t, { mode: state.mode });
    // Hard safety: never allow sustained sink-only (lift floor when very negative for long)
    if (s && s.lift < -0.55) s.lift = -0.55;
    return s;
  }


  const LS_CLOCK = "vesper.clockMode";
  const LS_FLIGHT = "vesper.flightMode";
  const LS_PRODUCT = "vesper.productMode";
  function loadLSMode(key, fallback, allowed) {
    try {
      const v = localStorage.getItem(key);
      if (v && allowed.indexOf(v) >= 0) return v;
    } catch (_) {}
    return fallback;
  }
  const state = {
    paused: false,
    hideControls: false,
    modeSwitchGrace: 0,
    windDown: reduceMotion ? 0.15 : 0.45,
    timeScale: 1,
    clockMode: loadLSMode(LS_CLOCK, reduceMotion ? "realtime" : "cruise", [
      "paused",
      "realtime",
      "cruise",
      "fast",
      "cinematic",
    ]),
    mode: loadLSMode(LS_FLIGHT, "float", ["float", "pilot"]),
    product: loadLSMode(LS_PRODUCT, "learn", ["learn", "live"]),
    gearIndex: loadGearIndex(),
    straightMan: (function () {
      try {
        return localStorage.getItem(LS_STRAIGHT) === "1";
      } catch (_) {
        return false;
      }
    })(),
    buildMode: false,
    ready: false,
    boost: false,
    boostHold: 0, // seconds held — curve
    lookingAt: null,
    nearSurface: null,
  };

  const loaderBar = $("#loader-bar-fill");
  const loader = $("#loader");
  const setProgress = (p) => {
    if (loaderBar) loaderBar.style.width = Math.round(window.VesperOpening.progress(p) * 100) + "%";
  };
  setProgress(0.05);

  // --- Renderer / scene -------------------------------------------------
  const wrap = $("#canvas-wrap");
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
    antialias: !isTouch,
    alpha: false,
    powerPreference: "high-performance",
    // Huge AU scale + tiny walk near → absurd far/near; log depth kills planet z-slice/jagging
    logarithmicDepthBuffer: true,
  });
  } catch (_) {
    window.__vesperWebglFailure = true;
    window.__vesperOpeningState = window.VesperOpening ? window.VesperOpening.transition("loading", "failure") : "failed";
    const sentence = "Your browser could not start 3D graphics. Turn on hardware acceleration, or try Chrome, Edge or Firefox.";
    const text = document.querySelector(".loader-sub");
    if (text) text.textContent = sentence;
    if (loaderBar) { loaderBar.style.animation = "none"; loaderBar.style.width = "0"; }
    if (loader) loader.classList.add("graphics-failed");
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, (PERF && PERF.pixelRatioMax) || (isTouch ? 1.1 : 2)));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = (typeof PERF !== "undefined" && PERF.low) ? 1.28 : 1.42;
  wrap.appendChild(renderer.domElement);
  setProgress(0.12);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050714);
  renderer.setClearColor(0x050714, 1);
  // Very light fog so distant planets stay lit; was crushing exposure
  scene.fog = new THREE.FogExp2(0x040510, 0.0000045 / SPEED_MUL); // very light — planet halos must read

  // 2026 phone WebGL: shared PBR env (PMREM) — metal read without desktop IBL packs.
  // Coarse/iPhone: cheaper fromScene; one cubemap. Draw thrift stays in PERF/TOUCH_THRIFT.
  function ensureMobileEnvMap() {
    // PMREM was a first-open hitch on iPhone 11 and only fed Standard
    // materials. Bodies are unlit. Do not build an environment map.
    try {
      if (scene && scene.environment) {
        const tex = scene.environment;
        scene.environment = null;
        if (tex && tex.dispose) tex.dispose();
      }
    } catch (e) {
      console.warn("vesper envMap", e);
    }
  }
  // Defer PMREM until after first paint — avoids iPhone 11 first-open hitch/void
  window.__vesperEnsureEnv = ensureMobileEnvMap;

  const camera = new THREE.PerspectiveCamera(
    58,
    window.innerWidth / window.innerHeight,
    0.05, // walk eye; updateCameraClip widens near when cruising (precision)
    120000 * SPEED_MUL
  );
  camera.userData.baseFov = 58;
  camera.userData.walkFov = 64; // mild widen — less FOV punch on plant

  // Playable Sun — not 109× Earth; large enough to feel massive when close
  const SUN_R = SCALE_DOC.sunR;
  // Earth initial angle matches reset indexing (Mercury=0 … Earth=2 of 8)
  const EARTH_HOME_ANGLE = (2 / 8) * Math.PI * 2 + 0.55;
  // Postcard spawn: between Earth and Sun, elevated, looking at Earth
  const HOME = (function () {
    const er = orbitAU(1.0);
    const ex = Math.cos(EARTH_HOME_ANGLE) * er;
    const ez = Math.sin(EARTH_HOME_ANGLE) * er;
    const radial = new THREE.Vector3(ex, 0, ez).normalize();
    // Sit sunward of Earth (~7 Earth radii in) + lift for horizon read
    return new THREE.Vector3(ex, EARTH_R * 2.2, ez).addScaledVector(radial, -EARTH_R * 4.6);
  })();
  const HOME_LOOK = (function () {
    const er = orbitAU(1.0);
    return new THREE.Vector3(
      Math.cos(EARTH_HOME_ANGLE) * er,
      EARTH_R * 0.2,
      Math.sin(EARTH_HOME_ANGLE) * er
    );
  })();

  // Bright lighting so MeshStandard planets read clearly (was near-black)
  // Bodies and pads are MeshBasic. These used to be real lights and the
  // unlit scrub deleted them. Keep the handles so intensity writes no-op.
  const ambient = VesperNoLight(0x243044, 0.18);
  scene.add(ambient);
  const hemi = VesperNoLight(0xd8e0f4, 0.14);
  hemi.groundColor.setHex(0x0e1018);
  scene.add(hemi);
  const sunLight = VesperNoLight(0xffe8d0, 22);
  sunLight.name = "vesperSunLight";
  sunLight.position.set(0, 0, 0);
  scene.add(sunLight);
  const fill = VesperNoLight(0x8aa0ff, 0.1);
  fill.position.set(-80, 50, -40);
  scene.add(fill);
  const rim = VesperNoLight(0xffd0b0, 0.06);
  rim.position.set(60, -20, 80);
  scene.add(rim);
  setProgress(0.18);

  // --- Texture loading --------------------------------------------------
  const texLoader = new THREE.TextureLoader();
  function loadTex(name, opts) {
    return new Promise((resolve) => {
      texLoader.load(
        TEX + name,
        (t) => {
          t.colorSpace = THREE.SRGBColorSpace;
          t.anisotropy = Math.min(qualityTier === "ultra" ? 16 : 8, renderer.capabilities.getMaxAnisotropy() || 8);
          t.generateMipmaps = true;
          t.minFilter = THREE.LinearMipmapLinearFilter;
          t.magFilter = THREE.LinearFilter;
          if (opts && opts.wrap) {
            t.wrapS = t.wrapT = THREE.RepeatWrapping;
          }
          resolve(t);
        },
        undefined,
        () => resolve(null)
      );
    });
  }

  function makeGradientTexture(stops, size) {
    size = size || 256;
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const g = c.getContext("2d");
    const grd = g.createRadialGradient(size * 0.5, size * 0.5, 0, size * 0.5, size * 0.5, size * 0.5);
    stops.forEach(([t, col]) => grd.addColorStop(t, col));
    g.fillStyle = grd;
    g.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  function makeStarField(count) {
    const skyR = Math.max(orbitAU(95), 72000);
    if (window.VesperDeepSky && window.VesperDeepSky.makeStarField) {
      return window.VesperDeepSky.makeStarField(THREE, count, skyR);
    }
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = skyR * (0.55 + Math.random() * 0.4);
      const theta = Math.random() * Math.PI * 2;
      const band = Math.random() < 0.62;
      const phi = band
        ? Math.PI * 0.5 + (Math.random() - 0.5) * 0.48
        : Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.cos(phi);
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      const temp = Math.random();
      const bright = 0.55 + Math.random() * 0.45;
      const R = temp < 0.25 ? 0.7 : temp < 0.7 ? 0.95 : 1.0;
      const G = temp < 0.25 ? 0.82 : temp < 0.7 ? 0.95 : 0.8;
      const B = temp < 0.25 ? 1.0 : temp < 0.7 ? 1.0 : 0.55;
      col[i * 3] = R * bright;
      col[i * 3 + 1] = G * bright;
      col[i * 3 + 2] = B * bright;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        size: 1.65,
        vertexColors: true,
        transparent: true,
        opacity: 1,
        depthWrite: false,
        sizeAttenuation: false,
        fog: false,
        toneMapped: false,
        blending: THREE.AdditiveBlending,
      })
    );
  }

  /** Distant dust Points (cheap LOD backdrop). */
  function faintRingMap() {
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 8;
    const g = c.getContext("2d");
    const bands = ["#14181e", "#7a8490", "#2a3038", "#a8b0b8", "#0c1014", "#5c666e", "#3a444c", "#c8d0d8"];
    const bw = c.width / bands.length;
    for (let i = 0; i < bands.length; i++) {
      g.fillStyle = bands[i];
      g.fillRect(i * bw, 0, bw + 1, c.height);
    }
    const tex = new THREE.CanvasTexture(c);
    if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  }

  function makeDustBelt(innerAU, outerAU, count, ySpread, size) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const inner = orbitAU(innerAU);
    const outer = orbitAU(outerAU);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = inner + Math.random() * (outer - inner);
      const y = (Math.random() - 0.5) * (ySpread || 4);
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = Math.sin(a) * r;
      const g = 0.4 + Math.random() * 0.35;
      col[i * 3] = g * 1.02;
      col[i * 3 + 1] = g * 0.92;
      col[i * 3 + 2] = g * 0.82;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        size: size != null ? size : 1.1,
        vertexColors: true,
        transparent: true,
        opacity: 0.38,
        depthWrite: false,
        sizeAttenuation: true,
        // Soft dust only — rocks are InstancedMesh (avoid glowing square look)
        map: null,
      })
    );
  }

  /** Instanced rock meshes — landable rocks, not glowing white squares. */
  function makeRockField(innerAU, outerAU, count, ySpread, opts) {
    opts = opts || {};
    const group = new THREE.Group();
    group.name = opts.name || "rockField";
    const rockGeo = new THREE.DodecahedronGeometry(1, 0);
    // Slight irregularity via non-uniform scale per instance
    // One unlit sampler. Standard rocks never showed on the phone, same as the bodies.
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      vertexColors: true,
      fog: false,
      toneMapped: false,
    });
    const mesh = new THREE.InstancedMesh(rockGeo, mat, count);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = true;
    if (mesh.instanceColor === null && THREE.Color) {
      try { mesh.instanceColor = null; } catch (_) {}
    }
    const _rockCol = new THREE.Color();
    const useInstanceColor = typeof mesh.setColorAt === "function";
    const inner = orbitAU(innerAU);
    const outer = orbitAU(outerAU);
    const dummy = new THREE.Object3D();
    const landables = [];
    const landCount = opts.landables != null ? opts.landables : Math.min(48, Math.floor(count * 0.08));
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = inner + Math.random() * (outer - inner);
      const y = (Math.random() - 0.5) * (ySpread || 40);
      const sBase = (opts.minS || 4) + Math.random() * (opts.maxS || 18);
      const s = sBase * Math.max(1, SOFT_MUL * 0.85);
      dummy.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
      dummy.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
      dummy.scale.set(
        s * (0.7 + Math.random() * 0.6),
        s * (0.55 + Math.random() * 0.7),
        s * (0.65 + Math.random() * 0.55)
      );
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      if (useInstanceColor) {
        // Muted stone variety — basalt / anorthosite / dusty ochre (not candy)
        const t = Math.random();
        if (t < 0.34) _rockCol.setRGB(0.42 + Math.random() * 0.08, 0.38 + Math.random() * 0.06, 0.34);
        else if (t < 0.62) _rockCol.setRGB(0.48 + Math.random() * 0.1, 0.44, 0.4 + Math.random() * 0.06);
        else if (t < 0.82) _rockCol.setRGB(0.36, 0.34 + Math.random() * 0.06, 0.32);
        else _rockCol.setRGB(0.55 + Math.random() * 0.08, 0.5, 0.45);
        mesh.setColorAt(i, _rockCol);
      }
      if (i < landCount) {
        landables.push({
          x: dummy.position.x,
          y: dummy.position.y,
          z: dummy.position.z,
          r: Math.max(s * 0.55, 3.5),
          name: (opts.prefix || "Rock") + "-" + (i + 1),
        });
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (useInstanceColor && mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.userData.landables = landables;
    group.add(mesh);
    group.userData.instanced = mesh;
    group.userData.landables = landables;
    return group;
  }

  function makeAsteroidBelt(innerAU, outerAU, count, ySpread) {
    // Compatibility shim — prefer makeRockField + makeDustBelt in buildWorld
    return makeDustBelt(innerAU, outerAU, count, ySpread, 2.2);
  }

  function registerLandableRocks(list, parentGroup) {
    if (!list || !list.length) return;
    list.forEach((L) => {
      const g = new THREE.Group();
      g.name = L.name;
      g.position.set(L.x, L.y, L.z);
      // Invisible collision proxy (visual is InstancedMesh)
      const proxy = new THREE.Mesh(
        new THREE.SphereGeometry(L.r, 10, 8),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      g.add(proxy);
      if (parentGroup) parentGroup.add(g);
      else scene.add(g);
      bodies.push({
        name: L.name,
        group: g,
        mesh: proxy,
        def: { radius: L.r, orbit: 0, speed: 0, y: L.y },
        angle: 0,
        radius: L.r,
        isAsteroid: true,
        landable: true,
        walkable: true,
        fixed: true,
      });
    });
  }


  function cloudDeckMap(src) {
    try {
      const img = src && src.image;
      if (!img || !img.width) return src;
      const w = 1024;
      const h = 512;
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const g = c.getContext("2d", { willReadFrequently: true });
      g.drawImage(img, 0, 0, w, h);
      const data = g.getImageData(0, 0, w, h);
      const d = data.data;
      for (let i = 0; i < d.length; i += 4) {
        const l = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
        let u = (l - 32) / 118;
        if (u < 0) u = 0;
        else if (u > 1) u = 1;
        const a = u * u * (3 - 2 * u);
        d[i] = 236;
        d[i + 1] = 242;
        d[i + 2] = 248;
        d[i + 3] = (a * 220) | 0;
      }
      g.putImageData(data, 0, 0);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = src.anisotropy || 4;
      tex.needsUpdate = true;
      return tex;
    } catch (_) {
      return src;
    }
  }

  function atmosphere(radius, color, opacity) {
    // Multi-shell limb / Rayleigh-ish scatter / airglow — readable from cruise
    const g = new THREE.Group();
    const segs = PERF.low ? 28 : 56;
    const mk = (scale, op, side, toneMapped) => {
      const geo = new THREE.SphereGeometry(radius * scale, segs, Math.max(20, (segs * 0.7) | 0));
      const mat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: op,
        side: side != null ? side : THREE.BackSide,
        depthWrite: false,
        depthTest: true,
        blending: THREE.AdditiveBlending,
        fog: false,
        toneMapped: toneMapped === true,
        // No polygonOffset. Negative offset in log-depth pulls the BackSide
        // shell in front of the daymap, so the body reads as a flat color disk.
      });
      return new THREE.Mesh(geo, mat);
    };
    const base = Math.max(0.18, opacity || 0.34);
    // Tight bright limb (silhouette edge)
    g.add(mk(1.012, base * 0.95, THREE.BackSide));
    // Primary scatter shell
    g.add(mk(1.045, base * 0.7, THREE.BackSide));
    // Extended haze
    g.add(mk(1.1, base * 0.38, THREE.BackSide));
    // Far airglow / corona whisper
    g.add(mk(1.2, base * 0.18, THREE.BackSide));
    // No front-side disk. That shell painted over the daymap and read as a
    // blue/white wash with no surface. Limb stays on the BackSide shells.
    g.name = "atmosphere";
    g.userData.isAtmosphere = true;
    return g;
  }

  function makeOrbitPath(radius, color) {
    const pts = [];
    const segs = 192;
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.22,
    });
    return new THREE.LineLoop(geo, mat);
  }

  function makeRingMesh(inner, outer, map) {
    const geo = new THREE.RingGeometry(inner, outer, 128);
    const pos = geo.attributes.position;
    const uv = geo.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const r = Math.sqrt(x * x + y * y);
      const u = (r - inner) / (outer - inner);
      uv.setXY(i, u, 0.5);
    }
    uv.needsUpdate = true;
    const ringTex = usableMap(map) ? map : null;
    // One sampler. alphaMap plus map is a second bind, and the phone
    // showed a bare ring arc with no albedo.
    const mat = new THREE.MeshBasicMaterial({
      map: ringTex,
      color: ringTex ? 0xffffff : 0xc9b89a,
      transparent: true,
      opacity: ringTex ? 1 : 0.62,
      alphaTest: ringTex ? 0.04 : 0,
      side: THREE.DoubleSide,
      depthWrite: false,
      fog: false,
      toneMapped: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2.15;
    return mesh;
  }

  function markedAlbedo(hex, seed) {
    // Interim / no-photo albedo. One cheap canvas. Bands, patches, and
    // crater rims so a moon is not a single fill with a few dots.
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 256;
    const g = c.getContext("2d");
    const base = (hex >>> 0) & 0xffffff;
    const r0 = (base >> 16) & 255;
    const g0 = (base >> 8) & 255;
    const b0 = base & 255;
    let n = (seed || 1) >>> 0;
    const rnd = () => {
      n = (Math.imul(n, 1664525) + 1013904223) >>> 0;
      return n / 4294967296;
    };
    const mix = (k, dr, dg, db) => {
      const r = Math.max(0, Math.min(255, (r0 * k + dr) | 0));
      const gg = Math.max(0, Math.min(255, (g0 * k + dg) | 0));
      const b = Math.max(0, Math.min(255, (b0 * k + db) | 0));
      return "rgb(" + r + "," + gg + "," + b + ")";
    };
    for (let y = 0; y < 256; y += 8) {
      const k = 0.5 + (y / 256) * 0.85;
      g.fillStyle = mix(k, (y % 40) - 18, (y % 24) - 10, 12 - (y % 20));
      g.fillRect(0, y, 512, 8);
    }
    for (let i = 0; i < 28; i++) {
      g.fillStyle = mix(0.4 + rnd() * 0.85, rnd() * 50 - 22, rnd() * 36 - 14, rnd() * 28 - 12);
      g.beginPath();
      g.ellipse(rnd() * 512, rnd() * 256, 12 + rnd() * 46, 7 + rnd() * 20, rnd() * 3, 0, Math.PI * 2);
      g.fill();
    }
    for (let i = 0; i < 16; i++) {
      const x = rnd() * 512;
      const y = rnd() * 256;
      const rad = 5 + rnd() * 14;
      g.fillStyle = mix(0.32, -8, -6, -4);
      g.beginPath();
      g.arc(x, y, rad, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = mix(1.15, 28, 18, 8);
      g.lineWidth = 2;
      g.beginPath();
      g.arc(x, y, rad, 0, Math.PI * 2);
      g.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.ClampToEdgeWrapping;
    return t;
  }

  function usableMap(map) {
    if (!map || !map.image) return false;
    const img = map.image;
    const w = img.width || img.videoWidth || 0;
    const h = img.height || img.videoHeight || 0;
    return w > 1 && h > 1;
  }

  function planetMaterial(map, fallbackColor, opts) {
    opts = opts || {};
    // The Sun is MeshBasicMaterial and was the only body with a real
    // surface on the phone. Standard + a second sampler (or a map that
    // never uploaded) drew nothing, so the limb shell read as a flat disk.
    // One albedo sampler, no light shader, same path as Sol.
    const tex = usableMap(map) ? map : null;
    return new THREE.MeshBasicMaterial({
      map: tex,
      color: tex ? 0xffffff : (fallbackColor || 0x888888),
      fog: false,
      toneMapped: false,
    });
  }

  function texPair(key) {
    const map = textures[key] || null;
    const nrm = textures[key + "Normal"] || null;
    return { map: map, normalMap: nrm };
  }

  // --- Build sky after textures ----------------------------------------
  const bodies = []; // { name, group, mesh, def, angle, radius, worldPos }
  let sunCore, sunGlow, stars, skyDome, asteroidBelt, kuiperBelt;
  let textures = {};

  // Scientific AU + Earth-relative radii, playable via AU_UNIT / SIZE_BOOST
  const bodyDefs = [
    {
      name: "Mercury",
      key: "mercury",
      radius: bodyR(0.38),
      au: 0.387,
      speed: 0.48,
      tilt: 0.001,
      y: 0.15,
      color: 0xb5b5b5,
      atmo: 0xc8c0b0, // thin exosphere read / limb for silhouette
    },
    {
      name: "Venus",
      key: "venus",
      radius: bodyR(0.95),
      au: 0.723,
      speed: 0.35,
      tilt: 0.05,
      y: -0.25,
      color: 0xe8c98a,
      atmo: 0xffd090,
    },
    {
      name: "Earth",
      key: "earth",
      radius: bodyR(1.0),
      au: 1.0,
      speed: 0.28,
      tilt: 0.409,
      y: 0.12,
      color: 0x4a7fd4,
      atmo: 0x6ec8ff,
      clouds: true,
      moons: [{ name: "Moon", key: "moon", r: 0.27, dist: 3.4, speed: 0.95, color: 0xcccccc }],
    },
    {
      name: "Mars",
      key: "mars",
      radius: bodyR(0.53),
      au: 1.524,
      speed: 0.22,
      tilt: 0.439,
      y: -0.2,
      color: 0xc45a3a,
      atmo: 0xff8866,
      moons: [
        { name: "Phobos", key: "phobos", r: 0.11, dist: 2.1, speed: 1.8, color: 0x8a7a6a },
        { name: "Deimos", key: "deimos", r: 0.08, dist: 2.9, speed: 1.15, color: 0x9a8a7a },
      ],
    },
    {
      name: "Jupiter",
      key: "jupiter",
      radius: bodyR(4.2, 0.68), // presence boost — still readable vs AU
      au: 5.203,
      speed: 0.11,
      tilt: 0.054,
      y: 0.35,
      color: 0xc9a87a,
      atmo: 0xe8c8a0, // hydrogen/haze limb
      moons: [
        { name: "Amalthea", key: "amalthea", r: 0.09, dist: 1.85, speed: 1.9, color: 0xb08060 },
        { name: "Io", key: "io", r: 0.286, dist: 2.4, speed: 1.35, color: 0xe8c878 },
        { name: "Europa", key: "europa", r: 0.245, dist: 3.2, speed: 1.05, color: 0xd8e0f0 },
        { name: "Ganymede", key: "ganymede", r: 0.413, dist: 4.2, speed: 0.78, color: 0xa8a090 },
        { name: "Callisto", key: "callisto", r: 0.378, dist: 5.4, speed: 0.55, color: 0x6a6558 },
        { name: "Himalia", key: "himalia", r: 0.1, dist: 6.8, speed: 0.32, color: 0x9a9080 },
      ],
    },
    {
      name: "Saturn",
      key: "saturn",
      radius: bodyR(3.5, 0.68),
      au: 9.537,
      speed: 0.08,
      tilt: 0.466,
      y: -0.4,
      color: 0xe6d3a3,
      atmo: 0xffe8c8,
      ring: true,
      moons: [
        { name: "Mimas", key: "mimas", r: 0.12, dist: 2.82, speed: 1.1, color: 0xc8c0b8 },
        { name: "Enceladus", key: "enceladus", r: 0.14, dist: 3.1, speed: 0.95, color: 0xe8f0ff },
        { name: "Tethys", key: "tethys", r: 0.16, dist: 3.45, speed: 0.82, color: 0xd8d0c8 },
        { name: "Dione", key: "dione", r: 0.17, dist: 3.7, speed: 0.7, color: 0xc8c0b8 },
        { name: "Rhea", key: "rhea", r: 0.22, dist: 3.9, speed: 0.62, color: 0xb8b0a8 },
        { name: "Titan", key: "titan", r: 0.404, dist: 4.8, speed: 0.42, color: 0xd4a060 },
        { name: "Hyperion", key: "hyperion", r: 0.11, dist: 5.3, speed: 0.35, color: 0xb8a090 },
        { name: "Iapetus", key: "iapetus", r: 0.2, dist: 6.2, speed: 0.28, color: 0x6a5a48 },
        { name: "Janus", key: "janus", r: 0.09, dist: 2.48, speed: 1.25, color: 0xc8c0b8 },
        { name: "Epimetheus", key: "epimetheus", r: 0.08, dist: 2.62, speed: 1.22, color: 0xb8b0a8 },
        { name: "Phoebe", key: "phoebe", r: 0.11, dist: 7.4, speed: 0.18, color: 0x5a5048 },
      ],
    },
    {
      name: "Uranus",
      key: "uranus",
      radius: bodyR(2.0, 0.85),
      au: 19.19,
      speed: 0.055,
      tilt: 1.706,
      y: 0.5,
      color: 0x9fd6e0,
      atmo: 0xa8e8f0,
      ring: true,
      moons: [
        { name: "Miranda", key: "miranda", r: 0.12, dist: 2.5, speed: 1.05, color: 0xb0b8c0 },
        { name: "Ariel", key: "ariel", r: 0.16, dist: 2.9, speed: 0.85, color: 0xb8c0c8 },
        { name: "Umbriel", key: "umbriel", r: 0.15, dist: 3.25, speed: 0.68, color: 0x707880 },
        { name: "Titania", key: "titania", r: 0.22, dist: 3.6, speed: 0.55, color: 0xa8b0b8 },
        { name: "Oberon", key: "oberon", r: 0.21, dist: 4.4, speed: 0.42, color: 0x9098a0 },
      ],
    },
    {
      name: "Neptune",
      key: "neptune",
      radius: bodyR(1.9, 0.85),
      au: 30.07,
      speed: 0.04,
      tilt: 0.494,
      y: -0.35,
      color: 0x3f6fd6,
      atmo: 0x5a8cff,
      moons: [
        { name: "Larissa", key: "larissa", r: 0.1, dist: 2.05, speed: 1.35, color: 0x8a8898 },
        { name: "Proteus", key: "proteus", r: 0.14, dist: 2.4, speed: 1.05, color: 0x9a9aa8 },
        { name: "Triton", key: "triton", r: 0.27, dist: 3.8, speed: 0.48, color: 0xc0d0d8 },
        { name: "Nereid", key: "nereid", r: 0.1, dist: 5.8, speed: 0.22, color: 0x8a8890 },
      ],
    },
    {
      name: "Ceres",
      key: "ceres",
      radius: bodyR(0.28, 1.15),
      au: 2.77,
      speed: 0.16,
      tilt: 0.18,
      y: 0.08,
      color: 0x9a9aa0,
      atmo: 0xc8d0d8,
      dwarf: true,
    },
    {
      name: "Pluto",
      key: "pluto",
      radius: bodyR(0.18, 1.35),
      au: 39.5,
      speed: 0.028,
      tilt: 1.045,
      y: -0.55,
      color: 0xc4a890,
      atmo: 0xe8e0d8,
      dwarf: true,
      moons: [
        { name: "Charon", key: "charon", r: 0.095, dist: 2.8, speed: 0.7, color: 0x8a8090 },
        { name: "Nix", key: "nix", r: 0.02, dist: 6.4, speed: 0.18, color: 0xa09890 },
      ],
    },
    {
      name: "Vesta",
      key: "vesta",
      radius: bodyR(0.16, 1.2),
      au: 2.36,
      speed: 0.175,
      tilt: 0.5,
      y: 0.15,
      color: 0xb0a090,
      dwarf: true,
    },
    {
      name: "Pallas",
      key: "pallas",
      radius: bodyR(0.14, 1.2),
      au: 2.77,
      speed: 0.155,
      tilt: 0.6,
      y: -0.35,
      color: 0x9a9588,
      dwarf: true,
    },
    {
      name: "Haumea",
      key: "haumea",
      radius: bodyR(0.12, 1.25),
      au: 43.1,
      speed: 0.024,
      tilt: 0.7,
      y: 0.8,
      color: 0xe8e0d8,
      dwarf: true,
      moons: [
        { name: "Hiʻiaka", key: "hiiaka", r: 0.07, dist: 3.55, speed: 0.55, color: 0xd8e0e8 },
        { name: "Namaka", key: "namaka", r: 0.055, dist: 2.4, speed: 0.75, color: 0xc8d0d8 },
      ],
    },
    {
      name: "Eris",
      key: "eris",
      radius: bodyR(0.15, 1.25),
      au: 67.7,
      speed: 0.018,
      tilt: 0.4,
      y: -1.2,
      color: 0xd0d8e0,
      dwarf: true,
      moons: [{ name: "Dysnomia", key: "dysnomia", r: 0.07, dist: 2.9, speed: 0.6, color: 0xa8b0c0 }],
    },
    {
      name: "Makemake",
      key: "makemake",
      radius: bodyR(0.12, 1.25),
      au: 45.5,
      speed: 0.022,
      tilt: 0.5,
      y: 0.6,
      color: 0xe0c8a8,
      dwarf: true,
    },
    {
      name: "Quaoar",
      key: "quaoar",
      radius: bodyR(0.09, 1.3),
      au: 43.3,
      speed: 0.023,
      tilt: 0.2,
      y: -0.5,
      color: 0xc8a888,
      dwarf: true,
      moons: [{ name: "Weywot", key: "weywot", r: 0.05, dist: 2.6, speed: 0.65, color: 0xb8a090 }],
    },
  ];

  // Resolve orbit radii from AU
  bodyDefs.forEach((d) => {
    d.orbit = orbitAU(d.au);
  });
  // Educational Kepler: mean motion ∝ a^{-3/2} (Earth baseline speed 0.28)
  // Display time is accelerated; ratios stay astronomer-honest.
  (function applyKeplerianSpeeds() {
    const earthSpeed = (Math.PI * 2) / (365.256 * SIM_DAY);
    bodyDefs.forEach((d) => {
      if (!d.au || d.au <= 0) return;
      d.speed = earthSpeed * Math.pow(1 / d.au, 1.5);
      d.kepler = true;
    });
  })();

  const PLANET_BLURBS = {
    Sun: "The Sun — soft-skim the corona glow; photosphere ~5500 °C, core fusion far hotter. No walks.",
    Mercury: "Mercury — 0.39 AU. Small, scarred, and quick. Closest to the fire.",
    Venus: "Venus — thick CO₂ greenhouse; retrograde rotation (display tilt softened). Soft-land haze walk.",
    Earth: "Earth — 1 AU. Blue oceans, white weather, a living marble.",
    Moon: "The Moon — pale companion in Earth's wake. Soft-land and skim the maria.",
    Mars: "Mars — 1.52 AU. Rust and memory. Thin air, wide deserts.",
    Jupiter: "Jupiter — 5.2 AU. More mass than all other planets; Great Red Spot and four Galileans.",
    Io: "Io — volcanic moon of Jupiter. Sulfur yellows and restless fire.",
    Europa: "Europa — icy shell over a global saltwater ocean; chaos terrain flexes and refreezes.",
    Ganymede: "Ganymede — largest moon in the solar system.",
    Callisto: "Callisto — ancient, cratered outer Galilean.",
    Saturn: "Saturn — 9.5 AU. Density less than water; rings are ice sheets in razor orbits.",
    Titan: "Titan — thick N₂ sky, methane lakes and rivers. The only moon with real weather.",
    Uranus: "Uranus — 19 AU. Tipped on its side, cool and distant.",
    Neptune: "Neptune — 30 AU. Deep blue at the edge of the local dance.",
    Phobos: "Phobos — Mars' battered inner moon. Potato-shaped, skim-close.",
    Deimos: "Deimos — Mars' outer pebble moon. Slow and distant.",
    Mimas: "Mimas — Herschel crater is about 130 km across, a third of the moon.",
    Enceladus: "Enceladus — tiger-stripe fractures vent water into Saturn's E ring; ocean world.",
    Rhea: "Rhea — cratered ice world, Saturn's second-largest moon.",
    Iapetus: "Iapetus — two-faced: dark leading hemisphere, bright trailing.",
    Miranda: "Miranda — Uranus moon of cliffs and patchwork terrain.",
    Titania: "Titania — Uranus' largest moon; icy canyons.",
    Oberon: "Oberon — dark, ancient Uranian moon.",
    Triton: "Triton — Neptune's retrograde jewel; nitrogen frost.",
    Ceres: "Ceres — largest asteroid-belt dwarf; round and quiet.",
    Pluto: "Pluto — distant dwarf; heart-shaped Tombaugh Regio awaits.",
    Charon: "Charon — Pluto's half-size companion in a double-dwarf dance.",
    Nix: "Nix — small outer moon of Pluto; not a stand-in for Charon.",
    Vesta: "Vesta — bright rocky protoplanet; Rheasilvia basin.",
    Pallas: "Pallas — highly inclined main-belt world.",
    Haumea: "Haumea — elongated dwarf; fast rotator beyond Neptune.",
    Eris: "Eris — distant scattered-disk dwarf; once rivaled Pluto.",
    Tethys: "Tethys — icy Saturnian moon with huge Odysseus crater.",
    Dione: "Dione — bright cliffs of ice on Saturn's mid moon.",
    Ariel: "Ariel — Uranian moon of canyons and frost.",
    Umbriel: "Umbriel — dark Uranian moon; ancient surface.",
    "Observation Station": "Observation Station — lit belt habitat. Soft-land, walk in, equip the Skytape for Sky Radio.",
    Hyperion: "Hyperion — chaotic rotator; spongy ice moon of Saturn.",
    Proteus: "Proteus — Neptune's second-largest moon; irregular and dark.",
    Nereid: "Nereid — highly eccentric Neptunian moon; distant wanderer.",
    Makemake: "Makemake — bright classical Kuiper dwarf; methane frost.",
    Quaoar: "Quaoar — Kuiper object with a surprising faint ring system.",
    "Starman Roadster": "Starman Roadster replica — educational model of the 2018 Falcon Heavy demo payload on a heliocentric orbit. Not affiliated with Tesla or SpaceX.",
  };

  const _tmpV = new THREE.Vector3();
  const _tmpN = new THREE.Vector3();
  const _nearestWorld = new THREE.Vector3();
  const _ringWorld = new THREE.Vector3();
  const _ringN = new THREE.Vector3();
  const _ringRel = new THREE.Vector3();
  const _ringQ = new THREE.Quaternion();
  const _lookTo = new THREE.Vector3();
  const _camUp = new THREE.Vector3();
  const _flightEuler = new THREE.Euler(0, 0, 0, "YXZ");

  function addMoon(parentGroup, mdef, parentRadius) {
    const moonG = new THREE.Group();
    moonG.name = mdef.name;
    const r = Math.max(0.18, bodyR(mdef.r, 1.05)); // presence — moons read from parent cruise
    const texKey = (mdef.key || mdef.name || "").toLowerCase();
    const pair = texPair(mdef.key || texKey);
    const rawMoon = pair.map || textures[texKey] || null;
    const map = usableMap(rawMoon) ? rawMoon : markedAlbedo(mdef.color || 0xaaaaaa, (mdef.name || "m").length * 17);
    const nrm = pair.normalMap || textures[texKey + "Normal"] || null;
    const irregular = /phobos|deimos|hyperion|proteus|amalthea|himalia|janus|epimetheus|phoebe|larissa|weywot/i.test(mdef.name);
    let geo;
    if (irregular) {
      geo = new THREE.DodecahedronGeometry(r, 1); // smoother irregular
    } else {
      geo = new THREE.SphereGeometry(r, PERF.low ? PERF.bodySegLo : 64, PERF.low ? 28 : 48);
    }
    const moon = new THREE.Mesh(
      geo,
      planetMaterial(map, mdef.color || 0xaaaaaa, {
        flat: false,
        bump: !!map && !nrm,
        normalMap: nrm,
        normalScale: irregular ? 1.6 : 1.15,
        roughness: irregular ? 0.9 : /europa|enceladus|tethys|dione|rhea|mimas|triton|miranda/i.test(mdef.name) ? 0.48 : 0.72,
        metalness: /europa|enceladus|tethys|dione|rhea|mimas|triton/i.test(mdef.name) ? 0.12 : 0.05,
      })
    );
    if (irregular) {
      moon.scale.set(1.25, 0.78, 1.05);
    }
    moonG.add(moon);
    // Thin presence halo on major icy/thick-atmosphere moons.
    // Whole name only: "titan" is inside Titania, "io" is inside Dione,
    // Hyperion, and Ixion. Those were wearing a cruise atmosphere shell.
    if (/^(Titan|Europa|Enceladus|Triton|Ganymede|Io|Callisto|Moon)$/i.test(mdef.name)) {
      const col = mdef.name === "Titan" ? 0xe8b070 : mdef.name === "Io" ? 0xffd080 : 0xb8d0f0;
      const op = mdef.name === "Titan" ? 0.45 : mdef.name === "Europa" ? 0.1 : 0.24;
      moonG.add(atmosphere(r, col, op));
      if (mdef.name === "Titan") {
        moonG.add(atmosphere(r * 1.06, 0xffc090, 0.25));
      }
      if (mdef.name === "Io") {
        const glow = new THREE.Mesh(
          new THREE.SphereGeometry(r * 1.04, 24, 16),
          new THREE.MeshBasicMaterial({
            color: 0xff6020,
            transparent: true,
            opacity: 0.18,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,
          })
        );
        glow.name = "ioVolcano";
        moonG.add(glow);
      }
      if (mdef.name === "Enceladus") {
        const plumeRoot = new THREE.Group();
        plumeRoot.name = "enceladusPlumes";
        for (let pi = 0; pi < 7; pi++) {
          const jet = new THREE.Mesh(
            new THREE.CylinderGeometry(r * 0.015, r * (0.08 + (pi % 3) * 0.03), r * (2.4 + (pi % 4) * 0.45), 7, 1, true),
            new THREE.MeshBasicMaterial({
              color: 0xd0e8ff,
              transparent: true,
              opacity: 0.14 + (pi % 3) * 0.04,
              depthWrite: false,
              blending: THREE.AdditiveBlending,
              side: THREE.DoubleSide,
            })
          );
          const ang = (pi / 7) * Math.PI * 2;
          jet.position.set(Math.cos(ang) * r * 0.12, -r * 1.35, Math.sin(ang) * r * 0.12);
          jet.rotation.x = 0.15 * Math.cos(ang);
          jet.rotation.z = 0.15 * Math.sin(ang);
          jet.name = "enceladusPlume";
          plumeRoot.add(jet);
        }
        const southGlow = new THREE.Mesh(
          new THREE.SphereGeometry(r * 0.35, 10, 8),
          new THREE.MeshBasicMaterial({
            color: 0xa0d0ff, transparent: true, opacity: 0.16, depthWrite: false,
            blending: THREE.AdditiveBlending,
          })
        );
        southGlow.position.y = -r * 0.95;
        plumeRoot.add(southGlow);
        moonG.add(plumeRoot);
      }
    }
    moonG.userData.orbit = parentRadius * (mdef.dist || 3.2);
    const pDays = MOON_PERIOD_D[mdef.name];
    const absP = Math.abs(pDays || 0);
    moonG.userData.periodDays = absP || null;
    moonG.userData.retrograde = !!(pDays && pDays < 0);
    moonG.userData.tidalLock = !MOON_CHAOTIC[mdef.name] && !MOON_FREE_SPIN_H[mdef.name];
    moonG.userData.spinHours = MOON_FREE_SPIN_H[mdef.name] || null;
    // Radians per wall-second at orbitScale 1. Period is sidereal days, not a 24h spin.
    moonG.userData.speed = absP
      ? ((Math.PI * 2) / (absP * SIM_DAY)) * (pDays < 0 ? -1 : 1)
      : (mdef.speed || 0.8) * 0.02;
    moonG.userData.angle = Math.random() * Math.PI * 2;
    moonG.userData.radius = r;
    moonG.userData.bodyName = mdef.name;
    moonG.userData.isMoonGroup = true;
    // Pluto–Charon: faint binary tether (educational double-dwarf cue)
    if (/charon/i.test(mdef.name) && parentGroup.name === "Pluto") {
      const len = moonG.userData.orbit;
      const tether = new THREE.Mesh(
        new THREE.CylinderGeometry(parentRadius * 0.012, parentRadius * 0.018, len, 6),
        new THREE.MeshBasicMaterial({
          color: 0xa090b0,
          transparent: true,
          opacity: 0.22,
          depthWrite: false,
        })
      );
      tether.rotation.z = Math.PI / 2;
      tether.position.x = -len * 0.5;
      tether.name = "charonTether";
      moonG.add(tether);
    }
    parentGroup.add(moonG);
    if (!parentGroup.userData.moons) parentGroup.userData.moons = [];
    parentGroup.userData.moons.push(moonG);
    // Also register as collidable / look-at body (updated each frame via parent)
    bodies.push({
      name: mdef.name,
      group: moonG,
      mesh: moon,
      def: {
        key: (mdef.key || mdef.name || "").toLowerCase(),
        radius: r,
        orbit: 0,
        speed: 0,
        y: 0,
        atmo: mdef.name === "Titan" ? 0xe8b070 : null,
      },
      angle: 0,
      radius: r,
      isMoon: true,
      walkable: true,
      landable: true,
      parentName: parentGroup.name,
    });
    return moonG;
  }

  async function buildWorld() {
    setProgress(0.25);
    // Rubric #1: sky visible ASAP (no black void under loader)
    if (!stars) {
      try {
        stars = makeStarField(PERF.low ? 900 : 4000);
        scene.add(stars);
        camera.position.copy(flight.pos);
        applyLook();
        renderer.render(scene, camera);
        // Butter first open: keep painting sky while textures stream
        if (!window.__vesperBootLoop) {
          window.__vesperBootLoop = true;
          (function bootPaint() {
            if (state.ready) return;
            try {
              if (stars) stars.rotation.y += 0.0004;
              renderer.render(scene, camera);
            } catch (_) {}
            requestAnimationFrame(bootPaint);
          })();
        }
      } catch (_) {}
    }
    const names = {
      sun: "2k_sun.jpg",
      mercury: "2k_mercury.jpg",
      venus: "2k_venus_atmosphere.jpg",
      earth: "2k_earth_daymap.jpg",
      clouds: "2k_earth_clouds.jpg",
      moon: "2k_moon.jpg",
      mars: "2k_mars.jpg",
      jupiter: "2k_jupiter.jpg",
      saturn: "2k_saturn.jpg",
      ring: "2k_saturn_ring_alpha.png",
      uranus: "2k_uranus.jpg",
      neptune: "2k_neptune.jpg",
      starsMW: "2k_stars_milky_way.jpg",
    };
    const keys = Object.keys(names);
    let done = 0;
    // Stream critical textures first (Sun/Earth/MW) — rest in parallel after
    const critical = ["sun", "earth", "clouds", "moon", "starsMW"];
    const rest = keys.filter((k) => critical.indexOf(k) < 0);
    async function loadKey(k) {
      textures[k] = await loadTex(names[k], k === "ring" ? { wrap: true } : null);
      done++;
      setProgress(0.25 + (done / keys.length) * 0.4);
    }
    await Promise.all(critical.filter((k) => names[k]).map(loadKey));
    await Promise.all(rest.map(loadKey));

    // Procedural fills — defer heavy bake on coarse until after first fly frame
    function rebindBodyMaps() {
      for (let i = 0; i < bodies.length; i++) {
        const b = bodies[i];
        if (!b || !b.mesh || !b.mesh.material) continue;
        const key = ((b.def && b.def.key) || b.name || "").toLowerCase();
        const map = textures[key];
        if (!usableMap(map)) continue;
        const mat = b.mesh.material;
        if (mat.map === map) continue;
        mat.map = map;
        mat.color.setHex(0xffffff);
        // Do not attach a normal map. A second sampler is what blanked Earth.
        mat.needsUpdate = true;
      }
    }
    if (window.VesperProcTex) window.VesperProcTex.start(THREE, {
      onJob: function (key, proc) {
        Object.keys(proc).forEach(function (name) { if (!textures[name]) textures[name] = proc[name]; });
        rebindBodyMaps();
      }
    });

    // Deep sky beauty mode — MW + Hα/OIII/dust nebulae + zodiacal (not pitch black)
    let deepSky = null;
    if (window.VesperDeepSky && window.VesperDeepSky.build) {
      deepSky = window.VesperDeepSky.build({
        THREE: THREE,
        scene: scene,
        orbitAU: orbitAU,
        mwMap: textures.starsMW || null,
        lowEnd: PERF.low,
        reduceMotion: reduceMotion,
      });
      skyDome = deepSky.skyDome;
      window.__vesperDeepSky = deepSky;
    } else if (textures.starsMW) {
      const skyGeo = new THREE.SphereGeometry(Math.max(orbitAU(95), 72000), 64, 40);
      skyDome = new THREE.Mesh(
        skyGeo,
        new THREE.MeshBasicMaterial({
          map: textures.starsMW,
          side: THREE.BackSide,
          depthWrite: false,
          color: 0xffe8dc,
          toneMapped: false,
        })
      );
      scene.add(skyDome);
    }

    if (stars && stars.parent) {
      scene.remove(stars);
      if (stars.geometry) stars.geometry.dispose();
    }
    stars = makeStarField(reduceMotion ? 2200 : PERF.low ? 3200 : qualityTier === "ultra" ? 18000 : qualityTier === "high" ? 12000 : 8000);
    scene.add(stars);

    const system = new THREE.Group();
    scene.add(system);

    // Sun
    const sunGroup = new THREE.Group();
    sunGroup.name = "Sun";
    const sunGeo = new THREE.SphereGeometry(SUN_R, 64, 48);
    const sunMat = new THREE.MeshBasicMaterial({
      map: textures.sun || null,
      color: textures.sun ? 0xffffff : 0xffd2a8,
      toneMapped: false,
    });
    sunCore = new THREE.Mesh(sunGeo, sunMat);
    sunGroup.add(sunCore);

    const glowTex = makeGradientTexture(
      [
        [0, "rgba(255,220,160,1)"],
        [0.18, "rgba(255,170,90,0.55)"],
        [0.45, "rgba(200,100,40,0.18)"],
        [1, "rgba(0,0,0,0)"],
      ],
      256
    );
    sunGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTex,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: 1,
        toneMapped: false,
      })
    );
    sunGlow.scale.set(SUN_R * 7.2, SUN_R * 7.2, 1);
    sunGroup.add(sunGlow);
    sunGroup.add(atmosphere(SUN_R, 0xffaa55, 0.28));
    // Outer corona + solar-wind whisper shell
    sunGroup.add(atmosphere(SUN_R * 1.35, 0xff8833, 0.1));
    const corona = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTex,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: 0.45,
        toneMapped: false,
        color: 0xffcc88,
      })
    );
    corona.name = "corona";
    corona.scale.set(SUN_R * 14, SUN_R * 14, 1);
    sunGroup.add(corona);
    sunGroup.userData.corona = corona;
    // Solar-wind particle whisper (educational — not MHD-accurate)
    if (!PERF.low) {
      const swN = qualityTier === "ultra" ? 2400 : 1200;
      const swPos = new Float32Array(swN * 3);
      for (let i = 0; i < swN; i++) {
        const a = Math.random() * Math.PI * 2;
        const b = (Math.random() - 0.5) * 0.7;
        const rr = SUN_R * (2.2 + Math.random() * 18);
        swPos[i * 3] = Math.cos(a) * Math.cos(b) * rr;
        swPos[i * 3 + 1] = Math.sin(b) * rr * 0.35;
        swPos[i * 3 + 2] = Math.sin(a) * Math.cos(b) * rr;
      }
      const swGeo = new THREE.BufferGeometry();
      swGeo.setAttribute("position", new THREE.BufferAttribute(swPos, 3));
      const sw = new THREE.Points(
        swGeo,
        new THREE.PointsMaterial({
          color: 0xffc080,
          size: 2.2,
          transparent: true,
          opacity: 0.28,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          sizeAttenuation: true,
        })
      );
      sw.name = "solarWind";
      sunGroup.add(sw);
      sunGroup.userData.solarWind = sw;
    }
    system.add(sunGroup);
    bodies.push({
      name: "Sun",
      group: sunGroup,
      mesh: sunCore,
      def: { radius: SUN_R, orbit: 0, speed: 0, y: 0 },
      angle: 0,
      radius: SUN_R,
      fixed: true,
      walkable: false,
      skimOnly: true,
    });

    bodyDefs.forEach((def, idx) => {
      const group = new THREE.Group();
      group.name = def.name;
      const rawMap = textures[def.key] || null;
      const map = usableMap(rawMap) ? rawMap : markedAlbedo(def.color || 0x888888, idx + 3);
      const nrm = textures[def.key + "Normal"] || null;
      const geo = new THREE.SphereGeometry(def.radius, PERF.bodySegHi, Math.max(24, (PERF.bodySegHi * 0.78) | 0));
      const mat = planetMaterial(map, def.color, {
        roughness: /Uranus|Neptune/.test(def.name) ? 0.55 : /Earth|Mars|Venus|Mercury/.test(def.name) ? 0.72 : 0.78,
        metalness: /Uranus|Neptune/.test(def.name) ? 0.08 : 0.05,
        normalMap: nrm,
        normalScale: nrm ? 1.15 : undefined,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.name = "bodySurface";
      mesh.userData.isBodySurface = true;
      mesh.renderOrder = 2;
      mesh.frustumCulled = false;
      group.add(mesh);
      if (def.atmo) {
        const atmoOp = def.name === "Venus" ? 0.55 : def.name === "Mars" ? 0.32 : def.name === "Mercury" ? 0.16 : /Jupiter|Saturn/.test(def.name) ? 0.38 : 0.4;
        group.add(atmosphere(def.radius, def.atmo, atmoOp));
        // Venus double haze shell
        if (def.name === "Venus") {
          group.add(atmosphere(def.radius * 1.06, 0xffe0a8, 0.28));
        }
      }
      // Gas-giant banding vibe (additive limb rings — physics-lite)
      if (def.name === "Jupiter" || def.name === "Saturn" || def.name === "Uranus" || def.name === "Neptune") {
        const bandCols = {
          Jupiter: [0xc9a070, 0xd8b890, 0xa88860],
          Saturn: [0xe8d4a8, 0xd0c090, 0xf0e0c0],
          Uranus: [0xa8d8e0, 0x90c8d0],
          Neptune: [0x4a70c8, 0x3a60b0],
        };
        (bandCols[def.name] || []).forEach((col, bi) => {
          const br = def.radius * (1.018 + bi * 0.02);
          const band = new THREE.Mesh(
            new THREE.SphereGeometry(br, 48, 24, 0, Math.PI * 2, Math.PI * (0.35 + bi * 0.08), Math.PI * 0.12),
            new THREE.MeshBasicMaterial({
              color: col,
              transparent: true,
              opacity: 0.28,
              depthWrite: false,
              blending: THREE.AdditiveBlending,
              toneMapped: false,
            })
          );
          band.name = "band" + bi;
          band.userData.isBandDetail = true;
          group.add(band);
        });
      }
      // Mercury and Mars used to tint a standard material. Basic has no
      // emissive uniform; writing one makes refreshMaterialUniforms throw
      // and the body never draws.
      // Earth: hopeful city-light emissive map (procedural nightside life)
      if (def.name === "Earth") {
        const mag = new THREE.Mesh(
          new THREE.SphereGeometry(def.radius * 1.18, PERF.low ? 20 : 32, PERF.low ? 14 : 20),
          new THREE.MeshBasicMaterial({
            color: 0x6080ff,
            transparent: true,
            opacity: 0.045,
            side: THREE.BackSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          })
        );
        mag.name = "magnetosphere";
        mag.userData.isAtmosphere = true;
        group.add(mag);
      }
      if (def.name === "Earth") {
        try {
          const c = document.createElement("canvas");
          const nightN = PERF.low ? 512 : 1024;
          c.width = c.height = nightN;
          const g = c.getContext("2d");
          g.clearRect(0, 0, nightN, nightN);
          const nightDots = PERF.low ? 700 : 1800;
          for (let i = 0; i < nightDots; i++) {
            const x = Math.random() * nightN;
            const y = nightN * 0.2 + Math.random() * nightN * 0.6; // avoid poles
            const r = 0.6 + Math.random() * 2.2;
            g.fillStyle = Math.random() > 0.3 ? "rgba(255,220,160,0.85)" : "rgba(180,210,255,0.7)";
            g.beginPath();
            g.arc(x, y, r, 0, Math.PI * 2);
            g.fill();
          }
          // Cluster megaregions
          [[0.2, 0.45], [0.55, 0.42], [0.72, 0.55], [0.35, 0.6]].forEach((xy) => {
            for (let i = 0; i < 80; i++) {
              const x = xy[0] * nightN + (Math.random() - 0.5) * (nightN * 0.09);
              const y = xy[1] * nightN + (Math.random() - 0.5) * (nightN * 0.05);
              g.fillStyle = "rgba(255,200,120,0.9)";
              g.fillRect(x, y, 1.5, 1.5);
            }
          });
          // Do not put this canvas on the daymap material. A second sampler
          // (emissiveMap) made the Earth draw incomplete on SwiftShader and
          // iOS, so the photo never rasterized and only the blue limb remained.
          const night = new THREE.CanvasTexture(c);
          if (THREE.NoColorSpace) night.colorSpace = THREE.NoColorSpace;
          night.generateMipmaps = false;
          night.minFilter = THREE.LinearFilter;
          night.magFilter = THREE.LinearFilter;
          night.anisotropy = 1;
          night.premultiplyAlpha = false;
          night.needsUpdate = true;
          const nightMesh = new THREE.Mesh(
            new THREE.SphereGeometry(def.radius * 1.004, PERF.low ? 32 : 48, PERF.low ? 24 : 32),
            new THREE.MeshBasicMaterial({
              map: night,
              transparent: true,
              depthWrite: false,
              blending: THREE.AdditiveBlending,
              fog: false,
              opacity: 0.95,
            })
          );
          nightMesh.name = "earthNightLights";
          nightMesh.renderOrder = 3;
          group.add(nightMesh);
        } catch (_) {}
      }

      if (def.clouds && textures.clouds) {
        // The JPEG is a gray field (mean ~71), not a cutout. Used as a
        // half-opaque map it filmed the whole daymap. Keep only the bright deck.
        const cloudMap = cloudDeckMap(textures.clouds);
        const cMesh = new THREE.Mesh(
          new THREE.SphereGeometry(def.radius * 1.025, 64, 48),
          new THREE.MeshBasicMaterial({
            map: cloudMap,
            color: 0xffffff,
            transparent: true,
            opacity: 1,
            depthWrite: false,
            depthTest: true,
            alphaTest: 0.06,
            fog: false,
            toneMapped: false,
          })
        );
        cMesh.name = "clouds";
        cMesh.userData.isCloudDetail = true;
        group.add(cMesh);
      }

      if (def.ring) {
        if (def.name === "Uranus") {
          // Faint dark Uranian rings (educational — not Saturn texture)
          const ur = def.radius * 1.9;
          const urings = new THREE.Mesh(
            new THREE.RingGeometry(ur * 0.88, ur * 1.05, 96),
            new THREE.MeshBasicMaterial({
              map: faintRingMap(),
              color: 0xffffff,
              transparent: true,
              opacity: 0.55,
              side: THREE.DoubleSide,
              depthWrite: false,
              toneMapped: false,
              fog: false,
            })
          );
          urings.rotation.x = Math.PI / 2;
          // Match extreme axial tilt via parent group tilt
          urings.name = "rings";
          group.add(urings);
        } else {
          const rings = makeRingMesh(def.radius * 1.35, def.radius * 2.35, textures.ring);
          rings.name = "rings";
          group.add(rings);
          // Soft ring-shadow cue on the planet (display — not raytraced)
          if (!PERF.low) {
            const shadow = new THREE.Mesh(
              new THREE.CircleGeometry(def.radius * 0.92, 48),
              new THREE.MeshBasicMaterial({
                color: 0x000000,
                transparent: true,
                opacity: 0.22,
                depthWrite: false,
              })
            );
            shadow.rotation.x = -Math.PI / 2;
            shadow.position.y = def.radius * 0.02;
            shadow.name = "ringShadow";
            group.add(shadow);
          }
        }
      }

      if (def.moons) {
        def.moons.forEach((m) => addMoon(group, m, def.radius));
        if (def.name === "Neptune" && !PERF.low) {
          // Adams ring arc cues (display — not full ring model)
          for (let ai = 0; ai < 3; ai++) {
            const arc = new THREE.Mesh(
              new THREE.TorusGeometry(def.radius * 2.22, def.radius * 0.02, 6, 48, Math.PI * 0.35),
              new THREE.MeshBasicMaterial({
                color: 0xa0c0e0,
                transparent: true,
                opacity: 0.28,
                depthWrite: false,
              })
            );
            arc.rotation.x = Math.PI / 2;
            arc.rotation.z = ai * 2.1;
            arc.name = "neptuneArcs";
            group.add(arc);
          }
        }
        // Jupiter: faint Galilean mean-motion resonance guide rings (educational)
        if (def.name === "Jupiter" && !PERF.low) {
          const galilean = [2.2, 3.5, 5.6, 9.4]; // display multiples of R_J (Io→Callisto cues)
          galilean.forEach((mul, gi) => {
            const rr = def.radius * mul;
            const guide = new THREE.Mesh(
              new THREE.RingGeometry(rr * 0.995, rr * 1.005, 96),
              new THREE.MeshBasicMaterial({
                color: gi < 3 ? 0x80c0ff : 0xa0a8c0,
                transparent: true,
                opacity: 0.14,
                side: THREE.DoubleSide,
                depthWrite: false,
              })
            );
            guide.rotation.x = Math.PI / 2;
            guide.name = "galileanGuide";
            group.add(guide);
          });
        }
      if (def.name === "Quaoar") {
        // Weywot's center is 2.6 radii out and the disk reaches in past 2.0.
        // A ring out to 2.4 radii ran through that moon.
        const qring = new THREE.Mesh(
          new THREE.RingGeometry(def.radius * 1.35, def.radius * 1.65, 64),
          new THREE.MeshBasicMaterial({
            map: faintRingMap(),
            color: 0xffffff,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide,
            depthWrite: false,
            toneMapped: false,
            fog: false,
          })
        );
        qring.name = "rings";
        qring.rotation.x = Math.PI / 2.1;
        group.add(qring);
      }
      if (def.name === "Haumea") {
        // The fact names a ring. Namaka's disk reaches in past 2 radii,
        // so the sheet stays inside that edge.
        const hring = new THREE.Mesh(
          new THREE.RingGeometry(def.radius * 1.35, def.radius * 1.7, 64),
          new THREE.MeshBasicMaterial({
            map: faintRingMap(),
            color: 0xffffff,
            transparent: true,
            opacity: 0.45,
            side: THREE.DoubleSide,
            depthWrite: false,
            toneMapped: false,
            fog: false,
          })
        );
        hring.name = "rings";
        hring.rotation.x = Math.PI / 2.1;
        group.add(hring);
      }
        // legacy single moon pointer for Earth
        if (group.userData.moons && group.userData.moons[0]) {
          group.userData.moon = group.userData.moons[0];
        }
      }

      const path = makeOrbitPath(def.orbit, def.color);
      path.position.y = def.y * 0.12;
      system.add(path);
      system.add(group);

      const angle0 = (idx / bodyDefs.length) * Math.PI * 2 + 0.55;
      group.position.set(
        Math.cos(angle0) * def.orbit,
        def.y,
        Math.sin(angle0) * def.orbit
      );
      bodies.push({
        name: def.name,
        group,
        mesh,
        def,
        angle: angle0,
        radius: def.radius,
        walkable: true,
        landable: true,
      });
    });

    // Asteroid belt — InstancedMesh rocks + dust LOD (not glowing squares)
    const beltDust = makeDustBelt(2.2, 3.3, PERF.beltDust, 50 * SOFT_MUL * 0.15, 1.4);
    const beltRocks = makeRockField(2.2, 3.3, PERF.beltRocks, 55 * SOFT_MUL * 0.15, {
      name: "mainBeltRocks",
      landables: PERF.beltLand,
      minS: 5,
      maxS: 22,
      prefix: "Belt",
    });
    asteroidBelt = new THREE.Group();
    asteroidBelt.name = "asteroidBelt";
    asteroidBelt.add(beltDust);
    asteroidBelt.add(beltRocks);
    asteroidBelt.userData.dust = beltDust;
    asteroidBelt.userData.rocks = beltRocks;
    system.add(asteroidBelt);
    registerLandableRocks(beltRocks.userData.landables, asteroidBelt);

    // Kuiper belt hint (~30–48 AU)
    const kuiperDust = makeDustBelt(32, 48, PERF.kuiperDust, 180 * SOFT_MUL * 0.12, 2.0);
    const kuiperRocks = makeRockField(32, 48, PERF.kuiperRocks, 200 * SOFT_MUL * 0.12, {
      name: "kuiperRocks",
      landables: PERF.kuiperLand,
      minS: 8,
      maxS: 36,
      prefix: "Kuiper",
    });
    kuiperBelt = new THREE.Group();
    kuiperBelt.name = "kuiperBelt";
    kuiperBelt.add(kuiperDust);
    kuiperBelt.add(kuiperRocks);
    kuiperBelt.userData.dust = kuiperDust;
    kuiperBelt.userData.rocks = kuiperRocks;
    system.add(kuiperBelt);
    registerLandableRocks(kuiperRocks.userData.landables, kuiperBelt);

    // Jupiter Trojans — Greek (L4) + Trojan (L5) camps (~60° ahead/behind Jupiter)
    // Place as AU rings near 5.2 AU with angular clustering for readability
    (function addTrojans() {
      const jAu = 5.2;
      function camp(name, angle0, dustN, rockN, landN) {
        const g = new THREE.Group();
        g.name = name;
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(dustN * 3);
        const col = new Float32Array(dustN * 3);
        const inner = orbitAU(jAu * 0.92);
        const outer = orbitAU(jAu * 1.08);
        for (let i = 0; i < dustN; i++) {
          const a = angle0 + (Math.random() - 0.5) * 0.55;
          const r = inner + Math.random() * (outer - inner);
          const y = (Math.random() - 0.5) * 40 * SOFT_MUL * 0.12;
          pos[i * 3] = Math.cos(a) * r;
          pos[i * 3 + 1] = y;
          pos[i * 3 + 2] = Math.sin(a) * r;
          const c = 0.45 + Math.random() * 0.3;
          col[i * 3] = c * 0.95;
          col[i * 3 + 1] = c * 0.88;
          col[i * 3 + 2] = c * 0.72;
        }
        geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
        g.add(
          new THREE.Points(
            geo,
            new THREE.PointsMaterial({
              size: 1.6,
              vertexColors: true,
              transparent: true,
              opacity: 0.42,
              depthWrite: false,
              sizeAttenuation: true,
            })
          )
        );
        const rocks = makeRockField(jAu * 0.94, jAu * 1.06, rockN, 50 * SOFT_MUL * 0.12, {
          name: name + "Rocks",
          landables: landN,
          minS: 5,
          maxS: 22,
          prefix: name.replace(/\s/g, ""),
        });
        // Re-seed rock angles toward the camp (makeRockField is full-ring; nudge via group rotate)
        g.add(rocks);
        g.rotation.y = 0; // rocks already full-ring; camp dust carries the visual cluster
        system.add(g);
        registerLandableRocks(rocks.userData.landables, g);
        return g;
      }
      // Approximate Jupiter mean longitude ≈ Earth angle + offset; use fixed aesthetic camps
      const jAngle = (4 / 8) * Math.PI * 2 + 0.4; // Jupiter index-ish
      camp("Trojans L4", jAngle + Math.PI / 3, PERF.trojanDust, PERF.trojanRocks, PERF.trojanLand);
      camp("Trojans L5", jAngle - Math.PI / 3, PERF.trojanDust, Math.max(24, (PERF.trojanRocks * 0.85) | 0), Math.max(3, (PERF.trojanLand * 0.8) | 0));
    })();

    // Distant Oort cloud — icy point shell (display-compressed ~180–420 AU)
    // Perf-aware: Points only + sparse comet nuggets; labeled as Oort representation
    (function addOort() {
      const oort = new THREE.Group();
      oort.name = "oortCloud";
      const n = PERF.oortDust;
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(n * 3);
      const col = new Float32Array(n * 3);
      const inner = orbitAU(180);
      const outer = orbitAU(420);
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const b = Math.acos(2 * Math.random() - 1);
        const r = inner + Math.random() * (outer - inner);
        pos[i * 3] = r * Math.sin(b) * Math.cos(a);
        pos[i * 3 + 1] = r * Math.cos(b) * 0.55; // flatten slightly
        pos[i * 3 + 2] = r * Math.sin(b) * Math.sin(a);
        const ice = 0.55 + Math.random() * 0.4;
        col[i * 3] = ice * 0.75;
        col[i * 3 + 1] = ice * 0.88;
        col[i * 3 + 2] = ice;
      }
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
      oort.add(
        new THREE.Points(
          geo,
          new THREE.PointsMaterial({
            size: 2.8,
            vertexColors: true,
            transparent: true,
            opacity: 0.55,
            depthWrite: false,
            sizeAttenuation: true,
            blending: THREE.AdditiveBlending,
            toneMapped: false,
          })
        )
      );
      // Sparse icy comet nuggets (visual only)
      const cn = PERF.oortComets;
      const cgeo = new THREE.SphereGeometry(1, 6, 5);
      const cmat = new THREE.MeshBasicMaterial({
        color: 0xb0d8ff,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      });
      const im = new THREE.InstancedMesh(cgeo, cmat, cn);
      const dummy = new THREE.Object3D();
      for (let i = 0; i < cn; i++) {
        const a = Math.random() * Math.PI * 2;
        const b = Math.acos(2 * Math.random() - 1);
        const r = inner + Math.random() * (outer - inner);
        dummy.position.set(
          r * Math.sin(b) * Math.cos(a),
          r * Math.cos(b) * 0.55,
          r * Math.sin(b) * Math.sin(a)
        );
        const s = 18 + Math.random() * 50;
        dummy.scale.setScalar(s);
        dummy.updateMatrix();
        im.setMatrixAt(i, dummy.matrix);
      }
      im.instanceMatrix.needsUpdate = true;
      oort.add(im);
      system.add(oort);
    })();

    // Hook for ecosystem layers (artifacts / bots / voxels) — after bodies ready
    window.__vesperSystem = system;
    window.__vesperScene = scene;
    window.__vesperBodies = bodies;

    // Nebulae live in VesperDeepSky beauty layer (far shell)
    setProgress(0.72);
  }

  // --- 6DOF flight (both FLOAT and PILOT) -------------------------------
  // Mobile stick/thrust retune (v51k densify): softer deadzone, less center fight, snappier vert
  const STICK_DEADZONE = 0.07;
  const STICK_SMOOTH = 16;
  const LOOK_SMOOTH = 14;
  const VERT_SMOOTH = 18;

  const flight = {
    pos: HOME.clone(),
    vel: new THREE.Vector3(),
    wishSmooth: new THREE.Vector3(),
    yaw: 0.18,
    pitch: -0.12,
    roll: 0,
    stick: { x: 0, y: 0 },
    stickRaw: { x: 0, y: 0 },
    vertRaw: 0,
    vert: 0,
    lookDelta: { yaw: 0, pitch: 0 },
    dragging: false,
    lastX: 0,
    lastY: 0,
    pointers: new Map(),
    pinchStart: 0,
    chaseZoom: 1,
    lookPointerId: null,
    bounds: orbitAU(78),
    surfaceBody: null,
    walking: false,
    walkBody: null,
    walkLocal: new THREE.Vector3(),
    walkEye: 0.12,
    takeoffUntil: 0, // performance.now() cooldown — prevent instant re-plant
    takeoffBoostFrames: 0, // brief damp immunity after leave
    shellsHoldBody: null, // delay atmo restore after takeoff
    fovEaseFrom: 58,
    fovEaseTo: 58,
    fovEaseUntil: 0,
  };

  const _fwd = new THREE.Vector3();
  const _right = new THREE.Vector3();
  const _up = new THREE.Vector3(0, 1, 0);
  const _wish = new THREE.Vector3();
  const _walkN = new THREE.Vector3();
  const _walkT = new THREE.Vector3();
  const _walkB = new THREE.Vector3();
  const _walkBody = new THREE.Vector3();
  const _walkMat = new THREE.Matrix4();
  const _walkMatInv = new THREE.Matrix4();

  function applyLook() {
    _flightEuler.set(flight.pitch, flight.yaw, flight.roll, "YXZ");
    camera.quaternion.setFromEuler(_flightEuler);
    // Ship mesh sync (embodied craft) — VesperShip owns mesh; we own pose
    if (window.VesperShip && window.VesperShip.syncPose) {
      try { window.VesperShip.syncPose(flight, camera); } catch (_) {}
    }
    const walking = !!flight.walking;
    const camMode = flight.camMode || "chase";
    if (walking || camMode === "cockpit" || camMode === "fp") {
      camera.position.copy(flight.pos);
    } else {
      // Chase cam — hero 3/4 silhouette (readable on iPhone 11)
      camera.getWorldDirection(_fwd);
      _right.crossVectors(_fwd, _up).normalize();
      if (_right.lengthSq() < 1e-6) _right.set(1, 0, 0);
      const zcam = THREE.MathUtils.clamp(flight.chaseZoom || 1, 0.45, 2.6);
      const back = 3.65 * zcam;
      const upOff = 1.15 * zcam;
      const sideOff = 0.55 * zcam;
      camera.position
        .copy(flight.pos)
        .addScaledVector(_fwd, -back)
        .addScaledVector(_up, upOff)
        .addScaledVector(_right, sideOff);
    }
  }

  function faceToward(worldTarget) {
    const dir = worldTarget.clone().sub(flight.pos);
    if (dir.lengthSq() < 1e-8) return;
    dir.normalize();
    flight.yaw = Math.atan2(-dir.x, -dir.z);
    flight.pitch = Math.asin(THREE.MathUtils.clamp(dir.y, -1, 1));
    flight.roll = 0;
  }

  /** Live Earth postcard: sunward + elevated, looking at Earth (falls back to HOME). */
  function earthOverlookPose() {
    const earth = bodies.find((b) => b.name === "Earth" && !b.isMoon);
    if (!earth || !earth.mesh) {
      return { pos: HOME.clone(), look: HOME_LOOK.clone() };
    }
    if (earth.group) earth.group.updateMatrixWorld(true);
    else earth.mesh.updateMatrixWorld(true);
    const world = new THREE.Vector3();
    earth.mesh.getWorldPosition(world);
    // Guard: unset matrix reads as origin — use orbital angle fallback
    if (world.lengthSq() < 1) {
      const a = earth.angle || EARTH_HOME_ANGLE;
      world.set(Math.cos(a) * orbitAU(1), earth.def ? earth.def.y : 0, Math.sin(a) * orbitAU(1));
    }
    const radial = world.clone();
    if (radial.lengthSq() < 1e-4) radial.set(0, 0, 1);
    else radial.normalize();
    const pos = world
      .clone()
      .addScaledVector(radial, -EARTH_R * 4.6)
      .add(new THREE.Vector3(0, EARTH_R * 2.15, 0));
    return { pos, look: world.clone().add(new THREE.Vector3(0, EARTH_R * 0.12, 0)) };
  }

  function resetFlight() {
    const pose = earthOverlookPose();
    if (flight.walking) exitWalk("reset");
    flight.pos.copy(pose.pos);
    flight.vel.set(0, 0, 0);
    flight.wishSmooth.set(0, 0, 0);
    flight.vertRaw = 0;
    flight.vert = 0;
    flight.surfaceBody = null;
    state.nearSurface = null;
    flight.walking = false;
    flight.walkBody = null;
    flight.takeoffUntil = 0;
    flight.takeoffBoostFrames = 0;
    flight.shellsHoldBody = null;
    flight.fovEaseUntil = 0;
    document.body.dataset.walk = "0";
    if (typeof restoreSpaceEnvironment === "function") restoreSpaceEnvironment();
    const wh = document.getElementById("walk-hint");
    if (wh) wh.textContent = "";
    faceToward(pose.look);
    applyLook();
  }

  function currentGear() {
    return GEARS[state.gearIndex] || GEARS[1];
  }

  function setGear(index, opts) {
    const i = Math.max(0, Math.min(GEARS.length - 1, index | 0));
    const prev = state.gearIndex;
    state.gearIndex = i;
    try {
      localStorage.setItem(LS_GEAR, String(i));
    } catch (_) {}
    syncGearUI();
    syncFlightChip();
    if ((!opts || opts.toast !== false) && prev !== i) {
      const g = GEARS[i];
      guideToast("Gear · " + g.label + " — " + g.hint, 1800);
    }
  }

  function cycleGear(dir) {
    setGear(state.gearIndex + (dir < 0 ? -1 : 1));
  }

  function syncGearUI() {
    const g = currentGear();
    document.querySelectorAll("[data-gear]").forEach((el) => {
      el.classList.toggle("active", el.getAttribute("data-gear") === g.id);
    });
    const chip = $("#gear-chip");
    if (chip) {
      chip.textContent = g.label;
      chip.title = g.hint;
    }
    document.body.dataset.gear = g.id;
  }

  function setStraightMan(on, opts) {
    state.straightMan = !!on;
    try {
      localStorage.setItem(LS_STRAIGHT, state.straightMan ? "1" : "0");
    } catch (_) {}
    document.body.dataset.straightMan = state.straightMan ? "1" : "0";
    const btn = $("#btn-straight");
    if (btn) {
      btn.classList.toggle("active", state.straightMan);
      btn.setAttribute("aria-pressed", state.straightMan ? "true" : "false");
    }
    window.dispatchEvent(
      new CustomEvent("vesper:straight", { detail: { on: state.straightMan } })
    );
    if (state.straightMan) {
      try {
        const route = window.VesperTours && window.VesperTours.active && window.VesperTours.active();
        if (route && route.section === "hypothetics" && window.VesperTours.stop) {
          window.VesperTours.stop("silent");
        }
      } catch (_) {}
      const wb = flight.walking && flight.walkBody ? findBody(flight.walkBody) : null;
      if (wb && bodySolHidden(wb) && wb.mesh) {
        const world = new THREE.Vector3();
        wb.mesh.getWorldPosition(world);
        takeoffLeave(wb, world);
      }
    }
    const travelSel = document.getElementById("travel-select");
    if (travelSel) {
      [...travelSel.options].forEach((o) => {
        if (o.value === "Observation Station" || o.value === "Observation Lounge Annex") {
          o.hidden = !!state.straightMan;
        }
      });
    }
    if (!opts || opts.toast !== false) {
      guideToast(
        state.straightMan
          ? "Sol honesty · Hyp/fiction hidden · radii still display-boosted · some far dots sit inside the almanac a"
          : "Sol + Hyp · fiction stays labeled Hyp — never confused with measured Sol",
        2800
      );
    }
  }

  function modeCfg() {
    const base = MODES[state.mode] || MODES.float;
    const g = currentGear();
    // Hold-to-boost curve: 0→1 over ~0.85s, eases into full boostMul
    const hold = Math.max(0, Math.min(1, state.boostHold / 1.15));
    // Smoothstep ramp — hold-to-boost (not binary)
    const boostCurve = state.boost ? 0.42 + 0.58 * (hold * hold * (3 - 2 * hold)) : 0;
    const boostMulEff = 1 + (base.boostMul - 1) * boostCurve;
    return {
      label: base.label,
      thrust: base.thrust * g.mul,
      boostMul: boostMulEff,
      damp: base.damp,
      lookSens: base.lookSens,
      autoDrift: base.autoDrift,
      maxSpeed: base.maxSpeed * g.maxMul,
      exposureBias: base.exposureBias,
      accelSmooth: base.accelSmooth,
      gear: g,
      boostCurve: boostCurve,
    };
  }


  /**
   * Primary mode (Jobs clarity): Float·Learn vs Pilot·Live — one Sol, two intents.
   * Also sets flight feel (FLOAT/PILOT). Secondary flight buttons remain as override.
   */
  function setProduct(p, opts) {
    if (p !== "learn" && p !== "live") return;
    const prev = state.product;
    state.product = p;
    document.body.dataset.product = p;
    const bl = $("#btn-product-learn");
    const bv = $("#btn-product-live");
    if (bl) bl.classList.toggle("active", p === "learn");
    if (bv) bv.classList.toggle("active", p === "live");
    const chip = $("#product-chip");
    if (chip) {
      chip.textContent = p === "learn" ? "FLOAT·LEARN" : "PILOT·LIVE";
      chip.title =
        p === "learn"
          ? "Float·Learn · planetarium · tours · science honesty · relax"
          : "Pilot·Live · soft-land · docks · crew RPG · quests";
    }
    try {
      localStorage.setItem(LS_PRODUCT, p);
    } catch (_) {}
    // Pair flight feel with product (Kay: one switch, powerful illusion)
    if (!opts || opts.syncFlight !== false) {
      const want = p === "learn" ? "float" : "pilot";
      if (state.mode !== want && !(flight && flight.walking)) {
        setMode(want, { toast: false });
      }
    }
    if ((!opts || opts.toast !== false) && prev !== p) {
      if (p === "learn") {
        guideToast("Float·Learn · radii boosted for skim · some far dots sit inside the almanac a · tours", 2800);
      } else {
        guideToast("Pilot·Live · land into lived-in pads · crew on EVA", 2600);
      }
    }
    if (p === "learn") {
      try {
        ["vesper-inv", "vesper-journal", "vesper-guild", "vesper-codex", "vesper-life-more"].forEach((id) => {
          const el = document.getElementById(id);
          if (el) el.style.display = "none";
        });
        const bar = document.getElementById("vesper-life-bar");
        if (bar) bar.style.display = "none";
      } catch (_) {}
    }
    window.dispatchEvent(new CustomEvent("vesper:product", { detail: { product: p } }));
  }

  function setMode(m, opts) {
    if (!MODES[m]) return;
    const prev = state.mode;
    state.mode = m;
    document.body.dataset.flightMode = m;
    state.modeSwitchGrace = performance.now() + 80;
    const bf = $("#btn-float");
    const bp = $("#btn-pilot");
    if (bf) bf.classList.toggle("active", m === "float");
    if (bp) bp.classList.toggle("active", m === "pilot");
    if (m === "float") {
      if (prev !== "float") {
        flight.vel.multiplyScalar(0.35);
        flight.wishSmooth.multiplyScalar(0.35);
      }
      RIVER.lastInputAt = performance.now(); // start idle timer fresh
      RIVER.active = false;
      if ((!opts || opts.toast !== false) && prev !== m) {
        const prod = state.product === "live" ? "Pilot·Live" : "Float·Learn";
        guideToast("FLOAT on · lazy-river when idle · " + prod + " stays", 2400);
      }
    } else {
      RIVER.active = false;
      if ((!opts || opts.toast !== false) && prev !== m) {
        const prod = state.product === "live" ? "Pilot·Live" : "Float·Learn";
        guideToast("PILOT on · manual 6DOF · " + prod + " stays", 2200);
      }
    }
    try {
      localStorage.setItem(LS_FLIGHT, m);
    } catch (_) {}
    syncFlightChip();
    syncRiverChip();
  }

  /** Mode + live speed (chip was mode-only; speed readout helps deep-space nav). */
  function syncFlightChip() {
    const chip = $("#speed-chip");
    if (!chip) return;
    const sp = flight.vel.length();
    const spLabel = sp < 10 ? sp.toFixed(1) : String(Math.round(sp));
    const cfg = modeCfg();
    const gear = cfg.gear ? cfg.gear.label : "";
    if (flight.walking) {
      const prod = state.product === "live" ? "LIVE" : "LEARN";
      window.VesperPolishCore.setText(chip, "WALK · " + prod + " · " + (flight.walkBody || "") + " · " + spLabel);
      window.VesperPolishCore.setValue(chip, "title", "Lived-in EVA — hangar/cabin/NPCs · " + (isTouch ? "▲ leave" : "Space leaves") + " to " + cfg.label);
      // Mode buttons stay as post-leave preference; mark walking on body for CSS
      document.body.dataset.walk = "1";
    flight.landReady = false;
    flight.landBodyName = null;
    if (typeof syncLandBtn === "function") syncLandBtn();
    } else {
      const prod = state.product === "live" ? "Pilot·Live" : "Float·Learn";
      window.VesperPolishCore.setText(chip, cfg.label + " · " + gear + " · " + spLabel);
      window.VesperPolishCore.setValue(chip, "title",
        prod + " · flight " + cfg.label + " · gear/speed. Same Sol — toggle product row above FLOAT/PILOT.");
      if (document.body.dataset.walk !== "0") document.body.dataset.walk = "0";
    }
  }

  function syncClockUI() {
    const chip = $("#clock-chip");
    const cm = CLOCK_MODES[state.clockMode];
    if (chip && cm) {
      chip.textContent = cm.label;
      // Science honesty: REAL uses Keplerian mean-motion ratios
      chip.title =
        cm.hint +
        " (orbits only)" +
        (state.clockMode === "realtime" ? " · n ∝ a⁻³/² vs Earth" : "");
      chip.dataset.clock = state.clockMode;
    }
    document.querySelectorAll("[data-clock]").forEach((el) => {
      const id = el.getAttribute("data-clock");
      const mode = CLOCK_MODES[id];
      el.classList.toggle("active", id === state.clockMode);
      if (mode) {
        el.title = "Key " + mode.key + " · " + mode.hint;
        el.setAttribute("aria-label", "Clock " + mode.label + ": " + mode.hint);
      }
    });
    document.body.dataset.clockMode = state.clockMode;
  }

  function guideToast(msg, ms) {
    if (window.VesperMessages) window.VesperMessages.show(msg, ms || 2200);
  }

  function setClockMode(id, opts) {
    if (!CLOCK_MODES[id]) return;
    const prev = state.clockMode;
    state.clockMode = id;
    if (id === "paused") {
      // clock pause only — flight still runs unless state.paused
      state.timeScale = 0;
    } else {
      const base = CLOCK_MODES[id].orbitScale;
      // wind-down softens clock slightly without replacing modes
      const windMul = THREE.MathUtils.lerp(1.15, 0.55, state.windDown);
      state.timeScale = base * windMul;
    }
    syncClockUI();
    try {
      localStorage.setItem(LS_CLOCK, id);
    } catch (_) {}
    if ((!opts || opts.toast !== false) && prev !== id) {
      const cm = CLOCK_MODES[id];
      guideToast("Clock · " + cm.label + " — " + cm.hint, 2400);
    }
  }

  function applyClockFromWind() {
    if (state.clockMode === "paused") {
      state.timeScale = 0;
      return;
    }
    const base = CLOCK_MODES[state.clockMode].orbitScale;
    const windMul = THREE.MathUtils.lerp(1.15, 0.55, state.windDown);
    state.timeScale = base * windMul;
  }

  function typingTarget(el) {
    if (!el) return false;
    const tag = (el.tagName || "").toLowerCase();
    return tag === "input" || tag === "textarea" || tag === "select" || el.isContentEditable;
  }

  function performInputAction(action) {
    markFlightInput();
    if (action === "home") { const button = $("#btn-reset"); if (button) button.click(); }
    else if (action === "float" || action === "pilot") setMode(action);
    else if (action === "camera") {
      const mode = (flight.camMode || "chase") === "cockpit" ? "chase" : "cockpit";
      if (window.VesperSky) window.VesperSky.setCamMode(mode);
    } else if (action === "inventory" || action === "journal" || action === "guilds" || action === "codex") {
      const names = { inventory: "toggleInventory", journal: "toggleJournal", guilds: "toggleGuilds", codex: "toggleCodex" };
      const life = window.VesperLife; if (life && life[names[action]]) life[names[action]]();
    } else if (action === "gearDown") setGear(state.gearIndex - 1);
    else if (action === "gearUp") setGear(state.gearIndex + 1);
    else if (action.startsWith("clock")) {
      const modes = { clockPause: "paused", clockReal: "realtime", clockCruise: "cruise", clockFast: "fast", clockCine: "cinematic" };
      setClockMode(modes[action]);
    } else if (action === "sol") setStraightMan(!state.straightMan);
    else if (action === "build") {
      state.buildMode = !state.buildMode;
      document.body.dataset.build = state.buildMode ? "1" : "0";
      if (state.buildMode) input.releasePointer();
      window.dispatchEvent(new CustomEvent("vesper:build", { detail: { on: state.buildMode } }));
      guideToast(state.buildMode ? "Build on - tap places. Erase in the tray removes." : "Build off", 1800);
    } else if (action === "hideMenus") setHideControls(!state.hideControls);
    else if (action === "help") toggleHelp();
    else if (action === "pause") { state.paused = !state.paused; syncPauseUI(); }
    else if (action === "backPanel") {
      setHelp(false); input.releasePointer();
      if (window.VesperLife) window.VesperLife.closeAllPanels();
      const overlay = $("#agent-overlay"); if (overlay) { const close = overlay.querySelector("button[aria-label=\"Close\"]"); if (close) close.click(); else { overlay.classList.remove("open", "show"); document.body.classList.remove("sky-call-open"); } }
      if (state.buildMode) performInputAction("build");
    } else if (action === "landTalk") {
      if (flight.walking && window.VesperLife && window.VesperLife.interactNearby) window.VesperLife.interactNearby();
      else forceSoftLand();
    } else if (action === "travelPrevious" || action === "travelNext") {
      const select = $("#travel-select");
      if (select && select.options.length) {
        const delta = action === "travelNext" ? 1 : -1;
        select.selectedIndex = Math.max(1, Math.min(select.options.length - 1, select.selectedIndex + delta));
        select.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
  }
  const immediateActions = new Set(["home", "float", "pilot", "camera", "inventory", "journal", "guilds", "codex", "gearDown", "gearUp", "clockPause", "clockReal", "clockCruise", "clockFast", "clockCine", "sol", "build", "hideMenus", "help", "pause", "backPanel"]);
  function syncInputBoost() { state.boost = input.held("boost") || !!flight.touchBoost || !!flight.virtualBoost; }
  window.addEventListener("keydown", (e) => {
    if (typingTarget(e.target)) return;
    for (const row of input.list()) if (input.triggered(row.action, e)) {
      markFlightInput();
      if (immediateActions.has(row.action)) { input.pressed(row.action); performInputAction(row.action); }
      if (row.action === "up" || row.action === "takeoff" || row.action === "gearDown" || row.action === "gearUp") e.preventDefault();
    }
    syncInputBoost();
  });
  window.addEventListener("keyup", () => syncInputBoost());
  let padFrame = { move: { x: 0, y: 0 }, look: { x: 0, y: 0 }, vertical: 0, roll: 0 };
  function pollInputPad(dt) {
    let pads = []; try { if (navigator.getGamepads) pads = navigator.getGamepads(); } catch (_) {}
    padFrame = input.pollPads(pads);
    if (padFrame.connected) guideToast("Gamepad connected - left stick moves, right stick looks, Start opens Help.", 2800);
    for (const action of padFrame.pressed) performInputAction(action);
    const mouse = input.settings();
    const cfg = modeCfg();
    flight.lookDelta.yaw -= padFrame.look.x * 360 * dt * cfg.lookSens * mouse.sensitivity;
    flight.lookDelta.pitch -= padFrame.look.y * 360 * dt * cfg.lookSens * mouse.sensitivity * (mouse.invertY ? -1 : 1);
    if (Math.hypot(padFrame.move.x, padFrame.move.y, padFrame.look.x, padFrame.look.y) > 0.02 || Math.abs(padFrame.vertical) > 0.02) markFlightInput();
    syncInputBoost();
  }

  // Pointer look + pinch zoom (canvas only — stick is separate element)
  const el = renderer.domElement;
  el.style.touchAction = "none";
  el.style.userSelect = "none";
  input.connectLook(el, (dx, dy) => {
    const cfg = modeCfg();
    flight.lookDelta.yaw -= dx * cfg.lookSens;
    flight.lookDelta.pitch -= dy * cfg.lookSens;
    if (dx || dy) markFlightInput();
  });

  function pointerDist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  el.addEventListener("pointerdown", (e) => {
    if (e.target.closest && e.target.closest("#hud, #touch-flight, #agent-overlay, #agent-fab, #cinema-exit"))
      return;
    // iOS throws NotFoundError / InvalidStateError when capture is refused.
    // That used to abort before the finger was recorded, so look and pinch never started.
    try { el.setPointerCapture(e.pointerId); } catch (_) {}
    flight.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (flight.pointers.size === 1) {
      flight.dragging = true;
      flight.lookPointerId = e.pointerId;
      flight.lastX = e.clientX;
      flight.lastY = e.clientY;
    } else if (flight.pointers.size === 2) {
      const pts = [...flight.pointers.values()];
      flight.pinchStart = pointerDist(pts[0], pts[1]);
      flight.dragging = false;
    }
  });

  el.addEventListener("pointermove", (e) => {
    if (input.pointerLocked() || !flight.pointers.has(e.pointerId)) return;
    flight.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const cfg = modeCfg();
    if (flight.pointers.size === 2) {
      const pts = [...flight.pointers.values()];
      const d = pointerDist(pts[0], pts[1]);
      if (flight.pinchStart > 0) {
        const delta = d - flight.pinchStart;
        flight.pinchStart = d;
        // Zoom only. Look-drag and the chase framing stay as they are.
        const next = (flight.chaseZoom || 1) * Math.exp(-delta * 0.0032);
        flight.chaseZoom = Math.max(0.45, Math.min(2.6, next));
        if (flight.walking) {
          flight.fovEaseUntil = 0;
          const base = camera.userData.walkFov || 64;
          // Larger chaseZoom is farther (chase cam backs up). Dividing the
          // walk FOV by it zoomed out on a pinch-apart, the opposite of flight.
          camera.fov = THREE.MathUtils.clamp(base * flight.chaseZoom, 36, 80);
          camera.updateProjectionMatrix();
        }
      }
      return;
    }
    if (!flight.dragging || e.pointerId !== flight.lookPointerId) return;
    const dx = e.clientX - flight.lastX;
    const dy = e.clientY - flight.lastY;
    flight.lastX = e.clientX;
    flight.lastY = e.clientY;
    // Accumulate look deltas; applied with smoothing in integrateFlight
    const mouse = input.settings();
    flight.lookDelta.yaw -= dx * cfg.lookSens * mouse.sensitivity;
    flight.lookDelta.pitch -= dy * cfg.lookSens * mouse.sensitivity * (mouse.invertY ? -1 : 1);
    if (dx || dy) markFlightInput();
  });

  function endPointer(e) {
    flight.pointers.delete(e.pointerId);
    if (flight.pointers.size === 0) {
      flight.dragging = false;
      flight.pinchStart = 0;
      flight.lookPointerId = null;
    } else if (flight.pointers.size === 1) {
      const [id, p] = [...flight.pointers.entries()][0];
      flight.dragging = true;
      flight.lookPointerId = id;
      flight.lastX = p.x;
      flight.lastY = p.y;
      flight.pinchStart = 0;
    }
  }
  el.addEventListener("pointerup", endPointer);
  el.addEventListener("pointercancel", endPointer);
  // Capture can fail. A finger that slides off the canvas then lifts never
  // delivers pointerup to the canvas, and the stuck id turned the next touch into a pinch.
  window.addEventListener("pointerup", endPointer);
  window.addEventListener("pointercancel", endPointer);

  el.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const cfg = modeCfg();
      camera.getWorldDirection(_fwd);
      const dir = e.deltaY > 0 ? -1 : 1;
      flight.vel.addScaledVector(_fwd, dir * cfg.thrust * 0.16 * (state.boost ? cfg.boostMul : 1));
    },
    { passive: false }
  );

  // Mobile virtual stick — deadzone + smoothing; look stays on canvas
  const stickBase = $("#stick-base");
  const stickKnob = $("#stick-knob");
  const boostBtn = $("#btn-boost");
  const touchFlight = $("#touch-flight");
  if (isTouch && touchFlight) {
    touchFlight.classList.add("show");
    touchFlight.setAttribute("aria-hidden", "false");
  }

  function setStickUI(x, y) {
    if (!stickKnob) return;
    const max = 36;
    stickKnob.style.transform = `translate(${x * max}px, ${y * max}px)`;
  }


  if (stickBase) {
    let stickId = null;
    const updateStick = (clientX, clientY) => {
      const rect = stickBase.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = (clientX - cx) / (rect.width * 0.48);
      let dy = (clientY - cy) / (rect.height * 0.48);
      const dz = input.shapeStick(dx, dy, STICK_DEADZONE);
      flight.stickRaw.x = dz.x;
      flight.stickRaw.y = dz.y;
      setStickUI(dz.x, dz.y);
    };
    stickBase.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      stickId = e.pointerId;
      try { stickBase.setPointerCapture(e.pointerId); } catch (_) {}
      updateStick(e.clientX, e.clientY);
      markFlightInput();
    });
    stickBase.addEventListener("pointermove", (e) => {
      if (e.pointerId !== stickId) return;
      e.preventDefault();
      e.stopPropagation();
      updateStick(e.clientX, e.clientY);
      markFlightInput();
    });
    const endStick = (e) => {
      if (e.pointerId !== stickId) return;
      stickId = null;
      flight.stickRaw.x = 0;
      flight.stickRaw.y = 0;
      setStickUI(0, 0);
    };
    stickBase.addEventListener("pointerup", endStick);
    stickBase.addEventListener("pointercancel", endStick);
    // Do not zero on lostpointercapture. iOS drops capture while the finger
    // is still down, which made the stick feel dead. pointerup/cancel release it.
    // If capture was refused, the lift can land outside the stick and the
    // element never hears it. Window still does. endStick ignores other ids.
    window.addEventListener("pointerup", endStick);
    window.addEventListener("pointercancel", endStick);
  }

  let boostPointerId = null;
  function setBoostHeld(on, pointerId) {
    flight.touchBoost = !!on;
    syncInputBoost();
    if (boostBtn) boostBtn.classList.toggle("active", !!on);
    boostPointerId = on ? (pointerId != null ? pointerId : true) : null;
    if (on) markFlightInput();
  }
  function releaseBoost() {
    setBoostHeld(false);
  }
  if (boostBtn) {
    boostBtn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        boostBtn.setPointerCapture(e.pointerId);
      } catch (_) {}
      setBoostHeld(true, e.pointerId);
    });
    const endB = (e) => {
      if (boostPointerId == null) return;
      if (e && e.pointerId != null && boostPointerId !== e.pointerId && boostPointerId !== true)
        return;
      try {
        if (e && boostBtn.hasPointerCapture && boostBtn.hasPointerCapture(e.pointerId))
          boostBtn.releasePointerCapture(e.pointerId);
      } catch (_) {}
      setBoostHeld(false);
    };
    boostBtn.addEventListener("pointerup", endB);
    boostBtn.addEventListener("pointercancel", endB);
    // Capture can fail. A lift outside the button never reached endB, so boost stuck on.
    window.addEventListener("pointerup", endB);
    window.addEventListener("pointercancel", endB);
    boostBtn.addEventListener("pointerleave", (e) => {
      if (boostBtn.hasPointerCapture && e && boostBtn.hasPointerCapture(e.pointerId)) return;
      if (boostPointerId != null) endB(e);
    });
    // Same as the stick: lostpointercapture on iOS is not a finger-up.
  }


  function walkEyeHeight(radius) {
    // Tiny person on huge bodies; never taller than ~1.2% of radius on small rocks
    const byFrac = radius * WALK.eyeFrac;
    const capped = Math.min(PERSON_EYE, Math.max(WALK.eyeMin, byFrac));
    return Math.min(capped, radius * 0.012);
  }

  function bodyWorldMatrix(b) {
    if (b.group) {
      b.group.updateMatrixWorld(true);
      return b.group.matrixWorld;
    }
    b.mesh.updateMatrixWorld(true);
    return b.mesh.matrixWorld;
  }


  /** Per-body surface environment — skies that match the world (not washed space cyan). */
  const SURFACE_ENV = {
    Earth: { bg: 0x163e72, fog: 0x245888, density: 0.000035, stars: 0.45, deep: 0.22, haze: 0x3d78a8 },
    Venus: { bg: 0xc8a060, fog: 0xe0c080, density: 0.0009, stars: 0, deep: 0, haze: 0xffe0a0 },
    Mars: { bg: 0x7a3828, fog: 0xa05038, density: 0.00022, stars: 0.35, deep: 0.15, haze: 0xc07048 },
    Moon: { bg: 0x000104, fog: 0x010208, density: 0.0000015, stars: 1, deep: 1, haze: 0x060810 },
    Mercury: { bg: 0x08060a, fog: 0x100c10, density: 0.00001, stars: 1, deep: 1, haze: 0x181410 },
    Io: { bg: 0x12080a, fog: 0x201010, density: 0.00002, stars: 0.9, deep: 0.85, haze: 0x402018 },
    Europa: { bg: 0x040812, fog: 0x081018, density: 0.000012, stars: 1, deep: 1, haze: 0x101828 },
    Ganymede: { bg: 0x06080e, fog: 0x0a0c14, density: 0.000012, stars: 1, deep: 1, haze: 0x12141c },
    Callisto: { bg: 0x050508, fog: 0x08080c, density: 0.00001, stars: 1, deep: 1, haze: 0x101014 },
    Titan: { bg: 0x3a2818, fog: 0x6a4828, density: 0.0007, stars: 0.05, deep: 0, haze: 0xa07040 },
    Enceladus: { bg: 0x040810, fog: 0x081018, density: 0.00001, stars: 1, deep: 1, haze: 0x101828 },
    Triton: { bg: 0x050a12, fog: 0x0a121c, density: 0.000015, stars: 1, deep: 1, haze: 0x121c28 },
    Pluto: { bg: 0x06050a, fog: 0x0c0a12, density: 0.000012, stars: 1, deep: 1, haze: 0x141018 },
    Ceres: { bg: 0x050508, fog: 0x0a0a0e, density: 0.00001, stars: 1, deep: 1, haze: 0x121214 },
    Vesta: { bg: 0x08060a, fog: 0x100c10, density: 0.00001, stars: 1, deep: 1, haze: 0x181410 },
    Pallas: { bg: 0x08080c, fog: 0x0c0c12, density: 0.00001, stars: 1, deep: 1, haze: 0x141418 },
    Quaoar: { bg: 0x0a080c, fog: 0x120e14, density: 0.00001, stars: 1, deep: 1, haze: 0x1a1418 },
    Haumea: { bg: 0x0a0c12, fog: 0x10141c, density: 0.00001, stars: 1, deep: 1, haze: 0x181c28 },
    Makemake: { bg: 0x0c0a08, fog: 0x14120e, density: 0.00001, stars: 1, deep: 1, haze: 0x1c1810 },
    Eris: { bg: 0x080a10, fog: 0x0c1018, density: 0.00001, stars: 1, deep: 1, haze: 0x141820 },
    Charon: { bg: 0x06060a, fog: 0x0a0a10, density: 0.00001, stars: 1, deep: 1, haze: 0x121218 },
    Phobos: { bg: 0x010104, fog: 0x020208, density: 0.000002, stars: 1, deep: 1, haze: 0x0a0a10 },
    Deimos: { bg: 0x010104, fog: 0x020208, density: 0.000002, stars: 1, deep: 1, haze: 0x0a0a10 },
    Mimas: { bg: 0x06080c, fog: 0x0a0c12, density: 0.00001, stars: 1, deep: 1, haze: 0x12141a },
    Tethys: { bg: 0x06080e, fog: 0x0a0e16, density: 0.00001, stars: 1, deep: 1, haze: 0x121820 },
    Dione: { bg: 0x06080e, fog: 0x0a0e14, density: 0.00001, stars: 1, deep: 1, haze: 0x12161c },
    Rhea: { bg: 0x06080c, fog: 0x0a0c14, density: 0.00001, stars: 1, deep: 1, haze: 0x12161a },
    Iapetus: { bg: 0x08060a, fog: 0x100c10, density: 0.00001, stars: 1, deep: 1, haze: 0x181410 },
    Miranda: { bg: 0x06080e, fog: 0x0a1018, density: 0.00001, stars: 1, deep: 1, haze: 0x121820 },
    Ariel: { bg: 0x06080e, fog: 0x0a1016, density: 0.00001, stars: 1, deep: 1, haze: 0x12181e },
    Umbriel: { bg: 0x05060a, fog: 0x080a10, density: 0.00001, stars: 1, deep: 1, haze: 0x101218 },
    Titania: { bg: 0x06080e, fog: 0x0a0e16, density: 0.00001, stars: 1, deep: 1, haze: 0x121820 },
    Oberon: { bg: 0x06080c, fog: 0x0a0c14, density: 0.00001, stars: 1, deep: 1, haze: 0x12161a },
    "Observation Station": { bg: 0x0a1018, fog: 0x152030, density: 0.00008, stars: 0.6, deep: 0.5, haze: 0x304050 },
    Phaeton: { bg: 0x0a0808, fog: 0x141010, density: 0.000015, stars: 1, deep: 1, haze: 0x1c1814 },
    Theia: { bg: 0x0a0808, fog: 0x141210, density: 0.000012, stars: 1, deep: 1, haze: 0x1a1612 },
    Vulcan: { bg: 0x1a0a06, fog: 0x401808, density: 0.00004, stars: 0.7, deep: 0.5, haze: 0x602010 },
    "Counter-Earth": { bg: 0x2470b0, fog: 0x3a78b0, density: 0.00007, stars: 0.2, deep: 0.14, haze: 0x6a9cc8 },
    "Counter-Luna": { bg: 0x010208, fog: 0x02040a, density: 0.000008, stars: 1, deep: 1, haze: 0x101018 },
    Sedna: { bg: 0x0a0608, fog: 0x140c10, density: 0.00001, stars: 1, deep: 1, haze: 0x1c1014 },
    Gonggong: { bg: 0x0a0608, fog: 0x140c10, density: 0.00001, stars: 1, deep: 1, haze: 0x1c1014 },
    Psyche: { bg: 0x080a0c, fog: 0x101418, density: 0.00001, stars: 1, deep: 1, haze: 0x181c20 },
    Eros: { bg: 0x0a0808, fog: 0x141010, density: 0.00001, stars: 1, deep: 1, haze: 0x1c1814 },
    Halley: { bg: 0x040810, fog: 0x081018, density: 0.000012, stars: 1, deep: 1, haze: 0x101828 },
    "Starman Roadster": { bg: 0x03050c, fog: 0x050810, density: 0.000006, stars: 1, deep: 1, haze: 0x101418 },
    ISS: { bg: 0x0a1018, fog: 0x152030, density: 0.00006, stars: 0.7, deep: 0.55, haze: 0x304860 },
    Tiangong: { bg: 0x0a1018, fog: 0x152030, density: 0.00006, stars: 0.7, deep: 0.55, haze: 0x304860 },
    JWST: { bg: 0x05060c, fog: 0x0a0c14, density: 0.00001, stars: 1, deep: 1, haze: 0x12141c },
    Hubble: { bg: 0x05060c, fog: 0x0a0c14, density: 0.00001, stars: 1, deep: 1, haze: 0x12141c },
    "Luna Gateway": { bg: 0x0a1018, fog: 0x152030, density: 0.00005, stars: 0.75, deep: 0.6, haze: 0x304860 },
    Jupiter: { bg: 0x3a2818, fog: 0x6a4830, density: 0.0004, stars: 0.05, deep: 0, haze: 0xa07040 },
    Saturn: { bg: 0x3a3020, fog: 0x6a5840, density: 0.00035, stars: 0.08, deep: 0.05, haze: 0xb09060 },
    Uranus: { bg: 0x183038, fog: 0x285058, density: 0.0003, stars: 0.1, deep: 0.05, haze: 0x508088 },
    Neptune: { bg: 0x102040, fog: 0x183060, density: 0.0003, stars: 0.1, deep: 0.05, haze: 0x305090 },
    defaultAtmo: { bg: 0x406080, fog: 0x6080a0, density: 0.00025, stars: 0.2, deep: 0.1, haze: 0x80a0c0 },
    defaultVac: { bg: 0x020308, fog: 0x040510, density: 0.000008, stars: 1, deep: 1, haze: 0x080a12 },
  };
  const _spaceBg = new THREE.Color(0x050714);
  const _spaceFog = new THREE.Color(0x040510);
  let _spaceFogDensity = 0.0000045 / SPEED_MUL;
  let _surfaceEnvOn = false;

  function nameHasWord(name, word) {
    // Whole token only. "Hearth" is not Earth. "Larissa" is not ISS. "Titania" is not Titan.
    return new RegExp("(?:^|[^A-Za-z0-9])" + word + "(?:[^A-Za-z0-9]|$)", "i").test(name || "");
  }

  function surfaceEnvFor(name) {
    if (SURFACE_ENV[name]) return SURFACE_ENV[name];
    // Fiction twins keep their own sky. A later Earth/Luna word must not catch them.
    if (/Counter-Earth/i.test(name)) return SURFACE_ENV["Counter-Earth"] || SURFACE_ENV.defaultVac;
    if (/Counter-Luna/i.test(name)) return SURFACE_ENV["Counter-Luna"] || SURFACE_ENV.defaultVac;
    let token = null;
    if (nameHasWord(name, "Earth")) token = SURFACE_ENV.Earth;
    else if (nameHasWord(name, "Mars")) token = SURFACE_ENV.Mars;
    else if (nameHasWord(name, "Titan")) token = SURFACE_ENV.Titan;
    else if (nameHasWord(name, "Venus")) token = SURFACE_ENV.Venus;
    else if (nameHasWord(name, "Moon") || nameHasWord(name, "Luna") || nameHasWord(name, "Phobos") || nameHasWord(name, "Deimos")) {
      token = SURFACE_ENV.Moon;
    } else if (
      // "Juno" the probe is the craft sky. "Juno Assay Bench" is a belt desk.
      nameHasWord(name, "ISS") || nameHasWord(name, "Tiangong") || nameHasWord(name, "Gateway") ||
      nameHasWord(name, "Hubble") || nameHasWord(name, "JWST") || nameHasWord(name, "Voyager") ||
      name === "Juno" || nameHasWord(name, "Cassini") || nameHasWord(name, "Parker") ||
      nameHasWord(name, "Curiosity") || nameHasWord(name, "Horizons")
    ) {
      token = SURFACE_ENV.ISS || SURFACE_ENV.defaultVac;
    }
    if (token) {
      const b = findBody(name);
      // A place hub is not the world named in its title. Earth–Moon L5 is a
      // free station. Luna Gateway Hub belongs to the station, not the Moon.
      if (b && b.userData && b.userData.placeHub) {
        const parent = b.group && b.group.userData && b.group.userData.followBody;
        if (parent && SURFACE_ENV[parent]) return SURFACE_ENV[parent];
        return SURFACE_ENV.defaultVac;
      }
      return token;
    }
    // Bodies with atmo flag in defs — fallthrough
    const b = findBody(name);
    if (b && b.def && b.def.atmo) return SURFACE_ENV.defaultAtmo;
    return SURFACE_ENV.defaultVac;
  }


  let _walkFill = null;
  function ensureWalkFill() {
    if (_walkFill) return _walkFill;
    _walkFill = VesperNoLight(0xd0e8ff, 0);
    scene.add(_walkFill);
    return _walkFill;
  }
  function hideBodyShells(host) {
    if (!host || !host.group) return;
    host.group.traverse((ch) => {
      const ud = ch.userData || {};
      if (ud.isBodySurface || ch.name === "bodySurface") {
        ch.visible = true;
        return;
      }
      const hide =
        ud.isCloudDetail ||
        ud.isAtmosphere ||
        ud.isBandDetail ||
        ch.name === "atmosphere" ||
        ch.name === "clouds" ||
        (ch.isMesh &&
          ch.material &&
          ch.material.blending === THREE.AdditiveBlending &&
          ch.material.transparent);
      if (hide) {
        ud._walkHidden = true;
        ch.userData = ud;
        ch.visible = false;
      }
    });
  }

  function applySurfaceEnvironment(name) {
    const env = surfaceEnvFor(name);
    const host = findBody(name);
    // Hide shells FIRST — prevents one-frame white wash before sky swaps
    hideBodyShells(host);
    if (host && host.mesh && host.mesh.material && host.mesh.material.emissiveIntensity != null) {
      if (host.mesh.userData._walkEmissive == null) {
        host.mesh.userData._walkEmissive = host.mesh.material.emissiveIntensity;
      }
      host.mesh.material.emissiveIntensity = Math.min(
        0.55,
        (host.mesh.material.emissiveIntensity || 0) + 0.18
      );
    }
    scene.background = new THREE.Color(env.bg);
    if (scene.fog && scene.fog.isFogExp2) {
      scene.fog.color.setHex(env.fog);
      scene.fog.density = env.density;
    }
    if (stars && stars.material) {
      stars.material.opacity = env.stars;
      stars.visible = env.stars > 0.02;
    }
    if (window.__vesperDeepSky) {
      const ds = window.__vesperDeepSky;
      if (ds.group) ds.group.visible = env.deep > 0.2;
      if (ds.setBeauty) ds.setBeauty(Math.max(0.05, env.deep));
    }
    if (skyDome) skyDome.visible = env.deep > 0.35;
    const fill = ensureWalkFill();
    fill.color.setHex(env.haze || env.bg);
    fill.groundColor.setHex(env.fog);
    const vac = env.stars >= 0.85 && env.density < 0.00005;
    fill.intensity = vac ? 0.22 : 0.32;
    _surfaceEnvOn = true;
    document.body.dataset.surface = name || "1";
  }

  function restoreBodyShells(exceptName) {
    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i];
      if (!b.group) continue;
      if (exceptName && b.name === exceptName) continue;
      b.group.traverse((ch) => {
        if (ch.userData && ch.userData._walkHidden) {
          ch.visible = true;
          ch.userData._walkHidden = false;
        }
      });
      if (b.mesh && b.mesh.userData && b.mesh.userData._walkEmissive != null && b.mesh.material) {
        b.mesh.material.emissiveIntensity = b.mesh.userData._walkEmissive;
        delete b.mesh.userData._walkEmissive;
      }
    }
  }

  function restoreSpaceEnvironment(opts) {
    opts = opts || {};
    // Explicit dark space — never inherit washed surface fog/bg (white void bug)
    scene.background = new THREE.Color(0x050714);
    if (renderer && renderer.setClearColor) renderer.setClearColor(0x050714, 1);
    if (scene.fog && scene.fog.isFogExp2) {
      scene.fog.color.setHex(0x03050c);
      scene.fog.density = 0.0000035 / SPEED_MUL;
    }
    if (stars) {
      stars.visible = true;
      if (stars.material) stars.material.opacity = 1;
    }
    if (window.__vesperDeepSky) {
      const ds = window.__vesperDeepSky;
      if (ds.group) ds.group.visible = true;
      if (ds.setBeauty) ds.setBeauty(1);
    }
    if (skyDome) skyDome.visible = true;
    if (_walkFill) _walkFill.intensity = 0;
    // Hold host shells hidden until clear of atmo (avoids leave white-flash)
    const hold = opts.holdShellsFor || null;
    restoreBodyShells(hold);
    if (hold) flight.shellsHoldBody = hold;
    else flight.shellsHoldBody = null;
    _surfaceEnvOn = false;
    document.body.dataset.surface = "";
  }

  /** Release held shells once outside ~1.28R (or cooldown). */
  function maybeReleaseHeldShells() {
    const name = flight.shellsHoldBody;
    if (!name) return;
    const b = findBody(name);
    if (!b || !b.mesh) {
      restoreBodyShells(null);
      flight.shellsHoldBody = null;
      return;
    }
    b.mesh.getWorldPosition(_tmpV);
    const dist = flight.pos.distanceTo(_tmpV);
    const clear = dist > b.radius * 1.28 || performance.now() >= (flight.takeoffUntil || 0);
    if (clear) {
      restoreBodyShells(null);
      flight.shellsHoldBody = null;
    }
  }

  function bodyIsFiction(b) {
    if (!b) return false;
    if (b.hypothetic) return true;
    if (/\(Hyp\)/.test(b.name || "")) return true;
    try {
      const hn = window.VesperHypothetics && window.VesperHypothetics.names && window.VesperHypothetics.names();
      if (hn && hn.indexOf(b.name) >= 0) return true;
    } catch (_) {}
    return false;
  }

  function bodySolHidden(b) {
    if (!b) return false;
    if (b.straightHide) return true;
    if (b.name === "Observation Station" || b.name === "Observation Lounge Annex") return true;
    return bodyIsFiction(b);
  }

  function solHideToast(b) {
    return bodyIsFiction(b) ? "Fiction hidden · Sol is on" : "Hidden while Sol is on";
  }

  function forceSoftLand() {
    if (flight.walking) return false;
    if (performance.now() < (flight.takeoffUntil || 0)) {
      guideToast("Still leaving — wait a beat", 1400);
      return false;
    }
    let best = null, bestAlt = Infinity, bestW = null;
    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i];
      if (b.name === "Sun" || b.skimOnly || b.walkable === false) continue;
      b.mesh.getWorldPosition(_tmpV);
      const dist = flight.pos.distanceTo(_tmpV);
      const alt = dist - b.radius;
      const hover = bodyHover(b.radius);
      if (alt < hover * 5 && alt < bestAlt) {
        bestAlt = alt;
        best = b;
        bestW = _tmpV.clone();
      }
    }
    if (!best || !bestW) {
      guideToast("Too far to soft-land — approach a world / hub", 2200);
      return false;
    }
    // Kill speed and plant
    flight.vel.set(0, 0, 0);
    _tmpN.copy(flight.pos).sub(bestW).normalize();
    const eye = walkEyeHeight(best.radius);
    flight.pos.copy(bestW).addScaledVector(_tmpN, best.radius + eye * 1.1);
    return enterWalk(best, bestW);
  }

  function faceHangarMouth() {
    let surfaceRoot = null;
    scene.traverse((ch) => {
      if (ch.name === "vesper-surface-detail") surfaceRoot = ch;
    });
    if (!surfaceRoot) return;
    surfaceRoot.updateMatrixWorld(true);
    const dir = new THREE.Vector3(0, 0, -1).transformDirection(surfaceRoot.matrixWorld);
    const up = new THREE.Vector3(0, 1, 0).transformDirection(surfaceRoot.matrixWorld);
    // The pad's forward is a sphere tangent. It is not world-horizontal.
    // Writing pitch = 0.06 threw that tangent away and aimed at empty sky
    // (the phone's blue landing). Bias a little along the surface normal
    // so the eye clears the floor without leaving the bay.
    faceToward(flight.pos.clone().add(dir).addScaledVector(up, 0.18));
  }

  function enterWalk(b, worldCenter) {
    if (!b) return false;
    // Sun: skim-only — never plant walk
    if (b.name === "Sun" || b.skimOnly || b.walkable === false) {
      if (b.name === "Sun" || b.skimOnly) {
        guideToast("Sun · soft-skim only — too hot to walk", 2200);
      }
      return false;
    }
    if (state.straightMan && bodySolHidden(b)) {
      guideToast(solHideToast(b), 2000);
      return false;
    }
    // Clear any leave hold on this body
    if (flight.shellsHoldBody === b.name) flight.shellsHoldBody = null;
    flight.walking = true;
    flight.walkBody = b.name;
    flight.walkEye = walkEyeHeight(b.radius);
    _walkN.copy(flight.pos).sub(worldCenter);
    if (_walkN.lengthSq() < 1e-10) _walkN.set(0, 1, 0);
    else _walkN.normalize();
    // Plant at eye — soft collisions should already be near this height
    flight.pos.copy(worldCenter).addScaledVector(_walkN, b.radius + flight.walkEye);
    _walkMatInv.copy(bodyWorldMatrix(b)).invert();
    flight.walkLocal.copy(flight.pos).applyMatrix4(_walkMatInv);
    flight.vel.set(0, 0, 0);
    flight.wishSmooth.set(0, 0, 0);
    flight.vertRaw = 0;
    flight.vert = 0;
    state.nearSurface = b.name;
    flight.surfaceBody = b.name;
    document.body.dataset.walk = "1";
    // Horizon bias — don't stare into crust on plant
    flight.pitch = THREE.MathUtils.clamp(flight.pitch, -0.35, 0.85);
    if (flight.pitch < -0.08) flight.pitch = -0.05;
    flight.roll *= 0.25;
    // FOV ease toward walk (applied in integrateWalk)
    flight.fovEaseFrom = camera.fov;
    flight.fovEaseTo = camera.userData.walkFov || 64;
    flight.fovEaseSpan = 380;
    flight.fovEaseUntil = performance.now() + flight.fovEaseSpan;
    applySurfaceEnvironment(b.name); // hides shells first
    if (window.VesperSurfaces && window.VesperSurfaces.attach) {
      try {
        window.VesperSurfaces.attach(b.name, b.radius, flight.walkEye);
        window.VesperSurfaces.sync(flight.pos, _walkN);
      } catch (e) {
        console.warn("[vesper-surfaces]", e);
      }
    }
    if (window.VesperWalkFx && window.VesperWalkFx.ensure) {
      try {
        window.VesperWalkFx.ensure(THREE, scene);
      } catch (_) {}
    }
    if (window.VesperWalkAudio && window.VesperWalkAudio.start) {
      try {
        const bio =
          (window.VesperSurfaces && window.VesperSurfaces.biomeFor && window.VesperSurfaces.biomeFor(b.name)) ||
          "rock";
        window.VesperWalkAudio.start(bio);
      } catch (_) {}
    }
    // Park ship OFFSET from EVA feet so craft stays visible & stationary
    if (window.VesperShip && window.VesperShip.parkAt) {
      try {
        const park = flight.pos.clone();
        // The old offset used the cruise camera's right vector. That can
        // be the bay axis, so the eye looks straight into the chin.
        // Park on the pad's +X, behind the mouth (-Z is the hangar).
        let surfaceRoot = null;
        scene.traverse((ch) => {
          if (ch.name === "vesper-surface-detail") surfaceRoot = ch;
        });
        if (surfaceRoot) {
          surfaceRoot.updateMatrixWorld(true);
          const side = new THREE.Vector3(1, 0, 0).transformDirection(surfaceRoot.matrixWorld);
          const back = new THREE.Vector3(0, 0, 1).transformDirection(surfaceRoot.matrixWorld);
          park.addScaledVector(side, 6.5).addScaledVector(back, 3.2);
        } else {
          park.addScaledVector(_walkN, 2.2);
        }
        window.VesperShip.parkAt(park, camera.quaternion);
      } catch (_) {
        try { window.VesperShip.parkAt(flight.pos, camera.quaternion); } catch (e2) {}
      }
    }
    // AFTER surface exists — life/places spawn lived-in hubs
    try {
      window.dispatchEvent(new CustomEvent("vesper:walk", { detail: { body: b && b.name } }));
    } catch (_) {}
    let honest = "";
    if (b.name === "Venus") honest = "Display fiction — real surface would crush a suit. ";
    else if (b.name === "Jupiter" || b.name === "Saturn" || b.name === "Uranus" || b.name === "Neptune") honest = "Cloud-deck walk is display fiction. ";
    else if (b.name === "Starman Roadster") honest = "Educational replica · eccentric path, not a brand ad. ";
    let hypLand = !!(b && b.hypothetic);
    try {
      const hn = window.VesperHypothetics && window.VesperHypothetics.names && window.VesperHypothetics.names();
      if (hn && hn.indexOf(b.name) >= 0) hypLand = true;
    } catch (_) {}
    const hypBit = hypLand ? "Hyp fiction · " : "";
    const leaveHow = isTouch ? "hold ▲ to leave" : "Space to leave";
    guideToast(hypBit + honest + "On the pad · " + b.name + " — hangar is ahead, cabin beside it · " + leaveHow, 4200);
    const wh = document.getElementById("walk-hint");
    if (wh) wh.textContent = hypBit + honest + "On " + b.name + " · hangar ahead · cabin beside the pad · " + leaveHow;
    try { faceHangarMouth(); } catch (_) {}
    return true;
  }

  function exitWalk(reason) {
    if (!flight.walking) return;
    const name = flight.walkBody;
    flight.walking = false;
    flight.walkBody = null;
    // CRITICAL: do NOT clear takeoffUntil on takeoff — leave() just armed the cooldown
    if (reason !== "takeoff") flight.takeoffUntil = 0;
    document.body.dataset.walk = "0";
    // Capture look from current cam before resetting up (kills roll jank)
    try {
      _flightEuler.setFromQuaternion(camera.quaternion, "YXZ");
      flight.yaw = _flightEuler.y;
      flight.pitch = THREE.MathUtils.clamp(_flightEuler.x, -1.35, 1.35);
      flight.roll = 0;
    } catch (_) {}
    camera.up.set(0, 1, 0);
    flight.fovEaseFrom = camera.fov;
    flight.fovEaseTo = camera.userData.baseFov || 58;
    flight.fovEaseSpan = WALK.leaveBlendMs || 420;
    flight.fovEaseUntil = performance.now() + flight.fovEaseSpan;
    if (window.VesperSurfaces && window.VesperSurfaces.detach) {
      try {
        window.VesperSurfaces.detach();
      } catch (_) {}
    }
    if (window.VesperWalkFx && window.VesperWalkFx.detach) {
      try {
        window.VesperWalkFx.detach();
      } catch (_) {}
    }
    if (window.VesperWalkAudio && window.VesperWalkAudio.stop) {
      try {
        window.VesperWalkAudio.stop();
      } catch (_) {}
    }
    // Dark space now; keep host shells hidden until clear of atmo
    restoreSpaceEnvironment({ holdShellsFor: reason === "takeoff" ? name : null });
    const wh = document.getElementById("walk-hint");
    if (wh) wh.textContent = "";
    // Any leave puts you back in flight. Home, a lost pad, and a desync
    // used to leave the hull parked on the last world.
    if (window.VesperShip && window.VesperShip.reboard) {
      try { window.VesperShip.reboard(flight); } catch (_) {}
    }
    if (reason === "takeoff") {
      guideToast("Takeoff · leaving " + (name || "surface") + " · ship live", 1600);
    }
  }

  function findBodyByName(name) {
    return findBody(name);
  }

  function easeFovToward() {
    const until = flight.fovEaseUntil || 0;
    if (!until) return;
    const now = performance.now();
    const span = Math.max(1, flight.fovEaseSpan || WALK.leaveBlendMs || 400);
    const t0 = until - span;
    const u = THREE.MathUtils.clamp((now - t0) / span, 0, 1);
    const s = u * u * (3 - 2 * u);
    const fov = THREE.MathUtils.lerp(flight.fovEaseFrom || camera.fov, flight.fovEaseTo || camera.fov, s);
    if (Math.abs(camera.fov - fov) > 0.05) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    if (u >= 1) {
      flight.fovEaseUntil = 0;
      camera.fov = flight.fovEaseTo;
      camera.updateProjectionMatrix();
    }
  }


  /** Reliable leave-surface: eject beyond soft plant + atmo, cooldown, dark space. */
  function takeoffLeave(b, worldCenter) {
    if (!b || !flight.walking) return false;
    const radius = b.radius || 1;
    const hover = bodyHover(radius);
    _walkN.copy(flight.pos).sub(worldCenter);
    if (_walkN.lengthSq() < 1e-8) _walkN.set(0, 1, 0);
    else _walkN.normalize();

    // Clear soft plant + outer atmo (~1.2R) with a bit of headroom
    const clearAlt = Math.max(
      hover * 6,
      radius * (WALK.takeoffRadiusFrac || 0.48),
      radius * 0.32,
      PERSON_EYE * 90
    );
    // Two-step feel: lift to mid then kick — still one frame, but mid clears crust first
    const midAlt = Math.max(hover * 1.2, radius * 0.06, PERSON_EYE * 12);
    flight.pos.copy(worldCenter).addScaledVector(_walkN, radius + midAlt);
    // Hide shells while still near (before space sky)
    hideBodyShells(b);
    flight.pos.copy(worldCenter).addScaledVector(_walkN, radius + clearAlt);

    const impulse = Math.max(
      WALK.takeoffImpulse,
      radius * 0.6,
      hover * 16
    ) * (state.boost ? 1.55 : 1);
    flight.vel.copy(_walkN).multiplyScalar(impulse);
    flight.wishSmooth.set(0, 0, 0);
    // Nudge look slightly up along leave so we don't stare into crust
    flight.pitch = THREE.MathUtils.clamp(flight.pitch + 0.12, -1.2, 1.2);
    const coolMs = WALK.takeoffCooldownMs || 3200;
    flight.takeoffUntil = performance.now() + coolMs;

    exitWalk("takeoff");
    flight.takeoffUntil = performance.now() + coolMs;
    state.nearSurface = null;
    flight.surfaceBody = null;
    flight.takeoffBoostFrames = 24;
    markFlightInput();
    flight.vertRaw = 0;
    flight.vert = 0;
    return true;
  }

  /** Keep planted on moving body; tangent walk from stick/keys. */
  function integrateWalk(dt) {
    const b = findBody(flight.walkBody);
    if (!b || !b.mesh) {
      exitWalk("lost");
      return;
    }
    b.mesh.getWorldPosition(_walkBody);
    const mat = bodyWorldMatrix(b);
    const radius = b.radius;
    const eye = flight.walkEye;

    // Takeoff: thrust pad, boost, or Space. E is talk/pickup on the
    // ground (and the Skytape on the station). It was also KeyE here,
    // so one press left the surface before the talk could finish.
    const movement = input.movement();
    const upWish =
      (flight.vertRaw + padFrame.vertical) > WALK.takeoffVert ||
      input.held("takeoff") ||
      state.boost;
    if (upWish) {
      takeoffLeave(b, _walkBody);
      return;
    }

    // Camera axes, then project onto tangent plane
    _flightEuler.set(flight.pitch, flight.yaw, flight.roll, "YXZ");
    camera.quaternion.setFromEuler(_flightEuler);
    camera.getWorldDirection(_fwd);
    _right.set(1, 0, 0).applyQuaternion(camera.quaternion);

    // Smooth look still applies
    const la = 1 - Math.exp(-LOOK_SMOOTH * dt);
    flight.yaw += flight.lookDelta.yaw * la;
    flight.pitch += flight.lookDelta.pitch * la;
    flight.lookDelta.yaw *= 1 - la;
    flight.lookDelta.pitch *= 1 - la;
    flight.pitch = THREE.MathUtils.clamp(flight.pitch, -1.35, 1.35);

    // Rebuild after look
    _flightEuler.set(flight.pitch, flight.yaw, flight.roll, "YXZ");
    camera.quaternion.setFromEuler(_flightEuler);
    camera.getWorldDirection(_fwd);
    _right.set(1, 0, 0).applyQuaternion(camera.quaternion);

    // Current radial from body center (world)
    // Use local→world each frame so orbital motion carries the walker
    flight.pos.copy(flight.walkLocal).applyMatrix4(mat);
    _walkN.copy(flight.pos).sub(_walkBody);
    let nlen = _walkN.length();
    if (nlen < 1e-6) {
      _walkN.set(0, 1, 0);
      nlen = 1;
    } else {
      _walkN.multiplyScalar(1 / nlen);
    }
    // Integrity: if desynced far above crust (bad matrix / hyp replace), re-plant or bail
    const altIntegrity = nlen - radius;
    if (altIntegrity > Math.max(radius * 0.08, eye * 40) || altIntegrity < -eye * 2) {
      if (_walkN.lengthSq() < 1e-8) _walkN.set(0, 1, 0);
      flight.pos.copy(_walkBody).addScaledVector(_walkN, radius + eye);
      // if still absurd vs body world (e.g. NaN), exit walk
      if (!Number.isFinite(flight.pos.x) || flight.pos.distanceTo(_walkBody) > radius * 1.2) {
        exitWalk("desync");
        return;
      }
      _walkMatInv.copy(mat).invert();
      flight.walkLocal.copy(flight.pos).applyMatrix4(_walkMatInv);
      _walkN.copy(flight.pos).sub(_walkBody).normalize();
    }
    if (window.VesperSurfaces && window.VesperSurfaces.padNear && window.VesperSurfaces.padNear(flight.pos)) {
      window.VesperSurfaces.padUp(_walkN);
    }

    // Project look-forward / right onto tangent
    _walkT.copy(_fwd).addScaledVector(_walkN, -_fwd.dot(_walkN));
    if (_walkT.lengthSq() < 1e-6) {
      _walkT.set(0, 1, 0).addScaledVector(_walkN, -_walkN.y);
    }
    _walkT.normalize();
    _walkB.copy(_right).addScaledVector(_walkN, -_right.dot(_walkN));
    if (_walkB.lengthSq() < 1e-6) _walkB.crossVectors(_walkN, _walkT);
    _walkB.normalize();

    // Wish on tangent from keys + stick
    _wish.set(0, 0, 0);
    if (movement.forward > 0) _wish.add(_walkT);
    if (movement.forward < 0) _wish.sub(_walkT);
    if (movement.right > 0) _wish.add(_walkB);
    if (movement.right < 0) _wish.sub(_walkB);
    // Stick: y forward, x strafe (same as flight convention)
    const a = 1 - Math.exp(-STICK_SMOOTH * dt);
    flight.stick.x += (THREE.MathUtils.clamp(flight.stickRaw.x + padFrame.move.x, -1, 1) - flight.stick.x) * a;
    flight.stick.y += (THREE.MathUtils.clamp(flight.stickRaw.y + padFrame.move.y, -1, 1) - flight.stick.y) * a;
    if (Math.abs(flight.stick.x) > 0.02 || Math.abs(flight.stick.y) > 0.02) {
      _wish.addScaledVector(_walkT, -flight.stick.y);
      _wish.addScaledVector(_walkB, flight.stick.x);
      markFlightInput();
    }
    if (_wish.lengthSq() > 1e-6) {
      _wish.normalize();
      markFlightInput();
    }

    // Tangent velocity integrate
    const damp = Math.exp(-WALK.walkDamp * dt);
    // Remove radial vel; keep/apply tangent
    const radial = flight.vel.dot(_walkN);
    flight.vel.addScaledVector(_walkN, -radial);
    flight.vel.multiplyScalar(damp);
    const driving = document.body.dataset.drive === "1";
    const accel = WALK.walkAccel * (driving ? 2.4 : 1);
    const vmax = WALK.walkMax * (driving ? 2.8 : 1);
    if (_wish.lengthSq() > 1e-6) {
      flight.vel.addScaledVector(_wish, accel * dt);
    }
    const walkStrafe =
      Math.abs(flight.stickRaw.x) > 0.02 ||
      movement.right !== 0 || Math.abs(padFrame.move.x) > 0.02;
    if (!walkStrafe) {
      const latW = flight.vel.dot(_walkB);
      if (Math.abs(latW) > 1e-6) flight.vel.addScaledVector(_walkB, -latW);
    }
    const sp = flight.vel.length();
    if (sp > vmax) flight.vel.multiplyScalar(vmax / sp);

    // Move in world, then re-plant on sphere + write local.
    // On the pad, stay on the tangent plane so cabin/hangar floors stay underfoot.
    flight.pos.addScaledVector(flight.vel, dt);
    if (!(window.VesperSurfaces && window.VesperSurfaces.flatten && window.VesperSurfaces.flatten(flight.pos))) {
      _walkN.copy(flight.pos).sub(_walkBody);
      const d2 = _walkN.length() || 1;
      _walkN.multiplyScalar(1 / d2);
      flight.pos.copy(_walkBody).addScaledVector(_walkN, radius + eye);
    } else if (window.VesperSurfaces.padUp) {
      window.VesperSurfaces.padUp(_walkN);
    }
    _walkMatInv.copy(mat).invert();
    flight.walkLocal.copy(flight.pos).applyMatrix4(_walkMatInv);

    // Soft auto-level roll — feet planted
    flight.roll *= Math.exp(-4.2 * dt);

    // Look from yaw/pitch, then rebuild with surface-normal UP so the horizon curves
    applyLook();
    if (WALK.alignUp) {
      camera.getWorldDirection(_fwd);
      _lookTo.copy(flight.pos).addScaledVector(_fwd, 8);
      camera.up.copy(_walkN);
      camera.lookAt(_lookTo);
    }
    if (window.__vesperDeepSky && window.__vesperDeepSky.follow) {
      window.__vesperDeepSky.follow(flight.pos, camera.far);
    } else if (skyDome) {
      skyDome.position.copy(flight.pos);
    }
    if (stars) stars.position.copy(flight.pos);
    state.nearSurface = b.name;
    flight.surfaceBody = b.name;

    // Keep body-specific surface sky (don't re-crush with space fog)
    if (_surfaceEnvOn && flight.walkBody) {
      const env = surfaceEnvFor(flight.walkBody);
      if (scene.fog && scene.fog.isFogExp2) {
        scene.fog.color.setHex(env.fog);
        scene.fog.density = THREE.MathUtils.lerp(scene.fog.density, env.density, 1 - Math.exp(-2 * dt));
      }
    }
    if (b && b.mesh) b.mesh.visible = true;
    if (window.VesperSurfaces && window.VesperSurfaces.sync) {
      window.VesperSurfaces.sync(flight.pos, _walkN);
    }
    if (window.VesperWalkFx && window.VesperWalkFx.tick) {
      const bio =
        (window.VesperSurfaces &&
          window.VesperSurfaces.active &&
          window.VesperSurfaces.active() &&
          window.VesperSurfaces.active().biome) ||
        "rock";
      window.VesperWalkFx.tick(dt, true, flight.pos, flight.vel.length(), bio);
      if (
        window.VesperWalkFx.footprint &&
        flight.vel.length() > 0.5 &&
        Math.random() < dt * 2.5
      ) {
        window.VesperWalkFx.footprint(flight.pos, _walkN, THREE, scene);
      }
    }
    easeFovToward();
  }

  /** Soft surface / hover: tight shell only — no far molasses wall. */
  function softBodyCollisions(dt) {
    let nearest = null;
    let nearestAlt = Infinity;
    let nearestDist = Infinity;
    let nearestWorld = null;
    let onSurface = null;

    // Pass 1: pick nearest body by altitude (inner planets must win over Sun shell)
    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i];
      b.mesh.getWorldPosition(_tmpV);
      const dist = flight.pos.distanceTo(_tmpV);
      const alt = dist - b.radius;
      if (alt < nearestAlt) {
        nearestAlt = alt;
        nearestDist = dist;
        nearest = b;
        _nearestWorld.copy(_tmpV);
        nearestWorld = _nearestWorld;
      }
    }

    if (nearest && nearestWorld) {
      const b = nearest;
      const dist = nearestDist;
      const radius = b.radius;
      const hover = bodyHover(radius);
      const frac = b.name === "Sun" ? SOFT.sunInfluenceFrac : SOFT.influenceFrac;
      // Cap absolute pad on small bodies so moons aren't molasses balloons
      const pad = Math.min(SOFT.influencePad, Math.max(0.35, radius * 0.9));
      const influence = radius + radius * frac + pad;

      if (dist <= influence) {
        _tmpN.copy(flight.pos).sub(nearestWorld);
        const dlen = _tmpN.length() || 1;
        _tmpN.multiplyScalar(1 / dlen);
        const alt = nearestAlt;

        const approachBand = hover * SOFT.approachBandMul;
        if (alt < approachBand) {
          const t = THREE.MathUtils.clamp(1 - alt / approachBand, 0, 1);
          const soft = t * t;
          const radial = flight.vel.dot(_tmpN);
          if (radial < 0) {
            flight.vel.addScaledVector(_tmpN, -radial * (0.15 + 0.55 * soft * SOFT.inwardKill));
          }
          const drag = soft * SOFT.skimDrag * Math.min(1, dt * 3.5);
          flight.vel.multiplyScalar(1 - drag);
        }

        const minDist = radius + hover * 0.4;
        const takingOff = performance.now() < (flight.takeoffUntil || 0);
        const eyeH = walkEyeHeight(radius);
        if (takingOff && dist < radius + Math.max(hover * 4.5, radius * 0.4)) {
          // Keep ejecting — never clip inside planet / atmo during leave
          const target = radius + Math.max(hover * 5.5, radius * 0.45);
          flight.pos.copy(nearestWorld).addScaledVector(_tmpN, Math.max(dist, target));
          const radial = flight.vel.dot(_tmpN);
          if (radial < hover * 4) {
            flight.vel.addScaledVector(_tmpN, hover * 5.5 - Math.min(0, radial));
          }
        } else if (dist < minDist && !takingOff) {
          // Settle toward walk eye height when slow — avoids hover*0.65 → eye snap jank
          const slow = flight.vel.length() < WALK.enterSpeed * 1.35;
          const skimTarget = radius + hover * 0.55;
          const plantTarget = radius + eyeH * 1.05;
          const target = slow ? plantTarget : skimTarget;
          // Accelerate settle as we get closer to plant height
          const altApprox = Math.max(0, dist - radius);
          const nearPlant = altApprox < hover * 0.35;
          const rate = (WALK.settleLerp || 14) * (slow && nearPlant ? 2.4 : slow ? 1.5 : 1);
          const blend = 1 - Math.exp(-rate * dt);
          _tmpV.copy(nearestWorld).addScaledVector(_tmpN, target);
          flight.pos.lerp(_tmpV, blend);
          // Never sink into crust
          const d2 = flight.pos.distanceTo(nearestWorld);
          if (d2 < radius + eyeH * 0.92) {
            flight.pos.copy(nearestWorld).addScaledVector(_tmpN, radius + eyeH);
          }
          const radial = flight.vel.dot(_tmpN);
          if (radial < 0) flight.vel.addScaledVector(_tmpN, -radial * (slow ? 1 : 0.85));
          flight.vel.multiplyScalar(slow ? 0.88 : 0.96);
          onSurface = b.name;
          // Enter walk only when truly near eye height (no ~10u snap-down)
          const altNow = flight.pos.distanceTo(nearestWorld) - radius;
          const enterCeil = eyeH * (WALK.enterEyeMul || 3.2);
          if (
            !flight.walking &&
            performance.now() >= (flight.takeoffUntil || 0) &&
            flight.vel.length() < WALK.enterSpeed &&
            altNow <= enterCeil
          ) {
            if (b.name === "Sun" || b.skimOnly || b.walkable === false) {
              if (performance.now() - (softBodyCollisions._skimToast || 0) > 4000) {
                softBodyCollisions._skimToast = performance.now();
                guideToast("Sun · soft-skim only — thrust away; no walk", 2400);
              }
            } else if (state.straightMan && bodySolHidden(b)) {
              if (performance.now() - (softBodyCollisions._hypToast || 0) > 4000) {
                softBodyCollisions._hypToast = performance.now();
                guideToast(solHideToast(b), 2200);
              }
            } else {
              enterWalk(b, nearestWorld);
            }
          }
          // Affordance: LAND button when near + slowish
          flight.landReady = !flight.walking && !takingOff && b.name !== "Sun" && !b.skimOnly && b.walkable !== false &&
            !(state.straightMan && bodySolHidden(b)) &&
            alt < hover * 3.5 && flight.vel.length() < WALK.enterSpeed * 2.2;
          flight.landBodyName = flight.landReady ? b.name : null;
          if (typeof syncLandBtn === "function") syncLandBtn();
        } else if (alt < hover * 2.2 && !takingOff) {
          onSurface = b.name;
          flight.landReady = !flight.walking && b.name !== "Sun" && !b.skimOnly && b.walkable !== false &&
            !(state.straightMan && bodySolHidden(b)) &&
            alt < hover * 2.5 && flight.vel.length() < WALK.enterSpeed * 2.5;
          flight.landBodyName = flight.landReady ? b.name : null;
          if (typeof syncLandBtn === "function") syncLandBtn();
        } else {
          if (!flight.walking) { flight.landReady = false; flight.landBodyName = null; }
          if (typeof syncLandBtn === "function") syncLandBtn();
        }
      }
    }

    if (flight.walking) {
      // Stay tagged to walk body
      state.nearSurface = flight.walkBody;
      flight.surfaceBody = flight.walkBody;
      return;
    }

    if (onSurface) {
      flight.surfaceBody = onSurface;
      state.nearSurface = onSurface;
    } else if (!nearest || nearestAlt > hoverClear(nearest)) {
      // Clear once outside tight hover band (was sticky far past approach)
      flight.surfaceBody = null;
      state.nearSurface = null;
    }
  }

  function hoverClear(b) {
    if (!b) return 8;
    return bodyHover(b.radius) * 3.5;
  }

  /** Soft skim through Saturn's rings — light plane drag, no hard wall. */
  function softRingSkim(dt) {
    const sat = bodies.find((b) => b.name === "Saturn" && !b.isMoon);
    if (!sat || !sat.group) return;
    const ring = sat.group.getObjectByName("rings");
    if (!ring) return;
    sat.group.updateMatrixWorld(true);
    ring.updateMatrixWorld(true);
    sat.mesh.getWorldPosition(_ringWorld);
    // RingGeometry normal is +Z; mesh tilt puts the sheet in world — reuse scratch quat/vecs
    _ringN.set(0, 0, 1).applyQuaternion(ring.getWorldQuaternion(_ringQ)).normalize();
    _ringRel.copy(flight.pos).sub(_ringWorld);
    const h = _ringRel.dot(_ringN);
    _tmpV.copy(_ringRel).addScaledVector(_ringN, -h);
    const radial = _tmpV.length();
    const inner = sat.radius * 1.35;
    const outer = sat.radius * 2.35;
    const thick = Math.max(0.35, sat.radius * 0.09);
    if (radial < inner || radial > outer) return;
    if (Math.abs(h) > thick * 3.2) return;
    const tip = 1 - Math.abs(h) / (thick * 3.2);
    const soft = tip * tip;
    const vn = flight.vel.dot(_ringN);
    flight.vel.addScaledVector(_ringN, -vn * (0.2 + 0.55 * soft));
    flight.vel.multiplyScalar(1 - soft * 0.1 * Math.min(1, dt * 4));
    if (Math.abs(h) < thick * 0.55) {
      const target = thick * 0.35 * (h >= 0 ? 1 : -1);
      flight.pos.addScaledVector(_ringN, (target - h) * 0.12);
    }
  }

  /** Soft dust drag in the main asteroid belt (2.2–3.3 AU) — whisper only. */
  function softBeltWhisper(dt) {
    if (!asteroidBelt) return;
    const r = Math.hypot(flight.pos.x, flight.pos.z);
    const inner = orbitAU(2.2);
    const outer = orbitAU(3.3);
    if (r < inner || r > outer) return;
    const y = Math.abs(flight.pos.y);
    if (y > 140) return;
    const edge = Math.min(r - inner, outer - r) / Math.max(1, (outer - inner) * 0.5);
    const mid = Math.max(0, Math.min(1, edge));
    const yFade = 1 - Math.min(1, y / 140);
    const soft = mid * mid * yFade;
    flight.vel.multiplyScalar(1 - soft * 0.045 * Math.min(1, dt * 3));
  }

  function integrateFlight(dt) {
    if (flight.walking) {
      integrateWalk(dt);
      if (flight.walking) return;
      // Just took off this frame — fall through into flight + soft collisions
    }
    // Hold-to-boost curve accumulator
    if (state.boost) state.boostHold = Math.min(2.5, state.boostHold + dt);
    else state.boostHold = Math.max(0, state.boostHold - dt * 2.2);
    const cfg = modeCfg();
    const movement = input.movement();

    // Smooth stick toward raw (de-jank)
    const a = 1 - Math.exp(-STICK_SMOOTH * dt);
    flight.stick.x += (THREE.MathUtils.clamp(flight.stickRaw.x + padFrame.move.x, -1, 1) - flight.stick.x) * a;
    flight.stick.y += (THREE.MathUtils.clamp(flight.stickRaw.y + padFrame.move.y, -1, 1) - flight.stick.y) * a;
    const va = 1 - Math.exp(-(typeof VERT_SMOOTH !== "undefined" ? VERT_SMOOTH : STICK_SMOOTH) * dt);
    flight.vert += (THREE.MathUtils.clamp(flight.vertRaw + padFrame.vertical, -1, 1) - flight.vert) * va;
    if (Math.abs(flight.stick.x) < 0.015) flight.stick.x = 0;
    if (Math.abs(flight.stick.y) < 0.015) flight.stick.y = 0;
    if (Math.abs(flight.vert) < 0.02) flight.vert = 0;

    // Smooth look deltas
    const la = 1 - Math.exp(-LOOK_SMOOTH * dt);
    flight.yaw += flight.lookDelta.yaw * la;
    flight.pitch += flight.lookDelta.pitch * la;
    flight.lookDelta.yaw *= 1 - la;
    flight.lookDelta.pitch *= 1 - la;
    flight.pitch = THREE.MathUtils.clamp(flight.pitch, -1.45, 1.45);

    // Roll (true 6DOF) — Z/C
    let rollWish = 0;
    if (input.held("rollLeft")) rollWish += 1;
    if (input.held("rollRight")) rollWish -= 1;
    flight.roll += rollWish * 1.1 * dt;
    // Slow auto-level unless holding roll
    if (!rollWish) flight.roll *= Math.exp(-1.8 * dt);

    // Rebuild orientation with roll for cam axes (scratch euler/up — no per-frame alloc)
    _flightEuler.set(flight.pitch, flight.yaw, flight.roll, "YXZ");
    camera.quaternion.setFromEuler(_flightEuler);
    camera.getWorldDirection(_fwd);
    _right.set(1, 0, 0).applyQuaternion(camera.quaternion);
    _camUp.set(0, 1, 0).applyQuaternion(camera.quaternion);

    _wish.set(0, 0, 0);
    if (movement.forward > 0) _wish.add(_fwd);
    if (movement.forward < 0) _wish.sub(_fwd);
    if (movement.right > 0) _wish.add(_right);
    if (movement.right < 0) _wish.sub(_right);
    if (movement.up > 0) _wish.add(_camUp);
    if (movement.up < 0) _wish.sub(_camUp);

    // Stick only moves — never looks
    if (Math.abs(flight.stick.x) > 0.02 || Math.abs(flight.stick.y) > 0.02) {
      _wish.addScaledVector(_fwd, -flight.stick.y);
      _wish.addScaledVector(_right, flight.stick.x);
    }
    // Mobile vertical thrusters
    if (Math.abs(flight.vert) > 0.02) {
      const vCurve = Math.sign(flight.vert) * Math.pow(Math.abs(flight.vert), 1.35);
      _wish.addScaledVector(_camUp, vCurve);
    }

    // FLOAT lazy-river mixes into wish before thrust (idle only; input marks interrupt)
    const river = riverSample(dt);
    if (river && !state.paused && !state.nearSurface) {
      const rs = RIVER_SPEED * RIVER_BLEND;
      _wish.addScaledVector(_fwd, river.fwd * rs);
      _wish.addScaledVector(_right, river.strafe * rs);
      _wish.addScaledVector(_camUp, river.lift * rs);
      flight.yaw += (river.yawRate || 0) * dt * RIVER_SPEED;
      flight.pitch = THREE.MathUtils.clamp(
        flight.pitch + (river.pitchRate || 0) * dt * RIVER_SPEED,
        -1.45,
        1.45
      );
    }

    let thrustMul = 1;
    if (state.nearSurface) {
      thrustMul =
        state.mode === "pilot" ? SOFT.surfaceThrustPilot : SOFT.surfaceThrustFloat;
    }

    if (_wish.lengthSq() > 1e-6) _wish.normalize();
    else _wish.set(0, 0, 0);

    // Smooth accel toward wish (no binary jank)
    const accelA = 1 - Math.exp(-(cfg.accelSmooth || 9) * dt);
    flight.wishSmooth.lerp(_wish, accelA);
    if (flight.wishSmooth.lengthSq() < 1e-6) flight.wishSmooth.set(0, 0, 0);

    const thrust = cfg.thrust * cfg.boostMul * thrustMul;
    if (flight.wishSmooth.lengthSq() > 1e-6) {
      flight.vel.addScaledVector(flight.wishSmooth, thrust * dt);
    }

    // Chip refresh (throttled); river itself runs above in wish mix
    if (performance.now() - (syncRiverChip._last || 0) > 450) {
      syncRiverChip._last = performance.now();
      syncRiverChip();
    }

    const takingOffBoost = (flight.takeoffBoostFrames || 0) > 0;
    if (takingOffBoost) flight.takeoffBoostFrames -= 1;
    const damp = takingOffBoost ? Math.exp(-cfg.damp * dt * 0.15) : Math.exp(-cfg.damp * dt);
    flight.vel.multiplyScalar(damp);

    // Kill sideways drift when no strafe input (stick X / A-D released).
    // Pilot damp is gentle; residual right-axis velocity felt like a sideways crawl.
    {
      // Release means raw stick and keys, not the smoothed tail.
      // A partial damp left lateral speed on for several frames.
      const strafeIn =
        Math.abs(flight.stickRaw.x) > 0.02 ||
        movement.right !== 0 || Math.abs(padFrame.move.x) > 0.02;
      if (!strafeIn && !takingOffBoost) {
        const lat = flight.vel.dot(_right);
        if (Math.abs(lat) > 1e-6) flight.vel.addScaledVector(_right, -lat);
      }
    }

    const sp = flight.vel.length();
    const maxSp = takingOffBoost
      ? cfg.maxSpeed * 3.5
      : state.nearSurface
        ? cfg.maxSpeed * SOFT.surfaceMaxSpeedMul
        : cfg.maxSpeed;
    if (sp > maxSp) flight.vel.multiplyScalar(maxSp / sp);

    flight.pos.addScaledVector(flight.vel, dt);

    const r = flight.pos.length();
    if (r > flight.bounds) {
      const n = flight.pos.clone().normalize();
      flight.pos.copy(n.multiplyScalar(flight.bounds));
      const outward = flight.vel.dot(n);
      if (outward > 0) flight.vel.addScaledVector(n, -outward * 1.05);
      flight.vel.multiplyScalar(0.55);
    }

    softBodyCollisions(dt);
    softRingSkim(dt);
    softBeltWhisper(dt);
    maybeReleaseHeldShells();
    easeFovToward();

    applyLook();
    if (window.__vesperDeepSky && window.__vesperDeepSky.follow) {
      window.__vesperDeepSky.follow(flight.pos, camera.far);
    } else if (skyDome) {
      skyDome.position.copy(flight.pos);
    }
    if (stars) stars.position.copy(flight.pos);
  }

  // Look-at planet detection for AI guide
  const _ndc = new THREE.Vector2(0, 0);
  let lastLookName = null;
  let lookStableFor = 0;

  function updateLookAt(dt) {
    let best = null;
    let bestScore = 0.88;
    // The nearest sphere the crosshair actually enters. A moon in front of
    // its planet was losing to the bigger disk behind it.
    let front = null;
    let frontDist = Infinity;
    let frontAng = 0;
    camera.getWorldDirection(_fwd);
    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i];
      b.mesh.getWorldPosition(_tmpV);
      _lookTo.copy(_tmpV).sub(flight.pos);
      const dist = _lookTo.length();
      if (dist < 0.01) continue;
      _lookTo.multiplyScalar(1 / dist);
      const ang = _fwd.dot(_lookTo);
      // Angular-size weight: nearby moons/planets beat distant giants in the same FOV
      const angSize = b.radius / dist;
      // The flat distance penalty made the home overlook miss Earth.
      // Earth fills the view at ~2700 units and the chip stayed "Deep space".
      // A body that covers the view keeps its score. A far speck still falls off.
      const cover = Math.min(1, angSize * 2);
      // A centered disk (about 2° across) is not a far speck.
      // The distance penalty was leaving the Moon as "Deep space"
      // while it sat in the middle of the view.
      const centered = ang > 0.97 && angSize > 0.018;
      const score = ang + Math.min(0.14, angSize * 0.55) - (centered ? 0 : dist * 0.0001 * (1 - cover));
      if (state.straightMan && bodySolHidden(b)) continue;
      const miss = dist * Math.sqrt(Math.max(0, 1 - ang * ang));
      if (ang > 0.2 && miss < b.radius && dist < frontDist) {
        frontDist = dist;
        front = b.name;
        frontAng = angSize;
      }
      if (ang > 0.84 && score > bestScore) {
        bestScore = score;
        best = b.name;
      }
    }
    if (front) {
      // Areostationary Relay sits on the sun–Mars line. Its radius is
      // about 2 units, so the center of Mars was named the relay.
      // A moon that covers the view (Titan at 4R and 8R) still wins.
      let useFront = true;
      if (frontAng < 0.01) {
        let solid = null;
        let solidDist = Infinity;
        for (let j = 0; j < bodies.length; j++) {
          const o = bodies[j];
          if (!o || !o.mesh || o.name === front || o.name === "Sun") continue;
          o.mesh.getWorldPosition(_tmpV);
          _lookTo.copy(_tmpV).sub(flight.pos);
          const od = _lookTo.length();
          if (od <= frontDist + 0.5 || od < 0.01) continue;
          _lookTo.multiplyScalar(1 / od);
          const oang = _fwd.dot(_lookTo);
          if (oang <= 0.2) continue;
          const omiss = od * Math.sqrt(Math.max(0, 1 - oang * oang));
          if (omiss >= o.radius) continue;
          if (o.radius / od < 0.04) continue;
          if (od < solidDist) {
            solidDist = od;
            solid = o.name;
          }
        }
        if (solid) {
          useFront = false;
          best = solid;
        }
      }
      if (useFront) best = front;
    }
    // On the ground, the place underfoot is the label unless the eye is
    // clearly on a different body. Waiting for lookStableFor flipped the
    // name back to null every frame, so the chip stayed "Deep space"
    // while the walk hint already said the world.
    if (state.nearSurface && (!best || best === state.nearSurface)) {
      best = state.nearSurface;
    }
    const chip = $("#look-chip");
    if (best !== lastLookName) {
      lookStableFor = 0;
      lastLookName = best;
    } else {
      lookStableFor += dt;
    }
    state.lookingAt = lookStableFor > 0.55 ? best : null;
    if (chip) {
      let label = state.lookingAt || "Deep space";
      if (state.lookingAt) {
        const b = findBody(state.lookingAt);
        if (b && b.mesh) {
          b.mesh.getWorldPosition(_tmpV);
          const d = flight.pos.distanceTo(_tmpV);
          const alt = Math.max(0, d - b.radius);
          const distLabel = alt < 10 ? alt.toFixed(1) : String(Math.round(alt));
          label = state.lookingAt + " · " + distLabel;
          const al =
            window.VesperScience &&
            window.VesperScience.ALMANAC &&
            window.VesperScience.ALMANAC[state.lookingAt];
          if (al && al.a_au != null && typeof al.a_au === "number") {
            // Sedna's chip said 506 AU while the dot sits near 18.
            // The almanac semi-major is real. The sky pull-in is not that radius.
            let extra = " · " + al.a_au + " AU";
            const sunB = findBody("Sun");
            if (sunB && sunB.mesh && al.a_au > 0) {
              sunB.mesh.getWorldPosition(_tmpN);
              const skyAu = _tmpV.distanceTo(_tmpN) / AU_UNIT;
              if (Math.abs(skyAu - al.a_au) / al.a_au > 0.12) {
                const fmt = (x) =>
                  Math.abs(x - Math.round(x)) < 0.05 ? String(Math.round(x)) : x.toFixed(1);
                extra = " · display " + fmt(skyAu) + " AU · a " + al.a_au + " AU";
              }
            }
            label += extra;
          } else if (al && typeof al.a_au === "string" && al.a_au) {
            label += " · a " + al.a_au + " AU";
          } else if (al && al.R_km != null) {
            label += " · R " + al.R_km + " km";
          }
        }
      }
      // ◈ is the Hyp mark in Travel. A nearby Sol world is not fiction.
      if (state.nearSurface && state.lookingAt === state.nearSurface) {
        const here = findBody(state.lookingAt);
        if (here && here.hypothetic) label = "◈ " + label;
      }
      chip.textContent = label;
    }
    if (state.lookingAt && lookStableFor > 0.6 && lookStableFor < 0.6 + dt + 0.01) {
      window.dispatchEvent(
        new CustomEvent("vesper:lookat", {
          detail: {
            name: state.lookingAt,
            blurb: PLANET_BLURBS[state.lookingAt] || "",
            science:
              (window.VesperScience && window.VesperScience.fact
                ? window.VesperScience.fact(state.lookingAt)
                : "") || "",
          },
        })
      );
    }
  }


  const TRAVEL_NAMES = [
    "Home",
    "Observation Station",
    "Sun",
    "Mercury",
    "Venus",
    "Earth",
    "Moon",
    "Mars",
    "Phobos",
    "Deimos",
    "Vesta",
    "Ceres",
    "Pallas",
    "Jupiter",
    "Io",
    "Europa",
    "Ganymede",
    "Callisto",
    "Saturn",
    "Mimas",
    "Enceladus",
    "Tethys",
    "Dione",
    "Rhea",
    "Titan",
    "Iapetus",
    "Hyperion",
    "Uranus",
    "Miranda",
    "Ariel",
    "Umbriel",
    "Titania",
    "Oberon",
    "Neptune",
    "Triton",
    "Proteus",
    "Nereid",
    "Pluto",
    "Charon",
    "Nix",
    "Haumea",
    "Eris",
    "Makemake",
    "Quaoar",
    "Amalthea",
    "Himalia",
    "Janus",
    "Epimetheus",
    "Phoebe",
    "Larissa",
    "Hiʻiaka",
    "Namaka",
    "Dysnomia",
    "Weywot",
    "Sedna",
    "Gonggong",
    "Orcus",
    "Varuna",
    "Psyche",
    "Eros",
    "Halley",
    "ISS",
    "JWST",
    "Voyager 1",
    "New Horizons",
    "Starman Roadster",
    "Perseverance",
    "Ingenuity",
    "Apollo 11 Site"
  ];

  function findBody(name) {
    if (!name) return null;
    const n = String(name).toLowerCase();
    for (let i = 0; i < bodies.length; i++) {
      if (bodies[i].name.toLowerCase() === n) return bodies[i];
    }
    return null;
  }

  /** Soft approach standoff — outside hover shell, readable silhouette */
  function travelTo(name, opts) {
    opts = opts || {};
    if (!name || /^home$/i.test(name)) {
      resetFlight();
      guideToast("Travel · Home overlook", 2000);
      const sel = $("#travel-select");
      if (sel) sel.value = "Home";
      window.dispatchEvent(new CustomEvent("vesper:travel", { detail: { name: "Home" } }));
      return true;
    }
    const b = findBody(name);
    if (!b) {
      guideToast("Travel · unknown body", 1600);
      return false;
    }
    if (state.straightMan && bodySolHidden(b)) {
      guideToast(solHideToast(b), 2000);
      return false;
    }
    // Walk parent chain so moon world positions are current mid-frame
    if (b.group) {
      if (b.isMoon && b.group.parent) b.group.parent.updateMatrixWorld(true);
      b.group.updateMatrixWorld(true);
    } else {
      b.mesh.updateMatrixWorld(true);
    }
    const world = new THREE.Vector3();
    b.mesh.getWorldPosition(world);
    // Moons: park close enough to read (EARTH_R floor was parking tiny moons too far)
    let standoff;
    if (b.isMoon) {
      standoff = Math.max(b.radius * 4.2, 2.2) + Math.min(SOFT.influencePad, 0.55);
    } else {
      // ~2.4–2.8 R: body fills frame with limb halo readable (Mass Effect–like postcard)
      standoff = Math.max(b.radius * 2.55, EARTH_R * 1.35) + SOFT.influencePad * 0.65;
    }
    // Prefer a sunlit-ish offset: away from sun a bit + lift
    const fromSun = world.clone();
    if (fromSun.lengthSq() < 1e-4) fromSun.set(0, 0, 1);
    else fromSun.normalize();
    const up = new THREE.Vector3(0, 1, 0);
    let side = new THREE.Vector3().crossVectors(up, fromSun);
    if (side.lengthSq() < 1e-6) side.set(1, 0, 0);
    side.normalize();
    const dest = world
      .clone()
      .addScaledVector(fromSun, standoff * 0.72)
      .addScaledVector(up, standoff * 0.38)
      .addScaledVector(side, standoff * 0.22);
    // The travel menu stays up on a pad. Leaving walk mode first
    // keeps the next step from integrating a Moon walk at Mars.
    if (flight.walking) exitWalk("travel");
    flight.pos.copy(dest);
    flight.vel.set(0, 0, 0);
    flight.wishSmooth.set(0, 0, 0);
    flight.surfaceBody = null;
    state.nearSurface = null;
    state.lookingAt = b.name;
    faceToward(world);
    applyLook();
    if (opts.toast !== false) {
      const label = b.isMoon && b.parentName ? b.name + " · " + b.parentName : b.name;
      guideToast("Travel · " + label, 2000);
    }
    const sel = $("#travel-select");
    if (sel) {
      const opt = [...sel.options].find((o) => o.value.toLowerCase() === b.name.toLowerCase());
      if (opt) sel.value = opt.value;
    }
    window.dispatchEvent(
      new CustomEvent("vesper:travel", { detail: { name: b.name, isMoon: !!b.isMoon } })
    );
    syncFlightChip();
    return true;
  }

  // --- UI wiring --------------------------------------------------------
  const pauseBtn = $("#btn-pause");
  const resetBtn = $("#btn-reset");
  const windRange = $("#wind-down");
  const clockEl = $("#sim-clock");

  function syncPauseUI() {
    if (!pauseBtn) return;
    pauseBtn.textContent = state.paused ? "Resume" : "Pause";
    pauseBtn.classList.toggle("active", state.paused);
    pauseBtn.title = state.paused
      ? "Resume ship + orbits"
      : "Pause — freeze ship + orbits (full stop). Clock ⏸ is orbits-only.";
  }

  pauseBtn &&
    pauseBtn.addEventListener("click", () => {
      state.paused = !state.paused;
      if (typeof guideToast === "function") guideToast(state.paused ? "Pause · ship + orbits frozen" : "Resume · flight live", 1800);
      syncPauseUI();
      guideToast(
        state.paused ? "Paused · ship + orbits frozen" : "Resumed · sky live",
        1600
      );
    });

  resetBtn &&
    resetBtn.addEventListener("click", () => {
      resetFlight();
      let pi = 0;
      bodies.forEach((b) => {
        if (b.fixed || b.isMoon) return;
        b.angle = (pi / Math.max(1, bodyDefs.length)) * Math.PI * 2 + 0.55;
        pi++;
      });
      state.windDown = reduceMotion ? 0.15 : 0.45;
      if (windRange) windRange.value = String(Math.round(state.windDown * 100));
      state.paused = false;
      syncPauseUI();
      updateWindVisuals();
    });

  $("#btn-float") && $("#btn-float").addEventListener("click", () => setMode("float"));
  $("#btn-pilot") && $("#btn-pilot").addEventListener("click", () => setMode("pilot"));
  $("#btn-product-learn") && $("#btn-product-learn").addEventListener("click", () => setProduct("learn"));
  $("#btn-product-live") && $("#btn-product-live").addEventListener("click", () => setProduct("live"));


  function setHideControls(on, opts) {
    opts = opts || {};
    state.hideControls = !!on;
    document.body.classList.toggle("hide-controls", state.hideControls);
    const btn = $("#btn-hide-hud");
    if (btn) {
      btn.classList.toggle("active", state.hideControls);
      btn.setAttribute("aria-pressed", state.hideControls ? "true" : "false");
      btn.textContent = state.hideControls ? "Show" : "Hide";
    }
    const restore = document.getElementById("hud-restore");
    if (restore) restore.hidden = !state.hideControls;
    try {
      localStorage.setItem(LS_HIDE, state.hideControls ? "1" : "0");
    } catch (_) {}
    // Close companion sheet when entering immersive — stay out of face
    if (state.hideControls && window.VesperAgent && window.VesperAgent.close) {
      try { window.VesperAgent.close(); } catch (_) {}
    }
    if (opts.toast !== false) {
      guideToast(state.hideControls ? "Menus hidden · stick stays" : "Menus back", 1600);
    }
    window.dispatchEvent(
      new CustomEvent("vesper:hideControls", { detail: { on: state.hideControls } })
    );
  }

  document.querySelectorAll("[data-clock]").forEach((el) => {
    el.addEventListener("click", () => setClockMode(el.getAttribute("data-clock")));
  });

  document.querySelectorAll("[data-gear]").forEach((el) => {
    el.addEventListener("click", () => {
      const id = el.getAttribute("data-gear");
      const idx = GEARS.findIndex((g) => g.id === id);
      if (idx >= 0) setGear(idx);
    });
  });
  document.querySelectorAll("[data-quality]").forEach((el) => {
    el.addEventListener("click", () => {
      const id = el.getAttribute("data-quality");
      if (window.VesperSky && window.VesperSky.setQualityTier) window.VesperSky.setQualityTier(id);
      document.querySelectorAll("[data-quality]").forEach((b) => b.classList.toggle("active", b.getAttribute("data-quality") === id));
    });
  });
  try {
    const q = loadQualityTier();
    document.querySelectorAll("[data-quality]").forEach((b) => b.classList.toggle("active", b.getAttribute("data-quality") === q));
  } catch (_) {}


  // Compact HUD — More expands gears/clock/actions
  const btnMore = $("#btn-more");
  const hudSecondary = document.getElementById("hud-secondary");
  function setMore(on) {
    if (!hudSecondary) return;
    hudSecondary.hidden = !on;
    if (btnMore) {
      btnMore.classList.toggle("active", !!on);
      btnMore.setAttribute("aria-expanded", on ? "true" : "false");
    }
    document.body.classList.toggle("hud-more", !!on);
    document.body.classList.toggle("more-open", !!on);
  }
  if (btnMore && hudSecondary) {
    btnMore.addEventListener("click", () => setMore(hudSecondary.hidden));
  }
  // Walk hint pill
  if (!document.getElementById("walk-hint")) {
    const wh = document.createElement("div");
    wh.id = "walk-hint";
    wh.setAttribute("aria-hidden", "true");
    wh.textContent = "";
    document.body.appendChild(wh);
  }

  $("#btn-hide-hud") &&
    $("#btn-hide-hud").addEventListener("click", () => setHideControls(!state.hideControls));
  const btnCinemaHud = document.getElementById("btn-cinema-hud");
  if (btnCinemaHud) {
    btnCinemaHud.addEventListener("click", () => {
      const on = !document.body.classList.contains("cinema-mode");
      // close() also leaves cinema, so the stick came straight back
      // and the button stayed lit. cinema() keeps the mode.
      if (window.VesperAgent && window.VesperAgent.cinema) {
        window.VesperAgent.cinema(on);
      } else {
        document.body.classList.toggle("cinema-mode", on);
        try { localStorage.setItem("vesper.cinemaMode", on ? "1" : "0"); } catch (_) {}
        btnCinemaHud.classList.toggle("active", on);
        btnCinemaHud.setAttribute("aria-pressed", on ? "true" : "false");
      }
      guideToast(on ? "Cinema · movement hidden" : "Cinema off", 1400);
    });
  }
  const hudRestoreBtn = document.getElementById("hud-restore");
  if (hudRestoreBtn) {
    hudRestoreBtn.addEventListener("click", () => setHideControls(false));
  }
  try {
    if (localStorage.getItem(LS_HIDE) === "1") {
      setTimeout(() => setHideControls(true, { toast: false }), 0);
    }
  } catch (_) {}

  $("#btn-straight") &&
    $("#btn-straight").addEventListener("click", () => setStraightMan(!state.straightMan));
  $("#btn-build") &&
    $("#btn-build").addEventListener("click", () => {
      state.buildMode = !state.buildMode;
      document.body.dataset.build = state.buildMode ? "1" : "0";
      const bb = $("#btn-build");
      if (bb) bb.classList.toggle("active", state.buildMode);
      window.dispatchEvent(
        new CustomEvent("vesper:build", { detail: { on: state.buildMode } })
      );
      guideToast(state.buildMode ? "Build on · tap places. Erase in the tray removes." : "Build off", 1600);
    });

  const travelSelect = $("#travel-select");
  if (travelSelect) {
    // The placeholder label is "Go…". Matching the old word "Travel…"
    // missed the HTML option and inserted a second blank row every load.
    if (![...travelSelect.options].some((o) => o.value === "")) {
      const ph = document.createElement("option");
      ph.value = "";
      ph.textContent = "Go…";
      travelSelect.insertBefore(ph, travelSelect.firstChild);
    }
    TRAVEL_NAMES.forEach((n) => {
      if ([...travelSelect.options].some((o) => o.value === n)) return;
      const o = document.createElement("option");
      o.value = n;
      o.textContent = n === "Observation Station" ? "Observation Station ★" : n;
      window.VesperTravel.append(travelSelect, o);
    });
    window.VesperTravel.regroup(travelSelect, bodies);
    travelSelect.value = "";
    travelSelect.addEventListener("change", () => {
      const dest = travelSelect.value;
      if (!dest) return;
      travelTo(dest);
      // Back to placeholder so the same body can be re-picked
      requestAnimationFrame(() => {
        travelSelect.value = "";
        travelSelect.blur();
      });
    });
  }
  const helpBtn = $("#btn-help");
  const helpPanel = $("#help-panel");
  const helpClose = $("#help-close");
  function setHelp(on) {
    if (!helpPanel) return;
    if (on) input.releasePointer();
    helpPanel.classList.toggle("show", !!on);
    helpPanel.setAttribute("aria-hidden", on ? "false" : "true");
    if (on && helpClose) {
      try {
        helpClose.focus();
      } catch (_) {}
    } else if (!on && helpBtn) {
      try {
        const visibleHelp = $("#help-quick") || helpBtn;
        visibleHelp.focus();
      } catch (_) {}
    }
  }
  input.initHelp();
  function toggleHelp() {
    if (!helpPanel) return;
    setHelp(!helpPanel.classList.contains("show"));
  }
  if (helpBtn && helpPanel) {
    helpBtn.addEventListener("click", () => toggleHelp());
  }
  if (helpClose && helpPanel) {
    helpClose.addEventListener("click", () => setHelp(false));
  }
  if (helpPanel) {
    helpPanel.addEventListener("click", (e) => {
      if (e.target === helpPanel) setHelp(false);
    });
  }

  // Mobile vertical thrusters (6DOF) — pointer capture; no leave-clear while held (iOS jank)
  const thrustBtns = {
    up: $("#btn-thrust-up"),
    down: $("#btn-thrust-down"),
  };

  // Soft-land affordance — explicit LAND when near surface
  const landBtn = $("#btn-soft-land");
  function syncLandBtn() {
    if (!landBtn) return;
    const ready = !!(flight.landReady && !flight.walking);
    if (ready) landBtn.removeAttribute("hidden");
    else landBtn.setAttribute("hidden", "");
    if (flight.landBodyName) landBtn.title = "Soft-land on " + flight.landBodyName;
  }
  if (landBtn) {
    const doLand = (e) => {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      if (typeof forceSoftLand === "function") forceSoftLand();
      syncLandBtn();
    };
    landBtn.addEventListener("click", doLand);
    landBtn.addEventListener("touchend", (e) => { e.preventDefault(); doLand(e); }, { passive: false });
  }

  const thrustHeld = { up: null, down: null }; // pointerId or null

  function setThrustDir(which, on, pointerId) {
    const btn = thrustBtns[which];
    const dir = which === "up" ? 1 : -1;
    if (on) {
      thrustHeld[which] = pointerId != null ? pointerId : true;
      flight.vertRaw = dir;
      if (btn) btn.classList.add("active");
    } else {
      thrustHeld[which] = null;
      if (Math.sign(flight.vertRaw) === dir) flight.vertRaw = 0;
      // if the other pad still held, restore its dir
      if (thrustHeld.up != null) flight.vertRaw = 1;
      else if (thrustHeld.down != null) flight.vertRaw = -1;
      if (btn) btn.classList.remove("active");
    }
  }

  function releaseAllThrust() {
    setThrustDir("up", false);
    setThrustDir("down", false);
    flight.vertRaw = 0;
    if (thrustBtns.up) thrustBtns.up.classList.remove("active");
    if (thrustBtns.down) thrustBtns.down.classList.remove("active");
  }

  ["up", "down"].forEach((which) => {
    const btn = thrustBtns[which];
    if (!btn) return;
    // iOS Safari: pointer alone is not enough — block text-select / callout via touch*
    btn.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        setThrustDir(which, true, true);
        markFlightInput();
      },
      { passive: false }
    );
    btn.addEventListener(
      "touchend",
      (e) => {
        e.preventDefault();
        setThrustDir(which, false);
      },
      { passive: false }
    );
    btn.addEventListener(
      "touchcancel",
      () => {
        setThrustDir(which, false);
      },
      { passive: true }
    );
    btn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        btn.setPointerCapture(e.pointerId);
      } catch (_) {}
      setThrustDir(which, true, e.pointerId);
      markFlightInput();
    });
    const endT = (e) => {
      if (thrustHeld[which] == null) return;
      if (e && e.pointerId != null && thrustHeld[which] !== e.pointerId && thrustHeld[which] !== true)
        return;
      try {
        if (e && btn.hasPointerCapture && btn.hasPointerCapture(e.pointerId)) btn.releasePointerCapture(e.pointerId);
      } catch (_) {}
      setThrustDir(which, false);
    };
    btn.addEventListener("pointerup", endT);
    btn.addEventListener("pointercancel", endT);
    window.addEventListener("pointerup", endT);
    window.addEventListener("pointercancel", endT);
    // Do NOT clear on pointerleave while captured — iOS spam leaves stuck otherwise
    btn.addEventListener("pointerleave", (e) => {
      if (btn.hasPointerCapture && e && btn.hasPointerCapture(e.pointerId)) return;
      // only clear if we somehow weren't capturing
      if (thrustHeld[which] != null) endT(e);
    });
    // lostpointercapture is not finger-up on iOS — pointerup/cancel end thrust.
  });

  // Stuck-state release: tab blur / visibility / window blur clears vert + boost
  function releaseTouchFlightHolds() {
    if (typeof releaseAllThrust === "function") releaseAllThrust();
    if (typeof releaseBoost === "function") releaseBoost();
    // Backgrounding often swallows keyup and pointerup. Strafe and the
    // stick stayed down, so the ship was still sliding when the tab returned.
    input.release();
    padFrame = { move: { x: 0, y: 0 }, look: { x: 0, y: 0 }, vertical: 0, roll: 0 };
    flight.stickRaw.x = 0;
    flight.stickRaw.y = 0;
    flight.stick.x = 0;
    flight.stick.y = 0;
    setStickUI(0, 0);
    if (flight.pointers) flight.pointers.clear();
    flight.dragging = false;
    flight.pinchStart = 0;
    flight.lookPointerId = null;
    if (flight.lookDelta) {
      flight.lookDelta.yaw = 0;
      flight.lookDelta.pitch = 0;
    }
  }
  window.addEventListener("blur", releaseTouchFlightHolds);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) releaseTouchFlightHolds();
  });

  function updateWindVisuals() {
    const w = state.windDown;
    // Lighting / mood only — celestial rate comes from clock modes
    applyClockFromWind();
    sunLight.intensity = THREE.MathUtils.lerp(14.0, 7.0, w);
    hemi.intensity = THREE.MathUtils.lerp(0.7, 0.4, w);
    ambient.intensity = THREE.MathUtils.lerp(0.6, 0.35, w);
    if (!flight.walking) {
      scene.fog.density = THREE.MathUtils.lerp(0.000005, 0.000018, w) / Math.max(1, SPEED_MUL * 0.12);
    }
    if (window.__vesperDeepSky && window.__vesperDeepSky.setBeauty) {
      window.__vesperDeepSky.setBeauty(1 - w * 0.45);
    }
    const bias = modeCfg().exposureBias;
    let nearSun = 0;
    if (sunCore && !flight.walking) {
      const sw = new THREE.Vector3();
      sunCore.getWorldPosition(sw);
      const d = flight.pos.distanceTo(sw) / Math.max(1, SUN_R);
      if (d < 40) nearSun = THREE.MathUtils.clamp(1 - (d - 8) / 32, 0, 1);
    }
    renderer.toneMappingExposure =
      THREE.MathUtils.lerp(1.48, 1.12, w) + bias - nearSun * 0.35;
    if (sunGlow) sunGlow.material.opacity = THREE.MathUtils.lerp(1.0, 0.65, w);
    if (stars) stars.material.opacity = THREE.MathUtils.lerp(1.0, 0.72, w);
  }

  if (windRange) {
    windRange.value = String(Math.round(state.windDown * 100));
    windRange.addEventListener("input", () => {
      state.windDown = Number(windRange.value) / 100;
      updateWindVisuals();
    });
  }

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, (typeof PERF !== "undefined" && PERF.pixelRatioMax) || (isTouch ? 1.5 : 2)));
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // --- Animation --------------------------------------------------------
  let last = performance.now();
  let simSeconds = 0;
  const clock = new THREE.Clock();

  function formatClock(days) {
    const d = Math.floor(Math.abs(days));
    const h = Math.floor((Math.abs(days) - d) * 24);
    return "d" + d + " · " + String(h).padStart(2, "0") + "h";
  }


  /** Keep depth precision sane across walk (tiny near) and AU cruise (huge far).
   *  logarithmicDepthBuffer is ON — do NOT clamp far below the sky shell (that caused
   *  the phone bright/black horizon split: near≈0.035 → far capped ~42k ≪ skyR≈1.5M). */
  const _clipNearBody = new THREE.Vector3();
  // With log-depth, huge ratios are fine; keep a soft sanity ceiling only.
  const LOG_DEPTH_MAX_RATIO = 5e9;
  function skyShellR() {
    const ds = window.__vesperDeepSky;
    if (ds && typeof ds.getSkyR === "function") return ds.getSkyR();
    if (ds && ds.skyR) return ds.skyR * (ds.group && ds.group.userData && ds.group.userData._skyScale || 1);
    return Math.max(orbitAU(95), 72000);
  }
  function updateCameraClip() {
    let nearestAlt = Infinity;
    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i];
      if (!b || !b.mesh) continue;
      b.mesh.getWorldPosition(_clipNearBody);
      const alt = flight.pos.distanceTo(_clipNearBody) - b.radius;
      if (alt < nearestAlt) nearestAlt = alt;
    }
    const camR = flight.pos.length();
    const needSky = skyShellR() * 1.08;
    let near;
    let far;
    if (flight.walking) {
      // Slightly higher near on phone walk — avoids bright/black z-fight with sky shell
      near = isTouch ? 0.055 : 0.045;
      far = Math.max(needSky, 80000 * SPEED_MUL, camR + AU_UNIT * 55);
    } else if (nearestAlt < 80) {
      near = THREE.MathUtils.clamp(nearestAlt * 0.07, 0.08, 3.5);
      far = Math.max(needSky, 70000 * SPEED_MUL, camR + AU_UNIT * 50);
    } else if (nearestAlt < 2000) {
      near = THREE.MathUtils.clamp(nearestAlt * 0.035, 1.2, 70);
      far = Math.max(needSky, 90000 * SPEED_MUL, camR + AU_UNIT * 60);
    } else {
      near = THREE.MathUtils.clamp(Math.min(nearestAlt * 0.018, camR * 0.0009), 24, 450);
      far = Math.max(needSky, 110000 * SPEED_MUL, camR * 2.2 + AU_UNIT * 90);
    }
    near = Math.max(0.028, near);
    // CRITICAL: never cut far below the sky shell — prefer raising near slightly
    far = Math.max(near * 2500, far, needSky);
    if (far / near > LOG_DEPTH_MAX_RATIO) {
      near = Math.max(near, far / LOG_DEPTH_MAX_RATIO);
      // Walk still needs a tiny near for PERSON_EYE; floor gently
      if (flight.walking) near = Math.min(near, 0.12);
    }
    if (Math.abs(camera.near - near) / near > 0.08 || Math.abs(camera.far - far) / far > 0.08) {
      camera.near = near;
      camera.far = far;
      camera.updateProjectionMatrix();
    }
  }

  let _lodTick = 0;
  const _lodCam = new THREE.Vector3();
  const _lodBody = new THREE.Vector3();
  function updateDistanceLOD() {
    _lodTick++;
    if ((_lodTick & 3) !== 0) return; // every 4th frame — mobile friendly
    camera.getWorldPosition(_lodCam);
    const far = PERF.lodFar;
    const moonHide = PERF.lodMoonHide;
    const atmoHide = PERF.lodAtmoHide;
    const detailHide = PERF.lodMid;
    const holdName = flight.shellsHoldBody || (flight.walking ? flight.walkBody : null);
    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i];
      if (!b || !b.group) continue;
      b.group.getWorldPosition(_lodBody);
      const d = _lodBody.distanceTo(_lodCam);
      const kids = b.group.children;
      for (let k = 0; k < kids.length; k++) {
        const ch = kids[k];
        if (!ch || !ch.userData) continue;
        if (ch.userData.isBodySurface || ch.name === "bodySurface") {
          ch.visible = true;
          ch.userData._walkHidden = false;
          continue;
        }
        // CRITICAL: never revive shells hidden for walk / takeoff (was white-slice desync)
        if (ch.userData._walkHidden) {
          ch.visible = false;
          continue;
        }
        if (holdName && b.name === holdName && (ch.userData.isAtmosphere || ch.userData.isCloudDetail || ch.userData.isBandDetail || ch.name === "clouds" || ch.name === "atmosphere")) {
          ch.visible = false;
          continue;
        }
        if (ch.userData.isAtmosphere) ch.visible = d < atmoHide;
        else if (ch.userData.isMoonGroup) ch.visible = d < moonHide;
        else if (ch.userData.isCloudDetail || ch.userData.isBandDetail) ch.visible = d < detailHide * 1.6;
        else if (ch.name === "rings") ch.visible = d < moonHide * 1.2;
      }
    }
    // Belt dust (child 0) cheaper hide when far from belt band; rocks stay for landables nearby
    const camR = _lodCam.length();
    if (asteroidBelt) {
      const nearBelt = Math.abs(camR - orbitAU(2.7)) < far;
      const dust = asteroidBelt.userData.dust;
      if (dust) dust.visible = nearBelt || camR < far;
      asteroidBelt.visible = true; // keep rocks for Travel spoof; dust is the heavy Points
    }
    if (kuiperBelt) {
      const nearK = Math.abs(camR - orbitAU(40)) < far * 2;
      kuiperBelt.children.forEach((ch, idx) => {
        if (idx === 0) ch.visible = nearK || camR < far * 2; // dust
      });
    }
  }


  let _fpsEma = 60;
  let _adaptAcc = 0;
  function maybeAdaptPixelRatio(dt) {
    if (!PERF.low && !isTouch) return;
    const fps = dt > 0 ? 1 / dt : 60;
    _fpsEma = _fpsEma * 0.88 + fps * 0.12;
    _adaptAcc += dt;
    if (_adaptAcc < 0.85) return;
    _adaptAcc = 0;
    const maxPR = PERF.pixelRatioMax || 1.15;
    let target = maxPR;
    if (_fpsEma < 24) target = 1.0;
    else if (_fpsEma < 32) target = Math.min(target, 1.0);
    else if (_fpsEma < 42) target = Math.min(target, 1.1);
    const cur = renderer.getPixelRatio();
    if (Math.abs(cur - target) > 0.05) {
      renderer.setPixelRatio(target);
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    // Lag: hide furthest dust fields (draw-call cut)
    try {
      const hideDust = _fpsEma < 30;
      if (asteroidBelt && asteroidBelt.userData && asteroidBelt.userData.dust) {
        asteroidBelt.userData.dust.visible = !hideDust || flight.pos.length() < orbitAU(4.5);
      }
      if (kuiperBelt && kuiperBelt.userData && kuiperBelt.userData.dust) {
        kuiperBelt.userData.dust.visible = !hideDust || flight.pos.length() > orbitAU(20);
      }
      // adaptiveNebula: dim emission sprites when FPS dips (iPhone 11)
      if (window.__vesperDeepSky && window.__vesperDeepSky.setBeauty) {
        window.__vesperDeepSky.setBeauty(_fpsEma < 28 ? 0.45 : 1);
      }
    } catch (_) {}
  }
  const _phM = new THREE.Vector3();
  const _phA = new THREE.Vector3();
  const _phB = new THREE.Vector3();

  function stickWalkAfterOrbits() {
    if (!flight.walking) return;
    const b = findBody(flight.walkBody);
    if (!b || !b.mesh) return;
    const mat = bodyWorldMatrix(b);
    flight.pos.copy(flight.walkLocal).applyMatrix4(mat);
    b.mesh.getWorldPosition(_walkBody);
    _walkN.copy(flight.pos).sub(_walkBody);
    const nlen = _walkN.length();
    if (nlen < 1e-6) _walkN.set(0, 1, 0);
    else _walkN.multiplyScalar(1 / nlen);
    const eye = flight.walkEye || walkEyeHeight(b.radius);
    flight.pos.copy(_walkBody).addScaledVector(_walkN, b.radius + eye);
    _walkMatInv.copy(mat).invert();
    flight.walkLocal.copy(flight.pos).applyMatrix4(_walkMatInv);
    applyLook();
    if (WALK.alignUp) {
      camera.getWorldDirection(_fwd);
      _lookTo.copy(flight.pos).addScaledVector(_fwd, 8);
      camera.up.copy(_walkN);
      camera.lookAt(_lookTo);
    }
    if (window.__vesperDeepSky && window.__vesperDeepSky.follow) {
      window.__vesperDeepSky.follow(flight.pos, camera.far);
    } else if (skyDome) {
      skyDome.position.copy(flight.pos);
    }
    if (stars) stars.position.copy(flight.pos);
  }


  function toUnlit(m) {
    if (!m) return m;
    const lit = m.isMeshStandardMaterial || m.isMeshLambertMaterial || m.isMeshPhongMaterial;
    if (!lit) return m;
    const color = m.color ? m.color.clone() : new THREE.Color(0xffffff);
    if (m.emissive && m.emissiveIntensity > 0.05) {
      const e = m.emissive;
      if (e.r + e.g + e.b > 0.02) color.lerp(e, Math.min(0.85, m.emissiveIntensity));
    }
    const basic = new THREE.MeshBasicMaterial({
      color: color,
      map: m.map || null,
      alphaMap: m.alphaMap || null,
      transparent: !!m.transparent,
      opacity: m.opacity != null ? m.opacity : 1,
      side: m.side != null ? m.side : THREE.FrontSide,
      depthWrite: m.depthWrite !== false,
      depthTest: m.depthTest !== false,
      polygonOffset: !!m.polygonOffset,
      polygonOffsetFactor: m.polygonOffsetFactor || 0,
      polygonOffsetUnits: m.polygonOffsetUnits || 0,
      vertexColors: !!m.vertexColors,
      fog: m.fog !== false,
      blending: m.blending,
      wireframe: !!m.wireframe,
    });
    basic.name = m.name || "";
    basic.emissiveIntensity = m.emissiveIntensity;
    return basic;
  }

  let _unlitScrubAt = 0;
  function scrubUnlit(force) {
    const now = performance.now();
    if (!force && now - _unlitScrubAt < 800) return;
    _unlitScrubAt = now;
    if (scene.environment) {
      const tex = scene.environment;
      scene.environment = null;
      if (tex && tex.dispose) tex.dispose();
    }
    const dead = [];
    const lights = [];
    scene.traverse((o) => {
      if (o.isLight) lights.push(o);
      if (!o.isMesh || !o.material) return;
      if (Array.isArray(o.material)) {
        o.material = o.material.map((m) => {
          const b = toUnlit(m);
          if (b !== m) dead.push(m);
          return b;
        });
      } else {
        const b = toUnlit(o.material);
        if (b !== o.material) {
          dead.push(o.material);
          o.material = b;
        }
      }
    });
    lights.forEach((l) => {
      if (l.parent) l.parent.remove(l);
    });
    dead.forEach((m) => {
      try { m.dispose(); } catch (_) {}
    });
  }

  function animate() {
    requestAnimationFrame(animate);
    // Headless probes set this so one explicit render is not stacked
    // on a multi-second SwiftShader frame. Unset on device.
    // Scrub before the pause return so a paused probe still drops
    // Standard materials and extra lights.
    scrubUnlit(false);
    if (window.__vesperPausePaint) return;
    const now = performance.now();
    let dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    // Background tabs: park the sim (save battery / thermal) until focused again
    if (document.hidden) {
      applyLook();
      return;
    }
    pollInputPad(dt);
    const simDt = state.paused ? 0 : dt;
    const t = clock.getElapsedTime();
    const scale = state.timeScale;

    if (!state.paused) integrateFlight(dt);
    else applyLook();
    syncFlightChip();

    updateLookAt(dt);

    if (sunCore) sunCore.rotation.y += 0.02 * simDt * scale;
    if (sunGlow) {
      const pulse = 1 + Math.sin(t * 0.35 * scale) * 0.03 * (1 - state.windDown * 0.5);
      sunGlow.scale.set(SUN_R * 7.2 * pulse, SUN_R * 7.2 * pulse, 1);
      const corona = sunCore && sunCore.parent && sunCore.parent.userData.corona;
      if (corona) {
        const cp = 1 + Math.sin(t * 0.22 * scale + 1.2) * 0.05;
        corona.scale.set(SUN_R * 14 * cp, SUN_R * 14 * cp, 1);
        corona.material.opacity = 0.38 + 0.12 * Math.sin(t * 0.5);
      }
      const sw = sunCore.parent && sunCore.parent.userData.solarWind;
      if (sw) {
        sw.rotation.y += 0.015 * simDt * scale;
        sw.material.opacity = 0.2 + 0.12 * (0.5 + 0.5 * Math.sin(t * 0.4));
      }
    }

    bodies.forEach((b) => {
      if (b.fixed || b.isMoon) return;
      b.angle += b.def.speed * simDt * scale;
      const ecc = (b.def && b.def.ecc) || 0;
      const o = b.def.orbit;
      const rOrb = ecc > 0 ? (o * (1 - ecc * ecc)) / (1 + ecc * Math.cos(b.angle)) : o;
      const x = Math.cos(b.angle) * rOrb;
      const z = Math.sin(b.angle) * rOrb;
      b.group.position.set(x, b.def.y, z);
      if (b.def && b.def.kind === "starman") {
        b.group.rotation.y = -b.angle + Math.PI / 2;
      } else {
        const rotDays = (b.def && b.def.rotDays != null) ? b.def.rotDays : (ROT_DAYS[b.name] || 1);
        const spin = (Math.PI * 2) / (Math.abs(rotDays) * SIM_DAY) * (rotDays < 0 ? -1 : 1);
        b.mesh.rotation.y += spin * simDt * scale;
        if (!window.__vesperIllum) window.__vesperIllum = {};
        // Stations, probes, and rovers sit at a display distance.
        // Kepler on that distance told the ISS it orbits Sol once a year.
        if (b.def && b.def.manmade) {
          const info = window.VesperPolishCore.record(window.__vesperIllum, b.name);
          info.kind = "craft"; delete info.parent; delete info.periodDays; delete info.rotDays;
        } else {
          const info = window.VesperPolishCore.record(window.__vesperIllum, b.name);
          info.kind = b.def && b.def.dwarf ? "dwarf" : "planet";
          info.parent = "Sol";
          info.periodDays = b.def && b.def.au ? 365.256 * Math.pow(b.def.au, 1.5) : null;
          info.rotDays = rotDays;
        }
        b.group.rotation.z = (b.def.tilt || 0) * 0.35;
      }
      const clouds = b.group.getObjectByName("clouds");
      if (clouds) clouds.rotation.y += 0.08 * simDt * scale;
      const moons = b.group.userData.moons;
      if (moons) {
        moons.forEach((moonG, mi) => {
          moonG.userData.angle += moonG.userData.speed * simDt * scale;
          const elev = (mi % 2 === 0 ? 0.12 : -0.08) * moonG.userData.orbit * 0.05;
          moonG.position.set(
            Math.cos(moonG.userData.angle) * moonG.userData.orbit,
            elev,
            Math.sin(moonG.userData.angle) * moonG.userData.orbit
          );
          const moonMesh = moonG.children[0];
          if (moonMesh) {
            if (moonG.userData.tidalLock) {
              // Same face toward the parent. Period = sidereal orbit (Moon 27.3 d, not 24 h).
              moonMesh.rotation.y = moonG.userData.angle + Math.PI;
            } else if (moonG.userData.spinHours) {
              // Hours, same clock as planet rotDays (SIM_DAY wall seconds per day).
              const spin = (Math.PI * 2) / ((moonG.userData.spinHours / 24) * SIM_DAY);
              moonMesh.rotation.y += spin * simDt * scale;
            } else {
              moonMesh.rotation.x += 0.07 * simDt * scale;
              moonMesh.rotation.z += 0.11 * simDt * scale;
            }
          }
        });
        // All orbital positions are now current: propagate this family once.
        b.group.updateMatrixWorld(true);
        moons.forEach((moonG, mi) => {
          _phM.setFromMatrixPosition(moonG.matrixWorld);
          _phA.setFromMatrixPosition(b.group.matrixWorld);
          _phB.copy(_phM).multiplyScalar(-1);
          _phA.sub(_phM);
          const la = _phB.length() || 1;
          const lb = _phA.length() || 1;
          const cosP = THREE.MathUtils.clamp(_phB.dot(_phA) / (la * lb), -1, 1);
          const frac = (1 + cosP) * 0.5;
          moonG.userData.phase = frac;
          if (!window.__vesperIllum) window.__vesperIllum = {};
          const info = window.VesperPolishCore.record(window.__vesperIllum, moonG.userData.bodyName);
          info.kind = "moon";
          info.parent = b.name;
          info.periodDays = moonG.userData.periodDays;
          info.lock = !!moonG.userData.tidalLock;
          info.retro = !!moonG.userData.retrograde;
          info.phase = frac;
          // Enceladus south-pole jets — soft opacity pulse (alive science cue)
          if (moonG.userData.bodyName === "Enceladus") {
            const plumes = moonG.getObjectByName("enceladusPlumes");
            if (plumes) {
              const pulse = 0.12 + 0.1 * (0.5 + 0.5 * Math.sin(performance.now() * 0.0018 + mi));
              plumes.children.forEach((ch, ci) => {
                if (ch.material && ch.material.opacity != null && ch.name === "enceladusPlume") {
                  ch.material.opacity = pulse + (ci % 3) * 0.03;
                }
              });
            }
          }
          // Io volcanic glow pulse
          if (moonG.userData.bodyName === "Io") {
            const glow = moonG.getObjectByName("ioVolcano");
            if (glow && glow.material && glow.material.opacity != null) {
              glow.material.opacity = 0.35 + 0.25 * (0.5 + 0.5 * Math.sin(performance.now() * 0.0022));
            }
          }
        });
      }
    });

    // Moon orbits move after the walker is planted. A fast moon
    // (Titania ~17u/frame) left the eye inside the mesh until the next
    // plant. Re-stick before the draw.
    stickWalkAfterOrbits();

    maybeAdaptPixelRatio(dt);
    updateCameraClip();
    updateDistanceLOD();
    if (stars) stars.rotation.y += 0.0025 * simDt * scale;
    if (asteroidBelt) asteroidBelt.rotation.y += 0.0008 * simDt * scale;
    if (kuiperBelt) kuiperBelt.rotation.y += 0.0003 * simDt * scale;

    if (simDt > 0) {
      simSeconds += (simDt * scale) / SIM_DAY;
      if (clockEl) window.VesperPolishCore.setText(clockEl, formatClock(simSeconds));
      if (!animate._noteAcc) animate._noteAcc = 0;
      animate._noteAcc += simDt;
      if (animate._noteAcc > 2.5 && window.VesperComms && window.VesperComms.noteBody) {
        animate._noteAcc = 0;
        const focus = flight.walking ? flight.walkBody : state.lookingAt;
        if (focus) window.VesperComms.noteBody(focus);
      }
    }

    if (window.VesperShip && window.VesperShip.tick) {
      try { window.VesperShip.tick(dt, flight, camera); } catch (_) {}
    }
    if (window.VesperPlaces && window.VesperPlaces.tick) {
      try { window.VesperPlaces.tick(dt, flight); } catch (_) {}
    }
    if (window.VesperLife && window.VesperLife.tick) {
      try { window.VesperLife.tick(dt, flight); } catch (_) {}
    }
    // void-guard: never leave phone on a blank clear
    if (!flight.walking) {
      if (stars) stars.visible = true;
      if (skyDome) skyDome.visible = true;
      if (scene.background && scene.background.getHex && scene.background.getHex() === 0) {
        scene.background.setHex(0x050714);
      }
    }
    if (!isFinite(camera.position.x) || !isFinite(flight.pos.x)) {
      flight.pos.copy(HOME);
      camera.position.copy(HOME);
    }
    renderer.render(scene, camera); /* void-guard */
    if (window.__vesperOpeningState !== "ready") {
      window.__vesperOpeningState = window.VesperOpening.transition(window.__vesperOpeningState || "loading", "frame");
      const status = document.getElementById("opening-status");
      if (status) status.textContent = "Your view is ready";
    }
  }

  window.VesperSky = {
    getMode: () => state.mode,
    setMode,
    setProduct,
    getProduct: () => state.product,
    getClockMode: () => state.clockMode,
    setClockMode,
    getTimeScale: () => state.timeScale,
    getLookingAt: () => state.lookingAt,
    getNearSurface: () => state.nearSurface,
    isWalking: () => !!flight.walking,
    getFlightPos: () => flight.pos.clone(),
    getWalkBody: () => flight.walkBody,
    forceWalk: (name) => {
      const b = findBody(name);
      if (!b) return false;
      b.mesh.getWorldPosition(_walkBody);
      _walkN.copy(flight.pos).sub(_walkBody);
      if (_walkN.lengthSq() < 1e-6) _walkN.set(0, 1, 0);
      else _walkN.normalize();
      flight.pos.copy(_walkBody).addScaledVector(_walkN, b.radius + walkEyeHeight(b.radius));
      flight.vel.set(0, 0, 0);
      return enterWalk(b, _walkBody);
    },
    forceTakeoff: () => {
      if (!flight.walking) return false;
      const b = findBody(flight.walkBody);
      if (!b || !b.mesh) return false;
      b.mesh.getWorldPosition(_walkBody);
      return takeoffLeave(b, _walkBody);
    },
    getBlurb: (name) => PLANET_BLURBS[name] || "",
    getQuality: () => QUALITY,
    getScale: () => Object.assign({}, SCALE_DOC, { soft: Object.assign({}, SOFT) }),
    getControls: () => controlMap(),
    getSoft: () => Object.assign({}, SOFT),
    getRiver: () => ({
      count: RIVER.patterns.length,
      active: RIVER.active,
      pattern: RIVER.lastName,
      idx: RIVER.idx,
      reduced: RIVER.reduced,
      packs: RIVER.patterns.reduce((acc, p) => {
        acc[p.pack] = (acc[p.pack] || 0) + 1;
        return acc;
      }, {}),
    }),
    markInput: () => markFlightInput(),
    setSoft: (partial) => {
      if (!partial || typeof partial !== "object") return;
      Object.keys(partial).forEach((k) => {
        if (k in SOFT && typeof partial[k] === "number") SOFT[k] = partial[k];
      });
    },
    getPos: () => flight.pos.toArray(),
    renderer: () => renderer,
    scene: () => scene,
    system: () => window.__vesperSystem || null,
    getVel: () => flight.vel.toArray(),
    getSpeed: () => flight.vel.length(),
    teleport: (x, y, z) => {
      flight.pos.set(x, y, z);
      flight.vel.set(0, 0, 0);
      flight.wishSmooth.set(0, 0, 0);
      applyLook();
    },
    travelTo,
    travelNames: () => TRAVEL_NAMES.slice(),
    lookAtWorld: (x, y, z) => {
      faceToward(new THREE.Vector3(x, y, z));
      applyLook();
    },
    boost: (on) => {
      flight.virtualBoost = !!on;
      syncInputBoost();
    },
    thrustForward: (seconds, boost) => {
      // Existing caller API uses the same semantic action as keys.
      input.setVirtual("forward", true);
      flight.virtualBoost = !!boost; syncInputBoost();
      return () => { input.setVirtual("forward", false); flight.virtualBoost = false; syncInputBoost(); };
    },
    step: (dt) => {
      const d = dt || 1 / 60;
      integrateFlight(d);
      updateLookAt(d);
    },
    pause: (v) => {
      state.paused = !!v;
      syncPauseUI();
    },
    reset: () => resetBtn && resetBtn.click(),
    setWind: (v) => {
      state.windDown = THREE.MathUtils.clamp(v, 0, 1);
      if (windRange) {
        windRange.value = String(Math.round(state.windDown * 100));
      }
      updateWindVisuals();
    },
    bodies: () =>
      bodies.map((b) => {
        const w = new THREE.Vector3();
        b.mesh.getWorldPosition(w);
        return {
          name: b.name,
          radius: b.radius,
          pos: w.toArray(),
          isMoon: !!b.isMoon,
          isAsteroid: !!b.isAsteroid,
          landable: !!b.landable,
        };
      }),
    getGear: () => currentGear(),
    setGear,
    cycleGear,
    getGears: () => GEARS.map((g) => Object.assign({}, g)),
    getStraightMan: () => !!state.straightMan,
    setStraightMan,
    getCamera: () => camera,
    getBuildMode: () => !!state.buildMode,
    setBuildMode: (on) => {
      state.buildMode = !!on;
      document.body.dataset.build = state.buildMode ? "1" : "0";
      window.dispatchEvent(
        new CustomEvent("vesper:build", { detail: { on: state.buildMode } })
      );
    },
    getBoostHold: () => state.boostHold,
    registerBody: (b) => {
      if (b && b.name && b.mesh) {
        const ix = bodies.findIndex((x) => x.name === b.name);
        if (ix >= 0) bodies[ix] = b;
        else bodies.push(b);
        if (TRAVEL_NAMES.indexOf(b.name) < 0) {
          const at = Math.min(2, TRAVEL_NAMES.length);
          TRAVEL_NAMES.splice(at, 0, b.name);
        }
        const sel = document.getElementById("travel-select");
        if (sel) {
          const existing = [...sel.options].find((o) => o.value === b.name);
          if (existing && (b.straightHide || b.name === "Observation Station" || b.name === "Observation Lounge Annex")) {
            existing.hidden = !!state.straightMan;
          }
        }
        if (sel && ![...sel.options].some((o) => o.value === b.name)) {
          const o = document.createElement("option");
          o.value = b.name;
          o.textContent = (b.hypothetic ? "◈ " : "") + b.name + (b.observation ? " ★" : "");
          if (b.hypothetic) o.dataset.hyp = "1";
          if (b.straightHide || b.name === "Observation Station" || b.name === "Observation Lounge Annex") {
            o.hidden = !!state.straightMan;
          }
          window.VesperTravel.append(sel, o, b);
        }
      }
    },
    replaceBody: (b) => {
      if (!b || !b.name || !b.mesh) return;
      const ix = bodies.findIndex((x) => x.name === b.name);
      if (ix >= 0) bodies[ix] = Object.assign({}, bodies[ix], b);
      else window.VesperSky.registerBody(b);
    },
    updateBody: (b) => window.VesperSky.replaceBody(b),
    _bodiesRef: () => bodies,
    setHideControls,
    getHideControls: () => !!state.hideControls,
    guideToast,
    setQualityTier: (t) => {
      if (t !== "auto" && t !== "high" && t !== "ultra") return;
      qualityTier = t;
      try {
        localStorage.setItem(LS_QUALITY, t);
      } catch (_) {}
      guideToast("Quality · " + t + " — reload to fully apply", 2400);
    },
    getQualityTier: () => qualityTier,
    version: () => window.VesperVersion,
    forceSoftLand,
    isWalking: () => !!flight.walking,
    getFlight: () => flight,
    getCamera: () => camera,
    getScene: () => scene,
    getRenderer: () => renderer,
    getCamMode: () => flight.camMode || "chase",
    setCamMode: (m) => {
      flight.camMode = m === "cockpit" || m === "fp" ? "cockpit" : "chase";
      try { document.body.dataset.cam = flight.camMode; } catch (_) {}
      if (typeof guideToast === "function") {
        guideToast(flight.camMode === "cockpit" ? "Cam · cockpit" : "Cam · chase", 1400);
      }
    },
  };
  flight.camMode = "chase";
  flight.shipParked = false;
  flight.landReady = false;
  flight.landBodyName = null;
  flight.shipParkPos = new THREE.Vector3();
  flight.shipParkQuat = new THREE.Quaternion();

  buildWorld().then(() => {
    resetFlight();
    // Honor product + FLOAT/PILOT + clock
    if (typeof setProduct === "function") setProduct(state.product || "learn", { toast: false });
    setMode(state.mode, { toast: false });
    setClockMode(state.clockMode, { toast: false });
    setGear(state.gearIndex, { toast: false });
    setStraightMan(state.straightMan, { toast: false });
    updateWindVisuals();
    syncPauseUI();
    syncClockUI();
    syncFlightChip();
    syncRiverChip();
    syncGearUI();
    RIVER.lastInputAt = performance.now();
    setProgress(1);
    state.ready = true;
    if (travelSelect) window.VesperTravel.regroup(travelSelect, bodies);
    // Phone: densify starfield after first smooth frames (butter open)
    if (PERF.low && stars && typeof makeStarField === "function") {
      setTimeout(() => {
        try {
          const denser = makeStarField(2200);
          denser.rotation.copy(stars.rotation);
          scene.remove(stars);
          if (stars.geometry) stars.geometry.dispose();
          stars = denser;
          scene.add(stars);
        } catch (_) {}
      }, 1550);
    }
    // Ship first (visible in chase); stagger places/life to cut iPhone hitch
    try {
      if (window.VesperShip && window.VesperShip.boot) window.VesperShip.boot({ THREE, scene, camera, flight });
    } catch (e) { console.warn("[vesper-ship]", e); }
    window.dispatchEvent(new CustomEvent("vesper:ready", { detail: { version: window.VesperVersion } }));
    setTimeout(() => {
      try {
        if (window.VesperPlaces && window.VesperPlaces.boot) window.VesperPlaces.boot({ THREE, scene });
      } catch (e) { console.warn("[vesper-places]", e); }
      try {
        if (window.VesperLife && window.VesperLife.boot) window.VesperLife.boot({ THREE, scene, camera, flight });
      } catch (e) { console.warn("[vesper-life]", e); }
    }, PERF.low ? 520 : 40);
    setTimeout(() => {
      loader && loader.classList.add("hide");
      window.VesperPerf.markLoaderHidden();
      // Rubric: smooth first open — PMREM after a few frames (not during loader)
      (function deferEnv() {
        let n = 0;
        const need = PERF.low ? 8 : 2;
        function step() {
          n++;
          if (n < need) {
            requestAnimationFrame(step);
            return;
          }
          try {
            if (window.__vesperEnsureEnv) window.__vesperEnsureEnv();
          } catch (_) {}
        }
        requestAnimationFrame(step);
      })();
    }, PERF.low ? 640 : 280);
    animate();
  });
})();
