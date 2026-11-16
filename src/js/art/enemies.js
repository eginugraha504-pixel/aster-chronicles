// ===== Enemy sprites — chibi 3/4 style matching the heroines (44x44, facing right) =====
const ENE=(()=>{
const OUTC='#2a1430';
function hx(h){const n=parseInt(h.slice(1),16);return[n>>16,n>>8&255,n&255]}
function mixc(a,b,t){const A=hx(a),B=hx(b);return'#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('')}
function shade(hex,amt){const n=parseInt(hex.slice(1),16);const f=v=>Math.max(0,Math.min(255,Math.round(amt<0?v*(1+amt):v+(255-v)*amt)));return'#'+[n>>16,n>>8&255,n&255].map(v=>f(v).toString(16).padStart(2,'0')).join('')}
const K='#241626',W='#ffffff';
const BP={W,L1:'#ffffff',L2:'#e4ecfa',L3:'#a3b4d6',y1:'#fff4b0',y2:'#ffc23d',y3:'#d77f1e',wd1:'#c08a58',wd2:'#7a4a30',wd3:'#4e2c1e',gr:'#4a2c4a'};
const DIRS={u:{d:[0,-1],L:[-1,0],S:[1,0],w:[1,0]},r:{d:[1,0],L:[0,-1],S:[0,1],w:[0,1]},ur:{d:[1,-1],L:[-1,0],S:[1,0],w:[1,1]},ul:{d:[-1,-1],L:[1,0],S:[-1,0],w:[1,-1]},dr:{d:[1,1],L:[1,0],S:[-1,0],w:[1,-1]}};
const WEAP={
 sword(U,p,bx,by,dk,len){const D=DIRS[dk],[dx,dy]=D.d,[wx,wy]=D.w;for(let u=1;u<=len+1;u++){const cx=bx+dx*u,cy=by+dy*u;if(u===len+1){U(cx,cy,p.bl1);continue}U(cx+D.L[0],cy+D.L[1],p.bl1);U(cx,cy,p.bl2);U(cx+D.S[0],cy+D.S[1],p.bl3)}
  for(const sg of[1,-1]){U(bx+wx*sg,by+wy*sg,p.gd);U(bx+wx*2*sg,by+wy*2*sg,p.gd2)}U(bx,by,p.gd);U(bx-dx,by-dy,p.gr);U(bx-dx*2,by-dy*2,p.gd)},
 axe(U,p,bx,by,dk,len){const D=DIRS[dk],[dx,dy]=D.d;for(let u=-2;u<=len;u++){U(bx+dx*u,by+dy*u,u<0?p.wd3:p.wd1);U(bx+dx*u+D.S[0],by+dy*u+D.S[1],u<0?p.wd3:p.wd2)}
  for(let k=0;k<4;k++){const o=k===0||k===3?1:2;for(let j=1;j<=o+1;j++){U(bx+dx*(len-1-k)+D.L[0]*j,by+dy*(len-1-k)+D.L[1]*j,j===o+1?p.bl1:p.bl2)}}},
 club(U,p,bx,by,dk,len){const D=DIRS[dk],[dx,dy]=D.d;for(let u=-1;u<=len;u++){const w=u>len-4?1:0;U(bx+dx*u,by+dy*u,p.wd1);U(bx+dx*u+D.S[0],by+dy*u+D.S[1],p.wd2);if(w){U(bx+dx*u+D.L[0],by+dy*u+D.L[1],p.wd1);U(bx+dx*u+D.S[0]*2,by+dy*u+D.S[1]*2,p.wd3)}}
  for(const k of[len-1,len-3])U(bx+dx*k+D.L[0]*2,by+dy*k+D.L[1]*2,p.bl2)},
 staff(U,p,bx,by,dk,len){const D=DIRS[dk],[dx,dy]=D.d;len+=1;for(let u=-3;u<=len;u++){U(bx+dx*u,by+dy*u,'#3a2a4a');U(bx+dx*u+D.S[0],by+dy*u+D.S[1],'#241a30')}
  const ox=bx+dx*(len+2),oy=by+dy*(len+2);for(let y=-1;y<=1;y++)for(let x=-1;x<=1;x++)U(ox+x,oy+y,x+y>0?p.orb3:p.orb2);U(ox-1,oy-1,p.orb1);
  for(const sg of[1,-1])U(bx+dx*(len+1)+D.w[0]*sg*2,by+dy*(len+1)+D.w[1]*sg*2,'#5a3a7a')}
};
function render(G,marks,lean){const H=G.length,Wd=G[0].length,O=G.map(r=>r.slice());
 for(let y=0;y<H;y++)for(let x=0;x<Wd;x++){if(G[y][x])continue;let nb=null,dir=null;for(const[dx,dy]of[[0,1],[-1,0],[1,0],[0,-1]]){const yy=y+dy,xx=x+dx;if(yy>=0&&xx>=0&&yy<H&&xx<Wd&&G[yy][xx]){nb=G[yy][xx];dir=[dx,dy];break}}if(nb)O[y][x]=mixc(nb,OUTC,(dir[1]===1)?.72:.8)}
 for(const[x,y,c]of marks)if(x>=0&&y>=0&&x<Wd&&y<H&&!G[y][x])O[y][x]=c;
 if(lean){for(const r of O){if(lean>0){r.unshift(...Array(lean).fill(null));r.length=Wd}else{r.splice(0,-lean);while(r.length<Wd)r.push(null)}}}
 const c=document.createElement('canvas');c.width=Wd;c.height=H;const g=c.getContext('2d');for(let y=0;y<H;y++)for(let x=0;x<Wd;x++)if(O[y][x]){g.fillStyle=O[y][x];g.fillRect(x,y,1,1)}return c}
const LX=.5,LY=-.6;
function ellShade(nx,ny,n,bias=0){const nz=Math.sqrt(Math.max(0,1-nx*nx-ny*ny));const I=nx*LX+ny*LY+nz*.75+bias;return Math.max(0,Math.min(n-1,Math.round((I+.35)/1.45*(n-1))))}

// ---------- SLIME ----------
function slime(f,col,crystal){const Wd=44,H=44,OX=2,OY=6;const G=Array.from({length:H},()=>Array(Wd).fill(null)),marks=[];
 const P=(x,y,c)=>{x=Math.round(x)+OX;y=Math.round(y)+OY;if(c&&x>=0&&y>=0&&x<Wd&&y<H)G[y][x]=c};
 const R=[shade(col,-.6),shade(col,-.35),col,shade(col,.32),shade(col,.68)];
 const sq=f.bdy?1:0,st=(f.pose==='slash'||f.pose==='back')?1:0,face=f.face||'idle';
 const rx=11+sq-st,ry=8-sq+st*2,cx=20,cy=32-ry+1;
 // crystal shards (behind top)
 if(crystal){const sh=[[cx-5,cy-ry+2,4,8],[cx+1,cy-ry,3,11],[cx+6,cy-ry+3,3,7]];for(const[sx,sy,w,h]of sh)for(let y=0;y<h;y++){const ww=Math.max(1,Math.round(w*(y/h)));for(let x=-ww;x<=ww;x++)P(sx+x,sy-h+y+3,x<0?'#4aa8d8':(x===0?'#ffffff':'#c8f6ff'))}}
 for(let y=Math.floor(cy-ry);y<=32;y++)for(let x=Math.floor(cx-rx);x<=Math.ceil(cx+rx);x++){const nx=(x-cx)/rx,ny=(y-cy)/ry;if(nx*nx+ny*ny>1)continue;let l=ellShade(nx,ny,5);if(y>=31)l=Math.min(l,1);P(x,y,R[l])}
 // gloss
 P(cx-6,cy-4,R[4]);P(cx-5,cy-4,W);P(cx-5,cy-5,R[4]);P(cx-4,cy-5,R[4]);P(cx-7,cy-2,R[4]);
 if(crystal){for(const[x,y]of[[cx-8,cy+1],[cx+8,cy-1],[cx-2,cy+4]])P(x,y,'#ffffff')}
 // face
 const ex=cx+1,ey=cy-1;
 if(face==='hurt'){for(const[x,y]of[[ex,ey],[ex+1,ey+1],[ex,ey+2],[ex+6,ey],[ex+5,ey+1],[ex+6,ey+2]])P(x,y,K);P(ex+2,ey+4,K);P(ex+3,ey+3,K);P(ex+4,ey+4,K)}
 else{for(const bx of[ex,ex+5]){P(bx,ey,K);P(bx+1,ey,K);P(bx,ey+1,K);P(bx+1,ey+1,K);P(bx,ey+2,K);P(bx+1,ey+2,'#3a2a5a');P(bx,ey,W)}
  if(face==='angry'){P(ex-1,ey-1,K);P(ex,ey-1,K);P(ex+6,ey-1,K);P(ex+7,ey-1,K)}
  P(ex+2,ey+4,K);P(ex+3,ey+5,'#c4506a');P(ex+4,ey+4,K);P(ex-2,ey+3,'#ff9aaa');P(ex+8,ey+3,'#ff9aaa')}
 return render(G,marks,f.lean||0)}

// ---------- HUMANOID MOBS ----------
function mob(cfg,f){const Wd=44,H=44,OX=2,OY=6;const G=Array.from({length:H},()=>Array(Wd).fill(null)),marks=[];
 const p=Object.assign({},BP,cfg.pal),bd=f.bdy||0,pose=f.pose||'ready',face=f.face||'idle';
 const P=(x,y,c)=>{x=Math.round(x)+OX;y=Math.round(y)+OY;if(c&&x>=0&&y>=0&&x<Wd&&y<H)G[y][x]=c};
 const U=(x,y,c)=>P(x,y+bd,c);
 const line=(x0,y0,x1,y1,c,c2)=>{const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0))||1;for(let i=0;i<=n;i++){const x=x0+(x1-x0)*i/n,y=y0+(y1-y0)*i/n;U(x,y,c);if(c2)U(x,y+1,c2)}};
 const pts=(a,c)=>a.forEach(([x,y])=>U(x,y,c));
 const ell=(cx,cy,rx,ry,R,bias=0,clip)=>{for(let y=Math.floor(cy-ry);y<=Math.ceil(cy+ry);y++)for(let x=Math.floor(cx-rx);x<=Math.ceil(cx+rx);x++){const nx=(x-cx)/rx,ny=(y-cy)/ry;if(nx*nx+ny*ny>1||(clip&&!clip(x,y)))continue;U(x,y,R[ellShade(nx,ny,R.length,bias)])}};
 const S=p.skin,C=p.cloth,wk=cfg.weapon,wpn=(bx,by,dk,len)=>WEAP[wk]&&WEAP[wk](U,p,bx,by,dk,len);
 // cape
 if(cfg.cape){for(let y=21;y<=32;y++){const a=14-Math.floor((y-21)*.7),b=19;for(let x=a;x<=b;x++)U(x,y,x<=a+1?p.cape[0]:(x===a+4?p.cape[2]:p.cape[1]))}}
 if(pose==='back'&&wk&&wk!=='bow'&&wk!=='shield')wpn(13,15,'ul',cfg.big?11:9);
 // back ear (goblin)
 if(cfg.ears){pts([[8,12],[9,12],[10,13],[11,13],[9,13],[10,14],[11,14],[12,14]],S[1]);U(8,12,S[0])}
 // legs + feet
 const lg=cfg.robe?null:(cfg.bone?p.bone:p.leg);
 if(lg){for(let y=29;y<=31;y++){U(16,y,lg[1]);U(17,y,lg[2]);if(!cfg.bone)U(15,y,lg[0]);U(20,y,lg[2]);U(21,y,lg[3]);if(!cfg.bone)U(22,y,lg[1])}
  pts([[14,32],[15,32],[16,32],[17,32],[19,32],[20,32],[21,32],[22,32],[23,32]],p.boot||K);U(23,31,p.boot||K)}
 // torso
 if(cfg.robe){for(let y=21;y<=32;y++){const a=Math.round(15-(y-21)*.5),b=Math.round(24+(y-21)*.35);for(let x=a;x<=b;x++){const u=(x-a)/(b-a);U(x,y,C[Math.min(3,Math.floor(u*3.2))])}if(y===32)for(let x=a;x<=b;x+=3)U(x,y,C[0])}
  for(let y=23;y<=30;y++)U(21,y,p.trim)}
 else if(cfg.bone){for(let y=22;y<=28;y++)for(let x=16;x<=23;x++)U(x,y,'#2a2236');for(const y of[23,25,27])for(let x=16;x<=23;x++)U(x,y,p.bone[x>20?3:2]);for(let y=22;y<=28;y++)U(18,y,p.bone[1]);for(let x=16;x<=23;x++)U(x,29,p.bone[1])}
 else{for(let y=22;y<=29;y++){const a=y>27?14:15,b=y>27?25:24;for(let x=a;x<=b;x++){const u=(x-a)/(b-a);U(x,y,C[u<.2?0:u<.55?1:u<.85?2:3])}}for(let x=14;x<=25;x++)U(x,29,C[0]);
  if(!cfg.armor){for(let x=15;x<=24;x++)U(x,26,p.belt||p.wd2);U(21,26,p.y2)}else{pts([[17,23],[18,23],[19,23],[20,23],[21,23]],C[3]);U(19,25,p.emb||'#e0304e');U(20,25,p.emb||'#e0304e')}
  if(cfg.ragged)for(let x=14;x<=25;x+=2)U(x,30,C[0])}
 // shoulders
 if(cfg.armor){ell(14.5,22.5,2.6,2,C,.2);ell(24,22,2,1.6,C)}
 // ---- head ----
 const hcx=20,hcy=14;
 if(cfg.head==='skull'){ell(hcx,hcy,8.5,8,p.bone,.1);for(let x=17;x<=25;x++)U(x,21,p.bone[1]);
  pts([[19,13],[20,13],[19,14],[20,14],[24,13],[25,13],[24,14],[25,14]],K);U(20,14,'#ff4f6a');U(25,14,'#ff4f6a');pts([[26,16],[26,17]],K);
  for(let x=19;x<=26;x++){U(x,19,x%2?K:p.bone[3]);U(x,20,x%2?p.bone[2]:K)}if(face==='hurt'){pts([[19,13],[20,14],[24,14],[25,13]],p.bone[2])}}
 else if(cfg.head==='hood'){ell(hcx-1,hcy-1,10,9.5,C,.15);ell(hcx+3,hcy+2,4.6,4.2,['#120a1e','#1a1028','#241638']);for(let i=0;i<5;i++)U(11-i,6+i*.6,C[i<3?1:0]);
  const gl=face==='hurt'?'#7a4a7a':'#ff6fa8';U(22,16,gl);U(26,16,gl);if(face!=='hurt'){U(22,15,'#ffd0e6');U(26,15,'#ffd0e6');marks.push([25+OX,27+OY+bd,'#ff6fa8'])}}
 else if(cfg.head==='helm'){ell(hcx,hcy,9,8.5,C,.15);for(let x=19;x<=29;x++){U(x,15,K);U(x,16,K)}const gl=face==='hurt'?'#8a2a3a':'#ff3b4f';U(23,15,gl);U(24,15,gl);U(27,15,gl);U(28,15,'#ffb0bc');
  for(let y=7;y<=21;y++)U(20,y,C[3]);pts([[13,10],[13,11],[13,12]],C[0]);
  if(cfg.horns){for(let i=0;i<6;i++){U(13-i*.6,7-i,i<4?'#e8e2cc':'#fffdf0');U(14-i*.6,7-i,'#bdb49a')}for(let i=0;i<5;i++){U(25+i*.5,6-i,'#e8e2cc');U(26+i*.5,6-i,'#bdb49a')}}
  if(cfg.plume){for(let i=0;i<7;i++){U(18-i,5-i*.4,p.cape[2]);U(18-i,6-i*.4,p.cape[1])}}}
 else{// goblin
  ell(hcx,hcy,9,8,S,.1);
  // ears front
  if(cfg.ears)pts([[29,11],[30,10],[31,9],[32,9],[29,12],[30,11],[31,10],[29,13],[30,12]],S[2]),U(32,9,S[3]),U(30,12,'#ff9aaa');
  // nose
  pts([[29,16],[30,16],[29,17],[30,17],[31,17]],S[2]);U(31,17,S[1]);
  // eyes
  if(face==='hurt'){pts([[21,13],[22,14],[21,15],[26,13],[25,14],[26,15]],K)}
  else{pts([[21,14],[22,14],[21,15],[22,15],[25,14],[26,14],[25,15],[26,15]],'#ffd23f');U(22,15,K);U(26,15,K);U(21,14,'#fff6b0');pts([[20,12],[21,12],[22,13],[24,13],[25,12],[26,12]],S[0])}
  // grin
  for(let x=21;x<=27;x++)U(x,19,K);U(22,18,K);U(27,18,K);U(23,19,W);U(26,19,W);if(face!=='hurt')U(24,20,'#c4506a');
  // hair tuft
  pts([[16,6],[17,5],[18,6],[19,5],[20,6]],p.hair||'#3a2a1a')}
 // ---- head gear ----
 if(cfg.crown){const cr=[[16,4],[17,4],[18,4],[19,4],[20,4],[21,4],[22,4],[23,4],[16,3],[19,3],[20,3],[23,3],[16,2],[19.5,1],[23,2]];cr.forEach(([x,y],i)=>U(x,y,i<8?(x>20?p.y1:p.y2):p.y1));U(19,4,'#e0304e');U(20,4,'#ff8fa0');U(22,4,'#4268e0')}
 if(cfg.hoodGob){ell(hcx-2,hcy-3,9,6,cfg.hoodGob,.2,(x,y)=>y<hcy-1||x<hcx-3);for(let i=0;i<4;i++)U(10-i,9+i*.5,cfg.hoodGob[1])}
 // ---- arms + weapon ----
 const armC=cfg.bone?p.bone[2]:(cfg.armor?C[2]:(cfg.robe?C[2]:S[2])),handC=cfg.bone?p.bone[3]:(cfg.armor?C[3]:S[2]);
 const hand=(x,y)=>{pts([[x,y],[x+1,y],[x,y+1],[x+1,y+1]],handC);U(x,y+1,cfg.bone?p.bone[1]:(cfg.armor?C[1]:S[1]))};
 const arm=(x0,y0,x1,y1)=>line(x0,y0,x1,y1,armC,cfg.bone?null:(cfg.armor?C[1]:(cfg.robe?C[1]:S[1])));
 if(wk==='bow'){const bow=(cx,y0,y1,dx)=>{const n=y1-y0;for(let i=0;i<=n;i++){const t=i/n,x=cx+Math.round(Math.sin(t*Math.PI)*3);U(x,y0+i,p.wd1);U(x+1,y0+i,p.wd2)}const mid=Math.round((y0+y1)/2);if(dx!==undefined){line(cx,y0,dx,mid,'#efe8ff');line(dx,mid,cx,y1,'#efe8ff')}else for(let y=y0+1;y<y1;y++)U(cx,y,'#efe8ff')};
  if(pose==='back'){bow(26,14,30,19);arm(16,22,24,22);hand(25,21);line(19,22,32,22,p.wd2);pts([[32,21],[33,22],[32,23]],p.bl2)}
  else if(pose==='slash'){bow(26,14,30);arm(16,22,24,22);hand(25,21)}
  else{bow(24,15,31);arm(16,23,22,23);hand(22,22)}}
 else if(wk==='shield'){const sh=(x0,y0)=>{const Rr=[[1,6],[0,7],[0,7],[0,7],[0,7],[0,7],[1,6],[2,5],[3,4]];Rr.forEach(([a,b],r)=>{for(let x=a;x<=b;x++)U(x0+x,y0+r,x===a||x===b||r===0||r===8?C[0]:(x<a+2?C[1]:C[2]))});for(let r=2;r<=6;r++)U(x0+4,y0+r,p.emb);for(let x=2;x<=6;x++)U(x0+x,y0+4,p.emb);U(x0+4,y0+4,p.y2)};
  if(pose==='slash'){arm(16,22,24,22);sh(25,18)}else if(pose==='back'){arm(16,23,18,24);sh(18,20)}else{arm(16,23,20,24);sh(21,19)}}
 else if(wk){
  if(pose==='ready'){wpn(24,24,'ur',cfg.big?10:8);arm(17,24,21,24);hand(22,23)}
  if(pose==='back'){line(16,22,15,19,armC);hand(14,16)}
  if(pose==='slash'){arm(16,22,21,22);wpn(24,22,'r',cfg.big?11:9);hand(22,22)}}
 if(cfg.robe&&f.spark){for(const[x,y]of[[29,8],[33,18],[9,20]])marks.push([x+OX,y+OY,'#ff6fa8'],[x+OX,y+OY-1,'#ffd0e6'])}
 return render(G,marks,f.lean||0)}

// look datang dari data/enemies.js: {slime:true,crystal?,color?} atau cfg generator mob
function draw(type,el,f={},elColor){const L=ENEMY[type].look;if(L.slime)return slime(f,L.color||elColor||'#7cc35a',!!L.crystal);return mob(L,f)}
return{draw};
})();
const ENE_ANIMS={
 idle:[{d:420,f:{}},{d:420,f:{bdy:1}}],
 attack:[{d:220,f:{pose:'back',face:'angry',lean:-1}},{d:140,f:{pose:'slash',face:'angry',lean:3}},{d:220,f:{pose:'slash',face:'angry',lean:1}}],
 hit:[{d:140,f:{face:'hurt',lean:-2}},{d:240,f:{face:'hurt',lean:-1}}],
 skill:[{d:300,f:{pose:'back',face:'angry',bdy:1,spark:1}},{d:200,f:{pose:'slash',face:'angry',lean:4,spark:1}},{d:300,f:{pose:'slash',face:'angry',lean:2}}]
};

const ECACHE={};function enemyFrame(t,el,f={}){const k=t+'|'+el+JSON.stringify(f);if(ECACHE[k])return ECACHE[k];const c=ENE.draw(t,el,f,EL[el]?EL[el].c:null);const w=document.createElement('canvas');w.width=c.width;w.height=c.height;const wg=w.getContext('2d');wg.drawImage(c,0,0);wg.globalCompositeOperation='source-in';wg.fillStyle='#fff';wg.fillRect(0,0,c.width,c.height);return ECACHE[k]={c,w,url:c.toDataURL()}}
