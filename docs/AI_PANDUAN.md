# Panduan Aster Chronicles untuk AI (Mode AI obrolan)

File ini adalah pengetahuan tangan yang digabungkan oleh `tools/gen_knowledge.mjs` dengan data game
(hero, senjata, tahap, toko, event, dst. diambil otomatis dari `src/js/data/*.js`) menjadi
`bank-worker/src/knowledge.js`. Pengetahuan itulah yang dibaca Claude Haiku saat menulis obrolan para pemain bot.
Ubah/tambah teks di sini bila ada fitur baru yang perlu dijelaskan dengan kata-kata.

## Tentang game
- Aster Chronicles: Ksatria Piksel — game gacha RPG pixel anime (chibi) buatan HUN2 STUDIO, layar potret, bisa dimainkan di HP (iPhone) lewat browser.
- Cerita: kegelapan menyelimuti Kerajaan Aster. Pemain adalah "Kapten" yang memimpin para ksatria (semua hero perempuan) menembus 5 dunia sampai Puncak Aster dan mengalahkan Ksatria Kegelapan yang mencuri kekuatan fajar. Ratu Aster dan Pandai Besi Bram mengirim surat dan hadiah.
- Semua hero bersuara dub Jepang. Splash art ★3 bergerak (Live2D: bernapas, rambut berkibar, berkedip). Ada musik khusus layar login dan musik menu.
- Bahasa UI: Indonesia, Inggris, Jepang.

## Navigasi layar
- Bar atas: avatar + level akun, Stamina (petir), Emas (koin), Permata (berlian, tombol + membuka Top Up).
- Beranda: hero pilihan berdiri besar di tengah (geser ‹ › untuk ganti, ketuk = ia bereaksi dan bicara), banner gacha berputar di atas, tombol kiri (Event, Misi, Hadiah/Kotak Surat, Toko), kanan (CP Tim, Tim, Peringkat, Menu/Pengaturan), bawah (ARENA, PETUALANGAN, EVENT), strip Obrolan Dunia di atas tombol Arena.
- Bilah bawah: Beranda, Petualangan, Tim, Hero, Summon, Misi.
- Menu/Pengaturan: bahasa, efek suara, musik, suara karakter (dub Jepang), Mode AI obrolan, hapus progres, reset dunia bot.

## Cara bermain inti
1. Petualangan > Cerita: 5 dunia × 5 tahap (1-1 sampai 5-5). Tahap ke-5 tiap dunia adalah BOS. Tiap tahap butuh stamina (6, bos 8) dan punya CP rekomendasi. Kemenangan pertama memberi permata (bos lebih banyak). Bintang tahap (maks 3) dari seberapa bagus menang.
2. Pertempuran real-time otomatis: hero menyerang sendiri; skill bisa diaktifkan dengan mengetuk kartu hero (atau Auto), kecepatan ×1/×2, jeda, keluar. Beberapa gelombang musuh; hero yang hidup pulih 25% HP tiap ganti gelombang. Hero jarak dekat melakukan dash serang.
3. Tim: 4 slot. Tombol Tim Otomatis menyusun tim terkuat. CP Tim = kekuatan gabungan + bonus: Resonansi elemen (2 sama +5%, 3 +10%, 4 +15%), Formasi Seimbang (ada Penjaga + Pendukung) +12%, Tim Lengkap 4 hero +3%, tiap Senjata Signature di pemiliknya +2%.
3b. Tahap yang sudah dimenangkan bisa dimainkan ulang atau disapu (Sapu = selesai instan, emas & EXP tanpa permata) paling banyak **5 kali per tahap per hari** (tahap bos 3 kali); kemenangan pertama & kekalahan tidak dihitung. Habis → tombol "Tambah Batas" (permata: 50, lalu 100, lalu 200; maks 3× per tahap per hari) atau tunggu reset tengah malam. Jadi EXP harian ada batasnya: naik level makin lama makin pelan.
4. Level akun naik dari EXP tahap; tiap naik level stamina langsung terisi PENUH sesuai batas level baru (kalau sedang lebih dari batas, tidak dikurangi). Level hero maksimum = level akun × 2 + 10 (dan batas per bintang: ★1 30, ★2 40, ★3 50, +2 per Limit Break). Naik level hero pakai emas.
5. Stamina maks = 60 + level akun (Lv 20 = 80, maks 200), +1 tiap 2 menit; bisa diisi ulang dengan permata 5× sehari (100/150/200/300/400 permata); tiap isi ulang menambah stamina sebanyak batas saat ini (Lv 20 = +80). Stamina dari hadiah boleh melewati batas.
5b. Bos Dunia (terbuka Lv 8): naga raksasa muncul tiap hari pukul 12.00, 16.00, 20.00, 23.00 WIB selama 10 menit (diumumkan 10 menit sebelumnya, beranda jadi merah & musiknya tegang). Satu bar HP untuk semua pemain; tim yang tumbang bangkit lagi setelah 10 detik; tidak pakai stamina. Lima wujud bergilir: Naga Abu (gelap), Naga Bara (api), Naga Samudra (air), Naga Rimba (tanah), Naga Fajar (cahaya) — pakai elemen yang unggul. Fase di 75%/50%/25% HP: mengamuk, Sisik Baja (hanya elemen unggul yang menembus penuh), Amukan Terakhir. Ada peringkat damage langsung di samping layar. Hadiah lewat Kotak Surat setelah raid: #1 300 permata + 3 Bijih Tempa Ungu + Inti Bintang + 30 lencana + 50rb emas, #2 200 permata, #3 150 permata, #4–10 60 permata, sisanya emas & bijih; peti kontribusi bila menyumbang ≥1%/3%/5% HP bos; pukulan terakhir +100 permata. Kalau waktu habis bos kabur dan hadiah dipotong setengah. Mingguan: Poin Pemburu (total damage Senin–Minggu), top 3 dapat Kristal Kebangkitan.
6. Dungeon (Petualangan > tab Dungeon): Tambang Bijih (Bijih Tempa untuk level senjata, drop Pelindung) dan Kuil Bintang (Serpihan/Kristal/Inti Bintang untuk Limit Break senjata, drop Aksesori). Tingkat dungeon terbuka sesuai tahap cerita yang sudah selesai.

