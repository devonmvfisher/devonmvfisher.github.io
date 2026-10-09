/**
 * Vesper Deep Sky — boosted / false-color beauty mode (physics-inspired).
 * Naked-eye nebulae are usually too dim; Vesper applies an extended-spectrum
 * boost: Hα reds, [OIII] teals, dust lanes, MW structure, zodiacal light,
 * integrated starlight. Beautiful and bright — not cartoon rainbow spam.
 */
(function () {
  "use strict";

  function seeded(n) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  function makeNebulaCanvas(kind, size) {
    size = size || 512;
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const g = c.getContext("2d");
    g.clearRect(0, 0, size, size);
    const cx = size * 0.5;
    const cy = size * 0.5;

    // Palette by emission / dust physics (beauty-boosted)
    let cores, mid, outer;
    if (kind === "ha") {
      // Hydrogen-alpha + NII — rose / crimson
      cores = "rgba(255,120,140,0.85)";
      mid = "rgba(200,40,70,0.35)";
      outer = "rgba(80,10,30,0)";
    } else if (kind === "oiii") {
      // Doubly ionized oxygen — teal / cyan
      cores = "rgba(140,255,230,0.8)";
      mid = "rgba(40,180,170,0.32)";
      outer = "rgba(10,50,55,0)";
    } else if (kind === "dust") {
      // Reflective / absorbing dust — warm amber-brown lanes
      cores = "rgba(255,200,140,0.55)";
      mid = "rgba(140,90,50,0.28)";
      outer = "rgba(40,20,10,0)";
    } else if (kind === "reflection") {
      // Dust scattering young-star blue
      cores = "rgba(180,210,255,0.75)";
      mid = "rgba(70,110,200,0.3)";
      outer = "rgba(15,25,60,0)";
    } else {
      // Composite / broadband
      cores = "rgba(255,180,220,0.7)";
      mid = "rgba(100,80,180,0.28)";
      outer = "rgba(20,15,40,0)";
    }

    // Multi-lobe organic cloud
    const lobes = 5 + ((seeded(kind.length * 9) * 4) | 0);
    for (let i = 0; i < lobes; i++) {
      const ang = (i / lobes) * Math.PI * 2 + seeded(i + 3) * 0.8;
      const dist = size * (0.08 + seeded(i * 2.2) * 0.22);
      const lx = cx + Math.cos(ang) * dist;
      const ly = cy + Math.sin(ang) * dist;
      const r = size * (0.22 + seeded(i * 4.1) * 0.28);
      const grd = g.createRadialGradient(lx, ly, 0, lx, ly, r);
      grd.addColorStop(0, cores);
      grd.addColorStop(0.35, mid);
      grd.addColorStop(1, outer);
      g.fillStyle = grd;
      g.beginPath();
      g.ellipse(lx, ly, r, r * (0.55 + seeded(i) * 0.5), ang, 0, Math.PI * 2);
      g.fill();
    }
    // Emission filaments (physics-y strands, not rainbow spam)
    g.globalCompositeOperation = "lighter";
    for (let f = 0; f < 6; f++) {
      const ang = seeded(f * 8 + kind.length) * Math.PI * 2;
      const x0 = cx + Math.cos(ang) * size * 0.05;
      const y0 = cy + Math.sin(ang) * size * 0.05;
      const x1 = cx + Math.cos(ang + 0.4) * size * (0.28 + seeded(f) * 0.2);
      const y1 = cy + Math.sin(ang + 0.4) * size * (0.28 + seeded(f * 2) * 0.2);
      const grd = g.createLinearGradient(x0, y0, x1, y1);
      if (kind === "ha") {
        grd.addColorStop(0, "rgba(255,90,110,0.0)");
        grd.addColorStop(0.5, "rgba(255,80,100,0.35)");
        grd.addColorStop(1, "rgba(180,40,60,0)");
      } else if (kind === "oiii") {
        grd.addColorStop(0, "rgba(80,255,220,0)");
        grd.addColorStop(0.5, "rgba(60,220,200,0.32)");
        grd.addColorStop(1, "rgba(20,100,110,0)");
      } else {
        grd.addColorStop(0, "rgba(255,200,160,0)");
        grd.addColorStop(0.5, "rgba(200,160,120,0.22)");
        grd.addColorStop(1, "rgba(80,50,30,0)");
      }
      g.strokeStyle = grd;
      g.lineWidth = size * (0.015 + seeded(f * 3) * 0.02);
      g.beginPath();
      g.moveTo(x0, y0);
      g.quadraticCurveTo(
        (x0 + x1) / 2 + (seeded(f * 5) - 0.5) * size * 0.12,
        (y0 + y1) / 2 + (seeded(f * 6) - 0.5) * size * 0.12,
        x1, y1
      );
      g.stroke();
    }
    g.globalCompositeOperation = "source-over";

    // Dust lane slash (dark absorption)
    if (kind === "dust" || kind === "ha" || kind === "composite") {
      g.globalCompositeOperation = "destination-out";
      g.strokeStyle = "rgba(0,0,0,0.35)";
      g.lineWidth = size * 0.04;
      g.beginPath();
      g.moveTo(size * 0.15, size * 0.42);
      g.quadraticCurveTo(size * 0.5, size * 0.55, size * 0.88, size * 0.38);
      g.stroke();
      g.globalCompositeOperation = "source-over";
    }
    return c;
  }

  function makeZodiacalCanvas(size) {
    size = size || 512;
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const g = c.getContext("2d");
    // Elongated lens — zodiacal light / gegenschein whisper
    const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size * 0.48);
    grd.addColorStop(0, "rgba(255,230,190,0.55)");
    grd.addColorStop(0.35, "rgba(255,200,140,0.18)");
    grd.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grd;
    g.beginPath();
    g.ellipse(size / 2, size / 2, size * 0.48, size * 0.16, 0, 0, Math.PI * 2);
    g.fill();
    return c;
  }

  function makeMWBoostCanvas(size) {
    // Soft additive veil to lift a dark MW texture into beauty mode
    size = size || 256;
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const g = c.getContext("2d");
    const grd = g.createLinearGradient(0, 0, 0, size);
    // Galactic plane brighter mid band
    grd.addColorStop(0, "rgba(20,30,60,0)");
    grd.addColorStop(0.35, "rgba(80,60,100,0.15)");
    grd.addColorStop(0.48, "rgba(255,200,180,0.35)");
    grd.addColorStop(0.52, "rgba(180,200,255,0.28)");
    grd.addColorStop(0.65, "rgba(80,50,70,0.12)");
    grd.addColorStop(1, "rgba(10,15,40,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, size, size);
    return c;
  }

  function toSpriteMat(THREE, canvas, opacity, blending) {
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace || THREE.sRGBEncoding;
    tex.needsUpdate = true;
    return new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
      opacity: opacity != null ? opacity : 0.55,
      blending: blending != null ? blending : THREE.AdditiveBlending,
      toneMapped: false,
    });
  }

  /**
   * @param {object} ctx
   * @param {THREE.Scene} ctx.scene
   * @param {object} ctx.THREE
   * @param {function} ctx.orbitAU
   * @param {THREE.Texture|null} ctx.mwMap
   * @param {boolean} ctx.lowEnd
   * @param {boolean} ctx.reduceMotion
   */
  function build(ctx) {
    const T = ctx.THREE;
    const scene = ctx.scene;
    const orbitAU = ctx.orbitAU;
    const low = !!ctx.lowEnd;
    const group = new T.Group();
    group.name = "vesperDeepSky";

    const skyR = Math.max(orbitAU(95), 72000);

    // --- Milky Way dome (boosted beauty) ---
    let skyDome = null;
    if (ctx.mwMap) {
      const skyGeo = new T.SphereGeometry(skyR, 64, 40);
      const skyMat = new T.MeshBasicMaterial({
        map: ctx.mwMap,
        side: T.BackSide,
        depthWrite: false,
        fog: false,
        color: 0xffe8dc, // warm lift so MW isn't crushed black
        toneMapped: false,
      });
      skyDome = new T.Mesh(skyGeo, skyMat);
      skyDome.name = "milkyWayDome";
      group.add(skyDome);

      // Additive spectral veil (Hα / dust / continuum boost)
      const veil = new T.Mesh(
        new T.SphereGeometry(skyR * 0.995, 48, 32),
        new T.MeshBasicMaterial({
          map: new T.CanvasTexture(makeMWBoostCanvas(256)),
          side: T.BackSide,
          depthWrite: false,
          transparent: true,
          opacity: 0.72,
          blending: T.AdditiveBlending,
          toneMapped: false,
        })
      );
      veil.material.map.colorSpace = T.SRGBColorSpace || T.sRGBEncoding;
      veil.material.map.needsUpdate = true;
      veil.name = "mwBeautyVeil";
      group.add(veil);
    } else {
      // Fallback deep blue void with band if no texture
      const skyGeo = new T.SphereGeometry(skyR, 48, 32);
      skyDome = new T.Mesh(
        skyGeo,
        new T.MeshBasicMaterial({
          color: 0x0a0c1c,
          side: T.BackSide,
          depthWrite: false,
          toneMapped: false,
        })
      );
      group.add(skyDome);
    }

    // --- Integrated starlight / galactic plane glow ---
    const planeGlow = new T.Mesh(
      new T.SphereGeometry(skyR * 0.98, 48, 24, 0, Math.PI * 2, Math.PI * 0.38, Math.PI * 0.24),
      new T.MeshBasicMaterial({
        color: 0xffd8c8,
        side: T.BackSide,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
        blending: T.AdditiveBlending,
        toneMapped: false,
      })
    );
    planeGlow.name = "integratedStarlight";
    group.add(planeGlow);

    // --- Soft dust lanes (ADDITIVE) — NormalBlending opaque ribbons caused
    // the bright/black curved silhouette glitch on phones (far-clip + dark sprites).
    const dustLaneMat = toSpriteMat(T, makeNebulaCanvas("dust", 512), 0.28, T.AdditiveBlending);
    for (let i = 0; i < (low ? 3 : 5); i++) {
      const spr = new T.Sprite(dustLaneMat.clone());
      spr.name = "dustLaneRibbon";
      spr.material.opacity = 0.10 + seeded(i * 11) * 0.10;
      spr.material.toneMapped = false;
      const a = (i / 5) * Math.PI * 2;
      const rr = skyR * 0.88;
      spr.position.set(Math.cos(a) * rr, (seeded(i) - 0.5) * skyR * 0.03, Math.sin(a) * rr);
      const s = skyR * (0.12 + seeded(i * 2) * 0.08);
      spr.scale.set(s, s * 0.08, 1);
      group.add(spr);
    }

    // --- Zodiacal light (ecliptic dust scattering) ---
    const zTex = new T.CanvasTexture(makeZodiacalCanvas(512));
    zTex.colorSpace = T.SRGBColorSpace || T.sRGBEncoding;
    for (let i = 0; i < (low ? 2 : 4); i++) {
      const spr = new T.Sprite(
        new T.SpriteMaterial({
          map: zTex,
          transparent: true,
          depthWrite: false,
          opacity: 0.38 + i * 0.05,
          blending: T.AdditiveBlending,
          toneMapped: false,
          color: 0xffe2c0,
        })
      );
      const a = (i / 4) * Math.PI + 0.2;
      const rr = skyR * 0.55;
      spr.position.set(Math.cos(a) * rr, orbitAU(0.15) * (i % 2 ? 1 : -1), Math.sin(a) * rr);
      const s = skyR * (0.35 + i * 0.05);
      spr.scale.set(s, s * 0.28, 1);
      group.add(spr);
    }

    // --- Emission / dust nebulae (beauty-boosted false color) ---
    const kinds = ["ha", "oiii", "dust", "reflection", "ha", "oiii", "dust", "composite"];
    const nNeb = low ? 6 : reduceSafe(ctx) ? 7 : 20;
    const mats = {};
    kinds.forEach((k) => {
      if (!mats[k]) mats[k] = toSpriteMat(T, makeNebulaCanvas(k, 512), 0.78);
    });
    for (let i = 0; i < nNeb; i++) {
      const kind = kinds[i % kinds.length];
      const spr = new T.Sprite(mats[kind].clone());
      spr.material.opacity = 0.52 + seeded(i * 7) * 0.38;
      // Place on far sky shell, clustered near galactic plane
      const theta = seeded(i * 1.7) * Math.PI * 2;
      const phi = Math.PI * 0.5 + (seeded(i * 3.3) - 0.5) * (0.35 + seeded(i) * 0.5);
      const rr = skyR * (0.72 + seeded(i * 2.1) * 0.2);
      spr.position.set(
        rr * Math.sin(phi) * Math.cos(theta),
        rr * Math.cos(phi) * 0.85,
        rr * Math.sin(phi) * Math.sin(theta)
      );
      const s = skyR * ((low ? 0.07 : 0.1) + seeded(i * 5.1) * (low ? 0.1 : 0.16));
      spr.scale.set(s * (0.9 + seeded(i) * 0.5), s * (0.55 + seeded(i * 2) * 0.5), 1);
      spr.userData.kind = kind;
      group.add(spr);
    }

    // Gegenschein opposite-sun hint (soft patch) — follows camera later via follow()
    const geg = new T.Sprite(toSpriteMat(T, makeZodiacalCanvas(256), 0.22));
    geg.name = "gegenschein";
    geg.scale.set(skyR * 0.12, skyR * 0.12, 1);
    group.add(geg);

    // Bright keystones
    const brights = makeBrightStars(T, skyR, low ? 28 : 56);
    brights.name = "brightKeystones";
    group.add(brights);

    scene.add(group);

    return {
      group,
      skyDome,
      gegenschein: geg,
      skyR,
      setBeauty(amount) {
        // 0..1 wind-down linked or explicit
        const a = Math.max(0.4, Math.min(1, amount));
        group.children.forEach((ch) => {
          if (ch.isSprite && ch.material) {
            const base = ch.userData.kind ? 0.7 : 0.38;
            ch.material.opacity = base * (0.6 + 0.4 * a);
          }
          if (ch.name === "mwBeautyVeil" && ch.material) {
            ch.material.opacity = 0.5 + 0.35 * a;
          }
        });
      },
      follow(camPos, camFar) {
        group.position.copy(camPos);
        // Keep sky shell inside the camera far plane (walk/skim near≈0.03 used to
        // clamp far≪skyR → hard bright/black horizon split on phone).
        let targetR = skyR;
        if (camFar && camFar > 100) {
          // Prefer 0.88*far so nebula sprites never clip into a hard black limb.
          targetR = Math.min(skyR, Math.max(1200, camFar * 0.88));
        }
        const scale = targetR / skyR;
        if (Math.abs((group.userData._skyScale || 1) - scale) > 0.008) {
          group.userData._skyScale = scale;
          group.scale.setScalar(scale);
        }
        // Soft fill sphere — kills residual bright/black curved void on phones
        let fill = group.userData._skyFill;
        if (!fill) {
          fill = new T.Mesh(
            new T.SphereGeometry(1, 24, 16),
            new T.MeshBasicMaterial({
              color: 0x0a1020,
              side: T.BackSide,
              depthWrite: false,
              transparent: true,
              opacity: 0.55,
              toneMapped: false,
            })
          );
          fill.name = "skyFillShell";
          fill.scale.setScalar(skyR * 0.995);
          group.add(fill);
          group.userData._skyFill = fill;
        }
        if (geg && camPos) {
          const len = Math.sqrt(camPos.x * camPos.x + camPos.y * camPos.y + camPos.z * camPos.z) || 1;
          const rr = skyR * 0.78;
          geg.position.set((-camPos.x / len) * rr, (-camPos.y / len) * rr * 0.15, (-camPos.z / len) * rr);
        }
      },
      getSkyR() { return skyR * (group.userData._skyScale || 1); },
    };
  }

  function reduceSafe(ctx) {
    return !!ctx.reduceMotion;
  }

  /** Richer starfield — galactic plane bias + stellar color temps */
  function makeStarField(THREE, count, skyR) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
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
      // Approximate stellar locus: hot blue-white → cool orange
      const temp = Math.random();
      const bright = 0.5 + Math.random() * 0.5;
      let R, G, B;
      if (temp < 0.2) {
        R = 0.65; G = 0.78; B = 1.0; // hot
      } else if (temp < 0.55) {
        R = 0.95; G = 0.95; B = 1.0; // white
      } else if (temp < 0.85) {
        R = 1.0; G = 0.88; B = 0.7; // warm
      } else {
        R = 1.0; G = 0.7; B = 0.45; // cool K/M
      }
      col[i * 3] = R * bright;
      col[i * 3 + 1] = G * bright;
      col[i * 3 + 2] = B * bright;
      sizes[i] = 1.2 + Math.random() * 2.4;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({
      // World-unit size at skyR (~1.5e6) is subpixel, so the cruise sky
      // read as pitch black with only orbit lines. Pixels, not meters.
      size: 1.65,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      sizeAttenuation: false,
      fog: false,
      toneMapped: false,
      blending: THREE.AdditiveBlending,
    });
    return new THREE.Points(geo, mat);
  }


  /** A handful of bright naked-eye-ish keystones (Sirius-class) — large additive points */
  function makeBrightStars(THREE, skyR, n) {
    n = n || 48;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = skyR * (0.7 + seeded(i * 9.1) * 0.25);
      const theta = seeded(i * 2.7) * Math.PI * 2;
      const phi = Math.acos(2 * seeded(i * 4.3) - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.cos(phi);
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      const hot = seeded(i * 1.3) < 0.35;
      col[i * 3] = hot ? 0.75 : 1.0;
      col[i * 3 + 1] = hot ? 0.88 : 0.92;
      col[i * 3 + 2] = hot ? 1.0 : 0.75;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        size: 2.8,
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

  window.VesperDeepSky = { build, makeStarField, makeBrightStars, makeNebulaCanvas };
})();
