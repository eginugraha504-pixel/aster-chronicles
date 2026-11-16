/* =====================================================================
   LATAR BERANDA — alun-alun kota Aster (160×300, potret) + animasi
   Lapisan: langit, gunung, kastil Aster di bukit, deretan rumah, bendera
   untaian, kios pasar, alun-alun batu, pohon & bunga depan.
   Animasi (digambar tiap frame): awan, asap cerobong, bendera kastil,
   kelopak bunga jatuh, burung, kilau air mancur.
   ===================================================================== */
const HOME_W=160,HOME_H=300;
function homeRng(seed){let s=seed;return()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function pxKit(g){
 const f=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))};
 const px=(x,y,c)=>f(x,y,1,1,c);
 const circ=(cx,cy,r,c)=>{for(let y=-r;y<=r;y++){const w=Math.round(Math.sqrt(Math.max(0,r*r-y*y)));f(cx-w,cy+y,w*2+1,1,c)}};
 const ell=(cx,cy,rx,ry,c)=>{for(let y=-ry;y<=ry;y++){const w=Math.round(rx*Math.sqrt(Math.max(0,1-(y*y)/(ry*ry))));f(cx-w,cy+y,w*2+1,1,c)}};
 const poly=(pts,c)=>{const ys=pts.map(p=>p[1]),y0=Math.floor(Math.min(...ys)),y1=Math.ceil(Math.max(...ys));for(let y=y0;y<=y1;y++){const xs=[];for(let i=0,j=pts.length-1;i<pts.length;j=i++){const[xi,yi]=pts[i],[xj,yj]=pts[j];if((yi>y+.5)!==(yj>y+.5))xs.push(xi+(y+.5-yi)*(xj-xi)/(yj-yi))}xs.sort((a,b)=>a-b);for(let k=0;k+1<xs.length;k+=2)f(Math.round(xs[k]),y,Math.round(xs[k+1])-Math.round(xs[k]),1,c)}};
 const bands=(cols,y0,y1,x0=0,x1=HOME_W)=>{const n=cols.length,bh=(y1-y0)/n;for(let i=0;i<n;i++){const a=Math.round(y0+i*bh),b=Math.round(y0+(i+1)*bh);f(x0,a,x1-x0,b-a,cols[i]);if(i<n-1)for(let x=x0+(i%2);x<x1;x+=2)px(x,b-1,cols[i+1])}};
 return{f,px,circ,ell,poly,bands}}
function cloudShape(K,x,y,w,cs){const k=Math.max(3,Math.round(w/7));for(let i=0;i<k;i++){const cx=x+i*w/k+w/k/2,r=Math.round(3+Math.sin(i/(k-1)*Math.PI)*w/6);K.circ(cx,y-r/2+3,r,cs[2])}
 for(let i=0;i<k;i++){const cx=x+i*w/k+w/k/2,r=Math.round(2+Math.sin(i/(k-1)*Math.PI)*w/6);K.circ(cx-1,y-r/2+1,r,cs[1])}
 for(let i=1;i<k-1;i++){const cx=x+i*w/k+w/k/2-2,r=Math.round(1+Math.sin(i/(k-1)*Math.PI)*w/9);K.circ(cx,y-r/2-1,r,cs[0])}K.f(x+2,y+3,w-4,2,cs[2])}

