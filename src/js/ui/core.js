/* ================= UI CORE ================= */
let tab='home',heroFilter='all',misTab='daily',heroTab='hero',wFilter='all';
function toast(m,bad){if(bad)sfx('deny');const d=document.createElement('div');d.className='tst';d.textContent=m;$('#toast').appendChild(d);setTimeout(()=>d.remove(),2300)}
function modal(html){const m=$('#modal');m.dataset.key='';m.innerHTML=`<div class="mback" data-act="closeModal"></div><div class="mbox panel">${html}</div>`;m.classList.add('on');sfx('open')}
// modal yang sama dibuka ulang (mis. setelah naik level): posisi scroll dipertahankan & tanpa animasi muncul
function modalKeep(key,html){const m=$('#modal'),old=m.classList.contains('on')&&m.dataset.key===key?$('#modal .mbox'):null,sc=old?old.scrollTop:0;
 if(!old){modal(html);m.dataset.key=key;return}m.innerHTML=`<div class="mback" data-act="closeModal"></div><div class="mbox panel keep">${html}</div>`;m.dataset.key=key;$('#modal .mbox').scrollTop=sc}
// label hasil item: new | lb (Limit Break hero) | copy (salinan senjata/perlengkapan) | gm:N (permata) | lc:N (Lencana)
function tagHTML(r){const t=r.tag||'';if(t==='new')return`<span class="tg">${T('BARU')}</span>`;if(t==='lb')return`<span class="tg lb">LB+</span>`;if(t==='copy')return`<span class="tg cp">${T('SALINAN')}</span>`;
 const[k,n]=t.split(':');if(k==='gm')return`<span class="tg gm">+${n}💎</span>`;if(k==='lc')return`<span class="tg lc">+${n}${ic('badge',11)}</span>`;return''}
function closeModal(){$('#modal').classList.remove('on');$('#modal').innerHTML='';if(typeof featCheck==='function')setTimeout(featCheck,350);if(typeof tutSync==='function')setTimeout(tutSync,30)}
let confirmCb=null;
function confirmBox(t,cb,yes){yes=yes||T('Ya');confirmCb=cb;modal(`<h3>${T('Konfirmasi')}</h3><p style="font-size:15px;line-height:1.4">${t}</p><div class="mrow"><button class="btn gray" data-act="closeModal">${T('Batal')}</button><button class="btn" data-act="confirmYes">${yes}</button></div>`)}
const ic=(k,s=16)=>`<img class="ix" src="${ICON[k]}" style="width:${s}px;height:${s}px;vertical-align:-3px">`;
const eic=(e,s=14)=>`<img class="ix" src="${ICON.el[e]}" style="width:${s}px;height:${s}px">`;
const stars=n=>n>3?`<span class="sx s${n}">${'★'.repeat(n)}</span>`:'★'.repeat(n);   // ★4–★6: warna khusus (css/frames.css)
function rewardHTML(r){return`<div class="rw">${r.gems?`<span>${ic('gem')}${fmt(r.gems)}</span>`:''}${r.gold?`<span>${ic('gold')}${fmt(r.gold)}</span>`:''}${r.exp?`<span><b style="color:#2a8ad0">EXP</b> ${r.exp}</span>`:''}${r.stam?`<span>${ic('stam')}${r.stam}</span>`:''}${r.tixH?`<span>${ic('tixH')}${r.tixH} <small>${T('Tiket Hero')}</small></span>`:''}${r.tixW?`<span>${ic('tixW')}${r.tixW} <small>${T('Tiket Senjata')}</small></span>`:''}${r.hero&&HD[r.hero]?`<span class="it r${HD[r.hero].r}"><img class="px" src="${portrait(r.hero)}">${HD[r.hero].name}</span>`:''}${r.weapon&&WD[r.weapon]?`<span class="it r${WD[r.weapon].r}"><img class="px" src="${weaponIcon(r.weapon).url}">${WD[r.weapon].name}</span>`:''}${r.gear?[].concat(r.gear).filter(g=>GDD[g]).map(g=>`<span class="it r${GDD[g].r}"><img class="px" src="${gearIcon(g).url}">${GDD[g].name}</span>`).join(''):''}${r.pickHero?`<span class="it r3">${ic('summon')}${T('Pilih 1 Hero ★3')}</span>`:''}${r.mats?Object.entries(r.mats).map(([k,n])=>`<span class="it r${MD2[k].r}">${ic(MD2[k].icon,20)}${MD2[k].n} ×${n}</span>`).join(''):''}</div>`}
function grant(r){if(r.gear)r.gearGot=grantGears(r.gear);if(r.mats)addMats(r.mats);if(r.gems)S.gems+=r.gems;if(r.gold)S.gold+=r.gold;if(r.stam)S.stam+=r.stam;if(r.exp)return addExp(r.exp);return 0}

function updateTop(){regen();let t='';if(S.stam<STAM_MAX){const ms=STAM_MS-(Date.now()-S.stamTs);const s=Math.max(0,Math.ceil(ms/1000));t=T('+1 dlm {t}',{t:`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`})}
 const lead=S.team.find(Boolean)||Object.keys(S.heroes)[0],need=expNeed(S.lv);$('#top').innerHTML=`<button class="me" data-act="rename"><span class="av"><img class="px" src="${portrait(lead)}"></span><span class="lvb"><small>Lv</small>${S.lv}</span><span class="mi"><b class="ot">${esc(S.name)}</b><span class="xpbar"><i style="width:${S.exp/need*100}%"></i></span></span></button><button class="chip" data-act="refill"><img class="ix" src="${ICON.stam}"><span>${S.stam}/${STAM_MAX}</span><b>+</b>${t?`<small>${t}</small>`:''}</button><div class="chip"><img class="ix" src="${ICON.gold}"><span>${fmt(S.gold)}</span></div><button class="chip" data-act="topup"><img class="ix" src="${ICON.gem}"><span>${fmt(S.gems)}</span><b>+</b></button>`}
