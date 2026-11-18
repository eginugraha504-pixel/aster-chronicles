/* ================= ADVENTURE ================= */
const NODEPOS=[[27,85],[71,68],[30,51],[70,34],[50,15]];
let advTab='world',dgSel='mine';   // advTab: 'world' (Cerita) · 'dg' (Dungeon) · 'ev' (Event, terkunci)
// ---- rombak Petualangan v2 (18 Nov 2026): mode Cerita · Dungeon · Event(terkunci), bab & kartu dunia, peta ilustrasi ----
const ADV_CH=[{n:'BAB I',t:'Fajar Aster',w:[0,1,2,3,4]},{n:'BAB II',t:'Kebangkitan',w:[5,6,7]}];
const teamRowHTML=()=>`<button class="teamrow" data-act="go" data-arg="team"><span class="trl">${T('Tim')}</span><span class="trp">${S.team.map(id=>id?`<img class="px" src="${portrait(id)}" alt="">`:'<i></i>').join('')}</span><span class="cpb sm"><span>CP</span><b>${fmt(teamPow())}</b></span><span class="go">›</span></button>`;
const worldOpen=i=>i===0||!!S.stages[i+'-5'];
const worldStars=i=>SLIST.filter(st=>st.wi===i).reduce((a,st)=>a+(S.stages[st.key]||0),0);
// tiga mode di atas: Cerita · Dungeon · Event (event musiman belum ada → terkunci)
const advModeHTML=()=>`<div class="amode">${[['world','adv',T('Cerita')],['dg','pick',T('Dungeon')],['ev','event',T('Event')]].map(([k,icn,l])=>
 `<button class="amb${advTab===k?' on':''}${k==='ev'?' lk':''}" data-act="advMode" data-arg="${k}"><img class="ix" src="${ICON[icn]}" alt=""><b>${l}</b>${k==='ev'?`<span class="amlk"><img class="ix" src="${ICON.lock}" alt=""></span>`:''}</button>`).join('')}</div>`;
const advTabsHTML=advModeHTML;   // nama lama (dipakai layar dungeon)
function advChapHTML(){const ch=S.world>=5?1:0;
 return`<div class="achs">${ADV_CH.map((c,k)=>{const ok=worldOpen(c.w[0]);return`<button class="ach${k===ch?' on':''}${ok?'':' lk'}" data-act="world" data-arg="${c.w.find(i=>i===S.world)??(ok?Math.max(...c.w.filter(worldOpen)):c.w[0])}"><b>${c.n}</b><small>${ok?T(c.t):ic('lock',11)+' '+T('Kalahkan 5-5')}</small></button>`}).join('')}</div>
 <div class="wcar">${ADV_CH[ch].w.map(i=>{const w=WORLDS[i],ok=worldOpen(i),st=worldStars(i),bg=hasBgArt('w_'+w.art)?BGIMG_SRC['w_'+w.art]:'';
  return`<button class="wcd${i===S.world?' on':''}${ok?'':' lk'}" data-act="world" data-arg="${i}"><span class="wca"${bg?` style="background-image:url(${bg})"`:''}></span><i class="wcn">${i+1}</i><b>${w.n}</b><small>${ok?`<i>★</i> ${st}/15`:ic('lock',11)}</small>${ok&&st>=15?'<em class="wcok">✓</em>':''}</button>`}).join('')}</div>`}
