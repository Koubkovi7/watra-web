const flame='<path d="M16 3c1 6-6 8-6 14a6 6 0 0 0 12 0c0-3-2-6-4-8 0 3-2 4-2 4s2-6 0-10Z"/>';
const bolt='<path d="m18 3-10 14h7l-1 12 10-15h-7l1-11Z"/>';
const hybrid='<path d="M11 4c1 5-6 8-6 13a6 6 0 0 0 10 4M11 4c4 4 7 8 6 12"/><path d="m24 8-9 12h6l-1 9 9-13h-6l1-8Z"/>';
export const modeIcon=type=>'<svg class="mode-icon" viewBox="0 0 32 32" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+({wood:flame,electric:bolt,hybrid}[type])+'</svg>';
export const modeLabels=(l,e)=>'<div class="mode-labels">'+(e?['wood','electric','hybrid']:['wood']).map(type=>'<span class="mode-label">'+modeIcon(type)+'<span>'+({wood:l==='cs'?'Dřevo':'Wood',electric:l==='cs'?'Elektřina':'Electricity',hybrid:l==='cs'?'Hybrid':'Hybrid'}[type])+'</span></span>').join('')+'</div>';
