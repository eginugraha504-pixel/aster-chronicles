/* =====================================================================
   ARENA PvP (mesin) — angka penyetel di data/arena.js, tampilan di ui/arena.js
   - Lawan: pemain bot dari Peringkat. Tim & stat bot dihitung dengan fungsi game asli
     (heroStats/teamCP) memakai state bot (botState), sama seperti profil pemain.
   - Poin bot ditentukan dari persentil CP + keaktifan bot selama musim (deterministik,
     semua orang melihat angka yang sama, naik perlahan selama minggu berjalan).
   - Pertarungan memakai mesin battle biasa: hero lawan berdiri di sisi kanan (u.ph = true).
     Mode simulasi (B.sim) menjalankan mesin tanpa layar/suara untuk Pertarungan Cepat
     dan untuk serangan bot ke Tim Bertahanmu.
   S.arena = {pts, best, wk, day, tix, wins, losses, wWins, wLoss, streak, def[], opps[], seed,
              log[], lastDef, unseen, reg, wkFought, foughtDay, refAt}
   ===================================================================== */
const arWeek=(t=Date.now())=>Math.floor((wibDay(t)+3)/7);                 // musim mulai Senin 00:00 WIB
const arWeekStart=w=>(w*7-3)*BDAY-BOT_CFG.TZ*36e5;
const arWeekLeft=(t=Date.now())=>arWeekStart(arWeek(t)+1)-t;
const arDayLeft=(t=Date.now())=>(wibDay(t)+1)*BDAY-BOT_CFG.TZ*36e5-t;
const arRage=()=>B&&B.st&&B.st.arena?1+Math.max(0,B.time-ARENA_CFG.rage.at)*ARENA_CFG.rage.per:1;
function arLeague(p){const L=ARENA_CFG.leagues;let k=0;for(let i=0;i<L.length;i++)if(p>=L[i].min)k=i;return k}
const arLg=p=>ARENA_CFG.leagues[arLeague(p)];

/* ---------------- state & pergantian hari / musim ---------------- */
function arState(){const C=ARENA_CFG,now=Date.now();
 if(!S.arena||typeof S.arena!=='object')S.arena={pts:C.start,best:C.start,wk:arWeek(now),day:wibDay(now),tix:C.tix,wins:0,losses:0,wWins:0,wLoss:0,streak:0,def:[],opps:[],seed:1,log:[],lastDef:0,unseen:0,reg:false,wkFought:-1,foughtDay:-1,refAt:0};
 const A=S.arena;
 // tim bertahan: hanya hero yang dimiliki, kosong -> salin tim utama
 A.def=(A.def||[]).slice(0,4).map(x=>x&&HD[x]&&S.heroes[x]?x:null);while(A.def.length<4)A.def.push(null);
 if(!A.def.some(Boolean))A.def=S.team.slice();
 if(!Array.isArray(A.log))A.log=[];if(!Array.isArray(A.opps))A.opps=[];
 return A}
// dipanggil setiap layar digambar: hadiah harian/mingguan lewat surat + reset tiket & poin musim
function arCheck(now=Date.now()){const A=arState(),C=ARENA_CFG,d=wibDay(now),wk=arWeek(now);let ch=false;
 if(A.day!==d){
  if(A.foughtDay===A.day){const L=arLg(A.pts),k=arLeague(A.pts);
   sendMail({id:'ar_d_'+A.day,from:T('Penjaga Arena'),title:T('Hadiah Harian Arena · Liga {l}',{l:T(L.n)}),body:T('Terima kasih sudah bertarung di Arena kemarin! Ini hadiah harian untuk Liga {l} ({p} poin).',{l:T(L.n),p:fmt(A.pts)}),rw:Object.assign({},L.day),ar:k})}
  A.day=d;A.tix=C.tix;ch=true}
 if(A.wk!==wk){
  if(A.wkFought===A.wk){const L=arLg(A.pts);
   sendMail({id:'ar_w_'+A.wk,from:T('Penjaga Arena'),title:T('Hadiah Musim Arena · Liga {l}',{l:T(L.n)}),body:T('Musim Arena telah berakhir! Kamu menutup musim di Liga {l} dengan {p} poin ({w} menang, {k} kalah). Musim baru sudah dimulai — poinmu disesuaikan ulang.',{l:T(L.n),p:fmt(A.pts),w:A.wWins,k:A.wLoss}),rw:Object.assign({},L.week)})}
  if(A.pts>C.start)A.pts=Math.round(C.start+(A.pts-C.start)*C.soft);
  A.wk=wk;A.wWins=0;A.wLoss=0;A.best=A.pts;A.opps=[];ch=true}
 if(ch)save();return A}