function makeHomeScene(){
 const W=HOME_W,H=HOME_H,c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');const K=pxKit(g),{f,px,circ,ell,poly,bands}=K;const R=homeRng(2026);
 const anim={smoke:[],flags:[],sparkle:[]};
 // ---------- langit ----------
 bands(['#4f9be8','#5aa8f0','#68b4f4','#78c0f6','#8acbf8','#9dd6fa','#b2e0fb','#c8e9fb','#ddeffa','#f2ecdc','#ffe6c8'],0,112);
 // matahari & sinar
 for(let r=22;r>0;r-=3)circ(128,26,r,['#cfe8fb','#dcedf9','#e8f2f6','#f5f4ec','#fff6dc','#fff8e4','#fffbee','#fffdf6'][Math.min(7,Math.floor((22-r)/3))]);
 // awan statis jauh
 for(let i=0;i<4;i++)cloudShape(K,-10+i*48+R()*10,62+R()*14,30+R()*16,['#ffffff','#f4f2f8','#dfe4f2']);
 // ---------- gunung ----------
 const ridge=(y0,amp,fr,ph,col,snow)=>{for(let x=0;x<W;x++){const h=Math.round(amp*(.5+.32*Math.sin(x/fr+ph)+.18*Math.sin(x/(fr*.41)+ph*1.7)));f(x,y0-h,1,h+1,col);if(snow&&h>amp*.66)f(x,y0-h,1,Math.round((h-amp*.66)*1.3),snow)}};
 ridge(104,40,15,.7,'#a9b8e6','#f4f6ff');ridge(108,30,10,2.4,'#8ea4d8','#e6ecfb');ridge(112,18,12,.2,'#7f9ccc');
 // ---------- bukit & kastil Aster ----------
 ell(80,124,70,24,'#7cc46a');ell(80,126,62,20,'#8cd078');for(let x=24;x<136;x++)if((x*7)%11<2)px(x,112+Math.round(Math.abs(x-80)/7),'#a6e08c');
 for(let y=104;y<128;y++){const w=3+(y-104)/4;f(80-w/2+Math.sin(y/3),y,w,1,'#e8d2a0')}
 const CX=80,CY=104; // dasar kastil
 const tower=(x,w,h,roof)=>{f(x,CY-h,w,h,'#eae4f4');f(x,CY-h,1,h,'#ffffff');f(x+w-1,CY-h,1,h,'#b8b0d0');
  for(let i=0;i<w;i+=2)f(x+i,CY-h-2,1,2,'#d8d0e8');
  poly([[x-1,CY-h-1],[x+w/2,CY-h-10-w*.6],[x+w+1,CY-h-1]],roof[1]);poly([[x-1,CY-h-1],[x+w/2,CY-h-10-w*.6],[x+w/2,CY-h-1]],roof[0]);
  for(let wy=CY-h+4;wy<CY-3;wy+=6)f(x+Math.floor(w/2)-1,wy,2,3,'#ffd27a');
  anim.flags.push([Math.round(x+w/2),Math.round(CY-h-10-w*.6)])};
 f(CX-24,CY-14,48,14,'#e2dcee');f(CX-24,CY-14,48,1,'#ffffff');for(let i=0;i<48;i+=3)f(CX-24+i,CY-16,2,2,'#d8d0e8');
 tower(CX-28,8,22,['#6aa8ff','#3a6ad0']);tower(CX+20,8,22,['#6aa8ff','#3a6ad0']);tower(CX-14,7,30,['#ff8ab0','#d04a78']);tower(CX+7,7,30,['#ff8ab0','#d04a78']);tower(CX-5,10,40,['#ffd84a','#e09a1a']);
 f(CX-4,CY-9,8,9,'#6a4a8a');circ(CX,CY-9,4,'#6a4a8a');f(CX-3,CY-8,6,8,'#4a2e6a');
 // ---------- hutan di kaki bukit ----------
 f(0,108,W,66,'#9fd88a');for(let x=-4;x<W+6;x+=7){const r=5+Math.floor(R()*3);circ(x,121,r,'#4f9a50');circ(x-1,119,r-1,'#66b25e');circ(x-2,117,Math.max(1,r-3),'#86cc74')}
 // ---------- tembok kota ----------
 f(0,124,W,14,'#d8c4a0');f(0,124,W,1,'#f2e2c0');for(let x=0;x<W;x+=6){f(x,121,4,3,'#d8c4a0');f(x,121,4,1,'#f2e2c0')}for(let y=127;y<138;y+=3)for(let x=(y%2)*3;x<W;x+=6)f(x,y,5,1,'#c9b088');
 // ---------- rumah baris belakang (lebih pudar) ----------
 const backRoofs=['#e8a0a0','#a0c4e8','#a8dcc0','#d0b8ec','#f0c898'];
 for(let i=0,x=-6;x<W;i++){const w=14+Math.floor(R()*8),h=16+Math.floor(R()*10),base=152,top=base-h;f(x,top,w,h,'#f6ead8');f(x+w-1,top,1,h,'#e0ceb0');
  poly([[x-2,top+1],[x+w/2,top-9],[x+w+2,top+1]],backRoofs[i%5]);for(let wx=x+3;wx<x+w-3;wx+=5){f(wx,top+5,2,3,'#e8c880')}x+=w+2+Math.floor(R()*3)}
 f(0,150,W,24,'#efe0c0');
 // ---------- deretan rumah ----------
 const roofs=[['#ff7a6a','#d8403a'],['#6ac0ff','#2f7ad8'],['#7ee0b0','#2aa878'],['#c89aff','#8a5ad8'],['#ffb05a','#d8781a']];
 const house=(x,w,h,base,ri,opt={})=>{const top=base-h;const[rl,rd]=roofs[ri%roofs.length];
  if(opt.chim){f(x+w-6,top-12,4,8,'#b05a3a');f(x+w-6,top-12,4,1,'#d8805a');anim.smoke.push([x+w-4,top-13,R()*3])}
  f(x,top,w,h,opt.wall||'#fff3d6');f(x,top,1,h,'#ffffff');f(x+w-1,top,1,h,'#e2c79a');
  if(opt.timber){for(let i=3;i<w-2;i+=7)f(x+i,top,1,h,'#9a5a2a');f(x,top+Math.floor(h/2),w,1,'#9a5a2a')}
  poly([[x-3,top+1],[x+w/2,top-Math.max(10,w*.55)],[x+w+3,top+1]],rd);poly([[x-3,top+1],[x+w/2,top-Math.max(10,w*.55)],[x+w/2,top+1]],rl);
  for(let i=0;i<w+6;i+=3)px(x-3+i,top,rd);
  const ww=Math.max(3,Math.floor(w/5));for(let wx=x+3;wx+ww<x+w-2;wx+=ww+4){f(wx-1,top+5,ww+2,ww+3,'#9a5a2a');f(wx,top+6,ww,ww+1,'#ffe08a');px(wx,top+6,'#fff8d0');f(wx-1,top+6+ww+1,ww+2,2,'#e8483b');px(wx,top+6+ww+1,'#ff9ab0');px(wx+ww-1,top+6+ww+1,'#ffd23f')}
  if(opt.door){const dx=x+Math.floor(w/2)-2;f(dx,base-7,5,7,'#8a5228');f(dx,base-7,5,1,'#6e3a1a');px(dx+3,base-4,'#ffd23f')}};
 house(-4,22,30,170,0,{chim:1,timber:1,door:1});house(20,18,40,166,1,{chim:1});house(40,16,24,172,4,{timber:1,door:1});
 house(104,18,26,172,2,{timber:1,door:1});house(124,18,40,166,3,{chim:1});house(144,22,30,170,4,{chim:1,timber:1,door:1});
 // menara jam di tengah (tertutup karakter sebagian)
 f(70,128,20,44,'#f6ead0');f(70,128,1,44,'#ffffff');f(89,128,1,44,'#d8c4a0');poly([[67,129],[80,110],[93,129]],'#2f7ad8');poly([[67,129],[80,110],[80,129]],'#6ac0ff');
 circ(80,138,5,'#fffaf0');circ(80,138,4,'#ffffff');f(80,135,1,4,'#3b2416');f(80,138,3,1,'#3b2416');for(const[a,b]of[[80,134],[84,138],[80,142],[76,138]])px(a,b,'#9a5a2a');
 // ---------- untaian bendera ----------
 const bunting=(x0,y0,x1,y1,sag)=>{const cols=['#e8483b','#ffd23f','#3fa0ec','#4cc24a','#ff7aa8','#9b6bf2'];let k=0;for(let x=x0;x<=x1;x++){const t=(x-x0)/(x1-x0),y=Math.round(y0+(y1-y0)*t+Math.sin(t*Math.PI)*sag);px(x,y,'#8a6a4a');if((x-x0)%5===2){const c2=cols[k++%cols.length];poly([[x-2,y+1],[x+3,y+1],[x+.5,y+5]],c2)}}};
 bunting(0,134,70,128,8);bunting(90,128,160,134,8);bunting(14,148,66,146,5);bunting(94,146,146,148,5);
 // ---------- alun-alun batu ----------
 for(let y=170;y<H;y++){const t=(y-170)/(H-170);f(0,y,W,1,t<.1?'#e8d6b0':(y%2?'#efdfbc':'#ead9b4'))}
 let row=0;for(let y=172;y<H;){const t=(y-170)/(H-170),bh=Math.round(2+t*5),bw=Math.round(6+t*12),off=(row%2)*Math.round(bw/2);
  for(let x=-off;x<W;x+=bw){f(x+1,y,bw-1,bh-1,R()<.18?'#e2cfa4':'#f4e6c4');f(x+1,y,bw-1,1,'#fbf2da');f(x+bw-1,y,1,bh,'#c9b088');f(x,y+bh-1,bw,1,'#c9b088')}y+=bh;row++}
 // lingkaran sihir alun-alun
 for(let a=0;a<Math.PI*2;a+=.012){const x=80+Math.cos(a)*58,y=226+Math.sin(a)*20;px(x,y,'#d8b878');const x2=80+Math.cos(a)*50,y2=226+Math.sin(a)*17;if(Math.floor(a*20)%3)px(x2,y2,'#e6c88a')}
 // ---------- kios pasar ----------
 const stall=(x,y,w,c1,c2)=>{f(x+1,y,1,20,'#8a5228');f(x+w-2,y,1,20,'#8a5228');f(x,y+12,w,8,'#c07a40');f(x,y+12,w,1,'#e0a060');
  for(let i=0;i<w;i+=3){f(x+i,y+9,2,2,['#e8483b','#ffd23f','#4cc24a','#ff7aa8','#3fa0ec'][Math.floor(R()*5)])}
  for(let i=0;i<w+4;i++){const c=Math.floor(i/4)%2?c1:c2;f(x-2+i,y-4,1,6,c)}for(let i=0;i<w+4;i+=4)poly([[x-2+i,y+2],[x+2+i,y+2],[x+i,y+4]],Math.floor(i/4)%2?c1:c2)};
 stall(2,176,26,'#ffffff','#e8483b');stall(132,176,26,'#ffffff','#3fa0ec');
 const barrel=(x,y)=>{f(x,y,6,8,'#a86a38');f(x,y+1,6,1,'#5a3a22');f(x,y+6,6,1,'#5a3a22');f(x,y,1,8,'#c88a50')};barrel(30,188);barrel(124,188);f(36,191,6,5,'#c9a070');f(36,191,6,1,'#e8c898');
 // ---------- lampu jalan ----------
 const lamp=(x,y)=>{f(x,y,2,30,'#3b2e3a');f(x-2,y+29,6,2,'#3b2e3a');f(x-2,y-6,6,6,'#3b2e3a');f(x-1,y-5,4,4,'#ffe08a');px(x-1,y-5,'#fffbe0');anim.sparkle.push([x,y-3])};lamp(48,178);lamp(110,178);
 // ---------- pohon besar tepi ----------
 const tree=(x,y,r)=>{f(x-2,y,5,22,'#7a4a26');f(x-2,y,1,22,'#9a6a3a');const cs=['#2f7a3e','#3f9a4a','#58b85a','#8ad87a'];circ(x,y-4,r,cs[0]);circ(x-2,y-7,r-2,cs[1]);circ(x-4,y-10,r-5,cs[2]);circ(x-5,y-12,r-8,cs[3]);
  for(let i=0;i<14;i++){const a=R()*6.28,d=R()*r*.8;px(x+Math.cos(a)*d,y-4+Math.sin(a)*d,['#ff9ec7','#ffffff'][i%2])}};
 tree(-2,200,22);tree(162,200,22);
 // ---------- bunga & semak depan ----------
 const bush=(x,y,r)=>{circ(x,y,r,'#3f8a3e');circ(x-1,y-1,r-1,'#58a852');circ(x-2,y-2,Math.max(1,r-3),'#7cc46a');for(let i=0;i<6;i++){const a=R()*6.28;const c2=['#ff7aa8','#ffd23f','#ffffff','#c89aff','#e8483b'][Math.floor(R()*5)];const bx=x+Math.cos(a)*r*.7,by=y+Math.sin(a)*r*.6;px(bx,by,c2);px(bx+1,by,c2);px(bx,by-1,c2)}};
 for(let x=-4;x<W+8;x+=11)bush(x,H-4-Math.round(R()*6),7+Math.round(R()*4));
 bush(14,236,8);bush(146,236,8);
 anim.petals=Array.from({length:14},()=>({x:R()*W,y:R()*H,v:6+R()*8,ph:R()*6,c:R()<.6?'#ffb8d8':'#ffffff'}));
 anim.clouds=Array.from({length:3},(_,i)=>({x:i*60+R()*30,y:14+i*14+R()*6,w:34+R()*18,v:2+R()*2}));
 anim.birds=[{x:-20,y:48,v:14}];
 return{c,anim}}

