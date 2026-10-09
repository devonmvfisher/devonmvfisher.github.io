// Engine is a real local ES module; classic Vesper plugins keep their order.
import THREE from '../vendor/three.module.mjs';
globalThis.THREE = THREE;
const files = ['js/vesper-polish-core.js', 'js/vesper-opening.js', 'js/vesper-deep-sky.js', 'js/vesper-proc-paint.js', 'js/vesper-proc-textures.js', 'js/vesper-perf.js', 'js/vesper-messages.js', 'js/vesper-travel.js', 'js/vesper-input.js', 'js/main.js', 'js/vesper-layers.js', 'js/vesper-radio.js', 'js/vesper-tours.js', 'js/vesper-hypothetics.js', 'js/vesper-catalog.js', 'js/vesper-surfaces.js', 'js/vesper-science.js', 'js/vesper-walk-fx.js', 'js/vesper-walk-audio.js', 'js/vesper-physics-hud.js', 'js/vesper-hope.js', 'js/vesper-transfer.js', 'js/vesper-integrity.js', 'js/vesper-milestones.js', 'js/vesper-notebook.js', 'js/vesper-body-notes.js', 'js/vesper-companion-brain.js', 'js/vesper-ship.js', 'js/vesper-life.js', 'js/vesper-places.js', 'js/vesper-suit.js', 'js/agent-overlay.js', 'js/vesper-polish-ui.js'];
try {
  await Promise.all(files.map(src => new Promise((resolve,reject)=>{
    const script=document.createElement('script');script.src=src;script.async=false;
    script.onload=resolve;script.onerror=()=>reject(new Error('Could not load '+src));
    document.body.appendChild(script);
  })));
} catch(error) {
  const message=document.querySelector('.loader-sub');
  if(message)message.textContent='A local file could not load. Keep the app folder together, then reload.';
  document.getElementById('loader')?.classList.add('graphics-failed');
  console.error(error);
}
