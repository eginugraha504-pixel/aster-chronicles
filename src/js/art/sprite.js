/* sprite({hero:id,f,base}) | sprite({enemy:type,el,f}) -> {c,w,url} (kanvas, siluet putih, dataURL) */
function sprite(o){
 if(o.hero)return artFrame(o.hero,o.f||{},o.base?'__def':undefined);
 if(o.enemy)return enemyFrame(o.enemy,o.el,o.f||{});
 throw new Error('sprite(): butuh {hero} atau {enemy}')}
