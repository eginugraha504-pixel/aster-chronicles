/* =====================================================================
   OBROLAN DUNIA · OTAK BALASAN — bot menanggapi pesan KAMU di chat dunia
   ---------------------------------------------------------------------
   Urutan: 1) Claude (bila tersedia di claude.ai): balasan bebas sesuai persona & keadaan bot.
           2) Otak lokal di file ini (GitHub Pages / offline): pola kata kunci -> balasan.
   Setiap intent: re = pola (regex, huruf kecil), n = jumlah bot yang menanggapi [min,maks],
   p = peluang ada yang menanggapi, rep = balasan (string/fungsi, format sama dengan chat/lines.js),
   learn = (m,txt)=>simpan fakta tentangmu di m (diingat bot, dipakai di obrolan berikutnya).
   Slot tambahan khusus balasan: {me} namamu, {x} kata yang ditangkap pola, {pfav} hero favoritmu,
   {pcity} kotamu (bila pernah kamu sebut), {pcp} CP-mu, {prank} peringkatmu.
   Intent pertama yang cocok dipakai, jadi taruh yang paling spesifik di atas.
   ===================================================================== */
const CHAT_BRAIN={
 intents:[
  {id:'kasar',re:/\b(anjing|bangsat|goblok|tolol|bego|kontol|memek|babi|kampret|bodoh|idiot|stupid|fuck|shit)\b/,n:[1,2],p:.9,
   rep:['santai {call}','jangan toxic {me}','wah kasar','ga usah marah2 {laugh}','sabar bro','kenapa sih {me}','tarik napas dulu'],mood:-1},
  {id:'bot',re:/\b(bot|robot|ai|npc)\b/,n:[1,3],p:.9,
   rep:['bot? gw manusia kali','lu yang bot {laugh}','beep boop {laugh}','enak aja dibilang bot','bot ga mungkin apes kayak gw','kalau gw bot udah gw setting hoki {laugh}','{me} curigaan amat']},
  {id:'dapatLim',re:/(dapet|dapat|dpt|got|keluar|rate on).*(HERO3)|(HERO3).*(keluar|dapet|dapat|rate on)/,n:[1,3],p:.95,
   rep:['gg {me}!','hoki banget {me}','bagi hokinya {me}','selamat {me}','iri bgt','{x} mantap','wih {x}','aku belum dapet {x} {sad}','gg, {x} kuat'],learn:(m,t,x)=>{m.got=x}},
  {id:'rateOff',re:/(rate ?off|kalah 50|apes|sial|zonk|ampas|ga dapet|gak dapet|gk dpt|blm dapet|belum dapet|pity lagi)/,n:[1,3],p:.9,
   rep:['sabar {me}','sama {sad}','next pasti dapet','peluk {me}','gacha emang jahat','rate off itu biasa, next guaranteed','gw juga {sad}','semangat {me}','istirahat dulu']},
  {id:'pity',re:/pity/,n:[1,2],p:.9,rep:['hard pity {pitymax}, soft mulai {soft}','{pitymax} pasti bintang 3','pity kebawa kok','pity gw {pity} {laugh}','soft pity {soft} {call}']},
  {id:'heroTerbaik',re:/(siapa|hero|best|meta|bagus|kuat|terbaik).*(hero|bagus|kuat|terbaik|meta|tarik)/,n:[1,3],p:.8,
   rep:['{hero} sih menurut gw','{lim} kuat','tergantung tim {me}','{newh} enak buat heal','semua bagus kalau dinaikin','Seraphine aman buat semua','waifu over meta {laugh}']},
  {id:'tarik',re:/(tarik|narik|pull|gacha|summon).*(ga|gak|nggak|tidak|\?|atau)|worth/,n:[1,3],p:.85,
   rep:['tarik aja {me}','nabung dulu','kalau suka tarik','{lim} worth','jangan maksa {me}','gas!','tergantung permata kamu']},
  {id:'elemen',re:/(elemen|api|air|tanah|cahaya|gelap).*(kuat|lemah|kalah|menang|lawan)/,n:[1,2],p:.85,rep:['api > tanah > air > api','cahaya sama gelap saling kuat','unggul elemen damage +30%']},
  {id:'permata',re:/(permata|gems?|diamond|dm)\b/,n:[1,2],p:.8,rep:['misi harian {me}','event sama arena','stage pertama kali dapet permata','kartu bulanan worth','topup {laugh}']},
  {id:'stage',re:/(stuck|nyangkut|susah|ga bisa lewat|gabisa).*(stage|tahap|bos|boss|\d-\d)|\b\d-\d\b/,n:[1,3],p:.85,
   rep:['naikin senjata dulu','farming dungeon','pakai elemen yang unggul','limit break hero utama','CP kamu berapa {me}?','pakai healer {me}','gw dulu juga stuck disitu']},
  {id:'arena',re:/arena|liga|tiket|bertahan|nyerang|serang/,n:[1,3],p:.8,
   rep:['arena kejam','tim bertahan pakai tank','{me} liga apa?','gw di {league}',(c,w,P)=>P.arWin?'@{me} kamu yang nyerang gw tadi ya {laugh}':null,'jangan serang gw ya {me} {laugh}']},
  {id:'topup',re:/(topup|top up|top-up|beli|sultan|kartu bulanan|vip|bayar)/,n:[1,3],p:.8,
   rep:['kartu bulanan paling worth','sultan {me}?','topup dikit gpp','f2p aja {me}',(c)=>c.paid?'gw kemarin topup juga {laugh}':'gw f2p','paket pertama bonus dobel']},
  {id:'cp',re:/\bcp\b|power|kekuatan/,n:[1,3],p:.8,rep:['CP gw {cp}','CP {me} berapa?','{pcp}? lumayan {me}','naikin CP lewat senjata','{top} CP nya gila']},
  {id:'level',re:/\b(level|lv|lvl)\b/,n:[1,2],p:.7,rep:['gw lv {lv}','farming exp di stage terakhir','level naik sendiri kok']},
  {id:'asal',re:/(asal|dari mana|kota|tinggal di|domisili)/,n:[1,3],p:.85,rep:['{city}','gw {city}','{city}, kamu {me}?','dari {city} {call}']},
  {id:'kotaSaya',re:/(aku|gw|gue|saya|w) (dari|di|tinggal di) ([a-z]+)/,n:[1,2],p:.85,rep:['wah {x}!','{x} deket sama gw','{x} panas ga?','salam dari {city} {me}','aku pernah ke {x}'],
   learn:(m,t,x)=>{m.city=x}},
  {id:'favSaya',re:/(favorit|fav|bini|istri|waifu|best girl).*(HERO)|(HERO).*(favorit|fav|bini|istri|waifu|best)/,n:[1,3],p:.9,
   rep:['{x} pilihan bagus','{x} juga favorit gw','selera {me} oke','{x} lucu sih','{x}? hmm {hero} lebih bagus {laugh}'],learn:(m,t,x)=>{m.fav=x}},
  {id:'kabar',re:/(apa kabar|gimana kabar|how are you|kabarnya|lagi apa|lagi ngapain|ngapain)/,n:[1,3],p:.85,
   rep:['baik {me}','lagi farming','lagi gacha {laugh}','baik, kamu?','lagi rebahan','lagi makan {food}','lagi nunggu stamina']},
  {id:'makasih',re:/(makasih|terima kasih|thanks|thx|tq|mksh|arigato)/,n:[1,2],p:.75,rep:['sama2 {me}','sip','santai {call}','yoi','np']},
  {id:'pamit',re:/(bye|dadah|off dulu|tidur dulu|cabut|pamit|duluan|oyasumi|gn\b)/,n:[1,3],p:.8,rep:['bye {me}','dadah {me}','met tidur','hati2 {me}','sampai besok','oyasumi {me}']},
  {id:'salam',re:/^(halo+|hai+|hi+|hello|hey|hy|p|pagi|siang|sore|malam|malem|ohayou|konbanwa|assalamualaikum|permisi|misi)\b/,n:[1,3],p:.9,
   rep:['halo {me}','hai {me}','{greet} {me}','halo, baru on?','yo {me}','hai {call}',(c,w,P)=>P.n>3?'{me} lagi on {laugh}':null,(c,w,P)=>P.city?'halo {me} dari {pcity}':null]},
  {id:'sedih',re:/(sedih|capek|cape|lelah|stres|stress|galau|bete|kesel|kecewa)/,n:[1,2],p:.85,rep:['semangat {me}','istirahat dulu {me}','kenapa {me}?','peluk dulu','main santai aja biar ga stres','semoga besok lebih baik']},
  {id:'senang',re:/(senang|seneng|bahagia|yeay|yey|asik|mantap|mantul|gg)\b/,n:[1,2],p:.6,rep:['mantap {me}','ikut seneng','gg','asik','{laugh}']},
  {id:'pacar',re:/(pacar|jomblo|gebetan|crush|nikah)/,n:[1,2],p:.7,rep:['pacar gw {hero} {laugh}','jomblo, ditemenin gacha','ga usah bahas itu {laugh}','game dulu, pacar nanti']},
  {id:'umur',re:/(umur|usia|berapa tahun|kelas berapa)/,n:[1,1],p:.5,rep:['rahasia {laugh}','udah tua {laugh}','kenapa nanya {me}']},
  {id:'ketawa',re:/(wk|haha|hehe|xixi|lol|lmao|awok|kwk)/,n:[0,2],p:.5,rep:['{laugh}','{laugh}','kenapa ketawa {me}','{laugh} sama']},
  {id:'ya',re:/^(iya|ya|yap|yup|ok|oke|sip|yoi|bener|betul|setuju)\b/,n:[0,1],p:.35,rep:['sip','oke','{laugh}']},
  {id:'tanya',re:/\?$|^(apa|siapa|kapan|kenapa|gimana|bagaimana|dimana|berapa|ada yang|ada yg)\b/,n:[1,2],p:.75,
   rep:['gatau juga {me}','hmm coba tanya yang lain','kurang tau {call}','kayaknya iya','kayaknya ga deh','coba cek di menu','bentar gw cek','pertanyaan bagus {laugh}']},
 ],
 fallback:['{laugh}','iya {me}','hmm','oh gitu','bener juga','lah','terus?','sama','oke','aku juga','wkwk iya','ngomong apa {me} {laugh}','iya kah?','masa sih','hmm bisa jadi','{emo}','nah itu','betul'],
 // pertanyaan balik ke pemain (bot penasaran). k = kunci jawaban yang dicatat
 ask:[{t:'kamu main dari kapan {me}?',k:'lama'},{t:'hero favorit kamu siapa {me}?',k:'fav',if:P=>!P.fav},{t:'CP kamu berapa {me}?',k:'cp'},{t:'udah dapet {lim} {me}?',k:'lim'},
  {t:'asal mana {me}?',k:'city',if:P=>!P.city},{t:'liga arena kamu apa {me}?',k:'liga'},{t:'f2p atau sultan {me}? {laugh}',k:'f2p'}],
 // tanggapan setelah kamu menjawab pertanyaan bot
 ack:{lama:['wah lumayan','sama kayak gw','semangat terus'],fav:['{x} bagus','pilihan oke','{x} lucu'],cp:['lumayan {me}','wih gede','bisa lah naik lagi'],
  lim:['gg','semoga cepet dapet','iri'],city:['{x}! deket','wah {x}','pernah ke {x}'],liga:['mantap','semangat naik'],f2p:['hormat','sama','{laugh}'],any:['oh gitu','oke','sip','{laugh}']},
 // bot memanggilmu duluan (jarang): saat kamu masuk 10 besar, menyerang mereka di Arena, dsb.
 callout:{top:['{me} siapa sih, tiba2 top {prank}','@{me} top {prank}, sultan ya?','{me} CP nya ngeri','@{me} bagi tips dong'],
  newbie:['@{me} baru main ya? semangat','welcome @{me}','@{me} kalau butuh tips tanya aja']},
};
