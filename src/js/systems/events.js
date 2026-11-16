/* =====================================================================
   SISTEM EVENT — progres, klaim, masa berlaku
   S.ev[eventId] = {start, cnt:{summon,clear,...}, claimed:{key:1}}
   ===================================================================== */
const ED={};EVENTS.forEach(e=>ED[e.id]=e);
function evState(id){if(!S.ev)S.ev={};if(!S.ev[id])S.ev[id]={start:Date.now(),cnt:{},claimed:{}};return S.ev[id]}
const DAY_MS=864e5;
const evLeft=e=>e.dur?evState(e.id).start+e.dur*DAY_MS-Date.now():Infinity;
const evActive=e=>evLeft(e)>0;
// hitung aktivitas pemain untuk semua event aktif
function evCount(k,n=1){for(const e of EVENTS)if(evActive(e)){const c=evState(e.id).cnt;c[k]=(c[k]||0)+n}}
// daftar tugas event dalam bentuk seragam {key,n,p,goal,ok,done,rw}
function evTasks(e){const st=evState(e.id);
 if(e.type==='login')return e.days.map((d,i)=>{const k='d'+(i+1);return{key:k,n:T('Hari ke-{n}',{n:i+1}),p:Math.min(i+1,S.loginDays||0),goal:i+1,ok:(S.loginDays||0)>=i+1,done:!!st.claimed[k],rw:d.rw,big:d.big}});
 return e.missions.map(m=>{let p=0;try{p=m.cnt?(st.cnt[m.cnt]||0):m.prog()}catch(x){}p=Math.min(m.goal,p);return{key:m.id,n:m.n,p,goal:m.goal,ok:p>=m.goal,done:!!st.claimed[m.id],rw:m.rw}})}
const evClaimable=e=>evActive(e)&&evTasks(e).some(t=>t.ok&&!t.done);
const anyEvClaimable=()=>EVENTS.some(evClaimable);
function claimEv(eid,key,pick){const e=ED[eid];if(!e||!evActive(e))return null;const t=evTasks(e).find(x=>x.key===key);if(!t||!t.ok||t.done)return null;
 const r=Object.assign({},t.rw);if(r.pickHero){if(!pick||!pickPool(r.pickHero).some(h=>h.id===pick))return null;delete r.pickHero;r.hero=pick}
 evState(eid).claimed[key]=1;const res=grantRw(r);save();return res}
