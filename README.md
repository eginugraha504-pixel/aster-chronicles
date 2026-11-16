# Aster Chronicles: Ksatria Piksel

**Main sekarang:** https://eginugraha504-pixel.github.io/aster-chronicles/

- Di iPhone: buka link di Safari → Share → **Add to Home Screen**, lalu main dari ikon "Aster" (layar penuh, progres tersimpan).
- `index.html` di akar repo = game siap main (satu file, semua aset tertanam).
- Build ulang dari source: `python3 tools/build.py` → `dist/index.html`, lalu salin ke `index.html` di akar.

---

# Aster Chronicles: Ksatria Piksel — Source

Game gacha pixel chibi (UI bergaya gacha mobile modern) (portrait/mobile) dengan seni piksel yang digambar sepenuhnya oleh kode (tanpa file gambar).
Source dipecah per bagian, lalu digabung menjadi **satu file** `dist/index.html` untuk dimainkan atau di-publish.

```
python3 tools/build.py      # gabungkan src/ -> dist/index.html
```

## Struktur

```
src/
  index.html          kerangka HTML (markup layar, battle, modal)
  manifest.txt        URUTAN muat file. File baru wajib didaftarkan di sini
  fonts/              font .woff2 (Lilita One, M PLUS Rounded 1c — SIL OFL), disematkan saat build
  css/                tema "Parchment Fantasy"
    fonts.css         @font-face (url(fonts/..) diubah jadi data URI oleh build.py)
    base.css          token warna, font, tombol, panel, elemen kecil
    shell.css         top bar, nav bawah, judul, tab, modal, toast
    home.css          Beranda (karakter besar, banner, tombol bulat)
    collection.css    kartu hero/senjata, detail, perlengkapan, CP, Tim
    adventure.css     peta & tahap
    summon.css        banner gacha & animasi summon
    missions.css      misi, event, kotak surat
    battle.css        layar pertempuran
  js/
    core/util.js      helper kecil ($, rnd, pick, fmt, shade, today)
    core/i18n.js      sistem bahasa: T('teks'), setLang(), penimpa data per bahasa
    lang/en.js, ja.js terjemahan English & 日本語 (UI + nama hero, senjata, misi, event, surat, dunia)
    data/             <<< KONTEN & BALANCING: paling sering diedit
      config.js       angka balancing: rate gacha, pity, harga, stat dasar, bonus CP
      elements.js     elemen, role, tipe skill, kelas senjata
      heroes.js       daftar hero (stat, skill, kelas senjata, tampilan)
      weapons.js      daftar senjata ★1-★3 (stat, pasif signature, palet warna)
      enemies.js      daftar musuh (stat & tampilan)
      worlds.js       dunia & tahap (5 tahap per dunia dibuat otomatis)
      banners.js      banner gacha hero & senjata
      missions.js     misi harian & pencapaian
      mail.js         isi Kotak Surat (paket pemula)
      materials.js    material senjata (bijih EXP & material Bintang untuk Limit Break)
      dungeons.js     dungeon farming (tingkat, syarat buka, drop, stamina)
      events.js       event: login 7 hari, misi pemula, event terbatas (Misi > tab Event)
    art/              pixel art prosedural
      heroes/seraphine.js, sakuya.js   modul sprite khusus (★3 signature)
      heroes/generic.js                generator chibi generik (dipakai lewat data `gen`)
      hero-art.js     registri sprite hero, cache frame, potret
      weapon-skin.js  senjata terpasang -> tampilan di tangan hero
      weapon-icons.js ikon senjata 32x32 otomatis dari kelas + palet + bintang
      enemies.js      generator musuh
      backgrounds.js  latar pertempuran, peta & lobi
      icons.js        ikon UI 16×16 prosedural (garis tepi & bayangan otomatis), tambah di ICON_DRAW
      home-bg.js      latar Beranda: alun-alun kota + kastil Aster, beranimasi
    systems/          logika tanpa UI
      state.js        save/load/migrasi (localStorage)
      stats.js        stat hero, senjata, Combat Power tim (siap untuk PvP / Guild War)
      stages.js       pembuat tahap dari data dunia
      gacha.js        roll, pity, duplikat
      weapons.js      level senjata (EXP bijih), Limit Break, isi otomatis
      dungeons.js     tahap dungeon, roll drop, Sapu (sweep)
      mail.js         kirim/klaim surat, hadiah item (tiket, hero, senjata)
      events.js       progres & klaim event, counter evCount(), masa berlaku
      battle.js       pertempuran real-time
      sound.js        mesin audio: 31 SFX sintetis (nada, derau, lonceng, reverb), sfx('nama',{opsi})
    ui/               layar & modal
      core.js, home.js, heroes.js, adventure.js, summon.js, missions.js
      actions.js      semua aksi tombol (data-act="...")
    main.js           loop & init
tools/build.py        penggabung
```

