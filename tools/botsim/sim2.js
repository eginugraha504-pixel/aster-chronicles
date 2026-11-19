// ===== Simulasi pemain v2: memainkan logika game ASLI secara headless, mengikuti alur game terkini =====
// Beda dari sim.js: anggaran waktu per sesi, cerita (dibaca / dilewati), Sapu tahap, dungeon harian,
// Bos Dunia, Arena, dan tiga tingkat pengalaman pemain: baru / biasa / veteran.
(function(){
const _D=Date;let OFF=0;
class FD extends _D{constructor(...a){if(a.length)super(...a);else super(_D.now()+OFF)}static now(){return _D.now()+OFF}}
window.Date=FD;
window.setTimeout=(f,ms)=>0;window.requestAnimationFrame=()=>0;
const SIM=window.SIM={log:[],ms:{},play:0,battles:0,wins:0,losses:0,sweeps:0,summons:0,day:0,sessions:0,storyT:0,wbN:0,arN:0,
 counts:{story:0,dg:0,replay:0,sweep:0},seen:{},failed:{},skill:'biasa',len:[8,22],hrs:[8,13,18,22],seed:1,
 // pembelanja (null = F2P): gems = permata top up per hari, refill = isi ulang stamina per hari, dgr = reset dungeon per jenis per hari
 tier:null,refills:0,dgResets:0,gemsPaid:0};
const TIERS={whale:{gems:3000,refill:3,dgr:2},swhale:{gems:7000,refill:5,dgr:5},mwhale:{gems:15000,refill:5,dgr:5}};
let rs=1;const rng=()=>{rs=(rs+0x6D2B79F5)>>>0;let t=rs;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296};
// ---- tingkat pengalaman ----
// spd: kecepatan tempur; story: read/half/skip; readS: detik per baris dialog; over: detik menu per sesi; load: detik muat per tempur;
// claimP: peluang mengklaim misi/surat tiap sesi; dgP: peluang memakai tiket dungeon sesi ini; sweep: memakai Sapu tahap;
// wbP: peluang ikut Bos Dunia bila sedang main di jamnya; arP: peluang main Arena hari itu; arWin: peluang menang Arena;
// lg: [liga awal, kenaikan per minggu, liga maks]; contrib: peti kontribusi Bos Dunia; single: tarik ×1 kalau permata kurang;
// stdP: peluang menarik di banner standar; bench: ikut menaikkan level hero cadangan; tut: detik tutorial di sesi pertama
const SKL={
 baru:   {spd:d=>d<2?1:2,story:'read',readS:6,over:200,load:12,claimP:.75,dgP:.45,sweep:0,  wbP:.3, arP:.55,arWin:.4, lg:[0,.4,1],contrib:-1,single:1,stdP:.35,bench:.6,tut:420},
 biasa:  {spd:()=>2,     story:'half',readS:5,over:120,load:8, claimP:.95,dgP:.8, sweep:.5, wbP:.6, arP:.85,arWin:.55,lg:[1,.5,3],contrib:2, single:0,stdP:.1, bench:.25,tut:300},
 veteran:{spd:()=>3,     story:'skip',readS:0,over:60, load:5, claimP:1,  dgP:1,  sweep:1,  wbP:.95,arP:1,  arWin:.7, lg:[2,1,4], contrib:1, single:0,stdP:0,  bench:0,  tut:150},
};
// ---- belajar: pemula perlahan jadi seperti pemain biasa (±10 hari), pemain biasa mendekati veteran (±25 hari) ----
// ops (0..1): kebiasaan memakai fitur pendukung: toko emas, lebur, pasang otomatis, tingkatkan perlengkapan, kebangkitan
SKL.baru.ops=0;SKL.biasa.ops=.5;SKL.veteran.ops=1;SKL.baru.skip=0;SKL.biasa.skip=.5;SKL.veteran.skip=1;
const NUM=['readS','over','load','claimP','dgP','sweep','wbP','arP','arWin','stdP','bench','single','ops','skip','contrib'];
let KC=null,KD=-1;
function K(){if(KD===SIM.day&&KC)return KC;const b=SKL[SIM.skill],d=SIM.day;let to=null,t=0;
 if(SIM.skill==='baru'){to=SKL.biasa;t=Math.min(1,Math.max(0,(d-1)/10))}else if(SIM.skill==='biasa'){to=SKL.veteran;t=Math.min(.6,d/25*.6)}
 const k=Object.assign({},b);if(to)for(const x of NUM)k[x]=b[x]+(to[x]-b[x])*t;
 k.contrib=Math.round(k.contrib);k.spd=SIM.skill==='baru'?(dd=>dd<2?1:dd<7?2:3):SIM.skill==='biasa'?(dd=>dd<6?2:3):(()=>3);
 k.story=SIM.skill==='veteran'?'skip':'mix';KC=k;KD=d;return k}
const mark=(k)=>{if(!SIM.ms[k])SIM.ms[k]={day:SIM.day,hours:+(SIM.play/3600).toFixed(1),sessions:SIM.sessions}};
const use=s=>{SIM.tt+=s;SIM.play+=s};
const timeLeft=()=>SIM.tt<SIM.budget;
// ---- cerita: adegan dibaca atau dilewati, waktu dihitung ----
function readScene(s){if(!s||SIM.seen[s.id])return;SIM.seen[s.id]=1;try{storyState().seen[s.id]=1}catch(e){}
 const n=s.L.filter(Array.isArray).length,k=K();let sec=rng()<k.skip?4:n*k.readS;use(sec);SIM.storyT+=sec}
window.storyPre=(key,go)=>{if(!S.stages[key])for(const s of scenesAt(key,'pre'))readScene(s);return false};
window.storyPostFor=key=>{for(const s of scenesAt(key,'post'))readScene(s)};
function fight(key){const st=STAGES[key];if(S.stam<st.cost)return null;
 const before=S.stages[key]||0;startBattle(key);if(!B)return null;B.auto=true;B.speed=1;
 let guard=0;while(B&&B.state!=='end'&&guard<20000){tickBattle(1/20);guard++}
 const win=B&&!alive('enemy').length&&alive('hero').length>0;const gt=B?B.time:150;
 endBattle(win);B=null;$('#battle').classList.remove('on');
 SIM.battles++;win?SIM.wins++:SIM.losses++;use(gt/K().spd(SIM.day)+K().load);return{win,gt,stars:S.stages[key]||0,before}}
const pickH=()=>pickPool(3).sort((a,b)=>!!S.heroes[a.id]-!!S.heroes[b.id])[0];
function claimAll(){deliverMail();
 for(const id of mailList()){const o=S.mail[id],d=mailDef(id);if(o.claimed)continue;if(d.rw&&d.rw.pickHero)claimMail(id,pickH().id);else claimMail(id)}
 for(const e of EVENTS)if(evActive(e))for(const t of evTasks(e))if(t.ok&&!t.done)claimEv(e.id,t.key,t.rw.pickHero?pickH().id:null);
 for(const m of MISSIONS)if(!S.daily.claimed[m.id]&&m.prog()>=m.goal){S.daily.claimed[m.id]=1;grant(m.rw)}
 for(const a of ACH)if(!S.ach[a.id]&&a.cond()){S.ach[a.id]=1;grant(a.rw)}}
function summonAll(){const k=K(),hb=BANNERS.findIndex(b=>!b.weapon&&b.rateUp),sb=BANNERS.findIndex(b=>!b.weapon&&!b.rateUp),wb=BANNERS.findIndex(b=>b.weapon);
 if(S.freeDate!==today()){S.freeDate=today();pullItems(BANNERS[hb],1);S.daily.c.summon++;evCount('summon',1);SIM.summons++;use(10)}
 const pull=(bi,n,tk)=>{const b=BANNERS[bi];if(tk&&S[tk]>=n)S[tk]-=n;else if(S.gems>=(n===10?COST10:COST1))S.gems-=(n===10?COST10:COST1);else return false;pullItems(b,n);S.daily.c.summon+=n;evCount('summon',n);SIM.summons+=n;use(n===10?14:6);return true};
 const hBan=()=>rng()<k.stdP?sb:hb;
 while(S.tixH>=10)pull(hBan(),10,'tixH');while(S.tixH>=1)pull(hBan(),1,'tixH');while(S.tixW>=10)pull(wb,10,'tixW');while(S.tixW>=1)pull(wb,1,'tixW');
 while(S.gems>=COST10){const allH=HEROES.every(h=>S.heroes[h.id]);
  if(allH&&Object.values(S.heroes).every(o=>o.lb>=5)&&new Set(Object.keys(S.weapons).map(baseId)).size===WEAPONS.length)break;pull(allH?wb:hBan(),10)}
 // pemula: tidak sabar menabung, tarik satu-satu
 if(rng()<k.single)while(S.gems>=COST1)pull(hBan(),1)}
function shopping(){const k=K();
 for(let n=0;n<30;n++){const h=pickPool(3).find(x=>!S.heroes[x.id]);const w=pickWpnPool(3).find(x=>!invHas(S.weapons,x.id)&&x.owner&&S.heroes[x.owner]);
  if(h&&S.badge>=300){shopXBuy('xh3',h.id);continue}if(w&&S.badge>=200){shopXBuy('xw3',w.id);continue}
  const t=['xtixH','xtixW'].map(id=>SHOP_X.find(x=>x.id===id)).find(it=>shopXLeft(it)>0&&S.badge>=it.cost);if(!t)break;shopXBuy(t.id)}
 // toko emas: yang paham membeli bijih tiap hari (senjata = sumber CP besar) dan stamina ekstra untuk disapu jadi EXP
 if(rng()<k.ops){const pri=['ore2','ore1','stam','gem1','ore3','gem2','gem3','tixH','tixW'];for(const id of pri){const it=SHOP.find(i=>i.id===id);if(!it)continue;
   const keep=id==='stam'?60000:id[0]==='t'?150000:40000;while(shopLeft(it)>0&&S.gold-it.cost>keep&&(id!=='stam'||S.stam<stamMax()*2)){if(!shopBuy(it.id).ok)break}}
  for(const id of['xore3','xgem3']){const it=SHOP_X.find(x=>x.id===id);while(it&&shopXLeft(it)>0&&S.badge>=it.cost+300)shopXBuy(id)}}
 else{for(let n=0;n<4;n++){const L=SHOP.filter(i=>shopLeft(i)>0&&S.gold-i.cost>120000);if(!L.length)break;shopBuy(L[Math.floor(rng()*L.length)].id)}}}
// fitur pendukung: pasang otomatis, lebur barang sampah, tingkatkan perlengkapan, kebangkitan ★4+
function support(){const k=K();if(rng()>k.ops)return;use(20);
 try{if(typeof autoEquipTeam==='function')autoEquipTeam()}catch(e){}
 try{if(featOK('smelt')&&typeof smeltJunk==='function'){const L=smeltJunk({r:{1:1,2:1}});if(L.length)smeltDo(L)}}catch(e){}
 const team=S.team.filter(Boolean);
 for(const h of team)for(const s of['ar','ac']){const g=S.heroes[h][s];if(!g||!S.gear[g])continue;for(let n=0;n<30&&S.gold>60000;n++)if(!doGearUp(g))break}
 if(typeof doAscend==='function')for(let n=0;n<8;n++){let any=false;for(const h of team){if(ascCan('hero',h).ok){doAscend('hero',h);any=true;SIM.asc=(SIM.asc||0)+1}
   const w=S.heroes[h].wpn;if(w&&S.weapons[w]&&ascCan('wpn',w).ok){doAscend('wpn',w);any=true;SIM.asc=(SIM.asc||0)+1}}if(!any)break}}
function potTeam(){const ids=Object.keys(S.heroes).sort((a,b)=>maxLvRaw(b)-maxLvRaw(a)||heroPow(b)-heroPow(a));const t=[];
 if(SIM.skill!=='baru')for(const r of ['tanker','support']){const x=ids.find(id=>HD[id].role===r);if(x)t.push(x)}
 for(const id of ids){if(t.length>=4)break;if(!t.includes(id))t.push(id)}while(t.length<4)t.push(null);return t}
function upgrade(){const k=K();S.team=potTeam();const team=S.team.filter(Boolean);
 const taken=new Set();for(const h of [...team].sort((a,b)=>!!S.weapons[(WEAPONS.find(w=>w.owner===b)||{}).id]-!!S.weapons[(WEAPONS.find(w=>w.owner===a)||{}).id])){const best=WEAPONS.filter(w=>w.cls===HD[h].wcls&&S.weapons[w.id]&&!taken.has(w.id)).sort((a,b)=>(b.owner===h)-(a.owner===h)||b.r-a.r||(S.weapons[b.id].lv-S.weapons[a.id].lv))[0];if(best){taken.add(best.id);if(S.heroes[h].wpn!==best.id){for(const x in S.heroes)if(S.heroes[x].wpn===best.id)S.heroes[x].wpn=null;S.heroes[h].wpn=best.id}}}
 if(SIM.skill!=='baru')for(const h of team){const w=S.heroes[h].wpn;if(w)while(refineWpn(w));for(const s of ['ar','ac']){const g=S.heroes[h][s];if(g)while(refineGear(g));}}
 // pemula: sebagian emas habis untuk hero cadangan
 if(k.bench){const bench=Object.keys(S.heroes).filter(id=>!team.includes(id));const tl=Math.max(...team.map(id=>S.heroes[id].lv));
  for(let g=0;g<200&&bench.length;g++){if(rng()>k.bench)break;const c=bench.filter(id=>S.heroes[id].lv<Math.min(maxLv(id),tl))[Math.floor(rng()*bench.length)];if(!c)continue;const cost=lvCost(S.heroes[c].lv);if(S.gold<cost)break;S.gold-=cost;S.heroes[c].lv++;S.daily.c.lvup++;evCount('lvup',1)}}
 for(let g=0;g<400;g++){const c=team.filter(id=>S.heroes[id].lv<maxLv(id)).sort((a,b)=>S.heroes[a].lv-S.heroes[b].lv)[0];if(!c)break;const cost=lvCost(S.heroes[c].lv);if(S.gold<cost)break;S.gold-=cost;S.heroes[c].lv++;S.daily.c.lvup++;evCount('lvup',1)}
 for(const h of team){const w=S.heroes[h].wpn;if(!w)continue;for(let n=0;n<6;n++){if(canLB(w)){doWpnLB(w);continue}if(wAtLvCap(w))break;const p=autoOres(w);if(!Object.keys(p).length)break;const r=useOres(w,p);if(r.err)break}}
 S.team=potTeam();use(k.over*.25)}
// ---- dungeon: apa yang dibutuhkan ----
function dgNeed(){const team=S.team.filter(Boolean),needOre=team.some(h=>S.heroes[h].wpn&&!wAtLvCap(S.heroes[h].wpn)),
 needLB=team.some(h=>{const w=S.heroes[h].wpn;return w&&S.weapons[w].lb<WPN_LB_MAX}),needGold=team.some(h=>S.heroes[h].lv<maxLv(h));return{needOre,needLB,needGold}}
window.dgBest=dgBest;function dgBest(id,tp){return DG_STAGES.filter(s=>s.dg===id&&dgUnlocked(s)&&!SIM.failed[s.key]&&(S.stages[s.key]||tp>=s.rec*.85)).pop()}
function doDungeons(){const k=K();if(!featOK('dungeon'))return;const tp=teamPow(),N=dgNeed();
 const all=rng()<k.ops,ids=['mine','shrine','vault','tower'].filter(id=>all||(id==='mine'?N.needOre:id==='shrine'?N.needLB:id==='vault'?N.needGold:false));
 for(const id of ids){if(!timeLeft())return;if(rng()>k.dgP)continue;let left=dgLeft(id);
  const T=SIM.tier&&TIERS[SIM.tier];
  for(let rr=0;rr<6;rr++){if(rr){if(!T||dgResets(id)>=T.dgr||!timeLeft())break;const r=dgReset(id);if(r.err)break;SIM.dgResets++;use(3);left=dgLeft(id)}
  while(left>0&&timeLeft()){const st=dgBest(id,tp);if(!st)break;
   if(S.stages[st.key]&&k.sweep>=.5){const r=sweepDg(st.key,left);if(r.err)break;SIM.sweeps+=left;SIM.counts.dg+=left;use(4);left=0;break}
   const r=fight(st.key);if(!r)break;SIM.counts.dg++;left=dgLeft(id);if(!r.win){SIM.failed[st.key]=SIM.day+2;break}}}}}
// ---- Bos Dunia (Lv8): 10 menit, hadiah peringkat bawah + peti kontribusi; tidak disimulasikan pertarungannya ----
function doWB(hr){const k=K();if(S.lv<WB_CFG.lv)return;SIM.wbDone=SIM.wbDone||{};
 // ikut slot terdekat (veteran mengatur jam main supaya pas jadwal naga)
 const sl=WB_CFG.slots.find(x=>Math.abs(x-hr)<=(SIM.skill==='veteran'?2:1)&&!SIM.wbDone[SIM.day+':'+x]);if(sl==null)return;SIM.wbDone[SIM.day+':'+sl]=1;if(rng()>k.wbP)return;
 SIM.wbN++;const wd=WB_CFG.dur>1e4?WB_CFG.dur/1e3:WB_CFG.dur*60;use(wd);SIM.budget+=wd;const rw={...WB_RW.rank[WB_RW.rank.length-1].rw};
 if(k.contrib>=0){const c=WB_RW.contrib[k.contrib].rw;for(const x in c)rw[x]=(rw[x]||0)+c[x]}
 const m={};for(const x in rw)if(x!=='gold'&&x!=='gems')m[x]=rw[x];addMats(m);S.gold+=rw.gold||0;S.gems+=rw.gems||0}
// ---- Arena (Lv10): 5 tiket per hari, hadiah harian & mingguan sesuai liga ----
function league(){const k=K(),w=Math.floor(SIM.day/7);return Math.min(k.lg[2],Math.floor(k.lg[0]+w*k.lg[1]))}
function doArena(){const k=K();if(S.lv<10||SIM.arDay===SIM.day||!timeLeft())return;SIM.arDay=SIM.day;if(rng()>k.arP)return;SIM.arPlayed=SIM.day;
 const C=ARENA_CFG;for(let n=0;n<C.tix;n++){const win=rng()<k.arWin,b=win?C.battle.win:C.battle.lose;S.gold+=b.gold;addExp(b.exp);use(40/k.spd(SIM.day)+k.load)}SIM.arN++}
function arenaDayEnd(){if(SIM.arPlayed!==SIM.day)return;const L=ARENA_CFG.leagues[league()];S.gems+=L.day.gems;S.gold+=L.day.gold;
 if(SIM.day%7===6){const w=L.week;S.gems+=w.gems||0;S.gold+=w.gold||0;S.tixH=(S.tixH||0)+(w.tixH||0);if(w.mats)addMats(w.mats)}}
// ---- pilihan tahap ----
function choose(){const k=K(),ns=SLIST.find(st=>!S.stages[st.key]),tp=teamPow();
 if(ns&&unlocked(ns)&&tp>=ns.rec*.85&&!SIM.failed[ns.key])return{k:ns.key,t:'story'};
 const miss=SLIST.find(st=>S.stages[st.key]&&S.stages[st.key]<3&&tp>=st.rec*1.1&&!SIM.failed['*'+st.key]);if(miss)return{k:miss.key,t:'replay'};
 const top=[...SLIST].reverse().find(st=>S.stages[st.key]&&!SIM.failed['*'+st.key])||SLIST[0];
 // macet: veteran menyapu tahap tertinggi (EXP & emas cepat), pemain biasa kadang, pemula main ulang manual
 if(S.stages[top.key]&&rng()<k.sweep)return{k:top.key,t:'sweep'};
 return{k:top.key,t:'replay'}}
function session(hr){const k=K();SIM.sessions++;
 const T=SIM.tier&&TIERS[SIM.tier];if(T){const g=Math.round(T.gems/SIM.hrs.length);S.gems+=g;SIM.gemsPaid+=g}SIM.tt=0;SIM.budget=(SIM.len[0]+rng()*(SIM.len[1]-SIM.len[0]))*60;
 if(SIM.sessions===1){SIM.budget+=k.tut;use(k.tut*.6);for(const s of STORY.filter(s=>s.at==='start'))readScene(s)}
 regen();checkDaily();use(k.over*.5);if(rng()<k.claimP)claimAll();summonAll();upgrade();shopping();support();summonAll();upgrade();
 doWB(hr);
 const order=SIM.skill==='veteran'?['dg','ar','st']:['st','dg','ar'];
 for(const o of order){if(o==='dg')doDungeons();else if(o==='ar')doArena();else stages()}
 if(rng()<k.claimP)claimAll();upgrade();
 for(const x in SIM.failed)if(SIM.failed[x]<=SIM.day)delete SIM.failed[x];
 milestones();save()}
// isi ulang stamina dengan permata (pembelanja): sampai batas harian
function refill(){const T=SIM.tier&&TIERS[SIM.tier];if(!T)return false;checkDaily();const n=S.daily.c.refill||0;if(n>=Math.min(T.refill,STAM_REFILL.max))return false;
 const c=STAM_REFILL.cost[n];if(c==null||S.gems<c)return false;S.gems-=c;S.stam+=STAM_REFILL.give;S.daily.c.refill=n+1;SIM.refills++;use(4);return true}
function stages(){for(let g=0;g<120&&timeLeft();g++){const c=choose(),st=STAGES[c.k];if(S.stam<st.cost&&!refill())break;if(S.stam<st.cost)break;
  if(c.t==='sweep'){const n=Math.floor(S.stam/st.cost);const r=sweepStage(c.k,n);if(r.err)break;SIM.sweeps+=n;SIM.counts.sweep+=n;use(5);continue}
  const r=fight(c.k);if(!r)break;SIM.counts[c.t]++;if(!r.win){SIM.failed[c.t==='replay'?'*'+c.k:c.k]=SIM.day+2}else if(c.t==='replay'&&r.stars<3)SIM.failed['*'+c.k]=SIM.day+2;
  if(c.t==='story'&&rng()<K().claimP*.5)claimAll();upgrade()}}
function milestones(){const s=S.stages;for(let w=1;w<=WORLDS.length;w++)if(s[w+'-5'])mark('Tamat Dunia '+w);
 if(SLIST.every(st=>s[st.key]))mark('Tamat semua cerita');if(SLIST.every(st=>s[st.key]>=3))mark('Semua bintang');if(HEROES.every(h=>S.heroes[h.id]))mark('Semua hero terkumpul');
 const team=S.team.filter(Boolean);if(team.length===4&&team.every(h=>S.heroes[h].lv>=maxLv(h)))mark('Tim max level');
 if(team.length===4&&team.every(h=>{const w=S.heroes[h].wpn;return w&&S.weapons[w].lb>=WPN_LB_MAX&&wAtLvCap(w)}))mark('Senjata tim maks')}
const wAvg=f=>{const t=S.team.filter(id=>id&&S.heroes[id].wpn&&S.weapons[S.heroes[id].wpn]);return t.length?+(t.reduce((a,id)=>a+f(S.weapons[S.heroes[id].wpn]),0)/t.length).toFixed(2):0};
const snap=p=>({p,lv:S.lv,sum:SIM.summons,wl:wAvg(o=>o.lv),wlb:wAvg(o=>o.lb),hours:+(SIM.play/3600).toFixed(3),stages:SLIST.filter(st=>S.stages[st.key]).length,cp:teamPow()});
SIM.runDay=function(){const base=_D.now(),sub=[];SIM.hrs.forEach((h,j)=>{const d=new _D(base);d.setHours(0,0,0,0);OFF=d.getTime()+SIM.day*864e5+h*36e5-_D.now();session(h);
  if(SIM.day<3)sub.push(snap(+(SIM.day+(SIM.day===0&&j===0?.03:(j+1)/SIM.hrs.length)).toFixed(3)))});arenaDayEnd();SIM.day++;
 return{sub,day:SIM.day,lv:S.lv,cp:teamPow(),stages:SLIST.filter(st=>S.stages[st.key]).length,stars:SLIST.reduce((a,st)=>a+(S.stages[st.key]||0),0),heroes:Object.keys(S.heroes).length,
  gems:S.gems,gold:S.gold,hours:+(SIM.play/3600).toFixed(2),sum:SIM.summons,wl:wAvg(o=>o.lv),wlb:wAvg(o=>o.lb),story:+(SIM.storyT/60).toFixed(1),battles:SIM.battles,sweeps:SIM.sweeps,wb:SIM.wbN,ar:SIM.arN,refills:SIM.refills,dgr:SIM.dgResets,asc:SIM.asc||0,stars6:Object.values(S.heroes).filter(o=>(o.asc||0)>=4).length,
  team:S.team.map(id=>id&&`${id}:${S.heroes[id].lv}/${maxLv(id)}`)}};
SIM.reset=function(o){Object.assign(SIM,o||{});rs=(SIM.seed*2654435761)>>>0;OFF=0;try{localStorage.removeItem(SAVE_KEY)}catch(e){}S=defState();S.welcomed=true;S.sound=false;S.lang='id';
 const d=new _D();d.setHours(8,0,0,0);OFF=d.getTime()-_D.now();S.stamTs=Date.now();checkDaily();save()};
})();
