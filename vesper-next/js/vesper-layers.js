/**
 * Vesper layers — belt artifacts, bot asteroid society, voxel craft.
 * Straight Man hides fantasy; science Sol remains. Density-capped.
 * Loaded after main.js; waits for vesper:ready.
 */
(function () {
  "use strict";

  const LS_VOXELS = "vesper.voxels.v1";
  const MAX_BOTS = 28;
  const MAX_ARTIFACTS = 36;
  const MAX_VOXELS = 420;
  const CHUNK = 8; // sparse chunk size in voxels

  let root = null;
  let artifactGroup = null;
  let botGroup = null;
  let voxelGroup = null;
  let voxelMesh = null;
  let voxelMap = new Map(); // "x,y,z" -> index
  let bots = [];
  let artifacts = [];
  let dummy = null;
  let raycaster = null;
  let pointer = null;
  let lastTick = 0;
  let hidden = false;

  function THREE() {
    return window.THREE;
  }

  function sky() {
    return window.VesperSky;
  }

  function straight() {
    const s = sky();
    return s && s.getStraightMan && s.getStraightMan();
  }

  function applyVisibility() {
    const hide = straight();
    hidden = hide;
    if (artifactGroup) artifactGroup.visible = !hide;
    if (botGroup) botGroup.visible = !hide;
    // Builds: Straight Man optionally hides (user ask: hides builds optional)
    if (voxelGroup) voxelGroup.visible = !hide;
    const bodies = sky() && sky()._bodiesRef && sky()._bodiesRef();
    if (bodies) {
      for (let i = 0; i < bodies.length; i++) {
        const g = bodies[i] && bodies[i].group;
        if (!g) continue;
        g.traverse((ch) => {
          if (ch.name === "vesperCraftBlock") ch.visible = !hide;
        });
      }
    }
  }

  function seeded(n) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  function makeArtifactMesh(kind, scale) {
    const T = THREE();
    let geo;
    if (kind === "obelisk") geo = new T.BoxGeometry(0.35, 2.2, 0.35);
    else if (kind === "arch") {
      const g = new T.Group();
      const mat = window.VesperMat({
        color: 0x7a8aa0,
        emissive: 0x152030,
        emissiveIntensity: 0.18,
        roughness: 0.45,
        metalness: 0.25,
      });
      const p1 = new T.Mesh(new T.BoxGeometry(0.25, 1.6, 0.25), mat);
      const p2 = p1.clone();
      const top = new T.Mesh(new T.BoxGeometry(1.4, 0.22, 0.25), mat);
      p1.position.set(-0.55, 0.8, 0);
      p2.position.set(0.55, 0.8, 0);
      top.position.set(0, 1.65, 0);
      g.add(p1, p2, top);
      g.scale.setScalar(scale);
      return g;
    } else if (kind === "garden") geo = new T.OctahedronGeometry(0.7, 0);
    else if (kind === "beacon") geo = new T.ConeGeometry(0.35, 1.4, 5);
    else geo = new T.TetrahedronGeometry(0.85, 0);
    const colors = {
      obelisk: 0x9aa0b0,
      garden: 0x6a8a78,
      beacon: 0xc4a888,
      relic: 0x8a7a60,
    };
    const mat = window.VesperMat({
      color: colors[kind] || 0xaaaaaa,
      emissive: colors[kind] || 0x222222,
      emissiveIntensity: 0.14,
      roughness: 0.55,
      metalness: 0.15,
      flatShading: true,
    });
    const m = new T.Mesh(geo, mat);
    m.scale.setScalar(scale);
    return m;
  }

  function placeArtifacts(system, bodies) {
    const T = THREE();
    artifactGroup = new T.Group();
    artifactGroup.name = "vesperArtifacts";
    const rocks = (bodies || []).filter((b) => b.isAsteroid || b.landable);
    const kinds = ["obelisk", "arch", "garden", "beacon", "relic"];
    const n = Math.min(MAX_ARTIFACTS, Math.max(12, Math.floor(rocks.length * 0.55)));
    for (let i = 0; i < n; i++) {
      const rock = rocks[i % Math.max(1, rocks.length)];
      if (!rock) break;
      const kind = kinds[i % kinds.length];
      const art = makeArtifactMesh(kind, 2.5 + seeded(i + 3) * 4);
      const pos = rock.pos || [0, 0, 0];
      const r = (rock.radius || 8) + 1.2;
      const ang = seeded(i * 9.1) * Math.PI * 2;
      const elev = 0.35 + seeded(i * 2.2) * 0.5;
      art.position.set(
        pos[0] + Math.cos(ang) * r * 0.15,
        pos[1] + r * elev * 0.25,
        pos[2] + Math.sin(ang) * r * 0.15
      );
      // Sit roughly on rock surface
      const outward = new T.Vector3(art.position.x - pos[0], art.position.y - pos[1], art.position.z - pos[2]);
      if (outward.lengthSq() < 1e-6) outward.set(0, 1, 0);
      else outward.normalize();
      art.position.set(pos[0], pos[1], pos[2]).addScaledVector(outward, r * 0.95);
      art.lookAt(pos[0], pos[1], pos[2]);
      art.userData = { kind, rock: rock.name, intentional: true };
      artifactGroup.add(art);
      artifacts.push({ kind, rock: rock.name, mesh: art });
    }
    system.add(artifactGroup);
  }

  function makeBot(i) {
    const T = THREE();
    const g = new T.Group();
    const body = new T.Mesh(
      new T.CapsuleGeometry(0.45, 0.9, 3, 6),
      window.VesperMat({
        color: 0x6a8aa0,
        emissive: 0x152030,
        emissiveIntensity: 0.5,
        roughness: 0.4,
        metalness: 0.3,
      })
    );
    const head = new T.Mesh(
      new T.SphereGeometry(0.38, 10, 8),
      window.VesperMat({
        color: 0xc8d0d8,
        emissive: 0x405060,
        emissiveIntensity: 0.4,
        roughness: 0.35,
      })
    );
    head.position.y = 1.15;
    g.add(body, head);
    g.scale.setScalar(1.8 + seeded(i) * 1.2);
    const roles = ["gardener", "archivist", "pilot", "sculptor", "watcher", "mechanic"];
    const role = roles[i % roles.length];
    g.userData = {
      role,
      phase: seeded(i * 4) * Math.PI * 2,
      speed: 0.4 + seeded(i * 7) * 0.8,
      home: null,
      mood: ["work", "play", "live"][i % 3],
    };
    return g;
  }

  function placeBots(system, bodies) {
    const T = THREE();
    botGroup = new T.Group();
    botGroup.name = "vesperBots";
    const rocks = (bodies || []).filter((b) => b.isAsteroid || b.landable);
    const n = Math.min(MAX_BOTS, Math.max(8, Math.floor(rocks.length * 0.45)));
    for (let i = 0; i < n; i++) {
      const rock = rocks[(i * 3) % Math.max(1, rocks.length)];
      if (!rock) break;
      const bot = makeBot(i);
      const pos = rock.pos || [0, 0, 0];
      const r = (rock.radius || 8) + 2;
      const ang = seeded(i * 11.3) * Math.PI * 2;
      bot.position.set(
        pos[0] + Math.cos(ang) * r * 0.2,
        pos[1] + r * 0.5,
        pos[2] + Math.sin(ang) * r * 0.2
      );
      const home = bot.position.clone();
      bot.userData.home = home;
      bot.userData.rock = rock.name;
      botGroup.add(bot);
      bots.push(bot);
    }
    system.add(botGroup);
  }

  function tickBots(t) {
    if (hidden || !bots.length) return;
    const T = THREE();
    for (let i = 0; i < bots.length; i++) {
      const b = bots[i];
      const u = b.userData;
      if (!u.home) continue;
      const mood = u.mood;
      const amp = mood === "play" ? 6 : mood === "work" ? 2.2 : 1.1;
      const sp = u.speed * (mood === "play" ? 1.4 : 1);
      const a = u.phase + t * sp * 0.15;
      b.position.x = u.home.x + Math.cos(a) * amp;
      b.position.z = u.home.z + Math.sin(a) * amp;
      b.position.y = u.home.y + Math.sin(a * 1.7) * (mood === "live" ? 0.6 : 1.8);
      b.rotation.y = a + Math.PI / 2;
    }
  }

  // --- Craft props (muted materials — not candy voxels) -------------------
  const MATERIALS = {
    metal: { color: 0x8a9098, roughness: 0.55, metalness: 0.72, emissive: 0x101418, ei: 0.08, geo: "box" },
    ice: { color: 0xb8d0e0, roughness: 0.35, metalness: 0.12, emissive: 0x203040, ei: 0.12, geo: "box", transparent: true, opacity: 0.82 },
    rock: { color: 0x6e6458, roughness: 0.92, metalness: 0.08, emissive: 0x0c0a08, ei: 0.04, geo: "dodec" },
    glass: { color: 0x88a8c0, roughness: 0.18, metalness: 0.35, emissive: 0x152030, ei: 0.18, geo: "box", transparent: true, opacity: 0.45 },
    antenna: { color: 0xa09070, roughness: 0.48, metalness: 0.65, emissive: 0x1a1810, ei: 0.1, geo: "antenna" },
    habitat: { color: 0x7a848c, roughness: 0.62, metalness: 0.4, emissive: 0x121820, ei: 0.1, geo: "panel" },
    solar: { color: 0x1a3060, roughness: 0.28, metalness: 0.55, emissive: 0x102848, ei: 0.35, geo: "solar" },
    beacon: { color: 0xb0c8d8, roughness: 0.4, metalness: 0.55, emissive: 0x40a0ff, ei: 0.85, geo: "beacon" },
  };
  let craftMatId = "metal";
  const meshByMat = {};
  // Persist as {key: matId}
  const LS_CRAFT = "vesper.craft.v2";

  function setCraftMaterial(id) {
    // "erase" is a phone control. Right-click is not available on iPhone.
    if (id !== "erase" && !MATERIALS[id]) return;
    craftMatId = id;
    document.querySelectorAll(".mat-btn").forEach((b) => {
      b.classList.toggle("active", b.getAttribute("data-mat") === id);
    });
    try { localStorage.setItem("vesper.craftMat", id); } catch (_) {}
  }

  function makeGeo(T, kind) {
    if (kind === "dodec") return new T.DodecahedronGeometry(0.55, 0);
    if (kind === "antenna") {
      // Thin spar — scaled at instance
      return new T.CylinderGeometry(0.08, 0.12, 1.4, 5);
    }
    if (kind === "panel") return new T.BoxGeometry(1.15, 0.22, 0.85);
    if (kind === "solar") return new T.BoxGeometry(1.6, 0.06, 0.95);
    if (kind === "beacon") return new T.CylinderGeometry(0.12, 0.16, 1.55, 8);
    return new T.BoxGeometry(1, 1, 1);
  }

  function ensureVoxelMesh(system) {
    const T = THREE();
    if (voxelGroup) return;
    voxelGroup = new T.Group();
    voxelGroup.name = "vesperCraft";
    dummy = new T.Object3D();
    raycaster = new T.Raycaster();
    pointer = new T.Vector2();
    Object.keys(MATERIALS).forEach((id) => {
      const def = MATERIALS[id];
      const geo = makeGeo(T, def.geo);
      const mat = window.VesperMat({
        color: def.color,
        roughness: def.roughness,
        metalness: def.metalness,
        emissive: def.emissive,
        emissiveIntensity: def.ei,
        flatShading: def.geo === "dodec",
        transparent: !!def.transparent,
        opacity: def.opacity != null ? def.opacity : 1,
        depthWrite: !def.transparent,
      });
      const mesh = new T.InstancedMesh(geo, mat, MAX_VOXELS);
      mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
      mesh.count = 0;
      mesh.frustumCulled = true;
      mesh.userData.matId = id;
      voxelGroup.add(mesh);
      meshByMat[id] = mesh;
    });
    system.add(voxelGroup);
    voxelMesh = meshByMat[craftMatId] || meshByMat.metal;
    // Material tray wiring
    document.querySelectorAll(".mat-btn").forEach((b) => {
      b.addEventListener("click", () => setCraftMaterial(b.getAttribute("data-mat")));
    });
    try {
      const saved = localStorage.getItem("vesper.craftMat");
      if (saved && MATERIALS[saved]) setCraftMaterial(saved);
    } catch (_) {}
    const tray = document.getElementById("build-tray");
    if (tray) {
      window.addEventListener("vesper:build", (ev) => {
        const on = ev.detail && ev.detail.on;
        tray.hidden = !on;
      });
    }
  }

  function keyOf(x, y, z) {
    return x + "," + y + "," + z;
  }

  function anchorOf(wx, wy, wz) {
    const s = sky();
    const T = THREE();
    const bodies = s && s._bodiesRef && s._bodiesRef();
    if (!T || !bodies) return null;
    const p = new T.Vector3(wx, wy, wz);
    const wp = new T.Vector3();
    let best = null;
    let bestAlt = Infinity;
    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i];
      if (!b || !b.mesh || !b.group || b.name === "Sun") continue;
      b.mesh.getWorldPosition(wp);
      const alt = p.distanceTo(wp) - (b.radius || 0);
      if (alt < bestAlt) {
        bestAlt = alt;
        best = b;
      }
    }
    return best ? { body: best, alt: bestAlt } : null;
  }

  const NEAR_ALT = 400;

  function dropCraftBlocks(root) {
    if (!root) return;
    const dead = [];
    root.traverse((ch) => {
      if (ch.name === "vesperCraftBlock") dead.push(ch);
    });
    for (let j = 0; j < dead.length; j++) {
      if (dead[j].parent) dead[j].parent.remove(dead[j]);
    }
  }

  function clearCraftMeshes() {
    dropCraftBlocks(voxelGroup);
    const s = sky();
    const bodies = s && s._bodiesRef && s._bodiesRef();
    if (!bodies) return;
    for (let i = 0; i < bodies.length; i++) {
      dropCraftBlocks(bodies[i] && bodies[i].group);
    }
  }

  function rebuildVoxelInstances() {
    clearCraftMeshes();
    Object.keys(meshByMat).forEach((id) => {
      meshByMat[id].count = 0;
    });
    const T = THREE();
    const s = sky();
    const bodies = s && s._bodiesRef && s._bodiesRef();
    if (!T || !bodies) return;
    voxelMap.forEach((matId, key) => {
      const id = MATERIALS[matId] ? matId : "metal";
      const src = meshByMat[id];
      const pipe = key.indexOf("|");
      if (!src || pipe < 0) return;
      const bodyName = key.slice(0, pipe);
      const parts = key.slice(pipe + 1).split(",");
      const x = +parts[0];
      const y = +parts[1];
      const z = +parts[2];
      const mesh = new T.Mesh(src.geometry, src.material);
      mesh.name = "vesperCraftBlock";
      mesh.userData.craftKey = key;
      const def = MATERIALS[id];
      mesh.position.set(x + 0.5, y + 0.5, z + 0.5);
      if (bodyName === "*") {
        if (def.geo === "antenna") mesh.scale.set(1, 1.2, 1);
        else if (def.geo === "beacon") {
          mesh.scale.set(1, 1.15, 1);
          mesh.position.y = y + 0.85;
        } else if (def.geo === "dodec") {
          mesh.scale.set(1.1, 1.0, 1.05);
          mesh.rotation.set(0.2, 0.4, 0.1);
        } else if (def.geo === "panel") mesh.rotation.y = (x * 0.7 + z) % 1.5;
        else if (def.geo === "solar") mesh.rotation.set(0.15, (x + z * 0.3) % 2.0, 0);
        mesh.visible = !hidden;
        if (voxelGroup) voxelGroup.add(mesh);
        return;
      }
      const b = bodies.find((bb) => bb && bb.name === bodyName);
      if (!b || !b.group) return;
      if (def.geo === "antenna") mesh.scale.set(1, 1.2, 1);
      else if (def.geo === "beacon") {
        mesh.scale.set(1, 1.15, 1);
        mesh.position.y = y + 0.85;
      } else if (def.geo === "dodec") {
        mesh.scale.set(1.1, 1.0, 1.05);
        mesh.rotation.set(0.2, 0.4, 0.1);
      } else if (def.geo === "panel") mesh.rotation.y = (x * 0.7 + z) % 1.5;
      else if (def.geo === "solar") mesh.rotation.set(0.15, (x + z * 0.3) % 2.0, 0);
      mesh.visible = !hidden;
      b.group.add(mesh);
    });
    voxelMesh = meshByMat[craftMatId] || meshByMat.metal;
  }

  function placeVoxel(wx, wy, wz, matId) {
    const hit = anchorOf(wx, wy, wz);
    const T = THREE();
    if (!T) return false;
    let key = null;
    const b = hit && hit.body;
    // Open space used to stick to whichever hub was nearest, then slide
    // away with that hub. Only a block near a surface rides that world.
    if (b && b.group && hit.alt <= NEAR_ALT) {
      b.group.updateMatrixWorld(true);
      const local = b.group.worldToLocal(new T.Vector3(wx, wy, wz));
      key = b.name + "|" + keyOf(Math.floor(local.x), Math.floor(local.y), Math.floor(local.z));
    } else {
      key = "*|" + keyOf(Math.floor(wx), Math.floor(wy), Math.floor(wz));
    }
    if (voxelMap.has(key)) return false;
    if (voxelMap.size >= MAX_VOXELS) return false;
    voxelMap.set(key, matId || craftMatId || "metal");
    rebuildVoxelInstances();
    persistVoxels();
    return true;
  }

  function removeVoxel(wx, wy, wz) {
    const T = THREE();
    const s = sky();
    const bodies = s && s._bodiesRef && s._bodiesRef();
    if (!T || !bodies) return false;
    const p = new T.Vector3(wx, wy, wz);
    const wp = new T.Vector3();
    let best = null;
    let bestD = 2.2;
    const roots = [];
    if (voxelGroup) roots.push(voxelGroup);
    for (let i = 0; i < bodies.length; i++) {
      if (bodies[i] && bodies[i].group) roots.push(bodies[i].group);
    }
    for (let i = 0; i < roots.length; i++) {
      roots[i].traverse((ch) => {
        if (ch.name !== "vesperCraftBlock") return;
        ch.getWorldPosition(wp);
        const d = wp.distanceTo(p);
        if (d < bestD) {
          bestD = d;
          best = ch.userData.craftKey;
        }
      });
    }
    if (!best || !voxelMap.has(best)) return false;
    voxelMap.delete(best);
    rebuildVoxelInstances();
    persistVoxels();
    return true;
  }

  function persistVoxels() {
    try {
      const obj = {};
      voxelMap.forEach((matId, key) => { obj[key] = matId; });
      localStorage.setItem(LS_CRAFT, JSON.stringify(obj));
      localStorage.removeItem(LS_VOXELS);
    } catch (_) {}
  }

  function adoptWorldKey(k, mat) {
    const parts = String(k).split(",");
    if (parts.length < 3) return;
    const T = THREE();
    const wx = +parts[0] + 0.5;
    const wy = +parts[1] + 0.5;
    const wz = +parts[2] + 0.5;
    const hit = anchorOf(wx, wy, wz);
    const b = hit && hit.body;
    let key;
    if (b && b.group && T && hit.alt <= NEAR_ALT) {
      b.group.updateMatrixWorld(true);
      const local = b.group.worldToLocal(new T.Vector3(wx, wy, wz));
      key = b.name + "|" + keyOf(Math.floor(local.x), Math.floor(local.y), Math.floor(local.z));
    } else {
      key = "*|" + keyOf(Math.floor(wx), Math.floor(wy), Math.floor(wz));
    }
    if (!voxelMap.has(key) && voxelMap.size < MAX_VOXELS) voxelMap.set(key, mat || "metal");
  }

  function loadVoxels() {
    try {
      const raw2 = localStorage.getItem(LS_CRAFT);
      if (raw2) {
        const obj = JSON.parse(raw2);
        voxelMap.clear();
        Object.keys(obj).slice(0, MAX_VOXELS).forEach((k) => {
          if (k.indexOf("|") >= 0) voxelMap.set(k, obj[k] || "metal");
          else adoptWorldKey(k, obj[k] || "metal");
        });
        rebuildVoxelInstances();
        persistVoxels();
        return;
      }
      const raw = localStorage.getItem(LS_VOXELS);
      if (!raw) return;
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return;
      voxelMap.clear();
      arr.slice(0, MAX_VOXELS).forEach((k) => {
        if (typeof k === "string") adoptWorldKey(k, "metal");
      });
      rebuildVoxelInstances();
      persistVoxels();
    } catch (_) {}
  }

  function onPointer(e) {

    const s = sky();
    if (!s || !s.getBuildMode || !s.getBuildMode()) return;
    if (straight()) return;
    if (!raycaster || !(voxelMesh || meshByMat.metal)) return;
    const cam = s.scene && null; // need camera — use canvas ray via flight pos look
    // Use ship forward ray from VesperSky position
    const pos = s.getPos && s.getPos();
    if (!pos) return;
    const T = THREE();
    // Approximate: place in front of ship
    const lookChip = document.getElementById("look-chip");
    // Prefer intersecting rock bodies
    const bodies = (s._bodiesRef && s._bodiesRef()) || (s.bodies ? s.bodies() : []);
    const origin = new T.Vector3(pos[0], pos[1], pos[2]);
    // Build a forward from camera if available via scene
    const scene = s.scene && s.scene();
    if (!scene || !scene.children) return;
    // The flight camera is not a child of the scene. Searching the
    // scene always missed, so a tap never placed a block.
    let camera = (s.getCamera && s.getCamera()) || null;
    if (!camera) {
      scene.traverse((o) => {
        if (!camera && o.isPerspectiveCamera) camera = o;
      });
    }
    if (!camera) return;
    camera.updateMatrixWorld(true);
    const rect = e.target.getBoundingClientRect ? e.target.getBoundingClientRect() : { left: 0, top: 0, width: innerWidth, height: innerHeight };
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hitPt = raycaster.ray.origin.clone().addScaledVector(raycaster.ray.direction, 12);
    const meshes = [];
    if (voxelMesh) meshes.push(voxelMesh);
    bodies.forEach((b) => {
      if (b && b.mesh && b.mesh.isMesh) meshes.push(b.mesh);
      if (b && b.group) {
        b.group.traverse((ch) => {
          if (ch.name === "vesperCraftBlock") meshes.push(ch);
        });
      }
    });
    if (voxelGroup) {
      voxelGroup.traverse((ch) => {
        if (ch.name === "vesperCraftBlock") meshes.push(ch);
      });
    }
    let surface = null;
    scene.traverse((ch) => {
      if (!surface && ch.name === "vesper-surface-detail") surface = ch;
    });
    if (surface) {
      surface.traverse((o) => {
        if (o.isMesh) meshes.push(o);
      });
    }
    const hits = raycaster.intersectObjects(meshes, false);
    if (e.button === 2 || e.type === "contextmenu") {
      e.preventDefault();
      if (hits.length) {
        const p = hits[0].point;
        removeVoxel(p.x - raycaster.ray.direction.x * 0.2, p.y, p.z);
      } else {
        removeVoxel(hitPt.x, hitPt.y, hitPt.z);
      }
      return;
    }
    if (e.button === 0) {
      if (craftMatId === "erase") {
        if (hits.length) {
          const p = hits[0].point;
          removeVoxel(p.x - raycaster.ray.direction.x * 0.2, p.y, p.z);
        } else {
          removeVoxel(hitPt.x, hitPt.y, hitPt.z);
        }
        return;
      }
      if (hits.length) {
        const p = hits[0].point.clone().add(hits[0].face.normal);
        placeVoxel(p.x, p.y, p.z);
      } else {
        placeVoxel(hitPt.x, hitPt.y, hitPt.z);
      }
    }
  }

  function bindBuildInput() {
    const canvas = document.querySelector("#canvas-wrap canvas");
    if (!canvas || canvas.__vesperBuildBound) return;
    canvas.__vesperBuildBound = true;
    canvas.addEventListener("pointerdown", onPointer);
    canvas.addEventListener("contextmenu", (e) => {
      if (sky() && sky().getBuildMode && sky().getBuildMode()) {
        e.preventDefault();
        onPointer(e);
      }
    });
  }

  function animateLoop(t) {
    tickBots(t * 0.001);
    requestAnimationFrame(animateLoop);
  }

  function init() {
    const s = sky();
    if (!s || !s.system) return;
    const system = s.system();
    const scene = s.scene && s.scene();
    if (!system) return;
    const bodies = s.bodies ? s.bodies() : [];
    placeArtifacts(system, bodies);
    placeBots(system, bodies);
    ensureVoxelMesh(system);
    loadVoxels();
    applyVisibility();
    bindBuildInput();
    requestAnimationFrame(animateLoop);
    window.VesperLayers = {
      artifactCount: () => artifacts.length,
      botCount: () => bots.length,
      voxelCount: () => voxelMap.size,
      caps: { bots: MAX_BOTS, artifacts: MAX_ARTIFACTS, voxels: MAX_VOXELS },
      refreshVisibility: applyVisibility,
    };
  }

  window.addEventListener("vesper:ready", () => {
    // Defer one frame so __vesperSystem is set
    setTimeout(init, 50);
  });
  window.addEventListener("vesper:straight", applyVisibility);
  // If main already ready (late script)
  if (window.VesperSky && window.VesperSky.version) {
    setTimeout(init, 100);
  }
})();
