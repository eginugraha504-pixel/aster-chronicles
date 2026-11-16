/* =====================================================================
   PENAMPIL SPLASH ART layar penuh (ketuk panggung hero di detail hero)
   ===================================================================== */
function openSplash(id){const h=HD[id];if(!splash(id))return;let v=$('#splv');if(!v){v=document.createElement('div');v.id='splv';$('#modal').insertAdjacentElement('afterend',v)}
 v.style.setProperty('--ec',EL[h.el].c);
 v.innerHTML=`<div class="svbg" data-act="splClose"></div><div class="rays"></div>${splashHTML(id,'big')}<div class="svtx"><span class="stars">${stars(h.r)}</span><b>${h.name}</b><small>${h.title}</small><span class="tag">${eic(h.el,12)}${EL[h.el].n} · ${ROLE[h.role].n}</span></div><div class="skiptxt">${T('Ketuk untuk tutup')}</div>`;
 v.classList.remove('on');void v.offsetWidth;v.classList.add('on');sfx('open')}
function closeSplash(){const v=$('#splv');if(v){v.classList.remove('on');v.innerHTML=''}}
Object.assign(ACT,{splView:id=>openSplash(id),splClose:()=>closeSplash()});
