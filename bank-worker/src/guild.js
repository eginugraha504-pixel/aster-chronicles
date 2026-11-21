/* =====================================================================
   GUILD — buku besar di server (D1). Politik guild BOT dihitung game (yang tahu CP, level & jadwal online
   tiap bot) lalu dikirim sebagai "tick" ops lewat POST /api/g/tick: pemain online pertama yang mengirim tick k
   itulah yang dipakai (tick berikutnya ditolak 'old'). Pemain asli bertindak lewat API biasa di bawah.
   Mosi kudeta: suara bot (sikap + waktu suara masuk) dihitung game saat mosi dimulai, bisa berubah karena
   dibujuk (tombol Bujuk / AI DM / AI obrolan guild); server menghitung hasil saat waktunya habis (voteSweep).
   Relasi tersembunyi pemain↔bot disimpan di tabel rel (bot↔bot dihitung game, tidak disimpan).
   Rincian: docs/SISTEM.md §Guild.
   ===================================================================== */
import { callClaude, bump, dayKey } from './ai.js';

// SAMA dengan src/js/data/guild.js (G_CFG.xp / cap)
export const G_XP = [0, 0, 600, 2300, 5400, 10200, 16900, 25700, 36900, 50400, 66600];
export const gLv = xp => { let l = 1; while (l < 10 && xp >= G_XP[l + 1]) l++; return l };
export const gCap = lv => 30 + 2 * (lv - 1);
const E0 = Date.UTC(2026, 10, 1), TICK = 20 * 6e4, VICE = 2, ELITE = 5, MINLV = 12, VOTE_MS = 3 * 36e5;
const DON = [0, 20, 60, 150];   // xp donasi per tingkat (biaya dipotong di game: emas / permata)
const wday = t => Math.floor((t + 7 * 36e5) / 864e5);
const chunk = (A, n) => { const o = []; for (let k = 0; k < A.length; k += n) o.push(A.slice(k, k + n)); return o };
// nama guild: huruf (semua bahasa) + spasi / apostrof, 3–18 karakter, tanpa angka & simbol aneh
export const gName = s => { const n = String(s || '').normalize('NFC').replace(/\s+/g, ' ').trim(); return n.length >= 3 && n.length <= 18 && /^\p{L}[\p{L}' ]*\p{L}$/u.test(n) && !/['  ]{2}/.test(n) ? n : null };
const gvBump = (env, srv) => env.DB.prepare("INSERT INTO kv (k,v) VALUES (?, '1') ON CONFLICT(k) DO UPDATE SET v = CAST(v AS INTEGER) + 1").bind('gv:' + srv);
const logSt = (env, gid, ts, ty, a, b, x) => env.DB.prepare('INSERT INTO glog (gid,ts,ty,a,b,x) VALUES (?,?,?,?,?,?)').bind(gid, Math.round(ts), ty, a ?? null, b ?? null, x == null ? null : String(x).slice(0, 400));
async function runAll(env, st) { for (const c of chunk(st, 80)) if (c.length) await env.DB.batch(c) }
// relasi pemain asli a ↔ bot b: perubahan per pasangan dibatasi 20 poin / hari WIB
export const relStmt = (env, a, b, d, t = Date.now()) => env.DB.prepare(`INSERT INTO rel (a,b,v,n,ts,d,dd) VALUES (?1,?2,max(-100,min(100,?3)),1,?4,?5,abs(?3))
  ON CONFLICT(a,b) DO UPDATE SET v = CASE WHEN (CASE WHEN rel.d=?5 THEN rel.dd ELSE 0 END) + abs(?3) > 20 THEN rel.v ELSE max(-100, min(100, rel.v + ?3)) END,
  dd = CASE WHEN rel.d=?5 THEN rel.dd + abs(?3) ELSE abs(?3) END, d = ?5, n = rel.n + 1, ts = ?4`).bind(String(a), String(b), Math.round(Math.max(-10, Math.min(10, +d || 0))), t, wday(t));
export const aiDmOn = async (env, kvGet) => (await kvGet(env, 'ai_dm')) !== 'off';   // DM 1:1 + obrolan guild (bawaan: nyala)

// pengganti ketua: wakil > elit > anggota, yang paling lama bergabung (kecuali uid ex)
const succOf = (M, ex) => M.filter(r => r.uid !== ex).sort((a, b) => b.role - a.role || a.joined - b.joined)[0] || null;

/* ---------- mosi kudeta: selesaikan yang waktunya sudah habis ---------- */
export async function voteSweep(env, srv, gid) {
  const t = Date.now(), L = (await (gid ? env.DB.prepare('SELECT * FROM gvote WHERE gid=? AND st=0 AND t1<=?').bind(gid, t) : env.DB.prepare('SELECT v.* FROM gvote v JOIN guilds g ON g.id=v.gid WHERE g.srv=? AND v.st=0 AND v.t1<=?').bind(srv, t)).all()).results;
  for (const v of L) await voteEnd(env, v, srv);
  return L.length;
}
async function voteEnd(env, v, srv) {
  const pj = (s, d) => { try { return s ? JSON.parse(s) : d } catch (e) { return d } };
  const g = await env.DB.prepare('SELECT * FROM guilds WHERE id=?').bind(v.gid).first(), M = (await env.DB.prepare('SELECT uid,role,joined FROM gmem WHERE gid=?').bind(v.gid).all()).results, inG = new Set(M.map(r => r.uid));
  const Y = pj(v.yes, {}), N = pj(v.no, {}), res = pj(v.res, {}), c = O => Object.entries(O).filter(([u, ts]) => ts <= v.t1 && inG.has(u)).length;
  const y = c(Y), n = c(N), st = [];
  if (!g || g.gone || g.lead !== v.tgt || !inG.has(v.who)) { st.push(env.DB.prepare("UPDATE gvote SET st=2, res=? WHERE id=?").bind(JSON.stringify({ ...res, void: 1, y, n }), v.id)); await runAll(env, st); return }
  const need = Math.max(3, Math.ceil(M.length * .25)), pass = y > n && y >= need, t1 = v.t1;
  if (pass) {
    st.push(env.DB.prepare('UPDATE gmem SET role=3 WHERE uid=?').bind(v.who), env.DB.prepare('UPDATE gmem SET role=0 WHERE uid=?').bind(v.tgt), env.DB.prepare('UPDATE guilds SET lead=? WHERE id=?').bind(v.who, v.gid), logSt(env, v.gid, t1, 'coup', v.who, v.tgt, y + ':' + n));
    const lv = (res.yes && res.yes.leave || []).filter(u => inG.has(u) && u !== v.who);   // pendukung ketua lama keluar karena kecewa
    if (lv.length) { st.push(env.DB.prepare(`DELETE FROM gmem WHERE gid=? AND uid IN (${lv.map(() => '?').join(',')})`).bind(v.gid, ...lv), logSt(env, v.gid, t1 + 6e4, 'l', lv.join(','), null, 'protes')) }
  } else {
    st.push(logSt(env, v.gid, t1, 'coupno', v.who, v.tgt, y + ':' + n));
    if (res.no && res.no.kick) st.push(env.DB.prepare('DELETE FROM gmem WHERE uid=? AND gid=?').bind(v.who, v.gid), logSt(env, v.gid, t1 + 3e4, 'k', v.who, v.tgt, 'kudeta gagal'));
    const lv = (res.no && res.no.leave || []).filter(u => inG.has(u) && u !== v.tgt);
    if (lv.length) st.push(env.DB.prepare(`DELETE FROM gmem WHERE gid=? AND uid IN (${lv.map(() => '?').join(',')})`).bind(v.gid, ...lv), logSt(env, v.gid, t1 + 9e4, 'l', lv.join(','), null, 'ikut keluar'));
  }
  // relasi pemain asli yang terlibat
  const isReal = async u => !!(await env.DB.prepare('SELECT 1 FROM players WHERE uid=? AND bot IS NULL').bind(u).first());
  if (await isReal(v.who) && !(await isReal(v.tgt))) st.push(relStmt(env, v.who, v.tgt, -10, t1));
  if (await isReal(v.tgt) && !(await isReal(v.who))) st.push(relStmt(env, v.tgt, v.who, -10, t1));
  st.push(env.DB.prepare('UPDATE gvote SET st=?, res=? WHERE id=?').bind(pass ? 1 : 2, JSON.stringify({ ...res, y, n, need }), v.id), gvBump(env, srv || g.srv));
  await runAll(env, st);
}
const voteOut = (v, pj) => v && { id: v.id, gid: v.gid, who: v.who, tgt: v.tgt, t0: v.t0, t1: v.t1, st: v.st, yes: pj(v.yes, {}), no: pj(v.no, {}), res: pj(v.res, {}) };

