/* =====================================================================
   GUILD — data: aturan, nama guild bot, lambang, kalimat obrolan guild
   Server menyimpan buku besar (bank-worker/src/guild.js); politik guild bot dihitung systems/guild.js.
   xp/cap SAMA dengan bank-worker/src/guild.js (G_XP / gCap).
   ===================================================================== */
const G_CFG={
 xp:[0,0,600,2300,5400,10200,16900,25700,36900,50400,66600],   // xp kumulatif untuk Lv n (maks Lv 10)
 cap:lv=>30+2*(lv-1),vice:2,elite:5,minLv:12,tick:20*6e4,
 create:{gems:300},
 ci:{xp:10,gold:lv=>4000+lv*800,coin:lv=>20+lv*3},            // absen harian (pemain)
 don:[null,{gold:20000,xp:20,coin:12},{gems:50,xp:60,coin:40},{gems:150,xp:150,coin:110}],
 // Toko Koin Guild: limit = per hari, lv = level guild minimal
 shop:[
  {id:'gstam',give:{stam:60},cost:50,limit:2},
  {id:'ggold',give:{gold:60000},cost:70,limit:2},
  {id:'gasc1',give:{mats:{asc1:3}},cost:110,limit:2},
  {id:'gore3',give:{mats:{ore3:1}},cost:90,limit:2,lv:2},
  {id:'gtixW',give:{tixW:1},cost:220,limit:1,lv:2},
  {id:'gasc2',give:{mats:{asc2:2}},cost:240,limit:1,lv:3},
  {id:'gtixH',give:{tixH:1},cost:320,limit:1,lv:4},
  {id:'ggem3',give:{mats:{gem3:1}},cost:200,limit:1,lv:5},
  {id:'gasc3',give:{mats:{asc3:1}},cost:520,limit:1,lv:7}],
 vote:{ms:3*36e5,need:.25,cool:2*864e5},
 inv:{gold:0},
 // simulasi politik bot (per tick 20 menit; peluang harian dikonversi per tick)
 sim:{per:30,      // ±1 guild per 30 bot aktif yang memenuhi syarat
  lookDay:6,       // bot tanpa guild mencari guild: ±6×/hari (cepat dapat)
  hopDay:.05,      // bot di guild memikirkan pindah: ±5%/hari × (1 - kesetiaan)
  splitDay:.06,    // wakil ambisius yang tidak cocok dengan ketua memisahkan diri
  coupDay:.3,      // ketua mulai jarang aktif → mosi kudeta per hari
  powerDay:.03,    // perebutan kekuasaan: wakil ambisius jauh lebih kuat & tidak cocok dengan ketua (ketua tetap aktif)
  dieDay:.35,      // guild sepi bubar per hari
  lone:.07}        // penyendiri: tidak masuk guild
};
const gLvOf=xp=>{let l=1;while(l<10&&xp>=G_CFG.xp[l+1])l++;return l};

