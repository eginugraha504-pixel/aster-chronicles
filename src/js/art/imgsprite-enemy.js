/* Musuh berbasis strip gambar (lihat art/imgsprite.js). Dimuat SETELAH art/enemies.js.
   Slime biasa digambar pucat lalu diwarnai sesuai elemen (multiply), jadi tetap 1 gambar untuk semua elemen. */
(function(){const draw0=ENE.draw;
 ENE.draw=function(type,el,f,elColor){const key='e_'+type;if(!hasSpr(key))return draw0(type,el,f,elColor);
  const ff=f||{};let i=sprIdx(ff);if(ff.spark&&ff.pose==='back')i=7;
  const src=sprCanvas(key,i);if(!src)return draw0(type,el,f,elColor);
  const L=ENEMY[type].look||{};const tint=L.slime&&!L.crystal?(L.color||elColor):null;if(!tint)return src;
  const c=document.createElement('canvas');c.width=c.height=SPR_FW;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
  g.drawImage(src,0,0);g.globalCompositeOperation='multiply';g.fillStyle=tint;g.fillRect(0,0,SPR_FW,SPR_FW);
  g.globalCompositeOperation='destination-in';g.drawImage(src,0,0);
  g.globalCompositeOperation='source-over';g.globalAlpha=.35;g.drawImage(src,0,0);return c}})();
