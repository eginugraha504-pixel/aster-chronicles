/* =====================================================================
   MUSIC — musik latar (BGM)
   ---------------------------------------------------------------------
   Lagu: src/audio/<kunci>.mp3 -> disalin build.py ke dist/audio/ (MUSIC_SRC berisi path relatif, bukan data URI).
     login : layar judul/login setelah splash studio (loop), memudar saat masuk game.
     game  : menu/beranda di dalam game (loop), sedikit lebih pelan. Lagu baru 18 Nov 2026 (Suno, dari Egi).
   iOS hanya mengizinkan <audio> diputar lewat kode kalau elemen itu SUDAH pernah
   diputar di dalam sebuah sentuhan. Karena itu dipakai SATU elemen <audio> bersama
   untuk semua lagu, dan bgmPrime() "memancingnya" (putar tanpa suara lalu jeda) pada
   sentuhan pertama mana pun — termasuk saat splash studio (dipanggil audUnlock()).
   Volume & fade lewat Web Audio (MediaElementSource -> gain) karena volume <audio>
   tidak bisa diubah di iOS. Permintaan sebelum sentuhan pertama disimpan di BGM.want.
   Pengaturan: S.music (true/false, bawaan hidup).
   ===================================================================== */
const BGM={el:null,key:null,gain:null,an:null,want:null,tm:0,primed:false,url:{},tok:0,h:{t:-1,stall:0,mute:0,kick:0,ok:0}};
const bgmOn=()=>typeof S==='undefined'||!S||S.music!==false;
const BGM_VOL={login:.55,game:.4,win:.6};  // volume per lagu (bt_* / st_* lihat bgmV)
/* OST tambahan (18 Nov 2026): bt_w1..bt_w8 (battle per dunia), bt_boss (tahap x-5), bt_final (8-5), bt_dungeon, bt_arena,
   win (jingle menang, tidak diulang), st_prolog/hangat/tegang/sedih/misteri/harapan/kehampaan (cerita, lihat STORY_BGM).
   Lagu yang belum ada otomatis diganti 'game'. Pergantian lagu: pudar keluar 0,45 dtk lalu lagu baru pudar masuk. */
const bgmV=k=>BGM_VOL[k]??(k.startsWith('bt_')?.45:k.startsWith('st_')?.42:.5);
const bgmBattle=st=>st.arena?'bt_arena':st.dg?'bt_dungeon':st.key==='8-5'?'bt_final':st.boss?'bt_boss':'bt_w'+((st.wi||0)+1);
function bgmUrl(k){if(BGM.url[k])return BGM.url[k];
 if(!MUSIC_SRC[k].startsWith('data:'))return BGM.url[k]=MUSIC_SRC[k];   // file terpisah (audio/<kunci>.mp3)
 const bin=atob(MUSIC_SRC[k].split(',')[1]),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);
 return BGM.url[k]=URL.createObjectURL(new Blob([u],{type:'audio/mpeg'}))}
function bgmElem(){if(BGM.el)return BGM.el;const el=new Audio();el.loop=true;el.preload='auto';el.setAttribute('playsinline','');BGM.el=el;
 try{const A=audInit(),src=A.createMediaElementSource(el),an=A.createAnalyser(),g=A.createGain();an.fftSize=256;g.gain.value=0;src.connect(an);an.connect(g);g.connect(A.destination);BGM.gain=g;BGM.an=an}catch(e){}
 el.addEventListener('error',()=>{BGM.h.stall=9});
 return el}
/* Penjaga kesehatan BGM (dipanggil tiap 3 dtk oleh audWake): di iPhone/Android musik kadang "jalan tapi bisu"
   (MediaElementSource berhenti mengeluarkan suara setelah interupsi / ganti lagu) atau macet saat memuat.
   Deteksi: waktu lagu tidak maju (macet) atau sinyal sebelum volume benar-benar nol (bisu) beberapa kali berturut-turut.
   Pemulihan 1: jeda lalu putar lagi. Pemulihan 2 (masih bisu): buat elemen <audio> baru di sentuhan berikutnya. */
function bgmHealth(){const el=BGM.el,h=BGM.h;if(!el||!BGM.want||!BGM.primed||!bgmOn()||document.hidden||BGM.key!==BGM.want||BGM.want==='win'||el.paused){h.stall=h.mute=0;h.t=-1;return}
 const t=el.currentTime;if(t===h.t)h.stall++;else h.stall=0;h.t=t;
 if(BGM.an&&AUD.ctx&&AUD.ctx.state==='running'&&h.stall===0&&t>1.5){const d=new Float32Array(BGM.an.fftSize);BGM.an.getFloatTimeDomainData(d);let m=0;for(const v of d)m=Math.max(m,Math.abs(v));h.mute=m<1e-4?h.mute+1:0}else h.mute=0;
 if(!h.stall&&!h.mute&&++h.ok>20){h.ok=0;h.kick=0}
 if(h.stall>=2||h.mute>=3){h.ok=0;h.stall=h.mute=0;h.t=-1;h.kick++;
  if(h.kick>=2&&BGM.gain){BGM.rebuild=true;return}   // perlu sentuhan untuk elemen baru (iOS)
  try{el.pause();if(el.readyState<2)el.load()}catch(e){}bgmPlay(BGM.want)}}
