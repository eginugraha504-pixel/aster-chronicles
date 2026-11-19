# Pemain Bot — Buku Pegangan (per 19 Nov 2026)

Dokumen induk semua perilaku bot di Aster Chronicles. Baca ini dulu sebelum mengubah bot. Tujuan desainnya: **pemain asli tidak bisa membedakan dunia bot dari server yang benar-benar ramai**. Setiap fitur bot harus (1) masuk akal dilihat dari luar, (2) sama untuk semua penonton, (3) murah dihitung di HP.

Rincian per fitur yang lebih lama ada di `docs/SISTEM.md`; dokumen ini merangkum, menjelaskan alasannya, dan memberi peta untuk pengembangan berikutnya.

---

## 1. Prinsip yang tidak boleh dilanggar

1. **Deterministik & dunia bersama.** Keadaan bot ke-i pada waktu t = fungsi murni dari `(gen dunia, i, t)` + data bersama dari server (`ov`, `rv`). Tidak ada acak `Math.random()` di mesin bot. Semua pemain melihat level/CP/online yang sama. Aliran acak memakai `bHash(i, k)` / `bRng(seed)`; **sifat baru selalu memakai nomor aliran baru** (mis. `bHash(i,51)`) supaya sifat lama bot tidak bergeser.
2. **Progres hanya saat bermain.** Angka bot diam saat ia offline, naik sedikit demi sedikit saat ia online.
3. **Angka berasal dari game asli.** Kurva progres dibuat oleh simulator yang memainkan game sungguhan (`tools/botsim`), bukan ditebak. Kalau balance game berubah, jalankan ulang simulasi.
4. **Bot tidak curang.** Bot hanya bisa melakukan yang bisa dilakukan pemain dengan dompet & waktunya. Whale membakar permata, F2P tidak. Rival berusaha lebih keras, tapi dalam batas wajar.
5. **Murah.** Ringkasan (`botSum`) untuk daftar, keadaan penuh (`botState`) hanya saat dilihat. Pemanasan latar dipotong per ±10 ms.

---

## 2. Peta file

| File | Isi |
|---|---|
| `src/js/data/bots.js` | `BOT_CFG`: semua angka penyetel (jumlah & pertumbuhan, profil, pengalaman, tier belanja, kurva, jam main, berhenti/kembali main, era banner, bio, emosi, hidup berubah, kebangkitan) |
| `src/js/systems/bots.js` | Mesin: bergabung, sesi, progres, gacha, belanja, keadaan, ringkasan, cache, daftar peringkat, pemanasan, penyegaran realtime |
| `src/js/data/rival.js`, `systems/rival.js` | Rival abadi |
| `src/js/systems/chat.js`, `ui/chat.js`, `data/chat/*` | Aktivitas bot (`botActivity`), obrolan dunia lokal, deskripsi bot untuk AI (`wcDesc`, `wcPersona`, `wcStyle`) |
| `src/js/systems/arena.js`, `data/arena.js` | Bot di Arena: poin, serangan ke Tim Bertahan, balas dendam |
| `src/js/systems/worldboss.js` | Bot ikut Bos Dunia (`wbAttend`, `wbRaid`) |
| `src/js/systems/botsale.js` | Laporan pembelian bot ke bank Telegram |
| `src/js/systems/net.js` | Dunia dari server (`/api/world`: UID, nama, `ov`, `rv`), teman bot, potret bot untuk admin |
| `src/js/ui/leaderboard.js` | Peringkat, profil bot, bar rival |
| `bank-worker/src/game.js` | Server: akun bot, dunia (`epoch`, `gen`), reset, AI obrolan (`ROLE`, `TOPIK`, `WB_EVS`, `RV_EVS`), `/api/rv/boost`, `/api/wb` |
| `bank-worker/src/botcfg.js` | Salinan angka bergabung untuk server (dibuat `tools/gen_botcfg.mjs`) |
| `tools/botsim/` | Simulator pemain + pembuat kurva |

---

## 2b. Server (19 Nov 2026)

