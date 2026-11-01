import {readFile} from 'node:fs/promises';
const config=JSON.parse(await readFile('site.config.json','utf8'));
const mode=process.env.WATRA_SITE_MODE || config.siteMode || 'full';
if(mode==='teaser'){const {buildTeaser}=await import('./build-teaser.mjs');await buildTeaser(config);}
else if(mode==='full') await import('./build-full.mjs');
else throw Error('Invalid site mode: '+mode);
