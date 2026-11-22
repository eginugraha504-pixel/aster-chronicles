/* =====================================================================
   MESIN PEMAIN BOT — dunia bot yang tumbuh realtime (maks BOT_CFG.max)
   - Bot ke-i bergabung pada waktu tetap (botJoin) -> semua penonton melihat dunia yang sama.
   - Progres = hari bermain efektif (masa aktif × kecepatan; melambat sebelum berhenti, bisa kembali
     saat banner baru), dipetakan ke kurva per gaya main hasil simulasi (BOT_CFG.CURVES).
   - Setiap tarikan gacha punya waktu nyata -> memakai banner & pool yang aktif saat itu (BOT_CFG.ERAS).
   - Online mengikuti jam ramai WIB (sesi harian per bot, akhir pekan lebih aktif).
   - Roster dari gacha yang disimulasikan dengan peluang ASLI (RATES/PITY/banner), seed per bot,
     sehingga roster hanya bertambah seiring waktu (tidak berubah acak).
   - Level hero, senjata, perlengkapan & CP dihitung lewat fungsi game asli dengan menukar
     state sementara (S) -> otomatis ikut perubahan balance.
   - Nama: username akun bot di SERVER (bank-worker membuat akun bot; admin bisa mengganti lewat Telegram).
     Cadangan bila server tidak menjawab: generator suku kata lokal (botLocalName). Hanya huruf & angka.
   PETA FILE: lihat docs/BOTS.md (bagian "Peta kode"). Uji regresi: tools/botfp.mjs + tools/botcheck.js.
   ===================================================================== */
/* BOTS — keadaan bersama mesin bot:
   W: dunia-dunia server ini · gen: gen dunia utama · names/uids/srvNames: dari server (systems/net.js)
   base/cache: botBase & botState per bot · ov/rv/rvAll: koreksi & usaha rival dari server · warming/warmAt: pemanasan
   ready/busy/again: pengisian nama cadangan lokal · onChange: dipanggil saat daftar bot berubah */
const BOTS={cacheN:0,gen:0,names:[],ready:false,busy:false,base:{},cache:{},seen:0,init:false,onChange:null};
const BDAY=864e5;
function bRng(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
// seed: indeks LOKAL bot di dunianya + gen dunianya (bot gabungan server tetap sama dengan aslinya); seed lain memakai dunia utama
function bHash(i,s){const W=BOTS.W,X=BOT_CFG.SRV.CAPX;if(W&&W.length){const sl=Math.floor(i/X);if(i>=0&&sl<W.length)i=(i-sl*X)+W[sl].g*1000003;else i+=W[0].g*1000003}else i+=BOTS.gen*1000003;let h=(Math.imul(i+1,2654435761)^Math.imul(s+7,0x9E3779B1))>>>0;h=Math.imul(h^h>>>16,0x45d9f3b)>>>0;h=Math.imul(h^h>>>16,0x45d9f3b)>>>0;return(h^h>>>16)>>>0}
const BSTRH={};function bStrH(t){let h=BSTRH[t];if(h!=null)return h;h=2166136261;for(let c=0;c<t.length;c++)h=Math.imul(h^t.charCodeAt(c),16777619);return BSTRH[t]=(h>>>0)%60000}
function bInterp(T,x){if(x<=T[0][0])return T[0][1];for(let k=1;k<T.length;k++)if(x<=T[k][0]){const a=T[k-1],b=T[k];return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0])}return T[T.length-1][1]}

/* ---- server & dunia ----
   Server ini punya satu atau lebih dunia bot BOTS.W=[{g,e,cap,newer,nn}] (dunia server lain yang digabung ada di belakang).
   Id bot j = slot×CAPX + i (i = indeks bot di dunianya). Server yang tidak pernah digabung: j = i (sama seperti dulu). */
const bX=()=>BOT_CFG.SRV.CAPX;
function bW(j){const W=BOTS.W;if(!W||!W.length)return null;const s=Math.floor(j/bX());return s>=0&&s<W.length?W[s]:null}
const bLi=j=>j%bX();
const botsSig=()=>(BOTS.W||[]).map(w=>w.g+'@'+w.e).join(',');
// id bot dari (gen dunia, indeks lokal) — dipakai data server (teman, pesan, pencarian)
function botJ(bw,i){const W=BOTS.W||[],s=W.findIndex(w=>w.g===+bw);return s<0||i==null?null:s*bX()+(+i)}
/* ---- kapan bot bergabung (per dunia; sama persis dengan server bank-worker/src/game.js) ----
   N(T) = cap × (w1·(1−e^(−T/t1)) + w2·(1−e^(−E/t2))), T = hari sejak dunia dibuka; E = hari efektif ekor (melambat tiap server lebih baru dibuka).
   Setelah hari pertama, jam bergabung ditekuk ke jam ramai WIB. */
function wEff(T,w){const C=BOT_CFG.SRV,O=w.newer||[];let e=0,last=0,k=0;for(const o of O){const d=(o-w.e)/BDAY;if(d>=T)break;if(d>last){e+=(d-last)*Math.pow(C.slow,k);last=d}k++}return e+(T-last)*Math.pow(C.slow,k)}
/* v2 (w.v===2): hype & pertumbuhan alami per server — lihat BOT_CFG.SRV. SAMA PERSIS dengan bank-worker/src/game.js (wDyn, wE2).
   Laju harian disiapkan sekali per dunia (w._d): popularitas × naik-turun acak × akhir pekan × lonjakan viral × perlambatan server baru. */
function wRng(g,k){return bRng((Math.imul(g+1,0x9E3779B1)^Math.imul(k+17,0x85EBCA6B))>>>0)}
function wDyn(w){if(w._d)return w._d;const C=BOT_CFG.SRV,hv=Math.min(10,Math.max(1,Math.round(w.h||5))),H=C.HYPE[hv],r=wRng(w.g,1);
 let pop=C.POP[0]+r()*(C.POP[1]-C.POP[0]);if(w.o!=null)pop*=Math.max(.8,1+C.ORD*(1.5-w.o));
 const R=Math.min(.88,H.R*pop),Wv=Math.min(.95-R,H.W*Math.sqrt(pop)),G=1-R-Wv,D=C.DAYS,B=C.BURST;
 const rate=new Float64Array(D),q=wRng(w.g,2),b=wRng(w.g,3),dec=Math.exp(-1/B.dec),pb=B.p+B.ph*hv,ar=C.AR,sq=Math.sqrt(1-ar*ar);
 let x=0,acc=0;
 for(let d=0;d<D;d++){const u1=Math.max(1e-9,q()),u2=q(),z=Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2);x=d?ar*x+sq*z:z;
  acc*=dec;if(d>0&&b()<pb)acc+=B.a[0]+b()*(B.a[1]-B.a[0])-1;
  const wd=new Date(w.e+(d+.5)*BDAY+BOT_CFG.TZ*36e5).getUTCDay();rate[d]=pop*Math.exp(C.SD*x-C.SD*C.SD/2)*C.WKD[wd]*(1+acc)}
 const nd=(w.newer||[]).map(o=>(o-w.e)/BDAY).filter(v=>v>0).sort((a,c)=>a-c),S=[],Cu=[],Rt=[];let E=0,k=0,j=0;
 for(let d=0;d<D;d++){let a=d;for(;;){while(j<nd.length&&nd[j]<=a){k++;j++}const nx=Math.min(d+1,j<nd.length?nd[j]:Infinity),rt=rate[d]*Math.pow(C.slow,k);
  S.push(a);Cu.push(E);Rt.push(rt);E+=rt*(nx-a);a=nx;if(a>=d+1)break}}
 S.push(D);Cu.push(E);Rt.push(Rt[Rt.length-1]);
 return w._d={R,W:Wv,G,tr:H.tr,tw:H.tw,tg:H.tg,pop,S,Cu,Rt}}
function wE2(T,d){if(T<=0)return 0;const S=d.S;let lo=0,hi=S.length-1;if(T>=S[hi])return d.Cu[hi]+d.Rt[hi]*(T-S[hi]);
 while(hi-lo>1){const m=(lo+hi)>>1;if(S[m]<=T)lo=m;else hi=m}return d.Cu[lo]+d.Rt[lo]*(T-S[lo])}
function wJoinN(T,w){if(w.v===2){if(T<=0)return 0;const d=wDyn(w),E=wE2(T,d);return w.cap*(d.R*(1-Math.exp(-T/d.tr))+d.W*(1-Math.exp(-E/d.tw))+d.G*(1-Math.exp(-E/d.tg)))}
 const C=BOT_CFG.SRV;return w.cap*(C.w1*(1-Math.exp(-T/C.t1))+C.w2*(1-Math.exp(-wEff(T,w)/C.t2)))}
function botJoinDaysW(i,w){if(i>=w.cap)return Infinity;let lo=0,hi=1;while(wJoinN(hi,w)<i+1&&hi<1e5)hi*=2;if(wJoinN(hi,w)<i+1)return Infinity;
 for(let k=0;k<50;k++){const m=(lo+hi)/2;if(wJoinN(m,w)<i+1)lo=m;else hi=m}
 if(hi<1)return hi;const E=w.e/BDAY;return Math.max(1,botJoinWarp(E+hi,BOT_CFG)-E)}
// geser waktu di dalam satu hari WIB mengikuti bobot jam ramai (monoton → urutan bot tetap)
function botJoinWarp(d,C){const W=C.HOURS,tot=W.reduce((a,v)=>a+v,0),z=C.TZ/24,x=d+z,day=Math.floor(x),target=(x-day)*tot;
 let c=0,j=0;for(;j<23;j++){if(c+W[j]>=target)break;c+=W[j]}return day+(j+Math.min(1,Math.max(0,(target-c)/W[j])))/24-z}
