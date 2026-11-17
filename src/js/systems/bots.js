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
   - Nama: dibuat Claude (capability `sample`), disimpan bersama di db `bots/names`;
     cadangan: generator suku kata lokal. Hanya huruf & angka.
   ===================================================================== */
const BOTS={gen:0,names:[],ready:false,db:null,dbWrite:true,busy:false,failAt:0,base:{},cache:{},seen:0,init:false,onChange:null};
const BDAY=864e5;
function bRng(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
function bHash(i,s){i+=BOTS.gen*1000003;let h=(Math.imul(i+1,2654435761)^Math.imul(s+7,0x9E3779B1))>>>0;h=Math.imul(h^h>>>16,0x45d9f3b)>>>0;h=Math.imul(h^h>>>16,0x45d9f3b)>>>0;return(h^h>>>16)>>>0}
function bInterp(T,x){if(x<=T[0][0])return T[0][1];for(let k=1;k<T.length;k++)if(x<=T[k][0]){const a=T[k-1],b=T[k];return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0])}return T[T.length-1][1]}

/* ---- kapan bot bergabung ---- */
function botJoin(i){const C=BOT_CFG;if(i<C.launch)return C.epoch+i*55e3;const f=(i+1-C.launch)/(C.max-C.launch+1);return C.epoch+(-C.tau*Math.log(1-f))*BDAY}
function botsJoined(now=Date.now()){let lo=0,hi=BOT_CFG.max;while(lo<hi){const m=(lo+hi)>>1;if(botJoin(m)<=now)lo=m+1;else hi=m}return lo}
/* jumlah bot yang tampil = yang sudah bergabung DAN sudah punya nama */
const botsVisible=(now=Date.now())=>Math.min(botsJoined(now),BOTS.names.length);

/* ---- sifat tetap tiap bot ---- */
function botBase(i){if(BOTS.base[i])return BOTS.base[i];const C=BOT_CFG,r=bRng(bHash(i,1));
 let x=r()*C.profiles.reduce((a,p)=>a+p.w,0),pf=C.profiles[0];for(const p of C.profiles){if(x<p.w){pf=p;break}x-=p.w}
 let a=pf.a[0]+r()*(pf.a[1]-pf.a[0]);const join=botJoin(i);let quit=Infinity;for(const[d,p]of C.churn)if(r()<p){quit=d*(.4+r()*.9);break}
 const chaser=r()<C.CHASER,chrono=Math.round((r()-.5)*4),opt=Math.min(.99,Math.max(.3,pf.opt+(r()-.5)*.2));
 // sifat tambahan memakai aliran acak terpisah (jumlah tarikan tetap) supaya sifat lama tidak bergeser
 const q=bRng(bHash(i,31)),Q=Array.from({length:12},()=>q()),SP=C.SPEND,EM=C.EMO,LF=C.LIFE;
 let tx=Q[0]*100,tier=SP.tiers[0];for(const t of SP.tiers){if(tx<t.w){tier=t;break}tx-=t.w}
 const mood=botEarlyMood(bHash(i,2),chaser);if(mood!=='normal')a*=EM[mood].speed;
 // pemain berbayar & yang hoki lebih betah; yang apes lebih cepat menyerah
 const cm=(tier.id==='f2p'?1:SP.churnMul)*(mood==='normal'?1:EM[mood].churn);
 if(quit<Infinity&&cm<1&&Q[1]<1-cm)quit=Infinity;
 else if(cm>1){if(quit<Infinity)quit/=Math.sqrt(cm);else if(Q[2]<(cm-1)*.22)quit=.8+Q[3]*4}
 // masa aktif: [mulai, selesai, kecepatan]. Melambat sebelum berhenti; bisa kembali saat era banner baru
 const segs=[];if(quit===Infinity)segs.push([join,Infinity,a]);
 else{const qT=join+quit*BDAY,fadeAt=join+quit*(1-C.FADE)*BDAY;segs.push([join,fadeAt,a],[fadeAt,qT,a*C.FADE_RATE]);
  const era=C.ERAS.find(e=>e.at>qT);if(era&&r()<C.COMEBACK.p){const s0=era.at+r()*BDAY,len=(C.COMEBACK.days[0]+r()*(C.COMEBACK.days[1]-C.COMEBACK.days[0]))*BDAY;segs.push([s0,s0+len,a*C.COMEBACK.rate])}}
 const B=BOTS.base[i]={i,pf:pf.id,pfo:pf,a,quit,join,chaser,chrono,opt,segs,seed:bHash(i,2),endT:segs[segs.length-1][1],back:segs.length>2,
  tier,mood,saver:chaser&&Q[4]<EM.saver,spend0:join+(SP.firstDay[0]+Q[5]*(SP.firstDay[1]-SP.firstDay[0]))*BDAY,cardP:Q[6]<(tier.card||0),
  bioEvery:LF.bioEvery[0]+Q[7]*(LF.bioEvery[1]-LF.bioEvery[0]),loyal:Q[8]<LF.loyal,rn:null};
 if(Q[9]<LF.rename.p){const t=join+(LF.rename.days[0]+Q[10]*(LF.rename.days[1]-LF.rename.days[0]))*BDAY;if(t<B.endT)B.rn={t:botSnap(B,t),k:Math.floor(Q[11]*LF.rename.pool)}}
 return B}
