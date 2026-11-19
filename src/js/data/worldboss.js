/* =====================================================================
   BOS DUNIA (World Boss) — data & angka keseimbangan
   Logika: systems/worldboss.js · Tampilan: ui/worldboss.js · Server: bank-worker/src/game.js (/api/wb)
   ===================================================================== */
const WB_CFG={
 slots:[12,16,20,23],        // jam muncul (WIB)
 from:Date.parse('2026-11-19T05:00:00Z'),   // raid pertama: 19 Nov 2026 12.00 WIB (sebelumnya tidak ada raid)
 dur:10*6e4,                 // lama pertarungan
 pre:10*6e4,                 // pengumuman sebelum muncul (bot mulai berdatangan, beranda berubah)
 after:15*6e4,               // hasil masih ditampilkan di beranda
 respawn:10,                 // detik bangkit lagi setelah tim tumbang
 lv:8,                       // syarat level akun (FEAT.wb) — juga untuk bot
 ph:[.75,.5,.25],            // ambang fase (sisa HP)
 report:8000,                // kirim damage ke server tiap n ms
 n:19, hit:.36,  // hit: satu pukulan bos ≈ 36% HP rata-rata hero (sebelum fase)
                       // kekuatan dasar bos ≈ tahap ke-19 (def tetap untuk semua → damage sebanding kekuatan)
 // keseimbangan: DPS rata-rata tim dengan CP tertentu di pertarungan bos (sudah termasuk waktu mati & bangkit).
 // dikalibrasi ulang 19 Nov 2026 lewat simulasi mesin pertarungan SATU RAID PENUH (8 menit, keempat fase; t/wbcal3.py):
 // tim tumbang ±tiap 25–30 dtk. Kalibrasi lama (3 menit pertama tanpa fase) membuat bot ±2× terlalu kuat.
 // Cek nyata: tim Egi CP 17,4rb (dengan penyembuh) ±580/dtk di simulasi, 383/dtk di raid 16.00 → rumus: ±390/dtk.
 dps:{k:.0027,a:1.217},
 attend:{base:.42,core:.3},  // peluang bot ikut raid (ditambah gaya main 'core' & jam ramai)
};
// lima wujud naga, bergilir per jadwal. tint: warna kali (multiply) di atas sprite naga abu-abu; null = apa adanya
const WB_BOSS=[
 {id:'abu',n:'Naga Abu',el:'gelap',tint:null,sk:'Napas Abu Kelam',d:'Naga purba dari reruntuhan kota yang terbakar. Abunya menelan cahaya.'},
 {id:'bara',n:'Naga Bara',el:'api',tint:'#ff8a5a',sk:'Semburan Bara',d:'Bersarang di kawah gunung. Sisiknya membara sampai batu di dekatnya meleleh.'},
 {id:'samudra',n:'Naga Samudra',el:'air',tint:'#6ab8ff',sk:'Gelombang Pasang',d:'Penguasa laut dalam. Setiap auman memanggil ombak setinggi menara.'},
 {id:'rimba',n:'Naga Rimba',el:'tanah',tint:'#8fd36e',sk:'Duri Bumi',d:'Tertidur ratusan tahun di hutan tua hingga lumut dan akar tumbuh di punggungnya.'},
 {id:'fajar',n:'Naga Fajar',el:'cahaya',tint:'#ffe08a',sk:'Sinar Penghakiman',d:'Turun dari langit saat matahari terbit. Cahayanya menyilaukan siapa pun yang menatap.'}];
// keterangan fase untuk menu
const WB_PH_D=['Serangan biasa.','Serangan bos +30% dan lebih cepat.','Sisik mengeras: hanya elemen unggul yang menembus penuh (lainnya −40%).','Serangan +60% dan sangat cepat. Habisi secepatnya!'];
// fase: pengali serangan bos, pengali damage diterima bos bila elemen penyerang TIDAK unggul, jeda serangan
const WB_PH=[
 {n:'Fase 1',atk:1,res:1,cd:1},
 {n:'Fase 2 · Mengamuk',atk:1.3,res:1,cd:.9},
 {n:'Fase 3 · Sisik Baja',atk:1.3,res:.6,cd:.9},      // hanya elemen unggul yang menembus penuh
 {n:'Fase 4 · Amukan Terakhir',atk:1.6,res:.8,cd:.7}];
// hadiah per raid (dikirim ke Kotak Surat setelah raid selesai). Bos kabur = semua hadiah ×0,5
const WB_RW={
 rank:[{to:1,rw:{gems:300,ore3:3,gem3:1,badge:30,gold:50000}},
  {to:2,rw:{gems:200,ore3:2,badge:20,gold:40000}},
  {to:3,rw:{gems:150,ore3:1,badge:15,gold:30000}},
  {to:10,rw:{gems:60,ore2:5,badge:8,gold:15000}},
  {to:Infinity,rw:{gold:6000,ore1:6}}],
 // peti kontribusi: bagian damage dibanding rata-rata penyerang (k × 1/jumlah penyerang) — tingkat tertinggi yang tercapai
 contrib:[{k:2,n:'Pahlawan',rw:{gem2:2,gem1:6,gold:20000}},{k:1,n:'Pejuang',rw:{gem2:1,gem1:5,gold:10000}},{k:.5,n:'Kontributor',rw:{gem1:3,gold:5000}}],
 last:{gems:100},
 // mingguan (Poin Pemburu = total damage Senin–Minggu)
 week:[{to:1,rw:{asc1:3,gems:600,badge:60}},{to:2,rw:{asc1:2,gems:400,badge:40}},{to:3,rw:{asc1:1,gems:300,badge:30}},{to:10,rw:{gems:150,badge:20}},{to:50,rw:{gold:30000}}]};
