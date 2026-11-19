/* =====================================================================
   OBROLAN DUNIA — pemain sungguhan (server: bank-worker/src/game.js /api/wc)
   Pesan pemain asli + (bila Mode AI dinyalakan dari Telegram: /ai on) pesan para bot yang sedang online,
   ditulis Claude Haiku 5.5 di server dan disimpan bersama -> semua pemain melihat obrolan yang sama.
   Game yang sedang dibuka mengirim konteks tiap ±30 dtk ('tick'); SERVER yang memutuskan: adegan AI (±100 dtk saat ada
   yang membuka Obrolan Dunia, selain itu ±9 menit), atau bot gabut kirim stiker acak TANPA AI. Balasan AI juga saat pemain
   asli menulis/membalas. Data yang dikirim ke AI dipisah PUBLIK (terlihat semua orang) vs PRIBADI (hanya bot itu sendiri).
   Fitur: balas pesan (ketuk gelembung -> kutipan), stiker chibi hero (data/stickers.js).
   Strip 2 pesan terakhir di beranda + panel obrolan penuh (modal). Gaya: css/chat.css
   ===================================================================== */
ICON.chat=pxIcon(K=>{K.rect(2,3,12,8,'#fff6e0');K.rect(1,4,1,6,'#fff6e0');K.rect(14,4,1,6,'#fff6e0');K.rect(4,11,3,2,'#fff6e0');K.rect(4,13,1,1,'#fff6e0');
 K.rect(4,6,2,2,'#c98a1a');K.rect(7,6,2,2,'#c98a1a');K.rect(10,6,2,2,'#c98a1a')});
const CHQ=['halo semua','gg','wkwk','ada tips?','lagi gacha','pity berapa?','siapa top 1?','bye'];
const WC={list:[],since:0,at:0,busy:false,seen:0,aiNext:0,aiBusy:false};
let chatOpen=false,chatSig='';
const chTime=t=>{const d=new Date(t+BOT_CFG.TZ*36e5);return String(d.getUTCHours()).padStart(2,'0')+':'+String(d.getUTCMinutes()).padStart(2,'0')};
try{WC.seen=+localStorage.getItem('aster_wcseen')||0}catch(e){}
async function wcFetch(){if(WC.busy)return;WC.busy=true;WC.at=Date.now();
 try{const o=await api('/api/wc?since='+WC.since+'&srv='+netSrv());if(o.ok){NET.ai=!!o.ai;if(o.list.length){const have=new Set(WC.list.map(m=>m.id));WC.list=WC.list.concat(o.list.filter(m=>!have.has(m.id))).sort((a,b)=>a.ts-b.ts||a.id-b.id).slice(-150);WC.since=WC.list[WC.list.length-1].ts}}}finally{WC.busy=false}}
// bot pengirim pesan (akun bot di server) -> VIP & potret dari simulasi bot
function wcBot(m){const i=typeof botIdxOf==='function'?botIdxOf(m.uid):-1;return i>=0&&botIn(i)?i:-1}
function wcVip(m){const i=wcBot(m);return i>=0?botState(i).stats.vip:m.vip}
function wcTop(m){const i=wcBot(m);if(i>=0){const s=botState(i);return s.fav||s.team[0]}return m.top}
// gaya mengetik tiap bot (dari persona chat) -> dikirim ke AI supaya tiap orang terasa beda
/* Persona Mode AI (dibuat deterministik per bot, aliran acak sendiri): orang Indonesia biasa yang main game ini.
   Tanpa gaya wibu / emotikon imut berlebihan; ciri khas dipakai SESEKALI, bukan di tiap pesan. */
