/* =====================================================================
   KEBANGKITAN (Ascension) ★4 · ★5 · ★6 — hero, senjata, perlengkapan
   Mesin: systems/ascend.js · tampilan: ui/ascend.js · bingkai: css/frames.css
   ---------------------------------------------------------------------
   - Bintang efektif disimpan di objek milikmu (.asc). Tanpa .asc = bintang dasar dari data.
   - Semua bintang bisa naik satu per satu sampai ★6 (hero ★1 pun bisa, lewat ★2 dan ★3 dulu).
   - Syarat naik: level sudah mentok di bintang sekarang (+ Limit Break senjata maks) + material + emas.
   - Target desain: tim terbaik yang semuanya ★6 & maks ≈ 3.000.000 CP (dicek tools/cpmax.mjs).
   - Material Kebangkitan dari Menara Kebangkitan (5 kali/hari), hadiah Arena, peleburan ★3+.
   ===================================================================== */
const ASC={
 maxStar:6,
 // ---- HERO ----
 heroRar:[0,1,1.35,1.75,5.5,14,29.6],     // pengali stat per bintang efektif (menggantikan RAR)
 heroCap:[0,30,40,50,80,120,160],         // level maks per bintang (+2 per Limit Break)
 // ---- SENJATA ----
 wMul:[0,1,1,1,3.5,10.2,23.6],            // pengali ATK senjata per bintang efektif (≥★4)
 wAtkR:[0,26,53,104],                     // ATK rata-rata per bintang dasar: senjata ★1/★2 yang dinaikkan mengejar standar bintang barunya
 wCapAdd:[0,0,0,0,20,40,60],              // tambahan level maks senjata per bintang (di atas batas Limit Break)
 wExpK:[0,1,1.4,1.8,2.2,2.6,3],           // pengali EXP level senjata per bintang
 // ---- PERLENGKAPAN ----
 gMul:[0,1,1,1,3.75,11.4,27.1],           // pengali stat Pelindung/Aksesori per bintang (≥★4)
 gStatR:[0,1,1.75,2.6],                   // kekuatan rata-rata per bintang dasar (relatif ★1)
 gCap:[0,5,10,15,20,25,30],               // enhance maks per bintang
 gUpGold:[0,800,1500,2500,4000,6000,9000],
 critStar:.15,                            // Crit naik 15% per bintang di atas ★3 (tidak ikut pengali besar)
 // ---- BIAYA naik ke bintang N (index = bintang tujuan) ----
 cost:{
  hero:{2:{asc1:10,badge:10,gold:300000},3:{asc1:25,badge:30,gold:800000},4:{asc1:60,badge:60,gold:2000000},
        5:{asc1:100,asc2:40,badge:120,gold:6000000},6:{asc2:100,asc3:30,badge:250,gold:15000000}},
  wpn: {2:{asc1:5,gold:150000},3:{asc1:15,gold:400000},4:{asc1:40,ore3:20,gold:1500000},
        5:{asc1:80,asc2:25,ore3:40,gold:4000000},6:{asc2:70,asc3:20,ore3:60,gold:10000000}},
  gear:{2:{asc1:4,gold:100000},3:{asc1:10,gold:300000},4:{asc1:30,ore3:12,gold:1000000},
        5:{asc1:60,asc2:18,ore3:25,gold:3000000},6:{asc2:50,asc3:14,ore3:40,gold:8000000}},
 },
 // ---- sumber material ----
 tower:{daily:5},                         // Menara Kebangkitan: masuk + sapu maks 5×/hari (reset 00:00 WIB)
 smelt3:{asc1:1},                         // tambahan hasil lebur salinan ★3
};