function advHTML(){if(advTab==='dg')return dungeonHTML();if(advTab==='ev')return advEventHTML();
 const w=WORLDS[S.world],wi=S.world;if(!BG[w.bg+'_map'])BG[w.bg+'_map']=makeBG(w.bg,90,160).toDataURL();
 const mapBg=hasBgArt('mp_'+w.art)?BGIMG_SRC['mp_'+w.art]:hasBgArt('m_'+w.art)?BGIMG_SRC['m_'+w.art]:BG[w.bg+'_map'];
 const ns=nextStage(),list=SLIST.filter(st=>st.wi===wi),nxt=list.find(st=>unlocked(st)&&!S.stages[st.key])||null;
 const nodes=list.map((st,i)=>{const [x,y]=NODEPOS[i],lk=!unlocked(st),sr=S.stages[st.key]||0,cur=st===ns&&!lk;
  const inner=st.boss&&!lk?`<img class="px" src="${sprite(ENEMY[w.boss].spr(w.bossEl)).url}" alt="">`:lk?`<img class="ix" src="${ICON.lock}" alt="">`:`<em>${st.key}</em>`;
  return`<button class="node${st.boss?' boss':''}${lk?' lock':''}${sr?' clr':''}${cur?' cur':''}" style="left:${x}%;top:${y}%" data-act="stage" data-arg="${st.key}">${cur?'<span class="nmk"></span>':''}<span class="nb2">${inner}</span>${lk?'':`<span class="ns">${'<i>★</i>'.repeat(sr)}${'<i class="o">★</i>'.repeat(3-sr)}</span>`}<span class="nl">${st.boss?`<img class="ix" src="${ICON.boss||ICON.arena}" alt="">`:''}${st.name}</span></button>`}).join('');
 // jalur: segmen yang sudah dilalui berwarna emas, sisanya putus-putus pucat
 const pts=NODEPOS.slice(0,list.length),done=list.filter(st=>S.stages[st.key]).length;
 const seg=(a,b,c)=>`<polyline points="${pts.slice(a,b).map(([x,y])=>x+','+y).join(' ')}" fill="none" class="${c}" vector-effect="non-scaling-stroke"/>`;
 const path=seg(0,pts.length,'pth0')+seg(0,pts.length,'pth1')+(done>0?seg(0,Math.min(done+1,pts.length),'pth2'):'');
 const tp=teamPow();
 return`${advModeHTML()}${advChapHTML()}
 <div class="map${mapBg!==BG[w.bg+'_map']?' art':''}" style="background-image:url(${mapBg})"><div class="mapv"></div>
  <div class="wname"><b>${T('Dunia {n}',{n:wi+1})}</b><span><i>★</i> ${worldStars(wi)}/15</span></div>
  <svg viewBox="0 0 100 100" preserveAspectRatio="none">${path}</svg>${nodes}</div>
 ${nxt?`<div class="anext"><div class="anx"><small>${T('Tahap berikutnya')}</small><b>${nxt.key} · ${nxt.name}</b><span>CP <em class="${tp>=nxt.rec?'ok':'no'}">${fmt(tp)}</em> / ${fmt(nxt.rec)}</span></div><button class="anteam" data-act="go" data-arg="team" aria-label="${T('Tim')}">${S.team.filter(Boolean).slice(0,4).map(id=>`<img class="px" src="${portrait(id)}" alt="">`).join('')}</button><button class="btn green" data-act="stage" data-arg="${nxt.key}">${T('MAJU')}<small>${ic('stam',11)} ${nxt.cost}</small></button></div>`
  :`<div class="anext done"><div class="anx"><small>${T('Dunia selesai!')}</small><b>${worldStars(wi)>=15?T('Semua bintang terkumpul ✦'):T('Kumpulkan ★3 di semua tahap')}</b></div>${WORLDS[wi+1]?`<button class="btn blue" data-act="world" data-arg="${wi+1}">${T('Dunia {n}',{n:wi+2})} ›</button>`:''}</div>`}`}
// tab Event: battle event musiman belum tersedia — tampilan terkunci
function advEventHTML(){return`${advModeHTML()}
 <div class="evlock"><div class="evla"><span class="evlr"></span><div class="evlk"><img class="ix" src="${ICON.lock}" alt=""></div><span class="evtag">${T('SEGERA HADIR')}</span></div>
 <div class="evlt"><b>${T('Battle Event Musiman')}</b><p>${T('Pertempuran event bertema musim sedang disiapkan. Pantau Pengumuman untuk jadwal pembukaannya!')}</p>
 <div class="evlf"><span>${ic('arena',18)} ${T('Bos Musiman')}</span><span>${ic('gift',18)} ${T('Hadiah Terbatas')}</span><span>${ic('hourglass',18)} ${T('Waktu Terbatas')}</span></div></div></div>
 <p class="sub" style="text-align:center;margin-top:10px">${T('Sementara itu, event login & misi ada di menu Event beranda.')}</p>`}
