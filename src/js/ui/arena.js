/* =====================================================================
   ARENA PvP (tampilan) — layar tab 'arena', hasil pertarungan, tim bertahan, riwayat
   Mesin: systems/arena.js · angka: data/arena.js · gaya: css/arena.css
   ===================================================================== */
let arTab='opp',arTimer=null;
// lencana liga (perisai piksel per warna liga)
(function(){const sh=[[3,2],[13,2],[13,8],[8,14],[3,8]],hx=c=>c;
 ARENA_CFG.leagues.forEach((L,k)=>{ICON['lg_'+L.id]=pxIcon(K=>{K.poly(sh,L.c2);K.poly([[4,3],[12,3],[12,8],[8,12.6],[4,8]],L.c);K.rect(5,4,3,1,'#ffffffaa');K.rect(5,5,1,2,'#ffffff88');
  // tanda liga: jumlah bintang/permata kecil di tengah
  const gem=(x,y,c)=>{K.P(x,y,c);K.P(x-1,y+1,c);K.P(x+1,y+1,c);K.P(x,y+2,c);K.P(x,y+1,'#fff6dc')};
  if(k<3){for(let j=0;j<=k;j++)gem(8+(j-k/2)*3,6,L.c2)}else{gem(8,5,'#fff6dc');K.P(8,6,L.c2);if(k>=4){K.P(5,9,'#fff6dc');K.P(11,9,'#fff6dc')}if(k>=5){K.rect(6,1,1,2,'#ffd23f');K.rect(8,0,1,3,'#ffd23f');K.rect(10,1,1,2,'#ffd23f')}}},16,4)})})();
const lgIc=(p,s=16)=>`<img class="ix" src="${ICON['lg_'+arLg(p).id]}" style="width:${s}px;height:${s}px;vertical-align:-3px">`;
function arCd(ms){const h=Math.floor(ms/36e5),m=Math.floor(ms%36e5/6e4);return h>=24?T('{d} hari {h} jam',{d:Math.floor(h/24),h:h%24}):T('{h} jam {m} mnt',{h,m})}

/* ---------------- layar utama ---------------- */
function arenaHTML(){
 if(!botsWarmOk()){botsInit();botsEnsure();botsWarm(()=>{if(tab==='arena')render()});
  return`<div class="arwrap"><div class="arhead"><button class="btn red arback" data-act="go" data-arg="home">‹</button><h2 class="ot">${T('ARENA')}</h2></div><p class="sub arload">${T('Mencari lawan di Arena...')}</p></div>`}
 const A=arCheck(),nd=arDefTick();if(nd)setTimeout(()=>toast(T('Tim Bertahanmu diserang {n}× saat kamu pergi! Cek Riwayat.',{n:nd})),400);
 const k=arLeague(A.pts),L=ARENA_CFG.leagues[k],N=ARENA_CFG.leagues[k+1],pr=N?Math.max(0,Math.min(100,(A.pts-L.min)/(N.min-L.min)*100)):100;
 const tabs=[['opp',T('Lawan')],['def',T('Tim Bertahan')],['log',T('Riwayat'),A.unseen],['rw',T('Hadiah')]];
 const body={opp:arOppHTML,def:arDefHTML,log:arLogHTML,rw:arRwHTML}[arTab]||arOppHTML;
 arStartTimer();
 return`<div class="arwrap" style="--lc:${L.c};--lc2:${L.c2}">
 <div class="arhead"><button class="btn red arback" data-act="go" data-arg="home">‹</button><h2 class="ot">${T('ARENA')}</h2><span class="arsea">${ic('hourglass',13)} <span>${T('Musim berakhir dalam')}</span> <b id="arSea">${arCd(arWeekLeft())}</b></span></div>
 <div class="panel arme"><div class="rays"></div><img class="px arlg" src="${ICON['lg_'+L.id]}">
  <div class="armi"><small>${T('Liga')}</small><b class="ot">${T(L.n)}</b><span class="arpts"><b>${fmt(A.pts)}</b> ${T('poin')}</span>
   <span class="arbar"><i style="width:${pr}%"></i></span><small>${N?T('{n} poin lagi ke Liga {l}',{n:fmt(N.min-A.pts),l:T(N.n)}):T('Liga tertinggi!')}</small></div>
  <div class="arst"><button data-act="arRank"><b>#${fmt(arRank())}</b><span>${T('Peringkat')}</span></button><div><b>${A.wWins}–${A.wLoss}</b><span>${T('Menang–Kalah')}</span></div><div><b>${A.streak||0}</b><span>${T('Beruntun')}</span></div></div></div>
 <div class="artix"><span class="tk">${ic('arena',18)} ${T('Tiket {a}/{b}',{a:`<b>${A.tix}</b>`,b:ARENA_CFG.tix})}</span><small>${T('Isi ulang dalam')} <b id="arTixCd">${arCd(arDayLeft())}</b></small><span class="cp">CP <b>${fmt(teamPow())}</b></span></div>
 <div class="mtabs artabs">${tabs.map(([id,n,dot])=>`<button class="btn ${arTab===id?'':'blue'}" data-act="arTab" data-arg="${id}">${n}${dot?'<i class="dot"></i>':''}</button>`).join('')}</div>
 <div class="arbody">${body()}</div></div>`}

