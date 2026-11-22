// Sidik jari dunia bot — alat uji regresi untuk SEMUA perubahan kode bot.
// Dunia bot deterministik (hasil sama di semua perangkat). Perapian kode tidak boleh mengubah hasil
// kecuali memang disengaja. Alat ini merekam keadaan ratusan bot pada beberapa waktu tetap lalu
// membandingkannya dengan rekaman sebelumnya.
//
//   1) rekam data server sekali (dunia bot, daftar pemain, guild) → folder fixture:
//        node tools/botfp.mjs record dist/index.html --api http://localhost:8787 --dir /tmp/botfp --srv 1,2
//   2) sidik jari (data diputar ulang dari fixture, waktu dibekukan → hasil selalu sama):
//        node tools/botfp.mjs fp dist/index.html --dir /tmp/botfp --out /tmp/botfp/sebelum.json
//   3) setelah mengubah kode & build ulang: fp lagi ke sesudah.json, lalu bandingkan:
//        node tools/botfp.mjs diff /tmp/botfp/sebelum.json /tmp/botfp/sesudah.json
//   4) jalankan skrip uji sendiri di dunia yang sama (fungsi async (srv) => hasil, dicetak sebagai JSON):
//        node tools/botfp.mjs run dist/index.html --dir /tmp/botfp --srv 1 --js tools/botcheck.js
//   CHROME=/path/ke/chrome (bawaan: Chrome sistem lewat channel 'chrome')
import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const [cmd, ...args] = process.argv.slice(2), opt = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null };
const DIR = opt('--dir') || '/tmp/botfp', SRV = (opt('--srv') || '1').split(',').map(Number);
const h = s => crypto.createHash('sha1').update(typeof s === 'string' ? s : JSON.stringify(s)).digest('hex').slice(0, 12);

if (cmd === 'diff') {
  const [a, b] = args.filter(x => x.endsWith('.json')).map(f => JSON.parse(fs.readFileSync(f, 'utf8')));
  let bad = 0;
  const walk = (x, y, p) => {
    if (typeof x !== 'object' || x === null || typeof y !== 'object' || y === null) { if (JSON.stringify(x) !== JSON.stringify(y)) { bad++; const c = p.split('.').slice(0, 4).filter(v => !/^\d+$/.test(v)).join('.'); (walk.n = walk.n || {})[c] = (walk.n[c] || 0) + 1; if (bad <= Number(process.env.SHOW || 25)) console.log('BEDA', p, JSON.stringify(x).slice(0, 160), '→', JSON.stringify(y).slice(0, 160)) } return }
    for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) walk(x[k], y[k], p + '.' + k);
  };
  walk(a, b, '');
  const cat = {}; walk.cat = cat;
  console.log(bad ? `${bad} perbedaan` : 'SAMA — dunia bot tidak berubah');
  if (bad) console.log('per bagian:', JSON.stringify(walk.n));
  process.exit(bad ? 1 : 0);
}

const FILE = path.resolve(args.find(a => /\.html$/.test(a)) || 'dist/index.html');
const html = fs.readFileSync(FILE);
const srv = http.createServer((q, r) => { if (q.url.split('?')[0] === '/index.html') { r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); r.end(html) } else { r.writeHead(404); r.end() } });
await new Promise(r => srv.listen(0, '127.0.0.1', r));
const port = srv.address().port;
const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME, args: ['--no-sandbox'] } : { channel: 'chrome', args: ['--no-sandbox'] });
const pg = await b.newPage({ viewport: { width: 400, height: 800 } });
const errs = []; pg.on('pageerror', e => errs.push(String(e).slice(0, 200)));
fs.mkdirSync(DIR, { recursive: true });
const API = opt('--api') || 'https://aster-bank.valberryv.workers.dev';
const key = u => { const x = new URL(u); return h(x.pathname + x.search) };

