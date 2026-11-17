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
| Musik | `audio/login.mp3`, `audio/game.mp3` (96 kbps) | `MUSIC_SRC` | — | `systems/music.js` |
| Suara | `voice/<kunci>.mp3` (82 klip) | `VOICE_SRC` | `voice/voices.json` + `tools/voice.py` | `systems/voice.js` |
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
- Seraphine, Sakuya, Raika, dan Marisa punya splash hidup: napas (dada + badan atas), rambut dan kain bergelombang (ujung bergerak paling jauh), kedip 3 tahap dengan jeda acak, partikel cahaya halus, plus efek khas: kilau menyapu pedang Seraphine, tebasan dan api rubah Sakuya berdenyut, petir busur Raika berkedip, kilau menyapu tongkat naga Marisa dan bola air/gelembungnya berdenyut (rambut + naga air ikut bergelombang).
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

## Splash studio HUN2 STUDIO
- Layar pertama saat game dibuka: logo HUN2 STUDIO (gaya stempel hanko Jepang, dibuat dengan Higgsfield GPT Image 2.6, latarnya dibuat transparan) di atas kertas krem, dengan kelopak sakura jatuh dan disclaimer "Game masih dalam tahap pengembangan" (id/en/ja sesuai bahasa tersimpan).
- Markup statis `#studio` ada di `src/index.html`. Logonya (`src/img/studio/logo.webp`) ditanam langsung ke HTML oleh `tools/build.py` (`__STUDIO_LOGO__`), jadi langsung tampil sebelum script besar selesai dimuat. Gaya ada di `css/studio.css`.
- `studioSplash()` di `ui/boot.js` menutupnya sekitar 3,4 detik sejak halaman dibuka (minimal 1,8 detik setelah script jalan). Loading tetap berjalan di belakang. Ketuk untuk melewati. Dilewati otomatis dengan `#skipboot`.

## Musik latar
- **Layar login** (setelah splash studio): "Eternal Sky", `src/audio/login.mp3`, volume .55.
- **Di dalam game** (setelah login): "Starbound Prologue", `src/audio/game.mp3`, volume .4 supaya efek suara dan suara karakter tetap jelas.
- Keduanya dikompres ke 96 kbps stereo. `tools/build.py` menanamnya sebagai `MUSIC_SRC`, dan `js/systems/music.js` memutarnya: `bgmPlay('login')` di `openLogin`; di `enterGame` musik login memudar (`bgmStop`), lalu `bgmPlay('game')` masuk sekitar 1,5 detik kemudian. Volume per lagu ada di `BGM_VOL`.
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
| Seraphine | Luna | `375a3398-e3b4-4f91-845d-42181e352899` |
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
