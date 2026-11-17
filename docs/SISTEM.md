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

## Roster (13 hero)
| Hero | ★ | Elemen | Role | Skill | Senjata signature ★3 |
|---|---|---|---|---|---|
| Raika (terbatas) | 3 | Gelap | Ranger | AoE | Busur Guntur Raijin (terbatas) |
| Sakuya (terbatas) | 3 | Api | Warrior | Single | Katana Hanafubuki (terbatas) |
| Seraphine | 3 | Cahaya | Warrior | AoE | — (memakai pedang ★3 standar) |
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
- Pembayaran memakai bot Telegram **Bank Central Universe** milik Egi: game membuat pesanan → bot menagih & memotong saldo → bot membalas kode voucher HMAC-SHA256 yang terikat ke pesanan → kode ditempel di game. Kode tidak bisa dipakai dua kali atau untuk pesanan lain. Pesanan kedaluwarsa 24 jam.
- Username bot disimpan di `S.iap.bot` (diatur pemain lewat tombol Atur). SHA-256/HMAC ditulis murni JS (tanpa crypto.subtle) agar jalan di file:// dan http://.
- Secret ada di kode game (repo publik) — wajar karena uang & permata sama-sama fiktif; tujuannya mencegah salah ketik, bukan keamanan sungguhan.