/* ---------------- poin bot & papan Arena ---------------- */
const AR={board:null,at:0};
// saat terakhir bot aktif (<= now); -1 bila belum pernah
function arBotLast(b,now){let t=-1;for(const[s0,s1]of b.segs){if(now<s0)break;t=Math.min(now,s1)}return t}
function arBotPts(i,pct,now){const b=botBase(i),C=ARENA_CFG,wk=arWeek(now),ws=arWeekStart(wk),t=arBotLast(b,now);if(t<ws)return null;  // belum aktif di musim ini
 const tgt=w=>{const r=bRng(bHash(i,5000+w));return Math.max(900,C.start+C.bot.span*Math.pow(pct,C.bot.curve)+(r()-.5)*C.bot.jitter)};
 const s0=b.join<ws?C.start+Math.max(0,tgt(wk-1)-C.start)*C.soft:C.start;
 const days=(t-Math.max(ws,b.join))/BDAY,f=1-Math.exp(-Math.max(0,days)*(C.bot.speed[b.pf]||.5)*.9);
 const h=Math.floor(t/36e5),wig=Math.round(Math.sin(h*1.7+i*.37)*10*f);
 return Math.max(0,Math.round(s0+(tgt(wk)-s0)*f+wig))}
function arBoard(now=Date.now()){if(AR.board&&now-AR.at<15e3)return AR.board;
 const L=botsList(now).filter(e=>!e.me),cps=L.map(e=>e.cp).sort((a,b)=>a-b),n=cps.length;
 const lb=v=>{let lo=0,hi=n;while(lo<hi){const m=(lo+hi)>>1;if(cps[m]<v)lo=m+1;else hi=m}return lo};
 const out=[];for(const e of L){const p=arBotPts(e.i,n>1?lb(e.cp)/(n-1):.5,now);if(p!=null)out.push(Object.assign(e,{pts:p}))}
 AR.board=out;AR.at=now;return out}
const arMe=()=>({me:true,name:S.name,lv:S.lv,cp:teamPow(),top:S.team.find(Boolean),online:true,last:Date.now(),pts:arState().pts});
function arRank(){const p=arState().pts;return arBoard().filter(e=>e.pts>p).length+1}
const arBotPtsNow=i=>{const e=arBoard().find(x=>x.i===i);return e?e.pts:null};

/* ---------------- pencarian lawan ---------------- */
function arFindOpps(){const A=arState(),Bd=arBoard(),me=A.pts,my=Math.max(1,teamPow()),r=bRng(bHash(+S.uid||7,9000+A.seed)),used=new Set(),out=[];
 const ok=e=>!used.has(e.i)&&botState(e.i).team.length>0;
 // 3 kartu: lebih lemah / setara / lebih kuat. Poin dekat dengan poinmu, CP disaring per kartu supaya selalu ada pilihan yang bisa dikalahkan
 ARENA_CFG.match.forEach(([lo,hi],k)=>{const[c0,c1]=ARENA_CFG.matchCp[k],mid=me+(lo+hi)/2;
  let pool=Bd.filter(e=>ok(e)&&e.cp>=my*c0&&e.cp<my*c1&&e.pts>=me+lo*3&&e.pts<me+hi*3);if(pool.length<3)pool=Bd.filter(e=>ok(e)&&e.cp>=my*c0&&e.cp<my*c1);if(!pool.length)pool=Bd.filter(ok);
  pool=pool.sort((a,b)=>Math.abs(a.pts-mid)-Math.abs(b.pts-mid)).slice(0,6);if(!pool.length)return;const e=pool[Math.floor(r()*pool.length)];used.add(e.i);out.push({i:e.i,pts:e.pts})});
 A.opps=out;save();return out}
