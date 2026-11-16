/* =====================================================================
   MISI HARIAN & PENCAPAIAN — prog: fungsi progres, goal: target, rw: hadiah
   ===================================================================== */
const MISSIONS=[
 {id:'login',n:'Masuk ke game hari ini',goal:1,prog:()=>1,rw:{gems:100}},
 {id:'summon',n:'Lakukan summon 1 kali',goal:1,prog:()=>S.daily.c.summon,rw:{gems:100}},
 {id:'clear',n:'Selesaikan 3 tahap',goal:3,prog:()=>S.daily.c.clear,rw:{gems:150,gold:3000}},
 {id:'lvup',n:'Naikkan level hero 5 kali',goal:5,prog:()=>S.daily.c.lvup,rw:{gold:3000}},
 {id:'boss',n:'Kalahkan 1 bos',goal:1,prog:()=>S.daily.c.boss,rw:{gems:200}},
 {id:'dungeon',n:'Selesaikan dungeon 1 kali',goal:1,prog:()=>S.daily.c.dg||0,rw:{gems:100,mats:{ore1:3}}},
 {id:'all',n:'Selesaikan semua misi harian',goal:5,prog:()=>['login','summon','clear','lvup','boss'].filter(k=>S.daily.claimed[k]).length,rw:{gems:400,stam:30}}
];
const ACH=[
 {id:'w1',n:'Taklukkan Padang Hijau',cond:()=>!!S.stages['1-5'],rw:{gems:200}},
 {id:'w2',n:'Taklukkan Gua Kristal',cond:()=>!!S.stages['2-5'],rw:{gems:300}},
 {id:'w3',n:'Kalahkan Ksatria Kegelapan',cond:()=>!!S.stages['3-5'],rw:{gems:500}},
 {id:'w4',n:'Redakan Lembah Badai',cond:()=>!!S.stages['4-5'],rw:{gems:1500}},
 {id:'w5',n:'Raih Puncak Aster',cond:()=>!!S.stages['5-5'],rw:{gems:3000,tixH:10}},
 {id:'h5',n:'Miliki 5 hero',cond:()=>owned()>=5,rw:{gems:200}},
 {id:'h18',n:'Kumpulkan semua hero',cond:()=>owned()>=HEROES.length,rw:{gems:800}},
 {id:'r3',n:'Dapatkan hero ★3',cond:()=>Object.keys(S.heroes).some(id=>HD[id].r===3),rw:{gems:300}},
 {id:'st20',n:'Kumpulkan 20 bintang tahap',cond:()=>totalStars()>=20,rw:{gems:300}},
 {id:'st45',n:'Kumpulkan semua bintang tahap (sempurna)',cond:()=>totalStars()>=SLIST.length*3,rw:{gems:3000}},
 {id:'w3s',n:'Dapatkan senjata ★3',cond:()=>Object.keys(S.weapons).some(id=>WD[id].r===3),rw:{gems:300}},
 {id:'sig',n:'Pasang senjata signature ke pemiliknya',cond:()=>Object.keys(S.heroes).some(id=>{const w=wpnOf(id);return w&&w.owner===id}),rw:{gems:300}},
 {id:'cp5k',n:'Capai CP Tim 5.000',cond:()=>(S.bestCP||0)>=5000||teamPow()>=5000,rw:{gems:200}},
 {id:'cp15k',n:'Capai CP Tim 15.000',cond:()=>(S.bestCP||0)>=15000||teamPow()>=15000,rw:{gems:800}},
 {id:'cp30k',n:'Capai CP Tim 30.000',cond:()=>(S.bestCP||0)>=30000||teamPow()>=30000,rw:{gems:2500}},
 {id:'lv10',n:'Capai Level Akun 10',cond:()=>S.lv>=10,rw:{gems:300,gold:10000}}
];
