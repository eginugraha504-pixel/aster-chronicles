/* =====================================================================
   DUNGEON — farming material senjata (Petualangan > tab Dungeon)
   levels[i]: req (tahap cerita yang harus selesai), n (tingkat kesulitan musuh),
              catatan: tingkat tinggi tetap menjatuhkan material dasar supaya Limit Break awal tidak macet,
              drop: {material:[min,maks]} (min boleh 0 = peluang), cost: stamina
   ===================================================================== */
const DUNGEONS=[
 {id:'mine',n:'Tambang Bijih',art:'cave',icon:'pick',bg:'cave',mobs:['skeleton','slime','knight'],els:['tanah','gelap','air'],boss:'bSlime',bossEl:'tanah',
  desc:'Tambang tua penuh slime kristal. Hasilkan Bijih Tempa untuk menaikkan level senjata.',
  levels:[{req:'1-2',n:2,cost:8,drop:{ore1:[4,6]}},{req:'1-5',n:6,cost:8,drop:{ore1:[5,7],ore2:[1,2]}},{req:'2-5',n:10,cost:10,drop:{ore1:[4,6],ore2:[2,4]}},
   {req:'3-5',n:15,cost:10,drop:{ore1:[3,5],ore2:[3,5],ore3:[0,1]}},{req:'4-5',n:20,cost:12,drop:{ore1:[3,5],ore2:[4,6],ore3:[1,2]}},
   {req:'6-4',n:28,cost:14,drop:{ore2:[4,6],ore3:[2,4]}},{req:'7-4',n:33,cost:15,drop:{ore2:[5,7],ore3:[3,5]}}]},
 {id:'shrine',n:'Kuil Bintang',art:'summit',icon:'shrine',bg:'castle',mobs:['mage','knight','archer'],els:['cahaya','gelap','api'],boss:'bKnight',bossEl:'gelap',
  desc:'Kuil yang dijaga ksatria bayangan. Hasilkan material Bintang untuk Limit Break senjata.',
  levels:[{req:'1-4',n:3,cost:8,drop:{gem1:[2,3]}},{req:'2-3',n:7,cost:8,drop:{gem1:[3,5]}},{req:'3-3',n:11,cost:10,drop:{gem1:[3,5],gem2:[1,1]}},
   {req:'4-3',n:16,cost:10,drop:{gem1:[3,5],gem2:[1,2],gem3:[0,1]}},{req:'5-3',n:21,cost:12,drop:{gem1:[3,5],gem2:[2,3],gem3:[1,1]}},
   {req:'6-4',n:28,cost:14,drop:{gem1:[3,5],gem2:[3,4],gem3:[1,2]}},{req:'7-4',n:33,cost:15,drop:{gem2:[3,5],gem3:[2,3]}}]},
 // DUNGEON EMAS: gold = [min,maks] emas per kemenangan (menggantikan emas biasa), 3 bintang = +GOLD_DG_3STAR
 {id:'vault',n:'Brankas Naga Emas',art:'vault',icon:'gold',bg:'cave',mobs:['gslime','gslime','goblin','gslime'],els:['tanah','api','cahaya','air'],boss:'bGold',bossEl:'cahaya',
  desc:'Gudang harta naga tua yang dijaga para slime emas. Kalahkan mereka dan bawa pulang tumpukan emas.',
  levels:[{req:'1-3',n:3,cost:8,drop:{},gold:[7000,9000]},{req:'2-1',n:7,cost:10,drop:{},gold:[16000,20000]},{req:'3-1',n:11,cost:10,drop:{},gold:[28000,34000]},
   {req:'4-1',n:16,cost:12,drop:{},gold:[45000,55000]},{req:'5-1',n:21,cost:12,drop:{},gold:[65000,80000]},
   {req:'6-2',n:26,cost:14,drop:{},gold:[110000,135000]},{req:'7-2',n:31,cost:14,drop:{},gold:[190000,230000]},{req:'8-2',n:36,cost:16,drop:{},gold:[320000,380000]}]},
 // MENARA KEBANGKITAN: material ★4–★6. daily = batas menang+sapu per hari (semua tingkat digabung).
 // drop [min,maks,peluang]: peluang (0..1) bila ada angka ketiga. 'badge' = Lencana Ksatria (S.badge).
 {id:'tower',n:'Menara Kebangkitan',art:'tower',icon:'tower',bg:'castle',mobs:['mKnight','vMage','archer','knight'],els:['cahaya','gelap','api','air','tanah'],boss:'bTower',bossEl:'cahaya',daily:5,
  desc:'Menara di atas awan tempat para ksatria membangkitkan kekuatan sejati. Bahan Kebangkitan ★4–★6. Hanya 5 kali per hari.',
  levels:[{req:'5-5',n:24,cost:15,drop:{asc1:[3,4]}},{req:'6-3',n:27,cost:15,drop:{asc1:[4,6],asc2:[0,1]}},{req:'6-5',n:30,cost:15,drop:{asc1:[5,7],asc2:[1,2],badge:[2,3]}},
   {req:'7-5',n:34,cost:15,drop:{asc1:[6,8],asc2:[2,3],asc3:[1,1,.1],badge:[3,4]}},{req:'8-3',n:37,cost:15,drop:{asc1:[8,10],asc2:[3,4],asc3:[1,1,.25],badge:[4,6]}}]}
];
const GOLD_DG_3STAR=.25;   // bonus emas dungeon emas bila menang 3 bintang
const DGD={};DUNGEONS.forEach(d=>DGD[d.id]=d);