function arOpps(){const A=arState();if(!A.opps.length||A.opps.some(o=>!(o.i<botsVisible())))arFindOpps();return A.opps}
// perubahan poin (Elo). win = hasil dari sisi "me"
function arDelta(me,opp,win,K){const C=ARENA_CFG,E=1/(1+Math.pow(10,(opp-me)/400));return win?Math.max(C.minWin,Math.round(K*(1-E))):-Math.max(C.minLose,Math.round(K*E))}

/* ---------------- membangun pertarungan ---------------- */
// stat tim untuk Arena. src = null (pemain) atau botState(i)
function arUnits(src,ids){ids=(ids||[]).filter(Boolean);const keep=S;
 if(src)S={lv:src.lv,heroes:src.heroes,weapons:src.weapons,gear:src.gear,team:ids,mats:{},sound:false};
 try{const tb=ARENA_CFG.teamBonus?1+teamCP(ids).bonus:1;
  return ids.map(id=>{const s=heroStats(id);return{id,lv:S.heroes[id].lv,hp:Math.round(s.hp*tb),atk:Math.round(s.atk*tb),def:Math.round(s.def*tb),crit:s.crit,sig:s.sig}})}
 finally{S=keep}}
function arMakeB(atk,def,o={}){const C=ARENA_CFG;
 const st={key:'arena',arena:true,name:T('Arena'),bg:C.bg,art:C.bg,waves:[[]],n:0,cost:0};
 const b={st,wave:0,time:0,units:[],proj:[],fx:[],texts:[],pend:[],state:'enter',enterT:1,auto:o.auto!=null?o.auto:S.auto,speed:o.speed||S.speed||1,paused:false,shake:0,flash:0,flashC:'#fff',g:o.g||null,nextT:0,limit:C.limit,sim:!!o.sim,ar:o.meta||{}};
 const mk=(side,list,P)=>list.slice().sort((x,y)=>ROLE[HD[y.id].role].melee-ROLE[HD[x.id].role].melee).forEach((x,i)=>{const h=HD[x.id];
  b.units.push(mkUnit(side,{id:x.id,i,ph:side==='enemy',name:h.name,el:h.el,role:h.role,skill:h.skill,sk:h.sk,mult:h.mult,spr:sprite(h.spr),hp:x.hp,maxHp:x.hp,atk:x.atk,def:x.def,crit:x.crit,sig:x.sig,
   x:P[i][0],y:P[i][1],ox:side==='enemy'?110+i*14:0,cdMax:1.25*ROLE[h.role].cd,charge:30}))});
 mk('hero',atk,HPOS);mk('enemy',def,EPOS);return b}
// jalankan pertarungan tanpa layar; hasil di b.result
function arSim(b){const keep=B;B=b;try{let n=0;while(B.state!=='end'&&n<6000){tickBattle(1/30);n++}if(B.state!=='end')B.result=false;return b}finally{B=keep}}

/* ---------------- menantang lawan ---------------- */
function arCanFight(){const A=arCheck();if(A.tix<=0){toast(T('Tiket Arena habis! Tiket terisi lagi pukul 00:00 WIB.'),1);return false}
 if(!S.team.some(Boolean)){toast(T('Tim kosong! Pilih hero dulu.'),1);return false}return true}
function arMeta(i,pts,extra){const st=botState(i);return Object.assign({opp:i,name:BOTS.names[i],pts,cp:st.cp,lv:st.lv,team:st.team.slice()},extra||{})}
function arenaFight(i,quick,extra){i=+i;if(!arCanFight())return;const A=S.arena,pts=arBotPtsNow(i)??(A.opps.find(o=>o.i===i)||{}).pts??A.pts;
 const st=botState(i),meta=arMeta(i,pts,extra),atk=arUnits(null,S.team),def=arUnits(st,st.team);if(!def.length){toast(T('Lawan belum punya tim.'),1);return}
 A.tix--;A.reg=true;save();
 if(quick){const b=arSim(arMakeB(atk,def,{sim:true,auto:true,speed:1,meta}));const res=arApply(!!b.result,meta);arShowQuick(res,b);return}
 closeModal();lobby=null;closeSplash();
 B=arMakeB(atk,def,{g:$('#bc').getContext('2d'),meta});bgArt('w_'+ARENA_CFG.bg);
 const L=arLg(pts);$('#bTitle').textContent=T('Arena')+' · '+meta.name;$('#bSub').textContent=T('Liga {l}',{l:T(L.n)})+' · '+fmt(pts)+' '+T('poin');
 battleUI();$('#bWave').textContent='VS';banner(T('VS {n}',{n:meta.name}));sfx('start')}
