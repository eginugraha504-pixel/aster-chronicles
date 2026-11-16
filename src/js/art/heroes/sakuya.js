const ART_SAKU=(()=>{
// ===== Sakuya — Miko Rubah Sakura (same chibi 3/4 style as Seraphine v7.9) =====
const PAL={s1:'#fff1e6',s2:'#ffd8c2',s3:'#f0a891',
 h1:'#7a70b2',h2:'#4b4373',h3:'#332d55',h4:'#1f1a38',hs:'#a99fe0',
 e1:'#4a0d1e',e2:'#c62f45',e3:'#ff9a6e',W:'#ffffff',pk:'#ff9aaa',bl:'#ffbcc6',mo:'#c4506a',tg:'#ff7f93',
 o1:'#ffffff',o2:'#eeecfb',o3:'#bdb6e6',o4:'#857cc4',
 c1:'#ff7a85',c2:'#e0384a',c3:'#a61f3a',c4:'#6a1230',
 k1:'#fff0f5',k2:'#ffc1d6',k3:'#ff86ad',k4:'#d9507f',
 y1:'#fff4b0',y2:'#ffc23d',y3:'#d77f1e',wd1:'#c08a58',wd2:'#7a4a30',
 L1:'#ffffff',L2:'#e4ecfa',L3:'#8e9cc0',ts:'#2a2240',
 LASH:'#38183a',BR:'#1f1a38',tear:'#86d4ff'};
const OUTC='#2a1430';
function hx(h){const n=parseInt(h.slice(1),16);return[n>>16,n>>8&255,n&255]}
function mixc(a,b,t){const A=hx(a),B=hx(b);return'#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('')}
const SW=44,SH=44;
const CAPA=["..........................","..........................","..........................","..........................",".......3322223322.........",".....33222211112222.......","....3322111111221112......","...332222222222222222.....","..43322222322222322223....","..43322223322223322222...."];

// ---- signature weapon: Katana "Hanafubuki" (thin curved blade, round tsuba, wrapped grip, sakura tassel) ----
const SWDIRS={d:{d:[0,1],L:[1,0],S:[-1,0],w:[1,0]},u:{d:[0,-1],L:[-1,0],S:[1,0],w:[1,0]},r:{d:[1,0],L:[0,-1],S:[0,1],w:[0,1]},ur:{d:[1,-1],L:[-1,0],S:[1,0],w:[1,1]},ul:{d:[-1,-1],L:[1,0],S:[-1,0],w:[1,-1]},dr:{d:[1,1],L:[1,0],S:[-1,0],w:[1,-1]}};
function paintKatana(U,bx,by,dk,len,tw,big){const p=PAL,D=SWDIRS[dk],[dx,dy]=D.d,[wx,wy]=D.w;
 for(let u=1;u<=len+1;u++){const cv=0,ox=D.S[0]*cv,oy=D.S[1]*cv,cx=bx+dx*u+ox,cy=by+dy*u+oy;
  if(u===len+1){U(cx,cy,p.L2);continue}
  if(u===len){U(cx,cy,p.W);continue}
  if(u===1){U(cx,cy,p.y2);U(cx+D.L[0],cy+D.L[1],p.y1);if(big)U(cx+D.S[0],cy+D.S[1],p.y3);continue}
  U(cx+D.L[0],cy+D.L[1],(tw!==undefined&&tw===u)?'#ffd6e6':p.W);if(big){U(cx,cy,p.L2);U(cx+D.S[0],cy+D.S[1],p.L3)}else U(cx,cy,p.L3)}
 // tsuba (round guard)
 U(bx,by,p.ts);for(const sg of[1,-1]){U(bx+wx*sg,by+wy*sg,p.y2);if(big){U(bx+wx*2*sg,by+wy*2*sg,p.y3);U(bx+wx*sg+dx,by+wy*sg+dy,p.ts);U(bx+wx*sg-dx,by+wy*sg-dy,p.ts)}}
 // tsuka (wrapped grip) + kashira
 const g=big?5:3;for(let u=1;u<=g;u++){U(bx-dx*u,by-dy*u,u%2?p.ts:p.k1);if(big){U(bx-dx*u+D.L[0],by-dy*u+D.L[1],u%2?p.k1:p.ts)}}
 const kx=bx-dx*(g+1),ky=by-dy*(g+1);U(kx,ky,p.y2);
 // sakura tassel (sageo) hanging down
 U(kx,ky+1,p.k3);U(kx,ky+2,p.k2);if(big){U(kx,ky+3,p.k3);U(kx-1,ky+4,p.k2);U(kx,ky+4,p.k3);U(kx+1,ky+4,p.k2);U(kx,ky+5,p.y2);U(kx,ky+3,p.k3)}}
function drawKatanaIcon(){const W=16,H=30,c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');const G=Array.from({length:H},()=>Array(W).fill(null));
 paintKatana((x,y,col)=>{if(col&&x>=0&&y>=0&&x<W&&y<H)G[y][x]=col},7,19,'u',17,undefined,true);
 const O=G.map(r=>r.slice());for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(G[y][x])continue;for(const[dx,dy]of[[0,1],[-1,0],[1,0],[0,-1]]){const yy=y+dy,xx=x+dx;if(yy>=0&&xx>=0&&yy<H&&xx<W&&G[yy][xx]){O[y][x]=mixc(G[yy][xx],OUTC,.8);break}}}
 for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(O[y][x]){g.fillStyle=O[y][x];g.fillRect(x,y,1,1)}return c}

function drawSakuya(f={}){
 const W=SW,H=SH,OX=2,OY=6;const G=Array.from({length:H},()=>Array(W).fill(null));
 const p=PAL,bd=f.bdy||0,hy=bd+(f.headDy||0),sw=f.sway||0,pose=f.pose||'ready',face=f.face||'idle',legs=f.legs||'stand';
 const P=(x,y,c)=>{x=Math.round(x)+OX;y=Math.round(y)+OY;if(c&&x>=0&&y>=0&&x<W&&y<H)G[y][x]=c};
 const get=(x,y)=>{x+=OX;y+=OY;return(x>=0&&y>=0&&x<W&&y<H)?G[y][x]:null};
 const U=(x,y,c)=>P(x,y+bd,c),Hh=(x,y,c)=>P(x,y+hy,c);
 const hlU=(y,a,b,c)=>{for(let x=a;x<=b;x++)U(x,y,c)},hlH=(y,a,b,c)=>{for(let x=a;x<=b;x++)Hh(x,y,c)};
 const ptsH=(arr,c)=>arr.forEach(([x,y])=>Hh(x,y,c)),ptsU=(arr,c)=>arr.forEach(([x,y])=>U(x,y,c));
 const lineU=(x0,y0,x1,y1,c,c2,dx2=0,dy2=1)=>{const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0))||1;for(let i=0;i<=n;i++){const x=x0+(x1-x0)*i/n,y=y0+(y1-y0)*i/n;U(x,y,c);if(c2)U(x+dx2,y+dy2,c2)}};
 const katana=(bx,by,dk,len)=>(swordPainter('sakuya')||paintKatana)(U,bx,by,dk,len,f.tw);
 const sprite=(rows,map,x0,y0,setter)=>rows.forEach((row,r)=>[...row].forEach((ch,i)=>{if(map[ch])setter(x0+i,y0+r,map[ch])}));

 // ---- fox tail (behind everything): fluffy curve with white tip ----
 {const N=26;for(let i=N;i>=0;i--){const t=i/N,s=sw*(1+t*2);const cx=15-12*t-s*t,cy=26-13*Math.pow(t,1.3)+Math.sin(t*3.2)*1.5,r=2.2+2.6*Math.sin(Math.PI*Math.min(1,t*1.05));
  for(let y=Math.floor(cy-r);y<=Math.ceil(cy+r);y++)for(let x=Math.floor(cx-r);x<=Math.ceil(cx+r);x++){const d=(x-cx)**2+(y-cy)**2;if(d>r*r)continue;const v=(y-cy)/r;let c;
   if(t>.78)c=v<-.3?p.k1:v>.4?p.k3:p.k2;else c=v<-.4?p.o1:v>.35?p.o4:(v>0?p.o3:p.o2);if(t>.74&&t<=.78)c=v<0?p.k1:p.o3;U(x,y,c)}}
  ptsU([[3,12],[2,13],[4,13]].map(([x,y])=>[x-Math.round(sw*3),y]),p.k1)}
 // ---- back hair: straight hime-style, blunt cut ----
 for(let y=7;y<=18;y++){const a=7+(y<11?11-y:0);for(let x=a;x<=17;x++)Hh(x,y,x===a?p.h4:p.h3)}
 for(const[x0,tip,w0]of[[7,29,4],[11,29,4],[15,27,3]]){for(let y=18;y<=tip;y++){const s=Math.round(sw*(y-18)/8),a=x0-s;
   for(let x=a;x<a+w0;x++)Hh(x,y,x===a?p.h4:(x===a+1?(y%6===0?p.h1:p.h2):p.h3))}}
 if(pose==='back')katana(13,15,'ul',11);
 // far side lock (hime, blunt)
 for(let y=12;y<=20;y++){Hh(27,y,p.h3);if(y>=19)Hh(26,y,p.h4)}
 // ---- legs: white tabi + geta ----
 const LEG={stand:[[19,0],[16,0]],w0:[[14,0],[19,0]],w1:[[16,-1],[17,0]],w2:[[19,0],[14,0]],w3:[[17,0],[16,-1]]}[legs];
 const leg=(x,lift,far)=>{const so=far?p.o3:p.o1,sh=far?p.o4:p.o3;
  for(let y=29;y<=31+lift;y++){P(x,y,so);P(x+1,y,so);P(x+2,y,sh)}
  const by=31+lift;P(x+1,by,p.c2);P(x+2,by,far?p.c3:p.c2);
  for(let xx=x-1;xx<=x+3;xx++)P(xx,by+1,far?p.wd2:p.wd1);P(x,by+2,p.wd2);P(x+2,by+2,p.wd2)};
 leg(LEG[0][0],LEG[0][1],true);leg(LEG[1][0],LEG[1][1],false);
 // ---- hakama (red pleated skirt) ----
 const SK={24:[16,22],25:[15,23],26:[14,24],27:[14,24],28:[14,24],29:[15,23]};
 for(let y=24;y<=29;y++){const[a,b]=SK[y];for(let x=a;x<=b;x++){let c=p.c2;if(x<=a+1)c=p.c3;if(x>=b-1)c=p.c1;if(y>=25&&y<=28&&(x-a)%3===2&&x>a+1&&x<b-1)c=p.c3;if(y===29)c=x<=a+1?p.c4:p.c3;U(x,y,c)}}
 // ---- kimono top (white) with red inner collar ----
 for(let y=21;y<=24;y++){hlU(y,16,22,p.o2);U(16,y,p.o3);U(17,y,p.o3);U(22,y,p.o1)}
 ptsU([[19,21],[20,21],[20,22]],p.c2);U(19,22,p.o3);U(18,21,p.o1);U(21,21,p.o1);U(21,22,p.o3);
 hlU(24,16,22,p.c3);ptsU([[20,24],[21,24],[22,24]],p.o1);U(21,25,p.o1);U(22,25,p.o2);
 // big miko sleeves (near hangs, red cord at hem)
 for(let y=21;y<=27;y++){const a=y<23?14:12,b=16;for(let x=a;x<=b;x++)U(x,y,x===a?p.o3:(y>=26?p.o3:p.o1))}hlU(27,12,16,p.c2);U(12,26,p.c2);
 ptsU([[21,21],[22,21],[23,21],[22,22],[23,22],[23,23],[24,23]],p.o2);ptsU([[23,23],[24,23]],p.c2);
 // neck
 for(let x=19;x<=21;x++)Hh(x,21,p.s3);
 // ---- face ----
 const FR={9:[17,24],10:[16,25],11:[15,26],12:[15,26],13:[15,26],14:[15,26],15:[15,26],16:[15,26],17:[15,26],18:[15,26],19:[16,25],20:[18,23]};
 for(let y=9;y<=20;y++){const[a,b]=FR[y];for(let x=a;x<=b;x++)Hh(x,y,(x<=16||(y===20&&(x===18||x===23)))?p.s3:p.s2)}
 Hh(26,15,p.s1);Hh(26,16,p.s1);
 // ---- expressions (same system as Seraphine; crimson fox eyes) ----
 const L=p.LASH;const He=(x,y,c)=>Hh(x,y+1,c),hlE=(y,a,b,c)=>hlH(y+1,a,b,c),ptsE=(a,c)=>a.forEach(([x,y])=>Hh(x,y+1,c));
 const lash=()=>{hlE(13,17,20,L);He(17,14,L);hlE(13,23,25,L);He(25,14,L)};
 const blush=()=>{He(15,18,p.bl);He(16,18,p.pk);He(17,18,p.bl);He(25,18,p.pk);He(26,18,p.bl)};
 if(face==='idle'){lash();ptsE([[18,14],[23,14],[20,17]],p.W);ptsE([[19,14],[20,14],[20,15],[24,14],[24,15]],p.e1);ptsE([[18,15],[19,15],[19,16],[20,16],[23,15],[24,16]],p.e2);ptsE([[18,16],[18,17],[19,17],[23,16],[23,17],[24,17]],p.e3);blush();He(21,18,p.mo)}
 if(face==='blink'){ptsE([[17,13],[18,14],[19,14],[20,13]],L);ptsE([[23,13],[24,14],[25,13]],L);blush();He(21,18,p.mo)}
 if(face==='happy'){ptsE([[17,15],[18,14],[19,14],[20,15]],L);ptsE([[23,15],[24,14],[25,15]],L);blush();ptsE([[20,18],[21,18],[22,18]],p.mo);He(21,19,p.tg)}
 const fierce=()=>{hlE(13,17,20,L);hlE(14,17,20,L);hlE(13,23,25,L);hlE(14,23,24,L);ptsE([[18,15],[20,15],[24,15]],p.e1);ptsE([[19,15],[23,15]],p.W);ptsE([[18,16],[19,16],[20,16],[23,16],[24,16]],p.e2);ptsE([[18,17],[19,17],[20,17],[23,17],[24,17]],p.e3)};
 if(face==='ready'){fierce();He(16,18,p.pk);He(21,18,p.mo);He(21,19,p.mo)}
 if(face==='yell'){fierce();He(16,18,p.pk);ptsE([[19,18],[20,18],[21,18],[22,18]],p.W);ptsE([[19,19],[22,19]],p.mo);ptsE([[20,19],[21,19]],p.tg)}
 if(face==='hurt'){ptsE([[17,13],[18,14],[19,15],[18,16],[17,17]],L);ptsE([[25,13],[24,14],[23,15],[24,16],[25,17]],L);ptsE([[16,18],[16,19],[15,20]],p.tear);He(25,18,p.tear);He(25,19,p.tear);ptsE([[19,19],[20,18],[21,19],[22,18],[23,19]],p.mo)}
 if(face==='daze'){lash();ptsE([[18,14],[19,14],[20,14],[23,14],[24,14]],p.e1);ptsE([[18,15],[19,15],[23,15]],p.W);ptsE([[20,15],[24,15]],p.e2);ptsE([[18,16],[19,16],[20,16],[23,16],[24,16]],p.tear);ptsE([[18,17],[19,17],[20,17],[23,17],[24,17]],p.e3);blush();ptsE([[20,19],[21,18],[22,19]],p.mo)}
 if(face==='skill'){lash();ptsE([[18,14],[19,14],[20,14],[23,14],[24,14]],p.e1);ptsE([[18,15],[19,15],[23,15]],p.W);ptsE([[20,15],[18,16],[24,15],[24,16],[19,17],[20,17],[24,17]],p.e2);ptsE([[19,16],[18,17],[23,16]],p.k2);ptsE([[20,16],[23,17]],p.e3);blush();ptsE([[19,18],[20,18],[21,18],[22,18]],p.mo);ptsE([[20,19],[21,19]],p.tg)}
 if(face==='calm'){ptsE([[17,16],[18,17],[19,17],[20,16]],L);ptsE([[23,16],[24,17],[25,16]],L);blush();ptsE([[20,18],[21,19],[22,18]],p.mo)}
 if(face==='glare'){fierce();ptsE([[19,15],[23,15]],p.e3);ptsE([[18,15],[24,15]],p.W);He(16,18,p.pk);He(21,18,p.mo)}
 // ---- fox ears (behind cap edge, drawn before cap so cap overlaps base) ----
 const tw=f.ahoge||0;
 sprite(["..3..","..33.",".3k2.","32k22","3kkk2"],{'3':p.o4,'2':p.o3,'k':p.k4},9,0,Hh);
 sprite(["..1..",".112.",".1k2.","11k23","1kok3"],{'1':p.o1,'2':p.o2,'3':p.o3,'k':p.k3,'o':p.k1},20+tw,0,Hh);
 // ---- hair cap ----
 const CM={'1':p.h1,'2':p.h2,'3':p.h3,'4':p.h4};
 CAPA.forEach((row,y)=>[...row].forEach((ch,i)=>{if(CM[ch])Hh(6+i,y,CM[ch])}));
 for(let y=4;y<=9;y++){let mx=-1;[...CAPA[y]].forEach((ch,i)=>{if(ch!=='.')mx=i});if(mx>=0)Hh(6+mx,y,p.h2)}
 hlH(6,13,16,p.hs);Hh(12,7,p.hs);hlH(6,21,22,p.hs);
 // ---- hime-cut bangs: blunt straight line ----
 for(let x=16;x<=27;x++){const e=12;for(let y=9;y<=e;y++)Hh(x,y,y===e?p.h3:p.h2);if([19,23].includes(x))Hh(x,11,p.h3);const c=get(x,e+1+hy);if(c===p.s2||c===p.s1)Hh(x,e+1,p.s3)}
 [[17,10],[18,10],[21,10],[22,10],[25,10]].forEach(([x,y])=>Hh(x,y,p.h1));
 // ---- near hime side lock: straight, blunt cut at chin ----
 for(let y=10;y<=21;y++){const s=y>17?Math.round(sw/2):0;Hh(12-s,y,p.h4);Hh(13-s,y,p.h3);Hh(14-s,y,y>=11&&y<=14?p.h1:p.h2);Hh(15-s,y,p.h3)}
 hlH(21,12,15,p.h4);
 // ---- signature: sakura kanzashi with dangling bells ----
 {const FL=["..k.k..",".kKkKk.","kKKyKKk",".kyYyk.","kKKyKKk",".kKkKk.","..k.k.."],FC={k:p.k3,K:p.k2,y:p.y2,Y:p.y1};
  const cx=12,cy=8,cells=[];FL.forEach((row,r)=>[...row].forEach((ch,c)=>{if(FC[ch])cells.push([cx-3+c,cy-3+r,FC[ch]])}));
  const key=new Set(cells.map(([x,y])=>x+','+y));
  for(const[x,y]of cells)for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const k=(x+dx)+','+(y+dy);if(!key.has(k)){key.add(k);Hh(x+dx,y+dy,'#5a1a35')}}
  for(const[x,y,c]of cells)Hh(x,y,c);Hh(10,6,p.k1);
  const dg=-Math.round(sw/2);for(const bx of[11,13]){ptsH([[bx+dg,12],[bx+dg,13],[bx+dg,14]],p.y2);Hh(bx+dg,15,p.k3);Hh(bx+dg,16,p.k2)}Hh(12+dg,13,p.y3)}
 // ---- arms + katana ----
 if(pose==='iai'){for(let i=0;i<=12;i++){const x=20-i,y=27+Math.round(i*.25);U(x,y,i===0?p.y2:p.c4);U(x,y+1,i===0?p.y3:'#3a1020')}U(8,30,p.y2);
  U(21,26,p.ts);U(20,25,p.y2);U(22,27,p.y2);ptsU([[22,25],[23,24]],p.ts);U(22,24,p.k1);U(24,23,p.y2);U(24,24,p.k3);U(24,25,p.k2);
  lineU(16,23,20,24,p.o2,p.o3);U(20,24,p.c2);ptsU([[21,23],[22,23],[21,24],[22,24]],p.s2);U(21,24,p.s3)}
 if(pose==='ready'){katana(25,24,'ur',11);ptsU([[17,24],[18,24],[19,24],[20,24],[21,24]],p.o2);U(22,24,p.c2);ptsU([[23,24],[24,24],[23,25],[24,25]],p.s2);U(23,25,p.s3)}
 if(pose==='back'){lineU(16,22,15,19,p.o2,p.o3,1,0);U(15,19,p.c2);ptsU([[14,16],[15,16],[14,17],[15,17]],p.s2);U(15,17,p.s3)}
 if(pose==='slash'){lineU(16,22,22,22,p.o2,p.o3);U(22,22,p.c2);katana(25,22,'r',12);ptsU([[23,22],[24,22],[23,23],[24,23]],p.s2);U(24,23,p.s3)}
 if(pose==='follow'){lineU(16,22,21,25,p.o2,p.o3);U(21,25,p.c2);katana(24,27,'dr',10);ptsU([[22,25],[23,25],[22,26],[23,26]],p.s2);U(23,26,p.s3)}
 if(pose==='hit'){lineU(16,22,19,24,p.o2,p.o3);katana(22,26,'dr',9);ptsU([[20,24],[21,24],[20,25],[21,25]],p.s2);U(21,25,p.s3)}
 if(pose==='raise'){lineU(16,21,12,9,p.o2,p.o3,1,0);U(12,9,p.c2);katana(11,6,'u',12);ptsU([[11,7],[12,7],[11,8],[12,8]],p.s2);U(12,8,p.s3)}
 // ---- anime marks / fox fire ----
 const marks=[];
 if(f.sweat){marks.push([29,6+hy,p.W],[28,7+hy,p.tear],[29,7+hy,p.W],[28,8+hy,p.tear],[29,8+hy,p.tear],[30,8+hy,p.tear],[29,9+hy,p.tear])}
 if(f.vein){for(const[x,y]of[[28,2],[29,2],[31,2],[32,2],[28,3],[32,3],[28,5],[32,5],[28,6],[29,6],[31,6],[32,6]])marks.push([x,y+hy,'#ff3b5c'])}
 if(f.spark){const o=f.spark;for(const[x,y]of(o===1?[[29,10],[27,2],[31,18]]:[[30,14],[25,1],[29,22]])){marks.push([x,y+hy,'#ffd6e6'],[x-1,y+1+hy,'#ff86ad'],[x+1,y+1+hy,'#ff86ad'],[x,y+1+hy,'#fff0f5'],[x,y+2+hy,'#ff86ad'])}}
 if(f.fire){const FL=[".2.","232","313","313",".3."],FCo={'1':'#fff6fa','2':'#ffc1d6','3':'#ff6f9f'},POS=[[-1,4],[31,7],[32,19]];
  for(let n=0;n<Math.min(3,f.fire);n++){const[px,py]=POS[n];const fl=(f.flick||0)%2;FL.forEach((row,r)=>[...row].forEach((ch,i)=>{if(FCo[ch])marks.push([px+i+(r===0?fl:0),py+r+hy,FCo[ch]])}))}}
 // ---- outline ----
 const O=G.map(r=>r.slice());
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(G[y][x])continue;let nb=null,dir=null;for(const[dx,dy]of[[0,1],[-1,0],[1,0],[0,-1]]){const yy=y+dy,xx=x+dx;if(yy>=0&&xx>=0&&yy<H&&xx<W&&G[yy][xx]){nb=G[yy][xx];dir=[dx,dy];break}}
  if(nb)O[y][x]=mixc(nb,OUTC,(dir[1]===1)?.72:.8)}
 for(const[x,y,c]of marks){const X=x+OX,Y=y+OY;if(X>=0&&Y>=0&&X<W&&Y<H&&!G[Y][X])O[Y][X]=c}
 const lx=f.lean||0;if(lx){for(const r of O){if(lx>0){r.unshift(...Array(lx).fill(null));r.length=W}else{r.splice(0,-lx);while(r.length<W)r.push(null)}}}
 const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');
 for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(O[y][x]){g.fillStyle=O[y][x];g.fillRect(x,y,1,1)}
 return c;
}
const drawSera7=drawSakuya,drawSera6=drawSakuya,drawSera3=drawSakuya,drawAuroraIcon=drawKatanaIcon;
const ANIMS={
 idle:[{d:450,f:{tw:4}},{d:450,f:{bdy:1,sway:1,ahoge:1,tw:7}},{d:450,f:{tw:10}},{d:110,f:{face:'blink'}},{d:450,f:{bdy:1,sway:1,ahoge:1}},{d:450,f:{}},{d:600,f:{face:'happy',ahoge:1}}],
 walk:[{d:140,f:{legs:'w0'}},{d:140,f:{legs:'w1',bdy:-1,sway:1,ahoge:1}},{d:140,f:{legs:'w2'}},{d:140,f:{legs:'w3',bdy:-1,sway:1,ahoge:1}}],
 attack:[{d:280,f:{pose:'back',face:'ready',lean:-1,sway:-1}},{d:100,f:{pose:'slash',face:'yell',lean:3,legs:'w0',fx:'slash'}},{d:240,f:{pose:'follow',face:'yell',lean:2,legs:'w0',sway:1,fx:'slash2'}},{d:420,f:{face:'happy',ahoge:1}}],
 hit:[{d:120,f:{pose:'hit',face:'hurt',lean:-3,flash:1,sway:-1,vein:1}},{d:320,f:{pose:'hit',face:'hurt',lean:-2,sway:-1,sweat:1}},{d:420,f:{pose:'hit',face:'daze',lean:-1,sweat:1}},{d:300,f:{face:'daze'}}],
 skill:[{d:280,f:{pose:'iai',face:'calm',bdy:1,fire:1}},{d:240,f:{pose:'iai',face:'calm',bdy:1,fire:2,flick:1}},{d:240,f:{pose:'iai',face:'calm',bdy:1,fire:3}},{d:160,f:{pose:'iai',face:'glare',bdy:1,fire:3,flick:1,fx:'eyeflash'}},{d:110,f:{pose:'slash',face:'yell',dx:9,ghost:1,fx:'dashcut'}},{d:120,f:{pose:'slash',face:'yell',dx:9,fx:'petalx'}},{d:160,f:{pose:'slash',face:'yell',dx:9,fx:'petalx2'}},{d:380,f:{pose:'iai',face:'calm',bdy:1,fx:'petals'}},{d:420,f:{face:'happy',ahoge:1,fx:'petals2'}}]
};

return{draw:drawSakuya,anims:ANIMS,icon:drawKatanaIcon,paintW:paintKatana,strike:.58}})();
