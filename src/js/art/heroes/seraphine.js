/* ================= HERO ART (chibi 3/4 sprites) ================= */
const ART_SERA=(()=>{
const PAL={s1:'#fff1e6',s2:'#ffd8c2',s3:'#f0a891',h1:'#fff6d8',h2:'#ffe08a',h3:'#f0b25a',h4:'#c97a4a',e1:'#1a2466',e2:'#3566d8',e3:'#86c8ff',W:'#ffffff',pk:'#ff9aaa',bl:'#ffbcc6',mo:'#c4506a',tg:'#ff7f93',o1:'#ffffff',o2:'#eeecfb',o3:'#bdb6e6',o4:'#857cc4',y1:'#fff4b0',y2:'#ffc23d',y3:'#d77f1e',b1:'#6c9cff',b2:'#4268e0',b3:'#2b3fa8',r1:'#ff8fa0',r2:'#e2365a',r3:'#9c1c44',L1:'#ffffff',L3:'#a3b4d6',L2:'#e4ecfa',gr:'#4a2c4a',bt:'#2b3fa8',bt2:'#1a2370',btL:'#6c9cff',LASH:'#38183a',BR:'#a85a3c',tear:'#86d4ff'};
const OUTC='#2a1430';
function hx(h){const n=parseInt(h.slice(1),16);return[n>>16,n>>8&255,n&255]}
function mixc(a,b,t){const A=hx(a),B=hx(b);return'#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('')}
const SW=44,SH=44;
const CAPA=["..........................","..........................","..........................","..........................",".......3322223322.........",".....33222211112222.......","....3322111111221112......","...332222222222222222.....","..43322222322222322223....","..43322223322223322222...."];

// ---- signature weapon: Pedang Aurora (winged guard, sun gem, gold fuller) ----
const SWDIRS={d:{d:[0,1],L:[1,0],S:[-1,0],w:[1,0]},u:{d:[0,-1],L:[-1,0],S:[1,0],w:[1,0]},r:{d:[1,0],L:[0,-1],S:[0,1],w:[0,1]},ur:{d:[1,-1],L:[-1,0],S:[1,0],w:[1,1]},ul:{d:[-1,-1],L:[1,0],S:[-1,0],w:[1,-1]},dr:{d:[1,1],L:[1,0],S:[-1,0],w:[1,-1]}};
function paintSword(U,bx,by,dk,len,tw,big){const p=PAL,D=SWDIRS[dk],[dx,dy]=D.d;
 for(let u=1;u<=len+1;u++){const cx=bx+dx*u,cy=by+dy*u;
  if(u===len+1){U(cx,cy,p.W);continue}
  if(u===len){U(cx,cy,p.L1);U(cx+D.L[0],cy+D.L[1],p.W);continue}
  U(cx+D.L[0],cy+D.L[1],(tw!==undefined&&tw===u)?'#fff6b0':p.W);U(cx,cy,u<=1?p.y2:(u<len-1?p.y1:p.L1));U(cx+D.S[0],cy+D.S[1],p.L3)}
 const[wx,wy]=D.w;
 const seg=(a,b,c)=>{const n=Math.max(Math.abs(b[0]-a[0]),Math.abs(b[1]-a[1]))||1;for(let i=0;i<=n;i++)U(Math.round(a[0]+(b[0]-a[0])*i/n),Math.round(a[1]+(b[1]-a[1])*i/n),c)};
 const diag=dx!==0&&dy!==0;const WP=big?[[1,0],[2,0],[3,1],[4,2],[5,4]]:diag?[[1,0],[2,0],[2,1]]:[[1,0],[2,1],[3,2]];
 for(const sg of[1,-1]){const o=([k,a])=>[bx+wx*k*sg+dx*a,by+wy*k*sg+dy*a];
  for(let i=0;i<WP.length-1;i++)seg(o(WP[i]),o(WP[i+1]),i===0?p.y2:(i===WP.length-2?'#e4ecfa':p.W));
  if(big){seg(o([2,-1]),o([4,1]),'#e4ecfa');U(...o([1,-1]),p.y3)}}
 U(bx,by,p.r2);U(bx+D.L[0],by+D.L[1],p.r1);
 U(bx-dx,by-dy,p.gr);U(bx-dx*2,by-dy*2,p.y2);U(bx-dx*3,by-dy*3,p.b2);if(big){U(bx-dx*3,by-dy*3,p.y3);U(bx-dx*4,by-dy*4,p.y2);U(bx-dx*5,by-dy*5,p.b2);U(bx-dx*2,by-dy*2,p.gr)}}
function drawAuroraIcon(){const W=16,H=24,c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');const G=Array.from({length:H},()=>Array(W).fill(null));
 paintSword((x,y,col)=>{if(col&&x>=0&&y>=0&&x<W&&y<H)G[y][x]=col},7,17,'u',15,undefined,true);
 const O=G.map(r=>r.slice());for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(G[y][x])continue;for(const[dx,dy]of[[0,1],[-1,0],[1,0],[0,-1]]){const yy=y+dy,xx=x+dx;if(yy>=0&&xx>=0&&yy<H&&xx<W&&G[yy][xx]){O[y][x]=mixc(G[yy][xx],OUTC,.8);break}}}
 for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(O[y][x]){g.fillStyle=O[y][x];g.fillRect(x,y,1,1)}return c}
function drawSera7(f={}){
 const W=SW,H=SH,OX=2,OY=6;const G=Array.from({length:H},()=>Array(W).fill(null));
 const p=PAL,bd=f.bdy||0,hy=bd+(f.headDy||0),sw=f.sway||0,pose=f.pose||'ready',face=f.face||'idle',legs=f.legs||'stand';
 const P=(x,y,c)=>{x=Math.round(x)+OX;y=Math.round(y)+OY;if(c&&x>=0&&y>=0&&x<W&&y<H)G[y][x]=c};
 const get=(x,y)=>{x+=OX;y+=OY;return(x>=0&&y>=0&&x<W&&y<H)?G[y][x]:null};
 const U=(x,y,c)=>P(x,y+bd,c),Hh=(x,y,c)=>P(x,y+hy,c);
 const hlU=(y,a,b,c)=>{for(let x=a;x<=b;x++)U(x,y,c)},hlH=(y,a,b,c)=>{for(let x=a;x<=b;x++)Hh(x,y,c)};
 const ptsH=(arr,c)=>arr.forEach(([x,y])=>Hh(x,y,c)),ptsU=(arr,c)=>arr.forEach(([x,y])=>U(x,y,c));
 const lineU=(x0,y0,x1,y1,c,c2,dx2=0,dy2=1)=>{const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0))||1;for(let i=0;i<=n;i++){const x=x0+(x1-x0)*i/n,y=y0+(y1-y0)*i/n;U(x,y,c);if(c2)U(x+dx2,y+dy2,c2)}};
 const blade=(x0,y0,x1,y1)=>{const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0)),vert=Math.abs(y1-y0)>Math.abs(x1-x0);for(let i=0;i<=n;i++){const x=x0+(x1-x0)*i/n,y=y0+(y1-y0)*i/n;U(x,y,i===n?p.L2:p.L1);U(vert?x+1:x,vert?y:y+1,i===n?null:p.L3)}};
 const guard=(pts)=>{pts.forEach(([x,y],i)=>U(x,y,i===0?p.y1:p.y2))};
 const sword=(bx,by,dk,len)=>(swordPainter('seraphine')||paintSword)(U,bx,by,dk,len,f.tw);
 // ringlet / drill curl: stacked coils with spiral highlight
 const drill=(cx,y0,y1,maxW,far,swayK)=>{const n=y1-y0;for(let y=y0;y<=y1;y++){const t=(y-y0)/n,s=Math.round(sw*swayK*t);
   let w=t>.88?Math.max(1,Math.round(maxW*(1-t)*6)):Math.round(3+(maxW-3)*Math.min(1,t/.22));const a=Math.round(cx-w/2)-s,b=a+w-1,r=(y-y0)%3;if(!far){const c0=get(a-1,y+hy);if(c0&&[p.h1,p.h2,p.h3].includes(c0))Hh(a-1,y,p.h4)}
   for(let x=a;x<=b;x++){const u=w>1?(x-a)/(w-1):.5;let c=far?p.h3:p.h2;
    if(r===2)c=(x===a||x===b)?(far?p.h4:p.h3):(far?p.h4:p.h3);
    else if(r===0&&Math.abs(u-.3)<.21)c=far?p.h2:p.h1;else if(r===1&&Math.abs(u-.65)<.21)c=far?p.h2:p.h1;
    if(x===a&&r!==2)c=far?p.h4:p.h3;Hh(x,y,c)}}
  const s=Math.round(sw*swayK);Hh(Math.round(cx)-s,y1+1,far?p.h4:p.h3)};

 // ---- SKILL: sun halo + wings of light (behind everything) ----
 if(f.halo){const cx=20,cy=9+hy,R=f.halo>1?13:12;for(let y=-R-4;y<=R+4;y++)for(let x=-R-4;x<=R+4;x++){const d=Math.sqrt(x*x+y*y),a=Math.atan2(y,x);
   if(d<=R&&d>=R-1.6)P(cx+x,cy+y,d>R-.8?p.y2:p.y1);else if(d<R-1.6&&d<=R-1)P(cx+x,cy+y,'#fff9e0');
   else if(d>R+.5&&d<=R+3.5&&Math.abs(Math.sin(a*4))>.93)P(cx+x,cy+y,d<R+2?p.y1:p.y2)}}
 // ---- cape (behind) ----
 for(let y=21;y<=31;y++){const s=y>25?Math.round(sw*(y-25)/4):0,a=14-Math.floor((y-21)*.8)-s,b=19;
  for(let x=a;x<=b;x++){let c=p.b2;if(x<=a+1)c=p.b3;if(y>23&&x===a+4)c=p.b1;if(y>25&&x===a+8)c=p.b3;U(x,y,c)}
  if(y===31){for(let x=a;x<=b;x++)if((x-a)%3===2)U(x,y,null)}}
 // ---- back hair: mass + 3 tapered locks ----
 for(let y=7;y<=18;y++){const a=7+(y<11?11-y:0);for(let x=a;x<=17;x++)Hh(x,y,x===a?p.h4:p.h3)}
  const LOCKS=[[7,29,4,0],[11,27,4,1.3],[15,24,3,2.6]];
 for(const[x0,tip,w0,ph]of LOCKS){for(let y=18;y<=tip;y++){const s=Math.round(sw*(y-18)/8),wv=Math.round(Math.sin(y/2.6+ph)*.9),w=y<tip-3?w0:Math.max(1,w0-(y-(tip-3))),a=x0-s+wv+(w0-w>>1);
   for(let x=a;x<a+w;x++)Hh(x,y,x===a?p.h4:(x===a+1&&y<tip-2)?(y%5===0?p.h1:p.h2):p.h3)}
  const s=Math.round(sw*(tip-18)/8),ex=x0-s+Math.round(Math.sin(tip/2.6+ph)*.9);Hh(ex-1,tip,p.h3);Hh(ex-2,tip-1,p.h3);Hh(ex-2,tip-2,p.h4)}
 if(f.wings){const big=f.wings>1,N=big?8:5;
  const feather=(rx,ry,ang,len,c1,c2)=>{for(let i=0;i<=len;i++){const x=rx+Math.cos(ang)*i,y=ry+Math.sin(ang)*i;U(x,y,i>=len-1?'#e4ecfa':c1);U(x,y+1,c2)}};
  for(let k=0;k<N;k++){const t=k/(N-1),ang=Math.PI*(.98+.47*t),len=(big?15:9)-Math.abs(t-.55)*(big?6:3);feather(15,20,ang,Math.round(len),p.W,k%2?'#fff4b0':'#eef3ff')}
  for(let k=0;k<N-2;k++){const t=k/(N-3||1),ang=Math.PI*(1.62+.3*t),len=(big?9:5)-t*2;feather(22,18,ang,Math.round(len),'#eef3ff','#d8e2f8')}}
 if(pose==='back')sword(13,15,'ul',10);
 // far-side ringlet (behind body)
 drill(26.5,18,23,3,true,1.2);
 // ---- legs ----
 const LEG={stand:[[19,0],[16,0]],w0:[[14,0],[19,0]],w1:[[16,-1],[17,0]],w2:[[19,0],[14,0]],w3:[[17,0],[16,-1]]}[legs];
 const leg=(x,lift,far)=>{const so=far?p.o3:p.o1,sh=far?p.o4:p.o3,bo=far?p.bt2:p.bt;
  for(let y=29;y<=30+lift;y++){P(x,y,so);P(x+1,y,so);P(x+2,y,sh)}
  const by=30+lift;P(x,by,p.y2);P(x+1,by,p.y1);P(x+2,by,p.y3);
  for(let xx=x;xx<=x+2;xx++)P(xx,by+1,bo);P(x+3,by+1,bo);for(let xx=x;xx<=x+3;xx++)P(xx,by+2,p.bt2);if(!far)P(x+1,by+1,p.btL)};
 leg(LEG[0][0],LEG[0][1],true);leg(LEG[1][0],LEG[1][1],false);
 // ---- skirt: bell with pleats + frill hem ----
 const SK={25:[16,22],26:[15,23],27:[14,24],28:[15,23]};
 for(let y=25;y<=28;y++){const[a,b]=SK[y];for(let x=a;x<=b;x++){let c=p.o2;if(x<=a+1)c=p.o3;if(x>=b-1)c=p.o1;if(y>=26&&y<=27&&(x-a)%3===2&&x>a+1&&x<b-1)c=p.o3;
  if(y===27)c=(x%2?p.y1:p.y2);if(y===28)c=(x<=a+1?p.o4:p.o3);U(x,y,c)}}
 ptsU([[19,25],[19,26]],p.b2);ptsU([[20,25],[20,26]],p.b1);
 // ---- torso ----
 for(let y=21;y<=24;y++){hlU(y,16,22,p.o2);U(16,y,p.o3);U(17,y,p.o3);U(22,y,p.o1)}
 ptsU([[18,21],[21,21],[19,22],[20,22]],p.y2);U(19,21,p.s3);U(20,21,p.s3);
 U(19,23,p.r1);U(20,23,p.r2);
 hlU(24,16,22,p.y2);U(19,24,p.y1);U(20,24,p.y1);
 // puff sleeves
 ptsU([[14,22],[15,21],[16,21],[14,23],[15,22],[16,22],[15,23],[16,23]],p.o1);ptsU([[14,23],[15,23],[16,23]],p.o3);ptsU([[14,24],[15,24]],p.y2);
 ptsU([[21,21],[22,21],[23,21],[22,22],[23,22]],p.o2);U(23,22,p.o3);
 // neck + chin shadow
 for(let x=19;x<=21;x++)Hh(x,21,p.s3);
 // ---- far side lock (thin, behind cheek) ----
 for(let y=12;y<=17;y++)Hh(27,y,p.h3);Hh(27,18,p.h4);
 // ---- face ----
 const FR={9:[17,24],10:[16,25],11:[15,26],12:[15,26],13:[15,26],14:[15,26],15:[15,26],16:[15,26],17:[15,26],18:[15,26],19:[16,25],20:[18,23]};
 for(let y=9;y<=20;y++){const[a,b]=FR[y];for(let x=a;x<=b;x++)Hh(x,y,(x<=16||(y===20&&(x===18||x===23)))?p.s3:p.s2)}
 Hh(26,15,p.s1);Hh(26,16,p.s1);
 // ---- expressions (eyes: near 3x4, far 2x4) ----
 const L=p.LASH;const He=(x,y,c)=>Hh(x,y+1,c),hlE=(y,a,b,c)=>hlH(y+1,a,b,c),ptsE=(a,c)=>a.forEach(([x,y])=>Hh(x,y+1,c));
 const lash=()=>{hlE(13,17,20,L);He(17,14,L);hlE(13,23,25,L);He(25,14,L)};
 const blush=()=>{He(15,18,p.bl);He(16,18,p.pk);He(17,18,p.bl);He(25,18,p.pk);He(26,18,p.bl)};
 if(face==='idle'){lash();ptsE([[18,14],[23,14],[20,17]],p.W);ptsE([[19,14],[20,14],[20,15],[24,14],[24,15]],p.e1);ptsE([[18,15],[19,15],[19,16],[20,16],[23,15],[24,16]],p.e2);ptsE([[18,16],[18,17],[19,17],[23,16],[23,17],[24,17]],p.e3);blush();He(21,18,p.mo)}
 if(face==='blink'){ptsE([[17,13],[18,14],[19,14],[20,13]],L);ptsE([[23,13],[24,14],[25,13]],L);blush();He(21,18,p.mo)}
 if(face==='happy'){ptsE([[17,15],[18,14],[19,14],[20,15]],L);ptsE([[23,15],[24,14],[25,15]],L);blush();ptsE([[20,18],[21,18],[22,18]],p.mo);He(21,19,p.tg)}
 if(face==='calm'){ptsE([[17,16],[18,17],[19,17],[20,16]],L);ptsE([[23,16],[24,17],[25,16]],L);blush();He(21,18,p.mo)}
 const fierce=()=>{hlE(13,17,20,L);hlE(14,17,20,L);hlE(13,23,25,L);hlE(14,23,24,L);ptsE([[18,15],[20,15],[24,15]],p.e1);ptsE([[19,15],[23,15]],p.W);ptsE([[18,16],[19,16],[20,16],[23,16],[24,16]],p.e2);ptsE([[18,17],[19,17],[20,17],[23,17],[24,17]],p.e3)};
 if(face==='ready'){fierce();He(16,18,p.pk);He(21,18,p.mo);He(21,19,p.mo)}
 if(face==='yell'){fierce();He(16,18,p.pk);ptsE([[19,18],[20,18],[21,18],[22,18]],p.W);ptsE([[19,19],[22,19]],p.mo);ptsE([[20,19],[21,19]],p.tg)}
 if(face==='hurt'){ptsE([[17,13],[18,14],[19,15],[18,16],[17,17]],L);ptsE([[25,13],[24,14],[23,15],[24,16],[25,17]],L);ptsE([[16,18],[16,19],[15,20]],p.tear);He(25,18,p.tear);He(25,19,p.tear);ptsE([[19,19],[20,18],[21,19],[22,18],[23,19]],p.mo)}
 if(face==='daze'){lash();ptsE([[18,14],[19,14],[20,14],[23,14],[24,14]],p.e1);ptsE([[18,15],[19,15],[23,15]],p.W);ptsE([[20,15],[24,15]],p.e2);ptsE([[18,16],[19,16],[20,16],[23,16],[24,16]],p.tear);ptsE([[18,17],[19,17],[20,17],[23,17],[24,17]],p.e3);blush();ptsE([[20,19],[21,18],[22,19]],p.mo)}
 if(face==='skill'){lash();ptsE([[18,14],[19,14],[20,14],[23,14],[24,14]],p.e1);ptsE([[18,15],[19,15],[23,15]],p.W);ptsE([[20,15],[18,16],[24,15],[24,16],[19,17],[20,17],[24,17]],p.e2);ptsE([[19,16],[18,17],[23,16]],p.y1);ptsE([[20,16],[23,17]],p.e3);blush();ptsE([[19,18],[20,18],[21,18],[22,18]],p.mo);ptsE([[20,19],[21,19]],p.tg)}
 // ---- hair cap (ascii) ----
 const CM={'1':p.h1,'2':p.h2,'3':p.h3,'4':p.h4,'t':p.y2,'T':p.y1,'u':p.y3,'r':p.r2,'R':p.r1};
 const ab=f.ahoge||0;
 CAPA.forEach((row,y)=>[...row].forEach((ch,i)=>{if(CM[ch])Hh(6+i,y+(y<2?ab:0),CM[ch])}));
 for(let y=3;y<=9;y++){let mx=-1;[...CAPA[y]].forEach((ch,i)=>{if(ch!=='.')mx=i});if(mx>=0)Hh(6+mx,y,p.h1)}
 // ---- head accessory: blue ribbon bow + tilted mini crown ----
 const cab=(f.ahoge||0);
 const BOW=[".BB...BB.","BhbBKBhbB","BbbBKBbbB",".BB...BB.","..b...b.."],BC={B:p.b2,h:p.b1,b:p.b3,K:p.y2};
 BOW.forEach((row,r)=>[...row].forEach((ch,i)=>{if(BC[ch])Hh(7+i,1+r,BC[ch])}));Hh(11,2,p.y1);
 const CR=["X...X...X","XX.XXX.XX","XXXXXXXXX","XXXXXXXXX","XXXXXXXXX"];
 CR.forEach((row,r)=>[...row].forEach((ch,i)=>{if(ch!=='X')return;const x=16+i,y=-1+r+(i>=5?1:0)-cab;let c=p.y2;if(i>=6)c=p.y1;if(r===4)c=p.y3;if(r===0)c=p.W;if(r===1&&(i===0||i===4||i===8))c=p.y1;Hh(x,y,c)}));
 Hh(20,2-cab,p.r2);Hh(19,2-cab,p.r1);Hh(17,2-cab,p.b2);Hh(23,3-cab,p.b2);
 // ---- bangs: pointed clumps ----
 const BG={16:13,17:12,18:11,19:12,20:11,21:10,22:11,23:12,24:11,25:10,26:11,27:12};
 for(let x=16;x<=27;x++){const e=BG[x];for(let y=9;y<=e;y++)Hh(x,y,y===e?p.h3:p.h2);if([18,21,25].includes(x))Hh(x,e,p.h4);const c=get(x,e+1+hy);if(c===p.s2||c===p.s1)Hh(x,e+1,p.s3)}
 [[17,10],[20,9],[23,10],[26,9]].forEach(([x,y])=>Hh(x,y,p.h1));
 // brows drawn over bangs (anime see-through)
 if(['ready','yell'].includes(face)){ptsH([[16,11],[17,11],[18,12],[19,12],[20,13]],p.BR);ptsH([[23,13],[24,12],[25,12]],p.BR)}
 if(['hurt','daze'].includes(face)){ptsH([[16,13],[17,13],[18,12],[19,12]],p.BR);ptsH([[23,12],[24,13],[25,13]],p.BR)}
 if(face==='skill'){ptsH([[16,12],[17,11],[18,11],[19,12]],p.BR);ptsH([[23,12],[24,11],[25,11]],p.BR)}
 // ---- near side lock: strand -> signature cuff -> princess ringlet ----
 for(let y=10;y<=17;y++){Hh(12,y,p.h3);Hh(13,y,y===14?p.h3:p.h2);Hh(14,y,y>=11&&y<=13?p.h1:(y===15?p.h3:p.h2));Hh(15,y,y>=16?p.h2:p.h3);if(y>=15)Hh(11,y,p.h4)}
 drill(13.5,18,30,5,false,.8);
 // signature hair ornament: "Bintang Fajar" — blue crystal 4-point star pin + dangling gem
 ptsH([[13,16],[14,16],[15,16]],p.y2);ptsH([[13,17],[14,17],[15,17]],p.y3);Hh(15,16,p.y1);
 {const ST=["...L...","...L...","..LMB..","LLMWBbb","..BBb..","...b...","...b..."],SC={L:'#a8ccff',M:'#6c9cff',B:'#4268e0',b:'#2b3fa8',W:'#ffffff'};
  const cx=11,cy=15,cells=[];ST.forEach((row,r)=>[...row].forEach((ch,c)=>{if(SC[ch])cells.push([cx-3+c,cy-3+r,SC[ch]])}));
  const key=new Set(cells.map(([x,y])=>x+','+y));
  for(const[x,y]of cells)for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const k=(x+dx)+','+(y+dy);if(!key.has(k)){key.add(k);Hh(x+dx,y+dy,'#141a4a')}}
  for(const[x,y,c]of cells)Hh(x,y,c);
  const dg=-Math.round(sw/2);ptsH([[11+dg,19],[11+dg,20]],p.y2);Hh(11+dg,21,p.y1);
  ptsH([[10+dg,22],[11+dg,22],[12+dg,22],[11+dg,23]],'#4268e0');Hh(10+dg,22,'#a8ccff');Hh(11+dg,22,'#6c9cff');Hh(11+dg,24,'#141a4a');Hh(9+dg,22,'#141a4a');Hh(13+dg,22,'#141a4a');Hh(10+dg,23,'#141a4a');Hh(12+dg,23,'#141a4a');Hh(11+dg,21,p.y1)}
 // ---- arms + sword ----
 if(pose==='pray'){sword(20,24,'d',7);lineU(16,22,19,22,p.o2,p.o3);ptsU([[19,22],[20,22],[21,22],[19,23],[20,23],[21,23]],p.s2);ptsU([[19,23],[21,23]],p.s3);U(22,22,p.o2)}
 if(pose==='ready'){sword(25,24,'ur',9);
  ptsU([[17,24],[18,24]],p.o3);ptsU([[19,24],[20,24],[21,24],[22,24]],p.y2);U(21,23,p.y1);U(22,23,p.y1);ptsU([[23,24],[24,24],[23,25],[24,25]],p.s2);U(23,25,p.s3)}
 if(pose==='back'){lineU(16,22,15,19,p.o2,p.o3,1,0);ptsU([[14,16],[15,16],[14,17],[15,17]],p.s2);U(15,17,p.s3)}
 if(pose==='slash'){lineU(16,22,22,22,p.o2,p.o3);sword(25,22,'r',10);ptsU([[23,22],[24,22],[23,23],[24,23]],p.s2);U(24,23,p.s3)}
 if(pose==='follow'){lineU(16,22,20,25,p.o2,p.o3);ptsU([[21,25],[22,25],[21,26],[22,26]],p.s2);U(22,26,p.s3);sword(24,27,'dr',8);ptsU([[22,25],[23,25],[22,26],[23,26]],p.s2);U(23,26,p.s3)}
 if(pose==='hit'){lineU(16,22,19,24,p.o2,p.o3);ptsU([[20,24],[21,24],[20,25],[21,25]],p.s2);U(21,25,p.s3);sword(22,26,'dr',7);ptsU([[20,24],[21,24],[20,25],[21,25]],p.s2);U(21,25,p.s3)}
 if(pose==='raise'){lineU(16,21,12,9,p.o2,p.o3,1,0);ptsU([[11,7],[12,7],[11,8],[12,8]],p.s2);U(12,8,p.s3);sword(11,6,'u',10);ptsU([[11,7],[12,7],[11,8],[12,8]],p.s2);U(12,8,p.s3)}
 // ---- anime marks ----
 const marks=[];
 if(f.sweat){marks.push([29,6+hy,p.W],[28,7+hy,p.tear],[29,7+hy,p.W],[28,8+hy,p.tear],[29,8+hy,p.tear],[30,8+hy,p.tear],[29,9+hy,p.tear])}
 if(f.vein){for(const[x,y]of[[28,2],[29,2],[31,2],[32,2],[28,3],[32,3],[28,5],[32,5],[28,6],[29,6],[31,6],[32,6]])marks.push([x,y+hy,'#ff3b5c'])}
 if(f.spark){const o=f.spark;for(const[x,y]of(o===1?[[14,13],[29,10],[27,2]]:[[13,10],[30,14],[25,1]]))marks.push([x,y+hy,p.y1],[x-1,y+hy,p.W],[x+1,y+hy,p.W],[x,y-1+hy,p.W],[x,y+1+hy,p.W])}
 // ---- outline (selective: lighter on lit top/right edges) ----
 const O=G.map(r=>r.slice());
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(G[y][x])continue;let nb=null,dir=null;for(const[dx,dy]of[[0,1],[-1,0],[1,0],[0,-1]]){const yy=y+dy,xx=x+dx;if(yy>=0&&xx>=0&&yy<H&&xx<W&&G[yy][xx]){nb=G[yy][xx];dir=[dx,dy];break}}
  if(nb)O[y][x]=mixc(nb,OUTC,(dir[1]===1)?.72:.8)}
 for(const[x,y,c]of marks){const X=x+OX,Y=y+OY;if(X>=0&&Y>=0&&X<W&&Y<H&&!G[Y][X])O[Y][X]=c}
 const lx=f.lean||0;if(lx){for(const r of O){if(lx>0){r.unshift(...Array(lx).fill(null));r.length=W}else{r.splice(0,-lx);while(r.length<W)r.push(null)}}}
 const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');
 for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(O[y][x]){g.fillStyle=O[y][x];g.fillRect(x,y,1,1)}
 return c;
}
const drawSera6=drawSera7,drawSera3=drawSera7;
const ANIMS={
 idle:[{d:450,f:{tw:3}},{d:450,f:{bdy:1,sway:1,ahoge:1,tw:5}},{d:450,f:{tw:7}},{d:110,f:{face:'blink'}},{d:450,f:{bdy:1,sway:1,ahoge:1}},{d:450,f:{}},{d:600,f:{face:'happy',ahoge:1}}],
 walk:[{d:140,f:{legs:'w0'}},{d:140,f:{legs:'w1',bdy:-1,sway:1,ahoge:1}},{d:140,f:{legs:'w2'}},{d:140,f:{legs:'w3',bdy:-1,sway:1,ahoge:1}}],
 attack:[{d:280,f:{pose:'back',face:'ready',lean:-1,sway:-1}},{d:100,f:{pose:'slash',face:'yell',lean:3,legs:'w0',fx:'slash'}},{d:240,f:{pose:'follow',face:'yell',lean:2,legs:'w0',sway:1,fx:'slash2'}},{d:420,f:{face:'happy',ahoge:1}}],
 hit:[{d:120,f:{pose:'hit',face:'hurt',lean:-3,flash:1,sway:-1,vein:1}},{d:320,f:{pose:'hit',face:'hurt',lean:-2,sway:-1,sweat:1}},{d:420,f:{pose:'hit',face:'daze',lean:-1,sweat:1}},{d:300,f:{face:'daze'}}],
 skill:[{d:280,f:{pose:'pray',face:'calm',fx:'motes'}},{d:220,f:{pose:'pray',face:'calm',wings:1,halo:1,fx:'motes2'}},{d:220,f:{pose:'pray',face:'skill',wings:2,halo:1,spark:1,fx:'sunrise'}},{d:200,f:{pose:'raise',face:'skill',wings:2,halo:2,bdy:-2,fx:'glow',spark:2}},{d:200,f:{pose:'raise',face:'yell',wings:2,halo:2,bdy:-3,fx:'glow2',spark:1}},{d:110,f:{pose:'follow',face:'yell',wings:2,lean:2,fx:'pillar'}},{d:280,f:{pose:'follow',face:'yell',wings:1,lean:2,fx:'pillar2'}},{d:420,f:{face:'happy',ahoge:1,fx:'motes'}}]
};

return{draw:drawSera7,anims:ANIMS,icon:drawAuroraIcon,paintW:paintSword,strike:.7}})();