function missionClaimable(){checkDaily();return MISSIONS.some(m=>!S.daily.claimed[m.id]&&m.prog()>=m.goal)||ACH.some(a=>!S.ach[a.id]&&a.cond())||anyEvClaimable()}
const NAV_FEAT={summon:'summon',mission:'mission'};
function renderNav(){const items=[['home',T('Beranda')],['adv',T('Petualangan')],['team',T('Tim')],['heroes',T('Hero')],['summon',T('Summon')],['mission',T('Misi')]];const ik={home:'home',heroes:'hero',adv:'adv',summon:'summon',mission:'mission',team:'team'};
 $('#nav').innerHTML=items.map(([k,n])=>{const dot=(k==='mission'&&missionClaimable())||(k==='summon'&&S.freeDate!==today());const lk=NAV_FEAT[k]&&typeof featOK==='function'&&!featOK(NAV_FEAT[k]);return`<button class="nb ${tab===k?'on':''}${lk?' lk':''}" data-act="go" data-arg="${k}"><span class="nbi"><img class="ix" src="${ICON[ik[k]]}">${lk?`<img class="ix nblk" src="${ICON.lock}">`:''}</span><span class="nbl ot">${n}</span>${dot&&!lk?'<i class="dot"></i>':''}</button>`}).join('')}
function render(){checkDaily();tuCardTick();if(S.iap&&!TU.timer&&tuWaiting().length)tuListen();const nm=deliverMail();if(nm&&S.welcomed)setTimeout(()=>toast(T('{n} surat baru di Kotak Surat!',{n:nm})),300);updateTop();renderNav();const sc=$('#screen');sc.className=tab==='home'?'is-home':'';document.getElementById('app').dataset.tab=tab;const SCR={home:homeHTML,heroes:heroesHTML,adv:advHTML,summon:summonHTML,mission:missionHTML,team:teamHTML,arena:arenaHTML};if(!SCR[tab])tab='home';sc.innerHTML=SCR[tab]();if(tab==='home')initLobby();else lobby=null;if(typeof tutSync==='function')setTimeout(tutSync,40);if(typeof featCheck==='function')setTimeout(featCheck,450)}


/* ---- Stamina & tiket dungeon: isi ulang terbatas per hari, harga naik ---- */
const costTag=st=>st.dg?`${ic('dgtix',12)} 1`:`${ic('stam',12)} ${st.cost}`;
const stamRefills=()=>{checkDaily();return S.daily.c.refill||0};
const stamRefillCost=()=>STAM_REFILL.cost[stamRefills()]??null;
function refillUI(){const c=stamRefillCost(),n=stamRefills();
 if(c==null){toast(T('Batas isi ulang stamina hari ini habis ({n}/{m}). Kembali besok!',{n,m:STAM_REFILL.max}),1);return}
 confirmBox(`${T('Isi ulang {a} dengan {b}?',{a:ic('stam')+' '+STAM_REFILL.give+' '+T('Stamina'),b:ic('gem')+' '+c+' '+T('Permata')})}<span class="rfl">${T('Isi ulang hari ini: {n}/{m}',{n,m:STAM_REFILL.max})}${n+1<STAM_REFILL.max?` · ${T('berikutnya {c}',{c:ic('gem',12)+' '+STAM_REFILL.cost[n+1]})}`:''}</span>`,()=>{
  checkDaily();const cc=stamRefillCost();if(cc==null)return;if(S.gems<cc){toast(T('Permata tidak cukup!'),1);return}S.gems-=cc;S.stam+=STAM_REFILL.give;S.daily.c.refill=stamRefills()+1;save();updateTop();sfx('claim');toast(T('Stamina terisi!'));refreshScreen()},T('Isi'))}
function stamShort(){if(stamRefillCost()==null){toast(T('Stamina tidak cukup!')+' '+T('Batas isi ulang hari ini habis.'),1);return}toast(T('Stamina tidak cukup!'),1);refillUI()}
function dgResetUI(id){const d=DGD[id],c=dgResetCost(id),r=dgResets(id),L=dgResetList(id).length;
 if(dgLeft(id)){toast(T('Tiket masih ada. Reset hanya bisa saat tiket habis.'));return}
 if(c==null){toast(T('Tiket {d} habis dan batas reset hari ini sudah tercapai. Kembali besok!',{d:d.n}),1);return}
 confirmBox(`${T('Tiket {d} habis. Isi ulang {a} dengan {b}?',{d:'<b>'+d.n+'</b>',a:ic('dgtix')+' '+DG_TIX+' '+T('Tiket'),b:ic('gem')+' '+c+' '+T('Permata')})}<span class="rfl">${T('Reset hari ini: {n}/{m}',{n:r,m:L})}${r+1<L?` · ${T('berikutnya {c}',{c:ic('gem',12)+' '+dgResetList(id)[r+1]})}`:''}</span>`,()=>{const res=dgReset(id);if(res.err){toast(res.err,1);return}updateTop();sfx('claim');toast(T('Tiket {d} terisi!',{d:d.n}));refreshScreen()},T('Reset'))}
