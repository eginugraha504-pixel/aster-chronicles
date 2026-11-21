/* =====================================================================
   SYARAT BUKA FITUR — tiap fitur terbuka setelah tahap cerita tertentu (st) atau level akun (lv)
   Ubah angka di FEAT. Saat syarat pertama kali terpenuhi muncul popup "Fitur Baru Terbuka!" (sekali saja, S.unl).
   Pemain lama: fitur yang sudah memenuhi syarat dianggap sudah terbuka tanpa popup (lihat featInit).
   ===================================================================== */
const FEAT={
 summon:{st:'1-1',icon:'summon',n:['Summon','Summon','召喚'],d:['Panggil hero & senjata baru dengan tiket atau permata.','Summon new heroes and weapons with tickets or gems.','チケットやジェムで新たな英雄と武器を召喚しよう。']},
 mission:{st:'1-2',icon:'mission',n:['Misi','Missions','ミッション'],d:['Selesaikan misi harian & pencapaian untuk hadiah.','Complete daily missions and achievements for rewards.','デイリーミッションと実績で報酬をゲット。']},
 event:{st:'1-2',icon:'event',n:['Event','Events','イベント'],d:['Hadiah login & event terbatas waktu.','Login rewards and limited-time events.','ログインボーナスと期間限定イベント。']},
 shop:{st:'1-3',icon:'shop',n:['Toko','Shop','ショップ'],d:['Tukar emas & lencana dengan barang berguna.','Trade gold and badges for useful items.','ゴールドやバッジで便利なアイテムと交換。']},
 chat:{lv:3,icon:'wchat',n:['Obrolan Dunia','World Chat','ワールドチャット'],d:['Sekarang kamu bisa mengirim pesan di Obrolan Dunia.','You can now send messages in World Chat.','ワールドチャットで発言できるようになりました。']},  // menu obrolan selalu bisa dibuka; yang terkunci hanya mengirim pesan
 dungeon:{st:'1-5',icon:'pick',n:['Dungeon','Dungeons','ダンジョン'],d:['Material senjata, emas & bahan kebangkitan. 5 tiket per jenis per hari.','Weapon materials, gold and ascension items. 5 tickets per type each day.','武器素材・ゴールド・覚醒素材。種類ごとに1日5枚のチケット。']},
 rank:{lv:5,icon:'rank',n:['Peringkat','Rankings','ランキング'],d:['Bandingkan kekuatanmu dengan kapten lain.','Compare your power with other captains.','他のキャプテンと戦力を比べよう。']},
 smelt:{lv:8,icon:'smelt',n:['Peleburan','Smelting','精錬'],d:['Lebur salinan senjata & perlengkapan jadi material.','Smelt spare weapons and gear into materials.','余った武器や装備を素材に変えよう。']},
 wb:{lv:8,icon:'wb',n:['Bos Dunia','World Boss','ワールドボス'],d:['Naga raksasa muncul 4× sehari. Serang bersama semua pemain, rebut peringkat damage!','A giant dragon appears 4 times a day. Attack it with everyone and climb the damage ranking!','巨大な竜が1日4回出現。全員で挑み、ダメージランキング上位を目指せ！']},
 arena:{lv:10,icon:'arena',n:['Arena','Arena','アリーナ'],d:['Adu tim melawan kapten lain dan naik liga!','Battle other captains\' teams and climb the leagues!','他のキャプテンと対戦してリーグを駆け上がれ！']},
 guild:{lv:12,icon:'guild',n:['Guild','Guild','ギルド'],d:['Bergabung atau dirikan guild: absen harian, donasi, toko koin guild, peringkat guild — dan politiknya!','Join or found a guild: daily check-in, donations, guild coin shop, guild rankings — and its politics!','ギルドに加入・設立：毎日の出席、寄付、ギルドショップ、ギルドランキング、そして政治も！']}
};
const featOK=k=>{const f=FEAT[k];if(!f)return true;if(typeof gmOpt==='function'&&gmOpt('unl'))return true;if(f.st&&!S.stages[f.st])return false;if(f.lv&&S.lv<f.lv)return false;return true};
const featName=k=>FEAT[k].n[typeof SL==='function'?SL():0];
function featReq(k){const f=FEAT[k];return f.st?T('Selesaikan tahap {k} untuk membuka',{k:f.st}):T('Terbuka di Lv {n} akun',{n:f.lv})}
function featInit(){if(!Array.isArray(S.unl))S.unl=Object.keys(FEAT).filter(featOK)}
// fitur yang baru saja memenuhi syarat (belum pernah diumumkan)
const featNew=()=>Object.keys(FEAT).filter(k=>featOK(k)&&!S.unl.includes(k));
// aksi tombol -> fitur (dipakai pengecek klik global di actions.js)
function featOfAct(a,arg){if(a==='go')return arg==='summon'?'summon':arg==='mission'?'mission':arg==='arena'?'arena':null;
 return{goEvent:'event',shop:'shop',goDg:'dungeon',advDg:'dungeon',arena:'arena',rank:'rank',smelt:'smelt',goSummon:'summon',goWpnBanner:'summon',guild:'guild'}[a]||(a==='advMode'&&arg==='dg'?'dungeon':null)}
function featDeny(k){if(typeof sfx==='function')sfx('deny');toast(`${ic('lock',14)} ${esc(featName(k))}: ${esc(featReq(k))}`,0,true)}
// popup fitur baru (antre bila sedang bertarung / cerita / modal terbuka)
function featCheck(){if(!S||!Array.isArray(S.unl))return;if(B||(typeof SP!=='undefined'&&SP)||document.getElementById('login').classList.contains('on')||$('#modal').classList.contains('on')||(typeof TUT_BUSY==='function'&&TUT_BUSY()))return;
 const n=featNew();if(!n.length)return;const k=n[0];S.unl.push(k);save();const f=FEAT[k];if(typeof sfx==='function')sfx('rare');
 const go=({summon:'go:summon',mission:'go:mission',event:'goEvent:',shop:'shop:',chat:'chat:',dungeon:'goDg:',rank:'rank:',smelt:'smelt:',arena:'arena:',wb:'wbPanel:'}[k]||'closeModal:').split(':');
 modal(`<div class="funl"><div class="funr"></div><small>${T('FITUR BARU TERBUKA!')}</small><span class="funi"><img class="ix" src="${ICON[f.icon]||ICON.lock}" alt=""></span><b>${featName(k)}</b><p>${f.d[typeof SL==='function'?SL():0]}</p></div>
  <div class="mrow"><button class="btn gray" data-act="closeModal">${T('Nanti')}</button><button class="btn green" data-act="featGo" data-arg="${go[0]}:${go[1]||''}">${T('Lihat Sekarang')}</button></div>`)}
