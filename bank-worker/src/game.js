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
import { guildRoute, aiDmOn, relStmt, guildWipe, guildWipeAll, guildMove, gLv, gCap } from './guild.js';
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
// sama persis dengan src/js/systems/bots.js (wJoinN, wEff, botJoinDaysW, botJoinWarp)
function botJoinWarp(d, C) { const W = C.HOURS, tot = W.reduce((a, v) => a + v, 0), z = C.TZ / 24, x = d + z, day = Math.floor(x), target = (x - day) * tot;
  let c = 0, j = 0; for (; j < 23; j++) { if (c + W[j] >= target) break; c += W[j] } return day + (j + Math.min(1, Math.max(0, (target - c) / W[j]))) / 24 - z }
// hari efektif ekor pertumbuhan: tiap server yang lebih baru dibuka -> laju dunia ini x slow
function wEff(T, w) { const C = BOTCFG.SRV, O = w.newer || []; let e = 0, last = 0, k = 0; for (const o of O) { const d = (o - w.e) / DAY; if (d >= T) break; if (d > last) { e += (d - last) * Math.pow(C.slow, k); last = d } k++ } return e + (T - last) * Math.pow(C.slow, k) }
/* v2 (w.v===2): hype & pertumbuhan alami per server — SAMA PERSIS dengan src/js/systems/bots.js (wRng, wDyn, wE2, wJoinN).
   N(T) = cap × [R·(1−e^(−T/tr)) + W·(1−e^(−E/tw)) + G·(1−e^(−E/tg))]; E = hari efektif bergelombang (laju harian acak per dunia). */
function wRng(g, k) { return bRng((Math.imul(g + 1, 0x9E3779B1) ^ Math.imul(k + 17, 0x85EBCA6B)) >>> 0) }
function wDyn(w) {
  if (w._d) return w._d; const C = BOTCFG.SRV, hv = Math.min(10, Math.max(1, Math.round(w.h || 5))), H = C.HYPE[hv], r = wRng(w.g, 1);
  let pop = C.POP[0] + r() * (C.POP[1] - C.POP[0]); if (w.o != null) pop *= Math.max(.8, 1 + C.ORD * (1.5 - w.o));
  const R = Math.min(.88, H.R * pop), Wv = Math.min(.95 - R, H.W * Math.sqrt(pop)), G = 1 - R - Wv, D = C.DAYS, B = C.BURST;
  const rate = new Float64Array(D), q = wRng(w.g, 2), b = wRng(w.g, 3), dec = Math.exp(-1 / B.dec), pb = B.p + B.ph * hv, ar = C.AR, sq = Math.sqrt(1 - ar * ar);
  let x = 0, acc = 0;
  for (let d = 0; d < D; d++) { const u1 = Math.max(1e-9, q()), u2 = q(), z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2); x = d ? ar * x + sq * z : z;
    acc *= dec; if (d > 0 && b() < pb) acc += B.a[0] + b() * (B.a[1] - B.a[0]) - 1;
    const wd = new Date(w.e + (d + .5) * DAY + BOTCFG.TZ * 36e5).getUTCDay(); rate[d] = pop * Math.exp(C.SD * x - C.SD * C.SD / 2) * C.WKD[wd] * (1 + acc) }
  const nd = (w.newer || []).map(o => (o - w.e) / DAY).filter(v => v > 0).sort((a, c) => a - c), S = [], Cu = [], Rt = []; let E = 0, k = 0, j = 0;
  for (let d = 0; d < D; d++) { let a = d; for (;;) { while (j < nd.length && nd[j] <= a) { k++; j++ } const nx = Math.min(d + 1, j < nd.length ? nd[j] : Infinity), rt = rate[d] * Math.pow(C.slow, k);
    S.push(a); Cu.push(E); Rt.push(rt); E += rt * (nx - a); a = nx; if (a >= d + 1) break } }
  S.push(D); Cu.push(E); Rt.push(Rt[Rt.length - 1]);
  return w._d = { R, W: Wv, G, tr: H.tr, tw: H.tw, tg: H.tg, pop, S, Cu, Rt };
}
function wE2(T, d) { if (T <= 0) return 0; const S = d.S; let lo = 0, hi = S.length - 1; if (T >= S[hi]) return d.Cu[hi] + d.Rt[hi] * (T - S[hi]);
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (S[m] <= T) lo = m; else hi = m } return d.Cu[lo] + d.Rt[lo] * (T - S[lo]) }
function wJoinN(T, w) {
  if (w.v === 2) { if (T <= 0) return 0; const d = wDyn(w), E = wE2(T, d); return w.cap * (d.R * (1 - Math.exp(-T / d.tr)) + d.W * (1 - Math.exp(-E / d.tw)) + d.G * (1 - Math.exp(-E / d.tg))) }
  const C = BOTCFG.SRV; return w.cap * (C.w1 * (1 - Math.exp(-T / C.t1)) + C.w2 * (1 - Math.exp(-wEff(T, w) / C.t2)));
}
export const __curve = { wJoinN, wDyn, botJoinDaysW: (i, w) => botJoinDaysW(i, w), botsJoinedW: (w, t) => botsJoinedW(w, t) };   // untuk uji kesamaan dengan game
function botJoinDaysW(i, w) { if (i >= w.cap) return Infinity; let lo = 0, hi = 1; while (wJoinN(hi, w) < i + 1 && hi < 1e5) hi *= 2; if (wJoinN(hi, w) < i + 1) return Infinity;
  for (let k = 0; k < 50; k++) { const m = (lo + hi) / 2; if (wJoinN(m, w) < i + 1) lo = m; else hi = m }
  if (hi < 1) return hi; const E = w.e / DAY; return Math.max(1, botJoinWarp(E + hi, BOTCFG) - E) }
function botJoinW(i, w) { return w.e + botJoinDaysW(i, w) * DAY }
function botsJoinedW(w, t = now()) { let lo = 0, hi = w.cap; while (lo < hi) { const m = (lo + hi) >> 1; if (botJoinW(m, w) <= t) lo = m + 1; else hi = m } return lo }

/* ---------------- server ----------------
   Tiap server = baris di tabel servers dengan daftar dunia bot [{g,e,cap}]. Server yang DIGABUNG (merged = id tujuan) tidak tampil;
   pemain & dunia botnya ikut server tujuan. Gen dunia unik global (kv gen_seq) -> seed bot tiap dunia berbeda. */
async function nextGen(env) { const g = Math.max(+(await kvGet(env, 'gen_seq') || 0), (pj(await kvGet(env, 'world'), {}) || {}).gen || 0) + 1; await kvSet(env, 'gen_seq', g); return g }
const SRV_NAMES = ['Aster', 'Lumina', 'Bara', 'Samudra', 'Rimba', 'Fajar', 'Senja', 'Bintang', 'Kabut', 'Badai', 'Embun', 'Petir', 'Rembulan', 'Gerhana', 'Pelangi', 'Halimun'];
/* ---------------- hype ----------------
   Tingkat hype 1..10 (kv 'hype', bawaan 5) diatur pemilik lewat Telegram /hype. Dipakai saat dunia bot baru dibuat
   (rilis serentak, server baru, reset bot): makin hype makin banyak pemain yang langsung main saat server dibuka. */
const hypeGet = async env => Math.min(10, Math.max(1, Math.round(+(await kvGet(env, 'hype')) || 5)));
const newWorld = (g, e, h, o, wp) => { const w = { g, e, cap: BOTCFG.SRV.cap, v: 2, h }; if (o != null) w.o = o; if (wp != null) w.wh = [[e, wp]]; return w };
/* ---------------- whaler per server ----------------
   Persen whaler (whale + super whale + mega whale) tiap server diatur pemilik lewat Telegram /whale. Disimpan di dunia bot sebagai
   riwayat wh = [[waktu, persen], ...]: hanya bot yang BERGABUNG setelah waktu itu yang terpengaruh — bot lama tetap (riwayat belanja & CP-nya).
   Game memilih tier belanja bot dari persen saat bot itu bergabung (src/js/systems/bots.js botTierW).
   kv 'whale' = persen untuk dunia baru (/whale semua). Bawaan BOTCFG.WHALE.def (2%). /rilis & reset bot membawa persen server masing-masing. */
const WH_DEF = BOTCFG.WHALE.def;
const whaleGet = async env => { const v = parseFloat(await kvGet(env, 'whale')); return Number.isFinite(v) ? Math.min(100, Math.max(0, v)) : WH_DEF };
const whNow = w => { const H = w && w.wh; return H && H.length ? +H[H.length - 1][1] : WH_DEF };   // persen untuk pendatang berikutnya
const srvWhale = s => s.W.length ? whNow(s.W[0]) : (s.wp != null ? +s.wp : WH_DEF);   // server belum rilis: persen disimpan di kolom wp
/* status server: 'list' = terdaftar saja (belum rilis), 'soon' = rilis terjadwal (pra-registrasi), 'open' = buka, 'gone' = tidak ada (dihapus / reset semua).
   Masuk game hanya bisa ke server 'open' (GM boleh lewat untuk uji). */
const srvSt = (s, t = now()) => !s ? 'gone' : !s.W.length || !s.opened ? 'list' : s.opened > t ? 'soon' : 'open';
const pctS = v => String(Math.round(v * 100) / 100).replace('.', ',') + '%';
async function serversAll(env) {
  let rows = (await env.DB.prepare('SELECT * FROM servers ORDER BY id').all()).results;
  if (!rows.length && !(await kvGet(env, 'srv_init'))) {   // pertama kali: 4 server dibuka bersamaan (hari 1). Dunia bot lama dibuang. Setelah dikelola pemilik (hapus / reset semua) tidak dibuat otomatis lagi.
    const t = now(), st = [env.DB.prepare('DELETE FROM friends WHERE a IN (SELECT uid FROM players WHERE bot IS NOT NULL) OR b IN (SELECT uid FROM players WHERE bot IS NOT NULL)'),
      env.DB.prepare('DELETE FROM dms WHERE frm IN (SELECT uid FROM players WHERE bot IS NOT NULL) OR too IN (SELECT uid FROM players WHERE bot IS NOT NULL)'),
      env.DB.prepare('DELETE FROM players WHERE bot IS NOT NULL'), env.DB.prepare('DELETE FROM wchat'), env.DB.prepare('DELETE FROM rvb'), env.DB.prepare('DELETE FROM ann'), env.DB.prepare('UPDATE players SET srv=1')];
    const h = await hypeGet(env), wp = await whaleGet(env);
    for (let id = 1; id <= 4; id++) { const g = await nextGen(env); st.push(env.DB.prepare('INSERT OR IGNORE INTO servers (id,name,opened,merged,worlds) VALUES (?,?,?,NULL,?)').bind(id, SRV_NAMES[id - 1], t, JSON.stringify([newWorld(g, t, h, id - 1, wp)]))) }
    await env.DB.batch(st); await kvSet(env, 'srv_init', 1); rows = (await env.DB.prepare('SELECT * FROM servers ORDER BY id').all()).results;
  }
  // jam buka server lain memperlambat pertumbuhan server lama (pemain baru memilih server baru). Server yang sudah dihapus tetap dihitung
  // (kv srv_gone_opens) supaya riwayat server lain tidak berubah mundur.
  const opens = rows.map(r => r.opened).filter(o => o > 0).concat(pj(await kvGet(env, 'srv_gone_opens'), []) || []).sort((a, b) => a - b);
  return rows.map(r => { const W = pj(r.worlds, []).map(w => ({ ...w, newer: opens.filter(o => o > w.e + 36e5) })); return { ...r, W } });
}
async function srvGet(env, id, all) { all = all || await serversAll(env); let s = all.find(x => x.id === +id); for (let k = 0; s && s.merged && k < 20; k++)s = all.find(x => x.id === s.merged); return s || null }
// pastikan akun bot sudah ada untuk semua bot dunia w yang sudah bergabung (+10 cadangan). Maks 5000 per panggilan.
export async function ensureBots(env, w) {
  if (!w) { for (const s of await serversAll(env)) if (!s.merged) for (const x of s.W) await ensureBots(env, x); return }
  const joined = botsJoinedW(w), need = Math.min(w.cap, joined + Math.max(200, Math.round(w.cap * .03)));
  const have = await env.DB.prepare('SELECT COUNT(*) n FROM players WHERE bw=?').bind(w.g).first();
  if (have.n >= Math.min(w.cap, joined + 10)) return have.n;
  const taken = new Set((await env.DB.prepare('SELECT lower(uname) u FROM players').all()).results.map(r => r.u));
  const HN = new Set(BOTCFG.heroNames), rows = [];
  let i = have.n, gi = have.n;
  const stop = Math.min(need, have.n + 5000);
  while (i < stop && gi < have.n + 40000) {
    const nm = botLocalName(gi++, w.g), lo = nm.toLowerCase();
    if (!/^[A-Za-z0-9]{3,14}$/.test(nm) || taken.has(lo) || HN.has(lo)) continue;
    taken.add(lo);
    const salt = hex(rnd(8)), pw = hex(rnd(9));
    rows.push([newUid(), nm, 'x1$' + await sha(salt + pw), salt, i, w.g, Math.round(botJoinW(i, w))]);
    i++;
  }
  const st = [];
  for (let k = 0; k < rows.length; k += 14) {
    const part = rows.slice(k, k + 14);
    st.push(env.DB.prepare(`INSERT OR IGNORE INTO players (uid,uname,ph,salt,bot,bw,created) VALUES ${part.map(() => '(?,?,?,?,?,?,?)').join(',')}`).bind(...part.flat()));
  }
  for (let k = 0; k < st.length; k += 40) await env.DB.batch(st.slice(k, k + 40));
  return have.n + rows.length;
}
// hapus dunia-dunia bot (akun bot, pertemanan & pesan dengan bot, usaha rival)
const dropWorlds = (env, gens) => { const q = gens.map(() => '?').join(','), sub = `SELECT uid FROM players WHERE bw IN (${q})`; return [
  env.DB.prepare(`DELETE FROM friends WHERE a IN (${sub}) OR b IN (${sub})`).bind(...gens, ...gens),
  env.DB.prepare(`DELETE FROM dms WHERE frm IN (${sub}) OR too IN (${sub})`).bind(...gens, ...gens),
  env.DB.prepare(`DELETE FROM rel WHERE b IN (${sub})`).bind(...gens), env.DB.prepare(`DELETE FROM gmem WHERE uid IN (${sub})`).bind(...gens), env.DB.prepare(`DELETE FROM gapp WHERE uid IN (${sub})`).bind(...gens),
  env.DB.prepare(`DELETE FROM players WHERE bw IN (${q})`).bind(...gens),
  env.DB.prepare(`DELETE FROM rvb WHERE gen IN (${q})`).bind(...gens)] };
const srvKv = id => ['ai_scene_at', 'ai_until', 'stk_at', 'stk_gap', 'watch_at'].map(k => k + ':' + id);
// reset satu server: dunia bot baru (hari 1), obrolan server dikosongkan. Pemain asli tetap.
export async function resetServer(env, id) {
  const s = await srvGet(env, id); if (!s) return null; if (srvSt(s) === 'list') return { id: s.id, list: 1 }; const g = await nextGen(env), t = now(), h = await hypeGet(env);
  await env.DB.batch([...dropWorlds(env, s.W.map(w => w.g)), ...guildWipe(env, s.id), env.DB.prepare('DELETE FROM wchat WHERE srv=?').bind(s.id), env.DB.prepare('DELETE FROM ann WHERE srv=?').bind(s.id),
    env.DB.prepare(`DELETE FROM kv WHERE k IN (${srvKv(s.id).map(() => '?').join(',')})`).bind(...srvKv(s.id)),
    env.DB.prepare('UPDATE servers SET worlds=? WHERE id=?').bind(JSON.stringify([newWorld(g, t, h, undefined, srvWhale(s))]), s.id)]);
  return { id: s.id, gen: g, h };
}
export async function openServer(env, name) {
  const all = await serversAll(env), id = Math.max(0, ...all.map(s => s.id)) + 1, g = await nextGen(env), t = now(), h = await hypeGet(env);
  const nm = clean(name, 16) || SRV_NAMES[(id - 1) % SRV_NAMES.length];
  await env.DB.prepare('INSERT INTO servers (id,name,opened,merged,worlds) VALUES (?,?,?,NULL,?)').bind(id, nm, t, JSON.stringify([newWorld(g, t, h, undefined, await whaleGet(env))])).run();
  await kvSet(env, 'srv_init', 1);
  return { id, name: nm, h };
}
/* ---------- kelola server dari Telegram (/server tambah | rilis | tunda | nama | hapus | reset semua) ----------
   tambah = server baru TERDAFTAR saja (tampil di daftar "BELUM RILIS", belum bisa dimasuki) → rilis sekarang / terjadwal (pra-registrasi, "Buka 20:00").
   hapus  = server + dunia botnya + obrolan/pengumuman/raid-nya hilang. Akun pemain asli TIDAK dihapus: saat masuk lagi mereka memilih server lain yang sudah buka.
   reset semua = tanpa server sama sekali (tidak dibuat otomatis lagi); semua akun bot ikut dihapus. Id server baru mulai lagi dari 1. */
export async function addServer(env, name) {
  const all = await serversAll(env), id = Math.max(0, ...all.map(s => s.id)) + 1, nm = clean(name, 16) || SRV_NAMES[(id - 1) % SRV_NAMES.length];
  await env.DB.prepare('INSERT INTO servers (id,name,opened,merged,worlds,wp) VALUES (?,?,0,NULL,?,?)').bind(id, nm, '[]', await whaleGet(env)).run();
  await kvSet(env, 'srv_init', 1);
  return { id, name: nm };
}
export async function releaseServer(env, id, ts) {
  const all = await serversAll(env), s = all.find(x => x.id === +id && !x.merged); if (!s) return { ok: false, e: 'none' };
  if (srvSt(s) === 'open') return { ok: false, e: 'open', id: s.id, name: s.name };
  const t = Math.max(now(), +ts || 0), h = await hypeGet(env), wp = srvWhale(s), st = s.W.length ? dropWorlds(env, s.W.map(w => w.g)) : [];   // jadwal lama dibuang (belum ada bot yang bergabung)
  st.push(env.DB.prepare('UPDATE servers SET worlds=?, opened=?, wp=? WHERE id=?').bind(JSON.stringify([newWorld(await nextGen(env), t, h, undefined, wp)]), t, wp, s.id));
  await env.DB.batch(st);
  return { ok: true, id: s.id, name: s.name, ts: t, h, now: t <= now() + 6e4 };
}
// rilis terjadwal dibatalkan → kembali terdaftar saja
export async function unreleaseServer(env, id) {
  const all = await serversAll(env), s = all.find(x => x.id === +id && !x.merged); if (!s) return { ok: false, e: 'none' };
  if (srvSt(s) !== 'soon') return { ok: false, e: srvSt(s), id: s.id, name: s.name };
  const wp = srvWhale(s);
  await env.DB.batch([...dropWorlds(env, s.W.map(w => w.g)), env.DB.prepare("UPDATE servers SET worlds='[]', opened=0, wp=? WHERE id=?").bind(wp, s.id)]);
  return { ok: true, id: s.id, name: s.name };
}
const srvClean = (env, id) => { const ks = srvKv(id); return [env.DB.prepare('DELETE FROM wchat WHERE srv=?').bind(id), env.DB.prepare('DELETE FROM ann WHERE srv=?').bind(id),
  env.DB.prepare(`DELETE FROM kv WHERE k IN (${ks.map(() => '?').join(',')})`).bind(...ks), env.DB.prepare('DELETE FROM wbdmg WHERE slot LIKE ?').bind(id + ':%'), env.DB.prepare('DELETE FROM kv WHERE k LIKE ?').bind('wblh:' + id + ':%')] };
