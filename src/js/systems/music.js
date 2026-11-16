/* =====================================================================
   MUSIC — musik latar (BGM)
   ---------------------------------------------------------------------
   Lagu ditanam oleh tools/build.py dari src/audio/<kunci>.mp3 -> MUSIC_SRC.
     login : "Starbound Prologue" — layar judul/login (loop), memudar saat masuk game.
   Diputar lewat <audio> + Web Audio (MediaElementSource -> gain) supaya volume & fade
   tetap berfungsi di iOS (volume <audio> di iOS tidak bisa diubah langsung).
   iOS/Chrome baru mengizinkan suara setelah sentuhan pertama: kalau belum boleh,
   permintaan disimpan (BGM.want) dan diputar oleh audUnlock() di systems/platform.js.
   Pengaturan: S.music (true/false, bawaan hidup).
   ===================================================================== */
const BGM={el:null,key:null,gain:null,want:null,tm:0};
const bgmOn=()=>typeof S!=='undefined'&&S&&S.music!==false;
const BGM_VOL=.55;
function bgmEl(k){if(BGM.el&&BGM.key===k)return BGM.el;
 if(BGM.el){try{BGM.el.pause()}catch(e){}}
 const bin=atob(MUSIC_SRC[k].split(',')[1]),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);
 const el=new Audio(URL.createObjectURL(new Blob([u],{type:'audio/mpeg'})));el.loop=true;el.preload='auto';el.setAttribute('playsinline','');
 BGM.el=el;BGM.key=k;BGM.gain=null;
 try{const A=audInit(),src=A.createMediaElementSource(el),g=A.createGain();g.gain.value=0;src.connect(g);g.connect(A.destination);BGM.gain=g}catch(e){el.volume=0}
 return el}
function bgmFade(to,sec){clearTimeout(BGM.tm);if(BGM.gain){const A=AUD.ctx,g=BGM.gain.gain;g.cancelScheduledValues(A.currentTime);g.setValueAtTime(g.value,A.currentTime);g.linearRampToValueAtTime(to,A.currentTime+sec)}
 else if(BGM.el){try{BGM.el.volume=to}catch(e){}}}
function bgmPlay(k){BGM.want=k;if(!bgmOn()||typeof MUSIC_SRC==='undefined'||!MUSIC_SRC[k])return;
 try{const A=audInit();if(A.state!=='running')return;  // tunggu sentuhan pertama (audUnlock memanggil lagi)
  const el=bgmEl(k);if(!el.paused){bgmFade(BGM_VOL,.8);return}
  el.play().then(()=>bgmFade(BGM_VOL,1.6)).catch(()=>{})}catch(e){}}
function bgmStop(sec=1.2){BGM.want=null;if(!BGM.el||BGM.el.paused)return;bgmFade(0,sec);const el=BGM.el;BGM.tm=setTimeout(()=>{try{el.pause()}catch(e){}},sec*1000+80)}
// dipanggil audUnlock setelah sentuhan: lanjutkan musik yang tertunda
function bgmResume(){if(BGM.want&&(!BGM.el||BGM.el.paused))bgmPlay(BGM.want)}
document.addEventListener('visibilitychange',()=>{if(!BGM.el)return;if(document.hidden){if(!BGM.el.paused)BGM.el.pause()}else if(BGM.want)bgmPlay(BGM.want)});
