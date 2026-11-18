/* ================= LOADING SCREEN & LOGIN (layar judul) =================
   Urutan: #boot (loading, progres nyata) -> #login (judul + ketuk mulai
   -> buat nama untuk pemain baru) -> transisi -> game.
   ====================================================================== */
const GAME_VER='1.7.0';
const BOOT_TIPS=['Tips: Hero dengan elemen unggul memberi +30% damage. Cek petunjuk elemen sebelum bertarung!',
 'Tips: Ketuk kartu hero saat bar biru penuh untuk memakai skill secara manual.',
 'Tips: Tambang Bijih memberi bijih senjata dan Pelindung, Kuil Bintang memberi material Limit Break dan Aksesori.',
 'Tips: Senjata signature memberi bonus CP dan efek skill khusus untuk pemiliknya.',
 'Tips: Level hero dibatasi level akun. Selesaikan misi harian untuk naik level lebih cepat!',
 'Tips: Toko Emas mengisi ulang stoknya setiap hari.',
 'Tips: Tim dengan Penjaga dan Pendukung mendapat bonus Formasi Seimbang.',
 'Tips: Gunakan Sapu di dungeon yang sudah bintang 3 untuk farming kilat.'];
const NEWS=[{t:'Peringkat & Petualang Baru',d:'Peringkat CP dan Level kini hadir! Lihat profil petualang lain dan tim andalan mereka.'},
 {t:'5 Hero Baru',d:'Vela, Bruna, Nami, Kuro, dan Lumi bergabung ke panggilan standar, lengkap dengan senjata signature masing-masing.'},
 {t:'Pelindung & Aksesori',d:'Slot perlengkapan baru terbuka. Dapatkan di Tambang Bijih, Kuil Bintang, dan dari bos dunia.'}];
const NAME_OK=/^[A-Za-z0-9]{3,12}$/;
const nextFrame=()=>new Promise(r=>requestAnimationFrame(()=>setTimeout(r,0)));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

let bootP=0,bootShown=0,bootTipI=0,bootRAF=0;
function bootSet(p,txt){bootP=Math.max(bootP,p);const s=document.getElementById('bootSt');if(s&&txt)s.textContent=T(txt)}
function bootAnim(){bootShown+=(bootP-bootShown)*.12;if(bootP-bootShown<.3)bootShown=bootP;const f=document.getElementById('bootFill'),n=document.getElementById('bootPct'),r=document.getElementById('bootGlint');
 if(f)f.style.width=bootShown+'%';if(n)n.textContent=Math.floor(bootShown)+'%';if(r)r.style.left=bootShown+'%';bootRAF=requestAnimationFrame(bootAnim)}
const tipTxt=i=>T(BOOT_TIPS[i%BOOT_TIPS.length]).replace(/^[^:：]{1,12}[:：]\s*/,'');
function bootTip(){const e=document.getElementById('bootTip');if(!e)return;e.classList.remove('in');setTimeout(()=>{e.textContent=tipTxt(bootTipI++);e.classList.add('in')},250)}
/* ---------------- ilustrasi hero untuk loading & transisi ----------------
   Memakai tachie cerita (story/tc/<id>.webp, latar transparan) + info elemen/gelar/lore. */
const artHeroes=()=>typeof STORY_ASSET==='undefined'?[]:HEROES.filter(h=>STORY_ASSET.tc[h.id]&&!STORY_ASSET.tc[h.id].npc&&(typeof stHas!=='function'||stHas('tc/'+h.id))).map(h=>h.id);
let artLast='';
function pickArtHero(){const a=artHeroes();if(!a.length)return null;let id;for(let k=0;k<6;k++){id=a[Math.floor(Math.random()*a.length)];if(id!==artLast)break}artLast=id;return id}
function artHeroHTML(id){const h=HD[id];if(!h)return['',''];const el=EL[h.el]||EL.netral,ic=typeof ICONIMG_SRC!=='undefined'&&ICONIMG_SRC['el_'+h.el];
 return[`<img src="${stUrl('tc/'+id)}" alt="" onload="this.parentNode.classList.add('on')" onerror="this.remove()">`,
  `<div class="bele">${ic?`<img src="${ic}" alt="">`:''}<span>${'★'.repeat(h.r||3)}</span></div><small>${T(h.title||'')}</small><b>${esc(h.name)}</b>${h.lore?`<p>${T(h.lore)}</p>`:''}`,el.c]}
