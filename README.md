# Aster Chronicles: Ksatria Piksel

**Main sekarang:** https://eginugraha504-pixel.github.io/aster-chronicles/

- Di iPhone: buka link di Safari → Share → **Add to Home Screen**, lalu main dari ikon "Aster" (layar penuh, progres tersimpan).
- `index.html` di akar repo = game siap main (satu file, semua aset tertanam).
- Build ulang dari source: `python3 tools/build.py` → `dist/index.html`, lalu salin ke `index.html` di akar.

---

# Aster Chronicles: Ksatria Piksel — Source

Game gacha anime pixel-chibi (portrait/mobile) buatan **HUN2 STUDIO**. Satu file HTML: source dipecah per bagian, lalu digabung menjadi `dist/index.html`.
Ilustrasi, sprite, ikon, skin UI, logo, dan suara dibuat dengan Higgsfield; kalau aset tidak ada, game jatuh ke seni piksel prosedural dari kode.

```
python3 tools/build.py        # src/ -> dist/index.html (±13,5 MB, semua aset tertanam)
python3 tools/voice.py status # cek kelengkapan dub Jepang
python3 tools/sync_repo.py    # salin build + source ke repo GitHub lokal (lalu commit & push)
```

Dokumen lain:
- **docs/ASET.md** — asal setiap aset, model Higgsfield, skrip pengolah, cara menambah (termasuk suara & aktor).
- **docs/SISTEM.md** — detail & riwayat tiap sistem (balance, gacha, bot, arena, login, iPhone, dll).

## Struktur

```
src/
  index.html        kerangka HTML (studio splash, loading, login, layar, battle, modal)
  manifest.txt      URUTAN muat semua css/js. File baru WAJIB didaftarkan di sini
  css/              fonts · base · shell · home · collection · adventure · summon · missions
                    battle · arena · boot · studio · skin (dimuat terakhir: bingkai 9-slice)
  fonts/            Lilita One + M PLUS Rounded 1c (latin + subset Jepang)
  img/              splash/ rig/ sprites/ bg/ icons/ ui/ studio/   (lihat docs/ASET.md)
  audio/            login.mp3, game.mp3 (musik latar)
  voice/            <hero>_l<i> / _p<i> / _sk .mp3 (dub Jepang)
  js/
    core/           util.js (helper), i18n.js (T(), setLang)
    data/           <<< KONTEN & ANGKA — paling sering diedit
      config.js       balance: rate gacha, pity, harga, stat, bonus CP, stamina
      elements.js     elemen, role, tipe skill, kelas senjata
      heroes.js       12 hero (stat, skill, dialog lines/poke)
      weapons.js · gear.js · materials.js · enemies.js · worlds.js · dungeons.js
      banners.js · missions.js · events.js · mail.js · shop.js
      bots.js         dunia pemain bot (kurva progres, profil, nama)
      arena.js        Arena PvP (tiket, liga, hadiah, Elo)
    lang/           en.js, ja.js (kunci = teks Indonesia)
    art/            sprite & gambar
      heroes/*.js     sprite kode lama (cadangan) · hero-art.js registri sprite & potret
      imgsprite.js    sprite ilustrasi (strip 8 frame) · imgsprite-enemy.js
      splash.js       splash art + SPLASH_FOCUS · live2d.js splash hidup WebGL (★3)
      icons.js        ikon kode (pxIcon) · iconart.js ikon ilustrasi (dimuat terakhir)
      backgrounds.js · bgart.js · home-bg.js · enemies.js · weapon-*.js · gear-icons.js · sprite.js
    systems/        logika tanpa UI
      state.js        save/load/migrasi (localStorage, SAVE_KEY)
      stats.js        stat hero/senjata/perlengkapan, CP tim
      gacha.js · weapons.js · gear.js · dungeons.js · shop.js · mail.js · events.js · stages.js
      battle.js       pertempuran real-time (+ mode simulasi B.sim) · dash.js serangan melee
      bots.js         mesin pemain bot · arena.js mesin Arena PvP
      sound.js        SFX sintetis · music.js BGM · voice.js dub · platform.js iOS/Safari
    ui/             layar & modal
      core.js (render, modal, toast) · actions.js (semua data-act) · boot.js (studio, loading, login)
      home.js · heroes.js · gear.js · adventure.js · summon.js · splash.js
      missions.js · events.js · mail.js · shop.js · leaderboard.js · arena.js
    main.js         loop & init
art_src/            bahan mentah + skrip pengolah aset (PNG besar tidak ikut repo)
docs/               ASET.md, SISTEM.md
tools/
  build.py          penggabung src/ -> dist/index.html
  voice.py          alat dub Jepang (status/sync/jobs/fetch/process)
  subset_ja.py      subset font Jepang
  sync_repo.py      salin ke repo GitHub
```

