// ---- weapon icon painter (32x32, outlined) ----
const WICON={};
function weaponIcon(id){if(WICON[id])return WICON[id];const w=WD[id];let src;
 if(w.art&&ART_MODULES[w.art])src=ART_MODULES[w.art].icon();
 else{const S=32,G=Array.from({length:S},()=>Array(S).fill(null)),P=(x,y,c)=>{x=Math.round(x);y=Math.round(y);if(c&&x>=0&&y>=0&&x<S&&y<S)G[y][x]=c};
  const p=w.pal,M=p.m,T=p.t,Gm=p.g,r=w.r,W='#ffffff';
  const gem=(x,y)=>{P(x,y,Gm[1]);P(x+1,y,Gm[0]);P(x,y+1,Gm[0]);P(x+1,y+1,Gm[0]);P(x,y,Gm[2])};
  if(w.cls==='sword'){for(let y=2;y<=20;y++){const tip=y<4;P(15,y,tip?M[3]:M[3]);if(!tip||y===3){P(16,y,r>1&&y>4&&y<19?T[1]:M[2]);P(17,y,M[1])}if(y===2){P(16,y,M[3])}}
   for(let x=11;x<=21;x++)P(x,21,x===11||x===21?T[0]:T[1]);P(16,21,T[2]);if(r>=2){P(10,20,T[1]);P(22,20,T[1])}if(r>=3){P(9,19,T[2]);P(23,19,T[2])}
   for(let y=22;y<=26;y++){P(15,y,y%2?'#3a2a3a':'#5a3a4a');P(16,y,y%2?'#5a3a4a':'#3a2a3a')}gem(15,27);if(r>=2)gem(15,21)}
  if(w.cls==='bow'){for(let y=3;y<=29;y++){const t=(y-3)/26,x=19-Math.round(Math.sin(t*Math.PI)*7);P(x,y,M[2]);P(x-1,y,M[1]);P(x+1,y,M[3]);if(y===3||y===29){P(x,y,T[1]);P(x+1,y,T[2])}}
   for(let y=4;y<=28;y++)P(20,y,'#f4f0ff');for(let y=14;y<=18;y++){P(11,y,T[1]);P(12,y,T[2]);P(10,y,T[0])}
   if(r>=2){P(17,5,Gm[1]);P(17,27,Gm[1])}if(r>=3){for(const[x,y]of[[20,2],[21,1],[21,3],[20,30],[21,29],[21,31]])P(x,y,Gm[1]);gem(10,16);for(let i=0;i<4;i++){P(8-i,8+i*2,Gm[0]);P(8-i,24-i*2,Gm[0])}}}
  if(w.cls==='staff'){for(let y=9;y<=30;y++){P(16,y,y%5===0&&r>1?T[1]:M[1]);P(15,y,M[2]);P(17,y,M[0])}
   if(r===1){for(let y=4;y<=9;y++)for(let x=14;x<=18;x++)if((x-16)**2+(y-6.5)**2<=7)P(x,y,M[2]);P(15,5,M[3]);P(14,10,Gm[1]);P(18,10,Gm[1])}
   else{for(let y=2;y<=9;y++){const hw=y<6?y-2:9-y;for(let x=16-hw;x<=16+hw;x++)P(x,y,x<16?Gm[2]:(x===16?W:Gm[1]))}P(15,4,W);
    for(let y=6;y<=12;y++){P(12,y,T[1]);P(20,y,T[1])}P(13,12,T[1]);P(19,12,T[1]);P(14,13,T[0]);P(18,13,T[0])}
   if(r>=3){for(const[x,y]of[[16,0],[10,4],[22,4],[9,8],[23,8]])P(x,y,'#fff6b0');P(13,14,'#ff86ad');P(12,15,'#ff86ad');P(19,14,'#ff86ad');P(20,15,'#ff86ad')}}
  if(w.cls==='shield'){const R=[[10,22],[8,24],[8,24],[8,24],[8,24],[8,24],[8,24],[8,24],[8,24],[8,24],[9,23],[9,23],[10,22],[11,21],[12,20],[13,19],[14,18],[15,17]];
   R.forEach(([a,b],i)=>{const y=6+i;for(let x=a;x<=b;x++){const edge=x===a||x===b||i===0||i===R.length-1;P(x,y,edge?T[1]:(x<a+3?M[1]:(x>b-3?M[3]:M[2])))}if(r>=2){P(a,y,T[1]);P(b,y,T[2])}});
   if(r===1){for(let y=8;y<=20;y+=4)for(let x=10;x<=22;x++)P(x,y,M[0])}
   if(r===2){for(let y=9;y<=19;y++)P(16,y,Gm[1]);for(let x=11;x<=21;x++)P(x,13,Gm[1]);P(16,13,W)}
   if(r>=3){for(let a=0;a<8;a++){const an=a*Math.PI/4;P(16+Math.round(Math.cos(an)*5),14+Math.round(Math.sin(an)*5),Gm[2])}for(let y=-3;y<=3;y++)for(let x=-3;x<=3;x++)if(x*x+y*y<=9)P(16+x,14+y,x*x+y*y<=4?Gm[2]:Gm[1]);P(15,13,W)}}
  if(w.cls==='axe'){for(let y=6;y<=30;y++){P(16,y,T[1]);P(17,y,T[0]);if(y%4===0)P(16,y,T[2])}
   const head=(dir)=>{for(let y=5;y<=15;y++){const k=Math.min(y-5,15-y),len=3+Math.round(k*1.2);for(let i=1;i<=len;i++){const x=16+dir*i+(dir>0?1:0);P(x,y,i===len?W:(i===len-1?M[3]:(i<2?M[0]:M[2])))}}};
   head(-1);if(r>=2)head(1);P(16,4,M[2]);P(17,4,M[2]);if(r>=3){for(const[x,y]of[[9,4],[8,7],[24,4],[25,7],[7,11],[26,11]])P(x,y,Gm[2]);P(16,10,Gm[1]);P(17,10,Gm[2])}}
  const O=G.map(rr=>rr.slice());for(let y=0;y<S;y++)for(let x=0;x<S;x++){if(G[y][x])continue;for(const[dx,dy]of[[0,1],[-1,0],[1,0],[0,-1]]){const yy=y+dy,xx=x+dx;if(yy>=0&&xx>=0&&yy<S&&xx<S&&G[yy][xx]){O[y][x]=mixcW(G[yy][xx],'#2a1430',.8);break}}}
  src=document.createElement('canvas');src.width=S;src.height=S;const g=src.getContext('2d');for(let y=0;y<S;y++)for(let x=0;x<S;x++)if(O[y][x]){g.fillStyle=O[y][x];g.fillRect(x,y,1,1)}}
 const c=document.createElement('canvas');c.width=32;c.height=32;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
 if(src.width===32)g.drawImage(src,0,0);else{const sc=Math.min(1,32/src.height);g.drawImage(src,Math.round((32-src.width*sc)/2),Math.round((32-src.height*sc)/2),Math.round(src.width*sc),Math.round(src.height*sc))}
 return WICON[id]={c,url:c.toDataURL()}}
function mixcW(a,b,t){const A=[parseInt(a.slice(1,3),16),parseInt(a.slice(3,5),16),parseInt(a.slice(5,7),16)],B=[parseInt(b.slice(1,3),16),parseInt(b.slice(3,5),16),parseInt(b.slice(5,7),16)];return'#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('')}

