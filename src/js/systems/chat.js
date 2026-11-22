/* =====================================================================
   KONTEKS BOT UNTUK OBROLAN — persona menulis, keadaan, aktivitas, siapa yang online
   ---------------------------------------------------------------------
   Obrolan dunia sekarang ada di SERVER (ui/chat.js ↔ bank-worker /api/wc): pesan pemain asli + adegan bot
   yang ditulis Claude Haiku (Mode AI) atau stiker tanpa AI. File ini hanya menyediakan bahan yang deterministik
   (sama di semua perangkat) untuk itu dan untuk profil bot:
   - chPersona(i)   gaya menulis tetap per bot (data/chat/style.js) — .chat = seberapa sering ia bicara
   - chCtx(i,t)     keadaan ASLI bot (hero favorit, CP, tahap, pity, VIP, liga, ...)
   - botActivity()  apa yang sedang ia mainkan saat online (tahap, dungeon, arena, raid, gacha, ...)
   - chOnline(t)    bot yang sedang online (indeks sesi per hari WIB)
   - chWorldTxt()   ringkasan keadaan server (banner, hero baru, pemain teratas, event) untuk AI
   (22 Nov 2026: mesin obrolan lokal lama — kalimat per menit, otak balasan lokal, kolam kalimat Claude
    lewat window.claude — dihapus karena sudah tidak dipanggil sejak obrolan pindah ke server.)
   ===================================================================== */
const CHAT={pers:{},idx:{},w:null,wAt:0};
/* ---------- util ---------- */
const chR=(a,b)=>bRng(bHash(a,b));
const chPick=(r,L)=>L[Math.floor(r()*L.length)];
const wibHour=t=>new Date(t+BOT_CFG.TZ*36e5).getUTCHours(),wibDow=t=>new Date(t+BOT_CFG.TZ*36e5).getUTCDay(),wibDate=t=>new Date(t+BOT_CFG.TZ*36e5).getUTCDate();

/* ---------- persona menulis (tetap per bot) ---------- */
function chPersona(i){if(CHAT.pers[i])return CHAT.pers[i];const r=chR(i,555),CS=CHAT_STYLE,R=CS.regs,keys=Object.keys(R);
 let x=r()*keys.reduce((a,k)=>a+R[k].w,0),reg=keys[0];for(const k of keys){if(x<R[k].w){reg=k;break}x-=R[k].w}
 const g=R[reg],b=botBase(i);let cx=r()*100,chat=0;for(const[v,p]of CS.chatty){if(cx<p){chat=v;break}cx-=p}
 chat*=b.pf==='hardcore'?1.3:b.pf==='santai'?.8:1;if(/whale$/.test(b.tier.id))chat*=1.4;
 return CHAT.pers[i]={reg,g,lower:r()<g.lower,abbr:g.abbr*(.55+r()*.9),en:r()<g.en,jp:g.jp,laugh:[chPick(r,CS.laughs),chPick(r,CS.laughs)],emo:[chPick(r,CS.emos),chPick(r,CS.emos)],
  typo:g.typo[0]+r()*(g.typo[1]-g.typo[0]),call:chPick(r,CS.calls),chat,seed:bHash(i,556),cpK:r()<.55}}

/* ---------- dunia saat ini (banner, hero baru, pemain teratas...) ---------- */
function chWorld(now=Date.now()){if(CHAT.w&&now-CHAT.wAt<3e4)return CHAT.w;const E=BOT_CFG.ERAS[eraIdx(now)];
 let newId=null,newAt=0;for(const[id,t]of Object.entries(BOT_CFG.HERO_SINCE))if(t<=now&&t>newAt&&HD[id]){newAt=t;newId=id}
 // pemain teratas dari daftar peringkat (dulu: isi cache perangkat → bisa beda antar perangkat)
 let top=null,tcp=0;try{for(const e of botsList(now))if(!e.me&&e.cp>tcp){tcp=e.cp;top=e}}catch(e){}
 const lims=(E.limited.length?E.limited:E.hero).filter(id=>HD[id]),wp=(E.wpn||[]).find(Boolean);
 CHAT.wAt=now;return CHAT.w={lims:lims.length?lims:['celestine'],limId:lims[0]||'celestine',limw:wp&&WD[wp]?WD[wp].name:'senjata terbatas',newId:newId||'celestine',newRecent:newId&&now-newAt<5*BDAY,
  newHeal:newId&&HD[newId].skill==='heal',heals:HEROES.filter(h=>h.skill==='heal'&&h.r>=2).map(h=>h.name),events:(typeof EVENTS!=='undefined'?EVENTS.filter(evActive).map(e=>e.n):[]),
  top:top?top.name:'',topCP:tcp,meTop:typeof teamPow==='function'&&teamPow()>tcp,online:chOnline(now).length}}