/* suasana hati awal: ulang 60 tarikan hero pertama (aliran acak yang sama dengan gacha bot) -> hoki / normal / sial */
function botEarlyMood(seed,chaser){const N=BOT_CFG.EMO.early,rng=bRng(seed);let pity=0,g=false,n3=0;
 for(let k=0;k<N;k++){pity++;const x=rng()*100,p3=rate3At(pity),r=x<p3?3:x<p3+RATES[2]?2:1;
  if(r===3){n3++;pity=0;if(chaser){const on=g||rng()<RATE_UP.hero;g=!on;if(!on)rng()}else rng()}else rng()}
 const e=N*RATES[3]/100*1.05,z=(n3-e)/Math.sqrt(e);return z>1?'hoki':z<-1?'sial':'normal'}
/* nama saat waktu t (bisa sudah ganti nama) */
BOTS.renames=[];
function botName(i,t=Date.now()){const b=botBase(i),n=BOTS.names[i];if(!b.rn||t<b.rn.t||b.rn.k>=BOTS.renames.length)return n;
 let m=BOTS.renames[b.rn.k];if(!BOTS.nameSet||BOTS.nameSet.n!==BOTS.names.length){BOTS.nameSet=new Set(BOTS.names.map(s=>s.toLowerCase()));BOTS.nameSet.n=BOTS.names.length}
 if(BOTS.nameSet.has(m.toLowerCase())||(typeof S!=='undefined'&&S&&S.name&&S.name.toLowerCase()===m.toLowerCase()))m=(m+(10+i%89)).slice(0,14);return m}
const botOldName=(i,t=Date.now())=>{const n=botName(i,t);return n!==BOTS.names[i]?BOTS.names[i]:null};

/* ================= TOP UP BOT =================
   Pembelian ditentukan per hari (seed per bot+hari) -> semua penonton melihat pembelian yang sama.
   Pemicu: Kartu Bulanan (+perpanjangan), pembelian acak saat bermain (lebih sering di tanggal gajian),
   dan borong saat banner baru dimulai. Permata berbayar -> tarikan tambahan di botGacha. */
