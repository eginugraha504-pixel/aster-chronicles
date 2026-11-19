/* =====================================================================
   PANEL GM — dibuka dari Pengaturan (hanya akun GM, lihat systems/gm.js)
   ===================================================================== */
function gmPanelHTML(){const o=(k,n,d)=>`<div class="gmrow"><div><b>${n}</b><small>${d}</small></div><button class="btn ${gmOpt(k)?'green':'gray'}" data-act="gmOpt" data-arg="${k}">${gmOpt(k)?'ON':'OFF'}</button></div>`,
 a=(act,n)=>`<button class="btn gmact" data-act="${act}">${n}</button>`;
 return`<button class="btn red mclose" data-act="closeModal">✕</button><h3>🛡 ${T('Panel GM')}</h3>
 <p class="gmnote">${T('Akun testing. Tidak tampil di Peringkat pemain lain. Status GM diatur dari Telegram.')}</p>
 ${o('inf',T('Sumber daya tak terbatas'),T('Stamina, permata, emas, tiket, lencana & material selalu penuh. Tiket Dungeon & Arena tidak habis.'))}
 ${o('unl',T('Buka semua fitur & tahap'),T('Semua menu dan semua tahap petualangan bisa dimainkan tanpa syarat.'))}
 <div class="sec">${T('Aksi cepat')}</div>
 <div class="gmgrid">${a('gmHeroes',T('Dapatkan semua hero'))}${a('gmWeapons',T('Dapatkan semua senjata'))}${a('gmGear',T('Dapatkan semua perlengkapan'))}${a('gmMax',T('Level & LB maksimal'))}
 ${a('gmLv',T('Level akun +10'))}${a('gmStages',T('Tamatkan semua tahap ★3'))}${a('gmTut',T('Lewati tutorial & cerita'))}${a('gmDaily',T('Reset misi & batas harian'))}</div>
 <p class="gmnote">${T('Saat bertarung: tombol Jeda › Menang Instan.')}</p>`}
function gmDone(msg){save();sfx('claim');toast(msg);try{render()}catch(e){}if($('#modal').classList.contains('on'))modalKeep('gm',gmPanelHTML())}
Object.assign(ACT,{
 gmPanel:()=>{if(!isGM())return;modalKeep('gm',gmPanelHTML())},
 gmOpt:k=>{if(!isGM())return;S.gmo=S.gmo||{};S.gmo[k]=!gmOpt(k);gmTick();gmDone(T('Pengaturan GM disimpan.'))},
 gmHeroes:()=>{if(!isGM())return;let n=0;HEROES.forEach(h=>{if(!S.heroes[h.id]){S.heroes[h.id]={lv:1,lb:0,wpn:null};n++}});gmDone(T('{n} hero baru ditambahkan.',{n}))},
 gmWeapons:()=>{if(!isGM())return;let n=0;WEAPONS.forEach(w=>{if(!S.weapons[w.id]){S.weapons[w.id]=newWpn();n++}});gmDone(T('{n} senjata baru ditambahkan.',{n}))},
 gmGear:()=>{if(!isGM())return;let n=0;S.gear=S.gear||{};GEAR.forEach(g=>{if(!S.gear[g.id]){S.gear[g.id]={lv:0,ref:0};n++}});gmDone(T('{n} perlengkapan baru ditambahkan.',{n}))},
 gmMax:()=>{if(!isGM())return;for(const id in S.heroes){S.heroes[id].lb=DUPE_MAX}for(const id in S.heroes)S.heroes[id].lv=maxLv(id);
  for(const w in S.weapons){const o=S.weapons[w];o.lb=WPN_LB_MAX;o.lv=wMaxLv(w);o.exp=0}for(const g in S.gear||{})S.gear[g].lv=gearMax(g);gmDone(T('Semua hero, senjata & perlengkapan dibuat maksimal.'))},
 gmLv:()=>{if(!isGM())return;S.lv=Math.min(999,S.lv+10);S.exp=0;gmDone(T('Level akun sekarang {n}.',{n:S.lv}))},
 gmStages:()=>{if(!isGM())return;SLIST.forEach(st=>{S.stages[st.key]=3});const ss=storyState();STORY.forEach(s=>ss.seen[s.id]=1);ss.pend=null;gmDone(T('Semua tahap ditamatkan ★3.'))},
 gmTut:()=>{if(!isGM())return;S.tut='done';S.welcomed=true;const ss=storyState();STORY.forEach(s=>ss.seen[s.id]=1);ss.pend=null;if(typeof tutSync==='function')tutSync();gmDone(T('Tutorial & cerita ditandai selesai.'))},
 gmDaily:()=>{if(!isGM())return;S.daily={};checkDaily();S.freeDate='';if(S.arena)S.arena.tix=ARENA_CFG.tix;gmDone(T('Misi & batas harian direset.'))},
 gmWin:()=>{if(!isGM()||!B||B.state==='end')return;if(B.st.wb){const R=wbRaid(B.wbT0);R.hp=Math.round(wbBotsDmg(R,Date.now())+wbMineLive(B.wbT0)+1);B.paused=false;$('#bOver').classList.remove('on');return}B.paused=false;$('#bOver').classList.remove('on');B.units.forEach(u=>{if(u.side!=='hero'&&u.alive){u.hp=0;u.alive=false;u.deathT=.6}});B.pend=[];battleFin(true)}
});
