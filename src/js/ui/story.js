/* =====================================================================
   PEMUTAR CERITA (visual novel) — data di js/data/story.js
   - storyPlay(id, selesai)   : putar satu adegan (layar penuh, di atas semua layar)
   - storyPre(key, lanjut)    : dipanggil startBattle() sebelum tahap; true = adegan 'pre' diputar dulu
   - storyPostFor(key)        : dipanggil endBattle() saat menang PERTAMA kali -> adegan 'post' ditunda (S.story.pend)
   - storyFlush(lanjut)       : putar adegan tertunda (saat layar hasil ditutup), lalu lanjut
   - openStoryArchive()       : daftar adegan untuk ditonton ulang (Petualangan > tombol Cerita)
   Aset dimuat dari folder story/ di samping index.html (STORY_ASSET dibuat build.py).
   Ketuk = teks berikutnya · AUTO = jalan sendiri · LOG = riwayat · LEWATI = akhiri adegan.
   ===================================================================== */
const SL=()=>LANG==='en'?1:LANG==='ja'?2:0;           // indeks bahasa pada baris cerita (id/en/ja)
const stTx=l=>l[2+SL()]||l[2];
const stHas=p=>typeof STORY_ASSET!=='undefined'&&STORY_ASSET.f.includes(p);
const stUrl=p=>'story/'+p+(p.startsWith('v/')?'.mp3':'.webp');
function storyState(){if(!S.story||typeof S.story!=='object')S.story={seen:{},pend:null};if(!S.story.seen)S.story.seen={};return S.story}
const storySeen=id=>!!storyState().seen[id];
const scenesAt=(key,when)=>STORY.filter(s=>s.at===key&&s.when===when);
let SP=null;   // adegan yang sedang diputar
function storyPre(key,go){const s=scenesAt(key,'pre').find(x=>!storySeen(x.id));if(!s||S.stages[key])return false;storyPlay(s.id,go);return true}
function storyPostFor(key){const s=scenesAt(key,'post').find(x=>!storySeen(x.id));if(s){storyState().pend=s.id;save()}}
function storyFlush(go){const st=storyState(),id=st.pend;if(!id||!STD[id]||storySeen(id)){st.pend=null;go&&go();return false}storyPlay(id,go);return true}
function stName(sp){if(HD[sp])return HD[sp].name;const n=STORY_NPC[sp];return n?n.n[SL()]:''}
// gambar tokoh: hero = splash (SPLASH_SRC) + patch ekspresi; NPC = story/npc/<id>.webp
function stCharHTML(sp,e){
 // tachie berdiri live2d (hero) / NPC ber-rig: lihat l2dStory di art/live2d.js; <img> = cadangan tanpa WebGL
 const R=STORY_ASSET.tc&&STORY_ASSET.tc[sp];
 if(R&&(R.npc?stHas('npc/'+sp):stHas('tc/'+sp))){const ks=(1100/R.h)*(R.npc?1:.92);
  return`<div class="sch tc${R.npc?' np':''}" data-sp="${sp}" data-l2d="${sp}" style="--w:${R.w}px;--h:${R.h}px;--fx:${R.head[0]}px;--fy:${R.npc?R.head[1]:0}px;--s:${ks.toFixed(4)}"><div class="schi"><img class="sbase" src="${stUrl((R.npc?'npc/':'tc/')+sp)}" alt="">${stExImg(sp,e)}</div></div>`}
 let src,w,h,f,ex='';
 if(HD[sp]){src=splash(sp);if(!src)return'';const im=SPLASH_DIM[sp];w=im?im[0]:800;h=1100;f=splashFocus(sp);
  const k=sp+'_'+e,g=STORY_ASSET.ex[k];if(g&&e!=='n')ex=`<img class="sex" src="${stUrl('ex/'+k)}" style="left:${g[0]}px;top:${g[1]}px;width:${g[2]}px;height:${g[3]}px" alt="">`}
 else{const g=STORY_ASSET.npc[sp];if(!g||!stHas('npc/'+sp))return'';src=stUrl('npc/'+sp);w=g[0];h=g[1];f=[g[2],g[3]]}
 return`<div class="sch" data-sp="${sp}" style="--w:${w}px;--h:${h}px;--fx:${f[0]/100*w}px;--fy:${f[1]/100*h}px"><div class="schi"><img class="sbase" src="${src}" alt="">${ex}</div></div>`}