const BSPEND={};
const vipOf=total=>{const V=BOT_CFG.SPEND.VIP;let v=0;while(v<V.length&&total>=V[v])v++;return v};
const tuPack=id=>id==='mc'?TOPUP_CFG.card:TOPUP_CFG.packs.find(p=>p.id===id);
function bWeighted(L,x){const tot=L.reduce((a,v)=>a+v[1],0);let y=x*tot;for(const v of L){if(y<v[1])return v[0];y-=v[1]}return L[L.length-1][0]}
function botSpend(b,now=Date.now()){const T=b.tier;if(T.id==='f2p')return{buys:[],gems:[],total:0,vip:0,card:0};
 const dNow=wibDay(now),key=dNow+':'+BOT_CFG.ERAS.length+':'+BOTS.gen;let c=BSPEND[b.i];
 if(!c||c.key!==key){const SP=BOT_CFG.SPEND,buys=[],gems=[],d0=wibDay(b.spend0),d1=Math.min(dNow,wibDay(Math.min(b.endT,now+BDAY)));let cardUntil=0,cardN=0,cardStop=!b.cardP;
  const buy=(t,id)=>buys.push({t,id,price:tuPack(id).price});
  for(let d=d0;d<=d1;d++){const ss=botSessions(b,d).filter(s=>s[0]>=b.spend0);if(!ss.length)continue;const r=bRng(bHash(b.i,7000+d)),first=ss[0][0];
   if(!cardStop&&first>=cardUntil){if(cardN===0||r()<T.renew){buy(first+6e4*(1+r()*4),'mc');cardUntil=first+TOPUP_CFG.card.days*BDAY;cardN++}else cardStop=true}
   if(first<cardUntil)gems.push([first+3e4,TOPUP_CFG.card.daily]);
   const date=new Date(d*BDAY).getUTCDate(),lam=T.rate*(SP.payday.dates.includes(date)?SP.payday.mul:1);
   let n=r()<lam?1+(r()<lam*.35?1:0):0;while(n--){const s=ss[Math.floor(r()*ss.length)];buy(s[0]+r()*(s[1]-s[0]),bWeighted(T.packs,r()))}}
  // borong saat banner baru (sesi pertama setelah banner dimulai, maks 2 hari)
  let lastSplurge=-Infinity;   // borong paling sering sekali per 3 hari (banner yang rilis berdekatan tidak diborong semua)
  BOT_CFG.ERAS.forEach((E,k)=>{if(!k)return;const t=botSnap(b,E.at);if(t<b.spend0||t-E.at>2*BDAY||!botActive(b,t)||t-lastSplurge<3*BDAY)return;lastSplurge=t;const r=bRng(bHash(b.i,7500+k));
   let n=T.banner[0]+Math.floor(r()*(T.banner[1]-T.banner[0]+1));for(let j=0;j<n;j++)buy(t+(j+1)*45e3+r()*3e4,bWeighted(T.bp,r()))});
  buys.sort((x,y)=>x.t-y.t);const seen={};
  for(const o of buys){const p=tuPack(o.id);if(o.id==='mc')o.gems=p.now;else{o.gems=p.gems+(seen[o.id]?p.bonus:p.gems);seen[o.id]=1}gems.push([o.t,o.gems])}
  gems.sort((x,y)=>x[0]-y[0]);c=BSPEND[b.i]={key,buys,gems}}
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
function botProg(b,t){let P=0;for(const[s0,s1,r]of b.segs){if(t<=s0)break;P+=r*(Math.min(t,s1)-s0)/BDAY}return P}
function botProgInv(b,P){let acc=0;for(const[s0,s1,r]of b.segs){const len=(s1-s0)/BDAY*r;if(acc+len>=P)return s0+(P-acc)/r*BDAY;acc+=len}return Infinity}
const botActive=(b,t)=>b.segs.some(([s0,s1])=>t>=s0&&t<s1);

/* ---- kurva per gaya main (hasil simulasi) ---- */
const BCOL={};
function bCol(pf,c){const k=pf+c;if(BCOL[k])return BCOL[k];return BCOL[k]=BOT_CFG.CURVES[pf].map(r=>[r[0],r[c]])}
function bTail(pf,c){const T=BOT_CFG.CURVES[pf],n=T.length-1,a=T[n-BOT_CFG.XP_TAIL_DAYS],b=T[n];return(b[c]-a[c])/(b[0]-a[0])}
function botCurve(pf,c,P){const T=BOT_CFG.CURVES[pf],L=T[T.length-1];if(P<=L[0])return bInterp(bCol(pf,c),P);return c===2||c===5?L[c]+bTail(pf,c)*(P-L[0]):L[c]}
const BXP={};
function botLv(pf,P){const T=BOT_CFG.CURVES[pf],L=T[T.length-1];if(P<=L[0])return Math.max(1,Math.floor(bInterp(bCol(pf,1),P)));
 if(BXP[pf]==null){const a=T[T.length-1-BOT_CFG.XP_TAIL_DAYS];let xp=0;for(let l=a[1];l<L[1];l++)xp+=expNeed(l);BXP[pf]=xp/(L[0]-a[0])}
 let lv=L[1],xp=(P-L[0])*BXP[pf];while(lv<999&&xp>=expNeed(lv)){xp-=expNeed(lv);lv++}return lv}
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
function botGacha(b,P,now=Date.now()){const C=BOT_CFG,total=Math.max(0,botCurve(b.pf,2,P)),nH=Math.floor(total*C.HERO_SHARE),nW=Math.floor(total*(1-C.HERO_SHARE));
 const heroes={},weapons={},ev=[];STARTERS().forEach(id=>heroes[id]={lv:1,lb:0,wpn:null});STARTERS().map(id=>basicWeapon(HD[id].wcls)).filter(Boolean).forEach(w=>weapons[w]=newWpn());
 // waktu tiap tarikan: gratis (dari kurva progres) + berbayar (dari top up), lalu diurutkan
 const fT=(k,share)=>Math.max(b.join,botProgInv(b,botSumInv(b.pf,k/share))),tH=[],tW=[];
 for(let k=0;k<nH;k++)tH.push(fT(k,C.HERO_SHARE));for(let k=0;k<nW;k++)tW.push(fT(k,1-C.HERO_SHARE));
 const SP=botSpend(b,now),paid=botPaidPulls(SP.gems);paid.forEach((t,k)=>(bHash(b.i,9000+k)%100<C.SPEND.heroShare*100?tH:tW).push(t));
 const sv=botSaveTimes(b,tH.sort((x,y)=>x-y),now);tW.sort((x,y)=>x-y);
 const run=(ts,isW,rng)=>{const st={pity:0,g:false};for(const t of ts){const ek=eraIdx(t),E=C.ERAS[ek];
  const ups=isW?E.wpn:E.hero,up=b.chaser&&ups.length?ups[bHash(b.i,ek+(isW?50:0))%ups.length]:null,pool=eraPool(t,isW,up);
  const pb=st.pity+1,o=gachaRoll(st,up,r=>pool[r],rng,false,isW),r=o.r,id=o.id;if(!id)continue;
  if(r===3)ev.push({t,id,w:isW,lim:isW?!!(WD[id].owner&&E.limited.includes(WD[id].owner)):E.limited.includes(id),up:!!up,on:!!o.on,n:pb,dupe:!!(isW?weapons:heroes)[id]});
  const own=isW?weapons:heroes;if(own[id]){if(isW)own[id].ref=Math.min(DUPE_MAX,own[id].ref+1);else own[id].lb=Math.min(DUPE_MAX,own[id].lb+1)}else own[id]=isW?newWpn():{lv:1,lb:0,wpn:null}}
  return st.pity};
 const pH=run(sv.ts,false,bRng(b.seed)),pW=run(tW,true,bRng(b.seed^0x5bd1e995));ev.sort((x,y)=>x.t-y.t);
 return{heroes,weapons,ev,nH:sv.ts.length,nW:tW.length,paid:paid.length,held:sv.held,spend:SP,pity:pH,wpity:pW}}

/* ---- tim terbaik: coba kombinasi dari 7 hero terkuat (pakai teamCP asli) ---- */
function botBestTeam(ids){const top=ids.map(id=>[id,heroPow(id)]).sort((a,b)=>b[1]-a[1]).slice(0,7).map(x=>x[0]);const k=Math.min(4,top.length);let best=top.slice(0,k),bv=-1;
 const rec=(st,cur)=>{if(cur.length===k){const v=teamCP(cur).total;if(v>bv){bv=v;best=cur.slice()}return}for(let j=st;j<top.length;j++){cur.push(top[j]);rec(j+1,cur);cur.pop()}};rec(0,[]);return best}

/* ---- Kebangkitan bot: anggaran bahan sejak (perkiraan) menembus 5-5, dibelanjakan berurutan ★4 → ★5 → ★6 ---- */
function botAscend(b,P,opt,core,heroes,weapons,gear,lvF){const A=BOT_CFG.ASC;if(!A)return;
 const pre=teamCP(core.slice(0,4)).total;if(pre<A.minCP)return;
 // perkiraan hari sejak CP melewati minCP (CP kira-kira tumbuh sebanding hari main)
 let B=P*(1-A.minCP/pre)*A.perDay*(A.tier[b.tier.id]||1)*(.55+.45*opt);if(B<=0)return;
 const steps=[];for(const s of[4,5,6]){for(const id of core.slice(0,4))steps.push(['h',id,s]);for(const id of core.slice(0,4))if(heroes[id].wpn)steps.push(['w',heroes[id].wpn,s]);
  for(const id of core.slice(0,4))for(const sl of['ar','ac'])if(heroes[id][sl])steps.push(['g',heroes[id][sl],s])}
 for(const[k,key,s]of steps){const c=A.cost[k][s];if(B<c)break;B-=c;
  if(k==='h'){heroes[key].asc=Math.max(HD[key].r,s);heroes[key].lv=Math.max(1,Math.round(maxLv(key)*(lvF[key]||.8)))}
  else if(k==='w'){const o=weapons[key],cap0=wMaxLv(key),fr=Math.min(1,o.lv/cap0);o.asc=Math.max(WD[key].r,s);o.lv=Math.max(1,Math.round(wMaxLv(key)*fr))}
  else{const o=gear[key];if(!o)continue;const cap0=gearMax(key),fr=cap0?Math.min(1,o.lv/cap0):0;o.asc=Math.max(GDD[key].r,s);o.lv=Math.round(gearMax(key)*fr)}}}

/* ---- keadaan bot pada waktu now ---- */
function botState(i,now=Date.now()){const b=botBase(i),C=BOT_CFG,P=botProg(b,now),lv=botLv(b.pf,P);
 const sp0=botSpend(b,now),key=Math.floor(P*48)+':'+lv+':'+C.ERAS.length+':'+sp0.gems.length+':'+(b.saver?Math.floor(now/36e5):0);const c=BOTS.cache[i];if(c&&c.key===key)return c;
 const G=botGacha(b,P,now),heroes=G.heroes,weapons=G.weapons;
 const F={lv,exp:0,heroes,weapons,gear:{},team:[],mats:{}};const keep=S;S=F;let out;
 try{const r=bRng(b.seed^0x1234567),opt=b.opt;
  // hero favorit: ★3 pertama yang didapat, kalau belum ada pilih hero acak miliknya
  // hero favorit: ★3 pertama yang didapat; yang tidak setia pindah ke ★3 terbatas terbaru. Belum punya ★3 -> hero acak miliknya
  const firstH=G.ev.find(e=>!e.w),lastLim=G.ev.filter(e=>!e.w&&e.lim).pop(),own=Object.keys(heroes);
  const fav=!b.loyal&&lastLim?lastLim.id:firstH?firstH.id:own[bHash(i,9)%own.length];
  const ids=own.sort((x,y)=>maxLvRaw(y)-maxLvRaw(x)||HD[y].r-HD[x].r||heroes[y].lb-heroes[x].lb||(x<y?-1:1));const core=ids.slice(0,4);if(!core.includes(fav))core.push(fav);
  const lvF={};ids.forEach(id=>{const f=core.includes(id)?opt+r()*(1-opt):C.BENCH_LV[0]+r()*(C.BENCH_LV[1]-C.BENCH_LV[0])*(.6+.4*opt);lvF[id]=f;heroes[id].lv=Math.max(1,Math.round(maxLv(id)*f))});
  const wl=Math.round(botCurve(b.pf,3,P)*(.8+.2*opt)),wlb=Math.floor(botCurve(b.pf,4,P)*(opt>.8?1:.75)+.001),used=new Set();
  for(const id of ids){const cls=HD[id].wcls;const cand=Object.keys(weapons).filter(w=>WD[w].cls===cls&&!used.has(w)).sort((x,y)=>(WD[y].owner===id)-(WD[x].owner===id)||WD[y].r-WD[x].r||weapons[y].ref-weapons[x].ref);
   // pemain kurang optimal kadang lupa memasang senjata terbaik
   const w=cand.length>1&&r()>opt+.15?cand[1]:cand[0];if(!w)continue;used.add(w);heroes[id].wpn=w;const o=weapons[w],isC=core.includes(id);o.lb=Math.min(WPN_LB_MAX,isC?wlb:Math.floor(wlb/2));o.lv=Math.max(1,Math.min(wMaxLv(w),isC?wl:Math.round(wl*.6)))}
  if(P>=C.GEAR_FROM_DAY)for(const slot of['armor','acc'])for(const id of core){if(r()>opt+.2)continue;const rr=P<4?1:P<7?(r()<.6?2:1):(r()<.35?3:2);const pool=GEAR.filter(g=>g.slot===slot&&g.r===rr&&!F.gear[g.id]);if(!pool.length)continue;
   const g=pool[Math.floor(r()*pool.length)];F.gear[g.id]={lv:Math.min(GEAR_MAX_LV[g.r],Math.floor((P-C.GEAR_FROM_DAY)*1.5*(.4+.6*opt)*(.6+r()*.4))),ref:0};heroes[id][gKey(slot)]=g.id}
  botAscend(b,P,opt,core,heroes,weapons,F.gear,lvF);
  let team=botBestTeam(ids);
  // tidak semua pemain memakai tim optimal: sebagian tetap membawa hero favoritnya
  if(fav&&!team.includes(fav)&&r()>opt){const weak=team.slice().sort((x,y)=>heroPow(x)-heroPow(y))[0];team=team.map(id=>id===weak?fav:id)}
  F.team=team;const pw={};ids.forEach(id=>pw[id]=heroPow(id));
  // hoki/apes: dibanding rata-rata ★3 yang diharapkan (peluang efektif termasuk pity ≈ ×1.05), ±1 simpangan baku
  const n3=G.ev.length,exp3=(G.nH+G.nW)*RATES[3]/100*1.05,z=(n3-exp3)/Math.sqrt(Math.max(1,exp3)),luck=z>1?'hoki':z<-1?'sial':'normal';
  let days=0;for(const[s0,s1]of b.segs){if(now<=s0)break;days+=(Math.min(now,s1)-s0)/BDAY}
  out={i,key,lv,P,heroes,weapons,gear:F.gear,team,fav,pw,cp:teamCP(team).total,ev:G.ev,
   stats:{sum:G.nH+G.nW,s3:n3,lim3:G.ev.filter(e=>e.lim).length,luck,days:Math.max(1,Math.ceil(days)),hours:Math.max(.1,botCurve(b.pf,5,P)),
    paid:G.paid,held:G.held,pity:G.pity,spent:G.spend.total,vip:G.spend.vip,card:G.spend.card,buys:G.spend.buys.length}};
 }finally{S=keep}
 let st=null;for(const s of SLIST){if(s.rec<=out.cp*1.08)st=s;else break}out.stage=st?st.key:'1-1';
 return BOTS.cache[i]=out}

/* ---- online / terakhir aktif: sesi harian mengikuti jam ramai WIB ---- */
const BSES=new Map();
function botSessions(b,day){const k=b.i*100000+day;if(BSES.has(k))return BSES.get(k);const C=BOT_CFG,pf=b.pfo,r=bRng(bHash(b.i,1000+day)),dow=new Date(day*BDAY).getUTCDay(),wk=dow===0||dow===6;
 let n=pf.sess[0]+Math.floor(r()*(pf.sess[1]-pf.sess[0]+1))+(wk?C.WEEKEND_EXTRA:0);const W=C.HOURS,tot=W.reduce((a,v)=>a+v,0),out=[];
 for(let s=0;s<n;s++){let x=r()*tot,h=0;for(;h<23;h++){if(x<W[h])break;x-=W[h]}h=(h+b.chrono+24)%24;
  const st=day*BDAY-C.TZ*36e5+(h*60+Math.floor(r()*60))*6e4,len=(pf.len[0]+r()*(pf.len[1]-pf.len[0]))*6e4;if(botActive(b,st))out.push([st,st+len])}
 out.sort((a,c)=>a[0]-c[0]);if(BSES.size>60000)BSES.clear();BSES.set(k,out);return out}
const wibDay=(t=Date.now())=>Math.floor((t+BOT_CFG.TZ*36e5)/BDAY);
function botPresence(i,now=Date.now()){const b=botBase(i);if(now<b.join)return{online:false,last:b.join};if(now-b.join<15*6e4)return{online:true,last:now};
 const from=Math.min(now,b.endT),d0=wibDay(from);
 for(let d=d0;d>=d0-14;d--){const ss=botSessions(b,d);for(let k=ss.length-1;k>=0;k--){const[s0,s1]=ss[k];if(s0<=now){if(now<s1)return{online:true,last:now};return{online:false,last:Math.min(s1,now)}}}if(d*BDAY<b.join-BDAY)break}
 return{online:false,last:Math.min(b.endT,b.join+15*6e4)}}
// waktu sesi saat sebuah tarikan gacha terjadi (tarikan terjadi saat pemain sedang main)
function botSnap(b,t){for(let d=wibDay(t);d<=wibDay(t)+3;d++){for(const[s0,s1]of botSessions(b,d))if(s1>=t)return Math.max(s0,Math.min(t,s1))}return t}

/* ---- daftar semua bot yang tampil (+ pemain sendiri) ---- */
function botsList(now=Date.now()){const n=botsVisible(now),L=[];for(let i=0;i<n;i++){const s=botState(i,now),p=botPresence(i,now);L.push({i,name:botName(i,now),vip:s.stats.vip,lv:s.lv,cp:s.cp,top:s.fav||s.team[0],online:p.online,last:p.last,isNew:now-botBase(i).join<BDAY,back:botBase(i).back&&now>=botBase(i).segs[2][0]})}
 L.push({me:true,name:S.name,vip:vipOf(S.iap&&S.iap.spent||0),lv:S.lv,cp:teamPow(),top:S.team.find(Boolean),online:true,last:now});return L}

/* ---- hitung state semua bot sedikit demi sedikit (±10 ms per potong) supaya layar tidak membeku saat bot ribuan ---- */
function botsWarm(cb){if(cb)(BOTS.warmCb=BOTS.warmCb||[]).push(cb);if(BOTS.warming)return;BOTS.warming=true;let i=0;const now=Date.now();
 const step=()=>{const n=botsVisible(now),t0=performance.now();try{while(i<n&&performance.now()-t0<10){botState(i,now);botPresence(i,now);i++}}catch(e){i=n}
  if(i<n){setTimeout(step,0);return}BOTS.warming=false;BOTS.warmAt=Date.now();const L=BOTS.warmCb||[];BOTS.warmCb=[];L.forEach(f=>{try{f()}catch(e){}})};
 setTimeout(step,0)}
const botsWarmOk=()=>!!BOTS.warmAt&&!BOTS.warming;

/* ================= DUNIA BOT: epoch & generasi (bisa di-reset) =================
   'bots/world' = {epoch, gen}. Reset -> epoch = sekarang, gen+1 (semua bot jadi karakter baru, mulai hari ke-1).
   Disimpan bersama di db supaya semua pemain melihat dunia yang sama; cadangan di localStorage. */
const BW_KEY='aster_botworld';
function botsApplyWorld(w){if(!w||!w.epoch)return;if(w.epoch===BOT_CFG.epoch&&(w.gen||0)===BOTS.gen)return;
 BOT_CFG.epoch=w.epoch;BOTS.gen=w.gen||0;BOTS.base={};BOTS.cache={};BOTS.seen=0;BOTS.warmAt=0;
 try{localStorage.setItem(BW_KEY,JSON.stringify({epoch:w.epoch,gen:BOTS.gen}));localStorage.removeItem('aster_ranksnap')}catch(e){}
 if(typeof S!=='undefined'&&S&&S.rankDay&&(S.rankDay.gen||0)!==BOTS.gen){S.rankDay={gen:BOTS.gen}}
 if(typeof rankReset==='function')rankReset();BOTS.onChange&&BOTS.onChange();botsEnsure()}
async function botsResetWorld(){const w={epoch:Date.now(),gen:(BOTS.gen||0)+1};botsApplyWorld(w);
 if(BOTS.db&&BOTS.dbWrite){try{await BOTS.db.doc('bots/world').set(w)}catch(e){}}}

/* ================= NAMA (integrasi Claude) ================= */
function botLocalName(i){const r=bRng(bHash(i,9)),Y=BOT_CFG.SYL;let n='';const k=2+Math.floor(r()*2);for(let j=0;j<k;j++)n+=Y[Math.floor(r()*Y.length)];n=n[0].toUpperCase()+n.slice(1);if(r()<.45)n+=Math.floor(r()*(r()<.5?100:2000));return n.slice(0,14)}
const HERO_NAMES=()=>new Set(HEROES.map(h=>h.name.toLowerCase()));
function botCleanName(s){s=String(s==null?'':s).trim();return BOT_CFG.NAME_RE.test(s)&&!HERO_NAMES().has(s.toLowerCase())?s:null}  // nama hero game tidak dipakai bot  // ada simbol/spasi -> ditolak, bukan dipotong
function botsSaveLocal(){try{localStorage.setItem('aster_botnames',JSON.stringify({list:BOTS.names}))}catch(e){}}
function botsSetNames(list){const seen=new Set(),out=[];for(const s of list){const c=botCleanName(s);if(!c)continue;const k=c.toLowerCase();if(seen.has(k))continue;seen.add(k);out.push(c)}
 if(out.length>=BOTS.names.length){BOTS.names=out;botsSaveLocal();BOTS.onChange&&BOTS.onChange()}}
// nama disimpan di db per potongan 2000 nama: bots/names, bots/names_1, bots/names_2, ... (dokumen tetap kecil walau bot 10.000)
const NAME_SHARD=2000,shardDoc=k=>k?'bots/names_'+k:'bots/names';
async function botsPersist(){botsSaveLocal();if(!BOTS.db||!BOTS.dbWrite)return;BOTS.saved=BOTS.saved||[];
 for(let k=0;k*NAME_SHARD<BOTS.names.length;k++){const part=BOTS.names.slice(k*NAME_SHARD,(k+1)*NAME_SHARD);if(BOTS.saved[k]===part.length)continue;
  try{await BOTS.db.doc(shardDoc(k)).set({list:part,updated:Date.now()});BOTS.saved[k]=part.length}catch(e){if(e&&e.code==='invalid_argument')BOTS.dbWrite=false;return}}}
async function botsInit(){if(BOTS.init)return;BOTS.init=true;
 try{botsApplyWorld(JSON.parse(localStorage.getItem(BW_KEY)||'null'))}catch(e){}
 try{const ls=JSON.parse(localStorage.getItem('aster_botnames')||'null');if(ls&&Array.isArray(ls.list))botsSetNames(ls.list)}catch(e){}
 const cl=window.claude;if(!cl||typeof cl.use!=='function'){BOTS.ready=true;botsEnsure();return}
 let db=null;try{db=await cl.use('db')}catch(e){}BOTS.db=db;
 if(!db){BOTS.ready=true;botsEnsure();return}
 const to=setTimeout(()=>{if(!BOTS.ready){BOTS.ready=true;botsEnsure()}},10000);
 db.doc('bots/world').onSnapshot(s=>{const d=s.exists?s.data():null;if(d&&d.epoch&&((d.gen||0)>BOTS.gen||((d.gen||0)===BOTS.gen&&d.epoch!==BOT_CFG.epoch)))botsApplyWorld(d)},()=>{});
 BOTS.parts=[];const merge=()=>{const all=[];for(let k=0;k<BOTS.parts.length;k++){const p=BOTS.parts[k];if(!p)break;all.push(...p);if(p.length<NAME_SHARD)break}return all};
 for(let k=1;k*NAME_SHARD<BOT_CFG.max;k++)db.doc(shardDoc(k)).onSnapshot(s=>{const d=s.exists?s.data():null;if(d&&Array.isArray(d.list)&&d.list.length){BOTS.parts[k]=d.list;(BOTS.saved=BOTS.saved||[])[k]=d.list.length;const all=merge();if(all.length>BOTS.names.length)botsSetNames(all)}},()=>{});
 db.doc('bots/names').onSnapshot(s=>{const d=s.exists?s.data():null,L0=d&&Array.isArray(d.list)?d.list:[];if(L0.length){BOTS.parts[0]=L0;(BOTS.saved=BOTS.saved||[])[0]=L0.length}const L=merge();
   if(L.length)botsSetNames(L);if(!s.metadata.fromCache){clearTimeout(to);const first=!BOTS.ready;BOTS.ready=true;if(first&&!L.length&&BOTS.names.length)botsPersist();botsEnsure()}},
  ()=>{clearTimeout(to);BOTS.ready=true;botsEnsure()})}
// pastikan nama cukup untuk bot yang sudah bergabung (+ cadangan)
async function botsEnsure(){if(!BOTS.ready||BOTS.busy)return;const need=Math.min(BOT_CFG.max,botsJoined()+10);if(BOTS.names.length>=need)return;BOTS.busy=true;
 try{let got=[],allowLocal=true;const cl=window.claude;
  if(cl&&typeof cl.use==='function'){let sample=null;try{sample=await cl.use('sample')}catch(e){}
   if(sample&&!BOTS.noClaude){allowLocal=false;if(Date.now()-BOTS.failAt<60e3)return;const n=Math.min(150,Math.max(BOT_CFG.NAME_BATCH,need-BOTS.names.length+20));
    try{let arr=null;const p=BOT_CFG.NAME_PROMPT(n);
     if(typeof sample.json==='function'){try{arr=await sample.json(p,{modelTier:'quick'})}catch(e){if(e&&(e.code==='not_granted'||e.code==='rate_limited'))throw e}}
     if(arr&&!Array.isArray(arr))arr=arr.names||arr.list||Object.values(arr).find(Array.isArray)||null;
     if(!Array.isArray(arr)){const res=await sample(p,{modelTier:'quick'});const m=String(res&&res.text||'').match(/\[[\s\S]*\]/);arr=m?JSON.parse(m[0]):[]}
     got=arr}catch(e){BOTS.failAt=Date.now();if(e&&e.code==='not_granted'){BOTS.noClaude=true;allowLocal=true}}}}
  const have=new Set(BOTS.names.map(s=>s.toLowerCase()));if(S&&S.name)have.add(String(S.name).toLowerCase());const add=[];
  for(const s of got){const c=botCleanName(s);if(c&&!have.has(c.toLowerCase())){have.add(c.toLowerCase());add.push(c)}}
  // Claude tidak tersedia sama sekali (file lokal / izin ditolak): isi sisanya dengan nama lokal agar bot yang sudah bergabung tetap tampil
  let i=BOTS.names.length+add.length;const HN=HERO_NAMES();while(allowLocal&&BOTS.names.length+add.length<need){const c=botLocalName(i++);if(!have.has(c.toLowerCase())&&!HN.has(c.toLowerCase())){have.add(c.toLowerCase());add.push(c)}}
  if(add.length){BOTS.names=BOTS.names.concat(add).slice(0,BOT_CFG.max);await botsPersist();BOTS.onChange&&BOTS.onChange()}
  if(add.length&&BOTS.names.length<need)BOTS.again=(BOTS.again||0)+1;else BOTS.again=0;
 }finally{BOTS.busy=false}
 if(BOTS.again&&BOTS.again<5)setTimeout(botsEnsure,300)}

/* ================= BIO / STATUS (integrasi Claude) ================= */
BOTS.bios=[];BOTS.bioBusy=false;BOTS.bioFail=0;
function botCleanBio(o){if(!o)return null;let t=String(o.t||o.text||'').replace(/[^A-Za-z0-9\u00C0-\u024F .,!?'"~()\-:]/g,'').replace(/\s+/g,' ').trim();const tag=BOT_CFG.BIO_TAGS.includes(o.tag)?o.tag:'umum';
 if(t.length<3||t.length>44||/https?|www|@|\.(com|net|id|org)\b/i.test(t))return null;return{t,tag}}
function botsSetBios(L){const seen=new Set(),out=[];for(const o of L){const c=botCleanBio(o);if(!c||seen.has(c.t.toLowerCase()))continue;seen.add(c.t.toLowerCase());out.push(c)}if(out.length>=BOTS.bios.length)BOTS.bios=out}
async function botsBiosInit(){if(BOTS.bioInit)return;BOTS.bioInit=true;try{const ls=JSON.parse(localStorage.getItem('aster_botbios')||'null');if(ls&&Array.isArray(ls.list))botsSetBios(ls.list)}catch(e){}
 if(BOTS.db)BOTS.db.doc('bots/bios').onSnapshot(s=>{const d=s.exists?s.data():null;if(d&&Array.isArray(d.list))botsSetBios(d.list)},()=>{})}
async function botsEnsureBios(){botsBiosInit();const C=BOT_CFG;if(BOTS.bioBusy||BOTS.bios.length>=Math.min(C.BIO_MAX,Math.max(C.BIO_BATCH,botsVisible()*.5)))return;
 const cl=window.claude;if(!cl||typeof cl.use!=='function'||Date.now()-BOTS.bioFail<60e3)return;BOTS.bioBusy=true;
 try{const sample=await cl.use('sample');if(!sample)return;let arr=null;const p=C.BIO_PROMPT(C.BIO_BATCH);
  if(typeof sample.json==='function'){try{arr=await sample.json(p,{modelTier:'quick'})}catch(e){if(e&&(e.code==='not_granted'||e.code==='rate_limited'))throw e}}
  if(arr&&!Array.isArray(arr))arr=Object.values(arr).find(Array.isArray)||null;
  if(!Array.isArray(arr)){const res=await sample(p,{modelTier:'quick'});const m=String(res&&res.text||'').match(/\[[\s\S]*\]/);arr=m?JSON.parse(m[0]):[]}
  const before=BOTS.bios.length;botsSetBios(BOTS.bios.concat(arr));if(BOTS.bios.length>before){try{localStorage.setItem('aster_botbios',JSON.stringify({list:BOTS.bios}))}catch(e){}
   if(BOTS.db&&BOTS.dbWrite){try{await BOTS.db.doc('bots/bios').set({list:BOTS.bios,updated:Date.now()})}catch(e){}}}
 }catch(e){BOTS.bioFail=Date.now()}finally{BOTS.bioBusy=false}}
// status yang cocok dengan keadaan bot (bot yang belum punya Raika tidak akan pamer Raika)
function botBio(i,s,rank,now=Date.now()){const C=BOT_CFG,b=botBase(i),per=Math.max(0,Math.floor((now-b.join)/(b.bioEvery*BDAY)));
 // bio berganti tiap bioEvery hari; kadang dikosongkan dulu
 if(bHash(i,77+per*31)%100>=C.BIO_SHARE*100)return'';const tags=new Set(['umum']);
 if(b.pf==='santai')tags.add('santai');if(b.pf==='rajin'||b.pf==='hardcore')tags.add('farming');if(s.lv<15)tags.add('pemula');if((rank&&rank<=20)||b.pf==='hardcore')tags.add('kompetitif');
 if(s.stats.luck==='hoki')tags.add('hoki');if(s.stats.luck==='sial')tags.add('sial');if(s.heroes.raika)tags.add('raika');if(s.heroes.sakuya)tags.add('sakuya');
 let pool=BOTS.bios.filter(o=>tags.has(o.tag));if(!pool.length)pool=C.BIO_LOCAL.filter(([t])=>tags.has(t)).map(([tag,t])=>({tag,t}));if(!pool.length)return'';
 return pool[bHash(i,78+per*31)%pool.length].t}

/* ================= NAMA BARU (bot yang ganti nama) =================
   Kolam nama terpisah 'bots/renames' (dibuat Claude, sama aturannya dengan nama bot). Bot ke-i memakai renames[rn.k]. */
const RN_KEY='aster_botrenames';
function botsSetRenames(L){const seen=new Set(),out=[];for(const x of L){const c=botCleanName(x);if(c&&!seen.has(c.toLowerCase())){seen.add(c.toLowerCase());out.push(c)}}if(out.length>BOTS.renames.length){BOTS.renames=out;try{localStorage.setItem(RN_KEY,JSON.stringify(out))}catch(e){}}}
async function botsEnsureRenames(){if(!BOTS.rnInit){BOTS.rnInit=1;try{botsSetRenames(JSON.parse(localStorage.getItem(RN_KEY)||'[]'))}catch(e){}
  if(BOTS.db)BOTS.db.doc('bots/renames').onSnapshot(s=>{const d=s.exists?s.data():null;if(d&&Array.isArray(d.list))botsSetRenames(d.list)},()=>{})}
 const now=Date.now(),n=botsVisible(now);let need=0;for(let i=0;i<n;i++){const b=botBase(i);if(b.rn&&b.rn.t<=now+BDAY)need=Math.max(need,b.rn.k+1)}
 if(BOTS.renames.length>=need||BOTS.rnBusy||Date.now()-(BOTS.rnFail||0)<60e3)return;BOTS.rnBusy=true;
 try{let arr=[];const cl=window.claude,sample=cl&&typeof cl.use==='function'&&!BOTS.noClaude?await cl.use('sample').catch(()=>null):null;
  if(sample){const p=BOT_CFG.NAME_PROMPT(100);try{arr=typeof sample.json==='function'?await sample.json(p,{modelTier:'quick'}):null}catch(e){}
   if(arr&&!Array.isArray(arr))arr=Object.values(arr).find(Array.isArray)||[];if(!Array.isArray(arr)||!arr.length){const res=await sample(p,{modelTier:'quick'});const m=String(res&&res.text||'').match(/\[[\s\S]*\]/);arr=m?JSON.parse(m[0]):[]}}
  else{let k=BOTS.renames.length;while(arr.length<100)arr.push(botLocalName(50000+k++))}
  const have=new Set(BOTS.names.map(x=>x.toLowerCase()));botsSetRenames(BOTS.renames.concat(arr.filter(x=>!have.has(String(x).toLowerCase()))));
  if(BOTS.db&&BOTS.dbWrite)try{await BOTS.db.doc('bots/renames').set({list:BOTS.renames,updated:Date.now()})}catch(e){}
 }catch(e){BOTS.rnFail=Date.now()}finally{BOTS.rnBusy=false}}
