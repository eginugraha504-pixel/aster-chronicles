/* ================= EVENT (UI) — Misi > tab Event ================= */
let evSel=null;
function leftTxt(ms){if(ms===Infinity)return T('Permanen');const d=Math.floor(ms/DAY_MS),h=Math.floor(ms%DAY_MS/36e5);return d>0?T('Berakhir dalam {d} hari {h} jam',{d,h}):T('Berakhir dalam {h} jam {m} mnt',{h,m:Math.floor(ms%36e5/6e4)})}
function evArt(e){if(e.art&&e.art.hero)return`<img class="px eah" src="${sprite({hero:e.art.hero,base:1}).url}">`;if(e.art&&e.art.weapon)return`<img class="px eaw" src="${weaponIcon(e.art.weapon).url}">`;return''}
function eventsHTML(){const list=EVENTS.filter(evActive);if(!list.length)return`<p class="sub">${T('Belum ada event aktif.')}</p>`;
 if(!evSel||!list.find(e=>e.id===evSel))evSel=(list.find(evClaimable)||list[0]).id;
 const e=ED[evSel],TK=evTasks(e),done=TK.filter(t=>t.done).length;
 const tabs=`<div class="evtabs">${list.map(x=>`<button class="evt2 ${x.id===evSel?'on':''}" data-act="evSel" data-arg="${x.id}"><span class="tg2">${x.tag||'EVENT'}</span><b>${x.n}</b>${evClaimable(x)?'<i class="dot"></i>':''}</button>`).join('')}</div>`;
 const head=`<div class="evhead ${e.id}"><div class="rays"></div>${evArt(e)}<div class="evtx"><span class="tg2">${e.tag||'EVENT'}</span><h3>${e.n}</h3><p>${e.desc}</p><div class="evmeta"><span>${ic('hourglass',13)} ${leftTxt(evLeft(e))}</span><span>✓ ${T('{a}/{b} diklaim',{a:done,b:TK.length})}</span></div></div></div>`;
 let body;
 if(e.type==='login'){
  body=`<div class="lgnote">${T('Kamu sudah login <b>{n}</b> hari. Hadiah hari berikutnya terbuka besok!',{n:S.loginDays||0})}</div><div class="lgrid">${TK.map(t=>{const st=t.done?'done':t.ok?'ok':'lock';
   return`<button class="lday ${st} ${t.big?'big':''}" ${st==='ok'?`data-act="evClaim" data-arg="${e.id}:${t.key}"`:'disabled'}><span class="ldn">${t.n}</span><span class="mrw">${rwMini(t.rw)}</span><span class="lds">${st==='done'?'✓ '+T('Diklaim'):st==='ok'?T('KLAIM!'):ic('lock',11)+' '+T('Login hari ke-{n}',{n:t.goal})}</span></button>`}).join('')}</div>`}
 else{const L=TK.slice().sort((a,b)=>(a.done-b.done)||(b.ok-a.ok));
  body=L.map(t=>`<div class="panel mis ${t.done?'done':''}"><div class="mi"><div class="mt">${t.n}</div><div class="mp"><i style="width:${t.p/t.goal*100}%"></i></div><div class="ms"><span>${fmt(t.p)}/${fmt(t.goal)}</span><span class="mrw">${rwMini(t.rw)}</span></div></div>${t.done?`<button class="btn gray" disabled>${T('Selesai')}</button>`:t.ok?`<button class="btn green" data-act="evClaim" data-arg="${e.id}:${t.key}">${T('Klaim')}</button>`:`<button class="btn gray" disabled>${T('Belum')}</button>`}</div>`).join('')}
 const nc=EVENTS.filter(evActive).reduce((a,x)=>a+evTasks(x).filter(t=>t.ok&&!t.done&&!t.rw.pickHero).length,0);
 return tabs+(nc>1?`<button class="btn green claimall" data-act="claimAllMis" data-arg="event">${T('Ambil Semua ({n})',{n:nc})}</button>`:'')+head+body}
function doClaimEv(eid,key,pick){const t=evTasks(ED[eid]).find(x=>x.key===key);if(!t)return;
 if(t.rw.pickHero&&!pick){modal(`<button class="btn red mclose" data-act="closeModal">✕</button><h3>${T('Pilih 1 Hero ★{n}',{n:t.rw.pickHero})}</h3><div class="sub">${ED[eid].n} · ${t.n}</div><div class="pick">${pickPool(t.rw.pickHero).map(h=>`<button class="hcard r3 pickh" data-act="evPick" data-arg="${eid}:${key}:${h.id}">${eic(h.el)}<img class="px sp" src="${sprite({hero:h.id,base:1}).url}"><span class="stars">${stars(h.r)}</span>${S.heroes[h.id]?'<span class="lbd">LB+1</span>':''}<span class="nm">${h.name}</span></button>`).join('')}</div><div class="sub" style="text-align:center">${T('Hero yang sudah dimiliki akan mendapat Limit Break +1.')}</div>`);return}
 const res=claimEv(eid,key,pick);if(!res)return;const rw=Object.assign({},t.rw);delete rw.pickHero;
 sfx(res.got.some(g=>itemR(g)===3)?'rare':'claim');updateTop();
 modal(`<h3>${T('Hadiah Diterima!')}</h3><div class="sub" style="text-align:center">${ED[eid].n} · ${t.n}</div>${claimResultHTML(rw,res.got,res.ups)}<div class="mrow"><button class="btn green" data-act="closeModal">OK</button></div>`);refreshScreen()}
