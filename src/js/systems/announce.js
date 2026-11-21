/* =====================================================================
   PENGUMUMAN SERVER — mesin (angka: data/announce.js · tampilan: ui/announce.js · server: /api/ann)
   ---------------------------------------------------------------------
   Semua pengumuman disimpan server → semua pemain di server yang sama melihat hal yang sama.
   Sumber kejadian:
   - ★3 & naik VIP para BOT: dari simulasi bot (deterministik, sama di semua perangkat). Bot yang punya sesi
     main di jendela [sekarang, +20 menit] dihitung gacha & belanjanya (disimpan per bot ±1 jam ke depan,
     dihitung sepotong-sepotong di latar). Tiap slot (★3: 6 menit, VIP: 20 menit) dipilih SATU kejadian
     (acak berbobot: terbatas & sultan sedikit lebih sering; malam hari banyak slot dilewati) lalu dilaporkan
     ±6 menit sebelum terjadi;
     server menyimpannya dengan waktu kejadian dan baru mengirimkannya saat waktunya tiba.
   - #1 CP & Arena: papan yang sama dengan layar Peringkat; dilaporkan bila #1 baru bertahan ≥2 menit.
   - Masuk 10 besar CP pertama kali (sekali per orang per server; bot paling banyak 1 diumumkan per 10 menit).
   - Rekor pertama server: ringkasan bot (CP, tahap, jumlah hero, ★ tertinggi) + datamu sendiri.
   - MVP Bos Dunia: papan damage raid setelah bos tumbang / kabur.
   - Kejadianmu sendiri: ★3 dari Panggilan (ui/summon.js) & naik VIP (systems/topup.js), dilaporkan saat terjadi.
   Diambil bersama Obrolan Dunia (/api/wc?...&as=) — lihat wcFetch di ui/chat.js.
   ===================================================================== */
const ANN={list:[],ids:new Set(),keys:new Set(),since:0,st:null,stAt:0,stWant:0,fk:new Set(),q:[],cur:null,curT:0,
 cand:{p3:{},vb:{}},scan:{to:0,sig:'',busy:false},bev:new Map(),sent:{},top:{},chkAt:0,arAt:0,recAt:0,mvp:{},
 jit:Math.random()*3*6e4};   // jit: tiap perangkat melapor di saat berbeda (0–3 menit lebih lambat) → yang lain sudah melihat kuncinya terisi, tidak ikut melapor
function annReset(){Object.assign(ANN,{seen0:0,list:[],ids:new Set(),keys:new Set(),since:0,st:null,stAt:0,stWant:0,fk:new Set(),q:[],cur:null,curT:0,
 cand:{p3:{},vb:{}},scan:{to:0,sig:'',busy:false},bev:new Map(),sent:{},top:{},t10:{}})}
// momen yang memancing obrolan (sama persis dengan annHot di server)
function annHot(a){const d=a.d||{};if(d.gm||d.q)return false;if(a.ty==='top1'||a.ty==='rec'||a.ty==='mvp')return true;if(d.hu)return a.ty==='p3'||a.ty==='vip'||a.ty==='t10';
 return a.ty==='p3'?!!(d.l||d.n)&&a.id%100<40:a.ty==='t10'?a.id%100<30:a.ty==='vip'&&d.v>=7&&a.id%100<30}

