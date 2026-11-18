# Aset Aster Chronicles — dari mana asalnya & cara menambah

Aturan umum:
- **`src/`** hanya berisi aset siap pakai (kecil, sudah diolah). `tools/build.py` menanam semuanya ke `dist/index.html`.
- **`art_src/`** berisi bahan mentah (PNG resolusi penuh, lembar Higgsfield) + skrip pengolahnya. PNG besar **tidak** ikut repo/zip; yang ikut hanya skrip & JSON.
- Semua aset buatan AI dibuat lewat **Higgsfield** (MCP `higgs`). Model yang dipakai: `nano_banana_pro` (ilustrasi, edit gambar), `gpt_image_2_6` (logo), `elevenlabs_v4` (suara).
- Kalau aset tidak ada, game hampir selalu jatuh ke versi kode (sprite/ikon/latar prosedural), jadi aman untuk dihapus/diganti satu per satu.

| Aset | Siap pakai (`src/`) | Disuntik build sebagai | Bahan & skrip (`art_src/`) | Kode |
|---|---|---|---|---|
| Splash art 13 hero | `img/splash/<hero>.webp` (tinggi 1100) | `SPLASH_SRC` | `splash/<hero>.png` (dari Egi), `splash/key.py` | `art/splash.js`, `ui/splash.js` |
| Live2D ★3 | `img/rig/<hero>_mask.png`, `_eyes.png` | `RIG_SRC` | `rig/masks.py`, `eyebox.json`, `eyegeo.json` | `art/live2d.js` |
| Sprite battle | `img/sprites/h_<hero>.webp`, `e_<musuh>.webp`, `fx_melee.webp` | `SPRITE_SRC` | `sprites/prompts.py`, `mk.py`, `spritify.py` | `art/imgsprite*.js` |
| Latar | `img/bg/w_*.webp`, `m_*.webp`, `key.webp`, `home_*.webp` | `BGIMG_SRC` | `full_*.png` | `art/bgart.js` |
| Ikon | `img/icons/<kunci>.webp` | `ICONIMG_SRC` | `icon_sheets/*.png`, `iconify.py` | `art/iconart.js` |
| Skin UI | `img/ui/*.webp` | variabel CSS `--ui-*` | `ui_kit/*.png`, `uikit.py`, `seg.py` | `css/skin.css` |
| Logo studio | `img/studio/logo.webp` | `__STUDIO_LOGO__` di HTML | — | `ui/boot.js`, `css/studio.css` |
| Musik | `audio/login.mp3`, `audio/game.mp3` (96 kbps) — **file terpisah** `dist/audio/` | `MUSIC_SRC` (path relatif) | — | `systems/music.js` |
| Suara | `voice/<kunci>.mp3` (103 klip) | `VOICE_SRC` | `voice/voices.json` + `tools/voice.py` | `systems/voice.js` |
| Font | `fonts/*.woff2` | data URI di CSS | — (`tools/subset_ja.py`) | `css/fonts.css` |