function botJoin(j){const w=bW(j);if(!w)return Infinity;const i=bLi(j);w.jt=w.jt||[];let t=w.jt[i];if(t==null)t=w.jt[i]=w.e+botJoinDaysW(i,w)*BDAY;return t}
function botsJoinedW(w,s,now){let lo=0,hi=w.cap;while(lo<hi){const m=(lo+hi)>>1;if(botJoin(s*bX()+m)<=now)lo=m+1;else hi=m}return lo}
const botsJoined=(now=Date.now())=>(BOTS.W||[]).reduce((a,w,s)=>a+botsJoinedW(w,s,now),0);
/* bot yang tampil = sudah bergabung DAN sudah punya nama. botsIds = daftar id-nya (urut per dunia). */
const BIDS={t:-1,k:'',L:[]};
function botsIds(now=Date.now()){const W=BOTS.W||[],tb=Math.floor(now/2e3),k=botsSig()+'|'+BOTS.names.length;if(BIDS.t===tb&&BIDS.k===k)return BIDS.L;const L=[];
 W.forEach((w,s)=>{const n=Math.min(botsJoinedW(w,s,now),w.nn==null?BOTS.names.length:w.nn);for(let i=0;i<n;i++)L.push(s*bX()+i)});
 if(Math.abs(now-Date.now())<3e3){BIDS.t=tb;BIDS.k=k;BIDS.L=L}return L}
const botsVisible=(now=Date.now())=>botsIds(now).length;
function botIn(j,now=Date.now()){j=+j;const w=bW(j);if(!w||!(j>=0))return false;const s=Math.floor(j/bX()),i=bLi(j);return i<(w.nn==null?BOTS.names.length:w.nn)&&botJoin(j)<=now}

/* ---- persen whaler per server (diatur pemilik lewat Telegram /whale) ----
   Riwayat dunia w.wh = [[waktu, persen], ...]: berlaku untuk bot yang BERGABUNG setelah waktu itu — bot lama tidak berubah
   (riwayat belanja & CP-nya tetap). Whaler = whale + super whale + mega whale (perbandingan di antara mereka tetap),
   sisanya F2P / low / kartu bulanan / mid / dolphin dengan perbandingan tetap. Tanpa riwayat = campuran bawaan (SPEND.tiers). */
function botWhalePct(w,t){const H=w&&w.wh;if(!H||!H.length)return null;let p=null;for(const x of H){if(x[0]<=t)p=+x[1];else break}return p}
const BTW={};
function botTierW(w,t){const p=botWhalePct(w,t);if(p==null||!isFinite(p))return null;if(BTW[p])return BTW[p];const T=BOT_CFG.SPEND.tiers,ids=BOT_CFG.SPEND.whales,isW=x=>ids.includes(x.id);
 const sw=T.filter(isW).reduce((a,x)=>a+x.w,0),so=T.filter(x=>!isW(x)).reduce((a,x)=>a+x.w,0),q=Math.min(100,Math.max(0,p));
 return BTW[p]=Math.abs(q-sw)<1e-9?T.map(x=>x.w):T.map(x=>isW(x)?x.w*q/sw:x.w*(100-q)/so)}

/* ---- sifat tetap tiap bot ---- */
function botBase(i){if(BOTS.base[i])return BOTS.base[i];const C=BOT_CFG,r=bRng(bHash(i,1));
 let x=r()*C.profiles.reduce((a,p)=>a+p.w,0),pf=C.profiles[0];for(const p of C.profiles){if(x<p.w){pf=p;break}x-=p.w}
 let a=pf.a[0]+r()*(pf.a[1]-pf.a[0]);const join=botJoin(i);let quit=Infinity;for(const[d,p]of C.churn)if(r()<p){quit=d*(.4+r()*.9);break}
 const chaser=r()<C.CHASER,chrono=Math.round((r()-.5)*4),opt=Math.min(.99,Math.max(.3,pf.opt+(r()-.5)*.2));
 // sifat tambahan memakai aliran acak terpisah (jumlah tarikan tetap) supaya sifat lama tidak bergeser
 const q=bRng(bHash(i,31)),Q=Array.from({length:12},()=>q()),SP=C.SPEND,EM=C.EMO,LF=C.LIFE;
 let tx=Q[0]*100,tier=SP.tiers[0];const TW=botTierW(bW(i),join);for(let k=0;k<SP.tiers.length;k++){const t=SP.tiers[k],tw=TW?TW[k]:t.w;if(tx<tw){tier=t;break}tx-=tw}
 // pengejar puncak (super/mega whale): gaya main sangat rajin, optimal, selalu kejar rate-up, tidak pernah berhenti
 let chaser2=chaser,opt2=opt;if(tier.pf){const id=tier.pf[bHash(i,41)%tier.pf.length],np=C.profiles.find(p=>p.id===id);if(np&&np!==pf){pf=np;a=pf.a[0]+Q[11]*(pf.a[1]-pf.a[0])}a*=tier.speed||1;quit=Infinity;chaser2=true;opt2=Math.max(opt,tier.opt||opt)}
 // pengalaman main (pemula / biasa / veteran): aliran acak sendiri; condong ke veteran untuk profil rajin/hardcore
 const SK=C.SKILL,skw=pf.sk||{baru:.33,biasa:.34,veteran:.33};let sk='biasa';{let y=bRng(bHash(i,51))()*Object.values(skw).reduce((a,v)=>a+v,0);for(const k in skw){if(y<skw[k]){sk=k;break}y-=skw[k]}}
 if(tier.sk)sk=tier.sk[bHash(i,52)%tier.sk.length];
 opt2=Math.min(.995,Math.max(.3,opt2+(SK[sk].opt||0)));
 const mood=botEarlyMood(bHash(i,2),chaser);if(mood!=='normal')a*=EM[mood].speed;
 // pemain berbayar & yang hoki lebih betah; yang apes lebih cepat menyerah
 const cm=(tier.id==='f2p'?1:SP.churnMul)*(mood==='normal'?1:EM[mood].churn)*(SK[sk].churn||1);
 if(tier.pf)quit=Infinity;else if(quit<Infinity&&cm<1&&Q[1]<1-cm)quit=Infinity;
 else if(cm>1){if(quit<Infinity)quit/=Math.sqrt(cm);else if(Q[2]<(cm-1)*.22)quit=.8+Q[3]*4}
 // masa aktif: [mulai, selesai, kecepatan]. Melambat sebelum berhenti; bisa kembali saat era banner baru
 const segs=[];if(quit===Infinity)segs.push([join,Infinity,a]);
 else{const qT=join+quit*BDAY,fadeAt=join+quit*(1-C.FADE)*BDAY;segs.push([join,fadeAt,a],[fadeAt,qT,a*C.FADE_RATE]);
  const era=C.ERAS.find(e=>e.at>qT);if(era&&r()<C.COMEBACK.p){const s0=era.at+r()*BDAY,len=(C.COMEBACK.days[0]+r()*(C.COMEBACK.days[1]-C.COMEBACK.days[0]))*BDAY;segs.push([s0,s0+len,a*C.COMEBACK.rate])}}
 const cvS=pf.id+'_'+sk,cvT=cvS+'_'+tier.id;
 const B=BOTS.base[i]={i,pf:pf.id,pfo:pf,sk,cv:C.CURVES[cvT]?cvT:cvS,cvS,a,quit,join,chaser:chaser2,chrono,opt:opt2,segs,seed:bHash(i,2),endT:segs[segs.length-1][1],back:segs.length>2,
  tier,mood,saver:!tier.pf&&chaser2&&Q[4]<EM.saver,spend0:join+((tier.first||SP.firstDay)[0]+Q[5]*((tier.first||SP.firstDay)[1]-(tier.first||SP.firstDay)[0]))*BDAY,cardP:Q[6]<(tier.card||0),
  bioEvery:LF.bioEvery[0]+Q[7]*(LF.bioEvery[1]-LF.bioEvery[0]),loyal:Q[8]<LF.loyal};
 // gaya sultan (aliran acak sendiri): pembelanja besar punya ciri khas belanja, koleksi, tim & avatar
 // hero kesayangan karena selera (bukan meta): avatar & hero "setia" — membuat para sultan berbeda satu sama lain
 {const lr=bRng(bHash(i,62))();B.love=bWeighted(HEROES.map(h=>[h.id,h.r===3?3:h.r===2?1.6:.7]),lr)}
 const WS=C.SPEND.WSTYLE;if(WS&&WS.tiers.includes(tier.id)){const wr=bRng(bHash(i,61));B.ws=bWeighted(WS.list.map(x=>[x,x.w]),wr());B.wal=WS.wallet[0]+wr()*(WS.wallet[1]-WS.wallet[0]);if(B.ws.fav)B.loyal=true}
 // Q[9..10] dulu untuk ganti nama otomatis (dimatikan sejak nama = akun server); tetap ditarik supaya sifat lain tidak bergeser
 return B}
/* suasana hati awal: ulang 60 tarikan hero pertama (aliran acak yang sama dengan gacha bot) -> hoki / normal / sial */
function botEarlyMood(seed,chaser){const N=BOT_CFG.EMO.early,rng=bRng(seed);let pity=0,g=false,n3=0;
 for(let k=0;k<N;k++){pity++;const x=rng()*100,p3=rate3At(pity),r=x<p3?3:x<p3+RATES[2]?2:1;
  if(r===3){n3++;pity=0;if(chaser){const on=g||rng()<RATE_UP.hero;g=!on;if(!on)rng()}else rng()}else rng()}
 const e=N*RATES[3]/100*1.05,z=(n3-e)/Math.sqrt(e);return z>1?'hoki':z<-1?'sial':'normal'}
// nama = username akun bot di server (admin bisa menggantinya lewat Telegram)
function botName(i,t=Date.now()){return BOTS.names[i]||botLocalName(i)}

/* ================= TOP UP BOT =================
   Pembelian ditentukan per hari (seed per bot+hari) -> semua penonton melihat pembelian yang sama.
   Pemicu: Kartu Bulanan (+perpanjangan), pembelian acak saat bermain (lebih sering di tanggal gajian),
   dan borong saat banner baru dimulai. Permata berbayar -> tarikan tambahan di botGacha. */
