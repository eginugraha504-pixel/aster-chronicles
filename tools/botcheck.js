// Pemeriksa aturan dunia bot (jalankan lewat: node tools/botfp.mjs run dist/index.html --dir /tmp/botfp --srv 1 --js tools/botcheck.js)
// Mengembalikan jumlah pelanggaran per aturan + beberapa contoh. Semua aturan di sini harus 0 di versi yang sehat.
async (srv, T0) => {
  const ids = botsIds(T0), V = {}, bad = (k, i, x) => { const v = V[k] || (V[k] = { n: 0, ex: [] }); v.n++; if (v.ex.length < 4) v.ex.push([i, x]) };
  const num = x => typeof x === 'number' && isFinite(x);
  const step = Math.max(1, Math.floor(ids.length / 1500)), S = ids.filter((_, k) => k % step === 0);
  const HR = new Set(HEROES.map(h => h.id));
  // ---- nama ----
  const seen = new Map();
  for (const i of ids) {
    const n = botName(i, T0); if (!n || !/^[A-Za-z0-9]{3,16}$/.test(n)) bad('nama tidak sah', i, n);
    const k = String(n).toLowerCase(); if (seen.has(k)) bad('nama kembar', i, [n, seen.get(k)]); else seen.set(k, i);
    if (BOTS.uids && !BOTS.uids[i]) bad('bot tanpa uid server', i, n);
  }
  // ---- per bot, sepanjang hidupnya ----
  for (const i of S) {
    const b = botBase(i);
    if (!num(b.join) || b.join > T0) bad('join tidak sah', i, b.join);
    for (let k = 1; k < b.segs.length; k++) if (b.segs[k][0] < b.segs[k - 1][1] - 1) bad('segmen tumpang tindih', i, b.segs);
    if (b.rn && (b.rn.t < b.join || b.rn.t > b.endT)) bad('ganti nama di luar masa aktif', i, b.rn);
    const TS = [b.join + 18e5, b.join + 864e5, b.join + 3 * 864e5, T0 - 3 * 36e5, T0].filter(t => t >= b.join && t <= T0).sort((a, c) => a - c);
    let prev = null;
    for (const t of TS) {
      const s = botState(i, t), st = s.stats || {};
      if (!num(s.cp) || s.cp <= 0) bad('CP tidak sah', i, [t, s.cp]);
      if (!Number.isInteger(s.lv) || s.lv < 1 || s.lv > 200) bad('level akun tidak sah', i, s.lv);
      const H = s.heroes || {}, team = s.team || [];
      if (!team.length || team.length > 5 || new Set(team).size !== team.length) bad('tim tidak sah', i, team);
      for (const h of team) if (!H[h]) bad('hero tim tidak dimiliki', i, [h, Object.keys(H)]);
      for (const h in H) if (!HR.has(h)) bad('hero tidak dikenal', i, h);
      if (s.fav && !H[s.fav]) bad('hero favorit tidak dimiliki', i, s.fav);
      if (s.av && !H[s.av]) bad('avatar tidak dimiliki', i, s.av);
      for (const h in H) { const x = H[h]; if (x && typeof x === 'object' && x.wpn && !(s.weapons || {})[x.wpn]) bad('senjata terpasang tidak dimiliki', i, [h, x.wpn]) }
      for (const k of ['sum', 's3', 'spent', 'vip', 'days', 'hours']) if (st[k] != null && (!num(st[k]) || st[k] < 0)) bad('statistik negatif/NaN: ' + k, i, st[k]);
      for (const e of s.ev || []) if (e.t > t + 1 || e.t < b.join - 1) bad('waktu kejadian di luar rentang', i, [e.t, t, b.join]);
      const sm = botSum(i, t, true);
      if (sm.cp !== s.cp || sm.lv !== s.lv) bad('botSum ≠ botState', i, [t, sm.cp, s.cp, sm.lv, s.lv]);
      if (prev) {
        if (s.cp < prev.cp * 0.995) bad('CP turun', i, [prev.t, prev.cp, t, s.cp]);
        if (s.lv < prev.lv) bad('level turun', i, [prev.lv, s.lv]);
        if (Object.keys(H).length < prev.nh) bad('hero berkurang', i, [prev.nh, Object.keys(H).length]);
        if ((st.sum || 0) < prev.sum) bad('total tarikan turun', i, [prev.sum, st.sum]);
        if ((st.spent || 0) < prev.spent - 1e-6) bad('belanja turun', i, [prev.spent, st.spent]);
        if ((st.vip || 0) < prev.vip) bad('VIP turun', i, [prev.vip, st.vip]);
        if ((s.stN || 0) < prev.stN) bad('tahap cerita mundur', i, [prev.stN, s.stN]);
      }
      prev = { t, cp: s.cp, lv: s.lv, nh: Object.keys(H).length, sum: st.sum || 0, spent: st.spent || 0, vip: st.vip || 0, stN: s.stN || 0 };
      // kehadiran
      const p = botPres(i, t);
      if (p.online && t > botEndF(b) + 6e4) bad('online setelah berhenti main', i, [t, b.endT, botEndF(b)]);
      if (p.last > t + 1) bad('terakhir aktif di masa depan', i, [p.last, t]);
      if (p.online && t === T0 && !botActivity(i, t)) bad('online tanpa aktivitas', i, t);
    }
    // bot yang sudah berhenti: keadaannya tidak boleh berubah lagi
    if (botEndF(b) + 6e4 < T0 - 36e5) { const a = botState(i, botEndF(b) + 6e4).cp, z = botState(i, T0).cp; if (a !== z) bad('bot berhenti tapi CP masih berubah', i, [a, z]) }
    try { const bio = botBio(i, botState(i, T0), 0, T0); if (bio != null && typeof bio !== 'string') bad('bio bukan teks', i, bio) } catch (e) { bad('bio error', i, e.message) }
  }
  // ---- guild (data server + aturan simulasi) ----
  if (typeof GS !== 'undefined' && typeof gReady === 'function' && gReady()) {
    for (const g of GS.G.values()) {
      const M = g.M || [], lead = M.filter(m => m.role === 3);
      if (!M.length) bad('guild tanpa anggota', g.id, g.name);
      if (lead.length !== 1) bad('ketua guild bukan tepat satu', g.id, [g.name, lead.length]);
      if (g.lead && !M.some(m => m.uid === g.lead)) bad('ketua bukan anggota', g.id, [g.name, g.lead]);
      if (M.length > g.cap) bad('anggota melebihi kapasitas', g.id, [g.name, M.length, g.cap]);
      if (!gNameOk(g.name)) bad('nama guild tidak sah', g.id, g.name);
      for (const m of M) { const i = botIdxOf(m.uid); if (i >= 0 && !botIn(i, T0)) bad('anggota bot belum bergabung server', g.id, [g.name, m.uid]) }
    }
    const seenM = new Map(); for (const g of GS.G.values()) for (const m of g.M || []) { if (seenM.has(m.uid)) bad('anggota di dua guild', m.uid, [seenM.get(m.uid), g.id]); seenM.set(m.uid, g.id) }
  }
  // ---- daftar & peringkat ----
  const L = botsList(T0);
  for (let k = 1; k < L.length; k++) if (!num(L[k].cp)) bad('daftar: CP tidak sah', L[k].i, L[k].cp);
  const out = { bots: ids.length, sampel: S.length };
  for (const k in V) out[k] = V[k];
  return out;
}