## Splash Art (ilustrasi anime)
- Taruh file `src/img/splash/<heroId>.webp` dengan latar transparan. `build.py` menyisipkannya otomatis sebagai `SPLASH_SRC`. Hero tanpa file tetap memakai sprite piksel.
- Dari hasil greenscreen: hapus hijau (alpha dari selisih G − max(R,B), lalu despill), potong ke tepi karakter, tinggi 1000 px, WebP kualitas ±84 (±110 KB per hero).
- `js/art/splash.js`: `splash(id)`, `splashHTML(id,cls)`, dan `SPLASH_FOCUS` (titik wajah [x%,y%] untuk crop cut-in skill). Isi focus untuk setiap splash baru.
- **Marisa** (hero ke-13): splash dibuat dengan **GPT Image 2.6 Flare** (`gpt_image_2_6_flare`, `background: transparent`, quality high, 2k, 3:4) memakai splash Seraphine & Noa buatan Egi sebagai referensi gaya → PNG transparan 1744×2336 langsung, tanpa chroma key. Cara ini dipakai untuk semua splash hero baru.
- **Splash 12 hero = versi terbaru dari Egi** (PNG transparan 1744×2336, sumber di `art_src/splash/<id>.png`). Di-crop ke batas karakter (+8 px), di-resize ke tinggi 1100 px, lalu disimpan sebagai webp q88 di `src/img/splash/`. Titik fokus wajah ada di `SPLASH_FOCUS` (`art/splash.js`).
- **Beranda:** bila hero beranda punya splash, `homeHTML` menampilkan splash besar (`.hstage.hsp`) menggantikan sprite piksel. `lobbyPlace` (mode splash) membuat karakter setinggi ruang dari bawah banner sampai tombol bawah (`SINK` = bagian kaki yang tersembunyi di balik tombol). Gelembung dialog ada di bawah, tepat di atas tombol Petualangan, dengan ekor ke atas.
- **Gelembung dialog (`HB` di `ui/home.js`):** tersembunyi secara default. *Idle*: muncul sendiri ±10 detik setelah masuk beranda, lalu tiap 1–3 menit (acak) memakai `lines`, tampil beberapa detik lalu hilang. *Disentuh*: karakter melompat dan mengucapkan `poke` (dialog "diganggu" sesuai kepribadian; field `poke` di `data/heroes.js` + terjemahan en/ja). Hero tanpa splash memakai kanvas piksel dengan perilaku gelembung yang sama.
- Dipakai di: detail hero (panggung + tombol "Lihat art" layar penuh, `js/ui/splash.js`), reveal ★3 saat summon, banner pick-up, dan cut-in skill di battle. Animasinya napas + goyang halus (CSS), mati otomatis bila perangkat meminta reduced motion.

## Splash hidup ala Live2D (hero ★3)
- Semua hero ★3 (Sakuya, Raika, Marisa, Hilde, Celestine, Aurelia, Lilith, Coppelia) punya splash hidup: napas (dada + badan atas), rambut dan kain bergelombang (ujung bergerak paling jauh), kedip 3 tahap dengan jeda acak, partikel cahaya halus, plus efek khas: kilau menyapu pedang Seraphine, tebasan dan api rubah Sakuya berdenyut, petir busur Raika berkedip, kilau menyapu tongkat naga Marisa dan bola air/gelembungnya berdenyut (rambut + naga air ikut bergelombang).
- Mesin: `js/art/live2d.js`. `splashHTML()` memberi `data-live` pada `.spw` hero yang punya rig, lalu loop 30 fps membuat `<canvas class="spl live">` pengganti `<img>`. Canvas memakai CSS yang sama, termasuk `object-fit`, jadi otomatis pas di beranda, detail hero, Lihat Art, banner, dan reveal summon. Semua instance digambar lewat **satu** konteks WebGL bersama, dan hanya yang terlihat di layar.
- Aset: `src/img/rig/<hero>_mask.png` (R rambut, G kain, B efek cahaya; ½ resolusi) dan `<hero>_eyes.png` (atlas setengah | tertutup). Konfigurasi koordinat (kotak mata, kepala, dada, pinggang, garis pedang) ada di `RIG` dalam `live2d.js`. Pembuat mask: `art_src/rig/masks.py` (zona poligon per hero + pengecualian senjata/armor).
- Kedip: gambar mata tertutup dibuat dengan Higgsfield nano_banana_pro (edit dari splash asli), diselaraskan otomatis, lalu area mata dideteksi dari selisih gambar. Tahap "setengah" Sakuya/Raika = campuran 55% (hasil edit setengahnya jadi wink).
- Resolusi adaptif: kalau rata-rata waktu gambar > 14 ms (HP lemah), resolusi turun bertahap sampai 45%, lalu naik lagi kalau lancar. Tanpa WebGL atau dengan `prefers-reduced-motion`, splash diam biasa yang dipakai.
- Menambah hero: buat mask + atlas mata (lihat `masks.py`), salin ke `src/img/rig/`, lalu tambahkan entri di `RIG`.
- Contoh terbaru (Marisa): mata tertutup = edit nano_banana_pro dari job splash, diselaraskan otomatis dengan ORB + RANSAC (OpenCV), area mata dari selisih gambar, warna kulit disamakan, lalu atlas [setengah 55% | tertutup] — skrip lengkap `art_src/rig/eyes_marisa.py`.

