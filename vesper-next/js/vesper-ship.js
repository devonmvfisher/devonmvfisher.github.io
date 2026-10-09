/**
 * VesperShip — embodied player craft (Halo/ME/Trek *feel*, IP-free original mesh).
 * Modes: fly (chase/cockpit) → soft-land parks ship → EVA walk near ship → reboard on takeoff.
 * No blob arms; readable silhouette with nacelles + canopy.
 */
(function () {
  "use strict";

  let THREE, scene, root, thrusterGlow, canopy, hatchLight, flareMesh;
  let chaseFwd = null;
  const pulse = {
    wingtips: [], shimmers: [], deflectors: [], lips: [], plumes: [],
    tiles: [], runs: [], beacons: [], navs: [],
  };
  let parked = false;
  let parkPos = null;
  let parkQuat = null;
  let camBtn = null;
  let boardHint = null;
  const _fwd = { x: 0, y: 0, z: 0 };
  const _tmp = null;



  function makeHullCanvasPack() {
    const coarse = !!(typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches);
    const W = coarse ? 512 : 1024;
    const H = coarse ? 256 : 512;
    function paintAlbedo(g, w, h) {
      const base = g.createLinearGradient(0, 0, 0, h);
      base.addColorStop(0, "#c0cad4");
      base.addColorStop(0.4, "#8a96a4");
      base.addColorStop(1, "#5c6a78");
      g.fillStyle = base;
      g.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 2) {
        g.fillStyle = "rgba(0,0,0," + (0.06 + (y % 4 === 0 ? 0.08 : 0)) + ")";
        g.fillRect(0, y, w, 1);
      }
      // Soft panel AO bands (plated craft — not sticker-grid)
      g.strokeStyle = "rgba(12,18,28,0.28)";
      g.lineWidth = Math.max(2, w / 220);
      const step = w / 6;
      for (let i = 0; i < 6; i++) {
        g.beginPath();
        g.moveTo(i * step + step * 0.08, 0);
        g.lineTo(i * step, h);
        g.stroke();
      }
      for (let y = 0; y < h; y += Math.floor(h / 3)) {
        g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke();
      }
      // Sharper panel AO lines (phone-readable plated craft)
      g.strokeStyle = "rgba(8,12,20,0.38)";
      g.lineWidth = Math.max(1.5, w / 260);
      for (let i = 0; i < 5; i++) {
        const x = (0.12 + i * 0.16) * w;
        g.beginPath(); g.moveTo(x, h * 0.05); g.lineTo(x - w * 0.02, h * 0.95); g.stroke();
      }
      g.strokeStyle = "rgba(0,0,0,0.32)";
      g.lineWidth = Math.max(1, w / 320);
      for (let y = 0; y < h; y += Math.floor(h / 5)) {
        g.beginPath(); g.moveTo(w * 0.05, y + 2); g.lineTo(w * 0.95, y); g.stroke();
      }
      // Panel corner AO blotches (reads on coarse 512)
      for (let i = 0; i < (coarse ? 8 : 14); i++) {
        const px = ((i % 4) + 0.3) * (w / 4);
        const py = (Math.floor(i / 4) + 0.35) * (h / 3);
        const rad = g.createRadialGradient(px, py, 0, px, py, Math.max(8, w / 28));
        rad.addColorStop(0, "rgba(0,0,0,0.22)");
        rad.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = rad;
        g.fillRect(px - w / 20, py - h / 12, w / 10, h / 6);
      }
      // Subtle wear streaks (chase-readable, thrifty)
      for (let i = 0; i < (coarse ? 6 : 12); i++) {
        const sx = (0.15 + (i % 6) * 0.12) * w;
        const sy = (0.18 + Math.floor(i / 6) * 0.4) * h;
        g.strokeStyle = "rgba(30,40,50," + (0.18 + (i % 3) * 0.06) + ")";
        g.lineWidth = 1 + (i % 2);
        g.beginPath();
        g.moveTo(sx, sy);
        g.lineTo(sx + w * 0.08, sy + h * 0.12);
        g.stroke();
      }
      for (let i = 0; i < (coarse ? 40 : 80); i++) {
        const x = (0.04 + (i % 16) * 0.058) * w;
        const y = (0.08 + Math.floor(i / 16) * 0.18) * h;
        g.fillStyle = "rgba(210,220,230,0.6)";
        g.beginPath(); g.arc(x, y, Math.max(2, w / 280), 0, Math.PI * 2); g.fill();
      }
      const heat = g.createLinearGradient(0, 0, w * 0.28, 0);
      heat.addColorStop(0, "rgba(255,100,30,0.55)");
      heat.addColorStop(0.55, "rgba(200,70,20,0.28)");
      heat.addColorStop(1, "rgba(255,110,35,0)");
      g.fillStyle = heat;
      g.fillRect(0, h * 0.32, w * 0.28, h * 0.34);
      // Heat-tile checker + variation (readable on coarse 512)
      const tw = Math.max(6, w / 32), th = Math.max(5, h / 14);
      for (let tx = 0; tx < w * 0.26; tx += tw) {
        for (let ty = h * 0.34; ty < h * 0.64; ty += th) {
          if (((tx / tw) | 0) % 2 === ((ty / th) | 0) % 2) {
            const v = 0.28 + ((((tx / tw) | 0) * 3 + ((ty / th) | 0) * 7) % 5) * 0.04;
            g.fillStyle = "rgba(60,32,18," + v + ")";
            g.fillRect(tx, ty, tw - 1, th - 1);
          } else if ((((tx / tw) | 0) + ((ty / th) | 0)) % 5 === 0) {
            g.fillStyle = "rgba(90,48,24,0.22)";
            g.fillRect(tx + 1, ty + 1, tw - 2, th - 2);
          }
        }
      }
      g.fillStyle = "rgba(130,210,255,0.7)";
      g.font = "bold " + Math.round(w * 0.035) + "px system-ui,sans-serif";
      g.fillText("VESPER · HOPE", w * 0.31, h * 0.53);
      g.font = Math.round(w * 0.018) + "px system-ui,sans-serif";
      g.fillStyle = "rgba(190,210,230,0.5)";
      g.fillText("IP-FREE · 2026 PHONE DEMO", w * 0.29, h * 0.6);
      g.fillStyle = "rgba(255,170,70,0.4)";
      g.fillRect(w * 0.04, h * 0.08, w * 0.12, h * 0.12);
      for (let i = 0; i < (coarse ? 20 : 40); i++) {
        g.strokeStyle = "rgba(16,24,32," + (0.1 + (i % 5) * 0.02) + ")";
        g.lineWidth = 1 + (i % 3);
        g.beginPath();
        g.moveTo(w * 0.02 + i * (w / 40), 0);
        g.lineTo(i * (w / 40) - w * 0.04, h);
        g.stroke();
      }
      const ao = g.createLinearGradient(0, h * 0.78, 0, h);
      ao.addColorStop(0, "rgba(0,0,0,0)");
      ao.addColorStop(1, "rgba(0,0,0,0.4)");
      g.fillStyle = ao;
      g.fillRect(0, h * 0.78, w, h * 0.22);
      g.fillStyle = "rgba(70,200,255,0.45)";
      g.fillRect(w * 0.84, h * 0.08, w * 0.1, h * 0.06);
    }
    function paintRoughMetal(g, w, h, metalish) {
      g.fillStyle = metalish ? "#d0d4d8" : "#6a7078";
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < (coarse ? 60 : 120); i++) {
        const x = Math.random() * w, y = Math.random() * h;
        g.fillStyle = metalish
          ? "rgba(255,255,255," + (0.05 + Math.random() * 0.1) + ")"
          : "rgba(0,0,0," + (0.05 + Math.random() * 0.12) + ")";
        g.fillRect(x, y, 2 + Math.random() * 6, 1 + Math.random() * 3);
      }
      g.strokeStyle = metalish ? "rgba(40,40,40,0.35)" : "rgba(220,220,220,0.35)";
      g.lineWidth = 2;
      const step = w / 16;
      for (let i = 0; i < 16; i++) {
        g.beginPath(); g.moveTo(i * step, 0); g.lineTo(i * step, h); g.stroke();
      }
      if (!metalish) {
        g.fillStyle = "rgba(230,230,230,0.55)";
        g.fillRect(0, h * 0.35, w * 0.22, h * 0.28);
      } else {
        g.fillStyle = "rgba(30,30,30,0.45)";
        g.fillRect(0, h * 0.35, w * 0.22, h * 0.28);
      }
    }
    const cA = document.createElement("canvas"); cA.width = W; cA.height = H;
    paintAlbedo(cA.getContext("2d"), W, H);
    const cR = document.createElement("canvas"); cR.width = W; cR.height = H;
    paintRoughMetal(cR.getContext("2d"), W, H, false);
    const cM = document.createElement("canvas"); cM.width = W; cM.height = H;
    paintRoughMetal(cM.getContext("2d"), W, H, true);
    function toTex(c, srgb) {
      const tex = new THREE.CanvasTexture(c);
      if (srgb) tex.colorSpace = THREE.SRGBColorSpace || THREE.sRGBEncoding;
      tex.anisotropy = Math.min(coarse ? 4 : 8, 8);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      return tex;
    }
    const cAO = document.createElement("canvas"); cAO.width = W; cAO.height = H;
    const gAO = cAO.getContext("2d");
    gAO.fillStyle = "#ffffff"; gAO.fillRect(0, 0, W, H);
    // Soft panel-edge AO (fewer lines — plated, not sticker)
    gAO.strokeStyle = "rgba(0,0,0,0.42)";
    gAO.lineWidth = Math.max(3, W / 140);
    const step = W / 8;
    for (let i = 0; i < 8; i++) {
      gAO.beginPath(); gAO.moveTo(i * step, 0); gAO.lineTo(i * step, H); gAO.stroke();
    }
    for (let y = 0; y < H; y += Math.floor(H / 4)) {
      gAO.beginPath(); gAO.moveTo(0, y); gAO.lineTo(W, y); gAO.stroke();
    }
    for (let i = 0; i < (coarse ? 6 : 10); i++) {
      const px = ((i % 4) + 0.4) * (W / 4), py = (Math.floor(i / 4) + 0.4) * (H / 3);
      const rad = gAO.createRadialGradient(px, py, 0, px, py, Math.max(10, W / 22));
      rad.addColorStop(0, "rgba(0,0,0,0.35)");
      rad.addColorStop(1, "rgba(0,0,0,0)");
      gAO.fillStyle = rad;
      gAO.fillRect(px - W / 16, py - H / 10, W / 8, H / 5);
    }
    const aoGrad = gAO.createLinearGradient(0, H * 0.75, 0, H);
    aoGrad.addColorStop(0, "rgba(255,255,255,0)");
    aoGrad.addColorStop(1, "rgba(0,0,0,0.65)");
    gAO.fillStyle = aoGrad;
    gAO.fillRect(0, H * 0.75, W, H * 0.25);
    // Normal bake is desktop-only — the phone fuselage does not use it, and the loop is a boot hitch.
    let normalMap = null;
    if (!coarse) {
      const nW = 256, nH = 128;
      const cN = document.createElement("canvas");
      cN.width = nW; cN.height = nH;
      const gN = cN.getContext("2d", { willReadFrequently: true });
      gN.drawImage(cA, 0, 0, nW, nH);
      const src = gN.getImageData(0, 0, nW, nH);
      const dst = gN.createImageData(nW, nH);
      const lumAt = (x, y) => {
        const xx = (x + nW) % nW, yy = (y + nH) % nH;
        const i = (yy * nW + xx) * 4;
        return src.data[i] * 0.3 + src.data[i + 1] * 0.5 + src.data[i + 2] * 0.2;
      };
      const strength = 2.1;
      for (let y = 0; y < nH; y++) {
        for (let x = 0; x < nW; x++) {
          const dx = (lumAt(x + 1, y) - lumAt(x - 1, y)) / 255;
          const dy = (lumAt(x, y + 1) - lumAt(x, y - 1)) / 255;
          let nx = -dx * strength, ny = -dy * strength, nz = 1;
          const len = Math.hypot(nx, ny, nz) || 1;
          nx /= len; ny /= len; nz /= len;
          const o = (y * nW + x) * 4;
          dst.data[o] = (nx * 0.5 + 0.5) * 255;
          dst.data[o + 1] = (ny * 0.5 + 0.5) * 255;
          dst.data[o + 2] = (nz * 0.5 + 0.5) * 255;
          dst.data[o + 3] = 255;
        }
      }
      gN.putImageData(dst, 0, 0);
      normalMap = toTex(cN, false);
    }
    return {
      map: toTex(cA, true),
      roughnessMap: toTex(cR, false),
      metalnessMap: toTex(cM, false),
      aoMap: toTex(cAO, false),
      normalMap: normalMap,
    };
  }

  function makeHullCanvas() {
    return makeHullCanvasPack().map;
  }

  function mat(color, opts) {
    opts = opts || {};
    const m = window.VesperMat({
      color: color,
      metalness: opts.metal != null ? opts.metal : 0.68,
      roughness: opts.rough != null ? opts.rough : 0.28,
      emissive: opts.emissive || 0x000000,
      emissiveIntensity: opts.ei || 0,
      flatShading: !!opts.flat,
    });
    if (m.envMapIntensity != null) m.envMapIntensity = opts.env != null ? opts.env : 1.25;
    return m;
  }

  function buildMesh() {
    const g = new THREE.Group();
    g.name = "vesperPlayerShip";
    const hullPack = makeHullCanvasPack();
    const hullMat = window.VesperMat({
      map: hullPack.map,
      roughnessMap: hullPack.roughnessMap,
      metalnessMap: hullPack.metalnessMap,
      aoMap: hullPack.aoMap,
      aoMapIntensity: 0.85,
      normalMap: hullPack.normalMap,
      color: 0xffffff,
      metalness: 0.94,
      roughness: 0.28,
      emissive: 0x081018,
      emissiveIntensity: 0.12,
    });
    if (hullMat.envMapIntensity != null) hullMat.envMapIntensity = 1.45;
    if (hullMat.normalScale && hullMat.normalScale.set) hullMat.normalScale.set(0.45, 0.45);
    function stampUv2(geo) {
      if (geo && geo.attributes && geo.attributes.uv && !geo.attributes.uv2) {
        geo.setAttribute("uv2", geo.attributes.uv);
      }
      return geo;
    }
    const darkMat = mat(0x3a4555, { metal: 0.88, rough: 0.2, emissive: 0x101820, ei: 0.14, env: 1.2 });
    const accentMat = mat(0x70c8ff, { metal: 0.35, rough: 0.18, emissive: 0x2060a0, ei: 0.45 });

    // === Continuous fuselage (lathe — replaces the box mass, not another plate) ===
    const coarseHull = !!(typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches);
    const fusePts = [
      new THREE.Vector2(0.045, -1.02),
      new THREE.Vector2(0.13, -0.84),
      new THREE.Vector2(0.23, -0.48),
      new THREE.Vector2(0.30, -0.08),
      new THREE.Vector2(0.295, 0.38),
      new THREE.Vector2(0.24, 0.78),
      new THREE.Vector2(0.155, 1.08),
      new THREE.Vector2(0.08, 1.28),
      new THREE.Vector2(0.025, 1.42),
    ];
    const fuseGeo = stampUv2(new THREE.LatheGeometry(fusePts, coarseHull ? 16 : 24));
    fuseGeo.rotateZ(-Math.PI / 2); // lathe +Y → ship +X (nose forward)
    // Calm skin for the round body — the plate-line canvas reads as a wire cage when it wraps a lathe.
    const calm = document.createElement("canvas");
    calm.width = coarseHull ? 512 : 1024;
    calm.height = coarseHull ? 256 : 512;
    const cg = calm.getContext("2d");
    const cw = calm.width, ch = calm.height;
    const base = cg.createLinearGradient(0, 0, 0, ch);
    base.addColorStop(0, "#b7c3cf");
    base.addColorStop(0.45, "#8d9aaa");
    base.addColorStop(1, "#5e6c7a");
    cg.fillStyle = base;
    cg.fillRect(0, 0, cw, ch);
    // A few broad panel breaks along length (v), not a meridian cage
    cg.strokeStyle = "rgba(10,16,24,0.35)";
    cg.lineWidth = Math.max(2, cw / 180);
    for (const t of [0.18, 0.41, 0.67, 0.86]) {
      cg.beginPath();
      cg.moveTo(0, ch * t);
      cg.lineTo(cw, ch * t);
      cg.stroke();
    }
    const heat = cg.createLinearGradient(0, 0, 0, ch * 0.22);
    heat.addColorStop(0, "rgba(255,110,40,0.55)");
    heat.addColorStop(1, "rgba(255,110,40,0)");
    cg.fillStyle = heat;
    cg.fillRect(0, 0, cw, ch * 0.22);
    cg.fillStyle = "rgba(190,210,225,0.85)";
    cg.font = "bold " + Math.round(cw * 0.045) + "px system-ui,sans-serif";
    cg.fillText("VESPER", cw * 0.38, ch * 0.48);
    const calmTex = new THREE.CanvasTexture(calm);
    if (THREE.SRGBColorSpace) calmTex.colorSpace = THREE.SRGBColorSpace;
    calmTex.anisotropy = Math.min(8, coarseHull ? 4 : 8);
    calmTex.wrapS = calmTex.wrapT = THREE.ClampToEdgeWrapping;
    const fuseMat = hullMat.clone();
    fuseMat.map = calmTex;
    fuseMat.normalMap = null;
    fuseMat.aoMap = null;
    fuseMat.roughness = 0.34;
    fuseMat.metalness = 0.82;
    const fuselage = new THREE.Mesh(fuseGeo, fuseMat);
    fuselage.name = "fuselageLathe";
    g.add(fuselage);
    {
      const keelGeo = new THREE.CylinderGeometry(0.05, 0.06, 1.35, coarseHull ? 6 : 8);
      keelGeo.rotateZ(Math.PI / 2);
      const keel = new THREE.Mesh(
        keelGeo,
        mat(0x1a222c, { metal: 0.72, rough: 0.38, emissive: 0x102028, ei: 0.1 })
      );
      keel.name = "bellyKeel";
      keel.position.set(0.1, -0.32, 0);
      keel.scale.set(1, 0.9, 1.4);
      g.add(keel);
    }
    for (let ri = 0; ri < 5; ri++) {
      const riv = new THREE.Mesh(
        new THREE.SphereGeometry(0.018, 5, 4),
        mat(0x8090a0, { metal: 0.8, rough: 0.3 })
      );
      riv.name = "bellyRivet";
      riv.position.set(-0.4 + ri * 0.22, -0.34, 0.08);
      g.add(riv);
    }
    // Belly keel rail (underside continuity — chase read)
    {
      const railGeo = new THREE.CylinderGeometry(0.015, 0.015, 1.15, 5);
      railGeo.rotateZ(Math.PI / 2);
      const keelRail = new THREE.Mesh(
        railGeo,
        mat(0x70c8ff, { metal: 0.35, rough: 0.25, emissive: 0x2060a0, ei: 0.35 })
      );
      keelRail.name = "bellyKeelRail";
      keelRail.position.set(0.1, -0.36, 0);
      g.add(keelRail);
    }
    for (const side of [-1, 1]) {
      const ksGeo = new THREE.CylinderGeometry(0.012, 0.014, 1.0, 5);
      ksGeo.rotateZ(Math.PI / 2);
      const keelStrake = new THREE.Mesh(
        ksGeo,
        mat(0x2a3540, { metal: 0.72, rough: 0.35, emissive: 0x101820, ei: 0.1 })
      );
      keelStrake.name = "bellyKeelStrake";
      keelStrake.position.set(0.1, -0.34, side * 0.1);
      g.add(keelStrake);
    }
    // Nose cap sits on the lathe taper (cone only — box wedge removed)
    const noseTip = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.28, coarseHull ? 8 : 10), mat(0xa8b4c0, { metal: 0.65, rough: 0.28 }));
    noseTip.rotation.z = -Math.PI / 2;
    noseTip.position.set(1.52, 0.02, 0);
    g.add(noseTip);
    const heatShield = new THREE.Mesh(
      new THREE.TorusGeometry(0.11, 0.028, 8, 16),
      mat(0x3a2a22, { metal: 0.12, rough: 0.75, emissive: 0x201810, ei: 0.14 })
    );
    heatShield.name = "heatShieldNose";
    heatShield.position.set(1.22, 0.02, 0);
    heatShield.rotation.y = Math.PI / 2;
    g.add(heatShield);
    {
      const chinGeo = new THREE.CylinderGeometry(0.14, 0.18, 0.35, coarseHull ? 8 : 10);
      chinGeo.rotateZ(Math.PI / 2);
      const noseChin = new THREE.Mesh(
        chinGeo,
        mat(0x2a323c, { metal: 0.75, rough: 0.35, env: 1.05 })
      );
      noseChin.name = "noseChin";
      noseChin.position.set(1.05, -0.12, 0);
      noseChin.scale.set(1, 0.7, 1.3);
      g.add(noseChin);
      const grillGeo = new THREE.CylinderGeometry(0.08, 0.11, 0.12, coarseHull ? 6 : 8);
      grillGeo.rotateZ(Math.PI / 2);
      const chinGrille = new THREE.Mesh(
        grillGeo,
        mat(0x102030, { metal: 0.5, rough: 0.45, emissive: 0x2060a0, ei: 0.35 })
      );
      chinGrille.name = "chinGrille";
      chinGrille.position.set(1.18, -0.14, 0);
      g.add(chinGrille);
    }
    {
      const sensGeo = new THREE.CylinderGeometry(0.025, 0.03, 0.16, 6);
      sensGeo.rotateZ(Math.PI / 2);
      const noseSensor = new THREE.Mesh(
        sensGeo,
        mat(0x102030, { metal: 0.4, rough: 0.35, emissive: 0x40ffc0, ei: 0.45 })
      );
      noseSensor.name = "noseSensorSlit";
      noseSensor.position.set(1.28, 0.08, 0);
      g.add(noseSensor);
    }
    // Chin→belly continuous fairing — tapered cylinder (not plate gap)
    {
      const chinGeo = new THREE.CylinderGeometry(0.14, 0.2, 0.5, coarseHull ? 8 : 10);
      chinGeo.rotateZ(Math.PI / 2);
      const chinBelly = new THREE.Mesh(
        chinGeo,
        mat(0x2a323c, { metal: 0.78, rough: 0.32, env: 1.08 })
      );
      chinBelly.name = "chinBellyFairing";
      chinBelly.position.set(0.72, -0.18, 0);
      chinBelly.scale.set(1, 0.75, 1.35);
      g.add(chinBelly);
      const lipGeo = new THREE.CylinderGeometry(0.1, 0.14, 0.2, coarseHull ? 6 : 8);
      lipGeo.rotateZ(Math.PI / 2);
      const chinBellyLip = new THREE.Mesh(
        lipGeo,
        mat(0x1a222c, { metal: 0.7, rough: 0.38, emissive: 0x102028, ei: 0.1 })
      );
      chinBellyLip.name = "chinBellyLip";
      chinBellyLip.position.set(0.5, -0.24, 0);
      chinBellyLip.scale.set(1, 0.7, 1.25);
      g.add(chinBellyLip);
    }
    const pitot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.01, 0.35, 5),
      mat(0xc0c8d0, { metal: 0.85, rough: 0.22 })
    );
    pitot.name = "pitotBoom";
    pitot.rotation.z = -Math.PI / 2;
    pitot.position.set(1.45, 0.12, 0.08);
    g.add(pitot);
    // Flush side armor — curved shells hugging lathe (not sticker plates)
    for (const side of [-1, 1]) {
      const armorGeo = new THREE.CylinderGeometry(
        0.31, 0.30, 0.42, coarseHull ? 8 : 10, 1, true,
        side > 0 ? -0.55 : Math.PI - 0.2, 0.9
      );
      armorGeo.rotateZ(Math.PI / 2);
      const sideArmor = new THREE.Mesh(
        armorGeo,
        mat(0x2a3540, { metal: 0.82, rough: 0.32, emissive: 0x101820, ei: 0.1, env: 1.15 })
      );
      sideArmor.name = "sideArmorFairing";
      sideArmor.position.set(0.15, 0.02, side * 0.02);
      g.add(sideArmor);
      {
        const seamGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.5, 5);
        seamGeo.rotateZ(Math.PI / 2);
        const seam = new THREE.Mesh(
          seamGeo,
          mat(0x1a222c, { metal: 0.55, rough: 0.45, emissive: 0x102030, ei: 0.1 })
        );
        seam.name = "sideArmorSeam";
        seam.position.set(0.1, 0.06, side * 0.28);
        g.add(seam);
      }
      {
        const panelGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.45, 5);
        panelGeo.rotateZ(Math.PI / 2);
        const panelSeam = new THREE.Mesh(
          panelGeo,
          mat(0x101820, { metal: 0.4, rough: 0.55, emissive: 0x081018, ei: 0.08 })
        );
        panelSeam.name = "hullPanelCraftSeam";
        panelSeam.position.set(0.05, -0.02, side * 0.27);
        g.add(panelSeam);
      }
    }
    // Nose↔side continuous cheek fillet (silhouette blend — reduces plate-stack read)
    for (const side of [-1, 1]) {
      const cheekFillet = new THREE.Mesh(
        new THREE.SphereGeometry(0.07, 8, 6),
        hullMat
      );
      cheekFillet.name = "noseCheekFillet";
      // Was a 0.35 box sitting outside the nose radius (~0.19 here).
      cheekFillet.scale.set(1.8, 0.7, 1.1);
      cheekFillet.position.set(0.92, 0.02, side * 0.16);
      g.add(cheekFillet);
    }

    // === Cockpit — framed canopy (not lone sphere) ===
    // Shoulder ring under canopy (cylinder — less plate-box under bubble)
    const cockFrameGeo = new THREE.CylinderGeometry(0.2, 0.22, 0.1, coarseHull ? 10 : 12);
    const cockFrame = new THREE.Mesh(cockFrameGeo, darkMat);
    cockFrame.name = "cockpitFrameRing";
    cockFrame.position.set(0.38, 0.28, 0);
    cockFrame.scale.set(1.05, 0.85, 0.95);
    g.add(cockFrame);
    // Nose→canopy blend collar (continuous silhouette — kills chin gap)
    {
      const blendGeo = new THREE.CylinderGeometry(0.14, 0.19, 0.22, coarseHull ? 8 : 10);
      blendGeo.rotateZ(Math.PI / 2);
      const blend = new THREE.Mesh(blendGeo, hullMat);
      blend.name = "noseCanopyBlend";
      blend.position.set(0.62, 0.18, 0);
      blend.scale.set(1, 0.85, 1.15);
      g.add(blend);
    }
    // Cockpit tub recess — cylindrical well under canopy
    {
      const cockTub = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.2, 0.14, coarseHull ? 8 : 10),
        mat(0x152028, { metal: 0.45, rough: 0.4, emissive: 0x102030, ei: 0.18 })
      );
      cockTub.name = "cockpitTub";
      cockTub.position.set(0.4, 0.18, 0);
      cockTub.scale.set(1.05, 1, 1.15);
      g.add(cockTub);
      const tubLip = new THREE.Mesh(
        new THREE.TorusGeometry(0.2, 0.02, 6, coarseHull ? 10 : 12),
        mat(0x3a4858, { metal: 0.7, rough: 0.3, emissive: 0x152028, ei: 0.1 })
      );
      tubLip.name = "cockpitTubLip";
      tubLip.rotation.x = Math.PI / 2;
      tubLip.position.set(0.4, 0.26, 0);
      g.add(tubLip);
    }
    // Brow slab removed — it read as a black bar across the bubble. Seam ring + pillars frame it.
    // Side canopy pillars (frame depth, not lone bubble)
    for (const side of [-1, 1]) {
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.028, 0.08, 6),
        mat(0x3a4858, { metal: 0.7, rough: 0.3, emissive: 0x152028, ei: 0.12 })
      );
      pillar.name = "canopyPillar";
      // Short rim posts. The 0.28 mullions read as a bar through the bubble.
      pillar.position.set(0.5, 0.30, side * 0.22);
      g.add(pillar);
    }
    const canopyMat = mat(0x88e0ff, { metal: 0.18, rough: 0.04, emissive: 0x40a0d0, ei: 0.7, env: 1.55 });
    if (canopyMat.clearcoat != null) {
      canopyMat.clearcoat = 0.65;
      canopyMat.clearcoatRoughness = 0.12;
    }
    canopy = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58),
      canopyMat
    );
    canopy.position.set(0.38, 0.36, 0);
    canopy.rotation.z = -0.25;
    g.add(canopy);
    // Outer canopy shell (thickness + cooler tint — phone-readable depth)
    const canopyOuter = new THREE.Mesh(
      new THREE.SphereGeometry(0.235, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.56),
      mat(0x60c8e8, { metal: 0.12, rough: 0.08, emissive: 0x2878a8, ei: 0.35, env: 1.4 })
    );
    canopyOuter.name = "canopyOuterShell";
    canopyOuter.position.set(0.38, 0.36, 0);
    canopyOuter.rotation.z = -0.25;
    canopyOuter.material.transparent = true;
    canopyOuter.material.opacity = 0.42;
    canopyOuter.material.depthWrite = false;
    g.add(canopyOuter);
    // Inner glass pane (cockpit depth — chase-readable layered glass, not flat bubble)
    const canopyInner = new THREE.Mesh(
      new THREE.SphereGeometry(0.195, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.52),
      mat(0xa8f0ff, { metal: 0.08, rough: 0.03, emissive: 0x60c0e0, ei: 0.55, env: 1.6 })
    );
    canopyInner.name = "canopyInnerGlass";
    canopyInner.position.set(0.4, 0.34, 0);
    canopyInner.rotation.z = -0.22;
    canopyInner.material.transparent = true;
    canopyInner.material.opacity = 0.55;
    canopyInner.material.depthWrite = false;
    g.add(canopyInner);
    // Canopy base seam ring (craft join — not plate stack)
    const canopySeam = new THREE.Mesh(
      new THREE.TorusGeometry(0.21, 0.018, 6, 16),
      mat(0x3a4858, { metal: 0.78, rough: 0.28, emissive: 0x152028, ei: 0.15 })
    );
    canopySeam.name = "canopySeamRing";
    canopySeam.position.set(0.38, 0.28, 0);
    canopySeam.rotation.x = Math.PI / 2;
    canopySeam.scale.set(1.15, 0.85, 1);
    g.add(canopySeam);
        // Hull→canopy shoulder — sphere blend (not a plate box under bubble)
    {
      const cockShoulder = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, coarseHull ? 8 : 10, 6),
        hullMat
      );
      cockShoulder.name = "cockpitShoulderFairing";
      cockShoulder.position.set(0.28, 0.22, 0);
      cockShoulder.scale.set(1.5, 0.55, 1.25);
      g.add(cockShoulder);
    }
    // Canopy frame ribs + aft collar
    for (const z of [0]) {
      const ribGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.22, 4);
      ribGeo.rotateZ(Math.PI / 2);
      const rib = new THREE.Mesh(ribGeo, accentMat);
      rib.name = "canopyCrownRib";
      rib.position.set(0.38, 0.56, z);
      g.add(rib);
    }
    {
      const collarGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.14, coarseHull ? 8 : 10);
      collarGeo.rotateZ(Math.PI / 2);
      const aftCollar = new THREE.Mesh(
        collarGeo,
        mat(0x2a3540, { metal: 0.75, rough: 0.3, emissive: 0x101820, ei: 0.1 })
      );
      aftCollar.name = "aftCollar";
      // Neck behind the bubble. The old 0.22-tall slab sat inside the glass.
      aftCollar.position.set(0.06, 0.28, 0);
      aftCollar.scale.set(1, 0.75, 1.35);
      g.add(aftCollar);
    }
    {
      const dashGeo = new THREE.CylinderGeometry(0.14, 0.16, 0.08, coarseHull ? 8 : 10);
      const dash = new THREE.Mesh(
        dashGeo,
        mat(0x152030, { metal: 0.4, rough: 0.35, emissive: 0x3080c0, ei: 0.55 })
      );
      dash.name = "cockpitDash";
      dash.position.set(0.48, 0.22, 0);
      dash.scale.set(1.1, 1, 1.35);
      g.add(dash);
    }

    // Antenna mast
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.42, 6), mat(0xc0c8d0, { metal: 0.85, rough: 0.25 }));
    mast.position.set(-0.15, 0.45, 0.08);
    g.add(mast);

    // === Twin engine nacelles — continuous pylons + cylindrical armor (not plate boxes) ===
    for (const side of [-1, 1]) {
      // Tapered pylon cylinder blends hull→nacelle (chase continuity)
      const pylonGeo = new THREE.CylinderGeometry(0.09, 0.12, 0.62, coarseHull ? 8 : 10);
      pylonGeo.rotateZ(Math.PI / 2);
      const pylon = new THREE.Mesh(pylonGeo, darkMat);
      pylon.name = "nacellePylon";
      pylon.position.set(-0.08, -0.02, side * 0.38);
      pylon.scale.set(1, 1.15, 1.35);
      g.add(pylon);
      const pylonFairGeo = new THREE.CylinderGeometry(0.07, 0.1, 0.4, coarseHull ? 8 : 10);
      pylonFairGeo.rotateZ(Math.PI / 2);
      const pylonFair = new THREE.Mesh(pylonFairGeo, hullMat.clone());
      pylonFair.name = "nacellePylonFairing";
      pylonFair.position.set(0.12, 0.0, side * 0.34);
      pylonFair.scale.set(1, 1.1, 1.25);
      g.add(pylonFair);
      // Hull→pylon root sleeve (fills the gap that read as floating nacelle)
      const rootSleeve = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, coarseHull ? 8 : 10, 6),
        hullMat
      );
      rootSleeve.name = "nacelleRootSleeve";
      rootSleeve.scale.set(1.9, 0.85, 1.25);
      rootSleeve.position.set(0.0, -0.01, side * 0.3);
      g.add(rootSleeve);
      const nacGeo = stampUv2(new THREE.CylinderGeometry(0.125, 0.115, 0.86, coarseHull ? 10 : 14));
      nacGeo.rotateZ(Math.PI / 2);
      const nacMat = fuseMat.clone();
      nacMat.roughness = 0.38;
      const nac = new THREE.Mesh(nacGeo, nacMat);
      nac.name = "nacelleBody";
      nac.position.set(-0.18, -0.04, side * 0.52);
      g.add(nac);
      // Cylindrical armor shell hugs nacelle (was a floating plate box)
      const armorGeo = new THREE.CylinderGeometry(
        0.145, 0.135, 0.58, coarseHull ? 8 : 10, 1, true,
        side > 0 ? -0.4 : Math.PI - 0.2, 0.85
      );
      armorGeo.rotateZ(Math.PI / 2);
      const nacArmor = new THREE.Mesh(
        armorGeo,
        mat(0x2a3540, { metal: 0.8, rough: 0.35, emissive: 0x101820, ei: 0.08 })
      );
      nacArmor.name = "nacelleArmor";
      nacArmor.position.set(-0.18, 0.02, side * 0.52);
      g.add(nacArmor);
      const intake = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.11, 0.1, 10),
        mat(0x102030, { metal: 0.4, rough: 0.4, emissive: 0x2060ff, ei: 0.55 })
      );
      intake.rotation.z = Math.PI / 2;
      intake.position.set(0.22, -0.05, side * 0.52);
      g.add(intake);
      // Multi-stage nozzle: throat → bell → lip (chase-cam hero)
      const throat = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.09, 0.1, 10),
        mat(0x1a2430, { metal: 0.7, rough: 0.35, emissive: 0x102038, ei: 0.2 })
      );
      throat.name = "engineThroat";
      throat.rotation.z = Math.PI / 2;
      throat.position.set(-0.52, -0.05, side * 0.52);
      g.add(throat);
      const bell = new THREE.Mesh(
        new THREE.CylinderGeometry(0.17, 0.09, 0.28, 12),
        mat(0x2a3548, { metal: 0.78, rough: 0.26, emissive: 0x102030, ei: 0.18 })
      );
      bell.name = "engineBell";
      bell.rotation.z = Math.PI / 2;
      bell.position.set(-0.72, -0.05, side * 0.52);
      g.add(bell);
      const lip = new THREE.Mesh(
        new THREE.TorusGeometry(0.155, 0.02, 6, 12),
        mat(0x506878, { metal: 0.65, rough: 0.3, emissive: 0x203040, ei: 0.2 })
      );
      lip.name = "engineLip";
      lip.rotation.y = Math.PI / 2;
      lip.position.set(-0.86, -0.05, side * 0.52);
      g.add(lip);
      // Thruster cowling depth rings (chase silhouette continuity)
      const cowl = new THREE.Mesh(
        new THREE.TorusGeometry(0.12, 0.018, 6, 12),
        mat(0x3a4858, { metal: 0.72, rough: 0.28, emissive: 0x152028, ei: 0.15 })
      );
      cowl.name = "thrusterCowling";
      cowl.rotation.y = Math.PI / 2;
      cowl.position.set(-0.62, -0.05, side * 0.52);
      g.add(cowl);
      const cowl2 = new THREE.Mesh(
        new THREE.TorusGeometry(0.135, 0.014, 5, 10),
        mat(0x2a3540, { metal: 0.68, rough: 0.32, emissive: 0x102028, ei: 0.12 })
      );
      cowl2.name = "thrusterCowlingAft";
      cowl2.rotation.y = Math.PI / 2;
      cowl2.position.set(-0.78, -0.05, side * 0.52);
      g.add(cowl2);
      // Nacelle→throat continuous sleeve (thruster integration — not detached bell toy)
      const sleeve = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11, 0.13, 0.22, 10),
        mat(0x2a3540, { metal: 0.8, rough: 0.3, emissive: 0x101820, ei: 0.12, env: 1.1 })
      );
      sleeve.name = "thrusterNacelleSleeve";
      sleeve.rotation.z = Math.PI / 2;
      sleeve.position.set(-0.38, -0.05, side * 0.52);
      g.add(sleeve);
      const sleeveLip = new THREE.Mesh(
        new THREE.TorusGeometry(0.115, 0.012, 5, 12),
        mat(0x4a5868, { metal: 0.7, rough: 0.28, emissive: 0x152028, ei: 0.12 })
      );
      sleeveLip.name = "thrusterSleeveLip";
      sleeveLip.rotation.y = Math.PI / 2;
      sleeveLip.position.set(-0.48, -0.05, side * 0.52);
      g.add(sleeveLip);
      const exhaust = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.07, 0.1, 10),
        mat(0x40a0ff, { metal: 0.2, rough: 0.18, emissive: 0x2080ff, ei: 1.05 })
      );
      exhaust.rotation.z = Math.PI / 2;
      exhaust.position.set(-0.8, -0.05, side * 0.52);
      g.add(exhaust);
      // Radiator shell hugs the round nacelle (was a floating blue slab + fin stack)
      const radGeo = new THREE.CylinderGeometry(
        0.155, 0.145, 0.62, coarseHull ? 8 : 10, 1, true,
        side > 0 ? -0.55 : Math.PI - 0.15, 1.05
      );
      radGeo.rotateZ(Math.PI / 2);
      const rad = new THREE.Mesh(
        radGeo,
        mat(0x306080, { metal: 0.55, rough: 0.22, emissive: 0x184868, ei: 0.4, env: 1.2 })
      );
      rad.name = "nacelleRadiator";
      rad.position.set(-0.2, -0.03, side * 0.52);
      g.add(rad);
    }

    // Aft deflector between bells — rounded plate (not floating cube)
    {
      const deflGeo = new THREE.CylinderGeometry(0.18, 0.16, 0.14, coarseHull ? 8 : 10);
      deflGeo.rotateZ(Math.PI / 2);
      const defl = new THREE.Mesh(
        deflGeo,
        mat(0x2a3540, { metal: 0.75, rough: 0.3, emissive: 0x102028, ei: 0.12, env: 1.1 })
      );
      defl.name = "aftDeflector";
      defl.position.set(-0.95, 0.02, 0);
      defl.scale.set(1, 1.15, 1.6);
      g.add(defl);
      const deflGlow = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.1, 0.05, coarseHull ? 8 : 10),
        mat(0x40a0ff, { metal: 0.2, rough: 0.25, emissive: 0x2080ff, ei: 0.55 })
      );
      deflGlow.name = "aftDeflectorGlow";
      deflGlow.rotation.z = Math.PI / 2;
      deflGlow.position.set(-1.04, 0.02, 0);
      deflGlow.scale.set(1, 1.1, 1.8);
      g.add(deflGlow);
    }
    // Heat shimmer card aft of bells (NMS thrust — no particles)
    {
      const shim = new THREE.Mesh(
        new THREE.PlaneGeometry(0.32, 0.22),
        mat(0x60b0ff, { metal: 0.05, rough: 0.5, emissive: 0x2080ff, ei: 0.45 })
      );
      shim.name = "heatShimmer";
      shim.position.set(-1.05, -0.05, 0);
      shim.material.transparent = true;
      shim.material.opacity = 0.35;
      shim.material.depthWrite = false;
      if (shim.material.side != null) shim.material.side = THREE.DoubleSide;
      g.add(shim);
    }

    // Wing plates + continuous root fairings (chase 3/4 — fewer floating boxes)
    for (const side of [-1, 1]) {
      const wingShape = new THREE.Shape();
      wingShape.moveTo(0.42, 0.02);
      wingShape.lineTo(0.36, 1.12);
      wingShape.lineTo(-0.2, 1.02);
      wingShape.lineTo(-0.5, 0.06);
      wingShape.closePath();
      const wingGeo = new THREE.ExtrudeGeometry(wingShape, { depth: 0.06, bevelEnabled: false, curveSegments: 1 });
      wingGeo.rotateX(Math.PI / 2);
      if (side < 0) wingGeo.scale(1, 1, -1);
      // Mirror flips winding — FrontSide would cull one wing.
      const wingMat = darkMat.clone();
      wingMat.side = THREE.DoubleSide;
      const wing = new THREE.Mesh(wingGeo, wingMat);
      wing.name = "wingPlanform";
      wing.position.set(0, 0.015, side * 0.08);
      g.add(wing);
      // Upper wing skin — hull material over root half of planform (continuous craft read)
      {
        const skinShape = new THREE.Shape();
        skinShape.moveTo(0.35, 0.04);
        skinShape.lineTo(0.28, 0.55);
        skinShape.lineTo(-0.1, 0.48);
        skinShape.lineTo(-0.35, 0.08);
        skinShape.closePath();
        const skinGeo = new THREE.ExtrudeGeometry(skinShape, { depth: 0.03, bevelEnabled: false, curveSegments: 1 });
        skinGeo.rotateX(Math.PI / 2);
        if (side < 0) skinGeo.scale(1, 1, -1);
        const skinMat = hullMat.clone();
        skinMat.side = THREE.DoubleSide;
        const skin = new THREE.Mesh(skinGeo, skinMat);
        skin.name = "wingUpperSkin";
        skin.position.set(0.02, 0.04, side * 0.1);
        g.add(skin);
      }
      // Hull→wing root: larger tapered cylinder fillet (chase-readable blend)
      const fairGeo = new THREE.CylinderGeometry(0.08, 0.18, 0.5, coarseHull ? 8 : 10);
      fairGeo.rotateX(Math.PI / 2);
      const fair = new THREE.Mesh(fairGeo, hullMat);
      fair.name = "wingRootFairing";
      fair.position.set(0.05, 0.025, side * 0.2);
      fair.scale.set(1.5, 0.95, 1.15);
      g.add(fair);
      // Second blend lobe — darker to bridge hull→black wing
      const blendMat = darkMat.clone();
      blendMat.color.setHex(0x3a4555);
      const fair2 = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, coarseHull ? 8 : 10, 6),
        blendMat
      );
      fair2.name = "wingRootBlend";
      fair2.scale.set(1.6, 0.5, 1.6);
      fair2.position.set(0.0, 0.02, side * 0.42);
      g.add(fair2);
      // Mid-span root sleeve — cylinder (less floating orb at wing root)
      {
        const fair3Geo = new THREE.CylinderGeometry(0.07, 0.1, 0.28, coarseHull ? 6 : 8);
        fair3Geo.rotateX(Math.PI / 2);
        const fair3 = new THREE.Mesh(fair3Geo, blendMat);
        fair3.name = "wingRootBlendMid";
        fair3.position.set(0.05, 0.025, side * 0.58);
        fair3.scale.set(1.15, 0.7, 1);
        g.add(fair3);
      }
      // Nacelle→wing continuous sleeve (cylinder, not floating box fillet)
      const nacWingGeo = new THREE.CylinderGeometry(0.09, 0.13, 0.48, coarseHull ? 8 : 10);
      nacWingGeo.rotateZ(Math.PI / 2);
      const nacWing = new THREE.Mesh(nacWingGeo, hullMat);
      nacWing.name = "nacelleWingFillet";
      nacWing.position.set(-0.12, -0.02, side * 0.58);
      nacWing.scale.set(1, 1.15, 1.35);
      nacWing.rotation.x = side * 0.08;
      g.add(nacWing);
      // Leading-edge rail — continuous tube along wing front (silhouette, not plate edge)
      {
        const leGeo = new THREE.CylinderGeometry(0.018, 0.022, 0.95, 5);
        leGeo.rotateX(Math.PI / 2);
        const le = new THREE.Mesh(
          leGeo,
          mat(0x4a5868, { metal: 0.72, rough: 0.3, emissive: 0x152028, ei: 0.1, env: 1.1 })
        );
        le.name = "wingLeadingEdge";
        le.position.set(0.32, 0.03, side * 0.55);
        le.scale.set(1, 0.7, 1);
        g.add(le);
      }
      // Flush wing accent strip (thin, on planform — not a floating light bar)
      {
        const wlGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.55, 4);
        wlGeo.rotateZ(Math.PI / 2);
        const wline = new THREE.Mesh(
          wlGeo,
          mat(0x70c8ff, { metal: 0.3, rough: 0.2, emissive: 0x2060a0, ei: 0.3 })
        );
        wline.name = "wingPanelLine";
        wline.position.set(0.05, 0.042, side * 0.55);
        g.add(wline);
      }
      // Wingtip nav pod — capsule (was a bright box sticker)
      const tipGeo = THREE.CapsuleGeometry
        ? new THREE.CapsuleGeometry(0.055, 0.12, 4, 8)
        : new THREE.SphereGeometry(0.07, 8, 6);
      const tip = new THREE.Mesh(
        tipGeo,
        mat(side > 0 ? 0x40ff60 : 0xff4040, { metal: 0.3, rough: 0.35, emissive: side > 0 ? 0x20ff40 : 0xff2020, ei: 0.7 })
      );
      tip.name = "wingtipPod";
      if (THREE.CapsuleGeometry) tip.rotation.z = Math.PI / 2;
      else tip.scale.set(1.6, 0.7, 1.1);
      tip.position.set(0.12, 0.04, side * 1.05);
      g.add(tip);
    }

    // Dorsal spine rail — tapered cylinder (hull→fin continuity)
    {
      const spineGeo = new THREE.CylinderGeometry(0.04, 0.055, 0.95, coarseHull ? 8 : 10);
      spineGeo.rotateZ(Math.PI / 2);
      const spine = new THREE.Mesh(
        spineGeo,
        mat(0x3a4555, { metal: 0.8, rough: 0.28, emissive: 0x101820, ei: 0.1, env: 1.1 })
      );
      spine.name = "dorsalSpine";
      spine.position.set(0.05, 0.3, 0);
      spine.scale.set(1, 1.1, 1.35);
      g.add(spine);
    }
    // Dorsal intake — recessed cylinder lip (not a floating box)
    {
      const lipGeo = new THREE.CylinderGeometry(0.1, 0.14, 0.12, coarseHull ? 8 : 10);
      lipGeo.rotateZ(Math.PI / 2);
      const dorsalIntake = new THREE.Mesh(
        lipGeo,
        mat(0x1a2430, { metal: 0.55, rough: 0.4, emissive: 0x2060ff, ei: 0.35 })
      );
      dorsalIntake.name = "dorsalIntakeLip";
      dorsalIntake.position.set(0.12, 0.26, 0);
      dorsalIntake.scale.set(1, 0.7, 1.4);
      g.add(dorsalIntake);
      const rim = new THREE.Mesh(
        new THREE.TorusGeometry(0.11, 0.018, 6, coarseHull ? 10 : 12),
        mat(0x3a4858, { metal: 0.7, rough: 0.3, emissive: 0x152028, ei: 0.12 })
      );
      rim.name = "dorsalIntakeRim";
      rim.rotation.y = Math.PI / 2;
      rim.position.set(0.2, 0.26, 0);
      g.add(rim);
    }
    const spineAnt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.01, 0.012, 0.28, 5),
      mat(0xb0b8c0, { metal: 0.85, rough: 0.22 })
    );
    spineAnt.name = "spineAntenna";
    spineAnt.position.set(0.4, 0.52, 0);
    g.add(spineAnt);
    // Dorsal fin / sensor + beacon (chase-cam hero cue)
    const finShape = new THREE.Shape();
    finShape.moveTo(0.25, 0);
    finShape.lineTo(0.32, 0.42);
    finShape.lineTo(-0.05, 0.5);
    finShape.lineTo(-0.28, 0.08);
    finShape.closePath();
    const finGeo = new THREE.ExtrudeGeometry(finShape, { depth: 0.055, bevelEnabled: false, curveSegments: 1 });
    finGeo.translate(-0.15, 0.34, -0.022);
    const fin = new THREE.Mesh(finGeo, mat(0x8898a8, { metal: 0.65, rough: 0.32 }));
    fin.name = "dorsalFinPlanform";
    g.add(fin);
    // Spine→fin root fairing (continuous dorsal silhouette — not fin stuck on box)
    {
      const finRoot = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, coarseHull ? 8 : 10, 6),
        hullMat
      );
      finRoot.name = "dorsalFinRoot";
      finRoot.scale.set(1.6, 0.7, 0.85);
      finRoot.position.set(-0.12, 0.34, 0);
      g.add(finRoot);
      const finFillet = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.08, 0.28, coarseHull ? 6 : 8),
        hullMat
      );
      finFillet.name = "dorsalFinFillet";
      finFillet.position.set(-0.18, 0.42, 0);
      finFillet.scale.set(1.2, 1, 0.55);
      g.add(finFillet);
    }
    const tailShape = new THREE.Shape();
    tailShape.moveTo(0.12, -0.08);
    tailShape.lineTo(0.16, -0.42);
    tailShape.lineTo(-0.18, -0.34);
    tailShape.lineTo(-0.22, -0.06);
    tailShape.lineTo(-0.22, 0.06);
    tailShape.lineTo(-0.18, 0.34);
    tailShape.lineTo(0.16, 0.42);
    tailShape.lineTo(0.12, 0.08);
    tailShape.closePath();
    const tailGeo = new THREE.ExtrudeGeometry(tailShape, { depth: 0.028, bevelEnabled: false, curveSegments: 1 });
    tailGeo.rotateX(Math.PI / 2);
    tailGeo.translate(-0.48, 0.44, 0);
    const tailMat = mat(0x3a4555, { metal: 0.75, rough: 0.3, env: 1.05 });
    tailMat.side = THREE.DoubleSide;
    const tailPlane = new THREE.Mesh(tailGeo, tailMat);
    tailPlane.name = "tailPlane";
    g.add(tailPlane);
    // Tailplane→fin root blend (chase rear silhouette continuity)
    {
      const tailRoot = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, coarseHull ? 6 : 8, 5),
        hullMat
      );
      tailRoot.name = "tailPlaneRoot";
      tailRoot.scale.set(1.3, 0.6, 1.8);
      tailRoot.position.set(-0.42, 0.44, 0);
      g.add(tailRoot);
    }
    {
      const beacon = new THREE.Mesh(
        new THREE.SphereGeometry(0.035, 6, 5),
        mat(0xffe080, { metal: 0.2, rough: 0.3, emissive: 0xffc040, ei: 0.95 })
      );
      beacon.name = "dorsalBeacon";
      beacon.position.set(-0.25, 0.56, 0);
      g.add(beacon);
      // Beacon stem
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.01, 0.012, 0.08, 5),
        mat(0x8090a0, { metal: 0.7, rough: 0.3 })
      );
      stem.name = "dorsalBeaconStem";
      stem.position.set(-0.25, 0.5, 0);
      g.add(stem);
    }
    // Continuous dorsal ridge — tube spine→fin (silhouette continuity, less floating orb)
    {
      const ridgeGeo = new THREE.CylinderGeometry(0.022, 0.032, 0.72, coarseHull ? 6 : 8);
      ridgeGeo.rotateZ(Math.PI / 2);
      const ridge = new THREE.Mesh(
        ridgeGeo,
        mat(0x3a4555, { metal: 0.78, rough: 0.3, emissive: 0x152028, ei: 0.1, env: 1.05 })
      );
      ridge.name = "dorsalRidgeRail";
      ridge.position.set(-0.05, 0.38, 0);
      ridge.scale.set(1, 0.85, 1.1);
      g.add(ridge);
      const ridgeCap = new THREE.Mesh(
        new THREE.SphereGeometry(0.028, 6, 5),
        hullMat
      );
      ridgeCap.name = "dorsalRidgeNose";
      ridgeCap.scale.set(1.4, 0.7, 1.1);
      ridgeCap.position.set(0.32, 0.36, 0);
      g.add(ridgeCap);
    }
    {
      const sbGeo = new THREE.CylinderGeometry(0.015, 0.018, 0.28, 5);
      sbGeo.rotateZ(Math.PI / 2);
      const sensorBar = new THREE.Mesh(
        sbGeo,
        mat(0x4a5868, { metal: 0.55, rough: 0.3, emissive: 0x2060a0, ei: 0.28 })
      );
      sensorBar.name = "sensorBar";
      sensorBar.position.set(0.12, 0.36, 0);
      g.add(sensorBar);
    }

    // Continuous side strakes — tube rails (ME/NMS armor read)
    for (const side of [-1, 1]) {
      const strakeGeo = new THREE.CylinderGeometry(0.014, 0.016, 0.7, 5);
      strakeGeo.rotateZ(Math.PI / 2);
      const strake = new THREE.Mesh(
        strakeGeo,
        mat(0x4a5868, { metal: 0.75, rough: 0.28, emissive: 0x152028, ei: 0.12, env: 1.15 })
      );
      strake.name = "hullStrake";
      strake.position.set(0.1, 0.06, side * 0.29);
      g.add(strake);
      {
        const saGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.55, 4);
        saGeo.rotateZ(Math.PI / 2);
        const strakeAccent = new THREE.Mesh(
          saGeo,
          mat(0x70c8ff, { metal: 0.3, rough: 0.2, emissive: 0x2060a0, ei: 0.28 })
        );
        strakeAccent.name = "hullStrakeAccent";
        strakeAccent.position.set(0.1, 0.085, side * 0.31);
        g.add(strakeAccent);
      }
    }
    // Sensor blisters — flush glass domes (not floating neon orbs)
    for (const side of [-1, 1]) {
      const blister = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 7, 5, 0, Math.PI * 2, 0, Math.PI * 0.52),
        mat(0x70c8ff, { metal: 0.25, rough: 0.18, emissive: 0x2060a0, ei: 0.22 })
      );
      blister.name = "sensorBlister";
      blister.position.set(0.52, 0.18, side * 0.255);
      blister.rotation.x = side > 0 ? 1.05 : -1.05;
      g.add(blister);
    }
    // Side window slits — thin flush panes on hull radius
    for (const side of [-1, 1]) {
      {
        const slitGeo = new THREE.CylinderGeometry(0.018, 0.02, 0.18, 5);
        slitGeo.rotateZ(Math.PI / 2);
        const slit = new THREE.Mesh(
          slitGeo,
          mat(0x70d0ff, { metal: 0.2, rough: 0.15, emissive: 0x3080c0, ei: 0.35 })
        );
        slit.name = "sideWindowSlit";
        slit.position.set(0.42, 0.28, side * 0.24);
        g.add(slit);
      }
    }
    // Side EVA hatch
    const hatch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.11, 0.05, 14),
      mat(0x70e0c0, { metal: 0.5, rough: 0.28, emissive: 0x20a080, ei: 0.65 })
    );
    hatch.rotation.x = Math.PI / 2;
    hatch.position.set(0.15, 0.0, 0.3);
    g.add(hatch);

    // Landing gear skids + bay doors (strut read, not floating skis)
    for (const side of [-1, 1]) {
      {
        const skidGeo = THREE.CapsuleGeometry
          ? new THREE.CapsuleGeometry(0.035, 0.58, 3, 6)
          : new THREE.CylinderGeometry(0.035, 0.035, 0.7, 6);
        const skid = new THREE.Mesh(skidGeo, mat(0x505860, { metal: 0.7, rough: 0.4 }));
        skid.name = "landingSkid";
        skid.rotation.z = Math.PI / 2;
        skid.position.set(0.1, -0.28, side * 0.22);
        g.add(skid);
      }
      const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.14, 6), darkMat);
      strut.name = "landingStrut";
      strut.position.set(0.1, -0.2, side * 0.22);
      g.add(strut);
      // Strut→hull fairing blob
      const gearFair = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5), hullMat);
      gearFair.name = "landingGearFairing";
      gearFair.scale.set(1.4, 0.7, 1.1);
      gearFair.position.set(0.1, -0.14, side * 0.2);
      g.add(gearFair);
      // Gear bay door — thinner flush panel (less hanging plate)
      {
        const gdGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.48, 6);
        gdGeo.rotateZ(Math.PI / 2);
        const gearDoor = new THREE.Mesh(
          gdGeo,
          mat(0x2a3540, { metal: 0.75, rough: 0.35, emissive: 0x101820, ei: 0.1 })
        );
        gearDoor.name = "landingGearDoor";
        gearDoor.position.set(0.1, -0.16, side * 0.24);
        gearDoor.scale.set(1, 0.35, 1.15);
        gearDoor.rotation.x = side * 0.22;
        g.add(gearDoor);
      }
      const gearDoorAft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.07, 0.14, 6),
        mat(0x3a4858, { metal: 0.7, rough: 0.32, emissive: 0x152028, ei: 0.1 })
      );
      gearDoorAft.name = "landingGearDoorAft";
      gearDoorAft.rotation.z = Math.PI / 2;
      gearDoorAft.position.set(-0.12, -0.18, side * 0.22);
      g.add(gearDoorAft);
    }

    // Hull running-light strips — thin flush tubes (not thick bars)
    for (const side of [-1, 1]) {
      const runGeo = new THREE.CylinderGeometry(0.012, 0.012, 1.05, 5);
      runGeo.rotateZ(Math.PI / 2);
      const run = new THREE.Mesh(
        runGeo,
        mat(0x80d0ff, { metal: 0.2, rough: 0.25, emissive: 0x3080c0, ei: 0.65 })
      );
      run.name = "hullRunLight";
      run.position.set(0.05, -0.06, side * 0.28);
      g.add(run);
    }
    // Nav light emissive bulbs (no PointLight on mobile — perf)
    // Nav bulbs — small flush hemispheres (not floating neon orbs)
    const bulbL = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 6, 5, 0, Math.PI * 2, 0, Math.PI * 0.6),
      mat(0xff4040, { metal: 0.1, rough: 0.35, emissive: 0xff2020, ei: 0.95 })
    );
    bulbL.name = "navBulbL";
    bulbL.position.set(0.55, 0.06, 0.26);
    bulbL.rotation.x = 0.8;
    const bulbR = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 6, 5, 0, Math.PI * 2, 0, Math.PI * 0.6),
      mat(0x40ff60, { metal: 0.1, rough: 0.35, emissive: 0x20ff40, ei: 0.95 })
    );
    bulbR.name = "navBulbR";
    bulbR.position.set(0.55, 0.06, -0.26);
    bulbR.rotation.x = -0.8;
    g.add(bulbL, bulbR);

    hatchLight = window.VesperNoLight(0x60ffe0, 0.0, 5, 2);
    hatchLight.position.set(0.15, 0.05, 0.35);
    g.add(hatchLight);

    thrusterGlow = window.VesperNoLight(0x60b0ff, 0.3, 7, 2);
    thrusterGlow.position.set(-0.7, -0.05, 0);
    g.add(thrusterGlow);
    // Exhaust plume cards (NMS/GMod read — no particles on phone)
    for (const side of [-1, 1]) {
      const plume = new THREE.Mesh(
        new THREE.ConeGeometry(0.1, 0.45, 8, 1, true),
        mat(0x60b0ff, { metal: 0.05, rough: 0.35, emissive: 0x2080ff, ei: 0.85 })
      );
      plume.name = "exhaustPlume";
      plume.rotation.z = Math.PI / 2;
      plume.position.set(-1.05, -0.05, side * 0.52);
      plume.scale.set(1, 1, 0.7);
      g.add(plume);
    }

    // Flare hardpoint
    {
      const hardGeo = new THREE.CylinderGeometry(0.05, 0.06, 0.16, 6);
      hardGeo.rotateZ(Math.PI / 2);
      const hard = new THREE.Mesh(hardGeo, mat(0x405060, { metal: 0.7, rough: 0.35, emissive: 0xff6020, ei: 0.3 }));
      hard.position.set(0.25, -0.08, 0.32);
      hard.name = "flareHardpoint";
      g.add(hard);
    }
    flareMesh = new THREE.Group();
    const flareBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.036, 0.26, 8), mat(0xc04020, { metal: 0.55, rough: 0.3, emissive: 0xff4000, ei: 0.5 }));
    flareBarrel.rotation.z = Math.PI / 2;
    flareMesh.add(flareBarrel);
    flareMesh.position.set(0.32, -0.08, 0.32);
    flareMesh.visible = false;
    flareMesh.name = "flareGun";
    g.add(flareMesh);

    // Landing light strip — tube
    {
      const lsGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.55, 5);
      lsGeo.rotateZ(Math.PI / 2);
      const landStrip = new THREE.Mesh(lsGeo, mat(0xe0ffe8, { metal: 0.3, rough: 0.4, emissive: 0x40ff80, ei: 0.65 }));
      landStrip.name = "landingLightStrip";
      landStrip.position.set(0.15, -0.26, 0);
      g.add(landStrip);
    }

    // Forward docking ring
    const dockingRing = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.018, 8, 16), mat(0x70e0c0, { metal: 0.55, rough: 0.28, emissive: 0x20a080, ei: 0.5 }));
    dockingRing.position.set(1.05, 0.04, 0);
    dockingRing.rotation.y = Math.PI / 2;
    g.add(dockingRing);

    // === Fidelity pass (GMod/NMS/Starfield read, IP-free) — thrifty segs on coarse ===
    const coarseShip = !!(typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches);
    const segLo = coarseShip ? 6 : 10;
    // Sensor dish (dorsal)
    const dishArm = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.18, segLo), mat(0xa0a8b0, { metal: 0.8, rough: 0.28 }));
    dishArm.position.set(-0.55, 0.38, -0.12);
    g.add(dishArm);
    const dish = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, segLo, segLo, 0, Math.PI * 2, 0, Math.PI * 0.55),
      mat(0xc8d0d8, { metal: 0.7, rough: 0.22, emissive: 0x203040, ei: 0.2 })
    );
    dish.position.set(-0.55, 0.48, -0.12);
    dish.rotation.x = 0.4;
    g.add(dish);
    // RCS thruster quads — recessed cylinders (not bright floating cubes)
    for (const [x, y, z] of [
      [0.7, 0.12, 0.22], [0.7, 0.12, -0.22], [-0.5, 0.18, 0.2], [-0.5, 0.18, -0.2],
      [0.2, -0.22, 0.18], [0.2, -0.22, -0.18],
    ]) {
      const rcs = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.04, 0.07, 6),
        mat(0x3a4858, { metal: 0.7, rough: 0.32, emissive: 0x203848, ei: 0.22 })
      );
      rcs.name = "rcsQuad";
      rcs.rotation.z = Math.PI / 2;
      rcs.position.set(x, y, z);
      g.add(rcs);
      const rcsNoz = new THREE.Mesh(
        new THREE.ConeGeometry(0.028, 0.05, 5),
        mat(0x80c0ff, { metal: 0.15, rough: 0.3, emissive: 0x4080ff, ei: 0.55 })
      );
      rcsNoz.name = "rcsNozzle";
      rcsNoz.position.set(x - 0.045, y, z);
      rcsNoz.rotation.z = Math.PI / 2;
      g.add(rcsNoz);
    }
    // Ventral scoops — tapered cylinders (underside continuity, not plate boxes)
    for (const side of [-1, 1]) {
      const scoopGeo = new THREE.CylinderGeometry(0.06, 0.1, 0.32, coarseHull ? 6 : 8);
      scoopGeo.rotateZ(Math.PI / 2);
      const scoop = new THREE.Mesh(
        scoopGeo,
        mat(0x1a222c, { metal: 0.7, rough: 0.4, emissive: 0x102028, ei: 0.12 })
      );
      scoop.name = "ventralScoop";
      scoop.position.set(0.55, -0.28, side * 0.16);
      scoop.rotation.z = 0.12;
      scoop.scale.set(1, 0.85, 1.15);
      g.add(scoop);
    }
    // Continuous ventral keel rail (underside silhouette — chase belly continuity)
    {
      const keelGeo = new THREE.CylinderGeometry(0.02, 0.028, 1.05, 6);
      keelGeo.rotateZ(Math.PI / 2);
      const keel = new THREE.Mesh(
        keelGeo,
        mat(0x3a4555, { metal: 0.75, rough: 0.32, emissive: 0x152028, ei: 0.1 })
      );
      keel.name = "ventralKeelRail";
      keel.position.set(-0.05, -0.34, 0);
      g.add(keel);
    }
    // Heat-tile strip under belly (NMS read) — thrifty count on coarse
    const tileN = coarseShip ? 3 : 5;
    for (let i = 0; i < tileN; i++) {
      const tileGeo = new THREE.CylinderGeometry(0.09, 0.1, 0.2, 6);
      tileGeo.rotateZ(Math.PI / 2);
      const tile = new THREE.Mesh(
        tileGeo,
        mat(0x3a2a20, { metal: 0.3, rough: 0.6, emissive: 0x502818, ei: 0.22 })
      );
      tile.name = "heatTile";
      tile.position.set(-0.35 + i * 0.24, -0.3, 0);
      tile.scale.set(1, 0.12, 1.5);
      g.add(tile);
    }
    // Ventral cargo bay — recessed well + hinge rails (underside detail)
    {
      const wellGeo = new THREE.CylinderGeometry(0.23, 0.25, 0.76, 10);
      wellGeo.rotateZ(Math.PI / 2);
      const bayWell = new THREE.Mesh(
        wellGeo,
        mat(0x1a222c, { metal: 0.65, rough: 0.45, emissive: 0x102028, ei: 0.15 })
      );
      bayWell.name = "cargoBayWell";
      bayWell.position.set(-0.1, -0.36, 0);
      bayWell.scale.set(1, 0.28, 1.75);
      g.add(bayWell);
    }
    {
      const doorGeo = new THREE.CylinderGeometry(0.2, 0.22, 0.68, 8);
      doorGeo.rotateZ(Math.PI / 2);
      const bayDoor = new THREE.Mesh(
        doorGeo,
        mat(0x2a3540, { metal: 0.72, rough: 0.38, emissive: 0x183040, ei: 0.22 })
      );
      bayDoor.name = "cargoBayDoor";
      bayDoor.position.set(-0.1, -0.33, 0);
      bayDoor.scale.set(1, 0.18, 1.7);
      g.add(bayDoor);
    }
    for (const side of [-1, 1]) {
      const hingeGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.65, 5);
      hingeGeo.rotateZ(Math.PI / 2);
      const hinge = new THREE.Mesh(
        hingeGeo,
        mat(0x70c8ff, { metal: 0.35, rough: 0.25, emissive: 0x2060a0, ei: 0.45 })
      );
      hinge.name = "bayHingeRail";
      hinge.position.set(-0.1, -0.31, side * 0.2);
      g.add(hinge);
    }
    {
      const sealGeo = new THREE.CylinderGeometry(0.06, 0.07, 0.38, 8);
      sealGeo.rotateX(Math.PI / 2);
      const baySeal = new THREE.Mesh(
        sealGeo,
        mat(0x506070, { metal: 0.55, rough: 0.35, emissive: 0x203040, ei: 0.2 })
      );
      baySeal.name = "cargoBaySeal";
      baySeal.position.set(0.28, -0.32, 0);
      g.add(baySeal);
    }
    // Belly cargo silhouette — side walls + ramp lip (chase underside read)
    for (const side of [-1, 1]) {
      const wallGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.7, 6);
      wallGeo.rotateZ(Math.PI / 2);
      const bayWall = new THREE.Mesh(
        wallGeo,
        mat(0x1a222c, { metal: 0.68, rough: 0.42, emissive: 0x102028, ei: 0.12 })
      );
      bayWall.name = "cargoBaySideWall";
      bayWall.position.set(-0.1, -0.38, side * 0.24);
      bayWall.scale.set(1, 0.8, 1.1);
      g.add(bayWall);
    }
    {
      const rampGeo = new THREE.CylinderGeometry(0.12, 0.16, 0.32, 6);
      rampGeo.rotateZ(Math.PI / 2);
      const bayRamp = new THREE.Mesh(
        rampGeo,
        mat(0x3a4555, { metal: 0.65, rough: 0.4, emissive: 0x152028, ei: 0.1 })
      );
      bayRamp.name = "cargoBayRampLip";
      bayRamp.position.set(-0.52, -0.38, 0);
      bayRamp.rotation.z = 0.18;
      bayRamp.scale.set(1, 0.5, 1.3);
      g.add(bayRamp);
    }
    // Chase-readable hero cue — belly docking collar (no new PointLight on coarse)
    {
      const collar = new THREE.Mesh(
        new THREE.TorusGeometry(0.16, 0.022, 8, 16),
        mat(0x70e0c0, { metal: 0.55, rough: 0.28, emissive: 0x20a080, ei: 0.55 })
      );
      collar.name = "bellyDockingCollar";
      collar.position.set(0.35, -0.38, 0);
      collar.rotation.x = Math.PI / 2;
      g.add(collar);
      const collarInner = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 0.04, 12),
        mat(0x1a2430, { metal: 0.5, rough: 0.4, emissive: 0x102838, ei: 0.25 })
      );
      collarInner.name = "bellyDockingWell";
      collarInner.position.set(0.35, -0.38, 0);
      g.add(collarInner);
      // Ventral sensor array petals (3/4 chase read)
      for (let i = 0; i < 3; i++) {
        const ang = (i / 3) * Math.PI * 2;
        const petalGeo = new THREE.CylinderGeometry(0.025, 0.03, 0.12, 5);
        petalGeo.rotateZ(Math.PI / 2);
        const petal = new THREE.Mesh(
          petalGeo,
          mat(0x70c8ff, { metal: 0.4, rough: 0.25, emissive: 0x2060a0, ei: 0.4 })
        );
        petal.name = "ventralSensorPetal";
        petal.position.set(0.35 + Math.cos(ang) * 0.22, -0.4, Math.sin(ang) * 0.22);
        petal.rotation.y = ang;
        g.add(petal);
      }
    }
    // Throttle thruster PointLights on coarse (FPS) — tick restores intensity each frame
    if (coarseShip) {
      if (thrusterGlow) thrusterGlow.distance = 4.5;
      if (hatchLight) hatchLight.distance = 2.5;
    }

    // Registry decal plate (Starfield-readable marking, IP-free)
    const decal = new THREE.Mesh(
      new THREE.PlaneGeometry(0.36, 0.1),
      mat(0x102030, { metal: 0.4, rough: 0.35, emissive: 0x3080c0, ei: 0.35 })
    );
    decal.name = "hullRegistryDecal";
    decal.position.set(0.15, 0.08, 0.3);
    decal.rotation.x = -0.08;
    g.add(decal);
    const decalR = decal.clone();
    decalR.name = "hullRegistryDecalR";
    decalR.position.z = -Math.abs(decal.position.z);
    decalR.rotation.x = 0.08;
    g.add(decalR);
    const decalStripe = new THREE.Mesh(
      new THREE.PlaneGeometry(0.32, 0.025),
      mat(0xffc060, { metal: 0.2, rough: 0.4, emissive: 0xa06020, ei: 0.5 })
    );
    decalStripe.position.set(0.15, 0.02, 0.3);
    decalStripe.rotation.x = -0.08;
    g.add(decalStripe);

    // Chase-cam readable scale
    g.scale.setScalar(2.35);
    // Soft contact card under belly (grounds silhouette in chase)
    const contact = new THREE.Mesh(
      new THREE.CircleGeometry(0.55, 16),
      mat(0x000000, { metal: 0, rough: 1, emissive: 0x000000, ei: 0 })
    );
    contact.name = "contactShadow";
    contact.rotation.x = -Math.PI / 2;
    contact.position.set(0.05, -0.42, 0);
    contact.material.transparent = true;
    contact.material.opacity = 0.35;
    contact.material.depthWrite = false;
    g.add(contact);
    g.visible = true;
    pulse.wingtips.length = 0;
    pulse.shimmers.length = 0;
    pulse.deflectors.length = 0;
    pulse.lips.length = 0;
    pulse.plumes.length = 0;
    pulse.tiles.length = 0;
    pulse.runs.length = 0;
    pulse.beacons.length = 0;
    pulse.navs.length = 0;
    g.traverse((ch) => {
      if (ch.name === "wingtipPod") pulse.wingtips.push(ch);
      else if (ch.name === "heatShimmer") pulse.shimmers.push(ch);
      else if (ch.name === "aftDeflectorGlow") pulse.deflectors.push(ch);
      else if (ch.name === "engineLip") pulse.lips.push(ch);
      else if (ch.name === "exhaustPlume") pulse.plumes.push(ch);
      else if (ch.name === "heatTile") pulse.tiles.push(ch);
      else if (ch.name === "hullRunLight") pulse.runs.push(ch);
      else if (ch.name === "dorsalBeacon") pulse.beacons.push(ch);
      else if (ch.name === "navBulbL" || ch.name === "navBulbR") pulse.navs.push(ch);
    });
    return g;
  }

  function ensureCamToggle() {
    if (camBtn) return;
    camBtn = document.createElement("button");
    camBtn.type = "button";
    camBtn.id = "btn-cam-mode";
    camBtn.className = "btn ghost";
    camBtn.textContent = "Cam · Chase";
    camBtn.title = "Toggle chase / cockpit (V)";
    camBtn.setAttribute("aria-label", "Toggle camera mode");
    camBtn.style.cssText =
      "position:fixed;right:10px;top:52px;z-index:40;font-size:11px;padding:6px 10px;opacity:0.85;";
    camBtn.addEventListener("click", () => {
      const s = window.VesperSky;
      if (!s || !s.setCamMode) return;
      const next = (s.getCamMode && s.getCamMode()) === "cockpit" ? "chase" : "cockpit";
      s.setCamMode(next);
      camBtn.textContent = next === "cockpit" ? "Cam · Cockpit" : "Cam · Chase";
    });
    document.body.appendChild(camBtn);

    boardHint = document.createElement("div");
    boardHint.id = "ship-board-hint";
    boardHint.style.cssText =
      "position:fixed;left:50%;bottom:118px;transform:translateX(-50%);z-index:35;" +
      "background:rgba(8,14,22,0.72);color:#c8e8ff;font:12px/1.3 system-ui,sans-serif;" +
      "padding:6px 12px;border-radius:10px;pointer-events:none;opacity:0;transition:opacity .25s;";
    document.body.appendChild(boardHint);
  }

  function setBoardHint(text) {
    if (!boardHint) return;
    if (!text) {
      boardHint.style.opacity = "0";
      return;
    }
    boardHint.textContent = text;
    boardHint.style.opacity = "0.95";
  }

  function boot(ctx) {
    THREE = ctx.THREE;
    scene = ctx.scene;
    if (!THREE || !scene) return;
    if (root) return;
    root = buildMesh();
    scene.add(root);
    ensureCamToggle();
    parked = false;
  }

  function syncPose(flight, camera) {
    if (!root || !flight) return;
    if (parked && parkPos) {
      root.position.copy(parkPos);
      if (parkQuat) root.quaternion.copy(parkQuat);
      root.visible = true;
      if (hatchLight) hatchLight.intensity = 0.85 + 0.35 * Math.sin(performance.now() * 0.006);
      // Hide ship body when in cockpit fly; always show when parked for EVA reboard
      return;
    }
    root.quaternion.copy(camera.quaternion);
    const cockpit = (flight.camMode || "chase") === "cockpit";
    // Nudge craft ahead of chase pivot so nose/nacelles read in 3/4
    if (!cockpit) {
      if (!chaseFwd) chaseFwd = new THREE.Vector3();
      chaseFwd.set(0, 0, -1).applyQuaternion(camera.quaternion);
      root.position.copy(flight.pos).addScaledVector(chaseFwd, 0.48);
    } else {
      root.position.copy(flight.pos);
    }
    // In cockpit, hide exterior hull so you aren't inside the mesh
    root.visible = !cockpit;
    if (hatchLight) hatchLight.intensity = 0;
  }

  function parkAt(pos, quat) {
    if (!root || !pos) return;
    parked = true;
    if (!parkPos) parkPos = new THREE.Vector3();
    if (!parkQuat) parkQuat = new THREE.Quaternion();
    parkPos.copy(pos);
    parkPos.y += 0.05;
    if (quat) parkQuat.copy(quat);
    else if (root) parkQuat.copy(root.quaternion);
    root.position.copy(parkPos);
    root.quaternion.copy(parkQuat);
    root.visible = true;
    // Walkable full-size cabin beside exterior craft (ME/Bethesda explore)
    try {
      const sc = scene || (window.VesperSky && window.VesperSky.getScene && window.VesperSky.getScene());
      let surfaceRoot = null;
      if (sc) {
        sc.traverse((ch) => {
          if (ch.name === "vesper-surface-detail") surfaceRoot = ch;
        });
      }
      if (surfaceRoot && window.VesperPlaces && window.VesperPlaces.attachShipCabin) {
        window.VesperPlaces.attachShipCabin(surfaceRoot, parkPos.clone());
      }
    } catch (e) {
      console.warn("[vesper-ship cabin]", e);
    }
    setBoardHint("Ship parked · walk cabin/hangar · " + ((typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches) || ("ontouchstart" in window) ? ("hold " + "▲" + " near hatch to reboard") : "Space near the hatch to reboard"));
    setTimeout(() => setBoardHint(""), 3800);
  }

  function reboard(flight) {
    parked = false;
    parkPos = null;
    if (flight) flight.shipParked = false;
    setBoardHint("Ship live · chase cam");
    setTimeout(() => setBoardHint(""), 1600);
  }

  function tick(dt, flight, camera) {
    if (!root || !flight) return;
    // Thruster glow scales with speed / boost — chase-cam hero read
    const sp = flight.vel ? flight.vel.length() : 0;
    const boost = !!(flight.boosting || (window.VesperSky && window.VesperSky.isBoosting && window.VesperSky.isBoosting()));
    if (thrusterGlow && !parked) {
      thrusterGlow.intensity = 0.35 + Math.min(2.4, sp * 0.005) + (boost ? 0.9 : 0);
    }
    // Exhaust plumes + beacon/run/heat pulse (emissive only — phone safe)
    const glow = thrusterGlow ? thrusterGlow.intensity : 0.3;
    const tPulse = performance.now() * 0.005;
    const tipPulse = 0.55 + 0.35 * Math.sin(performance.now() * 0.004);
    for (let i = 0; i < pulse.wingtips.length; i++) {
      const m = pulse.wingtips[i].material;
      if (m) m.emissiveIntensity = tipPulse;
    }
    const shimK = 0.25 + Math.min(0.55, glow * 0.35);
    for (let i = 0; i < pulse.shimmers.length; i++) {
      const m = pulse.shimmers[i].material;
      if (!m) continue;
      m.opacity = shimK;
      m.emissiveIntensity = 0.3 + shimK;
    }
    const defI = 0.35 + Math.min(0.8, glow * 0.3);
    for (let i = 0; i < pulse.deflectors.length; i++) {
      const m = pulse.deflectors[i].material;
      if (m) m.emissiveIntensity = defI;
    }
    const lipI = 0.15 + Math.min(0.7, glow * 0.25);
    for (let i = 0; i < pulse.lips.length; i++) {
      const m = pulse.lips[i].material;
      if (m) m.emissiveIntensity = lipI;
    }
    const plumeK = 0.65 + Math.min(1.6, glow * 0.85);
    for (let i = 0; i < pulse.plumes.length; i++) {
      const ch = pulse.plumes[i];
      ch.scale.set(plumeK, plumeK * 1.15, 0.75);
      if (ch.material && ch.material.emissiveIntensity != null) {
        ch.material.emissiveIntensity = 0.55 + plumeK * 0.55;
      }
    }
    const tileI = 0.15 + 0.2 * Math.min(1, sp / 80);
    for (let i = 0; i < pulse.tiles.length; i++) {
      const m = pulse.tiles[i].material;
      if (m) m.emissiveIntensity = tileI;
    }
    const runI = 0.55 + 0.25 * Math.sin(tPulse * 2.5);
    for (let i = 0; i < pulse.runs.length; i++) {
      const m = pulse.runs[i].material;
      if (m) m.emissiveIntensity = runI;
    }
    const beI = 0.85 + 0.65 * (0.5 + 0.5 * Math.sin(tPulse));
    for (let i = 0; i < pulse.beacons.length; i++) {
      const m = pulse.beacons[i].material;
      if (m) m.emissiveIntensity = beI;
    }
    const navI = 1.15 + 0.25 * Math.sin(tPulse * 0.6);
    for (let i = 0; i < pulse.navs.length; i++) {
      const m = pulse.navs[i].material;
      if (m) m.emissiveIntensity = navI;
    }
    if (flareMesh && window.VesperLife && window.VesperLife.hasItem) {
      flareMesh.visible = !!window.VesperLife.hasItem("weapon-flare") && !parked;
    }
    // Near parked ship while walking → reboard hint
    if (parked && parkPos && flight.walking) {
      const dx = flight.pos.x - parkPos.x;
      const dy = flight.pos.y - parkPos.y;
      const dz = flight.pos.z - parkPos.z;
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (d < 4.2) setBoardHint("At ship / EVA hatch · " + ((typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches) || ("ontouchstart" in window) ? ("hold " + "▲" + " to leave / reboard") : "Space to leave / reboard"));
    }
    if (camBtn && window.VesperSky && window.VesperSky.getCamMode) {
      const m = window.VesperSky.getCamMode();
      const label = m === "cockpit" ? "Cam · Cockpit" : "Cam · Chase";
      if (camBtn.textContent !== label) camBtn.textContent = label;
      camBtn.style.display = flight.walking ? "none" : "";
    }
  }

  function getRoot() {
    return root;
  }
  function isParked() {
    return !!parked;
  }
  function getParkPos() {
    return parkPos;
  }

  window.VesperShip = {
    boot,
    syncPose,
    parkAt,
    reboard,
    tick,
    getRoot,
    isParked,
    getParkPos,
  };
})();
