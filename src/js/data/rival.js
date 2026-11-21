// ===== Rival abadi: angka penyetel =====
// Selalu ada SATU bot yang menjadikanmu sasaran. Bot dipilih karena lajunya memang mirip denganmu (bukan dipaksa mengikuti),
// usahanya terbatas sesuai dompet & pengalamannya, dan ia bisa kalah lalu menyerah. Lihat docs/BOTS.md bagian "Rival abadi".
const RIVAL_CFG={
 minLv:5,                 // rival pertama muncul setelah kamu Lv 5
 firstAfter:20*6e4,       // ...dan setidaknya 20 menit setelah syarat terpenuhi (tidak langsung saat tutorial)
 band:[.85,1.3],wide:[.7,1.6],   // rentang CP calon rival terhadap CP-mu (yang lebar dipakai kalau sepi)
 maxCand:40,              // calon terdekat yang dihitung laju CP-nya
 rateWin:48*36e5,         // jendela laju CP (CP sekarang / CP 48 jam lalu)
 activeWithin:24*36e5,    // calon harus pernah online 24 jam terakhir...
 stayDays:4,              // ...dan masih akan bermain setidaknya 4 hari lagi
 minAge:36e5,             // ...dan sudah bergabung setidaknya 1 jam
 flip:{eps:.004,hold:5*6e4},     // salip-menyalip: harus unggul >0,4% selama 5 menit (cegah kedip karena ganti tim)
 giveup:{ratio:1.45,hold:36*36e5},   // CP-mu ≥1,45× miliknya selama 36 jam → ia menyerah
 bored:{ratio:1.5,hold:48*36e5},     // CP-nya ≥1,5× milikmu selama 48 jam → ia bosan, cari lawan lain
 tenure:36*36e5,          // minimal masa rival sebelum boleh menyerah/bosan
 gone:3*864e5,            // tidak online 3 hari / berhenti main → pensiun
 cool:7*864e5,            // bot yang sudah pernah jadi rival tidak dipilih lagi selama 7 hari
 nextGap:[4,20],          // jam jeda sampai rival baru muncul
 // usaha ekstra saat kamu menyalipnya: tambahan progres (hari efektif) yang terwujud selama sesi main berikutnya.
 // F2P hanya bisa farming lebih lama; pembelanja ikut isi ulang stamina. Maksimal sekali per 20 jam per rival (server juga membatasi).
 boost:{tier:{f2p:.3,low:.33,card:.38,mid:.44,dolphin:.5,whale:.62,swhale:.7,mwhale:.75},sk:{baru:.75,biasa:1,veteran:1.15},max:.8,gap:20*36e5,lead:5*6e4},
 chat:{new:.75,passed:.9,back:.8,giveup:.85,bored:.5},   // peluang momen itu dibahas di Obrolan Dunia (saat si rival online)
 chatTtl:12*36e5,         // momen yang belum sempat dibahas kedaluwarsa setelah 12 jam
 arena:true,              // rival menyerang Tim Bertahan Arena-mu sekali di sesi pertamanya tiap hari
 hist:12,                 // simpan 12 mantan rival
};
