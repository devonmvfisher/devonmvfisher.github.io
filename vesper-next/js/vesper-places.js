/**
 * VesperPlaces — EVE-inspired density (IP-free): landable hubs, NPCs, activity
 * beacons, light missions. Avoid empty icon checklists — every site has
 * a reason to visit (trade, radio, research, refuge, fiction megastructure).
 *
 * Sol = science honesty. Hyp = labeled fiction.
 */
(function () {
  "use strict";

  let THREE, scene, rootGroup;
  let hubs = [];
  let missions = [];
  let npcPulse = 0;
  const liveRoots = [];
  const trafficAgents = [];
  let _npcWp = null;
  let landedRoot = null;
  let volCabin = null;
  let volDock = null;
  let aboardId = null;
  let _surfLocal = null;

  function groundYOf(surfaceRoot) {
    if (!surfaceRoot) return -0.14;
    for (let i = 0; i < surfaceRoot.children.length; i++) {
      const ch = surfaceRoot.children[i];
      if (ch.geometry && ch.geometry.type === "CircleGeometry") return ch.position.y;
    }
    return -0.14;
  }
  function trackLive(root) {
    if (root && liveRoots.indexOf(root) < 0) liveRoots.push(root);
  }
  let toastEl = null;
  let missionHud = null;
  const LS_MISSIONS = "vesper.missions.v1";

  const HUB_DEFS = [
    { id: "leo-refuge", name: "LEO Refuge Ring", body: "Earth", au: 1.0, y: 90, angle: 0, kind: "station",
      blurb: "Low-orbit refuge · radio desk · soft-land hangar", purpose: "refuge", hyp: false },
    { id: "iss-dock", name: "ISS Dock Annex", body: "ISS", kind: "dock",
      blurb: "Working labs · crew notice board · Skytape rack", purpose: "research", hyp: false },
    { id: "luna-gate", name: "Luna Gateway Hub", body: "Luna Gateway", kind: "gateway",
      blurb: "Transfer lounge · EVA lock · Hope beacon desk", purpose: "transit", hyp: false },
    { id: "apollo-cairn", name: "Apollo Cairn Walk", body: "Moon", kind: "surface",
      blurb: "Historic cairn · plaque walk · quiet radio", purpose: "memorial", hyp: false },
    { id: "deimos-yard", name: "Deimos Yard", body: "Deimos", kind: "surface",
      blurb: "Phobos-facing yard · ore sample desk · night watch NPC", purpose: "yard", hyp: false },
    { id: "deimos-radio", name: "Deimos Relay", body: "Deimos", kind: "surface", offset: [4, 0, -3],
      blurb: "Belt relay dish · Sky Radio uplink · spare suits", purpose: "radio", hyp: false },
    { id: "phobos-stickney", name: "Stickney Overlook", body: "Phobos", kind: "surface",
      blurb: "Crater rim camp · survey spikes · short EVA loop", purpose: "survey", hyp: false },
    { id: "mars-oasis", name: "Noctis Bench", body: "Mars", kind: "surface",
      blurb: "Canyon bench · dust radio · greenhouse dome (small)", purpose: "camp", hyp: false },
    { id: "ceres-occator", name: "Occator Salt Desk", body: "Ceres", kind: "surface",
      blurb: "Bright salts · Dawn memorial · sample trade", purpose: "trade", hyp: false },
    { id: "vesta-vestibule", name: "Vesta Vestibule", body: "Vesta", kind: "surface",
      blurb: "Rheasilvia rim shelter · geology chalkboard", purpose: "research", hyp: false },
    { id: "psyche-forge", name: "Psyche Forge Hint", body: "Psyche", kind: "surface",
      blurb: "M-type metal dream · forge lamp · mining care note", purpose: "industry", hyp: false },
    { id: "obs-station", name: "Observation Station", body: "Observation Station", kind: "station",
      blurb: "Belt habitat · Skytape · Sky Radio · society desk", purpose: "social", hyp: false },
    { id: "trojan-l4", name: "Greek Camp L4", body: null, au: 5.2, angle: 1.2, kind: "camp",
      blurb: "Trojan swarm camp · ice trade · watch fire", purpose: "camp", hyp: false },
    { id: "trojan-l5", name: "Trojan Camp L5", body: null, au: 5.2, angle: -1.2, kind: "camp",
      blurb: "Trailing camp · comet rumor board", purpose: "camp", hyp: false },
    { id: "europa-lineae", name: "Lineae Field Desk", body: "Europa", kind: "surface",
      blurb: "Ice crack desk · plume watch · quiet hope", purpose: "research", hyp: false },
    { id: "enceladus-plume", name: "Plume Walk", body: "Enceladus", kind: "surface",
      blurb: "Tiger-stripe overlook · sample vials · radio hush", purpose: "research", hyp: false },
    { id: "titan-shore", name: "Kraken Shore", body: "Titan", kind: "surface",
      blurb: "Methane shore lamp · raft rumor · thick-sky cafe", purpose: "social", hyp: false },
    { id: "pluto-heart", name: "Sputnik Rim", body: "Pluto", kind: "surface",
      blurb: "Heart-edge cairn · New Horizons note · Charon view", purpose: "memorial", hyp: false },
    { id: "kuiper-waystation", name: "Kuiper Waystation", body: null, au: 42, angle: 0.7, kind: "station",
      blurb: "Icy waystation · Oort rumor · long-range radio", purpose: "transit", hyp: false },
    { id: "vulcan-watch", name: "Vulcan Watch (Hyp)", body: "Vulcan", kind: "surface",
      blurb: "Hyp fiction · intramercurial watch tower", purpose: "fiction", hyp: true },
    { id: "phaeton-ruin", name: "Phaeton Ruin (Hyp)", body: "Phaeton", kind: "surface",
      blurb: "Hyp fiction · shattered-world memorial arch", purpose: "fiction", hyp: true },
    { id: "p9-listen", name: "P9 Listen Array (Hyp)", body: "Planet Nine", kind: "surface",
      blurb: "Hyp fiction · deep-orbit listen dishes", purpose: "fiction", hyp: true },
    { id: "dyson-whisper", name: "Dyson Whisper Ring (Hyp)", body: null, au: 0.55, angle: 2.1, y: 40, kind: "mega",
      blurb: "Hyp fiction · partial swarm arc — Kardashev dream, labeled", purpose: "fiction", hyp: true },
    { id: "gateway-helix", name: "Helix Hab (Hyp)", body: null, au: 1.6, angle: -0.8, y: 120, kind: "mega",
      blurb: "Hyp fiction · rotating hab helix · market deck", purpose: "fiction", hyp: true },
    { id: "mercury-shade", name: "Mercury Shade Camp", body: "Mercury", kind: "surface",
      blurb: "Terminator camp · heat-shadow desk · solar watch", purpose: "camp", hyp: false },
    { id: "venus-high", name: "Venus High Balloon (disp.)", body: "Venus", kind: "surface",
      blurb: "Display fiction float deck · acid-safe note · radio", purpose: "research", hyp: false },
    { id: "ganymede-grove", name: "Ganymede Grove Desk", body: "Ganymede", kind: "surface",
      blurb: "Furrowed ice desk · magnetosphere tip · quiet NPC", purpose: "research", hyp: false },
    { id: "callisto-valhalla", name: "Valhalla Rim", body: "Callisto", kind: "surface",
      blurb: "Ancient basin overlook · long-stay shelter", purpose: "camp", hyp: false },
    { id: "io-vent", name: "Io Vent Watch", body: "Io", kind: "surface",
      blurb: "Sulfur vent overlook · heat suit warning · sample tongs", purpose: "survey", hyp: false },
    { id: "triton-cantina", name: "Triton Cantina Stub", body: "Triton", kind: "surface",
      blurb: "Nitrogen shore lamp · rumor board · thin cantina", purpose: "social", hyp: false },
    { id: "charon-ferry", name: "Charon Ferry Mark", body: "Charon", kind: "surface",
      blurb: "Tidal-lock ferry mark · Pluto view bench", purpose: "transit", hyp: false },
    { id: "makemake-frost", name: "Makemake Frost Desk", body: "Makemake", kind: "surface",
      blurb: "Methane frost desk · classical Kuiper quiet", purpose: "research", hyp: false },
    { id: "haumea-spin", name: "Haumea Spin Rail", body: "Haumea", kind: "surface",
      blurb: "Fast-spin rail stub · elongate-world tip", purpose: "survey", hyp: false },
    { id: "eris-dark", name: "Eris Dark Desk", body: "Eris", kind: "surface",
      blurb: "Distant dark desk · Dysnomia sightline", purpose: "research", hyp: false },
    { id: "sedna-long", name: "Sedna Long-Year Post", body: "Sedna", kind: "surface",
      blurb: "Long-year post · deep-time plaque · radio hush", purpose: "memorial", hyp: false },
    { id: "jwst-observe", name: "JWST Observe Deck", body: "JWST", kind: "dock",
      blurb: "Sunshield walk · observe desk · no-touch mirrors note", purpose: "research", hyp: false },
    { id: "hubble-bay", name: "Hubble Service Bay", body: "Hubble", kind: "dock",
      blurb: "Service bay · instrument story · quiet EVA rail", purpose: "research", hyp: false },
    { id: "tiangong-tea", name: "Tiangong Tea Nook", body: "Tiangong", kind: "dock",
      blurb: "Tea nook · lab window · crew note wall", purpose: "social", hyp: false },
    { id: "belt-assay-a", name: "Assay Outpost A", body: null, au: 2.4, angle: 0.3, kind: "station",
      blurb: "Main-belt assay · ore tag desk · sample trade", purpose: "trade", hyp: false },
    { id: "belt-assay-b", name: "Assay Outpost B", body: null, au: 2.8, angle: 2.0, kind: "station",
      blurb: "Belt assay · ice/rock sorter · night shift NPC", purpose: "industry", hyp: false },
    { id: "belt-clinic", name: "Belt Clinic Pod", body: null, au: 3.0, angle: -1.4, kind: "station",
      blurb: "Clinic pod · suit patch rack · calm radio", purpose: "refuge", hyp: false },
    { id: "belt-market", name: "Pallas Market Drift", body: null, au: 2.6, angle: 4.0, kind: "station",
      blurb: "Drift market · spare parts · rumor chalk", purpose: "trade", hyp: false },
    { id: "saturn-ring-skim", name: "Ring Skim Rest", body: "Saturn", kind: "dock",
      blurb: "Ring-plane rest buoy · soft skim tip · photo rail", purpose: "transit", hyp: false },
    { id: "uranus-tilt", name: "Uranus Tilt Desk", body: "Uranus", kind: "dock",
      blurb: "Tilt-world desk · pale aqua quiet", purpose: "research", hyp: false },
    { id: "neptune-dark", name: "Neptune Dark Desk", body: "Neptune", kind: "dock",
      blurb: "Dark desk · Triton ferry rumor · storm watch", purpose: "research", hyp: false },
    { id: "oort-whisper", name: "Oort Whisper Buoy", body: null, au: 260, angle: 0.2, kind: "station",
      blurb: "Oort representation buoy · comet lullaby radio", purpose: "transit", hyp: false },
    { id: "nemesis-shadow", name: "Nemesis Shadow (Hyp)", body: "Nemesis", kind: "surface",
      blurb: "Hyp fiction · dark companion watch", purpose: "fiction", hyp: true },
    { id: "tyche-ice", name: "Tyche Ice Hall (Hyp)", body: "Tyche", kind: "surface",
      blurb: "Hyp fiction · distant ice hall", purpose: "fiction", hyp: true },
    { id: "nibiru-arch", name: "Nibiru Arch (Hyp)", body: "Nibiru", kind: "surface",
      blurb: "Hyp fiction · crossing arch · labeled myth", purpose: "fiction", hyp: true },
    { id: "theia-scar", name: "Theia Scar Bench (Hyp)", body: "Theia", kind: "surface",
      blurb: "Hyp fiction · impact-scar bench · Moon story", purpose: "fiction", hyp: true },
    { id: "pbh-lens", name: "PBH Lens Desk (Hyp)", body: "PBH-Halo", kind: "surface",
      blurb: "Hyp fiction · microlens desk · dark matter dream", purpose: "fiction", hyp: true },
    { id: "ringworld-arc", name: "Ringworld Arc Stub (Hyp)", body: null, au: 1.15, angle: 3.4, y: 80, kind: "mega",
      blurb: "Hyp fiction · partial ring arc — Kardashev max dream", purpose: "fiction", hyp: true },
    { id: "bishop-hab", name: "Bishop Hab Stack (Hyp)", body: null, au: 1.35, angle: -2.2, y: 95, kind: "mega",
      blurb: "Hyp fiction · stacked hab drums · market spine", purpose: "fiction", hyp: true },
    { id: "belt-refinery", name: "Belt Refinery Spur", body: null, au: 2.55, angle: 1.7, kind: "station",
      blurb: "Ore melt spur · heat exchangers · assay drop", purpose: "industry", hyp: false },
    { id: "belt-garden", name: "Belt Garden Cylinder", body: null, au: 2.9, angle: -2.6, kind: "station",
      blurb: "Spin-garden greens · oxygen trade · quiet cafe", purpose: "social", hyp: false },
    { id: "mars-phobos-ferry", name: "Phobos Ferry Mark", body: "Phobos", kind: "surface",
      blurb: "Ferry chalk · Deimos schedule · dust tea", purpose: "transit", hyp: false },
    { id: "moon-shalbatana", name: "Shackleton Rim Camp", body: "Moon", kind: "surface",
      blurb: "Polar rim camp · ice rumor · radio hush", purpose: "camp", hyp: false },
    { id: "enceladus-lab", name: "Tiger Stripe Lab", body: "Enceladus", kind: "surface",
      blurb: "Plume sample lab · sealed vials · Listen tip", purpose: "research", hyp: false },
    { id: "ganymede-library", name: "Ganymede Furrow Library", body: "Ganymede", kind: "surface",
      blurb: "Ice furrow library · chalk maps · quiet NPC", purpose: "research", hyp: false },
    { id: "callisto-archive", name: "Valhalla Archive", body: "Callisto", kind: "surface",
      blurb: "Long-stay archive · radiation shelter · tea", purpose: "refuge", hyp: false },
    { id: "io-forge", name: "Io Sulfur Forge", body: "Io", kind: "surface",
      blurb: "Heat-caution forge · sample tongs · vent watch", purpose: "industry", hyp: false },
    { id: "dyson-spoke", name: "Dyson Spoke Hab (Hyp)", body: null, au: 0.7, angle: 0.9, y: 60, kind: "mega",
      blurb: "Hyp fiction · spoke hab on partial swarm", purpose: "fiction", hyp: true },
    { id: "stellar-engine", name: "Stellar Engine Stub (Hyp)", body: null, au: 0.4, angle: -1.1, y: 30, kind: "mega",
      blurb: "Hyp fiction · Kardashev shove dream — labeled", purpose: "fiction", hyp: true },
    { id: "matrioshka", name: "Matrioshka Shell Hint (Hyp)", body: null, au: 1.9, angle: 2.7, y: 150, kind: "mega",
      blurb: "Hyp fiction · nested shell whisper — Kardashev max dream", purpose: "fiction", hyp: true },
    { id: "earth-lagrange", name: "Earth–Moon L5 Commons", body: null, au: 1.0, angle: 2.4, y: 70, kind: "station",
      blurb: "L5 commons · garden trade · Refuge annex", purpose: "social", hyp: false },
    { id: "mars-areostation", name: "Areostationary Relay", body: "Mars", kind: "dock",
      blurb: "High Mars relay · dust weather · Brick tip channel", purpose: "transit", hyp: false },
    { id: "venus-balloon-dock", name: "Venus Float Dock (disp.)", body: "Venus", kind: "surface",
      blurb: "Display fiction float deck · acid-safe note · radio", purpose: "research", hyp: false },
    { id: "triton-cantina-plus", name: "Triton Night Cantina", body: "Triton", kind: "surface",
      blurb: "Nitrogen shore cantina · rumor board · thin music", purpose: "social", hyp: false },
    { id: "pluto-heart-cafe", name: "Sputnik Rim Cafe", body: "Pluto", kind: "surface",
      blurb: "Heart-edge cafe · Charon window · quiet notes", purpose: "social", hyp: false },
    { id: "ceres-dawn-memorial", name: "Dawn Memorial Walk", body: "Ceres", kind: "surface",
      blurb: "Occator memorial · salt path · sample desk", purpose: "memorial", hyp: false },
    { id: "obs-lounge", name: "Observation Lounge Annex", body: "Observation Station", kind: "station",
      blurb: "Lounge · Skytape rack · society desk overflow", purpose: "social", hyp: false },
    { id: "iapetus-ridge", name: "Iapetus Ridge Camp", body: "Iapetus", kind: "surface",
      blurb: "Equatorial ridge camp · yin-yang tip · quiet radio", purpose: "camp", hyp: false },
    { id: "rhea-ice-desk", name: "Rhea Ice Desk", body: "Rhea", kind: "surface",
      blurb: "Bright ice desk · crater chalk · survey spikes", purpose: "research", hyp: false },
    { id: "hyperion-tumble", name: "Hyperion Tumble Post", body: "Hyperion", kind: "surface",
      blurb: "Chaotic tumble post · sponge-world tip · hold rails", purpose: "survey", hyp: false },
    { id: "mimas-herschel", name: "Herschel Rim Bench", body: "Mimas", kind: "surface",
      blurb: "Giant crater rim bench · quiet photo · short EVA", purpose: "memorial", hyp: false },
    { id: "belt-cantina", name: "Belt Drift Cantina", body: null, au: 2.7, angle: 0.9, kind: "station",
      blurb: "Drift cantina · rumor board · recycled tea", purpose: "social", hyp: false },
    { id: "kuiper-commons", name: "Kuiper Commons Annex", body: null, au: 44, angle: -0.5, kind: "station",
      blurb: "Outer commons · long-watch bunk · Listen desk", purpose: "refuge", hyp: false },
    { id: "miranda-verona", name: "Verona Rupes Camp", body: "Miranda", kind: "surface",
      blurb: "Cliff-edge camp · hold rails · quiet photo", purpose: "camp", hyp: false },
    { id: "ariel-canyon", name: "Ariel Canyon Desk", body: "Ariel", kind: "surface",
      blurb: "Canyon chalk · fault map · survey spikes", purpose: "research", hyp: false },
    { id: "umbriel-dark", name: "Umbriel Dark Desk", body: "Umbriel", kind: "surface",
      blurb: "Dark crater desk · pale quiet · Listen tip", purpose: "research", hyp: false },
    { id: "titania-fault", name: "Titania Fault Bench", body: "Titania", kind: "surface",
      blurb: "Fault-line bench · long-stay note · tea stub", purpose: "camp", hyp: false },
    { id: "oberon-rim", name: "Oberon Rim Cairn", body: "Oberon", kind: "surface",
      blurb: "Outer Uranian cairn · deep quiet · radio hush", purpose: "memorial", hyp: false },
    { id: "dione-wisps", name: "Dione Wisps Desk", body: "Dione", kind: "surface",
      blurb: "Wispy terrain desk · ice chalk · survey", purpose: "research", hyp: false },
    { id: "tethys-odysseus", name: "Odysseus Rim Camp", body: "Tethys", kind: "surface",
      blurb: "Giant crater rim · Ithaca Chasma tip · camp lamp", purpose: "camp", hyp: false },
    { id: "phoebe-dark", name: "Phoebe Dark Yard", body: "Phoebe", kind: "surface",
      blurb: "Captured-yard · dark boulder desk · belt rumor", purpose: "yard", hyp: false },
    { id: "belt-spare-parts", name: "Spare Parts Drift", body: null, au: 2.35, angle: -0.7, kind: "station",
      blurb: "Parts rack · thruster tips · honest scrap trade", purpose: "industry", hyp: false },
    { id: "belt-listen-post", name: "Belt Listen Post", body: null, au: 3.2, angle: 1.5, kind: "station",
      blurb: "Main-belt Listen annex · crystal desk · night shift", purpose: "radio", hyp: false },
    { id: "juno-skim", name: "Juno Skim Rest", body: "Jupiter", kind: "dock",
      blurb: "Polar skim rest · radiation caution · photo rail", purpose: "transit", hyp: false },
    { id: "starman-educate", name: "Starman Educate Deck", body: "Starman Roadster", kind: "dock",
      blurb: "Educational replica note · plaque photo · no brand ad", purpose: "memorial", hyp: false },
    { id: "earth-leo-clinic", name: "LEO Clinic Annex", body: "Earth", kind: "station", au: 1.0, y: 75, angle: 0.4,
      blurb: "Clinic annex · med foam · Refuge overflow", purpose: "refuge", hyp: false },
    { id: "mars-greenhouse", name: "Noctis Greenhouse", body: "Mars", kind: "surface", offset: [-4, 0, 3],
      blurb: "Small dome greens · dust seals · Brick tip", purpose: "camp", hyp: false },
    { id: "luna-south-lab", name: "Luna South Lab", body: "Moon", kind: "surface", offset: [5, 0, 2],
      blurb: "Polar lab stub · ice rumor · Vessa channel", purpose: "research", hyp: false },
    { id: "amalthea-watch", name: "Amalthea Watch Camp", body: "Amalthea", kind: "surface",
      blurb: "Inner-Jovian camp · radiation caution · short EVA", purpose: "camp", hyp: false },
    { id: "himalia-post", name: "Himalia Distant Post", body: "Himalia", kind: "surface",
      blurb: "Irregular post · long radio · Listen tip", purpose: "radio", hyp: false },
    { id: "proteus-dark", name: "Proteus Dark Desk", body: "Proteus", kind: "surface",
      blurb: "Neptunian dark desk · Triton ferry rumor", purpose: "research", hyp: false },
    { id: "nereid-long", name: "Nereid Long Orbit Post", body: "Nereid", kind: "surface",
      blurb: "Eccentric-orbit post · deep quiet · plaque", purpose: "memorial", hyp: false },
    { id: "dysnomia-sight", name: "Dysnomia Sightline", body: "Dysnomia", kind: "surface",
      blurb: "Eris moon sightline · dark desk · sample tongs", purpose: "survey", hyp: false },
    { id: "namaka-spin", name: "Namaka Spin Mark", body: "Namaka", kind: "surface",
      blurb: "Haumea moon mark · spin tip · rail stub", purpose: "survey", hyp: false },
    { id: "hiaka-frost", name: "Hiʻiaka Frost Desk", body: "Hiʻiaka", kind: "surface",
      blurb: "Frost desk · classical Kuiper quiet", purpose: "research", hyp: false },
    { id: "vanth-shadow", name: "Orcus Shadow Post", body: "Orcus", kind: "surface",
      blurb: "Orcus moon shadow · long-year tip", purpose: "camp", hyp: false },
    { id: "ixion-ice", name: "Ixion Ice Desk", body: "Ixion", kind: "surface",
      blurb: "Classical TNO desk · ice chalk · hush", purpose: "research", hyp: false },
    { id: "varuna-elong", name: "Varuna Elongate Camp", body: "Varuna", kind: "surface",
      blurb: "Fast-spin camp · elongate tip · hold rails", purpose: "camp", hyp: false },
    { id: "quaoar-weywot", name: "Quaoar Weywot Desk", body: "Quaoar", kind: "surface",
      blurb: "Ring rumor desk · Weywot sightline · quiet", purpose: "research", hyp: false },
    { id: "gonggong-xiangliu", name: "Gonggong Far Post", body: "Gonggong", kind: "surface",
      blurb: "Red distant post · Xiangliu not in this sky · Listen", purpose: "radio", hyp: false },
    { id: "belt-ore-sorter", name: "Ore Sorter Spur", body: null, au: 2.45, angle: 2.8, kind: "station",
      blurb: "Rock/ice sorter · Assay drop · night shift", purpose: "industry", hyp: false },
    { id: "belt-medbay", name: "Belt Medbay Drift", body: null, au: 2.75, angle: -3.1, kind: "station",
      blurb: "Medbay · foam rack · Refuge overflow", purpose: "refuge", hyp: false },
    { id: "belt-library", name: "Belt Drift Library", body: null, au: 3.1, angle: 0.55, kind: "station",
      blurb: "Chalk maps · Quiet cafe · society desk", purpose: "social", hyp: false },
    { id: "trojan-l4-clinic", name: "Greek Camp Clinic", body: null, au: 5.2, angle: 1.35, kind: "camp",
      blurb: "L4 clinic stub · patch rack · tea", purpose: "refuge", hyp: false },
    { id: "trojan-l5-radio", name: "Trojan L5 Relay", body: null, au: 5.2, angle: -1.05, kind: "camp",
      blurb: "L5 relay · comet rumor · Sky Radio", purpose: "radio", hyp: false },
    { id: "earth-geo-relay", name: "GEO Relay Rest", body: null, au: 1.0, angle: -0.3, y: 110, kind: "station",
      blurb: "GEO rest buoy · Earth nightsides · Refuge tip", purpose: "transit", hyp: false },
    { id: "mars-hebes", name: "Hebes Bench", body: "Mars", kind: "surface", offset: [6, 0, -4],
      blurb: "Canyon bench · dust radio · greenhouse path", purpose: "camp", hyp: false },
    { id: "moon-aristarchus", name: "Aristarchus Overlook", body: "Moon", kind: "surface", offset: [-5, 0, -3],
      blurb: "Bright crater overlook · plaque walk · quiet", purpose: "memorial", hyp: false },
    { id: "europa-chaos", name: "Conamara Chaos Desk", body: "Europa", kind: "surface", offset: [-3, 0, 4],
      blurb: "Chaos terrain desk · plume watch · vial tip", purpose: "research", hyp: false },
    { id: "enceladus-north", name: "Enceladus North Quiet", body: "Enceladus", kind: "surface", offset: [4, 0, 2],
      blurb: "North quiet · tiger stripe radio · sample", purpose: "research", hyp: false },
    { id: "titan-ontario", name: "Ontario Lacus Lamp", body: "Titan", kind: "surface", offset: [-4, 0, 3],
      blurb: "Shore lamp · thick-sky cafe annex · Quill tip", purpose: "social", hyp: false },
    { id: "ceres-ahuna", name: "Ahuna Mons Desk", body: "Ceres", kind: "surface", offset: [-3, 0, 4],
      blurb: "Cryovolcano desk · salt path · Assay tip", purpose: "research", hyp: false },
    { id: "vesta-olbers", name: "Olbers Regio Shelter", body: "Vesta", kind: "surface", offset: [4, 0, -2],
      blurb: "Dark regio shelter · geology chalk · EVA", purpose: "camp", hyp: false },
    { id: "hyp-card-spoke", name: "Cardinal Spoke Rest (Hyp)", body: null, au: 0.85, angle: 1.8, y: 55, kind: "mega",
      blurb: "Hyp fiction · spoke rest on partial swarm", purpose: "fiction", hyp: true },
    { id: "hyp-listen-nest", name: "Listen Nest Array (Hyp)", body: null, au: 48, angle: 2.2, y: 40, kind: "mega",
      blurb: "Hyp fiction · deep listen nest — labeled", purpose: "fiction", hyp: true },
    { id: "calypso-lagrange", name: "Calypso Quiet Mark", body: "Calypso", kind: "surface",
      blurb: "Tethys Lagrange moon · quiet mark · short EVA", purpose: "camp", hyp: false },
    { id: "telesto-lagrange", name: "Telesto Soft Camp", body: "Telesto", kind: "surface",
      blurb: "Soft ice camp · hold rails · radio hush", purpose: "camp", hyp: false },
    { id: "helene-trojan", name: "Helene Trojan Mark", body: "Helene", kind: "surface",
      blurb: "Dione Trojan · survey spike · lamp", purpose: "survey", hyp: false },
    { id: "polydeuces-mark", name: "Polydeuces Mark", body: "Polydeuces", kind: "surface",
      blurb: "Dione L5 cousin · quiet post", purpose: "camp", hyp: false },
    { id: "janus-coorbit", name: "Janus Co-orbit Desk", body: "Janus", kind: "surface",
      blurb: "Co-orbital desk · Epimetheus tip · survey", purpose: "research", hyp: false },
    { id: "epimetheus-swap", name: "Epimetheus Co-orbit Post", body: "Epimetheus", kind: "surface",
      blurb: "Co-orbit post · hold rails · chalk · two circles", purpose: "survey", hyp: false },
    { id: "prometheus-shepherd", name: "Prometheus Shepherd Rest", body: "Prometheus", kind: "surface",
      blurb: "Ring shepherd rest · F-ring tip · caution", purpose: "transit", hyp: false },
    { id: "pandora-shepherd", name: "Pandora Shepherd Rest", body: "Pandora", kind: "surface",
      blurb: "Ring shepherd rest · soft skim tip", purpose: "transit", hyp: false },
    { id: "atlas-saucer", name: "Janus Saucer Desk", body: "Janus", kind: "surface",
      blurb: "Saucer-moon desk · ring tip · photo", purpose: "research", hyp: false },
    { id: "pan-enzcke", name: "Pan Encke Desk", body: "Pan", kind: "surface",
      blurb: "Encke gap desk · propeller tip · quiet", purpose: "research", hyp: false },
    { id: "larissa-post", name: "Larissa Dark Post", body: "Larissa", kind: "surface",
      blurb: "Neptunian irregular post · Triton ferry rumor", purpose: "camp", hyp: false },
    { id: "desina-watch", name: "Despina Watch", body: "Despina", kind: "surface",
      blurb: "Inner Neptune watch · radiation hush", purpose: "survey", hyp: false },
    { id: "galatea-arc", name: "Galatea Arc Desk", body: "Galatea", kind: "surface",
      blurb: "Arc-ring tip desk · quiet chalk", purpose: "research", hyp: false },
    { id: "thalassa-post", name: "Thalassa Post", body: "Thalassa", kind: "surface",
      blurb: "Inner post · short EVA · caution tag", purpose: "camp", hyp: false },
    { id: "naiad-skim", name: "Larissa Skim Rest", body: "Larissa", kind: "surface",
      blurb: "Closest Neptune moon · skim rest · caution", purpose: "transit", hyp: false },
    { id: "belt-tea-house", name: "Belt Tea House Drift", body: null, au: 2.65, angle: 3.5, kind: "station",
      blurb: "Tea house · rumor chalk · Refuge annex", purpose: "social", hyp: false },
    { id: "belt-patch-rack", name: "Patch Rack Spur", body: null, au: 2.95, angle: -0.2, kind: "station",
      blurb: "Suit patch rack · clinic overflow · calm radio", purpose: "refuge", hyp: false },
    { id: "belt-assay-c", name: "Assay Outpost C", body: null, au: 3.15, angle: 2.4, kind: "station",
      blurb: "Outer assay · ice sorter · night weights", purpose: "trade", hyp: false },
    { id: "earth-meo-relay", name: "MEO Relay Rest", body: null, au: 1.0, angle: 1.1, y: 95, kind: "station",
      blurb: "MEO rest · GPS-altitude quiet · nightsides tip", purpose: "transit", hyp: false },
    { id: "mars-olympus-bench", name: "Olympus Overlook Bench", body: "Mars", kind: "surface", offset: [8, 0, 2],
      blurb: "Volcano overlook · dust radio · Brick tip", purpose: "memorial", hyp: false },
    { id: "moon-tycho", name: "Tycho Ray Walk", body: "Moon", kind: "surface", offset: [3, 0, -6],
      blurb: "Ray crater walk · plaque · quiet photo", purpose: "memorial", hyp: false },
    { id: "io-prometheus", name: "Prometheus Plume Watch", body: "Io", kind: "surface", offset: [-3, 0, 3],
      blurb: "Plume watch · heat caution · sample tongs", purpose: "survey", hyp: false },
    { id: "ganymede-uruk", name: "Uruk Sulcus Desk", body: "Ganymede", kind: "surface", offset: [3, 0, -3],
      blurb: "Sulcus desk · magnetosphere tip · chalk", purpose: "research", hyp: false },
    { id: "callisto-asgard", name: "Asgard Rim Shelter", body: "Callisto", kind: "surface", offset: [-4, 0, 2],
      blurb: "Multi-ring rim shelter · archive tip · tea", purpose: "refuge", hyp: false },
    { id: "hyp-oort-cathedral", name: "Oort Cathedral Stub (Hyp)", body: null, au: 280, angle: -1.4, y: 60, kind: "mega",
      blurb: "Hyp fiction · ice cathedral whisper — labeled", purpose: "fiction", hyp: true },
    { id: "hyp-belt-forge", name: "Belt Kardashev Forge (Hyp)", body: null, au: 2.5, angle: -2.9, y: 45, kind: "mega",
      blurb: "Hyp fiction · forge dream on belt rail — labeled", purpose: "fiction", hyp: true },
    { id: "adrastea-ring", name: "Adrastea Ring Skim", body: "Adrastea", kind: "surface",
      blurb: "Inner Jovian skim · ring tip · caution", purpose: "transit", hyp: false },
    { id: "metis-watch", name: "Metis Watch Post", body: "Metis", kind: "surface",
      blurb: "Innermost watch · short EVA · hush", purpose: "survey", hyp: false },
    { id: "thebe-dark", name: "Thebe Dark Desk", body: "Thebe", kind: "surface",
      blurb: "Dark desk · Amalthea tip · radio", purpose: "research", hyp: false },
    { id: "elara-post", name: "Elara Distant Post", body: "Elara", kind: "surface",
      blurb: "Irregular post · long radio · Listen", purpose: "radio", hyp: false },
    { id: "pasiphae-family", name: "Pasiphae Family Camp", body: "Pasiphae", kind: "surface",
      blurb: "Retrograde family camp · quiet lamp", purpose: "camp", hyp: false },
    { id: "carme-family", name: "Carme Family Post", body: "Carme", kind: "surface",
      blurb: "Retrograde post · survey spike", purpose: "survey", hyp: false },
    { id: "ananke-family", name: "Ananke Family Desk", body: "Ananke", kind: "surface",
      blurb: "Family desk · chalk · hush", purpose: "research", hyp: false },
    { id: "sinope-far", name: "Sinope Far Post", body: "Sinope", kind: "surface",
      blurb: "Far irregular · deep quiet · plaque", purpose: "memorial", hyp: false },
    { id: "hydra-pluto", name: "Nix Outer Annex", body: "Nix", kind: "surface",
      blurb: "Pluto system outer · Charon tip · quiet", purpose: "survey", hyp: false },
    { id: "nix-pluto", name: "Nix Soft Camp", body: "Nix", kind: "surface",
      blurb: "Soft camp · binary waltz tip · lamp", purpose: "camp", hyp: false },
    { id: "kerberos-pluto", name: "Kerberos Dark Mark", body: "Kerberos", kind: "surface",
      blurb: "Dark mark · survey · hush", purpose: "survey", hyp: false },
    { id: "styx-pluto", name: "Styx Quiet Post", body: "Styx", kind: "surface",
      blurb: "Quiet post · Charon ferry rumor", purpose: "camp", hyp: false },
    { id: "belt-night-market", name: "Belt Night Market", body: null, au: 2.5, angle: 5.0, kind: "station",
      blurb: "Night market · spare parts · rumor chalk", purpose: "trade", hyp: false },
    { id: "belt-hope-desk", name: "Belt Hope Desk", body: null, au: 2.85, angle: 0.1, kind: "station",
      blurb: "Hope beacon desk · Refuge overflow · tea", purpose: "refuge", hyp: false },
    { id: "earth-heliosync", name: "Heliosync Rest Buoy", body: null, au: 1.0, angle: -1.6, y: 100, kind: "station",
      blurb: "Sun-sync rest · nightsides tip · Jax channel", purpose: "transit", hyp: false },
    { id: "mars-marineris", name: "Marineris Rim Camp", body: "Mars", kind: "surface", offset: [-7, 0, 5],
      blurb: "Canyon rim · dust radio · greenhouse path", purpose: "camp", hyp: false },
    { id: "moon-copernicus", name: "Copernicus Overlook", body: "Moon", kind: "surface", offset: [-2, 0, 7],
      blurb: "Overlook · plaque walk · quiet photo", purpose: "memorial", hyp: false },
    { id: "europa-powys", name: "Powys Regio Desk", body: "Europa", kind: "surface", offset: [4, 0, -3],
      blurb: "Regio desk · vial tip · Listen", purpose: "research", hyp: false },
    { id: "titan-ligeria", name: "Ligeia Shore Lamp", body: "Titan", kind: "surface", offset: [5, 0, -4],
      blurb: "Shore lamp annex · Quill tip · thick sky", purpose: "social", hyp: false },
    { id: "hyp-sol-garden", name: "Sol Garden Ring (Hyp)", body: null, au: 1.2, angle: 0.6, y: 70, kind: "mega",
      blurb: "Hyp fiction · garden ring stub — labeled", purpose: "fiction", hyp: true },
    { id: "leto-l4", name: "Leto L4 Quiet", body: null, au: 5.2, angle: 1.05, kind: "camp",
      blurb: "Greek camp quiet annex · tea stub · watch", purpose: "social", hyp: false },
    { id: "patroclus-l5", name: "Patroclus L5 Desk", body: null, au: 5.2, angle: -1.35, kind: "camp",
      blurb: "Trojan desk · comet chalk · radio", purpose: "research", hyp: false },
    { id: "davida-camp", name: "Davida Belt Camp", body: null, au: 3.16, angle: 1.35, kind: "camp",
      blurb: "Large belt camp · assay tip · lamp", purpose: "camp", hyp: false },
    { id: "interamnia-desk", name: "Interamnia Desk", body: "Interamnia", kind: "surface",
      blurb: "Dark desk · sample tongs · hush", purpose: "research", hyp: false },
    { id: "europa-agalara", name: "Agalara Lineae Camp", body: "Europa", kind: "surface", offset: [-5, 0, 1],
      blurb: "Lineae camp · vial tip · quiet", purpose: "camp", hyp: false },
    { id: "enceladus-damascus", name: "Damascus Sulcus Watch", body: "Enceladus", kind: "surface", offset: [-3, 0, -2],
      blurb: "Tiger stripe watch · sample · Listen", purpose: "research", hyp: false },
    { id: "belt-skytape", name: "Skytape Bay Drift", body: null, au: 2.7, angle: -1.8, kind: "station",
      blurb: "Skytape bay · Sky Radio · society overflow", purpose: "social", hyp: false },
    { id: "earth-apo-rest", name: "Apogee Rest Buoy", body: null, au: 1.0, angle: 3.0, y: 85, kind: "station",
      blurb: "High elliptical rest · nightsides · Refuge tip", purpose: "transit", hyp: false },
    { id: "herse-jupiter", name: "Herse Distant Camp", body: "Herse", kind: "surface",
      blurb: "Outer Jovian camp · quiet lamp · radio", purpose: "camp", hyp: false },
    { id: "kalyke-post", name: "Kalyke Post", body: "Kalyke", kind: "surface",
      blurb: "Irregular post · survey spike · hush", purpose: "survey", hyp: false },
    { id: "isaca-camp", name: "Iocaste Camp", body: "Iocaste", kind: "surface",
      blurb: "Family camp · chalk · short EVA", purpose: "camp", hyp: false },
    { id: "erinome-desk", name: "Erinome Desk", body: "Erinome", kind: "surface",
      blurb: "Dark desk · sample · Listen tip", purpose: "research", hyp: false },
    { id: "taygete-mark", name: "Taygete Mark", body: "Taygete", kind: "surface",
      blurb: "Mark · hold rails · quiet", purpose: "survey", hyp: false },
    { id: "chalden-post", name: "Chaldene Post", body: "Chaldene", kind: "surface",
      blurb: "Post · radio hush · lamp", purpose: "radio", hyp: false },
    { id: "belt-guild-hall", name: "Belt Guild Hall Drift", body: null, au: 2.6, angle: 1.2, kind: "station",
      blurb: "Guild hall · pins · rumor board · tea", purpose: "social", hyp: false },
    { id: "belt-seal-clinic", name: "Seal Clinic Spur", body: null, au: 2.9, angle: 4.2, kind: "station",
      blurb: "Seal clinic · injector rack · foam", purpose: "refuge", hyp: false },
    { id: "mars-sharad", name: "SHARAD Quiet Bench", body: "Mars", kind: "surface", offset: [2, 0, -8],
      blurb: "Radar-quiet bench · dust tip · Brick", purpose: "research", hyp: false },
    { id: "moon-tranquility", name: "Tranquility Memorial Walk", body: "Moon", kind: "surface", offset: [6, 0, 1],
      blurb: "Memorial walk · plaque · quiet photo", purpose: "memorial", hyp: false },
    { id: "titan-kraken-north", name: "Kraken North Lamp", body: "Titan", kind: "surface", offset: [-2, 0, 6],
      blurb: "North shore lamp · Quill tip · thick sky", purpose: "social", hyp: false },
    { id: "hyp-lighthouse", name: "Deep Lighthouse (Hyp)", body: null, au: 55, angle: -2.5, y: 50, kind: "mega",
      blurb: "Hyp fiction · deep lighthouse — labeled", purpose: "fiction", hyp: true },
    { id: "belt-pin-exchange", name: "Pin Exchange Drift", body: null, au: 2.55, angle: -0.4, kind: "station",
      blurb: "Pin exchange · guild overflow · rumor chalk", purpose: "trade", hyp: false },
    { id: "europa-thrace", name: "Thrace Fossae Desk", body: "Europa", kind: "surface", offset: [1, 0, 5],
      blurb: "Fossae desk · vial tip · quiet", purpose: "research", hyp: false },
    { id: "ganymede-nippur", name: "Nippur Sulcus Camp", body: "Ganymede", kind: "surface", offset: [-2, 0, 4],
      blurb: "Sulcus camp · magnet tip · lamp", purpose: "camp", hyp: false },
    { id: "callisto-adlinda", name: "Adlinda Rim Bench", body: "Callisto", kind: "surface", offset: [3, 0, -4],
      blurb: "Rim bench · archive tip · tea", purpose: "refuge", hyp: false },
    { id: "mars-utopia", name: "Utopia Planitia Camp", body: "Mars", kind: "surface", offset: [-5, 0, -6],
      blurb: "Planitia camp · dust radio · rover path", purpose: "camp", hyp: false },
    { id: "rhea-tea", name: "Rhea Quiet Tea", body: "Rhea", kind: "surface",
      blurb: "Icy tea stub · Haven tip · soft lamp", purpose: "social", hyp: false },
    { id: "dione-desk", name: "Dione Fracture Desk", body: "Dione", kind: "surface",
      blurb: "Fracture desk · chalk · Listen tip", purpose: "research", hyp: false },
    { id: "nereid-post", name: "Nereid Distant Post", body: "Nereid", kind: "surface",
      blurb: "Distant post · radio hush · lamp", purpose: "radio", hyp: false },
    { id: "pluto-sputnik", name: "Sputnik Planitia Desk", body: "Pluto", kind: "surface",
      blurb: "Heart desk · Kael tip · nitrogen hush", purpose: "research", hyp: false },
    { id: "charon-mordor", name: "Mordor Macula Watch", body: "Charon", kind: "surface",
      blurb: "Macula watch · survey spike · quiet", purpose: "survey", hyp: false },
    { id: "belt-dock-annex", name: "Dock Annex Drift", body: null, au: 2.45, angle: 2.1, kind: "station",
      blurb: "ME-scale dock practice · hangar · airlock drill", purpose: "transit", hyp: false },
    { id: "belt-cargo-yard", name: "Cargo Yard Spur", body: null, au: 2.75, angle: -2.8, kind: "station",
      blurb: "Cargo yard · job board · crate rows", purpose: "trade", hyp: false },
    { id: "mars-jezero", name: "Jezero Shore Camp", body: "Mars", kind: "surface", offset: [7, 0, 3],
      blurb: "Delta shore camp · Brick tip · rover path", purpose: "camp", hyp: false },
    { id: "moon-shackleton", name: "Shackleton Rim Annex", body: "Moon", kind: "surface", offset: [-4, 0, -5],
      blurb: "Polar rim annex · Vessa tip · ice rumor", purpose: "survey", hyp: false },
    { id: "earth-gate-hangar", name: "Gate Hangar Buoy", body: null, au: 1.02, angle: 1.7, y: 55, kind: "station",
      blurb: "LEO gate hangar · Refuge overflow · soft dock", purpose: "refuge", hyp: false },
    { id: "hyp-citadel-stub", name: "Citadel Stub (Hyp)", body: null, au: 12, angle: 0.3, y: 40, kind: "mega",
      blurb: "Hyp fiction · megastructure stub — labeled", purpose: "fiction", hyp: true },
    { id: "vesta-rheasilvia", name: "Rheasilvia Overlook", body: "Vesta", kind: "surface", offset: [2, 0, -3],
      blurb: "Basin overlook · Assay tip · photo", purpose: "survey", hyp: false },
    { id: "pallas-camp", name: "Pallas High Camp", body: "Pallas", kind: "surface",
      blurb: "High camp · ore chalk · lamp", purpose: "camp", hyp: false },
    { id: "tethys-camp", name: "Tethys Ithaca Camp", body: "Tethys", kind: "surface",
      blurb: "Ithaca camp · lamp · short EVA", purpose: "camp", hyp: false },
    { id: "enceladus-tiger", name: "Tiger Stripe Listen", body: "Enceladus", kind: "surface", offset: [4, 0, 3],
      blurb: "Stripe listen · vial tip · hush", purpose: "research", hyp: false },
    { id: "hyperion-sponge", name: "Hyperion Sponge Mark", body: "Hyperion", kind: "surface",
      blurb: "Sponge mark · tumble caution · photo", purpose: "survey", hyp: false },
    { id: "phoebe-yard", name: "Phoebe Captured Yard", body: "Phoebe", kind: "surface",
      blurb: "Captured yard · boulder tags · Assay tip", purpose: "camp", hyp: false },
    { id: "europa-cilix", name: "Cilix Crater Desk", body: "Europa", kind: "surface", offset: [-3, 0, 6],
      blurb: "Crater desk · vial · Solis tip", purpose: "research", hyp: false },
    { id: "ganymede-osiris", name: "Osiris Crater Camp", body: "Ganymede", kind: "surface", offset: [5, 0, -2],
      blurb: "Crater camp · magnet tip · lamp", purpose: "camp", hyp: false },
    { id: "callisto-vali", name: "Valhalla Rim Tea", body: "Callisto", kind: "surface", offset: [-4, 0, 5],
      blurb: "Multi-ring tea · archive tip · quiet", purpose: "refuge", hyp: false },
    { id: "belt-airlock-school", name: "Airlock School Drift", body: null, au: 2.35, angle: 3.4, kind: "station",
      blurb: "Airlock school · drill tags · Dock Hands", purpose: "refuge", hyp: false },
    { id: "mars-perseverance", name: "Delta Front Bench", body: "Mars", kind: "surface", offset: [9, 0, 6],
      blurb: "Delta front · Jezero cousin · Brick", purpose: "research", hyp: false },
    { id: "hyp-relay-garden", name: "Relay Garden (Hyp)", body: null, au: 8.5, angle: -1.1, y: 60, kind: "mega",
      blurb: "Hyp fiction · relay garden — labeled", purpose: "fiction", hyp: true },
    { id: "oberon-camp", name: "Oberon Umbriel Path", body: "Oberon", kind: "surface",
      blurb: "Dark path camp · chalk · quiet", purpose: "camp", hyp: false },
    { id: "titania-desk", name: "Titania Gertrude Desk", body: "Titania", kind: "surface",
      blurb: "Gertrude desk · fault chalk · Listen", purpose: "research", hyp: false },
    { id: "umbriel-mark", name: "Umbriel Wunda Mark", body: "Umbriel", kind: "surface",
      blurb: "Bright mark · survey · hush", purpose: "survey", hyp: false },
    { id: "proteus-post", name: "Proteus Dark Post", body: "Proteus", kind: "surface",
      blurb: "Dark post · radio · lamp", purpose: "radio", hyp: false },
    { id: "larissa-camp", name: "Larissa Camp", body: "Larissa", kind: "surface",
      blurb: "Inner Neptunian camp · hush", purpose: "camp", hyp: false },
    { id: "eris-dysnomia", name: "Dysnomia Watch", body: "Dysnomia", kind: "surface",
      blurb: "Far watch · Kael tip · restraint", purpose: "survey", hyp: false },
    { id: "makemake-desk", name: "Makemake Bright Desk", body: "Makemake", kind: "surface",
      blurb: "Bright desk · sample · Assay tip", purpose: "research", hyp: false },
    { id: "haumea-ring", name: "Haumea Ring Tip Camp", body: "Haumea", kind: "surface",
      blurb: "Fast-spin camp · ring tip · hush", purpose: "camp", hyp: false },
    { id: "earth-cupola", name: "Cupola Rest Buoy", body: null, au: 1.01, angle: -0.8, y: 45, kind: "station",
      blurb: "Cupola rest · nightsides · Refuge", purpose: "refuge", hyp: false },
    { id: "mars-olympus", name: "Olympus Overlook", body: "Mars", kind: "surface", offset: [8, 0, -8],
      blurb: "Overlook · dust tag · Brick", purpose: "survey", hyp: false },
    { id: "hyp-garden-helix", name: "Garden Helix (Hyp)", body: null, au: 18, angle: 2.2, y: 35, kind: "mega",
      blurb: "Hyp fiction · garden helix — labeled", purpose: "fiction", hyp: true },
    { id: "hector-camp", name: "Hector L4 Camp", body: null, au: 5.2, angle: 1.25, kind: "camp",
      blurb: "Trojan camp · watch fire · tea", purpose: "social", hyp: false },
    { id: "hilda-post", name: "Hilda Resonant Post", body: null, au: 4.0, angle: -0.6, kind: "camp",
      blurb: "3:2 post · radio · lamp", purpose: "radio", hyp: false },
    { id: "chiron-desk", name: "Quaoar Centaur Desk", body: "Quaoar", kind: "surface",
      blurb: "Centaur desk · coma tip · hush", purpose: "research", hyp: false },
    { id: "chariklo-ring", name: "Quaoar Ring Tip Annex", body: "Quaoar", kind: "surface",
      blurb: "Ring tip camp · photo · quiet", purpose: "survey", hyp: false },
    { id: "sedna-far", name: "Sedna Far Lamp", body: "Sedna", kind: "surface",
      blurb: "Far lamp · Kael tip · slow years", purpose: "radio", hyp: false },
    { id: "quaoar-desk", name: "Quaoar Ring Desk", body: "Quaoar", kind: "surface",
      blurb: "Ring desk · chalk · Listen", purpose: "research", hyp: false },
    { id: "gonggong-camp", name: "Gonggong Camp", body: "Gonggong", kind: "surface",
      blurb: "Far camp · lamp · hush", purpose: "camp", hyp: false },
    { id: "orcus-vanth", name: "Orcus Watch", body: "Orcus", kind: "surface",
      blurb: "Companion watch · survey · quiet", purpose: "survey", hyp: false },
    { id: "belt-tea-overflow", name: "Tea Overflow Drift", body: null, au: 2.5, angle: 5.02, kind: "station",
      blurb: "Haven overflow · tea brick · social", purpose: "social", hyp: false },
    { id: "deimos-hangar-b", name: "Deimos Hangar B", body: "Deimos", kind: "surface", offset: [-6, 0, -4],
      blurb: "Hangar B · Tess cousin · crates", purpose: "camp", hyp: false },
    { id: "salacia-ice-hall", name: "Salacia Ice Hall", body: "Salacia", kind: "surface",
      blurb: "Ice hall · Kuiper commons cousin · lamp", purpose: "refuge", hyp: false },
    { id: "eros-near-desk", name: "Eros Near Desk", body: "Eros", kind: "surface",
      blurb: "NEAR desk · saddle photo · Assay tip", purpose: "survey", hyp: false },
    { id: "ida-dactyl-view", name: "Ida–Dactyl Overlook", body: "Ida", kind: "surface",
      blurb: "Overlook toward Dactyl · photo · hush", purpose: "survey", hyp: false },
    { id: "dactyl-mark", name: "Dactyl Mark", body: "Dactyl", kind: "surface",
      blurb: "Tiny moon mark · short EVA · photo", purpose: "camp", hyp: false },
    { id: "kuiper-listen-spur", name: "Kuiper Listen Spur", body: null, au: 46, angle: 1.4, kind: "station",
      blurb: "Listen spur · outer radio · flare tip", purpose: "research", hyp: false },
    { id: "oort-hearth", name: "Oort Hearth Buoy", body: null, au: 290, angle: -0.9, y: 40, kind: "station",
      blurb: "Deep hearth buoy · tea · long watch", purpose: "refuge", hyp: false },
    { id: "belt-parts-locker", name: "Parts Locker Drift", body: null, au: 2.72, angle: 2.3, kind: "station",
      blurb: "Spare parts locker · Dock Hands · foam", purpose: "refuge", hyp: false },
    { id: "mars-hellas", name: "Hellas Rim Camp", body: "Mars", kind: "surface", offset: [8, 0, -6],
      blurb: "Basin rim camp · Brick tip · rover", purpose: "camp", hyp: false },
    { id: "moon-copernicus-rim", name: "Copernicus Rim Walk", body: "Moon", kind: "surface", offset: [-5, 0, 6],
      blurb: "Rim walk · photo · Selene tip", purpose: "survey", hyp: false },
    { id: "hyp-matrioshka-core", name: "Matrioshka Core Walk (Hyp)", body: null, au: 2.15, angle: 1.55, y: 115, kind: "mega",
      blurb: "Hyp Kardashev · nested shell walk — labeled", purpose: "fiction", hyp: true },
    { id: "hyp-stellar-forge", name: "Stellar Forge Hab (Hyp)", body: null, au: 0.48, angle: 2.6, y: 25, kind: "mega",
      blurb: "Hyp stellar-engine forge stub — labeled", purpose: "fiction", hyp: true },
    { id: "hyp-ring-garden", name: "Ring Garden Arc (Hyp)", body: null, au: 1.18, angle: -2.8, y: 70, kind: "mega",
      blurb: "Hyp ringworld garden arc — labeled", purpose: "fiction", hyp: true },
    { id: "hyp-bishop-stack", name: "Bishop Stack Walk (Hyp)", body: null, au: 1.38, angle: -1.9, y: 100, kind: "mega",
      blurb: "Hyp Bishop-ring stack walk — labeled", purpose: "fiction", hyp: true },
    { id: "europa-powys-south", name: "Powys South Lamp", body: "Europa", kind: "surface", offset: [6, 0, 4],
      blurb: "South lamp · Solis tip · vial", purpose: "social", hyp: false },
    { id: "titan-mayfly", name: "Mayfly Beach Cafe", body: "Titan", kind: "surface", offset: [3, 0, 8],
      blurb: "Thick-sky cafe · Quill · romance tip", purpose: "social", hyp: false },
    { id: "ceres-kitchen", name: "Occator Kitchen Drift", body: "Ceres", kind: "surface", offset: [-4, 0, 5],
      blurb: "Salt kitchen · Assay tip · tea", purpose: "social", hyp: false },
    { id: "vesta-south", name: "Vesta South Pole Camp", body: "Vesta", kind: "surface", offset: [-3, 0, 4],
      blurb: "South camp · Rheasilvia tip · lamp", purpose: "camp", hyp: false },
    { id: "belt-listen-desk", name: "Listen Desk Drift", body: null, au: 3.1, angle: -1.5, kind: "station",
      blurb: "Listen Society desk · restraint logs · Kael tip", purpose: "radio", hyp: false },
    { id: "belt-romance-mail", name: "Romance Mail Buoy", body: null, au: 1.8, angle: 2.4, kind: "station",
      blurb: "Letter buoy · Mira/Oriole/Tess tips · quiet", purpose: "social", hyp: false },
    { id: "moon-asgard", name: "Asgard Tea Rim", body: "Callisto", kind: "surface", offset: [6, 0, 2],
      blurb: "Asgard tea · Vessa tip · quiet", purpose: "refuge", hyp: false },
    { id: "mars-noctis", name: "Noctis Labyrinthus Bench", body: "Mars", kind: "surface", offset: [-8, 0, 2],
      blurb: "Labyrinth bench · Brick sit · dust", purpose: "camp", hyp: false },
    { id: "hyp-whisper-arch", name: "Whisper Arch (Hyp)", body: null, au: 25, angle: -3.0, y: 55, kind: "mega",
      blurb: "Hyp fiction · whisper arch — labeled", purpose: "fiction", hyp: true },
    { id: "janus-epimetheus", name: "Janus Co-orbit Lamp", body: "Janus", kind: "surface",
      blurb: "Co-orbit lamp · chalk · hush · two circles", purpose: "social", hyp: false },
    { id: "amalthea-caution", name: "Amalthea Caution Post", body: "Amalthea", kind: "surface",
      blurb: "Radiation honesty · short EVA · lamp", purpose: "survey", hyp: false },
    { id: "thebe-camp", name: "Thebe Dust Camp", body: "Thebe", kind: "surface",
      blurb: "Dust camp · hush · lamp", purpose: "camp", hyp: false },
    { id: "adrastea-mark", name: "Adrastea Mark", body: "Adrastea", kind: "surface",
      blurb: "Ring-shepherd mark · caution · quiet", purpose: "survey", hyp: false },
    { id: "metis-post", name: "Metis Inner Post", body: "Metis", kind: "surface",
      blurb: "Inner post · radio hush", purpose: "radio", hyp: false },
    { id: "himalia-camp", name: "Himalia Family Camp", body: "Himalia", kind: "surface",
      blurb: "Irregular family camp · tea · lamp", purpose: "camp", hyp: false },
    { id: "elara-desk", name: "Elara Desk", body: "Elara", kind: "surface",
      blurb: "Desk · sample · Listen tip", purpose: "research", hyp: false },
    { id: "pasiphae-post", name: "Pasiphae Retro Post", body: "Pasiphae", kind: "surface",
      blurb: "Retrograde post · radio · hush", purpose: "radio", hyp: false },
    { id: "sinope-mark", name: "Sinope Far Mark", body: "Sinope", kind: "surface",
      blurb: "Far mark · survey · quiet", purpose: "survey", hyp: false },
    { id: "earth-leo-overflow", name: "LEO Overflow Pad", body: null, au: 1.03, angle: 0.9, y: 70, kind: "station",
      blurb: "Refuge overflow · soft dock · Mira tip", purpose: "refuge", hyp: false },
    { id: "epimetheus-lamp", name: "Epimetheus Waltz Lamp", body: "Epimetheus", kind: "surface",
      blurb: "Co-orbit waltz · Janus tip · hush", purpose: "social", hyp: false },
    { id: "pandora-mark", name: "Pandora F Ring Mark", body: "Pandora", kind: "surface",
      blurb: "F-ring mark · hush · lamp", purpose: "survey", hyp: false },
    { id: "atlas-camp", name: "Janus Saucer Camp", body: "Janus", kind: "surface",
      blurb: "Saucer camp · photo · quiet", purpose: "camp", hyp: false },
    { id: "pan-desk", name: "Pan Encke Desk", body: "Pan", kind: "surface",
      blurb: "Encke gap desk · chalk · hush", purpose: "research", hyp: false },
    { id: "telesto-camp", name: "Telesto Trojan Camp", body: "Telesto", kind: "surface",
      blurb: "Tethys Trojan · lamp · tea", purpose: "camp", hyp: false },
    { id: "calypso-desk", name: "Calypso Quiet Desk", body: "Calypso", kind: "surface",
      blurb: "Quiet desk · Listen tip", purpose: "research", hyp: false },
    { id: "helene-camp", name: "Helene Dione Camp", body: "Helene", kind: "surface",
      blurb: "Dione Trojan camp · lamp", purpose: "camp", hyp: false },
    { id: "belt-foam-clinic", name: "Foam Clinic Spur", body: null, au: 2.95, angle: 1.9, kind: "station",
      blurb: "Foam clinic · seals · Wren tip", purpose: "refuge", hyp: false },
    { id: "kuiper-mail", name: "Kuiper Mail Drop", body: null, au: 42, angle: 0.4, y: 30, kind: "station",
      blurb: "Outer mail · Kael tip · hope notes", purpose: "radio", hyp: false },
    { id: "naiad-mark", name: "Larissa Inner Mark", body: "Larissa", kind: "surface",
      blurb: "Inner mark · caution · hush", purpose: "survey", hyp: false },
    { id: "thalassa-camp", name: "Thalassa Camp", body: "Thalassa", kind: "surface",
      blurb: "Camp · lamp · short EVA", purpose: "camp", hyp: false },
    { id: "despina-desk", name: "Despina Desk", body: "Despina", kind: "surface",
      blurb: "Desk · sample · quiet", purpose: "research", hyp: false },
    { id: "galatea-mark", name: "Galatea Mark", body: "Galatea", kind: "surface",
      blurb: "Mark · radio hush", purpose: "radio", hyp: false },
    { id: "larissa-south", name: "Larissa South Lamp", body: "Larissa", kind: "surface", offset: [-4.2, 0, 1.6],
      blurb: "South lamp · annex · hush", purpose: "social", hyp: false },
    { id: "hippocamp-camp", name: "Hippocamp Tiny Camp", body: "Hippocamp", kind: "surface",
      blurb: "Tiny camp · lamp · quiet", purpose: "camp", hyp: false },
    { id: "sao-post", name: "Sao Irregular Post", body: "Sao", kind: "surface",
      blurb: "Irregular post · Listen tip", purpose: "radio", hyp: false },
    { id: "laomedeia-camp", name: "Laomedeia Camp", body: "Laomedeia", kind: "surface",
      blurb: "Far camp · lamp · hush", purpose: "camp", hyp: false },
    { id: "neso-mark", name: "Neso Far Mark", body: "Neso", kind: "surface",
      blurb: "Far mark · survey · quiet", purpose: "survey", hyp: false },
    { id: "psamathe-desk", name: "Psamathe Desk", body: "Psamathe", kind: "surface",
      blurb: "Desk · chalk · hush", purpose: "research", hyp: false },
    { id: "belt-night-overflow", name: "Night Overflow Drift", body: null, au: 2.58, angle: -2.2, kind: "station",
      blurb: "Night Market overflow · Kira tip · tokens", purpose: "trade", hyp: false },
    { id: "hyp-listen-spire", name: "Listen Spire (Hyp)", body: null, au: 70, angle: 1.4, y: 80, kind: "mega",
      blurb: "Hyp fiction · listen spire — labeled", purpose: "fiction", hyp: true },
    { id: "nix-mark", name: "Nix Outer Mark", body: "Nix", kind: "surface",
      blurb: "Outer mark · Charon tip · hush", purpose: "survey", hyp: false },
    { id: "hydra-south", name: "Nix South Lamp", body: "Nix", kind: "surface", offset: [2.2, 0, 3.8],
      blurb: "South lamp · annex · quiet", purpose: "social", hyp: false },
    { id: "kerberos-camp", name: "Kerberos Camp", body: "Kerberos", kind: "surface",
      blurb: "Camp · lamp · short EVA", purpose: "camp", hyp: false },
    { id: "styx-desk", name: "Styx Quiet Desk", body: "Styx", kind: "surface",
      blurb: "Quiet desk · Listen tip", purpose: "research", hyp: false },
    { id: "actaea-camp", name: "Salacia Camp", body: "Salacia", kind: "surface",
      blurb: "Salacia companion camp · hush", purpose: "camp", hyp: false },
    { id: "weywot-mark", name: "Weywot Mark", body: "Weywot", kind: "surface",
      blurb: "Quaoar companion · chalk · quiet", purpose: "survey", hyp: false },
    { id: "xiangliu-camp", name: "Gonggong Camp Annex", body: "Gonggong", kind: "surface",
      blurb: "Gonggong companion · lamp", purpose: "camp", hyp: false },
    { id: "mk2-hiiragi", name: "Hiʻiaka Camp", body: "Hiʻiaka", kind: "surface",
      blurb: "Haumea moon camp · spin tip", purpose: "camp", hyp: false },
    { id: "namaka-desk", name: "Namaka Desk", body: "Namaka", kind: "surface",
      blurb: "Desk · sample · Assay tip", purpose: "research", hyp: false },
    { id: "belt-skytape-b", name: "Skytape Bay B", body: null, au: 2.72, angle: 0.2, kind: "station",
      blurb: "Skytape B · Sky Radio · society", purpose: "social", hyp: false },
    { id: "belt-c-type-yard", name: "C-Type Yard Drift", body: null, au: 2.9, angle: 0.85, kind: "station",
      blurb: "Carbonaceous yard · Assay tip · crates", purpose: "trade", hyp: false },
    { id: "belt-s-type-forge", name: "S-Type Forge Spur", body: null, au: 2.3, angle: -0.95, kind: "station",
      blurb: "Silicate forge · spare tips · Nori", purpose: "trade", hyp: false },
    { id: "belt-m-type-assay", name: "M-Type Assay Spur", body: null, au: 2.75, angle: 2.55, kind: "station",
      blurb: "Metal assay · honest weights · pins", purpose: "trade", hyp: false },
    { id: "trojan-l4-hearth", name: "L4 Hearth Camp", body: null, au: 5.2, angle: 1.15, kind: "camp",
      blurb: "Greek hearth · watch fire · tea", purpose: "social", hyp: false },
    { id: "trojan-l5-ice", name: "L5 Ice Trade", body: null, au: 5.2, angle: -1.45, kind: "camp",
      blurb: "Trojan ice trade · brick · radio", purpose: "trade", hyp: false },
    { id: "hilda-tea", name: "Hilda Tea Post", body: null, au: 3.95, angle: 1.7, kind: "camp",
      blurb: "3:2 tea · Haven tip · lamp", purpose: "social", hyp: false },
    { id: "cybele-camp", name: "Cybele Outer Camp", body: null, au: 3.4, angle: -2.1, kind: "camp",
      blurb: "Outer belt camp · lamp · hush", purpose: "camp", hyp: false },
    { id: "flora-desk", name: "Flora Inner Desk", body: null, au: 2.2, angle: 0.3, kind: "camp",
      blurb: "Inner desk · sample · Assay", purpose: "research", hyp: false },
    { id: "eos-family", name: "Eos Family Mark", body: null, au: 3.0, angle: 4.0, kind: "camp",
      blurb: "Family mark · survey · quiet", purpose: "survey", hyp: false },
    { id: "koronis-camp", name: "Koronis Camp", body: null, au: 2.87, angle: -3.2, kind: "camp",
      blurb: "Family camp · tea · lamp", purpose: "camp", hyp: false },
    { id: "oort-longwatch", name: "Longwatch Buoy", body: null, au: 310, angle: 1.1, y: 25, kind: "station",
      blurb: "Longwatch · Rio tip · slow tea", purpose: "radio", hyp: false },
    { id: "oort-comet-nursery", name: "Comet Nursery Stub", body: null, au: 240, angle: -2.0, y: 55, kind: "station",
      blurb: "Nursery representation · lullaby radio", purpose: "transit", hyp: false },
    { id: "oort-dark-dock", name: "Dark Dock Caution", body: null, au: 275, angle: 2.8, y: 15, kind: "station",
      blurb: "Dark dock · Kael restraint · flare tip", purpose: "radio", hyp: false },
    { id: "kuiper-cold-classic", name: "Cold Classical Desk", body: null, au: 44, angle: -0.48, kind: "station",
      blurb: "Cold classical · chalk · Listen", purpose: "research", hyp: false },
    { id: "kuiper-scattered", name: "Scattered Disk Post", body: null, au: 55, angle: 1.8, kind: "station",
      blurb: "Scattered post · radio · hush", purpose: "radio", hyp: false },
    { id: "mars-arabia", name: "Arabia Terra Camp", body: "Mars", kind: "surface", offset: [4, 0, 9],
      blurb: "Terra camp · dust radio · Brick", purpose: "camp", hyp: false },
    { id: "moon-orientale", name: "Orientale Ring Walk", body: "Moon", kind: "surface", offset: [-6, 0, 6],
      blurb: "Multi-ring walk · photo · Vessa", purpose: "memorial", hyp: false },
    { id: "earth-geo-night", name: "GEO Night Buoy", body: null, au: 1.0, angle: -2.4, y: 100, kind: "station",
      blurb: "GEO nightsides · Jax tip · hope", purpose: "refuge", hyp: false },
    { id: "hyp-softfill-arch", name: "Softfill Arch (Hyp)", body: null, au: 95, angle: -0.3, y: 70, kind: "mega",
      blurb: "Hyp fiction · softfill arch — labeled", purpose: "fiction", hyp: true },
    { id: "belt-vesper-yard", name: "Vesper Yard Drift", body: null, au: 2.48, angle: 1.55, kind: "station",
      blurb: "Player-named yard vibe · hangar drill · Tess tip", purpose: "transit", hyp: false },
    { id: "belt-quiet-library", name: "Quiet Library Spur", body: null, au: 2.62, angle: -1.7, kind: "station",
      blurb: "Oriole tip · cards · hush", purpose: "social", hyp: false },
    { id: "trojan-patroclus-annex", name: "Patroclus Annex", body: null, au: 5.2, angle: -1.55, kind: "camp",
      blurb: "L5 annex · ice · radio", purpose: "camp", hyp: false },
    { id: "trojan-hestia-fire", name: "Hestia Watch Fire", body: null, au: 5.2, angle: 0.95, kind: "camp",
      blurb: "Watch fire · Greek · tea", purpose: "social", hyp: false },
    { id: "oort-ember", name: "Ember Buoy", body: null, au: 330, angle: -1.6, y: 45, kind: "station",
      blurb: "Ember far · longwatch cousin · Rio", purpose: "radio", hyp: false },
    { id: "oort-veil", name: "Veil Post", body: null, au: 255, angle: 0.7, y: 70, kind: "station",
      blurb: "Veil post · comet chalk · hush", purpose: "survey", hyp: false },
    { id: "europa-minos", name: "Minos Lineae Camp", body: "Europa", kind: "surface", offset: [-6, 0, -5],
      blurb: "Lineae camp · Solis tip · vial", purpose: "camp", hyp: false },
    { id: "ganymede-tros", name: "Tros Sulcus Desk", body: "Ganymede", kind: "surface", offset: [3, 0, 7],
      blurb: "Sulcus desk · magnet · quiet", purpose: "research", hyp: false },
    { id: "callisto-asgard-north", name: "Asgard North Tea", body: "Callisto", kind: "surface", offset: [-5, 0, -6],
      blurb: "North tea · archive · Vessa", purpose: "refuge", hyp: false },
    { id: "enceladus-samarkand", name: "Samarkand Sulcus Watch", body: "Enceladus", kind: "surface", offset: [2, 0, 5],
      blurb: "Sulcus watch · Listen · hush", purpose: "research", hyp: false },
    { id: "io-amirani", name: "Amirani Plume Watch", body: "Io", kind: "surface", offset: [-3, 0, 4],
      blurb: "Plume watch · Pike · heat first", purpose: "survey", hyp: false },
    { id: "mercury-caloris", name: "Caloris Rim Camp", body: "Mercury", kind: "surface",
      blurb: "Rim camp · short EVA · lamp", purpose: "camp", hyp: false },
    { id: "venus-fiction-desk", name: "Venus Fiction Desk", body: "Venus", kind: "surface",
      blurb: "Display fiction walk · labeled · hush", purpose: "research", hyp: false },
    { id: "hyp-void-garden", name: "Void Garden (Hyp)", body: null, au: 120, angle: 2.6, y: 90, kind: "mega",
      blurb: "Hyp fiction · void garden — labeled", purpose: "fiction", hyp: true },
    { id: "belt-pallas-spur", name: "Pallas Spur Drift", body: null, au: 2.77, angle: 2.9, kind: "station",
      blurb: "Pallas tip · assay · quiet dock", purpose: "trade", hyp: false },
    { id: "belt-hygiea", name: "Hygiea Dark Camp", body: null, au: 3.14, angle: -0.8, kind: "camp",
      blurb: "Dark camp · lamp · hush", purpose: "camp", hyp: false },
    { id: "trojan-ajax", name: "Ajax L4 Mark", body: null, au: 5.2, angle: 1.37, kind: "camp",
      blurb: "Greek mark · watch · tea", purpose: "social", hyp: false },
    { id: "oort-pulse", name: "Pulse Buoy", body: null, au: 300, angle: 2.1, y: 35, kind: "station",
      blurb: "Pulse buoy · Rio tip · radio", purpose: "radio", hyp: false },
    { id: "mars-syria", name: "Syria Planum Camp", body: "Mars", kind: "surface", offset: [5, 0, -9],
      blurb: "Planum camp · Brick · dust", purpose: "camp", hyp: false },
    { id: "moon-schickard", name: "Schickard Floor Camp", body: "Moon", kind: "surface", offset: [4, 0, 8],
      blurb: "Floor camp · Vessa tip · quiet", purpose: "camp", hyp: false },
    { id: "europa-thrace-south", name: "Thrace South Lamp", body: "Europa", kind: "surface", offset: [5, 0, -6],
      blurb: "South lamp · Solis · vial", purpose: "social", hyp: false },
    { id: "ceres-kerwan", name: "Kerwan Basin Desk", body: "Ceres", kind: "surface", offset: [3, 0, -4],
      blurb: "Basin desk · Assay · salt tip", purpose: "research", hyp: false },
    { id: "earth-iss-cue", name: "LEO Soft Dock Cue", body: null, au: 1.01, angle: 0.25, y: 48, kind: "station",
      blurb: "Soft dock cue · Refuge · hangar tip", purpose: "refuge", hyp: false },
    { id: "belt-eunomia", name: "Eunomia Family Camp", body: null, au: 2.64, angle: 3.5, kind: "camp",
      blurb: "Family camp · tea · lamp", purpose: "camp", hyp: false },
    { id: "belt-themis", name: "Themis Ice Desk", body: null, au: 3.13, angle: 1.1, kind: "camp",
      blurb: "Ice desk · sample · Assay tip", purpose: "research", hyp: false },
    { id: "trojan-achilles", name: "Achilles L4 Desk", body: null, au: 5.2, angle: 0.88, kind: "camp",
      blurb: "Greek desk · chalk · radio", purpose: "research", hyp: false },
    { id: "oort-murmur", name: "Murmur Buoy", body: null, au: 285, angle: -2.4, y: 60, kind: "station",
      blurb: "Murmur · Listen tip · hush", purpose: "radio", hyp: false },
    { id: "titan-jingpo", name: "Jingpo Lacus Lamp", body: "Titan", kind: "surface", offset: [6, 0, -3],
      blurb: "Lacus lamp · Quill · romance tip", purpose: "social", hyp: false },
    { id: "enceladus-cairo", name: "Cairo Sulcus Watch", body: "Enceladus", kind: "surface", offset: [-4, 0, 4],
      blurb: "Sulcus watch · vial · hush", purpose: "research", hyp: false },
    { id: "ganymede-sippar", name: "Sippar Sulcus Camp", body: "Ganymede", kind: "surface", offset: [-5, 0, 2],
      blurb: "Sulcus camp · magnet · lamp", purpose: "camp", hyp: false },
    { id: "callisto-asgard-east", name: "Asgard East Bench", body: "Callisto", kind: "surface", offset: [7, 0, -3],
      blurb: "East bench · archive tea · quiet", purpose: "refuge", hyp: false },
    { id: "io-pele", name: "Pele Plume Caution", body: "Io", kind: "surface", offset: [4, 0, 3],
      blurb: "Plume caution · Pike · heat first", purpose: "survey", hyp: false },
    { id: "hyp-soft-citadel", name: "Soft Citadel (Hyp)", body: null, au: 22, angle: 0.5, y: 55, kind: "mega",
      blurb: "Hyp fiction · soft citadel — labeled", purpose: "fiction", hyp: true },
    { id: "belt-aura", name: "Aura Trade Drift", body: null, au: 2.52, angle: -2.6, kind: "station",
      blurb: "Trade drift · pins · honest scrap", purpose: "trade", hyp: false },
    { id: "belt-solace", name: "Solace Refuge Spur", body: null, au: 2.88, angle: 0.15, kind: "station",
      blurb: "Refuge spur · foam · Mira tip", purpose: "refuge", hyp: false },
    { id: "trojan-diomedes", name: "Diomedes L5 Camp", body: null, au: 5.2, angle: -0.95, kind: "camp",
      blurb: "Trojan camp · ice · watch", purpose: "camp", hyp: false },
    { id: "oort-cipher", name: "Cipher Buoy", body: null, au: 320, angle: 0.9, y: 20, kind: "station",
      blurb: "Cipher · Kael tip · restraint", purpose: "radio", hyp: false },
    { id: "mars-arctia", name: "Arcadia Planitia Camp", body: "Mars", kind: "surface", offset: [-6, 0, 8],
      blurb: "Planitia camp · rover path · Brick", purpose: "camp", hyp: false },
    { id: "moon-grimaldi", name: "Grimaldi Floor Bench", body: "Moon", kind: "surface", offset: [-7, 0, 2],
      blurb: "Floor bench · photo · quiet", purpose: "memorial", hyp: false },
    { id: "pluto-tombaugh", name: "Tombaugh Regio Desk", body: "Pluto", kind: "surface", offset: [2, 0, 4],
      blurb: "Heart desk · Cass tip · nitrogen", purpose: "research", hyp: false },
    { id: "charon-vulcan", name: "Vulcan Planum Camp", body: "Charon", kind: "surface", offset: [-2, 0, 3],
      blurb: "Planum camp · survey · hush", purpose: "camp", hyp: false },
    { id: "rhea-issana", name: "Issana Chasma Camp", body: "Rhea", kind: "surface", offset: [-4, 0, 3],
      blurb: "Chasma camp · tea · quiet", purpose: "camp", hyp: false },
    { id: "dione-padua", name: "Padua Chasmata Desk", body: "Dione", kind: "surface", offset: [-3, 0, 4],
      blurb: "Chasmata desk · chalk · Listen", purpose: "research", hyp: false },

    { id: "belt-iris", name: "Iris Assay Spur", body: null, au: 2.39, angle: 1.85, kind: "station",
      blurb: "Assay spur · ore tags · honest weights", purpose: "trade", hyp: false },
    { id: "belt-flora", name: "Flora Garden Nook", body: null, au: 2.20, angle: -1.4, kind: "station",
      blurb: "Garden nook · leaf · oxygen story", purpose: "social", hyp: false },
    { id: "trojan-patroclus", name: "Patroclus L5 Hearth", body: null, au: 5.2, angle: -1.33, kind: "camp",
      blurb: "L5 hearth · tea · watch fire", purpose: "camp", hyp: false },
    { id: "oort-vesper", name: "Vesper Outer Buoy", body: null, au: 350, angle: -0.4, y: 40, kind: "station",
      blurb: "Outer buoy · hush · Rio tip", purpose: "radio", hyp: false },
    { id: "mars-meridiani", name: "Meridiani Soft Pad", body: "Mars", kind: "surface", offset: [5, 0, -6],
      blurb: "Soft pad · rover · Brick tip", purpose: "camp", hyp: false },
    { id: "moon-aristarchus-desk", name: "Aristarchus Bright Desk", body: "Moon", kind: "surface", offset: [4, 0, 6],
      blurb: "Bright desk · photo · memorial", purpose: "memorial", hyp: false },
    { id: "europa-thrace-macula", name: "Thrace Macula Camp", body: "Europa", kind: "surface", offset: [-3, 0, -5],
      blurb: "Macula camp · vial · hush", purpose: "research", hyp: false },
    { id: "titan-punga", name: "Punga Mare Lamp", body: "Titan", kind: "surface", offset: [-5, 0, 4],
      blurb: "Mare lamp · Quill · romance tip", purpose: "social", hyp: false },
    { id: "enceladus-baghdad", name: "Baghdad Sulcus Rail", body: "Enceladus", kind: "surface", offset: [3, 0, -4],
      blurb: "Sulcus rail · plume hush · sample", purpose: "research", hyp: false },
    { id: "ganymede-tepper", name: "Tepper Sulcus Desk", body: "Ganymede", kind: "surface", offset: [4, 0, 5],
      blurb: "Sulcus desk · magnet · lamp", purpose: "research", hyp: false },
    { id: "callisto-valhalla-west", name: "Valhalla West Shelter", body: "Callisto", kind: "surface", offset: [-6, 0, 2],
      blurb: "West shelter · archive tea · quiet", purpose: "refuge", hyp: false },
    { id: "io-loki", name: "Loki Patera Watch", body: "Io", kind: "surface", offset: [-4, 0, -3],
      blurb: "Patera watch · Pike · heat first", purpose: "survey", hyp: false },
    { id: "hyp-lattice-ark", name: "Lattice Ark (Hyp)", body: null, au: 18, angle: -1.7, y: 80, kind: "mega",
      blurb: "Hyp fiction · lattice ark — labeled", purpose: "fiction", hyp: true },
    { id: "kuiper-ixion", name: "Ixion Quiet Post", body: "Ixion", kind: "surface", offset: [-3.8, 0, 2.2],
      blurb: "Quiet post · classical · Cass tip", purpose: "camp", hyp: false },
    { id: "belt-dockhands-b", name: "Dock Hands Annex B", body: null, au: 2.65, angle: 2.9, kind: "station",
      blurb: "Annex B · Tess overflow · airlock drill", purpose: "industry", hyp: false },

    { id: "belt-hebe", name: "Hebe Trade Nook", body: null, au: 2.43, angle: -0.55, kind: "station",
      blurb: "Trade nook · pins · scrap", purpose: "trade", hyp: false },
    { id: "belt-juno", name: "Juno Assay Bench", body: null, au: 2.67, angle: 2.2, kind: "station",
      blurb: "Assay bench · weights · tags", purpose: "trade", hyp: false },
    { id: "trojan-nector", name: "Nestor L4 Quiet", body: null, au: 5.2, angle: 1.07, kind: "camp",
      blurb: "L4 quiet · tea · watch", purpose: "camp", hyp: false },
    { id: "kuiper-varuna", name: "Varuna Rim Camp", body: "Varuna", kind: "surface", offset: [2, 0, 3],
      blurb: "Rim camp · classical · hush", purpose: "camp", hyp: false },
    { id: "kuiper-orcus", name: "Orcus Binary Desk", body: "Orcus", kind: "surface", offset: [-3.0, 0, 3.0],
      blurb: "Binary desk · Vanth not in this sky · Cass", purpose: "research", hyp: false },
    { id: "mars-syria-planum", name: "Syria Planum Overlook", body: "Mars", kind: "surface", offset: [-4, 0, -7],
      blurb: "Planum overlook · Brick · dust", purpose: "survey", hyp: false },
    { id: "moon-copernicus-east", name: "Copernicus East Ray", body: "Moon", kind: "surface", offset: [8, 0, -2],
      blurb: "East ray · photo · memorial", purpose: "memorial", hyp: false },
    { id: "titan-kraken-south", name: "Kraken South Lamp", body: "Titan", kind: "surface", offset: [3, 0, 7],
      blurb: "South lamp · Quill · shore", purpose: "social", hyp: false },
    { id: "hyp-whisper-stack", name: "Whisper Stack (Hyp)", body: null, au: 12, angle: 2.8, y: 45, kind: "mega",
      blurb: "Hyp fiction · whisper stack — labeled", purpose: "fiction", hyp: true },
    { id: "oort-ember-buoy", name: "Ember Long Buoy", body: null, au: 380, angle: 1.6, y: -30, kind: "station",
      blurb: "Long buoy · Ember tip · hush", purpose: "radio", hyp: false },
    { id: "phobos-limtoc", name: "Limtoc Crater Bench", body: "Phobos", kind: "surface", offset: [-4, 0, 3],
      blurb: "Crater bench · Stickney cousin · quiet", purpose: "camp", hyp: false },
    { id: "deimos-swift", name: "Swift Crater Desk", body: "Deimos", kind: "surface", offset: [-3, 0, 2],
      blurb: "Swift desk · Yard tip · radio", purpose: "radio", hyp: false },

    { id: "belt-metis-trade", name: "Metis Trade Spur", body: null, au: 2.39, angle: 0.7, kind: "station",
      blurb: "Trade spur · pins · scrap", purpose: "trade", hyp: false },
    { id: "belt-hygiea-quiet", name: "Hygiea Quiet Desk", body: null, au: 3.14, angle: -2.1, kind: "station",
      blurb: "Quiet desk · Listen tip · hush", purpose: "radio", hyp: false },
    { id: "mars-gale", name: "Gale Crater Camp", body: "Mars", kind: "surface", offset: [7, 0, -3],
      blurb: "Gale camp · rover · Brick", purpose: "camp", hyp: false },
    { id: "moon-plato", name: "Plato Floor Bench", body: "Moon", kind: "surface", offset: [-5, 0, 5],
      blurb: "Floor bench · photo · quiet", purpose: "memorial", hyp: false },
    { id: "europa-powys-b", name: "Powys Regio Desk", body: "Europa", kind: "surface", offset: [5, 0, 2],
      blurb: "Regio desk · vial · hush", purpose: "research", hyp: false },
    { id: "titan-mayda", name: "Mayda Insula Lamp", body: "Titan", kind: "surface", offset: [-2, 0, -6],
      blurb: "Insula lamp · Quill · shore", purpose: "social", hyp: false },
    { id: "enceladus-alexandria", name: "Alexandria Sulcus Rail", body: "Enceladus", kind: "surface", offset: [-3, 0, 5],
      blurb: "Sulcus rail · sample · hush", purpose: "research", hyp: false },
    { id: "callisto-adlinda-south", name: "Adlinda South Shelter", body: "Callisto", kind: "surface", offset: [4, 0, -5],
      blurb: "South shelter · archive tea", purpose: "refuge", hyp: false },
    { id: "io-tvashtar", name: "Tvashtar Plume Watch", body: "Io", kind: "surface", offset: [5, 0, -4],
      blurb: "Plume watch · Pike · heat", purpose: "survey", hyp: false },
    { id: "hyp-garden-ringlet", name: "Garden Ringlet (Hyp)", body: null, au: 8.5, angle: -2.5, y: 30, kind: "mega",
      blurb: "Hyp fiction · garden ringlet — labeled", purpose: "fiction", hyp: true },
    { id: "kuiper-salacia", name: "Salacia Classical Desk", body: "Salacia", kind: "surface", offset: [2.0, 0, 4.0],
      blurb: "Classical desk · Actaea not in this sky · Cass", purpose: "research", hyp: false },
    { id: "leo-cupola-b", name: "LEO Cupola Annex B", body: "Earth", au: 1.0, y: 110, angle: 2.6, kind: "station",
      blurb: "Cupola annex · Earth nightsides · quiet", purpose: "refuge", hyp: false },

    { id: "belt-psyche-hint", name: "Psyche Hint Yard", body: "Psyche", kind: "surface", offset: [-4, 0, 3],
      blurb: "Metal yard hint · Assay tip", purpose: "industry", hyp: false },
    { id: "triton-cantina-b", name: "Triton Cantina Annex", body: "Triton", kind: "surface", offset: [-4, 0, 3],
      blurb: "Cantina annex · rumor · social", purpose: "social", hyp: false },
    { id: "rhea-wispy", name: "Wispy Terrain Desk", body: "Rhea", kind: "surface", offset: [2, 0, 4],
      blurb: "Wispy desk · tea · quiet", purpose: "research", hyp: false },
    { id: "dione-janus-view", name: "Dione Janus View", body: "Dione", kind: "surface", offset: [-2, 0, -3],
      blurb: "Janus view · chalk · Listen", purpose: "research", hyp: false },
    { id: "oort-veil-b", name: "Veil Buoy B", body: null, au: 400, angle: -1.1, y: 50, kind: "station",
      blurb: "Veil B · hush · Rio tip", purpose: "radio", hyp: false },
    { id: "hyp-bishop-spire", name: "Bishop Spire (Hyp)", body: null, au: 15, angle: 1.4, y: 70, kind: "mega",
      blurb: "Hyp fiction · bishop spire — labeled", purpose: "fiction", hyp: true },
    { id: "vesta-rheasilvia-rim", name: "Rheasilvia Rim Camp", body: "Vesta", kind: "surface", offset: [4, 0, 2],
      blurb: "Rim camp · assay · hush", purpose: "camp", hyp: false },
    { id: "ceres-ahauna", name: "Ahuna Mons Bench", body: "Ceres", kind: "surface", offset: [5, 0, -4],
      blurb: "Mons bench · salt · Assay", purpose: "research", hyp: false },

    { id: "belt-davida-b", name: "Davida Assay B", body: null, au: 3.17, angle: 1.55, kind: "station",
      blurb: "Assay B · weights · tags", purpose: "trade", hyp: false },
    { id: "mars-jezero-b", name: "Jezero Delta Bench", body: "Mars", kind: "surface", offset: [-8, 0, 4],
      blurb: "Delta bench · rover · Brick", purpose: "camp", hyp: false },
    { id: "moon-schickard-desk", name: "Schickard Floor Desk", body: "Moon", kind: "surface", offset: [6, 0, -5],
      blurb: "Floor desk · photo · quiet", purpose: "memorial", hyp: false },
    { id: "titan-ontario-b", name: "Ontario South Lamp", body: "Titan", kind: "surface", offset: [4, 0, 5],
      blurb: "South lamp · Quill · shore", purpose: "social", hyp: false },
    { id: "europa-rale", name: "Rale Crater Desk", body: "Europa", kind: "surface", offset: [-4, 0, 3],
      blurb: "Crater desk · vial · hush", purpose: "research", hyp: false },
    { id: "ganymede-nippur-b", name: "Nippur Sulcus Camp", body: "Ganymede", kind: "surface", offset: [3, 0, -4],
      blurb: "Sulcus camp · magnet · lamp", purpose: "camp", hyp: false },
    { id: "oort-longwatch-b", name: "Longwatch Buoy B", body: null, au: 420, angle: 2.2, y: -20, kind: "station",
      blurb: "Longwatch B · hush · Rio", purpose: "radio", hyp: false },
    { id: "hyp-matrioshka-rim", name: "Matrioshka Rim (Hyp)", body: null, au: 25, angle: -0.3, y: 90, kind: "mega",
      blurb: "Hyp fiction · matrioshka rim — labeled", purpose: "fiction", hyp: true },





  ];

  const MISSION_DEFS = [
    { id: "m-deimos-relay", title: "Light the Deimos Relay",
      steps: ["Soft-land Deimos", "Find Deimos Relay dish", "Stand near beacon 3s"],
      body: "Deimos", hub: "deimos-radio", reward: "Relay online · Sky Radio clarity +1" },
    { id: "m-ceres-salt", title: "Occator Salt Sample",
      steps: ["Travel Ceres", "Walk Occator Salt Desk", "Log sample in notebook (N)"],
      body: "Ceres", hub: "ceres-occator", reward: "Salt logged · trade tip unlocked" },
    { id: "m-europa-listen", title: "Lineae Listen",
      steps: ["Soft-land Europa", "Visit Lineae Field Desk", "Hold still 4s (listen)"],
      body: "Europa", hub: "europa-lineae", reward: "Ice whisper logged" },
    { id: "m-leo-refuge", title: "Sign the LEO Refuge board",
      steps: ["Approach Earth LEO Refuge", "Soft-land or skim dock", "Read notice board"],
      body: "Earth", hub: "leo-refuge", reward: "Refuge stamp · companion tip" },
    { id: "m-kuiper-post", title: "Kuiper Waystation Post",
      steps: ["Fly outer system", "Find Kuiper Waystation", "Drop a Hope note"],
      body: null, hub: "kuiper-waystation", reward: "Waystation mail sent" },
    { id: "m-trojan-fire", title: "Greek Camp Watch Fire",
      steps: ["Find Trojan L4 camp", "Soft-land a Trojan rock", "Sit by watch fire"],
      body: null, hub: "trojan-l4", reward: "Camp story heard" },
    { id: "m-titan-shore", title: "Kraken Shore Lamp",
      steps: ["Land Titan", "Find Kraken Shore", "Stand under shore lamp"],
      body: "Titan", hub: "titan-shore", reward: "Thick-sky postcard" },
    { id: "m-hyp-dyson", title: "Dyson Whisper (Hyp)",
      steps: ["Enable Hyp bodies", "Find Dyson Whisper Ring", "Read fiction plaque"],
      body: null, hub: "dyson-whisper", reward: "Hyp plaque · Kardashev note", hyp: true },
    { id: "m-belt-assay", title: "Assay Outpost Run",
      steps: ["Find Assay Outpost A or B", "Soft-land / skim dock", "Read ore tag desk"],
      body: null, hub: "belt-assay-a", reward: "Assay stamp · trade tip" },
    { id: "m-belt-clinic", title: "Clinic Pod Check-in",
      steps: ["Find Belt Clinic Pod", "Dock / soft-land", "Patch-rack note"],
      body: null, hub: "belt-clinic", reward: "Suit calm · refuge stamp" },
    { id: "m-io-vent", title: "Io Vent Watch",
      steps: ["Soft-land Io", "Find Vent Watch", "Stand near tongs"],
      body: "Io", hub: "io-vent", reward: "Sulfur caution logged" },
    { id: "m-triton-cantina", title: "Triton Cantina",
      steps: ["Land Triton", "Find Cantina Stub", "Read rumor board"],
      body: "Triton", hub: "triton-cantina", reward: "Rumor chalk · social tip" },
    { id: "m-oort-buoy", title: "Oort Whisper Hello",
      steps: ["Fly deep outer", "Find Oort Whisper Buoy", "Hail radio"],
      body: null, hub: "oort-whisper", reward: "Comet lullaby heard" },
    { id: "m-ringworld", title: "Ringworld Arc (Hyp)",
      steps: ["Hyp on", "Find Ringworld Arc Stub", "Read fiction plaque"],
      body: null, hub: "ringworld-arc", reward: "Kardashev dream note", hyp: true },
    { id: "m-garden", title: "Belt Garden Lunch",
      steps: ["Find Belt Garden Cylinder", "Dock", "Read cafe chalk"],
      body: null, hub: "belt-garden", reward: "Oxygen story heard" },
    { id: "m-shackleton", title: "Shackleton Rim Stand",
      steps: ["Land Moon", "Find Shackleton Rim Camp", "Stand the rim"],
      body: "Moon", hub: "moon-shalbatana", reward: "Polar quiet logged" },
    { id: "m-stellar", title: "Stellar Engine Stub (Hyp)",
      steps: ["Hyp on", "Find Stellar Engine Stub", "Read fiction plaque"],
      body: null, hub: "stellar-engine", reward: "Kardashev shove note", hyp: true },
    { id: "m-iapetus-ridge", title: "Iapetus Ridge Sit",
      steps: ["Reach Iapetus", "Find Ridge Camp", "Stand by radio 3s"],
      body: "Iapetus", hub: "iapetus-ridge", reward: "Ridge story · yin-yang tip" },
    { id: "m-belt-cantina", title: "Belt Cantina Tea",
      steps: ["Find Belt Drift Cantina", "Dock / soft-land", "Read rumor board"],
      body: null, hub: "belt-cantina", reward: "Cantina stamp · social tip" },
    { id: "m-miranda-verona", title: "Verona Cliff Sit",
      steps: ["Reach Miranda", "Find Verona Rupes Camp", "Hold rail 3s"],
      body: "Miranda", hub: "miranda-verona", reward: "Cliff story · hold-rail tip" },
    { id: "m-phoebe-yard", title: "Phoebe Dark Yard",
      steps: ["Reach Phoebe", "Find Dark Yard", "Log boulder desk"],
      body: "Phoebe", hub: "phoebe-dark", reward: "Yard stamp · belt rumor" },
    { id: "m-spare-parts", title: "Spare Parts Drift",
      steps: ["Find Spare Parts Drift", "Dock", "Read thruster tip rack"],
      body: null, hub: "belt-spare-parts", reward: "Parts tip · industry stamp" },
    { id: "m-starman-educate", title: "Starman Educate Note",
      steps: ["Find Starman", "Educate Deck", "Take plaque photo (collectible)"],
      body: "Starman Roadster", hub: "starman-educate", reward: "Educational photo · memorial tip" },
    { id: "m-amalthea", title: "Amalthea Watch Sit",
      steps: ["Reach Amalthea", "Find Watch Camp", "Stand near caution beacon"],
      body: "Amalthea", hub: "amalthea-watch", reward: "Radiation caution logged" },
    { id: "m-belt-library", title: "Belt Library Quiet",
      steps: ["Find Belt Drift Library", "Dock", "Read chalk map wall"],
      body: null, hub: "belt-library", reward: "Library stamp · social tip" },
    { id: "m-geo-relay", title: "GEO Relay Rest",
      steps: ["Find GEO Relay Rest", "Skim dock", "Watch Earth nightsides"],
      body: null, hub: "earth-geo-relay", reward: "Nightsides tip · transit stamp" },
    { id: "m-europa-chaos", title: "Conamara Chaos Walk",
      steps: ["Land Europa", "Find Chaos Desk", "Hold still 3s"],
      body: "Europa", hub: "europa-chaos", reward: "Chaos whisper logged" },
    { id: "m-titan-ontario", title: "Ontario Lacus Lamp",
      steps: ["Land Titan", "Find Ontario lamp", "Stand under lamp"],
      body: "Titan", hub: "titan-ontario", reward: "Shore postcard · Quill tip" },
    { id: "m-quaoar", title: "Quaoar Ring Rumor",
      steps: ["Reach Quaoar", "Weywot Desk", "Log ring rumor"],
      body: "Quaoar", hub: "quaoar-weywot", reward: "Ring rumor · research tip" },
    { id: "m-hyp-listen-nest", title: "Listen Nest (Hyp)",
      steps: ["Enable Hyp", "Find Listen Nest Array", "Read fiction plaque"],
      body: null, hub: "hyp-listen-nest", reward: "Hyp plaque · deep listen note", hyp: true },
    { id: "m-belt-tea", title: "Belt Tea House",
      steps: ["Find Belt Tea House Drift", "Dock", "Read rumor chalk"],
      body: null, hub: "belt-tea-house", reward: "Tea stamp · social tip" },
    { id: "m-tycho-walk", title: "Tycho Ray Walk",
      steps: ["Land Moon", "Find Tycho Ray Walk", "Stand by plaque"],
      body: "Moon", hub: "moon-tycho", reward: "Ray photo · memorial tip" },
    { id: "m-olympus-bench", title: "Olympus Overlook Bench",
      steps: ["Land Mars", "Find Olympus Bench", "Sit 3s"],
      body: "Mars", hub: "mars-olympus-bench", reward: "Overlook story · dust tip" },
    { id: "m-janus-desk", title: "Janus Co-orbit Desk",
      steps: ["Reach Janus", "Co-orbit Desk", "Log Epimetheus tip"],
      body: "Janus", hub: "janus-coorbit", reward: "Co-orbit tip · research stamp" },
    { id: "m-callisto-asgard", title: "Asgard Rim Shelter",
      steps: ["Land Callisto", "Asgard Rim Shelter", "Tea note"],
      body: "Callisto", hub: "callisto-asgard", reward: "Archive tip · refuge stamp" },
    { id: "m-io-prometheus", title: "Prometheus Plume Watch",
      steps: ["Land Io", "Prometheus Plume Watch", "Heat caution log"],
      body: "Io", hub: "io-prometheus", reward: "Plume caution logged" },
    { id: "m-hyp-oort-cathedral", title: "Oort Cathedral (Hyp)",
      steps: ["Enable Hyp", "Find Oort Cathedral Stub", "Read fiction plaque"],
      body: null, hub: "hyp-oort-cathedral", reward: "Hyp ice cathedral note", hyp: true },
    { id: "m-assay-c", title: "Assay Outpost C",
      steps: ["Find Assay Outpost C", "Dock", "Night weights desk"],
      body: null, hub: "belt-assay-c", reward: "Assay C stamp · trade tip" },
    { id: "m-night-market", title: "Belt Night Market",
      steps: ["Find Belt Night Market", "Dock", "Read rumor chalk"],
      body: null, hub: "belt-night-market", reward: "Night market stamp · trade tip" },
    { id: "m-hope-desk", title: "Belt Hope Desk",
      steps: ["Find Belt Hope Desk", "Dock", "Plant or read Hope note"],
      body: null, hub: "belt-hope-desk", reward: "Hope stamp · refuge tip" },
    { id: "m-marineris", title: "Marineris Rim Sit",
      steps: ["Land Mars", "Marineris Rim Camp", "Sit by dust radio"],
      body: "Mars", hub: "mars-marineris", reward: "Canyon story · camp tip" },
    { id: "m-copernicus", title: "Copernicus Overlook",
      steps: ["Land Moon", "Copernicus Overlook", "Plaque photo"],
      body: "Moon", hub: "moon-copernicus", reward: "Overlook tip · memorial" },
    { id: "m-ligeia", title: "Ligeia Shore Lamp",
      steps: ["Land Titan", "Ligeia Shore Lamp", "Stand under lamp"],
      body: "Titan", hub: "titan-ligeria", reward: "Shore annex · Quill tip" },
    { id: "m-hydra", title: "Nix Soft Camp",
      steps: ["Reach Nix", "Soft Camp", "Log Charon tip"],
      body: "Nix", hub: "nix-pluto", reward: "Outer mark · survey tip" },
    { id: "m-hyp-sol-garden", title: "Sol Garden Ring (Hyp)",
      steps: ["Enable Hyp", "Find Sol Garden Ring", "Read fiction plaque"],
      body: null, hub: "hyp-sol-garden", reward: "Hyp garden note", hyp: true },
    { id: "m-leto", title: "Leto L4 Quiet",
      steps: ["Find Leto L4 Quiet", "Soft-land Trojan", "Tea stub sit"],
      body: null, hub: "leto-l4", reward: "Quiet annex · social tip" },
    { id: "m-skytape-bay", title: "Skytape Bay Drift",
      steps: ["Find Skytape Bay Drift", "Dock", "Sky Radio note"],
      body: null, hub: "belt-skytape", reward: "Radio tip · social stamp" },
    { id: "m-damascus", title: "Damascus Sulcus Watch",
      steps: ["Land Enceladus", "Damascus Watch", "Hold still 3s"],
      body: "Enceladus", hub: "enceladus-damascus", reward: "Stripe whisper logged" },
    { id: "m-guild-hall", title: "Belt Guild Hall",
      steps: ["Find Belt Guild Hall Drift", "Dock", "Read pin board"],
      body: null, hub: "belt-guild-hall", reward: "Guild hall stamp · social tip" },
    { id: "m-seal-clinic", title: "Seal Clinic Spur",
      steps: ["Find Seal Clinic Spur", "Dock", "Injector rack note"],
      body: null, hub: "belt-seal-clinic", reward: "Clinic stamp · refuge tip" },
    { id: "m-tranquility", title: "Tranquility Memorial",
      steps: ["Land Moon", "Tranquility Walk", "Plaque stand"],
      body: "Moon", hub: "moon-tranquility", reward: "Memorial tip · quiet photo" },
    { id: "m-kraken-north", title: "Kraken North Lamp",
      steps: ["Land Titan", "Kraken North Lamp", "Stand under lamp"],
      body: "Titan", hub: "titan-kraken-north", reward: "North shore · Quill tip" },
    { id: "m-hyp-lighthouse", title: "Deep Lighthouse (Hyp)",
      steps: ["Enable Hyp", "Find Deep Lighthouse", "Read fiction plaque"],
      body: null, hub: "hyp-lighthouse", reward: "Hyp lighthouse note", hyp: true },
    { id: "m-pin-exchange", title: "Pin Exchange Drift",
      steps: ["Find Pin Exchange", "Dock", "Read guild overflow board"],
      body: null, hub: "belt-pin-exchange", reward: "Exchange stamp · trade tip" },
    { id: "m-utopia", title: "Utopia Planitia Camp",
      steps: ["Land Mars", "Utopia Camp", "Dust radio sit"],
      body: "Mars", hub: "mars-utopia", reward: "Planitia tip · camp stamp" },
    { id: "m-adlinda", title: "Adlinda Rim Bench",
      steps: ["Land Callisto", "Adlinda Bench", "Tea note"],
      body: "Callisto", hub: "callisto-adlinda", reward: "Archive tip · refuge" },
    { id: "m-rhea-tea", title: "Rhea Quiet Tea",
      steps: ["Land Rhea", "Quiet Tea hub", "Sit under lamp"],
      body: "Rhea", hub: "rhea-tea", reward: "Tea stub · social tip" },
    { id: "m-iapetus", title: "Iapetus Ridge Camp",
      steps: ["Land Iapetus", "Ridge Camp", "Photo hush"],
      body: "Iapetus", hub: "iapetus-ridge", reward: "Ridge tip · camp stamp" },
    { id: "m-sputnik", title: "Sputnik Planitia Desk",
      steps: ["Land Pluto", "Sputnik Desk", "Hold still 3s"],
      body: "Pluto", hub: "pluto-sputnik", reward: "Heart whisper · Listen tip" },
    { id: "m-dock-annex", title: "Dock Annex Drill",
      steps: ["Find Dock Annex Drift", "Soft-land/dock", "Walk hangar + airlock"],
      body: null, hub: "belt-dock-annex", reward: "Dock drill stamp · transit tip" },
    { id: "m-cargo-yard", title: "Cargo Yard Spur",
      steps: ["Find Cargo Yard Spur", "Dock", "Read job board"],
      body: null, hub: "belt-cargo-yard", reward: "Yard stamp · trade tip" },
    { id: "m-jezero", title: "Jezero Shore Camp",
      steps: ["Land Mars", "Jezero Camp", "Rover path sit"],
      body: "Mars", hub: "mars-jezero", reward: "Delta tip · Brick nod" },
    { id: "m-gate-hangar", title: "Gate Hangar Buoy",
      steps: ["Find Gate Hangar Buoy", "Dock", "Refuge overflow board"],
      body: null, hub: "earth-gate-hangar", reward: "Hangar stamp · refuge tip" },
    { id: "m-rheasilvia", title: "Rheasilvia Overlook",
      steps: ["Land Vesta", "Rheasilvia Overlook", "Photo"],
      body: "Vesta", hub: "vesta-rheasilvia", reward: "Basin tip · Assay" },
    { id: "m-hyp-citadel", title: "Citadel Stub (Hyp)",
      steps: ["Enable Hyp", "Find Citadel Stub", "Read fiction plaque"],
      body: null, hub: "hyp-citadel-stub", reward: "Hyp citadel note", hyp: true },
    { id: "m-tiger-stripe", title: "Tiger Stripe Listen",
      steps: ["Land Enceladus", "Tiger Stripe Listen", "Hold still 3s"],
      body: "Enceladus", hub: "enceladus-tiger", reward: "Stripe tip · research" },
    { id: "m-airlock-school", title: "Airlock School Drift",
      steps: ["Find Airlock School", "Dock", "Drill tag note"],
      body: null, hub: "belt-airlock-school", reward: "School stamp · Dock Hands" },
    { id: "m-prometheus", title: "Prometheus Plume Watch",
      steps: ["Land Io", "Prometheus Watch", "Heat caution"],
      body: "Io", hub: "io-prometheus", reward: "Plume tip · Pike" },
    { id: "m-vali-tea", title: "Valhalla Rim Tea",
      steps: ["Land Callisto", "Valhalla Tea", "Sit quiet"],
      body: "Callisto", hub: "callisto-vali", reward: "Archive tea · refuge" },
    { id: "m-hyp-relay", title: "Relay Garden (Hyp)",
      steps: ["Enable Hyp", "Find Relay Garden", "Fiction plaque"],
      body: null, hub: "hyp-relay-garden", reward: "Hyp relay note", hyp: true },
    { id: "m-verona", title: "Verona Rupes Bench",
      steps: ["Land Miranda", "Verona Bench", "Cliff caution photo"],
      body: "Miranda", hub: "miranda-verona", reward: "Cliff tip · memorial" },
    { id: "m-makemake", title: "Makemake Bright Desk",
      steps: ["Land Makemake", "Bright Desk", "Sample note"],
      body: "Makemake", hub: "makemake-desk", reward: "Bright tip · Assay" },
    { id: "m-cupola", title: "Cupola Rest Buoy",
      steps: ["Find Cupola Rest", "Dock", "Nightsides sit"],
      body: null, hub: "earth-cupola", reward: "Cupola tip · Refuge" },
    { id: "m-olympus", title: "Olympus Overlook",
      steps: ["Land Mars", "Olympus Overlook", "Dust tag"],
      body: "Mars", hub: "mars-olympus", reward: "Overlook · Brick" },
    { id: "m-dysnomia", title: "Dysnomia Watch",
      steps: ["Reach Dysnomia", "Far Watch", "Restraint note"],
      body: "Dysnomia", hub: "eris-dysnomia", reward: "Far watch · Listen" },
    { id: "m-hyp-helix", title: "Garden Helix (Hyp)",
      steps: ["Enable Hyp", "Find Garden Helix", "Fiction plaque"],
      body: null, hub: "hyp-garden-helix", reward: "Hyp helix note", hyp: true },
    { id: "m-hector", title: "Hector L4 Camp",
      steps: ["Find Hector L4", "Soft-land Trojan", "Watch fire sit"],
      body: null, hub: "hector-camp", reward: "Trojan tip · social" },
    { id: "m-chiron", title: "Quaoar Ring Desk",
      steps: ["Reach Quaoar", "Ring Desk", "Ring tip note"],
      body: "Quaoar", hub: "quaoar-desk", reward: "Ring tip · research" },
    { id: "m-sedna", title: "Sedna Far Lamp",
      steps: ["Reach Sedna", "Far Lamp", "Stand under lamp"],
      body: "Sedna", hub: "sedna-far", reward: "Far tip · Listen" },
    { id: "m-tea-overflow", title: "Tea Overflow Drift",
      steps: ["Find Tea Overflow", "Dock", "Tea brick sit"],
      body: null, hub: "belt-tea-overflow", reward: "Tea tip · Haven" },
    { id: "m-hangar-b", title: "Deimos Hangar B",
      steps: ["Land Deimos", "Hangar B", "Crate walk"],
      body: "Deimos", hub: "deimos-hangar-b", reward: "Hangar B · Yard" },
    { id: "m-salacia", title: "Salacia Ice Hall",
      steps: ["Land Salacia", "Ice Hall", "Sit quiet"],
      body: "Salacia", hub: "salacia-ice-hall", reward: "Ice tip · refuge" },
    { id: "m-eros", title: "Eros Near Desk",
      steps: ["Land Eros", "Near Desk", "Saddle photo"],
      body: "Eros", hub: "eros-near-desk", reward: "NEAR tip · Assay" },
    { id: "m-ida-dactyl", title: "Ida–Dactyl Overlook",
      steps: ["Land Ida", "Overlook", "Photo toward Dactyl"],
      body: "Ida", hub: "ida-dactyl-view", reward: "Overlook tip · survey" },
    { id: "m-kuiper-listen", title: "Kuiper Listen Spur",
      steps: ["Find Listen Spur", "Dock", "Outer radio note"],
      body: null, hub: "kuiper-listen-spur", reward: "Listen stamp · outer" },
    { id: "m-oort-hearth", title: "Oort Hearth Buoy",
      steps: ["Find Oort Hearth", "Dock", "Long-watch tea"],
      body: null, hub: "oort-hearth", reward: "Hearth stamp · refuge" },
    { id: "m-parts-locker", title: "Parts Locker Drift",
      steps: ["Find Parts Locker", "Dock", "Foam / parts note"],
      body: null, hub: "belt-parts-locker", reward: "Parts stamp · Dock Hands" },
    { id: "m-hellas", title: "Hellas Rim Camp",
      steps: ["Land Mars", "Hellas Camp", "Rover path"],
      body: "Mars", hub: "mars-hellas", reward: "Basin tip · Brick" },
    { id: "m-copernicus-rim", title: "Copernicus Rim Walk",
      steps: ["Land Moon", "Copernicus Rim", "Photo"],
      body: "Moon", hub: "moon-copernicus-rim", reward: "Rim tip · Selene" },
    { id: "m-thrace", title: "Thrace Chaos Desk",
      steps: ["Land Europa", "Thrace Desk", "Vial note"],
      body: "Europa", hub: "europa-thrace", reward: "Chaos tip · Solis" },
    { id: "m-nippur", title: "Nippur Sulcus Camp",
      steps: ["Land Ganymede", "Nippur Camp", "Lamp sit"],
      body: "Ganymede", hub: "ganymede-nippur", reward: "Sulcus tip · camp" },
    { id: "m-asgard", title: "Asgard Rim Tea",
      steps: ["Land Callisto", "Asgard Tea", "Sit quiet"],
      body: "Callisto", hub: "moon-asgard", reward: "Asgard tea · refuge" },
    { id: "m-hyp-matrioshka", title: "Matrioshka Core (Hyp)",
      steps: ["Enable Hyp", "Find Matrioshka Core", "Fiction plaque"],
      body: null, hub: "hyp-matrioshka-core", reward: "Hyp nested note", hyp: true },
    { id: "m-hyp-stellar", title: "Stellar Forge (Hyp)",
      steps: ["Enable Hyp", "Find Stellar Forge", "Fiction plaque"],
      body: null, hub: "hyp-stellar-forge", reward: "Hyp forge note", hyp: true },
    { id: "m-hyp-ring-garden", title: "Ring Garden Arc (Hyp)",
      steps: ["Enable Hyp", "Find Ring Garden", "Fiction plaque"],
      body: null, hub: "hyp-ring-garden", reward: "Hyp ring note", hyp: true },
    { id: "m-hyp-bishop", title: "Bishop Stack (Hyp)",
      steps: ["Enable Hyp", "Find Bishop Stack", "Fiction plaque"],
      body: null, hub: "hyp-bishop-stack", reward: "Hyp Bishop note", hyp: true },
    { id: "m-mayfly", title: "Mayfly Beach Cafe",
      steps: ["Land Titan", "Mayfly Cafe", "Sit under thick sky"],
      body: "Titan", hub: "titan-mayfly", reward: "Cafe tip · Quill romance" },
    { id: "m-romance-mail", title: "Romance Mail Buoy",
      steps: ["Find Romance Mail Buoy", "Dock", "Read letter board"],
      body: null, hub: "belt-romance-mail", reward: "Mail tip · romance" },
    { id: "m-listen-desk", title: "Listen Desk Drift",
      steps: ["Find Listen Desk", "Dock", "Restraint log note"],
      body: null, hub: "belt-listen-desk", reward: "Listen stamp · conflict caution" },
    { id: "m-noctis", title: "Noctis Bench",
      steps: ["Land Mars", "Noctis Bench", "Dust sit"],
      body: "Mars", hub: "mars-oasis", reward: "Bench tip · Brick" },
    { id: "m-janus", title: "Janus Co-orbit Lamp",
      steps: ["Land Janus", "Co-orbit Lamp", "Chalk note"],
      body: "Janus", hub: "janus-epimetheus", reward: "Co-orbit tip · social" },
    { id: "m-hyp-whisper", title: "Whisper Arch (Hyp)",
      steps: ["Enable Hyp", "Find Whisper Arch", "Fiction plaque"],
      body: null, hub: "hyp-whisper-arch", reward: "Hyp whisper note", hyp: true },
    { id: "m-himalia", title: "Himalia Family Camp",
      steps: ["Land Himalia", "Family Camp", "Tea sit"],
      body: "Himalia", hub: "himalia-camp", reward: "Family camp tip" },
    { id: "m-leo-overflow", title: "LEO Overflow Pad",
      steps: ["Find LEO Overflow", "Dock", "Refuge board"],
      body: null, hub: "earth-leo-overflow", reward: "Overflow stamp · Refuge" },
    { id: "m-epimetheus", title: "Epimetheus Waltz Lamp",
      steps: ["Land Epimetheus", "Waltz Lamp", "Co-orbit sit"],
      body: "Epimetheus", hub: "epimetheus-lamp", reward: "Waltz tip · social" },
    { id: "m-atlas", title: "Janus Co-orbit Desk",
      steps: ["Land Janus", "Co-orbit Desk", "Photo"],
      body: "Janus", hub: "janus-coorbit", reward: "Co-orbit tip · camp" },
    { id: "m-foam-clinic", title: "Foam Clinic Spur",
      steps: ["Find Foam Clinic", "Dock", "Seal note"],
      body: null, hub: "belt-foam-clinic", reward: "Clinic stamp · Refuge" },
    { id: "m-kuiper-mail", title: "Kuiper Mail Drop",
      steps: ["Find Kuiper Mail Drop", "Dock", "Drop Hope note"],
      body: null, hub: "kuiper-mail", reward: "Mail tip · Listen" },
    { id: "m-naiad", title: "Larissa Dark Post",
      steps: ["Land Larissa", "Dark Post", "Caution note"],
      body: "Larissa", hub: "larissa-post", reward: "Inner tip · survey" },
    { id: "m-night-overflow", title: "Night Overflow Drift",
      steps: ["Find Night Overflow", "Dock", "Token note"],
      body: null, hub: "belt-night-overflow", reward: "Overflow tip · Kira" },
    { id: "m-nix", title: "Nix Outer Mark",
      steps: ["Land Nix", "Outer Mark", "Log tip"],
      body: "Nix", hub: "nix-mark", reward: "Outer mark · survey" },
    { id: "m-hiiragi", title: "Hiʻiaka Camp",
      steps: ["Land Hiʻiaka", "Camp", "Spin tip sit"],
      body: "Hiʻiaka", hub: "mk2-hiiragi", reward: "Spin tip · camp" },
    { id: "m-skytape-b", title: "Skytape Bay B",
      steps: ["Find Skytape Bay B", "Dock", "Sky Radio"],
      body: null, hub: "belt-skytape-b", reward: "Radio tip · social" },
    { id: "m-hyp-spire", title: "Listen Spire (Hyp)",
      steps: ["Enable Hyp", "Find Listen Spire", "Fiction plaque"],
      body: null, hub: "hyp-listen-spire", reward: "Hyp spire note", hyp: true },
    { id: "m-c-type-yard", title: "C-Type Yard Drift",
      steps: ["Find C-Type Yard", "Dock", "Crate walk"],
      body: null, hub: "belt-c-type-yard", reward: "Yard tip · Assay" },
    { id: "m-l4-hearth", title: "L4 Hearth Camp",
      steps: ["Find L4 Hearth", "Soft-land Trojan", "Watch fire"],
      body: null, hub: "trojan-l4-hearth", reward: "Hearth tip · social" },
    { id: "m-longwatch", title: "Longwatch Buoy",
      steps: ["Find Longwatch Buoy", "Dock", "Slow tea"],
      body: null, hub: "oort-longwatch", reward: "Longwatch · Rio" },
    { id: "m-dark-dock", title: "Dark Dock Caution",
      steps: ["Find Dark Dock Caution", "Dock carefully", "Restraint note"],
      body: null, hub: "oort-dark-dock", reward: "Caution tip · Listen" },
    { id: "m-cold-classic", title: "Cold Classical Desk",
      steps: ["Find Cold Classical Desk", "Dock", "Chalk note"],
      body: null, hub: "kuiper-cold-classic", reward: "Classical tip · research" },
    { id: "m-arabia", title: "Arabia Terra Camp",
      steps: ["Land Mars", "Arabia Camp", "Dust radio sit"],
      body: "Mars", hub: "mars-arabia", reward: "Terra tip · Brick" },
    { id: "m-orientale", title: "Orientale Ring Walk",
      steps: ["Land Moon", "Orientale Walk", "Photo quiet"],
      body: "Moon", hub: "moon-orientale", reward: "Ring walk · memorial" },
    { id: "m-geo-night", title: "GEO Night Buoy",
      steps: ["Find GEO Night Buoy", "Dock", "Nightsides sit"],
      body: null, hub: "earth-geo-night", reward: "GEO tip · Refuge" },
    { id: "m-hyp-softfill", title: "Softfill Arch (Hyp)",
      steps: ["Enable Hyp", "Find Softfill Arch", "Fiction plaque"],
      body: null, hub: "hyp-softfill-arch", reward: "Hyp softfill note", hyp: true },
    { id: "m-vesper-yard", title: "Vesper Yard Drift",
      steps: ["Find Vesper Yard", "Dock", "Hangar drill"],
      body: null, hub: "belt-vesper-yard", reward: "Yard tip · transit" },
    { id: "m-quiet-library", title: "Quiet Library Spur",
      steps: ["Find Quiet Library", "Dock", "Card sit"],
      body: null, hub: "belt-quiet-library", reward: "Library tip · Oriole" },
    { id: "m-ember", title: "Ember Buoy",
      steps: ["Find Ember Buoy", "Dock", "Longwatch tea"],
      body: null, hub: "oort-ember", reward: "Ember tip · Rio" },
    { id: "m-ontario", title: "Ontario Lacus Lamp",
      steps: ["Land Titan", "Ontario Lamp", "Thick-sky sit"],
      body: "Titan", hub: "titan-ontario", reward: "Lacus tip · Quill" },
    { id: "m-caloris", title: "Caloris Rim Camp",
      steps: ["Land Mercury", "Caloris Camp", "Short EVA"],
      body: "Mercury", hub: "mercury-caloris", reward: "Rim tip · camp" },
    { id: "m-hyp-void", title: "Void Garden (Hyp)",
      steps: ["Enable Hyp", "Find Void Garden", "Fiction plaque"],
      body: null, hub: "hyp-void-garden", reward: "Hyp void note", hyp: true },
    { id: "m-pallas-spur", title: "Pallas Spur Drift",
      steps: ["Find Pallas Spur", "Dock", "Assay tip"],
      body: null, hub: "belt-pallas-spur", reward: "Spur tip · trade" },
    { id: "m-ajax", title: "Ajax L4 Mark",
      steps: ["Find Ajax L4", "Soft-land Trojan", "Watch sit"],
      body: null, hub: "trojan-ajax", reward: "Ajax tip · social" },
    { id: "m-pulse", title: "Pulse Buoy",
      steps: ["Find Pulse Buoy", "Dock", "Radio hail"],
      body: null, hub: "oort-pulse", reward: "Pulse tip · Listen" },
    { id: "m-syria", title: "Syria Planum Camp",
      steps: ["Land Mars", "Syria Camp", "Dust sit"],
      body: "Mars", hub: "mars-syria", reward: "Planum tip · Brick" },
    { id: "m-kerwan", title: "Kerwan Basin Desk",
      steps: ["Land Ceres", "Kerwan Desk", "Salt note"],
      body: "Ceres", hub: "ceres-kerwan", reward: "Basin tip · Assay" },
    { id: "m-hyp-ring", title: "Ring Garden (Hyp)",
      steps: ["Enable Hyp", "Find Ring Garden", "Fiction plaque"],
      body: null, hub: "hyp-ring-garden", reward: "Hyp ring note", hyp: true },
    { id: "m-eunomia", title: "Eunomia Family Camp",
      steps: ["Find Eunomia Camp", "Dock/soft-land", "Tea sit"],
      body: null, hub: "belt-eunomia", reward: "Family tip · camp" },
    { id: "m-themis", title: "Themis Ice Desk",
      steps: ["Find Themis Desk", "Dock", "Sample note"],
      body: null, hub: "belt-themis", reward: "Ice tip · Assay" },
    { id: "m-murmur", title: "Murmur Buoy",
      steps: ["Find Murmur Buoy", "Dock", "Listen hail"],
      body: null, hub: "oort-murmur", reward: "Murmur tip · Listen" },
    { id: "m-jingpo", title: "Jingpo Lacus Lamp",
      steps: ["Land Titan", "Jingpo Lamp", "Thick-sky sit"],
      body: "Titan", hub: "titan-jingpo", reward: "Lacus tip · Quill" },
    { id: "m-pele", title: "Pele Plume Caution",
      steps: ["Land Io", "Pele Caution", "Heat note"],
      body: "Io", hub: "io-pele", reward: "Plume tip · Pike" },
    { id: "m-hyp-soft-citadel", title: "Soft Citadel (Hyp)",
      steps: ["Enable Hyp", "Find Soft Citadel", "Fiction plaque"],
      body: null, hub: "hyp-soft-citadel", reward: "Hyp citadel note", hyp: true },
    { id: "m-aura", title: "Aura Trade Drift",
      steps: ["Find Aura Trade", "Dock", "Pin board"],
      body: null, hub: "belt-aura", reward: "Trade tip · Assay" },
    { id: "m-solace", title: "Solace Refuge Spur",
      steps: ["Find Solace Spur", "Dock", "Foam note"],
      body: null, hub: "belt-solace", reward: "Refuge tip · Mira" },
    { id: "m-cipher", title: "Cipher Buoy",
      steps: ["Find Cipher Buoy", "Dock", "Restraint note"],
      body: null, hub: "oort-cipher", reward: "Cipher tip · Listen" },
    { id: "m-tombaugh", title: "Tombaugh Regio Desk",
      steps: ["Land Pluto", "Tombaugh Desk", "Hold still 3s"],
      body: "Pluto", hub: "pluto-tombaugh", reward: "Heart tip · Cass" },
    { id: "m-arctia", title: "Arcadia Planitia Camp",
      steps: ["Land Mars", "Arcadia Camp", "Rover path"],
      body: "Mars", hub: "mars-arctia", reward: "Planitia tip · Brick" },
    { id: "m-grimaldi", title: "Grimaldi Floor Bench",
      steps: ["Land Moon", "Grimaldi Bench", "Photo quiet"],
      body: "Moon", hub: "moon-grimaldi", reward: "Floor tip · memorial" },

    { id: "m-iris", title: "Iris Assay Spur",
      steps: ["Find Iris Spur", "Dock", "Weights desk"],
      body: null, hub: "belt-iris", reward: "Assay tip · ore tag" },
    { id: "m-flora", title: "Flora Garden Nook",
      steps: ["Find Flora Nook", "Dock", "Leaf chalk"],
      body: null, hub: "belt-flora", reward: "Garden tip · social" },
    { id: "m-patroclus", title: "Patroclus L5 Hearth",
      steps: ["Find Patroclus L5", "Soft-land", "Hearth sit"],
      body: null, hub: "trojan-patroclus", reward: "Hearth tip · camp" },
    { id: "m-vesper-buoy", title: "Vesper Outer Buoy",
      steps: ["Find Vesper Buoy", "Dock", "Hush note"],
      body: null, hub: "oort-vesper", reward: "Outer tip · Rio" },
    { id: "m-meridiani", title: "Meridiani Soft Pad",
      steps: ["Land Mars", "Meridiani Pad", "Rover path"],
      body: "Mars", hub: "mars-meridiani", reward: "Soft-pad tip · Brick" },
    { id: "m-aristarchus", title: "Aristarchus Bright Desk",
      steps: ["Land Moon", "Aristarchus Desk", "Photo quiet"],
      body: "Moon", hub: "moon-aristarchus-desk", reward: "Bright tip · memorial" },
    { id: "m-thrace-macula", title: "Thrace Macula Camp",
      steps: ["Land Europa", "Thrace Camp", "Hold still 3s"],
      body: "Europa", hub: "europa-thrace-macula", reward: "Macula tip · research" },
    { id: "m-punga", title: "Punga Mare Lamp",
      steps: ["Land Titan", "Punga Lamp", "Stand under lamp"],
      body: "Titan", hub: "titan-punga", reward: "Mare tip · Quill" },
    { id: "m-baghdad", title: "Baghdad Sulcus Rail",
      steps: ["Land Enceladus", "Baghdad Rail", "Sample hush"],
      body: "Enceladus", hub: "enceladus-baghdad", reward: "Sulcus tip · research" },
    { id: "m-tepper", title: "Tepper Sulcus Desk",
      steps: ["Land Ganymede", "Tepper Desk", "Magnet note"],
      body: "Ganymede", hub: "ganymede-tepper", reward: "Sulcus tip · lamp" },
    { id: "m-valhalla-west", title: "Valhalla West Shelter",
      steps: ["Land Callisto", "Valhalla West", "Tea quiet"],
      body: "Callisto", hub: "callisto-valhalla-west", reward: "Archive tip · refuge" },
    { id: "m-loki", title: "Loki Patera Watch",
      steps: ["Land Io", "Loki Watch", "Heat caution"],
      body: "Io", hub: "io-loki", reward: "Patera tip · Pike" },
    { id: "m-lattice-ark", title: "Lattice Ark (Hyp)",
      steps: ["Enable Hyp", "Find Lattice Ark", "Fiction plaque"],
      body: null, hub: "hyp-lattice-ark", reward: "Hyp ark note", hyp: true },
    { id: "m-ixion", title: "Ixion Quiet Post",
      steps: ["Reach Ixion", "Quiet Post", "Cass tip"],
      body: "Ixion", hub: "kuiper-ixion", reward: "Classical tip · camp" },
    { id: "m-dockhands-b", title: "Dock Hands Annex B",
      steps: ["Find Annex B", "Dock", "Airlock drill"],
      body: null, hub: "belt-dockhands-b", reward: "Dock Hands tip · Tess" },

    { id: "m-hebe", title: "Hebe Trade Nook",
      steps: ["Find Hebe Nook", "Dock", "Pin board"],
      body: null, hub: "belt-hebe", reward: "Trade tip · pins" },
    { id: "m-juno", title: "Juno Assay Bench",
      steps: ["Find Juno Bench", "Dock", "Weights"],
      body: null, hub: "belt-juno", reward: "Assay tip · tags" },
    { id: "m-nestor", title: "Nestor L4 Quiet",
      steps: ["Find Nestor L4", "Soft-land", "Tea sit"],
      body: null, hub: "trojan-nector", reward: "Quiet tip · camp" },
    { id: "m-varuna", title: "Varuna Rim Camp",
      steps: ["Reach Varuna", "Rim Camp", "Hush note"],
      body: "Varuna", hub: "kuiper-varuna", reward: "Rim tip · classical" },
    { id: "m-orcus", title: "Orcus Binary Desk",
      steps: ["Reach Orcus", "Binary Desk", "Binary tip"],
      body: "Orcus", hub: "kuiper-orcus", reward: "Binary tip · Cass" },
    { id: "m-syria-planum", title: "Syria Planum Overlook",
      steps: ["Land Mars", "Syria Overlook", "Dust sit"],
      body: "Mars", hub: "mars-syria-planum", reward: "Overlook tip · Brick" },
    { id: "m-copernicus-east", title: "Copernicus East Ray",
      steps: ["Land Moon", "East Ray", "Photo quiet"],
      body: "Moon", hub: "moon-copernicus-east", reward: "Ray tip · memorial" },
    { id: "m-kraken-south", title: "Kraken South Lamp",
      steps: ["Land Titan", "South Lamp", "Stand under"],
      body: "Titan", hub: "titan-kraken-south", reward: "Shore tip · Quill" },
    { id: "m-whisper-stack", title: "Whisper Stack (Hyp)",
      steps: ["Enable Hyp", "Find Whisper Stack", "Fiction plaque"],
      body: null, hub: "hyp-whisper-stack", reward: "Hyp whisper note", hyp: true },
    { id: "m-ember-buoy", title: "Ember Long Buoy",
      steps: ["Find Ember Buoy", "Dock", "Hush note"],
      body: null, hub: "oort-ember-buoy", reward: "Long tip · Ember" },
    { id: "m-limtoc", title: "Limtoc Crater Bench",
      steps: ["Land Phobos", "Limtoc Bench", "Quiet sit"],
      body: "Phobos", hub: "phobos-limtoc", reward: "Crater tip · camp" },
    { id: "m-swift", title: "Swift Crater Desk",
      steps: ["Land Deimos", "Swift Desk", "Radio tip"],
      body: "Deimos", hub: "deimos-swift", reward: "Swift tip · Yard" },

    { id: "m-metis-trade", title: "Metis Trade Spur",
      steps: ["Find Metis Spur", "Dock", "Pin board"],
      body: null, hub: "belt-metis-trade", reward: "Trade tip · pins" },
    { id: "m-hygiea-quiet", title: "Hygiea Quiet Desk",
      steps: ["Find Hygiea Desk", "Dock", "Hush note"],
      body: null, hub: "belt-hygiea-quiet", reward: "Quiet tip · Listen" },
    { id: "m-gale", title: "Gale Crater Camp",
      steps: ["Land Mars", "Gale Camp", "Rover path"],
      body: "Mars", hub: "mars-gale", reward: "Gale tip · Brick" },
    { id: "m-plato", title: "Plato Floor Bench",
      steps: ["Land Moon", "Plato Bench", "Photo quiet"],
      body: "Moon", hub: "moon-plato", reward: "Floor tip · memorial" },
    { id: "m-powys", title: "Powys Regio Desk",
      steps: ["Land Europa", "Powys Desk", "Hold still 3s"],
      body: "Europa", hub: "europa-powys", reward: "Regio tip · research" },
    { id: "m-mayda", title: "Mayda Insula Lamp",
      steps: ["Land Titan", "Mayda Lamp", "Stand under"],
      body: "Titan", hub: "titan-mayda", reward: "Insula tip · Quill" },
    { id: "m-alexandria", title: "Alexandria Sulcus Rail",
      steps: ["Land Enceladus", "Alexandria Rail", "Sample"],
      body: "Enceladus", hub: "enceladus-alexandria", reward: "Sulcus tip · research" },
    { id: "m-adlinda-south", title: "Adlinda South Shelter",
      steps: ["Land Callisto", "Adlinda South", "Tea quiet"],
      body: "Callisto", hub: "callisto-adlinda-south", reward: "Archive tip · refuge" },
    { id: "m-tvashtar", title: "Tvashtar Plume Watch",
      steps: ["Land Io", "Tvashtar Watch", "Heat caution"],
      body: "Io", hub: "io-tvashtar", reward: "Plume tip · Pike" },
    { id: "m-garden-ringlet", title: "Garden Ringlet (Hyp)",
      steps: ["Enable Hyp", "Find Garden Ringlet", "Fiction plaque"],
      body: null, hub: "hyp-garden-ringlet", reward: "Hyp garden note", hyp: true },
    { id: "m-salacia-actaea", title: "Salacia Ice Hall",
      steps: ["Reach Salacia", "Ice Hall", "Cass tip"],
      body: "Salacia", hub: "salacia-ice-hall", reward: "Classical tip · research" },
    { id: "m-cupola-b", title: "LEO Cupola Annex B",
      steps: ["Find Cupola Annex B", "Dock", "Nightsides sit"],
      body: "Earth", hub: "leo-cupola-b", reward: "Cupola tip · refuge" },

    { id: "m-psyche-hint", title: "Psyche Hint Yard",
      steps: ["Land Psyche", "Hint Yard", "Metal note"],
      body: "Psyche", hub: "belt-psyche-hint", reward: "Metal tip · Assay" },
    { id: "m-triton-b", title: "Triton Cantina Annex",
      steps: ["Land Triton", "Cantina Annex", "Rumor board"],
      body: "Triton", hub: "triton-cantina-b", reward: "Rumor tip · social" },
    { id: "m-wispy", title: "Wispy Terrain Desk",
      steps: ["Land Rhea", "Wispy Desk", "Tea quiet"],
      body: "Rhea", hub: "rhea-wispy", reward: "Wispy tip · tea" },
    { id: "m-janus-view", title: "Dione Janus View",
      steps: ["Land Dione", "Janus View", "Chalk note"],
      body: "Dione", hub: "dione-janus-view", reward: "View tip · Listen" },
    { id: "m-veil-b", title: "Veil Buoy B",
      steps: ["Find Veil B", "Dock", "Hush note"],
      body: null, hub: "oort-veil-b", reward: "Veil tip · Rio" },
    { id: "m-bishop-spire", title: "Bishop Spire (Hyp)",
      steps: ["Enable Hyp", "Find Bishop Spire", "Fiction plaque"],
      body: null, hub: "hyp-bishop-spire", reward: "Hyp spire note", hyp: true },
    { id: "m-rheasilvia-rim", title: "Rheasilvia Rim Camp",
      steps: ["Land Vesta", "Rheasilvia Camp", "Assay tip"],
      body: "Vesta", hub: "vesta-rheasilvia-rim", reward: "Rim tip · camp" },
    { id: "m-ahauna", title: "Ahuna Mons Bench",
      steps: ["Land Ceres", "Ahuna Bench", "Salt note"],
      body: "Ceres", hub: "ceres-ahauna", reward: "Mons tip · Assay" },

    { id: "m-davida-b", title: "Davida Assay B",
      steps: ["Find Davida B", "Dock", "Weights"],
      body: null, hub: "belt-davida-b", reward: "Assay tip · tags" },
    { id: "m-jezero-b", title: "Jezero Delta Bench",
      steps: ["Land Mars", "Jezero Bench", "Rover path"],
      body: "Mars", hub: "mars-jezero-b", reward: "Delta tip · Brick" },
    { id: "m-schickard", title: "Schickard Floor Desk",
      steps: ["Land Moon", "Schickard Desk", "Photo quiet"],
      body: "Moon", hub: "moon-schickard-desk", reward: "Floor tip · memorial" },
    { id: "m-ontario-b", title: "Ontario South Lamp",
      steps: ["Land Titan", "Ontario South", "Stand under"],
      body: "Titan", hub: "titan-ontario-b", reward: "Shore tip · Quill" },
    { id: "m-rale", title: "Rale Crater Desk",
      steps: ["Land Europa", "Rale Desk", "Hold still 3s"],
      body: "Europa", hub: "europa-rale", reward: "Crater tip · research" },
    { id: "m-nippur-b", title: "Nippur Sulcus Camp",
      steps: ["Land Ganymede", "Nippur Camp", "Magnet note"],
      body: "Ganymede", hub: "ganymede-nippur-b", reward: "Sulcus tip · camp" },
    { id: "m-longwatch-b", title: "Longwatch Buoy B",
      steps: ["Find Longwatch B", "Dock", "Hush note"],
      body: null, hub: "oort-longwatch-b", reward: "Long tip · Rio" },
    { id: "m-matrioshka-rim", title: "Matrioshka Rim (Hyp)",
      steps: ["Enable Hyp", "Find Matrioshka Rim", "Fiction plaque"],
      body: null, hub: "hyp-matrioshka-rim", reward: "Hyp rim note", hyp: true },





  ];

  function loadProgress() {
    try {
      return JSON.parse(localStorage.getItem(LS_MISSIONS) || "{}");
    } catch (_) {
      return {};
    }
  }
  function saveProgress(p) {
    try {
      localStorage.setItem(LS_MISSIONS, JSON.stringify(p));
    } catch (_) {}
  }

  function ensureHud() {
    if (missionHud) return;
    missionHud = document.createElement("div");
    missionHud.id = "vesper-mission-hud";
    missionHud.dataset.collapsed = "1";
    missionHud.style.cssText =
      "position:fixed;left:10px;top:86px;z-index:34;max-width:min(260px,88vw);" +
      "background:rgba(6,10,18,0.88);color:#d0e4ff;font:11px/1.35 system-ui,sans-serif;" +
      "padding:8px 10px;border-radius:10px;border:1px solid rgba(80,140,200,0.25);" +
      "pointer-events:auto;backdrop-filter:blur(6px);display:none;";
    missionHud.innerHTML =
      "<div style='display:flex;align-items:center;justify-content:space-between;gap:8px'>" +
      "<b style='letter-spacing:.04em'>ACTIVITIES</b>" +
      "<button type='button' id='vm-close' aria-label='Close activities' " +
      "style='min-width:44px;min-height:40px;padding:6px 10px;border-radius:8px;" +
      "border:1px solid rgba(140,180,220,0.4);background:rgba(50,70,100,0.95);color:#e8f4ff;font:12px system-ui'>Close</button>" +
      "</div><div id='vm-list'></div>";
    document.body.appendChild(missionHud);
    missionHud.querySelector("#vm-close").addEventListener("click", (e) => {
      e.preventDefault();
      setMissionHudOpen(false);
    });
    toastEl = document.createElement("div");
    toastEl.id = "vesper-place-toast";
    toastEl.style.cssText =
      "position:fixed;left:50%;top:72px;transform:translateX(-50%);z-index:36;" +
      "background:rgba(10,16,28,0.82);color:#e8f4ff;font:12px/1.3 system-ui,sans-serif;" +
      "padding:8px 14px;border-radius:12px;opacity:0;transition:opacity .3s;pointer-events:none;max-width:90vw;text-align:center;";
    document.body.appendChild(toastEl);
  }

  function setMissionHudOpen(open) {
    ensureHud();
    missionHud.style.display = open ? "block" : "none";
    missionHud.dataset.collapsed = open ? "0" : "1";
    if (open) refreshMissionHud();
  }

  function placeToast(msg, ms) {
    ensureHud();
    toastEl.textContent = msg;
    toastEl.style.opacity = "0.95";
    clearTimeout(placeToast._t);
    placeToast._t = setTimeout(() => {
      if (toastEl.textContent === msg) toastEl.style.opacity = "0";
    }, ms || 2400);
  }

  function refreshMissionHud() {
    ensureHud();
    const list = document.getElementById("vm-list");
    if (!list) return;
    const prog = loadProgress();
    const lines = MISSION_DEFS.slice(0, 10).map((m) => {
      const done = !!prog[m.id];
      const mark = done ? "✓" : "·";
      const hyp = m.hyp ? " <i style='opacity:.7'>(Hyp)</i>" : "";
      return "<div style='margin:4px 0;opacity:" + (done ? "0.55" : "1") + "'>" + mark + " " + m.title + hyp + "</div>";
    });
    list.innerHTML = lines.join("") + "<div style='margin-top:6px;opacity:.65;font-size:10px'>Land hubs · talk NPCs · no checklist spam</div>";
  }

  function makeNpc(kind, hyp) {
    const g = new THREE.Group();
    g.name = "placeNpc";
    const hullCol = hyp ? 0xc0a060 : kind === "mega" ? 0xa0b8d0 : kind === "camp" ? 0xb08860 : 0x90a8c0;
    const hull = new THREE.Mesh(
      kind === "mega"
        ? new THREE.TorusGeometry(4.5, 0.28, 10, 48)
        : kind === "camp"
          ? new THREE.DodecahedronGeometry(0.7, 0)
          : new THREE.BoxGeometry(1.6, 0.55, 0.7),
      window.VesperMat({
        color: hullCol,
        metalness: 0.55,
        roughness: 0.4,
        emissive: hyp ? 0x604010 : 0x204060,
        emissiveIntensity: hyp ? 0.35 : 0.25,
      })
    );
    g.add(hull);
    // Station hangar mouth (readable ME dock cue from flyby)
    if (kind === "station" || kind === "mega" ) {
      const mouth = new THREE.Mesh(
        new THREE.TorusGeometry(kind === "mega" ? 2.2 : 1.15, 0.06, 6, 24),
        window.VesperMat({ color: 0x70e0c0, metalness: 0.5, roughness: 0.3, emissive: 0x20a080, emissiveIntensity: 0.55 })
      );
      mouth.name = "dockMouth";
      mouth.position.set(kind === "mega" ? 0 : 0.9, 0, 0);
      mouth.rotation.y = Math.PI / 2;
      g.add(mouth);
      const bayGlow = window.VesperNoLight(0x60ffe0, 0.45, 10, 2);
      bayGlow.position.set(1.2, 0.2, 0);
      g.add(bayGlow);
    }
    // Dock ring
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.1, 0.04, 6, 24),
      new THREE.MeshBasicMaterial({
        color: hyp ? 0xffc060 : 0x60e0ff,
        transparent: true,
        opacity: 0.55,
      })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -0.2;
    g.add(ring);
    // Beacon mast
    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.05, 1.8, 6),
      window.VesperMat({
        color: 0xc0d0e0,
        emissive: hyp ? 0xc08020 : 0x40a0ff,
        emissiveIntensity: 0.7,
      })
    );
    mast.position.y = 1.1;
    g.add(mast);
    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 10, 8),
      window.VesperMat({
        color: hyp ? 0xffe080 : 0xa0f0ff,
        emissive: hyp ? 0xffb020 : 0x40d0ff,
        emissiveIntensity: 1.1,
      })
    );
    globe.position.y = 2.05;
    g.add(globe);
    const light = window.VesperNoLight(hyp ? 0xffc060 : 0x80d0ff, 0.7, 18, 2);
    light.position.y = 2.05;
    g.add(light);
    
    // Industry / trade purpose read
    if (kind === "station" || kind === "dock") {
      const industryBeacon = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 8, 6),
        window.VesperMat({
          color: hyp ? 0xffc060 : 0x60ffe0,
          emissive: hyp ? 0xffa020 : 0x20c0a0,
          emissiveIntensity: 0.9,
        })
      );
      industryBeacon.position.set(0, 1.4, 0);
      g.add(industryBeacon);
    }
return g;
  }

  function makeSurfaceNpc(def) {
    return makeNpcNpc(def);
  }

  function makeNpcNpc(def) {
    const g = new THREE.Group();
    g.name = "surfaceHub:" + def.id;
    const coarse = !!(typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches);
    const alloy = window.VesperMat({
      color: def.hyp ? 0xb09050 : 0x8a9aac,
      metalness: 0.72,
      roughness: 0.32,
      emissive: 0x152028,
      emissiveIntensity: 0.14,
      envMapIntensity: 1.05,
    });
    const dark = window.VesperMat({
      color: 0x3a4550, metalness: 0.65, roughness: 0.4, emissive: 0x101820, emissiveIntensity: 0.1,
    });
    // Landing pad (outpost footprint — NMS/Stellaris read)
    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(2.4, 2.6, 0.08, coarse ? 16 : 28),
      window.VesperMat({ color: 0x2a323c, metalness: 0.55, roughness: 0.5, emissive: 0x102028, emissiveIntensity: 0.08 })
    );
    pad.position.y = 0.04;
    g.add(pad);
    const padRing = new THREE.Mesh(
      new THREE.TorusGeometry(2.1, 0.05, 6, coarse ? 20 : 36),
      window.VesperMat({ color: 0x40c0ff, emissive: 0x2080c0, emissiveIntensity: 0.55, metalness: 0.4, roughness: 0.3 })
    );
    padRing.rotation.x = Math.PI / 2;
    padRing.position.y = 0.1;
    g.add(padRing);
    // Footpath wear pad→hab (lived-in traffic)
    {
      const path = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.02, 1.8),
        window.VesperMat({ color: 0x3a342c, roughness: 0.95, metalness: 0.05, transparent: true, opacity: 0.5 })
      );
      path.name = "outpostFootWear";
      path.position.set(0.4, 0.08, 0.6);
      g.add(path);
    }
    // Barrier blocks (pad edge — ops safety cue)
    for (const bx of [-1.8, 1.8]) {
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.45, 1.1),
        window.VesperMat({ color: 0xc07030, metalness: 0.25, roughness: 0.55, emissive: 0x402010, emissiveIntensity: 0.12 })
      );
      bar.name = "outpostBarrier";
      bar.position.set(bx, 0.25, 2.0);
      g.add(bar);
    }
    // Perimeter posts (outpost boundary — Stellaris cue)
    for (let i = 0; i < (coarse ? 4 : 8); i++) {
      const a = (i / (coarse ? 4 : 8)) * Math.PI * 2;
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.06, 0.9, 5),
        window.VesperMat({ color: 0x708090, metalness: 0.55, roughness: 0.4, emissive: 0x203040, emissiveIntensity: 0.15 })
      );
      post.name = "outpostFence";
      post.position.set(Math.cos(a) * 2.5, 0.45, Math.sin(a) * 2.5);
      g.add(post);
      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(0.07, 6, 4),
        window.VesperMat({ color: 0x40ffc0, emissive: 0x20c090, emissiveIntensity: 0.7 })
      );
      cap.position.set(Math.cos(a) * 2.5, 0.95, Math.sin(a) * 2.5);
      g.add(cap);
    }
    // Main hab (larger — not desk toy)
    const hab = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 1.35, coarse ? 10 : 14), alloy);
    hab.position.set(-0.3, 0.72, -0.2);
    g.add(hab);
    // Connected module
    const mod = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.85, 1.4), dark);
    mod.position.set(1.0, 0.5, -0.15);
    g.add(mod);
    // Airlock tunnel
    const tunnel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.28, 0.7, 10),
      window.VesperMat({ color: 0x70e0c0, metalness: 0.5, roughness: 0.35, emissive: 0x20a080, emissiveIntensity: 0.4 })
    );
    tunnel.rotation.z = Math.PI / 2;
    tunnel.position.set(0.35, 0.45, -0.15);
    g.add(tunnel);
    // Solar panels (activity / power — Stellaris outpost cue)
    for (const side of [-1, 1]) {
      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 1.1, 1.6),
        window.VesperMat({
          color: 0x1a3050, metalness: 0.35, roughness: 0.25,
          emissive: 0x104080, emissiveIntensity: 0.35, envMapIntensity: 1.2,
        })
      );
      panel.position.set(side * 2.0, 1.0, -0.3);
      panel.rotation.z = side * 0.35;
      g.add(panel);
    }
    // Comm mast + dish (always — outposts talk)
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 2.2, 6), dark);
    mast.position.set(-1.5, 1.15, 1.0);
    g.add(mast);
    const dish = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, coarse ? 8 : 12, 6, 0, Math.PI * 2, 0, Math.PI * 0.55),
      window.VesperMat({ color: 0xc0d0e0, metalness: 0.6, roughness: 0.28, side: THREE.DoubleSide, envMapIntensity: 1.1 })
    );
    dish.position.set(-1.5, 2.2, 1.0);
    dish.rotation.x = 0.55;
    g.add(dish);
    // Cargo stack (lived-in)
    for (let i = 0; i < (coarse ? 2 : 4); i++) {
      const crate = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 0.4, 0.45),
        window.VesperMat({ color: i % 2 ? 0x6a5030 : 0x405060, roughness: 0.65, metalness: 0.25 })
      );
      crate.position.set(1.4 + (i % 2) * 0.5, 0.25, 1.0 + Math.floor(i / 2) * 0.5);
      g.add(crate);
    }
    // Vent steam cue (activity without particles)
    const vent = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.1, 0.35, 6),
      window.VesperMat({ color: 0x506070, emissive: 0x80c0ff, emissiveIntensity: 0.45 })
    );
    vent.position.set(0.9, 1.15, -0.7);
    vent.name = "outpostVent";
    g.add(vent);
    // Work light boom
    const boom = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 1.2), dark);
    boom.position.set(0.2, 1.6, 0.9);
    g.add(boom);
    const workLight = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 6),
      window.VesperMat({ color: 0xffe8c0, emissive: 0xffa040, emissiveIntensity: 0.9 })
    );
    workLight.position.set(0.2, 1.55, 1.5);
    workLight.name = "activityBeacon";
    g.add(workLight);
    if (!coarse) {
      const pl = window.VesperNoLight(0xffc080, 0.4, 8, 2);
      pl.position.copy(workLight.position);
      g.add(pl);
    }
    // Desk / board
    const desk = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 0.1, 0.5),
      window.VesperMat({ color: 0x5a4a38, roughness: 0.65 })
    );
    desk.position.set(-0.8, 0.55, 1.2);
    g.add(desk);
    // Always-on lived-in (phone + desktop) — tool rack, cables, status board
    {
      const rack = new THREE.Group();
      rack.name = "outpostToolRack";
      const back = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 1.1, 0.7),
        window.VesperMat({ color: 0x4a5560, metalness: 0.55, roughness: 0.4 })
      );
      back.position.set(-1.9, 0.85, -0.6);
      rack.add(back);
      for (let ti = 0; ti < 3; ti++) {
        const tool = new THREE.Mesh(
          new THREE.BoxGeometry(0.06, 0.55, 0.06),
          window.VesperMat({
            color: ti === 1 ? 0xc07040 : 0x708090, metalness: 0.5, roughness: 0.4,
            emissive: ti === 1 ? 0x402010 : 0x203040, emissiveIntensity: 0.15,
          })
        );
        tool.position.set(-1.82, 0.75, -0.85 + ti * 0.22);
        rack.add(tool);
      }
      g.add(rack);
    }
    // Cable runs (activity footprint — always)
    for (const [cx, cy, cz, len, yaw] of [
      [0.2, 0.12, 1.4, 1.8, 0.3],
      [-0.6, 0.12, 0.8, 1.4, -0.5],
    ]) {
      const cable = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, len, 5),
        window.VesperMat({ color: 0x2a3540, metalness: 0.35, roughness: 0.55, emissive: 0x102028, emissiveIntensity: 0.08 })
      );
      cable.name = "outpostCable";
      cable.rotation.z = Math.PI / 2;
      cable.rotation.y = yaw;
      cable.position.set(cx, cy, cz);
      g.add(cable);
    }
    // Status board (ops cue — always, coarse-safe)
    {
      const board = new THREE.Group();
      board.name = "outpostStatusBoard";
      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.55, 0.06),
        window.VesperMat({ color: 0x2a323c, metalness: 0.5, roughness: 0.4, emissive: 0x101820, emissiveIntensity: 0.12 })
      );
      panel.position.set(-0.8, 1.05, 1.35);
      const screen = new THREE.Mesh(
        new THREE.PlaneGeometry(0.55, 0.4),
        window.VesperMat({ color: 0x40e0a0, emissive: 0x20a070, emissiveIntensity: 0.65 })
      );
      screen.name = "outpostStatusScreen";
      screen.position.set(-0.8, 1.05, 1.39);
      board.add(panel, screen);
      g.add(board);
    }
    // Thermos on desk (lived-in)
    {
      const thermos = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.07, 0.18, 6),
        window.VesperMat({ color: 0xc0d0e0, metalness: 0.65, roughness: 0.28, emissive: 0x406080, emissiveIntensity: 0.35 })
      );
      thermos.name = "outpostThermos";
      thermos.position.set(-0.55, 0.72, 1.2);
      g.add(thermos);
    }
    // Spare wheel lean (NMS outpost clutter)
    {
      const wheel = new THREE.Mesh(
        new THREE.TorusGeometry(0.28, 0.08, 6, 12),
        window.VesperMat({ color: 0x2a2e34, metalness: 0.4, roughness: 0.55 })
      );
      wheel.name = "outpostSpareWheel";
      wheel.position.set(1.8, 0.35, 1.3);
      wheel.rotation.z = 0.3;
      g.add(wheel);
    }
    // Windsock pole (pad ops cue)
    {
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.04, 1.6, 5),
        window.VesperMat({ color: 0x708090, metalness: 0.55, roughness: 0.4 })
      );
      pole.name = "outpostWindsock";
      pole.position.set(2.2, 0.85, -1.5);
      const sock = new THREE.Mesh(
        new THREE.ConeGeometry(0.12, 0.55, 6, 1, true),
        window.VesperMat({ color: 0xff8040, emissive: 0xa04010, emissiveIntensity: 0.25, side: THREE.DoubleSide })
      );
      sock.rotation.z = Math.PI / 2;
      sock.position.set(2.5, 1.55, -1.5);
      g.add(pole, sock);
    }
    // Water tank (settlement utility — not a new hub)
    {
      const tank = new THREE.Mesh(
        new THREE.CylinderGeometry(0.45, 0.45, 1.2, 10),
        window.VesperMat({ color: 0x4a6070, metalness: 0.55, roughness: 0.35, emissive: 0x102028, emissiveIntensity: 0.1 })
      );
      tank.name = "outpostWaterTank";
      tank.position.set(-2.0, 0.65, -1.6);
      const ladder = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 1.15, 0.28),
        window.VesperMat({ color: 0x8090a0, metalness: 0.6, roughness: 0.4 })
      );
      ladder.name = "outpostTankLadder";
      ladder.position.set(-1.55, 0.6, -1.6);
      const band = new THREE.Mesh(
        new THREE.TorusGeometry(0.46, 0.04, 6, 12),
        window.VesperMat({ color: 0x70c8ff, metalness: 0.4, roughness: 0.3, emissive: 0x2060a0, emissiveIntensity: 0.35 })
      );
      band.rotation.x = Math.PI / 2;
      band.position.set(-2.0, 0.9, -1.6);
      g.add(tank, band);
    }
    // Crew stool at desk (ops pulse — always-on coarse)
    if (!g.getObjectByName("outpostCrewStool")) {
      const stool = new THREE.Group();
      stool.name = "outpostCrewStool";
      const seat = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.2, 0.06, 8),
        window.VesperMat({ color: 0x4a5560, metalness: 0.45, roughness: 0.45 })
      );
      seat.position.y = 0.45;
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.05, 0.45, 5),
        window.VesperMat({ color: 0x2a323c, metalness: 0.55, roughness: 0.4 })
      );
      leg.position.y = 0.22;
      stool.add(seat, leg);
      stool.position.set(-1.15, 0, 1.35);
      g.add(stool);
    }
    // Hose reel by crates (ops clutter — no PointLight)
    if (!g.getObjectByName("outpostHoseReel")) {
      const reel = new THREE.Group();
      reel.name = "outpostHoseReel";
      const drum = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.22, 0.18, 10),
        window.VesperMat({ color: 0x506070, metalness: 0.5, roughness: 0.4, emissive: 0x203040, emissiveIntensity: 0.12 })
      );
      drum.rotation.z = Math.PI / 2;
      drum.position.set(1.9, 0.35, 0.6);
      const stand = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.5, 0.12),
        window.VesperMat({ color: 0x3a4550, metalness: 0.55, roughness: 0.4 })
      );
      stand.position.set(1.9, 0.25, 0.6);
      const hoseRun = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.035, 1.1, 5),
        window.VesperMat({ color: 0x2a3540, metalness: 0.3, roughness: 0.6 })
      );
      hoseRun.rotation.z = Math.PI / 2;
      hoseRun.position.set(1.4, 0.2, 0.9);
      reel.add(drum, stand, hoseRun);
      g.add(reel);
    }
    // Crate label board (readable ops — always-on)
    if (!g.getObjectByName("outpostCrateLabels")) {
      const board = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.4, 0.04),
        window.VesperMat({ color: 0x3a4550, metalness: 0.4, roughness: 0.45, emissive: 0x152028, emissiveIntensity: 0.1 })
      );
      board.name = "outpostCrateLabels";
      board.position.set(1.55, 0.85, 1.35);
      const tag = new THREE.Mesh(
        new THREE.PlaneGeometry(0.42, 0.28),
        window.VesperMat({ color: 0xffe080, emissive: 0xa08020, emissiveIntensity: 0.4 })
      );
      tag.position.set(1.55, 0.85, 1.38);
      g.add(board, tag);
    }
    // Footpath wear strip desk→pad (lived-in traffic)
    if (!g.getObjectByName("outpostFootpathWear")) {
      for (let i = 0; i < 4; i++) {
        const wear = new THREE.Mesh(
          new THREE.BoxGeometry(0.35, 0.02, 0.55),
          window.VesperMat({ color: 0x4a4038, roughness: 0.95, metalness: 0.05, transparent: true, opacity: 0.5 })
        );
        wear.name = "outpostFootpathWear";
        wear.position.set(-0.4 + i * 0.35, 0.09, 0.6 + i * 0.25);
        wear.rotation.y = 0.35;
        g.add(wear);
      }
    }
    // Hab warning stripe (ops presence — always-on coarse)
    if (!g.getObjectByName("outpostHabWarning")) {
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.55, 1.5),
        window.VesperMat({ color: 0xffc040, emissive: 0xa06010, emissiveIntensity: 0.35, metalness: 0.25, roughness: 0.45 })
      );
      stripe.name = "outpostHabWarning";
      stripe.position.set(0.52, 0.85, -0.2);
      g.add(stripe);
      const stripe2 = stripe.clone();
      stripe2.position.set(-1.1, 0.85, -0.2);
      g.add(stripe2);
    }
    // Clipboard stack on desk (lived-in ops clutter)
    if (!g.getObjectByName("outpostClipboardStack")) {
      const stack = new THREE.Group();
      stack.name = "outpostClipboardStack";
      for (let i = 0; i < 3; i++) {
        const board = new THREE.Mesh(
          new THREE.BoxGeometry(0.22, 0.02, 0.28),
          window.VesperMat({
            color: i === 1 ? 0x80a0c0 : 0xd0d8e0, metalness: 0.2, roughness: 0.55,
            emissive: i === 1 ? 0x204060 : 0x000000, emissiveIntensity: i === 1 ? 0.2 : 0,
          })
        );
        board.position.set(0, 0.02 + i * 0.025, 0);
        board.rotation.y = (i - 1) * 0.12;
        stack.add(board);
      }
      const clip = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.04, 0.06),
        window.VesperMat({ color: 0x708090, metalness: 0.6, roughness: 0.35 })
      );
      clip.position.set(0, 0.1, -0.1);
      stack.add(clip);
      stack.position.set(-0.7, 0.62, 1.25);
      g.add(stack);
    }
    // Cable spool by crates (ops clutter — no PointLight)
    if (!g.getObjectByName("outpostCableSpool")) {
      const spool = new THREE.Group();
      spool.name = "outpostCableSpool";
      const drum = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.28, 0.22, 10),
        window.VesperMat({ color: 0x3a4550, metalness: 0.45, roughness: 0.45, emissive: 0x152028, emissiveIntensity: 0.1 })
      );
      drum.rotation.z = Math.PI / 2;
      const flangeL = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.35, 0.04, 10),
        window.VesperMat({ color: 0x506070, metalness: 0.5, roughness: 0.4 })
      );
      flangeL.rotation.z = Math.PI / 2;
      flangeL.position.x = -0.14;
      const flangeR = flangeL.clone();
      flangeR.position.x = 0.14;
      spool.add(drum, flangeL, flangeR);
      spool.position.set(1.9, 0.35, 1.5);
      g.add(spool);
    }
    // Stub NPC (suited) — outpost staffing
    const npc = new THREE.Group();
    npc.name = "npc";
    const torso = new THREE.Mesh(
      THREE.CapsuleGeometry ? new THREE.CapsuleGeometry(0.14, 0.32, 4, 8) : new THREE.CylinderGeometry(0.14, 0.14, 0.5, 8),
      window.VesperMat({ color: 0xc8d0d8, metalness: 0.25, roughness: 0.55, emissive: 0x304050, emissiveIntensity: 0.12 })
    );
    torso.position.y = 0.65;
    const helm = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 10, 8),
      window.VesperMat({ color: 0xe8f0f8, metalness: 0.35, roughness: 0.3, emissive: 0x406080, emissiveIntensity: 0.22 })
    );
    helm.position.y = 1.1;
    npc.add(torso, helm);
    npc.position.set(1.6, 0, 0.6);
    g.add(npc);
    // Second NPC desktop-only; mule always (phone lived-in activity)
    if (!coarse) {
      const npc2 = npc.clone();
      npc2.name = "npc";
      npc2.position.set(-1.8, 0, 0.9);
      g.add(npc2);
    }
    {
      const mule = new THREE.Group();
      mule.name = "outpostMule";
      const body = new THREE.Mesh(new THREE.BoxGeometry(coarse ? 0.75 : 0.9, 0.3, 0.5), dark);
      body.position.y = 0.32;
      mule.add(body);
      for (const wx of [-0.28, 0.28]) {
        const wh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.1, 0.1, 0.07, coarse ? 6 : 8),
          window.VesperMat({ color: 0x202428, metalness: 0.6, roughness: 0.4 })
        );
        wh.rotation.z = Math.PI / 2;
        wh.position.set(wx, 0.12, 0.26);
        mule.add(wh);
      }
      mule.position.set(0.3, 0, 1.8);
      g.add(mule);
    }
    // Legs / stilts
    for (const [lx, lz] of [[-1.6, -1.2], [1.5, -1.2], [-1.6, 1.3], [1.5, 1.3]]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.55, 6), dark);
      leg.position.set(lx, 0.28, lz);
      g.add(leg);
    }
    if (def.hyp) {
      const plaque = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.3, 0.05),
        window.VesperMat({ color: 0xe0c060, emissive: 0xa08020, emissiveIntensity: 0.45 })
      );
      plaque.position.set(0, 1.5, 0.55);
      g.add(plaque);
    }
    if (def.purpose === "camp" || def.purpose === "social") {
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(0.7, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5),
        window.VesperMat({
          color: 0x60a080, transparent: true, opacity: 0.35, emissive: 0x206040, emissiveIntensity: 0.3,
        })
      );
      dome.position.set(-0.2, 0.05, -1.8);
      g.add(dome);
    }
    trackLive(g);
    return g;
  }


  function orbitAU(au) {
    const s = window.VesperSky && window.VesperSky.getScale && window.VesperSky.getScale();
    const u = (s && s.auUnit) || 16000;
    return au * u;
  }

  function findBody(name) {
    const s = window.VesperSky;
    if (!s || !s.bodies) return null;
    const list = s.bodies();
    return list.find((b) => b.name === name) || null;
  }


  function followSlot(b, yOff, angle) {
    const px = b.pos[0], py = b.pos[1], pz = b.pos[2];
    const len = Math.sqrt(px * px + py * py + pz * pz) || 1;
    const elev = (b.radius || 20) * 1.35 + 8;
    let x = px + (px / len) * elev;
    let y = py + (py / len) * elev * 0.2 + (yOff || 0) * 0.01;
    let z = pz + (pz / len) * elev;
    // Sibling stations on one parent shared this radial and stacked.
    // An angle walks them around the body. No angle keeps the old slot.
    if (angle != null && angle === angle) {
      const rx = px / len, rz = pz / len;
      let tx = -rz, tz = rx;
      const tlen = Math.sqrt(tx * tx + tz * tz) || 1;
      tx /= tlen; tz /= tlen;
      const spread = Math.min(140, (b.radius || 20) * 0.22 + 36);
      x += Math.cos(angle) * tx * spread;
      z += Math.cos(angle) * tz * spread;
      y += Math.sin(angle) * spread * 0.65;
    }
    return { x: x, y: y, z: z };
  }

  function placeOrbitalHub(def) {
    const mesh = makeNpc(def.kind, def.hyp);
    const wrap = new THREE.Group();
    wrap.name = "hub:" + def.id;
    wrap.userData.hubDef = def;
    wrap.add(mesh);
    if (def.kind === "mega") mesh.scale.setScalar(1.8);
    // Landable proxy body so soft-land / travel can find it
    const proxyR = def.kind === "mega" ? 6.5 : def.kind === "station" ? 2.2 : 1.6;
    const proxy = new THREE.Mesh(
      new THREE.SphereGeometry(proxyR, 10, 8),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    wrap.add(proxy);

    let x, y, z;
    if (def.body) {
      const b = findBody(def.body);
      if (b && b.pos) {
        const slot = followSlot(b, def.y || 0, def.angle);
        x = slot.x; y = slot.y; z = slot.z;
      }
    }
    if (x == null) {
      const a = def.angle != null ? def.angle : Math.random() * Math.PI * 2;
      const r = orbitAU(def.au || 2.5);
      x = Math.cos(a) * r;
      y = def.y || 40;
      z = Math.sin(a) * r;
    }
    wrap.position.set(x, y, z);
    wrap.userData.followBody = def.body || null;
    wrap.userData.followY = def.y || 0;
    wrap.userData.followAngle = def.angle;
    rootGroup.add(wrap);

    // Register as soft-landable body
    if (window.VesperSky && window.VesperSky.registerBody) {
      window.VesperSky.registerBody({
        name: def.name,
        group: wrap,
        mesh: proxy,
        radius: proxyR,
        walkable: true,
        landable: true,
        hypothetic: !!def.hyp,
        observation: def.purpose === "social" || def.purpose === "refuge",
        def: { radius: proxyR, orbit: 0, speed: 0, y: y },
        angle: 0,
        // orbit 0 is not "sit where we placed you". The sky clock
        // rewrites every non-fixed body to (0, y, 0) each frame, so
        // Iris Assay Spur and the hyp forge were stacked on the sun.
        fixed: true,
        userData: { hubId: def.id, placeHub: true },
      });
    }
    hubs.push({ def: def, wrap: wrap, proxy: proxy, surface: false, followBody: def.body || null });
    applySolHubs();
    return wrap;
  }

  function hubHiddenBySol(def) {
    if (!def) return false;
    if (def.hyp) return true;
    if (def.name === "Observation Station" || def.name === "Observation Lounge Annex") return true;
    if (def.body === "Observation Station") return true;
    return false;
  }

  function applySolHubs() {
    const s = window.VesperSky;
    const straight = !!(s && s.getStraightMan && s.getStraightMan());
    for (let i = 0; i < hubs.length; i++) {
      const h = hubs[i];
      if (!h || !h.wrap || !h.def) continue;
      if (!hubHiddenBySol(h.def)) continue;
      h.wrap.visible = !straight;
    }
  }


  /** Full-scale ME/movie docking — hangar bay, airlock, clamp hooks, pad (walkable). */
  function ensureDockComplex(surfaceRoot, bodyName, biome) {
    if (!surfaceRoot || !THREE) return null;
    let existing = null;
    surfaceRoot.traverse((ch) => {
      if (ch.name === "vesperDockComplex") existing = ch;
    });
    if (existing) return existing;
    const g = new THREE.Group();
    g.name = "vesperDockComplex";
    // Cold naval dock alloy (ME bay read)
    const metal = window.VesperMat({
      color: 0x7a8a9a, metalness: 0.86, roughness: 0.22, emissive: 0x152030, emissiveIntensity: 0.12, envMapIntensity: 1.15,
    });
    const accent = window.VesperMat({
      color: 0x50d0ff, metalness: 0.55, roughness: 0.22, emissive: 0x2080c0, emissiveIntensity: 0.6, envMapIntensity: 1.2,
    });
    // Landing pad (large)
    // Kay illusion: cheap canvas grit on pad (skip paint cost on coarse)
    const coarseDockFx = !!(typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches);
    if (!coarseDockFx) {
      try {
        const fc = document.createElement("canvas");
        fc.width = 256; fc.height = 256;
        const fg = fc.getContext("2d");
        fg.fillStyle = "#3a4450"; fg.fillRect(0, 0, 256, 256);
        for (let i = 0; i < 400; i++) {
          fg.fillStyle = "rgba(0,0,0," + (0.05 + Math.random() * 0.12) + ")";
          fg.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
        }
        fg.strokeStyle = "rgba(80,200,255,0.35)";
        fg.lineWidth = 3;
        fg.beginPath(); fg.arc(128, 128, 90, 0, Math.PI * 2); fg.stroke();
        const ftex = new THREE.CanvasTexture(fc);
        ftex.colorSpace = THREE.SRGBColorSpace || THREE.sRGBEncoding;
        ftex.wrapS = ftex.wrapT = THREE.RepeatWrapping;
        ftex.repeat.set(2, 2);
        ftex.name = "dockFloorCanvas";
        const padMat = metal.clone();
        padMat.map = ftex;
        padMat.color.setHex(0xffffff);
        padMat.roughness = 0.55;
        const pad = new THREE.Mesh(new THREE.CylinderGeometry(6.5, 7.2, 0.12, 32), padMat);
        pad.position.set(0, 0.06, 12);
        g.add(pad);
      } catch (_) {
        const pad = new THREE.Mesh(new THREE.CylinderGeometry(6.5, 7.2, 0.12, 32), metal.clone());
        pad.material.color.setHex(0x3a4450);
        pad.position.set(0, 0.06, 12);
        g.add(pad);
      }
    } else {
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(6.5, 7.2, 0.12, 32), metal.clone());
      pad.material.color.setHex(0x3a4450);
      pad.position.set(0, 0.06, 12);
      g.add(pad);
    }
    const ring = new THREE.Mesh(new THREE.TorusGeometry(5.2, 0.08, 8, 48), accent);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, 0.14, 12);
    g.add(ring);
    // Guide chevrons
    for (let i = 0; i < 4; i++) {
      const chev = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.04, 0.25),
        window.VesperMat({ color: 0xe0ffe8, emissive: 0x40ff80, emissiveIntensity: 0.7 })
      );
      chev.position.set(-2.4 + i * 1.6, 0.14, 16.5);
      g.add(chev);
    }
    // Pad H-mark + fuel umbilical (ops activity)
    {
      const h1 = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 0.05, 0.35),
        window.VesperMat({ color: 0xffe080, emissive: 0xc0a020, emissiveIntensity: 0.55 })
      );
      h1.name = "padHMark";
      h1.position.set(0, 0.14, 12);
      const h2 = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.05, 1.8),
        h1.material
      );
      h2.position.set(0, 0.14, 12);
      g.add(h1, h2);
      const hose = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 3.5, 6),
        window.VesperMat({ color: 0x405060, metalness: 0.4, roughness: 0.5 })
      );
      hose.rotation.z = Math.PI / 2;
      hose.position.set(4.5, 0.35, 12);
      g.add(hose);
      const pump = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 1.0, 0.7),
        window.VesperMat({ color: 0x506878, metalness: 0.55, roughness: 0.4, emissive: 0x203040, emissiveIntensity: 0.2 })
      );
      pump.position.set(6.2, 0.55, 12);
      g.add(pump);
    }
    // Fuel sign + cones (pad ops)
    if (!g.getObjectByName("dockFuelSign")) {
      const sign = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.5, 0.06),
        window.VesperMat({ color: 0xffe080, emissive: 0xc0a020, emissiveIntensity: 0.45 })
      );
      sign.name = "dockFuelSign";
      sign.position.set(6.2, 1.4, 12);
      g.add(sign);
      for (const cz of [10.5, 13.5]) {
        const cone = new THREE.Mesh(
          new THREE.ConeGeometry(0.18, 0.5, 8),
          window.VesperMat({ color: 0xff6020, emissive: 0xa03010, emissiveIntensity: 0.25 })
        );
        cone.position.set(5.0, 0.28, cz);
        g.add(cone);
      }
    }
    // Dust/wear decal under pad center (lived-in, not pristine)
    {
      const dust = new THREE.Mesh(
        new THREE.CircleGeometry(3.2, 24),
        window.VesperMat({ color: 0x4a4038, roughness: 0.95, metalness: 0.05, transparent: true, opacity: 0.45 })
      );
      dust.name = "padDustDecal";
      dust.rotation.x = -Math.PI / 2;
      dust.position.set(0, 0.13, 12);
      g.add(dust);
    }
    // Lived-in pad: cargo crates + crew bench (Starfield/NMS dock read; thrifty on coarse)
    const coarsePad = !!(typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches);
    const crateN = coarsePad ? 2 : 5;
    for (let ci = 0; ci < crateN; ci++) {
      const crate = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.55, 0.7),
        window.VesperMat({ color: 0x5a6a78, metalness: 0.45, roughness: 0.45, emissive: 0x101820, emissiveIntensity: 0.08 })
      );
      crate.position.set(-5.5 + (ci % 3) * 1.1, 0.35, 14.2 + ((ci / 3) | 0) * 1.2);
      g.add(crate);
    }
    const bench = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.12, 0.45),
      window.VesperMat({ color: 0x3a4550, metalness: 0.5, roughness: 0.4 })
    );
    bench.position.set(4.2, 0.35, 13.5);
    g.add(bench);
    if (!coarsePad) {
      const back = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 0.55, 0.08),
        window.VesperMat({ color: 0x2a3540, metalness: 0.4, roughness: 0.5 })
      );
      back.position.set(4.2, 0.65, 13.25);
      g.add(back);
    }
    // Hangar shell — hollow walkable (open +Z mouth toward pad)
    const HW = 18, HD = 20, HH = 6.2;
    const wallM = metal.clone();
    wallM.side = THREE.DoubleSide;
    wallM.emissive = new THREE.Color(0x1a2834);
    wallM.emissiveIntensity = 0.35;
    const floor = new THREE.Mesh(new THREE.BoxGeometry(HW, 0.15, HD), wallM.clone());
    floor.material.color.setHex(0x3a4554);
    floor.material.emissive = new THREE.Color(0x243040);
    floor.material.emissiveIntensity = 0.55;
    floor.material.side = THREE.DoubleSide;
    floor.position.set(0, 0.08, -2);
    g.add(floor);
    const ceilMat = wallM.clone();
    ceilMat.side = THREE.DoubleSide;
    const ceil = new THREE.Mesh(new THREE.BoxGeometry(HW, 0.12, HD), ceilMat);
    ceil.position.set(0, HH - 0.15, -2);
    g.add(ceil);
    // Quonset vault — approach read is a shed, not only a shoebox. Half-cylinder, no extra light.
    if (!g.getObjectByName("hangarBarrelVault")) {
      const coarseRoof = !!(typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches);
      const vaultMat = wallM.clone();
      vaultMat.color.setHex(0x6a7c8c);
      vaultMat.roughness = 0.48;
      vaultMat.metalness = 0.62;
      vaultMat.side = THREE.DoubleSide;
      const vault = new THREE.Mesh(
        new THREE.CylinderGeometry(HW * 0.5, HW * 0.5, HD * 0.98, coarseRoof ? 8 : 14, 1, true, 0, Math.PI),
        vaultMat
      );
      vault.name = "hangarBarrelVault";
      vault.rotation.x = Math.PI / 2;
      vault.position.set(0, HH - 0.05, -2);
      g.add(vault);
      const ribMat = window.VesperMat({
        color: 0x9aa8b4, metalness: 0.7, roughness: 0.38, emissive: 0x1a2838, emissiveIntensity: 0.12,
      });
      for (let ri = 0; ri < (coarseRoof ? 3 : 5); ri++) {
        const rib = new THREE.Mesh(
          new THREE.TorusGeometry(HW * 0.5 + 0.05, 0.07, 5, coarseRoof ? 8 : 12, Math.PI),
          ribMat
        );
        rib.name = "hangarVaultRib";
        // Torus lies in XY — same arch as the vault (axis along Z). Do not yaw.
        rib.position.set(0, HH - 0.05, -2 - HD * 0.38 + ri * (HD * 0.76 / ((coarseRoof ? 3 : 5) - 1)));
        g.add(rib);
      }
    }
    const leftW = new THREE.Mesh(new THREE.BoxGeometry(0.2, HH, HD), wallM);
    leftW.position.set(-HW / 2, HH / 2, -2);
    const rightW = new THREE.Mesh(new THREE.BoxGeometry(0.2, HH, HD), wallM);
    rightW.position.set(HW / 2, HH / 2, -2);
    const backW = new THREE.Mesh(new THREE.BoxGeometry(HW, HH, 0.2), wallM);
    backW.position.set(0, HH / 2, -2 - HD / 2);
    g.add(leftW, rightW, backW);
    // Exterior skin — panel breaks so the shed isn't a flat plastic box. One canvas, no new meshes.
    {
      const coarseSkin = !!(typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches);
      const c = document.createElement("canvas");
      c.width = coarseSkin ? 256 : 512;
      c.height = coarseSkin ? 128 : 256;
      const cg = c.getContext("2d");
      cg.fillStyle = "#748494";
      cg.fillRect(0, 0, c.width, c.height);
      cg.strokeStyle = "rgba(12,18,26,0.5)";
      cg.lineWidth = Math.max(2, c.width / 160);
      const cols = coarseSkin ? 4 : 6;
      for (let i = 1; i < cols; i++) {
        cg.beginPath();
        cg.moveTo((i * c.width) / cols, 0);
        cg.lineTo((i * c.width) / cols, c.height);
        cg.stroke();
      }
      cg.beginPath();
      cg.moveTo(0, c.height * 0.58);
      cg.lineTo(c.width, c.height * 0.58);
      cg.stroke();
      cg.fillStyle = "rgba(50,36,24,0.28)";
      cg.fillRect(c.width * 0.12, c.height * 0.62, c.width * 0.22, c.height * 0.3);
      const tex = new THREE.CanvasTexture(c);
      if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = coarseSkin ? 2 : 4;
      const skin = wallM.clone();
      skin.map = tex;
      skin.color.setHex(0xffffff);
      skin.roughness = 0.66;
      skin.metalness = 0.42;
      skin.side = THREE.DoubleSide;
      skin.emissive = new THREE.Color(0x1a2834);
      skin.emissiveIntensity = 0.28;
      leftW.material = skin;
      rightW.material = skin;
      backW.material = skin;
      const vaultMesh = g.getObjectByName("hangarBarrelVault");
      if (vaultMesh) {
        const vm = skin.clone();
        vm.side = THREE.DoubleSide;
        vm.roughness = 0.58;
        vaultMesh.material = vm;
      }
    }
    // Floor center stripe (hab readability)
    {
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.04, HD * 0.85),
        window.VesperMat({ color: 0x40c0ff, emissive: 0x2080c0, emissiveIntensity: 0.55 })
      );
      stripe.name = "hangarFloorStripe";
      stripe.position.set(0, 0.08, -2);
      g.add(stripe);
    }
    // Hazard tape edges (ME dock read)
    if (!g.getObjectByName("hangarHazardTape")) {
      for (const side of [-1, 1]) {
        const tape = new THREE.Mesh(
          new THREE.BoxGeometry(0.25, 0.03, HD * 0.7),
          window.VesperMat({ color: 0xffc020, emissive: 0xa08010, emissiveIntensity: 0.35 })
        );
        tape.name = "hangarHazardTape";
        tape.position.set(side * (HW * 0.35), 0.07, -2);
        g.add(tape);
      }
    }
    // Status board (outpost ops — Stellaris/NMS cue)
    if (!g.getObjectByName("dockStatusBoard")) {
      const board = new THREE.Group();
      board.name = "dockStatusBoard";
      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 1.1, 0.12),
        window.VesperMat({ color: 0x2a323c, metalness: 0.55, roughness: 0.4, emissive: 0x101820, emissiveIntensity: 0.12 })
      );
      panel.position.y = 1.4;
      const screen = new THREE.Mesh(
        new THREE.PlaneGeometry(1.5, 0.85),
        window.VesperMat({ color: 0x40e0a0, emissive: 0x20a070, emissiveIntensity: 0.7 })
      );
      screen.name = "dockStatusScreen";
      screen.position.set(0, 1.4, 0.07);
      const mast = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.08, 1.0, 6),
        window.VesperMat({ color: 0x506070, metalness: 0.6, roughness: 0.4 })
      );
      mast.position.y = 0.5;
      board.add(panel, screen, mast);
      board.position.set(-5.5, 0, 8);
      g.add(board);
    }
    // Radio blink on status mast (ops activity)
    if (!g.getObjectByName("dockRadioBlink")) {
      const blink = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 6, 4),
        window.VesperMat({ color: 0xff4040, emissive: 0xff2020, emissiveIntensity: 0.8 })
      );
      blink.name = "dockRadioBlink";
      blink.position.set(-5.5, 2.15, 8);
      g.add(blink);
    }
    // PA horn (ops audio cue — visual only)
    if (!g.getObjectByName("dockPASpeaker")) {
      const pa = new THREE.Mesh(
        new THREE.ConeGeometry(0.25, 0.4, 8),
        window.VesperMat({ color: 0x4a5560, metalness: 0.5, roughness: 0.4, emissive: 0x203040, emissiveIntensity: 0.15 })
      );
      pa.name = "dockPASpeaker";
      pa.rotation.z = -Math.PI / 2;
      pa.position.set(-4.2, 2.2, 8);
      g.add(pa);
    }
    // Hangar mouth arch — chase→walk depth (quonset opening read)
    if (!g.getObjectByName("hangarMouthArch")) {
      const archMat = window.VesperMat({
        color: 0x8a9aaa, metalness: 0.65, roughness: 0.4, emissive: 0x1a2838, emissiveIntensity: 0.12,
      });
      const arch = new THREE.Mesh(
        new THREE.TorusGeometry(HW * 0.48, 0.14, 6, 14, Math.PI),
        archMat
      );
      arch.name = "hangarMouthArch";
      arch.position.set(0, 0.15, -2 + HD / 2 - 0.15);
      g.add(arch);
      // Threshold sill
      const sill = new THREE.Mesh(
        new THREE.BoxGeometry(HW * 0.9, 0.12, 0.45),
        window.VesperMat({ color: 0x4a5560, metalness: 0.5, roughness: 0.45, emissive: 0x152028, emissiveIntensity: 0.1 })
      );
      sill.name = "hangarMouthSill";
      sill.position.set(0, 0.1, -2 + HD / 2 - 0.1);
      g.add(sill);
    }
    // hangarMouthLights — lived-in approach cue (emissive only on coarse)
    for (const side of [-1, 1]) {
      const ml = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.25, 0.25),
        window.VesperMat({ color: 0xa0ffe0, emissive: 0x40c090, emissiveIntensity: 0.85 })
      );
      ml.name = "hangarMouthLights";
      ml.position.set(side * (HW / 2 - 0.4), 1.2, -2 + HD / 2 - 0.3);
      g.add(ml);
    }
    // Exterior window strip (approach silhouette — lived-in hangar)
    for (let i = 0; i < 4; i++) {
      const win = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.55, 0.08),
        window.VesperMat({ color: 0x80e0ff, emissive: 0x40a0d0, emissiveIntensity: 0.7 })
      );
      win.name = "hangarWindowStrip";
      win.position.set(-HW / 2 + 1.2 + i * 1.5, HH * 0.55, -2 - HD / 2 - 0.05);
      g.add(win);
    }
    // Ceiling light bars
    for (let i = 0; i < 5; i++) {
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(HW * 0.7, 0.08, 0.18),
        window.VesperMat({ color: 0xd0e8ff, emissive: 0xa0d0ff, emissiveIntensity: 0.95 })
      );
      bar.position.set(0, HH - 0.2, -2 - HD / 2 + 2 + i * 2.8);
      g.add(bar);
    }
    const coarseDockHangar = !!(typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches);
    const hangarFill = window.VesperNoLight(0xc0e0ff, coarseDockHangar ? 0.45 : 0.85, coarseDockHangar ? 16 : 28, 2);
    hangarFill.position.set(0, HH - 1, -2);
    g.add(hangarFill);
    // Docking clamp hooks (gantry arms)
    for (const side of [-1, 1]) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 5.5), metal);
      arm.position.set(side * 4.2, 3.2, 6);
      g.add(arm);
      const hook = new THREE.Mesh(
        new THREE.TorusGeometry(0.45, 0.08, 6, 14),
        window.VesperMat({ color: 0xffc060, metalness: 0.55, roughness: 0.35, emissive: 0xa06020, emissiveIntensity: 0.4 })
      );
      hook.position.set(side * 4.2, 2.4, 8.5);
      hook.rotation.y = Math.PI / 2;
      g.add(hook);
      const piston = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.8, 8), metal);
      piston.position.set(side * 4.2, 2.8, 7.2);
      g.add(piston);
    }
    // Airlock corridor (walkable tube to side deck)
    const air = new THREE.Group();
    air.name = "vesperAirlock";
    const tube = new THREE.Mesh(
      new THREE.CylinderGeometry(1.1, 1.1, 8, 16, 1, true),
      window.VesperMat({ color: 0x4a5568, metalness: 0.5, roughness: 0.45, side: THREE.DoubleSide, emissive: 0x102030, emissiveIntensity: 0.15 })
    );
    tube.rotation.z = Math.PI / 2;
    tube.position.set(HW / 2 + 4, 1.4, -2);
    air.add(tube);
    const airFloor = new THREE.Mesh(
      new THREE.BoxGeometry(8, 0.1, 1.8),
      window.VesperMat({ color: 0x303840, metalness: 0.4, roughness: 0.6 })
    );
    airFloor.position.set(HW / 2 + 4, 0.35, -2);
    air.add(airFloor);
    // Airlock door rings
    for (const ox of [0, 7.2]) {
      const door = new THREE.Mesh(
        new THREE.TorusGeometry(1.05, 0.1, 8, 20),
        window.VesperMat({ color: 0x70e0c0, metalness: 0.55, roughness: 0.3, emissive: 0x20a080, emissiveIntensity: 0.5 })
      );
      door.position.set(HW / 2 + 0.4 + ox, 1.4, -2);
      door.rotation.y = Math.PI / 2;
      air.add(door);
    }
    if (!coarseDockHangar) {
      const airLight = window.VesperNoLight(0x80ffe0, 0.5, 10, 2);
      airLight.position.set(HW / 2 + 4, 2.2, -2);
      air.add(airLight);
    }
    g.add(air);
    // Side deck / ops room (full size)
    const deck = new THREE.Group();
    deck.name = "vesperOpsDeck";
    const df = new THREE.Mesh(
      new THREE.BoxGeometry(10, 0.12, 8),
      window.VesperMat({ color: 0x2a323c, metalness: 0.35, roughness: 0.65 })
    );
    df.position.set(HW / 2 + 12, 0.06, -2);
    deck.add(df);
    for (const [wx, wz, ww, wd] of [
      [HW / 2 + 12, -2 - 4, 10, 0.15],
      [HW / 2 + 12 - 5, -2, 0.15, 8],
      [HW / 2 + 12 + 5, -2, 0.15, 8],
    ]) {
      const wmat = (leftW && leftW.material && leftW.material.map) ? leftW.material.clone() : metal;
      if (wmat !== metal) wmat.side = THREE.DoubleSide;
      const w = new THREE.Mesh(new THREE.BoxGeometry(ww, 3.2, wd), wmat);
      w.position.set(wx, 1.6, wz);
      deck.add(w);
    }
    {
      const cmat = (leftW && leftW.material && leftW.material.map) ? leftW.material.clone() : metal;
      const dceil = new THREE.Mesh(new THREE.BoxGeometry(10, 0.1, 8), cmat);
      dceil.name = "opsDeckCeil";
      dceil.position.set(HW / 2 + 12, 3.15, -2);
      deck.add(dceil);
    }
    const cons = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 1.0, 0.8),
      window.VesperMat({ color: 0x203040, emissive: 0x3080c0, emissiveIntensity: 0.4 })
    );
    cons.position.set(HW / 2 + 12, 0.6, -4.5);
    deck.add(cons);
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(2.0, 0.7),
      window.VesperMat({ color: 0x80d0ff, emissive: 0x40a0ff, emissiveIntensity: 0.8 })
    );
    screen.position.set(HW / 2 + 12, 1.15, -4.05);
    deck.add(screen);
    // Crates / job props
    for (let i = 0; i < 6; i++) {
      const c = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.55, 0.7),
        window.VesperMat({ color: 0x6a5030, roughness: 0.7 })
      );
      c.position.set(-4 + (i % 3) * 1.1, 0.35, -6 + Math.floor(i / 3) * 1.2);
      g.add(c);
    }
    if (!coarseDockHangar) {
      const deckFill = window.VesperNoLight(0xa0d0ff, 0.55, 16, 2);
      deckFill.position.set(HW / 2 + 12, 2.5, -2);
      deck.add(deckFill);
    }
    g.add(deck);
    // —— ME-scale densify: mezzanine, cargo office, shop, job board, second lock ——
    const coarseSkipMezz = !!(typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches);
    if (!coarseSkipMezz) {
    const mez = new THREE.Mesh(
      new THREE.BoxGeometry(HW - 1.5, 0.12, 5),
      window.VesperMat({ color: 0x3a4858, metalness: 0.45, roughness: 0.5 })
    );
    mez.position.set(0, 2.8, -2 - HD / 2 + 3);
    g.add(mez);
    // Mezzanine rail
    for (const side of [-1, 1]) {
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.55, 5),
        window.VesperMat({ color: 0x80c0e0, metalness: 0.5, roughness: 0.35, emissive: 0x204060, emissiveIntensity: 0.25 })
      );
      rail.position.set(side * ((HW - 1.5) / 2 - 0.2), 3.15, -2 - HD / 2 + 3);
      g.add(rail);
    }
    // Stairs (readable climb cue)
    for (let s = 0; s < 6; s++) {
      const step = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.12, 0.55),
        window.VesperMat({ color: 0x4a5560, metalness: 0.4, roughness: 0.55 })
      );
      step.position.set(-HW / 2 + 1.2, 0.2 + s * 0.42, -2 - HD / 2 + 5.5 - s * 0.35);
      g.add(step);
    }
    // Floor lane stripes (taxiway into hangar)
    for (let i = 0; i < 7; i++) {
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.03, 1.2),
        window.VesperMat({ color: 0xffe080, emissive: 0xc0a020, emissiveIntensity: 0.45 })
      );
      stripe.position.set(0, 0.16, 10 - i * 2.2);
      g.add(stripe);
    }
    // Cargo office annex (walkable room off -X)
    const office = new THREE.Group();
    office.name = "vesperCargoOffice";
    const of = new THREE.Mesh(
      new THREE.BoxGeometry(7, 0.1, 6),
      window.VesperMat({ color: 0x2a323c, metalness: 0.35, roughness: 0.65 })
    );
    of.position.set(-HW / 2 - 5, 0.05, -2);
    office.add(of);
    for (const [ox, oz, ow, od] of [
      [-HW / 2 - 5, -2 - 3, 7, 0.12],
      [-HW / 2 - 5 - 3.5, -2, 0.12, 6],
      [-HW / 2 - 5 + 3.5, -2, 0.12, 6],
    ]) {
      const omat = (leftW && leftW.material && leftW.material.map) ? leftW.material.clone() : metal;
      if (omat !== metal) omat.side = THREE.DoubleSide;
      const ow_ = new THREE.Mesh(new THREE.BoxGeometry(ow, 2.8, od), omat);
      ow_.position.set(ox, 1.4, oz);
      office.add(ow_);
    }
    {
      const oceilMat = (leftW && leftW.material && leftW.material.map) ? leftW.material.clone() : metal;
      const oceil = new THREE.Mesh(new THREE.BoxGeometry(7, 0.1, 6), oceilMat);
      oceil.name = "cargoOfficeCeil";
      oceil.position.set(-HW / 2 - 5, 2.75, -2);
      office.add(oceil);
    }
    const desk = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.85, 0.9),
      window.VesperMat({ color: 0x3a4550, metalness: 0.4, roughness: 0.5, emissive: 0x183048, emissiveIntensity: 0.2 })
    );
    desk.position.set(-HW / 2 - 5, 0.5, -3.5);
    office.add(desk);
    const jobBoard = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 1.6),
      window.VesperMat({ color: 0x203040, emissive: 0x40a0ff, emissiveIntensity: 0.55 })
    );
    jobBoard.position.set(-HW / 2 - 5, 1.6, -4.85);
    jobBoard.name = "dockJobBoard";
    office.add(jobBoard);
    if (!coarseDockHangar) {
      const officeL = window.VesperNoLight(0xa0d0ff, 0.5, 12, 2);
      officeL.position.set(-HW / 2 - 5, 2.2, -2);
      office.add(officeL);
    }
    g.add(office);
    // Market kiosk inside hangar (shop activity)
    const shop = new THREE.Group();
    shop.name = "dockMarketKiosk";
    const counter = new THREE.Mesh(
      new THREE.BoxGeometry(2.8, 1.0, 1.2),
      window.VesperMat({ color: 0x8a7060, roughness: 0.7, metalness: 0.25 })
    );
    counter.position.set(4.5, 0.55, -HD / 2 + 2);
    shop.add(counter);
    const awning = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 0.08, 1.6),
      window.VesperMat({ color: 0x406080, emissive: 0x204060, emissiveIntensity: 0.3 })
    );
    awning.position.set(4.5, 1.8, -HD / 2 + 2);
    shop.add(awning);
    const shopScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 0.7),
      window.VesperMat({ color: 0x80e0ff, emissive: 0x40b0ff, emissiveIntensity: 0.7 })
    );
    shopScreen.position.set(4.5, 1.25, -HD / 2 + 2.55);
    shop.add(shopScreen);
    g.add(shop);
    // More crates + fuel drums (lived-in)
    for (let i = 0; i < 10; i++) {
      const c = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.65, 0.8),
        window.VesperMat({ color: i % 2 ? 0x6a5030 : 0x405060, roughness: 0.65, metalness: 0.3 })
      );
      c.position.set(2 + (i % 5) * 1.0, 0.4, -4 + Math.floor(i / 5) * 1.3);
      g.add(c);
    }
    for (let i = 0; i < 4; i++) {
      const drum = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.35, 0.9, 10),
        window.VesperMat({ color: 0x506070, metalness: 0.55, roughness: 0.4, emissive: 0x203040, emissiveIntensity: 0.15 })
      );
      drum.position.set(-5 + i * 0.9, 0.5, 2);
      g.add(drum);
    }
    // Second airlock toward pad (external lock)
    const lock2 = new THREE.Mesh(
      new THREE.TorusGeometry(1.3, 0.12, 8, 24),
      window.VesperMat({ color: 0x70e0c0, metalness: 0.55, roughness: 0.3, emissive: 0x20a080, emissiveIntensity: 0.55 })
    );
    lock2.position.set(0, 1.5, 8);
    lock2.rotation.x = Math.PI / 2;
    g.add(lock2);
    // Pad flood lights (iPhone: emissive bulbs only — SpotLight kills FPS)
    const coarseDock = !!(typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches);
    for (const side of [-1, 1]) {
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.1, 4.5, 6),
        metal
      );
      pole.position.set(side * 5.5, 2.25, 14);
      g.add(pole);
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, coarseDock ? 6 : 10, 6),
        window.VesperMat({ color: 0xe0f0ff, emissive: 0xc0e0ff, emissiveIntensity: 0.9 })
      );
      bulb.position.set(side * 5.5, 4.3, 14);
      g.add(bulb);
      if (!coarseDock) {
        if (!coarseDockHangar) {
          const flood = window.VesperNoLight(0xe0f0ff, 0.55, 18, 2);
          flood.position.set(side * 5.5, 4.3, 14);
          g.add(flood);
        }
      }
    }
    // Hangar sign
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(4, 0.7),
      window.VesperMat({ color: 0x102030, emissive: 0x60c0ff, emissiveIntensity: 0.65 })
    );
    sign.position.set(0, HH - 0.8, -2 + HD / 2 - 0.15);
    g.add(sign);
    const welcome = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 0.9),
      window.VesperMat({ color: 0x182838, emissive: 0x40a080, emissiveIntensity: 0.45 })
    );
    welcome.name = "dockWelcomePlacard";
    welcome.position.set(5.5, 2.2, 8);
    welcome.rotation.y = -0.4;
    g.add(welcome);



    // Tool carts + weld sparks cue (lived-in hangar activity)
    for (let ti = 0; ti < (coarseSkipMezz ? 1 : 3); ti++) {
      const cart = new THREE.Group();
      cart.name = "dockToolCart";
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.7, 0.7),
        window.VesperMat({ color: 0x4a5560, metalness: 0.45, roughness: 0.5 })
      );
      base.position.y = 0.4;
      const wheel = new THREE.Mesh(
        new THREE.TorusGeometry(0.15, 0.04, 6, 12),
        window.VesperMat({ color: 0x202428, metalness: 0.6, roughness: 0.4 })
      );
      wheel.rotation.y = Math.PI / 2;
      wheel.position.set(-0.4, 0.15, 0.35);
      const wheel2 = wheel.clone();
      wheel2.position.x = 0.4;
      cart.add(base, wheel, wheel2);
      cart.position.set(-3 + ti * 2.5, 0, -HD / 2 + 4);
      g.add(cart);
    }

    } // coarseSkipMezz
    // iPhone lived-in stub — job board + crates when mezz skipped (rubric #3 phone)
    if (coarseSkipMezz) {
      const board = new THREE.Mesh(
        new THREE.PlaneGeometry(2.2, 1.4),
        window.VesperMat({ color: 0x203040, emissive: 0x40a0ff, emissiveIntensity: 0.6 })
      );
      board.position.set(-6, 1.5, 2);
      board.rotation.y = Math.PI / 2;
      board.name = "dockJobBoard";
      g.add(board);
      for (let i = 0; i < 4; i++) {
        const c = new THREE.Mesh(
          new THREE.BoxGeometry(0.7, 0.55, 0.7),
          window.VesperMat({ color: i % 2 ? 0x6a5030 : 0x405060, roughness: 0.65, metalness: 0.3 })
        );
        c.position.set(3 + (i % 3) * 0.95, 0.35 + (i >= 3 ? 0.55 : 0), 4 + (i >= 3 ? 0.2 : 0));
        g.add(c);
      }
      const kiosk = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 1.1, 0.8),
        window.VesperMat({ color: 0x3a5068, metalness: 0.45, roughness: 0.4, emissive: 0x183048, emissiveIntensity: 0.25 })
      );
      kiosk.position.set(5, 0.6, 6);
      kiosk.name = "marketStall";
      g.add(kiosk);
      const bench = new THREE.Mesh(
        new THREE.BoxGeometry(2.0, 0.35, 0.5),
        window.VesperMat({ color: 0x4a5560, metalness: 0.4, roughness: 0.5 })
      );
      bench.name = "phoneLivedInBench";
      bench.position.set(-4, 0.25, 8);
      g.add(bench);
      const kettle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.14, 0.22, 8),
        window.VesperMat({ color: 0xc0d0e0, metalness: 0.7, roughness: 0.25, emissive: 0x406080, emissiveIntensity: 0.45 })
      );
      kettle.position.set(-4, 0.55, 8);
      g.add(kettle);
      // Tool rack + wall cable + LED ops strip (phone densify when mezz skipped)
      {
        const rack = new THREE.Group();
        rack.name = "phoneDockToolRack";
        const back = new THREE.Mesh(
          new THREE.BoxGeometry(0.1, 1.6, 1.0),
          window.VesperMat({ color: 0x4a5560, metalness: 0.5, roughness: 0.45 })
        );
        back.position.set(6.5, 1.0, 2);
        rack.add(back);
        for (let ti = 0; ti < 4; ti++) {
          const tool = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.04, 0.7, 5),
            window.VesperMat({ color: 0x80a0b0, metalness: 0.55, roughness: 0.35 })
          );
          tool.position.set(6.35, 0.7 + (ti % 2) * 0.5, 1.6 + ti * 0.22);
          rack.add(tool);
        }
        g.add(rack);
      }
      for (let ci = 0; ci < 2; ci++) {
        const cable = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.04, 3.5, 5),
          window.VesperMat({ color: 0x2a3540, metalness: 0.35, roughness: 0.55 })
        );
        cable.name = "phoneDockCable";
        cable.rotation.z = Math.PI / 2;
        cable.position.set(-2 + ci * 2, 0.15 + ci * 0.08, 7.5);
        g.add(cable);
      }
      const ledStrip = new THREE.Mesh(
        new THREE.BoxGeometry(4.5, 0.06, 0.08),
        window.VesperMat({ color: 0x40ffc0, emissive: 0x20c090, emissiveIntensity: 0.75 })
      );
      ledStrip.name = "phoneDockLedStrip";
      ledStrip.position.set(0, 2.4, -HD / 2 + 0.3);
      g.add(ledStrip);
      // Fuel drum pair (ops footprint)
      for (let i = 0; i < 2; i++) {
        const drum = new THREE.Mesh(
          new THREE.CylinderGeometry(0.3, 0.3, 0.8, 8),
          window.VesperMat({ color: 0x506070, metalness: 0.55, roughness: 0.4, emissive: 0x203040, emissiveIntensity: 0.15 })
        );
        drum.position.set(-5.5 + i * 0.75, 0.45, 5);
        g.add(drum);
      }
      // Worker silhouette at bay mouth (approach-readable activity — no PointLight)
      if (!g.getObjectByName("dockBayWorker")) {
        const worker = new THREE.Group();
        worker.name = "dockBayWorker";
        const torso = new THREE.Mesh(
          THREE.CapsuleGeometry ? new THREE.CapsuleGeometry(0.16, 0.4, 4, 8) : new THREE.CylinderGeometry(0.16, 0.16, 0.6, 8),
          window.VesperMat({ color: 0xb8c0c8, metalness: 0.25, roughness: 0.55, emissive: 0x304050, emissiveIntensity: 0.12 })
        );
        torso.position.y = 0.75;
        const helm = new THREE.Mesh(
          new THREE.SphereGeometry(0.16, 8, 6),
          window.VesperMat({ color: 0xe8f0f8, metalness: 0.3, roughness: 0.3, emissive: 0x406080, emissiveIntensity: 0.22 })
        );
        helm.position.y = 1.25;
        worker.add(torso, helm);
        worker.position.set(3.5, 0, 8.5);
        g.add(worker);
      }
      // Loader cart at open bay mouth (approach clutter)
      if (!g.getObjectByName("dockBayLoader")) {
        const loader = new THREE.Group();
        loader.name = "dockBayLoader";
        const base = new THREE.Mesh(
          new THREE.BoxGeometry(1.4, 0.35, 0.9),
          window.VesperMat({ color: 0x5a6a78, metalness: 0.5, roughness: 0.4, emissive: 0x152028, emissiveIntensity: 0.1 })
        );
        base.position.y = 0.4;
        const mast = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 1.2, 0.12),
          window.VesperMat({ color: 0x405060, metalness: 0.55, roughness: 0.4 })
        );
        mast.position.set(-0.4, 1.0, 0);
        const fork = new THREE.Mesh(
          new THREE.BoxGeometry(0.9, 0.08, 0.5),
          window.VesperMat({ color: 0xffc060, metalness: 0.45, roughness: 0.4, emissive: 0xa06020, emissiveIntensity: 0.25 })
        );
        fork.position.set(0.2, 0.85, 0);
        for (const wx of [-0.45, 0.45]) {
          const wh = new THREE.Mesh(
            new THREE.CylinderGeometry(0.18, 0.18, 0.14, 8),
            window.VesperMat({ color: 0x202428, metalness: 0.55, roughness: 0.4 })
          );
          wh.rotation.z = Math.PI / 2;
          wh.position.set(wx, 0.18, 0.4);
          loader.add(wh);
        }
        loader.add(base, mast, fork);
        loader.position.set(-2.5, 0, 9.2);
        g.add(loader);
      }
      // Open bay mouth clutter crates (readable from approach)
      if (!g.getObjectByName("dockBayMouthCrate")) {
        for (let i = 0; i < 3; i++) {
          const c = new THREE.Mesh(
            new THREE.BoxGeometry(0.55, 0.45, 0.55),
            window.VesperMat({ color: i % 2 ? 0x6a5030 : 0x405060, roughness: 0.65, metalness: 0.3 })
          );
          c.name = "dockBayMouthCrate";
          c.position.set(-1.2 + i * 0.7, 0.3, 8.2);
          g.add(c);
        }
      }
    }


    // Loading crane arm (dock activity silhouette — no hub inflate)
    if (!g.getObjectByName("dockCraneArm")) {
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.35, 1.2, 8),
        window.VesperMat({ color: 0x4a5560, metalness: 0.55, roughness: 0.4 })
      );
      base.name = "dockCraneArm";
      base.position.set(9, 0.6, 12);
      const mast = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.12, 4.5, 6),
        window.VesperMat({ color: 0x5a6570, metalness: 0.6, roughness: 0.35 })
      );
      mast.position.set(9, 3.0, 12);
      const boom = new THREE.Mesh(
        new THREE.BoxGeometry(4.0, 0.15, 0.2),
        window.VesperMat({ color: 0xc07040, metalness: 0.45, roughness: 0.4, emissive: 0x402010, emissiveIntensity: 0.1 })
      );
      boom.name = "dockCraneBoom";
      boom.position.set(7.2, 5.0, 12);
      const hook = new THREE.Mesh(
        new THREE.TorusGeometry(0.2, 0.05, 6, 10),
        window.VesperMat({ color: 0xffc060, metalness: 0.5, roughness: 0.35, emissive: 0xa06020, emissiveIntensity: 0.35 })
      );
      hook.name = "dockCraneHook";
      hook.position.set(5.4, 4.5, 12);
      g.add(base, mast, boom, hook);
    }
    // Tire wear strips (traffic without hub inflate)
    if (!g.getObjectByName("dockTireWear")) {
      for (let i = 0; i < 3; i++) {
        const wear = new THREE.Mesh(
          new THREE.BoxGeometry(0.35, 0.02, 2.2),
          window.VesperMat({ color: 0x2a2824, roughness: 0.95, metalness: 0.05, transparent: true, opacity: 0.55 })
        );
        wear.name = "dockTireWear";
        wear.position.set(-5.5 + i * 0.4, 0.05, 13);
        wear.rotation.y = 0.15;
        g.add(wear);
      }
    }
    // Flood poles (emissive only — phone-safe approach light)
    if (!g.getObjectByName("dockFloodPole")) {
      for (const side of [-1, 1]) {
        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.1, 4.5, 6),
          window.VesperMat({ color: 0x4a5560, metalness: 0.55, roughness: 0.4 })
        );
        pole.name = "dockFloodPole";
        pole.position.set(side * 8, 2.25, 15);
        const lamp = new THREE.Mesh(
          new THREE.SphereGeometry(0.28, 8, 6),
          window.VesperMat({ color: 0xffe8c0, emissive: 0xffa040, emissiveIntensity: 0.85 })
        );
        lamp.position.set(side * 8, 4.6, 15);
        g.add(pole, lamp);
      }
    }
    // Cargo ramp into hangar (lived-in approach — not checkbox pad)
    if (!g.getObjectByName("cargoRamp")) {
      const ramp = new THREE.Mesh(
        new THREE.BoxGeometry(3.2, 0.1, 2.4),
        window.VesperMat({ color: 0x4a5560, metalness: 0.55, roughness: 0.45, emissive: 0x101820, emissiveIntensity: 0.08 })
      );
      ramp.name = "cargoRamp";
      ramp.position.set(0, 0.08, 10.5);
      ramp.rotation.x = -0.1;
      g.add(ramp);
      for (const sx of [-1.5, 1.5]) {
        const rail = new THREE.Mesh(
          new THREE.BoxGeometry(0.1, 0.4, 2.0),
          window.VesperMat({ color: 0x708090, metalness: 0.6, roughness: 0.4 })
        );
        rail.position.set(sx, 0.3, 10.5);
        g.add(rail);
      }
      for (let i = 0; i < 3; i++) {
        const ch = new THREE.Mesh(
          new THREE.BoxGeometry(0.8, 0.04, 0.18),
          window.VesperMat({ color: 0x40ffc0, emissive: 0x20c090, emissiveIntensity: 0.7 })
        );
        ch.position.set(0, 0.14, 11.2 + i * 0.55);
        g.add(ch);
      }
    }
    // Pad rover (outpost activity — Stellaris/NMS cue)
    if (!g.getObjectByName("dockPadRover")) {
      const rover = new THREE.Group();
      rover.name = "dockPadRover";
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 0.55, 1.1),
        window.VesperMat({ color: 0xc0a060, metalness: 0.35, roughness: 0.5, emissive: 0x403010, emissiveIntensity: 0.1 })
      );
      body.position.y = 0.55;
      rover.add(body);
      const cabin = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.5, 0.9),
        window.VesperMat({ color: 0x70c8ff, metalness: 0.2, roughness: 0.2, emissive: 0x2060a0, emissiveIntensity: 0.4, transparent: true, opacity: 0.7 })
      );
      cabin.position.set(0.35, 0.95, 0);
      rover.add(cabin);
      for (const [wx, wz] of [[-0.5, 0.5], [0.5, 0.5], [-0.5, -0.5], [0.5, -0.5]]) {
        const wh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.28, 0.28, 0.22, 10),
          window.VesperMat({ color: 0x2a2e34, metalness: 0.5, roughness: 0.45 })
        );
        wh.rotation.z = Math.PI / 2;
        wh.position.set(wx, 0.28, wz);
        rover.add(wh);
      }
      rover.position.set(-7, 0, 14);
      g.add(rover);
    }
    // Path chevrons hangar → market (lived-in traffic)
    if (!g.getObjectByName("dockPathChevron")) {
      for (let i = 0; i < 5; i++) {
        const ch = new THREE.Mesh(
          new THREE.BoxGeometry(0.55, 0.03, 0.2),
          window.VesperMat({ color: 0xffe080, emissive: 0xc0a020, emissiveIntensity: 0.45 })
        );
        ch.name = "dockPathChevron";
        ch.position.set(2.5 + i * 0.7, 0.06, 9.5);
        ch.rotation.y = 0.4;
        g.add(ch);
      }
    }
    // Barrel/drum stack (ops clutter — lived-in)
    if (!g.getObjectByName("dockBarrelStack")) {
      const stack = new THREE.Group();
      stack.name = "dockBarrelStack";
      for (let i = 0; i < 4; i++) {
        const drum = new THREE.Mesh(
          new THREE.CylinderGeometry(0.35, 0.35, 0.7, 10),
          window.VesperMat({
            color: i % 2 ? 0x6a5030 : 0x405060, metalness: 0.4, roughness: 0.5,
            emissive: 0x152028, emissiveIntensity: 0.08,
          })
        );
        drum.position.set((i % 2) * 0.75, 0.4, Math.floor(i / 2) * 0.75);
        stack.add(drum);
      }
      stack.position.set(5.5, 0, 7);
      g.add(stack);
    }
    // Pallet jack (dock traffic cue)
    if (!g.getObjectByName("dockPalletJack")) {
      const jack = new THREE.Group();
      jack.name = "dockPalletJack";
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.08, 0.6),
        window.VesperMat({ color: 0xc07040, metalness: 0.45, roughness: 0.45 })
      );
      base.position.y = 0.15;
      const handle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 1.0, 5),
        window.VesperMat({ color: 0x303840, metalness: 0.6, roughness: 0.4 })
      );
      handle.position.set(-0.5, 0.65, 0);
      handle.rotation.z = 0.3;
      jack.add(base, handle);
      jack.position.set(6.5, 0, 8);
      g.add(jack);
    }
    // Open toolbox (lived-in dock clutter)
    if (!g.getObjectByName("dockToolbox")) {
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.35, 0.45),
        window.VesperMat({ color: 0xc05020, metalness: 0.4, roughness: 0.45, emissive: 0x401000, emissiveIntensity: 0.12 })
      );
      box.name = "dockToolbox";
      box.position.set(4.2, 0.22, 9.2);
      const lid = new THREE.Mesh(
        new THREE.BoxGeometry(0.72, 0.06, 0.48),
        window.VesperMat({ color: 0xa04018, metalness: 0.45, roughness: 0.4 })
      );
      lid.position.set(4.2, 0.45, 9.0);
      lid.rotation.x = -0.6;
      g.add(box, lid);
    }
    // Service hose reel + glowing valve (ops clutter — arrival feel, no PointLight)
    if (!g.getObjectByName("dockServiceHose")) {
      const reel = new THREE.Group();
      reel.name = "dockServiceHose";
      const drum = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.35, 0.28, 10),
        window.VesperMat({ color: 0x4a5560, metalness: 0.55, roughness: 0.4, emissive: 0x152028, emissiveIntensity: 0.1 })
      );
      drum.rotation.z = Math.PI / 2;
      drum.position.set(0, 0.55, 0);
      const stand = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.9, 0.2),
        window.VesperMat({ color: 0x3a4550, metalness: 0.5, roughness: 0.45 })
      );
      stand.position.y = 0.45;
      const hose = new THREE.Mesh(
        new THREE.TorusGeometry(0.55, 0.04, 6, 16, Math.PI * 1.2),
        window.VesperMat({ color: 0x2a3540, metalness: 0.25, roughness: 0.6 })
      );
      hose.position.set(0.2, 0.4, 0.15);
      hose.rotation.y = 0.3;
      const valve = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 8, 6),
        window.VesperMat({ color: 0x40ffc0, emissive: 0x20c090, emissiveIntensity: 0.75 })
      );
      valve.name = "dockHoseValveGlow";
      valve.position.set(0.55, 0.35, 0.2);
      reel.add(drum, stand, hose, valve);
      reel.position.set(-6.5, 0, 10.5);
      g.add(reel);
    }
    // Floor conveyor pulse strip (subtle traffic motion cue — Stellaris/NMS arrival)
    if (!g.getObjectByName("dockConveyorBelt")) {
      const belt = new THREE.Group();
      belt.name = "dockConveyorBelt";
      const bed = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.08, 5.5),
        window.VesperMat({ color: 0x2a323c, metalness: 0.45, roughness: 0.5, emissive: 0x101820, emissiveIntensity: 0.1 })
      );
      bed.position.set(7.2, 0.12, 6);
      belt.add(bed);
      for (let i = 0; i < 6; i++) {
        const seg = new THREE.Mesh(
          new THREE.BoxGeometry(0.9, 0.04, 0.35),
          window.VesperMat({ color: 0xffc060, emissive: 0xa06020, emissiveIntensity: 0.4 })
        );
        seg.name = "dockConveyorSeg";
        seg.userData.segIndex = i;
        seg.position.set(7.2, 0.18, 3.8 + i * 0.85);
        belt.add(seg);
      }
      g.add(belt);
    }
    // Approach beacon mast (pad ops — coarse-safe emissive pulse)
    if (!g.getObjectByName("dockApproachBeacon")) {
      const mast = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.08, 3.8, 6),
        window.VesperMat({ color: 0x506070, metalness: 0.55, roughness: 0.4 })
      );
      mast.name = "dockApproachBeacon";
      mast.position.set(-8.5, 1.9, 16);
      const lamp = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 8, 6),
        window.VesperMat({ color: 0xffe080, emissive: 0xffc040, emissiveIntensity: 0.9 })
      );
      lamp.name = "dockApproachBeaconLamp";
      lamp.position.set(-8.5, 4.0, 16);
      g.add(mast, lamp);
    }
    // alwaysDockToolCart — lived-in even when mezz skipped
    {
      const cart = new THREE.Group();
      cart.name = "alwaysDockToolCart";
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 0.65, 0.65),
        window.VesperMat({ color: 0x4a5560, metalness: 0.5, roughness: 0.45 })
      );
      base.position.y = 0.38;
      cart.add(base);
      cart.position.set(3.5, 0, 9);
      g.add(cart);
    }
    // Mezz access ladder (coarse-safe activity silhouette — no PointLight)
    if (!g.getObjectByName("dockMezzLadder")) {
      const ladder = new THREE.Group();
      ladder.name = "dockMezzLadder";
      for (const sx of [-0.22, 0.22]) {
        const rail = new THREE.Mesh(
          new THREE.CylinderGeometry(0.035, 0.035, 3.2, 5),
          window.VesperMat({ color: 0x708090, metalness: 0.55, roughness: 0.4 })
        );
        rail.position.set(sx, 1.65, 0);
        ladder.add(rail);
      }
      for (let i = 0; i < 7; i++) {
        const rung = new THREE.Mesh(
          new THREE.BoxGeometry(0.5, 0.04, 0.06),
          window.VesperMat({ color: 0x506070, metalness: 0.5, roughness: 0.4 })
        );
        rung.position.set(0, 0.35 + i * 0.4, 0);
        ladder.add(rung);
      }
      // Path markers to ladder (crew walking cue)
      for (let i = 0; i < 3; i++) {
        const mk = new THREE.Mesh(
          new THREE.BoxGeometry(0.25, 0.025, 0.12),
          window.VesperMat({ color: 0xffe080, emissive: 0xc0a020, emissiveIntensity: 0.4 })
        );
        mk.position.set(0, 0.04, 0.6 + i * 0.45);
        ladder.add(mk);
      }
      ladder.position.set(-5.5, 0, 3.5);
      g.add(ladder);
    }
    // Always-on approach activity (desktop + phone) — worker/loader if stub missed
    if (!g.getObjectByName("dockBayWorker")) {
      const worker = new THREE.Group();
      worker.name = "dockBayWorker";
      const torso = new THREE.Mesh(
        THREE.CapsuleGeometry ? new THREE.CapsuleGeometry(0.16, 0.4, 4, 8) : new THREE.CylinderGeometry(0.16, 0.16, 0.6, 8),
        window.VesperMat({ color: 0xb8c0c8, metalness: 0.25, roughness: 0.55, emissive: 0x304050, emissiveIntensity: 0.12 })
      );
      torso.position.y = 0.75;
      const helm = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 8, 6),
        window.VesperMat({ color: 0xe8f0f8, metalness: 0.3, roughness: 0.3, emissive: 0x406080, emissiveIntensity: 0.22 })
      );
      helm.position.y = 1.25;
      worker.add(torso, helm);
      worker.position.set(3.5, 0, 8.5);
      g.add(worker);
    }
    if (!g.getObjectByName("dockBayLoader")) {
      const loader = new THREE.Group();
      loader.name = "dockBayLoader";
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.35, 0.9),
        window.VesperMat({ color: 0x5a6a78, metalness: 0.5, roughness: 0.4, emissive: 0x152028, emissiveIntensity: 0.1 })
      );
      base.position.y = 0.4;
      const mast = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 1.2, 0.12),
        window.VesperMat({ color: 0x405060, metalness: 0.55, roughness: 0.4 })
      );
      mast.position.set(-0.4, 1.0, 0);
      const fork = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.08, 0.5),
        window.VesperMat({ color: 0xffc060, metalness: 0.45, roughness: 0.4, emissive: 0xa06020, emissiveIntensity: 0.25 })
      );
      fork.position.set(0.2, 0.85, 0);
      loader.add(base, mast, fork);
      loader.position.set(-2.5, 0, 9.2);
      g.add(loader);
    }

    // —— Always-on lived-in density (phone + desktop) — no hub inflate, no PointLight ——
    // Market plaza: readable stall volume at bay mouth (chase→walk)
    if (!g.getObjectByName("dockMarketPlaza")) {
      const plaza = new THREE.Group();
      plaza.name = "dockMarketPlaza";
      const pad = new THREE.Mesh(
        new THREE.BoxGeometry(4.2, 0.08, 3.2),
        window.VesperMat({ color: 0x3a4550, metalness: 0.35, roughness: 0.65, emissive: 0x101820, emissiveIntensity: 0.08 })
      );
      pad.position.set(0, 0.06, 0);
      plaza.add(pad);
      const counter = new THREE.Mesh(
        new THREE.BoxGeometry(2.6, 0.95, 1.0),
        window.VesperMat({ color: 0x8a7060, roughness: 0.7, metalness: 0.25, emissive: 0x2a2018, emissiveIntensity: 0.1 })
      );
      counter.position.set(0, 0.55, -0.6);
      plaza.add(counter);
      const awning = new THREE.Mesh(
        new THREE.BoxGeometry(3.4, 0.08, 2.2),
        window.VesperMat({ color: 0x406080, metalness: 0.35, roughness: 0.45, emissive: 0x204060, emissiveIntensity: 0.35 })
      );
      awning.position.set(0, 2.05, -0.3);
      plaza.add(awning);
      // Awning poles
      for (const sx of [-1.5, 1.5]) {
        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.06, 2.0, 6),
          window.VesperMat({ color: 0x506070, metalness: 0.55, roughness: 0.4 })
        );
        pole.position.set(sx, 1.05, 0.6);
        plaza.add(pole);
      }
      const openSign = new THREE.Mesh(
        new THREE.PlaneGeometry(1.4, 0.45),
        window.VesperMat({ color: 0x102030, emissive: 0x40ff90, emissiveIntensity: 0.85, side: THREE.DoubleSide })
      );
      openSign.name = "dockMarketOpenSign";
      openSign.position.set(0, 2.35, 0.85);
      plaza.add(openSign);
      // Shelf racks with goods (readable inventory — not empty counter)
      for (let si = 0; si < 2; si++) {
        const shelf = new THREE.Mesh(
          new THREE.BoxGeometry(1.1, 1.4, 0.35),
          window.VesperMat({ color: 0x4a5560, metalness: 0.45, roughness: 0.5 })
        );
        shelf.position.set(-1.4 + si * 2.8, 0.9, -1.2);
        plaza.add(shelf);
        for (let gi = 0; gi < 3; gi++) {
          const good = new THREE.Mesh(
            new THREE.BoxGeometry(0.28, 0.22, 0.22),
            window.VesperMat({
              color: gi % 2 ? 0xc07040 : 0x5080a0, metalness: 0.35, roughness: 0.5,
              emissive: gi % 2 ? 0x401800 : 0x103040, emissiveIntensity: 0.2,
            })
          );
          good.position.set(-1.4 + si * 2.8, 0.45 + gi * 0.4, -1.0);
          plaza.add(good);
        }
      }
      const screen = new THREE.Mesh(
        new THREE.PlaneGeometry(1.0, 0.6),
        window.VesperMat({ color: 0x80e0ff, emissive: 0x40b0ff, emissiveIntensity: 0.7 })
      );
      screen.name = "dockMarketScreen";
      screen.position.set(0, 1.2, -0.05);
      plaza.add(screen);
      plaza.position.set(6.5, 0, 11.5);
      g.add(plaza);
    }

    // Crew lounge alcove — readable interior volume off hangar +X (walk-in feel)
    if (!g.getObjectByName("dockCrewLounge")) {
      const lounge = new THREE.Group();
      lounge.name = "dockCrewLounge";
      const floor = new THREE.Mesh(
        new THREE.BoxGeometry(5.5, 0.1, 4.5),
        window.VesperMat({ color: 0x2a323c, metalness: 0.35, roughness: 0.65 })
      );
      floor.position.set(0, 0.05, 0);
      lounge.add(floor);
      // Three walls (open toward hangar)
      for (const [wx, wz, ww, wd] of [
        [0, -2.2, 5.5, 0.12],
        [-2.7, 0, 0.12, 4.5],
        [2.7, 0, 0.12, 4.5],
      ]) {
        const w = new THREE.Mesh(
          new THREE.BoxGeometry(ww, 2.6, wd),
          window.VesperMat({ color: 0x5a6a78, metalness: 0.45, roughness: 0.5, emissive: 0x152028, emissiveIntensity: 0.08 })
        );
        w.position.set(wx, 1.35, wz);
        lounge.add(w);
      }
      const ceil = new THREE.Mesh(
        new THREE.BoxGeometry(5.5, 0.08, 4.5),
        window.VesperMat({ color: 0x4a5560, metalness: 0.5, roughness: 0.45 })
      );
      ceil.position.set(0, 2.65, 0);
      lounge.add(ceil);
      // Ceiling light bar (emissive only)
      const lightBar = new THREE.Mesh(
        new THREE.BoxGeometry(3.5, 0.06, 0.2),
        window.VesperMat({ color: 0xd0e8ff, emissive: 0xa0d0ff, emissiveIntensity: 0.9 })
      );
      lightBar.position.set(0, 2.55, 0);
      lounge.add(lightBar);
      // Bench + table + kettle (lived-in rest)
      const bench = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 0.4, 0.55),
        window.VesperMat({ color: 0x4a5560, metalness: 0.4, roughness: 0.5 })
      );
      bench.position.set(-1.2, 0.35, -1.4);
      lounge.add(bench);
      const table = new THREE.Mesh(
        new THREE.CylinderGeometry(0.55, 0.6, 0.7, 10),
        window.VesperMat({ color: 0x3a4550, metalness: 0.45, roughness: 0.45 })
      );
      table.position.set(0.6, 0.45, -0.8);
      lounge.add(table);
      const kettle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.12, 0.2, 8),
        window.VesperMat({ color: 0xc0d0e0, metalness: 0.7, roughness: 0.25, emissive: 0x406080, emissiveIntensity: 0.4 })
      );
      kettle.position.set(0.6, 0.9, -0.8);
      lounge.add(kettle);
      // Seated crew silhouette (activity density — no AI)
      const sitter = new THREE.Group();
      sitter.name = "dockLoungeSitter";
      const torso = new THREE.Mesh(
        THREE.CapsuleGeometry ? new THREE.CapsuleGeometry(0.14, 0.28, 4, 8) : new THREE.CylinderGeometry(0.14, 0.14, 0.45, 8),
        window.VesperMat({ color: 0xa8b4c0, metalness: 0.25, roughness: 0.55, emissive: 0x304050, emissiveIntensity: 0.1 })
      );
      torso.position.y = 0.55;
      const helm = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 8, 6),
        window.VesperMat({ color: 0xe0e8f0, metalness: 0.3, roughness: 0.3, emissive: 0x406080, emissiveIntensity: 0.18 })
      );
      helm.position.y = 0.95;
      sitter.add(torso, helm);
      sitter.position.set(-1.2, 0.4, -1.4);
      lounge.add(sitter);
      // Wall placard
      const placard = new THREE.Mesh(
        new THREE.PlaneGeometry(1.6, 0.9),
        window.VesperMat({ color: 0x182838, emissive: 0x40a080, emissiveIntensity: 0.5 })
      );
      placard.name = "dockLoungePlacard";
      placard.position.set(0, 1.7, -2.1);
      lounge.add(placard);
      lounge.position.set(HW / 2 + 4.5, 0, 2);
      g.add(lounge);
    }

    // Cargo label stack at bay mouth (ops readable density)
    if (!g.getObjectByName("dockCargoLabelStack")) {
      const stack = new THREE.Group();
      stack.name = "dockCargoLabelStack";
      for (let i = 0; i < 5; i++) {
        const c = new THREE.Mesh(
          new THREE.BoxGeometry(0.7, 0.55, 0.7),
          window.VesperMat({
            color: i % 2 ? 0x6a5030 : 0x405060, roughness: 0.65, metalness: 0.3,
            emissive: 0x152028, emissiveIntensity: 0.08,
          })
        );
        c.position.set((i % 3) * 0.8, 0.3 + Math.floor(i / 3) * 0.55, Math.floor(i / 3) * 0.15);
        stack.add(c);
      }
      const label = new THREE.Mesh(
        new THREE.PlaneGeometry(1.4, 0.35),
        window.VesperMat({ color: 0x102030, emissive: 0xffc060, emissiveIntensity: 0.65, side: THREE.DoubleSide })
      );
      label.name = "dockCargoBayLabel";
      label.position.set(0.8, 1.35, 0.4);
      stack.add(label);
      stack.position.set(-4.5, 0, 10.5);
      g.add(stack);
    }

    // Second bay worker (traffic density — approach readable)
    if (!g.getObjectByName("dockBayWorkerB")) {
      const worker = new THREE.Group();
      worker.name = "dockBayWorkerB";
      const torso = new THREE.Mesh(
        THREE.CapsuleGeometry ? new THREE.CapsuleGeometry(0.15, 0.38, 4, 8) : new THREE.CylinderGeometry(0.15, 0.15, 0.55, 8),
        window.VesperMat({ color: 0xb0b8c0, metalness: 0.25, roughness: 0.55, emissive: 0x304050, emissiveIntensity: 0.1 })
      );
      torso.position.y = 0.72;
      const helm = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 8, 6),
        window.VesperMat({ color: 0xe8f0f8, metalness: 0.3, roughness: 0.3, emissive: 0x406080, emissiveIntensity: 0.2 })
      );
      helm.position.y = 1.2;
      worker.add(torso, helm);
      worker.position.set(1.5, 0, 10.8);
      g.add(worker);
    }

    // Interior work bay — readable desk volume inside hangar (walk densify, no hub)
    if (!g.getObjectByName("dockWorkBay")) {
      const bay = new THREE.Group();
      bay.name = "dockWorkBay";
      const desk = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 0.9, 1.0),
        window.VesperMat({ color: 0x3a4550, metalness: 0.45, roughness: 0.45, emissive: 0x183048, emissiveIntensity: 0.18 })
      );
      desk.position.set(0, 0.5, 0);
      bay.add(desk);
      const screen = new THREE.Mesh(
        new THREE.PlaneGeometry(1.6, 0.7),
        window.VesperMat({ color: 0x80d0ff, emissive: 0x40a0ff, emissiveIntensity: 0.75 })
      );
      screen.name = "dockWorkBayScreen";
      screen.position.set(0, 1.15, 0.52);
      bay.add(screen);
      // Tool pegboard
      const board = new THREE.Mesh(
        new THREE.BoxGeometry(2.0, 1.2, 0.08),
        window.VesperMat({ color: 0x4a5560, metalness: 0.5, roughness: 0.45 })
      );
      board.position.set(0, 1.5, -0.7);
      bay.add(board);
      for (let i = 0; i < 5; i++) {
        const tool = new THREE.Mesh(
          new THREE.CylinderGeometry(0.03, 0.03, 0.55, 5),
          window.VesperMat({ color: 0x80a0b0, metalness: 0.55, roughness: 0.35 })
        );
        tool.position.set(-0.7 + i * 0.35, 1.35, -0.55);
        bay.add(tool);
      }
      // Parts trays
      for (let i = 0; i < 3; i++) {
        const tray = new THREE.Mesh(
          new THREE.BoxGeometry(0.4, 0.08, 0.35),
          window.VesperMat({ color: 0xc07040, metalness: 0.35, roughness: 0.5, emissive: 0x401800, emissiveIntensity: 0.12 })
        );
        tray.position.set(-0.7 + i * 0.7, 1.0, 0.1);
        bay.add(tray);
      }
      const lamp = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 8, 6),
        window.VesperMat({ color: 0xffe8c0, emissive: 0xffa040, emissiveIntensity: 0.85 })
      );
      lamp.name = "dockWorkBayLamp";
      lamp.position.set(0, 2.1, 0);
      bay.add(lamp);
      bay.position.set(-4.5, 0, -HD / 2 + 5);
      g.add(bay);
    }

    // Footpath wear linking market plaza ↔ lounge ↔ work bay (lived-in traffic, no hub)
    if (!g.getObjectByName("dockLivedInPath")) {
      const path = new THREE.Group();
      path.name = "dockLivedInPath";
      // Plaza (6.5,11.5) → hangar mouth → lounge (+X) → work bay (-X interior)
      const segs = [
        // plaza → mouth
        [6.5, 11.5, 3.0, 10.0, 5],
        // mouth → lounge approach
        [3.0, 10.0, HW / 2 + 2, 4.0, 4],
        // mouth → work bay interior
        [2.0, 9.5, -3.5, -HD / 2 + 6, 5],
      ];
      for (const [x0, z0, x1, z1, n] of segs) {
        for (let i = 0; i < n; i++) {
          const t = i / Math.max(1, n - 1);
          const wear = new THREE.Mesh(
            new THREE.BoxGeometry(0.45, 0.02, 0.9),
            window.VesperMat({ color: 0x2a2824, roughness: 0.95, metalness: 0.05, transparent: true, opacity: 0.5 })
          );
          wear.position.set(x0 + (x1 - x0) * t, 0.05, z0 + (z1 - z0) * t);
          wear.rotation.y = Math.atan2(x1 - x0, z1 - z0);
          path.add(wear);
          if (i % 2 === 0) {
            const ch = new THREE.Mesh(
              new THREE.BoxGeometry(0.35, 0.025, 0.12),
              window.VesperMat({ color: 0xffe080, emissive: 0xc0a020, emissiveIntensity: 0.4 })
            );
            ch.position.set(x0 + (x1 - x0) * t, 0.07, z0 + (z1 - z0) * t);
            ch.rotation.y = wear.rotation.y;
            path.add(ch);
          }
        }
      }
      g.add(path);
    }

    attachDockTraffic(g);

    // Interior bay status banners (readable activity — chase→walk, no hub)
    if (!g.getObjectByName("dockBayStatusBanner")) {
      for (let i = 0; i < 3; i++) {
        const ban = new THREE.Mesh(
          new THREE.PlaneGeometry(1.8, 0.45),
          window.VesperMat({
            color: 0x102030,
            emissive: [0x40ff90, 0xffc060, 0x60c0ff][i],
            emissiveIntensity: 0.7,
            side: THREE.DoubleSide,
          })
        );
        ban.name = "dockBayStatusBanner";
        ban.position.set(-5 + i * 3.2, 3.6, -2);
        g.add(ban);
      }
    }

    // Market cafe stools (lived-in plaza occupancy)
    if (!g.getObjectByName("dockMarketStool")) {
      for (let i = 0; i < 2; i++) {
        const stool = new THREE.Mesh(
          new THREE.CylinderGeometry(0.22, 0.25, 0.55, 8),
          window.VesperMat({ color: 0x4a5560, metalness: 0.4, roughness: 0.5 })
        );
        stool.name = "dockMarketStool";
        stool.position.set(5.5 + i * 0.7, 0.3, 12.5);
        g.add(stool);
      }
    }

    // Chalk mural / notice wall outside hangar (lived-in culture cue)
    if (!g.getObjectByName("dockChalkMural")) {
      const mural = new THREE.Mesh(
        new THREE.PlaneGeometry(3.2, 1.8),
        window.VesperMat({ color: 0x2a323c, emissive: 0x40a080, emissiveIntensity: 0.35, side: THREE.DoubleSide })
      );
      mural.name = "dockChalkMural";
      mural.position.set(-HW / 2 - 0.15, 1.8, 2);
      mural.rotation.y = Math.PI / 2;
      g.add(mural);
    }
    // Spare tire lean at pad (NMS clutter)
    if (!g.getObjectByName("dockSpareTire")) {
      const tire = new THREE.Mesh(
        new THREE.TorusGeometry(0.45, 0.12, 8, 16),
        window.VesperMat({ color: 0x1a1e24, metalness: 0.35, roughness: 0.6 })
      );
      tire.name = "dockSpareTire";
      tire.rotation.x = Math.PI / 2;
      tire.rotation.z = 0.4;
      tire.position.set(7, 0.45, 13);
      g.add(tire);
    }

    // Cargo mule parked at bay mouth (activity densify — no PointLight)
    if (!g.getObjectByName("dockCargoMule")) {
      const mule = new THREE.Group();
      mule.name = "dockCargoMule";
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 0.5, 1.0),
        window.VesperMat({ color: 0x6a7a88, metalness: 0.45, roughness: 0.45, emissive: 0x152028, emissiveIntensity: 0.1 })
      );
      body.position.y = 0.55;
      mule.add(body);
      for (const [wx, wz] of [[-0.6, 0.45], [0.6, 0.45], [-0.6, -0.45], [0.6, -0.45]]) {
        const wh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.25, 0.25, 0.18, 8),
          window.VesperMat({ color: 0x202428, metalness: 0.5, roughness: 0.45 })
        );
        wh.rotation.z = Math.PI / 2;
        wh.position.set(wx, 0.25, wz);
        mule.add(wh);
      }
      const bed = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.35, 0.85),
        window.VesperMat({ color: 0x6a5030, roughness: 0.65, metalness: 0.25 })
      );
      bed.position.set(-0.3, 0.95, 0);
      mule.add(bed);
      mule.position.set(4, 0, 10.5);
      g.add(mule);
    }

    // Hazard cone row at pad edge (ops safety — approach readable)
    if (!g.getObjectByName("dockHazardCone")) {
      for (let i = 0; i < 5; i++) {
        const cone = new THREE.Mesh(
          new THREE.ConeGeometry(0.22, 0.55, 8),
          window.VesperMat({ color: 0xff8020, metalness: 0.2, roughness: 0.55, emissive: 0xa04010, emissiveIntensity: 0.25 })
        );
        cone.name = "dockHazardCone";
        cone.position.set(-6 + i * 1.1, 0.3, 15.5);
        g.add(cone);
      }
    }
    // Extinguisher cabinet on hangar wall (lived-in safety)
    if (!g.getObjectByName("dockExtinguisherCab")) {
      const cab = new THREE.Group();
      cab.name = "dockExtinguisherCab";
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.9, 0.25),
        window.VesperMat({ color: 0xc02020, metalness: 0.4, roughness: 0.45, emissive: 0x400808, emissiveIntensity: 0.15 })
      );
      box.position.y = 1.1;
      const bottle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.12, 0.55, 8),
        window.VesperMat({ color: 0xe0e0e0, metalness: 0.65, roughness: 0.3 })
      );
      bottle.position.set(0, 1.05, 0.05);
      cab.add(box, bottle);
      cab.position.set(-HW / 2 + 0.4, 0, -2);
      g.add(cab);
    }

    // Comm tower (approach silhouette — lived-in ops)
    if (!g.getObjectByName("dockCommTower")) {
      const tower = new THREE.Group();
      tower.name = "dockCommTower";
      const mast = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.12, 5.5, 6),
        window.VesperMat({ color: 0x5a6570, metalness: 0.6, roughness: 0.35 })
      );
      mast.position.y = 2.75;
      tower.add(mast);
      const dish = new THREE.Mesh(
        new THREE.SphereGeometry(0.7, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55),
        window.VesperMat({ color: 0xc8d0d8, metalness: 0.7, roughness: 0.22, emissive: 0x203040, emissiveIntensity: 0.2 })
      );
      dish.position.set(0, 5.2, 0);
      dish.rotation.x = 0.5;
      tower.add(dish);
      const blink = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 6, 5),
        window.VesperMat({ color: 0xff4040, emissive: 0xff2020, emissiveIntensity: 0.9 })
      );
      blink.name = "dockCommTowerBlink";
      blink.position.set(0, 5.8, 0);
      tower.add(blink);
      tower.position.set(11, 0, 8);
      g.add(tower);
    }

    // Coolant tank cluster (ops footprint)
    if (!g.getObjectByName("dockCoolantTanks")) {
      const cluster = new THREE.Group();
      cluster.name = "dockCoolantTanks";
      for (let i = 0; i < 3; i++) {
        const tank = new THREE.Mesh(
          new THREE.CylinderGeometry(0.55, 0.6, 1.8, 10),
          window.VesperMat({ color: 0x4a6070, metalness: 0.55, roughness: 0.35, emissive: 0x102028, emissiveIntensity: 0.1 })
        );
        tank.position.set(i * 1.3, 0.95, 0);
        cluster.add(tank);
        const cap = new THREE.Mesh(
          new THREE.SphereGeometry(0.35, 8, 6),
          window.VesperMat({ color: 0x70c8ff, metalness: 0.4, roughness: 0.3, emissive: 0x2060a0, emissiveIntensity: 0.35 })
        );
        cap.position.set(i * 1.3, 1.95, 0);
        cluster.add(cap);
      }
      cluster.position.set(-10, 0, 8);
      g.add(cluster);
    }

    // Pad solar array (power activity silhouette — Stellaris/NMS cue)
    if (!g.getObjectByName("dockSolarArray")) {
      const arr = new THREE.Group();
      arr.name = "dockSolarArray";
      const mast = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.1, 3.2, 6),
        window.VesperMat({ color: 0x506070, metalness: 0.55, roughness: 0.4 })
      );
      mast.position.y = 1.6;
      arr.add(mast);
      for (let i = 0; i < 3; i++) {
        const panel = new THREE.Mesh(
          new THREE.BoxGeometry(2.2, 0.06, 1.0),
          window.VesperMat({ color: 0x1a3060, metalness: 0.55, roughness: 0.25, emissive: 0x102848, emissiveIntensity: 0.35 })
        );
        panel.position.set(0, 2.4 + i * 0.15, 0.3);
        panel.rotation.x = -0.45;
        panel.rotation.z = (i - 1) * 0.08;
        arr.add(panel);
      }
      arr.position.set(10, 0, 14);
      g.add(arr);
    }

    // Parts cart parked at work bay (traffic densify)
    if (!g.getObjectByName("dockPartsCart")) {
      const cart = new THREE.Group();
      cart.name = "dockPartsCart";
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(1.3, 0.55, 0.8),
        window.VesperMat({ color: 0x5a6a78, metalness: 0.5, roughness: 0.4 })
      );
      base.position.y = 0.4;
      cart.add(base);
      for (const wx of [-0.45, 0.45]) {
        const wh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.16, 0.16, 0.12, 8),
          window.VesperMat({ color: 0x202428, metalness: 0.55, roughness: 0.4 })
        );
        wh.rotation.z = Math.PI / 2;
        wh.position.set(wx, 0.16, 0.35);
        cart.add(wh);
      }
      const bin = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.45, 0.55),
        window.VesperMat({ color: 0xc07040, metalness: 0.35, roughness: 0.5, emissive: 0x401800, emissiveIntensity: 0.12 })
      );
      bin.position.set(0, 0.95, 0);
      cart.add(bin);
      cart.position.set(-3.5, 0, -HD / 2 + 6.5);
      g.add(cart);
    }

    // Approach lead-in light row (pad ops — emissive only)
    if (!g.getObjectByName("dockApproachLeadIn")) {
      for (let i = 0; i < 6; i++) {
        const lite = new THREE.Mesh(
          new THREE.SphereGeometry(0.1, 6, 5),
          window.VesperMat({ color: 0x40ffc0, emissive: 0x20c090, emissiveIntensity: 0.8 })
        );
        lite.name = "dockApproachLeadIn";
        lite.position.set(-1.5 + (i % 2) * 3.0, 0.15, 16 + Math.floor(i / 2) * 1.4);
        g.add(lite);
      }
    }

    // Scrap / parts heap near crane (lived-in yard clutter)
    if (!g.getObjectByName("dockScrapHeap")) {
      const heap = new THREE.Group();
      heap.name = "dockScrapHeap";
      for (let i = 0; i < 7; i++) {
        const bit = new THREE.Mesh(
          i % 2
            ? new THREE.BoxGeometry(0.5 + (i % 3) * 0.15, 0.25, 0.4)
            : new THREE.CylinderGeometry(0.15, 0.18, 0.4, 6),
          window.VesperMat({
            color: i % 3 === 0 ? 0x6a5030 : i % 3 === 1 ? 0x506070 : 0x4a5560,
            metalness: 0.45, roughness: 0.55, emissive: 0x152028, emissiveIntensity: 0.08,
          })
        );
        bit.position.set((i % 3) * 0.55, 0.2 + Math.floor(i / 3) * 0.28, Math.floor(i / 3) * 0.35);
        bit.rotation.y = i * 0.4;
        heap.add(bit);
      }
      heap.position.set(8.5, 0, 10);
      g.add(heap);
    }

    // Fuel island — walkable ops volume at pad edge (no hub inflate)
    if (!g.getObjectByName("dockFuelIsland")) {
      const island = new THREE.Group();
      island.name = "dockFuelIsland";
      const pad = new THREE.Mesh(
        new THREE.CylinderGeometry(1.8, 1.9, 0.15, 12),
        window.VesperMat({ color: 0x3a4550, metalness: 0.45, roughness: 0.5, emissive: 0x152028, emissiveIntensity: 0.1 })
      );
      pad.position.y = 0.08;
      island.add(pad);
      const pump = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 1.6, 0.5),
        window.VesperMat({ color: 0xc07040, metalness: 0.4, roughness: 0.45, emissive: 0x401800, emissiveIntensity: 0.15 })
      );
      pump.position.set(0, 0.95, 0);
      island.add(pump);
      const hose = new THREE.Mesh(
        new THREE.TorusGeometry(0.55, 0.04, 5, 12, Math.PI * 1.3),
        window.VesperMat({ color: 0x2a3540, metalness: 0.25, roughness: 0.6 })
      );
      hose.position.set(0.5, 0.5, 0.2);
      island.add(hose);
      const lamp = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 8, 6),
        window.VesperMat({ color: 0xffe080, emissive: 0xffc040, emissiveIntensity: 0.85 })
      );
      lamp.name = "dockFuelIslandLamp";
      lamp.position.set(0, 1.9, 0);
      island.add(lamp);
      const sign = new THREE.Mesh(
        new THREE.PlaneGeometry(0.9, 0.35),
        window.VesperMat({ color: 0x102030, emissive: 0xffc060, emissiveIntensity: 0.7, side: THREE.DoubleSide })
      );
      sign.position.set(0, 1.4, 0.3);
      island.add(sign);
      island.position.set(-9, 0, 12);
      g.add(island);
    }

    // Bay zone floor marks (A/B/C — lived-in ops, chase→walk readable)
    if (!g.getObjectByName("dockBayZoneMark")) {
      for (let i = 0; i < 3; i++) {
        const mark = new THREE.Mesh(
          new THREE.PlaneGeometry(1.2, 0.9),
          window.VesperMat({
            color: 0x102030,
            emissive: [0x40c0ff, 0xffc060, 0x40ff90][i],
            emissiveIntensity: 0.55,
            side: THREE.DoubleSide,
          })
        );
        mark.name = "dockBayZoneMark";
        mark.rotation.x = -Math.PI / 2;
        mark.position.set(-4 + i * 4, 0.12, -2);
        g.add(mark);
      }
    }

    // Lean ops annex — always-on walkable room (phone misses desktop mezz ops deck)
    if (!g.getObjectByName("vesperOpsDeck") && !g.getObjectByName("dockOpsAnnexLean")) {
      const annex = new THREE.Group();
      annex.name = "dockOpsAnnexLean";
      const floor = new THREE.Mesh(
        new THREE.BoxGeometry(6, 0.1, 5),
        window.VesperMat({ color: 0x2a323c, metalness: 0.35, roughness: 0.65 })
      );
      floor.position.set(0, 0.05, 0);
      annex.add(floor);
      for (const [wx, wz, ww, wd] of [[0, -2.4, 6, 0.12], [-2.95, 0, 0.12, 5], [2.95, 0, 0.12, 5]]) {
        const w = new THREE.Mesh(
          new THREE.BoxGeometry(ww, 2.4, wd),
          window.VesperMat({ color: 0x5a6a78, metalness: 0.45, roughness: 0.5, emissive: 0x152028, emissiveIntensity: 0.08 })
        );
        w.position.set(wx, 1.25, wz);
        annex.add(w);
      }
      const ceil = new THREE.Mesh(
        new THREE.BoxGeometry(6, 0.08, 5),
        window.VesperMat({ color: 0x4a5560, metalness: 0.5, roughness: 0.45 })
      );
      ceil.position.set(0, 2.45, 0);
      annex.add(ceil);
      const cons = new THREE.Mesh(
        new THREE.BoxGeometry(2.0, 0.9, 0.7),
        window.VesperMat({ color: 0x203040, emissive: 0x3080c0, emissiveIntensity: 0.4 })
      );
      cons.position.set(0, 0.55, -1.6);
      annex.add(cons);
      const screen = new THREE.Mesh(
        new THREE.PlaneGeometry(1.6, 0.6),
        window.VesperMat({ color: 0x80d0ff, emissive: 0x40a0ff, emissiveIntensity: 0.75 })
      );
      screen.name = "dockOpsAnnexScreen";
      screen.position.set(0, 1.1, -1.2);
      annex.add(screen);
      const light = new THREE.Mesh(
        new THREE.BoxGeometry(3.5, 0.06, 0.18),
        window.VesperMat({ color: 0xd0e8ff, emissive: 0xa0d0ff, emissiveIntensity: 0.9 })
      );
      light.position.set(0, 2.35, 0);
      annex.add(light);
      annex.position.set(HW / 2 + 5, 0, -2);
      g.add(annex);
    }

    // Tool crate stack near scrap (yard densify)
    if (!g.getObjectByName("dockToolCrateStack")) {
      const stack = new THREE.Group();
      stack.name = "dockToolCrateStack";
      for (let i = 0; i < 4; i++) {
        const crate = new THREE.Mesh(
          new THREE.BoxGeometry(0.7, 0.45, 0.55),
          window.VesperMat({
            color: i % 2 ? 0x6a5030 : 0x4a6070,
            metalness: 0.35, roughness: 0.55,
            emissive: 0x152028, emissiveIntensity: 0.08,
          })
        );
        crate.position.set((i % 2) * 0.75, 0.25 + Math.floor(i / 2) * 0.48, Math.floor(i / 2) * 0.2);
        crate.rotation.y = i * 0.15;
        stack.add(crate);
      }
      stack.position.set(9.5, 0, 11.5);
      g.add(stack);
    }

    // Floodlight mast at pad corner (approach/ops silhouette)
    if (!g.getObjectByName("dockFloodMast")) {
      const mast = new THREE.Group();
      mast.name = "dockFloodMast";
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.1, 4.8, 6),
        window.VesperMat({ color: 0x5a6570, metalness: 0.55, roughness: 0.4 })
      );
      pole.position.y = 2.4;
      mast.add(pole);
      const arm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 1.4, 5),
        window.VesperMat({ color: 0x4a5560, metalness: 0.5, roughness: 0.4 })
      );
      arm.rotation.z = Math.PI / 2;
      arm.position.set(0.6, 4.5, 0);
      mast.add(arm);
      const lamp = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 8, 6),
        window.VesperMat({ color: 0xfff0d0, emissive: 0xffe080, emissiveIntensity: 0.95 })
      );
      lamp.name = "dockFloodLamp";
      lamp.position.set(1.2, 4.45, 0);
      mast.add(lamp);
      mast.position.set(-8, 0, 15);
      g.add(mast);
    }

    // Hose reel + life-support tank (pad ops densify — lived-in, no hub inflate)
    if (!g.getObjectByName("dockHoseReel")) {
      const reel = new THREE.Group();
      reel.name = "dockHoseReel";
      const stand = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.12, 1.1, 6),
        window.VesperMat({ color: 0x4a5560, metalness: 0.55, roughness: 0.4 })
      );
      stand.position.y = 0.55;
      reel.add(stand);
      const drum = new THREE.Mesh(
        new THREE.CylinderGeometry(0.45, 0.45, 0.35, 12),
        window.VesperMat({ color: 0xc07040, metalness: 0.4, roughness: 0.45, emissive: 0x401800, emissiveIntensity: 0.12 })
      );
      drum.rotation.z = Math.PI / 2;
      drum.position.set(0, 0.95, 0);
      reel.add(drum);
      const hose = new THREE.Mesh(
        new THREE.TorusGeometry(0.38, 0.035, 5, 14, Math.PI * 1.6),
        window.VesperMat({ color: 0x2a3540, metalness: 0.25, roughness: 0.6 })
      );
      hose.position.set(0.15, 0.95, 0.1);
      reel.add(hose);
      reel.position.set(6.5, 0, 8.5);
      g.add(reel);
    }
    if (!g.getObjectByName("dockLifeSupportTank")) {
      const ls = new THREE.Group();
      ls.name = "dockLifeSupportTank";
      const tank = new THREE.Mesh(
        new THREE.CylinderGeometry(0.7, 0.75, 2.4, 12),
        window.VesperMat({ color: 0x7a8a98, metalness: 0.55, roughness: 0.35, emissive: 0x152028, emissiveIntensity: 0.1 })
      );
      tank.position.y = 1.25;
      ls.add(tank);
      const band = new THREE.Mesh(
        new THREE.TorusGeometry(0.72, 0.04, 6, 16),
        window.VesperMat({ color: 0x40c0ff, metalness: 0.45, roughness: 0.3, emissive: 0x2060a0, emissiveIntensity: 0.4 })
      );
      band.rotation.x = Math.PI / 2;
      band.position.y = 1.4;
      ls.add(band);
      const valve = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.1, 0.35, 6),
        window.VesperMat({ color: 0xc0c8d0, metalness: 0.7, roughness: 0.28 })
      );
      valve.position.set(0.75, 1.8, 0);
      valve.rotation.z = Math.PI / 2;
      ls.add(valve);
      ls.position.set(-11, 0, 4);
      g.add(ls);
    }
    // Crew locker row on hangar exterior (walk densify)
    if (!g.getObjectByName("dockCrewLocker")) {
      for (let i = 0; i < 3; i++) {
        const locker = new THREE.Mesh(
          new THREE.BoxGeometry(0.7, 1.6, 0.45),
          window.VesperMat({
            color: i === 1 ? 0x3a6070 : 0x4a5560,
            metalness: 0.5, roughness: 0.42,
            emissive: i === 1 ? 0x183040 : 0x152028,
            emissiveIntensity: 0.12,
          })
        );
        locker.name = "dockCrewLocker";
        locker.position.set(HW / 2 + 0.4, 0.85, -4 + i * 1.0);
        g.add(locker);
        const handle = new THREE.Mesh(
          new THREE.CylinderGeometry(0.03, 0.03, 0.25, 5),
          window.VesperMat({ color: 0xc0c8d0, metalness: 0.7, roughness: 0.3 })
        );
        handle.rotation.z = Math.PI / 2;
        handle.position.set(HW / 2 + 0.65, 0.9, -4 + i * 1.0);
        g.add(handle);
      }
    }
    // Pad edge safety rail (approach silhouette)
    if (!g.getObjectByName("dockPadRail")) {
      const rail = new THREE.Group();
      rail.name = "dockPadRail";
      for (let i = 0; i < 5; i++) {
        const post = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.06, 1.0, 5),
          window.VesperMat({ color: 0x8090a0, metalness: 0.6, roughness: 0.35 })
        );
        post.position.set(-5 + i * 2.5, 0.55, 17.2);
        rail.add(post);
      }
      const barGeo = new THREE.CylinderGeometry(0.035, 0.035, 10.2, 5);
      barGeo.rotateZ(Math.PI / 2);
      const bar = new THREE.Mesh(
        barGeo,
        window.VesperMat({ color: 0xffc060, metalness: 0.45, roughness: 0.4, emissive: 0x805020, emissiveIntensity: 0.25 })
      );
      bar.position.set(0, 1.0, 17.2);
      rail.add(bar);
      g.add(rail);
    }

    // Pad marker sits at local (0, ~0, 12). Park that under the eye
    // (surface-root origin) and drop the shell so the eye is above the
    // floor, not inside the slab. Hangar mouth then lies along -Z.
    const deckYSeat = groundYOf(surfaceRoot);
    g.position.set(0, deckYSeat - 0.14, -12);
    surfaceRoot.add(g);
    trackLive(g);
    return g;
  }


  function makeTrafficWalker(suitMat, helmMat, darkMat) {
    const fig = new THREE.Group();
    fig.name = "dockTrafficWalker";
    const torso = new THREE.Mesh(
      THREE.CapsuleGeometry
        ? new THREE.CapsuleGeometry(0.15, 0.34, 3, 6)
        : new THREE.CylinderGeometry(0.15, 0.16, 0.48, 6),
      suitMat
    );
    torso.position.y = 0.92;
    const helm = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 5), helmMat);
    helm.position.y = 1.32;
    const visor = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 5, 4),
      window.VesperMat({
        color: 0x9ad8ff, emissive: 0x40b0ff, emissiveIntensity: 0.5,
        metalness: 0.15, roughness: 0.25,
      })
    );
    visor.position.set(0, 1.32, 0.09);
    const legs = new THREE.Group();
    for (const sx of [-0.07, 0.07]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.46, 5), darkMat);
      leg.position.set(sx, 0.26, 0);
      leg.userData.side = sx > 0 ? 1 : -1;
      legs.add(leg);
    }
    fig.add(torso, helm, visor, legs);
    fig.userData.legs = legs;
    return fig;
  }

  function attachDockTraffic(dock) {
    if (!dock || dock.getObjectByName("dockTraffic")) return;
    const coarse = !!(typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches);
    const wrap = new THREE.Group();
    wrap.name = "dockTraffic";
    const suitMats = [
      window.VesperMat({ color: 0xc5ced6, metalness: 0.28, roughness: 0.52, emissive: 0x203040, emissiveIntensity: 0.12 }),
      window.VesperMat({ color: 0xb09068, metalness: 0.22, roughness: 0.55, emissive: 0x302010, emissiveIntensity: 0.1 }),
      window.VesperMat({ color: 0x8aa4b8, metalness: 0.3, roughness: 0.48, emissive: 0x102030, emissiveIntensity: 0.12 }),
      window.VesperMat({ color: 0xd0c4a8, metalness: 0.2, roughness: 0.55, emissive: 0x282018, emissiveIntensity: 0.08 }),
    ];
    const helmMat = window.VesperMat({ color: 0xe8eef4, metalness: 0.35, roughness: 0.28, emissive: 0x406080, emissiveIntensity: 0.22 });
    const darkMat = window.VesperMat({ color: 0x2a3038, metalness: 0.4, roughness: 0.5 });
    // Closed loops between pad mouth, cargo, work bay, market front, lounge approach.
    // Local to the dock group (before the spawn offset).
    const routes = [
      [[0.2, 12.6], [-4.0, 10.4], [-4.2, -4.4], [0.2, 12.6]],
      [[5.6, 12.8], [10.6, 9.4], [13.0, 4.8], [10.6, 9.4], [2.2, 11.4]],
      [[6.8, 5.4], [-3.4, 9.8], [6.4, 12.7], [6.8, 5.4]],
    ];
    if (!coarse) routes.push([[2.2, 1.5], [-2.4, 6.2], [4.2, 8.4], [2.2, 1.5]]);
    const jack = dock.getObjectByName("dockPalletJack");
    routes.forEach((pts, i) => {
      const fig = makeTrafficWalker(suitMats[i % suitMats.length], helmMat, darkMat);
      fig.position.set(pts[0][0], 0, pts[0][1]);
      wrap.add(fig);
      trafficAgents.push({
        mesh: fig,
        pts: pts,
        seg: 0,
        t: (i * 0.23) % 1,
        speed: 1.05 + i * 0.12,
        dwell: 0,
        phase: i * 1.7,
        jack: (i === 0 ? jack : null),
      });
    });
    dock.add(wrap);
  }

  function tickDockTraffic(dt) {
    const step = dt || 0.016;
    for (let i = trafficAgents.length - 1; i >= 0; i--) {
      const a = trafficAgents[i];
      if (!a.mesh || !a.mesh.parent) { trafficAgents.splice(i, 1); continue; }
      const legs = a.mesh.userData.legs;
      if (a.dwell > 0) {
        a.dwell -= step;
        a.mesh.position.y = 0;
        if (legs) {
          for (let li = 0; li < legs.children.length; li++) legs.children[li].rotation.x = 0;
        }
        continue;
      }
      const pts = a.pts;
      const seg = a.seg % pts.length;
      const nxt = (seg + 1) % pts.length;
      const ax = pts[seg][0], az = pts[seg][1];
      const bx = pts[nxt][0], bz = pts[nxt][1];
      const dx = bx - ax, dz = bz - az;
      const len = Math.hypot(dx, dz) || 0.001;
      a.t += (a.speed * step) / len;
      a.phase += step * 7.5;
      if (a.t >= 1) {
        a.t = 0;
        a.seg = nxt;
        a.dwell = 0.85 + (i % 3) * 0.35;
        a.mesh.position.set(bx, 0, bz);
        if (a.jack && a.jack.parent) {
          const jyaw = a.mesh.rotation.y;
          a.jack.position.x = bx - Math.sin(jyaw) * 0.55;
          a.jack.position.z = bz - Math.cos(jyaw) * 0.55;
        }
        continue;
      }
      const yaw = Math.atan2(dx, dz);
      a.mesh.position.set(ax + dx * a.t, Math.abs(Math.sin(a.phase)) * 0.025, az + dz * a.t);
      a.mesh.rotation.y = yaw;
      if (a.jack && a.jack.parent) {
        a.jack.position.x = a.mesh.position.x - Math.sin(yaw) * 0.55;
        a.jack.position.z = a.mesh.position.z - Math.cos(yaw) * 0.55;
        a.jack.rotation.y = yaw;
      }
      if (legs) {
        const swing = Math.sin(a.phase) * 0.55;
        for (let li = 0; li < legs.children.length; li++) {
          const leg = legs.children[li];
          leg.rotation.x = swing * (leg.userData.side || 1);
        }
      }
    }
  }

  function trafficState() {
    const out = [];
    for (let i = 0; i < trafficAgents.length; i++) {
      const a = trafficAgents[i];
      if (!a.mesh || !a.mesh.parent) continue;
      out.push({
        x: Math.round(a.mesh.position.x * 100) / 100,
        z: Math.round(a.mesh.position.z * 100) / 100,
        seg: a.seg,
      });
    }
    return out;
  }

  function attachShipCabin(surfaceRoot, worldPos) {
    if (!surfaceRoot || !THREE) return null;
    let old = null;
    surfaceRoot.traverse((ch) => {
      if (ch.name === "vesperShipCabin") old = ch;
    });
    if (old && old.parent) old.parent.remove(old);
    const g = new THREE.Group();
    g.name = "vesperShipCabin";
    // Full-size walkable cabin (cockpit + mid + hatch) — Bethesda/ME corridor scale vs PERSON_EYE
    const mats = {
      hull: window.VesperMat({ color: 0x7a8a9a, metalness: 0.78, roughness: 0.28, emissive: 0x102028, emissiveIntensity: 0.14, envMapIntensity: 1.1 }),
      floor: window.VesperMat({ color: 0x323a44, metalness: 0.55, roughness: 0.48, envMapIntensity: 0.7 }),
      glass: window.VesperMat({ color: 0x70d0ff, metalness: 0.35, roughness: 0.08, emissive: 0x2080c0, emissiveIntensity: 0.55, transparent: true, opacity: 0.5, envMapIntensity: 1.4 }),
    };
    
    // AAA-ish cabin deck grit (thrift on coarse)
    try {
      const coarseCab = !!(typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches);
      if (!coarseCab) {
        const fc = document.createElement("canvas");
        fc.width = 256; fc.height = 512;
        const fg = fc.getContext("2d");
        fg.fillStyle = "#323a44"; fg.fillRect(0, 0, 256, 512);
        for (let i = 0; i < 600; i++) {
          fg.fillStyle = "rgba(0,0,0," + (0.04 + Math.random() * 0.1) + ")";
          fg.fillRect(Math.random() * 256, Math.random() * 512, 2, 2);
        }
        fg.strokeStyle = "rgba(100,180,255,0.2)";
        for (let y = 32; y < 512; y += 64) {
          fg.beginPath(); fg.moveTo(0, y); fg.lineTo(256, y); fg.stroke();
        }
        const ftex = new THREE.CanvasTexture(fc);
        ftex.name = "cabinFloorCanvas";
        ftex.colorSpace = THREE.SRGBColorSpace || THREE.sRGBEncoding;
        ftex.wrapS = ftex.wrapT = THREE.RepeatWrapping;
        ftex.repeat.set(1, 2);
        mats.floor = mats.floor.clone();
        mats.floor.map = ftex;
        mats.floor.color.setHex(0xffffff);
        mats.floor.roughness = 0.62;
      }
    } catch (_) {}
    const floor = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.1, 16), mats.floor);
    floor.position.set(0, 0.05, 0);
    g.add(floor);
    // Hull liner — concave arch overhead (DoubleSide so the walk aisle sees the inside).
    {
      const coarseCabVault = !!(typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches);
      const linerMat = mats.hull.clone();
      linerMat.side = THREE.DoubleSide;
      linerMat.roughness = 0.55;
      linerMat.metalness = 0.45;
      const liner = new THREE.Mesh(
        new THREE.CylinderGeometry(2.6, 2.6, 15.2, coarseCabVault ? 8 : 14, 1, true, Math.PI, Math.PI),
        linerMat
      );
      liner.name = "cabinHullLiner";
      liner.rotation.x = Math.PI / 2;
      // Spring near wall-top (~2.7) so the arch does not cut headroom at the lockers.
      liner.position.set(0, 2.5, 0);
      g.add(liner);
    }
    for (const side of [-1, 1]) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.8, 16), mats.hull);
      wall.position.set(side * 2.7, 1.3, 0);
      g.add(wall);
    }
    // Two jambs, open to the floor. The eye is ~0.16u; a sill at the torus
    // would stop you. The ring stays as the hatch cue.
    const jambW = 1.55;
    for (const side of [-1, 1]) {
      const jamb = new THREE.Mesh(new THREE.BoxGeometry(jambW, 2.5, 0.12), mats.hull);
      jamb.name = "cabinHatchJamb";
      jamb.position.set(side * (1.2 + jambW / 2), 1.3, -6);
      g.add(jamb);
    }
    // Cockpit blister (walk forward)
    const cockFloor = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.1, 3.2), mats.floor);
    cockFloor.position.set(0, 0.05, 7.2);
    g.add(cockFloor);
    const canopy = new THREE.Mesh(new THREE.SphereGeometry(1.8, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), mats.glass);
    canopy.position.set(0, 1.4, 7.5);
    g.add(canopy);
    const seat = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.55, 0.7),
      window.VesperMat({ color: 0x304050, roughness: 0.7 })
    );
    seat.position.set(0, 0.4, 6.6);
    g.add(seat);
    const dash = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.45, 0.5),
      window.VesperMat({ color: 0x203040, emissive: 0x40a0ff, emissiveIntensity: 0.5 })
    );
    dash.position.set(0, 0.85, 7.4);
    g.add(dash);
    // Hatch ring (reboard cue — aft)
    const hatch = new THREE.Mesh(
      new THREE.TorusGeometry(0.85, 0.08, 8, 20),
      window.VesperMat({ color: 0x70e0c0, emissive: 0x20a080, emissiveIntensity: 0.55, metalness: 0.5, roughness: 0.3 })
    );
    hatch.position.set(0, 1.1, -5.7);
    g.add(hatch);
    for (let i = 0; i < 4; i++) {
      const light = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.06, 0.12),
        window.VesperMat({ color: 0xd0e8ff, emissive: 0xa0d0ff, emissiveIntensity: 0.9 })
      );
      light.position.set(0, 3.35, -4 + i * 2.5);
      g.add(light);
    }
    const fill = window.VesperNoLight(0xc0e0ff, 0.65, 14, 2);
    fill.position.set(0, 2.1, 0);
    g.add(fill);
    // Berth alcove (port)
    const bunk = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.4, 2.2),
      window.VesperMat({ color: 0x4a5560, roughness: 0.75 })
    );
    bunk.position.set(-1.7, 0.35, -2);
    g.add(bunk);
    const pillow = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.14, 0.45),
      window.VesperMat({ color: 0xc8d0d8, roughness: 0.85 })
    );
    pillow.position.set(-1.7, 0.62, -2.7);
    g.add(pillow);
    // Galley stub (starboard)
    const galley = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 1.0, 0.55),
      window.VesperMat({ color: 0x3a4550, metalness: 0.45, roughness: 0.45, emissive: 0x183040, emissiveIntensity: 0.2 })
    );
    galley.position.set(1.7, 0.6, -1.5);
    g.add(galley);
    const kettle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.14, 0.22, 8),
      window.VesperMat({ color: 0xa0b0c0, metalness: 0.6, roughness: 0.3, emissive: 0x406080, emissiveIntensity: 0.25 })
    );
    kettle.position.set(1.7, 1.2, -1.5);
    g.add(kettle);
    // Locker bank mid
    for (let i = 0; i < 3; i++) {
      const lock = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 1.6, 0.4),
        window.VesperMat({ color: 0x4a5568, metalness: 0.5, roughness: 0.4 })
      );
      lock.position.set(-1.8 + i * 0.65, 0.9, 1.5);
      g.add(lock);
    }
    // Mid cargo netting racks
    const rack = new THREE.Mesh(
      new THREE.BoxGeometry(4.5, 0.08, 0.5),
      window.VesperMat({ color: 0x607080, metalness: 0.55, roughness: 0.4 })
    );
    rack.position.set(0, 2.2, 2);
    g.add(rack);
    // Floor glow path to hatch
    const path = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.02, 10),
      window.VesperMat({ color: 0x40c0ff, emissive: 0x2080c0, emissiveIntensity: 0.55 })
    );
    path.position.set(0, 0.11, 0);
    g.add(path);
    // Suit rack near hatch
    const suit = new THREE.Mesh(
      (THREE.CapsuleGeometry ? new THREE.CapsuleGeometry(0.18, 0.7, 4, 8) : new THREE.CylinderGeometry(0.18, 0.2, 1.1, 8)),
      window.VesperMat({ color: 0x4a7a9a, metalness: 0.4, roughness: 0.5, emissive: 0x102030, emissiveIntensity: 0.15 })
    );
    suit.position.set(1.8, 0.85, -4.5);
    g.add(suit);
    const coarseCabin = !!(typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches);
    // EVA vestibule (airlock antechamber — walkable; skip heavy on iPhone)
    if (!coarseCabin) {
    const vest = new THREE.Group();
    vest.name = "vesperEvaVestibule";
    const vf = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 0.1, 3.5),
      window.VesperMat({ color: 0x1a242e, metalness: 0.45, roughness: 0.55 })
    );
    vf.position.set(0, 0.05, -8.2);
    vest.add(vf);
    for (const side of [-1, 1]) {
      const vw = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 2.6, 3.5),
        window.VesperMat({ color: 0x3a4a58, metalness: 0.5, roughness: 0.4 })
      );
      vw.position.set(side * 1.55, 1.3, -8.2);
      vest.add(vw);
    }
    const vceil = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 0.08, 3.5),
      window.VesperMat({ color: 0x3a4a58, metalness: 0.5, roughness: 0.4 })
    );
    vceil.position.set(0, 2.65, -8.2);
    vest.add(vceil);
    // Outer hatch ring
    const vHatch = new THREE.Mesh(
      new THREE.TorusGeometry(0.95, 0.09, 8, 20),
      window.VesperMat({ color: 0x70e0c0, emissive: 0x20a080, emissiveIntensity: 0.6, metalness: 0.55, roughness: 0.28 })
    );
    vHatch.position.set(0, 1.15, -9.8);
    vest.add(vHatch);
    // Pressure status lights
    for (let i = 0; i < 3; i++) {
      const pl = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 8, 6),
        window.VesperMat({
          color: [0x40ff80, 0xffe060, 0x60c0ff][i],
          emissive: [0x20a040, 0xa08020, 0x2060a0][i],
          emissiveIntensity: 0.85,
        })
      );
      pl.position.set(-0.8 + i * 0.8, 2.2, -7.2);
      vest.add(pl);
    }
    const vL = window.VesperNoLight(0x80ffe0, 0.55, 8, 2);
    vL.position.set(0, 2.0, -8.2);
    vest.add(vL);
    // Bench + helmet shelf
    const vBench = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.4, 0.5),
      window.VesperMat({ color: 0x4a5560, roughness: 0.7 })
    );
    vBench.position.set(-0.9, 0.3, -8.0);
    vest.add(vBench);
    g.add(vest);
    // Nav map table (mid cabin) — readable Sol stub (IP-free)
    const nav = new THREE.Group();
    nav.name = "vesperNavMap";
    const table = new THREE.Mesh(
      new THREE.CylinderGeometry(1.1, 1.2, 0.12, 24),
      window.VesperMat({ color: 0x2a3540, metalness: 0.5, roughness: 0.4, emissive: 0x102030, emissiveIntensity: 0.2 })
    );
    table.position.set(0, 0.85, 2.5);
    nav.add(table);
    const mapGlass = new THREE.Mesh(
      new THREE.CircleGeometry(0.95, 32),
      window.VesperMat({
        color: 0x102838, metalness: 0.2, roughness: 0.25,
        emissive: 0x2080c0, emissiveIntensity: 0.55, transparent: true, opacity: 0.85,
      })
    );
    mapGlass.rotation.x = -Math.PI / 2;
    mapGlass.position.set(0, 0.92, 2.5);
    nav.add(mapGlass);
    // Orbit rings on map
    for (const r of [0.25, 0.45, 0.7]) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(r, 0.008, 4, 32),
        new THREE.MeshBasicMaterial({ color: 0x60c0ff, transparent: true, opacity: 0.55 })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, 0.93, 2.5);
      nav.add(ring);
    }
    // Soft markers (Sun + a few worlds)
    for (const [dx, dz, col] of [[0, 0, 0xffe080], [0.35, 0.1, 0x60a0ff], [-0.5, 0.2, 0xff8060], [0.2, -0.55, 0xa0ffe0]]) {
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.035, 6, 6),
        window.VesperMat({ color: col, emissive: col, emissiveIntensity: 0.7 })
      );
      dot.position.set(dx, 0.95, 2.5 + dz);
      nav.add(dot);
    }
    if (!(typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches)) {
      const navL = window.VesperNoLight(0x60c0ff, 0.4, 6, 2);
      navL.position.set(0, 1.6, 2.5);
      nav.add(navL);
    }
    g.add(nav);
    } // !coarseCabin vestibule+nav
    // Phone fallback airlock. Desktop already built vesperEvaVestibule in this volume.
    if (coarseCabin) {
    const vestibule = new THREE.Group();
    vestibule.name = "shipEvaVestibule";
    const vFloor = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 2.2), mats.floor);
    vFloor.position.set(0, 0.04, -7.4);
    vestibule.add(vFloor);
    const vWall = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.2, 0.1), mats.hull);
    vWall.position.set(0, 1.1, -8.4);
    vestibule.add(vWall);
    for (const sx of [-1.1, 1.1]) {
      const vw = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.2, 2.0), mats.hull);
      vw.position.set(sx, 1.1, -7.5);
      vestibule.add(vw);
    }
    const vRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.7, 0.07, 8, 18),
      window.VesperMat({ color: 0x80ffe0, emissive: 0x20a080, emissiveIntensity: 0.6, metalness: 0.55, roughness: 0.28 })
    );
    vRing.position.set(0, 1.1, -8.25);
    vestibule.add(vRing);
    const coarseVest = !!(typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches);
    if (!coarseVest) {
      const vLight = window.VesperNoLight(0x80ffe0, 0.45, 6, 2);
      vLight.position.set(0, 1.8, -7.6);
      vestibule.add(vLight);
    } else {
      const vBulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 6, 6),
        window.VesperMat({ color: 0xa0ffe0, emissive: 0x40c090, emissiveIntensity: 0.85 })
      );
      vBulb.position.set(0, 1.8, -7.6);
      vestibule.add(vBulb);
    }
    g.add(vestibule);
    }
    // Nav map screen (mid cabin) — readable status glow
    const navMap = new THREE.Mesh(
      new THREE.PlaneGeometry(1.4, 0.9),
      window.VesperMat({ color: 0x40c0ff, emissive: 0x2080c0, emissiveIntensity: 0.75, roughness: 0.25, metalness: 0.15, side: THREE.DoubleSide })
    );
    navMap.position.set(-2.55, 1.5, 0.5);
    navMap.rotation.y = Math.PI / 2;
    g.add(navMap);
    // Lived-in cabin wall panels + bunk strip (Starfield read; thrifty on coarse)
    const coarseCabin2 = !!(typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches);
    for (let wi = 0; wi < (coarseCabin2 ? 2 : 4); wi++) {
      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(0.02, 1.1, 1.4),
        window.VesperMat({ color: 0x3a4858, metalness: 0.55, roughness: 0.4, emissive: 0x152030, emissiveIntensity: 0.12 })
      );
      panel.name = "cabinWallPanels";
      panel.position.set(wi % 2 ? 2.62 : -2.62, 1.2, -2 + wi * 2.2);
      g.add(panel);
    }
    const bunkStrip = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.06, 0.12),
      window.VesperMat({ color: 0xa0d0ff, emissive: 0x60b0ff, emissiveIntensity: 0.8 })
    );
    bunkStrip.position.set(0, 2.35, -4.5);
    g.add(bunkStrip);
    {
      const poster = new THREE.Mesh(
        new THREE.PlaneGeometry(0.7, 0.9),
        window.VesperMat({ color: 0x204060, emissive: 0x306090, emissiveIntensity: 0.35 })
      );
      poster.position.set(-2.62, 1.4, 1.5);
      poster.rotation.y = Math.PI / 2;
      g.add(poster);
    }

    // Phone-lean nav console (desktop already has vesperNavMap table when !coarse)
    if (!g.getObjectByName("cabinNavConsoleLean") && !g.getObjectByName("vesperNavMap")) {
      const nav = new THREE.Group();
      nav.name = "cabinNavConsoleLean";
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.7, 0.75, 0.1, 12),
        window.VesperMat({ color: 0x2a3540, metalness: 0.5, roughness: 0.4, emissive: 0x102030, emissiveIntensity: 0.2 })
      );
      base.position.set(0, 0.85, 2.5);
      const glass = new THREE.Mesh(
        new THREE.CircleGeometry(0.6, 16),
        window.VesperMat({ color: 0x102838, emissive: 0x2080c0, emissiveIntensity: 0.6, transparent: true, opacity: 0.85 })
      );
      glass.rotation.x = -Math.PI / 2;
      glass.position.set(0, 0.91, 2.5);
      nav.add(base, glass);
      g.add(nav);
    }
    // Mess niche — cups + tray on galley (lived-in park cabin)
    if (!g.getObjectByName("cabinMessNiche")) {
      const mess = new THREE.Group();
      mess.name = "cabinMessNiche";
      const tray = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.04, 0.35),
        window.VesperMat({ color: 0x506070, metalness: 0.45, roughness: 0.45 })
      );
      tray.position.set(1.7, 1.15, -1.15);
      mess.add(tray);
      for (let i = 0; i < 2; i++) {
        const cup = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.045, 0.1, 8),
          window.VesperMat({ color: 0xc0d0e0, metalness: 0.35, roughness: 0.4, emissive: 0x304050, emissiveIntensity: 0.15 })
        );
        cup.position.set(1.55 + i * 0.25, 1.22, -1.15);
        mess.add(cup);
      }
      g.add(mess);
    }
    // Bunk privacy curtain + overhead LED (lived-in berth)
    if (!g.getObjectByName("cabinBunkCurtain")) {
      const curtain = new THREE.Mesh(
        new THREE.PlaneGeometry(1.2, 1.6),
        window.VesperMat({ color: 0x406080, metalness: 0.15, roughness: 0.7, emissive: 0x102030, emissiveIntensity: 0.12, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
      );
      curtain.name = "cabinBunkCurtain";
      curtain.position.set(-1.0, 1.2, -2.0);
      curtain.rotation.y = Math.PI / 2;
      g.add(curtain);
      const led = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.04, 0.06),
        window.VesperMat({ color: 0xffe0c0, emissive: 0xffa060, emissiveIntensity: 0.75 })
      );
      led.name = "cabinBunkLed";
      led.position.set(-1.7, 2.0, -2.0);
      g.add(led);
    }

    // Suit rack (lived-in EVA — keep on coarse)
    {
      const rack = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 1.8, 0.8),
        window.VesperMat({ color: 0x4a5568, metalness: 0.6, roughness: 0.4 })
      );
      rack.name = "cabinSuitRack";
      rack.position.set(2.6, 1.0, -3.2);
      g.add(rack);
      const suit = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 1.1, 0.35),
        window.VesperMat({ color: 0xc8d0d8, metalness: 0.25, roughness: 0.55, emissive: 0x203040, emissiveIntensity: 0.15 })
      );
      suit.position.set(2.35, 0.9, -3.2);
      g.add(suit);
    }
    // Wall tool board + helmet shelf (always-on cabin densify)
    if (!g.getObjectByName("cabinToolBoard")) {
      const board = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.9, 1.2),
        window.VesperMat({ color: 0x3a4550, metalness: 0.5, roughness: 0.4, emissive: 0x152028, emissiveIntensity: 0.12 })
      );
      board.name = "cabinToolBoard";
      board.position.set(-2.61, 1.35, -2.2);
      g.add(board);
      for (let ti = 0; ti < 3; ti++) {
        const tool = new THREE.Mesh(
          new THREE.BoxGeometry(0.05, 0.08, 0.35),
          window.VesperMat({ color: 0x80a0b0, metalness: 0.55, roughness: 0.35 })
        );
        tool.position.set(-2.55, 1.55 - ti * 0.22, -2.2);
        g.add(tool);
      }
      const helmShelf = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.08, 0.45),
        window.VesperMat({ color: 0x4a5560, metalness: 0.5, roughness: 0.4 })
      );
      helmShelf.position.set(2.4, 1.85, -3.2);
      g.add(helmShelf);
      const helm = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 8, 6),
        window.VesperMat({ color: 0xe0e8f0, metalness: 0.3, roughness: 0.3, emissive: 0x406080, emissiveIntensity: 0.25 })
      );
      helm.position.set(2.4, 2.05, -3.2);
      g.add(helm);
    }

    // Place beside park — local surface coords approx under player
    const deckY = groundYOf(surfaceRoot);
    if (worldPos && surfaceRoot.worldToLocal) {
      const local = worldPos.clone();
      surfaceRoot.worldToLocal(local);
      // Clear of the parked hull (about 1.8u off the feet) and of the spawn point.
      // Beside the pad, clear of the 18-wide hangar centered on x=0.
      g.position.set(local.x + 14, deckY, local.z + 1.2);
    } else {
      g.position.set(14, deckY, 1.2);
    }
    // Porthole (cabin lived-in — view cue)
    if (!g.getObjectByName("cabinPorthole")) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.35, 0.05, 8, 16),
        window.VesperMat({ color: 0x8090a0, metalness: 0.7, roughness: 0.3 })
      );
      ring.name = "cabinPorthole";
      ring.position.set(1.75, 1.5, 0.5);
      ring.rotation.y = Math.PI / 2;
      const glass = new THREE.Mesh(
        new THREE.CircleGeometry(0.32, 16),
        window.VesperMat({ color: 0x70d0ff, metalness: 0.2, roughness: 0.1, emissive: 0x206080, emissiveIntensity: 0.4, transparent: true, opacity: 0.55 })
      );
      glass.position.set(1.74, 1.5, 0.5);
      glass.rotation.y = Math.PI / 2;
      g.add(ring, glass);
    }
    // Floor mat (cabin lived-in)
    if (!g.getObjectByName("cabinFloorMat")) {
      const matMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.03, 2.0),
        window.VesperMat({ color: 0x3a342c, roughness: 0.9, metalness: 0.05 })
      );
      matMesh.name = "cabinFloorMat";
      matMesh.position.set(0, 0.08, 0.4);
      g.add(matMesh);
    }
    // HVAC vent grille (cabin systems cue)
    if (!g.getObjectByName("cabinVentGrille")) {
      const vent = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.35, 0.05),
        window.VesperMat({ color: 0x5a6570, metalness: 0.55, roughness: 0.4, emissive: 0x203040, emissiveIntensity: 0.15 })
      );
      vent.name = "cabinVentGrille";
      vent.position.set(1.7, 2.1, -0.5);
      g.add(vent);
    }
    // Ceiling cable tray (finished cabin)
    if (!g.getObjectByName("cabinCableTray")) {
      const tray = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.08, 4.0),
        window.VesperMat({ color: 0x4a5560, metalness: 0.55, roughness: 0.4, emissive: 0x152028, emissiveIntensity: 0.1 })
      );
      tray.name = "cabinCableTray";
      tray.position.set(0, 2.35, 0);
      g.add(tray);
    }
    // Wall datapad (cabin ops — lived-in)
    if (!g.getObjectByName("cabinDataPad")) {
      const pad = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 0.55, 0.06),
        window.VesperMat({ color: 0x2a323c, metalness: 0.5, roughness: 0.4 })
      );
      pad.name = "cabinDataPad";
      pad.position.set(-1.7, 1.4, 0.2);
      const screen = new THREE.Mesh(
        new THREE.PlaneGeometry(0.35, 0.42),
        window.VesperMat({ color: 0x60c0ff, emissive: 0x3080c0, emissiveIntensity: 0.65 })
      );
      screen.name = "cabinDataPadScreen";
      screen.position.set(-1.665, 1.4, 0.2);
      g.add(pad, screen);
    }
    // Suit patch kit crate (lived-in cabin clutter)
    if (!g.getObjectByName("cabinPatchKit")) {
      const kit = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 0.28, 0.35),
        window.VesperMat({ color: 0x70a0c0, metalness: 0.35, roughness: 0.45, emissive: 0x306080, emissiveIntensity: 0.25 })
      );
      kit.name = "cabinPatchKit";
      kit.position.set(-0.8, 0.25, 1.8);
      g.add(kit);
    }

    // Overhead handrail (cabin walk densify — corridor read)
    if (!g.getObjectByName("cabinOverheadHandrail")) {
      const railGeo = new THREE.CylinderGeometry(0.025, 0.025, 3.6, 6);
      railGeo.rotateZ(Math.PI / 2);
      const rail = new THREE.Mesh(
        railGeo,
        window.VesperMat({ color: 0x8090a0, metalness: 0.7, roughness: 0.3 })
      );
      rail.name = "cabinOverheadHandrail";
      rail.position.set(0, 2.15, 0.2);
      g.add(rail);
      for (const z of [-1.2, 1.4]) {
        const strut = new THREE.Mesh(
          new THREE.CylinderGeometry(0.02, 0.02, 0.35, 5),
          window.VesperMat({ color: 0x5a6570, metalness: 0.55, roughness: 0.4 })
        );
        strut.position.set(0, 2.35, z);
        g.add(strut);
      }
    }

    // Galley niche — kettle + mug shelf (cabin lived-in, quiet)
    if (!g.getObjectByName("cabinGalleyNiche")) {
      const niche = new THREE.Group();
      niche.name = "cabinGalleyNiche";
      const shelf = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.06, 0.4),
        window.VesperMat({ color: 0x4a5560, metalness: 0.45, roughness: 0.45 })
      );
      shelf.position.y = 1.15;
      niche.add(shelf);
      const kettle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.12, 0.22, 8),
        window.VesperMat({ color: 0xc0c8d0, metalness: 0.65, roughness: 0.28, emissive: 0x203040, emissiveIntensity: 0.1 })
      );
      kettle.position.set(-0.2, 1.32, 0);
      niche.add(kettle);
      const mug = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.055, 0.1, 8),
        window.VesperMat({ color: 0x4080a0, metalness: 0.2, roughness: 0.55, emissive: 0x102030, emissiveIntensity: 0.15 })
      );
      mug.position.set(0.22, 1.26, 0.05);
      niche.add(mug);
      const back = new THREE.Mesh(
        new THREE.BoxGeometry(0.95, 0.7, 0.05),
        window.VesperMat({ color: 0x2a323c, metalness: 0.4, roughness: 0.5, emissive: 0x152028, emissiveIntensity: 0.08 })
      );
      back.position.set(0, 1.35, -0.2);
      niche.add(back);
      niche.position.set(1.2, 0, -1.6);
      g.add(niche);
    }

    // Mug rack (lived-in micro — always-on)
    if (!g.getObjectByName("cabinMugRack")) {
      const rack = new THREE.Group();
      rack.name = "cabinMugRack";
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.04, 0.08),
        window.VesperMat({ color: 0x5a6a78, metalness: 0.55, roughness: 0.35 })
      );
      bar.position.set(-1.5, 1.55, -1.2);
      rack.add(bar);
      for (let i = 0; i < 3; i++) {
        const mug = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.045, 0.1, 8),
          window.VesperMat({ color: i === 1 ? 0xc07040 : 0xd0d8e0, metalness: 0.25, roughness: 0.45 })
        );
        mug.position.set(-1.65 + i * 0.15, 1.45, -1.2);
        rack.add(mug);
      }
      g.add(rack);
    }
    // Checklist slate on bulkhead
    if (!g.getObjectByName("cabinChecklistSlate")) {
      const slate = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.7, 0.04),
        window.VesperMat({ color: 0x2a323c, metalness: 0.4, roughness: 0.45, emissive: 0x101820, emissiveIntensity: 0.12 })
      );
      slate.name = "cabinChecklistSlate";
      slate.position.set(1.7, 1.4, 1.2);
      const lines = new THREE.Mesh(
        new THREE.PlaneGeometry(0.38, 0.55),
        window.VesperMat({ color: 0x80e0ff, emissive: 0x40a0c0, emissiveIntensity: 0.45 })
      );
      lines.position.set(1.7, 1.4, 1.23);
      g.add(slate, lines);
    }
    // Suit glove on bench (lived-in micro)
    if (!g.getObjectByName("cabinSuitGlove")) {
      const glove = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.08, 0.14),
        window.VesperMat({ color: 0xc8d0d8, metalness: 0.2, roughness: 0.55, emissive: 0x304050, emissiveIntensity: 0.1 })
      );
      glove.name = "cabinSuitGlove";
      glove.position.set(0.6, 0.55, 1.6);
      glove.rotation.y = 0.4;
      g.add(glove);
    }
    // Galley shelf + locker (lived-in cabin)
    if (!g.getObjectByName("cabinGalley")) {
      const shelf = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.08, 0.4),
        window.VesperMat({ color: 0x5a6a78, metalness: 0.5, roughness: 0.4 })
      );
      shelf.name = "cabinGalley";
      shelf.position.set(-1.2, 1.35, -1.5);
      g.add(shelf);
      for (let i = 0; i < 3; i++) {
        const can = new THREE.Mesh(
          new THREE.CylinderGeometry(0.06, 0.06, 0.14, 8),
          window.VesperMat({ color: i === 1 ? 0xc07040 : 0x7090a0, metalness: 0.4, roughness: 0.4 })
        );
        can.position.set(-1.5 + i * 0.25, 1.48, -1.5);
        g.add(can);
      }
      const locker = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 1.4, 0.4),
        window.VesperMat({ color: 0x4a5560, metalness: 0.55, roughness: 0.4, emissive: 0x152028, emissiveIntensity: 0.1 })
      );
      locker.position.set(1.4, 0.85, -1.8);
      g.add(locker);
    }
    // Wall conduit + panel seams (finished cabin, not empty box)
    if (!g.getObjectByName("cabinConduit")) {
      for (const side of [-1, 1]) {
        const conduit = new THREE.Mesh(
          new THREE.BoxGeometry(0.08, 0.08, 4.5),
          window.VesperMat({ color: 0x60a0c0, metalness: 0.5, roughness: 0.35, emissive: 0x206080, emissiveIntensity: 0.35 })
        );
        conduit.name = "cabinConduit";
        conduit.position.set(side * 1.55, 1.6, 0);
        g.add(conduit);
        for (let i = 0; i < 3; i++) {
          const panel = new THREE.Mesh(
            new THREE.BoxGeometry(0.04, 0.9, 1.1),
            window.VesperMat({ color: 0x4a5560, metalness: 0.55, roughness: 0.4 })
          );
          panel.position.set(side * 1.7, 1.1, -1.2 + i * 1.3);
          g.add(panel);
        }
      }
    }
    // Overhead handrail (walk-readable cabin — always-on coarse)
    if (!g.getObjectByName("cabinOverheadRail")) {
      for (const side of [-1, 1]) {
        const rail = new THREE.Mesh(
          new THREE.CylinderGeometry(0.035, 0.035, 8.5, 6),
          window.VesperMat({ color: 0x8090a0, metalness: 0.65, roughness: 0.3, emissive: 0x203040, emissiveIntensity: 0.1 })
        );
        rail.name = "cabinOverheadRail";
        rail.rotation.x = Math.PI / 2;
        rail.position.set(side * 1.1, 2.25, 0);
        g.add(rail);
        for (let i = 0; i < 4; i++) {
          const stanchion = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.02, 0.25, 5),
            window.VesperMat({ color: 0x607080, metalness: 0.55, roughness: 0.35 })
          );
          stanchion.position.set(side * 1.1, 2.4, -3 + i * 2);
          g.add(stanchion);
        }
      }
    }
    // Floor hatch ring (mid cabin — walk-readable)
    if (!g.getObjectByName("cabinFloorHatch")) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.45, 0.05, 8, 16),
        window.VesperMat({ color: 0x70e0c0, metalness: 0.5, roughness: 0.3, emissive: 0x20a080, emissiveIntensity: 0.4 })
      );
      ring.name = "cabinFloorHatch";
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0.9, 0.12, -0.5);
      const lid = new THREE.Mesh(
        new THREE.CircleGeometry(0.4, 16),
        window.VesperMat({ color: 0x3a4550, metalness: 0.55, roughness: 0.4, emissive: 0x152028, emissiveIntensity: 0.12 })
      );
      lid.rotation.x = -Math.PI / 2;
      lid.position.set(0.9, 0.11, -0.5);
      g.add(ring, lid);
    }
    // Cabin status LED strip (ops presence — pulse in tick)
    if (!g.getObjectByName("cabinStatusLed")) {
      const led = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 0.05, 0.06),
        window.VesperMat({ color: 0x40ffc0, emissive: 0x20c090, emissiveIntensity: 0.7 })
      );
      led.name = "cabinStatusLed";
      led.position.set(0, 2.2, -2.8);
      g.add(led);
    }
    // Life-support fan grille (subtle rotation cue — lived-in systems)
    if (!g.getObjectByName("cabinLSFan")) {
      const fan = new THREE.Group();
      fan.name = "cabinLSFan";
      const grille = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.28, 0.06, 12),
        window.VesperMat({ color: 0x5a6570, metalness: 0.55, roughness: 0.4, emissive: 0x203040, emissiveIntensity: 0.15 })
      );
      grille.rotation.x = Math.PI / 2;
      const hub = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 6, 4),
        window.VesperMat({ color: 0x80c0e0, emissive: 0x406080, emissiveIntensity: 0.35 })
      );
      hub.position.z = 0.04;
      for (let i = 0; i < 4; i++) {
        const blade = new THREE.Mesh(
          new THREE.BoxGeometry(0.08, 0.42, 0.02),
          window.VesperMat({ color: 0x708090, metalness: 0.5, roughness: 0.35 })
        );
        blade.rotation.z = (i / 4) * Math.PI * 2;
        blade.position.z = 0.03;
        fan.add(blade);
      }
      fan.add(grille, hub);
      fan.position.set(-1.55, 1.9, 2.2);
      g.add(fan);
    }
    // Wall fire extinguisher (ops clutter micro — arrival cabin feel)
    if (!g.getObjectByName("cabinExtinguisher")) {
      const ext = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.09, 0.45, 8),
        window.VesperMat({ color: 0xc04020, metalness: 0.4, roughness: 0.4, emissive: 0x401000, emissiveIntensity: 0.15 })
      );
      ext.name = "cabinExtinguisher";
      ext.position.set(1.65, 1.0, -2.5);
      const nozzle = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.06, 0.18),
        window.VesperMat({ color: 0x303840, metalness: 0.55, roughness: 0.4 })
      );
      nozzle.position.set(1.65, 1.28, -2.4);
      g.add(ext, nozzle);
    }
    surfaceRoot.add(g);
    trackLive(g);
    return g;
  }


  function makeInteriorBay(def) {
    const g = new THREE.Group();
    g.name = "interiorBay:" + def.id;
    // FULL-SIZE walkable bay (ME/Bethesda deck — not dollhouse props)
    const BW = 10, BD = 8, BH = 3.6;
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(BW, 0.1, BD),
      window.VesperMat({ color: 0x2a3038, metalness: 0.35, roughness: 0.7, emissive: 0x102030, emissiveIntensity: 0.12 })
    );
    floor.position.y = 0.05;
    g.add(floor);
    const wallMat = window.VesperMat({ color: 0x3a4550, metalness: 0.4, roughness: 0.55, emissive: 0x152030, emissiveIntensity: 0.1 });
    const back = new THREE.Mesh(new THREE.BoxGeometry(BW, BH, 0.12), wallMat);
    back.position.set(0, BH / 2, -BD / 2);
    const left = new THREE.Mesh(new THREE.BoxGeometry(0.12, BH, BD), wallMat);
    left.position.set(-BW / 2, BH / 2, 0);
    const right = new THREE.Mesh(new THREE.BoxGeometry(0.12, BH, BD), wallMat);
    right.position.set(BW / 2, BH / 2, 0);
    const ceil = new THREE.Mesh(new THREE.BoxGeometry(BW, 0.1, BD), wallMat);
    ceil.position.set(0, BH, 0);
    g.add(back, left, right, ceil);
    // Ceiling light bars
    for (let i = 0; i < 5; i++) {
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 0.07, 0.14),
        window.VesperMat({ color: 0xd0e8ff, emissive: 0xa0d0ff, emissiveIntensity: 0.9 })
      );
      bar.position.set(-3.2 + i * 1.6, BH - 0.15, 0);
      g.add(bar);
    }
    const coarseBay = !!(typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches);
    if (!coarseBay) {
      const fill = window.VesperNoLight(0xc0e0ff, 0.75, 16, 2);
      fill.position.set(0, BH - 0.6, 0);
      g.add(fill);
    } else {
      // Emissive fill proxy — phone FPS
      const fillMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 8, 6),
        window.VesperMat({ color: 0xc0e0ff, emissive: 0xa0d0ff, emissiveIntensity: 0.85 })
      );
      fillMesh.position.set(0, BH - 0.6, 0);
      g.add(fillMesh);
    }
    // Console + crate + bunk = something to do
    const console_ = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.7, 0.45),
      window.VesperMat({ color: 0x203040, emissive: 0x3080c0, emissiveIntensity: 0.35 })
    );
    console_.position.set(0, 0.55, -BD / 2 + 1.2);
    g.add(console_);
    const consoleScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.9, 0.35),
      window.VesperMat({
        color: 0x80d0ff, emissive: 0x40a0ff, emissiveIntensity: 0.7, roughness: 0.2, metalness: 0.1,
      })
    );
    consoleScreen.position.set(0, 0.95, -BD / 2 + 1.45);
    g.add(consoleScreen);
    const sampleTray = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.06, 0.35),
      window.VesperMat({ color: 0x8090a0, metalness: 0.5, roughness: 0.35 })
    );
    sampleTray.position.set(-1.2, 0.55, -0.9);
    g.add(sampleTray);
    for (let i = 0; i < 3; i++) {
      const vial = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.12, 6),
        window.VesperMat({ color: 0xa0e0ff, transparent: true, opacity: 0.7, emissive: 0x206080, emissiveIntensity: 0.3 })
      );
      vial.position.set(-1.4 + i * 0.15, 0.68, -0.9);
      g.add(vial);
    }
    const bunk = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.35, 2.0),
      window.VesperMat({ color: 0x4a5560, roughness: 0.75 })
    );
    bunk.position.set(1.4, 0.25, 0.2);
    g.add(bunk);
    const bunkPillow = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.12, 0.4),
      window.VesperMat({ color: 0xc8d0d8, roughness: 0.85 })
    );
    bunkPillow.position.set(1.4, 0.5, -0.5);
    g.add(bunkPillow);
    // Locker bank + floor stripe (hab readability)
    const lockerBank = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 1.5, 0.35),
      window.VesperMat({ color: 0x4a5560, metalness: 0.45, roughness: 0.45 })
    );
    lockerBank.position.set(-1.5, 0.8, -0.8);
    g.add(lockerBank);
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(3.8, 0.02, 0.18),
      window.VesperMat({ color: 0x40c0ff, emissive: 0x2080c0, emissiveIntensity: 0.5 })
    );
    stripe.position.set(0, 0.09, 0.9);
    g.add(stripe);
    const crate2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.35, 0.4),
      window.VesperMat({ color: 0x6a5030, roughness: 0.7 })
    );
    crate2.position.set(-1.2, 0.22, 0.9);
    g.add(crate2);
    // Wall status screen + cargo net (lived-in bay)
    {
      const wallScreen = new THREE.Mesh(
        new THREE.PlaneGeometry(1.4, 0.9),
        window.VesperMat({ color: 0x40c0a0, emissive: 0x208070, emissiveIntensity: 0.65 })
      );
      wallScreen.position.set(-BW / 2 + 0.08, 1.8, 0.5);
      wallScreen.rotation.y = Math.PI / 2;
      g.add(wallScreen);
      const net = new THREE.Mesh(
        new THREE.PlaneGeometry(2.2, 1.6),
        window.VesperMat({ color: 0x608090, transparent: true, opacity: 0.35, wireframe: true, emissive: 0x204060, emissiveIntensity: 0.2 })
      );
      net.name = "bayCargoNet";
      net.position.set(BW / 2 - 0.2, 1.4, -1.0);
      net.rotation.y = -Math.PI / 2;
      g.add(net);
      const doorFrame = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 2.4, 0.15),
        window.VesperMat({ color: 0x70e0c0, metalness: 0.5, roughness: 0.35, emissive: 0x20a080, emissiveIntensity: 0.35 })
      );
      doorFrame.position.set(0, 1.2, BD / 2 - 0.1);
      g.add(doorFrame);
    }
    // Hanging work lamp (bay activity — emissive only)
    if (!g.getObjectByName("bayHangingLamp")) {
      const cord = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.6, 4),
        window.VesperMat({ color: 0x303840, metalness: 0.4, roughness: 0.5 })
      );
      cord.position.set(1.5, BH - 0.35, 0.5);
      const lamp = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 8, 6),
        window.VesperMat({ color: 0xffe8c0, emissive: 0xffa040, emissiveIntensity: 0.85 })
      );
      lamp.name = "bayHangingLamp";
      lamp.position.set(1.5, BH - 0.7, 0.5);
      g.add(cord, lamp);
    }
    if (/refuge|clinic|med|hope/i.test(def.purpose || "") || /clinic|hope|medbay|patch/i.test(def.id || "")) {
      const medCot = new THREE.Mesh(
        new THREE.BoxGeometry(0.85, 0.4, 1.8),
        window.VesperMat({ color: 0xd0d8e0, roughness: 0.7 })
      );
      medCot.position.set(1.3, 0.28, -0.3);
      g.add(medCot);
      const medLight = window.VesperNoLight(0xa0ffe0, 0.35, 5, 2);
      medLight.position.set(1.3, 1.5, -0.3);
      g.add(medLight);
    }
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(1.4, 0.35),
      new THREE.MeshBasicMaterial({ color: def.hyp ? 0xc0a040 : 0x40a0c0, transparent: true, opacity: 0.85 })
    );
    sign.position.set(0, 1.7, -1.48);
    g.add(sign);

    if (/radio|listen|transit/i.test(def.purpose || "") || /radio|relay|skytape|listen/i.test(def.id || "")) {
      const radioRack = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 1.1, 0.35),
        window.VesperMat({ color: 0x3a4550, metalness: 0.5, roughness: 0.4, emissive: 0x104060, emissiveIntensity: 0.25 })
      );
      radioRack.position.set(1.5, 0.7, -1.0);
      g.add(radioRack);
    }
    // Library / research: shelf rows
    if (/social|research/i.test(def.purpose || "") || /library|archive|desk/i.test(def.id || "")) {
      for (let i = 0; i < 3; i++) {
        const shelfRow = new THREE.Mesh(
          new THREE.BoxGeometry(1.6, 1.2, 0.28),
          window.VesperMat({ color: 0x4a3a28, roughness: 0.7, metalness: 0.1 })
        );
        shelfRow.position.set(-1.4 + i * 0.15, 0.9, -1.2);
        g.add(shelfRow);
      }
    }
    if (/guild|hall/i.test(def.id || "")) {
      for (let i = 0; i < 4; i++) {
        const guildPlaque = new THREE.Mesh(
          new THREE.PlaneGeometry(0.45, 0.6),
          window.VesperMat({
            color: [0x80a0c0, 0xa0c080, 0xc0a060, 0x80c0c0][i],
            emissive: 0x203040, emissiveIntensity: 0.3, side: THREE.DoubleSide,
          })
        );
        guildPlaque.position.set(-1.5 + i * 0.9, 1.3, -1.48);
        g.add(guildPlaque);
      }
    }
    // Tea / social counter
    if (/tea|cafe|cantina|lounge|commons|social/i.test(def.id || "") || def.purpose === "social") {
      const teaCounter = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 0.85, 0.55),
        window.VesperMat({ color: 0x5a4030, roughness: 0.65, metalness: 0.15 })
      );
      teaCounter.position.set(0.2, 0.45, 0.6);
      g.add(teaCounter);
      const kettle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.1, 0.2, 8),
        window.VesperMat({ color: 0xc0c8d0, metalness: 0.6, roughness: 0.3, emissive: 0x406080, emissiveIntensity: 0.25 })
      );
      kettle.position.set(0.2, 1.0, 0.6);
      g.add(kettle);
    }
    // Social hubs get cantina booth + table (purposeful sit spot)
    if (/social|refuge|camp/i.test(def.purpose || "") || /cantina|cafe|lounge|commons/i.test(def.id || "")) {
      const table = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.38, 0.08, 12),
        window.VesperMat({ color: 0x4a3a28, roughness: 0.65, metalness: 0.1 })
      );
      table.position.set(-0.8, 0.55, 0.4);
      g.add(table);
      for (const sx of [-1.2, -0.4]) {
        const booth = new THREE.Mesh(
          new THREE.BoxGeometry(0.55, 0.7, 0.45),
          window.VesperMat({ color: 0x3a4558, roughness: 0.7 })
        );
        booth.position.set(sx, 0.4, 0.9);
        g.add(booth);
      }
      const lamp = window.VesperNoLight(0xffc080, 0.4, 5, 2);
      lamp.position.set(-0.8, 1.2, 0.4);
      g.add(lamp);
    }

    // Side corridor + bunk nook (extra walkable volume — ME deck feel)
    const corr = new THREE.Group();
    corr.name = "baySideCorridor";
    const cf = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 0.1, 8),
      window.VesperMat({ color: 0x2a323c, metalness: 0.35, roughness: 0.65 })
    );
    cf.position.set(BW / 2 + 2.5, 0.05, 0);
    corr.add(cf);
    for (const side of [-1, 1]) {
      const cw = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 2.6, 8),
        window.VesperMat({ color: 0x3a4550, metalness: 0.4, roughness: 0.5 })
      );
      cw.position.set(BW / 2 + 2.5 + side * 1.55, 1.3, 0);
      corr.add(cw);
    }
    const cceil = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 0.08, 8),
      window.VesperMat({ color: 0x3a4550, metalness: 0.4, roughness: 0.5 })
    );
    cceil.position.set(BW / 2 + 2.5, 2.65, 0);
    corr.add(cceil);
    for (let i = 0; i < 3; i++) {
      const bunk = new THREE.Mesh(
        new THREE.BoxGeometry(0.85, 0.35, 1.9),
        window.VesperMat({ color: 0x4a5560, roughness: 0.75 })
      );
      bunk.position.set(BW / 2 + 2.5 - 0.7, 0.3, -2.5 + i * 2.5);
      corr.add(bunk);
    }
    const cfill = window.VesperNoLight(0xa0d0ff, 0.45, 10, 2);
    cfill.position.set(BW / 2 + 2.5, 2.1, 0);
    corr.add(cfill);
    g.add(corr);
    const bayLantern = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 8, 6),
      window.VesperMat({ color: 0xffe8c0, emissive: 0xffa060, emissiveIntensity: 0.8 })
    );
    bayLantern.name = "interiorBayLantern";
    bayLantern.position.set(0, 2.35, 0.5);
    g.add(bayLantern);

    return g;
  }

  function attachSurfaceHub(def, surfaceRoot) {
    if (!surfaceRoot || !THREE) return null;
    const g = makeSurfaceNpc(def);
    const off = def.offset || [3.5, 0, -2.5];
    g.position.set(off[0], groundYOf(surfaceRoot), off[2]);
    g.scale.setScalar(1.35); // outpost presence vs avatar
    g.userData.hubDef = def;
    // Bulletin board (quest/ops cue beside every surface hub)
    if (!g.getObjectByName("hubBulletin")) {
      const board = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.9, 0.06),
        window.VesperMat({ color: 0x3a4550, metalness: 0.4, roughness: 0.45, emissive: 0x152028, emissiveIntensity: 0.12 })
      );
      board.name = "hubBulletin";
      board.position.set(2.2, 0.9, 0.5);
      const paper = new THREE.Mesh(
        new THREE.PlaneGeometry(0.55, 0.7),
        window.VesperMat({ color: 0xe8e0c8, emissive: 0x404030, emissiveIntensity: 0.15 })
      );
      paper.position.set(2.2, 0.9, 0.54);
      g.add(board, paper);
    }
    // Lived-in desk props (lantern + crate) — every surface hub
    const lantern = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 6),
      window.VesperMat({ color: 0xffe0a0, emissive: 0xffa040, emissiveIntensity: 0.75 })
    );
    lantern.name = "surfaceLivedInLantern";
    lantern.position.set(0.6, 1.1, 0.2);
    g.add(lantern);
    const thermos = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.07, 0.22, 8),
      window.VesperMat({ color: 0x406080, metalness: 0.55, roughness: 0.35, emissive: 0x204060, emissiveIntensity: 0.25 })
    );
    thermos.name = "surfaceThermos";
    thermos.position.set(0.35, 0.85, 0.35);
    g.add(thermos);
    const crate = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.45, 0.55),
      window.VesperMat({ color: 0x5a4a38, roughness: 0.7, metalness: 0.2 })
    );
    crate.position.set(-0.7, 0.28, 0.4);
    g.add(crate);
    surfaceRoot.add(g);
    // Walkable interior bay beside hub (stations, yards, camps, fiction)
    if (/station|yard|refuge|social|camp|dock|gateway|industry|fiction|radio/i.test(def.purpose || "")) {
      const bay = makeInteriorBay(def);
      // The old shift (off.x - 5.5) pulled the bay back onto the pad.
      // Landing the Moon was already "inside" Shackleton Rim Camp.
      let bx = off[0] + (off[0] >= 0 ? 2.6 : -2.6);
      let bz = off[2];
      if (Math.abs(bx) < 4.6 && Math.abs(bz) < 3.6) {
        bx = (bx >= 0 ? 1 : -1) * 4.8;
      }
      bay.position.set(bx, groundYOf(surfaceRoot), bz);
      bay.userData.hubId = def.id;
      bay.userData.bayLabel = def.name || "bay";
      surfaceRoot.add(bay);
    }
    hubs.push({ def: def, wrap: g, surface: true });
    return g;
  }


  function separateBays(surfaceRoot) {
    if (!surfaceRoot) return;
    const bays = [];
    for (let i = 0; i < surfaceRoot.children.length; i++) {
      const ch = surfaceRoot.children[i];
      if (ch.name && ch.name.indexOf("interiorBay:") === 0) bays.push(ch);
    }
    if (!bays.length) return;
    // 10 by 8 floors. Starboard x=28 sat in the city blocks.
    // These rows are south of the hangar and port of the cabin,
    // where the city blocks (z ≥ -2, or x > 0) do not reach.
    const slots = [];
    const xs = [-16, -34, -52];
    const zs = [-20, -30, -40, -50, -60];
    for (let xi = 0; xi < xs.length; xi++) {
      for (let zi = 0; zi < zs.length; zi++) slots.push([xs[xi], zs[zi]]);
    }
    const used = new Array(slots.length).fill(false);
    function overlaps(x, z, self) {
      for (let i = 0; i < bays.length; i++) {
        if (bays[i] === self) continue;
        if (!bays[i].userData._bayPlaced) continue;
        if (Math.abs(bays[i].position.x - x) < 10.05 && Math.abs(bays[i].position.z - z) < 8.05) return true;
      }
      return false;
    }
    for (let bi = 0; bi < bays.length; bi++) {
      const ch = bays[bi];
      let best = -1;
      let bestD = Infinity;
      for (let s = 0; s < slots.length; s++) {
        if (used[s]) continue;
        const dx = slots[s][0] - ch.position.x;
        const dz = slots[s][1] - ch.position.z;
        const d = dx * dx + dz * dz;
        if (d < bestD) { bestD = d; best = s; }
      }
      if (best >= 0) {
        used[best] = true;
        ch.position.x = slots[best][0];
        ch.position.z = slots[best][1];
      }
      ch.userData._bayPlaced = true;
      // Bunk hall is built on +X. The east row points it west so it
      // misses the hangar. The other rows point it east, into the gap.
      const corr = ch.getObjectByName("baySideCorridor");
      if (corr && ch.position.x > -20) {
        for (let ci = 0; ci < corr.children.length; ci++) {
          const part = corr.children[ci];
          if (part.position) part.position.x = -Math.abs(part.position.x);
        }
      }
      if (overlaps(ch.position.x, ch.position.z, ch)) {
        ch.position.z -= 10;
      }
    }
  }

  function onSurfaceAttach(bodyName) {
    const sroot =
      window.VesperSurfaces &&
      window.VesperSurfaces.active &&
      window.VesperSurfaces.active();
    // Surfaces module doesn't expose root; search scene
    const sceneObj = scene || (window.VesperSky && window.VesperSky.scene && window.VesperSky.scene());
    if (!sceneObj) return;
    let surfaceRoot = null;
    sceneObj.traverse((ch) => {
      if (ch.name === "vesper-surface-detail") surfaceRoot = ch;
    });
    if (!surfaceRoot) return;
    landedRoot = surfaceRoot;
    // Dropping aboardId here used to leave the cabin computer open on the next world.
    try {
      if (window.VesperComms && window.VesperComms.setShipComputer) window.VesperComms.setShipComputer(false);
    } catch (_) {}
    aboardId = null;
    try { window.__vesperAboard = null; } catch (_) {}
    // Full-scale dock/hangar/airlock immediately on soft-land
    try {
      const biome =
        (window.VesperSurfaces && window.VesperSurfaces.biomeFor && window.VesperSurfaces.biomeFor(bodyName)) ||
        "rock";
      ensureDockComplex(surfaceRoot, bodyName, biome);
    } catch (e) {
      console.warn("[vesper-places dock]", e);
    }
    // Clear old surface hubs from this root
    const remove = [];
    surfaceRoot.children.forEach((ch) => {
      if (ch.name && (ch.name.indexOf("surfaceHub:") === 0 || ch.name.indexOf("interiorBay:") === 0)) remove.push(ch);
    });
    remove.forEach((ch) => surfaceRoot.remove(ch));
    hubs = hubs.filter((h) => !h.surface || (h.def && h.def.body !== bodyName));

    const placedHubs = [];
    // Visit radius is 3.2. Desks closer than that read as one pile, and the
    // nearest origin checks off whichever activity is an inch closer.
    function separateHub(x, z) {
      const MIN = 3.6;
      const PAD = 18;
      const originOk = (px, pz) => {
        const r = Math.hypot(px, pz);
        return r >= 3.4 && r <= PAD;
      };
      const clear = (px, pz) => placedHubs.every((q) => Math.hypot(q[0] - px, q[1] - pz) >= MIN - 1e-6);
      if (clear(x, z) && originOk(x, z)) return [x, z];
      const ang0 = Math.atan2(z || 0.01, x || 0.01);
      for (let step = 0; step < 48; step++) {
        const rad = Math.min(PAD, Math.max(4.2, Math.hypot(x, z)) + step * 0.7);
        const a = ang0 + step * 0.85;
        const nx = Math.cos(a) * rad;
        const nz = Math.sin(a) * rad;
        if (clear(nx, nz) && originOk(nx, nz)) return [nx, nz];
      }
      for (let k = 0; k < 60; k++) {
        const a = k * 2.399963;
        const rad = 4.4 + (k % 9) * 1.45;
        const nx = Math.cos(a) * rad;
        const nz = Math.sin(a) * rad;
        if (clear(nx, nz) && originOk(nx, nz)) return [nx, nz];
      }
      return [x, z];
    }
    HUB_DEFS.filter((d) => d.kind === "surface" && d.body === bodyName).forEach((d, i) => {
      const copy = Object.assign({}, d);
      if (!copy.offset) copy.offset = [3.2 + i * 2.4, 0, -2.2 - i * 1.1];
      const sep = separateHub(copy.offset[0], copy.offset[2] || 0);
      copy.offset = [sep[0], copy.offset[1] || 0, sep[1]];
      placedHubs.push(sep);
      attachSurfaceHub(copy, surfaceRoot);
    });
    separateBays(surfaceRoot);
    // Always add a generic activity beacon if body had no dedicated hub
    const has = HUB_DEFS.some((d) => d.kind === "surface" && d.body === bodyName);
    if (!has) {
      // bodies() drops the hypothetic flag, so Counter-Earth and Counter-Luna
      // missed the name regex and grew an unlabeled Sol field desk.
      let hypBody = false;
      try {
        const list = window.VesperSky && window.VesperSky._bodiesRef && window.VesperSky._bodiesRef();
        const hb = list && list.find((x) => x && x.name === bodyName);
        hypBody = !!(hb && hb.hypothetic);
      } catch (_) {}
      if (!hypBody) {
        hypBody = /Hyp|Vulcan|Nemesis|Tyche|Planet|Nibiru|Phaeton|Theia|PBH|Counter-Earth|Counter-Luna/i.test(bodyName);
      }
      attachSurfaceHub(
        {
          id: "auto-" + bodyName,
          name: bodyName + " Field Desk",
          body: bodyName,
          kind: "surface",
          purpose: hypBody ? "fiction" : "survey",
          hyp: hypBody,
          blurb: hypBody
            ? "Hyp fiction · field desk — labeled, not a Sol site"
            : "Field desk · sample spike · someone was here",
          offset: [4, 0, -3],
        },
        surfaceRoot
      );
    }
    // Walkable ship cabin beside park — lived-in land (not checkbox)
    try {
      const sky = window.VesperSky;
      const fp = sky && sky.getFlightPos && sky.getFlightPos();
      if (fp && typeof THREE !== "undefined") {
        attachShipCabin(surfaceRoot, fp.clone ? fp.clone() : new THREE.Vector3(fp.x, fp.y, fp.z));
      } else {
        attachShipCabin(surfaceRoot, null);
      }
    } catch (e) {
      console.warn("[vesper-places cabin]", e);
    }
    volCabin = null;
    volDock = null;
    for (let vi = 0; vi < surfaceRoot.children.length; vi++) {
      const ch = surfaceRoot.children[vi];
      if (ch.name === "vesperShipCabin") volCabin = ch;
      else if (ch.name === "vesperDockComplex") volDock = ch;
    }
    placeToast("Pad under you · " + bodyName + " — hangar ahead, cabin to the side", 2600);
    // Do NOT auto-complete missions on mere land — that is checklist emptiness
    maybeNoteArrival(bodyName);
  }

  function maybeNoteArrival(bodyName) {
    // Rubric: land = lived-in place, not an empty checkbox. Arrival only tips; hubs complete via walk.
    const tips = MISSION_DEFS.filter((m) => m.body && m.body === bodyName && !loadProgress()[m.id]);
    if (tips.length) {
      placeToast("Open · " + tips[0].title + " — walk the hub (not auto-cleared)", 2800);
    }
  }
  function maybeAdvanceMissions(bodyName) {
    // legacy no-op alias — use hub proximity / completeHubMission
    maybeNoteArrival(bodyName);
  }

  function completeHubMission(hubId) {
    const prog = loadProgress();
    let changed = false;
    MISSION_DEFS.forEach((m) => {
      if (prog[m.id]) return;
      if (m.hub === hubId) {
        prog[m.id] = { done: true, at: Date.now() };
        changed = true;
        placeToast("Activity · " + m.title + " ✓ — " + m.reward, 3200);
      }
    });
    if (changed) {
      saveProgress(prog);
      refreshMissionHud();
    }
  }

  function boot(ctx) {
    THREE = ctx.THREE;
    scene = ctx.scene;
    if (!THREE || !scene) return;
    if (rootGroup) return;
    rootGroup = new THREE.Group();
    rootGroup.name = "vesperPlaces";
    scene.add(rootGroup);
    ensureHud();
    refreshMissionHud();

    // Defer orbital hubs until bodies exist
    setTimeout(() => {
      HUB_DEFS.filter((d) => d.kind !== "surface").forEach((d) => {
        try {
          placeOrbitalHub(d);
        } catch (e) {
          console.warn("[vesper-places] hub", d.id, e);
        }
      });
      // Soft hostile contacts (non-FPS) — dark buoys to approach carefully / flare
      for (let i = 0; i < 5; i++) {
        const a = i * 1.35 + 0.4;
        const r = orbitAU(35 + i * 8);
        const wrap = new THREE.Group();
        wrap.name = "hostileContact:" + i;
        const hull = new THREE.Mesh(
          new THREE.OctahedronGeometry(1.2, 0),
          window.VesperMat({
            color: 0x2a1010, metalness: 0.5, roughness: 0.45,
            emissive: 0x801010, emissiveIntensity: 0.45,
          })
        );
        wrap.add(hull);
        const pl = window.VesperNoLight(0xff4020, 0.5, 20, 2);
        wrap.add(pl);
        wrap.position.set(Math.cos(a) * r, 30 + i * 10, Math.sin(a) * r);
        wrap.userData.hostile = true;
        rootGroup.add(wrap);
        hubs.push({ def: { id: "hostile-" + i, name: "Dark Contact " + (i + 1), blurb: "Unregistered dock · flare recommended", purpose: "conflict", hyp: false }, wrap: wrap, surface: false, hostile: true });
      }
      placeToast("Places live · " + hubs.length + " hubs · activities on HUD", 2600);
    }, 900);

    window.addEventListener("vesper:straight", applySolHubs);
  window.addEventListener("vesper:walk", (ev) => {
      const body = ev && ev.detail && ev.detail.body;
      if (body) onSurfaceAttach(body);
    });
  }

  const NPC_LINES = [
    "Keep your suit seals honest — cold is patient.",
    "Sky Radio clears up near the relay dishes.",
    "If you soft-land slow, the pad remembers you kindly.",
    "Trojan camps trade ice for stories. Bring either.",
    "Hyp plaques are fiction — still worth reading.",
    "Deimos Yard night watch leaves tea in the thermos.",
    "Notebook (N) keeps what the clock forgets.",
    "Oort buoys are lonely; say hello on the way out.",
    "Hope beacons are for the next pilot, not the screenshot.",
    "Ring skim soft — don't punch the plane.",
  ];

  function leaveHow() {
    const touch =
      (typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches) ||
      "ontouchstart" in window;
    return touch ? ("hold " + "▲" + " to leave") : "Space to leave";
  }

  function hypWalkName(body) {
    if (!body) return false;
    if (/\(Hyp\)/.test(body)) return true;
    try {
      const hn = window.VesperHypothetics && window.VesperHypothetics.names && window.VesperHypothetics.names();
      if (hn && hn.indexOf(body) >= 0) return true;
    } catch (_) {}
    try {
      const list = window.VesperSky && window.VesperSky._bodiesRef && window.VesperSky._bodiesRef();
      const hb = list && list.find((x) => x && x.name === body);
      if (hb && hb.hypothetic) return true;
    } catch (_) {}
    return false;
  }

  function honestWalkLine(body) {
    if (body === "Venus") return "Display fiction — real surface would crush a suit. ";
    if (body === "Jupiter" || body === "Saturn" || body === "Uranus" || body === "Neptune") return "Cloud-deck walk is display fiction. ";
    if (body === "Starman Roadster") return "Educational replica · eccentric path, not a brand ad. ";
    return "";
  }

  function setAboard(id, label, hubId, flight) {
    const prev = aboardId;
    aboardId = id || null;
    try { window.__vesperAboard = aboardId; } catch (_) {}
    const comms = window.VesperComms;
    if (prev === "cabin" && aboardId !== "cabin" && comms && comms.setShipComputer) {
      comms.setShipComputer(false);
    }
    const wh = document.getElementById("walk-hint");
    if (!aboardId) {
      if (wh && flight && flight.walking) {
        const body = flight.walkBody || flight.surfaceBody || "the pad";
        const hypPad = hypWalkName(body);
        wh.textContent = (hypPad ? "Hyp fiction · " : "") + honestWalkLine(body) + "On " + body + " · hangar ahead · cabin beside the pad · " + leaveHow() + "";
      }
      return;
    }
    if (aboardId === "cabin") {
      if (comms && comms.say) comms.say("Aboard the cabin. Computer is up. Hold up to leave the surface.");
      if (comms && comms.setShipComputer) comms.setShipComputer(true, { quiet: true });
      const cabBody = flight && (flight.walkBody || flight.surfaceBody);
      if (wh) wh.textContent = (hypWalkName(cabBody) ? "Hyp fiction · " : "") + honestWalkLine(cabBody) + "Aboard cabin · computer up · " + leaveHow() + " the surface";
    } else if (aboardId === "hangar") {
      if (comms && comms.say) comms.say("In the hangar. Market, lounge, and the job board are in here. Cabin is beside the pad.");
      const hangBody = flight && (flight.walkBody || flight.surfaceBody);
      if (wh) wh.textContent = (hypWalkName(hangBody) ? "Hyp fiction · " : "") + honestWalkLine(hangBody) + "Inside the hangar · walk out to the cabin · " + leaveHow() + "";
    } else {
      if (comms && comms.say) comms.say("Inside " + (label || "the bay") + ".");
      if (hubId) {
        try { completeHubMission(hubId); } catch (_) {}
      }
      let hypBay = false;
      if (hubId) {
        for (let hi = 0; hi < hubs.length; hi++) {
          if (hubs[hi].def && hubs[hi].def.id === hubId && hubs[hi].def.hyp) hypBay = true;
        }
      }
      const bayBody = flight && (flight.walkBody || flight.surfaceBody);
      if (wh) wh.textContent = (hypBay || hypWalkName(bayBody) ? "Hyp fiction · " : "") + honestWalkLine(bayBody) + "Inside " + (label || "bay") + " · walk out · " + leaveHow() + "";
    }
  }

  function tickInteriors(flight) {
    if (!flight || !flight.walking || !flight.pos || !landedRoot || !landedRoot.parent || !THREE) {
      if (aboardId) setAboard(null, null, null, flight);
      return;
    }
    if (!_surfLocal) _surfLocal = new THREE.Vector3();
    _surfLocal.copy(flight.pos);
    landedRoot.worldToLocal(_surfLocal);
    const x = _surfLocal.x;
    const z = _surfLocal.z;
    let next = null;
    let label = null;
    let hubId = null;
    const cabin = volCabin && volCabin.parent ? volCabin : null;
    if (cabin) {
      const lx = x - cabin.position.x;
      const lz = z - cabin.position.z;
      if (Math.abs(lx) < 2.85 && lz > -5.85 && lz < 8.5) {
        next = "cabin";
        label = "Vesper cabin";
      }
    }
    if (!next) {
      const kids = landedRoot.children;
      let bestBay = Infinity;
      for (let i = 0; i < kids.length; i++) {
        const ch = kids[i];
        if (!ch.name || ch.name.indexOf("interiorBay:") !== 0) continue;
        const lx = x - ch.position.x;
        const lz = z - ch.position.z;
        if (Math.abs(lx) < 4.5 && Math.abs(lz) < 3.5) {
          const d2 = lx * lx + lz * lz;
          if (next == null || d2 < bestBay) {
            bestBay = d2;
            next = ch.name;
            label = (ch.userData && ch.userData.bayLabel) || "bay";
            hubId = ch.userData && ch.userData.hubId;
          }
        }
      }
    }
    if (!next) {
      const dock = volDock && volDock.parent ? volDock : null;
      if (dock) {
        const lx = x - dock.position.x;
        const lz = z - dock.position.z;
        if (Math.abs(lx) < 8.5 && lz > -11.4 && lz < 7.5) {
          next = "hangar";
          label = "pad hangar";
        }
      }
    }
    if (next !== aboardId) setAboard(next, label, hubId, flight);
  }

  function tick(dt, flight) {
    npcPulse += dt || 0.016;
    tickDockTraffic(dt);
    tickInteriors(flight);
    // Pulse activity beacons
    // Only the landed outpost, dock, and cabin. A full-scene walk here
    // touched every planet and star on each frame.
    for (let li = liveRoots.length - 1; li >= 0; li--) {
      const live = liveRoots[li];
      if (!live.parent) { liveRoots.splice(li, 1); continue; }
      live.traverse((ch) => {
        if (ch.name === "activityBeacon" && ch.material) {
          ch.material.emissiveIntensity = 0.8 + 0.5 * Math.sin(npcPulse * 3);
        }
        if (ch.name === "npc" && ch.rotation) {
          ch.rotation.y = Math.sin(npcPulse * 0.9 + (ch.id || 0)) * 0.05;
        }
        if (ch.name === "dockStatusScreen" && ch.material) {
          ch.material.emissiveIntensity = 0.55 + 0.35 * (0.5 + 0.5 * Math.sin(npcPulse * 4));
        }
        if (ch.name === "outpostStatusScreen" && ch.material) {
          ch.material.emissiveIntensity = 0.45 + 0.35 * (0.5 + 0.5 * Math.sin(npcPulse * 3.2));
        }
        if (ch.name === "cabinDataPadScreen" && ch.material) {
          ch.material.emissiveIntensity = 0.45 + 0.3 * (0.5 + 0.5 * Math.sin(npcPulse * 2.8));
        }
        if (ch.name === "dockRadioBlink" && ch.material) {
          ch.material.emissiveIntensity = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(npcPulse * 6));
        }
        if (ch.name === "outpostVent" && ch.material) {
          ch.material.emissiveIntensity = 0.3 + 0.35 * (0.5 + 0.5 * Math.sin(npcPulse * 2.2));
        }
        // Subtle settlement traffic / ops motion (no NPC count inflate)
        if (ch.name === "dockCraneBoom" && ch.rotation) {
          ch.rotation.y = Math.sin(npcPulse * 0.35) * 0.12;
        }
        if (ch.name === "dockCraneHook" && ch.position) {
          ch.position.y = 4.5 + Math.sin(npcPulse * 0.7) * 0.25;
        }
        if (ch.name === "dockBayLoader" && ch.position) {
          ch.position.x = -2.5 + Math.sin(npcPulse * 0.25) * 0.35;
        }
        if (ch.name === "dockBayWorker" && ch.rotation) {
          ch.rotation.y = Math.sin(npcPulse * 0.6) * 0.15;
        }
        if (ch.name === "dockHoseValveGlow" && ch.material) {
          ch.material.emissiveIntensity = 0.45 + 0.4 * (0.5 + 0.5 * Math.sin(npcPulse * 3.5));
        }
        if (ch.name === "dockConveyorSeg" && ch.material) {
          const i = (ch.userData && ch.userData.segIndex) || 0;
          ch.material.emissiveIntensity = 0.25 + 0.45 * (0.5 + 0.5 * Math.sin(npcPulse * 2.8 - i * 0.7));
        }
        if (ch.name === "dockApproachBeaconLamp" && ch.material) {
          ch.material.emissiveIntensity = 0.55 + 0.55 * (0.5 + 0.5 * Math.sin(npcPulse * 4.2));
        }
        if (ch.name === "hangarMouthLights" && ch.material) {
          ch.material.emissiveIntensity = 0.55 + 0.4 * (0.5 + 0.5 * Math.sin(npcPulse * 2.1));
        }
        if (ch.name === "dockMarketOpenSign" && ch.material) {
          ch.material.emissiveIntensity = 0.55 + 0.4 * (0.5 + 0.5 * Math.sin(npcPulse * 2.6));
        }
        if (ch.name === "dockBayWorkerB" && ch.rotation) {
          ch.rotation.y = Math.sin(npcPulse * 0.45 + 1.2) * 0.18;
        }
        if (ch.name === "dockLoungeSitter" && ch.rotation) {
          ch.rotation.y = 0.4 + Math.sin(npcPulse * 0.3) * 0.05;
        }
        if (ch.name === "dockWorkBayLamp" && ch.material) {
          ch.material.emissiveIntensity = 0.65 + 0.3 * (0.5 + 0.5 * Math.sin(npcPulse * 1.8));
        }
        if (ch.name === "dockWorkBayScreen" && ch.material) {
          ch.material.emissiveIntensity = 0.55 + 0.25 * Math.sin(npcPulse * 1.2);
        }
        if (ch.name === "dockBayStatusBanner" && ch.material) {
          ch.material.emissiveIntensity = 0.5 + 0.3 * (0.5 + 0.5 * Math.sin(npcPulse * 1.6 + (ch.position.x || 0)));
        }
        if (ch.name === "dockOpsAnnexScreen" && ch.material) {
          ch.material.emissiveIntensity = 0.55 + 0.25 * Math.sin(npcPulse * 1.3);
        }
        if (ch.name === "dockFuelIslandLamp" && ch.material) {
          ch.material.emissiveIntensity = 0.6 + 0.35 * (0.5 + 0.5 * Math.sin(npcPulse * 2.2));
        }
        if (ch.name === "dockApproachLeadIn" && ch.material) {
          const z = (ch.position && ch.position.z) || 0;
          ch.material.emissiveIntensity = 0.45 + 0.4 * (0.5 + 0.5 * Math.sin(npcPulse * 3.0 - z * 0.4));
        }
        if (ch.name === "dockCommTowerBlink" && ch.material) {
          ch.material.emissiveIntensity = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(npcPulse * 5.0));
        }
        if (ch.name === "cabinStatusLed" && ch.material) {
          ch.material.emissiveIntensity = 0.45 + 0.4 * (0.5 + 0.5 * Math.sin(npcPulse * 2.4));
        }
        if (ch.name === "cabinLSFan" && ch.rotation) {
          ch.rotation.z += (dt || 0.016) * 1.8;
        }
        if (ch.name === "cabinBunkLed" && ch.material) {
          ch.material.emissiveIntensity = 0.55 + 0.25 * Math.sin(npcPulse * 1.1);
        }
        if (ch.name === "dockPadRover" && ch.rotation) {
          ch.rotation.y = Math.sin(npcPulse * 0.15) * 0.08;
        }
        if ((ch.name === "outpostStatusBoard" || ch.name === "dockStatusBoard") && ch.traverse) {
          ch.traverse(function (sub) {
            if (sub.isMesh && sub.material && sub.material.emissiveIntensity != null && sub.geometry && sub.geometry.type === "PlaneGeometry") {
              sub.material.emissiveIntensity = 0.55 + 0.2 * Math.sin(npcPulse * 1.4);
            }
          });
        }
      });
    }
    // Walking near NPC → occasional line (not spam)
    if (flight && flight.walking && flight.pos && liveRoots.length) {
      if (!tick._npcAcc) tick._npcAcc = 0;
      tick._npcAcc += dt || 0;
      if (tick._npcAcc > 4.5) {
        tick._npcAcc = 0;
        let nearNpc = false;
        if (!_npcWp) _npcWp = new THREE.Vector3();
        for (let lj = 0; lj < liveRoots.length && !nearNpc; lj++) {
          const live = liveRoots[lj];
          if (!live.parent) continue;
          live.traverse((ch) => {
            if (nearNpc || ch.name !== "npc") return;
            ch.getWorldPosition(_npcWp);
            if (_npcWp.distanceTo(flight.pos) < 2.8) nearNpc = true;
          });
        }
        if (nearNpc) {
          const line = NPC_LINES[(Math.random() * NPC_LINES.length) | 0];
          placeToast("NPC · " + line, 2800);
        }
      }
    }
    // Keep body-attached orbital hubs following their parent (Earth/ISS/etc.)
    for (let i = 0; i < hubs.length; i++) {
      const h = hubs[i];
      if (h.surface || !h.wrap || !h.followBody) continue;
      const b = findBody(h.followBody);
      if (!b || !b.pos) continue;
      const slot = followSlot(b, h.wrap.userData.followY || 0, h.wrap.userData.followAngle);
      h.wrap.position.set(slot.x, slot.y, slot.z);
    }
    // Surface desks are parented to the ground. The flight test below
    // returns while walking and skips surface hubs, so a desk visit never
    // counted. 3.2 m is inside the pad offset, not the landing spot.
    if (flight && flight.walking && flight.pos && !(aboardId && String(aboardId).indexOf("interiorBay:") === 0)) {
      if (!_npcWp) _npcWp = new THREE.Vector3();
      let nearH = null;
      let nearD = 3.2;
      for (let si = 0; si < hubs.length; si++) {
        const h = hubs[si];
        if (!h.surface || !h.wrap || !h.wrap.parent) continue;
        h.wrap.getWorldPosition(_npcWp);
        const sd = _npcWp.distanceTo(flight.pos);
        if (sd < nearD) { nearD = sd; nearH = h; }
        else if (sd > 4.4) h._near = false;
      }
      if (nearH && !nearH._near) {
        nearH._near = true;
        const dfn = nearH.def || {};
        if (nearH.hostile) {
          placeToast("⚠ Dark contact · keep distance or carry flare (talk Kael)", 3000);
        } else {
          placeToast((dfn.hyp ? "Hyp · " : "") + (dfn.name || "Desk") + " — " + (dfn.blurb || ""), 2800);
          if (dfn.id) completeHubMission(dfn.id);
        }
        try {
          window.dispatchEvent(new CustomEvent("vesper:place-near", {
            detail: { id: dfn.id, name: dfn.name, purpose: dfn.purpose, hyp: !!dfn.hyp },
          }));
        } catch (_) {}
      }
    }
    // Near orbital hub → toast + mission
    if (!flight || !flight.pos || flight.walking) return;
    let nearOrb = null;
    let nearOrbD = 12;
    for (let i = 0; i < hubs.length; i++) {
      const h = hubs[i];
      if (h.surface || !h.wrap) continue;
      const dx = flight.pos.x - h.wrap.position.x;
      const dy = flight.pos.y - h.wrap.position.y;
      const dz = flight.pos.z - h.wrap.position.z;
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (d < nearOrbD) { nearOrbD = d; nearOrb = h; }
      else h._near = false;
    }
    if (nearOrb && !nearOrb._near) {
      nearOrb._near = true;
      const dfn = nearOrb.def;
      if (nearOrb.hostile) {
        placeToast("⚠ Dark contact · keep distance or carry flare (talk Kael)", 3000);
      } else {
        placeToast((dfn.hyp ? "Hyp · " : "") + dfn.name + " — " + dfn.blurb, 2800);
        completeHubMission(dfn.id);
      }
      try {
        window.dispatchEvent(new CustomEvent("vesper:place-near", { detail: { id: dfn.id, name: dfn.name, purpose: dfn.purpose, hyp: !!dfn.hyp } }));
      } catch (_) {}
    }
  }

  window.VesperPlaces = {
    boot,
    tick,
    onSurfaceAttach,
    ensureDockComplex,
    attachShipCabin,
    setMissionHudOpen,
    refreshMissionHud,
    hubs: () => hubs.slice(),
    missions: () => MISSION_DEFS.slice(),
    trafficState,
  };
})();