function artHeroInto(heroEl,infoEl,id){if(!id||!heroEl)return;const[a,b,c]=artHeroHTML(id);heroEl.style.setProperty('--hc',c);heroEl.innerHTML=a;if(infoEl){infoEl.style.setProperty('--hc',c);infoEl.innerHTML=b;setTimeout(()=>infoEl.classList.add('on'),120)}}
const motes=n=>Array.from({length:n},(_,i)=>`<i style="left:${(i*37+11)%96}%;top:${40+(i*23)%55}%;animation-delay:${(i*.53)%6}s;animation-duration:${5+(i%5)}s"></i>`).join('');

/* ---------------- splash studio HUN2 STUDIO (paling awal, sebelum loading & login) ----------------
   Markup statis #studio ada di index.html (logo ditanam saat build) sehingga langsung tampil.
   Tampil ±3 dtk sejak halaman dibuka (loading tetap berjalan di belakang), ketuk untuk lewati.
   Kalau belum pernah disentuh, splash menunggu satu ketukan ("Ketuk untuk melanjutkan"):
   iOS mewajibkan sentuhan sebelum suara boleh keluar, jadi musik login langsung terdengar. */
const STUDIO_DISC={id:'Game masih dalam tahap pengembangan',en:'This game is still in development',ja:'本作は現在開発中です'};
const STUDIO_TAP={id:'Ketuk untuk melanjutkan',en:'Tap to continue',ja:'タップして続ける'};
function studioSplash(){const st=document.getElementById('studio');if(!st)return;if(location.hash==='#skipboot'){st.remove();return}
 let l='id';try{const d=JSON.parse(localStorage.getItem(SAVE_KEY)||'{}');l=d&&d.lang||'id';const e=document.getElementById('stDisc');if(e&&STUDIO_DISC[l])e.textContent=STUDIO_DISC[l]}catch(e){}
 let done=false;const end=()=>{if(done)return;done=true;st.classList.add('out');setTimeout(()=>st.remove(),700)};
 const tm=setTimeout(()=>{if(AUD.gest){end();return}  // sudah pernah disentuh: lanjut otomatis
  const t=document.createElement('p');t.id='stTap';t.textContent=STUDIO_TAP[l]||STUDIO_TAP.id;st.querySelector('.stin').appendChild(t)},Math.max(1800,3400-performance.now()));
 st.addEventListener('click',()=>{if(performance.now()>900){clearTimeout(tm);end()}})}
