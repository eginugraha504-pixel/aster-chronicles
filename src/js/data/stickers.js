/* =====================================================================
   STIKER OBROLAN — chibi hero (Higgsfield nano_banana_pro, dipotong art_src/sticker_cut.py)
   Gambar: src/img/stickers/<k>.webp -> STICKER_SRC. Pesan stiker = teks ":stk:<k>:".
   n = arti stiker (dipakai AI untuk memahami / memilih stiker). Server membaca daftar ini lewat botcfg.js.
   ===================================================================== */
const STICKERS=[
 {k:'mira_gg',h:'mira',n:'Mira kedip jempol "GG!"'},
 {k:'sakuya_wkwk',h:'sakuya',n:'Sakuya ketawa ngakak "WKWK"'},
 {k:'pia_cry',h:'pia',n:'Pia nangis kejer'},
 {k:'noa_zzz',h:'noa',n:'Noa nguap ngantuk zzz'},
 {k:'raika_angry',h:'raika',n:'Raika ngambek marah'},
 {k:'nami_love',h:'nami',n:'Nami bikin hati pakai tangan'},
 {k:'kuro_huh',h:'kuro',n:'Kuro bingung "?"'},
 {k:'lumi_yay',h:'lumi',n:'Lumi tiup terompet pesta "YAY"'},
 {k:'celestine_pray',h:'celestine',n:'Celestine berdoa "PLS ★3"'},
 {k:'hilde_flex',h:'hilde',n:'Hilde pamer otot'},
 {k:'coppelia_shy',h:'coppelia',n:'Coppelia malu-malu'},
 {k:'lilith_smug',h:'lilith',n:'Lilith sombong "hmph"'}];
const STK_RE=/^:stk:([a-z_]+):$/;
const stkOf=t=>{const m=STK_RE.exec(String(t||''));return m&&STICKERS.find(s=>s.k===m[1])||null};
