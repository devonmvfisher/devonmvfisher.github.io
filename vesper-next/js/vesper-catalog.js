/**
 * Vesper expanded catalog — natural (moons/TNOs/comets) + man-made (stations/probes).
 * Sol-honest labels; hypothetics stay in vesper-hypothetics.js.
 * Soft-land / walk on all except Sun (skim-only).
 */
(function () {
  "use strict";

  const LS = "vesper.catalogExtra";
  let placed = false;
  let group = null;
  const made = [];

  function sky() {
    return window.VesperSky;
  }
  function T() {
    return window.THREE;
  }
  function AU() {
    const s = sky();
    const sc = s && s.getScale && s.getScale();
    return (sc && sc.auUnit) || 16000;
  }
  function ER() {
    const s = sky();
    const sc = s && s.getScale && s.getScale();
    return (sc && sc.earthR) || 520;
  }

  /** Extra natural bodies (display AU; walkable). */
  const NATURAL = [
    { name: "Sedna", kind: "tno", r: 0.1, au: 76, y: 2.2, color: 0xc06040, blurb: "Sedna — extreme TNO; very distant, reddish." },
    { name: "Gonggong", kind: "tno", r: 0.1, au: 67.5, y: -1.8, color: 0xb05040, blurb: "Gonggong — distant dwarf-candidate; red." },
    { name: "Orcus", kind: "tno", r: 0.09, au: 39.2, y: 0.9, color: 0xa8a0b0, blurb: "Orcus — plutino; companion Vanth not modeled." },
    { name: "Varuna", kind: "tno", r: 0.08, au: 43.0, y: -0.7, color: 0xc8a888, blurb: "Varuna — elongated classical Kuiper object." },
    { name: "Ixion", kind: "tno", r: 0.07, au: 39.6, y: 1.1, color: 0xa07050, blurb: "Ixion — plutino; dark red." },
    { name: "Salacia", kind: "tno", r: 0.08, au: 42.2, y: -0.4, color: 0x9098a8, blurb: "Salacia — large Kuiper object." },
    { name: "Psyche", kind: "asteroid", r: 0.12, au: 2.92, y: 0.25, color: 0x8a9098, blurb: "Psyche — M-type asteroid; metal-rich." },
    { name: "Eros", kind: "asteroid", r: 0.1, au: 1.46, y: 0.15, color: 0xb09070, blurb: "Eros — NEA; NEAR Shoemaker landed here." },
    { name: "Ida", kind: "asteroid", r: 0.09, au: 2.86, y: -0.2, color: 0xa09080, blurb: "Ida — belt asteroid with moon Dactyl." },
    { name: "Dactyl", kind: "moon", r: 0.035, au: 2.862, y: -0.18, color: 0x8a8070, blurb: "Dactyl — Ida's moon (first discovered asteroid moon)." },
    { name: "Halley", kind: "comet", r: 0.07, au: 17.8, y: 3.5, color: 0xc8d0e0, blurb: "1P/Halley — periodic comet (display orbit)." },
    { name: "Encke", kind: "comet", r: 0.06, au: 2.2, y: 0.4, color: 0xd0d8e0, blurb: "2P/Encke — short-period comet (display orbit)." },
  ];

  /** Man-made — labeled craft/stations (display placement, walkable hull proxies). */
  const MANMADE = [
    { name: "ISS", kind: "station", r: 0.045, au: 1.002, y: 0.35, color: 0xd0d8e0, manmade: true, blurb: "ISS — International Space Station (display near Earth)." },
    { name: "Tiangong", kind: "station", r: 0.04, au: 1.003, y: -0.25, color: 0xc8d0d8, manmade: true, blurb: "Tiangong — Chinese space station (display near Earth)." },
    { name: "Hubble", kind: "observatory", r: 0.035, au: 1.004, y: 0.55, color: 0xa0b0c8, manmade: true, blurb: "Hubble Space Telescope — LEO observatory (display)." },
    { name: "JWST", kind: "observatory", r: 0.04, au: 1.01, y: 0.2, color: 0xe8e0c8, manmade: true, blurb: "JWST — James Webb at Sun–Earth L2 (display, outside the Moon)." },
    { name: "Luna Gateway", kind: "station", r: 0.042, au: 1.02, y: 0.1, color: 0xb8c0d0, manmade: true, blurb: "Lunar Gateway — planned lunar-orbit station (display concept)." },
    { name: "Voyager 1", kind: "probe", r: 0.03, au: 162, y: 4, color: 0x80a0c0, manmade: true, blurb: "Voyager 1 — farthest human craft (display AU compressed)." },
    { name: "Voyager 2", kind: "probe", r: 0.03, au: 135, y: -3.5, color: 0x7090b0, manmade: true, blurb: "Voyager 2 — Grand Tour probe (display AU compressed)." },
    { name: "New Horizons", kind: "probe", r: 0.03, au: 58, y: 1.5, color: 0x90a8c0, manmade: true, blurb: "New Horizons — Pluto / Arrokoth flyby craft (display AU compressed; sunward of the Voyager dots)." },
    { name: "Parker Solar Probe", kind: "probe", r: 0.028, au: 0.25, y: 0.05, color: 0xe08040, manmade: true, blurb: "Parker Solar Probe — closest solar mission (display)." },
    { name: "Juno", kind: "probe", r: 0.03, au: 5.25, y: 0.4, color: 0xc0a080, manmade: true, blurb: "Juno — Jupiter orbiter (display)." },
    { name: "Cassini", kind: "probe", r: 0.03, au: 9.6, y: -0.3, color: 0xb0a090, manmade: true, blurb: "Cassini — Saturn orbiter (memorial display)." },
    { name: "Curiosity", kind: "rover", r: 0.028, au: 1.524, y: 0.02, color: 0xc87840, manmade: true, blurb: "Curiosity — Mars rover (surface proxy near Mars)." },
    { name: "Perseverance", kind: "rover", r: 0.03, au: 1.524, y: 0.04, color: 0xd08040, manmade: true, blurb: "Perseverance — Mars rover (surface proxy)." },
    { name: "Ingenuity", kind: "probe", r: 0.022, au: 1.525, y: 0.05, color: 0xc0c8d0, manmade: true, blurb: "Ingenuity — Mars helicopter (memorial display near Mars)." },
    { name: "Apollo 11 Site", kind: "rover", r: 0.035, au: 1.0025, y: 0.08, color: 0xd8d0c8, manmade: true, blurb: "Apollo 11 landing-site marker (educational display near Moon/Earth)." },
    { name: "Rosetta", kind: "probe", r: 0.028, au: 3.1, y: 0.06, color: 0xc0b090, manmade: true, blurb: "Rosetta — comet 67P orbiter (display near belt)." },
    { name: "OSIRIS-REx", kind: "probe", r: 0.028, au: 1.2, y: 0.05, color: 0xa0b0c8, manmade: true, blurb: "OSIRIS-REx — Bennu sample-return (display)." },
    { name: "Lucy", kind: "probe", r: 0.026, au: 5.2, y: 0.07, color: 0xd0c8a0, manmade: true, blurb: "Lucy — Jupiter Trojan survey (display)." },
    { name: "DAWN", kind: "probe", r: 0.027, au: 2.8, y: 0.05, color: 0xb0b8c0, manmade: true, blurb: "Dawn — ended at Ceres after Vesta (display sits at Ceres)." },
    {
      name: "Starman Roadster",
      kind: "starman",
      r: 0.055,
      au: 1.34,
      y: 0.18,
      color: 0xb01018,
      manmade: true,
      blurb:
        "Starman Roadster replica — educational model of the Falcon Heavy demo payload (2018) on a heliocentric path. Fan-built visualization; not affiliated with Tesla, SpaceX, or related marks.",
    },
  ];

  // Display AU compression for far probes (readability)
  const DISPLAY_AU = {
    "Voyager 1": 22,
    "Voyager 2": 20,
    // Catalog au is 58. The 24 AU cap put this dot outside Voyager 1,
    // whose line says it is the farthest craft. Sit sunward of Voyager 2.
    "New Horizons": 18.6,
    Sedna: 18,
    Gonggong: 16,
    "Starman Roadster": 1.34,
  };

  function mat(THREE, color, emissive) {
    // Unlit. A Standard shader on these spheres is the blank-ball failure
    // on an iPhone 11, and these bodies must not sample a PMREM.
    return new THREE.MeshBasicMaterial({
      color: color,
    });
  }

  function makeMesh(THREE, def, rad) {
    const g = new THREE.Group();
    g.name = def.name;
    let mesh;
    if (def.kind === "starman") {
      // Educational Roadster replica — cherry open-top, suit figure, dash Earth, fairing
      // Not affiliated with Tesla / SpaceX / related marks.
      const cherry = mat(THREE, 0x8b0000, 0x400008);
      const cherryDeep = mat(THREE, 0x6a0008, 0x300006);
      const body = new THREE.Mesh(new THREE.BoxGeometry(rad * 2.35, rad * 0.52, rad * 1.05), cherry);
      body.position.y = rad * 0.34;
      const hood = new THREE.Mesh(new THREE.BoxGeometry(rad * 0.95, rad * 0.22, rad * 1.0), mat(THREE, 0x9a1018, 0x400008));
      hood.position.set(rad * 0.78, rad * 0.44, 0);
      const nose = new THREE.Mesh(new THREE.BoxGeometry(rad * 0.58, rad * 0.26, rad * 0.92), mat(THREE, 0x9a0810, 0x400008));
      nose.position.set(rad * 1.18, rad * 0.36, 0);
      const rear = new THREE.Mesh(new THREE.BoxGeometry(rad * 0.52, rad * 0.2, rad * 0.98), cherryDeep);
      rear.position.set(-rad * 1.08, rad * 0.38, 0);
      // Open cockpit bay
      const bay = new THREE.Mesh(
        new THREE.BoxGeometry(rad * 1.1, rad * 0.35, rad * 0.9),
        window.VesperMat({ color: 0x1a1a20, roughness: 0.7, metalness: 0.4, emissive: 0x080810, emissiveIntensity: 0.2 })
      );
      bay.position.set(-rad * 0.1, rad * 0.55, 0);
      const windshield = new THREE.Mesh(
        new THREE.BoxGeometry(rad * 0.07, rad * 0.48, rad * 0.98),
        window.VesperMat({
          color: 0x60a8c8, transparent: true, opacity: 0.38, metalness: 0.55, roughness: 0.12,
          emissive: 0x184868, emissiveIntensity: 0.28,
        })
      );
      windshield.position.set(rad * 0.22, rad * 0.72, 0);
      windshield.rotation.z = -0.38;
      // Windshield glass tint strip (walk-distance readability cue)
      const windTint = new THREE.Mesh(
        new THREE.BoxGeometry(rad * 0.02, rad * 0.42, rad * 0.92),
        window.VesperMat({
          color: 0x40c8ff, transparent: true, opacity: 0.22, metalness: 0.7, roughness: 0.08,
          emissive: 0x2080c0, emissiveIntensity: 0.45, depthWrite: false,
        })
      );
      windTint.position.set(rad * 0.26, rad * 0.74, 0);
      windTint.rotation.z = -0.38;
      windTint.name = "starmanWindTint";
      // Seat + figure
      const seat = new THREE.Mesh(
        new THREE.BoxGeometry(rad * 0.45, rad * 0.35, rad * 0.5),
        mat(THREE, 0x202028, 0x101018)
      );
      seat.position.set(-rad * 0.2, rad * 0.55, 0);
      const torso = new THREE.Mesh(
        new THREE.CylinderGeometry(rad * 0.17, rad * 0.21, rad * 0.52, 10),
        mat(THREE, 0xf0f4f8, 0x808890)
      );
      torso.position.set(-rad * 0.18, rad * 0.88, 0);
      const helm = new THREE.Mesh(
        new THREE.SphereGeometry(rad * 0.19, 12, 10),
        window.VesperMat({
          color: 0xe8eef4, metalness: 0.45, roughness: 0.32, emissive: 0x304050, emissiveIntensity: 0.22,
        })
      );
      helm.position.set(-rad * 0.18, rad * 1.26, 0);
      // Visor gleam
      const visor = new THREE.Mesh(
        new THREE.SphereGeometry(rad * 0.12, 8, 6, 0, Math.PI, 0, Math.PI * 0.55),
        window.VesperMat({ color: 0x203040, metalness: 0.8, roughness: 0.15, emissive: 0x406080, emissiveIntensity: 0.4 })
      );
      visor.position.set(-rad * 0.05, rad * 1.26, 0);
      visor.rotation.y = Math.PI / 2;
      // Visor reflection gleam (educational suit cue — walk distance)
      const visorGleam = new THREE.Mesh(
        new THREE.SphereGeometry(rad * 0.045, 8, 6),
        window.VesperMat({
          color: 0xe0f0ff, metalness: 0.95, roughness: 0.08,
          emissive: 0xa0d0ff, emissiveIntensity: 0.85, transparent: true, opacity: 0.75,
        })
      );
      visorGleam.position.set(-rad * 0.01, rad * 1.3, rad * 0.04);
      visorGleam.name = "starmanVisorGleam";
      // Dashboard + tiny Earth (famous photo homage — procedural sphere)
      const dash = new THREE.Mesh(
        new THREE.BoxGeometry(rad * 0.55, rad * 0.12, rad * 0.85),
        mat(THREE, 0x2a2a30, 0x101018)
      );
      dash.position.set(rad * 0.05, rad * 0.62, 0);
      // Dash Earth continents (famous photo homage — educational procedural)
      const earthC = document.createElement("canvas");
      earthC.width = earthC.height = 128;
      const eg = earthC.getContext("2d");
      eg.fillStyle = "#1a5080";
      eg.fillRect(0, 0, 128, 128);
      eg.fillStyle = "#2a8a50";
      [[40, 50, 28, 18], [70, 70, 22, 14], [95, 40, 18, 22], [30, 90, 20, 12], [55, 30, 16, 10]].forEach((b) => {
        eg.beginPath();
        eg.ellipse(b[0], b[1], b[2], b[3], 0.3, 0, Math.PI * 2);
        eg.fill();
      });
      eg.fillStyle = "rgba(240,248,255,0.28)";
      for (let i = 0; i < 10; i++) {
        eg.beginPath();
        eg.arc((i * 37) % 128, (i * 53) % 128, 4 + (i % 5) * 2, 0, Math.PI * 2);
        eg.fill();
      }
      // Nightside city-light homage (educational dash Earth)
      eg.fillStyle = "#ffe8a0";
      for (let i = 0; i < 40; i++) {
        eg.globalAlpha = 0.25 + ((i * 17) % 50) / 100;
        eg.fillRect((i * 29) % 128, (i * 47) % 128, 1.5, 1.5);
      }
      eg.globalAlpha = 1;
      const earthTex = new THREE.CanvasTexture(earthC);
      earthTex.colorSpace = THREE.SRGBColorSpace;
      const earthDash = new THREE.Mesh(
        new THREE.SphereGeometry(rad * 0.12, 14, 12),
        window.VesperMat({
          map: earthTex, color: 0xffffff, emissive: 0x203850, emissiveMap: earthTex,
          emissiveIntensity: 0.55, roughness: 0.42, metalness: 0.15,
        })
      );
      earthDash.position.set(rad * 0.12, rad * 0.78, rad * 0.15);
      const earthCloud = new THREE.Mesh(
        new THREE.SphereGeometry(rad * 0.128, 12, 10),
        window.VesperMat({ color: 0xe8f0f8, transparent: true, opacity: 0.38, roughness: 1, depthWrite: false })
      );
      earthCloud.position.copy(earthDash.position);
      // Arms on wheel / board
      const board = new THREE.Mesh(
        new THREE.BoxGeometry(rad * 0.14, rad * 0.48, rad * 0.05),
        mat(THREE, 0xd8c090, 0x403020)
      );
      board.position.set(-rad * 0.35, rad * 0.95, rad * 0.22);
      board.rotation.z = 0.35;
      const wheelMat = window.VesperMat({
        color: 0x1a1a1e, roughness: 0.85, metalness: 0.25, emissive: 0x050508, emissiveIntensity: 0.15,
      });
      const rimMat = window.VesperMat({
        color: 0xc0c8d0, roughness: 0.35, metalness: 0.85, emissive: 0x304050, emissiveIntensity: 0.2,
      });
      const wheels = [];
      const wheelGroups = [];
      [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach((xz) => {
        const wg = new THREE.Group();
        const tire = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.22, rad * 0.22, rad * 0.14, 16), wheelMat);
        tire.rotation.z = Math.PI / 2;
        const rim = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.12, rad * 0.12, rad * 0.155, 12), rimMat);
        rim.rotation.z = Math.PI / 2;
        const hub = new THREE.Mesh(
          new THREE.SphereGeometry(rad * 0.05, 8, 6),
          window.VesperMat({ color: 0xe0e8f0, metalness: 0.9, roughness: 0.25, emissive: 0x6080a0, emissiveIntensity: 0.35 })
        );
        hub.position.x = xz[1] > 0 ? rad * 0.02 : -rad * 0.02;
        // Tire tread rings (educational chrome)
        const tread = new THREE.Mesh(
          new THREE.TorusGeometry(rad * 0.205, rad * 0.012, 6, 20),
          window.VesperMat({ color: 0x2a2a30, roughness: 0.9, metalness: 0.1 })
        );
        tread.rotation.y = Math.PI / 2;
        const tread2 = new THREE.Mesh(
          new THREE.TorusGeometry(rad * 0.175, rad * 0.008, 5, 16),
          window.VesperMat({ color: 0x3a3a42, roughness: 0.85, metalness: 0.15 })
        );
        tread2.rotation.y = Math.PI / 2;
        const spoke = new THREE.Mesh(
          new THREE.BoxGeometry(rad * 0.02, rad * 0.18, rad * 0.03),
          rimMat
        );
        spoke.rotation.z = Math.PI / 2;
        wg.add(tire, rim, hub, tread, tread2, spoke);
        wg.position.set(xz[0] * rad * 0.72, rad * 0.22, xz[1] * rad * 0.52);
        wheels.push(wg);
        wheelGroups.push(wg);
      });
      // Steering wheel + dash chrome strip
      const steer = new THREE.Mesh(
        new THREE.TorusGeometry(rad * 0.14, rad * 0.02, 6, 16),
        window.VesperMat({ color: 0x2a2a30, metalness: 0.5, roughness: 0.4 })
      );
      steer.position.set(rad * 0.02, rad * 0.78, 0);
      steer.rotation.x = Math.PI / 2.4;
      const chromeStrip = new THREE.Mesh(
        new THREE.BoxGeometry(rad * 2.2, rad * 0.03, rad * 0.04),
        window.VesperMat({ color: 0xd0d8e0, metalness: 0.9, roughness: 0.25, emissive: 0x405060, emissiveIntensity: 0.3 })
      );
      chromeStrip.position.set(0, rad * 0.48, rad * 0.54);
      // Suit backpack + HOPE pip (educational figure detail)
      const pack = new THREE.Mesh(
        new THREE.BoxGeometry(rad * 0.22, rad * 0.35, rad * 0.18),
        mat(THREE, 0xd8dce0, 0x606870)
      );
      pack.position.set(-rad * 0.35, rad * 0.9, 0);
      // Suit arms + legs silhouette (Starman figure — educational, not brand)
      const suitMat = mat(THREE, 0xf0f4f8, 0x808890);
      const armL = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.05, rad * 0.06, rad * 0.42, 8), suitMat);
      armL.position.set(-rad * 0.12, rad * 0.85, rad * 0.28);
      armL.rotation.z = 0.55;
      armL.rotation.x = -0.35;
      const armR = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.05, rad * 0.06, rad * 0.42, 8), suitMat);
      armR.position.set(-rad * 0.12, rad * 0.85, -rad * 0.28);
      armR.rotation.z = 0.55;
      armR.rotation.x = 0.35;
      const gloveL = new THREE.Mesh(
        new THREE.SphereGeometry(rad * 0.07, 8, 6),
        window.VesperMat({ color: 0xe8eef4, metalness: 0.3, roughness: 0.45, emissive: 0x304050, emissiveIntensity: 0.15 })
      );
      gloveL.position.set(-rad * 0.02, rad * 0.72, rad * 0.38);
      const legL = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.07, rad * 0.08, rad * 0.38, 8), suitMat);
      legL.position.set(-rad * 0.22, rad * 0.42, rad * 0.12);
      legL.rotation.z = 0.15;
      const legR = legL.clone();
      legR.position.z = -rad * 0.12;
      // Chassis chrome grille + side skirts
      const grille = new THREE.Mesh(
        new THREE.BoxGeometry(rad * 0.08, rad * 0.18, rad * 0.7),
        window.VesperMat({ color: 0xd0d8e0, metalness: 0.92, roughness: 0.22, emissive: 0x405060, emissiveIntensity: 0.35 })
      );
      grille.position.set(rad * 1.42, rad * 0.34, 0);
      const skirtL = new THREE.Mesh(
        new THREE.BoxGeometry(rad * 1.8, rad * 0.05, rad * 0.06),
        window.VesperMat({ color: 0xc0c8d0, metalness: 0.88, roughness: 0.28, emissive: 0x304050, emissiveIntensity: 0.25 })
      );
      skirtL.position.set(0, rad * 0.2, rad * 0.56);
      const skirtR = skirtL.clone();
      skirtR.position.z = -rad * 0.56;
      const hopePip = new THREE.Mesh(
        new THREE.SphereGeometry(rad * 0.04, 8, 6),
        window.VesperMat({ color: 0x80ffe0, emissive: 0x40ffc0, emissiveIntensity: 1.3, roughness: 0.25 })
      );
      hopePip.position.set(-rad * 0.18, rad * 1.05, rad * 0.2);
      // Door seam cues (open-top silhouette)
      const doorL = new THREE.Mesh(
        new THREE.BoxGeometry(rad * 0.9, rad * 0.02, rad * 0.02),
        window.VesperMat({ color: 0x400010, metalness: 0.4, roughness: 0.5 })
      );
      doorL.position.set(-rad * 0.1, rad * 0.5, rad * 0.53);
      const doorR = doorL.clone();
      doorR.position.z = -rad * 0.53;
      const sideMirror = (z) => {
        const m = new THREE.Group();
        const arm = new THREE.Mesh(new THREE.BoxGeometry(rad * 0.1, rad * 0.04, rad * 0.04), mat(THREE, 0x202028, 0x101018));
        const glass = new THREE.Mesh(
          new THREE.BoxGeometry(rad * 0.08, rad * 0.1, rad * 0.02),
          window.VesperMat({ color: 0xa0c0e0, metalness: 0.85, roughness: 0.15, emissive: 0x203040, emissiveIntensity: 0.25 })
        );
        glass.position.set(rad * 0.06, 0.02, z > 0 ? rad * 0.06 : -rad * 0.06);
        m.add(arm, glass);
        m.position.set(rad * 0.22, rad * 0.66, z);
        return m;
      };
      // Headlight pips + soft cones
      const hl = (z) => {
        const grp = new THREE.Group();
        const m = new THREE.Mesh(
          new THREE.SphereGeometry(rad * 0.06, 8, 6),
          window.VesperMat({ color: 0xfff0c0, emissive: 0xffe080, emissiveIntensity: 1.4, roughness: 0.3 })
        );
        const cone = new THREE.Mesh(
          new THREE.ConeGeometry(rad * 0.18, rad * 0.5, 8, 1, true),
          new THREE.MeshBasicMaterial({
            color: 0xffe8a0, transparent: true, opacity: 0.12, depthWrite: false,
            blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
          })
        );
        cone.rotation.z = -Math.PI / 2;
        cone.position.x = rad * 0.28;
        grp.add(m, cone);
        grp.position.set(rad * 1.4, rad * 0.32, z);
        return grp;
      };
      // Taillights (red glow — educational silhouette)
      const tl = (z) => {
        const m = new THREE.Mesh(
          new THREE.BoxGeometry(rad * 0.06, rad * 0.08, rad * 0.1),
          window.VesperMat({ color: 0xff2020, emissive: 0xff1010, emissiveIntensity: 1.1, roughness: 0.4 })
        );
        m.position.set(-rad * 1.32, rad * 0.36, z);
        return m;
      };
      // Cabin ambient pip (soft cockpit glow)
      const cabinGlow = window.VesperNoLight(0xffc080, 0.55, rad * 4, 2);
      cabinGlow.position.set(-rad * 0.1, rad * 0.85, 0);
      cabinGlow.name = "starmanCabin";
      // Underbody panel line
      const under = new THREE.Mesh(
        new THREE.BoxGeometry(rad * 2.1, rad * 0.04, rad * 0.85),
        window.VesperMat({ color: 0x101018, metalness: 0.6, roughness: 0.5, emissive: 0x080810, emissiveIntensity: 0.2 })
      );
      under.position.set(0, rad * 0.12, 0);
      // Educational HOPE plaque (readable canvas — no trademarks / no brand ads)
      const pc = document.createElement("canvas");
      pc.width = 512;
      pc.height = 128;
      const pg = pc.getContext("2d");
      pg.fillStyle = "#d0b888";
      pg.fillRect(0, 0, 512, 128);
      pg.fillStyle = "#1a1208";
      pg.fillRect(6, 6, 500, 116);
      pg.strokeStyle = "#ffe8b0";
      pg.lineWidth = 3;
      pg.strokeRect(12, 12, 488, 104);
      pg.fillStyle = "#ffe8b0";
      pg.font = "bold 48px sans-serif";
      pg.textAlign = "center";
      pg.fillText("HOPE", 256, 58);
      pg.font = "18px sans-serif";
      pg.fillStyle = "#d0e0c0";
      pg.fillText("2018 demo payload · educational replica", 256, 88);
      pg.fillStyle = "#90b0a0";
      pg.font = "14px sans-serif";
      pg.fillText("not affiliated · fan visualization", 256, 108);
      const plaqueTex = new THREE.CanvasTexture(pc);
      plaqueTex.colorSpace = THREE.SRGBColorSpace;
      plaqueTex.anisotropy = 8;
      const plaque = new THREE.Mesh(
        new THREE.BoxGeometry(rad * 0.72, rad * 0.2, rad * 0.03),
        window.VesperMat({
          map: plaqueTex, color: 0xffffff, metalness: 0.5, roughness: 0.32,
          emissive: 0x504028, emissiveIntensity: 0.48,
        })
      );
      plaque.position.set(-rad * 0.85, rad * 0.62, rad * 0.54);
      plaque.rotation.y = 0.15;
      plaque.name = "starmanHopePlaque";
      // Plate readability backer (contrast at walk distance)
      const plateBack = new THREE.Mesh(
        new THREE.BoxGeometry(rad * 0.78, rad * 0.24, rad * 0.02),
        window.VesperMat({ color: 0x100c08, metalness: 0.3, roughness: 0.7, emissive: 0x201808, emissiveIntensity: 0.2 })
      );
      plateBack.position.copy(plaque.position);
      plateBack.position.z -= rad * 0.02;
      plateBack.rotation.y = 0.15;
      // Fairing fragment + solar-panel reflection cue (educational payload context)
      const fairingFrag = new THREE.Group();
      const fairShell = new THREE.Mesh(
        new THREE.CylinderGeometry(rad * 1.55, rad * 1.75, rad * 0.14, 18, 1, true, 0, Math.PI * 1.15),
        window.VesperMat({ color: 0xe8e8ec, roughness: 0.45, metalness: 0.35, emissive: 0x404048, emissiveIntensity: 0.12 })
      );
      const solarCue = new THREE.Mesh(
        new THREE.BoxGeometry(rad * 1.1, rad * 0.02, rad * 0.55),
        window.VesperMat({
          color: 0x1a3050, metalness: 0.75, roughness: 0.25, emissive: 0x102848, emissiveIntensity: 0.55,
        })
      );
      solarCue.position.set(0, rad * 0.08, 0);
      solarCue.rotation.z = 0.15;
      // Panel cell lines
      for (let i = 0; i < 4; i++) {
        const cell = new THREE.Mesh(
          new THREE.BoxGeometry(rad * 0.02, rad * 0.025, rad * 0.5),
          window.VesperMat({ color: 0x80c0ff, metalness: 0.6, roughness: 0.3, emissive: 0x2060a0, emissiveIntensity: 0.4 })
        );
        cell.position.set(-rad * 0.4 + i * rad * 0.28, rad * 0.1, 0);
        fairingFrag.add(cell);
      }
      fairingFrag.add(fairShell, solarCue);
      fairingFrag.position.set(rad * 4.2, rad * 0.55, rad * 2.0);
      fairingFrag.rotation.set(0.35, 0.75, 0.15);
      // Distant fairing LOD proxy (soft glow shell — cheap when far)
      const fairingLod = new THREE.Mesh(
        new THREE.SphereGeometry(rad * 1.15, 12, 10),
        new THREE.MeshBasicMaterial({
          color: 0xd0d4e0, transparent: true, opacity: 0.14, depthWrite: false,
          blending: THREE.AdditiveBlending,
        })
      );
      fairingLod.position.copy(fairingFrag.position);
      fairingLod.name = "starmanFairingLod";
      const tag = new THREE.Mesh(
        new THREE.SphereGeometry(rad * 2.6, 16, 12),
        new THREE.MeshBasicMaterial({
          color: 0xff8060, transparent: true, opacity: 0.07, depthWrite: false,
          blending: THREE.AdditiveBlending, side: THREE.BackSide,
        })
      );
      // Wheel dust puffs (driving-feel cue when wheels spin)
      const wheelDust = [];
      [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach((xz) => {
        const dust = new THREE.Mesh(
          new THREE.SphereGeometry(rad * 0.12, 8, 6),
          new THREE.MeshBasicMaterial({
            color: 0xc0a880, transparent: true, opacity: 0.0, depthWrite: false,
            blending: THREE.AdditiveBlending,
          })
        );
        dust.position.set(xz[0] * rad * 0.72, rad * 0.08, xz[1] * rad * 0.52);
        dust.name = "starmanWheelDust";
        wheelDust.push(dust);
      });
      g.add(
        body, hood, nose, rear, bay, windshield, windTint, seat, torso, helm, visor, visorGleam, dash, earthDash, earthCloud,
        board, pack, armL, armR, gloveL, legL, legR, grille, skirtL, skirtR, hopePip, steer, chromeStrip, doorL, doorR, under, cabinGlow,
        sideMirror(rad * 0.62), sideMirror(-rad * 0.62), hl(rad * 0.38), hl(-rad * 0.38),
        tl(rad * 0.4), tl(-rad * 0.4),
        plaque, plateBack, fairingFrag, fairingLod, tag
      );
      wheels.forEach((w) => g.add(w));
      wheelDust.forEach((d) => g.add(d));
      g.userData.starmanWheels = wheels;
      g.userData.starmanWheelDust = wheelDust;
      g.userData.starmanEarth = earthDash;
      g.userData.starmanEarthCloud = earthCloud;
      g.userData.starmanHopePip = hopePip;
      g.userData.starmanSolar = solarCue;
      g.userData.starmanCabin = cabinGlow;
      g.userData.starmanFairing = fairingFrag;
      g.userData.starmanPlaque = plaque;
      g.userData.starmanVisorGleam = visorGleam;
      g.userData.isStarman = true;
      mesh = body;
    } else if (def.kind === "station" || def.kind === "observatory") {
      // Compact habitat proxy: hub + dual solar wings + dish + truss (+ ISS-ish long truss)
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.55, rad * 0.55, rad * 1.4, 14), mat(THREE, def.color, 0x304050));
      const wingMat = mat(THREE, 0x1a3050, 0x102848);
      const panel = new THREE.Mesh(new THREE.BoxGeometry(rad * 3.4, rad * 0.05, rad * 0.95), wingMat);
      panel.position.set(0, rad * 0.15, 0);
      const panel2 = panel.clone();
      panel2.position.y = -rad * 0.15;
      panel2.rotation.z = 0.08;
      const truss = new THREE.Mesh(
        new THREE.BoxGeometry(rad * (/ISS/i.test(def.name) ? 5.5 : 2.2), rad * 0.08, rad * 0.08),
        mat(THREE, 0xa0a8b0, 0x303840)
      );
      truss.position.y = rad * 0.05;
      const dish = new THREE.Mesh(
        new THREE.SphereGeometry(rad * 0.38, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
        mat(THREE, 0xc0c8d0, 0x203040)
      );
      dish.position.set(rad * 0.75, rad * 0.55, 0);
      const cupola = new THREE.Mesh(
        new THREE.SphereGeometry(rad * 0.22, 10, 8),
        window.VesperMat({
          color: 0x88b0d0, transparent: true, opacity: 0.55, metalness: 0.3, roughness: 0.2,
          emissive: 0x204060, emissiveIntensity: 0.25,
        })
      );
      cupola.position.set(-rad * 0.35, rad * 0.85, 0);
      cupola.name = "stationCupola";
      const bayLight = window.VesperNoLight(0xc0e0ff, 0.4, rad * 6, 2);
      bayLight.position.set(0, rad * 0.5, 0);
      bayLight.name = "stationBayLight";
      g.add(hub, panel, panel2, truss, dish, cupola, bayLight);
      if (/ISS/i.test(def.name)) {
        const wingL = new THREE.Mesh(new THREE.BoxGeometry(rad * 2.8, rad * 0.04, rad * 0.7), wingMat);
        wingL.position.set(-rad * 2.8, rad * 0.1, rad * 0.9);
        const wingR = wingL.clone();
        wingR.position.z = -rad * 0.9;
        const wingL2 = wingL.clone();
        wingL2.position.x = rad * 2.8;
        const wingR2 = wingR.clone();
        wingR2.position.x = rad * 2.8;
        g.add(wingL, wingR, wingL2, wingR2);
      }
      // Tiangong: Tianhe core + twin lab modules + solar (educational CSS silhouette)
      if (/Tiangong/i.test(def.name)) {
        const core = new THREE.Mesh(
          new THREE.CylinderGeometry(rad * 0.48, rad * 0.48, rad * 2.2, 12),
          mat(THREE, 0xe0e4e8, 0x405060)
        );
        core.rotation.z = Math.PI / 2;
        const labA = new THREE.Mesh(
          new THREE.CylinderGeometry(rad * 0.38, rad * 0.38, rad * 1.4, 10),
          mat(THREE, 0xc8d0d8, 0x304050)
        );
        labA.position.set(0, rad * 0.85, 0);
        const labB = labA.clone();
        labB.position.y = -rad * 0.85;
        const tgSolar = new THREE.Mesh(
          new THREE.BoxGeometry(rad * 4.2, rad * 0.04, rad * 0.85),
          wingMat
        );
        tgSolar.position.y = rad * 0.1;
        const tgSolar2 = tgSolar.clone();
        tgSolar2.position.y = -rad * 0.1;
        tgSolar2.rotation.z = 0.06;
        const docking = new THREE.Mesh(
          new THREE.CylinderGeometry(rad * 0.22, rad * 0.28, rad * 0.35, 8),
          mat(THREE, 0xa0a8b0, 0x303840)
        );
        docking.position.set(rad * 1.25, 0, 0);
        docking.rotation.z = Math.PI / 2;
        const tgLight = window.VesperNoLight(0xc0e8ff, 0.35, rad * 5, 2);
        tgLight.position.set(0, 0, 0);
        g.add(core, labA, labB, tgSolar, tgSolar2, docking, tgLight);
        hub.visible = panel.visible = panel2.visible = truss.visible = dish.visible = cupola.visible = false;
        mesh = core;
      }
      // Hubble: OTA tube + aperture door + solar wings (educational)
      if (/Hubble/i.test(def.name)) {
        const tube = new THREE.Mesh(
          new THREE.CylinderGeometry(rad * 0.42, rad * 0.42, rad * 2.6, 14),
          mat(THREE, 0xd0d8e0, 0x405060)
        );
        const aperture = new THREE.Mesh(
          new THREE.CylinderGeometry(rad * 0.38, rad * 0.38, rad * 0.12, 16),
          window.VesperMat({ color: 0x101820, metalness: 0.6, roughness: 0.35, emissive: 0x102030, emissiveIntensity: 0.2 })
        );
        aperture.position.y = rad * 1.35;
        const door = new THREE.Mesh(
          new THREE.BoxGeometry(rad * 0.9, rad * 0.06, rad * 0.55),
          mat(THREE, 0xa0a8b0, 0x303840)
        );
        door.position.set(rad * 0.55, rad * 1.2, 0);
        door.rotation.z = -0.4;
        const hWing = new THREE.Mesh(
          new THREE.BoxGeometry(rad * 3.6, rad * 0.04, rad * 1.1),
          window.VesperMat({ color: 0x1a4060, metalness: 0.55, roughness: 0.35, emissive: 0x102848, emissiveIntensity: 0.45 })
        );
        hWing.position.set(0, 0, 0);
        const hWing2 = hWing.clone();
        hWing2.position.y = rad * 0.15;
        hWing2.rotation.z = 0.05;
        // Foil cylinder bands
        for (let i = 0; i < 3; i++) {
          const band = new THREE.Mesh(
            new THREE.TorusGeometry(rad * 0.43, rad * 0.025, 6, 20),
            window.VesperMat({ color: 0xc0a060, metalness: 0.7, roughness: 0.35, emissive: 0x403010, emissiveIntensity: 0.2 })
          );
          band.position.y = -rad * 0.6 + i * rad * 0.55;
          band.rotation.x = Math.PI / 2;
          g.add(band);
        }
        const hLight = window.VesperNoLight(0xa0c0e0, 0.3, rad * 6, 2);
        hLight.position.set(0, rad * 0.5, 0);
        g.add(tube, aperture, door, hWing, hWing2, hLight);
        hub.visible = panel.visible = panel2.visible = truss.visible = dish.visible = cupola.visible = false;
        mesh = tube;
      }
      // Luna Gateway: PPE + HALO concept modules (display)
      if (/Gateway/i.test(def.name)) {
        const halo = new THREE.Mesh(
          new THREE.CylinderGeometry(rad * 0.55, rad * 0.55, rad * 1.1, 12),
          mat(THREE, 0xe8e8ec, 0x505860)
        );
        const ppe = new THREE.Mesh(
          new THREE.BoxGeometry(rad * 1.0, rad * 0.7, rad * 1.0),
          mat(THREE, 0xb0b8c0, 0x304050)
        );
        ppe.position.set(rad * 1.1, 0, 0);
        const radiators = new THREE.Mesh(
          new THREE.BoxGeometry(rad * 0.08, rad * 2.4, rad * 0.9),
          window.VesperMat({ color: 0xc0c8d0, metalness: 0.5, roughness: 0.4, emissive: 0x203040, emissiveIntensity: 0.2 })
        );
        radiators.position.set(-rad * 0.7, 0, 0);
        const gSolar = new THREE.Mesh(
          new THREE.BoxGeometry(rad * 4.5, rad * 0.04, rad * 0.7),
          wingMat
        );
        gSolar.position.set(0, rad * 0.4, 0);
        const gSolar2 = gSolar.clone();
        gSolar2.position.y = -rad * 0.4;
        const refuel = new THREE.Mesh(
          new THREE.SphereGeometry(rad * 0.28, 10, 8),
          mat(THREE, 0x90a0b0, 0x203040)
        );
        refuel.position.set(-rad * 0.2, -rad * 0.7, rad * 0.5);
        const gCupola = new THREE.Mesh(
          new THREE.SphereGeometry(rad * 0.2, 10, 8),
          window.VesperMat({
            color: 0x88b0d0, transparent: true, opacity: 0.55, metalness: 0.3, roughness: 0.2,
            emissive: 0x204060, emissiveIntensity: 0.3,
          })
        );
        gCupola.position.set(0, rad * 0.7, 0);
        g.add(halo, ppe, radiators, gSolar, gSolar2, refuel, gCupola);
        hub.visible = panel.visible = panel2.visible = truss.visible = dish.visible = cupola.visible = false;
        mesh = halo;
      }
      mesh = mesh || hub;
    } else if (def.kind === "probe" || def.kind === "rover") {
      const isApollo = /Apollo/i.test(def.name);
      const isRover = def.kind === "rover" && !isApollo;
      if (isApollo) {
        // Educational LM descent-ish marker (generic geometry — not trademarked replica)
        const descent = new THREE.Mesh(
          new THREE.CylinderGeometry(rad * 0.7, rad * 1.1, rad * 0.55, 8),
          mat(THREE, 0xd0d0d4, 0x404048)
        );
        descent.position.y = rad * 0.35;
        const ascent = new THREE.Mesh(
          new THREE.BoxGeometry(rad * 0.9, rad * 0.7, rad * 0.9),
          mat(THREE, 0xe8e8ec, 0x505058)
        );
        ascent.position.y = rad * 0.95;
        const leg = (x, z) => {
          const L = new THREE.Mesh(
            new THREE.CylinderGeometry(rad * 0.04, rad * 0.06, rad * 1.1, 5),
            mat(THREE, 0xa0a0a8, 0x303038)
          );
          L.position.set(x, rad * 0.35, z);
          L.rotation.z = x * 0.35;
          L.rotation.x = -z * 0.35;
          return L;
        };
        const flagPole = new THREE.Mesh(
          new THREE.CylinderGeometry(rad * 0.02, rad * 0.02, rad * 1.6, 5),
          mat(THREE, 0xc0c0c8)
        );
        flagPole.position.set(rad * 1.6, rad * 0.9, 0);
        const flag = new THREE.Mesh(
          new THREE.BoxGeometry(rad * 0.7, rad * 0.4, rad * 0.02),
          mat(THREE, 0x4060a0, 0x203050)
        );
        flag.position.set(rad * 1.95, rad * 1.4, 0);
        g.add(descent, ascent, leg(rad, rad), leg(-rad, rad), leg(rad, -rad), leg(-rad, -rad), flagPole, flag);
        mesh = descent;
      } else if (isRover) {
        const body = new THREE.Mesh(new THREE.BoxGeometry(rad * 1.4, rad * 0.55, rad * 1.1), mat(THREE, def.color, 0x403020));
        body.position.y = rad * 0.45;
        const mast = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.04, rad * 0.05, rad * 1.4, 6), mat(THREE, 0xd0d8e0));
        mast.position.set(rad * 0.3, rad * 1.1, 0);
        const cam = new THREE.Mesh(new THREE.BoxGeometry(rad * 0.25, rad * 0.18, rad * 0.2), mat(THREE, 0x303038));
        cam.position.set(rad * 0.3, rad * 1.75, 0);
        const wheels = [];
        [[-1, -1], [-1, 1], [1, -1], [1, 1], [0, -1.1], [0, 1.1]].forEach((xz) => {
          const w = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.22, rad * 0.22, rad * 0.12, 10), mat(THREE, 0x1a1a1e));
          w.rotation.z = Math.PI / 2;
          w.position.set(xz[0] * rad * 0.55, rad * 0.22, xz[1] * rad * 0.45);
          wheels.push(w);
          g.add(w);
        });
        g.add(body, mast, cam);
        // Curiosity: robotic arm + RTG + high-gain dish (educational silhouette)
        if (/Curiosity/i.test(def.name)) {
          const arm1 = new THREE.Mesh(
            new THREE.CylinderGeometry(rad * 0.05, rad * 0.06, rad * 0.9, 6),
            mat(THREE, 0xc0c8d0)
          );
          arm1.position.set(-rad * 0.55, rad * 0.7, rad * 0.35);
          arm1.rotation.z = 0.85;
          arm1.rotation.x = -0.3;
          const arm2 = new THREE.Mesh(
            new THREE.CylinderGeometry(rad * 0.04, rad * 0.05, rad * 0.7, 6),
            mat(THREE, 0xb0b8c0)
          );
          arm2.position.set(-rad * 0.95, rad * 0.35, rad * 0.5);
          arm2.rotation.z = 1.2;
          const turret = new THREE.Mesh(
            new THREE.BoxGeometry(rad * 0.22, rad * 0.16, rad * 0.2),
            mat(THREE, 0x404048)
          );
          turret.position.set(-rad * 1.15, rad * 0.15, rad * 0.6);
          const rtg = new THREE.Mesh(
            new THREE.CylinderGeometry(rad * 0.14, rad * 0.14, rad * 0.45, 8),
            window.VesperMat({ color: 0xb09870, metalness: 0.5, roughness: 0.4, emissive: 0x403020, emissiveIntensity: 0.3 })
          );
          rtg.position.set(-rad * 0.55, rad * 0.55, -rad * 0.35);
          rtg.rotation.z = Math.PI / 2;
          const hga = new THREE.Mesh(
            new THREE.SphereGeometry(rad * 0.28, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.5),
            mat(THREE, 0xd0d8e0, 0x304050)
          );
          hga.position.set(rad * 0.15, rad * 1.05, -rad * 0.35);
          const deck = new THREE.Mesh(
            new THREE.BoxGeometry(rad * 1.15, rad * 0.08, rad * 0.9),
            window.VesperMat({ color: 0xd8c090, metalness: 0.35, roughness: 0.55, emissive: 0x302010, emissiveIntensity: 0.15 })
          );
          deck.position.set(0, rad * 0.75, 0);
          g.add(arm1, arm2, turret, rtg, hga, deck);
        }
        mesh = body;
      } else {
        const body = new THREE.Mesh(new THREE.BoxGeometry(rad * 1.2, rad * 0.7, rad * 1.6), mat(THREE, def.color, 0x203040));
        const ant = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.05, rad * 0.05, rad * 1.8, 6), mat(THREE, 0xd0d8e0));
        ant.position.y = rad * 1.1;
        // JWST-ish hex cluster + multi-layer sunshield
        if (/JWST|Webb/i.test(def.name)) {
          const hexMat = mat(THREE, 0xd0d8e8, 0x405060);
          for (let i = 0; i < 7; i++) {
            const hex = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.38, rad * 0.38, rad * 0.06, 6), hexMat);
            if (i === 0) hex.position.set(0, rad * 0.35, 0);
            else {
              const a = ((i - 1) / 6) * Math.PI * 2;
              hex.position.set(Math.cos(a) * rad * 0.72, rad * 0.35, Math.sin(a) * rad * 0.72);
            }
            g.add(hex);
          }
          for (let L = 0; L < 3; L++) {
            const sunshield = new THREE.Mesh(
              new THREE.BoxGeometry(rad * (3.4 + L * 0.15), rad * 0.03, rad * (1.7 + L * 0.08)),
              window.VesperMat({
                color: L === 1 ? 0xf0e8d8 : 0xe0d8c8, metalness: 0.35, roughness: 0.45,
                emissive: 0x302818, emissiveIntensity: 0.12,
              })
            );
            sunshield.position.y = -rad * (0.25 + L * 0.08);
            sunshield.rotation.z = (L - 1) * 0.04;
            g.add(sunshield);
          }
        }
        // Voyager-ish HGA dish + RTG boom (educational silhouette)
        if (/Voyager/i.test(def.name)) {
          const dish = new THREE.Mesh(
            new THREE.SphereGeometry(rad * 1.35, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
            mat(THREE, 0xc8d0d8, 0x304050)
          );
          dish.position.set(0, rad * 0.2, rad * 0.1);
          dish.rotation.x = -0.4;
          const boom = new THREE.Mesh(
            new THREE.CylinderGeometry(rad * 0.03, rad * 0.03, rad * 3.2, 5),
            mat(THREE, 0xa0a8b0)
          );
          boom.position.set(rad * 1.6, rad * 0.1, 0);
          boom.rotation.z = Math.PI / 2.2;
          const rtg = new THREE.Mesh(
            new THREE.CylinderGeometry(rad * 0.18, rad * 0.18, rad * 0.7, 8),
            window.VesperMat({ color: 0xb0a090, metalness: 0.5, roughness: 0.4, emissive: 0x403020, emissiveIntensity: 0.25 })
          );
          rtg.position.set(rad * 2.9, rad * 0.1, 0);
          rtg.rotation.z = Math.PI / 2;
          const hga = window.VesperNoLight(0xa0c0e0, 0.25, rad * 8, 2);
          hga.position.copy(dish.position);
          g.add(dish, boom, rtg, hga);
        }
        // Parker heat-shield disc cue
        if (/Parker/i.test(def.name)) {
          const shield = new THREE.Mesh(
            new THREE.CylinderGeometry(rad * 1.6, rad * 1.6, rad * 0.12, 18),
            window.VesperMat({ color: 0x2a2018, metalness: 0.2, roughness: 0.85, emissive: 0x401808, emissiveIntensity: 0.35 })
          );
          shield.position.y = rad * 0.55;
          g.add(shield);
        }
        // New Horizons piano-ish bus + RTG + HGA + thruster stubs (educational)
        if (/New Horizons/i.test(def.name)) {
          const bus = new THREE.Mesh(
            new THREE.BoxGeometry(rad * 1.65, rad * 1.05, rad * 1.65),
            mat(THREE, 0xd8dce0, 0x404850)
          );
          bus.position.y = rad * 0.2;
          const rtg = new THREE.Mesh(
            new THREE.CylinderGeometry(rad * 0.22, rad * 0.22, rad * 1.0, 8),
            window.VesperMat({ color: 0xb09870, metalness: 0.5, roughness: 0.38, emissive: 0x302010, emissiveIntensity: 0.28 })
          );
          rtg.position.set(rad * 1.25, rad * 0.2, 0);
          rtg.rotation.z = Math.PI / 2;
          // RTG fin discs
          for (let i = 0; i < 4; i++) {
            const fin = new THREE.Mesh(
              new THREE.CylinderGeometry(rad * 0.32, rad * 0.32, rad * 0.03, 10),
              mat(THREE, 0xa09070, 0x302818)
            );
            fin.position.set(rad * (0.9 + i * 0.18), rad * 0.2, 0);
            fin.rotation.z = Math.PI / 2;
            g.add(fin);
          }
          const antenna = new THREE.Mesh(
            new THREE.SphereGeometry(rad * 0.95, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.52),
            mat(THREE, 0xc8d0d8, 0x303840)
          );
          antenna.position.set(0, rad * 0.95, 0);
          const adapter = new THREE.Mesh(
            new THREE.CylinderGeometry(rad * 0.15, rad * 0.2, rad * 0.35, 8),
            mat(THREE, 0xa0a8b0)
          );
          adapter.position.set(0, rad * 0.55, 0);
          const thruster = (x, z) => {
            const th = new THREE.Mesh(
              new THREE.CylinderGeometry(rad * 0.06, rad * 0.08, rad * 0.2, 6),
              window.VesperMat({ color: 0x606870, metalness: 0.6, roughness: 0.4, emissive: 0x203040, emissiveIntensity: 0.2 })
            );
            th.position.set(x, rad * 0.05, z);
            return th;
          };
          const nhLight = window.VesperNoLight(0xa0c0e0, 0.28, rad * 7, 2);
          nhLight.position.set(0, rad * 0.8, 0);
          g.add(bus, rtg, antenna, adapter, thruster(rad * 0.7, rad * 0.7), thruster(-rad * 0.7, rad * 0.7), thruster(rad * 0.7, -rad * 0.7), thruster(-rad * 0.7, -rad * 0.7), nhLight);
          body.visible = false;
          ant.visible = false;
          mesh = bus;
        }

        // Cassini: HGA dish + RTG + magnetometer boom (memorial educational)
        if (/Cassini/i.test(def.name)) {
          const dish = new THREE.Mesh(
            new THREE.SphereGeometry(rad * 1.2, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
            mat(THREE, 0xc8d0d8, 0x304050)
          );
          dish.position.set(0, rad * 0.35, 0);
          dish.rotation.x = -0.35;
          const busC = new THREE.Mesh(
            new THREE.CylinderGeometry(rad * 0.45, rad * 0.5, rad * 1.1, 12),
            mat(THREE, 0xb0a090, 0x403020)
          );
          busC.position.y = -rad * 0.2;
          const boom = new THREE.Mesh(
            new THREE.CylinderGeometry(rad * 0.025, rad * 0.025, rad * 4.2, 5),
            mat(THREE, 0xa0a8b0)
          );
          boom.position.set(rad * 2.1, rad * 0.1, 0);
          boom.rotation.z = Math.PI / 2;
          const rtg = new THREE.Mesh(
            new THREE.CylinderGeometry(rad * 0.16, rad * 0.16, rad * 0.65, 8),
            window.VesperMat({ color: 0xb09870, metalness: 0.5, roughness: 0.4, emissive: 0x403020, emissiveIntensity: 0.28 })
          );
          rtg.position.set(-rad * 1.1, rad * 0.05, rad * 0.6);
          rtg.rotation.z = Math.PI / 2.4;
          const hgaL = window.VesperNoLight(0xa0c0e0, 0.22, rad * 7, 2);
          hgaL.position.copy(dish.position);
          g.add(dish, busC, boom, rtg, hgaL);
          body.visible = false;
          ant.visible = false;
          mesh = dish;
        }
        // Juno: hexagonal bus + three radial solar wings
        if (/Juno/i.test(def.name)) {
          const hex = new THREE.Mesh(
            new THREE.CylinderGeometry(rad * 0.7, rad * 0.7, rad * 0.55, 6),
            mat(THREE, 0xc0a080, 0x403020)
          );
          hex.position.y = rad * 0.15;
          for (let i = 0; i < 3; i++) {
            const a = (i / 3) * Math.PI * 2;
            const wing = new THREE.Mesh(
              new THREE.BoxGeometry(rad * 2.8, rad * 0.04, rad * 0.7),
              window.VesperMat({ color: 0x1a3050, metalness: 0.7, roughness: 0.3, emissive: 0x102848, emissiveIntensity: 0.4 })
            );
            wing.position.set(Math.cos(a) * rad * 1.9, rad * 0.15, Math.sin(a) * rad * 1.9);
            wing.rotation.y = -a;
            g.add(wing);
          }
          const dishJ = new THREE.Mesh(
            new THREE.SphereGeometry(rad * 0.45, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.5),
            mat(THREE, 0xd0d8e0, 0x304050)
          );
          dishJ.position.set(0, rad * 0.55, 0);
          g.add(hex, dishJ);
          body.visible = false;
          ant.visible = false;
          mesh = hex;
        }
        // Rosetta: box bus + twin solar arrays + lander cue
        if (/Rosetta/i.test(def.name)) {
          const busR = new THREE.Mesh(
            new THREE.BoxGeometry(rad * 1.4, rad * 1.0, rad * 1.4),
            mat(THREE, 0xc0b090, 0x403020)
          );
          busR.position.y = rad * 0.2;
          const wingL = new THREE.Mesh(
            new THREE.BoxGeometry(rad * 3.2, rad * 0.04, rad * 0.9),
            window.VesperMat({ color: 0x1a3858, metalness: 0.72, roughness: 0.28, emissive: 0x103050, emissiveIntensity: 0.42 })
          );
          wingL.position.set(0, rad * 0.25, rad * 2.0);
          const wingR = wingL.clone();
          wingR.position.z = -rad * 2.0;
          const lander = new THREE.Mesh(
            new THREE.BoxGeometry(rad * 0.45, rad * 0.35, rad * 0.45),
            mat(THREE, 0xd0c8b0, 0x504030)
          );
          lander.position.set(rad * 0.9, -rad * 0.15, 0);
          const dishRo = new THREE.Mesh(
            new THREE.SphereGeometry(rad * 0.55, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.5),
            mat(THREE, 0xc8d0d8, 0x304050)
          );
          dishRo.position.set(-rad * 0.3, rad * 0.85, 0);
          g.add(busR, wingL, wingR, lander, dishRo);
          body.visible = false;
          ant.visible = false;
          mesh = busR;
        }
        // OSIRIS-REx: sample-return bus + TAGSAM arm cue + solar
        if (/OSIRIS/i.test(def.name)) {
          const busO = new THREE.Mesh(
            new THREE.BoxGeometry(rad * 1.3, rad * 0.85, rad * 1.3),
            mat(THREE, 0xa0b0c8, 0x203040)
          );
          busO.position.y = rad * 0.2;
          for (let i = 0; i < 2; i++) {
            const w = new THREE.Mesh(
              new THREE.BoxGeometry(rad * 2.6, rad * 0.035, rad * 0.85),
              window.VesperMat({ color: 0x1a3050, metalness: 0.75, roughness: 0.28, emissive: 0x102848, emissiveIntensity: 0.45 })
            );
            w.position.set(0, rad * 0.25, (i ? 1 : -1) * rad * 1.85);
            g.add(w);
          }
          const arm = new THREE.Mesh(
            new THREE.CylinderGeometry(rad * 0.04, rad * 0.05, rad * 1.8, 6),
            mat(THREE, 0xd0d8e0)
          );
          arm.position.set(rad * 0.9, -rad * 0.4, 0);
          arm.rotation.z = 0.7;
          const head = new THREE.Mesh(
            new THREE.CylinderGeometry(rad * 0.18, rad * 0.22, rad * 0.2, 10),
            window.VesperMat({ color: 0x808890, metalness: 0.5, roughness: 0.4, emissive: 0x304050, emissiveIntensity: 0.25 })
          );
          head.position.set(rad * 1.55, -rad * 0.95, 0);
          const dishO = new THREE.Mesh(
            new THREE.SphereGeometry(rad * 0.5, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.5),
            mat(THREE, 0xc8d0d8, 0x304050)
          );
          dishO.position.set(0, rad * 0.75, 0);
          g.add(busO, arm, head, dishO);
          body.visible = false;
          ant.visible = false;
          mesh = busO;
        }
        // Lucy: circular solar wings + bus (Trojan survey)
        if (/Lucy/i.test(def.name)) {
          const busL = new THREE.Mesh(
            new THREE.BoxGeometry(rad * 1.1, rad * 0.75, rad * 1.1),
            mat(THREE, 0xd0c8a0, 0x403020)
          );
          busL.position.y = rad * 0.15;
          for (let i = 0; i < 2; i++) {
            const disc = new THREE.Mesh(
              new THREE.CylinderGeometry(rad * 1.35, rad * 1.35, rad * 0.05, 20),
              window.VesperMat({ color: 0x1a3858, metalness: 0.7, roughness: 0.3, emissive: 0x103050, emissiveIntensity: 0.4 })
            );
            disc.position.set((i ? 1 : -1) * rad * 1.9, rad * 0.2, 0);
            disc.rotation.z = Math.PI / 2;
            g.add(disc);
          }
          const dishLu = new THREE.Mesh(
            new THREE.SphereGeometry(rad * 0.48, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.5),
            mat(THREE, 0xc8d0d8, 0x304050)
          );
          dishLu.position.set(0, rad * 0.7, 0);
          g.add(busL, dishLu);
          body.visible = false;
          ant.visible = false;
          mesh = busL;
        }
        // DAWN: ion thruster stub + twin solar (Vesta/Ceres)
        if (/DAWN|Dawn/i.test(def.name)) {
          const busD = new THREE.Mesh(
            new THREE.BoxGeometry(rad * 1.25, rad * 0.9, rad * 1.25),
            mat(THREE, 0xb0b8c0, 0x303840)
          );
          busD.position.y = rad * 0.2;
          for (let i = 0; i < 2; i++) {
            const w = new THREE.Mesh(
              new THREE.BoxGeometry(rad * 3.4, rad * 0.04, rad * 0.75),
              window.VesperMat({ color: 0x1a3050, metalness: 0.72, roughness: 0.28, emissive: 0x102848, emissiveIntensity: 0.42 })
            );
            w.position.set(0, rad * 0.25, (i ? 1 : -1) * rad * 2.1);
            g.add(w);
          }
          const ion = new THREE.Mesh(
            new THREE.CylinderGeometry(rad * 0.2, rad * 0.28, rad * 0.35, 10),
            window.VesperMat({ color: 0x6080a0, metalness: 0.6, roughness: 0.35, emissive: 0x4060a0, emissiveIntensity: 0.55 })
          );
          ion.position.set(0, -rad * 0.35, rad * 0.7);
          ion.rotation.x = Math.PI / 2;
          const ionGlow = window.VesperNoLight(0x80a0ff, 0.35, rad * 5, 2);
          ionGlow.position.copy(ion.position);
          const dishD = new THREE.Mesh(
            new THREE.SphereGeometry(rad * 0.5, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.5),
            mat(THREE, 0xc8d0d8, 0x304050)
          );
          dishD.position.set(0, rad * 0.8, 0);
          g.add(busD, ion, ionGlow, dishD);
          body.visible = false;
          ant.visible = false;
          mesh = busD;
        }

        // Ingenuity: coaxial rotor helicopter (memorial educational silhouette)
        if (/Ingenuity/i.test(def.name)) {
          const fuselage = new THREE.Mesh(
            new THREE.BoxGeometry(rad * 0.55, rad * 0.35, rad * 0.7),
            mat(THREE, 0xe8e8ec, 0x505860)
          );
          fuselage.position.y = rad * 0.55;
          const mast = new THREE.Mesh(
            new THREE.CylinderGeometry(rad * 0.04, rad * 0.05, rad * 0.9, 6),
            mat(THREE, 0xc0c8d0)
          );
          mast.position.y = rad * 1.05;
          const hubR = new THREE.Mesh(
            new THREE.CylinderGeometry(rad * 0.08, rad * 0.08, rad * 0.1, 8),
            mat(THREE, 0x303038)
          );
          hubR.position.y = rad * 1.5;
          const bladeMat = window.VesperMat({
            color: 0xd0d4d8, metalness: 0.4, roughness: 0.45, emissive: 0x203040, emissiveIntensity: 0.15,
          });
          const blades = [];
          for (let i = 0; i < 4; i++) {
            const blade = new THREE.Mesh(new THREE.BoxGeometry(rad * 2.2, rad * 0.02, rad * 0.12), bladeMat);
            blade.position.y = rad * (1.48 + (i < 2 ? 0 : 0.08));
            blade.rotation.y = (i % 2) * Math.PI / 2 + (i < 2 ? 0 : Math.PI / 4);
            blades.push(blade);
            g.add(blade);
          }
          const leg = (x, z) => {
            const L = new THREE.Mesh(
              new THREE.CylinderGeometry(rad * 0.025, rad * 0.03, rad * 0.55, 5),
              mat(THREE, 0xa0a0a8)
            );
            L.position.set(x, rad * 0.25, z);
            L.rotation.z = x * 0.4;
            L.rotation.x = -z * 0.4;
            return L;
          };
          const solarTop = new THREE.Mesh(
            new THREE.BoxGeometry(rad * 0.5, rad * 0.03, rad * 0.5),
            window.VesperMat({ color: 0x1a3050, metalness: 0.7, roughness: 0.3, emissive: 0x102848, emissiveIntensity: 0.4 })
          );
          solarTop.position.y = rad * 0.75;
          g.userData.ingenuityBlades = blades;
          g.add(fuselage, mast, hubR, solarTop, leg(rad * 0.35, rad * 0.3), leg(-rad * 0.35, rad * 0.3), leg(rad * 0.35, -rad * 0.3), leg(-rad * 0.35, -rad * 0.3));
          body.visible = false;
          ant.visible = false;
          mesh = fuselage;
        }
        g.add(body, ant);
        mesh = mesh || body;
      }
    } else if (def.kind === "comet") {
      const core = new THREE.Mesh(new THREE.DodecahedronGeometry(rad, 0), mat(THREE, def.color, 0x405060));
      const coma = new THREE.Mesh(
        new THREE.SphereGeometry(rad * 2.2, 16, 12),
        new THREE.MeshBasicMaterial({
          color: 0xa0c8ff,
          transparent: true,
          opacity: 0.12,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        })
      );
      g.add(core, coma);
      const ionTail = new THREE.Mesh(
        new THREE.CylinderGeometry(rad * 0.15, rad * 1.2, rad * 8, 8, 1, true),
        new THREE.MeshBasicMaterial({
          color: 0x80c0ff,
          transparent: true,
          opacity: 0.22,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
        })
      );
      ionTail.position.set(-rad * 4, 0, 0);
      ionTail.rotation.z = Math.PI / 2;
      const dustTail = new THREE.Mesh(
        new THREE.CylinderGeometry(rad * 0.3, rad * 1.6, rad * 6, 8, 1, true),
        new THREE.MeshBasicMaterial({
          color: 0xffe0a0,
          transparent: true,
          opacity: 0.12,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
        })
      );
      dustTail.position.set(-rad * 3, rad * 0.3, 0);
      dustTail.rotation.z = Math.PI / 2 + 0.15;
      g.add(ionTail, dustTail);
      mesh = core;
    } else {
      const geo = /eros|ida|psyche|amalthea|janus|epimetheus|phoebe|larissa|weywot/i.test(def.name)
        ? new THREE.DodecahedronGeometry(rad, 0)
        : new THREE.SphereGeometry(rad, 28, 20);
      let m = mat(THREE, def.color, def.color);
      if (/psyche/i.test(def.name)) {
        m = new THREE.MeshBasicMaterial({ color: 0xa0a8b0 });
      } else if (/phoebe/i.test(def.name)) {
        m = new THREE.MeshBasicMaterial({ color: 0x3a3228 });
      }
      mesh = new THREE.Mesh(geo, m);
      g.add(mesh);
      if (/sedna|halley|encke/i.test(def.name)) {
        const halo = new THREE.Mesh(
          new THREE.SphereGeometry(rad * 1.15, 16, 12),
          new THREE.MeshBasicMaterial({
            color: def.color,
            transparent: true,
            opacity: 0.2,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,
          })
        );
        g.add(halo);
      }
    }
    // Presence halo for tiny craft
    if (def.manmade || def.kind === "probe") {
      const h = new THREE.Mesh(
        new THREE.SphereGeometry(rad * 2.4, 12, 10),
        new THREE.MeshBasicMaterial({
          color: 0x80c0ff,
          transparent: true,
          opacity: 0.1,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          side: THREE.BackSide,
        })
      );
      g.add(h);
    }
    g.userData.radius = rad;
    g.userData.catalog = def;
    return { group: g, mesh: mesh };
  }

  function placeOne(THREE, system, def, angle) {
    const auShow = DISPLAY_AU[def.name] != null ? DISPLAY_AU[def.name] : Math.min(def.au, 24);
    const rad = Math.max(0.22, ER() * def.r * (def.manmade ? 0.85 : 0.95));
    const { group: g, mesh } = makeMesh(THREE, def, rad);
    const o = auShow * AU();
    const a = angle;
    const y = (def.y || 0) * ER() * 0.4;
    // Starman: display elliptical heliocentric path (ecc ~0.26 educational)
    const ecc = def.kind === "starman" ? 0.26 : 0;
    const rOrb = ecc > 0 ? o * (1 - ecc * ecc) / (1 + ecc * Math.cos(a)) : o;
    g.position.set(Math.cos(a) * rOrb, y, Math.sin(a) * rOrb);
    system.add(g);
    const body = {
      name: def.name,
      group: g,
      mesh: mesh,
      def: {
        radius: rad,
        orbit: o,
        speed: (function () {
          const a = Math.max(0.3, def.au || 1);
          // Scale so Earth (a=1) ~ 0.012 — Kepler n ∝ a^{-3/2}
          const n = 0.012 * Math.pow(a, -1.5);
          return def.kind === "starman" ? n * 0.85 : Math.min(0.08, Math.max(0.0008, n));
        })(),
        y: y,
        au: def.au,
        catalog: true,
        manmade: !!def.manmade,
        kind: def.kind,
        ecc: ecc,
      },
      angle: a,
      radius: rad,
      landable: true,
      walkable: true,
      isMoon: def.kind === "moon",
      isAsteroid: def.kind === "asteroid" || def.kind === "tno",
      isComet: def.kind === "comet",
      manmade: !!def.manmade,
      fixed: false,
      catalog: true,
      blurb: def.blurb,
    };
    // Slow orbit each frame via main bodies loop — mark for angle update
    body.fixed = false;
    body._catalogOrbit = true;
    if (sky().registerBody) sky().registerBody(body);
    made.push(body);
    return body;
  }



  function parkNear(parentName, childName, distMul, angle) {
    const bodies = sky() && sky()._bodiesRef && sky()._bodiesRef();
    if (!bodies) return;
    const parent = bodies.find((b) => b && b.name === parentName && b.group);
    const child = bodies.find((b) => b && b.name === childName && b.group);
    if (!parent || !child || child._parkedBy) return;
    if (child.group.parent) child.group.parent.remove(child.group);
    parent.group.add(child.group);
    const orbit = Math.max(parent.radius * distMul, parent.radius + 30);
    child.group.position.set(Math.cos(angle) * orbit, orbit * 0.05, Math.sin(angle) * orbit);
    // fixed skips the solar-orbit write. These are display craft, not moons,
    // so they must not join the moon list (that line would say they orbit).
    child.fixed = true;
    child.parentName = parentName;
    child._parkedBy = parentName;
  }

  function attachDactyl(THREE) {
    const bodies = sky() && sky()._bodiesRef && sky()._bodiesRef();
    if (!bodies) return;
    const ida = bodies.find((b) => b && b.name === "Ida" && b.group);
    const dactyl = bodies.find((b) => b && b.name === "Dactyl" && b.group);
    if (!ida || !dactyl || dactyl._idaMoon) return;
    if (dactyl.group.parent) dactyl.group.parent.remove(dactyl.group);
    ida.group.add(dactyl.group);
    // Real orbit is ~1.54 d around Ida, not a second belt rock 0.4 AU away.
    // Cruise clock: one Earth day is 6 wall seconds, same as SIM_DAY.
    const orbit = Math.max(ida.radius * 3.4, 10);
    const periodDays = 1.54;
    dactyl.group.userData.orbit = orbit;
    dactyl.group.userData.periodDays = periodDays;
    dactyl.group.userData.speed = (Math.PI * 2) / (periodDays * 6);
    dactyl.group.userData.angle = 0.6;
    dactyl.group.userData.tidalLock = true;
    dactyl.group.userData.bodyName = "Dactyl";
    dactyl.group.userData.isMoonGroup = true;
    dactyl.group.position.set(orbit, 0, 0);
    if (!ida.group.userData.moons) ida.group.userData.moons = [];
    ida.group.userData.moons.push(dactyl.group);
    dactyl.isMoon = true;
    dactyl.parentName = "Ida";
    dactyl._idaMoon = true;
  }

  function place() {
    const THREE = T();
    const s = sky();
    if (!THREE || !s || !s.system) return false;
    const system = s.system();
    if (!system) return false;
    if (group) {
      try {
        system.remove(group);
      } catch (_) {}
    }
    // Clear prior catalog bodies from register by renaming — simpler: only place once
    if (placed) return true;
    group = new THREE.Group();
    group.name = "vesper-catalog";
    system.add(group);

    let i = 0;
    NATURAL.forEach((d) => {
      const b = placeOne(THREE, system, d, (i / (NATURAL.length + MANMADE.length)) * Math.PI * 2 + 0.3);
      // parent under catalog group for cleanup? keep in system for world positions
      i++;
    });
    MANMADE.forEach((d) => {
      placeOne(THREE, system, d, (i / (NATURAL.length + MANMADE.length)) * Math.PI * 2 + 1.1);
      i++;
    });

    attachDactyl(THREE);
    // The notes say near Earth, near the Moon, or an orbiter. The old
    // solar rail left the ISS 1.8 AU from Earth and Juno a system away.
    parkNear("Earth", "ISS", 1.35, 0.4);
    parkNear("Earth", "Tiangong", 1.55, 2.2);
    parkNear("Earth", "Hubble", 1.8, 3.8);
    parkNear("Earth", "JWST", 5.5, 1.1); // was 2.7, inside the Moon, while the line says L2
    parkNear("Moon", "Apollo 11 Site", 1.55, 0.6);
    parkNear("Moon", "Luna Gateway", 2.4, 2.4);
    parkNear("Mars", "Curiosity", 1.55, 0.5);
    // Phobos's disk reaches about 2.4 Mars radii. 1.9 and 2.25 sat inside it.
    parkNear("Mars", "Perseverance", 3.5, 2.1);
    parkNear("Mars", "Ingenuity", 4.15, 4.0);
    parkNear("Jupiter", "Juno", 1.7, 1.0);
    parkNear("Saturn", "Cassini", 1.9, 0.8);
    parkNear("Ceres", "DAWN", 2.2, 1.2);

    // Patch blurbs
    if (s && !s._catalogBlurb) {
      const orig = s.getBlurb && s.getBlurb.bind(s);
      s.getBlurb = (name) => {
        const hit = NATURAL.concat(MANMADE).find((x) => x.name === name);
        if (hit) return (hit.manmade ? "Man-made · " : "") + hit.blurb;
        return orig ? orig(name) : "";
      };
      s._catalogBlurb = true;
    }

    placed = true;
    window.__vesperCatalog = {
      natural: NATURAL.length,
      manmade: MANMADE.length,
      bodies: () => made.slice(),
      tick: function (dt) {
        const t = performance.now() * 0.001;
        made.forEach((b) => {
          if (!b.group) return;
          const ud = b.group.userData;
          if (ud.starmanWheels) {
            // Sync spin to display orbital motion (educational cue)
            const spin = dt * (1.6 + ((b.def && b.def.speed) || 0.02) * 40);
            ud.starmanWheels.forEach((w) => {
              w.rotation.x += spin;
            });
            // Wheel dust puff when "driving" feel (opacity pulse)
            if (ud.starmanWheelDust) {
              const dop = 0.08 + 0.12 * (0.5 + 0.5 * Math.sin(t * 3.2));
              ud.starmanWheelDust.forEach((d, i) => {
                if (d.material) {
                  d.material.opacity = dop * (0.7 + 0.3 * Math.sin(t * 4.1 + i));
                  d.scale.setScalar(0.85 + 0.35 * (0.5 + 0.5 * Math.sin(t * 5 + i * 0.7)));
                }
              });
            }
          }
          if (ud.starmanVisorGleam && ud.starmanVisorGleam.material) {
            ud.starmanVisorGleam.material.emissiveIntensity = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(t * 2.8));
          }
          if (ud.ingenuityBlades) {
            const bspin = dt * 8.5;
            ud.ingenuityBlades.forEach((bl, i) => {
              bl.rotation.y += bspin * (i < 2 ? 1 : -1.15);
            });
          }
          if (ud.starmanEarth) {
            ud.starmanEarth.rotation.y += dt * 0.35;
          }
          if (ud.starmanHopePip && ud.starmanHopePip.material) {
            ud.starmanHopePip.material.emissiveIntensity = 0.9 + 0.5 * (0.5 + 0.5 * Math.sin(t * 2.4));
          }
          if (ud.starmanSolar && ud.starmanSolar.material) {
            ud.starmanSolar.material.emissiveIntensity = 0.4 + 0.25 * (0.5 + 0.5 * Math.sin(t * 1.1));
          }
          if (ud.starmanEarthCloud) ud.starmanEarthCloud.rotation.y -= dt * 0.22;
          if (ud.starmanCabin) ud.starmanCabin.intensity = 0.4 + 0.25 * (0.5 + 0.5 * Math.sin(t * 1.6));
          if (ud.starmanPlaque && ud.starmanPlaque.material) {
            ud.starmanPlaque.material.emissiveIntensity = 0.28 + 0.14 * (0.5 + 0.5 * Math.sin(t * 1.3));
          }
          // Fairing LOD: detailed fragment vs soft glow by camera distance
          try {
            const pos = window.VesperSky && window.VesperSky.getPos && window.VesperSky.getPos();
            const THREE = window.THREE;
            if (pos && THREE && b.group) {
              const wp = new THREE.Vector3();
              b.group.getWorldPosition(wp);
              const dist = Math.hypot(pos[0] - wp.x, pos[1] - wp.y, pos[2] - wp.z);
              const near = dist < (b.radius || 1) * 90;
              if (ud.starmanFairing) ud.starmanFairing.visible = near;
              b.group.traverse((ch) => {
                if (ch.name === "starmanFairingLod") ch.visible = !near;
              });
            }
          } catch (_) {}
        });
      },
    };
    // gentle wheel spin
    (function spin() {
      requestAnimationFrame(spin);
      if (window.__vesperCatalog && window.__vesperCatalog.tick) {
        window.__vesperCatalog.tick(1 / 60);
      }
    })();
    return true;
  }

  function boot() {
    if (!sky()) return;
    // After world + radio station
    setTimeout(() => {
      try {
        place();
      } catch (e) {
        console.warn("[vesper-catalog]", e);
      }
    }, 900);
  }

  window.addEventListener("vesper:ready", boot);
  if (document.readyState === "complete") setTimeout(boot, 200);
  else window.addEventListener("load", () => setTimeout(boot, 200));
})();
