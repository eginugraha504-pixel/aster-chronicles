/* =====================================================================
   DASH MELEE — petarung/penjaga (hero & musuh) melesat ke depan target, menebas, lalu melompat balik.
   Fase: wait (jeda sebelum dash, dipakai skill) -> in (melesat) -> hold (tebas, cb dipanggil saat tiba) -> out (kembali)
   Efek: jejak bayangan warna elemen, debu awal, garis kecepatan, tebasan & benturan (lembar VFX Higgsfield), hitstop.
   ===================================================================== */
const DASH={in:.13,hold:.17,out:.22,trailEvery:.018};
function dashTo(u,t,cb,o={}){const hero=u.side==='hero',dir=hero?1:-1;
 const reach=(t.side==='enemy'?(ENEMY[t.etype]&&ENEMY[t.etype].look&&ENEMY[t.etype].look.slime?11:9)*t.scale:10)+(u.scale>1?14:9);
 const busy=B.units.filter(x=>x!==u&&x.dash&&x.dash.tgt===t).length;           // >1 penyerang ke target yang sama: geser sedikit
 const tx=t.x-dir*reach-u.x+(busy?-dir*5:0),ty=(t.y-u.y)+(busy%2?3:busy?-3:0)+.5;
 u.dash={ph:o.delay?'wait':'in',t:0,delay:o.delay||0,hold:o.hold||DASH.hold,tx,ty,tgt:t,cb,skill:!!o.skill,lt:0,did:false};u.dx=0;u.dy=0;u.trail=u.trail||[];
 if(!o.delay)dashStart(u)}
function dashStart(u){const c=EL[u.el].c,d=u.side==='hero'?1:-1;sfx('swing');B.fx.push({k:'vdust',x:u.x+(u.dx||0)-d*4,y:u.y+(u.dy||0),t:0,dur:.38,flip:d<0,c:'#f4ead2',s:u.scale>1?1.4:1})}
const easeOut=k=>1-(1-k)*(1-k)*(1-k),easeIn=k=>k*k;
function tickDash(u,dt){const D=u.dash;D.t+=dt;
 if(!u.alive){u.dash=null;u.dx=u.dy=0;u.trail=[];return}
 if(D.ph==='wait'){if(D.t>=D.delay){D.ph='in';D.t=0;dashStart(u)}return}
 if(D.ph==='in'){const k=Math.min(1,D.t/DASH.in),e=easeOut(k);u.dx=D.tx*e;u.dy=D.ty*e;
  if(k>=1){D.ph='hold';D.t=0;if(!D.did){D.did=true;D.cb&&D.cb()}}}
 else if(D.ph==='hold'){u.dx=D.tx;u.dy=D.ty;if(D.t>=D.hold){D.ph='out';D.t=0}}
 else if(D.ph==='out'){const k=Math.min(1,D.t/DASH.out),e=1-easeIn(1-k)*0+k;const q=1-(k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2);u.dx=D.tx*q;u.dy=D.ty*q-Math.sin(k*Math.PI)*7*(u.scale>1?1.4:1);
  if(k>=1){u.dash=null;u.dx=u.dy=0}}
 // jejak bayangan
 if(u.dash&&(D.ph==='in'||D.ph==='out')){D.lt+=dt;if(D.lt>=DASH.trailEvery){D.lt=0;u.trail.push({dx:u.dx,dy:u.dy,a:1,f:null})}}
 for(const g of u.trail)g.a-=dt*(D.ph==='out'?4.5:3.4);u.trail=u.trail.filter(g=>g.a>0)}
function dashPose(u){const D=u.dash;if(D.ph==='in')return{pose:'back'};if(D.ph==='hold')return D.skill?{pose:'raise'}:{pose:'slash'};return{legs:(B.time*9|0)%2?'w0':'w1'}}
// siluet berwarna (cache per kanvas+warna)
const TINT=new WeakMap();
function tinted(c,col){let m=TINT.get(c);if(!m){m={};TINT.set(c,m)}if(m[col])return m[col];const t=document.createElement('canvas');t.width=c.width;t.height=c.height;const g=t.getContext('2d');g.drawImage(c,0,0);g.globalCompositeOperation='source-in';g.fillStyle=col;g.fillRect(0,0,t.width,t.height);return m[col]=t}
function drawTrail(g,u){if(!u.trail||!u.trail.length)return;const hero=u.side==='hero',sc=u.scale,col=EL[u.el].c;
 const fr=hero?heroFrame(u):mobFrame(u),tc=tinted(fr.c,col),wc=tinted(fr.c,'#ffffff');
 for(const p of u.trail){const x=Math.round(u.x+u.ox+p.dx),y=u.y+p.dy;g.globalAlpha=Math.max(0,p.a)*.55;
  if(hero)g.drawImage(tc,x-22,y-39,44,44);else{g.save();g.translate(x,0);g.scale(-1,1);g.drawImage(tc,-22*sc,y-39*sc,44*sc,44*sc);g.restore()}}
 // garis kecepatan saat melesat
 const D=u.dash;if(D&&D.ph==='in'){const d=hero?1:-1,x=u.x+u.ox+u.dx,y=u.y+u.dy;g.globalAlpha=.85;
  for(let i=0;i<5;i++){const yy=Math.round(y-6-i*5*sc),len=10+((i*7)%9);g.fillStyle=i%2?'#ffffff':col;g.fillRect(Math.round(x-d*(16+i*2)-(d>0?len:0)),yy,len,1)}}
 g.globalAlpha=1}
function meleeFx(a,d,big){const dir=a.side==='hero'?1:-1,c=EL[a.el].c,s=(d.scale>1?1.5:1)*(big?1.35:1),y=d.y-uh(d)*.5;
 B.fx.push({k:'vslash',x:d.x-dir*2,y,t:0,dur:.24,flip:dir<0,c,s});B.fx.push({k:'vimpact',x:d.x+dir*2,y:y+2,t:0,dur:.3,c,s:s*.9});
 B.shake=Math.max(B.shake,big?.32:.14);B.hitstop=big?.09:.055}
// lembar VFX: baris 0 tebasan, 1 benturan, 2 debu (4 frame per baris)
function drawVfx(g,f,k){const row=f.k==='vslash'?0:f.k==='vimpact'?1:2,i=Math.min(3,Math.floor(k*4)),src=fxFrame(row,i);const S=(f.s||1)*(row===2?30:row===0?46:40);
 if(!src){if(row===0){g.fillStyle='rgba(255,255,255,'+(1-k)+')';for(let j=0;j<8;j++)g.fillRect(Math.round(f.x-6+j*1.6),Math.round(f.y-6+j*1.6),2,1)}return}
 g.save();g.translate(Math.round(f.x),Math.round(f.y-(row===2?S*.45:0)));if(f.flip)g.scale(-1,1);
 g.globalAlpha=row===2?.8*(1-k*.6):1;
 if(row!==2){g.globalCompositeOperation='lighter';g.drawImage(tinted(src,f.c),-S/2,-S/2,S,S);g.globalCompositeOperation='source-over';g.globalAlpha*=.85}
 g.drawImage(row===2?src:tinted(src,'#ffffff'),-S/2*(row===2?1:.82),-S/2*(row===2?1:.82),S*(row===2?1:.82),S*(row===2?1:.82));g.restore();g.globalAlpha=1}
function fxFrame(row,i){if(!hasSpr('fx_melee'))return null;return sprCanvas('fx_melee',row*4+i)}
