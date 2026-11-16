/* ================= LOOP ================= */
let last=performance.now();
function loop(n){const dt=Math.min(.05,(n-last)/1000);last=n;if(B){tickBattle(dt);if(B)drawBattle()}else if(lobby&&tab==='home')drawLobby(dt);requestAnimationFrame(loop)}
// dipanggil dari layar loading (ui/boot.js): data & aset dunia
function initCore(){checkDaily();Object.keys(ICON.el).forEach(k=>{const im=new Image();im.src=ICON.el[k];elImg[k]=im});BG.town=makeBG('town',160,120)}
// dipanggil setelah login: tampilkan game
function initUI(){render();welcome();requestAnimationFrame(loop);
 setInterval(()=>{if(!$('#modal').classList.contains('on')||true)updateTop()},1000);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)save()})}
bootStart();
