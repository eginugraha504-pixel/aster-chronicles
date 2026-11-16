/* =====================================================================
   SENJATA — level (EXP dari bijih), Limit Break (material Bintang), penempaan (duplikat)
   S.weapons[id] = {ref, lv, exp, lb}
   ===================================================================== */
const newWpn=()=>({ref:0,lv:1,exp:0,lb:0});
/* ---- SALINAN — duplikat senjata/perlengkapan disimpan sebagai salinan terpisah ----
   kunci salinan: 'id' (pertama), 'id~2', 'id~3', ...  WD/GDD diberi alias untuk kunci salinan,
   jadi WD[kunci] selalu berisi data senjata dasarnya. Salinan bisa dipasang ke hero lain,
   dipakai untuk Penempaan (manual), atau dilebur jadi bijih. */
const baseId=k=>String(k).split('~')[0];
function invNewKey(store,id){if(!store[id])return id;let n=2;while(store[id+'~'+n])n++;return id+'~'+n}
function invAlias(map,k){if(!map[k]&&map[baseId(k)])map[k]=map[baseId(k)];return map[k]}
const invKeys=(store,id)=>Object.keys(store).filter(k=>baseId(k)===id);
const invHas=(store,id)=>invKeys(store,id).length>0;
// kunci salinan terbaik dari tiap jenis (untuk daftar koleksi)
function invBest(store,id,score){return invKeys(store,id).sort((a,b)=>score(b)-score(a))[0]}
const SALVAGE={1:{ore1:4},2:{ore2:2},3:{ore3:2}};      // hasil lebur 1 salinan per bintang
const wHolder=k=>Object.keys(S.heroes).find(h=>S.heroes[h].wpn===k);
const wScore=k=>{const o=S.weapons[k];return(wHolder(k)?1e6:0)+o.ref*1e4+o.lb*1e3+o.lv};
// slot senjata kosong -> isi otomatis dengan senjata kelas yang sama yang menganggur (signature didahulukan).
// Tidak pernah mengganti senjata yang sudah dipasang pemain.
function autoFillWpn(hid){const h=S.heroes[hid];if(!h||h.wpn)return null;const cls=HD[hid].wcls;
 const c=Object.keys(S.weapons).filter(k=>WD[k]&&WD[k].cls===cls&&!wHolder(k)).sort((a,b)=>((WD[b].owner===hid)*1e7+WD[b].r*1e5+wScore(b))-((WD[a].owner===hid)*1e7+WD[a].r*1e5+wScore(a)))[0];
 if(c)h.wpn=c;return c||null}
function addWpnCopy(id){const k=invNewKey(S.weapons,id);S.weapons[k]=newWpn();invAlias(WD,k);return k}
// salinan yang bisa dikorbankan untuk menempa k (jenis sama, tidak dipasang), yang terlemah dulu
const wFodder=k=>invKeys(S.weapons,baseId(k)).filter(x=>x!==k&&!wHolder(x)).sort((a,b)=>wScore(a)-wScore(b));
function refineWpn(k){const o=S.weapons[k],f=wFodder(k)[0];if(!o||!f||o.ref>=DUPE_MAX)return null;delete S.weapons[f];o.ref++;return f}
function salvageWpn(k){if(!S.weapons[k]||wHolder(k))return null;const m=SALVAGE[WD[k].r];delete S.weapons[k];addMats(m);return m}
// lebur semua salinan CADANGAN bintang r (menyisakan salinan terbaik tiap jenis dan yang dipasang)
function salvageSpareW(r){const tot={};let n=0;for(const w of WEAPONS){if(w.r!==r)continue;const ks=invKeys(S.weapons,w.id).sort((a,b)=>wScore(b)-wScore(a));for(const k of ks.slice(1)){if(wHolder(k)||S.weapons[k].ref||S.weapons[k].lb||S.weapons[k].lv>1)continue;const m=salvageWpn(k);if(m){n++;for(const x in m)tot[x]=(tot[x]||0)+m[x]}}}return{n,tot}}
const wpnSt=id=>S.weapons[id];
const wMaxLv=id=>WPN_LV_CAP[Math.min(WPN_LB_MAX,wpnSt(id).lb||0)];
const wAtLvCap=id=>wpnSt(id).lv>=wMaxLv(id);
// EXP yang dibutuhkan untuk mencapai level cap dari kondisi sekarang
function wExpToCap(id){const o=wpnSt(id),r=WD[id].r;let need=-o.exp;for(let l=o.lv;l<wMaxLv(id);l++)need+=wExpNeed(l,r);return Math.max(0,need)}
function addWpnExp(id,exp){const o=wpnSt(id),r=WD[id].r,cap=wMaxLv(id);let ups=0;o.exp+=exp;
 while(o.lv<cap&&o.exp>=wExpNeed(o.lv,r)){o.exp-=wExpNeed(o.lv,r);o.lv++;ups++}if(o.lv>=cap)o.exp=0;return ups}
// pakai bijih: counts={ore1:n,...}; mengembalikan {ups,gold} atau pesan error
function useOres(id,counts){let exp=0;for(const k in counts){if((S.mats[k]||0)<counts[k])return{err:T('Material tidak cukup!')};exp+=MD2[k].exp*counts[k]}
 if(!exp)return{err:T('Pilih bijih dulu.')};if(wAtLvCap(id))return{err:T('Level maks! Lakukan Limit Break dulu.')};
 const gold=Math.round(Math.min(exp,wExpToCap(id))*WPN_EXP_GOLD);if(S.gold<gold)return{err:T('Emas tidak cukup!')};
 for(const k in counts)S.mats[k]-=counts[k];S.gold-=gold;return{ups:addWpnExp(id,exp),gold}}
// isi otomatis: pakai bijih dari yang terkecil sampai level cap
function autoOres(id){let left=wExpToCap(id);const pick={};for(const m of MATS.filter(m=>m.exp).sort((a,b)=>a.exp-b.exp)){const have=S.mats[m.id]||0;const n=Math.min(have,Math.ceil(left/m.exp));if(n>0){pick[m.id]=n;left-=n*m.exp}if(left<=0)break}return pick}
const wLbCost=id=>{const o=wpnSt(id);return o.lb>=WPN_LB_MAX?null:WPN_LB_COST[WD[id].r][o.lb]};
function canLB(id){const c=wLbCost(id);if(!c||!wAtLvCap(id))return false;return Object.entries(c).every(([k,v])=>k==='gold'?S.gold>=v:(S.mats[k]||0)>=v)}
function doWpnLB(id){if(!canLB(id))return false;const c=wLbCost(id);for(const[k,v]of Object.entries(c)){if(k==='gold')S.gold-=v;else S.mats[k]-=v}wpnSt(id).lb++;return true}
