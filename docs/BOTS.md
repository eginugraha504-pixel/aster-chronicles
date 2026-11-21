# Pemain Bot — Buku Pegangan (per 21 Nov 2026)

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

- Seperti game pada umumnya: **4 server dibuka bersamaan** (S1 Aster, S2 Lumina, S3 Bara, S4 Samudra), server baru dibuka manual lewat Telegram `/server buka [nama]`. Tiap server maks **10.000 pemain** (bot + asli; sejak 21 Nov 2026, sebelumnya 2.000 — dunia lama tetap menyimpan cap-nya sendiri sampai /rilis); penuh → tidak bisa dipilih saat daftar.
- **Akun terikat ke satu server** (dipilih saat daftar; tamu memilih di kartu Tamu, disimpan `aster_srv`), tanpa pindah. Akun lama → S1.
- Tabel `servers` (migrasi 0010): `worlds` = daftar dunia bot `[{g,e,cap}]`. Dunia pertama milik server itu; **gabung server** (hanya akun GM, Panel GM › Gabung Server, `/api/srv/merge`) menambahkan dunia server asal ke belakang server tujuan, memindahkan pemain asli & obrolannya, dan server asal hilang dari daftar.
- Di game: `BOTS.W` = dunia-dunia server ini; **id bot j = slot × CAPX (10.000) + indeks lokal**. Server yang tidak pernah digabung: j = indeks lama. Seed bot memakai indeks lokal + gen dunianya (`bHash`), jadi bot hasil gabungan tetap orang yang sama (level, CP, gacha). Semua loop memakai `botsIds(now)`, cek keberadaan `botIn(j)`; data server (teman, pesan, pencarian) dipetakan lewat `botJ(bw, bot)`.
- **Kurva bergabung per dunia** (`BOT_CFG.SRV`). Dua versi, dipilih oleh `w.v` di data dunia:
  - **v1 (dunia lama)**: N(T) = cap × (0,45·(1−e^(−T/1,5)) + 0,55·(1−e^(−E/25))) — untuk cap 2.000: ±490 hari 1, ±1.200 hari 7, ±1.750 hari 30. Semua server yang dibuka bersamaan tumbuh persis sama.
  - **v2 — hype & pertumbuhan alami (21 Nov 2026)**, dipakai semua dunia baru (rilis serentak, `/server buka`, `/resetbot`). Dunia menyimpan `{g,e,cap,v:2,h,o,wh}`: h = tingkat hype 1–10 saat dibuat, o = urutan server dalam satu rilis, wh = riwayat persen whaler (lihat §6).
    N(T) = cap × [R·(1−e^(−T/tr)) + W·(1−e^(−E/tw)) + G·(1−e^(−E/tg))], G = 1−R−W.
    R = **serbuan rilis** (langsung main dalam hitungan jam; hype 1 ≈ 3% … hype 10 ≈ 76%), W = gelombang minggu pertama, G = pertumbuhan alami sampai penuh (`SRV.HYPE`).
    E = hari efektif bergelombang = Σ laju harian; laju = **popularitas server** (`POP` 0,8–1,22, server urutan awal sedikit lebih ramai `ORD`) × **naik-turun acak yang mulus** (AR(1) `AR`/`SD`) × **akhir pekan** (`WKD`, Minggu & Sabtu lebih ramai) × **lonjakan viral acak** (`BURST`, lebih sering saat hype tinggi, meluruh ±1,6 hari) × perlambatan ×0,45 tiap server lebih baru dibuka. Semua acak dari gen dunia (`wRng`) → sama persis di game & server, tapi tiap server punya irama sendiri.
    Perkiraan rata-rata per server (angka untuk cap 2.000; cap 10.000 → ×5): hype 1 ±110 hari 1 / ±445 hari 7; hype 5 ±580 / ±1.250; hype 7 ±980 / ±1.480; hype 10 ±1.600 / ±1.850 (±1.280 dalam 6 jam pertama). Contoh hype 6, pemain baru per hari di 4 server: 938·149·79·64… / 986·324·73·48… / 721·133·149·112·107·188… / 670·169·91·…·150 (lonjakan hari 8).
  - Server & game memakai rumus yang sama (`wRng`, `wDyn`, `wE2`, `wJoinN`, `botJoinDaysW`; ekspor uji `__curve` di game.js). Setelah hari pertama, jam bergabung tetap ditekuk ke jam ramai WIB.
