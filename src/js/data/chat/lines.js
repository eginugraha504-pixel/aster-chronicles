/* =====================================================================
   OBROLAN DUNIA · LIBRARY KALIMAT — apa yang diucapkan bot (gaya tulis diatur chat/style.js)
   ---------------------------------------------------------------------
   CARA MENAMBAH: tambahkan string ke daftar yang cocok. Tidak perlu menyentuh mesin.
   - Tulis dalam bahasa normal; singkatan/huruf kecil/salah ketik ditambahkan otomatis sesuai persona bot.
   - [a|b|c] = pilih acak satu.  [a|] = kadang ada kadang tidak.
   - " // " = dipecah jadi beberapa pesan beruntun (seperti orang mengetik sepotong-sepotong).
   - Objek {t:'...', if:c=>..., w:2} = hanya dipakai bila syarat terpenuhi; w = bobot (default 1).
   SLOT (diisi mesin dari keadaan bot yang SEBENARNYA):
     {hero} hero favorit   {rh} hero acak miliknya   {got} yang barusan didapat   {lim} hero rate-up banner sekarang
     {limw} senjata rate-up   {newh} hero terbaru di game   {n} angka konteks   {pity} pity hero sekarang
     {stage} tahap terjauh   {cp} CP tim   {lv} level   {league} liga Arena   {held} tarikan yang ditabung
     {to} nama lawan bicara   {me} nama pemain (kamu)   {top} pemain CP #1   {old} nama lama
     {call} panggilan (kak/bang/bro..)   {laugh} tawa   {emo} emotikon   {sad} emotikon sedih   {happy} emotikon senang
     {city} kota   {food} makanan   {el} elemen acak   {weak} elemen yang dikalahkan {el}   {days} hari main   {hour} jam
     {online} jumlah online   {pitymax} hard pity   {soft} soft pity mulai
   ===================================================================== */
