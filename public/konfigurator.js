/* WATRA · konfigurátor sauny (náhled Ace IT, 11/2026)
   Mini verze plánovače Bydlíčko: rozměry sauny → kamna IRIKON / IRIKON +e, lavice, dveře, okno →
   kontrola, jestli se kamna vejdou (bezpečné odstupy), objem sauny, kolik lidí se vejde, 3D: z dálky, projít se (WASD), sednout si.
   Vše v cm. Půdorys: x zleva doprava (0…W), y od dveřní stěny (0) dozadu (D). 3D: X = x − W/2, Z = D/2 − y, Y nahoru. */
(() => {
'use strict';
// jazyk podle stránky (<html lang>): čeština (výchozí), nebo angličtina — tr('česky', 'English')
const EN = /^en/i.test(document.documentElement.lang || ''), tr = (cs, en) => EN ? en : cs, LOC = EN ? 'en-GB' : 'cs-CZ';

/* ---------- Data WATRA: co je doložené a co je zatím orientační ----------
   Rozměry kamen: prospekt IRIKON 11/2026 + rozměrový výkres (předaný 26. 10. 2026).
   Odstupy a doporučený objem WATRA stanoví až po certifikaci → do té doby ORIENTAČNÍ hodnoty (viz ZDROJE dole),
   v rozhraní vždy označené. Jedno místo, kde se mění: WATRA_DATA. */
const WATRA_DATA = window.WATRA_DATA || {
  body: {w: 43, d: 43.5, h: 91.5, frontD: 13.3, frontW: 25, frontH: 52, flueD: 11.5, flueFromBack: 18.1, massStove: 50, massStones: 100, log: 33},
  models: {
      wood: {name: 'IRIKON', short: 'IRIKON', fuel: tr('Dřevo', 'Wood'), kw: tr('11 kW na dřevo', '11 kW wood-fired'), price: tr('49 950 Kč', '49,950 CZK'), electric: false},
      e: {name: 'IRIKON +e', short: 'IRIKON +e', fuel: tr('Dřevo + elektřina', 'Wood + electricity'), kw: tr('11 kW dřevo · 9 kW elektřina', '11 kW wood · 9 kW electric'), price: tr('59 000 Kč', '59,000 CZK'), electric: true},
  },
  // Bezpečné odstupy od hořlavých materiálů (cm). status: 'orientační' = obvyklé hodnoty trhu, ne údaj WATRA.
  // Zdroj (research 16. 11. 2026, manuály výrobců): boky 10–50, záda 10–50, předek 30–100, strop 100–130 cm; kamna s košem
  // plným kamenů (Harvia Legend 150, HUUM HIVE Wood 13, IKI) boky 19–20 / záda 25 / předek 50–90 / strop 100–120.
  // 16. 11. 2026 Říša: odstup od stěn „cca 16 cm“, tepelné štíty (volitelné příslušenství) ho zkrátí na polovinu.
  // Předek a strop dál obvyklé hodnoty trhu, dokud WATRA nedodá vlastní.
    clear: {side: 16, back: 16, front: 50, ceiling: 120, service: 100, shield: .5, status: tr('předběžné', 'preliminary'), note: tr('Odstup od stěn předběžně podle WATRA, potvrdí ho certifikace.', 'Preliminary WATRA wall clearance, to be confirmed by certification.')},
  // Doporučený objem sauny (m³). Analogie: HUUM HIVE Wood 13 (13 kW) 6–13 m³, Harvia Legend 150 6–13 m³, IKI Mini 5–12 m³.
    vol: {min: 6, max: 13, status: tr('orientační', 'indicative'), note: tr('Obvyklý rozsah kamen na dřevo s kamenným košem podobné velikosti. WATRA ho upřesní po certifikaci.', 'Typical range for wood-fired heaters with a stone cage of similar size. WATRA will refine it after certification.')},
  elPerM3: 1,      // samotná elektřina: obvykle 1 kW na 1 m³ výpočtového objemu (HUUM, sauna.cz)
  // Přirážka k objemu za každý m² skla nebo neizolované zděné/kamenné stěny (Harvia: +1,2 m³ za m²; HUUM +1).
  glassAdd: 1.2,
  minH: 200,       // výrobci uvádějí výšku sauny 2,0–2,3 m (Harvia 2,1–2,3, HUUM min. 1,9)
  seatW: 60,       // místo na sezení na osobu (cm)
  lieL: 190,       // délka lavice na ležení (cm)
};
const D_ = WATRA_DATA, B = D_.body;
// Tepelný štít (Říša 16. 11., CAD díl TEPELNY_STIT ~437 × 831 mm) = plech na BOKU kamen, 1 000 Kč/ks: zkrátí odstup toho boku
// od stěny na polovinu. Zadní stěna, lavice a předek mají plný odstup.
const clr = () => ({...D_.clear, sideFull: D_.clear.side});
const sideClr = has => has ? Math.round(D_.clear.side * D_.clear.shield) : D_.clear.side;

/* ---------- pomůcky ---------- */
const $ = (s, el = document) => el.querySelector(s), $$ = (s, el = document) => [...el.querySelectorAll(s)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const nf1 = new Intl.NumberFormat(LOC, {maximumFractionDigits: 1, minimumFractionDigits: 1});
const nf0 = new Intl.NumberFormat(LOC, {maximumFractionDigits: 0});
const fm3 = v => nf1.format(v) + ' m³', fcm = v => nf0.format(Math.round(v)) + ' cm';
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const WALL_CZ = EN ? {left: 'left', right: 'right', back: 'back', front: 'by the door'} : {left: 'vlevo', right: 'vpravo', back: 'vzadu', front: 'u dveří'};

/* ---------- stav (sdílí se v adrese za #) ---------- */
const DEF = {w: 230, d: 210, h: 215, m: 'e', sw: 'left', sp: 25, ub: 1, ul: 0, ur: 0, lb: 1, ll: 0, lr: 0, dw: 'front', dp: 75, dg: 1, win: 'none', ww: 'right', mw: 'wood', fx: 'both', ppl: 0, sh: 0, rot: 0};
const S = {...DEF};
function readHash() {
  const q = new URLSearchParams(location.hash.slice(1));
  // starší odkazy: bb/bl/br = lavice u stěn, lv = 1 jen horní, 2 horní i dolní
  if (['bb', 'bl', 'br', 'lv'].some(k => q.has(k))) {
    const on = k => q.has(k) ? (+q.get(k) || 0) : (k === 'bb' ? 1 : 0), two = q.has('lv') ? (+q.get('lv') || 0) !== 1 : true;
    S.ub = on('bb'); S.ul = on('bl'); S.ur = on('br');
    S.lb = two ? S.ub : 0; S.ll = two ? S.ul : 0; S.lr = two ? S.ur : 0;
  }
  for (const k of Object.keys(DEF)) if (q.has(k)) { const v = q.get(k); S[k] = typeof DEF[k] === 'number' ? (+v || 0) : v; }
  S.w = clamp(S.w, 120, 400); S.d = clamp(S.d, 120, 400); S.h = clamp(S.h, 180, 260);
  if (!D_.models[S.m]) S.m = 'e';
  S.rot = ((Math.round(S.rot) % 4) + 4) % 4; S.sh = clamp(Math.round(S.sh), 0, 3);
  // odkaz je vstup zvenčí: neznámá hodnota (překlep, podvržený odkaz) = výchozí, jinak by konfigurátor spadl
  for (const k in HASH_ENUM) if (!HASH_ENUM[k].includes(S[k])) S[k] = DEF[k];
  S.sp = clamp(Math.round(S.sp), 0, 100); S.dp = clamp(Math.round(S.dp), 0, 100);
  for (const k of ['ub', 'ul', 'ur', 'lb', 'll', 'lr', 'dg', 'ppl']) S[k] = S[k] ? 1 : 0;
}
const WALLS4 = ['left', 'back', 'right', 'front'];
const HASH_ENUM = {sw: WALLS4, dw: WALLS4, ww: WALLS4, win: ['none', 'small', 'big', 'wall'], mw: ['wood', 'masonry'], fx: ['wood', 'el', 'both']};
let hashT = 0;
function writeHash() {
  clearTimeout(hashT);
  hashT = setTimeout(() => {
    const q = new URLSearchParams();
    for (const k of Object.keys(DEF)) if (S[k] !== DEF[k]) q.set(k, S[k]);
    history.replaceState(null, '', location.pathname + location.search + (q.toString() ? '#' + q : ''));
  }, 250);
}

/* ---------- geometrie v půdorysu ---------- */
const wallLen = w => (w === 'left' || w === 'right') ? S.d : S.w;
// bod na stěně: u = vzdálenost podél stěny, n = kolik dovnitř místnosti
function wallPt(wall, u, n) {
  switch (wall) {
    case 'left': return {x: n, y: u};
    case 'right': return {x: S.w - n, y: u};
    case 'back': return {x: u, y: S.d - n};
    default: return {x: u, y: n};  // front
  }
}
// obdélník v souřadnicích stěny (u0..u1 podél, n0..n1 dovnitř) → obdélník v půdorysu
function wallRect(wall, u0, u1, n0, n1) {
  const a = wallPt(wall, u0, n0), b = wallPt(wall, u1, n1);
  return {x0: Math.min(a.x, b.x), x1: Math.max(a.x, b.x), y0: Math.min(a.y, b.y), y1: Math.max(a.y, b.y)};
}
const inter = (a, b, m = 0) => a.x0 < b.x1 - m && a.x1 > b.x0 + m && a.y0 < b.y1 - m && a.y1 > b.y0 + m;
const area = r => Math.max(0, r.x1 - r.x0) * Math.max(0, r.y1 - r.y0);

function layout() {
  const C = clr(), L = {benches: [], checks: [], warn: 0, bad: 0};
  // lavice: horní a dolní patro zvlášť na každé stěně (vzadu / vlevo / vpravo; ke stěně s kamny ne). Dolní stojí před horní
  // na stejné stěně, jinak sama u stěny (Říša 16. 11.: horní jen vzadu, dolní do L). Rohy: horní zadní, horní boční, dolní zadní,
  // dolní boční; každá další lavice se zkrátí o místo, kde už jiná stojí.
  const hU = clamp(Math.round(S.h - 115), 80, 110), hL = Math.max(40, hU - 45), dU = 60, dLf = 45, dLw = 50;
  L.hU = hU; L.hL = hL;
  const hasB = (lvl, wall) => wall !== S.sw && !!S[(lvl === 'upper' ? 'u' : 'l') + wall[0]];
  const onWall = (wall, r) => wall === 'left' ? {u0: r.y0, u1: r.y1, n0: r.x0, n1: r.x1}
    : wall === 'right' ? {u0: r.y0, u1: r.y1, n0: S.w - r.x1, n1: S.w - r.x0} : {u0: r.x0, u1: r.x1, n0: S.d - r.y1, n1: S.d - r.y0};
  for (const lvl of ['upper', 'lower']) for (const wall of ['back', 'left', 'right']) {
    if (!hasB(lvl, wall)) continue;
    const len = wallLen(wall), above = lvl === 'lower' && hasB('upper', wall);
    const n0 = above ? dU : 0, dep = lvl === 'upper' ? dU : above ? dLf : dLw;
    let u0 = 0, u1 = len;
    for (const o of L.benches) {
      const q = onWall(wall, o);
      if (q.n1 <= n0 + .5 || q.n0 >= n0 + dep - .5 || q.u1 <= u0 + .5 || q.u0 >= u1 - .5) continue;  // nepřekrývá se
      if ((q.u0 + q.u1) / 2 < (u0 + u1) / 2) u0 = Math.max(u0, q.u1); else u1 = Math.min(u1, q.u0);
    }
    if (u1 - u0 < 60) continue;
    L.benches.push({wall, level: lvl, top: lvl === 'upper' ? hU : hL, ...wallRect(wall, u0, u1, n0, n0 + dep), len: u1 - u0, depth: dep, atWall: n0 === 0});
  }
  // kamna: stojí u stěny S.sw v poloze u, natočená o S.rot × 90° (0 = dvířky do místnosti). Vše se počítá v souřadnicích
  // kamen (lx = doprava z pohledu do dvířek, ly = dopředu od středu těla) a převádí do půdorysu.
  L.stove = stovePlace(C);
  // dveře a vstup
  const dLen = wallLen(S.dw), dW = 70, du = clamp(S.dp / 100 * dLen, dW / 2 + 5, dLen - dW / 2 - 5);
  L.door = {wall: S.dw, u0: du - dW / 2, u1: du + dW / 2, h: Math.min(190, S.h - 10), glass: !!S.dg, entry: wallRect(S.dw, du - dW / 2, du + dW / 2, 0, 55)};
  // okno
  const WIN = {none: null, small: {w: 50, h: 50, sill: 120}, big: {w: 120, h: 80, sill: 100}, wall: {w: 0, h: 0, sill: 30}};
  const wn = WIN[S.win];
  if (wn) {
    const wl = wallLen(S.ww);
    const ww = S.win === 'wall' ? wl - 40 : Math.min(wn.w, wl - 40), wh = S.win === 'wall' ? S.h - 60 : wn.h;
    L.win = {wall: S.ww, u0: (wl - ww) / 2, u1: (wl + ww) / 2, sill: wn.sill, h: wh};
    if (S.win === 'wall' && S.ww === S.dw) { L.win.u0 = 20; L.win.u1 = wl - 20; }
  }
  // objem
  const V = S.w * S.d * S.h / 1e6;
  let glass = 0;
  if (L.door.glass) glass += (L.door.u1 - L.door.u0) * L.door.h / 1e4;
  if (L.win) {
    let a = (L.win.u1 - L.win.u0) * L.win.h / 1e4;
    if (S.win === 'wall' && S.ww === S.dw) a = Math.max(0, a - (L.door.u1 - L.door.u0) * L.door.h / 1e4);
    glass += a;
  }
  let masonry = 0;
  if (S.mw === 'masonry') masonry = 2 * (S.w + S.d) * S.h / 1e4 - glass;  // neizolované zdivo: všechny stěny
  L.V = V; L.glass = glass; L.masonry = masonry; L.Veff = V + D_.glassAdd * (glass + masonry);
  // místa
  const up = L.benches.filter(b => b.level === 'upper');
  L.seats = up.reduce((s, b) => s + Math.floor(b.len / D_.seatW), 0) + L.benches.filter(b => b.level === 'lower').reduce((s, b) => s + Math.floor(b.len / D_.seatW), 0);
  L.seatsUp = up.reduce((s, b) => s + Math.floor(b.len / D_.seatW), 0);
  L.lie = up.filter(b => b.len >= D_.lieL).length;
  L.shields = shieldRects(L.stove, C);
  L.vents = ventsFor(L);
  checks(L);
  return L;
}

// natočení: dovnitř místnosti od stěny, pak po krocích 90° ve směru hodinových ručiček (v půdorysu, y dozadu = nahoru)
const INWARD = {left: {x: 1, y: 0}, right: {x: -1, y: 0}, back: {x: 0, y: -1}, front: {x: 0, y: 1}};
const cw = v => ({x: v.y, y: -v.x});
function stovePlace(C) {
  const wall = S.sw, len = wallLen(wall), nIn = INWARD[wall];
  let f = nIn; for (let i = 0; i < ((S.rot % 4) + 4) % 4; i++) f = cw(f);
  const r = cw(f), dot = (a, b) => a.x * b.x + a.y * b.y;
  const hw = B.w / 2, hd = B.d / 2, fD = B.frontD;
  // která strana kamen míří ke stěně: záda / předek / pravý bok / levý bok
  const toWall = {x: -nIn.x, y: -nIn.y};
  const facing = dot(f, toWall) > .5 ? 'front' : dot(f, toWall) < -.5 ? 'back' : dot(r, toWall) > .5 ? 'right' : 'left';
  const ext = {back: hd, front: hd + fD, right: hw, left: hw}[facing];
  // podél stěny: polovina rozměru kamen v tom směru (u natočení bokem je těleso + dvířka podél stěny)
  const along = facing === 'back' || facing === 'front' ? hw : hd + fD / 2;
  const u = clamp(S.sp / 100 * len, along, len - along);
  const place = (cL, cR, cK) => {
    const clrWall = {back: cK, front: C.front, right: cR, left: cL}[facing];
    const c0 = wallPt(wall, u, ext + clrWall), c = facing === 'front' || facing === 'back' ? c0 : {x: c0.x - f.x * fD / 2, y: c0.y - f.y * fD / 2};
    const P = (lx, ly) => ({x: c.x + lx * r.x + ly * f.x, y: c.y + lx * r.y + ly * f.y});
    const rect = (lx0, lx1, ly0, ly1) => { const a = P(lx0, ly0), b = P(lx1, ly1); return {x0: Math.min(a.x, b.x), x1: Math.max(a.x, b.x), y0: Math.min(a.y, b.y), y1: Math.max(a.y, b.y)}; };
    return {c, P, rect};
  };
  // štíty (CAD: díl TEPELNY_STIT 3× — dva boky a záda): n štítů na strany nejblíž ke stěně (měří se z polohy bez štítů),
  // při shodě záda dřív; předek (dvířka) nikdy
  const g0 = place(C.side, C.side, C.back), room = (p, d) => {  // vzdálenost bodu ke stěně místnosti ve směru d
    const t = [d.x > 0 ? (S.w - p.x) / d.x : d.x < 0 ? -p.x / d.x : Infinity, d.y > 0 ? (S.d - p.y) / d.y : d.y < 0 ? -p.y / d.y : Infinity];
    return Math.round(Math.min(...t));
  };
  const dist = {K: room(g0.P(0, -hd), {x: -f.x, y: -f.y}), L: room(g0.P(-hw, 0), {x: -r.x, y: -r.y}), R: room(g0.P(hw, 0), r)};
  const on = new Set(['K', 'L', 'R'].sort((a, b) => dist[a] - dist[b]).slice(0, clamp(S.sh || 0, 0, 3)));
  const shL = on.has('L'), shR = on.has('R'), shK = on.has('K');
  const cL = sideClr(shL), cR = sideClr(shR), cK = shK ? Math.round(C.back * C.shield) : C.back, {c, P, rect} = place(cL, cR, cK);
  // místo na přikládání 1 × 1 m před dvířky, posunuté podél kamen tak, aby zůstalo v místnosti, když to jde
  let sv = rect(-C.service / 2, C.service / 2, hd + fD, hd + fD + C.service);
  const shiftX = sv.x0 < 0 ? -sv.x0 : sv.x1 > S.w ? S.w - sv.x1 : 0, shiftY = sv.y0 < 0 ? -sv.y0 : sv.y1 > S.d ? S.d - sv.y1 : 0;
  if (Math.abs(r.x) > .5) sv = {...sv, x0: sv.x0 + shiftX, x1: sv.x1 + shiftX}; else sv = {...sv, y0: sv.y0 + shiftY, y1: sv.y1 + shiftY};
  const off = 1.5, t = 1.2, shields = [];
  if (shL) shields.push(rect(-hw - off - t, -hw - off, -hd + 1, hd - 1));
  if (shR) shields.push(rect(hw + off, hw + off + t, -hd + 1, hd - 1));
  if (shK) shields.push(rect(-hw + 1, hw - 1, -hd - off - t, -hd - off));
  return {
    wall, u, f, r, facing, rot: ((S.rot % 4) + 4) % 4, shL, shR, shK, cA: cL, cB: cR, cK, center: c, shields, service: sv,
    yaw: Math.atan2(f.x, -f.y),
    body: rect(-hw, hw, -hd, hd),
    front: rect(-B.frontW / 2, B.frontW / 2, hd, hd + fD),
    zone: rect(-hw - cL, hw + cR, -hd - cK, hd + fD + C.front),
    zoneSide: rect(-hw - cL, hw + cR, -hd - cK, hd + C.side),
    zoneBench: rect(-hw - C.sideFull, hw + C.sideFull, -hd - C.back, hd + fD + C.front),  // k lavici plný odstup
    flue: P(0, -hd + B.flueFromBack),
    firePt: P(0, hd + 60),
  };
}
// tepelné štíty jsou spočítané v stovePlace (plech na boku nebo za zády kamen, 1,5 cm od koše)
function shieldRects(st) { return st.shields || []; }

// větrání (Říša 16. 11.): umístí se samo podle kamen, zákazník s ním nehýbe.
// přívod vzduchu k hoření: na stěně za kamny v ose kamen, 30–40 cm nad podlahou; cirkulace: protější stěna ve výšce asi 60 cm,
// u dveří; větrání (uzavíratelné, při přetopení a po saunování): protější stěna, úhlopříčně od kamen u stropu.
const OPP = {left: 'right', right: 'left', back: 'front', front: 'back'};
function ventsFor(L) {
  const st = L.stove, opp = OPP[st.wall], oLen = wallLen(opp), d = L.door;
  const holes = w => [d.wall === w ? {u0: d.u0, u1: d.u1, z0: 0, z1: d.h} : null,
    L.win && L.win.wall === w ? {u0: L.win.u0, u1: L.win.u1, z0: L.win.sill, z1: L.win.sill + L.win.h} : null].filter(Boolean);
  const free = (wall, u, z, w, h) => {  // posune otvor podél stěny mimo dveře a okno
    const len = wallLen(wall), lo = w / 2 + 8, hi = len - w / 2 - 8;
    const hit = x => holes(wall).some(o => x + w / 2 > o.u0 - 5 && x - w / 2 < o.u1 + 5 && z + h / 2 > o.z0 && z - h / 2 < o.z1);
    u = clamp(u, lo, hi);
    if (!hit(u)) return u;
    const cand = holes(wall).flatMap(o => [o.u0 - w / 2 - 12, o.u1 + w / 2 + 12]).filter(x => x >= lo && x <= hi && !hit(x));
    return cand.length ? cand.sort((a, b) => Math.abs(a - u) - Math.abs(b - u))[0] : u;
  };
  const su = (st.wall === 'left' || st.wall === 'right') ? st.center.y : st.center.x;  // osa kamen podél jejich stěny
  let cu;  // cirkulace u dveří
  if (d.wall === opp) cu = d.u1 + 28 <= oLen - 16 ? d.u1 + 28 : d.u0 - 28;
  else {
    const dp = wallPt(d.wall, (d.u0 + d.u1) / 2, 0), e0 = wallPt(opp, 0, 0), e1 = wallPt(opp, oLen, 0);
    cu = Math.hypot(e0.x - dp.x, e0.y - dp.y) <= Math.hypot(e1.x - dp.x, e1.y - dp.y) ? 30 : oLen - 30;
  }
  const au = su < wallLen(st.wall) / 2 ? oLen - 30 : 30, ah = Math.max(150, S.h - 22);
  return [
        {kind: 'supply', wall: st.wall, u: free(st.wall, su, 35, 15, 10), z: 35, w: 15, h: 10, name: tr('přívod vzduchu k hoření (za kamny, 35 cm nad podlahou)', 'combustion air inlet (behind the heater, 35 cm above the floor)')},
        {kind: 'circ', wall: opp, u: free(opp, cu, 60, 15, 10), z: 60, w: 15, h: 10, name: tr('cirkulace vzduchu (protější stěna, 60 cm, u dveří)', 'air circulation vent (opposite wall, 60 cm, by the door)')},
        {kind: 'air', wall: opp, u: free(opp, au, ah, 20, 12), z: ah, w: 20, h: 12, name: tr('větrání, uzavíratelné (úhlopříčně od kamen u stropu)', 'closable ventilation vent (diagonally opposite the heater, near the ceiling)')},
  ];
}
// orientační odhad nahřátí (Říša 17. 11.: „budí to pocit, že je to nedosažitelné“): doba roste zhruba úměrně objemu pro kamna;
// dosažitelnost = ustálený přírůstek teploty při plném výkonu proti ztrátám (větrání 6× za hodinu, zateplené stěny U 0,35,
// jednoduché sklo U 5,5, nezateplené zdivo U 2 W/m²K). Typické předpoklady, ne měření.
function heatReach(L, kW) {
  const A = 2 * (S.w * S.d + S.w * S.h + S.d * S.h) / 1e4, gl = L.glass, ms = L.masonry;
  const loss = 0.335 * 6 * L.V + 0.35 * Math.max(0, A - gl - ms) + 5.5 * gl + 2 * ms;  // W/K
  const dT = kW * 1000 / loss;
  return {dT, ok: dT >= 85};
}
function checks(L) {
  const C = clr(), st = L.stove, room = {x0: 0, x1: S.w, y0: 0, y1: S.d}, out = [];
    const add = (lvl, title, text, zone = 0) => { out.push({lvl, title, text, zone: !!zone}); if (lvl === 'bad') L.bad++; if (lvl === 'warn') L.warn++; };
  // 1) vejdou se kamna i s odstupy od stěn
  const z = st.zone, short = [];
  if (z.x0 < -0.5 || z.x1 > S.w + .5 || z.y0 < -.5 || z.y1 > S.d + .5) {
    const lack = Math.round(Math.max(-z.x0, z.x1 - S.w, -z.y0, z.y1 - S.d));
    short.push(lack);
  }
  const bodyOut = st.body.x0 < 0 || st.body.x1 > S.w || st.body.y0 < 0 || st.body.y1 > S.d;
    if (bodyOut) add('bad', tr('Kamna se sem nevejdou', 'The heater does not fit here'), tr('Posuňte kamna nebo zvětšete saunu.', 'Move the heater or make the sauna bigger.'), 1);
  else if (short.length) {
    // vešla by se s tepelnými štíty?
        let tip = tr(' Posuňte kamna dál od rohu.', ' Move the heater away from the corner.');
    for (const n of [1, 2, 3]) {
      if (n <= S.sh) continue;
      const keep = S.sh; S.sh = n; const z2 = stovePlace(C).zone; S.sh = keep;
      if (z2.x0 >= -.5 && z2.x1 <= S.w + .5 && z2.y0 >= -.5 && z2.y1 <= S.d + .5) {
                tip = tr(` Pomůže posunout kamna dál od rohu, nebo ${n === 1 ? 'tepelný štít (1 000 Kč)' : `${n} tepelné štíty (${n} × 1 000 Kč)`}: strana se štítem stačí ${sideClr(true)} cm od stěny.`, ` Move the heater away from the corner, or add ${n === 1 ? 'a heat shield (CZK 1,000)' : `${n} heat shields (${n} × CZK 1,000)`}: a shielded side only needs ${sideClr(true)} cm to the wall.`);
        break;
      }
    }
        add('bad', tr('Málo místa kolem kamen', 'Not enough space around the heater'), tr(`K sousední stěně chybí asi ${fcm(short[0])} do bezpečného odstupu.${tip}`, `About ${fcm(short[0])} is missing to the safe distance from the nearby wall.${tip}`), 1);
  }
    else {
      const sides = st.cA === st.cB ? st.cA + ' cm' : Math.min(st.cA, st.cB) + tr(' a ', ' and ') + Math.max(st.cA, st.cB) + ' cm';
      add('ok', tr('Kamna se vejdou i s odstupy', 'The heater fits with its clearances'), tr(`Kolem kamen zůstane bezpečná zóna (${C.status} odstupy WATRA: boky ${sides}, za zády ${st.cK} cm, před dvířky ${C.front} cm${S.sh ? `; ${S.sh === 1 ? '1 štít' : S.sh + ' štíty'} za ${nf0.format(S.sh * 1000)} Kč` : ''}).`,
        `A safe zone stays around the heater (${C.status} WATRA clearances: sides ${sides}, back ${st.cK} cm, ${C.front} cm in front of the door${S.sh ? `; ${S.sh} shield${S.sh > 1 ? 's' : ''} for CZK ${nf0.format(S.sh * 1000)}` : ''}).`));
    }
  // 2) lavice mimo bezpečnou zónu
  const hit = L.benches.filter(b => inter(b, st.zoneBench, 1));  // k lavici plný odstup (štít je jen na stěně)
    if (L.benches.some(b => inter(b, st.body))) add('bad', tr('Kamna stojí v lavici', 'The heater stands in a bench'), tr('Dejte kamna na jinou stěnu nebo lavici zkraťte.', 'Put the heater on another wall or shorten the bench.'), 1);
    else if (hit.length) add('warn', tr('Lavice zasahuje do zóny kamen', 'A bench reaches into the heater zone'), tr(`${hit[0].level === 'upper' ? 'Horní' : 'Dolní'} lavice ${WALL_CZ[hit[0].wall]} je blíž, než je bezpečný odstup. Kamna posuňte, nebo u lavice počítejte se zábradlím / ochranou.`, `The ${hit[0].level === 'upper' ? 'upper' : 'lower'} bench (${WALL_CZ[hit[0].wall]}) is closer than the safe distance. Move the heater, or plan a guard rail next to the bench.`), 1);
    else if (L.benches.length) add('ok', tr('Lavice jsou mimo zónu kamen', 'The benches are outside the heater zone'), tr('Na lavici se kamen nedotknete.', 'You cannot touch the heater from a bench.'));
  // 3) vstup
  const ent = L.door.entry;
    if (inter(ent, st.body) || inter(ent, st.zoneSide, 1)) add('warn', tr('Kamna hned u dveří', 'Heater right by the door'), tr('Při vstupu byste šli kolem horkých kamen. Dejte je dál od dveří.', 'You would walk past the hot heater when entering. Move it further from the door.'), 1);
    else if (L.benches.some(b => inter(b, ent, 1))) add('warn', tr('Lavice brání ve vstupu', 'A bench blocks the entrance'), tr('Za dveřmi zůstaňte aspoň 55 cm volného místa.', 'Keep at least 55 cm of free space behind the door.'));
    else add('ok', tr('Ke dveřím je volno', 'The way to the door is clear'), tr('Za dveřmi zůstává volný prostor na vstup.', 'There is free space to walk in behind the door.'));
  // 4) přikládání: výrobci kamen na dřevo chtějí před dvířky volno asi 1 × 1 m (Harvia M3); šířka se může posunout podél stěny
  const service = st.service;
  L.service = service;
  const depthOk = service.x0 >= -.5 && service.x1 <= S.w + .5 && service.y0 >= -.5 && service.y1 <= S.d + .5;
    if (!depthOk || L.benches.some(b => inter(b, service, 1))) add('warn', tr('Málo místa na přikládání', 'Not enough space to load wood'), tr(`Před dvířky (polena ${B.log} cm) doporučují výrobci kamen na dřevo volno asi ${C.service} × ${C.service} cm. Teď tam ${depthOk ? 'zasahuje lavice' : 'chybí místo'}.`, `Wood-fired heater makers recommend about ${C.service} × ${C.service} cm of free space in front of the door (logs ${B.log} cm). Right now ${depthOk ? 'a bench is in the way' : 'there is not enough room'}.`), 1);
    else add('ok', tr('Je kde přikládat', 'Room to load wood'), tr(`Před dvířky zůstává volno ${C.service} × ${C.service} cm.`, `${C.service} × ${C.service} cm stays free in front of the door.`));
  // 5) strop
  const ceil = S.h - B.h;
    if (S.h < D_.minH) add('warn', tr('Nízký strop', 'Low ceiling'), tr(`Sauna nižší než ${D_.minH} cm se špatně prohřívá a nad horní lavicí chybí místo.`, `A sauna lower than ${D_.minH} cm heats up poorly and leaves too little headroom above the upper bench.`));
    if (ceil < C.ceiling) add('warn', tr('Strop blízko kamen', 'Ceiling close to the heater'), tr(`Nad kamny zbývá ${fcm(ceil)}, ${C.status} minimum je ${C.ceiling} cm.`, `${fcm(ceil)} remains above the heater; the ${C.status} minimum is ${C.ceiling} cm.`), 1);
    else add('ok', tr('Strop je dost vysoko', 'The ceiling is high enough'), tr(`Nad kamny zbývá ${fcm(ceil)} (kamna měří ${nf1.format(B.h)} cm).`, `${fcm(ceil)} remains above the heater (the heater is ${nf1.format(B.h)} cm tall).`));
  // 6) objem vs. výkon
  const v = D_.vol;
  if (v && v.min) {
        if (L.Veff < v.min) add('warn', tr('Na tak malou saunu je to hodně tepla', 'A lot of heat for such a small sauna'), tr(`Sauna má ${fm3(L.Veff)}, ${v.status} rozsah pro kamna této velikosti je ${nf0.format(v.min)}–${nf0.format(v.max)} m³. Probereme s vámi.`, `The sauna has ${fm3(L.Veff)}; the ${v.status} range for a heater of this size is ${nf0.format(v.min)}–${nf0.format(v.max)} m³. We will discuss it with you.`));
        else if (L.Veff > v.max) {
      const pct = Math.max(1, Math.round((L.Veff / v.max - 1) * 100)), hx = heatReach(L, 11), el = D_.models[S.m].electric;
      add(hx.ok && pct <= 25 ? 'info' : 'warn', tr('Větší sauna: nahřátí potrvá déle', 'Larger sauna: warming up takes longer'),
        tr(`Pro výběr kamen má sauna ${fm3(L.Veff)}, ${v.status} rozsah je ${nf0.format(v.min)}–${nf0.format(v.max)} m³. ${hx.ok ? `Kamna ji vytopí, jen nahřátí potrvá odhadem asi o ${pct} % déle než u sauny ${nf0.format(v.max)} m³ (doba roste zhruba úměrně objemu).` : 'Při takových ztrátách kamna nemusí udržet 80–90 °C. Pomůže zateplit stěny nebo zmenšit prosklení.'}${el ? ' S dřevem a elektřinou současně je nahřátí výrazně rychlejší.' : ''}`,
          `For heater sizing the sauna has ${fm3(L.Veff)}; the ${v.status} range is ${nf0.format(v.min)}–${nf0.format(v.max)} m³. ${hx.ok ? `The heater will heat it, warming up just takes roughly ${pct} % longer than in a ${nf0.format(v.max)} m³ sauna (the time grows roughly with the volume).` : 'With such heat losses the heater may not hold 80–90 °C. Insulating the walls or less glass will help.'}${el ? ' Using wood and electricity together makes warming up much faster.' : ''}`));
    }
        else add('ok', tr('Objem sedí', 'The volume fits'), tr(`${fm3(L.Veff)} je v ${v.status === 'orientační' ? 'orientačním ' : ''}rozsahu ${nf0.format(v.min)}–${nf0.format(v.max)} m³.`, `${fm3(L.Veff)} is within the ${v.status} range of ${nf0.format(v.min)}–${nf0.format(v.max)} m³.`));
  }
  // 7) samotná elektřina (IRIKON +e): obvykle 1 kW na 1 m³ výpočtového objemu
    if (D_.models[S.m].electric && D_.elPerM3 && L.Veff > 9 / D_.elPerM3) {
    const lim = 9 / D_.elPerM3, pct = Math.max(1, Math.round((L.Veff / lim - 1) * 100)), hx = heatReach(L, 9);
    add('info', tr('Samotná elektřina nahřívá pomaleji', 'Electricity alone warms up more slowly'),
      tr(`Elektřinou 9 kW se obvykle vytápí sauna do ${nf0.format(lim)} m³. ${hx.ok ? `Vaši saunu (${fm3(L.Veff)}) samotná elektřina nahřeje odhadem asi o ${pct} % pomaleji, udržet teplotu zvládne.` : `Vaši saunu (${fm3(L.Veff)}) samotná elektřina nemusí udržet na 80–90 °C, topte dřevem nebo oběma zdroji.`} Nejrychlejší je souběh dřeva a elektřiny: při měření prototypu ve stejné sauně 42 min proti 93 min jen elektřinou a 105 min jen dřevem.`,
        `9 kW of electricity usually heats a sauna up to ${nf0.format(lim)} m³. ${hx.ok ? `Electricity alone will warm your sauna (${fm3(L.Veff)}) roughly ${pct} % more slowly and can hold the temperature.` : `Electricity alone may not hold your sauna (${fm3(L.Veff)}) at 80–90 °C; heat with wood or both sources.`} Wood and electricity together are fastest: in the prototype test in the same sauna, 42 min versus 93 min with electricity only and 105 min with wood only.`));
  }
  // 8) větrání: umístěné samo
    if (L.vents && L.vents.length) add('ok', tr('Větrání je navržené', 'Ventilation is planned'), tr('Tři otvory podle kamen: ', 'Three vents placed by the heater: ') + L.vents.map(v => v.name).join(', ') + tr('. Umísťují se samy.', '. They are placed automatically.'));
  L.checks = out;
}

/* ---------- půdorys (SVG) ---------- */
const NS = 'http://www.w3.org/2000/svg';
function svgEl(tag, attrs, parent) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
let planSvg, planDrag = null, LAST = null;
function renderPlan(L) {
  const host = $('#wk-plan');
  if (!host) return;
  const M = 46, T = 10, W = S.w, Dd = S.d;
  if (!planSvg) {
        planSvg = svgEl('svg', {role: 'img', 'aria-label': tr('Půdorys sauny', 'Sauna floor plan')}, host);
    planSvg.addEventListener('pointerdown', planDown);
    planSvg.addEventListener('pointermove', planMove);
    addEventListener('pointerup', () => { if (planDrag) { const click = planDrag.moved < 5; planDrag = null; planSvg.classList.remove('drag'); if (click) selectStove('plan'); else placeRot(); } });
  }
  planSvg.setAttribute('viewBox', `${-M - 10} ${-M} ${W + 2 * M + 20} ${Dd + 2 * M + 10}`);
  planSvg.innerHTML = '';
  const Y = y => Dd - y;  // dveřní stěna dole
  const R = (r, a) => svgEl('rect', {x: r.x0, y: Y(r.y1), width: r.x1 - r.x0, height: r.y1 - r.y0, ...a}, planSvg);
  const defs = svgEl('defs', {}, planSvg);
  const pat = svgEl('pattern', {id: 'wk-wood', width: 9, height: 9, patternUnits: 'userSpaceOnUse'}, defs);
  svgEl('rect', {width: 9, height: 9, fill: '#c9a46a'}, pat); svgEl('line', {x1: 0, y1: 0, x2: 0, y2: 9, stroke: '#9c7a45', 'stroke-width': 1.2}, pat);
  const patH = svgEl('pattern', {id: 'wk-woodh', width: 9, height: 9, patternUnits: 'userSpaceOnUse'}, defs);
  svgEl('rect', {width: 9, height: 9, fill: '#c9a46a'}, patH); svgEl('line', {x1: 0, y1: 0, x2: 9, y2: 0, stroke: '#9c7a45', 'stroke-width': 1.2}, patH);
  // podlaha a stěny
  svgEl('rect', {x: 0, y: 0, width: W, height: Dd, class: 'pl-floor'}, planSvg);
  svgEl('rect', {x: -T, y: -T, width: W + 2 * T, height: Dd + 2 * T, class: 'pl-wall', fill: 'none', 'stroke-width': T * 2 - 1}, planSvg);
  // otvory: dveře a okno (přerušení zdi)
  const gap = (wall, u0, u1, cls) => {  // přerušení zdi (otvor)
    const a = wallPt(wall, u0, 0), b = wallPt(wall, u1, 0);
    if (wall === 'left' || wall === 'right') svgEl('rect', {x: wall === 'left' ? -2 * T : W, y: Y(Math.max(a.y, b.y)), width: 2 * T, height: Math.abs(b.y - a.y), class: cls}, planSvg);
    else svgEl('rect', {x: Math.min(a.x, b.x), y: wall === 'front' ? Dd : -2 * T, width: Math.abs(b.x - a.x), height: 2 * T, class: cls}, planSvg);
  };
  if (L.win) gap(L.win.wall, L.win.u0, L.win.u1, 'pl-win');
  gap(L.door.wall, L.door.u0, L.door.u1, 'pl-doorgap');
  // větrání: značka ve zdi (barva podle druhu, popis v legendě a v bublině)
  for (const v of L.vents || []) {
    gap(v.wall, v.u - v.w / 2, v.u + v.w / 2, 'pl-vent ' + v.kind);
    svgEl('title', {}, planSvg.lastChild).textContent = v.name[0].toUpperCase() + v.name.slice(1);
  }
  // dveře otvírané ven (u sauny vždy ven): oblouk venku
  {
    const d = L.door, w = d.u1 - d.u0, hinge = wallPt(d.wall, d.u0, 0), tip = wallPt(d.wall, d.u1, 0), outp = wallPt(d.wall, d.u0, -w);
    const hx = hinge.x, hy = Y(hinge.y), tx = tip.x, ty = Y(tip.y), ox = outp.x, oy = Y(outp.y);
    svgEl('line', {x1: hx, y1: hy, x2: ox, y2: oy, class: 'pl-door'}, planSvg);
    const cross = (ox - hx) * (ty - hy) - (oy - hy) * (tx - hx), sweep = cross > 0 ? 1 : 0;  // oblouk se středem v pantu
    svgEl('path', {d: `M${ox} ${oy} A${w} ${w} 0 0 ${sweep} ${tx} ${ty}`, class: 'pl-swing'}, planSvg);
    R(d.entry, {class: 'pl-entry'});
  }
  // lavice
  for (const b of L.benches) {
    const horiz = b.wall === 'back' || b.wall === 'front';
    R(b, {fill: `url(#${horiz ? 'wk-woodh' : 'wk-wood'})`, class: 'pl-bench ' + b.level, opacity: b.level === 'upper' ? 1 : .8});
  }
  // zóna kamen
  const st = L.stove, zBad = L.checks.some(c => c.lvl !== 'ok' && c.zone);
  if (L.service) R(L.service, {class: 'pl-service'});  // volno na přikládání (1 × 1 m)
  for (const r of L.shields || []) R(r, {class: 'pl-shield'});  // tepelné štíty
  R(st.zone, {class: 'pl-zone' + (zBad ? ' bad' : '')});
  // kamna
    const g = svgEl('g', {class: 'pl-stove', tabindex: 0, role: 'button', 'aria-label': tr('Kamna — přetáhněte je jinam, kliknutím je vyberete a šipkou otočíte', 'Heater: drag it elsewhere, click to select it and rotate it with the arrow')}, planSvg);
  const rr = (r, a) => svgEl('rect', {x: r.x0, y: Y(r.y1), width: r.x1 - r.x0, height: r.y1 - r.y0, ...a}, g);
  rr(st.body, {class: 'pl-body', rx: 4});
  rr(st.front, {class: 'pl-front', rx: 2});
  svgEl('circle', {cx: st.flue.x, cy: Y(st.flue.y), r: B.flueD / 2, class: 'pl-flue'}, g);
  // kóty
  const dim = (x1, y1, x2, y2, txt, side) => {
    svgEl('line', {x1, y1, x2, y2, class: 'pl-dim'}, planSvg);
    const t = svgEl('text', {x: (x1 + x2) / 2 + (side === 'v' ? -14 : 0), y: (y1 + y2) / 2 + (side === 'v' ? 4 : -7), class: 'pl-dimt', 'text-anchor': 'middle'}, planSvg);
    if (side === 'v') t.setAttribute('transform', `rotate(-90 ${(x1 + x2) / 2 - 14} ${(y1 + y2) / 2 + 4})`);
    t.textContent = txt;
  };
  dim(0, -T * 2 - 12, W, -T * 2 - 12, fcm(W));
  dim(-T * 2 - 12, 0, -T * 2 - 12, Dd, fcm(Dd), 'v');
  // popisky
  const lab = (x, y, t, cls) => { const e = svgEl('text', {x, y, class: cls || 'pl-lab', 'text-anchor': 'middle'}, planSvg); e.textContent = t; };
  lab(st.center.x, Y(st.center.y) + 4, D_.models[S.m].short, 'pl-stl');
  const upB = L.benches.find(b => b.level === 'upper');
  if (upB) {  // u boční lavice popisek podél ní
    const cx = (upB.x0 + upB.x1) / 2, cy = Y((upB.y0 + upB.y1) / 2), side = upB.wall === 'left' || upB.wall === 'right';
    const e = svgEl('text', {x: cx, y: cy + 4, class: 'pl-lab', 'text-anchor': 'middle'}, planSvg);
    if (side) e.setAttribute('transform', `rotate(-90 ${cx} ${cy})`);
        e.textContent = tr(`horní lavice ${nf0.format(upB.top)} cm`, `upper bench ${nf0.format(upB.top)} cm`);
  }
    { const d = L.door, p = wallPt(d.wall, (d.u0 + d.u1) / 2, d.wall === 'front' || d.wall === 'back' ? -2 * T - 16 : -2 * T - 26); lab(p.x, Y(p.y) + 4, tr('vstup', 'entrance'), 'pl-lab dim'); }
}
function planPoint(e) {
  const pt = planSvg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
  const p = pt.matrixTransform(planSvg.getScreenCTM().inverse());
  return {x: p.x, y: S.d - p.y};
}
function planDown(e) {
  if (!e.target.closest('.pl-stove')) { selectStove(null); return; }
  planDrag = {x: e.clientX, y: e.clientY, moved: 0}; planSvg.setPointerCapture(e.pointerId); e.preventDefault();
}
function planMove(e) {
  if (!planDrag) return;
  planDrag.moved = Math.max(planDrag.moved, Math.hypot(e.clientX - planDrag.x, e.clientY - planDrag.y));
  if (planDrag.moved < 5) return;  // klik (bez tažení) = výběr kamen, ne posun
  planSvg.classList.add('drag');
  const p = planPoint(e);
  // nejbližší stěna (kromě dveřní, pokud tam jsou dveře v cestě) a poloha podél ní
  const dist = {left: p.x, right: S.w - p.x, back: S.d - p.y, front: p.y};
  let wall = Object.keys(dist).sort((a, b) => dist[a] - dist[b])[0];
  const u = (wall === 'left' || wall === 'right') ? p.y : p.x;
  S.sw = wall; S.sp = clamp(Math.round(u / wallLen(wall) * 100), 0, 100);
  syncInputs(); update();
}

/* ---------- výběr kamen a otáčení o 90° (jako v CAD prohlížečích: klik na kamna → šipka, každý klik +90°, klávesa R) ---------- */
let SEL = null;  // null | 'plan' | '3d'
function selectStove(where) {
  SEL = where;
  if (planSvg) planSvg.classList.toggle('stove-sel', !!where);
  placeRot();
  if (where) hideHint();
}
function rotateStove() {
  S.rot = ((S.rot || 0) + 1) % 4;
  syncInputs(); update();
    toast(tr(`Kamna otočená o ${S.rot * 90}°`, `Heater rotated by ${S.rot * 90}°`));
  setTimeout(placeRot, 60);
}
// plovoucí tlačítko ⟳ u vybraných kamen (v půdorysu nad kamny, ve 3D nad jejich horní hranou)
function placeRot() {
  const btn = $('#wk-rot'), stage = $('.wk-stage');
  if (!btn || !stage) return;
  const planOn = !$('#wk-planwrap').hidden, st = LAST && LAST.stove;
  if (!SEL || !st || (SEL === 'plan') !== planOn) { btn.hidden = true; return; }
  const sr = stage.getBoundingClientRect();
  let x, y;
  if (planOn && planSvg) {
    // nad obrys kamen (i s dvířky), ať je nezakrývá; když nahoře není místo, vedle nich
    const g = planSvg.querySelector('.pl-stove'); if (!g) { btn.hidden = true; return; }
    const r = g.getBoundingClientRect(), gap = 28;
    x = r.left + r.width / 2 - sr.left; y = r.top - sr.top - gap;
    if (y < 30) { y = r.top + r.height / 2 - sr.top; x = r.right - sr.left + gap; if (x > sr.width - 30) x = r.left - sr.left - gap; }
  } else if (R3) {
    const v = new THREE.Vector3(st.center.x - S.w / 2, B.h + 14, S.d / 2 - st.center.y).project(R3.camera);
    if (v.z > 1) { btn.hidden = true; return; }
    x = (v.x + 1) / 2 * sr.width; y = (1 - v.y) / 2 * sr.height - 30;
  } else { btn.hidden = true; return; }
  btn.hidden = false;
  btn.style.left = clamp(x, 30, sr.width - 30) + 'px'; btn.style.top = clamp(y, 30, sr.height - 30) + 'px';
}

/* ---------- 3D ---------- */
let R3 = null;
const VIEW = {mode: 'orbit', yaw: -.55, pitch: .62, dist: 0, walk: null, sit: null, anim: null};
function woodTex(base, dark, vertical, plank = 9.5, seed = 1, grooves = true, rep = null) {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const g = c.getContext('2d'); let s = seed * 9301;
  const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  const n = Math.round(100 / plank), pw = 512 / n;
  for (let i = 0; i < n; i++) {
    const l = 0.88 + rnd() * 0.22;
    g.fillStyle = `rgba(${l > 1 ? 255 : 0},${l > 1 ? 240 : 0},${l > 1 ? 200 : 0},${Math.abs(l - 1) * .55})`;
    if (vertical) g.fillRect(i * pw, 0, pw, 512); else g.fillRect(0, i * pw, 512, pw);
    g.strokeStyle = dark; g.globalAlpha = .18; g.lineWidth = 1;
    for (let k = 0; k < 7; k++) {  // léta dřeva
      const o = rnd() * pw, a = 2 + rnd() * 4, f = 1 + rnd() * 3;
      g.beginPath();
      for (let t = 0; t <= 512; t += 8) { const w = o + Math.sin(t / 512 * Math.PI * f + k) * a; if (vertical) { if (!t) g.moveTo(i * pw + w, t); else g.lineTo(i * pw + w, t); } else { if (!t) g.moveTo(t, i * pw + w); else g.lineTo(t, i * pw + w); } }
      g.stroke();
    }
    g.globalAlpha = grooves ? .55 : 0; g.fillStyle = dark;
    if (vertical) g.fillRect(i * pw, 0, 1.6, 512); else g.fillRect(0, i * pw, 512, 1.6);
    g.globalAlpha = 1;
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.encoding = THREE.sRGBEncoding; t.anisotropy = 4;
  if (rep) t.repeat.set(rep[0], rep[1]); else t.repeat.set(1 / 100, 1 / 100);  // 512 px = 100 cm, UV v cm
  return t;
}
function tileTex() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#3b3d3a'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { const l = 52 + Math.random() * 10; g.fillStyle = `rgb(${l},${l + 2},${l})`; g.fillRect(i * 128 + 2, j * 128 + 2, 124, 124); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.encoding = THREE.sRGBEncoding; t.repeat.set(1 / 60, 1 / 60);
  return t;
}
function init3d() {
  const host = $('#wk-3d');
    if (!host || !window.THREE) { if (host) host.innerHTML = '<p class="wk-no3d">' + tr('3D náhled se nepodařilo spustit. Půdorys a kontrola fungují dál.', 'The 3D view could not start. The floor plan and the check still work.') + '</p>'; return; }
  let renderer;
  try { renderer = new THREE.WebGLRenderer({antialias: true, powerPreference: 'high-performance'}); }
    catch (e) { host.innerHTML = '<p class="wk-no3d">' + tr('Tento prohlížeč 3D neumí. Půdorys a kontrola fungují dál.', 'This browser cannot show 3D. The floor plan and the check still work.') + '</p>'; return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.appendChild(renderer.domElement);
  renderer.domElement.tabIndex = 0;
    renderer.domElement.setAttribute('aria-label', tr('3D náhled sauny. Šipkami nebo W A S D se v režimu Projít se chodí.', '3D view of the sauna. In Walk mode, move with the arrow keys or W A S D.'));
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x121413);
  scene.fog = new THREE.Fog(0x121413, 900, 2200);
  const camera = new THREE.PerspectiveCamera(50, 1, 2, 6000);
  const hemi = new THREE.HemisphereLight(0xfff1dc, 0x2a2018, .55); scene.add(hemi);
  const lamp = new THREE.SpotLight(0xffd9a8, .85, 0, Math.PI / 2.6, .6, 1);
  lamp.castShadow = true; lamp.shadow.mapSize.set(1024, 1024); lamp.shadow.bias = -0.0008; lamp.shadow.camera.near = 20; lamp.shadow.camera.far = 600;
  scene.add(lamp, lamp.target);
  const fire = new THREE.PointLight(0xff7a2a, 0, 260, 1.8); scene.add(fire);
  const led = new THREE.PointLight(0xffb066, 0, 260, 1.8); scene.add(led);
  R3 = {renderer, scene, camera, host, lamp, fire, led, group: null, walls: {}, ceiling: null, need: true, mats: {}, t0: performance.now(), pick: []};
  // materiály
  const M = R3.mats;
  M.wall = new THREE.MeshStandardMaterial({map: woodTex('#c79c63', '#6b4a24', true, 9.5, 3), roughness: .82});
  M.ceil = new THREE.MeshStandardMaterial({map: woodTex('#c49761', '#6b4a24', false, 9.5, 5), roughness: .85});
  M.masonry = new THREE.MeshStandardMaterial({color: 0x8d8a82, roughness: .95});
  M.floor = new THREE.MeshStandardMaterial({map: tileTex(), roughness: .9});
  M.bench = new THREE.MeshStandardMaterial({map: woodTex('#dcbf8c', '#8b6a3a', false, 50, 7, false, [1, 1]), roughness: .7});
  M.benchDark = new THREE.MeshStandardMaterial({color: 0x9c7a4a, roughness: .8});
  M.steel = new THREE.MeshStandardMaterial({color: 0x1d1e1d, roughness: .55, metalness: .55});
  M.steelEdge = new THREE.MeshStandardMaterial({color: 0x2b2c2b, roughness: .4, metalness: .7});
  M.stone = new THREE.MeshStandardMaterial({color: 0xffffff, roughness: .92, metalness: 0, emissive: 0x000000});
  M.glassFire = new THREE.MeshStandardMaterial({color: 0x110a05, emissive: 0xff6a1a, emissiveIntensity: 0, roughness: .2});
  M.doorGlass = new THREE.MeshStandardMaterial({color: 0x6a4a2a, transparent: true, opacity: .32, roughness: .08, metalness: .1, depthWrite: false, side: THREE.DoubleSide});
  M.doorWood = new THREE.MeshStandardMaterial({color: 0xb98e58, roughness: .6, side: THREE.DoubleSide});
  M.frame = new THREE.MeshStandardMaterial({color: 0xb98e58, roughness: .6});
  M.handle = new THREE.MeshStandardMaterial({color: 0xd9b27c, roughness: .5});
  M.zone = new THREE.MeshBasicMaterial({color: 0xd4ae6c, transparent: true, opacity: .1, depthWrite: false, side: THREE.DoubleSide});
  M.zoneBad = new THREE.MeshBasicMaterial({color: 0xe0563f, transparent: true, opacity: .16, depthWrite: false, side: THREE.DoubleSide});
  M.zoneLine = new THREE.LineBasicMaterial({color: 0xd4ae6c, transparent: true, opacity: .75});
  M.zoneLineBad = new THREE.LineBasicMaterial({color: 0xe0563f, transparent: true, opacity: .9});
  M.person = new THREE.MeshStandardMaterial({color: 0xe8e1d4, roughness: .75, transparent: true, opacity: .62});
  M.ledStrip = new THREE.MeshBasicMaterial({color: 0xffc27a});
  M.outside = new THREE.MeshBasicMaterial({color: 0x2c3b35, side: THREE.DoubleSide});
  M.panel = new THREE.MeshStandardMaterial({color: 0x161616, roughness: .4});
  M.shield = new THREE.MeshStandardMaterial({color: 0x9aa09f, roughness: .32, metalness: .75});
  M.ventFrame = new THREE.MeshStandardMaterial({color: 0x2a2c2b, roughness: .6, metalness: .3});
  M.ventSlat = new THREE.MeshStandardMaterial({color: 0x8d9290, roughness: .35, metalness: .7});
  M.panelLed = new THREE.MeshBasicMaterial({color: 0xff4a2a});
  // kameny: jedna sada tvarů, náhodně
  R3.stoneGeo = new THREE.DodecahedronGeometry(1, 0);
  bindControls();
  new ResizeObserver(resize3d).observe(host);
  resize3d();
  const io = new IntersectionObserver(es => { R3.visible = es[0].isIntersecting; if (R3.visible) loop(); });
  io.observe(host);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) loop(); });
}
function resize3d() {
  if (!R3) return;
  const w = R3.host.clientWidth, h = R3.host.clientHeight;
  R3.renderer.setSize(w, h, false);
  R3.camera.aspect = w / Math.max(1, h); R3.camera.updateProjectionMatrix();
  R3.need = true; loop();
}
// stěna s otvory jako vytažený tvar (UV v cm → textura s prkny sedí)
function wallMesh(len, H, holes, mat, thick = 8) {
  const sh = new THREE.Shape();
  sh.moveTo(0, 0); sh.lineTo(len, 0); sh.lineTo(len, H); sh.lineTo(0, H); sh.lineTo(0, 0);
  for (const h of holes) { const p = new THREE.Path(); p.moveTo(h.u0, h.v0); p.lineTo(h.u1, h.v0); p.lineTo(h.u1, h.v1); p.lineTo(h.u0, h.v1); p.lineTo(h.u0, h.v0); sh.holes.push(p); }
  const geo = new THREE.ExtrudeGeometry(sh, {depth: thick, bevelEnabled: false});
  const m = new THREE.Mesh(geo, mat); m.receiveShadow = true;
  return m;
}
const disposeTree = o => o.traverse(x => { if (x.geometry && x.geometry !== (R3 && R3.stoneGeo)) x.geometry.dispose(); });
function build3d(L) {
  if (!R3) return;
  const {scene, mats: M} = R3;
  if (R3.group) { scene.remove(R3.group); disposeTree(R3.group); }
  const G = new THREE.Group(); R3.group = G; scene.add(G);
  const W = S.w, Dd = S.d, H = S.h, X = x => x - W / 2, Z = y => Dd / 2 - y;
  const box = (w, h, d, mat, x, y, z, cast = true) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; G.add(m); return m; };
  // podlaha + strop
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(W, Dd), M.floor); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; G.add(fl);
  { const uv = fl.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * W, uv.getY(i) * Dd); }
  R3.floor = fl;
  const ce = new THREE.Mesh(new THREE.PlaneGeometry(W, Dd), M.ceil); ce.rotation.x = Math.PI / 2; ce.position.y = H; G.add(ce);
  { const uv = ce.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * W, uv.getY(i) * Dd); }
  R3.ceiling = ce;
  // stěny: skupina má místní osu X = podél stěny (u), Y nahoru, +Z ven z místnosti (tloušťka). Vnitřní líc je v z = 0.
  // Půdorysné u (wallPt): front x, back x, left y, right y. Místní u: front x, back W − x, left D − y, right y.
  const wallMat = S.mw === 'masonry' ? M.masonry : M.wall;
  const T = 8;
  const holesOf = wall => {
    const hs = [];
    if (L.door.wall === wall) hs.push({u0: L.door.u0, u1: L.door.u1, v0: 0, v1: L.door.h, kind: 'door'});
    if (L.win && L.win.wall === wall) {
      const h = {u0: L.win.u0, u1: L.win.u1, v0: L.win.sill, v1: L.win.sill + L.win.h, kind: 'win'};
      if (L.door.wall === wall && h.u0 < L.door.u1 + 6 && h.u1 > L.door.u0 - 6) {  // okno vedle dveří: zkrátit na delší stranu
        const left = L.door.u0 - 6 - h.u0, right = h.u1 - (L.door.u1 + 6);
        if (right >= left) h.u0 = L.door.u1 + 6; else h.u1 = L.door.u0 - 6;
      }
      if (h.u1 - h.u0 > 20) hs.push(h);
    }
    return hs;
  };
  const FRAME = {front: [X(0), Z(0), 0, false], back: [X(W), Z(Dd), Math.PI, true], left: [X(0), Z(Dd), -Math.PI / 2, true], right: [X(W), Z(0), Math.PI / 2, false]};
  R3.walls = {};
  for (const wall of ['front', 'back', 'left', 'right']) {
    const len = wallLen(wall), [px, pz, rot, flip] = FRAME[wall];
    const hs = holesOf(wall).map(h => flip ? {...h, u0: len - h.u1, u1: len - h.u0} : h);
    const g = new THREE.Group();
    g.add(wallMesh(len, H, hs, wallMat, T));
    for (const h of hs) {
      const fw = 6;
      const fr = (u0, v0, u1, v1) => { const b = new THREE.Mesh(new THREE.BoxGeometry(u1 - u0, v1 - v0, T + 2), M.frame); b.position.set((u0 + u1) / 2, (v0 + v1) / 2, T / 2); b.receiveShadow = true; g.add(b); };
      fr(h.u0 - fw, h.v1, h.u1 + fw, h.v1 + fw); fr(h.u0 - fw, h.v0, h.u0, h.v1); fr(h.u1, h.v0, h.u1 + fw, h.v1);
      if (h.kind === 'win') fr(h.u0 - fw, h.v0 - fw, h.u1 + fw, h.v0);
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(h.u1 - h.u0, h.v1 - h.v0), h.kind === 'door' && !L.door.glass ? M.doorWood : M.doorGlass);
      pane.position.set((h.u0 + h.u1) / 2, (h.v0 + h.v1) / 2, T / 2); g.add(pane);
      const bg = new THREE.Mesh(new THREE.PlaneGeometry(h.u1 - h.u0 + 80, h.v1 - h.v0 + 80), M.outside);  // za sklem večerní les
      bg.position.set((h.u0 + h.u1) / 2, (h.v0 + h.v1) / 2, T + 90); bg.userData.outside = true; g.add(bg);
      if (h.kind === 'door') { const hd = new THREE.Mesh(new THREE.BoxGeometry(3, 28, 4), M.handle); hd.position.set(flip ? h.u0 + 9 : h.u1 - 9, 105, -2); g.add(hd); }
    }
    g.position.set(px, 0, pz); g.rotation.y = rot;
    G.add(g); R3.walls[wall] = g;
  }
  // ---- lavice: prkna podél, podpěry, opěradlo na zdi, LED pod horní ----
  const benchMeshes = [];
  for (const b of L.benches) {
    const horiz = b.wall === 'back' || b.wall === 'front', len = horiz ? b.x1 - b.x0 : b.y1 - b.y0, dep = horiz ? b.y1 - b.y0 : b.x1 - b.x0;
    const g = new THREE.Group();
    const n = Math.max(3, Math.round(dep / 10)), sw = dep / n;
    for (let i = 0; i < n; i++) {
      const pl = new THREE.Mesh(new THREE.BoxGeometry(len - 1, 2.6, sw - 1.2), M.bench);
      pl.position.set(0, b.top - 1.3, -dep / 2 + sw * (i + .5)); pl.castShadow = pl.receiveShadow = true; g.add(pl);
    }
    // nosníky a nohy po 60 cm
    const legs = Math.max(2, Math.ceil(len / 60) + 1);
    for (let i = 0; i < legs; i++) {
      const x = -len / 2 + 4 + (len - 8) * i / (legs - 1);
      const be = new THREE.Mesh(new THREE.BoxGeometry(4, 6, dep - 2), M.benchDark); be.position.set(x, b.top - 5.6, 0); g.add(be);
      const lg = new THREE.Mesh(new THREE.BoxGeometry(4.5, b.top - 8.6, 4.5), M.benchDark); lg.position.set(x, (b.top - 8.6) / 2, dep / 2 - 5); lg.castShadow = true; g.add(lg);
    }
    // čelo (zakrytí pod lavicí) u horní lavice
    if (b.level === 'upper') {
      const sk = new THREE.Mesh(new THREE.BoxGeometry(len - 1, 9, 2), M.bench); sk.position.set(0, b.top - 9, dep / 2 - 1); g.add(sk);
      const strip = new THREE.Mesh(new THREE.BoxGeometry(len - 10, .8, 1.2), M.ledStrip); strip.position.set(0, b.top - 14, dep / 2 - 3); g.add(strip);
    }
    // opěradlo: dvě prkna na zdi (horní lavice a dolní, která stojí sama u stěny)
    if (b.atWall) for (const hh of [38, 52]) { const bk = new THREE.Mesh(new THREE.BoxGeometry(len - 6, 8, 2.4), M.bench); bk.position.set(0, b.top + hh, -dep / 2 + 1.5); bk.castShadow = true; g.add(bk); }
    const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
    g.position.set(X(cx), 0, Z(cy));
    // místní −Z = ke zdi
    g.rotation.y = {back: 0, front: Math.PI, left: Math.PI / 2, right: -Math.PI / 2}[b.wall] || 0;  // místní −Z = ke zdi
    G.add(g); benchMeshes.push(g);
  }
  // LED světlo pod horní lavicí
  const up = L.benches.find(b => b.level === 'upper');
  if (up) { const c = {x: (up.x0 + up.x1) / 2, y: (up.y0 + up.y1) / 2}; R3.led.position.set(X(c.x), up.top - 25, Z(c.y)); R3.led.intensity = .55; }
  else R3.led.intensity = 0;
  // ---- kamna ----
  const st = L.stove, sg = buildStove(M);
  sg.position.set(X(st.center.x), 0, Z(st.center.y));
  // dvířka kamen míří v místní +Z; Ry(θ) mapuje +Z na (sin θ, 0, cos θ) → dovnitř místnosti
  sg.rotation.y = st.yaw;  // dvířka (místní +Z) míří ve směru natočení kamen
  G.add(sg); R3.stove = sg;
  // kouřovod do stropu
  const flH = H - B.h;
  if (flH > 2) {
    const fp = new THREE.Mesh(new THREE.CylinderGeometry(B.flueD / 2, B.flueD / 2, flH, 24), M.steel);
    fp.position.set(X(st.flue.x), B.h + flH / 2, Z(st.flue.y)); fp.castShadow = true; G.add(fp);
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(B.flueD / 2 + 6, B.flueD / 2 + 6, 1.2, 24), M.steelEdge);
    ring.position.set(X(st.flue.x), H - .6, Z(st.flue.y)); G.add(ring);
  }
  R3.fire.position.set(X(st.firePt.x), 22, Z(st.firePt.y));  // odlesk ohně na podlaze před dvířky (kameny výš nechává šedé)
  // regulátor pro +e: na zdi u dveří, mimo zónu kamen
  if (D_.models[S.m].electric) {
    const pw = L.door.wall, pu = L.door.u1 + 18 < wallLen(pw) - 10 ? L.door.u1 + 18 : L.door.u0 - 18;
    const p = wallPt(pw, pu, 1.5), pn = new THREE.Group();
    const bx = new THREE.Mesh(new THREE.BoxGeometry(12, 18, 3), M.panel); pn.add(bx);
    const ld = new THREE.Mesh(new THREE.CircleGeometry(1.1, 12), M.panelLed); ld.position.set(0, 4, 1.6); pn.add(ld); R3.panelLed = ld;
    pn.position.set(X(p.x), 150, Z(p.y));
    pn.rotation.y = {back: 0, front: Math.PI, left: Math.PI / 2, right: -Math.PI / 2}[pw];
    G.add(pn); R3.panel = {obj: pn, wall: pw};
  } else { R3.panelLed = null; R3.panel = null; }
  // ---- větrání: mřížky na stěnách (umístěné samy podle kamen); uzavíratelné má šoupátko ----
  R3.vents = [];
  for (const v of L.vents || []) {
    const p = wallPt(v.wall, v.u, .9), vg = new THREE.Group();
    vg.add(new THREE.Mesh(new THREE.BoxGeometry(v.w + 3, v.h + 3, 1.2), M.ventFrame));
    for (let i = 0; i < 4; i++) { const sl = new THREE.Mesh(new THREE.BoxGeometry(v.w - 2, .9, 1.6), M.ventSlat); sl.position.set(0, -v.h / 2 + 1.5 + (v.h - 3) * i / 3, .3); vg.add(sl); }
    if (v.kind === 'air') { const kb = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.2, 2.4), M.steelEdge); kb.position.set(v.w / 2 - 2.5, 0, 1.3); vg.add(kb); }
    vg.position.set(X(p.x), v.z, Z(p.y)); vg.rotation.y = {back: 0, front: Math.PI, left: Math.PI / 2, right: -Math.PI / 2}[v.wall];
    G.add(vg); R3.vents.push({obj: vg, wall: v.wall});
  }
  // ---- tepelné štíty (příslušenství 1 000 Kč/ks): plech na boku nebo za zády kamen, 8–91 cm nad podlahou (CAD ~437 × 831 mm) ----
  for (const r of L.shields || []) {
    const sh = new THREE.Mesh(new THREE.BoxGeometry(Math.max(1.2, r.x1 - r.x0), 83, Math.max(1.2, r.y1 - r.y0)), M.shield);  // CAD: ~831 mm
    sh.position.set(X((r.x0 + r.x1) / 2), 8 + 41.5, Z((r.y0 + r.y1) / 2)); sh.castShadow = true; sh.receiveShadow = true; G.add(sh);
  }
  // ---- bezpečná zóna ----
  const zb = L.checks.some(c => c.lvl !== 'ok' && c.zone);
  const z = st.zone, zh = Math.min(H - 1, B.h + 25);
  const zg = new THREE.BoxGeometry(z.x1 - z.x0, zh, z.y1 - z.y0);
  const zm = new THREE.Mesh(zg, zb ? M.zoneBad : M.zone); zm.position.set(X((z.x0 + z.x1) / 2), zh / 2, Z((z.y0 + z.y1) / 2)); zm.renderOrder = 3;
  const ze = new THREE.LineSegments(new THREE.EdgesGeometry(zg), zb ? M.zoneLineBad : M.zoneLine); ze.position.copy(zm.position);
  R3.zone = new THREE.Group(); R3.zone.add(zm, ze); R3.zone.visible = VIEW.zone !== false; G.add(R3.zone);
  // ---- lidé (kolik se vás vejde) ----
  if (S.ppl) for (const b of L.benches) {
    const horiz = b.wall === 'back' || b.wall === 'front', len = horiz ? b.x1 - b.x0 : b.y1 - b.y0, n = Math.floor(len / D_.seatW);
    for (let i = 0; i < n; i++) {
      const t = (i + .5) / n, sx = horiz ? b.x0 + len * t : (b.x0 + b.x1) / 2, sy = horiz ? (b.y0 + b.y1) / 2 : b.y0 + len * t;
      const p = person(M); p.position.set(X(sx), b.top, Z(sy));
      p.rotation.y = {back: 0, front: Math.PI, left: Math.PI / 2, right: -Math.PI / 2}[b.wall];
      G.add(p);
    }
  }
  // stropní světlo nad středem
  R3.lamp.position.set(0, H - 6, 0); R3.lamp.target.position.set(0, 0, 0);
  // překážky pro chůzi (půdorys, cm)
  R3.obs = [...L.benches.map(b => ({...b})), {...st.body, x0: st.body.x0 - 6, x1: st.body.x1 + 6, y0: st.body.y0 - 6, y1: st.body.y1 + 6}, st.front];
  R3.L = L;
  applyFx(); cutaway(); R3.need = true; loop();
}
function person(M) {
  const g = new THREE.Group();
  // zjednodušená sedící postava (trup, hlava, stehna, holeně): jen měřítko, kolik se vás vejde
  const body = new THREE.Mesh(new THREE.CylinderGeometry(10, 12.5, 54, 14), M.person); body.position.set(0, 30, -12); g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(9, 16, 12), M.person); head.position.set(0, 68, -11); g.add(head);
  for (const sx of [-7, 7]) {
    const th = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 6, 40, 10), M.person); th.rotation.x = Math.PI / 2; th.position.set(sx, 6, 6); g.add(th);
    const sh = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 5, 42, 10), M.person); sh.position.set(sx, -16, 26); g.add(sh);
  }
  g.traverse(m => { if (m.isMesh) m.castShadow = true; });
  return g;
}
// kamna IRIKON: sokl, topeniště, dvířka se sklem, koš s tyčemi a kameny, hrdlo; dvířka míří do +Z
function buildStove(M) {
  const g = new THREE.Group(), bw = B.w, bd = B.d, bh = B.h;
  const add = (geo, mat, x, y, z, cast = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; g.add(m); return m; };
  add(new THREE.BoxGeometry(bw, 8, bd), M.steel, 0, 4, 0);                                     // sokl s popelníkem
  add(new THREE.BoxGeometry(bw - 2, 1.5, bd - 2), M.steelEdge, 0, 8.5, 0);
  add(new THREE.BoxGeometry(24, bh - 14, 24), M.steel, 0, 8 + (bh - 14) / 2, -2);                // jádro (topeniště + tah)
  // přední topeniště s dvířky
  const fz = bd / 2 + B.frontD / 2 - 1;
  add(new THREE.BoxGeometry(B.frontW, B.frontH - 8, B.frontD + 2), M.steel, 0, 8 + (B.frontH - 8) / 2, fz);
  const door = add(new THREE.BoxGeometry(B.frontW - 3, 28, 1.6), M.steelEdge, 0, 30, bd / 2 + B.frontD + .6);
  const gl = add(new THREE.PlaneGeometry(B.frontW - 9, 19), M.glassFire, 0, 31.5, bd / 2 + B.frontD + 1.45, false);
  add(new THREE.BoxGeometry(14, 5, 1.4), M.steelEdge, 0, 12.5, bd / 2 + B.frontD + .6);           // popelník
  const hd = add(new THREE.CylinderGeometry(1.2, 1.2, 9, 10), M.handle, -B.frontW / 2 - 1.5, 30, bd / 2 + B.frontD + 1.5); // dřevěná rukojeť
  hd.rotation.x = 0;
  // koš: tyče po obvodu se zkosenými rohy, tři obruče
  const ch = 7, pts = [[-bw / 2 + ch, -bd / 2], [bw / 2 - ch, -bd / 2], [bw / 2, -bd / 2 + ch], [bw / 2, bd / 2 - ch], [bw / 2 - ch, bd / 2], [-bw / 2 + ch, bd / 2], [-bw / 2, bd / 2 - ch], [-bw / 2, -bd / 2 + ch]];
  const ring = y => { const s = new THREE.Shape(); pts.forEach((p, i) => i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1])); s.lineTo(pts[0][0], pts[0][1]);
    const hole = new THREE.Path(); pts.forEach((p, i) => { const q = [p[0] * .93, p[1] * .93]; i ? hole.lineTo(q[0], q[1]) : hole.moveTo(q[0], q[1]); }); s.holes.push(hole);
    const m = new THREE.Mesh(new THREE.ExtrudeGeometry(s, {depth: 1.6, bevelEnabled: false}), M.steelEdge); m.rotation.x = -Math.PI / 2; m.position.y = y; m.castShadow = true; g.add(m); };
  ring(9); ring(52); ring(bh - 1.6);
  const bars = new THREE.CylinderGeometry(.55, .55, bh - 10, 6);
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 6.5));
    for (let k = 0; k < n; k++) {
      const t = k / n, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t;
      if (z > bd / 2 - 3 && Math.abs(x) < B.frontW / 2 + 1 && true) { /* před topeništěm tyče jen nad ním */
        const top = bh - (B.frontH + 1); const m = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, top, 6), M.steelEdge); m.position.set(x, B.frontH + 1 + top / 2, z); g.add(m); continue; }
      const m = new THREE.Mesh(bars, M.steelEdge); m.position.set(x, 9 + (bh - 10) / 2, z); m.castShadow = true; g.add(m);
    }
  }
  // kameny: instance v kleci, mimo jádro a mimo topeniště vpředu
  const stones = [], rnd = (() => { let s = 42; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  for (let y = 13; y < bh + 4; y += 7.2) for (let x = -bw / 2 + 5; x <= bw / 2 - 5; x += 7.4) for (let z = -bd / 2 + 5; z <= bd / 2 - 5; z += 7.4) {
    const jx = x + (rnd() - .5) * 3, jz = z + (rnd() - .5) * 3, jy = y + (rnd() - .5) * 2.5;
    if (Math.abs(jx) < 12.5 && jz > -14.5 && jz < 10.5 && jy < bh - 6) continue;                 // jádro
    if (jz > bd / 2 - 12 && Math.abs(jx) < B.frontW / 2 + 3 && jy < B.frontH + 4) continue;      // topeniště
    if (Math.abs(jx) > bw / 2 - 4 && Math.abs(jz) > bd / 2 - 9) continue;                         // zkosené rohy
    stones.push([jx, Math.min(jy, bh + 2), jz]);
  }
  const inst = new THREE.InstancedMesh(R3.stoneGeo, M.stone, stones.length), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), col = new THREE.Color();
  stones.forEach((p, i) => {
    const s = 3.3 + rnd() * 1.6;
    e.set(rnd() * 6, rnd() * 6, rnd() * 6); q.setFromEuler(e);
    m4.compose(new THREE.Vector3(p[0], p[1], p[2]), q, new THREE.Vector3(s * (1 + rnd() * .35), s * (.8 + rnd() * .3), s));
    inst.setMatrixAt(i, m4);
    const l = .1 + rnd() * .13; col.setRGB(l * .92, l * .95, l); inst.setColorAt(i, col);
  });
  inst.castShadow = true; inst.receiveShadow = true; g.add(inst);
  R3.glass = gl;
  return g;
}
// oheň / elektřina: jen vizuál (nevypovídá o výkonu)
function applyFx() {
  if (!R3) return;
  const el = D_.models[S.m].electric, fx = el ? S.fx : 'wood';
  R3.fireOn = fx === 'wood' || fx === 'both';
  R3.elOn = el && (fx === 'el' || fx === 'both');
  R3.mats.stone.emissive.setHex(R3.elOn ? 0x140502 : 0x000000);
  if (R3.panelLed) R3.panelLed.material.color.setHex(R3.elOn ? 0xff4a2a : 0x333333);
  R3.need = true; loop();
}
// stěny mezi kamerou a místností se z dálky schovají (pohled do domečku)
function cutaway() {
  if (!R3 || !R3.group) return;
  const c = R3.camera.position, W = S.w, Dd = S.d, inside = VIEW.mode !== 'orbit';
  const out = {front: c.z > Dd / 2 - 1, back: c.z < -Dd / 2 + 1, left: c.x < -W / 2 + 1, right: c.x > W / 2 - 1};
  for (const k in R3.walls) R3.walls[k].visible = inside || !out[k];
  if (R3.panel) R3.panel.obj.visible = R3.walls[R3.panel.wall].visible;  // regulátor visí na zdi: schová se s ní
  for (const v of R3.vents || []) if (R3.walls[v.wall]) v.obj.visible = R3.walls[v.wall].visible;  // větrání taky
  for (const k in R3.walls) R3.walls[k].children.forEach(o => { if (o.userData.outside) o.visible = inside; });  // „venek“ za sklem jen zevnitř
  if (R3.ceiling) R3.ceiling.visible = inside || c.y < S.h;
}
/* kamera */
function orbitPose() {
  const r = VIEW.dist || Math.max(S.w, S.d, S.h) * (R3 && R3.camera.aspect < 1 ? 2.5 : 1.8);  // na výšku (telefon) dál
  VIEW.dist = r;
  const t = new THREE.Vector3(0, S.h * .38, 0);
  const p = new THREE.Vector3(t.x + r * Math.cos(VIEW.pitch) * Math.sin(VIEW.yaw), t.y + r * Math.sin(VIEW.pitch), t.z + r * Math.cos(VIEW.pitch) * Math.cos(VIEW.yaw));
  return {p, t};
}
function eyePose() {
  const w = VIEW.mode === 'sit' ? VIEW.sit : VIEW.walk;
  const p = new THREE.Vector3(w.x - S.w / 2, w.eye, S.d / 2 - w.y);
  const dir = new THREE.Vector3(Math.sin(w.yaw) * Math.cos(w.pitch), Math.sin(w.pitch), -Math.cos(w.yaw) * Math.cos(w.pitch));
  return {p, t: p.clone().add(dir)};
}
function placeCamera(now) {
  const cam = R3.camera;
  let pose = VIEW.mode === 'orbit' ? orbitPose() : eyePose();
  if (VIEW.anim) {
    const a = VIEW.anim, k = reduced ? 1 : clamp((now - a.t0) / a.ms, 0, 1), q = 1 - Math.pow(1 - k, 3);
    pose = {p: a.p0.clone().lerp(pose.p, q), t: a.t0v.clone().lerp(pose.t, q)};
    if (k >= 1) VIEW.anim = null; else R3.need = true;
  }
  cam.position.copy(pose.p); cam.lookAt(pose.t);
  cam.fov = VIEW.mode === 'orbit' ? 45 : 68; cam.updateProjectionMatrix();
  VIEW.lastT = pose.t;
}
function setMode(m) {
  if (!R3) return;
  const L = R3.L || LAST, cam = R3.camera, from ={p0: cam.position.clone(), t0v: (VIEW.lastT || new THREE.Vector3()).clone(), t0: performance.now(), ms: 700};
  if (m === 'walk') {
    // start u dveří, pohled dovnitř
    const d = L.door, mid = (d.u0 + d.u1) / 2, p = wallPt(d.wall, mid, 45);
    VIEW.walk = {x: p.x, y: p.y, eye: 162, yaw: Math.atan2(S.w / 2 - p.x, S.d / 2 - p.y), pitch: -.12};
  }
  if (m === 'sit') {
    const up = L.benches.find(b => b.level === 'upper') || L.benches[0];
        if (!up) { toast(tr('Bez lavice se sednout nedá. Přidejte lavici.', 'There is nowhere to sit without a bench. Add one.')); return; }
    const c = L.stove.center, horiz = up.wall === 'back' || up.wall === 'front';
    let sx = (up.x0 + up.x1) / 2, sy = (up.y0 + up.y1) / 2;
    // sednout co nejdál od kamen, ale ne do rohu
    if (horiz) sx = clamp(c.x < S.w / 2 ? up.x1 - 45 : up.x0 + 45, up.x0 + 30, up.x1 - 30);
    else sy = clamp(c.y < S.d / 2 ? up.y1 - 45 : up.y0 + 45, up.y0 + 30, up.y1 - 30);
    // posunout ke kraji lavice (sedí se na přední polovině)
    const inward = {back: [0, -1], front: [0, 1], left: [1, 0], right: [-1, 0]}[up.wall];
    sx += inward[0] * 8; sy += inward[1] * 8;
    VIEW.sit = {x: sx, y: sy, eye: up.top + 78, yaw: Math.atan2(c.x - sx, c.y - sy), pitch: -.28};
  }
  if (VIEW.started && m !== 'orbit') track('configurator_' + m, {}, true);  // configurator_walk / configurator_sit
  VIEW.mode = m; VIEW.anim = VIEW.started ? from : null; VIEW.started = true;
  $$('[data-wk-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.wkView === m)));
  const touch = matchMedia('(pointer: coarse)').matches;
    showHint(m === 'walk' ? (touch ? tr('Klepněte, kam chcete jít. Tažením se rozhlédnete.', 'Tap where you want to go. Drag to look around.') : tr('Chůze: W A S D nebo šipky. Tažením myší se rozhlédnete, klepnutím na podlahu dojdete.', 'Walk: W A S D or arrow keys. Drag to look around, click the floor to walk there.'))
        : m === 'sit' ? tr('Sedíte na horní lavici. Tažením se rozhlédnete.', 'You are sitting on the upper bench. Drag to look around.')
        : (touch ? tr('Tažením otáčíte, dvěma prsty přibližujete.', 'Drag to rotate, pinch to zoom.') : tr('Tažením otáčíte, kolečkem přibližujete. Kamna přesunete v půdorysu.', 'Drag to rotate, scroll to zoom. Move the heater in the floor plan.')));
  cutaway(); R3.need = true; loop();
  if (m !== 'orbit') R3.renderer.domElement.focus({preventScroll: true});
}
function bindControls() {
  const el = R3.renderer.domElement;
  let drag = null, pinch = null;
  const pts = new Map();
  el.addEventListener('pointerdown', e => {
    pts.set(e.pointerId, {x: e.clientX, y: e.clientY});
    el.setPointerCapture(e.pointerId);
    if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = {d: Math.hypot(a.x - b.x, a.y - b.y), dist: VIEW.dist}; drag = null; return; }
    drag = {x: e.clientX, y: e.clientY, moved: 0, t: performance.now()};
  });
  el.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId)) return;
    pts.set(e.pointerId, {x: e.clientX, y: e.clientY});
    if (pinch && pts.size === 2) { const [a, b] = [...pts.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); VIEW.dist = clamp(pinch.dist * pinch.d / Math.max(20, d), 150, 1400); R3.need = true; loop(); return; }
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY; drag.moved += Math.abs(dx) + Math.abs(dy);
    if (VIEW.mode === 'orbit') { VIEW.yaw -= dx * .006; VIEW.pitch = clamp(VIEW.pitch + dy * .005, .05, 1.45); }
    else { const w = VIEW.mode === 'sit' ? VIEW.sit : VIEW.walk; w.yaw += dx * .005; w.pitch = clamp(w.pitch - dy * .004, -1.1, .9); }
    VIEW.anim = null; R3.need = true; loop();
  });
  const end = e => {
    pts.delete(e.pointerId);
    if (pts.size < 2) pinch = null;
    if (drag && drag.moved < 6 && VIEW.mode === 'walk' && performance.now() - drag.t < 450) tapWalk(e);
    else if (drag && drag.moved < 6 && performance.now() - drag.t < 450 && R3.stove) {  // klik na kamna = výběr (šipka na otočení)
      const rc = el.getBoundingClientRect(), m = new THREE.Vector2(((e.clientX - rc.left) / rc.width) * 2 - 1, -((e.clientY - rc.top) / rc.height) * 2 + 1);
      const ray = new THREE.Raycaster(); ray.setFromCamera(m, R3.camera);
      selectStove(ray.intersectObject(R3.stove, true).length ? '3d' : null);
    }
    if (!pts.size) drag = null;
  };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
  el.addEventListener('wheel', e => { if (VIEW.mode !== 'orbit') return; e.preventDefault(); VIEW.dist = clamp(VIEW.dist * (1 + Math.sign(e.deltaY) * .08), 150, 1400); R3.need = true; loop(); }, {passive: false});
  // chůze klávesami (jako v Bydlíčku: W/S dopředu a dozadu, A/D úkrok, šipky vlevo/vpravo otáčí)
  const KEYS = {KeyW: 'f', ArrowUp: 'f', KeyS: 'b', ArrowDown: 'b', KeyA: 'l', KeyD: 'r', ArrowLeft: 'tl', ArrowRight: 'tr', KeyQ: 'tl', KeyE: 'tr'};
  const held = new Set();
  addEventListener('keydown', e => {
    if (!KEYS[e.code] || VIEW.mode !== 'walk' || e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target; if (t.closest && t.closest('input, select, textarea')) return;
    const r = R3.host.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
    e.preventDefault(); held.add(e.code); R3.fast = e.shiftKey; R3.held = held; loop();
  });
  addEventListener('keyup', e => { held.delete(e.code); });
  addEventListener('blur', () => held.clear());
  R3.held = held; R3.KEYS = KEYS;
}
function blocked(x, y, r = 22) {
  if (x < r || y < r || x > S.w - r || y > S.d - r) return true;
  return (R3.obs || []).some(q => x > q.x0 - r && x < q.x1 + r && y > q.y0 - r && y < q.y1 + r);
}
function stepWalk(dt) {
  const held = R3.held; if (!held || !held.size || VIEW.mode !== 'walk') return false;
  const on = c => [...held].some(k => R3.KEYS[k] === c), n = (a, b) => (on(a) ? 1 : 0) - (on(b) ? 1 : 0);
  const w = VIEW.walk, turn = n('tr', 'tl'), fw = n('f', 'b'), sd = n('r', 'l');
  w.yaw += turn * (R3.fast ? 2.4 : 1.6) * dt;
  if (fw || sd) {
    const v = (R3.fast ? 200 : 110) * dt / Math.hypot(fw, sd), sn = Math.sin(w.yaw), cs = Math.cos(w.yaw);
    // dopředu = směr pohledu: x += sin(yaw), y += cos(yaw) (y roste dozadu = −Z)
    const dx = (sn * fw + cs * sd) * v, dy = (cs * fw - sn * sd) * v;
    if (!blocked(w.x + dx, w.y + dy)) { w.x += dx; w.y += dy; }
    else if (!blocked(w.x + dx, w.y)) w.x += dx;
    else if (!blocked(w.x, w.y + dy)) w.y += dy;
  }
  return true;
}
function tapWalk(e) {
  const r = R3.renderer.domElement.getBoundingClientRect();
  const m = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  const ray = new THREE.Raycaster(); ray.setFromCamera(m, R3.camera);
  const hit = ray.intersectObject(R3.floor)[0];
  if (!hit) return;
  const tx = hit.point.x + S.w / 2, ty = S.d / 2 - hit.point.z, w = VIEW.walk, t0 = performance.now(), x0 = w.x, y0 = w.y;
  const dist = Math.hypot(tx - x0, ty - y0), ms = clamp(dist * 7, 250, 2200);
  const go = now => {
    if (VIEW.mode !== 'walk') return;
    const k = clamp((now - t0) / ms, 0, 1), q = k < .5 ? 2 * k * k : 1 - 2 * (1 - k) * (1 - k);
    const nx = x0 + (tx - x0) * q, ny = y0 + (ty - y0) * q;
    if (blocked(nx, ny)) { R3.need = true; loop(); return; }
    w.x = nx; w.y = ny; R3.need = true; loop();
    if (k < 1) requestAnimationFrame(go);
  };
  requestAnimationFrame(go);
}
let raf = 0, lastNow = 0;
function loop() {
  if (!R3 || raf) return;
  raf = requestAnimationFrame(frame);
}
function frame(now) {
  raf = 0;
  if (!R3 || document.hidden || R3.visible === false) return;
  const dt = Math.min(.1, (now - (lastNow || now)) / 1000); lastNow = now;
  const walking = stepWalk(dt);
  // oheň: plamen bliká (jen když je vidět)
  const t = now / 1000;
  const fl = R3.fireOn ? .85 + .25 * Math.sin(t * 9.3) * Math.sin(t * 5.1 + 1) + (reduced ? 0 : .12 * Math.sin(t * 23.7)) : 0;
  R3.fire.intensity = R3.fireOn ? .95 * fl : 0;
  R3.mats.glassFire.emissiveIntensity = R3.fireOn ? 1.4 * fl : 0;
  placeCamera(now);
  cutaway();
  R3.renderer.render(R3.scene, R3.camera);
  R3.need = false;
  if (SEL === '3d') placeRot();
  if (walking || VIEW.anim || (R3.fireOn && !reduced)) { if (R3.fireOn && !walking && !VIEW.anim) setTimeout(loop, 40); else loop(); }
}

