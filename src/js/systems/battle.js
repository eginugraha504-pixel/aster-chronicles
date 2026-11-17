/* ================= BATTLE ================= */
let B=null;
const HPOS=[[86,140],[86,184],[46,128],[46,172]],EPOS=[[160,140],[160,184],[200,128],[200,172]];
const isHU=u=>u.side==='hero'||!!u.ph;  // unit berwujud hero (termasuk hero lawan di Arena)
const uh=u=>isHU(u)?34:((ENEMY[u.etype]||{}).h||28)*u.scale;
function mkUnit(side,o){return Object.assign({side,alive:true,cd:.4+Math.random()*.8,charge:side==='hero'?30:0,lungeT:0,hitT:0,deathT:0,shieldT:0,tauntT:0,atkUpT:0,ox:0,scale:1},o)}
function startBattle(key){const st=STAGES[key];const ids=S.team.filter(Boolean);if(!ids.length)return toast(T('Tim kosong! Pilih hero dulu.'),1);regen();if(S.stam<st.cost)return toast(T('Stamina tidak cukup!'),1);
 S.stam-=st.cost;save();closeModal();lobby=null;
 const ord=ids.slice().sort((a,b)=>ROLE[HD[b].role].melee-ROLE[HD[a].role].melee);
 B={st,wave:0,time:0,units:[],proj:[],fx:[],texts:[],pend:[],state:'enter',enterT:1,auto:S.auto,speed:S.speed,paused:false,shake:0,flash:0,flashC:'#fff',g:$('#bc').getContext('2d'),nextT:0};
 if(!BG[st.bg+'_b'])BG[st.bg+'_b']=makeBG(st.bg,240,210);if(st.art)bgArt('w_'+st.art);
 ord.forEach((id,i)=>{const h=HD[id],s=heroStats(id);B.units.push(mkUnit('hero',{id,i,name:h.name,el:h.el,role:h.role,skill:h.skill,sk:h.sk,mult:h.mult,spr:sprite(h.spr),hp:s.hp,maxHp:s.hp,atk:s.atk,def:s.def,crit:s.crit,sig:s.sig,x:HPOS[i][0],y:HPOS[i][1],cdMax:1.25*ROLE[h.role].cd}))});
 spawnWave();
 $('#bTitle').textContent=st.dg?st.name:st.key+' '+st.name;$('#bSub').textContent=st.dg?T('Dungeon'):WORLDS[st.wi].n;
 battleUI();banner(T('Gelombang {a}/{b}',{a:1,b:st.waves.length}));sfx('start')}
// kartu hero, tombol & HUD: ui/battle-hud.js (battleUI, hudWave, hudTick, updBtns)
function spawnWave(){const st=B.st,w=st.waves[B.wave],n=st.n;B.units=B.units.filter(u=>u.side==='hero');
 w.forEach((d,i)=>{const E=ENEMY[d.t];const g=diffG(n);let hp=DIFF.hp*g*E.hp,atk=DIFF.atk*Math.pow(g,DIFF.atkExp)*E.atk,def=DIFF.def*Math.sqrt(g)*E.def;if(d.boss){hp*=BOSS_MUL.hp;atk*=BOSS_MUL.atk;def*=BOSS_MUL.def}
  const p=d.boss?[186,180]:EPOS[(w[0].boss?i+1:i)%4];B.units.push(mkUnit('enemy',{i,name:E.n,el:d.el,role:E.role,boss:!!d.boss,spr:sprite(E.spr(d.el)),hp:Math.round(hp),maxHp:Math.round(hp),atk:Math.round(atk),def:Math.round(def),x:p[0],y:p[1],ox:110+i*14,cdMax:(d.boss?1.6:1.4)*ROLE[E.role].cd,etype:d.t,scale:d.boss?2:1,skill:d.boss?'aoe':null,mult:1.7,sk:d.boss?T(pick(['Hantaman Murka','Gempa Kegelapan','Raungan Penguasa'])):''}))});
 B.state='enter';B.enterT=1;hudWave()}