const CHAT_LINES={
 /* ---------- obrolan biasa (dipilih sesuai jam, hari & keadaan bot) ---------- */
 amb:{
  pagi:['pagi semua','pagi [guys|gaes|semuanya|para petualang]','met pagi {call}','pagi2 udah gacha {laugh}','ohayou minna','login dulu sebelum berangkat','pagi, misi harian dulu baru mandi',
   'absen pagi','pagi yang cerah buat narik {lim}','bangun tidur langsung buka game {laugh}','ngopi dulu sambil farming','pagi, hari ini harus dapet {lim}','klaim hadiah login dulu',
   'pagi gaes, ada yang udah sarapan?','mata masih sepet tapi stamina udah penuh'],
  siang:['siang semua','istirahat kantor main bentar','lagi makan siang sambil auto battle','siang2 panas mending main','jam istirahat = jam gacha','siang, ada yang online?',
   'abis makan ngantuk banget','kerja dulu ya nanti lanjut','numpang absen siang','lagi nunggu meeting, farming dulu','siang gini enaknya tidur {sad}'],
  sore:['sore semua','pulang kerja langsung login','sore2 gacha biar hoki','macet parah, main dulu di jalan','sore, stamina udah penuh lagi','abis hujan, adem banget main game',
   'sore gaes, ada event apa hari ini?','baru pulang, siapa yang masih online','ngopi sore sambil push stage'],
  malam:['malam semua','met malam {call}','malam, waktunya push stage','abis makan malam langsung gas','malem2 enaknya gacha','malam gaes, rame juga ya',
   'malam, hari ini udah dapet apa aja?','yang begadang absen','udah malem tapi masih semangat','malam ini harus tembus {stage}','abis kerja capek tapi tetep login'],
  dini:['siapa yang masih bangun jam segini','begadang lagi {laugh}','jam {hour} masih gacha, sehat?','insomnia, mending farming','besok kerja tapi masih main {sad}',
   'yang online jam segini pasti pejuang','mata udah 5 watt','satu tarikan lagi abis itu tidur // katanya','ga bisa tidur, ada yang mau ngobrol?','begadang buat Arena reset'],
  senin:['senin lagi {sad}','senin, semangat kerja','musim Arena baru, gas','senin pagi udah ngantuk','i hate monday','reset mingguan, ayo push liga'],
  jumat:['jumat, besok libur','tgif','jumat sore paling enak','besok weekend, malam ini begadang'],
  weekend:['weekend gas full','libur, seharian main','sabtu santai','minggu malem galau besok kerja','weekend waktunya farming dungeon','hari libur hp ga lepas dari tangan',
   'weekend gini pada ke mana?','rebahan sambil gacha, nikmat'],
  gajian:['gajian! waktunya khilaf','tanggal tua lewat, tanggal muda datang','gajian, kartu bulanan dulu','udah gajian? mau topup ga',{t:'abis gajian langsung topup {laugh}',if:c=>c.paid},
   'gaji numpang lewat // ke game','tahan, tahan, jangan topup','dompet aman, belum gajian {sad}'],
  makan:['lagi makan {food}','laper, makan {food} dulu','abis makan {food} langsung login','enaknya {food} sambil main','ada yang udah makan?','afk bentar, makan {food}',
   'makan dulu ya, stamina manusia juga perlu','{food} plus gacha = bahagia'],
  cuaca:['hujan deres di {city}','panas banget hari ini','{city} mendung','hujan, enak buat tidur sama gacha','mati lampu, sisa baterai 20% tapi masih main','dingin, pake jaket sambil main'],
  ngantuk:['ngantuk parah','mata berat','tidur dulu ya','udah ga kuat, oyasumi','off dulu, besok lanjut','tidur gaes, semoga besok hoki','pamit, jangan lupa misi harian'],
  gabut:['gabut','sepi ya','ada yang mau ngobrol','bosen nunggu stamina','pada ke mana nih','chat sepi banget','lagi nganggur, ada yang butuh tips?','rame juga ya hari ini',
   'baru {online} orang online','game ini nagih juga ya','random thought: {hero} kalau jadi nyata pasti lucu'],
  kerja:['lagi di kantor main diem2','bos lewat, sembunyiin hp','kerja sambil auto battle','shift malam, ditemenin game','lembur lagi {sad}','abis meeting langsung cek hadiah'],
  kuliah:['abis kuliah langsung login','tugas numpuk tapi gacha dulu','dosen telat, main dulu','skripsi? nanti dulu, ada banner baru'],
  harap:['bismillah hoki','semoga dapet {lim} hari ini','doain dapet {lim} gaes','tarik 10x, tutup mata','firasat hari ini hoki','pity {pity}, mudah2an bentar lagi',
   {t:'pity udah {pity}, deg2an',if:c=>c.pity>=55},'bulan ini harus dapet {lim}','cuma butuh 1 {lim} lagi','semoga rate on'],
  apes:['gacha ga pernah hoki','rate off terus {sad}','{n} tarikan cuma dapet sampah','game ini benci aku','kapan aku hoki','pity lagi pity lagi','ampas banget hari ini',
   'liat orang dapet {lim} sakit hati','udah pasrah sama gacha','berhenti aja kali ya {sad}','sabar, sabar, sabar','lucky gw kayaknya kepake buat hal lain'],
  hoki:['hari ini hoki banget','gacha lagi bersahabat','ga nyangka dapet 2 bintang 3 sekaligus','hoki gw lagi tinggi, mau dipake beli undian','rate on terus {laugh}','dewi gacha lagi sayang gw'],
  pityTinggi:[{t:'pity {pity} masih belum keluar bintang 3',if:c=>c.pity>=60},{t:'udah {pity} tarikan, soft pity mana',if:c=>c.pity>=66},{t:'pity {pity} // tinggal dikit lagi // semoga rate on',if:c=>c.pity>=70}],
  nabung:[{t:'lagi nabung buat banner depan',if:c=>c.held>0},{t:'nabung {held} tarikan, tahan godaan',if:c=>c.held>0},{t:'skip {lim} dulu, nabung',if:c=>c.held>0},
   {t:'banner ini skip, nunggu yang lebih bagus',if:c=>c.held>0},{t:'tahan, tahan, tabungan udah {held} tarikan',if:c=>c.held>=20}],
  farming:['farming dungeon terus','butuh bijih tempa banyak','emas habis buat naikin level','stamina cepet banget abis','grinding sampai pagi','dungeon level tinggi susah juga ya',
   'naikin senjata mahal banget','gold kurang terus','farming material buat limit break'],
  stuck:['stuck di {stage}','{stage} susah banget','bosnya {stage} kuat banget','ada tips buat {stage}?','udah 5x kalah di {stage}','{stage} bikin emosi',
   'tim gw kurang kuat buat {stage}','harus naikin CP dulu kayaknya'],
  arena:['arena hari ini kejam','liga {league} isinya monster semua','tiket arena abis','naik ke {league}!','turun liga {sad}','tim bertahan gw dihajar terus',
   'siapa yang nyerang gw tadi','arena pas jam rame susah menang','pertahanan gw lumayan juga ternyata','reset musim, mulai dari awal lagi'],
  cp:[{t:'CP gw baru {cp}',if:c=>c.cp<8000},{t:'akhirnya CP tembus {cp}',if:c=>c.cp>=10000},'CP segini cukup ga buat arena?','naikin CP susah banget','CP {cp}, masih jauh dari top',
   {t:'{top} CP nya gila, gimana caranya',if:c=>c.top&&c.top!==c.name}],
  pemula:['newbie disini, salam kenal','baru main hari ini','ada tips buat pemula?','hero awal pakai siapa ya','baru level {lv} hehe','game ini seru juga ternyata',
   'masih bingung sama sistem senjata','mau tanya, permata paling baik dipake buat apa?'],
  veteran:['main dari hari pertama rilis','udah {days} hari main tiap hari','dulu awal rilis susah banget','sekarang udah santai, tinggal farming','yang baru main semangat ya'],
  favorit:['{hero} best girl','{hero} paling lucu','{hero} carry terus','tim gw tanpa {hero} ga jalan','{hero} = istri','siapa lagi pakai {hero}?','udah limit break {hero}, worth',
   '{hero} jangan di-nerf','ngeliatin {hero} di beranda aja udah seneng','kalau {hero} ngomong suaranya lucu banget'],
  opini:['{rh} underrated menurut gw','{rh} overrated ga sih','support itu penting, jangan cuma damage','tank bikin tim awet','elemen {el} kuat lawan {weak}','tim campur elemen lebih aman',
   'senjata signature beda banget efeknya','limit break lebih penting dari level','jangan lupa pasang pelindung sama aksesori'],
  baru:[{t:'{newh} lucu banget',if:c=>c.newRecent},{t:'ada yang udah dapet {newh}?',if:c=>c.newRecent},{t:'{newh} enak buat heal',if:c=>c.newRecent&&c.newHeal},
   {t:'splash art {newh} gerak2 cantik',if:c=>c.newRecent},{t:'hero baru {newh} worth ga?',if:c=>c.newRecent},{t:'{newh} tanduknya imut',if:c=>c.newId==='marisa'&&c.newRecent}],
  banner:['banner {lim} masih lama ga?','{lim} worth ga sih','rate up {lim}, gas','{limw} perlu ga buat {lim}?','banner senjata bikin bangkrut','{lim} vs {rh}, pilih mana',
   'banner sekarang bagus','nunggu rerun aja deh'],
  topup:[{t:'topup dikit buat kartu bulanan',if:c=>c.paid},{t:'kartu bulanan paling worth sih',if:c=>c.card},'topup ga ya // tahan dulu','yang topup pasti CP nya tinggi',
   'f2p juga bisa kok','sultan mah bebas','f2p bangga','paket pertama dapet bonus dobel lho',{t:'dompet menangis bulan ini',if:c=>c.vip>=3},{t:'VIP {vip} tapi masih apes {laugh}',if:c=>c.vip>=2}],
  live2d:['splash art di game ini gerak2 ya','suka banget animasi splash nya','pas kedip lucu banget','beranda nya cantik, ganti2 hero','lagu menu nya enak','suaranya jepang semua, mantap'],
  meta:['ini chat isinya bot semua ya',{t:'kadang gw curiga {to} itu bot {laugh}',w:.5},'kalian manusia kan?','gw bukan bot ya',{t:'yang bales cepet pasti bot',w:.5}],
  pamit:['off dulu','cabut dulu','bye semua','duluan ya','mau tidur, jaa ne','sampai besok','pamit, hp lowbat','afk bentar'],
  motivasi:['semangat semua','gas terus','jangan menyerah sama gacha','hoki itu soal waktu','semoga kalian semua rate on','ingat istirahat juga ya'],
  rehat:['kayaknya mau rehat dulu dari game ini','lagi males main','udah bosen sama gacha','mungkin berhenti dulu','game nya seru tapi gw capek','sibuk di dunia nyata, jarang login'],
 },
 /* ---------- reaksi kejadian NYATA bot (tarikan, top up, bergabung, dst.) ---------- */
 ev:{
  pullLim:['AKHIRNYA {got}!!','{got} pulang ke rumah','dapet {got} // {laugh} // ga nyangka','yatta {got}','{got} rate on!','{got} dateng juga {happy}','alhamdulillah {got}',
   'tarik 10x langsung {got}','gila dapet {got}','{got}!!! // aku teriak','makasih dewi gacha, {got} dapet','{got} punyaku sekarang','{got} keluar di pity {n}'],
  pullEarly:['tarikan ke {n} langsung {got} {laugh}','{n} tarikan doang dapet {got}','early {got}!!','baru {n} pull udah {got}, maaf ya','hoki parah, {got} di pity {n}'],
  pullOff:['rate off dapet {got} {sad}','yah {got} lagi','kalah 50/50 // {sad}','niatnya {lim} malah {got}','{got} lagi? udah punya','rate off di pity {n}, sakit',
   'kok {got} sih','{got} bagus juga sih, tapi bukan yang dicari','next pasti {lim} // guaranteed'],
  pullStd:['dapet {got} lumayan','{got} keluar','bintang 3 {got}, oke lah','{got} buat tim gw','yey {got}'],
  pullDupe:['{got} dupe, limit break naik','{got} lagi, makin kuat','dapet {got} lagi, +1 limit break'],
  pullWpn:['dapet {got}','senjata {got} keluar!','{got} akhirnya','banner senjata ramah hari ini, {got}'],
  buyCard:['beli kartu bulanan','perpanjang kartu bulanan dulu','kartu bulanan aktif, permata harian aman','topup kartu bulanan, worth'],
  buySmall:['topup dikit','topup buat 10x','khilaf topup dikit','topup recehan dulu'],
  buyBig:['khilaf topup lagi','dompet menangis','sultan mode on','topup gede buat {lim}','yang penting {lim} dapet','tabungan bulan ini lari ke game {laugh}','mode sultan aktif'],
  buyBanner:['banner baru, topup dulu','gas banner baru','{lim} harus dapet, topup','pre-order nangis {laugh}'],
  join:['halo semua','salam kenal, baru main','newbie disini','halo, aku baru download','hai hai','baru gabung nih, salken','halo kak, mohon bimbingannya','first day, mohon arahan'],
  welcome:['welcome {to}','salken {to}','selamat datang {to}','halo {to}','welcome {call}','selamat datang di dunia gacha {laugh}','welcome, semoga hoki','halo {to}, semangat',
   'selamat bergabung','welcome! ikutin misi pemula dulu','salken, aku juga baru minggu ini'],
  comeback:['balik lagi gara2 {lim}','halo, lama ga login','comeback nih','kangen game ini','balik main, banyak yang baru ya','rindu {hero}'],
  rename:['aku ganti nama ya, dulu {old}','yang kenal {old}, itu aku','nama baru, orang yang sama','ganti nama biar hoki {laugh}'],
  rehat:['lagi males main akhir2 ini','kayaknya mau berhenti dulu','gacha bikin capek','sibuk, jarang login nanti'],
  eraStart:['BANNER BARU!','{lim} rilis!!','gas {lim}','udah nunggu {lim} dari kemarin','tarik {lim} siapa yang udah?','banner {lim} keluar, gasss','{lim} cantik banget'],
  newHero:['{newh} keluar!','hero baru {newh}','{newh} lucu banget','siapa yang udah liat {newh}?'],
  // Arena melawan KAMU (pemain). {me} = nama pemain
  revWin:['@{me} impas ya {laugh}','@{me} balas dendam sukses','@{me} gantian dong','@{me} hehe maaf','@{me} jangan dendam ya','@{me} 1-1 ya','@{me} poin ku balik {laugh}','@{me} sekarang kita seri','tadi diserang {me}, udah gw bales','@{me} kirain ga bakal gw bales?','@{me} gg, lain kali lagi','@{me} dendam terbalaskan'],
  revLose:['@{me} tim bertahan mu kuat banget','@{me} ga tembus {sad}','@{me} pertahanan apaan itu','@{me} ampun, gw nyerah','@{me} mau bales malah kalah lagi','@{me} nanti gw coba lagi','niat bales {me} malah turun poin {sad}','@{me} tim bertahan mu siapa aja sih'],
  hitWin:['@{me} maaf ya kena tim gw','@{me} numpang poin {laugh}','@{me} gg','@{me} random match, jangan marah','@{me} tim bertahan mu lumayan kok','makasih poinnya {me} {laugh}'],
  beatenBy:['@{me} kok kuat banget','@{me} ampun bang','@{me} tunggu pembalasanku','siapa sih {me} nyerang gw mulu','@{me} gg, tim mu bagus','@{me} santai dong {laugh}','{me} curang ya {laugh}'],
  // bot lain memberi selamat atas ★3 yang diumumkan sistem
  grats:['gg {to}','hoki bgt {to}','{to} bagi hokinya','selamat {to}','iri sama {to}','wih {to}','gg gg','sultan {to}?'],
  // reaksi ke tarikan pemain yang diumumkan sistem
  gratsMe:['gg @{me}','hoki banget @{me}','@{me} bagi hokinya dong','selamat @{me}','iri sama @{me}','@{me} sultan?','wih @{me} dapet {got}','@{me} congrats'],
 },
 /* ---------- Inggris (persona inggris memakainya bila ada) ---------- */
 en:{
  pagi:['morning all','gm everyone','good morning, daily missions first'],malam:['evening guys','gn everyone','night grind time'],dini:['who is still up','3am gacha is the best gacha','cant sleep lol'],
  harap:['pls rate up','praying for {lim}','10 pull lets go','one more pull then sleep'],apes:['lost the 50/50 again','my luck is cursed','this gacha hates me','rip my gems'],
  hoki:['gacha luck today is insane','double gold lets go'],favorit:['{hero} is the best','{hero} carries hard','{hero} best girl no debate'],gabut:['chat is quiet today','anyone online?','bored waiting for stamina'],
  pamit:['gtg','brb','gn all','cya'],arena:['arena is brutal today','who hit my defense lol'],stuck:['stuck at {stage}','any tips for {stage}?'],
  pullLim:['FINALLY {got}!!','{got} came home','got {got} lets gooo'],pullOff:['lost the 50/50 to {got}','{got} again? bruh'],welcome:['welcome {to}','hi {to}, have fun'],
  join:['hi everyone, new here','hello, just started'],gratsMe:['gg @{me}','congrats @{me}','@{me} share the luck pls'],beatenBy:['@{me} gg your team is strong','@{me} chill lol'],
 },
 /* ---------- isian slot ---------- */
 city:['Jakarta','Bandung','Surabaya','Medan','Jogja','Semarang','Makassar','Bekasi','Depok','Bogor','Malang','Palembang','Bali','Pontianak','Balikpapan','Solo','Tangerang','Padang','Manado','Lampung'],
 food:['mie instan','nasi goreng','bakso','seblak','martabak','indomie telor','soto','sate','gorengan','nasi padang','pecel lele','ayam geprek','roti bakar','bubur ayam','kopi susu','es teh'],
 // kata Jepang/romaji yang boleh muncul di kalimat bot wibu: lihat CHAT_STYLE.jp
};