const BSPEND={};let BSPEND_N=0;
const vipOf=total=>{const V=BOT_CFG.SPEND.VIP;let v=0;while(v<V.length&&total>=V[v])v++;return v};
const tuPack=id=>id==='mc'?TOPUP_CFG.card:TOPUP_CFG.packs.find(p=>p.id===id)||(TOPUP_CFG.bundles||[]).find(b=>b.id===id);
function bWeighted(L,x){const tot=L.reduce((a,v)=>a+v[1],0);let y=x*tot;for(const v of L){if(y<v[1])return v[0];y-=v[1]}return L[L.length-1][0]}
function botSpend(b,now=Date.now()){const T=b.tier;if(T.id==='f2p')return{buys:[],gems:[],total:0,vip:0,card:0};
 const dNow=wibDay(now),key=dNow+':'+BOT_CFG.ERAS.length+':'+BOTS.gen;let c=BSPEND[b.i];
 if(!c||c.key!==key){const SP=BOT_CFG.SPEND,buys=[],gems=[],d0=wibDay(b.spend0),d1=Math.min(dNow,wibDay(Math.min(b.endT,now+BDAY)));let cardUntil=0,cardN=0,cardStop=!b.cardP;
  const buy=(t,id)=>buys.push({t,id,price:tuPack(id).price});
  for(let d=d0;d<=d1;d++){const ss=botSessions(b,d).filter(s=>s[0]>=b.spend0);if(!ss.length)continue;const r=bRng(bHash(b.i,7000+d)),first=ss[0][0];
   if(!cardStop&&first>=cardUntil){if(cardN===0||r()<T.renew){buy(first+6e4*(1+r()*4),'mc');cardUntil=first+TOPUP_CFG.card.days*BDAY;cardN++}else cardStop=true}
   if(first<cardUntil)gems.push([first+3e4,TOPUP_CFG.card.daily]);
   const ws=b.ws,date=new Date(d*BDAY).getUTCDate(),pd=SP.payday.dates.includes(date),lam=T.rate*(ws?ws.daily*b.wal*(pd?(ws.payday||SP.payday.mul):1):(pd?SP.payday.mul:1));
   let n=lam>=1?Math.floor(lam)+(r()<lam%1?1:0):r()<lam?1+(r()<lam*.35?1:0):0;while(n--){const s=ss[Math.floor(r()*ss.length)];buy(s[0]+r()*(s[1]-s[0]),bWeighted(T.packs,r()))}}
  // borong saat banner baru (sesi pertama setelah banner dimulai, maks 2 hari)
  let lastSplurge=-Infinity;   // borong paling sering sekali per 3 hari (banner yang rilis berdekatan tidak diborong semua)
  BOT_CFG.ERAS.forEach((E,k)=>{if(!k)return;const t=botSnap(b,E.at);if(t<b.spend0||t-E.at>2*BDAY||!botActive(b,t)||t-lastSplurge<3*BDAY)return;lastSplurge=t;const r=bRng(bHash(b.i,7500+k));
   let n=T.banner[0]+Math.floor(r()*(T.banner[1]-T.banner[0]+1));if(b.ws)n=Math.round(n*b.ws.banner*b.wal);for(let j=0;j<n;j++)buy(t+(j+1)*45e3+r()*3e4,bWeighted(T.bp,r()))});
  // paket (bundle): sekali beli, penawaran naik level, Dana Pertumbuhan, mingguan, bulanan — peluang per tier (SPEND.bun), aliran acak sendiri per paket
  const BU=SP.bun&&SP.bun[T.id],tEnd=Math.min(b.endT,now+BDAY),lvOk=(L,t)=>L<=1||botLv(b.cv,botProg(b,t))>=L,lvAt=L=>L>1?botLvTime(b,L):b.join;
  if(BU&&TOPUP_CFG.bundles)for(const x of TOPUP_CFG.bundles){const p=BU[x.lim==='offer'?'lv':x.id];if(!p)continue;const L=x.lv||x.minLv||1,t0=Math.max(b.spend0,lvAt(L));if(t0>tEnd)continue;
   if(x.lim==='once'||x.lim==='offer'){const r=bRng(bHash(b.i,7300+bStrH(x.id)));if(r()<p){const t=botSnap(b,t0+r()*(x.lim==='offer'?.5:1.5)*BDAY);if(t<=tEnd&&lvOk(L,t))buy(t,x.id)}continue}
   const per=(x.lim==='week'?7:30)*BDAY;for(let k=0;t0+k*per<=tEnd;k++){const r=bRng(bHash(b.i,7300+bStrH(x.id)+(k+1)*101));if(r()<p){const t=botSnap(b,t0+k*per+r()*2*BDAY);if(t<=tEnd&&lvOk(L,t))buy(t,x.id)}}}
  buys.sort((x,y)=>x.t-y.t);const seen={},F=TOPUP_CFG.fund;
  for(const o of buys){const p=tuPack(o.id);if(o.id==='mc')o.gems=p.now;
   else if(p.lim){const w=p.rw||{},m=w.mats||{};o.gems=(w.gems||0)+((w.tixH||0)+(w.tixW||0))*COST1+(w.pickHero?6000:0);o.asc=(m.asc1||0)+(m.asc2||0)*3+(m.asc3||0)*30;
    if(p.fund&&F)F.lv.forEach((L,k)=>{const t=Math.max(o.t,lvAt(L));if(t<=tEnd&&lvOk(L,t))gems.push([t+6e4,F.gems[k]])})}
   else{o.gems=p.gems+(seen[o.id]?p.bonus:p.gems);seen[o.id]=1}gems.push([o.t,o.gems])}
  gems.sort((x,y)=>x[0]-y[0]);if(!BSPEND[b.i]&&++BSPEND_N>20000){for(const k in BSPEND)delete BSPEND[k];BSPEND_N=1}c=BSPEND[b.i]={key,buys,gems}}
 const buys=c.buys.filter(o=>o.t<=now),total=buys.reduce((a,o)=>a+o.price,0),V=BOT_CFG.SPEND.VIP;let vip=0;while(vip<V.length&&total>=V[vip])vip++;
 const lastCard=buys.filter(o=>o.id==='mc').pop();
 return{buys,gems:c.gems.filter(g=>g[0]<=now),total,vip,card:lastCard&&lastCard.t+TOPUP_CFG.card.days*BDAY>now?lastCard.t+TOPUP_CFG.card.days*BDAY:0}}
/* permata berbayar -> waktu tarikan (langsung ditarik saat cukup, 10× bila bisa) */
function botPaidPulls(gems){let bal=0;const out=[];for(const[t,g]of gems){bal+=g;let k=0;while(bal>=COST10){for(let j=0;j<10;j++)out.push(t+2e4+k*1e3);bal-=COST10;k++}while(bal>=COST1){out.push(t+2e4+k*1e3);bal-=COST1;k++}}return out}
/* penabung: banner yang dilewati -> tarikan ditahan sampai banner incaran berikutnya (atau tabungan penuh) */
const botSkipEra=(b,k)=>k>0&&bHash(b.i,300+k)%2===0;
function botSaveTimes(b,ts,now){if(!b.saver)return{ts,held:0};const E=BOT_CFG.ERAS,out=[];let hold=[];
 for(const t of ts){const k=eraIdx(t);if(!botSkipEra(b,k)){if(hold.length){out.push(...hold.map(()=>t));hold=[]}out.push(t);continue}
  let j=k+1;while(j<E.length&&botSkipEra(b,j))j++;
  if(j<E.length){const rt=botSnap(b,E[j].at)+6e4;out.push(rt);continue}
  hold.push(t);if(hold.length>=BOT_CFG.EMO.saveCap){out.push(...hold.map(()=>t));hold=[]}}
 return{ts:out.filter(t=>t<=now).sort((x,y)=>x-y),held:hold.length+out.filter(t=>t>now).length}}
// progres (hari bermain efektif) pada waktu t, dan kebalikannya
// progres linear (masa aktif × kecepatan)
function botProgLin(b,t){let P=0;for(const[s0,s1,r]of b.segs){if(t<=s0)break;P+=r*(Math.min(t,s1)-s0)/BDAY}return P}
function botProgInvLin(b,P){let acc=0;for(const[s0,s1,r]of b.segs){const len=(s1-s0)/BDAY*r;if(acc+len>=P)return s0+(P-acc)/r*BDAY;acc+=len}return Infinity}
/* Progres hanya bertambah saat bot sedang MAIN: jatah progres satu "hari progres" (05:00–05:00 WIB, jam paling sepi)
   dibagi ke sesi-sesi main hari itu. Saat offline angkanya diam; saat online naik sedikit demi sedikit. */
const PDAY_H=5;
const pDay=t=>Math.floor((t+(BOT_CFG.TZ-PDAY_H)*36e5)/BDAY),pDayStart=d=>d*BDAY-(BOT_CFG.TZ-PDAY_H)*36e5;
const BPLAY=new Map();
function botPlay(b,d){const k=b.i*100000+d;let o=BPLAY.get(k);if(o)return o;const ds=pDayStart(d),de=ds+BDAY,L=[];
 for(let w=wibDay(ds);w<=wibDay(de);w++)for(const[s0,s1]of botSessions0(b,w)){const a=Math.max(s0,ds),z=Math.min(s1,de);if(z>a)L.push([a,z])}
 if(b.join>=ds&&b.join<de)L.push([b.join,Math.min(de,b.join+15*6e4)]);   // sesi pertama: tutorial saat baru bergabung
 L.sort((x,y)=>x[0]-y[0]);const M=[];for(const s of L){const l=M[M.length-1];if(l&&s[0]<=l[1])l[1]=Math.max(l[1],s[1]);else M.push(s.slice())}
 o={L:M,tot:M.reduce((a,s)=>a+s[1]-s[0],0)};if(BPLAY.size>80000)BPLAY.clear();BPLAY.set(k,o);return o}
function botProg(b,t){if(t<=b.join)return 0;const d=pDay(t),ds=pDayStart(d),a=botProgLin(b,Math.max(ds,b.join)),z=botProgLin(b,ds+BDAY);if(z<=a)return a;
 const S=botPlay(b,d);if(!S.tot)return a;let x=0;for(const[s0,s1]of S.L){if(t<=s0)break;x+=Math.min(t,s1)-s0}return a+(z-a)*x/S.tot}
// kebalikan: kapan progres P tercapai (selalu di dalam sesi main)
function botProgInv(b,P){const tl=botProgInvLin(b,P);if(!isFinite(tl))return tl;const d=pDay(tl),ds=pDayStart(d),a=botProgLin(b,Math.max(ds,b.join)),z=botProgLin(b,ds+BDAY);
 const S=botPlay(b,d);if(z<=a||!S.tot){for(let e=d+1;e<=d+4;e++){const T=botPlay(b,e);if(T.tot)return T.L[0][0]}return tl}
 let x=(P-a)/(z-a)*S.tot;for(const[s0,s1]of S.L){if(x<=s1-s0)return s0+x;x-=s1-s0}return S.L[S.L.length-1][1]}
