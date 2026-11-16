import os
SRC=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','src','js')+'/'
mods=''.join(open(SRC+f).read()+'\n' for f in ['data/elements.js','data/enemies.js','art/backgrounds.js','art/enemies.js','art/heroes/raika.js'])
html=r'''<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Prototipe Sprite Raika</title>
<link href="https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}body{background:#141228;font-family:'Pixelify Sans',monospace;color:#fff;padding:16px;max-width:520px;margin:0 auto}
canvas{image-rendering:pixelated;display:block}
h1{font-size:24px;text-shadow:2px 2px 0 #000}p.s{color:#b8c4ea;font-size:14px;margin:4px 0 14px;line-height:1.4}
.tagl{display:inline-block;background:#d0283c;color:#fff;font-size:12px;padding:2px 8px;margin-right:6px;box-shadow:0 0 0 2px #000;vertical-align:3px}
.ped{background:radial-gradient(ellipse at 50% 35%,#5a6ea8 0%,#2a2f5a 55%,#121428 100%);height:310px;position:relative;box-shadow:0 0 0 3px #000;display:grid;place-items:end center;overflow:hidden}
.ped canvas{width:264px;height:264px;position:relative}
.ped .flr{position:absolute;bottom:0;left:0;right:0;height:26px;background:rgba(0,0,0,.28)}
.ped .rain{position:absolute;inset:0;background:repeating-linear-gradient(105deg,transparent 0 22px,rgba(160,200,255,.13) 22px 23px);animation:rain .5s linear infinite}
@keyframes rain{to{background-position:-12px 40px}}
.tag{position:absolute;top:8px;left:8px;background:#141228;padding:3px 8px;font-size:13px;z-index:2}
.btns{display:flex;gap:8px;margin:14px 0 4px;flex-wrap:wrap}
button{font-family:inherit;font-size:15px;border:none;padding:8px 11px;background:#6ec6ff;box-shadow:0 0 0 3px #000,inset 0 -4px 0 #2f86d0;cursor:pointer;color:#241626;font-weight:700}
button.on{background:#ffd23f;box-shadow:0 0 0 3px #000,inset 0 -4px 0 #e09a12}
button.dir{background:#7ee07a;box-shadow:0 0 0 3px #000,inset 0 -4px 0 #2f9a3a}
h3{font-size:17px;margin:18px 0 8px}
.arena{box-shadow:0 0 0 3px #000}.arena canvas{width:100%}
.cards{display:flex;gap:12px;align-items:flex-end}
.card{background:linear-gradient(180deg,#fff0a0,#ffc94a);padding:4px;box-shadow:0 0 0 3px #000;text-align:center;color:#241626;font-size:11px;font-weight:700}
ul{font-size:14px;line-height:1.5;color:#dde4f8;padding-left:18px}li{margin-bottom:4px}
@keyframes spin{to{transform:rotate(360deg)}}
</style></head><body>
<h1><span class="tagl">TERBATAS</span>Prototipe Sprite: Raika ★3</h1>
<p class="s">Pemanah Petir Kelana · Gelap · Pemanah. Sudut pandang 3/4 menghadap kanan; untuk ke kiri cukup dibalik.</p>
<div class="ped"><div class="rain"></div><span class="tag" id="lbl">Diam</span><div class="flr"></div><canvas id="cNew" width="264" height="264"></canvas></div>
<div class="btns" id="btns"></div>
<h3>Ekspresi & pose</h3><div id="gal" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px"></div>
<h3>Kertas jimat tertiup angin</h3><div id="wind" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px"></div>
<h3>Palet warna</h3><div id="pal" style="display:grid;gap:6px;font-size:12px"></div>
<h3>Senjata Signature</h3>
<div style="display:flex;gap:12px;align-items:stretch">
<div style="background:linear-gradient(180deg,#9ab6ee,#3a4a8a);box-shadow:0 0 0 3px #000;padding:8px;display:flex;flex-direction:column;align-items:center;color:#fff;min-width:120px;position:relative;overflow:hidden">
<div style="position:absolute;inset:-40%;background:repeating-conic-gradient(rgba(255,255,255,.18) 0 10deg,transparent 10deg 20deg);animation:spin 14s linear infinite"></div>
<canvas id="wIcon" width="108" height="180" style="position:relative;width:108px;height:180px"></canvas>
<b style="position:relative;font-size:14px;text-shadow:1px 1px 0 #000">Busur Guntur Raijin</b><span style="position:relative;color:#ffd23f;font-size:14px;text-shadow:1px 1px 0 #241626">★★★</span></div>
<div style="background:#22264a;box-shadow:0 0 0 3px #000;padding:10px;font-size:13px;line-height:1.45;flex:1">
<b style="color:#8ae4ff;font-size:15px">Busur Guntur Raijin</b><br><span style="color:#b8c4ea">Senjata eksklusif Raika · Busur</span><br><br>
<b>ATK +125</b> · Crit +12%<br>
<b style="color:#7fe3ff">Pasif:</b> Saat dipakai Raika, skill <i>Hujan Petir Raijin</i> +30% damage dan sambaran petirnya makin besar.<br><br>
<span style="color:#b8c4ea">Desain: busur hitam lengkung dengan ujung biru menyala, pegangan berpermata biru, tali perak. Saat skill, petir biru merambat di sepanjang busur.</span></div></div>
<h3>Demo di arena (ukuran asli game)</h3>
<div class="arena"><canvas id="cAr" width="480" height="300"></canvas></div>
<h3>Di kartu hero</h3>
<div class="cards"><div class="card"><canvas id="k2" width="88" height="88"></canvas>Raika</div><div class="card" style="background:linear-gradient(180deg,#d8e4ff,#7a90d8)"><canvas id="k3" width="64" height="64"></canvas>Potret</div></div>
<h3>Catatan desain</h3><ul>
<li><b>Dari referensi:</b> caping jerami bertepi hitam, rambut bob biru-hitam berujung biru dengan ekor rambut panjang yang berkibar, mata merah, mantel kimono navy bermotif bunga putih, bodysuit hitam berbalut dengan liontin emas, sabuk taktis berkantong, celah rok di paha, dan sepatu bot lapis baja hitam.</li>
<li><b>Senjata diganti busur:</b> pedang di referensi diganti busur hitam berpetir biru. Busur selalu di depan tubuh dan tidak menutupi wajah di pose mana pun.</li>
<li><b>Caping revisi:</b> digeser ke tengah kepala, lebih kecil dan ceper. Jerami cokelat-emas gelap dengan anyaman memancar dari puncak, tepi hitam berpernis dengan titik kilap, kenop hitam di puncak.</li>
<li><b>Kertas jimat (ofuda):</b> 4 lembar dengan goresan tinta dan tali merah menggantung di tepi caping. Kertasnya berayun ke belakang seperti tertiup angin, dengan 4 fase dan irama berbeda tiap lembar, di semua animasi.</li>
<li><b>Serang:</b> tarik tali (anak panah berujung baja) → lepas dengan percikan → kembali siaga.</li>
<li><b>Skill "Hujan Petir Raijin":</b> membidik sambil mengisi petir (sambaran makin banyak, mata menyala biru) → melepas panah guntur → petir menyambar semua musuh.</li>
<li><b>Kena hit:</b> mata ×_×, tanda kesal, lalu keringat dan mata berkaca-kaca.</li>
</ul>
<script>
'use strict';
let CUR_WPN=null;
/*MODS*/
const MOD=ART_RAIKA,PAL=MOD.pal,ANIMS=MOD.anims,SW=44,SH=44;
const cache={};const frame=f=>{const k=JSON.stringify(f);if(cache[k])return cache[k];const c=MOD.draw(f);const w=document.createElement('canvas');w.width=SW;w.height=SH;const wg=w.getContext('2d');wg.drawImage(c,0,0);wg.globalCompositeOperation='source-in';wg.fillStyle='#fff';wg.fillRect(0,0,SW,SH);return cache[k]={c,w}};
const names={idle:'Diam',walk:'Jalan',attack:'Serang',hit:'Kena Hit',skill:'Skill'};
let anim='idle',fi=0,ft=0,last=0,t=0,face=1;
const bt=document.getElementById('btns');
for(const k in names){const b=document.createElement('button');b.textContent=names[k];b.dataset.k=k;b.onclick=()=>{anim=k;fi=0;ft=0;upd()};bt.appendChild(b)}
const db=document.createElement('button');db.className='dir';db.onclick=()=>{face*=-1;upd()};bt.appendChild(db);
function upd(){[...bt.children].forEach(b=>b.dataset.k&&b.classList.toggle('on',b.dataset.k===anim));db.textContent=face>0?'Hadap: Kanan →':'← Hadap: Kiri';document.getElementById('lbl').textContent=names[anim]}upd();
// efek skill di panggung: kilat layar
function fx(g,f,x,y,s){if(f.fx==='thunder'){g.fillStyle='rgba(200,240,255,.35)';g.fillRect(x-40*s,y-40*s,140*s,140*s)}}
function draw(g,f,x,y,s,dir){const fr=frame(f);g.save();if(dir<0){g.translate(x+SW*s,0);g.scale(-1,1);x=0}g.drawImage(fr.c,x,y,SW*s,SH*s);if(f.flash){g.globalAlpha=.7;g.drawImage(fr.w,x,y,SW*s,SH*s);g.globalAlpha=1}fx(g,f,x,y,s);g.restore()}
// ---- arena ----
const BGG=makeBG('grass',160,120);
const FOES=[{t:'slime',el:'cahaya',x:104,y:66},{t:'goblin',el:'cahaya',x:124,y:50},{t:'slime',el:'air',x:136,y:70}];
FOES.forEach((e,i)=>{e.fr=enemyFrame(e.t,e.el,{});e.hit=0;e.dmg=0;e.y=[84,80,88][i]-e.fr.c.height});   // kaki musuh di garis tanah
const AR={st:'idle',fi:0,ft:0,cnt:0,arrows:[],bolts:[],flash:0,idleT:900};
function setSt(s){AR.st=s;AR.fi=0;AR.ft=0}
function shoot(){const tgt=FOES[AR.cnt%FOES.length];AR.arrows.push({x:52,y:62,tx:tgt.x+6,ty:tgt.y+10,p:0,tgt})}
function strikeAll(){FOES.forEach((e,i)=>{AR.bolts.push({x:e.x+8,y:e.y,life:320+i*40,dl:i*70});setTimeout(()=>{e.hit=260;e.dmg=2400+i*137},i*70+60)});AR.flash=260}
function arenaStep(dt){const a=AR;a.ft+=dt;const A=a.st==='idle'?ANIMS.idle:ANIMS[a.st];
 if(a.ft>=A[a.fi].d){a.ft=0;a.fi++;
  if(a.st==='attack'&&a.fi===1)shoot();
  if(a.st==='skill'&&a.fi===4)strikeAll();
  if(a.fi>=A.length){a.fi=0;
   if(a.st==='attack'){a.cnt++;if(a.cnt%3===0)setSt('skill');else setSt('attack')}
   else if(a.st==='skill')setSt('hit');else if(a.st==='hit'){setSt('idle');a.idleT=1200}}}
 if(a.st==='idle'){a.idleT-=dt;if(a.idleT<=0)setSt('attack')}
 a.arrows=a.arrows.filter(r=>{r.p+=dt/260;if(r.p>=1){r.tgt.hit=220;r.tgt.dmg=820+Math.floor(Math.random()*120);return false}return true});
 a.bolts=a.bolts.filter(b=>{if(b.dl>0){b.dl-=dt;return true}b.life-=dt;return b.life>0});
 FOES.forEach(e=>e.hit=Math.max(0,e.hit-dt));a.flash=Math.max(0,a.flash-dt);
 return (a.st==='idle'?ANIMS.idle:ANIMS[a.st])[a.fi].f}
function boltPath(g,x,y0,y1,seed){g.beginPath();let x0=x;g.moveTo(x0,y0);for(let y=y0;y<y1;y+=6){x0=x+Math.sin(y*1.7+seed)*3;g.lineTo(x0,y)}g.lineTo(x,y1);g.stroke()}
function loop(n){const dt=last?Math.min(60,n-last):16;last=n;t+=dt;ft+=dt;const A=ANIMS[anim];if(ft>=A[fi].d){ft=0;fi=(fi+1)%A.length}
 const gN=document.getElementById('cNew').getContext('2d');gN.imageSmoothingEnabled=false;gN.clearRect(0,0,264,264);draw(gN,A[fi].f,0,0,6,face);
 const g=document.getElementById('cAr').getContext('2d');g.imageSmoothingEnabled=false;g.setTransform(3,0,0,3,0,0);g.drawImage(BGG,0,-20);
 g.fillStyle='rgba(20,24,60,.35)';g.fillRect(0,0,160,100);   // langit badai
 g.strokeStyle='rgba(170,210,255,.25)';g.lineWidth=.5;for(let i=0;i<26;i++){const rx=(i*37+t*.09)%170-5,ry=(i*53+t*.25)%100;g.beginPath();g.moveTo(rx,ry);g.lineTo(rx-2,ry+5);g.stroke()}
 const af=arenaStep(dt);
 g.fillStyle='rgba(0,0,0,.28)';g.fillRect(14,86,22,2);FOES.forEach(e=>g.fillRect(e.x+2,e.y+e.fr.c.height-3,e.fr.c.width-4,2));
 draw(g,af,6,46,1,1);
 FOES.forEach((e,i)=>{const bob=Math.floor((t/400+i)%2),sx=e.hit>0?2:0;g.save();g.translate(e.x+e.fr.c.width+sx,0);g.scale(-1,1);g.drawImage(e.fr.c,0,e.y-bob);if(e.hit>0){g.globalAlpha=.6;g.drawImage(e.fr.w,0,e.y-bob);g.globalAlpha=1}g.restore()});
 for(const r of AR.arrows){const x=r.x+(r.tx-r.x)*r.p,y=r.y+(r.ty-r.y)*r.p-Math.sin(r.p*Math.PI)*6;g.fillStyle='#24242f';g.fillRect(x-6,y,7,1);g.fillStyle='#8ae4ff';g.fillRect(x+1,y-1,2,3);g.fillStyle='#d0283c';g.fillRect(x-7,y-1,1,3)}
 g.lineWidth=1.6;for(const b of AR.bolts){if(b.dl>0)continue;g.strokeStyle='rgba(140,228,255,.9)';boltPath(g,b.x,-5,b.y+10,b.life);g.strokeStyle='#f0fcff';g.lineWidth=.7;boltPath(g,b.x,-5,b.y+10,b.life);g.lineWidth=1.6;g.fillStyle='rgba(140,228,255,.5)';g.fillRect(b.x-6,b.y+8,12,3)}
 if(AR.flash>0){g.fillStyle='rgba(200,240,255,'+(AR.flash/260*.45)+')';g.fillRect(0,0,160,100)}
 g.font='700 8px "Pixelify Sans"';g.textAlign='center';g.lineWidth=2;g.strokeStyle='#241626';
 FOES.forEach(e=>{if(e.hit>0){const yy=e.y-4-(260-e.hit)/26,s=e.dmg.toLocaleString('id-ID');g.strokeText(s,e.x+8,yy);g.fillStyle=e.dmg>2000?'#8ae4ff':'#ffd23f';g.fillText(s,e.x+8,yy)}});
 g.setTransform(1,0,0,1,0,0);
 const k2=document.getElementById('k2').getContext('2d');k2.imageSmoothingEnabled=false;k2.clearRect(0,0,88,88);k2.drawImage(frame(ANIMS.idle[Math.floor(t/500)%ANIMS.idle.length].f).c,0,0,88,88);
 const k3=document.getElementById('k3').getContext('2d');k3.imageSmoothingEnabled=false;k3.clearRect(0,0,64,64);k3.drawImage(frame(ANIMS.idle[Math.floor(t/500)%ANIMS.idle.length].f).c,8,2,32,32,0,0,64,64);
 requestAnimationFrame(loop)}
requestAnimationFrame(loop);
{const wc=document.getElementById('wIcon').getContext('2d');wc.imageSmoothingEnabled=false;wc.drawImage(MOD.icon(),0,0,108,180)}
{const RAMPS=[['Rambut',['h4','h3','h2','h1','hs']],['Ujung biru',['hb2','hb1']],['Kulit',['s3','s2','s1','bl']],['Mata',['LASH','e1','e2','e3']],['Mantel navy',['o4','o3','o2','o1','fw']],['Bodysuit',['b4','b3','b2','b1']],['Caping jerami',['t4','t3','t2','t1']],['Tepi pernis',['r2','r1','rh']],['Kertas jimat',['pp2','pp1','ink','c2']],['Petir',['lt3','lt2','lt1']],['Busur',['bw2','bw1','bs']]];
const pe=document.getElementById('pal');for(const[n,ks]of RAMPS){const r=document.createElement('div');r.style.cssText='display:flex;align-items:center;gap:8px';r.innerHTML='<span style="width:100px;color:#b8c4ea">'+n+'</span>'+ks.map(k=>'<span title="'+PAL[k]+'" style="width:26px;height:20px;background:'+PAL[k]+';box-shadow:0 0 0 2px #000"></span>').join('');pe.appendChild(r)}}
const cell=(host,n,f)=>{const d=document.createElement('div');d.style.cssText='background:#22264a;box-shadow:0 0 0 3px #000;text-align:center;font-size:11px;padding:4px 2px';const c=document.createElement('canvas');c.width=88;c.height=88;c.style.cssText='width:100%;height:auto';const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(MOD.draw(f),0,0,88,88);d.appendChild(c);d.appendChild(document.createTextNode(n));host.appendChild(d)};
const gl=document.getElementById('gal');[['Diam',{}],['Senang',{face:'happy'}],['Tarik busur',{pose:'back',face:'ready'}],['Lepas!',{pose:'slash',face:'yell',spark:1}],['Kena hit',{pose:'hit',face:'hurt',vein:1}],['Berkaca-kaca',{pose:'hit',face:'daze',sweat:1}],['Isi petir',{pose:'aim',face:'glare',bolt:4,flick:1}],['Kedip',{face:'blink'}]].forEach(([n,f])=>cell(gl,n,f));
const wd=document.getElementById('wind');[0,1,2,3].forEach(w=>cell(wd,'Fase angin '+(w+1),{wind:w}));
</script></body></html>'''
html=html.replace('/*MODS*/',mods)
open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','dist','proto-raika.html'),'w').write(html);print(len(html))
