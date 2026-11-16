/* ================= MISSIONS ================= */
function misTabsHTML(){const TB=[['daily',T('Harian'),MISSIONS.some(m=>!S.daily.claimed[m.id]&&m.prog()>=m.goal)],['event',T('Event'),anyEvClaimable()],['ach',T('Pencapaian'),ACH.some(a=>!S.ach[a.id]&&a.cond())]];
 return`<h2 class="st">${T('Misi')} <span>${{daily:T('Reset tiap hari'),event:T('Event & login harian'),ach:T('Pencapaian')}[misTab]}</span></h2><div class="mtabs">${TB.map(([k,n,d])=>`<button class="btn ${misTab===k?'':'blue'}" data-act="mtab" data-arg="${k}">${n}${d?'<i class="dot"></i>':''}</button>`).join('')}</div>`}
function missionHTML(){checkDaily();if(misTab==='event')return misTabsHTML()+eventsHTML();const list=misTab==='daily'?MISSIONS.map(m=>{const p=Math.min(m.goal,m.prog()),done=S.daily.claimed[m.id],ok=p>=m.goal;return{id:m.id,n:m.n,p,goal:m.goal,done,ok,rw:m.rw,act:'claimD'}}):ACH.map(a=>{const ok=a.cond(),done=S.ach[a.id];return{id:a.id,n:a.n,p:ok?1:0,goal:1,done,ok,rw:a.rw,act:'claimA'}});
 list.sort((a,b)=>(a.done-b.done)||(b.ok-a.ok));const nc=list.filter(m=>m.ok&&!m.done).length;
 return misTabsHTML()+`${nc?`<button class="btn green claimall" data-act="claimAllMis" data-arg="${misTab}">${T('Ambil Semua ({n})',{n:nc})}</button>`:''}
 ${list.map(m=>`<div class="panel mis ${m.done?'done':''}"><div class="mi"><div class="mt">${m.n}</div><div class="mp"><i style="width:${m.p/m.goal*100}%"></i></div><div class="ms"><span>${m.p}/${m.goal}</span>${rewardHTML(m.rw).replace('class="rw"','class="rw" style="margin:0;font-size:12px"')}</div></div>${m.done?`<button class="btn gray" disabled>${T('Selesai')}</button>`:m.ok?`<button class="btn green" data-act="${m.act}" data-arg="${m.id}">${T('Klaim')}</button>`:`<button class="btn gray" disabled>${T('Belum')}</button>`}</div>`).join('')}`}


// ambil semua hadiah misi harian / pencapaian / tugas event (kecuali yang perlu memilih hero)
function claimAllMis(kind){const tot={};let n=0,ups=0;const add=r=>{for(const k in r){if(k==='mats'||k==='gear')continue;if(typeof r[k]==='number')tot[k]=(tot[k]||0)+r[k]}};
 if(kind==='daily')for(const m of MISSIONS){if(S.daily.claimed[m.id]||m.prog()<m.goal)continue;S.daily.claimed[m.id]=1;ups+=grant(Object.assign({},m.rw))||0;add(m.rw);n++}
 if(kind==='ach')for(const a of ACH){if(S.ach[a.id]||!a.cond())continue;S.ach[a.id]=1;ups+=grant(Object.assign({},a.rw))||0;add(a.rw);n++}
 if(kind==='event')for(const e of EVENTS){if(!evActive(e))continue;for(const t of evTasks(e)){if(!t.ok||t.done||t.rw.pickHero)continue;const r=claimEv(e.id,t.key);if(r){add(t.rw);ups+=r.ups||0;n++}}}
 if(!n)return;save();sfx('claim');updateTop();
 const parts=[];if(tot.gems)parts.push('💎'+fmt(tot.gems));if(tot.gold)parts.push(T('{n} emas',{n:fmt(tot.gold)}));if(tot.tixH)parts.push(T('{n} Tiket Hero',{n:tot.tixH}));if(tot.tixW)parts.push(T('{n} Tiket Senjata',{n:tot.tixW}));if(tot.stam)parts.push(T('{n} stamina',{n:tot.stam}));
 toast(T('{n} hadiah diambil!',{n})+(parts.length?' '+parts.join(' · '):''));if(ups)toast(T('Level akun naik!'));refreshScreen()}