## Sprite ilustrasi (Higgsfield) — semua hero & musuh
- 13 hero + 6 musuh + 3 bos memakai strip 8 frame 88×88 (`src/img/sprites/h_<id>.webp`, `e_<tipe>.webp`, total ±230 KB) → `SPRITE_SRC`.
  Urutan frame: 0 idle · 1 napas · 2–3 jalan · 4 ancang-ancang · 5 serang · 6 kena hit · 7 skill.
- Gaya dikunci dari lembar Seraphine (job e76edb88…) sebagai referensi pertama; desain tiap hero dari sprite lama + splash. Tiap hero digenerate 2 varian, dipilih yang terbaik (Lumi diulang).
- Pipeline `art_src/sprites/spritify.py`: potong grid 4×2 → buang magenta (flood-fill) → buang potongan dari sel tetangga → skala seragam per karakter (tinggi frame idle = 70 px hero) → kaki rata di baris 78, jangkar horizontal dari pusat kaki → palet bersama 48 warna.
- `js/art/imgsprite.js`: `sprIdx(f)` memetakan parameter animasi lama (pose/legs/bdy/face) ke frame; `HERO_ART[id]` diganti otomatis bila strip ada. `IMG_ANIMS` = durasi animasi baru.
  `js/art/imgsprite-enemy.js`: membungkus `ENE.draw`; slime biasa diwarnai sesuai elemen (multiply).
- Semua penggambar memakai ukuran logis 44×44 (battle `drawImage(...,44,44)`, beranda & potret membaca lebar kanvas) jadi resolusi 2× tetap tajam.
- `sprReady()` menunggu semua gambar ter-decode saat boot (langkah "Melukis para hero").
- Hero baru (contoh Marisa): referensi = lembar gaya `e76edb88…` + splash hero itu (job id), prompt dari `B` di `mk.py`; parameter & job tersimpan di `art_src/sprites/<hero>.json`. Pilih varian yang paling mirip splash, bersihkan sisa ikon (mis. tanda X di frame kena hit), lalu `spritify.build(..., target_h=70)`.
- Catatan: sprite memegang senjata khasnya sendiri (senjata yang dipasang tidak lagi tergambar di tangan). Tanpa file strip → sprite kode lama tetap dipakai.

## Latar ilustrasi (Higgsfield)
- Dibuat dengan Higgsfield (Nano Banana, ±2 credit per gambar), lalu **diperkecil ke grid piksel game** (median-cut 64 warna, tanpa dither) supaya menyatu dengan sprite.
- `src/img/bg/`: `w_<art>.webp` latar battle **240×300** (sejak polish battle: lukisan 4:3 diperpanjang ke 3:4 dengan Higgsfield outpaint → `art_src/tall_<art>.png`, dipotong 4:5 menurut `art_src/tall_crop.json` supaya tanah pas di bawah unit), `m_<art>.webp` peta petualangan 90×160, `key.webp` key art layar judul 384×688. `build.py` menyuntikkannya sebagai `BGIMG_SRC`.
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

## Splash studio HUN2 STUDIO
- Layar pertama saat game dibuka: logo HUN2 STUDIO (gaya stempel hanko Jepang, dibuat dengan Higgsfield GPT Image 2.6, latarnya dibuat transparan) di atas kertas krem, dengan kelopak sakura jatuh dan disclaimer "Game masih dalam tahap pengembangan" (id/en/ja sesuai bahasa tersimpan).
- Markup statis `#studio` ada di `src/index.html`. Logonya (`src/img/studio/logo.webp`) ditanam langsung ke HTML oleh `tools/build.py` (`__STUDIO_LOGO__`), jadi langsung tampil sebelum script besar selesai dimuat. Gaya ada di `css/studio.css`.
- `studioSplash()` di `ui/boot.js` menutupnya sekitar 3,4 detik sejak halaman dibuka (minimal 1,8 detik setelah script jalan). Loading tetap berjalan di belakang. Ketuk untuk melewati. Dilewati otomatis dengan `#skipboot`.

