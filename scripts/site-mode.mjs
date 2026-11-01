import {readFile,writeFile} from 'node:fs/promises';
const mode=process.argv[2];
if(!['full','teaser'].includes(mode)) throw Error('Use: node scripts/site-mode.mjs full|teaser');
const config=JSON.parse(await readFile('site.config.json','utf8'));
config.siteMode=mode;
await writeFile('site.config.json',JSON.stringify(config,null,2)+'\n');
console.log('Site mode set to '+mode+'. Run the build, then publish this configuration change.');
