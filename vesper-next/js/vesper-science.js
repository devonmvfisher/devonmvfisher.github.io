/**
 * Vesper science almanac — astronomer/student-facing facts (SI + display notes).
 * Sol-honest; hypothetics stay labeled elsewhere.
 */
(function () {
  "use strict";

  /** Mean orbital elements / physical data (approx IAU / NASA fact sheets). */
  const ALMANAC = {
    Sun: { type: "star", R_km: 695700, Teff_K: 5772, note: "G2V. Soft-skim only in Vesper." },
    Mercury: { type: "planet", a_au: 0.387, P_d: 87.97, R_km: 2439.7, rot_h: 1407.6, moons: 0, g: 3.7, vesc: 4.25 },
    Venus: { type: "planet", a_au: 0.723, P_d: 224.7, R_km: 6051.8, rot_h: -5832.6, moons: 0, g: 8.87, vesc: 10.36, note: "Retrograde rotation." },
    Earth: { type: "planet", a_au: 1.0, P_d: 365.256, R_km: 6371.0, rot_h: 23.934, moons: 1, g: 9.81, vesc: 11.2 },
    Moon: { type: "moon", a_km: 384400, P_d: 27.322, R_km: 1737.4, parent: "Earth", g: 1.62, vesc: 2.38, note: "Sidereal orbit and rotation both ≈ 27.3 d. Tidally locked. Not a 24 h spin." },
    Mars: { type: "planet", a_au: 1.524, P_d: 686.98, R_km: 3389.5, rot_h: 24.623, moons: 2, g: 3.71, vesc: 5.03 },
    Phobos: { type: "moon", parent: "Mars", R_km: 11.3, g: 0.0057, vesc: 0.011, note: "Doomed spiral-in; Stickney crater dominates." },
    Deimos: { type: "moon", parent: "Mars", R_km: 6.2, g: 0.003, vesc: 0.0056, note: "Smaller outer Mars moon." },
    Jupiter: { type: "planet", a_au: 5.203, P_d: 4332.6, R_km: 69911, rot_h: 9.925, moons: "95+", g: 24.79, vesc: 59.5, note: "Cloud-deck walk is display fiction." },
    Io: { type: "moon", parent: "Jupiter", P_d: 1.769, R_km: 1821.6, g: 1.796, vesc: 2.56, note: "Most volcanic; Laplace resonance with Europa/Ganymede. Tidally locked." },
    Europa: { type: "moon", parent: "Jupiter", P_d: 3.551, R_km: 1560.8, g: 1.31, vesc: 2.03, note: "Ice shell / subsurface ocean candidate. Tidally locked." },
    Ganymede: { type: "moon", parent: "Jupiter", P_d: 7.155, R_km: 2634.1, g: 1.428, vesc: 2.74, note: "Largest moon in Sol; intrinsic magnetic field; grooved terrain. Tidally locked." },
    Callisto: { type: "moon", parent: "Jupiter", P_d: 16.69, R_km: 2410.3, g: 1.235, vesc: 2.44, note: "Most cratered Galilean; ancient dark surface. Tidally locked." },
    Saturn: { type: "planet", a_au: 9.537, P_d: 10759, R_km: 58232, rot_h: 10.656, moons: "140+", g: 10.44, vesc: 35.5, note: "Ring system; cloud-deck walk is display fiction." },
    Titan: { type: "moon", parent: "Saturn", P_d: 15.945, R_km: 2574.7, g: 1.35, vesc: 2.64, note: "Thick N₂ atmosphere; lakes. Tidally locked." },
    Enceladus: { type: "moon", parent: "Saturn", R_km: 252.1, g: 0.113, vesc: 0.24, note: "South-pole plumes." },
    Uranus: { type: "planet", a_au: 19.19, P_d: 30687, R_km: 25362, rot_h: -17.24, g: 8.69, vesc: 21.3, note: "Extreme axial tilt (~98°); faint rings. Cloud-deck walk is display fiction." },
    Neptune: { type: "planet", a_au: 30.07, P_d: 60190, R_km: 24622, rot_h: 16.11, g: 11.15, vesc: 23.5, note: "Fastest winds in Sol; Adams ring arcs. Cloud-deck walk is display fiction." },
    Triton: { type: "moon", parent: "Neptune", P_d: 5.877, R_km: 1353.4, g: 0.779, vesc: 1.46, note: "Retrograde capture; cantaloupe terrain + N₂ frost. Locked, retrograde." },
    Pluto: { type: "dwarf", a_au: 39.48, P_d: 90560, R_km: 1188.3, g: 0.62, vesc: 1.21, note: "Binary with Charon; Tombaugh Regio heart + tholins." },
    Charon: { type: "moon", parent: "Pluto", P_d: 6.387, R_km: 606, g: 0.288, vesc: 0.59, note: "Tidally locked binary partner. Mutual orbit ≈ 6.4 d." },
    Nix: { type: "moon", parent: "Pluto", R_km: 18, note: "Orbits Pluto in ≈24.85 d. Spin is chaotic, not tidally locked; New Horizons saw ~43.9 h retrograde." },
    Ceres: { type: "dwarf", a_au: 2.77, R_km: 476.2, g: 0.28, vesc: 0.51, note: "Largest belt object; Occator bright salt deposits." },
    Vesta: { type: "asteroid", a_au: 2.36, R_km: 262.7, g: 0.25, vesc: 0.36, note: "Rheasilvia impact basin; differentiated protoplanet." },
    "Starman Roadster": {
      type: "manmade",
      a_au: "1.0–1.7 (ecc ≈ 0.26 display)",
      P_d: "557 (heliocentric)",
      note: "2018 Falcon Heavy demo payload educational replica — not affiliated with Tesla/SpaceX.",
    },
    ISS: { type: "manmade", alt_km: 420, note: "Display near Earth; not to scale." },
    Tiangong: { type: "manmade", note: "CSS core + modules display near Earth." },
    Hubble: { type: "manmade", note: "LEO observatory silhouette (display)." },
    "Luna Gateway": { type: "manmade", note: "Planned lunar-orbit station concept (display)." },
    JWST: { type: "manmade", note: "Sun–Earth L2 display. The dot sits outside the Moon." },
    Perseverance: { type: "manmade", note: "Mars 2020 rover — display proxy." },
    Ingenuity: { type: "manmade", note: "Mars helicopter — memorial display." },
    "Apollo 11 Site": { type: "manmade", note: "Educational Mare Tranquillitatis marker." },
    Sedna: { type: "tno", a_au: 506, R_km: 500, g: 0.37, vesc: 0.5, note: "Extreme eccentric TNO (perihelion ~76 AU); deep red tholins; display AU compressed." },
    Halley: { type: "comet", P_y: 75.3, R_km: 5.5, g: 0.0004, vesc: 0.002, note: "1P/Halley — dirty-snow nucleus; display orbit." },
    Psyche: { type: "asteroid", a_au: 2.92, R_km: 110, g: 0.144, vesc: 0.18, note: "M-type metal-rich target; NASA Psyche mission." },
    Mimas: { type: "moon", parent: "Saturn", R_km: 198.2, g: 0.064, vesc: 0.16, note: "Herschel crater ~130 km — about a third of the moon." },
    Rhea: { type: "moon", parent: "Saturn", R_km: 763.8, g: 0.264, vesc: 0.64, note: "Second-largest Saturn moon; heavily cratered ice." },
    Iapetus: { type: "moon", parent: "Saturn", R_km: 734.5, g: 0.223, vesc: 0.57, note: "Two-tone albedo (Cassini Regio / bright ice) + equatorial ridge." },
    Dione: { type: "moon", parent: "Saturn", R_km: 561.4, g: 0.232, vesc: 0.51, note: "Wispy bright fractures (tectonic ice cliffs)." },
    Tethys: { type: "moon", parent: "Saturn", R_km: 531.1, g: 0.146, vesc: 0.39, note: "Odysseus crater; Ithaca Chasma canyon." },
    Proteus: { type: "moon", parent: "Neptune", R_km: 210, g: 0.07, vesc: 0.17, note: "Irregular dark; second to Triton among Neptune moons." },
    Nereid: { type: "moon", parent: "Neptune", R_km: 170, g: 0.07, vesc: 0.15, note: "Highly eccentric; capture leftover candidate. Spin ≈ 11.6 h — not locked to the ~360 d orbit." },
    Miranda: { type: "moon", parent: "Uranus", R_km: 235.8, g: 0.079, vesc: 0.19, note: "Coronae + Verona Rupes — tallest known cliff in Sol." },
    Titania: { type: "moon", parent: "Uranus", R_km: 788.9, g: 0.38, vesc: 0.77, note: "Largest Uranian moon; fault canyons." },
    Oberon: { type: "moon", parent: "Uranus", R_km: 761.4, g: 0.35, vesc: 0.73, note: "Dark cratered ice; outermost major Uranian." },
    Amalthea: { type: "moon", parent: "Jupiter", R_km: 83.5, g: 0.02, vesc: 0.058, note: "Red irregular potato; intense radiation belt." },
    Himalia: { type: "moon", parent: "Jupiter", R_km: 85, g: 0.062, vesc: 0.1, note: "Largest irregular Jovian; prograde capture group. Spin ≈ 7.78 h — not tidally locked." },
    Phoebe: { type: "moon", parent: "Saturn", R_km: 106.5, g: 0.049, vesc: 0.1, note: "Retrograde irregular capture; dark organic-rich. Spin ≈ 9.27 h — not locked to the ~550 d orbit." },
    Haumea: { type: "dwarf", a_au: 43.1, R_km: 780, g: 0.63, vesc: 0.91, note: "Rapid rotator; elongated; ring + moons Hiʻiaka/Namaka." },
    "Hiʻiaka": { type: "moon", parent: "Haumea", R_km: 160, g: 0.02, vesc: 0.08, note: "Largest Haumea moon; bright water-ice spectrum." },
    Namaka: { type: "moon", parent: "Haumea", R_km: 85, g: 0.01, vesc: 0.04, note: "Smaller inner Haumea moon; inclined eccentric orbit." },
    Eris: { type: "dwarf", a_au: 67.9, R_km: 1163, g: 0.82, vesc: 1.38, note: "Massive Kuiper dwarf; Dysnomia moon." },
    Dysnomia: { type: "moon", parent: "Eris", R_km: 350, g: 0.1, vesc: 0.25, note: "Eris's moon; darker than Eris; mass from mutual orbit." },
    Makemake: { type: "dwarf", a_au: 45.8, R_km: 715, g: 0.5, vesc: 0.85, note: "Bright red TNO; thin CH₄ atmosphere candidate." },
    Ariel: { type: "moon", parent: "Uranus", R_km: 578.9, g: 0.27, vesc: 0.56, note: "Youngest-looking Uranian surface; fault valleys." },
    Umbriel: { type: "moon", parent: "Uranus", R_km: 584.7, g: 0.23, vesc: 0.52, note: "Darkest major Uranian moon." },
    Quaoar: { type: "tno", a_au: 43.7, R_km: 555, g: 0.3, vesc: 0.55, note: "Ringed TNO; Weywot moon." },
    Gonggong: { type: "tno", a_au: 67.5, R_km: 615, g: 0.3, vesc: 0.62, note: "Red eccentric TNO; Xiangliu is not in this sky; display AU compressed." },
    Orcus: { type: "tno", a_au: 39.2, R_km: 450, g: 0.27, vesc: 0.5, note: "Bright-ice plutino; Vanth is not in this sky; antithesis of Pluto tholins." },
    Varuna: { type: "tno", a_au: 42.7, R_km: 334, g: 0.14, vesc: 0.3, note: "Elongated classical KBO; rapid rotator candidate." },
    Pallas: { type: "asteroid", a_au: 2.77, R_km: 256, g: 0.18, vesc: 0.32, note: "B-type; high inclination (~35°); third-largest belt." },
    Eros: { type: "asteroid", a_au: 1.46, R_km: 8.4, g: 0.0059, vesc: 0.01, note: "NEA; NEAR Shoemaker soft-landed 2001; elongated." },
    Ida: { type: "asteroid", a_au: 2.86, R_km: 15.7, g: 0.01, vesc: 0.02, note: "Koronis family; first asteroid known with a moon (Dactyl)." },
    Dactyl: { type: "moon", parent: "Ida", R_km: 0.7, g: 0.00005, vesc: 0.0001, note: "First discovered asteroid moon (Galileo 1993)." },
    Hyperion: { type: "moon", parent: "Saturn", R_km: 135, g: 0.02, vesc: 0.07, note: "Chaotic rotator; spongy low-density ice (~0.5 g/cm³)." },
    Janus: { type: "moon", parent: "Saturn", R_km: 89.5, g: 0.016, vesc: 0.05, note: "Co-orbital with Epimetheus. This sky gives each its own circle, outside the rings." },
    Epimetheus: { type: "moon", parent: "Saturn", R_km: 58.1, g: 0.009, vesc: 0.03, note: "Co-orbital with Janus. This sky keeps the two disks apart." },
    Larissa: { type: "moon", parent: "Neptune", R_km: 97, g: 0.03, vesc: 0.08, note: "Inner regular moon of Neptune; Voyager 2 flyby. Not a captured irregular." },
    Weywot: { type: "moon", parent: "Quaoar", R_km: 85, g: 0.02, vesc: 0.05, note: "Quaoar's moon." },
    Ixion: { type: "tno", a_au: 39.6, R_km: 355, g: 0.2, vesc: 0.4, note: "Dark red plutino; tholin-rich." },
    Salacia: { type: "tno", a_au: 42.2, R_km: 423, g: 0.18, vesc: 0.4, note: "Large classical KBO; Actaea is not in this sky." },
    Encke: { type: "comet", P_y: 3.3, R_km: 2.4, g: 0.0002, vesc: 0.001, note: "2P/Encke — shortest-period numbered comet; display orbit." },
        "Voyager 1": { type: "manmade", note: "Farthest spacecraft; display AU compressed." },
    "Voyager 2": { type: "manmade", note: "Grand Tour; display AU compressed." },
    "New Horizons": { type: "manmade", note: "Pluto / Arrokoth flybys. Display AU compressed, sunward of the Voyager dots." },
    "Parker Solar Probe": { type: "manmade", note: "Closest solar approach mission." },
    Rosetta: { type: "manmade", note: "67P/Churyumov–Gerasimenko orbiter." },
    "OSIRIS-REx": { type: "manmade", note: "Bennu sample return." },
    Lucy: { type: "manmade", note: "Jupiter Trojan flyby mission." },
    DAWN: { type: "manmade", note: "Ended in orbit at Ceres after mapping Vesta. Display sits at Ceres." },
  };

  function fact(name) {
    const a = ALMANAC[name];
    if (!a) return "";
    const bits = [];
    if (a.type) bits.push(a.type);
    if (a.type === "moon" && a.parent) bits.push("orbits " + a.parent + " — not the Sun");
    if (a.a_au != null && a.type !== "moon") bits.push("orbits Sol · a ≈ " + a.a_au + " AU");
    if (a.type === "moon" && a.P_d != null) {
      bits.push("sidereal orbit ≈ " + a.P_d + " d");
      if (a.note && /chaotic/i.test(a.note)) bits.push("spin chaotic — not 24 h and not locked");
      else bits.push("rotation = that orbit (tidally locked, not a 24 h spin)");
    } else if (a.P_d != null) bits.push("P ≈ " + a.P_d + " d");
    if (a.R_km != null) bits.push("R ≈ " + a.R_km + " km");
    if (name === "Earth" && a.rot_h != null) bits.push("sidereal rotation ≈ " + a.rot_h + " h");
    else if (a.type !== "moon" && a.rot_h != null) {
      const back = a.rot_h < 0;
      const said = back && a.note && /retrograde/i.test(a.note);
      bits.push("rot ≈ " + Math.abs(a.rot_h) + " h" + (back && !said ? " · retrograde" : ""));
    }
    if (a.g != null) bits.push("g ≈ " + a.g + " m/s²");
    if (a.vesc != null) bits.push("v_esc ≈ " + a.vesc + " km/s");
    if (a.note) bits.push(a.note);
    return bits.join(" · ");
  }

  function enrichBlurb(name, base) {
    const f = fact(name);
    if (!f) return base || "";
    if (!base) return f;
    if (base.indexOf(String(ALMANAC[name] && ALMANAC[name].R_km)) >= 0) return base;
    return base + " — " + f;
  }

  function boot() {
    const s = window.VesperSky;
    if (!s || s._sciencePatched) return;
    const orig = s.getBlurb && s.getBlurb.bind(s);
    s.getBlurb = (name) => enrichBlurb(name, orig ? orig(name) : "");
    s.getAlmanac = (name) => (name ? ALMANAC[name] || null : Object.assign({}, ALMANAC));
    s._sciencePatched = true;
  }

  window.VesperScience = { ALMANAC: ALMANAC, fact: fact, enrichBlurb: enrichBlurb };
  window.addEventListener("vesper:ready", boot);
  if (document.readyState !== "loading") setTimeout(boot, 100);
})();