/* ---- nama guild bot: bervariasi, natural, tanpa angka / simbol aneh ---- */
const GN={
 idA:['Lentera','Pedang','Ksatria','Bintang','Kabut','Serigala','Pelangi','Ombak','Bayangan','Laskar','Pendekar','Elang','Garuda','Teratai','Melati','Purnama','Badai','Petir','Embun','Samudra','Rimba','Langit','Mentari','Rembulan','Kunang','Penjaga','Pemburu','Pengembara','Keluarga','Sahabat','Benteng','Istana','Kerajaan','Nyala','Cahaya','Taring','Sayap','Mahkota','Perisai','Tombak','Panah','Naga','Rumah','Pasukan','Anak','Jiwa','Darah','Bara','Kilat','Arus','Puncak','Lembah','Pulau','Tanah'],
 idB:['Senja','Fajar','Malam','Biru','Merah','Emas','Perak','Utara','Selatan','Timur','Barat','Abadi','Langit','Bulan','Hitam','Putih','Jingga','Ungu','Kelana','Sakti','Muda','Rimba','Badai','Terakhir','Sunyi','Liar','Berani','Setia','Bersatu','Kencana','Nusantara','Raya','Sejati','Damai','Bara','Embun','Perkasa','Pagi','Merdeka','Pertiwi','Jaya','Mulia'],
 enA:['Silver','Crimson','Eternal','Night','Golden','Shadow','Iron','Azure','Scarlet','Midnight','Frost','Storm','Wild','Silent','Lunar','Solar','Royal','Ember','Phantom','Rising','Fallen','Hidden','Velvet','Obsidian','Emerald','Ivory','Blue','Black','White','Last','Northern','Lost','Brave','Holy','Savage','Mystic'],
 enB:['Wolves','Oath','Dawn','Owls','Knights','Ravens','Legion','Order','Covenant','Tide','Blades','Lions','Hearts','Wings','Crown','Guard','Dragons','Vanguard','Sentinels','Pact','Haven','Spirits','Hunters','Rebels','Saints','Souls','Stars','Embers','Tigers','Foxes','Serpents','Riders','Breakers','Keepers'],
 one:['Aurora','Valhalla','Nirwana','Elysium','Asgard','Olympus','Avalon','Zenith','Eclipse','Nebula','Solstice','Pandora','Arcadia','Atlantis','Eden','Genesis','Infinity','Nova','Orion','Pegasus','Sanctuary','Tempest','Utopia','Vortex','Paradox','Requiem','Seraph','Excalibur','Kirin','Sirius','Polaris','Andromeda','Equinox','Odyssey','Celestia','Mirage','Oblivion','Phoenix','Halcyon','Nusantara','Swargaloka','Mandala','Kahyangan'],
 jp:['Akatsuki','Sakura','Kitsune','Yamato','Shinobi','Tsukuyomi','Amaterasu','Hoshizora','Kaze','Hikari','Yume','Kurogane','Tenshi','Shiro','Kumo','Hanabi','Mugen','Kagerou','Momiji','Sora','Akari','Yoru','Raijin','Fujin','Kogane','Tsubaki','Hotaru','Kaguya'],
 jpB:['Gumi','no Kaze','no Hoshi','Kai','Shu','Dan','no Mori'],
 fun:['Santuy Squad','Kaum Rebahan','Keluarga Cemara','Anak Kos','Pejuang Gacha','Tim Hore','Geng Pagi','Kopi Susu','Mie Ayam Squad','Sultan Kecil','Pasukan Nyantai','Gacha Hemat','Pejuang Pity','Anti Ampas','Tim Begadang','Warung Kopi','Kopi Tubruk','Pecinta Naga','Rumah Singgah','Bocah Petualang','Pejuang Diskon','Dompet Tipis','Pemburu Bintang','Tukang Absen','Tim Rebahan','Grup Arisan','Nasi Padang','Pisang Goreng','Bakso Urat','Es Teh Manis','Ronda Malam','Anak Senja','Pasukan Ngantuk','Lelah Tapi Lanjut','Tim Healing','Kaum Mendang','Pejuang Subuh','Geng Santai','Sobat Ambyar','Tim Gercep','Pasukan Gabut','Keluarga Besar','Tim Nyantai','Rumah Kita']
};
// gaya nama menurut sifat pendiri (ui/chat.js wcPersona): kompetitif → megah/Inggris, kocak → lucu, suka bantu → hangat
function gNameGen(i,taken,salt=0){const P=typeof wcPersona==='function'?wcPersona(i):{sifat:''},r=bRng(bHash(i,9400+salt)),pk=L=>L[Math.floor(r()*L.length)];
 const W=/kompetitif/.test(P.sifat)?[['en',4],['one',3],['idE',2],['jp',1]]:/kocak/.test(P.sifat)?[['fun',6],['id',2],['en',1]]:/suka bantu|sabar/.test(P.sifat)?[['idW',4],['id',2],['one',1],['fun',1]]:/cuek/.test(P.sifat)?[['one',3],['jp',3],['en',2]]:[['id',3],['en',3],['one',2],['jp',1],['fun',2]];
 for(let k=0;k<40;k++){let x=r()*W.reduce((a,w)=>a+w[1],0),st=W[0][0];for(const[w,n]of W){if(x<n){st=w;break}x-=n}
  let n=st==='en'?(r()<.2?'The ':'')+pk(GN.enA)+' '+pk(GN.enB):st==='one'?pk(GN.one):st==='jp'?(r()<.55?pk(GN.jp)+' '+pk(GN.jpB):pk(GN.jp)):st==='fun'?pk(GN.fun)
   :st==='idW'?pk(['Rumah','Keluarga','Sahabat','Kunang','Lentera','Teratai','Embun','Pelangi','Anak'])+' '+pk(['Senja','Fajar','Bersatu','Setia','Damai','Pagi','Bulan','Kita','Muda'])
   :st==='idE'?pk(['Pedang','Naga','Garuda','Petir','Badai','Taring','Mahkota','Laskar','Pendekar','Benteng'])+' '+pk(['Sakti','Perkasa','Abadi','Emas','Merah','Hitam','Jaya','Kencana','Terakhir'])
   :pk(GN.idA)+' '+pk(GN.idB);
  if(n.length>18||/(\b\w+\b).*\b\1\b/i.test(n))continue;if(!taken||!taken.has(n.toLowerCase()))return n}
 return pk(GN.idA)+' '+pk(GN.one)}
