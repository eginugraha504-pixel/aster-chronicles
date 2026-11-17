/* ukuran hero di beranda: skala bulat agar piksel tetap tajam (sprite 44px × skala) */
let LOBBY_SCALE=4,LOBBY_PX=176;
// layar pendek (iPhone SE dsb) pakai skala 3 agar tidak tertutup tombol
function lobbyFit(){const h=($('#screen')&&$('#screen').clientHeight)||innerHeight;LOBBY_SCALE=h<600?3:4;LOBBY_PX=44*LOBBY_SCALE}
/* =====================================================================
   BERANDA (rombak UI v2, 18 Nov 2026) — karakter besar di tengah, banner pick-up,
   medali samping (kiri: Event/Misi/Hadiah/Toko · kanan: CP/Tim/Peringkat/Guild 🔒/Menu),
   papan nama hero, ticker obrolan, dok bawah (ubin Arena · medali Petualangan · ubin Event). Gaya: css/ui2.css
   ===================================================================== */
const LINES=['Hari yang cerah untuk berpetualang!','Ayo selamatkan Aster dari kegelapan!','Aku siap bertarung, Kapten!','Sudah cek misi harian hari ini?','Konon ada hero bercahaya di portal summon...','Jangan lupa naikkan level kami, ya!','Elemen Api kuat melawan Tanah, lho.','Cahaya dan Gelap saling melemahkan!','Kotak Surat sudah dicek belum?'];
function nextStage(){return SLIST.find(st=>!S.stages[st.key])||SLIST[SLIST.length-1]}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const homeList=()=>Object.keys(S.heroes).sort((a,b)=>HD[b].r-HD[a].r||heroPow(b)-heroPow(a));
function homeHero(){if(!S.homeHero||!S.heroes[S.homeHero])S.homeHero=S.team.find(Boolean)||homeList()[0];return S.homeHero}
// gelembung dialog: tersembunyi; idle = muncul sendiri pada jeda acak (1–3 menit), sentuh = dialog "diganggu" (poke) sesuai karakter
const HB={next:Date.now()+8e3+Math.random()*7e3,hide:0,txt:'',id:null,last:''};
// dialog + kunci klip suara (systems/voice.js): {t:teks sesuai bahasa UI, k:kunci klip Jepang atau null}
const heroLineV=id=>{const L=HD[id].lines;if(L&&L.length&&Math.random()<.7){const i=Math.floor(Math.random()*L.length);return {t:L[i],k:`${id}_l${i}`}}return {t:T(pick(LINES)),k:null}};
const heroPoke=id=>{const L=HD[id].poke;if(!L||!L.length)return heroLineV(id);let i,t;for(let n=0;n<4&&(!t||t===HB.last);n++){i=Math.floor(Math.random()*L.length);t=L[i]}return {t,k:`${id}_p${i}`}};
function bubbleShow(id,txt,ms){const sp=$('.hspeech'),b=$('#bubble');HB.id=id;HB.txt=txt;HB.last=txt;HB.hide=Date.now()+ms;if(!sp||!b)return;b.textContent=txt;sp.classList.add('on');b.style.animation='none';void b.offsetWidth;b.style.animation='';lobbyPlace()}
function bubbleHide(){HB.hide=0;const sp=$('.hspeech');if(sp)sp.classList.remove('on')}
const bubbleMs=t=>Math.min(7000,3200+t.length*45);
let banIdx=0;
function banHTML(){const b=BANNERS[banIdx%BANNERS.length];
 const art=b.weapon?(b.rateUp?`<img class="px bw" src="${weaponIcon(b.rateUp).url}">`:`<span class="bhs">${bannerPool(b,3).slice(0,3).map(w=>`<img class="px" src="${weaponIcon(w.id).url}">`).join('')}</span>`):b.rateUp?`<img class="px bh2" src="${portrait(b.rateUp)}">`:`<span class="bhs">${(b.show||[]).slice(0,3).map(id=>`<img class="px" src="${portrait(id)}">`).join('')}</span>`;
 return`<span class="btag">${b.weapon?T('SENJATA'):b.rateUp?'PICK UP':T('STANDAR')}</span><small>${T('Panggilan')}</small><b class="ot">${b.sn}</b>${art}<span class="bdots">${BANNERS.map((_,i)=>`<i class="${i===banIdx%BANNERS.length?'on':''}"></i>`).join('')}</span>`}
