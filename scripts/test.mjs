import {spawnSync} from 'node:child_process';
import {readFile,readdir} from 'node:fs/promises';
const config=JSON.parse(await readFile('site.config.json','utf8'));
const configured=process.env.WATRA_SITE_MODE || config.siteMode || 'full';
function run(args,mode){
  const result=spawnSync(process.execPath,args,{stdio:'inherit',env:{...process.env,WATRA_SITE_MODE:mode}});
  if(result.error) throw result.error;
  if(result.status!==0) process.exit(result.status || 1);
}
run(['scripts/build.mjs'],'full');
const tests=(await readdir('tests')).filter(name=>name.endsWith('.test.mjs')).map(name=>'tests/'+name);
run(['--test',...tests],'full');
run(['scripts/build.mjs'],'teaser');
run(['--test','tests/teaser-build.test.mjs'],'teaser');
if(configured!=='teaser') run(['scripts/build.mjs'],configured);
console.log('Verified both site modes. Final output matches '+configured+' configuration.');