// nama sah (sama dengan server): huruf + spasi/apostrof, 3–18 karakter
const gNameOk=s=>{const n=String(s||'').normalize('NFC').replace(/\s+/g,' ').trim();return n.length>=3&&n.length<=18&&/^\p{L}[\p{L}' ]*\p{L}$/u.test(n)&&!/['  ]{2}/.test(n)?n:null};

/* ---- lambang guild: warna × simbol (emb = warna*10 + simbol) ---- */
const G_EMB_C=[['#ff8a8a','#e0483b','#9a2a20'],['#8ac8ff','#3a8ae0','#1f4f9a'],['#9af0a0','#3ab85a','#1f6a34'],['#ffe08a','#e8b030','#9a6a10'],['#d8a8ff','#9a5ae0','#5a2a9a'],['#ffb8e0','#e05aa8','#8a2a60'],['#a8f0f0','#2ab8c0','#1a6a70'],['#e8e8f0','#9aa0b8','#50566a'],['#ffc890','#e0782a','#8a4010'],['#7a7a90','#3a3a50','#1a1a28']];
const G_EMB_S=['Bintang','Pedang','Bulan','Api','Daun','Ombak','Mahkota','Sayap','Taring','Hati'];
const G_EMB={};
function gEmb(e){e=Math.max(0,Math.min(99,+e||0));if(G_EMB[e])return G_EMB[e];const[c0,c1,c2]=G_EMB_C[Math.floor(e/10)%10],sy=e%10,W='#fff8e6',Y='#ffe08a';
 return G_EMB[e]=pxIcon(K=>{K.poly([[2,2],[14,2],[14,8],[8,15],[2,8]],c1);K.poly([[2,2],[8,2],[8,15],[2,8]],c0);K.rect(2,2,12,1,c0);K.line(14,3,14,8,c2);K.line(14,8,8,15,c2);
  const s=[()=>{K.pts([[8,4],[7,6],[8,6],[9,6],[5,7],[6,7],[7,7],[8,7],[9,7],[10,7],[11,7],[6,8],[7,8],[8,8],[9,8],[10,8],[7,9],[8,9],[9,9],[6,10],[7,10],[9,10],[10,10]],W)},
   ()=>{K.line(8,4,8,10,W);K.rect(6,10,5,1,Y);K.P(8,11,c2);K.P(8,12,Y)},
   ()=>{K.circ(8,8,3.2,Y);K.circ(9.4,7,2.6,c1)},
   ()=>{K.poly([[8,4],[11,8],[10,11],[6,11],[5,8]],'#ffb040');K.poly([[8,7],[9.6,9.5],[8,11],[6.4,9.5]],Y)},
   ()=>{K.poly([[5,11],[7,6],[11,4],[10,9]],'#9af0a0');K.line(5,11,10,6,'#1f6a34')},
   ()=>{K.rect(4,7,8,1,W);K.rect(4,9,8,1,W);K.pts([[5,6],[9,6],[7,8],[11,8],[5,10],[9,10]],W)},
   ()=>{K.rect(5,8,7,3,Y);K.pts([[5,6],[5,7],[8,5],[8,6],[8,7],[11,6],[11,7]],Y);K.P(8,9,'#e0483b')},
   ()=>{K.poly([[8,10],[4,6],[4,9]],W);K.poly([[8,10],[12,6],[12,9]],W);K.rect(7,8,3,4,W)},
   ()=>{K.poly([[5,5],[7,11],[8,7]],W);K.poly([[11,5],[9,11],[8,7]],W)},
   ()=>{K.circ(6.5,7.5,1.8,'#ff8a9a');K.circ(9.5,7.5,1.8,'#ff8a9a');K.poly([[4.8,8],[11.2,8],[8,12]],'#ff8a9a')}][sy];s()})}
