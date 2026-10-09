/**
 * VesperLife — Starfield/ME/EVE/Halo *feel* life layer (IP-free).
 * Cities, HD-ish human NPCs (procedural skin + suit canvases), inventory,
 * multi-step quests, guilds, conflict/romance threads, ground rover.
 * Anti-empty: every city block has purpose; no icon checklist spam.
 */
(function () {
  "use strict";

  let THREE, scene, cityRoot;
  let inv = [];
  let journal = [];
  let guilds = {};
  let threads = {};
  let rover = null;
  let marketSign = null;
  let walkSurface = null;
  let driving = false;
  let ui = { inv: null, journal: null, talk: null };
  let activeTalk = null;
  let bootOnce = false;

  const LS_INV = "vesper.life.inv.v1";
  const LS_QUEST = "vesper.life.quest.v1";
  const LS_GUILD = "vesper.life.guild.v1";
  const LS_THREAD = "vesper.life.thread.v1";

  const ITEM_CATALOG = [
    { id: "hope-beacon-kit", name: "Hope Beacon Kit", kind: "gear", rare: "common", blurb: "Plant a care light for the next pilot." },
    { id: "ore-tag-ceres", name: "Occator Salt Tag", kind: "collectible", rare: "uncommon", blurb: "Assay stamp from Ceres salts." },
    { id: "ice-vial-europa", name: "Europa Ice Vial", kind: "collectible", rare: "rare", blurb: "Sealed lineae frost — handle soft." },
    { id: "suit-patch", name: "Suit Patch Pack", kind: "gear", rare: "common", blurb: "Clinic-grade seal tape." },
    { id: "sky-radio-crystal", name: "Sky Radio Crystal", kind: "gear", rare: "uncommon", blurb: "Clears Skytape static near relays." },
    { id: "trojan-ice", name: "Trojan Camp Ice", kind: "trade", rare: "common", blurb: "Greek camp trade brick." },
    { id: "hyp-plaque-rubbing", name: "Hyp Plaque Rubbing", kind: "collectible", rare: "rare", blurb: "Fiction plaque charcoal — labeled Hyp." },
    { id: "rover-key", name: "Rover Keyfob", kind: "gear", rare: "uncommon", blurb: "Wake a surface rover (G to drive)." },
    { id: "guild-pin-assay", name: "Assay Guild Pin", kind: "guild", rare: "uncommon", blurb: "Belt Assay Cooperative mark." },
    { id: "guild-pin-refuge", name: "Refuge Circle Pin", kind: "guild", rare: "uncommon", blurb: "LEO Refuge mutual-aid mark." },
    { id: "guild-pin-yard", name: "Deimos Yard Pin", kind: "guild", rare: "uncommon", blurb: "Night watch mark — tea optional." },
    { id: "letter-mira", name: "Letter from Mira", kind: "story", rare: "rare", blurb: "Warm, careful — open in journal." },
    { id: "warning-kael", name: "Kael's Warning Chip", kind: "story", rare: "rare", blurb: "Conflict thread — read before docking dark." },
    { id: "starman-plaque-photo", name: "Starman Plaque Photo", kind: "collectible", rare: "uncommon", blurb: "Educational replica photo — not a brand ad." },
    { id: "methane-sample", name: "Titan Shore Sample", kind: "collectible", rare: "uncommon", blurb: "Thick-sky postcard in a bottle." },
    { id: "weapon-flare", name: "Distress Flare Gun", kind: "gear", rare: "common", blurb: "Nonlethal signal — conflict deter, not FPS." },
    { id: "weapon-scanner", name: "Hand Scanner", kind: "gear", rare: "uncommon", blurb: "Reads hub purpose tags · assay assist." },
    { id: "med-foam", name: "Med Foam Canister", kind: "gear", rare: "common", blurb: "Refuge clinic staple." },
    { id: "guild-pin-listen", name: "Deep Listen Pin", kind: "guild", rare: "uncommon", blurb: "Outer radio mark." },
    { id: "photo-earth-night", name: "Earth Nightsides Photo", kind: "collectible", rare: "uncommon", blurb: "City-light postcard." },
    { id: "comet-ice-shard", name: "Comet Ice Shard", kind: "collectible", rare: "rare", blurb: "Oort whisper souvenir (display)." },
    { id: "weapon-beacon-remote", name: "Beacon Remote", kind: "gear", rare: "uncommon", blurb: "Arm a Hope kit from inventory · care signal." },
    { id: "spare-thruster-tip", name: "Spare Thruster Tip", kind: "trade", rare: "common", blurb: "Honest scrap · Spare Parts Drift." },
    { id: "uranian-fault-chalk", name: "Uranian Fault Chalk", kind: "collectible", rare: "uncommon", blurb: "Miranda/Ariel canyon map stub." },
    { id: "letter-quill", name: "Shore Note from Quill", kind: "story", rare: "rare", blurb: "Romance thread · thick-sky handwriting." },
    { id: "phoebe-boulder-tag", name: "Phoebe Boulder Tag", kind: "collectible", rare: "uncommon", blurb: "Captured-yard assay sample." },
    { id: "weapon-signal-lamp", name: "Signal Lamp", kind: "gear", rare: "uncommon", blurb: "Nonlethal dock lamp — hail dark contacts clean." },
    { id: "geo-nightsides-chip", name: "GEO Nightsides Chip", kind: "collectible", rare: "uncommon", blurb: "Earth city-light memory from GEO rest." },
    { id: "quaoar-ring-note", name: "Quaoar Ring Note", kind: "collectible", rare: "rare", blurb: "Ring rumor chalk — classical Kuiper." },
    { id: "library-card-belt", name: "Belt Library Card", kind: "guild", rare: "uncommon", blurb: "Drift library quiet stamp." },
    { id: "letter-mira-2", name: "Mira's Second Letter", kind: "story", rare: "rare", blurb: "Romance deepen — kettle still on." },
    { id: "conflict-log-kael", name: "Kael Restraint Log", kind: "story", rare: "rare", blurb: "Conflict thread — Listen Society filed your evade." },
    { id: "amalthea-caution", name: "Amalthea Caution Tag", kind: "gear", rare: "common", blurb: "Radiation honesty · short EVA only." },
    { id: "tea-brick-belt", name: "Belt Tea Brick", kind: "trade", rare: "common", blurb: "Recycled leaf · Tea House Drift." },
    { id: "tycho-ray-photo", name: "Tycho Ray Photo", kind: "collectible", rare: "uncommon", blurb: "Bright ray postcard from the Moon." },
    { id: "olympus-dust-tag", name: "Olympus Dust Tag", kind: "collectible", rare: "uncommon", blurb: "Overlook dust sample · Brick smiles." },
    { id: "weapon-hail-beacon", name: "Hail Beacon Wand", kind: "gear", rare: "uncommon", blurb: "Nonlethal hail — longer range than lamp." },
    { id: "letter-sable", name: "Sable Mediation Note", kind: "story", rare: "rare", blurb: "Conflict thread — hail clean, leave clean." },
    { id: "guild-pin-tea", name: "Tea House Pin", kind: "guild", rare: "uncommon", blurb: "Belt tea social mark." },
    { id: "janus-swap-chalk", name: "Janus Co-orbit Chalk", kind: "collectible", rare: "uncommon", blurb: "Co-orbit tip · Epimetheus waltz · two circles." },
    { id: "night-market-token", name: "Night Market Token", kind: "trade", rare: "common", blurb: "Belt night trade · honest scrap." },
    { id: "hope-desk-stamp", name: "Hope Desk Stamp", kind: "guild", rare: "uncommon", blurb: "Belt Hope Desk refuge mark." },
    { id: "marineris-dust", name: "Marineris Rim Dust", kind: "collectible", rare: "uncommon", blurb: "Canyon rim sample · Brick nods." },
    { id: "copernicus-photo", name: "Copernicus Overlook Photo", kind: "collectible", rare: "uncommon", blurb: "Quiet ray-adjacent postcard." },
    { id: "ligeia-postcard", name: "Ligeia Shore Postcard", kind: "collectible", rare: "uncommon", blurb: "Thick-sky annex · Quill tip." },
    { id: "letter-haven", name: "Note from Haven", kind: "story", rare: "rare", blurb: "Romance · tea logistics across AU." },
    { id: "weapon-patch-gun", name: "Seal Injector", kind: "gear", rare: "uncommon", blurb: "Field seal tool · clinic vibe, not FPS." },
    { id: "guild-pin-hope", name: "Hope Desk Pin", kind: "guild", rare: "uncommon", blurb: "Care stamp · Wren's desk." },
    { id: "davida-ore-chip", name: "Davida Ore Chip", kind: "collectible", rare: "uncommon", blurb: "Large-belt sample · Assay tip." },
    { id: "letter-wren", name: "Care Note from Wren", kind: "story", rare: "rare", blurb: "Romance-adjacent · plant light, don't rush." },
    { id: "guild-pin-guildhall", name: "Guild Hall Pin", kind: "guild", rare: "uncommon", blurb: "Belt Guild Hall social mark." },
    { id: "tranquility-photo", name: "Tranquility Walk Photo", kind: "collectible", rare: "uncommon", blurb: "Memorial postcard · quiet." },
    { id: "kraken-north-card", name: "Kraken North Card", kind: "collectible", rare: "uncommon", blurb: "North shore · Quill annex." },
    { id: "weapon-foam-sprayer", name: "Foam Sprayer", kind: "gear", rare: "common", blurb: "Clinic foam tool · seals over speeches." },
    { id: "letter-kira", name: "Night Slip from Kira", kind: "story", rare: "rare", blurb: "Trade thread · honest scrap after hours." },
    { id: "dock-job-chit", name: "Dock Job Chit", kind: "trade", rare: "common", blurb: "Hangar job board stamp · honest work." },
    { id: "airlock-drill-tag", name: "Airlock Drill Tag", kind: "gear", rare: "common", blurb: "Dock Annex practice mark." },
    { id: "rhea-tea-brick", name: "Rhea Quiet Brick", kind: "trade", rare: "common", blurb: "Icy tea cousin · Haven tip." },
    { id: "sputnik-note", name: "Sputnik Desk Note", kind: "collectible", rare: "uncommon", blurb: "Nitrogen hush chalk · Pluto." },
    { id: "jezero-delta-tag", name: "Jezero Delta Tag", kind: "collectible", rare: "uncommon", blurb: "Shore sample · Brick smiles." },
    { id: "shackleton-ice-chip", name: "Shackleton Ice Chip", kind: "collectible", rare: "uncommon", blurb: "Polar rumor · Vessa tip." },
    { id: "letter-tess", name: "Note from Tess", kind: "story", rare: "rare", blurb: "Dock steward · hangar tea logistics." },
    { id: "guild-pin-dock", name: "Dock Hands Pin", kind: "guild", rare: "uncommon", blurb: "Hangar/airlock mutual-aid mark." },
    { id: "weapon-dock-lamp", name: "Dock Approach Lamp", kind: "gear", rare: "uncommon", blurb: "Nonlethal pad flood · hail clean." },
    { id: "iapetus-ridge-photo", name: "Iapetus Ridge Photo", kind: "collectible", rare: "uncommon", blurb: "Walnut ridge postcard." },
    { id: "tiger-stripe-vial", name: "Tiger Stripe Vial", kind: "collectible", rare: "rare", blurb: "Enceladus plume frost · soft handle." },
    { id: "prometheus-ash-tag", name: "Prometheus Ash Tag", kind: "collectible", rare: "uncommon", blurb: "Io heat caution · Pike tip." },
    { id: "vali-tea-brick", name: "Valhalla Tea Brick", kind: "trade", rare: "common", blurb: "Callisto rim tea · archive quiet." },
    { id: "guild-pin-airlock", name: "Airlock School Pin", kind: "guild", rare: "uncommon", blurb: "Drill graduate · Dock Hands cousin." },
    { id: "verona-chalk", name: "Verona Cliff Chalk", kind: "collectible", rare: "uncommon", blurb: "Miranda rupes map stub." },
    { id: "makemake-bright-tag", name: "Makemake Bright Tag", kind: "collectible", rare: "uncommon", blurb: "Far bright sample · Assay." },
    { id: "olympus-overlook-photo", name: "Olympus Overlook Photo", kind: "collectible", rare: "uncommon", blurb: "Dust postcard · Brick." },
    { id: "cupola-nightsides", name: "Cupola Nightsides Chip", kind: "collectible", rare: "uncommon", blurb: "Earth breathe · Refuge tip." },
    { id: "salacia-ice-chip", name: "Salacia Ice Chip", kind: "collectible", rare: "uncommon", blurb: "Kuiper ice hall sample · hush." },
    { id: "eros-saddle-photo", name: "Eros Saddle Photo", kind: "collectible", rare: "uncommon", blurb: "NEAR saddle postcard · Assay tip." },
    { id: "ida-dactyl-photo", name: "Ida–Dactyl Photo", kind: "collectible", rare: "uncommon", blurb: "Overlook postcard toward Dactyl." },
    { id: "oort-hearth-brick", name: "Oort Hearth Brick", kind: "trade", rare: "uncommon", blurb: "Deep tea brick · long-watch fuel." },
    { id: "listen-spur-chip", name: "Listen Spur Chip", kind: "gear", rare: "uncommon", blurb: "Outer radio tip · Deep Listen." },
    { id: "hellas-dust-tag", name: "Hellas Dust Tag", kind: "collectible", rare: "uncommon", blurb: "Basin rim sample · Brick nods." },
    { id: "thrace-chaos-chalk", name: "Thrace Chaos Chalk", kind: "collectible", rare: "uncommon", blurb: "Europa chaos mark · Solis tip." },
    { id: "asgard-tea-brick", name: "Asgard Tea Brick", kind: "trade", rare: "common", blurb: "Callisto Asgard rim tea · quiet." },
    { id: "hyp-core-rubbing", name: "Matrioshka Core Rubbing", kind: "collectible", rare: "rare", blurb: "Hyp nested-shell plaque charcoal — labeled." },
    { id: "letter-rio", name: "Note from Rio", kind: "story", rare: "rare", blurb: "Oort hearth keeper · long-watch logistics." },
    { id: "letter-lumen", name: "Note from Lumen", kind: "story", rare: "rare", blurb: "Hyp plaque curator · fiction stays labeled." },
    { id: "guild-pin-hearth", name: "Hearth Watch Pin", kind: "guild", rare: "uncommon", blurb: "Oort long-watch mutual-aid mark." },
    { id: "weapon-hearth-lamp", name: "Hearth Approach Lamp", kind: "gear", rare: "uncommon", blurb: "Nonlethal deep-dock lamp · hail clean." },
    { id: "night-overflow-token", name: "Night Overflow Token", kind: "collectible", rare: "uncommon", blurb: "After-hours assay mark." },
    { id: "c-type-carbon-tag", name: "C-Type Carbon Tag", kind: "collectible", rare: "uncommon", blurb: "Carbonaceous yard sample · Assay." },
    { id: "longwatch-brick", name: "Longwatch Tea Brick", kind: "trade", rare: "common", blurb: "Oort slow tea · Rio tip." },
    { id: "dark-dock-chip", name: "Dark Dock Caution Chip", kind: "story", rare: "rare", blurb: "Restraint before hail · Kael." },
    { id: "arabia-dust-tag", name: "Arabia Dust Tag", kind: "collectible", rare: "uncommon", blurb: "Terra sample · Brick." },
    { id: "orientale-photo", name: "Orientale Ring Photo", kind: "collectible", rare: "uncommon", blurb: "Multi-ring postcard · quiet." },
    { id: "geo-night-chip", name: "GEO Night Chip", kind: "collectible", rare: "uncommon", blurb: "City-light breathe · Jax." },

  
    { id: "aristarchus-photo", name: "Aristarchus Bright Photo", kind: "collectible", rare: "uncommon", blurb: "Bright crater postcard · memorial quiet." },
    { id: "iris-weight-tag", name: "Iris Weight Tag", kind: "trade", rare: "common", blurb: "Honest assay spur stamp." },
    { id: "punga-postcard", name: "Punga Mare Postcard", kind: "collectible", rare: "uncommon", blurb: "Thick-sky shore card." },
    { id: "lattice-plaque", name: "Lattice Ark Plaque Rubbing", kind: "collectible", rare: "rare", blurb: "Hyp fiction rubbing — labeled." },
    { id: "nix-outer-chalk", name: "Nix Outer Chalk", kind: "collectible", rare: "uncommon", blurb: "Pluto-family outer moon mark. Nix is a real moon." },
    { id: "hiiraki-spin-tag", name: "Hiʻiaka Spin Tag", kind: "collectible", rare: "uncommon", blurb: "Haumea moon sample. Not a Sol day." },
];

  const GUILD_DEFS = [
    { id: "assay", name: "Belt Assay Cooperative", focus: "trade · samples · honest weights" },
    { id: "refuge", name: "LEO Refuge Circle", focus: "mutual aid · radio · spare suits" },
    { id: "listen", name: "Deep Listen Society", focus: "outer radio · Oort · Hyp caution" },
    { id: "yard", name: "Deimos Yard Crew", focus: "hangars · night watch · tea" },
  ];

  const QUEST_DEFS = [
    {
      id: "q-first-yard",
      title: "Night Watch at Deimos Yard",
      guild: "yard",
      steps: [
        { id: "land", text: "Soft-land Deimos", check: "walk:Deimos" },
        { id: "hangar", text: "Enter the hangar bay (walk to crates)", check: "aboard:hangar" },
        { id: "talk", text: "Talk to Yard NPC (tap/E near them)", check: "talk:yard" },
        { id: "item", text: "Pick up Suit Patch Pack", check: "item:suit-patch" },
      ],
      reward: { items: ["suit-patch", "guild-pin-yard"], guild: { yard: 10 }, blurb: "Yard Crew welcomes you." },
    },
    {
      id: "q-assay-run",
      title: "Assay Cooperative Run",
      guild: "assay",
      steps: [
        { id: "hub", text: "Dock Assay Outpost A or B", check: "hub:belt-assay" },
        { id: "ceres", text: "Land Ceres · visit Occator desk", check: "walk:Ceres" },
        { id: "tag", text: "Collect Occator Salt Tag", check: "item:ore-tag-ceres" },
      ],
      reward: { items: ["ore-tag-ceres", "guild-pin-assay"], guild: { assay: 15 }, blurb: "Weights honest. Pin earned." },
    },
    {
      id: "q-mira-letter",
      title: "Mira's Careful Letter",
      guild: "refuge",
      romance: true,
      steps: [
        { id: "leo", text: "Visit LEO Refuge / soft-land Earth", check: "walk:Earth||hub:leo-refuge" },
        { id: "talk", text: "Talk to Mira (branching)", check: "talk:mira" },
        { id: "keep", text: "Keep her letter in inventory", check: "item:letter-mira" },
      ],
      reward: { items: ["letter-mira", "guild-pin-refuge"], guild: { refuge: 12 }, thread: "mira", blurb: "She asked you to write back from somewhere quiet." },
    },
    {
      id: "q-mira-reply",
      title: "Write Mira Back",
      guild: "refuge",
      romance: true,
      steps: [
        { id: "letter", text: "Have Mira's letter", check: "item:letter-mira" },
        { id: "quiet", text: "Stand a quiet shore (Titan or Deimos or Moon)", check: "quiet:shore" },
        { id: "write", text: "Journal → Write Mira back", check: "mira:replied" },
      ],
      reward: { items: ["photo-earth-night"], guild: { refuge: 15 }, thread: "mira", blurb: "She'll read it on the next quiet watch." },
    },
    {
      id: "q-kael-shadow",
      title: "Kael's Shadow Dock",
      guild: "listen",
      conflict: true,
      steps: [
        { id: "warn", text: "Obtain Kael's Warning Chip", check: "item:warning-kael" },
        { id: "flare", text: "Carry a Distress Flare Gun", check: "item:weapon-flare" },
        { id: "kuiper", text: "Approach Kuiper Waystation carefully", check: "hub:kuiper-waystation" },
      ],
      reward: { items: ["warning-kael"], guild: { listen: 10 }, thread: "kael", blurb: "Conflict deterred — flare unused. Listen Society notes your restraint." },
    },
    {
      id: "q-europa-vial",
      title: "Lineae Vial for Listen",
      guild: "listen",
      steps: [
        { id: "land", text: "Soft-land Europa", check: "walk:Europa" },
        { id: "desk", text: "Visit Lineae Field Desk", check: "hub:europa-lineae" },
        { id: "vial", text: "Secure Europa Ice Vial", check: "item:ice-vial-europa" },
      ],
      reward: { items: ["ice-vial-europa", "sky-radio-crystal"], guild: { listen: 14 }, blurb: "Crystal sings clearer near ice." },
    },
    {
      id: "q-rover-wake",
      title: "Wake the Surface Rover",
      guild: "yard",
      steps: [
        { id: "key", text: "Find Rover Keyfob (Earth or Mars city)", check: "item:rover-key" },
        { id: "drive", text: "Press G to drive on a soft-land surface", check: "drive:once" },
      ],
      reward: { items: ["rover-key"], guild: { yard: 8 }, blurb: "Wheels remember dust." },
    },
    {
      id: "q-earth-plaza",
      title: "Earth Plaza Lights",
      guild: "refuge",
      steps: [
        { id: "land", text: "Soft-land Earth", check: "walk:Earth" },
        { id: "talk", text: "Talk to Nova or Mira", check: "talk:nova||talk:mira" },
        { id: "kit", text: "Collect Hope Beacon Kit", check: "item:hope-beacon-kit" },
      ],
      reward: { items: ["hope-beacon-kit"], guild: { refuge: 8 }, blurb: "Plaza remembers care." },
    },
    {
      id: "q-titan-shore",
      title: "Thick Sky Postcard",
      guild: "listen",
      romance: true,
      steps: [
        { id: "land", text: "Land Titan", check: "walk:Titan" },
        { id: "talk", text: "Talk to Quill Ashe", check: "talk:quill" },
        { id: "sample", text: "Take Titan Shore Sample", check: "item:methane-sample" },
      ],
      reward: { items: ["methane-sample"], guild: { listen: 9 }, thread: "quill", blurb: "She said radio is how thick-sky people date." },
    },
    {
      id: "q-mars-dust",
      title: "Brick's Dust Tip",
      guild: "yard",
      steps: [
        { id: "land", text: "Soft-land Mars", check: "walk:Mars" },
        { id: "talk", text: "Talk to Brick Mendez", check: "talk:brick" },
        { id: "key", text: "Secure Rover Keyfob", check: "item:rover-key" },
      ],
      reward: { items: ["rover-key"], guild: { yard: 6 }, blurb: "Patience is a tool." },
    },
    {
      id: "q-garden-scan",
      title: "Garden Scanner",
      guild: "assay",
      steps: [
        { id: "scan", text: "Obtain Hand Scanner (Reed / market)", check: "item:weapon-scanner" },
        { id: "dock", text: "Visit Belt Garden or Assay hub", check: "hub:belt-garden||hub:belt-assay-a||hub:belt-assay-b||hub:belt-assay-c" },
      ],
      reward: { items: ["weapon-scanner", "guild-pin-assay"], guild: { assay: 8 }, blurb: "Tags read clean." },
    },
    {
      id: "q-rim-foam",
      title: "Rim Med Foam",
      guild: "refuge",
      steps: [
        { id: "moon", text: "Soft-land Moon", check: "walk:Moon" },
        { id: "talk", text: "Talk to Vessa Holm", check: "talk:vessa" },
        { id: "foam", text: "Carry Med Foam", check: "item:med-foam" },
      ],
      reward: { items: ["med-foam", "guild-pin-refuge"], guild: { refuge: 7 }, blurb: "Seals before bravado." },
    },
    {
      id: "q-quill-radio",
      title: "Thick-Sky Radio Date",
      guild: "listen",
      romance: true,
      steps: [
        { id: "land", text: "Soft-land Titan", check: "walk:Titan" },
        { id: "talk", text: "Talk to Quill (dating branch)", check: "talk:quill" },
        { id: "sample", text: "Carry Titan Shore Sample", check: "item:methane-sample" },
        { id: "radio", text: "Equip Sky Radio Crystal", check: "item:sky-radio-crystal" },
      ],
      reward: { items: ["sky-radio-crystal"], guild: { listen: 10 }, thread: "quill", blurb: "Radio is how thick-sky people date." },
    },
    {
      id: "q-hangar-count",
      title: "Count the Hangar Crates",
      guild: "yard",
      steps: [
        { id: "land", text: "Soft-land Deimos", check: "walk:Deimos" },
        { id: "talk", text: "Talk to Rafi", check: "talk:yard" },
        { id: "near", text: "Walk hangar / crates", check: "aboard:hangar" },
        { id: "patch", text: "Carry Suit Patch Pack", check: "item:suit-patch" },
      ],
      reward: { items: ["suit-patch", "guild-pin-yard"], guild: { yard: 12 }, blurb: "Crates counted. Tea earned." },
    },
    {
      id: "q-l5-commons",
      title: "L5 Commons Visit",
      guild: "refuge",
      steps: [
        { id: "hub", text: "Find Earth–Moon L5 Commons", check: "hub:earth-lagrange" },
        { id: "kit", text: "Carry Hope Beacon Kit", check: "item:hope-beacon-kit" },
      ],
      reward: { items: ["hope-beacon-kit"], guild: { refuge: 8 }, blurb: "Commons stamp · garden trade tip" },
    },
    {
      id: "q-flare-deter",
      title: "Flare, Don't Fight",
      guild: "listen",
      conflict: true,
      steps: [
        { id: "flare", text: "Obtain Distress Flare Gun", check: "item:weapon-flare" },
        { id: "use", text: "Fire flare near a dark contact (✦ / talk prompt)", check: "flare:once" },
      ],
      reward: { items: ["weapon-flare"], guild: { listen: 12 }, thread: "kael", blurb: "Listen Society logs your restraint." },
    },
    {
      id: "q-oort-whisper",
      title: "Oort Whisper Post",
      blurb: "Drop a Hope note at the Oort buoy — deep quiet, not conquest.",
      steps: [
        { id: "buoy", text: "Find Oort Whisper Buoy (outer system)", check: "hub:oort-whisper" },
        { id: "talk", text: "Talk to Kael or plant a Hope kit at the buoy", check: "kael:oort||hope:planted" },
      ],
      reward: { items: ["sky-radio-crystal"], guild: { listen: 10 }, blurb: "Buoy heard you. Crystal clearer." },
    },
    {
      id: "q-io-caution",
      title: "Io Vent Caution",
      blurb: "Heat-suit honesty — stand the vent watch, don't invent a forge war.",
      steps: [
        { id: "vent", text: "Visit Io Vent Watch", check: "hub:io-vent" },
        { id: "foam", text: "Carry med foam (talk Vessa or market)", check: "item:med-foam" },
      ],
      reward: { items: ["suit-patch"], guild: { yard: 8 }, blurb: "Heat remembered. Seals checked." },
      conflict: true,
    },
    {
      id: "q-quill-booth",
      title: "Quiet Booth Light",
      blurb: "Romance thread — keep Quill's non-blinking booth promise.",
      romance: true,
      steps: [
        { id: "shore", text: "Return to Kraken Shore / talk Quill", check: "hub:titan-shore||talk:quill" },
        { id: "l5", text: "Visit Earth–Moon L5 Commons", check: "hub:earth-lagrange" },
      ],
      reward: { items: ["methane-sample"], guild: { refuge: 8 }, thread: "quill", blurb: "Booth light saved. Tea optional." },
    },
    {
      id: "q-miranda-rail",
      title: "Hold the Verona Rail",
      guild: "listen",
      steps: [
        { id: "land", text: "Soft-land Miranda", check: "walk:Miranda" },
        { id: "hub", text: "Find Verona Rupes Camp", check: "hub:miranda-verona" },
        { id: "chalk", text: "Collect Uranian Fault Chalk", check: "item:uranian-fault-chalk" },
      ],
      reward: { items: ["uranian-fault-chalk", "sky-radio-crystal"], guild: { listen: 10 }, blurb: "Cliff held. Crystal clearer." },
    },
    {
      id: "q-spare-parts",
      title: "Honest Scrap Run",
      guild: "assay",
      steps: [
        { id: "hub", text: "Dock Spare Parts Drift", check: "hub:belt-spare-parts" },
        { id: "tip", text: "Collect Spare Thruster Tip", check: "item:spare-thruster-tip" },
        { id: "talk", text: "Talk Assay weighmaster", check: "talk:assay" },
      ],
      reward: { items: ["spare-thruster-tip", "guild-pin-assay"], guild: { assay: 10 }, blurb: "Scrap weighed true." },
    },
    {
      id: "q-phoebe-tag",
      title: "Phoebe Yard Sample",
      guild: "yard",
      steps: [
        { id: "land", text: "Soft-land Phoebe", check: "walk:Phoebe" },
        { id: "hub", text: "Visit Phoebe Dark Yard", check: "hub:phoebe-dark" },
        { id: "tag", text: "Collect Phoebe Boulder Tag", check: "item:phoebe-boulder-tag" },
      ],
      reward: { items: ["phoebe-boulder-tag", "suit-patch"], guild: { yard: 10 }, blurb: "Dark yard logged." },
    },
    {
      id: "q-quill-note",
      title: "Quill's Shore Note",
      guild: "refuge",
      romance: true,
      steps: [
        { id: "talk", text: "Deepen talk with Quill (romance branch)", check: "talk:quill" },
        { id: "note", text: "Carry Shore Note from Quill", check: "item:letter-quill" },
        { id: "l5", text: "Visit L5 Commons", check: "hub:earth-lagrange" },
      ],
      reward: { items: ["letter-quill"], guild: { refuge: 10 }, thread: "quill", blurb: "Note kept. Booth still waits." },
    },
    {
      id: "q-starman-photo",
      title: "Educate Deck Photo",
      guild: "refuge",
      steps: [
        { id: "hub", text: "Find Starman Educate Deck", check: "hub:starman-educate" },
        { id: "photo", text: "Collect Starman Plaque Photo", check: "item:starman-plaque-photo" },
      ],
      reward: { items: ["starman-plaque-photo"], guild: { refuge: 6 }, blurb: "Educational replica — not an ad." },
    },
    {
      id: "q-library-card",
      title: "Belt Library Quiet",
      guild: "refuge",
      steps: [
        { id: "hub", text: "Dock Belt Drift Library", check: "hub:belt-library" },
        { id: "talk", text: "Talk to Oriole", check: "talk:oriole" },
        { id: "card", text: "Carry Belt Library Card", check: "item:library-card-belt" },
      ],
      reward: { items: ["library-card-belt"], guild: { refuge: 10 }, blurb: "Quiet stamped. Maps welcome." },
    },
    {
      id: "q-geo-chip",
      title: "GEO Nightsides Memory",
      guild: "refuge",
      romance: true,
      steps: [
        { id: "hub", text: "Visit GEO Relay Rest", check: "hub:earth-geo-relay" },
        { id: "talk", text: "Talk to Jax", check: "talk:jax" },
        { id: "chip", text: "Carry GEO Nightsides Chip", check: "item:geo-nightsides-chip" },
      ],
      reward: { items: ["geo-nightsides-chip", "letter-mira-2"], guild: { refuge: 12 }, thread: "mira", blurb: "Chip for Mira's quiet kettle." },
    },
    {
      id: "q-sable-lamp",
      title: "Signal, Don't Invent War",
      guild: "listen",
      conflict: true,
      steps: [
        { id: "talk", text: "Talk to Sable (mediator)", check: "talk:sable" },
        { id: "lamp", text: "Carry Signal Lamp", check: "item:weapon-signal-lamp" },
        { id: "log", text: "File restraint (flare or evade once)", check: "conflict:once" },
      ],
      reward: { items: ["conflict-log-kael", "guild-pin-listen"], guild: { listen: 14 }, thread: "kael", blurb: "Listen Society logs restraint." },
    },
    {
      id: "q-quaoar-note",
      title: "Quaoar Ring Rumor",
      guild: "listen",
      steps: [
        { id: "hub", text: "Visit Quaoar Weywot Desk", check: "hub:quaoar-weywot" },
        { id: "note", text: "Collect Quaoar Ring Note", check: "item:quaoar-ring-note" },
      ],
      reward: { items: ["quaoar-ring-note", "sky-radio-crystal"], guild: { listen: 8 }, blurb: "Ring rumor filed. Crystal clearer." },
    },
    {
      id: "q-amalthea-tag",
      title: "Amalthea Short EVA",
      guild: "yard",
      steps: [
        { id: "land", text: "Soft-land Amalthea", check: "walk:Amalthea" },
        { id: "hub", text: "Find Amalthea Watch Camp", check: "hub:amalthea-watch" },
        { id: "tag", text: "Carry Amalthea Caution Tag", check: "item:amalthea-caution" },
      ],
      reward: { items: ["amalthea-caution", "suit-patch"], guild: { yard: 8 }, blurb: "Radiation honesty kept." },
    },
    {
      id: "q-mira-second",
      title: "Mira's Second Letter",
      guild: "refuge",
      romance: true,
      steps: [
        { id: "first", text: "Have written Mira back once", check: "mira:replied" },
        { id: "chip", text: "Carry GEO Nightsides Chip", check: "item:geo-nightsides-chip" },
        { id: "second", text: "Receive Mira's Second Letter", check: "item:letter-mira-2" },
      ],
      reward: { items: ["letter-mira-2"], guild: { refuge: 10 }, thread: "mira", blurb: "Kettle still on. Come sit." },
    },
    {
      id: "q-ontario-lamp",
      title: "Ontario Lacus Lamp",
      guild: "refuge",
      romance: true,
      steps: [
        { id: "hub", text: "Visit Ontario Lacus Lamp on Titan", check: "hub:titan-ontario" },
        { id: "talk", text: "Talk to Quill", check: "talk:quill" },
        { id: "sample", text: "Carry Titan Shore Sample", check: "item:methane-sample" },
      ],
      reward: { items: ["methane-sample", "letter-quill"], guild: { refuge: 8 }, thread: "quill", blurb: "Lamp shared. Shore note warm." },
    },
    {
      id: "q-chaos-desk",
      title: "Conamara Chaos Desk",
      guild: "listen",
      steps: [
        { id: "hub", text: "Visit Conamara Chaos Desk", check: "hub:europa-chaos" },
        { id: "talk", text: "Talk to Dr. Solis", check: "talk:solis" },
        { id: "vial", text: "Carry Europa Ice Vial", check: "item:ice-vial-europa" },
      ],
      reward: { items: ["ice-vial-europa"], guild: { listen: 8 }, blurb: "Chaos whisper sealed." },
    },
    {
      id: "q-tea-house",
      title: "Belt Tea House Sit",
      guild: "refuge",
      romance: true,
      steps: [
        { id: "hub", text: "Dock Belt Tea House Drift", check: "hub:belt-tea-house" },
        { id: "talk", text: "Talk to Haven", check: "talk:haven" },
        { id: "tea", text: "Carry Belt Tea Brick", check: "item:tea-brick-belt" },
      ],
      reward: { items: ["tea-brick-belt", "guild-pin-tea"], guild: { refuge: 10 }, thread: "haven", blurb: "Tea shared. Belt softer." },
    },
    {
      id: "q-tycho-photo",
      title: "Tycho Ray Postcard",
      guild: "refuge",
      steps: [
        { id: "hub", text: "Visit Tycho Ray Walk", check: "hub:moon-tycho" },
        { id: "talk", text: "Talk to Vessa", check: "talk:vessa" },
        { id: "photo", text: "Collect Tycho Ray Photo", check: "item:tycho-ray-photo" },
      ],
      reward: { items: ["tycho-ray-photo"], guild: { refuge: 8 }, blurb: "Rays logged. Quiet kept." },
    },
    {
      id: "q-olympus-tag",
      title: "Olympus Overlook Dust",
      guild: "yard",
      steps: [
        { id: "hub", text: "Find Olympus Overlook Bench", check: "hub:mars-olympus-bench" },
        { id: "talk", text: "Talk to Brick", check: "talk:brick" },
        { id: "tag", text: "Collect Olympus Dust Tag", check: "item:olympus-dust-tag" },
      ],
      reward: { items: ["olympus-dust-tag", "suit-patch"], guild: { yard: 8 }, blurb: "Dust honest. Seals checked." },
    },
    {
      id: "q-pike-plume",
      title: "Prometheus Plume Caution",
      guild: "listen",
      conflict: true,
      steps: [
        { id: "hub", text: "Visit Prometheus Plume Watch", check: "hub:io-prometheus" },
        { id: "talk", text: "Talk to Pike", check: "talk:pike" },
        { id: "wand", text: "Carry Hail Beacon Wand", check: "item:weapon-hail-beacon" },
      ],
      reward: { items: ["weapon-hail-beacon", "prometheus-ash-tag"], guild: { listen: 10 }, thread: "sable", blurb: "Heat remembered. Hail clean." },
    },
    {
      id: "q-sable-note",
      title: "Sable Mediation Note",
      guild: "listen",
      conflict: true,
      steps: [
        { id: "talk", text: "Talk to Sable", check: "talk:sable" },
        { id: "log", text: "File restraint once", check: "conflict:once" },
        { id: "note", text: "Carry Sable Mediation Note", check: "item:letter-sable" },
      ],
      reward: { items: ["letter-sable"], guild: { listen: 12 }, thread: "sable", blurb: "Mediation filed. Come back alive." },
    },
    {
      id: "q-janus-chalk",
      title: "Janus Co-orbit Chalk",
      guild: "assay",
      steps: [
        { id: "hub", text: "Visit Janus Co-orbit Desk", check: "hub:janus-coorbit" },
        { id: "chalk", text: "Collect Janus Co-orbit Chalk", check: "item:janus-swap-chalk" },
      ],
      reward: { items: ["janus-swap-chalk"], guild: { assay: 6 }, blurb: "Waltz logged. Not a Ceres salt tag." },
    },
    {
      id: "q-haven-quill",
      title: "Tea for the Shore Lamp",
      guild: "refuge",
      romance: true,
      steps: [
        { id: "tea", text: "Carry Belt Tea Brick", check: "item:tea-brick-belt" },
        { id: "quill", text: "Talk to Quill on Titan", check: "talk:quill" },
        { id: "ontario", text: "Visit Ontario Lacus Lamp", check: "hub:titan-ontario" },
      ],
      reward: { items: ["letter-quill", "tea-brick-belt"], guild: { refuge: 10 }, thread: "quill", blurb: "Tea reached the shore. Lamp warmer." },
    },
    {
      id: "q-night-market",
      title: "Belt Night Market Token",
      guild: "assay",
      steps: [
        { id: "hub", text: "Dock Belt Night Market", check: "hub:belt-night-market" },
        { id: "talk", text: "Talk to Kira", check: "talk:kira" },
        { id: "token", text: "Carry Night Market Token", check: "item:night-market-token" },
      ],
      reward: { items: ["night-market-token", "spare-thruster-tip"], guild: { assay: 8 }, blurb: "Night trade honest." },
    },
    {
      id: "q-hope-desk",
      title: "Belt Hope Desk Stamp",
      guild: "refuge",
      romance: true,
      steps: [
        { id: "hub", text: "Visit Belt Hope Desk", check: "hub:belt-hope-desk" },
        { id: "talk", text: "Talk to Wren", check: "talk:wren" },
        { id: "stamp", text: "Carry Hope Desk Stamp", check: "item:hope-desk-stamp" },
      ],
      reward: { items: ["hope-desk-stamp", "hope-beacon-kit"], guild: { refuge: 12 }, thread: "wren", blurb: "Care stamped. Beacon ready." },
    },
    {
      id: "q-marineris",
      title: "Marineris Rim Dust",
      guild: "yard",
      steps: [
        { id: "hub", text: "Find Marineris Rim Camp", check: "hub:mars-marineris" },
        { id: "talk", text: "Talk to Brick", check: "talk:brick" },
        { id: "dust", text: "Collect Marineris Rim Dust", check: "item:marineris-dust" },
      ],
      reward: { items: ["marineris-dust", "suit-patch"], guild: { yard: 8 }, blurb: "Canyon dust honest." },
    },
    {
      id: "q-copernicus",
      title: "Copernicus Quiet Photo",
      guild: "refuge",
      steps: [
        { id: "hub", text: "Visit Copernicus Overlook", check: "hub:moon-copernicus" },
        { id: "talk", text: "Talk to Vessa", check: "talk:vessa" },
        { id: "photo", text: "Collect Copernicus Photo", check: "item:copernicus-photo" },
      ],
      reward: { items: ["copernicus-photo"], guild: { refuge: 6 }, blurb: "Overlook quiet kept." },
    },
    {
      id: "q-ligeia",
      title: "Ligeia Shore Annex",
      guild: "refuge",
      romance: true,
      steps: [
        { id: "hub", text: "Visit Ligeia Shore Lamp", check: "hub:titan-ligeria" },
        { id: "talk", text: "Talk to Quill", check: "talk:quill" },
        { id: "card", text: "Carry Ligeia Shore Postcard", check: "item:ligeia-postcard" },
      ],
      reward: { items: ["ligeia-postcard", "letter-quill"], guild: { refuge: 8 }, thread: "quill", blurb: "Annex lamp shared." },
    },
    {
      id: "q-haven-letter",
      title: "Haven's Tea Note",
      guild: "refuge",
      romance: true,
      steps: [
        { id: "talk", text: "Talk to Haven", check: "talk:haven" },
        { id: "tea", text: "Carry Belt Tea Brick", check: "item:tea-brick-belt" },
        { id: "note", text: "Carry Note from Haven", check: "item:letter-haven" },
      ],
      reward: { items: ["letter-haven"], guild: { refuge: 10 }, thread: "haven", blurb: "Tea logistics are romance too." },
    },
    {
      id: "q-seal-injector",
      title: "Field Seal Injector",
      guild: "yard",
      conflict: true,
      steps: [
        { id: "talk", text: "Talk to Pike or Yard", check: "talk:pike||talk:yard" },
        { id: "tool", text: "Carry Seal Injector", check: "item:weapon-patch-gun" },
        { id: "patch", text: "Carry Suit Patch Pack", check: "item:suit-patch" },
      ],
      reward: { items: ["weapon-patch-gun", "med-foam"], guild: { yard: 10 }, blurb: "Seals before speeches." },
    },
    {
      id: "q-skytape-bay",
      title: "Skytape Bay Drift",
      guild: "listen",
      steps: [
        { id: "hub", text: "Dock Skytape Bay Drift", check: "hub:belt-skytape" },
        { id: "crystal", text: "Carry Sky Radio Crystal", check: "item:sky-radio-crystal" },
      ],
      reward: { items: ["sky-radio-crystal"], guild: { listen: 6 }, blurb: "Bay sings clearer." },
    },
    {
      id: "q-damascus",
      title: "Damascus Sulcus Watch",
      guild: "listen",
      steps: [
        { id: "hub", text: "Visit Damascus Sulcus Watch", check: "hub:enceladus-damascus" },
        { id: "talk", text: "Talk to Solis or stand quiet on the sulcus", check: "talk:solis||quiet:enceladus" },
      ],
      reward: { items: ["tiger-stripe-vial"], guild: { listen: 6 }, blurb: "Stripe whisper sealed." },
    },
    {
      id: "q-leto-quiet",
      title: "Leto L4 Quiet Sit",
      guild: "refuge",
      romance: true,
      steps: [
        { id: "hub", text: "Find Leto L4 Quiet", check: "hub:leto-l4" },
        { id: "tea", text: "Carry Belt Tea Brick", check: "item:tea-brick-belt" },
      ],
      reward: { items: ["tea-brick-belt"], guild: { refuge: 6 }, thread: "haven", blurb: "Quiet annex · tea shared." },
    },
    {
      id: "q-wren-note",
      title: "Wren's Care Note",
      guild: "refuge",
      romance: true,
      steps: [
        { id: "talk", text: "Talk to Wren", check: "talk:wren" },
        { id: "stamp", text: "Carry Hope Desk Stamp", check: "item:hope-desk-stamp" },
        { id: "note", text: "Carry Care Note from Wren", check: "item:letter-wren" },
      ],
      reward: { items: ["letter-wren", "guild-pin-hope"], guild: { refuge: 10 }, thread: "wren", blurb: "Care note kept. Light next." },
    },
    {
      id: "q-davida",
      title: "Davida Belt Sample",
      guild: "assay",
      steps: [
        { id: "hub", text: "Visit Davida Belt Camp", check: "hub:davida-camp" },
        { id: "chip", text: "Collect Davida Ore Chip", check: "item:davida-ore-chip" },
        { id: "talk", text: "Talk Assay", check: "talk:assay" },
      ],
      reward: { items: ["davida-ore-chip", "guild-pin-assay"], guild: { assay: 8 }, blurb: "Large rock weighed true." },
    },
    {
      id: "q-guild-hall",
      title: "Belt Guild Hall Pin",
      guild: "refuge",
      steps: [
        { id: "hub", text: "Dock Belt Guild Hall Drift", check: "hub:belt-guild-hall" },
        { id: "talk", text: "Talk to Dante", check: "talk:dante" },
        { id: "pin", text: "Carry Guild Hall Pin", check: "item:guild-pin-guildhall" },
      ],
      reward: { items: ["guild-pin-guildhall"], guild: { refuge: 8, assay: 4, yard: 4 }, blurb: "Hall stamp · desks remembered." },
    },
    {
      id: "q-tranquility",
      title: "Tranquility Memorial Photo",
      guild: "refuge",
      romance: true,
      steps: [
        { id: "hub", text: "Visit Tranquility Memorial Walk", check: "hub:moon-tranquility" },
        { id: "talk", text: "Talk to Selene", check: "talk:selene" },
        { id: "photo", text: "Collect Tranquility Photo", check: "item:tranquility-photo" },
      ],
      reward: { items: ["tranquility-photo"], guild: { refuge: 8 }, thread: "selene", blurb: "Memorial quiet kept." },
    },
    {
      id: "q-kraken-north",
      title: "Kraken North Annex",
      guild: "refuge",
      romance: true,
      steps: [
        { id: "hub", text: "Visit Kraken North Lamp", check: "hub:titan-kraken-north" },
        { id: "talk", text: "Talk to Quill", check: "talk:quill" },
        { id: "card", text: "Carry Kraken North Card", check: "item:kraken-north-card" },
      ],
      reward: { items: ["kraken-north-card", "letter-quill"], guild: { refuge: 8 }, thread: "quill", blurb: "North lamp shared." },
    },
    {
      id: "q-seal-clinic",
      title: "Seal Clinic Spur",
      guild: "yard",
      conflict: true,
      steps: [
        { id: "hub", text: "Dock Seal Clinic Spur", check: "hub:belt-seal-clinic" },
        { id: "foam", text: "Carry Foam Sprayer or Med Foam", check: "item:weapon-foam-sprayer||item:med-foam" },
        { id: "patch", text: "Carry Suit Patch Pack", check: "item:suit-patch" },
      ],
      reward: { items: ["weapon-foam-sprayer", "med-foam"], guild: { yard: 10 }, blurb: "Clinic vibe · seals over speeches." },
    },
    {
      id: "q-kira-slip",
      title: "Kira's Night Slip",
      guild: "assay",
      steps: [
        { id: "talk", text: "Talk to Kira", check: "talk:kira" },
        { id: "token", text: "Carry Night Market Token", check: "item:night-market-token" },
        { id: "slip", text: "Carry Night Slip from Kira", check: "item:letter-kira" },
      ],
      reward: { items: ["letter-kira"], guild: { assay: 6 }, thread: "kira", blurb: "After-hours honesty filed." },
    },
    {
      id: "q-utopia",
      title: "Utopia Planitia Sit",
      guild: "yard",
      steps: [
        { id: "hub", text: "Find Utopia Planitia Camp", check: "hub:mars-utopia" },
        { id: "talk", text: "Talk to Brick", check: "talk:brick" },
        { id: "key", text: "Carry Rover Keyfob", check: "item:rover-key" },
      ],
      reward: { items: ["rover-key", "suit-patch"], guild: { yard: 6 }, blurb: "Planitia path open." },
    },
    {
      id: "q-adlinda",
      title: "Adlinda Rim Tea",
      guild: "refuge",
      steps: [
        { id: "hub", text: "Visit Adlinda Rim Bench", check: "hub:callisto-adlinda" },
        { id: "talk", text: "Talk to Vessa", check: "talk:vessa" },
        { id: "foam", text: "Carry Med Foam", check: "item:med-foam" },
      ],
      reward: { items: ["med-foam"], guild: { refuge: 6 }, blurb: "Rim tea · seals ready." },
    },

    {
      id: "q-dock-hands",
      title: "Dock Hands Drill",
      guild: "yard",
      steps: [
        { id: "land", text: "Soft-land any world (hangar spawns)", check: "near:hangar" },
        { id: "talk", text: "Talk to Tess (dock steward)", check: "talk:tess" },
        { id: "chit", text: "Pick up Dock Job Chit", check: "item:dock-job-chit" },
      ],
      reward: { items: ["dock-job-chit", "guild-pin-dock"], guild: { yard: 8 }, blurb: "Hangar work keeps Sol lived-in." },
    },
    {
      id: "q-sputnik",
      title: "Sputnik Desk Whisper",
      guild: "listen",
      steps: [
        { id: "pluto", text: "Soft-land Pluto", check: "walk:Pluto" },
        { id: "talk", text: "Talk to Cass", check: "talk:cass" },
        { id: "note", text: "Collect Sputnik Desk Note", check: "item:sputnik-note" },
      ],
      reward: { items: ["sputnik-note"], guild: { listen: 8 }, blurb: "Outer desks stay honest." },
    },
    {
      id: "q-jezero",
      title: "Jezero Shore Path",
      guild: "yard",
      steps: [
        { id: "mars", text: "Soft-land Mars", check: "walk:Mars" },
        { id: "tag", text: "Collect Jezero Delta Tag", check: "item:jezero-delta-tag" },
      ],
      reward: { items: ["jezero-delta-tag"], guild: { yard: 6 }, blurb: "Delta shore · Brick nods." },
    },
    {
      id: "q-tess-note",
      title: "Tess Hangar Note",
      guild: "yard",
      romance: true,
      steps: [
        { id: "talk", text: "Talk to Tess", check: "talk:tess" },
        { id: "letter", text: "Keep her dock note", check: "item:letter-tess" },
      ],
      reward: { items: ["letter-tess"], guild: { yard: 5 }, thread: "tess", blurb: "Hangar tea logistics across AU." },
    },
    {
      id: "q-rhea-tea",
      title: "Rhea Quiet Brick",
      guild: "refuge",
      steps: [
        { id: "rhea", text: "Soft-land Rhea", check: "walk:Rhea" },
        { id: "brick", text: "Collect Rhea Quiet Brick", check: "item:rhea-tea-brick" },
      ],
      reward: { items: ["rhea-tea-brick"], guild: { refuge: 5 }, blurb: "Icy tea cousin · Haven tip." },
    },

    {
      id: "q-airlock-school",
      title: "Airlock School Drift",
      guild: "yard",
      steps: [
        { id: "hub", text: "Visit Airlock School Drift", check: "hub:belt-airlock-school" },
        { id: "tag", text: "Carry Airlock Drill Tag", check: "item:airlock-drill-tag" },
      ],
      reward: { items: ["airlock-drill-tag"], guild: { yard: 6 }, blurb: "Drill twice · Dock Hands nod." },
    },
    {
      id: "q-phoebe",
      title: "Phoebe Captured Yard",
      guild: "assay",
      steps: [
        { id: "land", text: "Soft-land Phoebe", check: "walk:Phoebe" },
        { id: "talk", text: "Talk to Assay or Tess tip", check: "talk:assay||talk:tess" },
      ],
      reward: { items: ["phoebe-boulder-tag"], guild: { assay: 6 }, blurb: "Captured yard · honest tags." },
    },
    {
      id: "q-shackleton-ice",
      title: "Shackleton Ice Chip",
      guild: "refuge",
      steps: [
        { id: "moon", text: "Soft-land Moon", check: "walk:Moon" },
        { id: "chip", text: "Collect Shackleton Ice Chip", check: "item:shackleton-ice-chip" },
      ],
      reward: { items: ["shackleton-ice-chip"], guild: { refuge: 5 }, blurb: "Polar rumor · Vessa tip." },
    },
    {
      id: "q-iapetus-photo",
      title: "Iapetus Ridge Photo",
      guild: "listen",
      steps: [
        { id: "land", text: "Soft-land Iapetus", check: "walk:Iapetus" },
        { id: "photo", text: "Collect ridge photo", check: "item:iapetus-ridge-photo" },
      ],
      reward: { items: ["iapetus-ridge-photo"], guild: { listen: 5 }, blurb: "Walnut ridge · hush." },
    },

    {
      id: "q-verona",
      title: "Verona Rupes Caution",
      guild: "listen",
      steps: [
        { id: "land", text: "Soft-land Miranda", check: "walk:Miranda" },
        { id: "chalk", text: "Collect Verona Cliff Chalk", check: "item:verona-chalk" },
      ],
      reward: { items: ["verona-chalk"], guild: { listen: 5 }, blurb: "Cliff honesty · short EVA." },
    },
    {
      id: "q-olympus",
      title: "Olympus Overlook Photo",
      guild: "yard",
      steps: [
        { id: "mars", text: "Soft-land Mars", check: "walk:Mars" },
        { id: "photo", text: "Collect overlook photo", check: "item:olympus-overlook-photo" },
      ],
      reward: { items: ["olympus-overlook-photo"], guild: { yard: 5 }, blurb: "Dust postcard · Brick." },
    },
    {
      id: "q-cupola",
      title: "Cupola Rest Buoy",
      guild: "refuge",
      steps: [
        { id: "hub", text: "Visit Cupola Rest Buoy", check: "hub:earth-cupola" },
        { id: "chip", text: "Collect nightsides chip", check: "item:cupola-nightsides" },
      ],
      reward: { items: ["cupola-nightsides"], guild: { refuge: 6 }, blurb: "Earth breathe · Refuge." },
    },
    {
      id: "q-salacia",
      title: "Salacia Ice Hall",
      guild: "listen",
      steps: [
        { id: "land", text: "Soft-land Salacia", check: "walk:Salacia" },
        { id: "chip", text: "Collect Salacia Ice Chip", check: "item:salacia-ice-chip" },
      ],
      reward: { items: ["salacia-ice-chip"], guild: { listen: 6 }, blurb: "Kuiper ice hall · hush." },
    },
    {
      id: "q-eros",
      title: "Eros Near Desk",
      guild: "assay",
      steps: [
        { id: "land", text: "Soft-land Eros", check: "walk:Eros" },
        { id: "photo", text: "Collect Eros Saddle Photo", check: "item:eros-saddle-photo" },
      ],
      reward: { items: ["eros-saddle-photo"], guild: { assay: 6 }, blurb: "NEAR saddle · Assay tip." },
    },
    {
      id: "q-ida-dactyl",
      title: "Ida–Dactyl Overlook",
      guild: "assay",
      steps: [
        { id: "land", text: "Soft-land Ida", check: "walk:Ida" },
        { id: "photo", text: "Collect Ida–Dactyl Photo", check: "item:ida-dactyl-photo" },
      ],
      reward: { items: ["ida-dactyl-photo"], guild: { assay: 5 }, blurb: "Overlook toward Dactyl." },
    },
    {
      id: "q-oort-hearth",
      title: "Oort Hearth Buoy",
      guild: "listen",
      steps: [
        { id: "hub", text: "Visit Oort Hearth Buoy", check: "hub:oort-hearth" },
        { id: "talk", text: "Talk to Rio", check: "talk:rio" },
      ],
      reward: { items: ["oort-hearth-brick", "guild-pin-hearth"], guild: { listen: 8 }, blurb: "Long-watch tea · hearth pin." },
    },
    {
      id: "q-listen-spur",
      title: "Kuiper Listen Spur",
      guild: "listen",
      steps: [
        { id: "hub", text: "Visit Kuiper Listen Spur", check: "hub:kuiper-listen-spur" },
        { id: "chip", text: "Carry Listen Spur Chip", check: "item:listen-spur-chip" },
      ],
      reward: { items: ["listen-spur-chip"], guild: { listen: 7 }, blurb: "Outer radio · Deep Listen." },
    },
    {
      id: "q-hellas",
      title: "Hellas Rim Camp",
      guild: "yard",
      steps: [
        { id: "mars", text: "Soft-land Mars", check: "walk:Mars" },
        { id: "tag", text: "Collect Hellas Dust Tag", check: "item:hellas-dust-tag" },
      ],
      reward: { items: ["hellas-dust-tag"], guild: { yard: 5 }, blurb: "Basin rim · Brick nods." },
    },
    {
      id: "q-thrace",
      title: "Thrace Chaos Desk",
      guild: "listen",
      steps: [
        { id: "eu", text: "Soft-land Europa", check: "walk:Europa" },
        { id: "chalk", text: "Collect Thrace Chaos Chalk", check: "item:thrace-chaos-chalk" },
      ],
      reward: { items: ["thrace-chaos-chalk"], guild: { listen: 5 }, blurb: "Chaos desk · Solis tip." },
    },
    {
      id: "q-asgard-tea",
      title: "Asgard Rim Tea",
      guild: "refuge",
      steps: [
        { id: "cal", text: "Soft-land Callisto", check: "walk:Callisto" },
        { id: "brick", text: "Collect Asgard Tea Brick", check: "item:asgard-tea-brick" },
      ],
      reward: { items: ["asgard-tea-brick"], guild: { refuge: 5 }, blurb: "Asgard quiet · archive." },
    },
    {
      id: "q-rio-note",
      title: "Rio Hearth Note",
      guild: "listen",
      romance: true,
      steps: [
        { id: "talk", text: "Talk to Rio", check: "talk:rio" },
        { id: "letter", text: "Keep Rio's note", check: "item:letter-rio" },
      ],
      reward: { items: ["letter-rio"], guild: { listen: 5 }, thread: "rio", blurb: "Long-watch logistics across AU." },
    },
    {
      id: "q-lumen-hyp",
      title: "Lumen Plaque Walk",
      guild: "listen",
      steps: [
        { id: "talk", text: "Talk to Lumen", check: "talk:lumen" },
        { id: "rub", text: "Collect Matrioshka Core Rubbing", check: "item:hyp-core-rubbing" },
      ],
      reward: { items: ["hyp-core-rubbing", "letter-lumen"], guild: { listen: 6 }, blurb: "Hyp stays labeled · Sol desks stay honest." },
    },

    {
      id: "q-mayfly",
      title: "Mayfly Beach Quiet",
      guild: "refuge",
      romance: true,
      steps: [
        { id: "land", text: "Soft-land Titan", check: "walk:Titan" },
        { id: "talk", text: "Talk to Quill", check: "talk:quill" },
        { id: "card", text: "Carry Ligeia or shore card", check: "item:ligeia-postcard||item:punga-postcard" },
      ],
      reward: { items: ["ligeia-postcard"], guild: { refuge: 6 }, blurb: "Thick-sky cafe · soft leave." },
    },
    {
      id: "q-listen-desk",
      title: "Listen Desk Restraint",
      guild: "listen",
      conflict: true,
      steps: [
        { id: "hub", text: "Visit Listen Desk Drift", check: "hub:belt-listen-desk" },
        { id: "talk", text: "Talk to Kael or Sable", check: "talk:kael||talk:sable" },
      ],
      reward: { items: ["warning-kael"], guild: { listen: 7 }, blurb: "Restraint over speeches." },
    },
    {
      id: "q-romance-mail",
      title: "Romance Mail Buoy",
      guild: "refuge",
      romance: true,
      steps: [
        { id: "hub", text: "Visit Romance Mail Buoy", check: "hub:belt-romance-mail" },
        { id: "talk", text: "Talk to Mira or Tess", check: "talk:mira||talk:tess" },
      ],
      reward: { items: ["letter-mira"], guild: { refuge: 5 }, blurb: "Letters beat conquest." },
    },

    {
      id: "q-night-overflow",
      title: "Night Overflow Token",
      guild: "assay",
      steps: [
        { id: "hub", text: "Visit Night Overflow Drift", check: "hub:belt-night-overflow" },
        { id: "tok", text: "Collect Night Overflow Token", check: "item:night-overflow-token" },
      ],
      reward: { items: ["night-overflow-token"], guild: { assay: 5 }, blurb: "After-hours honesty." },
    },
    {
      id: "q-nix",
      title: "Nix Outer Mark",
      guild: "listen",
      steps: [
        { id: "land", text: "Soft-land Nix", check: "walk:Nix" },
        { id: "chalk", text: "Collect Nix Outer Chalk", check: "item:nix-outer-chalk" },
      ],
      reward: { items: ["nix-outer-chalk"], guild: { listen: 5 }, blurb: "Outer hush · Pluto family." },
    },

    {
      id: "q-longwatch",
      title: "Longwatch Buoy Tea",
      guild: "listen",
      steps: [
        { id: "hub", text: "Visit Longwatch Buoy", check: "hub:oort-longwatch" },
        { id: "talk", text: "Talk to Rio", check: "talk:rio" },
        { id: "brick", text: "Carry Longwatch Tea Brick", check: "item:longwatch-brick" },
      ],
      reward: { items: ["longwatch-brick"], guild: { listen: 7 }, blurb: "Slow years · honest tea." },
    },
    {
      id: "q-dark-dock",
      title: "Dark Dock Restraint",
      guild: "listen",
      conflict: true,
      steps: [
        { id: "hub", text: "Visit Dark Dock Caution", check: "hub:oort-dark-dock" },
        { id: "chip", text: "Collect caution chip", check: "item:dark-dock-chip" },
      ],
      reward: { items: ["dark-dock-chip"], guild: { listen: 8 }, blurb: "Hail clean · leave clean." },
    },
    {
      id: "q-c-type",
      title: "C-Type Yard Sample",
      guild: "assay",
      steps: [
        { id: "hub", text: "Visit C-Type Yard Drift", check: "hub:belt-c-type-yard" },
        { id: "tag", text: "Collect carbon tag", check: "item:c-type-carbon-tag" },
      ],
      reward: { items: ["c-type-carbon-tag"], guild: { assay: 6 }, blurb: "Honest carbon · Assay nods." },
    },
    {
      id: "q-orientale",
      title: "Orientale Ring Walk",
      guild: "refuge",
      steps: [
        { id: "moon", text: "Soft-land Moon", check: "walk:Moon" },
        { id: "photo", text: "Collect Orientale photo", check: "item:orientale-photo" },
      ],
      reward: { items: ["orientale-photo"], guild: { refuge: 5 }, blurb: "Multi-ring quiet." },
    },

    {
      id: "q-pulse-buoy",
      title: "Pulse Buoy Hail",
      guild: "listen",
      steps: [
        { id: "hub", text: "Visit Pulse Buoy", check: "hub:oort-pulse" },
        { id: "talk", text: "Talk to Rio or Cass", check: "talk:rio||talk:cass" },
      ],
      reward: { items: ["longwatch-brick"], guild: { listen: 5 }, blurb: "Outer pulse · slow tea." },
    },
    {
      id: "q-kerwan",
      title: "Kerwan Basin Sample",
      guild: "assay",
      steps: [
        { id: "ceres", text: "Soft-land Ceres", check: "walk:Ceres" },
        { id: "talk", text: "Talk to Assay", check: "talk:assay" },
      ],
      reward: { items: ["ore-tag-ceres"], guild: { assay: 5 }, blurb: "Basin honesty." },
    },

    {
      id: "q-tombaugh",
      title: "Tombaugh Heart Desk",
      guild: "listen",
      steps: [
        { id: "pluto", text: "Soft-land Pluto", check: "walk:Pluto" },
        { id: "talk", text: "Talk to Cass", check: "talk:cass" },
      ],
      reward: { items: ["sputnik-note"], guild: { listen: 5 }, blurb: "Heart hush · outer desks." },
    },
    {
      id: "q-solace",
      title: "Solace Refuge Spur",
      guild: "refuge",
      romance: true,
      steps: [
        { id: "hub", text: "Visit Solace Refuge Spur", check: "hub:belt-solace" },
        { id: "talk", text: "Talk to Mira or Wren", check: "talk:mira||talk:wren" },
      ],
      reward: { items: ["med-foam"], guild: { refuge: 5 }, blurb: "Foam over speeches." },
    },
  
    {
      id: "q-iris",
      title: "Iris Assay Weights",
      guild: "assay",
      steps: [
        { id: "hub", text: "Visit Iris Assay Spur", check: "hub:belt-iris" },
        { id: "talk", text: "Talk to Assay", check: "talk:assay" },
      ],
      reward: { items: ["iris-weight-tag"], guild: { assay: 5 }, blurb: "Weights before speeches." },
    },
    {
      id: "q-punga",
      title: "Punga Mare Postcard",
      guild: "listen",
      romance: true,
      steps: [
        { id: "titan", text: "Soft-land Titan", check: "walk:Titan" },
        { id: "talk", text: "Talk to Quill", check: "talk:quill" },
      ],
      reward: { items: ["punga-postcard"], guild: { listen: 5 }, blurb: "Thick-sky handwriting." },
    },
    {
      id: "q-dockhands-b",
      title: "Dock Hands Annex B",
      guild: "yard",
      steps: [
        { id: "hub", text: "Visit Dock Hands Annex B", check: "hub:belt-dockhands-b" },
        { id: "talk", text: "Talk to Tess or Nori", check: "talk:tess||talk:nori" },
      ],
      reward: { items: ["suit-patch"], guild: { yard: 5 }, blurb: "Airlock twice · mean it." },
    },
    {
      id: "q-loki",
      title: "Loki Heat Caution",
      guild: "listen",
      steps: [
        { id: "io", text: "Soft-land Io", check: "walk:Io" },
        { id: "talk", text: "Talk to Pike", check: "talk:pike" },
      ],
      reward: { items: ["prometheus-ash-tag"], guild: { listen: 4 }, blurb: "Heat first, pride never." },
    },
    {
      id: "q-vesper-buoy",
      title: "Vesper Outer Hush",
      guild: "listen",
      romance: true,
      steps: [
        { id: "hub", text: "Visit Vesper Outer Buoy", check: "hub:oort-vesper" },
        { id: "talk", text: "Talk to Rio", check: "talk:rio" },
      ],
      reward: { items: ["longwatch-brick"], guild: { listen: 5 }, blurb: "Outer hush · slow tea." },
    },

    {
      id: "q-hebe",
      title: "Hebe Trade Pins",
      guild: "assay",
      steps: [
        { id: "hub", text: "Visit Hebe Trade Nook", check: "hub:belt-hebe" },
        { id: "talk", text: "Talk to Assay or Ember", check: "talk:assay||talk:ember" },
      ],
      reward: { items: ["iris-weight-tag"], guild: { assay: 4 }, blurb: "Pins over conquest." },
    },
    {
      id: "q-orcus",
      title: "Orcus Binary Desk",
      guild: "listen",
      steps: [
        { id: "orcus", text: "Soft-land Orcus", check: "walk:Orcus" },
        { id: "talk", text: "Talk to Cass", check: "talk:cass" },
      ],
      reward: { items: ["listen-spur-chip"], guild: { listen: 5 }, blurb: "Binary hush. Not Pluto's Sputnik note." },
    },
    {
      id: "q-ember-pad",
      title: "Pad Cargo Honesty",
      guild: "yard",
      steps: [
        { id: "talk", text: "Talk to Ember on a pad", check: "talk:ember" },
        { id: "hub", text: "Visit Dock Hands Annex B", check: "hub:belt-dockhands-b" },
      ],
      reward: { items: ["suit-patch"], guild: { yard: 5 }, blurb: "Stack mass · mean the airlock." },
    },

    {
      id: "q-gale",
      title: "Gale Crater Soft Pad",
      guild: "yard",
      steps: [
        { id: "mars", text: "Soft-land Mars", check: "walk:Mars" },
        { id: "talk", text: "Talk to Brick", check: "talk:brick" },
      ],
      reward: { items: ["olympus-dust-tag"], guild: { yard: 4 }, blurb: "Dust before speeches." },
    },
    {
      id: "q-cupola-b",
      title: "Cupola Annex Nightsides",
      guild: "refuge",
      romance: true,
      steps: [
        { id: "hub", text: "Visit LEO Cupola Annex B", check: "hub:leo-cupola-b" },
        { id: "talk", text: "Talk to Mira or Wren", check: "talk:mira||talk:wren" },
      ],
      reward: { items: ["photo-earth-night"], guild: { refuge: 5 }, blurb: "Nightsides · care light." },
    },
    {
      id: "q-tvashtar",
      title: "Tvashtar Heat First",
      guild: "listen",
      steps: [
        { id: "io", text: "Soft-land Io", check: "walk:Io" },
        { id: "talk", text: "Talk to Pike", check: "talk:pike" },
      ],
      reward: { items: ["prometheus-ash-tag"], guild: { listen: 4 }, blurb: "Heat first." },
    },
];

  const NPC_CAST = [
    { id: "mira", name: "Mira Chen", role: "Refuge medic", skin: [0.92, 0.78, 0.68], suit: 0x4a7a9a, hair: 0x1a1010, romance: true,
      lines: [
        "Breathe. The Refuge keeps spare seals and better tea.",
        "If you write me from somewhere quiet, I'll keep the letter.",
        "Don't confuse Hyp plaques with Sol — fiction is labeled for a reason.",
      ]},
    { id: "kael", name: "Kael Orun", role: "Listen scout", skin: [0.55, 0.42, 0.35], suit: 0x3a3a48, hair: 0x0c0c10, conflict: true,
      lines: [
        "Dark docks don't need heroes. They need restraint.",
        "Take the warning chip. Flare if you must — don't invent a war.",
        "Oort buoys hear everything. So do I.",
      ]},
    { id: "yard", name: "Rafi Okonkwo", role: "Deimos night watch", skin: [0.45, 0.32, 0.26], suit: 0x8a8070, hair: 0x100808,
      lines: [
        "Yard stays lit because someone has to. Tea's on the thermos.",
        "Hangar crates aren't decoration — pick a patch pack.",
        "Phobos looks closer than it is. Don't daydream the burn.",
      ]},
    { id: "assay", name: "Sera Nyx", role: "Assay weighmaster", skin: [0.85, 0.72, 0.62], suit: 0x6a8a70, hair: 0x3a2010,
      lines: [
        "Honest weights or you don't get a pin.",
        "Ceres salts read bright. Bring me a tag, not a story.",
        "Belt market rumors are half true. Assay is the other half.",
      ]},
    { id: "ion", name: "Ion Voss", role: "Helix market runner (Hyp)", skin: [0.78, 0.68, 0.58], suit: 0xa09060, hair: 0x606878, hyp: true,
      lines: [
        "This helix is Hyp fiction — still sells spare dreams.",
        "Kardashev talk is cheap. Bring back a plaque rubbing.",
        "If Sol feels empty, you aren't looking at the desks.",
      ]},
    { id: "nova", name: "Nova Park", role: "Earth plaza guide", skin: [0.88, 0.74, 0.64], suit: 0x3a6a8a, hair: 0x201010,
      lines: [
        "City lights underfoot are hopeful, not decorative.",
        "Market stall has a rover keyfob if you ask kindly.",
        "FLOAT when you want the sky to breathe for you.",
      ]},
    { id: "solis", name: "Dr. Solis", role: "Europa ice listener", skin: [0.82, 0.70, 0.60], suit: 0xc0d0e0, hair: 0xc8c0b0,
      lines: [
        "Hold still over the lineae. The ice remembers impacts.",
        "Vials go to Deep Listen — not souvenir shelves.",
        "Kepler still holds. Farther out, slower years.",
      ]},
    { id: "brick", name: "Brick Mendez", role: "Mars dust mechanic", skin: [0.62, 0.48, 0.38], suit: 0x8a5030, hair: 0x1a0c08,
      lines: [
        "Rovers hate coarse dust. Keyfob helps; patience helps more.",
        "Noctis Bench is for sitting, not conquering.",
        "If Kael warns you, listen once.",
      ]},
    { id: "quill", name: "Quill Ashe", role: "Titan shore keeper", skin: [0.75, 0.62, 0.52], suit: 0xa07040, hair: 0x4a3020,
      lines: [
        "Thick sky cafe — methane shore lamp's my shift.",
        "Romance in vacuum is letters and radio, not rush.",
        "Sample the shore, don't swim it.",
      ]},
    { id: "reed", name: "Reed Okada", role: "Belt garden tender", skin: [0.70, 0.58, 0.48], suit: 0x3a7a50, hair: 0x2a1810,
      lines: [
        "Greens spin so we can breathe without begging Earth.",
        "Trade oxygen stories, not conquest.",
        "Scanner helps — Assay likes clean tags.",
      ]},
    { id: "vessa", name: "Vessa Holm", role: "Shackleton rim ranger", skin: [0.90, 0.80, 0.72], suit: 0xb0b8c0, hair: 0xc8b090,
      lines: [
        "Polar ice is rumor until you stand the rim.",
        "Archive on Callisto keeps longer memories.",
        "Med foam before bravado.",
      ]},
    { id: "oriole", name: "Oriole Finch", role: "Belt library keeper", skin: [0.72, 0.58, 0.48], suit: 0x5a6a80, hair: 0x2a1820, romance: true,
      lines: [
        "Quiet is a resource. Cards are free if you leave a map tip.",
        "Romance in vacuum is letters — Quill knows; Mira knows.",
        "Don't confuse Hyp plaques with Sol honesty.",
      ]},
    { id: "jax", name: "Jax Rourke", role: "GEO nightsides tech", skin: [0.58, 0.48, 0.40], suit: 0x3a5a70, hair: 0x101018,
      lines: [
        "GEO rest buoys see Earth cities breathe. That's hope, not tourism.",
        "Take a nightsides chip if you write Mira from quiet.",
        "Dark docks still need flares — Kael is right.",
      ]},
    { id: "sable", name: "Sable Quinn", role: "Listen conflict mediator", skin: [0.48, 0.38, 0.32], suit: 0x2a2a38, hair: 0x0a0808, conflict: true,
      lines: [
        "Hail once. Signal lamp if they answer dirty. Evade if they don't.",
        "Restraint logs keep people alive past 30 AU.",
        "I'm not here for hero speeches.",
      ]},
    { id: "haven", name: "Haven Solis", role: "Belt tea host", skin: [0.80, 0.68, 0.58], suit: 0x8a6040, hair: 0x3a2018, romance: true,
      lines: [
        "Tea House Drift — recycled leaf, honest rumors, no conquest branding.",
        "Oriole sends map tips; Quill sends shore light.",
        "Sit. The belt feels less empty with a cup.",
      ]},
    { id: "pike", name: "Pike Navarro", role: "Io plume ranger", skin: [0.70, 0.55, 0.42], suit: 0xb05030, hair: 0x1a0c08, conflict: true,
      lines: [
        "Prometheus plume watch — heat first, pride never.",
        "Hail dirty docks with a wand, not a speech.",
        "Foam and patches beat heroics on Io.",
      ]},
    { id: "kira", name: "Kira Okonkwo", role: "Night market runner", skin: [0.42, 0.30, 0.24], suit: 0x6a5070, hair: 0x0c0808,
      lines: [
        "Night Market — honest scrap after the assay desks close.",
        "Tokens aren't conquest. They're tea money.",
        "Haven buys leaf; I buy tips.",
      ]},
    { id: "wren", name: "Wren Hale", role: "Hope Desk keeper", skin: [0.88, 0.76, 0.66], suit: 0x4a8a7a, hair: 0x4a3028, romance: true,
      lines: [
        "Hope Desk stamps care, not checklist icons.",
        "Plant a beacon. Write Mira. Sit with Haven's tea.",
        "Empty Sol is a choice — desks fix it.",
      ]},
    { id: "dante", name: "Dante Ruiz", role: "Guild Hall steward", skin: [0.65, 0.52, 0.42], suit: 0x5a6a50, hair: 0x1a1008,
      lines: [
        "Guild Hall Drift — pins for work done, not conquest speeches.",
        "Assay, Refuge, Yard, Listen — all keep desks here.",
        "Night Market tips welcome after hours.",
      ]},
    { id: "selene", name: "Selene Park", role: "Tranquility guide", skin: [0.92, 0.82, 0.74], suit: 0xb0b8c8, hair: 0xc8b090, romance: true,
      lines: [
        "Tranquility Walk is memorial, not a checklist clear.",
        "Photo quiet. Same rule as Tycho — no conquest stamps.",
        "Vessa keeps the rim; I keep the plaque path.",
      ]},
    { id: "tess", name: "Tess Okada", role: "Dock hangar steward", skin: [0.78, 0.64, 0.54], suit: 0x5a7088, hair: 0x2a1810,
      lines: [
        "Hangar stays busy so Sol doesn't feel empty. Job board's lit.",
        "Walk the airlock twice — Dock Hands pin if you mean it.",
        "Ship cabin's yours when parked. Kettle's not decoration.",
      ]},
    { id: "cass", name: "Cass Vega", role: "Outer desk courier", skin: [0.60, 0.48, 0.40], suit: 0x3a4a60, hair: 0x101018,
      lines: [
        "Sputnik to Rhea — desks all the way out. Bring notes, not conquest.",
        "Kael files restraint; I file desk mail.",
        "Hyp stubs are labeled. Sol desks aren't optional.",
      ]},
    { id: "rio", name: "Rio Hart", role: "Oort hearth keeper", skin: [0.68, 0.56, 0.48], suit: 0x2a3a50, hair: 0x1a1010, romance: true,
      lines: [
        "Hearth Buoy stays warm so the dark doesn't win. Tea's for long watches.",
        "Bring a brick, leave a note. Cass carries the rest.",
        "Flare clean if docks go dirty — Sable taught me that.",
      ]},
    { id: "lumen", name: "Lumen Quill", role: "Hyp plaque curator", skin: [0.86, 0.74, 0.64], suit: 0xa09060, hair: 0x606878, hyp: true,
      lines: [
        "Matrioshka, forge, ring garden — all Hyp, all labeled. Don't confuse with Sol.",
        "Kardashev dreams are free; honesty about fiction isn't optional.",
        "Ion sells spare dreams. I curate the plaques.",
      ]},
    { id: "nori", name: "Nori Vale", role: "Parts locker tech", skin: [0.74, 0.62, 0.52], suit: 0x5a7080, hair: 0x2a1810,
      lines: [
        "Parts Locker Drift — foam, seals, honest bolts. Tess sends overflow.",
        "Dock Hands pin if you mean the airlock twice.",
        "Ship cabin's yours when parked. Don't leave the kettle dry.",
      ]},

  
    { id: "ember", name: "Ember Sol", role: "Pad cargo runner", skin: [0.72, 0.58, 0.48], suit: 0x6a5860, hair: 0x1a0c08,
      lines: [
        "Pad crates move so hangars don't feel empty. Tess keeps the board lit.",
        "Annex B drills airlocks — Dock Hands pin if you mean it.",
        "Nori stocks seals; I stack mass. No conquest stamps.",
      ]},
];

  function loadJSON(k, fb) {
    try { return JSON.parse(localStorage.getItem(k) || "null") || fb; } catch (_) { return fb; }
  }
  function saveJSON(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {}
  }

  function mulberry(a) {
    return function () {
      let t = (a += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /** HD procedural skin — pores, melanin variation, optional face plate. */
  function makeSkinTexture(rgb, seed, face) {
    const rnd = mulberry(seed || 1);
    const c = document.createElement("canvas");
    const sz = face ? 1024 : 768;
    c.width = sz; c.height = sz;
    const g = c.getContext("2d");
    const [r, gv, b] = rgb;
    // Base melanin
    g.fillStyle = "rgb(" + ((r * 255) | 0) + "," + ((gv * 255) | 0) + "," + ((b * 255) | 0) + ")";
    g.fillRect(0, 0, sz, sz);
    // Subsurface warm wash
    const sub = g.createRadialGradient(sz * 0.45, sz * 0.4, sz * 0.05, sz * 0.5, sz * 0.5, sz * 0.55);
    sub.addColorStop(0, "rgba(255,160,140,0.18)");
    sub.addColorStop(0.45, "rgba(200,100,90,0.08)");
    sub.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = sub;
    g.fillRect(0, 0, sz, sz);
    // Pore / microdetail
    for (let i = 0; i < (face ? 9000 : 5000); i++) {
      const x = rnd() * sz, y = rnd() * sz;
      const v = (rnd() - 0.5) * 22;
      g.fillStyle = "rgba(" + Math.max(0, Math.min(255, (r * 255 + v) | 0)) + "," +
        Math.max(0, Math.min(255, (gv * 255 + v * 0.7) | 0)) + "," +
        Math.max(0, Math.min(255, (b * 255 + v * 0.5) | 0)) + "," + (0.03 + rnd() * 0.07) + ")";
      g.fillRect(x, y, 1 + rnd() * 2.2, 1 + rnd() * 2.2);
    }
    // Freckle / melanin spots
    for (let i = 0; i < 80; i++) {
      g.fillStyle = "rgba(90,50,35," + (0.08 + rnd() * 0.12) + ")";
      g.beginPath();
      g.arc(rnd() * sz, rnd() * sz, 1 + rnd() * 2.5, 0, Math.PI * 2);
      g.fill();
    }
    if (face) {
      const cx = sz * 0.5, cy = sz * 0.42, S = sz / 512;
      // Soft face shading
      const shade = g.createRadialGradient(cx, cy, 10 * S, cx, cy + 20 * S, 220 * S);
      shade.addColorStop(0, "rgba(255,220,200,0.1)");
      shade.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = shade; g.fillRect(0, 0, sz, sz);
      // Brows — denser hair strokes
      g.strokeStyle = "rgba(35,22,16,0.65)";
      for (let k = 0; k < 14; k++) {
        g.lineWidth = (1.2 + rnd()) * S;
        g.beginPath();
        g.moveTo(cx - 78 * S + k * 4 * S, cy - 42 * S + rnd() * 4 * S);
        g.quadraticCurveTo(cx - 40 * S, cy - 58 * S + rnd() * 3 * S, cx - 8 * S - k, cy - 40 * S);
        g.stroke();
        g.beginPath();
        g.moveTo(cx + 8 * S + k, cy - 40 * S);
        g.quadraticCurveTo(cx + 40 * S, cy - 58 * S + rnd() * 3 * S, cx + 78 * S - k * 4 * S, cy - 42 * S + rnd() * 4 * S);
        g.stroke();
      }
      // Sclera + iris + pupil + catchlight
      function eye(ex) {
        g.fillStyle = "rgba(248,248,252,0.98)";
        g.beginPath(); g.ellipse(ex, cy - 8 * S, 20 * S, 13 * S, 0, 0, Math.PI * 2); g.fill();
        const iris = g.createRadialGradient(ex, cy - 8 * S, 2 * S, ex, cy - 8 * S, 9 * S);
        iris.addColorStop(0, "rgba(180,210,230,1)");
        iris.addColorStop(0.5, "rgba(50,90,120,1)");
        iris.addColorStop(1, "rgba(20,35,50,1)");
        g.fillStyle = iris;
        g.beginPath(); g.arc(ex, cy - 8 * S, 9 * S, 0, Math.PI * 2); g.fill();
        g.fillStyle = "#0a0a0c";
        g.beginPath(); g.arc(ex, cy - 8 * S, 3.5 * S, 0, Math.PI * 2); g.fill();
        g.fillStyle = "rgba(255,255,255,0.85)";
        g.beginPath(); g.arc(ex - 3 * S, cy - 11 * S, 2 * S, 0, Math.PI * 2); g.fill();
        // lids
        g.strokeStyle = "rgba(60,35,30,0.35)";
        g.lineWidth = 2.5 * S;
        g.beginPath(); g.ellipse(ex, cy - 8 * S, 20 * S, 13 * S, 0, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
      }
      eye(cx - 42 * S); eye(cx + 42 * S);
      // Nose bridge + tip shadow
      g.strokeStyle = "rgba(70,40,35,0.28)";
      g.lineWidth = 3 * S;
      g.beginPath(); g.moveTo(cx, cy + 2 * S); g.lineTo(cx - 7 * S, cy + 32 * S); g.lineTo(cx + 7 * S, cy + 32 * S); g.stroke();
      g.fillStyle = "rgba(180,90,90,0.12)";
      g.beginPath(); g.ellipse(cx, cy + 34 * S, 10 * S, 6 * S, 0, 0, Math.PI * 2); g.fill();
      // Cheek blush pass
      g.fillStyle = "rgba(200,90,90,0.14)";
      g.beginPath(); g.ellipse(cx - 55 * S, cy + 18 * S, 28 * S, 16 * S, 0, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.ellipse(cx + 55 * S, cy + 18 * S, 28 * S, 16 * S, 0, 0, Math.PI * 2); g.fill();
      // Lips with gradient
      const lip = g.createLinearGradient(cx, cy + 48 * S, cx, cy + 68 * S);
      lip.addColorStop(0, "rgba(170,85,95,0.55)");
      lip.addColorStop(1, "rgba(120,50,60,0.5)");
      g.fillStyle = lip;
      g.beginPath(); g.ellipse(cx, cy + 58 * S, 24 * S, 9 * S, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = "rgba(80,30,40,0.35)";
      g.lineWidth = 1.5 * S;
      g.beginPath(); g.moveTo(cx - 20 * S, cy + 58 * S); g.lineTo(cx + 20 * S, cy + 58 * S); g.stroke();
      // lip highlight
      g.fillStyle = "rgba(255,200,200,0.2)";
      g.beginPath(); g.ellipse(cx, cy + 54 * S, 12 * S, 3 * S, 0, 0, Math.PI * 2); g.fill();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace || THREE.sRGBEncoding;
    tex.anisotropy = 8;
    tex.needsUpdate = true;
    return tex;
  }

  function makeSuitTexture(hex, seed) {
    const rnd = mulberry(seed || 2);
    const c = document.createElement("canvas");
    c.width = 1024; c.height = 1024;
    const g = c.getContext("2d");
    const r = (hex >> 16) & 255, gv = (hex >> 8) & 255, b = hex & 255;
    g.fillStyle = "rgb(" + r + "," + gv + "," + b + ")";
    g.fillRect(0, 0, 1024, 1024);
    // Twill weave
    for (let y = 0; y < 1024; y++) {
      const a = (y % 3 === 0) ? 0.045 : 0.02;
      g.fillStyle = "rgba(255,255,255," + a + ")";
      g.fillRect(0, y, 1024, 1);
      g.fillStyle = "rgba(0,0,0," + (a * 0.6) + ")";
      g.fillRect(y % 4, y, 1024, 1);
    }
    // Hard suit panels
    g.fillStyle = "rgba(255,255,255,0.06)";
    for (let i = 0; i < 6; i++) {
      g.fillRect(60 + i * 150, 80, 120, 280);
      g.strokeStyle = "rgba(0,0,0,0.35)";
      g.lineWidth = 3;
      g.strokeRect(60 + i * 150, 80, 120, 280);
    }
    // Reflective strips
    g.fillStyle = "rgba(200,230,255,0.35)";
    g.fillRect(40, 400, 944, 18);
    g.fillRect(40, 700, 944, 14);
    // Rivets / panel screws
    for (let i = 0; i < 48; i++) {
      const x = 80 + (i % 12) * 75;
      const y = 100 + Math.floor(i / 12) * 90;
      g.fillStyle = "rgba(220,230,240,0.55)";
      g.beginPath(); g.arc(x, y, 4, 0, Math.PI * 2); g.fill();
      g.fillStyle = "rgba(0,0,0,0.35)";
      g.beginPath(); g.arc(x, y, 1.5, 0, Math.PI * 2); g.fill();
    }
    // Status LED row painted on fabric
    for (let i = 0; i < 8; i++) {
      g.fillStyle = i % 3 === 0 ? "rgba(80,220,255,0.7)" : "rgba(40,80,100,0.5)";
      g.fillRect(120 + i * 90, 450, 40, 10);
    }
    // Seam stitches
    g.strokeStyle = "rgba(0,0,0,0.25)";
    g.lineWidth = 2;
    for (let x = 100; x < 900; x += 140) {
      g.beginPath(); g.moveTo(x, 60); g.lineTo(x, 980); g.stroke();
    }
    // Microlouver patches
    for (let i = 0; i < 20; i++) {
      g.fillStyle = "rgba(180,200,220," + (0.08 + (i % 3) * 0.04) + ")";
      g.fillRect(80 + (i % 5) * 180, 620 + Math.floor(i / 5) * 70, 140, 40);
      g.strokeStyle = "rgba(0,0,0,0.2)";
      g.strokeRect(80 + (i % 5) * 180, 620 + Math.floor(i / 5) * 70, 140, 40);
    }
    // HOPE mark
    g.fillStyle = "rgba(160,220,255,0.7)";
    g.font = "bold 48px system-ui,sans-serif";
    g.fillText("HOPE", 420, 560);
    g.font = "22px system-ui,sans-serif";
    g.fillStyle = "rgba(180,200,220,0.45)";
    g.fillText("VESPER SUIT · EVA", 390, 595);
    // Elbow / knee pad paint blocks
    g.fillStyle = "rgba(0,0,0,0.18)";
    g.fillRect(100, 750, 160, 120);
    g.fillRect(760, 750, 160, 120);
    g.strokeStyle = "rgba(200,220,240,0.25)";
    g.strokeRect(100, 750, 160, 120);
    g.strokeRect(760, 750, 160, 120);
    // NAMEPLATE strip
    g.fillStyle = "rgba(20,30,40,0.55)";
    g.fillRect(300, 800, 420, 50);
    g.fillStyle = "rgba(200,220,240,0.7)";
    g.font = "bold 28px system-ui,sans-serif";
    g.fillText("CREW · HOPE CIRCLE", 340, 834);
    // Wear / micro scratches
    for (let i = 0; i < 900; i++) {
      g.fillStyle = "rgba(0,0,0," + (0.02 + rnd() * 0.06) + ")";
      g.fillRect(rnd() * 1024, rnd() * 1024, 1 + rnd() * 3, 1);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace || THREE.sRGBEncoding;
    tex.anisotropy = 8;
    return tex;
  }

  function makeClothTexture(hex, seed) {
    const rnd = mulberry(seed || 9);
    const c = document.createElement("canvas");
    c.width = 512; c.height = 512;
    const g = c.getContext("2d");
    const r = (hex >> 16) & 255, gv = (hex >> 8) & 255, b = hex & 255;
    g.fillStyle = "rgb(" + Math.min(255, r + 20) + "," + Math.min(255, gv + 15) + "," + Math.min(255, b + 10) + ")";
    g.fillRect(0, 0, 512, 512);
    for (let y = 0; y < 512; y += 1) {
      g.fillStyle = "rgba(255,255,255," + (0.015 + (y % 5 === 0 ? 0.03 : 0)) + ")";
      g.fillRect(0, y, 512, 1);
    }
    for (let i = 0; i < 200; i++) {
      g.strokeStyle = "rgba(0,0,0," + (0.04 + rnd() * 0.06) + ")";
      g.beginPath();
      g.moveTo(rnd() * 512, rnd() * 512);
      g.quadraticCurveTo(rnd() * 512, rnd() * 512, rnd() * 512, rnd() * 512);
      g.stroke();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace || THREE.sRGBEncoding;
    return tex;
  }

  function makeHuman(npc, low) {
    const g = new THREE.Group();
    g.name = "lifeNpc:" + npc.id;
    g.userData.npc = npc;
    const skinMap = makeSkinTexture(npc.skin, npc.id.length * 97, false);
    const faceMap = makeSkinTexture(npc.skin, npc.id.length * 97 + 3, true);
    const suitMap = makeSuitTexture(npc.suit, npc.id.length * 131);
    const clothMap = makeClothTexture(npc.suit, npc.id.length * 17);
    const skinMat = window.VesperMat({
      map: skinMap, roughness: 0.48, metalness: 0.04, color: 0xffffff,
      emissive: 0x201008, emissiveIntensity: 0.04, // Subsurface hint
    });
    const suitMat = window.VesperMat({
      map: suitMap, roughness: 0.38, metalness: 0.42, color: 0xffffff,
      emissive: 0x102030, emissiveIntensity: 0.1,
      envMapIntensity: 0.85,
    });
    const clothMat = window.VesperMat({
      map: clothMap, roughness: 0.72, metalness: 0.08, color: 0xffffff,
      side: THREE.DoubleSide,
    });
    const faceMat = window.VesperMat({
      map: faceMap, roughness: 0.42, metalness: 0.03, color: 0xffffff,
    });
    const segs = low ? 10 : 18;
    // Neck
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.1, 8), skinMat);
    neck.position.y = 1.36;
    // Head + jaw hint
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.128, segs, low ? 10 : 14), faceMat);
    head.position.y = 1.50;
    head.scale.set(1, 1.05, 0.95);
    const jaw = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), skinMat);
    jaw.position.set(0, 1.40, 0.02);
    jaw.scale.set(0.85, 0.55, 0.7);
    // Hair cap + side locks (less bald mannequin)
    const hairCol = npc.hair || 0x1a1210;
    const hairMat = window.VesperMat({ color: hairCol, roughness: 0.82, metalness: 0.04 });
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.134, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.58),
      hairMat
    );
    hair.position.set(0, 1.525, -0.015);
    for (const s of [-1, 1]) {
      const lock = new THREE.Mesh(
        THREE.CapsuleGeometry ? new THREE.CapsuleGeometry(0.035, 0.08, 4, 6) : new THREE.CylinderGeometry(0.035, 0.03, 0.12, 6),
        hairMat
      );
      lock.position.set(s * 0.11, 1.42, 0.02);
      lock.rotation.z = s * 0.35;
      g.add(lock);
    }
    if (npc.romance && !low) {
      const bang = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.45),
        hairMat
      );
      bang.position.set(0, 1.56, 0.06);
      bang.scale.set(1.1, 0.55, 0.7);
      g.add(bang);
    }
    // Ears
    for (const s of [-1, 1]) {
      const ear = new THREE.Mesh(
        new THREE.SphereGeometry(0.028, 8, 6),
        skinMat
      );
      ear.position.set(s * 0.125, 1.50, 0);
      ear.scale.set(0.55, 1.0, 0.7);
      g.add(ear);
    }
    // Torso + chest plate
    const torso = new THREE.Mesh(
      low ? new THREE.BoxGeometry(0.4, 0.58, 0.24) : (THREE.CapsuleGeometry ? new THREE.CapsuleGeometry(0.17, 0.4, 6, 12) : new THREE.BoxGeometry(0.34, 0.58, 0.24)),
      suitMat
    );
    torso.position.y = 1.05;
    const chest = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.28, 0.12),
      suitMat
    );
    chest.position.set(0, 1.12, 0.12);
    // Chest status LED strip + utility pouch (gear feel)
    const led = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.02, 0.02),
      window.VesperMat({
        color: npc.romance ? 0xff88aa : npc.conflict ? 0xff6644 : 0x66ddff,
        emissive: npc.romance ? 0xff4488 : npc.conflict ? 0xff4422 : 0x2288cc,
        emissiveIntensity: 0.65, roughness: 0.25, metalness: 0.4,
      })
    );
    led.position.set(0, 1.18, 0.185);
    const pouch = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.12, 0.06),
      suitMat
    );
    pouch.position.set(0.14, 0.95, 0.14);
    g.add(led, pouch);
    if (npc.conflict) {
      const hipHolster = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.14, 0.06),
        suitMat
      );
      hipHolster.position.set(-0.18, 0.85, 0.12);
      g.add(hipHolster);
    }
    // Shoulder pads
    for (const s of [-1, 1]) {
      const pad = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), suitMat);
      pad.position.set(s * 0.26, 1.28, 0);
      pad.scale.set(1.1, 0.7, 0.9);
      g.add(pad);
    }
    const hips = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.22, 0.22), suitMat);
    hips.position.y = 0.70;
    // Cloth capelet + soft collar (fabric read)
    const cape = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.28, 0.35, low ? 8 : 12, 1, true),
      clothMat
    );
    cape.position.set(0, 0.95, -0.02);
    const collar = new THREE.Mesh(
      new THREE.TorusGeometry(0.12, 0.025, 6, 12),
      clothMat
    );
    collar.position.set(0, 1.32, 0.02);
    collar.rotation.x = Math.PI / 2;
    g.add(collar);
    // Soft nose bridge + cheek volume (close-up read)
    if (!low) {
      const nose = new THREE.Mesh(
        new THREE.SphereGeometry(0.022, 8, 6),
        skinMat
      );
      nose.position.set(0, 1.505, 0.118);
      nose.scale.set(0.7, 1.1, 1.3);
      const cheekL = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), skinMat);
      cheekL.position.set(-0.07, 1.48, 0.08);
      cheekL.scale.set(0.9, 0.7, 0.6);
      const cheekR = cheekL.clone();
      cheekR.position.x = 0.07;
      const brow = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.018, 0.04),
        skinMat
      );
      brow.position.set(0, 1.545, 0.095);
      brow.rotation.x = -0.15;
      g.add(nose, cheekL, cheekR, brow);
    }
    // Separate eye bulbs for catchlight depth (close-up fidelity)
    if (!low) {
      for (const s of [-1, 1]) {
        const eye = new THREE.Mesh(
          new THREE.SphereGeometry(0.018, 10, 8),
          window.VesperMat({
            color: 0xf2f4f8, roughness: 0.25, metalness: 0.05,
            emissive: 0x203040, emissiveIntensity: 0.08,
          })
        );
        eye.position.set(s * 0.045, 1.52, 0.11);
        const iris = new THREE.Mesh(
          new THREE.SphereGeometry(0.01, 8, 6),
          window.VesperMat({ color: 0x406080, roughness: 0.35, metalness: 0.1 })
        );
        iris.position.set(s * 0.045, 1.52, 0.125);
        g.add(eye, iris);
      }
    }
    // Visor (stowed up — face readable; lower for EVA feel via opacity)
    const visor = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.42),
      window.VesperMat({
        color: 0x70c0e8, metalness: 0.25, roughness: 0.12, transparent: true, opacity: 0.22,
        emissive: 0x206080, emissiveIntensity: 0.2,
      })
    );
    visor.position.set(0, 1.55, 0.03);
    // Limbs
    for (const s of [-1, 1]) {
      const upper = new THREE.Mesh(
        THREE.CapsuleGeometry ? new THREE.CapsuleGeometry(0.055, 0.22, 4, 8) : new THREE.CylinderGeometry(0.055, 0.055, 0.28, 8),
        suitMat
      );
      upper.position.set(s * 0.30, 1.12, 0);
      upper.rotation.z = s * 0.2;
      const fore = new THREE.Mesh(
        THREE.CapsuleGeometry ? new THREE.CapsuleGeometry(0.045, 0.2, 4, 8) : new THREE.CylinderGeometry(0.045, 0.045, 0.26, 8),
        suitMat
      );
      fore.position.set(s * 0.34, 0.88, 0.04);
      fore.rotation.z = s * 0.1;
      const glove = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), suitMat);
      glove.position.set(s * 0.34, 0.72, 0.06);
      const thigh = new THREE.Mesh(
        THREE.CapsuleGeometry ? new THREE.CapsuleGeometry(0.065, 0.24, 4, 8) : new THREE.CylinderGeometry(0.065, 0.065, 0.3, 8),
        suitMat
      );
      thigh.position.set(s * 0.11, 0.48, 0);
      const shin = new THREE.Mesh(
        THREE.CapsuleGeometry ? new THREE.CapsuleGeometry(0.055, 0.22, 4, 8) : new THREE.CylinderGeometry(0.055, 0.055, 0.28, 8),
        suitMat
      );
      shin.position.set(s * 0.11, 0.22, 0);
      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.09, 0.24), suitMat);
      boot.position.set(s * 0.11, 0.05, 0.04);
      const kneePad = new THREE.Mesh(
        new THREE.SphereGeometry(0.055, 8, 6),
        suitMat
      );
      kneePad.position.set(s * 0.11, 0.35, 0.06);
      kneePad.scale.set(1.1, 0.7, 0.8);
      g.add(upper, fore, glove, thigh, shin, boot, kneePad);
    }
    g.add(neck, head, jaw, hair, torso, chest, hips, cape, visor);
    if (!low) {
      const pip = window.VesperNoLight(npc.romance ? 0xffc0d0 : npc.conflict ? 0xff8060 : 0x80d0ff, 0.35, 5, 2);
      pip.position.set(0, 1.65, 0.25);
      g.add(pip);
    }
    // Nameplate sprite-ish bar
    const tag = new THREE.Mesh(
      new THREE.PlaneGeometry(0.5, 0.08),
      new THREE.MeshBasicMaterial({ color: npc.romance ? 0xffb0c8 : npc.conflict ? 0xff8060 : 0x80d0ff, transparent: true, opacity: 0.55 })
    );
    tag.position.set(0, 1.78, 0);
    g.add(tag);
    g.scale.setScalar(1.08);
    return g;
  }

  function makeCityBlock(biome, low, rnd) {
    const g = new THREE.Group();
    g.name = "vesperCity";
    const nBuild = low ? 7 : 24;
    for (let i = 0; i < nBuild; i++) {
      const w = 0.8 + rnd() * 1.8;
      const h = 1.2 + rnd() * (biome === "earth" ? 5.5 : biome === "mars" ? 3.2 : 2.8);
      const d = 0.8 + rnd() * 1.5;
      const col =
        biome === "mars" ? 0x8a6048 : biome === "luna" ? 0xa0a8b0 : biome === "deck" ? 0x506070 : biome === "titan" ? 0x8a6840 : 0x6a7a88;
      const matB = window.VesperMat({
        color: col, metalness: 0.35 + rnd() * 0.2, roughness: 0.45 + rnd() * 0.3,
        emissive: 0x203040, emissiveIntensity: 0.1 + rnd() * 0.08,
      });
      let b;
      if (rnd() > 0.72) {
        // Cylinder tower / HAB drum
        b = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.45, w * 0.5, h, low ? 8 : 12), matB);
      } else if (rnd() > 0.55) {
        // Stacked dual box
        b = new THREE.Group();
        const b1 = new THREE.Mesh(new THREE.BoxGeometry(w, h * 0.6, d), matB);
        const b2 = new THREE.Mesh(new THREE.BoxGeometry(w * 0.7, h * 0.5, d * 0.7), matB.clone());
        b1.position.y = h * 0.3;
        b2.position.y = h * 0.6 + h * 0.25;
        b.add(b1, b2);
        b.position.y = 0;
      } else {
        b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), matB);
      }
      const a = rnd() * Math.PI * 2;
      const r = 6 + rnd() * 16;
      if (b.isMesh) b.position.set(Math.cos(a) * r, h * 0.5, Math.sin(a) * r);
      else b.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      g.add(b);
      // Window emissives
      if (!low && rnd() > 0.55) {
        const win = new THREE.Mesh(
          new THREE.PlaneGeometry(w * 0.6, h * 0.5),
          new THREE.MeshBasicMaterial({ color: biome === "mars" ? 0xffc080 : 0xa0d0ff, transparent: true, opacity: 0.35 })
        );
        win.position.copy(b.position);
        win.position.y += 0.1;
        win.position.z += d * 0.51;
        g.add(win);
      }
    }
    // Plaza + monument
    const plaza = new THREE.Mesh(
      new THREE.CylinderGeometry(3.2, 3.2, 0.08, 24),
      window.VesperMat({ color: 0x4a5058, metalness: 0.3, roughness: 0.7 })
    );
    plaza.position.set(8, 0.04, -6);
    g.add(plaza);
    const mon = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 2.2, 0.35),
      window.VesperMat({ color: 0xc0c8d0, emissive: 0x406080, emissiveIntensity: 0.3 })
    );
    mon.position.set(8, 1.1, -6);
    g.add(mon);
    const plazaFountain = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.75, 0.35, 12),
      window.VesperMat({ color: 0x608090, metalness: 0.4, roughness: 0.35, emissive: 0x204060, emissiveIntensity: 0.2 })
    );
    plazaFountain.position.set(8, 0.2, -7.5);
    g.add(plazaFountain);
    if (!low) {
      const care = window.VesperNoLight(0x80ffe0, 0.35, 8, 2);
      care.position.set(8, 1.5, -7.5);
      g.add(care);
    }
    // Plaza benches (sit reason — anti-empty)
    for (const bx of [-1.2, 1.2]) {
      const plazaBench = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 0.35, 0.4),
        window.VesperMat({ color: 0x5a5048, roughness: 0.75 })
      );
      plazaBench.position.set(8 + bx, 0.2, -4.5);
      g.add(plazaBench);
    }
    // Transit kiosk glowing screen
    const kiosk = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 1.4, 0.4),
      window.VesperMat({ color: 0x3a4550, metalness: 0.45, roughness: 0.4, emissive: 0x206080, emissiveIntensity: 0.25 })
    );
    kiosk.position.set(6.2, 0.7, -6);
    g.add(kiosk);
    const kScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.45, 0.55),
      window.VesperMat({ color: 0x80e0ff, emissive: 0x40b0ff, emissiveIntensity: 0.75 })
    );
    kScreen.position.set(6.2, 0.95, -5.78);
    g.add(kScreen);
    // Market stall + tiny walk-in shop shell
    const stall = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.9, 1.0),
      window.VesperMat({ color: 0x8a7060, roughness: 0.75 })
    );
    stall.position.set(5, 0.45, -3);
    stall.name = "marketStall";
    g.add(stall);
    const shop = new THREE.Group();
    shop.name = "shopInterior";
    // Full walk-in shop (ME/Bethesda storefront scale)
    const sFloor = new THREE.Mesh(
      new THREE.BoxGeometry(5.5, 0.1, 5.0),
      window.VesperMat({ color: 0x3a342c, roughness: 0.8 })
    );
    sFloor.position.set(5, 0.05, -5.5);
    const sBack = new THREE.Mesh(
      new THREE.BoxGeometry(5.5, 2.6, 0.12),
      window.VesperMat({ color: 0x4a4038, metalness: 0.2, roughness: 0.7, emissive: 0x201810, emissiveIntensity: 0.1 })
    );
    sBack.position.set(5, 1.3, -8.0);
    const sLeft = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 2.6, 5.0),
      window.VesperMat({ color: 0x4a4038, metalness: 0.25, roughness: 0.65 })
    );
    sLeft.position.set(5 - 2.75, 1.3, -5.5);
    const sRight = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 2.6, 5.0),
      window.VesperMat({ color: 0x4a4038, metalness: 0.25, roughness: 0.65 })
    );
    sRight.position.set(5 + 2.75, 1.3, -5.5);
    const sCeil = new THREE.Mesh(
      new THREE.BoxGeometry(5.5, 0.08, 5.0),
      window.VesperMat({ color: 0x3a3830, metalness: 0.3, roughness: 0.7 })
    );
    sCeil.position.set(5, 2.65, -5.5);
    const shelf = new THREE.Mesh(
      new THREE.BoxGeometry(4.0, 0.12, 0.5),
      window.VesperMat({ color: 0x6a5a48 })
    );
    shelf.position.set(5, 1.1, -7.6);
    const counter = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 0.95, 0.7),
      window.VesperMat({ color: 0x8a7060, roughness: 0.7 })
    );
    counter.position.set(5, 0.55, -4.0);
    const sLight = window.VesperNoLight(0xffe0b0, 0.65, 12, 2);
    sLight.position.set(5, 2.2, -5.5);
    shop.add(sFloor, sBack, sLeft, sRight, sCeil, shelf, counter, sLight);
    g.add(shop);
    const stallLight = window.VesperNoLight(0xffe0a0, 0.45, 8, 2);
    stallLight.position.set(5, 1.2, -3);
    g.add(stallLight);
    const cafeAwning = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.08, 1.4),
      window.VesperMat({ color: 0xc06040, roughness: 0.7, emissive: 0x401010, emissiveIntensity: 0.1 })
    );
    cafeAwning.position.set(5, 1.15, -3.2);
    g.add(cafeAwning);
    const districtSign = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 0.4),
      window.VesperMat({ color: 0x80c0e0, emissive: 0x306080, emissiveIntensity: 0.4, side: THREE.DoubleSide })
    );
    districtSign.position.set(10, 1.6, -6);
    g.add(districtSign);
    const guildBoard = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 1.0, 0.08),
      window.VesperMat({ color: 0x4a4030, roughness: 0.7, emissive: 0x201808, emissiveIntensity: 0.1 })
    );
    guildBoard.position.set(9.5, 1.0, -4.2);
    g.add(guildBoard);
    // Side alley crates (purpose clutter)
    for (let i = 0; i < (low ? 2 : 4); i++) {
      const crate = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 0.4, 0.45),
        window.VesperMat({ color: 0x6a5a40, roughness: 0.7 })
      );
      // City group sits at (-2, 0, 8). (2, *, -8) lands on the eye
      // and the whole landing view becomes the inside of a crate.
      crate.position.set(3.6 + i * 0.55, 0.22, -2.4);
      g.add(crate);
    }
    // Street lamps
    for (let i = 0; i < (low ? 3 : 6); i++) {
      const lamp = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.06, 1.8, 6),
        window.VesperMat({ color: 0x9098a0 })
      );
      const a = (i / 6) * Math.PI * 2;
      lamp.position.set(8 + Math.cos(a) * 4, 0.9, -6 + Math.sin(a) * 4);
      g.add(lamp);
      const l = window.VesperNoLight(0xffe8c0, 0.3, 7, 2);
      l.position.copy(lamp.position);
      l.position.y = 1.8;
      g.add(l);
    }
    return g;
  }

  function makeRover() {
    const g = new THREE.Group();
    g.name = "vesperRover";
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.35, 0.9),
      window.VesperMat({ color: 0xb0b8c0, metalness: 0.55, roughness: 0.4, emissive: 0x203040, emissiveIntensity: 0.15 })
    );
    body.position.y = 0.35;
    g.add(body);
    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.35, 0.7),
      window.VesperMat({ color: 0x60a0c0, metalness: 0.2, roughness: 0.25, transparent: true, opacity: 0.55, emissive: 0x206080, emissiveIntensity: 0.2 })
    );
    cabin.position.set(0.15, 0.62, 0);
    g.add(cabin);
    for (const [x, z] of [[-0.45, -0.45], [-0.45, 0.45], [0.45, -0.45], [0.45, 0.45], [0.7, 0], [-0.7, 0]]) {
      const w = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.16, 0.12, 10),
        window.VesperMat({ color: 0x202428, roughness: 0.9 })
      );
      w.rotation.z = Math.PI / 2;
      w.position.set(x, 0.16, z);
      g.add(w);
    }
    g.visible = false;
    return g;
  }

  function closeAllPanels(except) {
    if (except && window.VesperInput) window.VesperInput.releasePointer();
    ensureUI();
    const map = {
      inv: ui.inv,
      journal: ui.journal,
      talk: ui.talk,
      guild: ui.guild,
      codex: ui.codex,
    };
    Object.keys(map).forEach((k) => {
      const el = map[k];
      if (!el) return;
      if (except && k === except) return;
      el.style.display = "none";
    });
    // Also collapse ACTIVITIES if places exposes it
    try {
      if (window.VesperPlaces && window.VesperPlaces.setMissionHudOpen && except !== "missions") {
        window.VesperPlaces.setMissionHudOpen(false);
      }
    } catch (_) {}
    if (ui.lifeMore && except !== "more") ui.lifeMore.style.display = "none";
  }

  function panelHeader(title, closeId) {
    return (
      "<div style='display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px'>" +
      "<b>" + title + "</b>" +
      "<button type='button' id='" + closeId + "' class='vesper-panel-close' " +
      "style='min-width:44px;min-height:44px;padding:8px 12px;border-radius:10px;" +
      "border:1px solid rgba(140,180,220,0.45);background:rgba(50,70,100,0.95);color:#e8f4ff;" +
      "font:13px/1 system-ui,sans-serif;cursor:pointer' aria-label='Close'>Close</button></div>"
    );
  }

  function wirePanelClose(el, closeId) {
    if (!el) return;
    const btn = el.querySelector("#" + closeId);
    if (btn) {
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        el.style.display = "none";
      };
    }
  }

  function openOnly(which) {
    closeAllPanels(which);
    ensureUI();
    if (which === "inv") {
      renderInv();
      ui.inv.style.display = "block";
    } else if (which === "journal") {
      renderJournal();
      ui.journal.style.display = "block";
    } else if (which === "guild") {
      renderGuilds();
      ui.guild.style.display = "block";
    } else if (which === "codex") {
      renderCodex();
      ui.codex.style.display = "block";
    }
  }

  function ensureUI() {
    if (ui.inv) return;
    const css =
      "position:fixed;z-index:42;background:rgba(6,10,18,0.88);color:#e4eef8;font:12px/1.4 system-ui,sans-serif;" +
      "padding:12px 14px;border-radius:12px;border:1px solid rgba(100,160,220,0.3);backdrop-filter:blur(8px);" +
      "max-height:55vh;overflow:auto;display:none;";
    ui.inv = document.createElement("div");
    ui.inv.id = "vesper-inv";
    ui.inv.style.cssText = css + "right:12px;top:96px;width:260px;";
    ui.journal = document.createElement("div");
    ui.journal.id = "vesper-journal";
    ui.journal.style.cssText = css + "left:12px;top:200px;width:280px;";
    ui.talk = document.createElement("div");
    ui.talk.id = "vesper-talk";
    ui.talk.style.cssText =
      css + "left:50%;bottom:150px;transform:translateX(-50%);width:min(460px,94vw);max-height:52vh;overflow:auto;display:none;z-index:45;padding:14px;";
    document.body.appendChild(ui.inv);
    document.body.appendChild(ui.journal);
    document.body.appendChild(ui.talk);
    // Mobile / touch life affordances — always available, bigger hit targets
    if (!ui.lifeBar) {
      ui.lifeBar = document.createElement("div");
      ui.lifeBar.id = "vesper-life-bar";
      ui.lifeBar.setAttribute("aria-label", "Life systems");
      ui.lifeBar.style.cssText =
        "position:fixed;left:50%;bottom:72px;transform:translateX(-50%);z-index:41;display:flex;gap:6px;" +
        "padding:6px;border-radius:14px;background:rgba(6,10,18,0.72);border:1px solid rgba(100,160,220,0.28);" +
        "backdrop-filter:blur(6px);";
      const mk = (id, label, title, fn) => {
        const b = document.createElement("button");
        b.type = "button";
        b.id = id;
        b.textContent = label;
        b.title = title;
        b.setAttribute("aria-label", title);
        b.style.cssText =
          "min-width:46px;min-height:46px;padding:8px 10px;border-radius:12px;border:1px solid rgba(120,180,255,0.25);" +
          "background:rgba(40,60,90,0.9);color:#e8f4ff;font:12px/1 system-ui,sans-serif;" +
          "box-shadow:0 2px 8px rgba(0,0,0,0.35);";
        const press = () => { b.style.transform = "scale(0.94)"; b.style.background = "rgba(60,100,150,0.95)"; };
        const release = () => { b.style.transform = ""; b.style.background = "rgba(40,60,90,0.9)"; };
        b.addEventListener("pointerdown", press);
        b.addEventListener("pointerup", release);
        b.addEventListener("pointercancel", release);
        b.addEventListener("pointerleave", release);
        b.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          fn();
        });
        return b;
      };
      ui.lifeBar.appendChild(mk("vl-inv", "I", "Inventory", () => toggleInventory()));
      ui.lifeBar.appendChild(mk("vl-jou", "J", "Journal", () => toggleJournal()));
      ui.lifeBar.appendChild(mk("vl-talk", "E", "Talk / pickup", () => { if (!tryMarketNearby()) tryTalkNearby(); }));
      ui.lifeBar.appendChild(mk("vl-more", "···", "More · guilds / rover / cam / flare / codex / activities", () => toggleMoreLife()));
      ui.lifeBar.appendChild(mk("vl-close", "✕", "Close all panels", () => {
        closeAllPanels();
        try { if (window.VesperPlaces && window.VesperPlaces.setMissionHudOpen) window.VesperPlaces.setMissionHudOpen(false); } catch (_) {}
      }));
      document.body.appendChild(ui.lifeBar);
      ui.lifeBar.style.display = "none"; // fly-first: show only on EVA
      // Secondary strip (hidden until ···)
      ui.lifeMore = document.createElement("div");
      ui.lifeMore.id = "vesper-life-more";
      ui.lifeMore.style.cssText =
        "position:fixed;left:50%;bottom:128px;transform:translateX(-50%);z-index:41;display:none;flex-direction:row;gap:6px;" +
        "padding:6px;border-radius:14px;background:rgba(6,10,18,0.82);border:1px solid rgba(100,160,220,0.28);";
      ui.lifeMore.appendChild(mk("vl-gui", "U", "Guilds", () => toggleGuilds()));
      ui.lifeMore.appendChild(mk("vl-drive", "G", "Rover", () => toggleDrive()));
      ui.lifeMore.appendChild(mk("vl-cam", "V", "Cam", () => {
        const s = window.VesperSky;
        if (s && s.setCamMode) {
          const m = (s.getCamMode && s.getCamMode()) === "cockpit" ? "chase" : "cockpit";
          s.setCamMode(m);
        }
      }));
      ui.lifeMore.appendChild(mk("vl-flare", "✦", "Fire flare", () => fireFlare()));
      ui.lifeMore.appendChild(mk("vl-codex", "K", "Codex", () => toggleCodex()));
      ui.lifeMore.appendChild(mk("vl-act", "A", "Activities", () => {
        try {
          if (window.VesperPlaces && window.VesperPlaces.setMissionHudOpen) {
            const open = !(missionHudOpenHint());
            window.VesperPlaces.setMissionHudOpen(open);
            if (open) closeAllPanels("missions");
          }
        } catch (_) {}
      }));
      document.body.appendChild(ui.lifeMore);
    }
  }

  function missionHudOpenHint() {
    const el = document.getElementById("vesper-mission-hud");
    return el && el.style.display !== "none" && el.dataset.collapsed !== "1";
  }
  function toggleMoreLife() {
    ensureUI();
    if (!ui.lifeMore) return;
    ui.lifeMore.style.display = ui.lifeMore.style.display === "flex" ? "none" : "flex";
  }

  function scareNearbyHostiles() {
    const flight = window.VesperSky && window.VesperSky.getFlight && window.VesperSky.getFlight();
    if (!flight || !flight.pos || !window.VesperPlaces || !window.VesperPlaces.hubs) return 0;
    let n = 0;
    try {
      window.VesperPlaces.hubs().forEach((h) => {
        if (!h.hostile || !h.wrap || h._scared) return;
        const dx = flight.pos.x - h.wrap.position.x;
        const dy = flight.pos.y - h.wrap.position.y;
        const dz = flight.pos.z - h.wrap.position.z;
        if (Math.sqrt(dx * dx + dy * dy + dz * dz) < 40) {
          h._scared = true;
          n++;
        }
      });
    } catch (_) {}
    return n;
  }

  function fireFlare() {
    if (!hasItem("weapon-flare") && !hasItem("weapon-signal-lamp") && !hasItem("weapon-hail-beacon")) {
      toast("No flare/lamp/wand · talk Kael / Sable / Pike / market");
      return;
    }
    // A flare from the inner system used to scare every dark buoy and
    // complete "fire near a contact" without being near one.
    if (!scareNearbyHostiles()) {
      toast("No dark contact in range — close on the buoy, then flare");
      return;
    }
    toast("Flare · distress signal (nonlethal) — dark contacts peel off");
    ping("quest");
    const ctx = window.__vesperLifeCtx || (window.__vesperLifeCtx = {});
    ctx.flared = true;
    advanceQuests(ctx);
  }

  function hasItem(id) {
    return inv.some((x) => x.id === id);
  }
  function giveItem(id, silent) {
    const def = ITEM_CATALOG.find((x) => x.id === id);
    if (!def) return false;
    if (hasItem(id)) return false;
    inv.push({ id: def.id, name: def.name, kind: def.kind, at: Date.now() });
    saveJSON(LS_INV, inv);
    if (!silent) { toast("Item · " + def.name); ping("item"); }
    renderInv();
    advanceQuests();
    return true;
  }

  function ping(kind) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!ping.ctx) ping.ctx = new AC();
      const o = ping.ctx.createOscillator();
      const g = ping.ctx.createGain();
      o.type = "sine";
      o.frequency.value = kind === "quest" ? 660 : kind === "talk" ? 440 : 520;
      g.gain.value = 0.04;
      o.connect(g); g.connect(ping.ctx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.0001, ping.ctx.currentTime + 0.18);
      o.stop(ping.ctx.currentTime + 0.2);
    } catch (_) {}
  }
  function toast(msg) {
    if (window.VesperPlaces && document.getElementById("vesper-place-toast")) {
      const el = document.getElementById("vesper-place-toast");
      el.textContent = msg;
      el.style.opacity = "0.95";
      clearTimeout(toast._t);
      toast._t = setTimeout(() => {
        if (el.textContent === msg) el.style.opacity = "0";
      }, 2600);
    } else if (window.VesperSky && window.VesperSky.version) {
      try {
        const ev = new CustomEvent("vesper:toast", { detail: { msg: msg } });
        window.dispatchEvent(ev);
      } catch (_) {}
    }
  }

  function renderInv() {
    ensureUI();
    const lines = inv.map((x) => {
      const eq = x.id === "weapon-flare" || x.id === "rover-key" || x.id === "hope-beacon-kit";
      return "· " + x.name + (eq ? " <span style='color:#9fd'>*ready*</span>" : "") +
        " <span style='opacity:.55'>(" + x.kind + ")</span>";
    });
    const useBtns = inv
      .filter((x) => /weapon-flare|hope-beacon-kit|med-foam|sky-radio-crystal|weapon-beacon-remote|weapon-signal-lamp|weapon-hail-beacon|weapon-patch-gun|weapon-foam-sprayer/.test(x.id))
      .map(
        (x) =>
          "<button type='button' data-use='" +
          x.id +
          "' style='margin:3px 0;display:block;width:100%;text-align:left;padding:6px 8px'>" +
          (x.id === "weapon-flare" ? "Use flare" : x.id === "hope-beacon-kit" ? "Plant Hope beacon" : x.id === "med-foam" ? "Apply med foam" : x.id === "weapon-signal-lamp" ? "Hail lamp" : x.id === "weapon-hail-beacon" ? "Hail wand" : x.id === "weapon-patch-gun" ? "Apply seal" : x.id === "weapon-foam-sprayer" ? "Spray foam" : x.id === "weapon-beacon-remote" ? "Arm beacon" : "Tune radio crystal") +
          "</button>"
      )
      .join("");
    ui.inv.innerHTML =
      panelHeader("INVENTORY (I)", "vl-inv-close") +
      "<div style='margin-top:4px'>" +
      (lines.length ? lines.join("<br>") : "<i style='opacity:.6'>Empty — land hubs, talk, collect</i>") +
      "</div><div style='margin-top:8px'>" +
      useBtns +
      "</div><div style='margin-top:10px;opacity:.65;font-size:10px'>Guilds: " +
      GUILD_DEFS.map((g) => g.name.split(" ")[0] + " " + (guilds[g.id] || 0)).join(" · ") +
      "</div>";
    ui.inv.onclick = (e) => {
      const u = e.target && e.target.getAttribute && e.target.getAttribute("data-use");
      if (!u) return;
      if (u === "weapon-flare") fireFlare();
      if (u === "weapon-signal-lamp" || u === "weapon-hail-beacon") {
        if (!scareNearbyHostiles()) {
          toast("Hail needs a dark contact in range");
          return;
        }
        const ctx = window.__vesperLifeCtx || (window.__vesperLifeCtx = {});
        ctx.flared = true;
        toast(u === "weapon-signal-lamp" ? "Signal lamp · clean hail sent (nonlethal)" : "Hail wand · clean hail (nonlethal)");
        ping("use");
        advanceQuests(ctx);
      }
      if (u === "weapon-patch-gun") {
        toast("Seal injector · field seal applied (clinic vibe)");
        ping("use");
        if (!hasItem("suit-patch")) giveItem("suit-patch");
      }
      if (u === "weapon-foam-sprayer") {
        toast("Foam sprayer · clinic seal mist (nonlethal care)");
        ping("use");
        if (!hasItem("med-foam")) giveItem("med-foam");
      }
      if (u === "weapon-beacon-remote") {
        if (hasItem("hope-beacon-kit")) { toast("Beacon remote · Hope kit armed — plant when walking"); ping("use"); }
        else toast("Need a Hope Beacon Kit in inventory");
      }
      else if (u === "hope-beacon-kit") {
        const ctx = window.__vesperLifeCtx || (window.__vesperLifeCtx = {});
        if (!(ctx.hubs && ctx.hubs["oort-whisper"])) {
          toast("Plant the Hope kit at the Oort Whisper buoy");
          return;
        }
        ctx.hopePlanted = true;
        toast("Hope beacon planted · someone else may need the light");
        advanceQuests(ctx);
      }
      else if (u === "med-foam") toast("Med foam · seals feel honest again");
      else if (u === "sky-radio-crystal") toast("Sky Radio · crystal clears static near relays");
      ping("item");
    };
    wirePanelClose(ui.inv, "vl-inv-close");
  }

  function renderJournal() {
    ensureUI();
    const qstate = loadJSON(LS_QUEST, {});
    const blocks = QUEST_DEFS.map((q) => {
      const st = qstate[q.id] || { step: 0, done: false };
      const mark = st.done ? "✓" : "·";
      const step = q.steps[Math.min(st.step, q.steps.length - 1)];
      const tags = (q.romance ? " ♥" : "") + (q.conflict ? " ⚠" : "") + (q.guild ? "" : "");
      return (
        "<div style='margin:8px 0;opacity:" + (st.done ? "0.55" : "1") + "'><b>" + mark + " " + q.title + tags +
        "</b><br><span style='opacity:.8'>" + (st.done ? "Complete" : step.text) + "</span></div>"
      );
    });
    const th = Object.keys(threads)
      .map((k) => "· " + k + ": " + threads[k])
      .join("<br>");
    const canWrite = hasItem("letter-mira") && threads.mira !== "replied";
    const canWrite2 = hasItem("geo-nightsides-chip") && threads.mira === "replied" && threads.mira !== "warm2";
    ui.journal.innerHTML =
      panelHeader("JOURNAL (J)", "vl-jou-close") + blocks.join("") +
      (th ? "<div style='margin-top:10px'><b>Threads</b><br>" + th + "</div>" : "") +
      (canWrite ? "<div style='margin-top:10px'><button type='button' id='vm-write-mira' style='min-height:46px;padding:10px 14px;width:100%;border-radius:10px'>Write Mira back</button></div>" : "") +
      (canWrite2 ? "<div style='margin-top:8px'><button type='button' id='vm-write-mira2' style='min-height:46px;padding:10px 14px;width:100%;border-radius:10px'>Send nightsides to Mira</button></div>" : "") +
      "<div style='margin-top:8px;opacity:.6;font-size:10px'>E talk/pickup · G rover · V cam · U opens guilds only while walking in Live; in flight U hides menus · K codex</div>";
    const btn = document.getElementById("vm-write-mira");
    if (btn) {
      btn.onclick = () => {
        const ctxW = window.__vesperLifeCtx || {};
        if (!checkFlag("quiet:shore", ctxW)) {
          toast("Write from a quiet shore — Titan, Deimos, or the Moon");
          return;
        }
        threads.mira = "replied";
        saveJSON(LS_THREAD, threads);
        guilds.refuge = (guilds.refuge || 0) + 5;
        saveJSON(LS_GUILD, guilds);
        toast("Letter sent · Mira will read it on the next quiet watch");
        advanceQuests(window.__vesperLifeCtx || {});
        renderJournal();
      };
    }
    const btn2 = document.getElementById("vm-write-mira2");
    if (btn2) {
      btn2.onclick = () => {
        threads.mira = "warm2";
        saveJSON(LS_THREAD, threads);
        if (!hasItem("letter-mira-2")) giveItem("letter-mira-2");
        guilds.refuge = (guilds.refuge || 0) + 6;
        saveJSON(LS_GUILD, guilds);
        toast("Nightsides sent · Mira's second letter is yours");
        advanceQuests(window.__vesperLifeCtx || {});
        renderJournal();
      };
    }
    wirePanelClose(ui.journal, "vl-jou-close");
  }

  function renderGuilds() {
    ensureUI();
    if (!ui.guild) {
      ui.guild = document.createElement("div");
      ui.guild.id = "vesper-guild";
      ui.guild.style.cssText = ui.inv.style.cssText.replace("right:12px", "right:12px").replace("top:96px", "top:300px");
      ui.guild.style.top = "300px";
      ui.guild.style.width = "260px";
      document.body.appendChild(ui.guild);
      ui.guild.style.display = "none";
    }
    ui.guild.innerHTML =
      panelHeader("GUILDS (U)", "vl-gui-close") +
      "<div style='margin-top:4px'>" +
      GUILD_DEFS.map((g) => {
        const rep = guilds[g.id] || 0;
        const bar = Math.min(20, Math.floor(rep / 2));
        return "<div style='margin:6px 0'><b>" + g.name + "</b> · " + rep +
          "<br><span style='opacity:.75;font-size:10px'>" + g.focus + "</span>" +
          "<br><span style='letter-spacing:-1px;color:#80c0ff'>" + "█".repeat(bar) + "░".repeat(Math.max(0, 12 - bar)) + "</span></div>";
      }).join("") +
      "</div><div style='margin-top:8px;opacity:.6;font-size:10px'>Earn standing via quests — not checklist spam</div>";
    wirePanelClose(ui.guild, "vl-gui-close");
  }
  function toggleGuilds() {
    ensureUI();
    // Context HUD: no inv/journal/guild/codex while PILOT fly
    if (!requireWalkLife("Guilds")) {
      try {
        if (ui.inv) ui.inv.style.display = "none";
        if (ui.journal) ui.journal.style.display = "none";
        if (ui.guild) ui.guild.style.display = "none";
        if (ui.codex) ui.codex.style.display = "none";
      } catch (_) {}
      return;
    }
    if (ui.guild && ui.guild.style.display === "block") { ui.guild.style.display = "none"; return; }
    openOnly("guild");
  }
  function renderCodex() {
    ensureUI();
    if (!ui.codex) {
      ui.codex = document.createElement("div");
      ui.codex.id = "vesper-codex";
      ui.codex.style.cssText = ui.inv.style.cssText;
      ui.codex.style.left = "12px";
      ui.codex.style.right = "auto";
      ui.codex.style.top = "96px";
      ui.codex.style.width = "280px";
      ui.codex.style.display = "none";
      document.body.appendChild(ui.codex);
    }
    const owned = new Set(inv.map((x) => x.id));
    const lines = ITEM_CATALOG.map((it) => {
      const has = owned.has(it.id);
      return "<div style='margin:4px 0;opacity:" + (has ? "1" : "0.4") + "'>" +
        (has ? "◆ " : "◇ ") + it.name +
        " <span style='opacity:.6'>[" + it.rare + " · " + it.kind + "]</span>" +
        (has ? "<br><span style='opacity:.75;font-size:10px'>" + it.blurb + "</span>" : "") +
        "</div>";
    });
    const n = owned.size;
    ui.codex.innerHTML =
      panelHeader("CODEX (K) · " + n + "/" + ITEM_CATALOG.length, "vl-codex-close") +
      "<div style='margin-top:4px'>" + lines.join("") + "</div>";
    wirePanelClose(ui.codex, "vl-codex-close");
  }

  function requireWalkLife(label) {
    if (document.body.dataset.product === "learn") {
      try {
        if (window.VesperSky && window.VesperSky.guideToast)
          window.VesperSky.guideToast("Crew panels · switch to LIVE (same Sol)", 2000);
      } catch (_) {}
      return false;
    }
    const s = window.VesperSky;
    const walking = !!(s && s.isWalking && s.isWalking());
    if (!walking) {
      try {
        if (window.VesperSky && window.VesperSky.guideToast) window.VesperSky.guideToast((label || "Life") + " · EVA only — land first", 1600);
      } catch (_) {}
      return false;
    }
    return true;
  }
  function toggleCodex() {
    ensureUI();
    // Context HUD: no inv/journal/guild/codex while PILOT fly
    if (!requireWalkLife("Codex")) {
      try {
        if (ui.inv) ui.inv.style.display = "none";
        if (ui.journal) ui.journal.style.display = "none";
        if (ui.guild) ui.guild.style.display = "none";
        if (ui.codex) ui.codex.style.display = "none";
      } catch (_) {}
      return;
    }
    if (ui.codex && ui.codex.style.display === "block") { ui.codex.style.display = "none"; return; }
    openOnly("codex");
  }
  function toggleInventory() {
    ensureUI();
    // Context HUD: no inv/journal/guild/codex while PILOT fly
    if (!requireWalkLife("Inventory")) {
      try {
        if (ui.inv) ui.inv.style.display = "none";
        if (ui.journal) ui.journal.style.display = "none";
        if (ui.guild) ui.guild.style.display = "none";
        if (ui.codex) ui.codex.style.display = "none";
      } catch (_) {}
      return;
    }
    if (ui.inv && ui.inv.style.display === "block") { ui.inv.style.display = "none"; return; }
    openOnly("inv");
  }
  function toggleJournal() {
    ensureUI();
    // Context HUD: no inv/journal/guild/codex while PILOT fly
    if (!requireWalkLife("Journal")) {
      try {
        if (ui.inv) ui.inv.style.display = "none";
        if (ui.journal) ui.journal.style.display = "none";
        if (ui.guild) ui.guild.style.display = "none";
        if (ui.codex) ui.codex.style.display = "none";
      } catch (_) {}
      return;
    }
    if (ui.journal && ui.journal.style.display === "block") { ui.journal.style.display = "none"; return; }
    openOnly("journal");
  }

  function checkFlag(flag, ctx) {
    if (!flag) return false;
    if (flag.indexOf("||") >= 0) {
      const parts = flag.split("||");
      for (let i = 0; i < parts.length; i++) {
        if (checkFlag(parts[i], ctx)) return true;
      }
      return false;
    }
    if (flag.startsWith("walk:")) return ctx.walkBody === flag.slice(5);
    if (flag.startsWith("item:")) return hasItem(flag.slice(5));
    if (flag.startsWith("talk:")) {
      const id = flag.slice(5);
      const at = ctx.talkAtClock && ctx.talkAtClock[id];
      // A greeting already in the log must not clear the next step.
      // Only a talk after this step opened counts.
      if (!at || at <= (ctx._needTalkAfter || 0)) return false;
      const spoke = ctx.talkBody && ctx.talkBody[id];
      // Tess and Ember stand on every pad. A Moon hello must not
      // finish Phoebe, Annex B, the mail buoy, or Hebe.
      const place = ctx._talkPlace || ctx.walkBody;
      return !!spoke && !!place && spoke === place;
    }
    if (flag.startsWith("hub:")) return !!ctx.hubs && ctx.hubs[flag.slice(4)];
    if (flag.startsWith("near:")) return !!ctx.near && ctx.near[flag.slice(5)];
    if (flag.startsWith("aboard:")) return (window.__vesperAboard || "") === flag.slice(7);
    if (flag.startsWith("drive:")) return !!ctx.drove;
    if (flag.startsWith("flare:")) return !!ctx.flared;
    if (flag.startsWith("conflict:")) return !!(ctx.flared || ctx.evaded);
    if (flag === "mira:replied") return threads.mira === "replied";
    if (flag === "hope:planted") return !!(ctx && ctx.hopePlanted);
    if (flag === "kael:oort") return !!(ctx && ctx.kaelOort);
    if (flag === "quiet:shore") {
      // "Stand" is not the landing itself. The latch is four still seconds
      // on Titan, Deimos, or the Moon, outside the hangar and cabin.
      return !!(ctx && ctx.quietShore);
    }
    // After the sulcus desk, not merely "already on Enceladus".
    if (flag === "quiet:enceladus") return !!(ctx && ctx.quietEnceladus);
    return false;
  }

  function advanceQuests(ctx) {
    ctx = ctx || window.__vesperLifeCtx || {};
    const qstate = loadJSON(LS_QUEST, {});
    let changed = false;
    QUEST_DEFS.forEach((q) => {
      const st = qstate[q.id] || { step: 0, done: false };
      if (st.done) return;
      let step = st.step || 0;
      let talkMark = st.talkMark || 0;
      let placeBody = st.placeBody || "";
      while (step < q.steps.length) {
        ctx._needTalkAfter = talkMark;
        // Next talk has to happen on the world where the previous step
        // cleared, not on whatever pad you greet Tess from later.
        ctx._talkPlace = placeBody || ctx.walkBody;
        if (!checkFlag(q.steps[step].check, ctx)) break;
        step++;
        talkMark = ctx.talkClock || talkMark;
        placeBody = ctx.walkBody || placeBody;
        changed = true;
      }
      st.step = step;
      st.talkMark = talkMark;
      st.placeBody = placeBody;
      if (step >= q.steps.length) {
        st.done = true;
        (q.reward.items || []).forEach((id) => giveItem(id, true));
        if (q.reward.guild) {
          Object.keys(q.reward.guild).forEach((g) => {
            guilds[g] = (guilds[g] || 0) + q.reward.guild[g];
          });
          saveJSON(LS_GUILD, guilds);
        }
        if (q.reward.thread) {
          threads[q.reward.thread] = q.romance ? "warm" : q.conflict ? "tense" : "open";
          saveJSON(LS_THREAD, threads);
        }
        toast("Quest · " + q.title + " ✓ — " + (q.reward.blurb || ""));
        ping("quest");
      }
      qstate[q.id] = st;
    });
    if (changed) {
      saveJSON(LS_QUEST, qstate);
      renderJournal();
      const doneN = Object.keys(qstate).filter((k) => qstate[k] && qstate[k].done).length;
      if (doneN >= 5 && !loadJSON("vesper.life.ms5", false)) {
        saveJSON("vesper.life.ms5", true);
        toast("Milestone · 5 activities complete — Sol feels less empty");
        ping("quest");
      }
      if (doneN >= 10 && !loadJSON("vesper.life.ms10", false)) {
        saveJSON("vesper.life.ms10", true);
        toast("Milestone · 10 activities — Listen Society notices");
      }
    }
  }

  const DIALOGUE = {
    mira: {
      start: "You look like you've been flying too long. Refuge keeps spare seals — and better tea.",
      choices: [
        { t: "Tell me about the Refuge", next: "refuge", tone: "warm" },
        { t: "I could use a letter", next: "letter", tone: "romance", give: "letter-mira" },
        { t: "I brought nightsides", next: "second_letter", tone: "romance" },
        { t: "Tried Belt tea?", next: "haven_tea", tone: "romance" },
        { t: "Hope Desk stamp?", next: "hope_desk", tone: "romance" },
        { t: "Just passing through", next: "bye" },
      ],
      refuge: {
        line: "Mutual aid, not charity. Sign the board if you leave something for the next pilot.",
        choices: [
          { t: "I'll leave a Hope kit", next: "kit", give: "hope-beacon-kit" },
          { t: "Thank you, Mira", next: "bye", tone: "romance" },
        ],
      },
      letter: {
        line: "Write me from somewhere quiet. Not a screenshot — a place that held you.",
        choices: [
          { t: "I will — somewhere quiet", next: "promise", tone: "romance" },
          { t: "What counts as quiet?", next: "quiet", tone: "romance" },
        ],
      },
      quiet: {
        line: "A shore lamp. A yard thermos. Not a conquest speech.",
        choices: [{ t: "I understand", next: "promise", tone: "romance" }],
      },
      promise: {
        line: "Then go. Journal (J) when you're ready to write back. I'll keep the Refuge kettle on.",
        choices: [
          { t: "Until then", next: "bye", tone: "romance" },
          { t: "Stay one more minute", next: "stay", tone: "romance" },
        ],
      },
      stay: {
        line: "Your suit still smells like vacuum. I'll pretend that's charming. Come back after the Yard job.",
        choices: [
          { t: "I'll come back", next: "bye", tone: "romance" },
          { t: "Walk me to the airlock?", next: "airlock", tone: "romance" },
        ],
      },
      airlock: {
        line: "Only to the pressure door. Rumors travel faster than ships here.",
        choices: [{ t: "Understood", next: "bye", tone: "romance" }],
      },
      second_letter: {
        line: "You brought nightsides. Good. Second letter — kettle's still on. Sit when the Yard job is done.",
        choices: [
          { t: "I'll sit soon", next: "bye", tone: "romance", give: "letter-mira-2" },
          { t: "Walk me halfway?", next: "airlock", tone: "romance" },
        ],
      },
      kit: { line: "Good. Plant it where someone might need the light.", choices: [{ t: "Leave", next: "bye" }] },
      haven_tea: {
        line: "Haven's leaf is honest. Bring me a cup sometime — kettle pairs well with tea bricks.",
        choices: [{ t: "I'll bring one", next: "bye", tone: "romance" }],
      },
      hope_desk: {
        line: "Wren stamps care at the Hope Desk. Pair her stamp with a planted beacon — not a checklist clear.",
        choices: [{ t: "I'll find Wren", next: "bye", tone: "romance" }],
      },
      bye: { line: "Fly careful. The sky is patient; suits are not.", choices: [] },
    },
    kael: {
      start: "Dark docks don't need heroes. They need people who carry flares and leave.",
      choices: [
        { t: "What's out there?", next: "dark" },
        { t: "Give me the warning chip", next: "chip", give: "warning-kael" },
        { t: "I can handle myself", next: "pride", tone: "conflict" },
        { t: "Pike on Io?", next: "pike_tip", tone: "conflict" },
      ],
      dark: {
        line: "Unregistered contacts past 30 AU. Hail once. If they don't answer clean — don't invent a war.",
        choices: [
          { t: "I'll take a flare", next: "flare", give: "weapon-flare" },
          { t: "Understood", next: "bye" },
        ],
      },
      chip: { line: "Read it before Kuiper Waystation. Restraint reads louder than guns.", choices: [{ t: "Leave", next: "bye" }] },
      pride: {
        line: "That's how people become stories Kael has to finish. Take the flare anyway.",
        choices: [
          { t: "Fine — give me the flare", next: "flare", give: "weapon-flare", tone: "conflict" },
          { t: "I'll evade instead", next: "evade", tone: "conflict" },
        ],
      },
      evade: {
        line: "Good. Burning away is also a kind of honesty. Chip still helps at Kuiper.",
        choices: [
          { t: "Take the chip", next: "chip", give: "warning-kael" },
          { t: "Leave", next: "bye" },
        ],
      },
      flare: {
        line: "Nonlethal. Signal, don't slaughter. Listen Society prefers you come back.",
        choices: [
          { t: "I'll remember", next: "bye" },
          { t: "Also the chip", next: "chip", give: "warning-kael" },
        ],
      },
      pike_tip: {
        line: "Heat honesty. Foam and hail wand. Sable mediates the dark; Pike files the plume. Both want you back.",
        choices: [
          { t: "I'll find them", next: "bye", tone: "conflict" },
          { t: "Take flare anyway", next: "flare", give: "weapon-flare", tone: "conflict" },
        ],
      },
      bye: { line: "Oort buoys hear everything. So do I.", choices: [] },
    },
    yard: {
      start: "Yard stays lit because someone has to. Tea's on the thermos — patch packs by the crates.",
      choices: [
        { t: "Need a patch pack", next: "patch", give: "suit-patch" },
        { t: "How's Phobos looking?", next: "phobos" },
        { t: "Join the Yard Crew?", next: "guild" },
      ],
      patch: {
        line: "Clinic-grade. Don't wait for a hiss to remember seals.",
        choices: [
          { t: "Thanks, Rafi", next: "bye" },
          { t: "Any yard work tonight?", next: "watch" },
        ],
      },
      watch: {
        line: "Relays drift. Hangar crates need counting. Tea thermos is the real mission clock.",
        choices: [
          { t: "I'll walk the hangar", next: "bye" },
          { t: "Spare parts?", next: "parts" },
        ],
      },
      parts: {
        line: "Spare Parts Drift in the belt — honest scrap, no conquest branding. Tip goes to Assay after.",
        choices: [{ t: "I'll find it", next: "bye" }],
      },
      phobos: {
        line: "Closer than it feels. Don't daydream the burn — Deimos is patient, Mars isn't.",
        choices: [
          { t: "Copy", next: "bye" },
          { t: "Ferry schedule?", next: "ferry" },
        ],
      },
      ferry: {
        line: "Chalk on the Stickney overlook. Dust tea if you're early.",
        choices: [{ t: "I'll find it", next: "bye" }],
      },
      guild: {
        line: "Stand a night watch, leave tea, don't steal crates. Pin comes after the work.",
        choices: [
          { t: "I'll earn it", next: "bye" },
          { t: "Take a patch anyway", next: "patch", give: "suit-patch" },
        ],
      },
      bye: { line: "Lights stay on.", choices: [] },
    },
    assay: {
      start: "Honest weights or you don't get a pin. Ceres salts read bright — bring a tag, not a story.",
      choices: [
        { t: "Request salt tag tip", next: "tag", give: "ore-tag-ceres" },
        { t: "What does Assay stand for?", next: "about" },
        { t: "Trade rumor?", next: "rumor" },
      ],
      tag: { line: "Stamp after Occator. Half-true belt rumors stop at my desk.", choices: [{ t: "On my way", next: "bye" }] },
      about: { line: "Belt Assay Cooperative — samples, trade, no conquest branding.", choices: [{ t: "Respect", next: "bye" }] },
      rumor: {
        line: "Trojan L4 ice is clean this season. L5 tells better stories.",
        choices: [
          { t: "Noted", next: "bye" },
          { t: "Assay pin path?", next: "pin" },
        ],
      },
      pin: {
        line: "Honest weights at Occator, then Outpost A. No conquest branding on the stamp.",
        choices: [{ t: "I'll weigh true", next: "bye" }],
      },
      bye: { line: "Weigh true.", choices: [] },
    },
    ion: {
      start: "This helix is Hyp fiction — still sells spare dreams. Kardashev talk is cheap.",
      choices: [
        { t: "Take a plaque rubbing (Hyp)", next: "hyp", give: "hyp-plaque-rubbing" },
        { t: "Why label fiction?", next: "why" },
        { t: "Sol feels empty", next: "empty" },
      ],
      hyp: { line: "Charcoal on fiction plaque. Frame it next to SCIENCE.md honesty.", choices: [{ t: "Leave", next: "bye" }] },
      why: { line: "So Sol stays honest. Dreams need labels or they become lies.", choices: [{ t: "Fair", next: "bye" }] },
      empty: {
        line: "You're not looking at the desks. Or the people who keep tea warm.",
        choices: [
          { t: "I'll look harder", next: "bye" },
          { t: "Show me a desk worth stopping for", next: "desk" },
        ],
      },
      desk: {
        line: "Helix market runner booth — labeled Hyp. Trade spare dreams, not Sol honesty.",
        choices: [
          { t: "Fair", next: "bye" },
          { t: "Got a thruster tip?", next: "tip", give: "spare-thruster-tip" },
        ],
      },
      tip: {
        line: "Honest scrap from Spare Parts Drift energy. Assay still wants the stamp.",
        choices: [{ t: "Pocketed", next: "bye" }],
      },
      bye: { line: "Fly the fiction carefully.", choices: [] },
    },
    nova: {
      start: "City lights underfoot are hopeful, not decorative. Ask the stall if you need a keyfob.",
      choices: [
        { t: "Beacon kit?", next: "kit", give: "hope-beacon-kit" },
        { t: "Show me the plaza", next: "plaza" },
        { t: "Where's Mira?", next: "mira" },
        { t: "Why do cities matter?", next: "plaza2" },
      ],
      kit: { line: "Plant it. Someone else may need the light.", choices: [{ t: "Thanks", next: "bye" }] },
      plaza: { line: "Monument, lamps, market — reasons to visit, not icons to clear.", choices: [{ t: "Got it", next: "bye" }] },
      mira: { line: "Refuge desk when she's not mid-tea. Tell her Nova sent you.", choices: [{ t: "I will", next: "bye" }] },
      plaza2: {
        line: "Monument isn't a checklist icon. Sit. Watch Earth nightsides if the weather clears.",
        choices: [
          { t: "I'll sit", next: "bye" },
          { t: "Who's Jax?", next: "jax" },
        ],
      },
      jax: {
        line: "GEO nightsides tech — up the relay rest buoy. Chip for Mira if you're writing again.",
        choices: [{ t: "I'll find him", next: "bye", tone: "romance" }],
      },
      bye: { line: "FLOAT when you want the sky to breathe.", choices: [] },
    },
    solis: {
      start: "Hold still over the lineae. The ice remembers impacts — vials go to Deep Listen.",
      choices: [
        { t: "Request ice vial", next: "vial", give: "ice-vial-europa" },
        { t: "Why listen?", next: "why" },
        { t: "Kepler?", next: "kepler" },
        { t: "Other ice moons?", next: "plume" },
        { t: "Damascus sulcus?", next: "damascus" },
      ],
      vial: { line: "Sealed soft. Not a souvenir shelf piece.", choices: [{ t: "Careful hands", next: "bye" }] },
      why: { line: "Because farther out, slower years — and quieter hope.", choices: [{ t: "Leave", next: "bye" }] },
      kepler: { line: "Still holds. Watch the clock title for ratios.", choices: [{ t: "Leave", next: "bye" }] },
      plume: {
        line: "Farther moons remember differently. Enceladus sings; Europa waits. Both prefer quiet hands.",
        choices: [
          { t: "I'll keep quiet hands", next: "bye" },
          { t: "Ice vial tip", next: "vial", give: "ice-vial-europa" },
        ],
      },
      damascus: {
        line: "Tiger-stripe watch on Enceladus. Hold still. Listen Society files quiet better than conquest.",
        choices: [{ t: "I'll stand the watch", next: "bye" }],
      },
      bye: { line: "Ice keeps secrets kindly.", choices: [] },
    },
    brick: {
      start: "Rovers hate coarse dust. Keyfob helps; patience helps more.",
      choices: [
        { t: "Need a keyfob tip", next: "key", give: "rover-key" },
        { t: "Fix advice?", next: "fix" },
        { t: "Kael said something", next: "kael" },
        { t: "Greenhouse seals?", next: "dust2" },
        { t: "Olympus overlook?", next: "olympus" },
        { t: "Marineris rim?", next: "marineris" },
        { t: "Utopia camp?", next: "utopia" },
      ],
      key: { line: "Wake it with G after soft-land. Don't floor it in fines.", choices: [{ t: "Copy", next: "bye" }] },
      fix: { line: "Seals first, pride second. Same as suits.", choices: [{ t: "Thanks", next: "bye" }] },
      kael: { line: "If Kael warns you, listen once. Twice if you're stubborn.", choices: [{ t: "I'll listen", next: "bye" }] },
      dust2: {
        line: "Noctis greenhouse seals fail when you rush. Foam first, then pride.",
        choices: [
          { t: "Foam tip noted", next: "bye" },
          { t: "Need a keyfob", next: "key", give: "rover-key" },
        ],
      },
      olympus: {
        line: "Overlook bench isn't a conquest photo op. Dust tag if you sit honestly.",
        choices: [{ t: "I'll sit", next: "bye", give: "olympus-dust-tag" }],
      },
      marineris: {
        line: "Canyon rim camp — dust radio, not a flag. Sample if you sit.",
        choices: [{ t: "I'll sit", next: "bye", give: "marineris-dust" }],
      },
      utopia: {
        line: "Planitia camp — rover paths, not conquest. Keyfob if you ask kindly.",
        choices: [{ t: "Key tip", next: "bye", give: "rover-key" }],
      },
      bye: { line: "Dust remembers haste.", choices: [] },
    },
    reed: {
      start: "Greens spin so we can breathe without begging Earth. Trade oxygen stories, not conquest.",
      choices: [
        { t: "Need a scanner", next: "scan", give: "weapon-scanner" },
        { t: "Garden tour?", next: "tour" },
        { t: "Leave", next: "bye" },
      ],
      scan: { line: "Reads hub purpose tags. Assay smiles when tags are clean.", choices: [{ t: "Thanks", next: "bye" }] },
      tour: {
        line: "Cylinder spine, cafe nook, quiet — a reason to dock.",
        choices: [
          { t: "Nice", next: "bye" },
          { t: "Oxygen trade tip?", next: "o2" },
        ],
      },
      o2: {
        line: "Greens spin so we don't beg Earth. Trade stories, not conquest ledgers.",
        choices: [
          { t: "Understood", next: "bye" },
          { t: "Skytape Bay?", next: "skytape" },
        ],
      },
      skytape: {
        line: "Skytape Bay Drift keeps Sky Radio clear — crystal helps. Society desk overflow.",
        choices: [{ t: "I'll dock there", next: "bye", give: "sky-radio-crystal" }],
      },
      bye: { line: "Keep the leaves lit.", choices: [] },
    },
    vessa: {
      start: "Polar ice is rumor until you stand the rim. Med foam before bravado.",
      choices: [
        { t: "Med foam", next: "med", give: "med-foam" },
        { t: "Callisto tip?", next: "cal" },
        { t: "Tycho rays?", next: "tycho" },
        { t: "Copernicus overlook?", next: "copernicus" },
        { t: "Tranquility walk?", next: "tranq" },
        { t: "Leave", next: "bye" },
      ],
      med: { line: "Refuge clinic staple. Don't wait for the hiss.", choices: [{ t: "Pocketed", next: "bye" }] },
      cal: {
        line: "Valhalla Archive keeps longer memories than egos.",
        choices: [
          { t: "Noted", next: "bye" },
          { t: "Io heat vs polar ice?", next: "heat" },
        ],
      },
      heat: {
        line: "Different honesty. Foam for seals either way. Don't invent a war with a vent.",
        choices: [{ t: "Copy", next: "bye" }],
      },
      tycho: {
        line: "Bright rays, quiet walk. Take a photo — not a conquest stamp. Asgard on Callisto keeps longer tea.",
        choices: [{ t: "Photo tip", next: "bye", give: "tycho-ray-photo" }],
      },
      copernicus: {
        line: "Overlook plaque. Quiet photo. Same rule — no conquest stamps.",
        choices: [{ t: "Photo tip", next: "bye", give: "copernicus-photo" }],
      },
      tranq: {
        line: "Selene keeps the plaque path. Memorial, not a clear. Tell her the rim still has foam.",
        choices: [{ t: "I'll find her", next: "bye" }],
      },
      bye: { line: "Rim wind is a metaphor. Still — careful.", choices: [] },
    },
    quill: {
      start: "Thick sky cafe — methane shore lamp's my shift. Romance in vacuum is letters and radio.",
      choices: [
        { t: "Shore sample", next: "sample", give: "methane-sample" },
        { t: "Tell me about dating out here", next: "date", tone: "romance" },
        { t: "Brought Belt tea from Haven", next: "tea_gift", tone: "romance" },
        { t: "Ligeia annex?", next: "ligeia", tone: "romance" },
        { t: "Kraken North lamp?", next: "kraken_n", tone: "romance" },
        { t: "Just browsing", next: "bye" },
      ],
      sample: { line: "Postcard in a bottle. Don't swim it.", choices: [{ t: "Pocketed", next: "bye" }] },
      date: {
        line: "You write. You wait. You don't rush someone across AU. If that suits you — good.",
        choices: [
          { t: "It might", next: "trust", tone: "romance" },
          { t: "Slow is fine", next: "slow", tone: "romance" },
        ],
      },
      trust: {
        line: "Then we keep talking. No ownership. Just two people who don't want the dark alone.",
        choices: [
          { t: "I'd like that", next: "booth", tone: "romance" },
          { t: "Ping when the belt is loud", next: "bye", tone: "romance" },
        ],
      },
      booth: {
        line: "When you're next at Ceres or L5, find the quiet booth. I'll save the light that doesn't blink.",
        choices: [
          { t: "I'll find you", next: "bye", tone: "romance", give: "letter-quill" },
          { t: "Bring tea?", next: "tea", tone: "romance", give: "letter-quill" },
        ],
      },
      tea: {
        line: "Recycled leaf. Best kind. Don't tell Listen Society that romance is also a signal.",
        choices: [{ t: "Secret kept", next: "bye", tone: "romance" }],
      },
      slow: {
        line: "Slow is how orbits last. Lamp stays on till the shift ends.",
        choices: [{ t: "I will", next: "bye", tone: "romance" }],
      },
      tea_gift: {
        line: "Haven's leaf. Honest. Sit under Ontario lamp — I'll save the light that doesn't blink.",
        choices: [
          { t: "Together a minute", next: "bye", tone: "romance", give: "letter-quill" },
          { t: "Tea shared", next: "bye", tone: "romance" },
        ],
      },
      ligeia: {
        line: "Ligeia shore lamp is the annex. Postcard if you stand under it — same slow rules.",
        choices: [{ t: "I'll stand there", next: "bye", tone: "romance", give: "ligeia-postcard" }],
      },
      kraken_n: {
        line: "North lamp for long watches. Card if you stand — still no rush across AU.",
        choices: [{ t: "I'll stand", next: "bye", tone: "romance", give: "kraken-north-card" }],
      },
      bye: { line: "Lamp stays on till the shift ends.", choices: [] },
    },
    oriole: {
      start: "Belt Drift Library — cards are free if you leave a map tip. Quiet is the real currency.",
      choices: [
        { t: "Request a library card", next: "card", give: "library-card-belt" },
        { t: "Where's Quill's booth?", next: "quill", tone: "romance" },
        { t: "Just browsing maps", next: "maps" },
      ],
      card: {
        line: "Stamp done. Leave a chalk tip when you can. No conquest branding on the shelves.",
        choices: [
          { t: "Thanks, Oriole", next: "bye" },
          { t: "Any romance shelves?", next: "quill", tone: "romance" },
        ],
      },
      quill: {
        line: "Kraken Shore / Ontario lamp. She saves the light that doesn't blink. Tell her the library still has tea.",
        choices: [{ t: "I'll tell her", next: "bye", tone: "romance" }],
      },
      maps: {
        line: "Trojan L4 ice clean this season. Quaoar ring rumor is chalk-only until you stand the desk.",
        choices: [
          { t: "Noted", next: "bye" },
          { t: "Tea House?", next: "haven" },
        ],
      },
      haven: {
        line: "Haven pours next drift over. Cards for maps; cups for courage. Tell her Oriole still shelves quietly.",
        choices: [{ t: "I will", next: "bye", tone: "romance" }],
      },
      bye: { line: "Keep the quiet lit.", choices: [] },
    },
    jax: {
      start: "GEO rest sees Earth cities breathe at night. Hope, not tourism. Chip if you're writing Mira.",
      choices: [
        { t: "Take nightsides chip", next: "chip", give: "geo-nightsides-chip", tone: "romance" },
        { t: "Why GEO?", next: "why" },
        { t: "Kael / dark docks?", next: "dark" },
      ],
      chip: {
        line: "Frame it next to her letter. Second letter comes when the chip sits in your inventory.",
        choices: [
          { t: "I'll keep it close", next: "bye", tone: "romance", give: "letter-mira-2" },
          { t: "Thanks, Jax", next: "bye", tone: "romance" },
        ],
      },
      why: {
        line: "LEO Refuge is crowded kindness. GEO is the long look — nightsides as proof someone kept the lights on.",
        choices: [{ t: "Beautiful", next: "bye" }],
      },
      dark: {
        line: "Carry a flare or signal lamp. Hail once. Evade if dirty. Sable mediates — find her outer.",
        choices: [{ t: "Copy", next: "bye" }],
      },
      bye: { line: "Cities still breathe.", choices: [] },
    },
    sable: {
      start: "I'm Listen mediation — not a hero desk. Hail once. Signal lamp. Evade. Log restraint.",
      choices: [
        { t: "Take a signal lamp", next: "lamp", give: "weapon-signal-lamp", tone: "conflict" },
        { t: "What counts as dirty hail?", next: "dirty", tone: "conflict" },
        { t: "I already carry a flare", next: "flare", tone: "conflict" },
        { t: "Seal Clinic?", next: "clinic", tone: "conflict" },
      ],
      lamp: {
        line: "Nonlethal dock lamp. Clean hail gets a clean answer. Dirty hail — burn away.",
        choices: [
          { t: "I'll hail clean", next: "log", tone: "conflict" },
          { t: "Also Kael's chip?", next: "chip", give: "warning-kael", tone: "conflict" },
        ],
      },
      dirty: {
        line: "No registry. No Refuge ping. Guns first. Don't invent a war to feel brave.",
        choices: [
          { t: "Take the lamp", next: "lamp", give: "weapon-signal-lamp", tone: "conflict" },
          { t: "I'll evade", next: "log", tone: "conflict" },
        ],
      },
      flare: {
        line: "Good. Lamp is backup language. File a restraint log after you use either.",
        choices: [{ t: "File it", next: "log", tone: "conflict", give: "conflict-log-kael" }],
      },
      log: {
        line: "Listen Society prefers you come back. Log filed when you flare or evade once.",
        choices: [
          { t: "Leave", next: "bye", give: "conflict-log-kael" },
          { t: "Mediation note", next: "bye", give: "letter-sable", tone: "conflict" },
        ],
      },
      chip: { line: "Kael's chip still reads before Kuiper. Pair it with the lamp.", choices: [{ t: "Leave", next: "bye" }] },
      bye: { line: "Hail once. Then decide.", choices: [] },
    },

    haven: {
      start: "Tea House Drift — recycled leaf, honest rumors. Sit before the belt feels loud again.",
      choices: [
        { t: "I'll take a tea brick", next: "tea", give: "tea-brick-belt", tone: "romance" },
        { t: "Any word from Quill?", next: "quill", tone: "romance" },
        { t: "Just warming up", next: "warm" },
      ],
      tea: {
        line: "Pocket it. If you see Quill's shore lamp, share a cup — romance is also logistics.",
        choices: [
          { t: "I will", next: "bye", tone: "romance" },
          { t: "Pin?", next: "pin", give: "guild-pin-tea", tone: "romance" },
        ],
      },
      pin: {
        line: "Tea House pin — social mark, not conquest. Oriole stamps maps; I stamp cups.",
        choices: [
          { t: "Thanks, Haven", next: "bye", tone: "romance", give: "letter-haven" },
          { t: "Keep the note", next: "bye", tone: "romance", give: "letter-haven" },
        ],
      },
      quill: {
        line: "Ontario Lacus lamp is her annex. Tell her the leaf is still honest.",
        choices: [{ t: "I'll carry tea there", next: "bye", tone: "romance", give: "tea-brick-belt" }],
      },
      warm: {
        line: "Good. Empty Sol is a posture problem — desks and cups fix it.",
        choices: [{ t: "Fair", next: "bye" }],
      },
      bye: { line: "Cup's yours. Come back loud or quiet.", choices: [] },
    },
    pike: {
      start: "Prometheus plume watch. Heat first. Hail dirty docks with a wand — not a speech.",
      choices: [
        { t: "Need a hail wand", next: "wand", give: "weapon-hail-beacon", tone: "conflict" },
        { t: "How bad is the plume?", next: "heat", tone: "conflict" },
        { t: "Sable sent me", next: "sable", tone: "conflict" },
      ],
      wand: {
        line: "Longer hail than a lamp. Nonlethal. Pair with foam if seals hiss.",
        choices: [
          { t: "Pocketed", next: "bye", tone: "conflict" },
          { t: "Also ash tag", next: "tag", give: "prometheus-ash-tag", tone: "conflict" },
          { t: "Seal injector?", next: "seal", give: "weapon-patch-gun", tone: "conflict" },
        ],
      },
      seal: {
        line: "Field seal tool — clinic vibe. Foam first, speech never.",
        choices: [{ t: "Pocketed", next: "bye", tone: "conflict" }],
      },
      tag: { line: "Prometheus ash. Io heat — not Amalthea's radiation belt.", choices: [{ t: "Copy", next: "bye" }] },
      heat: {
        line: "Tidal fire. Stand the watch, don't invent a forge war. Foam before bravado.",
        choices: [
          { t: "Take the wand", next: "wand", give: "weapon-hail-beacon", tone: "conflict" },
          { t: "Leave", next: "bye" },
        ],
      },
      sable: {
        line: "Good. She files restraint. I file heat. Both want you back.",
        choices: [{ t: "I'll hail clean", next: "bye", tone: "conflict", give: "letter-sable" }],
      },
      bye: { line: "Stay upwind of the yellow.", choices: [] },
    },

    kira: {
      start: "Night Market — honest scrap after Assay closes. Tokens buy tea money, not conquest.",
      choices: [
        { t: "Take a market token", next: "token", give: "night-market-token" },
        { t: "What sells after hours?", next: "after" },
        { t: "Haven's leaf?", next: "haven", tone: "romance" },
      ],
      token: {
        line: "Stamp done. Spare tips welcome. Don't invent a war over scrap.",
        choices: [
          { t: "Thanks, Kira", next: "bye", give: "letter-kira" },
          { t: "Night slip?", next: "bye", give: "letter-kira" },
        ],
      },
      after: {
        line: "Thruster tips, foam, rumor chalk. Assay still wants honest weights at dawn.",
        choices: [
          { t: "Token please", next: "token", give: "night-market-token" },
          { t: "Noted", next: "bye" },
        ],
      },
      haven: {
        line: "She pours next drift. Tell her night market still buys leaf tips.",
        choices: [{ t: "I will", next: "bye", tone: "romance" }],
      },
      bye: { line: "Lights stay low. Trade stays clean.", choices: [] },
    },
    wren: {
      start: "Hope Desk — stamps care, not checklist icons. Beacon kit if you're planting light.",
      choices: [
        { t: "Request Hope stamp", next: "stamp", give: "hope-desk-stamp", tone: "romance" },
        { t: "Beacon kit?", next: "kit", give: "hope-beacon-kit", tone: "romance" },
        { t: "Why desks matter?", next: "why" },
      ],
      stamp: {
        line: "Refuge overflow mark. Pair with Mira's kettle or Haven's cup.",
        choices: [
          { t: "I'll plant light", next: "bye", tone: "romance", give: "letter-wren" },
          { t: "Also a kit", next: "kit", give: "hope-beacon-kit", tone: "romance" },
          { t: "Keep your note", next: "bye", tone: "romance", give: "letter-wren" },
        ],
      },
      kit: {
        line: "Plant where the next pilot might need it. Empty Sol is a posture problem.",
        choices: [{ t: "Understood", next: "bye", tone: "romance" }],
      },
      why: {
        line: "Empty maps are icons without people. We keep desks, tea, and letters.",
        choices: [{ t: "Fair", next: "bye" }],
      },
      bye: { line: "Care travels farther than thrust.", choices: [] },
    },

    dante: {
      start: "Guild Hall Drift — pins for work done. Assay, Refuge, Yard, Listen all keep desks.",
      choices: [
        { t: "Request Guild Hall pin", next: "pin", give: "guild-pin-guildhall" },
        { t: "Who meets here?", next: "who" },
        { t: "Night Market tip?", next: "kira" },
      ],
      pin: {
        line: "Stamp for showing up to desks, not speeches. Don't invent a war for a pin.",
        choices: [{ t: "Thanks, Dante", next: "bye" }],
      },
      who: {
        line: "Weighmasters, Refuge medics, Yard watch, Listen mediators. Tea optional. Conquest banned.",
        choices: [
          { t: "Pin please", next: "pin", give: "guild-pin-guildhall" },
          { t: "Respect", next: "bye" },
        ],
      },
      kira: {
        line: "Night Market after Assay closes. Tokens for tea money. Tell Kira the hall still lights.",
        choices: [{ t: "I will", next: "bye" }],
      },
      bye: { line: "Desks stay lit.", choices: [] },
    },
    selene: {
      start: "Tranquility Walk — memorial path. Photo quiet. No conquest stamps.",
      choices: [
        { t: "Take a memorial photo tip", next: "photo", give: "tranquility-photo", tone: "romance" },
        { t: "Why memorial not checklist?", next: "why" },
        { t: "Vessa's rim?", next: "vessa" },
      ],
      photo: {
        line: "Hold still by the plaque. Same honesty as Tycho and Copernicus.",
        choices: [
          { t: "Quiet kept", next: "bye", tone: "romance" },
          { t: "Walk with me a minute?", next: "walk", tone: "romance" },
        ],
      },
      walk: {
        line: "Only to the next cairn. Rumors travel. Soft leave when you're ready.",
        choices: [{ t: "Understood", next: "bye", tone: "romance" }],
      },
      why: {
        line: "Empty maps clear icons. We clear dust from plaques and sit.",
        choices: [{ t: "Fair", next: "bye" }],
      },
      vessa: {
        line: "Shackleton rim and Asgard tea. Tell her Tranquility still has footprints of care.",
        choices: [{ t: "I will", next: "bye" }],
      },
      bye: { line: "Walk kindly.", choices: [] },
    },

    tess: {
      start: "Dock hangar steward. Job board's lit — Sol stays lived-in when pads stay busy.",
      choices: [
        { t: "Take a dock job chit", next: "chit", give: "dock-job-chit" },
        { t: "Airlock drill?", next: "drill", give: "airlock-drill-tag" },
        { t: "Hangar tea note?", next: "note", give: "letter-tess", tone: "romance" },
        { t: "Why ME-scale docks?", next: "why" },
      ],
      chit: {
        line: "Honest work stamp. Walk crates, check clamps, don't invent a war for overtime.",
        choices: [
          { t: "Pin for Dock Hands?", next: "pin", give: "guild-pin-dock" },
          { t: "Thanks, Tess", next: "bye" },
        ],
      },
      pin: {
        line: "Dock Hands pin — hangar/airlock mutual aid. Reed and Yard both nod.",
        choices: [{ t: "Wear it quiet", next: "bye" }],
      },
      drill: {
        line: "Twice through the tube. Tag proves you can leave and come back without drama.",
        choices: [{ t: "Understood", next: "bye" }],
      },
      note: {
        line: "Hangar kettle logistics across AU. Write when a pad feels empty — I'll light the board.",
        choices: [
          { t: "I'll write", next: "bye", tone: "romance" },
          { t: "Walk the cabin with me?", next: "cabin", tone: "romance" },
        ],
      },
      cabin: {
        line: "Only to the hatch ring. Soft leave when thrust calls. Kettle stays.",
        choices: [{ t: "Soft leave", next: "bye", tone: "romance" }],
      },
      why: {
        line: "Tiny props leave empty maps. Walkable hangars are how people live after land.",
        choices: [{ t: "Fair", next: "bye" }],
      },
      bye: { line: "Pads busy. Sky kinder.", choices: [] },
    },
    cass: {
      start: "Outer desk courier — Sputnik to Rhea. Notes, not conquest.",
      choices: [
        { t: "Sputnik desk note", next: "sputnik", give: "sputnik-note" },
        { t: "Rhea tea brick tip?", next: "rhea" },
        { t: "Kael restraint?", next: "kael" },
      ],
      sputnik: {
        line: "Nitrogen hush chalk. Hold still on the heart. Listen Society files quiet.",
        choices: [{ t: "Logged", next: "bye" }],
      },
      rhea: {
        line: "Quiet Tea on Rhea — Haven's icy cousin. Bring a brick if you sit.",
        choices: [{ t: "I will", next: "bye", give: "rhea-tea-brick" }],
      },
      kael: {
        line: "He files restraint logs. I file desk mail. Both beat hero speeches past 30 AU.",
        choices: [{ t: "Understood", next: "bye" }],
      },
      bye: { line: "Desks all the way out.", choices: [] },
    },
    rio: {
      start: "Hearth Buoy. Tea's hot. The dark can wait.",
      choices: [
        { t: "Long-watch tea?", next: "tea", give: "oort-hearth-brick", tone: "warm" },
        { t: "Hearth note?", next: "note", give: "letter-rio", tone: "romance" },
        { t: "Hail tip?", next: "hail", give: "weapon-hearth-lamp", tone: "conflict" },
      ],
      tea: {
        line: "Brick for the watch. Cass carries notes if you write.",
        choices: [{ t: "Thanks", next: "bye" }],
      },
      note: {
        line: "Keep it. Logistics across AU — not conquest stamps.",
        choices: [{ t: "I'll write", next: "bye", tone: "romance" }],
      },
      hail: {
        line: "Lamp for dirty docks. Hail clean, leave clean.",
        choices: [{ t: "Clean hail", next: "bye" }],
      },
      bye: { line: "Hearth stays lit.", choices: [] },
    },
    lumen: {
      start: "Plaques stay labeled Hyp. Sol desks stay honest.",
      choices: [
        { t: "Matrioshka rubbing?", next: "rub", give: "hyp-core-rubbing", tone: "curious" },
        { t: "Why label fiction?", next: "why", tone: "curious" },
        { t: "Curator note?", next: "note", give: "letter-lumen", tone: "warm" },
      ],
      rub: {
        line: "Charcoal from the core walk. Fiction — wear it proudly labeled.",
        choices: [{ t: "Labeled", next: "bye" }],
      },
      why: {
        line: "Kardashev dreams without honesty become empty Sol. We refuse empty.",
        choices: [{ t: "Fair", next: "bye" }],
      },
      note: {
        line: "Ion sells dreams. I keep the plaques true.",
        choices: [{ t: "Thanks", next: "bye" }],
      },
      bye: { line: "Fiction labeled. Sol honest.", choices: [] },
    },
    nori: {
      start: "Parts Locker — foam, seals, honest bolts.",
      choices: [
        { t: "Need foam?", next: "foam", give: "weapon-foam-sprayer", tone: "warm" },
        { t: "Dock Hands?", next: "dock", give: "guild-pin-dock", tone: "warm" },
        { t: "Tess overflow?", next: "tess", tone: "curious" },
      ],
      foam: {
        line: "Clinic vibe, not FPS. Seals over speeches.",
        choices: [{ t: "Thanks", next: "bye" }],
      },
      dock: {
        line: "Pin if you mean the airlock twice.",
        choices: [{ t: "Mean it", next: "bye" }],
      },
      tess: {
        line: "She sends hangar overflow. Kettle's not decoration.",
        choices: [{ t: "Got it", next: "bye" }],
      },
      bye: { line: "Bolts honest.", choices: [] },
    },
    ember: {
      start: "Pad crates move so hangars don't feel empty. Tess keeps the board lit.",
      choices: [
        { t: "Annex B?", next: "annex", tone: "curious" },
        { t: "Need a hand stacking?", next: "stack", tone: "romance" },
        { t: "Later", next: "bye" },
      ],
      annex: {
        line: "Dock Hands Annex B — airlock twice if you mean the pin. Nori stocks seals.",
        choices: [{ t: "Got it", next: "bye" }],
      },
      stack: {
        line: "Mass before speeches. Leave a note on the board if you clear a bay.",
        choices: [{ t: "Will do", next: "bye", give: "iris-weight-tag" }],
      },
      bye: { line: "Keep the pad honest.", choices: [] },
    },

  };

  function markTalk(ctx, id) {
    ctx.talkClock = (ctx.talkClock || 0) + 1;
    ctx.talkAtClock = ctx.talkAtClock || {};
    ctx.talkAtClock[id] = ctx.talkClock;
    ctx.talkBody = ctx.talkBody || {};
    ctx.talkBody[id] = ctx.walkBody || "";
    ctx.talked = ctx.talked || {};
    ctx.talked[id] = true;
  }

  function talkTo(npc) {
    ensureUI();
    activeTalk = npc;
    const tree = DIALOGUE[npc.id];
    if (!tree) {
      // fallback
      const line = (npc.lines && npc.lines[0]) || "...";
      ui.talk.innerHTML = "<b>" + npc.name + "</b><p>" + line + "</p><button type='button' data-a='close'>Leave</button>";
      closeAllPanels("talk"); ui.talk.style.display = "block";
      ui.talk.onclick = (e) => {
        if (e.target && e.target.getAttribute("data-a") === "close") ui.talk.style.display = "none";
      };
      return;
    }
    function showNode(key) {
      const node = key === "start" ? { line: tree.start, choices: tree.choices } : tree[key];
      if (!node) { ui.talk.style.display = "none"; return; }
      if (key === "bye" || (node.choices && node.choices.length === 0)) {
        const ctx = window.__vesperLifeCtx || (window.__vesperLifeCtx = {});
        markTalk(ctx, npc.id);
        if (npc.id === "kael" && ctx.hubs && ctx.hubs["oort-whisper"]) ctx.kaelOort = true;
        advanceQuests(ctx);
      }
      const btns = (node.choices || [])
        .map((c, i) => "<button type='button' data-i='" + i + "' style='margin:5px 0;display:block;width:100%;text-align:left;padding:12px 14px;min-height:46px;border-radius:10px;border:1px solid rgba(120,180,255,0.35);background:rgba(30,50,80,0.9);color:#e8f4ff;font:15px system-ui,sans-serif'>" + c.t + "</button>")
        .join("");
      const leave = (!node.choices || !node.choices.length)
        ? "<button type='button' data-a='close' style='margin:4px'>Leave</button>"
        : "<button type='button' data-a='close' style='margin:4px;opacity:.7'>Leave</button>";
      ui.talk.innerHTML =
        "<b>" + npc.name + "</b> · <span style='opacity:.7'>" + npc.role + (npc.hyp ? " · Hyp" : "") + "</span>" +
        "<p style='margin:10px 0;line-height:1.45'>" + (node.line || tree.start) + "</p><div>" + btns + leave + "</div>";
      closeAllPanels("talk"); ui.talk.style.display = "block";
      ui.talk.onclick = (e) => {
        const a = e.target && e.target.getAttribute && e.target.getAttribute("data-a");
        const ix = e.target && e.target.getAttribute && e.target.getAttribute("data-i");
        if (a === "close") { ui.talk.style.display = "none"; return; }
        if (ix == null) return;
        const choice = (node.choices || [])[Number(ix)];
        if (!choice) return;
        if (choice.give) {
          const here = (window.__vesperLifeCtx && window.__vesperLifeCtx.walkBody) || "";
          // Cass stands on Rhea and on Pluto. The heart note and the Rhea
          // brick were both on her tree, so either desk paid the other world's item.
          if (choice.give === "sputnik-note" && here !== "Pluto") {
            toast("Sputnik note is the heart desk on Pluto");
          } else if (choice.give === "rhea-tea-brick" && here !== "Rhea") {
            toast("Rhea tea is the quiet brick on Rhea");
          } else if (choice.give === "ore-tag-ceres" && here !== "Ceres") {
            toast("Occator salt tag is on Ceres, not this rock");
          } else if (choice.give === "airlock-drill-tag" && !(window.__vesperLifeCtx && window.__vesperLifeCtx.hubs && window.__vesperLifeCtx.hubs["belt-airlock-school"])) {
            toast("Airlock drill tag is at Airlock School Drift, not this pad");
          } else if (choice.give === "iris-weight-tag" && here !== "Iris Assay Spur") {
            // Ember stands on every pad. Stacking crates on the Moon was handing out the Iris stamp.
            toast("Iris weight tag is the assay spur, not this pad");
          } else {
            giveItem(choice.give);
          }
        }
        if (choice.tone === "romance") {
          threads[npc.id] = threads[npc.id] === "replied" ? "replied" : "warm";
          saveJSON(LS_THREAD, threads);
        }
        if (choice.tone === "conflict") {
          threads[npc.id] = "tense";
          saveJSON(LS_THREAD, threads);
        }
        const ctx = window.__vesperLifeCtx || (window.__vesperLifeCtx = {});
        markTalk(ctx, npc.id);
        if (npc.id === "kael" && ctx.hubs && ctx.hubs["oort-whisper"]) ctx.kaelOort = true;
        advanceQuests(ctx);
        ping("talk");
        if (choice.next === "bye") {
          showNode("bye");
          setTimeout(() => { ui.talk.style.display = "none"; }, 1600);
        } else {
          showNode(choice.next);
        }
      };
    }
    showNode("start");
    const ctx = window.__vesperLifeCtx || (window.__vesperLifeCtx = {});
    markTalk(ctx, npc.id);
    if (npc.id === "kael" && ctx.hubs && ctx.hubs["oort-whisper"]) ctx.kaelOort = true;
    advanceQuests(ctx);
  }

  function spawnCityAndCast(bodyName, biome, surfaceRoot) {
    if (!surfaceRoot || !THREE) return;
    // Remove old life props
    const rm = [];
    surfaceRoot.traverse((ch) => {
      if (ch.name === "vesperCity" || (ch.name && ch.name.indexOf("lifeNpc:") === 0) || ch.name === "vesperRover") rm.push(ch);
    });
    // only direct-ish — safer remove by filter children recursively via list
    rm.forEach((ch) => {
      if (ch.parent) ch.parent.remove(ch);
    });

    const low = !!(window.matchMedia && matchMedia("(pointer: coarse)").matches);
    const rnd = mulberry(bodyName.length * 7919);
    const cityBiomes = /^(earth|mars|luna|moon|deck|deimos|phobos|titan|europa|ceres|ganymede|callisto|enceladus|plume|vesta|io|pluto|triton|miranda|rock|ice|metal|dust|station|yard|refuge|camp|habitat|kuiper|belt|hyp)$/i.test(biome || "");
    if (cityBiomes) {
      const city = makeCityBlock(biome || "rock", low, rnd);
      city.position.set(40, 0, 20); // clear of the bay (-Z)
      surfaceRoot.add(city);
      // Whole biome id. "titan" is inside titania, "earth" inside counterearth,
      // "luna" inside counterluna — those were growing a second city (and
      // Counter-Earth was growing Earth's hab pavilion).
      if (/^(earth|mars|luna|deimos|titan|europa|ceres)$/i.test(biome || "")) {
        const city2 = makeCityBlock(biome || "rock", low, mulberry(bodyName.length * 4999));
        city2.position.set(-40, 0, 20);
        city2.scale.setScalar(0.85);
        surfaceRoot.add(city2);
        if (!low && /^(earth|mars)$/i.test(biome || "")) {
          const city3 = makeCityBlock(biome || "rock", low, mulberry(bodyName.length * 3001));
          city3.position.set(40, 0, -40);
          city3.scale.setScalar(0.7);
          surfaceRoot.add(city3);
          // Hab interior pavilion
          const hab = new THREE.Group();
          hab.name = "vesperCity";
          const floor = new THREE.Mesh(
            new THREE.BoxGeometry(6, 0.1, 5),
            window.VesperMat({ color: 0x2a3038, metalness: 0.4, roughness: 0.65 })
          );
          floor.position.set(-8, 0.05, 2);
          const wall = new THREE.Mesh(
            new THREE.BoxGeometry(6, 2.4, 0.12),
            window.VesperMat({ color: 0x3a4555, metalness: 0.35, roughness: 0.5, emissive: 0x152030, emissiveIntensity: 0.15 })
          );
          wall.position.set(-8, 1.2, -0.4);
          const glow = window.VesperNoLight(0xa0d0ff, 0.55, 10, 2);
          glow.position.set(-8, 2.0, 2);
          hab.add(floor, wall, glow);
          surfaceRoot.add(hab);
        }
      }
      // Starter keyfob in cities
      if (["Earth","Mars","Deimos"].indexOf(bodyName) >= 0 && !hasItem("rover-key")) {
        // leave for market interaction — auto-hint
        const cityBody = bodyName;
        setTimeout(() => {
          const sky = window.VesperSky;
          const fl = sky && sky.getFlight && sky.getFlight();
          const here = fl && fl.walking && (fl.walkBody === cityBody || fl.surfaceBody === cityBody);
          if (!here) return;
          toast("City live · market stall · NPCs · I inventory · J journal");
        }, 600);
      }
    }
    // Place cast NPCs with purpose on matching bodies.
    // A fiction world whose name contains Garden, Belt, or Refuge
    // is still fiction. It does not inherit that Sol crew.
    let hypPad = /\(Hyp\)/.test(bodyName || "");
    if (!hypPad) {
      try {
        const hn = window.VesperHypothetics && window.VesperHypothetics.names && window.VesperHypothetics.names();
        if (hn && hn.indexOf(bodyName) >= 0) hypPad = true;
      } catch (_) {}
    }
    if (!hypPad) {
      try {
        const list = window.VesperSky && window.VesperSky._bodiesRef && window.VesperSky._bodiesRef();
        const hb = list && list.find((x) => x && x.name === bodyName);
        if (hb && hb.hypothetic) hypPad = true;
      } catch (_) {}
    }
    let followBody = "";
    try {
      const list = window.VesperSky && window.VesperSky._bodiesRef && window.VesperSky._bodiesRef();
      const hb = list && list.find((x) => x && x.name === bodyName);
      followBody = (hb && hb.group && hb.group.userData && hb.group.userData.followBody) || "";
    } catch (_) {}
    // "Tea" in Tiangong Tea Nook is the station kettle, not Belt Tea House.
    const beltTea = followBody !== "Tiangong" && /(?:^|[^A-Za-z0-9])Tea(?:[^A-Za-z0-9]|$)/i.test(bodyName || "");
    const placements = [];
    if (bodyName === "Deimos") placements.push({ npc: "yard", pos: [2.5, 0, 4] });
    if (bodyName === "Earth") {
      placements.push({ npc: "mira", pos: [6, 0, 5] });
      placements.push({ npc: "nova", pos: [9, 0, -4] });
    }
    if (bodyName === "Mars") placements.push({ npc: "brick", pos: [5, 0, 4] });
    if (bodyName === "Europa") placements.push({ npc: "solis", pos: [3, 0, 3] });
    if (bodyName === "Titan") placements.push({ npc: "quill", pos: [4, 0, -3] });
    if (!hypPad && /Ceres|Pallas|Vesta/i.test(bodyName)) placements.push({ npc: "assay", pos: [3, 0, 3] });
    // Numbered Kuiper-N rocks contain the letters "Kuiper". That is not Pluto.
    if (bodyName === "Pluto" || bodyName === "Eris" || bodyName === "Sedna") placements.push({ npc: "kael", pos: [4, 0, -2] });
    if (/Helix|Phaeton|Vulcan|Planet Nine|Nemesis|Tyche|Nibiru|Theia|PBH/i.test(bodyName)) placements.push({ npc: "ion", pos: [3, 0, 2] });
    if (!hypPad && /Ceres|Vesta|Pallas|Garden|Refinery|Belt/i.test(bodyName)) placements.push({ npc: "reed", pos: [5, 0, -2] });
    if (bodyName === "Moon" || /Shackleton/i.test(bodyName)) placements.push({ npc: "vessa", pos: [3.5, 0, 4] });
    if (!hypPad && /Ceres|Vesta|Pallas|Library|Garden|Belt/i.test(bodyName)) placements.push({ npc: "oriole", pos: [6.5, 0, 1.5] });
    if (bodyName === "Earth") placements.push({ npc: "jax", pos: [10, 0, 2] });
    if (bodyName === "Pluto" || bodyName === "Eris" || bodyName === "Sedna" || bodyName === "Quaoar") placements.push({ npc: "sable", pos: [5.5, 0, 2] });
    if (bodyName === "Deimos") placements.push({ npc: "sable", pos: [-2, 0, 3] });
    if (!hypPad && (/Ceres|Vesta|Pallas|Garden|Library|Belt/i.test(bodyName) || beltTea)) placements.push({ npc: "haven", pos: [7.5, 0, -1] });
    if (bodyName === "Io") placements.push({ npc: "pike", pos: [3, 0, 2.5] });
    // "Night" as a word also matches GEO Night Buoy. Kira is the belt market, not that buoy.
    if (!hypPad && (bodyName === "Ceres" || bodyName === "Vesta" || bodyName === "Pallas" || bodyName === "Night Overflow Drift" || beltTea || /(?:^|[^A-Za-z0-9])(?:Belt|Market)(?:[^A-Za-z0-9]|$)/i.test(bodyName))) placements.push({ npc: "kira", pos: [8, 0, 2] });
    if (!hypPad && (bodyName === "Earth" || bodyName === "Ceres" || /Hope|Refuge/i.test(bodyName) || /(?:^|[^A-Za-z0-9])Garden(?:[^A-Za-z0-9]|$)/i.test(bodyName))) placements.push({ npc: "wren", pos: [5, 0, -5] });
    if (!hypPad && /Ceres|Vesta|Pallas|Belt|Guild|\bHall\b/i.test(bodyName)) placements.push({ npc: "dante", pos: [4, 0, -3] });
    if (bodyName === "Moon") placements.push({ npc: "selene", pos: [6, 0, 1.5] });
    const coarseLife = !!(typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches);
    // Dock steward Tess near hangar on every soft-land (lived-in)
    placements.push({ npc: "tess", pos: [-6, 0, 8] });
    placements.push({ npc: "ember", pos: [4.5, 0, 12] });
    // Coarse cap used to be 4, with Tess and Ember sorted first.
    // Ceres queues about ten quest NPCs, so Wren, Haven, Kira, Dante,
    // and Nori never spawned on a phone. 10 keeps that cast.
    const placeCap = coarseLife ? 10 : 99;
    if (bodyName === "Pluto" || bodyName === "Charon" || bodyName === "Rhea" || bodyName === "Dione" || bodyName === "Iapetus" || bodyName === "Triton" || bodyName === "Eris" || bodyName === "Sedna") {
      placements.push({ npc: "cass", pos: [5, 0, 3] });
    }
    if (bodyName === "Salacia" || bodyName === "Orcus" || bodyName === "Varuna" || bodyName === "Ixion" || bodyName === "Gonggong") {
      placements.push({ npc: "rio", pos: [4.5, 0, -3] });
    }
    if (/Helix|Phaeton|Vulcan|Planet Nine|Nemesis|Tyche|Nibiru|Theia|PBH|Matrioshka|Bishop|Ringworld|Dyson/i.test(bodyName)) {
      placements.push({ npc: "lumen", pos: [3.5, 0, 2.5] });
    }
    if (!hypPad && /Ceres|Vesta|Pallas|Belt|Deimos|Parts|Locker/i.test(bodyName)) {
      placements.push({ npc: "nori", pos: [-3, 0, 6] });
    }
    // Always at least one local if city
    if (!placements.length && cityBiomes) {
      placements.push({ npc: NPC_CAST[(bodyName.length % NPC_CAST.length)].id, pos: [4, 0, 3] });
    }
    // iPhone: keep dock stewards visible (lived-in) when capping
    if (coarseLife && placements.length > placeCap) {
      const pri = ["tess", "ember", "mira", "yard", "brick"];
      placements.sort((a, b) => {
        const ia = pri.indexOf(a.npc); const ib = pri.indexOf(b.npc);
        return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
      });
    }
    if (placements.length > placeCap) placements = placements.slice(0, placeCap);
    placements.forEach((p) => {
      const def = NPC_CAST.find((n) => n.id === p.npc);
      if (!def) return;
      const h = makeHuman(def, low);
      h.position.set(p.pos[0], 0, p.pos[2]);
      surfaceRoot.add(h);
      // Idle lamp — denser lived-in without extra hub IDs
      const lamp = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.08, 1.1, low ? 5 : 8),
        window.VesperMat({ color: 0x4a5560, metalness: 0.5, roughness: 0.4 })
      );
      lamp.name = "npcIdleLamp";
      lamp.position.set(p.pos[0] + 0.55, 0.55, p.pos[2] + 0.2);
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, low ? 5 : 8, 5),
        window.VesperMat({ color: 0xffe8c0, emissive: 0xffa040, emissiveIntensity: 0.7 })
      );
      bulb.position.set(p.pos[0] + 0.55, 1.2, p.pos[2] + 0.2);
      surfaceRoot.add(lamp, bulb);
    });
    // Rover parked
    rover = makeRover();
    rover.position.set(-4, 0, 5);
    rover.visible = true;
    surfaceRoot.add(rover);
    const chargePad = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.3, 0.06, 16),
      window.VesperMat({ color: 0x304050, metalness: 0.5, roughness: 0.4, emissive: 0x206080, emissiveIntensity: 0.25 })
    );
    chargePad.position.set(-4, 0.03, 5);
    surfaceRoot.add(chargePad);

    // City blocks were parked at 40 m. The pad is often only 14–21 m,
    // so every building sat past the disc with nothing under it.
    if (surfaceRoot && window.VesperSurfaces && window.VesperSurfaces.growPad && THREE) {
      let maxR = 0;
      const tmp = new THREE.Vector3();
      surfaceRoot.updateMatrixWorld(true);
      for (let ci = 0; ci < surfaceRoot.children.length; ci++) {
        const ch = surfaceRoot.children[ci];
        // Hut and camp bays sit past the old disc. Grow so they have ground.
        if (!ch.name || (ch.name !== "vesperCity" && ch.name !== "genericWalkInterior" && ch.name.indexOf("interiorBay:") !== 0)) continue;
        ch.traverse((m) => {
          if (!m.isMesh) return;
          m.getWorldPosition(tmp);
          surfaceRoot.worldToLocal(tmp);
          const r = Math.hypot(tmp.x, tmp.z);
          if (r > maxR) maxR = r;
        });
      }
      if (maxR > 8) window.VesperSurfaces.growPad(maxR + 8);
    }
    // Market gives keyfob once
    if (cityBiomes) {
      const ctx = window.__vesperLifeCtx || (window.__vesperLifeCtx = {});
      ctx.near = ctx.near || {};
      ctx.near.hangar = true; // dock complex always on soft-land
    }
    // World collectible crumbs (walk into / E) — densifies ground without icon spam
    const crumbs = [];
    crumbs.push({ id: "dock-job-chit", pos: [-5, 0.2, 7] });
    if (/Deimos/i.test(bodyName)) { crumbs.push({ id: "suit-patch", pos: [-3, 0.2, 4.5] }); crumbs.push({ id: "weapon-flare", pos: [-2, 0.2, 5.2] }); }
    if (bodyName === "Earth") crumbs.push({ id: "hope-beacon-kit", pos: [7, 0.2, -5] });
    if (bodyName === "Mars") { crumbs.push({ id: "rover-key", pos: [4.5, 0.2, 3.5] }); crumbs.push({ id: "jezero-delta-tag", pos: [7, 0.2, 3] }); }
    if (/Pluto/i.test(bodyName)) crumbs.push({ id: "sputnik-note", pos: [3, 0.2, 2] });
    if (/Rhea/i.test(bodyName)) crumbs.push({ id: "rhea-tea-brick", pos: [2, 0.2, 4] });
    if (bodyName === "Moon") crumbs.push({ id: "shackleton-ice-chip", pos: [-3, 0.2, -4] });
    if (/Iapetus/i.test(bodyName)) crumbs.push({ id: "iapetus-ridge-photo", pos: [3, 0.2, 2] });
    if (/Enceladus/i.test(bodyName)) crumbs.push({ id: "tiger-stripe-vial", pos: [4, 0.2, 3] });
    if (bodyName === "Io") crumbs.push({ id: "prometheus-ash-tag", pos: [2, 0.2, -4] });
    if (/Callisto/i.test(bodyName)) crumbs.push({ id: "vali-tea-brick", pos: [-3, 0.2, 4] });
    if (/Miranda/i.test(bodyName)) crumbs.push({ id: "verona-chalk", pos: [2, 0.2, 1] });
    if (/Makemake/i.test(bodyName)) crumbs.push({ id: "makemake-bright-tag", pos: [2, 0.2, 2] });
    if (bodyName === "Mars") crumbs.push({ id: "olympus-overlook-photo", pos: [8, 0.2, -7] });
    if (/Europa/i.test(bodyName)) crumbs.push({ id: "ice-vial-europa", pos: [2.5, 0.2, 2.5] });
    if (/Ceres/i.test(bodyName)) crumbs.push({ id: "ore-tag-ceres", pos: [2.8, 0.2, 2.8] });
    if (bodyName === "Titan") crumbs.push({ id: "methane-sample", pos: [3.5, 0.2, -2.5] });
    if (bodyName === "Moon") crumbs.push({ id: "med-foam", pos: [2.5, 0.2, 3.5] });
    if (/Ceres|Garden/i.test(bodyName)) crumbs.push({ id: "weapon-scanner", pos: [4, 0.2, -1] });
    if (/Miranda|Ariel/i.test(bodyName)) crumbs.push({ id: "uranian-fault-chalk", pos: [2.2, 0.2, 2.0] });
    if (/Phoebe/i.test(bodyName)) crumbs.push({ id: "phoebe-boulder-tag", pos: [2.5, 0.2, 1.8] });
    if (/Starman/i.test(bodyName)) crumbs.push({ id: "starman-plaque-photo", pos: [1.5, 0.2, 1.5] });
    if (bodyName === "Earth") crumbs.push({ id: "photo-earth-night", pos: [8, 0.2, -6] });
    if (bodyName === "Earth") crumbs.push({ id: "geo-nightsides-chip", pos: [9.5, 0.2, 1.5] });
    if (/Ceres|Vesta/i.test(bodyName)) crumbs.push({ id: "library-card-belt", pos: [6, 0.2, 1] });
    if (/Quaoar/i.test(bodyName)) crumbs.push({ id: "quaoar-ring-note", pos: [2, 0.2, 2] });
    if (/Amalthea/i.test(bodyName)) crumbs.push({ id: "amalthea-caution", pos: [2, 0.2, 2] });
    if (bodyName === "Pluto") crumbs.push({ id: "weapon-signal-lamp", pos: [3, 0.2, -1] });
    if (/Ceres|Vesta/i.test(bodyName)) crumbs.push({ id: "tea-brick-belt", pos: [7, 0.2, -0.5] });
    if (bodyName === "Moon") crumbs.push({ id: "tycho-ray-photo", pos: [3.2, 0.2, -5.5] });
    if (bodyName === "Mars") crumbs.push({ id: "olympus-dust-tag", pos: [7.5, 0.2, 2] });
    if (bodyName === "Io") crumbs.push({ id: "weapon-hail-beacon", pos: [2.5, 0.2, 2] });
    if (/Janus/i.test(bodyName)) crumbs.push({ id: "janus-swap-chalk", pos: [2, 0.2, 1.5] });
    if (/Ceres|Vesta/i.test(bodyName)) crumbs.push({ id: "night-market-token", pos: [8, 0.2, 2.2] });
    if (bodyName === "Earth" || bodyName === "Ceres") crumbs.push({ id: "hope-desk-stamp", pos: [5.5, 0.2, -4.5] });
    if (bodyName === "Mars") crumbs.push({ id: "marineris-dust", pos: [-6, 0.2, 5] });
    if (bodyName === "Moon") crumbs.push({ id: "copernicus-photo", pos: [-1.5, 0.2, 6.5] });
    if (bodyName === "Titan") crumbs.push({ id: "ligeia-postcard", pos: [5, 0.2, -3.5] });
    if (bodyName === "Io" || bodyName === "Deimos") crumbs.push({ id: "weapon-patch-gun", pos: [1.5, 0.2, 3] });
    if (/Davida/i.test(bodyName)) crumbs.push({ id: "davida-ore-chip", pos: [2, 0.2, 2] });
    if (bodyName === "Moon") crumbs.push({ id: "tranquility-photo", pos: [6.2, 0.2, 1.2] });
    if (bodyName === "Titan") crumbs.push({ id: "kraken-north-card", pos: [-2, 0.2, 5.5] });
    if (/Ceres|Deimos/i.test(bodyName)) crumbs.push({ id: "weapon-foam-sprayer", pos: [3, 0.2, -2] });
    if (/Ceres|Vesta/i.test(bodyName)) crumbs.push({ id: "guild-pin-guildhall", pos: [4.2, 0.2, -2.5] });
    if (/Salacia/i.test(bodyName)) crumbs.push({ id: "salacia-ice-chip", pos: [2.2, 0.2, 2.0] });
    if (/Eros/i.test(bodyName)) crumbs.push({ id: "eros-saddle-photo", pos: [2.0, 0.2, 1.5] });
    if (bodyName === "Ida") crumbs.push({ id: "ida-dactyl-photo", pos: [2.5, 0.2, 1.8] });
    if (bodyName === "Mars") crumbs.push({ id: "hellas-dust-tag", pos: [8, 0.2, -5] });
    if (/Europa/i.test(bodyName)) crumbs.push({ id: "thrace-chaos-chalk", pos: [5.5, 0.2, -3] });
    if (/Callisto/i.test(bodyName)) crumbs.push({ id: "asgard-tea-brick", pos: [4, 0.2, -5] });
    if (bodyName === "Salacia") crumbs.push({ id: "listen-spur-chip", pos: [3, 0.2, -2] });
    if (bodyName === "Salacia" || bodyName === "Gonggong") crumbs.push({ id: "oort-hearth-brick", pos: [4, 0.2, 1] });
    if (/Helix|Phaeton|Matrioshka|Bishop/i.test(bodyName)) crumbs.push({ id: "hyp-core-rubbing", pos: [2.5, 0.2, 2] });
    // Hearth lamp is Rio's deep-dock gear, not a crumb on every pad.
    if (bodyName === "Salacia" || bodyName === "Orcus" || bodyName === "Varuna" || bodyName === "Gonggong" || bodyName === "Ixion") {
      crumbs.push({ id: "weapon-hearth-lamp", pos: [-5.5, 0.2, 8.5] });
    }
    if (bodyName === "Earth") crumbs.push({ id: "geo-night-chip", pos: [7, 0.2, -1] });
    if (bodyName === "Mars") crumbs.push({ id: "arabia-dust-tag", pos: [4, 0.2, 8] });
    if (bodyName === "Moon") crumbs.push({ id: "orientale-photo", pos: [-5, 0.2, 5] });
    if (/Nix/i.test(bodyName)) crumbs.push({ id: "nix-outer-chalk", pos: [2, 0.2, 1] });
    if (/Hi.?iaka|Hiiaka|Hiʻiaka/i.test(bodyName)) crumbs.push({ id: "hiiraki-spin-tag", pos: [2, 0.2, 2] });
    // Fiction pads keep the dock chit and hyp rubbings, not a Sol sample the name happened to contain.
    if (hypPad) {
      const hypKeep = { "dock-job-chit": 1, "hyp-core-rubbing": 1, "hyp-plaque-rubbing": 1 };
      for (let ci = crumbs.length - 1; ci >= 0; ci--) {
        if (!hypKeep[crumbs[ci].id]) crumbs.splice(ci, 1);
      }
    }
    crumbs.forEach((c) => {
      if (hasItem(c.id)) return;
      let mesh;
      if (/weapon-flare|weapon-scanner|weapon-signal-lamp|weapon-hail-beacon|weapon-foam-sprayer|weapon-patch-gun/.test(c.id)) {
        mesh = new THREE.Group();
        const body = new THREE.Mesh(
          new THREE.BoxGeometry(0.28, 0.08, 0.1),
          window.VesperMat({
            color: c.id.indexOf("flare") >= 0 ? 0xc04020 : c.id.indexOf("signal") >= 0 ? 0xe0c040 : 0x6080a0,
            metalness: 0.55, roughness: 0.35, emissive: c.id.indexOf("flare") >= 0 ? 0xff3000 : c.id.indexOf("signal") >= 0 ? 0xc0a020 : 0x2060a0, emissiveIntensity: 0.35,
          })
        );
        const grip = new THREE.Mesh(
          new THREE.BoxGeometry(0.08, 0.14, 0.08),
          window.VesperMat({ color: 0x303038, roughness: 0.7 })
        );
        grip.position.set(-0.06, -0.08, 0);
        mesh.add(body, grip);
      } else if (/med-foam|suit-patch/.test(c.id)) {
        mesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.06, 0.06, 0.16, 10),
          window.VesperMat({ color: 0xe0e8f0, metalness: 0.3, roughness: 0.4, emissive: 0x80a0c0, emissiveIntensity: 0.25 })
        );
      } else {
        mesh = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.12, 0),
          window.VesperMat({
            color: 0xe0c060, emissive: 0xc0a020, emissiveIntensity: 0.8, metalness: 0.4, roughness: 0.35,
          })
        );
      }
      mesh.position.set(c.pos[0], c.pos[1], c.pos[2]);
      mesh.name = "lifePickup:" + c.id;
      mesh.userData.itemId = c.id;
      surfaceRoot.add(mesh);
      const pl = window.VesperNoLight(0xffe080, 0.35, 4, 2);
      pl.position.set(c.pos[0], c.pos[1] + 0.2, c.pos[2]);
      surfaceRoot.add(pl);
    });
  }

  function boot(ctx) {
    if (bootOnce) return;
    bootOnce = true;
    THREE = ctx.THREE;
    scene = ctx.scene;
    inv = loadJSON(LS_INV, []);
    guilds = loadJSON(LS_GUILD, {});
    threads = loadJSON(LS_THREAD, {});
    ensureUI();
    renderInv();
    renderJournal();
    closeAllPanels();

    window.addEventListener("vesper:walk", (ev) => {
      const body = ev && ev.detail && ev.detail.body;
      const ctxL = window.__vesperLifeCtx || (window.__vesperLifeCtx = {});
      ctxL.walkBody = body;
      advanceQuests(ctxL);
      const runSpawn = (attempt) => {
        const sc = scene || (window.VesperSky && window.VesperSky.getScene && window.VesperSky.getScene());
        if (!sc || !body) return;
        let surfaceRoot = null;
        sc.traverse((ch) => {
          if (ch.name === "vesper-surface-detail") surfaceRoot = ch;
        });
        if (!surfaceRoot) {
          if (attempt < 8) setTimeout(() => runSpawn(attempt + 1), 80);
          return;
        }
        walkSurface = surfaceRoot;
        const biome =
          (window.VesperSurfaces && window.VesperSurfaces.biomeFor && window.VesperSurfaces.biomeFor(body)) || "rock";
        try {
          spawnCityAndCast(body, biome, surfaceRoot);
          if (window.VesperPlaces && window.VesperPlaces.ensureDockComplex) {
            window.VesperPlaces.ensureDockComplex(surfaceRoot, body, biome);
          }
          // alwaysHangarMarket — lived-in pad (not checklist)
          try {
            let hasMarket = false;
            surfaceRoot.traverse((ch) => {
              if (ch.name === "marketStall" || ch.name === "dockMarketPlaza" || ch.name === "dockMarketKiosk") hasMarket = true;
              if (ch.name === "dockMarketOpenSign" || ch.name === "marketOpenSign") marketSign = ch;
            });
            if (!hasMarket && typeof makeMarketStall === "function") {
              /* makeMarketStall may be local — fall through */
            }
            if (!hasMarket) {
              const stall = new THREE.Group();
              stall.name = "marketStall";
              const box = new THREE.Mesh(
                new THREE.BoxGeometry(1.6, 1.3, 1.15),
                window.VesperMat({ color: 0x3a5068, metalness: 0.5, roughness: 0.38, emissive: 0x183048, emissiveIntensity: 0.32, envMapIntensity: 0.9 })
              );
              box.position.y = 0.7;
              const aw = new THREE.Mesh(
                new THREE.BoxGeometry(2.0, 0.08, 1.5),
                window.VesperMat({ color: 0x5080a0, emissive: 0x204060, emissiveIntensity: 0.4 })
              );
              aw.position.y = 1.45;
              stall.add(box, aw);
              // Poles + hanging sign (outpost market cue)
              for (const sx of [-0.85, 0.85]) {
                const pole = new THREE.Mesh(
                  new THREE.CylinderGeometry(0.04, 0.04, 1.5, 6),
                  window.VesperMat({ color: 0x606870, metalness: 0.6, roughness: 0.4 })
                );
                pole.position.set(sx, 0.75, 0.55);
                stall.add(pole);
              }
              const sign = new THREE.Mesh(
                new THREE.BoxGeometry(0.7, 0.35, 0.05),
                window.VesperMat({ color: 0xffc060, emissive: 0xa06020, emissiveIntensity: 0.55 })
              );
              sign.name = "marketOpenSign";
              sign.position.set(0, 1.7, 0.6);
              marketSign = sign;
              stall.add(sign);
              // Goods crates at stall
              for (let i = 0; i < 3; i++) {
                const c = new THREE.Mesh(
                  new THREE.BoxGeometry(0.4, 0.35, 0.4),
                  window.VesperMat({ color: i === 1 ? 0x6a5030 : 0x405060, roughness: 0.65, metalness: 0.2 })
                );
                c.position.set(-0.9 + i * 0.55, 0.22, 0.9);
                stall.add(c);
              }
              // Vendor stub
              const vend = new THREE.Group();
              vend.name = "npc";
              const vt = new THREE.Mesh(
                THREE.CapsuleGeometry ? new THREE.CapsuleGeometry(0.12, 0.28, 4, 8) : new THREE.CylinderGeometry(0.12, 0.12, 0.45, 8),
                window.VesperMat({ color: 0xc8a070, metalness: 0.2, roughness: 0.55 })
              );
              vt.position.y = 0.6;
              const vh = new THREE.Mesh(
                new THREE.SphereGeometry(0.13, 8, 6),
                window.VesperMat({ color: 0xe8d0b0, roughness: 0.5 })
              );
              vh.position.y = 0.95;
              vend.add(vt, vh);
              vend.position.set(0.3, 0, -0.3);
              stall.add(vend);
              stall.position.set(6, 0, 10);
              surfaceRoot.add(stall);
            }
          } catch (_) {}
        } catch (e) {
          console.warn("[vesper-life]", e);
        }
        try {
          // Soft loot near hangar — lived-in, not checklist clear
          const crumb = new THREE.Mesh(
            new THREE.BoxGeometry(0.35, 0.28, 0.35),
            window.VesperMat({ color: 0x70a0c0, emissive: 0x306080, emissiveIntensity: 0.4 })
          );
          crumb.name = "lifePickup:suit-patch";
          crumb.position.set(2, 0.2, 11);
          crumb.userData.itemId = "suit-patch";
          surfaceRoot.add(crumb);
          const ration = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.22, 0.3),
            window.VesperMat({ color: 0xc08040, emissive: 0x604020, emissiveIntensity: 0.3 })
          );
          ration.name = "lifePickup:ration-pack";
          ration.position.set(4.5, 0.18, 9.5);
          ration.userData.itemId = "ration-pack";
          surfaceRoot.add(ration);
        } catch (_) {}
        toast("Lived-in · " + body + " — Tess/hangar · shops · cabin · walk (not a checkbox)");
        const padBody = body;
        setTimeout(() => {
          try {
            const sky = window.VesperSky;
            const fl = sky && sky.getFlight && sky.getFlight();
            const here = fl && fl.walking && (fl.walkBody === padBody || fl.surfaceBody === padBody);
            if (!here) return;
            toast("Pad ops · " + padBody + " — fuel hose live · market open · watch traffic");
          } catch (_) {}
        }, 2200);
      };
      runSpawn(0);
      // Auto loot hints for quests
      ctxL.near = ctxL.near || {};
      ctxL.near.hangar = true; // ME dock always
      if (/Deimos/i.test(body)) {
        ctxL.near.yard = true;
      }
      // Ground crumbs are the pickup. A timer used to put the Thrace
      // chalk (and the other desk samples) in the pack on landing, so
      // the quest toast fired before you reached the desk.
      // rover-key: find at market/NPC — not auto checkbox on land

      advanceQuests(ctxL);
    });

    window.addEventListener("vesper:place-near", (ev) => {
      const d = ev && ev.detail;
      if (!d) return;
      const ctxL = window.__vesperLifeCtx || (window.__vesperLifeCtx = {});
      ctxL.hubs = ctxL.hubs || {};
      if (d.id) {
        ctxL.hubs[d.id] = true;
        // prefix matches
        if (d.id === "belt-assay-a" || d.id === "belt-assay-b") ctxL.hubs["belt-assay"] = true;
        if (d.id.indexOf("leo-refuge") === 0) ctxL.hubs["leo-refuge"] = true;
        if (d.id.indexOf("kuiper-waystation") === 0) ctxL.hubs["kuiper-waystation"] = true;
        if (d.id.indexOf("belt-garden") === 0) ctxL.hubs["belt-garden"] = true;
        if (d.id.indexOf("belt-refinery") === 0) ctxL.hubs["belt-refinery"] = true;
        if (d.id.indexOf("earth-lagrange") === 0) ctxL.hubs["earth-lagrange"] = true;
        if (d.id.indexOf("matrioshka") === 0) ctxL.hubs["matrioshka"] = true;
        if (d.id.indexOf("belt-spare") === 0) ctxL.hubs["belt-spare-parts"] = true;
        if (d.id.indexOf("oort-whisper") === 0) ctxL.hubs["oort-whisper"] = true;
        if (d.id.indexOf("starman") === 0) ctxL.hubs["starman-educate"] = true;
        if (d.id.indexOf("miranda") === 0) ctxL.hubs["miranda-verona"] = true;
        if (d.id.indexOf("phoebe-dark") === 0) ctxL.hubs["phoebe-dark"] = true;
        if (d.id.indexOf("belt-library") === 0) ctxL.hubs["belt-library"] = true;
        if (d.id.indexOf("quaoar-weywot") === 0) ctxL.hubs["quaoar-weywot"] = true;
        if (d.id.indexOf("amalthea-watch") === 0) ctxL.hubs["amalthea-watch"] = true;
        if (d.id.indexOf("europa-chaos") === 0) ctxL.hubs["europa-chaos"] = true;
        if (d.id.indexOf("belt-tea-house") === 0) ctxL.hubs["belt-tea-house"] = true;
        if (d.id.indexOf("moon-tycho") === 0) ctxL.hubs["moon-tycho"] = true;
        if (d.id.indexOf("mars-olympus-bench") === 0) ctxL.hubs["mars-olympus-bench"] = true;
        if (d.id.indexOf("io-prometheus") === 0) ctxL.hubs["io-prometheus"] = true;
        if (d.id.indexOf("janus-coorbit") === 0) ctxL.hubs["janus-coorbit"] = true;
        if (d.id.indexOf("callisto-asgard") === 0) ctxL.hubs["callisto-asgard"] = true;
        if (d.id.indexOf("belt-assay-c") === 0) ctxL.hubs["belt-assay-c"] = true;
        if (d.id.indexOf("belt-night-market") === 0) ctxL.hubs["belt-night-market"] = true;
        if (d.id.indexOf("belt-hope") === 0) ctxL.hubs["belt-hope-desk"] = true;
        if (d.id.indexOf("mars-marineris") === 0) ctxL.hubs["mars-marineris"] = true;
        if (d.id.indexOf("titan-ligeria") === 0) ctxL.hubs["titan-ligeria"] = true;
        if (d.id.indexOf("hydra-pluto") === 0) ctxL.hubs["hydra-pluto"] = true;
        if (d.id.indexOf("enceladus-damascus") === 0) ctxL.hubs["enceladus-damascus"] = true;
        if (d.id.indexOf("leto-l4") === 0) ctxL.hubs["leto-l4"] = true;
        if (d.id.indexOf("davida") === 0) ctxL.hubs["davida-camp"] = true;
        if (d.id.indexOf("belt-guild") === 0) ctxL.hubs["belt-guild-hall"] = true;
        if (d.id.indexOf("belt-seal") === 0) ctxL.hubs["belt-seal-clinic"] = true;
        if (d.id.indexOf("moon-tranquility") === 0) ctxL.hubs["moon-tranquility"] = true;
        if (d.id.indexOf("titan-kraken-north") === 0) ctxL.hubs["titan-kraken-north"] = true;
        if (d.id.indexOf("belt-pin") === 0) ctxL.hubs["belt-pin-exchange"] = true;
        if (d.id.indexOf("mars-utopia") === 0) ctxL.hubs["mars-utopia"] = true;
        if (d.id.indexOf("belt-iris") === 0) ctxL.hubs["belt-iris"] = true;
        if (d.id.indexOf("belt-hebe") === 0) ctxL.hubs["belt-hebe"] = true;
        if (d.id.indexOf("leo-cupola-b") === 0) ctxL.hubs["leo-cupola-b"] = true;
        if (d.id.indexOf("mars-gale") === 0) ctxL.hubs["mars-gale"] = true;
        if (d.id.indexOf("belt-metis") === 0) ctxL.hubs["belt-metis-trade"] = true;
        if (d.id.indexOf("io-tvashtar") === 0) ctxL.hubs["io-tvashtar"] = true;
        if (d.id.indexOf("kuiper-salacia") === 0) ctxL.hubs["kuiper-salacia"] = true;

        if (d.id.indexOf("belt-juno") === 0) ctxL.hubs["belt-juno"] = true;
        if (d.id.indexOf("trojan-nector") === 0) ctxL.hubs["trojan-nector"] = true;
        if (d.id.indexOf("kuiper-orcus") === 0) ctxL.hubs["kuiper-orcus"] = true;
        if (d.id.indexOf("oort-ember-buoy") === 0) ctxL.hubs["oort-ember-buoy"] = true;
        if (d.id.indexOf("deimos-swift") === 0) ctxL.hubs["deimos-swift"] = true;
        if (d.id.indexOf("phobos-limtoc") === 0) ctxL.hubs["phobos-limtoc"] = true;
        if (d.id.indexOf("mars-syria-planum") === 0) ctxL.hubs["mars-syria-planum"] = true;

        if (d.id.indexOf("belt-flora") === 0) ctxL.hubs["belt-flora"] = true;
        if (d.id.indexOf("belt-dockhands-b") === 0) ctxL.hubs["belt-dockhands-b"] = true;
        if (d.id.indexOf("oort-vesper") === 0) ctxL.hubs["oort-vesper"] = true;
        if (d.id.indexOf("titan-punga") === 0) ctxL.hubs["titan-punga"] = true;
        if (d.id.indexOf("io-loki") === 0) ctxL.hubs["io-loki"] = true;
        if (d.id.indexOf("hyp-lattice") === 0) ctxL.hubs["hyp-lattice-ark"] = true;
        if (d.id.indexOf("kuiper-ixion") === 0) ctxL.hubs["kuiper-ixion"] = true;
        if (d.id.indexOf("mars-meridiani") === 0) ctxL.hubs["mars-meridiani"] = true;
        if (d.id === "moon-aristarchus") ctxL.hubs["moon-aristarchus"] = true;

        // These used to lie on every soft-land pad, so the Moon finished
        // an Oort or belt collect before you reached the buoy.
        const siteLoot = {
          "belt-airlock-school": "airlock-drill-tag",
          "belt-night-overflow": "night-overflow-token",
          "oort-longwatch": "longwatch-brick",
          "oort-dark-dock": "dark-dock-chip",
          "belt-c-type-yard": "c-type-carbon-tag",
        };
        if (siteLoot[d.id]) giveItem(siteLoot[d.id]);
      }
      advanceQuests(ctxL);
    });

    // E / click talk
    window.addEventListener("keydown", (e) => {
      const el = e.target;
      const tag = el && el.tagName ? el.tagName.toLowerCase() : "";
      if (tag === "input" || tag === "textarea" || tag === "select" || (el && el.isContentEditable)) return;
      if (window.VesperInput.triggered("talk", e)) {
        if (!tryMarketNearby()) tryTalkNearby();
      }
      if (window.VesperInput.triggered("rover", e)) toggleDrive();
    });
    // A look-drag is also a pointerdown. Opening talk on that press
    // stole the gesture whenever an NPC was within 3.2 m.
    let talkTap = null;
    const talkUi = (e) => e.target && e.target.closest && e.target.closest("#vesper-talk, #vesper-inv, #vesper-journal, #touch-flight, button, a, input");
    window.addEventListener("pointerdown", (e) => {
      if (talkUi(e)) return;
      const s = window.VesperSky;
      if (!(s && s.isWalking && s.isWalking())) return;
      // A build tap places a block. It must not also open whoever is standing there.
      if (s.getBuildMode && s.getBuildMode()) return;
      talkTap = { id: e.pointerId, x: e.clientX, y: e.clientY };
    });
    window.addEventListener("pointerup", (e) => {
      if (!talkTap || e.pointerId !== talkTap.id) return;
      const dx = e.clientX - talkTap.x;
      const dy = e.clientY - talkTap.y;
      talkTap = null;
      if (dx * dx + dy * dy > 64) return;
      tryTalkNearby();
    });
    window.addEventListener("pointercancel", () => { talkTap = null; });
  }

  function openMarket() {
    ensureUI();
    const stock = [
      { id: "suit-patch", label: "Suit Patch Pack" },
      { id: "hope-beacon-kit", label: "Hope Beacon Kit" },
      { id: "weapon-flare", label: "Distress Flare Gun" },
      { id: "weapon-scanner", label: "Hand Scanner" },
      { id: "med-foam", label: "Med Foam Canister" },
      { id: "sky-radio-crystal", label: "Sky Radio Crystal" },
      { id: "rover-key", label: "Rover Keyfob" },
      { id: "weapon-beacon-remote", label: "Beacon Remote" },
      { id: "spare-thruster-tip", label: "Spare Thruster Tip" },
      { id: "weapon-signal-lamp", label: "Signal Lamp" },
      { id: "amalthea-caution", label: "Amalthea Caution Tag" },
      { id: "tea-brick-belt", label: "Belt Tea Brick" },
      { id: "weapon-hail-beacon", label: "Hail Beacon Wand" },
      { id: "night-market-token", label: "Night Market Token" },
      { id: "weapon-patch-gun", label: "Seal Injector" },
      { id: "weapon-foam-sprayer", label: "Foam Sprayer" },
      { id: "guild-pin-guildhall", label: "Guild Hall Pin" },
    ];
    const mbtn =
      "margin:5px 0;display:block;width:100%;min-height:46px;padding:12px 14px;border-radius:10px;" +
      "border:1px solid rgba(120,180,255,0.35);background:rgba(30,50,80,0.9);color:#e8f4ff;" +
      "font:15px system-ui,sans-serif;text-align:left";
    ui.talk.innerHTML =
      "<b>Market Stall</b><p style='margin:8px 0;opacity:.85'>Trade care goods — no icon checklist.</p><div>" +
      stock
        .map(
          (s) =>
            '<button type="button" data-buy="' +
            s.id +
            '" style="' +
            mbtn +
            '">' +
            (hasItem(s.id) ? "✓ Owned · " : "Take · ") +
            s.label +
            "</button>"
        )
        .join("") +
      '<button type="button" data-a="close" style="' + mbtn + ';opacity:.75">Leave</button></div>';
    closeAllPanels("talk"); ui.talk.style.display = "block";
    ui.talk.onclick = (e) => {
      const buy = e.target && e.target.getAttribute && e.target.getAttribute("data-buy");
      const a = e.target && e.target.getAttribute && e.target.getAttribute("data-a");
      if (a === "close") {
        ui.talk.style.display = "none";
        return;
      }
      if (buy) {
        giveItem(buy);
        openMarket();
      }
    };
  }
  function tryMarketNearby() {
    const s = window.VesperSky;
    if (!s || !s.isWalking || !s.isWalking()) return false;
    const flight = s.getFlight && s.getFlight();
    if (!flight || !scene) return false;
    let near = false;
    const root = walkSurface || scene;
    root.traverse((ch) => {
      if (near) return;
      if (ch.name !== "marketStall" && ch.name !== "dockMarketPlaza" && ch.name !== "dockMarketOpenSign" && ch.name !== "dockMarketKiosk") return;
      const wp = new THREE.Vector3();
      ch.getWorldPosition(wp);
      if (wp.distanceTo(flight.pos) < 3.5) near = true;
    });
    if (near) {
      openMarket();
      return true;
    }
    return false;
  }
  function tryTalkNearby() {
    const s = window.VesperSky;
    if (!s || !s.isWalking || !s.isWalking()) return;
    const flight = s.getFlight && s.getFlight();
    if (!flight || !scene) return;
    // Pickups first
    let pick = null;
    let pickD = 2.2;
    let pickNode = null;
    const pickRoot = walkSurface;
    if (pickRoot) pickRoot.traverse((ch) => {
      if (!ch.name || ch.name.indexOf("lifePickup:") !== 0) return;
      const wp = new THREE.Vector3();
      ch.getWorldPosition(wp);
      const d = wp.distanceTo(flight.pos);
      if (d < pickD) {
        pickD = d;
        pick = ch.userData.itemId;
        pickNode = ch;
      }
    });
    if (pick) {
      if (giveItem(pick)) {
        if (pickNode && pickNode.parent) pickNode.parent.remove(pickNode);
      }
      return;
    }
    let best = null;
    let bestD = 3.2;
    if (walkSurface) walkSurface.traverse((ch) => {
      if (!ch.name || ch.name.indexOf("lifeNpc:") !== 0) return;
      const wp = new THREE.Vector3();
      ch.getWorldPosition(wp);
      const d = wp.distanceTo(flight.pos);
      if (d < bestD) {
        bestD = d;
        best = ch.userData.npc;
      }
    });
    if (best) talkTo(best);
  }

  function toggleDrive() {
    const s = window.VesperSky;
    if (!s || !s.isWalking || !s.isWalking()) {
      toast("Rover · soft-land first");
      return;
    }
    if (!hasItem("rover-key")) {
      toast("Rover · need Keyfob (city market / Earth / Mars)");
      return;
    }
    driving = !driving;
    document.body.dataset.drive = driving ? "1" : "0";
    toast(driving ? "Rover · driving (stick to roll)" : "Rover · parked");
    if (driving) {
      const ctxL = window.__vesperLifeCtx || (window.__vesperLifeCtx = {});
      ctxL.drove = true;
      advanceQuests(ctxL);
    }
  }

  let _conflictAcc = 0;
  let _hostilePrompt = 0;
  function tick(dt, flight) {
    if (ui.lifeBar) {
      const productLearn = document.body.dataset.product === "learn";
      const hide =
        document.body.classList.contains("hide-controls") ||
        document.body.classList.contains("cinema-mode") ||
        !(flight && flight.walking) ||
        productLearn;
      // Life slim bar: LIVE + EVA only (LEARN = planetarium — no inv/quest chrome)
      ui.lifeBar.style.display = hide ? "none" : "flex";
      if (hide && ui.lifeMore) ui.lifeMore.style.display = "none";
      if (hide && !(flight && flight.walking)) {
        // close life panels that clutter fly
        try {
          if (ui.inv) ui.inv.style.display = "none";
          if (ui.journal) ui.journal.style.display = "none";
          if (ui.guild) ui.guild.style.display = "none";
          if (ui.codex) ui.codex.style.display = "none";
        } catch (_) {}
      }
      // Pulse E when NPC/pickup in range
      const talkBtn = document.getElementById("vl-talk");
      if (talkBtn && flight && flight.walking && scene) {
        let near = false;
        const nearRoot = walkSurface;
        if (nearRoot) nearRoot.traverse((ch) => {
          if (near) return;
          if (!ch.name) return;
          if (ch.name.indexOf("lifeNpc:") !== 0 && ch.name.indexOf("lifePickup:") !== 0 && ch.name !== "marketStall" && ch.name !== "dockMarketPlaza" && ch.name !== "dockMarketOpenSign") return;
          const wp = new THREE.Vector3();
          ch.getWorldPosition(wp);
          if (wp.distanceTo(flight.pos) < 3.2) near = true;
        });
        talkBtn.style.boxShadow = near ? "0 0 12px rgba(120,220,255,0.85)" : "0 2px 8px rgba(0,0,0,0.35)";
        talkBtn.style.borderColor = near ? "rgba(160,230,255,0.8)" : "rgba(120,180,255,0.25)";
      }
      const flareBtn = document.getElementById("vl-flare");
      if (flareBtn) {
        const owned = hasItem("weapon-flare") || hasItem("weapon-signal-lamp") || hasItem("weapon-hail-beacon");
        flareBtn.style.opacity = owned ? "1" : "0.45";
        flareBtn.style.borderColor = owned ? "rgba(255,160,100,0.7)" : "rgba(120,180,255,0.25)";
      }
    }
    if (!flight) return;
    const aboardNow = window.__vesperAboard || "";
    if (aboardNow === "hangar" && tick._aboard !== "hangar") {
      tick._aboard = "hangar";
      advanceQuests(window.__vesperLifeCtx || (window.__vesperLifeCtx = {}));
    } else if (aboardNow !== "hangar") {
      tick._aboard = aboardNow;
    }
    // Damascus step 2 used walk:Enceladus, which was already true at the desk,
    // so the quiet beat paid out on arrival. Count still time only after the hub.
    {
      const ctxQ = window.__vesperLifeCtx;
      const onSulcus = ctxQ && ctxQ.hubs && ctxQ.hubs["enceladus-damascus"];
      const here = flight.walking && (flight.surfaceBody === "Enceladus" || (ctxQ && ctxQ.walkBody === "Enceladus"));
      if (onSulcus && here && !ctxQ.quietEnceladus) {
        if (!tick._quietArmed) {
          tick._quietArmed = true;
          tick._quietEnc = 0;
        }
        const sp = flight.vel ? flight.vel.length() : 0;
        if (sp < 0.45) tick._quietEnc = (tick._quietEnc || 0) + (dt || 0);
        else tick._quietEnc = 0;
        if (tick._quietEnc >= 4) {
          ctxQ.quietEnceladus = true;
          advanceQuests(ctxQ);
        }
      } else if (!onSulcus) {
        tick._quietArmed = false;
        tick._quietEnc = 0;
      }
    }
    {
      const ctxS = window.__vesperLifeCtx || (window.__vesperLifeCtx = {});
      const shoreName = (flight.surfaceBody || ctxS.walkBody || "");
      const onShore = !!(flight.walking && (shoreName === "Titan" || shoreName === "Deimos" || shoreName === "Moon"));
      const indoors = !!(window.__vesperAboard);
      const spS = flight.vel ? flight.vel.length() : 0;
      if (onShore && !indoors && spS < 0.45) tick._shoreStill = (tick._shoreStill || 0) + (dt || 0);
      else tick._shoreStill = 0;
      const quiet = onShore && !indoors && tick._shoreStill >= 4;
      if (quiet && !ctxS.quietShore) {
        ctxS.quietShore = true;
        advanceQuests(ctxS);
      } else ctxS.quietShore = quiet;
    }
    if (!flight.walking) {
      // Last landing stayed on the quest context after takeoff, so "stand
      // on the Moon" and "land Ceres" were still true in cruise.
      const ctxFly = window.__vesperLifeCtx;
      if (ctxFly && ctxFly.walkBody) ctxFly.walkBody = null;
      driving = false;
      // Soft conflict: outer dark contacts — prompt flare/evade (not FPS)
      _conflictAcc += dt || 0;
      if (_conflictAcc > 5) {
        _conflictAcc = 0;
        let nearHostile = false;
        if (window.VesperPlaces && window.VesperPlaces.hubs) {
          try {
            window.VesperPlaces.hubs().forEach((h) => {
              if (!h.hostile || !h.wrap || h._scared) return;
              const dx = flight.pos.x - h.wrap.position.x;
              const dy = flight.pos.y - h.wrap.position.y;
              const dz = flight.pos.z - h.wrap.position.z;
              if (Math.sqrt(dx * dx + dy * dy + dz * dz) < 40) nearHostile = true;
            });
          } catch (_) {}
        }
        if (nearHostile && performance.now() > _hostilePrompt) {
          _hostilePrompt = performance.now() + 12000;
          ensureUI();
          ui.talk.innerHTML =
            "<b>⚠ Dark contact</b><p>Unregistered dock on sensors. Nonlethal options only.</p>" +
            "<button type='button' data-a='flare' style='margin:5px 0;display:block;width:100%;min-height:46px;padding:12px 14px;border-radius:10px;border:1px solid rgba(255,160,120,0.4);background:rgba(60,30,30,0.9);color:#ffe8e0;font:15px system-ui,sans-serif'>Fire distress flare</button>" +
            "<button type='button' data-a='evade' style='margin:5px 0;display:block;width:100%;min-height:46px;padding:12px 14px;border-radius:10px;border:1px solid rgba(120,180,255,0.4);background:rgba(30,40,60,0.9);color:#ffe8e0;font:15px system-ui,sans-serif'>Burn away / evade</button>" +
            "<button type='button' data-a='close' style='margin:4px'>Ignore</button>";
          closeAllPanels("talk"); ui.talk.style.display = "block";
          ui.talk.onclick = (e) => {
            const a = e.target && e.target.getAttribute && e.target.getAttribute("data-a");
            if (!a) return;
            if (a === "flare") fireFlare();
            if (a === "evade") {
              toast("Evade · thrust out — Listen Society nods");
              const ctx = window.__vesperLifeCtx || (window.__vesperLifeCtx = {});
              ctx.evaded = true;
              if (window.VesperSky && window.VesperSky.getFlight) {
                const f = window.VesperSky.getFlight();
                if (f && f.vel) f.vel.multiplyScalar(1.8);
              }
            }
            ui.talk.style.display = "none";
          };
        } else if (!hasItem("weapon-flare")) {
          const r = Math.sqrt(flight.pos.x * flight.pos.x + flight.pos.z * flight.pos.z);
          const au = (window.VesperSky && window.VesperSky.getScale && window.VesperSky.getScale().auUnit) || 16000;
          if (r > au * 30) toast("Dark dock whisper · Kael would want you carrying a flare");
        }
      }
      return;
    }
    // Auto-pickup crumbs very near feet
    if (walkSurface && Math.random() < (dt || 0.016) * 2) {
      walkSurface.traverse((ch) => {
        if (!ch.name || ch.name.indexOf("lifePickup:") !== 0) return;
        const wp = new THREE.Vector3();
        ch.getWorldPosition(wp);
        if (wp.distanceTo(flight.pos) < 1.4) {
          const id = ch.userData.itemId;
          if (giveItem(id) && ch.parent) ch.parent.remove(ch);
        }
      });
    }
    if (rover) {
      rover.visible = true;
      // It used to snap to the pad center and stay there while you walked.
      if (driving && rover.parent && flight && flight.pos) {
        if (!tick._rv) tick._rv = new THREE.Vector3();
        tick._rv.copy(flight.pos);
        rover.parent.worldToLocal(tick._rv);
        rover.position.set(tick._rv.x + 1.1, 0, tick._rv.z + 0.4);
      }
    }
    // Subtle NPC idle — full on desktop; rotation-only on coarse (phone thermal)
    const lowAnim = !!(window.matchMedia && matchMedia("(pointer: coarse)").matches);
    if (walkSurface && flight.walking) {
      const tnow = performance.now() * 0.001;
      walkSurface.traverse((ch) => {
        if (!ch.name || ch.name.indexOf("lifeNpc:") !== 0) return;
        ch.rotation.y = Math.sin(tnow * 0.35 + ch.id) * (lowAnim ? 0.03 : 0.04);
        if (!lowAnim) {
          if (!ch.userData._baseY) ch.userData._baseY = ch.position.y;
          ch.position.y = ch.userData._baseY + Math.sin(tnow * 1.6 + ch.id) * 0.012;
        }
      });
    }
    // Market OPEN sign. This used to sit outside tick(), so it ran once at
    // parse (scene was still null) and never pulsed. No scene walk.
    if (marketSign && marketSign.material && flight.walking) {
      const t = performance.now() * 0.003;
      marketSign.material.emissiveIntensity = 0.4 + 0.4 * (0.5 + 0.5 * Math.sin(t));
    }
  }
  window.VesperLife = {
    boot,
    tick,
    closeAllPanels,
    interactNearby: () => { if (!tryMarketNearby()) tryTalkNearby(); },
    toggleInventory,
    toggleJournal,
    toggleGuilds,
    toggleCodex,
    giveItem,
    hasItem,
    talkTo,
    getInventory: () => inv.slice(),
    getGuilds: () => Object.assign({}, guilds),
    getQuests: () => QUEST_DEFS.slice(),
  };
})();
