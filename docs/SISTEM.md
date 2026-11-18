# Sistem & riwayat perubahan — detail per fitur

Catatan teknis per sistem (angka balance, keputusan desain, perilaku khusus). Ringkasan & struktur ada di README.md, aset di docs/ASET.md.

## Balance & ekonomi (v balance-2)
- **Kurva kesulitan**: `DIFF` di `config.js`. `pow` = pengali kekuatan musuh, `rec` = CP rekomendasi; keduanya tabel jangkar `[indeks tahap 0..24, nilai]` yang diinterpolasi log.
  `rec` dikalibrasi dengan `test/recal.py <n,...>`: CP di mana rata-rata 3 tim campuran menang ±70% (jangkar ada di tahap bos, karena bos adalah gerbang).
- **ATK musuh** tumbuh `g^atkExp` (0.85), lebih lambat dari HP-nya, supaya tahap akhir tidak jadi "sekali pukul mati".
- **Pemanah/penyihir musuh** hanya 45% mengincar hero ber-HP terendah (`ENEMY_FOCUS`), sisanya acak. Dulu selalu, sehingga tim tanpa healer runtuh berantai.
- **Jeda antar gelombang**: hero yang masih hidup pulih 25% HP maks (`WAVE_HEAL`).
- **Bos**: `BOSS_MUL` (HP ×4.5, ATK ×1.15, DEF ×1.3).
- **Bonus Formasi Seimbang** (ada Penjaga + Pendukung) naik ke 12%, supaya tombol Tim Terbaik ikut memilih tim yang benar-benar kuat di battle.
- **Hadiah tahap**: `STAGE_RW` (emas awal dinaikkan: 320 + 160×n).
- Hasil simulasi 20 hari (`test/simall.sh TAG`): cerita tamat sekitar hari ke-17 (santai), 7 (reguler), 6 (rajin), 4 (hardcore). Tahap 5-5 butuh ±29 rb CP dan menjadi tantangan akhir.
- **Batas level hero** = lv akun ×2 + 10 (dan tetap dibatasi rarity/LB). Naik level akun memberi +20 stamina.
- **Simulasi F2P**: `test/sim.js` + `runsim.py <hari> "[jam sesi]" out.json keep`. Bot simulasi memilih Penjaga + Pendukung terbaik lalu hero terkuat. Setelah balance berubah, salin hasilnya ke `BOT_CFG.CURVES`.

## Hadiah pemain baru (v balance-3)
- Hadiah awal disebar ke minggu pertama: hari ke-1 sekitar 78 summon (dulu 110–170), hari ke-7 sekitar 200–280, hari ke-20 sekitar 320–330.
  - Surat sambutan 1.500 permata, paket tiket senjata 5, Login 7 Hari: hari 1 kecil dan hari 2–7 besar.
  - Misi Pemula sekarang 13 misi sampai tamat 5-5 / level akun 30, jadi hadiah besar datang seiring progres.
  - Target summon Festival Raijin: 30 / 80 / 150 (tersebar selama event).
- Hadiah "Pilih 1 hero ★N" hanya berisi hero standar (`pickPool`). Hero terbatas hanya dari banner-nya.

## Salinan senjata & perlengkapan, Lencana Ksatria (QoL)
- **Duplikat senjata/perlengkapan** tidak otomatis jadi Penempaan. Duplikat disimpan sebagai **salinan** dengan kunci `id`, `id~2`, `id~3`, ... di `S.weapons` / `S.gear`.
  `WD`/`GDD` diberi alias untuk kunci salinan (`invAlias`), jadi `WD[kunci]` selalu mengembalikan data senjata dasarnya. Helper ada di `systems/weapons.js` (bagian SALINAN).
- Salinan bisa dipasang ke hero lain, dipakai untuk **Tempa +1** (manual; korban = salinan cadangan terlemah yang tidak dipakai), atau **Lebur** jadi bijih (`SALVAGE`: ★1 Bijih ×4, ★2 ×2, ★3 ×2).
- Daftar koleksi menampilkan 1 kartu per jenis dengan badge ×N. Detail item punya daftar salinan. Ada tombol "Lebur cadangan ★1/★2" (yang terbaik, dipakai, dan sudah ditingkatkan tidak ikut).
- **Hero duplikat setelah LB +5** → **Lencana Ksatria** (`BADGE_DUPE` ★1:1, ★2:5, ★3:25), sebelumnya permata. Tukar di **Toko → Tukar Lencana** (`SHOP_X` di `data/shop.js`):
  hero ★3 standar 300, senjata ★3 standar 200 (hanya standar), tiket dan material dengan stok per minggu (reset Senin WIB).
- **Naik level hero**: bar menempel di bawah detail hero (+1, +5, MAKS). `modalKeep()` mempertahankan posisi scroll saat modal yang sama dibuka ulang.
- **Ambil Semua** di tab Harian, Pencapaian, dan Event (`claimAllMis`). Hadiah yang perlu memilih hero tetap diambil satu per satu.

## Gacha: Rate On / Rate Off
- Saat mendapat ★3 di banner rate-up: peluang `RATE_UP.hero` (50%) atau `RATE_UP.wpn` (75%) mendapat item rate-up (**Rate On**).
- Kalau kalah (**Rate Off**, dapat ★3 lain), ★3 berikutnya **dijamin** item rate-up. Status jaminan disimpan di `S.hg` / `S.wg` dan terbawa antar banner rate-up.
- **Soft pity** (`SOFT_PITY`): mulai summon ke-66 peluang ★3 naik 6% tiap summon sampai pasti di ke-80 (rata-rata 29,3 summon per ★3; dulu 30,4). Bar pity punya penanda zona dan berubah warna.
- Jadi item rate-up dijamin paling lambat dalam 160 summon (2× pity). Pity tetap 80 dan berlaku bersama untuk semua banner hero (senjata terpisah).
- UI: status "★3 berikutnya: 50% / DIJAMIN" di panel pity, label RATE ON / RATE OFF saat reveal ★3, dan penjelasan lengkap + peluang efektif di Info Peluang.
- Bot memakai fungsi yang sama (`gachaRoll`), jadi statistik mereka ikut aturan ini.

## Pelindung & Aksesori
- Data: `data/gear.js` (`GEAR`). Tambah item = tambah 1 entri. `slot` armor (HP+DEF) atau acc (ATK+Crit), `kind` menentukan bentuk ikon (vest/plate/robe/ring/amulet), `pal` untuk warna. Ikon dibuat otomatis di `art/gear-icons.js`.
- Logika: `systems/gear.js`. Enhance +N memakai emas dan bijih (`GEAR_UP_GOLD`, `GEAR_MAX_LV`). Duplikat menambah Penempaan +10%, dan setelah maksimal diubah jadi emas.
- Sumber: Tambang menjatuhkan Pelindung, Kuil menjatuhkan Aksesori (`DG_GEAR_P` = peluang dan bobot bintang per tingkat). Bos dunia memberi item pasti pada kemenangan pertama (`BOSS_GEAR`). Ada juga surat `gear_gift`.
- Semua hero bisa memakai semua item. Data tersimpan di `S.gear[id]={lv,ref}`, dan item yang dipakai ada di `S.heroes[h].ar` / `.ac`.
- Dampak CP: set ★3 +15 kira-kira +20–25% CP per hero di level 50. Item ini bersifat jangka panjang, jadi kalibrasi `DIFF` tidak diubah.

