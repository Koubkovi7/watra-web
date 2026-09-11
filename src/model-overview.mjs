import {modeIcon} from './mode-icons.mjs';

const text=(l,cs,en)=>l==='cs'?cs:en;
const modelDescriptions={
 irikon:{
  cs:'Saunová kamna na dřevo s přípravou na elektřinu. Později je můžete rozšířit na hybridní IRIKON +e.',
  en:'Wood-fired sauna heater prepared for electric heating. An upgrade to the hybrid IRIKON +e can be added later.'
 },
 'irikon-e':{
  cs:'Dřevo, elektřina nebo oba zdroje pro rychlejší nahřátí. S kompatibilním regulátorem spustíte elektrický ohřev i na dálku.',
  en:'Wood, electricity, or both for a faster warm-up. Start electric heating remotely with a compatible controller.'
 }
};
// Prices and approximate warm-up times supplied by Richard; no inferred installation data.
export const modelData=[
 {id:'irikon',name:'IRIKON',image:'modelWoodFire',price:49950,modes:[{type:'wood',power:11,minutes:90}]},
 {id:'irikon-e',name:'IRIKON +e',image:'modelHybridGlow',price:69000,modes:[{type:'wood',power:11,minutes:90},{type:'electric',power:9,minutes:60},{type:'combined',power:20,minutes:35}]}
];
const names=(l,type)=>({wood:text(l,'Dřevo','Wood'),electric:text(l,'Elektřina','Electricity'),combined:text(l,'Kombinace','Combined')})[type];
const name=m=>m.id==='irikon-e'?'<span class="model-name">IRIKON <span class="model-suffix">+e</span></span>':'IRIKON';
const url=(l,m)=>'/'+l+'/'+(l==='cs'?'modely':'models')+'/'+m.id+'/';
const price=(l,m)=>new Intl.NumberFormat(l==='cs'?'cs-CZ':'en-GB').format(m.price)+(l==='cs'?' Kč':' CZK');
const icon=type=>type==='combined'?'<span class="range-combined-icons" aria-hidden="true">'+modeIcon('wood')+modeIcon('electric')+'</span>':modeIcon(type);
export const warmupNote=l=>text(l,'* Časy nahřátí jsou orientační. Závisí na velikosti a izolaci sauny, výchozí a požadované teplotě i podmínkách provozu.','* Warm-up times are approximate. They depend on sauna size and insulation, starting and target temperatures, and operating conditions.');

export function modelCards(l){
 const rows=m=>m.modes.map(mode=>'<tr'+(mode.type==='combined'?' class="range-combined"':'')+'><th scope="row"><span class="range-mode"><span class="range-mode-icon" aria-hidden="true">'+icon(mode.type)+'</span>'+names(l,mode.type)+'</span></th><td>'+mode.power+' <span>kW</span></td><td>'+mode.minutes+' <span>min</span></td></tr>').join('');
 return '<div class="range-grid">'+modelData.map(m=>'<article class="range-card"><a class="range-photo" href="'+url(l,m)+'" aria-label="'+text(l,'Prohlédnout model ','Explore ')+m.name+'"><img src="/media/'+m.image+'-960.webp" srcset="/media/'+m.image+'-480.webp 480w, /media/'+m.image+'-960.webp 960w, /media/'+m.image+'-1600.webp 1600w" sizes="(max-width: 700px) calc(100vw - 40px), (max-width: 1392px) calc((100vw - 160px) / 2), 616px" width="1600" height="1067" alt="'+m.name+' — '+text(l,'vizualizace provozu','illustration of the heater in use')+'" loading="lazy" decoding="async"></a><div class="range-card-body"><div class="range-card-heading"><div><p class="range-type">'+text(l,m.id==='irikon'?'Kamna na dřevo':'Hybridní saunová kamna',m.id==='irikon'?'Wood-fired sauna heater':'Hybrid sauna heater')+'</p><h3><a href="'+url(l,m)+'">'+name(m)+'</a></h3></div><p class="range-price"><strong>'+price(l,m)+'</strong><span>'+text(l,'vč. DPH','incl. VAT')+'</span></p></div><p class="range-description">'+modelDescriptions[m.id][l]+'</p><table class="range-metrics" aria-describedby="range-warmup-note"><caption class="sr-only">'+text(l,'Provozní režimy ','Operating modes for ')+m.name+'</caption><thead><tr><th scope="col">'+text(l,'Režim','Mode')+'</th><th scope="col">'+text(l,'Výkon','Output')+'</th><th scope="col">'+text(l,'Nahřátí*','Warm-up*')+'</th></tr></thead><tbody>'+rows(m)+'</tbody></table><p class="range-time-note">'+text(l,'* Orientační doba nahřátí.','* Approximate warm-up time.')+'</p><a class="button outline range-detail" href="'+url(l,m)+'">'+text(l,'Prohlédnout ','Explore ')+name(m)+'</a></div></article>').join('')+'</div><div class="range-notes"><p id="range-warmup-note">'+warmupNote(l)+'</p><p>'+text(l,'Kombinovaný výkon 20 kW znamená součet 11 kW ze dřeva a 9 kW z elektřiny při společném nahřívání. Po dosažení nastavené teploty regulátor elektrickou část vypne.','The combined 20 kW output is the sum of 11 kW from wood and 9 kW from electricity during joint warm-up. At the set temperature, the controller switches off the electric elements.')+'</p><p>'+text(l,'Fotografie zobrazují ilustrační vizualizaci provozu. Konfiguraci a rozsah dodávky potvrdíme při konzultaci.','Images illustrate the heaters in operation. We will confirm the configuration and what is included during your consultation.')+'</p></div>';
}