## Peta kode — mau ubah apa, buka file mana
| Mau ubah | File |
|---|---|
| Angka balance (rate gacha, pity, rate on/off, harga, stat, kesulitan, hadiah tahap, bos, heal antar gelombang) | `js/data/config.js` |
| Aturan gacha (satu fungsi untuk pemain & bot) | `js/systems/gacha.js` → `gachaRoll()` |
| Hero / senjata / perlengkapan / musuh / dunia | `js/data/heroes.js`, `weapons.js`, `gear.js`, `enemies.js`, `worlds.js` |
| Banner, event, misi, surat, toko | `js/data/banners.js`, `events.js`, `missions.js`, `mail.js`, `shop.js` |
| Logika battle (target, skill, gelombang) | `js/systems/battle.js` |
| Suara (dub) | `art_src/voice/voices.json`, `tools/voice.py`, `js/systems/voice.js` |
| Musik latar | `src/audio/`, `js/systems/music.js` (`BGM_VOL`) |
| Splash hidup (Live2D) | `js/art/live2d.js` (`RIG`), `art_src/rig/masks.py` |
| Splash studio, loading, login | `js/ui/boot.js`, `css/studio.css`, `css/boot.css` |
| Kompatibilitas iPhone | `js/systems/platform.js` |
| Bot & peringkat | `js/data/bots.js` (angka), `js/systems/bots.js` (mesin), `js/ui/leaderboard.js` |
| Arena PvP | `js/data/arena.js` (angka), `js/systems/arena.js` (mesin), `js/ui/arena.js` |
| Splash art | `src/img/splash/`, `js/art/splash.js`, `js/ui/splash.js` |
| Teks bahasa Inggris / Jepang | `js/lang/en.js`, `js/lang/ja.js` |
| Tampilan per layar | `js/ui/<layar>.js` + `css/<layar>.css` |

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

Supaya setara hero lain (semuanya opsional, tanpa ini hero tetap jalan dengan sprite kode):
1. `lines` / `poke` di heroes.js (dialog beranda) + terjemahannya di `lang/en.js` & `ja.js`.
2. Sprite battle `img/sprites/h_<id>.webp`, splash `img/splash/<id>.webp` + titik wajah di `SPLASH_FOCUS` — lihat docs/ASET.md.
3. Suara: audisi aktor → `voices.json` → `tools/voice.py` — lihat docs/ASET.md bagian Suara.
4. Bot memakai hero baru setelah tanggal di `BOT_CFG.HERO_SINCE` (data/bots.js).

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

### Tambah dialog bersuara
Tulis teks di `data/heroes.js`, lalu `tools/voice.py sync → isi ja → jobs → (Higgsfield) → fetch → build`. Detail: docs/ASET.md › Suara karakter.

### Arena
Semua angka (tiket, liga & hadiahnya, Elo, Kemarahan Arena, pencocokan lawan, serangan ke tim bertahan) di `data/arena.js`.


## Catatan
- Script bersifat global dan dimuat berurutan sesuai `manifest.txt`.
- Mengganti `SAVE_KEY` di `config.js` mereset progres pemain. Selain itu, `migrate()` di `state.js` otomatis membersihkan save lama (hero/senjata/perlengkapan yang dihapus, kelas yang tidak cocok, dll).
- Uji cepat tanpa splash/login: buka `dist/index.html#skipboot`.
- Setiap file JS punya komentar kepala yang menjelaskan isinya; angka penyetel selalu di `js/data/`.
