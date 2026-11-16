/* =====================================================================
   KOMPATIBILITAS PERANGKAT — terutama Safari iPhone/iPad
   - :active pada tombol (iOS butuh listener touchstart)
   - cegah zoom cubit (iOS mengabaikan user-scalable=no)
   - buka kunci & lanjutkan audio (iOS: AudioContext harus dimulai dari sentuhan,
     dan bisa "interrupted" setelah telepon / pindah aplikasi)
   - simpan saat halaman ditutup (iOS sering tidak memicu unload)
   ===================================================================== */
const IS_IOS=/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
if(IS_IOS)document.documentElement.classList.add('ios');
document.addEventListener('touchstart',()=>{},{passive:true});
['gesturestart','gesturechange','gestureend'].forEach(t=>document.addEventListener(t,e=>e.preventDefault(),{passive:false}));
// iOS: Web Audio ikut dibisukan oleh tombol Silent. Tandai sesi audio sebagai 'playback' (iOS 16.4+)
// supaya suara game tetap keluar seperti aplikasi game/musik. iOS lama: putar <audio> hening berulang sekali.
function audSession(){if(AUD.sess)return;AUD.sess=1;
 try{if(navigator.audioSession){navigator.audioSession.type='playback';return}}catch(e){}
 if(!/iP(hone|ad|od)/.test(navigator.userAgent))return;
 try{const sr=8000,n=800,b=new ArrayBuffer(44+n*2),v=new DataView(b),w=(o,t)=>{for(let i=0;i<t.length;i++)v.setUint8(o+i,t.charCodeAt(i))};
  w(0,'RIFF');v.setUint32(4,36+n*2,true);w(8,'WAVEfmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,sr,true);v.setUint32(28,sr*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);w(36,'data');v.setUint32(40,n*2,true);
  const el=new Audio(URL.createObjectURL(new Blob([b],{type:'audio/wav'})));el.loop=true;el.setAttribute('playsinline','');el.volume=.01;el.play().catch(()=>{AUD.sess=0});AUD.sil=el}catch(e){}}
function audUnlock(){try{AUD.gest=true;audSession();const A=audInit();if(A.state!=='running')A.resume().catch(()=>{});
 if(typeof bgmResume==='function')bgmResume();  // sinkron di dalam sentuhan: wajib untuk iOS
 if(!AUD.unlocked){const b=A.createBuffer(1,1,22050),s=A.createBufferSource();s.buffer=b;s.connect(A.destination);s.start(0);AUD.unlocked=true}}catch(e){}}
['touchend','pointerup','keydown'].forEach(t=>document.addEventListener(t,audUnlock,{passive:true}));
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&AUD.ctx&&AUD.ctx.state!=='running')AUD.ctx.resume().catch(()=>{})});
addEventListener('pagehide',()=>{try{if(S)save()}catch(e){}});
// set sedini mungkin (tidak perlu sentuhan): sesi 'playback' agar suara tidak dibisukan tombol Silent iOS
try{if(navigator.audioSession)navigator.audioSession.type='playback'}catch(e){}
