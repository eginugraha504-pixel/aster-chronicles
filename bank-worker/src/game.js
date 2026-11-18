/* =====================================================================
   SERVER GAME Aster Chronicles — akun, simpanan cloud, akun bot, teman, pesan 1:1, obrolan dunia
   ---------------------------------------------------------------------
   Semua di D1 (tabel di migrations/0004_game.sql). Dipanggil dari index.js:
     gameRoute(req, env, url, json)       -> /api/acc/*, /api/save, /api/load, /api/ping, /api/world, /api/players,
                                             /api/prof, /api/find, /api/bots/snap, /api/fr/*, /api/dm/*, /api/wc
     adminMessage / adminCallback          -> perintah Telegram khusus pemilik (/akun, /set, /cari, /pemain, /resetbot)
   Pemain & bot sama-sama baris di tabel players (bot: kolom bot = indeks bot di game).
   Password disimpan sebagai hash PBKDF2-SHA256 + salt; bot memakai password acak (tidak bisa dipakai login).
   Progres bot tetap dihitung oleh game (simulasi deterministik, sama untuk semua pemain); server menyimpan
   identitas bot (UID, username, password), dunia bot {epoch, gen}, potret terakhir dari game, dan ubahan admin (ov).
   ===================================================================== */
import { BOTCFG } from './botcfg.js';
import { callClaude, bump, dayKey } from './ai.js';
const enc = new TextEncoder();
const DAY = 864e5;
const NAME_RE = /^[A-Za-z0-9]{3,12}$/;          // username pemain (sama dengan aturan nama di game)
const PBKDF2_IT = 12000;
const ONLINE_MS = 75e3;

/* ---------------- util ---------------- */
const hex = b => Array.from(new Uint8Array(b), x => x.toString(16).padStart(2, '0')).join('');
const rnd = n => { const b = new Uint8Array(n); crypto.getRandomValues(b); return b };
const now = () => Date.now();
async function pwHash(pw, salt, it = PBKDF2_IT) {
  const k = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']);
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(salt), iterations: it }, k, 256));
}
async function sha(s) { return hex(await crypto.subtle.digest('SHA-256', enc.encode(s))) }
const kvGet = async (env, k) => (await env.DB.prepare('SELECT v FROM kv WHERE k=?').bind(k).first())?.v ?? null;
const kvSet = (env, k, v) => v == null ? env.DB.prepare('DELETE FROM kv WHERE k=?').bind(k).run() : env.DB.prepare('INSERT INTO kv (k,v) VALUES (?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v').bind(k, String(v)).run();
const pj = (s, d = null) => { try { return s ? JSON.parse(s) : d } catch (e) { return d } };
const pair = (x, y) => x < y ? [x, y] : [y, x];
const newUid = () => String(10000000 + (new Uint32Array(rnd(4).buffer)[0] % 90000000));
const clean = (s, n) => String(s ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);

/* ---------------- dunia bot (port persis dari src/js/systems/bots.js) ---------------- */
function bRng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296 } }
function bHash(i, s, gen) { i += gen * 1000003; let h = (Math.imul(i + 1, 2654435761) ^ Math.imul(s + 7, 0x9E3779B1)) >>> 0; h = Math.imul(h ^ h >>> 16, 0x45d9f3b) >>> 0; h = Math.imul(h ^ h >>> 16, 0x45d9f3b) >>> 0; return (h ^ h >>> 16) >>> 0 }
function botLocalName(i, gen) { const r = bRng(bHash(i, 9, gen)), Y = BOTCFG.SYL; let n = ''; const k = 2 + Math.floor(r() * 2); for (let j = 0; j < k; j++)n += Y[Math.floor(r() * Y.length)]; n = n[0].toUpperCase() + n.slice(1); if (r() < .45) n += Math.floor(r() * (r() < .5 ? 100 : 2000)); return n.slice(0, 14) }
function botJoin(i, epoch) { const C = BOTCFG; if (i < C.launch) return epoch + i * 55e3; const f = (i + 1 - C.launch) / (C.max - C.launch + 1); return epoch + (-C.tau * Math.log(1 - f)) * DAY }
function botsJoined(epoch, t = now()) { let lo = 0, hi = BOTCFG.max; while (lo < hi) { const m = (lo + hi) >> 1; if (botJoin(m, epoch) <= t) lo = m + 1; else hi = m } return lo }
export async function getWorld(env) {
  const w = pj(await kvGet(env, 'world'));
  if (w && w.epoch) return w;
  const d = { epoch: BOTCFG.epoch, gen: 0 }; await kvSet(env, 'world', JSON.stringify(d)); return d;
}
// pastikan akun bot sudah ada untuk semua bot yang sudah bergabung (+10 cadangan). Maks 5000 per panggilan.
export async function ensureBots(env, w) {
  w = w || await getWorld(env);
  const joined = botsJoined(w.epoch), need = Math.min(BOTCFG.max, joined + 200);   // buat 200 sekaligus supaya jarang membaca semua nama
  const have = (await env.DB.prepare('SELECT COUNT(*) n, COALESCE(MAX(bot),-1) m FROM players WHERE bot IS NOT NULL').first());
  if (have.n >= Math.min(BOTCFG.max, joined + 10)) return have.n;
  const taken = new Set((await env.DB.prepare('SELECT lower(uname) u FROM players').all()).results.map(r => r.u));
  const HN = new Set(BOTCFG.heroNames), rows = [];
  let i = have.n, gi = have.n;              // indeks bot berikutnya & indeks generator (lewati nama bentrok, sama seperti di game)
  const stop = Math.min(need, have.n + 5000);
  while (i < stop && gi < have.n + 40000) {
    const nm = botLocalName(gi++, w.gen), lo = nm.toLowerCase();
    if (!/^[A-Za-z0-9]{3,14}$/.test(nm) || taken.has(lo) || HN.has(lo)) continue;
    taken.add(lo);
    const salt = hex(rnd(8)), pw = hex(rnd(9));                      // password acak; hanya hash yang disimpan
    rows.push([newUid(), nm, 'x1$' + await sha(salt + pw), salt, i, Math.round(botJoin(i, w.epoch))]);
    i++;
  }
  // 1 statement = 16 baris (batas 100 parameter D1), dikirim per batch 40 statement
  const st = [];
  for (let k = 0; k < rows.length; k += 16) {
    const part = rows.slice(k, k + 16);
    st.push(env.DB.prepare(`INSERT OR IGNORE INTO players (uid,uname,ph,salt,bot,created) VALUES ${part.map(() => '(?,?,?,?,?,?)').join(',')}`).bind(...part.flat()));
  }
  for (let k = 0; k < st.length; k += 40) await env.DB.batch(st.slice(k, k + 40));
  return have.n + rows.length;
}
export async function resetBots(env) {
  const w = await getWorld(env), nw = { epoch: now(), gen: (w.gen || 0) + 1 };
  await env.DB.batch([
    env.DB.prepare('DELETE FROM friends WHERE a IN (SELECT uid FROM players WHERE bot IS NOT NULL) OR b IN (SELECT uid FROM players WHERE bot IS NOT NULL)'),
    env.DB.prepare('DELETE FROM dms WHERE frm IN (SELECT uid FROM players WHERE bot IS NOT NULL) OR too IN (SELECT uid FROM players WHERE bot IS NOT NULL)'),
    env.DB.prepare('DELETE FROM players WHERE bot IS NOT NULL'),
    env.DB.prepare('DELETE FROM wchat'),   // riwayat Obrolan Dunia ikut dikosongkan
    env.DB.prepare("DELETE FROM kv WHERE k IN ('ai_scene_at','ai_until','stk_at','stk_gap','watch_at')"),
    env.DB.prepare("INSERT INTO kv (k,v) VALUES ('world',?) ON CONFLICT(k) DO UPDATE SET v=excluded.v").bind(JSON.stringify(nw)),
  ]);
  return nw;
}

/* ---------------- Mode AI Obrolan Dunia (Claude Haiku 5.5) — nyala/mati lewat Telegram (/ai on|off) ----------------
   Game mana pun yang sedang dibuka mengirim konteks (bot yang sedang online + data aslinya, obrolan terakhir);
   server memegang kunci global supaya hanya satu adegan per ±75 dtk, lalu menyimpan pesan bot ke wchat
   dengan jeda mengetik (ts di masa depan) -> semua pemain melihat obrolan yang sama. */
export const aiOnline = async env => (await kvGet(env, 'ai_on')) !== 'off';   // bawaan: nyala
/* Hemat token:
   - adegan AI hanya ±100 dtk sekali saat ada pemain yang sedang MEMBUKA Obrolan Dunia, selain itu ±9 menit sekali;
   - di sela itu bot "gabut" mengirim stiker acak TANPA AI (keputusan acak di server);
   - balasan AI hanya saat pemain asli menulis / membalas pesan bot;
   - konteks ringkas (16 pesan terakhir, maks 5 penulis), pengetahuan game di system prompt yang di-cache. */