- **Hype & rilis (Telegram)**: `/hype [1-10]` mengatur tingkat hype (kv `hype`, bawaan 5) untuk dunia berikutnya, lengkap dengan perkiraan jam 1 / 6 jam / hari 1 / 7 / 30. `/rilis` = **rilis serentak**: pilih jumlah server (server ditambah bila kurang) dan waktu (sekarang, 19:00/20:00/21:00, atau `/rilis 6 20:30`) → semua dunia bot dihapus, semua server aktif dibuka ulang bersamaan dengan epoch = waktu rilis (`releaseAll`). Terjadwal = server tampil sebagai pra-registrasi ("Buka 20:00" di layar pilih server), bot mulai berdatangan tepat saat jam buka. Pemain asli tetap. `/server` menampilkan hype tiap server, pertambahan sejam & 24 jam terakhir, atau hitung mundur rilis.
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
- **Riwayat gacha stabil (21 Nov 2026)**: tarikan gratis ke-k diberi waktu saat ia benar-benar terhitung (total summon mencapai k+1), tarikan berbayar baru dihitung setelah waktunya → `botGacha` di waktu mana pun memberi kejadian ★3 yang sama untuk masa lalu (sebelumnya tarikan gratis bisa "tersisip mundur" di antara tarikan berbayar sehingga hasil terbaru teracak ulang). Ini syarat pengumuman ★3: yang diumumkan pasti ada di profil. Profil bot yang baru diumumkan dihitung ulang saat dibuka (`annFreshBot`, karena cache `botState` berganti per ±15 menit progres).
- **Keadaan** `botState(i,t)` (±0,4 ms): gacha tersimulasi per era (`botGacha`, mencatat kapan tiap hero/senjata didapat & tiap dupe), level akun (`botLv` dari kurva + ekor XP), lalu `botFit`: level hero, tim, senjata, perlengkapan, Kebangkitan; CP, tahap cerita, statistik (jam main, hari login, hoki), riwayat ★3, VIP.
- **CP tumbuh terus & hampir tidak pernah turun (21 Nov 2026)** — dulu level hero = pecahan acak tetap dari batasnya (langsung mentok sejak hari 1), acak satu aliran berurutan (hero baru mengacak ulang semuanya), dan anggaran Kebangkitan dihitung dari CP saat itu (CP turun sedikit → kebangkitan hilang → CP anjlok). Sekarang:
  - **Level hero naik bertahap sejak hero itu didapat**: f = f1 − (f1 − f0)·e^(−hari main sejak didapat / τ) × batas level (`HLV` per kelangkaan, pemain rapi lebih cepat & lebih penuh), tetap dibatasi emas (2 + 3×level akun) & level akun di awal.
  - **Acak stabil per hero/slot** (`bHash` + id hero), bukan satu aliran → hero baru tidak menggeser keputusan lama (senjata yang "lupa" dipasang, perlengkapan, hero favorit).
  - **Tim dipilih dulu, barang menyusul**: kekuatan "kalau dipakai" (hero + senjata terbaik kelasnya, dibagi berurutan dari hero terkuat + bintang Kebangkitan yang terjangkau + sinergi) → 3 calon tim teratas dicoba dengan barang sungguhan, diambil CP tertinggi. Senjata & perlengkapan terbaik untuk anggota tim lebih dulu; perlengkapan per posisi tim pindah ke hero pengganti.
  - **Kebangkitan mulai saat CP tim (sebelum kebangkitan) pertama kali ≥ `ASC.minCP` 26.000 (≈ tamat 5-5)**. Titik mulai itu dicari mundur sekali per bot dari hasil gacha sekarang (isi akun masa lalu = awalan urutan tarikan, `botCp0At` + `botAscStart`), disimpan di memori & localStorage `aster_botpu`. Bahan = (hari main − titik mulai) × `perDay` × tier × pengalaman × opt → tidak pernah berkurang, dan tidak macet di dinding 5-5 seperti rumus lama. Urutan belanja tetap: semua ★4 (hero → senjata → perlengkapan), lalu ★5, ★6; hero tim diurut bintang lalu lama dimiliki.
  - Hasil uji (dunia 2.000 cap, 117 bot × 45 hari, per jam): 5.494 kali naik vs 57 kali turun >0,5% (umumnya 1–5% saat ganti anggota tim). Papan atas tidak lagi diam berhari-hari: #1 22,7rb (hari 1,25) → 53rb (hari 3, mulai bangkit) → 182rb (hari 6); #10 16,1rb → 22,7rb; median aktif 8,6rb → 13,9rb. Selisih tahap (dari CP) terhadap kurva simulasi pemain asli: median 0 sampai +1 untuk hampir semua kelompok (dulu −1 s/d −4 di hari 21–30).
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

