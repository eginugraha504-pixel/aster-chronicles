// =====================================================================
// PENGETAHUAN GAME UNTUK MODE AI — dijalankan otomatis oleh tools/build.py
//   docs/AI_PANDUAN.md (teks tangan) + data game ASLI (src/js/data/*.js)
//   -> bank-worker/src/knowledge.js  (dibaca server AI di Cloudflare)
// Jadi setiap hero/senjata/event/angka balance berubah, pengetahuan AI ikut berubah saat build.
// Pakai: node tools/gen_knowledge.mjs
// =====================================================================
import fs from 'fs';import vm from 'vm';import path from 'path';import {fileURLToPath} from 'url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),SRC=path.join(ROOT,'src/js/data');
const FILES=['config','elements','heroes','weapons','gear','materials','enemies','worlds','banners','missions','dungeons','shop','mail','events','arena','topup','bots','ascend'];
const ctx={S:{},T:s=>s,Math,Date,console,Object,JSON,Array,Set,Map};vm.createContext(ctx);
let code='';for(const f of FILES)code+=fs.readFileSync(path.join(SRC,f+'.js'),'utf8').replace(/^(const|let) /gm,'var ')+'\n';
vm.runInContext(code,ctx);
const {GOLD_DG_3STAR,HEROES,WEAPONS,GEAR,MATS,WORLDS,BANNERS,MISSIONS,ACH,DUNGEONS,SHOP,SHOP_X,MAILS,EVENTS,ARENA_CFG,TOPUP_CFG,BOT_CFG,EL,ROLE,SKT,WCLASS,ENEMY,MAX_LV,RATES,PITY,SOFT_PITY,RATE_UP,COST1,COST10,DUPE_MAX,BADGE_DUPE,STAM_MAX,DIFF,GEAR_MAX_LV,ASC}=ctx;
const rp=n=>'Rp'+n.toLocaleString('id-ID'),stars=r=>'★'+r,HDn=id=>(HEROES.find(h=>h.id===id)||{}).name||id;
const rw=o=>Object.entries(o||{}).map(([k,v])=>({gems:`${v} permata`,gold:`${v} emas`,stam:`${v} stamina`,exp:`${v} EXP`,tixH:`${v} Tiket Hero`,tixW:`${v} Tiket Senjata`,pickHero:`pilih 1 hero ★${v}`,pickWpn:`pilih 1 senjata ★${v}`,
 hero:`hero ${HDn(v)}`,weapon:`senjata ${v}`,mats:Object.entries(v).map(([m,n])=>`${n} ${(MATS.find(x=>x.id===m)||{}).n||m}`).join(', '),gear:[].concat(v).join(', ')}[k]||`${k} ${v}`)).join(', ');
const recCP=n=>{const A=DIFF.rec;if(n<=A[0][0])return A[0][1];for(let i=1;i<A.length;i++)if(n<=A[i][0]){const[x0,y0]=A[i-1],[x1,y1]=A[i],t=(n-x0)/(x1-x0);return Math.round(Math.exp(Math.log(y0)+(Math.log(y1)-Math.log(y0))*t)/50)*50}return A.at(-1)[1]};
const L=[];const H=t=>L.push('\n## '+t);
H('Hero ('+HEROES.length+')');
for(const h of HEROES){const w=WEAPONS.find(x=>x.owner===h.id),since=BOT_CFG.HERO_SINCE[h.id],lim=BANNERS.some(b=>b.rateUp===h.id&&b.limited);
 L.push(`- ${h.name} ${stars(h.r)} "${h.title}" — ${EL[h.el].n}, ${ROLE[h.role].n}, senjata ${WCLASS[h.wcls]}${lim?', TERBATAS (hanya di banner-nya)':h.r===3?', ★3 standar':''}${since?`, rilis ${new Date(since+7*36e5).toISOString().slice(0,10)}`:''}. Skill "${h.sk}" (${SKT[h.skill]}). ${h.lore||''}${w?` Senjata signature: ${w.name}.`:''}${h.lines&&h.lines.length?` Contoh ucapan: "${h.lines[0]}"`:''}`)}