## Musik latar
- **Layar login** (setelah splash studio): "Eternal Sky", `src/audio/login.mp3`, volume .55.
- **Di dalam game** (setelah login): "Starbound Prologue", `src/audio/game.mp3`, volume .4 supaya efek suara dan suara karakter tetap jelas.
- Keduanya dikompres ke 96 kbps stereo. Sejak 18 Nov 2026 musik **tidak lagi ditanam** di index.html (supaya index.html < 16 MB, batas artifact): `tools/build.py` menyalin `src/audio/*.mp3` ke `dist/audio/` dan `MUSIC_SRC` berisi path relatif `audio/login.mp3` dll. Repo GitHub & artifact harus ikut membawa folder `audio/`. `MUSIC_SRC` dan `js/systems/music.js` memutarnya: `bgmPlay('login')` di `openLogin`; di `enterGame` musik login memudar (`bgmStop`), lalu `bgmPlay('game')` masuk sekitar 1,5 detik kemudian. Volume per lagu ada di `BGM_VOL`.
- Diputar lewat **satu** elemen `<audio>` bersama + Web Audio gain (fade/volume berfungsi di iOS). iOS hanya mengizinkan `<audio>` diputar lewat kode kalau elemen itu sudah pernah diputar di dalam sentuhan, jadi `bgmPrime()` memancingnya secara sinkron di `audUnlock()` pada sentuhan pertama mana pun (termasuk saat splash). Kalau splash tidak disentuh, splash menunggu dengan tulisan "Ketuk untuk melanjutkan" supaya musik login langsung terdengar. Musik berhenti saat aplikasi di latar belakang dan lanjut saat kembali.
- Pengaturan: Musik ON/OFF (`S.music`), berlaku untuk layar mana pun yang sedang tampil.

## Suara karakter (dub Jepang)
- 13 hero di-dub dengan **ElevenLabs Eleven v4** lewat Higgsfield (`generate_audio`, `voice_type: preset`). Aktor dipilih Egi lewat audisi.
- **Sumber data tunggal: `art_src/voice/voices.json`**
  - `cast` — aktor per hero: `aktor`, `voice_id` (preset Higgsfield), `audition_job`.
  - `clips` — tiap klip: `ja` (teks yang diucapkan) dan `id` (teks Indonesia dari `data/heroes.js`, diisi otomatis).
  - `model`, `batch_max` (8; lebih besar sering kena 429), `post` (pengolahan audio).
- Kunci klip (indeks HARUS sama dengan urutan di `data/heroes.js`):
  `<hero>_l<i>` = `lines[i]` (gelembung idle) · `<hero>_p<i>` = `poke[i]` (disentuh) · `<hero>_sk` = nama skill (cut-in battle).
- Hasil: `src/voice/<kunci>.mp3` → `VOICE_SRC` (build.py) → diputar `voice(kunci)` di `js/systems/voice.js`.
- Pengolahan (otomatis oleh `tools/voice.py`): potong hening awal/akhir (-45 dB), loudnorm -16 LUFS / TP -1,5, mono 24 kHz 48 kbps (±15 KB per klip).
- Diputar saat: gelembung idle beranda, karakter disentuh, cut-in skill, reveal ★3 summon (`_l0`). Suara selalu Jepang; teks gelembung mengikuti bahasa UI. Pengaturan: `S.voice`, `S.vvol` (bawaan .75).

| Hero | Aktor | voice_id |
|---|---|---|
| Sakuya | Maya | `b0f766b7-8703-4bd1-b973-f857c36837b6` |
| Raika | Helena | `3c2b83c0-2e0a-5ae8-998a-a5fe71b7eccd` |
| Mira | Zoe | `d0374db1-44b9-4f05-939e-0a9ae9dbbe6a` |
| Noa | Chloe | `e9cfbbf0-4476-46be-b396-596eb774b165` |
| Pia | Gracie | `09878754-f20b-5330-9790-58a8027ab5b2` |
| Rin | Kayla | `5c615d8a-5135-539d-8ab0-497b7ceabbae` |
| Vela | Sloane | `b57b22a0-f287-405b-bc82-6f08f5e6bb1f` |
| Bruna | Petra | `0c63637d-2ecb-5bda-9bbe-38894aa9a876` |
| Nami | Skye | `1fb253b8-928b-4d29-a349-f242a71eaddf` |
| Kuro | Una | `e91c5696-3d9f-5ae6-9c68-8389d2d0d294` |
| Lumi | Annie | `f2801b0f-e345-598e-86f5-8364d886d96b` |
| Marisa | Roxie | `f6448975-768e-4327-b932-1b7c973d58e9` |
| Hilde | Kaia | `bb9db352-f345-59f3-90b3-fa9432bcff91` |
| Celestine | Imogen | `3811e986-0891-47cf-a1f5-78a1d62a547a` |
| Aurelia | Hana | `c25f78a0-714e-42af-8da3-a399cef94968` |
| Lilith | Tallulah | `f32c8f51-449e-4ddf-bdf7-1527e11df917` |
| Coppelia | Elodie | `8b95a259-62fd-545d-b0f0-7b521a972b6b` |

