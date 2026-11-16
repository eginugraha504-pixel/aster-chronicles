/* =====================================================================
   TOKO EMAS — tempat menghabiskan emas (stok reset tiap hari)
   give: hadiah (format sama dengan rw), cost: harga emas, limit: maks beli per hari
   ===================================================================== */
/* TOKO LENCANA — tukar Lencana Ksatria (dari hero duplikat setelah Limit Break maks)
   give.pickHero / give.pickWpn = pilih 1 hero / senjata ★N STANDAR (bukan terbatas)
   limit: maks beli per minggu (0 = tanpa batas) */
const SHOP_X=[
 {id:'xh3',give:{pickHero:3},cost:300,limit:0},
 {id:'xw3',give:{pickWpn:3},cost:200,limit:0},
 {id:'xtixH',give:{tixH:1},cost:12,limit:10},
 {id:'xtixW',give:{tixW:1},cost:8,limit:10},
 {id:'xore3',give:{mats:{ore3:2}},cost:10,limit:5},
 {id:'xgem3',give:{mats:{gem3:1}},cost:15,limit:3}
];
const SHOP=[
 {id:'ore1',give:{mats:{ore1:5}},cost:8000,limit:5},
 {id:'ore2',give:{mats:{ore2:2}},cost:20000,limit:3},
 {id:'ore3',give:{mats:{ore3:1}},cost:60000,limit:2},
 {id:'gem1',give:{mats:{gem1:3}},cost:25000,limit:3},
 {id:'gem2',give:{mats:{gem2:1}},cost:60000,limit:2},
 {id:'gem3',give:{mats:{gem3:1}},cost:180000,limit:1},
 {id:'stam',give:{stam:60},cost:30000,limit:2},
 {id:'tixW',give:{tixW:1},cost:300000,limit:1},
 {id:'tixH',give:{tixH:1},cost:500000,limit:1}
];