const botActive=(b,t)=>b.segs.some(([s0,s1])=>t>=s0&&t<s1);

/* ---- kurva per gaya main (hasil simulasi) ---- */
const BCOL={};
// kurva tier pembelanja menengah (SPEND.blend) = campuran kurva F2P & whale dengan profil+pengalaman yang sama
(function botBlendCurves(){const C=BOT_CFG.CURVES,B=BOT_CFG.SPEND.blend||{};
 const at=(W,P,c)=>{if(P<=W[0][0])return W[0][c];for(let j=1;j<W.length;j++)if(W[j][0]>=P){const a=W[j-1],b=W[j],u=(P-a[0])/((b[0]-a[0])||1);return a[c]+(b[c]-a[c])*u}return W[W.length-1][c]};
 for(const k of Object.keys(C)){if(k.split('_').length!==2)continue;const W=C[k+'_whale'],F=C[k];if(!W)continue;
  for(const t in B){const key=k+'_'+t;if(C[key])continue;const f=B[t];C[key]=F.map(r=>r.map((v,c)=>c===0?v:Math.round((v+f*(at(W,r[0],c)-v))*100)/100))}}})();
function bCol(pf,c){const k=pf+c;if(BCOL[k])return BCOL[k];return BCOL[k]=BOT_CFG.CURVES[pf].map(r=>[r[0],r[c]])}
function bTail(pf,c){const T=BOT_CFG.CURVES[pf],n=T.length-1,a=T[n-BOT_CFG.XP_TAIL_DAYS],b=T[n];return(b[c]-a[c])/(b[0]-a[0])}
function botCurve(pf,c,P){const T=BOT_CFG.CURVES[pf],L=T[T.length-1];if(P<=L[0])return bInterp(bCol(pf,c),P);return c===2||c===5?L[c]+bTail(pf,c)*(P-L[0]):L[c]}
const BXP={};
function botLv(pf,P){const T=BOT_CFG.CURVES[pf],L=T[T.length-1];if(P<=L[0])return Math.max(1,Math.floor(bInterp(bCol(pf,1),P)));
 if(BXP[pf]==null){const a=T[T.length-1-BOT_CFG.XP_TAIL_DAYS];let xp=0;for(let l=a[1];l<L[1];l++)xp+=expNeed(l);BXP[pf]=xp/(L[0]-a[0])}
 let lv=L[1],xp=(P-L[0])*BXP[pf];while(lv<999&&xp>=expNeed(lv)){xp-=expNeed(lv);lv++}return lv}
// waktu bot mencapai level akun L (dari kurva level gaya mainnya)
function botLvTime(b,L){const T=BOT_CFG.CURVES[b.cv];for(let k=1;k<T.length;k++)if(T[k][1]>=L){const a=T[k-1],c=T[k];return botProgInv(b,a[0]+(c[0]-a[0])*(L-a[1])/Math.max(1e-9,c[1]-a[1]))}return botProgInv(b,T[T.length-1][0])}
// progres saat total summon mencapai n
function botSumInv(pf,n){const T=BOT_CFG.CURVES[pf];if(n<=T[0][2])return 0;for(let k=1;k<T.length;k++)if(T[k][2]>=n){const a=T[k-1],b=T[k];return a[0]+(b[0]-a[0])*(n-a[2])/Math.max(1e-9,b[2]-a[2])}
 const L=T[T.length-1];return L[0]+(n-L[2])/Math.max(1e-9,bTail(pf,2))}

/* ---- linimasa banner: era & pool pada waktu tertentu ---- */
function eraIdx(t){const E=BOT_CFG.ERAS;let k=0;for(let j=0;j<E.length;j++)if(E[j].at<=t)k=j;return k}
const heroSince=id=>BOT_CFG.HERO_SINCE[id]||0;
const BPOOL={};
function eraPool(t,isW,up){const k=eraIdx(t),E=BOT_CFG.ERAS[k],av=HEROES.filter(h=>heroSince(h.id)<=t).length,key=k+'|'+av+'|'+(isW?'w':'h')+'|'+up;if(BPOOL[key])return BPOOL[key];
 const lim=id=>E.limited.includes(id),P={1:[],2:[],3:[]};
 if(isW)WEAPONS.forEach(w=>{const ok=!w.owner||heroSince(w.owner)<=t;if(ok&&(!(w.owner&&lim(w.owner))||w.id===up))P[w.r].push(w.id)});
 else HEROES.forEach(h=>{if(heroSince(h.id)<=t&&(!lim(h.id)||h.id===up))P[h.r].push(h.id)});
 return BPOOL[key]=P}

/* ---- gacha tersimulasi sepanjang waktu (peluang asli + banner yang aktif saat itu) ---- */
function botGacha(b,P,now=Date.now()){const C=BOT_CFG,total=Math.max(0,botCurve(b.cvS,2,P)),nH=Math.floor(total*C.HERO_SHARE),nW=Math.floor(total*(1-C.HERO_SHARE));
 const heroes={},weapons={},ev=[];STARTERS().forEach(id=>heroes[id]={lv:1,lb:0,wpn:null,at:b.join});STARTERS().map(id=>basicWeapon(HD[id].wcls)).filter(Boolean).forEach(w=>weapons[w]=newWpn());
 // waktu tiap tarikan: gratis (dari kurva progres) + berbayar (dari top up), lalu diurutkan
 // tarikan gratis ke-k (0-based) baru terhitung saat total summon mencapai k+1 → waktunya = saat itu (bukan saat tarikan ke-k).
 // Dengan begitu riwayat gacha STABIL: menghitung di waktu mana pun memberi kejadian ★3 yang sama untuk masa lalu
 // (tarikan gratis tidak lagi "disisipkan mundur" di antara tarikan berbayar yang sudah terjadi → hasil tidak teracak ulang).
 const fT=(k,share)=>Math.max(b.join,botProgInv(b,botSumInv(b.cvS,k/share))),tH=[],tW=[];
 for(let k=0;k<nH;k++)tH.push(fT(k+1,C.HERO_SHARE));for(let k=0;k<nW;k++)tW.push(fT(k+1,1-C.HERO_SHARE));
 const SP=botSpend(b,now),burn=b.tier.burn||0,paid=botPaidPulls(burn?SP.gems.map(([t,g])=>[t,g*(1-burn)]):SP.gems);paid.forEach((t,k)=>{if(t<=now)(bHash(b.i,9000+k)%100<C.SPEND.heroShare*100?tH:tW).push(t)});
 const sv=botSaveTimes(b,tH.filter(t=>t<=now).sort((x,y)=>x-y),now);tW.sort((x,y)=>x-y);while(tW.length&&tW[tW.length-1]>now)tW.pop();
 const run=(ts,isW,rng)=>{const st={pity:0,g:false};for(const t of ts){const ek=eraIdx(t),E=C.ERAS[ek];
  const ups=isW?E.wpn:E.hero,up=b.chaser&&ups.length?ups[bHash(b.i,ek+(isW?50:0))%ups.length]:null,pool=eraPool(t,isW,up);
  const pb=st.pity+1,o=gachaRoll(st,up,r=>pool[r],rng,false,isW),r=o.r,id=o.id;if(!id)continue;
  if(r===3)ev.push({t,id,w:isW,lim:isW?!!(WD[id].owner&&E.limited.includes(WD[id].owner)):E.limited.includes(id),up:!!up,on:!!o.on,n:pb,dupe:!!(isW?weapons:heroes)[id]});
  const own=isW?weapons:heroes,o0=own[id];if(o0){if(isW){if(o0.ref<DUPE_MAX)(o0.rt||(o0.rt=[])).push(t);o0.ref=Math.min(DUPE_MAX,o0.ref+1)}else{if(o0.lb<DUPE_MAX)(o0.dt||(o0.dt=[])).push(t);else bdg.push([t,BADGE_DUPE[HD[id].r]||0]);o0.lb=Math.min(DUPE_MAX,o0.lb+1)}}
  else own[id]=isW?Object.assign(newWpn(),{at:t}):{lv:1,lb:0,wpn:null,at:t}}
  return st.pity};
 const bdg=[],pH=run(sv.ts,false,bRng(b.seed)),pW=run(tW,true,bRng(b.seed^0x5bd1e995));
 // hero ★3 pilihan (Paket Sultan) & tukar Lencana Ksatria (Toko Lencana): yang belum dimiliki dulu — para sultan mengejar koleksi lengkap
 const STD3=HEROES.filter(h=>h.r===3&&!h.limited).map(h=>h.id),xc=(SHOP_X.find(x=>x.give&&x.give.pickHero===3)||{cost:300}).cost;
 const pick=t=>{const miss=STD3.filter(id=>!(heroes[id]&&heroes[id].at<=t));if(miss.length){const id=miss[bHash(b.i,8800+Math.floor(t/6e4))%miss.length],h=heroes[id];
   if(h){const t2=h.at;h.at=t;if(h.lb<DUPE_MAX){(h.dt||(h.dt=[])).push(t2);h.lb++}}else heroes[id]={lv:1,lb:0,wpn:null,at:t};return}
  const L=STD3.filter(id=>heroes[id].lb<DUPE_MAX).sort((x,y)=>heroes[x].lb-heroes[y].lb||(x<y?-1:1));if(L.length){const h=heroes[L[0]];(h.dt||(h.dt=[])).push(t);h.lb++}};
 const PE=(SP.buys||[]).filter(o=>{const p=tuPack(o.id);return p&&p.rw&&p.rw.pickHero}).map(o=>[o.t,0]).concat(bdg.map(x=>[x[0],x[1]])).sort((x,y)=>x[0]-y[0]);
 let bal=0;for(const[t,g]of PE){if(!g){pick(t+3e5);continue}bal+=g;if(bal>=xc){bal-=xc;pick(t+6e5)}}
 ev.sort((x,y)=>x.t-y.t);
 return{heroes,weapons,ev,nH:sv.ts.length,nW:tW.length,paid:paid.length,held:sv.held,spend:SP,pity:pH,wpity:pW}}

/* ---- tim terbaik: coba kombinasi dari 7 hero terkuat ----
   bTeamCP = rumus teamCP yang sama persis (urutan penjumlahan sama), tanpa teks bonus & memakai kekuatan hero yang sudah dihitung */