function stExImg(sp,e){const R=STORY_ASSET.tc[sp],g=R&&R.ex&&R.ex[e];if(!g||!stHas('tc/'+sp+'_'+e))return'';
 return`<img class="sex" src="${stUrl('tc/'+sp+'_'+e)}" style="left:${g[0]}px;top:${g[1]}px;width:${g[2]}px;height:${g[3]}px" alt="">`}
// ukuran asli splash (dibaca sekali dari gambar)
const SPLASH_DIM={};function splashDims(){for(const id in HD){const s=splash(id);if(!s||SPLASH_DIM[id])continue;const im=new Image();im.onload=()=>SPLASH_DIM[id]=[im.naturalWidth,im.naturalHeight];im.src=s}}
function storyPreload(s){const P=[];const add=p=>{if(stHas(p)){const im=new Image();im.src=stUrl(p);P.push(im)}};add('bg/'+s.bg);
 const gl=typeof l2dInit==='function'&&l2dInit();
 for(const l of s.L){if(l.bg)add('bg/'+l.bg);if(l.cg)add('cg/'+l.cg);if(Array.isArray(l)&&l[0]!=='n'){const id=l[0],R=STORY_ASSET.tc&&STORY_ASSET.tc[id],e=l[1];
  if(R){if(gl){l2dTC(id);if(e&&R.ex&&R.ex[e]){l2dTCEx(id,e);if(R.ex[e+'2'])l2dTCEx(id,e+'2')}}else{add((R.npc?'npc/':'tc/')+id);if(e&&R.ex&&R.ex[e])add('tc/'+id+'_'+e)}}
  else if(!HD[id])add('npc/'+id);else if(e&&e!=='n'&&e!=='-')add('ex/'+id+'_'+e)}}return P}