function homeHTML(){const ns=nextStage(),id=homeHero(),h=HD[id],mdot=missionClaimable(),mp=mailPending(),edot=anyEvClaimable(),A=arCheck();
 // medali samping: cincin emas + pita nama (aset img/ui/n_medal, n_ribbon)
 const md=(act,arg,icon,label,dot,cls='')=>`<button class="md${cls}" data-act="${act}"${arg?` data-arg="${arg}"`:''}><span class="mdi"><img class="ix" src="${icon}" alt=""></span><span class="mdl">${label}</span>${dot}</button>`;
 const many=homeList().length>1;
 return`<div class="home">
 ${homeArt()?`<img class="hbg art" src="${BGIMG_SRC[homeArt()]}" alt="">`:`<canvas class="hbg" id="hbgc" width="${HOME_W}" height="${HOME_H}"></canvas>`}<div class="hfx"></div>
 <div class="hbanw"><button class="harrs l" data-act="banStep" data-arg="-1" aria-label="‹"></button><button class="hban" id="hban" data-act="banGo">${banHTML()}</button><button class="harrs r" data-act="banStep" data-arg="1" aria-label="›"></button></div>
 <div class="rcol l">${md('goEvent','',ICON.event,T('Event'),edot?'<i class="dot"></i>':'')}${md('go','mission',ICON.mission,T('Misi'),mdot?'<i class="dot"></i>':'')}${md('mail','',ICON.gift,T('Hadiah'),mp?`<i class="dot n">${mp}</i>`:'')}${md('shop','',ICON.shop,T('Toko'),'')}</div>
 <div class="rcol r"><button class="cpb" data-act="cpInfo"><span>${T('CP TIM')}</span><b>${fmt(teamPow())}</b></button>${md('go','team',ICON.team,T('Tim'),'')}${md('rank','',ICON.rank,T('Peringkat'),'')}${md('guild','',ICON.guild||ICON.team,T('Guild'),`<span class="mdlk"><img class="ix" src="${ICON.lock}" alt=""></span><em class="mdsoon">${T('Segera')}</em>`,' lock')}${md('settings','',ICON.gear,T('Menu'),'')}</div>
 ${splash(id)?`<div class="hstage hsp" data-act="lobbyTap"><div class="hcircle"><i></i></div>${splashHTML(id,'hspl')}</div>`:`<div class="hstage"><div class="hcircle"><i></i></div><canvas id="lobbyc" width="${LOBBY_PX}" height="${LOBBY_PX}" data-act="lobbyTap"></canvas></div>`}
 <div class="hnp">${many?`<button class="hnpa l" data-act="homeStep" data-arg="-1" aria-label="‹"></button>`:''}<span class="hnpc"><i class="hnps">${stars(S.heroes[id]?heroStar(id):h.r)}</i><span class="hnpn">${eic(h.el,16)}<b>${h.name}</b></span></span>${many?`<button class="hnpa r" data-act="homeStep" data-arg="1" aria-label="›"></button>`:''}</div>
 <div class="hspeech${HB.hide>Date.now()&&HB.id===id?' on':''}"><p id="bubble">${HB.hide>Date.now()&&HB.id===id?HB.txt:''}</p></div>
 <button class="hchat" id="hchat" data-act="chat">${typeof chatStripHTML==='function'?chatStripHTML():''}</button>
 <div class="hbtm">
  <button class="htile ar" data-act="arena"><span class="hta" style="background-image:var(--ui-n-artarena)"></span><small class="htt">${ic('arena',13)} ${A.tix}/${ARENA_CFG.tix}</small><b>${T('ARENA')}</b>${A.tix>0||A.unseen?'<i class="dot"></i>':''}</button>
  <button class="hmed" data-act="go" data-arg="adv"><span class="hmr"></span><img class="ix" src="${ICON.adv}" alt=""><b>${T('PETUALANGAN')}</b><small>${ns.key} · ${ns.name}</small></button>
  <button class="htile ev" data-act="goEvent"><span class="hta" style="background-image:var(--ui-n-artevent)"></span><small class="htt">${T('{n} aktif',{n:EVENTS.filter(evActive).length})}</small><b>${T('EVENT')}</b>${edot?'<i class="dot"></i>':''}</button>
 </div></div>`}
