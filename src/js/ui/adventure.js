/* ================= ADVENTURE ================= */
const NODEPOS=[[28,79],[70,63],[32,47],[68,31],[50,17]];
let advTab='world',dgSel='mine';
const teamRowHTML=()=>`<button class="panel teamrow" data-act="go" data-arg="team"><span class="trl">${T('Tim')}</span><span class="trp">${S.team.map(id=>id?`<img class="px" src="${portrait(id)}">`:'<i></i>').join('')}</span><span class="cpb sm"><span>CP</span><b>${fmt(teamPow())}</b></span><span class="go">›</span></button>`;
const advTabsHTML=()=>`<div class="wtabs">${WORLDS.map((ww,i)=>{const ok=i===0||!!S.stages[i+'-5'];return`<button class="btn ${advTab==='world'&&i===S.world?'':'blue'} ${ok?'':'gray'}${i>=5?' b2':''}" data-act="world" data-arg="${i}" title="${ww.n}">${ok?'':ic('lock',11)}W${i+1}</button>`}).join('')}<button class="btn ${advTab==='dg'?'':'blue'} dgtab" data-act="advDg">${ic('pick',16)} ${T('Dungeon')}</button></div>`;
function advHTML(){if(advTab==='dg')return dungeonHTML();const w=WORLDS[S.world],wi=S.world;if(!BG[w.bg+'_map'])BG[w.bg+'_map']=makeBG(w.bg,90,160).toDataURL();const mapBg=hasBgArt('m_'+w.art)?BGIMG_SRC['m_'+w.art]:BG[w.bg+'_map'];
 const ns=nextStage();
 const nodes=SLIST.filter(st=>st.wi===wi).map((st,i)=>{const [x,y]=NODEPOS[i],lk=!unlocked(st),sr=S.stages[st.key]||0;const bs=st.boss?`<img class="px" src="${sprite(ENEMY[w.boss].spr(w.bossEl)).url}">`:st.key;
  return`<button class="node ${st.boss?'boss':''} ${lk?'lock':''} ${st===ns&&!lk?'cur':''}" style="left:${x}%;top:${y}%" data-act="stage" data-arg="${st.key}"><span class="ns">${lk?'':'★'.repeat(sr)+'<span style="opacity:.3">'+'★'.repeat(3-sr)+'</span>'}</span><span class="nb2">${lk?`<img class="ix" src="${ICON.lock}" style="width:26px;height:26px">`:bs}</span><span class="nl">${st.key} ${st.name}</span></button>`}).join('');
 const path=NODEPOS.map(([x,y])=>`${x},${y}`).join(' ');
 return`${teamRowHTML()}
 ${advTabsHTML()}
 <div class="map${mapBg!==BG[w.bg+'_map']?' art':''}" style="background-image:url(${mapBg})"><div class="wname">${T('Dunia {n}',{n:wi+1})}: ${w.n}</div><svg viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points="${path}" fill="none" stroke="#241626" stroke-width="2.2" stroke-dasharray="3 2" vector-effect="non-scaling-stroke" style="stroke-width:6px"/><polyline points="${path}" fill="none" stroke="#fff6dc" stroke-dasharray="3 2" style="stroke-width:3px" vector-effect="non-scaling-stroke"/></svg>${nodes}</div>`}
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
 const sel=`<div class="dgsel">${DUNGEONS.map(x=>`<button class="dgc ${x.id===dgSel?'on':''} ${x.id}" data-act="dgSel" data-arg="${x.id}"><span class="dgi">${ic(x.icon,34)}</span><span class="dgt"><b class="ot">${x.n}</b>${x.daily?`<em class="dgday">${T('Sisa {n}/{m}',{n:dgLeft(x.id),m:x.daily})}</em>`:''}<span class="mrw">${x.levels.some(L=>L.gold)?`<span>${ic('gold',14)}</span>`:''}${[...new Set(x.levels.flatMap(L=>Object.keys(L.drop)))].map(k=>`<span>${ic(MD2[k].icon,14)}</span>`).join('')}</span></span></button>`).join('')}</div>`;
 const head=`<div class="dghead ${d.id}"${hasBgArt('w_'+d.art)?` style="background-image:linear-gradient(90deg,rgba(30,16,8,.72),rgba(30,16,8,.35) 60%,rgba(30,16,8,.15)),url(${BGIMG_SRC['w_'+d.art]});background-size:cover;background-position:50% 62%"`:''}><div class="rays"></div><span class="dgbig">${ic(d.icon,76)}</span><div class="evtx"><span class="tg2">${T('DUNGEON')}</span>${d.daily?`<span class="tg2 day">${T('Sisa hari ini {n}/{m}',{n:dgLeft(d.id),m:d.daily})}</span>`:''}<h3>${d.n}</h3><p>${d.desc}</p></div></div>`;
 const lv=DG_STAGES.filter(st=>st.dg===d.id).map(st=>{const lk=!dgUnlocked(st),sr=S.stages[st.key]||0,ok=tp>=st.rec;
  const gp=DG_GEAR_P[st.lvl],gs=DG_GEAR[st.dg],gr=gp?[3,2,1].find(r=>gp[r]>0):0,gi=gs&&gp?GEAR.find(g=>g.slot===gs&&g.r===gr):null;
  const drops=(st.goldR?`<span class="dggold">${ic('gold',16)}${fmt(st.goldR[0])}~${fmt(st.goldR[1])}</span>`:'')+Object.entries(st.drop).map(([k,[a,b,p]])=>`<span>${ic(MD2[k].icon,16)}${p!=null?Math.round(p*100)+'%':a===b?a:(a||'0')+'~'+b}</span>`).join('')+(gi?`<span class="gch" title="${GSLOT[gs]}"><img class="px" src="${gearIcon(gi.id).url}">${Math.round(gp[0]*100)}%</span>`:'');
  if(lk)return`<div class="panel dglv lock"><span class="dgr">${ROMAN[st.lvl]}</span><div class="dgm"><b>${T('Tingkat {r}',{r:ROMAN[st.lvl]})}</b><small>${ic('lock',12)} ${T('Selesaikan tahap {k} untuk membuka',{k:st.req})}</small></div></div>`;
  return`<div class="panel dglv"><span class="dgr">${ROMAN[st.lvl]}</span><div class="dgm"><b>${T('Tingkat {r}',{r:ROMAN[st.lvl]})} <i class="dgs">${'★'.repeat(sr)}<span style="opacity:.25">${'★'.repeat(3-sr)}</span></i></b>
   <small>${T('CP disarankan')} <em style="color:${ok?'#2a9a3a':'#e04040'}">${fmt(st.rec)}</em></small><span class="mrw">${drops}</span></div>
   <div class="dgb"><button class="btn ${d.daily&&!dgLeft(d.id)?'gray':'green'}" data-act="start" data-arg="${st.key}">${T('Masuk')}<small>${ic('stam',11)} ${st.cost}</small></button>
   ${sr?`<span class="dgsw"><button class="btn blue" data-act="dgSweep" data-arg="${st.key}:1">${T('Sapu')} x1</button><button class="btn blue" data-act="dgSweep" data-arg="${st.key}:3">x3</button></span>`:''}</div></div>`}).join('');
 return`${teamRowHTML()}${advTabsHTML()}${sel}${head}${lv}
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
