const ART_RAIKA=(()=>{
// ===== Raika — Pemanah Petir Kelana (gaya chibi 3/4 sama dengan Seraphine & Sakuya) =====
// Referensi: caping jerami bertepi hitam + label gantung & rumbai merah, bob biru-hitam dengan ujung biru
// + ekor rambut panjang berkibar, mata merah, mantel kimono navy bermotif bunga putih, bodysuit hitam,
// sabuk taktis, sepatu bot lapis baja hitam. Senjata: busur hitam berpetir biru.
const PAL={s1:'#fff1e6',s2:'#ffd8c2',s3:'#f0a891',
 h1:'#5a6ea8',h2:'#2c3456',h3:'#1c2140',h4:'#0e1124',hs:'#7c9ae0',hb1:'#5aa0f0',hb2:'#2e62c0',
 e1:'#3a0610',e2:'#d81e30',e3:'#ff7a6a',W:'#ffffff',pk:'#ff9aaa',bl:'#ffbcc6',mo:'#b84a5e',tg:'#ff7f93',
 o1:'#6680c4',o2:'#46609e',o3:'#2e4272',o4:'#1a2444',fw:'#f2eee2',fw2:'#bdb6a4',
 b1:'#6a6a80',b2:'#3e3e50',b3:'#272734',b4:'#15151e',
 t1:'#c2a670',t2:'#9c8152',t3:'#735c34',t4:'#4e3c22',r1:'#3a3646',r2:'#1c1a24',rh:'#6c6880',pp1:'#f2ead2',pp2:'#c9bc98',ink:'#a8283a',
 c1:'#ff5a64',c2:'#d0283c',c3:'#8a1428',
 y1:'#fff4b0',y2:'#ffc23d',y3:'#d77f1e',
 lt1:'#f0fcff',lt2:'#8ae4ff',lt3:'#3aa8f0',
 bw1:'#4a4a5e',bw2:'#24242f',bs:'#d6ecff',
 LASH:'#1a0a1e',tear:'#86d4ff'};
const OUTC='#1a1028';
function hx(h){const n=parseInt(h.slice(1),16);return[n>>16,n>>8&255,n&255]}
function mixc(a,b,t){const A=hx(a),B=hx(b);return'#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('')}
const SW=44,SH=44;
// bentuk kepala rambut (sama dengan modul lain: 26 kolom mulai x=6)
const CAPA=["..........................","..........................","..........................","..........................",".......3322223322.........",".....33222211112222.......","....3322111111221112......","...332222222222222222.....","..43322222322222322223....","..43322223322223322222...."];

// ---- warna busur: bawaan (hitam-petir) atau kulit senjata lain yang dipasang ----
function bowCols(){const w=typeof CUR_WPN!=='undefined'?CUR_WPN:null;
 if(w&&w.cls==='bow'&&w.art!=='raika'&&w.pal)return{l1:w.pal.m[2],l2:w.pal.m[1],tip:w.pal.t[1],gem:w.pal.g[1],str:'#f0e6d0',bolt:false};
 return{l1:PAL.bw1,l2:PAL.bw2,tip:PAL.lt2,gem:PAL.lt3,str:PAL.bs,bolt:true}}
// busur tegak: lengkung ke kanan dari y0..y1 di sekitar x=cx; drawX = posisi tangan penarik (null = tali lurus)
function paintBow(U,cx,y0,y1,drawX,big){const p=PAL,q=bowCols(),n=y1-y0,mid=Math.round((y0+y1)/2);
 for(let i=0;i<=n;i++){const t=i/n,b=Math.round(Math.sin(t*Math.PI)*3.2),x=cx+b,y=y0+i;
  const tip=i<=1||i>=n-1;U(x,y,tip?q.tip:q.l1);U(x+1,y,tip?q.tip:q.l2);
  if(big&&!tip)U(x-1,y,i%4===0&&q.bolt?p.lt3:q.l2)}
 // pegangan + permata
 U(cx+3,mid-1,p.r1);U(cx+3,mid,q.gem);U(cx+4,mid,q.gem);U(cx+3,mid+1,p.r1);
 // tali
 if(drawX==null){for(let y=y0+1;y<y1;y++)U(cx,y,q.str)}
 else{const hx2=drawX,sc=q.bolt?'#9cc4e8':q.str;for(let i=1;i<=n-1;i++){const y=y0+i,t=i<=n/2?i/(n/2):(n-i)/(n/2),x=Math.round(cx+(hx2-cx)*t);U(x,y,sc)}}}
function drawBowIcon(){const W=18,H=30,c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');const G=Array.from({length:H},()=>Array(W).fill(null));
 const keep=typeof CUR_WPN!=='undefined'?CUR_WPN:null;try{if(typeof CUR_WPN!=='undefined')CUR_WPN=null}catch(e){}
 const U=(x,y,col)=>{if(col&&x>=0&&y>=0&&x<W&&y<H)G[y][x]=col};
 paintBow(U,5,1,28,null,true);
 // anak panah petir menyilang
 for(let x=1;x<=15;x++)U(x,15,PAL.bw1);U(16,14,PAL.lt2);U(16,15,PAL.lt1);U(16,16,PAL.lt2);U(17,15,PAL.lt3);U(1,14,PAL.c2);U(1,16,PAL.c2);
 for(const[x,y]of[[12,6],[13,7],[12,8],[13,9],[14,22],[13,23],[14,24]])U(x,y,PAL.lt2);
 try{if(typeof CUR_WPN!=='undefined')CUR_WPN=keep}catch(e){}
 const O=G.map(r=>r.slice());for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(G[y][x])continue;for(const[dx,dy]of[[0,1],[-1,0],[1,0],[0,-1]]){const yy=y+dy,xx=x+dx;if(yy>=0&&xx>=0&&yy<H&&xx<W&&G[yy][xx]){O[y][x]=mixc(G[yy][xx],OUTC,.8);break}}}
 for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(O[y][x]){g.fillStyle=O[y][x];g.fillRect(x,y,1,1)}return c}

function drawRaika(f={}){
 const W=SW,H=SH,OX=2,OY=6;const G=Array.from({length:H},()=>Array(W).fill(null));
 const p=PAL,bd=f.bdy||0,hy=bd+(f.headDy||0),sw=f.sway||0,pose=f.pose||'ready',face=f.face||'idle',legs=f.legs||'stand';
 const P=(x,y,c)=>{x=Math.round(x)+OX;y=Math.round(y)+OY;if(c&&x>=0&&y>=0&&x<W&&y<H)G[y][x]=c};
 const get=(x,y)=>{x+=OX;y+=OY;return(x>=0&&y>=0&&x<W&&y<H)?G[y][x]:null};
 const U=(x,y,c)=>P(x,y+bd,c),Hh=(x,y,c)=>P(x,y+hy,c);
 const hlU=(y,a,b,c)=>{for(let x=a;x<=b;x++)U(x,y,c)},hlH=(y,a,b,c)=>{for(let x=a;x<=b;x++)Hh(x,y,c)};
 const ptsH=(arr,c)=>arr.forEach(([x,y])=>Hh(x,y,c)),ptsU=(arr,c)=>arr.forEach(([x,y])=>U(x,y,c));
 const lineU=(x0,y0,x1,y1,c,c2,dx2=0,dy2=1)=>{const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0))||1;for(let i=0;i<=n;i++){const x=x0+(x1-x0)*i/n,y=y0+(y1-y0)*i/n;U(x,y,c);if(c2)U(x+dx2,y+dy2,c2)}};
 const bow=(cx,y0,y1,dx,big)=>paintBow(U,cx,y0,y1,dx,big);

 // ---- ekor rambut panjang berkibar ke belakang (satu ekor utuh, ujung biru) ----
 {const N=34;for(let i=0;i<=N;i++){const t=i/N,s2=sw*(.5+t*2);const cx=11-7*t-s2*t+Math.sin(t*3.4)*1.8,cy=12+21*t,w=t<.2?4:(t<.55?3:(t<.85?2:1));
   for(let k=0;k<w;k++){const x=Math.round(cx)-k+1,y=Math.round(cy);let c=k===0?p.h2:(k===w-1?p.h4:p.h3);if(t>.5)c=k===0?p.hb1:(k===w-1?p.h3:p.hb2);if(t>.88)c=p.hb1;Hh(x,y,c)}}
  // kilau di sepanjang ekor
  for(const t of[.25,.4]){const cx=11-7*t+Math.sin(t*3.4)*1.8-sw*(.5+t*2)*t,cy=12+21*t;Hh(Math.round(cx)+1,Math.round(cy),p.hs)}}
 // ---- rambut belakang: bob sebahu ----
 for(let y=7;y<=19;y++){const a=8+(y<11?11-y:0);for(let x=a;x<=17;x++)Hh(x,y,x===a?p.h4:(y>=18?p.hb2:p.h3))}
 if(pose==='back'||pose==='aim')null;
 // sisi rambut jauh
 for(let y=12;y<=19;y++){Hh(27,y,y>=19?p.hb2:p.h3)}

 // ---- kaki: sepatu bot lapis baja hitam ----
 const LEG={stand:[[19,0],[16,0]],w0:[[14,0],[19,0]],w1:[[16,-1],[17,0]],w2:[[19,0],[14,0]],w3:[[17,0],[16,-1]]}[legs];
 const leg=(x,lift,far)=>{const a=far?p.b3:p.b2,b=far?p.b4:p.b3,hl=far?p.b2:p.b1;
  for(let y=29;y<=32+lift;y++){P(x,y,hl);P(x+1,y,a);P(x+2,y,b)}
  P(x,30,far?p.b2:'#7a7a90');P(x+1,30,hl);   // pelindung lutut berkilap
  const by=32+lift;for(let xx=x-1;xx<=x+3;xx++)P(xx,by+1,far?p.b4:p.b3);P(x+3,by+1,p.b4);P(x-1,by+1,hl)};
 leg(LEG[0][0],LEG[0][1],true);leg(LEG[1][0],LEG[1][1],false);
 // ---- rok mantel navy (asimetris) dengan motif bunga putih + panel belakang panjang ----
 for(let y=24;y<=31;y++){const a=y<27?14:13,b=y<=28?20:16;for(let x=a;x<=b;x++){let c=p.o2;if(x<=a)c=p.o4;else if(x===a+1)c=p.o3;if(y>=30)c=x<=a+1?p.o4:p.o3;U(x,y,c)}}
 const flower=(x,y)=>{ptsU([[x,y-1],[x-1,y],[x+1,y],[x,y+1]],p.fw);U(x,y,p.y2)};flower(16,27);flower(19,29);U(14,30,p.fw);U(18,26,p.fw2)
 // celah depan: paha + strap paha
 for(let y=25;y<=28;y++){U(21,y,p.s2);U(22,y,p.s3)}hlU(27,21,22,p.b3);
 // panel kain hitam bermotif emas di sisi depan
 for(let y=24;y<=30;y++){U(23,y,y%2?p.b3:p.b2);if(y===26||y===29)U(23,y,p.y3)}
 // ---- sabuk taktis + kantong ----
 hlU(24,14,23,p.b4);U(19,24,p.r1);ptsU([[15,25],[16,25],[15,26],[16,26]],p.b2);U(15,25,p.b1);ptsU([[18,25],[18,26]],p.b2);
 // ---- badan: bodysuit hitam berbalut perban + liontin emas ----
 for(let y=21;y<=23;y++){hlU(y,16,22,y===22?p.b2:p.b3);U(16,y,p.b4)}
 ptsU([[18,21],[20,22],[22,21],[17,23],[21,23]],p.b1);U(20,21,p.y2);U(20,22,p.y3);
 // bahu kanan terbuka (kulit) + mantel jatuh dari bahu kiri
 U(22,21,p.s2);U(23,21,p.s3);
 // ---- lengan mantel kimono lebar (sisi dekat) bermotif bunga ----
 for(let y=21;y<=28;y++){const a=y<23?14:12,b=16;for(let x=a;x<=b;x++)U(x,y,x===a?p.o4:(y>=27?p.o3:p.o2))}
 {const fl=(x,y)=>{ptsU([[x,y-1],[x-1,y],[x+1,y],[x,y+1]],p.fw);U(x,y,p.y2)};fl(14,25)}U(13,27,p.fw2);hlU(28,12,16,p.o4);U(12,27,p.c2);U(12,28,p.c3);  // rumbai kecil di ujung lengan
 // tali bahu / pelindung bahu hitam
 ptsU([[16,21],[17,21],[16,22]],p.b2);U(17,22,p.r1);
 // leher
 for(let x=19;x<=21;x++)Hh(x,21,p.s3);
 // ---- wajah ----
 const FR={9:[17,24],10:[16,25],11:[15,26],12:[15,26],13:[15,26],14:[15,26],15:[15,26],16:[15,26],17:[15,26],18:[15,26],19:[16,25],20:[18,23]};
 for(let y=9;y<=20;y++){const[a,b]=FR[y];for(let x=a;x<=b;x++)Hh(x,y,(x<=16||(y===20&&(x===18||x===23)))?p.s3:p.s2)}
 Hh(26,15,p.s1);Hh(26,16,p.s1);
 // ---- ekspresi (sistem sama; mata merah tajam) ----
 const L=p.LASH;const He=(x,y,c)=>Hh(x,y+1,c),hlE=(y,a,b,c)=>hlH(y+1,a,b,c),ptsE=(a,c)=>a.forEach(([x,y])=>Hh(x,y+1,c));
 const lash=()=>{hlE(13,17,20,L);He(17,14,L);hlE(13,23,25,L);He(25,14,L)};
 const blush=()=>{He(16,18,p.bl);He(25,18,p.bl)};
 const eyes=()=>{ptsE([[18,14],[23,14]],p.W);ptsE([[19,14],[20,14],[20,15],[24,14],[24,15]],p.e1);ptsE([[18,15],[19,15],[19,16],[20,16],[23,15],[24,16]],p.e2);ptsE([[18,16],[18,17],[19,17],[23,16],[23,17],[24,17]],p.e3)};
 const fierce=()=>{hlE(13,17,20,L);hlE(14,17,20,L);hlE(13,23,25,L);hlE(14,23,24,L);ptsE([[18,15],[20,15],[24,15]],p.e1);ptsE([[19,15],[23,15]],p.W);ptsE([[18,16],[19,16],[20,16],[23,16],[24,16]],p.e2);ptsE([[18,17],[19,17],[20,17],[23,17],[24,17]],p.e3)};
 if(face==='idle'){lash();eyes();blush();ptsE([[20,18],[21,18]],p.mo)}            // senyum tipis tenang
 if(face==='blink'){ptsE([[17,13],[18,14],[19,14],[20,13]],L);ptsE([[23,13],[24,14],[25,13]],L);blush();ptsE([[20,18],[21,18]],p.mo)}
 if(face==='happy'){ptsE([[17,15],[18,14],[19,14],[20,15]],L);ptsE([[23,15],[24,14],[25,15]],L);blush();ptsE([[20,18],[21,18],[22,18]],p.mo);He(21,19,p.tg)}
 if(face==='ready'){fierce();He(21,18,p.mo)}
 if(face==='yell'){fierce();ptsE([[19,18],[20,18],[21,18],[22,18]],p.W);ptsE([[19,19],[22,19]],p.mo);ptsE([[20,19],[21,19]],p.tg)}
 if(face==='hurt'){ptsE([[17,13],[18,14],[19,15],[18,16],[17,17]],L);ptsE([[25,13],[24,14],[23,15],[24,16],[25,17]],L);ptsE([[16,18],[16,19],[15,20]],p.tear);ptsE([[19,19],[20,18],[21,19],[22,18],[23,19]],p.mo)}
 if(face==='daze'){lash();ptsE([[18,14],[19,14],[20,14],[23,14],[24,14]],p.e1);ptsE([[18,15],[19,15],[23,15]],p.W);ptsE([[20,15],[24,15]],p.e2);ptsE([[18,16],[19,16],[20,16],[23,16],[24,16]],p.tear);ptsE([[18,17],[19,17],[20,17],[23,17],[24,17]],p.e3);ptsE([[20,19],[21,18],[22,19]],p.mo)}
 if(face==='calm'){ptsE([[17,16],[18,17],[19,17],[20,16]],L);ptsE([[23,16],[24,17],[25,16]],L);ptsE([[20,18],[21,18]],p.mo)}
 if(face==='glare'){fierce();ptsE([[19,15],[23,15]],p.lt2);ptsE([[18,15],[24,15]],p.W);He(21,18,p.mo)}   // mata menyala petir
 // ---- tudung rambut ----
 const CM={'1':p.h1,'2':p.h2,'3':p.h3,'4':p.h4};
 CAPA.forEach((row,y)=>[...row].forEach((ch,i)=>{if(CM[ch])Hh(6+i,y,CM[ch])}));
 for(let y=4;y<=9;y++){let mx=-1;[...CAPA[y]].forEach((ch,i)=>{if(ch!=='.')mx=i});if(mx>=0)Hh(6+mx,y,p.h2)}
 // ---- poni bob: lurus dengan sedikit belahan ----
 for(let x=16;x<=27;x++){const e=x===20||x===24?13:12;for(let y=9;y<=e;y++)Hh(x,y,y===e?p.h3:p.h2);const c=get(x,e+1+hy);if(c===p.s2||c===p.s1)Hh(x,e+1,p.s3)}
 [[17,10],[18,10],[22,10],[25,10]].forEach(([x,y])=>Hh(x,y,p.h1));
 // ---- helai samping dekat: bob dengan ujung biru ----
 for(let y=10;y<=20;y++){const s=y>17?Math.round(sw/2):0;Hh(12-s,y,p.h4);Hh(13-s,y,y>=17?p.hb2:p.h3);Hh(14-s,y,y>=18?p.hb1:(y>=11&&y<=14?p.h1:p.h2));Hh(15-s,y,y>=18?p.hb2:p.h3)}
 hlH(20,12,15,p.hb2);
 // ---- caping jerami (kasa): ceper, di tengah kepala, tepi hitam berpernis ----
 {const cx=18,apY=1,rimY=5,wind=f.wind||0;
  for(let y=apY;y<rimY;y++){const hw=3+(y-apY)*3;for(let x=cx-hw;x<=cx+hw;x++){const d=(x-cx)/hw;
    const band=Math.floor((x-cx+.5)/(y-apY+1)*1.6+40)%2;                    // garis anyaman memancar dari puncak
    let c=d<-.45?(band?p.t3:p.t4):(d>.35?(band?p.t1:p.t2):(band?p.t2:p.t3));if(y===rimY-1&&d>-.2&&d<.6&&band)c=p.t1;
    if(y===apY)c=Math.abs(x-cx)<=1?p.r1:p.r2;Hh(x,y,c)}}
  ptsH([[cx,apY-1],[cx-1,apY-1]],p.r2);Hh(cx,apY-2,p.r1);                  // kenop atas berpernis
  hlH(rimY,cx-14,cx+14,p.r1);hlH(rimY+1,cx-13,cx+13,p.r2);                 // tepi hitam + bayangan bawah
  ptsH([[cx-9,rimY],[cx-3,rimY],[cx+5,rimY],[cx+11,rimY]],p.rh);           // kilap pernis
  // kertas jimat (ofuda) di ujung-ujung, berayun tertiup angin ke belakang
  // pergeseran x tiap segmen per fase angin (makin ke bawah makin terayun)
  const SH=[[0,-1,-1,-2,-2,-3,-3],[0,0,-1,-1,-2,-2,-2],[0,0,0,-1,-1,-1,-1],[0,0,-1,-1,-1,-2,-2]];
  const strip=(x0,ph,len)=>{const sh=SH[(wind+ph)%4];Hh(x0,rimY+1,p.c2);Hh(x0,rimY+2,p.c3);   // tali merah
   for(let k=1;k<=len;k++){const x=x0+sh[k-1],y=rimY+2+k;Hh(x,y,k===len?p.pp2:p.pp1);Hh(x+1,y,k===1?p.pp1:p.pp2);
    if(k===2||k===4)Hh(x,y,p.ink);if(k===3)Hh(x+1,y,'#3a2a30')}};                          // goresan tinta
  strip(cx-14,0,6);strip(cx+14,2,6);strip(cx-9,1,4);strip(cx+9,3,4)}
 // ---- lengan + busur ----
 const arm=(x0,y0,x1,y1)=>{lineU(x0,y0,x1,y1,p.o2,p.o3)},hand=(x,y)=>{ptsU([[x,y],[x+1,y],[x,y+1],[x+1,y+1]],p.b2);U(x+1,y+1,p.b3)};  // sarung tangan hitam
 const arrow=(x0,x1,y,lit)=>{for(let x=x0;x<=x1;x++)U(x,y,p.bw1);U(x1+1,y,lit?p.lt1:p.r1);U(x1+1,y-1,lit?p.lt2:p.r2);U(x1+1,y+1,lit?p.lt2:p.r2);U(x1+2,y,lit?p.lt3:p.r1);U(x0,y-1,p.c2);U(x0,y+1,p.c2)};
 if(pose==='ready'){bow(28,15,32,null);arm(16,23,29,23);hand(30,23)}
 if(pose==='back'||pose==='aim'){bow(28,15,32,21);arm(16,23,29,23);hand(30,22);arrow(21,34,23,pose==='aim'||f.bolt);hand(20,22)}
 if(pose==='slash'){bow(28,13,31,null);arm(16,22,29,22);hand(30,21);lineU(16,22,13,20,p.o2,p.o3);hand(12,19)}
 if(pose==='follow'){bow(27,14,32,null);arm(16,23,28,23);hand(29,22);lineU(16,22,14,21,p.o2,p.o3)}
 if(pose==='hit'){bow(24,21,34,null);arm(16,24,22,26);hand(22,26)}
 if(pose==='raise'){bow(24,4,22,null,true);lineU(16,21,24,13,p.o2,p.o3,1,0);hand(24,12)}
 // ---- tanda anime & petir ----
 const marks=[];
 if(f.sweat){marks.push([29,6+hy,p.W],[28,7+hy,p.tear],[29,7+hy,p.W],[28,8+hy,p.tear],[29,8+hy,p.tear],[30,8+hy,p.tear],[29,9+hy,p.tear])}
 if(f.vein){for(const[x,y]of[[28,2],[29,2],[31,2],[32,2],[28,3],[32,3],[28,5],[32,5],[28,6],[29,6],[31,6],[32,6]])marks.push([x,y+hy,'#ff3b5c'])}
 const BOLT=[[[0,0],[1,1],[0,2],[1,3],[2,4],[1,5]],[[1,0],[0,1],[1,2],[2,3],[1,4],[2,5]]];
 const bolt=(x0,y0,v)=>BOLT[v%2].forEach(([dx,dy],i)=>{marks.push([x0+dx,y0+dy+bd,i%3===0?p.lt1:p.lt2]);if(i%2)marks.push([x0+dx+1,y0+dy+bd,p.lt3])});
 if(f.bolt){const v=f.flick||0;const pts=[[30,8],[33,20],[29,28],[24,4],[35,13]];for(let k=0;k<Math.min(5,f.bolt+1);k++)bolt(pts[k][0],pts[k][1],v+k)}
 if(f.spark){const o=f.spark;for(const[x,y]of(o===1?[[29,10],[27,2],[31,18]]:[[30,14],[25,1],[29,22]]))marks.push([x,y+hy,p.lt1],[x-1,y+hy,p.lt2],[x+1,y+hy,p.lt2],[x,y-1+hy,p.lt2],[x,y+1+hy,p.lt3])}
 // ---- garis luar ----
 const O=G.map(r=>r.slice());
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(G[y][x])continue;let nb=null,dir=null;for(const[dx,dy]of[[0,1],[-1,0],[1,0],[0,-1]]){const yy=y+dy,xx=x+dx;if(yy>=0&&xx>=0&&yy<H&&xx<W&&G[yy][xx]){nb=G[yy][xx];dir=[dx,dy];break}}
  if(nb)O[y][x]=mixc(nb,OUTC,(dir[1]===1)?.72:.8)}
 for(const[x,y,c]of marks){const X=x+OX,Y=y+OY;if(X>=0&&Y>=0&&X<W&&Y<H&&!G[Y][X])O[Y][X]=c}
 const lx=f.lean||0;if(lx){for(const r of O){if(lx>0){r.unshift(...Array(lx).fill(null));r.length=W}else{r.splice(0,-lx);while(r.length<W)r.push(null)}}}
 const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');
 for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(O[y][x]){g.fillStyle=O[y][x];g.fillRect(x,y,1,1)}
 return c;
}
const ANIMS={
 idle:[{d:500,f:{wind:0}},{d:500,f:{bdy:1,sway:1,wind:1}},{d:500,f:{wind:2}},{d:110,f:{face:'blink',wind:3}},{d:500,f:{bdy:1,sway:1,wind:0}},{d:500,f:{sway:-1,wind:1}},{d:600,f:{face:'happy',wind:2}}],
 walk:[{d:140,f:{legs:'w0',wind:0}},{d:140,f:{legs:'w1',bdy:-1,sway:1,wind:1}},{d:140,f:{legs:'w2',wind:2}},{d:140,f:{legs:'w3',bdy:-1,sway:1,wind:3}}],
 attack:[{d:300,f:{pose:'back',face:'ready',lean:-1,sway:-1,wind:1}},{d:100,f:{pose:'slash',face:'yell',lean:1,fx:'shot',spark:1,wind:2}},{d:240,f:{pose:'follow',face:'ready',sway:1,wind:3}},{d:400,f:{face:'idle',wind:0}}],
 hit:[{d:120,f:{pose:'hit',face:'hurt',lean:-3,flash:1,sway:-1,vein:1,wind:1}},{d:320,f:{pose:'hit',face:'hurt',lean:-2,sway:-1,sweat:1,wind:2}},{d:420,f:{pose:'hit',face:'daze',lean:-1,sweat:1,wind:3}},{d:300,f:{face:'daze',wind:0}}],
 skill:[{d:260,f:{pose:'aim',face:'calm',bdy:1,bolt:1,wind:1}},{d:220,f:{pose:'aim',face:'calm',bdy:1,bolt:2,flick:1,wind:2}},{d:220,f:{pose:'aim',face:'glare',bolt:3,wind:3}},{d:160,f:{pose:'aim',face:'glare',bolt:4,flick:1,fx:'eyeflash',wind:0}},{d:110,f:{pose:'slash',face:'yell',lean:2,bolt:4,spark:1,fx:'thunder',wind:1}},{d:180,f:{pose:'slash',face:'yell',lean:1,bolt:2,spark:2,wind:2}},{d:300,f:{pose:'follow',face:'ready',bolt:1,wind:3}},{d:420,f:{face:'happy',spark:2,wind:0}}]
};
return{draw:drawRaika,anims:ANIMS,icon:drawBowIcon,paintW:null,strike:.5,pal:PAL}})();
