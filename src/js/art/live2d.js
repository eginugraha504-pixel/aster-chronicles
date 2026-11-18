/* =====================================================================
   LIVE2D-STYLE — splash hidup untuk hero ★3 (Sakuya, Raika, Marisa, Hilde, Celestine, Aurelia, Lilith, Coppelia)
   ---------------------------------------------------------------------
   Satu gambar splash HD dilenturkan per piksel oleh shader WebGL:
     napas (dada + badan atas), rambut & kain bergelombang, kedip 3 tahap,
     kilau senjata (sheen) dan efek cahaya berkedip (glow).
   Aset per hero (tools/build.py -> RIG_SRC):
     src/img/rig/<hero>_mask.png  R=bobot rambut, G=bobot kain, B=efek cahaya (½ resolusi)
     src/img/rig/<hero>_eyes.png  atlas [setengah | tertutup] untuk kotak mata RIG[hero].eye
   Cara pakai: splashHTML() memberi data-live pada .spw milik hero yang punya rig;
   loop di sini mencari elemen itu, membuat <canvas class="spl live"> pengganti <img>,
   lalu menggambar lewat SATU konteks WebGL bersama (30 fps, hanya yang terlihat).
   Tanpa WebGL / prefers-reduced-motion: gambar diam biasa tetap dipakai.
   Koordinat di RIG = piksel gambar splash (tinggi 1100).
   ===================================================================== */