// jeda antar gelombang: hero yang masih hidup pulih WAVE_HEAL × HP maks
function waveHeal(){for(const u of alive('hero')){const h=Math.round(u.maxHp*WAVE_HEAL),add=Math.min(h,u.maxHp-u.hp);if(add>0){u.hp+=add;addText(u.x,u.y-uh(u)-4,'+'+fmt(add),'#7dff9a')}}}
function banner(t){if(B&&B.sim)return;const b=$('#bbanner');b.textContent=t;b.classList.remove('on');void b.offsetWidth;b.classList.add('on')}
const alive=side=>B.units.filter(u=>u.side===side&&u.alive);
function target(u){const foes=alive(u.side==='hero'?'enemy':'hero');if(!foes.length)return null;
 const t=foes.filter(f=>f.tauntT>0);if(t.length)return pick(t);
 // pemanah/penyihir: hero mengincar HP terendah; musuh hanya 45% (sisanya acak) supaya tim tanpa healer tidak langsung runtuh berantai
 if(u.role==='ranger'&&(isHU(u)||Math.random()<ENEMY_FOCUS))return foes.slice().sort((a,b)=>a.hp-b.hp)[0];
 if(u.role==='ranger')return pick(foes);
 if(u.side==='hero'){const mn=Math.min(...foes.map(f=>f.x));return pick(foes.filter(f=>f.x===mn))}
 const mx=Math.max(...foes.map(f=>f.x));const front=foes.filter(f=>f.x===mx);return u.ph||Math.random()<.75?pick(front):pick(foes)}
function addText(x,y,t,c,big){B.texts.push({x:x+rnd(-4,4),y,t,c,big,life:.9})}
function hit(a,d,mult,opt={}){if(!d.alive)return;const em=elMult(a.el,d.el);let dmg=a.atk*(a.atkUpT>0?(a.atkUpK||1.4):1)*mult*em*arRage()*rnd(.9,1.1)*100/(100+d.def);const crit=Math.random()<(a.crit?a.crit/100:.1);if(crit)dmg*=1.5;if(d.shieldT>0)dmg*=.5;dmg=Math.max(1,Math.round(dmg));
 a.dmg=(a.dmg||0)+Math.min(dmg,Math.max(0,d.hp));d.hp-=dmg;d.hitT=.15;if(!d.anim||d.anim==='hit'){d.anim='hit';d.animT=0}d.charge=Math.min(100,d.charge+4);
 addText(d.x,d.y-uh(d)-4,fmt(dmg)+(crit?'!':''),crit?'#ffd23f':em>1?'#ff6a3c':em<1?'#bfb2e2':'#fff',crit||opt.big);
 if(em>1&&Math.random()<.3)addText(d.x,d.y-uh(d)-14,T('EFEKTIF'),'#ff9a5a');
 B.fx.push({k:'spark',x:d.x,y:d.y-uh(d)*.45,t:0,dur:.25,c:EL[a.el].c});sfx('hit',{crit});if(d.side==='hero')sfx(d.shieldT>0?'block':'hurt');
 if(d.hp<=0){d.hp=0;d.alive=false;d.deathT=.6;sfx('die');B.fx.push({k:'poof',x:d.x,y:d.y-uh(d)*.35,t:0,dur:.5,c:'#fff'});if(d.side==='enemy'&&B.st.goldR&&!B.sim)coinBurst(d)}}