const SVOX=new Audio();SVOX.preload='auto';
function stVoice(k){try{SVOX.pause()}catch(e){}if(typeof voxStop==='function')voxStop();if(!k||!voxOn()||!stHas('v/'+k))return false;SVOX.muted=false;SVOX.src=stUrl('v/'+k);SVOX.volume=Math.min(1,voxVol()*1.15);const p=SVOX.play();if(p&&p.catch)p.catch(()=>{});return true}
function storyPlay(id,done){const s=STD[id];if(!s){done&&done();return}
 if(SP)storyEnd(true);splashDims();
 const el=document.createElement('div');el.id='story';el.innerHTML=`<div class="sbg"><img alt=""></div><div class="schs"></div><div class="scg"><img alt=""></div><div class="sflash"></div>
  <div class="stop"><button class="sbt" data-sb="auto">AUTO</button><button class="sbt" data-sb="log">LOG</button><button class="sbt sk" data-sb="skip">${T('LEWATI')} ▸▸</button></div>
  <div class="sbox pre"><div class="snm"></div><div class="stx"></div><i class="snx"></i></div><div class="sch2"></div>
  <div class="stitle"><small>${STORY_CH[s.ch||0].n[SL()]} · ${STORY_CH[s.ch||0].t[SL()]}</small><b>${s.t[SL()]}</b></div>`;
 document.getElementById('app').appendChild(el);
 const lay=()=>{const r=el.getBoundingClientRect();el.style.setProperty('--k',(r.height*1.32/1100).toFixed(4));el.style.setProperty('--X',Math.round(r.width/2)+'px');el.style.setProperty('--Y',Math.round(r.height*.25)+'px');el.style.setProperty('--T',Math.round(r.height*.035)+'px')};lay();window.addEventListener('resize',lay);
 SP={lay,s,i:-1,el,done,auto:!!S.storyAuto,typing:0,full:'',log:[],cg:null,bg:null,sp:null,t:0,pre:storyPreload(s),wait:0};
 stBg(s.bg,true);el.querySelector('[data-sb=auto]').classList.toggle('on',SP.auto);
 el.addEventListener('click',stTap);requestAnimationFrame(()=>el.classList.add('on'));
 // iOS: pancing elemen suara di dalam sentuhan yang membuka cerita supaya klip berikutnya boleh diputar oleh timer
 try{const fi=s.L.findIndex(l=>Array.isArray(l)&&l[0]!=='n'&&stHas('v/st_'+s.id+'_'+s.L.indexOf(l)));if(fi>=0&&voxOn()){SVOX.muted=true;SVOX.src=stUrl('v/st_'+s.id+'_'+fi);const p=SVOX.play();if(p&&p.then)p.then(()=>{if(SVOX.muted){SVOX.pause();SVOX.muted=false}}).catch(()=>{SVOX.muted=false});else SVOX.muted=false}}catch(e){SVOX.muted=false}
 try{if(typeof BGM!=='undefined'&&BGM.el&&!BGM.el.paused&&BGM.key)bgmFade(bgmV(BGM.key)*.45,.6)}catch(e){}
 if(typeof sfx==='function')sfx('open');
 setTimeout(()=>{if(!SP||SP.el!==el)return;el.querySelector('.stitle').classList.add('out');stNext()},1700)}
function stBg(k,first){const im=SP.el.querySelector('.sbg img');if(!k||!stHas('bg/'+k)){im.removeAttribute('src');return}if(SP.bg===k)return;SP.bg=k;
 if(first){im.src=stUrl('bg/'+k);return}const w=SP.el.querySelector('.sbg');w.classList.add('fade');setTimeout(()=>{im.src=stUrl('bg/'+k);w.classList.remove('fade')},260)}
function stCg(k){const w=SP.el.querySelector('.scg');if(!k){w.classList.remove('on');SP.cg=null;return}if(!stHas('cg/'+k))return;w.querySelector('img').src=stUrl('cg/'+k);SP.cg=k;w.classList.add('on')}
function stFx(k){const e=SP.el;if(k==='flash'||k==='star'){const f=e.querySelector('.sflash');f.className='sflash '+k;void f.offsetWidth;f.classList.add('go')}if(k==='shake'){e.classList.remove('shk');void e.offsetWidth;e.classList.add('shk')}if(k==='end'){e.classList.add('fin');return}if(typeof sfx==='function')sfx(k==='shake'?'boss':'rare')}
function stShow(sp,e){const box=SP.el.querySelector('.schs');
 if(sp==='n'||e==='-'||!sp){[...box.children].forEach(c=>c.classList.add('dim'));return}
 let c=box.querySelector(`.sch[data-sp="${sp}"]`);
 if(c&&c.dataset.e===e){[...box.children].forEach(x=>x.classList.toggle('dim',x!==c));SP.sp=sp;return}
 if(c&&c.dataset.l2d){const o=c.querySelector('.sex');o&&o.remove();c.querySelector('.schi').insertAdjacentHTML('beforeend',stExImg(sp,e));c.dataset.e=e;
  c.classList.remove('swap');void c.offsetWidth;c.classList.add('swap');[...box.children].forEach(x=>x.classList.toggle('dim',x!==c));SP.sp=sp;return}
 const html=stCharHTML(sp,e);if(!html){[...box.children].forEach(c=>c.classList.add('dim'));return}
 const t=document.createElement('div');t.innerHTML=html;const n=t.firstElementChild;n.dataset.e=e;
 if(c){c.replaceWith(n);n.classList.add('swap')}else{[...box.children].forEach(x=>{x.classList.add('out');setTimeout(()=>x.remove(),280)});n.classList.add('in');box.appendChild(n)}
 SP.sp=sp}
