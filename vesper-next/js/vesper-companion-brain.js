/**
 * Vesper offline companion brain — rich local knowledge, multi-sentence,
 * calm witty wind-down tone. No network. Used by agent-overlay.
 */
(function () {
  "use strict";

  const FACTS = {
    Sun: [
      "Core fusion runs at about 15 million °C; the photosphere you skim is ~5500 °C — still a soft no-go for walks.",
      "Light takes ~8 minutes to reach Earth; neutrinos leave the core in seconds.",
      "The corona is millions of degrees hotter than the surface — a long-standing puzzle of solar physics.",
    ],
    Mercury: [
      "Mercury's day lasts 176 Earth days; a year is only 88. Extreme thermal swing.",
      "No real atmosphere — just a tenuous exosphere of atoms kicked off the surface.",
      "Caloris Basin is one of the largest impact structures in the system.",
    ],
    Venus: [
      "Surface pressure ~92 bar; runaway greenhouse keeps it oven-hot under the clouds.",
      "It rotates retrograde — sunrise in the west, if you could see through the haze.",
      "The upper clouds race the planet in about four Earth days (super-rotation).",
    ],
    Earth: [
      "1 AU by definition — the yardstick for the whole model.",
      "Only world here with liquid-water oceans under a nitrogen-oxygen sky.",
      "Axial tilt ~23.4° drives the seasons you know by heart.",
      "GEO Relay Rest watches nightsides breathe — Jax keeps chips for careful letters.",
      "LEO Refuge Circle is mutual aid, not tourism; Mira keeps the kettle on.",
    ],
    Moon: [
      "Locked in sync: the same face watches Earth. Far side stays hidden from home.",
      "Maria are ancient basalt floods; highlands are older anorthosite crust.",
      "Soft-land and the dust sticks — regolith with no weather to tidy it.",
      "Tranquility Walk (Selene) is memorial path — photo quiet, not a checklist clear.",
    ],
    Mars: [
      "About half Earth's diameter; thin CO₂ air and global dust storms.",
      "Olympus Mons and Valles Marineris still read as scars of a hotter youth.",
      "Polar caps mix water ice and dry ice; seasons move the frost line.",
      "Olympus Overlook Bench is for sitting honestly — Brick keeps dust tags, not flags.",
    ],
    Jupiter: [
      "More mass than all other planets combined. A failed star's cousin.",
      "Great Red Spot: a centuries-old anticyclone larger than Earth.",
      "The magnetosphere would engulf Saturn's orbit if drawn to scale here.",
    ],
    Io: [
      "Most volcanic body we know — tidal flex from Jupiter keeps the interior molten.",
      "Sulfur paints the surface in yellows and reds that shift after eruptions.",
      "Prometheus Plume Watch — Pike files heat honesty; foam before bravado.",
    ],
    Europa: [
      "Icy shell over a global saltwater ocean — a prime habitability target.",
      "Lineae and chaos terrain hint at ice that flexes and refreezes.",
    ],
    Ganymede: [
      "Largest moon — bigger than Mercury — with its own magnetic field.",
      "Grooved terrain suggests past tectonic stretching of the ice.",
    ],
    Callisto: [
      "Most cratered Galilean; little resurfacing. An ancient archive.",
      "Likely a salty ocean deep under ice, quieter than Europa's.",
    ],
    Saturn: [
      "Density less than water — it would float in a cosmic bathtub, if one existed.",
      "Rings are ice and dust in razor-thin orbital sheets; soft plane drag here mimics skim.",
      "Hexagon at the north pole is a standing jet-stream wave.",
    ],
    Titan: [
      "Thick N₂ atmosphere; lakes and rivers of methane/ethane.",
      "Only moon with a substantial atmosphere — weather like a cold Earth.",
      "Ontario Lacus lamp is Quill's annex — romance by radio across AU.",
    ],
    Enceladus: [
      "Tiger-stripe fractures vent water vapor into Saturn's E ring.",
      "Subsurface ocean confirmed by plume chemistry and gravity.",
    ],
    Uranus: [
      "Axial tilt ~98° — it rolls around the Sun on its side.",
      "Methane in the haze drinks red light, leaving the cool cyan.",
    ],
    Neptune: [
      "Windiest measured planet; dark storms come and go over years.",
      "Triton orbits backward — likely a captured Kuiper object.",
    ],
    Pluto: [
      "Heart-shaped Tombaugh Regio: nitrogen ice plains, young and bright.",
      "Binary with Charon around a shared barycenter above Pluto's surface.",
    ],
    Ceres: [
      "Round dwarf of the main belt; bright salt deposits in Occator.",
      "Possibly a relict ocean world under an ice-rock crust.",
      "Belt Drift Library and Assay desks keep the belt from feeling empty — ask Oriole for a card.",
      "Tea House Drift pours recycled leaf — Haven stamps cups, not conquest.",
      "Night Market (Kira) trades after Assay closes — tokens for tea money.",
      "Hope Desk (Wren) stamps care beacons — empty Sol is a posture problem.",
      "Guild Hall Drift (Dante) pins work done — Assay, Refuge, Yard, Listen desks.",
    ],
    Vesta: [
      "Differentiated protoplanet; Rheasilvia basin nearly spanned the south.",
      "Source of many HED meteorites that reach Earth.",
    ],
    "Counter-Earth": [
      "Classical Antichthon — a mirror world opposite Earth (fiction). Hyp layer only.",
    ],
    Vulcan: [
      "Intra-Mercurial Vulcan was proposed before general relativity explained Mercury's orbit.",
    ],
    Nemesis: [
      "Nemesis was a hypothesized distant dwarf-star companion; surveys have not found it.",
    ],
    "Planet Nine": [
      "Planet Nine is an unconfirmed distant giant hypothesized from TNO clustering — not Nibiru.",
    ],
    Nibiru: [
      "Nibiru is fringe doomsday lore, separate from Planet Nine science hypotheses.",
    ],
    Hyperion: [
      "Hyperion tumbles chaotically — no tidy tidally locked face.",
      "Its sponge-like ice density is among the lowest of Saturn's moons.",
    ],
    Proteus: [
      "Proteus is irregular and dark; second only to Triton among Neptune's moons.",
    ],
    Nereid: [
      "Nereid's eccentric orbit may be a leftover of Triton's capture drama.",
    ],
    Pallas: [
      "Pallas is a high-inclination B-type — its orbit tilts ~35° to the ecliptic.",
    ],
    Eros: [
      "NEAR Shoemaker soft-landed on Eros in 2001 — first controlled asteroid landing.",
      "Eros is elongated; walking the long axis feels like a potato ridge.",
    ],
    Ida: [
      "Ida hosts Dactyl — the first moon discovered around an asteroid.",
    ],
    Dactyl: [
      "Dactyl is tiny (~1.4 km); a pebble companion to Ida.",
    ],
    Amalthea: [
      "Amalthea is a red potato deep in Jupiter's radiation belts.",
    ],
    Himalia: [
      "Himalia leads the largest irregular prograde group at Jupiter.",
    ],
    Janus: [
      "Janus and Epimetheus are co-orbital. In this sky each has its own circle, outside the rings.",
    ],
    Epimetheus: [
      "Epimetheus sits just outside Janus. The two disks do not pass through each other.",
    ],
    Larissa: [
      "Larissa is an inner regular moon of Neptune, not a captured irregular; Voyager 2 glimpsed it in 1989.",
    ],
    Weywot: [
      "Weywot is Quaoar's moon — named for a Tongva sky god.",
    ],
    "Hiʻiaka": [
      "Hiʻiaka is Haumea's bright crystalline moon — water ice that still gleams in the dark.",
      "Soft-land here and the pad reads cold light, not grey rock. Haumea spins just beyond.",
    ],
    Namaka: [
      "Namaka is the quieter sibling — smaller, cooler ice on an inclined dance around Haumea.",
    ],
    Dysnomia: [
      "Dysnomia keeps Eris company at the edge of the map — darker ice, honest mass from mutual orbit.",
      "Walk the frost. The Expanse never felt emptier — or more worth the trip.",
    ],
    "New Horizons": [
      "New Horizons — piano bus and RTG that opened Pluto's heart. Soft-land the probe deck if you like.",
    ],
    Orcus: [
      "Orcus is a bright-ice plutino — sometimes called Pluto's anti-twin.",
    ],
    Varuna: [
      "Varuna is elongated and spins fast — a classical Kuiper belt classic.",
    ],
    Ixion: [
      "Ixion is a dark red plutino stained with tholins.",
    ],
    Salacia: [
      "Salacia is a large blue-grey classical KBO. Actaea is not in this sky.",
    ],
    Halley: [
      "1P/Halley is a dirty-snow nucleus on a ~75-year display orbit here.",
    ],
    Encke: [
      "2P/Encke has the shortest period of any numbered comet (~3.3 years).",
    ],
    Makemake: [
      "Makemake is a bright classical Kuiper dwarf with methane ice signatures.",
    ],
    Quaoar: [
      "Quaoar has a thin ring. In this sky the ring sits close to the dwarf so it stays clear of Weywot.",
    ],
    "Observation Station": [
      "A scavenged belt habitat — soft-land, walk the bay, equip the Skytape.",
      "Instrumental sky radio stays on-device; Sol mode hides the fantasy layer.",
    ],
  };

  const SECTION_MOOD = {
    inner: "Inner system light is hard and close — short shadows, bright coronas.",
    belt: "Belt rocks tumble slow; good for soft-land walks and quiet builds.",
    giants: "Gas giants reward patience — bands, rings, and moon choreography.",
    ice: "Ice giants keep their distance; cyan hush and long night.",
    dwarfs: "Far out, dwarfs keep their own time — dim Sun, sharp stars.",
    deep: "Deep space between the named worlds — your river, your gears.",
    oort: "Oort dark — this buoy is the named place. The Sun is a star from here.",
    hypothetics: "Hyp layer — labeled fiction. Not a Sol tour and not that real body's sky.",
  };

  function pick(arr) {
    if (!arr || !arr.length) return "";
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function factFor(name) {
    if (!name) return "";
    const list = FACTS[name];
    if (list) return pick(list);
    // Prefix match for Rock-N style
    if (/^Rock/i.test(name)) return "Main-belt rubble — irregular, airless, soft-landable. Good place to breathe and look sunward.";
    if (/^Kuiper/i.test(name)) return "Kuiper-ish ice rock — cold, distant, patient. Soft-land if you like the hush.";
    return "";
  }

  function sectionOf(c) {
    const raw = String(c.looking || c.walkBody || c.near || "");
    const n = raw.toLowerCase();
    // "earth" is inside Counter-Earth, so the old inner test started a Sol
    // tour and spoke the inner-system line. Fiction stays on the Hyp routes.
    let hyp = false;
    try {
      const names = window.VesperHypothetics && window.VesperHypothetics.names && window.VesperHypothetics.names();
      if (names && names.indexOf(raw) >= 0) hyp = true;
    } catch (_) {}
    if (!hyp && /counter-earth|counter-luna|\bvulcan\b|\bnemesis\b|\btyche\b|\bnibiru\b|\bphaeton\b|\btheia\b|planet nine|planet x|\bpbh\b/.test(n)) hyp = true;
    // Catalog habitats are "(Hyp)" and hypothetic, but they are not in
    // the short name list. They were falling through to the belt or to
    // "deep space between the named worlds."
    if (!hyp && /\(hyp\)/.test(n)) hyp = true;
    if (!hyp) {
      try {
        const list = window.VesperSky && window.VesperSky._bodiesRef && window.VesperSky._bodiesRef();
        const hit = list && list.find((b) => b && b.name === raw);
        if (hit && hit.hypothetic) hyp = true;
      } catch (_) {}
    }
    if (hyp) return "hypothetics";
    const tok = (alts) => new RegExp("(?:^|[^a-z])(" + alts + ")(?:[^a-z]|$)", "i").test(n);
    // ISS sits in Earth orbit. Starman is an eccentric inner path.
    // Neither is the empty gap between named worlds.
    if (tok("iss|tiangong|hubble|jwst") || n === "luna gateway" || n === "starman roadster") return "inner";
    if (n === "new horizons") return "dwarfs";
    // These craft sit on a named world. The deep fallback is the empty
    // gap, and a bare "tour" then starts the belt route.
    if (n === "parker solar probe" || n === "apollo 11 site" || n === "osiris-rex" || n === "curiosity" || n === "perseverance" || n === "ingenuity") return "inner";
    if (n === "juno" || n === "cassini") return "giants";
    if (n === "rosetta" || n === "dawn" || n === "lucy" || /^trojansl[45]-\d+$/.test(n)) return "belt";
    if (tok("mercury|venus|earth|moon|mars|phobos|deimos|sun")) return "inner";
    if (tok("ceres|vesta|pallas|eros|ida|dactyl|psyche|encke|davida") || /rock-|observation|\bbelt\b/.test(n)) return "belt";
    if (tok("jupiter|saturn|io|europa|ganymede|callisto|titan|enceladus|mimas|rhea|dione|tethys|iapetus|amalthea|himalia|hyperion|janus|epimetheus|phoebe")) return "giants";
    if (tok("uranus|neptune|triton|miranda|titania|oberon|ariel|umbriel|proteus|nereid|larissa|halley")) return "ice";
    if (tok("pluto|charon|nix|haumea|eris|quaoar|gonggong|orcus|varuna|ixion|salacia|weywot|makemake|sedna|namaka|dysnomia|hiiaka") || /kuiper|hi[ʻ']iaka/.test(n)) return "dwarfs";
    // A pad riding a named world is that neighborhood.
    // LEO Refuge Ring follows Earth and was "the gap between named worlds."
    try {
      const list = window.VesperSky && window.VesperSky._bodiesRef && window.VesperSky._bodiesRef();
      const hit = list && list.find((b) => b && b.name === raw);
      const follow = hit && hit.group && hit.group.userData && hit.group.userData.followBody;
      if (follow && follow !== raw) {
        const parentSec = sectionOf({ looking: follow });
        if (parentSec && parentSec !== "deep") return parentSec;
      }
    } catch (_) {}
    // A named desk with no parent was still "the gap".
    // LEO sits at 1 AU, Hygiea in the belt, the cold classical out past Neptune.
    // Voyager stays the gap on purpose.
    if (n !== "voyager 1" && n !== "voyager 2") {
      try {
        const sky = window.VesperSky;
        const list = sky && sky._bodiesRef && sky._bodiesRef();
        const hit = list && list.find((b) => b && b.name === raw);
        const sun = list && list.find((b) => b && b.name === "Sun");
        const au = (sky.getScale && sky.getScale().auUnit) || 16000;
        if (hit && hit.mesh && sun && sun.mesh && window.THREE) {
          const a = new window.THREE.Vector3();
          const bpos = new window.THREE.Vector3();
          hit.mesh.getWorldPosition(a);
          sun.mesh.getWorldPosition(bpos);
          const r = a.distanceTo(bpos) / au;
          if (r > 0 && r < 2) return "inner";
          if (r < 6) return "belt";
          if (r >= 30 && r < 100) return "dwarfs";
          if (r >= 100) return "oort";
        }
      } catch (_) {}
    }
    return "deep";
  }

  function postureLine(c) {
    if (c.walking && c.walkBody) {
      return (
        "You're soft-landed on " +
        c.walkBody +
        ". Boots locked to the rock; thrust up or ⚡ when you're ready to leave. Gear " +
        c.gear +
        ", mode " +
        String(c.mode || "").toUpperCase() +
        "."
      );
    }
    if (c.near && c.looking) {
      return (
        "Skimming near " +
        c.looking +
        " — soft hover is live. Ease the stick; boost clears the pad without drama."
      );
    }
    if (c.looking) {
      return (
        "Centered on " +
        c.looking +
        ". " +
        String(c.mode || "").toUpperCase() +
        " · " +
        c.gear +
        (c.speed > 40 ? " · you're still carrying speed." : " · nearly still.")
      );
    }
    return (
      "Deep space · " +
      String(c.mode || "").toUpperCase() +
      " · " +
      c.gear +
      ". Pan until a world sits center, Travel to jump, or let FLOAT river idle."
    );
  }

  function scienceBlock(c) {
    const name = c.looking || c.walkBody || c.near;
    const fact = factFor(name);
    const blurb = (c.blurb || "").trim();
    const parts = [];
    if (blurb) parts.push(blurb);
    if (fact && (!blurb || blurb.indexOf(fact.slice(0, 18)) < 0)) parts.push(fact);
    if (!parts.length) parts.push(SECTION_MOOD[sectionOf(c)]);
    return parts.join(" ");
  }

  function moodLine(c) {
    const wind = typeof c.wind === "number" ? c.wind : 0.45;
    if (wind > 0.72) {
      return "Wind-down is high — orbits crawl, light softens. Good evening hush; you still fly free.";
    }
    if (wind < 0.28) {
      return "Mood is bright and awake — clock and light push a little harder. Ease the wind slider if you want quieter sky.";
    }
    if (c.clock === "paused") {
      return "Celestial clock is paused (orbits frozen). Your ship still answers the stick — Pause button freezes both if you want full still.";
    }
    if (c.clock === "cinematic" || c.clock === "fast") {
      return "Clock is rushing the dance — pretty for a sweep, busy for soft-land. Drop to CRUISE clock when you want to park.";
    }
    return pick([
      "Take the long way. Nobody's grading your itinerary.",
      "Quiet is a feature here — not a bug.",
      "If the HUD feels loud, hide controls and keep the sky.",
    ]);
  }

  function tipBlock(c) {
    if (c.walking) {
      const wb = c.walkBody || "";
      if (/Starman|Roadster/i.test(wb))
        return "Starman tip: educational replica — tinted windshield, walk-readable HOPE plaque, suit visor gleam, wheel dust cue, dash Earth. Eccentric path; not a brand ad.";
      if (/Europa/i.test(wb))
        return "Europa tip: lineae underfoot evoke an ice shell over a dark ocean. Soft leave when ready.";
      if (/^Titan$/i.test(wb))
        return "Titan tip: orange haze and dark lake mirrors — thick N₂ mood. Sol (Y) for a clean science read.";
      if (/Enceladus/i.test(wb))
        return "Enceladus tip: frost streaks and a mist column nod to south-pole plumes.";
      if (/Venus/i.test(wb))
        return "Venus tip: hellish haze underfoot is display fiction for surface walk — real Venus would crush a suit.";
      if (/\bIo\b/i.test(wb))
        return "Io tip: sulfur yellows and lava vent glow — most volcanic moon. Almanac g≈1.8 m/s².";
      if (/Ganymede/i.test(wb))
        return "Ganymede tip: sulci grooves underfoot; largest moon, magnetic field. Soft leave when ready.";
      if (/Callisto/i.test(wb))
        return "Callisto tip: nested crater rims — ancient dark ice-rock. Quietest Galilean walk.";
      if (/^(Moon|Luna|Apollo 11 Site)$/i.test(wb))
        return "Moon tip: dark maria shelves and highland ray cues — low g≈1.62. Apollo plaque if you Travel the site.";
      if (/Mercury/i.test(wb))
        return "Mercury tip: bright ray stubs on hot grey — day longer than year. Extreme thermal story.";
      if (/Triton/i.test(wb))
        return "Triton tip: cantaloupe mounds + N₂ frost sheet. Retrograde capture — Neptune’s odd one.";
      if (/\bCharon\b/i.test(wb))
        return "Charon tip: Mordor Macula red pole underfoot — binary waltz with Pluto. Soft leave when ready.";
      if (/Pluto/i.test(wb))
        return "Pluto tip: Tombaugh heart bright disc and tholin ridges. Binary with Charon — walk the dream.";
      if (/Ceres/i.test(wb))
        return "Ceres tip: Occator bright salt spots — Dawn’s target. Largest belt rock underfoot.";
      if (/Phobos/i.test(wb))
        return "Phobos tip: Stickney rim almost swallows the rock — rubble walk, doomed spiral story.";
      if (/Deimos/i.test(wb))
        return "Deimos tip: quieter rubble sibling of Phobos — smoother regolith, gentler horizon.";
      if (/Mimas/i.test(wb))
        return "Mimas tip: Herschel crater rim dominates the walk — a moon nearly cracked by impact.";
      if (/Iapetus/i.test(wb))
        return "Iapetus tip: walk the yin-yang divide — dark Cassini Regio, bright ice, equatorial ridge spine.";
      if (/Miranda/i.test(wb))
        return "Miranda tip: corona rings and Verona-scale cliffs — extreme geology in a small package.";
      if (/Dione/i.test(wb))
        return "Dione tip: wispy bright fractures — tectonic ice cliffs catching Saturn-shine.";
      if (/Rhea|Tethys/i.test(wb))
        return "Saturn ice tip: bright cratered shelves — soft land, look up for the rings.";
      if (/Vesta/i.test(wb))
        return "Vesta tip: Rheasilvia basin rim — differentiated protoplanet Dawn mapped in detail.";
      if (/Sedna/i.test(wb))
        return "Sedna tip: deep red tholins at the edge of the map — perihelion still farther than Neptune.";
      if (/Eris|Haumea|Makemake/i.test(wb))
        return "Dwarf tip: cold Kuiper company beyond Pluto — labeled, honest, worth the Travel.";
      if (/Psyche/i.test(wb))
        return "Psyche tip: metallic flecks underfoot — M-type dream. NASA Psyche mission target.";
      if (/Phoebe/i.test(wb))
        return "Phoebe tip: dark captured irregular — retrograde Saturn cousin, rubble honesty.";
      if (/Vulcan/i.test(wb))
        return "Vulcan tip: Hyp scorched rock inside Mercury’s orbit — 19th-c. fiction; GR explained the perihelion. Sol off / Hyp on.";
      if (/Nemesis/i.test(wb))
        return "Nemesis tip: Hyp dim red companion once blamed for extinctions — surveys found nothing. Ember mood, labeled fiction.";
      if (/Tyche/i.test(wb))
        return "Tyche tip: Hyp Oort gas giant from IRAS-era speculation — cold bands, not found. Travel ◈ when Hyp is on.";
      if (/Planet\s*Nine/i.test(wb))
        return "Planet Nine tip: Batygin–Brown hyp distant giant — unconfirmed science, distinct from Nibiru lore. Soft-land the teal deck.";
      if (/Planet\s*X/i.test(wb))
        return "Planet X tip: historical perturber label (pre-Pluto demotion era) — speculative rail, labeled honestly.";
      if (/Nibiru/i.test(wb))
        return "Nibiru tip: fringe/Sitchin doomsday lore — fiction only. Separate from Planet Nine. Soft leave when the red feels heavy.";
      if (/PBH|pbh/i.test(wb))
        return "PBH-Halo tip: primordial black-hole gravity-well viz — purple rim, void center. Fiction educational, not a real body.";
      if (/Theia/i.test(wb))
        return "Theia tip: Mars-sized Moon-forming impactor — deep-time reconstruction on a Hyp rail. Not present today.";
      if (/Phaeton/i.test(wb))
        return "Phaeton tip: shattered ‘fifth planet’ myth between Mars and Jupiter — rubble underfoot; belt is primordial, not a corpse.";
      if (/\b(Station|ISS|Gateway)\b/i.test(wb))
        return "Station tip: walk the bay, E/tap the Skytape for Sky Radio. Build Solar + Beacon if you want a care trace.";
      return "Surface tip: look around first. Sol (Y) clears fantasy layers. Almanac g / v_esc ride the physics chip.";
    }
    if (c.looking === "Starman Roadster" || /Starman/i.test(c.looking || "")) {
      return "Starman tip: Travel · Craft or look-chip — cherry open-top replica, elliptical rail, labeled educational.";
    }
    if (c.looking === "Saturn") {
      return "Saturn tip: skim the ring plane gently — soft drag, no hard wall. Titan waits outward.";
    }
    if (c.looking === "Europa" || c.looking === "Enceladus") {
      return c.looking + " tip: soft-land, walk a quiet beat, then boost off. Ice oceans reward closeness.";
    }
    if (c.gearId === "dock") {
      return "DOCK is inspection pace — fine thrust for skims and walk approach. Step up to CRUISE when the gap grows.";
    }
    if (c.gearId === "transit") {
      return "TRANSIT covers AU fast. Drop to CRUISE or DOCK before a moon so you don't overshoot the soft pad.";
    }
    if (c.mode === "float") {
      return "FLOAT: after a few quiet seconds the lazy-river drifts you. Touch stick/WASD to take over; 2 for PILOT.";
    }
    return pick([
      "Hold ⚡/Shift — boost ramps; it isn't binary. Gears set the band DOCK → TRANSIT.",
      "Default pace is calm — CRUISE is leisurely; use BURN/TRANSIT + hold-boost for AU hops.",
      "Travel menu lists Sun, planets, moons, dwarfs, and Observation Station. Same dest again: re-open Travel…",
      "Tour (FLOAT section routes) picks a curated path through belt, giants, ice, or inner system.",
      "Build uses muted craft materials — metal, ice, rock, glass, antenna, habitat — not candy blocks.",
      "Hide controls clears menus; the stick stays. Cinema hides movement too.",
      "Ask about the deep sky — beauty-mode nebulae and MW are intentional, not a filter bug.",
      "Radio is soft procedural — equip Skytape at Observation Station; Level slider tames hiss.",
    ]);
  }

  function composeStatus(c) {
    const parts = [postureLine(c), scienceBlock(c), moodLine(c)];
    const tour = window.VesperTours && window.VesperTours.active && window.VesperTours.active();
    if (tour) parts.push(composeTourNarration(c, tour));
    else parts.push(tipBlock(c));
    return parts.filter(Boolean).join(" ");
  }

  function composeAbout(c) {
    const name = c.looking || c.walkBody;
    if (!name) {
      return (
        "Nothing locked in the crosshair yet. Drag the sky until a body labels the look chip, then ask again — I'll pull lore and a fact from the local almanac. " +
        moodLine(c) +
        " Or say travel Europa / start a belt tour."
      );
    }
    // Hubs without almanac blurbs used to answer with only section mood.
    const blurb = (c.blurb || "").trim();
    const f0 = factFor(name);
    const lines = [];
    if (blurb || f0) lines.push(scienceBlock(c));
    else lines.push(name + " — named place in this sky. Soft-land when you're close.");
    const f2 = factFor(name);
    if (f2 && lines.join(" ").indexOf(f2.slice(0, 12)) < 0) lines.push(f2);
    // Second fact if available
    const list = FACTS[name];
    if (list && list.length > 1) {
      const other = list.find((x) => lines.join(" ").indexOf(x.slice(0, 16)) < 0);
      if (other) lines.push(other);
    }
    lines.push(tipBlock(c));
    lines.push(moodLine(c));
    return lines.join(" ");
  }

  function composeHelp(c) {
    return (
      "Fly: WASD/stick translate · drag sky to look · in flight E/Space up and Q/Ctrl down (pads on a phone) · on the ground E is talk, not up · Shift/⚡ boost (ramps). " +
      "Modes: 1 FLOAT (lazy-river idle) · 2 PILOT. Gears: DOCK / CRUISE / BURN / TRANSIT. " +
      "Clock 0/3/4/5/6 moves orbits only; Pause freezes ship + orbits. " +
      "Travel jumps; Tour starts a section route; soft-land to walk rocks. " +
      "Sol hides fantasy; Build places craft props; Companion stays offline-first. " +
      "Right now: " +
      postureLine(c)
    );
  }

  function composeGreeting(c) {
    const face = c.looking ? " Facing " + c.looking + "." : "";
    return (
      "Evening. Sky's lit — you're in " +
      String(c.mode || "float").toUpperCase() +
      " · " +
      (c.gear || "CRUISE") +
      "." +
      face +
      " Ask where am I, tell me about this world, travel Europa, start a belt tour, or just fly. I keep a local almanac; Live AI is optional under Advanced."
    );
  }

  function composeStation(c, radio) {
    const hint =
      (radio && radio.hint) ||
      "Observation Station rides a lit belt rock — Travel → Observation Station, or start a Belt tour.";
    if (c.looking === "Observation Station" || c.walkBody === "Observation Station") {
      return (
        "You're at Observation Station — AAA bay: textured hull/rock, airlock porch, conduits, crates, grate, light strips, Skytape bench. Soft-land if you haven't, walk in, E/tap the Skytape. " +
        "Radio HUD unlocks after equip. Sol hides the habitat. " +
        tipBlock(c)
      );
    }
    return (
      hint +
      " Soft-land, walk in, equip the Skytape. Starman Roadster replica is on a heliocentric display rail — Travel to visit; educational, not a brand ad. Walkable worlds grow terrain underfoot. From Travel pick Observation Station anytime; FLOAT Belt tours pass the beacon. " +
      moodLine(c)
    );
  }

  function composeTourHint(c) {
    return (
      "FLOAT tours: open Tour, pick a section (Inner · Belt · Giants · Ice · Dwarfs · Hypothetics), and a randomized curated route starts — hundreds of named seeds. " +
      "Interrupt anytime with stick or PILOT. Section mood: " +
      SECTION_MOOD[sectionOf(c)]
    );
  }

  function composeTourNarration(c, tour) {
    if (!tour) return "";
    const stop = (tour.stops && tour.stops[0]) || "";
    const sec = tour.section || "belt";
    const mood = SECTION_MOOD[sec] || SECTION_MOOD.deep;
    return (
      "Tour · " +
      (tour.name || sec) +
      (tour.label ? " [" + tour.label + " · hypothetic]" : "") +
      ". " +
      mood +
      " Next soft stop leans toward " +
      (stop || "the next waypoint") +
      ". Stick or PILOT cancels anytime — I'm narrating, not locking you."
    );
  }


  function bodyNamedIn(text) {
    const sky = window.VesperSky;
    const list = sky && sky._bodiesRef && sky._bodiesRef();
    if (!list) return "";
    const names = [];
    for (let i = 0; i < list.length; i++) if (list[i] && list[i].name) names.push(list[i].name);
    names.sort((a, b) => b.length - a.length);
    const hay = String(text || "").toLowerCase();
    for (let i = 0; i < names.length; i++) {
      const name = names[i];
      const n = name.toLowerCase();
      let from = 0;
      while (from <= hay.length - n.length) {
        const at = hay.indexOf(n, from);
        if (at < 0) break;
        const before = at === 0 ? "" : hay.charAt(at - 1);
        const after = hay.charAt(at + n.length) || "";
        if (before === "-" || after === "-") { from = at + 1; continue; }
        if (!/[a-z0-9]/i.test(before) && !/[a-z0-9]/i.test(after)) return name;
        from = at + 1;
      }
    }
    return "";
  }

  const NAME_STOP = {
    what: 1, whats: 1, tell: 1, about: 1, this: 1, that: 1, the: 1, me: 1,
    please: 1, world: 1, body: 1, here: 1, there: 1, where: 1, is: 1, a: 1,
    an: 1, of: 1, to: 1, go: 1, travel: 1, show: 1, see: 1, visit: 1, jump: 1,
    fly: 1, take: 1, how: 1, why: 1, does: 1, did: 1, can: 1, you: 1, your: 1,
    from: 1, and: 1, or: 1, on: 1, in: 1, it: 1, its: 1, for: 1, with: 1, my: 1, not: 1,
  };

  function nameList() {
    const sky = window.VesperSky;
    const list = sky && sky._bodiesRef && sky._bodiesRef();
    const names = [];
    if (!list) return names;
    for (let i = 0; i < list.length; i++) if (list[i] && list[i].name) names.push(list[i].name);
    return names;
  }

  function tokenInName(name, tok) {
    const n = name.toLowerCase();
    let from = 0;
    while (from <= n.length - tok.length) {
      const at = n.indexOf(tok, from);
      if (at < 0) return false;
      const before = at === 0 ? "" : n.charAt(at - 1);
      const after = n.charAt(at + tok.length) || "";
      if (before !== "-" && after !== "-" && !/[a-z0-9]/i.test(before) && !/[a-z0-9]/i.test(after)) return true;
      from = at + 1;
    }
    return false;
  }

  // Bodies the app names in tips or missions but does not draw.
  // Asking about them used to answer with whatever the look chip said.
  const ABSENT = {
    vanth: { label: "Vanth", line: "Vanth is not in this sky. Soft-land Orcus for the binary tip." },
    actaea: { label: "Actaea", line: "Actaea is not in this sky. Soft-land Salacia — the card already says so." },
    xiangliu: { label: "Xiangliu", line: "Xiangliu is not in this sky. Soft-land Gonggong instead." },
    chiron: { label: "Chiron", line: "Chiron is not in this sky — no centaur rock here. Quaoar still has the ring desk." },
    chariklo: { label: "Chariklo", line: "Chariklo is not in this sky. Quaoar still has the ring desk." },
    hydra: { label: "Hydra", line: "Hydra is not in this sky. Nix and Charon still orbit Pluto." },
    kerberos: { label: "Kerberos", line: "Kerberos is not in this sky. Nix and Charon still orbit Pluto." },
    styx: { label: "Styx", line: "Styx is not in this sky. Nix and Charon still orbit Pluto." },
    atlas: { label: "Atlas", line: "Atlas is not in this sky. Janus and Epimetheus still orbit Saturn." },
    naiad: { label: "Naiad", line: "Naiad is not in this sky. Larissa and Proteus still orbit Neptune." },
    pandora: { label: "Pandora", line: "Pandora is not in this sky. Janus and Epimetheus still orbit Saturn." },
    pan: { label: "Pan", line: "Pan is not in this sky. Janus and Epimetheus still orbit Saturn." },
    prometheus: { label: "Prometheus", line: "Prometheus is not in this sky. Janus and Epimetheus still orbit Saturn." },
    thalassa: { label: "Thalassa", line: "Thalassa is not in this sky. Larissa and Proteus still orbit Neptune." },
    despina: { label: "Despina", line: "Despina is not in this sky. Larissa and Proteus still orbit Neptune." },
    galatea: { label: "Galatea", line: "Galatea is not in this sky. Larissa and Proteus still orbit Neptune." },
    hippocamp: { label: "Hippocamp", line: "Hippocamp is not in this sky. Larissa and Proteus still orbit Neptune." },
  };

  function absentNamedIn(text) {
    const raw = String(text || "").toLowerCase();
    const keys = Object.keys(ABSENT).sort((a, b) => b.length - a.length);
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      const re = new RegExp("\\b" + k.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&") + "\\b", "i");
      if (re.test(raw)) return ABSENT[k];
    }
    return null;
  }

  // Surface features the app names in tips/missions but are not travel bodies.
  // Asking "what is Valhalla" used to answer with the look-chip world.
  const FEATURES = {
    valhalla: { label: "Valhalla", parent: "Callisto", line: "Valhalla is Callisto's giant multi-ring basin. Soft-land Callisto for the Valhalla Rim." },
    asgard: { label: "Asgard", parent: "Callisto", line: "Asgard is a Callisto multi-ring basin (IAU name). Soft-land Callisto for the Asgard Rim Shelter." },
    herschel: { label: "Herschel", parent: "Mimas", line: "Mimas hosts Herschel crater (~130 km), about a third of the moon. Soft-land to walk the rim." },
    stickney: { label: "Stickney", parent: "Phobos", line: "Stickney nearly spans Phobos — soft-land for the Stickney Overlook." },
    rheasilvia: { label: "Rheasilvia", parent: "Vesta", line: "Rheasilvia is Vesta's giant south basin. Soft-land Vesta for the rim." },
    verona: { label: "Verona Rupes", parent: "Miranda", line: "Miranda's Verona Rupes may be the tallest cliff in Sol. Soft-land Miranda carefully." },
    mordor: { label: "Mordor Macula", parent: "Charon", line: "Charon's Mordor Macula is a red polar tholin region. Soft-land Charon for the binary waltz." },
    kraken: { label: "Kraken Mare", parent: "Titan", line: "Kraken Mare is Titan's large methane sea. Soft-land Titan for the Kraken Shore." },
    occator: { label: "Occator", parent: "Ceres", line: "Occator holds Ceres' bright salts. Soft-land Ceres for the Occator Salt Desk." },
  };

  function featureNamedIn(text) {
    const raw = String(text || "").toLowerCase();
    const keys = Object.keys(FEATURES).sort((a, b) => b.length - a.length);
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      const re = new RegExp("\\b" + k.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&") + "\\b", "i");
      if (re.test(raw)) return FEATURES[k];
    }
    return null;
  }

  function hypNamedAbsent(text) {
    const hyps =
      (window.VesperHypothetics &&
        window.VesperHypothetics.names &&
        window.VesperHypothetics.names()) ||
      [];
    if (!hyps.length) return null;
    const raw = String(text || "").toLowerCase();
    const sorted = hyps.slice().sort((a, b) => b.length - a.length);
    const inSky = {};
    const list = nameList();
    for (let i = 0; i < list.length; i++) inSky[list[i]] = 1;
    for (let i = 0; i < sorted.length; i++) {
      const name = sorted[i];
      if (inSky[name]) continue;
      const n = name.toLowerCase();
      let from = 0;
      while (from <= raw.length - n.length) {
        const at = raw.indexOf(n, from);
        if (at < 0) break;
        const before = at === 0 ? "" : raw.charAt(at - 1);
        const after = raw.charAt(at + n.length) || "";
        if (!/[a-z0-9]/i.test(before) && !/[a-z0-9]/i.test(after)) {
          return name;
        }
        from = at + 1;
      }
    }
    return null;
  }

  // Full catalog name, or one body whose name uses that word.
  // "starman" is Starman Roadster. "voyager" is two craft, so it is not a guess.
  // Multi-token phrases prefer names that carry every token (Dock Annex,
  // Dyson Whisper Ring) so a shared word cannot steal the trip or tip.
  function resolveName(text) {
    const full = bodyNamedIn(text);
    if (full) return { name: full };
    const hypGone = hypNamedAbsent(text);
    if (hypGone) return { name: hypGone, hypAbsent: true };
    const names = nameList();
    const toks = String(text || "").toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 3 && !NAME_STOP[w]);
    function withHall(hit) {
      // Only bare "Hall" asks Halley vs Guild Hall. "Guild Hall" stays the Drift hub.
      if (!(toks.length === 1 && toks[0] === "hall")) return hit;
      const out = hit.slice();
      for (let j = 0; j < names.length; j++) {
        if (names[j].toLowerCase() === "halley" && out.indexOf(names[j]) < 0) out.push(names[j]);
      }
      return out;
    }
    if (toks.length >= 2) {
      let hits = names.filter((n) => tokenInName(n, toks[0]));
      for (let i = 1; i < toks.length; i++) hits = hits.filter((n) => tokenInName(n, toks[i]));
      hits = withHall(hits);
      if (hits.length === 1) return { name: hits[0] };
      if (hits.length > 1 && hits.length < 6) return { ambiguous: hits };
      // No shared hit — do not fall back to one lucky word
      // ("Build Bench" must not become Juno Assay Bench).
      return null;
    }
    let ambiguous = null;
    const uniq = [];
    for (let i = 0; i < toks.length; i++) {
      let hit = [];
      for (let j = 0; j < names.length; j++) if (tokenInName(names[j], toks[i])) hit.push(names[j]);
      // "Hall" must not silently pick Guild Hall over Halley.
      if (toks[i] === "hall") hit = withHall(hit);
      if (hit.length === 1) uniq.push(hit[0]);
      else if (hit.length > 1 && hit.length < 4) ambiguous = hit;
    }
    if (uniq.length === 1) return { name: uniq[0] };
    if (ambiguous) return { ambiguous: ambiguous };
    return null;
  }

  function reply(userText, c, hooks) {
    const t = (userText || "").toLowerCase().trim();
    hooks = hooks || {};
    const s = hooks.sky || null;
    const radio = hooks.radio || window.__vesperRadio || null;

    // Empty / nudge
    if (!t) return composeStatus(c);

    // Named in tips/missions but undrawn — do not answer with the look-chip world.
    const absent = absentNamedIn(t);
    if (absent) return absent.line;

    // Hyp bodies when Hyp is off used to token-match Luna Gateway / Earth.
    // Counter-Luna must not become Luna Gateway; Counter-Earth must not become Earth.
    const hypGone = hypNamedAbsent(t);
    if (hypGone) {
      return (
        hypGone +
        " is Hyp fiction — not in this Sol sky right now. Tap Hyp (Sol off) then Travel ◈. " +
        "Labeled speculation only."
      );
    }

    // Named basins/craters are not bodies — do not answer with the look-chip world.
    const feat = featureNamedIn(t);
    if (feat) {
      if (/\b(go|travel|fly|jump|take|visit)\b/.test(t) && feat.parent && s && s.travelTo) {
        s.travelTo(feat.parent);
        return "Travel → " + feat.parent + ". " + feat.line;
      }
      return feat.line;
    }

    if (/wind\s*down|quieter|slower|calm|hush|chill|soft\s*evening/.test(t)) {
      if (s && s.setWind) s.setWind(0.88);
      return (
        "Wind-down raised — orbits ease, light softens, the evening leans quiet. " +
        "You're still free in 6DOF; only the sky's tempo changed. " +
        postureLine(c)
      );
    }
    // Place names like "Belt Guild Hall Drift" are not a FLOAT command.
    // Go/travel and what-is must win before mode words that also appear in hub titles.
    // see/show/bring/head/warp/approach must travel when a dest is set.
    const goLike = /\b(go|travel|fly|jump|take|visit|see|show|bring|head|warp|approach)\b/.test(t);
    const aboutLike = /tell me about|what is|what's|whats|\bdescribe\b|\bblurb\b/.test(t);
    // Bare float/dock/sol must still toggle. "sol" alone must not become Sol Garden Ring.
    const pureMode = /^(float|pilot|dock|cruise|burn|transit|sol|build|vanilla|cinema|hide)$/i.test(
      t.replace(/\s+/g, " ").trim()
    ) || /^(straight\s*man|science\s*mode|hide\s*controls|show\s*controls)$/i.test(t.trim());
    // "Halley tour" is a route, not an about-Halley tip.
    const tourLike = /\btour\b|lazy.?path|section\s*tour|show\s*me\s*around/.test(t);
    // "Dock Annex Drift" alone is the hub, not FLOAT.
    const placeAsk = (!goLike && !aboutLike && !pureMode && !tourLike && !(hooks && hooks.travelDest))
      ? resolveName(t)
      : null;
    if (placeAsk && placeAsk.ambiguous) {
      return "More than one body matches. Name one: " + placeAsk.ambiguous.join(", ") + ".";
    }
    if (placeAsk && placeAsk.name) {
      let blurb = "";
      try {
        blurb = (s && s.getBlurb && s.getBlurb(placeAsk.name)) || "";
      } catch (_) {}
      return composeAbout({ looking: placeAsk.name, blurb: blurb, mode: c.mode, gear: c.gear, speed: 0, wind: c.wind });
    }
    if (!goLike && !aboutLike && /\bfloat\b|meditat|gentle|drift|lazy.?river/.test(t)) {
      if (s) s.setMode("float");
      return (
        "FLOAT on. Soft thrust, and after a quiet beat the lazy-river picks a gentle pattern. " +
        "Full 6DOF stays yours — touch the stick to interrupt. " +
        tipBlock(c)
      );
    }
    if (!goLike && !aboutLike && /\bpilot\b|manual|spicy|fast\s*thrust|fling/.test(t)) {
      if (s) s.setMode("pilot");
      return (
        "PILOT on — higher thrust, lighter damping. Gear still caps the band. " +
        "You can get flung; drop to DOCK near moons. " +
        postureLine(c)
      );
    }
    // "Go to Dock Annex Drift" / "what is ISS Dock Annex" are places, not gear DOCK.
    if (!goLike && !aboutLike && /\bdock\b/.test(t) && s && s.setGear) {
      s.setGear(0);
      return "Gear DOCK — inspection pace for skims and walk approach. " + moodLine(c);
    }
    if (!goLike && !aboutLike && /\bcruise\b/.test(t) && !/clock/.test(t) && s && s.setGear) {
      s.setGear(1);
      return "Gear CRUISE — leisure band. Hold boost to ramp when you want a longer stride. " + postureLine(c);
    }
    if (!goLike && !aboutLike && /\bburn\b/.test(t) && s && s.setGear) {
      s.setGear(2);
      return "Gear BURN — hard system hops. Ease off before soft-land. " + tipBlock(c);
    }
    if (!goLike && !aboutLike && /\btransit\b/.test(t) && s && s.setGear) {
      s.setGear(3);
      return "Gear TRANSIT — outer-system pace. Drop gears before a moon pad. " + postureLine(c);
    }
    // "Go to Sol Garden Ring (Hyp)" is travel, not the Sol honesty toggle.
    if (!goLike && !aboutLike && /\b(sol|straight\s*man|science\s*mode|vanilla)\b/.test(t) && s && s.setStraightMan) {
      const on = !c.straight;
      s.setStraightMan(on);
      return on
        ? "Sol / Straight Man on — scientific Sol only. Bots, artifacts, builds, and the Observation Station fantasy layer hide. Orbits and bodies stay."
        : "Sol off — society, craft builds, and the station can show again. Science catalog never left.";
    }
    if (!goLike && !aboutLike && (/\bbuild\b|voxel|habitat|craft\s*prop/.test(t)) && s && s.setBuildMode) {
      const on = !c.build;
      s.setBuildMode(on);
      return on
        ? "Build on — tap places. Erase in the tray removes. Saved on this device. Sol hides them."
        : "Build off. Props you placed stay until you clear them.";
    }
    if (/hide\s*controls|cinema\s*hud|immersive|clear\s*hud|hide\s*hud/.test(t)) {
      if (hooks.setHideControls) hooks.setHideControls(true);
      return "Menus hidden. The stick stays. Cinema hides movement too. Slim edge tab restores menus. Companion stays out until you open Call.";
    }
    if (/show\s*controls|restore\s*hud|show\s*hud/.test(t)) {
      if (hooks.setHideControls) hooks.setHideControls(false);
      return "HUD restored. Fly as you were.";
    }
    if (/reset|restart|default|home\s*overlook|go\s*home/.test(t)) {
      if (s && s.reset) s.reset();
      else {
        const b = document.getElementById("btn-reset");
        if (b) b.click();
      }
      return "Home overlook — Earth ahead, orbits rewound. Soft evening postcard. " + moodLine(c);
    }
    if (/^home$/.test(t)) {
      if (s && s.travelTo) s.travelTo("Home");
      else if (s && s.reset) s.reset();
      return "Home overlook.";
    }
    if (/\bpause\b|freeze|full\s*stop/.test(t)) {
      if (s) s.pause(true);
      return "Paused — ship and orbits frozen. Say resume when you want the dance back. Clock ⏸ alone would only freeze orbits.";
    }
    if (/resume|unpause|\bplay\b/.test(t)) {
      if (s) s.pause(false);
      return "Resuming. Sky live again. " + postureLine(c);
    }
    if (/cinema|vr\s*cutout|headset|phone\s*vr/.test(t)) {
      if (hooks.setCinema) hooks.setCinema(true);
      return "Cinema sheet on — chat docks low so the planetarium stays the star. Exit cinema when you're done talking.";
    }
    if (/exit\s*cinema|leave\s*cinema/.test(t)) {
      if (hooks.setCinema) hooks.setCinema(false);
      return "Back to compact Call. HUD chrome unchanged — use Hide controls for immersive float.";
    }
    if (/tour|route|lazy.?path|section\s*tour|belt\s*tour|show\s*me\s*around/.test(t)) {
      if (hooks.startTour) {
        // Named worlds in the ask pick their section (Europa→giants, Mars→inner).
        // Bare "Hyp tour" must not fall through to belt.
        let sec = /inner/.test(t)
          ? "inner"
          : /giant|jupiter|saturn/.test(t)
            ? "giants"
            : /ice|uranus|neptune|halley/.test(t)
              ? "ice"
              : /dwarf|kuiper|pluto/.test(t)
                ? "dwarfs"
                : /\bhyp\b|hypothet/.test(t)
                  ? "hypothetics"
                  : /\bcraft\b|starman|roadster/.test(t)
                    ? "craft"
                    : /belt|ceres|vesta|station/.test(t)
                      ? "belt"
                      : "";
        if (!sec) {
          const named = bodyNamedIn(t);
          if (named) {
            const fromBody = sectionOf({ looking: named });
            if (fromBody && fromBody !== "deep") sec = fromBody;
          }
        }
        if (!sec) sec = sectionOf(c) === "deep" ? "belt" : sectionOf(c);
        // An Oort buoy is a place, not a route. startTour used to
        // rename that request to belt and this line still said Oort.
        if (sec === "oort") {
          hooks.startTour("belt");
          return "There is no Oort tour. The buoy is the named place. Starting a belt tour instead. Stick or PILOT cancels. " + composeTourHint(c);
        }
        const started = hooks.startTour(sec);
        if (!started) {
          if (sec === "hypothetics") {
            return (
              "Hypothetics tour needs Hyp on and Sol off — then ask again. " +
              composeTourHint(c)
            );
          }
          return "That tour could not start right now. Open Tour and pick a section, or try again. " + composeTourHint(c);
        }
        const article = /^[aeiou]/i.test(sec) ? "an" : "a";
        return "Starting " + article + " " + sec + " tour — randomized curated route. Stick or PILOT cancels. " + composeTourHint(c);
      }
      return composeTourHint(c);
    }
    if (/what.*(looking|see|facing)|where am i|where are we|status|context/.test(t)) {
      return composeStatus(c);
    }
    if (/tell me about|what is|what's|whats|describe|blurb|science|fact|lore/.test(t)) {
      // "What is Mars" while the chip says Earth used to answer Earth.
      // Titan must not steal Titania, and Earth must not steal Counter-Earth.
      const resolved = resolveName(t);
      if (resolved && resolved.ambiguous) {
        return "More than one body matches. Name one: " + resolved.ambiguous.join(", ") + ".";
      }
      const asked = resolved && resolved.name;
      const here = String(c.looking || c.walkBody || "");
      if (asked && asked !== here) {
        let blurb = "";
        try {
          blurb = (window.VesperSky && window.VesperSky.getBlurb && window.VesperSky.getBlurb(asked)) || "";
        } catch (_) {}
        return composeAbout({ looking: asked, blurb: blurb, mode: c.mode, gear: c.gear, speed: 0, wind: c.wind });
      }
      return composeAbout(c);
    }
    // A shared word is not one body. "starman" is the Roadster and the deck.
    // This sits above the Roadster lore so "go to starman" cannot answer as only one.
    if (!(hooks && hooks.travelDest)) {
      const resolved = resolveName(t);
      if (resolved && resolved.ambiguous) {
        return "More than one body matches. Name one: " + resolved.ambiguous.join(", ") + ".";
      }
    }

    // Lore lines for Europa, Mercury, Vesta, and the Roadster used to answer
    // "go to …" and leave the ship where it was. Travel wins when a dest is set.
    if (hooks.travelDest && s && s.travelTo) {
      const ok = s.travelTo(hooks.travelDest);
      if (!ok) {
        // Sol hides Hyp / Observation Station — do not claim Travel →.
        return (
          hooks.travelDest +
          " isn't reachable right now. Sol may be hiding fiction or the station layer — tap Sol off, or pick another Go… target."
        );
      }
      const bl = s.getBlurb ? s.getBlurb(hooks.travelDest) : "";
      const extra = factFor(hooks.travelDest);
      return (
        "Travel → " +
        hooks.travelDest +
        ". " +
        (bl || "") +
        (extra ? " " + extra : "") +
        " Soft-land when you're close; DOCK gear helps."
      );
    }
    // "Go to Build Bench" used to fall through to a random tour tip.
    if (goLike && !hooks.travelDest) {
      return (
        "No place matches that name in Travel ◈. Name a world, moon, craft, or hub — or open the Go menu."
      );
    }

    if (/starman|roadster|falcon.?heavy.?demo/.test(t)) {
      return "Starman Roadster is an educational replica of the 2018 Falcon Heavy demo payload on a heliocentric eccentric path (display e≈0.26). Cherry open-top, suit figure, dash Earth, fairing fragment — labeled, not affiliated with Tesla or SpaceX. Travel · Craft or Tour · Craft to visit.";
    }
    if (/herschel|mimas/.test(t)) {
      return "Mimas hosts Herschel crater (~130 km), about a third of the moon. Soft-land to walk the rim.";
    }
    if (/iapetus|cassini regio|two-tone/.test(t)) {
      return "Iapetus is famously two-tone: dark Cassini Regio vs bright ice, plus an equatorial ridge. Walk the divide — yin and yang under Saturn.";
    }
    if (/verona|miranda|cliff/.test(t)) {
      return "Miranda’s Verona Rupes may be the tallest cliff in Sol — coronae and extreme geology on a small Uranian moon. Soft-land carefully.";
    }
    if (/mordor|charon/.test(t)) {
      return "Charon’s Mordor Macula is a red polar tholin region. Binary with Pluto — tidally locked partners in the Kuiper dark.";
    }
    if (/rheasilvia|vesta/.test(t)) {
      return "Vesta’s Rheasilvia basin is a giant impact scar on a differentiated protoplanet. Dawn mapped it in detail.";
    }
    if (/hohmann|transfer|delta.?v|Δv/.test(t)) {
      return "Transfer HUD (top-left) shows a rough Hohmann Δv and time-of-flight from your current heliocentric radius to the body you're looking at — circular approx, educational only. Synodic days vs Earth when periods are known.";
    }
    if (/mercury/.test(t)) {
      return "Mercury tip: extreme day/night temperatures and a long solar day. Soft-land for cratered rock underfoot; skim carefully — no air to brake.";
    }
    if (/europa|lineae|ice.?shell/.test(t)) {
      return "Europa soft-land shows dark lineae and pressure ridges underfoot — a visual cue for the ice shell over a subsurface ocean candidate. Almanac carries g and v_esc. Soft leave when ready.";
    }
    if (/tip|suggest|what should|idea|try something|recommend/.test(t)) {
      return tipBlock(c) + " " + scienceBlock(c);
    }
    if (/hello|hi\b|hey|good evening|good night|howdy/.test(t)) {
      return composeGreeting(c);
    }
    if (/help|how.*(fly|control)|controls|what can you/.test(t)) {
      return composeHelp(c);
    }
    if (/privacy|api key|webhook|is this safe|who sees/.test(t)) {
      if (hooks.setAdvanced) hooks.setAdvanced(true);
      return (
        "Privacy: offline needs no key — I answer from your cockpit context and a local almanac. " +
        "Keys live only in this browser. Live AI (Advanced) sends chat + brief sky context solely to the https/localhost URL you set — never to Vesper servers. Clear keys anytime in Advanced."
      );
    }
    if (/deep.?sky|nebula|milky.?way|zodiacal|look\s*up|why.*(bright|color|colour)|false.?color|Hα|oiii|galaxy/.test(t)) {
      return (
        "Far sky is Vesper beauty mode — physics-inspired, not cartoon. Naked-eye nebulae are usually too dim; " +
        "here you get boosted Hα reds, [OIII] teals, dust lanes, Milky Way structure, zodiacal light, and integrated starlight. " +
        "Hide the HUD and look up. Wind-down softens the boost a little. " +
        moodLine(c)
      );
    }
    if (/phaeton|pbh|nibiru|planet.?nine|planet.?x|tyche|nemesis|vulcan|theia|counter-|hypothetic/i.test(t)) {
      return (
        "Hypothetics need Hyp on and Sol off — then Travel ◈ names. Phaeton is a rubble swarm; PBH-Halo is a gravity-well viz; Planet Nine / Tyche sit on compressed outer rails so you can actually see them. " +
        moodLine(c)
      );
    }
    if (/radio|observation station|skytape|sky.?radio|music station|listen|comms|find\s*station|where.*station/.test(t)) {
      if (s && s.travelTo && /travel|go|take|bring|jump|find/.test(t)) {
        s.travelTo("Observation Station");
        return (
          "Travel → Observation Station. " +
          composeStation(c, radio)
        );
      }
      return composeStation(c, radio);
    }
    if (/live ai|enable live|connect (grok|openai)|advanced/.test(t)) {
      if (hooks.setAdvanced) hooks.setAdvanced(true);
      return "Advanced is open for optional Live AI. Offline companion stays default and needs no key — that's me, with the local almanac.";
    }
    if (/nearby|what's near|whats near|around me|close\s*by/.test(t)) {
      const near = c.near || c.looking;
      if (near) {
        return (
          "Closest read: " +
          near +
          ". " +
          scienceBlock(Object.assign({}, c, { looking: near })) +
          " " +
          tipBlock(c)
        );
      }
      return "No body in the near/skim band. " + postureLine(c) + " " + composeTourHint(c);
    }

    // Freeform contextual
    if (c.walking && c.walkBody) {
      return (
        postureLine(c) +
        " " +
        scienceBlock(c) +
        " " +
        pick([
          "Stay as long as you like — takeoff is thrust up or boost.",
          "If you came for the Skytape, look for the glowing bench prop.",
          tipBlock(c),
        ])
      );
    }
    if (c.looking) {
      return composeAbout(c);
    }
    return pick([
      composeStatus(c) + " Try: travel Saturn, belt tour, or tell me about the Sun.",
      tipBlock(c) + " " + moodLine(c),
      composeTourHint(c),
      composeGreeting(c),
      "I'm offline-first — multi-sentence answers from your mode, gear, look target, and a science almanac. Live AI is optional under Advanced.",
    ]);
  }

  window.VesperCompanionBrain = {
    reply,
    resolveName,
    factFor,
    composeStatus,
    composeAbout,
    composeTourNarration,
    sectionOf,
    FACTS,
  };
})();
