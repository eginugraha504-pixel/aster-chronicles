/* =====================================================================
   OBROLAN DUNIA — mesin (isi kalimat: data/chat/*.js, tampilan: ui/chat.js + css/chat.css)
   ---------------------------------------------------------------------
   - Obrolan bot DETERMINISTIK per menit (seed = menit + generasi dunia bot) -> semua pemain
     melihat percakapan bot yang sama, seperti server sungguhan.
   - Hanya bot yang sedang ONLINE (jam main WIB-nya) yang bicara. Ramai/sepinya chat mengikuti
     jumlah yang online. Kebanyakan bot hanya membaca; tiap bot punya persona menulis tetap.
   - Isi obrolan berasal dari keadaan ASLI bot: hero favorit, pity, CP, tahap, liga, top up,
     tabungan, hoki/apes, baru gabung, kembali main, ganti nama, mau berhenti, dst.
   - Kejadian nyata memicu reaksi: dapat ★3 (diumumkan sistem), rate off, top up, banner baru,
     hero baru, pemain baru (disambut), balas dendam Arena terhadapmu.
   - Pesanmu & balasan bot untukmu disimpan lokal (CH_ME). Balasan: Claude bila tersedia,
     selain itu otak lokal (data/chat/brain.js). Bot yang kamu sebut saat offline membalas
     ketika ia online lagi.
   - Kolam kalimat buatan Claude ('bots/chatlines') ikut dipakai dan terus bertambah.
   ===================================================================== */
const CHAT_CFG={
 rate:1,              // pengali keramaian chat
 win:90*6e4,          // riwayat yang dibuat saat chat dibuka (ms)
 keep:450,            // pesan maksimum di memori
 meKeep:220,          // pesanmu + balasan untukmu yang disimpan
 thread:.24,          // peluang pesan pembuka jadi utas tanya-jawab
 sysLim:.45,          // peluang ★3 terbatas bot diumumkan sistem
 linesMax:1600,linesBatch:50,linesEvery:20*6e4,   // kolam kalimat Claude
};
const CHAT={all:[],ids:new Set(),mins:new Set(),evTo:0,me:[],mem:{},pers:{},idx:{},w:null,wAt:0,lines:[],unread:0,mention:0,seenT:0,inited:false};
const CH_ME='aster_chat_me',CH_MEM='aster_chat_mem',CH_LINES='aster_chatlines';
/* ---------- util ---------- */
const chR=(a,b)=>bRng(bHash(a,b));
const chPick=(r,L)=>L[Math.floor(r()*L.length)];
function chWPick(r,L){let tot=0;for(const x of L)tot+=x.w==null?1:x.w;let y=r()*tot;for(const x of L){y-=x.w==null?1:x.w;if(y<0)return x}return L[L.length-1]}
function chPois(r,l){let k=0,p=Math.exp(-l),s=p;const u=r();while(u>s&&k<12){k++;p*=l/k;s+=p}return k}
const chHashS=s=>{let h=2166136261;for(let k=0;k<s.length;k++)h=Math.imul(h^s.charCodeAt(k),16777619);return h>>>0};
const wibHour=t=>new Date(t+BOT_CFG.TZ*36e5).getUTCHours(),wibDow=t=>new Date(t+BOT_CFG.TZ*36e5).getUTCDay(),wibDate=t=>new Date(t+BOT_CFG.TZ*36e5).getUTCDate();
const EL_ADV={api:'tanah',tanah:'air',air:'api',cahaya:'gelap',gelap:'cahaya'};

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
 let top=null,tcp=0;for(const k in BOTS.cache){const c=BOTS.cache[k];if(c&&c.cp>tcp&&+k<botsVisible(now)){tcp=c.cp;top=+k}}
 const lims=(E.limited.length?E.limited:E.hero).filter(id=>HD[id]),wp=(E.wpn||[]).find(Boolean);
 CHAT.wAt=now;return CHAT.w={lims:lims.length?lims:['celestine'],limId:lims[0]||'celestine',limw:wp&&WD[wp]?WD[wp].name:'senjata terbatas',newId:newId||'celestine',newRecent:newId&&now-newAt<5*BDAY,
  newHeal:newId&&HD[newId].skill==='heal',heals:HEROES.filter(h=>h.skill==='heal'&&h.r>=2).map(h=>h.name),events:(typeof EVENTS!=='undefined'?EVENTS.filter(evActive).map(e=>e.n):[]),
  top:top!=null?botName(top,now):'',topCP:tcp,meTop:typeof teamPow==='function'&&teamPow()>tcp,online:chOnline(now).length}}

/* ---------- siapa yang online (indeks sesi per hari WIB) ---------- */
// sesi diurutkan menurut mulai -> cari dengan biner, cukup periksa sesi yang mulai ≤ 60 menit sebelum t
function chDayIdx(d){const n=botsVisible();if(CHAT.idx[d]&&CHAT.idx[d].n===n)return CHAT.idx[d];const L=[];
 const dS=d*BDAY-BOT_CFG.TZ*36e5,dE=dS+BDAY;for(let i=0;i<n;i++){const b=botBase(i);if(b.join>dE||b.endT<dS)continue;for(const[s0,s1]of botSessions(b,d))L.push([s0,s1,i])}L.sort((a,b)=>a[0]-b[0]);
 const keys=Object.keys(CHAT.idx);if(keys.length>4)delete CHAT.idx[keys[0]];L.n=n;return CHAT.idx[d]=L}
function chOnline(t){const d=wibDay(t),out=[],seen=new Set(),n=botsVisible(t);
 for(const dd of[d-1,d]){const L=chDayIdx(dd);let lo=0,hi=L.length;while(lo<hi){const m=(lo+hi)>>1;if(L[m][0]<=t)lo=m+1;else hi=m}
  for(let k=lo-1;k>=0&&L[k][0]>t-60*6e4;k--){const[s0,s1,i]=L[k];if(t<s1&&i<n&&!seen.has(i)&&botBase(i).join<=t){seen.add(i);out.push(i)}}}
 return out.sort((a,b)=>a-b)}