- Seperti game pada umumnya: **4 server dibuka bersamaan** (S1 Aster, S2 Lumina, S3 Bara, S4 Samudra), server baru dibuka manual lewat Telegram `/server buka [nama]`. Tiap server maks **2.000 pemain** (bot + asli); penuh → tidak bisa dipilih saat daftar.
- **Akun terikat ke satu server** (dipilih saat daftar; tamu memilih di kartu Tamu, disimpan `aster_srv`), tanpa pindah. Akun lama → S1.
- Tabel `servers` (migrasi 0010): `worlds` = daftar dunia bot `[{g,e,cap}]`. Dunia pertama milik server itu; **gabung server** (hanya akun GM, Panel GM › Gabung Server, `/api/srv/merge`) menambahkan dunia server asal ke belakang server tujuan, memindahkan pemain asli & obrolannya, dan server asal hilang dari daftar.
- Di game: `BOTS.W` = dunia-dunia server ini; **id bot j = slot × 2.000 + indeks lokal**. Server yang tidak pernah digabung: j = indeks lama. Seed bot memakai indeks lokal + gen dunianya (`bHash`), jadi bot hasil gabungan tetap orang yang sama (level, CP, gacha). Semua loop memakai `botsIds(now)`, cek keberadaan `botIn(j)`; data server (teman, pesan, pencarian) dipetakan lewat `botJ(bw, bot)`.
- **Kurva bergabung per dunia** (`BOT_CFG.SRV`): N(T) = 2.000 × (0,45·(1−e^(−T/1,5)) + 0,55·(1−e^(−E/25))) — ±490 hari 1, ±1.200 hari 7, ±1.750 hari 30, penuh ±3 bulan. Tiap server lebih baru dibuka, ekor dunia lama melambat ×0,45 (pemain baru memilih server baru). Server & game memakai rumus yang sama (`wJoinN`, `botJoinDaysW`).
- **Per server**: obrolan dunia (`wchat.srv`, kunci AI `ai_scene_at:<srv>` dst.), Bos Dunia (slot `"<srv>:<tgl>T<jam>"`), peringkat pemain asli (`/api/players?srv=`), pencarian, rival, Arena. Reset bot per server (`/resetbot <id>`); `/server` = daftar + tombol reset.
- Penyimpanan ringkasan & tanda tangan dunia memakai `botsSig()` (gen@epoch tiap dunia). Dunia berubah (reset/gabung) → cache bot, lawan Arena, rival dibuang.

## 3. Lahir: siapa bot ini (`botBase(i)`)

Setiap bot punya sifat tetap, diambil dari aliran acak masing-masing:

- **Waktu bergabung** `botJoin(j)`: per dunia server (lihat §2b). Setelah hari pertama, jam bergabung ditekuk ke jam ramai WIB (`botJoinWarp` + `HOURS`).
- **Profil login** (`profiles`): santai 40% / reguler 35% / rajin 20% / hardcore 5% → jumlah & panjang sesi per hari, laju `a`, `opt` (kerapian build).
- **Pengalaman main** (`SKILL`, `pf.sk`): baru / biasa / veteran, condong ke veteran untuk profil rajin/hardcore. Lihat §5.
- **Tier belanja** (`BOT_TIERS`): f2p, low, mid, dolphin, whale (1,4%), swhale (0,45%), mwhale (0,15%). Lihat §6.
- **Emosi gacha awal** (`botEarlyMood`): 60 tarikan pertama menentukan hoki/sial → betah/cepat berhenti.
- **Pengejar banner / penabung**, **hero favorit**, **churn** (kapan berhenti), **comeback** (kembali saat era baru), **ganti nama/bio**.
- Kurva yang dipakai: `b.cv` = `profil_pengalaman_tier` bila ada (whale ke atas), selain itu `profil_pengalaman`; `b.cvS` = kurva F2P untuk jumlah tarikan gratis.

## 4. Hidup: sesi, progres, keadaan