studioSplash();
async function bootStep(fn){try{await fn()}catch(e){console.error('boot',e)}}
async function bootStart(){await sprReady();if(location.hash==='#skipboot'){await sprReady();load();setLang(S.lang||'id');initCore();const b=document.getElementById('boot');b&&b.remove();if(!S.uid)S.uid='00000000';initUI();return}  // jalan pintas untuk tes otomatis
 bootAnim();const t0=performance.now();let tipT=0;
 await bootStep(()=>{bootSet(6,'Membaca catatan petualangan...');load();setLang(S.lang||'id');document.querySelectorAll('#boot .asub').forEach(e=>e.textContent=T('Ksatria Piksel'));bootTipI=Math.floor(Math.random()*BOOT_TIPS.length);bootTip();tipT=setInterval(bootTip,3200);
  const bg=document.getElementById('bootBg');if(bg&&hasBgArt('key')){bg.style.backgroundImage=`url(${BGIMG_SRC.key})`;bg.classList.add('on')}
  const ms=document.getElementById('bootStars');if(ms)ms.innerHTML=motes(14);
  artHeroInto(document.getElementById('bootHero'),document.getElementById('bootInfo'),pickArtHero())});
 if(!S)S=defState();
 await nextFrame();bootSet(18,'Menyiapkan huruf...');await bootStep(()=>Promise.race([document.fonts.ready,sleep(1500)]));
 bootSet(30,'Melukis para hero...');await bootStep(sprReady);for(const h of HEROES){await bootStep(()=>{portrait(h.id);sprite(h.spr)});bootSet(30+Math.round(30*(HEROES.indexOf(h)+1)/HEROES.length));await nextFrame()}
 bootSet(62,'Menempa senjata...');for(let i=0;i<WEAPONS.length;i++){await bootStep(()=>weaponIcon(WEAPONS[i].id));if(i%4===3){bootSet(62+Math.round(14*i/WEAPONS.length));await nextFrame()}}await bootStep(()=>GEAR.forEach(g=>gearIcon(g.id)));
 bootSet(78,'Membangun Kerajaan Aster...');await nextFrame();await bootStep(initCore);await bootStep(()=>{if(typeof HOME_SCENE!=='undefined'&&!HOME_SCENE)HOME_SCENE=makeHomeScene()});await nextFrame();
 bootSet(90,'Memanggil para petualang...');await bootStep(()=>{botsInit()});await nextFrame();
 const wait=2300-(performance.now()-t0);if(wait>0)await sleep(wait);
 bootSet(100,'Siap!');await sleep(450);clearInterval(tipT);
 const b=document.getElementById('boot');b.classList.add('out');setTimeout(()=>{b.remove();cancelAnimationFrame(bootRAF)},500);
 try{openLogin()}catch(e){console.error('login',e);document.getElementById('login').classList.remove('on');initUI()}}

/* ---------------- layar judul / login ---------------- */
let loginRAF=0,lgMode='tap',entering=false;
function logoHTML(){return`<div class="lgtop"><div class="alogo" role="img" aria-label="Aster Chronicles"></div><div class="asub">${T('Ksatria Piksel')}</div></div>`}
let lgOpened=false;
function openLogin(){cancelAnimationFrame(loginRAF);if(typeof bgmPlay==='function')bgmPlay('login');if(!S.uid){S.uid=String(10000000+Math.floor(Math.random()*89999999));save()}
 const L=document.getElementById('login');const KA=hasBgArt('key');
 L.innerHTML=`${KA?`<img id="lgbg" class="kart" src="${BGIMG_SRC.key}" alt="">`:`<canvas id="lgbg" width="${HOME_W}" height="${HOME_H}"></canvas>`}<div class="lgrays"></div><div class="lgtint"></div>
 <div class="lgfx">${Array.from({length:18},(_,i)=>`<i style="left:${(i*53)%100}%;animation-delay:${(i*.37)%5}s;animation-duration:${5+(i%4)}s"></i>`).join('')}</div>
 ${logoHTML()}
 <div id="lgPanel" class="${lgMode==='name'?'card':''}">${lgMode==='name'?loginNameHTML():loginTapHTML()}</div>
 <div class="lgside"><button data-act="lgNews"><img class="px" src="${ICON.mission}" alt=""><span>${T('Pengumuman')}</span></button><button data-act="lgLang"><img class="px" src="${ICON.gear}" alt=""><span>${T('Bahasa')}</span></button><button data-act="lgAcc"><img class="px" src="${ICON.team}" alt=""><span>${T('Akun')}</span></button></div>
 <div class="lgver"><span>v${GAME_VER} · UID ${S.uid.replace(/(\d{4})(\d{4})/,'$1 $2')}</span><span>© HUN2 STUDIO</span></div>`;
 L.classList.add('on');L.classList.toggle('again',lgOpened);lgOpened=true;if(KA)return;const cv=document.getElementById('lgbg'),g=cv.getContext('2d');g.imageSmoothingEnabled=false;
 const t0=performance.now();const step=n=>{if(cv!==document.getElementById('lgbg'))return;drawHomeScene(g,(n-t0)/1000);loginRAF=requestAnimationFrame(step)};loginRAF=requestAnimationFrame(step)}