## Resep cepat

### Tambah hero baru (generik)
Tambah 1 entri di `data/heroes.js`:
```js
{id:'yuna',name:'Yuna',title:'Penari Angin',r:2,el:'air',role:'ranger',skill:'single',mult:3.2,
 sk:'Tarian Badai',lore:'...',
 wcls:'bow',
 gen:{hair:'twin',hat:'feather',weapon:'bow',pal:{ /* salin palet hero lain lalu ubah warnanya */ }}}
```
Tidak perlu menyentuh file lain. Hero otomatis muncul di gacha, koleksi, battle, dan bisa memakai senjata kelasnya.
Tambahkan juga senjata signature-nya (lihat bawah) dengan `owner:'yuna'`.

### Tambah hero dengan sprite khusus
1. Buat `js/art/heroes/<nama>.js` mengikuti pola `seraphine.js`. Modulnya mengembalikan `{draw, anims, icon, paintW, strike}`.
2. Daftarkan file itu di `manifest.txt` (sebelum `hero-art.js`) dan di `ART_MODULES` dalam `hero-art.js`.
3. Di `data/heroes.js` pakai `art:'<nama>'`.

### Tambah senjata
Tambah 1 entri di `data/weapons.js`. Ikon dan tampilan di tangan hero dibuat otomatis dari `cls`, `pal`, dan `r`:
```js
{id:'badai',name:'Busur Badai',r:3,cls:'bow',owner:'yuna',atk:118,sub:['crit',10],sig:.35,
 sigTxt:'Skill +35% damage.',pal:{m:[4 warna],t:[3 warna],g:[3 warna]}}
```

### Tambah musuh
Tambah entri di `data/enemies.js` dengan `look` (lihat komentar di file), lalu pakai id-nya di `mobs` atau `boss` pada `data/worlds.js`.

### Tambah dunia
Tambah entri di `data/worlds.js`. Lima tahap, gelombang musuh, hadiah, dan CP yang disarankan dibuat otomatis.

### Tambah surat / hadiah
Tambah entri di `data/mail.js`. `cond` menentukan kapan surat dikirim (misalnya `()=>S.lv>=20`). Hadiah bisa `gems, gold, stam, exp, tixH, tixW, hero, weapon, pickHero`.
Untuk surat sekali kirim dari kode (kompensasi, event), pakai `sendMail({id,from,title,body,rw})`.

### Tambah event
Tambah entri di `data/events.js`:
- `type:'login'`: hadiah per hari login (`days:[{rw},...]`).
- `type:'missions'`: daftar misi. Progresnya bisa dari fungsi `prog` atau dari counter event `cnt` (`summon`, `clear`, `boss`, `lvup`). Counter hanya dihitung selama event aktif.
- `dur:14`: event terbatas 14 hari sejak pertama dilihat pemain. Tanpa `dur`, event bersifat permanen.

