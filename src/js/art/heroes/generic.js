// ===== Generic hero generator — same chibi 3/4 style as Seraphine v7.9 =====
const GEN=(()=>{
const OUTC='#2a1430';
function hx(h){const n=parseInt(h.slice(1),16);return[n>>16,n>>8&255,n&255]}
function mixc(a,b,t){const A=hx(a),B=hx(b);return'#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('')}
const BASE={s1:'#fff1e6',s2:'#ffd8c2',s3:'#f0a891',W:'#ffffff',pk:'#ff9aaa',bl:'#ffbcc6',mo:'#c4506a',tg:'#ff7f93',y1:'#fff4b0',y2:'#ffc23d',y3:'#d77f1e',L1:'#ffffff',L2:'#e4ecfa',L3:'#a3b4d6',gr:'#4a2c4a',LASH:'#38183a',tear:'#86d4ff',wd1:'#c08a58',wd2:'#7a4a30',wd3:'#4e2c1e'};
const CAPA=["..........................","..........................","..........................","..........................",".......3322223322.........",".....33222211112222.......","....3322111111221112......","...332222222222222222.....","..43322222322222322223....","..43322223322223322222...."];
const DIRS={d:{d:[0,1],L:[1,0],S:[-1,0],w:[1,0]},u:{d:[0,-1],L:[-1,0],S:[1,0],w:[1,0]},r:{d:[1,0],L:[0,-1],S:[0,1],w:[0,1]},ur:{d:[1,-1],L:[-1,0],S:[1,0],w:[1,1]},ul:{d:[-1,-1],L:[1,0],S:[-1,0],w:[1,-1]},dr:{d:[1,1],L:[1,0],S:[-1,0],w:[1,-1]}};

// ---- weapon painters: (U,p,bx,by,dk,len) ; bx,by = grip/guard point ----
const WEAP={
 sword(U,p,bx,by,dk,len){const D=DIRS[dk],[dx,dy]=D.d,[wx,wy]=D.w;for(let u=1;u<=len+1;u++){const cx=bx+dx*u,cy=by+dy*u;if(u===len+1){U(cx,cy,p.W);continue}U(cx+D.L[0],cy+D.L[1],p.W);U(cx,cy,p.L2);U(cx+D.S[0],cy+D.S[1],p.L3)}
  for(const sg of[1,-1]){U(bx+wx*sg,by+wy*sg,p.y2);U(bx+wx*2*sg,by+wy*2*sg,p.y3)}U(bx,by,p.y1);U(bx-dx,by-dy,p.gr);U(bx-dx*2,by-dy*2,p.y2)},
 axe(U,p,bx,by,dk,len){const D=DIRS[dk],[dx,dy]=D.d;len=Math.max(6,len-2);for(let u=-2;u<=len;u++){U(bx+dx*u,by+dy*u,u<0?p.wd3:p.wd1);U(bx+dx*u+D.S[0],by+dy*u+D.S[1],u<0?p.wd3:p.wd2)}
  // double blade head near tip
  for(let k=0;k<4;k++)for(const sg of[1,-1]){const o=k===0?1:k===3?1:2;for(let j=1;j<=o+1;j++){const ax=bx+dx*(len-1-k)+D.L[0]*sg*j,ay=by+dy*(len-1-k)+D.L[1]*sg*j;U(ax,ay,j===o+1?p.W:(sg>0?p.L2:p.L3))}}
  U(bx+dx*(len+1),by+dy*(len+1),p.L3);if(p.wr>=2){U(bx+dx*(len-2),by+dy*(len-2),p.wg[1]);U(bx+dx*(len-3),by+dy*(len-3),p.wg[0])}if(p.wr>=3){U(bx+dx*(len+2),by+dy*(len+2),p.wg[2]);U(bx+dx*(len-2)+D.S[0],by+dy*(len-2)+D.S[1],p.wg[2])}},
 staff(U,p,bx,by,dk,len){const D=DIRS[dk],[dx,dy]=D.d;len+=1;for(let u=-3;u<=len;u++){U(bx+dx*u,by+dy*u,u%4===0?p.y2:p.wd1);U(bx+dx*u+D.S[0],by+dy*u+D.S[1],p.wd2)}
  const ox=bx+dx*(len+2),oy=by+dy*(len+2);for(let y=-1;y<=1;y++)for(let x=-1;x<=1;x++)U(ox+x,oy+y,(x===-1&&y===-1)?p.W:(x+y>0?p.a3:p.a2));U(ox-1,oy-1,p.W);
  for(const sg of[1,-1])U(bx+dx*(len+1)+D.w[0]*sg*2,by+dy*(len+1)+D.w[1]*sg*2,p.y2);U(bx+dx*(len+1),by+dy*(len+1),p.y2);
  if(p.wr>=3){for(const sg of[1,-1]){U(ox+D.w[0]*sg*2,oy+D.w[1]*sg*2,p.wt[1]);U(ox+D.w[0]*sg*3+dx,oy+D.w[1]*sg*3+dy,p.wt[2])}U(ox+dx*2,oy+dy*2,p.wg[2]);U(ox+dx*3,oy+dy*3,p.wt[1])}else if(p.wr===1){U(ox+1,oy+1,p.a3)}}
};
function build(cfg){
 const p=Object.assign({},BASE,cfg.pal);
 return function draw(f={}){
 const W=44,H=44,OX=2,OY=6;const G=Array.from({length:H},()=>Array(W).fill(null));
 const bd=f.bdy||0,hy=bd+(f.headDy||0),sw=f.sway||0,pose=f.pose||'ready',face=f.face||'idle',legs=f.legs||'stand',ab=f.ahoge||0;
 const P=(x,y,c)=>{x=Math.round(x)+OX;y=Math.round(y)+OY;if(c&&x>=0&&y>=0&&x<W&&y<H)G[y][x]=c};
 const get=(x,y)=>{x+=OX;y+=OY;return(x>=0&&y>=0&&x<W&&y<H)?G[y][x]:null};
 const U=(x,y,c)=>P(x,y+bd,c),Hh=(x,y,c)=>P(x,y+hy,c);
 const hlU=(y,a,b,c)=>{for(let x=a;x<=b;x++)U(x,y,c)},hlH=(y,a,b,c)=>{for(let x=a;x<=b;x++)Hh(x,y,c)};
 const ptsH=(arr,c)=>arr.forEach(([x,y])=>Hh(x,y,c)),ptsU=(arr,c)=>arr.forEach(([x,y])=>U(x,y,c));
 const lineU=(x0,y0,x1,y1,c,c2,dx2=0,dy2=1)=>{const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0))||1;for(let i=0;i<=n;i++){const x=x0+(x1-x0)*i/n,y=y0+(y1-y0)*i/n;U(x,y,c);if(c2)U(x+dx2,y+dy2,c2)}};
 const sprite=(rows,map,x0,y0,set)=>rows.forEach((row,r)=>[...row].forEach((ch,i)=>{if(map[ch])set(x0+i,y0+r,map[ch])}));
 const wk=cfg.weapon,q=wpnPal(p,wk),wpn=(bx,by,dk,len)=>WEAP[wk]&&WEAP[wk](U,q,bx,by,dk,len);
 const hs=cfg.hair;

 // ---- cape (optional) ----
 if(cfg.cape){for(let y=21;y<=30;y++){const s=y>25?Math.round(sw*(y-25)/4):0,a=14-Math.floor((y-21)*.7)-s,b=19;for(let x=a;x<=b;x++){let c=p.c2;if(x<=a+1)c=p.c3;if(y>23&&x===a+4)c=p.c1;U(x,y,c)}if(y===30)for(let x=a;x<=b;x++)if((x-a)%3===2)U(x,y,null)}}
 // ---- back hair ----
 const backMass=(y1)=>{for(let y=7;y<=y1;y++){const a=7+(y<11?11-y:0)+(y>y1-2?y-(y1-2):0);for(let x=a;x<=17;x++)Hh(x,y,x===a?p.h4:p.h3)}};
 if(hs==='long'){backMass(18);for(const[x0,tip,w0]of[[7,28,4],[11,27,4],[15,24,3]]){for(let y=18;y<=tip;y++){const s=Math.round(sw*(y-18)/8),w=y<tip-3?w0:Math.max(1,w0-(y-(tip-3))),a=x0-s+(w0-w>>1);for(let x=a;x<a+w;x++)Hh(x,y,x===a?p.h4:(x===a+1?(y%5===0?p.h1:p.h2):p.h3))}}}
 if(hs==='bob'){backMass(19);for(let x=8;x<=17;x++)Hh(x,20,p.h4)}
 if(hs==='twin'){backMass(17);
  const tail=(cx,y0,y1,w,far,k)=>{for(let y=y0;y<=y1;y++){const t=(y-y0)/(y1-y0),s=Math.round(sw*k*t),ww=Math.max(1,Math.round(w*(t<.2?.6+t*2:t>.8?(1-t)*5:1))),a=Math.round(cx-ww/2+Math.sin(t*3)*1.2)-s;for(let x=a;x<a+ww;x++)Hh(x,y,x===a?p.h4:(far?p.h3:(x===a+1?p.h2:(x===a+ww-1?p.h3:p.h2))));if(!far&&ww>2&&y%4===0)Hh(a+1,y,p.h1)}};
  tail(27.5,11,26,3,true,1.2);tail(7.5,10,31,5,false,1);
  ptsH([[6,9],[7,9],[8,9],[9,9],[7,10],[8,10]],p.a2);Hh(7,9,p.a1);Hh(9,10,p.a3)}
 if(hs==='pony'){backMass(16);
  for(let y=4;y<=30;y++){const t=(y-4)/26,s=Math.round(sw*t*1.5),cx=9-t*4+Math.sin(t*4)*1.5-s,w=Math.max(1,Math.round(5*(t<.15?.7:t>.8?(1-t)*5:1)));const a=Math.round(cx-w/2);for(let x=a;x<a+w;x++)Hh(x,y,x===a?p.h4:(x===a+1?(y%5===1?p.h1:p.h2):p.h3))}
  ptsH([[9,5],[10,5],[9,6],[10,6],[11,6]],p.a2);Hh(9,5,p.a1)}
 // ---- weapon behind (windup) ----
 if(pose==='back'&&wk!=='bow'&&wk!=='shield')wpn(13,15,'ul',10);
 // ---- legs ----
 const LEG={stand:[[19,0],[16,0]],w0:[[14,0],[19,0]],w1:[[16,-1],[17,0]],w2:[[19,0],[14,0]],w3:[[17,0],[16,-1]]}[legs];
 const leg=(x,lift,far)=>{const so=far?p.l2:p.l1,sh=far?p.l3:p.l2,bo=far?p.f3:p.f2;
  for(let y=29;y<=30+lift;y++){P(x,y,so);P(x+1,y,so);P(x+2,y,sh)}
  const by=30+lift;P(x,by,p.f1);P(x+1,by,p.f1);P(x+2,by,p.f2);
  for(let xx=x;xx<=x+2;xx++)P(xx,by+1,bo);P(x+3,by+1,bo);for(let xx=x;xx<=x+3;xx++)P(xx,by+2,p.f3);if(!far)P(x+1,by+1,p.f1)};
 leg(LEG[0][0],LEG[0][1],true);leg(LEG[1][0],LEG[1][1],false);
 // ---- skirt ----
 const SK={25:[16,22],26:[15,23],27:[14,24],28:[15,23]};
 for(let y=25;y<=28;y++){const[a,b]=SK[y];for(let x=a;x<=b;x++){let c=p.k2;if(x<=a+1)c=p.k3;if(x>=b-1)c=p.k1;if(y>=26&&y<=27&&(x-a)%3===2&&x>a+1&&x<b-1)c=p.k3;
  if(y===27&&cfg.hem)c=(x%2?p.y1:p.y2);if(y===28)c=(x<=a+1?p.k4:p.k3);U(x,y,c)}}
 // ---- torso ----
 for(let y=21;y<=24;y++){hlU(y,16,22,p.m2);U(16,y,p.m3);U(17,y,p.m3);U(22,y,p.m1)}
 if(cfg.collar){ptsU([[18,21],[21,21],[19,22],[20,22]],p[cfg.collar]);}
 U(19,21,p.s3);U(20,21,p.s3);
 if(cfg.gem){U(19,23,p.a1);U(20,23,p.a2)}
 hlU(24,16,22,p.belt||p.y2);U(19,24,p.y1);
 ptsU([[14,22],[15,21],[16,21],[14,23],[15,22],[16,22],[15,23],[16,23]],p.m1);ptsU([[14,23],[15,23],[16,23]],p.m3);ptsU([[14,24],[15,24]],p.cuff||p.y2);
 ptsU([[21,21],[22,21],[23,21],[22,22],[23,22]],p.m2);U(23,22,p.m3);
 if(cfg.armor){ptsU([[14,21],[15,20],[16,20],[17,20]],p.m1);ptsU([[21,20],[22,20],[23,20]],p.m2);ptsU([[18,22],[19,22],[20,22],[21,22]],p.m1);U(18,23,p.m3)}
 for(let x=19;x<=21;x++)Hh(x,21,p.s3);
 // far side lock
 if(hs!=='twin')for(let y=12;y<=(hs==='bob'?18:17);y++)Hh(27,y,p.h3);
 // ---- face ----
 const FR={9:[17,24],10:[16,25],11:[15,26],12:[15,26],13:[15,26],14:[15,26],15:[15,26],16:[15,26],17:[15,26],18:[15,26],19:[16,25],20:[18,23]};
 for(let y=9;y<=20;y++){const[a,b]=FR[y];for(let x=a;x<=b;x++)Hh(x,y,(x<=16||(y===20&&(x===18||x===23)))?p.s3:p.s2)}
 Hh(26,15,p.s1);Hh(26,16,p.s1);
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
 // ---- hair cap ----
 const CM={'1':p.h1,'2':p.h2,'3':p.h3,'4':p.h4};
 CAPA.forEach((row,y)=>[...row].forEach((ch,i)=>{if(CM[ch])Hh(6+i,y,CM[ch])}));
 for(let y=4;y<=9;y++){let mx=-1;[...CAPA[y]].forEach((ch,i)=>{if(ch!=='.')mx=i});if(mx>=0)Hh(6+mx,y,p.h1)}
 // ahoge (unless hat)
 if(!cfg.hat||cfg.hat==='headband'){Hh(17,3,p.h2);Hh(18,2-ab,p.h2);Hh(19,2-ab,p.h3);Hh(18,3,p.h3)}
 // bangs
 const BG=hs==='bob'?{16:13,17:12,18:12,19:12,20:11,21:12,22:12,23:12,24:11,25:12,26:12,27:13}:{16:13,17:12,18:11,19:12,20:11,21:10,22:11,23:12,24:11,25:10,26:11,27:12};
 for(let x=16;x<=27;x++){const e=BG[x];for(let y=9;y<=e;y++)Hh(x,y,y===e?p.h3:p.h2);if([18,21,25].includes(x))Hh(x,e,p.h4);const c=get(x,e+1+hy);if(c===p.s2||c===p.s1)Hh(x,e+1,p.s3)}
 [[17,10],[20,9],[23,10],[26,9]].forEach(([x,y])=>Hh(x,y,p.h1));
 if(['ready','yell'].includes(face)){ptsH([[16,11],[17,11],[18,12],[19,12],[20,13]],p.h4);ptsH([[23,13],[24,12],[25,12]],p.h4)}
 if(['hurt','daze'].includes(face)){ptsH([[16,13],[17,13],[18,12],[19,12]],p.h4);ptsH([[23,12],[24,13],[25,13]],p.h4)}
 // near side lock
 const sl=hs==='bob'?19:hs==='twin'?18:24;
 for(let y=10;y<=sl;y++){const s=y>18?Math.round(sw/2):0,tip=y>=sl-1;Hh(12-s,y,p.h4);Hh(13-s,y,p.h3);Hh(14-s,y,y>=11&&y<=13?p.h1:p.h2);Hh(15-s,y,tip?p.h4:p.h3)}
 if(hs==='bob')ptsH([[12,20],[13,20],[14,20]],p.h4);
 // ---- head accessory ----
 if(cfg.hat==='witch'){const hc=p.a2,hd=p.a3,hl=p.a1;for(let x=4;x<=29;x++)Hh(x,5,x<9?hd:x>25?hl:hc);ptsH([[3,6],[4,6],[29,6],[30,6]],hd);hlH(4,9,25,hd);
  const rows=[[3,10,24],[2,11,23],[1,12,22],[0,13,21],[-1,15,21],[-2,17,22],[-3,19,23],[-4,21,24]];for(const[y,a,b]of rows)for(let x=a;x<=b;x++)Hh(x,y-ab*(y<0?1:0),x===a?hd:(x===b?hl:hc));
  hlH(4,10,25,p.y2);Hh(17,4,p.y1);ptsH([[20,1],[19,2],[20,2],[21,2],[20,3]],p.y1);Hh(20,2,p.W)}
 if(cfg.hat==='feather'){const rows=[[1,13,22],[2,11,24],[3,10,25],[4,10,25]];for(const[y,a,b]of rows)for(let x=a;x<=b;x++)Hh(x,y,y===4?p.c3:(x<a+2?p.c3:(x>b-2?p.c1:p.c2)));hlH(4,10,25,p.wd2);
  for(let i=0;i<8;i++){Hh(10-i,1-Math.round(i*.6)+ab*(i>4?1:0),i<6?p.f4:p.f5);Hh(10-i,2-Math.round(i*.6),p.f5)}Hh(12,3,p.y2)}
 if(cfg.hat==='helmet'){const rows=[[2,12,23],[3,10,25],[4,9,26],[5,9,26],[6,8,27]];for(const[y,a,b]of rows)for(let x=a;x<=b;x++)Hh(x,y,x<a+2?p.m3:(x>b-3?p.m1:p.m2));hlH(6,8,27,p.m4);hlH(3,14,18,p.W);
  for(let i=0;i<6;i++){Hh(15-i,1-Math.round(i*.4)+(i>3?ab:0),p.c1);Hh(15-i,2-Math.round(i*.4),p.c2)}ptsH([[18,4],[19,4]],p.c2)}
 if(cfg.hat==='headband'){for(let x=8;x<=27;x++)Hh(x,7,x>24?p.c1:p.c2);hlH(8,8,12,p.c3);for(let i=0;i<6;i++){const s=Math.round(sw*i/3);Hh(7-i-s,7+Math.round(i*.5),p.c2);Hh(7-i-s,8+Math.round(i*.5),p.c3)}Hh(21,7,p.y2)}
 // ---- arms + weapon by class ----
 const hand=(x,y)=>{ptsU([[x,y],[x+1,y],[x,y+1],[x+1,y+1]],p.s2);U(x,y+1,p.s3)};
 const arm=(x0,y0,x1,y1)=>lineU(x0,y0,x1,y1,p.m2,p.m3);
 if(wk==='bow'){const bow=(cx,y0,y1,drawX)=>{const n=y1-y0;for(let i=0;i<=n;i++){const t=i/n,x=cx+Math.round(Math.sin(t*Math.PI)*3),y=y0+i;U(x,y,i===0||i===n?q.y2:q.wd1);U(x+1,y,q.wd2)}const mid=Math.round((y0+y1)/2);if(q.wr>=2){const mx=cx+3;U(mx+1,mid,q.wg[1]);U(mx+1,mid-1,q.wt[1]);U(mx+1,mid+1,q.wt[1])}if(q.wr>=3){for(const yy of[y0+1,y1-1]){U(cx+1,yy,q.wg[1]);U(cx+2,yy,q.wt[2])}U(cx+4,mid,q.wg[2])}if(drawX!==undefined){lineU(cx,y0,drawX,mid,p.W);lineU(drawX,mid,cx,y1,p.W)}else for(let y=y0+1;y<y1;y++)U(cx,y,'#efe8ff')};
  if(pose==='ready'||pose==='raise'){bow(24,14,30);arm(16,23,22,23);hand(23,22)}
  if(pose==='back'){bow(27,14,30,20);arm(16,22,25,22);hand(26,21);lineU(20,22,33,22,p.wd2);ptsU([[33,21],[34,22],[33,23]],p.L2);ptsU([[19,21],[19,23]],p.f4)}
  if(pose==='slash'||pose==='follow'){bow(27,14,30);arm(16,22,25,22);hand(26,21)}
  if(pose==='hit'){bow(22,20,34);arm(16,23,20,25);hand(20,25)}}
 else if(wk==='shield'){const sh=(x0,y0)=>{const R=[[1,6],[0,7],[0,7],[0,7],[0,7],[0,7],[1,6],[2,5],[3,4]];R.forEach(([a,b],r)=>{for(let x=a;x<=b;x++)U(x0+x,y0+r,x===a||x===b||r===0||r===8?q.m4:(x<a+2?q.m2:q.m1))});
   if(q.wr===1){for(let r=1;r<=7;r++){U(x0+3,y0+r,q.wm[0]);U(x0+5,y0+r,q.wm[0])}for(const x of[2,6])U(x0+x,y0+2,q.wt[1]),U(x0+x,y0+6,q.wt[1])}
   else if(q.wr===3){for(const[x,y]of[[4,1],[2,2],[6,2],[1,4],[7,4],[2,6],[6,6],[4,7]])U(x0+x,y0+y,q.wt[1]);for(let y=3;y<=5;y++)for(let x=3;x<=5;x++)U(x0+x,y0+y,(x===3&&y===3)?q.wg[2]:(x+y>8?q.wg[0]:q.wg[1]));U(x0+4,y0+2,q.wt[2]);U(x0+4,y0+6,q.wt[1])}
   else{for(let r=1;r<=7;r++)U(x0+4,y0+r,q.c2);for(let x=1;x<=6;x++)U(x0+x,y0+3,q.c2);U(x0+4,y0+3,q.y2)}};
  if(pose==='ready'||pose==='raise'||pose==='hit'){arm(16,23,20,24);sh(21,20)}
  if(pose==='back'){arm(16,23,18,24);sh(18,20)}
  if(pose==='slash'||pose==='follow'){arm(16,22,24,22);sh(25,18)}}
 else{
  if(pose==='ready'){wpn(25,24,'ur',9);arm(17,24,22,24);hand(23,24)}
  if(pose==='back'){lineU(16,22,15,19,p.m2,p.m3,1,0);hand(14,16)}
  if(pose==='slash'){arm(16,22,22,22);wpn(25,22,'r',10);hand(23,22)}
  if(pose==='follow'){arm(16,22,20,25);wpn(24,27,'dr',8);hand(22,25)}
  if(pose==='hit'){arm(16,22,19,24);wpn(22,26,'dr',7);hand(20,24)}
  if(pose==='raise'){lineU(16,21,12,9,p.m2,p.m3,1,0);wpn(11,6,'u',10);hand(11,7)}}
 // ---- marks ----
 const marks=[];
 if(f.sweat)marks.push([29,6+hy,p.W],[28,7+hy,p.tear],[29,7+hy,p.W],[28,8+hy,p.tear],[29,8+hy,p.tear],[30,8+hy,p.tear],[29,9+hy,p.tear]);
 if(f.vein)for(const[x,y]of[[28,2],[29,2],[31,2],[32,2],[28,3],[32,3],[28,5],[32,5],[28,6],[29,6],[31,6],[32,6]])marks.push([x,y+hy,'#ff3b5c']);
 if(f.spark){const o=f.spark,sc=p.fx||p.y1;for(const[x,y]of(o===1?[[29,10],[27,0],[31,18]]:[[30,14],[25,-1],[29,22]]))marks.push([x,y+hy,sc],[x-1,y+hy,p.W],[x+1,y+hy,p.W],[x,y-1+hy,p.W],[x,y+1+hy,p.W])}
 // ---- outline ----
 const O=G.map(r=>r.slice());
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(G[y][x])continue;let nb=null,dir=null;for(const[dx,dy]of[[0,1],[-1,0],[1,0],[0,-1]]){const yy=y+dy,xx=x+dx;if(yy>=0&&xx>=0&&yy<H&&xx<W&&G[yy][xx]){nb=G[yy][xx];dir=[dx,dy];break}}if(nb)O[y][x]=mixc(nb,OUTC,(dir[1]===1)?.72:.8)}
 for(const[x,y,c]of marks){const X=x+OX,Y=y+OY;if(X>=0&&Y>=0&&X<W&&Y<H&&!G[Y][X])O[Y][X]=c}
 const lx=f.lean||0;if(lx){for(const r of O){if(lx>0){r.unshift(...Array(lx).fill(null));r.length=W}else{r.splice(0,-lx);while(r.length<W)r.push(null)}}}
 const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');
 for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(O[y][x]){g.fillStyle=O[y][x];g.fillRect(x,y,1,1)}
 return c}}