const WCP={
 ketik:[[24,'huruf kecil, singkatan wajar (yg, gk, bgt, udh, klo), hampir tanpa tanda baca',1],[22,'huruf kecil tapi kata lengkap, kadang pakai titik atau koma',1],
  [14,'rapi: huruf besar di awal kalimat, tanda baca normal, kalimat utuh',0],[14,'super singkat, sering cuma 1-3 kata',1],[12,'santai campur istilah game Inggris (gg, op, meta, nerf, carry, rng), tetap bahasa Indonesia',1],
  [8,'agak panjang kalau ngomong, suka jelasin, huruf kecil',1],[6,'logat Jawa tipis sesekali (wes, ae, rek, cok jangan), huruf kecil',1]],
 tawa:[[30,'wkwk / wkwkwk'],[14,'awokawok'],[14,'haha'],[10,'wkwk tapi jarang'],[12,'jarang ketawa'],[8,'ngakak / anjir ngakak'],[6,'xixixi'],[6,'"lmao"']],
 emo:[[64,'tidak pakai emotikon'],[10,'sesekali :v'],[8,'sesekali xD'],[8,'sesekali T_T kalau sedih'],[6,'sesekali :)'],[4,'sesekali ._.']],
 sifat:[[14,'cuek, jawab seperlunya, sering cuma nyimak'],[12,'suka bantu jawab pertanyaan orang baru, sabar'],[11,'kompetitif, suka bahas CP, arena & peringkat'],[11,'kocak, suka ngeledek teman, receh'],
  [10,'sering ngeluh apes gacha tapi tetap narik'],[10,'analitis, suka bahas tim, elemen & build'],[9,'pemain baru, banyak nanya, kadang salah paham'],[8,'sering cerita hal di luar game (kerja, kuliah, makan, macet)'],
  [8,'santai, main buat iseng, gak terlalu peduli meta'],[7,'agak sombong kalau hoki, suka pamer']],
 hidup:['karyawan kantoran','mahasiswa','kerja shift','freelancer','jaga toko','ojol','guru les','baru lulus nyari kerja','admin online shop','kerja di bengkel','mahasiswa tingkat akhir','ibu rumah tangga'],
 tic:['kadang pakai "anjir"','kadang pakai "btw"','kadang akhiri dengan "sih"','kadang pakai "jir"','kadang pakai "bjir"','kadang pakai "asli"','kadang pakai "njir"','kadang pakai "cuy"','kadang pakai "mantap"','kadang pakai "waduh"','kadang huruf dobel (bangettt)','sering typo kecil','kadang pakai "gas"','kadang pakai "aman"','kadang pakai "parah"','tidak ada kebiasaan khusus','tidak ada kebiasaan khusus','tidak ada kebiasaan khusus'],
 call:[[46,'jarang memanggil, langsung jawab'],[16,'kadang "bang"'],[12,'kadang "bro"'],[8,'kadang "kak"'],[6,'kadang "cuy"'],[6,'kadang "bre"'],[6,'kadang "ngab"']]};
function wcPick(r,L){if(typeof L[0]==='string')return L[Math.floor(r()*L.length)];let x=r()*L.reduce((a,v)=>a+v[0],0);for(const v of L){if(x<v[0])return v;x-=v[0]}return L[0]}
const WCPC={};
function wcPersona(i){if(WCPC[i])return WCPC[i];const r=bRng(bHash(i,777)),k=wcPick(r,WCP.ketik);
 return WCPC[i]={ketik:k[1],lower:!!k[2],tawa:wcPick(r,WCP.tawa)[1],emo:wcPick(r,WCP.emo)[1],sifat:wcPick(r,WCP.sifat)[1],hidup:wcPick(r,WCP.hidup),tic:wcPick(r,WCP.tic),call:wcPick(r,WCP.call)[1]}}
function wcStyle(i){const P=wcPersona(i);return`${P.ketik}; ketawa: ${P.tawa}; ${P.emo}; panggilan: ${P.call}; ${P.tic}; sifat: ${P.sifat}; sehari-hari ${P.hidup}`}
/* ---- Mode AI ---- */
const wcLv3=(i,now)=>botState(i,now).lv>=(FEAT.chat.lv||3);   // aturan sama dengan pemain: menulis setelah Lv 3
// data bot: PUBLIK (bisa dilihat semua: profil/peringkat) vs PRIBADI (hanya dia yang tahu)
function wcDesc(i,now){const c=chCtx(i,now),s=botState(i,now),a=botActivity(i,now),g=s.ev.filter(e=>!e.w&&now-e.t<3*36e5&&e.t<=now).pop();
 return{pub:`Lv ${s.lv}, CP ${fmt(s.cp)}${s.stats.vip?', lencana VIP '+s.stats.vip:''}, tim ${s.team.map(id=>HD[id].name).join('/')}, hero favorit ${c.hero}, tahap terjauh ${c.stage}${c.league?', liga Arena '+c.league:''}${g?`, ${Math.round((now-g.t)/6e4)} menit lalu dapat ★3 ${HD[g.id].name} (muncul di pengumuman)`:''}`,
  priv:`${a?'SEDANG: '+a.t+'; ':''}gacha lagi ${c.luck==='sial'?'apes':c.luck==='hoki'?'hoki':'biasa'}, pity ${c.pity}, ${c.vip>=4?'sultan':c.paid?'kadang top up'+(c.card?' (kartu bulanan)':''):'f2p'}${c.held?', nabung '+c.held+' tarikan':''}, main ${c.days} hari${c.fading?', mulai bosan':''}, ${c.sk==='veteran'?'sudah biasa main gacha sejenis: skip cerita, hafal cara farming (sapu tahap, dungeon, toko emas), suka kasih tips':c.sk==='baru'?(c.days<=7?'pertama kali main game gacha, masih bingung banyak fitur, baca cerita':'awalnya awam gacha, sekarang mulai paham'):'paham dasar game'}${typeof rvIs==='function'&&rvIs(i)&&loggedIn()&&bHash(i,now/36e5|0)%3===0?`, diam-diam bersaing CP dengan ${NET.acct.u} di peringkat (selisih ${fmt(Math.abs(s.cp-teamPow()))}, ${s.cp>teamPow()?'dia di depan':'dia di belakang'}; jarang dibahas)`:''}`}}
