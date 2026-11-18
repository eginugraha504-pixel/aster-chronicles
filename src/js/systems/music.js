/* =====================================================================
   MUSIC — musik latar (BGM)
   ---------------------------------------------------------------------
   Lagu: src/audio/<kunci>.mp3 -> disalin build.py ke dist/audio/ (MUSIC_SRC berisi path relatif, bukan data URI).
     login : "Eternal Sky" — layar judul/login setelah splash studio (loop), memudar saat masuk game.
     game  : "Starbound Prologue" — di dalam game setelah login (loop), sedikit lebih pelan.
   iOS hanya mengizinkan <audio> diputar lewat kode kalau elemen itu SUDAH pernah
   diputar di dalam sebuah sentuhan. Karena itu dipakai SATU elemen <audio> bersama
   untuk semua lagu, dan bgmPrime() "memancingnya" (putar tanpa suara lalu jeda) pada
   sentuhan pertama mana pun — termasuk saat splash studio (dipanggil audUnlock()).
   Volume & fade lewat Web Audio (MediaElementSource -> gain) karena volume <audio>
   tidak bisa diubah di iOS. Permintaan sebelum sentuhan pertama disimpan di BGM.want.
   Pengaturan: S.music (true/false, bawaan hidup).
   ===================================================================== */
const BGM={el:null,key:null,gain:null,want:null,tm:0,primed:false,url:{}};
const bgmOn=()=>typeof S==='undefined'||!S||S.music!==false;
const BGM_VOL={login:.55,game:.4};  // volume per lagu
const bgmV=k=>BGM_VOL[k]??.5;
function bgmUrl(k){if(BGM.url[k])return BGM.url[k];
 if(!MUSIC_SRC[k].startsWith('data:'))return BGM.url[k]=MUSIC_SRC[k];   // file terpisah (audio/<kunci>.mp3)
 const bin=atob(MUSIC_SRC[k].split(',')[1]),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);
 return BGM.url[k]=URL.createObjectURL(new Blob([u],{type:'audio/mpeg'}))}
function bgmElem(){if(BGM.el)return BGM.el;const el=new Audio();el.loop=true;el.preload='auto';el.setAttribute('playsinline','');BGM.el=el;
 try{const A=audInit(),src=A.createMediaElementSource(el),g=A.createGain();g.gain.value=0;src.connect(g);g.connect(A.destination);BGM.gain=g}catch(e){}
 return el}
// panggil DI DALAM sentuhan: membuka izin putar elemen <audio> di iOS
function bgmPrime(){if(BGM.primed||typeof MUSIC_SRC==='undefined')return;const k=BGM.want||'login';if(!MUSIC_SRC[k])return;
 const el=bgmElem();if(BGM.key!==k){el.src=bgmUrl(k);BGM.key=k}
 if(BGM.gain)BGM.gain.gain.value=0;else el.volume=0;
 const p=el.play();BGM.primed=true;
 if(p&&p.then)p.then(()=>{if(!BGM.want||!bgmOn())el.pause();else bgmPlay(BGM.want)}).catch(()=>{BGM.primed=false})}
function bgmFade(to,sec){clearTimeout(BGM.tm);if(BGM.gain&&AUD.ctx){const A=AUD.ctx,g=BGM.gain.gain;g.cancelScheduledValues(A.currentTime);g.setValueAtTime(g.value,A.currentTime);g.linearRampToValueAtTime(to,A.currentTime+sec)}
 else if(BGM.el){try{BGM.el.volume=to}catch(e){}}}
function bgmPlay(k){BGM.want=k;if(!bgmOn()||typeof MUSIC_SRC==='undefined'||!MUSIC_SRC[k]||!BGM.primed)return;  // belum ada sentuhan: tunggu bgmPrime
 try{const A=audInit();if(A.state!=='running')A.resume().catch(()=>{});
  const el=bgmElem();
  if(BGM.key!==k){if(BGM.gain)BGM.gain.gain.value=0;el.src=bgmUrl(k);BGM.key=k}
  else if(!el.paused){bgmFade(bgmV(k),.8);return}
  el.play().then(()=>bgmFade(bgmV(k),1.6)).catch(()=>{})}catch(e){}}
function bgmStop(sec=1.2){BGM.want=null;if(!BGM.el||BGM.el.paused)return;bgmFade(0,sec);const el=BGM.el;BGM.tm=setTimeout(()=>{if(!BGM.want)try{el.pause()}catch(e){}},sec*1000+80)}
// dipanggil audUnlock setelah sentuhan: pancing elemen lalu lanjutkan musik yang tertunda
function bgmResume(){if(!BGM.primed){bgmPrime();return}if(BGM.want&&(!BGM.el||BGM.el.paused))bgmPlay(BGM.want)}
document.addEventListener('visibilitychange',()=>{if(!BGM.el)return;if(document.hidden){if(!BGM.el.paused)BGM.el.pause()}else if(BGM.want)bgmPlay(BGM.want)});
// musik sesuai layar saat ini (dipakai tombol Musik di Pengaturan)
const bgmScene=()=>{const L=document.getElementById('login');return L&&L.classList.contains('on')?'login':'game'};