// catat hasil serangan pemain
function arApply(win,meta){const A=arState(),C=ARENA_CFG,before=A.pts,lgB=arLeague(before);const d=arDelta(A.pts,meta.pts,win,C.kAtk);
 A.pts=Math.max(0,A.pts+d);A.best=Math.max(A.best||0,A.pts);A.reg=true;A.wkFought=A.wk;A.foughtDay=A.day;
 if(win){A.wins++;A.wWins++;A.streak=(A.streak||0)+1}else{A.losses++;A.wLoss++;A.streak=0}
 const rw=Object.assign({},win?C.battle.win:C.battle.lose),ups=grant(rw);
 if(meta.rev!=null){const e=A.log.find(x=>x.id===meta.rev);if(e)e.rev=1}
 arLog({k:'atk',i:meta.opp,win,d,cp:meta.cp,pts:meta.pts});
 S.daily.c.arena=(S.daily.c.arena||0)+1;A.seed++;A.opps=[];AR.at=0;save();try{arFindOpps()}catch(e){}
 return{win,d,before,after:A.pts,lgB,lgA:arLeague(A.pts),rw,ups,meta}}
function arLog(e){const A=S.arena;e.t=e.t||Date.now();e.id=(A.lid=(A.lid||0)+1);A.log.unshift(e);A.log.sort((a,b)=>b.t-a.t);A.log.length=Math.min(A.log.length,30)}

/* ---------------- serangan bot ke Tim Bertahan ---------------- */
function arDefTick(now=Date.now()){const A=arState(),C=ARENA_CFG;if(!A.reg||!botsWarmOk())return 0;
 if(!A.lastDef){A.lastDef=now;save();return 0}
 const from=Math.max(A.lastDef,now-48*36e5),seed=+S.uid||7,evs=[];
 for(let h=Math.floor(from/36e5);h<=Math.floor(now/36e5);h++){const r=bRng(bHash(seed,20000+h));if(r()<C.defPerHour){const t=h*36e5+Math.floor(r()*36e5);if(t>A.lastDef&&t<=now)evs.push([t,r()])}}
 A.lastDef=now;const list=evs.slice(-C.defMax);if(!list.length){save();return 0}
 const Bd=arBoard(now),def=arUnits(null,A.def);let n=0;
 const dcp=teamCP(A.def).total;
 for(const[t,rv]of list){if(!def.length)break;const near=Bd.filter(e=>Math.abs(e.pts-A.pts)<=250&&botState(e.i).team.length);
  // penyerang dicari seperti matchmaking sungguhan: poin mirip, CP tidak terlalu jauh dari Tim Bertahanmu
  let pool=near.filter(e=>e.cp>=dcp*.75&&e.cp<=dcp*1.3);if(pool.length<3)pool=near;if(!pool.length)pool=Bd.slice().sort((a,b)=>Math.abs(a.pts-A.pts)-Math.abs(b.pts-A.pts)).slice(0,10);if(!pool.length)break;
  const e=pool[Math.floor(rv*pool.length)],st=botState(e.i),atk=arUnits(st,st.team);if(!atk.length)continue;
  const b=arSim(arMakeB(atk,def,{sim:true,auto:true,speed:1})),held=!b.result;
  const E=1/(1+Math.pow(10,(e.pts-A.pts)/400)),d=held?Math.max(2,Math.round(C.kDef*(1-E))):-Math.max(C.minLose,Math.round(C.kDef*E));
  A.pts=Math.max(0,A.pts+d);arLog({k:'def',t,i:e.i,win:held,d,cp:st.cp,pts:e.pts});n++}
 A.unseen=(A.unseen||0)+n;AR.at=0;save();return n}