const RIG={
 sakuya:{eye:[404,146,116,60],head:[465,140],chest:[450,300],waist:520,breast:280,
  sheen:null,glow:1,mote:'255,170,205'},
 raika:{eye:[360,133,102,61],head:[415,150],chest:[420,300],waist:470,breast:260,
  sheen:null,glow:2,mote:'150,235,255'},
 marisa:{eye:[373,226,114,71],head:[425,245],chest:[450,380],waist:540,breast:340,
  sheen:[[548,430],[652,165],10,7],glow:1,mote:'170,240,255'},
 hilde:{eye:[417,200,132,63],head:[483,232],chest:[515,385],waist:520,breast:360,
  sheen:[[785,228],[300,82],12,15],glow:1,mote:'255,200,110'},
 celestine:{eye:[403,109,116,81],head:[460,150],chest:[465,285],waist:430,breast:270,
  sheen:[[575,250],[790,600],34,34],glow:1,mote:'255,240,190'},
 aurelia:{eye:[388,146,108,74],head:[430,175],chest:[425,300],waist:420,breast:285,
  sheen:[[300,212],[830,206],5,7],glow:1,mote:'255,170,90'},
 lilith:{eye:[406,97,122,75],head:[460,140],chest:[460,265],waist:400,breast:255,
  sheen:[[548,150],[700,620],7,7],glow:1,mote:'215,150,255'},
 coppelia:{eye:[373,179,104,74],head:[420,225],chest:[465,340],waist:440,breast:320,sheen:[[320,15],[690,175],30,28],glow:1,mote:'130,240,225'},
};
const L2D={gl:null,cv:null,prog:null,U:{},tex:{},ok:null,last:0,inst:new WeakMap(),q:1,avg:0,n:0};  // q: skala resolusi adaptif (turun bila perangkat lambat)
const hasRig=id=>!!(RIG[id]&&typeof RIG_SRC!=='undefined'&&RIG_SRC[id+'_mask']&&RIG_SRC[id+'_eyes']);
const L2D_VS='attribute vec2 a;varying vec2 v;void main(){v=vec2(a.x*.5+.5,.5-a.y*.5);gl_Position=vec4(a,0.,1.);}';
const L2D_FS=`precision highp float;varying vec2 v;
uniform sampler2D uBase,uMask,uEye;uniform vec2 uSize;uniform float uT,uB,uBlink,uGlow;
uniform vec4 uEyeBox,uSheen,uSheenW;uniform vec2 uHead,uChest;uniform vec2 uBody;
uniform sampler2D uMouth,uEx;uniform vec4 uMouthBox,uExBox;uniform float uTalk,uExOn;uniform vec2 uAmp;uniform vec3 uNeck;
void main(){
 vec2 px=v*uSize;vec4 m=texture2D(uMask,v);float side=px.x>uHead.x?1.:-1.;
 float ph=uT*1.7-px.y*.011+side*.9;
 float w1=sin(ph)*.7+sin(uT*1.03-px.y*.0064+2.1)*.3;
 vec2 D=vec2(w1*8.5,cos(ph)*2.)*m.r*uAmp.x;
 float pc=uT*1.25-px.x*.0083;
 D+=vec2(sin(pc)*7.+sin(uT*.7+px.y*.005)*2.4,sin(pc+1.2)*3.5)*m.g*uAmp.y;
 float up=smoothstep(uBody.x,uBody.y,px.y);
 D+=vec2(sin(uT*.55)*1.3*up,-uB*2.5*up);
 vec2 r=px-uChest;D+=r*.013*uB*exp(-dot(r,r)/24000.);
 if(uNeck.z!=0.){float hw=smoothstep(uNeck.y+40.,uNeck.y-60.,px.y);float an=(sin(uT*.83)*.75+sin(uT*.37+1.3)*.25)*uNeck.z*hw;vec2 q=px-uNeck.xy;D+=vec2(-an*q.y,an*q.x);}
 vec2 src=px-D;vec2 uv=src/uSize;
 vec4 col=texture2D(uBase,uv);
 if(uv.x<0.||uv.y<0.||uv.x>1.||uv.y>1.)col=vec4(0.);
 if(uExOn>.5){vec2 e=(src-uExBox.xy)/uExBox.zw;if(e.x>=0.&&e.y>=0.&&e.x<=1.&&e.y<=1.){vec4 ec=texture2D(uEx,e);col=col*(1.-ec.a)+ec;}}
 if(uTalk>.5&&uExOn<.5){vec2 e=(src-uMouthBox.xy)/uMouthBox.zw;if(e.x>=0.&&e.y>=0.&&e.x<=1.&&e.y<=1.){vec4 ec=texture2D(uMouth,e);col=col*(1.-ec.a)+ec;}}
 if(uBlink>.5&&uExOn<.5){vec2 e=(src-uEyeBox.xy)/uEyeBox.zw;
  if(e.x>=0.&&e.y>=0.&&e.x<=1.&&e.y<=1.){vec4 ec=texture2D(uEye,vec2((clamp(e.x,.004,.996)+(uBlink>1.5?1.:0.))*.5,e.y));col=col*(1.-ec.a)+ec;}}
 if(uSheenW.x>0.){vec2 a=uSheen.xy,ab=uSheen.zw-uSheen.xy;float t=clamp(dot(src-a,ab)/dot(ab,ab),0.,1.);float dd=length(src-(a+ab*t));
  float hw=mix(uSheenW.x,uSheenW.y,t);if(dd<hw){float u=fract(uT/3.6)*1.7-.35;float s=exp(-pow((t-u)/.07,2.))*.6*(1.-dd/hw*.6);col.rgb+=vec3(1.,.96,.82)*s*col.a;}}
 float g=texture2D(uMask,uv).b;
 if(g>.01){float f=uGlow>1.5?max(0.,sin(uT*21.)*sin(uT*7.3+src.y*.03))*.9+max(0.,sin(uT*3.1))*.25:(.5+.5*sin(uT*3.2+src.y*.025+src.x*.01))*.45;
  col.rgb+=col.rgb*g*f;}
 gl_FragColor=col;}`;
function l2dInit(){if(L2D.ok!==null)return L2D.ok;L2D.ok=false;
 try{if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return false;
  const cv=document.createElement('canvas');cv.width=8;cv.height=8;
  const gl=cv.getContext('webgl',{premultipliedAlpha:true,alpha:true,antialias:false,preserveDrawingBuffer:true});if(!gl)return false;
  const sh=(t,s)=>{const o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);if(!gl.getShaderParameter(o,gl.COMPILE_STATUS))throw gl.getShaderInfoLog(o);return o};
  const P=gl.createProgram();gl.attachShader(P,sh(gl.VERTEX_SHADER,L2D_VS));gl.attachShader(P,sh(gl.FRAGMENT_SHADER,L2D_FS));gl.linkProgram(P);
  if(!gl.getProgramParameter(P,gl.LINK_STATUS))return false;gl.useProgram(P);
  const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  const al=gl.getAttribLocation(P,'a');gl.enableVertexAttribArray(al);gl.vertexAttribPointer(al,2,gl.FLOAT,false,0,0);
  for(const n of['uBase','uMask','uEye','uSize','uT','uB','uBlink','uGlow','uEyeBox','uSheen','uSheenW','uHead','uChest','uBody','uMouth','uEx','uMouthBox','uExBox','uTalk','uExOn','uAmp','uNeck'])L2D.U[n]=gl.getUniformLocation(P,n);
  gl.uniform1i(L2D.U.uBase,0);gl.uniform1i(L2D.U.uMask,1);gl.uniform1i(L2D.U.uEye,2);gl.uniform1i(L2D.U.uMouth,3);gl.uniform1i(L2D.U.uEx,4);
  cv.addEventListener('webglcontextlost',e=>{e.preventDefault();L2D.ok=false});
  Object.assign(L2D,{gl,cv,prog:P});return L2D.ok=true}catch(e){return L2D.ok=false}}
