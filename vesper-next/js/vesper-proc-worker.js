/* Paint one original job per message; transfer its arrays without copying. */
importScripts("vesper-proc-paint.js");
self.onmessage = function (event) {
  const request = event.data;
  try {
    const result = self.VesperProcPaint.paint(request.options);
    self.postMessage(Object.assign({ key: request.key }, result), [result.color.buffer, result.normal.buffer]);
  } catch (_) {
    self.postMessage({ key: request.key, error: true });
  }
};
