/* =====================================================================
   DUNIA & TAHAP — tambah dunia = tambah 1 entri (5 tahap dibuat otomatis)
   bg: grass|cave|castle  mobs: id musuh acak  els: elemen acak  boss/bossEl: bos tahap 5
   ===================================================================== */
const WORLDS=[
 {n:'Padang Hijau',art:'grass',bg:'grass',mobs:['slime','slime','goblin','archer'],els:['tanah','air','netral'],boss:'bGoblin',bossEl:'tanah',stages:['Gerbang Desa','Ladang Slime','Jalan Setapak','Hutan Embun','Sarang Raja Goblin'],intro:'Slime dan goblin mulai menyerbu ladang di pinggir desa.'},
 {n:'Gua Kristal',art:'cave',bg:'cave',mobs:['slime','skeleton','mage','skeleton'],els:['gelap','air','tanah'],boss:'bSlime',bossEl:'air',stages:['Mulut Gua','Terowongan Kristal','Danau Bawah Tanah','Altar Bayangan','Inti Kristal'],intro:'Kristal di dalam gua berdenyut dengan energi aneh.'},
 {n:'Benteng Senja',art:'castle',bg:'castle',mobs:['knight','skeleton','mage','archer'],els:['api','cahaya','gelap'],boss:'bKnight',bossEl:'gelap',stages:['Jembatan Senja','Halaman Benteng','Menara Bara','Aula Gelap','Takhta Kegelapan'],intro:'Sumber kegelapan bersembunyi di benteng tua di ujung senja.'},
 {n:'Lembah Badai',art:'storm',bg:'grass',mobs:['archer','mage','goblin','skeleton'],els:['air','cahaya','tanah'],boss:'bSlime',bossEl:'api',stages:['Kaki Lembah','Jembatan Gantung','Gua Angin','Tebing Petir','Sarang Badai'],intro:'Badai aneh mengamuk di lembah. Seekor slime raksasa telah menelan inti api.'},
 {n:'Puncak Aster',art:'summit',bg:'castle',mobs:['knight','mage','skeleton','archer'],els:['gelap','cahaya','api','air'],boss:'bKnight',bossEl:'cahaya',stages:['Gerbang Langit','Tangga Awan','Taman Bintang','Altar Fajar','Takhta Puncak'],intro:'Di puncak tertinggi, Ksatria Kegelapan bangkit kembali dengan kekuatan fajar yang dicuri.'}
];
