(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.VesperPolishCore=api;})(globalThis,function(){
 'use strict';
 const keys={Space:'Space',ArrowUp:'↑',ArrowDown:'↓',ArrowLeft:'←',ArrowRight:'→',BracketLeft:'[',BracketRight:']',Comma:',',Period:'.',Slash:'/',ShiftLeft:'Shift',ShiftRight:'Shift',Escape:'Esc'};
 function keyName(code){return keys[code]||String(code).replace(/^Key|^Digit/,'');}
 function describe(row){return row.label+' · '+(row.codes.length?[...new Set(row.codes.map(keyName))].join(' / '):'Set a key in Help');}
 function hints(rows){return rows.map(row=>({action:row.action,text:describe(row),contexts:[...row.contexts]}));}
 function createHints(){const seen=new Set();let current=null;
  return {show(id,text){if(!id||!text)return null;current={id,text,used:seen.has(id)};return {...current};},
   use(id){seen.add(id);if(current?.id===id)current.used=true;return seen.size;},
   has:id=>seen.has(id),current:()=>current?{...current}:null,reset(){seen.clear();current=null;}};
 }
 function focusStep(ids,current,backward=false){if(!ids.length)return null;const i=ids.indexOf(current);if(i<0)return backward?ids.at(-1):ids[0];return ids[(i+(backward?-1:1)+ids.length)%ids.length];}
 function setText(node,value){if(!node)return false;const text=String(value);if(node.textContent===text)return false;node.textContent=text;return true;}
 function setValue(node,key,value){if(!node||node[key]===value)return false;node[key]=value;return true;}
 function record(cache,key){if(Object.hasOwn(cache,key)&&cache[key]&&typeof cache[key]==='object')return cache[key];const value={};Object.defineProperty(cache,key,{value,writable:true,enumerable:true,configurable:true});return value;}
 return {keyName,describe,hints,createHints,focusStep,setText,setValue,record};
});
