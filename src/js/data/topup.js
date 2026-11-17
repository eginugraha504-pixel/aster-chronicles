/* =====================================================================
   TOP UP (mikrotransaksi pura-pura) — dibayar lewat bot Telegram "Bank Central Universe"
   Mesin: systems/topup.js · tampilan: ui/topup.js · sisi bot: tools/bank_topup/aster_topup.py
   ---------------------------------------------------------------------
   Alur: game membuat pesanan (ID + paket + harga) -> bot bank menagih & memotong saldo ->
   bot membalas KODE VOUCHER = HMAC-SHA256(secret, "ID|paket|harga") -> kode ditempel di game.
   Kode terikat ke pesanan itu (tidak bisa dipakai di pesanan lain / dipakai dua kali).
   OTOMATIS: bot juga mengirim {o,s,p,c} ke ntfy.sh/<topik>; game yang punya pesanan menunggu mendengarkan topik itu
   (EventSource + cek ulang saat aplikasi dibuka lagi) lalu menukar kodenya sendiri. Kode manual = cadangan.
   PENTING: `secret` di sini HARUS sama dengan ASTER_SECRET di bot. Uang & permata sama-sama fiktif.
   ===================================================================== */
const TOPUP_CFG={
 secret:'HUN2-aster-7Qm4Xc9TzR2kLw8B',
 prefix:'AST',            // awalan ID pesanan
 ttl:24*36e5,             // pesanan kedaluwarsa setelah 24 jam
 merchant:'HUN2 STUDIO',  // nama penerima di bot bank
 ntfy:'https://ntfy.sh',  // jembatan otomatis: bot mengirim bukti bayar ke topik ntfy, game mendengarkan (topik diturunkan dari secret)
 // Paket Permata. Bonus pembelian pertama tiap paket = permata dasar (2×). Nilai per Rupiah ≈ gacha sungguhan (±Rp40rb per summon)
 packs:[
  {id:'g1',price:16000,  gems:120,  bonus:0},
  {id:'g2',price:79000,  gems:600,  bonus:60},
  {id:'g3',price:249000, gems:1960, bonus:220},
  {id:'g4',price:479000, gems:3960, bonus:520},
  {id:'g5',price:799000, gems:6560, bonus:1200},
  {id:'g6',price:1599000,gems:12960,bonus:3200},
 ],
 // Kartu Bulanan: permata langsung + permata harian (lewat Kotak Surat, login tiap hari). Bisa ditumpuk sampai maxDays.
 card:{id:'mc',price:79000,now:600,daily:180,days:30,maxDays:180},
};
