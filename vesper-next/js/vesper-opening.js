/* Small opening state machine; DOM is attached only in a browser. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.VesperOpening=api;})(globalThis,function(){
 'use strict';
 function progress(value){return Number.isFinite(value)?Math.max(0,Math.min(1,value)):0;}
 function transition(state,event){
  if(!['loading','ready','failed'].includes(state))throw TypeError('Unknown opening state');
  if(event==='failure')return 'failed';
  if(state==='failed')return state;
  if(event==='frame')return 'ready';
  return state;
 }
 function ease(value){const x=progress(value);return 1-Math.pow(1-x,3);}
 return {progress,transition,ease};
});