const realOn = async (env, id) => (await env.DB.prepare('SELECT COUNT(*) n FROM players WHERE bot IS NULL AND watch=0 AND srv=?').bind(id).first()).n;
export async function deleteServer(env, id) {
  const all = await serversAll(env), s = all.find(x => x.id === +id); if (!s || s.merged) return null;
  const ids = [s.id]; for (let k = 0; k < ids.length && k < 50; k++) for (const x of all) if (x.merged === ids[k] && !ids.includes(x.id)) ids.push(x.id);   // server yang dulu digabung ke sini ikut hilang
  const st = s.W.length ? dropWorlds(env, s.W.map(w => w.g)) : [];
  for (const i of ids) st.push(...srvClean(env, i), ...guildWipe(env, i));
  st.push(env.DB.prepare(`DELETE FROM servers WHERE id IN (${ids.map(() => '?').join(',')})`).bind(...ids));
  await env.DB.batch(st); await kvSet(env, 'srv_init', 1);
  const go = all.filter(x => ids.includes(x.id) && x.opened > 0 && x.opened <= now()).map(x => x.opened);
  if (go.length) await kvSet(env, 'srv_gone_opens', JSON.stringify((pj(await kvGet(env, 'srv_gone_opens'), []) || []).concat(go).slice(-200)));
  return { id: s.id, name: s.name, real: await realOn(env, s.id), left: all.filter(x => !x.merged && x.id !== s.id).length };
}
export async function resetAllServers(env) {
  const ids = (await env.DB.prepare('SELECT id FROM servers').all()).results.map(r => r.id), bots = 'SELECT uid FROM players WHERE bot IS NOT NULL';
  const st = [env.DB.prepare(`DELETE FROM friends WHERE a IN (${bots}) OR b IN (${bots})`), env.DB.prepare(`DELETE FROM dms WHERE frm IN (${bots}) OR too IN (${bots})`),
    env.DB.prepare('DELETE FROM players WHERE bot IS NOT NULL'), env.DB.prepare('DELETE FROM wchat'), env.DB.prepare('DELETE FROM rvb'), env.DB.prepare('DELETE FROM ann'),
    env.DB.prepare('DELETE FROM wbdmg'), env.DB.prepare("DELETE FROM kv WHERE k LIKE 'wblh:%'"), ...guildWipeAll(env), env.DB.prepare('DELETE FROM servers')];
  for (const id of ids) { const ks = srvKv(id); st.push(env.DB.prepare(`DELETE FROM kv WHERE k IN (${ks.map(() => '?').join(',')})`).bind(...ks)) }
  await env.DB.batch(st); await kvSet(env, 'srv_init', 1); await kvSet(env, 'srv_gone_opens', null);
  return { n: ids.length, real: (await env.DB.prepare('SELECT COUNT(*) n FROM players WHERE bot IS NULL AND watch=0').first()).n };
}
/* RILIS SERENTAK: semua server aktif dibuka ulang bersamaan pada waktu ts (sekarang atau terjadwal) — dunia bot baru (hari 1)
   dengan hype saat ini; server ditambah sampai n bila kurang. Semua akun bot, pertemanan & pesan dengan bot, Obrolan Dunia, usaha rival dihapus.
   Pemain asli tetap (akun & servernya). Tiap server dapat urutan o (server awal sedikit lebih ramai) & gen sendiri -> kurvanya berbeda-beda. */
