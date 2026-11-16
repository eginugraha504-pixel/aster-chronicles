/* SISTEM TOKO — stok harian per item, beli dengan emas */
function shopState(){if(!S.shop||S.shop.date!==today())S.shop={date:today(),bought:{}};return S.shop}
const shopLeft=it=>it.limit-(shopState().bought[it.id]||0);
function shopBuy(id){const it=SHOP.find(x=>x.id===id);if(!it)return{err:'?'};if(shopLeft(it)<=0)return{err:T('Stok habis! Kembali besok.')};if(S.gold<it.cost)return{err:T('Emas tidak cukup!')};
 S.gold-=it.cost;shopState().bought[id]=(shopState().bought[id]||0)+1;grantRw(it.give);save();return{ok:1}}

/* TOKO LENCANA — stok per minggu (Senin WIB) */
const weekKey=()=>{const d=new Date(Date.now()+7*36e5);const day=(d.getUTCDay()+6)%7;return Math.floor(d.getTime()/864e5)-day};
function shopXState(){if(!S.shopX||S.shopX.wk!==weekKey())S.shopX={wk:weekKey(),bought:{}};return S.shopX}
const shopXLeft=it=>it.limit?it.limit-(shopXState().bought[it.id]||0):Infinity;
const pickWpnPool=r=>WEAPONS.filter(w=>w.r===r&&!w.limited);
function shopXBuy(id,pick){const it=SHOP_X.find(x=>x.id===id);if(!it)return{err:'?'};if(shopXLeft(it)<=0)return{err:T('Stok minggu ini habis!')};if((S.badge||0)<it.cost)return{err:T('Lencana tidak cukup!')};
 const r=Object.assign({},it.give);if(r.pickHero){if(!pick||!pickPool(r.pickHero).some(h=>h.id===pick))return{err:'?'};delete r.pickHero;r.hero=pick}
 if(r.pickWpn){if(!pick||!pickWpnPool(r.pickWpn).some(w=>w.id===pick))return{err:'?'};delete r.pickWpn;r.weapon=pick}
 S.badge-=it.cost;shopXState().bought[id]=(shopXState().bought[id]||0)+1;const res=grantRw(r);save();return{ok:1,res}}
