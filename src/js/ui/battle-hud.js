/* =====================================================================
   HUD PERTARUNGAN (cerita, dungeon, Arena) — gaya: css/battle.css
   - Medan 240×300: latar tinggi (img/bg/w_*.webp) + unit digeser BTOP ke bawah,
     langit dipakai HUD atas (plakat tahap, gelombang, waktu, jeda) & bar HP bos.
   - Kartu skill: potongan splash art hero, tabir gelap turun mengikuti isi skill,
     HP dengan jejak merah, menyala emas saat skill siap.
   - Dipanggil dari systems/battle.js & systems/arena.js: battleUI(), hudWave(), hudTick(), updBtns()
   ===================================================================== */
const BTOP=60,BFH=300;            // offset unit ke bawah & tinggi medan (satuan canvas)
// gambar latar: latar tinggi apa adanya; latar lama/prosedural (210) direntangkan tepinya
function drawBattleBg(g,st){let bg=(st.art&&bgArt('w_'+st.art))||BG[st.bg+'_b'];if(!bg)bg=BG[st.bg+'_b']=makeBG(st.bg||'grass',240,210);
 const h=bg.naturalHeight||bg.height,w=bg.naturalWidth||bg.width;if(h/w>1.15){g.drawImage(bg,0,0,240,BFH);return}
 g.drawImage(bg,0,0,w,1,0,0,240,BTOP);g.drawImage(bg,0,h-1,w,1,0,BTOP+210,240,BFH-BTOP-210);g.drawImage(bg,0,BTOP,240,210)}

function bhCard(u,i){const h=HD[u.id]||{r:1},sp=splash(u.id),fc=splashFocus(u.id);
 return`<button class="bh r${h.r}" data-act="cast" data-arg="${i}" style="--ec:${EL[u.el].c}">
 <span class="bart"${sp?` style="background-image:url(${sp});background-position:${fc[0]}% ${Math.max(0,fc[1]-2)}%"`:''}>${sp?'':`<img class="px" src="${portrait(u.id)}">`}</span>
 <span class="bveil"></span><span class="bshine"></span>
 <img class="px bel" src="${ICON.el[u.el]}">
 <span class="bfoot"><span class="bst">${'★'.repeat(h.r)}</span><b class="bnm">${u.name}</b><span class="bhp"><i class="lag"></i><i class="cur"></i></span></span>
 <span class="brdy">SKILL</span><span class="bko">${T('Gugur')}</span></button>`}
function battleUI(){const hs=B.units.filter(u=>u.side==='hero');$('#bHeroes').innerHTML=hs.map(bhCard).join('');
 B.cards=[...$('#bHeroes').children];B.cards.forEach((c,k)=>c.style.animationDelay=(k*.07)+'s');B.hud={};updBtns();hudWave();$('#bBoss').innerHTML='';$('#bBoss').className='bboss';
 $('#bOver').classList.remove('on');$('#battle').classList.add('on');$('#battle').classList.toggle('arena',!!B.st.arena)}
// titik gelombang (bos = mahkota) atau label Arena
function hudWave(){const e=$('#bWave');if(!e||!B)return;if(B.st.arena){e.innerHTML=`<span class="bvs">VS</span>`;return}
 const W=B.st.waves;e.innerHTML=`<small>${T('Gelombang')}</small><span class="pips">${W.map((w,i)=>`<i class="${i<B.wave?'done':i===B.wave?'cur':''}${w.some(d=>d.boss)?' boss':''}"></i>`).join('')}</span>`}
function updBtns(){const a=$('#bAuto'),s=$('#bSpd');if(!a||!B)return;
 a.className='bcb auto'+(B.auto?' on':'');a.innerHTML=`<span class="ico"></span><b>AUTO</b>`;
 s.className='bcb spd s'+B.speed;s.innerHTML=`<span class="chev">${'›'.repeat(B.speed)}</span><b>x${B.speed}</b>`;
 const h=$('#bHint');if(h)h.textContent=B.auto?T('Skill dipakai otomatis'):T('Ketuk kartu menyala untuk skill')}