const G_ROLE=['Anggota','Elit','Wakil Ketua','Ketua'];
const G_MODE=['Bebas masuk','Lewat lamaran','Tertutup'];

/* ---- kalimat obrolan guild para bot (tanpa AI, dibuat game; {n} nama, {lv} level, {b} bos) ---- */
const GCH={
 pagi:['pagi semua','pagi guild','pagi, jangan lupa absen ya','absen dulu','udah absen semua?','pagi, lanjut farming','pagi pagi udah login wkwk','met pagi'],
 siang:['ada yg mau bareng raid nanti?','{b} jam {j} ya, kumpul','donasi udah masuk','makasih yg udah donasi','jangan lupa donasi biar cepet naik level','siang guild','lagi istirahat kerja nih','ada yg pity tinggi ga','banner ini worth ga sih','toko guild udah pada beli?','koin guild buat apa enaknya','lagi push tahap nih','yang belum absen absen dulu'],
 malam:['malam semua','gas raid','abis raid langsung tidur','begadang lagi nih','ada yg masih bangun?','malam, absen dulu sebelum reset','raid tadi seru','dapet ★3 nih barusan','arena lagi rame','besok absen lagi ya'],
 join:['welcome {n}','selamat datang {n}','wih ada anggota baru, halo {n}','halo {n}, jangan lupa absen tiap hari ya','salken {n}','halo {n}, betah betah ya'],
 self:['halo semua, salken','makasih udah diterima','halo, mohon bimbingannya','halo guild'],
 left:['loh {n} keluar','yah {n} pindah','{n} kemana tuh','yaudah semoga betah di sana {n}'],
 poach:['loh {n} dibujuk pindah guild lain','{n} pindah ke guild sebelah tuh','yah {n} kena rayu guild lain'],
 kick:['{n} dikeluarin, udah lama ga aktif','bersih bersih anggota ga aktif dulu ya','slot dikosongin buat yg aktif'],
 lvup:['guild naik ke Lv {lv}!','mantap naik level','akhirnya Lv {lv}, makasih donasinya semua','gas terus sampai Lv {nx}','slot anggota nambah nih'],
 lead:['selamat buat ketua baru {n}','ketua baru nih, semangat {n}','yah ketua lama udah ga main ya','siap ketua {n}'],
 vote:['waduh ada mosi kudeta','serius nih mau ganti ketua?','aku sih dukung {n}','aku tetap sama ketua','ketua jarang on sih emang','jangan ribut dong','vote dulu semua','hmm aku netral aja'],
 coup:['ketua baru! {n} menang voting','wah beneran kudeta berhasil','selamat {n}, semoga guild makin aktif','sedih ketua lama diganti'],
 coupno:['mosi gagal, ketua tetap','udah udah, damai lagi ya','yaudah ketua tetap, lanjut main'],
 found:['guild baru, ayo rame in','halo semua, guild baru nih, ajak temen ya','gas kita bikin guild ini top']
};
