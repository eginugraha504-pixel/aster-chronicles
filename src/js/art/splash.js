/* =====================================================================
   SPLASH ART — ilustrasi anime besar (bukan piksel).
   File: src/img/splash/<heroId>.webp (latar transparan). build.py
   menyisipkannya sebagai SPLASH_SRC. Hero tanpa file tetap memakai sprite.
   SPLASH_FOCUS = titik wajah [x%, y%] dipakai untuk crop cut-in skill & banner.
   ===================================================================== */
const SPLASH_FOCUS={seraphine:[52,10],sakuya:[54,17],raika:[52,16],mira:[52,23],noa:[53,19],pia:[44,23],rin:[51,16],vela:[55,15],bruna:[55,11],nami:[42,18],kuro:[66,21],lumi:[48,12],marisa:[52,23],hilde:[59,22]};
// posisi wajah di banner pick-up (% lebar banner). Geser ke kanan bila rambut/aksesori lebar menabrak teks.
const SPLASH_BANNER_X={};
function splash(id){return (typeof SPLASH_SRC!=='undefined'&&SPLASH_SRC[id])||null}
function splashFocus(id){return SPLASH_FOCUS[id]||[50,22]}
// gambar splash dengan animasi "napas" ala Live2D (lapisan luar = goyang, dalam = napas)
function splashHTML(id,cls='',st=''){const u=splash(id);if(!u)return'';return`<span class="spw ${cls}"${st?` style="${st}"`:''}${typeof hasRig==='function'&&hasRig(id)?` data-live="${id}"`:''}><img class="spl" src="${u}" alt="" decoding="async" draggable="false"></span>`}