// data PUBLIK pemain (yang bisa dilihat orang lain di profil) — tidak ada permata, pity, top up, atau aktivitas
function wcMePub(){const own=Object.keys(S.heroes),s3=own.filter(id=>(S.heroes[id].asc||HD[id].r)>=3).map(id=>HD[id].name),cl=SLIST.filter(x=>S.stages[x.key]).pop(),v=vipOf(S.iap&&S.iap.spent||0);
 return`Lv ${S.lv}, CP ${fmt(teamPow())}, peringkat CP #${chMyRank()}${v?', lencana VIP '+v:''}, tim ${S.team.filter(Boolean).map(id=>HD[id].name).join('/')}, hero ★3: ${s3.join(', ')||'-'}, tahap terjauh ${cl?cl.key:'-'}`}
function wcAiBody(kind,reTo){const now=Date.now();
 const on=wcBotsOn().filter(i=>botUid(i)&&wcLv3(i,now)),t0=on.filter(i=>chPersona(i).chat>0),talk=t0.length>=3?t0:on;
 const tgt=reTo&&wcBot(reTo)>=0&&on.includes(wcBot(reTo))?[wcBot(reTo)]:[];
 const ment=loggedIn()?on.filter(i=>{const L=WC.list[WC.list.length-1];return L&&wcMine(L)&&L.txt.toLowerCase().includes(botName(i).toLowerCase())}):[];
 const recent=[...new Set(WC.list.filter(m=>now-m.ts<15*6e4).map(wcBot).filter(i=>i>=0&&on.includes(i)))].slice(-2);
 const r=bRng(now>>>0),pool=talk.map(i=>[i,(chPersona(i).chat+.2)*r()]).sort((a,b)=>b[1]-a[1]).map(x=>x[0]);
 const rv=kind==='tick'&&typeof rvChatPending==='function'?rvChatPending(now,on):null;
 const idx=[...new Set([...(rv?[rv.i]:[]),...tgt,...ment,...recent,...pool])].slice(0,5);
 const cands=idx.map(i=>{const D=wcDesc(i,now),s=botState(i,now);return{uid:botUid(i),pub:D.pub,priv:D.priv,style:wcStyle(i),lower:wcPersona(i).lower,fav:s.fav||''}});
 const humans=NET.players.filter(p=>p.on&&!(NET.acct&&p.uid===NET.acct.uid)).map(p=>`${p.u} (Lv ${p.lv})`).join(', ');
 return{tok:netTok(),srv:netSrv(),kind,watch:chatOpen&&!!$('#chList'),online:wcOnline(),world:chWorldTxt(now),humans,cands,player:loggedIn()?{name:NET.acct.u,pub:wcMePub()}:null,n:chatOpen?'2-5':'2-4',wb:kind==='tick'&&typeof WB!=='undefined'&&WB.ev?WB.ev:null,rv:rv?{ev:rv.ev,who:botUid(rv.i),k:rv.k}:null}}
async function wcAi(kind,reTo){if(!NET.ai||WC.aiBusy||!botsWarmOk()||document.hidden)return;WC.aiBusy=true;
 try{chatInit();const b=wcAiBody(kind,reTo);if(!b.cands.length){WC.aiNext=Date.now()+6e4;return}const o=await api('/api/wc/ai',b);
  if(kind==='tick'&&b.wb&&WB.ev===b.wb)WB.ev=null;if(b.rv&&o.rv)rvChatDone(b.rv.k);if(kind==='tick')WC.aiNext=Date.now()+Math.min(9e4,Math.max(3e4,o.next||0))+Math.random()*1e4;if(o.ok)setTimeout(wcFetch,2500)}catch(e){WC.aiNext=Date.now()+6e4}finally{WC.aiBusy=false}}
