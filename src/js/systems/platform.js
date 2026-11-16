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
function audUnlock(){try{if(typeof S==='undefined'||!S)return;const A=audInit();if(A.state!=='running')A.resume().catch(()=>{});
 if(!AUD.unlocked){const b=A.createBuffer(1,1,22050),s=A.createBufferSource();s.buffer=b;s.connect(A.destination);s.start(0);AUD.unlocked=true}}catch(e){}}
['touchend','pointerup','keydown'].forEach(t=>document.addEventListener(t,audUnlock,{passive:true}));
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&AUD.ctx&&AUD.ctx.state!=='running')AUD.ctx.resume().catch(()=>{})});
addEventListener('pagehide',()=>{try{if(S)save()}catch(e){}});