// dipanggil di dalam sentuhan bila pemulihan biasa gagal: ganti elemen <audio> dengan yang baru
function bgmRebuild(){if(!BGM.rebuild)return;BGM.rebuild=false;BGM.h.kick=0;const k=BGM.want;try{BGM.el.pause();BGM.el.removeAttribute('src');BGM.el.load()}catch(e){}
 try{BGM.gain&&BGM.gain.disconnect()}catch(e){}BGM.el=null;BGM.gain=null;BGM.an=null;BGM.key=null;if(k&&bgmOn()){const el=bgmElem();el.src=bgmUrl(k);BGM.key=k;el.play().then(()=>bgmPlay(k)).catch(()=>{})}}
// panggil DI DALAM sentuhan: membuka izin putar elemen <audio> di iOS
function bgmPrime(){if(BGM.primed||typeof MUSIC_SRC==='undefined')return;const k=BGM.want||'login';if(!MUSIC_SRC[k])return;
 const el=bgmElem();if(BGM.key!==k){el.src=bgmUrl(k);BGM.key=k}
 if(BGM.gain)BGM.gain.gain.value=0;else el.volume=0;
 const p=el.play();BGM.primed=true;
 if(p&&p.then)p.then(()=>{if(!BGM.want||!bgmOn())el.pause();else bgmPlay(BGM.want)}).catch(()=>{BGM.primed=false})}
function bgmFade(to,sec){clearTimeout(BGM.tm);if(BGM.gain&&AUD.ctx){const A=AUD.ctx,g=BGM.gain.gain;g.cancelScheduledValues(A.currentTime);g.setValueAtTime(g.value,A.currentTime);g.linearRampToValueAtTime(to,A.currentTime+sec)}
 else if(BGM.el){try{BGM.el.volume=to}catch(e){}}}
function bgmPlay(k){if(typeof MUSIC_SRC!=='undefined'&&!MUSIC_SRC[k]&&k!=='login')k='game';
 BGM.want=k;if(!bgmOn()||typeof MUSIC_SRC==='undefined'||!MUSIC_SRC[k]||!BGM.primed)return;  // belum ada sentuhan: tunggu bgmPrime
 try{const A=audInit();if(A.state!=='running')A.resume().catch(()=>{});
  const el=bgmElem(),tok=++BGM.tok;
  const go=()=>{if(tok!==BGM.tok)return;if(BGM.gain)BGM.gain.gain.value=0;el.src=bgmUrl(k);BGM.key=k;el.loop=k!=='win';
   el.onended=()=>{if(BGM.key==='win'&&BGM.want==='win')BGM.want=null};
   el.play().then(()=>{if(tok===BGM.tok)bgmFade(bgmV(k),k==='win'?.1:1.4)}).catch(()=>{})};
  BGM.h.stall=BGM.h.mute=0;BGM.h.t=-1;
  if(BGM.key!==k){if(!el.paused&&BGM.key){bgmFade(0,.45);setTimeout(go,480)}else go()}
  else if(!el.paused)bgmFade(bgmV(k),.8);
  else el.play().then(()=>{if(tok===BGM.tok)bgmFade(bgmV(k),1.6)}).catch(()=>{})}catch(e){}}
function bgmStop(sec=1.2){BGM.want=null;if(!BGM.el||BGM.el.paused)return;bgmFade(0,sec);const el=BGM.el;BGM.tm=setTimeout(()=>{if(!BGM.want)try{el.pause()}catch(e){}},sec*1000+80)}
// dipanggil audUnlock setelah sentuhan: pancing elemen lalu lanjutkan musik yang tertunda
function bgmResume(){if(!BGM.primed){bgmPrime();return}if(BGM.want&&(!BGM.el||BGM.el.paused))bgmPlay(BGM.want)}
document.addEventListener('visibilitychange',()=>{if(!BGM.el)return;if(document.hidden){if(!BGM.el.paused)BGM.el.pause()}else if(BGM.want)bgmPlay(BGM.want)});
// musik sesuai layar saat ini (dipakai tombol Musik di Pengaturan)
const bgmScene=()=>{const L=document.getElementById('login');return L&&L.classList.contains('on')?'login':'game'};