- **Sesi** `botSessions0(b, hariWIB)`: jumlah & jam sesi per hari dari profil + bobot jam WIB (ramai malam). `botSessions` = sesi + kehadiran Bos Dunia (`wbAttend`). `botPresence(i,t)` → online / terakhir aktif.
- **Masa aktif** `b.segs`: aktif → memudar → berhenti (kadang kembali). `botActive(b,t)`.
- **Progres** `botProg(b,t)` dalam "hari efektif":
  - `botProgLin`: laju × masa aktif.
  - Jatah satu **hari progres** (05:00–05:00 WIB) dibagi ke sesi-sesi online hari itu (`botPlay`). Offline = diam; online = naik.
  - `botProgInv`: kebalikan, selalu jatuh di dalam sesi (tarikan gacha terjadi saat bot online).
- **Usaha rival** `botBoost(i,t)` ditambahkan: `Pe = P + boost` (lihat §8). Gacha memakai `P` (usaha tidak menambah tarikan).
- **Keadaan** `botState(i,t)` (mahal, ±0,5–5 ms): gacha tersimulasi per era (`botGacha`), level akun (`botLv` dari kurva + ekor XP), level hero (dibatasi emas di awal), senjata (kurva lv & LB × `opt`), perlengkapan, Kebangkitan (`botAscend`, anggaran × tier × pengalaman), tim (seberapa rapi = `opt`), CP, tahap cerita, statistik (jam main, hari login, hoki), riwayat ★3, VIP.
- **Tahap cerita**: dari kolom 6 kurva (veteran skip cerita → cepat), dibatasi CP (`rec ≤ CP×1,12`); setelah kurva habis (hari 30) mengikuti CP.
- **Admin** bisa menimpa lv/cp/vip/sembunyikan lewat Telegram (`ov`).

## 5. Pengalaman main (baru / biasa / veteran)

Terpisah dari profil (seberapa sering login) dan tier (seberapa banyak belanja). Diukur di simulator:

| | Pemula | Biasa | Veteran |
|---|---|---|---|
| Cerita | dibaca | kadang dilewati | dilewati |
| Kecepatan tempur | ×1 → ×2 (hari 2) → ×3 (hari 7) | ×2 → ×3 (hari 6) | ×3 |
| Gacha | tarik satu-satu, kadang banner standar | 10× | 10×, kejar rate-up |
| Emas | sebagian habis ke hero cadangan | tim inti | tim inti + bijih & stamina di Toko Emas |
| Dungeon | sering lupa | yang dibutuhkan | semua tiket disapu tiap hari |
| Mentok di tahap | main ulang manual | kadang Sapu | **bakar stamina dengan Sapu di tahap tertinggi** |
| Fitur pendukung | belajar pelan | sering | selalu: lebur, pasang otomatis, perlengkapan, Kebangkitan |
| Arena / Bos Dunia | jarang | sering | rutin, pilih lawan pintar |

- **Belajar**: pemula bergerak ke perilaku pemain biasa dalam ±10 hari; pemain biasa mendekati veteran (60%) dalam ±25 hari. Ini sudah tercermin di kurva.
- Di mesin: `SKILL` → `opt` (−0,12 / 0 / +0,10), anggaran Kebangkitan (×0,6 / ×1 / ×1,5), peluang berhenti (×1,25 / ×1 / ×0,8), poin Arena (−90 / 0 / +110). Chat AI tahu pengalaman bot (pemula masih bingung, veteran suka kasih tips).

## 6. Belanja (tier)

