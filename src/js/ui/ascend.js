/* =====================================================================
   UI KEBANGKITAN — pita di detail hero/senjata/perlengkapan, layar Kebangkitan, perayaan
   mesin: systems/ascend.js · gaya: css/ascend.css · bingkai: css/frames.css
   ===================================================================== */
const ASC_KIND_N={hero:'Hero',wpn:'Senjata',gear:'Perlengkapan'};
const ASC_TIER_N={4:'Ametis Kerajaan',5:'Rubi Surgawi',6:'Prisma Ilahi'};
const ascName=(kind,k)=>kind==='hero'?HD[k].name:kind==='wpn'?WD[k].name:GDD[k].name;
const ascBack=(kind,k)=>kind==='hero'?`data-act="hero" data-arg="${k}"`:kind==='wpn'?`data-act="wpn" data-arg="${k}"`:`data-act="gear" data-arg="${k}"`;
const ascArt=(kind,k)=>kind==='hero'?sprite(HD[k].spr).url:kind==='wpn'?weaponIcon(k).url:gearIcon(k).url;
// kartu mini dengan bingkai bintang tertentu (pratinjau)
function ascCardHTML(kind,k,star,big){const cls=kind==='hero'?'hcard':'wcard';
 return`<div class="${cls} r${star} acard${big?' big':''}"><img class="px ${kind==='hero'?'sp':'wi'}" src="${ascArt(kind,k)}"><span class="stars">${stars(star)}</span><span class="nm">${ascName(kind,k)}</span></div>`}
// pita ringkas di halaman detail
function ascRowHTML(kind,k){const o=ascObj(kind,k);if(!o)return'';const s=ascStar(kind,k);
 if(s>=ASC.maxStar)return`<button class="ascrow max" data-act="asc" data-arg="${kind}|${k}"><span class="ai">${ic('asc3',22)}</span><span class="at"><b>${T('Kebangkitan Sempurna')}</b><small>${stars(6)} · ${T(ASC_TIER_N[6])}</small></span></button>`;
 const can=ascCan(kind,k).ok,need=ascReqs(kind,k).filter(r=>!r.ok).length;
 return`<button class="ascrow${can?' ready':''}" data-act="asc" data-arg="${kind}|${k}"><span class="ai">${ic(s>=5?'asc3':s>=4?'asc2':'asc1',22)}</span>
  <span class="at"><b>${T('Kebangkitan')} ${stars(s)} → ${stars(s+1)}</b><small>${can?T('Siap dibangkitkan!'):need?T('{n} syarat belum terpenuhi',{n:need}):T('Bahan belum cukup')}</small></span><span class="ago">›</span>${can?'<i class="wdot"></i>':''}</button>`}
// pratinjau stat sebelum/sesudah
function ascPreview(kind,k){const o=ascObj(kind,k),s=ascStar(kind,k),keep=o.asc;const rows=[];
 const snap=()=>{if(kind==='hero'){const st=heroStats(k);return{CP:powerOf(st),HP:st.hp,ATK:st.atk,DEF:st.def,'Crit%':st.crit,cap:maxLvRaw(k)}}
  if(kind==='wpn'){const w=wpnStats(k);return{ATK:w.atk,[SUBN[w.sub]+'%']:w.subv,cap:wMaxLv(k)}}
  const g=gearStats(k),r={};for(const x in g)r[x==='crit'?'Crit%':x.toUpperCase()]=g[x];r.cap=gearMax(k);return r};
 const a=snap();o.asc=s+1;const b=snap();o.asc=keep;
 for(const x in a){if(x==='cap')continue;rows.push([x,a[x],b[x]])}
 rows.push([kind==='gear'?T('Tempa maks'):T('Level maks'),a.cap,b.cap]);return rows}
