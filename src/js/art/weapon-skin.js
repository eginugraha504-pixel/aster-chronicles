/* ---- equipped-weapon skins for hero sprites ---- */
let CUR_WPN=null;
const WDIRS={d:{d:[0,1],L:[1,0],S:[-1,0],w:[1,0]},u:{d:[0,-1],L:[-1,0],S:[1,0],w:[1,0]},r:{d:[1,0],L:[0,-1],S:[0,1],w:[0,1]},ur:{d:[1,-1],L:[-1,0],S:[1,0],w:[1,1]},ul:{d:[-1,-1],L:[1,0],S:[-1,0],w:[1,-1]},dr:{d:[1,1],L:[1,0],S:[-1,0],w:[1,-1]}};
function paintPalSword(U,bx,by,dk,len,tw){const w=CUR_WPN,[m,t,gm]=[w.pal.m,w.pal.t,w.pal.g],D=WDIRS[dk]||WDIRS.u,[dx,dy]=D.d,[wx,wy]=D.w,r=w.r;
 for(let u=1;u<=len+1;u++){const cx=bx+dx*u,cy=by+dy*u;if(u===len+1){U(cx,cy,m[3]);continue}
  if(u===len){U(cx,cy,m[2]);U(cx+D.L[0],cy+D.L[1],m[3]);continue}
  U(cx+D.L[0],cy+D.L[1],(tw!==undefined&&tw===u)?'#fff6b0':m[3]);U(cx,cy,(r>=2&&u>=2&&u<len-1)?gm[2]:m[2]);U(cx+D.S[0],cy+D.S[1],m[1])}
 const gw=r>=2?3:2;for(const sg of[1,-1])for(let k=1;k<=gw;k++)U(bx+wx*k*sg,by+wy*k*sg,k===gw?t[0]:(k===1?t[2]:t[1]));
 if(r>=2){for(const sg of[1,-1])U(bx+wx*gw*sg+dx,by+wy*gw*sg+dy,t[1])}
 U(bx,by,r>=2?gm[1]:t[1]);U(bx-dx,by-dy,'#4a2c3a');U(bx-dx*2,by-dy*2,r>=2?gm[1]:t[1])}
// def = nama modul pemanggil; null -> pakai lukisan bawaan modul itu
function swordPainter(def){const w=CUR_WPN;if(!w||w.cls!=='sword'||w.art===def)return null;if(w.art&&ART_MODULES[w.art]&&ART_MODULES[w.art].paintW)return ART_MODULES[w.art].paintW;return paintPalSword}
function wpnPal(p,cls){const w=CUR_WPN;if(!w||!w.pal||w.cls!==cls)return p;const[m,t,gm]=[w.pal.m,w.pal.t,w.pal.g],q=Object.assign({},p,{wr:w.r,wg:gm,wt:t,wm:m});
 if(cls==='axe')Object.assign(q,{wd1:t[2],wd2:t[1],wd3:t[0],L2:m[2],L3:m[1],W:m[3]});
 if(cls==='staff')Object.assign(q,{wd1:m[2],wd2:m[1],y2:t[1],a2:gm[1],a3:gm[0],W:gm[2]});
 if(cls==='bow')Object.assign(q,{wd1:m[2],wd2:m[1],y2:t[1]});
 if(cls==='shield')Object.assign(q,{m1:m[2],m2:m[1],m4:t[0],c2:w.r>=2?t[1]:m[0],y2:gm[1]});
 return q}