/* ---------- výsledek ---------- */
const CI = {ok: '✓', warn: '!', bad: '×', info: 'i'}, LVL = {bad: 0, warn: 1, info: 2, ok: 3};
const set = (sel, t) => { const e = $(sel); if (e) e.textContent = t; };
function checkLi(c) {
  const li = document.createElement('li'); li.className = 'wk-c ' + c.lvl;
  li.innerHTML = `<span class="wk-ci" aria-hidden="true">${CI[c.lvl]}</span><div><strong></strong><p></p></div>`;
  li.querySelector('strong').textContent = c.title; li.querySelector('p').textContent = c.text;
  return li;
}
const lidi = n => EN ? `${n} ${n === 1 ? 'person' : 'people'}` : `${n} ${n === 1 ? 'člověk' : n < 5 ? 'lidé' : 'lidí'}`;
function renderResult(L) {
  const m = D_.models[S.m];
  // čísla dole v náhledu
  set('#wk-vol', fm3(L.V));
    set('#wk-vol-note', L.Veff - L.V > .05 ? tr(`počítá se jako ${fm3(L.Veff)}`, `counts as ${fm3(L.Veff)}`) : tr(`podlaha ${nf1.format(S.w * S.d / 1e4)} m²`, `floor ${nf1.format(S.w * S.d / 1e4)} m²`));
  { const vi = $('#wk-vol-i'), tip = $('#wk-vol-tip'), extra = L.Veff - L.V > .05;
    if (vi && tip) { vi.hidden = !extra; vi.closest('.wk-kpi').classList.toggle('has-tip', extra); tip.textContent = extra ? volExplain(L) : ''; if (!extra) tip.classList.remove('open'); } }
  set('#wk-seats', L.seats ? lidi(L.seats) : '—');
    set('#wk-seats-note', L.seats ? tr(`vsedě${L.lie ? `, ${L.lie > 1 ? L.lie + ' si lehnou' : '1 si lehne'}` : ''}`, `seated${L.lie ? `, ${L.lie} can lie down` : ''}`) : tr('přidejte lavici', 'add a bench'));
  set('#wk-model', m.name);
    set('#wk-model-note', `${m.price} ${tr('vč. DPH', 'incl. VAT')}`);
  // stav nahoře + první věc k vyřešení
  const status = L.bad ? 'bad' : L.warn ? 'warn' : 'ok';
    const head = L.bad ? tr('Takhle to nepůjde', 'This won’t work') : L.warn ? tr(`Jde to, ${L.warn === 1 ? 'jedna věc' : L.warn + ' věci'} k doladění`, `It works, ${L.warn === 1 ? 'one thing' : L.warn + ' things'} to fine-tune`) : tr('Kamna se k vám vejdou', 'The heater fits');
  const sum = $('#wk-summary');
  if (sum) { sum.className = 'wk-summary ' + status; sum.innerHTML = '<i aria-hidden="true"></i><span></span>'; sum.lastChild.textContent = head; }
  const al = $('#wk-alert'), first = L.checks.find(c => c.lvl === 'bad') || L.checks.find(c => c.lvl === 'warn');
  if (al) {
    al.hidden = !first;
    if (first) {
      al.className = 'wk-alert ' + first.lvl;
            al.innerHTML = `<span class="wk-ci" aria-hidden="true">${CI[first.lvl]}</span><div><strong></strong><p></p></div><a href="#wk-report">${L.bad + L.warn > 1 ? tr('Další ↓', 'More ↓') : tr('Kontrola ↓', 'Check ↓')}</a>`;
      al.querySelector('strong').textContent = first.title; al.querySelector('p').textContent = first.text;
    }
  }
  // celá kontrola pod konfigurátorem: nejdřív problémy, pak informace, nakonec co je v pořádku
  const h = $('#wk-report-h'); if (h) { h.textContent = head; h.className = 'wk-report-h ' + status; }
  const ul = $('#wk-checks');
  if (ul) { ul.innerHTML = ''; [...L.checks].sort((a, b) => LVL[a.lvl] - LVL[b.lvl]).forEach(c => ul.appendChild(checkLi(c))); }
  const notes = [
        tr(`Kamna s kameny váží asi ${B.massStove + B.massStones} kg. Na dřevěnou podlahu patří pod kamna nehořlavá deska s přesahem před dvířka.`, `With stones the heater weighs about ${B.massStove + B.massStones} kg. On a wooden floor it needs a non-combustible base that extends in front of the door.`),
        tr(`Kouřové hrdlo Ø ${nf0.format(B.flueD * 10)} mm vede nahoru. Před prvním zátopem musí kominík udělat revizi spalinové cesty (vyhláška 34/2016 Sb.).`, `The flue outlet (Ø ${nf0.format(B.flueD * 10)} mm) points up. Before the first firing, a chimney sweep must inspect the flue according to local regulations.`),
  ];
    if (m.electric) notes.push(tr('Elektrická část 9 kW potřebuje přívod 3 × 400 V (u kamen 9 kW obvykle jistič 3 × 16 A) a externí saunový regulátor. Zapojení navrhne elektrikář.', 'The 9 kW electric part needs a 3 × 400 V supply (typically a 3 × 16 A breaker for 9 kW) and an external sauna controller. An electrician will design the connection.'));
    if (L.seats) notes.push(tr(`Na lavice se vejde ${lidi(L.seats)} vsedě${L.lie ? ' a na horní lavici si můžete lehnout' : ''}.`, `${lidi(L.seats)} can sit on the benches${L.lie ? ' and you can lie down on the upper bench' : ''}.`));
  const nl = $('#wk-notes'); if (nl) nl.innerHTML = notes.map(n => `<li>${n}</li>`).join('');
  // odkaz na poptávku s popisem sauny (web běží v kořeni i v podsložce dema)
    const txt = designText(L) + tr(' Odkaz: ', ' Link: ') + `${location.origin}${location.pathname}${location.hash}`;
    const base = location.pathname.replace(/\/(cs|en)\/(konfigurator-sauny|sauna-configurator)\/.*$/, '');
    $$('.wk-send').forEach(a => { a.href = `${base}${tr('/cs/kontakt/', '/en/contact/')}?type=customer&model=${encodeURIComponent(m.name)}&sauna=${encodeURIComponent(txt)}`; });
}
// malý půdorys v rohu 3D (kopie velkého, bez popisků)
function renderMini() {
  const mini = $('#wk-mini');
  if (!mini || !planSvg) return;
  const c = planSvg.cloneNode(true);
  c.removeAttribute('role'); c.setAttribute('aria-hidden', 'true');
  c.querySelectorAll('text,.pl-dim,.pl-swing').forEach(e => e.remove());
  // vlastní ID vzorků (dřevo lavic): jinak by velký půdorys bral vzorek ze skrytého mini a lavice by zčernaly
  c.querySelectorAll('pattern').forEach(p => { p.id += '-m'; });
  c.querySelectorAll('[fill^="url(#"]').forEach(e => e.setAttribute('fill', e.getAttribute('fill').replace(/\)$/, '-m)')));
  mini.replaceChildren(c);
}
// nápověda v 3D se ukáže při změně pohledu a po chvíli zmizí (nebo hned, jak člověk začne táhnout)
let hintT = 0;
function showHint(t) {
  const h = $('#wk-hint'); if (!h) return;
  h.textContent = t; h.classList.add('show');
  clearTimeout(hintT); hintT = setTimeout(() => h.classList.remove('show'), 5500);
}
function hideHint() { clearTimeout(hintT); const h = $('#wk-hint'); if (h) h.classList.remove('show'); }