/* ---- lawan ---- */
function arTeamMini(st,ids){return`<div class="arteam">${ids.map(id=>`<span class="r${HD[id].r}"><img class="px" src="${portrait(id)}"><img class="px el" src="${ICON.el[HD[id].el]}"><i>${st.heroes[id].lv}</i></span>`).join('')}</div>`}
function arOppHTML(){const A=S.arena,opps=arOpps(),my=teamPow(),qk=A.wins>0;
 if(!opps.length)return`<p class="sub arload">${T('Belum ada lawan yang cocok. Coba lagi sebentar.')}</p>`;
 const cards=opps.map(o=>{const st=botState(o.i),pts=arBotPtsNow(o.i)??o.pts,L=arLg(pts),r=st.cp/Math.max(1,my),df=r<.85?['easy',T('Mudah')]:r<1.15?['even',T('Setara')]:['hard',T('Sulit')],p=botPresence(o.i);
  return`<div class="panel aropp" style="--oc:${L.c}"><span class="ardf ${df[0]}">${df[1]}</span>
  <button class="aroav" data-act="arBot" data-arg="${o.i}">${st.fav?`<img class="px" src="${portrait(st.fav)}">`:''}${p.online?'<i class="on"></i>':''}</button>
  <div class="aroi"><b>${esc(botName(o.i))}</b><span>${lgIc(pts,14)} ${T(L.n)} · <b>${fmt(pts)}</b></span><span>Lv ${st.lv} · CP <b>${fmt(st.cp)}</b></span>${arTeamMini(st,st.team)}</div>
  <div class="aroa"><span class="arex"><em class="aup">+${arDelta(A.pts,pts,true,ARENA_CFG.kAtk)}</em><em class="adn">${arDelta(A.pts,pts,false,ARENA_CFG.kAtk)}</em></span>
   <button class="btn" data-act="arFight" data-arg="${o.i}">${T('Tantang')}</button>
   <button class="btn blue sm${qk?'':' lk'}" data-act="arQuick" data-arg="${o.i}">${qk?'⏩ ':ic('lock',11)+' '}${T('Cepat')}</button></div></div>`}).join('');
 const cd=Math.max(0,Math.ceil(((A.refAt||0)+ARENA_CFG.refreshCd*1000-Date.now())/1000));
 return cards+`<div class="mrow"><button class="btn green" data-act="arRefresh"${cd?' disabled':''}>↻ ${T('Cari Lawan Lain')}${cd?` (${cd})`:''}</button><button class="btn blue" data-act="go" data-arg="team">${T('Atur Tim Serang')}</button></div>
 <p class="sub arnote">${T('Tim serangmu = formasi di menu Tim. Hero lawan dikendalikan otomatis. Waktu {s} detik: bila habis, penyerang kalah.',{s:ARENA_CFG.limit})}${qk?'':' '+T('Menangkan 1 pertarungan untuk membuka Pertarungan Cepat.')}</p>`}