### Dungeon & upgrade senjata
- Untuk menambah dungeon atau tingkat, tambah entri di `data/dungeons.js`. Tahap pertarungannya dibuat otomatis dengan kunci `<id>-<tingkat>`.
- Material baru ditambahkan di `data/materials.js` beserta ikonnya di `ICON_DRAW`.
- Angka level maks, pertumbuhan stat, kebutuhan EXP, dan biaya Limit Break diatur di `data/config.js` (`WPN_*`).

### Bahasa
- Teks UI ditulis dalam bahasa Indonesia dan dibungkus `T('...')`. Terjemahannya ada di `I18N.en` / `I18N.ja`, dengan teks Indonesia sebagai kuncinya. Teks yang belum diterjemahkan otomatis tampil dalam bahasa Indonesia.
- Teks data (hero, senjata, musuh, misi, event, surat, dunia) diterjemahkan di `I18D.<bahasa>` berdasarkan id.
- Kalau menambah teks Jepang baru, jalankan `tools/subset_ja.py` supaya hurufnya ikut masuk ke font.
- Untuk bahasa baru, buat `js/lang/<kode>.js`, daftarkan di `LANGS` (`core/i18n.js`), lalu tambahkan ke `manifest.txt`.

### Ubah balancing
Semua angka (rate 3/19/78, pity 80, rate on/off, harga summon, stat dasar, bonus CP tim, kesulitan, hadiah tahap) ada di `data/config.js`.

## Catatan
- Script bersifat global dan dimuat berurutan sesuai `manifest.txt`.
- Mengganti `SAVE_KEY` di `config.js` mereset progres pemain. Selain itu, `migrate()` di `state.js` otomatis membersihkan save lama (hero/senjata/perlengkapan yang dihapus, kelas yang tidak cocok, dll).

## Peta kode — mau ubah apa, buka file mana
| Mau ubah | File |
|---|---|
| Angka balance (rate gacha, pity, rate on/off, harga, stat, kesulitan, hadiah tahap, bos, heal antar gelombang) | `js/data/config.js` |
| Aturan gacha (satu fungsi untuk pemain & bot) | `js/systems/gacha.js` → `gachaRoll()` |
| Hero / senjata / perlengkapan / musuh / dunia | `js/data/heroes.js`, `weapons.js`, `gear.js`, `enemies.js`, `worlds.js` |
| Banner, event, misi, surat, toko | `js/data/banners.js`, `events.js`, `missions.js`, `mail.js`, `shop.js` |
| Logika battle (target, skill, gelombang) | `js/systems/battle.js` |
| Bot & peringkat | `js/data/bots.js` (angka), `js/systems/bots.js` (mesin), `js/ui/leaderboard.js` |
| Splash art | `src/img/splash/`, `js/art/splash.js`, `js/ui/splash.js` |
| Teks bahasa Inggris / Jepang | `js/lang/en.js`, `js/lang/ja.js` |
| Tampilan per layar | `js/ui/<layar>.js` + `css/<layar>.css` |

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

## Roster (12 hero)
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

