/**
 * Vesper Observation Station + Sky Radio
 * Walkable belt habitat (somewhat obvious). Interior Skytape/cassette prop —
 * original geometry (Guardians-adjacent vibe, NOT Marvel IP/assets/audio).
 * Interact E / tap to EQUIP → unlocks radio HUD (localStorage). Until then: no HUD button.
 * Stations: procedural Web Audio instrumentals only.
 */
(function () {
  "use strict";

  const STATION_NAME = "Observation Station";
  const LS_EQUIPPED = "vesper.skytapeEquipped";
  const LS_MUTE = "vesper.skytapeMuted";
  const LS_TRACK = "vesper.skytapeTrack";
  const INTERACT_RANGE = 14;
  const ENTER_HINT_RANGE = 120;
  const TUNE_NEAR = 220;

  let root = null;
  let stationGroup = null;
  let skytapeMesh = null;
  let doorLight = null;
  let bayLight = null;
  let equipped = false;
  let muted = false;
  let interactPrompt = null;
  let radioBtn = null;
  let radioPanel = null;
  let audioCtx = null;
  let master = null;
  let staticGain = null;
  let musicGain = null;
  let nodes = [];
  let trackIdx = 0;
  let raf = 0;
  let reduced = false;
  let nearSkytape = false;
  let insideBay = false;
  let lastEquipFlash = 0;
  let raycaster = null;
  let pointer = null;
  let stationPos = null;
  let stationRadius = 22;
  let unlockedToastOnce = false;

  const TRACKS = [
    { id: "driftwave", call: "ISSY · Driftwave", bpm: 72, root: 110, intervals: [0, 3, 7, 10, 12], wave: "sine", filter: 920, arpeggio: false },
    { id: "corona", call: "HELIOS · Corona Soft", bpm: 88, root: 98, intervals: [0, 5, 7, 12, 19], wave: "triangle", filter: 1400, arpeggio: true },
    { id: "ringband", call: "RING · Ice Whisper", bpm: 60, root: 82, intervals: [0, 2, 7, 9, 14], wave: "sine", filter: 680, arpeggio: false },
    { id: "beltpulse", call: "BELT · Ore Pulse", bpm: 96, root: 118, intervals: [0, 7, 12, 16, 19], wave: "triangle", filter: 720, arpeggio: true },
    { id: "longnight", call: "KUIPER · Long Night", bpm: 52, root: 64, intervals: [0, 5, 10, 12, 17], wave: "triangle", filter: 480, arpeggio: false },
    { id: "overlook", call: "EARTH · Overlook AM", bpm: 78, root: 146, intervals: [0, 4, 7, 11, 14], wave: "sine", filter: 1100, arpeggio: true },
    { id: "quietcare", call: "AZEMONDAR · Quiet Care", bpm: 66, root: 92, intervals: [0, 3, 7, 10, 14, 17], wave: "sine", filter: 860, arpeggio: false },
    { id: "chromedrift", call: "STARMAN · Chrome Drift", bpm: 84, root: 130, intervals: [0, 5, 7, 12, 16], wave: "triangle", filter: 1250, arpeggio: true },
  ];

  function THREE() { return window.THREE; }
  function sky() { return window.VesperSky; }
  function straight() {
    const s = sky();
    return s && s.getStraightMan && s.getStraightMan();
  }
  function toast(msg, ms) {
    if (window.VesperMessages) window.VesperMessages.show(msg, ms || 4200);
  }

  function loadFlags() {
    try {
      equipped = localStorage.getItem(LS_EQUIPPED) === "1";
      muted = localStorage.getItem(LS_MUTE) === "1";
      const ti = parseInt(localStorage.getItem(LS_TRACK) || "0", 10);
      trackIdx = isFinite(ti) ? Math.max(0, Math.min(TRACKS.length - 1, ti)) : 0;
    } catch (_) {}
  }
  function saveEquipped() {
    try { localStorage.setItem(LS_EQUIPPED, equipped ? "1" : "0"); } catch (_) {}
  }
  function saveMute() {
    try { localStorage.setItem(LS_MUTE, muted ? "1" : "0"); } catch (_) {}
  }
  function saveTrack() {
    try { localStorage.setItem(LS_TRACK, String(trackIdx)); } catch (_) {}
  }

  /* ---------- Materials / meshes (original) ---------- */
  function matMetal(T, color, emissive, ei) {
    return window.VesperMat({
      color: color,
      metalness: 0.72,
      roughness: 0.32,
      emissive: emissive || 0x000000,
      emissiveIntensity: ei || 0,
      flatShading: false,
    });
  }
  function matPaint(T, color, emissive, ei) {
    return window.VesperMat({
      color: color,
      metalness: 0.18,
      roughness: 0.62,
      emissive: emissive || 0x000000,
      emissiveIntensity: ei || 0,
    });
  }

  /** Skytape + cassette — original prop, warm orange/teal “mix-tape traveler” vibe */
  function buildSkytape(T) {
    const g = new T.Group();
    g.name = "skytapeProp";
    const body = new T.Mesh(
      new T.BoxGeometry(1.35, 0.85, 0.38),
      matPaint(T, 0xf0a060, 0x3a1808, 0.15)
    );
    body.castShadow = true;
    // Window / deck
    const tapeWindow = new T.Mesh(
      new T.BoxGeometry(0.85, 0.42, 0.06),
      matPaint(T, 0x1a2430, 0x40c8ff, 0.35)
    );
    tapeWindow.position.set(0, 0.08, 0.2);
    // Cassette shell inside window
    const tape = new T.Mesh(
      new T.BoxGeometry(0.7, 0.32, 0.08),
      matPaint(T, 0xc45c8a, 0x400820, 0.2)
    );
    tape.position.set(0, 0.08, 0.16);
    const reelL = new T.Mesh(new T.CylinderGeometry(0.08, 0.08, 0.05, 12), matMetal(T, 0xd8d0c0));
    reelL.rotation.x = Math.PI / 2;
    reelL.position.set(-0.18, 0.08, 0.22);
    const reelR = reelL.clone();
    reelR.position.x = 0.18;
    // Buttons
    const btnMat = matPaint(T, 0x2a2238, 0x8060ff, 0.25);
    [-0.4, -0.15, 0.1, 0.35].forEach((x, i) => {
      const b = new T.Mesh(new T.BoxGeometry(0.16, 0.1, 0.08), btnMat);
      b.position.set(x, -0.28, 0.2);
      g.add(b);
    });
    // Orange accent stripe (original — not a franchise logo)
    const stripe = new T.Mesh(
      new T.BoxGeometry(1.36, 0.08, 0.02),
      matPaint(T, 0xff6a2a, 0xff3a00, 0.4)
    );
    stripe.position.set(0, 0.38, 0.2);
    // Headphone jack nub
    const jack = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 0.12, 8), matMetal(T, 0x8899aa));
    jack.rotation.z = Math.PI / 2;
    jack.position.set(-0.72, -0.1, 0);
    // Belt clip
    const clip = new T.Mesh(new T.BoxGeometry(0.35, 0.55, 0.06), matMetal(T, 0x9aa8b8));
    clip.position.set(0, 0.05, -0.22);
    // Soft point light on prop
    const glow = window.VesperNoLight(0xffb070, 0.65, 18, 2);
    glow.position.set(0, 0.5, 1.2);
    g.add(body, tapeWindow, tape, reelL, reelR, stripe, jack, clip, glow);
    g.userData.reels = [reelL, reelR];
    g.userData.glow = glow;
    // Interact proxy (larger hit)
    const hit = new T.Mesh(
      new T.SphereGeometry(1.8, 12, 10),
      new T.MeshBasicMaterial({ visible: false })
    );
    hit.name = "skytapeHit";
    g.add(hit);
    g.scale.setScalar(1.15);
    return g;
  }

  /** Hab dome + docking ring + lit bay interior — readable from cruise distance */
  function buildStation(T) {
    /** AAA habitat: rock dock + hub + ring + arrays + docking + bay (Skytape). */
    const g = new T.Group();
    g.name = "observationStation";

    let hullMap = null;
    try {
      hullMap = (window.__vesperProcTex && window.__vesperProcTex.stationHull) || null;
    } catch (_) {}
    const hullN = (window.__vesperProcTex && window.__vesperProcTex.stationHullNormal) || null;
    const hull = hullMap
      ? window.VesperMat({
          map: hullMap,
          normalMap: hullN || null,
          color: 0xffffff,
          metalness: 0.62,
          roughness: 0.38,
          emissive: 0x102030,
          emissiveIntensity: 0.18,
          normalScale: hullN ? new T.Vector2(1.4, 1.4) : undefined,
        })
      : matMetal(T, 0x8a94a8, 0x102030, 0.22);
    const accent = matPaint(T, 0x4ec4a8, 0x1a8060, 0.45);
    const warm = matPaint(T, 0xffc080, 0xff8020, 0.55);
    const solarMat = matPaint(T, 0x1a3870, 0x0a1840, 0.35);
    const white = matMetal(T, 0xd0d8e0, 0x203040, 0.12);

    // Asteroid pedestal
    const rockMap = (window.__vesperProcTex && window.__vesperProcTex.stationRock) || null;
    const rockN = (window.__vesperProcTex && window.__vesperProcTex.stationRockNormal) || null;
    const rock = new T.Mesh(
      new T.DodecahedronGeometry(16, 1),
      window.VesperMat({
        map: rockMap || null,
        normalMap: rockN || null,
        color: rockMap ? 0xffffff : 0x6a5e52,
        roughness: 0.94,
        metalness: 0.06,
        flatShading: !rockMap,
        emissive: 0x0c0a08,
        emissiveIntensity: 0.1,
        normalScale: rockN ? new T.Vector2(1.8, 1.8) : undefined,
      })
    );
    rock.scale.set(1.4, 0.92, 1.2);
    rock.position.y = -7;

    // Core habitat cylinder
    const cylinder = new T.Mesh(new T.CylinderGeometry(7.6, 8.2, 14, 40, 1, true), hull);
    cylinder.position.y = 5;
    const dome = new T.Mesh(new T.SphereGeometry(7.8, 40, 28, 0, Math.PI * 2, 0, Math.PI * 0.5), hull);
    dome.position.y = 12;
    // Cupola observation dome
    const cupola = new T.Mesh(
      new T.SphereGeometry(3.2, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.65),
      window.VesperMat({
        color: 0x88c8ff,
        metalness: 0.2,
        roughness: 0.15,
        transparent: true,
        opacity: 0.55,
        emissive: 0x204060,
        emissiveIntensity: 0.25,
      })
    );
    cupola.position.y = 14.8;

    // Gravity ring (visual)
    const ring = new T.Mesh(new T.TorusGeometry(11.5, 1.1, 12, 48), hull);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 5.5;
    const ringSpokes = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const spoke = new T.Mesh(new T.BoxGeometry(0.45, 0.35, 7.2), white);
      spoke.position.set(Math.cos(a) * 5.5, 5.5, Math.sin(a) * 5.5);
      spoke.rotation.y = -a;
      ringSpokes.push(spoke);
    }

    // Truss + solar arrays
    const truss = new T.Mesh(new T.BoxGeometry(42, 0.55, 0.55), white);
    truss.position.set(0, 8.5, 0);
    const arrays = [];
    for (let side = -1; side <= 1; side += 2) {
      for (let k = 0; k < 3; k++) {
        const panel = new T.Mesh(new T.BoxGeometry(7.5, 0.08, 3.6), solarMat);
        panel.position.set(side * (12 + k * 4.2), 8.5, 0);
        panel.rotation.z = side * 0.08;
        arrays.push(panel);
      }
    }

    // Docking ports (fore/aft)
    function dockPort(z, yaw) {
      const d = new T.Group();
      const tube = new T.Mesh(new T.CylinderGeometry(2.2, 2.4, 4.5, 20, 1, true), hull);
      tube.rotation.x = Math.PI / 2;
      const collar = new T.Mesh(new T.TorusGeometry(2.5, 0.28, 10, 24), accent);
      collar.position.z = 2.3;
      const light = window.VesperNoLight(0x80ffc0, 0.55, 28, 2);
      light.position.z = 3;
      d.add(tube, collar, light);
      d.position.set(0, 4.5, z);
      d.rotation.y = yaw;
      return d;
    }
    const dockA = dockPort(14, 0);
    const dockB = dockPort(-14, Math.PI);

    // Radiators
    const rads = [];
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.4;
      const rad = new T.Mesh(new T.BoxGeometry(0.12, 5.5, 2.2), matPaint(T, 0xc8d0d8, 0x405060, 0.15));
      rad.position.set(Math.cos(a) * 9.2, 7, Math.sin(a) * 9.2);
      rad.rotation.y = -a;
      rads.push(rad);
    }

    // Comm mast + dish
    const mast = new T.Mesh(new T.CylinderGeometry(0.22, 0.28, 16, 10), white);
    mast.position.set(-6.5, 14, -4);
    const dish = new T.Mesh(
      new T.SphereGeometry(3.4, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.55),
      matMetal(T, 0xc0c8d0, 0x203040, 0.2)
    );
    dish.position.set(-6.5, 20, -4);
    dish.rotation.x = 0.5;

    // Beacon
    const beacon = new T.Mesh(new T.SphereGeometry(0.85, 16, 12), warm);
    beacon.position.set(0, 18.5, 0);
    const beaconLight = window.VesperNoLight(0xffa060, 1.8, 90, 2);
    beaconLight.position.copy(beacon.position);
    g.userData.beaconMesh = beacon;
    g.userData.beaconLight = beaconLight;

    // Sign
    const sign = new T.Mesh(new T.BoxGeometry(6.5, 1.1, 0.2), accent);
    sign.position.set(0, 10.5, 8.2);

    // --- Interior observation bay (Skytape) ---
    const bay = new T.Group();
    bay.position.set(0, 0.2, 0);
    const floor = new T.Mesh(
      new T.CylinderGeometry(6.4, 6.4, 0.35, 32),
      matMetal(T, 0x3a4250, 0x101820, 0.1)
    );
    floor.position.y = 0.4;
    const innerWall = new T.Mesh(
      new T.CylinderGeometry(6.3, 6.3, 9.5, 32, 1, true),
      matPaint(T, 0x2a3340, 0x152030, 0.12)
    );
    innerWall.position.y = 5.1;
    const ceil = new T.Mesh(
      new T.CircleGeometry(6.2, 32),
      matPaint(T, 0x1a222c, 0x0a1018, 0.08)
    );
    ceil.rotation.x = Math.PI / 2;
    ceil.position.y = 9.6;

    const crateMat = matMetal(T, 0x5a6474);
    const crateMatB = matMetal(T, 0x4a5464);
    [
      [1.1, 0.7, 0.9, 0.6, crateMat],
      [0.9, 0.5, 1.1, 2.2, crateMatB],
      [1.2, 0.55, 0.8, 4.1, crateMatB],
      [0.7, 0.7, 1.3, 5.0, crateMat],
    ].forEach((d) => {
      const crate = new T.Mesh(new T.BoxGeometry(d[0], d[1], d[2]), d[4]);
      const a = d[3];
      crate.position.set(Math.cos(a) * 3.6, 0.55 + d[1] * 0.5, Math.sin(a) * 3.6 - 0.4);
      crate.rotation.y = a + 0.2;
      bay.add(crate);
    });
    const pipeMat = matMetal(T, 0x708090, 0x152028, 0.12);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.4;
      const pipe = new T.Mesh(new T.CylinderGeometry(0.08, 0.08, 8.2, 8), pipeMat);
      pipe.position.set(Math.cos(a) * 5.9, 4.5, Math.sin(a) * 5.9);
      bay.add(pipe);
    }
    const desk = new T.Mesh(new T.BoxGeometry(3.2, 0.95, 1.3), matMetal(T, 0x6a7388));
    desk.position.set(-2.2, 1.1, 1.5);
    const screen = new T.Mesh(
      new T.BoxGeometry(2.4, 1.1, 0.08),
      matPaint(T, 0x102018, 0x40ffaa, 0.5)
    );
    screen.position.set(-2.2, 2.2, 2.05);
    const bench = new T.Mesh(new T.BoxGeometry(3.5, 0.45, 1.1), matPaint(T, 0x3a4558, 0x101820, 0.08));
    bench.position.set(2.4, 0.85, -1.2);

    skytapeMesh = buildSkytape(T);
    skytapeMesh.position.set(1.6, 1.55, 2.4);
    skytapeMesh.rotation.y = -0.55;

    bayLight = window.VesperNoLight(0xffd0a0, 1.45, 36, 2);
    bayLight.position.set(0, 7, 0);
    const fill = window.VesperNoLight(0x80c8ff, 0.45, 26, 2);
    fill.position.set(-3, 5.5, -2);
    const fillWarm = window.VesperNoLight(0xffb080, 0.6, 24, 2);
    fillWarm.position.set(3, 5, 2);

    const hatch = new T.Mesh(new T.TorusGeometry(2.5, 0.24, 10, 28), accent);
    hatch.position.set(0, 2.4, 8.5);
    const airlock = new T.Mesh(
      new T.CylinderGeometry(2.6, 2.8, 2.0, 24, 1, true),
      matMetal(T, 0x7a8494, 0x152030, 0.2)
    );
    airlock.rotation.x = Math.PI / 2;
    airlock.position.set(0, 2.4, 9.4);
    const porch = new T.Mesh(new T.BoxGeometry(6.2, 0.2, 3.6), matMetal(T, 0x5a6474, 0x101820, 0.1));
    porch.position.set(0, 0.55, 11.0);

    bay.add(floor, innerWall, ceil, desk, screen, bench, skytapeMesh, bayLight, fill, fillWarm);
    g.add(
      rock,
      cylinder,
      dome,
      cupola,
      ring,
      truss,
      mast,
      dish,
      beacon,
      beaconLight,
      sign,
      hatch,
      airlock,
      porch,
      bay,
      dockA,
      dockB
    );
    ringSpokes.forEach((s) => g.add(s));
    arrays.forEach((a) => g.add(a));
    rads.forEach((r) => g.add(r));

    const rim = window.VesperNoLight(0xffc090, 0.85, 80, 2);
    rim.position.set(0, 14, 16);
    const rim2 = window.VesperNoLight(0x80b0ff, 0.5, 70, 2);
    rim2.position.set(-12, 10, -8);
    g.add(rim, rim2);

    g.userData.bay = bay;
    g.userData.beacon = beacon;
    g.userData.modules = { ring: true, arrays: true, docks: true, cupola: true };
    return g;
  }

  function pickAnchor() {
    const s = sky();
    if (!s || !s.bodies) return null;
    const belts = s.bodies().filter((b) => b.isAsteroid && b.landable && /^Belt-\d+/i.test(b.name));
    if (!belts.length) {
      const any = s.bodies().find((b) => b.isAsteroid && b.landable);
      return any || null;
    }
    // Prefer Belt-7 for rumor continuity; offset so station is obvious beside rock
    return belts.find((b) => b.name === "Belt-7") || belts[Math.min(6, belts.length - 1)];
  }

  function placeStation() {
    const T = THREE();
    const s = sky();
    if (!T || !s) return false;
    const system = (s.system && s.system()) || null;
    const scene = s.scene && s.scene();
    if (!system && !scene) return false;

    const host = pickAnchor();
    // Stable-ish offset from host, or fixed belt AU if missing
    let x = 900, y = 12, z = -400;
    let hostR = 10;
    if (host && host.pos) {
      x = host.pos[0] + host.radius * 2.8;
      y = host.pos[1] + host.radius * 0.6;
      z = host.pos[2] + host.radius * 1.4;
      hostR = host.radius;
    }

    stationGroup = buildStation(T);
    stationGroup.position.set(x, y, z);
    // Face roughly sunward (yaw only — keep bay upright)
    stationGroup.rotation.set(0, Math.atan2(x, z) + Math.PI, 0);

    const parent = system || scene;
    parent.add(stationGroup);
    root = stationGroup;
    stationPos = [x, y, z];
    stationRadius = 28;

    // Landable proxy for soft-land / walk (larger than rock)
    const proxy = new T.Mesh(
      new T.SphereGeometry(stationRadius, 14, 12),
      new T.MeshBasicMaterial({ visible: false })
    );
    const proxyGroup = new T.Group();
    proxyGroup.name = STATION_NAME;
    proxyGroup.position.copy(stationGroup.position);
    proxyGroup.add(proxy);
    parent.add(proxyGroup);

    if (s.registerBody) {
      s.registerBody({
        name: STATION_NAME,
        group: proxyGroup,
        mesh: proxy,
        def: { radius: stationRadius, orbit: 0, speed: 0, y: y },
        angle: 0,
        radius: stationRadius,
        isAsteroid: true,
        landable: true,
        fixed: true,
        observation: true,
        straightHide: true,
      });
    }

    setTimeout(function () {
      if (window.VesperSky && !window.VesperSky.getStraightMan()) {
        toast("Tip · Observation Station ★ — modular habitat on a belt rock · Travel / Belt Tour · Skytape inside", 7000);
      }
    }, 4200);
    window.__vesperRadio = {
      body: STATION_NAME,
      equipped: () => equipped,
      hint: "Observation Station ★ — Travel menu · Belt Tour · lit beacon on a main-belt rock. Soft-land, walk in, E/tap Skytape.",
    };

    // Blurb patch
    if (s && !s._radioBlurbPatched) {
      const orig = s.getBlurb && s.getBlurb.bind(s);
      s.getBlurb = (name) => {
        if (name === STATION_NAME) {
          return equipped
            ? "Observation Station — Skytape equipped. Tap Radio in the HUD to flip sky stations."
            : "Observation Station — modular belt habitat (ring · arrays · docks · cupola). Soft-land, walk in, equip the Skytape.";
        }
        return orig ? orig(name) : "";
      };
      s._radioBlurbPatched = true;
    }
    return true;
  }

  /* ---------- HUD (only after equip) ---------- */
  function ensureHud() {
    if (radioBtn) return;
    const actions = document.querySelector(".row.actions");
    if (!actions) return;
    radioBtn = document.createElement("button");
    radioBtn.type = "button";
    radioBtn.className = "btn";
    radioBtn.id = "btn-radio";
    radioBtn.title = "Sky radio — stations (found Skytape)";
    radioBtn.textContent = "Radio";
    radioBtn.setAttribute("aria-pressed", "false");
    // Insert before Help if present
    const help = document.getElementById("btn-help");
    if (help) actions.insertBefore(radioBtn, help);
    else actions.appendChild(radioBtn);

    radioPanel = document.createElement("div");
    radioPanel.id = "radio-panel";
    radioPanel.setAttribute("role", "dialog");
    radioPanel.setAttribute("aria-label", "Sky radio");
    radioPanel.innerHTML = [
      '<div class="radio-panel-head"><strong>Sky radio</strong><button type="button" class="btn" id="radio-panel-close">✕</button></div>',
      '<p class="radio-call" id="radio-call"></p>',
      '<div class="radio-row">',
      '  <button type="button" class="btn" id="radio-prev">◀</button>',
      '  <button type="button" class="btn primary" id="radio-mute">Mute</button>',
      '  <button type="button" class="btn" id="radio-next">▶</button>',
      "</div>",
      '<label class="radio-vol-label">Level <input type="range" id="radio-vol" min="0" max="100" value="38" /></label>',
      '<p class="radio-note">Instrumental · procedural · on-device. Soft hiss · Skytape at Observation Station.</p>',
    ].join("");
    document.body.appendChild(radioPanel);

    radioBtn.addEventListener("click", () => {
      const open = !radioPanel.classList.contains("open");
      radioPanel.classList.toggle("open", open);
      radioBtn.classList.toggle("active", open);
      radioBtn.setAttribute("aria-pressed", open ? "true" : "false");
      if (open) {
        ensureAudio();
        syncRadioUi();
        if (audioCtx && audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
      }
    });
    radioPanel.querySelector("#radio-panel-close").addEventListener("click", () => {
      radioPanel.classList.remove("open");
      radioBtn.classList.remove("active");
    });
    radioPanel.querySelector("#radio-prev").addEventListener("click", () => {
      trackIdx = (trackIdx + TRACKS.length - 1) % TRACKS.length;
      saveTrack();
      rebuildMusic();
      syncRadioUi();
      toast("📻 " + TRACKS[trackIdx].call, 2200);
    });
    radioPanel.querySelector("#radio-next").addEventListener("click", () => {
      trackIdx = (trackIdx + 1) % TRACKS.length;
      saveTrack();
      rebuildMusic();
      syncRadioUi();
      toast("📻 " + TRACKS[trackIdx].call, 2200);
    });
    radioPanel.querySelector("#radio-mute").addEventListener("click", () => {
      muted = !muted;
      saveMute();
      applyMute();
      syncRadioUi();
    });
    const volEl = radioPanel.querySelector("#radio-vol");
    if (volEl) {
      try {
        const sv = localStorage.getItem("vesper.skytapeVolume");
        if (sv != null) volEl.value = sv;
      } catch (_) {}
      window.__vesperRadioVol = parseInt(volEl.value, 10) / 100;
      volEl.addEventListener("input", () => {
        window.__vesperRadioVol = parseInt(volEl.value, 10) / 100;
        try { localStorage.setItem("vesper.skytapeVolume", volEl.value); } catch (_) {}
        applyMute();
      });
    }
  }

  function syncRadioUi() {
    if (!radioPanel) return;
    const call = radioPanel.querySelector("#radio-call");
    if (call) call.textContent = TRACKS[trackIdx].call + (muted ? " · muted" : "");
    const m = radioPanel.querySelector("#radio-mute");
    if (m) {
      m.textContent = muted ? "Unmute" : "Mute";
      m.classList.toggle("active", muted);
    }
  }

  function showRadioHud(flash) {
    ensureHud();
    if (!radioBtn) return;
    radioBtn.hidden = false;
    radioBtn.style.display = "";
    document.body.dataset.radio = "1";
    if (flash) {
      radioBtn.classList.add("radio-unlock-flash");
      setTimeout(() => radioBtn.classList.remove("radio-unlock-flash"), 1800);
    }
  }

  function hideRadioHud() {
    if (radioBtn) {
      radioBtn.hidden = true;
      radioBtn.style.display = "none";
    }
    if (radioPanel) radioPanel.classList.remove("open");
    document.body.dataset.radio = "0";
  }

  function ensurePrompt() {
    if (interactPrompt) return;
    interactPrompt = document.createElement("div");
    interactPrompt.id = "interact-prompt";
    interactPrompt.setAttribute("aria-live", "polite");
    document.body.appendChild(interactPrompt);
  }
  function setPrompt(text) {
    ensurePrompt();
    if (!text) {
      interactPrompt.classList.remove("show");
      interactPrompt.textContent = "";
      return;
    }
    interactPrompt.textContent = text;
    interactPrompt.classList.add("show");
  }

  /* ---------- Audio ---------- */
  function ensureAudio() {
    if (reduced) return null;
    if (audioCtx) return audioCtx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
    master = audioCtx.createGain();
    master.gain.value = 0;
    const comp = audioCtx.createDynamicsCompressor();
    comp.threshold.value = -24;
    comp.knee.value = 18;
    comp.ratio.value = 3.2;
    comp.attack.value = 0.02;
    comp.release.value = 0.22;
    master.connect(comp);
    comp.connect(audioCtx.destination);
    audioCtx.__vesperComp = comp;
    staticGain = audioCtx.createGain();
    staticGain.gain.value = 0;
    staticGain.connect(master);
    musicGain = audioCtx.createGain();
    musicGain.gain.value = 0;
    musicGain.connect(master);
    startNoise();
    startTrack(TRACKS[trackIdx]);
    applyMute();
    return audioCtx;
  }
  function startNoise() {
    if (!audioCtx || !staticGain) return;
    const bufLen = audioCtx.sampleRate * 2;
    const buf = audioCtx.createBuffer(1, bufLen, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    // Soft pink-ish hiss (not harsh white static)
    let pink = 0;
    for (let i = 0; i < bufLen; i++) {
      const white = Math.random() * 2 - 1;
      pink = pink * 0.93 + white * 0.07;
      data[i] = pink * 0.12;
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buf;
    noise.loop = true;
    const nFilter = audioCtx.createBiquadFilter();
    nFilter.type = "bandpass";
    nFilter.frequency.value = 900;
    nFilter.Q.value = 0.4;
    noise.connect(nFilter);
    nFilter.connect(staticGain);
    noise.start();
    nodes.push(noise);
  }
  function startTrack(track) {
    if (!audioCtx || !musicGain) return;
    const local = audioCtx.createGain();
    local.gain.value = 0.55;
    local.connect(musicGain);
    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = track.filter;
    filter.Q.value = 0.7;
    filter.connect(local);
    const now = audioCtx.currentTime;
    const beat = 60 / track.bpm;
    track.intervals.forEach((semi, i) => {
      const osc = audioCtx.createOscillator();
      osc.type = track.wave === "square" ? "square" : track.wave;
      osc.frequency.value = track.root * Math.pow(2, semi / 12);
      const g = audioCtx.createGain();
      g.gain.value = track.arpeggio ? 0.0001 : 0.07 / (1 + i * 0.35);
      osc.connect(g);
      g.connect(filter);
      osc.start(now);
      // Click-safe envelopes: floor gain, soft attack, linear release (no exp→0 clicks)
      const floor = 0.0008;
      g.gain.setValueAtTime(floor, now);
      if (track.arpeggio) {
        for (let s = 0; s < 64; s++) {
          const t0 = now + s * beat * 0.5 + i * beat * 0.12;
          const peak = 0.072 / (1 + i * 0.22);
          g.gain.setValueAtTime(floor, t0);
          g.gain.linearRampToValueAtTime(peak, t0 + 0.045);
          g.gain.linearRampToValueAtTime(floor, t0 + beat * 0.4);
        }
      } else {
        for (let s = 0; s < 16; s++) {
          const t0 = now + s * beat * 4;
          const peak = 0.07 / (1 + i * 0.3);
          g.gain.linearRampToValueAtTime(peak, t0 + beat * 1.8);
          g.gain.linearRampToValueAtTime(0.022 / (1 + i * 0.3), t0 + beat * 3.6);
        }
      }
      osc.detune.setValueAtTime((i - 2) * 4, now);
      nodes.push(osc);
    });
    const sub = audioCtx.createOscillator();
    sub.type = "sine";
    sub.frequency.value = track.root / 2;
    const sg = audioCtx.createGain();
    sg.gain.value = 0.055;
    sub.connect(sg);
    sg.connect(filter);
    sub.start(now);
    nodes.push(sub, local);
  }
  function rebuildMusic() {
    if (!audioCtx || !master) return;
    const t = audioCtx.currentTime;
    // Soft duck before teardown — prevents station-change clicks
    try {
      if (musicGain) musicGain.gain.cancelScheduledValues(t);
      if (musicGain) musicGain.gain.linearRampToValueAtTime(0, t + 0.06);
      if (staticGain) staticGain.gain.cancelScheduledValues(t);
      if (staticGain) staticGain.gain.linearRampToValueAtTime(0, t + 0.06);
    } catch (_) {}
    const oldNodes = nodes.slice();
    const oldMusic = musicGain;
    const oldStatic = staticGain;
    nodes = [];
    setTimeout(function () {
      oldNodes.forEach((n) => {
        try { if (n.stop) n.stop(); if (n.disconnect) n.disconnect(); } catch (_) {}
      });
      try { if (oldMusic) oldMusic.disconnect(); } catch (_) {}
      try { if (oldStatic) oldStatic.disconnect(); } catch (_) {}
    }, 80);
    musicGain = audioCtx.createGain();
    musicGain.gain.value = 0;
    musicGain.connect(master);
    staticGain = audioCtx.createGain();
    staticGain.gain.value = 0;
    staticGain.connect(master);
    startNoise();
    startTrack(TRACKS[trackIdx]);
    applyMute();
  }
  function applyMute() {
    if (!master || !audioCtx) return;
    const t = audioCtx.currentTime;
    try { master.gain.cancelScheduledValues(t); } catch (_) {}
    if (muted || !equipped) master.gain.linearRampToValueAtTime(0, t + 0.12);
    else master.gain.linearRampToValueAtTime((window.__vesperRadioVol != null ? window.__vesperRadioVol : 0.38), t + 0.18);
  }
  function setGains(music, hiss, vol) {
    if (!audioCtx) return;
    const t = audioCtx.currentTime;
    if (musicGain) musicGain.gain.linearRampToValueAtTime(Math.max(0, music), t + 0.08);
    if (staticGain) staticGain.gain.linearRampToValueAtTime(Math.max(0, hiss), t + 0.08);
    if (master) {
      const v = muted || !equipped ? 0 : Math.max(0, vol);
      master.gain.linearRampToValueAtTime(v, t + 0.08);
    }
  }

  function equipSkytape() {
    if (equipped) {
      toast("Skytape already equipped — Radio is in the HUD", 2800);
      showRadioHud(false);
      return;
    }
    equipped = true;
    saveEquipped();
    ensureAudio();
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
    showRadioHud(true);
    syncRadioUi();
    lastEquipFlash = performance.now();
    toast("Skytape equipped · Radio unlocked in HUD — flip sky stations anytime", 5600);
    if (skytapeMesh) {
      // Visual: prop dims / “taken” — leave ghost outline
      skytapeMesh.traverse((o) => {
        if (o.isMesh && o.material && o.material.opacity == null) {
          o.material = o.material.clone();
          o.material.transparent = true;
          o.material.opacity = 0.35;
        }
      });
      if (skytapeMesh.userData.glow) skytapeMesh.userData.glow.intensity = 0.15;
    }
    window.dispatchEvent(new CustomEvent("vesper:radio", { detail: { equipped: true } }));
  }

  function tryInteract() {
    if (!nearSkytape) return false;
    equipSkytape();
    return true;
  }

  function onKey(e) {
    if (e.repeat) return;
    const el = e.target;
    const tag = el && el.tagName ? el.tagName.toLowerCase() : "";
    if (tag === "input" || tag === "textarea" || tag === "select" || (el && el.isContentEditable)) return;
    if (window.VesperInput.triggered("talk", e) || window.VesperInput.triggered("equip", e)) {
      if (tryInteract()) {
        e.preventDefault();
      }
    }
  }

  function setupPointer() {
    const T = THREE();
    const s = sky();
    if (!T || !s) return;
    raycaster = new T.Raycaster();
    pointer = new T.Vector2();
    const canvas = document.querySelector("#canvas-wrap canvas");
    if (!canvas) return;
    // Look-drag starts with pointerdown on the canvas. Equipping on that
    // press took the Skytape whenever you turned your head beside it.
    let radioTap = null;
    canvas.addEventListener("pointerdown", (ev) => {
      if (s.getBuildMode && s.getBuildMode()) return;
      if (ev.button !== 0 && ev.pointerType === "mouse") return;
      // A second finger is pinch-zoom, not a pickup.
      if (radioTap) { radioTap = null; return; }
      if (!nearSkytape || equipped) return;
      radioTap = { id: ev.pointerId, x: ev.clientX, y: ev.clientY };
    });
    const endTap = (ev) => {
      if (!radioTap || ev.pointerId !== radioTap.id) return;
      const dx = ev.clientX - radioTap.x;
      const dy = ev.clientY - radioTap.y;
      radioTap = null;
      if (dx * dx + dy * dy > 64) return;
      if (nearSkytape && !equipped) equipSkytape();
    };
    window.addEventListener("pointerup", endTap);
    window.addEventListener("pointercancel", (ev) => {
      if (radioTap && ev.pointerId === radioTap.id) radioTap = null;
    });
  }

  function distToStation(pos) {
    if (!stationPos) return Infinity;
    const dx = pos[0] - stationPos[0];
    const dy = pos[1] - stationPos[1];
    const dz = pos[2] - stationPos[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function tick() {
    raf = requestAnimationFrame(tick);
    try {
    const s = sky();
    if (!s || !stationGroup) return;

    const hide = straight();
    stationGroup.visible = !hide;
    const sel = document.getElementById("travel-select");
    if (sel && sel.__vesperStationHide !== hide) {
      sel.__vesperStationHide = hide;
      [...sel.options].forEach((o) => {
        if (o.value === STATION_NAME) o.hidden = hide;
      });
    }
    if (hide) {
      setPrompt("");
      setGains(0, 0, 0);
      return;
    }

    if (doorLight && doorLight.material) {
      const pulse = 0.4 + 0.55 * Math.sin(performance.now() * 0.0035);
      doorLight.material.emissiveIntensity = pulse;
    }
    if (skytapeMesh && skytapeMesh.userData.reels && !equipped) {
      const reels = skytapeMesh.userData.reels;
      reels[0].rotation.z += 0.02;
      reels[1].rotation.z -= 0.02;
    }

    const pos = s.getPos && s.getPos();
    if (!pos) return;
    const dist = distToStation(pos);
    const walking = s.isWalking && s.isWalking();
    const walkBody = s.getWalkBody && s.getWalkBody();
    const onStation = walking && walkBody === STATION_NAME;
    insideBay = onStation || dist < stationRadius * 0.85;

    // Skytape proximity (world)
    let wdist = Infinity;
    if (skytapeMesh) {
      const T = THREE();
      if (!tick._wp && T) tick._wp = new T.Vector3();
      if (tick._wp) {
        skytapeMesh.getWorldPosition(tick._wp);
        const dx = pos[0] - tick._wp.x, dy = pos[1] - tick._wp.y, dz = pos[2] - tick._wp.z;
        wdist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      }
    }
    // On-station walk: always offer equip (prop is in the bay)
    nearSkytape = !equipped && (onStation || (insideBay && wdist < INTERACT_RANGE * 1.8));
    // Beacon pulse for findability
    if (stationGroup && stationGroup.userData && stationGroup.userData.beaconMesh) {
      const bm = stationGroup.userData.beaconMesh;
      const bl = stationGroup.userData.beaconLight;
      const pulse = 0.75 + Math.sin(performance.now() * 0.0035) * 0.25;
      bm.scale.setScalar(1.2 + pulse * 0.55);
      if (bl) bl.intensity = 2.2 + pulse * 1.4;
    }

    if (nearSkytape) {
      setPrompt("E / tap · Equip Skytape — unlock Sky Radio");
    } else if (!equipped && dist < ENTER_HINT_RANGE) {
      setPrompt(onStation
        ? "Walk to the glowing Skytape on the bench"
        : "Observation Station · soft-land to enter");
    } else if (equipped && radioPanel && radioPanel.classList.contains("open")) {
      setPrompt("");
    } else {
      setPrompt("");
    }

    // Ambient station hum only when unequipped & near; full radio when equipped
    if (equipped && !muted) {
      ensureAudio();
      if (audioCtx && audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
      setGains(0.78, 0.012, 0.38);
    } else if (!equipped && dist < TUNE_NEAR && !reduced) {
      // Faint invitation static near station (not full music until equip)
      ensureAudio();
      const str = Math.max(0, 1 - dist / TUNE_NEAR);
      setGains(0.015 * str, 0.05 * str, 0.1 * str);
    } else {
      setGains(0, 0, 0);
    }
    } catch (err) {
      if (!tick._errLog) {
        tick._errLog = 1;
        try { console.warn("[vesper-radio]", err && err.message ? err.message : err); } catch (_) {}
      }
    }
  }

  let initialized = false;
  function init() {
    if (initialized) return;
    reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    loadFlags();
    if (!placeStation()) {
      setTimeout(init, 400);
      return;
    }
    initialized = true;
    if (equipped) {
      showRadioHud(false);
      syncRadioUi();
      if (skytapeMesh) {
        skytapeMesh.traverse((o) => {
          if (o.isMesh && o.material) {
            o.material = o.material.clone();
            o.material.transparent = true;
            o.material.opacity = 0.35;
          }
        });
      }
    } else {
      hideRadioHud();
      ensureHud();
      hideRadioHud();
    }

    window.addEventListener("keydown", onKey);
    setupPointer();
    ensurePrompt();

    window.addEventListener("vesper:lookat", (ev) => {
      if (!ev.detail || ev.detail.name !== STATION_NAME) return;
      if (!unlockedToastOnce && !equipped) {
        unlockedToastOnce = true;
        toast("Observation Station ★ — Travel menu or Belt Tour · follow the warm beacon · soft-land · Skytape", 6400);
      }
    });

    const unlock = () => {
      if (equipped) {
        ensureAudio();
        if (audioCtx && audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
      }
    };
    window.addEventListener("pointerdown", unlock, { passive: true });
    window.addEventListener("keydown", unlock);

    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(tick);
  }

  window.addEventListener("vesper:ready", () => setTimeout(init, 140));
  if (sky() && sky().getPos) setTimeout(init, 220);

  window.VesperRadio = {
    isEquipped: () => equipped,
    equip: equipSkytape,
    station: () => STATION_NAME,
    tracks: () => TRACKS.map((t) => t.call),
  };

  document.addEventListener("visibilitychange", () => {
    if (!audioCtx) return;
    if (document.hidden) { try { audioCtx.suspend(); } catch (_) {} }
    else if (equipped && !muted) { try { audioCtx.resume(); } catch (_) {} }
  });
})();
