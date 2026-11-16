// ---- ikon Pelindung & Aksesori (32x32, outline, dari bentuk + palet + bintang) ----
const GICON={};
function gearIcon(id){if(GICON[id])return GICON[id];const g=GDD[id],S=32,G=Array.from({length:S},()=>Array(S).fill(null));
 const P=(x,y,c)=>{x=Math.round(x);y=Math.round(y);if(c&&x>=0&&y>=0&&x<S&&y<S)G[y][x]=c};
 const M=g.pal.m,T=g.pal.t,Gm=g.pal.g,r=g.r,W='#ffffff';
 const gem=(x,y,big)=>{if(big){for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(Math.abs(dx)+Math.abs(dy)<2)P(x+dx,y+dy,Gm[1]);P(x+1,y+1,Gm[0]);P(x-1,y,Gm[2]);P(x,y-1,W)}else{P(x,y,Gm[1]);P(x+1,y,Gm[0]);P(x,y+1,Gm[0]);P(x+1,y+1,Gm[0]);P(x,y,Gm[2])}};
 const shade=(x,cx,hw)=>{const t=(x-cx)/Math.max(1,hw);return t<-.55?M[1]:t>.55?M[3]:M[2]};
 if(g.kind==='vest'||g.kind==='plate'){
  // badan: lebar menyempit ke pinggang
  for(let y=8;y<=27;y++){const hw=y<12?10:y<20?9-Math.floor((y-12)/3):7;for(let x=16-hw;x<=16+hw-1;x++){let c=shade(x,15.5,hw);if(x===16-hw||x===16+hw-1)c=M[0];P(x,y,c)}}
  // kerah / leher
  for(let x=12;x<=19;x++){P(x,8,null);P(x,9,null)}for(let x=13;x<=18;x++)P(x,10,null);for(let x=14;x<=17;x++)P(x,11,null);
  for(let x=11;x<=20;x++){if(!G[8][x])continue}
  if(g.kind==='vest'){for(let y=11;y<=27;y++){P(15,y,M[0]);P(16,y,M[0])}for(let y=13;y<=25;y+=3){P(14,y,T[2]);P(17,y,T[2]);P(15,y+1,T[1]);P(16,y+1,T[1])}
   for(let x=9;x<=22;x++)P(x,22,T[0]);P(12,22,T[2]);P(19,22,T[2]);if(r>=2)gem(11,15)}
  else{ // plate: pelindung bahu + garis tengah
   for(let y=6;y<=12;y++){const hw=y<8?3:4;for(let dx=-hw;dx<=hw;dx++){P(7+dx,y+1,dx<0?T[1]:T[2]);P(24+dx,y+1,dx<0?T[1]:T[2])}}
   for(let x=3;x<=11;x++)P(x,13,T[0]);for(let x=20;x<=28;x++)P(x,13,T[0]);
   for(let y=12;y<=26;y++){P(15,y,M[3]);P(16,y,M[2])}for(let x=9;x<=22;x++){P(x,18,T[1]);P(x,23,T[0])}
   if(r>=2)gem(15,15,1);if(r>=3){gem(8,9);gem(23,9);for(let y=19;y<=22;y++){P(12,y,T[2]);P(19,y,T[2])}}}}
 if(g.kind==='robe'){
  for(let y=7;y<=29;y++){const hw=y<11?6+Math.floor((y-7)/2):8+Math.floor((y-11)/3);for(let x=16-hw;x<=15+hw;x++){let c=shade(x,15.5,hw);if(x===16-hw||x===15+hw)c=M[0];P(x,y,c)}}
  for(let y=7;y<=12;y++){const w=12-y;for(let x=16-w;x<=15+w;x++)P(x,y,null)}// leher V
  for(let y=7;y<=13;y++){P(16-(13-y)-1,y,T[1]);P(15+(13-y)+1,y,T[1])}
  for(let x=8;x<=23;x++){P(x,17,T[0]);P(x,18,T[1])}gem(15,17);
  for(let x=4;x<=27;x++)if(G[28][x]){P(x,28,T[1]);P(x,29,T[2])}
  for(let y=19;y<=27;y++)P(16,y,M[1]);
  if(r>=2){for(const[x,y]of[[11,22],[20,22],[9,26],[22,26]])P(x,y,T[2])}
  if(r>=3){for(const[x,y]of[[12,10],[19,10],[13,24],[18,24],[16,26]]){P(x,y,W)}P(10,14,Gm[2]);P(21,14,Gm[2])}}
 if(g.kind==='ring'){
  for(let a=0;a<64;a++){const an=a/64*Math.PI*2;for(let rr=7;rr<=9.6;rr+=.6){const x=16+Math.cos(an)*rr,y=19+Math.sin(an)*rr;const c=rr<7.8?M[1]:rr>9?M[3]:(Math.sin(an)>0?M[1]:M[2]);P(x,y,c)}}
  for(let y=6;y<=12;y++)for(let x=12;x<=19;x++){const k=Math.abs(x-15.5)+Math.abs(y-9);if(k<=4.6)P(x,y,T[1]);}
  for(let y=5;y<=12;y++)for(let x=13;x<=18;x++){const d=(x-15.5)**2/7+(y-8.5)**2/9;if(d<=1)P(x,y,d<.35?Gm[2]:(x<15.5?Gm[1]:Gm[0]))}
  P(14,6,W);P(14,7,W);if(r>=2){P(10,10,Gm[2]);P(21,10,Gm[2])}if(r>=3){for(const[x,y]of[[15,2],[10,5],[21,5],[8,9],[23,9]])P(x,y,'#fff6b0');P(16,1,'#fff6b0')}}
 if(g.kind==='amulet'){
  for(let i=0;i<=12;i++){const y=3+i,xl=5+Math.round(i*.75),xr=26-Math.round(i*.75);P(xl,y,i%2?T[1]:T[2]);P(xr,y,i%2?T[1]:T[2])}
  for(let x=14;x<=17;x++)P(x,16,T[1]);
  for(let y=17;y<=29;y++)for(let x=9;x<=22;x++){const d=(x-15.5)**2/42+(y-23)**2/40;if(d<=1){const e=d>.62;P(x,y,e?M[2]:(d<.25?Gm[2]:(x<15.5?Gm[1]:Gm[0])))}}
  P(13,20,W);P(13,21,W);P(14,20,W);
  if(r>=2)for(const[x,y]of[[9,23],[22,23],[15,30],[16,30]])P(x,y,T[2]);
  if(r>=3){for(const[x,y]of[[4,18],[27,18],[3,24],[28,24]])P(x,y,'#fff6b0');for(let k=0;k<3;k++){P(15,21+k,W)}}}
 const O=G.map(rr=>rr.slice());for(let y=0;y<S;y++)for(let x=0;x<S;x++){if(G[y][x])continue;for(const[dx,dy]of[[0,1],[-1,0],[1,0],[0,-1]]){const yy=y+dy,xx=x+dx;if(yy>=0&&xx>=0&&yy<S&&xx<S&&G[yy][xx]){O[y][x]=mixcW(G[yy][xx],'#2a1430',.8);break}}}
 const c=document.createElement('canvas');c.width=S;c.height=S;const x=c.getContext('2d');for(let y=0;y<S;y++)for(let xx=0;xx<S;xx++)if(O[y][xx]){x.fillStyle=O[y][xx];x.fillRect(xx,y,1,1)}
 return GICON[id]={c,url:c.toDataURL()}}