let lobby=null;
// latar beranda ilustrasi: versi senja jam 17.00–04.59 (jam perangkat), selain itu versi siang
function homeArt(){const h=new Date().getHours(),k=(h>=17||h<5)&&hasBgArt('home_eve')?'home_eve':'home_day';return hasBgArt(k)?k:null}
function initLobby(){const cv=$('#lobbyc'),st=$('.hstage');if(!st)return;lobbyPlace();const bc=$('#hbgc');lobby={cv,st,g:cv&&cv.getContext('2d'),bg:bc&&bc.getContext('2d'),id:homeHero(),t:0,jump:0,happy:0,banT:0};if(lobby.bg)drawHomeScene(lobby.bg,0)}
function drawLobby(dt){const L=lobby;if(!L||!L.st.isConnected){lobby=null;return}L.t+=dt;
 {const now=Date.now();if(HB.hide&&now>HB.hide)bubbleHide();if(!HB.hide&&now>HB.next){const v=heroLineV(L.id);bubbleShow(L.id,v.t,bubbleMs(v.t));if(v.k)voice(v.k);HB.next=now+6e4+Math.random()*12e4}}
 L.banT+=dt;if(L.banT>4.5){L.banT=0;banIdx=(banIdx+1)%BANNERS.length;const e=$('#hban');if(e)e.innerHTML=banHTML()}
 if(L.bg)drawHomeScene(L.bg,L.t);
 const g=L.g;if(!g)return;g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,LOBBY_PX,LOBBY_PX);g.imageSmoothingEnabled=false;
 if(L.jump>0)L.jump-=dt;if(L.happy>0)L.happy-=dt;
 const A=HERO_ART[L.id].anims,tot=A.idle.reduce((s,a)=>s+a.d,0);let f=animFrame(A.idle,(L.t*1000)%tot)||{};
 if(L.happy>0)f={face:'happy',ahoge:1};
 const k=LOBBY_SCALE,jy=L.jump>0?Math.round(Math.sin(L.jump/.45*Math.PI)*2.4)*k:0;
 g.fillStyle='rgba(40,20,10,.28)';g.beginPath();g.ellipse(22*k,39.6*k,10.3*k-jy,1.7*k,0,0,Math.PI*2);g.fill();
 {const cc=artFrame(L.id,f).c;g.drawImage(cc,0,0,cc.width,cc.height,0,-k-jy,LOBBY_PX,LOBBY_PX)}}
function homeTap(){if(!lobby)return;lobby.jump=.45;lobby.happy=1.2;sfx('tap');const hs=$('.hspl');if(hs){hs.classList.remove('hop');void hs.offsetWidth;hs.classList.add('hop')}
 const v=heroPoke(lobby.id);bubbleShow(lobby.id,v.t,bubbleMs(v.t));if(v.k)voice(v.k);HB.next=Math.max(HB.next,Date.now()+6e4+Math.random()*6e4)}
function homeStep(d){const L=homeList();if(L.length<2)return;S.homeHero=L[(L.indexOf(homeHero())+(+d)+L.length)%L.length];save();render()}

/* ================= TIM ================= */
function teamHTML(){const t=teamCP();
 const slot=i=>{const id=S.team[i];if(!id)return`<button class="tslot empty" data-act="slot" data-arg="${i}"><span class="ph">+</span><small>${T('Pilih hero')}</small></button>`;
  const h=HD[id],o=S.heroes[id],w=wpnOf(id);
  return`<button class="tslot r${heroStar(id)}" data-act="slot" data-arg="${i}">${i===0?`<span class="crown">${T('LEADER')}</span>`:''}${eic(h.el,14)}<img class="px sp" src="${sprite(h.spr).url}">${w?`<img class="px tw" src="${weaponIcon(w.id).url}">`:''}<span class="tinfo"><b>${h.name}</b><small>Lv${o.lv} · ${ROLE[h.role].n}</small><em>CP ${fmt(heroPow(id))}</em></span></button>`};
 return`<h2 class="st">${T('Formasi Tim')} <span>${t.ids.length}/4 ${T('hero')}</span></h2>
 <button class="panel tcp" data-act="cpInfo"><span class="lbl">${T('CP TIM')}</span><b class="ot">${fmt(t.total)}</b><span class="tb">${t.parts.length?t.parts.map(([n,b])=>`<i>${n} +${Math.round(b*100)}%</i>`).join(''):`<i class="no">${T('Belum ada bonus tim')}</i>`}</span></button>
 <div class="row2"><span class="rowlbl">${T('Barisan Depan')}</span><span class="rowlbl">${T('Barisan Belakang')}</span></div>
 <div class="tslots">${[0,1,2,3].map(slot).join('')}</div>
 <div class="mrow"><button class="btn green" data-act="autoTeam">${T('Formasi Terbaik')}</button><button class="btn" data-act="eqBest">${T('Pasang Terbaik')}</button><button class="btn blue" data-act="go" data-arg="heroes">${T('Koleksi Hero')}</button></div>
 <div class="eqauto"><button class="fbtn ${S.autoEq!==false?'on':''}" data-act="eqAutoT">${S.autoEq!==false?'✓':'✗'} ${T('Pasang otomatis saat dapat barang baru')}</button><button class="fbtn" data-act="smelt"><img class="px" src="${ICON.smelt}"> ${T('Peleburan')}</button></div>
 <div class="panel tips"><b>${T('Bonus CP Tim')}</b><ul><li>${T('2 / 3 / 4 hero elemen sama: +5% / +10% / +15%')}</li><li>${T('Ada Penjaga + Pendukung: +{n}%',{n:Math.round(CP_BONUS.balance*100)})}</li><li>${T('Tim lengkap 4 hero: +3%')}</li><li>${T('Tiap senjata signature dipakai pemiliknya: +2%')}</li></ul><small>${T('Penjaga & Petarung otomatis maju ke barisan depan saat bertarung. CP tim juga dipakai untuk pencocokan lawan di Arena.')}</small></div>`}