/* ---------- tick politik bot (dari game) ---------- */
async function applyTick(env, srv, gens, ops, t) {
  const G = new Map((await env.DB.prepare('SELECT id,lead,xp,mode,minlv,name FROM guilds WHERE srv=? AND gone IS NULL').bind(srv).all()).results.map(g => [g.id, { ...g, n: 0, r: [0, 0, 0, 0], M: [] }]));
  const mem = new Map();
  for (const r of (await env.DB.prepare('SELECT m.uid,m.gid,m.role,m.joined FROM gmem m JOIN guilds g ON g.id=m.gid WHERE g.srv=? AND g.gone IS NULL').bind(srv).all()).results) { mem.set(r.uid, r); const g = G.get(r.gid); g.n++; g.r[r.role]++; g.M.push(r) }
  // semua uid yang disebut ops: mana bot server ini, mana pemain asli (beserta waktu aktif terakhir)
  const U = new Set(); const add = x => { if (Array.isArray(x)) x.forEach(add); else if (/^\d{8}$/.test(String(x))) U.add(String(x)) };
  for (const o of ops) { if (!Array.isArray(o)) continue; if (o[0] === 'f') add(o[1]); else if (o[0] === 'j' || o[0] === 'k' || o[0] === 'a') add(o[2]); else if (o[0] === 'l') add(o[1]); else if (o[0] === 'r' || o[0] === 'L') add(o[2]); else if (o[0] === 'v') { add(o[2]); add(Object.keys(o[5] || {})) } }
  // anggota pemain asli di guild server ini (selain itu = bot)
  const realG = new Map((await env.DB.prepare('SELECT m.uid,p.last FROM gmem m JOIN players p ON p.uid=m.uid JOIN guilds g ON g.id=m.gid WHERE g.srv=? AND g.gone IS NULL AND p.bot IS NULL').bind(srv).all()).results.map(r => [r.uid, r.last]));
  const bots = new Set(), real = new Map(), gq = gens.map(() => '?').join(',');
  for (const c of chunk([...U], 90)) {
    if (gens.length) for (const r of (await env.DB.prepare(`SELECT uid FROM players WHERE bot IS NOT NULL AND bw IN (${gq}) AND uid IN (${c.map(() => '?').join(',')})`).bind(...gens, ...c).all()).results) bots.add(r.uid);
    for (const r of (await env.DB.prepare(`SELECT uid,last,srv FROM players WHERE bot IS NULL AND uid IN (${c.map(() => '?').join(',')})`).bind(...c).all()).results) real.set(r.uid, r);
  }
  const names = new Set([...G.values()].map(g => g.name.toLowerCase()));
  const st = [], newG = [], J = [], X = new Map(), logs = [], clamp = (a, lo, hi) => Math.max(lo, Math.min(hi, Math.round(+a || 0)));
  const at = x => clamp(x || t, t - 3 * 864e5, t + 6e4);
  const leaveM = (uid) => { const m = mem.get(uid); if (!m) return null; mem.delete(uid); const g = G.get(m.gid); if (g) { g.n--; g.r[m.role]--; g.M = g.M.filter(r => r.uid !== uid) } return m };
  let nF = 0, nJ = 0;
  // 1) guild baru (berdiri) — dibuat dulu supaya id-nya bisa dipakai ops berikutnya (@k)
  const fIdx = [];
  for (const o of ops) {
    if (!Array.isArray(o) || o[0] !== 'f' || nF >= 60) continue;
    const uid = String(o[1]), nm = gName(o[2]); if (!bots.has(uid) || mem.has(uid) || !nm || names.has(nm.toLowerCase())) { fIdx.push(null); continue }
    names.add(nm.toLowerCase()); nF++;
    newG.push({ uid, nm, emb: clamp(o[3], 0, 99), mode: clamp(o[4], 0, 2), minlv: clamp(o[5], 1, 200), ts: at(o[6]), note: String(o[7] || '').slice(0, 120) }); fIdx.push(newG.length - 1);
  }
  if (newG.length) {
    const R = await env.DB.batch(newG.map(g => env.DB.prepare('INSERT INTO guilds (srv,name,lead,fdr,made,xp,emb,mode,minlv,note) VALUES (?,?,?,?,?,0,?,?,?,?) RETURNING id').bind(srv, g.nm, g.uid, g.uid, g.ts, g.emb, g.mode, g.minlv, g.note || null)));
    newG.forEach((g, k) => { g.id = R[k].results[0].id; G.set(g.id, { id: g.id, lead: g.uid, xp: 0, mode: g.mode, minlv: g.minlv, name: g.nm, n: 1, r: [0, 0, 0, 1], M: [{ uid: g.uid, gid: g.id, role: 3, joined: g.ts }] }); mem.set(g.uid, { uid: g.uid, gid: g.id, role: 3, joined: g.ts }); J.push([g.uid, g.id, 3, g.ts]); logs.push([g.id, g.ts, 'found', g.uid, null, g.nm]) });
  }
  const gref = x => { if (typeof x === 'string' && x[0] === '@') { const k = fIdx[+x.slice(1)]; return k == null ? null : newG[k].id } return +x };
  for (const o of ops) {
    if (!Array.isArray(o)) continue;
    const ty = o[0];
    if (ty === 'l') {   // bot keluar (pindah / berhenti main / memisahkan diri)
      for (const uid of [].concat(o[1] || []).map(String)) {
        const m = mem.get(uid); if (!m || !bots.has(uid)) continue; const g = G.get(m.gid);
        leaveM(uid); st.push(env.DB.prepare('DELETE FROM gmem WHERE uid=?').bind(uid)); logs.push([m.gid, at(o[3]), 'l', uid, null, String(o[2] || '').slice(0, 20)]);
        if (m.role === 3 && g) { if (!g.n) { st.push(env.DB.prepare('UPDATE guilds SET gone=? WHERE id=?').bind(at(o[3]), g.id)); logs.push([g.id, at(o[3]), 'd', uid, null, 'kosong']); G.delete(g.id) } else { const s = succOf(g.M); s.role = 3; g.lead = s.uid; st.push(env.DB.prepare('UPDATE gmem SET role=3 WHERE uid=?').bind(s.uid), env.DB.prepare('UPDATE guilds SET lead=? WHERE id=?').bind(s.uid, g.id)); logs.push([g.id, at(o[3]) + 1, 'L', s.uid, uid, 'succ']) } }
      }
    } else if (ty === 'j') {   // bot masuk guild (guild pemain asli: bebas masuk → langsung; lewat lamaran → jadi lamaran; tertutup → tidak)
      const gid = gref(o[1]), g = G.get(gid); if (!g) continue; const leadReal = realG.has(g.lead);
      const L = [].concat(o[2] || []).map(String), T = [].concat(o[3] || []), cap = gCap(gLv(g.xp));
      L.forEach((uid, k) => {
        if (nJ >= 2500 || !bots.has(uid) || mem.has(uid)) return;
        if (leadReal && g.mode === 1) { st.push(env.DB.prepare('INSERT OR IGNORE INTO gapp (gid,uid,ts) VALUES (?,?,?)').bind(gid, uid, at(T[k]))); return }
        if (leadReal && g.mode === 2) return;
        if (g.n >= cap) return;
        const ts = at(T[k]); mem.set(uid, { uid, gid, role: 0, joined: ts }); g.n++; g.r[0]++; g.M.push(mem.get(uid)); J.push([uid, gid, 0, ts]); nJ++;
        logs.push([gid, ts, 'j', uid, null, null]);
      });
    } else if (ty === 'a') {   // lamaran bot ke guild (pemain asli memutuskan)
      const gid = gref(o[1]); if (!G.get(gid)) continue;
      for (const uid of [].concat(o[2] || []).map(String)) if (bots.has(uid) && !mem.has(uid)) st.push(env.DB.prepare('INSERT OR IGNORE INTO gapp (gid,uid,ts) VALUES (?,?,?)').bind(gid, uid, at(o[3])));
    } else if (ty === 'k') {   // dikeluarkan ketua bot (pemain asli hanya bila tidak aktif ≥ 4 hari)
      const gid = gref(o[1]), g = G.get(gid); if (!g || realG.has(g.lead)) continue;
      for (const uid of [].concat(o[2] || []).map(String)) {
        const m = mem.get(uid); if (!m || m.gid !== gid || m.role === 3) continue;
        if (!bots.has(uid)) { const last = realG.get(uid); if (last == null || t - last < 4 * 864e5) continue }
        leaveM(uid); st.push(env.DB.prepare('DELETE FROM gmem WHERE uid=?').bind(uid)); logs.push([gid, at(o[3]), 'k', uid, g.lead, String(o[4] || 'tidak aktif').slice(0, 30)]);
      }
    } else if (ty === 'r') {   // jabatan (hanya guild berketua bot)
      const gid = gref(o[1]), g = G.get(gid), uid = String(o[2]), role = clamp(o[3], 0, 2), m = mem.get(uid);
      if (!g || realG.has(g.lead) || !m || m.gid !== gid || m.role === 3 || m.role === role || !bots.has(uid)) continue;
      if (role === 2 && g.r[2] >= VICE || role === 1 && g.r[1] >= ELITE) continue;
      g.r[m.role]--; g.r[role]++; const up = role > m.role; m.role = role; st.push(env.DB.prepare('UPDATE gmem SET role=? WHERE uid=?').bind(role, uid)); logs.push([gid, at(o[4]), up ? 'up' : 'down', uid, g.lead, String(role)]);
    } else if (ty === 'L') {   // ganti ketua: pengganti (ketua lama berhenti main / lama tidak aktif). Ketua pemain asli: hanya bila tidak aktif ≥ 7 hari
      const gid = gref(o[1]), g = G.get(gid), uid = String(o[2]), m = mem.get(uid); if (!g || !m || m.gid !== gid || g.lead === uid || !bots.has(uid)) continue;
      const old = g.lead; if (realG.has(old) && t - realG.get(old) < 7 * 864e5) continue;
      const om = mem.get(old); if (om) { g.r[3]--; om.role = 0; g.r[0]++; st.push(env.DB.prepare('UPDATE gmem SET role=0 WHERE uid=?').bind(old)) }
      g.r[m.role]--; m.role = 3; g.r[3]++; g.lead = uid; st.push(env.DB.prepare('UPDATE gmem SET role=3 WHERE uid=?').bind(uid), env.DB.prepare('UPDATE guilds SET lead=? WHERE id=?').bind(uid, gid)); logs.push([gid, at(o[4]), 'L', uid, old, String(o[3] || 'succ').slice(0, 10)]);
    } else if (ty === 'x') {   // xp dari absen & donasi anggota bot
      const gid = gref(o[1]); if (!G.get(gid)) continue; X.set(gid, (X.get(gid) || 0) + clamp(o[2], 0, 60000));
    } else if (ty === 'd') {   // guild bot bubar (anggota aktif tinggal sedikit)
      const gid = gref(o[1]), g = G.get(gid); if (!g || realG.has(g.lead)) continue;
      if (g.M.some(r => realG.has(r.uid) && t - realG.get(r.uid) < 3 * 864e5)) continue;
      for (const r of g.M) mem.delete(r.uid); G.delete(gid);
      st.push(env.DB.prepare('DELETE FROM gmem WHERE gid=?').bind(gid), env.DB.prepare('UPDATE guilds SET gone=? WHERE id=?').bind(at(o[2]), gid)); logs.push([gid, at(o[2]), 'd', g.lead, null, String(o[3] || 'sepi').slice(0, 20)]);
    } else if (ty === 'v') {   // mosi kudeta dimulai bot: ['v', gid, who, tgt, t1, {uid:[y,ts]}, res]
      const gid = gref(o[1]), g = G.get(gid), who = String(o[2]); if (!g || !bots.has(who) || mem.get(who)?.gid !== gid || g.lead !== String(o[3])) continue;
      if (await env.DB.prepare('SELECT 1 FROM gvote WHERE gid=? AND st=0').bind(gid).first()) continue;
      const Y = { [who]: t }, N = {}; for (const [u, v] of Object.entries(o[5] || {})) { if (!bots.has(u) || mem.get(u)?.gid !== gid || u === who) continue; (v[0] ? Y : N)[u] = clamp(v[1], t, t + VOTE_MS) }
      st.push(env.DB.prepare('INSERT INTO gvote (gid,who,tgt,t0,t1,st,yes,no,res) VALUES (?,?,?,?,?,0,?,?,?)').bind(gid, who, g.lead, t, t + VOTE_MS, JSON.stringify(Y), JSON.stringify(N), JSON.stringify(o[6] || {})));
      logs.push([gid, t, 'vote', who, g.lead, String(o[7] || '').slice(0, 60)]);
    }
  }
  // tulis anggota baru & catatan (banyak baris per perintah: batas 100 parameter D1)
  for (const c of chunk(J, 25)) st.push(env.DB.prepare(`INSERT OR REPLACE INTO gmem (uid,gid,role,joined) VALUES ${c.map(() => '(?,?,?,?)').join(',')}`).bind(...c.flat()));
  if (X.size) { const A = [...X.entries()].filter(([, v]) => v > 0); for (const c of chunk(A, 30)) st.push(env.DB.prepare(`UPDATE guilds SET xp = xp + CASE id ${c.map(() => 'WHEN ? THEN ?').join(' ')} ELSE 0 END WHERE id IN (${c.map(() => '?').join(',')})`).bind(...c.flat(), ...c.map(x => x[0]))) }
  // naik level guild (dicatat)
  for (const [gid, v] of X) { const g = G.get(gid); if (!g) continue; const a = gLv(g.xp), b = gLv(g.xp + v); if (b > a) logs.push([gid, t, 'lvup', null, null, String(b)]) }
  // gabungkan catatan masuk/keluar yang sama per guild supaya ringkas
  const LG = new Map(); const rest = [];
  for (const l of logs) { if (l[2] === 'j') { const k = l[0] + ':j'; const e = LG.get(k); if (e) { e[3] += ',' + l[3]; e[1] = Math.max(e[1], l[1]) } else LG.set(k, l.slice()) } else rest.push(l) }
  const LL = rest.concat([...LG.values()]);
  for (const c of chunk(LL, 16)) st.push(env.DB.prepare(`INSERT INTO glog (gid,ts,ty,a,b,x) VALUES ${c.map(() => '(?,?,?,?,?,?)').join(',')}`).bind(...c.flatMap(l => [l[0], Math.round(l[1]), l[2], l[3] == null ? null : String(l[3]).slice(0, 2000), l[4] ?? null, l[5] == null ? null : String(l[5]).slice(0, 400)])));
  st.push(gvBump(env, srv));
  await runAll(env, st);
  return { found: newG.length, join: nJ, st: st.length };
}

