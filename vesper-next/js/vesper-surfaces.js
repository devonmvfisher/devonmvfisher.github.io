/**
 * Vesper walkable surface detail — procedural life/terrain underfoot.
 * Craters, dust, ice, dunes, sparse Earth flora, station artifacts.
 * Inspired by hopeful futurism (Expanse / Wizard-of-Oz wonder) — not sterile grey.
 */
(function () {
  "use strict";

  let root = null;
  let active = null;
  let THREE = null;
  let anchored = false;
  let anchorPos = null;
  let anchorUp = null;
  let padExtent = 18;
  let _rel = null;
  const _qAlign = { setFromUnitVectors: null }; // filled when THREE ready
  let _upY = null;
  let _q = null;

  function sky() {
    return window.VesperSky;
  }

  function biomeForRaw(name) {
    if (name === "Luna Gateway" || name === "Luna Gateway Hub") return "deck";
    // Orbital hub / mega names from VesperPlaces
    if (/Dyson|Helix|Ringworld|Bishop|Waystation|Refuge|Assay|Clinic|Market Drift|Greek Camp|Trojan Camp|Oort Whisper|Dark Contact/i.test(name || "")) {
      if (/Dyson|Helix|Ringworld|Bishop|Hyp/i.test(name)) return "phaeton"; // fiction plaza kit
      return "deck";
    }

    const n = name || "";
    // Fiction twins are not Earth or the Moon. A word boundary still
    // matches the Earth inside Counter-Earth and the Luna inside Counter-Luna.
    if (/Counter-Earth/i.test(n)) return "counterearth";
    if (/Counter-Luna/i.test(n)) return "counterluna";
    if (/\bEarth\b/i.test(n)) return "earth";
    if (/Mars|Perseverance|Curiosity|Ingenuity/i.test(n)) return "mars";
    if (/Venus/i.test(n)) return "venus";
    if (/Titania/i.test(n)) return "titania";
    if (/\bTitan\b/i.test(n)) return "titan";
    if (/Europa/i.test(n)) return "europa";
    if (/Enceladus/i.test(n)) return "plume";
    if (/\bIo\b/i.test(n)) return "io";
    if (/Ganymede/i.test(n)) return "ganymede";
    if (/Callisto/i.test(n)) return "callisto";
    if (/\bMoon\b|\bLuna\b|Apollo/i.test(n)) return "luna";
    if (/Mercury/i.test(n)) return "mercury";
    if (/Phobos/i.test(n)) return "phobos";
    if (/Deimos/i.test(n)) return "deimos";
    if (/Ceres/i.test(n)) return "ceres";
    if (/Triton/i.test(n)) return "triton";
    if (/Pluto/i.test(n)) return "pluto";
    if (/Charon/i.test(n)) return "charon";
    if (/\bNix\b/i.test(n)) return "nix";
    if (/Mimas/i.test(n)) return "mimas";
    if (/Iapetus/i.test(n)) return "iapetus";
    if (/Miranda/i.test(n)) return "miranda";
    if (/Rhea/i.test(n)) return "rhea";
    if (/Dione/i.test(n)) return "dione";
    if (/Tethys/i.test(n)) return "tethys";
    if (/Vesta/i.test(n)) return "vesta";
    if (/Hi[\u02bb'\u2018]?iaka|Hiiaka/i.test(n)) return "hiiaka";
    if (/Namaka/i.test(n)) return "namaka";
    if (/Dysnomia/i.test(n)) return "dysnomia";
    if (/Eris/i.test(n)) return "eris";
    if (/Haumea/i.test(n)) return "haumea";
    if (/Makemake/i.test(n)) return "makemake";
    if (/Sedna/i.test(n)) return "sedna";
    if (/Ariel/i.test(n)) return "ariel";
    if (/Umbriel/i.test(n)) return "umbriel";
    if (/Oberon/i.test(n)) return "oberon";
    if (/Quaoar/i.test(n)) return "quaoar";
    if (/Gonggong/i.test(n)) return "gonggong";
    if (/Psyche/i.test(n)) return "psyche";
    if (/Phoebe/i.test(n)) return "phoebe";
    if (/Pallas/i.test(n)) return "pallas";
    if (/\bEros\b/i.test(n)) return "eros";
    if (/\bIda\b/i.test(n)) return "ida";
    if (/Amalthea/i.test(n)) return "amalthea";
    if (/Dactyl/i.test(n)) return "dactyl";
    if (/Himalia/i.test(n)) return "himalia";
    if (/Hyperion/i.test(n)) return "hyperion";
    if (/\bJanus\b/i.test(n)) return "janus";
    if (/Epimetheus/i.test(n)) return "epimetheus";
    if (/Larissa/i.test(n)) return "larissa";
    if (/Proteus/i.test(n)) return "proteus";
    if (/Nereid/i.test(n)) return "nereid";
    if (/Weywot/i.test(n)) return "weywot";
    if (/Orcus/i.test(n)) return "orcus";
    if (/Varuna/i.test(n)) return "varuna";
    if (/Ixion/i.test(n)) return "ixion";
    if (/Salacia/i.test(n)) return "salacia";
    if (/Halley/i.test(n)) return "halley";
    if (/Encke/i.test(n)) return "encke";
    // Hyp / fiction walkable biomes (labeled Hyp — not Sol-confirmed)
    if (/\bVulcan\b/i.test(n)) return "vulcan";
    if (/Nemesis/i.test(n)) return "nemesis";
    if (/\bTyche\b/i.test(n)) return "tyche";
    if (/Planet\s*Nine/i.test(n)) return "planetnine";
    if (/Planet\s*X/i.test(n)) return "planetx";
    if (/Nibiru/i.test(n)) return "nibiru";
    if (/PBH|pbh/i.test(n)) return "pbh";
    if (/\bTheia\b/i.test(n)) return "theia";
    if (/Phaeton/i.test(n)) return "phaeton";
    // "(Hyp)" pads were missing the mega-name list, so the forge and the
    // gardens grew the gray rock kit instead of the fiction plaza.
    if (/\(Hyp\)/i.test(n)) return "phaeton";
    if (/Jupiter|Saturn|Uranus|Neptune/i.test(n)) return "gas";
    if (/Station|ISS|Tiangong|Gateway|Hubble|JWST|Starman|Roadster|Voyager|Juno|Cassini|Parker|Rosetta|OSIRIS|Lucy|DAWN|New Horizons|Horizons/i.test(n))
      return "deck";
    return "rock";
  }

  function biomeFor(name) {
    const raw = biomeForRaw(name);
    // A free station is not the planet named in the title. Earth–Moon L5
    // was growing Earth's green pad. A hub keeps its parent's ground.
    try {
      const list = window.VesperSky && window.VesperSky._bodiesRef && window.VesperSky._bodiesRef();
      const b = list && list.find((x) => x && x.name === name);
      if (b && b.userData && b.userData.placeHub) {
        const parent = b.group && b.group.userData && b.group.userData.followBody;
        const planetish = { earth: 1, luna: 1, mars: 1, titan: 1, venus: 1, gas: 1 };
        if (!parent) {
          if (planetish[raw]) return "deck";
        } else if (planetish[raw]) {
          const pb = biomeForRaw(parent);
          if (pb !== raw) return pb;
        }
      }
    } catch (_) {}
    return raw;
  }

  function mulberry(seed) {
    return function () {
      let t = (seed += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function makeGroundMat(biome, low) {
    const c = document.createElement("canvas");
    const ultra = !!(window.VesperSky && window.VesperSky.getQualityTier && window.VesperSky.getQualityTier() === "ultra");
    const sz = low ? 512 : ultra ? 4096 : 1536; // 8K-class ultra canvas; mobile 512
    c.width = c.height = sz;
    const g = c.getContext("2d");
    const rnd = mulberry(biome.length * 997 + sz);
    const pals = {
      earth: ["#3a5a28", "#5a7a38", "#2a4020", "#8a9a50", "#4a6840", "#c2b280"],
      counterearth: ["#5a4870", "#3a3050", "#7a6890", "#2a2038", "#9080a8", "#483858"],
      counterluna: ["#6a88a8", "#486880", "#8aa8c0", "#304858", "#a0c0d0", "#385060"],
      mars: ["#c45a3a", "#a04028", "#e08050", "#6a3020", "#d07040", "#8a4830"],
      rock: ["#8a8a90", "#6a6a70", "#b0b0b8", "#4a4a50", "#9a9aa0", "#707078"],
      luna: ["#c8c4b8", "#9a9688", "#e8e4d8", "#6a6860", "#b0a898", "#78746c", "#3a3834"],
      mercury: ["#b0a898", "#8a8070", "#d0c8b8", "#5a5448", "#c8b090", "#706858"],
      callisto: ["#6a6858", "#4a4838", "#8a8878", "#3a3828", "#9a9080", "#505040"],
      ganymede: ["#a8a090", "#787060", "#c8c0b0", "#585040", "#908878", "#d0c8b8"],
      io: ["#e8d040", "#c8a028", "#f0e878", "#806818", "#d09030", "#a06020", "#ff6040"],
      triton: ["#d0d8e0", "#a8b8c8", "#f0f4f8", "#8090a0", "#c0a890", "#708090"],
      pluto: ["#e8b090", "#c87858", "#f0d0b0", "#805040", "#d09870", "#f8e8e0", "#a06048"],
      ceres: ["#8a8880", "#6a6860", "#b0aea8", "#4a4840", "#e8e8f0", "#909088"],
      phobos: ["#6a6058", "#4a4038", "#8a8078", "#3a3028", "#706860", "#505048"],
      deimos: ["#7a7068", "#5a5048", "#9a9088", "#4a4038", "#807870", "#605850"],
      mimas: ["#e8e4d8", "#c8c4b8", "#f8f4e8", "#a0a098", "#d0ccc0", "#888880"],
      iapetus: ["#f0e8d8", "#2a2820", "#d0c8b8", "#101008", "#c0b8a8", "#404038"],
      miranda: ["#d0d0c8", "#a8a8a0", "#e8e8e0", "#707068", "#c0c0b8", "#909088"],
      rhea: ["#f0f0f8", "#d0d0e0", "#ffffff", "#a8a8b8", "#e0e0e8", "#9898a8"],
      dione: ["#e8e8f0", "#c0c0d0", "#f8f8ff", "#9090a0", "#d8d8e8", "#a8a8b8"],
      tethys: ["#f0f4f8", "#d0d8e0", "#ffffff", "#b0b8c0", "#e8ecf0", "#a0a8b0"],
      vesta: ["#b0a090", "#8a7860", "#d0c0a8", "#5a4a38", "#c8b898", "#706050"],
      eris: ["#d8dce0", "#a0a8b0", "#f0f4f8", "#707880", "#c0c8d0", "#8890a0"],
      hiiaka: ["#e0e8f0", "#c0d0e0", "#f4f8ff", "#a0b0c0", "#d0dce8", "#8898a8"],
      namaka: ["#d0d8e0", "#a8b0c0", "#e8f0f8", "#8090a0", "#c0c8d8", "#708090"],
      dysnomia: ["#a8b0b8", "#788088", "#c0c8d0", "#505860", "#9098a0", "#606870"],
      haumea: ["#e8e4f0", "#c8c0d8", "#f8f4ff", "#a098b0", "#d8d0e8", "#9088a0"],
      makemake: ["#e07050", "#c05030", "#f09070", "#803020", "#d06848", "#a04028"],
      sedna: ["#c04028", "#a02818", "#e06040", "#601808", "#b03820", "#802010"],
      charon: ["#c8b8a8", "#8a7060", "#e0d0c0", "#503830", "#a09080", "#704850"],
      nix: ["#e4e0d8", "#c8c4bc", "#f4f2ec", "#9a968e", "#d0ccc4", "#b0aca4"],
      ariel: ["#e8e8f0", "#c8c8d8", "#f8f8ff", "#a0a0b0", "#d8d8e8", "#9090a0"],
      umbriel: ["#6a6a70", "#4a4a50", "#8a8a90", "#3a3a40", "#787880", "#505058"],
      titania: ["#d0d0d8", "#a8a8b0", "#e8e8f0", "#808088", "#c0c0c8", "#9898a0"],
      oberon: ["#b0a898", "#888070", "#d0c8b8", "#585048", "#a09888", "#706858"],
      quaoar: ["#c8b090", "#a08860", "#e0d0b0", "#705838", "#b8a080", "#908060"],
      gonggong: ["#c06050", "#903828", "#e08070", "#602018", "#a04838", "#803028"],
      psyche: ["#8a9098", "#6a7078", "#b0b8c0", "#4a5058", "#c0c8d0", "#707880"],
      phoebe: ["#4a4038", "#2a2218", "#6a6058", "#1a1210", "#807870", "#3a3228"],
      pallas: ["#7a8088", "#5a6068", "#9aa0a8", "#3a4048", "#b0b8c0", "#687078"],
      eros: ["#b09070", "#8a6848", "#d0b090", "#5a4030", "#c0a080", "#706050"],
      ida: ["#9a9080", "#7a7060", "#b8b0a0", "#4a4038", "#a89888", "#686058"],
      amalthea: ["#b06040", "#803020", "#d08058", "#502018", "#a04830", "#704028"],
      dactyl: ["#8a8070", "#6a6050", "#a89888", "#4a4038", "#908878", "#585048"],
      himalia: ["#8a8070", "#6a6058", "#a89880", "#4a4030", "#908070", "#605848"],
      hyperion: ["#c8b090", "#a08860", "#e0d0b0", "#705838", "#b8a080", "#d8c8a8"],
      janus: ["#d0ccc0", "#a8a498", "#e8e4d8", "#787468", "#c0bcb0", "#989488"],
      epimetheus: ["#c8c0b0", "#a09888", "#e0d8c8", "#686058", "#b8b0a0", "#908878"],
      larissa: ["#7a7888", "#5a5868", "#9a98a8", "#3a3848", "#888098", "#605868"],
      proteus: ["#6a6870", "#4a4850", "#8a8890", "#2a2830", "#787880", "#505058"],
      nereid: ["#8a8890", "#6a6870", "#a8a8b0", "#4a4850", "#9898a0", "#707078"],
      weywot: ["#b8a090", "#908060", "#d0c0a0", "#605040", "#a89070", "#807060"],
      orcus: ["#e8f0f8", "#c0d0e0", "#ffffff", "#90a8c0", "#d8e4f0", "#a8c0d8"],
      varuna: ["#c0b8a8", "#908878", "#d8d0c0", "#605848", "#b0a898", "#807868"],
      ixion: ["#803028", "#601810", "#a04830", "#400808", "#903828", "#702018"],
      salacia: ["#9098a8", "#707888", "#b0b8c8", "#505868", "#a0a8b8", "#808898"],
      halley: ["#c8d0d8", "#9098a0", "#e0e8f0", "#606870", "#a8b0b8", "#787878", "#5a5040"],
      encke: ["#b8c0c8", "#889098", "#d0d8e0", "#586068", "#a0a8b0", "#707878", "#6a5848"],
      // Hyp / fiction (labeled — dreamer rails, not Sol)
      vulcan: ["#3a2018", "#5a2810", "#8a4018", "#1a1008", "#c06020", "#402010", "#e08030"],
      nemesis: ["#2a0810", "#401018", "#601828", "#100408", "#802030", "#180810", "#a02838"],
      tyche: ["#a0b8c8", "#708898", "#d0e0e8", "#405868", "#90a8b8", "#587088", "#c0d8e8"],
      planetnine: ["#406080", "#284858", "#6088a0", "#183040", "#80a8c0", "#305060", "#a0c0d8"],
      planetx: ["#607080", "#405060", "#8090a0", "#283848", "#a0b0c0", "#506070", "#c0c8d0"],
      nibiru: ["#501818", "#301010", "#702828", "#180808", "#903838", "#401010", "#a84830"],
      pbh: ["#080810", "#101018", "#181828", "#040408", "#282838", "#0c0c14", "#404060"],
      theia: ["#a07050", "#805038", "#c09060", "#503020", "#b08058", "#704028", "#d0a878"],
      phaeton: ["#8a7860", "#6a5840", "#b0a080", "#4a3828", "#c8b898", "#786850", "#d0c0a0"],
      ice: ["#e8f0f8", "#c8d8e8", "#ffffff", "#a0b8d0", "#d0e0f0", "#90a8c0"],
      haze: ["#c89858", "#a07040", "#e0b070", "#806030", "#d0a060"],
      venus: ["#e8d090", "#c8a858", "#a88840", "#f0e0a8", "#806830"],
      titan: ["#c87838", "#a05828", "#e09850", "#704020", "#d08848", "#503018"],
      europa: ["#e8f0f8", "#d0dce8", "#ffffff", "#a8c0d8", "#c0d0e0", "#8098b0"],
      plume: ["#f0f4f8", "#d8e4f0", "#ffffff", "#b0c8e0", "#e8f0ff"],
      gas: ["#c9a87a", "#e8c8a0", "#a88860", "#d8b890", "#8a7048"],
      deck: ["#4a5568", "#2a3548", "#6a7588", "#1a2538", "#808898"],
    };
    const pal = pals[biome] || pals.rock;
    g.fillStyle = pal[0];
    g.fillRect(0, 0, sz, sz);
    // Base noise mottling (scales with canvas — Ultra 4096 stays dense)
    const mottled = low ? 800 : Math.round((ultra ? 5200 : 2200) * (sz / (ultra ? 4096 : 1536)));
    for (let i = 0; i < mottled; i++) {
      const x = rnd() * sz;
      const y = rnd() * sz;
      const r = 2 + rnd() * (biome === "ice" ? 18 : 28);
      g.fillStyle = pal[(rnd() * pal.length) | 0];
      g.globalAlpha = 0.08 + rnd() * 0.22;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
    // Craters
    const craterN = biome === "deck" ? 8 : biome === "earth" ? 12 : biome === "gas" ? 6 : low ? 40 : Math.round(90 * (sz / 1536));
    for (let i = 0; i < craterN; i++) {
      const x = rnd() * sz;
      const y = rnd() * sz;
      const r = 6 + rnd() * (biome === "rock" || biome === "ice" ? 55 : 28);
      const grd = g.createRadialGradient(x, y, r * 0.15, x, y, r);
      grd.addColorStop(0, "rgba(20,18,16,0.55)");
      grd.addColorStop(0.55, "rgba(40,36,32,0.25)");
      grd.addColorStop(0.85, "rgba(200,190,180,0.18)");
      grd.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = grd;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
    // Earth: sparse vegetation patches
    if (biome === "earth") {
      for (let i = 0; i < (low ? 40 : 120); i++) {
        const x = rnd() * sz;
        const y = rnd() * sz;
        g.fillStyle = rnd() > 0.5 ? "rgba(40,90,30,0.45)" : "rgba(70,120,40,0.35)";
        g.fillRect(x, y, 8 + rnd() * 40, 6 + rnd() * 28);
      }
    }
    // Europa: dark lineae (science-accurate visual cue)
    if (biome === "europa" || biome === "ice") {
      for (let i = 0; i < (low ? 18 : 48); i++) {
        g.strokeStyle = "rgba(40,50,70," + (0.25 + rnd() * 0.35) + ")";
        g.lineWidth = 1 + rnd() * 3;
        g.beginPath();
        const x0 = rnd() * sz, y0 = rnd() * sz;
        g.moveTo(x0, y0);
        g.lineTo(x0 + (rnd() - 0.5) * sz * 0.6, y0 + (rnd() - 0.5) * sz * 0.6);
        g.stroke();
      }
    }
    // Titan: dark hydrocarbon lake patches
    if (biome === "titan") {
      for (let i = 0; i < (low ? 10 : 28); i++) {
        const x = rnd() * sz, y = rnd() * sz, r = 20 + rnd() * 70;
        const grd = g.createRadialGradient(x, y, r * 0.2, x, y, r);
        grd.addColorStop(0, "rgba(20,30,40,0.65)");
        grd.addColorStop(0.7, "rgba(40,50,45,0.35)");
        grd.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = grd;
        g.beginPath();
        g.ellipse(x, y, r, r * (0.45 + rnd() * 0.4), rnd() * Math.PI, 0, Math.PI * 2);
        g.fill();
      }
    }
    // Venus: dense sulfuric mottling
    if (biome === "venus") {
      for (let i = 0; i < (low ? 30 : 80); i++) {
        g.fillStyle = "rgba(200,180,100," + (0.08 + rnd() * 0.15) + ")";
        g.beginPath();
        g.arc(rnd() * sz, rnd() * sz, 10 + rnd() * 50, 0, Math.PI * 2);
        g.fill();
      }
    }
    // Enceladus plume frost streaks
    if (biome === "plume") {
      for (let i = 0; i < (low ? 20 : 55); i++) {
        g.strokeStyle = "rgba(220,235,255,0.45)";
        g.lineWidth = 1 + rnd() * 2;
        const x = rnd() * sz, y = rnd() * sz;
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + (rnd() - 0.5) * 30, y - 40 - rnd() * 80);
        g.stroke();
      }
    }
    // Luna: dark maria patches + bright highland rays
    if (biome === "luna") {
      for (let i = 0; i < (low ? 8 : 18); i++) {
        const x = rnd() * sz, y = rnd() * sz, r = 30 + rnd() * 90;
        const grd = g.createRadialGradient(x, y, r * 0.1, x, y, r);
        grd.addColorStop(0, "rgba(40,38,34,0.55)");
        grd.addColorStop(0.7, "rgba(70,66,58,0.28)");
        grd.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = grd;
        g.beginPath();
        g.arc(x, y, r, 0, Math.PI * 2);
        g.fill();
      }
      for (let i = 0; i < (low ? 6 : 14); i++) {
        const cx = rnd() * sz, cy = rnd() * sz;
        g.strokeStyle = "rgba(230,225,210," + (0.12 + rnd() * 0.2) + ")";
        g.lineWidth = 1 + rnd() * 2;
        for (let a = 0; a < Math.PI * 2; a += 0.35 + rnd() * 0.4) {
          g.beginPath();
          g.moveTo(cx, cy);
          g.lineTo(cx + Math.cos(a) * (40 + rnd() * 120), cy + Math.sin(a) * (40 + rnd() * 120));
          g.stroke();
        }
      }
    }
    // Mercury: hot grey-tan + bright ray craters
    if (biome === "mercury") {
      for (let i = 0; i < (low ? 10 : 22); i++) {
        const x = rnd() * sz, y = rnd() * sz, r = 12 + rnd() * 50;
        const grd = g.createRadialGradient(x, y, 2, x, y, r);
        grd.addColorStop(0, "rgba(240,230,200,0.45)");
        grd.addColorStop(0.4, "rgba(180,160,120,0.2)");
        grd.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = grd;
        g.beginPath();
        g.arc(x, y, r, 0, Math.PI * 2);
        g.fill();
      }
      for (let i = 0; i < 20; i++) {
        g.fillStyle = "rgba(60,50,40," + (0.08 + rnd() * 0.12) + ")";
        g.fillRect(rnd() * sz, rnd() * sz, 40 + rnd() * 80, 8 + rnd() * 20);
      }
    }
    // Callisto: dense ancient crater field (dark ice-rock)
    if (biome === "callisto") {
      for (let i = 0; i < (low ? 60 : 140); i++) {
        const x = rnd() * sz, y = rnd() * sz, r = 4 + rnd() * 28;
        g.strokeStyle = "rgba(200,190,160," + (0.15 + rnd() * 0.25) + ")";
        g.lineWidth = 1 + rnd() * 2;
        g.beginPath();
        g.arc(x, y, r, 0, Math.PI * 2);
        g.stroke();
        g.fillStyle = "rgba(30,28,22,0.35)";
        g.beginPath();
        g.arc(x, y, r * 0.45, 0, Math.PI * 2);
        g.fill();
      }
    }
    // Ganymede: bright/dark terrain + sulci grooves
    if (biome === "ganymede") {
      for (let i = 0; i < (low ? 12 : 28); i++) {
        g.fillStyle = rnd() > 0.5 ? "rgba(210,200,180,0.28)" : "rgba(60,55,45,0.3)";
        g.beginPath();
        g.ellipse(rnd() * sz, rnd() * sz, 40 + rnd() * 90, 25 + rnd() * 50, rnd() * Math.PI, 0, Math.PI * 2);
        g.fill();
      }
      for (let i = 0; i < (low ? 20 : 50); i++) {
        g.strokeStyle = "rgba(180,170,150," + (0.2 + rnd() * 0.3) + ")";
        g.lineWidth = 1 + rnd() * 2.5;
        const x0 = rnd() * sz, y0 = rnd() * sz;
        g.beginPath();
        g.moveTo(x0, y0);
        g.lineTo(x0 + (rnd() - 0.5) * sz * 0.5, y0 + (rnd() - 0.5) * 40);
        g.stroke();
      }
    }
    // Io: sulfur plains + lava vents
    if (biome === "io") {
      for (let i = 0; i < (low ? 20 : 50); i++) {
        g.fillStyle = "rgba(255,80,40," + (0.12 + rnd() * 0.25) + ")";
        g.beginPath();
        g.arc(rnd() * sz, rnd() * sz, 6 + rnd() * 28, 0, Math.PI * 2);
        g.fill();
      }
      for (let i = 0; i < (low ? 15 : 40); i++) {
        g.fillStyle = "rgba(220,180,40," + (0.15 + rnd() * 0.2) + ")";
        g.fillRect(rnd() * sz, rnd() * sz, 20 + rnd() * 60, 10 + rnd() * 30);
      }
    }
    // Triton: cantaloupe dimples + N2 frost
    if (biome === "triton") {
      for (let i = 0; i < (low ? 30 : 70); i++) {
        const x = rnd() * sz, y = rnd() * sz, r = 8 + rnd() * 22;
        g.strokeStyle = "rgba(80,90,100,0.35)";
        g.lineWidth = 1.5;
        g.beginPath();
        g.arc(x, y, r, 0, Math.PI * 2);
        g.stroke();
        g.fillStyle = "rgba(160,150,130,0.18)";
        g.beginPath();
        g.arc(x, y, r * 0.7, 0, Math.PI * 2);
        g.fill();
      }
      for (let i = 0; i < (low ? 12 : 30); i++) {
        g.fillStyle = "rgba(240,248,255," + (0.15 + rnd() * 0.25) + ")";
        g.beginPath();
        g.ellipse(rnd() * sz, rnd() * sz, 20 + rnd() * 50, 10 + rnd() * 25, rnd(), 0, Math.PI * 2);
        g.fill();
      }
    }
    // Pluto: Tombaugh-ish bright heart + tholin red
    if (biome === "pluto") {
      const hx = sz * 0.42, hy = sz * 0.48;
      g.fillStyle = "rgba(248,240,235,0.55)";
      g.beginPath();
      g.ellipse(hx, hy, sz * 0.22, sz * 0.16, -0.3, 0, Math.PI * 2);
      g.fill();
      g.beginPath();
      g.ellipse(hx + sz * 0.12, hy + sz * 0.02, sz * 0.14, sz * 0.12, 0.4, 0, Math.PI * 2);
      g.fill();
      for (let i = 0; i < (low ? 18 : 40); i++) {
        g.fillStyle = "rgba(160,70,50," + (0.12 + rnd() * 0.22) + ")";
        g.beginPath();
        g.arc(rnd() * sz, rnd() * sz, 15 + rnd() * 45, 0, Math.PI * 2);
        g.fill();
      }
    }
    // Ceres: Occator-style bright salt spots
    if (biome === "ceres") {
      for (let i = 0; i < (low ? 6 : 14); i++) {
        const x = rnd() * sz, y = rnd() * sz, r = 8 + rnd() * 28;
        const grd = g.createRadialGradient(x, y, 1, x, y, r);
        grd.addColorStop(0, "rgba(255,255,255,0.75)");
        grd.addColorStop(0.35, "rgba(220,230,240,0.4)");
        grd.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = grd;
        g.beginPath();
        g.arc(x, y, r, 0, Math.PI * 2);
        g.fill();
      }
    }
    // Phobos: dark rubble + Stickney-scale bowl
    if (biome === "phobos") {
      const sx = sz * 0.35, sy = sz * 0.4, sr = sz * 0.22;
      const grd = g.createRadialGradient(sx, sy, sr * 0.2, sx, sy, sr);
      grd.addColorStop(0, "rgba(20,18,16,0.7)");
      grd.addColorStop(0.6, "rgba(50,44,38,0.4)");
      grd.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = grd;
      g.beginPath();
      g.ellipse(sx, sy, sr, sr * 0.75, 0.2, 0, Math.PI * 2);
      g.fill();
      for (let i = 0; i < (low ? 40 : 90); i++) {
        g.fillStyle = "rgba(30,28,24," + (0.15 + rnd() * 0.3) + ")";
        g.fillRect(rnd() * sz, rnd() * sz, 3 + rnd() * 12, 2 + rnd() * 8);
      }
    }
    // Deimos: smoother rubble (less Stickney drama)
    if (biome === "deimos") {
      for (let i = 0; i < (low ? 25 : 55); i++) {
        g.fillStyle = "rgba(40,36,32," + (0.1 + rnd() * 0.2) + ")";
        g.fillRect(rnd() * sz, rnd() * sz, 4 + rnd() * 18, 3 + rnd() * 10);
      }
      for (let i = 0; i < (low ? 8 : 16); i++) {
        const x = rnd() * sz, y = rnd() * sz, r = 10 + rnd() * 35;
        g.strokeStyle = "rgba(180,170,160,0.2)";
        g.lineWidth = 1 + rnd();
        g.beginPath();
        g.arc(x, y, r, 0, Math.PI * 2);
        g.stroke();
      }
    }
    // Mimas: Herschel mega-crater
    if (biome === "mimas") {
      const hx = sz * 0.38, hy = sz * 0.42, hr = sz * 0.28;
      const grd = g.createRadialGradient(hx, hy, hr * 0.15, hx, hy, hr);
      grd.addColorStop(0, "rgba(30,28,24,0.65)");
      grd.addColorStop(0.55, "rgba(80,76,70,0.35)");
      grd.addColorStop(0.82, "rgba(220,210,190,0.35)");
      grd.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = grd;
      g.beginPath();
      g.arc(hx, hy, hr, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = "rgba(240,230,210,0.4)";
      g.lineWidth = 3 + rnd() * 2;
      g.beginPath();
      g.arc(hx, hy, hr * 0.92, 0, Math.PI * 2);
      g.stroke();
    }
    // Iapetus: two-tone albedo (Cassini Regio vs bright trailing)
    if (biome === "iapetus") {
      g.fillStyle = "rgba(20,18,12,0.55)";
      g.fillRect(0, 0, sz * 0.48, sz);
      for (let i = 0; i < (low ? 20 : 45); i++) {
        g.fillStyle = "rgba(240,230,210," + (0.08 + rnd() * 0.15) + ")";
        g.beginPath();
        g.arc(sz * 0.55 + rnd() * sz * 0.4, rnd() * sz, 15 + rnd() * 50, 0, Math.PI * 2);
        g.fill();
      }
      // equatorial ridge hint
      g.strokeStyle = "rgba(100,90,70,0.45)";
      g.lineWidth = 4;
      g.beginPath();
      g.moveTo(0, sz * 0.5);
      g.lineTo(sz, sz * 0.5);
      g.stroke();
    }
    // Miranda: coronae + cliff scars (Verona Rupes vibe)
    if (biome === "miranda") {
      for (let i = 0; i < (low ? 6 : 12); i++) {
        const x = rnd() * sz, y = rnd() * sz, r = 40 + rnd() * 80;
        g.strokeStyle = "rgba(60,60,55," + (0.25 + rnd() * 0.3) + ")";
        g.lineWidth = 2 + rnd() * 3;
        g.beginPath();
        g.arc(x, y, r, 0, Math.PI * 2);
        g.stroke();
        g.strokeStyle = "rgba(200,200,190,0.2)";
        g.beginPath();
        g.arc(x, y, r * 0.6, 0, Math.PI * 2);
        g.stroke();
      }
      for (let i = 0; i < (low ? 8 : 18); i++) {
        g.strokeStyle = "rgba(40,40,35,0.4)";
        g.lineWidth = 2 + rnd() * 4;
        const x0 = rnd() * sz, y0 = rnd() * sz;
        g.beginPath();
        g.moveTo(x0, y0);
        g.lineTo(x0 + (rnd() - 0.5) * sz * 0.5, y0 + 20 + rnd() * 60);
        g.stroke();
      }
    }
    // Rhea: bright cratered ice
    if (biome === "rhea") {
      for (let i = 0; i < (low ? 40 : 90); i++) {
        const x = rnd() * sz, y = rnd() * sz, r = 5 + rnd() * 22;
        g.strokeStyle = "rgba(255,255,255," + (0.15 + rnd() * 0.25) + ")";
        g.lineWidth = 1 + rnd();
        g.beginPath();
        g.arc(x, y, r, 0, Math.PI * 2);
        g.stroke();
      }
    }
    // Dione: wispy bright fractures
    if (biome === "dione") {
      for (let i = 0; i < (low ? 22 : 55); i++) {
        g.strokeStyle = "rgba(240,245,255," + (0.2 + rnd() * 0.35) + ")";
        g.lineWidth = 1 + rnd() * 2.5;
        const x0 = rnd() * sz, y0 = rnd() * sz;
        g.beginPath();
        g.moveTo(x0, y0);
        g.lineTo(x0 + (rnd() - 0.5) * sz * 0.55, y0 + (rnd() - 0.5) * sz * 0.4);
        g.stroke();
      }
    }
    // Tethys: Odysseus-scale bowl + bright ice
    if (biome === "tethys") {
      const ox = sz * 0.55, oy = sz * 0.4, or_ = sz * 0.24;
      const grd = g.createRadialGradient(ox, oy, or_ * 0.2, ox, oy, or_);
      grd.addColorStop(0, "rgba(40,48,55,0.5)");
      grd.addColorStop(0.7, "rgba(180,190,200,0.25)");
      grd.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = grd;
      g.beginPath();
      g.arc(ox, oy, or_, 0, Math.PI * 2);
      g.fill();
    }
    // Vesta: Rheasilvia basin + eucrite mottling
    if (biome === "vesta") {
      const vx = sz * 0.5, vy = sz * 0.55, vr = sz * 0.32;
      const grd = g.createRadialGradient(vx, vy, vr * 0.1, vx, vy, vr);
      grd.addColorStop(0, "rgba(50,40,30,0.55)");
      grd.addColorStop(0.5, "rgba(120,100,70,0.3)");
      grd.addColorStop(0.85, "rgba(220,200,160,0.25)");
      grd.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = grd;
      g.beginPath();
      g.arc(vx, vy, vr, 0, Math.PI * 2);
      g.fill();
      for (let i = 0; i < 25; i++) {
        g.fillStyle = "rgba(90,70,50," + (0.1 + rnd() * 0.15) + ")";
        g.fillRect(rnd() * sz, rnd() * sz, 30 + rnd() * 70, 8 + rnd() * 20);
      }
    }
    // Eris: cold dark ice dwarf
    if (biome === "eris") {
      for (let i = 0; i < (low ? 15 : 35); i++) {
        g.fillStyle = "rgba(200,210,220," + (0.08 + rnd() * 0.15) + ")";
        g.beginPath();
        g.ellipse(rnd() * sz, rnd() * sz, 20 + rnd() * 60, 10 + rnd() * 30, rnd(), 0, Math.PI * 2);
        g.fill();
      }
    }
    // Haumea: elongated bright streaks (rapid rotator cue)
    if (biome === "haumea") {
      for (let i = 0; i < (low ? 12 : 28); i++) {
        g.strokeStyle = "rgba(230,220,255," + (0.15 + rnd() * 0.25) + ")";
        g.lineWidth = 3 + rnd() * 8;
        const y = rnd() * sz;
        g.beginPath();
        g.moveTo(0, y);
        g.lineTo(sz, y + (rnd() - 0.5) * 40);
        g.stroke();
      }
    }
    // Hiʻiaka: bright crystalline ice (Haumea family)
    if (biome === "hiiaka") {
      for (let i = 0; i < (low ? 18 : 42); i++) {
        g.fillStyle = "rgba(230,240,255," + (0.12 + rnd() * 0.28) + ")";
        g.beginPath();
        g.arc(rnd() * sz, rnd() * sz, 10 + rnd() * 36, 0, Math.PI * 2);
        g.fill();
      }
      g.strokeStyle = "rgba(180,200,230,0.28)";
      g.lineWidth = 1.5;
      for (let i = 0; i < (low ? 12 : 28); i++) {
        g.beginPath();
        let x = rnd() * sz, y = rnd() * sz;
        g.moveTo(x, y);
        for (let k = 0; k < 4; k++) { x += (rnd() - 0.5) * 40; y += (rnd() - 0.5) * 40; g.lineTo(x, y); }
        g.stroke();
      }
    }
    // Namaka: smaller cooler ice sibling
    if (biome === "namaka") {
      for (let i = 0; i < (low ? 16 : 38); i++) {
        g.fillStyle = "rgba(160,180,200," + (0.1 + rnd() * 0.22) + ")";
        g.beginPath();
        g.ellipse(rnd() * sz, rnd() * sz, 14 + rnd() * 40, 8 + rnd() * 22, rnd(), 0, Math.PI * 2);
        g.fill();
      }
      for (let i = 0; i < (low ? 10 : 22); i++) {
        g.strokeStyle = "rgba(100,120,140," + (0.2 + rnd() * 0.25) + ")";
        g.lineWidth = 1 + rnd() * 2;
        const x0 = rnd() * sz, y0 = rnd() * sz;
        g.beginPath();
        g.moveTo(x0, y0);
        g.lineTo(x0 + (rnd() - 0.5) * sz * 0.4, y0 + (rnd() - 0.5) * sz * 0.4);
        g.stroke();
      }
    }
    // Dysnomia: darker Eris-family ice-rock
    if (biome === "dysnomia") {
      for (let i = 0; i < (low ? 20 : 48); i++) {
        g.fillStyle = "rgba(40,48,58," + (0.18 + rnd() * 0.3) + ")";
        g.beginPath();
        g.arc(rnd() * sz, rnd() * sz, 8 + rnd() * 32, 0, Math.PI * 2);
        g.fill();
      }
      for (let i = 0; i < (low ? 12 : 28); i++) {
        g.fillStyle = "rgba(180,190,200," + (0.08 + rnd() * 0.18) + ")";
        g.beginPath();
        g.arc(rnd() * sz, rnd() * sz, 6 + rnd() * 20, 0, Math.PI * 2);
        g.fill();
      }
    }
    // Makemake: red tholin mottling
    if (biome === "makemake") {
      for (let i = 0; i < (low ? 25 : 60); i++) {
        g.fillStyle = "rgba(180,60,40," + (0.12 + rnd() * 0.25) + ")";
        g.beginPath();
        g.arc(rnd() * sz, rnd() * sz, 12 + rnd() * 45, 0, Math.PI * 2);
        g.fill();
      }
    }
    // Sedna: deep red eccentric TNO
    if (biome === "sedna") {
      for (let i = 0; i < (low ? 20 : 50); i++) {
        g.fillStyle = "rgba(140,30,20," + (0.15 + rnd() * 0.3) + ")";
        g.beginPath();
        g.arc(rnd() * sz, rnd() * sz, 15 + rnd() * 55, 0, Math.PI * 2);
        g.fill();
      }
      for (let i = 0; i < 10; i++) {
        g.fillStyle = "rgba(255,120,80,0.12)";
        g.beginPath();
        g.ellipse(rnd() * sz, rnd() * sz, 30 + rnd() * 50, 12 + rnd() * 20, rnd(), 0, Math.PI * 2);
        g.fill();
      }
    }
    // Charon: Mordor Macula red pole + grey terrain
    if (biome === "nix") {
      // Pale ice chips. Not Pluto's tholin heart and not Charon's red pole.
      g.fillStyle = "rgba(255,252,246,0.55)";
      for (let i = 0; i < 18; i++) {
        g.beginPath();
        g.arc(rnd() * sz, rnd() * sz, 4 + rnd() * 14, 0, Math.PI * 2);
        g.fill();
      }
    }
    if (biome === "charon") {
      const cx = sz * 0.5, cy = sz * 0.18, cr = sz * 0.22;
      const grd = g.createRadialGradient(cx, cy, cr * 0.2, cx, cy, cr);
      grd.addColorStop(0, "rgba(120,40,35,0.65)");
      grd.addColorStop(0.7, "rgba(80,40,35,0.35)");
      grd.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = grd;
      g.beginPath();
      g.arc(cx, cy, cr, 0, Math.PI * 2);
      g.fill();
      for (let i = 0; i < (low ? 15 : 35); i++) {
        g.fillStyle = "rgba(90,80,70," + (0.1 + rnd() * 0.2) + ")";
        g.beginPath();
        g.arc(rnd() * sz, sz * 0.4 + rnd() * sz * 0.55, 10 + rnd() * 40, 0, Math.PI * 2);
        g.fill();
      }
    }
        // Ariel: bright fault valleys
    if (biome === "ariel") {
      for (let i = 0; i < (low ? 18 : 40); i++) {
        g.strokeStyle = "rgba(40,45,55," + (0.25 + rnd() * 0.3) + ")";
        g.lineWidth = 2 + rnd() * 3;
        const x0 = rnd() * sz, y0 = rnd() * sz;
        g.beginPath();
        g.moveTo(x0, y0);
        g.lineTo(x0 + (rnd() - 0.5) * sz * 0.5, y0 + (rnd() - 0.5) * 30);
        g.stroke();
      }
    }
    // Umbriel: dark ancient face
    if (biome === "umbriel") {
      for (let i = 0; i < (low ? 30 : 70); i++) {
        const x = rnd() * sz, y = rnd() * sz, r = 5 + rnd() * 25;
        g.fillStyle = "rgba(20,20,24,0.4)";
        g.beginPath();
        g.arc(x, y, r * 0.5, 0, Math.PI * 2);
        g.fill();
        g.strokeStyle = "rgba(140,140,150,0.2)";
        g.beginPath();
        g.arc(x, y, r, 0, Math.PI * 2);
        g.stroke();
      }
    }
    // Titania: canyon faults
    if (biome === "titania") {
      for (let i = 0; i < (low ? 12 : 28); i++) {
        g.strokeStyle = "rgba(50,50,60,0.4)";
        g.lineWidth = 3 + rnd() * 5;
        const y = rnd() * sz;
        g.beginPath();
        g.moveTo(0, y);
        for (let x = 0; x < sz; x += 30) g.lineTo(x, y + Math.sin(x * 0.01 + i) * 15);
        g.stroke();
      }
    }
    // Oberon: dark cratered ice
    if (biome === "oberon") {
      for (let i = 0; i < (low ? 35 : 80); i++) {
        const x = rnd() * sz, y = rnd() * sz, r = 4 + rnd() * 22;
        g.strokeStyle = "rgba(200,190,170,0.22)";
        g.lineWidth = 1;
        g.beginPath();
        g.arc(x, y, r, 0, Math.PI * 2);
        g.stroke();
      }
    }
        // Quaoar: warm grey TNO mottling
    if (biome === "quaoar") {
      for (let i = 0; i < (low ? 20 : 45); i++) {
        g.fillStyle = "rgba(180,160,120," + (0.1 + rnd() * 0.2) + ")";
        g.beginPath();
        g.arc(rnd() * sz, rnd() * sz, 12 + rnd() * 40, 0, Math.PI * 2);
        g.fill();
      }
    }
    // Gonggong: deep red eccentric
    if (biome === "gonggong") {
      for (let i = 0; i < (low ? 18 : 42); i++) {
        g.fillStyle = "rgba(160,50,40," + (0.12 + rnd() * 0.25) + ")";
        g.beginPath();
        g.arc(rnd() * sz, rnd() * sz, 14 + rnd() * 48, 0, Math.PI * 2);
        g.fill();
      }
    }
        // Psyche: metallic flecks (M-type cue)
    if (biome === "psyche") {
      for (let i = 0; i < (low ? 40 : 100); i++) {
        g.fillStyle = "rgba(200,210,220," + (0.15 + rnd() * 0.35) + ")";
        g.fillRect(rnd() * sz, rnd() * sz, 2 + rnd() * 8, 2 + rnd() * 6);
      }
      for (let i = 0; i < 15; i++) {
        g.strokeStyle = "rgba(160,170,180,0.25)";
        g.lineWidth = 1;
        g.beginPath();
        g.arc(rnd() * sz, rnd() * sz, 8 + rnd() * 30, 0, Math.PI * 2);
        g.stroke();
      }
    }
    // Phoebe: dark irregular capture
    if (biome === "phoebe") {
      for (let i = 0; i < (low ? 35 : 80); i++) {
        g.fillStyle = "rgba(20,16,12," + (0.2 + rnd() * 0.35) + ")";
        g.beginPath();
        g.arc(rnd() * sz, rnd() * sz, 6 + rnd() * 28, 0, Math.PI * 2);
        g.fill();
      }
    }
    // Pallas: high-inclination B-type mottling
    if (biome === "pallas") {
      for (let i = 0; i < (low ? 25 : 55); i++) {
        g.fillStyle = "rgba(90,100,120," + (0.12 + rnd() * 0.22) + ")";
        g.beginPath();
        g.arc(rnd() * sz, rnd() * sz, 10 + rnd() * 36, 0, Math.PI * 2);
        g.fill();
      }
      for (let i = 0; i < (low ? 12 : 28); i++) {
        g.strokeStyle = "rgba(180,190,200,0.2)";
        g.lineWidth = 1;
        g.beginPath();
        g.arc(rnd() * sz, rnd() * sz, 6 + rnd() * 20, 0, Math.PI * 2);
        g.stroke();
      }
    }
    // Eros: elongated NEA striations
    if (biome === "eros") {
      for (let i = 0; i < (low ? 14 : 32); i++) {
        g.strokeStyle = "rgba(90,60,40," + (0.2 + rnd() * 0.25) + ")";
        g.lineWidth = 3 + rnd() * 8;
        const y = rnd() * sz;
        g.beginPath();
        g.moveTo(0, y);
        for (let x = 0; x < sz; x += 24) g.lineTo(x, y + Math.sin(x * 0.015 + i) * 18);
        g.stroke();
      }
      for (let i = 0; i < (low ? 20 : 45); i++) {
        g.fillStyle = "rgba(60,40,28,0.25)";
        g.beginPath();
        g.ellipse(rnd() * sz, rnd() * sz, 8 + rnd() * 22, 4 + rnd() * 10, rnd() * Math.PI, 0, Math.PI * 2);
        g.fill();
      }
    }
    // Ida: belt crater field + Dactyl-scale pebbles
    if (biome === "ida") {
      for (let i = 0; i < (low ? 30 : 70); i++) {
        const x = rnd() * sz, y = rnd() * sz, r = 4 + rnd() * 18;
        g.strokeStyle = "rgba(40,35,30,0.35)";
        g.lineWidth = 1.5;
        g.beginPath();
        g.arc(x, y, r, 0, Math.PI * 2);
        g.stroke();
        g.fillStyle = "rgba(50,45,38,0.2)";
        g.beginPath();
        g.arc(x, y, r * 0.55, 0, Math.PI * 2);
        g.fill();
      }
    }
    // Amalthea: red potato mottling
    if (biome === "amalthea") {
      for (let i = 0; i < (low ? 22 : 50); i++) {
        g.fillStyle = "rgba(160,60,40," + (0.15 + rnd() * 0.3) + ")";
        g.beginPath();
        g.ellipse(rnd() * sz, rnd() * sz, 14 + rnd() * 40, 8 + rnd() * 22, rnd() * Math.PI, 0, Math.PI * 2);
        g.fill();
      }
      for (let i = 0; i < 12; i++) {
        g.fillStyle = "rgba(40,16,10,0.35)";
        g.beginPath();
        g.arc(rnd() * sz, rnd() * sz, 5 + rnd() * 14, 0, Math.PI * 2);
        g.fill();
      }
    }
    // Dactyl: tiny pebble grit
    if (biome === "dactyl") {
      for (let i = 0; i < (low ? 40 : 90); i++) {
        g.fillStyle = "rgba(40,35,30," + (0.15 + rnd() * 0.3) + ")";
        g.fillRect(rnd() * sz, rnd() * sz, 2 + rnd() * 5, 2 + rnd() * 5);
      }
    }
    // Himalia: captured irregular mottling
    if (biome === "himalia") {
      for (let i = 0; i < (low ? 28 : 60); i++) {
        g.fillStyle = "rgba(70,60,48," + (0.15 + rnd() * 0.25) + ")";
        g.beginPath();
        g.arc(rnd() * sz, rnd() * sz, 8 + rnd() * 30, 0, Math.PI * 2);
        g.fill();
      }
    }
    // Hyperion: spongy voids (low-density ice cue)
    if (biome === "hyperion") {
      for (let i = 0; i < (low ? 35 : 85); i++) {
        const x = rnd() * sz, y = rnd() * sz, r = 6 + rnd() * 28;
        g.fillStyle = "rgba(30,24,18," + (0.35 + rnd() * 0.4) + ")";
        g.beginPath();
        g.arc(x, y, r, 0, Math.PI * 2);
        g.fill();
        g.strokeStyle = "rgba(200,180,140,0.25)";
        g.lineWidth = 1.5;
        g.beginPath();
        g.arc(x, y, r * 1.15, 0, Math.PI * 2);
        g.stroke();
      }
    }
    // Janus / Epimetheus: co-orbital bright rubble
    if (biome === "janus" || biome === "epimetheus") {
      for (let i = 0; i < (low ? 25 : 55); i++) {
        g.fillStyle = "rgba(220,210,190," + (0.1 + rnd() * 0.2) + ")";
        g.beginPath();
        g.arc(rnd() * sz, rnd() * sz, 6 + rnd() * 22, 0, Math.PI * 2);
        g.fill();
      }
      for (let i = 0; i < (low ? 15 : 35); i++) {
        g.strokeStyle = "rgba(60,55,48,0.3)";
        g.lineWidth = 1;
        g.beginPath();
        g.arc(rnd() * sz, rnd() * sz, 5 + rnd() * 16, 0, Math.PI * 2);
        g.stroke();
      }
    }
    // Larissa: Neptune inner dark ice-rock
    if (biome === "larissa") {
      for (let i = 0; i < (low ? 28 : 65); i++) {
        g.fillStyle = "rgba(40,38,55," + (0.18 + rnd() * 0.28) + ")";
        g.beginPath();
        g.arc(rnd() * sz, rnd() * sz, 5 + rnd() * 20, 0, Math.PI * 2);
        g.fill();
      }
    }
    // Proteus: dark irregular facets
    if (biome === "proteus") {
      for (let i = 0; i < (low ? 30 : 70); i++) {
        g.fillStyle = "rgba(24,22,28," + (0.2 + rnd() * 0.35) + ")";
        g.beginPath();
        g.moveTo(rnd() * sz, rnd() * sz);
        for (let k = 0; k < 5; k++) g.lineTo(rnd() * sz, rnd() * sz);
        g.closePath();
        g.fill();
      }
    }
    // Nereid: distant eccentric grit
    if (biome === "nereid") {
      for (let i = 0; i < (low ? 22 : 48); i++) {
        g.fillStyle = "rgba(80,78,90," + (0.12 + rnd() * 0.22) + ")";
        g.beginPath();
        g.arc(rnd() * sz, rnd() * sz, 8 + rnd() * 28, 0, Math.PI * 2);
        g.fill();
      }
    }
    // Weywot: warm Quaoar-moon dust
    if (biome === "weywot") {
      for (let i = 0; i < (low ? 18 : 40); i++) {
        g.fillStyle = "rgba(160,140,100," + (0.1 + rnd() * 0.2) + ")";
        g.beginPath();
        g.arc(rnd() * sz, rnd() * sz, 10 + rnd() * 32, 0, Math.PI * 2);
        g.fill();
      }
    }
    // Orcus: bright ice patches
    if (biome === "orcus") {
      for (let i = 0; i < (low ? 20 : 48); i++) {
        g.fillStyle = "rgba(240,248,255," + (0.15 + rnd() * 0.3) + ")";
        g.beginPath();
        g.arc(rnd() * sz, rnd() * sz, 12 + rnd() * 40, 0, Math.PI * 2);
        g.fill();
      }
      g.strokeStyle = "rgba(60,90,120,0.3)";
      g.lineWidth = 1.5;
      for (let i = 0; i < 20; i++) {
        g.beginPath();
        let x = rnd() * sz, y = rnd() * sz;
        g.moveTo(x, y);
        for (let k = 0; k < 4; k++) { x += (rnd() - 0.5) * 35; y += (rnd() - 0.5) * 35; g.lineTo(x, y); }
        g.stroke();
      }
    }
    // Varuna: elongated classical banding
    if (biome === "varuna") {
      for (let i = 0; i < (low ? 12 : 26); i++) {
        g.strokeStyle = "rgba(80,70,55," + (0.18 + rnd() * 0.22) + ")";
        g.lineWidth = 4 + rnd() * 10;
        const y = rnd() * sz;
        g.beginPath();
        g.moveTo(0, y);
        for (let x = 0; x < sz; x += 28) g.lineTo(x, y + Math.sin(x * 0.012 + i) * 10);
        g.stroke();
      }
    }
    // Ixion: dark red tholin
    if (biome === "ixion") {
      for (let i = 0; i < (low ? 22 : 50); i++) {
        g.fillStyle = "rgba(120,30,20," + (0.15 + rnd() * 0.3) + ")";
        g.beginPath();
        g.arc(rnd() * sz, rnd() * sz, 12 + rnd() * 42, 0, Math.PI * 2);
        g.fill();
      }
    }
    // Salacia: blue-grey KBO frost
    if (biome === "salacia") {
      for (let i = 0; i < (low ? 18 : 42); i++) {
        g.fillStyle = "rgba(160,180,210," + (0.1 + rnd() * 0.22) + ")";
        g.beginPath();
        g.arc(rnd() * sz, rnd() * sz, 10 + rnd() * 36, 0, Math.PI * 2);
        g.fill();
      }
    }
    // Halley: dirty snow + dark organics
    if (biome === "halley") {
      for (let i = 0; i < (low ? 30 : 70); i++) {
        g.fillStyle = "rgba(40,36,30," + (0.2 + rnd() * 0.35) + ")";
        g.beginPath();
        g.arc(rnd() * sz, rnd() * sz, 5 + rnd() * 24, 0, Math.PI * 2);
        g.fill();
      }
      for (let i = 0; i < (low ? 15 : 35); i++) {
        g.fillStyle = "rgba(220,230,240," + (0.12 + rnd() * 0.2) + ")";
        g.beginPath();
        g.arc(rnd() * sz, rnd() * sz, 8 + rnd() * 28, 0, Math.PI * 2);
        g.fill();
      }
    }
    // Encke: short-period dusty ice
    if (biome === "encke") {
      for (let i = 0; i < (low ? 25 : 55); i++) {
        g.fillStyle = "rgba(90,80,60," + (0.15 + rnd() * 0.28) + ")";
        g.beginPath();
        g.arc(rnd() * sz, rnd() * sz, 6 + rnd() * 26, 0, Math.PI * 2);
        g.fill();
      }
      g.strokeStyle = "rgba(180,200,220,0.2)";
      g.lineWidth = 1;
      for (let i = 0; i < 18; i++) {
        g.beginPath();
        let x = rnd() * sz, y = rnd() * sz;
        g.moveTo(x, y);
        for (let k = 0; k < 5; k++) { x += (rnd() - 0.5) * 30; y += (rnd() - 0.5) * 30; g.lineTo(x, y); }
        g.stroke();
      }
    }
        // Mars dunes bands
    if (biome === "mars") {
      for (let i = 0; i < 18; i++) {
        g.strokeStyle = "rgba(90,40,25,0.2)";
        g.lineWidth = 4 + rnd() * 10;
        g.beginPath();
        const y = rnd() * sz;
        g.moveTo(0, y);
        for (let x = 0; x < sz; x += 20) g.lineTo(x, y + Math.sin(x * 0.02 + i) * 12);
        g.stroke();
      }
    }
    // Ice cracks
    if (biome === "ice") {
      g.strokeStyle = "rgba(60,90,120,0.35)";
      g.lineWidth = 1.5;
      for (let i = 0; i < 35; i++) {
        g.beginPath();
        let x = rnd() * sz;
        let y = rnd() * sz;
        g.moveTo(x, y);
        for (let k = 0; k < 6; k++) {
          x += (rnd() - 0.5) * 40;
          y += (rnd() - 0.5) * 40;
          g.lineTo(x, y);
        }
        g.stroke();
      }
    }

    // Hyp · Vulcan: scorched intra-Mercurial rock (fiction)
    if (biome === "vulcan") {
      for (let i = 0; i < (low ? 22 : 55); i++) {
        g.fillStyle = "rgba(200,80,30," + (0.12 + rnd() * 0.3) + ")";
        g.beginPath();
        g.arc(rnd() * sz, rnd() * sz, 8 + rnd() * 40, 0, Math.PI * 2);
        g.fill();
      }
      for (let i = 0; i < (low ? 8 : 18); i++) {
        g.strokeStyle = "rgba(255,120,40," + (0.15 + rnd() * 0.25) + ")";
        g.lineWidth = 2 + rnd() * 4;
        const x0 = rnd() * sz, y0 = rnd() * sz;
        g.beginPath();
        g.moveTo(x0, y0);
        g.lineTo(x0 + (rnd() - 0.5) * 80, y0 + (rnd() - 0.5) * 40);
        g.stroke();
      }
    }
    // Hyp · Nemesis: dim red-dwarf ember (fiction / unsupported)
    if (biome === "nemesis") {
      for (let i = 0; i < (low ? 18 : 45); i++) {
        const x = rnd() * sz, y = rnd() * sz, r = 12 + rnd() * 50;
        const grd = g.createRadialGradient(x, y, r * 0.1, x, y, r);
        grd.addColorStop(0, "rgba(180,40,50," + (0.35 + rnd() * 0.25) + ")");
        grd.addColorStop(0.6, "rgba(80,20,30,0.2)");
        grd.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = grd;
        g.beginPath();
        g.arc(x, y, r, 0, Math.PI * 2);
        g.fill();
      }
    }
    // Hyp · Tyche: cold Oort gas bands (fiction)
    if (biome === "tyche") {
      for (let i = 0; i < 22; i++) {
        const y = (i / 22) * sz;
        g.fillStyle = i % 2 ? "rgba(180,210,230,0.14)" : "rgba(40,60,80,0.16)";
        g.fillRect(0, y, sz, sz / 22 + 2);
      }
      const ox = sz * 0.4, oy = sz * 0.55, rx = sz * 0.16, ry = sz * 0.09;
      const grd = g.createRadialGradient(ox, oy, 2, ox, oy, rx);
      grd.addColorStop(0, "rgba(120,180,220,0.4)");
      grd.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = grd;
      g.beginPath();
      g.ellipse(ox, oy, rx, ry, 0.15, 0, Math.PI * 2);
      g.fill();
    }
    // Hyp · Planet Nine: distant ice-giant teal (unconfirmed science hyp)
    if (biome === "planetnine") {
      for (let i = 0; i < 18; i++) {
        g.fillStyle = i % 2 ? "rgba(80,140,180,0.14)" : "rgba(30,50,70,0.12)";
        g.fillRect(0, (i / 18) * sz, sz, sz / 18 + 2);
      }
      for (let i = 0; i < (low ? 12 : 28); i++) {
        g.fillStyle = "rgba(140,200,230," + (0.08 + rnd() * 0.18) + ")";
        g.beginPath();
        g.ellipse(rnd() * sz, rnd() * sz, 20 + rnd() * 50, 8 + rnd() * 18, rnd(), 0, Math.PI * 2);
        g.fill();
      }
    }
    // Hyp · Planet X: historical TNO perturber grey-blue (speculative)
    if (biome === "planetx") {
      for (let i = 0; i < (low ? 20 : 48); i++) {
        g.fillStyle = "rgba(60,80,100," + (0.12 + rnd() * 0.22) + ")";
        g.beginPath();
        g.arc(rnd() * sz, rnd() * sz, 10 + rnd() * 40, 0, Math.PI * 2);
        g.fill();
      }
      for (let i = 0; i < (low ? 10 : 22); i++) {
        g.strokeStyle = "rgba(160,180,200," + (0.15 + rnd() * 0.2) + ")";
        g.lineWidth = 1 + rnd() * 2;
        const x0 = rnd() * sz, y0 = rnd() * sz;
        g.beginPath();
        g.moveTo(x0, y0);
        g.lineTo(x0 + (rnd() - 0.5) * sz * 0.5, y0 + (rnd() - 0.5) * sz * 0.5);
        g.stroke();
      }
    }
    // Hyp · Nibiru: fringe lore dark-red (fiction — labeled)
    if (biome === "nibiru") {
      for (let i = 0; i < (low ? 20 : 50); i++) {
        g.fillStyle = "rgba(120,30,25," + (0.15 + rnd() * 0.28) + ")";
        g.beginPath();
        g.arc(rnd() * sz, rnd() * sz, 12 + rnd() * 48, 0, Math.PI * 2);
        g.fill();
      }
      g.fillStyle = "rgba(200,80,40,0.12)";
      g.beginPath();
      g.ellipse(sz * 0.5, sz * 0.5, sz * 0.28, sz * 0.12, 0.4, 0, Math.PI * 2);
      g.fill();
    }
    // Hyp · PBH-Halo: gravity-well void rim (viz fiction)
    if (biome === "pbh") {
      const cx = sz * 0.5, cy = sz * 0.5, cr = sz * 0.22;
      g.fillStyle = "rgba(0,0,0,0.85)";
      g.beginPath();
      g.arc(cx, cy, cr, 0, Math.PI * 2);
      g.fill();
      const grd = g.createRadialGradient(cx, cy, cr * 0.9, cx, cy, cr * 2.2);
      grd.addColorStop(0, "rgba(80,60,160,0.45)");
      grd.addColorStop(0.5, "rgba(40,30,80,0.2)");
      grd.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = grd;
      g.beginPath();
      g.arc(cx, cy, cr * 2.2, 0, Math.PI * 2);
      g.fill();
      for (let i = 0; i < (low ? 10 : 24); i++) {
        g.strokeStyle = "rgba(140,120,220," + (0.1 + rnd() * 0.2) + ")";
        g.lineWidth = 1;
        g.beginPath();
        g.arc(cx, cy, cr * (1.1 + rnd() * 1.2), 0, Math.PI * 2);
        g.stroke();
      }
    }
    // Hyp · Theia: Mars-sized impactor proto-crust (deep-time fiction)
    if (biome === "theia") {
      for (let i = 0; i < (low ? 22 : 52); i++) {
        g.fillStyle = "rgba(140,80,50," + (0.12 + rnd() * 0.25) + ")";
        g.beginPath();
        g.arc(rnd() * sz, rnd() * sz, 10 + rnd() * 42, 0, Math.PI * 2);
        g.fill();
      }
      for (let i = 0; i < (low ? 8 : 16); i++) {
        g.fillStyle = "rgba(200,140,80," + (0.1 + rnd() * 0.15) + ")";
        g.beginPath();
        g.ellipse(rnd() * sz, rnd() * sz, 25 + rnd() * 40, 10 + rnd() * 18, rnd(), 0, Math.PI * 2);
        g.fill();
      }
    }
    // Hyp · Phaeton: shattered belt rubble (fiction)
    if (biome === "phaeton") {
      for (let i = 0; i < (low ? 30 : 70); i++) {
        g.fillStyle = "rgba(90,70,50," + (0.15 + rnd() * 0.3) + ")";
        const x = rnd() * sz, y = rnd() * sz;
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + 8 + rnd() * 30, y + (rnd() - 0.5) * 20);
        g.lineTo(x + (rnd() - 0.5) * 25, y + 10 + rnd() * 25);
        g.closePath();
        g.fill();
      }
      for (let i = 0; i < (low ? 12 : 28); i++) {
        g.strokeStyle = "rgba(200,180,140," + (0.15 + rnd() * 0.2) + ")";
        g.lineWidth = 1 + rnd() * 2;
        const x0 = rnd() * sz, y0 = rnd() * sz;
        g.beginPath();
        g.moveTo(x0, y0);
        g.lineTo(x0 + (rnd() - 0.5) * 60, y0 + (rnd() - 0.5) * 60);
        g.stroke();
      }
    }

    // Gas giant cloud deck bands
    if (biome === "gas") {
      for (let i = 0; i < 28; i++) {
        const y = (i / 28) * sz;
        g.fillStyle = i % 2 ? "rgba(255,220,180,0.12)" : "rgba(80,50,30,0.14)";
        g.fillRect(0, y, sz, sz / 28 + 2);
      }
      // storm oval
      const ox = sz * 0.55, oy = sz * 0.48, rx = sz * 0.18, ry = sz * 0.1;
      const grd = g.createRadialGradient(ox, oy, 2, ox, oy, rx);
      grd.addColorStop(0, "rgba(200,80,40,0.45)");
      grd.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = grd;
      g.beginPath();
      g.ellipse(ox, oy, rx, ry, -0.2, 0, Math.PI * 2);
      g.fill();
    }
    // Deck plating
    if (biome === "deck") {
      g.strokeStyle = "rgba(180,200,220,0.25)";
      g.lineWidth = 2;
      for (let i = 0; i < sz; i += 48) {
        g.beginPath();
        g.moveTo(i, 0);
        g.lineTo(i, sz);
        g.stroke();
        g.beginPath();
        g.moveTo(0, i);
        g.lineTo(sz, i);
        g.stroke();
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(biome === "deck" ? 4 : 8, biome === "deck" ? 4 : 8);
    try {
      const r = window.VesperSky && window.VesperSky.renderer && window.VesperSky.renderer();
      const maxA = (r && r.capabilities && r.capabilities.getMaxAnisotropy && r.capabilities.getMaxAnisotropy()) || 8;
      tex.anisotropy = Math.min(ultra ? 16 : 8, maxA);
    } catch (_) {
      tex.anisotropy = 8;
    }
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    const icy = biome === "ice" || biome === "europa" || biome === "plume" || biome === "triton" || biome === "pluto" || biome === "charon" || biome === "mimas" || biome === "rhea" || biome === "dione" || biome === "tethys" || biome === "eris" || biome === "haumea" || biome === "miranda" || biome === "ariel" || biome === "umbriel" || biome === "titania" || biome === "oberon" || biome === "orcus" || biome === "salacia" || biome === "hyperion" || biome === "halley" || biome === "encke" || biome === "janus" || biome === "epimetheus" || biome === "hiiaka" || biome === "namaka" || biome === "dysnomia" || biome === "tyche" || biome === "planetnine" || biome === "planetx";
    const em =
      biome === "earth" ? 0x102010
        : biome === "mars" || biome === "titan" ? 0x201008
          : biome === "io" ? 0x402010
            : biome === "pluto" ? 0x201008
              : biome === "ceres" ? 0x181820
                : biome === "sedna" || biome === "makemake" || biome === "ixion" || biome === "amalthea" ? 0x280808
                  : biome === "iapetus" || biome === "vesta" || biome === "eros" || biome === "ida" ? 0x181410
                    : biome === "charon" || biome === "gonggong" ? 0x180c0c
                      : biome === "hyperion" || biome === "halley" || biome === "encke" ? 0x141820
                        : biome === "vulcan" || biome === "nibiru" || biome === "theia" ? 0x280808
                          : biome === "nemesis" ? 0x200810
                            : biome === "pbh" ? 0x080818
                              : biome === "tyche" || biome === "planetnine" || biome === "planetx" ? 0x101828
                                : biome === "phaeton" ? 0x181410
                                  : biome === "proteus" || biome === "larissa" || biome === "phoebe" ? 0x0c0a10
                                    : 0x0a0c10;
    // Walk deck is unlit on purpose. Scrub used to turn this Standard
    // material into Basic and drop polygonOffset, so the deck z-fought the body.
    return new THREE.MeshBasicMaterial({
      map: tex,
      color: 0xffffff,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
      depthWrite: true,
    });
  }

  function scatterProps(group, biome, low, rnd) {
    // Density pass: more props on yards/decks; phone still capped
    let n = low ? 64 : 140;
    if (biome === "deimos" || biome === "phobos" || biome === "deck") n = low ? 80 : 160;
    if (biome === "mars" || biome === "luna" || biome === "europa") n = low ? 72 : 150;
    const rockGeo = new THREE.DodecahedronGeometry(1, 0);
    const iceGeo = new THREE.OctahedronGeometry(1, 0);
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    for (let i = 0; i < n; i++) {
      const kind =
        biome === "earth"
          ? rnd() < 0.48
            ? "flora"
            : rnd() < 0.78
              ? "rock"
              : "dust"
          : biome === "ice" || biome === "europa" || biome === "triton" || biome === "pluto" || biome === "charon" || biome === "mimas" || biome === "rhea" || biome === "dione" || biome === "tethys" || biome === "eris" || biome === "haumea" || biome === "miranda" || biome === "ariel" || biome === "umbriel" || biome === "titania" || biome === "oberon" || biome === "orcus" || biome === "salacia" || biome === "hyperion" || biome === "halley" || biome === "encke" || biome === "janus" || biome === "epimetheus" || biome === "hiiaka" || biome === "namaka" || biome === "dysnomia" || biome === "tyche" || biome === "planetnine" || biome === "planetx"
            ? rnd() < 0.55
              ? "ice"
              : "rock"
            : biome === "deck"
              ? rnd() < 0.5
                ? "crate"
                : "light"
              : biome === "mars" || biome === "titan" || biome === "sedna" || biome === "makemake" || biome === "gonggong" || biome === "quaoar" || biome === "ixion" || biome === "eros" || biome === "amalthea" || biome === "weywot" || biome === "varuna" || biome === "vulcan" || biome === "nibiru" || biome === "theia" || biome === "phaeton"
                ? rnd() < 0.5
                  ? "rock"
                  : "dune"
                : biome === "io"
                  ? rnd() < 0.45
                    ? "ventrock"
                    : "rock"
                  : biome === "ceres"
                    ? rnd() < 0.35
                      ? "salt"
                      : "rock"
                    : biome === "phobos" || biome === "deimos" || biome === "luna" || biome === "mercury" || biome === "callisto" || biome === "iapetus" || biome === "vesta" || biome === "pallas" || biome === "ida" || biome === "dactyl" || biome === "himalia" || biome === "proteus" || biome === "larissa" || biome === "nereid" || biome === "phoebe"
                      ? "rock"
                      : "rock";
      let mesh;
      const ang = rnd() * Math.PI * 2;
      const rad = 2 + rnd() * 18;
      const x = Math.cos(ang) * rad;
      const z = Math.sin(ang) * rad;
      if (kind === "flora") {
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.07, 0.5 + rnd() * 0.8, 5),
          window.VesperMat({ color: 0x4a3020, roughness: 0.9 })
        );
        const leaf = new THREE.Mesh(
          new THREE.SphereGeometry(0.25 + rnd() * 0.35, 6, 5),
          window.VesperMat({ color: 0x3a8a38, roughness: 0x1a4018, emissiveIntensity: 0.2, roughness: 0.8 })
        );
        leaf.position.y = 0.55;
        mesh = new THREE.Group();
        mesh.add(trunk, leaf);
        mesh.position.set(x, 0.05, z);
      } else if (kind === "ice") {
        mesh = new THREE.Mesh(
          iceGeo,
          window.VesperMat({
            color: 0xd0e8ff,
            roughness: 0.25,
            metalness: 0.15,
            transparent: true,
            opacity: 0.92,
            emissive: 0x406080,
            emissiveIntensity: 0.12,
          })
        );
        const s = 0.15 + rnd() * 0.55;
        mesh.scale.set(s, s * (0.6 + rnd()), s);
        mesh.position.set(x, s * 0.3, z);
        mesh.rotation.set(rnd(), rnd(), rnd());
      } else if (kind === "crate") {
        mesh = new THREE.Mesh(
          boxGeo,
          window.VesperMat({ color: 0x5a6474, metalness: 0.5, roughness: 0.4, emissive: 0x101820, emissiveIntensity: 0.15 })
        );
        mesh.scale.set(0.4 + rnd() * 0.5, 0.3 + rnd() * 0.4, 0.4 + rnd() * 0.5);
        mesh.position.set(x, mesh.scale.y * 0.5, z);
        mesh.rotation.y = rnd() * Math.PI;
      } else if (kind === "light") {
        mesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.12, 8, 6),
          window.VesperMat({ color: 0xffe0a0, emissive: 0xffc080, emissiveIntensity: 1.2 })
        );
        mesh.position.set(x, 0.8 + rnd(), z);
        const pl = window.VesperNoLight(0xffd0a0, 0.35, 6, 2);
        pl.position.copy(mesh.position);
        group.add(pl);
      } else if (kind === "dune") {
        mesh = new THREE.Mesh(
          new THREE.SphereGeometry(1, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.45),
          window.VesperMat({ color: 0xc06040, roughness: 0.95, flatShading: true })
        );
        const s = 0.8 + rnd() * 1.8;
        mesh.scale.set(s, s * 0.35, s * 0.7);
        mesh.position.set(x, 0.02, z);
        mesh.rotation.y = rnd() * Math.PI;
      } else if (kind === "salt") {
        mesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.25 + rnd() * 0.35, 8, 6),
          window.VesperMat({
            color: 0xf0f4ff, emissive: 0xc0d0e8, emissiveIntensity: 0.45, roughness: 0.35, metalness: 0.25,
          })
        );
        mesh.position.set(x, 0.15, z);
      } else if (kind === "ventrock") {
        mesh = new THREE.Mesh(
          rockGeo,
          window.VesperMat({
            color: 0xc08030, emissive: 0xff4010, emissiveIntensity: 0.35 + rnd() * 0.4, roughness: 0.85, flatShading: true,
          })
        );
        const s = 0.2 + rnd() * 0.5;
        mesh.scale.set(s, s * 0.6, s);
        mesh.position.set(x, s * 0.25, z);
      } else if (kind === "dust") {
        continue;
      } else {
        const rockCol =
          biome === "mars" || biome === "titan" || biome === "sedna" || biome === "makemake"
            ? 0xa05030
            : biome === "luna"
              ? 0x9a9688
              : biome === "mercury" || biome === "vesta"
                ? 0xa09880
                : biome === "phobos" || biome === "deimos" || biome === "callisto" || biome === "iapetus"
                  ? 0x5a5448
                  : biome === "pluto" || biome === "charon"
                    ? 0xa06850
                    : biome === "io"
                      ? 0xc8a028
                      : 0x7a7a82;
        mesh = new THREE.Mesh(
          rockGeo,
          window.VesperMat({
            color: rockCol,
            roughness: 0.92,
            flatShading: true,
          })
        );
        const s = 0.12 + rnd() * 0.55;
        mesh.scale.set(s * (0.8 + rnd()), s * (0.5 + rnd()), s * (0.8 + rnd()));
        mesh.position.set(x, s * 0.25, z);
        mesh.rotation.set(rnd(), rnd(), rnd());
      }
      if (mesh) group.add(mesh);
    }
    // Hopeful artifact: small beacon / cairn (Expanse-ish human trace)
    if (biome !== "gas" && rnd() > 0.25) {
      const cairn = new THREE.Group();
      for (let k = 0; k < 3; k++) {
        const stone = new THREE.Mesh(
          rockGeo,
          window.VesperMat({ color: 0xb0b0b8, roughness: 0.85 })
        );
        stone.scale.setScalar(0.2 + k * 0.05);
        stone.position.y = 0.12 + k * 0.18;
        cairn.add(stone);
      }
      const pip = window.VesperNoLight(0x80ffc8, 0.4, 8, 2);
      pip.position.y = 0.7;
      cairn.add(pip);
      cairn.position.set(3 + rnd() * 4, 0, -2 - rnd() * 3);
      group.add(cairn);
    }
    // Earth: sparse habitation lights (hopeful night-side read underfoot)
    if (biome === "earth" && !low) {
      for (let i = 0; i < 24; i++) {
        const a = rnd() * Math.PI * 2;
        const r = 4 + rnd() * 16;
        const lamp = window.VesperNoLight(0xffe0a8, 0.15 + rnd() * 0.2, 5, 2);
        lamp.position.set(Math.cos(a) * r, 0.4, Math.sin(a) * r);
        group.add(lamp);
      }
    }
    // Expanse-ish research spike (any solid body)
    if (biome !== "gas" && biome !== "deck" && rnd() > 0.4) {
      const spike = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.08, 2.2, 6),
        window.VesperMat({ color: 0xc0c8d0, metalness: 0.7, roughness: 0.3, emissive: 0x206040, emissiveIntensity: 0.35 })
      );
      spike.position.set(-5 - rnd() * 3, 1.1, 4 + rnd() * 2);
      group.add(spike);
      const dish = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.5),
        window.VesperMat({ color: 0xa0b0c0, metalness: 0.5, roughness: 0.4 })
      );
      dish.position.copy(spike.position);
      dish.position.y += 1.2;
      group.add(dish);
    }
  }

  function attach(bodyName, bodyRadius, eye) {
    detach();
    THREE = window.THREE;
    const s = sky();
    if (!THREE || !s) return null;
    const scene = s.scene && s.scene();
    if (!scene) return null;
    const low = !!(window.matchMedia && matchMedia("(pointer: coarse)").matches);
    const biome = biomeFor(bodyName);
    const rnd = mulberry(bodyName.length * 1337 + (bodyRadius * 10) | 0);
    root = new THREE.Group();
    root.name = "vesper-surface-detail";
    const mat = makeGroundMat(biome, low);
    const extent = Math.min(48, Math.max(14, bodyRadius * 0.04));
    padExtent = extent;
    const ground = new THREE.Mesh(new THREE.CircleGeometry(extent, low ? 32 : 64), mat);
    ground.name = "vesperPadDisc";
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -eye * 0.85;
    ground.receiveShadow = false;
    ground.renderOrder = 2;
    root.renderOrder = 2;
    root.add(ground);
    // Soft-land pad ring (Expanse-ish clear-zone marker)
    const softPad = new THREE.Mesh(
      new THREE.RingGeometry(1.1, 1.35, 48),
      new THREE.MeshBasicMaterial({
        color:
          biome === "mars" || biome === "titan" || biome === "pluto" || biome === "sedna" || biome === "makemake" || biome === "charon" || biome === "gonggong" || biome === "quaoar" || biome === "ixion" || biome === "amalthea" || biome === "eros" || biome === "vulcan" || biome === "nibiru" || biome === "theia" || biome === "nemesis"
            ? 0xff8060
            : biome === "ice" || biome === "europa" || biome === "plume" || biome === "triton" || biome === "mimas" || biome === "rhea" || biome === "dione" || biome === "tethys" || biome === "eris" || biome === "haumea" || biome === "miranda" || biome === "ariel" || biome === "umbriel" || biome === "titania" || biome === "oberon" || biome === "orcus" || biome === "salacia" || biome === "hyperion" || biome === "halley" || biome === "encke" || biome === "janus" || biome === "epimetheus" || biome === "hiiaka" || biome === "namaka" || biome === "dysnomia" || biome === "tyche" || biome === "planetnine" || biome === "planetx"
              ? 0xa0d0ff
              : biome === "io"
                ? 0xffc040
                : biome === "ceres"
                  ? 0xe0e8ff
                  : biome === "pbh"
                    ? 0x8060e0
                    : biome === "phaeton"
                      ? 0xd0b080
                      : biome === "luna" || biome === "mercury" || biome === "phobos" || biome === "deimos" || biome === "iapetus" || biome === "vesta" || biome === "pallas" || biome === "ida" || biome === "dactyl" || biome === "himalia" || biome === "proteus" || biome === "larissa" || biome === "nereid" || biome === "weywot" || biome === "varuna"
                        ? 0xc0c8d0
                        : 0x80e0c0,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
        depthTest: true,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -6,
        polygonOffsetUnits: -6,
      })
    );
    softPad.name = "softPad";
    softPad.renderOrder = 3;
    softPad.rotation.x = -Math.PI / 2;
    softPad.position.y = -eye * 0.84;
    root.add(softPad);
    // Subtle second layer for parallax grit
    if (!low) {
      const grit = ground.clone();
      grit.material = mat.clone();
      grit.material.opacity = 0.35;
      grit.material.transparent = true;
      grit.material.polygonOffset = true;
      grit.material.polygonOffsetFactor = -2;
      grit.material.polygonOffsetUnits = -2;
      grit.renderOrder = 2;
      grit.scale.setScalar(0.55);
      grit.position.y = -eye * 0.9;
      root.add(grit);
    }
    scatterProps(root, biome, low, rnd);
    if (/Apollo/i.test(bodyName)) {
      const plaque = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.08, 0.8),
        window.VesperMat({ color: 0xc0c8d0, metalness: 0.7, roughness: 0.35, emissive: 0x304050, emissiveIntensity: 0.25 })
      );
      plaque.position.set(0, 0.06, 2.5);
      const flag = new THREE.Mesh(
        new THREE.BoxGeometry(0.02, 1.4, 0.02),
        window.VesperMat({ color: 0xd0d0d0 })
      );
      flag.position.set(-1.2, 0.7, 2.2);
      const cloth = new THREE.Mesh(
        new THREE.PlaneGeometry(0.9, 0.55),
        window.VesperMat({ color: 0x4060c0, side: THREE.DoubleSide, emissive: 0x102040, emissiveIntensity: 0.2 })
      );
      cloth.position.set(-0.75, 1.15, 2.2);
      root.add(plaque, flag, cloth);
    }
    // Azemondar/Expanse-ish hope beacon — human trace of care
    if (biome !== "gas") {
      const hopeBeacon = new THREE.Group();
      hopeBeacon.name = "hopeBeacon";
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.07, 1.6, 6),
        window.VesperMat({ color: 0xb0c0d0, metalness: 0.6, roughness: 0.35, emissive: 0x2060a0, emissiveIntensity: 0.4 })
      );
      stem.position.y = 0.8;
      const globe = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 12, 10),
        window.VesperMat({ color: 0xa0e8ff, emissive: 0x40c0ff, emissiveIntensity: 1.2, roughness: 0.25 })
      );
      globe.position.y = 1.7;
      const pl = window.VesperNoLight(0x80d0ff, 0.65, 12, 2);
      pl.position.y = 1.7;
      hopeBeacon.add(stem, globe, pl);
      hopeBeacon.position.set(6.5, 0, -3.5);
      root.add(hopeBeacon);
    }
    // Deimos Yard — FULL walkable hangar (not a solid stub prop)
    if (biome === "deimos" || biome === "phobos") {
      const HG = new THREE.Group();
      HG.name = "deimosYardHangar";
      const metal = window.VesperMat({ color: 0x8a8078, metalness: 0.45, roughness: 0.55, emissive: 0x201810, emissiveIntensity: 0.12 });
      const HW = 8, HD = 10, HH = 4.2;
      const floor = new THREE.Mesh(new THREE.BoxGeometry(HW, 0.12, HD), window.VesperMat({ color: 0x3a3834, metalness: 0.3, roughness: 0.7 }));
      floor.position.set(-6, 0.06, 4);
      HG.add(floor);
      const left = new THREE.Mesh(new THREE.BoxGeometry(0.18, HH, HD), metal);
      left.position.set(-6 - HW / 2, HH / 2, 4);
      const right = new THREE.Mesh(new THREE.BoxGeometry(0.18, HH, HD), metal);
      right.position.set(-6 + HW / 2, HH / 2, 4);
      const back = new THREE.Mesh(new THREE.BoxGeometry(HW, HH, 0.18), metal);
      back.position.set(-6, HH / 2, 4 - HD / 2);
      const ceil = new THREE.Mesh(new THREE.BoxGeometry(HW, 0.12, HD), metal);
      ceil.position.set(-6, HH, 4);
      HG.add(left, right, back, ceil);
      // Open mouth toward +Z — docking clamps
      for (const side of [-1, 1]) {
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 3.5), metal);
        arm.position.set(-6 + side * 2.5, 2.5, 4 + HD / 2 - 1);
        HG.add(arm);
        const hook = new THREE.Mesh(
          new THREE.TorusGeometry(0.35, 0.06, 6, 12),
          window.VesperMat({ color: 0xffc060, metalness: 0.5, roughness: 0.35, emissive: 0xa06020, emissiveIntensity: 0.4 })
        );
        hook.position.set(-6 + side * 2.5, 2.0, 4 + HD / 2 + 0.5);
        hook.rotation.y = Math.PI / 2;
        HG.add(hook);
      }
      for (let ci = 0; ci < 8; ci++) {
        const crate = new THREE.Mesh(
          new THREE.BoxGeometry(0.55, 0.45, 0.55),
          window.VesperMat({ color: 0x6a5a48, roughness: 0.8 })
        );
        crate.position.set(-8 + (ci % 4) * 0.9, 0.3, 2 + Math.floor(ci / 4) * 0.9);
        HG.add(crate);
      }
      const watch = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.1, 2.4, 6),
        window.VesperMat({ color: 0xa0a8b0, emissive: 0xffa040, emissiveIntensity: 0.35 })
      );
      watch.position.set(2.8, 1.2, 5.0);
      HG.add(watch);
      const wL = window.VesperNoLight(0xffb060, 0.65, 18, 2);
      wL.position.set(2.8, 2.4, 5.0);
      HG.add(wL);
      const bayL = window.VesperNoLight(0xc0e0ff, 0.7, 20, 2);
      bayL.position.set(-6, HH - 0.8, 4);
      HG.add(bayL);
      root.add(HG);
    }
    // Hyp mega interior plaza (fiction labeled via Hyp pip already)
    if (biome === "phaeton" || biome === "vulcan" || biome === "nemesis" || biome === "tyche" || biome === "planetnine" || biome === "planetx" || biome === "nibiru" || biome === "theia" || biome === "pbh") {
      const plaza = new THREE.Mesh(
        new THREE.CylinderGeometry(4, 4, 0.1, 24),
        window.VesperMat({ color: 0x3a3428, metalness: 0.4, roughness: 0.6, emissive: 0x403010, emissiveIntensity: 0.15 })
      );
      plaza.position.set(0, 0.05, 6);
      root.add(plaza);
      const arch = new THREE.Mesh(
        new THREE.TorusGeometry(2.2, 0.12, 8, 24, Math.PI),
        window.VesperMat({ color: 0xe0c060, metalness: 0.55, roughness: 0.35, emissive: 0xa08020, emissiveIntensity: 0.35 })
      );
      arch.rotation.z = Math.PI / 2;
      arch.position.set(0, 2.2, 6);
      root.add(arch);
      const plaque = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.5, 0.08),
        window.VesperMat({ color: 0xc0a040, emissive: 0x806020, emissiveIntensity: 0.4 })
      );
      plaque.position.set(0, 1.2, 4.5);
      plaque.name = "hypFictionPlaque";
      root.add(plaque);
      const pl = window.VesperNoLight(0xffc060, 0.5, 12, 2);
      pl.position.set(0, 2.5, 6);
      root.add(pl);
    }
    // Deck / station — walkable corridor + airlock rings (ISS-class, full size)
    if (biome === "deck") {
      const deckG = new THREE.Group();
      deckG.name = "stationDeckWalk";
      const floor = new THREE.Mesh(
        new THREE.BoxGeometry(6, 0.12, 22),
        window.VesperMat({ color: 0x3a4450, metalness: 0.45, roughness: 0.5 })
      );
      floor.position.set(0, 0.06, 0);
      deckG.add(floor);
      for (let i = 0; i < 6; i++) {
        const rib = new THREE.Mesh(
          new THREE.BoxGeometry(0.15, 2.8, 0.15),
          window.VesperMat({ color: 0x708090, metalness: 0.6, roughness: 0.4, emissive: 0x103050, emissiveIntensity: 0.15 })
        );
        rib.position.set(-2.8, 1.4, -8 + i * 3.2);
        const rib2 = rib.clone();
        rib2.position.x = 2.8;
        deckG.add(rib, rib2);
      }
      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(3.5, 1.8, 0.1),
        window.VesperMat({ color: 0x203040, emissive: 0x40a0ff, emissiveIntensity: 0.3 })
      );
      panel.position.set(0, 1.2, -10);
      deckG.add(panel);
      for (const z of [-9, 0, 9]) {
        const lock = new THREE.Mesh(
          new THREE.TorusGeometry(1.15, 0.09, 8, 20),
          window.VesperMat({ color: 0x70e0c0, metalness: 0.5, roughness: 0.3, emissive: 0x20a080, emissiveIntensity: 0.45 })
        );
        lock.position.set(0, 1.3, z);
        deckG.add(lock);
      }
      const strip = window.VesperNoLight(0xa0d0ff, 0.55, 18, 2);
      strip.position.set(0, 2.4, 0);
      deckG.add(strip);
      root.add(deckG);
    }
    // Earth coastal ocean shimmer disc
    if (biome === "earth" && !low) {
      const ocean = new THREE.Mesh(
        new THREE.CircleGeometry(extent * 0.35, 48),
        window.VesperMat({
          color: 0x1a5080, metalness: 0.65, roughness: 0.25, emissive: 0x0a2038, emissiveIntensity: 0.3,
        })
      );
      ocean.name = "oceanShimmer";
      ocean.rotation.x = -Math.PI / 2;
      ocean.position.set(-extent * 0.25, -eye * 0.84, extent * 0.2);
      root.add(ocean);
    }
    // Earth aurora ribbon (hopeful polar shimmer)
    if (biome === "earth" && !low) {
      const auroraRibbon = new THREE.Mesh(
        new THREE.TorusGeometry(extent * 0.55, 0.35, 8, 48),
        new THREE.MeshBasicMaterial({
          color: 0x40ffb0,
          transparent: true,
          opacity: 0.22,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        })
      );
      auroraRibbon.rotation.x = Math.PI / 2.4;
      auroraRibbon.position.y = 4;
      root.add(auroraRibbon);
    }
    // Europa pressure ridges (walkable science cue)
    if ((biome === "europa" || biome === "ice") && !low) {
      for (let i = 0; i < 7; i++) {
        const ridge = new THREE.Mesh(
          new THREE.BoxGeometry(4 + rnd() * 10, 0.35 + rnd() * 0.4, 0.45),
          window.VesperMat({ color: 0xd0dce8, roughness: 0.75, metalness: 0.08, flatShading: true })
        );
        ridge.position.set((rnd() - 0.5) * extent * 0.7, 0.05, (rnd() - 0.5) * extent * 0.7);
        ridge.rotation.y = rnd() * Math.PI;
        root.add(ridge);
      }
    }
    // Mars dust-devil cue (hopeful exploration weather)
    if (biome === "mars" && !low) {
      const devil = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 1.1, 5.5, 10, 1, true),
        new THREE.MeshBasicMaterial({
          color: 0xd08050, transparent: true, opacity: 0.2, depthWrite: false,
          blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        })
      );
      devil.name = "dustDevil";
      devil.position.set(8, 2.5, -6);
      root.add(devil);
    }
    // Titan lake mirror disc
    if (biome === "titan") {
      const lake = new THREE.Mesh(
        new THREE.CircleGeometry(3.5 + rnd() * 2, 32),
        window.VesperMat({
          color: 0x1a2830, metalness: 0.85, roughness: 0.15, emissive: 0x081018, emissiveIntensity: 0.2,
        })
      );
      lake.rotation.x = -Math.PI / 2;
      lake.position.set(5, -eye * 0.82, -4);
      root.add(lake);
    }
    // Enceladus mist column
    if (biome === "plume" && !low) {
      const mist = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 1.2, 8, 10, 1, true),
        new THREE.MeshBasicMaterial({
          color: 0xd0e8ff, transparent: true, opacity: 0.18, depthWrite: false,
          blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        })
      );
      mist.position.set(-6, 4, 3);
      root.add(mist);
    }
    // Luna: mare basalt low shelves
    if (biome === "luna" && !low) {
      for (let i = 0; i < 5; i++) {
        const shelf = new THREE.Mesh(
          new THREE.CylinderGeometry(1.2 + rnd() * 2, 1.6 + rnd() * 2.5, 0.25, 8),
          window.VesperMat({ color: 0x3a3834, roughness: 0.95, flatShading: true })
        );
        shelf.position.set((rnd() - 0.5) * extent * 0.6, -eye * 0.7, (rnd() - 0.5) * extent * 0.6);
        root.add(shelf);
      }
    }
    // Mercury: bright ray stub poles
    if (biome === "mercury" && !low) {
      for (let i = 0; i < 4; i++) {
        const ray = new THREE.Mesh(
          new THREE.BoxGeometry(0.15, 0.08, 3 + rnd() * 4),
          window.VesperMat({ color: 0xe8e0c8, roughness: 0.7, emissive: 0x403020, emissiveIntensity: 0.15 })
        );
        ray.position.set((rnd() - 0.5) * 10, 0.04, (rnd() - 0.5) * 10);
        ray.rotation.y = rnd() * Math.PI;
        root.add(ray);
      }
    }
    // Callisto: nested crater rim rings
    if (biome === "callisto" && !low) {
      for (let i = 0; i < 4; i++) {
        const rim = new THREE.Mesh(
          new THREE.TorusGeometry(2 + i * 1.4, 0.18, 6, 24),
          window.VesperMat({ color: 0x8a8878, roughness: 0.9, flatShading: true })
        );
        rim.rotation.x = Math.PI / 2;
        rim.position.set(4, 0.05, -3);
        root.add(rim);
      }
    }
    // Ganymede: sulci groove bars
    if (biome === "ganymede" && !low) {
      for (let i = 0; i < 8; i++) {
        const groove = new THREE.Mesh(
          new THREE.BoxGeometry(6 + rnd() * 8, 0.2, 0.35),
          window.VesperMat({ color: 0xc8c0b0, roughness: 0.8, metalness: 0.06, flatShading: true })
        );
        groove.position.set((rnd() - 0.5) * extent * 0.65, 0.04, (rnd() - 0.5) * extent * 0.65);
        groove.rotation.y = rnd() * Math.PI;
        root.add(groove);
      }
    }
    // Io: lava vent glow discs + plume stub
    if (biome === "io") {
      for (let i = 0; i < (low ? 2 : 5); i++) {
        const vent = new THREE.Mesh(
          new THREE.CircleGeometry(0.6 + rnd() * 1.2, 16),
          window.VesperMat({
            color: 0xff6030, emissive: 0xff4010, emissiveIntensity: 1.1, roughness: 0.5,
          })
        );
        vent.rotation.x = -Math.PI / 2;
        vent.position.set((rnd() - 0.5) * 12, -eye * 0.82, (rnd() - 0.5) * 12);
        root.add(vent);
      }
      if (!low) {
        const plume = new THREE.Mesh(
          new THREE.CylinderGeometry(0.3, 1.4, 7, 10, 1, true),
          new THREE.MeshBasicMaterial({
            color: 0xffd080, transparent: true, opacity: 0.16, depthWrite: false,
            blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
          })
        );
        plume.name = "ioPlume";
        plume.position.set(-5, 3.5, 4);
        root.add(plume);
      }
    }
    // Triton: cantaloupe mounds + frost sheet
    if (biome === "triton" && !low) {
      for (let i = 0; i < 10; i++) {
        const mound = new THREE.Mesh(
          new THREE.SphereGeometry(0.7 + rnd() * 0.9, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.55),
          window.VesperMat({ color: 0xb0a890, roughness: 0.9, flatShading: true })
        );
        mound.position.set((rnd() - 0.5) * extent * 0.55, 0.02, (rnd() - 0.5) * extent * 0.55);
        root.add(mound);
      }
      const frost = new THREE.Mesh(
        new THREE.CircleGeometry(4.5, 32),
        window.VesperMat({
          color: 0xf0f8ff, roughness: 0.3, metalness: 0.12, emissive: 0x304060, emissiveIntensity: 0.18,
        })
      );
      frost.rotation.x = -Math.PI / 2;
      frost.position.set(-4, -eye * 0.83, 5);
      root.add(frost);
    }
    // Pluto: Tombaugh heart bright disc + tholin ridge
    if (biome === "pluto") {
      const heart = new THREE.Mesh(
        new THREE.CircleGeometry(5.5, 40),
        window.VesperMat({
          color: 0xf8f0e8, roughness: 0.4, metalness: 0.05, emissive: 0x403028, emissiveIntensity: 0.12,
        })
      );
      heart.name = "tombaughHeart";
      heart.rotation.x = -Math.PI / 2;
      heart.position.set(3, -eye * 0.83, -2);
      root.add(heart);
      if (!low) {
        const tholin = new THREE.Mesh(
          new THREE.BoxGeometry(8, 0.4, 1.2),
          window.VesperMat({ color: 0xa05038, roughness: 0.85, flatShading: true })
        );
        tholin.position.set(-6, 0.1, 4);
        tholin.rotation.y = 0.4;
        root.add(tholin);
      }
    }
    // Ceres: Occator bright salt patches
    if (biome === "ceres") {
      for (let i = 0; i < (low ? 2 : 4); i++) {
        const spot = new THREE.Mesh(
          new THREE.CircleGeometry(0.9 + rnd() * 1.1, 20),
          window.VesperMat({
            color: 0xf0f4ff, emissive: 0xc0d0e8, emissiveIntensity: 0.55, roughness: 0.35, metalness: 0.2,
          })
        );
        spot.rotation.x = -Math.PI / 2;
        spot.position.set((rnd() - 0.5) * 10, -eye * 0.82, (rnd() - 0.5) * 10);
        root.add(spot);
      }
    }
    // Phobos: Stickney rim wall + rubble
    if (biome === "phobos") {
      const stickney = new THREE.Mesh(
        new THREE.TorusGeometry(3.2, 0.45, 8, 28),
        window.VesperMat({ color: 0x4a4038, roughness: 0.95, flatShading: true })
      );
      stickney.name = "stickneyRim";
      stickney.rotation.x = Math.PI / 2;
      stickney.position.set(5, 0.1, -4);
      root.add(stickney);
    }
    // Deimos: low rubble berms
    if (biome === "deimos" && !low) {
      for (let i = 0; i < 6; i++) {
        const berm = new THREE.Mesh(
          new THREE.BoxGeometry(1.5 + rnd() * 2, 0.25, 0.8 + rnd()),
          window.VesperMat({ color: 0x6a6058, roughness: 0.95, flatShading: true })
        );
        berm.position.set((rnd() - 0.5) * extent * 0.5, 0.05, (rnd() - 0.5) * extent * 0.5);
        berm.rotation.y = rnd() * Math.PI;
        root.add(berm);
      }
    }
    // Mimas: Herschel rim wall
    if (biome === "mimas") {
      const herschel = new THREE.Mesh(
        new THREE.TorusGeometry(4.2, 0.55, 8, 32),
        window.VesperMat({ color: 0xd0ccc0, roughness: 0.88, flatShading: true })
      );
      herschel.name = "herschelRim";
      herschel.rotation.x = Math.PI / 2;
      herschel.position.set(4, 0.12, -3);
      root.add(herschel);
    }
    // Iapetus: dark/bright divider wall + ridge spine
    if (biome === "iapetus") {
      const dark = new THREE.Mesh(
        new THREE.CircleGeometry(6, 32, 0, Math.PI),
        window.VesperMat({ color: 0x1a1810, roughness: 0.95 })
      );
      dark.rotation.x = -Math.PI / 2;
      dark.position.set(-2, -eye * 0.83, 0);
      root.add(dark);
      const ridge = new THREE.Mesh(
        new THREE.BoxGeometry(14, 0.7, 0.5),
        window.VesperMat({ color: 0x908870, roughness: 0.85, flatShading: true })
      );
      ridge.name = "iapetusRidge";
      ridge.position.set(0, 0.2, 0);
      root.add(ridge);
    }
    // Miranda: cliff face + corona ring
    if (biome === "miranda" && !low) {
      const cliff = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 3.5, 8),
        window.VesperMat({ color: 0xa8a8a0, roughness: 0.9, flatShading: true })
      );
      cliff.name = "veronaCliff";
      cliff.position.set(-5, 1.5, 2);
      root.add(cliff);
      const corona = new THREE.Mesh(
        new THREE.TorusGeometry(3.5, 0.25, 6, 28),
        window.VesperMat({ color: 0xc8c8c0, roughness: 0.85 })
      );
      corona.rotation.x = Math.PI / 2;
      corona.position.set(5, 0.08, -4);
      root.add(corona);
    }
    // Rhea / Dione / Tethys: ice shelf plates
    if ((biome === "rhea" || biome === "dione" || biome === "tethys") && !low) {
      for (let i = 0; i < 5; i++) {
        const plate = new THREE.Mesh(
          new THREE.BoxGeometry(2 + rnd() * 3, 0.15, 1.2 + rnd() * 2),
          window.VesperMat({
            color: biome === "dione" ? 0xe8e8f8 : 0xf0f4f8,
            roughness: 0.4, metalness: 0.1, emissive: 0x304050, emissiveIntensity: 0.1,
          })
        );
        plate.position.set((rnd() - 0.5) * extent * 0.55, 0.04, (rnd() - 0.5) * extent * 0.55);
        plate.rotation.y = rnd() * Math.PI;
        root.add(plate);
      }
      if (biome === "dione") {
        for (let i = 0; i < 6; i++) {
          const wisp = new THREE.Mesh(
            new THREE.BoxGeometry(5 + rnd() * 6, 0.08, 0.12),
            window.VesperMat({ color: 0xffffff, emissive: 0xa0c0e0, emissiveIntensity: 0.35, roughness: 0.3 })
          );
          wisp.position.set((rnd() - 0.5) * 10, 0.06, (rnd() - 0.5) * 10);
          wisp.rotation.y = rnd() * Math.PI;
          root.add(wisp);
        }
      }
    }
    // Vesta: Rheasilvia rim
    if (biome === "vesta") {
      const rhea = new THREE.Mesh(
        new THREE.TorusGeometry(4.5, 0.5, 8, 28),
        window.VesperMat({ color: 0x8a7860, roughness: 0.92, flatShading: true })
      );
      rhea.name = "rheasilviaRim";
      rhea.rotation.x = Math.PI / 2;
      rhea.position.set(3, 0.1, -2);
      root.add(rhea);
    }
    // Eris / Haumea: cold ice slabs
    if ((biome === "eris" || biome === "haumea") && !low) {
      for (let i = 0; i < 4; i++) {
        const slab = new THREE.Mesh(
          new THREE.BoxGeometry(3 + rnd() * 2, 0.2, 2 + rnd()),
          window.VesperMat({
            color: biome === "haumea" ? 0xe8e0f8 : 0xd8e0e8,
            roughness: 0.35, metalness: 0.12, emissive: 0x405060, emissiveIntensity: 0.12,
          })
        );
        slab.position.set((rnd() - 0.5) * 10, 0.05, (rnd() - 0.5) * 10);
        root.add(slab);
      }
    }
    // Makemake / Sedna: tholin dunes
    if ((biome === "makemake" || biome === "sedna") && !low) {
      for (let i = 0; i < 5; i++) {
        const dune = new THREE.Mesh(
          new THREE.SphereGeometry(1.2 + rnd(), 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.45),
          window.VesperMat({
            color: biome === "sedna" ? 0xa02818 : 0xc05030, roughness: 0.92, flatShading: true,
          })
        );
        dune.scale.set(1.4, 0.35, 0.9);
        dune.position.set((rnd() - 0.5) * 12, 0.02, (rnd() - 0.5) * 12);
        root.add(dune);
      }
    }
    // Charon: Mordor Macula disc
    if (biome === "charon") {
      const mordor = new THREE.Mesh(
        new THREE.CircleGeometry(4.2, 32),
        window.VesperMat({
          color: 0x803028, roughness: 0.85, emissive: 0x401010, emissiveIntensity: 0.2,
        })
      );
      mordor.name = "mordorMacula";
      mordor.rotation.x = -Math.PI / 2;
      mordor.position.set(0, -eye * 0.83, -6);
      root.add(mordor);
    }
        // Ariel / Titania fault scarps
    if ((biome === "ariel" || biome === "titania") && !low) {
      for (let i = 0; i < 4; i++) {
        const scarp = new THREE.Mesh(
          new THREE.BoxGeometry(6 + rnd() * 4, 0.5 + rnd() * 0.8, 0.35),
          window.VesperMat({ color: 0xb0b0c0, roughness: 0.85, flatShading: true })
        );
        scarp.position.set((rnd() - 0.5) * extent * 0.5, 0.15, (rnd() - 0.5) * extent * 0.5);
        scarp.rotation.y = rnd() * Math.PI;
        root.add(scarp);
      }
    }
    // Umbriel / Oberon dark crater bowls
    if ((biome === "umbriel" || biome === "oberon") && !low) {
      for (let i = 0; i < 3; i++) {
        const bowl = new THREE.Mesh(
          new THREE.RingGeometry(1.2 + i * 0.4, 1.5 + i * 0.4, 20),
          window.VesperMat({ color: biome === "umbriel" ? 0x4a4a50 : 0x8a8070, roughness: 0.9, side: THREE.DoubleSide })
        );
        bowl.rotation.x = -Math.PI / 2;
        bowl.position.set(3 + i, -eye * 0.82, -2 - i);
        root.add(bowl);
      }
    }
        // Quaoar / Gonggong: TNO ridge nubs
    if ((biome === "quaoar" || biome === "gonggong") && !low) {
      for (let i = 0; i < 4; i++) {
        const nub = new THREE.Mesh(
          new THREE.DodecahedronGeometry(0.5 + rnd() * 0.4, 0),
          window.VesperMat({
            color: biome === "gonggong" ? 0xa04030 : 0xb09870, roughness: 0.9, flatShading: true,
          })
        );
        nub.position.set((rnd() - 0.5) * 10, 0.2, (rnd() - 0.5) * 10);
        root.add(nub);
      }
    }
        // Psyche: metallic shard props
    if (biome === "psyche" && !low) {
      for (let i = 0; i < 8; i++) {
        const shard = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.25 + rnd() * 0.35, 0),
          window.VesperMat({ color: 0xc0c8d0, metalness: 0.85, roughness: 0.3, emissive: 0x304050, emissiveIntensity: 0.25 })
        );
        shard.position.set((rnd() - 0.5) * 12, 0.15, (rnd() - 0.5) * 12);
        shard.rotation.set(rnd(), rnd(), rnd());
        root.add(shard);
      }
    }
    // Phoebe: dark boulder field
    if (biome === "phoebe" && !low) {
      for (let i = 0; i < 10; i++) {
        const b = new THREE.Mesh(
          new THREE.DodecahedronGeometry(0.3 + rnd() * 0.5, 0),
          window.VesperMat({ color: 0x3a3228, roughness: 0.95, flatShading: true })
        );
        b.position.set((rnd() - 0.5) * 12, 0.15, (rnd() - 0.5) * 12);
        root.add(b);
      }
    }
    // Hyperion: spongy void bowls
    if (biome === "hyperion" && !low) {
      for (let i = 0; i < 6; i++) {
        const voidBowl = new THREE.Mesh(
          new THREE.RingGeometry(0.8 + i * 0.15, 1.1 + i * 0.15, 16),
          window.VesperMat({ color: 0x3a3020, roughness: 0.95, side: THREE.DoubleSide, emissive: 0x100c08, emissiveIntensity: 0.15 })
        );
        voidBowl.rotation.x = -Math.PI / 2;
        voidBowl.position.set((rnd() - 0.5) * 10, -eye * 0.82, (rnd() - 0.5) * 10);
        root.add(voidBowl);
      }
    }
    // Amalthea: red potato ridges
    if (biome === "amalthea" && !low) {
      for (let i = 0; i < 5; i++) {
        const ridge = new THREE.Mesh(
          new THREE.BoxGeometry(3 + rnd() * 3, 0.35 + rnd() * 0.4, 0.5),
          window.VesperMat({ color: 0xa04828, roughness: 0.92, flatShading: true, emissive: 0x280808, emissiveIntensity: 0.15 })
        );
        ridge.position.set((rnd() - 0.5) * 10, 0.12, (rnd() - 0.5) * 10);
        ridge.rotation.y = rnd() * Math.PI;
        root.add(ridge);
      }
    }
    // Eros: elongated NEA boulder train
    if (biome === "eros" && !low) {
      for (let i = 0; i < 7; i++) {
        const b = new THREE.Mesh(
          new THREE.DodecahedronGeometry(0.25 + rnd() * 0.4, 0),
          window.VesperMat({ color: 0x8a6848, roughness: 0.9, flatShading: true })
        );
        b.position.set(-6 + i * 1.8 + rnd(), 0.12, (rnd() - 0.5) * 3);
        b.scale.set(1.4, 0.7, 0.9);
        root.add(b);
      }
    }
    // Orcus: bright ice slabs
    if (biome === "orcus" && !low) {
      for (let i = 0; i < 4; i++) {
        const slab = new THREE.Mesh(
          new THREE.BoxGeometry(2.5 + rnd() * 2, 0.18, 1.8 + rnd()),
          window.VesperMat({ color: 0xe8f0f8, roughness: 0.3, metalness: 0.12, emissive: 0x405060, emissiveIntensity: 0.14 })
        );
        slab.position.set((rnd() - 0.5) * 10, 0.05, (rnd() - 0.5) * 10);
        root.add(slab);
      }
    }
    // Ixion: dark red tholin mounds
    if (biome === "ixion" && !low) {
      for (let i = 0; i < 5; i++) {
        const m = new THREE.Mesh(
          new THREE.SphereGeometry(1 + rnd() * 0.8, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.45),
          window.VesperMat({ color: 0x702018, roughness: 0.92, flatShading: true, emissive: 0x280808, emissiveIntensity: 0.18 })
        );
        m.scale.set(1.3, 0.35, 0.9);
        m.position.set((rnd() - 0.5) * 11, 0.02, (rnd() - 0.5) * 11);
        root.add(m);
      }
    }
    // Halley / Encke: dirty-snow chunks
    if ((biome === "halley" || biome === "encke") && !low) {
      for (let i = 0; i < 8; i++) {
        const chunk = new THREE.Mesh(
          new THREE.DodecahedronGeometry(0.25 + rnd() * 0.45, 0),
          window.VesperMat({
            color: rnd() > 0.45 ? 0xd0d8e0 : 0x5a5040, roughness: 0.85, flatShading: true,
            emissive: 0x101418, emissiveIntensity: 0.12,
          })
        );
        chunk.position.set((rnd() - 0.5) * 12, 0.12, (rnd() - 0.5) * 12);
        root.add(chunk);
      }
    }
    // Proteus / Larissa: dark facet blocks
    if ((biome === "proteus" || biome === "larissa") && !low) {
      for (let i = 0; i < 6; i++) {
        const facet = new THREE.Mesh(
          new THREE.BoxGeometry(1.2 + rnd(), 0.4 + rnd() * 0.5, 1 + rnd()),
          window.VesperMat({ color: biome === "proteus" ? 0x4a4850 : 0x5a5868, roughness: 0.95, flatShading: true })
        );
        facet.position.set((rnd() - 0.5) * 10, 0.15, (rnd() - 0.5) * 10);
        facet.rotation.y = rnd() * Math.PI;
        root.add(facet);
      }
    }
    // Pallas / Ida / Himalia: belt rubble cairns
    if ((biome === "pallas" || biome === "ida" || biome === "himalia" || biome === "dactyl") && !low) {
      for (let i = 0; i < 6; i++) {
        const r = new THREE.Mesh(
          new THREE.DodecahedronGeometry(0.28 + rnd() * 0.4, 0),
          window.VesperMat({
            color: biome === "pallas" ? 0x6a7078 : biome === "himalia" ? 0x7a7060 : 0x8a8070,
            roughness: 0.92, flatShading: true,
          })
        );
        r.position.set((rnd() - 0.5) * 11, 0.12, (rnd() - 0.5) * 11);
        root.add(r);
      }
    }
    // Janus / Epimetheus: co-orbital bright ice-rock
    if ((biome === "janus" || biome === "epimetheus") && !low) {
      for (let i = 0; i < 5; i++) {
        const iceR = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.3 + rnd() * 0.35, 0),
          window.VesperMat({ color: 0xe0d8c8, roughness: 0.55, metalness: 0.08 })
        );
        iceR.position.set((rnd() - 0.5) * 10, 0.14, (rnd() - 0.5) * 10);
        root.add(iceR);
      }
    }
    // Varuna / Salacia / Weywot / Nereid: TNO/moon nubs
    if ((biome === "varuna" || biome === "salacia" || biome === "weywot" || biome === "nereid") && !low) {
      for (let i = 0; i < 4; i++) {
        const nub = new THREE.Mesh(
          new THREE.DodecahedronGeometry(0.4 + rnd() * 0.35, 0),
          window.VesperMat({
            color: biome === "salacia" ? 0x9098a8 : biome === "weywot" ? 0xb8a090 : biome === "varuna" ? 0xa09888 : 0x8a8890,
            roughness: 0.9, flatShading: true,
          })
        );
        nub.position.set((rnd() - 0.5) * 10, 0.18, (rnd() - 0.5) * 10);
        root.add(nub);
      }
    }
    // Hiʻiaka / Namaka / Dysnomia: Haumea/Eris family ice nubs
    if ((biome === "hiiaka" || biome === "namaka" || biome === "dysnomia") && !low) {
      for (let i = 0; i < 5; i++) {
        const iceN = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.28 + rnd() * 0.4, 0),
          window.VesperMat({
            color: biome === "hiiaka" ? 0xe0e8f0 : biome === "namaka" ? 0xc0d0e0 : 0x788088,
            roughness: biome === "dysnomia" ? 0.7 : 0.4,
            metalness: 0.1,
            emissive: biome === "dysnomia" ? 0x101418 : 0x304050,
            emissiveIntensity: 0.12,
          })
        );
        iceN.position.set((rnd() - 0.5) * 10, 0.14, (rnd() - 0.5) * 10);
        iceN.rotation.set(rnd(), rnd(), rnd());
        root.add(iceN);
      }
    }
    // Hyp fiction props (labeled rails)
    if ((biome === "vulcan" || biome === "nemesis" || biome === "nibiru" || biome === "theia" || biome === "phaeton" || biome === "pbh" || biome === "tyche" || biome === "planetnine" || biome === "planetx") && !low) {
      const hypCols = {
        vulcan: 0x8a4018, nemesis: 0x601828, nibiru: 0x702828, theia: 0xa07050,
        phaeton: 0x8a7860, pbh: 0x282848, tyche: 0xa0b8c8, planetnine: 0x6088a0, planetx: 0x8090a0,
      };
      const col = hypCols[biome] || 0x808090;
      for (let i = 0; i < 5; i++) {
        const geo = biome === "phaeton" || biome === "pbh"
          ? new THREE.DodecahedronGeometry(0.35 + rnd() * 0.4, 0)
          : biome === "tyche" || biome === "planetnine"
            ? new THREE.OctahedronGeometry(0.3 + rnd() * 0.35, 0)
            : new THREE.DodecahedronGeometry(0.32 + rnd() * 0.38, 0);
        const nub = new THREE.Mesh(
          geo,
          window.VesperMat({
            color: col,
            roughness: biome === "pbh" ? 0.35 : 0.85,
            metalness: biome === "pbh" ? 0.55 : 0.06,
            emissive: biome === "vulcan" || biome === "nemesis" ? 0x401008 : biome === "pbh" ? 0x201040 : 0x101018,
            emissiveIntensity: biome === "vulcan" || biome === "nemesis" || biome === "pbh" ? 0.22 : 0.1,
            flatShading: true,
          })
        );
        nub.position.set((rnd() - 0.5) * 10, 0.16, (rnd() - 0.5) * 10);
        nub.rotation.set(rnd(), rnd(), rnd());
        root.add(nub);
      }
      // Fiction label pip (small glowing marker — Hyp honesty)
      const hypPip = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 8, 6),
        window.VesperMat({
          color: 0xe0c060, emissive: 0xc0a040, emissiveIntensity: 0.9, roughness: 0.35,
        })
      );
      hypPip.position.set(2.2, 0.35, -1.5);
      hypPip.name = "hypFictionPip";
      root.add(hypPip);
    }

        // Venus heat haze shell
    if (biome === "venus") {
      const hazeShell = new THREE.Mesh(
        new THREE.SphereGeometry(extent * 0.9, 16, 10),
        new THREE.MeshBasicMaterial({
          color: 0xe8c060, transparent: true, opacity: 0.08, depthWrite: false, side: THREE.BackSide,
        })
      );
      hazeShell.position.y = 2;
      root.add(hazeShell);
    }
    // Social/memorial denser interiors
    if (biome === "titan" || biome === "pluto" || biome === "triton" || biome === "ceres" || biome === "deimos") {
      const booth = new THREE.Group();
      booth.name = "cantinaBooth";
      const table = new THREE.Mesh(
        new THREE.CylinderGeometry(0.45, 0.5, 0.08, 12),
        window.VesperMat({ color: 0x5a4a3a, roughness: 0.7 })
      );
      table.position.set(-7, 0.45, 1);
      const seat = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.35, 0.4),
        window.VesperMat({ color: 0x3a4048, roughness: 0.75 })
      );
      seat.position.set(-7, 0.25, 1.7);
      const neon = window.VesperNoLight(biome === "titan" ? 0xffa060 : 0x80c0ff, 0.4, 6, 2);
      neon.position.set(-7, 1.2, 1);
      const sign = new THREE.Mesh(
        new THREE.PlaneGeometry(1.0, 0.25),
        new THREE.MeshBasicMaterial({ color: biome === "titan" ? 0xff9060 : 0x60b0ff, transparent: true, opacity: 0.7 })
      );
      sign.position.set(-7, 1.35, 0.6);
      booth.add(table, seat, neon, sign);
      root.add(booth);
    }
    // Generic walkable shelter on most solid biomes (anti-empty)
    if (biome !== "gas" && biome !== "venus") {
      const shelter = new THREE.Group();
      shelter.name = "genericWalkInterior";
      // Full walkable hut (not a flat facade prop)
      const SW = 6, SD = 5, SH = 2.8;
      // Starboard of the hangar is the cabin (x ≈ 14). The hut used to
      // sit at x=10, so its wall cut through the cabin aisle.
      const SX = -22, SZ = -6;
      const wallM = window.VesperMat({ color: 0x404850, metalness: 0.35, roughness: 0.55, emissive: 0x102030, emissiveIntensity: 0.12 });
      const sf = new THREE.Mesh(
        new THREE.BoxGeometry(SW, 0.1, SD),
        window.VesperMat({ color: 0x303840, metalness: 0.35, roughness: 0.7 })
      );
      sf.position.set(SX, 0.05, SZ);
      const ceil = new THREE.Mesh(new THREE.BoxGeometry(SW, 0.08, SD), wallM);
      ceil.position.set(SX, SH, SZ);
      const back = new THREE.Mesh(new THREE.BoxGeometry(SW, SH, 0.12), wallM);
      back.position.set(SX, SH / 2, SZ - SD / 2);
      const left = new THREE.Mesh(new THREE.BoxGeometry(0.12, SH, SD), wallM);
      left.position.set(SX - SW / 2, SH / 2, SZ);
      const right = new THREE.Mesh(new THREE.BoxGeometry(0.12, SH, SD), wallM);
      right.position.set(SX + SW / 2, SH / 2, SZ);
      const sl = window.VesperNoLight(0xc0d8ff, 0.55, 12, 2);
      sl.position.set(SX, SH - 0.5, SZ);
      const bunk = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.35, 2.0),
        window.VesperMat({ color: 0x4a5560, roughness: 0.75 })
      );
      bunk.position.set(SX - 1.8, 0.25, SZ);
      const desk = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.7, 0.55),
        window.VesperMat({ color: 0x203040, emissive: 0x3080c0, emissiveIntensity: 0.35 })
      );
      desk.position.set(SX + 1.5, 0.45, SZ - 1.5);
      const crate = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.5, 0.6),
        window.VesperMat({ color: 0x6a5a48 })
      );
      crate.position.set(SX - 0.5, 0.3, SZ + 1.5);
      // Door ring (open +Z)
      const door = new THREE.Mesh(
        new THREE.TorusGeometry(0.85, 0.07, 6, 16),
        window.VesperMat({ color: 0x70e0c0, emissive: 0x20a080, emissiveIntensity: 0.45, metalness: 0.5, roughness: 0.3 })
      );
      door.position.set(SX, 1.1, SZ + SD / 2 - 0.1);
      shelter.add(sf, ceil, back, left, right, sl, bunk, desk, crate, door);
      root.add(shelter);
    }
    // Local fill for readability
    const fill = window.VesperNoLight(
      biome === "earth"
        ? 0xb0e0ff
        : biome === "mars" || biome === "pluto" || biome === "sedna" || biome === "makemake" || biome === "charon" || biome === "ixion" || biome === "amalthea" || biome === "eros" || biome === "vulcan" || biome === "nibiru" || biome === "theia" || biome === "nemesis"
          ? 0xffc090
          : biome === "venus" || biome === "io"
            ? 0xffe0a0
            : biome === "titan"
              ? 0xffb070
              : biome === "luna" || biome === "mercury" || biome === "phobos" || biome === "deimos" || biome === "iapetus" || biome === "vesta" || biome === "pallas" || biome === "ida" || biome === "himalia" || biome === "varuna"
                ? 0xd8d0c0
                : biome === "hyperion" || biome === "halley" || biome === "encke" || biome === "orcus" || biome === "hiiaka" || biome === "namaka" || biome === "tyche" || biome === "planetnine" || biome === "planetx"
                  ? 0xc8d8e8
                  : biome === "proteus" || biome === "larissa" || biome === "dysnomia" || biome === "pbh"
                    ? 0xa0a0b0
                    : biome === "phaeton"
                      ? 0xd8c8a0
                      : 0xd0e0ff,
      biome === "mars" || biome === "titan" || biome === "pluto" || biome === "sedna" || biome === "makemake" || biome === "charon" || biome === "ixion" || biome === "amalthea"
        ? 0x401808
        : biome === "venus" || biome === "io"
          ? 0x503010
          : biome === "phobos" || biome === "deimos" || biome === "iapetus" || biome === "proteus" || biome === "phoebe"
            ? 0x100c08
            : 0x1a1810,
      biome === "deck" ? 0.55 : biome === "venus" || biome === "io" ? 0.5 : 0.35
    );
    root.add(fill);
    scene.add(root);
    active = { bodyName: bodyName, biome: biome, extent: extent };
    // Dense places / hubs / NPCs (EVE-inspired activity, IP-free)
    try {
      if (window.VesperPlaces && window.VesperPlaces.onSurfaceAttach) {
        window.VesperPlaces.onSurfaceAttach(bodyName);
      }
    } catch (e) { console.warn("[vesper-surfaces places]", e); }
    return root;
  }

  function sync(worldPos, up) {
    if (!root || !worldPos || !up || !THREE) return;
    // Land once. A per-frame copy glued the hangar and cabin to the feet,
    // so walking never changed your distance to a door.
    if (anchored) return;
    root.position.copy(worldPos);
    if (!_q) {
      _q = new THREE.Quaternion();
      _upY = new THREE.Vector3(0, 1, 0);
    }
    _q.setFromUnitVectors(_upY, up);
    root.quaternion.copy(_q);
    if (!anchorPos) anchorPos = new THREE.Vector3();
    if (!anchorUp) anchorUp = new THREE.Vector3();
    anchorPos.copy(worldPos);
    anchorUp.copy(up).normalize();
    anchored = true;
  }

  function padNear(pos) {
    if (!anchored || !anchorPos || !anchorUp || !pos) return false;
    if (!_rel) _rel = new THREE.Vector3();
    _rel.copy(pos).sub(anchorPos);
    const along = _rel.dot(anchorUp);
    const h2 = _rel.lengthSq() - along * along;
    const lim = padExtent * 0.96;
    return h2 <= lim * lim;
  }

  function padUp(out) {
    if (!anchored || !anchorUp || !out) return false;
    out.copy(anchorUp);
    return true;
  }

  // Keep EVA on the pad plane. Sphere reprojection sinks the eye through
  // the hangar floor on small bodies (the pad is flat; the mesh is not).
  function growPad(radius) {
    if (!root || !THREE || !(radius > padExtent)) return;
    padExtent = radius;
    if (active) active.extent = radius;
    const disc = root.getObjectByName("vesperPadDisc");
    if (!disc) return;
    const segs = (disc.geometry && disc.geometry.parameters && disc.geometry.parameters.segments) || 48;
    disc.geometry.dispose();
    disc.geometry = new THREE.CircleGeometry(radius, segs);
  }

  function flatten(pos) {
    if (!padNear(pos)) return false;
    const along = _rel.dot(anchorUp);
    pos.addScaledVector(anchorUp, -along);
    return true;
  }

  function detach() {
    anchored = false;
    anchorPos = null;
    anchorUp = null;
    if (root && root.parent) root.parent.remove(root);
    if (root) {
      root.traverse((ch) => {
        if (ch.geometry) ch.geometry.dispose();
        if (ch.material) {
          if (ch.material.map) ch.material.map.dispose();
          ch.material.dispose();
        }
      });
    }
    root = null;
    active = null;
  }

  window.VesperSurfaces = {
    attach: attach,
    sync: sync,
    detach: detach,
    padNear: padNear,
    padUp: padUp,
    flatten: flatten,
    growPad: growPad,
    active: () => active,
    biomeFor: biomeFor,
  };
})();
