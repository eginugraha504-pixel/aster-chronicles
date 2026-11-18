/* =====================================================================
   OBROLAN DUNIA · GAYA BAHASA — cara tiap bot MENULIS (bukan apa yang ditulis)
   Isi kalimat ada di chat/lines.js, chat/threads.js, chat/brain.js. Mesin: systems/chat.js
   ---------------------------------------------------------------------
   Setiap bot mendapat persona tetap (seed per bot): register bahasa, huruf kecil/besar,
   seberapa sering menyingkat, gaya tertawa, emotikon, salah ketik (+ koreksi "*kata"),
   suka memecah pesan, panggilan akrab, dan seberapa cerewet.
   Tambah slang/emotikon/tawa baru cukup di sini, semua bot otomatis memakainya.
   ===================================================================== */
const CHAT_STYLE={
 // register bahasa. w = bobot. lower = peluang semua huruf kecil. abbr = peluang tiap kata disingkat.
 // en = peluang memakai kalimat Inggris bila tersedia. jp = peluang menyelipkan kata Jepang.
 regs:{
  gaul:  {w:42,lower:.92,abbr:.75,en:.04,jp:0,laugh:1,  emo:.25,punct:.15,typo:[.01,.045],split:.35,elong:.25},
  santai:{w:24,lower:.6, abbr:.4, en:.06,jp:0,laugh:.8, emo:.3, punct:.4, typo:[.005,.025],split:.2, elong:.12},
  sopan: {w:10,lower:.15,abbr:.08,en:.02,jp:0,  laugh:.35,emo:.35,punct:.85,typo:[0,.01],   split:.08,elong:.03},
  inggris:{w:8,lower:.7, abbr:.3, en:.85,jp:.02,laugh:.8, emo:.3, punct:.2, typo:[.005,.03],split:.2, elong:.1},
  wibu:  {w:0, lower:.75,abbr:.55,en:.1, jp:0,laugh:.9, emo:.2, punct:.25,typo:[.005,.03],split:.3, elong:.3},   // dimatikan (18 Nov 2026): terlalu cringe
  singkat:{w:8,lower:.97,abbr:.95,en:.03,jp:0,  laugh:.9, emo:.05,punct:0,  typo:[.01,.05],split:.05,elong:.05},
 },
 // seberapa sering bicara di chat dunia (dibanding rata-rata). Sebagian besar pemain hanya membaca.
 chatty:[[0,52],[.35,22],[1,16],[2.2,8],[4,2]],  // [bobot bicara, peluang %]
 // gaya tertawa: {n} = diulang acak
 laughs:['wkwk','wkwkwk','wkwkwkwk','wkwkwkwkwk','awokawok','awokawokawok','haha','hahaha','wkakaka','xixixi','hehe','kwkwkw','lol','lmao','ahahah','WKWKWK','anjay wkwk'],
 laughEn:['lol','lmao','haha','hahaha','xD','lmaoo'],
 emos:[':v','xD',':D','T_T',':(',':)','-_-','._.','wkwk :v'],
 emoSad:['T_T',':(','huhu','hiks','._.'],
 emoHappy:[':D','xD','yeay','hehe','mantap'],
 // kata Jepang yang suka diselipkan bot wibu
 jp:{pre:['etto','ano','mou','yosh','sugoi','yabai','sasuga','ara ara'],post:['desu','ne','yo','kawaii','yatta','sugoi','nee']},
 // panggilan akrab
 calls:['kak','bang','bro','gan','sis','bre','cuy','mas','mba','bos','puh','suhu','ngab','king'],
 // pengisi di awal / akhir kalimat
 pre:['eh','eh tapi','btw','asli','sumpah','jujur','wah','buset','anjay','duh','hmm','yaudah','gila','astaga','lah','loh','waduh','oalah','cie'],
 post:['sih','deh','dong','kok','nih','tuh','kan','loh','ya','yaa','yah','lah','mah','euy','kali','gitu','juga'],
 // singkatan: kata asli -> pilihan singkatan (dipilih acak per bot, bot cenderung konsisten)
 abbr:{
  'yang':['yg','yg','yang'],'tidak':['ga','gak','gk','nggak','ngga','tdk'],'nggak':['ga','gak','gk','ngga'],'gak':['ga','gk','gak'],'enggak':['ga','gak','ngga'],
  'banget':['bgt','bngt','bet','bener'],'sudah':['udh','udah','dah','sdh'],'udah':['udh','dah','udah'],'juga':['jg','juga'],'aja':['aj','aja','ae'],'saja':['aja','aj','doang'],
  'kalau':['klo','kalo','kl','klw'],'kalo':['klo','kl'],'sama':['sm','ama','sama'],'dulu':['dl','dulu'],'lagi':['lg','lagi'],'belum':['blm','belom','blom'],
  'gimana':['gmn','gimana','gmna'],'bagaimana':['gimana','gmn'],'kenapa':['knp','napa','kenapa'],'tapi':['tp','tapi'],'dapat':['dpt','dapet','dpet'],'dapet':['dpt','dpet','dapet'],
  'bisa':['bs','bisa','bsa'],'untuk':['utk','buat','bwt'],'buat':['bwt','buat'],'dari':['dr','dari'],'karena':['krn','soalnya','gara2'],'sekarang':['skrg','skrng','sekarang'],
  'besok':['bsk','besok'],'terus':['trs','terus','trus'],'mau':['mo','mau','pgn'],'kamu':['km','kamu','lu','lo'],'aku':['aku','ak','gw','gue','w'],'saya':['aku','saya','sy'],
  'emang':['emg','emang','mang'],'memang':['emg','emang'],'orang':['org','orang'],'pakai':['pake','pk','pakek'],'pake':['pk','pake'],'baru':['br','baru'],'banyak':['byk','bnyk','banyak'],
  'semua':['smua','semua'],'langsung':['lgsg','langsung','lsg'],'kayak':['kek','kyk','kayak','kek gini'],'seperti':['kayak','kek'],'beneran':['bnran','beneran','bener'],
  'jangan':['jgn','jangan'],'begitu':['gitu','gt'],'gitu':['gt','gitu'],'makasih':['makasi','mksh','thx','tq','makasii'],'terima kasih':['makasih','mksh','thx','tengkyu'],
  'maaf':['maap','sori','sry','mf'],'sorry':['sori','sry','sorry'],'oke':['ok','oke','okee','okey','sip','okk'],'iya':['iya','iy','ya','iyaa','iyap','yoi'],'ya':['ya','y','yaa'],
  'apa':['ap','apa','apaan'],'tahu':['tau','tw'],'tau':['tw','tau'],'sendiri':['sndiri','sendiri'],'dengan':['dgn','sama','ama'],'sih':['sih','si'],'nih':['nih','ni'],
  'bentar':['bntr','bentar','bentaran'],'sebentar':['bntr','bentar'],'kok':['kok','ko'],'deh':['deh','dh'],'gue':['gw','gue','w'],'gua':['gw','gua'],'lagian':['lgian','lagian'],
  'permata':['permata','gem','gems','prmt'],'tarikan':['pull','tarikan','tarik'],'summon':['summon','pull','gacha'],'level':['lv','lvl','level'],'pertama':['pertama','prtma'],
  'semangat':['semangat','smgt','gas','ganbatte'],'selamat':['slmt','selamat','met'],'malam':['malem','mlm','malam'],'pagi':['pagi','pgi'],'siang':['siang','siank'],
 },
 // tetangga keyboard QWERTY (untuk salah ketik yang manusiawi)
 keys:'qwertyuiop|asdfghjkl|zxcvbnm',
 // koreksi salah ketik dikirim sebagai pesan baru: "*kata"
 fixP:.45,
};
