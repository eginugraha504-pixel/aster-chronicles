/* =====================================================================
   TUTORIAL PEMAIN BARU (bisa dilewati kapan saja)
   Alur: Prolog (cerita) -> pertarungan 1-1 -> cerita 1-1 -> Kotak Surat -> pilih hero ★3 -> Summon x10
         -> Formasi Terbaik -> naik level hero -> lanjut Petualangan.
   S.tut: angka langkah (0 = belum mulai) | 'done'. Pemain lama: dianggap 'done'.
   Tiap langkah: sel = elemen yang disorot, on = [aksi, arg?] yang menyelesaikan langkah,
   back = langkah mundur bila elemen tidak ada (mis. modal ditutup), skip = lewati bila sudah tidak relevan.
   Gelembung dari Noa; tidak memblokir layar (semua tombol tetap bisa diketuk).
   ===================================================================== */
const TUT=[
 null,
 // 1: pertarungan 1-1 (tip di dalam battle)
 {id:'battle',sel:'#bHeroes',in:'battle',t:["Hero menyerang otomatis! Saat kartu hero di bawah menyala penuh, ketuk untuk melepaskan skill.","Heroes attack on their own! When a hero card below is fully charged, tap it to unleash a skill.","英雄は自動で戦います！下のカードが光ったら、タップしてスキル発動！"]},
 // 2: layar hasil -> Peta
 {id:'res',sel:'#bOver [data-act=bexit]',on:['bexit'],t:["Pertarungan selesai! Ketuk Peta untuk kembali.","Battle over! Tap Map to head back.","戦闘終了！「マップ」で戻りましょう。"]},
 // 3..: setelah cerita 1-1
 {id:'home',sel:'#nav [data-arg=home]',on:['go','home'],skip:()=>tab==='home',t:["Kembali ke Beranda dulu, Kapten.","Let's head back Home first, Captain.","まずはホームに戻りましょう、キャプテン。"]},
 {id:'mail',sel:'.md[data-act=mail]',on:['mail'],back:3,skip:()=>!mailPending(),t:["Ada hadiah pemula di Kotak Surat! Ketuk Hadiah.","Starter gifts are waiting in the Mailbox! Tap Gifts.","メールボックスに初心者プレゼントが届いています！「プレゼント」をタップ。"]},
 {id:'mailAll',sel:'[data-act=mailAll]:not([disabled])',on:['mailAll'],back:4,skip:()=>!mailList().some(id=>!S.mail[id].claimed&&mailHasRw(id)&&!mailDef(id).rw.pickHero),t:["Ketuk Klaim Semua!","Tap Claim All!","「すべて受け取る」をタップ！"]},
 {id:'pickOpen',sel:'.mitem[data-arg=starter_pick],#modal [data-act=mail]',on:['mailOpen','starter_pick'],back:4,skip:()=>!S.mail.starter_pick||S.mail.starter_pick.claimed,t:["Sang Ratu memberimu 1 hero ★3 pilihan! Buka suratnya.","The Queen grants you a ★3 hero of your choice! Open the letter.","女王から★3英雄を1人選べるプレゼント！手紙を開こう。"]},
 {id:'pick',sel:'.pickh',on:['mailPick'],back:6,skip:()=>!S.mail.starter_pick||S.mail.starter_pick.claimed,t:["Pilih hero ★3 yang paling kamu suka!","Pick the ★3 hero you like best!","好きな★3英雄を選んでください！"]},
 {id:'summon',sel:'#nav [data-arg=summon]',on:['go','summon'],skip:()=>tab==='summon',t:["Menara Panggilan sudah menyala! Ketuk Summon.","The Summoning Tower is lit! Tap Summon.","召喚の塔が光りました！「召喚」をタップ。"]},
 {id:'pull',sel:'[data-act=pull][data-arg="10"]',on:['pull','10'],back:8,skip:()=>!S.tixH&&S.gems<COST10,t:["Pakai 10 Tiket Hero untuk Summon x10!","Use 10 Hero Tickets for a x10 Summon!","ヒーローチケット10枚で10連召喚！"]},
 {id:'sumClose',sel:'#sfx [data-act=sumClose]',on:['sumClose'],t:["Hero baru bergabung! Ketuk OK kalau sudah puas melihat.","New heroes joined! Tap OK when you're done looking.","新しい仲間が加わりました！見終わったら「OK」をタップ。"],wait:()=>!!(typeof SFXQ!=='undefined'&&SFXQ)},
 {id:'team',sel:'#nav [data-arg=team]',on:['go','team'],skip:()=>tab==='team',t:["Ayo masukkan hero terbaik ke tim. Ketuk Tim.","Let's put your best heroes in the team. Tap Team.","最強のメンバーで編成しよう。「チーム」をタップ。"]},
 {id:'auto',sel:'[data-act=autoTeam]',on:['autoTeam'],back:11,t:["Ketuk Formasi Terbaik — aku yang atur!","Tap Best Formation — I'll arrange it!","「最強編成」をタップ！おまかせください！"]},
 {id:'heroes',sel:'#nav [data-arg=heroes]',on:['go','heroes'],skip:()=>tab==='heroes',t:["Sekarang naikkan level hero. Ketuk Hero.","Now let's level up a hero. Tap Heroes.","次は英雄のレベルを上げよう。「英雄」をタップ。"]},
 {id:'hero',sel:'#screen [data-act=hero]',on:['hero'],back:13,t:["Pilih salah satu hero di timmu.","Choose one of your team's heroes.","チームの英雄を一人選んでください。"]},
 {id:'lvup',sel:'#modal [data-act=lvup5]',on:[['lvup5','lvup']],back:14,t:["Ketuk +5 untuk naik level pakai emas!","Tap +5 to level up with gold!","「+5」でゴールドを使ってレベルアップ！"]},
 {id:'adv',sel:'#nav [data-arg=adv]',on:['go','adv'],t:["Hebat! Timmu makin kuat. Lanjutkan petualangan ke tahap 1-2!","Great! Your team is stronger. Continue the adventure to stage 1-2!","すばらしい！チームが強くなりました。冒険を続けてステージ1-2へ！"],end:1}
];
const tutOn=()=>typeof S.tut==='number'&&S.tut>0&&S.tut<TUT.length;
const TUT_BUSY=()=>tutOn();
function tutBegin(){S.tut=1;save();if(!S.unl.includes('summon'))S.unl.push('summon');if(!S.stages['1-1']){tab='adv';render();startBattle('1-1')}else{S.tut=3;save();tutSync()}}
function tutSkip(){S.tut='done';save();tutSync();if(!S.welcomed)welcome()}
function tutStep(n){S.tut=n;save();setTimeout(tutSync,30)}
function tutText(st){return st.t[typeof SL==='function'?SL():0]}
// dipanggil oleh pengendali klik global setelah aksi dijalankan
function tutAct(a,arg){if(!tutOn())return;const st=TUT[S.tut];if(!st||!st.on)return;
 const acts=[].concat(st.on[0]);if(!acts.includes(a))return;if(st.on[1]!=null&&String(arg).split(':')[0]!==st.on[1])return;
 if(st.end){S.tut='done';save();tutSync();sfx('claim');toast(T('Tutorial selesai! Selamat bertualang, Kapten!'));setTimeout(featCheck,1200);return}
 tutStep(S.tut+1)}
