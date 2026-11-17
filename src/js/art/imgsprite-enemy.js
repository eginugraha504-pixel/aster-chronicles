/* Musuh berbasis strip gambar (lihat art/imgsprite.js). Dimuat SETELAH art/enemies.js.
   Slime biasa digambar pucat lalu diwarnai sesuai elemen (multiply), jadi tetap 1 gambar untuk semua elemen. */
/* logam (mis. slime emas): kecerahan tiap piksel dipetakan ke gradasi logam -> berkilau, bukan sekadar diwarnai.
   crown: mahkota kecil di atas kepala (bos). Hasil di-cache per bingkai. */
const METAL={gold:[[0,[58,30,0]],[.3,[150,88,10]],[.55,[240,160,24]],[.78,[255,214,74]],[1,[255,250,214]]]};
const METAL_C={};
function metalize(src,key,kind,crown){const ck=key+kind+(crown?'c':'');if(METAL_C[ck])return METAL_C[ck];
 const c=document.createElement('canvas');c.width=src.width;c.height=src.height;const g=c.getContext('2d');g.drawImage(src,0,0);
 const d=g.getImageData(0,0,c.width,c.height),a=d.data,G=METAL[kind]||METAL.gold;let lo=255,hi=0;
 for(let k=0;k<a.length;k+=4)if(a[k+3]>40){const l=.3*a[k]+.59*a[k+1]+.11*a[k+2];lo=Math.min(lo,l);hi=Math.max(hi,l)}
 for(let k=0;k<a.length;k+=4){if(!a[k+3])continue;const t=Math.max(0,Math.min(1,((.3*a[k]+.59*a[k+1]+.11*a[k+2])-lo)/Math.max(1,hi-lo)));
  let j=1;while(j<G.length-1&&t>G[j][0])j++;const[t0,c0]=G[j-1],[t1,c1]=G[j],u=(t-t0)/Math.max(1e-6,t1-t0);for(let q=0;q<3;q++)a[k+q]=Math.round(c0[q]+(c1[q]-c0[q])*u)}
 g.putImageData(d,0,0);
 if(crown){let top=c.height,cx=0,n=0;for(let y=0;y<c.height&&top===c.height;y++)for(let x=0;x<c.width;x++)if(a[(y*c.width+x)*4+3]>40){top=y;cx+=x;n++}cx=Math.round(cx/Math.max(1,n));
  const P=(x,y,col)=>{g.fillStyle=col;g.fillRect(cx+x,top+y,1,1)};const Y=-5;
  for(let x=-5;x<=5;x++){P(x,Y+3,'#7a3a00');P(x,Y+4,'#ffcf3a');P(x,Y+5,'#a85a0a')}for(const px of[-5,0,5]){P(px,Y,'#ffe27a');P(px,Y+1,'#ffcf3a');P(px,Y+2,'#ffcf3a')}
  for(const px of[-3,3]){P(px,Y+1,'#ffcf3a');P(px,Y+2,'#ffcf3a')}P(0,Y+4,'#ff3b5c');P(-3,Y+4,'#3fa9f5');P(3,Y+4,'#3fa9f5')}
 return METAL_C[ck]=c}
(function(){const draw0=ENE.draw;
 ENE.draw=function(type,el,f,elColor){const key='e_'+((ENEMY[type]&&ENEMY[type].sprOf)||type);if(!hasSpr(key))return draw0(type,el,f,elColor);
  const ff=f||{};let i=sprIdx(ff);if(ff.spark&&ff.pose==='back')i=7;
  const src=sprCanvas(key,i);if(!src)return draw0(type,el,f,elColor);
  const L=ENEMY[type].look||{};if(L.metal)return metalize(src,key+':'+i,L.metal,L.crown);
  const tint=L.slime&&!L.crystal?(L.color||elColor):null;if(!tint)return src;
  const c=document.createElement('canvas');c.width=c.height=SPR_FW;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
  g.drawImage(src,0,0);g.globalCompositeOperation='multiply';g.fillStyle=tint;g.fillRect(0,0,SPR_FW,SPR_FW);
  g.globalCompositeOperation='destination-in';g.drawImage(src,0,0);
  g.globalCompositeOperation='source-over';g.globalAlpha=.35;g.drawImage(src,0,0);return c}})();