## Splash Art (ilustrasi anime)
- Taruh file `src/img/splash/<heroId>.webp` dengan latar transparan. `build.py` menyisipkannya otomatis sebagai `SPLASH_SRC`. Hero tanpa file tetap memakai sprite piksel.
- Dari hasil greenscreen: hapus hijau (alpha dari selisih G − max(R,B), lalu despill), potong ke tepi karakter, tinggi 1000 px, WebP kualitas ±84 (±110 KB per hero).
- `js/art/splash.js`: `splash(id)`, `splashHTML(id,cls)`, dan `SPLASH_FOCUS` (titik wajah [x%,y%] untuk crop cut-in skill). Isi focus untuk setiap splash baru.
- **Splash 12 hero = versi terbaru dari Egi** (PNG transparan 1744×2336, sumber di `art_src/splash/<id>.png`). Di-crop ke batas karakter (+8 px), di-resize ke tinggi 1100 px, lalu disimpan sebagai webp q88 di `src/img/splash/`. Titik fokus wajah ada di `SPLASH_FOCUS` (`art/splash.js`).
- **Beranda:** bila hero beranda punya splash, `homeHTML` menampilkan splash besar (`.hstage.hsp`) menggantikan sprite piksel. `lobbyPlace` (mode splash) membuat karakter setinggi ruang dari bawah banner sampai tombol bawah (`SINK` = bagian kaki yang tersembunyi di balik tombol). Gelembung dialog ada di bawah, tepat di atas tombol Petualangan, dengan ekor ke atas.
- **Gelembung dialog (`HB` di `ui/home.js`):** tersembunyi secara default. *Idle*: muncul sendiri ±10 detik setelah masuk beranda, lalu tiap 1–3 menit (acak) memakai `lines`, tampil beberapa detik lalu hilang. *Disentuh*: karakter melompat dan mengucapkan `poke` (dialog "diganggu" sesuai kepribadian; field `poke` di `data/heroes.js` + terjemahan en/ja). Hero tanpa splash memakai kanvas piksel dengan perilaku gelembung yang sama.
- Dipakai di: detail hero (panggung + tombol "Lihat art" layar penuh, `js/ui/splash.js`), reveal ★3 saat summon, banner pick-up, dan cut-in skill di battle. Animasinya napas + goyang halus (CSS), mati otomatis bila perangkat meminta reduced motion.


## Polish v polish-4 (refresh)
- **Isi slot senjata otomatis**: hero baru langsung memakai senjata menganggur dengan kelas yang sama (senjata signature didahulukan). Kalau senjata signature datang belakangan dan slot pemiliknya kosong, langsung dipasang. Senjata yang sudah dipasang pemain **tidak pernah** diganti (`autoFillWpn` di systems/weapons.js).
- **Titik merah di kartu hero** (`wpnHint` di ui/heroes.js): muncul kalau slot senjata kosong padahal ada senjata menganggur, atau senjata signature-nya menganggur.
- Label kartu perlengkapan pakai jenisnya: Rompi / Zirah / Jubah / Cincin / Kalung (`GKIND` di data/gear.js), tidak lagi terpotong jadi "Pelin…".
- Nama pendek banner hero memakai nama hero (Raika / Sakuya), jadi tidak ada lagi "Raijin" dengan wajah Raika di beranda. Banner senjata tetap Raijin / Sakura.
- `render()` jatuh ke beranda kalau tab tidak dikenal (pengaman).
- Judul sambutan tidak lagi dobel "Kapten Kapten" kalau nama masih bawaan.
- Hasil cek: fuzz 2.500 aksi acak tanpa error, i18n EN/JA lengkap, 60 fps di beranda & battle, save ±15 KB.

## Latar ilustrasi (Higgsfield)
- Dibuat dengan Higgsfield (Nano Banana, ±2 credit per gambar), lalu **diperkecil ke grid piksel game** (median-cut 64 warna, tanpa dither) supaya menyatu dengan sprite.
- `src/img/bg/`: `w_<art>.webp` latar battle 240×210, `m_<art>.webp` peta petualangan 90×160, `key.webp` key art layar judul 384×688. `build.py` menyuntikkannya sebagai `BGIMG_SRC`.
- `art`: grass / cave / castle / storm / summit, diisi di data/worlds.js dan data/dungeons.js (Tambang → cave, Kuil Bintang → summit). Stage membawa `st.art`.
- `bgArt(key)` di js/art/bgart.js: kalau gambar belum ada atau belum termuat, otomatis memakai latar prosedural `makeBG()`.
- File resolusi penuh (2400×1792, key art 1536×2752) disimpan di `art_src/`, **tidak** ikut di-build. Untuk menambah dunia baru: generate 4:3 tanpa karakter dengan tanah tengah kosong, crop 8:7, perkecil ke 240×210, simpan sebagai `w_<art>.webp`.
- Layar judul: `<img id="lgbg" class="kart">` dengan zoom pelan (dimatikan kalau prefers-reduced-motion).
- Beranda: `home_day.webp` / `home_eve.webp` (288×512). Versi senja dipakai jam 17.00–04.59 menurut jam perangkat (`homeArt()` di ui/home.js). Tanpa gambar, beranda kembali ke kota prosedural.

