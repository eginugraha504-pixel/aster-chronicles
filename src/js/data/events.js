/* =====================================================================
   EVENT — tampil di Misi > tab Event (dan tombol Event di lobi)
   ---------------------------------------------------------------------
   type:'login'    -> days:[{rw}, ...]  hari ke-N bisa diklaim bila sudah login N hari
   type:'missions' -> missions:[{id,n,goal,prog:()=>angka,rw}]
   dur (opsional)  : lama event dalam hari sejak pertama dilihat pemain (tanpa = permanen)
   cnt  : counter khusus event, naik lewat evCount(k,n): summon | clear | boss | lvup
   art  : gambar kartu -> {hero:id} | {weapon:id}
   rw   : gems, gold, stam, exp, tixH, tixW, hero, weapon, pickHero
   ===================================================================== */
const EVENTS=[
 {id:'login7',type:'login',n:'Login Pemula 7 Hari',tag:'PEMULA',art:{hero:'celestine'},
  desc:'Masuk setiap hari selama 7 hari dan kumpulkan hadiahnya. Hari ke-7: pilih 1 hero ★3!',
  days:[{rw:{gems:500,tixH:2}},{rw:{gems:1500,gold:30000}},{rw:{tixH:10}},{rw:{gems:1500,stam:120}},
        {rw:{tixW:10}},{rw:{gold:100000,gems:2000}},{rw:{pickHero:3,gems:3000},big:true}]},
 {id:'rookie',type:'missions',n:'Misi Pemula',tag:'PEMULA',art:{hero:'sakuya'},
  desc:'Selesaikan tantangan dari awal sampai puncak untuk menjadi kapten sejati. Tidak ada batas waktu.',
  missions:[
   {id:'c15',n:'Taklukkan tahap 1-5',goal:1,prog:()=>S.stages['1-5']?1:0,rw:{gems:500,tixW:3}},
   {id:'lv5',n:'Capai Level Akun 5',goal:5,prog:()=>S.lv,rw:{tixH:3}},
   {id:'hlv20',n:'Naikkan 1 hero ke Lv 20',goal:20,prog:()=>Math.max(...Object.values(S.heroes).map(h=>h.lv)),rw:{gold:50000}},
   {id:'w2',n:'Pasang senjata ★2 atau lebih',goal:1,prog:()=>Object.keys(S.heroes).some(id=>{const w=wpnOf(id);return w&&w.r>=2})?1:0,rw:{gems:500}},
   {id:'cp3k',n:'Capai CP Tim 3.000',goal:3000,prog:()=>Math.max(S.bestCP||0,teamPow()),rw:{tixH:3}},
   {id:'c25',n:'Taklukkan tahap 2-5',goal:1,prog:()=>S.stages['2-5']?1:0,rw:{gems:500,tixH:3}},
   {id:'lv10',n:'Capai Level Akun 10',goal:10,prog:()=>S.lv,rw:{gems:500,tixW:3}},
   {id:'c35',n:'Kalahkan Ksatria Kegelapan (3-5)',goal:1,prog:()=>S.stages['3-5']?1:0,rw:{pickHero:3}},
   {id:'cp20k',n:'Capai CP Tim 20.000',goal:20000,prog:()=>Math.max(S.bestCP||0,teamPow()),rw:{gems:500,tixH:3}},
   {id:'lv20',n:'Capai Level Akun 20',goal:20,prog:()=>S.lv,rw:{gems:1000,tixH:5}},
   {id:'c45',n:'Redakan Sarang Badai (4-5)',goal:1,prog:()=>S.stages['4-5']?1:0,rw:{gems:1000,tixH:5}},
   {id:'lv30',n:'Capai Level Akun 30',goal:30,prog:()=>S.lv,rw:{gems:1000,tixW:5}},
   {id:'c55',n:'Raih Puncak Aster (5-5)',goal:1,prog:()=>S.stages['5-5']?1:0,rw:{gems:1500,tixH:5}}]},
 {id:'fajar',type:'missions',n:'Festival Badai Raijin',tag:'TERBATAS',dur:14,art:{hero:'raika'},
  desc:'Rayakan kedatangan Raika! Kumpulkan progres selama event untuk hadiah ekstra.',
  missions:[
   {id:'s10',n:'Summon 30 kali',goal:30,cnt:'summon',rw:{gems:1000}},
   {id:'s30',n:'Summon 80 kali',goal:80,cnt:'summon',rw:{tixH:10}},
   {id:'s60',n:'Summon 150 kali',goal:150,cnt:'summon',rw:{tixW:10,gems:2000}},
   {id:'cl5',n:'Selesaikan 5 tahap',goal:5,cnt:'clear',rw:{gold:30000}},
   {id:'cl15',n:'Selesaikan 15 tahap',goal:15,cnt:'clear',rw:{tixH:5}},
   {id:'b3',n:'Kalahkan 3 bos',goal:3,cnt:'boss',rw:{gems:1500}},
   {id:'lu20',n:'Naikkan level hero 20 kali',goal:20,cnt:'lvup',rw:{gold:50000,stam:60}}]}
];