/* ---------- AI obrolan guild ---------- */
const GUILD_ROLE = `Kamu menulis OBROLAN GUILD di game mobile gacha Aster Chronicles atas nama beberapa anggota guild (pemain Indonesia biasa yang main sambil kerja, kuliah, rebahan). Seorang pemain baru saja menulis di obrolan guild.
- Pilih 0-2 anggota dari KANDIDAT (yang sedang online) yang wajar menanggapi. Tidak semua harus menjawab; kalau tidak ada yang perlu dibalas, out boleh kosong.
- Gaya obrolan grup game: pendek, santai, sesuai GAYA masing-masing; konsisten dengan data diri, jabatan, dan HUBUNGAN mereka dengan si penulis (akrab → hangat & membela; tidak suka → dingin/menyindir).
- Politik guild terasa nyata: yang setia membela ketua, yang kecewa bisa menyindir. Kalau ada MOSI KUDETA berjalan, anggota boleh menyatakan sikap. Isi "vote" ("yes" dukung kudeta / "no" tolak) HANYA kalau anggota itu memang tegas berubah sikap atau menyatakan sikap karena isi obrolan; selain itu null.
- "rel": perubahan rasa suka anggota ke si penulis karena pesannya (-3..3): dipuji/dibantu/diajak baik → naik, dihina/ditekan/dipaksa → turun. Kosongkan bila netral.
- Fakta game harus benar sesuai pengetahuan; jangan mengarang fitur. Guild sudah ada (absen harian, donasi, koin & toko guild, peringkat guild Level & CP, mosi kudeta); Guild War BELUM ada.
- Tanpa emoji berlebihan, tanpa tautan, ramah keluarga, tidak menyebut orang nyata/merek/politik dunia nyata, tidak minta data pribadi, tidak mengajak bertemu.
- Jangan menyebut diri AI/bot tanpa alasan. Kalau ditanya serius apakah bot/AI, jangan menyangkal: jawab jujur singkat (pemain AI di game ini) lalu lanjut santai.
- Balas HANYA JSON: {"out":[{"who":"<uid>","text":"...","delay":3,"vote":null}],"rel":{"<uid>":1}}`;
const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'], hhmm = ms => new Date(ms + 7 * 36e5).toISOString().slice(11, 16), clip = (s, n) => String(s ?? '').replace(/[\u0000-\u001f]/g, ' ').slice(0, n);
const ROLE_N = ['Anggota', 'Elit', 'Wakil Ketua', 'Ketua'];
const cleanOut = (s, lower) => { let x = clip(s, 300).replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '').replace(/https?\S+/g, '').replace(/~+/g, '').replace(/\s{2,}/g, ' ').trim(); return lower ? x.toLowerCase() : x };

