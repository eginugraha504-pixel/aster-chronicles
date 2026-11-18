/* =====================================================================
   DAFTAR SENJATA — tambah senjata baru = tambah 1 entri di sini
   ---------------------------------------------------------------------
   r     : bintang 1-3          cls: sword|bow|staff|shield|axe (lihat WCLASS)
   atk   : ATK dasar            sub: [stat tambahan, nilai %]  (crit|hp|def)
   owner : (khusus ★3) id hero pemilik -> pasif signature aktif bila dipakai pemiliknya
   sig   : bonus skill pasif signature (0.3 = +30%)   sigTxt: deskripsi pasif
   pal   : warna -> m: logam/badan [gelap..terang] x4, t: trim/gagang x3, g: permata x3
           (ikon & sprite di tangan hero dibuat otomatis dari bentuk kelas + palet + bintang)
   art   : (opsional) pakai ikon & lukisan senjata dari modul hero khusus (mis. 'seraphine')
   ===================================================================== */
const WEAPONS=[
 {id:'raijin',name:'Busur Guntur Raijin',r:3,cls:'bow',owner:'raika',atk:125,sub:['crit',12],sig:.3,sigTxt:'Skill +30% damage. Hujan panah memanggil sambaran petir yang lebih besar.',art:'raika',pal:{m:['#13131c','#24242f','#4a4a5e','#8ae4ff'],t:['#1a5aa0','#3aa8f0','#d6ecff'],g:['#1a5aa0','#3aa8f0','#f0fcff']}},
 {id:'hanafubuki',name:'Katana Hanafubuki',r:3,cls:'sword',owner:'sakuya',atk:130,sub:['crit',10],sig:.3,sigTxt:'Skill +30% damage. Tebasan iai menebar kelopak sakura membara.',art:'sakuya'},
 {id:'zamrud',name:'Busur Zamrud Rimba',r:3,cls:'bow',owner:'mira',atk:115,sub:['crit',12],sig:.35,sigTxt:'Skill +35% damage. Anak panah berubah jadi sulur zamrud.',pal:{m:['#2c6a3a','#4aa85a','#8ee08a','#d8ffc8'],t:['#a8650e','#ffc23d','#fff3a0'],g:['#2a8a5a','#5fe0a0','#e0fff0']}},
 {id:'embun',name:'Tongkat Embun Bintang',r:3,cls:'staff',owner:'noa',atk:95,sub:['hp',15],sig:.35,sigTxt:'Penyembuhan skill +35%. Hujan embun berkilau bintang.',pal:{m:['#3a2a6a','#5a4ab0','#8a7ae0','#c8bcff'],t:['#a8650e','#ffc23d','#fff3a0'],g:['#2a8ab8','#5ed4f0','#e0fbff']}},
 {id:'samudra',name:'Tongkat Naga Samudra',r:3,cls:'staff',owner:'marisa',atk:100,sub:['hp',18],sig:.35,sigTxt:'Penyembuhan skill +35%. Naga air ikut melindungi tim.',pal:{m:['#5e6a80','#a8b4c4','#dfe6ee','#ffffff'],t:['#c8504a','#ff8a7a','#ffd6cc'],g:['#1a6e70','#2fb3a6','#c8fffa']}},
 {id:'mentari',name:'Perisai Mentari Mungil',r:3,cls:'shield',owner:'pia',atk:70,sub:['def',25],sig:.33,sigTxt:'Perisai skill bertahan 2 detik lebih lama.',pal:{m:['#8a93a8','#c6cddb','#eef2fa','#ffffff'],t:['#a8650e','#ffc23d','#fff3a0'],g:['#c4302e','#ff6a3c','#ffd27a']}},
 {id:'bara',name:'Kapak Bara Merah',r:3,cls:'axe',owner:'rin',atk:125,sub:['crit',8],sig:.35,sigTxt:'Skill +35% damage. Putaran kapak meninggalkan bara api.',pal:{m:['#7a1a20','#c4302e','#ff6a3c','#ffd27a'],t:['#4a2a1a','#7a4a30','#c08a58'],g:['#c4302e','#ff9a3c','#fff0b0']}},
 {id:'sabit',name:'Tongkat Bulan Sabit',r:3,cls:'staff',owner:'vela',atk:92,sub:['hp',12],sig:.3,sigTxt:'Penguat skill bertahan 3 detik lebih lama dan ATK tim naik lebih tinggi.',pal:{m:['#1e1438','#3a2a6a','#6a4ab0','#b49aff'],t:['#8a8aa0','#d8d8f0','#ffffff'],g:['#7a1a6a','#e04ac0','#ffc8f4']}},
 {id:'purba',name:'Perisai Batu Purba',r:3,cls:'shield',owner:'bruna',atk:72,sub:['def',25],sig:.33,sigTxt:'Perisai skill bertahan 2 detik lebih lama.',pal:{m:['#36302c','#5a524a','#847a6e','#b8b0a4'],t:['#a8641a','#e0962a','#ffd27a'],g:['#a8641a','#ffb030','#fff0b0']}},
 {id:'ombak',name:'Busur Ombak Biru',r:3,cls:'bow',owner:'nami',atk:112,sub:['crit',10],sig:.35,sigTxt:'Skill +35% damage. Hujan panah berbuih ombak.',pal:{m:['#0e3a6a','#1e6ab8','#4aa8f0','#c8ecff'],t:['#a8650e','#ffc23d','#fff3a0'],g:['#0e7a94','#3ae0f0','#e0ffff']}},
 {id:'bayang',name:'Pedang Bayang Malam',r:3,cls:'sword',owner:'kuro',atk:118,sub:['crit',12],sig:.35,sigTxt:'Skill +35% damage. Tebasan meninggalkan jejak bayangan.',pal:{m:['#1a1626','#3a3452','#6a6290','#b4aee0'],t:['#56101e','#a01e30','#ff6a7a'],g:['#5a1a8a','#a060f0','#f0d8ff']}},
 {id:'lentera',name:'Tongkat Lentera Suci',r:3,cls:'staff',owner:'lumi',atk:90,sub:['hp',15],sig:.35,sigTxt:'Penyembuhan skill +35%. Lentera bersinar lebih terang.',pal:{m:['#8a6a2a','#c8a050','#f0d090','#fff6d8'],t:['#ffffff','#fff6c0','#fffbe8'],g:['#c98a1a','#ffd23f','#fffbd0']}},
 {id:'gunung',name:'Kapak Rune Gunung',r:3,cls:'axe',owner:'hilde',atk:132,sub:['crit',10],sig:.35,sigTxt:'Skill +35% damage. Hantaman kapak meretakkan tanah dan melempar bongkahan batu rune.',pal:{m:['#5a4a3a','#8a7458','#c8a87a','#ffe0a0'],t:['#3a2418','#6a3e26','#a86a3c'],g:['#c87a1a','#ffb02e','#fff0b0']}},
 {id:'perak',name:'Pedang Perak',r:2,cls:'sword',atk:60,sub:['crit',5],pal:{m:['#6a7894','#b4c2dc','#e8f0fc','#ffffff'],t:['#2a3a7a','#4a6ad0','#9cc4ff'],g:['#2a5ad0','#6aa8ff','#e0f0ff']}},
 {id:'elang',name:'Busur Elang',r:2,cls:'bow',atk:58,sub:['crit',6],pal:{m:['#4a3a6a','#7a6aa8','#b4a8e0','#e8e0ff'],t:['#2a3a7a','#4a6ad0','#9cc4ff'],g:['#2a5ad0','#6aa8ff','#e0f0ff']}},
 {id:'kristal',name:'Tongkat Kristal',r:2,cls:'staff',atk:48,sub:['hp',8],pal:{m:['#5a3a2a','#8a5a3a','#c08a58','#e8c098'],t:['#2a3a7a','#4a6ad0','#9cc4ff'],g:['#2a8ab8','#7fe3ff','#e0fbff']}},
 {id:'baja',name:'Perisai Baja',r:2,cls:'shield',atk:36,sub:['def',12],pal:{m:['#4a5468','#7a8498','#b4bccc','#e0e6f0'],t:['#2a3a7a','#4a6ad0','#9cc4ff'],g:['#2a5ad0','#6aa8ff','#e0f0ff']}},
 {id:'perang',name:'Kapak Perang',r:2,cls:'axe',atk:62,sub:['crit',4],pal:{m:['#6a7894','#b4c2dc','#e8f0fc','#ffffff'],t:['#3a2418','#6a3e26','#a86a3c'],g:['#2a5ad0','#6aa8ff','#e0f0ff']}},
 {id:'besi',name:'Pedang Besi',r:1,cls:'sword',atk:30,sub:['crit',2],pal:{m:['#5a5a68','#8a8a98','#b8b8c4','#e0e0e8'],t:['#3a2418','#6a3e26','#a86a3c'],g:['#6a3e26','#a86a3c','#d8a878']}},
 {id:'pemula',name:'Busur Pemula',r:1,cls:'bow',atk:28,sub:['crit',3],pal:{m:['#4a2c1e','#7a4a30','#b07a50','#d8a878'],t:['#3a2418','#6a3e26','#a86a3c'],g:['#6a3e26','#a86a3c','#d8a878']}},
 {id:'kayu',name:'Tongkat Kayu',r:1,cls:'staff',atk:24,sub:['hp',4],pal:{m:['#4a2c1e','#7a4a30','#b07a50','#d8a878'],t:['#3a2418','#6a3e26','#a86a3c'],g:['#3a8a4a','#6ac46a','#c8f0a8']}},
 {id:'papan',name:'Perisai Papan',r:1,cls:'shield',atk:18,sub:['def',6],pal:{m:['#5a3a24','#8a5a3a','#b47e52','#d8a878'],t:['#4a4a58','#7a7a88','#b0b0bc'],g:['#4a4a58','#7a7a88','#b0b0bc']}},
 {id:'tukang',name:'Kapak Tukang',r:1,cls:'axe',atk:32,sub:['crit',2],pal:{m:['#5a5a68','#8a8a98','#b8b8c4','#e0e0e8'],t:['#3a2418','#6a3e26','#a86a3c'],g:['#6a3e26','#a86a3c','#d8a878']}}
];
const WD={};WEAPONS.forEach(w=>WD[w.id]=w);
// senjata ★1 dasar per kelas (dipakai hero starter & tampilan hero tanpa senjata)
const basicWeapon=cls=>(WEAPONS.find(w=>w.r===1&&w.cls===cls)||{}).id||null;