function bTeamCP(ids,pw){let base=0,bonus=0,tk=false,sp=false,sg=0,mx=0;const ec={};
 for(const id of ids){base+=pw[id];const h=HD[id],n=ec[h.el]=(ec[h.el]||0)+1;if(n>mx)mx=n;if(h.role==='tanker')tk=true;else if(h.role==='support')sp=true;const w=wpnOf(id);if(w&&w.owner===id)sg++}
 if(CP_BONUS.elem[mx])bonus+=CP_BONUS.elem[mx];if(tk&&sp)bonus+=CP_BONUS.balance;if(ids.length===4)bonus+=CP_BONUS.full;if(sg)bonus+=CP_BONUS.sig*sg;
 return Math.round(base*(1+bonus))}
// K kombinasi terbaik (urut menurun) dari 7 hero terkuat
function botBestTeams(ids,pw,K){const top=ids.slice().sort((a,b)=>pw[b]-pw[a]).slice(0,7);const k=Math.min(4,top.length),L=[];
 const rec=(st,cur)=>{if(cur.length===k){const v=bTeamCP(cur,pw);if(L.length<K||v>L[L.length-1][0]){L.push([v,cur.slice()]);L.sort((a,b)=>b[0]-a[0]);if(L.length>K)L.pop()}return}
  for(let j=st;j<top.length;j++){cur.push(top[j]);rec(j+1,cur);cur.pop()}};rec(0,[]);return L.length?L.map(x=>x[1]):[top.slice(0,k)]}

/* ---- susun akun bot: level hero → tim → senjata & perlengkapan → kebangkitan (S harus sudah = F) ----
   Acak STABIL per hero/slot (bukan satu aliran berurutan): hero baru tidak mengacak ulang level & pilihan hero lama.
   full=false: versi ringan untuk menghitung ulang masa lalu (tim = 4 terkuat dasar, tanpa hero favorit & kebangkitan).
   pu = hari main efektif saat bahan kebangkitan mulai terkumpul (null = belum). */
function botFit(b,i,F,P,lv,opt,fav,full,pu,bx){const C=BOT_CFG,heroes=F.heroes,weapons=F.weapons,own=Object.keys(heroes);
 const hu=(id,k)=>bHash(i,7000+bStrH(id)*8+k)/4294967296,su=k=>bHash(i,7600+k)/4294967296;
 // level hero naik bertahap sejak hero itu didapat (hari main efektif) menuju batasnya; pemain rapi (opt tinggi) lebih cepat & lebih penuh.
 // Awal main tetap dibatasi emas (2+3×level akun) dan batas level akun.
 const lvF={},HL=C.HLV;
 for(const id of own){const h=heroes[id],L=HL[Math.min(3,Math.max(1,HD[id].r))],dP=Math.max(0,P-(h.at>b.join?botProg(b,h.at):0));
  const f1=Math.min(1,L.f1[0]+L.f1[1]*opt),f0=Math.min(f1,L.f0[0]+L.f0[1]*opt+(hu(id,0)-.5)*.08),tau=(L.tau[0]+L.tau[1]*(1-opt))*(.85+.3*hu(id,1));
  const f=f1-(f1-f0)*Math.exp(-dP/tau);lvF[id]=f;h.lv=Math.max(1,Math.min(Math.round(maxLv(id)*f),2+3*lv))}
 const pw0={};for(const id of own)pw0[id]=heroPow(id);const ids=own.sort((x,y)=>pw0[y]-pw0[x]||(x<y?-1:1));
 const wl=Math.round(botCurve(b.cv,3,P)*(.8+.2*opt)),wlb=Math.floor(botCurve(b.cv,4,P)*(opt>.8?1:.75)+.001),byC={};
 for(const w in weapons){const c=WD[w].cls;(byC[c]||(byC[c]=[])).push(w)}for(const c in byC)byC[c].sort((x,y)=>WD[y].r-WD[x].r||weapons[y].ref-weapons[x].ref);
 const B=full?botAscBudget(b,P,opt,pu)+(bx||0):0,St=B>0?botAscStar(B):0;   // bx = bahan Kebangkitan dari paket yang dibeli (P2W: bisa sebelum 5-5)
 // tim dipilih dari kekuatan "kalau dipakai": hero + senjata terbaik kelasnya + bintang kebangkitan yang terjangkau anggaran (St) + sinergi.
 // Barang terbaik lalu diberikan ke anggota tim lebih dulu — seperti pemain sungguhan: barang & bahan tidak "nyasar" ke hero cadangan,
 // dan hero ★2 dengan dupe penuh tetap dihargai setelah semua anggota tim naik ★4+.
 let sel=pw0,cands;
 if(full){sel={};const sv={},lv0={};for(const w in weapons){const o=weapons[w];sv[w]=[o.lv,o.lb];o.lb=Math.min(WPN_LB_MAX,wlb);o.lv=Math.max(1,Math.min(wMaxLv(w),wl))}
  // senjata dibagi berurutan dari hero terkuat (aturan sama dengan pemasangan sungguhan), jadi dua hero sekelas tidak dihitung memakai senjata yang sama
  const us=new Set();for(const id of ids){const h=heroes[id],L=byC[HD[id].wcls];lv0[id]=h.lv;h.wpn=null;
   if(L){const sg=L.find(w=>WD[w].owner===id&&!us.has(w)),cd=sg?[sg]:[];for(const w of L){if(cd.length>1)break;if(w!==sg&&!us.has(w))cd.push(w)}const w=cd.length>1&&hu(id,2)>opt+.15?cd[1]:cd[0];if(w){us.add(w);h.wpn=w}}
   if(St>HD[id].r){h.asc=St;h.lv=Math.max(1,Math.round(maxLv(id)*lvF[id]))}sel[id]=heroPow(id)}
  cands=botBestTeams(ids,sel,6);
  for(const id of own){const h=heroes[id];h.wpn=null;if(h.asc){delete h.asc;h.lv=lv0[id]}}for(const w in weapons){const o=weapons[w];o.lv=sv[w][0];o.lb=sv[w][1]}
  // tidak semua pemain memakai tim optimal: sebagian tetap membawa hero favoritnya (asal tidak jauh lebih lemah)
  const lock=b.ws&&b.ws.fav&&fav&&heroes[fav];   // sultan setia: hero kesayangan SELALU di tim
  if(fav&&heroes[fav]&&(lock||su(99)>opt))cands=cands.map(t=>{if(t.includes(fav))return t;const weak=t.slice().sort((x,y)=>sel[x]-sel[y])[0];return lock||sel[fav]>=sel[weak]*.8?t.map(id=>id===weak?fav:id):t});
  const seen=new Set();cands=cands.filter(t=>{const k=t.slice().sort().join();if(seen.has(k))return false;seen.add(k);return true})}
 else cands=[ids.slice(0,4)];
 // pasang barang & kebangkitan untuk satu tim (dari keadaan dasar). Beberapa calon tim teratas dicoba dengan barang sungguhan, dipilih CP tertinggi:
 // tim hanya berganti kalau benar-benar lebih kuat, jadi CP tidak turun saat hero baru menyusul.
 const lvB={},W0={};for(const id of own)lvB[id]=heroes[id].lv;for(const w in weapons){const o=weapons[w];W0[w]=[o.lv,o.lb]}
 const apply=(team,all)=>{for(const id of own){const h=heroes[id];h.wpn=null;delete h.ar;delete h.ac;delete h.asc;h.lv=lvB[id]}for(const w in weapons){const o=weapons[w];o.lv=W0[w][0];o.lb=W0[w][1];delete o.asc}F.gear={};
  const tm=team.slice().sort((x,y)=>sel[y]-sel[x]||(x<y?-1:1)),inT=new Set(team),order=all?tm.concat(ids.filter(id=>!inT.has(id))):tm,used=new Set();
  for(const id of order){const L=byC[HD[id].wcls];if(!L)continue;const sg=L.find(w=>WD[w].owner===id&&!used.has(w)),cd=sg?[sg]:[];for(const w of L){if(cd.length>1)break;if(w!==sg&&!used.has(w))cd.push(w)}
   // pemain kurang optimal kadang lupa memasang senjata terbaik (keputusan tetap per hero)
   const w=cd.length>1&&hu(id,2)>opt+.15?cd[1]:cd[0];if(!w)continue;used.add(w);heroes[id].wpn=w;const o=weapons[w],isC=inT.has(id);
   o.lb=Math.min(WPN_LB_MAX,isC?wlb:Math.floor(wlb/2));o.lv=Math.max(1,Math.min(wMaxLv(w),isC?wl:Math.round(wl*.6)))}
  // perlengkapan per posisi di tim (pindah ke hero yang menggantikan posisi itu), naik level seiring progres
  if(P>=C.GEAR_FROM_DAY)['armor','acc'].forEach((slot,sk)=>tm.forEach((id,k)=>{const u=x=>su(sk*40+k*5+x);if(u(0)>opt+.2)return;
   const rr=P<4?1:P<7?(u(1)<.6?2:1):(u(1)<.35?3:2);const pool=GEAR.filter(g=>g.slot===slot&&g.r===rr&&!F.gear[g.id]);if(!pool.length)return;
   const g=pool[Math.floor(u(2)*pool.length)];F.gear[g.id]={lv:Math.min(GEAR_MAX_LV[g.r],Math.floor((P-C.GEAR_FROM_DAY)*1.5*(.4+.6*opt)*(.6+u(3)*.4))),ref:0};heroes[id][gKey(slot)]=g.id}));
  // kebangkitan: urutan tetap (bintang tertinggi, lalu yang paling lama dimiliki) supaya bahan tidak "pindah" antar hero
  const sp=b.ws&&b.ws.spread||0,Bt=B*(1-sp),fv=b.ws&&b.ws.fav?fav:null;
  // urutan bahan tetap: hero kesayangan (setia), lalu yang paling lama dimiliki — bahan yang sudah tertanam tidak "pindah" ke pendatang baru
  if(Bt>0)botAscend(Bt,team.slice().sort((x,y)=>(y===fv)-(x===fv)||(heroes[x].at||0)-(heroes[y].at||0)||HD[y].r-HD[x].r||(x<y?-1:1)),heroes,weapons,F.gear,lvF);
  // kolektor: sebagian bahan untuk hero cadangan (koleksinya ikut bintang tinggi, tim sedikit lebih lemah dari sultan meta)
  if(all&&sp>0&&B>0)botAscend(B*sp,own.filter(id=>!inT.has(id)).sort((x,y)=>HD[y].r-HD[x].r||(heroes[x].at||0)-(heroes[y].at||0)||(x<y?-1:1)),heroes,weapons,F.gear,lvF);
  return teamCP(team).total};
 // calon dinilai dengan barang untuk anggota tim saja (hero cadangan tidak memengaruhi CP), lalu tim terpilih dipasang lengkap
 let team=cands[0];if(cands.length>1){let bv=-1;for(const t of cands){const v=apply(t,false);if(v>bv){bv=v;team=t}}}
 apply(team,full);
 return{ids,team,lvF}}

