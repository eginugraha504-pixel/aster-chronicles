/* =====================================================================
   KOTAK SURAT — surat dikirim otomatis saat `cond` terpenuhi (sekali per id)
   ---------------------------------------------------------------------
   from/title/body : isi surat        cond: kapan dikirim (kosong = langsung)
   (Login harian & misi pemula sekarang ada di data/events.js)
   rw : hadiah -> gems, gold, stam, exp, tixH (tiket hero), tixW (tiket senjata),
                  hero:'id', weapon:'id', pickHero:3 (pilih 1 hero ★3)
   Surat kejutan dari kode: sendMail({id,from,title,body,rw})
   ===================================================================== */
const MAILS=[
 // ---- paket pemula (langsung) ----
 {id:'welcome',from:'Ratu Aster',title:'Selamat datang, Kapten!',
  body:'Kerajaan Aster menyambutmu! Terimalah bekal ini untuk memulai petualangan. Semoga fajar selalu menyertaimu.',
  rw:{gems:1500,gold:30000,stam:120}},
 {id:'starter_hero',from:'Menara Panggilan',title:'Paket Pemula: 10 Tiket Hero',
  body:'Satu kali Summon x10 gratis! Tiket Hero bisa dipakai di Panggilan Fajar maupun Panggilan Standar.',
  rw:{tixH:10}},
 {id:'starter_wpn',from:'Pandai Besi Bram',title:'Paket Pemula: 5 Tiket Senjata',
  body:'Senjata bagus membuat hero makin kuat! Pakai tiket ini di Panggilan Senjata. Siapa tahu dapat senjata signature ★3!',
  rw:{tixW:5}},
 {id:'starter_gear',from:'Pandai Besi Bram',title:'Hadiah: Pedang Perak ★2',
  body:'Pedang buatanku sendiri. Cocok untuk Sakuya atau Kuro sebelum mereka mendapat senjata signature.',
  rw:{weapon:'perak',gold:20000}},
 {id:'starter_forge',from:'Pandai Besi Bram',title:'Paket Tempa: Bijih & Serpihan',
  body:'Senjata sekarang bisa naik level dan Limit Break! Ini bekal dariku. Cari lebih banyak di Dungeon (Petualangan > Dungeon).',
  rw:{mats:{ore1:20,ore2:5,gem1:6},gold:10000}},
 {id:'sera_swap',from:'Menara Panggilan',title:'Pemberitahuan: Seraphine → Celestine',cond:()=>!!(S.replacedMsg&&S.replacedMsg.seraphine),
  body:'Seraphine keluar dari panggilan dan digantikan Celestine. Level, Limit Break, dan gear Seraphine sudah dipindahkan ke Celestine. Sebagai permintaan maaf, terimalah 5 Tiket Hero!',
  rw:{tixH:5}},
 {id:'aurora_refund',from:'Pandai Besi Bram',title:'Kompensasi: Pedang Aurora',cond:()=>S.auroraRefund===1,
  body:'Pedang Aurora dipensiunkan. Sebagai gantinya, terimalah 10 Tiket Senjata untuk mencari senjata ★3 baru!',
  rw:{tixW:10}},
 {id:'gear_gift',from:'Pandai Besi Bram',title:'Baru: Pelindung & Aksesori!',
  body:'Slot Pelindung dan Aksesori sudah terbuka! Pakai bekal ini dulu. Pelindung didapat di Tambang Bijih, Aksesori di Kuil Bintang, dan bos tiap dunia memberi hadiah pasti.',
  rw:{gear:['jubah_linen','kalung_taring'],gold:10000}},
 {id:'starter_pick',from:'Ratu Aster',title:'Hadiah Spesial: Pilih 1 Hero ★3!',
  body:'Sebagai tanda kepercayaanku, pilihlah satu ksatria ★3 untuk bergabung dengan timmu. Pilih dengan bijak!',
  rw:{pickHero:3}}
];