## Gacha (Summon)
- Banner hero & banner senjata, pity terpisah. 1× = 300 permata, 10× = 2.700 permata (atau Tiket Hero/Tiket Senjata). Ada 1 summon gratis harian di banner hero.
- Peluang: ★3 3%, ★2 19%, ★1 78%. Soft pity mulai tarikan ke-66 (+6% tiap tarikan), hard pity 80 = ★3 pasti. Pity terbawa antar banner.
- Rate On/Off: di banner rate-up, ★3 punya peluang 50% (senjata 75%) jadi item rate-up. Kalau kalah (rate off), ★3 berikutnya DIJAMIN rate-up.
- Pity ≥66 artinya SUDAH masuk soft pity (peluang ★3 naik tiap tarikan); 80 = pasti ★3.
- Hero ★3 standar (Marisa, Hilde, Celestine, Aurelia, Lilith, Coppelia) TIDAK punya banner sendiri: mereka muncul sebagai ★3 biasa (bukan rate-up) di banner hero mana pun, dan bisa dipilih lewat hadiah "Pilih 1 Hero ★3" atau Toko Lencana.
- Banner terbatas: hero terbatas (Raika, Sakuya) hanya ada di banner-nya; senjata signature mereka ikut terbatas. 10× menjamin minimal satu ★2.
- Duplikat hero = Limit Break (+1, maks +5): stat naik 10% dan batas level +2. Duplikat setelah +5 jadi Lencana Ksatria (★1: 1, ★2: 5, ★3: 25) untuk Toko Lencana.

## Senjata & perlengkapan
- Tiap hero memakai 1 senjata sesuai kelasnya (Pedang, Busur, Tongkat, Perisai, Kapak). Senjata signature (milik hero tertentu) memberi efek tambahan bila dipakai pemiliknya.
- Level senjata pakai Bijih Tempa (Kecil 100 EXP, Biru 400, Ungu 1.500) + emas. Batas level 20/30/40/50/60 per tahap Limit Break senjata (0–4); Limit Break senjata pakai Serpihan/Kristal/Inti Bintang + emas.
- Senjata/perlengkapan duplikat disimpan sebagai salinan: pasang ke hero lain, Tempa (lebur salinan ke senjata utama, +10% stat, maks 5), atau Lebur jadi material.
- Pelindung (HP+DEF) & Aksesori (ATK+Crit) untuk semua hero, bisa di-enhance (+5/+10/+15 menurut bintang) dengan emas & bijih. Bos dunia memberi item pasti pada kemenangan pertama.