function loginTapHTML(){return`<button class="lgtap" data-act="lgStart">${S.named?`<span class="lgwel"><i>Lv${S.lv||1}</i><small>${T('Selamat datang kembali,')}</small><b>${esc(S.name)}</b></span>`:''}<span class="lgcta"><span>${T('KETUK UNTUK MULAI')}</span></span></button>`}
function loginNameHTML(){return`<div class="lgcard"><button class="lgx" data-act="lgBack" aria-label="✕">✕</button><h3>${T('Masuk sebagai Tamu')}</h3><p>${T('Data petualanganmu disimpan di perangkat ini.')}</p>
 <label for="lgName">${T('Nama Kapten')}</label><input class="nm" id="lgName" maxlength="12" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="go" value="${S.name&&S.name!=='Kapten'?esc(S.name):''}" placeholder="${T('3–12 huruf atau angka')}">
 <small class="lgrule" id="lgRule">${T('Hanya huruf dan angka, tanpa spasi atau simbol.')}</small>
 <div class="mrow"><button class="btn gray" data-act="lgDice">🎲 ${T('Acak')}</button><button class="btn" data-act="lgGo">${T('Mulai Petualangan')}</button></div></div>`}
// layar transisi: latar key art buram + ilustrasi hero acak + tips + bar terisi (senada dengan loading)
function transEl(msg,flash){const tr=document.createElement('div');tr.className='trans';const KA=hasBgArt('key'),id=pickArtHero();
 tr.innerHTML=`<div class="bbg"${KA?` style="background-image:url(${BGIMG_SRC.key})"`:''}></div><div class="bvig"></div><div class="bstars">${motes(10)}</div>
 ${id?`<div class="bhero"></div><div class="blogo"><div class="alogo"></div></div><div class="binfo"></div>`:`<div class="trmini"><div class="alogo"></div></div>`}
 <div class="bbot"><div class="btip"><em>TIPS</em><p class="in">${tipTxt(Math.floor(Math.random()*BOOT_TIPS.length))}</p></div>
 <div class="bline"><span>${T(msg)}</span><b></b></div><div class="bfr"><div class="bfill"></div><i class="bglint"></i></div></div>${flash?'<div class="trflash"></div>':''}`;
 document.body.appendChild(tr);if(id)artHeroInto(tr.querySelector('.bhero'),tr.querySelector('.binfo'),id);return tr}
async function enterGame(){if(entering)return;entering=true;sfx('start');if(typeof bgmStop==='function'){bgmStop(1.2);setTimeout(()=>{if(!document.getElementById('login').classList.contains('on')&&!BGM.want)bgmPlay('game')},1500)}const L=document.getElementById('login');L.classList.add('enter');
 await sleep(420);const tr=transEl('Memasuki Kerajaan Aster...',1);
 await sleep(40);tr.classList.add('on');await sleep(1250);cancelAnimationFrame(loginRAF);L.classList.remove('on','enter','again');L.innerHTML='';lgMode='tap';lgOpened=false;
 initUI();await sleep(250);tr.classList.remove('on');setTimeout(()=>tr.remove(),500)}
// kembali ke layar judul (dari Pengaturan atau setelah Hapus Progres): hentikan battle/cerita/suara, simpan, lalu buka login lagi
async function backToLogin(){if(document.getElementById('login').classList.contains('on'))return;entering=false;
 try{$('#modal').classList.contains('on')&&closeModal()}catch(e){}
 try{if(typeof SP!=='undefined'&&SP)storyEnd(true)}catch(e){}
 try{if(B){B=null;$('#battle').classList.remove('on');const o=$('#bOver');o&&o.classList.remove('on')}}catch(e){}
 try{typeof voxStop==='function'&&voxStop()}catch(e){}
 if(S)save();sfx('open');if(typeof bgmStop==='function')bgmStop(.8);
 const tr=transEl('Kembali ke menu utama...');
 await sleep(40);tr.classList.add('on');await sleep(1150);
 tab='home';lgMode='tap';lgOpened=false;openLogin();if(typeof tutSync==='function')tutSync();await sleep(200);tr.classList.remove('on');setTimeout(()=>tr.remove(),500)}