/* ---------- ovládání ---------- */
const DOOR_CZ = EN ? {front: 'front', left: 'left', right: 'right', back: 'back'} : {front: 'vpředu', left: 'vlevo', right: 'vpravo', back: 'vzadu'},
  WIN_CZ = EN ? {none: 'no window', small: 'small window', big: 'large window', wall: 'glass wall'} : {none: 'bez okna', small: 'malé okno', big: 'velké okno', wall: 'prosklená stěna'};
function benchCz(L) {
  const lv = l => L.benches.filter(b => b.level === l).map(b => WALL_CZ[b.wall]).join(' + ');
  const u = lv('upper'), d = lv('lower');
    return !u && !d ? tr('žádné', 'none') : [u && tr('horní ', 'upper ') + u, d && tr('dolní ', 'lower ') + d].filter(Boolean).join(', ');
}
// shrnutí v hlavičce sbalené sekce (Sauna / Kamna / Lavice / Dveře a okno)
function renderSums(L) {
  const m = D_.models[S.m];
  set('#wk-sum-sauna', `${S.w} × ${S.d} × ${S.h} cm · ${fm3(L.V)}`);
    set('#wk-sum-kamna', [m.short, WALL_CZ[S.sw], S.rot ? S.rot * 90 + '°' : '', S.sh ? (S.sh === 1 ? tr('1 štít', '1 shield') : S.sh + tr(' štíty', ' shields')) : ''].filter(Boolean).join(' · '));
  set('#wk-sum-lavice', benchCz(L));
    set('#wk-sum-dvere', `${tr('dveře', 'door')} ${DOOR_CZ[S.dw]}${S.dg ? tr(', sklo', ', glass') : ''} · ${WIN_CZ[S.win]}`);
}
const ROT_CZ = EN ? ['back to the wall, door into the sauna', 'side to the wall', 'door to the wall', 'side to the wall'] : ['záda ke stěně, dvířka do sauny', 'bokem ke stěně', 'dvířka ke stěně', 'bokem ke stěně'];
function syncInputs() {
  const el = D_.models[S.m].electric;
  for (const e of $$('[data-k]')) {
    const k = e.dataset.k;
    if (e.type === 'checkbox') e.checked = !!S[k];
    else if (document.activeElement !== e || e.type === 'range') e.value = S[k];
  }
  $$('[data-set]').forEach(b => b.setAttribute('aria-pressed', String(String(S[b.dataset.set]) === b.dataset.val)));
  $$('[data-model]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.model === S.m)));
  // lavice nejde dát ke stěně, kde stojí kamna
  $$('.wk-tog[data-wall]').forEach(t => {
    const off = t.dataset.wall === S.sw, i = t.querySelector('input');
    t.classList.toggle('off', off); i.disabled = off;
        t.title = off ? tr('U této stěny stojí kamna', 'The heater stands at this wall') : '';
  });
  const wr = $('#wk-ww-row'); if (wr) wr.hidden = S.win === 'none';
  const fx = $('.wk-fx'); if (fx) fx.hidden = !el;
  $$('[data-wk-fx]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.wkFx === (el ? S.fx : 'wood'))));
  $$('[data-toggle="zone"]').forEach(b => b.setAttribute('aria-pressed', String(VIEW.zone !== false)));
  $$('[data-toggle="ppl"]').forEach(b => b.setAttribute('aria-pressed', String(!!S.ppl)));
  set('#wk-spo', fcm(S.sp / 100 * wallLen(S.sw)));
  set('#wk-roto', `${(S.rot || 0) * 90}° · ${ROT_CZ[(S.rot || 0) % 4]}`);
  set('#wk-dpo', fcm(S.dp / 100 * wallLen(S.dw)));
}
// měření kroků do dataLayer (GTM ho pošle do GA4 až po souhlasu s cookies; bez GTM se nic neodesílá)
const tracked = new Set();
function track(ev, p = {}, once = false) {
  if (once && tracked.has(ev)) return;
  tracked.add(ev);
  let ok = false;
  try { const c = JSON.parse(localStorage.getItem('watra_consent') || 'null'); ok = !!(c && c.analytics === true); } catch (e) {}
  if (!ok) return;  // bez souhlasu nic (GTM se na webu WATRA bez souhlasu ani nenačte)
  (window.dataLayer = window.dataLayer || []).push({event: ev, page_path: location.pathname, language: EN ? 'en' : 'cs', configurator_model: D_.models[S.m].name, ...p});
}
let upT = 0, firstUpdate = true;
function update() {
  const L = layout(); LAST = L;
  renderPlan(L); renderMini(); renderResult(L); renderSums(L);
  clearTimeout(upT); upT = setTimeout(() => build3d(L), 30);
  writeHash();
  if (firstUpdate) { firstUpdate = false; track('configurator_open', {}, true); }
  else track('configurator_change', {}, true);
}
const LIM = {w: [120, 400], d: [120, 400], h: [180, 260]};
function setTab(t) {
  $$('[data-wk-tab]').forEach(x => x.setAttribute('aria-selected', String(x.dataset.wkTab === t)));
  $('#wk-3dwrap').hidden = t !== '3d'; $('#wk-planwrap').hidden = t !== 'plan';
  if (t === '3d') resize3d();
  placeRot();
}
function bindUI() {
  for (const e of $$('[data-k]')) {
    e.addEventListener(e.type === 'range' ? 'input' : 'change', () => {
      const k = e.dataset.k;
      if (e.type === 'checkbox') S[k] = e.checked ? 1 : 0;
      else S[k] = typeof DEF[k] === 'number' ? (Math.round(+e.value) || 0) : e.value;
      if (LIM[k]) { S[k] = clamp(S[k], LIM[k][0], LIM[k][1]); VIEW.dist = 0; }
      syncInputs(); update();
    });
  }
  // číslo: Enter potvrdí hned
  $$('.wk-num input').forEach(e => e.addEventListener('keydown', ev => { if (ev.key === 'Enter') e.blur(); }));
  $$('[data-set]').forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.set;
    S[k] = typeof DEF[k] === 'number' ? +b.dataset.val : b.dataset.val;
    syncInputs(); update();
  }));
  $$('[data-model]').forEach(b => b.addEventListener('click', () => { S.m = b.dataset.model; syncInputs(); update(); }));
  $$('[data-wk-fx]').forEach(b => b.addEventListener('click', () => { S.fx = b.dataset.wkFx; syncInputs(); applyFx(); writeHash(); }));
  $$('[data-wk-view]').forEach(b => b.addEventListener('click', () => { setTab('3d'); setMode(b.dataset.wkView); }));
  $$('[data-toggle]').forEach(b => b.addEventListener('click', () => {
    if (b.dataset.toggle === 'zone') { VIEW.zone = VIEW.zone === false; if (R3 && R3.zone) { R3.zone.visible = VIEW.zone; R3.need = true; loop(); } syncInputs(); }
    else { S.ppl = S.ppl ? 0 : 1; syncInputs(); update(); }
  }));
  $$('[data-preset]').forEach(b => b.addEventListener('click', () => {
    Object.assign(S, DEF, PRESETS[b.dataset.preset] || {}); VIEW.dist = 0; syncInputs(); update();
    if (VIEW.mode !== 'orbit' && R3) setMode('orbit');
    // na telefonu: výsledek je nahoře, posunout k němu
    if (matchMedia('(max-width: 900px)').matches) { const v = $('.wk-sticky'); if (v) v.scrollIntoView({behavior: reduced ? 'auto' : 'smooth', block: 'start'}); }
  }));
  $$('[data-wk-tab]').forEach(b => b.addEventListener('click', () => setTab(b.dataset.wkTab)));
  // sekce voleb: otevřená je vždy jen jedna (rozbalovací menu)
  const secs = $$('details.wk-group');
  secs.forEach(d => d.addEventListener('toggle', () => {
    if (!d.open) return;
    secs.forEach(o => { if (o !== d) o.open = false; });
    // na telefonu je náhled přilepený nahoře: otevřenou sekci posunout pod něj, ať nezajede pod náhled
    if (matchMedia('(max-width: 900px)').matches) requestAnimationFrame(() => {
      const v = $('.wk-sticky'), vb = v ? v.getBoundingClientRect().bottom : 0, t = d.getBoundingClientRect().top;
      if (t < vb + 8) scrollBy({top: t - vb - 8, behavior: reduced ? 'auto' : 'smooth'});
    });
  }));
  // otočení kamen o 90°: tlačítko v panelu, šipka u vybraných kamen, klávesa R (když je náhled vidět)
  const rb = $('#wk-rotb'); if (rb) rb.addEventListener('click', rotateStove);
  const rf = $('#wk-rot'); if (rf) rf.addEventListener('click', e => { e.stopPropagation(); rotateStove(); });
  addEventListener('keydown', e => {
    if (e.code !== 'KeyR' || e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target; if (t.closest && t.closest('input, select, textarea, [contenteditable]')) return;
    if ($('dialog[open]')) return;  // za otevřeným oknem (odeslání, výkres, cookies) kamna neotáčet
    const v = $('#wk-viewer'), r = v && v.getBoundingClientRect(); if (!r || r.bottom < 60 || r.top > innerHeight - 60) return;
    e.preventDefault(); rotateStove();
  });
  addEventListener('resize', () => placeRot());
  const mini = $('#wk-mini'); if (mini) mini.addEventListener('click', () => setTab('plan'));
  const c3 = $('#wk-3d'); if (c3) c3.addEventListener('pointerdown', () => setTimeout(hideHint, 900));
  $$('.wk-send').forEach(a => a.addEventListener('click', e => { const L = LAST; track('configurator_send', {sauna_m3: L ? +L.V.toFixed(1) : null, configurator_ok: L ? !L.bad && !L.warn : null}); if (openSend()) e.preventDefault(); }));
  bindSend(); bindPdfTip();
  const copy = $('#wk-copy');
    if (copy) copy.addEventListener('click', async () => { track('configurator_share'); try { await navigator.clipboard.writeText(location.href); toast(tr('Odkaz na vaši saunu je zkopírovaný.', 'The link to your sauna has been copied.')); } catch (e) { toast(tr('Zkopírujte adresu stránky, je v ní celá sauna.', 'Copy the page address; it contains your whole sauna.')); } });
  const full = $('#wk-full');
  if (full) full.addEventListener('click', () => { const v = $('#wk-viewer'); if (document.fullscreenElement) document.exitFullscreen(); else if (v.requestFullscreen) v.requestFullscreen().catch(() => {}); });
  document.addEventListener('fullscreenchange', () => setTimeout(resize3d, 60));
  // výška lepivé hlavičky webu → náhled se lepí pod ni
  const hdr = () => {
    const n = document.querySelector('.site-navigation'), w = document.querySelector('.wk');
    const h = n && /sticky|fixed/.test(getComputedStyle(n).position) ? n.getBoundingClientRect().height : 0;
    if (w) w.style.setProperty('--wk-hdr', Math.round(h) + 'px');
  };
  hdr(); addEventListener('resize', hdr);
}
const PRESETS = {
  mala: {w: 200, d: 200, h: 215, sw: 'left', sp: 30, ub: 1, lb: 0, dw: 'front', dp: 78, win: 'none'},
  zahrada: {w: 220, d: 210, h: 215, sw: 'left', sp: 26, ub: 1, lb: 1, dw: 'front', dp: 75, win: 'big', ww: 'right'},
  dolniL: {w: 230, d: 210, h: 215, sw: 'right', sp: 26, ub: 1, lb: 1, ll: 1, dw: 'front', dp: 45, win: 'none'},
  penzion: {w: 250, d: 230, h: 220, sw: 'right', sp: 40, ub: 1, ul: 1, lb: 0, dw: 'front', dp: 45, dg: 0, win: 'none', ppl: 1},
  reset: {},
};
function toast(t) {
  let el = $('#wk-toast');
  if (!el) { el = document.createElement('div'); el.id = 'wk-toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
  el.textContent = t; el.classList.add('show'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('show'), 2600);
}

/* ---------- výkres (k tisku / do PDF) a odeslání návrhu přímo z konfigurátoru (Říša 17. 11.) ----------
   Formulář webu WATRA (Cloudflare Worker /api/watra/enquiries) bere jen textová pole do 16 kB → výkres nejde jako příloha,
   posílá se odkaz #…&v=vykres, který otevře výkres s rozměry (Uložit PDF / tisk). */
const hashStr = () => { const q = new URLSearchParams(); for (const k of Object.keys(DEF)) if (S[k] !== DEF[k]) q.set(k, S[k]); return q.toString(); };
const designUrl = view => location.origin + location.pathname + '#' + [hashStr(), view ? 'v=' + view : ''].filter(Boolean).join('&');
const escH = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
function designText(L) {
  const m = D_.models[S.m];
  return tr(`Moje sauna z konfigurátoru: ${S.w} × ${S.d} × ${S.h} cm (${nf1.format(L.V)} m³), ${m.name} ${WALL_CZ[S.sw]}, lavice: ${benchCz(L)}, ${L.door.glass ? 'skleněné' : 'dřevěné'} dveře${L.win ? ', okno' : ''}${S.rot ? `, kamna otočená o ${S.rot * 90}°` : ''}${S.sh ? `, ${S.sh === 1 ? '1 tepelný štít' : S.sh + ' tepelné štíty'} (${S.sh} × 1 000 Kč)` : ''}.`,
    `My sauna from the configurator: ${S.w} × ${S.d} × ${S.h} cm (${nf1.format(L.V)} m³), ${m.name} ${WALL_CZ[S.sw]}, benches: ${benchCz(L)}, ${L.door.glass ? 'glass' : 'wooden'} door${L.win ? ', window' : ''}${S.rot ? `, heater rotated by ${S.rot * 90}°` : ''}${S.sh ? `, ${S.sh} heat shield${S.sh > 1 ? 's' : ''} (${S.sh} × CZK 1,000)` : ''}.`);
}
const statusHead = L => L.bad ? tr('Takhle to nepůjde', 'This won’t work') : L.warn ? tr(`Jde to, ${L.warn === 1 ? 'jedna věc' : L.warn + ' věci'} k doladění`, `It works, ${L.warn === 1 ? 'one thing' : L.warn + ' things'} to fine-tune`) : tr('Kamna se vejdou', 'The heater fits');
const VENT_SHORT = () => ({supply: tr('přívod vzduchu k hoření', 'combustion air inlet'), circ: tr('cirkulace', 'circulation'), air: tr('větrání (uzavíratelné)', 'ventilation (closable)')});

// půdorys s kótami pro výkres (světlý, na papír); compact = malý náhled v okně odeslání (bez kót a popisků)
function sheetPlan(L, compact = false) {
  const W = S.w, D = S.d, T = 8, M = compact ? 12 : 50, st = L.stove, Y = y => D - y;
  const o = [], r = (q, a) => o.push(`<rect x="${q.x0}" y="${Y(q.y1)}" width="${q.x1 - q.x0}" height="${q.y1 - q.y0}" ${a}/>`);
  const txt = (x, y, s, a = '') => o.push(`<text x="${x}" y="${y}" ${a}>${escH(s)}</text>`);
  // kóta: čára s dorazy a číslem uprostřed
  const dim = (x1, y1, x2, y2, label, rot = false) => {
    const tk = 3.5, vert = Math.abs(x1 - x2) < .01;
    o.push(`<line class="d" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`);
    o.push(vert ? `<line class="d" x1="${x1 - tk}" y1="${y1}" x2="${x1 + tk}" y2="${y1}"/><line class="d" x1="${x2 - tk}" y1="${y2}" x2="${x2 + tk}" y2="${y2}"/>`
      : `<line class="d" x1="${x1}" y1="${y1 - tk}" x2="${x1}" y2="${y1 + tk}"/><line class="d" x1="${x2}" y1="${y2 - tk}" x2="${x2}" y2="${y2 + tk}"/>`);
    const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
    if (vert || rot) txt(cx - 3, cy, label, `class="dt" text-anchor="middle" transform="rotate(-90 ${cx - 3} ${cy})"`);
    else txt(cx, cy - 3, label, 'class="dt" text-anchor="middle"');
  };
  o.push(`<rect class="fl" x="0" y="0" width="${W}" height="${D}"/>`);
  o.push(`<rect class="wl" x="${-T / 2}" y="${-T / 2}" width="${W + T}" height="${D + T}" stroke-width="${T}"/>`);
  // otvory ve zdi: okno, dveře, větrání
  const gap = (wall, u0, u1, cls) => {
    const a = wallPt(wall, u0, 0), b = wallPt(wall, u1, 0);
    if (wall === 'left' || wall === 'right') o.push(`<rect class="${cls}" x="${wall === 'left' ? -T : W}" y="${Y(Math.max(a.y, b.y))}" width="${T}" height="${Math.abs(b.y - a.y)}"/>`);
    else o.push(`<rect class="${cls}" x="${Math.min(a.x, b.x)}" y="${wall === 'front' ? D : -T}" width="${Math.abs(b.x - a.x)}" height="${T}"/>`);
  };
  if (L.win) gap(L.win.wall, L.win.u0, L.win.u1, 'wn');
  gap(L.door.wall, L.door.u0, L.door.u1, 'dg');
  { // dveře se otvírají ven
    const d = L.door, w = d.u1 - d.u0, h = wallPt(d.wall, d.u0, 0), tp = wallPt(d.wall, d.u1, 0), op = wallPt(d.wall, d.u0, -w);
    const cross = (op.x - h.x) * (Y(tp.y) - Y(h.y)) - (Y(op.y) - Y(h.y)) * (tp.x - h.x);
    o.push(`<line class="dr" x1="${h.x}" y1="${Y(h.y)}" x2="${op.x}" y2="${Y(op.y)}"/><path class="sw" d="M${op.x} ${Y(op.y)} A${w} ${w} 0 0 ${cross > 0 ? 1 : 0} ${tp.x} ${Y(tp.y)}"/>`);
  }
  const vents = L.vents || [];
  vents.forEach(v => gap(v.wall, v.u - v.w / 2, v.u + v.w / 2, 'vt ' + v.kind));
  // lavice, zóna, místo na přikládání, štíty, kamna
  for (const b of L.benches) r(b, `class="bn ${b.level}"`);
  if (L.service) r(L.service, 'class="sv"');
  r(st.zone, 'class="zn"');
  for (const q of L.shields || []) r(q, 'class="sh"');
  r(st.body, 'class="st" rx="2"'); r(st.front, 'class="sf"');
  o.push(`<circle class="fu" cx="${st.flue.x}" cy="${Y(st.flue.y)}" r="${B.flueD / 2}"/>`);
  if (!compact) {
    // popisky lavic: patro, délka × hloubka, výška sedáku
    for (const b of L.benches) {
      const cx = (b.x0 + b.x1) / 2, cy = Y((b.y0 + b.y1) / 2), side = b.wall === 'left' || b.wall === 'right';
      const s = `${b.level === 'upper' ? tr('horní', 'upper') : tr('dolní', 'lower')} ${Math.round(b.len)} × ${b.depth} · ${tr('v.', 'h')} ${b.top}`;
      txt(cx, cy + 2.2, s, `class="bt" text-anchor="middle"${side ? ` transform="rotate(-90 ${cx} ${cy})"` : ''}`);
    }
    // čísla větracích otvorů (vysvětlení v tabulce)
    const used = [];  // dva otvory ve stejném místě stěny (jeden nízko, druhý u stropu): čísla vedle sebe
    vents.forEach((v, i) => { let uu = v.u; while (used.some(q => q.w === v.wall && Math.abs(q.u - uu) < 11)) uu += 11; used.push({w: v.wall, u: uu}); const p = wallPt(v.wall, uu, -T - 7); o.push(`<circle class="vn" cx="${p.x}" cy="${Y(p.y)}" r="4.5"/>`); txt(p.x, Y(p.y) + 2.2, String(i + 1), 'class="vnt" text-anchor="middle"'); });
    // kóty: místnost, kamna k nejbližším stěnám, dveře od rohu
    dim(0, -T - 14, W, -T - 14, `${S.w}`);
    dim(-T - 14, 0, -T - 14, D, `${S.d}`);
    const b = st.body, cxs = (b.x0 + b.x1) / 2, cys = Y((b.y0 + b.y1) / 2);
    const dl = b.x0, dr = W - b.x1, df = b.y0, db = D - b.y1;
    if (dl <= dr) dim(0, cys, b.x0, cys, `${Math.round(dl)}`); else dim(b.x1, cys, W, cys, `${Math.round(dr)}`);
    if (df <= db) dim(cxs, Y(0), cxs, Y(b.y0), `${Math.round(df)}`); else dim(cxs, Y(b.y1), cxs, Y(D), `${Math.round(db)}`);
    const d = L.door, off = d.wall === 'back' || d.wall === 'left' ? 34 : 16, a = wallPt(d.wall, 0, -T - off), p0 = wallPt(d.wall, d.u0, -T - off), p1 = wallPt(d.wall, d.u1, -T - off);
    dim(a.x, Y(a.y), p0.x, Y(p0.y), `${Math.round(d.u0)}`); dim(p0.x, Y(p0.y), p1.x, Y(p1.y), `${tr('dveře', 'door')} ${Math.round(d.u1 - d.u0)}`);
    txt(cxs, cys + 2.4, D_.models[S.m].short, 'class="stt" text-anchor="middle"');
  }
  const vb = `${-M} ${-M} ${W + 2 * M} ${D + 2 * M}`;
  return `<svg class="ws-svg${compact ? ' ws-mini' : ''}" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escH(tr('Půdorys sauny s kótami v cm', 'Sauna floor plan with dimensions in cm'))}">${o.join('')}</svg>`;
}
function snap3d() {
  if (!R3) return '';
  try { R3.renderer.render(R3.scene, R3.camera); const u = R3.renderer.domElement.toDataURL('image/jpeg', .86); return u.length > 200 ? u : ''; } catch (e) { return ''; }
}
function sheetRows(L) {
  const m = D_.models[S.m], st = L.stove, b = st.body, near = Math.round(Math.min(b.x0, S.w - b.x1, b.y0, S.d - b.y1));
  const sides = {K: tr('záda', 'back'), L: tr('levý bok', 'left side'), R: tr('pravý bok', 'right side')};
  const sh = [st.shK && sides.K, st.shL && sides.L, st.shR && sides.R].filter(Boolean);
  return [
    [tr('Vnitřní rozměry', 'Inside dimensions'), `${S.w} × ${S.d} × ${S.h} cm`],
    [tr('Objem', 'Volume'), fm3(L.V) + (L.Veff - L.V > .05 ? tr(` (pro výběr kamen ${fm3(L.Veff)}: +${nf1.format(D_.glassAdd)} m³ za každý m² ${L.masonry ? 'skla a nezatepleného zdiva' : 'skla'})`, ` (for heater sizing ${fm3(L.Veff)}: +${nf1.format(D_.glassAdd)} m³ per m² of ${L.masonry ? 'glass and uninsulated masonry' : 'glass'})`) : '')],
    [tr('Stěny', 'Walls'), S.mw === 'masonry' ? tr('zdivo bez izolace', 'uninsulated masonry') : tr('dřevo, zateplené', 'insulated timber')],
    [tr('Kamna', 'Heater'), `${m.name} · ${m.kw} · ${m.price} ${tr('vč. DPH', 'incl. VAT')}`],
    [tr('Umístění kamen', 'Heater position'), `${tr('u stěny', 'wall:')} ${WALL_CZ[S.sw]}, ${ROT_CZ[S.rot || 0]}${S.rot ? ` (${S.rot * 90}°)` : ''}; ${tr('k nejbližší stěně', 'nearest wall')} ${near} cm`],
    [tr('Odstupy', 'Clearances'), tr(`boky ${st.cA} / ${st.cB} cm, záda ${st.cK} cm, před dvířky ${D_.clear.front} cm (${D_.clear.status})`, `sides ${st.cA} / ${st.cB} cm, back ${st.cK} cm, front ${D_.clear.front} cm (${D_.clear.status})`)],
    [tr('Tepelné štíty', 'Heat shields'), S.sh ? tr(`${S.sh} × 1 000 Kč (${sh.join(', ')})`, `${S.sh} × CZK 1,000 (${sh.join(', ')})`) : tr('bez štítů', 'none')],
    [tr('Lavice', 'Benches'), `${benchCz(L)}${L.seats ? ' · ' + tr(`${lidi(L.seats)} vsedě`, `${lidi(L.seats)} seated`) : ''}`],
    [tr('Dveře a okno', 'Door and window'), `${tr('dveře', 'door')} ${DOOR_CZ[S.dw]} (${L.door.glass ? tr('sklo', 'glass') : tr('dřevo', 'wood')}) · ${WIN_CZ[S.win]}${L.win ? ' ' + WALL_CZ[S.ww] : ''}`],
    [tr('Větrání', 'Ventilation'), (L.vents || []).map((v, i) => `${i + 1} ${VENT_SHORT()[v.kind]} (${v.z} cm)`).join(', ')],
  ];
}
function renderSheet(L) {
  const status = L.bad ? 'bad' : L.warn ? 'warn' : 'ok', img = snap3d(), date = new Date().toLocaleDateString(LOC);
  const issues = L.checks.filter(c => c.lvl === 'bad' || c.lvl === 'warn');
  return `<div class="ws-head"><div><p class="ws-brand">WATRA</p><h3>${escH(tr('Návrh sauny', 'Sauna design'))}</h3><p class="ws-sub">${escH(`${D_.models[S.m].name} · ${S.w} × ${S.d} × ${S.h} cm · ${date}`)}</p></div><p class="ws-status ${status}">${escH(statusHead(L))}</p></div>
<div class="ws-grid"><figure class="ws-plan">${sheetPlan(L)}<figcaption>${escH(tr('Půdorys, rozměry v cm. Kóty: místnost, kamna k nejbližším stěnám, dveře od rohu. Lavice: délka × hloubka · výška sedáku.', 'Floor plan, dimensions in cm: room, heater to the nearest walls, door from the corner. Benches: length × depth · seat height.'))}</figcaption>
<p class="ws-legend"><i class="lz"></i>${escH(tr('bezpečná zóna', 'safe zone'))} <i class="ls"></i>${escH(tr('místo na přikládání', 'space to load wood'))} <i class="lh"></i>${escH(tr('tepelný štít', 'heat shield'))}</p></figure>
<div class="ws-side">${img ? `<img class="ws-3d" src="${img}" alt="${escH(tr('Sauna ve 3D', 'The sauna in 3D'))}">` : ''}<table class="ws-tab">${sheetRows(L).map(([k, v]) => `<tr><th>${escH(k)}</th><td>${escH(v)}</td></tr>`).join('')}</table>
${issues.length ? `<ul class="ws-issues">${issues.map(c => `<li class="${c.lvl}"><strong>${escH(c.title)}.</strong> ${escH(c.text)}</li>`).join('')}</ul>` : ''}</div></div>
<p class="ws-foot">${escH(tr('Orientační návrh z konfigurátoru WATRA. Odstup od stěn je předběžný údaj WATRA, ostatní hodnoty jsou obvyklé pro kamna na dřevo podobné velikosti; vše potvrdí certifikace a návod k instalaci. Napojení na komín a elektro navrhne kominík a elektrikář.', 'Indicative design from the WATRA configurator. The wall clearance is a preliminary WATRA figure, other values are typical for wood-fired heaters of a similar size; certification and the installation manual will confirm everything. A chimney sweep and an electrician will design the flue and electrical connections.'))}<br><span>${escH(designUrl())}</span></p>`;
}
function openSheet() {
  const d = $('#wk-sheet-dlg'); if (!d || !LAST) return;
  $('#wk-sheet').innerHTML = renderSheet(LAST);
  if (!d.open) { if (d.showModal) d.showModal(); else d.setAttribute('open', ''); }
}
function printSheet() {
  const t0 = document.title;
  document.title = tr('WATRA návrh sauny ', 'WATRA sauna design ') + `${S.w}x${S.d}`;
  // kopie výkresu přímo do <body>: při tisku je vidět jen ona (bez prázdných stránek za ní)
  let root = $('#wk-print-root'); if (!root) { root = document.createElement('div'); root.id = 'wk-print-root'; document.body.appendChild(root); }
  root.innerHTML = '<div class="wk-sheet">' + ($('#wk-sheet') ? $('#wk-sheet').innerHTML : renderSheet(LAST)) + '</div>';
  document.body.classList.add('wk-print');
  const done = () => { document.body.classList.remove('wk-print'); document.title = t0; root.innerHTML = ''; removeEventListener('afterprint', done); };
  addEventListener('afterprint', done);
  window.print();
}
// okno „Poslat návrh“: shrnutí + krátký formulář → stejný příjem jako kontaktní formulář webu
function openSend() {
  const d = $('#wk-send-dlg'), form = $('#wk-send-form');
  if (!d || !d.showModal || !form || !LAST) return false;
  const L = LAST, m = D_.models[S.m];
  $('#wk-sthumb').innerHTML = sheetPlan(L, true);
  $('#wk-sfacts').innerHTML = [[tr('Sauna', 'Sauna'), `${S.w} × ${S.d} × ${S.h} cm · ${fm3(L.V)}`], [tr('Kamna', 'Heater'), `${m.name} · ${WALL_CZ[S.sw]}${S.sh ? ' · ' + (S.sh === 1 ? tr('1 štít', '1 shield') : S.sh + tr(' štíty', ' shields')) : ''}`],
    [tr('Lavice', 'Benches'), benchCz(L)], [tr('Kontrola', 'Check'), statusHead(L)]].map(([k, v]) => `<li><span>${escH(k)}</span>${escH(v)}</li>`).join('');
  form.hidden = false; $('#wk-sdone').hidden = true;
  const s = $('#wk-sstatus'); s.textContent = ''; s.className = 'wk-sstatus';
  d.showModal();
  return true;
}
function bindSend() {
  $$('[data-wk-close]').forEach(b => b.addEventListener('click', () => { const d = b.closest('dialog'); if (d) d.close(); }));
  $$('dialog.wk-dlg').forEach(d => d.addEventListener('click', e => { if (e.target === d) d.close(); }));  // klik vedle okna zavře
  $$('[data-wk-sheet]').forEach(b => b.addEventListener('click', openSheet));
  const pr = $('#wk-print'); if (pr) pr.addEventListener('click', printSheet);
  const form = $('#wk-send-form'); if (!form) return;
  const f = n => form.elements.namedItem(n), st = $('#wk-sstatus'), btn = form.querySelector('[type=submit]');
  const say = (t, cls) => { st.textContent = t; st.className = 'wk-sstatus' + (cls ? ' ' + cls : ''); };
  const done = demo => {
    set('#wk-sdone-mail', f('email').value.trim());
    const dn = $('#wk-sdone'); let n = dn.querySelector('.wk-sdemo');
    if (demo) { if (!n) { n = document.createElement('p'); n.className = 'wk-snote wk-sdemo'; dn.insertBefore(n, dn.querySelector('.wk-sactions')); } n.textContent = demo; } else if (n) n.remove();
    form.reset(); form.hidden = true; dn.hidden = false;
  };
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (form.dataset.ready !== 'true' && window.WATRA_NAHLED) {  // demo: předvést poděkování, nic neodesílat
      if (!form.checkValidity()) { form.reportValidity(); return; }
      done(tr('Náhled webu: návrh se ve skutečnosti neodeslal. Na watra.cz odejde rovnou do WATRA.', 'Website preview: nothing was actually sent. On watra.cz it goes straight to WATRA.')); return;
    }
    if (form.dataset.ready !== 'true' || !window.WatraEnquiry || form.getAttribute('action') !== '/api/watra/enquiries') {
      say(tr('Tady se návrh neodesílá (náhled webu). Na watra.cz odejde rovnou do WATRA. Můžete použít i kontaktní formulář.', 'Sending is off here (website preview). On watra.cz it goes straight to WATRA. You can also use the contact form.'), 'warn'); return;
    }
    if (!form.checkValidity()) { form.reportValidity(); return; }
    if (f('_gotcha').value) return;
    const ph = f('phone').value.trim(), digits = ph.replace(/\D/g, '');
    if (!/^[+()\d\s./-]+$/.test(ph) || digits.length < 7 || digits.length > 15) { say(tr('Zkontrolujte prosím telefon (7–15 číslic, třeba +420 777 123 456).', 'Please check the phone number (7–15 digits, e.g. +420 777 123 456).'), 'bad'); f('phone').focus(); return; }
    const L = LAST, m = D_.models[S.m], note = f('note').value.trim();
    const data = new FormData();
    data.set('lead_type', 'customer'); data.set('language', EN ? 'en' : 'cs'); data.set('source_page', EN ? '/en/contact/' : '/cs/kontakt/');
    data.set('name', f('name').value.trim()); data.set('email', f('email').value.trim()); data.set('phone', f('phone').value.trim());
    data.set('model', m.name); data.set('_gotcha', '');
    data.set('message', ((note ? note + '\n\n' : '') + designText(L) + '\n' + tr('Výkres s rozměry a 3D: ', 'Drawing with dimensions and 3D: ') + designUrl('vykres')).slice(0, 3000));
    btn.disabled = true; say(tr('Odesíláme…', 'Sending…'));
    try {
      await window.WatraEnquiry.send(form, data);
      track('generate_lead', {lead_type: 'customer', item_id: S.m === 'e' ? 'irikon-e' : 'irikon'});
      done();
    } catch (err) {
      const c = err && err.message;
      say(c === 'rate-limit' ? tr('Odesíláte příliš často. Zkuste to prosím za chvíli.', 'Too many attempts. Please try again in a moment.')
        : c === 'verification' ? tr('Nepodařilo se ověřit, že nejste robot. Zkuste to prosím znovu.', 'We could not verify that you are not a robot. Please try again.')
        : tr('Návrh se nepodařilo odeslat. Zkuste to znovu, nebo použijte kontaktní formulář.', 'Your design could not be sent. Please try again or use the contact form.'), 'bad');
    } finally { btn.disabled = false; }
  });
}