## Roster (17 hero)
| Hero | ★ | Elemen | Role | Skill | Senjata signature ★3 |
|---|---|---|---|---|---|
| Raika (terbatas) | 3 | Gelap | Ranger | AoE | Busur Guntur Raijin (terbatas) |
| Sakuya (terbatas) | 3 | Api | Warrior | Single | Katana Hanafubuki (terbatas) |
| Mira | 2 | Tanah | Ranger | Single | Busur Zamrud Rimba |
| Noa | 2 | Air | Support | Heal | Tongkat Embun Bintang |
| Vela | 2 | Gelap | Support | Buff | Tongkat Bulan Sabit |
| Bruna | 2 | Tanah | Tanker | Shield | Perisai Batu Purba |
| Nami | 2 | Air | Ranger | AoE | Busur Ombak Biru |
| Pia | 1 | Netral | Tanker | Shield | Perisai Mentari Mungil |
| Rin | 1 | Api | Warrior | AoE | Kapak Bara Merah |
| Kuro | 1 | Gelap | Warrior | Single | Pedang Bayang Malam |
| Lumi | 1 | Cahaya | Support | Heal | Tongkat Lentera Suci |
| Marisa | 3 | Air | Support | Heal | Tongkat Naga Samudra |
| Hilde | 3 | Tanah | Warrior | AoE | Kapak Rune Gunung |
| Celestine | 3 | Cahaya | Tanker | Shield | Perisai Sayap Mentari |
| Aurelia | 3 | Api | Ranger | Single | Busur Bulu Phoenix |
| Lilith | 3 | Gelap | Support | Buff | Tongkat Mikrofon Gerhana |
| Coppelia | 3 | Netral | Warrior | Single | Pedang Roda Gigi |

Seraphine dihapus 18 Nov 2026 (diganti Celestine; migrasi save di `HERO_REPLACED`, `systems/state.js`).

Hero generik dibuat dengan `gen:{hair,hat,weapon,pal}` di `data/heroes.js` (tanpa file art terpisah).

## Pemain Bot & Peringkat (file terpisah)
- `data/bots.js` (`BOT_CFG`) berisi semua angka penyetel:
  - jumlah maksimum (1000), waktu rilis (`epoch`), kecepatan pertumbuhan (`tau`)
  - profil gaya main (santai/reguler/rajin/hardcore): bobot, kecepatan, jumlah sesi per hari, dan `opt` (seberapa rapi build-nya)
  - `CURVES`: kurva per gaya main dari simulasi 16 hari (`[hari, lv, total summon, lv senjata, lv senjata cadangan, jam main]`), lalu diperpanjang dengan ekor XP (`XP_TAIL_DAYS`)
  - jam main WIB (`HOURS`, `TZ:7`, `WEEKEND_EXTRA`), berhenti main (`churn`, `FADE`), dan kembali main (`COMEBACK`)
  - `ERAS`: daftar banner per waktu. **Setiap ada banner limited baru, tambahkan era baru** (waktu mulai + hero/senjata rate-up), supaya bot tidak punya hero sebelum rilis. `HERO_SINCE` untuk hero standar baru.
  - bio (`BIO_TAGS`, `BIO_PROMPT`, `BIO_LOCAL`) dan aturan nama (`NAME_RE`: hanya huruf dan angka)
- `systems/bots.js` adalah mesinnya. Bot ke-i bergabung pada waktu tetap, jadi semua penonton melihat dunia yang sama.
  - Progres hanya bertambah saat bot aktif (segmen aktif, memudar, berhenti, kadang kembali setelah era baru).
  - Gacha tersimulasi per waktu dengan banner era yang sedang berjalan; ★3 dicatat sebagai riwayat (dipakai profil & pengumuman).
  - Hero favorit = ★3 pertama. Bot santai sering tidak memakai tim terbaik, level/senjata/perlengkapan tidak rata.
  - Sesi online dibangkitkan per hari WIB (ramai malam, sepi dini hari).
  - Statistik akun: total summon, ★3 (terbatas), hari login, jam main, keberuntungan gacha (Hoki/Normal/Apes, ±1 simpangan baku).
- **Nama & bio** dibuat Claude (capability `sample`), disimpan bersama di db `bots/names` dan `bots/bios`. Bio dibuat saat peringkat pertama kali dibuka, lalu dicocokkan dengan keadaan bot (tag: hoki, apes, kembali, hardcore, dll). Ada cadangan lokal bila Claude tidak tersedia.
- `ui/leaderboard.js`: tab CP dan Level, 100 besar, ▲/▼ perubahan peringkat dari snapshot tiap jam, label BARU/KEMBALI, "Kemarin #n" untuk pemain sendiri, profil bot (bio, statistik, ♥ hero favorit, tim, koleksi).
- **Pengumuman global** di lobby: bot yang mendapat ★3 dalam 3 jam terakhir, bergilir tiap 6 detik; ketuk untuk membuka profilnya.
- **Setelah update besar:** jalankan `test/runsim.py DAYS "[jam]" out.json` untuk tiap gaya main, salin barisnya ke `CURVES`, dan selesai.

## Reset dunia bot (sementara) & 10.000 bot
- Pengaturan → **Reset Bot ke Hari 1**: `botsResetWorld()` menulis `bots/world = {epoch: sekarang, gen+1}`. Semua bot jadi karakter baru (seed memakai `gen`), jumlah bot mulai dari 0, dan snapshot peringkat dibersihkan. Progres pemain tidak berubah. Reset berlaku untuk semua yang membuka game (db bersama; cadangan localStorage `aster_botworld`).
- Pertumbuhan: `max:10000`, `launch:0`, `tau:12` → sekitar 800 bot di hari ke-1, 4.400 di hari ke-7, 9.200 di hari ke-30.
- Performa: state bot dihitung bertahap di latar belakang (`botsWarm`, potongan ±10 ms, ulang tiap 2 menit), jadi layar tidak membeku. Peringkat menampilkan "Memuat peringkat..." sampai siap (±3 detik di 9.000 bot); setelah itu refresh ±60 ms.
- Nama disimpan per 2.000 nama: `bots/names`, `bots/names_1`, ... (`NAME_SHARD`).
- Untuk menghapus tombol reset nanti: hapus blok "Dunia Bot (sementara)" + aksi `botReset` di `ui/actions.js`.

## Loading & Login
- `index.html` berisi markup `#boot` (logo, bar, tips), jadi layar loading tampil sebelum JS berjalan. Gayanya ada di `css/boot.css`.
- `ui/boot.js`:
  - `bootStart()` menjalankan langkah nyata (load save, huruf, sprite hero, ikon senjata/perlengkapan, `initCore`, bot) dengan bar progres, tips bergilir, dan durasi minimum 1,7 detik.
  - `openLogin()` menampilkan layar judul animasi (latar kota hidup), lalu tombol Pengumuman, Bahasa, dan Akun.
  - Pemain baru masuk sebagai Tamu dan membuat nama (`NAME_OK`: 3–12 huruf/angka, tidak boleh sama dengan nama bot).
  - Pemain lama (`welcomed`) langsung disambut dengan namanya.
- `main.js` dibagi menjadi `initCore()` (dunia) dan `initUI()` (tampil setelah login).
- Isi pengumuman ada di `NEWS` dan tips di `BOOT_TIPS`, sedangkan versi game di `GAME_VER`.
- Untuk tes otomatis, buka `index.html#skipboot` untuk melewati loading dan login.

