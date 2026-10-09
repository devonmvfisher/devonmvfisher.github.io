/* Progressive hints never intercept an action; existing input remains canonical. */
(function(){'use strict';
 const core=window.VesperPolishCore,known=core.createHints();let timer,focusReturn;
 const phrases={'btn-more':'Flight settings','btn-hide-hud':'Hide controls','btn-cinema-hud':'Enter cinema view','btn-tour-go':'Start tour','btn-tour-stop':'Stop tour','btn-help':'All controls','btn-reset':'Return to Earth','btn-straight':'Show real bodies only','btn-boost':'Boost','btn-thrust-up':'Move up','btn-thrust-down':'Move down','btn-soft-land':'Land nearby','btn-pause':'Pause flight and orbits','btn-build':'Build a structure','help-close':'Close controls','hud-restore':'Show controls'};
 const host=document.createElement('div');host.id='control-hint';host.setAttribute('role','status');host.setAttribute('aria-live','polite');host.hidden=true;document.body.appendChild(host);
 function description(el){const key=el.id;if(key==='btn-pause')return /Resume/.test(el.textContent)?'Resume flight and orbits':'Pause flight and orbits';return phrases[key]||el.getAttribute('aria-label')||el.title||el.textContent.trim()||(el.dataset.quality?'Set quality: '+el.dataset.quality:el.dataset.gear?'Set speed: '+el.dataset.gear:'');}
 function show(el,used=false){const text=description(el);if(!text)return;const id=el.id||text;known.show(id,text);if(used)known.use(id);clearTimeout(timer);host.textContent=text;host.hidden=false;host.classList.remove('used');if(used)timer=setTimeout(()=>host.classList.add('used'),1400);}
 function enhance(root){const elements=[];if(root.matches?.('button'))elements.push(root);elements.push(...root.querySelectorAll('button'));
  for(const el of elements){const text=description(el);if(!text)continue;el.setAttribute('aria-label',text);if(!el.title)el.title=text;el.dataset.controlHint=text;
   if(!/[A-Za-z]/.test(el.textContent)&&!el.querySelector('input'))el.textContent=text;
  }
 }
 enhance(document.body);
 const observer=new MutationObserver(changes=>{for(const record of changes)for(const node of record.addedNodes)if(node.nodeType===1)enhance(node);});
 observer.observe(document.body,{subtree:true,childList:true});
 document.addEventListener('pointerover',e=>{const el=e.target.closest('button,select,input');if(el&&!el.contains(e.relatedTarget))show(el);});
 document.addEventListener('focusin',e=>{const el=e.target.closest('button,select,input');if(el){window.VesperInput?.release();show(el);}});
 document.addEventListener('click',e=>{const el=e.target.closest('button');if(el)show(el,true);});
 document.addEventListener('change',e=>{if(e.target.matches('select,input'))show(e.target,true);});
 const legend=document.createElement('div');legend.id='flight-hints';legend.setAttribute('aria-label','Getting started');
 const touch=window.matchMedia('(pointer: coarse)').matches;
 for(const [id,text] of [['move',touch?'Left stick · move':'W A S D · move'],['look','Drag the sky · look'],['travel','Travel · choose a world']]){const item=document.createElement('span');item.dataset.hint=id;item.textContent=text;legend.appendChild(item);}
 document.body.appendChild(legend);
 function mark(id){known.use(id);const el=legend.querySelector('[data-hint="'+id+'"]');if(el)el.classList.add('used');}
 window.addEventListener('keydown',e=>{
  const input=window.VesperInput;if(!input||input.typing(e.target)||input.modified(e))return;
  for(const row of input.list())if(input.triggered(row.action,e)){known.use(row.action);host.textContent=core.describe(row);host.hidden=false;host.classList.remove('used');clearTimeout(timer);timer=setTimeout(()=>host.classList.add('used'),1400);if(['forward','back','left','right','up','down'].includes(row.action))mark('move');}
 });
 let drag=null;
 document.addEventListener('pointerdown',e=>{if(e.target.closest('#canvas-wrap'))drag={id:e.pointerId,x:e.clientX,y:e.clientY};if(e.target.closest('#stick-base'))mark('move');const button=e.target.closest('button');if(button)show(button,true);},true);
 document.addEventListener('pointermove',e=>{if(drag&&e.pointerId===drag.id&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>8){mark('look');drag=null;}});
 document.addEventListener('pointerup',()=>{drag=null;});document.addEventListener('pointercancel',()=>{drag=null;});
 document.getElementById('travel-select').addEventListener('change',()=>mark('travel'));
 const help=document.getElementById('help-panel');help.setAttribute('aria-modal','true');
 document.addEventListener('keydown',e=>{
  if(e.key!=='Tab'||help.getAttribute('aria-hidden')==='true')return;
  const items=[...help.querySelectorAll('button,input,select,a[href]')].filter(el=>!el.disabled&&el.getBoundingClientRect().width>0);
  if(!items.length)return;const first=items[0],last=items.at(-1);
  if(!help.contains(document.activeElement)||(e.shiftKey&&document.activeElement===first)||(!e.shiftKey&&document.activeElement===last)){e.preventDefault();core.focusStep(items,document.activeElement,e.shiftKey)?.focus();}
 });
 // Help remains reachable when the secondary settings are collapsed.
 const helpButton=document.getElementById('btn-help'),quickHelp=helpButton.cloneNode(true);quickHelp.id='help-quick';quickHelp.textContent='Controls';quickHelp.addEventListener('click',()=>helpButton.click());document.querySelector('.primary-row').appendChild(quickHelp);
 const about=document.querySelector('.brand-hint');if(about)about.textContent='A field guide to the Solar System';
 const dock=document.querySelector('#hud .panel.compact');let dockHeight=0;
 function sizeDock(){const value=Math.ceil(dock.getBoundingClientRect().height);if(value!==dockHeight){dockHeight=value;document.documentElement.style.setProperty('--dock-height',value+'px');}}
 if(window.ResizeObserver)new ResizeObserver(sizeDock).observe(dock);else window.addEventListener('resize',sizeDock);
 sizeDock();
 window.VesperPolishUI={known,hints:()=>core.hints(window.VesperInput.list()),description};
})();
