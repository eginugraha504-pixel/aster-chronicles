/* ukuran hero di beranda: skala bulat agar piksel tetap tajam (sprite 44px × skala) */
let LOBBY_SCALE=4,LOBBY_PX=176;
// layar pendek (iPhone SE dsb) pakai skala 3 agar tidak tertutup tombol
function lobbyFit(){const h=($('#screen')&&$('#screen').clientHeight)||innerHeight;LOBBY_SCALE=h<600?3:4;LOBBY_PX=44*LOBBY_SCALE}
/* =====================================================================
   BERANDA — karakter besar di tengah, banner pick-up, tombol samping,
   3 tombol utama (Arena · Petualangan · Event)
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
function homeHTML(){const ns=nextStage(),id=homeHero(),h=HD[id],mdot=missionClaimable(),mp=mailPending(),edot=anyEvClaimable();
 const rb=(act,icon,label,dot,arg)=>`<button class="rb" data-act="${act}"${arg?` data-arg="${arg}"`:''}><span class="rbi">${icon}</span><span class="rbl ot">${label}</span>${dot}</button>`;
 return`<div class="home">
 ${homeArt()?`<img class="hbg art" src="${BGIMG_SRC[homeArt()]}" alt="">`:`<canvas class="hbg" id="hbgc" width="${HOME_W}" height="${HOME_H}"></canvas>`}<div class="hfx"></div>
 <div class="hbanw"><button class="harrs" data-act="banStep" data-arg="-1">‹</button><button class="hban" id="hban" data-act="banGo">${banHTML()}</button><button class="harrs" data-act="banStep" data-arg="1">›</button></div>
 <div class="rcol l">${rb('goEvent',`<img class="ix" src="${ICON.event}">`,T('Event'),edot?'<i class="dot"></i>':'')}${rb('go',`<img class="ix" src="${ICON.mission}">`,T('Misi'),mdot?'<i class="dot"></i>':'','mission')}${rb('mail',`<img class="ix" src="${ICON.gift}">`,T('Hadiah'),mp?`<i class="dot n">${mp}</i>`:'')}${rb('shop',`<img class="ix" src="${ICON.shop}">`,T('Toko'),'')}</div>
 <div class="rcol r"><button class="cpb" data-act="cpInfo"><span>${T('CP TIM')}</span><b class="ot">${fmt(teamPow())}</b></button>${rb('go',`<img class="ix" src="${ICON.team}">`,T('Tim'),'','team')}${rb('rank',`<img class="ix" src="${ICON.rank}">`,T('Peringkat'),'')}${rb('settings',`<img class="ix" src="${ICON.gear}">`,T('Menu'),'')}</div>
 ${homeList().length>1?`<button class="harr l" data-act="homeStep" data-arg="-1">‹</button><button class="harr r" data-act="homeStep" data-arg="1">›</button>`:''}
 ${splash(id)?`<div class="hstage hsp" data-act="lobbyTap"><div class="hcircle"></div>${splashHTML(id,'hspl')}</div>`:`<div class="hstage"><div class="hcircle"></div><canvas id="lobbyc" width="${LOBBY_PX}" height="${LOBBY_PX}" data-act="lobbyTap"></canvas></div>`}
 <div class="hspeech${HB.hide>Date.now()&&HB.id===id?' on':''}"><p id="bubble">${HB.hide>Date.now()&&HB.id===id?HB.txt:''}</p><span class="hname"><i>${stars(h.r)}</i>${h.name}</span></div>
 <button class="hchat" id="hchat" data-act="chat">${typeof chatStripHTML==='function'?chatStripHTML():''}</button>
 <div class="hbtm">
  ${(()=>{const A=arCheck();return`<button class="hplate ar" data-act="arena"><span class="hpi"><img class="ix" src="${ICON.arena}"></span><b class="ot">${T('ARENA')}</b><small>${T('Tiket {a}/{b}',{a:A.tix,b:ARENA_CFG.tix})}</small>${A.tix>0||A.unseen?'<i class="dot"></i>':''}</button>`})()}
  <button class="hmed" data-act="go" data-arg="adv"><span class="hmr"></span><img class="ix" src="${ICON.adv}"><b class="ot">${T('PETUALANGAN')}</b><small>${ns.key} · ${ns.name}</small></button>
  <button class="hplate ev" data-act="goEvent"><span class="hpi"><img class="ix" src="${ICON.event}"></span><b class="ot">${T('EVENT')}</b><small>${T('{n} aktif',{n:EVENTS.filter(evActive).length})}</small>${edot?'<i class="dot"></i>':''}</button>
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
  return`<button class="tslot r${h.r}" data-act="slot" data-arg="${i}">${i===0?`<span class="crown">${T('LEADER')}</span>`:''}${eic(h.el,14)}<img class="px sp" src="${sprite(h.spr).url}">${w?`<img class="px tw" src="${weaponIcon(w.id).url}">`:''}<span class="tinfo"><b>${h.name}</b><small>Lv${o.lv} · ${ROLE[h.role].n}</small><em>CP ${fmt(heroPow(id))}</em></span></button>`};
 return`<h2 class="st">${T('Formasi Tim')} <span>${t.ids.length}/4 ${T('hero')}</span></h2>
 <button class="panel tcp" data-act="cpInfo"><span class="lbl">${T('CP TIM')}</span><b class="ot">${fmt(t.total)}</b><span class="tb">${t.parts.length?t.parts.map(([n,b])=>`<i>${n} +${Math.round(b*100)}%</i>`).join(''):`<i class="no">${T('Belum ada bonus tim')}</i>`}</span></button>
 <div class="row2"><span class="rowlbl">${T('Barisan Depan')}</span><span class="rowlbl">${T('Barisan Belakang')}</span></div>
 <div class="tslots">${[0,1,2,3].map(slot).join('')}</div>
 <div class="mrow"><button class="btn green" data-act="autoTeam">${T('Formasi Terbaik')}</button><button class="btn blue" data-act="go" data-arg="heroes">${T('Koleksi Hero')}</button></div>
 <div class="panel tips"><b>${T('Bonus CP Tim')}</b><ul><li>${T('2 / 3 / 4 hero elemen sama: +5% / +10% / +15%')}</li><li>${T('Ada Penjaga + Pendukung: +5%')}</li><li>${T('Tim lengkap 4 hero: +3%')}</li><li>${T('Tiap senjata signature dipakai pemiliknya: +2%')}</li></ul><small>${T('Penjaga & Petarung otomatis maju ke barisan depan saat bertarung. CP tim juga dipakai untuk pencocokan lawan di Arena.')}</small></div>`}
function bestTeam(){const ids=Object.keys(S.heroes);let best=null,bv=-1;const n=ids.length,k=Math.min(4,n);
 const rec=(st,cur)=>{if(cur.length===k){const v=teamCP(cur).total;if(v>bv){bv=v;best=cur.slice()}return}for(let i=st;i<n;i++){cur.push(ids[i]);rec(i+1,cur);cur.pop()}};rec(0,[]);
 best.sort((a,b)=>{const f=r=>['tanker','warrior'].includes(HD[r].role)?0:1;return f(a)-f(b)||heroPow(b)-heroPow(a)});while(best.length<4)best.push(null);return best}
// letakkan hero tepat di atas tombol bawah & gelembung di atas kepala hero (dihitung dari ukuran layar sebenarnya)
function lobbyPlace(){const st=$('.hstage'),cv=$('#lobbyc'),hb=$('.hbtm'),hm=$('.hmed'),sp=$('.hspeech'),root=st&&st.offsetParent;if(!st||!root)return;
 if(!cv){// mode splash: karakter dari bawah banner sampai (sedikit di balik) tombol bawah; gelembung di bawah, tepat di atas tombol Petualangan
  const rb=root.getBoundingClientRect(),bw=$('.hbanw'),img=st.querySelector('.spl');
  if(img&&!img.complete)img.addEventListener('load',()=>lobbyPlace(),{once:true});
  const ar=img&&img.naturalWidth?img.naturalWidth/img.naturalHeight:.74;
  const btop=Math.min(...[hb,hm].filter(Boolean).map(e=>e.getBoundingClientRect().top))-rb.top,ceil=(bw?bw.getBoundingClientRect().bottom-rb.top:110)+10;
  const SINK=.1;let H=Math.round((btop-ceil)/(1-SINK));H=Math.max(240,Math.min(Math.min(600,Math.round(rb.height*.7)),H));
  const foot=Math.round(btop+H*SINK),W=Math.round(H*ar);
  Object.assign(st.style,{width:W+'px',height:H+'px',marginLeft:(-W/2)+'px',bottom:Math.round(rb.height-foot)+'px'});
  if(sp){sp.classList.add('hsp');sp.classList.remove('sm');sp.style.right='';sp.style.top='';
   const mt=hm?hm.getBoundingClientRect().top-rb.top:btop,sw=Math.round(Math.min(rb.width-128,280));
   Object.assign(sp.style,{width:sw+'px',left:Math.round((rb.width-sw)/2)+'px',bottom:Math.round(rb.height-mt+12)+'px'})}
  return}
 if(sp){sp.classList.remove('hsp');sp.style.left=sp.style.top=sp.style.width='';sp.style.bottom=''}
 lobbyFit();if(cv.width!==LOBBY_PX){cv.width=cv.height=LOBBY_PX}
 st.style.width=st.style.height=cv.style.width=cv.style.height=LOBBY_PX+'px';st.style.marginLeft=(-LOBBY_PX/2)+'px';
 const rb=root.getBoundingClientRect(),top=Math.min(...[hb,hm].filter(Boolean).map(e=>e.getBoundingClientRect().top));
 const bottom=Math.max(110,Math.round(rb.bottom-top-LOBBY_PX*.12));st.style.bottom=bottom+'px';if(sp){const small=LOBBY_SCALE<4;sp.classList.toggle('sm',small);sp.style.bottom=Math.round(bottom+LOBBY_PX*(small?.12:.62))+'px'}}
addEventListener('resize',()=>{if(lobby)lobbyPlace()});