- **Pasang Terbaik** (tombol di layar Tim, detail hero, dan koleksi): otomatis memasang senjata, pelindung, dan aksesori yang membuat CP tiap hero tim paling tinggi (signature ikut diperhitungkan). Formasi Terbaik sekarang juga memasang perlengkapan terbaik. Ada pilihan pasang otomatis saat dapat barang baru.
- **Tungku Peleburan** (Hero › Senjata/Perlengkapan, atau layar Tim): lebur salinan cadangan jadi emas (★1 1.000, ★2 3.000, ★3 8.000), Bijih Tempa (★1: 4 kecil; ★2: 2 kecil + 2 biru; ★3: 2 biru + 2 ungu), dan material Limit Break (★2: 1 Serpihan Bintang, ★3: 1 Kristal Bintang). Barang yang pernah ditingkatkan mengembalikan 80% material & 50% emas yang dipakai. Salinan terbaik tiap jenis & yang dipakai tidak pernah dilebur. Bisa lebur otomatis salinan ★1 (bawaan) atau ★1–★2 saat dapat barang.

## Ekonomi & hadiah
- Permata dari: kemenangan pertama tahap, misi harian, pencapaian, event, Kotak Surat, hadiah Arena, Top Up.
- Misi harian (reset 00:00 WIB) + bonus semua misi. Pencapaian permanen. Event: Login Pemula 7 Hari (hari ke-7 pilih hero ★3), Misi Pemula, event terbatas seperti Festival Badai Raijin.
- Kotak Surat (tombol Hadiah): paket pemula (1.500 permata, 10 Tiket Hero, 5 Tiket Senjata, Pedang Perak ★2, bahan tempa, Pilih 1 Hero ★3), hadiah Arena, permata harian Kartu Bulanan.
- Toko (tab Paket, Top Up, Toko Emas, Lencana): Toko Emas (bijih, material bintang, stamina, tiket; stok reset harian) + **Beli Emas pakai permata** (maks 10×/hari, 20→400 permata, emas = 50rb + 5rb × level akun, kadang KRITIS ×2/×3), Toko Lencana (tukar Lencana Ksatria: pilih hero ★3 standar 300, senjata ★3 standar 200, tiket, bijih), Paket, dan Top Up.
- **Paket** (uang mainan, dibayar lewat bot bank seperti Top Up): Paket Pemula Rp15rb (sekali: 600 permata, 5 Tiket Hero, 100rb emas, 120 stamina, 10 Kristal Kebangkitan), Paket Petualang Rp79rb (Lv 10+), Paket Sultan Rp499rb (Lv 15+: pilih 1 hero ★3, 8.000 permata, 30 Tiket Hero, 20 Tiket Senjata, 3 jt emas, bahan Kebangkitan termasuk Air Mata Dewi), Dana Pertumbuhan Rp99rb (permata cair tiap naik level, total 19.000), Paket Mingguan Hemat Rp29rb & Paket Mingguan Kebangkitan Rp149rb (reset Senin), Paket Bulanan Sultan Rp999rb, dan **penawaran naik level** (Paket Lv 10/20/30/40/50/60/80/100, Rp29rb–Rp799rb, hanya 48 jam setelah level itu tercapai). Bahan Kebangkitan dari paket bisa dipakai kapan saja — sultan bisa membangkitkan hero sebelum menamatkan 5-5.
- Top Up (uang mainan): paket permata Rp16rb–Rp1,599jt dengan bonus 2× pada pembelian pertama tiap paket, Kartu Bulanan Rp79rb (600 permata langsung + 180/hari selama 30 hari lewat Kotak Surat). Dibayar lewat bot Telegram "Bank Central Universe"; permata masuk otomatis. Total belanja menentukan tingkat VIP 1–7 yang terlihat di peringkat & chat.

## Arena PvP
- Lawan = pemain lain di peringkat (tim & CP asli mereka). 5 tiket per hari (reset 00:00 WIB). Pilih dari 3 lawan (lebih lemah/setara/lebih kuat), Cari Lawan Lain, Pertarungan Cepat (setelah 1 kemenangan).
- Poin Elo: menang lawan yang lebih kuat = poin lebih besar. Liga: Perunggu (0), Perak (1150), Emas (1300), Platinum (1450), Berlian (1600), Legenda (1800). Musim mingguan mulai Senin 00:00 WIB; poin di atas 1000 dipotong setengah saat musim baru.
- Batas 90 detik (habis = penyerang kalah). Setelah 15 detik "Kemarahan Arena": damage naik 7%/detik, penyembuhan di Arena ×0,7.
- Tim Bertahan: pemain lain menyerangnya saat mereka online; riwayat ada di tab Riwayat. Kekalahan bertahan bisa dibalas (tombol Balas). Pemain yang kamu kalahkan juga bisa balas dendam.
- Hadiah harian (sesuai liga, bila bertarung hari itu) dan hadiah akhir musim lewat Kotak Surat.