## Safari iPhone / perangkat
- `systems/platform.js` mengurus beberapa hal khusus perangkat:
  - `:active` tombol di iOS
  - mencegah zoom cubit
  - membuka dan melanjutkan audio iOS (setelah telepon atau pindah aplikasi)
  - menyimpan saat `pagehide`
  - menambah kelas `html.ios`
- Ada meta `viewport-fit=cover` dan meta web-app Apple, jadi `env(safe-area-inset-*)` aktif (notch dan garis home).
- `base.css` mengatur:
  - `touch-action:manipulation` (tanpa zoom ketuk-dua-kali)
  - body `position:fixed` (tanpa efek pantul)
  - kolom input boleh dipilih (iOS tidak bisa mengetik kalau `user-select:none`)
  - tanpa menu tekan-lama di gambar
- Fallback: `-webkit-backdrop-filter`, `color-mix`, `-webkit-optimize-contrast`, dan `dvh` di samping `vh`. Teks gradien logo memakai `<span>` terpisah dari `filter`.
- Hero di beranda memakai skala bulat (`LOBBY_SCALE`): 4× (176px), atau 3× di layar pendek. Posisinya dihitung dari letak tombol bawah (`lobbyPlace`).
- Target minimum: iOS 15+.

## Banner terbatas & senjata
- Hero dengan `limited:true` (Raika, Sakuya) hanya muncul di banner yang `rateUp`-nya hero itu. Senjata signature milik hero terbatas otomatis ditandai terbatas (`gacha.js`).
- Banner hero ada tiga: Raijin (terbatas), Sakura (terbatas), dan Standar. Banner senjata juga tiga: Senjata Raijin (terbatas), Senjata Sakura (terbatas), dan Senjata Standar (tanpa rate-up).
- Layar Summon punya kategori Hero/Senjata, dan pilihan terakhir di tiap kategori diingat.
- Pedang Aurora dihapus karena Seraphine sekarang hero ★3 standar. Save lama yang punya Aurora: senjatanya dilepas, lalu surat `aurora_refund` mengirim 10 Tiket Senjata.

## Polish v polish-4 (refresh)
- **Isi slot senjata otomatis**: hero baru langsung memakai senjata menganggur dengan kelas yang sama (senjata signature didahulukan). Kalau senjata signature datang belakangan dan slot pemiliknya kosong, langsung dipasang. Senjata yang sudah dipasang pemain **tidak pernah** diganti (`autoFillWpn` di systems/weapons.js).
- **Titik merah di kartu hero** (`wpnHint` di ui/heroes.js): muncul kalau slot senjata kosong padahal ada senjata menganggur, atau senjata signature-nya menganggur.
- Label kartu perlengkapan pakai jenisnya: Rompi / Zirah / Jubah / Cincin / Kalung (`GKIND` di data/gear.js), tidak lagi terpotong jadi "Pelin…".
- Nama pendek banner hero memakai nama hero (Raika / Sakuya), jadi tidak ada lagi "Raijin" dengan wajah Raika di beranda. Banner senjata tetap Raijin / Sakura.
- `render()` jatuh ke beranda kalau tab tidak dikenal (pengaman).
- Judul sambutan tidak lagi dobel "Kapten Kapten" kalau nama masih bawaan.
- Hasil cek: fuzz 2.500 aksi acak tanpa error, i18n EN/JA lengkap, 60 fps di beranda & battle, save ±15 KB.

## Dash melee
- `js/systems/dash.js`: semua unit melee (`ROLE[role].melee`: petarung & penjaga, hero maupun musuh/bos) melesat ke depan target → tebas → lompat balik.
  Fase `wait → in (0,13 dtk) → hold (0,17) → out (0,22)`; serangan mengenai saat tiba. Skill `single` melee (mis. Iai Sakuya) juga dash setelah cut-in.
- Efek: jejak bayangan warna elemen, garis kecepatan, debu di titik awal, tebasan + benturan dari `src/img/sprites/fx_melee.webp` (lembar VFX Higgsfield, putih → diwarnai elemen), getaran layar, *hitstop* 0,055 dtk (0,09 untuk skill).
- Beberapa penyerang ke target yang sama digeser sedikit supaya tidak menumpuk. Saat battle berakhir, dash yang belum selesai otomatis kembali ke posisi.

## Arena PvP (lawan pemain bot)
- File: `js/data/arena.js` (semua angka: tiket, liga, hadiah, Elo, Kemarahan Arena), `js/systems/arena.js` (mesin), `js/ui/arena.js` (layar tab `arena`), `css/arena.css`.
- Lawan = pemain bot dari Peringkat; tim & stat bot dihitung dengan `heroStats/teamCP` memakai state bot. Poin bot = persentil CP + keaktifan bot selama musim (deterministik).
- 5 tiket/hari (00:00 WIB). Musim mingguan (Senin 00:00 WIB). Liga: Perunggu → Perak → Emas → Platinum → Berlian → Legenda.
- Hadiah harian (bila bertarung hari itu) & akhir musim dikirim lewat Kotak Surat (`ar_d_<hari>`, `ar_w_<minggu>`). Awal musim: poin di atas 1000 dipotong setengah.
- Pertarungan: mesin battle biasa, hero lawan di sisi kanan (`u.ph`). Batas 90 dtk (habis = penyerang kalah). Setelah 15 dtk "Kemarahan Arena": damage naik 7%/dtk, penyembuhan ×0,7 di Arena. Bonus CP tim ikut menguatkan stat.
- Pertarungan Cepat (terbuka setelah 1 kemenangan) & serangan bot ke Tim Bertahan memakai simulasi tanpa layar (`B.sim`, ±40 ms per laga).
- Tim Bertahan diserang ±4×/hari setelah kamu pertama kali bertarung (maks 8 per kali hitung, 48 jam ke belakang). Kekalahan bertahan bisa dibalas (tombol Balas, pakai tiket).
- Peringkat: tab "Arena" di layar Peringkat.

## Top Up (mikrotransaksi pura-pura)
- Tab **Top Up** di Toko (juga dari tombol + permata di bar atas). Paket Permata g1–g6 (Rp16rb–Rp1,599jt, nilai ±Rp40rb per summon) dengan **bonus 2× pada pembelian pertama tiap paket**, dan **Kartu Bulanan** Rp79rb: 600 langsung + 180/hari × 30 hari via Kotak Surat (bisa ditumpuk sampai 180 hari, hari yang terlewat hangus).
- Pembayaran memakai bot Telegram **Bank Central Universe** yang sekarang jalan di **Cloudflare Workers** (`bank-worker/`, tanpa PC): game membuat pesanan → deep link ke bot → ✅ Bayar memotong saldo (D1) dan mencatat pesanan lunas → game yang menunggu menanyakan `GET https://aster-bank.valberryv.workers.dev/api/order/<ID>` tiap 3 detik (dan saat aplikasi dibuka lagi) lalu memverifikasi kode HMAC-nya → permata masuk sendiri. Kode cadangan tetap bisa ditempel manual. Pesanan kedaluwarsa 24 jam.
- Deploy bank: GitHub Actions `.github/workflows/bank-worker.yml` (secret repo: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `BANK_BOT_TOKEN`) — membuat D1 `aster-bank`, menjalankan migrasi, deploy, dan memasang webhook. Jalan otomatis saat `bank-worker/` berubah.
- Bank di program Cynthia (PC) dimatikan sejak 17 Nov 2026 (bisa dinyalakan lagi dengan `BANK_DI_PC=ya`); saldo & pesanan lunas sudah dipindah lewat `migrations/0002_pindahan.sql`. `tools/bank_topup/` = versi lama untuk bank di PC.
- Username bot disimpan di `S.iap.bot` (diatur pemain lewat tombol Atur). SHA-256/HMAC ditulis murni JS (tanpa crypto.subtle) agar jalan di file:// dan http://.
- Secret ada di kode game (repo publik) — wajar karena uang & permata sama-sama fiktif; tujuannya mencegah salah ketik, bukan keamanan sungguhan.