function stNext(){if(!SP)return;const s=SP.s;
 for(;;){SP.i++;const l=s.L[SP.i];if(!l)return storyEnd(false);
  if(Array.isArray(l))return stLine(l);
  if(l.bg)stBg(l.bg);if('cg' in l)stCg(l.cg);if(l.fx)stFx(l.fx);if(l.ch)return stChoice(l.ch)}}
function stLine(l){const[sp,e]=l,tx=stTx(l),el=SP.el,nm=el.querySelector('.snm'),box=el.querySelector('.sbox');box.classList.remove('pre');
 stShow(sp,e||'n');box.classList.toggle('nar',sp==='n');nm.textContent=sp==='n'?'':stName(sp);nm.style.display=sp==='n'?'none':'';
 SP.full=tx;SP.log.push([sp==='n'?'':stName(sp),tx]);
 const hasV=stVoice(sp!=='n'?'st_'+SP.s.id+'_'+SP.i:null);SP.hasV=hasV;SP.vEnd=0;
 const t=el.querySelector('.stx');t.textContent='';SP.typing=1;let k=0;const sp0=SP;clearInterval(SP.tm);
 SP.tm=setInterval(()=>{if(SP!==sp0)return clearInterval(sp0.tm);k+=LANG==='ja'?1:2;t.textContent=tx.slice(0,k);if(k>=tx.length){clearInterval(SP.tm);SP.typing=0;stAutoArm()}},28)}
function stAutoArm(){if(!SP||!SP.auto)return;clearTimeout(SP.at);const sp0=SP;
 const go=()=>{if(SP!==sp0||!SP.auto||SP.typing)return;stNext()};
 const base=900+SP.full.length*(LANG==='ja'?55:28);
 if(SP.hasV&&!SVOX.ended&&!SVOX.paused){SVOX.onended=()=>{SVOX.onended=null;SP&&(SP.at=setTimeout(go,700))};SP.at=setTimeout(go,Math.max(base,9000))}else SP.at=setTimeout(go,base)}
function stChoice(ch){const w=SP.el.querySelector('.sch2');if(SP.typing){clearInterval(SP.tm);SP.typing=0;SP.el.querySelector('.stx').textContent=SP.full}
 w.innerHTML=ch.map((c,i)=>`<button class="sopt" data-sc="${i}">${c[SL()]}</button>`).join('');w.classList.add('on');
 SP.el.querySelector('.sbox').classList.add('ask');SP.choosing=ch}
function stTap(ev){if(!SP)return;const b=ev.target.closest('[data-sb],[data-sc]');ev.stopPropagation();
 if(b&&b.dataset.sc!=null){const c=SP.choosing[+b.dataset.sc];SP.choosing=null;const w=SP.el.querySelector('.sch2');w.classList.remove('on');w.innerHTML='';SP.el.querySelector('.sbox').classList.remove('ask');
  SP.log.push([T('Kapten'),c[SL()]]);const el=SP.el,nm=el.querySelector('.snm');nm.textContent=T('Kapten');nm.style.display='';el.querySelector('.sbox').classList.remove('nar');el.querySelector('.stx').textContent=c[SL()];SP.full=c[SL()];SP.typing=0;SP.hasV=false;if(typeof sfx==='function')sfx('click');stAutoArm();return}
 if(b){const k=b.dataset.sb;if(typeof sfx==='function')sfx('click');
  if(k==='auto'){SP.auto=!SP.auto;S.storyAuto=SP.auto;save();b.classList.toggle('on',SP.auto);if(SP.auto&&!SP.typing&&!SP.choosing)stAutoArm();else clearTimeout(SP.at);return}
  if(k==='log')return stLog();
  if(k==='skip')return stSkipAsk();
  if(k==='logx'){SP.el.querySelector('.slog')?.remove();return}
  if(k==='skipno'){SP.el.querySelector('.sask')?.remove();return}
  if(k==='skipyes')return storyEnd(false);return}
 if(SP.el.querySelector('.slog,.sask'))return;
 if(SP.choosing)return;
 if(!SP.el.querySelector('.stitle').classList.contains('out'))return;
 clearTimeout(SP.at);
 if(SP.typing){clearInterval(SP.tm);SP.typing=0;SP.el.querySelector('.stx').textContent=SP.full;stAutoArm();return}
 stNext()}
