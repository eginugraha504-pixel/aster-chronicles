/* =====================================================================
   PEMAIN BOT — semua angka penyetel ada di sini (mesin: systems/bots.js,
   tampilan: ui/leaderboard.js). Bot memakai aturan game ASLI: peluang gacha
   (RATES/PITY), level cap (maxLv), senjata (wMaxLv), rumus CP (teamCP) dan
   formasi terbaik (bestTeam). Jadi saat balance game diubah, bot ikut berubah.
   ---------------------------------------------------------------------
   Kurva progres diambil dari simulasi F2P (test/runsim.py, pemain rajin).
   Setelah update besar: jalankan simulasi lagi lalu salin angka per hari ke
     ===================================================================== */
const BOT_CFG={
 max:10000,                   // jumlah bot maksimum
 epoch:Date.UTC(2026,10,13,17,0,0), // waktu "rilis" dunia bot (14 Nov 2026 00:00 WIB)
 launch:0,                    // pemain yang langsung ada saat rilis (0 = mulai dari nol)
 tau:12,                      // hari; makin kecil makin cepat bertambah (kurva 1 - e^(-t/tau)): ±8% hari ke-1, 44% hari ke-7, 92% hari ke-30
 // profil gaya main. a = variasi kecepatan relatif kurva profilnya; sess = sesi per hari [min,maks];
 // opt = seberapa optimal pemain menyusun tim/meningkatkan senjata; chrono = geser jam main (jam)
 profiles:[
  {id:'santai',  w:40,a:[.75,1.15],sess:[1,3],opt:.55,len:[6,18]},
  {id:'reguler', w:35,a:[.8,1.15], sess:[3,5],opt:.72,len:[8,22]},
  {id:'rajin',   w:20,a:[.85,1.12],sess:[5,7],opt:.86,len:[10,30]},
  {id:'hardcore',w:5, a:[.9,1.1],  sess:[7,10],opt:.97,len:[15,45]},
 ],
  CURVES:{ // [hari bermain, level akun, total summon (hero+senjata), rata2 level senjata tim, rata2 LB senjata tim, jam main] — dari test/runsim.py
   santai:[[0,1,0,1,0,0],[0.05,5,50,15,0,0.05],[1,11,67,30,1,0.3],[2,15,104,30,1,0.6],[3,18,117,30,1,0.8],[4,23,134,35,1.5,1.3],[5,24,156,32.5,1.25,1.3],[6,26,190,32.5,1.25,1.7],[7,29,202,35,1.5,1.9],[8,30,232,37.8,2,2.1],[9,31,238,40,2,2.2],[10,33,240,40,2,2.5],[11,35,267,42.5,2.25,2.8],[12,37,268,42.5,2.25,3.1],[13,39,269,42.5,2.25,3.3],[14,41,281,42.5,2.25,3.7],[15,43,283,42.5,2.25,4],[16,44,284,45,2.5,4.2],[17,45,285,47.5,3,4.3],[18,46,298,50.5,3.25,4.4],[19,47,300,55,3.5,4.5],[20,47,301,57,3.75,4.6]],
   reguler:[[0,1,0,1,0,0],[0.05,5,69,15,0,0.05],[1,13,92,8.3,0.25,0.3],[2,17,104,22.5,0.5,0.6],[3,22,132,27.5,0.75,1.1],[4,29,144,30,1,1.9],[5,32,196,35,1.5,2.3],[6,35,208,37.5,1.75,2.8],[7,39,253,37.5,1.75,3.5],[8,43,266,40,2,4.1],[9,45,296,44.5,2.5,4.4],[10,47,297,47.5,2.75,4.8],[11,49,299,51.3,3.25,5.1],[12,51,313,57.5,3.75,5.3],[13,53,326,60,4,5.7],[14,55,327,60,4,6.2],[15,58,328,60,4,6.7],[16,60,329,60,4,7.3],[17,63,330,60,4,7.9],[18,65,332,60,4,8.5],[19,67,344,60,4,9.1],[20,69,345,60,4,9.7]],
   rajin:[[0,1,0,1,0,0],[0.05,5,50,15,0,0.05],[1,15,67,32.5,1.25,0.5],[2,20,79,32.5,1.25,1.1],[3,25,133,35,1.5,1.8],[4,31,171,36.5,1.75,2.5],[5,36,182,37.5,1.75,3.2],[6,41,239,37.5,1.75,4.1],[7,44,251,40,2,4.7],[8,48,264,47,2.75,5.2],[9,50,296,53.3,3.5,5.6],[10,53,308,60,4,6],[11,56,310,60,4,6.8],[12,60,311,60,4,7.7],[13,63,324,60,4,8.5],[14,66,325,60,4,9.3],[15,69,326,60,4,10.1],[16,72,327,60,4,10.9],[17,75,329,60,4,11.7],[18,78,342,60,4,12.5],[19,80,343,60,4,13.2],[20,83,344,60,4,14]],
   hardcore:[[0,1,0,1,0,0],[0.05,5,80,15,0,0.05],[1,22,107,30,1,1.1],[2,31,142,30.5,1.5,2.1],[3,39,203,35,1.5,3.2],[4,46,233,40.5,2.25,4.2],[5,50,269,52.5,3.5,4.7],[6,55,280,60,4,5.5],[7,60,291,60,4,6.6],[8,65,292,60,4,7.7],[9,70,298,60,4,8.8],[10,75,299,60,4,10],[11,79,300,60,4,11.1],[12,83,315,60,4,12.2],[13,86,316,60,4,13.3],[14,90,317,60,4,14.4],[15,93,318,60,4,15.4],[16,96,320,60,4,16.5],[17,100,321,60,4,17.6],[18,103,333,60,4,18.7],[19,106,334,60,4,19.7],[20,108,335,60,4,20.8]],
  },
 XP_TAIL_DAYS:5,                // setelah kurva habis: kecepatan EXP = rata2 5 hari terakhir kurva
 HERO_SHARE:.62,                 // porsi summon untuk banner hero (sisanya banner senjata)
 // jam ramai (WIB, 0..23): bobot peluang sebuah sesi dimulai di jam itu
 HOURS:[2,1,.5,.3,.3,.6,1.5,2.5,2,1.5,1.5,2,3.5,3,2,2,2.5,3,3.5,5,6,6.5,5,3.5],
 TZ:7,                           // WIB = UTC+7
 WEEKEND_EXTRA:1,                // sesi tambahan di Sabtu/Minggu
 // berhenti main: [setelah hari ke-N, peluang]. Sebelum berhenti, progres melambat (fade)
 churn:[[1,.30],[3,.15],[7,.15],[14,.10],[30,.08]],
 FADE:.3,FADE_RATE:.4,           // 30% terakhir masa aktif hanya 40% kecepatan
 COMEBACK:{p:.3,days:[2,7],rate:.8},   // peluang kembali saat era banner baru dimulai
 // ---- linimasa banner (untuk riwayat gacha bot). TAMBAHKAN ERA BARU setiap merilis banner terbatas ----
 // hero: rate-up yang dikejar; limited: hero terbatas pada era itu; wpn: rate-up banner senjata (null = standar)
 ERAS:[
  {at:Date.UTC(2026,10,13,17,0),hero:['seraphine'],limited:[],wpn:[null]},          // rilis: Panggilan Fajar
  {at:Date.UTC(2026,10,15,4,32),hero:['raika'],limited:['raika'],wpn:['raijin']},   // Raika rilis
  {at:Date.UTC(2026,10,15,4,47),hero:['raika','sakuya'],limited:['raika','sakuya'],wpn:['raijin']},  // Sakuya jadi terbatas
  {at:Date.UTC(2026,10,15,4,57),hero:['raika','sakuya'],limited:['raika','sakuya'],wpn:['raijin','hanafubuki']},  // banner senjata terbatas
 ],
 // kapan hero masuk ke game (default: sejak rilis). Senjata signature ikut pemiliknya.
 HERO_SINCE:{vela:Date.UTC(2026,10,15,1,1),bruna:Date.UTC(2026,10,15,1,1),nami:Date.UTC(2026,10,15,1,1),kuro:Date.UTC(2026,10,15,1,1),lumi:Date.UTC(2026,10,15,1,1),raika:Date.UTC(2026,10,15,4,32)},
 CHASER:.6,                      // porsi pemain yang mengejar banner rate-up (sisanya banner standar)
 GEAR_FROM_DAY:2,             // mulai punya Pelindung/Aksesori
 BENCH_LV:[.35,.7],           // level hero cadangan relatif terhadap cap
 // nama: dibuat Claude (integrasi sample) lalu disimpan bersama di db; hanya huruf & angka
 // bio/status profil: dibuat Claude, bertag supaya cocok dengan keadaan bot
 BIO_TAGS:['umum','santai','kompetitif','pemula','sial','hoki','raika','sakuya','farming'],
 BIO_MAX:240,BIO_BATCH:60,BIO_SHARE:.7,
 BIO_PROMPT:n=>`Buat ${n} status/bio profil pendek seperti yang ditulis pemain sungguhan di game mobile gacha fantasi pixel "Aster Chronicles". `+
  `Konteks game: hero terbatas Raika (pemanah petir bercaping) dan Sakuya (miko rubah api), hero standar Seraphine, gacha dengan pity, dungeon untuk farming, stamina, peringkat CP. `+
  `Gaya: mayoritas bahasa Indonesia santai/gaul, sebagian Inggris, sedikit romaji Jepang; boleh lucu, curhat gacha, ajakan santai, target pribadi. `+
  `ATURAN: maksimal 40 karakter, tanpa emoji, tanpa tautan, tanpa @, tanpa info pribadi, sopan dan ramah keluarga, jangan sebut orang nyata atau merek. `+
  `Beri tiap status satu tag dari: umum, santai, kompetitif, pemula, sial, hoki, raika, sakuya, farming (raika/sakuya = sudah punya hero itu; sial = gacha apes; hoki = gacha beruntung). `+
  `Balas HANYA array JSON berisi objek {"t":"teks","tag":"tag"}.`,
 BIO_LOCAL:[['umum','Santai aja yang penting konsisten'],['santai','Login harian doang hehe'],['kompetitif','Target top 10 CP'],['pemula','Baru mulai, mohon bimbingannya'],['sial','Pity terus, kapan hoki'],['hoki','Sekali tarik langsung dapet'],['raika','Raika main, Raika istri'],['sakuya','Sakuya terbaik, no debat'],['farming','Farming dungeon tiap malam'],['umum','Ganbatte minna'],['santai','Main pas istirahat kerja'],['kompetitif','CP dulu, tidur nanti']],
 NAME_RE:/^[A-Za-z0-9]{3,14}$/,
 NAME_BATCH:100,
 NAME_PROMPT:n=>`Buat ${n} nickname pemain game mobile gacha fantasi yang unik dan berbeda-beda, seperti yang dipakai pemain sungguhan. `+
  `Campur gaya: nama Indonesia, Inggris, nuansa Jepang, kata lucu, gamer tag, kadang diakhiri angka. `+
  `ATURAN KERAS: hanya huruf A-Z a-z dan angka 0-9, tanpa spasi, tanpa simbol apa pun (tidak boleh / . - ! , : @ _ dll), panjang 3-14 karakter, sopan dan ramah keluarga, tidak memakai nama orang terkenal atau merek. `+
  `Balas HANYA array JSON berisi string, tanpa teks lain.`,
 // cadangan bila Claude tidak tersedia (mis. dibuka sebagai file lokal): suku kata acak
 SYL:['ra','ki','no','sa','ri','ta','ka','mi','yu','to','ze','lu','ar','en','ko','vi','ba','do','na','ha','shi','ren','dar','vel','mo','ji','ga','ru','ne','fa'],
};
