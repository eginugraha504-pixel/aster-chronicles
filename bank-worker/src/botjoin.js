// DIBUAT OTOMATIS oleh tools/gen_botjoin.py dari src/js/systems/bots.js — JANGAN DIEDIT DI SINI.
// Kurva bergabung bot per dunia (sama persis dengan game karena kodenya sama).
import { BOTCFG as BOT_CFG } from './botcfg.js';
const BDAY = 864e5;
function bRng(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
function wEff(T,w){const C=BOT_CFG.SRV,O=w.newer||[];let e=0,last=0,k=0;for(const o of O){const d=(o-w.e)/BDAY;if(d>=T)break;if(d>last){e+=(d-last)*Math.pow(C.slow,k);last=d}k++}return e+(T-last)*Math.pow(C.slow,k)}
function wRng(g,k){return bRng((Math.imul(g+1,0x9E3779B1)^Math.imul(k+17,0x85EBCA6B))>>>0)}
function wDyn(w){if(w._d)return w._d;const C=BOT_CFG.SRV,hv=Math.min(10,Math.max(1,Math.round(w.h||5))),H=C.HYPE[hv],r=wRng(w.g,1);
 let pop=C.POP[0]+r()*(C.POP[1]-C.POP[0]);if(w.o!=null)pop*=Math.max(.8,1+C.ORD*(1.5-w.o));
 const R=Math.min(.88,H.R*pop),Wv=Math.min(.95-R,H.W*Math.sqrt(pop)),G=1-R-Wv,D=C.DAYS,B=C.BURST;
 const rate=new Float64Array(D),q=wRng(w.g,2),b=wRng(w.g,3),dec=Math.exp(-1/B.dec),pb=B.p+B.ph*hv,ar=C.AR,sq=Math.sqrt(1-ar*ar);
 let x=0,acc=0;
 for(let d=0;d<D;d++){const u1=Math.max(1e-9,q()),u2=q(),z=Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2);x=d?ar*x+sq*z:z;
  acc*=dec;if(d>0&&b()<pb)acc+=B.a[0]+b()*(B.a[1]-B.a[0])-1;
  const wd=new Date(w.e+(d+.5)*BDAY+BOT_CFG.TZ*36e5).getUTCDay();rate[d]=pop*Math.exp(C.SD*x-C.SD*C.SD/2)*C.WKD[wd]*(1+acc)}
 const nd=(w.newer||[]).map(o=>(o-w.e)/BDAY).filter(v=>v>0).sort((a,c)=>a-c),S=[],Cu=[],Rt=[];let E=0,k=0,j=0;
 for(let d=0;d<D;d++){let a=d;for(;;){while(j<nd.length&&nd[j]<=a){k++;j++}const nx=Math.min(d+1,j<nd.length?nd[j]:Infinity),rt=rate[d]*Math.pow(C.slow,k);
  S.push(a);Cu.push(E);Rt.push(rt);E+=rt*(nx-a);a=nx;if(a>=d+1)break}}
 S.push(D);Cu.push(E);Rt.push(Rt[Rt.length-1]);
 return w._d={R,W:Wv,G,tr:H.tr,tw:H.tw,tg:H.tg,pop,S,Cu,Rt}}
function wE2(T,d){if(T<=0)return 0;const S=d.S;let lo=0,hi=S.length-1;if(T>=S[hi])return d.Cu[hi]+d.Rt[hi]*(T-S[hi]);
 while(hi-lo>1){const m=(lo+hi)>>1;if(S[m]<=T)lo=m;else hi=m}return d.Cu[lo]+d.Rt[lo]*(T-S[lo])}
function wJoinN(T,w){if(w.v===2){if(T<=0)return 0;const d=wDyn(w),E=wE2(T,d);return w.cap*(d.R*(1-Math.exp(-T/d.tr))+d.W*(1-Math.exp(-E/d.tw))+d.G*(1-Math.exp(-E/d.tg)))}
 const C=BOT_CFG.SRV;return w.cap*(C.w1*(1-Math.exp(-T/C.t1))+C.w2*(1-Math.exp(-wEff(T,w)/C.t2)))}
function botJoinDaysW(i,w){if(i>=w.cap)return Infinity;let lo=0,hi=1;while(wJoinN(hi,w)<i+1&&hi<1e5)hi*=2;if(wJoinN(hi,w)<i+1)return Infinity;
 for(let k=0;k<50;k++){const m=(lo+hi)/2;if(wJoinN(m,w)<i+1)lo=m;else hi=m}
 if(hi<1)return hi;const E=w.e/BDAY;return Math.max(1,botJoinWarp(E+hi,BOT_CFG)-E)}
function botJoinWarp(d,C){const W=C.HOURS,tot=W.reduce((a,v)=>a+v,0),z=C.TZ/24,x=d+z,day=Math.floor(x),target=(x-day)*tot;
 let c=0,j=0;for(;j<23;j++){if(c+W[j]>=target)break;c+=W[j]}return day+(j+Math.min(1,Math.max(0,(target-c)/W[j])))/24-z}
export { bRng, wEff, wRng, wDyn, wE2, wJoinN, botJoinDaysW, botJoinWarp };