function l2dImg(src){return new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src=src})}
function l2dTex(img,pm){const gl=L2D.gl,t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,pm);
 gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);
 for(const p of[gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,p,gl.CLAMP_TO_EDGE);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);return t}
// tekstur per hero, dimuat sekali
function l2dHero(id){if(L2D.tex[id])return L2D.tex[id];
 L2D.tex[id]={ready:false};Promise.all([l2dImg(splash(id)),l2dImg(RIG_SRC[id+'_mask']),l2dImg(RIG_SRC[id+'_eyes'])]).then(([b,m,e])=>{
  if(!b||!m||!e||!L2D.ok)return;Object.assign(L2D.tex[id],{base:l2dTex(b,true),mask:l2dTex(m,false),eyes:l2dTex(e,true),W:b.naturalWidth,H:b.naturalHeight,ready:true})});
 return L2D.tex[id]}
// kedip: buka -> setengah -> tutup -> setengah -> buka, jeda acak 2,5–6 dtk, kadang dua kali
function l2dBlink(st,t){if(t>st.nb){const seq=[[1,.045],[2,.075],[1,.05],[0,0]];let at=t;const q=[];const add=()=>{for(const[s,d]of seq){q.push([at,s]);at+=d}};add();if(Math.random()<.2){at+=.12;add()}st.q=q;st.nb=at+2.5+Math.random()*3.5}
 while(st.q&&st.q.length&&st.q[0][0]<=t)st.bl=st.q.shift()[1];return st.bl||0}
function l2dDraw(el,id,t){const tx=l2dHero(id);if(!tx.ready)return;const gl=L2D.gl,U=L2D.U,R=RIG[id];
 let st=L2D.inst.get(el);
 if(!st){const img=el.querySelector('img.spl');if(!img)return;const c=document.createElement('canvas');c.className='spl live';c.width=tx.W;c.height=tx.H;
  img.after(c);img.style.display='none';st={c,g:c.getContext('2d'),nb:t+.8+Math.random()*2,q:null,bl:0,ph:Math.random()*6,motes:Array.from({length:9},()=>({x:Math.random(),y:Math.random(),v:.02+Math.random()*.03,p:Math.random()*6.3,r:.6+Math.random()}))};L2D.inst.set(el,st)}
 const c=st.c,rc=c.getBoundingClientRect();if(rc.width<4||rc.bottom<0||rc.top>innerHeight||rc.right<0||rc.left>innerWidth)return;
 const dpr=Math.min(2,devicePixelRatio||1),sc=Math.min(1,Math.max(rc.width/tx.W,rc.height/tx.H)*dpr*L2D.q),w=Math.max(16,Math.round(tx.W*sc)),h=Math.max(16,Math.round(tx.H*sc));
 if(Math.abs(c.width-w)>w*.08){c.width=w;c.height=h}
 const W2=c.width,H2=c.height;if(L2D.cv.width<W2||L2D.cv.height<H2){L2D.cv.width=Math.max(W2,L2D.cv.width);L2D.cv.height=Math.max(H2,L2D.cv.height)}
 const tt=t+st.ph,B=.5-.5*Math.cos(tt*2*Math.PI/4.2);
 gl.viewport(0,0,W2,H2);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
 gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tx.base);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,tx.mask);gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,tx.eyes);
 gl.uniform2f(U.uSize,tx.W,tx.H);gl.uniform1f(U.uT,tt);gl.uniform1f(U.uB,B);gl.uniform1f(U.uBlink,l2dBlink(st,t));gl.uniform1f(U.uGlow,R.glow);
 gl.uniform1f(U.uTalk,0);gl.uniform1f(U.uExOn,0);gl.uniform2f(U.uAmp,1,1);gl.uniform3f(U.uNeck,0,0,0);
 gl.uniform4f(U.uEyeBox,...R.eye);gl.uniform2f(U.uHead,...R.head);gl.uniform2f(U.uChest,...R.chest);gl.uniform2f(U.uBody,R.waist,R.breast);
 if(R.sheen){gl.uniform4f(U.uSheen,...R.sheen[0],...R.sheen[1]);gl.uniform4f(U.uSheenW,R.sheen[2],R.sheen[3],0,0)}else gl.uniform4f(U.uSheenW,0,0,0,0);
 gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
 const g=st.g;g.clearRect(0,0,W2,H2);g.drawImage(L2D.cv,0,L2D.cv.height-H2,W2,H2,0,0,W2,H2);
 // partikel cahaya halus di sekitar karakter
 g.globalCompositeOperation='lighter';const dt=1/30;
 for(const m of st.motes){m.y-=m.v*dt;if(m.y<-.02){m.y=1.02;m.x=Math.random()}const a=.35+.35*Math.sin(tt*2.3+m.p),X=m.x*W2,Y=m.y*H2,rr=m.r*W2*.012;
  const gr=g.createRadialGradient(X,Y,0,X,Y,rr*3);gr.addColorStop(0,`rgba(${R.mote},${a})`);gr.addColorStop(1,`rgba(${R.mote},0)`);g.fillStyle=gr;g.fillRect(X-rr*3,Y-rr*3,rr*6,rr*6)}
 g.globalCompositeOperation='source-over'}