const pct=(a,b)=>Math.max(0,Math.min(100,a/Math.max(1,b)*100));
// bar dengan jejak: cur langsung, lag menyusul pelan (CSS transition)
function setBar(el,p){if(!el)return;const c=el.querySelector('.cur'),l=el.querySelector('.lag');if(c)c.style.width=p+'%';if(l)l.style.width=p+'%'}
function hudTick(){if(!B||!B.cards)return;const H=B.hud||(B.hud={});
 B.units.filter(u=>u.side==='hero').forEach((u,i)=>{const c=B.cards[i];if(!c)return;const hp=Math.round(pct(u.hp,u.maxHp)*2)/2,ch=Math.round(Math.min(100,u.charge)),rd=u.alive&&u.charge>=100,k=hp+'|'+ch+'|'+rd+'|'+u.alive;
  if(H[i]===k)return;H[i]=k;setBar(c.querySelector('.bhp'),hp);c.style.setProperty('--ch',ch);c.classList.toggle('ready',rd);c.classList.toggle('dead',!u.alive);c.classList.toggle('low',u.alive&&hp<30)});
 // bar atas: bos (cerita) atau kedua tim (Arena)
 const bb=$('#bBoss');if(bb){let key,html=null;
  if(B.st.arena){const sum=s=>B.units.filter(u=>u.side===s).reduce((a,u)=>[a[0]+Math.max(0,u.hp),a[1]+u.maxHp],[0,0]),A=sum('hero'),E=sum('enemy'),r=typeof arRage==='function'?arRage():1;
   key='ar';if(H.bb!==key){H.bb=key;bb.className='bboss on ar';bb.innerHTML=`<div class="tb tme"><b>${esc(S.name)}</b><span class="bbar"><i class="lag"></i><i class="cur"></i></span></div><div class="rg"></div><div class="tb top"><b>${esc((B.ar&&B.ar.name)||'')}</b><span class="bbar"><i class="lag"></i><i class="cur"></i></span></div>`}
   setBar(bb.querySelector('.tme .bbar'),pct(A[0],A[1]));setBar(bb.querySelector('.top .bbar'),pct(E[0],E[1]));const rg=bb.querySelector('.rg');const rt=r>1?'ATK ×'+r.toFixed(1):'';if(rg.textContent!==rt){rg.textContent=rt;rg.classList.toggle('on',r>1)}}
  else{const boss=B.units.find(u=>u.side==='enemy'&&u.boss&&(u.alive||u.deathT>0));
   if(boss){key='b'+boss.i+B.wave;if(H.bb!==key){H.bb=key;bb.className='bboss on boss';bb.innerHTML=`<div class="bbn"><img class="px" src="${ICON.el[boss.el]}"><b>${boss.name}</b><small>BOSS</small></div><span class="bbar big"><i class="lag"></i><i class="cur"></i><em></em></span>`}
    const p=pct(boss.hp,boss.maxHp);setBar(bb.querySelector('.bbar'),p);const em=bb.querySelector('em'),t=Math.ceil(p)+'%';if(em.textContent!==t)em.textContent=t}
   else if(H.bb){H.bb=null;bb.className='bboss'}}}
 const s=Math.floor(B.time),tt=Math.floor(s/60)+':'+String(s%60).padStart(2,'0');if(H.t!==tt){H.t=tt;$('#bTime').textContent=tt;
  const lim=B.st.arena?(B.limit||ARENA_CFG.limit):0;$('#bTime').classList.toggle('warn',!!lim&&B.time>lim-15)}}
// jeda: panel dengan info tahap, keunggulan elemen, menyerah/lanjut
function pauseHTML(){const st=B.st;return`<div class="panel bpause"><h3>${T('Jeda')}</h3>
 <div class="bpinfo"><b>${esc($('#bTitle').textContent)}</b><small>${esc($('#bSub').textContent)}</small></div>
 <div class="belg"><b>${T('Keunggulan Elemen')}</b><span>${['api','tanah','air','api'].map(e=>`<img class="px" src="${ICON.el[e]}">`).join('<i>›</i>')}</span><span><img class="px" src="${ICON.el.cahaya}"><i>⇄</i><img class="px" src="${ICON.el.gelap}"></span><small>${T('Unggul: +30% damage · Kalah: −25%')}</small></div>
 <div class="mrow"><button class="btn red" data-act="bquit">${T('Menyerah')}</button><button class="btn green" data-act="bresume">${T('Lanjut')}</button></div></div>`}
// MVP pertarungan (damage + pulih terbanyak di pihakmu)
function battleMVP(b){return b.units.filter(u=>u.side==='hero').sort((x,y)=>(y.dmg||0)+(y.healed||0)-(x.dmg||0)-(x.healed||0))[0]}
function mvpHTML(u){if(!u)return'';const sp=splash(u.id),fc=splashFocus(u.id);
 return`<div class="rmvp">${sp?`<span class="rmart" style="background-image:url(${sp});background-position:${fc[0]}% ${Math.max(0,fc[1]-4)}%"></span>`:`<img class="px" src="${portrait(u.id)}">`}<div><em>MVP</em><b>${u.name}</b><small>${fmt(u.dmg||0)} ${T('damage')}${u.healed?` · ${fmt(u.healed)} ${T('pulih')}`:''}</small></div></div>`}
// kartu berkedip saat skill dipakai
function hudCast(u){const i=B.units.filter(x=>x.side==='hero').indexOf(u),c=B.cards&&B.cards[i];if(!c)return;c.classList.remove('cast');void c.offsetWidth;c.classList.add('cast')}
