/* =====================================================================
   DAFTAR MUSUH
   ---------------------------------------------------------------------
   role/hp/atk/def : pengali stat      h: tinggi sprite (posisi bar HP)
   look : {slime:true} (warna ikut elemen) | {slime:true,crystal:true,color}
          atau cfg generator mob (js/art/enemies.js):
          ears, head: skull|hood|helm, weapon: club|bow|sword|staff|shield|axe,
          armor, robe, cape, crown, horns, plume, big, ragged, pal:{...}
   ===================================================================== */
const ENEMY={
 slime:{n:'Slime',role:'warrior',hp:.8,atk:.85,def:.7,h:18,
  look:{slime:true}},
 goblin:{n:'Goblin',role:'warrior',hp:1,atk:1,def:1,h:30,
  look:{ears:1,weapon:'club',pal:{skin:['#2f5a2a','#4f8a3a','#7cc35a','#b6e88a'],cloth:['#3e2418','#6a3e26','#94603a','#c08a58'],leg:['#2f5a2a','#4f8a3a','#7cc35a','#b6e88a'],boot:'#3e2418',bl1:'#ffffff',bl2:'#c9ced8',bl3:'#8a93a8',hair:'#2a1a12'},ragged:1}},
 archer:{n:'Goblin Pemanah',role:'ranger',hp:.75,atk:1.1,def:.8,h:30,
  look:{ears:1,weapon:'bow',hoodGob:['#1f3a2a','#2c5a3a','#4a8a4a','#78b86a'],pal:{skin:['#2f5a2a','#4f8a3a','#7cc35a','#b6e88a'],cloth:['#1f3a2a','#2c5a3a','#4a8a4a','#78b86a'],leg:['#3e2418','#6a3e26','#94603a','#c08a58'],boot:'#3e2418',bl2:'#c9ced8'},ragged:1}},
 skeleton:{n:'Tengkorak',role:'warrior',hp:1,atk:1.05,def:1.1,h:31,
  look:{head:'skull',bone:1,weapon:'sword',pal:{bone:['#7d745e','#bdb49a','#e8e2cc','#fffdf0'],bl1:'#e6dccb',bl2:'#b0a28a',bl3:'#7a6a58',gd:'#8a6a3a',gd2:'#5a4428',boot:'#4a4038'}}},
 mage:{n:'Penyihir Gelap',role:'ranger',hp:.7,atk:1.2,def:.7,h:32,
  look:{head:'hood',robe:1,weapon:'staff',pal:{cloth:['#1f1238','#3a1f5a','#5e3a8a','#8a62b8'],skin:['#1f1238','#3a1f5a','#5e3a8a','#8a62b8'],trim:'#c9a2ff',orb1:'#ffd0e6',orb2:'#ff4f8a',orb3:'#a01a4a'}}},
 knight:{n:'Ksatria Hitam',role:'tanker',hp:1.3,atk:.9,def:1.4,h:31,
  look:{head:'helm',armor:1,weapon:'shield',plume:1,pal:{cloth:['#1e1e30','#36364e','#55557a','#8484a8'],leg:['#1e1e30','#36364e','#55557a','#8484a8'],boot:'#14141f',emb:'#c42a48',cape:['#4a0f1e','#7a1a30','#b02a44']}}},
 bGoblin:{n:'Raja Goblin',role:'warrior',hp:1,atk:1,def:1,h:31,
  look:{ears:1,weapon:'axe',crown:1,cape:1,big:1,pal:{skin:['#2a5228','#46803a','#6fb84a','#a8e080'],cloth:['#4a0f1e','#7a1a30','#b02a44','#e05068'],leg:['#2a5228','#46803a','#6fb84a','#a8e080'],boot:'#3e2418',bl1:'#ffffff',bl2:'#d8dee8',cape:['#4a0f1e','#7a1a30','#b02a44'],belt:'#d77f1e',hair:'#2a1a12'}}},
 bSlime:{n:'Slime Kristal Raksasa',role:'warrior',hp:1.2,atk:.9,def:1.1,h:22,
  look:{slime:true,crystal:true,color:'#7fe3ff'}},
 bKnight:{n:'Ksatria Kegelapan',role:'warrior',hp:1,atk:1.1,def:1.1,h:33,
  look:{head:'helm',armor:1,weapon:'sword',horns:1,cape:1,big:1,pal:{cloth:['#140c20','#2a1a3e','#4a3266','#7a5aa0'],leg:['#140c20','#2a1a3e','#4a3266','#7a5aa0'],boot:'#0c0814',emb:'#ff3b4f',cape:['#2a0a1a','#5a1030','#8a1a44'],bl1:'#f0d8ff',bl2:'#b48ae8',bl3:'#6a3aa8',gd:'#8a1a44',gd2:'#5a1030'}}}
};
// musuh dungeon emas: memakai sprite slime yang diwarnai emas (sprOf = pinjam strip gambar musuh lain)
ENEMY.gslime={n:'Slime Emas',role:'warrior',hp:.9,atk:.8,def:.9,h:18,sprOf:'slime',look:{slime:true,metal:'gold',color:'#ffc93a'}};
ENEMY.bGold={n:'Raja Slime Emas',role:'warrior',hp:1.25,atk:.9,def:1.1,h:20,sprOf:'slime',look:{slime:true,metal:'gold',crown:1,color:'#ffae1a'}};
for(const k in ENEMY)ENEMY[k].spr=(el)=>({enemy:k,el});