// dungeon emas: koin memercik + angka emas saat musuh tumbang (hanya hiasan; emas sebenarnya diberikan di akhir)
function coinBurst(d){const y=d.y-uh(d)*.5;for(let i=0;i<(d.boss?9:4);i++)B.fx.push({k:'spark',x:d.x+rnd(-8,8),y:y+rnd(-6,6),t:-i*.06,dur:.55,c:i%2?'#ffd23f':'#fff3a0'});const g=B.st.goldR,n=Math.round((g[0]+g[1])/2/(d.boss?3:10)/10)*10;addText(d.x,y-6,'+'+fmt(n)+' G','#ffd23f',d.boss?1:0);if(typeof sfx==='function')sfx('coin')}
function heal(u,amt,by){if(!u.alive)return;amt=Math.round(amt*(B.st.arena?ARENA_CFG.healMul:1));if(by)by.healed=(by.healed||0)+Math.min(amt,u.maxHp-u.hp);u.hp=Math.min(u.maxHp,u.hp+amt);addText(u.x,u.y-uh(u)-4,'+'+fmt(amt),'#7ee07a');B.fx.push({k:'heal',x:u.x,y:u.y,t:0,dur:.7})}
function act(u){const foeSide=u.side==='hero'?'enemy':'hero';if(!alive(foeSide).length)return;if(isHU(u))sfx('swing');if(u.anim!=='skill'){u.anim='attack';u.animT=0}
 if(u.role==='support'&&isHU(u)){const low=alive(u.side).filter(a=>a.hp/a.maxHp<.65).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];if(low){heal(low,u.atk*1.3,u);u.charge=Math.min(100,u.charge+14);return}}
 const t=target(u);if(!t)return;u.charge=Math.min(100,u.charge+(isHU(u)?13:9));
 if(ROLE[u.role].melee){u.face=t;if(u.dash){u.lungeT=.3;B.pend.push({t:.15,f:()=>{hit(u,t,1);meleeFx(u,t)}})}else dashTo(u,t,()=>{hit(u,t,1);meleeFx(u,t)})}
 else{const kind=u.role==='support'?'orb':(HD[u.id]&&HD[u.id].spr.weapon==='gun')?'bullet':(u.etype==='mage')?'orb':'arrow';B.proj.push({x:u.x+(u.side==='hero'?14:-8),y:u.y-uh(u)*.5,sx:u.x,sy:u.y-12,tx:t.x,ty:t.y-uh(t)*.45,t:0,dur:.28,kind,c:EL[u.el].c,f:()=>hit(u,t,1)})}}
function cast(u){if(!u.alive||u.charge<100||B.state!=='fight')return;u.charge=0;if(u.side==='hero'&&!B.sim)hudCast(u);const allies=alive(u.side),foes=alive(u.side==='hero'?'enemy':'hero');if(!foes.length)return;
 const col=EL[u.el].c;B.flash=.5;B.flashC=col;B.shake=.25;sfx('skill',{el:u.el});const S0=isHU(u)?HERO_ART[u.id].strike:0,SG=1+(u.sig||0);u.anim='skill';u.animT=0;if(isHU(u))u.cd=Math.max(u.cd,S0+.6)
 if(u.side==='hero')cutin(u);else banner(u.ph?u.sk:u.name+': '+u.sk);
 if(u.skill==='aoe'){foes.forEach((f,i)=>B.pend.push({t:S0+.15+i*.08,f:()=>{hit(u,f,u.mult*SG,{big:1});B.fx.push({k:'boom',x:f.x,y:f.y-uh(f)*.45,t:0,dur:.45,c:col})}}))}
 if(u.skill==='single'){const t=foes.slice().sort((a,b)=>a.hp-b.hp)[0];const sk=()=>{hit(u,t,u.mult*SG,{big:1});B.fx.push({k:'x',x:t.x,y:t.y-uh(t)*.45,t:0,dur:.5,c:col});B.shake=.35;meleeFx(u,t,1)};
  if(ROLE[u.role].melee&&!u.dash)dashTo(u,t,sk,{delay:Math.max(.05,S0+.06),hold:.26,skill:1});else B.pend.push({t:S0+.2,f:sk})}
 if(u.skill==='heal'){B.pend.push({t:S0,f:()=>{sfx('heal');alive(u.side).forEach(a=>heal(a,(a.maxHp*u.mult+u.atk*.5)*SG,u))}})}
 if(u.skill==='shield'){sfx('shield');allies.forEach(a=>{a.shieldT=u.sig?8:6;B.fx.push({k:'ring',x:a.x,y:a.y-10,t:0,dur:.6,c:'#7fe3ff'})});u.tauntT=6;addText(u.x,u.y-uh(u)-8,T('PROVOKASI'),'#7fe3ff',1)}
 if(u.skill==='buff'){sfx('buff');allies.forEach(a=>{a.atkUpT=u.sig?11:8;a.atkUpK=u.sig?1.5:1.4;if(a!==u)a.charge=Math.min(100,a.charge+20);B.fx.push({k:'up',x:a.x,y:a.y,t:0,dur:.8})});addText(u.x,u.y-uh(u)-8,T('ATK NAIK!'),'#ffd23f',1)}}