export async function releaseAll(env, n, ts) {
  const all = await serversAll(env), act = all.filter(s => !s.merged).sort((a, b) => a.id - b.id), h = await hypeGet(env);
  const bots = 'SELECT uid FROM players WHERE bot IS NOT NULL', ids = all.map(s => s.id);
  const st = [env.DB.prepare(`DELETE FROM friends WHERE a IN (${bots}) OR b IN (${bots})`), env.DB.prepare(`DELETE FROM dms WHERE frm IN (${bots}) OR too IN (${bots})`),
    env.DB.prepare('DELETE FROM players WHERE bot IS NOT NULL'), env.DB.prepare('DELETE FROM wchat'), env.DB.prepare('DELETE FROM rvb'), env.DB.prepare('DELETE FROM ann'), ...guildWipeAll(env)];
  for (const id of ids) { const ks = srvKv(id); st.push(env.DB.prepare(`DELETE FROM kv WHERE k IN (${ks.map(() => '?').join(',')})`).bind(...ks)) }
  let o = 0, id = Math.max(0, ...ids);
  for (const s of act) st.push(env.DB.prepare('UPDATE servers SET worlds=?, opened=? WHERE id=?').bind(JSON.stringify([newWorld(await nextGen(env), ts, h, o++, srvWhale(s))]), ts, s.id));
  const add = [], wp = await whaleGet(env);
  while (act.length + add.length < n) { id++; const nm = SRV_NAMES[(id - 1) % SRV_NAMES.length]; add.push({ id, name: nm });
    st.push(env.DB.prepare('INSERT INTO servers (id,name,opened,merged,worlds) VALUES (?,?,?,NULL,?)').bind(id, nm, ts, JSON.stringify([newWorld(await nextGen(env), ts, h, o++, wp)]))) }
  await env.DB.batch(st);
  return { n: act.length + add.length, added: add, h, ts };
}
// gabung server a ke b: pemain & dunia bot a pindah ke b; a tidak tampil lagi
async function mergeServer(env, a, b) {
  const all = await serversAll(env), A = all.find(x => x.id === +a), B = all.find(x => x.id === +b);
  if (!A || !B || A.id === B.id || A.merged || B.merged) return { ok: false, e: 'srv' };
  const W = pj(B.worlds, []).concat(pj(A.worlds, []));
  await env.DB.batch([env.DB.prepare('UPDATE servers SET worlds=? WHERE id=?').bind(JSON.stringify(W), B.id), env.DB.prepare('UPDATE servers SET merged=? WHERE id=?').bind(B.id, A.id),
    env.DB.prepare('UPDATE players SET srv=? WHERE srv=? AND bot IS NULL').bind(B.id, A.id), env.DB.prepare('UPDATE wchat SET srv=? WHERE srv=?').bind(B.id, A.id), env.DB.prepare('UPDATE OR IGNORE ann SET srv=? WHERE srv=?').bind(B.id, A.id), env.DB.prepare('DELETE FROM ann WHERE srv=?').bind(A.id),
    env.DB.prepare('UPDATE guilds SET srv=? WHERE srv=?').bind(B.id, A.id), env.DB.prepare("INSERT INTO kv (k,v) VALUES (?, '1') ON CONFLICT(k) DO UPDATE SET v = CAST(v AS INTEGER) + 1").bind('gv:' + B.id)]);
  return { ok: true, into: B.id, worlds: W.length };
}
// ringkasan server untuk layar pilih server
async function srvList(env) {
  const all = await serversAll(env), t = now(), real = Object.fromEntries((await env.DB.prepare('SELECT srv, COUNT(*) n FROM players WHERE bot IS NULL GROUP BY srv').all()).results.map(r => [r.srv, r.n]));
  return all.filter(s => !s.merged).map(s => { const bots = s.W.reduce((a, w) => a + botsJoinedW(w, t), 0), cap = s.W.length ? s.W.reduce((a, w) => a + w.cap, 0) : BOTCFG.SRV.cap, n = bots + (real[s.id] || 0);
    const d1 = bots - s.W.reduce((a, w) => a + botsJoinedW(w, t - 36e5), 0), d24 = bots - s.W.reduce((a, w) => a + botsJoinedW(w, t - DAY), 0), W0 = s.W[0];
    return { id: s.id, name: s.name, opened: s.opened, st: srvSt(s, t), n, cap, full: n >= cap, merged: s.W.length > 1, h: W0 && W0.v === 2 ? W0.h : 0, d1, d24 } });
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

PRIVASI (wajib): tiap penulis hanya tahu data PRIBADI dirinya sendiri (SEDANG, pity, permata, top up, tabungan, hoki/apes, berapa hari main). Data pribadi orang lain (termasuk pemain asli) TIDAK diketahui kecuali orang itu sendiri sudah menyebutnya di obrolan. Yang bisa dilihat semua orang hanya: nama, level, CP, peringkat, lencana VIP, tim & hero di profil, tahap terjauh, liga Arena, dan pengumuman sistem (★3 dari Panggilan, naik VIP, #1 CP/Arena, rekor server, MVP Bos Dunia).
FAKTA: semua fakta game harus benar sesuai pengetahuan di bawah; jangan mengarang fitur (guild SUDAH ada; Guild War BELUM ada). Pakai istilah game ini: ★3 / bintang 3 (bukan SSR/UR), permata, tiket, tahap 3-4; bos hanya di tahap x-5. Tanpa emoji, tanpa tautan, ramah keluarga, tidak menyebut orang nyata/merek/politik. Jangan menyebut diri AI/bot tanpa alasan, tapi kalau ada yang bertanya dengan serius apakah ia sedang ngobrol dengan bot/AI, jangan menyangkal dan jangan mengaku manusia: jawab jujur singkat (pemain AI di game ini) lalu lanjut santai. Candaan "bot lu" setelah main jelek cukup dibalas candaan tanpa mengaku manusia. Hanya penulis dari daftar yang boleh bicara. Balas HANYA JSON.`;
// rival abadi: momen persaingan antara bot rival {r} dan pemain {p} (dikirim game saat si rival sedang online)
const RV_EVS = {
  new: '{r} baru sadar di peringkat ada {p} yang CP-nya kejar-kejaran dengan dia beberapa hari ini. {r} nyeletuk soal itu: setengah bercanda, sok cuek, atau ngajak saingan sehat. Jangan pakai kata "rival" secara kaku.',
  passed: '{p} baru saja MENYALIP CP {r} di peringkat. {r} kesal tapi wajar (bukan marah beneran): bilang mau farming/sapu stamina malam ini, "jangan senang dulu", atau ngeles soal gacha.',
  back: '{r} berhasil menyalip {p} LAGI di peringkat setelah farming. {r} pamer tipis atau nyindir santai ke {p}.',
  giveup: '{r} mengaku kalah cepat dari {p} (selisih sudah jauh). Nada legowo/bercanda, bilang mau santai dulu atau ganti target.',
  bored: '{r} sekarang sudah jauh di atas {p}. {r} nyeletuk ringan, misalnya sudah ngejar pemain lain yang lebih atas.',
};
// elemen naga → fakta keunggulan (supaya obrolan tidak salah kasih saran)
const WB_EL = { api: 'api. Unggul melawannya: hero AIR (damage ×1,3). Hero TANAH lemah (×0,75)', air: 'air. Unggul melawannya: hero TANAH (×1,3). Hero API lemah (×0,75)', tanah: 'tanah. Unggul melawannya: hero API (×1,3). Hero AIR lemah (×0,75)', cahaya: 'cahaya. Unggul melawannya: hero GELAP (×1,3); cahaya vs cahaya biasa', gelap: 'gelap. Unggul melawannya: hero CAHAYA (×1,3); gelap vs gelap biasa' };
// momen Bos Dunia yang dikirim game (b.wb) → satu adegan obrolan khusus per momen per raid
const WB_EVS = { pre: 'Bos Dunia {b} akan muncul beberapa menit lagi (sudah diumumkan di game). Orang siap-siap, ngajak ikut, nanya elemen lemahnya, nyiapin tim.', start: 'Bos Dunia {b} BARU SAJA muncul dan semua lagi nyerbu. Ramai: saling semangatin, ada yang tim-nya tumbang & nunggu bangkit 10 detik, bahas peringkat damage di samping layar.', half: 'Bos Dunia {b} sisa sekitar {p}% HP dan masuk fase ganas (serangan makin sakit, sisik keras kecuali elemen unggul). Agak panik, ngeluh mati terus, saran elemen singkat.', low: 'Bos Dunia {b} tinggal {p}% HP! "dikit lagi", ngejar pukulan terakhir, rebutan peringkat.', kill: 'Bos Dunia {b} BARU SAJA TUMBANG. Lega & senang, pamer peringkat/damage atau ngeluh telat masuk, nunggu hadiah di kotak surat.', escape: 'Bos Dunia {b} KABUR karena waktu habis (sisa {p}% HP). Kesal, saling nyalahin dikit, janji ikut jadwal berikutnya.' };
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
  const kind = b.kind === 'reply' ? 'reply' : 'tick', t = now(); let wbEv = null, rvEv = null, anEv = null;
  const SV = await srvGet(env, u ? u.srv : +b.srv || 1); if (!SV || srvSt(SV) !== 'open') return { ok: false, e: 'srv' };
  const sid = SV.id, G = SV.W.map(w => w.g), K = k => k + ':' + sid;   // semua kunci & obrolan per server
  // penulis: hanya akun bot sungguhan, nama dari server
  const C = (Array.isArray(b.cands) ? b.cands : []).slice(0, 6).filter(c => /^\d{8}$/.test(c.uid)).map(c => ({ uid: c.uid, pub: clip(c.pub, 320), priv: clip(c.priv, 300), style: clip(c.style, 320), lower: !!c.lower, fav: clip(c.fav, 16) }));
  if (C.length < 1) return { ok: false, e: 'cands' };
  const rows = (await env.DB.prepare(`SELECT uid,uname FROM players WHERE bot IS NOT NULL AND ban=0 AND bw IN (${G.map(() => '?').join(',')}) AND uid IN (${C.map(() => '?').join(',')})`).bind(...G, ...C.map(c => c.uid)).all()).results;
  const byUid = new Map(rows.map(r => [r.uid, r.uname])), cands = C.filter(c => byUid.has(c.uid)).map(c => ({ ...c, name: byUid.get(c.uid) }));
  if (!cands.length) return { ok: false, e: 'cands' };
  if (b.watch) await kvSet(env, K('watch_at'), t);
  // pengumuman server 20 menit terakhir (terlihat semua orang) — konteks obrolan & bahan reaksi
  const ANR = (await env.DB.prepare('SELECT * FROM ann WHERE srv=? AND ts<=? AND ts>? ORDER BY ts DESC LIMIT 8').bind(sid, t, t - 20 * 6e4).all()).results.filter(a => { const d = pj(a.d, {}); return !d.gm && !d.q });
  let humanMsg = null;
  if (kind === 'reply') {
    if (!u) return { ok: false, e: 'auth' };
    humanMsg = await env.DB.prepare('SELECT * FROM wchat WHERE uid=? ORDER BY id DESC LIMIT 1').bind(u.uid).first();
    if (!humanMsg || t - humanMsg.ts > 3e4) return { ok: false, e: 'nomsg' };
    if (+(await kvGet(env, 'air:' + u.uid) || 0) > t - 12e3) return { ok: false, e: 'fast' };
    await kvSet(env, 'air:' + u.uid, t);
    if (stkKey(humanMsg.txt) && !humanMsg.re && rnd01() < .55) return { ok: true, n: 0, skip: 'stk' };   // stiker pemain sering dicuekin, seperti chat asli
    // obrolan bot yang masih terjadwal di masa depan dibatalkan: orang-orang bereaksi ke pesan pemain dulu
    await env.DB.prepare(`DELETE FROM wchat WHERE srv=? AND ts>? AND uid IN (SELECT uid FROM players WHERE bot IS NOT NULL)`).bind(sid, t + 6000).run();
    await kvSet(env, K('ai_until'), t);
  } else {
    const [at, until, wat, stkAt, stkGap] = await Promise.all(['ai_scene_at', 'ai_until', 'watch_at', 'stk_at', 'stk_gap'].map(async k => +(await kvGet(env, K(k)) || 0)));
    const hr = new Date(t + 7 * 36e5).getUTCHours(), night = hr < 6 ? 1.9 : hr < 8 || hr >= 23 ? 1.35 : 1;
    const gap = (t - wat < 6e4 ? 95e3 + (at % 50) * 1e3 : 9 * 6e4) * night;
    const W = b.wb && typeof b.wb === 'object' && /^\d{4}-\d\d-\d\dT\d\d$/.test(String(b.wb.k)) && WB_EVS[b.wb.ev] ? b.wb : null;
    if (W && cands.length >= 1) { const kk = `wbev:${sid}:${W.k}:${W.ev}`; if (!(await kvGet(env, kk))) { await kvSet(env, kk, t); wbEv = W } }
    const V = !wbEv && u && b.rv && typeof b.rv === 'object' && RV_EVS[b.rv.ev] && /^[\w:.-]{1,40}$/.test(String(b.rv.k)) ? b.rv : null, rc = V && cands.find(c => c.uid === String(V.who));
    if (rc) { const kk = `rvev:${u.uid}:${V.k}`; if (!(await kvGet(env, kk)) && +(await kvGet(env, 'rvat:' + u.uid) || 0) < t - 2 * 36e5) { await kvSet(env, kk, t); await kvSet(env, 'rvat:' + u.uid, t); rvEv = { ...V, name: rc.name } } }
    // pengumuman server yang baru saja muncul (#1 baru, rekor, MVP, ★3/VIP pemain asli, sebagian ★3 terbatas bot) → satu adegan reaksi
    if (!wbEv && !rvEv && t - +(await kvGet(env, K('anr_at')) || 0) > 4 * 6e4) for (const a of ANR) { if (t - a.ts > 3.5 * 6e4 || !annHot(a)) continue;
      const kk = 'anr:' + a.id; if (await kvGet(env, kk)) continue; await kvSet(env, kk, t); await kvSet(env, K('anr_at'), t); anEv = a; break }
    if (!wbEv && !rvEv && !anEv && !(cands.length >= 2 && t - at >= gap && t > until - 8e3)) {
      // bot gabut kirim stiker (tanpa AI)
      if (t - stkAt < (stkGap || 12e4) || t < until) return { ok: false, skip: 1, next: Math.max(2e4, (stkGap || 12e4) - (t - stkAt)) };
      await kvSet(env, K('stk_at'), t); await kvSet(env, K('stk_gap'), Math.round((240 + rnd01() * 480) * 1000 * night));
      const keys = [...STK.keys()], c = cands[Math.floor(rnd01() * cands.length)];
      const own = keys.filter(k => c.fav && k.startsWith(c.fav.toLowerCase() + '_')), pool = own.length && rnd01() < .4 ? own : keys, k1 = pool[Math.floor(rnd01() * pool.length)];
      const t1 = t + Math.round(1500 + rnd01() * 5000);
      const r1 = await env.DB.prepare('INSERT INTO wchat (uid,name,txt,ts,srv) VALUES (?,?,?,?,?)').bind(c.uid, c.name, `:stk:${k1}:`, t1, sid).run();
      let n = 1;
      if (cands.length > 1 && rnd01() < .15) {   // kadang bot lain ikut nimbrung stiker
        const d = cands.filter(x => x.uid !== c.uid)[Math.floor(rnd01() * (cands.length - 1))], k2 = keys[Math.floor(rnd01() * keys.length)];
        await env.DB.prepare('INSERT INTO wchat (uid,name,txt,ts,re,srv) VALUES (?,?,?,?,?,?)').bind(d.uid, d.name, `:stk:${k2}:`, t1 + Math.round(3000 + rnd01() * 8000), r1.meta.last_row_id, sid).run(); n++;
      }
      return { ok: true, stk: n };
    }
    await kvSet(env, K('ai_scene_at'), t);
  }
  if (!env.ANTHROPIC_API_KEY && !env.AI_FAKE) return { ok: false, e: 'nokey' };
  if (await bump(env, dayKey()) > +(env.AI_DAILY || 2000)) return { ok: false, e: 'quota' };
  // konteks: 16 pesan terakhir bernomor (+ balasan), ingatan tiap penulis (pesannya sendiri sebelumnya)
  const hist = (await env.DB.prepare('SELECT * FROM (SELECT * FROM wchat WHERE srv=? AND ts<=? ORDER BY ts DESC LIMIT 16) ORDER BY ts').bind(sid, t).all()).results;
  const num = new Map(hist.map((h, k) => [h.id, k + 1])), idOf = new Map(hist.map((h, k) => [k + 1, h.id]));
  let quoted = null;
  if (humanMsg && humanMsg.re && !num.has(humanMsg.re)) quoted = await env.DB.prepare('SELECT * FROM wchat WHERE id=?').bind(humanMsg.re).first();
  const lines = hist.map(h => `#${num.get(h.id)} ${hhmm(h.ts)} ${h.name}${u && h.uid === u.uid ? ' (PEMAIN)' : ''}${h.re ? (num.has(h.re) ? ` (balas #${num.get(h.re)})` : ' (balas pesan lama)') : ''}: ${clip(showTxt(h.txt), 160)}`);
  const memQ = (await env.DB.prepare(`SELECT id,uid,txt,ts FROM wchat WHERE uid IN (${cands.map(() => '?').join(',')}) AND ts>? AND ts<=? ORDER BY ts DESC LIMIT 40`).bind(...cands.map(c => c.uid), t - 12 * 36e5, t).all()).results;
  const inHist = new Set(hist.map(h => h.id + ''));
  const mem = uid => memQ.filter(m => m.uid === uid && !inHist.has(String(m.id))).slice(0, 3).map(m => `"${clip(showTxt(m.txt), 70)}"`).join(', ');
  const ovAll = overused(hist), ovOf = uid => overused(memQ.filter(m => m.uid === uid).slice(0, 12), 4);
  const P = b.player || null, d = new Date(t + 7 * 36e5), HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  let user = `WAKTU: ${HARI[d.getUTCDay()]} ${hhmm(t)} WIB · ${clip(b.online, 6)} pemain online · server: ${clip(b.world, 700)}
${P ? `PEMAIN (manusia, data PUBLIK saja): ${clip(P.name, 16)} — ${clip(P.pub, 300)}\n` : ''}${b.humans ? `Pemain asli lain online: ${clip(b.humans, 200)}\n` : ''}PENULIS (pemain lain yang sedang online):
${cands.map(c => { const m = mem(c.uid), o = ovOf(c.uid); return `- ${c.name}: PUBLIK[${c.pub}] PRIBADI-hanya-dia[${c.priv}] GAYA[${c.style}]${m ? ` INGATAN[pernah bilang: ${m}]` : ''}${o.length ? ` JANGAN-ULANG[${o.join(', ')}]` : ''}` }).join('\n')}
${ANR.length ? `PENGUMUMAN SISTEM terbaru (pita berjalan, semua orang lihat; boleh disinggung sesekali, tidak wajib):\n${ANR.slice(0, 4).reverse().map(a => `- ${hhmm(a.ts)} ${annTxt(a)}`).join('\n')}\n` : ''}${ovAll.length ? `Kata yang sudah terlalu sering muncul di obrolan (hindari): ${ovAll.join(', ')}\n` : ''}
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
  } else if (rvEv) {
    user += `\nKEJADIAN SEKARANG (persaingan pribadi): ${RV_EVS[rvEv.ev].replaceAll('{r}', rvEv.name).replaceAll('{p}', clip(P?.name || u.uname, 16))}
Tulis 1-4 pesan: ${rvEv.name} menulis 1-2 pesan duluan (boleh menyebut ${clip(P?.name || u.uname, 16)} atau tidak), lalu 0-2 penulis lain boleh ikut nimbrung singkat (ngompor-ngomporin, ketawa). Wajar, pendek, seperti obrolan game sungguhan. delay = detik 2-15.
JSON: {"out":[{"who":"nama","text":"...","re":null,"stk":"","delay":4}]}`;
  } else if (anEv) {
    const ad = pj(anEv.d, {}), who = cands.find(c => c.uid === anEv.uid), prev = ad.pu && cands.find(c => c.uid === ad.pu);
    const how = anEv.ty === 'p3' ? (ad.hu ? `${anEv.name} itu PEMAIN ASLI yang sedang main: beberapa orang memberi selamat atau iri bercanda (boleh sebut namanya), ada yang nanya habis berapa tarikan.` : 'kagum atau iri bercanda ("hoki amat"), nanya habis berapa tarikan / banner apa, ada juga yang cuek.')
      : anEv.ty === 'vip' ? 'nyindir sultan bercanda ("dompet tebal", "donatur server"), kagum, atau pura-pura nangis sebagai f2p.'
      : anEv.ty === 'top1' ? `heboh singkat, nanya timnya apa${ad.pn ? `, ngeledek ${ad.pn} yang tergeser${prev ? ` (${ad.pn} ada di daftar penulis: boleh ngeles/kesal bercanda)` : ''}` : ''}.`
      : anEv.ty === 't10' ? `ada yang baru masuk 10 besar: kagum, nanya CP atau timnya, bilang mau nyusul${ad.hu ? ` (${anEv.name} PEMAIN ASLI: boleh disapa namanya)` : ''}.`
      : anEv.ty === 'rec' ? 'kagum, nanya timnya, iri bercanda, atau bilang mau nyusul.' : 'yang ikut raid membahas damage & peringkatnya, kagum ke MVP, ngeluh telat masuk.';
    user += `\nKEJADIAN SEKARANG: pengumuman sistem barusan muncul: "${annTxt(anEv)}".${who ? ` ${who.name} adalah orang di pengumuman itu dan ada di daftar penulis: boleh ikut menanggapi (senang, pamer tipis, atau merendah), tidak wajib.` : ''}
Reaksi alami: ${how} Tulis 2-5 pesan dari 2-3 penulis, pendek-pendek, sebagian saling sahut. Jangan mengulang isi pengumuman kata per kata dan jangan semua memberi selamat. delay = detik 2-15.
JSON: {"out":[{"who":"nama","text":"...","re":null,"stk":"","delay":4}]}`;
  } else if (wbEv) {
    user += `\nKEJADIAN SEKARANG DI GAME: ${WB_EVS[wbEv.ev].replace('{b}', clip(String(wbEv.boss || 'Naga'), 20)).replace('{p}', Math.max(0, Math.min(100, +wbEv.p || 0)))}${WB_EL[wbEv.el] ? `\nFAKTA: elemen naga ini ${WB_EL[wbEv.el]}. Fase Sisik Baja (sisa HP di bawah 50%): hanya elemen unggul yang menembus penuh. Tim tumbang bangkit lagi setelah 10 detik.` : ''}
Tulis 3-6 pesan dari 2-4 penulis yang bereaksi ke kejadian itu secara alami (bukan pengumuman resmi), pendek-pendek, sebagian saling sahut. delay = detik 2-15.
JSON: {"out":[{"who":"nama","text":"...","re":null,"stk":"","delay":4}]}`;
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
  } catch (e) { if (kind === 'tick') await kvSet(env, K('ai_scene_at'), t - 6e4); return { ok: false, e: 'ai', m: String(e.message).slice(0, 120) } }
  const byName = new Map(cands.map(c => [c.name.toLowerCase(), c]));
  let tt = t + (kind === 'reply' ? 1500 : 2500); const st = [];
  for (const x of out) {
    const c = byName.get(String(x.who || '').toLowerCase()); if (!c) continue;
    const re = idOf.get(+x.re) || null, delay = Math.max(1, Math.min(40, +x.delay || 4)) * 1000;
    if (x.stk && STK.has(String(x.stk))) { tt += delay; st.push(env.DB.prepare('INSERT INTO wchat (uid,name,txt,ts,re,srv) VALUES (?,?,?,?,?,?)').bind(c.uid, c.name, `:stk:${x.stk}:`, Math.round(tt), re, sid)); continue }
    let txt = clip(x.text, 260).replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '').replace(/https?\S+/g, '').trim(); if (!txt) continue;
    txt = txt.replace(/(^|\s)(:3|qwq|uwu|owo|>_<|\^\^|\^_\^|desu|nya|sugoi|yabai|yosh|kawaii)(?=\s|$|[.,!?])/gi, ' ').replace(/\s+(ne|nee)\s*([.!?]*)$/i, '$2').replace(/~+/g, '').replace(/\s{2,}/g, ' ').trim(); if (!txt) continue;   // buang sisa gaya wibu
    if (c.lower) txt = txt.toLowerCase();
    chunks(txt).forEach((part, k) => { tt += (k ? 1800 : delay) + part.length * 85; st.push(env.DB.prepare('INSERT INTO wchat (uid,name,txt,ts,re,srv) VALUES (?,?,?,?,?,?)').bind(c.uid, c.name, part.slice(0, 140), Math.round(tt), k ? null : re, sid)) });
  }
  if (st.length) await env.DB.batch(st.slice(0, 16));
  if (kind === 'tick') await kvSet(env, K('ai_until'), Math.round(tt));
  return { ok: true, n: st.length, until: Math.round(tt), rv: !!rvEv, an: anEv ? anEv.id : null };
}

/* ---------------- PENGUMUMAN SERVER (tabel ann · angka: src/js/data/announce.js → BOTCFG.ANN) ----------------
   ★3 dari Panggilan, naik VIP, pergantian #1 CP/Arena, rekor pertama server, MVP Bos Dunia → pita berjalan di beranda
   + baris [Sistem] di Obrolan Dunia, sama untuk semua pemain di server itu.
   - Kejadian BOT dihitung game (deterministik, sama di semua perangkat) dan dilaporkan ±6 menit SEBELUM terjadi →
     disimpan dengan waktu kejadiannya (ts di masa depan, baru dikirim ke pemain saat waktunya). Kunci (k) unik per slot:
     laporan ganda dari banyak pemain diabaikan dan ★3/VIP bot paling banyak satu per slot.
   - Kejadian PEMAIN ASLI dilaporkan saat terjadi (wajib masuk akun). Akun GM: hanya terlihat oleh dirinya sendiri,
     tidak ikut #1/rekor/MVP (GM juga tidak tampil di Peringkat pemain lain).
   - Rekor (ty='rec') disimpan sampai server direset; banyak rekor sekaligus → satu diumumkan, sisanya tercatat diam-diam (q). */
const AC = BOTCFG.ANN || {}, HERO = BOTCFG.HERO || {}, WNAME = BOTCFG.WORLDS || [], WBN = BOTCFG.WBOSS || [];
const ANN_TY = new Set(['p3', 'vip', 'top1', 't10', 'rec', 'mvp']);
const annNice = a => ({ id: a.id, k: a.k, ty: a.ty, uid: a.uid, u: a.name, d: pj(a.d, {}), ts: a.ts });
const numID = n => n >= 1e6 ? String(Math.round(n / 1e5) / 10).replace('.', ',') + ' juta' : n >= 1e3 ? String(Math.round(n / 100) / 10).replace('.', ',') + ' ribu' : String(Math.round(n));
function recOk(r) {
  const m = /^(st|cp|a|all):(\d{1,8})$/.exec(String(r || '')); if (!m) return false; const v = +m[2];
  return m[1] === 'st' ? v >= 1 && v <= WNAME.length : m[1] === 'cp' ? (AC.recCP || []).includes(v) : m[1] === 'a' ? (AC.recAsc || []).includes(v) : v >= 10 && v <= Object.keys(HERO).length;
}
// teks Indonesia (konteks AI): sama dengan teks di game (ui/announce.js)
function annTxt(a) {
  const d = typeof a.d === 'string' ? pj(a.d, {}) : (a.d || {}), n = a.name || a.u || '?', H = id => (HERO[id] || [id])[0];
  if (a.ty === 'p3') { const hs = (d.h || []).map(H); return d.n ? `Hoki! ${n} mendapatkan ★3 ${hs[0]} hanya dalam ${d.n} tarikan!` : `Selamat! ${n} mendapatkan ★3 ${d.l ? 'terbatas ' : ''}${hs.join(' & ')}!` }
  if (a.ty === 'vip') return d.v >= 7 ? `${n} mencapai VIP ${d.v}, tingkat tertinggi!` : `Selamat! ${n} naik ke VIP ${d.v}!`;
  if (a.ty === 't10') return `Selamat! ${n} masuk 10 besar Peringkat CP server!`;
  if (a.ty === 'top1') return d.b === 'ar' ? (d.pn ? `${n} menggeser ${d.pn} dari puncak Arena!` : `${n} kini memimpin peringkat Arena!`) : (d.pn ? `${n} merebut Peringkat #1 CP server dari ${d.pn}!` : `${n} kini Peringkat #1 CP server!`);
  if (a.ty === 'rec') { const [k, v] = String(d.r || '').split(':');
    return `Rekor server! ${n} jadi yang pertama ${k === 'st' ? 'menamatkan ' + (WNAME[+v - 1] || 'Dunia ' + v) : k === 'cp' ? 'menembus CP ' + numID(+v) : k === 'a' ? 'membangkitkan hero ke ★' + v : 'mengoleksi semua ' + v + ' hero'}!` }
  if (a.ty === 'mvp') return d.k ? `Bos Dunia ${d.b} tumbang! MVP: ${n} dengan ${numID(d.dmg)} damage.` : `Bos Dunia ${d.b} berhasil kabur. Damage terbesar: ${n}.`;
  return '';
}
// momen yang memancing obrolan (sama dengan annHot di game): #1, rekor, MVP, kejadian pemain asli; sebagian ★3 terbatas/hoki & VIP 7 bot
function annHot(a) {
  const d = typeof a.d === 'string' ? pj(a.d, {}) : (a.d || {}); if (d.gm || d.q) return false;
  if (a.ty === 'top1' || a.ty === 'rec' || a.ty === 'mvp') return true;
  if (d.hu) return a.ty === 'p3' || a.ty === 'vip' || a.ty === 't10';
  return a.ty === 'p3' ? !!(d.l || d.n) && a.id % 100 < 40 : a.ty === 't10' ? a.id % 100 < 30 : a.ty === 'vip' && d.v >= 7 && a.id % 100 < 30;
}
// subjek pengumuman harus pemain asli / bot server ini; nama selalu dari server
async function annSubj(env, sv, uid) {
  if (!/^\d{8}$/.test(String(uid || ''))) return null;
  const r = await env.DB.prepare('SELECT uid,uname,bot,bw,srv,ban,gm FROM players WHERE uid=?').bind(String(uid)).first();
  if (!r || r.ban) return null;
  if (r.bot != null ? !sv.W.some(w => w.g === r.bw) : (r.srv !== sv.id || r.gm)) return null;
  return r;
}
async function annTop(env, sid) {
  const top = {};
  for (const bd of ['cp', 'ar']) { const r = await env.DB.prepare("SELECT uid,name,ts FROM ann WHERE srv=? AND k>=? AND k<? ORDER BY ts DESC LIMIT 1").bind(sid, 'top1:' + bd + ':', 'top1:' + bd + ';').first(); if (r) top[bd] = { uid: r.uid, u: r.name, ts: r.ts } }
  return top;
}
async function annPost(env, b) {
  const t = now(), u = b.tok ? await auth(env, b) : null; if (u && u.ban) return { ok: false, e: 'ban' };
  const sv = await srvGet(env, u ? u.srv : +b.srv || 1); if (!sv || srvSt(sv) !== 'open') return { ok: false, e: 'srv' };
  const sid = sv.id, L = (Array.isArray(b.list) ? b.list : []).slice(0, 8), out = [];
  if ((await env.DB.prepare('SELECT COUNT(*) n FROM ann WHERE srv=? AND ts>?').bind(sid, t - 10 * 6e4).first()).n > 40) return { ok: true, add: 0, full: 1 };   // pelindung banjir
  for (const x of L) {
    if (!x || !ANN_TY.has(x.ty)) continue;
    const self = x.uid == null || (u && String(x.uid) === u.uid);
    const subj = self ? u : await annSubj(env, sv, x.uid); if (!subj) continue;
    const isBot = subj.bot != null, gm = !isBot && !!subj.gm, tt = Math.round(+x.t || 0), fut = tt >= t - 2 * 6e4 && tt <= t + 8 * 6e4;
    let k = null, d = {}, ts = t;
    if (x.ty === 'p3') {
      if (isBot) { const h = String(x.h || ''), hs = HERO[h]; if (!hs || hs[1] !== 3 || !fut) continue;
        k = 'p3:' + Math.floor(tt / AC.p3Slot); d = { h: [h], l: x.l && hs[2] ? 1 : 0 }; const n = Math.round(+x.n || 0); if (n >= 1 && n <= 10) d.n = n; ts = Math.max(tt, t) }
      else { const hs = [...new Set((Array.isArray(x.h) ? x.h : []).map(String))].filter(h => HERO[h] && HERO[h][1] === 3).slice(0, 3); if (!hs.length) continue;
        k = 'p3u:' + subj.uid + ':' + Math.floor(t / 2e4); d = { h: hs, l: hs.some(h => HERO[h][2]) ? 1 : 0, hu: 1 }; const n = Math.round(+x.n || 0); if (hs.length === 1 && n >= 1 && n <= 10) d.n = n }
    } else if (x.ty === 'vip') {
      const v = Math.round(+x.v || 0); if (v < (AC.vipMin || 3) || v > 7) continue;
      if (isBot) { if (!fut) continue; k = 'vb:' + Math.floor(tt / AC.vipSlot); ts = Math.max(tt, t); d = { v } } else { k = 'vip:' + subj.uid + ':' + v; d = { v, hu: 1 } }
    } else if (x.ty === 'top1') {
      if (gm) continue; const bd = x.b === 'ar' ? 'ar' : 'cp', last = (await annTop(env, sid))[bd];
      if (last && (last.uid === subj.uid || t - last.ts < (AC.cd || {})[bd])) continue;
      k = 'top1:' + bd + ':' + Math.floor(t / 6e4); d = { b: bd, v: Math.max(0, Math.min(1e10, Math.round(+x.v || 0))) }; if (last) { d.pn = last.u; d.pu = last.uid } if (!isBot) d.hu = 1;
    } else if (x.ty === 't10') {   // pertama kali masuk 10 besar CP (sekali per orang per server); bot: maks 1 diumumkan per 10 menit
      if (gm) continue; k = 't10:' + subj.uid; d = { r: Math.max(1, Math.min(10, Math.round(+x.r || 10))) }; if (!isBot) d.hu = 1;
      else { const lt = await env.DB.prepare("SELECT ts FROM ann WHERE srv=? AND ty='t10' AND d NOT LIKE '%\"q\":1%' ORDER BY ts DESC LIMIT 1").bind(sid).first(); if (lt && t - lt.ts < 10 * 6e4) d.q = 1 }
    } else if (x.ty === 'rec') {
      if (gm || !recOk(x.r)) continue; k = 'rec:' + x.r; d = { r: String(x.r) }; if (!isBot) d.hu = 1;
      const lr = await env.DB.prepare("SELECT ts FROM ann WHERE srv=? AND ty='rec' AND d NOT LIKE '%\"q\":1%' ORDER BY ts DESC LIMIT 1").bind(sid).first();
      if (lr && t - lr.ts < 3 * 6e4) d.q = 1;
    } else if (x.ty === 'mvp') {
      const wk = String(x.wk || ''), t0 = Date.parse(wk + ':00:00Z') - 7 * 36e5;
      if (gm || !/^\d{4}-\d\d-\d\dT\d\d$/.test(wk) || !(t > t0 && t < t0 + 3 * 36e5)) continue;
      k = 'mvp:' + wk; d = { b: WBN.includes(String(x.b)) ? String(x.b) : 'Naga', dmg: Math.max(0, Math.min(1e13, Math.round(+x.dmg || 0))), k: x.k ? 1 : 0 }; if (!isBot) d.hu = 1;
    }
    if (!k) continue; if (gm) d.gm = 1;
    const r = await env.DB.prepare('INSERT OR IGNORE INTO ann (srv,k,ty,uid,name,d,ts) VALUES (?,?,?,?,?,?,?)').bind(sid, k, x.ty, subj.uid, subj.uname, JSON.stringify(d), Math.round(ts)).run();
    if (r.meta.changes) out.push({ id: r.meta.last_row_id, k, ty: x.ty, uid: subj.uid, u: subj.uname, d, ts: Math.round(ts) });
  }
  if (out.length && rnd01() < .05) await env.DB.prepare("DELETE FROM ann WHERE srv=? AND ty IN ('p3','vip','mvp') AND ts<?").bind(sid, t - (AC.keep || 3 * 864e5)).run();
  return { ok: true, add: out.length, list: out.filter(a => a.ts <= t + 1000) };
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
const card = p => { const pr = pj(p.prof, {}), ov = pj(p.ov, {}); return { uid: p.uid, u: p.uname, bot: p.bot, bw: p.bw ?? null, srv: p.bot == null ? p.srv : null, lv: ov.lv ?? p.lv, cp: ov.cp ?? p.cp, vip: ov.vip ?? pr.vip ?? 0, top: pr.top || null, last: p.last, on: p.bot == null && now() - p.last < ONLINE_MS } };
const byKey = (env, q) => /^\d{8}$/.test(q) ? env.DB.prepare('SELECT * FROM players WHERE uid=?').bind(q).first() : env.DB.prepare('SELECT * FROM players WHERE uname=? COLLATE NOCASE').bind(q).first();
async function friendRow(env, x, y) { const [a, b] = pair(x, y); return env.DB.prepare('SELECT * FROM friends WHERE a=? AND b=?').bind(a, b).first() }
async function counts(env, uid) {
  const [dm, fr] = await Promise.all([
    env.DB.prepare('SELECT COUNT(*) n FROM dms WHERE too=? AND rd=0 AND ts<=?').bind(uid, now()).first(),
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
    const SL = await srvList(env), sv0 = SL.find(x => x.id === +b.srv) || (b.srv == null ? SL.filter(x => !x.full && x.st === 'open').pop() : null);
    if (!sv0) return fail(SL.some(x => x.st !== 'list') ? 'srv' : 'srvnone');
    if (sv0.st === 'list') return json({ ok: false, e: 'srvlist', sv: { id: sv0.id, name: sv0.name, at: 0 } }, 403);   // baru terdaftar: belum bisa dipilih
    if (sv0.full) return fail('srvfull');
    const salt = hex(rnd(12)), ph = await pwHash(pw, salt);
    let uid = newUid();
    for (let k = 0; k < 5 && await env.DB.prepare('SELECT 1 FROM players WHERE uid=?').bind(uid).first(); k++) uid = newUid();
    const sv = b.save ? 1 : 0, save = b.save ? JSON.stringify(b.save).slice(0, 400000) : null;
    try { await env.DB.prepare('INSERT INTO players (uid,uname,ph,salt,created,last,sv,save,lv,cp,prof,srv) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').bind(uid, u, 'p2$' + ph, salt, now(), now(), sv, save, +b.prof?.lv || 1, +b.prof?.cp || 0, b.prof ? JSON.stringify(b.prof).slice(0, 20000) : null, sv0.id).run() }
    catch (e) { return fail('taken') }
    // server terjadwal (pra-registrasi): akun dibuat, tapi baru bisa masuk saat jam buka
    return json({ ok: true, tok: await newSession(env, uid), uid, u, sv, srv: sv0.id, ...(sv0.st === 'soon' ? { pre: { id: sv0.id, name: sv0.name, at: sv0.opened } } : {}) });
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
    if (r.watch) return json({ ok: true, tok: await newSession(env, r.uid), uid: r.uid, u: r.uname, sv: 0, save: null, gm: 0, watch: 1, srv: 0 });   // akun penonton: dashboard saja
    let S0 = await srvGet(env, r.srv), st = srvSt(S0), moved = 0;
    if (st !== 'open' && !r.gm) {
      if (st !== 'gone') return json({ ok: false, e: st === 'soon' ? 'srvsoon' : 'srvlist', sv: { id: S0.id, name: S0.name, at: st === 'soon' ? S0.opened : 0 } }, 403);
      // servernya sudah dihapus: pilih server lain yang sudah buka (b.srv), lalu akun pindah ke sana
      const L = (await srvList(env)).filter(x => x.st === 'open' && !x.full), to = b.srv != null && L.find(x => x.id === +b.srv);
      if (!to) return json({ ok: false, e: 'srvgone', old: r.srv, list: L }, 409);
      await env.DB.prepare('UPDATE players SET srv=? WHERE uid=?').bind(to.id, r.uid).run(); S0 = await srvGet(env, to.id); st = 'open'; moved = 1;
    }
    return json({ ok: true, tok: await newSession(env, r.uid), uid: r.uid, u: r.uname, sv: r.sv, save: pj(r.save), gm: r.gm ? 1 : 0, srv: S0 ? S0.id : r.srv, srvst: st, ...(moved ? { moved: 1 } : {}) });
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
    const [u, f] = await me(); if (f) return f; if (u.watch) return fail('watch', 403);
    if (+b.base !== u.sv) return json({ ok: false, conflict: 1, sv: u.sv, save: pj(u.save) });
    const s = JSON.stringify(b.save || null); if (s.length > 400000) return fail('big');
    const pr = b.prof || {}, sv = u.sv + 1;
    const r = await env.DB.prepare('UPDATE players SET save=?, sv=?, lv=?, cp=?, prof=?, last=? WHERE uid=? AND sv=?').bind(s, sv, Math.max(1, +pr.lv || 1), Math.max(0, Math.round(+pr.cp || 0)), JSON.stringify(pr).slice(0, 20000), now(), u.uid, u.sv).run();
    if (!r.meta.changes) return json({ ok: false, conflict: 1 });
    return json({ ok: true, sv });
  }
  if (p === '/api/load') { const [u, f] = await me(); if (f) return f; return json({ ok: true, sv: u.sv, save: pj(u.save), u: u.uname, gm: u.gm ? 1 : 0, srv: u.srv }) }
  if (p === '/api/servers') return json({ ok: true, list: await srvList(env), t: now() });
  if (p.startsWith('/api/g/') || p.startsWith('/api/rel/')) return guildRoute(p, b, env, { json, fail, me, srvGet, srvSt, kvGet, kvSet, clean, pj, url, auth, card });
  if (p === '/api/acc/srv') {   // akun yang servernya sudah dihapus memilih server baru (hanya saat itu; akun tetap terikat ke satu server)
    const [u, f] = await me(); if (f) return f; if (u.watch) return fail('watch', 403);
    if (srvSt(await srvGet(env, u.srv)) !== 'gone') return fail('srvstay');
    const to = (await srvList(env)).find(x => x.id === +b.srv && x.st === 'open' && !x.full); if (!to) return fail('srv');
    await env.DB.prepare('UPDATE players SET srv=? WHERE uid=?').bind(to.id, u.uid).run();
    return json({ ok: true, srv: to.id, name: to.name });
  }
  if (p === '/api/srv/merge') {   // khusus akun GM: gabung server a ke b
    const [u, f] = await me(); if (f) return f; if (!u.gm) return fail('gm', 403);
    return json(await mergeServer(env, b.from, b.to));
  }
  if (p === '/api/ping') {
    const [u, f] = await me(); if (f) return f;
    const SV = await srvGet(env, u.srv);
    const [c, wc, ai] = await Promise.all([counts(env, u.uid), env.DB.prepare('SELECT COALESCE(MAX(ts),0) m FROM wchat WHERE srv=? AND ts<=?').bind(SV ? SV.id : u.srv, now()).first(), aiOnline(env), env.DB.prepare('UPDATE players SET last=? WHERE uid=?').bind(now(), u.uid).run()]);
    const st = srvSt(SV);   // server belum buka / dihapus → game kembali ke layar judul (kecuali GM & penonton)
    // guild: versi keadaan guild server (gv), tick politik terakhir (gtk), pesan guild terbaru (gcm), AI DM + guild (aig)
    const [gv, gtk, gcm, aig] = SV ? await Promise.all([kvGet(env, 'gv:' + SV.id), kvGet(env, 'gt:' + SV.id), env.DB.prepare('SELECT COALESCE(MAX(c.ts),0) m FROM gchat c JOIN gmem m ON m.gid=c.gid WHERE m.uid=? AND c.ts<=?').bind(u.uid, now()).first(), aiDmOn(env, kvGet)]) : [0, 0, { m: 0 }, false];
    return json({ ok: true, sv: u.sv, u: u.uname, gm: u.gm ? 1 : 0, ...(u.watch ? { watch: 1 } : {}), ...c, wc: wc.m, ai, aig, gv: +gv || 0, gtk: +gtk || 0, gcm: gcm.m, srv: SV ? SV.id : u.srv, wsig: SV ? SV.W.map(w => w.g).join(',') : '', srvst: st, ...(SV ? { svn: SV.name, sva: SV.opened } : {}), t: now() });
  }

  // ---- dunia & pemain ----
  if (p === '/api/world') {   // dunia-dunia bot satu server (?srv=id&from=a,b,.. per dunia)
    const SV = await srvGet(env, +url.searchParams.get('srv') || 1); if (!SV) return fail('srv', 404);
    const from = String(url.searchParams.get('from') || '').split(',').map(x => Math.max(0, +x || 0)), out = [];
    for (let k = 0; k < SV.W.length; k++) { const w = SV.W[k]; await ensureBots(env, w);
      const { results } = await env.DB.prepare('SELECT bot,uid,uname FROM players WHERE bw=? AND bot>=? ORDER BY bot LIMIT ?').bind(w.g, from[k] || 0, w.cap + 250).all();
      const ov = (await env.DB.prepare('SELECT bot,ov FROM players WHERE bw=? AND ov IS NOT NULL').bind(w.g).all()).results;
      const rvq = (await env.DB.prepare('SELECT bot,t0,t1,dp FROM rvb WHERE gen=? ORDER BY bot,t0 LIMIT 4000').bind(w.g).all()).results, rv = {};
      for (const r of rvq) (rv[r.bot] = rv[r.bot] || []).push([r.t0, r.t1, r.dp]);
      out.push({ g: w.g, e: w.e, cap: w.cap, newer: w.newer, v: w.v, h: w.h, o: w.o, wh: w.wh, from: from[k] || 0, bots: results.map(r => [r.uid, r.uname]), ov: Object.fromEntries(ov.map(r => [r.bot, pj(r.ov, {})])), rv }) }
    return json({ ok: true, srv: SV.id, name: SV.name, opened: SV.opened, worlds: out });
  }
  // ---- rival abadi: bot rival berusaha lebih keras (farming ekstra) di sesi main berikutnya; dibatasi supaya wajar ----
  if (p === '/api/rv/boost') {
    const [u, e] = await me(); if (e) return e;
    const SV = await srvGet(env, u.srv), w = SV && SV.W.find(x => x.g === +b.gen), bot = Math.floor(+b.bot), t0 = Math.round(+b.t0), t1 = Math.round(+b.t1), dp = +b.dp, t = now();
    if (!w || !(bot >= 0) || !(dp > 0 && dp <= .8) || !(t0 > t - 36e5 && t0 < t + 30 * 36e5) || !(t1 - t0 >= 5 * 6e4 && t1 - t0 <= 3 * 36e5)) return json({ ok: false, e: 'bad' });
    const bt = await env.DB.prepare('SELECT 1 FROM players WHERE bw=? AND bot=?').bind(w.g, bot).first(); if (!bt) return json({ ok: false, e: 'bot' });
    const last = await env.DB.prepare('SELECT MAX(ts) m FROM rvb WHERE gen=? AND bot=? AND uid=?').bind(w.gen, bot, u.uid).first();
    if (last && last.m && t - last.m < 18 * 36e5) return json({ ok: false, e: 'soon' });
    const day = await env.DB.prepare('SELECT COALESCE(SUM(dp),0) s FROM rvb WHERE gen=? AND bot=? AND t0>?').bind(w.gen, bot, t0 - 864e5).first();
    if (day.s + dp > 1.2) return json({ ok: false, e: 'cap' });
    await env.DB.prepare('INSERT INTO rvb (gen,bot,t0,t1,dp,uid,ts) VALUES (?,?,?,?,?,?,?)').bind(w.gen, bot, t0, t1, dp, u.uid, t).run();
    return json({ ok: true });
  }
  if (p === '/api/players') {
    const { results } = await env.DB.prepare('SELECT uid,uname,bot,lv,cp,prof,ov,last,srv FROM players WHERE bot IS NULL AND ban=0 AND gm=0 AND srv=? AND last>? ORDER BY cp DESC LIMIT 500').bind((await srvGet(env, +url.searchParams.get('srv') || 1))?.id || 1, now() - 45 * DAY).all();
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
    const SV = await srvGet(env, +url.searchParams.get('srv') || +b.srv || 1), G = new Set(SV ? SV.W.map(w => w.g) : []);
    return json({ ok: true, list: results.filter(r => !r.ban && (r.bot == null ? r.srv === (SV && SV.id) : G.has(r.bw))).map(card) });
  }
  if (p === '/api/bots/snap') {   // potret bot dari game (untuk dilihat admin di Telegram)
    const [u, f] = await me(); if (f) return f;
    const L = Array.isArray(b.list) ? b.list.slice(0, 120) : [], t = now();
    const st = L.filter(o => /^\d{8}$/.test(String(o.uid))).map(o => env.DB.prepare('UPDATE players SET lv=?, cp=?, prof=? WHERE uid=? AND bot IS NOT NULL').bind(Math.max(1, +o.lv || 1), Math.max(0, Math.round(+o.cp || 0)), JSON.stringify({ ...o, at: t }).slice(0, 4000), String(o.uid)));
    for (let k = 0; k < st.length; k += 40) await env.DB.batch(st.slice(k, k + 40));
    return json({ ok: true, n: st.length });
  }

  // ---- teman ----
  if (p.startsWith('/api/fr/')) {
    const [u, f] = await me(); if (f) return f;
    const act = p.slice(8);
    if (act === 'list') {
      const { results } = await env.DB.prepare('SELECT f.*, p.uid puid, p.uname, p.bot, p.bw, p.srv, p.lv, p.cp, p.prof, p.ov, p.last FROM friends f JOIN players p ON p.uid = (CASE WHEN f.a=? THEN f.b ELSE f.a END) WHERE (f.a=? OR f.b=?) AND f.st IN (\'ok\',\'req\') ORDER BY f.ts DESC LIMIT 300').bind(u.uid, u.uid, u.uid).all();
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
    if (act === 'threads') {   // pesan terakhir (yang sudah terkirim, ts <= sekarang) per lawan bicara
      const t = now();
      const { results } = await env.DB.prepare(`SELECT d.*, p.uname, p.bot, p.bw, p.srv, p.lv, p.cp, p.prof, p.ov, p.last plast, p.uid puid FROM dms d JOIN (SELECT CASE WHEN frm=? THEN too ELSE frm END pr, MAX(ts) mt FROM dms WHERE (frm=? OR too=?) AND ts<=? GROUP BY pr) x
        ON x.pr = CASE WHEN d.frm=? THEN d.too ELSE d.frm END AND d.ts=x.mt JOIN players p ON p.uid=x.pr WHERE (d.frm=? OR d.too=?) ORDER BY d.ts DESC, d.id DESC LIMIT 60`).bind(u.uid, u.uid, u.uid, t, u.uid, u.uid, u.uid).all();
      const seen = new Set(), rows = results.filter(r => !seen.has(r.puid) && seen.add(r.puid)).slice(0, 50);
      const un = (await env.DB.prepare('SELECT frm, COUNT(*) n FROM dms WHERE too=? AND rd=0 AND ts<=? GROUP BY frm').bind(u.uid, t).all()).results;
      const U = Object.fromEntries(un.map(r => [r.frm, r.n]));
      return json({ ok: true, list: rows.map(r => ({ ...card({ ...r, uid: r.puid, last: r.plast }), msg: { txt: r.txt, ts: r.ts, me: r.frm === u.uid }, unread: U[r.puid] || 0 })) });
    }
    const w = String(b.uid || '');
    if (act === 'get') {   // after = ts terakhir yang sudah dilihat; pesan bot yang masih "diketik" (ts di masa depan) belum dikirim
      const after = Math.max(0, +b.after || 0), t = now();
      const { results } = await env.DB.prepare('SELECT * FROM (SELECT * FROM dms WHERE ((frm=? AND too=?) OR (frm=? AND too=?)) AND ts>? AND ts<=? ORDER BY ts DESC, id DESC LIMIT 80) ORDER BY ts, id').bind(u.uid, w, w, u.uid, after, t).all();
      if (results.some(r => r.too === u.uid && !r.rd)) await env.DB.prepare('UPDATE dms SET rd=? WHERE frm=? AND too=? AND rd=0 AND ts<=?').bind(t, w, u.uid, t).run();
      // rd = waktu dibaca (bot membaca pada waktunya sendiri; 1 = data lama)
      const rd = await env.DB.prepare('SELECT COALESCE(MAX(id),0) m FROM dms WHERE frm=? AND too=? AND rd>0 AND rd<=?').bind(u.uid, w, t).first();
      // "sedang mengetik": balasan berikutnya tinggal <15 dtk lagi DAN pesan terakhirmu sudah dibaca
      const ty = await env.DB.prepare('SELECT MIN(ts) m FROM dms WHERE frm=? AND too=? AND ts>?').bind(w, u.uid, t).first();
      const lm = ty && ty.m && ty.m - t < 15e3 ? await env.DB.prepare('SELECT rd FROM dms WHERE frm=? AND too=? ORDER BY ts DESC, id DESC LIMIT 1').bind(u.uid, w).first() : null;
      return json({ ok: true, list: results.map(r => ({ id: r.id, me: r.frm === u.uid, txt: r.txt, ts: r.ts })), seen: rd.m, typing: !!(ty && ty.m && ty.m - t < 15e3 && (!lm || (lm.rd > 0 && lm.rd <= t))) });
    }
    if (act === 'pending') {   // teman bot yang belum membaca pesanmu (game memutuskan kapan si bot online untuk membacanya)
      const { results } = await env.DB.prepare('SELECT d.too uid, MIN(d.ts) t0, MAX(d.ts) t1, COUNT(*) n FROM dms d JOIN players p ON p.uid=d.too WHERE d.frm=? AND d.rd=0 AND p.bot IS NOT NULL GROUP BY d.too LIMIT 20').bind(u.uid).all();
      return json({ ok: true, list: results });
    }
    if (act === 'bot') return json(await dmBot(env, u, w, b));
    if (act === 'send') {
      const txt = clean(b.txt, 300); if (!txt) return fail('empty');
      // teman, atau bot yang lebih dulu mengirim pesan (mis. menyapa karena kamu terkenal / mengajak ke guild-nya)
      const row = await friendRow(env, u.uid, w); if ((!row || row.st !== 'ok') && !(await env.DB.prepare('SELECT 1 FROM dms d JOIN players p ON p.uid=d.frm WHERE d.frm=? AND d.too=? AND p.bot IS NOT NULL LIMIT 1').bind(w, u.uid).first())) return fail('notfriend', 403);
      const last = await env.DB.prepare('SELECT ts FROM dms WHERE frm=? ORDER BY id DESC LIMIT 1').bind(u.uid).first();
      if (last && now() - last.ts < 700) return fail('fast', 429);
      const r = await env.DB.prepare('INSERT INTO dms (frm,too,txt,ts) VALUES (?,?,?,?)').bind(u.uid, w, txt, now()).run();
      if (await env.DB.prepare('SELECT 1 FROM players WHERE uid=? AND bot IS NOT NULL').bind(w).first()) await relStmt(env, u.uid, w, 1).run();   // ngobrol = makin akrab
      return json({ ok: true, id: r.meta.last_row_id, ts: now() });
    }
    return fail('act', 404);
  }

  // ---- obrolan dunia ---- (dibaca per waktu: ?since=<ts>; pesan berjadwal baru muncul saat waktunya tiba)
  if (p === '/api/wc/ai') { let u = null; if (b.tok) { u = await auth(env, b); if (u?.ban) u = null } return json(await aiChat(env, b, u)) }
  // ---------- Bos Dunia: damage pemain asli per raid ----------
  if (p === '/api/wb') {
    const slot0 = String(req.method === 'GET' ? url.searchParams.get('slot') : b.slot || '');
    if (!/^\d{4}-\d\d-\d\dT(12|16|20|23)$/.test(slot0)) return fail('slot');
    let uu = null; if (req.method !== 'GET') { const [u, f] = await me(); if (f) return f; uu = u }
    const SV = await srvGet(env, uu ? uu.srv : +url.searchParams.get('srv') || 1), slot = (SV ? SV.id : 1) + ':' + slot0;   // raid per server
    const t0 = Date.parse(slot0 + ':00:00Z') - 7 * 36e5, t = now();
    const out = async () => {
      const { results } = await env.DB.prepare('SELECT w.uid,w.name,w.dmg,w.cp FROM wbdmg w JOIN players p ON p.uid=w.uid WHERE w.slot=? AND p.ban=0 AND p.gm=0 ORDER BY w.dmg DESC LIMIT 100').bind(slot).all();
      const lh = await kvGet(env, 'wblh:' + slot);
      return json({ ok: true, rows: results.map(r => ({ uid: r.uid, u: r.name, dmg: r.dmg, cp: r.cp })), lh: lh ? pj(lh, null) : null });
    };
    if (req.method === 'GET') return out();
    const u = uu;
    if (t < t0 || t > t0 + 12 * 6e4) return fail('closed');
    if (b.lh) { const k = 'wblh:' + slot; if (!(await kvGet(env, k))) await kvSet(env, k, JSON.stringify({ uid: u.uid, u: u.uname, t })); return out() }
    const dmg = Math.max(0, Math.min(1e13, Math.round(+b.dmg || 0))), cp = Math.max(0, Math.min(1e10, Math.round(+b.cp || 0)));
    await env.DB.prepare('INSERT INTO wbdmg (slot,uid,name,dmg,cp,ts) VALUES (?,?,?,?,?,?) ON CONFLICT(slot,uid) DO UPDATE SET dmg=MAX(dmg,excluded.dmg), cp=excluded.cp, name=excluded.name, ts=excluded.ts').bind(slot, u.uid, u.uname, dmg, cp, t).run();
    if (Math.random() < .02) await env.DB.prepare('DELETE FROM wbdmg WHERE ts < ?').bind(t - 9 * 864e5).run();
    return out();
  }
  if (p === '/api/ann' && req.method === 'POST') { const o = await annPost(env, b); return o.ok ? json(o) : fail(o.e, o.e === 'ban' ? 403 : 400) }
  if (p === '/api/wc') {
    if (req.method === 'GET') {
      const since = Math.max(0, +url.searchParams.get('since') || 0), t = now(), sid = (await srvGet(env, +url.searchParams.get('srv') || 1))?.id || 1;
      const SEL = 'SELECT w.*, p.prof, p.uname cur, q.name qn, q.txt qt FROM wchat w LEFT JOIN players p ON p.uid=w.uid LEFT JOIN wchat q ON q.id=w.re';
      const q = since ? env.DB.prepare(SEL + ' WHERE w.srv=? AND w.ts>=? AND w.ts<=? ORDER BY w.ts, w.id LIMIT 80').bind(sid, since, t)
        : env.DB.prepare('SELECT * FROM (' + SEL + ' WHERE w.srv=? AND w.ts<=? ORDER BY w.ts DESC LIMIT 60) ORDER BY ts, id').bind(sid, t);
      const { results } = await q.all();
      // pengumuman server: yang baru (ts >= as), kunci yang sudah terjadwal (fk=1, untuk pelapor kejadian bot), status #1 & rekor (st=1)
      const as = +url.searchParams.get('as') || 0, meU = String(url.searchParams.get('me') || ''), ex = {};
      const AQ = as ? env.DB.prepare('SELECT * FROM ann WHERE srv=? AND ts>=? AND ts<=? ORDER BY ts, id LIMIT 40').bind(sid, as, t)
        : env.DB.prepare('SELECT * FROM (SELECT * FROM ann WHERE srv=? AND ts<=? AND ts>? ORDER BY ts DESC LIMIT 30) ORDER BY ts, id').bind(sid, t, t - 3 * 36e5);
      ex.ann = (await AQ.all()).results.map(annNice).filter(a => !a.d.gm || a.uid === meU);
      if (url.searchParams.get('fk')) ex.fk = (await env.DB.prepare('SELECT k FROM ann WHERE srv=? AND ts>?').bind(sid, t).all()).results.map(r => r.k);
      if (url.searchParams.get('st')) ex.st = { top: await annTop(env, sid), t10: (await env.DB.prepare("SELECT uid FROM ann WHERE srv=? AND ty='t10'").bind(sid).all()).results.map(r => r.uid), rec: (await env.DB.prepare("SELECT uid,name,d,ts FROM ann WHERE srv=? AND ty='rec' AND ts<=? ORDER BY ts").bind(sid, t).all()).results.map(r => ({ r: pj(r.d, {}).r, uid: r.uid, u: r.name, ts: r.ts })) };
      return json({ ok: true, t, ai: await aiOnline(env), list: results.map(r => ({ id: r.id, uid: r.uid, u: r.cur || r.name, txt: r.txt, ts: r.ts, re: r.re || null, q: r.re && r.qn ? { u: r.qn, t: String(r.qt).slice(0, 60) } : null, vip: pj(r.prof, {}).vip || 0, top: pj(r.prof, {}).top || null })), ...ex });
    }
    const [u, f] = await me(); if (f) return f;
    const txt = clean(b.txt, 120); if (!txt) return fail('empty');
    if (txt.startsWith(':stk:') && !stkKey(txt)) return fail('stk');
    const last = await env.DB.prepare('SELECT ts FROM wchat WHERE uid=? ORDER BY id DESC LIMIT 1').bind(u.uid).first();
    if (last && now() - last.ts < 1500) return fail('fast', 429);
    const re = Number.isInteger(+b.re) && +b.re > 0 && await env.DB.prepare('SELECT id FROM wchat WHERE id=? AND ts<=?').bind(+b.re, now()).first() ? +b.re : null;
    const sid = (await srvGet(env, u.srv))?.id || u.srv;
    const r = await env.DB.prepare('INSERT INTO wchat (uid,name,txt,ts,re,srv) VALUES (?,?,?,?,?,?)').bind(u.uid, u.uname, txt, now(), re, sid).run();
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
const ADMIN_HELP = `🛠 <b>Admin Aster Chronicles</b>\n\n• /akun &lt;UID|username&gt; — lihat & ubah akun (pemain atau bot)\n• /cari &lt;teks&gt; — cari username\n• /pemain — daftar pemain asli\n• /set &lt;UID|username&gt; &lt;kolom&gt; &lt;nilai&gt; — ubah apa saja\n   pemain: kolom di data simpanan, mis. <code>gems</code>, <code>heroes.nami.lv</code>, <code>mats.crys</code>\n   bot: <code>lv</code>, <code>cp</code>, <code>vip</code>, <code>uname</code>\n   nilai <code>hapus</code> = menghapus kolom\n• /data &lt;UID|username&gt; — file JSON data simpanan\n• /gm &lt;UID|username&gt; — jadikan/cabut GM (akun testing tanpa batas); /gm saja = daftar GM\n• /server — daftar & kelola server: tambah (belum rilis) · rilis (sekarang/terjadwal) · tunda · nama · hapus · reset semua · /resetbot &lt;id&gt; — reset bot satu server\n• /penonton — akun penonton (dashboard peringkat semua server & raid, hanya lihat)\n• /hype [1-10] — tingkat hype: makin tinggi makin banyak pemain yang langsung main saat server dibuka\n• /rilis — rilis serentak: semua server dibuka bersamaan (sekarang atau terjadwal), dunia bot mulai dari hari 1\n• /whale — persen whaler (pembelanja besar) per server, mis. <code>/whale 1 10</code> atau <code>/whale semua 5</code>\n• /ai — saklar AI Claude: <code>/ai dunia on|off</code> (Obrolan Dunia) · <code>/ai dm on|off</code> (DM 1:1 + Obrolan Guild)\n• /guild [server] — guild teratas & kabar politik guild\n\nKetik UID (8 angka) atau username saja juga bisa.`;

function setPath(o, path, v) {
  const ks = path.split('.').filter(Boolean); if (!ks.length) return false;
  let x = o; for (let k = 0; k < ks.length - 1; k++) { if (x[ks[k]] == null || typeof x[ks[k]] !== 'object') x[ks[k]] = {}; x = x[ks[k]] }
  if (v === undefined) delete x[ks[ks.length - 1]]; else x[ks[ks.length - 1]] = v; return true;
}
const getPath = (o, path) => path.split('.').filter(Boolean).reduce((x, k) => x == null ? undefined : x[k], o);
const parseVal = s => { s = String(s).trim(); if (/^hapus$/i.test(s)) return undefined; if (/^-?\d+(\.\d+)?$/.test(s)) return +s; if (/^(true|false|null)$/.test(s)) return JSON.parse(s); if (/^[[{"]/.test(s)) { try { return JSON.parse(s) } catch (e) { } } return s };

async function accCard(env, r) {
  if (r.bot != null) {
    const pr = pj(r.prof, null), ov = pj(r.ov, {}), all = await serversAll(env), sv = all.find(x => pj(x.worlds, []).some(w => w.g === r.bw));
    const fr = await env.DB.prepare("SELECT COUNT(*) n FROM friends WHERE (a=? OR b=?) AND st='ok'").bind(r.uid, r.uid).first();
    return `🤖 <b>Akun Bot #${r.bot + 1}</b>\n\n🆔 UID: <code>${r.uid}</code>\n👤 Username: <b>${esc(r.uname)}</b>\n🔑 Password: acak (hanya hash yang disimpan, tidak bisa login)\n📅 Bergabung: ${when(r.created)}\n🌍 Server ${sv ? `${sv.id} · ${esc(sv.name)}` : '-'} (dunia ${r.bw})\n👥 Teman: ${fr.n}` +
      (pr ? `\n\n📊 <b>Data terakhir dari game</b> (${ago(pr.at)})\n• Level ${fmt(ov.lv ?? pr.lv)} · CP ${fmt(ov.cp ?? pr.cp)} · VIP ${ov.vip ?? pr.vip ?? 0}\n• Tahap ${esc(pr.stage || '-')} · ${pr.online ? '🟢 online' : 'offline'}\n• Tim: ${esc((pr.team || []).join(', ') || '-')}` : '\n\n📊 Belum ada potret dari game (muncul setelah ada pemain membuka Peringkat).') +
      (Object.keys(ov).length ? `\n\n✏️ <b>Ubahan admin</b>: ${esc(Object.entries(ov).map(([k, v]) => k + '=' + v).join(', '))}` : '') + (r.ban ? '\n\n🚫 <b>DISEMBUNYIKAN</b> dari game' : '');
  }
  const s = pj(r.save, {}) || {}, pr = pj(r.prof, {}) || {};
  const fr = await env.DB.prepare("SELECT COUNT(*) n FROM friends WHERE (a=? OR b=?) AND st='ok'").bind(r.uid, r.uid).first();
  const ses = await env.DB.prepare('SELECT COUNT(*) n FROM sessions WHERE uid=?').bind(r.uid).first();
  return `👤 <b>Akun Pemain</b>${r.gm ? ' · 🛡 <b>GM</b>' : ''}\n\n🆔 UID: <code>${r.uid}</code>\n👤 Username: <b>${esc(r.uname)}</b>\n🔑 Password: tersimpan sebagai hash (bisa diganti)\n🌍 Server ${r.srv}\n📅 Daftar: ${when(r.created)}\n🕒 Terakhir aktif: ${ago(r.last)}${now() - r.last < ONLINE_MS ? ' 🟢' : ''}\n📱 Sesi login: ${ses.n} · 👥 Teman: ${fr.n}\n\n` +
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
/* ---------------- Telegram: hype & rilis serentak ---------------- */
const HYPE_N = h => BOTCFG.SRV.HYPE[h].n;
// perkiraan rata-rata pemain per server (6 dunia contoh, rilis Senin 19:00 WIB) pada 1 jam, 6 jam, hari 1, 7, 30
function hypeEst(h) {
  const at = [1 / 24, .25, 1, 7, 30], acc = at.map(() => 0), K = 6, e = Date.UTC(2026, 0, 5, 12);
  for (let k = 0; k < K; k++) { const w = newWorld(900001 + k * 7919, e, h, 1); at.forEach((T, j) => acc[j] += wJoinN(T, w)) }
  return acc.map(v => Math.round(v / K));
}
async function hypeCard(env, chat, send, note) {
  const h = await hypeGet(env), E = hypeEst(h);
  const rows = [[1, 2, 3, 4, 5], [6, 7, 8, 9, 10]].map(r => r.map(v => ({ text: (v === h ? '✅ ' : '') + v, callback_data: 'hype:' + v })));
  rows.push([{ text: '🚀 Rilis serentak', callback_data: 'rls' }]);
  return send(env, chat, `${note ? note + '\n\n' : ''}🔥 <b>Tingkat Hype: ${h} · ${HYPE_N(h)}</b>\nDipakai saat dunia bot baru dibuat: /rilis (rilis serentak), /server buka, dan reset bot. Server yang sudah berjalan tidak berubah.\n\n` +
    `Perkiraan pemain per server (maks ${fmt(BOTCFG.SRV.cap)}):\n• 1 jam pertama: ±${fmt(E[0])}\n• 6 jam: ±${fmt(E[1])}\n• hari 1: ±${fmt(E[2])}\n• hari 7: ±${fmt(E[3])}\n• hari 30: ±${fmt(E[4])}\n\n` +
    `Tiap server tetap beda-beda: ada yang lebih ramai, ada hari sepi, akhir pekan lebih ramai, dan kadang lonjakan viral.\n\n1 = sepi … 10 = fenomenal (server bisa penuh di hari pertama).`, { inline_keyboard: rows });
}
/* ---------------- Telegram: persen whaler per server ---------------- */
// perkiraan persen whaler di antara pemain yang SUDAH bergabung (riwayat ditimbang jumlah pendatang tiap periode)
function whReal(w, t) {
  const H = (w.wh || []).filter(x => x[0] <= t).sort((a, b) => a[0] - b[0]), N = botsJoinedW(w, t); if (!N) return null;
  let acc = 0, prevN = 0, p = WH_DEF; for (const [a, v] of H) { const n = botsJoinedW(w, a); acc += (n - prevN) * p; prevN = n; p = +v }
  return (acc + (N - prevN) * p) / N;
}
async function whaleSet(env, s, pct) {
  const t = now(), W = pj(s.worlds, []);
  if (!W.length) return env.DB.prepare('UPDATE servers SET wp=? WHERE id=?').bind(pct, s.id).run();   // belum rilis: dipakai saat dirilis
  for (const w of W) {
    if (w.e > t) { w.wh = [[w.e, pct]]; continue }                         // belum buka: berlaku sejak buka
    const H = w.wh || []; if (Math.abs((H.length ? +H[H.length - 1][1] : WH_DEF) - pct) < 1e-9) continue;
    H.push([t, pct]); w.wh = H;
  }
  await env.DB.prepare('UPDATE servers SET worlds=? WHERE id=?').bind(JSON.stringify(W), s.id).run();
}
async function whaleCard(env, chat, send, note) {
  const all = (await serversAll(env)).filter(s => !s.merged), t = now(), def = await whaleGet(env);
  const L = all.map(s => { let n = 0, x = 0; for (const w of s.W) { const k = botsJoinedW(w, t), r = whReal(w, t); if (r != null) { n += k; x += k * r } }
    const p = srvWhale(s);
    return `<b>S${s.id} · ${esc(s.name)}</b> — 🐋 <b>${pctS(p)}</b>${Math.abs(p - WH_DEF) < 1e-9 ? ' (bawaan)' : ''}` + (n ? `
   sekarang ±${pctS(x / n)} dari ${fmt(n)} pemain ≈ ${fmt(Math.round(x / 100))} whaler` : s.opened > t ? `
   ⏰ belum buka` : '') });
  const rows = all.map(s => [{ text: `S${s.id} ${s.name} · ${pctS(srvWhale(s))}`, callback_data: 'wh:s:' + s.id }]);
  rows.push([{ text: '🌍 Semua server', callback_data: 'wh:s:0' }]);
  return send(env, chat, `${note ? note + '\n\n' : ''}🐋 <b>Persen Whaler per Server</b>\nWhaler = whale + super whale + mega whale (pembelanja besar). Bawaan ${pctS(WH_DEF)}; sisanya F2P / low spender / kartu bulanan / mid spender / dolphin dengan perbandingan tetap.\n` +
    `Berlaku untuk pemain yang <b>bergabung setelah diubah</b> — pemain lama tidak berubah (riwayat belanja & CP-nya tetap). Server yang belum buka: berlaku sejak buka.\n\n` + L.join('\n') +
    `\n\nDunia baru (/server buka): ${pctS(def)}. Saat /rilis atau reset bot, tiap server membawa persennya sendiri.\nKetik juga: <code>/whale 1 10</code> (S1 jadi 10%) atau <code>/whale semua 5</code>.`, { inline_keyboard: rows });
}
async function whalePick(env, chat, send, id) {
  const all = (await serversAll(env)).filter(s => !s.merged), s = id ? all.find(x => x.id === id) : null; if (id && !s) return send(env, chat, 'Server tidak ditemukan.');
  const cur = s ? srvWhale(s) : await whaleGet(env), V = [0, 1, 2, 3, 5, 8, 10, 15, 20, 30, 50, 75];
  const rows = [V.slice(0, 4), V.slice(4, 8), V.slice(8)].map(r => r.map(v => ({ text: (Math.abs(v - cur) < 1e-9 ? '✅ ' : '') + v + '%', callback_data: `wh:${id}:${v}` })));
  rows.push([{ text: '↩︎ Kembali', callback_data: 'whale' }]);
  return send(env, chat, `🐋 <b>${s ? `S${s.id} · ${esc(s.name)}` : 'Semua server'}</b> — sekarang ${pctS(cur)}\nPilih persen whaler${s ? '' : ' untuk SEMUA server (juga dipakai server baru)'}:`, { inline_keyboard: rows });
}
async function whaleApply(env, chat, send, id, v) {
  v = Math.round(Math.min(100, Math.max(0, v)) * 100) / 100;
  const all = (await serversAll(env)).filter(s => !s.merged), L = id ? all.filter(s => s.id === id) : all; if (!L.length) return send(env, chat, 'Server tidak ditemukan.');
  for (const s of L) await whaleSet(env, s, v);
  if (!id) await kvSet(env, 'whale', v);
  return whaleCard(env, chat, send, `✅ ${id ? `S${id}` : 'Semua server'}: whaler <b>${pctS(v)}</b>. Pemain yang bergabung mulai sekarang mengikuti persen ini; game memuat pengaturan baru dalam ±30 detik.`);
}
/* ---------------- Pesan pribadi (DM) dari teman bot ----------------
   Game memutuskan KAPAN si bot membaca pesanmu (saat ia online menurut jadwal sesinya; boleh di masa lalu bila waktu itu
   kamu tidak membuka game) dan seberapa suka ia membalas (wataknya). Server menandai pesan dibaca pada waktu itu (rd = waktu baca)
   lalu menulis balasan (Claude Haiku) dengan jeda baca + mengetik → muncul saat waktunya, sama seperti pemain sungguhan.
   kind 'hello' = sapaan pertama setelah berteman (jarang, sekali saja). Hemat token: hanya saat ada pesanmu / sapaan, maks 60 per pemain per hari. */
const DM_ROLE = `Kamu menulis pesan pribadi (DM) di game mobile gacha Aster Chronicles atas nama SATU pemain di server: orang Indonesia biasa yang main sambil kerja, kuliah, rebahan. Ia berteman di game dengan lawan bicaranya.
- Tulis seperti chat pribadi game sungguhan: pendek, santai, sesuai GAYA. Kalian bisa sudah berteman atau baru pertama kali kontak (lihat HUBUNGAN). Tidak harus antusias; boleh singkat ("wkwk iya", "lagi farming nih", "bentar lagi bos"). Kadang tanya balik, kadang tidak. Jangan berbasa-basi panjang, jangan seperti layanan pelanggan.
- Konsisten dengan data diri (PUBLIK & PRIBADI) dan yang SEDANG dikerjakan. Boleh cerita data pribadinya sendiri (pity, apes, top up, nabung) kalau wajar — ini obrolan berdua. Jangan tahu data pribadi lawan bicara kecuali ia sendiri cerita.
- Ingat isi percakapan sebelumnya; jangan mengulang kalimat yang sama.
- Fakta game harus benar sesuai pengetahuan di bawah; jangan mengarang fitur (guild SUDAH ada: absen, donasi, toko koin guild, peringkat guild, mosi kudeta; Guild War BELUM ada). Istilah game ini: ★3 / bintang 3, permata, tiket, tahap 3-4.
- Tanpa emoji berlebihan, tanpa tautan, ramah keluarga, tidak menyebut orang nyata/merek/politik, tidak minta data pribadi di dunia nyata (nomor HP, alamat, akun sosmed), tidak mengajak bertemu.
- Jangan menyebut diri AI/bot tanpa alasan. Tapi kalau lawan bicara bertanya dengan serius apakah ia sedang ngobrol dengan bot/AI atau manusia, jangan menyangkal dan jangan mengaku manusia: jawab jujur singkat (kamu pemain AI di game ini) lalu lanjut santai. Candaan "bot lu" cukup dibalas candaan tanpa mengaku manusia.
- Balas HANYA JSON.`;
const DM_Q = /\?|gimana|bagaimana|kenapa|knp|apa|siapa|berapa|brp|mana|kapan|bisa|boleh|mau/i;
async function dmBot(env, u, w, b) {
  const bot = await env.DB.prepare('SELECT uid,uname,bot,bw FROM players WHERE uid=? AND bot IS NOT NULL AND ban=0').bind(w).first(); if (!bot) return { ok: false, e: 'bot' };
  if (b.kind === 'fame') return dmFame(env, u, bot, b);
  const fr = await friendRow(env, u.uid, w); if ((!fr || fr.st !== 'ok') && !(await env.DB.prepare('SELECT 1 FROM dms WHERE frm=? AND too=? LIMIT 1').bind(w, u.uid).first())) return { ok: false, e: 'notfriend' };
  const t = now(), kind = b.kind === 'hello' ? 'hello' : 'reply';
  const at = Math.round(Math.min(t + 10 * 6e4, Math.max(t - 3 * DAY, +b.at || t)));
  const unread = (await env.DB.prepare('SELECT * FROM dms WHERE frm=? AND too=? AND rd=0 ORDER BY ts, id').bind(u.uid, w).all()).results;
  if (kind === 'reply' && !unread.length) return { ok: true, n: 0 };
  if (kind === 'hello' && await env.DB.prepare('SELECT 1 FROM dms WHERE (frm=? AND too=?) OR (frm=? AND too=?) LIMIT 1').bind(u.uid, w, w, u.uid).first()) return { ok: true, n: 0, skip: 'has' };
  // dibaca setelah pesan terakhirmu masuk
  const rt = Math.max(at, unread.length ? unread[unread.length - 1].ts + 3000 : at);
  if (unread.length) await env.DB.prepare('UPDATE dms SET rd=? WHERE frm=? AND too=? AND rd=0').bind(rt, u.uid, w).run();
  // membalas atau cukup membaca: watak bot (p dari game); pertanyaan & ajakan guild lebih sering dijawab
  const g = b.g && typeof b.g === 'object' ? b.g : {}, inv = !!g.inv;
  const p = Math.min(.97, Math.max(.03, +b.p || .6)), q = inv || unread.some(m => DM_Q.test(m.txt));
  if (kind === 'reply' && rnd01() > (q ? Math.min(.97, p + .25) : p)) return { ok: true, n: 0, read: rt };
  const day = dayKey().slice(3), lk = 'dmai:' + u.uid, cur = String(await kvGet(env, lk) || ''), used = cur.startsWith(day + ':') ? +cur.split(':')[1] : 0;
  // AI DM bisa dimatikan terpisah dari AI Obrolan Dunia (/ai). Mati / batas habis → balasan pendek biasa (tanpa Claude)
  let useAI = (await aiDmOn(env, kvGet)) && !!(env.ANTHROPIC_API_KEY || env.AI_FAKE) && used < 60;
  if (useAI && await bump(env, dayKey()) > +(env.AI_DAILY || 2000)) useAI = false;
  if (useAI) await kvSet(env, lk, day + ':' + (used + 1));
  const hist = (await env.DB.prepare('SELECT * FROM (SELECT * FROM dms WHERE ((frm=? AND too=?) OR (frm=? AND too=?)) AND ts<=? ORDER BY ts DESC, id DESC LIMIT 14) ORDER BY ts, id').bind(u.uid, w, w, u.uid, Math.max(t, rt)).all()).results;
  const c = b.cand || {}, P = b.player || {}, HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'], d = new Date(rt + 7 * 36e5), pn = clip(P.name || u.uname, 16), bn = bot.uname;
  let out = [], o = null;
  if (useAI) {
    let user = `WAKTU: ${HARI[d.getUTCDay()]} ${hhmm(rt)} WIB
KAMU = ${bn}: PUBLIK[${clip(c.pub, 320)}] PRIBADI-hanya-kamu[${clip(c.priv, 300)}] GAYA[${clip(c.style, 320)}]
LAWAN BICARA = ${pn} (data publik): ${clip(P.pub, 300)}
HUBUNGAN (rasa sukamu ke ${pn}): ${clip(b.rel, 260) || 'baru berteman di game'}
GUILD: ${g.mine ? `${pn} di guild ${clip(g.mine, 200)}` : `${pn} belum punya guild`}; kamu: ${clip(g.theirs, 260) || 'belum punya guild'}
${g.recruit ? `KAMU SEDANG MEREKRUT: ${clip(g.recruit, 260)}\n` : ''}${g.vote ? `MOSI KUDETA: ${clip(g.vote, 240)}\n` : ''}${inv ? `${pn} SEDANG MENGAJAKMU masuk guild-nya. Pertimbanganmu: ${clip(g.hint, 300)}. Putuskan sendiri secara wajar; "join": true HANYA kalau kamu benar-benar setuju pindah sekarang (kalau ragu, tolak halus / minta waktu).\n` : ''}PERCAKAPAN DM (lama -> baru):
${hist.map(h => `${hhmm(h.ts)} ${h.frm === u.uid ? pn : bn}: ${clip(h.txt, 200)}`).join('\n') || '(belum ada)'}
`;
    const ex = `"rel":0${inv ? ',"join":false' : ''}${g.vote ? ',"vote":null' : ''}`;
    user += kind === 'hello'
      ? `\nKalian baru saja berteman. Tulis 1 pesan pertama yang pendek & wajar dari ${bn} (mis. sapaan singkat, "thx udah add", atau nyinggung sesuatu di profil ${pn} yang memang terlihat). JSON: {"out":[{"text":"...","delay":4}],"rel":0}`
      : `\nBalas pesan terbaru dari ${pn} sebagai ${bn}: 1-2 pesan pendek (3 bila memang perlu menjelaskan), sesuai GAYA & yang SEDANG kamu lakukan. Pertanyaan dijawab benar. Kalau tidak ada yang perlu dibalas, out boleh kosong. "rel" = perubahan rasa sukamu ke ${pn} karena pesannya (-3..3; dipuji/dibantu/diajak baik naik, dipaksa/dihina turun, biasa 0).${g.vote ? ` "vote": "yes" kalau kamu kini mendukung kudeta, "no" kalau menolak — isi hanya kalau sikapmu memang berubah/tegas karena obrolan ini.` : ''} JSON: {"out":[{"text":"...","delay":3}],${ex}}`;
    try {
      if (env.AI_FAKE) { if (env.TG_LOG) (globalThis.__ai ||= []).push(user); o = { out: [{ text: kind === 'hello' ? 'halo, salken ya' : inv ? (g.ok ? 'oke deh aku pindah' : 'makasih, aku masih betah') : 'wkwk iya, aku lagi farming nih', delay: 3 }], rel: 1, join: inv ? !!g.ok : undefined, vote: g.vote && g.fakeVote ? g.fakeVote : null } }
      else { const r = await callClaude(env, user, 240, DM_ROLE), m = String(r.text).match(/\{[\s\S]*\}/); try { o = m ? JSON.parse(m[0]) : null } catch (e) { } }
      out = (o && o.out) || [];
    } catch (e) { useAI = false }
  }
  if (!useAI) { o = { join: inv ? !!g.ok : false, rel: 0 }; const x = dmCanned(unread, kind, inv, !!g.ok, rnd01); out = x ? [{ text: x, delay: 3 }] : [] }
  const lower = !!c.lower; let tt = rt + (kind === 'hello' ? 2000 : 1500 + rnd01() * 6000); const st = [];
  for (const x of out.slice(0, 3)) {
    let txt = clip(x.text, 300).replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '').replace(/https?\S+/g, '').replace(/~+/g, '').replace(/\s{2,}/g, ' ').trim(); if (!txt) continue;
    if (lower) txt = txt.toLowerCase();
    tt += Math.max(1500, Math.min(15e3, (+x.delay || 3) * 1000)) + txt.length * 140;   // waktu mengetik
    st.push(env.DB.prepare('INSERT INTO dms (frm,too,txt,ts) VALUES (?,?,?,?)').bind(w, u.uid, txt, Math.round(tt)));
  }
  if (o && +o.rel) st.push(relStmt(env, u.uid, w, Math.max(-3, Math.min(3, +o.rel)), t));
  if (st.length) await env.DB.batch(st);
  // dampak nyata: setuju pindah guild / ganti sikap di mosi kudeta
  let moved = null, voted = null;
  if (inv && o && o.join === true) { const mg = await env.DB.prepare('SELECT m.gid, g.srv FROM gmem m JOIN guilds g ON g.id=m.gid WHERE m.uid=? AND g.gone IS NULL').bind(u.uid).first(); if (mg) moved = await guildMove(env, mg.srv, mg.gid, w, u.uid, Math.round(tt)) }
  if (g.vote && o && (o.vote === 'yes' || o.vote === 'no')) {
    const v = await env.DB.prepare('SELECT v.* FROM gvote v JOIN gmem a ON a.gid=v.gid AND a.uid=? JOIN gmem bb ON bb.gid=v.gid AND bb.uid=? WHERE v.st=0').bind(u.uid, w).first();
    if (v && w !== v.who && w !== v.tgt) { const Y = pj(v.yes, {}), N = pj(v.no, {}); delete Y[w]; delete N[w]; (o.vote === 'yes' ? Y : N)[w] = Math.min(v.t1 - 1, Math.round(tt)); await env.DB.prepare('UPDATE gvote SET yes=?, no=? WHERE id=?').bind(JSON.stringify(Y), JSON.stringify(N), v.id).run(); voted = o.vote }
  }
  return { ok: true, n: st.length, read: rt, at: Math.round(tt), ai: useAI ? 1 : 0, ...(moved ? { moved } : {}), ...(voted ? { voted } : {}) };
}
/* ---------------- Pesan karena "terkenal" ----------------
   Game tahu peringkat CP pemain: masuk top 20/10/3/1 → pengurus guild lain mengajak bergabung (rekrut), pemain biasa
   menyapa / minta tips (fans), yang peringkatnya dekat menantang (rival), teman / rekan guild memberi selamat (ucapan).
   Game memilih si bot & waktunya (saat ia online); di sini pesan pembukanya ditulis (Claude bila AI DM nyala, selain itu kalimat biasa).
   Batas: 8 per pemain per hari, 1 per bot per 3 hari. Tidak perlu berteman: pemain boleh membalas bot yang lebih dulu menghubungi. */
const FAME_X = { rekrut: 'merekrut ke guild-mu', fans: 'menyapa karena kagum / penasaran (minta tips, nanya tim)', rival: 'menantang santai karena kalian bersaing di papan CP', ucapan: 'memberi selamat' };
const FAMEC = { rekrut: ['halo, CP kamu gede banget. mau gabung {g} ga? udah aku kirim undangan', 'permisi, aku dari {g}. lagi cari member kuat nih, tertarik?', 'eh kamu yang peringkat #{r} kan? join {g} yuk, guild kita aktif', 'salam kenal, {g} lagi rekrut. kalau minat cek undangan ya'],
  fans: ['wih suhu, CP nya gila', 'halo kak, boleh tanya tim nya pakai siapa aja?', 'salam kenal sepuh, peringkat #{r} keren banget', 'kak gimana caranya bisa CP segitu', 'izin kenalan suhu'],
  rival: ['selamat masuk #{r}, tapi jangan seneng dulu', 'wkwk kamu nyalip aku, liat aja minggu ini', 'CP kita beda tipis nih, gas adu', 'eh rival baru nih'],
  ucapan: ['selamat masuk {k}!', 'gila kamu sekarang #{r}', 'mantap, sekarang {k} nih', 'wih makin jauh aja CP nya'] };
async function dmFame(env, u, bot, b) {
  const t = now(), w = bot.uid, x = FAME_X[b.x] ? b.x : 'fans', day = dayKey().slice(3), fk = 'fame:' + u.uid, cur = String(await kvGet(env, fk) || ''), used = cur.startsWith(day + ':') ? +cur.split(':')[1] : 0;
  if (used >= 8) return { ok: true, n: 0, e: 'limit' };
  const bk = 'famb:' + u.uid + ':' + w; if (+(await kvGet(env, bk) || 0) > t - 3 * DAY) return { ok: true, n: 0, e: 'cool' };
  await kvSet(env, fk, day + ':' + (used + 1)); await kvSet(env, bk, t);
  const at = Math.round(Math.min(t + 6e4, Math.max(t - DAY, +b.at || t))), V = b.v || {}, fill = s => s.replace(/\{(\w)\}/g, (m, k) => clip(V[k] ?? '', 24));
  let out = [], useAI = (await aiDmOn(env, kvGet)) && !!(env.ANTHROPIC_API_KEY || env.AI_FAKE);
  if (useAI && await bump(env, dayKey()) > +(env.AI_DAILY || 2000)) useAI = false;
  if (useAI) {
    const hist = (await env.DB.prepare('SELECT * FROM (SELECT * FROM dms WHERE ((frm=? AND too=?) OR (frm=? AND too=?)) ORDER BY ts DESC, id DESC LIMIT 8) ORDER BY ts, id').bind(u.uid, w, w, u.uid).all()).results;
    const c = b.cand || {}, P = b.player || {}, g = b.g || {}, HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'], d = new Date(at + 7 * 36e5), pn = clip(P.name || u.uname, 16), bn = bot.uname;
    const user = `WAKTU: ${HARI[d.getUTCDay()]} ${hhmm(at)} WIB
KAMU = ${bn}: PUBLIK[${clip(c.pub, 320)}] PRIBADI-hanya-kamu[${clip(c.priv, 300)}] GAYA[${clip(c.style, 320)}]
ORANG YANG KAMU HUBUNGI = ${pn} (data publik, terlihat di peringkat): ${clip(P.pub, 300)}
HUBUNGAN: ${clip(b.rel, 220) || 'belum kenal, belum berteman'}
GUILD: kamu ${clip(g.theirs, 220) || 'belum punya guild'}; ${pn} ${g.mine ? 'di guild ' + clip(g.mine, 200) : 'belum punya guild'}
ALASAN MENGHUBUNGI: ${FAME_X[x]}. ${clip(b.why, 420)}
${hist.length ? `PERCAKAPAN DM SEBELUMNYA (lama -> baru):
${hist.map(h => `${hhmm(h.ts)} ${h.frm === u.uid ? pn : bn}: ${clip(h.txt, 160)}`).join('\n')}
` : ''}
Tulis 1-2 pesan DM pembuka yang pendek & natural dari ${bn} ke ${pn} sesuai ALASAN, GAYA, dan seberapa kenal kalian (orang asing → sopan santai, singkat; boleh panggil "suhu"/"sepuh"/"kak" kalau cocok dengan gayanya). Jangan lebay, jangan seperti iklan. JSON: {"out":[{"text":"...","delay":3}]}`;
    try {
      if (env.AI_FAKE) { if (env.TG_LOG) (globalThis.__ai ||= []).push(user); out = [{ text: fill(FAMEC[x][0]), delay: 3 }] }
      else { const r = await callClaude(env, user, 200, DM_ROLE), m = String(r.text).match(/\{[\s\S]*\}/); let o = null; try { o = m ? JSON.parse(m[0]) : null } catch (e) { } out = (o && o.out) || [] }
    } catch (e) { useAI = false }
  }
  if (!useAI || !out.length) { const L = FAMEC[x]; out = [{ text: fill(L[Math.floor(rnd01() * L.length)]), delay: 3 }] }
  const lower = !!(b.cand && b.cand.lower); let tt = at; const st = [];
  for (const y of out.slice(0, 2)) {
    let txt = clip(y.text, 300).replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '').replace(/https?\S+/g, '').replace(/~+/g, '').replace(/\s{2,}/g, ' ').trim(); if (!txt) continue;
    if (lower) txt = txt.toLowerCase(); tt += Math.max(1500, Math.min(12e3, (+y.delay || 3) * 1000)) + txt.length * 130;
    st.push(env.DB.prepare('INSERT INTO dms (frm,too,txt,ts) VALUES (?,?,?,?)').bind(w, u.uid, txt, Math.round(tt)));
  }
  // sebagian juga mengajak berteman
  if (b.fr && !(await friendRow(env, u.uid, w))) { const [a, c2] = pair(u.uid, w); st.push(env.DB.prepare('INSERT OR IGNORE INTO friends (a,b,frm,st,ts) VALUES (?,?,?,?,?)').bind(a, c2, w, 'req', Math.round(tt))) }
  if (st.length) await env.DB.batch(st);
  return { ok: true, n: out.length, at: Math.round(tt), ai: useAI ? 1 : 0 };
}
// balasan DM tanpa AI (AI DM dimatikan / batas harian habis): pendek & wajar
const DMC = { greet: ['halo juga', 'hai', 'yo', 'halo, lagi ngapain?', 'eh halo'], q: ['hmm kurang tau juga', 'coba cek di menunya deh', 'aku juga masih bingung wkwk', 'kayaknya iya', 'nanti aku cek ya'],
  thx: ['sama-sama', 'santai', 'yoi'], yes: ['oke deh aku coba gabung', 'boleh, gas aku pindah', 'yaudah aku join ya', 'oke, kirim aja aku masuk'], no: ['makasih tawarannya, aku masih betah di guildku', 'wah sorry, aku udah nyaman di sini', 'nanti dulu ya, belum kepikiran pindah', 'hmm ga dulu deh'],
  hi: ['halo, salken ya', 'thx udah add', 'hai, salam kenal'], def: ['wkwk iya', 'oke', 'sip', 'hmm iya juga', 'lagi farming nih', 'nanti lanjut ya', 'mantap', 'iya nih'] };
function dmCanned(unread, kind, inv, ok, r) {
  const pick = L => L[Math.floor(r() * L.length)], last = unread.length ? unread[unread.length - 1].txt : '';
  if (kind === 'hello') return pick(DMC.hi); if (inv) return pick(ok ? DMC.yes : DMC.no);
  if (/^(hai|halo|hi|hey|helo|p|pagi|siang|sore|malam)\b/i.test(last)) return pick(DMC.greet);
  if (/makasih|thx|thanks|terima ?kasih|mksh/i.test(last)) return pick(DMC.thx);
  if (DM_Q.test(last)) return pick(DMC.q); return pick(DMC.def);
}
// jam rilis berikutnya (WIB) untuk HH:MM
function nextWib(hh, mm) { const off = BOTCFG.TZ * 36e5, t = now(), d = new Date(t + off); let x = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), hh, mm) - off; if (x <= t + 6e4) x += DAY; return x }
const wibHM = ts => new Date(ts + BOTCFG.TZ * 36e5).toISOString().slice(11, 16);
const relTime = ts => { const m = Math.round((ts - now()) / 6e4); return m < 60 ? m + ' menit lagi' : m < 1440 ? Math.floor(m / 60) + ' jam ' + (m % 60) + ' menit lagi' : Math.floor(m / 1440) + ' hari lagi' };
async function rilisCard(env, chat, send) {
  const h = await hypeGet(env), A = (await serversAll(env)).filter(s => !s.merged), act = A.length, E = hypeEst(h), wd = await whaleGet(env);
  const opts = [...new Set([act, 1, 2, 4, 6, 8, 10, 12, 16])].filter(v => v >= Math.max(1, act) && v <= 16).sort((a, b) => a - b).slice(0, 4);
  return send(env, chat, `🚀 <b>Rilis Serentak</b>\nSemua server dibuka bersamaan dan dunia bot mulai dari hari 1. Pemain asli tetap (akun & servernya); semua akun bot, pertemanan/pesan dengan bot, dan Obrolan Dunia dihapus.\n\n` +
    `🔥 Hype: <b>${h} · ${HYPE_N(h)}</b> (ubah: /hype)\n🌍 Server aktif sekarang: ${act}\nPerkiraan per server: ±${fmt(E[0])} pemain di jam pertama, ±${fmt(E[2])} di hari pertama.\n` +
    `🐋 Whaler: ${A.map(s => `S${s.id} ${pctS(srvWhale(s))}`).join(' · ')}${opts.some(v => v > act) ? ` · server baru ${pctS(wd)}` : ''} (ubah: /whale)\n\nPilih jumlah server:`,
    { inline_keyboard: [opts.map(v => ({ text: `${v} server`, callback_data: 'rls:n:' + v })), [{ text: '🔥 Ubah hype', callback_data: 'hype' }, { text: '🐋 Whaler', callback_data: 'whale' }]] });
}
async function rilisWhen(env, chat, send, n) {
  const T = [19, 20, 21].map(hh => nextWib(hh, 0)), lab = ts => (new Date(ts + BOTCFG.TZ * 36e5).getUTCDate() !== new Date(now() + BOTCFG.TZ * 36e5).getUTCDate() ? 'besok ' : '') + wibHM(ts);
  return send(env, chat, `⏰ <b>Kapan ${n} server dirilis?</b>\nTerjadwal = server sudah tampil di daftar sebagai pra-registrasi ("Buka 20:00"), bot baru berdatangan tepat saat jam buka.\nAtau ketik: <code>/rilis ${n} 20:30</code>`,
    { inline_keyboard: [[{ text: '⚡ Sekarang', callback_data: `rls:t:${n}:0` }], T.map(ts => ({ text: lab(ts), callback_data: `rls:t:${n}:${ts}` })), [{ text: 'Batal', callback_data: 'rls:no' }]] });
}
async function rilisConfirm(env, chat, send, n, ts) {
  const all = await serversAll(env), act = all.filter(s => !s.merged), h = await hypeGet(env), E = hypeEst(h), add = Math.max(0, n - act.length);
  let id = Math.max(0, ...all.map(s => s.id)); const names = Array.from({ length: add }, () => { id++; return `S${id} ${SRV_NAMES[(id - 1) % SRV_NAMES.length]}` });
  return send(env, chat, `⚠️ <b>Rilis serentak ${act.length + add} server — ${ts ? `${when(ts)} (${relTime(ts)})` : 'SEKARANG'}?</b>\n\n` +
    `🔥 Hype ${h} · ${HYPE_N(h)} → perkiraan ±${fmt(E[0] * (act.length + add))} pemain di jam pertama, ±${fmt(E[2] * (act.length + add))} di hari pertama (semua server).\n\n` +
    `• Semua dunia bot di semua server dihapus & mulai dari hari 1\n` + (add ? `• Server baru: ${names.join(', ')}\n` : '') + `• Pemain asli tidak berubah\n• Obrolan Dunia dikosongkan`,
    { inline_keyboard: [[{ text: '✅ Ya, rilis', callback_data: `rls:go:${n}:${ts || 0}` }, { text: 'Batal', callback_data: 'rls:no' }]] });
}
async function rilisGo(env, chat, send, n, ts) {
  let t = +ts || now(); if (t < now()) t = now();
  const o = await releaseAll(env, n, t); if (t <= now() + 6e4) await ensureBots(env);
  return send(env, chat, t <= now() + 6e4
    ? `🎉 <b>RILIS SERENTAK!</b> ${o.n} server dibuka bersamaan (hari 1)${o.added.length ? `, termasuk server baru ${o.added.map(x => 'S' + x.id + ' ' + esc(x.name)).join(', ')}` : ''}.\n🔥 Hype ${o.h} · ${HYPE_N(o.h)} — pemain mulai berdatangan sekarang, tiap server dengan iramanya sendiri.\nGame memuat dunia baru dalam ±30 detik. Pantau pertambahannya di /server.`
    : `⏰ <b>Rilis serentak dijadwalkan</b> ${when(t)} (${relTime(t)}).\n${o.n} server sudah tampil di daftar sebagai pra-registrasi ("Buka ${wibHM(t)}")${o.added.length ? `, termasuk server baru ${o.added.map(x => 'S' + x.id + ' ' + esc(x.name)).join(', ')}` : ''}. Dunia bot sudah dikosongkan; pemain berdatangan tepat saat jam buka.\n🔥 Hype ${o.h} · ${HYPE_N(o.h)}.`);
}
const SRV_ST = { list: '📋 BELUM RILIS', soon: '⏰ terjadwal', open: '🟢 buka' };
async function srvCard(env, chat, send, note) {
  const L = await srvList(env), all = await serversAll(env);
  const wpOf = id => { const s = all.find(y => y.id === id); return s ? ' · 🐋' + pctS(srvWhale(s)) : '' };
  const rows = [];
  for (const x of L) rows.push(x.st === 'open' ? [{ text: `♻️ Reset bot S${x.id}`, callback_data: `rbot:${x.id}` }, { text: `🗑 Hapus S${x.id}`, callback_data: `sdel:${x.id}` }]
    : [{ text: `🚀 Rilis S${x.id}`, callback_data: `srl:${x.id}` }, { text: `🗑 Hapus S${x.id}`, callback_data: `sdel:${x.id}` }]);
  return send(env, chat, `${note ? note + '\n\n' : ''}🌍 <b>Server</b> · hype sekarang ${await hypeGet(env)} (/hype)

` + (L.length ? L.map(x => `<b>S${x.id} · ${esc(x.name)}</b> — ${SRV_ST[x.st] || x.st}${x.st === 'list' ? '' : ` · ${fmt(x.n)}/${fmt(x.cap)} pemain`}${x.full ? ' · PENUH' : ''}${x.merged ? ' · gabungan' : ''}${x.h ? ' · 🔥' + x.h : ''}${wpOf(x.id)}
   ` +
      (x.st === 'list' ? 'belum bisa dimasuki · rilis: /server rilis ' + x.id : x.st === 'soon' ? `⏰ buka ${when(x.opened)} (${relTime(x.opened)}) · pra-registrasi` : `+${fmt(x.d1)} sejam terakhir · +${fmt(x.d24)} 24 jam · buka ${when(x.opened)}`)).join('\n') : '<i>Belum ada server.</i> Pemain tidak bisa masuk sampai ada server yang buka.') +
    (all.some(s => s.merged) ? `

Digabung: ${all.filter(s => s.merged).map(s => `S${s.id}→S${s.merged}`).join(', ')}` : '') +
    `

• /server tambah [nama] — daftarkan server baru (BELUM RILIS)
• /server rilis &lt;id&gt; [sekarang|20:00] — rilis server terdaftar
• /server tunda &lt;id&gt; — batalkan rilis terjadwal
• /server buka [nama] — buka server baru langsung (hari 1)
• /server nama &lt;id&gt; &lt;nama&gt; — ganti nama
• /server hapus &lt;id&gt; — hapus server
• /server reset semua — hapus SEMUA server (tanpa server)
• /rilis — rilis serentak semua server
• /resetbot &lt;id&gt; — reset dunia bot satu server
• /hype · /whale · /penonton
• Gabung server: lewat Panel GM di game.`,
    rows.length ? { inline_keyboard: rows.slice(0, 40) } : undefined);
}
function srvRilisKb(id) {
  const T = [19, 20, 21].map(hh => nextWib(hh, 0)), lab = ts => (new Date(ts + BOTCFG.TZ * 36e5).getUTCDate() !== new Date(now() + BOTCFG.TZ * 36e5).getUTCDate() ? 'besok ' : '') + wibHM(ts);
  return { inline_keyboard: [[{ text: '⚡ Rilis sekarang', callback_data: `srl:${id}:0` }], T.map(ts => ({ text: lab(ts), callback_data: `srl:${id}:${ts}` })), [{ text: 'Nanti saja', callback_data: 'sdel:no' }]] };
}
async function srvRilisAsk(env, chat, send, id) {
  const x = (await srvList(env)).find(y => y.id === +id); if (!x) return send(env, chat, 'Server tidak ditemukan.');
  if (x.st === 'open') return send(env, chat, `S${x.id} · ${esc(x.name)} sudah buka. Mulai ulang dunianya: /resetbot ${x.id}`);
  return send(env, chat, `🚀 <b>Rilis S${x.id} · ${esc(x.name)}</b>${x.st === 'soon' ? ` (sekarang dijadwalkan ${when(x.opened)})` : ''}
Terjadwal = tampil sebagai pra-registrasi ("Buka 20:00"): pemain sudah bisa membuat akun, tapi baru bisa masuk tepat jam buka.
Atau ketik: <code>/server rilis ${x.id} 20:30</code>`, srvRilisKb(x.id));
}
async function srvRilisGo(env, chat, send, id, ts) {
  const o = await releaseServer(env, id, ts);
  if (!o.ok) return send(env, chat, o.e === 'open' ? `S${o.id} · ${esc(o.name)} sudah buka.` : 'Server tidak ditemukan.');
  if (o.now) await ensureBots(env);
  return send(env, chat, o.now ? `🎉 <b>S${o.id} · ${esc(o.name)} DIRILIS!</b> Hari 1 · 🔥 hype ${o.h} · ${HYPE_N(o.h)} — pemain mulai berdatangan sekarang. Pantau di /server.`
    : `⏰ <b>S${o.id} · ${esc(o.name)} dijadwalkan rilis ${when(o.ts)}</b> (${relTime(o.ts)}).
Sekarang tampil sebagai pra-registrasi; yang mencoba masuk sebelum jam buka mendapat pemberitahuan penolakan. Batal: <code>/server tunda ${o.id}</code>`);
}
/* ---------- akun penonton: dashboard papan peringkat semua server + raid bos (hanya lihat) ---------- */
async function watchCmd(env, chat, send, uname, pw, del) {
  if (!uname) {
    const L = (await env.DB.prepare('SELECT uid,uname,last FROM players WHERE watch=1 ORDER BY created').all()).results;
    return send(env, chat, `👁 <b>Akun Penonton</b>
Masuk di game seperti biasa → langsung ke dashboard: papan peringkat CP / Level / Arena semua server + papan raid Bos Dunia (sedang berlangsung & yang sudah selesai). Hanya melihat — tidak bisa bermain, tidak tampil di papan mana pun.

` +
      (L.length ? L.map(r => `• <b>${esc(r.uname)}</b> <code>${r.uid}</code> · terakhir ${when(r.last)}`).join('\n') : '<i>Belum ada.</i>') +
      `

• <code>/penonton nama</code> — buat akun (password dibuat acak)
• <code>/penonton nama password</code> — buat akun / ganti password
• <code>/penonton hapus nama</code>`);
  }
  const r = await env.DB.prepare('SELECT * FROM players WHERE uname=? COLLATE NOCASE').bind(uname).first();
  if (del) {
    if (!r || !r.watch) return send(env, chat, 'Akun penonton tidak ditemukan.');
    await env.DB.batch([env.DB.prepare('DELETE FROM sessions WHERE uid=?').bind(r.uid), env.DB.prepare('DELETE FROM players WHERE uid=? AND watch=1').bind(r.uid)]);
    return send(env, chat, `🗑 Akun penonton <b>${esc(r.uname)}</b> dihapus.`);
  }
  if (r && !r.watch) return send(env, chat, `Username <b>${esc(r.uname)}</b> sudah dipakai ${r.bot != null ? 'bot' : 'pemain'}. Pilih nama lain.`);
  if (!r && BOTCFG.heroNames.includes(uname.toLowerCase())) return send(env, chat, 'Nama itu nama hero. Pilih nama lain.');
  const pass = pw || Array.from(rnd(10), x => 'abcdefghjkmnpqrstuvwxyz23456789'[x % 31]).join(''), salt = hex(rnd(12)), ph = 'p2$' + await pwHash(pass, salt);
  if (r) await env.DB.batch([env.DB.prepare('UPDATE players SET ph=?, salt=? WHERE uid=?').bind(ph, salt, r.uid), env.DB.prepare('DELETE FROM sessions WHERE uid=?').bind(r.uid)]);
  else await env.DB.prepare('INSERT INTO players (uid,uname,ph,salt,created,last,sv,save,lv,cp,prof,srv,watch) VALUES (?,?,?,?,?,?,0,NULL,1,0,NULL,0,1)').bind(newUid(), uname, ph, salt, now(), now()).run();
  return send(env, chat, `👁 <b>Akun penonton ${r ? 'diperbarui' : 'dibuat'}</b>
Username: <code>${esc(r ? r.uname : uname)}</code>
Password: <code>${esc(pass)}</code>

Buka game → Mulai → Masuk Akun. Isinya hanya dashboard peringkat semua server & raid Bos Dunia.${pw ? '' : '\nHapus pesan ini setelah dicatat.'}`);
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
    const { results } = await env.DB.prepare('SELECT uid,uname,lv,cp,last,ban,created,srv FROM players WHERE bot IS NULL ORDER BY last DESC LIMIT 40').all();
    const tot = await env.DB.prepare('SELECT SUM(bot IS NULL) h, SUM(bot IS NOT NULL) b FROM players').first();
    await send(env, chat, `👥 <b>Pemain asli</b>: ${tot.h || 0} · 🤖 Bot: ${tot.b || 0}\n\n` + (results.length ? results.map(r => `${now() - r.last < ONLINE_MS ? '🟢' : '⚪'} <code>${r.uid}</code> <b>${esc(r.uname)}</b> · S${r.srv} · Lv ${r.lv} · CP ${fmt(r.cp)} · ${ago(r.last)}${r.ban ? ' 🚫' : ''}`).join('\n') : 'Belum ada pemain yang mendaftar.'));
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
  // /guild [id] — guild teratas & kabar politik di satu server
  if ((m = t.match(/^\/guild(?:@\w+)?(?:\s+s?(\d+))?$/i))) {
    const L = (await srvList(env)).filter(x => x.st === 'open'), sid = +m[1] || (L[0] || {}).id; if (!sid) { await send(env, chat, 'Belum ada server yang buka.'); return true }
    const G = (await env.DB.prepare('SELECT g.id,g.name,g.xp,g.lead,g.mode,(SELECT COUNT(*) FROM gmem WHERE gid=g.id) n, p.uname ln, p.bot lb FROM guilds g LEFT JOIN players p ON p.uid=g.lead WHERE g.srv=? AND g.gone IS NULL ORDER BY g.xp DESC LIMIT 12').bind(sid).all()).results;
    const tot = await env.DB.prepare('SELECT COUNT(*) g, (SELECT COUNT(*) FROM gmem m JOIN guilds x ON x.id=m.gid WHERE x.srv=? AND x.gone IS NULL) m, (SELECT COUNT(*) FROM gmem m JOIN guilds x ON x.id=m.gid JOIN players p ON p.uid=m.uid WHERE x.srv=? AND x.gone IS NULL AND p.bot IS NULL) r FROM guilds WHERE srv=? AND gone IS NULL').bind(sid, sid, sid).first();
    const E = (await env.DB.prepare("SELECT l.ts,l.ty,l.x,g.name,pa.uname an,pb.uname bn FROM glog l JOIN guilds g ON g.id=l.gid LEFT JOIN players pa ON pa.uid=l.a LEFT JOIN players pb ON pb.uid=l.b WHERE g.srv=? AND l.ty IN ('coup','coupno','vote','d','L') ORDER BY l.id DESC LIMIT 10").bind(sid).all()).results;
    const EV = { coup: (e) => `👑 ${esc(e.an)} menggulingkan ${esc(e.bn)} (${esc(e.x)})`, coupno: e => `🛡 mosi ${esc(e.an)} gagal (${esc(e.x)})`, vote: e => `🗳 ${esc(e.an)} memulai mosi kudeta`, d: e => `💨 bubar (${esc(e.x || '')})`, L: e => `🔁 ketua baru ${esc(e.an)}${e.x === 'serah' ? ' (diserahkan)' : ''}` };
    const tk = +(await kvGet(env, 'gt:' + sid) || 0);
    await send(env, chat, `🏰 <b>Guild S${sid}</b> · ${tot.g} guild · ${fmt(tot.m)} anggota (${tot.r} pemain asli)\nTick politik terakhir: ${tk ? when(tk * 20 * 6e4) : 'belum ada'} (dikirim game pemain yang online)\n\n` +
      (G.map((g, k) => `${k + 1}. <b>${esc(g.name)}</b> Lv${gLv(g.xp)} · ${g.n}/${gCap(gLv(g.xp))} · ketua ${esc(g.ln || '?')}${g.lb == null ? ' 👤' : ''}`).join('\n') || '<i>Belum ada guild.</i>') +
      (E.length ? '\n\n<b>Kabar politik</b>\n' + E.map(e => `• ${when(e.ts)} ${esc(e.name)}: ${(EV[e.ty] || (() => e.ty))(e)}`).join('\n') : '') + `\n\nServer lain: ${L.map(x => '/guild ' + x.id).join(' · ')}`);
    return true;
  }
  // /ai — dua saklar AI terpisah supaya token hemat: Obrolan Dunia (ai_on) · DM 1:1 + Obrolan Guild (ai_dm)
  if ((m = t.match(/^\/ai(?:@\w+)?(?:\s+(dunia|world|dm|guild|semua|all))?(?:\s+(on|off))?$/i)) || (m = t.match(/^\/ai(?:@\w+)?\s+(on|off)$/i)) && (m = [m[0], 'dunia', m[1]])) {
    const w = (m[1] || '').toLowerCase(), v = (m[2] || '').toLowerCase();
    if (v) { if (/dunia|world|semua|all/.test(w) || !w) await kvSet(env, 'ai_on', v); if (/dm|guild|semua|all/.test(w)) await kvSet(env, 'ai_dm', v) }
    const on = await aiOnline(env), dm = await aiDmOn(env, kvGet), today = +(await kvGet(env, dayKey()) || 0);
    const n = await env.DB.prepare("SELECT COUNT(*) n FROM wchat w JOIN players p ON p.uid=w.uid WHERE p.bot IS NOT NULL AND w.ts>?").bind(now() - DAY).first();
    const gn = await env.DB.prepare("SELECT COUNT(*) n FROM gchat c JOIN players p ON p.uid=c.uid WHERE p.bot IS NOT NULL AND c.ts>?").bind(now() - DAY).first();
    await send(env, chat, `🤖 <b>Mode AI (Claude)</b>\nModel: ${esc(env.AI_MODEL || 'claude-haiku-5-5')}${env.ANTHROPIC_API_KEY ? '' : '\n⚠️ Token ANTHROPIC_API_KEY belum dipasang'}\nPanggilan hari ini: ${today}/${env.AI_DAILY || 2000}\n\n🌍 <b>Obrolan Dunia</b>: ${on ? '🟢 NYALA' : '⚪ MATI'} · pesan bot 24 jam: ${n.n}\n${on ? 'Bot yang online mengobrol sendiri & membalas pemain di Obrolan Dunia.' : 'Obrolan Dunia: bot memakai kalimat biasa (tanpa token).'}\n\n💬 <b>DM 1:1 + Obrolan Guild</b>: ${dm ? '🟢 NYALA' : '⚪ MATI'} · balasan AI guild 24 jam: ${gn.n}\n${dm ? 'Teman bot membalas DM dengan AI (bisa dibujuk masuk guild / ikut mosi kudeta), anggota guild bot menanggapi obrolan guild.' : 'DM dibalas kalimat pendek biasa, bujukan guild memakai peluang biasa (tanpa token).'}\n\nPerintah: <code>/ai dunia on|off</code> · <code>/ai dm on|off</code> · <code>/ai semua on|off</code>`,
      { inline_keyboard: [[{ text: on ? '⚪ Matikan AI Dunia' : '🟢 Nyalakan AI Dunia', callback_data: on ? 'ai:dunia:off' : 'ai:dunia:on' }], [{ text: dm ? '⚪ Matikan AI DM + Guild' : '🟢 Nyalakan AI DM + Guild', callback_data: dm ? 'ai:dm:off' : 'ai:dm:on' }]] });
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
  if (/^\/(resetbot|server)(?:@\w+)?$/i.test(t)) { await srvCard(env, chat, send); return true }
  if ((m = t.match(/^\/server(?:@\w+)?\s+buka(?:\s+(.+))?$/i))) {
    const o = await openServer(env, m[1] || ''); await ensureBots(env);
    await send(env, chat, `🎉 <b>Server baru dibuka: S${o.id} · ${esc(o.name)}</b> · 🔥 hype ${o.h} · ${HYPE_N(o.h)}\nMulai hari 1, bot berdatangan dari 0 sampai ${fmt(BOTCFG.SRV.cap)} (±${fmt(hypeEst(o.h)[2])} di hari pertama). Server lama sekarang tumbuh lebih pelan karena pemain baru lebih memilih server baru.\n\nMau didaftarkan dulu tanpa langsung buka? Pakai <code>/server tambah nama</code>.`);
    return true;
  }
  if ((m = t.match(/^\/server(?:@\w+)?\s+(?:tambah|add)(?:\s+(.+))?$/i))) {
    const o = await addServer(env, m[1] || '');
    await send(env, chat, `📋 <b>Server terdaftar: S${o.id} · ${esc(o.name)}</b>\nTampil di daftar server sebagai <b>BELUM RILIS</b>: pemain belum bisa membuat akun di sini, dan yang mencoba masuk mendapat pemberitahuan penolakan.\n\nRilis kapan?`, srvRilisKb(o.id));
    return true;
  }
  if ((m = t.match(/^\/server(?:@\w+)?\s+(?:rilis|release)\s+s?(\d+)(?:\s+(sekarang|\d{1,2}[:.]\d{2}))?$/i))) {
    if (!m[2]) { await srvRilisAsk(env, chat, send, +m[1]); return true }
    const ts = /sekarang/i.test(m[2]) ? 0 : nextWib(+m[2].split(/[:.]/)[0] % 24, +m[2].split(/[:.]/)[1] % 60);
    await srvRilisGo(env, chat, send, +m[1], ts); return true;
  }
  if ((m = t.match(/^\/server(?:@\w+)?\s+(?:tunda|batal)\s+s?(\d+)$/i))) {
    const o = await unreleaseServer(env, +m[1]);
    await send(env, chat, o.ok ? `⏸ <b>Rilis S${o.id} · ${esc(o.name)} dibatalkan</b> — kembali terdaftar saja (BELUM RILIS). Rilis lagi: <code>/server rilis ${o.id}</code>` : o.e === 'none' ? 'Server tidak ditemukan.' : o.e === 'open' ? `S${o.id} sudah buka, tidak bisa ditunda. Mulai ulang dunianya: /resetbot ${o.id}` : `S${o.id} memang belum dijadwalkan rilis.`);
    return true;
  }
  if ((m = t.match(/^\/server(?:@\w+)?\s+nama\s+s?(\d+)\s+(.+)$/i))) {
    const nm = clean(m[2], 16), x = (await serversAll(env)).find(y => y.id === +m[1] && !y.merged); if (!x || !nm) { await send(env, chat, x ? 'Nama tidak boleh kosong.' : 'Server tidak ditemukan.'); return true }
    await env.DB.prepare('UPDATE servers SET name=? WHERE id=?').bind(nm, x.id).run();
    await send(env, chat, `✏️ S${x.id} sekarang bernama <b>${esc(nm)}</b> (dulu ${esc(x.name)}).`); return true;
  }
  if ((m = t.match(/^\/server(?:@\w+)?\s+(?:hapus|delete)\s+s?(\d+)$/i))) {
    const x = (await serversAll(env)).find(y => y.id === +m[1] && !y.merged); if (!x) { await send(env, chat, 'Server tidak ditemukan.'); return true }
    const real = await realOn(env, x.id), bots = x.W.reduce((a, w) => a + botsJoinedW(w, now()), 0);
    await send(env, chat, `🗑 <b>Hapus server S${x.id} · ${esc(x.name)}?</b>\n\n• Server hilang dari daftar\n• ${fmt(bots)} akun bot + pertemanan/pesan dengan bot, Obrolan Dunia, pengumuman & raid server ini DIHAPUS\n• ${fmt(real)} akun pemain asli TIDAK dihapus — saat masuk lagi mereka diminta memilih server lain yang sudah buka (progres tetap)\n\nTidak bisa dibatalkan.`,
      { inline_keyboard: [[{ text: '🗑 Ya, hapus S' + x.id, callback_data: 'sdel:yes:' + x.id }, { text: 'Batal', callback_data: 'sdel:no' }]] });
    return true;
  }
  if (/^\/server(?:@\w+)?\s+reset\s+(?:semua|all)$/i.test(t)) {
    const all = (await serversAll(env)).filter(s => !s.merged), real = (await env.DB.prepare('SELECT COUNT(*) n FROM players WHERE bot IS NULL AND watch=0').first()).n;
    await send(env, chat, `🧨 <b>Reset SEMUA server?</b>\n\n• ${all.length} server dihapus (${all.map(s => 'S' + s.id).join(', ') || '-'}) → tanpa server sama sekali, tidak dibuat otomatis lagi\n• Semua akun bot, Obrolan Dunia, pengumuman, raid & usaha rival dihapus\n• ${fmt(real)} akun pemain asli TIDAK dihapus — mereka tidak bisa masuk sampai ada server yang buka\n• Server baru mulai lagi dari S1 (<code>/server tambah nama</code>); pemain yang dulu di S1 otomatis ikut S1 yang baru, dst.\n\nTidak bisa dibatalkan.`,
      { inline_keyboard: [[{ text: '🧨 Ya, reset semua', callback_data: 'sall:yes' }, { text: 'Batal', callback_data: 'sdel:no' }]] });
    return true;
  }
  if ((m = t.match(/^\/penonton(?:@\w+)?(?:\s+(hapus\s+)?([A-Za-z0-9]{3,12}))?(?:\s+(\S{6,64}))?$/i))) { await watchCmd(env, chat, send, m[2], m[3], !!m[1]); return true }
  if ((m = t.match(/^\/hype(?:@\w+)?(?:\s+(\d+))?$/i))) {
    if (m[1]) { const v = +m[1]; if (!(v >= 1 && v <= 10)) { await send(env, chat, 'Tingkat hype 1 sampai 10, mis. <code>/hype 7</code>'); return true } await kvSet(env, 'hype', v); await hypeCard(env, chat, send, `✅ Hype diatur ke <b>${v} · ${HYPE_N(v)}</b>.`); return true }
    await hypeCard(env, chat, send); return true;
  }
  if ((m = t.match(/^\/whale(?:@\w+)?(?:\s+(semua|all|s?\d+))?(?:\s+(\d+(?:[.,]\d+)?)\s*%?)?$/i))) {
    if (!m[1]) { await whaleCard(env, chat, send); return true }
    const id = /^(semua|all)$/i.test(m[1]) ? 0 : +m[1].replace(/^s/i, '');
    if (m[2] == null) { await whalePick(env, chat, send, id); return true }
    const v = parseFloat(m[2].replace(',', '.')); if (!(v >= 0 && v <= 100)) { await send(env, chat, 'Persen whaler 0 sampai 100, mis. <code>/whale 1 10</code>'); return true }
    await whaleApply(env, chat, send, id, v); return true;
  }
  if ((m = t.match(/^\/rilis(?:@\w+)?(?:\s+(\d+))?(?:\s+(sekarang|\d{1,2}[:.]\d{2}))?$/i))) {
    if (!m[1]) { await rilisCard(env, chat, send); return true }
    const act = (await serversAll(env)).filter(s => !s.merged).length, n = Math.max(act, Math.min(16, +m[1]));
    if (!m[2]) { await rilisWhen(env, chat, send, n); return true }
    const ts = /sekarang/i.test(m[2]) ? 0 : nextWib(+m[2].split(/[:.]/)[0] % 24, +m[2].split(/[:.]/)[1] % 60);
    await rilisConfirm(env, chat, send, n, ts); return true;
  }
  if ((m = t.match(/^\/resetbot(?:@\w+)?\s+(\d+)$/i))) {
    const L = await srvList(env), x = L.find(y => y.id === +m[1]); if (!x) { await send(env, chat, 'Server tidak ditemukan.'); return true }
    await send(env, chat, `⚠️ <b>Reset bot S${x.id} · ${esc(x.name)}?</b>\n\nSemua akun bot server ini beserta pertemanan & pesan dengan bot DIHAPUS, dan Obrolan Dunia server ini dikosongkan. Dunia bot mulai lagi dari hari 1. Pemain asli tidak berubah.`,
      { inline_keyboard: [[{ text: '♻️ Ya, reset', callback_data: `rbot:yes:${x.id}` }, { text: 'Batal', callback_data: 'rbot:no' }]] });
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
  if ((m = d.match(/^ai:(on|off)$/))) { await adminMessage(env, chat, '/ai dunia ' + m[1], '', send); return true }
  if ((m = d.match(/^ai:(dunia|dm):(on|off)$/))) { await adminMessage(env, chat, '/ai ' + m[1] + ' ' + m[2], '', send); return true }
  if ((m = d.match(/^rbot:(\d+)$/))) { await adminMessage(env, chat, '/resetbot ' + m[1], '/resetbot ' + m[1], send); return true }
  if ((m = d.match(/^rbot:yes:(\d+)$/))) { const o = await resetServer(env, +m[1]); await send(env, chat, o ? `♻️ <b>Dunia bot S${o.id} di-reset</b> (dunia ${o.gen}).\nObrolan Dunia server ini dikosongkan. Game di server ini memuat dunia baru dalam ±30 detik.` : 'Server tidak ditemukan.'); return true }
  if (d === 'rbot:no') { await send(env, chat, 'Dibatalkan.'); return true }
  if (d === 'srv') { await srvCard(env, chat, send); return true }
  if ((m = d.match(/^srl:(\d+)$/))) { await srvRilisAsk(env, chat, send, +m[1]); return true }
  if ((m = d.match(/^srl:(\d+):(\d+)$/))) { await srvRilisGo(env, chat, send, +m[1], +m[2]); return true }
  if ((m = d.match(/^sdel:(\d+)$/))) { await adminMessage(env, chat, '/server hapus ' + m[1], '', send); return true }
  if ((m = d.match(/^sdel:yes:(\d+)$/))) { const o = await deleteServer(env, +m[1]);
    await send(env, chat, o ? `🗑 <b>S${o.id} · ${esc(o.name)} dihapus.</b>${o.real ? ` ${fmt(o.real)} pemain asli akan memilih server lain saat masuk.` : ''}${o.left ? '' : '\n\nSekarang tidak ada server sama sekali. Tambah: <code>/server tambah nama</code>'}` : 'Server tidak ditemukan.'); return true }
  if (d === 'sdel:no') { await send(env, chat, 'Dibatalkan.'); return true }
  if (d === 'sall:yes') { const o = await resetAllServers(env);
    await send(env, chat, `🧨 <b>Semua server di-reset.</b> ${o.n} server dihapus — sekarang tanpa server.
${fmt(o.real)} akun pemain asli tetap ada, menunggu server dibuka.

Lanjut: <code>/server tambah nama</code> (daftar dulu) lalu rilis, atau <code>/rilis</code> untuk rilis serentak beberapa server baru.`); return true }
  if (d === 'hype') { await hypeCard(env, chat, send); return true }
  if ((m = d.match(/^hype:(\d+)$/))) { const v = Math.min(10, Math.max(1, +m[1])); await kvSet(env, 'hype', v); await hypeCard(env, chat, send, `✅ Hype diatur ke <b>${v} · ${HYPE_N(v)}</b>.`); return true }
  if (d === 'whale') { await whaleCard(env, chat, send); return true }
  if ((m = d.match(/^wh:s:(\d+)$/))) { await whalePick(env, chat, send, +m[1]); return true }
  if ((m = d.match(/^wh:(\d+):(\d+(?:\.\d+)?)$/))) { await whaleApply(env, chat, send, +m[1], +m[2]); return true }
  if (d === 'rls') { await rilisCard(env, chat, send); return true }
  if ((m = d.match(/^rls:n:(\d+)$/))) { await rilisWhen(env, chat, send, +m[1]); return true }
  if ((m = d.match(/^rls:t:(\d+):(\d+)$/))) { await rilisConfirm(env, chat, send, +m[1], +m[2]); return true }
  if ((m = d.match(/^rls:go:(\d+):(\d+)$/))) { await rilisGo(env, chat, send, +m[1], +m[2]); return true }
  if (d === 'rls:no') { await send(env, chat, 'Rilis dibatalkan.'); return true }
  return false;
}
