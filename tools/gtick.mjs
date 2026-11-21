// Penjadwal politik guild semua server (dipanggil GitHub Actions tiap 20 menit: .github/workflows/guild-tick.yml).
// Politik guild bot dihitung oleh game (gSim) lalu dikirim ke server. Tanpa ini, server yang tidak punya pemain online
// tidak pernah punya guild. Skrip ini membuka game (index.html) tanpa layar, memuat dunia bot tiap server yang buka,
// menjalankan gSim, dan mengirim tick ke /api/g/tick dengan kunci GTICK_KEY = sha256('gtick:' + BOT_TOKEN).
//
// Pakai: GTICK_KEY=... node tools/gtick.mjs [index.html] [--api URL] [--srv 1,2]
//   CHROME=/path/ke/chrome (bawaan: Chrome sistem lewat channel 'chrome')
import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2), opt = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null };
const FILE = path.resolve(args.find(a => /\.html$/.test(a)) || 'index.html');
const API = opt('--api'), ONLY = (opt('--srv') || '').split(',').filter(Boolean).map(Number), KEY = process.env.GTICK_KEY || '';
if (!KEY) { console.error('GTICK_KEY kosong'); process.exit(1) }
if (!fs.existsSync(FILE)) { console.error('tidak ada ' + FILE); process.exit(1) }

// server http kecil (game butuh origin http, bukan file://)
const html = fs.readFileSync(FILE);
const srv = http.createServer((q, r) => { if (q.url.split('?')[0].replace(/#.*/, '') === '/index.html') { r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); r.end(html) } else { r.writeHead(404); r.end() } });
await new Promise(r => srv.listen(0, '127.0.0.1', r));
const port = srv.address().port;

const T0 = Date.now(), log = (...a) => console.log(`[${((Date.now() - T0) / 1000).toFixed(1)}s]`, ...a);
const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME, args: ['--no-sandbox'] } : { channel: 'chrome', args: ['--no-sandbox'] });
let code = 0;
try {
  const pg = await b.newPage({ viewport: { width: 400, height: 800 } });
  pg.on('pageerror', e => log('pageerror', String(e).slice(0, 200)));
  await pg.goto(`http://127.0.0.1:${port}/index.html#skipboot`);
  await pg.waitForFunction(() => typeof gSim === 'function' && typeof netWorld === 'function' && typeof S !== 'undefined' && S, null, { timeout: 120000 });
  if (API) await pg.evaluate(a => { TOPUP_CFG.api = a }, API);
  // akun semu mode penonton: semua loop game (obrolan AI, pengumuman, simpan, Bos Dunia, ...) mati
  const list = await pg.evaluate(async () => { NET.acct = { uid: '00000000', u: 'gtick', tok: 'gtick', sv: 0, srv: 1, watch: 1 }; const o = await api('/api/servers'); return o && o.ok ? o.list : null });
  if (!list) throw new Error('daftar server gagal dimuat');
  const open = list.filter(x => x.st !== 'list' && !(x.opened > Date.now()) && (!ONLY.length || ONLY.includes(x.id)));
  log('server buka:', open.map(x => 'S' + x.id).join(' ') || '-');
  for (const x of open) {
    const r = await pg.evaluate(async ({ id, key }) => {
      const t = performance.now();
      NET.acct.srv = id; NET.players = []; NET.plAt = 0; GS.srv = 0; GS.tk = 0; GS.at = 0;
      if (!(await netWorld(true)) || !BOTS.W || !BOTS.W.length) return { e: 'world' };
      await netPlayers(true); await gLoad(true); if (!gReady()) return { e: 'guild' };
      const k = Math.floor(Date.now() / G_CFG.tick); if (GS.tk >= k) return { skip: 'sudah dihitung', tk: GS.tk, g: GS.G.size };
      await new Promise(r => botsWarm(r));
      const o = await gTickRun({ key, srv: id });
      return Object.assign({ g: GS.G.size, mem: GS.mem.size, ms: Math.round(performance.now() - t) }, o);
    }, { id: x.id, key: KEY });
    log('S' + x.id, JSON.stringify(r).slice(0, 300));
    if (r && r.e && r.e !== 'old') console.log(`::warning::S${x.id}: ${r.e}`);
  }
} catch (e) { console.error(e); console.log('::warning::gtick gagal: ' + String(e).slice(0, 200)); code = /Executable|browserType/.test(String(e)) ? 1 : 0 }
await b.close(); srv.close(); process.exit(code);