function l2dLoop(now){requestAnimationFrame(l2dLoop);if(document.hidden||now-L2D.last<33)return;L2D.last=now;
 const els=document.querySelectorAll('.spw[data-live]'),ses=document.querySelectorAll('#story .sch[data-l2d]');if(!(els.length||ses.length)||!l2dInit())return;const t=now/1000;
 const t0=performance.now();for(const el of els){try{l2dDraw(el,el.dataset.live,t)}catch(e){}}for(const el of ses){try{l2dStory(el,el.dataset.l2d,t)}catch(e){}}
 // pengaman HP lemah: rata-rata waktu gambar > 14 ms -> turunkan resolusi (min 45%), < 5 ms -> naikkan lagi
 L2D.avg=L2D.avg*.9+(performance.now()-t0)*.1;if(++L2D.n%30===0){if(L2D.avg>14&&L2D.q>.45)L2D.q=Math.max(.45,L2D.q*.8);else if(L2D.avg<5&&L2D.q<1)L2D.q=Math.min(1,L2D.q*1.15)}}
requestAnimationFrame(l2dLoop);

/* ---------- tokoh CERITA (tachie berdiri / NPC) — sama dengan splash hidup + mulut bicara & ekspresi ----------
   Aset per tokoh (story/tc/, lihat art_src/tachie): <id>.webp (NPC: story/npc/<id>.webp), <id>_r (masker rambut/kain),
   <id>_e (atlas kedip), <id>_m (mulut terbuka), <id>_a|k|d (ekspresi). Geometri: STORY_ASSET.tc[id]. */
const L2T={tex:{},zero:null};
function l2dZero(){if(L2T.zero)return L2T.zero;const gl=L2D.gl,t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([0,0,0,0]));return L2T.zero=t}
function l2dTC(id){if(L2T.tex[id])return L2T.tex[id];const R=STORY_ASSET.tc[id],o=L2T.tex[id]={ready:false,ex:{},want:new Set()};
 const has=p=>typeof stHas!=='function'||stHas(p),u=p=>has(p)?l2dImg(stUrl(p)):Promise.resolve(null);
 Promise.all([l2dImg(stUrl((R.npc?'npc/':'tc/')+id)),u('tc/'+id+'_r'),u('tc/'+id+'_e'),u('tc/'+id+'_m')]).then(([b,m,e,mo])=>{
  if(!b||!L2D.ok)return;try{Object.assign(o,{base:l2dTex(b,true),mask:m?l2dTex(m,false):l2dZero(),eyes:e?l2dTex(e,true):null,mouth:mo?l2dTex(mo,true):null,W:b.naturalWidth,H:b.naturalHeight,ready:true})}catch(x){return}  // mis. file:// (lintas-asal): tetap gambar diam
  for(const e of o.want)l2dTCEx(id,e)});
 return o}
// tekstur ekspresi dimuat saat diminta (atau dipesan lebih dulu oleh storyPreload)
function l2dTCEx(id,e){const o=l2dTC(id);if(!o.ready){o.want.add(e);return null}if(o.ex[e]!==undefined)return o.ex[e];o.ex[e]=null;
 l2dImg(stUrl('tc/'+id+'_'+e)).then(i=>{if(i&&L2D.ok)try{o.ex[e]=l2dTex(i,true)}catch(x){}});return null}
