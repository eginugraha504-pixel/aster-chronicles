// =====================================================================
// KONFIGURASI BOT UNTUK SERVER — dijalankan otomatis oleh tools/build.py
//   src/js/data/bots.js + heroes.js -> bank-worker/src/botcfg.js
// Server memakai ini untuk membuat akun bot (nama sama persis dengan generator nama di game).
// =====================================================================
import fs from 'fs';import vm from 'vm';import path from 'path';import {fileURLToPath} from 'url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),SRC=path.join(ROOT,'src/js/data');
const FILES=['config','elements','heroes','weapons','gear','materials','enemies','worlds','banners','missions','dungeons','shop','mail','events','arena','topup','bots','ascend','stickers','worldboss','announce'];
const ctx={S:{},T:s=>s,Math,Date,console,Object,JSON,Array,Set,Map};vm.createContext(ctx);
let code='';for(const f of FILES)code+=fs.readFileSync(path.join(SRC,f+'.js'),'utf8').replace(/^(const|let) /gm,'var ')+'\n';
vm.runInContext(code,ctx);
const C=ctx.BOT_CFG;
const out={max:C.max,epoch:C.epoch,launch:C.launch,tau:C.tau,JOIN:C.JOIN,SRV:C.SRV,TZ:C.TZ,HOURS:C.HOURS,SYL:C.SYL,heroNames:ctx.HEROES.map(h=>h.name.toLowerCase()),stickers:ctx.STICKERS.map(s=>({k:s.k,n:s.n})),WHALE:{ids:C.SPEND.whales,def:Math.round(C.SPEND.tiers.filter(t=>C.SPEND.whales.includes(t.id)).reduce((a,t)=>a+t.w,0)*100)/100},
 // pengumuman server (/api/ann): validasi hero ★3 & teks untuk konteks AI — [nama, bintang, terbatas]
 HERO:Object.fromEntries(ctx.HEROES.map(h=>[h.id,[h.name,h.r,h.limited?1:0]])),WORLDS:ctx.WORLDS.map(w=>w.n),WBOSS:ctx.WB_BOSS.map(b=>b.n),ANN:ctx.ANN_CFG,
 // katalog toko untuk bot bank (SKU -> [nama, harga]) — sumber tunggal: src/js/data/topup.js
 SHOP:Object.fromEntries([...ctx.TOPUP_CFG.packs.map(p=>[p.id,[p.gems.toLocaleString('id-ID')+' Permata',p.price]]),[ctx.TOPUP_CFG.card.id,['Kartu Bulanan ('+ctx.TOPUP_CFG.card.days+' hari)',ctx.TOPUP_CFG.card.price]],...(ctx.TOPUP_CFG.bundles||[]).map(b=>[b.id,[b.n,b.price]])])};
fs.writeFileSync(path.join(ROOT,'bank-worker/src/botcfg.js'),'// DIBUAT OTOMATIS oleh tools/gen_botcfg.mjs — jangan diedit manual\nexport const BOTCFG='+JSON.stringify(out)+';\n');
console.log('botcfg.js:',out.max,'bot maks, epoch',new Date(out.epoch).toISOString());