function cutin(u){if(B&&B.sim)return;const c=$('#cutin');if(u.side==='hero'&&typeof voice==='function')voice(u.id+'_sk');c.style.setProperty('--cc',EL[u.el].c);const su=u.side==='hero'&&splash(u.id),fc=su&&splashFocus(u.id);c.classList.toggle('spc',!!su);c.innerHTML=`${su?`<span class="cspl" style="background-image:url(${su});background-position:${fc[0]}% ${fc[1]}%"></span>`:`<img class="px" src="${u.side==='hero'?artFrame(u.id,{face:'skill'}).url:u.spr.url}">`}<div><b>${u.sk}!</b><small>${u.name}</small></div>`;c.classList.remove('on');void c.offsetWidth;c.classList.add('on')}
function tickBattle(dt){if(!B||B.paused)return;if(B.state==='end'){for(const u of B.units){if(u.dash){if(u.dash.ph==='wait'||u.dash.ph==='in'||u.dash.ph==='hold'){u.dash.ph='out';u.dash.t=0;u.dash.cb=null}tickDash(u,dt*B.speed)}}return}if(B.hitstop>0){B.hitstop-=dt;return}dt*=B.speed;B.time+=dt;
 for(const u of B.units){if(u.dash)tickDash(u,dt);else if(u.trail&&u.trail.length){for(const g of u.trail)g.a-=dt*4.5;u.trail=u.trail.filter(g=>g.a>0)}}
 for(const u of B.units){if(u.anim)u.animT+=dt;u.lungeT=Math.max(0,u.lungeT-dt);u.hitT=Math.max(0,u.hitT-dt);if(!u.alive)u.deathT=Math.max(0,u.deathT-dt);['shieldT','tauntT','atkUpT'].forEach(k=>u[k]=Math.max(0,u[k]-dt))}
 if(B.state==='enter'){B.enterT-=dt;for(const u of B.units)if(u.side==='enemy')u.ox=Math.max(0,u.ox-dt*200);if(B.enterT<=0){B.state='fight';B.units.forEach(u=>{if(u.side==='enemy')u.ox=0})}}
 else if(B.state==='fight'){if(B.st.arena&&!B.rageOn&&B.time>=ARENA_CFG.rage.at){B.rageOn=1;banner(T('Kemarahan Arena!'));sfx('boss')}for(const u of B.units){if(!u.alive)continue;u.cd-=dt;if(u.cd<=0){act(u);u.cd=u.cdMax*rnd(.85,1.15)}
   if(u.charge>=100&&(u.side==='enemy'?(u.boss||u.ph):B.auto))cast(u)}
  if(!alive('enemy').length){if(B.wave<B.st.waves.length-1){B.state='next';B.nextT=1.1}else battleFin(true)}
  else if(!alive('hero').length)battleFin(false);
  if(B.time>=(B.limit||150)&&B.state==='fight'){banner(T('Waktu Habis!'));battleFin(false)}}
 else if(B.state==='next'){B.nextT-=dt;if(B.nextT<=0){B.wave++;waveHeal();spawnWave();sfx(B.st.waves[B.wave][0].boss?'boss':'wave');banner(B.st.waves[B.wave][0].boss?T('⚠ BOS MUNCUL ⚠'):T('Gelombang {a}/{b}',{a:B.wave+1,b:B.st.waves.length}))}}
 for(let i=B.pend.length-1;i>=0;i--){const p=B.pend[i];p.t-=dt;if(p.t<=0){B.pend.splice(i,1);p.f()}}
 for(let i=B.proj.length-1;i>=0;i--){const p=B.proj[i];p.t+=dt;if(p.t>=p.dur){B.proj.splice(i,1);p.f()}}
 B.fx=B.fx.filter(f=>(f.t+=dt)<f.dur);B.texts=B.texts.filter(t=>(t.life-=dt)>0);B.shake=Math.max(0,B.shake-dt);B.flash=Math.max(0,B.flash-dt*1.6)}
// akhir pertarungan: simulasi (Arena cepat / serangan ke tim bertahan) langsung mencatat hasil tanpa layar
function battleFin(win){B.state='end';B.result=win;if(B.sim)return;const b=B;setTimeout(()=>{if(B!==b)return;b.st.arena?arenaEnd(win):endBattle(win)},900)}
function mobFrame(u){let f=null;if(!u.alive)f={face:'hurt'};else if(u.dash&&u.dash.ph!=='wait')f=dashPose(u);else if(u.anim){f=animFrame(ENE_ANIMS[u.anim]||ENE_ANIMS.attack,u.animT*1000*ANIM_SPD);if(!f)u.anim=null}
 if(!f){const A=ENE_ANIMS.idle;f=animFrame(A,(B.time*1000+u.i*310)%840)}return enemyFrame(u.etype,u.el,f)}