- **Paket (21 Nov 2026)**: bot pembelanja ikut membeli paket (`SPEND.bun`, peluang per tier; sultan = semua paket): sekali beli & penawaran naik level saat levelnya tercapai (dicek `botLv`), Dana Pertumbuhan (permata cair per level), mingguan/bulanan tiap periode. Isi paket: permata + tiket → tarikan, bahan Kebangkitan (asc1 + asc2×3 + asc3×30) → anggaran Kebangkitan tambahan `bx` (boleh sebelum menembus 5-5 = P2W), Paket Sultan → hero ★3 standar yang belum dimiliki. Penjualan paket dilaporkan ke bank (katalog server dari `BOTCFG.SHOP`).
- **Gaya sultan** (`SPEND.WSTYLE`, dolphin ke atas, aliran `bHash(i,61)`): kolektor (24%: bahan Kebangkitan sebagian ke hero cadangan, koleksi lengkap), setia (20%: hero kesayangan `b.love` selalu di tim & dibangkitkan dulu, avatar), meta (22%: tim terkuat), banner (20%: borongan banner ×2,2, harian ×0,45), gajian (14%: belanja ×4 di tanggal gajian) + dompet acak ×0,65–1,6. Lencana Ksatria dari dupe berlebih ditukar hero ★3 standar yang belum dimiliki (semua bot). Avatar beragam: sultan sesuai gaya, pemain lain campur favorit / hero kesayangan (selera `b.love`) / ★3 pertama / hero terkuat.
- **Persen whaler per server (21 Nov 2026)**: pemilik mengatur lewat Telegram `/whale` (kartu + tombol per server), `/whale <id> <persen>` atau `/whale semua <persen>` (juga persen untuk server baru, kv `whale`). Whaler = whale + super whale + mega whale (perbandingan 1,4 : 0,45 : 0,15 tetap), sisanya f2p : kartu : dolphin = 75 : 17 : 6. Bawaan 2%.
  Disimpan di dunia sebagai riwayat `wh = [[waktu, persen], ...]`; game memilih tier saat bot **bergabung** (`botTierW(bW(i), join)`), jadi bot lama tidak berubah (riwayat belanja, laporan bank & CP-nya tetap) — server yang belum buka: berlaku sejak buka. `/rilis` & reset bot membawa persen server masing-masing; kartu `/whale` menampilkan perkiraan persen whaler di antara pemain yang sudah bergabung. Riwayat ikut tanda tangan dunia (`wSigOf`) → cache bot dibuang saat diubah.
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