export function modelCollection(l){
 return '<section class="collection wrap range-collection" id="kolekce"><div class="range-heading"><div><p class="eyebrow">'+text(l,'Kolekce IRIKON','The IRIKON collection')+'</p><h2>'+text(l,'Jedna WATRA.<br><em>Dvě cesty k teplu.</em>','One WATRA.<br><em>Two ways to warmth.</em>')+'</h2></div><a class="text-link" href="/'+l+'/'+(l==='cs'?'modely/':'models/')+'">'+text(l,'Porovnat modely','Compare models')+'</a></div>'+modelCards(l)+'</section>';
}

export function modelComparison(l,{collapsible=false}={}){
 const t=(cs,en)=>text(l,cs,en), both=value=>[value,value], no=t('Není součástí','Not included');
 const modeValues=(type,property,unit)=>modelData.map(m=>{
  const mode=m.modes.find(mode=>mode.type===type);
  return mode?mode[property]+' '+unit:t('Není k dispozici','Not available');
 });
 const rows=[
  [t('Cena vč. DPH','Price incl. VAT'),...modelData.map(m=>price(l,m))],
  [t('Zdroj tepla','Heat source'),t('Dřevo','Wood'),t('Dřevo + elektřina','Wood + electricity')],
  [t('Výkon na dřevo','Wood-fired output'),...modeValues('wood','power','kW')],
  [t('Elektrický výkon','Electric output'),...modeValues('electric','power','kW')],
  [t('Společný ohřev','Combined warm-up'),...modeValues('combined','power','kW')],
  [t('Nahřátí dřevem*','Wood-fired warm-up*'),...modeValues('wood','minutes','min')],
  [t('Nahřátí elektřinou*','Electric warm-up*'),...modeValues('electric','minutes','min')],
  [t('Nahřátí kombinovaně*','Combined warm-up*'),...modeValues('combined','minutes','min')],
  [t('Účinnost spalovací části','Wood-burning efficiency'),...both('80 %')],
  [t('Elektrická část','Electric heating'),t('Příprava na rozšíření','Prepared for an upgrade'),'3 × 3 kW'],
  [t('Regulace elektrické části','Electric control'),no,t('Externí regulátor','External controller')],
  [t('Stav produktu','Product status'),...both(t('Certifikace probíhá','Certification in progress'))]
 ];
 const table='<div class="range-comparison-scroll" role="region" aria-label="'+t('Srovnání modelů','Model comparison')+'" tabindex="0"><table class="range-comparison-table"><caption class="sr-only">'+t('Porovnání IRIKON a IRIKON +e','IRIKON and IRIKON +e comparison')+'</caption><thead><tr><th scope="col">'+t('Parametr','Parameter')+'</th>'+modelData.map(m=>'<th scope="col">'+name(m)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(([label,a,b])=>'<tr><th scope="row">'+label+'</th><td>'+a+'</td><td>'+b+'</td></tr>').join('')+'</tbody></table></div><div class="range-notes"><p>'+warmupNote(l)+'</p><p>'+t('Po dosažení nastavené teploty regulátor vypne elektrická tělesa; dřevo může dál hořet. Konečnou konfiguraci a rozsah dodávky potvrdíme při konzultaci.','At the set temperature, the controller switches off the electric elements; wood can continue to burn. We will confirm the final configuration and what is included during your consultation.')+'</p></div>';
 if(collapsible)return '<section class="wrap range-comparison" id="porovnani"><details class="range-comparison-disclosure"><summary><span><span class="range-comparison-title">'+t('Porovnat modely','Compare models')+'</span><span class="range-comparison-subtitle">'+t('Parametry IRIKON a IRIKON +e vedle sebe.','IRIKON and IRIKON +e specifications side by side.')+'</span></span><span class="range-comparison-toggle" aria-hidden="true"></span></summary>'+table+'</details></section>';
 return '<section class="section wrap border-top range-comparison"><div class="section-head"><div><p class="eyebrow">'+t('Srovnání','Comparison')+'</p><h2>'+t('Vyberte si<br><em>svůj způsob tepla.</em>','Choose<br><em>your source of heat.</em>')+'</h2></div></div>'+table+'</section>';
}
