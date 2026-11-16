/* ================= PELINDUNG & AKSESORI (UI) ================= */
let gFilter='all';
const gStatTxt=s=>s.hp!=null?`HP +${fmt(s.hp)} · DEF +${fmt(s.def)}`:`ATK +${fmt(s.atk)} · Crit +${s.crit}%`;
function gearSlotHTML(hid,slot){const g=gearOf(hid,slot);
 if(!g)return`<button class="eqs empty" data-act="pickGear" data-arg="${hid}:${slot}"><span class="plus">+</span><span class="eqi"><b>${T(GSLOT[slot])}</b><small>${T('Ketuk untuk memasang')}</small></span></button>`;
 const gk=S.heroes[hid][gKey(slot)],o=S.gear[gk];return`<button class="eqs r${g.r}" data-act="pickGear" data-arg="${hid}:${slot}"><img class="px" src="${gearIcon(g.id).url}"><span class="eqi"><b>${g.name}${o.ref?` ★+${o.ref}`:''} <i class="wlvt">+${o.lv}</i></b><small>${gStatTxt(gearStats(gk))}</small></span><span class="eqc">${T('Ganti')}</span></button>`}
function gearCard(gid,act='gear',arg,cnt){const g=GDD[gid],o=S.gear[gid];
 if(!o)return`<button class="wcard gcard lock" data-act="${act}" data-arg="${arg||gid}"><span class="wcls">${T(GKIND[g.kind]||GSLOT[g.slot])}</span><img class="px wi" src="${gearIcon(gid).url}"><span class="stars">${stars(g.r)}</span><span class="nm">???</span></button>`;
 const h=gearHolder(gid);return`<button class="wcard gcard r${g.r}" data-act="${act}" data-arg="${arg||gid}"><span class="wcls">${T(GKIND[g.kind]||GSLOT[g.slot])}</span>${cnt>1?`<span class="cnt">×${cnt}</span>`:''}<span class="wlv">+${o.lv}</span>${o.ref?`<span class="lbd">+${o.ref}</span>`:''}<img class="px wi" src="${gearIcon(gid).url}">${h?`<img class="px eqp" src="${portrait(h)}">`:''}<span class="stars">${stars(g.r)}</span><span class="nm">${g.name}</span></button>`}
function gearsHTML(){const f=gFilter,list=GEAR.filter(g=>f==='all'||g.slot===f);
 const own=list.filter(g=>invHas(S.gear,g.id)).sort((a,b)=>b.r-a.r),lock=list.filter(g=>!invHas(S.gear,g.id)).sort((a,b)=>b.r-a.r);
 const card=g=>gearCard(invBest(S.gear,g.id,gScore),'gear',null,invKeys(S.gear,g.id).length);
 return`${bagHTML()}${spareBarHTML('g')}<div class="filters"><button class="fbtn ${f==='all'?'on':''}" data-act="gfilter" data-arg="all">${T('Semua')}</button>${Object.keys(GSLOT).map(s=>`<button class="fbtn ${f===s?'on':''}" data-act="gfilter" data-arg="${s}">${T(GSLOT[s])}</button>`).join('')}</div>
 <div class="hgrid">${own.map(card).join('')}${lock.map(g=>gearCard(g.id)).join('')}</div>
 <p class="sub" style="text-align:center;margin-top:8px">${T('Pelindung: Tambang Bijih · Aksesori: Kuil Bintang · Bos dunia memberi item pasti.')}</p>`}
function openGearPick(hid,slot){const cur=gearOf(hid,slot),curK=S.heroes[hid][gKey(slot)],list=Object.keys(S.gear).filter(k=>GDD[k].slot===slot).sort((a,b)=>GDD[b].r-GDD[a].r||gScore(b)-gScore(a));
 modal(`<button class="btn red mclose" data-act="hero" data-arg="${hid}">‹</button><h3>${T('Pilih {s} · {h}',{s:T(GSLOT[slot]),h:HD[hid].name})}</h3><div class="sub">${T('Item yang sedang dipakai hero lain akan dipindahkan.')}</div>
 ${list.length?`<div class="pick">${list.map(k=>gearCard(k,'equipG',hid+':'+k)).join('')}</div>`:`<p class="sub">${T(slot==='armor'?'Belum punya Pelindung. Dapatkan di Tambang Bijih atau dari bos dunia!':'Belum punya Aksesori. Dapatkan di Kuil Bintang atau dari bos dunia!')}</p>`}
 ${cur?`<div class="mrow"><button class="btn blue" data-act="gear" data-arg="${curK}">${T('Tingkatkan')} ${cur.name}</button><button class="btn red" data-act="unequipG" data-arg="${hid}:${slot}">${T('Lepas')}</button></div>`:''}`)}
