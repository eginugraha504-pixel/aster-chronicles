/* =====================================================================
   AUDIO — efek suara sintetis (Web Audio API), tanpa file audio
   ---------------------------------------------------------------------
   Rantai: suara -> bus SFX -> (kirim) reverb -> kompresor -> master -> speaker
   Pemakaian: sfx('nama', {opsi})  — daftar nama di SFX_LIB di bawah.
   Volume: S.vol (0..1), mati/hidup: S.sound
   ===================================================================== */
const AUD={ctx:null,master:null,bus:null,rev:null,noise:null,last:{},k:1};
function audInit(){if(AUD.ctx)return AUD.ctx;const A=new(window.AudioContext||window.webkitAudioContext)();AUD.ctx=A;
 const comp=A.createDynamicsCompressor();comp.threshold.value=-16;comp.knee.value=12;comp.ratio.value=4;comp.attack.value=.003;comp.release.value=.2;
 AUD.master=A.createGain();AUD.master.gain.value=audVol();AUD.master.connect(comp);comp.connect(A.destination);
 AUD.bus=A.createGain();AUD.bus.connect(AUD.master);
 // reverb: impuls derau meluruh (ruang kecil berkilau)
 const len=Math.floor(A.sampleRate*1.6),ir=A.createBuffer(2,len,A.sampleRate);
 for(let ch=0;ch<2;ch++){const d=ir.getChannelData(ch);for(let i=0;i<len;i++){const t=i/len;d[i]=(Math.random()*2-1)*Math.pow(1-t,3.2)*(i<200?i/200:1)}}
 AUD.rev=A.createConvolver();AUD.rev.buffer=ir;const rg=A.createGain();rg.gain.value=.32;AUD.rev.connect(rg);rg.connect(AUD.master);
 // buffer derau putih untuk tebasan, ledakan, dll
 const nb=A.createBuffer(1,A.sampleRate,A.sampleRate),nd=nb.getChannelData(0);for(let i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;AUD.noise=nb;
 return A}
const audVol=()=>(typeof S!=='undefined'&&S&&S.vol!=null?S.vol:.8)*.9;
function audSetVol(){if(AUD.master)AUD.master.gain.setTargetAtTime(audVol(),AUD.ctx.currentTime,.05)}

// ---------- primitif ----------
// nada berenvelope: f (Hz), d (detik), opsi: type, v (volume), a (attack), to (glide ke Hz), at (tunda), rev (kirim reverb), det (detune cent), lp (lowpass Hz)
function tone(f,d,o={}){const A=AUD.ctx,t=A.currentTime+(o.at||0),os=A.createOscillator(),g=A.createGain();
 os.type=o.type||'sine';os.frequency.setValueAtTime(f,t);if(o.to)os.frequency.exponentialRampToValueAtTime(o.to,t+(o.gt||d));if(o.det)os.detune.value=o.det;
 const v=(o.v??.2)*AUD.k,a=o.a??.005;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+a);g.gain.exponentialRampToValueAtTime(.0008,t+d);
 let node=os;if(o.lp){const fl=A.createBiquadFilter();fl.type='lowpass';fl.frequency.value=o.lp;os.connect(fl);node=fl}
 node.connect(g);g.connect(AUD.bus);if(o.rev)g.connect(AUD.rev);os.start(t);os.stop(t+d+.05)}
// derau tersaring: d, opsi: f (Hz), to (sapuan), q, type (bandpass/lowpass/highpass), v, a, at, rev
function noise(d,o={}){const A=AUD.ctx,t=A.currentTime+(o.at||0),src=A.createBufferSource(),fl=A.createBiquadFilter(),g=A.createGain();
 src.buffer=AUD.noise;src.loop=true;fl.type=o.type||'bandpass';fl.frequency.setValueAtTime(o.f||1200,t);if(o.to)fl.frequency.exponentialRampToValueAtTime(o.to,t+d);fl.Q.value=o.q??1;
 const v=(o.v??.2)*AUD.k,a=o.a??.005;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+a);g.gain.exponentialRampToValueAtTime(.0008,t+d);
 src.connect(fl);fl.connect(g);g.connect(AUD.bus);if(o.rev)g.connect(AUD.rev);src.start(t,Math.random()*.5);src.stop(t+d+.05)}