## Bot makin hidup: top up, emosi, hidup berubah (17 Nov 2026)
- **Top up bot** (`BOT_CFG.SPEND` di `data/bots.js`): 75% gratis, 17% Kartu Bulanan, 6% belanja sedang, 2% sultan. Pembelian ditentukan per bot per hari (seed): Kartu Bulanan + perpanjangan, beli acak saat main (×2,2 di tanggal gajian 25–28 & 1), borong saat banner baru (maks sekali per 3 hari). Paket & harga = `TOPUP_CFG` (bonus 2× pembelian pertama ikut berlaku). Permata berbayar → tarikan tambahan di `botGacha` (70% banner hero). Total belanja → **VIP 1–7** (tampil di Peringkat, profil, chat; VIP-mu dari `S.iap.spent`).
- **Emosi gacha** (`BOT_CFG.EMO`): 60 tarikan hero pertama diulang (`botEarlyMood`, aliran acak yang sama dengan gacha bot) → hoki (lebih rajin, jarang berhenti) / sial (lebih cepat menyerah). Pemain berbayar lebih betah. 30% pengejar banner = **penabung**: melewati sebagian banner, tarikan ditahan sampai banner incaran (atau tabungan 90 tarikan) — tampil "Menabung N tarikan" di profil.
- **Hidup berubah** (`BOT_CFG.LIFE`): bio diganti tiap 2–9 hari, 50% bot pindah hero favorit ke ★3 terbatas terbaru, 12% bot ganti nama sekali (kolam nama baru `bots/renames`, dibuat Claude; profil menampilkan "Sebelumnya: ..."). `botName(i,t)` = nama pada waktu t.
- Sifat baru memakai aliran acak terpisah (`bHash(i,31)`) supaya sifat lama bot tidak bergeser.

## Arena: serangan saat online & balas dendam
- Penyerang Tim Bertahan hanya bot yang **sedang online** pada jam serangan (`arBotOnline`).
- Bot yang kamu kalahkan bisa **membalas dendam** di sesi online berikutnya (peluang per gaya main `ARENA_CFG.revenge`, ×1,15 bila sedang apes). Log Arena memberi label "DENDAM"; bot sering menyebutmu di chat setelahnya.

## Obrolan Dunia (world chat)
- File: data `js/data/chat/` — `style.js` (cara menulis: persona, singkatan, tawa, emotikon, salah ketik), `lines.js` (kalimat per suasana & kejadian), `threads.js` (utas tanya-jawab), `brain.js` (menanggapi pesanmu); mesin `js/systems/chat.js`; tampilan `js/ui/chat.js` + `css/chat.css`. **Tambah kalimat cukup di file data**, mesin tidak perlu diubah.
- Strip 2 pesan terakhir di beranda (di atas tombol Arena) → panel obrolan penuh (ketuk nama/avatar = profil pemain).
- Obrolan bot **deterministik per menit** (seed menit + generasi dunia) → semua pemain melihat percakapan yang sama. Hanya bot yang online yang bicara; keramaian ≈ 0,085 × √online pesan/menit. ±50% bot hanya membaca.
- Isi mengikuti keadaan ASLI bot: favorit, pity, CP, tahap, liga, tabungan, top up, hoki/apes, mau berhenti. Kejadian nyata memicu reaksi: ★3 (pengumuman [Sistem] untuk ★3 terbatas, kadang diberi selamat), rate off, top up, banner/hero baru, pemain baru disambut, kembali main, ganti nama.
- Utas: pembuka + 1–4 jawaban dari bot lain (jawaban berupa fungsi bisa memakai data asli, mis. "liga kalian apa?"), jawaban salah bisa dikoreksi bot lain, penanya berterima kasih.
- Pesanmu: disimpan lokal (`aster_chat_me`). Balasan dari **Claude** bila tersedia (prompt berisi fakta game + keadaan asli calon penjawab + 16 pesan terakhir), selain itu **otak lokal** `brain.js` (pola kata kunci, ingat kota/hero favoritmu, bertanya balik). Bot yang kamu sebut saat offline membalas ketika online lagi. Tarikan ★3-mu diumumkan sistem dan diberi selamat; bot kadang memanggilmu saat kamu masuk 10 besar.
- Kolam kalimat buatan Claude (`bots/chatlines`, maks 1.600) terus bertambah tiap 20 menit saat game terbuka di claude.ai dan ikut dipakai semua bot.

## Penjualan bot → bank Telegram
- `js/systems/botsale.js`: tiap menit game melaporkan pembelian bot (sejak `BOT_CFG.SPEND.bankFrom`, maks 3 hari) ke `POST /api/botsale` (HMAC `TOPUP_CFG.secret`). Server (`bank-worker/`, tabel `botsales`, migrasi 0003) membuang duplikat per kunci lalu menambah saldo **HUN2 STUDIO** + mutasi `jual`.
- Telegram: tombol **🏢 HUN2 STUDIO** / `/toko` (saldo, penjualan hari ini/7 hari/total, pembeli terbesar, 10 transaksi terakhir), `/notif on|off` (kabar pembelian ≥ Rp799rb, default mati).
- Catatan: di GitHub Pages nama bot dibuat lokal (tanpa Claude), di claude.ai dari Claude — nama pembeli di bank mengikuti perangkat yang melapor pertama.

