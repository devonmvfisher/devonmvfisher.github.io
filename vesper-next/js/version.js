/* One public build version, also read by the service worker. */
(function (root) {
  "use strict";
  // Local polish builds load current files directly; no stale service-worker cache.
  root.VesperOfflineCache = false;
  root.VesperVersion = "0.38.0-next.1";
  if (typeof module === "object" && module.exports) module.exports = root.VesperVersion;
})(globalThis);