function openStage(key){const st=STAGES[key];if(!unlocked(st))return toast(T('Selesaikan tahap sebelumnya dulu!'),1);const w=WORLDS[st.wi];
 const ens=[];st.waves.flat().forEach(e=>{const k=e.t+e.el;if(!ens.find(x=>x.k===k))ens.push({k,...e})});
 const tp=teamPow(),ok=tp>=st.rec;const sr=S.stages[key]||0;
 const req=[['★',T('Menang')],['★★',T('Tanpa hero gugur')],['★★★',T('Selesai ≤ 60 detik')]];
 modal(`<button class="btn red mclose" data-act="closeModal">✕</button><h3>${st.key} · ${st.name}</h3><div class="sub">${w.intro}</div>
 <div class="sec">${T('Musuh · {n} gelombang',{n:st.waves.length})}</div><div class="enrow">${ens.map(e=>`<div class="en" title="${ENEMY[e.t].n}"><img class="px" src="${sprite(ENEMY[e.t].spr(e.el)).url}"><img class="px el" src="${ICON.el[e.el]}"></div>`).join('')}</div>${elHintHTML(ens.map(e=>e.el))}
 <div class="sec">Combat Power (CP)</div><div class="box"><div class="kv"><span>${T('CP disarankan')}</span><b>${fmt(st.rec)}</b></div><div class="kv"><span>${T('CP tim kamu')}</span><b style="color:${ok?'#2a9a3a':'#e04040'}">${fmt(tp)} ${ok?'✓':'!'}</b></div></div>
 <div class="sec">${T('Hadiah')}</div>${rewardHTML({gold:st.gold,exp:st.exp,...(!sr?{gems:st.gems}:{})})}${!sr?`<div style="font-size:12px;color:var(--mut)">${ic('gem',12)} ${T('Permata hanya untuk kemenangan pertama')}</div>`:''}
 <div class="sec">${T('Target bintang')}</div><div class="starsreq">${req.map(([s,t],i)=>`<div class="${sr>i?'got':'no'}"><i>${s}</i>${t}</div>`).join('')}</div>
 <div class="mrow"><button class="btn green" data-act="start" data-arg="${key}">${T('MULAI')}<small>${ic('stam',12)} ${st.cost} ${T('Stamina')}</small></button></div>`)}
function openSlot(i){const ids=Object.keys(S.heroes).sort((a,b)=>heroPow(b)-heroPow(a));
 modal(`<button class="btn red mclose" data-act="closeModal">✕</button><h3>${T('Pilih Hero · Slot {n}',{n:+i+1})}</h3><div style="font-size:13px;color:var(--mut)">${T('Slot 1 adalah Leader. Penjaga & Petarung otomatis di barisan depan.')}</div><div class="pick">${ids.map(id=>heroCard(id,'setSlot').replace(`data-arg="${id}"`,`data-arg="${i}:${id}"`)).join('')}</div>${S.team[i]?`<div class="mrow"><button class="btn red" data-act="clearSlot" data-arg="${i}">${T('Kosongkan Slot')}</button></div>`:''}`)}