function openGear(gid){if(!S.gear[gid]&&invHas(S.gear,baseId(gid)))gid=invBest(S.gear,baseId(gid),gScore);const g=GDD[gid],o=S.gear[gid],bgc=g.r===3?'radial-gradient(circle,#fff6d0,#ffc860 60%,#d07a3a)':g.r===2?'radial-gradient(circle,#eef6ff,#8ac0f0 60%,#4a70b0)':'radial-gradient(circle,#fff,#d8c8a8 60%,#a08868)';
 const head=`<button class="btn red mclose" data-act="closeModal">✕</button><h3>${g.name}</h3><div class="sub">${stars(g.r)} · ${T(GSLOT[g.slot])}</div>
 <div class="hdetail"><div class="stage" style="background:${bgc}"><img class="px" style="width:150px;height:150px;${o?'':'filter:brightness(0);opacity:.4'}" src="${gearIcon(gid).url}"><div class="ped"></div></div></div>`;
 if(!o){modal(head+`<div class="stats">${Object.entries(gearStats(gid,0)).map(([k,v])=>`<div><span>${k==='crit'?'Crit':k.toUpperCase()}</span><b>+${k==='crit'?v+'%':fmt(v)}</b></div>`).join('')}</div><p class="sub">${T(g.slot==='armor'?'Belum dimiliki. Dapatkan di Tambang Bijih (Pelindung) atau dari bos dunia.':'Belum dimiliki. Dapatkan di Kuil Bintang (Aksesori) atau dari bos dunia.')}</p>`);return}
 const mx=gearMax(gid),now=gearStats(gid),nx=o.lv<mx?gearStats(gid,o.lv+1):null,c=gearUpCost(gid),ok=c&&hasCost(c),h=gearHolder(gid);
 modal(head+`<div class="wlvbox"><div class="wlvl"><b>+${o.lv}<small>/${mx}</small></b></div></div>
 <div class="stats">${Object.keys(now).map(k=>`<div><span>${k==='crit'?'Crit':k.toUpperCase()}</span><b>+${k==='crit'?now[k]+'%':fmt(now[k])}${nx?` <em class="gnx">→ ${k==='crit'?nx[k]+'%':fmt(nx[k])}</em>`:''}</b></div>`).join('')}</div>
 ${c?`<div class="sec">${T('Biaya tingkatkan')}</div><div class="lbmats">${Object.entries(c).map(([k,v])=>{const have=k==='gold'?S.gold:(S.mats[k]||0);return`<div class="lbm ${have>=v?'':'no'}">${ic(k==='gold'?'gold':MD2[k].icon,30)}<b>${k==='gold'?fmt(v):fmt(have)+'/'+fmt(v)}</b><small>${k==='gold'?T('Emas'):MD2[k].n}</small></div>`}).join('')}</div>
 <div class="mrow"><button class="btn ${ok?'green':'gray'}" data-act="gearUp" data-arg="${gid}:1" ${ok?'':'disabled'}>${T('Tingkatkan')} +1</button><button class="btn ${ok?'':'gray'}" data-act="gearUp" data-arg="${gid}:99" ${ok?'':'disabled'}>${T('Naikkan Maks')}</button></div>`
  :`<p class="sub" style="text-align:center">${T('Level maksimum!')}</p>`}
 <div class="sec">${T('Dipasang oleh')}</div>${h?`<div class="sighint"><img class="px" src="${portrait(h)}"><span><b>${HD[h].name}</b></span></div>`:`<p class="sub" style="margin:0">${T('Belum dipasang.')}</p>`}
 <div class="mrow"><button class="btn blue" data-act="gearTo" data-arg="${gid}">${h?T('Pindahkan ke Hero'):T('Pasang ke Hero')}</button>${h?`<button class="btn red" data-act="unequipG" data-arg="${h}:${g.slot}">${T('Lepas')}</button>`:''}</div>
 ${copiesHTML('g',gid)}
 <p class="sub" style="text-align:center;margin-top:6px">${T('Duplikat disimpan sebagai salinan: pasang ke hero lain, pakai untuk Tempa (+10% stat), atau lebur jadi bijih.')}</p>`)}
function openHeroPickForGear(gid){const hs=Object.keys(S.heroes).sort((a,b)=>heroPow(b)-heroPow(a));
 modal(`<button class="btn red mclose" data-act="gear" data-arg="${gid}">‹</button><h3>${T('Pasang {w}',{w:GDD[gid].name})}</h3><div class="sub">${T('Semua hero bisa memakai item ini.')}</div><div class="pick">${hs.map(h=>heroCard(h,'equipG').replace(`data-arg="${h}"`,`data-arg="${h}:${gid}"`)).join('')}</div>`)}
function gearUpUI(gid,n){let k=0;while(k<n&&doGearUp(gid))k++;if(!k){toast(T('Material tidak cukup!'),1);return}save();sfx('lvup');updateTop();toast(T('{g} naik ke +{n}!',{g:GDD[gid].name,n:S.gear[gid].lv}));openGear(gid);refreshScreen()}