/* ---------- siapa yang online (indeks sesi per hari WIB) ---------- */
// sesi diurutkan menurut mulai -> cari dengan biner, cukup periksa sesi yang mulai ≤ 60 menit sebelum t
function chDayIdx(d){const ids=botsIds(),n=ids.length;if(CHAT.idx[d]&&CHAT.idx[d].n===n)return CHAT.idx[d];const L=[];
 const dS=d*BDAY-BOT_CFG.TZ*36e5,dE=dS+BDAY;for(const i of ids){const b=botBase(i);if(b.join>dE||b.endT<dS)continue;for(const[s0,s1]of botSessions(b,d))L.push([s0,s1,i])}L.sort((a,b)=>a[0]-b[0]);
 const keys=Object.keys(CHAT.idx);if(keys.length>4)delete CHAT.idx[keys[0]];L.n=n;return CHAT.idx[d]=L}
function chOnline(t){const d=wibDay(t),out=[],seen=new Set();
 for(const dd of[d-1,d]){const L=chDayIdx(dd);let lo=0,hi=L.length;while(lo<hi){const m=(lo+hi)>>1;if(L[m][0]<=t)lo=m+1;else hi=m}
  for(let k=lo-1;k>=0&&L[k][0]>t-60*6e4;k--){const[s0,s1,i]=L[k];if(t<s1&&!seen.has(i)&&botIn(i,t)){seen.add(i);out.push(i)}}}
 return out.sort((a,b)=>a-b)}

/* ---------- konteks bot (keadaan ASLI) ---------- */
function chCtx(i,t=Date.now()){const s=botState(i,t),b=botBase(i),st=s.stats,p=chPersona(i),fav=s.fav||s.team[0]||Object.keys(s.heroes)[0];
 const si=SLIST.findIndex(x=>x.key===s.stage);
 return{i,t,name:botName(i,t),heroId:fav,hero:HD[fav]?HD[fav].name:'Celestine',ids:Object.keys(s.heroes),has:id=>!!s.heroes[id],cp:s.cp,lv:s.lv,stage:s.stage,stageN:si,
  pity:st.pity||0,held:st.held||0,paid:st.spent>0,card:!!st.card,vip:st.vip||0,luck:st.luck,mood:b.mood,pf:b.pf,sk:b.sk,days:st.days,
  fading:b.quit<Infinity&&t>=b.segs[1][0]&&t<b.endT,night:wibHour(t)>=23||wibHour(t)<4,newRecent:chWorld().newRecent,newId:chWorld().newId,top:chWorld().top,
  get league(){if(typeof arBotPtsNow!=='function')return'';const v=arBotPtsNow(i);return v==null?'':T(arLg(v).n)},p}}

/* ---------- aktivitas bot saat ini (bot benar-benar "memainkan" fitur yang sudah terbuka untuknya) ----------
   Deterministik per sesi & per slot 6 menit: awal sesi ambil hadiah/misi, lalu push tahap (macet bila CP < rekomendasi),
   Dungeon (setelah 1-5), Arena (Lv 10+), naik level, gacha, auto. Dipakai Mode AI (konteks obrolan) & profil bot. */
