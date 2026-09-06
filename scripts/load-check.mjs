import {writeFile} from 'node:fs/promises';
const count=1000,parallel=50,paths=['/cs/','/en/','/cs/modely/irikon-e/','/cs/kontakt/','/style.css','/app.js','/media/hero-960.webp'];
const times=[];let current=0,failed=0,bytes=0;
const start=performance.now();
await Promise.all(Array.from({length:parallel},async()=>{
  while(current<count){
    const n=current++,at=performance.now();
    try {const r=await fetch('http://localhost:3010'+paths[n%paths.length]);if(!r.ok)failed++;bytes+=(await r.arrayBuffer()).byteLength;} catch {failed++;}
    times.push(performance.now()-at);
  }
}));
times.sort((a,b)=>a-b);
const result={scope:'Local static server only; not a test of concurrent visitors or external services',requests:count,parallel,failed,elapsedMs:Math.round(performance.now()-start),p95Ms:Math.round(times[Math.floor(times.length*.95)]),bytes};
console.log(JSON.stringify(result,null,2));
await writeFile('LOCAL-LOAD-CHECK.json',JSON.stringify(result,null,2)+'\n');
if(failed)process.exitCode=1;