/* ---------- PDF ke stažení (Říša 17. 11.: „tisk otevře přípravu tisku, lepší klasický download“) ----------
   Bez knihoven (CSP webu beze změny): výkres se vykreslí do canvasu A4 na šířku (půdorys jako SVG obrázek se styly výkresu,
   3D snímek, tabulka, nálezy) a zabalí do jednostránkového PDF s obrázkem JPEG. Když to prohlížeč neumí, otevře se tisk. */
const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(Error('img')); i.src = src; });
let SVG_CSS = null;
function sheetSvgCss() {  // SVG jako obrázek nevidí styly stránky → pravidla .ws-svg … z konfigurator.css se vloží do SVG
  if (SVG_CSS !== null) return SVG_CSS;
  const out = [];
  for (const sh of document.styleSheets) { let rules; try { rules = sh.cssRules; } catch (e) { continue; } for (const r of rules || []) if (r.selectorText && r.selectorText.startsWith('.ws-svg ')) out.push(r.cssText); }
  return (SVG_CSS = out.join(''));
}
function wrapLines(g, text, maxW) {
  const lines = []; let line = '';
  for (const w of String(text).split(' ')) { const t = line ? line + ' ' + w : w; if (line && g.measureText(t).width > maxW) { lines.push(line); line = w; } else line = t; }
  if (line) lines.push(line);
  return lines;
}
const drawLines = (g, lines, x, y, lh) => { lines.forEach((l, i) => g.fillText(l, x, y + i * lh)); return y + lines.length * lh; };
async function sheetCanvas(L) {
  const Wc = 2970, Hc = 2100, m = 120, c = document.createElement('canvas'); c.width = Wc; c.height = Hc;  // A4 na šířku, 10 px/mm
  const g = c.getContext('2d'), F = (px, w = 400) => `${w} ${px}px Arial, Helvetica, sans-serif`;
  g.fillStyle = '#fff'; g.fillRect(0, 0, Wc, Hc);
  // hlavička
  g.fillStyle = '#a8803c'; g.font = F(26, 700); g.fillText('W A T R A', m, m + 26);
  g.fillStyle = '#1b1b1b'; g.font = F(62); g.fillText(tr('Návrh sauny', 'Sauna design'), m, m + 100);
  g.fillStyle = '#555'; g.font = F(30); g.fillText(`${D_.models[S.m].name} · ${S.w} × ${S.d} × ${S.h} cm · ${new Date().toLocaleDateString(LOC)}`, m, m + 150);
  const col = L.bad ? '#b23a26' : L.warn ? '#8a6100' : '#3c7a2c', head = statusHead(L);
  g.font = F(30); const tw = g.measureText(head).width;
  g.strokeStyle = col; g.lineWidth = 3; g.strokeRect(Wc - m - tw - 48, m + 8, tw + 48, 66); g.fillStyle = col; g.fillText(head, Wc - m - tw - 24, m + 52);
  g.fillStyle = '#1b1b1b'; g.fillRect(m, m + 182, Wc - 2 * m, 4);
  const top = m + 230, colL = 1560, xR = m + colL + 80, wR = Wc - m - xR, foot = Hc - m - 120;
  // půdorys s kótami
  const svg = sheetPlan(L), vb = svg.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
  const sc = Math.min(colL / vb[2], (foot - top - 170) / vb[3]), pw = vb[2] * sc, ph = vb[3] * sc;
  const s2 = svg.replace('<svg ', `<svg width="${Math.round(pw)}" height="${Math.round(ph)}" `).replace(/(<svg[^>]*>)/, `$1<style>${sheetSvgCss()}</style>`);
  g.drawImage(await loadImg('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s2)), m + (colL - pw) / 2, top, pw, ph);
  let y = top + ph + 44; g.fillStyle = '#666'; g.font = F(24);
  y = drawLines(g, wrapLines(g, tr('Půdorys, rozměry v cm. Kóty: místnost, kamna k nejbližším stěnám, dveře od rohu. Lavice: délka × hloubka · výška sedáku.', 'Floor plan, dimensions in cm: room, heater to the nearest walls, door from the corner. Benches: length × depth · seat height.'), colL), m, y, 32) + 14;
  let lx = m; g.font = F(24);
  for (const [lab, draw] of [[tr('bezpečná zóna', 'safe zone'), () => { g.fillStyle = 'rgba(201,162,79,.16)'; g.fillRect(lx, y - 20, 30, 20); g.setLineDash([6, 4]); g.strokeStyle = '#c9a24f'; g.lineWidth = 2; g.strokeRect(lx, y - 20, 30, 20); g.setLineDash([]); }],
    [tr('místo na přikládání', 'space to load wood'), () => { g.setLineDash([4, 5]); g.strokeStyle = '#6f9a5f'; g.lineWidth = 2; g.strokeRect(lx, y - 20, 30, 20); g.setLineDash([]); }],
    [tr('tepelný štít', 'heat shield'), () => { g.fillStyle = '#6d7372'; g.fillRect(lx, y - 20, 30, 20); }]]) {
    draw(); g.fillStyle = '#444'; g.fillText(lab, lx + 42, y); lx += 42 + g.measureText(lab).width + 44;
  }
  // vpravo: 3D, tabulka, co doladit
  let yR = top; const img = snap3d();
  if (img) {
    const im = await loadImg(img), h = Math.min(600, wR * im.height / im.width), shh = im.width * h / wR;
    g.drawImage(im, 0, (im.height - shh) / 2, im.width, shh, xR, yR, wR, h); g.strokeStyle = '#ddd'; g.lineWidth = 2; g.strokeRect(xR, yR, wR, h); yR += h + 34;
  }
  const thW = 340;
  for (const [k, v] of sheetRows(L)) {
    g.font = F(24); const lines = wrapLines(g, v, wR - thW);
    g.fillStyle = '#444'; g.font = F(24, 700); g.fillText(k, xR, yR + 24);
    g.fillStyle = '#1b1b1b'; g.font = F(24); const yEnd = drawLines(g, lines, xR + thW, yR + 24, 31);
    yR = yEnd + 2; g.fillStyle = '#e8e8e8'; g.fillRect(xR, yR, wR, 2); yR += 10;
  }
  for (const ch of L.checks.filter(x => x.lvl === 'bad' || x.lvl === 'warn')) {
    g.font = F(23); const lines = wrapLines(g, ch.title + '. ' + ch.text, wR - 40), hh = lines.length * 30 + 22;
    yR += 8; g.fillStyle = ch.lvl === 'bad' ? '#fbeeeb' : '#fbf6ea'; g.fillRect(xR, yR, wR, hh); g.fillStyle = ch.lvl === 'bad' ? '#b23a26' : '#c99a2e'; g.fillRect(xR, yR, 6, hh);
    g.fillStyle = '#1b1b1b'; drawLines(g, lines, xR + 24, yR + 32, 30); yR += hh;
  }
  // patička
  g.fillStyle = '#dddddd'; g.fillRect(m, foot, Wc - 2 * m, 2); g.fillStyle = '#666'; g.font = F(21);
  const yf = drawLines(g, wrapLines(g, tr('Orientační návrh z konfigurátoru WATRA. Odstup od stěn je předběžný údaj WATRA, ostatní hodnoty jsou obvyklé pro kamna na dřevo podobné velikosti; vše potvrdí certifikace a návod k instalaci. Napojení na komín a elektro navrhne kominík a elektrikář.', 'Indicative design from the WATRA configurator. The wall clearance is a preliminary WATRA figure, other values are typical for wood-fired heaters of a similar size; certification and the installation manual will confirm everything. A chimney sweep and an electrician will design the flue and electrical connections.'), Wc - 2 * m), m, foot + 36, 28);
  g.fillStyle = '#999'; g.fillText(designUrl(), m, yf + 2);
  return c;
}
// jednostránkové PDF s obrázkem JPEG (A4 na šířku 842 × 595 pt), bez knihoven
function pdfFromJpeg(jpg, w, h) {
  const enc = new TextEncoder(), parts = [], offs = []; let len = 0;
  const add = x => { const b = typeof x === 'string' ? enc.encode(x) : x; parts.push(b); len += b.length; };
  const obj = (n, body) => { offs[n] = len; add(`${n} 0 obj\n${body}\nendobj\n`); };
  add('%PDF-1.4\n%âãÏÓ\n');
  obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
  obj(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  obj(3, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>');
  offs[4] = len; add(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.length} >>\nstream\n`); add(jpg); add('\nendstream\nendobj\n');
  const cs = 'q 842 0 0 595 0 0 cm /Im0 Do Q';
  obj(5, `<< /Length ${cs.length} >>\nstream\n${cs}\nendstream`);
  obj(6, `<< /Title (${EN ? 'WATRA sauna design' : 'WATRA navrh sauny'}) /Producer (WATRA configurator) >>`);
  const xref = len;
  add('xref\n0 7\n0000000000 65535 f \n' + [1, 2, 3, 4, 5, 6].map(n => String(offs[n]).padStart(10, '0') + ' 00000 n \n').join('') + `trailer\n<< /Size 7 /Root 1 0 R /Info 6 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  return new Blob(parts, {type: 'application/pdf'});
}
async function downloadPdf(btn) {
  if (!LAST) return;
  const label = btn ? btn.textContent : '';
  if (btn) { btn.disabled = true; btn.textContent = tr('Připravuji PDF…', 'Preparing PDF…'); }
  try {
    const c = await sheetCanvas(LAST), b64 = c.toDataURL('image/jpeg', .9).split(',')[1], bin = atob(b64), jpg = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) jpg[i] = bin.charCodeAt(i);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(pdfFromJpeg(jpg, c.width, c.height));
    a.download = tr('watra-navrh-sauny-', 'watra-sauna-design-') + `${S.w}x${S.d}x${S.h}.pdf`;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 5000);
  } catch (e) {
    openSheet(); printSheet();  // záloha: tisk z prohlížeče
  } finally { if (btn) { btn.disabled = false; btn.textContent = label; } }
}
// „počítá se jako …“: vysvětlení přirážky za sklo a nezateplené zdivo (Říša 17. 11.)
function volExplain(L) {
  const a = L.glass + L.masonry, add = nf1.format(D_.glassAdd);
  const parts = [L.glass > .05 && tr(`${nf1.format(L.glass)} m² skla`, `${nf1.format(L.glass)} m² of glass`), L.masonry > .05 && tr(`${nf1.format(L.masonry)} m² nezatepleného zdiva`, `${nf1.format(L.masonry)} m² of uninsulated masonry`)].filter(Boolean).join(tr(' a ', ' and '));
  return tr(`Sklo a nezateplené zdivo odvádějí teplo rychleji než zateplené dřevěné stěny. Při výběru kamen se proto ke skutečnému objemu připočítává ${add} m³ za každý m² (pravidlo výrobců saunových kamen, např. Harvia). Vaše sauna: ${fm3(L.V)} + ${add} × ${nf1.format(a)} m² (${parts}) = ${fm3(L.Veff)}.`,
    `Glass and uninsulated masonry lose heat faster than insulated timber walls. When choosing a heater, ${add} m³ is therefore added to the real volume for every m² (a rule used by sauna heater makers such as Harvia). Your sauna: ${fm3(L.V)} + ${add} × ${nf1.format(a)} m² (${parts}) = ${fm3(L.Veff)}.`);
}
function bindPdfTip() {
  $$('[data-wk-pdf]').forEach(b => b.addEventListener('click', () => downloadPdf(b)));
  const vi = $('#wk-vol-i'), tip = $('#wk-vol-tip');
  if (vi && tip) {
    vi.addEventListener('click', e => { e.stopPropagation(); tip.classList.toggle('open'); vi.setAttribute('aria-expanded', String(tip.classList.contains('open'))); });
    document.addEventListener('click', e => { if (!e.target.closest('#wk-vol-tip')) { tip.classList.remove('open'); vi.setAttribute('aria-expanded', 'false'); } });
  }
}

/* ---------- start ---------- */
readHash();
bindUI(); syncInputs();
init3d();
update();
{ // #v=sit / walk: rovnou na lavici / u dveří, #v=plan: půdorys
  const v0 = new URLSearchParams(location.hash.slice(1)).get('v');
  if (R3) setMode(v0 === 'sit' || v0 === 'walk' ? v0 : 'orbit');
  if (v0 === 'plan' || !R3) setTab('plan');
  if (v0 === 'vykres') setTimeout(openSheet, 900);
}
addEventListener('hashchange', () => { readHash(); syncInputs(); update(); });
window.WATRA_KONFIGURATOR = {S, layout, data: D_, rotate: rotateStove, update: () => { syncInputs(); update(); }, get last() { return LAST; }, get sel() { return SEL; }, get r3() { return R3; }};
})();