- `BOT_CFG.SPEND` + `BOT_TIERS`: Kartu Bulanan, paket harian acak (×2,2 di tanggal gajian), borong saat banner baru, battle pass. Permata berbayar → tarikan tambahan (`botPaidPulls`). Total belanja → VIP 1–7.
- **Whale / super whale / mega whale membakar permata**: kurva mereka berasal dari simulasi dengan top up harian ±3rb/7rb/15rb permata, **isi ulang stamina 3/5/5× sehari, reset dungeon 2/5/5× per jenis**. Porsi permata yang terbakar (`burn` .33/.55/.28) tidak dihitung sebagai tarikan.
- Super & mega whale: selalu rajin/hardcore, tidak pernah berhenti, selalu kejar rate-up; pengalaman veteran (swhale kadang biasa).
- **Pembelian pertama** (`spend0`): bawaan 0,3–4 hari setelah bergabung (`SPEND.firstDay`), per tier `first`: Kartu Bulanan 0,02–1,2 hari, dolphin 0,01–0,8, whale 0,005–0,25, super whale ≤0,2, mega whale ≤0,06 hari (langsung di sesi pertama). Dunia yang baru di-reset tetap punya pembeli sejak jam-jam pertama.
- Penjualan dilaporkan ke bank Telegram (`botsale.js`) → saldo HUN2 STUDIO. Laporan dikirim oleh game yang sedang terbuka (tiap menit, setelah bot selesai dihitung). Notifikasi Telegram `/notif` hanya untuk pembelian ≥ Rp799rb.

## 7. Hidup sosial

- **Aktivitas** `botActivity(i,t)`: ambil hadiah, push tahap / macet di bos, dungeon, Arena, naik level, gacha, nabung, Bos Dunia. Tampil di profil ("Online · di Dungeon") dan masuk konteks AI.
- **Obrolan Dunia**: AI (Claude Haiku) menulis adegan antar bot yang sedang online dengan data asli mereka (publik vs pribadi), persona (`wcPersona`), ingatan 12 jam, daftar kata yang sudah terlalu sering muncul. Momen khusus: Bos Dunia (`WB_EVS`), rival (`RV_EVS`). Stiker gabut tanpa AI.
- **Teman**: bot menerima permintaan saat online (±62%, lebih mudah bila CP mirip); 0–2 bot per hari mengajakmu berteman.
- **Arena**: poin bot = persentil CP + keaktifan + pengalaman. Serangan ke Tim Bertahan hanya oleh bot yang sedang online; bot yang kamu kalahkan bisa balas dendam; rival menyerang sekali sehari.
- **Bos Dunia**: bot berdatangan menjelang naga (online melonjak). CP & tim diambil saat naga muncul (papan sama untuk semua penonton). Damage = DPS dari CP × keunggulan elemen tim terhadap naga (pangkat 1,4) × sedikit acak × pengalaman. Tim bot juga **tumbang lalu bangkit**: hidup ±12–25 dtk (tergantung CP & kelemahan elemen), menunggu bangkit 11–15 dtk; DPS dikalibrasi dari satu raid penuh dengan keempat fase (`WB_CFG.dps`); papan samping menampilkan ↻ detik saat bot sedang menunggu bangkit, angka damage melayang hanya dari bot yang sedang bertarung. AI obrolan diberi fakta elemen naga (`WB_EL`) supaya sarannya benar.
- **Hidup berubah**: bio diganti, favorit pindah ke ★3 terbatas terbaru, ganti nama sekali, berhenti main, kembali saat era baru.

## 8. Rival abadi (`data/rival.js`, `systems/rival.js`)

Selalu ada satu bot yang menjadikanmu sasaran. "Abadi" = posisinya, bukan orangnya.

**Memilih** (`rvPick`, tiap 20 dtk bila belum ada rival, setelah Lv 5 + 20 menit): bot yang CP-nya 0,85–1,3× CP-mu (lebar 0,7–1,6 bila sepi), online 24 jam terakhir, masih akan main ≥4 hari, sudah bergabung ≥1 jam, tidak sedang masa jeda 7 hari. Skor = selisih CP + **selisih laju CP 48 jam** (×1,5) + sedikit acak. Rival = yang lajunya paling mirip, bukan yang dipaksa mengikutimu.

**Salip-menyalip**: unggul >0,4% selama 5 menit (ganti tim sebentar tidak dihitung). Tiap salip dicatat (skor "Salip 2–1").

