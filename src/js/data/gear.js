/* =====================================================================
   PELINDUNG & AKSESORI — tambah item baru = tambah 1 entri di sini
   ---------------------------------------------------------------------
   slot : 'armor' (Pelindung: HP + DEF) | 'acc' (Aksesori: ATK + Crit%)
   kind : bentuk ikon -> armor: vest | plate | robe   acc: ring | amulet
   r    : bintang 1-3  (level enhance maks: GEAR_MAX_LV[r])
   hp/def atau atk/crit : stat dasar di +0
   pal  : m: badan [gelap..terang] x4, t: trim x3, g: permata x3
   Semua hero bisa memakai semua Pelindung/Aksesori (tanpa batas kelas).
   ===================================================================== */
const GEAR=[
 // ---- Pelindung ----
 {id:'rompi_kulit',name:'Rompi Kulit',slot:'armor',kind:'vest',r:1,hp:140,def:10,pal:{m:['#5a3418','#8a5228','#b87a44','#e0a868'],t:['#4a3a2e','#8a7a6a','#c9bca8'],g:['#6a6a6a','#a0a0a0','#e0e0e0']}},
 {id:'jubah_linen',name:'Jubah Linen',slot:'armor',kind:'robe',r:1,hp:170,def:6,pal:{m:['#8a7a5a','#c2b088','#e6d8b0','#fff6dc'],t:['#5a3a20','#8a5a30','#c08850'],g:['#3a6a9a','#5aa0e0','#c0e8ff']}},
 {id:'zirah_besi',name:'Zirah Besi',slot:'armor',kind:'plate',r:2,hp:280,def:22,pal:{m:['#3a4458','#6a7a94','#a8b8cc','#eef4ff'],t:['#7a4a1e','#c08840','#ffd88a'],g:['#2a5a9a','#4a90e0','#c8ecff']}},
 {id:'jubah_mistik',name:'Jubah Mistik',slot:'armor',kind:'robe',r:2,hp:330,def:14,pal:{m:['#1e2e6a','#3050b0','#5a86e0','#a8d0ff'],t:['#9a7a1a','#e0c040','#fff3a0'],g:['#5a2a9a','#a060f0','#f0d8ff']}},
 {id:'zirah_naga',name:'Zirah Sisik Naga',slot:'armor',kind:'plate',r:3,hp:420,def:27,pal:{m:['#6a1418','#b02a24','#ee5a3a','#ffb08a'],t:['#9a6a0a','#ffc23d','#fff3a0'],g:['#c06a0a','#ffb030','#fff0b0']}},
 {id:'jubah_bintang',name:'Jubah Bintang',slot:'armor',kind:'robe',r:3,hp:490,def:18,pal:{m:['#2a1450','#52309a','#8a5ae0','#d0b0ff'],t:['#a8800a','#ffd23f','#fff6c0'],g:['#2a7aa0','#5ae0ff','#e8ffff']}},
 // ---- Aksesori ----
 {id:'cincin_tembaga',name:'Cincin Tembaga',slot:'acc',kind:'ring',r:1,atk:10,crit:2,pal:{m:['#6a3a14','#a8642a','#e09a52','#ffd09a'],t:['#6a3a14','#a8642a','#e09a52'],g:['#2a7a3a','#4ac060','#c0ffc8']}},
 {id:'kalung_taring',name:'Kalung Taring',slot:'acc',kind:'amulet',r:1,atk:14,crit:1,pal:{m:['#8a8070','#c8bca0','#efe6cc','#ffffff'],t:['#4a2e1a','#7a5030','#a87850'],g:['#7a1a1a','#c03030','#ff9a9a']}},
 {id:'cincin_safir',name:'Cincin Safir',slot:'acc',kind:'ring',r:2,atk:20,crit:3.5,pal:{m:['#5a6478','#9aa8bc','#d8e2ee','#ffffff'],t:['#5a6478','#9aa8bc','#d8e2ee'],g:['#123a8a','#2a7aee','#b8e0ff']}},
 {id:'jimat_angin',name:'Jimat Angin',slot:'acc',kind:'amulet',r:2,atk:26,crit:2.5,pal:{m:['#1e6a5a','#2ea88a','#6ae0c0','#d0fff0'],t:['#7a5a1a','#c0a040','#fff0a0'],g:['#1e8a6a','#5af0c0','#e0fff6']}},
 {id:'cincin_fajar',name:'Cincin Fajar',slot:'acc',kind:'ring',r:3,atk:34,crit:4,pal:{m:['#9a6a0a','#e0a820','#ffd84a','#fff6c0'],t:['#9a6a0a','#e0a820','#ffd84a'],g:['#c02a5a','#ff5a8a','#ffd0e0']}},
 {id:'liontin_bulan',name:'Liontin Bulan',slot:'acc',kind:'amulet',r:3,atk:40,crit:3.5,pal:{m:['#3a3a6a','#6a6ab0','#a8a8ee','#f0f0ff'],t:['#8a8aa0','#c8c8e0','#ffffff'],g:['#5a2aa0','#b080ff','#f4e8ff']}},
];
const GDD={};GEAR.forEach(g=>GDD[g.id]=g);
const GSLOT={armor:'Pelindung',acc:'Aksesori'};
const GKIND={vest:'Rompi',plate:'Zirah',robe:'Jubah',ring:'Cincin',amulet:'Kalung'};   // label pendek di kartu

/* ---- balancing ---- */
const GEAR_MAX_LV=[0,5,10,15];           // enhance maks per bintang (+0 .. +N)
const GEAR_GROWTH=.1,GEAR_CRIT_GROWTH=.05; // per +1: HP/DEF/ATK +10%, Crit +5%
const GEAR_UP_GOLD=[0,800,1500,2500];    // emas per langkah = nilai × (level+1)
// bijih per langkah: ore1 × (lv+1); ★2+: ore2 × floor(lv/3); ★3: ore3 × floor(lv/5)
// bos dunia (kemenangan pertama) memberi item pasti:
const BOSS_GEAR={'1-5':'rompi_kulit','2-5':'cincin_safir','3-5':'zirah_besi','4-5':'liontin_bulan','5-5':'zirah_naga'};
// peluang drop di dungeon: Tambang -> Pelindung, Kuil -> Aksesori. [peluang, bobot★1, bobot★2, bobot★3] per tingkat
const DG_GEAR={mine:'armor',shrine:'acc'};
const DG_GEAR_P=[[.25,1,0,0],[.3,.7,.3,0],[.3,.3,.7,0],[.35,0,.88,.12],[.4,0,.75,.25]];