/* ---------- ambil (bersama /api/wc) ---------- */
function annQS(){let q='&as='+ANN.since+'&fk=1';if(loggedIn())q+='&me='+NET.acct.uid;if(!ANN.st||ANN.stWant||Date.now()-ANN.stAt>6e4){q+='&st=1';ANN.stWant=0}return q}
// mine: hasil laporan sendiri (POST) — tidak memajukan kursor 'since' supaya pengumuman orang lain tidak terlewat
function annApply(o,mine){const now=Date.now();if(!o)return;if(o.fk)ANN.fk=new Set(o.fk);if(o.st){ANN.st=o.st;ANN.stAt=now}
 const add=[];for(const a of o.ann||[]){if(!a||ANN.ids.has(a.id))continue;ANN.ids.add(a.id);ANN.keys.add(a.k);add.push(a);if(!mine)ANN.since=Math.max(ANN.since,a.ts)}
 const first=!mine&&!ANN.seen0;if(!mine&&o.ann)ANN.seen0=1;if(!add.length)return;
 ANN.list=ANN.list.concat(add).sort((x,y)=>x.ts-y.ts||x.id-y.id);if(ANN.list.length>150)ANN.list=ANN.list.slice(-150);
 // pita beranda: hanya yang masih hangat; saat pertama dimuat cukup yang terbaru
 const fr=add.filter(a=>a.ts<=now+1500&&now-a.ts<ANN_CFG.fresh&&!(a.d&&a.d.q));(first?fr.slice(-1):fr).forEach(a=>ANN.q.push(a));if(ANN.q.length>4)ANN.q=ANN.q.slice(-4);
 if(add.some(a=>a.ty==='rec'||a.ty==='top1'))ANN.stWant=1;
 // momen besar → Obrolan Dunia ikut bereaksi (server memilih satu, sekali per pengumuman)
 if(!first&&add.some(annHot)&&typeof NET!=='undefined'&&NET.ai&&typeof WC!=='undefined')WC.aiNext=Math.min(WC.aiNext||Infinity,now+1500+Math.random()*4e3)}
async function annPost(L){if(!L||!L.length||typeof netApi!=='function'||!netApi())return null;
 try{const o=await api('/api/ann',{tok:netTok()||undefined,srv:netSrv(),list:L});if(o&&o.ok&&o.list&&o.list.length)annApply({ann:o.list},true);return o}catch(e){return null}}
// kejadianku sendiri (wajib masuk akun)
// p3: x = hasil Panggilan, p0 = pity sebelum menarik → "Hoki! … hanya dalam N tarikan" bila ★3 pertama datang ≤10 tarikan
function annMine(ty,x,p0){if(typeof loggedIn!=='function'||!loggedIn())return;
 if(ty==='p3'){const L=x||[],j=L.findIndex(r=>r&&!r.wid&&HD[r.id]&&HD[r.id].r===3),hs=[...new Set(L.filter(r=>r&&!r.wid&&HD[r.id]&&HD[r.id].r===3).map(r=>r.id))];
  if(hs.length)annPost([Object.assign({ty:'p3',h:hs},p0!=null&&j>=0&&hs.length===1?{n:p0+j+1}:{})])}
 else if(ty==='vip'&&x>=ANN_CFG.vipMin)annPost([{ty:'vip',v:x}])}

// pengumuman panas yang baru muncul: orangnya (bila bot & sedang online) — dan #1 yang tergeser — ikut jadi calon penulis adegan reaksi
function annHotBot(now,on){const out=[];for(let k=ANN.list.length-1;k>=0;k--){const a=ANN.list[k];if(now-a.ts>3.5*6e4)break;if(a.ts>now||!annHot(a))continue;
  for(const u of[a.uid,a.d&&a.d.pu]){const i=u?botIdxOf(String(u)):-1;if(i>=0&&on.includes(i)&&!out.includes(i))out.push(i)}}return out.slice(0,2)}

// profil bot dibuka: bila ia baru saja muncul di pengumuman, keadaannya dihitung ulang sekarang supaya ★3/VIP yang
// diumumkan pasti terlihat (cache botState hanya berganti tiap ±15 menit progres)
function annFreshBot(i){const uid=botUid(i),now=Date.now();if(!uid||!ANN.list.some(a=>a.uid===uid&&now-a.ts<30*6e4&&a.ts<=now))return;
 const c=BOTS.cache[i];if(c&&c.at&&c.at>=Math.max(...ANN.list.filter(a=>a.uid===uid).map(a=>a.ts)))return;
 delete BOTS.cache[i];delete BSUMA[i];if(BSUM.d)delete BSUM.d[i];BLM.t=0}