## Ikon ilustrasi (Higgsfield)
- Semua 70 ikon (UI, mata uang, material, elemen, 21 senjata, 12 perlengkapan) dibuat dari 5 lembar grid Higgsfield. Lembar UI dipakai sebagai referensi gaya untuk lembar lainnya, plus satu lembar tambahan untuk bulan sabit.
- Lembar asli dan pemotongnya ada di `art_src/icon_sheets/` (`iconify.py`): grid dipotong, latar magenta/hijau dibuang dengan flood-fill dari tepi sel (garis tepi gelap menahan isian), lalu diperkecil ke grid piksel. Ukurannya 32 px untuk UI, 48 px untuk senjata, 40 px untuk perlengkapan, disimpan 2× dengan nearest.
- `src/img/icons/<kunci>.webp`, kuncinya: nama `ICON` (home, gem, rank…), `el_<elemen>`, `w_<id senjata>`, `g_<id perlengkapan>`. `build.py` menyuntikkannya sebagai `ICONIMG_SRC`, lalu `js/art/iconart.js` (dimuat tepat sebelum main.js) menimpa ikon kode.
- Ikon tanpa file tetap memakai versi kode (`pxIcon`, `weaponIcon`, `gearIcon`). Untuk senjata atau perlengkapan baru: tambahkan file `w_<id>.webp` / `g_<id>.webp`. Kalau belum ada, ikon otomatis digambar kode.

## Skin UI (Higgsfield)
- Arah gaya "parchment fantasy deluxe": bingkai kayu ukir dengan sudut emas, perkamen, tombol permata 3D, plakat judul bertopi emas, dan bingkai kartu perunggu/perak/emas sesuai rarity. Dikunci lewat 2 mockup (lembar ikon dan key art sebagai referensi), lalu tiap elemen digenerate terpisah di latar magenta.
- `src/img/ui/*.webp` (±63 KB, resolusi 2× ukuran tampil). `build.py` menyuntikkannya **sekali** sebagai variabel CSS `--ui-<nama>`, lalu `css/skin.css` (dimuat paling akhir) memakainya sebagai 9-slice `border-image`.
- Slice (piksel gambar → tebal tampil): panel 24→12, modal 44→22, plakat 18/28→9/14, tombol 14→7, tab 16/16/8→8/8/4, kartu 24→8, inset 20→10.
- Panel dengan latar sendiri dikecualikan, contohnya `.panel.tcp` (CP TIM) yang memakai bingkai emas di atas latar ungu. Kalau menambah panel berwarna khusus, beri aturan serupa di skin.css.
- Mematikan skin: hapus `css/skin.css` dari manifest, dan tema CSS lama kembali utuh.
- Alat potong: `art_src/ui_kit/uikit.py` + `seg.py`. Lembar aslinya tidak ikut di zip.

## Sprite ilustrasi (Higgsfield) — semua hero & musuh
- 12 hero + 6 musuh + 3 bos memakai strip 8 frame 88×88 (`src/img/sprites/h_<id>.webp`, `e_<tipe>.webp`, total ±230 KB) → `SPRITE_SRC`.
  Urutan frame: 0 idle · 1 napas · 2–3 jalan · 4 ancang-ancang · 5 serang · 6 kena hit · 7 skill.
