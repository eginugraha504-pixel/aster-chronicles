/* =====================================================================
   BOS DUNIA — tampilan: pil di beranda, panel raid, HUD pertarungan (bar HP bersama, papan damage samping,
   notifikasi salip-menyalip, hitung mundur bangkit), layar hasil, latar & BGM beranda saat raid.
   Gaya: css/worldboss.css · Logika: systems/worldboss.js
   ===================================================================== */
ICON.wb=pxIcon(K=>{K.rect(3,3,10,9,'#4a4a5a');K.rect(4,4,8,7,'#8a8a9a');K.rect(2,2,2,3,'#d8d8e0');K.rect(12,2,2,3,'#d8d8e0');K.rect(5,6,2,2,'#ff4f4f');K.rect(9,6,2,2,'#ff4f4f');K.rect(6,10,4,1,'#2a2a34');K.rect(5,12,6,2,'#4a4a5a')});
const mmss=ms=>{const s=Math.max(0,Math.ceil(ms/1000));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
const wbDur=ms=>{const m=Math.ceil(ms/6e4);return m>=60?T('{h} jam {m} menit',{h:Math.floor(m/60),m:m%60}):T('{m} menit',{m})};
const hhmm=t=>{const d=new Date(t+BOT_CFG.TZ*36e5);return String(d.getUTCHours()).padStart(2,'0')+':'+String(d.getUTCMinutes()).padStart(2,'0')};
const wbMode=(now=Date.now())=>{if(!wbOpen())return false;const c=wbCur(now);return(c.st==='pre'||c.st==='live')&&!(c.st==='live'&&wbState(c.t0,now).dead)};

/* ---------- beranda ---------- */
function wbPillHTML(){if(!wbOpen())return'';const now=Date.now(),c=wbCur(now);
 if(c.st==='idle')return`<button class="wbpill idle" data-act="wbPanel"><img class="ix" src="${ICON.wb}" alt=""><b>${T('Bos Dunia')}</b><span>${T('berikutnya {t}',{t:hhmm(c.next)})}</span></button>`;
 const bs=wbBoss(c.t0);
 if(c.st==='pre')return`<button class="wbpill pre" data-act="wbPanel"><img class="ix" src="${ICON.wb}" alt=""><b>${T(bs.n)}</b><span>${T('muncul {t}',{t:mmss(c.t0-now)})}</span></button>`;
 const st=wbState(c.t0,now);
 if(c.st==='live'&&!st.dead)return`<button class="wbpill live" data-act="wbPanel"><img class="ix" src="${ICON.wb}" alt=""><b>${T(bs.n)}</b><span>${mmss(wbEnd(c.t0)-now)} · HP ${Math.ceil(st.p*100)}%</span><em>${T('SERBU')}</em></button>`;
 return`<button class="wbpill done" data-act="wbPanel"><img class="ix" src="${ICON.wb}" alt=""><b>${T(bs.n)}</b><span>${st.dead?T('tumbang · lihat hasil'):T('kabur · lihat hasil')}</span></button>`}

/* ---------- panel raid ---------- */
function wbDragonImg(boss){const s=wbStrip(boss.tint);if(!s)return'';const c=document.createElement('canvas');c.width=WBD_FW;c.height=WBD_FH;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
 g.translate(WBD_FW,0);g.scale(-1,1);g.drawImage(s,2*WBD_FW,0,WBD_FW,WBD_FH,0,0,WBD_FW,WBD_FH);return c.toDataURL()}
const WBIMG={};
function wbRowHTML(e,k){return`<div class="wbr${e.me?' me':''}"><i>${e.rank}</i><b>${esc(e.name)}</b><span>${fmt(e.dmg??e.pts)}</span></div>`}
function mname(k){const m=(typeof MD2!=='undefined'&&MD2[k])||(typeof MATERIALS!=='undefined'&&MATERIALS.find&&MATERIALS.find(x=>x.id===k));return m?T(m.n):k}
function wbLastT0(now){let best=null;for(const k of Object.keys((S.wb&&S.wb.log)||{}))if(+k<=now&&(best==null||+k>best))best=+k;const d=wibDay(now);for(const dd of[d-1,d])for(const h of WB_CFG.slots){const t0=wbSlotT(dd,h);if(wbEnd(t0)<=now&&(best==null||t0>best))best=t0}return best}
function wbWeekHTML(){const b=wbWeekBoard(wbWeek(Date.now()));return`<button class="btn red mclose" data-act="closeModal">✕</button><h3>${T('Pemburu Naga Minggu Ini')}</h3><p class="wbnote">${T('Poin = total damage di semua raid minggu ini (Senin–Minggu). Hadiah dikirim Senin pagi.')}</p>
 <div class="wblist">${b.L.slice(0,30).map(wbRowHTML).join('')}${b.me&&b.me.rank>30?`<div class="wbr gap">…</div>`+wbRowHTML(b.me):''}</div>`}
/* ---------- halaman menu (Petualangan › Bos Dunia) ---------- */
const wbDay=t=>{const d=wibDay(t)-wibDay(Date.now());return d===0?T('Hari ini'):d===1?T('Besok'):d===-1?T('Kemarin'):''};
function wbHeroCard(bs,extra){const bimg=WBIMG[bs.id]||(WBIMG[bs.id]=wbDragonImg(bs)),weak=Object.keys(EL).filter(e=>elMult(e,bs.el)>1);
 return`<div class="wbhero" style="--ec:${EL[bs.el].c}">${bimg?`<img class="px wbimg" src="${bimg}" alt="">`:''}<div class="wbhi"><small>${extra||T('BOS DUNIA')}</small><b>${T(bs.n)}</b>
  <span>${eic(bs.el,14)} ${T(EL[bs.el].n)} · ${T('Lemah terhadap')} ${weak.map(e=>eic(e,14)).join(' ')}</span></div></div>`}
function wbLiveHTML(){const now=Date.now(),c=wbCur(now);
 if(c.st==='idle'){const bs=wbBoss(c.next),lt=wbLastT0(now);let last='';
  if(lt&&lt>=WB_CFG.from){const st=wbState(lt,now),L=S.wb&&S.wb.log[lt];last=`<p class="wbnote">${T('Raid terakhir ({t}): {b} {r}',{t:hhmm(lt),b:T(wbBoss(lt).n),r:st.dead?T('tumbang'):T('kabur')})}${L&&L.rank?' · '+T('kamu #{r}',{r:L.rank}):''}</p>`}
  return`${wbHeroCard(bs,T('BERIKUTNYA · {d} {t}',{d:wbDay(c.next),t:hhmm(c.next)}))}<div class="wbbig"><small>${T('Muncul dalam')}</small><b>${wbDur(c.next-now)}</b><span>${T('Bot & pemain mulai berkumpul 10 menit sebelumnya.')}</span></div>${last}`}
 const bs=wbBoss(c.t0);
 if(c.st==='pre')return`${wbHeroCard(bs,T('SEGERA MUNCUL'))}<div class="wbbig pre"><small>${T('Muncul dalam')}</small><b>${mmss(c.t0-now)}</b><span>${T('Siapkan tim dengan elemen yang unggul!')}</span></div>`;
 const b=wbBoard(c.t0,now),st=b.st,top=b.L.slice(0,5),live=c.st==='live'&&!st.dead,pc=b.me?b.me.dmg/st.hp*100:0,cb=b.me?wbContrib(pc,b.L.length):null;
 return`${wbHeroCard(bs,live?T('SEDANG BERLANGSUNG'):T('HASIL RAID'))}
  <div class="wbbar"><span class="bbar big"><i class="cur" style="width:${st.p*100}%"></i><em>${Math.ceil(st.p*100)}%</em></span><small>${st.dead?T('TUMBANG'):st.escaped?T('KABUR'):T(WB_PH[st.ph].n)} · ${fmt(Math.round(st.left))} / ${fmt(st.hp)} HP${live?' · '+mmss(wbEnd(c.t0)-now):''}</small></div>
  ${live?`<div class="mrow"><button class="btn red wbgo" data-act="wbGo">${T('SERBU!')}</button></div>`:''}
  <div class="wblist">${top.map(wbRowHTML).join('')}${b.me&&b.me.rank>5?`<div class="wbr gap">…</div>`+wbRowHTML(b.me):''}</div>
  ${b.me?`<p class="wbnote">${T('Kontribusimu {p}% HP bos (rata-rata {a}%).',{p:pc.toFixed(2),a:wbAvgPct(b.L.length).toFixed(2)})}${cb?' '+T('Peti {c}',{c:T(cb.n)}):''}</p>`:''}
  <div class="mrow"><button class="btn blue sm" data-act="wbFull" data-arg="${c.t0}">${T('Peringkat lengkap ({n})',{n:b.L.length})}</button></div>`}
function wbSchedHTML(){const now=Date.now(),d=wibDay(now),c=wbCur(now),rows=[];
 for(const dd of[d,d+1])for(const h of WB_CFG.slots){const t0=wbSlotT(dd,h);if(t0<WB_CFG.from)continue;const bs=wbBoss(t0),L=S.wb&&S.wb.log[t0];let stt,cls='';
  if(now>=wbEnd(t0)){const st=wbState(t0,now);stt=(st.dead?T('Tumbang'):T('Kabur'))+(L&&L.rank?` · #${L.rank}`:'');cls='past'}
  else if(now>=t0){const st=wbState(t0,now);stt=st.dead?T('Tumbang'):T('Berlangsung');cls=st.dead?'past':'live'}
  else if(now>=t0-WB_CFG.pre){stt=T('Segera');cls='pre'}else stt=T('dalam {t}',{t:wbDur(t0-now)});
  rows.push(`<div class="wbsl ${cls}${c.t0===t0?' cur':''}" style="--ec:${EL[bs.el].c}"><span class="wbst"><small>${wbDay(t0)}</small><b>${hhmm(t0)}</b></span>${eic(bs.el,18)}<b class="wbsn">${T(bs.n)}</b><em>${stt}</em></div>`)}
 return rows.join('')}
function wbDexHTML(){return WB_BOSS.map(bs=>{const bimg=WBIMG[bs.id]||(WBIMG[bs.id]=wbDragonImg(bs)),weak=Object.keys(EL).filter(e=>elMult(e,bs.el)>1);
 return`<div class="wbdx" style="--ec:${EL[bs.el].c}">${bimg?`<img class="px" src="${bimg}" alt="">`:''}<div><b>${T(bs.n)}</b><span>${eic(bs.el,13)} ${T(EL[bs.el].n)} · ${T('Lemah')} ${weak.map(e=>eic(e,13)).join(' ')}</span><small>${T('Jurus')}: ${T(bs.sk)}</small><p>${T(bs.d)}</p></div></div>`}).join('')}
function wbMenuHTML(){const now=Date.now(),wk=wbWeek(now),my=S.wb&&S.wb.wk&&S.wb.wk.id===wk?S.wb.wk.pts:0;
 const tb=(r)=>{const o=[];if(r.gems)o.push(`${ic('gem',12)}${fmt(r.gems)}`);if(r.gold)o.push(`${ic('gold',12)}${fmt(r.gold)}`);for(const k in r)if(!['gems','gold'].includes(k))o.push(`${mname(k)} ×${r[k]}`);return o.join(' · ')};
 const rl=['#1','#2','#3','#4–10',T('#11 ke bawah')],wl=['#1','#2','#3','#4–10','#11–50'];
 const ttl=S.wb&&S.wb.title&&S.wb.title.until>now?`<p class="wbtitle">👑 ${esc(S.wb.title.n)}</p>`:'';
 return`${advModeHTML()}<div class="wbmenu">${ttl}<div class="panel wbpn" id="wbLive">${wbLiveHTML()}</div>
 <div class="sec">${T('Jadwal')} <small>${T('setiap hari, 10 menit')}</small></div><div class="wbsched" id="wbSched">${wbSchedHTML()}</div>
 <div class="sec">${T('Wujud Naga')} <small>${T('bergilir tiap jadwal')}</small></div><div class="wbdex">${wbDexHTML()}</div>
 <div class="sec">${T('Fase')}</div><div class="panel wbpn"><div class="wbphs">${WB_PH.map((p,k)=>`<div><b>${k?Math.round(WB_CFG.ph[k-1]*100)+'%':'100%'}</b><span><em>${T(p.n)}</em> ${T(WB_PH_D[k])}</span></div>`).join('')}</div>
 </div><div class="sec">${T('Aturan')}</div><div class="panel wbpn"><ul class="wbrules"><li>${T('Satu bar HP untuk semua pemain. Damage-mu langsung mengurangi HP naga.')}</li><li>${T('Tim tumbang bangkit lagi setelah {n} detik. Tidak memakai stamina.',{n:WB_CFG.respawn})}</li><li>${T('Kecepatan pertarungan ×1 (waktu nyata).')}</li><li>${T('Kalau waktu habis, naga kabur dan hadiah dipotong setengah.')}</li></ul>
 <details class="wbrw"><summary>${T('Hadiah per raid')}</summary>${WB_RW.rank.map((x,k)=>`<div><b>${rl[k]}</b><span>${tb(x.rw)}</span></div>`).join('')}
  ${WB_RW.contrib.slice().reverse().map(x=>`<div><b>${T(x.n)}</b><span>${T('damage ≥ {k}× rata-rata',{k:String(x.k).replace('.',',')})}: ${tb(x.rw)}</span></div>`).join('')}<div><b>${T('Pukulan terakhir')}</b><span>${tb(WB_RW.last)}</span></div></details>
 <details class="wbrw"><summary>${T('Mingguan · Poin Pemburu')} <small>${fmt(Math.round(my))}</small></summary>${WB_RW.week.map((x,k)=>`<div><b>${wl[k]}</b><span>${tb(x.rw)}</span></div>`).join('')}<button class="btn blue sm" data-act="wbWeekView">${T('Lihat peringkat minggu ini')}</button></details></div></div>`}
function wbMenuOpen(){const c=wbCur();if(c.st==='live'||c.st==='after')wbPull(c.t0,true).then(wbMenuRefresh)}
function wbMenuRefresh(){if(B||tab!=='adv'||advTab!=='wb')return;const l=$('#wbLive');if(l){const h=wbLiveHTML();if(l.innerHTML!==h)l.innerHTML=h}const s=$('#wbSched');if(s){const h=wbSchedHTML();if(s.innerHTML!==h)s.innerHTML=h}}
function wbFullHTML(t0){const b=wbBoard(t0);return`<button class="btn red mclose" data-act="closeModal">✕</button><h3>${T('Peringkat Damage')}</h3><p class="wbnote">${T(wbBoss(t0).n)} · ${wbDay(t0)} ${hhmm(t0)}</p><div class="wblist">${b.L.slice(0,100).map(wbRowHTML).join('')}${b.me&&b.me.rank>100?`<div class="wbr gap">…</div>`+wbRowHTML(b.me):''}</div>`}
Object.assign(ACT,{
 wbPanel:()=>{closeModal();if(!wbOpen())return toast(T('Bos Dunia terbuka di Lv {n}.',{n:WB_CFG.lv}),1);tab='adv';advTab='wb';render();wbMenuOpen()},
 wbGo:()=>wbStart(),
 wbFull:t=>modalKeep('wbf',wbFullHTML(+t)),
 wbWeekView:()=>modalKeep('wbw',wbWeekHTML())});

/* ---------- HUD pertarungan ---------- */
function wbHudInit(){const w=$('.bcw');for(const id of['wbSide','wbNotes','wbDownO']){let e=$('#'+id);if(!B||!B.st.wb){if(e)e.remove();continue}if(!e){e=document.createElement('div');e.id=id;w.appendChild(e)}e.innerHTML=''}}
function wbHudBar(bb,H){const st=B.wbSt,boss=B.units.find(u=>u.wb);if(!boss)return;
 if(H.bb!=='wb'){H.bb='wb';bb.className='bboss on boss wbb';bb.innerHTML=`<div class="bbn"><img class="px" src="${ICON.el[boss.el]}"><b>${boss.name}</b><small class="wbph"></small></div><span class="bbar big"><i class="lag"></i><i class="cur"></i><em></em></span>`}
 if(!st)return;const p=st.p*100;setBar(bb.querySelector('.bbar'),p);const em=bb.querySelector('em'),t=(p<1&&p>0?p.toFixed(1):Math.ceil(p))+'%';if(em.textContent!==t)em.textContent=t;
 const ph=(WB_PH[st.ph]||WB_PH[0]).n;const pe=bb.querySelector('.wbph');if(pe.textContent!==ph)pe.textContent=ph;
 const d=$('#wbDownO');if(d){const on=B.state==='down',txt=on?Math.ceil(B.downT):'';if(d.dataset.t!==String(txt)){d.dataset.t=txt;d.className=on?'on':'';d.innerHTML=on?`<small>${T('Tim tumbang')}</small><b>${txt}</b><span>${T('bangkit lagi…')}</span>`:''}}}
function wbSideRender(){const el=$('#wbSide');if(!el||!B||!B.st.wb)return;const b=wbBoard(B.wbT0),top=b.L.slice(0,6),me=b.me;
 el.innerHTML=`<div class="wbsh">${T('DAMAGE')}</div>${top.map(e=>`<div class="wbsr${e.me?' me':''}"><i>${e.rank}</i><b>${esc(e.name)}</b><span>${e.dn?`<em class="wbdn">↻${e.dn}</em>`:''}${fmtS(e.dmg)}</span></div>`).join('')}${me&&me.rank>6?`<div class="wbsr me"><i>${me.rank}</i><b>${esc(me.name)}</b><span>${fmtS(me.dmg)}</span></div>`:''}`;
 if(me){const prev=B.wbRank;B.wbRank=me.rank;if(prev&&me.rank!==prev&&me.rank<=30){if(me.rank>prev){const by=b.L[me.rank-2];wbNote(T('Disalip {n}! #{a} → #{b}',{n:by?by.name:'?',a:prev,b:me.rank}),'down')}else wbNote(T('Naik ke #{b}!',{b:me.rank}),'up')}}}
const fmtS=n=>n>=1e9?(n/1e9).toFixed(1)+'M':n>=1e6?(n/1e6).toFixed(1)+'jt':n>=1e4?Math.round(n/1e3)+'rb':fmt(Math.round(n));
function wbNote(msg,kind){const el=$('#wbNotes');if(!el)return;const d=document.createElement('div');d.className='wbn '+(kind||'');d.textContent=msg;el.appendChild(d);while(el.children.length>3)el.firstChild.remove();setTimeout(()=>d.remove(),3200)}
function wbEndUI(win){const t0=B.wbT0,b=wbBoard(t0),me=b.me,st=b.st,bs=wbBoss(t0),pct=me?me.dmg/st.hp*100:0,esc_=!win;
 const rw=me&&me.dmg?wbRewardOf(me.rank,pct,esc_&&!st.dead,false,b.L.length):null,cb=me?wbContrib(pct,b.L.length):null;sfx(win?'win':'lose');
 const html=`<div class="panel res ${win?'win':'lose'} wbres"><div class="rrib"><h3>${win?T('{b} TUMBANG!',{b:T(bs.n)}):T('NAGA KABUR!')}</h3></div>
  <div class="wbsum"><div><small>${T('Damage kamu')}</small><b>${fmt(me?me.dmg:0)}</b></div><div><small>${T('Peringkat')}</small><b>#${me?me.rank:'-'}</b><span>${T('dari {n}',{n:b.L.length})}</span></div><div><small>${T('Kontribusi')}</small><b>${pct.toFixed(pct<1?2:1)}%</b>${cb?`<span>${T('Peti {c}',{c:T(cb.n)})}</span>`:''}</div></div>
  ${mvpHTML(battleMVP(B))}${rw?`<div class="sec">${T('Perkiraan hadiah')}</div>${rewardHTML(rw)}`:''}<p class="rtip">${T('Hadiah final dikirim ke Kotak Surat begitu raid selesai.')}${win?'':' '+T('Bos kabur: hadiah dipotong setengah.')}</p>
  <div class="mrow"><button class="btn blue" data-act="bexit">${T('Kembali')}</button></div></div>`;
 const o=$('#bOver');o.innerHTML=html;o.classList.add('on')}

/* ---------- detak 1 detik: sinkron server, beranda, BGM, hadiah, obrolan ---------- */
let WB_LAST_MODE=null,WB_EV={};
function wbTick(){if(!S||!S.named||(typeof watchMode==='function'&&watchMode()))return;const now=Date.now();if(!wbOpen())return;const c=wbCur(now),mode=wbMode(now);
 if(c.st==='live'||c.st==='after'){const watching=(B&&B.st.wb)||(tab==='adv'&&advTab==='wb');
  if(watching||now-WB.sync>25000)wbPull(c.t0,watching);if(B&&B.st.wb){wbPush(c.t0);if(now%1000<1000)wbSideRender()}}
 // beranda: pil, latar & BGM
 if(!B&&tab==='home'){const p=$('#wbPill');if(p){const h=wbPillHTML();if(p.innerHTML!==h)p.innerHTML=h}if(mode!==WB_LAST_MODE&&WB_LAST_MODE!==null)render()}
 WB_LAST_MODE=mode;
 if(!B&&typeof BGM!=='undefined'&&(BGM.want==='game'||BGM.want==='wb')&&!(typeof SP!=='undefined'&&SP)){const w=mode?'wb':'game';if(BGM.want!==w)bgmPlay(w)}
 if(!B&&tab==='adv'&&advTab==='wb')wbMenuRefresh();
 // momen besar → obrolan dunia ikut heboh (sekali per raid per momen, server menyaring ganda)
 if(c.st==='pre'||c.st==='live'){const st=c.st==='live'?wbState(c.t0,now):null,k=wbKey(c.t0);
  const ev=c.st==='pre'?(c.t0-now<4*6e4?'pre':null):st.dead?'kill':st.p<=.1?'low':st.ph>=2?'half':now-c.t0<90e3?'start':null;
  if(ev&&WB_EV[k+ev]!==1){WB_EV[k+ev]=1;WB.ev={k,ev,boss:wbBoss(c.t0).n,el:wbBoss(c.t0).el,p:st?Math.round(st.p*100):100}}}
 else if(c.st==='after'){const k=wbKey(c.t0);if(WB_EV[k+'end']!==1){WB_EV[k+'end']=1;const st=wbState(c.t0,now);if(!st.dead)WB.ev={k,ev:'escape',boss:wbBoss(c.t0).n,el:wbBoss(c.t0).el,p:Math.round(st.p*100)}}}
 if(WB.ev&&typeof WC!=='undefined'&&WC.aiNext>now+4000)WC.aiNext=now+1500;
 if(now%5000<1000)wbSettle()}
// bgm beranda yang sesuai (dipanggil saat kembali ke beranda)
function bgmHome(){if(typeof bgmPlay==='function')bgmPlay(wbMode()?'wb':'game')}
setInterval(()=>{try{wbTick()}catch(e){console.error(e)}},1000);