## Peringkat & dunia pemain
- Server: game punya beberapa server (S1 Aster, S2 Lumina, S3 Bara, S4 Samudra, server baru dibuka berkala). Tiap server maks 10.000 pemain dengan peringkat, obrolan dunia, Bos Dunia, dan Arena sendiri. Akun terikat ke server yang dipilih saat daftar dan tidak bisa pindah. Server baru biasanya paling ramai pemain baru.
- Peringkat: tab CP Tim, Level, Arena, Rekor. Ada label BARU (pemain baru) dan KEMBALI (kembali main), indikator online, naik/turun peringkat.
- Rekor server (tab Rekor): siapa yang PERTAMA di server menamatkan tiap dunia, menembus CP 10.000 / 50.000 / 100.000 / 250.000 / 500.000 / 1.000.000 / 2.000.000, punya hero ★4 / ★5 / ★6, dan mengoleksi semua hero. Rekor tercatat selamanya sampai server dibuka ulang dan diumumkan sistem.
- Tiap server berisi sampai 10.000 pemain lain yang bermain di jam masing-masing (ramai malam hari WIB), ada yang santai, reguler, rajin, hardcore; ada yang gratis, pakai Kartu Bulanan, belanja sedang, sampai sultan (sultan memborong semua paket & mengejar koleksi hero lengkap; gayanya beda-beda: kolektor, setia pada satu hero, ikut meta, borong tiap banner, belanja pas gajian). Ada yang menabung permata untuk banner tertentu, ada yang ganti nama, ada yang berhenti lalu kembali saat banner baru.
- Profil pemain: favorit, tim utama, koleksi hero, total summon, ★3 didapat, hari login, waktu main, status hoki/apes gacha, bio, VIP, Kartu Bulanan.
- Rival: di atas Peringkat ada bar ⚔ Rival — satu pemain yang CP-nya kejar-kejaran denganmu (selisih CP, skor salip-menyalip). Kalau kamu menyalipnya ia biasanya farming lebih keras di sesi berikutnya; kalau selisih sudah jauh ia bisa menyerah atau melesat, lalu muncul rival baru.

## Obrolan Dunia
- Chat global semua pemain. Ketuk nama untuk melihat profil. Sebut nama dengan @nama.
- Pengumuman sistem (pita berjalan emas di beranda + baris [Sistem] di Obrolan Dunia, sama untuk semua pemain): seseorang mendapat ★3 dari Panggilan (kadang "Hoki! … hanya dalam N tarikan"), naik VIP (VIP 3 ke atas), merebut Peringkat #1 CP atau puncak Arena, masuk 10 besar CP untuk pertama kali, mencetak rekor pertama server, dan MVP (damage terbesar) Bos Dunia. Tidak semua ★3 diumumkan (dipilih berkala supaya tidak banjir; malam hari lebih jarang).

## Tips yang benar (boleh dipakai pemain saat menjawab)
- Kalah di tahap: naikkan level hero, level & Limit Break senjata (dungeon), pasang Pelindung & Aksesori, manfaatkan keunggulan elemen (api > tanah > air > api; cahaya ⟷ gelap saling kuat ×1,3; kalah elemen ×0,75), pakai Penjaga + Pendukung.
- Permata sebaiknya untuk banner rate-up yang diinginkan; Tiket Hero bisa dipakai di banner mana pun.
- Senjata signature pada pemiliknya = efek tambahan + bonus CP.
- Bos dunia: 1-5 Raja Goblin, 2-5 Slime Kristal Raksasa, 3-5 Ksatria Kegelapan, 4-5 slime raksasa yang menelan inti api di Sarang Badai, 5-5 Ksatria Kegelapan yang bangkit lagi di Takhta Puncak.

