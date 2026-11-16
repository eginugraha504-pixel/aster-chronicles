/* =====================================================================
   LATAR ILUSTRASI (dibuat dengan Higgsfield / Nano Banana, lalu diperkecil ke grid piksel game)
   src/img/bg/*.webp -> BGIMG_SRC (disuntik build.py)
     w_<art>  latar battle 240x210      m_<art>  peta petualangan 90x160      key  key art layar judul
   Kalau gambar belum ada / belum termuat -> otomatis pakai latar prosedural makeBG().
   ===================================================================== */
const BGART={};
function bgArt(key){if(typeof BGIMG_SRC==='undefined'||!BGIMG_SRC[key])return null;let im=BGART[key];
 if(!im){im=new Image();im.decoding='async';im.src=BGIMG_SRC[key];BGART[key]=im}return im.complete&&im.naturalWidth?im:null}
const hasBgArt=k=>typeof BGIMG_SRC!=='undefined'&&!!BGIMG_SRC[k];
