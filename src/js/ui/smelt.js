/* =====================================================================
   TUNGKU PELEBURAN & PASANG TERBAIK — tampilan (mesin: systems/smelt.js)
   ===================================================================== */
ICON.smelt=pxIcon(K=>{K.rect(3,9,10,5,'#5a3a22');K.rect(2,8,12,1,'#7a4a28');K.rect(4,10,8,3,'#2a1a10');K.rect(5,11,6,2,'#ff8a3c');K.rect(6,10,4,1,'#ffd23f');
 K.rect(6,3,1,2,'#ff6a3c');K.rect(8,2,1,3,'#ffd23f');K.rect(10,4,1,2,'#ff6a3c');K.rect(7,5,3,2,'#ff8a3c');K.rect(7,6,3,1,'#ffd23f');K.rect(3,14,2,1,'#3a2416');K.rect(11,14,2,1,'#3a2416')});
let SMF={r:{1:1,2:1,3:0},kinds:{w:1,g:1},up:0,sel:null};
function smIcon(it){return it.kind==='w'?weaponIcon(baseId(it.k)).url:gearIcon(baseId(it.k)).url}
function smLabel(it){const o=it.kind==='w'?S.weapons[it.k]:S.gear[it.k];return it.kind==='w'?'Lv'+o.lv:'+'+o.lv}
function openSmelt(){const all=smeltJunk({r:SMF.r,kinds:SMF.kinds,upgraded:SMF.up});if(!SMF.sel)SMF.sel=new Set(all.map(x=>x.k));
 const sel=all.filter(x=>SMF.sel.has(x.k)),sum=smeltSum(sel),D=k=>WD[k]&&S.weapons[k]?WD[k]:GDD[k],auto=S.autoSalv==null?SMELT.autoSalvDefault:S.autoSalv;
 const chip=(on,act,arg,txt)=>`<button class="fbtn ${on?'on':''}" data-act="${act}" data-arg="${arg}">${txt}</button>`;
 modalKeep('smelt',`<button class="btn red mclose" data-act="closeModal">✕</button><h3>${T('Tungku Peleburan')}</h3>
 <div class="smhead"><img class="px" src="${ICON.smelt}"><p>${T('Lebur salinan cadangan jadi <b>bijih</b>, <b>emas</b>, dan <b>material Limit Break</b>. Salinan terbaik tiap jenis dan yang sedang dipakai tidak pernah dilebur.')}</p></div>
 <div class="smf">${chip(SMF.r[1],'smR',1,'★1')}${chip(SMF.r[2],'smR',2,'★2')}${chip(SMF.r[3],'smR',3,'★3')}<i></i>${chip(SMF.kinds.w,'smK','w',T('Senjata'))}${chip(SMF.kinds.g,'smK','g',T('Perlengkapan'))}</div>
 <label class="smup"><input type="checkbox" data-act="smUp" ${SMF.up?'checked':''}> ${T('Termasuk yang sudah ditingkatkan (biayanya dikembalikan sebagian)')}</label>
 ${all.length?`<div class="smgrid">${all.map(it=>{const d=D(it.k),on=SMF.sel.has(it.k);return`<button class="smit r${d.r}${on?' on':''}" data-act="smSel" data-arg="${it.k}"><img class="px" src="${smIcon(it)}"><span class="st">${stars(d.r)}</span><span class="lv">${smLabel(it)}</span>${on?'<i>✓</i>':''}</button>`}).join('')}</div>
  <div class="smsel"><button class="fbtn" data-act="smAll" data-arg="1">${T('Pilih semua')}</button><button class="fbtn" data-act="smAll" data-arg="0">${T('Kosongkan')}</button><span>${T('{a}/{b} dipilih',{a:sel.length,b:all.length})}</span></div>`
  :`<p class="sub smempty">${T('Tidak ada salinan cadangan untuk dilebur. Bagus, gudangmu rapi!')}</p>`}
 <div class="smout"><b>${T('Hasil')}</b>${sel.length?`<div class="rw">${sum.gold?`<span>${ic('gold')}${fmt(sum.gold)}</span>`:''}${Object.entries(sum.mats).map(([x,n])=>`<span title="${MD2[x].n}">${ic(MD2[x].icon,20)}×${n}</span>`).join('')}</div>`:`<small>—</small>`}</div>
 <div class="mrow"><button class="btn ${sel.length?'green':'gray'}" data-act="smGo" ${sel.length?'':'disabled'}>${T('Lebur {n} item',{n:sel.length})}</button></div>
 <div class="sec">${T('Lebur otomatis saat dapat barang')}</div>
 <div class="smf">${chip(auto===0,'smAuto',0,T('Mati'))}${chip(auto===1,'smAuto',1,T('Salinan ★1'))}${chip(auto===2,'smAuto',2,T('Salinan ★1–★2'))}</div>
 <div class="sec">${T('Gunanya peleburan')}</div>
 <ul class="smuse"><li>${ic('ore1',16)} <b>${T('Bijih Tempa')}</b> — ${T('naikkan level senjata (Hero › Senjata) dan enhance Pelindung/Aksesori.')}</li>
 <li>${ic('gem1',16)} <b>${T('Serpihan & Kristal Bintang')}</b> — ${T('Limit Break senjata (★2 memberi Serpihan, ★3 memberi Kristal), biasanya hanya dari Kuil Bintang.')}</li>
 <li>${ic('gold',16)} <b>${T('Emas')}</b> — ${T('naik level hero & senjata.')}</li>
 <li>✦ ${T('Barang yang pernah ditingkatkan mengembalikan 80% material & 50% emas yang dipakai, dan tiap penempaan menambah setengah hasil dasar.')}</li></ul>
 <p class="sub">${T('Total dilebur: {n} barang',{n:fmt(S.smelted||0)})}</p>`)}
