/* =====================================================================
   IKON UI — digambar prosedural di grid 16×16 (garis tepi & bayangan otomatis)
   lalu diperbesar ×4 (64px) supaya tetap tajam di ukuran tampil berapa pun.
   Tambah ikon: tulis fungsi gambar di ICON_DRAW lalu ICON.<nama> otomatis ada.
   ===================================================================== */
const ICON_OUT='#3b2416';
function pxIcon(draw,S=16,scale=4){
 const G=Array.from({length:S},()=>Array(S).fill(null));
 const P=(x,y,c)=>{x=Math.floor(x);y=Math.floor(y);if(c&&x>=0&&y>=0&&x<S&&y<S)G[y][x]=c};
 const inC=(x,y,cx,cy,r)=>(x+.5-cx)**2+(y+.5-cy)**2<=r*r;
 const K={P,S,
  rect:(x,y,w,h,c)=>{for(let j=0;j<h;j++)for(let i=0;i<w;i++)P(x+i,y+j,c)},
  circ:(cx,cy,r,c)=>{for(let y=0;y<S;y++)for(let x=0;x<S;x++)if(inC(x,y,cx,cy,r))P(x,y,c)},
  // bola berbayang: [terang, tengah, gelap]
  ball:(cx,cy,r,[hi,mid,lo])=>{for(let y=0;y<S;y++)for(let x=0;x<S;x++)if(inC(x,y,cx,cy,r)){const d=((x+.5-cx)+(y+.5-cy))/r;P(x,y,d<-.55?hi:d>.5?lo:mid)}},
  ring:(cx,cy,r1,r2,c)=>{for(let y=0;y<S;y++)for(let x=0;x<S;x++)if(inC(x,y,cx,cy,r2)&&!inC(x,y,cx,cy,r1))P(x,y,c)},
  poly:(pts,c)=>{for(let y=0;y<S;y++)for(let x=0;x<S;x++){const px=x+.5,py=y+.5;let ins=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const[xi,yi]=pts[i],[xj,yj]=pts[j];if(((yi>py)!==(yj>py))&&(px<(xj-xi)*(py-yi)/(yj-yi)+xi))ins=!ins}if(ins)P(x,y,c)}},
  line:(x0,y0,x1,y1,c)=>{const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0))||1;for(let i=0;i<=n;i++)P(Math.round(x0+(x1-x0)*i/n),Math.round(y0+(y1-y0)*i/n),c)},
  pts:(arr,c)=>arr.forEach(([x,y])=>P(x,y,c))};
 draw(K);
 // garis tepi (4 arah) + bayangan jatuh di bawah
 const O=G.map(r=>r.slice());
 for(let y=0;y<S;y++)for(let x=0;x<S;x++)if(!G[y][x]&&[[0,1],[1,0],[0,-1],[-1,0]].some(([dx,dy])=>G[y+dy]&&G[y+dy][x+dx]))O[y][x]=ICON_OUT;
 const c=document.createElement('canvas');c.width=S*scale;c.height=S*scale;const g=c.getContext('2d');
 g.fillStyle='rgba(59,36,22,.35)';for(let y=0;y<S;y++)for(let x=0;x<S;x++)if(O[y][x]&&!(O[y+1]&&O[y+1][x]))g.fillRect(x*scale,(y+1)*scale,scale,scale*.5);
 for(let y=0;y<S;y++)for(let x=0;x<S;x++)if(O[y][x]){g.fillStyle=O[y][x];g.fillRect(x*scale,y*scale,scale,scale)}
 return c.toDataURL()}
// ikon kecil gaya lama (ascii) -> diperbesar
const C={K:'#3b2416',R:'#e8483b',Y:'#ffd23f',W:'#fff6dc',N:'#9b5a2c',S:'#c9ced8',B:'#3fa9f5',G:'#4cc35a',L:'#2a7d3a',P:'#9b5de5'};
function ascii(rows,map=C,scale=8){const h=rows.length,w=rows[0].length;const c=document.createElement('canvas');c.width=w*scale;c.height=h*scale;const g=c.getContext('2d');rows.forEach((r,y)=>[...r].forEach((ch,x)=>{if(map[ch]){g.fillStyle=map[ch];g.fillRect(x*scale,y*scale,scale,scale)}}));return c.toDataURL()}