## Kebangkitan (update besar 18 Nov 2026)
- Kalau pemain tanya cara naik ke ★4/★5/★6: selesaikan 5-5 → buka Menara Kebangkitan di Petualangan > Dungeon (5×/hari) → kumpulkan Kristal Kebangkitan/Inti Surgawi/Air Mata Dewi + Lencana Ksatria + emas → maksimalkan level dulu → tekan pita ungu "Kebangkitan" di detail hero/senjata/perlengkapan.
- Bab II (Dunia 6–8) memang dirancang untuk tim ★4–★6. Wajar kalau pemain mentok di 6-x berhari-hari.
- ★6 itu sangat langka dan butuh berbulan-bulan; jangan bilang ada yang bisa membelinya. Penghambat utamanya Air Mata Dewi.
- Bingkai ★4 ungu ametis, ★5 merah rubi bersayap, ★6 pelangi bersayap berkilau — pemain suka pamer bingkai ★6.
- Hero ke-14 **Hilde** (18 Nov 2026): ★3 standar, Tanah, Petarung, kapak. Putri suku serigala dari pegunungan utara, ceria & liar, telinga & ekor serigala, kapak batu berukir rune. Skill AoE "Amukan Rune Gunung". Senjata khas Kapak Rune Gunung (★3). Ada di semua banner (bukan limited). Splash Live2D, suara Jepang.
- Hero ke-15..17 (18 Nov 2026), semuanya ★3 standar (ada di semua banner, bukan limited), splash Live2D + suara Jepang:
  **Celestine** (Biarawati Perisai Suci, Cahaya, Penjaga/tank, skill perisai "Aegis Fajar Suci", senjata Perisai Sayap Mentari) — lembut, keibuan.
  **Aurelia** (Pemanah Phoenix, Api, Pemanah, skill tembakan tunggal besar "Panah Kelahiran Phoenix", senjata Busur Bulu Phoenix) — percaya diri, sedikit tsundere.
  **Lilith** (Biduan Gerhana, Gelap, Pendukung/penguat ATK tim, skill "Serenade Gerhana", senjata Tongkat Mikrofon Gerhana) — idola gothic bertanduk kecil, genit-jahil.
  **Seraphine DIHAPUS** (18 Nov 2026, permintaan Egi: terlalu mirip Celestine). Pemilik Seraphine otomatis mendapat Celestine (level/LB/ascend/gear pindah; kalau sudah punya Celestine → LB +1+LB Seraphine) lewat `HERO_REPLACED` di `systems/state.js`, plus surat `sera_swap` (5 Tiket Hero). Modul seni `art/heroes/seraphine.js` dibuang.
- Hero ke-18 **Coppelia** (Boneka Jam Ksatria, Netral, Petarung, skill tunggal "Waltz Roda Gigi Terakhir", senjata Pedang Roda Gigi) — boneka mekanik steampunk berambut bob perak, kunci putar di punggung, tenang & datar. Dibuat supaya TIDAK mirip hero lain (satu-satunya bertema mesin; palet tembaga/hitam/merah marun + aksen teal).
  Sekarang 6 hero ★3 standar mencakup ke-6 elemen: Marisa (Air), Hilde (Tanah), Celestine (Cahaya), Aurelia (Api), Lilith (Gelap), Coppelia (Netral) (+ Sakuya & Raika limited). Total 17 hero.
- **Cerita Utama (18 Nov 2026)** — sinopsis untuk jawaban AI/obrolan: Kapten jatuh bersama bintang di Padang Hijau tanpa ingatan, memegang Kompas Aster (bisa memanggil pahlawan = summon). Ditemukan Mira & Noa, bersama Pia & Rin mengusir goblin. Bintang Aster (kristal penjaga fajar) retak; pecahan hitam membuat pemegangnya jahat. Kuro (ninja magang, selalu tersangkut) membawa mereka ke Ratu Aster; Lumi (lenteranya condong ke Kapten) ikut. Bruna menahan longsor di Gua Kristal; Vela melihat bayangan Kapten "berbeda"; Ksatria Kegelapan kabur dibawa Sosok Berkerudung; Aurelia & Hilde (rival lucu, Rin ngefans Hilde) di Lembah Badai; Celestine kehilangan Mahkota Fajar; di Puncak zirah Ksatria Kegelapan ternyata kosong, fajar kembali (BAB I selesai). BAB II: bulan perak & tidur — Lilith bernyanyi membangunkannya (Vela diam-diam fans berat Lilith); lonceng Kota Tenggelam memanggil darah naga Marisa, kampung Nami; Coppelia ditemukan & diputar kuncinya, ternyata Kompas Aster buatan tuannya Maestro Orloj. Di Singgasana Kehampaan, Raja Kehampaan = Orloj yang dirasuki; setelah kalah ia mengungkap **Kapten adalah jantung Bintang Aster** — lalu mata raksasa penguasa Kehampaan sejati menelan Orloj. *Bersambung.*
  Kepribadian di cerita: Mira tenang & kering, Noa gugup & kutu buku (pemandu tutorial), Pia menyebut dirinya "Pia", Rin heboh, Kuro datar & sial, Lumi lembut, Bruna irit kata, Vela misterius tapi salting soal Lilith, Hilde "Hahaha!", Aurelia tsundere, Celestine keibuan, Lilith genit "Fufu~", Nami ceria, Marisa penyayang, Coppelia sopan & kaku.