function l2dStory(el,id,t){const R=STORY_ASSET.tc&&STORY_ASSET.tc[id];if(!R)return;const tx=l2dTC(id);if(!tx.ready)return;const gl=L2D.gl,U=L2D.U;
 let st=L2D.inst.get(el);
 if(!st){const img=el.querySelector('img.sbase');if(!img)return;const c=document.createElement('canvas');c.className='sbase live';c.width=tx.W;c.height=tx.H;
  img.after(c);el.classList.add('live');st={c,g:c.getContext('2d'),nb:t+.6+Math.random()*1.5,q:null,bl:0,ph:Math.random()*6,mo:0,mt:0};L2D.inst.set(el,st)}
 const c=st.c,rc=c.getBoundingClientRect();if(rc.width<4||rc.bottom<0||rc.top>innerHeight)return;
 const dpr=Math.min(2,devicePixelRatio||1),sc=Math.min(1,rc.height/tx.H*dpr*L2D.q),w=Math.max(16,Math.round(tx.W*sc)),h=Math.max(16,Math.round(tx.H*sc));
 if(Math.abs(c.height-h)>h*.08){c.width=w;c.height=h}
 const W2=c.width,H2=c.height;if(L2D.cv.width<W2||L2D.cv.height<H2){L2D.cv.width=Math.max(W2,L2D.cv.width);L2D.cv.height=Math.max(H2,L2D.cv.height)}
 const tt=t+st.ph,B=.5-.5*Math.cos(tt*2*Math.PI/4.2),e=el.dataset.e,hasEx=!!(e&&R.ex&&R.ex[e]);
 // mulut: buka-tutup acak selama suara tokoh ini berbunyi (atau teks masih diketik bila tanpa suara)
 const talk=!el.classList.contains('dim')&&typeof SP!=='undefined'&&SP&&SP.sp===id&&(SP.hasV?SVOX.talking():!!SP.typing);
 if(talk&&(tx.mouth||hasEx)){if(t>st.mt){st.mo=st.mo?0:1;st.mt=t+(st.mo?.07+Math.random()*.1:.05+Math.random()*.09)+(Math.random()<.08?.18:0)}}else st.mo=0;
 // ekspresi juga berbicara: a/k = mulut terbuka (varian a2/k2 tertutup), d = tertutup (varian d2 terbuka); diam = mulut tertutup
 let ek=null,exT=null;if(hasEx){const op=e==='d'?'d2':e,cl=e==='d'?'d':e+'2';ek=st.mo?op:cl;if(!R.ex[ek])ek=e;exT=l2dTCEx(id,ek);if(!exT&&ek!==e){ek=e;exT=l2dTCEx(id,e)}}
 gl.viewport(0,0,W2,H2);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
 const bind=(u,tex)=>{gl.activeTexture(gl.TEXTURE0+u);gl.bindTexture(gl.TEXTURE_2D,tex||l2dZero())};
 bind(0,tx.base);bind(1,tx.mask);bind(2,tx.eyes);bind(3,tx.mouth);bind(4,exT);
 gl.uniform2f(U.uSize,tx.W,tx.H);gl.uniform1f(U.uT,tt);gl.uniform1f(U.uB,B);gl.uniform1f(U.uBlink,tx.eyes&&R.eye?l2dBlink(st,t):0);gl.uniform1f(U.uGlow,0);
 gl.uniform4f(U.uEyeBox,...(R.eye||[0,0,1,1]));gl.uniform4f(U.uMouthBox,...(R.mouth||[0,0,1,1]));gl.uniform4f(U.uExBox,...(exT?R.ex[ek]:[0,0,1,1]));
 gl.uniform1f(U.uTalk,st.mo);gl.uniform1f(U.uExOn,exT?1:0);gl.uniform2f(U.uAmp,.8,.45);
 const f=R.face;gl.uniform3f(U.uNeck,f[0]+f[2]/2,f[1]+f[3]*1.08,R.npc?.006:.011);
 gl.uniform2f(U.uHead,...R.head);gl.uniform2f(U.uChest,...R.chest);gl.uniform2f(U.uBody,R.waist,R.breast);gl.uniform4f(U.uSheenW,0,0,0,0);
 gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
 const g=st.g;g.clearRect(0,0,W2,H2);g.drawImage(L2D.cv,0,L2D.cv.height-H2,W2,H2,0,0,W2,H2)}