function smRefresh(keepSel){if(!keepSel)SMF.sel=null;openSmelt()}
Object.assign(ACT,{smelt:()=>{SMF.sel=null;openSmelt()},
 smR:r=>{SMF.r[r]=SMF.r[r]?0:1;smRefresh()},smK:k=>{SMF.kinds[k]=SMF.kinds[k]?0:1;smRefresh()},smUp:()=>{SMF.up=SMF.up?0:1;smRefresh()},
 smSel:k=>{SMF.sel.has(k)?SMF.sel.delete(k):SMF.sel.add(k);smRefresh(1)},smAll:on=>{SMF.sel=new Set(+on?smeltJunk({r:SMF.r,kinds:SMF.kinds,upgraded:SMF.up}).map(x=>x.k):[]);openSmelt()},
 smAuto:v=>{S.autoSalv=+v;save();smRefresh(1);if(+v)invAfterGain()},
 smGo:()=>{const all=smeltJunk({r:SMF.r,kinds:SMF.kinds,upgraded:SMF.up}),sel=all.filter(x=>SMF.sel.has(x.k));if(!sel.length)return;
  const go=()=>{const t=smeltDo(sel);save();sfx('coin');toast(T('{n} barang dilebur: {m}',{n:t.n,m:smTxt(t)}));SMF.sel=null;render();openSmelt()};
  const hi=sel.some(x=>(x.kind==='w'?WD:GDD)[x.k].r===3||smUpgraded(x.kind,x.k));hi?confirmBox(T('Ada barang ★3 atau yang sudah ditingkatkan di pilihan. Tetap lebur {n} barang?',{n:sel.length}),go,T('Lebur')):go()},
 eqBest:hid=>{const r=hid?autoEquipHero(hid):autoEquipTeam();save();sfx('equip');
  toast(r.ch.length?T('Perlengkapan terbaik dipasang! CP {a} → {b}',{a:fmt(r.before),b:fmt(r.after)}):T('Sudah memakai perlengkapan terbaik.'));render();if(hid&&$('#modal').classList.contains('on'))openHero(hid)},
 eqAutoT:()=>{S.autoEq=S.autoEq===false;save();toast(S.autoEq!==false?T('Pasang otomatis: ON'):T('Pasang otomatis: OFF'));render()}});
// Formasi Terbaik sekalian memasang perlengkapan terbaik
{const _at=ACT.autoTeam;ACT.autoTeam=()=>{S.team=bestTeam();autoEquipTeam();S.team=bestTeam();autoEquipTeam();save();sfx('equip');toast(T('Formasi & perlengkapan terbaik dipasang! CP {cp}',{cp:fmt(teamPow())}));render()}}
// hadiah berisi senjata/perlengkapan (dungeon, bos, surat, toko) -> pasang & lebur otomatis
{const _g=grant;grant=function(r){const v=_g(r);try{if(r&&(r.gear||r.weapon||r.pickWpn))setTimeout(()=>invAfterGain(),80)}catch(e){}return v}}