- Gaya dikunci dari lembar Seraphine (job e76edb88…) sebagai referensi pertama; desain tiap hero dari sprite lama + splash. Tiap hero digenerate 2 varian, dipilih yang terbaik (Lumi diulang).
- Pipeline `art_src/sprites/spritify.py`: potong grid 4×2 → buang magenta (flood-fill) → buang potongan dari sel tetangga → skala seragam per karakter (tinggi frame idle = 70 px hero) → kaki rata di baris 78, jangkar horizontal dari pusat kaki → palet bersama 48 warna.
- `js/art/imgsprite.js`: `sprIdx(f)` memetakan parameter animasi lama (pose/legs/bdy/face) ke frame; `HERO_ART[id]` diganti otomatis bila strip ada. `IMG_ANIMS` = durasi animasi baru.
  `js/art/imgsprite-enemy.js`: membungkus `ENE.draw`; slime biasa diwarnai sesuai elemen (multiply).
- Semua penggambar memakai ukuran logis 44×44 (battle `drawImage(...,44,44)`, beranda & potret membaca lebar kanvas) jadi resolusi 2× tetap tajam.
- `sprReady()` menunggu semua gambar ter-decode saat boot (langkah "Melukis para hero").
- Catatan: sprite memegang senjata khasnya sendiri (senjata yang dipasang tidak lagi tergambar di tangan). Tanpa file strip → sprite kode lama tetap dipakai.

## Dash melee
- `js/systems/dash.js`: semua unit melee (`ROLE[role].melee`: petarung & penjaga, hero maupun musuh/bos) melesat ke depan target → tebas → lompat balik.
  Fase `wait → in (0,13 dtk) → hold (0,17) → out (0,22)`; serangan mengenai saat tiba. Skill `single` melee (mis. Iai Sakuya) juga dash setelah cut-in.
- Efek: jejak bayangan warna elemen, garis kecepatan, debu di titik awal, tebasan + benturan dari `src/img/sprites/fx_melee.webp` (lembar VFX Higgsfield, putih → diwarnai elemen), getaran layar, *hitstop* 0,055 dtk (0,09 untuk skill).
- Beberapa penyerang ke target yang sama digeser sedikit supaya tidak menumpuk. Saat battle berakhir, dash yang belum selesai otomatis kembali ke posisi.


## Suara karakter (dub Jepang)
- 12 hero di-dub dengan **ElevenLabs Eleven v4** lewat Higgsfield. Tiap hero punya satu suara preset yang dipilih Egi lewat audisi (`art_src/voice/cast.json`): Seraphine Luna, Sakuya Maya, Raika Helena, Mira Zoe, Noa Chloe, Pia Gracie, Rin Kayla, Vela Sloane, Bruna Petra, Nami Skye, Kuro Una, Lumi Annie.
- 75 klip di `src/voice/`: `<hero>_l<i>` (dialog idle = `HD.lines[i]` versi Jepang), `<hero>_p<i>` (dialog disentuh = `HD.poke[i]`), `<hero>_sk` (teriakan nama skill). Daftar teks di `art_src/voice/clips.json`. Klip dipotong heningnya, dinormalisasi (-16 LUFS), lalu mono 24 kHz 48 kbps; total ±1,3 MB.
- `tools/build.py` menanamnya sebagai `VOICE_SRC`; `js/systems/voice.js` memutarnya (`voice(kunci)`, satu klip sekaligus).
- Diputar saat: gelembung idle beranda, karakter disentuh, cut-in skill (hero), dan reveal ★3 summon (`_l0`). Suara selalu Jepang, teks gelembung mengikuti bahasa UI.
- Pengaturan: Suara Karakter ON/OFF (`S.voice`) dan volume Pelan/Sedang/Keras (`S.vvol`, bawaan .75).
- Menambah klip: buat mp3 dengan nama kunci di atas di `src/voice/`, lalu build ulang.