/* ---------- konteks bot (keadaan ASLI) ---------- */
function chCtx(i,t){const s=botState(i),b=botBase(i),st=s.stats,p=chPersona(i),fav=s.fav||s.team[0]||Object.keys(s.heroes)[0];
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
/* ---------- isi slot & variasi ---------- */
function chLaugh(p,r){let l=chPick(r,p.laugh);if(/^wk/i.test(l)){const up=l===l.toUpperCase();l=(up?'WK':'wk').repeat(1+Math.floor(r()*4))+(r()<.3?(up?'W':'w'):'')}return l}
function chFill(tpl,c,r,ex={}){const W=chWorld();if(typeof tpl==='function')tpl=tpl(c,W,CHAT.mem);if(!tpl)return null;if(typeof tpl==='object')tpl=tpl.t;
 let s=String(tpl).replace(/\[([^\[\]]*)\]/g,(m,a)=>chPick(r,a.split('|')));
 const limId=ex.limId||chPick(r,W.lims),els=Object.keys(EL_ADV),el=ex.el||chPick(r,els),P=CHAT.mem,p=c.p||{},h=wibHour(c.t||Date.now());
 const V={hero:c.hero,rh:()=>HD[chPick(r,c.ids&&c.ids.length?c.ids:['celestine'])].name,got:ex.got,lim:HD[limId].name,limw:W.limw,newh:HD[W.newId].name,pity:c.pity,stage:c.stage,
  cp:()=>p.cpK&&c.cp>=1000?(c.cp/1000).toFixed(c.cp>=1e4?0:1).replace('.',',')+'k':String(c.cp),lv:c.lv,league:()=>c.league||T('Perunggu'),held:c.held,days:c.days,vip:c.vip,
  n:ex.n!=null?ex.n:20+Math.floor(r()*130),to:ex.to||'',me:(typeof S!=='undefined'&&S.name)||'kamu',top:W.top||'yang top 1',call:p.call||'kak',laugh:()=>chLaugh(p,r),emo:()=>chPick(r,p.emo||CHAT_STYLE.emos),
  sad:()=>chPick(r,CHAT_STYLE.emoSad),happy:()=>chPick(r,CHAT_STYLE.emoHappy),city:()=>chPick(r,CHAT_LINES.city),food:()=>chPick(r,CHAT_LINES.food),
  el:EL[el].n,weak:EL[EL_ADV[el]].n,hour:h,online:W.online,pitymax:PITY,soft:SOFT_PITY.at,dupe:DUPE_MAX,old:ex.old||'',x:ex.x||'',
  pfav:P.fav||'',pcity:P.city||'',pcp:typeof teamPow==='function'?fmt(teamPow()):'',prank:ex.prank||'',greet:h<11?'pagi':h<15?'siang':h<18?'sore':'malam'};
 s=s.replace(/\{(\w+)\}/g,(m,k)=>{let v=V[k];if(typeof v==='function')v=v();return v==null||v===''?(k==='to'?'':m):String(v)});
 return/\{\w+\}/.test(s)?null:s.replace(/\s+/g,' ').trim()}

/* ---------- gaya menulis: singkatan, huruf kecil, tawa, salah ketik, pecah pesan ---------- */
function chTypo(w,r){const K=CHAT_STYLE.keys.split('|'),pos=1+Math.floor(r()*(w.length-2)),op=Math.floor(r()*4),c=w[pos].toLowerCase();
 if(op===0)return w.slice(0,pos)+w[pos+1]+w[pos]+w.slice(pos+2);if(op===1)return w.slice(0,pos)+w.slice(pos+1);if(op===2)return w.slice(0,pos)+w[pos]+w.slice(pos);
 for(const row of K){const k=row.indexOf(c);if(k>=0){const n=row[k+(r()<.5?-1:1)]||row[k-1];return w.slice(0,pos)+n+w.slice(pos+1)}}return w}
function chStyle(text,p,r,o={}){const CS=CHAT_STYLE;let fix=null;
 let parts=text.split(/\s*\/\/\s*/).filter(Boolean).map(seg=>{let W=seg.split(' ');
  W=W.map(w=>{if(w[0]==='@')return w;const low=w.toLowerCase().replace(/[^a-z]/g,''),A=CS.abbr[low];if(A&&low.length>1&&r()<p.abbr){const alt=A[bHash(p.seed,chHashS(low))%A.length];return w.replace(new RegExp(low,'i'),alt)}return w});
  if(p.jp&&r()<p.jp*.3)(r()<.5?W.unshift(chPick(r,CS.jp.pre)):W.push(chPick(r,CS.jp.post)));
  if(r()<p.g.elong*.45){for(let k=W.length-1;k>=0;k--)if(/[aiueoh]$/i.test(W[k])&&W[k][0]!=='@'){W[k]+=W[k].slice(-1).repeat(1+Math.floor(r()*3));break}}
  let s=W.join(' ');
  if(p.typo&&!fix&&r()<p.typo*W.length){const cand=W.map((w,k)=>[w,k]).filter(([w])=>w.length>=4&&w[0]!=='@'&&/^[a-z]+$/i.test(w));if(cand.length){const[w,k]=chPick(r,cand),bad=chTypo(w,r);if(bad!==w){W[k]=bad;s=W.join(' ');if(r()<CS.fixP)fix='*'+w}}}
  if(p.lower)s=s.split(' ').map(w=>w[0]==='@'?w:w.toLowerCase()).join(' ');else if(r()<.75)s=s.charAt(0).toUpperCase()+s.slice(1);
  if(o.hype&&r()<.22)s=s.toUpperCase();
  const q=/\?$/.test(s);if(q&&r()<.3)s=s.replace(/\?$/,chPick(r,['??','???','',' ?']));
  if(!q&&!/[.!?)(:;^]$/.test(s)&&r()<p.g.punct)s+=chPick(r,['.','!','..','...','!!']);
  if(r()<p.g.emo*.28&&!/[\^:;)(]$/.test(s))s+=' '+chPick(r,p.emo);
  return s});
 if(parts.length===1&&parts[0].length>32&&r()<p.g.split*.4){const s=parts[0],k=s.indexOf(' ',Math.floor(s.length*.45));if(k>0)parts=[s.slice(0,k),s.slice(k+1)]}
 return{parts,fix}}

/* ---------- membuat & menyimpan pesan ---------- */
function chMk(out,t,i,tpl,c,r,ex={},o={}){const txt=chFill(tpl,c,r,ex);if(!txt)return t;const{parts,fix}=chStyle(txt,c.p,r,o);let tt=t;
 parts.forEach((s,k)=>{if(k)tt+=2e3+Math.floor(r()*5e3);out.push({id:(o.k||'b')+':'+i+':'+tt+':'+k,t:tt,i,text:s.slice(0,140),k:o.k||'b',me:!!o.me,ment:/@/.test(s)})});
 if(fix){tt+=3e3+Math.floor(r()*6e3);out.push({id:'fx:'+i+':'+tt,t:tt,i,text:fix,k:'fx',me:!!o.me})}return tt}
function chAdd(L){let add=0;for(const m of L){if(CHAT.ids.has(m.id))continue;CHAT.ids.add(m.id);CHAT.all.push(m);add++}
 if(add){CHAT.all.sort((a,b)=>a.t-b.t);if(CHAT.all.length>CHAT_CFG.keep*1.3){const cut=CHAT.all.length-CHAT_CFG.keep;CHAT.all.splice(0,cut)}}}
function chLine(src,key,c,r){let L=(CHAT_LINES[src]||{})[key]||[];if(c.p&&c.p.en&&CHAT_LINES.en[key]&&r()<.85)L=CHAT_LINES.en[key];
 L=L.filter(x=>!(x&&typeof x==='object'&&x.if&&!x.if(c)));const ex=CHAT.lines.filter(x=>x.tag===key&&x.at<=(c.t||Date.now()));
 if(ex.length&&(!L.length||r()<ex.length/(ex.length+L.length*1.5)))return chPick(r,ex).t;return L.length?chWPick(r,L.map(x=>typeof x==='object'?x:{t:x})).t:null}

/* ---------- obrolan biasa ---------- */
function chAmbKey(c,t,r){const h=wibHour(t),dow=wibDow(t),date=wibDate(t),K=[],add=(k,w)=>K.push({k,w});
 if(h>=5&&h<10)add('pagi',3);if(h>=11&&h<14)add('siang',2);if(h>=15&&h<18)add('sore',2);if(h>=18&&h<23)add('malam',2.2);if(h>=23||h<4)add('dini',3);
 if(dow===1&&h<14)add('senin',1.5);if(dow===5)add('jumat',1);if(dow===6||dow===0)add('weekend',1.5);if(BOT_CFG.SPEND.payday.dates.includes(date))add('gajian',1.1);
 if((h>=11&&h<14)||(h>=18&&h<21))add('makan',1);add('cuaca',.4);if(h>=22||h<2)add('ngantuk',1.2);add('gabut',1.5);if(h>=8&&h<17&&dow>=1&&dow<=5)add('kerja',1);add('kuliah',.3);
 add('harap',1.5);add('apes',c.luck==='sial'||c.mood==='sial'?2.2:.6);if(c.luck==='hoki')add('hoki',1.5);if(c.pity>=60)add('pityTinggi',2);if(c.held>0)add('nabung',1.6);
 add('farming',c.pf==='rajin'||c.pf==='hardcore'?1.4:.5);add('stuck',1.2);add('arena',1.1);add('cp',.8);if(c.lv<15||c.days<=1)add('pemula',2.5);if(c.days>=3)add('veteran',.6);
 add('favorit',1.6);add('opini',1.2);if(c.newRecent)add('baru',1.5);add('banner',1.2);add('topup',c.paid?1.2:.5);add('live2d',.5);add('meta',.07);add('motivasi',.5);if(c.fading)add('rehat',2.5);
 return chWPick(r,K).k}
function chAmb(out,i,t,r){const c=chCtx(i,t),b=botBase(i);
 // hampir selesai sesi -> pamit
 const ses=botSessions(b,wibDay(t)).find(([a,z])=>a<=t&&t<z);const key=ses&&ses[1]-t<4*6e4&&r()<.55?'pamit':chAmbKey(c,t,r);
 const tpl=chLine('amb',key,c,r);if(tpl)chMk(out,t,i,tpl,c,r,{to:chOther(i,t,r)})}
// nama bot lain yang online (untuk {to})
function chOther(i,t,r,on){on=on||chOnline(t);const o=on.filter(x=>x!==i);return o.length?botName(chPick(r,o),t):''}
function chSpeaker(r,L){if(!L||!L.length)return null;let best=null,bw=-1;for(let k=0;k<5;k++){const i=chPick(r,L),w=chPersona(i).chat*(.5+r());if(w>bw){bw=w;best=i}}return best}

/* ---------- utas tanya-jawab ---------- */
function chThread(out,i,t,r,talk){const c=chCtx(i,t),TH=CHAT_THREADS.filter(x=>!x.if||x.if(c));if(!TH.length)return chAmb(out,i,t,r);const th=chWPick(r,TH);
 const others=talk.filter(x=>x!==i);if(!others.length)return chAmb(out,i,t,r);const to=botName(chPick(r,others),t);
 let tt=chMk(out,t,i,chPick(r,th.ask),c,r,{to});const n=th.n[0]+Math.floor(r()*(th.n[1]-th.n[0]+1)),used=new Set([i]);let wrong=null,last=i;
 for(let k=0;k<n;k++){const j=chSpeaker(r,others.filter(x=>!used.has(x)));if(j==null)break;used.add(j);const cj=chCtx(j,tt);
  let a=null,tries=0;while(!a&&tries++<6){const pick=chWPick(r,th.ans.map(x=>typeof x==='object'&&typeof x!=='function'?x:{t:x}));const txt=typeof pick.t==='function'?pick.t(cj,chWorld(),CHAT.mem):pick.t;if(txt){a={t:txt,x:pick.x}}}
  if(!a)continue;tt+=1.5e4+Math.floor(r()*(k?9e4:6e4));tt=chMk(out,tt,j,a.t,cj,r,{to:botName(i,tt)});last=j;if(a.x)wrong=j}
 if(wrong!=null&&th.fix&&r()<.75){const j=chSpeaker(r,others.filter(x=>x!==wrong));if(j!=null){tt+=8e3+Math.floor(r()*3e4);tt=chMk(out,tt,j,chPick(r,th.fix),chCtx(j,tt),r,{to:botName(wrong,tt)})}}
 if(last!==i&&th.thx&&r()<.65){tt+=1e4+Math.floor(r()*5e4);tt=chMk(out,tt,i,chPick(r,th.thx),c,r,{to:botName(last,tt)})}
 if(th.extra&&r()<.35){const j=chSpeaker(r,others);if(j!=null){tt+=1e4+Math.floor(r()*4e4);chMk(out,tt,j,chPick(r,th.extra),chCtx(j,tt),r,{})}}}

/* ---------- satu menit obrolan (deterministik) ---------- */
function chGenMinute(m){if(CHAT.mins.has(m))return;CHAT.mins.add(m);const t0=m*6e4,r=chR(m%2147483,61+BOTS.gen),on=chOnline(t0+3e4),out=[];
 const talk=on.filter(i=>chPersona(i).chat>0);const lam=Math.min(2.4,.085*Math.sqrt(on.length))*CHAT_CFG.rate;let k=chPois(r,lam);
 for(let j=0;j<k&&talk.length;j++){const i=chSpeaker(r,talk),t=t0+Math.floor(r()*6e4);try{if(r()<CHAT_CFG.thread&&talk.length>=3)chThread(out,i,t,r,talk);else chAmb(out,i,t,r)}catch(e){}}
 chAdd(out)}

/* ---------- kejadian nyata bot -> reaksi ---------- */
const chSnap=(b,t)=>{const s=botSnap(b,t);return botActive(b,s)?s:null};
function chEvents(from,to){if(!botsWarmOk()||to<=from)return;const n=botsVisible(to),out=[],W=chWorld(to),EV=CHAT_LINES.ev;
 for(let i=0;i<n;i++){const b=botBase(i);if(b.join>=to||b.endT<from)continue;const p=chPersona(i),talkW=Math.min(1,.35+p.chat*.4);
  const say=(t,key,ex,o,prob,now)=>{const r=chR(i,chHashS(key+':'+Math.floor(t))%1e6);if(r()>=prob*talkW)return;const tt=now?t+Math.floor(r()*6e4):chSnap(b,t+4e3+Math.floor(r()*8e4));if(tt==null)return;
   const c=chCtx(i,tt),tpl=chLine('ev',key,c,r);if(tpl)chMk(out,tt,i,tpl,c,r,ex,o)};
  if(b.join>=from&&b.join<to){say(b.join+6e4,'join',{},{},.16,1);const r=chR(i,881);if(r()<.22){const on=chOnline(b.join+2e5).filter(x=>x!==i&&chPersona(x).chat>0);
   for(let k=0,m=1+Math.floor(r()*r()*3);k<m&&on.length;k++){const j=chPick(r,on),tt=b.join+9e4+k*2.5e4+Math.floor(r()*6e4),cj=chCtx(j,tt);const tpl=chLine('ev','welcome',cj,r);if(tpl)chMk(out,tt,j,tpl,cj,r,{to:botName(i,tt)})}}}
  const s=BOTS.cache[i];if(s&&s.ev)for(let k=s.ev.length-1;k>=0;k--){const e=s.ev[k];if(e.t<from)break;if(e.t>=to)continue;const nm=e.w?WD[e.id].name:HD[e.id].name;
   if(e.lim&&!e.w){const rs=chR(i,chHashS('sys'+e.t));if(rs()<CHAT_CFG.sysLim){out.push({id:'sys:'+i+':'+e.t,t:e.t+1500,i,sys:1,k:'sys',hero:e.id,text:T('{n} mendapatkan ★3 {h}!',{n:botName(i,e.t),h:nm})});
    // yang lain kadang memberi selamat
    if(rs()<.3){const on=chOnline(e.t).filter(x=>x!==i&&chPersona(x).chat>0);if(on.length){const j=chPick(rs,on),tt=e.t+8e3+Math.floor(rs()*4e4),cj=chCtx(j,tt),tpl=chLine('ev','grats',cj,rs);if(tpl)chMk(out,tt,j,tpl,cj,rs,{to:botName(i,e.t)})}}}}
   const key=e.w?'pullWpn':e.dupe&&!e.lim?'pullDupe':e.lim&&e.n<=20?'pullEarly':e.lim?'pullLim':e.up&&!e.on?'pullOff':'pullStd';
   say(e.t,key,{got:nm,n:e.n},{hype:key==='pullLim'||key==='pullEarly'},e.lim?.6:key==='pullOff'?.5:.22)}
  if(b.tier.id!=='f2p'){const sp=botSpend(b,to);for(let k=sp.buys.length-1;k>=0;k--){const o=sp.buys[k];if(o.t<from)break;if(o.t>=to)continue;
   const era=BOT_CFG.ERAS.some(E=>o.t-E.at>0&&o.t-E.at<2*BDAY),big=o.id==='g5'||o.id==='g6';
   say(o.t,o.id==='mc'?'buyCard':era&&o.id!=='g1'?'buyBanner':big?'buyBig':'buySmall',{},{},o.id==='mc'?.16:big?.35:era?.3:.1)}}
  if(b.back&&b.segs[2][0]>=from&&b.segs[2][0]<to)say(b.segs[2][0],'comeback',{},{},.55);
  if(b.rn&&b.rn.t>=from&&b.rn.t<to&&b.rn.k<BOTS.renames.length)say(b.rn.t+3e4,'rename',{old:BOTS.names[i]},{},.6);
  if(b.quit<Infinity&&b.segs[1]&&b.segs[1][0]>=from&&b.segs[1][0]<to)say(b.segs[1][0],'rehat',{},{},.35)}
 // banner / hero baru: serbuan obrolan dari yang online
 const burst=(t0,key,salt)=>{if(t0<from||t0>=to)return;const r=chR(salt,77),on=chOnline(t0+6e5).filter(x=>chPersona(x).chat>0);for(let k=0,m=4+Math.floor(r()*8);k<m&&on.length;k++){const j=chPick(r,on),tt=t0+Math.floor(r()*30*6e4),c=chCtx(j,tt);const tpl=chLine('ev',key,c,r);if(tpl)chMk(out,tt,j,tpl,c,r,{},{hype:true})}};
 BOT_CFG.ERAS.forEach((E,k)=>k&&burst(E.at,'eraStart',9100+k));Object.entries(BOT_CFG.HERO_SINCE).forEach(([id,t],k)=>burst(t,'newHero',9300+k));
 chAdd(out)}

/* ---------- jalankan: buat menit yang belum, tampilkan yang sudah lewat ---------- */
function chatPump(now=Date.now()){if(!botsWarmOk()||!BOTS.names.length)return;chatInit();
 const m1=Math.floor(now/6e4),m0=Math.floor((now-CHAT_CFG.win)/6e4)-12;for(let m=Math.max(m0,m1-140);m<=m1+1;m++)chGenMinute(m);
 const from=Math.max(CHAT.evTo||now-CHAT_CFG.win,now-CHAT_CFG.win);chEvents(from,now);CHAT.evTo=now;chLinesEnsure()}
function chatVisible(now=Date.now()){const L=CHAT.all.filter(m=>m.t<=now&&m.t>=now-CHAT_CFG.win*1.5).concat(CHAT.me.filter(m=>m.t<=now));return L.sort((a,b)=>a.t-b.t).slice(-CHAT_CFG.keep)}
function chatTyping(now=Date.now()){const L=CHAT.all.concat(CHAT.me).filter(m=>!m.me&&!m.sys&&m.i!=null&&m.t>now&&m.t-now<Math.min(12e3,2500+m.text.length*260));return[...new Set(L.map(m=>m.i))].slice(0,3)}
// nama tampil
const chName=m=>m.me?(S.name||'Kamu'):m.i!=null&&m.i<BOTS.names.length?botName(m.i,m.t):'???';

/* ---------- penyimpanan lokal ---------- */
function chatInit(){if(CHAT.inited)return;CHAT.inited=true;try{CHAT.me=JSON.parse(localStorage.getItem(CH_ME)||'[]').filter(m=>m&&m.t)}catch(e){CHAT.me=[]}
 try{CHAT.mem=JSON.parse(localStorage.getItem(CH_MEM)||'{}')||{}}catch(e){CHAT.mem={}}try{CHAT.lines=JSON.parse(localStorage.getItem(CH_LINES)||'[]')}catch(e){CHAT.lines=[]}
 CHAT.seenT=CHAT.mem.seenT||Date.now()-5*6e4;
 if(BOTS.db)BOTS.db.doc('bots/chatlines').onSnapshot(s=>{const d=s.exists?s.data():null;if(d&&Array.isArray(d.list))chLinesSet(d.list)},()=>{})}
function chatSaveMe(){try{CHAT.me=CHAT.me.sort((a,b)=>a.t-b.t).slice(-CHAT_CFG.meKeep);localStorage.setItem(CH_ME,JSON.stringify(CHAT.me));localStorage.setItem(CH_MEM,JSON.stringify(CHAT.mem))}catch(e){}}

/* ---------- kamu mengirim pesan -> bot menanggapi ---------- */
function chNameMap(){const m=new Map(),n=botsVisible();for(let i=0;i<n;i++){m.set(BOTS.names[i].toLowerCase(),i);const b=botBase(i);if(b.rn&&b.rn.k<BOTS.renames.length)m.set(botName(i).toLowerCase(),i)}return m}
function chBrainRe(re){const all=HEROES.map(h=>h.name.toLowerCase()).join('|'),s3=HEROES.filter(h=>h.r===3).map(h=>h.name.toLowerCase()).join('|');return new RegExp(re.source.replace(/HERO3/g,'('+s3+')').replace(/HERO/g,'('+all+')'),re.flags)}
function chMatch(txt){const low=txt.toLowerCase();for(const it of CHAT_BRAIN.intents){const re=it._re||(it._re=chBrainRe(it.re)),m=low.match(re);if(m){const x=(m.slice(1).filter(Boolean).find(g=>HEROES.some(h=>h.name.toLowerCase()===g))||m[3]||m[1]||'');
  return{it,x:x?x.charAt(0).toUpperCase()+x.slice(1):''}}}return null}
function chatSend(raw){chatInit();const txt=String(raw||'').replace(/\s+/g,' ').trim().slice(0,100);if(!txt)return false;const now=Date.now();
 if(now-(CHAT.lastSend||0)<1500){toast(T('Pelan-pelan, tunggu sebentar.'),1);return false}CHAT.lastSend=now;
 CHAT.me.push({id:'me:'+now,t:now,me:true,text:txt,k:'me'});const P=CHAT.mem;P.n=(P.n||0)+1;chatSaveMe();chatRespond(txt,now);return true}
async function chatRespond(txt,now){const P=CHAT.mem,low=txt.toLowerCase(),r=bRng((now^chHashS(txt))>>>0),out=[];
 const on=chOnline(now),talk=on.map(i=>[i,(chPersona(i).chat+.15)*r()]).sort((a,b)=>b[1]-a[1]).map(x=>x[0]);
 // bot yang disebut namanya
 const NM=chNameMap(),ment=[];for(const tok of low.replace(/[^a-z0-9@ ]/g,' ').split(' ')){const k=tok.replace(/^@/,'');if(k.length>=3&&NM.has(k)&&!ment.includes(NM.get(k)))ment.push(NM.get(k))}
 // yang tadi ikut ngobrol lebih mungkin menanggapi
 const recent=[...new Set(chatVisible(now).filter(m=>m.i!=null&&!m.sys&&now-m.t<12*6e4).map(m=>m.i))].filter(i=>on.includes(i));
 const cands=[...new Set([...ment.filter(i=>on.includes(i)),...recent.slice(-3),...talk.slice(0,8)])].slice(0,9);
 // 1) Mode AI (Haiku lewat server) -> 2) Claude di claude.ai -> 3) otak lokal
 let done=false;try{let res=aiOn()?await chAI('reply',cands,{msg:txt}):null;if(res){if(res.length)chAIPost(res,now,'reply');res=null;done=true}else if(!aiOn()||CHAT.aiErr)res=await chClaude(txt,cands,ment,now);if(res&&res.length){let tt=now;res.forEach((x,k)=>{tt=Math.max(tt,now)+((x.delay||3+k*4)*1e3)+Math.floor(x.text.length*120);const c=chCtx(x.i,tt);
   const{parts}=chStyle(x.text,Object.assign({},c.p,{abbr:c.p.abbr*.25,typo:c.p.typo*.5}),r);parts.forEach((s,q)=>out.push({id:'cr:'+x.i+':'+tt+':'+q,t:tt+q*2500,i:x.i,text:s.slice(0,140),k:'re',ment:/@/.test(s)}))});done=true}}catch(e){}
 // 2) otak lokal
 if(!done){const M=chMatch(txt),ask=P.lastAsk&&now-P.lastAsk.t<4*6e4&&on.includes(P.lastAsk.i)?P.lastAsk:null;let tt=now+2500+Math.floor(r()*4e3);
  if(M&&M.it.learn)M.it.learn(P,low,M.x||(low.match(chBrainRe(M.it.re))||[])[3]);
  const usedT=new Set(),reply=(i,tpl,ex={})=>{usedT.add(tpl);const c=chCtx(i,tt);tt=chMk(out,tt,i,tpl,c,r,Object.assign({x:M&&M.x,prank:chMyRank()},ex),{k:'re'})+4e3+Math.floor(r()*9e3)};
  // jawaban atas pertanyaan bot: hanya bila pesannya pendek / memang jawaban (bukan topik baru yang jelas)
  if(ask&&!/\?$/.test(txt)&&(!M||['favSaya','kotaSaya','ya','ketawa','senang'].includes(M.it.id)||txt.length<22)){const A=CHAT_BRAIN.ack[ask.k]||CHAT_BRAIN.ack.any;if(ask.k==='city')P.city=txt.split(' ').pop();if(ask.k==='fav'){const h=HEROES.find(h=>low.includes(h.name.toLowerCase()));if(h)P.fav=h.name}
   reply(ask.i,chPick(r,A),{x:ask.k==='city'?P.city:(M&&M.x)||txt.split(' ').pop()});P.lastAsk=null}
  else{const it=M?M.it:null,p=it?it.p:(ment.length?.95:/\?$/.test(txt)?.75:.45);
   if(r()<p){const nMin=it?it.n[0]:1,nMax=it?it.n[1]:2,n=Math.max(ment.length?1:0,nMin+Math.floor(r()*(nMax-nMin+1)));
    // yang disebut dulu, sisanya diundi (yang barusan ikut ngobrol sedikit lebih mungkin)
    const pool=cands.filter(i=>!ment.includes(i)).map(i=>[i,(recent.includes(i)?1.6:1)*(chPersona(i).chat+.3)*r()]).sort((a,b)=>b[1]-a[1]).map(x=>x[0]);
    const who=[...ment.filter(i=>on.includes(i)),...pool].filter((v,k,a)=>a.indexOf(v)===k).slice(0,n);
    who.forEach(i=>{const L=(it?it.rep:CHAT_BRAIN.fallback);let tpl=null,k=0;while(!tpl&&k++<8){const x=chPick(r,L);const v=typeof x==='function'?x(chCtx(i,tt),chWorld(),P):x;if(v&&!usedT.has(v))tpl=v}if(tpl)reply(i,tpl)});
    // kadang bot balik bertanya
    if(who.length&&r()<.22&&!(P.lastAsk&&now-P.lastAsk.t<6*6e4)){const Q=CHAT_BRAIN.ask.filter(q=>!q.if||q.if(P));if(Q.length){const q=chPick(r,Q),i=chPick(r,who);reply(i,q.t);P.lastAsk={i,k:q.k,t:tt}}}}}
  // yang disebut tapi sedang offline: membalas saat online lagi
  for(const i of ment)if(!on.includes(i)){const b=botBase(i),t2=chSnap(b,now+3e5);if(t2==null||t2-now>2*BDAY)continue;const c=chCtx(i,t2),L=M?M.it.rep:CHAT_BRAIN.fallback;const x=chPick(r,L),tpl=typeof x==='function'?x(c,chWorld(),P):x;
   if(tpl)chMk(out,t2+2e4,i,chPick(r,['sori baru on {me}, ','eh baru liat, ','@{me} ','maaf telat bales, '])+tpl,c,r,{x:M&&M.x},{k:'re'})}}
 CHAT.me.push(...out);chatSaveMe()}
function chMyRank(){try{const L=botsList().sort((a,b)=>b.cp-a.cp);return L.findIndex(e=>e.me)+1}catch(e){return 0}}

/* ---------- Claude: balasan bebas sesuai persona & keadaan asli bot ---------- */
function chDescribe(i,now){const c=chCtx(i,now),p=c.p,REG={gaul:'gaul, huruf kecil, banyak singkatan (yg, ga, bgt), suka ketawa '+p.laugh[0],santai:'santai, kadang singkatan',sopan:'sopan, kalimat rapi',inggris:'campur bahasa Inggris',wibu:'wibu, suka selip kata Jepang (yatta, sugoi)',singkat:'super singkat 1-4 kata'};
 return`- ${c.name}: gaya ${REG[p.reg]}; hero favorit ${c.hero}; Lv ${c.lv}; CP ${c.cp}; tahap ${c.stage}; ${c.league?'liga Arena '+c.league+'; ':''}gacha ${c.luck==='sial'?'lagi apes':c.luck==='hoki'?'lagi hoki':'biasa'}, pity ${c.pity}; ${c.vip>=4?'sultan VIP '+c.vip:c.paid?'kadang top up'+(c.card?', pakai kartu bulanan':''):'f2p'}${c.held?'; lagi nabung '+c.held+' tarikan':''}; main ${c.days} hari${c.fading?'; mulai bosan sama game':''}`}
async function chClaude(txt,cands,ment,now){const cl=window.claude;if(!cl||typeof cl.use!=='function'||CHAT.noClaude||!cands.length)return null;if(now-(CHAT.clFail||0)<6e4)return null;
 let sample=null;try{sample=await cl.use('sample')}catch(e){}if(!sample){CHAT.noClaude=true;return null}const W=chWorld(now),P=CHAT.mem;
 const hist=chatVisible(now).slice(-16).map(m=>`${m.sys?'[SISTEM]':chName(m)+(m.me?' (pemain yang sedang kamu tanggapi)':'')}: ${m.text}`).join('\n');
 const prompt=`Kamu menulis balasan obrolan dunia (world chat) game mobile gacha pixel "Aster Chronicles". Para penulis di bawah adalah pemain sungguhan di server, BUKAN asisten.
FAKTA GAME: hard pity ${PITY}, soft pity mulai ${SOFT_PITY.at}, rate off 50/50 lalu berikutnya pasti rate up. Banner sekarang: ${W.lims.map(id=>HD[id].name).join(', ')} (terbatas). Hero terbaru: ${HD[W.newId].name}. Hero: ${HEROES.map(h=>h.name+'(★'+h.r+' '+EL[h.el].n+' '+ROLE[h.role].n+')').join(', ')}. Elemen: api>tanah>air>api, cahaya dan gelap saling kuat. Permata dari misi harian, event, Arena, tahap pertama kali, top up; Kartu Bulanan 180 permata/hari. Arena: liga Perunggu-Perak-Emas-Platinum-Berlian-Legenda. Pemain CP tertinggi: ${W.top||'-'}.
PEMAIN YANG MENGIRIM PESAN: ${S.name}, Lv ${S.lv}, CP ${teamPow()}, peringkat CP #${chMyRank()}${P.city?', dari '+P.city:''}${P.fav?', hero favorit '+P.fav:''}.
CALON PENJAWAB (keadaan asli mereka, pakai bila relevan):
${cands.map(i=>chDescribe(i,now)).join('\n')}
${ment.length?'Pemain menyebut: '+ment.map(i=>botName(i,now)).join(', ')+' (yang disebut dan sedang online sebaiknya menjawab).':''}
OBROLAN TERAKHIR:
${hist}

Tulis 0-3 balasan untuk pesan terakhir ${S.name} ("${txt}"). Pilih penjawab yang paling wajar dari calon; tidak harus semua. Boleh 0 bila pesannya memang tidak perlu ditanggapi.
ATURAN: tiap balasan maks 90 karakter, bahasa & gaya sesuai persona masing-masing, alami seperti chat sungguhan (boleh bercanda, menggoda ringan, beda pendapat, bertanya balik), tanpa emoji, tanpa tautan, ramah keluarga, jangan sebut orang nyata atau merek, jangan pernah mengaku AI/bot/asisten, jangan mengulang kalimat orang lain. Fakta game harus benar. Panggil ${S.name} pakai @${S.name} bila perlu.
Balas HANYA JSON: {"replies":[{"who":"nama penjawab","text":"...","delay":detik_mengetik_2_sampai_15}]}`;
 try{let o=null;if(typeof sample.json==='function')o=await sample.json(prompt,{modelTier:'quick'});else{const res=await sample(prompt,{modelTier:'quick'});const m=String(res&&res.text||'').match(/\{[\s\S]*\}/);o=m?JSON.parse(m[0]):null}
  const L=(o&&(o.replies||(Array.isArray(o)?o:null)))||[],byName=new Map(cands.map(i=>[botName(i,now).toLowerCase(),i]));
  return L.map(x=>({i:byName.get(String(x.who||'').toLowerCase()),text:String(x.text||'').replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/gu,'').replace(/https?\S+/g,'').trim().slice(0,110),delay:Math.max(2,Math.min(15,+x.delay||4))}))
   .filter(x=>x.i!=null&&x.text.length>0).slice(0,3)}catch(e){CHAT.clFail=Date.now();if(e&&e.code==='not_granted')CHAT.noClaude=true;return null}}