function heroFrame(u){const art=HERO_ART[u.id];let f=null;
 if(!u.alive)f={pose:'hit',face:'hurt'};else if(u.dash&&u.dash.ph!=='wait')f=dashPose(u);
 else if(u.anim){f=animFrame(art.anims[u.anim],u.animT*1000*ANIM_SPD);if(!f)u.anim=null}
 if(!f){const A=art.anims.idle,tot=A.reduce((s,a)=>s+a.d,0);f=animFrame(A,(B.time*1000+u.i*700)%tot)}
 return artFrame(u.id,f)}
function drawBattle(){const g=B.g,st=B.st;g.setTransform(2,0,0,2,0,0);g.imageSmoothingEnabled=false;
 if(B.shake>0)g.translate(Math.round(rnd(-2,2)),Math.round(rnd(-1,1)));drawBattleBg(g,st);g.translate(0,BTOP);
 const us=B.units.filter(u=>u.alive||u.deathT>0).sort((a,b)=>(a.y+(a.dy||0))-(b.y+(b.dy||0)));
 for(const u of us)drawTrail(g,u);
 for(const u of us)if(u.dy){u._y=u.y;u.y+=u.dy}
 for(const u of us){const sc=u.scale,hero=u.side==='hero',dir=hero?1:-1;let x=u.x+u.ox+(u.dx||0);if(u.lungeT>0)x+=dir*Math.sin((1-u.lungeT/.3)*Math.PI)*(hero?8:16);if(u.hitT>0&&!hero)x-=dir*2;x=Math.round(x);
  g.globalAlpha=u.alive?1:Math.max(.25,u.deathT/.6);const uw=isHU(u)?24:(u.etype==='slime'||u.etype==='bSlime'?24:20)*sc;
  g.fillStyle='rgba(0,0,0,.25)';g.fillRect(x-uw/2,u.y-1,uw,3);
  if(isHU(u)){const fr=heroFrame(u);if(!hero){g.save();g.translate(x,0);g.scale(-1,1)}const hx0=(hero?x:0)-22+fr.dx;if(fr.ghost){const a0=g.globalAlpha;for(const[o,al]of[[-16,.2],[-8,.4]]){g.globalAlpha=al;g.drawImage(fr.w,hx0+o,u.y-39,44,44)}g.globalAlpha=a0}
   g.drawImage(fr.c,hx0,u.y-39,44,44);if(u.hitT>0){g.globalAlpha*=.6;g.drawImage(fr.w,hx0,u.y-39,44,44)}if(!hero)g.restore()}
  else{const fr=mobFrame(u);g.save();g.translate(x,0);g.scale(-1,1);const dy=u.y-39*sc;g.drawImage(fr.c,-22*sc,dy,44*sc,44*sc);if(u.hitT>0){g.globalAlpha*=.7;g.drawImage(fr.w,-22*sc,dy,44*sc,44*sc)}g.restore()}
  g.globalAlpha=1;const top=u.y-uh(u);
  if(u.shieldT>0){g.strokeStyle='rgba(127,227,255,'+(.5+.3*Math.sin(B.time*8))+')';g.lineWidth=1;g.strokeRect(x-uw/2-2+.5,top-2.5,uw+4,uh(u)+4)}
  if(u.atkUpT>0&&Math.floor(B.time*4)%2){g.fillStyle='#ff6a3c';g.fillRect(x+uw/2+1,top+4,1,4);g.fillRect(x+uw/2,top+5,3,1)}
  if(u.alive){const bw=isHU(u)?22:14*sc,by=top-5;g.fillStyle='#241626';g.fillRect(x-bw/2-1,by-1,bw+2,4);g.fillStyle='#4a2030';g.fillRect(x-bw/2,by,bw,2);g.fillStyle=hero?'#7ee07a':(u.boss?'#ff4f6a':'#ff7a6a');g.fillRect(x-bw/2,by,Math.ceil(bw*u.hp/u.maxHp),2);
   if(!hero){g.drawImage(elImg[u.el],x-bw/2-9,by-3,8,8)}}}
 for(const u of us)if(u._y!==undefined){u.y=u._y;delete u._y}
 for(const p of B.proj){const k=p.t/p.dur,x=p.x+(p.tx-p.x)*k,y=p.y+(p.ty-p.y)*k-Math.sin(k*Math.PI)*(p.kind==='arrow'?8:2);
  if(p.kind==='arrow'){g.fillStyle='#fff6dc';const d=Math.sign(p.tx-p.x);g.fillRect(Math.round(x)-(d>0?5:0),Math.round(y),5,1);g.fillStyle=p.c;g.fillRect(Math.round(x)+(d>0?0:-1),Math.round(y)-1,1,3)}
  else if(p.kind==='bullet'){g.fillStyle='#ffd23f';g.fillRect(Math.round(x),Math.round(y),3,2)}
  else{g.fillStyle=p.c;g.fillRect(Math.round(x)-2,Math.round(y)-2,4,4);g.fillStyle='#fff';g.fillRect(Math.round(x)-1,Math.round(y)-1,2,2)}}
 for(const f of B.fx){const k=f.t/f.dur;if(f.k[0]==='v'){drawVfx(g,f,k);continue}
  if(f.k==='spark'){g.fillStyle=f.c;for(let i=0;i<5;i++){const a=i*1.26,r=k*7;g.fillRect(Math.round(f.x+Math.cos(a)*r),Math.round(f.y+Math.sin(a)*r),2,2)}}
  if(f.k==='slash'){g.fillStyle='rgba(255,255,255,'+(1-k)+')';for(let i=0;i<8;i++){g.fillRect(Math.round(f.x-6+i*1.6),Math.round(f.y-6+i*1.6-k*2),2,1)}}
  if(f.k==='poof'){g.fillStyle='rgba(255,255,255,'+(1-k)+')';for(let i=0;i<8;i++){const a=i*.785,r=k*12;g.fillRect(Math.round(f.x+Math.cos(a)*r)-1,Math.round(f.y+Math.sin(a)*r)-1,3,3)}}
  if(f.k==='boom'){const r=Math.round(4+k*16);g.strokeStyle=f.c;g.globalAlpha=1-k;g.lineWidth=2;g.strokeRect(f.x-r,f.y-r,r*2,r*2);g.fillStyle='#fff';g.fillRect(f.x-r/2,f.y-1,r,2);g.fillRect(f.x-1,f.y-r/2,2,r);g.globalAlpha=1}
  if(f.k==='x'){g.globalAlpha=1-k;g.fillStyle=f.c;const r=Math.round(6+k*14);for(let i=-r;i<=r;i+=1){g.fillRect(f.x+i,f.y+i,2,2);g.fillRect(f.x+i,f.y-i,2,2)}g.fillStyle='#fff';for(let i=-r/2;i<=r/2;i++){g.fillRect(f.x+i,f.y+i,1,1);g.fillRect(f.x+i,f.y-i,1,1)}g.globalAlpha=1}
  if(f.k==='heal'){g.fillStyle='rgba(126,224,122,'+(1-k)+')';for(let i=0;i<4;i++){const px=f.x-6+i*4,py=f.y-6-k*20-(i%2)*5;g.fillRect(px,py,3,1);g.fillRect(px+1,py-1,1,3)}}
  if(f.k==='ring'){const r=Math.round(6+k*10);g.strokeStyle=f.c;g.globalAlpha=1-k;g.lineWidth=1;g.strokeRect(f.x-r+.5,f.y-r+.5,r*2,r*2);g.globalAlpha=1}
  if(f.k==='up'){g.fillStyle='rgba(255,210,63,'+(1-k)+')';for(let i=0;i<3;i++){const px=f.x-6+i*6,py=f.y-8-k*18-i*3;g.fillRect(px,py,1,4);g.fillRect(px-1,py+1,3,1)}}}
 g.textAlign='center';for(const t of B.texts){const k=1-t.life/.9,y=Math.round(t.y-k*12);g.font=(t.big?'13px':'10px')+' "Lilita One",sans-serif';g.globalAlpha=Math.min(1,t.life*3);g.lineWidth=2;g.strokeStyle='#241626';g.strokeText(t.t,t.x,y);g.fillStyle=t.c;g.fillText(t.t,t.x,y)}g.globalAlpha=1;
 if(B.flash>0){g.setTransform(1,0,0,1,0,0);g.globalAlpha=B.flash*.6;g.fillStyle=B.flashC;g.fillRect(0,0,480,600);g.globalAlpha=1}
 hudTick()}