## Splash hidup ala Live2D (hero ★3)
- Seraphine, Sakuya, dan Raika punya splash hidup: napas (dada + badan atas), rambut dan kain bergelombang (ujung bergerak paling jauh), kedip 3 tahap dengan jeda acak, partikel cahaya halus, plus efek khas: kilau menyapu pedang Seraphine, tebasan dan api rubah Sakuya berdenyut, petir busur Raika berkedip.
- Mesin: `js/art/live2d.js`. `splashHTML()` memberi `data-live` pada `.spw` hero yang punya rig, lalu loop 30 fps membuat `<canvas class="spl live">` pengganti `<img>`. Canvas memakai CSS yang sama, termasuk `object-fit`, jadi otomatis pas di beranda, detail hero, Lihat Art, banner, dan reveal summon. Semua instance digambar lewat **satu** konteks WebGL bersama, dan hanya yang terlihat di layar.
- Aset: `src/img/rig/<hero>_mask.png` (R rambut, G kain, B efek cahaya; ½ resolusi) dan `<hero>_eyes.png` (atlas setengah | tertutup). Konfigurasi koordinat (kotak mata, kepala, dada, pinggang, garis pedang) ada di `RIG` dalam `live2d.js`. Pembuat mask: `art_src/rig/masks.py` (zona poligon per hero + pengecualian senjata/armor).
- Kedip: gambar mata tertutup dibuat dengan Higgsfield nano_banana_pro (edit dari splash asli), diselaraskan otomatis, lalu area mata dideteksi dari selisih gambar. Tahap "setengah" Sakuya/Raika = campuran 55% (hasil edit setengahnya jadi wink).
- Resolusi adaptif: kalau rata-rata waktu gambar > 14 ms (HP lemah), resolusi turun bertahap sampai 45%, lalu naik lagi kalau lancar. Tanpa WebGL atau dengan `prefers-reduced-motion`, splash diam biasa yang dipakai.
- Menambah hero: buat mask + atlas mata (lihat `masks.py`), salin ke `src/img/rig/`, lalu tambahkan entri di `RIG`.


## Splash studio HUN2 STUDIO
- Layar pertama saat game dibuka: logo HUN2 STUDIO (gaya stempel hanko Jepang, dibuat dengan Higgsfield GPT Image 2.6, latarnya dibuat transparan) di atas kertas krem, dengan kelopak sakura jatuh dan disclaimer "Game masih dalam tahap pengembangan" (id/en/ja sesuai bahasa tersimpan).
- Markup statis `#studio` ada di `src/index.html`. Logonya (`src/img/studio/logo.webp`) ditanam langsung ke HTML oleh `tools/build.py` (`__STUDIO_LOGO__`), jadi langsung tampil sebelum script besar selesai dimuat. Gaya ada di `css/studio.css`.
- `studioSplash()` di `ui/boot.js` menutupnya sekitar 3,4 detik sejak halaman dibuka (minimal 1,8 detik setelah script jalan). Loading tetap berjalan di belakang. Ketuk untuk melewati. Dilewati otomatis dengan `#skipboot`.


## Musik latar
- **Layar login** (setelah splash studio): "Eternal Sky", `src/audio/login.mp3`, volume .55.
- **Di dalam game** (setelah login): "Starbound Prologue", `src/audio/game.mp3`, volume .4 supaya efek suara dan suara karakter tetap jelas.
- Keduanya dikompres ke 96 kbps stereo. `tools/build.py` menanamnya sebagai `MUSIC_SRC`, dan `js/systems/music.js` memutarnya: `bgmPlay('login')` di `openLogin`; di `enterGame` musik login memudar (`bgmStop`), lalu `bgmPlay('game')` masuk sekitar 1,5 detik kemudian. Volume per lagu ada di `BGM_VOL`.
- Diputar lewat `<audio>` + Web Audio gain supaya fade dan volume berfungsi di iOS. Sebelum ada sentuhan pertama, permintaan putar ditunda, lalu dilanjutkan oleh `audUnlock()` (ketuk splash HUN2 untuk langsung mendengarnya di layar login). Musik berhenti saat aplikasi di latar belakang dan lanjut saat kembali.
- Pengaturan: Musik ON/OFF (`S.music`), berlaku untuk layar mana pun yang sedang tampil.