function bestTeam(){const ids=Object.keys(S.heroes);let best=null,bv=-1;const n=ids.length,k=Math.min(4,n);
 const rec=(st,cur)=>{if(cur.length===k){const v=teamCP(cur).total;if(v>bv){bv=v;best=cur.slice()}return}for(let i=st;i<n;i++){cur.push(ids[i]);rec(i+1,cur);cur.pop()}};rec(0,[]);
 best.sort((a,b)=>{const f=r=>['tanker','warrior'].includes(HD[r].role)?0:1;return f(a)-f(b)||heroPow(b)-heroPow(a)});while(best.length<4)best.push(null);return best}
// letakkan hero tepat di atas tombol bawah & gelembung di atas kepala hero (dihitung dari ukuran layar sebenarnya)
function lobbyPlace(){const st=$('.hstage'),cv=$('#lobbyc'),np=$('.hnp'),sp=$('.hspeech'),root=st&&st.offsetParent;if(!st||!root)return;
 const rb=root.getBoundingClientRect(),bw=$('.hbanw'),foot=(np?np.getBoundingClientRect().top:rb.bottom-200)-rb.top+14;
 if(!cv){// mode splash: karakter dari bawah banner sampai papan nama (kaki sedikit di balik papan nama)
  const img=st.querySelector('.spl');if(img&&!img.complete)img.addEventListener('load',()=>lobbyPlace(),{once:true});
  const ar=img&&img.naturalWidth?img.naturalWidth/img.naturalHeight:.74,ceil=(bw?bw.getBoundingClientRect().bottom-rb.top:110)+4;
  let H=Math.round(foot-ceil);H=Math.max(220,Math.min(620,H));const W=Math.round(H*ar);
  Object.assign(st.style,{width:W+'px',height:H+'px',marginLeft:(-W/2)+'px',bottom:Math.round(rb.height-foot)+'px'})}
 else{lobbyFit();if(cv.width!==LOBBY_PX){cv.width=cv.height=LOBBY_PX}
  st.style.width=st.style.height=cv.style.width=cv.style.height=LOBBY_PX+'px';st.style.marginLeft=(-LOBBY_PX/2)+'px';st.style.bottom=Math.round(rb.height-foot+6)+'px'}
 // gelembung: di atas papan nama, sedikit ke kiri, ekor menunjuk ke karakter
 if(sp){const sw=Math.round(Math.min(rb.width-150,230));Object.assign(sp.style,{width:sw+'px',left:'74px',bottom:Math.round(rb.height-foot+40)+'px'})}}
addEventListener('resize',()=>{if(lobby)lobbyPlace()});
// Guild: masih terkunci (fitur berikutnya) — tombol sudah ada di beranda
function openGuild(){sfx('deny');modal(`<button class="btn red mclose" data-act="closeModal">✕</button><h3>${T('Guild')}</h3>
 <div class="guildsoon"><div class="gsart"><img class="px" src="${ICON.crest||ICON.guild||ICON.team}" alt=""><span class="gslk"><img class="ix" src="${ICON.lock}" alt=""></span></div>
 <b>${T('Segera Hadir')}</b><p>${T('Aula Guild sedang dibangun. Nanti kamu bisa bergabung dengan ksatria lain dan bertualang bersama.')}</p></div>
 <div class="mrow"><button class="btn blue" data-act="closeModal">${T('Oke')}</button></div>`)}