/* ---------- kolam kalimat buatan Claude (terus bertambah, dibagi lewat db) ---------- */
function chLinesSet(L){const keys=new Set([...Object.keys(CHAT_LINES.amb),...Object.keys(CHAT_LINES.ev)]),seen=new Set(CHAT.lines.map(x=>x.t.toLowerCase())),add=[];
 for(const x of L){if(!x||typeof x.t!=='string'||!keys.has(x.tag))continue;const t=x.t.replace(/[^A-Za-z0-9À-ɏ .,!?'"~()\-:{}*^_/]/g,'').replace(/\s+/g,' ').trim();
  if(t.length<2||t.length>90||/https?|www|@/.test(t)||seen.has(t.toLowerCase()))continue;seen.add(t.toLowerCase());add.push({t,tag:x.tag,at:+x.at||0})}
 if(add.length){CHAT.lines=CHAT.lines.concat(add).slice(-CHAT_CFG.linesMax);try{localStorage.setItem(CH_LINES,JSON.stringify(CHAT.lines))}catch(e){}}return add.length}
async function chLinesEnsure(){const cl=window.claude,now=Date.now();if(!cl||typeof cl.use!=='function'||CHAT.noClaude||CHAT.linesBusy||now-(CHAT.linesAt||0)<CHAT_CFG.linesEvery||CHAT.lines.length>=CHAT_CFG.linesMax)return;
 CHAT.linesBusy=true;CHAT.linesAt=now;try{const sample=await cl.use('sample');if(!sample)return;const keys=Object.keys(CHAT_LINES.amb).concat(['pullLim','pullOff','pullEarly','buyBig','welcome','join','comeback']);
  const pick=keys.sort(()=>Math.random()-.5).slice(0,10);
  const prompt=`Buat ${CHAT_CFG.linesBatch} pesan obrolan dunia (world chat) yang ditulis pemain sungguhan di game mobile gacha pixel "Aster Chronicles" (hero: ${HEROES.map(h=>h.name).join(', ')}; ada Arena, dungeon, stamina, pity ${PITY}, top up & Kartu Bulanan). `+
   `Tag yang dipakai (maknanya dari nama tag): ${pick.join(', ')}. Gaya beragam & natural: bahasa Indonesia santai/gaul, kadang Inggris, sedikit romaji. Boleh pakai slot {hero} (hero favorit penulis), {lim} (hero banner terbatas), {got} (yang barusan didapat, hanya untuk tag pull*), {stage}, {cp}, {laugh}, {food}, {city}. `+
   `ATURAN: maks 70 karakter, tanpa emoji, tanpa tautan, tanpa @, ramah keluarga, jangan sebut orang nyata/merek, jangan mengulang pola yang sama. Balas HANYA array JSON [{"t":"teks","tag":"tag"}].`;
  let arr=null;if(typeof sample.json==='function')arr=await sample.json(prompt,{modelTier:'quick'});if(arr&&!Array.isArray(arr))arr=Object.values(arr).find(Array.isArray)||null;
  if(!Array.isArray(arr)){const res=await sample(prompt,{modelTier:'quick'});const m=String(res&&res.text||'').match(/\[[\s\S]*\]/);arr=m?JSON.parse(m[0]):[]}
  if(chLinesSet(arr.map(x=>Object.assign({},x,{at:now})))&&BOTS.db&&BOTS.dbWrite)try{await BOTS.db.doc('bots/chatlines').set({list:CHAT.lines,updated:now})}catch(e){}
 }catch(e){if(e&&e.code==='not_granted')CHAT.noClaude=true}finally{CHAT.linesBusy=false}}

/* ---------- hal yang melibatkanmu (lokal) ---------- */
function chatLater(i,t,key,ex={},prob=1){const b=botBase(i),r=chR(i,chHashS(key+t));if(r()>=prob)return;const tt=chSnap(b,t+2e4+Math.floor(r()*12e4));if(tt==null)return;
 const c=chCtx(i,tt),tpl=chLine('ev',key,c,r);if(!tpl)return;const out=[];chMk(out,tt,i,tpl,c,r,ex,{k:'re'});chatInit();CHAT.me.push(...out);chatSaveMe()}
// kamu menyerang bot i di Arena
function chatArenaAtk(e){chatAct(`${e.win?'menang':'kalah'} menyerang ${botName(e.i)} di Arena`);if(e.win)chatLater(e.i,e.t,'beatenBy',{},botBase(e.i).mood==='sial'?.45:.3);CHAT.mem.arWin=e.win?botName(e.i):CHAT.mem.arWin}
// bot menyerang tim bertahanmu (rev = balas dendam)
function chatArenaHit(e){chatAct(`tim bertahannya ${e.held?'menahan':'dikalahkan'} ${e.rev?'balas dendam ':'serangan '}${botName(e.i)} di Arena`);if(e.rev)chatLater(e.i,e.t,e.held?'revLose':'revWin',{},e.held?.5:.6);else if(!e.held)chatLater(e.i,e.t,'hitWin',{},.15)}
// tarikanmu: ★3 diumumkan sistem, bot yang online memberi selamat
function chatPlayerPull(b,res){try{chatInit();const now=Date.now(),hit=res.filter(it=>itemR(it)===3);
 chatAct(`summon ${res.length}x di ${b.n}: ${hit.length?'dapat ★3 '+hit.map(it=>it.wid?WD[it.wid].name:HD[it.id].name).join(', '):'tidak dapat ★3'} (pity sekarang ${b.weapon?S.wpity:S.pity})`);if(!hit.length)return;const on=chOnline(now).filter(i=>chPersona(i).chat>0),r=bRng(now>>>0);
 hit.forEach((it,k)=>{const nm=it.wid?WD[it.wid].name:HD[it.id].name;CHAT.me.push({id:'msys:'+now+':'+k,t:now+1500+k*500,sys:1,k:'sys',hero:it.id||null,text:T('{n} mendapatkan ★3 {h}!',{n:S.name,h:nm})});
  const lim=!!b.limited&&(it.id===b.rateUp||it.wid===b.rateUp);if(r()<(lim?.85:.5)){let tt=now+5e3;for(let j=0,m=1+Math.floor(r()*(lim?3:2));j<m&&on.length;j++){const i=chPick(r,on),c=chCtx(i,tt),tpl=chLine('ev','gratsMe',c,r);if(tpl)tt=chMk(CHAT.me,tt+3e3+Math.floor(r()*9e3),i,tpl,c,r,{got:nm},{k:'re'})}}});chatSaveMe()}catch(e){}}
// panggilan dari bot: kamu masuk 10 besar / pemain baru (maks sekali sehari)
function chatCallouts(now=Date.now()){const P=CHAT.mem,d=wibDay(now);if(P.callDay===d)return;const rk=chMyRank(),on=chOnline(now).filter(i=>chPersona(i).chat>0);if(!on.length)return;
 const r=bRng((d*7919)>>>0);let key=null;if(rk&&rk<=10)key='top';else if(S.lv<8)key='newbie';P.callDay=d;if(!key||r()>.7){chatSaveMe();return}
 const i=chPick(r,on),c=chCtx(i,now);chMk(CHAT.me,now+2e4+Math.floor(r()*9e4),i,chPick(r,CHAT_BRAIN.callout[key]),c,r,{prank:rk},{k:'re'});chatSaveMe()}
// pasang kait ke tarikan pemain
if(typeof pullItems==='function'){const _pull=pullItems;pullItems=function(b,n){const res=_pull(b,n);setTimeout(()=>chatPlayerPull(b,res),900);return res}}

/* =====================================================================
   MODE AI (Claude Haiku 5.5 lewat server bank-worker: POST /api/ai)
   - Balasan untuk pesanmu + "adegan" obrolan berkala yang ditulis AI dari keadaan ASLI para bot
     yang sedang online, obrolan terakhir, dan keadaanmu (akun, tim, aktivitas terbaru, layar yang dibuka).
   - Token tidak ada di game: server yang menyimpannya. Pengetahuan game lengkap ada di server
     (dibuat otomatis dari data game: tools/gen_knowledge.mjs).
   - Nyala/mati di Menu > Pengaturan (S.aiMode, default nyala). Gagal/kuota habis -> kembali ke Claude/otak lokal.
   ===================================================================== */
CHAT_CFG.ai={scene:[70e3,140e3],idle:[240e3,420e3],hourMax:36,cands:7};
const aiOn=()=>typeof S!=='undefined'&&S.aiMode!==false&&!!TOPUP_CFG.api;
// jejak aktivitasmu (dipakai sebagai konteks AI, disimpan lokal)
function chatAct(s){try{chatInit();const A=CHAT.mem.acts=CHAT.mem.acts||[];A.push({t:Date.now(),s:String(s).slice(0,140)});if(A.length>15)A.splice(0,A.length-15);chatSaveMe()}catch(e){}}
const SCR_N={home:'Beranda',heroes:'Hero',adv:'Petualangan',summon:'Summon',mission:'Misi',team:'Tim',arena:'Arena'};
function chPlayerInfo(){const team=S.team.filter(Boolean).map(id=>{const h=S.heroes[id],w=h.wpn&&WD[h.wpn];return`${HD[id].name}★${HD[id].r} Lv${h.lv}${h.lb?'+'+h.lb:''}${w?' ('+w.name+')':''}`}).join(', ');
 const own=Object.keys(S.heroes),s3=own.filter(id=>HD[id].r===3).map(id=>HD[id].name),cl=SLIST.filter(x=>S.stages[x.key]).pop(),A=S.arena||{},P=CHAT.mem;let lg='';try{if(A.reg)lg=`, Arena liga ${T(arLg(A.pts).n)} ${A.pts} poin (${A.wins||0} menang/${A.losses||0} kalah)`}catch(e){}
 return`Lv ${S.lv}, CP tim ${teamPow()}, peringkat CP #${chMyRank()} dari ${botsVisible()+1}, ${vipOf(S.iap&&S.iap.spent||0)?'VIP '+vipOf(S.iap.spent)+' (pernah top up)':'belum pernah top up'}; tim: ${team||'-'}; punya ${own.length}/${HEROES.length} hero${s3.length?' (★3: '+s3.join(', ')+')':''}; tahap terjauh ${cl?cl.key:'belum ada'}${lg}; permata ${S.gems}, emas ${S.gold}, stamina ${S.stam}; pity hero ${S.pity||0}${S.hg?' (★3 berikutnya dijamin rate up)':''}${P.city?'; tinggal di '+P.city:''}${P.fav?'; hero favorit '+P.fav:''}`}
function chWorldTxt(now){const W=chWorld(now);return`banner terbatas ${W.lims.map(id=>HD[id].name).join(' & ')}${W.limw?', senjata rate-up '+W.limw:''}; hero terbaru ${HD[W.newId].name}${W.newRecent?' (baru rilis)':''}; CP #1 ${W.top} (${W.topCP}); event aktif: ${W.events.join(', ')||'-'}`}
function chHist(now,n=22){return chatVisible(now).slice(-n).map(m=>`${chTime(m.t)} ${m.sys?'[SISTEM]':chName(m)+(m.me?' (PEMAIN)':'')}: ${m.text}`)}
function chCandsDesc(L,now){return L.map(i=>{const s=botState(i),b=botBase(i),bio=botBio(i,s,0,now);return{name:botName(i,now),desc:chDescribe(i,now).replace(/^- [^:]+: /,'')+(s.stats.vip?'; VIP '+s.stats.vip:'')+(bio?`; bio "${bio}"`:'')+(b.rn&&now>=b.rn.t&&botOldName(i,now)?'; dulu bernama '+botOldName(i,now):'')}})}
async function chAI(kind,cands,extra={}){if(!aiOn()||!cands.length)return null;const now=Date.now();if(now<(CHAT.aiBlock||0))return null;
 const d=new Date(now+BOT_CFG.TZ*36e5),HARI=['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
 const body={kind,when:`${HARI[d.getUTCDay()]} ${d.getUTCDate()}/${d.getUTCMonth()+1} ${chTime(now)}`,online:chWorld(now).online,world:chWorldTxt(now),
  player:{name:S.name,info:chPlayerInfo(),acts:(CHAT.mem.acts||[]).filter(a=>now-a.t<6*36e5).map(a=>`${chTime(a.t)} ${a.s}`),screen:chatOpen?'Obrolan Dunia (membaca chat)':SCR_N[typeof tab!=='undefined'?tab:'home']||''},
  cands:chCandsDesc(cands,now),hist:chHist(now),...extra};
 try{const r=await fetch(TOPUP_CFG.api.replace(/\/$/,'')+'/api/ai',{method:'POST',headers:{'content-type':'text/plain'},body:JSON.stringify(body)});const j=await r.json().catch(()=>null);
  if(!r.ok||!j||!j.ok){CHAT.aiErr=(j&&j.e)||('http '+r.status);if(r.status===429||r.status===503)CHAT.aiBlock=now+(j&&j.e==='quota'?36e5:6e4);return null}
  CHAT.aiErr=null;const byName=new Map(cands.map(i=>[botName(i,now).toLowerCase(),i]));return j.out.map(x=>({i:byName.get(String(x.who).toLowerCase()),text:x.text,delay:x.delay})).filter(x=>x.i!=null)}
 catch(e){CHAT.aiErr='jaringan';return null}}
// tulis hasil AI ke obrolan: gaya ringan (huruf kecil persona, kadang salah ketik) supaya tetap konsisten dengan bot lain
// pesan panjang dipecah di batas kalimat/koma jadi beberapa gelembung (tidak pernah dipotong di tengah kata)
function chChunks(s,max=95){const out=[];s=s.trim();while(s.length>max){let k=-1;for(const re of[/[.!?]\s/g,/[,;]\s/g,/\s/g]){let m;re.lastIndex=0;while((m=re.exec(s))&&m.index<max)k=m.index+1;if(k>20)break}if(k<=0)k=max;out.push(s.slice(0,k).trim());s=s.slice(k).trim()}if(s)out.push(s);return out}
function chAIPost(L,start,kind){L=L.flatMap(x=>chChunks(x.text).map((t,k)=>Object.assign({},x,{text:t,delay:k?2+t.length/12:x.delay})));const out=[];let tt=start;const r=bRng((start^0x9e37)>>>0);
 L.forEach((x,k)=>{tt+=(kind==='scene'?x.delay:x.delay+k*2)*1e3+Math.floor(x.text.length*90);const p=chPersona(x.i),{parts,fix}=chStyle(x.text,Object.assign({},p,{abbr:p.abbr*.2,typo:p.typo*.6,g:Object.assign({},p.g,{emo:p.g.emo*.3,punct:0,split:p.g.split*.5})}),r);
  parts.forEach((s,q)=>out.push({id:'ai:'+x.i+':'+tt+':'+q,t:tt+q*2200,i:x.i,text:s.slice(0,140),k:'ai',ment:/@/.test(s)}));if(fix)out.push({id:'aifx:'+x.i+':'+tt,t:tt+4e3,i:x.i,text:fix,k:'fx'})});
 CHAT.me.push(...out);chatSaveMe();return out.length}
// adegan obrolan AI berkala (lebih sering saat panel chat terbuka)
async function chatAiScene(now=Date.now()){if(!aiOn()||CHAT.aiBusy||document.visibilityState==='hidden')return;const C=CHAT_CFG.ai;
 if(!CHAT.aiNext){CHAT.aiNext=now+(chatOpen?8e3:6e4);return}if(now<CHAT.aiNext)return;
 const H=(CHAT.aiHour=(CHAT.aiHour||[]).filter(t=>now-t<36e5));if(H.length>=C.hourMax){CHAT.aiNext=now+6e4;return}
 const on=chOnline(now),talk=on.filter(i=>chPersona(i).chat>0);if(talk.length<3){CHAT.aiNext=now+3e5;return}
 const recent=[...new Set(chatVisible(now).filter(m=>m.i!=null&&!m.sys&&now-m.t<15*6e4).map(m=>m.i))].filter(i=>on.includes(i)).slice(-3);
 const r=bRng(now>>>0),pool=talk.map(i=>[i,(chPersona(i).chat+.2)*r()]).sort((a,b)=>b[1]-a[1]).map(x=>x[0]);
 const cands=[...new Set([...recent,...pool])].slice(0,C.cands);CHAT.aiBusy=true;H.push(now);
 try{const L=await chAI('scene',cands,{n:chatOpen?'4-8':'3-5'});if(L&&L.length)chAIPost(L,Date.now()+2e3,'scene')}
 finally{CHAT.aiBusy=false;const R=chatOpen?C.scene:C.idle;CHAT.aiNext=Date.now()+R[0]+Math.random()*(R[1]-R[0])}}
// kait aktivitas: hasil tahap/dungeon, top up
if(typeof endBattle==='function'){const _eb=endBattle;endBattle=function(win){const st=B&&B.st;const r=_eb(win);try{if(st&&!st.arena)chatAct(st.dg?`${win?'menyelesaikan':'gagal di'} dungeon ${(DGD[st.dg]||{}).n||st.dg}`:`${win?'menang':'kalah'} di tahap ${st.key}${st.boss?' (bos)':''}${win?' dengan '+(S.stages[st.key]||0)+' bintang':''}`)}catch(e){}return r}}
if(typeof tuDeliver==='function'){const _td=tuDeliver;tuDeliver=function(id){const o=tuState().orders[id];const r=_td(id);try{const p=tuSku(o.sku);chatAct(`top up ${p.card?'Kartu Bulanan':p.gems+' permata'} (Rp${o.price.toLocaleString('id-ID')})`)}catch(e){}return r}}