**Usaha saat kamu salip** (`rvPlanBoost`): sesi main BERIKUTNYA si rival (atau sisa sesinya kalau sedang online) mendapat tambahan progres `dp` hari efektif, terwujud pelan selama sesi itu. Besarnya menurut dompet × pengalaman: F2P 0,3 (farming lebih lama) … mega whale 0,75 (isi ulang stamina); veteran ×1,15, pemula ×0,75; maks 0,8. Sekali per 20 jam. Dikirim ke server (`/api/rv/boost`, tabel `rvb`, migrasi 0009) → dibagikan ke semua pemain lewat `/api/world` (`rv`), server membatasi 1 per 18 jam per pemain-bot dan total 1,2/hari per bot. Pemain tamu: berlaku lokal saja.

**Berakhir**: menyerah (CP-mu ≥1,45× miliknya selama 36 jam), bosan (CP-nya ≥1,5× milikmu 48 jam), atau pensiun (berhenti main / 3 hari tidak online). Minimal 36 jam jadi rival sebelum boleh menyerah/bosan. Rival baru muncul 4–20 jam kemudian. Riwayat 12 mantan rival (`S.rv.hist`), tampil "Mantan rival" di profil.

**Terlihat**: bar rival di atas Peringkat (nama, online, selisih CP, hari ke-n, skor salip), lencana ⚔ RIVAL di baris, banner di profil, toast saat salip/disalip/menyerah/rival baru, momen Obrolan Dunia (rival menulis duluan saat ia online; peluang per momen, maks satu adegan rival per 2 jam), serangan Arena sekali sehari, dan kadang AI tahu ia "diam-diam bersaing" denganmu (1 dari 3 jam).

**Celah yang sudah ditutup**:
| Celah | Penanganan |
|---|---|
| Rival selalu persis selangkah di depan (karet gelang) | dipilih dari laju alami; usaha hanya saat disalip, sekali per 20 jam, terbatas dompet; bisa kalah & menyerah |
| Rival dipilih bot yang sebentar lagi berhenti | syarat masih main ≥4 hari & online 24 jam terakhir |
| Bergonta-ganti salip karena ganti tim | ambang 0,4% + bertahan 5 menit |
| Bot yang sama jadi rival lagi | jeda 7 hari |
| Usaha terjadi saat bot offline | usaha hanya terwujud di dalam sesi main |
| Angka rival beda antar penonton | usaha disimpan di server dan dibagikan; ringkasan bot yang usahanya berubah dihitung ulang (`rvApply`) |
| Banyak pemain "memompa" satu bot | batas server per pemain & per bot per hari |
| Chat rival terlalu sering | peluang per momen, jeda 2 jam, menyebutnya "jarang dibahas" |
| Dunia bot di-reset | rival & riwayatnya dibuang, server menghapus `rvb` |
| Pemain sudah #1 jauh | tidak ada calon dalam rentang lebar → rival baru dicoba lagi tiap jam (wajar: tidak ada yang mengejar) |

## 9. Performa & skala

- `botSum(i,t,sync)`: ringkasan (cp, lv, vip, top, stage). Bot berhenti main → disimpan di localStorage `aster_botsum` (maks ±900rb karakter, dibuang dulu bila kuota penuh — save pemain selalu menang, `lsPut`). Bot aktif → `BSUMA` per kunci `botKey` (progres per 15 menit efektif + level).
- **Realtime**: ringkasan basi dipakai sebentar, bot dimasukkan antrean `BSQ`, `botsFresh` menghitung ulang di latar tiap 8 dtk (potongan 8 ms) lalu peringkat/profil yang terbuka diperbarui (refresh 5 dtk, memo daftar 6 dtk).
- `botsWarm`: semua bot dihitung bertahap tiap 2 menit. 30 hari (9,4rb bot) ±5 dtk; setahun (53rb bot) ±25 dtk di latar.
- Cache: `botState` LRU 15rb, sesi 60rb, hari progres 80rb, belanja 20rb. Semua dibersihkan saat dunia di-reset (`botsApplyWorld`).

## 10. Simulator & kurva (`tools/botsim`)

