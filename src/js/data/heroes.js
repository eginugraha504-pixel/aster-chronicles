/* =====================================================================
   DAFTAR HERO — tambah hero baru = tambah 1 entri di sini
   ---------------------------------------------------------------------
   id       : kunci unik (huruf kecil)
   r        : bintang 1-3        el  : elemen (lihat EL)    role: warrior|ranger|tanker|support
   skill    : aoe|single|heal|shield|buff     mult: kekuatan skill     sk: nama skill
   wcls     : kelas senjata (sword|bow|staff|shield|axe)
   starter  : true = dimiliki sejak awal (otomatis membawa senjata ★1 kelasnya)
   Tampilan (pilih salah satu):
     art:'nama'  -> modul sprite khusus (js/art/heroes/<nama>.js, didaftarkan di ART_MODULES)
     limited:true -> hanya bisa didapat dari banner yang rateUp-nya hero ini (tidak masuk banner standar)
     gen:{...}   -> generator chibi generik (js/art/heroes/generic.js):
                    hair: long|bob|twin|pony   hat: feather|witch|helmet|headband
                    pal: palet warna (h=rambut, e=mata, m=baju, k=rok, a=aksen, c=jubah, l=celana, f=sepatu)
   lines    : (opsional) dialog di Beranda (muncul sendiri saat idle)
   poke     : (opsional) dialog saat karakter disentuh/diganggu di Beranda
   Senjata signature ★3 hero dibuat di data/weapons.js dengan owner:'<id hero>'.
   ===================================================================== */
