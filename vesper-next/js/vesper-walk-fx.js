/**
 * Vesper walk FX — dust / ice sparkle when moving on surface (hopeful tactile world).
 */
(function () {
  "use strict";
  let pts = null;
  let geo = null;
  let life = null;
  let n = 0;
  const N = 120;

  function ensure(THREE, scene) {
    if (pts) return;
    geo = new THREE.BufferGeometry();
    const pos = new Float32Array(N * 3);
    life = new Float32Array(N);
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.12,
      color: 0xc8b090,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      sizeAttenuation: true,
    });
    pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;
    pts.visible = false;
    scene.add(pts);
    n = 0;
  }

  function detach() {
    if (pts && pts.parent) pts.parent.remove(pts);
    if (geo) geo.dispose();
    if (pts && pts.material) pts.material.dispose();
    pts = geo = life = null;
    prints.forEach((p) => {
      if (p.mesh.parent) p.mesh.parent.remove(p.mesh);
      p.mesh.geometry.dispose();
      p.mesh.material.dispose();
    });
    prints = [];
  }

  function burst(origin, up, colorHex) {
    if (!pts || !origin) return;
    pts.visible = true;
    if (colorHex && pts.material) pts.material.color.setHex(colorHex);
    const pos = geo.attributes.position.array;
    for (let i = 0; i < 8; i++) {
      const idx = (n++ % N) * 3;
      pos[idx] = origin.x + (Math.random() - 0.5) * 0.4;
      pos[idx + 1] = origin.y + Math.random() * 0.2;
      pos[idx + 2] = origin.z + (Math.random() - 0.5) * 0.4;
      life[n % N] = 0.4 + Math.random() * 0.4;
    }
    geo.attributes.position.needsUpdate = true;
  }

  function tick(dt, walking, pos, speed, biome) {
    if (!pts || !walking) {
      if (pts) pts.visible = false;
      return;
    }
    const arr = geo.attributes.position.array;
    let any = false;
    for (let i = 0; i < N; i++) {
      if (life[i] > 0) {
        life[i] -= dt;
        arr[i * 3 + 1] += dt * 0.35;
        any = true;
      }
    }
    if (speed > 0.4 && Math.random() < Math.min(0.35, speed * 0.08)) {
      const col =
        biome === "ice" || biome === "europa" || biome === "plume" || biome === "triton" || biome === "mimas" || biome === "rhea" || biome === "dione" || biome === "tethys" || biome === "eris" || biome === "haumea" || biome === "miranda" || biome === "ariel" || biome === "umbriel" || biome === "titania" || biome === "oberon" || biome === "orcus" || biome === "salacia" || biome === "hyperion" || biome === "halley" || biome === "encke" || biome === "janus" || biome === "epimetheus" || biome === "hiiaka" || biome === "namaka" || biome === "dysnomia" || biome === "tyche" || biome === "planetnine" || biome === "planetx"
          ? 0xd0e8ff
          : biome === "mars" || biome === "pluto" || biome === "sedna" || biome === "makemake" || biome === "charon" || biome === "ixion" || biome === "amalthea" || biome === "eros" || biome === "vulcan" || biome === "nibiru" || biome === "theia" || biome === "nemesis"
            ? 0xc06040
            : biome === "earth"
              ? 0x90a878
              : biome === "titan"
                ? 0xc87838
                : biome === "venus" || biome === "io"
                  ? 0xe8c060
                  : biome === "ceres"
                    ? 0xe0e8f0
                    : biome === "luna" || biome === "mercury" || biome === "vesta" || biome === "pallas" || biome === "ida" || biome === "varuna" || biome === "weywot"
                      ? 0xc8c0b0
                      : biome === "phobos" || biome === "deimos" || biome === "callisto" || biome === "iapetus" || biome === "proteus" || biome === "larissa" || biome === "himalia" || biome === "dactyl" || biome === "nereid" || biome === "phoebe"
                        ? 0x6a6058
                        : biome === "ganymede"
                          ? 0xb0a890
                          : biome === "psyche"
                            ? 0xc0c8d0
                            : biome === "phoebe"
                              ? 0x4a4038
                              : biome === "pbh"
                                ? 0x6050a0
                                : biome === "phaeton"
                                  ? 0xb0a080
                                  : 0xb0a090;
      burst(pos, null, col);
      any = true;
    }
    pts.visible = any;
    geo.attributes.position.needsUpdate = true;
  }

  let prints = [];
  function footprint(origin, up, THREE, scene) {
    if (!origin || !THREE || !scene) return;
    const m = new THREE.Mesh(
      new THREE.CircleGeometry(0.08, 8),
      new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
      })
    );
    m.position.copy(origin);
    const U = up && up.lengthSq ? up.clone().normalize() : new THREE.Vector3(0, 1, 0);
    m.position.addScaledVector(U, 0.02);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), U);
    scene.add(m);
    prints.push({ mesh: m, life: 4 });
    if (prints.length > 40) {
      const old = prints.shift();
      if (old.mesh.parent) old.mesh.parent.remove(old.mesh);
      old.mesh.geometry.dispose();
      old.mesh.material.dispose();
    }
  }
  const _tickOld = tick;
  tick = function (dt, walking, pos, speed, biome) {
    _tickOld(dt, walking, pos, speed, biome);
    for (let i = prints.length - 1; i >= 0; i--) {
      prints[i].life -= dt;
      prints[i].mesh.material.opacity = Math.max(0, prints[i].life * 0.05);
      if (prints[i].life <= 0) {
        const old = prints.splice(i, 1)[0];
        if (old.mesh.parent) old.mesh.parent.remove(old.mesh);
        old.mesh.geometry.dispose();
        old.mesh.material.dispose();
      }
    }
  };
  window.VesperWalkFx = {
    ensure: ensure,
    detach: detach,
    tick: tick,
    burst: burst,
    footprint: footprint,
  };

  window.addEventListener("vesper:walk", function () {
    try {
      const s = window.VesperSky;
      if (!s || !pts) return;
      const pos = s.getPos && s.getPos();
      if (!pos || !window.THREE) return;
      const p = new THREE.Vector3(pos[0], pos[1], pos[2]);
      const bio = (window.VesperSurfaces && window.VesperSurfaces.active && window.VesperSurfaces.active()) || {};
      const col =
        bio.biome === "ice" || bio.biome === "europa" || bio.biome === "plume" || bio.biome === "triton" || bio.biome === "mimas" || bio.biome === "rhea" || bio.biome === "dione" || bio.biome === "tethys" || bio.biome === "miranda" || bio.biome === "ariel" || bio.biome === "titania" || bio.biome === "umbriel" || bio.biome === "oberon" || bio.biome === "orcus" || bio.biome === "salacia" || bio.biome === "hyperion" || bio.biome === "halley" || bio.biome === "encke" || bio.biome === "janus" || bio.biome === "epimetheus" || bio.biome === "hiiaka" || bio.biome === "namaka" || bio.biome === "dysnomia" || bio.biome === "tyche" || bio.biome === "planetnine" || bio.biome === "planetx"
          ? 0xd0e8ff
          : bio.biome === "mars" || bio.biome === "pluto" || bio.biome === "sedna" || bio.biome === "makemake" || bio.biome === "charon" || bio.biome === "ixion" || bio.biome === "amalthea" || bio.biome === "eros" || bio.biome === "vulcan" || bio.biome === "nibiru" || bio.biome === "theia" || bio.biome === "nemesis"
            ? 0xc06040
            : bio.biome === "earth"
              ? 0x90a878
              : bio.biome === "io" || bio.biome === "venus"
                ? 0xe8c060
                : bio.biome === "luna" || bio.biome === "mercury" || bio.biome === "vesta" || bio.biome === "pallas" || bio.biome === "ida" || bio.biome === "varuna"
                  ? 0xc8c0b0
                  : bio.biome === "proteus" || bio.biome === "larissa" || bio.biome === "himalia" || bio.biome === "phoebe"
                    ? 0x6a6058
                    : bio.biome === "pbh"
                      ? 0x6050a0
                      : bio.biome === "phaeton"
                        ? 0xb0a080
                        : 0xb0a090;
      burst(p, null, col);
      burst(p, null, col);
    } catch (_) {}
  });
})();
