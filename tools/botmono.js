// Pemindai "CP bot tidak pernah turun" untuk tools/botfp.mjs run (data server diputar ulang, waktu dibekukan di --t).
//   node tools/botfp.mjs run dist/index.html --dir /tmp/botfp --srv 1,2,3,4 --t 2026-12-10T06:00:00Z --js tools/botmono.js
// Sampel ±N bot per server (geser OFF untuk sampel lain), tiap bot dipindai dari bergabung s.d. --t setiap JAM jam.
// Laporan: cpTurun (CP < 99,9% titik sebelumnya), tahapMundur, dan ≤6 contoh [bot, waktu, CP, waktu, CP, tim sebelum, tim sesudah].
// Kalau ada contoh: paksa tim lama di waktu sesudahnya (ganti botBestTeams sementara) untuk melihat apakah tim lama terlewat
// sebagai calon (CP paksa > CP baru) atau barang/bahannya yang berbeda (CP paksa ≤ CP baru).
async (id, T0) => {
  const N = 300, OFF = 0, JAM = 8;
  const ids = botsIds(T0), step = Math.max(1, Math.floor(ids.length / N)), S = ids.filter((_, k) => k % step === OFF % step);
  const iso = t => new Date(t).toISOString().slice(5, 13);
  let n = 0, pts = 0, stN = 0, asc = 0; const ex = [];
  for (const i of S) {
    const b = botBase(i); let prev = null;
    for (let t = b.join + 36e5; t <= T0; t += JAM * 36e5) {
      const s = botState(i, t); pts++;
      if (prev) {
        if (s.cp < prev.cp * .999) { n++; if (ex.length < 6) ex.push([i, iso(prev.t), prev.cp, iso(t), s.cp, prev.team.join(), s.team.join()]) }
        if ((s.stN || 0) < prev.stN) stN++;
      }
      prev = { t, cp: s.cp, team: s.team, stN: s.stN || 0 };
    }
    if (Object.values(botState(i, T0).heroes).some(h => h.asc >= 4)) asc++;
  }
  return { bots: S.length, titik: pts, cpTurun: n, tahapMundur: stN, denganKebangkitan: asc, ex };
}