- **DM teman bot (21 Nov 2026)**: bot membaca pesanmu saat ia online (20 dtk–4 menit setelah sempat melihat; kalau offline, di sesi berikutnya — bisa sudah lewat bila kamu tidak membuka game) lalu membalas sesuai wataknya (`dmBotP`, sebagian cuma membaca) lewat Claude Haiku (`/api/dm/bot`, `DM_ROLE`, maks 60/pemain/hari). `rd` = waktu baca, balasan berjadwal (ts di masa depan) muncul saat waktunya + "sedang mengetik...". Bot yang berhenti main tidak membaca. Kadang menyapa duluan setelah berteman (`dmBotFriended`). Ajakan berteman dari bot condong ke lawan Arena 3 hari terakhir & pemain dengan CP/level mirip (`botFrNear`).
- **Kejujuran AI**: penulis AI (obrolan & DM) tidak menyebut diri AI tanpa alasan, tapi bila ditanya serius apakah ini bot/AI, tidak menyangkal & tidak mengaku manusia.
- **Pengumuman server (21 Nov 2026)** — `data/announce.js` (angka), `systems/announce.js` (mesin), `ui/announce.js` + `css/announce.css` (tampilan), server `/api/ann` + tabel `ann`:
  - ★3 & naik VIP para bot dihitung dari simulasi (deterministik): bot yang punya sesi di jendela [sekarang, +20 menit] dihitung `botGacha` + belanjanya sampai ±1 jam ke depan (`annBotEv`, cache per bot), tiap slot dipilih **satu** kejadian (★3 tiap 6 menit, VIP ≥3 tiap 20 menit, acak berbobot: terbatas ×1,5, sultan sampai ×1,6; ritme siang-malam `annSlotOn` dari `BOT_CFG.HOURS` — jam 3 pagi hanya ±20% slot). Dilaporkan ±6 menit **sebelum** terjadi; server menyimpan dengan waktu kejadian (ts masa depan) dan kunci slot unik → semua perangkat menghitung pilihan yang sama, laporan ganda diabaikan. ±120 ★3 & ±37 VIP per hari.
  - #1 CP / Arena: dari papan yang sama dengan Peringkat, dilaporkan bila #1 baru bertahan ≥2 menit (jeda 20 / 45 menit antar pergantian). Hari ke-3 ±6–8 pergantian #1 CP per hari, hari ke-14 ±1.
  - Masuk 10 besar CP pertama kali (`t10`, sekali per orang per server; bot maks 1 diumumkan per 10 menit, sisanya dicatat diam-diam).
  - Rekor pertama server: dari ringkasan bot (`botSum` kini menyimpan juga `nh` jumlah hero & `ms` ★ tertinggi, SUM_VER 8) + data pemain sendiri. Banyak rekor sekaligus → yang paling bergengsi diumumkan, sisanya dicatat diam-diam (`q`).
  - MVP Bos Dunia: dari `wbBoard` setelah bos tumbang (±25 dtk) / kabur.
  - Kejadian pemain asli (★3 dari Panggilan, naik VIP) dilaporkan saat terjadi. Akun GM hanya terlihat oleh dirinya, tidak ikut #1/rekor/MVP.
  - Tampil: strip Obrolan Dunia di beranda jadi pita emas berjalan (`annStripTick`), baris [Sistem] di Obrolan Dunia (`annChat`), Peringkat › **Rekor**. Momen besar (#1, rekor, MVP, ★3/VIP pemain asli, sebagian ★3 terbatas/hoki & VIP 7 bot) → satu adegan reaksi AI (`annHot`, jeda 4 menit); orang di pengumuman & #1 yang tergeser (bila online) ikut jadi calon penulis (`annHotBot`). Pengumuman 20 menit terakhir masuk konteks AI.
  - Biaya: pindai pertama hari ke-30 (9,4rb bot) ±1,6 dtk CPU dalam potongan 6 ms; berikutnya ±50 ms (cache per bot).

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

- `botSum(i,t,sync)`: ringkasan (cp, lv, vip, top, stage, nh = jumlah hero, ms = ★ tertinggi). Bot berhenti main → disimpan di localStorage `aster_botsum` (maks ±900rb karakter, dibuang dulu bila kuota penuh — save pemain selalu menang, `lsPut`). Bot aktif → `BSUMA` per kunci `botKey` (progres per 15 menit efektif + level), **ikut disimpan bersama kuncinya** (21 Nov 2026) → buka game lagi hanya menghitung bot yang sudah main sejak terakhir (server 10rb hari 30: ±0,5 dtk, bukan ±5 dtk). Titik mulai Kebangkitan per bot: `aster_botpu`.
- **Realtime**: ringkasan basi dipakai sebentar, bot dimasukkan antrean `BSQ`, `botsFresh` menghitung ulang di latar tiap 8 dtk (potongan 8 ms) lalu peringkat/profil yang terbuka diperbarui (refresh 5 dtk, memo daftar 6 dtk).
- `botsWarm`: semua bot dihitung bertahap tiap 2 menit (yang kuncinya sama tidak dihitung ulang). Pertama kali di perangkat: server 10rb hari 3 (5,2rb bot) ±2,5 dtk, hari 30 (9,4rb bot) ±9,5 dtk di latar (`botState` ±0,8 ms, ±40% di gacha).
- Cache: `botState` LRU 15rb, sesi 60rb, hari progres 80rb, belanja 20rb. Semua dibersihkan saat dunia di-reset (`botsApplyWorld`).

## 10. Simulator & kurva (`tools/botsim`)

- `sim2.js` memainkan game asli tanpa layar: tempur sungguhan, gacha, toko, Toko Emas, dungeon + Sapu, Sapu tahap, cerita (waktu baca), tutorial, misi, event, Kotak Surat, lebur, pasang otomatis, perlengkapan, Kebangkitan; Arena & Bos Dunia sebagai hadiah perkiraan; anggaran waktu per sesi.
- `runall.sh 30` → 4 profil × 3 pengalaman × 2 seed (±25 menit). `runwhale.sh 30` → pembelanja besar (±25 menit). `mkcurves.py /tmp/s4 /tmp/s5` → `curves2.js`, tempel ke `BOT_CFG.CURVES`, lalu naikkan `SUM_VER`.
- Kolom kurva: `[hari efektif, lv, total summon, lv senjata tim, LB senjata tim, jam main, tahap cerita tamat]`; 3 hari pertama per sesi, lalu per hari sampai 30, sesudahnya ekor XP.
- **Kapan menjalankan ulang**: setiap ada perubahan EXP/stamina/hadiah/biaya/tahap baru/fitur yang memberi sumber daya. Kalau tidak, bot memakai keseimbangan lama.

## 11. Angka acuan (dunia uji)

| Saat | Yang terlihat |
|---|---|
| _(tabel ini dunia uji lama 100rb bot, sebelum perbaikan CP 21 Nov 2026 — angka papan atas sekarang lihat §4 "CP tumbuh terus")_ | |
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
- **Momen peringkat** lanjutan: chat ramai saat ada yang tembus 10 besar (ganti #1 sudah: pengumuman server).
- **Rival bertingkat**: rival dari pemain asli lain (bila nanti ramai), rival guild.
- **Batas level akun** (keputusan desain game, berlaku juga untuk pemain asli).
- Guild & perang wilayah 20.00–21.00 (bot ikut).