const STK = new Map((BOTCFG.stickers || []).map(x => [x.k, x.n]));
const stkKey = t => { const m = /^:stk:([a-z_]+):$/.exec(String(t || '')); return m && STK.has(m[1]) ? m[1] : null };
const showTxt = t => { const k = stkKey(t); return k ? `[stiker: ${STK.get(k)}]` : t };
const rnd01 = () => crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
function chunks(s, max = 95) { const out = []; s = s.trim(); while (s.length > max) { let k = -1; for (const re of [/[.!?]\s/g, /[,;]\s/g, /\s/g]) { let m; re.lastIndex = 0; while ((m = re.exec(s)) && m.index < max) k = m.index + 1; if (k > 20) break } if (k <= 0) k = max; out.push(s.slice(0, k).trim()); s = s.slice(k).trim() } if (s) out.push(s); return out }
const clip = (s, n) => String(s ?? '').replace(/[\u0000-\u001f]/g, ' ').slice(0, n);
const hhmm = ms => new Date(ms + 7 * 36e5).toISOString().slice(11, 16);
const ROLE = `Kamu menulis isi Obrolan Dunia (world chat) game mobile gacha Aster Chronicles atas nama PEMAIN LAIN di server: orang Indonesia biasa (karyawan, mahasiswa, ojol, dll) yang main sambil rebahan, kerja, atau nunggu sesuatu. Tujuan: siapa pun yang membaca harus yakin ini obrolan manusia sungguhan. Mereka bukan asisten, bukan NPC, bukan AI.

SEPERTI APA CHAT GAME ASLI
- Mayoritas pesan pendek dan datar: "4-5 susah amat", "ada yg punya raika?", "gw stuck di 3-5", "tiket dungeon abis", "bentar makan", "gg", "wkwk". Sesekali satu kalimat utuh saat menjelaskan/curhat.
- Orang ngomongin yang sedang mereka KERJAKAN di game (lihat SEDANG di data pribadi): push tahap, kalah di bos, farming dungeon, arena, naikin level, nunggu stamina, gacha. Juga hal sehari-hari: macet, hujan, ngantuk, kerjaan, makan.
- Tidak semua pesan dijawab. Pertanyaan bisa dicuekin, topik pindah tiba-tiba, dua obrolan bisa jalan bersamaan. Orang kadang salah paham atau nanya ulang.
- Tiap orang konsisten dengan GAYA-nya sendiri. Kebiasaan/ciri khas dipakai SESEKALI saja, bukan di tiap pesan. Gaya rapi ya tulis rapi; gaya singkat ya singkat.
- Nada biasa saja: tidak heboh, tidak manis berlebihan, tidak saling memuji, tidak formal, tidak menasihati panjang.

HINDARI (bikin kelihatan palsu/cringe)
- Kata/emotikon wibu & imut: ne, desu, yosh, sugoi, yabai, kawaii, nya, uwu, owo, :3, QwQ, ^^, >_<, ~ di akhir kata.
- Menyebut nama orang di hampir tiap pesan, memanggil "kak/gan/suhu" terus-terusan, mengulang kata/frasa yang sama dengan pesan sebelumnya.
- Semua orang menanggapi satu pesan yang sama; ramai-ramai menyambut pemain; menjilat / mengikuti apa pun kata pemain.
- Menjelaskan isi stiker dengan kata ("hilde pamer otot", "nami_love") atau membahas stiker panjang. Stiker ditanggapi seperlunya (wkwk / stiker lagi / dicuekin).
- Minta maaf, meluruskan diri sendiri, membahas obrolan itu sendiri ("tadi aku bilang..."), kalimat penutup manis, pertanyaan basa-basi beruntun.
- Tanda seru berlebihan, emoji, huruf kapital teriak, nasihat yang sama diulang ("pake tiket dulu aja").

PRIVASI (wajib): tiap penulis hanya tahu data PRIBADI dirinya sendiri (SEDANG, pity, permata, top up, tabungan, hoki/apes, berapa hari main). Data pribadi orang lain (termasuk pemain asli) TIDAK diketahui kecuali orang itu sendiri sudah menyebutnya di obrolan. Yang bisa dilihat semua orang hanya: nama, level, CP, peringkat, lencana VIP, tim & hero di profil, tahap terjauh, liga Arena, dan pengumuman ★3.
FAKTA: semua fakta game harus benar sesuai pengetahuan di bawah; jangan mengarang fitur (guild & guild war BELUM ada). Pakai istilah game ini: ★3 / bintang 3 (bukan SSR/UR), permata, tiket, tahap 3-4; bos hanya di tahap x-5. Tanpa emoji, tanpa tautan, ramah keluarga, tidak menyebut orang nyata/merek/politik, tidak pernah mengaku AI/bot. Hanya penulis dari daftar yang boleh bicara. Balas HANYA JSON.`;
const TOPIK = ['kalah di bos tahap', 'tiket dungeon habis', 'drop perlengkapan dari dungeon', 'arena: kalah sama tim yang lebih kuat / naik liga', 'stamina habis', 'banner sekarang worth atau skip', 'hero mana yang bagus buat tahap sekarang', 'elemen lawan di tahap tertentu', 'naikin senjata pakai bijih', 'misi harian', 'event login', 'ngantuk / baru bangun', 'baru pulang kerja / kuliah', 'hujan / macet', 'lagi makan', 'nanya tim orang', 'pamer CP / dapat ★3', 'kebangkitan ★4 mahal bahannya', 'sinyal jelek / lag', 'sepi amat chat', 'auto battle sambil ngerjain hal lain', 'nanya level berapa', 'bingung pilih hero buat dinaikin'];
// kata/frasa yang sudah terlalu sering muncul (biar tidak mengulang)
const STOPW = new Set('yg gk ga gak aja aj aku gw gue lu lo kamu dia itu ini di ke dan atau yang ya iya udh udah sudah juga jg lagi lg buat bisa ada tapi tp klo kalo kalau sama sm mau nih tuh sih dong deh kok jadi jd biar baru masih belum blm dulu dl bgt banget'.split(' '));
function overused(rows, n = 6) {
  const cnt = new Map();
  for (const r of rows) { if (/^:stk:/.test(r.txt)) continue; const seen = new Set(); for (const w of String(r.txt).toLowerCase().match(/[a-z0-9:_^>~<]+/g) || []) { if (w.length < 2 || STOPW.has(w) || seen.has(w)) continue; seen.add(w); cnt.set(w, (cnt.get(w) || 0) + 1) } }
  return [...cnt].filter(([, c]) => c >= 3).sort((a, b) => b[1] - a[1]).slice(0, n).map(([w]) => w);
}
async function aiChat(env, b, u) {
  if (!(await aiOnline(env))) return { ok: false, e: 'off' };
  const kind = b.kind === 'reply' ? 'reply' : 'tick', t = now();
  // penulis: hanya akun bot sungguhan, nama dari server
  const C = (Array.isArray(b.cands) ? b.cands : []).slice(0, 6).filter(c => /^\d{8}$/.test(c.uid)).map(c => ({ uid: c.uid, pub: clip(c.pub, 220), priv: clip(c.priv, 220), style: clip(c.style, 180), lower: !!c.lower, fav: clip(c.fav, 16) }));
  if (C.length < 1) return { ok: false, e: 'cands' };
  const rows = (await env.DB.prepare(`SELECT uid,uname FROM players WHERE bot IS NOT NULL AND ban=0 AND uid IN (${C.map(() => '?').join(',')})`).bind(...C.map(c => c.uid)).all()).results;
  const byUid = new Map(rows.map(r => [r.uid, r.uname])), cands = C.filter(c => byUid.has(c.uid)).map(c => ({ ...c, name: byUid.get(c.uid) }));
  if (!cands.length) return { ok: false, e: 'cands' };
  if (b.watch) await kvSet(env, 'watch_at', t);
  let humanMsg = null;
  if (kind === 'reply') {
    if (!u) return { ok: false, e: 'auth' };
    humanMsg = await env.DB.prepare('SELECT * FROM wchat WHERE uid=? ORDER BY id DESC LIMIT 1').bind(u.uid).first();
    if (!humanMsg || t - humanMsg.ts > 3e4) return { ok: false, e: 'nomsg' };
    if (+(await kvGet(env, 'air:' + u.uid) || 0) > t - 12e3) return { ok: false, e: 'fast' };
    await kvSet(env, 'air:' + u.uid, t);
    if (stkKey(humanMsg.txt) && !humanMsg.re && rnd01() < .55) return { ok: true, n: 0, skip: 'stk' };   // stiker pemain sering dicuekin, seperti chat asli
    // obrolan bot yang masih terjadwal di masa depan dibatalkan: orang-orang bereaksi ke pesan pemain dulu
    await env.DB.prepare(`DELETE FROM wchat WHERE ts>? AND uid IN (SELECT uid FROM players WHERE bot IS NOT NULL)`).bind(t + 6000).run();
    await kvSet(env, 'ai_until', t);
  } else {
    const [at, until, wat, stkAt, stkGap] = await Promise.all(['ai_scene_at', 'ai_until', 'watch_at', 'stk_at', 'stk_gap'].map(async k => +(await kvGet(env, k) || 0)));
    const hr = new Date(t + 7 * 36e5).getUTCHours(), night = hr < 6 ? 1.9 : hr < 8 || hr >= 23 ? 1.35 : 1;
    const gap = (t - wat < 6e4 ? 95e3 + (at % 50) * 1e3 : 9 * 6e4) * night;
    if (!(cands.length >= 2 && t - at >= gap && t > until - 8e3)) {
      // bot gabut kirim stiker (tanpa AI)
      if (t - stkAt < (stkGap || 12e4) || t < until) return { ok: false, skip: 1, next: Math.max(2e4, (stkGap || 12e4) - (t - stkAt)) };
      await kvSet(env, 'stk_at', t); await kvSet(env, 'stk_gap', Math.round((240 + rnd01() * 480) * 1000 * night));
      const keys = [...STK.keys()], c = cands[Math.floor(rnd01() * cands.length)];
      const own = keys.filter(k => c.fav && k.startsWith(c.fav.toLowerCase() + '_')), pool = own.length && rnd01() < .4 ? own : keys, k1 = pool[Math.floor(rnd01() * pool.length)];
      const t1 = t + Math.round(1500 + rnd01() * 5000);
      const r1 = await env.DB.prepare('INSERT INTO wchat (uid,name,txt,ts) VALUES (?,?,?,?)').bind(c.uid, c.name, `:stk:${k1}:`, t1).run();
      let n = 1;
      if (cands.length > 1 && rnd01() < .15) {   // kadang bot lain ikut nimbrung stiker
        const d = cands.filter(x => x.uid !== c.uid)[Math.floor(rnd01() * (cands.length - 1))], k2 = keys[Math.floor(rnd01() * keys.length)];
        await env.DB.prepare('INSERT INTO wchat (uid,name,txt,ts,re) VALUES (?,?,?,?,?)').bind(d.uid, d.name, `:stk:${k2}:`, t1 + Math.round(3000 + rnd01() * 8000), r1.meta.last_row_id).run(); n++;
      }
      return { ok: true, stk: n };
    }
    await kvSet(env, 'ai_scene_at', t);
  }
  if (!env.ANTHROPIC_API_KEY && !env.AI_FAKE) return { ok: false, e: 'nokey' };
  if (await bump(env, dayKey()) > +(env.AI_DAILY || 2000)) return { ok: false, e: 'quota' };
  // konteks: 16 pesan terakhir bernomor (+ balasan), ingatan tiap penulis (pesannya sendiri sebelumnya)
  const hist = (await env.DB.prepare('SELECT * FROM (SELECT * FROM wchat WHERE ts<=? ORDER BY ts DESC LIMIT 16) ORDER BY ts').bind(t).all()).results;
  const num = new Map(hist.map((h, k) => [h.id, k + 1])), idOf = new Map(hist.map((h, k) => [k + 1, h.id]));
  let quoted = null;
  if (humanMsg && humanMsg.re && !num.has(humanMsg.re)) quoted = await env.DB.prepare('SELECT * FROM wchat WHERE id=?').bind(humanMsg.re).first();
  const lines = hist.map(h => `#${num.get(h.id)} ${hhmm(h.ts)} ${h.name}${u && h.uid === u.uid ? ' (PEMAIN)' : ''}${h.re ? (num.has(h.re) ? ` (balas #${num.get(h.re)})` : ' (balas pesan lama)') : ''}: ${clip(showTxt(h.txt), 160)}`);
  const memQ = (await env.DB.prepare(`SELECT id,uid,txt,ts FROM wchat WHERE uid IN (${cands.map(() => '?').join(',')}) AND ts>? AND ts<=? ORDER BY ts DESC LIMIT 40`).bind(...cands.map(c => c.uid), t - 12 * 36e5, t).all()).results;
  const inHist = new Set(hist.map(h => h.id + ''));
  const mem = uid => memQ.filter(m => m.uid === uid && !inHist.has(String(m.id))).slice(0, 3).map(m => `"${clip(showTxt(m.txt), 70)}"`).join(', ');
  const ovAll = overused(hist), ovOf = uid => overused(memQ.filter(m => m.uid === uid).slice(0, 12), 4);
  const P = b.player || null, d = new Date(t + 7 * 36e5), HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  let user = `WAKTU: ${HARI[d.getUTCDay()]} ${hhmm(t)} WIB · ${clip(b.online, 6)} pemain online · server: ${clip(b.world, 300)}
${P ? `PEMAIN (manusia, data PUBLIK saja): ${clip(P.name, 16)} — ${clip(P.pub, 300)}\n` : ''}${b.humans ? `Pemain asli lain online: ${clip(b.humans, 200)}\n` : ''}PENULIS (pemain lain yang sedang online):
${cands.map(c => { const m = mem(c.uid), o = ovOf(c.uid); return `- ${c.name}: PUBLIK[${c.pub}] PRIBADI-hanya-dia[${c.priv}] GAYA[${c.style}]${m ? ` INGATAN[pernah bilang: ${m}]` : ''}${o.length ? ` JANGAN-ULANG[${o.join(', ')}]` : ''}` }).join('\n')}
${ovAll.length ? `Kata yang sudah terlalu sering muncul di obrolan (hindari): ${ovAll.join(', ')}\n` : ''}
STIKER: ${[...STK].map(([k, n]) => `${k}=${n}`).join('; ')}
OBROLAN (lama -> baru):
${lines.join('\n') || '(sepi)'}
`;
  if (kind === 'reply') {
    const q = /\?|gimana|bagaimana|kenapa|apa|siapa|berapa|mana|kapan|bisa gak|ada yg|ada yang/i.test(humanMsg.txt), x = rnd01();
    const nWho = q ? (x < .55 ? 1 : x < .9 ? 2 : 3) : (x < .75 ? 1 : 2), nRep = nWho === 1 ? '1-2' : nWho === 2 ? '2-3' : '2-4';
    const target = humanMsg.re && hist.find(h => h.id === humanMsg.re), tName = target ? target.name : quoted ? quoted.name : null;
    user += `\nPESAN BARU #${num.get(humanMsg.id) || '?'} dari PEMAIN ${clip(P?.name || u.uname, 16)}: "${clip(showTxt(humanMsg.txt), 120)}"${humanMsg.re ? ` — membalas ${target ? '#' + num.get(target.id) : `pesan lama ${quoted ? quoted.name + ': "' + clip(showTxt(quoted.txt), 80) + '"' : ''}`}` : ''}
Tulis ${nRep} pesan balasan dari paling banyak ${nWho} penulis yang paling wajar menanggapi${tName ? ` (${tName} yang dibalas sebaiknya menjawab bila ada di daftar)` : ''}. Pertanyaan dijawab benar & singkat dengan gaya masing-masing; sapaan cukup dibalas pendek ("halo", "yo", "malam") oleh satu orang; candaan/stiker cukup "wkwk" atau stiker, atau tidak usah. Boleh tanpa menyebut nama pemain. Yang lain boleh tetap lanjut obrolannya sendiri. Isi "re" hanya bila menanggapi pesan yang bukan pesan terakhir. delay = detik mengetik 3-15.
JSON: {"out":[{"who":"nama","text":"...","re":null,"stk":"","delay":5}]}`;
  } else { const tp = [TOPIK[Math.floor(rnd01() * TOPIK.length)], TOPIK[Math.floor(rnd01() * TOPIK.length)]];
    user += `\nTulis KELANJUTAN obrolan: ${clip(b.n, 4) || '2-5'} pesan dari 2-3 penulis. Kalau obrolan terakhir masih hangat (kurang dari 10 menit), lanjutkan secara wajar; kalau sudah basi atau sepi, mulai hal baru dari SEDANG seseorang atau ide ini: ${tp.join(' / ')}. Pesan pendek, tidak semua orang menjawab hal yang sama, tidak saling menyebut nama. Isi "re" hanya bila menanggapi pesan yang bukan pesan terakhir. delay = detik sejak pesan sebelumnya 5-40.`;
    user += `
JSON: {"out":[{"who":"nama","text":"...","re":null,"stk":"","delay":6}]}`;
  }
  let out;
  try {
    const r = await callClaude(env, user, kind === 'reply' ? 280 : 400, ROLE);
    const m = String(r.text).match(/\{[\s\S]*\}/); let o = null; try { o = m ? JSON.parse(m[0]) : null } catch (e) { }
    out = (o && o.out || []).slice(0, 8);
  } catch (e) { if (kind === 'tick') await kvSet(env, 'ai_scene_at', t - 6e4); return { ok: false, e: 'ai', m: String(e.message).slice(0, 120) } }
  const byName = new Map(cands.map(c => [c.name.toLowerCase(), c]));
  let tt = t + (kind === 'reply' ? 1500 : 2500); const st = [];
  for (const x of out) {
    const c = byName.get(String(x.who || '').toLowerCase()); if (!c) continue;
    const re = idOf.get(+x.re) || null, delay = Math.max(1, Math.min(40, +x.delay || 4)) * 1000;
    if (x.stk && STK.has(String(x.stk))) { tt += delay; st.push(env.DB.prepare('INSERT INTO wchat (uid,name,txt,ts,re) VALUES (?,?,?,?,?)').bind(c.uid, c.name, `:stk:${x.stk}:`, Math.round(tt), re)); continue }
    let txt = clip(x.text, 260).replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '').replace(/https?\S+/g, '').trim(); if (!txt) continue;
    txt = txt.replace(/(^|\s)(:3|qwq|uwu|owo|>_<|\^\^|\^_\^|desu|nya|sugoi|yabai|yosh|kawaii)(?=\s|$|[.,!?])/gi, ' ').replace(/\s+(ne|nee)\s*([.!?]*)$/i, '$2').replace(/~+/g, '').replace(/\s{2,}/g, ' ').trim(); if (!txt) continue;   // buang sisa gaya wibu
    if (c.lower) txt = txt.toLowerCase();
    chunks(txt).forEach((part, k) => { tt += (k ? 1800 : delay) + part.length * 85; st.push(env.DB.prepare('INSERT INTO wchat (uid,name,txt,ts,re) VALUES (?,?,?,?,?)').bind(c.uid, c.name, part.slice(0, 140), Math.round(tt), k ? null : re)) });
  }
  if (st.length) await env.DB.batch(st.slice(0, 16));
  if (kind === 'tick') await kvSet(env, 'ai_until', Math.round(tt));
  return { ok: true, n: st.length, until: Math.round(tt) };
}

/* ---------------- sesi ---------------- */
async function auth(env, body) {
  const tok = String(body?.tok || '');
  if (tok.length !== 48) return null;
  const r = await env.DB.prepare('SELECT p.* FROM sessions s JOIN players p ON p.uid=s.uid WHERE s.tok=?').bind(await sha(tok)).first();
  return r && r.bot == null ? r : null;
}
async function newSession(env, uid) {
  const tok = hex(rnd(24));
  await env.DB.batch([
    env.DB.prepare('INSERT INTO sessions (tok,uid,ts) VALUES (?,?,?)').bind(await sha(tok), uid, now()),
    env.DB.prepare('UPDATE players SET last=? WHERE uid=?').bind(now(), uid),
    env.DB.prepare('DELETE FROM sessions WHERE uid=? AND tok NOT IN (SELECT tok FROM sessions WHERE uid=? ORDER BY ts DESC LIMIT 5)').bind(uid, uid),
  ]);
  return tok;
}
async function failCount(env, key, add) {
  const k = 'lf:' + key, v = pj(await kvGet(env, k), { n: 0, t: 0 }), t = now();
  if (t - v.t > 10 * 6e4) { v.n = 0; v.t = t }
  if (add) { v.n++; await kvSet(env, k, JSON.stringify(v)) }
  return v.n;
}

/* ---------------- ringkasan pemain ---------------- */
const card = p => { const pr = pj(p.prof, {}), ov = pj(p.ov, {}); return { uid: p.uid, u: p.uname, bot: p.bot, lv: ov.lv ?? p.lv, cp: ov.cp ?? p.cp, vip: ov.vip ?? pr.vip ?? 0, top: pr.top || null, last: p.last, on: p.bot == null && now() - p.last < ONLINE_MS } };
const byKey = (env, q) => /^\d{8}$/.test(q) ? env.DB.prepare('SELECT * FROM players WHERE uid=?').bind(q).first() : env.DB.prepare('SELECT * FROM players WHERE uname=? COLLATE NOCASE').bind(q).first();
async function friendRow(env, x, y) { const [a, b] = pair(x, y); return env.DB.prepare('SELECT * FROM friends WHERE a=? AND b=?').bind(a, b).first() }
async function counts(env, uid) {
  const [dm, fr] = await Promise.all([
    env.DB.prepare('SELECT COUNT(*) n FROM dms WHERE too=? AND rd=0').bind(uid).first(),
    env.DB.prepare("SELECT COUNT(*) n FROM friends WHERE (a=? OR b=?) AND st='req' AND frm<>?").bind(uid, uid, uid).first(),
  ]);
  return { dm: dm.n, fr: fr.n };
}

/* ---------------- HTTP API ---------------- */
export async function gameRoute(req, env, url, json) {
  const p = url.pathname;
  let b = {};
  if (req.method === 'POST') { try { b = JSON.parse(await req.text() || '{}') } catch (e) { return json({ ok: false, e: 'json' }, 400) } }
  const fail = (e, s = 400) => json({ ok: false, e }, s);
  const me = async () => { const u = await auth(env, b); if (!u) return [null, fail('auth', 401)]; if (u.ban) return [null, fail('ban', 403)]; return [u, null] };

  // ---- akun ----
  if (p === '/api/acc/register') {
    const u = String(b.u || '').trim(), pw = String(b.p || '');
    if (!NAME_RE.test(u)) return fail('uname');
    if (pw.length < 6 || pw.length > 64) return fail('pw');
    if (BOTCFG.heroNames.includes(u.toLowerCase())) return fail('taken');
    if (await env.DB.prepare('SELECT 1 FROM players WHERE uname=? COLLATE NOCASE').bind(u).first()) return fail('taken');
    const salt = hex(rnd(12)), ph = await pwHash(pw, salt);
    let uid = newUid();
    for (let k = 0; k < 5 && await env.DB.prepare('SELECT 1 FROM players WHERE uid=?').bind(uid).first(); k++) uid = newUid();
    const sv = b.save ? 1 : 0, save = b.save ? JSON.stringify(b.save).slice(0, 400000) : null;
    try { await env.DB.prepare('INSERT INTO players (uid,uname,ph,salt,created,last,sv,save,lv,cp,prof) VALUES (?,?,?,?,?,?,?,?,?,?,?)').bind(uid, u, 'p2$' + ph, salt, now(), now(), sv, save, +b.prof?.lv || 1, +b.prof?.cp || 0, b.prof ? JSON.stringify(b.prof).slice(0, 20000) : null).run() }
    catch (e) { return fail('taken') }
    return json({ ok: true, tok: await newSession(env, uid), uid, u, sv });
  }
  if (p === '/api/acc/login') {
    const u = String(b.u || '').trim(), pw = String(b.p || '');
    if (!u || !pw) return fail('empty');
    if (await failCount(env, u.toLowerCase(), false) >= 8) return fail('slow', 429);
    const r = await byKey(env, u);
    if (!r) { await failCount(env, u.toLowerCase(), true); return fail('cred', 401) }
    if (r.bot != null) return fail('botacc', 403);
    if ((r.ph || '').slice(3) !== await pwHash(pw, r.salt)) { await failCount(env, u.toLowerCase(), true); return fail('cred', 401) }
    if (r.ban) return fail('ban', 403);
    return json({ ok: true, tok: await newSession(env, r.uid), uid: r.uid, u: r.uname, sv: r.sv, save: pj(r.save), gm: r.gm ? 1 : 0 });
  }
  if (p === '/api/acc/logout') { if (b.tok) await env.DB.prepare('DELETE FROM sessions WHERE tok=?').bind(await sha(String(b.tok))).run(); return json({ ok: true }) }
  if (p === '/api/acc/pw') {
    const [u, f] = await me(); if (f) return f;
    if ((u.ph || '').slice(3) !== await pwHash(String(b.old || ''), u.salt)) return fail('cred', 401);
    const pw = String(b.p || ''); if (pw.length < 6 || pw.length > 64) return fail('pw');
    const salt = hex(rnd(12));
    await env.DB.prepare('UPDATE players SET ph=?, salt=? WHERE uid=?').bind('p2$' + await pwHash(pw, salt), salt, u.uid).run();
    return json({ ok: true });
  }

  // ---- simpanan cloud ----
  if (p === '/api/save') {
    const [u, f] = await me(); if (f) return f;
    if (+b.base !== u.sv) return json({ ok: false, conflict: 1, sv: u.sv, save: pj(u.save) });
    const s = JSON.stringify(b.save || null); if (s.length > 400000) return fail('big');
    const pr = b.prof || {}, sv = u.sv + 1;
    const r = await env.DB.prepare('UPDATE players SET save=?, sv=?, lv=?, cp=?, prof=?, last=? WHERE uid=? AND sv=?').bind(s, sv, Math.max(1, +pr.lv || 1), Math.max(0, Math.round(+pr.cp || 0)), JSON.stringify(pr).slice(0, 20000), now(), u.uid, u.sv).run();
    if (!r.meta.changes) return json({ ok: false, conflict: 1 });
    return json({ ok: true, sv });
  }
  if (p === '/api/load') { const [u, f] = await me(); if (f) return f; return json({ ok: true, sv: u.sv, save: pj(u.save), u: u.uname, gm: u.gm ? 1 : 0 }) }
  if (p === '/api/ping') {
    const [u, f] = await me(); if (f) return f;
    const [c, w, wc, ai] = await Promise.all([counts(env, u.uid), getWorld(env), env.DB.prepare('SELECT COALESCE(MAX(ts),0) m FROM wchat WHERE ts<=?').bind(now()).first(), aiOnline(env), env.DB.prepare('UPDATE players SET last=? WHERE uid=?').bind(now(), u.uid).run()]);
    return json({ ok: true, sv: u.sv, u: u.uname, gm: u.gm ? 1 : 0, ...c, wc: wc.m, ai, gen: w.gen, epoch: w.epoch, t: now() });
  }

  // ---- dunia & pemain ----
  if (p === '/api/world') {
    const w = await getWorld(env); await ensureBots(env, w);
    const from = Math.max(0, +url.searchParams.get('from') || 0);
    const { results } = await env.DB.prepare('SELECT bot,uid,uname FROM players WHERE bot IS NOT NULL AND bot>=? ORDER BY bot LIMIT 12000').bind(from).all();
    const ov = (await env.DB.prepare('SELECT bot,ov FROM players WHERE bot IS NOT NULL AND ov IS NOT NULL').all()).results;
    return json({ ok: true, epoch: w.epoch, gen: w.gen, from, bots: results.map(r => [r.uid, r.uname]), ov: Object.fromEntries(ov.map(r => [r.bot, pj(r.ov, {})])) });
  }
  if (p === '/api/players') {
    const { results } = await env.DB.prepare('SELECT uid,uname,bot,lv,cp,prof,ov,last FROM players WHERE bot IS NULL AND ban=0 AND gm=0 AND last>? ORDER BY cp DESC LIMIT 500').bind(now() - 45 * DAY).all();
    return json({ ok: true, list: results.map(card) });
  }
  if (p === '/api/prof') {
    const r = await byKey(env, String(b.uid || url.searchParams.get('uid') || ''));
    if (!r || (r.ban && r.bot == null)) return fail('none', 404);
    return json({ ok: true, ...card(r), created: r.created, prof: r.bot == null ? pj(r.prof, {}) : null, ov: pj(r.ov, {}) });
  }
  if (p === '/api/find') {
    const q = String(url.searchParams.get('q') || b.q || '').trim().slice(0, 14);
    if (q.length < 2) return json({ ok: true, list: [] });
    const { results } = /^\d{8}$/.test(q) ? await env.DB.prepare('SELECT * FROM players WHERE uid=?').bind(q).all()
      : await env.DB.prepare("SELECT * FROM players WHERE uname LIKE ? ESCAPE '\\' COLLATE NOCASE AND ban=0 ORDER BY (bot IS NULL) DESC, length(uname) LIMIT 15").bind(q.replace(/[%_\\]/g, '\\$&') + '%').all();
    return json({ ok: true, list: results.filter(r => !r.ban).map(card) });
  }
  if (p === '/api/bots/snap') {   // potret bot dari game (untuk dilihat admin di Telegram)
    const [u, f] = await me(); if (f) return f;
    const L = Array.isArray(b.list) ? b.list.slice(0, 120) : [], t = now();
    const st = L.filter(o => Number.isInteger(o.i) && o.i >= 0).map(o => env.DB.prepare('UPDATE players SET lv=?, cp=?, prof=? WHERE bot=?').bind(Math.max(1, +o.lv || 1), Math.max(0, Math.round(+o.cp || 0)), JSON.stringify({ ...o, at: t }).slice(0, 4000), o.i));
    for (let k = 0; k < st.length; k += 40) await env.DB.batch(st.slice(k, k + 40));
    return json({ ok: true, n: st.length });
  }

  // ---- teman ----
  if (p.startsWith('/api/fr/')) {
    const [u, f] = await me(); if (f) return f;
    const act = p.slice(8);
    if (act === 'list') {
      const { results } = await env.DB.prepare('SELECT f.*, p.uid puid, p.uname, p.bot, p.lv, p.cp, p.prof, p.ov, p.last FROM friends f JOIN players p ON p.uid = (CASE WHEN f.a=? THEN f.b ELSE f.a END) WHERE (f.a=? OR f.b=?) AND f.st IN (\'ok\',\'req\') ORDER BY f.ts DESC LIMIT 300').bind(u.uid, u.uid, u.uid).all();
      const out = { friends: [], inc: [], out: [] };
      for (const r of results) { const c = { ...card({ ...r, uid: r.puid }), ts: r.ts }; if (r.st === 'ok') out.friends.push(c); else (r.frm === u.uid ? out.out : out.inc).push(c) }
      return json({ ok: true, ...out });
    }
    const to = String(b.uid || '');
    const o = await env.DB.prepare('SELECT * FROM players WHERE uid=?').bind(to).first();
    if (!o || o.uid === u.uid) return fail('none', 404);
    const [a, c] = pair(u.uid, o.uid), row = await friendRow(env, u.uid, o.uid);
    const put = (frm, st) => env.DB.prepare('INSERT INTO friends (a,b,frm,st,ts) VALUES (?,?,?,?,?) ON CONFLICT(a,b) DO UPDATE SET frm=excluded.frm, st=excluded.st, ts=excluded.ts').bind(a, c, frm, st, now()).run();
    if (act === 'add') {
      if (row?.st === 'ok') return json({ ok: true, st: 'ok' });
      if (row?.st === 'req' && row.frm === o.uid) { await put(o.uid, 'ok'); return json({ ok: true, st: 'ok' }) }
      const n = await env.DB.prepare("SELECT COUNT(*) n FROM friends WHERE (a=? OR b=?) AND st='ok'").bind(u.uid, u.uid).first();
      if (n.n >= 100) return fail('full');
      await put(u.uid, 'req'); return json({ ok: true, st: 'req' });
    }
    if (act === 'resp') {   // terima / tolak permintaan masuk
      if (!row || row.st !== 'req' || row.frm !== o.uid) return fail('none', 404);
      if (b.ok) await put(o.uid, 'ok'); else await put(o.uid, 'rej');
      return json({ ok: true, st: b.ok ? 'ok' : 'rej' });
    }
    if (act === 'del') { if (row) await env.DB.prepare('DELETE FROM friends WHERE a=? AND b=?').bind(a, c).run(); return json({ ok: true }) }
    if (act === 'bot') {    // tindakan bot (dihitung game secara deterministik): bot meminta pertemanan / bot menjawab permintaanku
      if (o.bot == null || o.ban) return fail('notbot');
      if (b.act === 'req') { if (row) return json({ ok: true, st: row.st }); await put(o.uid, 'req'); return json({ ok: true, st: 'req' }) }
      if (!row || row.st !== 'req' || row.frm !== u.uid) return json({ ok: true, st: row?.st || null });
      await put(u.uid, b.act === 'ok' ? 'ok' : 'rej'); return json({ ok: true, st: b.act === 'ok' ? 'ok' : 'rej' });
    }
    return fail('act', 404);
  }

  // ---- pesan 1:1 ----
  if (p.startsWith('/api/dm/')) {
    const [u, f] = await me(); if (f) return f;
    const act = p.slice(8);
    if (act === 'threads') {
      const { results } = await env.DB.prepare(`SELECT d.*, p.uname, p.bot, p.lv, p.cp, p.prof, p.ov, p.last plast, p.uid puid FROM dms d JOIN (SELECT MAX(id) m FROM dms WHERE frm=? OR too=? GROUP BY CASE WHEN frm=? THEN too ELSE frm END) x ON x.m=d.id
        JOIN players p ON p.uid = CASE WHEN d.frm=? THEN d.too ELSE d.frm END ORDER BY d.id DESC LIMIT 50`).bind(u.uid, u.uid, u.uid, u.uid).all();
      const un = (await env.DB.prepare('SELECT frm, COUNT(*) n FROM dms WHERE too=? AND rd=0 GROUP BY frm').bind(u.uid).all()).results;
      const U = Object.fromEntries(un.map(r => [r.frm, r.n]));
      return json({ ok: true, list: results.map(r => ({ ...card({ ...r, uid: r.puid, last: r.plast }), msg: { txt: r.txt, ts: r.ts, me: r.frm === u.uid }, unread: U[r.puid] || 0 })) });
    }
    const w = String(b.uid || '');
    if (act === 'get') {
      const after = Math.max(0, +b.after || 0);
      const { results } = await env.DB.prepare('SELECT * FROM (SELECT * FROM dms WHERE ((frm=? AND too=?) OR (frm=? AND too=?)) AND id>? ORDER BY id DESC LIMIT 80) ORDER BY id').bind(u.uid, w, w, u.uid, after).all();
      if (results.some(r => r.too === u.uid && !r.rd)) await env.DB.prepare('UPDATE dms SET rd=1 WHERE frm=? AND too=? AND rd=0').bind(w, u.uid).run();
      const rd = await env.DB.prepare('SELECT COALESCE(MAX(id),0) m FROM dms WHERE frm=? AND too=? AND rd=1').bind(u.uid, w).first();
      return json({ ok: true, list: results.map(r => ({ id: r.id, me: r.frm === u.uid, txt: r.txt, ts: r.ts })), seen: rd.m });
    }
    if (act === 'send') {
      const txt = clean(b.txt, 300); if (!txt) return fail('empty');
      const row = await friendRow(env, u.uid, w); if (!row || row.st !== 'ok') return fail('notfriend', 403);
      const last = await env.DB.prepare('SELECT ts FROM dms WHERE frm=? ORDER BY id DESC LIMIT 1').bind(u.uid).first();
      if (last && now() - last.ts < 700) return fail('fast', 429);
      const r = await env.DB.prepare('INSERT INTO dms (frm,too,txt,ts) VALUES (?,?,?,?)').bind(u.uid, w, txt, now()).run();
      return json({ ok: true, id: r.meta.last_row_id, ts: now() });
    }
    return fail('act', 404);
  }

  // ---- obrolan dunia ---- (dibaca per waktu: ?since=<ts>; pesan berjadwal baru muncul saat waktunya tiba)
  if (p === '/api/wc/ai') { let u = null; if (b.tok) { u = await auth(env, b); if (u?.ban) u = null } return json(await aiChat(env, b, u)) }
  if (p === '/api/wc') {
    if (req.method === 'GET') {
      const since = Math.max(0, +url.searchParams.get('since') || 0), t = now();
      const SEL = 'SELECT w.*, p.prof, p.uname cur, q.name qn, q.txt qt FROM wchat w LEFT JOIN players p ON p.uid=w.uid LEFT JOIN wchat q ON q.id=w.re';
      const q = since ? env.DB.prepare(SEL + ' WHERE w.ts>=? AND w.ts<=? ORDER BY w.ts, w.id LIMIT 80').bind(since, t)
        : env.DB.prepare('SELECT * FROM (' + SEL + ' WHERE w.ts<=? ORDER BY w.ts DESC LIMIT 60) ORDER BY ts, id').bind(t);
      const { results } = await q.all();
      return json({ ok: true, t, ai: await aiOnline(env), list: results.map(r => ({ id: r.id, uid: r.uid, u: r.cur || r.name, txt: r.txt, ts: r.ts, re: r.re || null, q: r.re && r.qn ? { u: r.qn, t: String(r.qt).slice(0, 60) } : null, vip: pj(r.prof, {}).vip || 0, top: pj(r.prof, {}).top || null })) });
    }
    const [u, f] = await me(); if (f) return f;
    const txt = clean(b.txt, 120); if (!txt) return fail('empty');
    if (txt.startsWith(':stk:') && !stkKey(txt)) return fail('stk');
    const last = await env.DB.prepare('SELECT ts FROM wchat WHERE uid=? ORDER BY id DESC LIMIT 1').bind(u.uid).first();
    if (last && now() - last.ts < 1500) return fail('fast', 429);
    const re = Number.isInteger(+b.re) && +b.re > 0 && await env.DB.prepare('SELECT id FROM wchat WHERE id=? AND ts<=?').bind(+b.re, now()).first() ? +b.re : null;
    const r = await env.DB.prepare('INSERT INTO wchat (uid,name,txt,ts,re) VALUES (?,?,?,?,?)').bind(u.uid, u.uname, txt, now(), re).run();
    if (r.meta.last_row_id % 50 === 0) await env.DB.prepare('DELETE FROM wchat WHERE id < ?').bind(r.meta.last_row_id - 1500).run();
    return json({ ok: true, id: r.meta.last_row_id, ts: now() });
  }
  return null;
}

/* =====================================================================
   ADMIN TELEGRAM (pemilik saja) — cek & ubah akun lewat UID atau username
   ===================================================================== */
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fmt = n => Math.round(+n || 0).toLocaleString('id-ID');
const when = ms => ms ? new Date(ms).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB' : '-';
const ago = ms => { if (!ms) return 'belum pernah'; const m = Math.floor((now() - ms) / 6e4); return m < 1 ? 'baru saja' : m < 60 ? m + ' menit lalu' : m < 1440 ? Math.floor(m / 60) + ' jam lalu' : Math.floor(m / 1440) + ' hari lalu' };
// kolom yang bisa diubah lewat tombol
const H_FIELDS = { gems: 'Permata', gold: 'Emas', lv: 'Level', stam: 'Stamina', tixH: 'Tiket Hero', tixW: 'Tiket Senjata', uname: 'Username', pw: 'Password' };
const B_FIELDS = { uname: 'Username', lv: 'Level', cp: 'CP', vip: 'VIP' };
const ADMIN_HELP = `🛠 <b>Admin Aster Chronicles</b>\n\n• /akun &lt;UID|username&gt; — lihat & ubah akun (pemain atau bot)\n• /cari &lt;teks&gt; — cari username\n• /pemain — daftar pemain asli\n• /set &lt;UID|username&gt; &lt;kolom&gt; &lt;nilai&gt; — ubah apa saja\n   pemain: kolom di data simpanan, mis. <code>gems</code>, <code>heroes.nami.lv</code>, <code>mats.crys</code>\n   bot: <code>lv</code>, <code>cp</code>, <code>vip</code>, <code>uname</code>\n   nilai <code>hapus</code> = menghapus kolom\n• /data &lt;UID|username&gt; — file JSON data simpanan\n• /gm &lt;UID|username&gt; — jadikan/cabut GM (akun testing tanpa batas); /gm saja = daftar GM\n• /resetbot — reset semua bot ke hari 1\n• /ai on|off — Mode AI Obrolan Dunia (Claude Haiku 5.5)\n\nKetik UID (8 angka) atau username saja juga bisa.`;

function setPath(o, path, v) {
  const ks = path.split('.').filter(Boolean); if (!ks.length) return false;
  let x = o; for (let k = 0; k < ks.length - 1; k++) { if (x[ks[k]] == null || typeof x[ks[k]] !== 'object') x[ks[k]] = {}; x = x[ks[k]] }
  if (v === undefined) delete x[ks[ks.length - 1]]; else x[ks[ks.length - 1]] = v; return true;
}
const getPath = (o, path) => path.split('.').filter(Boolean).reduce((x, k) => x == null ? undefined : x[k], o);
const parseVal = s => { s = String(s).trim(); if (/^hapus$/i.test(s)) return undefined; if (/^-?\d+(\.\d+)?$/.test(s)) return +s; if (/^(true|false|null)$/.test(s)) return JSON.parse(s); if (/^[[{"]/.test(s)) { try { return JSON.parse(s) } catch (e) { } } return s };

async function accCard(env, r) {
  if (r.bot != null) {
    const pr = pj(r.prof, null), ov = pj(r.ov, {}), w = await getWorld(env);
    const fr = await env.DB.prepare("SELECT COUNT(*) n FROM friends WHERE (a=? OR b=?) AND st='ok'").bind(r.uid, r.uid).first();
    return `🤖 <b>Akun Bot #${r.bot + 1}</b>\n\n🆔 UID: <code>${r.uid}</code>\n👤 Username: <b>${esc(r.uname)}</b>\n🔑 Password: acak (hanya hash yang disimpan, tidak bisa login)\n📅 Bergabung: ${when(r.created)}\n🌍 Dunia bot generasi ${w.gen}\n👥 Teman: ${fr.n}` +
      (pr ? `\n\n📊 <b>Data terakhir dari game</b> (${ago(pr.at)})\n• Level ${fmt(ov.lv ?? pr.lv)} · CP ${fmt(ov.cp ?? pr.cp)} · VIP ${ov.vip ?? pr.vip ?? 0}\n• Tahap ${esc(pr.stage || '-')} · ${pr.online ? '🟢 online' : 'offline'}\n• Tim: ${esc((pr.team || []).join(', ') || '-')}` : '\n\n📊 Belum ada potret dari game (muncul setelah ada pemain membuka Peringkat).') +
      (Object.keys(ov).length ? `\n\n✏️ <b>Ubahan admin</b>: ${esc(Object.entries(ov).map(([k, v]) => k + '=' + v).join(', '))}` : '') + (r.ban ? '\n\n🚫 <b>DISEMBUNYIKAN</b> dari game' : '');
  }
  const s = pj(r.save, {}) || {}, pr = pj(r.prof, {}) || {};
  const fr = await env.DB.prepare("SELECT COUNT(*) n FROM friends WHERE (a=? OR b=?) AND st='ok'").bind(r.uid, r.uid).first();
  const ses = await env.DB.prepare('SELECT COUNT(*) n FROM sessions WHERE uid=?').bind(r.uid).first();
  return `👤 <b>Akun Pemain</b>${r.gm ? ' · 🛡 <b>GM</b>' : ''}\n\n🆔 UID: <code>${r.uid}</code>\n👤 Username: <b>${esc(r.uname)}</b>\n🔑 Password: tersimpan sebagai hash (bisa diganti)\n📅 Daftar: ${when(r.created)}\n🕒 Terakhir aktif: ${ago(r.last)}${now() - r.last < ONLINE_MS ? ' 🟢' : ''}\n📱 Sesi login: ${ses.n} · 👥 Teman: ${fr.n}\n\n` +
    `⭐ Level <b>${fmt(s.lv ?? r.lv)}</b> · CP <b>${fmt(pr.cp ?? r.cp)}</b> · VIP ${pr.vip || 0}\n💎 Permata: <b>${fmt(s.gems)}</b>\n🪙 Emas: <b>${fmt(s.gold)}</b>\n⚡ Stamina: ${fmt(s.stam)}\n🎟 Tiket Hero ${fmt(s.tixH)} · Tiket Senjata ${fmt(s.tixW)}\n🦸 Hero: ${Object.keys(s.heroes || {}).length} · 🗡 Senjata: ${Object.keys(s.weapons || {}).length}\n🗺 Tahap: ${esc(pr.stage || '-')}\n💾 Versi data: ${r.sv}` + (r.ban ? '\n\n🚫 <b>DIBLOKIR</b>' : '');
}
function accKb(r) {
  const F = r.bot != null ? B_FIELDS : H_FIELDS, ks = Object.keys(F), rows = [];
  for (let k = 0; k < ks.length; k += 3) rows.push(ks.slice(k, k + 3).map(f => ({ text: '✏️ ' + F[f], callback_data: `ed:${r.uid}:${f}` })));
  rows.push([{ text: r.ban ? (r.bot != null ? '👁 Tampilkan' : '✅ Buka blokir') : (r.bot != null ? '🙈 Sembunyikan' : '🚫 Blokir'), callback_data: `ban:${r.uid}` }, { text: '🔄 Muat ulang', callback_data: `acc:${r.uid}` }]);
  if (r.bot == null) rows.push([{ text: r.gm ? '🛡 Cabut GM' : '🛡 Jadikan GM', callback_data: `gm:${r.uid}` }]);
  if (r.bot == null) rows.push([{ text: '📄 Data JSON', callback_data: `dat:${r.uid}` }, { text: '👥 Teman', callback_data: `frl:${r.uid}` }]);
  else rows.push([{ text: '👥 Teman', callback_data: `frl:${r.uid}` }]);
  return { inline_keyboard: rows };
}
async function showAcc(env, chat, send, q) {
  await ensureBots(env);
  const r = await byKey(env, String(q).trim());
  if (!r) return send(env, chat, `❓ Akun <b>${esc(q)}</b> tidak ditemukan. Coba /cari ${esc(String(q).slice(0, 4))}`);
  return send(env, chat, await accCard(env, r), accKb(r));
}
// terapkan ubahan ke akun (dipakai tombol & /set)
async function applyEdit(env, r, path, v) {
  if (path === 'uname') {
    const nm = String(v ?? '').trim();
    if (!(r.bot != null ? /^[A-Za-z0-9]{3,14}$/ : NAME_RE).test(nm)) throw new Error('username harus 3-12 huruf/angka tanpa spasi');
    const o = await env.DB.prepare('SELECT uid FROM players WHERE uname=? COLLATE NOCASE').bind(nm).first();
    if (o && o.uid !== r.uid) throw new Error('username sudah dipakai');
    if (r.bot == null) { const s = pj(r.save, null); if (s) { s.name = nm; await env.DB.prepare('UPDATE players SET uname=?, save=?, sv=sv+1 WHERE uid=?').bind(nm, JSON.stringify(s), r.uid).run(); return } }
    await env.DB.prepare('UPDATE players SET uname=? WHERE uid=?').bind(nm, r.uid).run(); return;
  }
  if (path === 'pw') {
    if (r.bot != null) throw new Error('akun bot tidak bisa dipakai login');
    const pw = String(v ?? ''); if (pw.length < 6) throw new Error('password minimal 6 karakter');
    const salt = hex(rnd(12));
    await env.DB.batch([env.DB.prepare('UPDATE players SET ph=?, salt=? WHERE uid=?').bind('p2$' + await pwHash(pw, salt), salt, r.uid), env.DB.prepare('DELETE FROM sessions WHERE uid=?').bind(r.uid)]);
    return;
  }
  if (r.bot != null) {
    if (!['lv', 'cp', 'vip'].includes(path)) throw new Error('kolom bot yang bisa diubah: lv, cp, vip, uname');
    const ov = pj(r.ov, {}); if (v === undefined) delete ov[path]; else { if (!Number.isFinite(+v) || +v < 0) throw new Error('nilai harus angka'); ov[path] = Math.round(+v) }
    await env.DB.prepare('UPDATE players SET ov=? WHERE uid=?').bind(Object.keys(ov).length ? JSON.stringify(ov) : null, r.uid).run(); return;
  }
  const s = pj(r.save, null); if (!s) throw new Error('pemain ini belum punya data simpanan');
  setPath(s, path, v);
  await env.DB.prepare('UPDATE players SET save=?, sv=sv+1, lv=? WHERE uid=?').bind(JSON.stringify(s), Math.max(1, +s.lv || 1), r.uid).run();
}
async function sendDoc(env, chat, name, text, caption) {
  if (env.TG_LOG) { (globalThis.__out ||= []).push({ method: 'sendDocument', chat_id: chat, name, caption, size: text.length }); return }
  const fd = new FormData(); fd.append('chat_id', String(chat)); fd.append('caption', caption || ''); fd.append('document', new Blob([text], { type: 'application/json' }), name);
  await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendDocument`, { method: 'POST', body: fd });
}
export async function adminMessage(env, chat, t, low, send) {
  const flow = await kvGet(env, 'flow');
  if (flow && flow.startsWith('ed:') && !t.startsWith('/')) {          // jawaban untuk tombol ✏️
    const [, uid, field] = flow.split(':'); await kvSet(env, 'flow', null);
    const r = await byKey(env, uid); if (!r) return send(env, chat, 'Akun tidak ditemukan.'), true;
    try {
      const v = field === 'uname' || field === 'pw' ? t : parseVal(t);
      if (H_FIELDS[field] && !['uname', 'pw'].includes(field) && !Number.isFinite(v)) throw new Error('nilai harus angka');
      await applyEdit(env, r, field, v);
    } catch (e) { await send(env, chat, `❌ Gagal: ${esc(e.message)}`); return true }
    await send(env, chat, `✅ ${(r.bot != null ? B_FIELDS : H_FIELDS)[field]} <b>${esc(r.uname)}</b> diubah.${r.bot == null && field !== 'pw' && field !== 'uname' ? '\nGame pemain ini akan memuat data baru dalam ±20 detik.' : ''}${field === 'pw' ? '\nSemua sesi login akun ini dikeluarkan.' : ''}`);
    await showAcc(env, chat, send, uid); return true;
  }
  let m;
  if (low === '/admin' || low === '/game') { await send(env, chat, ADMIN_HELP); return true }
  if ((m = t.match(/^\/akun(?:@\w+)?\s+(\S+)/i)) || (m = t.match(/^(\d{8})$/))) { await showAcc(env, chat, send, m[1]); return true }
  if (/^\/akun(?:@\w+)?$/i.test(t)) { await send(env, chat, 'Ketik /akun diikuti UID atau username, mis. <code>/akun Yuze1305</code>'); return true }
  if ((m = t.match(/^\/cari(?:@\w+)?\s+(\S+)/i))) {
    await ensureBots(env);
    const q = m[1].replace(/[%_\\]/g, '\\$&');
    const { results } = await env.DB.prepare("SELECT uid,uname,bot,lv,cp,last,ban FROM players WHERE uname LIKE ? ESCAPE '\\' COLLATE NOCASE ORDER BY (bot IS NULL) DESC, length(uname) LIMIT 20").bind('%' + q + '%').all();
    await send(env, chat, results.length ? `🔎 <b>Hasil "${esc(m[1])}"</b>\n\n` + results.map(r => `${r.bot == null ? '👤' : '🤖'} <code>${r.uid}</code> ${esc(r.uname)} · Lv ${r.lv}${r.ban ? ' 🚫' : ''}`).join('\n') + '\n\nKetuk UID untuk menyalin, lalu kirim untuk membuka akunnya.' : `Tidak ada username berisi "${esc(m[1])}".`);
    return true;
  }
  if (/^\/pemain(?:@\w+)?$/i.test(t)) {
    const { results } = await env.DB.prepare('SELECT uid,uname,lv,cp,last,ban,created FROM players WHERE bot IS NULL ORDER BY last DESC LIMIT 40').all();
    const tot = await env.DB.prepare('SELECT SUM(bot IS NULL) h, SUM(bot IS NOT NULL) b FROM players').first();
    await send(env, chat, `👥 <b>Pemain asli</b>: ${tot.h || 0} · 🤖 Bot: ${tot.b || 0}\n\n` + (results.length ? results.map(r => `${now() - r.last < ONLINE_MS ? '🟢' : '⚪'} <code>${r.uid}</code> <b>${esc(r.uname)}</b> · Lv ${r.lv} · CP ${fmt(r.cp)} · ${ago(r.last)}${r.ban ? ' 🚫' : ''}`).join('\n') : 'Belum ada pemain yang mendaftar.'));
    return true;
  }
  if ((m = t.match(/^\/set(?:@\w+)?\s+(\S+)\s+(\S+)\s+([\s\S]+)$/i))) {
    const r = await byKey(env, m[1]); if (!r) { await send(env, chat, 'Akun tidak ditemukan.'); return true }
    const path = m[2], v = path === 'uname' || path === 'pw' ? m[3].trim() : parseVal(m[3]);
    const before = r.bot == null ? getPath(pj(r.save, {}) || {}, path) : pj(r.ov, {})[path];
    try { await applyEdit(env, r, path, v) } catch (e) { await send(env, chat, `❌ Gagal: ${esc(e.message)}`); return true }
    await send(env, chat, `✅ <b>${esc(r.uname)}</b> · <code>${esc(path)}</code>\n${path === 'pw' ? 'password diganti' : `${esc(JSON.stringify(before) ?? '-')} → ${esc(v === undefined ? '(dihapus)' : JSON.stringify(v))}`}`);
    return true;
  }
  if ((m = t.match(/^\/data(?:@\w+)?\s+(\S+)/i))) {
    const r = await byKey(env, m[1]); if (!r) { await send(env, chat, 'Akun tidak ditemukan.'); return true }
    if (r.bot != null) { await send(env, chat, `🤖 ${esc(r.uname)} adalah bot. Datanya:\n<code>${esc(JSON.stringify({ uid: r.uid, uname: r.uname, bot: r.bot, prof: pj(r.prof), ov: pj(r.ov) }, null, 1)).slice(0, 3500)}</code>`); return true }
    await sendDoc(env, chat, `${r.uname}_${r.uid}.json`, JSON.stringify(pj(r.save, {}), null, 1), `Data simpanan ${r.uname} (versi ${r.sv}). Ubah dengan /set ${r.uid} <kolom> <nilai>`);
    return true;
  }
  if ((m = t.match(/^\/ai(?:@\w+)?\s*(on|off)?$/i))) {
    if (m[1]) await kvSet(env, 'ai_on', m[1].toLowerCase());
    const on = await aiOnline(env), today = +(await kvGet(env, dayKey()) || 0);
    const n = await env.DB.prepare("SELECT COUNT(*) n FROM wchat w JOIN players p ON p.uid=w.uid WHERE p.bot IS NOT NULL AND w.ts>?").bind(now() - DAY).first();
    await send(env, chat, `🤖 <b>Mode AI Obrolan Dunia</b>: ${on ? '🟢 NYALA' : '⚪ MATI'}\nModel: ${esc(env.AI_MODEL || 'claude-haiku-5-5')}${env.ANTHROPIC_API_KEY ? '' : '\n⚠️ Token ANTHROPIC_API_KEY belum dipasang'}\nPanggilan hari ini: ${today}/${env.AI_DAILY || 2000}\nPesan bot 24 jam: ${n.n}\n\n${on ? 'Para bot yang sedang online mengobrol sendiri dan membalas pemain asli di Obrolan Dunia.' : 'Obrolan Dunia hanya berisi pesan pemain asli.'}`,
      { inline_keyboard: [[{ text: on ? '⚪ Matikan' : '🟢 Nyalakan', callback_data: on ? 'ai:off' : 'ai:on' }]] });
    return true;
  }
  if ((m = t.match(/^\/gm(?:@\w+)?(?:\s+(\S+))?(?:\s+(on|off))?$/i))) {
    if (!m[1]) {
      const { results } = await env.DB.prepare('SELECT uid,uname,last FROM players WHERE gm=1 AND bot IS NULL ORDER BY last DESC').all();
      await send(env, chat, `🛡 <b>Akun GM</b>\n\n` + (results.length ? results.map(r => `<code>${r.uid}</code> <b>${esc(r.uname)}</b> · ${ago(r.last)}`).join('\n') : 'Belum ada.') + `\n\nJadikan GM: <code>/gm UID|username</code> (ketik lagi untuk mencabut) atau tombol 🛡 di kartu akun.\nGM tidak muncul di Peringkat pemain lain.`);
      return true;
    }
    const r = await byKey(env, m[1]); if (!r) { await send(env, chat, 'Akun tidak ditemukan.'); return true }
    if (r.bot != null) { await send(env, chat, 'Akun bot tidak bisa dijadikan GM.'); return true }
    const on = m[2] ? m[2].toLowerCase() === 'on' : !r.gm;
    await env.DB.prepare('UPDATE players SET gm=? WHERE uid=?').bind(on ? 1 : 0, r.uid).run();
    await send(env, chat, on ? `🛡 <b>${esc(r.uname)}</b> sekarang <b>GM</b>. Panel GM muncul di game dalam ±30 detik (Menu › Pengaturan › Panel GM).` : `🛡 Status GM <b>${esc(r.uname)}</b> dicabut.`);
    return true;
  }
  if (/^\/resetbot(?:@\w+)?$/i.test(t)) {
    const n = await env.DB.prepare('SELECT COUNT(*) n FROM players WHERE bot IS NOT NULL').first(), w = await getWorld(env);
    await send(env, chat, `⚠️ <b>Reset semua bot?</b>\n\nSemua ${fmt(n.n)} akun bot (generasi ${w.gen}) beserta pertemanan & pesan dengan bot akan DIHAPUS, dan seluruh riwayat Obrolan Dunia dikosongkan. Dunia bot mulai lagi dari hari 1 dengan 0 pemain bot, lalu bertambah perlahan sampai ${fmt(BOTCFG.max)}.\n\nAkun pemain asli tidak berubah.`, { inline_keyboard: [[{ text: '♻️ Ya, reset bot', callback_data: 'rbot:yes' }, { text: 'Batal', callback_data: 'cancel' }]] });
    return true;
  }
  if (/^[A-Za-z][A-Za-z0-9]{2,13}$/.test(t) && !flow) {                 // ketik username saja
    const r = await byKey(env, t); if (r) { await send(env, chat, await accCard(env, r), accKb(r)); return true }
  }
  return false;
}
export async function adminCallback(env, chat, d, send) {
  let m;
  if ((m = d.match(/^acc:(\d{8})$/))) { await showAcc(env, chat, send, m[1]); return true }
  if ((m = d.match(/^ed:(\d{8}):(\w+)$/))) {
    const r = await byKey(env, m[1]); if (!r) return true;
    const F = (r.bot != null ? B_FIELDS : H_FIELDS)[m[2]]; if (!F) return true;
    await kvSet(env, 'flow', `ed:${m[1]}:${m[2]}`);
    const cur = m[2] === 'uname' ? r.uname : m[2] === 'pw' ? '(rahasia)' : r.bot != null ? (pj(r.ov, {})[m[2]] ?? pj(r.prof, {})?.[m[2]] ?? '-') : (pj(r.save, {}) || {})[m[2]];
    await send(env, chat, `✏️ <b>${F}</b> untuk <b>${esc(r.uname)}</b>\nSekarang: <code>${esc(cur ?? '-')}</code>\n\nKetik nilai baru${r.bot != null && m[2] !== 'uname' ? ' (atau <code>hapus</code> untuk kembali ke nilai asli dari game)' : ''}. /batal untuk membatalkan.`);
    return true;
  }
  if ((m = d.match(/^gm:(\d{8})$/))) {
    const r = await byKey(env, m[1]); if (!r || r.bot != null) return true;
    await env.DB.prepare('UPDATE players SET gm=? WHERE uid=?').bind(r.gm ? 0 : 1, r.uid).run();
    await send(env, chat, r.gm ? `🛡 Status GM <b>${esc(r.uname)}</b> dicabut. Panel GM hilang dari game dalam ±30 detik.` : `🛡 <b>${esc(r.uname)}</b> sekarang <b>GM</b>. Panel GM muncul di game dalam ±30 detik (Menu › Pengaturan › Panel GM).`);
    await showAcc(env, chat, send, r.uid); return true;
  }
  if ((m = d.match(/^ban:(\d{8})$/))) {
    const r = await byKey(env, m[1]); if (!r) return true;
    await env.DB.prepare('UPDATE players SET ban=? WHERE uid=?').bind(r.ban ? 0 : 1, r.uid).run();   // sesi tidak dihapus: game menerima 'ban' lalu menampilkan pesan blokir
    await send(env, chat, `${r.ban ? '✅' : '🚫'} <b>${esc(r.uname)}</b> ${r.ban ? (r.bot != null ? 'ditampilkan lagi' : 'tidak diblokir lagi') : (r.bot != null ? 'disembunyikan dari game' : 'diblokir & dikeluarkan dari game')}.`);
    await showAcc(env, chat, send, r.uid); return true;
  }
  if ((m = d.match(/^dat:(\d{8})$/))) { await adminMessage(env, chat, '/data ' + m[1], '/data ' + m[1], send); return true }
  if ((m = d.match(/^frl:(\d{8})$/))) {
    const { results } = await env.DB.prepare("SELECT p.uid,p.uname,p.bot,f.st,f.frm FROM friends f JOIN players p ON p.uid = CASE WHEN f.a=? THEN f.b ELSE f.a END WHERE (f.a=? OR f.b=?) AND f.st IN ('ok','req') ORDER BY f.ts DESC LIMIT 60").bind(m[1], m[1], m[1]).all();
    await send(env, chat, results.length ? `👥 <b>Teman & permintaan</b>\n\n` + results.map(r => `${r.bot == null ? '👤' : '🤖'} <code>${r.uid}</code> ${esc(r.uname)}${r.st === 'req' ? (r.frm === m[1] ? ' · ⏳ diminta' : ' · 📩 meminta') : ''}`).join('\n') : 'Belum punya teman.');
    return true;
  }
  if ((m = d.match(/^ai:(on|off)$/))) { await adminMessage(env, chat, '/ai ' + m[1], '/ai ' + m[1], send); return true }
  if (d === 'rbot:yes') { const w = await resetBots(env); await send(env, chat, `♻️ <b>Dunia bot di-reset</b> (generasi ${w.gen}).\nRiwayat Obrolan Dunia dikosongkan. Semua game akan memuat dunia baru dalam ±30 detik; bot mulai bergabung lagi dari 0.`); return true }
  return false;
}
