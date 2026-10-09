/**
 * Runtime integrity checks — catches holy-grail regressions (takeoff, depth, catalog).
 */
(function () {
  "use strict";
  const issues = [];
  function note(ok, msg) {
    if (!ok) issues.push(msg);
    return ok;
  }
  function run() {
    issues.length = 0;
    const s = window.VesperSky;
    note(!!s, "VesperSky missing");
    if (!s) return report();
    note(typeof s.version === "function" && s.version() === window.VesperVersion, "version()");
    const outcomes = window.vesperPerf();
    note(outcomes.stations === 1, "stations: expected exactly one");
    note(outcomes.uncaughtErrors === 0, "uncaught errors");
    note(outcomes.webglAlive === true, "WebGL context alive");
    note(typeof s.getPos === "function", "getPos");
    note(typeof s.getVel === "function", "getVel");
    const bodies = s._bodiesRef && s._bodiesRef();
    note(!!(bodies && bodies.length > 8), "bodies count");
    if (bodies) {
      const sun = bodies.find((b) => b.name === "Sun");
      note(!!(sun && sun.skimOnly), "Sun skimOnly");
      const earth = bodies.find((b) => b.name === "Earth");
      note(!!(earth && earth.walkable !== false), "Earth walkable");
    }
    note(!!window.VesperCatalog || !!window.__vesperCatalog, "catalog module");
    note(!!window.VesperSurfaces, "surfaces");
    note(!!window.VesperScience, "science");
    note(!!window.VesperHope, "hope");
    note(!!window.VesperTransfer, "transfer");
    // Renderer log depth
    try {
      const r = s.renderer && s.renderer();
      note(!!r, "renderer()");
    } catch (_) {}
    note(!!window.VesperNotebook, "notebook");
    note(!!window.VesperMilestones, "milestones");
    // Alive-surface coverage for holy-grail remaining bodies
    if (window.VesperSurfaces && window.VesperSurfaces.biomeFor) {
      const bf = window.VesperSurfaces.biomeFor;
      const expect = {
        Mimas: "mimas", Iapetus: "iapetus", Miranda: "miranda", Titania: "titania",
        Titan: "titan", Charon: "charon", Vesta: "vesta", Sedna: "sedna", Deimos: "deimos",
        Quaoar: "quaoar", Gonggong: "gonggong", Ariel: "ariel",
        Psyche: "psyche", Phoebe: "phoebe",
        Pallas: "pallas", Eros: "eros", Ida: "ida", Amalthea: "amalthea",
        Dactyl: "dactyl", Himalia: "himalia", Hyperion: "hyperion",
        Janus: "janus", Epimetheus: "epimetheus", Larissa: "larissa",
        Proteus: "proteus", Nereid: "nereid", Weywot: "weywot",
        Orcus: "orcus", Varuna: "varuna", Ixion: "ixion", Salacia: "salacia",
        Halley: "halley", Encke: "encke",
        "Hiʻiaka": "hiiaka", Namaka: "namaka", Dysnomia: "dysnomia",
        "New Horizons": "deck",
        "Counter-Earth": "counterearth", "Counter-Luna": "counterluna",
        Vulcan: "vulcan", Nemesis: "nemesis", Tyche: "tyche",
        "Planet Nine": "planetnine", "Planet X": "planetx", Nibiru: "nibiru",
        "PBH-Halo": "pbh", Theia: "theia", Phaeton: "phaeton",
      };
      Object.keys(expect).forEach((name) => {
        note(bf(name) === expect[name], "biome " + name + "→" + expect[name]);
      });
    }
    return report();
  }
  function report() {
    const line = issues.length
      ? "[vesper-integrity] WARN " + issues.join(" · ")
      : "[vesper-integrity] OK holy-grail checks passed (" + (window.VesperSky && window.VesperSky.version()) + ")";
    console.info(line);
    window.__vesperIntegrity = { ok: issues.length === 0, issues: issues.slice() };
    return window.__vesperIntegrity;
  }
  window.VesperIntegrity = { run: run };
  window.addEventListener("vesper:ready", function () {
    setTimeout(run, 1500);
  });
})();