## Mode AI obrolan (Claude Haiku 5.5)
- Menu > Pengaturan > **Mode AI Obrolan** (ON default, `S.aiMode`). Saat ON, pemain lain di Obrolan Dunia ditulis langsung oleh Claude Haiku 5.5: membalas pesanmu dan, tiap 70–140 detik saat panel chat terbuka (4–7 menit saat di layar lain), menulis "adegan" obrolan 3–8 pesan di antara bot yang sedang online. Maks 36 panggilan/jam per perangkat. Obrolan deterministik biasa tetap jalan di sela-selanya.
- Konteks yang dikirim: jam & hari WIB, keadaan server (banner, hero terbaru, CP #1, event), keadaan akunmu (level, CP, peringkat, tim, koleksi ★3, tahap, Arena, permata, pity, VIP, kota/hero favorit yang pernah kamu sebut), **jejak aktivitasmu** 6 jam terakhir (`chatAct`: summon & hasilnya, menang/kalah tahap & dungeon, Arena, balas dendam, top up), layar yang sedang dibuka, 22 pesan terakhir, dan data asli 7 bot calon penulis (persona, favorit, CP, liga, pity, tabungan, VIP, bio, nama lama).
- Server: `bank-worker/src/ai.js` (`POST /api/ai`, `GET /api/ai/status`). Token = **GitHub secret `ANTHROPIC_API_KEY`** → dipasang workflow sebagai secret Cloudflare (tidak pernah ada di kode game). Instruksi peran ditulis di server; game hanya mengirim data berukuran terbatas. Batas: `AI_DAILY` (2.000 panggilan/hari, semua pemain) dan 20/menit per IP. Model: `AI_MODEL` di `wrangler.toml`.
- **Pengetahuan game** untuk AI = `docs/AI_PANDUAN.md` (cara main, navigasi, sistem — tulis tangan) + data asli `src/js/data/*.js` (hero & lore, senjata, perlengkapan, dunia/tahap/bos, dungeon, banner, event, misi, toko, top up, Arena), digabung otomatis oleh `tools/gen_knowledge.mjs` setiap `build.py` → `bank-worker/src/knowledge.js` (±13.500 token, di-cache dengan prompt caching; panggilan berikutnya hanya membayar ±2.000 token baru). **Fitur baru = tambahkan penjelasannya di AI_PANDUAN.md.**
- Bila server mati/kuota habis/OFF: balasan kembali ke Claude (claude.ai) atau otak lokal.

## UI pertarungan (polish, 17 Nov 2026)
- File: `js/ui/battle-hud.js` (HUD), `css/battle.css`, markup `#battle` di `src/index.html`. Mesin tetap `js/systems/battle.js` (memanggil `battleUI`, `hudWave`, `hudTick`, `hudCast`, `drawBattleBg`).
- Medan 240×300 (4:5) penuh lebar; HUD atas mengambang di langit: plakat tahap, titik gelombang (bos = merah), waktu, tombol jeda bulat. Bar HP bos besar (jejak putih) saat ada bos; di Arena dua bar tim + "ATK ×" saat Kemarahan Arena.
- Panel bawah gelap berbingkai emas: 4 kartu skill dari potongan splash art (tabir gelap turun mengikuti isi skill, HP dengan jejak merah, oranye saat HP < 30%, menyala emas + kilau + label SKILL saat siap, berkedip saat skill dipakai, "Gugur" saat KO), tombol AUTO & kecepatan berbentuk pil. Kartu mengisi ruang tersisa (maks 270px).
- Layar pendek (rasio > 10:18, mis. iPhone SE): medan dipotong 240×250 (object-fit) supaya kartu tetap muat.
- Jeda: panel berisi info tahap & keunggulan elemen. Hasil: pita MENANG/KALAH, bintang (tengah lebih besar), kartu MVP (splash), hadiah, EXP.
- Loop utama tahan error per frame (`main.js`).

## Pasang Terbaik & Tungku Peleburan (18 Nov 2026)
- Mesin `js/systems/smelt.js` (angka di `SMELT`), tampilan `js/ui/smelt.js` + `css/smelt.css`.
- **Pasang Terbaik** (`autoEquipTeam`/`autoEquipHero`): per hero tim, terkuat dulu, coba setiap senjata (kelas sama)/pelindung/aksesori dan pilih yang membuat `heroPow` tertinggi. Barang hero cadangan boleh diambil, barang hero tim lain tidak. Tombol: Tim (Formasi Terbaik kini juga memasang perlengkapan), detail hero (⚡), koleksi senjata/perlengkapan. `S.autoEq` (default ON) = jalankan otomatis setelah summon senjata / hadiah berisi barang.
- **Peleburan**: `smeltJunk` = salinan yang bukan terbaik di jenisnya & tidak dipakai (opsi termasuk yang sudah ditingkatkan). Hasil dasar per bintang di `SMELT.base` (emas + bijih + Serpihan/Kristal Bintang); barang yang ditingkatkan mengembalikan 80% material (EXP senjata → bijih, biaya Limit Break, biaya enhance) & 50% emas; tiap penempaan +50% hasil dasar. Lebur otomatis `S.autoSalv` (0 mati, 1 = ★1 bawaan, 2 = ★1–★2). Statistik `S.smelted`.
- Perbaikan: teks bonus "Penjaga + Pendukung" di layar Tim kini mengikuti `CP_BONUS.balance` (+12%, sebelumnya tertulis +5%).

## Dungeon Emas: Brankas Naga Emas (18 Nov 2026)
- Data: `js/data/dungeons.js` (`vault`, `gold:[min,maks]` per tingkat, `GOLD_DG_3STAR` = +25% bila 3 bintang). Emas dihitung `dgGold()` (`js/systems/dungeons.js`), dipakai saat menang & Sapu. Tidak menjatuhkan material/perlengkapan.
- Tingkat: I (buka 1-3, 8 stamina) 7–9rb · II (2-1, 10) 16–20rb · III (3-1, 10) 28–34rb · IV (4-1, 12) 45–55rb · V (5-1, 12) 65–80rb → ±900–6.700 emas per stamina (tahap cerita ±100–500).
- Musuh `gslime` (Slime Emas) & bos `bGold` (Raja Slime Emas, bermahkota): meminjam strip gambar slime (`sprOf`) lalu `metalize()` memetakan kecerahan ke gradasi emas (`js/art/imgsprite-enemy.js`). Saat musuh tumbang: percikan koin & angka "+G" (`coinBurst`, hiasan).
- Latar `w_vault.webp` (Higgsfield nano banana pro, referensi gaya latar gua & benteng, `art_src/tall_vault.png`, potongan y=290). Kepala dungeon kini memakai latar `w_<art>` bila ada.

## Kebangkitan ★4–★6, Bab II, Menara Kebangkitan (18 Nov 2026, update besar)
- **Data** `js/data/ascend.js` (`ASC`): pengali hero `heroRar`, level maks per bintang `heroCap` (★4 80 · ★5 120 · ★6 160, +2 per LB), senjata `wMul`/`wCapAdd`/`wExpK`, perlengkapan `gMul`/`gCap` (+20/+25/+30), biaya `cost.hero/wpn/gear[bintang tujuan]`. Bintang efektif disimpan sebagai `.asc` di objek milik pemain; tanpa `.asc` = bintang dasar. Helper: `heroStar(id)`, `wStar(k)`, `gStar(k)` (`systems/stats.js`) dipakai SEMUA tampilan & stat.
- **Target CP**: tim terbaik semua ★6 & maks ≈ **2.976.809** (cek: `node tools/cpmax.mjs`). ★4 maks ≈ 286rb, ★5 maks ≈ 1,05jt.
- **Mesin** `js/systems/ascend.js`: `ascReqs` (hero level mentok + Level Akun cukup; senjata LB 4/4 + level mentok; perlengkapan tempa mentok), `ascCan`, `doAscend` (bayar → `.asc+1`, level tidak direset). Barang ber-`.asc` tidak bisa jadi bahan tempa/peleburan dan selalu dianggap salinan terbaik (`wScore`/`gScore`).
- **UI** `js/ui/ascend.js` + `css/ascend.css`: pita ungu "Kebangkitan" di detail hero/senjata/perlengkapan, tombol "Bangkitkan ★N" di bar level hero saat mentok, layar pratinjau stat sebelum→sesudah, perayaan "TERBANGKIT!".
- **Bingkai** `css/frames.css` (dimuat setelah skin.css): `img/ui/card_r4..6.webp` (Higgsfield, `art_src/ui_kit/cards_asc.png`) → ★4 Ametis Kerajaan, ★5 Rubi Surgawi (sayap, glow merah), ★6 Prisma Ilahi (sayap, kilau pelangi + glow berdenyut). Dipakai kartu koleksi, slot tim, kartu battle, slot perlengkapan, profil bot. `stars(n)` untuk n≥4 memberi warna khusus.
- **Pertarungan berskala (penting)**: rumus DEF `100/(100+def)` tidak tahan skala ★6, jadi untuk musuh di atas kekuatan 5-5 (`DIFF_G0`=33) semua stat tumbuh linear (`enemyBase`) dan DEF dinormalkan `B.sc = g/33` di `hit()`. Arena memakai `b.sc = √(CP tim A × CP tim B)/29.000`. Hasilnya pertarungan ★6 vs musuh Bab II setegang ★3 vs 5-5 (dicek simulasi: CP/kekuatan ≈ 880–940 di semua bintang).
- **Bab II** (`js/data/worlds.js`): Dunia 6 Hutan Rembulan, 7 Kota Tenggelam, 8 Singgasana Kehampaan. CP rekomendasi `DIFF.rec`: 6-5 150rb · 7-5 700rb · 8-5 2,6jt. Emas tahap ×1,18 & EXP ×1,08 per tahap setelah 5-5 (`STAGE_RW.goldUp/expUp`). Musuh varian logam (`vEnemy` di `data/enemies.js`, gradasi `METAL.moon/deep/void/celestial`).
- **Menara Kebangkitan** (`DUNGEONS` id `tower`, `daily:5`): 5 tingkat (buka 5-5 / 6-3 / 6-5 / 7-5 / 8-3), 15 stamina, batas 5 kali/hari (menang + sapu, `dgLeft/dgUse`, hitungan `S.daily.c.dg_tower`). Drop `[min,maks,peluang]`; `badge` = Lencana Ksatria. Air Mata Dewi: T4 10%, T5 25%.
- Dungeon lama diperpanjang: Tambang & Kuil tingkat VI–VII, Brankas Emas VI–VIII (110rb–380rb emas).
- **Hadiah musim Arena** kini berisi bahan Kebangkitan (Air Mata Dewi mulai liga Berlian). Peleburan salinan ★3 +1 Kristal Kebangkitan (`ASC.smelt3`).
- **Tempo F2P** (perkiraan): ★4 pertama ±4 hari setelah 5-5; tim ★6 penuh berbulan-bulan (penghambat: 312 Air Mata Dewi). Bahan Kebangkitan tidak dijual.
- **Bot**: `botAscend` (`systems/bots.js`, angka `BOT_CFG.ASC`) — anggaran bahan sejak CP tim menembus ±27rb, urutan ★4 → ★5 → ★6. Simulasi: 30 hari ke depan top ±145rb, 120 hari ±480rb (★5 pertama), 240 hari ±780rb, belum ada ★6.
- Pengetahuan Mode AI otomatis memuat bagian "Kebangkitan" (`tools/gen_knowledge.mjs`).

## Rombak UI v2 "Navy Kerajaan & Emas" (18 Nov 2026)
- Arah gaya dikunci lewat 2 mockup Higgsfield (beranda & arena), lalu tiap elemen digenerate terpisah di latar magenta dan dipotong `art_src/ui_kit/uikit.py` → `src/img/ui/n_*.webp` (variabel CSS `--ui-n-*`).
- `css/ui2.css` (dimuat setelah skin.css, sebelum frames.css): latar aplikasi navy berpola fleur-de-lis (`n_bgtile`), bilah atas navy bergaris emas, kapsul sumber daya (`n_capsule`), nav kayu gelap bertrim emas (`n_navbar`, tab aktif bercahaya + permata biru), plakat judul navy-emas (`n_plaque`, juga judul modal & login), panel = kartu perkamen berbingkai emas (`n_card`), panel gelap (`.panel.navy`, `.panel.tcp`) = `n_panel`, tab kayu/emas (`n_tabon/off`), pill filter navy.
- Beranda baru (`ui/home.js` `homeHTML` + `css/home.css`): banner pick-up lebar, medali samping (`n_medal` + pita `n_ribbon`), plakat CP, **tombol Guild terkunci** (`ACT.guild` → modal "Segera Hadir"), papan nama hero + panah ganti hero, gelembung dialog, ticker obrolan, dok bawah: ubin Arena/Event berilustrasi (`n_artarena`, `n_artevent`, bingkai `n_tile`) + medali emas Petualangan (`n_bigmed`). `lobbyPlace()` menyesuaikan tinggi splash antara banner dan papan nama.
- Ikon baru: `guild`, `crest`, `wchat` (lembar `art_src/icon_sheets/G.png`).
- UI pertarungan tidak diubah.

## Petualangan v2 (18 Nov 2026)
- `ui/adventure.js`: tiga mode di atas (`advTab`): **Cerita** (`world`), **Dungeon** (`dg`), **Event** (`ev`, terkunci — battle event musiman belum ada; layar "Segera Hadir" `advEventHTML`). Aksi `advMode`.
- Cerita: pemilih bab (`ADV_CH`: BAB I Dunia 1–5 "Fajar Aster", BAB II Dunia 6–8 "Kebangkitan"), kartu dunia (latar `w_<art>`, bintang x/15, gembok), peta ilustrasi baru `img/bg/mp_<art>.webp` (Higgsfield, fallback `m_<art>`), jalur emas untuk tahap yang sudah dilalui, node medali (`n_node`, `n_nodeok`, `n_nodeboss`), penanda tahap sekarang, bilah "Tahap berikutnya" (CP tim vs disarankan + tombol MAJU). Posisi node `NODEPOS`.
- Dungeon: kartu pilih berilustrasi (`--dga` = latar dunia dungeon).

## Distribusi file (sejak 18 Nov 2026)
- `dist/index.html` (±13,4 MB) + `dist/audio/login.mp3` + `dist/audio/game.mp3`. Musik dipisah karena batas 16 MB per file artifact.
- `tools/sync_repo.py` ikut menyalin `dist/audio` → `audio/` di repo. Publish artifact pakai `publish_files` (mode patch) dengan tiga file: `index.html`, `audio/login.mp3`, `audio/game.mp3`.
- `music.js` `bgmUrl`: kalau `MUSIC_SRC[k]` bukan data URI, dipakai langsung sebagai URL relatif.

## OST (18 Nov 2026)
- 22 lagu Suno dari Egi di `src/audio/` (112 kbps, hening awal/akhir dipotong): `login`, `game`, `bt_w1..8` (battle per dunia), `bt_boss` (x-5), `bt_final` (8-5), `bt_dungeon`, `bt_arena`, `win` (jingle menang, tidak diulang), `st_prolog/hangat/tegang/sedih/misteri/harapan/kehampaan`.
- `bgmBattle(st)` dipanggil di `startBattle`; `win` di layar menang (juga Arena); `exitBattle` → `game`. Cerita: `STORY_BGM` per adegan (story.js), direktif `{bgm:'st_...'}` untuk ganti di tengah adegan (c8c → kehampaan saat Mata muncul); selesai cerita → `game`/`login`.
- Penjaga BGM (`bgmHealth`, tiap 3 dtk lewat `audWake`): bila lagu macet (waktu tidak maju) atau "jalan tapi bisu" (sinyal AnalyserNode sebelum volume nol ±9 dtk) → jeda & putar ulang; gagal lagi → `bgmRebuild` membuat elemen <audio> baru pada sentuhan berikutnya (iOS butuh sentuhan).
- `bgmPlay` memudar keluar 0,45 dtk lalu memudar masuk; kunci yang belum ada → `game`.

## Cerita Utama, Tutorial & Syarat Fitur (18 Nov 2026)
- **Cerita** (`js/data/story.js`, pemutar `js/ui/story.js`, gaya `css/story.css`): 24 adegan, BAB I (Dunia 1–5) & BAB II (Dunia 6–8), berakhir "Bersambung". Tiap adegan terikat tahap (`at`) sebagai `pre` (diputar sebelum pertarungan pertama tahap itu, sebelum stamina dipotong) atau `post` (ditandai `S.story.pend` saat menang pertama, diputar saat layar hasil ditutup lewat `exitBattle`/`bnext`). Prolog `at:'start'` diputar untuk pemain baru.
  - Teks 3 bahasa ada di baris yang sama (`[pembicara, ekspresi, id, en, ja]`), nama NPC di `STORY_NPC`. Pilihan Kapten `{ch:[...]}` kosmetik. Direktif lain: `{bg:k}`, `{cg:k|null}`, `{fx:'flash'|'shake'|'star'|'end'}` (`end` = kartu penutup bab: tokoh memudar, latar meredup). Suara berhenti saat baris berikutnya dimulai.
  - Aset dimuat dari folder `story/` (bukan ditanam): `bg/`, `cg/`, `ex/` (patch ekspresi wajah), `npc/`, `v/` (suara Jepang `st_<adegan>_<baris>.mp3`). `build.py` menyalin `src/story` → `dist/story` dan membuat `STORY_ASSET` (daftar file + geometri patch + ukuran NPC).
  - Tokoh = **tachie live2d** (`STORY_ASSET.tc`, `l2dStory` di `art/live2d.js`): hero diletakkan dari ujung kepala (`--T` 3,5% layar, skala 1100/h×0,92×1,32 tinggi layar), NPC ber-rig dari titik wajah (25%). Shader yang sama dengan splash hidup + napas, ayunan kepala kecil, rambut/kain, kedip acak, mulut buka-tutup selama suara tokoh berbunyi (atau teks diketik bila tanpa suara), ekspresi `a/k/d` sebagai patch (kedip & mulut nonaktif saat ekspresi). Tanpa WebGL/`file://`: gambar diam + patch ekspresi `<img>`.
  - Kontrol: ketuk (lanjut / selesaikan ketikan), AUTO (`S.storyAuto`, menunggu suara selesai), LOG, LEWATI (konfirmasi). Arsip: Petualangan › tombol **Arsip Cerita** di peta (`openStoryArchive`).
  - Pemain lama: popup sekali `storyNote()` (S.story.note) + adegan tahap yang belum diselesaikan tetap diputar normal.
- **Tutorial** (`js/ui/tutorial.js`): prolog → pertarungan 1-1 → cerita 1-1 → Beranda → Kotak Surat (Klaim Semua, pilih ★3) → Summon x10 → Formasi Terbaik → naik level hero → Petualangan. `S.tut` angka langkah | 'done'. Tidak memblokir layar; tombol **Lewati Tutorial** selalu ada. Pemain lama otomatis 'done'.
- **Menu Login**: Pengaturan › **Menu Login** (konfirmasi) dan **Hapus Progres** sama-sama kembali ke layar judul lewat `backToLogin()` (hentikan battle/cerita/suara, simpan, `openLogin`). Hapus Progres = `newGame()` (bahasa dipertahankan) → buat nama lagi → prolog & tutorial. `initUI` aman dipanggil ulang (loop game hanya sekali).
- **Syarat fitur** (`js/systems/unlock.js`, `FEAT`): Summon 1-1 · Misi & Event 1-2 · Toko 1-3 · Dungeon 1-5 · Obrolan Lv3 · Peringkat Lv5 · Peleburan Lv8 · Arena Lv10. Klik tombol terkunci → toast syarat (dicek di pengendali klik global `featOfAct`). Saat syarat terpenuhi muncul popup "Fitur Baru Terbuka!" sekali (`S.unl`; ditunda saat battle/cerita/modal/tutorial). Pemain lama: fitur yang sudah memenuhi syarat dianggap terbuka tanpa popup.
- **Isi ulang stamina** (`STAM_REFILL` di config.js): +60, maks 5x/hari, harga 100/150/200/300/400 permata (`S.daily.c.refill`). Stamina kurang saat mulai tahap → dialog isi ulang.
- **Tiket dungeon** (`DG_TIX`, `DG_RESET`, `reset` per dungeon di dungeons.js): 5 tiket per jenis per hari, **tanpa stamina**, terpakai hanya saat menang/sapu. Tiket habis → Reset (isi 5 lagi) maks 5x/hari: 50/100/150/200/250 permata (Menara Kebangkitan 100/150/200/300/400). Ikon `dgtix`.


## Efek suara
`sfx(kunci, opsi)` (js/systems/sound.js) → `sfxKey` memilih sampel (krit/elemen/kelangkaan) → `sfxPlay` memutar AudioBuffer dari `SFX_SRC` (di-decode saat gestur pertama, `audUnlock`). Jeda anti-tumpuk `SFX_GAP`, volume `SFX_VOL`, variasi pitch ±4% untuk pukulan/klik. Fallback: sintesis `SFX_LIB`.

## Akun, teman, pesan 1:1, obrolan dunia (18 Nov 2026)
Server: `bank-worker/src/game.js` (Cloudflare Worker `aster-bank` + D1, tabel di `migrations/0004_game.sql`). Game: `js/systems/net.js`, `js/ui/social.js`, `js/ui/chat.js`, kartu Masuk/Daftar di `js/ui/boot.js`.
- **Akun**: username (3–12 huruf/angka, sekaligus nama Kapten) + password (hash PBKDF2-SHA256 + salt). Sesi = token di localStorage `aster_acct` (tidak ikut data simpanan). Mode **Tamu** tetap ada (simpan lokal saja); tamu bisa "Daftarkan Akun" dari Menu dan progresnya ikut.
- **Reset**: data simpanan lama (tanpa `se:2`) otomatis mulai dari 0 saat dibuka (`SAVE_SE` di state.js).
- **Simpanan cloud**: `save()` menandai kotor → diunggah ±12 dtk (+ saat aplikasi disembunyikan). Server memegang versi `sv`; bila versi server lebih baru (diubah admin / perangkat lain) game memakai data server (ditunda selama battle/cerita).
- **Bot = akun sungguhan**: tiap bot punya baris di `players` (UID 8 angka, username, password acak — hanya hash, tidak bisa login). Nama dibuat server dengan generator yang sama persis dengan game (`tools/gen_botcfg.mjs` → `bank-worker/src/botcfg.js`). Progres bot tetap simulasi deterministik di game (sama untuk semua pemain). Ubahan admin (`ov`: lv/cp/vip, sembunyikan) diterapkan di atasnya. Game mengirim potret 100 bot teratas + bot teman tiap 15 menit untuk dilihat admin.
- **Reset bot hanya lewat Telegram** (`/resetbot`); opsi di Pengaturan dihapus. Reset juga mengosongkan seluruh riwayat Obrolan Dunia (game ikut membuang cache obrolan saat generasi bot berubah). Game melihat generasi baru lewat ping dan memuat dunia baru.
- **Teman**: maks 100. Bot menjawab permintaanmu saat ia online (±62% terima, lebih mudah bila CP-mu mendekati CP-nya) dan 0–2 bot per hari bisa mengajakmu berteman lebih dulu (dihitung deterministik di game, dicatat di server).
- **Pesan 1:1**: sesama teman, ✓ terkirim / ✓✓ dibaca, cek tiap 3 dtk saat terbuka. Bot tidak membalas.
- **Obrolan Dunia**: hanya pemain asli (obrolan bot & Mode AI dimatikan). Tamu bisa membaca, menulis butuh akun.
- **Peringkat**: bot + pemain asli (aktif 45 hari terakhir) + kamu. Ketuk nama → profil (Tambah Teman / Kirim Pesan).
- **Admin Telegram** (pemilik bot Bank Central Universe): `/akun <UID|username>` (kartu + tombol ubah Permata/Emas/Level/Stamina/Tiket/Username/Password, blokir, data JSON, daftar teman), ketik UID/username langsung, `/cari`, `/pemain`, `/set <UID|username> <kolom> <nilai>` (kolom apa saja di data simpanan, mis. `heroes.nami.lv`; nilai `hapus` = hapus kolom), `/data`, `/resetbot`, tombol 🎮 Akun Game.

### Mode AI Obrolan Dunia (Claude Haiku 5.5) — nyala/mati lewat Telegram `/ai on|off`
- Bawaan NYALA. Game yang sedang dibuka (tamu juga) mengirim konteks ke `POST /api/wc/ai`: bot yang sedang online (jadwal sesi bot) + data aslinya, info pemain, waktu WIB. Server memegang kunci global (±1 adegan per 75 dtk, tunggu adegan sebelumnya selesai), memanggil Claude, lalu menyimpan pesan bot ke `wchat` dengan jeda mengetik (ts di masa depan) → semua pemain melihat obrolan yang sama.
- Pemain asli mengirim pesan → game memanggil `kind:'reply'` → 0–3 bot online membalas (maks 1 per 12 dtk per pemain).
- Obrolan dibaca per waktu (`GET /api/wc?since=<ts>`), pesan berjadwal baru muncul saat waktunya.
- Jumlah online di Obrolan Dunia = bot yang sedang bermain + pemain asli online (sama untuk semua, AI nyala maupun mati).
- Batas panggilan harian `AI_DAILY` (wrangler.toml). Status & tombol di Telegram: `/ai`.

### Balas pesan, ingatan, privasi & stiker (18 Nov 2026)
- **Balas**: ketuk gelembung pesan → bar "↪ Membalas …" → pesan tersimpan dengan `re` (kolom `wchat.re`, migrasi 0006) dan tampil dengan kutipan.
- **Konteks AI**: 16 pesan terakhir bernomor (#n, termasuk "balas #m"), + INGATAN tiap penulis (3 pesannya sendiri dalam 12 jam terakhir). AI mengisi `re` saat menanggapi pesan tertentu. Bot yang dibalas pemain (bila online & Lv 3+) didahulukan menjawab.
- **Privasi**: data bot dikirim terpisah PUBLIK (level, CP, VIP, tim, favorit, tahap, liga) vs PRIBADI (pity, hoki/apes, top up, tabungan, hari main — hanya diketahui bot itu sendiri). Data pemain asli yang dikirim hanya yang terlihat di profil; permata, pity, top up & aktivitas TIDAK dikirim.
- **Stiker**: 12 stiker chibi hero (`src/js/data/stickers.js`, gambar `src/img/stickers/`, dibuat Higgsfield nano_banana_pro lalu dipotong `art_src/sticker_cut.py`). Pesan stiker = `:stk:<kunci>:`. Pemain memilih lewat tombol stiker di samping kolom ketik.
- **Hemat token**: game mengirim 'tick' ±30 dtk; server memutuskan: adegan AI ±100 dtk sekali bila ada yang membuka Obrolan Dunia (selain itu ±9 menit), di sela itu bot gabut kirim stiker acak **tanpa AI** (80–300 dtk sekali, kadang dibalas stiker bot lain). Claude dipanggil lagi hanya saat pemain asli menulis/membalas. Konteks ringkas (maks 5 penulis), max_tokens 280/400, pengetahuan game di system prompt yang di-cache.


## Catatan visual battle & tutorial (18 Nov 2026)
- Perisai (skill Pia) tidak lagi digambar sebagai kotak di sekitar unit; diganti ikon perisai kecil di samping bar HP. Efek `ring`/`boom` berbentuk lingkaran; bayangan kaki dibulatkan.
- Langkah tutorial `pick` (pilih hero ★3 di Kotak Surat): sorotan mengelilingi seluruh daftar hero dan gelembung Noa pindah ke atas layar (`ring`, `pos:'top'`), tombol Lewati Tutorial di kiri.

## Akun GM (18 Nov 2026)
- Kolom `players.gm` (migrasi 0007). Diatur dari Telegram: `/gm UID|username` (toggle, atau `on`/`off`), `/gm` = daftar GM, tombol 🛡 di kartu akun pemain.
- Server mengirim `gm` di /api/acc/login, /api/load, /api/ping → `NET.acct.gm` (berubah di game ±30 dtk). GM tidak ikut /api/players (Peringkat pemain lain).
- Game: `systems/gm.js` (`isGM`, `gmOpt`, `gmTick` tiap 1 dtk) + `ui/gm.js` (Panel GM di Pengaturan, tombol Menang Instan di layar Jeda).
  Opsi `S.gmo`: `inf` sumber daya tak terbatas, `unl` semua fitur (featOK) & tahap (unlocked) terbuka. Aksi: semua hero/senjata/perlengkapan, level & LB maks, level akun +10, tamatkan semua tahap, lewati tutorial & cerita, reset harian.
- Mencabut GM tidak menghapus sumber daya yang sudah terkumpul (pakai /set atau Hapus Progres bila perlu).

## Obrolan AI lebih manusiawi & bot bermain lebih nyata (18 Nov 2026)
- Persona Mode AI baru `wcPersona(i)` (ui/chat.js, aliran acak `bHash(i,777)`): cara mengetik (huruf kecil/rapi/super singkat/istilah game/logat Jawa tipis), cara tertawa, emotikon (64% tanpa), panggilan (mayoritas tanpa), satu kebiasaan kecil (dipakai sesekali), sifat (cuek, suka bantu, kompetitif, kocak, apes, analitis, newbie, ...), pekerjaan sehari-hari. Gaya wibu dihapus (juga dari CHAT_STYLE lokal).
- Prompt server (`ROLE` di bank-worker/src/game.js) ditulis ulang: contoh chat asli, daftar HINDARI (wibu, sebut nama terus, ramai-ramai menyambut, menjelaskan stiker, minta maaf/meta), ide `TOPIK` acak per adegan, `JANGAN-ULANG` (kata yang terlalu sering dipakai tiap penulis & obrolan, `overused`). Sisa gaya wibu dibuang lagi saat menyimpan.
- Balasan ke pemain: 1 penulis (75%) / 2 / 3 (lebih sering bila pertanyaan); stiker pemain 55% dicuekin tanpa memanggil AI; obrolan bot terjadwal di masa depan dibatalkan saat pemain menulis. Stiker gabut tiap 4–12 menit (malam lebih jarang), adegan malam (00–06 WIB) ±1,9× lebih jarang.
- **Aktivitas bot** `botActivity(i,now)` (systems/chat.js): saat online bot benar-benar memainkan fitur yang sudah terbuka untuknya — awal sesi ambil hadiah & misi, push tahap berikut (macet di bos bila CP kurang), Dungeon (setelah 1-5; Menara bila CP ≥27rb), Arena (Lv 10+), naik level/senjata/perlengkapan, gacha (★3 dari riwayat gacha aslinya), nabung, auto. Masuk ke konteks AI (SEDANG, pribadi) dan status kasar di profil (Online · di Petualangan/Dungeon/Arena/Summon).
- Arena: bot di bawah Lv 10 tidak ikut papan Arena; poin baru dihitung sejak bot mencapai Lv 10 (`botLvTime`).
- Level hero bot di awal main dibatasi emas: maks `2+3×level akun` (Lv1 ±5), mulai Lv 8 mengikuti batas akun seperti biasa.