### Menambah / mengubah dialog
1. Tulis teks Indonesia di `data/heroes.js` (`lines` / `poke` / `sk`). Tambah di **akhir** array supaya indeks klip lama tidak bergeser.
2. `python3 tools/voice.py sync` → kunci baru muncul di `voices.json` dengan `ja` kosong. Isi `ja` (terjemahan Jepang yang natural, sesuai kepribadian hero).
3. `python3 tools/voice.py jobs` → mencetak parameter `generate_audio_batch` (per 8 klip) untuk klip yang belum punya mp3. Jalankan di Higgsfield, tunggu selesai.
4. Simpan hasilnya sebagai baris `kunci URL` lalu `python3 tools/voice.py fetch < hasil.txt` (unduh → olah → `src/voice/`).
5. `python3 tools/voice.py status` untuk cek kelengkapan, lalu `python3 tools/build.py`.
- Teks Indonesia berubah? `sync` melaporkannya: perbarui `ja`, lalu `jobs <kunci> --all` untuk membuat ulang.
- Hero baru: audisi 3–5 suara preset (`list_voices`, satu kalimat contoh yang sama), Egi memilih, tambahkan ke `cast`, lalu langkah 2–5.
- Ganti aktor: ubah `voice_id`, lalu `voice.py jobs <hero> --all`.

## Font Jepang
- `src/fonts/mpr-ja-800-*.woff2` = M PLUS Rounded 1c ExtraBold, di-subset hanya ke huruf yang dipakai `js/lang/ja.js`.
- Setelah menambah teks Jepang: `npm pack @fontsource/m-plus-rounded-1c` → ekstrak → `python3 tools/subset_ja.py <folder>/package/files` → build.

## Latar battle tinggi (240×300)
- Sumber: `art_src/tall_<art>.png` (hasil outpaint 1792×2400). Potongan: lebar 1520 (=0,8×1900) di tengah, mulai y sesuai `art_src/tall_crop.json`, diperkecil ke 240×300 → `src/img/bg/w_<art>.webp`.
- Unit digambar di koordinat lama (240×210) lalu digeser `BTOP=60` ke bawah (`js/ui/battle-hud.js`). Latar lama 240×210 atau prosedural tetap jalan: tepi atas/bawahnya direntangkan otomatis.
- Dunia baru: outpaint lukisan 4:3 ke 3:4, pilih y potongan sampai unit (posisi kaki y 128–184 + 60) berdiri di tanah.

## Kebangkitan & Bab II (18 Nov 2026, Higgsfield)
- Bingkai kartu ★4/★5/★6: satu lembar `gpt_image_2_6` dengan referensi `art_src/ui_kit/cards.png` → `art_src/ui_kit/cards_asc.png`, dipotong `uikit.extract` (lebar 150) → `src/img/ui/card_r4..6.webp` (CSS `--ui-card-r4..6`, slice 30/34/38).
- Ikon `asc1` Kristal Kebangkitan, `asc2` Inti Surgawi, `asc3` Air Mata Dewi, `tower`: lembar 2×2 latar hijau `art_src/icon_sheets/K.png` → `iconify.cut` → `src/img/icons/*.webp`. Versi kode cadangan ada di `js/art/icons.js`.
- Latar battle `w_moon`, `w_deep`, `w_void`, `w_tower` + peta `m_*` (90×160, potongan 9:16 tengah): nano banana (3:4, referensi gaya `tall_summit`) → `art_src/tall_<art>.png`, potongan y di `tall_crop.json` (moon 480, deep 460, void 150, tower 420).