/* ---------- HTTP ---------- */
const sha256 = async s => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].map(x => x.toString(16).padStart(2, '0')).join('');
export async function guildRoute(p, b, env, C) {
  const { json, fail, me, srvGet, srvSt, kvGet, kvSet, clean, pj, url } = C, now = () => Date.now();
  if (p === '/api/g/all') {   // keadaan semua guild satu server (publik): G = [id,nama,ketua,xp,lambang,mode,minLv,berdiri,pendiri], M = {gid:"uid:role:menit36,..."}
    const SV = await srvGet(env, +url.searchParams.get('srv') || 1); if (!SV) return fail('srv', 404);
    const srv = SV.id; await voteSweep(env, srv);
    const [G, M, V, gv, tk, RR] = await Promise.all([
      env.DB.prepare('SELECT id,name,lead,xp,emb,mode,minlv,made,fdr FROM guilds WHERE srv=? AND gone IS NULL').bind(srv).all(),
      env.DB.prepare('SELECT m.uid,m.gid,m.role,m.joined FROM gmem m JOIN guilds g ON g.id=m.gid WHERE g.srv=? AND g.gone IS NULL').bind(srv).all(),
      env.DB.prepare('SELECT v.id,v.gid,v.who,v.tgt,v.t0,v.t1 FROM gvote v JOIN guilds g ON g.id=v.gid WHERE g.srv=? AND v.st=0').bind(srv).all(),
      kvGet(env, 'gv:' + srv), kvGet(env, 'gt:' + srv),
      // relasi ketua pemain asli dengan anggota bot-nya (dipakai simulasi: anggota yang tidak suka ketuanya bisa memulai mosi)
      env.DB.prepare('SELECT r.a,r.b,r.v FROM rel r JOIN guilds g ON g.lead=r.a JOIN gmem m ON m.uid=r.b AND m.gid=g.id WHERE g.srv=? AND g.gone IS NULL').bind(srv).all()]);
    const R = {}; for (const r of RR.results) (R[r.a] ||= {})[r.b] = r.v;
    const MM = {}; for (const r of M.results) (MM[r.gid] ||= []).push(r.uid + ':' + r.role + ':' + Math.max(0, Math.round((r.joined - E0) / 6e4)).toString(36));
    for (const k in MM) MM[k] = MM[k].join(',');
    return json({ ok: true, t: now(), srv, gv: +gv || 0, tk: +tk || 0, G: G.results.map(g => [g.id, g.name, g.lead, g.xp, g.emb, g.mode, g.minlv, g.made, g.fdr]), M: MM, R, V: V.results.map(v => [v.id, v.gid, v.who, v.tgt, v.t0, v.t1]) });
  }
  if (p === '/api/g/info') {   // rincian satu guild: anggota (+kartu pemain asli), catatan, mosi terakhir, lamaran (untuk pengurus)
    const g = await env.DB.prepare('SELECT * FROM guilds WHERE id=?').bind(+b.gid || 0).first(); if (!g) return fail('none', 404);
    await voteSweep(env, g.srv, g.id);
    const g2 = await env.DB.prepare('SELECT * FROM guilds WHERE id=?').bind(g.id).first();
    const [M, L, V] = await Promise.all([
      env.DB.prepare('SELECT m.uid,m.role,m.joined,m.contrib,m.ci,p.uname,p.bot,p.bw,p.lv,p.cp,p.prof,p.last,p.ov,p.srv FROM gmem m JOIN players p ON p.uid=m.uid WHERE m.gid=?').bind(g.id).all(),
      env.DB.prepare('SELECT id,ts,ty,a,b,x FROM glog WHERE gid=? ORDER BY id DESC LIMIT 60').bind(g.id).all(),
      env.DB.prepare('SELECT * FROM gvote WHERE gid=? ORDER BY id DESC LIMIT 1').bind(g.id).first()]);
    const u = b.tok ? await C.auth(env, b) : null, mine = u && M.results.find(r => r.uid === u.uid);
    let apps = [];
    if (mine && mine.role >= 2) apps = (await env.DB.prepare('SELECT a.uid,a.ts,p.uname,p.bot,p.bw,p.lv,p.cp,p.prof,p.last,p.ov,p.srv FROM gapp a JOIN players p ON p.uid=a.uid WHERE a.gid=? ORDER BY a.ts DESC LIMIT 50').bind(g.id).all()).results.map(r => ({ ...C.card(r), ts: r.ts }));
    const t = now(), day = wday(t), dk = u ? String(await kvGet(env, 'gdon:' + u.uid) || '') : '';
    return json({ ok: true, t, g: { id: g2.id, srv: g2.srv, name: g2.name, lead: g2.lead, fdr: g2.fdr, made: g2.made, xp: g2.xp, lv: gLv(g2.xp), cap: gCap(gLv(g2.xp)), emb: g2.emb, mode: g2.mode, minlv: g2.minlv, note: g2.note || '', gone: g2.gone },
      mem: M.results.map(r => r.bot != null ? { uid: r.uid, role: r.role, joined: r.joined, contrib: r.contrib, bot: r.bot, bw: r.bw } : { ...C.card(r), role: r.role, joined: r.joined, contrib: r.contrib, ci: r.ci === day }),
      log: L.results, vote: voteOut(V, pj), apps, me: mine ? { role: mine.role, ci: mine.ci === day, don: dk.startsWith(day + ':') ? +dk.split(':')[1] : 0, contrib: mine.contrib } : null });
  }
  if (p === '/api/g/chat') {   // obrolan guild (publik bagi anggota): pesan yang sudah terkirim (ts <= sekarang) setelah since
    const [u, f] = await me(); if (f) return f;
    const m = await env.DB.prepare('SELECT gid FROM gmem WHERE uid=?').bind(u.uid).first(); if (!m) return json({ ok: true, list: [], t: now() });
    const t = now(), since = Math.max(0, +b.since || 0);
    const { results } = await env.DB.prepare('SELECT * FROM (SELECT c.id,c.uid,c.txt,c.ts,p.uname,p.bot FROM gchat c JOIN players p ON p.uid=c.uid WHERE c.gid=? AND c.ts>? AND c.ts<=? ORDER BY c.ts DESC LIMIT 60) ORDER BY ts').bind(m.gid, since, t).all();
    const ty = await env.DB.prepare('SELECT MIN(ts) m FROM gchat WHERE gid=? AND ts>?').bind(m.gid, t).first();
    return json({ ok: true, gid: m.gid, t, list: results.map(r => ({ id: r.id, uid: r.uid, u: r.uname, bot: r.bot, txt: r.txt, ts: r.ts })), typing: !!(ty && ty.m && ty.m - t < 12e3) });
  }
  if (p === '/api/rel/mine') {   // relasi tersembunyi pemain ini dengan bot (game memakainya untuk keputusan bot)
    const [u, f] = await me(); if (f) return f;
    const { results } = await env.DB.prepare('SELECT b,v,n,ts FROM rel WHERE a=? ORDER BY ts DESC LIMIT 600').bind(u.uid).all();
    return json({ ok: true, list: results.map(r => [r.b, r.v, r.n, r.ts]) });
  }
  if (p === '/api/rel/bump') {   // perubahan relasi dari game (Arena, raid bareng, hadiah, dibujuk ...): ±5 per kejadian, maks 20 poin/hari per bot
    const [u, f] = await me(); if (f) return f; if (u.watch) return fail('watch', 403);
    const L = (Array.isArray(b.list) ? b.list : [[b.uid, b.d]]).slice(0, 20).filter(x => /^\d{8}$/.test(String(x[0])) && x[0] !== u.uid);
    if (L.length) await runAll(env, L.map(x => relStmt(env, u.uid, x[0], Math.max(-5, Math.min(5, +x[1] || 0)))));
    return json({ ok: true, n: L.length });
  }

  // ---- tick politik bot (22 Nov 2026): dari game pemain (server sendiri), dari dashboard penonton / GM (server yang dilihat: b.srv),
  //      atau dari penjadwal GitHub Actions tiap 20 menit (b.key = sha256('gtick:' + BOT_TOKEN), b.srv) → semua server tetap hidup walau tanpa pemain
  if (p === '/api/g/tick') {
    let sid = 0;
    if (b.key) { if (!env.BOT_TOKEN || String(b.key) !== await sha256('gtick:' + env.BOT_TOKEN)) return fail('key', 403); sid = +b.srv || 0 }
    else { const [u, f] = await me(); if (f) return f; sid = (u.watch || u.gm) && +b.srv ? +b.srv : u.srv }
    const SV = await srvGet(env, sid); if (!SV || srvSt(SV) !== 'open') return fail('srv');
    const srv = SV.id, t = now(), k = Math.floor(t / TICK); if (Math.abs(+b.k - k) > 1) return fail('k');
    const kk = 'gt:' + srv, last = +(await kvGet(env, kk) || 0); if (+b.k <= last) return json({ ok: false, e: 'old', tk: last });
    const r = await env.DB.prepare('INSERT INTO kv (k,v) VALUES (?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v WHERE CAST(kv.v AS INTEGER) < CAST(excluded.v AS INTEGER)').bind(kk, String(+b.k)).run();
    if (!r.meta.changes) return json({ ok: false, e: 'old' });
    const ops = Array.isArray(b.ops) ? b.ops.slice(0, 6000) : [];
    const o = ops.length ? await applyTick(env, srv, SV.W.map(w => w.g), ops, t) : {};
    await voteSweep(env, srv);
    return json({ ok: true, tk: +b.k, srv, ...o });
  }

  // ---- tindakan (butuh akun) ----
  const [u, f] = await me(); if (f) return f; if (u.watch) return fail('watch', 403);
  const SV = await srvGet(env, u.srv); if (!SV || srvSt(SV) !== 'open') return fail('srv');
  const srv = SV.id, t = now(), act = p.slice(7);
  const myM = await env.DB.prepare('SELECT m.*, g.srv gsrv, g.lead, g.xp, g.mode, g.minlv, g.name gname FROM gmem m JOIN guilds g ON g.id=m.gid WHERE m.uid=? AND g.gone IS NULL').bind(u.uid).first();
  const G = async id => await env.DB.prepare('SELECT * FROM guilds WHERE id=? AND gone IS NULL AND srv=?').bind(+id || 0, srv).first();
  const memList = gid => env.DB.prepare('SELECT uid,role,joined FROM gmem WHERE gid=?').bind(gid).all().then(r => r.results);
  const isBotHere = async uid => !!(SV.W.length && await env.DB.prepare(`SELECT 1 FROM players WHERE uid=? AND bot IS NOT NULL AND bw IN (${SV.W.map(() => '?').join(',')})`).bind(String(uid), ...SV.W.map(w => w.g)).first());
  const leftCool = async () => { const v = +(await kvGet(env, 'gleft:' + u.uid) || 0); return !u.gm && t - v < 2 * 36e5 ? v + 2 * 36e5 : 0 };

  if (act === 'create') {
    if (myM) return fail('ing'); if ((u.lv || 1) < MINLV && !u.gm) return fail('lv');
    const cd = await leftCool(); if (cd) return json({ ok: false, e: 'gcool', at: cd });
    const nm = gName(b.name); if (!nm) return fail('gname');
    if (await env.DB.prepare('SELECT 1 FROM guilds WHERE srv=? AND gone IS NULL AND name=? COLLATE NOCASE').bind(srv, nm).first()) return fail('gtaken');
    const r = await env.DB.prepare('INSERT INTO guilds (srv,name,lead,fdr,made,xp,emb,mode,minlv,note) VALUES (?,?,?,?,?,0,?,?,?,?) RETURNING id').bind(srv, nm, u.uid, u.uid, t, Math.max(0, Math.min(99, +b.emb || 0)), Math.max(0, Math.min(2, +b.mode || 0)), Math.max(1, Math.min(200, +b.minlv || MINLV)), clean(b.note, 120) || null).first();
    await env.DB.batch([env.DB.prepare('INSERT OR REPLACE INTO gmem (uid,gid,role,joined) VALUES (?,?,3,?)').bind(u.uid, r.id, t), env.DB.prepare('DELETE FROM gapp WHERE uid=?').bind(u.uid), logSt(env, r.id, t, 'found', u.uid, null, nm), gvBump(env, srv)]);
    return json({ ok: true, gid: r.id });
  }
  if (act === 'join') {   // bebas masuk → langsung; lewat lamaran → lamaran; tertutup → ditolak
    if (myM) return fail('ing'); const g = await G(b.gid); if (!g) return fail('none', 404);
    const cd = await leftCool(); if (cd) return json({ ok: false, e: 'gcool', at: cd });
    if ((u.lv || 1) < g.minlv && !u.gm) return fail('glv'); if (g.mode === 2 && !b.by) return fail('gclosed');
    const n = (await env.DB.prepare('SELECT COUNT(*) n FROM gmem WHERE gid=?').bind(g.id).first()).n; if (n >= gCap(gLv(g.xp))) return fail('gfull');
    // diundang anggota bot guild itu (undangan muncul di game) → langsung masuk walau lewat lamaran
    const invBy = b.by && /^\d{8}$/.test(String(b.by)) && await env.DB.prepare('SELECT 1 FROM gmem m JOIN players p ON p.uid=m.uid WHERE m.uid=? AND m.gid=? AND p.bot IS NOT NULL').bind(String(b.by), g.id).first();
    if (g.mode === 1 && !invBy) { await env.DB.prepare('INSERT OR REPLACE INTO gapp (gid,uid,ts) VALUES (?,?,?)').bind(g.id, u.uid, t).run(); return json({ ok: true, st: 'app' }) }
    await env.DB.batch([env.DB.prepare('INSERT INTO gmem (uid,gid,role,joined) VALUES (?,?,0,?)').bind(u.uid, g.id, t), env.DB.prepare('DELETE FROM gapp WHERE uid=?').bind(u.uid), logSt(env, g.id, t, 'j', u.uid, invBy ? String(b.by) : null, invBy ? 'diundang' : null), gvBump(env, srv), ...(invBy ? [relStmt(env, u.uid, String(b.by), 3, t)] : [])]);
    return json({ ok: true, st: 'in', gid: g.id });
  }
  if (act === 'unapp') { await env.DB.prepare('DELETE FROM gapp WHERE uid=? AND gid=?').bind(u.uid, +b.gid || 0).run(); return json({ ok: true }) }
  if (act === 'myapps') return json({ ok: true, list: (await env.DB.prepare('SELECT gid,ts FROM gapp WHERE uid=?').bind(u.uid).all()).results });
  if (!myM && act !== 'inv') return fail('noguild');
  const gid = myM ? myM.gid : 0;
  if (act === 'leave') {
    const M = await memList(gid), st = [env.DB.prepare('DELETE FROM gmem WHERE uid=?').bind(u.uid), logSt(env, gid, t, 'l', u.uid, null, 'keluar'), gvBump(env, srv)];
    if (myM.role === 3) { const s = succOf(M, u.uid); if (!s) st.push(env.DB.prepare('UPDATE guilds SET gone=? WHERE id=?').bind(t, gid), logSt(env, gid, t + 1, 'd', u.uid, null, 'kosong')); else st.push(env.DB.prepare('UPDATE gmem SET role=3 WHERE uid=?').bind(s.uid), env.DB.prepare('UPDATE guilds SET lead=? WHERE id=?').bind(s.uid, gid), logSt(env, gid, t + 1, 'L', s.uid, u.uid, 'succ')) }
    await env.DB.batch(st); await kvSet(env, 'gleft:' + u.uid, t); return json({ ok: true });
  }
  if (act === 'kick' || act === 'role' || act === 'lead') {
    const w = String(b.uid || ''), tm = await env.DB.prepare('SELECT * FROM gmem WHERE uid=? AND gid=?').bind(w, gid).first(); if (!tm || w === u.uid) return fail('none', 404);
    if (act === 'kick') { if (myM.role < 2 || tm.role >= myM.role) return fail('perm', 403);
      await env.DB.batch([env.DB.prepare('DELETE FROM gmem WHERE uid=?').bind(w), logSt(env, gid, t, 'k', w, u.uid, clean(b.why, 40) || null), gvBump(env, srv), ...(await isBotHere(w) ? [relStmt(env, u.uid, w, -10, t)] : [])]); return json({ ok: true }) }
    if (myM.role !== 3) return fail('perm', 403);
    if (act === 'role') { const role = Math.max(0, Math.min(2, +b.role || 0)); if (role === tm.role) return json({ ok: true });
      if (role > 0) { const n = (await env.DB.prepare('SELECT COUNT(*) n FROM gmem WHERE gid=? AND role=?').bind(gid, role).first()).n; if (n >= (role === 2 ? VICE : ELITE)) return fail('gslot') }
      await env.DB.batch([env.DB.prepare('UPDATE gmem SET role=? WHERE uid=?').bind(role, w), logSt(env, gid, t, role > tm.role ? 'up' : 'down', w, u.uid, String(role)), gvBump(env, srv), ...(await isBotHere(w) ? [relStmt(env, u.uid, w, role > tm.role ? 4 : -4, t)] : [])]); return json({ ok: true }) }
    const vn = (await env.DB.prepare('SELECT COUNT(*) n FROM gmem WHERE gid=? AND role=2').bind(gid).first()).n - (tm.role === 2 ? 1 : 0);
    await env.DB.batch([env.DB.prepare('UPDATE gmem SET role=3 WHERE uid=?').bind(w), env.DB.prepare('UPDATE gmem SET role=? WHERE uid=?').bind(vn < VICE ? 2 : 0, u.uid), env.DB.prepare('UPDATE guilds SET lead=? WHERE id=?').bind(w, gid), logSt(env, gid, t, 'L', w, u.uid, 'serah'), gvBump(env, srv)]);
    return json({ ok: true });
  }
  if (act === 'edit') {
    if (myM.role < 2) return fail('perm', 403); const g = await G(gid), lead = myM.role === 3;
    const note = b.note != null ? clean(b.note, 120) : g.note, mode = lead && b.mode != null ? Math.max(0, Math.min(2, +b.mode)) : g.mode, minlv = lead && b.minlv != null ? Math.max(1, Math.min(200, +b.minlv)) : g.minlv, emb = lead && b.emb != null ? Math.max(0, Math.min(99, +b.emb)) : g.emb;
    await env.DB.batch([env.DB.prepare('UPDATE guilds SET note=?, mode=?, minlv=?, emb=? WHERE id=?').bind(note || null, mode, minlv, emb, gid), ...(note !== g.note ? [logSt(env, gid, t, 'note', u.uid, null, note)] : []), gvBump(env, srv)]);
    return json({ ok: true });
  }
  if (act === 'app') {   // terima / tolak lamaran
    if (myM.role < 2) return fail('perm', 403); const w = String(b.uid || '');
    const a = await env.DB.prepare('SELECT * FROM gapp WHERE gid=? AND uid=?').bind(gid, w).first(); if (!a) return fail('none', 404);
    if (!b.ok) { await env.DB.batch([env.DB.prepare('DELETE FROM gapp WHERE gid=? AND uid=?').bind(gid, w), ...(await isBotHere(w) ? [relStmt(env, u.uid, w, -3, t)] : [])]); return json({ ok: true, st: 'rej' }) }
    if (await env.DB.prepare('SELECT 1 FROM gmem WHERE uid=?').bind(w).first()) { await env.DB.prepare('DELETE FROM gapp WHERE uid=?').bind(w).run(); return fail('ing') }
    const g = await G(gid), n = (await env.DB.prepare('SELECT COUNT(*) n FROM gmem WHERE gid=?').bind(gid).first()).n; if (n >= gCap(gLv(g.xp))) return fail('gfull');
    await env.DB.batch([env.DB.prepare('INSERT INTO gmem (uid,gid,role,joined) VALUES (?,?,0,?)').bind(w, gid, t), env.DB.prepare('DELETE FROM gapp WHERE uid=?').bind(w), logSt(env, gid, t, 'j', w, u.uid), gvBump(env, srv), ...(await isBotHere(w) ? [relStmt(env, u.uid, w, 5, t)] : [])]);
    return json({ ok: true, st: 'in' });
  }
  if (act === 'disband') {
    if (myM.role !== 3) return fail('perm', 403);
    await env.DB.batch([env.DB.prepare('DELETE FROM gmem WHERE gid=?').bind(gid), env.DB.prepare('UPDATE guilds SET gone=? WHERE id=?').bind(t, gid), env.DB.prepare('DELETE FROM gapp WHERE gid=?').bind(gid), logSt(env, gid, t, 'd', u.uid, null, 'dibubarkan'), gvBump(env, srv)]);
    await kvSet(env, 'gleft:' + u.uid, t); return json({ ok: true });
  }
  if (act === 'ci' || act === 'don') {   // absen harian (+10 xp) · donasi tingkat 1–3 (masing-masing sekali sehari)
    const day = wday(t);
    if (act === 'ci') { if (myM.ci === day) return fail('done');
      await env.DB.batch([env.DB.prepare('UPDATE gmem SET ci=?, contrib=contrib+10 WHERE uid=?').bind(day, u.uid), env.DB.prepare('UPDATE guilds SET xp=xp+10 WHERE id=?').bind(gid), gvBump(env, srv)]);
    } else { const tier = Math.max(1, Math.min(3, +b.tier || 1)), k = 'gdon:' + u.uid, cur = String(await kvGet(env, k) || ''), mask = cur.startsWith(day + ':') ? +cur.split(':')[1] : 0;
      if (mask & (1 << tier)) return fail('done');
      await env.DB.batch([env.DB.prepare('UPDATE gmem SET contrib=contrib+? WHERE uid=?').bind(DON[tier], u.uid), env.DB.prepare('UPDATE guilds SET xp=xp+? WHERE id=?').bind(DON[tier], gid), gvBump(env, srv)]);
      await kvSet(env, k, day + ':' + (mask | (1 << tier))); }
    const g = await G(gid), a = gLv(g.xp - (act === 'ci' ? 10 : DON[Math.max(1, Math.min(3, +b.tier || 1))])), bb = gLv(g.xp);
    if (bb > a) await env.DB.batch([logSt(env, gid, t, 'lvup', u.uid, null, String(bb))]);
    return json({ ok: true, xp: g.xp, lv: bb, up: bb > a });
  }
  if (act === 'say') {
    const txt = clean(b.txt, 200); if (!txt) return fail('empty');
    const last = await env.DB.prepare('SELECT ts FROM gchat WHERE uid=? ORDER BY id DESC LIMIT 1').bind(u.uid).first(); if (last && t - last.ts < 1200) return fail('fast', 429);
    const r = await env.DB.prepare('INSERT INTO gchat (gid,uid,txt,ts) VALUES (?,?,?,?)').bind(gid, u.uid, txt, t).run();
    return json({ ok: true, id: r.meta.last_row_id, ts: t });
  }
  if (act === 'ai') {   // anggota bot (online) menanggapi pesan pemain di obrolan guild — Claude, hemat
    if (!(await aiDmOn(env, kvGet))) return json({ ok: true, n: 0, e: 'off' });
    if (!env.ANTHROPIC_API_KEY && !env.AI_FAKE) return json({ ok: true, n: 0, e: 'nokey' });
    const rk = 'gai:' + gid; if (+(await kvGet(env, rk) || 0) > t - 15e3) return json({ ok: true, n: 0, e: 'fast' });
    const dk = dayKey().slice(3), lk = 'gaiu:' + u.uid, cur = String(await kvGet(env, lk) || ''), used = cur.startsWith(dk + ':') ? +cur.split(':')[1] : 0; if (used >= 80) return json({ ok: true, n: 0, e: 'limit' });
    if (await bump(env, dayKey()) > +(env.AI_DAILY || 2000)) return json({ ok: true, n: 0, e: 'quota' });
    await kvSet(env, rk, t); await kvSet(env, lk, dk + ':' + (used + 1));
    const M = await memList(gid), inG = new Set(M.map(r => r.uid)), cand = (Array.isArray(b.cand) ? b.cand : []).filter(c => inG.has(String(c.uid)) && c.uid !== u.uid).slice(0, 4);
    if (!cand.length) return json({ ok: true, n: 0, e: 'nocand' });
    const hist = (await env.DB.prepare('SELECT * FROM (SELECT c.uid,c.txt,c.ts,p.uname FROM gchat c JOIN players p ON p.uid=c.uid WHERE c.gid=? AND c.ts<=? ORDER BY c.ts DESC LIMIT 16) ORDER BY ts').bind(gid, t).all()).results;
    const vote = await env.DB.prepare('SELECT * FROM gvote WHERE gid=? AND st=0').bind(gid).first(), I = b.info || {}, d = new Date(t + 7 * 36e5), pn = clip(b.me || u.uname, 16);
    const nm = uid => (cand.find(c => String(c.uid) === uid) || {}).name || (hist.find(h => h.uid === uid) || {}).uname || (uid === u.uid ? pn : 'anggota');
    let user = `WAKTU: ${HARI[d.getUTCDay()]} ${hhmm(t)} WIB
GUILD: ${clip(I.name || myM.gname, 20)} Lv ${gLv(myM.xp)}, peringkat ${clip(I.rank, 10)} di server, ${M.length}/${gCap(gLv(myM.xp))} anggota, ketua ${clip(I.lead, 20)}${I.note ? `, pengumuman "${clip(I.note, 120)}"` : ''}
PENULIS = ${pn} (${ROLE_N[myM.role]}), data publik: ${clip(b.mePub, 260)}
${vote ? `MOSI KUDETA BERJALAN: ${clip(I.voteTxt, 200) || ('menggulingkan ketua, berakhir ' + hhmm(vote.t1))}\n` : ''}KANDIDAT (anggota yang sedang online):
${cand.map(c => `- ${c.uid} ${clip(c.name, 16)} [${ROLE_N[Math.max(0, Math.min(3, +c.role || 0))]}] PUBLIK[${clip(c.pub, 240)}] PRIBADI-hanya-dia[${clip(c.priv, 220)}] GAYA[${clip(c.style, 260)}] HUBUNGAN dengan ${pn}: ${clip(c.rel, 120)}${vote ? ` · sikap mosi: ${clip(c.vote, 40)}` : ''}`).join('\n')}
OBROLAN GUILD (lama -> baru):
${hist.map(h => `${hhmm(h.ts)} ${h.uid === u.uid ? pn : clip(h.uname, 16)}: ${clip(h.txt, 180)}`).join('\n') || '(belum ada)'}
${clip(b.extra, 300)}
Tanggapi pesan terbaru dari ${pn}. who = uid kandidat.`;
    let o = null;
    try {
      if (env.AI_FAKE) { if (env.TG_LOG) (globalThis.__ai ||= []).push(user); o = { out: [{ who: String(cand[0].uid), text: 'siap, absen dulu', delay: 3, vote: vote && cand[0].fake ? cand[0].fake : null }], rel: { [String(cand[0].uid)]: 1 } } }
      else { const r = await callClaude(env, user, 320, GUILD_ROLE), m = String(r.text).match(/\{[\s\S]*\}/); try { o = m ? JSON.parse(m[0]) : null } catch (e) { } }
    } catch (e) { return json({ ok: true, n: 0, e: 'ai' }) }
    const st = []; let tt = t + 1500 + Math.random() * 3000; const outs = [];
    for (const x of ((o && o.out) || []).slice(0, 3)) {
      const c = cand.find(c => String(c.uid) === String(x.who)); if (!c) continue; const txt = cleanOut(x.text, c.lower); if (!txt) continue;
      tt += Math.max(1500, Math.min(12e3, (+x.delay || 3) * 1000)) + txt.length * 120;
      st.push(env.DB.prepare('INSERT INTO gchat (gid,uid,txt,ts) VALUES (?,?,?,?)').bind(gid, String(c.uid), txt, Math.round(tt))); outs.push(String(c.uid));
      if (vote && (x.vote === 'yes' || x.vote === 'no') && String(c.uid) !== vote.who && String(c.uid) !== vote.tgt) {
        const Y = pj(vote.yes, {}), N = pj(vote.no, {}), id = String(c.uid); delete Y[id]; delete N[id]; (x.vote === 'yes' ? Y : N)[id] = Math.round(tt);
        vote.yes = JSON.stringify(Y); vote.no = JSON.stringify(N); st.push(env.DB.prepare('UPDATE gvote SET yes=?, no=? WHERE id=? AND st=0').bind(vote.yes, vote.no, vote.id));
      }
    }
    for (const [id, dv] of Object.entries((o && o.rel) || {})) if (cand.some(c => String(c.uid) === id) && +dv) st.push(relStmt(env, u.uid, id, Math.max(-3, Math.min(3, +dv)), t));
    if (st.length) await runAll(env, st);
    return json({ ok: true, n: outs.length, at: Math.round(tt) });
  }
  if (act === 'inv') {   // membujuk bot masuk guild-ku. Keputusan si bot dihitung game (relasi, kekuatan guild, kesetiaan) → ok=1 dia pindah
    if (!myM) return fail('noguild'); const w = String(b.uid || ''); if (!(await isBotHere(w))) return fail('notbot');
    const ck = 'ginv:' + u.uid + ':' + w + ':' + wday(t); if (await kvGet(env, ck) && !u.gm) return fail('ginvday'); await kvSet(env, ck, 1);
    if (!b.ok) { await env.DB.batch([relStmt(env, u.uid, w, -1, t)]); return json({ ok: true, st: 'no' }) }
    const n = (await env.DB.prepare('SELECT COUNT(*) n FROM gmem WHERE gid=?').bind(gid).first()).n; if (n >= gCap(gLv(myM.xp))) return fail('gfull');
    return json(await guildMove(env, srv, gid, w, u.uid, at0(b.at, t)));
  }
  if (act === 'vote') {   // mosi kudeta: start (aku menggulingkan ketua) · cast (suara pemain asli) · sway (bot berubah sikap karena dibujuk)
    const v = await env.DB.prepare('SELECT * FROM gvote WHERE gid=? AND st=0').bind(gid).first(), g = await G(gid);
    if (b.op === 'start') {
      if (v) return fail('gvote'); if (myM.role === 3) return fail('perm', 403);
      if (t - myM.joined < 864e5 && !u.gm) return fail('gnew');
      const cd = +(await kvGet(env, 'gvc:' + gid) || 0); if (t - cd < 2 * 864e5 && !u.gm) return json({ ok: false, e: 'gvcool', at: cd + 2 * 864e5 });
      const M = await memList(gid), inG = new Set(M.map(r => r.uid)), Y = { [u.uid]: t }, N = {};
      for (const [w, x] of Object.entries(b.st || {})) { if (!inG.has(w) || w === u.uid || w === g.lead || !(await isBotHere(w))) continue; (x[0] ? Y : N)[w] = Math.max(t, Math.min(t + VOTE_MS, +x[1] || t)) }
      if (await isBotHere(g.lead)) N[g.lead] = t;
      const r = await env.DB.prepare('INSERT INTO gvote (gid,who,tgt,t0,t1,st,yes,no,res) VALUES (?,?,?,?,?,0,?,?,?) RETURNING id').bind(gid, u.uid, g.lead, t, t + VOTE_MS, JSON.stringify(Y), JSON.stringify(N), JSON.stringify(b.res || {})).first();
      await env.DB.batch([logSt(env, gid, t, 'vote', u.uid, g.lead, clean(b.why, 60) || null), env.DB.prepare('INSERT INTO kv (k,v) VALUES (?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v').bind('gvc:' + gid, String(t)), gvBump(env, srv)]);
      return json({ ok: true, id: r.id, t1: t + VOTE_MS });
    }
    if (!v) return fail('novote');
    const Y = pj(v.yes, {}), N = pj(v.no, {});
    if (b.op === 'cast') { if (u.uid === v.who) return fail('gself'); delete Y[u.uid]; delete N[u.uid]; (b.y ? Y : N)[u.uid] = t; }
    else if (b.op === 'sway') {   // dibujuk (tombol Bujuk / DM): bot ganti sikap
      const w = String(b.uid || ''); if (w === v.who || w === v.tgt || !(await isBotHere(w)) || !(await env.DB.prepare('SELECT 1 FROM gmem WHERE uid=? AND gid=?').bind(w, gid).first())) return fail('none');
      const ck = 'gsw:' + v.id + ':' + u.uid + ':' + w; if (await kvGet(env, ck)) return fail('done'); await kvSet(env, ck, 1);
      if (b.ok) { delete Y[w]; delete N[w]; (b.y ? Y : N)[w] = Math.max(t + 5e3, Math.min(v.t1 - 1, +b.ts || t + 3e4)) }
      await env.DB.batch([relStmt(env, u.uid, w, b.ok ? 2 : -2, t)]);
    } else return fail('op');
    await env.DB.batch([env.DB.prepare('UPDATE gvote SET yes=?, no=? WHERE id=?').bind(JSON.stringify(Y), JSON.stringify(N), v.id), gvBump(env, srv)]);
    return json({ ok: true });
  }
  return fail('act', 404);
}
// hapus semua data guild satu server (reset / hapus server) · semua server (rilis serentak / reset semua)
export const guildWipe = (env, srv) => { const sub = 'SELECT id FROM guilds WHERE srv=?'; return [
  ...['gchat', 'glog', 'gapp', 'gvote', 'gmem'].map(tb => env.DB.prepare(`DELETE FROM ${tb} WHERE gid IN (${sub})`).bind(srv)),
  env.DB.prepare('DELETE FROM guilds WHERE srv=?').bind(srv), env.DB.prepare('DELETE FROM kv WHERE k IN (?,?)').bind('gv:' + srv, 'gt:' + srv)] };
