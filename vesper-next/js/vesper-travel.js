/* Travel categories are shared by the initial list and bodies registered later. */
(function (root) {
  "use strict";
  const labels = ["Sun and planets", "Moons", "Dwarfs and small bodies", "Places", "Hyp"];
  const planets = ["Sun", "Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"];
  const moons = ["Moon", "Phobos", "Deimos", "Io", "Europa", "Ganymede", "Callisto", "Mimas", "Enceladus", "Tethys", "Dione", "Rhea", "Titan", "Hyperion", "Iapetus", "Phoebe", "Miranda", "Ariel", "Umbriel", "Titania", "Oberon", "Triton", "Proteus", "Nereid", "Charon", "Dysnomia", "Namaka", "Hiʻiaka", "Weywot", "Dactyl", "Himalia", "Janus", "Epimetheus", "Larissa"];
  function category(name, body) {
    const hyp = root.VesperHypothetics && root.VesperHypothetics.names && root.VesperHypothetics.names();
    if (body && body.hypothetic || hyp && hyp.includes(name)) return labels[4];
    if (planets.includes(name)) return labels[0];
    if (moons.includes(name)) return labels[1];
    if (body && (body.observation || body.place) || /station|lounge|hub|habitat|roadster|iss|voyager|horizons|pioneer|beacon|city|port|dock|pad|outpost/i.test(name)) return labels[3];
    return labels[2];
  }
  function groups(select) {
    labels.forEach(function (label) {
      if (!Array.from(select.children).some(function (child) { return child.tagName === "OPTGROUP" && child.label === label; })) {
        const group = document.createElement("optgroup"); group.label = label; select.appendChild(group);
      }
    });
  }
  function append(select, option, body) {
    groups(select);
    const label = category(option.value, body);
    const group = Array.from(select.children).find(function (child) { return child.tagName === "OPTGROUP" && child.label === label; });
    group.appendChild(option);
    if (label === labels[0]) {
      Array.from(group.children).sort(function (a, b) { return planets.indexOf(a.value) - planets.indexOf(b.value); }).forEach(function (child) { group.appendChild(child); });
    }
  }
  function regroup(select, bodies) {
    groups(select);
    Array.from(select.options).filter(function (option) { return option.value && option.value !== "Home"; }).forEach(function (option) {
      const body = bodies && bodies.find(function (candidate) { return candidate.name === option.value; });
      append(select, option, body);
    });
  }
  root.VesperTravel = { labels: labels, category: category, append: append, regroup: regroup };
  if (typeof module === "object" && module.exports) module.exports = root.VesperTravel;
})(globalThis);