function botSessionAt(i,now=Date.now()){const b=botBase(i);for(const d of[wibDay(now),wibDay(now)-1])for(const[s0,s1]of botSessions(b,d))if(s0<=now&&now<s1)return[s0,s1];return null}
function botActivity(i,now=Date.now()){const p=botPresence(i,now);if(!p.online)return null;const s=botState(i,now),ss=botSessionAt(i,now)||[now-5*6e4,now+6e5],m=(now-ss[0])/6e4;
 const si=SLIST.findIndex(x=>x.key===s.stage),nx=SLIST[si+1],r=bRng(bHash(i,Math.floor(ss[0]/6e4)+Math.floor(m/6)*7919));
 const got=s.ev.filter(e=>!e.w&&e.t>=ss[0]&&e.t<=now).pop();
 if(typeof wbAttend==='function'){const c=wbCur(now);if(c.st==='pre'||c.st==='live'){const a=wbAttend(botBase(i),c.t0);if(a&&now>=a.arrive){const bn=wbBoss(c.t0).n;
  if(c.st==='pre')return{k:'wbpre',t:`nunggu Bos Dunia ${bn} muncul, nyiapin tim`};if(now<a.fl&&!wbState(c.t0,now).dead)return{k:'wb',t:`lagi nyerang Bos Dunia ${bn}`}}}}
 if(m<3)return{k:'login',t:'baru login, ngambil hadiah login & misi harian'};
 if(got&&now-got.t<12*6e4)return{k:'gacha',t:`barusan gacha, dapat ★3 ${HD[got.id].name}`};
 const dgOk=si>=SLIST.findIndex(x=>x.key==='1-5'),L=[];
 if(nx)L.push([3,()=>(nx.boss?s.cp<nx.rec*.95:s.cp<nx.rec*.78)?{k:'stuck',t:`nyoba tahap ${nx.key}${nx.boss?' (bos)':''} tapi kalah terus, CP kurang (rekomendasi ${fmt(nx.rec)})`}:{k:'push',t:`lagi push tahap ${nx.key}`}]);
 if(dgOk)L.push([2.5,()=>{const d=s.cp>=27000&&r()<.3?'Menara Kebangkitan':chPick(r,['Tambang Bijih','Kuil Bintang','Brankas Naga Emas']);return{k:'dg',t:`farming Dungeon ${d}, tiket sisa ${1+Math.floor(r()*4)}`}}]);
 if(s.lv>=(FEAT.arena.lv||10))L.push([2,()=>({k:'arena',t:`main Arena${r()<.5?', barusan menang':', barusan kalah'}`})]);
 L.push([1.6,()=>({k:'up',t:chPick(r,['naikin level hero','naikin level senjata','ganti formasi tim'].concat(Object.keys(s.gear||{}).length?['pasang perlengkapan dari dungeon']:[]))})]);
 L.push([1.2,()=>({k:'afk',t:chPick(r,['auto battle sambil nonton','auto sambil kerja','cuma buka buat ngumpulin stamina','nunggu stamina penuh'])})]);
 if(s.stats.held>0)L.push([.8,()=>({k:'save',t:'nabung permata buat banner berikutnya, nahan diri gak narik'})]);
 L.push([.5,()=>({k:'ev',t:'ngecek event & misi'})]);
 let x=r()*L.reduce((a,v)=>a+v[0],0);for(const[w,f]of L){if(x<w)return f();x-=w}return L[0][1]()}

/* ---------- peringkat CP-ku & ringkasan server untuk AI ---------- */
function chMyRank(){try{const L=botsList().sort((a,b)=>b.cp-a.cp);return L.findIndex(e=>e.me)+1}catch(e){return 0}}
function chWorldTxt(now){const W=chWorld(now);return`banner terbatas ${W.lims.map(id=>HD[id].name).join(' & ')}${W.limw?', senjata rate-up '+W.limw:''}; hero terbaru ${HD[W.newId].name}${W.newRecent?' (baru rilis)':''}; ${typeof fameWorldTxt==='function'&&fameWorldTxt(now)||`CP #1 ${W.top} (${W.topCP})`}; event aktif: ${W.events.join(', ')||'-'}`}