/* ---- tim bertahan ---- */
function arDefHTML(){const A=S.arena,t=teamCP(A.def);
 const slot=i=>{const id=A.def[i];if(!id)return`<button class="tslot empty" data-act="arDefSlot" data-arg="${i}"><span class="ph">+</span><small>${T('Pilih hero')}</small></button>`;
  const h=HD[id],o=S.heroes[id],w=wpnOf(id);
  return`<button class="tslot r${h.r}" data-act="arDefSlot" data-arg="${i}">${eic(h.el,14)}<img class="px sp" src="${sprite(h.spr).url}">${w?`<img class="px tw" src="${weaponIcon(w.id).url}">`:''}<span class="tinfo"><b>${h.name}</b><small>Lv${o.lv} · ${ROLE[h.role].n}</small><em>CP ${fmt(heroPow(id))}</em></span></button>`};
 const held=A.log.filter(e=>e.k==='def'),hw=held.filter(e=>e.win).length;
 return`<div class="panel tcp"><span class="lbl">${T('CP TIM BERTAHAN')}</span><b class="ot">${fmt(t.total)}</b><span class="tb">${t.parts.length?t.parts.map(([n,b])=>`<i>${n} +${Math.round(b*100)}%</i>`).join(''):`<i class="no">${T('Belum ada bonus tim')}</i>`}</span></div>
 <div class="row2"><span class="rowlbl">${T('Barisan Depan')}</span><span class="rowlbl">${T('Barisan Belakang')}</span></div>
 <div class="tslots">${[0,1,2,3].map(slot).join('')}</div>
 <div class="mrow"><button class="btn blue" data-act="arDefCopy">${T('Salin Tim Utama')}</button><button class="btn green" data-act="arDefBest">${T('Formasi Terbaik')}</button></div>
 <p class="sub arnote">${T('Pemain lain bisa menyerang Tim Bertahanmu kapan saja, juga saat kamu offline. Bertahan = poin naik sedikit, kalah = poin turun.')}${held.length?' '+T('Rekor bertahan: {w} menang dari {n}.',{w:hw,n:held.length}):''}</p>`}
function arDefPick(i){const A=S.arena,ids=Object.keys(S.heroes).sort((a,b)=>heroPow(b)-heroPow(a));
 modal(`<button class="btn red mclose" data-act="closeModal">✕</button><h3>${T('Tim Bertahan · Slot {n}',{n:+i+1})}</h3><div class="pick">${ids.map(id=>heroCard(id,'arDefSet').replace(`data-arg="${id}"`,`data-arg="${i}:${id}"`)).join('')}</div>${A.def[i]?`<div class="mrow"><button class="btn red" data-act="arDefClear" data-arg="${i}">${T('Kosongkan Slot')}</button></div>`:''}`)}

/* ---- riwayat ---- */
function arLogHTML(){const A=S.arena;A.unseen=0;save();
 if(!A.log.length)return`<p class="sub arload">${T('Belum ada pertarungan. Tantang lawan pertamamu!')}</p>`;
 return`<div class="arlogs">${A.log.map(e=>{const nm=e.i<BOTS.names.length?botName(e.i,e.t):'???',st=e.i<botsVisible()?botState(e.i):null,me=e.k==='atk';
  const txt=me?(e.win?T('Kamu menang melawan'):T('Kamu kalah dari')):e.bRev?(e.win?T('Menahan balas dendam'):T('Dibalas dendam oleh')):(e.win?T('Menahan serangan'):T('Timmu dikalahkan'));
  return`<div class="arlog ${e.win?'w':'l'}"><span class="ark ${me?'atk':e.bRev?'def rv':'def'}">${me?T('SERANG'):e.bRev?T('DENDAM'):T('BERTAHAN')}</span>${st&&st.fav?`<img class="px" src="${portrait(st.fav)}">`:'<span class="noav"></span>'}
  <div class="ali"><small>${txt}</small><b>${esc(nm)}</b><small>CP ${fmt(e.cp||0)} · ${agoTxt(e.t)}</small></div><span class="ard ${e.d>=0?'aup':'adn'}">${e.d>=0?'+':''}${e.d}</span>
  ${!me&&!e.win&&!e.rev&&st?`<button class="btn sm" data-act="arRev" data-arg="${e.id}">${T('Balas')}</button>`:''}</div>`}).join('')}</div>`}