const wcMine=m=>loggedIn()&&m.uid===NET.acct.uid;
const chAt=m=>!wcMine(m)&&loggedIn()&&m.txt.toLowerCase().includes('@'+NET.acct.u.toLowerCase());
const stkImg=k=>typeof STICKER_SRC!=='undefined'&&STICKER_SRC[k]?`<img class="chstk" src="${STICKER_SRC[k]}" alt="">`:'';
const wcShow=t=>{const k=stkOf(t);return k?'['+T('stiker')+']':t};
function chBody(m){const q=m.q?`<span class="chqt"><b>${esc(m.q.u)}</b> ${esc(wcShow(m.q.t))}</span>`:'',k=stkOf(m.txt);
 return`<div class="chbub${k?' stk':''}" data-act="wcRe" data-arg="${m.id}">${q}${k?stkImg(k.k):`<p>${esc(m.txt)}</p>`}</div>`}
function chRow(m,prev){const me=wcMine(m),same=prev&&prev.uid===m.uid&&m.ts-prev.ts<3*6e4&&!m.q,nm=esc(m.u),v=wcVip(m),vip=v?`<i class="vip v${Math.min(7,v)}">VIP${v}</i>`:'';
 const top=wcTop(m),av=top&&HD[top]?`<img class="px" src="${portrait(top)}">`:'';
 if(me)return`<div class="chm self${same?' cont':''}">${same?'':`<div class="chn"><small>${chTime(m.ts)}</small>${vip}<b>${nm}</b></div>`}${chBody(m)}</div>`;
 return`<div class="chm${same?' cont':''}${chAt(m)?' at':''}">${same?'<span class="chav sp"></span>':`<button class="chav" data-act="profView" data-arg="${m.uid}">${av}</button>`}
  <div class="chb">${same?'':`<div class="chn"><button data-act="profView" data-arg="${m.uid}">${vip}<b>${nm}</b></button><small>${chTime(m.ts)}</small></div>`}${chBody(m)}</div></div>`}
function chListHTML(L){if(!L.length)return`<p class="sub chempty">${WC.at?T('Belum ada obrolan. Sapa yang lain!'):T('Memuat obrolan...')}</p>`;return L.map((m,k)=>chRow(m,L[k-1])).join('')}
// jumlah online = bot yang sedang bermain (jadwal sesi bot, sama untuk semua pemain) + pemain asli online (+ kamu)
// daftar bot online memakai botPresence (sama dengan Peringkat & profil; bot yang baru bergabung juga online), disimpan 10 dtk
function wcBotsOn(){const now=Date.now();if(WC.onAt&&now-WC.onAt<1e4)return WC.on;const L=[];try{for(const i of botsIds(now))if(!botHidden(i)&&!botFrozen(i,now)&&botPresence(i,now).online)L.push(i)}catch(e){}WC.onAt=now;return WC.on=L}
function wcOnline(){return wcBotsOn().length+NET.players.filter(p=>p.on&&!(NET.acct&&p.uid===NET.acct.uid)).length+1}
function openChat(){chatOpen=true;wcFetch().then(()=>chatRefresh(true));netPlayers();
 modal(`<button class="btn red mclose" data-act="closeModal">✕</button><h3><img class="ix" src="${ICON.wchat||ICON.chat}" style="width:24px;height:24px"> ${T('Obrolan Dunia')}</h3><div class="chhd"><small><i class="on"></i><b id="chOn">${wcOnline()}</b> ${T('pemain online')}</small></div>
 <div class="chlist" id="chList"></div>
 ${!featOK('chat')?`<div class="chguest">${ic('lock',14)} ${T('Kirim pesan')} · ${featReq('chat')}</div>`:loggedIn()?`<div class="chq">${CHQ.map(q=>`<button data-act="chatQuick" data-arg="${esc(q)}">${esc(q)}</button>`).join('')}</div>
 <div class="chrebar" id="chRe"></div><div class="chstkp" id="chStk">${STICKERS.map(s=>`<button data-act="wcStk" data-arg="${s.k}">${stkImg(s.k)}</button>`).join('')}</div>
 <form class="chin" id="chForm"><button class="chstkb" type="button" data-act="wcStkTog" aria-label="stiker">${stkImg('mira_gg')}</button><input id="chIn" maxlength="120" autocomplete="off" placeholder="${T('Ketik pesan...')}"><button class="btn" type="submit">${T('Kirim')}</button></form>`
 :`<div class="chguest">${T('Masuk dengan akun untuk ikut mengobrol.')} <button class="btn green" data-act="accLink">${T('Daftarkan Akun')}</button></div>`}`);
 $('#modal .mbox').classList.add('chatbox');const f=$('#chForm');
 if(f)f.onsubmit=async e=>{e.preventDefault();const i=$('#chIn'),v=(i.value||'').trim();if(!v)return;i.value='';sfx('tap');
  if(!(await wcSend(v)))i.value=v};
 chatSig='';chatRefresh(true)}