## UI v2 (18 Nov 2026, Higgsfield gpt_image_2_6)
- Mockup arah gaya: beranda & arena (referensi screenshot lama). Elemen: `art_src/ui_kit/n_panel.png, n_card.png, n_plaque.png, n_tabs.png, n_kit.png (medali, pita, kapsul, medali besar), n_tile.png, n_navbar.png` → `src/img/ui/n_*.webp`. Plakat & kartu: ornamen tengah dibuang (sambung kiri+kanan) supaya aman di-9-slice.
- Ilustrasi ubin beranda `n_artarena.webp`, `n_artevent.webp` (240×240), pola latar `n_bgtile.webp` (192px, diulang 96px).

## Petualangan v2 (18 Nov 2026)
- Peta dunia `src/img/bg/mp_{grass,cave,castle,storm,summit,moon,deep,void}.webp` (540×968): nano banana, 9:16, referensi latar battle tiap dunia; sumber `art_src/maps/map_*.png`.
- Node tahap `n_node/n_nodeok/n_nodeboss.webp` dari `art_src/ui_kit/n_nodes.png`; banner Event terkunci `n_artevbattle.webp` (`art_src/maps/event_battle.png`).

## Hilde (hero ke-14, 18 Nov 2026)
- Konsep: 4 pilihan (Tsubaki, Hilde, Celestine, Ophelia) via `gpt_image_2_6_flare` transparan dengan referensi splash Seraphine & Marisa → Egi memilih **Hilde** (Berserker Gunung, ★3 standar, Tanah · Petarung · Kapak, skill AoE "Amukan Rune Gunung").
- Splash final: flare 2k transparan (job `2eb1fe32…`) → `art_src/splash/hilde.png` → `src/img/splash/hilde.webp` (839×1100, q80). Fokus wajah `SPLASH_FOCUS.hilde=[59,22]`.
- Sprite: nano_banana_pro 2 varian, dipilih varian 2 (`art_src/sprites/hilde_sheet.png`, parameter di `hilde.json`), `spritify.build(target_h=73)`; frame napas = frame idle dengan badan atas turun 1px.
- Ikon senjata khas **Kapak Rune Gunung** (`gunung`): gpt_image_2_6 latar hijau → `W_gunung.png` → `src/img/icons/w_gunung.webp` (glow kuning dibuang, garis tepi gelap).
- Suara: aktor **Kaia** (audisi Raina/Tamsin/Kaia/Juno di `voices.json`), 7 klip lewat `tools/voice.py`.
- Live2D: mata tertutup = edit nano_banana_pro (job `ae3aecc5…`), diselaraskan ORB+RANSAC, area mata = selisih dalam 2 elips (`art_src/rig/eyes_hilde.py`). Mask `masks.py hilde`: rambut + ekor serigala (R), jubah & rok bulu (G), rune & energi kuning (B, jenis `amber`). `RIG.hilde`: kilau menyapu gagang kapak, glow berdenyut, partikel amber.

## Celestine, Aurelia, Lilith (hero ke-15..17, 18 Nov 2026)
Dipilih sendiri (Egi: "kamu directornya") untuk melengkapi 6 hero ★3 standar dengan elemen/peran yang belum ada di ★3: Cahaya-tank, Api-pemanah, Gelap-pendukung.
- Splash: `gpt_image_2_6_flare` 2k transparan (ref. splash Seraphine & Marisa) → `art_src/splash/<id>.png` → potong bbox alfa +8, tinggi 1100, webp → `src/img/splash/<id>.webp`. Fokus: celestine [55,14], aurelia [52,16], lilith [55,13].
- Sprite: nano_banana_pro 16:9 2k, 2 varian per hero (ref. lembar gaya `e76edb88…`) → `art_src/sprites/<id>_sheet.png`, `spritify.build(target_h=70)`. Aurelia: tanda X merah di sheet dihapus; Lilith: frame napas = frame idle badan atas turun 1px. ID job di `art_src/sprites/batch_hero15_17.json`.
- Ikon senjata (gpt_image_2_6 latar hijau → `/home/claude/gen/h3/icon.py`): `w_sayapsuci` (Perisai Sayap Mentari), `w_phoenix` (Busur Bulu Phoenix), `w_gerhana` (Tongkat Mikrofon Gerhana). Sumber `art_src/icon_sheets/W_Cel|W_Aur|W_Lil.png`.
- Suara Jepang (elevenlabs_v4): Celestine = Imogen (lembut), Aurelia = Hana (tegas-percaya diri), Lilith = Tallulah (genit). 7 klip per hero.
- Live2D: mata tertutup = edit nano_banana_pro → `art_src/rig/eyes.py <hero> <edit> x1,y1 x2,y2 rx,ry` (skrip generik baru). Mask `masks.py celestine aurelia lilith`; jenis glow baru `gold` (halo & perisai Celestine) dan `violet` (gerhana Lilith); Aurelia `amber` dibatasi ke zona panah/api pinggir supaya tidak berkedip di wajah. RIG di `js/art/live2d.js`.

