/* ================= BACKGROUNDS ================= */
const BG={};
// ===== Backgrounds v2 — layered pixel scenes matching the chibi sprites =====
function makeBG2(kind,W=240,H=210){
 const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');
 let s=kind.length*7919+W*31+H;const R=()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
 const f=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))};
 const px=(x,y,col)=>f(x,y,1,1,col);
 const circ=(cx,cy,r,col)=>{for(let y=-r;y<=r;y++){const w=Math.round(Math.sqrt(r*r-y*y));f(cx-w,cy+y,w*2+1,1,col)}};
 const sky=(cols,y0,y1)=>{const n=cols.length,bh=(y1-y0)/n;for(let i=0;i<n;i++){const a=Math.round(y0+i*bh),b=Math.round(y0+(i+1)*bh);f(0,a,W,b-a,cols[i]);if(i<n-1)for(let x=(i%2);x<W;x+=2)px(x,b-1,cols[i+1])}};
 const cloud=(x,y,w,top,bot)=>{const k=Math.max(3,Math.round(w/6));for(let i=0;i<k;i++){const cx=x+i*w/k+w/k/2,r=Math.round(3+Math.sin(i/(k-1)*Math.PI)*w/7);circ(cx,y-r/2+2,r,bot)}for(let i=0;i<k;i++){const cx=x+i*w/k+w/k/2,r=Math.round(2+Math.sin(i/(k-1)*Math.PI)*w/7);circ(cx,y-r/2,r,top)}f(x+2,y+1,w-4,2,bot)};
 const ridge=(y0,amp,freq,col,cap,phase=0)=>{for(let x=0;x<W;x++){const h=Math.round(amp*(.55+.3*Math.sin(x/freq+phase)+.15*Math.sin(x/(freq*.37)+phase*2)));f(x,y0-h,1,h+1,col);if(cap&&h>amp*.72)f(x,y0-h,1,Math.round((h-amp*.72)*1.2),cap)}};
 const tree=(x,y,r,cs,trunk)=>{f(x-1,y,3,Math.round(r*.9),trunk);circ(x,y-r*.3,r,cs[0]);circ(x-1,y-r*.5,r-1,cs[1]);circ(x-2,y-r*.75,Math.max(1,r-3),cs[2]);px(x-3,y-r,cs[3])};
 const hz=Math.round(H*.36);
 if(kind==='grass'||kind==='town'){
  sky(['#6fc4ff','#86cfff','#9fdaff','#b8e5ff','#d2efff'],0,hz);
  // sun glow
  circ(W-30,16,10,'#e6f6ff');circ(W-30,16,7,'#fff8d8');circ(W-30,16,5,'#fffdf0');
  for(let i=0;i<5;i++){const cw=24+R()*30;cloud(R()*W-10,8+R()*hz*.45,cw,'#ffffff','#cfe6fb')}
  ridge(hz-6,hz*.5,14,'#9db8e8','#f2f6ff',1.3);ridge(hz-2,hz*.34,9,'#7fa6d8',null,2.1);
  ridge(hz+2,hz*.22,11,'#78c070',null,.4);ridge(hz+4,hz*.13,7,'#5fae5a',null,3);
  if(kind==='grass'){for(let x=4;x<W;x+=9+Math.floor(R()*6))tree(x,hz+2-Math.floor(R()*3),5+Math.floor(R()*3),['#2f7a3e','#3f9a4a','#58b85a','#8ad87a'],'#6a4a30')}
  // ground bands
  const gc=kind==='grass'?['#58b354','#62bd57','#6dc75b','#78d05f','#82d864']:['#d9c49a','#e2cea4','#ead8ae','#f0e0b8','#f4e6c0'];
  sky(gc,hz+3,H);
  if(kind==='grass'){
   // dirt path
   for(let y=hz+3;y<H;y++){const t=(y-hz)/(H-hz),cx=W*.5+Math.sin(t*3.2+.5)*W*.12,w=W*(.14+t*.22);f(cx-w/2,y,w,1,t<.5?'#d6b77e':'#dcc088');if(R()<.5)px(cx-w/2+R()*w,y,'#c4a26a');px(cx-w/2-1,y,'#9ccf6a');px(cx+w/2,y,'#9ccf6a')}
   for(let i=0;i<Math.round(W*H/60);i++){const y=hz+4+Math.floor(R()*(H-hz-4)),t=(y-hz)/(H-hz),x=Math.floor(R()*W);if(t<.08)continue;const sz=t>.5?2:1;px(x,y,'#4c9c47');px(x+1,y-sz,'#4c9c47');px(x+2,y,'#4c9c47');if(sz>1)px(x+1,y-1,'#8ee070')}
   for(let i=0;i<Math.round(W*H/450);i++){const y=hz+10+Math.floor(R()*(H-hz-10)),x=Math.floor(R()*W),col=['#ffffff','#ffd23f','#ff9ec7','#c9a2ff'][Math.floor(R()*4)];px(x,y-1,col);px(x-1,y,col);px(x+1,y,col);px(x,y+1,col);px(x,y,'#ffd23f')}
   for(let i=0;i<5;i++){const x=R()*W,y=hz+20+R()*(H-hz-30);f(x,y,5,3,'#8a93a8');f(x+1,y-1,3,1,'#c6cddb');f(x,y+3,5,1,'#4a8a46')}
   // foreground grass fringe
   for(let x=0;x<W;x+=2){const h=2+Math.floor(R()*4);f(x,H-h,1,h,'#3f8a3e');px(x,H-h,'#62b85a')}
  }else{
   // cobblestone plaza
   for(let y=hz+4;y<H;y+=4)for(let x=(y/4)%2?0:5;x<W;x+=10){f(x,y,9,3,'#e6d2a6');f(x,y,9,1,'#f8ecc8');px(x+8,y+2,'#c4ac80')}
   // plaza ring
   const fx=W/2,fy=hz+46;for(let y=-26;y<=26;y++)for(let x=-48;x<=48;x++){const d=(x*x)/(48*48)+(y*y)/(26*26);if(d<=1&&d>.82&&(x+y)%2===0)px(fx+x,fy+y,'#c4ac80');else if(d<=.82&&(x+y*3)%5===0)px(fx+x,fy+y,'#f8ecc8')}
   // grass beds
   for(const[gx,gw]of[[0,W*.22],[W*.78,W*.22]]){for(let y=H-26;y<H;y++)f(gx,y,gw,1,y===H-26?'#8ad87a':(y%3?'#5fae5a':'#58a852'));for(let i=0;i<10;i++){const x=gx+R()*gw,y=H-22+R()*18;px(x,y,['#ff9ec7','#ffd23f','#ffffff','#c9a2ff'][i%4]);px(x,y+1,'#3f8a3e')}}
   // houses
   const house=(x,w,h,roof,wall)=>{const y=hz+16;f(x,y-h,w,h,wall);f(x,y-h,2,h,shadeHex(wall,-.12));f(x+w-1,y-h,1,h,shadeHex(wall,-.18));
    for(let i=0;i<11;i++){f(x-4+Math.round(i*.9),y-h-11+i,w+8-Math.round(i*.9)*2,1,i%3===0?shadeHex(roof,.25):(i%3===1?roof:shadeHex(roof,-.18)))}
    f(x-5,y-h,w+10,2,shadeHex(roof,-.35));f(x+w-8,y-h-16,4,7,'#9a6a4a');f(x+w-9,y-h-17,6,2,'#7a4a30');
    for(const wx of[x+4,x+w-11]){f(wx,y-h+6,7,7,'#5a3a2a');f(wx+1,y-h+7,5,5,'#ffe9a0');f(wx+1,y-h+9,5,1,'#c08a58');f(wx+3,y-h+7,1,5,'#c08a58');f(wx-1,y-h+13,9,2,'#a86a3c');px(wx+1,y-h+12,'#ff86ad');px(wx+4,y-h+12,'#ff86ad');px(wx+2,y-h+12,'#7ee07a')}
    f(x+w/2-4,y-12,8,12,'#6a4030');f(x+w/2-3,y-11,6,11,'#9a6440');f(x+w/2-3,y-11,6,1,'#b8805a');px(x+w/2+1,y-5,'#ffd23f');f(x+w/2-5,y,10,1,'#c4ac80')};
   const sx=W/160;[[2,30,30,'#e8483b','#fff1d0'],[38,26,36,'#3f7fe0','#fff6e2'],[100,26,30,'#4cc35a','#fff1d0'],[134,26,36,'#9b5de5','#fff6e2']].forEach(([x,w,h,r,wl])=>house(Math.round(x*sx),w,h,r,wl));
   // fountain
   f(fx-22,fy-4,44,10,'#8a93a8');f(fx-22,fy-4,44,2,'#d8dee8');f(fx-20,fy-1,40,5,'#4aa8e8');f(fx-18,fy-1,14,1,'#c8ecff');f(fx+6,fy+1,8,1,'#c8ecff');
   f(fx-3,fy-20,6,17,'#c9ced8');f(fx-2,fy-20,2,17,'#eef2f8');f(fx-9,fy-22,18,3,'#aab4c3');f(fx-9,fy-22,18,1,'#d8dee8');f(fx-2,fy-27,4,5,'#c9ced8');
   for(let i=0;i<8;i++){px(fx-8+i*2,fy-24-(i%2)*2,'#c8ecff');px(fx-12+i*3,fy-5-(i%2),'#ffffff')}
   // lamps & trees
   for(const lx of[W*.3,W*.7]){f(lx,fy-22,2,26,'#3a3a4a');f(lx-3,fy-27,8,5,'#ffe9a0');f(lx-3,fy-28,8,1,'#3a3a4a');f(lx-2,fy-22,6,1,'#3a3a4a')}
   tree(W*.06,hz+40,9,['#2f7a3e','#3f9a4a','#58b85a','#8ad87a'],'#6a4a30');tree(W*.95,hz+42,10,['#2f7a3e','#3f9a4a','#58b85a','#8ad87a'],'#6a4a30');
   for(let i=0;i<14;i++){const x=R()*W,y=hz+8+R()*(H-hz-12);px(x,y,['#ff9ec7','#ffd23f','#ffffff'][i%3]);px(x+1,y+1,'#4cc35a')}
  }}
 if(kind==='cave'){
  sky(['#140e26','#1b1432','#22193e','#2a1f4a','#33265a'],0,hz+14);
  // rock wall texture
  for(let i=0;i<W*hz/14;i++){const x=Math.floor(R()*W),y=Math.floor(R()*(hz+10));f(x,y,2+Math.floor(R()*4),1,R()<.5?'#2e2450':'#18112c')}
  // back pillars
  for(let x=10;x<W;x+=46+Math.floor(R()*20)){const w=10+Math.floor(R()*8);f(x,0,w,hz+14,'#1a1330');f(x,0,2,hz+14,'#3a2e62')}
  // stalactites
  for(let i=0;i<W/7;i++){const x=Math.floor(R()*W),h=6+Math.floor(R()*20);for(let j=0;j<h;j++){const w=Math.max(1,Math.round((1-j/h)*4));f(x-w/2,j,w,1,j%5===0?'#3a2e62':'#0f0a1e')}}
  // crystals with glow
  const crys=(x,y,h,c1,c2,c3)=>{const rr=Math.round(h*1.3);for(let yy=-rr;yy<=rr;yy++)for(let xx=-rr;xx<=rr;xx++){if(xx*xx+yy*yy>rr*rr||(xx+yy)%2)continue;px(x+xx,y-h/2+yy,c3)}for(let k=-1;k<=1;k++){const hh=Math.round(h*(k===0?1:.65)),xx=x+k*3;for(let j=0;j<hh;j++){const w=Math.max(1,Math.round(2*(1-j/hh))+1);f(xx-w/2,y-j,w,1,j>hh-3?'#ffffff':(k<0?c2:c1))}}};
  const glowCol=['#2f3f7a','#5a2f6a'];
  for(let i=0;i<9;i++){const x=10+R()*(W-20),y=hz-6+R()*16,pink=R()<.35;crys(x,y,6+Math.floor(R()*7),pink?'#ff9ec7':'#7fe3ff',pink?'#c9508a':'#3a9ad8',pink?glowCol[1]:glowCol[0])}
  // floor
  sky(['#2a2046','#30254f','#372b58','#3e3161','#45376a'],hz+14,H);
  for(let y=hz+16;y<H;y+=Math.max(4,Math.round((y-hz)/7))){const rh=Math.max(4,Math.round((y-hz)/7));for(let x=(Math.floor(y/rh)%2)*9;x<W;x+=18+Math.floor(R()*4)){f(x,y,16,rh-1,'#4a3c72');f(x,y,16,1,'#5e4e8a');f(x,y+rh-2,16,1,'#2e2450')}}
  for(let i=0;i<5;i++){const x=R()*W,y=hz+30+R()*(H-hz-40),w=14+R()*16;f(x,y,w,3,'#3a6aa8');f(x+2,y,w-4,1,'#7fe3ff');px(x+w/2,y+1,'#ffffff')}
  for(let i=0;i<8;i++){const x=R()*W,y=hz+20+R()*(H-hz-26);f(x,y,1,3,'#d8cce8');f(x-2,y-1,5,2,i%2?'#ff9ec7':'#7fe3ff');px(x-1,y-1,'#ffffff')}
  for(let x=0;x<W;x+=3){const h=2+Math.floor(R()*5);f(x,H-h,3,h,'#1a1330')}
 }
 if(kind==='castle'){
  sky(['#3a2a6a','#6a3a8a','#b04a8a','#e8687a','#ff9a6a','#ffc27a'],0,hz+8);
  // sun
  circ(W*.66,hz-2,16,'#ffd08a');circ(W*.66,hz-2,12,'#ffe8a8');circ(W*.66,hz-2,8,'#fff6d8');
  for(let i=0;i<3;i++){const y=hz-14+i*6;f(W*.66-18,y,36,1,'#ff9a6a')}
  for(let i=0;i<4;i++)cloud(R()*W,10+R()*hz*.4,26+R()*24,'#ffb0a0','#c86a8a');
  // far castle silhouette
  const tower=(x,w,h,col,win)=>{const y=hz+6;f(x,y-h,w,h,col);for(let i=0;i<w;i+=3)f(x+i,y-h-2,2,2,col);f(x+w/2-1,y-h-12,1,10,col);f(x+w/2,y-h-12,5,3,'#e0384a');
   if(win)for(let yy=y-h+6;yy<y-6;yy+=8){f(x+w/2-1,yy,2,3,'#ffd23f');px(x+w/2-1,yy,'#fff4b0')}};
  tower(W*.05,14,34,'#4a2a5a',1);tower(W*.15,40,22,'#4a2a5a',0);tower(W*.38,16,48,'#3a2048',1);tower(W*.5,34,26,'#3a2048',0);tower(W*.75,14,40,'#4a2a5a',1);tower(W*.86,30,20,'#4a2a5a',0);
  // near wall with torches
  const wy=hz+16;f(0,wy-12,W,14,'#5a3a5a');for(let x=0;x<W;x+=8){f(x,wy-15,5,3,'#5a3a5a');f(x,wy-15,5,1,'#7a5a7a')}for(let y=wy-10;y<wy;y+=4)for(let x=(y%8?0:4);x<W;x+=8)f(x,y,7,1,'#4a2a4a');
  for(const tx of[W*.12,W*.42,W*.72]){f(tx,wy-9,2,6,'#3a2a2a');circ(tx+1,wy-11,4,'#8a4a5a');f(tx,wy-13,2,3,'#ffd23f');px(tx,wy-14,'#ff6a3c')}
  // courtyard floor
  sky(['#8a6a5a','#94725e','#9e7a64','#a8826a','#b28a70'],wy+2,H);
  for(let y=wy+3;y<H;y+=Math.max(3,Math.round((y-hz)/8))){const rh=Math.max(3,Math.round((y-hz)/8));for(let x=(Math.floor(y/rh)%2)*7;x<W;x+=14){f(x,y,13,rh-1,'#a8826a');f(x,y,13,1,'#c49c80');f(x,y+rh-2,13,1,'#7a5a4a')}}
  for(let i=0;i<6;i++){const x=R()*W,y=wy+18+R()*(H-wy-26);f(x,y,6,3,'#6a4a40');f(x+1,y-1,4,1,'#8a6a5a')}
  for(let y=wy+2;y<H;y++){const t=(y-wy)/(H-wy),w=W*(.18+t*.3),cx=W*.5;f(cx-w/2,y,w,1,'#a61f3a');px(cx-w/2,y,'#ffc23d');px(cx+w/2-1,y,'#ffc23d');if(y%6===0)f(cx-w/2+2,y,w-4,1,'#c42a48')}
  // banners
  for(const bx of[W*.27,W*.58]){f(bx,wy-12,8,16,'#a61f3a');f(bx,wy-12,8,2,'#d77f1e');f(bx+3,wy-6,2,4,'#ffd23f');f(bx,wy+4,3,2,'#a61f3a');f(bx+5,wy+4,3,2,'#a61f3a')}
 }
 return c}
function shadeHex(hex,amt){const n=parseInt(hex.slice(1),16);const fn=v=>Math.max(0,Math.min(255,Math.round(amt<0?v*(1+amt):v+(255-v)*amt)));return'#'+[n>>16,n>>8&255,n&255].map(v=>fn(v).toString(16).padStart(2,'0')).join('')}

function makeBG(kind,W=160,H=140){return makeBG2(kind,W,H)}