function stLog(){const d=document.createElement('div');d.className='slog';d.innerHTML=`<div class="slh"><b>LOG</b><button class="sbt" data-sb="logx">✕</button></div><div class="sll">${SP.log.map(([n,t])=>`<p>${n?`<b>${esc(n)}</b>`:''}${esc(t)}</p>`).join('')}</div>`;SP.el.appendChild(d);const L=d.querySelector('.sll');L.scrollTop=L.scrollHeight}
function stSkipAsk(){const d=document.createElement('div');d.className='sask';d.innerHTML=`<div class="sakb"><p>${T('Lewati cerita ini? Kamu bisa menontonnya lagi kapan saja dari Arsip Cerita.')}</p><div class="mrow"><button class="btn gray" data-sb="skipno">${T('Batal')}</button><button class="btn" data-sb="skipyes">${T('Lewati')}</button></div></div>`;SP.el.appendChild(d)}
function storyEnd(silent){if(!SP)return;const sp=SP;SP=null;window.removeEventListener('resize',sp.lay);try{if(typeof BGM!=='undefined'&&BGM.el&&!BGM.el.paused&&BGM.key)bgmFade(bgmV(BGM.key),.8)}catch(e){}clearInterval(sp.tm);clearTimeout(sp.at);try{SVOX.pause()}catch(e){}
 const st=storyState();st.seen[sp.s.id]=1;if(st.pend===sp.s.id)st.pend=null;save();
 sp.el.classList.remove('on');setTimeout(()=>sp.el.remove(),350);if(!silent&&sp.done)setTimeout(sp.done,silent?0:200)}
/* ---------- arsip cerita ---------- */
function storyAvail(s){if(storySeen(s.id))return true;if(s.at==='start')return true;const st=STAGES[s.at];if(!st)return false;return s.when==='post'?!!S.stages[s.at]:unlocked(st)}
function openStoryArchive(ch){ch=ch??(S.world>=5?1:0);const list=STORY.filter(s=>(s.ch||0)===ch);
 modal(`<button class="btn red mclose" data-act="closeModal">✕</button><h3>${ic('adv',22)} ${T('Arsip Cerita')}</h3>
 <div class="mtabs">${STORY_CH.map((c,k)=>`<button class="btn ${k===ch?'':'blue'}" data-act="storyArc" data-arg="${k}">${c.n[SL()]}<small>${c.t[SL()]}</small></button>`).join('')}</div>
 <div class="sarc">${list.map(s=>{const ok=storyAvail(s),seen=storySeen(s.id);
  return`<button class="sarci${ok?'':' lk'}" data-act="${ok?'storyView':'storyLock'}" data-arg="${s.id}"><span class="sath"${ok&&stHas('bg/'+s.bg)?` style="background-image:url(${stUrl('bg/'+s.bg)})"`:''}>${ok?'':ic('lock',18)}</span><span class="sai"><small>${s.at==='start'?T('Prolog'):(s.when==='pre'?T('Sebelum'):T('Setelah'))+' '+s.at}</small><b>${ok?s.t[SL()]:'???'}</b></span>${seen?'<em class="sanew ok">✓</em>':ok?'<em class="sanew">NEW</em>':''}</button>`}).join('')}</div>`)}
