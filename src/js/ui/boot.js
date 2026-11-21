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
const NEWS=[{t:'Batas Ulang Tahap',d:'Tahap cerita yang sudah dimenangkan kini bisa dimainkan ulang atau disapu 5× per hari (tahap bos 3×). Habis? Tambah lagi dengan permata, atau tunggu reset tengah malam.'},
 {t:'Peringkat & Petualang Baru',d:'Peringkat CP dan Level kini hadir! Lihat profil petualang lain dan tim andalan mereka.'},
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
 if(loggedIn()){bootSet(95,'Menghubungkan akun...');await bootStep(()=>Promise.race([netPull(),sleep(5000)]));if(S.uid!==NET.acct.uid){S.uid=NET.acct.uid;S.name=NET.acct.u}}
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
 <div id="lgPanel" class="${lgMode!=='tap'?'card':''}">${lgMode==='name'?loginNameHTML():lgMode==='auth'?authHTML():loginTapHTML()}</div>
 <div class="lgside"><button data-act="lgNews"><img class="px" src="${ICON.mission}" alt=""><span>${T('Pengumuman')}</span></button><button data-act="lgLang"><img class="px" src="${ICON.gear}" alt=""><span>${T('Bahasa')}</span></button><button data-act="lgAcc"><img class="px" src="${ICON.team}" alt=""><span>${T('Akun')}</span></button></div>
 <div class="lgver"><span>v${GAME_VER} · UID ${S.uid.replace(/(\d{4})(\d{4})/,'$1 $2')}</span><span>© HUN2 STUDIO</span></div>`;
 L.classList.add('on');L.classList.toggle('again',lgOpened);lgOpened=true;if(KA)return;const cv=document.getElementById('lgbg'),g=cv.getContext('2d');g.imageSmoothingEnabled=false;
 const t0=performance.now();const step=n=>{if(cv!==document.getElementById('lgbg'))return;drawHomeScene(g,(n-t0)/1000);loginRAF=requestAnimationFrame(step)};loginRAF=requestAnimationFrame(step)}
function loginTapHTML(){const W=typeof watchMode==='function'&&watchMode();return`<button class="lgtap" data-act="lgStart">${loggedIn()||S.named?`<span class="lgwel">${W?`<i>👁</i>`:`<i>Lv${S.lv||1}</i>`}<small>${T('Selamat datang kembali,')}</small><b>${esc(loggedIn()?NET.acct.u:S.name)}</b>${loggedIn()?'':`<em>${T('Tamu')}</em>`}<small class="lgsrv">${W?T('Penonton · semua server'):esc(NET.srvName?`S${netSrv()} · ${NET.srvName}`:'S'+netSrv())}</small></span>`:''}<span class="lgcta"><span>${T('KETUK UNTUK MULAI')}</span></span></button>`}
function loginNameHTML(){setTimeout(srvPickLoad,0);return`<div class="lgcard"><button class="lgx" data-act="lgBack" aria-label="✕">✕</button><h3>${T('Masuk sebagai Tamu')}</h3><p>${T('Data petualanganmu disimpan di perangkat ini.')}</p>
 <label for="lgName">${T('Nama Kapten')}</label><input class="nm" id="lgName" maxlength="12" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="go" value="${S.name&&S.name!=='Kapten'?esc(S.name):''}" placeholder="${T('3–12 huruf atau angka')}">
 <small class="lgrule" id="lgRule">${T('Hanya huruf dan angka, tanpa spasi atau simbol.')}</small>
 <div class="srvwrap">${srvPickHTML()}</div>
 <div class="mrow"><button class="btn gray" data-act="lgDice">🎲 ${T('Acak')}</button><button class="btn" data-act="lgGo">${T('Mulai Petualangan')}</button></div></div>`}
/* ---------- pilih server (daftar akun baru / tamu). Akun terikat ke satu server, tanpa pindah. ---------- */
const SRVL={list:null,at:0,sel:null};
async function srvLoad(force){if(!force&&SRVL.list&&Date.now()-SRVL.at<6e4)return SRVL.list;const o=await api('/api/servers');SRVL.ok=!!(o&&o.ok);if(SRVL.ok){SRVL.list=o.list;SRVL.at=Date.now()}return SRVL.list||[]}
function srvOpenAt(t){const d=new Date(t),p=n=>String(n).padStart(2,'0'),hm=p(d.getHours())+':'+p(d.getMinutes());return t-Date.now()<864e5?hm:p(d.getDate())+'/'+p(d.getMonth()+1)+' '+hm}
// server yang dijadwalkan rilis (pra-registrasi): sudah bisa dipilih, dunia mulai ramai saat jam buka
// st (server): 'list' = baru terdaftar (BELUM RILIS, tidak bisa dipilih), 'soon' = terjadwal (pra-registrasi akun; masuk game baru saat jam buka), 'open'
const srvOpen=x=>!!x&&x.st!=='list'&&!(x.opened>Date.now());
function srvState(x){const age=(Date.now()-x.opened)/864e5;return x.st==='list'?['list',T('BELUM RILIS')]:x.opened>Date.now()?['soon',T('SEGERA')]:x.full?['full',T('PENUH')]:age<3?['new',T('BARU')]:x.n/x.cap>.7?['busy',T('RAMAI')]:['ok',T('LANCAR')]}
function srvDefault(L){const ok=(L||[]).filter(x=>!x.full&&x.st!=='list'),op=ok.filter(srvOpen),P=op.length?op:ok;return P.length?P.reduce((a,b)=>b.opened>a.opened||(b.opened===a.opened&&b.n<a.n)?b:a).id:null}
function srvPickHTML(){const L=SRVL.list;if(!L)return`<div class="srvpick"><small>${T('Memuat daftar server...')}</small></div>`;if(SRVL.sel==null||!L.some(x=>x.id===SRVL.sel&&!x.full&&x.st!=='list'))SRVL.sel=srvDefault(L);
 if(!L.length)return`<label>${T('Server')}</label><div class="srvpick"><small>${T('Belum ada server yang dibuka. Coba lagi nanti.')}</small></div>`;
 return`<label>${T('Server')}</label><div class="srvpick">${L.map(x=>{const[st,lb]=srvState(x);return`<button class="srvb s-${st}${x.id===SRVL.sel?' on':''}" data-act="srvSel" data-arg="${x.id}"${x.full?' disabled':''}><b>S${x.id} · ${esc(x.name)}</b><small>${x.st==='list'?T('Belum rilis'):(x.opened>Date.now()?T('Buka {t}',{t:srvOpenAt(x.opened)})+' · ':'')+fmt(x.n)+'/'+fmt(x.cap)}</small><i>${lb}</i></button>`}).join('')}</div>
 <small class="lgrule">${T('Akun terikat ke server pilihanmu dan tidak bisa pindah.')}</small>`}
function srvPickLoad(){srvLoad().then(()=>{document.querySelectorAll('.srvwrap').forEach(e=>e.innerHTML=srvPickHTML())})}
const srvNameOf=id=>{const x=(SRVL.list||[]).find(y=>y.id===+id);return x?`S${x.id} · ${x.name}`:'S'+id};
/* ---------- gerbang server: masuk game hanya ke server yang sudah buka ----------
   st 'soon' = terjadwal (jam buka), 'list' = baru terdaftar, 'gone' = server dihapus / belum ada server → pilih server lain. GM boleh lewat. */
function srvWhenTxt(t){const d=new Date(t),p=n=>String(n).padStart(2,'0'),days=[T('Minggu'),T('Senin'),T('Selasa'),T('Rabu'),T('Kamis'),T('Jumat'),T('Sabtu')],m=Math.round((t-Date.now())/6e4);
 return`${days[d.getDay()]} ${p(d.getDate())}/${p(d.getMonth()+1)} ${p(d.getHours())}:${p(d.getMinutes())}`+(m>0?` (${m<60?T('{n} menit lagi',{n:m}):m<1440?T('{h} jam {m} menit lagi',{h:Math.floor(m/60),m:m%60}):T('{n} hari lagi',{n:Math.ceil(m/1440)})})`:'')}
function srvDeny(st,sv){sv=sv||{};sfx('deny');const nm=sv.id?`<b>S${sv.id}${sv.name?' · '+esc(sv.name):''}</b>`:'';
 const [ic,h,p]=st==='soon'?['⏰',T('Server Belum Dibuka'),T('Server {s} belum dibuka. Server ini dibuka {t} — datang lagi saat itu ya!',{s:nm,t:'<b>'+srvWhenTxt(sv.at)+'</b>'})]
  :st==='list'?['📋',T('Server Belum Dirilis'),T('Server {s} baru masuk daftar dan belum dirilis. Tunggu pengumuman rilisnya!',{s:nm})]
  :['🌙',T('Server Ditutup'),sv.id?T('Server {s} sudah ditutup. Ketuk layar untuk memilih server baru — progresmu tetap aman.',{s:nm}):T('Belum ada server yang dibuka. Coba lagi nanti.')];
 modal(`<div class="srvdeny"><div class="sdic">${ic}</div><h3>${h}</h3><p>${p}</p></div><div class="mrow"><button class="btn" data-act="closeModal">OK</button></div>`)}
// server lama sudah dihapus: pilih server baru yang sudah buka (akun: /api/acc/srv, tamu: simpan lokal). Rival & lawan Arena lama tidak berlaku.
async function srvGonePick(ok){const L=(await srvLoad(true)).filter(x=>srvOpen(x)&&!x.full);if(!L.length){srvDeny('gone',{});return}
 SRVL.list=L;SRVL.sel=srvDefault(L);srvGonePick.ok=ok;sfx('open');
 modal(`<h3>${T('Pilih Server Baru')}</h3><p class="sub" style="text-align:center">${T('Server lamamu sudah ditutup. Progresmu tetap aman — pilih server baru untuk melanjutkan.')}</p><div class="srvwrap">${srvPickHTML()}</div><div class="mrow"><button class="btn" data-act="srvGoneGo">${T('Lanjutkan')}</button></div>`)}
async function srvGoneGo(){const id=SRVL.sel;if(!id)return;
 if(loggedIn()){const o=await api('/api/acc/srv',{tok:netTok(),srv:id});if(!o.ok){toast(netErr(o.e),1);return}NET.acct.srv=o.srv;acctSave()}
 else{try{localStorage.setItem(SRV_KEY,String(id))}catch(e){}}
 try{if(S.rv)S.rv={};if(S.arena){S.arena.opps=[];S.arena.log=[]}save()}catch(e){}
 closeModal();netWorld(true);const f=srvGonePick.ok;srvGonePick.ok=null;f&&f()}
async function srvGate(ok){if(srvGate.busy)return;srvGate.busy=1;try{
 if(loggedIn()){const o=await api('/api/ping',{tok:netTok()});
  if(!o||!o.ok){if(o&&(o.e==='auth'||o.e==='ban'))return;ok();return}   // offline: main seperti biasa
  if(o.watch){NET.acct.watch=1;acctSave();watchOpen();return}
  if(NET.acct.watch){NET.acct.watch=0;acctSave()}
  if(o.gm||!o.srvst||o.srvst==='open'){if(o.gm&&o.srvst&&o.srvst!=='open')toast(T('(GM) Server ini belum dibuka untuk pemain.'));ok();return}
  if(o.srvst==='gone'){srvGonePick(ok);return}
  srvDeny(o.srvst,{id:o.srv,name:o.svn,at:o.sva});return}
 const L=await srvLoad(true);if(!SRVL.ok){ok();return}
 const x=L.find(y=>y.id===netSrv());if(srvOpen(x)){ok();return}
 if(!x){srvGonePick(ok);return}
 srvDeny(x.st==='list'?'list':'soon',{id:x.id,name:x.name,at:x.opened})}finally{srvGate.busy=0}}
// kartu Masuk / Daftar (akun server). mode 'link' = dari Pengaturan: daftarkan progres tamu saat ini
let auTab='in';
function authHTML(link){const reg=auTab==='up'||link;if(reg)setTimeout(srvPickLoad,0);return`<div class="lgcard au">${link?'':'<button class="lgx" data-act="lgBack" aria-label="✕">✕</button>'}<h3>${link?T('Daftarkan Akun'):reg?T('Buat Akun'):T('Masuk Akun')}</h3>
 ${link?`<p>${T('Progres tamu kamu saat ini akan disimpan ke akun baru.')}</p>`:`<div class="autab"><button class="${reg?'':'on'}" data-act="auTab" data-arg="in">${T('Masuk Akun')}</button><button class="${reg?'on':''}" data-act="auTab" data-arg="up">${T('Daftar')}</button></div>`}
 <label for="auU">${T('Username')}</label><input class="nm" id="auU" maxlength="12" autocomplete="username" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="${T('3–12 huruf atau angka')}">
 <label for="auP" style="margin-top:10px">${T('Password')}</label><div class="aupw"><input class="nm" id="auP" type="password" maxlength="64" autocomplete="${reg?'new-password':'current-password'}" placeholder="${T('minimal 6 karakter')}"><button data-act="auEye" aria-label="👁">👁</button></div>
 ${reg?`<label for="auP2" style="margin-top:10px">${T('Ulangi Password')}</label><input class="nm" id="auP2" type="password" maxlength="64" autocomplete="new-password"><div class="srvwrap">${srvPickHTML()}</div>`:''}
 <small class="lgrule" id="auErr">${reg?T('Username juga menjadi nama Kapten-mu. Simpan password baik-baik — tidak bisa dipulihkan lewat email.'):T('Masuk untuk memuat progres akunmu di perangkat mana pun.')}</small>
 <div class="mrow"><button class="btn" id="auGo" data-act="auGo" data-arg="${link?'link':''}">${reg?T('Daftar & Mulai'):T('Masuk Akun')}</button></div>
 ${link?'':`<button class="auguest" data-act="lgGuest">${T('Main sebagai Tamu')} ›</button>`}</div>`}
async function authGo(link){const u=($('#auU').value||'').trim(),p=$('#auP').value||'',reg=auTab==='up'||link,er=$('#auErr'),bt=$('#auGo'),pick=!reg&&$('#auPick')?SRVL.sel:null;
 const bad=m=>{er.className='lgrule bad';er.textContent=m;sfx('deny')};
 if(!NAME_OK.test(u))return bad(netErr('uname'));if(p.length<6)return bad(netErr('pw'));if(reg&&p!==$('#auP2').value)return bad(T('Password tidak sama.'));
 bt.disabled=true;const old=bt.textContent;bt.textContent=T('Menghubungkan...');er.className='lgrule';er.textContent='';
 if(reg&&!SRVL.sel)return bad(T('Pilih server dulu.'));
 const o=reg?await netRegister(u,p,!!link,SRVL.sel):await netLogin(u,p,pick);bt.disabled=false;bt.textContent=old;
 if(!o.ok){bad(netErr(o.e));
  if(o.e==='srvsoon'||o.e==='srvlist')srvDeny(o.e==='srvsoon'?'soon':'list',o.sv);
  else if(o.e==='srvgone'){SRVL.list=o.list||[];SRVL.sel=srvDefault(SRVL.list);let w=$('#auPick');if(!w){w=document.createElement('div');w.id='auPick';w.className='srvwrap';er.after(w)}
   w.innerHTML=SRVL.list.length?srvPickHTML():'';er.textContent=SRVL.list.length?T('Server lamamu sudah ditutup. Pilih server baru, lalu tekan Masuk lagi — progresmu tetap aman.'):T('Belum ada server yang dibuka. Coba lagi nanti.')}
  return}
 if(o.watch){sfx('claim');toast(T('Masuk sebagai penonton, {n}.',{n:o.u}));watchOpen();return}
 sfx('claim');document.activeElement&&document.activeElement.blur&&document.activeElement.blur();
 if(link){closeModal();toast(T('Akun {n} terdaftar! Progresmu kini tersimpan di server.',{n:o.u}));try{refreshScreen()}catch(e){}return}
 if(o.pre){toast(T('Akun {n} berhasil dibuat!',{n:o.u}));lgMode='tap';const P=$('#lgPanel');if(P){P.classList.remove('card');P.innerHTML=loginTapHTML()}
  modal(`<div class="srvdeny"><div class="sdic">🎟</div><h3>${T('Pra-registrasi Berhasil')}</h3><p>${T('Akun {n} terdaftar di {s}. Server dibuka {t} — masuk lagi saat itu ya!',{n:'<b>'+esc(o.u)+'</b>',s:'<b>S'+o.pre.id+' · '+esc(o.pre.name)+'</b>',t:'<b>'+srvWhenTxt(o.pre.at)+'</b>'})}</p></div><div class="mrow"><button class="btn" data-act="closeModal">OK</button></div>`);return}
 if(o.moved)toast(T('Akun pindah ke {s}. Selamat datang di dunia baru!',{s:srvNameOf(o.srv)}));
 if(!reg&&o.srvst&&o.srvst!=='open'&&o.gm)toast(T('(GM) Server ini belum dibuka untuk pemain.'));
 toast(reg?T('Akun {n} berhasil dibuat!',{n:o.u}):T('Selamat datang kembali, {n}!',{n:o.u}));enterGame()}
// layar transisi: latar key art buram + ilustrasi hero acak + tips + bar terisi (senada dengan loading)
function transEl(msg,flash){const tr=document.createElement('div');tr.className='trans';const KA=hasBgArt('key'),id=pickArtHero();
 tr.innerHTML=`<div class="bbg"${KA?` style="background-image:url(${BGIMG_SRC.key})"`:''}></div><div class="ldvig"></div><div class="bstars">${motes(10)}</div>
 ${id?`<div class="bhero"></div><div class="blogo"><div class="alogo"></div></div><div class="binfo"></div>`:`<div class="trmini"><div class="alogo"></div></div>`}
 <div class="bbot"><div class="btip"><em>TIPS</em><p class="in">${tipTxt(Math.floor(Math.random()*BOOT_TIPS.length))}</p></div>
 <div class="bline"><span>${T(msg)}</span><b></b></div><div class="bfr"><div class="bfill"></div><i class="bglint"></i></div></div>${flash?'<div class="trflash"></div>':''}`;
 document.body.appendChild(tr);if(id)artHeroInto(tr.querySelector('.bhero'),tr.querySelector('.binfo'),id);return tr}
async function enterGame(){if(entering)return;entering=true;sfx('start');if(typeof bgmStop==='function')bgmStop(1.2);const L=document.getElementById('login');L.classList.add('enter');
 await sleep(420);const tr=transEl('Memasuki Kerajaan Aster...',1);
 await sleep(40);tr.classList.add('on');await sleep(1250);cancelAnimationFrame(loginRAF);L.classList.remove('on','enter','again');L.innerHTML='';lgMode='tap';lgOpened=false;
 initUI();if(typeof bgmPlay==='function'&&!BGM.want)bgmPlay('game');  // musik menu (cerita/battle yang langsung mulai sudah memasang lagunya sendiri)
 await sleep(250);tr.classList.remove('on');setTimeout(()=>tr.remove(),500)}
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
 lgStart:()=>{if(entering||lgMode!=='tap')return;if(loggedIn()||S.named){srvGate(()=>enterGame());return}sfx('open');lgMode='auth';auTab='in';const P=$('#lgPanel');P.classList.add('card');P.innerHTML=authHTML()},
 lgGuest:()=>{sfx('open');lgMode='name';const P=$('#lgPanel');P.classList.add('card');P.innerHTML=loginNameHTML();setTimeout(()=>{const i=$('#lgName');i&&i.focus()},80)},
 auTab:k=>{auTab=k;sfx('tab');const u=$('#auU')&&$('#auU').value;const P=$('#modal .lgcard.au')?$('#modal .mbox'):$('#lgPanel');if($('#modal .lgcard.au'))return;P.innerHTML=authHTML();if(u)$('#auU').value=u},
 auEye:()=>{const i=$('#auP');if(i)i.type=i.type==='password'?'text':'password'},
 auGo:a=>authGo(a==='link'),
 accLink:()=>{auTab='up';modal(`<button class="btn red mclose" data-act="closeModal">✕</button>${authHTML(true)}`);$('#modal .mbox').classList.add('aubox')},
 accLogout:()=>confirmBox(T('Keluar dari akun {n}? Progres sudah tersimpan di server dan bisa dimuat lagi dengan masuk.',{n:esc(NET.acct?NET.acct.u:'')}),()=>netLogout(),T('Keluar')),
 lgDice:()=>{const i=$('#lgName');if(i){let v='';for(let k=0;k<20&&!NAME_OK.test(v);k++)v=botLocalName(Math.floor(Math.random()*1e6)).replace(/\d+$/,'').slice(0,12);i.value=v;sfx('tap');i.dispatchEvent(new Event('input',{bubbles:true}))}},
 srvGoneGo:()=>srvGoneGo(),
 lgGo:async()=>{if(entering)return;const v=($('#lgName').value||'').trim();if(!lgValidate(v)){const r=$('#lgRule');r.classList.add('bad');r.textContent=T('Nama harus 3–12 huruf atau angka, tanpa spasi atau simbol.');sfx('deny');return}
  if(BOTS.names.some(n=>n.toLowerCase()===v.toLowerCase())){toast(T('Nama itu sudah dipakai petualang lain!'),1);return}
  const sx=(SRVL.list||[]).find(x=>x.id===SRVL.sel);if(SRVL.list&&!SRVL.list.length){srvDeny('gone',{});return}if(SRVL.list&&!sx){toast(T('Pilih server dulu.'),1);return}
  if(sx&&!srvOpen(sx)){srvDeny(sx.st==='list'?'list':'soon',{id:sx.id,name:sx.name,at:sx.opened});return}
  if(!S.uid||S.uid.length!==8)S.uid=String(10000000+Math.floor(Math.random()*89999999));
  if(SRVL.sel){try{localStorage.setItem(SRV_KEY,String(SRVL.sel))}catch(e){}netWorld(true)}
  S.name=v;S.named=true;save();const i=$('#lgName');i&&i.blur();enterGame()},
 srvSel:id=>{const x=(SRVL.list||[]).find(y=>y.id===+id);if(x&&x.st==='list'){sfx('deny');toast(T('S{n} · {m} belum dirilis. Tunggu pengumuman rilisnya!',{n:x.id,m:x.name}),1);return}SRVL.sel=+id;sfx('tab');document.querySelectorAll('.srvwrap').forEach(e=>e.innerHTML=srvPickHTML())},
 lgBack:()=>{if(lgMode==='name'&&!loggedIn()){lgMode='auth';const P=$('#lgPanel');P.innerHTML=authHTML();sfx('close');return}lgMode='tap';sfx('close');const P=$('#lgPanel');P.classList.remove('card');P.innerHTML=loginTapHTML();P.querySelectorAll('.lgwel,.lgcta').forEach(e=>e.style.animationDelay='0s')},
 lgNews:()=>modal(`<button class="btn red mclose" data-act="closeModal">✕</button><h3>${T('Pengumuman')}</h3><div class="news">${NEWS.map(n=>`<div class="nwi"><b>${T(n.t)}</b><p>${T(n.d)}</p></div>`).join('')}</div><p class="sub" style="text-align:center">v${GAME_VER}</p>`),
 lgLang:()=>modal(`<button class="btn red mclose" data-act="closeModal">✕</button><h3>${T('Bahasa')}</h3><div class="mrow" style="flex-direction:column">${[['id','Bahasa Indonesia'],['en','English'],['ja','日本語']].map(([k,n])=>`<button class="btn ${S.lang===k?'':'blue'}" data-act="lgSetLang" data-arg="${k}">${n}</button>`).join('')}</div>`),
 lgSetLang:k=>{if(S.lang===k){closeModal();return}const v=$('#lgName')&&$('#lgName').value;setLang(k);save();closeModal();openLogin();if(v&&$('#lgName')){$('#lgName').value=v;$('#lgName').dispatchEvent(new Event('input',{bubbles:true}))}},
 lgAcc:()=>modal(`<button class="btn red mclose" data-act="closeModal">✕</button><h3>${T('Akun')}</h3>${loggedIn()?`<div class="stats"><div><span>${T('Username')}</span><b>${esc(NET.acct.u)}</b></div><div><span>UID</span><b>${NET.acct.uid}</b></div><div><span>${T('Level')}</span><b>${S.lv}</b></div><div><span>${T('Jenis akun')}</span><b>${T('Akun Server')}</b></div></div>
  <p class="sub">${T('Progres tersimpan di server. Masuk dengan username & password yang sama di perangkat lain untuk melanjutkan.')}</p><div class="mrow"><button class="btn red" data-act="accLogout">${T('Keluar Akun')}</button></div>`
  :`<div class="stats"><div><span>${T('Nama Kapten')}</span><b>${S.named?esc(S.name):'—'}</b></div><div><span>UID</span><b>${S.uid||'—'}</b></div><div><span>${T('Level')}</span><b>${S.lv}</b></div><div><span>${T('Jenis akun')}</span><b>${T('Tamu')}</b></div></div>
  <p class="sub">${T('Akun tamu tersimpan di perangkat dan browser ini. Menghapus data browser akan menghapus progresmu.')}</p><div class="mrow"><button class="btn" data-act="lgAuthOpen" data-arg="in">${T('Masuk Akun')}</button><button class="btn green" data-act="lgAuthOpen" data-arg="up">${T('Daftar')}</button></div>`}`),
 lgAuthOpen:k=>{closeModal();lgMode='auth';auTab=k;const P=$('#lgPanel');if(!P)return;P.classList.add('card');P.innerHTML=authHTML()},
});
document.addEventListener('input',e=>{if(e.target&&e.target.id==='lgName'){const v=e.target.value,r=$('#lgRule');if(!r)return;const ok=!v||lgValidate(v);r.classList.toggle('bad',!ok);r.classList.toggle('good',!!v&&ok);r.textContent=!v?T('Hanya huruf dan angka, tanpa spasi atau simbol.'):ok?T('Nama tersedia!'):T('Nama harus 3–12 huruf atau angka, tanpa spasi atau simbol.')}});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target&&e.target.id==='lgName'){e.preventDefault();ACT.lgGo()}
 if(e.key==='Enter'&&e.target&&/^auP2?$|^auU$/.test(e.target.id)){e.preventDefault();const b=$('#auGo');b&&!b.disabled&&b.click()}});