/* ---- kapan bot mulai mengumpulkan bahan kebangkitan: saat CP timnya (sebelum kebangkitan) pertama kali ≥ minCP (≈ menembus 5-5) ----
   Dicari mundur dari hasil gacha sekarang (urutan tarikan tetap -> isi akun di masa lalu = awalannya), sekali per bot, lalu disimpan.
   Karena titik mulai tetap, bahan terus bertambah setiap hari main: CP tidak macet di dinding 5-5 dan tidak anjlok saat tim berganti. */
const BPU={k:'',d:{},dirty:0,at:0};
function bpuLoad(){const k=bsumKey();if(BPU.k===k)return;BPU.k=k;BPU.d={};try{localStorage.removeItem('aster_botpu');const o=JSON.parse(localStorage.getItem('aster_botpu2')||'null');if(o&&o.k===k&&o.d)BPU.d=o.d}catch(e){}}
function bpuSave(){if(!BPU.dirty||Date.now()-BPU.at<3e4)return;BPU.at=Date.now();BPU.dirty=0;const j=JSON.stringify({k:BPU.k,d:BPU.d});
 try{if(j.length<5e5)localStorage.setItem('aster_botpu2',j);else localStorage.removeItem('aster_botpu2')}catch(e){}}
function botCp0At(b,i,G,t){const P=botProg(b,t),lv=botLv(b.cv,P),H={},W={};
 for(const id in G.heroes){const h=G.heroes[id];if(h.at>t)continue;let lb=0;if(h.dt)for(const x of h.dt)if(x<=t)lb++;H[id]={lv:1,lb,wpn:null,at:h.at}}
 for(const id in G.weapons){const w=G.weapons[id];if((w.at||0)>t)continue;let rf=0;if(w.rt)for(const x of w.rt)if(x<=t)rf++;W[id]={ref:rf,lv:1,exp:0,lb:0,at:w.at}}
 const F={lv,exp:0,heroes:H,weapons:W,gear:{},team:[],mats:{}},keep=S;S=F;try{return teamCP(botFit(b,i,F,P,lv,b.opt,null,false,null).team).total}finally{S=keep}}
function botAscGet(i){bpuLoad();const v=BPU.d[i];return v==null?null:v}
// Titik mulai dicari di kisi waktu TETAP sejak bergabung (per hari, lalu ±11 menit di hari itu) → hasilnya sama di semua perangkat,
// tidak bergantung kapan perangkat itu pertama kali menghitung (dulu: bagi dua antara join..sekarang → beda tipis antar perangkat).
function botAscStart(b,i,G,now){const A=BOT_CFG.ASC,ok=t=>botCp0At(b,i,G,t)>=A.minCP;let d=1;
 while(b.join+d*BDAY<now&&!ok(b.join+d*BDAY))d++;
 let hi=Math.min(now,b.join+d*BDAY),lo=Math.max(b.join,hi-BDAY);if(hi>=now&&!ok(now))lo=hi=now;
 for(let k=0;k<7&&hi>lo;k++){const m=(lo+hi)/2;if(ok(m))hi=m;else lo=m}
 BPU.dirty++;return BPU.d[i]=Math.round(botProg(b,hi)*100)/100}

/* ---- Kebangkitan bot: anggaran bahan sejak (perkiraan) menembus 5-5, dibelanjakan berurutan ★4 → ★5 → ★6 ---- */
// bahan terkumpul sejak mulai (pu = hari main efektif saat menembus minCP) -> tidak pernah berkurang
function botAscBudget(b,P,opt,pu){const C0=BOT_CFG,A=C0.ASC;if(!A||pu==null||P<=pu)return 0;return(P-pu)*A.perDay*(A.tier[b.tier.id]||1)*(C0.SKILL[b.sk].asc||1)*(.55+.45*opt)}
// bintang yang dicapai SEMUA 4 anggota tim dengan anggaran B (urutan belanja: 4 hero, 4 senjata, 8 perlengkapan per bintang)
function botAscStar(B){const A=BOT_CFG.ASC;let c=0,st=0;for(const s of[4,5,6]){c+=4*A.cost.h[s];if(c>B)break;st=s;c+=4*A.cost.w[s]+8*A.cost.g[s]}return st}
// Urutan belanja tetap per POSISI (4 hero, 4 senjata, 8 perlengkapan per bintang) dan biaya slot senjata/perlengkapan tetap dihitung walau kosong:
// bintang yang dicapai tiap posisi hanya bergantung pada anggaran B — ganti anggota tim/senjata tidak "mencabut" bintang hero lain.
function botAscend(B,core,heroes,weapons,gear,lvF){const A=BOT_CFG.ASC,C4=core.slice(0,4);
 const steps=[];for(const s of[4,5,6]){for(const id of C4)steps.push(['h',id,s]);for(const id of C4)steps.push(['w',heroes[id].wpn,s]);
  for(const id of C4)for(const sl of['ar','ac'])steps.push(['g',heroes[id][sl],s])}
 for(const[k,key,s]of steps){const c=A.cost[k][s];if(B<c)break;B-=c;if(!key)continue;
  if(k==='h'){heroes[key].asc=Math.max(HD[key].r,s);heroes[key].lv=Math.max(1,Math.round(maxLv(key)*(lvF[key]||.8)))}
  else if(k==='w'){const o=weapons[key],cap0=wMaxLv(key),fr=Math.min(1,o.lv/cap0);o.asc=Math.max(WD[key].r,s);o.lv=Math.max(1,Math.round(wMaxLv(key)*fr))}
  else{const o=gear[key];if(!o)continue;const cap0=gearMax(key),fr=cap0?Math.min(1,o.lv/cap0):0;o.asc=Math.max(GDD[key].r,s);o.lv=Math.round(gearMax(key)*fr)}}}

/* ---- keadaan bot pada waktu now ---- */
// kunci cache: berubah hanya saat progres/level/era/top up (permata & paket, termasuk bahan Kebangkitan)/tabungan berubah
// Pe = progres + usaha ekstra rival (systems/rival.js botBoost); gacha tetap memakai P (usaha tidak menambah tarikan)
function botKey(i,now=Date.now()){const b=botBase(i),C=BOT_CFG,P=botProg(b,now),E=typeof botBoost==='function'?botBoost(i,now):0,Pe=P+E,lv=botLv(b.cv,Pe),sp0=botSpend(b,now);return{b,P,Pe,lv,key:Math.floor(Pe*96)+':'+lv+':'+C.ERAS.length+':'+sp0.gems.length+'.'+sp0.buys.length+':'+(b.saver?Math.floor(now/36e5):0)}}
function botState(i,now=Date.now()){const C=BOT_CFG,{b,P:P0,Pe:P,lv,key}=botKey(i,now);const c=BOTS.cache[i];if(c&&c.key===key)return c;
 let G=botGacha(b,P0,now),heroes=G.heroes,weapons=G.weapons;
 const F={lv,exp:0,heroes,weapons,gear:{},team:[],mats:{}};const keep=S;S=F;let out;
 try{const opt=b.opt;
  // hero favorit: ★3 pertama yang didapat; yang tidak setia pindah ke ★3 terbatas terbaru. Belum punya ★3 -> hero acak miliknya
  const firstH=G.ev.find(e=>!e.w),lastLim=G.ev.filter(e=>!e.w&&e.lim).pop(),own=Object.keys(heroes);
  // sultan setia: hero kesayangan (selera) begitu dimiliki — selalu di tim & dibangkitkan dulu
  const fav=b.ws&&b.ws.fav&&heroes[b.love]?b.love:!b.loyal&&lastLim?lastLim.id:firstH?firstH.id:own[bHash(i,9)%own.length];
  // bahan Kebangkitan dari paket: dipakai bertahap (ASC.ramp hari main sejak dibeli), sebagian langsung
  const RP=C.ASC.ramp||0,bx=G.spend.buys.reduce((a,o)=>a+(o.asc?o.asc*(RP?Math.min(1,.2+.8*Math.max(0,P-botProg(b,o.t))/RP):1):0),0);
  let pu=botAscGet(i),R=botFit(b,i,F,P,lv,opt,fav,true,pu,bx);
  // baru menembus minCP: cari kapan mulainya (sekali per bot, disimpan), lalu susun ulang dengan bahan yang sudah terkumpul
  if(pu==null&&teamCP(R.team).total>=C.ASC.minCP){pu=botAscStart(b,i,G,now);if(pu<P){G=botGacha(b,P0,now);heroes=G.heroes;weapons=G.weapons;F.heroes=heroes;F.weapons=weapons;F.gear={};R=botFit(b,i,F,P,lv,opt,fav,true,pu,bx)}}
  const ids=R.ids,team=R.team;F.team=team;
  // avatar profil: sultan sesuai gayanya, pemain lain campur (favorit / ★3 pertama / hero terkuat) — tidak semua memasang hero terbatas terbaru
  const ws=b.ws&&b.ws.id,ar=bHash(i,67)%100;
  const lv3=own.filter(id=>HD[id].r>=3),taste=bWeighted(own.slice().sort().map(id=>[id,HD[id].r===3?3:HD[id].r===2?1.6:.7]),bRng(bHash(i,63))()),love=heroes[b.love]?b.love:taste;
  const av=ws==='setia'?fav:ws==='banner'?(lastLim?lastLim.id:fav):ws==='meta'?team[0]:ws==='kolektor'?(love||lv3[bHash(i,66)%Math.max(1,lv3.length)]||fav):ws==='gajian'?(love||fav)
   :ar<25?fav:ar<70?love:ar<85?(firstH?firstH.id:fav):team[0];
  F.team=team;const pw={};ids.forEach(id=>pw[id]=heroPow(id));
  // hoki/apes: dibanding rata-rata ★3 yang diharapkan (peluang efektif termasuk pity ≈ ×1.05), ±1 simpangan baku
  const n3=G.ev.length,exp3=(G.nH+G.nW)*RATES[3]/100*1.05,z=(n3-exp3)/Math.sqrt(Math.max(1,exp3)),luck=z>1?'hoki':z<-1?'sial':'normal';
  let days=0;for(const[s0,s1]of b.segs){if(now<=s0)break;days+=(Math.min(now,s1)-s0)/BDAY}
  out={i,key,at:now,lv,P,heroes,weapons,gear:F.gear,team,fav,av:heroes[av]?av:fav,ws:ws||null,pw,cp:teamCP(team).total,ev:G.ev,
   stats:{sum:G.nH+G.nW,s3:n3,lim3:G.ev.filter(e=>e.lim).length,luck,days:Math.max(1,Math.ceil(days)),hours:Math.max(.1,botCurve(b.cv,5,P)),
    paid:G.paid,held:G.held,pity:G.pity,spent:G.spend.total,vip:G.spend.vip,card:G.spend.card,buys:G.spend.buys.length}};
 }finally{S=keep}
 let nCP=0;for(const s of SLIST){if(s.rec<=out.cp*1.12)nCP++;else break}
 const T=C.CURVES[b.cv],Lc=T[T.length-1];let nS=Lc[6]!=null?Math.floor(botCurve(b.cv,6,P)+1e-6):nCP;nS=Math.min(nS,nCP);if(P>Lc[0])nS=Math.max(nS,nCP);
 out.stage=SLIST[Math.max(0,Math.min(SLIST.length,nS)-1)].key;out.stN=nS;
 const ov=typeof botOv==='function'&&botOv(i);if(ov){if(ov.lv!=null)out.lv=ov.lv;if(ov.cp!=null)out.cp=ov.cp;if(ov.vip!=null)out.stats.vip=ov.vip}
 if(!BOTS.cache[i]&&++BOTS.cacheN>15000){BOTS.cache={};BOTS.cacheN=1}
 return BOTS.cache[i]=out}

