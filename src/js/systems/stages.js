/* Generator tahap dari WORLDS (gelombang, hadiah, CP disarankan) */
const STAGES={},SLIST=[];
WORLDS.forEach((w,wi)=>{for(let s=0;s<5;s++){const n=wi*5+s,key=(wi+1)+'-'+(s+1),boss=s===4,rng=mulberry(n*977+13),waves=[],nw=boss?3:2;
 for(let k=0;k<nw;k++){if(boss&&k===nw-1){waves.push([{t:w.boss,boss:true,el:w.bossEl},{t:w.mobs[2],el:w.els[0]}]);continue}
  const cnt=Math.min(4,2+(s>=2?1:0)+(k>0?1:0)),wave=[];for(let j=0;j<cnt;j++)wave.push({t:w.mobs[Math.floor(rng()*w.mobs.length)],el:w.els[Math.floor(rng()*w.els.length)]});waves.push(wave)}
 const st={key,wi,s,n,name:w.stages[s],boss,waves,cost:boss?STAGE_RW.cost[1]:STAGE_RW.cost[0],gold:Math.round((STAGE_RW.gold[0]+STAGE_RW.gold[1]*n)*Math.pow(STAGE_RW.goldUp,Math.max(0,n-24))),gems:boss?STAGE_RW.gems[1]:STAGE_RW.gems[0],exp:Math.round((STAGE_RW.exp[0]+STAGE_RW.exp[1]*n)*Math.pow(STAGE_RW.expUp,Math.max(0,n-24))),bg:w.bg,art:w.art,rec:recCP(n)};STAGES[key]=st;SLIST.push(st)}});
/* ---- batas ulang harian tahap cerita (STAGE_REPLAY di data/config.js) ----
   Tahap yang sudah dimenangkan boleh dimainkan ulang / disapu n kali per hari (biasa 5, bos 3); dihitung saat MENANG / sapu.
   Habis → reset dengan permata (per tahap). Penghitung di S.daily.c ('sr_<tahap>' dipakai, 'srr_<tahap>' reset) → ikut reset harian. */
const stStory=st=>!!st&&!st.dg&&!st.arena&&!st.wb&&st.wi>=0;
const stRpResets=key=>(S.daily.c['srr_'+key])||0;
const stRpMax=key=>STAGE_REPLAY.n[STAGES[key].boss?1:0]*(1+stRpResets(key));
const stRpLeft=key=>{checkDaily();return Math.max(0,stRpMax(key)-((S.daily.c['sr_'+key])||0))};
const stRpUse=(key,n)=>{S.daily.c['sr_'+key]=(S.daily.c['sr_'+key]||0)+n};
// harga reset berikutnya (null = batas reset tahap ini hari ini habis)
const stRpResetCost=key=>{const L=STAGE_REPLAY.reset,r=stRpResets(key);return r<L.length?L[r]:null};
// perlu batas? (tahap cerita yang sudah dimenangkan)
const stRpOn=key=>stStory(STAGES[key])&&!!S.stages[key];
function stRpReset(key){checkDaily();if(stRpLeft(key))return{err:T('Batas ulang tahap ini masih ada.')};const c=stRpResetCost(key);
 if(c==null)return{err:T('Batas reset tahap ini hari ini habis. Kembali besok!')};if(S.gems<c)return{err:T('Permata tidak cukup!')};
 S.gems-=c;S.daily.c['srr_'+key]=stRpResets(key)+1;save();return{ok:1}}
