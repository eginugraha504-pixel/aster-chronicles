/* =====================================================================
   IKON ILUSTRASI (lembar ikon Higgsfield -> dipotong & diperkecil ke grid 32×32, disimpan 64×64)
   src/img/icons/<kunci>.webp -> ICONIMG_SRC (disuntik build.py)
     <nama ICON>  mis. home, gem, rank      el_<elemen>  mis. el_api
     w_<id senjata>                         g_<id perlengkapan>
   Ikon yang tidak punya gambar tetap memakai versi kode (pxIcon / weaponIcon / gearIcon).
   File ini dimuat SETELAH semua ikon kode dibuat (termasuk ICON.rank di ui/leaderboard.js).
   ===================================================================== */
(function(){if(typeof ICONIMG_SRC==='undefined')return;const I=ICONIMG_SRC;
 for(const k in ICON)if(k!=='el'&&I[k])ICON[k]=I[k];
 for(const k in ICON.el)if(I['el_'+k])ICON.el[k]=I['el_'+k];
 for(const k in I)if(!k.startsWith('w_')&&!k.startsWith('g_')&&!k.startsWith('el_')&&!(k in ICON))ICON[k]=I[k];
 for(const w of WEAPONS)if(I['w_'+w.id])WICON[w.id]={c:null,url:I['w_'+w.id]};
 for(const g of GEAR)if(I['g_'+g.id])GICON[g.id]={c:null,url:I['g_'+g.id]};
})();
