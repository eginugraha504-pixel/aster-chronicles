/* ================= LOOP ================= */
let last=performance.now();
// loop utama: satu error di satu frame tidak boleh menghentikan game (dulu bisa membuat layar membeku)
function loop(n){requestAnimationFrame(loop);const dt=Math.min(.05,(n-last)/1000);last=n;try{if(B){tickBattle(dt);if(B)drawBattle()}else if(lobby&&tab==='home')drawLobby(dt)}catch(e){console.error(e);LOOP_ERR=(LOOP_ERR||0)+1}}
let LOOP_ERR=0;
// dipanggil dari layar loading (ui/boot.js): data & aset dunia
function initCore(){checkDaily();Object.keys(ICON.el).forEach(k=>{const im=new Image();im.src=ICON.el[k];elImg[k]=im});BG.town=makeBG('town',160,120)}
// dipanggil setelah login: tampilkan game
function initUI(){render();welcome();requestAnimationFrame(loop);
 setInterval(()=>{if(!$('#modal').classList.contains('on')||true)updateTop()},1000);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)save()})}
bootStart();