const GOLD=['#fff6b0','#ffcf3a','#d98a12'],SILV=['#ffffff','#d6dde8','#8a96aa'],RED=['#ff9a8a','#e8483b','#a8282a'];
const ICON_DRAW={
 home:K=>{K.rect(11,2,2,5,'#b05a3a');K.P(11,2,'#d8805a');
  K.poly([[0.5,8.5],[8,1.5],[15.5,8.5]],'#d8403a');K.poly([[2.5,8],[8,3],[8,8]],'#f06a5a');K.line(1,8,14,8,'#a8282a');
  K.rect(2,9,12,6,'#fff3d6');K.rect(2,14,12,1,'#e2c08a');K.rect(2,9,12,1,'#e8d0a0');
  K.rect(4,10,3,3,'#6ec6ff');K.P(4,10,'#ffffff');K.rect(5,10,1,3,'#3b2416');K.rect(4,11,3,1,'#3b2416');
  K.rect(9,10,3,5,'#9a5a2a');K.rect(9,10,1,5,'#c07a40');K.P(11,12,'#ffd23f')},
 adv:K=>{K.ball(8,8,7,GOLD);K.ring(8,8,5.6,7,'#f0a51c');K.circ(8,8,5.2,'#fffaf0');K.circ(8,8,4.2,'#fff3d6');
  for(const[x,y]of[[8,3],[13,8],[8,13],[3,8]])K.rect(x-(x===8?0:0),y,1,1,'#b88a5a');
  K.poly([[8,2.6],[10.2,8],[5.8,8]],'#e8483b');K.poly([[8,2.6],[8,8],[5.8,8]],'#ff7a6a');
  K.poly([[5.8,8],[10.2,8],[8,13.4]],'#5a7ab8');K.poly([[8,8],[10.2,8],[8,13.4]],'#3a5a90');K.rect(7,7,2,2,'#ffd23f');K.P(7,7,'#fff6b0')},
 team:K=>{const head=(cx,cy,hair,skin='#ffe0c8')=>{K.circ(cx,cy,3.3,hair[1]);K.rect(cx-2,cy-1,4,3,skin);K.rect(cx-3,cy-2,6,1,hair[1]);K.P(cx-3,cy-3,hair[0]);K.P(cx-1,cy+0,'#3b2416');K.P(cx+1,cy+0,'#3b2416');K.P(cx-2,cy+1,'#ffb0b8')};
  K.rect(1,11,6,4,'#7a5ad9');K.rect(9,11,6,4,'#3f9aea');head(4,8,['#ffd0e0','#ff8fb8']);head(12,8,['#d8f6ff','#5ecbf0']);
  K.rect(4,11,8,4,'#e8483b');K.rect(4,11,8,1,'#ff7a6a');K.rect(7,12,2,3,'#ffd23f');head(8,7,['#fff6b0','#ffcf3a'])},
 hero:K=>{K.line(2,13,4,11,'#7a4a26');K.line(3,13,4,12,'#9a5a2a');K.rect(1,14,2,1,'#e8483b');K.P(1,13,'#e8483b');
  K.line(3,10,6,13,'#d98a12');K.line(2,10,6,14,'#ffcf3a');K.P(4,12,'#ffd23f');
  for(let i=0;i<9;i++){K.P(5+i,10-i,'#d6dde8');K.P(5+i,9-i,'#ffffff');K.P(6+i,10-i,'#8a96aa')}K.P(14,1,'#ffffff');K.P(13,1,'#ffffff')},
 summon:K=>{const star=(cx,cy,R,r)=>{const p=[];for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r:R;p.push([cx+Math.cos(a)*rr,cy+Math.sin(a)*rr])}return p};
  K.poly(star(8,8.6,7.6,3.4),'#f0a51c');K.poly(star(8,8.2,6.6,2.9),'#ffd23f');K.poly([[8,2],[8,8],[4,7]],'#fff6b0');K.rect(6,8,1,2,'#3b2416');K.rect(9,8,1,2,'#3b2416');K.P(5,10,'#ff9ab0');K.P(10,10,'#ff9ab0');
  K.pts([[1,1],[14,3],[2,14]],'#ffffff')},
 mission:K=>{K.rect(2,2,12,13,'#9a5a2a');K.rect(2,2,1,13,'#c07a40');K.rect(3,4,10,10,'#fffaf0');K.rect(3,13,10,1,'#e8d0a0');
  K.rect(5,1,6,3,'#b4bccc');K.rect(6,1,4,1,'#ffffff');K.rect(7,2,2,1,'#5a6478');
  for(const y of[6,9,12]){K.pts([[4,y],[5,y+1],[6,y],[7,y-1]].slice(0,4),'#3cb94a');K.rect(8,y,4,1,'#c9b08a')}},
 gift:K=>{K.rect(2,7,12,8,'#e8483b');K.rect(2,7,1,8,'#ff7a6a');K.rect(13,7,1,8,'#a8282a');K.rect(1,5,14,3,'#d8403a');K.rect(1,5,14,1,'#ff8a7a');
  K.rect(7,5,2,10,'#ffcf3a');K.rect(7,5,1,10,'#fff6b0');K.rect(1,6,14,1,'#a8282a');K.rect(7,6,2,1,'#d98a12');
  K.circ(5.5,3.2,2.2,'#ffcf3a');K.circ(10.5,3.2,2.2,'#ffcf3a');K.P(5,3,'#d98a12');K.P(10,3,'#d98a12');K.rect(7,3,2,2,'#f0a51c');K.P(4,2,'#fff6b0')},
 mail:K=>{K.rect(1,4,14,10,'#fffaf0');K.rect(1,13,14,1,'#e2c08a');K.poly([[1,4],[15,4],[8,10]],'#f2e2bc');K.line(1,4,8,10,'#c9a070');K.line(14,4,8,10,'#c9a070');K.circ(8,9.5,2,'#e8483b');K.P(7,9,'#ff9a8a')},
 event:K=>{K.rect(1,3,14,12,'#fffaf0');K.rect(1,14,14,1,'#e2c08a');K.rect(1,3,14,4,'#e8483b');K.rect(1,3,14,1,'#ff8a7a');
  K.rect(4,1,1,4,'#8a96aa');K.rect(11,1,1,4,'#8a96aa');K.P(4,1,'#ffffff');K.P(11,1,'#ffffff');
  const p=[];for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?1.7:3.6;p.push([8+Math.cos(a)*rr,10.6+Math.sin(a)*rr])}K.poly(p,'#ffcf3a');K.P(7,9,'#fff6b0')},
 gear:K=>{for(let i=0;i<8;i++){const a=i*Math.PI/4;K.circ(8+Math.cos(a)*5.6,8+Math.sin(a)*5.6,1.7,'#8a96aa')}K.ball(8,8,5.4,SILV);K.circ(8,8,2.2,'#5a6478');K.circ(8,8,1.3,'#3b2416')},
 arena:K=>{const sw=(flip)=>{const X=x=>flip?15-x:x;for(let i=0;i<10;i++){K.P(X(3+i),12-i,'#d6dde8');K.P(X(3+i),11-i,'#ffffff')}K.line(X(1),10,X(5),14,'#ffcf3a');K.line(X(1),14,X(3),12,'#9a5a2a');K.P(X(1),15,'#e8483b')};sw(false);sw(true)},
 lock:K=>{K.ring(8,6,2.6,4.4,'#b4bccc');K.rect(3,7,10,8,'#ffcf3a');K.rect(3,7,10,1,'#fff6b0');K.rect(3,14,10,1,'#d98a12');K.rect(7,9,2,4,'#3b2416');K.P(7,9,'#5a3a22')},
 gem:K=>{K.poly([[3,5],[6,2],[10,2],[13,5],[8,14]],'#3fa0ec');K.poly([[3,5],[6,2],[8,5]],'#bfeaff');K.poly([[8,5],[10,2],[13,5]],'#7fd0ff');K.poly([[3,5],[8,5],[8,14]],'#6ec6ff');K.poly([[8,5],[13,5],[8,14]],'#2a7ac8');K.P(5,4,'#ffffff');K.P(6,3,'#ffffff')},
 gold:K=>{K.ball(8,8,6.8,GOLD);K.ring(8,8,4.3,5.3,'#e89a1a');const p=[];for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?1.4:3.1;p.push([8+Math.cos(a)*rr,8.3+Math.sin(a)*rr])}K.poly(p,'#f0a51c');K.pts([[4,4],[5,3],[4,5]],'#ffffff')},
 stam:K=>{K.poly([[9,1],[3,9],[7.5,9],[6,15],[13,6],[8.5,6],[11,1]],'#7ee35e');K.poly([[9,1],[3,9],[6,9],[10,2]],'#c8ff9a');K.poly([[13,6],[6,15],[8,9.5]],'#2fae46')},
 tixH:K=>{K.poly([[1,4],[15,4],[15,7],[14,8],[15,9],[15,12],[1,12],[1,9],[2,8],[1,7]],'#ff9ac0');K.rect(1,4,14,1,'#ffd0e0');K.rect(1,11,14,1,'#d86a98');for(let y=5;y<11;y+=2)K.P(5,y,'#fffaf0');
  const p=[];for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?1.4:3;p.push([10.5+Math.cos(a)*rr,8.2+Math.sin(a)*rr])}K.poly(p,'#ffd23f')},
 tixW:K=>{K.poly([[1,4],[15,4],[15,7],[14,8],[15,9],[15,12],[1,12],[1,9],[2,8],[1,7]],'#6ec6ff');K.rect(1,4,14,1,'#c8eeff');K.rect(1,11,14,1,'#2f8ee8');for(let y=5;y<11;y+=2)K.P(5,y,'#fffaf0');
  K.line(8,10,12,6,'#ffffff');K.line(9,10,13,6,'#d6dde8');K.line(8,8,10,10,'#ffcf3a')},
 badge:K=>{K.poly([[3,2],[13,2],[13,8],[8,14.5],[3,8]],'#8a4ad8');K.poly([[3,2],[13,2],[13,3],[3,3]],'#c8a2ff');K.poly([[4,3],[12,3],[12,7.6],[8,12.8],[4,7.6]],'#a86af0');
  const p=[];for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?1.5:3.3;p.push([8+Math.cos(a)*rr,7.3+Math.sin(a)*rr])}K.poly(p,'#ffd23f');K.P(7,6,'#fff6b0')},
 hourglass:K=>{K.rect(3,1,10,2,'#9a5a2a');K.rect(3,13,10,2,'#9a5a2a');K.poly([[4,3],[12,3],[8.6,8],[12,13],[4,13],[7.4,8]],'#d6f0ff');K.poly([[5,4],[11,4],[8,7.5]],'#ffcf3a');K.poly([[8,10],[11,12.5],[5,12.5]],'#ffcf3a')},
 ore1:K=>{K.poly([[2,9],[5,4],[10,3],[14,7],[13,13],[6,14],[2,12]],'#8a8478');K.poly([[2,9],[5,4],[10,3],[8,8]],'#b4ada0');K.poly([[13,13],[6,14],[9,9],[14,7]],'#5e584e');
  K.pts([[6,8],[7,8],[7,9],[10,10],[11,10],[10,11],[9,6]],'#f0a050');K.pts([[6,7],[10,9]],'#ffd27a')},
 ore2:K=>{K.poly([[1,10],[4,6],[12,6],[15,10],[12,14],[4,14]],'#7a7468');K.poly([[1,10],[4,6],[8,8]],'#a8a194');
  K.poly([[5,10],[7,2],[9,10]],'#5ec8ff');K.poly([[7,2],[9,10],[7,10]],'#2a8ad8');K.poly([[9,11],[11,5],[13,11]],'#7fd8ff');K.poly([[11,5],[13,11],[11,11]],'#3a9ae8');K.P(7,4,'#ffffff');K.P(11,7,'#ffffff')},
 ore3:K=>{K.poly([[1,11],[3,7],[13,7],[15,11],[12,15],[4,15]],'#5e5468');K.poly([[1,11],[3,7],[8,9]],'#857a90');
  K.poly([[4,11],[6,3],[9,1],[11,4],[12,11]],'#b86aff');K.poly([[6,3],[9,1],[8,11],[4,11]],'#d8a0ff');K.poly([[11,4],[12,11],[8,11]],'#7a3ad0');K.P(7,4,'#ffffff');K.P(8,3,'#ffffff');K.pts([[2,2],[14,3],[13,1]],'#f0d8ff')},
 gem1:K=>{const p=[];for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?2.3:5.6;p.push([8+Math.cos(a)*rr,8.6+Math.sin(a)*rr])}K.poly(p,'#ffcf3a');K.poly([[8,3],[8,8.6],[4.5,7]],'#fff6b0');K.pts([[2,3],[13,13],[14,2]],'#fff6b0')},
 gem2:K=>{K.poly([[8,1],[13,6],[8,15],[3,6]],'#3fa0ec');K.poly([[8,1],[8,15],[3,6]],'#7fd0ff');K.poly([[3,6],[13,6],[8,8]],'#bfeaff');const p=[];for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?1:2.4;p.push([8+Math.cos(a)*rr,8.5+Math.sin(a)*rr])}K.poly(p,'#ffffff')},
 gem3:K=>{K.ball(8,8,6.6,['#ffe0f4','#ff8ac8','#b04aa0']);K.ring(8,8,4.6,5.8,'#ffd23f');const p=[];for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?1.4:3.2;p.push([8+Math.cos(a)*rr,8.3+Math.sin(a)*rr])}K.poly(p,'#fff6b0');K.pts([[4,4],[5,3]],'#ffffff')},
 // ---- Kebangkitan ★4–★6 ----
 asc1:K=>{K.poly([[8,1],[12.5,6],[8,15],[3.5,6]],'#2ab8d8');K.poly([[8,1],[8,15],[3.5,6]],'#7ff0ff');K.poly([[3.5,6],[12.5,6],[8,8]],'#d8ffff');K.line(8,2,8,14,'#ffffff');
  K.poly([[1,7],[3.5,5.5],[4,9]],'#ffd23f');K.poly([[15,7],[12.5,5.5],[12,9]],'#ffd23f');K.pts([[1,2],[14,1],[2,13],[14,13]],'#fff6b0')},
 asc2:K=>{K.ring(8,8.5,5.4,7.2,'#ffcf3a');K.ring(8,8.5,6.4,7.2,'#fff6b0');K.ball(8,8.5,4.6,['#ffffff','#ffe8a0','#e8a83a']);
  const p=[];for(let i=0;i<8;i++){const a=-Math.PI/2+i*Math.PI/4,rr=i%2?1:2.8;p.push([8+Math.cos(a)*rr,8.5+Math.sin(a)*rr])}K.poly(p,'#ffffff');K.rect(7,0,2,2,'#fff6b0');K.pts([[1,3],[15,4],[2,15],[14,15]],'#ffffff')},
 asc3:K=>{K.poly([[8,0.5],[12.8,9],[11.6,13],[8,15],[4.4,13],[3.2,9]],'#ff6ac8');K.poly([[8,0.5],[8,15],[4.4,13],[3.2,9]],'#ffb0e4');
  K.rect(5,9,6,1,'#ffd23f');K.rect(4,11,8,1,'#5ec8ff');K.rect(5,13,6,1,'#9cf06a');K.poly([[6,4],[7.6,2],[7.6,7]],'#ffffff');K.pts([[1,2],[14,2],[1,12],[15,10]],'#fff6b0')},
 tower:K=>{K.rect(5,4,6,11,'#c9ced8');K.rect(5,4,2,11,'#ffffff');K.rect(10,4,1,11,'#8a96aa');K.rect(4,14,8,2,'#8a96aa');K.rect(4,3,8,2,'#ffcf3a');K.rect(4,3,8,1,'#fff6b0');
  K.poly([[5,3],[8,0],[11,3]],'#7f5ae8');K.rect(7,7,2,3,'#3fa9f5');K.P(7,7,'#bfeaff');K.rect(7,11,2,3,'#3b2416');K.pts([[1,2],[14,6],[2,9]],'#fff6b0')},
 pick:K=>{K.line(3,14,11,6,'#9a5a2a');K.line(4,14,12,6,'#c07a40');K.poly([[5,3],[9,1],[14,3],[15,7],[13,6],[10,4],[7,5]],'#b4bccc');K.poly([[5,3],[9,1],[14,3],[10,3]],'#ffffff');K.pts([[14,7],[15,7]],'#8a96aa')},
 shrine:K=>{K.rect(1,3,14,2,'#e8483b');K.rect(0,3,16,1,'#a8282a');K.rect(2,6,12,1,'#e8483b');K.rect(3,5,2,10,'#e8483b');K.rect(11,5,2,10,'#e8483b');K.rect(3,5,1,10,'#ff7a6a');K.rect(11,5,1,10,'#ff7a6a');
  const p=[];for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?1.2:2.6;p.push([8+Math.cos(a)*rr,10.5+Math.sin(a)*rr])}K.poly(p,'#ffd23f')},
 bag:K=>{K.ball(8,10,5.6,['#e8b070','#c07a40','#8a5228']);K.rect(5,3,6,3,'#9a5a2a');K.rect(4,5,8,1,'#ffcf3a');K.P(7,9,'#ffd23f');K.P(8,9,'#ffd23f');K.P(5,8,'#e8b070')},
 shop:K=>{K.rect(2,7,12,8,'#fff3d6');K.rect(2,14,12,1,'#e2c08a');for(let i=0;i<7;i++)K.rect(1+i*2,3,2,4,i%2?'#ffffff':'#e8483b');K.rect(1,3,14,1,'#a8282a');K.poly([[1,7],[15,7],[15,8],[1,8]],'#d8403a');K.rect(4,9,3,6,'#9a5a2a');K.rect(9,9,4,3,'#6ec6ff');K.P(9,9,'#ffffff');K.P(6,12,'#ffd23f')},
 chest:K=>{K.rect(1,7,14,8,'#c07a40');K.rect(1,7,14,1,'#e0a060');K.rect(1,4,14,4,'#9a5a2a');K.rect(2,3,12,1,'#9a5a2a');K.rect(1,4,14,1,'#c07a40');K.rect(1,7,14,1,'#ffcf3a');K.rect(3,4,1,11,'#ffcf3a');K.rect(12,4,1,11,'#ffcf3a');K.rect(7,7,2,3,'#ffd23f');K.P(7,8,'#3b2416')}
};
const ICON={};for(const k in ICON_DRAW)ICON[k]=pxIcon(ICON_DRAW[k]);
ICON.el={
 api:ascii(["...K...","..KRK..",".KRYRK.",".KRYRK.","KRYYYRK","KRYYYRK",".KKKKK."]),
 air:ascii(["...K...","..KBK..",".KBBBK.","KBWBBBK","KBWBBBK","KBBBBBK",".KKKKK."]),
 tanah:ascii(["....KKK","..KKGGK",".KGGGGK","KGGLGGK","KGLGGK.","KLKKK..","L......"]),
 cahaya:ascii(["Y..Y..Y",".KKKKK.",".KYYYK.","YKYWYKY",".KYYYK.",".KKKKK.","Y..Y..Y"]),
 gelap:ascii(["..KKKK.",".KPPK..","KPPK...","KPPK...","KPPPK..",".KPPPKK","..KKKK."]),
 netral:ascii([".KKKKK.","KSSSSSK","KSWSSSK","KSSSSSK","KSSSSSK","KSSSSSK",".KKKKK."])
};