/* ---- hadiah ---- */
function arRwHTML(){const A=S.arena,k=arLeague(A.pts);
 return`<div class="arrw"><div class="arrwh"><span>${T('Liga')}</span><span>${T('Harian')}</span><span>${T('Akhir Musim')}</span></div>
 ${ARENA_CFG.leagues.map((L,i)=>`<div class="arrwr${i===k?' cur':''}" style="--lc:${L.c}"><span class="lgn"><img class="px" src="${ICON['lg_'+L.id]}"><b>${T(L.n)}</b><small>${fmt(L.min)}+</small></span><span class="mrw">${rwMini(L.day)}</span><span class="mrw">${rwMini(L.week)}</span></div>`).reverse().join('')}</div>
 <div class="panel tips"><b>${T('Aturan Arena')}</b><ul>
  <li>${T('{n} tiket per hari, terisi ulang pukul 00:00 WIB.',{n:ARENA_CFG.tix})}</li>
  <li>${T('Menang melawan lawan yang lebih kuat memberi poin lebih banyak.')}</li>
  <li>${T('Hadiah harian dikirim ke Kotak Surat besok bila kamu bertarung hari ini.')}</li>
  <li>${T('Musim berganti tiap Senin 00:00 WIB. Hadiah musim sesuai liga akhirmu, lalu poin di atas {s} dipotong setengah.',{s:fmt(ARENA_CFG.start)})}</li>
  <li>${T('Setelah {s} detik, Kemarahan Arena aktif: damage terus naik dan penyembuhan berkurang.',{s:ARENA_CFG.rage.at})}</li>
  <li>${T('Bonus CP tim (resonansi elemen, formasi seimbang, dll.) ikut menguatkan stat hero di Arena.')}</li>
  <li>${T('Tiap pertarungan: menang {a} Emas, kalah {b} Emas.',{a:fmt(ARENA_CFG.battle.win.gold),b:fmt(ARENA_CFG.battle.lose.gold)})}</li></ul></div>`}

/* ---------------- hasil pertarungan ---------------- */
function arDmgHTML(b){const col=side=>{const us=b.units.filter(u=>u.side===side),mx=Math.max(1,...us.map(u=>(u.dmg||0)+(u.healed||0)));
  return`<div class="ardm ${side}">${us.sort((x,y)=>(y.dmg||0)+(y.healed||0)-(x.dmg||0)-(x.healed||0)).map(u=>`<div class="${u.alive?'':'ko'}"><img class="px" src="${portrait(u.id)}"><span class="bar"><i style="width:${((u.dmg||0)+(u.healed||0))/mx*100}%"></i></span><b>${fmt(u.healed&&!u.dmg?u.healed:u.dmg||0)}${u.healed&&!u.dmg?' ♥':''}</b></div>`).join('')}</div>`};
 return`<div class="ardmg">${col('hero')}${col('enemy')}</div>`}
function arResHTML(res,b,quick){const A=S.arena,m=res.meta,Lb=ARENA_CFG.leagues[res.lgB],La=ARENA_CFG.leagues[res.lgA];
 const mvp=b.units.filter(u=>u.side==='hero').sort((x,y)=>(y.dmg||0)+(y.healed||0)-(x.dmg||0)-(x.healed||0))[0];
 return`${quick?`<h3 class="${res.win?'':'lose'}">${res.win?T('MENANG!'):T('KALAH...')}</h3>`:`<div class="rrib"><h3>${res.win?T('MENANG!'):T('KALAH...')}</h3></div>`}
 <div class="arvs"><span><img class="px" src="${portrait(S.team.find(Boolean))}"><b>${esc(S.name)}</b></span><i class="ot">VS</i><span><img class="px" src="${portrait(m.team[0]||'seraphine')}"><b>${esc(m.name)}</b></span></div>
 <div class="arpd"><img class="px" src="${ICON['lg_'+La.id]}"><span><b>${fmt(res.before)} → ${fmt(res.after)}</b><small>${T('Liga {l}',{l:T(La.n)})}</small></span><em class="${res.d>=0?'aup':'adn'}">${res.d>=0?'+':''}${res.d}</em></div>
 ${res.lgA>res.lgB?`<div class="arpromo up">⬆ ${T('Naik ke Liga {l}!',{l:T(La.n)})}</div>`:res.lgA<res.lgB?`<div class="arpromo dn">⬇ ${T('Turun ke Liga {l}',{l:T(La.n)})}</div>`:''}
 ${rewardHTML(res.rw)}${res.ups?`<div style="font-size:14px;color:#d2780a">⬆ ${T('Level Akun naik ke {lv}! Stamina +{s}',{lv:S.lv,s:res.ups*20})}</div>`:''}
 ${mvpHTML(mvp)}
 ${quick?arDmgHTML(b):''}
 <small class="artl">${T('Tiket tersisa {n}/{m}',{n:A.tix,m:ARENA_CFG.tix})} · ${Math.floor(b.time)}${T('d')}</small>`}