/* ================= DUNGEON ================= */
function dungeonHTML(){const d=DGD[dgSel],tp=teamPow();
 const sel=`<div class="dgsel">${DUNGEONS.map(x=>`<button class="dgc ${x.id===dgSel?'on':''} ${x.id}" data-act="dgSel" data-arg="${x.id}"${hasBgArt('w_'+x.art)?` style="--dga:url(${BGIMG_SRC['w_'+x.art]})"`:''}><span class="dgi">${ic(x.icon,34)}</span><span class="dgt"><b class="ot">${x.n}</b>${x.daily?`<em class="dgday">${T('Sisa {n}/{m}',{n:dgLeft(x.id),m:x.daily})}</em>`:''}<span class="mrw">${x.levels.some(L=>L.gold)?`<span>${ic('gold',14)}</span>`:''}${[...new Set(x.levels.flatMap(L=>Object.keys(L.drop)))].map(k=>`<span>${ic(MD2[k].icon,14)}</span>`).join('')}</span></span></button>`).join('')}</div>`;
 const head=`<div class="dghead ${d.id}"${hasBgArt('w_'+d.art)?` style="background-image:linear-gradient(90deg,rgba(30,16,8,.72),rgba(30,16,8,.35) 60%,rgba(30,16,8,.15)),url(${BGIMG_SRC['w_'+d.art]});background-size:cover;background-position:50% 62%"`:''}><div class="rays"></div><span class="dgbig">${ic(d.icon,76)}</span><div class="evtx"><span class="tg2">${T('DUNGEON')}</span>${d.daily?`<span class="tg2 day">${T('Sisa hari ini {n}/{m}',{n:dgLeft(d.id),m:d.daily})}</span>`:''}<h3>${d.n}</h3><p>${d.desc}</p></div></div>`;
 const lv=DG_STAGES.filter(st=>st.dg===d.id).map(st=>{const lk=!dgUnlocked(st),sr=S.stages[st.key]||0,ok=tp>=st.rec;
  const gp=DG_GEAR_P[st.lvl],gs=DG_GEAR[st.dg],gr=gp?[3,2,1].find(r=>gp[r]>0):0,gi=gs&&gp?GEAR.find(g=>g.slot===gs&&g.r===gr):null;
  const drops=(st.goldR?`<span class="dggold">${ic('gold',16)}${fmt(st.goldR[0])}~${fmt(st.goldR[1])}</span>`:'')+Object.entries(st.drop).map(([k,[a,b,p]])=>`<span>${ic(MD2[k].icon,16)}${p!=null?Math.round(p*100)+'%':a===b?a:(a||'0')+'~'+b}</span>`).join('')+(gi?`<span class="gch" title="${GSLOT[gs]}"><img class="px" src="${gearIcon(gi.id).url}">${Math.round(gp[0]*100)}%</span>`:'');
  if(lk)return`<div class="panel dglv lock"><span class="dgr">${ROMAN[st.lvl]}</span><div class="dgm"><b>${T('Tingkat {r}',{r:ROMAN[st.lvl]})}</b><small>${ic('lock',12)} ${T('Selesaikan tahap {k} untuk membuka',{k:st.req})}</small></div></div>`;
  return`<div class="panel dglv"><span class="dgr">${ROMAN[st.lvl]}</span><div class="dgm"><b>${T('Tingkat {r}',{r:ROMAN[st.lvl]})} <i class="dgs">${'★'.repeat(sr)}<span style="opacity:.25">${'★'.repeat(3-sr)}</span></i></b>
   <small>${T('CP disarankan')} <em style="color:${ok?'#2a9a3a':'#e04040'}">${fmt(st.rec)}</em></small><span class="mrw">${drops}</span></div>
   <div class="dgb"><button class="btn ${d.daily&&!dgLeft(d.id)?'gray':'green'}" data-act="start" data-arg="${st.key}">${T('Masuk')}<small>${ic('stam',11)} ${st.cost}</small></button>
   ${sr?`<span class="dgsw"><button class="btn blue" data-act="dgSweep" data-arg="${st.key}:1">${T('Sapu')} x1</button><button class="btn blue" data-act="dgSweep" data-arg="${st.key}:3">x3</button></span>`:''}</div></div>`}).join('');
 return`${advModeHTML()}${teamRowHTML()}${sel}${head}${lv}
 <div class="panel bagrow">${ic('bag',22)}<b>${T('Material')}</b>${MATS.map(m=>`<span title="${m.n}">${ic(m.icon,20)}${fmt(S.mats[m.id]||0)}</span>`).join('')}</div>
 <p class="sub" style="text-align:center;margin-top:8px">${T('Bintang 3 memberi peluang bonus drop. Sapu tersedia setelah tingkat diselesaikan.')}</p>`}
function dgSweepUI(key,n){const r=sweepDg(key,n);if(r.err){toast(r.err,1);return}sfx('claim');updateTop();
 modal(`<h3>${T('Sapu Selesai!')}</h3><div class="sub" style="text-align:center">${STAGES[key].name} ×${n}</div>${rewardHTML({gold:r.rw.gold,exp:r.rw.exp,mats:r.rw.mats,gear:r.rw.gear.length?r.rw.gear:null})}${r.ups?`<div class="sub" style="text-align:center;color:var(--hl)">${T('Level akun naik {n}x!',{n:r.ups})}</div>`:''}<div class="mrow"><button class="btn blue" data-act="dgSweep" data-arg="${key}:${n}">${T('Lagi x{n}',{n})}<small>${ic('stam',11)} ${STAGES[key].cost*n}</small></button><button class="btn green" data-act="closeModal">OK</button></div>`);refreshScreen()}

/* Petunjuk elemen: siapa di tim yang unggul / rawan terhadap musuh tahap ini */
function elHintHTML(els){els=[...new Set(els)];const team=S.team.filter(Boolean);
 const good=Object.keys(EL).filter(a=>els.some(d=>elMult(a,d)>1));
 const strong=team.filter(id=>els.some(d=>elMult(HD[id].el,d)>1)),weak=team.filter(id=>els.some(d=>elMult(d,HD[id].el)>1));
 const chip=e=>`<span class="elc" style="--c:${EL[e].c}"><img class="px" src="${ICON.el[e]}">${EL[e].n}</span>`;
 const hs=a=>a.map(id=>`<img class="px" src="${portrait(id)}" title="${HD[id].name}">`).join('');
 return`<div class="elhint">${good.length?`<div><span>${T('Elemen unggul')}</span>${good.map(chip).join('')}</div>`:''}
 <div><span>${T('Tim unggul')}</span>${strong.length?hs(strong):`<i>${T('tidak ada')}</i>`}${weak.length?`<span class="wk">${T('Rawan')}</span>${hs(weak)}`:''}</div></div>`}