// semua panggilan ke server: record = ambil dari API asli lalu simpan, fp = putar ulang dari fixture
await pg.route(/\/api\//, async (route) => {
  const u = route.request().url(), x = new URL(u), f = path.join(DIR, key(u) + '.json');
  const keep = /^\/api\/(world|players|g\/all|servers|bots\/snap)/.test(x.pathname);
  if (cmd === 'fp' || (cmd === 'run' && !args.includes('--live'))) {
    if (keep && fs.existsSync(f)) return route.fulfill({ status: 200, contentType: 'application/json', body: fs.readFileSync(f) });
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":false,"e":"offline"}' });
  }
  const r = await fetch(API + x.pathname + x.search, { method: route.request().method(), headers: { 'content-type': 'application/json' }, body: route.request().postData() || undefined });
  const body = await r.text(); if (keep && r.ok) fs.writeFileSync(f, body);
  return route.fulfill({ status: r.status, contentType: 'application/json', body });
});

// waktu dibekukan (semua Date.now/new Date() = T), dimajukan hanya lewat __setNow
const T0 = Date.parse(opt('--t') || '2026-11-22T06:00:00Z');
await pg.addInitScript(t => { let now = t; const RD = Date; class FD extends RD { constructor(...a) { a.length ? super(...a) : super(now) } static now() { return now } } window.Date = FD; window.__setNow = x => { now = x } }, T0);
await pg.goto(`http://127.0.0.1:${port}/index.html#skipboot`);
await pg.waitForFunction(() => typeof botState === 'function' && typeof netWorld === 'function' && typeof S !== 'undefined' && S, null, { timeout: 120000 });
await pg.evaluate(a => { TOPUP_CFG.api = a }, API);