let HOME_SCENE=null;
function drawHomeScene(g,t){if(!HOME_SCENE)HOME_SCENE=makeHomeScene();const S0=HOME_SCENE,A=S0.anim,K=pxKit(g),W=HOME_W,H=HOME_H;
 g.drawImage(S0.c,0,0);
 // awan bergerak (di atas langit, di belakang kastil tidak masalah)
 for(const cl of A.clouds){const x=((cl.x+t*cl.v)%(W+cl.w+20))-cl.w-10;cloudShape(K,x,cl.y,cl.w,['#ffffff','#f6f6fb','#e2e8f4'])}
 // burung
 for(const b of A.birds){const x=((b.x+t*b.v)%(W+60))-20,y=b.y+Math.sin(t*2)*3,w=Math.floor(t*6)%2;for(const[dx,dy]of[[0,0],[7,4],[12,-2]]){const bx=x+dx,by=y+dy;K.px(bx,by,'#3b2e4a');K.px(bx-1,by-1+w,'#3b2e4a');K.px(bx+1,by-1+w,'#3b2e4a');K.px(bx-2,by-w,'#3b2e4a');K.px(bx+2,by-w,'#3b2e4a')}}
 // bendera kastil berkibar
 for(const[x,y]of A.flags){K.f(x,y-6,1,7,'#5a4a6a');const w=Math.floor(t*4+x)%2;K.f(x+1,y-6,4,2,'#e8483b');K.f(x+5,y-6+w,1,2,'#e8483b');K.px(x+1,y-6,'#ff8a7a')}
 // asap cerobong
 for(const[x,y,ph]of A.smoke)for(let i=0;i<4;i++){const k=((t*.6+ph+i/4)%1),r=1+Math.round(k*3);K.circ(x+Math.round(Math.sin(k*5+ph)*2+k*6),y-Math.round(k*18),r,`rgba(240,240,248,${(1-k)*.8})`)}
 // kilau lampu
 for(const[x,y]of A.sparkle){if(Math.floor(t*3+x)%3===0){K.px(x,y-6,'#fffbe0');K.px(x-3,y,'#fffbe0');K.px(x+4,y,'#fffbe0')}}
 // kelopak jatuh
 for(const p of A.petals){const y=(p.y+t*p.v)%(H+10)-5,x=(p.x+Math.sin(t*1.3+p.ph)*8+t*3)%(W+10)-5;K.px(x,y,p.c);if(Math.floor(t*4+p.ph)%2)K.px(x+1,y,p.c)}}