// posisikan sorotan & gelembung; dipanggil setelah render / modal / interval
let TUTEL=null;
function tutSync(){if(!tutOn()){if(TUTEL){TUTEL.remove();TUTEL=null}return}
 let st=TUT[S.tut];
 if(typeof SP!=='undefined'&&SP){if(TUTEL)TUTEL.style.display='none';return}
 // lewati langkah yang sudah tidak relevan
 for(let g=0;g<6&&st&&st.skip&&st.skip();g++){S.tut++;save();st=TUT[S.tut];if(!st){S.tut='done';save();return tutSync()}}
 if(st.in==='battle'&&(!B||$('#bOver').classList.contains('on'))){S.tut=2;save();st=TUT[2]}
 if(st.wait&&!st.wait()){S.tut++;save();st=TUT[S.tut]}
 let tg=[...document.querySelectorAll(st.sel)].find(e=>e.offsetParent!==null||e.getClientRects().length),txt=tutText(st);
 if(!tg&&st.back!=null&&!$('#modal').classList.contains('on')&&!(typeof SFXQ!=='undefined'&&SFXQ)){S.tut=st.back;save();return tutSync()}
 if(!tg&&st.id==='sumClose'){if(TUTEL)TUTEL.style.display='none';return}
 if($('#modal').classList.contains('on')&&(!tg||!tg.closest('#modal'))){const c=document.querySelector('#modal .mrow [data-act=closeModal]')||document.querySelector('#modal .mclose');if(c){tg=c;txt=T('Ketuk di sini untuk menutup jendela ini dulu.')}}
 if(!TUTEL){TUTEL=document.createElement('div');TUTEL.id='tut';TUTEL.innerHTML=`<div class="tring"></div><div class="tbub"><img class="tav" alt=""><p></p><button class="tskip" data-act="tutSkip">${T('Lewati Tutorial')}</button></div>`;document.getElementById('app').appendChild(TUTEL)}
 TUTEL.style.display='';const app=document.getElementById('app').getBoundingClientRect(),ring=TUTEL.querySelector('.tring'),bub=TUTEL.querySelector('.tbub');
 bub.querySelector('p').textContent=txt;bub.querySelector('.tskip').textContent=T('Lewati Tutorial');
 const av=bub.querySelector('.tav');if(!av.src&&HD.noa)av.src=portrait('noa');
 if(tg){const r=tg.getBoundingClientRect();ring.style.display='';Object.assign(ring.style,{left:r.left-app.left-5+'px',top:r.top-app.top-5+'px',width:r.width+10+'px',height:r.height+10+'px'});
  const below=r.top-app.top<app.height*.55;bub.style.top=below?(r.bottom-app.top+16)+'px':'';bub.style.bottom=below?'':(app.bottom-r.top+16)+'px'}
 else{ring.style.display='none';bub.style.top='';bub.style.bottom='120px'}
 TUTEL.classList.toggle('inbattle',!!B)}
setInterval(()=>{try{if(S&&tutOn())tutSync()}catch(e){}},500);
