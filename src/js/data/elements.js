/* =====================================================================
   ELEMEN, ROLE, TIPE SKILL, KELAS SENJATA
   ===================================================================== */
const EL={api:{n:'Api',c:'#ff6a3c'},air:{n:'Air',c:'#3fa9f5'},tanah:{n:'Tanah',c:'#5fbf4a'},cahaya:{n:'Cahaya',c:'#ffd23f'},gelap:{n:'Gelap',c:'#9b5de5'},netral:{n:'Netral',c:'#c9ced8'}};
function elMult(a,d){const adv={api:'tanah',tanah:'air',air:'api'};if(adv[a]===d)return 1.3;if(adv[d]===a)return .75;if((a==='cahaya'&&d==='gelap')||(a==='gelap'&&d==='cahaya'))return 1.3;return 1}
const ROLE={warrior:{n:'Petarung',hp:1,atk:1.15,def:1,cd:1.1,melee:1},ranger:{n:'Pemanah',hp:.8,atk:1.3,def:.8,cd:.9,melee:0},tanker:{n:'Penjaga',hp:1.6,atk:.65,def:1.6,cd:1.3,melee:1},support:{n:'Pendukung',hp:.95,atk:.8,def:.95,cd:1.2,melee:0}};
const SKT={aoe:'Serangan Area',single:'Serangan Tunggal',heal:'Penyembuhan',shield:'Perisai',buff:'Penguat'};
const WCLASS={sword:'Pedang',bow:'Busur',staff:'Tongkat',shield:'Perisai',axe:'Kapak'};
const SUBN={crit:'Crit',hp:'HP',def:'DEF'};