/* ---- online / terakhir aktif: sesi harian mengikuti jam ramai WIB ---- */
const BSES=new Map();
const BSES0=new Map();
function botSessions(b,day){const k=b.i*100000+day;if(BSES.has(k))return BSES.get(k);const out=botSessions0(b,day).slice();
 // Bos Dunia: bot yang ikut raid login menjelang naga muncul & bertahan sampai selesai (systems/worldboss.js)
 if(typeof wbAttend==='function')for(const h of WB_CFG.slots){const a=wbAttend(b,wbSlotT(day,h));if(a)out.push([a.arrive,a.off])}
 out.sort((a,c)=>a[0]-c[0]);const M=[];for(const s of out){const L=M[M.length-1];if(L&&s[0]<=L[1])L[1]=Math.max(L[1],s[1]);else M.push(s.slice())}
 if(BSES.size>60000)BSES.clear();BSES.set(k,M);return M}
function botSessions0(b,day){const k=b.i*100000+day;if(BSES0.has(k))return BSES0.get(k);const C=BOT_CFG,pf=b.pfo,r=bRng(bHash(b.i,1000+day)),dow=new Date(day*BDAY).getUTCDay(),wk=dow===0||dow===6;
 let n=pf.sess[0]+Math.floor(r()*(pf.sess[1]-pf.sess[0]+1))+(wk?C.WEEKEND_EXTRA:0);const W=C.HOURS,tot=W.reduce((a,v)=>a+v,0),out=[];
 for(let s=0;s<n;s++){let x=r()*tot,h=0;for(;h<23;h++){if(x<W[h])break;x-=W[h]}h=(h+b.chrono+24)%24;
  const st=day*BDAY-C.TZ*36e5+(h*60+Math.floor(r()*60))*6e4,len=(pf.len[0]+r()*(pf.len[1]-pf.len[0]))*6e4;if(botActive(b,st))out.push([st,st+len])}
 out.sort((a,c)=>a[0]-c[0]);const M=[];for(const s of out){const L=M[M.length-1];if(L&&s[0]<=L[1])L[1]=Math.max(L[1],s[1]);else M.push(s.slice())}
 if(BSES0.size>60000)BSES0.clear();BSES0.set(k,M);return M}
const wibDay=(t=Date.now())=>Math.floor((t+BOT_CFG.TZ*36e5)/BDAY);
function botPresence(i,now=Date.now()){const b=botBase(i);if(now<b.join)return{online:false,last:b.join};if(now-b.join<15*6e4)return{online:true,last:now};
 const from=Math.min(now,b.endT),d0=wibDay(from);
 for(let d=d0;d>=d0-14;d--){const ss=botSessions(b,d);for(let k=ss.length-1;k>=0;k--){const[s0,s1]=ss[k];if(s0<=now){if(now<s1)return{online:true,last:now};return{online:false,last:Math.min(s1,now)}}}if(d*BDAY<b.join-BDAY)break}
 return{online:false,last:Math.min(b.endT,b.join+15*6e4)}}
// waktu sesi saat sebuah tarikan gacha terjadi (tarikan terjadi saat pemain sedang main)
function botSnap(b,t){for(let d=wibDay(t);d<=wibDay(t)+3;d++){for(const[s0,s1]of botSessions(b,d))if(s1>=t)return Math.max(s0,Math.min(t,s1))}return t}

/* ---- ringkasan bot (CP, level, VIP, hero) — skala sampai 100rb bot ----
   Bot yang sudah berhenti (endT lewat) tidak berubah lagi → ringkasannya disimpan di localStorage dan tidak dihitung ulang.
   Bot aktif: dari botState (cache penuh dibatasi ±5000 objek). Ganti SUM_VER bila keseimbangan CP berubah. */
const SUM_VER=12,BSUM={d:{},key:'',dirty:0,at:0};
const bsumKey=()=>botsSig()+':'+SUM_VER+':'+BOT_CFG.ERAS.length+':'+HEROES.length;
function bsumLoad(){const k=bsumKey();if(BSUM.key===k)return;BSUM.key=k;BSUM.d={};for(const q in BSUMA)delete BSUMA[q];try{const o=JSON.parse(localStorage.getItem('aster_botsum')||'null');if(o&&o.k===k){const D=o.d||{};for(const i in D){const x=D[i];BSUM.d[i]=Array.isArray(x)?{cp:x[0],lv:x[1],vip:x[2],top:x[3],st:x[4],nh:x[5],ms:x[6]}:x}
  const A=o.a||{};for(const i in A){const x=A[i];BSUMA[i]={k:x[0],o:{cp:x[1],lv:x[2],vip:x[3],top:x[4],st:x[5],nh:x[6],ms:x[7]}}}}}catch(e){}}
function bsumSave(){bpuSave();if(!BSUM.dirty||Date.now()-BSUM.at<3e4)return;BSUM.at=Date.now();BSUM.dirty=0;const d={},a={};for(const i in BSUM.d){const o=BSUM.d[i];d[i]=[o.cp,o.lv,o.vip,o.top,o.st,o.nh,o.ms]}
 // ringkasan bot beku (tidak berubah lagi) + bot aktif beserta kunci botKey-nya (dipakai lagi selama kuncinya sama); dibatasi ~900rb karakter agar kuota save pemain aman
 for(const i in BSUMA){if(BSUM.d[i])continue;const x=BSUMA[i],o=x.o;a[i]=[x.k,o.cp,o.lv,o.vip,o.top,o.st,o.nh,o.ms]}
 let j=JSON.stringify({k:BSUM.key,d,a});if(j.length>9e5)j=JSON.stringify({k:BSUM.key,d});if(j.length>9e5){localStorage.removeItem('aster_botsum');return}
 try{localStorage.setItem('aster_botsum',j)}catch(e){try{localStorage.removeItem('aster_botsum')}catch(e2){}}}
/* Bot berhenti di endT, tapi sesi main terakhirnya bisa masih berjalan sebentar (progres hari itu habis dibagi ke sesi hari itu).
   botEndF = saat progresnya BENAR-BENAR berhenti → sejak itu keadaannya tidak berubah lagi (aman disimpan sebagai ringkasan beku).
   (Dulu memakai endT → ringkasan beku bisa diambil di tengah sesi terakhir: CP di peringkat beda dengan profil & beda antar perangkat.) */
function botEndF(b){if(b.endF!=null)return b.endF;if(!isFinite(b.endT))return b.endF=Infinity;const S=botPlay(b,pDay(b.endT)),L=S.L[S.L.length-1];return b.endF=Math.max(b.endT,L?L[1]:b.endT)}
const botFrozen=(i,now=Date.now())=>botEndF(botBase(i))<now-6e4;
const BSUMA={};   // ringkasan bot aktif di memori, berlaku selama kunci botKey sama
// sync=false: boleh memakai ringkasan lama sebentar; bot itu masuk antrean penyegaran latar (BSQ) -> daftar tetap ringan & angka naik sendiri
const BSQ=new Set();
function botSum(i,now=Date.now(),sync=false){bsumLoad();const fz=botFrozen(i,now);let o=fz?BSUM.d[i]:null;
 if(!o&&!fz){const k=botKey(i,now).key,a=BSUMA[i];if(a&&a.k===k)o=a.o;else if(a&&!sync){o=a.o;BSQ.add(i)}}
 if(!o){const s=botState(i,now),hs=Object.keys(s.heroes);o={cp:s.cp,lv:s.lv,vip:s.stats.vip,top:s.av||s.fav||s.team[0],st:s.stage,nh:hs.length,ms:Math.max(0,...hs.map(id=>s.heroes[id].asc||HD[id].r))};if(fz){BSUM.d[i]=o}else BSUMA[i]={k:s.key,o};BSUM.dirty++}
 const ov=typeof botOv==='function'&&botOv(i);if(ov&&(ov.lv!=null||ov.cp!=null||ov.vip!=null))o=Object.assign({},o,ov.lv!=null?{lv:ov.lv}:{},ov.cp!=null?{cp:ov.cp}:{},ov.vip!=null?{vip:ov.vip}:{});return o}