const HEROES=[
 {id:'seraphine',name:'Seraphine',title:'Putri Fajar',r:3,el:'cahaya',role:'warrior',skill:'aoe',mult:2.8,sk:'Fajar Menyingsing',lore:'Pewaris takhta Aster. Saat ia berdoa, matahari terbit di belakangnya.',
  lines:['Fajar akan selalu terbit, Kapten!', 'Mahkota ini berat... tapi aku tak akan menyerah.', 'Pedang Aurora paling terang saat kau di dekatku.'],
  poke:['Ah—! Kapten, sopanlah sedikit pada seorang putri.', 'Hihi, mau berdansa? Nanti saja setelah pertempuran.', 'Hei, mahkotaku hampir jatuh!'],
  wcls:'sword',
  art:'seraphine'},
 {id:'sakuya',name:'Sakuya',title:'Miko Rubah Sakura',r:3,el:'api',role:'warrior',skill:'single',mult:4.8,sk:'Iai: Hanafubuki Kitsunebi',limited:true,lore:'Miko kuil rubah putih. Tebasannya lebih cepat dari kelopak yang jatuh.',
  lines:['Kitsunebi-ku menari untukmu~', 'Hmm? Kau memperhatikan ekorku?', 'Satu tebasan, seribu kelopak.'],
  poke:['Kyaa! Jangan tarik ekorku!', 'Fufu~ penasaran dengan telinga rubahku?', 'Sentuh sekali lagi, kubakar dengan kitsunebi~'],
  wcls:'sword',
  art:'sakuya'},
 {id:'raika',name:'Raika',title:'Pemanah Petir Kelana',r:3,el:'gelap',role:'ranger',skill:'aoe',mult:2.7,sk:'Hujan Petir Raijin',limited:true,lore:'Pengembara bercaping yang memburu iblis di malam badai. Setiap anak panahnya membawa guntur.',
  lines:['Badai datang... dan aku bersamanya.', 'Topi ini? Melindungiku dari hujan. Dan dari tatapanmu, Kapten.', 'Satu tarikan tali, seribu petir.'],
  poke:['Jaga jarak, Kapten. Petirku gampang tersulut.', 'Hm. Kau iseng sekali hari ini.', '...Kalau bosan, ayo latihan memanah.'],
  wcls:'bow',
  art:'raika'},
 {id:'mira',name:'Mira',title:'Pemanah Rimba',r:2,el:'tanah',role:'ranger',skill:'single',mult:3.4,sk:'Panah Akar Rimba',lore:'Penjaga hutan yang bisa memanah daun dari seratus langkah.',
  lines:['Angin hari ini pas untuk memanah!', 'Hutan berbisik... ada musuh di utara.'],
  poke:['Eh? Ada daun nyangkut di rambutku ya?', 'Hehe, mau kuajari memanah?', 'Hei! Jangan kagetkan aku, panahku bisa meleset!'],
  wcls:'bow',starter:true,
  gen:{hair:'long',hat:'feather',weapon:'bow',cape:true,collar:'a2',belt:'#6a3e26',cuff:'#a86a3c',
  pal:{h1:'#f2c79a',h2:'#c4824e',h3:'#93563a',h4:'#5e3426',e1:'#163d29',e2:'#2f9a58',e3:'#93e8ab',
   m1:'#cdeec0',m2:'#86c47a',m3:'#4f8d50',m4:'#2c5a3a',k1:'#d9a066',k2:'#a86a3c',k3:'#7a4a2c',k4:'#4e2c1e',a1:'#f2d18a',a2:'#c4904a',a3:'#7a5226',
   c1:'#78b86a',c2:'#4a8a4a',c3:'#2c5a3a',l1:'#e8d2b0',l2:'#bfa27e',l3:'#8a6e52',f1:'#8a5a3a',f2:'#6a3e26',f3:'#3e2418',f4:'#ff6a5a',f5:'#ffd0a0',fx:'#bff0a8'}}},
 {id:'noa',name:'Noa',title:'Penyihir Embun',r:2,el:'air',role:'support',skill:'heal',mult:.3,sk:'Hujan Embun Bintang',lore:'Murid penyihir yang topinya selalu kebesaran.',
  lines:['T-topiku melorot lagi...', 'Embun bintang, sembuhkan semuanya!'],
  poke:['Hwaa... aku hampir tertidur...', 'T-topiku! Jangan ditekan!', 'Mmh... lima menit lagi, Kapten...'],
  wcls:'staff',starter:true,
  gen:{hair:'twin',hat:'witch',weapon:'staff',collar:'W',gem:true,hem:true,
  pal:{h1:'#effcff',h2:'#a6e4f7',h3:'#64b4dc',h4:'#3a78aa',e1:'#20245e',e2:'#5b5fe0',e3:'#a8b4ff',
   m1:'#a6b6f5',m2:'#6274d4',m3:'#3f4aa6',m4:'#262e70',k1:'#8ea0ee',k2:'#5868c8',k3:'#3a449a',k4:'#232a66',a1:'#c8fbff',a2:'#5ed4f0',a3:'#2a8ab8',
   l1:'#ffffff',l2:'#d8dcf5',l3:'#9aa0d0',f1:'#5ed4f0',f2:'#3a449a',f3:'#1f2458',fx:'#c8fbff'}}},
 {id:'marisa',name:'Marisa',title:'Penyembuh Bertanduk',r:3,el:'air',role:'support',skill:'heal',mult:.4,sk:'Hujan Naga Penyembuh',lore:'Ksatria muda berdarah naga laut. Ia belajar menyembuhkan supaya tak ada lagi yang menangis di medan perang.',
  lines:['Kapten! Naga laut siap bertugas~ Hehe!', 'Tandukku? Dingin, lho! Mau pegang?', 'Siapa yang terluka? Biar Marisa sembuhkan!'],
  poke:['Kyaa! Ekorku jangan diinjak!', 'Ehehe, mau main air? Byur~!', 'Hei hei, tanduk ini bukan gagang pintu, Kapten!'],
  wcls:'staff',
  gen:{hair:'twin',weapon:'staff',collar:'W',gem:true,hem:true,
  pal:{h1:'#e8fffa',h2:'#7fe3d4',h3:'#2fb3a6',h4:'#1a6e70',e1:'#5a3a08',e2:'#e0a020',e3:'#fff0a0',
   m1:'#ffffff',m2:'#dfe6ee',m3:'#a8b4c4',m4:'#5e6a80',k1:'#7fe3d4',k2:'#2fb3a6',k3:'#1a7a78',k4:'#0f4a50',a1:'#ffd6cc',a2:'#ff8a7a',a3:'#c8504a',
   l1:'#ffffff',l2:'#dfe6ee',l3:'#9aa6b8',f1:'#7fe3d4',f2:'#2a8ab8',f3:'#16406a',fx:'#c8fbff'}}},
 {id:'pia',name:'Pia',title:'Ksatria Mungil',r:1,el:'netral',role:'tanker',skill:'shield',mult:0,sk:'Benteng Mungil',lore:'Perisainya lebih besar dari badannya. Tidak pernah mundur.',
  lines:['Berlindung di belakangku!', 'Perisaiku tidak akan retak!'],
  poke:['Hei! Aku bukan anak kecil!', 'Jangan tepuk kepalaku, helmku bisa penyok!', 'Hmph! Ksatria sejati tidak takut digelitik!'],
  wcls:'shield',starter:true,
  gen:{hair:'bob',hat:'helmet',weapon:'shield',armor:true,belt:'#565d74',cuff:'#8a93a8',
  pal:{h1:'#ffe6ef',h2:'#ffb3cc',h3:'#e57fa3',h4:'#a84f75',e1:'#5a2e08',e2:'#d68a1c',e3:'#ffd27a',
   m1:'#f4f7fc',m2:'#c6cddb',m3:'#8c95aa',m4:'#575e76',k1:'#ff8a8a',k2:'#d8404a',k3:'#a12838',k4:'#6a1a2a',a1:'#ffd8d8',a2:'#d8404a',a3:'#a12838',
   c1:'#ff8a8a',c2:'#d8404a',c3:'#a12838',l1:'#c6cddb',l2:'#8c95aa',l3:'#575e76',f1:'#8c95aa',f2:'#575e76',f3:'#33384a'}}},
 {id:'rin',name:'Rin',title:'Gadis Kapak',r:1,el:'api',role:'warrior',skill:'aoe',mult:1.8,sk:'Putaran Kapak Bara',lore:'Anak tukang kayu yang terlalu bersemangat.',
  lines:['Ayo! Ayo! Kapakku sudah panas!', 'Kayu bakar? Bukan, ini musuh!'],
  poke:['Wah! Mau adu panco?!', 'Hahaha! Geli, geli!', 'Awas, kapakku masih panas lho!'],
  wcls:'axe',starter:true,
  gen:{hair:'pony',hat:'headband',weapon:'axe',collar:'c2',belt:'#7a3a24',cuff:'#c4602e',
  pal:{h1:'#ffe0b0',h2:'#ff9c4a',h3:'#e0622e',h4:'#a33a22',e1:'#4a1a06',e2:'#e0731c',e3:'#ffd27a',
   m1:'#fff3e2',m2:'#f4dcc0',m3:'#d0a882',m4:'#8a6448',k1:'#5a6a9a',k2:'#3e4a78',k3:'#2a3358',k4:'#1a2040',a1:'#ffd0a0',a2:'#f08a3a',a3:'#b4522a',
   c1:'#ff7a6a',c2:'#e0384a',c3:'#a61f3a',l1:'#f4dcc0',l2:'#d0a882',l3:'#8a6448',f1:'#c4602e',f2:'#7a3a24',f3:'#4a2216',fx:'#ffd27a'}}},
 {id:'vela',name:'Vela',title:'Penyihir Bulan Sabit',r:2,el:'gelap',role:'support',skill:'buff',mult:0,sk:'Restu Bulan Sabit',lore:'Penyihir pendiam yang membaca nasib dari bayangan bulan.',
  lines:['Bulan sabit sedang tersenyum padamu...', 'Bayanganmu kuat malam ini, Kapten.'],
  poke:['Bintang sudah bilang kau akan menyentuhku... dan benar.', 'Hati-hati, bayanganku suka menggigit.', 'Fufu... penasaran dengan takdirmu?'],
  wcls:'staff',
  gen:{hair:'long',hat:'witch',weapon:'staff',cape:true,collar:'a2',gem:true,hem:true,
  pal:{h1:'#f4eaff',h2:'#c9b4f0',h3:'#9a7ed4',h4:'#5e4a96',e1:'#4a0a3a',e2:'#d43a9a',e3:'#ffa8e0',
   m1:'#7a6aa8',m2:'#4e3e86',m3:'#33275e',m4:'#1e163e',k1:'#6a4aa8',k2:'#48307e',k3:'#2e1e58',k4:'#1a1038',a1:'#8a6ad0',a2:'#4a3090',a3:'#2a1a5a',
   c1:'#3a2a6a',c2:'#26184a',c3:'#140c2a',l1:'#3a3058',l2:'#2a2244',l3:'#1a1430',f1:'#4a3a7a',f2:'#2e2252',f3:'#1a1230',fx:'#d8a8ff'}}},
 {id:'bruna',name:'Bruna',title:'Penjaga Batu',r:2,el:'tanah',role:'tanker',skill:'shield',mult:0,sk:'Tembok Gunung',lore:'Putri penambang yang menahan longsoran dengan perisainya.',
  lines:['Tenang, aku setegar gunung!', 'Batu tidak pernah mundur, aku juga tidak.'],
  poke:['Kau mendorong gunung, Kapten. Gunung tidak bergeser.', 'Hm? Ada perlu?', 'Jangan ketuk zirahku, bunyinya nyaring.'],
  wcls:'shield',
  gen:{hair:'pony',hat:'helmet',weapon:'shield',armor:true,cape:true,belt:'#3a3430',cuff:'#e0a030',
  pal:{h1:'#ffffff',h2:'#d8dce4',h3:'#9aa0b0',h4:'#5a6070',e1:'#5a2a04',e2:'#e08a10',e3:'#ffd27a',
   m1:'#b8b0a4',m2:'#847a6e',m3:'#5a524a',m4:'#36302c',k1:'#ffc860',k2:'#e0962a',k3:'#a8641a',k4:'#6a3a0e',a1:'#ffe0a0',a2:'#e0962a',a3:'#a8641a',
   c1:'#f0a838',c2:'#c0761e',c3:'#7a4410',l1:'#847a6e',l2:'#5a524a',l3:'#36302c',f1:'#5a524a',f2:'#36302c',f3:'#1e1a18',fx:'#ffd27a'}}},
 {id:'nami',name:'Nami',title:'Pemanah Ombak',r:2,el:'air',role:'ranger',skill:'aoe',mult:2.2,sk:'Hujan Panah Ombak',lore:'Pemanah dari kota pelabuhan. Panahnya jatuh seperti hujan badai.',
  lines:['Angin laut berpihak pada kita!', 'Siap-siap, hujan panah datang~'],
  poke:['Ahoy! Jangan bikin kapalku oleng~', 'Hehe, ketahuan iseng!', 'Mau kucipratkan air laut?'],
  wcls:'bow',
  gen:{hair:'twin',hat:'headband',weapon:'bow',collar:'W',belt:'#1e3a6a',cuff:'#3a7ac8',
  pal:{h1:'#6a8ad0',h2:'#2e4a9a',h3:'#1e2e6e',h4:'#121a44',e1:'#0a3a4a',e2:'#1ab0c8',e3:'#a8f4ff',
   m1:'#ffffff',m2:'#dceaf8',m3:'#a4bcd8',m4:'#5a7494',k1:'#4a8ae0',k2:'#2a5ab8',k3:'#1a3a84',k4:'#0e2252',a1:'#c8f4ff',a2:'#2ab0d8',a3:'#1a6a94',
   c1:'#ffffff',c2:'#e04a5a',c3:'#a02a3a',l1:'#ffffff',l2:'#d0dcec',l3:'#8a9ab4',f1:'#3a7ac8',f2:'#1e4a88',f3:'#0e2a52',f4:'#ffffff',f5:'#a8f4ff',fx:'#a8f4ff'}}},
 {id:'kuro',name:'Kuro',title:'Ninja Bayangan',r:1,el:'gelap',role:'warrior',skill:'single',mult:2.6,sk:'Tebasan Bayang Senyap',lore:'Ninja magang yang selalu muncul tiba-tiba di belakangmu.',
  lines:['...Aku sudah di sini dari tadi.', 'Bayangan tidak meleset.'],
  poke:['!? ...Bagaimana kau bisa melihatku?', 'J-jangan sentuh syalku...', '...Kau terlalu dekat.'],
  wcls:'sword',
  gen:{hair:'pony',hat:'headband',weapon:'sword',cape:true,collar:'c2',belt:'#2a1e3a',cuff:'#4a3a6a',
  pal:{h1:'#8a7aa8',h2:'#3e3458',h3:'#262038',h4:'#151020',e1:'#4a0a14',e2:'#d02a3a',e3:'#ff9aa0',
   m1:'#6a6480',m2:'#46405a',m3:'#2e2a3e',m4:'#1a1826',k1:'#4e4866',k2:'#363048',k3:'#24203a',k4:'#141224',a1:'#ff9aa0',a2:'#c02a3a',a3:'#7a1424',
   c1:'#c03a4a',c2:'#8a1e30',c3:'#56101e',l1:'#4e4866',l2:'#363048',l3:'#1e1a2c',f1:'#3a344e',f2:'#24203a',f3:'#121020',fx:'#c8a8ff'}}},
 {id:'lumi',name:'Lumi',title:'Akolit Cahaya',r:1,el:'cahaya',role:'support',skill:'heal',mult:.22,sk:'Doa Lentera Kecil',lore:'Akolit kuil yang lenteranya tak pernah padam.',
  lines:['Semoga cahaya menuntun langkahmu!', 'Ada yang terluka? Biar aku bantu~'],
  poke:['Eh? Ah, kau butuh disembuhkan?', 'Hihi, lenteraku hangat, kan?', 'Pelan-pelan, Kapten... nanti lenteraku padam.'],
  wcls:'staff',
  gen:{hair:'bob',weapon:'staff',collar:'a2',gem:true,hem:true,
  pal:{h1:'#fff6e0',h2:'#ffd9a0',h3:'#f0a868',h4:'#b8703e',e1:'#5a3a08',e2:'#e0a020',e3:'#fff0a0',
   m1:'#ffffff',m2:'#f4eedc',m3:'#d4c8a4',m4:'#9a8c66',k1:'#ffffff',k2:'#efe6cc',k3:'#c8b88e',k4:'#8a7a54',a1:'#fff6b0',a2:'#ffc83d',a3:'#c98a1a',
   c1:'#fff6b0',c2:'#ffc83d',c3:'#c98a1a',l1:'#ffffff',l2:'#e8e0cc',l3:'#b4a888',f1:'#e0b45a',f2:'#a8782e',f3:'#5e4018',fx:'#fff6b0'}}}
];
const HD={};HEROES.forEach(h=>{h.spr={hero:h.id};HD[h.id]=h});
const HERO_WCLASS={};HEROES.forEach(h=>HERO_WCLASS[h.id]=h.wcls);