H('Senjata');
for(const w of WEAPONS)L.push(`- ${w.name} ${stars(w.r)} ${WCLASS[w.cls]}, ATK ${w.atk}, +${w.sub[1]}% ${w.sub[0].toUpperCase()}${w.owner?`, signature ${HDn(w.owner)}: ${w.sigTxt||''}`:''}`);
H('Pelindung & Aksesori');
for(const g of GEAR)L.push(`- ${g.name} ${stars(g.r)} (${g.slot==='armor'?`Pelindung HP ${g.hp} DEF ${g.def}`:`Aksesori ATK ${g.atk} Crit ${g.crit}%`}, enhance maks +${ASC.gCap[g.r]}, bisa dibangkitkan sampai ★6)`);
H('Material');for(const m of MATS)L.push(`- ${m.n}: ${m.desc}`);
H('Dunia & tahap cerita');
WORLDS.forEach((w,k)=>L.push(`- Dunia ${k+1} ${w.n}: ${w.stages.map((s,j)=>`${k+1}-${j+1} ${s}`).join(', ')}. ${w.intro} Bos ${k+1}-5: ${ENEMY[w.boss].n} (elemen ${EL[w.bossEl].n}). Musuh: ${[...new Set(w.mobs)].map(m=>ENEMY[m].n).join(', ')}; elemen ${w.els.map(e=>EL[e].n).join('/')}. CP rekomendasi ±${recCP(k*5)}–${recCP(k*5+4)}.`));
H('Dungeon');
for(const d of DUNGEONS)L.push(`- ${d.n}: ${d.desc} Tingkat 1–${d.levels.length}, terbuka setelah tahap ${d.levels.map(l=>l.req).join(' / ')}, stamina ${d.levels[0].cost}–${d.levels.at(-1).cost}.${d.levels[0].gold?` Hadiah emas per kemenangan: ${d.levels.map((l,i)=>`T${i+1} ${l.gold[0].toLocaleString('id-ID')}–${l.gold[1].toLocaleString('id-ID')}`).join(', ')} (+${Math.round(ctx.GOLD_DG_3STAR*100)}% bila 3 bintang); musuh slime emas, bos ${ENEMY[d.boss].n}. Tempat terbaik untuk farming emas.`:''}`);
L.push(`- Drop per tingkat: `+DUNGEONS.map(d=>d.n+': '+d.levels.map((l,i)=>`T${i+1} `+(Object.entries(l.drop).map(([k,[x,y,p]])=>`${(ctx.MD2&&ctx.MD2[k]?ctx.MD2[k].n:k)} ${p!=null?Math.round(p*100)+'% peluang':x===y?x:x+'–'+y}`).join(' + ')||'emas')).join('; ')).join(' | '));
L.push(`- Menara Kebangkitan dibatasi ${(DUNGEONS.find(d=>d.id==='tower')||{}).daily} kali per hari (menang + sapu digabung), reset 00:00 WIB.`);
H('Kebangkitan ★4–★6 (Ascension)');
L.push(`Hero, senjata, dan perlengkapan bisa dibangkitkan satu bintang demi satu sampai ★6 (★1/★2 naik ke ★3 dulu). Syarat: hero level mentok di bintang sekarang (dan Level Akun cukup), senjata Limit Break 4/4 + level mentok, perlengkapan tempa mentok. Level tidak direset. Tombol: pita ungu "Kebangkitan" di detail hero/senjata/perlengkapan, atau tombol "Bangkitkan" di bar level hero.`);
L.push(`- Level maks hero per bintang: ${ASC.heroCap.slice(1).map((c,i)=>`★${i+1} ${c}`).join(', ')} (+${2} per Limit Break). Senjata: +${ASC.wCapAdd[4]}/${ASC.wCapAdd[5]}/${ASC.wCapAdd[6]} level di ★4/★5/★6. Perlengkapan: tempa maks ${ASC.gCap.slice(1).map((c,i)=>`★${i+1} +${c}`).join(', ')}.`);
L.push(`- Pengali kekuatan hero: ★3 ×${ASC.heroRar[3]}, ★4 ×${ASC.heroRar[4]}, ★5 ×${ASC.heroRar[5]}, ★6 ×${ASC.heroRar[6]}. Tim terbaik semua ★6 & maks ≈ 3.000.000 CP (batas teoretis).`);
for(const[k,nm]of[['hero','Hero'],['wpn','Senjata'],['gear','Perlengkapan']])L.push(`- Biaya ${nm}: `+Object.entries(ASC.cost[k]).map(([s,c])=>`→★${s}: `+Object.entries(c).map(([m,n])=>`${n.toLocaleString('id-ID')} ${m==='gold'?'emas':m==='badge'?'Lencana Ksatria':(ctx.MD2[m]||{}).n||m}`).join(', ')).join(' | '));
L.push(`- Sumber bahan: Menara Kebangkitan (5×/hari, buka setelah 5-5), hadiah akhir musim Arena (liga Perunggu ke atas; Air Mata Dewi mulai Berlian), peleburan salinan ★3 (+1 Kristal Kebangkitan). Bahan Kebangkitan TIDAK dijual di toko/top up — murni kesabaran. Butuh berbulan-bulan untuk tim ★6 penuh, Air Mata Dewi adalah penghambat utama.`);
L.push(`- Bingkai kartu: ★4 Ametis Kerajaan (ungu-emas), ★5 Rubi Surgawi (merah mawar bersayap), ★6 Prisma Ilahi (pelangi bersayap, berkilau).`);
L.push(`- Bab II (Dunia 6–8) butuh hero ★4–★6: CP rekomendasi 6-1 ±${recCP(25)}, 7-1 ±${recCP(30)}, 8-5 ±${recCP(39)}.`);
H('Banner gacha sekarang');
for(const b of BANNERS)L.push(`- ${b.n}${b.weapon?' (senjata)':''}${b.limited?' — TERBATAS':''}${b.rateUp?`, rate-up ${HDn(b.rateUp)}`:''}. ${b.desc||''}`);
L.push(`- Angka: ★3 ${RATES[3]}%, ★2 ${RATES[2]}%, ★1 ${RATES[1]}%; soft pity mulai ${SOFT_PITY.at}, hard pity ${PITY}; rate-up hero ${RATE_UP.hero*100}% / senjata ${RATE_UP.wpn*100}%; 1× ${COST1} permata, 10× ${COST10}; Limit Break maks +${DUPE_MAX}; Lencana dari duplikat setelah maks: ★1 ${BADGE_DUPE[1]}, ★2 ${BADGE_DUPE[2]}, ★3 ${BADGE_DUPE[3]}. Level maks per bintang ★1/★2/★3: ${MAX_LV.slice(1).join('/')}. Stamina maks ${STAM_MAX}.`);
H('Event');for(const e of EVENTS)L.push(`- ${e.n} [${e.tag}]${e.dur?` (${e.dur} hari)`:''}: ${e.desc} ${e.type==='login'?'Hadiah per hari: '+e.days.map((d,k)=>`H${k+1} ${rw(d.rw)}`).join('; '):'Misi: '+e.missions.map(m=>`${m.n} (${rw(m.rw)})`).join('; ')}`);
H('Misi harian');for(const m of MISSIONS)L.push(`- ${m.n}: ${rw(m.rw)}`);
H('Pencapaian');L.push(ACH.map(a=>`${a.n} (${rw(a.rw)})`).join('; '));
H('Toko Emas (stok harian)');L.push(SHOP.map(s=>`${rw(s.give)} = ${s.cost.toLocaleString('id-ID')} emas (maks ${s.limit}/hari)`).join('; '));
H('Toko Lencana');L.push(SHOP_X.map(s=>`${rw(s.give)} = ${s.cost} Lencana${s.limit?` (maks ${s.limit}/minggu)`:''}`).join('; '));
H('Kotak Surat pemula');for(const m of MAILS)L.push(`- "${m.title}" dari ${m.from}: ${rw(m.rw)}`);
H('Top Up');L.push(TOPUP_CFG.packs.map(p=>`${p.gems.toLocaleString('id-ID')} permata (+${p.bonus} bonus, pembelian pertama 2×) ${rp(p.price)}`).join('; ')+`; Kartu Bulanan ${rp(TOPUP_CFG.card.price)}: ${TOPUP_CFG.card.now} langsung + ${TOPUP_CFG.card.daily}/hari × ${TOPUP_CFG.card.days} hari. VIP 1–7 mulai total belanja ${BOT_CFG.SPEND.VIP.map(rp).join(' / ')}.`);
H('Arena (angka)');L.push(`${ARENA_CFG.tix} tiket/hari, poin awal ${ARENA_CFG.start}, batas ${ARENA_CFG.limit} detik, Kemarahan Arena mulai detik ${ARENA_CFG.rage.at} (+${ARENA_CFG.rage.per*100}%/detik), heal ×${ARENA_CFG.healMul}. Menang ${rw(ARENA_CFG.battle.win)}, kalah ${rw(ARENA_CFG.battle.lose)}. Liga: `+ARENA_CFG.leagues.map(l=>`${l.n} ${l.min}+ (harian ${rw(l.day)}; akhir musim ${rw(l.week)})`).join('; '));
const guide=fs.readFileSync(path.join(ROOT,'docs/AI_PANDUAN.md'),'utf8').replace(/^# .*\n+(File ini[\s\S]*?\n\n)?/,'');
const text=('# PENGETAHUAN ASTER CHRONICLES\n'+guide.trim()+'\n\n# DATA GAME (otomatis dari kode, selalu terbaru)'+L.join('\n')).replace(/\n{3,}/g,'\n\n');
const out=path.join(ROOT,'bank-worker/src/knowledge.js');
fs.writeFileSync(out,`// DIBUAT OTOMATIS oleh tools/gen_knowledge.mjs dari docs/AI_PANDUAN.md + src/js/data/*.js — jangan diedit langsung.\nexport const GAME_KNOWLEDGE = ${JSON.stringify(text)};\n`);
console.log(`knowledge.js: ${text.length} karakter (±${Math.round(text.length/3.6)} token)`);