function openAsc(kind,k){const o=ascObj(kind,k);if(!o)return;const s=ascStar(kind,k);
 const back=`<button class="btn red mclose" ${ascBack(kind,k)}>‹</button>`;
 if(s>=ASC.maxStar){modal(`${back}<h3>${T('Kebangkitan Sempurna')}</h3><div class="ascstage s6">${ascCardHTML(kind,k,6,1)}</div><p class="sub" style="text-align:center">${T('{n} sudah mencapai ★6 — bintang tertinggi di Aster.',{n:ascName(kind,k)})}</p>`);return}
 const c=ascCost(kind,k),R=ascReqs(kind,k),can=ascCan(kind,k),pv=ascPreview(kind,k);
 const num=(n,x)=>/%$/.test(x)?n+'%':fmt(n);
 modal(`${back}<h3>${T('Kebangkitan {k}',{k:T(ASC_KIND_N[kind])})}</h3><div class="sub">${ascName(kind,k)}</div>
 <div class="ascstage s${s+1}"><div class="ascfrom">${ascCardHTML(kind,k,s)}</div><span class="aarr">➜</span><div class="ascto">${ascCardHTML(kind,k,s+1)}</div></div>
 <div class="asctier t${s+1}">${stars(s+1)} ${s+1>=4?`<b>${T(ASC_TIER_N[s+1])}</b>`:''}</div>
 <div class="ascpv">${pv.map(([x,a,b])=>`<div><span>${x.replace(/%$/,'')}</span><b>${num(a,x)}</b><em>➜ ${num(b,x)}</em></div>`).join('')}</div>
 <div class="sec">${T('Syarat')}</div><div class="ascreq">${R.map(r=>`<span class="${r.ok?'ok':'no'}">${r.ok?'✓':'✗'} ${r.t}</span>`).join('')}</div>
 <div class="sec">${T('Bahan')}</div><div class="lbmats">${Object.entries(c).map(([id,v])=>{const have=ascHave(id),icn=id==='gold'?'gold':MD2[id].icon;
  return`<div class="lbm ${have>=v?'':'no'}">${ic(icn,30)}<b>${fmt(v)}</b><small>${fmt(have)}</small></div>`}).join('')}</div>
 <p class="sub asctip">${T('Bahan Kebangkitan: Menara Kebangkitan (5×/hari, buka setelah 5-5), hadiah musim Arena, dan peleburan salinan ★3. Lencana Ksatria dari hero duplikat dan Menara tingkat III+.')}</p>
 <div class="mrow"><button class="btn ${can.ok?'green':'gray'} ascgo" data-act="ascGo" data-arg="${kind}|${k}" ${can.ok?'':'disabled'}>${ic('asc1',16)} ${T('Bangkitkan!')}</button></div>`)}
// perayaan setelah berhasil
function ascCelebrate(kind,k,to){sfx('rare');setTimeout(()=>sfx('win'),350);for(let i=0;i<to;i++)setTimeout(()=>sfx('star',{i}),700+i*170);
 modal(`<div class="ascwin s${to}"><div class="rays"></div><div class="ascbn">${T('TERBANGKIT!')}</div>${ascCardHTML(kind,k,to,1)}
 <div class="asctier t${to}">${stars(to)} ${to>=4?`<b>${T(ASC_TIER_N[to])}</b>`:''}</div>
 <p class="sub" style="text-align:center">${T('{n} kini ★{s}! Batas level terbuka dan kekuatannya melonjak.',{n:ascName(kind,k),s:to})}</p>
 <div class="mrow"><button class="btn blue" ${ascBack(kind,k)}>${T('Lanjut')}</button></div></div>`)}
Object.assign(ACT,{
 asc:a=>{const i=a.indexOf('|');openAsc(a.slice(0,i),a.slice(i+1))},
 ascGo:a=>{const i=a.indexOf('|'),kind=a.slice(0,i),k=a.slice(i+1),r=doAscend(kind,k);if(r.err){toast(r.err,1);sfx('deny');return}
  updateTop();ascCelebrate(kind,k,r.to);if(typeof render==='function')render()}
});