- `sim2.js` memainkan game asli tanpa layar: tempur sungguhan, gacha, toko, Toko Emas, dungeon + Sapu, Sapu tahap, cerita (waktu baca), tutorial, misi, event, Kotak Surat, lebur, pasang otomatis, perlengkapan, Kebangkitan; Arena & Bos Dunia sebagai hadiah perkiraan; anggaran waktu per sesi.
- `runall.sh 30` → 4 profil × 3 pengalaman × 2 seed (±25 menit). `runwhale.sh 30` → pembelanja besar (±25 menit). `mkcurves.py /tmp/s4 /tmp/s5` → `curves2.js`, tempel ke `BOT_CFG.CURVES`, lalu naikkan `SUM_VER`.
- Kolom kurva: `[hari efektif, lv, total summon, lv senjata tim, LB senjata tim, jam main, tahap cerita tamat]`; 3 hari pertama per sesi, lalu per hari sampai 30, sesudahnya ekor XP.
- **Kapan menjalankan ulang**: setiap ada perubahan EXP/stamina/hadiah/biaya/tahap baru/fitur yang memberi sumber daya. Kalau tidak, bot memakai keseimbangan lama.

## 11. Angka acuan (dunia uji)

| Saat | Yang terlihat |
|---|---|
| Hari ke-1 | ±800 bot. Veteran F2P Lv20–26 sudah 5 besar; pemula santai Lv2–5 |
| Hari ke-7 | ±4.100 bot. Mega whale veteran ±Lv110 / CP ±63rb; F2P veteran terbaik ±25rb |
| Hari ke-30 | ±9.400 bot. Mega whale teratas ±630rb CP; rata-rata hardcore veteran ±59rb vs hardcore pemula ±22rb |
| 1 tahun | ±53.600 bot. Puncak ±2,4–2,5 jt CP (batas ±2,98 jt); level akun pembelanja menyentuh 999 (game belum punya batas level) |

## 12. Cara mengembangkan (supaya kurva naik, bukan mentok)

1. **Ubah angka dulu, bukan mesin.** Hampir semua perilaku punya penyetel di `data/bots.js`, `data/rival.js`, `data/arena.js`, `data/worldboss.js`.
2. **Sifat baru = aliran acak baru** (`bHash(i, nomorBaru)`), jangan menyisipkan `r()` di tengah aliran lama.
3. **Fitur game baru** → (a) tambahkan ke `sim2.js` bila memberi sumber daya, jalankan ulang kurva; (b) tambahkan ke `botActivity` supaya bot "terlihat" memainkannya; (c) jelaskan di `docs/AI_PANDUAN.md` supaya AI obrolan tahu; (d) bila ada unlock level, pakai `botLvTime`.
4. **Banner terbatas baru** → era baru di `BOT_CFG.ERAS`.
5. **Ingin bot bereaksi ke pemain** → simpan keadaan pribadi di `S` (seperti `S.rv`), bagikan efek yang mengubah angka bot lewat server (seperti `rvb`), dan tampilkan lewat momen chat (`*_EVS` di server).
6. **Selalu uji**: `t/rv1.py` (rival), `t/rt.py` (realtime), `t/bp.py <hari>` (sebaran per profil/pengalaman/tier), `t/scale3.py <hari>` (performa), `t/ar9.py`, `t/wb1.py`, `t/smoke.py`.

## 13. Ide berikutnya (belum dibuat)

- **Mentok & curhat**: bot yang tertahan di tahap sama berhari-hari minta tips di chat; veteran menjawab.
- **Perubahan watak**: F2P mulai top up saat banner limited favoritnya; whale apes ngamuk lalu berhenti; reaksi di chat & peringkat.
- **Meta ikut-ikutan**: komposisi tim pemain teratas ditiru bot lain; hero baru menggeser meta dan jadi bahan debat.
- **Momen peringkat**: chat ramai saat ada yang tembus 10 besar / ganti #1.
- **Rival bertingkat**: rival dari pemain asli lain (bila nanti ramai), rival guild.
- **Batas level akun** (keputusan desain game, berlaku juga untuk pemain asli).
- Guild & perang wilayah 20.00–21.00 (bot ikut).