const LOAD = async (id) => pg.evaluate(async (id) => {
  NET.acct = { uid: '00000000', u: 'fp', tok: 'fp', sv: 0, srv: id, watch: 1 }; NET.players = []; NET.plAt = 0;
  if (typeof GS !== 'undefined') { GS.srv = 0; GS.tk = 0; GS.at = 0 }
  if (!(await netWorld(true))) return false;
  await netPlayers(true); if (typeof gLoad === 'function') await gLoad(true);
  await new Promise(r => botsWarm(r)); return true
}, id);
if (cmd === 'run') {
  const code = fs.readFileSync(opt('--js'), 'utf8');
  for (const id of SRV) {
    if (!(await LOAD(id))) { console.log('S' + id + ': dunia gagal dimuat'); continue }
    const r = await pg.evaluate(async ({ code, id, T0 }) => { const f = (0, eval)('(' + code + ')'); return await f(id, T0) }, { code, id, T0 });
    console.log('S' + id + ':'); if (r && typeof r === 'object' && !Array.isArray(r)) for (const k in r) console.log('  ' + k + ': ' + (r[k] && r[k].n != null && r[k].ex ? r[k].n + '  ' + JSON.stringify(r[k].ex).slice(0, 300) : String(JSON.stringify(r[k])).slice(0, 1500))); else console.log(JSON.stringify(r, null, 1));
  }
  if (errs.length) console.log('pageerror:', errs.slice(0, 8));
  await b.close(); srv.close(); process.exit(0);
}
const out = { t: new Date(T0).toISOString(), srv: {} };
for (const id of SRV) {
  const r = await pg.evaluate(async ({ id, T0 }) => {
    NET.acct = { uid: '00000000', u: 'fp', tok: 'fp', sv: 0, srv: id, watch: 1 }; NET.players = []; NET.plAt = 0;
    if (typeof GS !== 'undefined') { GS.srv = 0; GS.tk = 0; GS.at = 0 }
    if (!(await netWorld(true))) return { e: 'world' };
    await netPlayers(true); if (typeof gLoad === 'function') await gLoad(true);
    await new Promise(r => botsWarm(r));
    const D = 864e5, TS = [T0 - 6 * D, T0 - 2 * D - 7 * 36e5, T0 - 3 * 36e5, T0], R = {};
    const ids = botsIds(T0), step = Math.max(1, Math.floor(ids.length / 300)), sample = ids.filter((_, k) => k % step === 0).slice(0, 300);
    const J = x => { try { return JSON.parse(JSON.stringify(x, (k, v) => v instanceof Map ? [...v] : v instanceof Set ? [...v] : typeof v === 'number' && !Number.isInteger(v) ? Math.round(v * 1e6) / 1e6 : v)) } catch (e) { return 'ERR ' + e } };
    R.n = TS.map(t => botsIds(t).length);
    R.base = {}; R.state = {}; R.sum = {}; R.pres = {}; R.name = {}; R.act = {};
    for (const i of sample) {
      { const B = Object.assign({}, botBase(i)); delete B.rn; delete B.endF; delete B.pfo; R.base[i] = J(B) } R.name[i] = TS.map(t => botName(i, t));
      R.state[i] = TS.map(t => { __setNow(t); const s = botState(i, t); return JSON.stringify(J(Object.assign({}, s, { key: undefined }))) });
      R.sum[i] = TS.map(t => { __setNow(t); return J(botSum(i, t)) });
      R.pres[i] = TS.map(t => { __setNow(t); return J(botPres(i, t)) });
      R.act[i] = TS.map(t => { __setNow(t); try { return J(botActivity(i, t)) } catch (e) { return 'ERR ' + e.message } });
    }
    __setNow(T0);
    // semua bot: ringkasan cepat (CP, level, VIP) → satu hash per 500 bot
    R.allSum = []; let acc = [];
    for (const i of ids) { const s = botSum(i, T0); acc.push([i, s.cp, s.lv, s.vip]); if (acc.length === 500) { R.allSum.push(JSON.stringify(acc)); acc = [] } }
    if (acc.length) R.allSum.push(JSON.stringify(acc));
    R.list = J(botsList().slice(0, 50).map(e => [e.name, e.cp, e.lv]));
    // konteks obrolan (dipakai Mode AI): siapa yang online, persona, aktivitas, ringkasan server
    try { R.online = chOnline(T0).length; R.chat = J(sample.slice(0, 120).map(i => [chPersona(i).chat, chPersona(i).reg, (botActivity(i, T0) || {}).k || null])) } catch (e) { R.chat = 'ERR ' + e.message }
    // Bos Dunia: 6 jadwal terakhir
    try { const d = wibDay(T0); R.wb = []; for (const dd of [d - 1, d]) for (const hh of WB_CFG.slots) { const t0 = wbSlotT(dd, hh); if (t0 > T0) continue; const W = wbRaid(t0); R.wb.push([wbKey(t0), W.P.length, Math.round(W.full), Math.round(W.k * 1e6)]) } } catch (e) { R.wb = 'ERR ' + e.message }
    // guild: simulasi tick (dari data guild yang diputar ulang)
    try { if (typeof gSim === 'function' && gReady()) { const k = Math.floor(T0 / G_CFG.tick); GS.tk = Math.min(GS.tk, k - 1); R.gsim = J(gSim(T0, k)) } } catch (e) { R.gsim = 'ERR ' + e.message }
    return R;
  }, { id, T0 });
  // ringkas: simpan hash per bot supaya file kecil tapi tetap menunjuk bot yang berubah
  const S = {};
  for (const k of ['base', 'state', 'sum', 'pres', 'name', 'act']) { S[k] = {}; for (const i in (r[k] || {})) S[k][i] = h(r[k][i]) }
  S.n = r.n; S.allSum = (r.allSum || []).map(h); S.list = h(r.list); S.chat = h(r.chat); S.online = r.online; S.wb = r.wb; S.gsim = h(r.gsim); S.gsimN = Array.isArray(r.gsim) ? r.gsim.length : r.gsim;
  if (r.e) S.e = r.e;
  out.srv[id] = S;
  if (opt('--raw')) fs.writeFileSync(opt('--raw').replace('.json', `.s${id}.json`), JSON.stringify(r));
  console.log(`S${id}: ${r.e || 'ok'} · bot ${(r.n || []).join('/')} · online ${S.online} · guild ops ${S.gsimN}`);
}
if (errs.length) { out.errs = errs.slice(0, 20); console.log('pageerror:', errs.slice(0, 5)) }
if (cmd === 'fp') fs.writeFileSync(opt('--out') || path.join(DIR, 'fp.json'), JSON.stringify(out, null, 1));
await b.close(); srv.close();
