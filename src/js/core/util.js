const $=(s,r=document)=>r.querySelector(s);
const rnd=(a,b)=>a+Math.random()*(b-a);
const pick=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const fmt=n=>Math.floor(n).toLocaleString((typeof LANGS!=='undefined'&&LANGS[LANG]||{loc:'id-ID'}).loc);
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function shade(hex,amt){const n=parseInt(hex.slice(1),16);const f=v=>clamp(Math.round(amt<0?v*(1+amt):v+(255-v)*amt),0,255);return '#'+[n>>16,n>>8&255,n&255].map(v=>f(v).toString(16).padStart(2,'0')).join('')}
const today=()=>{const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()};

