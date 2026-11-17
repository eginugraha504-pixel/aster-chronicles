/* =====================================================================
   MATERIAL — didapat dari Dungeon, dipakai untuk level & Limit Break senjata
   exp: EXP senjata per buah (bijih). icon: kunci ICON.
   ===================================================================== */
const MATS=[
 {id:'ore1',n:'Bijih Tempa Kecil',r:1,exp:100,icon:'ore1',desc:'Bijih besi biasa. +100 EXP senjata.'},
 {id:'ore2',n:'Bijih Tempa Biru',r:2,exp:400,icon:'ore2',desc:'Bijih berisi kristal biru. +400 EXP senjata.'},
 {id:'ore3',n:'Bijih Tempa Ungu',r:3,exp:1500,icon:'ore3',desc:'Bijih langka yang berpendar. +1.500 EXP senjata.'},
 {id:'gem1',n:'Serpihan Bintang',r:1,icon:'gem1',desc:'Material Limit Break senjata.'},
 {id:'gem2',n:'Kristal Bintang',r:2,icon:'gem2',desc:'Material Limit Break senjata tingkat menengah.'},
 {id:'gem3',n:'Inti Bintang',r:3,icon:'gem3',desc:'Material Limit Break senjata tingkat tinggi.'},
 // ---- Kebangkitan ★4–★6 (data/ascend.js) ----
 {id:'asc1',n:'Kristal Kebangkitan',r:4,icon:'asc1',desc:'Membangkitkan hero, senjata, dan perlengkapan sampai ★5. Dari Menara Kebangkitan.'},
 {id:'asc2',n:'Inti Surgawi',r:5,icon:'asc2',desc:'Material Kebangkitan ★5 dan ★6. Menara Kebangkitan tingkat II ke atas.'},
 {id:'asc3',n:'Air Mata Dewi',r:6,icon:'asc3',desc:'Material paling langka, syarat Kebangkitan ★6. Menara Kebangkitan tingkat IV ke atas.'}
];
const MD2={};MATS.forEach(m=>MD2[m.id]=m);
// Lencana Ksatria (mata uang S.badge) boleh muncul di tabel drop/hadiah seperti material
MD2.badge={id:'badge',n:'Lencana Ksatria',r:4,icon:'badge',desc:'Mata uang Toko Lencana & syarat Kebangkitan hero.'};