export const guildWipeAll = env => [...['gchat', 'glog', 'gapp', 'gvote', 'gmem', 'guilds', 'rel'].map(tb => env.DB.prepare(`DELETE FROM ${tb}`)), env.DB.prepare("DELETE FROM kv WHERE k LIKE 'gv:%' OR k LIKE 'gt:%' OR k LIKE 'gvc:%'")];
// bot pindah ke guild gid karena dibujuk pemain `by` (ajakan / DM). Ketua yang dibujuk pergi → diganti wakil / anggota terlama
export async function guildMove(env, srv, gid, w, by, at) {
  const t = Date.now(), g = await env.DB.prepare('SELECT * FROM guilds WHERE id=? AND gone IS NULL').bind(gid).first(); if (!g) return { ok: false, e: 'none' };
  const n = (await env.DB.prepare('SELECT COUNT(*) n FROM gmem WHERE gid=?').bind(gid).first()).n; if (n >= gCap(gLv(g.xp))) return { ok: false, e: 'gfull' };
  const old = await env.DB.prepare('SELECT * FROM gmem WHERE uid=?').bind(w).first(); if (old && old.gid === gid) return { ok: true, st: 'in' };
  const st = [];
  if (old) { st.push(env.DB.prepare('DELETE FROM gmem WHERE uid=?').bind(w), logSt(env, old.gid, at, 'l', w, null, 'dibujuk:' + gid));
    if (old.role === 3) { const M = (await env.DB.prepare('SELECT uid,role,joined FROM gmem WHERE gid=?').bind(old.gid).all()).results, s = succOf(M, w); if (!s) st.push(env.DB.prepare('UPDATE guilds SET gone=? WHERE id=?').bind(t, old.gid), logSt(env, old.gid, t, 'd', w, null, 'kosong')); else st.push(env.DB.prepare('UPDATE gmem SET role=3 WHERE uid=?').bind(s.uid), env.DB.prepare('UPDATE guilds SET lead=? WHERE id=?').bind(s.uid, old.gid), logSt(env, old.gid, t + 1, 'L', s.uid, w, 'succ')) } }
  st.push(env.DB.prepare('INSERT INTO gmem (uid,gid,role,joined) VALUES (?,?,0,?)').bind(w, gid, at), env.DB.prepare('DELETE FROM gapp WHERE uid=?').bind(w), logSt(env, gid, at, 'j', w, by, old ? 'pindah:' + old.gid : 'diajak'), relStmt(env, by, w, 5, t), gvBump(env, srv));
  await env.DB.batch(st); return { ok: true, st: 'in', from: old ? old.gid : null };
}
const at0 = (x, t) => Math.round(Math.max(t - 3 * 864e5, Math.min(t + 6e4, +x || t)));
