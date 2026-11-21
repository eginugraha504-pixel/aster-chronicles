/* =====================================================================
   TOP UP (mikrotransaksi pura-pura) — dibayar lewat bot Telegram "Bank Central Universe"
   Mesin: systems/topup.js · tampilan: ui/topup.js · sisi bot: bank-worker/ (Cloudflare Workers)
   ---------------------------------------------------------------------
   Alur: game membuat pesanan (ID + paket + harga) -> bot bank menagih & memotong saldo ->
   bot membalas KODE VOUCHER = HMAC-SHA256(secret, "ID|paket|harga") -> kode ditempel di game.
   Kode terikat ke pesanan itu (tidak bisa dipakai di pesanan lain / dipakai dua kali).
   OTOMATIS: bot bank jalan di Cloudflare Workers (bank-worker/). Selama ada pesanan menunggu, game menanyakan
   GET <api>/api/order/<ID>; begitu lunas, server mengembalikan kodenya dan game menukarnya sendiri. Kode manual = cadangan.
   PENTING: `secret` di sini HARUS sama dengan ASTER_SECRET di bot. Uang & permata sama-sama fiktif.
   ===================================================================== */
const TOPUP_CFG={
 secret:'HUN2-aster-7Qm4Xc9TzR2kLw8B',
 prefix:'AST',            // awalan ID pesanan
 ttl:24*36e5,             // pesanan kedaluwarsa setelah 24 jam
 merchant:'HUN2 STUDIO',  // nama penerima di bot bank
 api:'https://aster-bank.valberryv.workers.dev', // alamat server bank (Cloudflare Worker, folder bank-worker/). Kosong = hanya kode voucher manual
 pollMs:3000,             // jeda cek status pesanan selama menunggu pembayaran
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
 /* PAKET (bundle) gaya game P2W — dibayar lewat bot bank seperti paket permata (SKU & harga ikut katalog server, tools/gen_botcfg.mjs).
    lim: 'once' sekali seumur akun · 'week' per minggu (reset Senin 00:00 WIB) · 'month' per bulan · 'offer' penawaran naik level (48 jam sejak level tercapai)
    minLv: level akun minimal untuk membeli. rw: isi (gems, gold, stam, tixH, tixW, badge, mats, pickHero = pilih 1 hero ★N standar lewat Kotak Surat).
    val: label "nilai" di toko (pemasaran ala game gacha, bukan perhitungan). Mesin: systems/bundle.js · tampilan: ui/bundle.js */
 bundles:[
  {id:'b1',n:'Paket Pemula',price:15000,lim:'once',val:1800,hot:1,rw:{gems:600,tixH:5,gold:100000,stam:120,mats:{asc1:10}}},
  {id:'b2',n:'Paket Petualang',price:79000,lim:'once',minLv:10,val:1200,rw:{gems:2000,tixH:10,tixW:5,gold:500000,badge:30,mats:{asc1:30,ore3:10}}},
  {id:'b3',n:'Paket Sultan',price:499000,lim:'once',minLv:15,val:1500,rw:{pickHero:3,gems:8000,tixH:30,tixW:20,gold:3000000,badge:150,mats:{asc1:120,asc2:30,asc3:3,ore3:40,gem3:10}}},
  {id:'wk1',n:'Paket Mingguan Hemat',price:29000,lim:'week',val:600,rw:{gems:500,tixH:3,gold:300000,stam:120}},
  {id:'wk2',n:'Paket Mingguan Kebangkitan',price:149000,lim:'week',minLv:20,val:800,rw:{gems:1500,gold:2000000,badge:60,mats:{asc1:50,asc2:10,ore3:15}}},
  {id:'mo1',n:'Paket Bulanan Sultan',price:999000,lim:'month',minLv:25,val:1000,rw:{gems:16000,tixH:60,gold:10000000,badge:300,mats:{asc1:150,asc2:60,asc3:10,ore3:60}}},
  {id:'gf',n:'Dana Pertumbuhan',price:99000,lim:'once',val:2400,fund:1},
  {id:'lv10',n:'Paket Lv 10',price:29000,lim:'offer',lv:10,val:900,rw:{gems:1000,tixH:5,gold:200000}},
  {id:'lv20',n:'Paket Lv 20',price:49000,lim:'offer',lv:20,val:900,rw:{gems:1500,tixH:8,gold:500000,mats:{asc1:20}}},
  {id:'lv30',n:'Paket Lv 30',price:99000,lim:'offer',lv:30,val:1000,rw:{gems:3000,tixH:12,gold:1000000,badge:20,mats:{asc1:40}}},
  {id:'lv40',n:'Paket Lv 40',price:149000,lim:'offer',lv:40,val:1000,rw:{gems:4500,tixH:15,gold:2000000,badge:40,mats:{asc1:60,asc2:10}}},
  {id:'lv50',n:'Paket Lv 50',price:249000,lim:'offer',lv:50,val:1100,rw:{gems:7000,tixH:20,gold:4000000,badge:80,mats:{asc1:80,asc2:20}}},
  {id:'lv60',n:'Paket Lv 60',price:349000,lim:'offer',lv:60,val:1100,rw:{gems:9000,tixH:25,gold:6000000,badge:100,mats:{asc1:100,asc2:30,asc3:2}}},
  {id:'lv80',n:'Paket Lv 80',price:499000,lim:'offer',lv:80,val:1200,rw:{gems:12000,tixH:30,gold:9000000,badge:150,mats:{asc1:120,asc2:45,asc3:5}}},
  {id:'lv100',n:'Paket Lv 100',price:799000,lim:'offer',lv:100,val:1200,rw:{gems:18000,tixH:40,gold:15000000,badge:250,mats:{asc1:160,asc2:70,asc3:10}}},
 ],
 offerHours:48,                                       // penawaran naik level berlaku 48 jam
 // Dana Pertumbuhan: bayar sekali, permata cair tiap level akun tercapai (bisa diklaim kapan saja setelahnya)
 fund:{lv:[10,15,20,25,30,40,50,60,70,80,90,100],gems:[600,600,800,800,1000,1200,1500,1800,2000,2400,2800,3500]},
 // Beli emas pakai permata (Toko Emas): maks per hari, harga naik tiap kali; emas = base + perLv × level akun; kadang kritis ×2/×3
 gold:{daily:10,cost:[20,40,60,80,100,150,200,250,300,400],base:50000,perLv:5000,crit:[[.15,2],[.03,3]]},
};
