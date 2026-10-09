/**
 * Vesper Hope — Expanse / Azemondar-flavored futurism: care beacons, soft tips,
 * Sol-honest wonder. No internal branding. Fiction labeled when needed.
 */
(function () {
  "use strict";

  const TIPS = [
    "Soft-land anywhere solid · press leave when the sky calls.",
    "Starman Roadster is an educational replica — elliptical heliocentric path, labeled honestly.",
    "Europa’s lineae underfoot hint at a shell over a dark ocean — walk gently.",
    "Titan’s lakes are hydrocarbon stand-ins — thick air, orange haze, human curiosity.",
    "Observation Station rings with quiet care — Skytape bay unlocks Sky Radio.",
    "Kepler still holds: farther out, slower years. Watch the clock title for ratios.",
    "Build Solar arrays and Hope beacons — leave a trace someone else can find.",
    "City lights on Earth’s nightside are a reminder: someone is home.",
    "Gas-giant decks are playable fiction — labeled as cloud-walk, not crust.",
    "Ultra quality unlocks denser procedurals when your machine can breathe.",
    "Every body is walkable except the Sun (skim only — she’d rather you live).",
    "The belt isn’t empty — rocks, dust, and a habitat that chose hope.",
    "Almanac facts ride the look-chip — AU, periods, g, escape velocity.",
    "Footprints fade; the decision to land does not. Leave kindly.",
    "Hypothetics stay labeled · Sol stays honest · Straight Man hides the fiction.",
    "Vulcan’s scorched rail is 19th-c. fiction — GR closed Mercury’s perihelion puzzle.",
    "Nemesis was never found; Vesper keeps the ember only as labeled Hyp dreamer chrome.",
    "Planet Nine is unconfirmed science hyp — teal ice-giant mood, not Nibiru lore.",
    "Phaeton’s rubble underfoot is myth; the belt was rubble from the start.",
    "PBH-Halo is a gravity-well viz — walk the purple rim, remember it’s fiction.",
    "Theia may have made our Moon; here she waits on a Hyp rail as deep-time hope.",
    "Cassini’s memorial dish still listens in miniature — educational chrome near Saturn.",
    "Juno’s hex + solar wings nod to Jupiter’s polar mapper — labeled craft silhouette.",
    "Moon maria underfoot are basalt seas — highland rays still whisper ancient impacts.",
    "Mercury’s bright rays are crater ejecta; days last longer than years here.",
    "Ganymede’s grooves are tectonic sulci — largest moon, with its own magnetic field.",
    "Callisto’s nested rims are a museum of impacts; oldest Galilean face.",
    "Io vents glow underfoot — tidal fire from Jupiter’s tug. Soft leave before the yellow sticks.",
    "Triton’s cantaloupe mounds and N₂ frost: a captured Kuiper world walking Neptune backward.",
    "Pluto’s bright heart (Tombaugh Regio) and tholin reds — binary with Charon, still dreaming.",
    "Ceres’ Occator salts shine like care beacons in the belt — Dawn was here.",
    "Phobos’ Stickney rim is almost too big for the rock — walk the rubble kindly.",
    "Starman’s suit HOPE pip and fairing solar cue are educational chrome — not a brand ad.",
    "Mimas’ Herschel rim swallows the horizon — a crater that almost broke a moon.",
    "Iapetus walks yin and yang: dark Cassini Regio, bright ice, and a spine along the equator.",
    "Miranda’s cliffs could drop you for kilometers — Verona Rupes, tallest known cliff in Sol.",
    "Dione’s wispy fractures glow like care-lines in the ice — tectonic love letters.",
    "Vesta’s Rheasilvia basin is a protoplanet’s scar — Dawn mapped every ridge.",
    "Charon’s Mordor Macula is a red polar cap of tholins — binary waltz with Pluto.",
    "Sedna’s deep red is sunlight chemistry at the edge of the map — perihelion still farther than Neptune.",
    "Eris and Haumea keep dwarf-planet company beyond Pluto — cold, honest, labeled.",
    "Makemake’s tholin dunes are red like old hopes left in the Kuiper dark.",
    "Leave a Hope beacon wherever you land — someone else may need the light.",
    "Deimos Yard has a night watch and a relay — walk the hangar, don't just thrust away.",
    "Assay outposts in the belt trade ore tags for stories. Soft-land slow.",
    "Activities on the left are reasons to visit, not an icon checklist.",
    "Hyp megastructures are labeled fiction; Sol stays honest.",
    "Chase cam shows your ship; cockpit is for the embodied fly feel.",
    "Oort Whisper Buoy is lonely on purpose. Hail it.",
    "Codex (K) tracks collectibles — fill it by landing with purpose, not icon spam.",
    "Dark contacts want flares or distance. Restraint is the Expanse move.",
    "Write Mira from a quiet shore. Quill dates by radio.",
    "Life bar on phone: I J U E G V ✦ K — systems without hunting menus.",
    "The Expanse dreamed of careful humans among the planets; Vesper tries the same tone.",
    "Uranian moons keep their own moods — Ariel bright, Umbriel dark, Titania scarred, Oberon quiet.",
    "Voyager’s dish still points home in miniature — educational HGA chrome on the rail.",
    "Psyche walks like forged night — M-type metal flecks for the dream of mining care, not conquest.",
    "Phoebe is Saturn’s dark captured cousin — irregular, retrograde, honest about where she came from.",
    "ISS cupola is a window homeward — human care parked in LEO, labeled on the craft rail.",
    "Hyperion tumbles — chaotic rotator, spongy ice. Soft-land if you need a reminder that moons aren’t clocks.",
    "Export the field notebook (N) — milestones, biome, almanac counts. Keep a dreamer’s log.",
    "Oriole keeps the Belt Drift Library quiet — cards free if you leave a map tip.",
    "Jax at GEO watches Earth nightsides breathe — chip for Mira’s second letter.",
    "Sable mediates dark docks: hail once, signal lamp, evade. No hero speeches.",
    "Ontario Lacus lamp on Titan is Quill’s annex — romance by radio, not rush.",
    "Conamara Chaos desk is Europa’s other quiet — Solis still prefers sealed vials.",
    "Amalthea Watch is short EVA honesty — radiation tags before bravado.",
    "Quaoar’s ring rumor is chalk until you stand the Weywot desk.",
    "Spare Parts Drift sells thruster tips; Assay still wants honest weights.",
    "Signal lamp is nonlethal dock language — counts as restraint for Listen Society.",
    "Haven pours Belt tea — recycled leaf, honest rumors, no conquest branding.",
    "Pike on Io files heat; Sable files restraint. Both want you back.",
    "Tycho rays are quiet walks — take a photo, not a conquest stamp.",
    "Olympus overlook is for sitting honestly; Brick keeps dust tags.",
    "Hail Beacon Wand reaches farther than a lamp — still nonlethal.",
    "Janus and Epimetheus waltz — co-orbit chalk is a love letter to mechanics.",
    "Asgard Rim on Callisto keeps longer tea than egos.",
    "Kira runs Night Market after Assay closes — tokens for tea money, not conquest.",
    "Wren's Hope Desk stamps care. Plant a beacon where the next pilot might need light.",
    "Ligeia shore lamp is Quill's annex — same slow romance rules as Ontario.",
    "Seal Injector is clinic vibe on Io — foam first, speeches never.",
    "Marineris rim and Copernicus overlook are sit places, not flag places.",
    "Dante stewards Guild Hall Drift — pins for desks, not conquest speeches.",
    "Selene keeps Tranquility Walk memorial — photo quiet, same as Tycho.",
    "Foam Sprayer is clinic vibe — seals over speeches at Seal Clinic Spur.",
    "Kraken North lamp is Quill's long-watch annex — still no rush across AU.",
    "Utopia Planitia camps keep rover paths — Brick's keyfob honesty, not flags.",
    "Adlinda Rim on Callisto is tea and archive tip — longer than egos.",
    "Pin Exchange Drift overflows guild marks after the Hall closes.",
  ];

  let tipIdx = 0;
  let lastTs = 0;
  let el = null;

  function ensure() {
    if (el) return el;
    el = document.createElement("div");
    el.id = "hope-pip";
    el.setAttribute("aria-live", "polite");
    el.style.cssText =
      "position:fixed;z-index:20;right:12px;bottom:max(48px,env(safe-area-inset-bottom));" +
      "max-width:min(320px,42vw);padding:8px 12px;border-radius:10px;" +
      "background:rgba(8,14,22,0.72);border:1px solid rgba(100,180,220,0.28);" +
      "color:#c8e0f0;font:12px/1.4 system-ui,sans-serif;pointer-events:none;" +
      "opacity:0;transition:opacity 0.8s ease;box-shadow:0 0 24px rgba(40,120,180,0.15)";
    document.body.appendChild(el);
    return el;
  }

  const BODY_WORDS = ["Europa","Ganymede","Callisto","Enceladus","Mercury","Jupiter","Saturn","Uranus","Neptune","Venus","Earth","Mars","Pluto","Titan","Triton","Ceres","Deimos","Phobos","Io","Moon","Sun","Haumea","Makemake","Miranda","Iapetus","Oberon","Titania","Vesta","Mimas","Dione","Sedna","Psyche","Phoebe","Hyperion","Amalthea","Quaoar","Janus","Epimetheus","PBH-Halo","Nemesis","Phaeton","Planet Nine","Nibiru","Vulcan","Theia","Tyche","Starman","Voyager","ISS"];
  function hereName() {
    const s = window.VesperSky;
    if (!s) return "";
    if (s.isWalking && s.isWalking() && s.getWalkBody) return String(s.getWalkBody() || "");
    if (s.getLookingAt) return String(s.getLookingAt() || "");
    return "";
  }
  function mentions(text, word) {
    // "Titan" is inside "Titania". indexOf let a Titan callout play
    // on Titania and a Titania line play while standing on Titan.
    let from = 0;
    while (from <= text.length - word.length) {
      const i = text.indexOf(word, from);
      if (i < 0) return false;
      const before = i === 0 ? "" : text.charAt(i - 1);
      const after = text.charAt(i + word.length) || "";
      const letter = /[A-Za-z]/;
      // A hyphen is part of the name. "Earth" inside "Counter-Earth"
      // is not the real planet, and the same for "Luna".
      if (before === "-" || after === "-") { from = i + 1; continue; }
      if (!letter.test(before) && !letter.test(after)) return true;
      from = i + 1;
    }
    return false;
  }
  function tipOk(text, here) {
    if (here == null) here = hereName();
    for (let i = 0; i < BODY_WORDS.length; i++) {
      const w = BODY_WORDS[i];
      if (mentions(text, w) && !mentions(here, w)) return false;
    }
    return true;
  }
  function showTip(force) {
    const here = showTip._here;
    showTip._here = null;
    const now = performance.now();
    if (!force && now - lastTs < 48000) return;
    lastTs = now;
    const node = ensure();
    if (document.body.classList.contains("hide-controls") || document.body.classList.contains("cinema-mode")) {
      node.style.opacity = "0";
      return;
    }
    let picked = null;
    for (let n = 0; n < TIPS.length; n++) {
      tipIdx = (tipIdx + 1) % TIPS.length;
      if (tipOk(TIPS[tipIdx], here)) { picked = TIPS[tipIdx]; break; }
    }
    if (!picked) {
      node.textContent = "";
      node.style.opacity = "0";
      return;
    }
    node.textContent = "✦ " + picked;
    node.style.opacity = "0.9";
    clearTimeout(showTip._hide);
    showTip._hide = setTimeout(() => {
      if (node) node.style.opacity = "0.15";
    }, 9000);
  }

  function pulseBeacons(dt) {
    const surf = window.VesperSurfaces && window.VesperSurfaces.active && window.VesperSurfaces.active();
    // Soft emissive pulse on hope beacons in surface root via scene search
    const s = window.VesperSky;
    if (!s || !s.scene) return;
    const scene = s.scene();
    if (!scene) return;
    const t = performance.now() * 0.001;
    scene.traverse((o) => {
      if (o.name === "hopeBeacon") {
        o.children.forEach((ch) => {
          if (ch.isPointLight) ch.intensity = 0.45 + 0.35 * (0.5 + 0.5 * Math.sin(t * 1.7));
          if (ch.material && ch.material.emissiveIntensity != null && ch.geometry && ch.geometry.type === "SphereGeometry") {
            ch.material.emissiveIntensity = 0.9 + 0.5 * (0.5 + 0.5 * Math.sin(t * 2.1));
          }
        });
      }
      if (o.name === "softPad" && o.material && o.material.opacity != null) {
        o.material.opacity = 0.32 + 0.2 * (0.5 + 0.5 * Math.sin(t * 1.3));
      }
      if (o.name === "stationCupola" && o.material && o.material.emissiveIntensity != null) {
        o.material.emissiveIntensity = 0.2 + 0.25 * (0.5 + 0.5 * Math.sin(t * 1.4));
      }
      if (o.name === "stationBayLight" && o.isPointLight) {
        o.intensity = 0.3 + 0.2 * (0.5 + 0.5 * Math.sin(t * 1.15));
      }
    });
  }

  function loop() {
    requestAnimationFrame(loop);
    pulseBeacons(1 / 60);
  }

  let booted = false;
  function boot() {
    if (booted) return;
    booted = true;
    ensure();
    showTip(true);
    setInterval(() => showTip(false), 52000);
    loop();
    // First walk tip
    window.addEventListener("vesper:walk", () => {
      lastTs = 0;
      showTip(true);
    });
    // A jump leaves the old sentence up. Home was still reading Vesta.
    window.addEventListener("vesper:travel", (ev) => {
      const dest = (ev.detail && ev.detail.name) || "";
      lastTs = 0;
      showTip._here = !dest || dest === "Home" ? "" : dest;
      showTip(true);
    });
  }

  window.VesperHope = { tips: TIPS, showTip: showTip };
  window.addEventListener("vesper:ready", () => setTimeout(boot, 400));
  if (document.readyState !== "loading") setTimeout(boot, 600);
})();