function lgValidate(v){return NAME_OK.test(v)}
Object.assign(ACT,{
 lgStart:()=>{if(entering||lgMode==='name')return;if(S.named){enterGame();return}sfx('open');lgMode='name';const P=$('#lgPanel');P.classList.add('card');P.innerHTML=loginNameHTML();setTimeout(()=>{const i=$('#lgName');i&&i.focus()},80)},
 lgDice:()=>{const i=$('#lgName');if(i){let v='';for(let k=0;k<20&&!NAME_OK.test(v);k++)v=botLocalName(Math.floor(Math.random()*1e6)).replace(/\d+$/,'').slice(0,12);i.value=v;sfx('tap');i.dispatchEvent(new Event('input',{bubbles:true}))}},
 lgGo:()=>{if(entering)return;const v=($('#lgName').value||'').trim();if(!lgValidate(v)){const r=$('#lgRule');r.classList.add('bad');r.textContent=T('Nama harus 3–12 huruf atau angka, tanpa spasi atau simbol.');sfx('deny');return}
  if(BOTS.names.some(n=>n.toLowerCase()===v.toLowerCase())){toast(T('Nama itu sudah dipakai petualang lain!'),1);return}
  S.name=v;S.named=true;save();const i=$('#lgName');i&&i.blur();enterGame()},
 lgBack:()=>{lgMode='tap';sfx('close');const P=$('#lgPanel');P.classList.remove('card');P.innerHTML=loginTapHTML();P.querySelectorAll('.lgwel,.lgcta').forEach(e=>e.style.animationDelay='0s')},
 lgNews:()=>modal(`<button class="btn red mclose" data-act="closeModal">✕</button><h3>${T('Pengumuman')}</h3><div class="news">${NEWS.map(n=>`<div class="nwi"><b>${T(n.t)}</b><p>${T(n.d)}</p></div>`).join('')}</div><p class="sub" style="text-align:center">v${GAME_VER}</p>`),
 lgLang:()=>modal(`<button class="btn red mclose" data-act="closeModal">✕</button><h3>${T('Bahasa')}</h3><div class="mrow" style="flex-direction:column">${[['id','Bahasa Indonesia'],['en','English'],['ja','日本語']].map(([k,n])=>`<button class="btn ${S.lang===k?'':'blue'}" data-act="lgSetLang" data-arg="${k}">${n}</button>`).join('')}</div>`),
 lgSetLang:k=>{if(S.lang===k){closeModal();return}const v=$('#lgName')&&$('#lgName').value;setLang(k);save();closeModal();openLogin();if(v&&$('#lgName')){$('#lgName').value=v;$('#lgName').dispatchEvent(new Event('input',{bubbles:true}))}},
 lgAcc:()=>modal(`<button class="btn red mclose" data-act="closeModal">✕</button><h3>${T('Akun')}</h3><div class="stats"><div><span>${T('Nama Kapten')}</span><b>${S.named?esc(S.name):'—'}</b></div><div><span>UID</span><b>${S.uid}</b></div><div><span>${T('Level')}</span><b>${S.lv}</b></div><div><span>${T('Jenis akun')}</span><b>${T('Tamu')}</b></div></div>
  <p class="sub">${T('Akun tamu tersimpan di perangkat dan browser ini. Menghapus data browser akan menghapus progresmu.')}</p>`),
});
document.addEventListener('input',e=>{if(e.target&&e.target.id==='lgName'){const v=e.target.value,r=$('#lgRule');if(!r)return;const ok=!v||lgValidate(v);r.classList.toggle('bad',!ok);r.classList.toggle('good',!!v&&ok);r.textContent=!v?T('Hanya huruf dan angka, tanpa spasi atau simbol.'):ok?T('Nama tersedia!'):T('Nama harus 3–12 huruf atau angka, tanpa spasi atau simbol.')}});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target&&e.target.id==='lgName'){e.preventDefault();ACT.lgGo()}});
