/**
 * Soft milestones — first soft-land per biome class (hopeful explorer log, local only).
 */
(function () {
  "use strict";
  const LS = "vesper.milestones.v1";
  let seen = {};
  try {
    seen = JSON.parse(localStorage.getItem(LS) || "{}") || {};
  } catch (_) {
    seen = {};
  }
  function save() {
    try {
      localStorage.setItem(LS, JSON.stringify(seen));
    } catch (_) {}
  }
  function toast(msg) {
    if (window.VesperMessages) window.VesperMessages.show(msg, 3200);
  }

  function classFor(name) {
    const bio = window.VesperSurfaces && window.VesperSurfaces.biomeFor && window.VesperSurfaces.biomeFor(name);
    if (bio) return bio;
    if (/Starman/i.test(name)) return "starman";
    return "other";
  }
  function onWalk(name) {
    if (!name) return;
    const cls = classFor(name);
    const key = "land:" + cls;
    if (seen[key]) return;
    seen[key] = { name: name, t: Date.now() };
    save();
    const labels = {
      earth: "First Earth soft-land — blue marble underfoot.",
      mars: "First Mars soft-land — rust and sky.",
      europa: "First Europa soft-land — lineae and quiet ice.",
      titan: "First Titan soft-land — orange haze and dark lakes.",
      plume: "First Enceladus soft-land — frost and plume mist.",
      venus: "First Venus soft-land — display hellscape (labeled fiction).",
      luna: "First Moon soft-land — maria and highland rays.",
      mercury: "First Mercury soft-land — bright rays on hot grey.",
      ganymede: "First Ganymede soft-land — sulci grooves, giant moon.",
      callisto: "First Callisto soft-land — nested ancient rims.",
      io: "First Io soft-land — sulfur vents and tidal fire.",
      triton: "First Triton soft-land — cantaloupe and N₂ frost.",
      pluto: "First Pluto soft-land — Tombaugh heart and tholins.",
      ceres: "First Ceres soft-land — Occator salt shine.",
      phobos: "First Phobos soft-land — Stickney rim and rubble.",
      deimos: "First Deimos soft-land — quieter rubble sibling.",
      mimas: "First Mimas soft-land — Herschel rim swallows the sky.",
      iapetus: "First Iapetus soft-land — two-tone world with a spine.",
      miranda: "First Miranda soft-land — cliffs and coronae.",
      rhea: "First Rhea soft-land — bright cratered ice.",
      dione: "First Dione soft-land — wispy bright fractures.",
      tethys: "First Tethys soft-land — Odysseus bowl and ice.",
      vesta: "First Vesta soft-land — Rheasilvia basin.",
      eris: "First Eris soft-land — distant dwarf ice.",
      haumea: "First Haumea soft-land — elongated bright ice.",
      hiiaka: "First Hiʻiaka soft-land — Haumea's bright crystalline moon.",
      namaka: "First Namaka soft-land — quieter ice sibling of Hiʻiaka.",
      dysnomia: "First Dysnomia soft-land — Eris's darker distant moon.",
      makemake: "First Makemake soft-land — red tholin dunes.",
      sedna: "First Sedna soft-land — deep red edge-of-map.",
      charon: "First Charon soft-land — Mordor Macula red pole.",
      ariel: "First Ariel soft-land — bright fault valleys.",
      umbriel: "First Umbriel soft-land — darkest Uranian face.",
      titania: "First Titania soft-land — canyon faults.",
      oberon: "First Oberon soft-land — outer dark ice.",
      quaoar: "First Quaoar soft-land — ringed TNO warmth.",
      gonggong: "First Gonggong soft-land — red eccentric ice.",
      psyche: "First Psyche soft-land — metal flecks underfoot.",
      phoebe: "First Phoebe soft-land — dark captured irregular.",
      pallas: "First Pallas soft-land — inclined B-type face.",
      eros: "First Eros soft-land — elongated NEA dust.",
      ida: "First Ida soft-land — belt crater and Dactyl cue.",
      amalthea: "First Amalthea soft-land — red potato ridges.",
      dactyl: "First Dactyl soft-land — pebble moon grit.",
      himalia: "First Himalia soft-land — captured irregular.",
      hyperion: "First Hyperion soft-land — spongy ice voids.",
      janus: "First Janus soft-land — co-orbital bright rubble.",
      epimetheus: "First Epimetheus soft-land — Janus's dance partner.",
      larissa: "First Larissa soft-land — Neptune inner dark.",
      proteus: "First Proteus soft-land — dark irregular facets.",
      nereid: "First Nereid soft-land — eccentric distant wanderer.",
      weywot: "First Weywot soft-land — Quaoar's warm companion.",
      orcus: "First Orcus soft-land — bright plutino ice.",
      varuna: "First Varuna soft-land — elongated classical bands.",
      ixion: "First Ixion soft-land — dark red tholin.",
      salacia: "First Salacia soft-land — blue-grey KBO frost.",
      halley: "First Halley soft-land — dirty snow and organics.",
            encke: "First Encke soft-land — short-period dusty ice.",
      vulcan: "First Vulcan soft-land — Hyp scorched rock (fiction).",
      nemesis: "First Nemesis soft-land — Hyp dim ember (fiction).",
      tyche: "First Tyche soft-land — Hyp Oort giant (fiction).",
      planetnine: "First Planet Nine soft-land — Hyp distant giant (unconfirmed).",
      planetx: "First Planet X soft-land — Hyp historical perturber (speculative).",
      nibiru: "First Nibiru soft-land — Hyp fringe lore (fiction).",
      pbh: "First PBH-Halo soft-land — Hyp gravity-well viz (fiction).",
      theia: "First Theia soft-land — Hyp giant-impact world (deep-time fiction).",
      phaeton: "First Phaeton soft-land — Hyp shattered rubble (fiction).",
      counterearth: "First Counter-Earth soft-land — Hyp antipode (fiction). Not Earth.",
      counterluna: "First Counter-Luna soft-land — Hyp twin moon (fiction). Not the Moon.",
      ice: "First ice-world soft-land — cold light.",
      rock: "First rock soft-land — craters and silence.",
      gas: "First cloud-deck soft-land — playable fiction, labeled.",
      deck: "First craft/deck soft-land — human trace in the dark.",
      starman: "Reached Starman Roadster replica — educational chrome.",
      haze: "First haze-world soft-land.",
    };
    toast("✦ " + (labels[cls] || "New soft-land · " + name));
  }
  window.addEventListener("vesper:walk", (ev) => {
    onWalk(ev.detail && ev.detail.body);
  });
  window.VesperMilestones = { seen: () => Object.assign({}, seen), onWalk: onWalk };
})();
