import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const code=await readFile('public/loading.js','utf8');
function node(){
  return {attributes:{},children:[],events:new Map(),complete:false,
    getAttribute(k){return this.attributes[k]??null;},setAttribute(k,v){this.attributes[k]=v;},removeAttribute(k){delete this.attributes[k];},
    append(child){this.children.push(child);child.parent=this;},
    remove(){if(this.parent)this.parent.children=this.parent.children.filter(n=>n!==this);},
    addEventListener(k,f){if(!this.events.has(k))this.events.set(k,new Set());this.events.get(k).add(f);},
    removeEventListener(k,f){this.events.get(k)?.delete(f);},
    fire(k){for(const fn of [...this.events.get(k)||[]])fn();}
  };
}
function setup(){
  const timers=new Map();let next=0;
  const context={window:{},document:{createElement:node},WeakMap,Math,setTimeout:fn=>{timers.set(++next,fn);return next;},clearTimeout:id=>timers.delete(id)};
  vm.runInNewContext(code,context);
  return {loader:context.window.WatraLoading,tick:()=>{for(const [id,fn] of [...timers]){timers.delete(id);fn();}}};
}
test('fast completion never displays a loader or leaves a busy region',()=>{
  const {loader,tick}=setup(),container=node(),stop=loader.start(container);
  assert.equal(container.getAttribute('aria-busy'),'true');
  stop();tick();assert.equal(container.children.length,0);assert.equal(container.getAttribute('aria-busy'),null);
});
test('overlapping requests keep the loader until both finish',()=>{
  const {loader,tick}=setup(),container=node(),first=loader.start(container),second=loader.start(container);
  tick();assert.equal(container.children.length,1);
  first();first();assert.equal(container.children.length,1);
  second();assert.equal(container.children.length,0);assert.equal(container.getAttribute('aria-busy'),null);
});
test('image failures remove the indicator and pending event handlers',()=>{
  const {loader,tick}=setup(),container=node(),photo=node();
  loader.image(photo,'/photo.webp',{container});tick();assert.equal(container.children.length,1);
  photo.fire('error');assert.equal(container.children.length,0);assert.equal(photo.events.get('load').size,0);
});
test('a new gallery choice retires the earlier load indicator',()=>{
  const {loader,tick}=setup(),container=node(),photo=node();
  loader.image(photo,'/first.webp',{container});tick();
  loader.image(photo,'/second.webp',{container});tick();assert.equal(container.children.length,1);
  assert.equal(photo.events.get('load').size,1);assert.equal(photo.src,'/second.webp');
  photo.fire('load');assert.equal(container.children.length,0);
});