## Seraphine dihapus → Coppelia (hero ke-18, 18 Nov 2026)
- Seraphine dibuang dari data, i18n, Live2D, splash, rig, suara (7 klip) dan `art/heroes/seraphine.js` karena terlalu mirip Celestine. File sumber lama tetap di `art_src/` sebagai arsip. Save lama dimigrasi ke Celestine (`HERO_REPLACED`).
- Coppelia: splash flare 2k (job `55447ac6…`, dipakai langsung), `src/img/splash/coppelia.webp` 820×1100, fokus [51,21].
- Sprite nano_banana_pro varian A; pedang dari frame idle ditempel ke frame jalan 3–4 (aslinya tanpa pedang) dengan poligon pedang; frame 2 = frame 1 napas. `h_coppelia.webp` target_h 70.
- Ikon `w_rodagigi` (Pedang Roda Gigi): kunci latar hijau yang lebih ketat (`/home/claude/gen/h4/icon2.py`) supaya inti teal pedang tidak ikut terhapus.
- Suara: Elodie (audisi vs Nora/Vera/Opal; dipilih karena intonasi paling datar = boneka). 7 klip.
- Live2D: `eyes.py coppelia … 403,228 447,205 17,13`, mask `masks.py coppelia` (glow `cyan` untuk pusaran & inti teal, rambut bob pendek bobot kecil), kilau menyapu bilah pedang.

## Cerita Utama (18 Nov 2026) — aset di `src/story/` (disalin ke `dist/story/`, tidak ditanam)
- **Latar** `story/bg/<kunci>.webp` (720 px lebar, piksel-art seragam dengan latar dunia): `night gate forest throne abbey harbor bell` baru (gpt_image_2_6 high, ref. `tall_grass`/`tall_summit`; night/gate/harbor bagian bawah digelapkan agar malam) + pakai ulang `camp meadow cave dusk storm summit moon deep void` dari `art_src/full_home_camp.png` & `tall_*.png`.
- **CG** `story/cg/{star,dawn,moon,wind,eye}.webp` (gpt_image_2_6 high 9:16, ref. splash hero terkait).
- **NPC** `story/npc/{ratu,herald,rajagob,dknight,voidking,orloj}.webp` (flare 2k transparan, tinggi 1100). Titik wajah & ukuran di `art_src/story/npc_geo.json`.
- **Ekspresi** `story/ex/<hero>_<a|k|d>.webp`: hanya area wajah. Cara buat: `art_src/story/` → potong kepala dari `art_src/splash/<hero>.png` (`/home/claude/gen/story/crops`), edit nano_banana_pro 1k ("ubah HANYA ekspresi"), lalu `python3 art_src/story/expr.py <hero_e>` (ORB menyelaraskan, selisih → masker berbulu, simpan + `ex_geo.json`). 23 ekspresi untuk 13 hero (Hilde & Lilith cukup ekspresi bawaan).
- **Suara** `story/v/st_<adegan>_<baris>.mp3` (elevenlabs_v4, 48 kbps mono): 158 klip. Aktor sama dengan suara hero; NPC: Ratu = Celine, Sosok Berkerudung & Raja Kehampaan = Desmond, Orloj = Arthur, Raja Goblin = Barrett, Ksatria Kegelapan = Onyx, Mata = Vlad. Daftar & job: `/home/claude/gen/story/vjobs.json`, `vdone.txt`.
- Ikon tiket dungeon `img/icons/dgtix.webp` (gpt_image_2_6 medium, ref. `tixW`, latar magenta dikunci).