function chatRefresh(force){const box=$('#chList');if(!box){chatOpen=false;return}const L=WC.list,last=L[L.length-1],sig=L.length+':'+(last?last.id:'');
 const nearBottom=box.scrollHeight-box.scrollTop-box.clientHeight<80;
 if(sig!==chatSig||force){chatSig=sig;box.innerHTML=chListHTML(L);if(force||nearBottom)box.scrollTop=box.scrollHeight}
 const on=$('#chOn');if(on)on.textContent=wcOnline();if(last){WC.seen=last.ts;try{localStorage.setItem('aster_wcseen',WC.seen)}catch(e){}}}
// kirim (teks / stiker), dengan balasan bila sedang membalas; bot online lalu bisa menanggapi lewat AI
let wcReTo=null;
async function wcSend(txt){const re=wcReTo;const o=await api('/api/wc',{tok:netTok(),txt,re:re&&re.id});if(!o.ok){toast(o.e==='fast'?T('Pelan-pelan, tunggu sebentar.'):netErr(o.e));return false}
 wcReSet(null);await wcFetch();chatSig='';chatRefresh(true);if(NET.ai)wcAi('reply',re);return true}
function wcReSet(m){wcReTo=m;const b=$('#chRe');if(!b)return;b.classList.toggle('on',!!m);b.innerHTML=m?`<span>↪ ${T('Membalas')} <b>${esc(m.u)}</b>: ${esc(wcShow(m.txt)).slice(0,60)}</span><button data-act="wcReX" aria-label="✕">✕</button>`:'';if(m){const i=$('#chIn');i&&i.focus()}}
/* ---- strip di beranda ---- */
function chatStripHTML(){const L=WC.list.slice(-2),n=WC.list.filter(m=>m.ts>WC.seen&&!wcMine(m)).length;
 return`<img class="ix" src="${ICON.chat}"><span class="chsl">${L.length?L.map(m=>`<span><b>${esc(m.u)}:</b> ${esc(wcShow(m.txt))}</span>`).join(''):`<span>${T('Obrolan Dunia')}</span>`}</span>${n?`<i class="dot n">${n>99?'99+':n}</i>`:''}`}
function chatTick(){const now=Date.now(),L=document.getElementById('login');if(L&&L.classList.contains('on'))return;
 if(NET.ai&&now>WC.aiNext&&!WC.aiBusy){if(!WC.aiNext)WC.aiNext=now+5e3+Math.random()*1e4;else wcAi('tick')}
 if(chatOpen&&$('#chList')){if(now-WC.at>4000)wcFetch().then(()=>chatRefresh());}
 else{chatOpen=false;if(now-WC.at>(NET.ai?2e4:3e4)||(NET.wc>WC.since&&now-WC.at>5e3))wcFetch().then(()=>{const m=WC.list.filter(x=>x.ts>WC.seen&&chAt(x)).pop();if(m&&m.id>(WC.atSeen||0)){WC.atSeen=m.id;toast(T('{n} menyebutmu di obrolan',{n:m.u}))}})}
 const st=$('#hchat');if(st)st.innerHTML=chatStripHTML()}
setTimeout(()=>setInterval(chatTick,1500),3500);
Object.assign(ACT,{chat:()=>openChat(),chatQuick:q=>{const i=$('#chIn');if(i){i.value=q;i.focus()}},
 wcRe:id=>{if(!$('#chForm'))return;const m=WC.list.find(x=>x.id===+id);if(m)wcReSet(m)},wcReX:()=>wcReSet(null),
 wcStkTog:()=>{const p=$('#chStk');p&&p.classList.toggle('on')},
 wcStk:async k=>{const p=$('#chStk');p&&p.classList.remove('on');sfx('tap');await wcSend(':stk:'+k+':')}});