// ---- 4 generic heroines ----
return{build};
})();
const GEN_ANIMS={
 idle:[{d:450,f:{}},{d:450,f:{bdy:1,sway:1,ahoge:1}},{d:450,f:{}},{d:110,f:{face:'blink'}},{d:450,f:{bdy:1,sway:1,ahoge:1}},{d:450,f:{}},{d:600,f:{face:'happy',ahoge:1}}],
 walk:[{d:140,f:{legs:'w0'}},{d:140,f:{legs:'w1',bdy:-1,sway:1,ahoge:1}},{d:140,f:{legs:'w2'}},{d:140,f:{legs:'w3',bdy:-1,sway:1,ahoge:1}}],
 attack:[{d:280,f:{pose:'back',face:'ready',lean:-1,sway:-1}},{d:100,f:{pose:'slash',face:'yell',lean:3,legs:'w0',fx:'slash'}},{d:240,f:{pose:'follow',face:'yell',lean:2,legs:'w0',sway:1,fx:'slash2'}},{d:420,f:{face:'happy',ahoge:1}}],
 hit:[{d:120,f:{pose:'hit',face:'hurt',lean:-3,flash:1,sway:-1,vein:1}},{d:320,f:{pose:'hit',face:'hurt',lean:-2,sway:-1,sweat:1}},{d:420,f:{pose:'hit',face:'daze',lean:-1,sweat:1}},{d:300,f:{face:'daze'}}],
 skill:[{d:220,f:{pose:'raise',face:'calm',fx:'glow'}},{d:200,f:{pose:'raise',face:'skill',fx:'glow2',bdy:-1,spark:1}},{d:200,f:{pose:'raise',face:'skill',fx:'glow',spark:2}},{d:200,f:{pose:'raise',face:'skill',fx:'glow2',bdy:-1,spark:1}},{d:420,f:{face:'happy',ahoge:1}}]
};

