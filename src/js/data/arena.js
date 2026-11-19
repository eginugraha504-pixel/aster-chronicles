/* =====================================================================
   ARENA PvP — semua angka penyetel ada di sini
   (mesin: systems/arena.js, tampilan: ui/arena.js + css/arena.css)
   ---------------------------------------------------------------------
   - Lawan = pemain bot dari Peringkat (tim & CP asli mereka, data/bots.js).
   - 5 tiket per hari (reset 00:00 WIB). Musim = 1 minggu (Senin 00:00 WIB).
   - Poin Arena memakai rumus Elo: menang melawan yang lebih kuat = poin lebih besar.
   - Hadiah harian (sesuai liga, bila bertarung hari itu) & mingguan (liga akhir musim) dikirim lewat Kotak Surat.
   ===================================================================== */
const ARENA_CFG={
 tix:5,                 // tiket per hari
 start:1000,            // poin awal
 soft:.5,               // awal musim: poin = start + (poin - start) × soft
 kAtk:40,kDef:16,       // faktor Elo saat menyerang / saat tim bertahan diserang
 minWin:6,minLose:3,    // perubahan poin minimum
 limit:90,              // detik; waktu habis = penyerang kalah
 teamBonus:true,
 // Kemarahan Arena: setelah `at` detik semua damage naik `per` (×) tiap detik, supaya tim penuh penyembuh tidak buntu sampai waktu habis
 rage:{at:15,per:.07},healMul:.7,          // penyembuhan di Arena ×0.7
        // bonus CP tim (resonansi elemen, formasi seimbang, dst.) ikut menguatkan stat di Arena
 refreshCd:10,          // detik jeda tombol "Cari Lawan Lain"
 // serangan bot ke tim bertahanmu: peluang per jam & batas per kali hitung (setelah pertama kali bertarung)
 defPerHour:.17,defMax:8,
 // balas dendam bot yang kamu kalahkan: peluang per gaya main, jeda (menit) sebelum menyerang di sesi online berikutnya
 revenge:{p:{santai:.25,reguler:.45,rajin:.6,hardcore:.8},delay:[2,40]},
 // hadiah per pertarungan
 battle:{win:{gold:2500,exp:40},lose:{gold:800,exp:15}},
 // liga: min = poin minimum. day = hadiah harian, week = hadiah akhir musim (mats: bahan Kebangkitan ★4–★6, badge = Lencana Ksatria)
 leagues:[
  {id:'bronze',  n:'Perunggu',min:0,   c:'#c7804a',c2:'#7a4420',day:{gems:20, gold:5000}, week:{gems:100, gold:20000,mats:{asc1:5}}},
  {id:'silver',  n:'Perak',   min:1150,c:'#b9c4d6',c2:'#5e6b82',day:{gems:30, gold:8000}, week:{gems:200, gold:35000,mats:{asc1:10,badge:5}}},
  {id:'gold',    n:'Emas',    min:1300,c:'#ffc83d',c2:'#a8650e',day:{gems:45, gold:12000},week:{gems:350, gold:50000,tixH:1,mats:{asc1:15,asc2:3,badge:10}}},
  {id:'platinum',n:'Platinum',min:1450,c:'#6fe0d2',c2:'#21786e',day:{gems:60, gold:16000},week:{gems:500, gold:70000,tixH:2,mats:{asc1:20,asc2:6,badge:15}}},
  {id:'diamond', n:'Berlian', min:1600,c:'#7fb4ff',c2:'#2f4fae',day:{gems:80, gold:20000},week:{gems:750, gold:90000,tixH:3,mats:{asc1:25,asc2:10,asc3:1,badge:20}}},
  {id:'legend',  n:'Legenda', min:1800,c:'#ff7ad0',c2:'#7a1f8a',day:{gems:100,gold:25000},week:{gems:1000,gold:120000,tixH:5,mats:{asc1:30,asc2:15,asc3:2,badge:30}}},
 ],
 // poin bot: target = start + span × (persentil CP)^curve ± jitter; makin lama musim berjalan makin dekat ke target
 bot:{span:1150,curve:1.6,jitter:220,speed:{santai:.35,reguler:.55,rajin:.8,hardcore:1.1},
  sk:{baru:-90,biasa:0,veteran:110}},   // pengalaman: veteran pintar memilih lawan (lebih sering menang), pemula sebaliknya
 // pencarian lawan: 3 kartu (lebih lemah / setara / lebih kuat) dalam rentang poin ini
 match:[[-220,-40],[-40,40],[40,220]],
 matchCp:[[0,.92],[.88,1.12],[1.08,9]],   // rentang CP lawan dibanding CP timmu untuk tiap kartu
 bg:'castle',           // latar pertarungan (img/bg/w_<bg>.webp)
};
