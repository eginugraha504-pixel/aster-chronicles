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
   {req:'3-5',n:15,cost:10,drop:{ore1:[3,5],ore2:[3,5],ore3:[0,1]}},{req:'4-5',n:20,cost:12,drop:{ore1:[3,5],ore2:[4,6],ore3:[1,2]}}]},
 {id:'shrine',n:'Kuil Bintang',art:'summit',icon:'shrine',bg:'castle',mobs:['mage','knight','archer'],els:['cahaya','gelap','api'],boss:'bKnight',bossEl:'gelap',
  desc:'Kuil yang dijaga ksatria bayangan. Hasilkan material Bintang untuk Limit Break senjata.',
  levels:[{req:'1-4',n:3,cost:8,drop:{gem1:[2,3]}},{req:'2-3',n:7,cost:8,drop:{gem1:[3,5]}},{req:'3-3',n:11,cost:10,drop:{gem1:[3,5],gem2:[1,1]}},
   {req:'4-3',n:16,cost:10,drop:{gem1:[3,5],gem2:[1,2],gem3:[0,1]}},{req:'5-3',n:21,cost:12,drop:{gem1:[3,5],gem2:[2,3],gem3:[1,1]}}]}
];
const DGD={};DUNGEONS.forEach(d=>DGD[d.id]=d);