/* ---------- ★3 & VIP bot: hitung di latar, pilih satu per slot ---------- */
const ANN_HZ=60*6e4;   // kejadian tiap bot disimpan sampai ±1 jam ke depan (hitung ulang hanya bila jendela melewatinya)
function annBotEv(i,t1){let c=ANN.bev.get(i);if(c&&c.T>=t1)return c;const b=botBase(i),T=Math.max(t1,Date.now()+ANN_HZ),G=botGacha(b,botProg(b,T),T),from=Date.now()-3*6e4;
 const p3=G.ev.filter(e=>!e.w&&e.t>=from&&e.t<=T).map(e=>({t:e.t,id:e.id,lim:e.lim,up:e.up&&e.on,n:e.n}));
 // VIP pada tiap pembelian (untuk bobot "sultan" & pengumuman naik VIP)
 const vs=[];let tot=0,v=0;for(const o of G.spend.buys){tot+=o.price;const v1=vipOf(tot);if(v1>v){v=v1;vs.push([o.t,v1])}}
 c={T,p3,vs};ANN.bev.set(i,c);if(ANN.bev.size>6000)ANN.bev.delete(ANN.bev.keys().next().value);return c}
const annVipAt=(c,t)=>{let v=0;for(const x of c.vs){if(x[0]>t)break;v=x[1]}return v};
const annJit=(i,t)=>(bHash(i,Math.floor(t/1e3)%1000003)%1000)/1000;
// ritme siang-malam: slot dipakai sesuai keramaian jamnya (sama di semua perangkat: hash nomor slot)
function annSlotOn(len,s){const H=BOT_CFG.HOURS,h=new Date(s*len+BOT_CFG.TZ*36e5).getUTCHours(),act=H[h]/Math.max(...H),q=ANN_CFG.quiet;
 return((Math.imul(s+len/6e4,2654435761)>>>0)%1000)/1000<q+(1-q)*act}
function annCand(i,c,t0,t1){const C=ANN_CFG;
 for(const e of c.p3){if(e.t<t0||e.t>=t1||!annSlotOn(C.p3Slot,Math.floor(e.t/C.p3Slot)))continue;const sc=(e.lim?1.5:1)*(1+annVipAt(c,e.t)/12)*(.5+annJit(i,e.t)),s=Math.floor(e.t/C.p3Slot),o=ANN.cand.p3[s];
  if(!o||sc>o.sc||(sc===o.sc&&i<o.i))ANN.cand.p3[s]={i,t:e.t,id:e.id,lim:e.lim,n:e.n,sc}}
 for(const[t,v]of c.vs){if(t<t0||t>=t1||v<C.vipMin||!annSlotOn(C.vipSlot,Math.floor(t/C.vipSlot)))continue;const sc=v+annJit(i,t),s=Math.floor(t/C.vipSlot),o=ANN.cand.vb[s];
  if(!o||sc>o.sc||(sc===o.sc&&i<o.i))ANN.cand.vb[s]={i,t,v,sc}}}
// jendela [to lama, sekarang+20 menit): bot yang punya sesi main di dalamnya → kandidat
function annScan(){const C=ANN_CFG,now=Date.now(),sig=botsSig();if(ANN.scan.busy||!BOTS.uids||!BOTS.W||!BOTS.W.length)return;
 if(ANN.scan.sig!==sig){ANN.scan={to:0,sig,busy:false};ANN.cand={p3:{},vb:{}};ANN.bev=new Map()}
 if(ANN.scan.to>=now+C.ahead+6*6e4)return;   // jendela masih cukup jauh ke depan
 const t0=Math.max(ANN.scan.to,now-2*6e4),t1=now+C.win,ids=botsIds(t1),d0=wibDay(t0),d1=wibDay(t1);let k=0;ANN.scan.busy=true;
 const step=()=>{if(botsSig()!==sig){ANN.scan.busy=false;return}const s0=performance.now();
  try{while(k<ids.length&&performance.now()-s0<6){const i=ids[k++];if(botHidden(i))continue;const b=botBase(i);if(b.join>=t1||b.endT<=t0)continue;
   let hit=b.join>=t0;for(let d=d0;!hit&&d<=d1;d++)for(const s of botSessions(b,d))if(s[0]<t1&&s[1]>t0){hit=true;break}
   if(hit)annCand(i,annBotEv(i,t1),t0,t1)}}catch(e){k=ids.length}
  if(k<ids.length){setTimeout(step,30);return}ANN.scan.to=t1;ANN.scan.busy=false;annReport()};
 setTimeout(step,0)}
