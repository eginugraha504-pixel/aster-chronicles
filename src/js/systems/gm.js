/* =====================================================================
   AKUN GM (Game Master) — untuk testing semua fitur tanpa batas
   Status GM diatur pemilik lewat Telegram (/gm UID|username, atau tombol 🛡 di kartu akun) dan
   dikirim server lewat /api/acc/login, /api/load, /api/ping (NET.acct.gm). Hanya akun terdaftar.
   Opsi (S.gmo, bawaan semua hidup):
     inf : sumber daya tak terbatas — stamina, permata, emas, tiket, lencana, material diisi penuh tiap detik;
           tiket Dungeon & Arena tidak berkurang
     unl : semua fitur & semua tahap terbuka (tanpa syarat level/tahap)
   Aksi sekali tekan ada di Panel GM (ui/gm.js). GM tidak tampil di Peringkat pemain lain (server).
   ===================================================================== */
const isGM=()=>typeof loggedIn==='function'&&loggedIn()&&!!NET.acct.gm;
const gmOpt=k=>isGM()&&!!S&&!(S.gmo&&S.gmo[k]===false);
function gmTick(){if(!S||!isGM())return;
 if(gmOpt('inf')){S.stam=Math.max(S.stam||0,999);S.gems=Math.max(S.gems||0,999999);S.gold=Math.max(S.gold||0,99999999);S.tixH=Math.max(S.tixH||0,999);S.tixW=Math.max(S.tixW||0,999);S.badge=Math.max(S.badge||0,99999);
  if(!S.mats)S.mats={};MATS.forEach(m=>S.mats[m.id]=Math.max(S.mats[m.id]||0,9999));
  if(S.daily&&S.daily.c)for(const k of Object.keys(S.daily.c))if(k.startsWith('dg_'))S.daily.c[k]=0;
  if(S.arena&&typeof ARENA_CFG!=='undefined')S.arena.tix=Math.max(S.arena.tix||0,ARENA_CFG.tix)}
 if(gmOpt('unl')&&Array.isArray(S.unl))for(const k of Object.keys(FEAT))if(!S.unl.includes(k))S.unl.push(k)}
setInterval(()=>{try{gmTick()}catch(e){}},1000);
