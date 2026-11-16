/* ================= KOTAK SURAT (UI) ================= */
function agoTxt(t){const m=Math.floor((Date.now()-t)/60000);if(m<1)return T('baru saja');if(m<60)return T('{n} mnt lalu',{n:m});const h=Math.floor(m/60);if(h<24)return T('{n} jam lalu',{n:h});return T('{n} hari lalu',{n:Math.floor(h/24)})}
function rwMini(r){const a=[];if(r.gems)a.push(ic('gem',13)+fmt(r.gems));if(r.gold)a.push(ic('gold',13)+fmt(r.gold));if(r.stam)a.push(ic('stam',13)+r.stam);if(r.tixH)a.push(ic('tixH',13)+r.tixH);if(r.tixW)a.push(ic('tixW',13)+r.tixW);
 if(r.hero&&HD[r.hero])a.push(`<img class="px" src="${portrait(r.hero)}">`);if(r.weapon&&WD[r.weapon])a.push(`<img class="px" src="${weaponIcon(r.weapon).url}">`);if(r.mats)for(const[k,n]of Object.entries(r.mats))a.push(ic(MD2[k].icon,14)+n);if(r.gear)[].concat(r.gear).forEach(g=>GDD[g]&&a.push(`<img class="px" src="${gearIcon(g).url}">`));if(r.pickHero)a.push(`<b class="pk">${T('★3 Pilihan')}</b>`);
 return a.map(x=>`<span>${x}</span>`).join('')}
function openMailbox(){deliverMail();const ids=mailList(),claimable=ids.filter(id=>!S.mail[id].claimed&&mailHasRw(id)&&!mailDef(id).rw.pickHero).length;
 modal(`<button class="btn red mclose" data-act="closeModal">✕</button><h3>${ic('mail',22)} ${T('Kotak Surat')}</h3><div class="sub">${T('{a} surat · {b} belum diklaim',{a:ids.length,b:mailPending()})}</div>
 <div class="mlist">${ids.length?ids.map(id=>{const o=S.mail[id],d=mailDef(id),done=o.claimed||(!mailHasRw(id)&&o.read);
  return`<button class="mitem ${done?'done':''} ${o.read?'':'unread'}" data-act="mailOpen" data-arg="${id}"><span class="env">${ic('mail',26)}${o.read?'':'<i class="dot"></i>'}</span><span class="mi"><b>${d.title}</b><small>${d.from} · ${agoTxt(o.t)}</small><span class="mrw">${rwMini(d.rw||{})}</span></span><span class="mst">${done?'✓':(d.rw&&d.rw.pickHero?T('Pilih'):T('Klaim'))}</span></button>`}).join(''):`<p class="sub">${T('Belum ada surat.')}</p>`}</div>
 <div class="mrow"><button class="btn ${claimable?'green':'gray'}" data-act="mailAll" ${claimable?'':'disabled'}>${T('Klaim Semua')}${claimable?` (${claimable})`:''}</button></div>`)}
function openMailItem(id){const o=S.mail[id],d=mailDef(id);if(!o)return;o.read=1;save();const r=d.rw||{};
 const pick=r.pickHero&&!o.claimed?pickPool(r.pickHero):null;
 modal(`<button class="btn red mclose" data-act="mail">‹</button><h3>${d.title}</h3><div class="sub">${T('Dari')} <b>${d.from}</b> · ${agoTxt(o.t)}</div>
 <div class="mbody">${d.body||''}</div>
 ${mailHasRw(id)?`<div class="sec">${T('Hadiah')}</div>${rewardHTML(r)}`:''}
 ${pick?`<div class="sec">${T('Pilih 1 hero ★3')}</div><div class="pick">${pick.map(h=>{const own=!!S.heroes[h.id];return`<button class="hcard r3 pickh" data-act="mailPick" data-arg="${id}:${h.id}">${eic(h.el)}<img class="px sp" src="${sprite({hero:h.id,base:1}).url}"><span class="stars">${stars(3)}</span>${own?'<span class="lbd">LB+1</span>':''}<span class="nm">${h.name}</span></button>`}).join('')}</div><div class="sub" style="text-align:center">${T('Hero yang sudah dimiliki akan mendapat Limit Break +1.')}</div>`:''}
 <div class="mrow">${o.claimed?`<button class="btn gray" disabled>${T('Sudah diklaim ✓')}</button>`:(pick?'':(mailHasRw(id)?`<button class="btn green" data-act="mailClaim" data-arg="${id}">${T('Klaim Hadiah')}</button>`:''))}<button class="btn blue" data-act="mail">${T('Kembali')}</button></div>`)}
function claimResultHTML(rw,got,ups){return`${rewardHTML(rw)}${got.length?`<div class="gotl">${got.map(g=>{const v=itemView(g);return`<div class="scard r${v.r} ${g.wid?'w':''}" style="opacity:1;animation:none">${tagHTML(g)}<img class="px" src="${v.img}"><span class="stars">${stars(v.r)}</span><span class="nm">${v.name}</span></div>`}).join('')}</div>`:''}${ups?`<div class="sub" style="text-align:center;color:var(--hl)">${T('Level akun naik {n}x!',{n:ups})}</div>`:''}`}
function doClaimMail(id,pick){const d=mailDef(id);if(d.rw&&d.rw.pickHero&&!pick)return openMailItem(id);
 const res=claimMail(id,pick);if(!res)return;const rw=Object.assign({},d.rw);if(pick){delete rw.pickHero}
 sfx(res.got.some(g=>itemR(g)===3)?'rare':'claim');updateTop();
 modal(`<h3>${T('Hadiah Diterima!')}</h3>${claimResultHTML(rw,res.got,res.ups)}<div class="mrow"><button class="btn blue" data-act="mail">${T('Kotak Surat')}</button><button class="btn green" data-act="closeModal">OK</button></div>`);refreshScreen()}
function doClaimAll(){const ids=mailList().filter(id=>!S.mail[id].claimed&&mailHasRw(id)&&!mailDef(id).rw.pickHero);if(!ids.length)return;
 const tot={},got=[];let ups=0;
 for(const id of ids){const r=mailDef(id).rw;for(const k of['gems','gold','stam','exp','tixH','tixW'])if(r[k])tot[k]=(tot[k]||0)+r[k];if(r.mats){tot.mats=tot.mats||{};for(const m in r.mats)tot.mats[m]=(tot.mats[m]||0)+r.mats[m]}const res=claimMail(id);if(res){got.push(...res.got);ups+=res.ups}}
 const left=mailList().filter(id=>!S.mail[id].claimed&&mailDef(id).rw&&mailDef(id).rw.pickHero).length;
 sfx('claim');updateTop();
 modal(`<h3>${T('Hadiah Diterima!')}</h3><div class="sub" style="text-align:center">${T('{n} surat diklaim',{n:ids.length})}</div>${claimResultHTML(tot,got,ups)}${left?`<div class="soon" style="margin-top:8px">${T('Masih ada <b>{n}</b> surat <b>Pilih Hero ★3</b> yang menunggu pilihanmu!',{n:left})}</div>`:''}<div class="mrow"><button class="btn blue" data-act="mail">${T('Kotak Surat')}</button><button class="btn green" data-act="closeModal">OK</button></div>`);refreshScreen()}