function annReport(){const C=ANN_CFG,now=Date.now(),L=[];
 for(const[ty,slot]of[['p3',C.p3Slot],['vb',C.vipSlot]]){const M=ANN.cand[ty];
  for(const s in M){const c=M[s];if(c.t<now-9e4){delete M[s];continue}if(c.t>now+C.ahead-ANN.jit)continue;
   const k=ty+':'+s;if(ANN.fk.has(k)||ANN.keys.has(k)||ANN.sent[k])continue;const uid=botUid(c.i);if(!uid||botHidden(c.i))continue;ANN.sent[k]=now;
   L.push(ty==='p3'?{ty:'p3',uid,h:c.id,l:c.lim?1:0,n:c.n<=10?c.n:0,t:Math.round(c.t)}:{ty:'vip',uid,v:c.v,t:Math.round(c.t)})}}
 for(const k in ANN.sent)if(now-ANN.sent[k]>30*6e4)delete ANN.sent[k];
 if(L.length)annPost(L.slice(0,8))}

/* ---------- #1 CP & Arena, masuk 10 besar CP pertama kali ---------- */
function annTopCheck(now,ar){const C=ANN_CFG,St=ANN.st;if(!St)return;const me=loggedIn()&&!(typeof isGM==='function'&&isGM())?String(NET.acct.uid):null;
 const T10=botsList(now).sort((a,b)=>b.cp-a.cp||b.lv-a.lv).slice(0,10),was=new Set(St.t10||[]),seen=ANN.t10||(ANN.t10={}),L=[];
 T10.forEach((e,k)=>{const uid=e.me?me:e.h?String(e.h):botUid(e.i);if(!uid||was.has(uid))return;if(!seen[uid])seen[uid]=now;
  if(now-seen[uid]<C.hold||(ANN.sent['t10:'+uid]&&now-ANN.sent['t10:'+uid]<10*6e4))return;ANN.sent['t10:'+uid]=now;L.push(e.me?{ty:'t10',r:k+1}:{ty:'t10',uid,r:k+1})});
 for(const u in seen)if(!T10.some(e=>(e.me?me:e.h?String(e.h):botUid(e.i))===u))delete seen[u];
 if(L.length)annPost(L.sort((a,b)=>(b.uid?0:1)-(a.uid?0:1)).slice(0,8)).then(()=>{ANN.stWant=1});
 const board=bd=>bd==='cp'?botsList(now).map(e=>[e,e.cp]):(typeof arBoard==='function'&&featOK('arena')?arBoard(now).filter(e=>!e.h).map(e=>[e,e.pts]).concat([[{me:true},arState().pts]]):[]);
 for(const bd of ar?['cp','ar']:['cp']){let best=null,bv=-1;for(const[e,v]of board(bd))if(v>bv){bv=v;best=e}if(!best)continue;
  const uid=best.me?me:best.h?String(best.h):botUid(best.i);if(!uid)continue;
  const T=ANN.top[bd];if(!T||T.uid!==uid){ANN.top[bd]={uid,since:now};continue}
  const cur=St.top&&St.top[bd];if(cur&&cur.uid===uid)continue;if(cur&&now-cur.ts<C.cd[bd])continue;if(now-T.since<C.hold)continue;
  const sk='top1:'+bd;if(ANN.sent[sk]&&now-ANN.sent[sk]<3*6e4)continue;ANN.sent[sk]=now;
  annPost([best.me?{ty:'top1',b:bd,v:bv}:{ty:'top1',b:bd,uid,v:bv}]).then(()=>{ANN.stWant=1})}}

