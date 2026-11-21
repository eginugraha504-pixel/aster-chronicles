/* =====================================================================
   PENGUMUMAN SERVER — angka keseimbangan
   Mesin: systems/announce.js · Tampilan: ui/announce.js + css/announce.css
   Server: bank-worker/src/game.js (/api/ann, tabel ann) — angka yang sama ikut ke botcfg.js (BOTCFG.ANN)
   Isi: ★3 dari Panggilan, naik VIP, pergantian #1 CP & Arena, rekor pertama server, MVP Bos Dunia.
   Tampil sebagai pita berjalan di beranda (strip Obrolan Dunia) + baris [Sistem] di Obrolan Dunia.
   Disimpan server → semua pemain di server yang sama melihat pengumuman yang sama.
   ===================================================================== */
const ANN_CFG={
 p3Slot:6*6e4,       // ★3 bot: paling banyak satu pengumuman per slot (acak berbobot: terbatas ×1,5, sultan sampai ×1,6)
 vipSlot:20*6e4,     // naik VIP bot: satu per slot
 quiet:.2,           // jam paling sepi (pukul 3–4 pagi) hanya ±20% slot yang dipakai; makin ramai jamnya (BOT_CFG.HOURS) makin penuh
 vipMin:3,           // VIP yang diumumkan (pemain asli & bot sama)
 cd:{cp:20*6e4,ar:45*6e4},   // jeda minimal antar pergantian #1 (supaya tidak bolak-balik)
 hold:2*6e4,         // #1 baru harus bertahan sekian lama sebelum dilaporkan
 recCP:[10000,50000,100000,250000,500000,1000000,2000000],   // rekor "pertama menembus CP …"
 recAsc:[4,5,6],     // rekor "pertama membangkitkan hero ke ★…"
 win:20*6e4,         // ★3 & VIP bot dihitung sejauh ini ke depan (sekali hitung, lalu dipakai bertahap)
 ahead:6*6e4,        // dilaporkan sekian lama SEBELUM terjadi; server menyimpannya dengan waktu kejadian
 keep:3*864e5,       // pengumuman biasa disimpan 3 hari (rekor disimpan sampai server direset)
 show:7000,          // lama minimal satu pengumuman di pita beranda (ms); teks panjang ditambah waktu geser
 fresh:3*6e4,        // pengumuman lebih tua dari ini tidak diputar lagi di pita
};