function arenaEnd(win){if(!B)return;const res=arApply(win,B.ar);sfx(win?'win':'lose');
 const o=$('#bOver');o.innerHTML=`<div class="panel res arres ${res.win?'win':'lose'}">${arResHTML(res,B,false)}<div class="mrow"><button class="btn blue" data-act="bexit">${T('Kembali ke Arena')}</button></div></div>`;o.classList.add('on')}
function arShowQuick(res,b){sfx(res.win?'win':'lose');
 modal(`<div class="arres quick">${arResHTML(res,b,true)}<div class="mrow"><button class="btn blue" data-act="arClose">${T('Kembali ke Arena')}</button></div></div>`);$('#modal .mbox').classList.add('arresbox')}

/* ---------------- pewaktu layar ---------------- */
function arStartTimer(){if(arTimer)return;arTimer=setInterval(()=>{if(tab!=='arena'){clearInterval(arTimer);arTimer=null;return}
 const a=$('#arSea'),b=$('#arTixCd');if(a)a.textContent=arCd(arWeekLeft());if(b)b.textContent=arCd(arDayLeft());
 if(B||$('#modal').classList.contains('on'))return;const A=S.arena;
 if(A&&(A.day!==wibDay()||A.wk!==arWeek())){render();return}
 if(!arStartTimer.n||Date.now()-arStartTimer.n>3e5){arStartTimer.n=Date.now();const n=arDefTick();if(n){toast(T('Tim Bertahanmu diserang {n}×! Cek Riwayat.',{n}));render()}}},20e3)}

Object.assign(ACT,{
 arena:()=>{closeModal();tab='arena';render()},
 arTab:t=>{arTab=t;render()},
 arFight:i=>arenaFight(i,false),
 arQuick:i=>{if(!(S.arena.wins>0)){toast(T('Menangkan 1 pertarungan Arena dulu untuk membuka Pertarungan Cepat.'),1);return}arenaFight(i,true)},
 arRefresh:()=>{const A=S.arena;if(Date.now()-(A.refAt||0)<ARENA_CFG.refreshCd*1000)return;A.refAt=Date.now();A.seed++;AR.at=0;arFindOpps();sfx('tap');render();setTimeout(()=>{if(tab==='arena'&&arTab==='opp'&&!B)render()},ARENA_CFG.refreshCd*1000+50)},
 arRank:()=>{rankTab='ar';openRank()},
 arBot:i=>{openBot(i);const b=$('#modal .mclose');if(b)b.dataset.act='closeModal'},
 arDefSlot:i=>arDefPick(i),
 arDefSet:a=>{const A=S.arena,[i,id]=a.split(':');const j=A.def.indexOf(id);if(j>=0)A.def[j]=A.def[i]||null;A.def[i]=id;save();closeModal();render()},
 arDefClear:i=>{const A=S.arena;if(A.def.filter(Boolean).length<=1){toast(T('Tim minimal berisi 1 hero.'),1);return}A.def[i]=null;save();closeModal();render()},
 arDefCopy:()=>{S.arena.def=S.team.slice();save();sfx('equip');toast(T('Tim utama disalin ke Tim Bertahan.'));render()},
 arDefBest:()=>{S.arena.def=bestTeam();save();sfx('equip');toast(T('Formasi terbaik dipasang! CP {cp}',{cp:fmt(teamCP(S.arena.def).total)}));render()},
 arRev:id=>{const e=S.arena.log.find(x=>x.id===+id);if(!e)return;arenaFight(e.i,false,{rev:e.id})},
 arClose:()=>{closeModal();render()},
});