/* ---------- rekor pertama server ---------- */
function annRecList(){const C=ANN_CFG,L=[];WORLDS.forEach((w,k)=>L.push('st:'+(k+1)));C.recCP.forEach(v=>L.push('cp:'+v));C.recAsc.forEach(v=>L.push('a:'+v));L.push('all:'+HEROES.length);return L}
// urutan gengsi: bila beberapa rekor tercapai bersamaan, yang paling bergengsi diumumkan (sisanya dicatat diam-diam)
function annRecRank(r){const[k,v]=r.split(':');return k==='cp'?100+ANN_CFG.recCP.indexOf(+v):k==='a'?90+(+v):k==='all'?85:60+(+v)}
function annRecCheck(now){const St=ANN.st;if(!St)return;const have=new Set((St.rec||[]).map(r=>r.r));
 const need=annRecList().filter(r=>!have.has(r)&&!(ANN.sent['rec:'+r]&&now-ANN.sent['rec:'+r]<5*6e4));if(!need.length)return;
 const E=[];for(const i of botsIds(now)){if(botHidden(i))continue;const o=BSUM.d[i]||(BSUMA[i]&&BSUMA[i].o);if(o&&o.nh!=null)E.push({i,cp:o.cp,sn:STAGES[o.st]?STAGES[o.st].n+1:0,nh:o.nh,ms:o.ms})}
 if(loggedIn()&&!(typeof isGM==='function'&&isGM())){let sn=0;for(const st of SLIST)if(S.stages[st.key])sn=Math.max(sn,st.n+1);
  E.push({me:1,cp:teamPow(),sn,nh:Object.keys(S.heroes).length,ms:Math.max(0,...Object.keys(S.heroes).map(id=>heroStar(id)))})}
 const L=[];for(const r of need){const[k,v]=r.split(':'),n=+v,val=e=>k==='st'?e.sn:k==='cp'?e.cp:k==='a'?e.ms:e.nh,ok=e=>k==='st'?e.sn>=n*5:val(e)>=n;
  let best=null;for(const e of E)if(ok(e)&&(!best||val(e)>val(best)))best=e;if(!best)continue;const uid=best.me?null:botUid(best.i);if(!best.me&&!uid)continue;
  ANN.sent['rec:'+r]=now;L.push(best.me?{ty:'rec',r}:{ty:'rec',r,uid})}
 if(L.length)annPost(L.sort((a,b)=>annRecRank(b.r)-annRecRank(a.r)).slice(0,8)).then(()=>{ANN.stWant=1})}

/* ---------- MVP Bos Dunia ---------- */
function annMvpCheck(now){if(typeof wbCur!=='function'||!wbOpen())return;const c=wbCur(now);if(c.st!=='live'&&c.st!=='after')return;
 const k=wbKey(c.t0);if(ANN.mvp[k])return;const st=wbState(c.t0,now),done=st.dead?now-st.killT>25e3:c.st==='after'&&now-wbEnd(c.t0)>3e4;if(!done)return;ANN.mvp[k]=1;
 const gm=typeof isGM==='function'&&isGM(),top=wbBoard(c.t0,now).L.filter(e=>!(e.me&&gm))[0];if(!top||!top.dmg)return;
 if(top.me&&!loggedIn())return;const uid=top.me?null:top.uid?String(top.uid):botUid(top.bot);if(!top.me&&!uid)return;
 annPost([Object.assign({ty:'mvp',wk:k,dmg:Math.round(top.dmg),k:st.dead?1:0,b:wbBoss(c.t0).n},top.me?{}:{uid})])}

/* ---------- jalankan (tiap 15 dtk; berhenti saat aplikasi di latar) ---------- */
function annTick(){if(document.hidden||(typeof watchMode==='function'&&watchMode())||!S||!S.named||!BOTS.ready||!botsWarmOk())return;const now=Date.now();
 try{annScan()}catch(e){ANN.scan.busy=false}try{annReport()}catch(e){}
 if(now-ANN.chkAt>3e4){ANN.chkAt=now;const ar=now-ANN.arAt>6e4;if(ar)ANN.arAt=now;try{annTopCheck(now,ar)}catch(e){}}
 if(now-ANN.recAt>9e4){ANN.recAt=now;try{annRecCheck(now)}catch(e){}}
 try{annMvpCheck(now)}catch(e){}}
setTimeout(()=>setInterval(annTick,15e3),9e3);