// lonceng/logam: beberapa sinus inharmonik
function bell(f,d,o={}){[[1,1],[2.76,.5],[5.4,.25],[8.9,.12]].forEach(([m,k])=>tone(f*m,d*(1.2-m*.05),{...o,v:(o.v??.12)*k,a:.002,rev:o.rev??1}))}
const arp=(notes,step,o={})=>notes.forEach((n,i)=>tone(n,o.d||.18,{...o,at:(o.at||0)+i*step}));
const N=n=>440*Math.pow(2,(n-69)/12); // nomor MIDI -> Hz

// ---------- pustaka efek ----------
const SFX_LIB={
 // UI
 click:()=>{tone(1250,.045,{type:'triangle',v:.09,to:900});noise(.03,{f:4000,q:2,v:.03})},
 tab:()=>{tone(900,.05,{type:'sine',v:.1,to:1300});tone(1800,.04,{type:'sine',v:.04,at:.02})},
 open:()=>{tone(520,.12,{type:'sine',v:.08,to:880,gt:.08});noise(.1,{f:2500,to:6000,q:.8,v:.025})},
 close:()=>tone(760,.09,{type:'sine',v:.07,to:420}),
 deny:()=>{tone(220,.12,{type:'square',v:.05,lp:900});tone(185,.16,{type:'square',v:.05,lp:900,at:.09})},
 coin:()=>{bell(N(88),.35,{v:.07});bell(N(95),.5,{v:.06,at:.07})},
 claim:()=>{arp([N(79),N(84),N(88),N(91)],.055,{type:'triangle',v:.1,d:.25,rev:1});bell(N(96),.7,{v:.05,at:.22})},
 equip:()=>{noise(.08,{f:3000,q:3,v:.12});bell(N(74),.45,{v:.09,at:.01});tone(N(50),.12,{type:'triangle',v:.12,to:N(43)})},
 lvup:()=>{arp([N(72),N(76),N(79),N(84)],.06,{type:'square',v:.045,d:.16,lp:3500});arp([N(84),N(88),N(91),N(96)],.06,{type:'triangle',v:.06,d:.3,at:.02,rev:1});noise(.4,{f:3000,to:9000,q:.6,v:.03,at:.1,rev:1})},
 sparkle:()=>{for(let i=0;i<5;i++)tone(2000+Math.random()*2500,.18,{v:.035,at:i*.045,rev:1})},
 // Beranda
 tap:()=>{tone(660,.08,{type:'triangle',v:.08,to:990});tone(1320,.12,{v:.04,at:.05,rev:1})},
 // Summon
 portal:()=>{tone(110,1.3,{type:'sawtooth',v:.05,to:440,lp:900,a:.3});tone(165,1.3,{type:'sine',v:.08,to:660,a:.3});noise(1.3,{f:300,to:4000,q:2,v:.06,a:.4,rev:1})},
 meteor:(o)=>{noise(.9,{f:6000,to:500,q:1.2,v:.12,a:.05,rev:1});tone(1800,.9,{type:'sine',v:.04,to:300,rev:1});if(o&&o.r>=3)for(let i=0;i<6;i++)tone(2400+i*300,.25,{v:.03,at:.1+i*.08,rev:1})},
 boom:(o)=>{const r=(o&&o.r)||1;tone(90,.6,{type:'sine',v:.35,to:38});noise(.5,{type:'lowpass',f:1800,to:200,v:.3});noise(.9,{f:4000,to:9000,q:.5,v:.05,at:.05,rev:1});
  if(r>=2)arp([N(76),N(83),N(88)],.05,{type:'triangle',v:.08,d:.4,at:.12,rev:1});
  if(r>=3){arp([N(72),N(76),N(79),N(84),N(88),N(91),N(96)],.05,{type:'triangle',v:.09,d:.5,at:.1,rev:1});bell(N(96),1.2,{v:.07,at:.45})}},
 card:(o)=>{noise(.06,{f:3500,q:2,v:.07});tone(o&&o.r>=3?N(91):o&&o.r>=2?N(84):N(77),.12,{type:'triangle',v:.06,at:.02});if(o&&o.r>=3)bell(N(96),.5,{v:.05,at:.03})},
 rare:()=>{const ch=[[N(72),N(76),N(79)],[N(77),N(81),N(84)],[N(79),N(83),N(86)],[N(84),N(88),N(91),N(96)]];
  ch.forEach((c,i)=>c.forEach(n=>{tone(n,i===3?1.4:.32,{type:'triangle',v:.07,at:i*.17,rev:1});tone(n*2,i===3?1.2:.25,{type:'sine',v:.025,at:i*.17,rev:1})}));
  tone(N(48),1.6,{type:'sawtooth',v:.05,lp:700,at:.51});noise(1.4,{f:5000,to:10000,q:.5,v:.04,at:.5,rev:1});for(let i=0;i<8;i++)tone(2600+Math.random()*2400,.2,{v:.03,at:.55+i*.09,rev:1})},
 // Pertempuran
 swing:()=>noise(.13,{f:900,to:3500,q:1.4,v:.11,a:.01}),
 hit:(o)=>{const c=o&&o.crit;tone(c?160:200,.12,{type:'sine',v:c?.28:.18,to:60});noise(c?.16:.09,{type:'lowpass',f:c?3500:2200,to:400,v:c?.22:.14});
  if(c){noise(.08,{f:5000,q:3,v:.1});tone(1400,.15,{type:'square',v:.03,lp:3000,at:.01})}},
 hurt:()=>{tone(260,.14,{type:'square',v:.05,to:130,lp:1200});noise(.1,{type:'lowpass',f:1500,v:.12})},
 block:()=>{bell(N(81),.3,{v:.07});noise(.05,{f:5000,q:4,v:.08})},
 die:()=>{tone(400,.35,{type:'triangle',v:.1,to:80});noise(.4,{f:1200,to:200,q:.8,v:.1,rev:1});for(let i=0;i<4;i++)tone(1500+i*400,.12,{v:.025,at:.12+i*.05,rev:1})},
 heal:()=>{arp([N(81),N(85),N(88),N(93)],.07,{type:'sine',v:.08,d:.45,rev:1});noise(.6,{f:4000,to:8000,q:.7,v:.03,rev:1})},
 shield:()=>{tone(N(57),.6,{type:'triangle',v:.12,rev:1});tone(N(64),.6,{type:'triangle',v:.08,at:.03,rev:1});bell(N(81),.7,{v:.06,at:.05});noise(.3,{f:600,to:2500,q:2,v:.06})},
 buff:()=>{arp([N(67),N(71),N(74),N(79),N(83)],.045,{type:'square',v:.035,d:.2,lp:3000,rev:1});noise(.4,{f:1500,to:6000,q:1,v:.05})},
 skill:(o)=>{const el=(o&&o.el)||'netral';
  noise(.35,{f:500,to:4000,q:1,v:.08,a:.05});tone(N(60),.5,{type:'sawtooth',v:.05,to:N(72),lp:1800,rev:1});
  const ex={api:()=>{noise(.7,{type:'lowpass',f:2500,to:300,v:.18,at:.15,rev:1});tone(70,.6,{v:.25,to:35,at:.15})},
   air:()=>{for(let i=0;i<6;i++)tone(1200+Math.random()*1600,.25,{v:.035,at:.12+i*.05,rev:1});noise(.6,{f:2000,to:600,q:3,v:.08,at:.12,rev:1})},
   tanah:()=>{tone(55,.7,{v:.3,to:30,at:.15});noise(.6,{type:'lowpass',f:800,to:120,v:.25,at:.15})},
   cahaya:()=>{[N(76),N(83),N(88),N(95)].forEach((n,i)=>tone(n,.9,{type:'triangle',v:.06,at:.12+i*.03,rev:1}));noise(.8,{f:6000,to:11000,q:.5,v:.05,at:.15,rev:1})},
   gelap:()=>{tone(N(38),.9,{type:'sawtooth',v:.08,lp:500,at:.12});tone(N(37),.9,{type:'sawtooth',v:.08,lp:500,at:.12,det:15});noise(.8,{f:300,to:1200,q:4,v:.08,at:.12,rev:1})},
   netral:()=>{noise(.3,{f:1500,to:300,q:1,v:.15,at:.15});tone(90,.4,{v:.2,to:45,at:.15})}};(ex[el]||ex.netral)()},
 wave:()=>{tone(N(62),.25,{type:'square',v:.05,lp:2000});tone(N(69),.4,{type:'square',v:.05,lp:2000,at:.15,rev:1})},
 boss:()=>{for(let i=0;i<3;i++){tone(N(40),.35,{type:'sawtooth',v:.09,lp:900,at:i*.4});tone(N(41),.35,{type:'sawtooth',v:.07,lp:900,at:i*.4,det:20})}noise(1.2,{type:'lowpass',f:400,v:.12,a:.4})},
 start:()=>{arp([N(67),N(72),N(76)],.09,{type:'square',v:.05,d:.2,lp:2500});tone(N(79),.6,{type:'square',v:.06,lp:2500,at:.27,rev:1});noise(.2,{f:2000,q:.8,v:.04,at:.27})},
 win:()=>{const mel=[[N(72),.12],[N(76),.12],[N(79),.12],[N(84),.32],[N(81),.12],[N(84),.6]];let t=0;mel.forEach(([n,d])=>{tone(n,d+.15,{type:'square',v:.05,lp:3200,at:t});tone(n/2,d+.15,{type:'triangle',v:.07,at:t});t+=d});
  [N(72),N(76),N(79),N(84)].forEach(n=>tone(n,1.2,{type:'triangle',v:.04,at:t-.6,rev:1}));noise(1,{f:6000,to:10000,q:.5,v:.03,at:t-.6,rev:1})},
 star:(o)=>{const i=(o&&o.i)||0;bell(N(84+i*4),.6,{v:.08});noise(.2,{f:6000,q:1,v:.04})},
 lose:()=>{const mel=[[N(67),.25],[N(63),.25],[N(60),.25],[N(55),.8]];let t=0;mel.forEach(([n,d])=>{tone(n,d+.2,{type:'triangle',v:.08,at:t,rev:1});tone(n/2,d+.2,{type:'sine',v:.06,at:t});t+=d})}
};
// batas jeda per efek supaya tidak menumpuk (ms)
// penyeimbang volume per efek
const SFX_GAIN={click:3,tab:2.6,open:3,close:3,tap:2.4,swing:5,hurt:3,die:2,block:1.8,card:1.4,deny:1.5,hit:1.4};
const SFX_GAP={hit:55,swing:45,hurt:80,click:30,card:40,heal:150,block:90,die:60,sparkle:120};
function sfx(k,o){if(typeof S==='undefined'||!S||!S.sound)return;const fn=SFX_LIB[k];if(!fn)return;
 try{const A=audInit();if(A.state==='suspended')A.resume();const now=performance.now(),gap=SFX_GAP[k]||0;if(gap&&now-(AUD.last[k]||0)<gap)return;AUD.last[k]=now;AUD.k=SFX_GAIN[k]||1;fn(o||{});AUD.k=1}catch(e){}}