const botPres=(i,now)=>botFrozen(i,now)?{online:false,last:botEndF(botBase(i))}:botPresence(i,now);
/* ---- daftar semua bot yang tampil (+ pemain sendiri) ---- */
const BLM={t:0,n:-1,L:null};
function botsList(now=Date.now()){const ids=botsIds(now),n=ids.length;let L;if(BLM.L&&BLM.n===n&&Math.abs(now-BLM.t)<6e3&&!BOTS.warming){L=BLM.L.map(e=>Object.assign({},e))}else{L=[];for(const i of ids){if(typeof botHidden==='function'&&botHidden(i))continue;const s=botSum(i,now),p=botPres(i,now),b=botBase(i);L.push({i,name:botName(i,now),vip:s.vip,lv:s.lv,cp:s.cp,top:s.top,online:p.online,last:p.last,isNew:now-b.join<BDAY,back:b.back&&now>=b.segs[2][0]})}
 bsumSave();BLM.t=now;BLM.n=n;BLM.L=L.map(e=>Object.assign({},e))}
 if(typeof NET!=='undefined')for(const p of NET.players){if(NET.acct&&p.uid===NET.acct.uid)continue;L.push({i:'h'+p.uid,h:p.uid,name:p.u,vip:p.vip||0,lv:p.lv,cp:p.cp,top:p.top,online:p.on,last:p.last})}
 L.push({me:true,name:S.name,vip:vipOf(S.iap&&S.iap.spent||0),lv:S.lv,cp:teamPow(),top:S.team.find(Boolean),online:true,last:now});return L}

/* ---- hitung state semua bot sedikit demi sedikit (±10 ms per potong) supaya layar tidak membeku saat bot ribuan ---- */
function botsWarm(cb){if(cb)(BOTS.warmCb=BOTS.warmCb||[]).push(cb);if(BOTS.warming)return;BOTS.warming=true;let i=0;const now=Date.now();
 const ids=botsIds(now);const step=()=>{const n=ids.length,t0=performance.now();try{while(i<n&&performance.now()-t0<10){botSum(ids[i],now,true);botPres(ids[i],now);i++}}catch(e){i=n}
  if(i<n){setTimeout(step,0);return}bsumSave();BOTS.warming=false;BOTS.warmAt=Date.now();const L=BOTS.warmCb||[];BOTS.warmCb=[];L.forEach(f=>{try{f()}catch(e){}})};
 setTimeout(step,0)}
const botsWarmOk=()=>!!BOTS.warmAt&&!BOTS.warming;
// penyegaran realtime: bot yang ringkasannya basi dihitung ulang di latar (potongan ±8 ms), lalu daftar/peringkat yang terbuka ikut diperbarui
function botsFresh(){if(!BSQ.size||BOTS.warming||BOTS.fresh)return;BOTS.fresh=true;const Q=[...BSQ];BSQ.clear();let k=0,ch=0;
 const step=()=>{const now=Date.now(),t0=performance.now();try{while(k<Q.length&&performance.now()-t0<8){const i=Q[k++],a=BSUMA[i],o0=a&&a.o,o=botSum(i,now,true);if(!o0||o0.cp!==o.cp||o0.lv!==o.lv)ch++}}catch(e){k=Q.length}
  if(k<Q.length){setTimeout(step,0);return}BOTS.fresh=false;if(ch){BLM.t=0;if(typeof BOTS.onChange==='function')try{BOTS.onChange()}catch(e){}}};
 setTimeout(step,0)}
setInterval(botsFresh,8e3);

/* ================= DUNIA BOT: epoch & generasi (bisa di-reset) =================
   'bots/world' = {epoch, gen}. Reset -> epoch = sekarang, gen+1 (semua bot jadi karakter baru, mulai hari ke-1).
   Disimpan bersama di db supaya semua pemain melihat dunia yang sama; cadangan di localStorage. */
const BW_KEY='aster_botworld';
function botsClearCaches(){BOTS.base={};BOTS.cache={};BOTS.cacheN=0;BSUM.key='';for(const k in BSUMA)delete BSUMA[k];BSQ.clear();BSES.clear();BSES0.clear();BPLAY.clear();for(const k in BSPEND)delete BSPEND[k];BSPEND_N=0;BLM.L=null;BIDS.t=-1;BOTS.seen=0;BOTS.seenSet=null;BOTS.warmAt=0;if(typeof AR!=='undefined')AR.board=null;if(typeof WB!=='undefined'&&WB.cache)WB.cache.clear()}
// dunia-dunia server ini [{g,e,cap,newer}] (systems/net.js). Berubah (reset/gabung/server baru) -> semua cache bot dibuang.
const wSigOf=w=>w.g+'@'+w.e+'#'+(w.newer||[]).length+(w.v?'v'+w.v+'h'+w.h+'o'+w.o:'')+(w.wh&&w.wh.length?'w'+w.wh.map(x=>x[0]+':'+x[1]).join(';'):'');
function botsSetWorlds(W){const sig=W.map(wSigOf).join(','),old=(BOTS.W||[]).map(wSigOf).join(',');
 if(sig===old){W.forEach((w,k)=>{BOTS.W[k].nn=w.nn});return false}
 BOTS.W=W.map(w=>{const x={g:w.g,e:w.e,cap:w.cap,newer:(w.newer||[]).slice().sort((a,b)=>a-b),nn:w.nn};if(w.v){x.v=w.v;x.h=w.h;x.o=w.o}if(Array.isArray(w.wh)&&w.wh.length)x.wh=w.wh.map(a=>[+a[0],+a[1]]).sort((a,b)=>a[0]-b[0]);return x});BOTS.gen=W[0].g;BOT_CFG.epoch=W[0].e;botsClearCaches();
 try{localStorage.removeItem('aster_ranksnap')}catch(e){}
 if(typeof S!=='undefined'&&S&&S.rankDay&&(S.rankDay.gen||0)!==BOTS.gen){S.rankDay={gen:BOTS.gen}}
 if(typeof rankReset==='function')rankReset();BOTS.onChange&&BOTS.onChange();return true}
// cadangan tanpa server: satu dunia lokal
function botsApplyWorld(w){if(!w||!w.epoch)return;if(BOTS.W&&BOTS.W.length&&BOTS.W[0].e===w.epoch&&BOTS.W[0].g===(w.gen||0))return;
 botsSetWorlds([{g:w.gen||0,e:w.epoch,cap:BOT_CFG.SRV.cap,newer:[]}]);try{localStorage.setItem(BW_KEY,JSON.stringify({epoch:w.epoch,gen:w.gen||0}))}catch(e){}botsEnsure()}
// reset dunia bot HANYA lewat Telegram (/resetbot). Game menerima {epoch, gen} baru dari server (systems/net.js).

/* ================= NAMA ================= */
// cadangan lokal (server tidak menjawab): suku kata acak per bot — hanya huruf & angka
function botLocalName(i){const r=bRng(bHash(i,9)),Y=BOT_CFG.SYL;let n='';const k=2+Math.floor(r()*2);for(let j=0;j<k;j++)n+=Y[Math.floor(r()*Y.length)];n=n[0].toUpperCase()+n.slice(1);if(r()<.45)n+=Math.floor(r()*(r()<.5?100:2000));return n.slice(0,14)}
const HERO_NAMES=()=>new Set(HEROES.map(h=>h.name.toLowerCase()));
async function botsInit(){if(BOTS.init)return;BOTS.init=true;
 try{botsApplyWorld(JSON.parse(localStorage.getItem(BW_KEY)||'null'))}catch(e){}
 if(typeof netStart==='function')netStart();
 // server belum menjawab dalam 8 dtk -> pakai generator nama lokal
 setTimeout(()=>{if(!BOTS.ready){BOTS.ready=true;botsEnsure()}},8000)}
// pastikan nama cukup untuk bot yang sudah bergabung (+ cadangan). Normalnya nama datang dari server (akun bot), jadi ini hanya cadangan.
async function botsEnsure(){if(!BOTS.ready||BOTS.busy)return;if(!BOTS.W||!BOTS.W.length)botsApplyWorld({epoch:BOT_CFG.epoch,gen:BOTS.gen||0});const need=Math.min(BOT_CFG.SRV.cap,botsJoined()+10);if(BOTS.names.length>=need)return;
 if(typeof NET!=='undefined'&&NET.worldOk){if(Date.now()-NET.worldAt>3e4)netWorld();return}  // akun bot dibuat server
 BOTS.busy=true;
 try{const have=new Set(BOTS.names.map(s=>s.toLowerCase()));if(S&&S.name)have.add(String(S.name).toLowerCase());const add=[];
  let i=BOTS.names.length;const HN=HERO_NAMES();while(BOTS.names.length+add.length<need){const c=botLocalName(i++);if(!have.has(c.toLowerCase())&&!HN.has(c.toLowerCase())){have.add(c.toLowerCase());add.push(c)}}
  if(add.length){BOTS.names=BOTS.names.concat(add).slice(0,BOT_CFG.SRV.cap);if(BOTS.W&&BOTS.W[0])BOTS.W[0].nn=BOTS.names.length;BOTS.onChange&&BOTS.onChange()}
 }finally{BOTS.busy=false}}

/* ================= BIO / STATUS ================= */
// status yang cocok dengan keadaan bot (bot yang belum punya Raika tidak akan pamer Raika)
function botBio(i,s,rank,now=Date.now()){const C=BOT_CFG,b=botBase(i),per=Math.max(0,Math.floor((now-b.join)/(b.bioEvery*BDAY)));
 // bio berganti tiap bioEvery hari; kadang dikosongkan dulu
 if(bHash(i,77+per*31)%100>=C.BIO_SHARE*100)return'';const tags=new Set(['umum']);
 if(b.pf==='santai')tags.add('santai');if(b.pf==='rajin'||b.pf==='hardcore')tags.add('farming');if(s.lv<15)tags.add('pemula');if((rank&&rank<=20)||b.pf==='hardcore')tags.add('kompetitif');
 if(s.stats.luck==='hoki')tags.add('hoki');if(s.stats.luck==='sial')tags.add('sial');if(s.heroes.raika)tags.add('raika');if(s.heroes.sakuya)tags.add('sakuya');
 if(b.ws&&bHash(i,79+per*31)%100<60){const W=C.BIO_LOCAL.filter(([t])=>t===b.ws.id);if(W.length)return W[bHash(i,78+per*31)%W.length][1]}
 const pool=C.BIO_LOCAL.filter(([t])=>tags.has(t)).map(([tag,t])=>({tag,t}));if(!pool.length)return'';
 return pool[bHash(i,78+per*31)%pool.length].t}