const elImg={};
function endBattle(win){if(!B)return;const st=B.st;let html;
 if(win){const dead=B.units.some(u=>u.side==='hero'&&!u.alive);const sr=1+(!dead?1:0)+(B.time<=60?1:0);const first=!S.stages[st.key];S.stages[st.key]=Math.max(S.stages[st.key]||0,sr);
  const rw={gold:st.dg?dgGold(st,sr):st.gold,exp:st.exp};if(first&&!st.dg)rw.gems=st.gems;if(st.dg){const gd=rollGear(st);if(gd)rw.gear=gd}if(first&&BOSS_GEAR[st.key])rw.gear=BOSS_GEAR[st.key];if(st.dg){rw.mats=rollDrops(st,sr>=3);S.daily.c.dg=(S.daily.c.dg||0)+1}const ups=grant(rw);S.daily.c.clear++;evCount('clear');if(st.boss){S.daily.c.boss++;evCount('boss')}save();sfx('win');for(let i=0;i<sr;i++)setTimeout(()=>sfx('star',{i}),1100+i*250);
  const nx=st.dg?null:SLIST[st.n+1];
  html=`<div class="panel res win"><div class="rrib"><h3>${T('MENANG!')}</h3></div><div class="rstars">${[0,1,2].map(i=>`<span class="${i<sr?'on':''}" style="animation-delay:${.3+i*.25}s">★</span>`).join('')}</div>${mvpHTML(battleMVP(B))}<div class="rcond">${dead?'✗':'✓'} ${T('Tanpa hero gugur')} · ${B.time<=60?'✓':'✗'} ${T('≤ 60 detik')} (${Math.floor(B.time)}${T('d')})</div>
  ${rewardHTML(rw)}<div class="rexp"><b>Lv ${S.lv}</b><span class="bar"><i style="width:${Math.min(100,S.exp/expNeed(S.lv)*100)}%"></i></span><small>${fmt(S.exp)}/${fmt(expNeed(S.lv))}</small></div>${first?`<div style="font-size:13px;color:#2a8ad0">${T('Bonus pertama kali!')}</div>`:''}${ups?`<div style="font-size:15px;color:#d2780a;margin-top:6px">⬆ ${T('Level Akun naik ke {lv}! Stamina +{s}',{lv:S.lv,s:ups*20})}</div>`:''}
  <div class="mrow"><button class="btn blue" data-act="bexit">${T('Peta')}</button><button class="btn" data-act="bretry">${T('Ulangi')}<small>${ic('stam',12)} ${st.cost}</small></button>${!st.dg&&nx&&st.s<4?`<button class="btn green" data-act="bnext">${T('Lanjut')}<small>${ic('stam',12)} ${nx.cost}</small></button>`:''}</div></div>`}
 else{sfx('lose');html=`<div class="panel res lose"><div class="rrib"><h3>${T('KALAH...')}</h3></div>${mvpHTML(battleMVP(B))}<p class="rtip">${T('Tips: naikkan level hero, pakai elemen yang unggul, dan bawa Penjaga di depan serta Pendukung untuk menyembuhkan.')}</p><div class="mrow"><button class="btn blue" data-act="bexit">${T('Peta')}</button><button class="btn" data-act="bretry">${T('Coba Lagi')}<small>${ic('stam',12)} ${st.cost}</small></button></div></div>`}
 const o=$('#bOver');o.innerHTML=html;o.classList.add('on')}
function exitBattle(){if(B&&B.st.arena){B=null;$('#battle').classList.remove('on');$('#bOver').classList.remove('on');tab='arena';render();return}if(B&&B.st.dg){advTab='dg';dgSel=B.st.dg}B=null;$('#battle').classList.remove('on');$('#bOver').classList.remove('on');tab='adv';render()}

