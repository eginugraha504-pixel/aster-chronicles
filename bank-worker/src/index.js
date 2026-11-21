/* =====================================================================
   Bank Central Universe — bot Telegram uang mainan + pembayaran Top Up Aster Chronicles
   Jalan di Cloudflare Workers (gratis, selalu hidup, tanpa PC). Data di D1 (SQLite).
   ---------------------------------------------------------------------
   POST /tg                 webhook Telegram (dicek dengan header secret token)
   GET  /api/order/<ID>     dipakai game: {st:'wait'} atau {st:'paid', c:'XXXXX-XXXXX'}  (CORS terbuka)
   POST /api/ai, GET /api/ai/status   Mode AI obrolan (Claude Haiku 5.5) — lihat src/ai.js
   /api/acc/*, /api/save, /api/world, /api/fr/*, /api/dm/*, /api/wc ...  akun & sosial game — lihat src/game.js
   POST /api/botsale        dipakai game: penjualan top up para pemain bot -> pemasukan HUN2 STUDIO (ditandatangani HMAC)
   GET  /setup?k=<hook>     pasang webhook + daftar perintah (dipanggil workflow setelah deploy)
   Secret: BOT_TOKEN (wrangler secret). Var: ASTER_SECRET (= TOPUP_CFG.secret di game), SALDO_AWAL.
   Pemilik rekening = akun Telegram pertama yang menekan Start setelah bot dipasang.
   ===================================================================== */
import { aiRoute } from './ai.js';
import { gameRoute, adminMessage, adminCallback } from './game.js';
const BANK = 'Bank Central Universe';
const MERCHANT = { key: 'hun2studio', name: 'HUN2 STUDIO' };
// harus sama dengan TOPUP_CFG di game (src/js/data/topup.js)
const CATALOG = {
  g1: ['120 Permata', 16000], g2: ['600 Permata', 79000], g3: ['1.960 Permata', 249000],
  g4: ['3.960 Permata', 479000], g5: ['6.560 Permata', 799000], g6: ['12.960 Permata', 1599000],
  mc: ['Kartu Bulanan (30 hari)', 79000],
};
const BTN = { saldo: '💰 Cek Saldo', setor: '📥 Setor Tunai', mutasi: '📜 Mutasi', toko: '🏢 HUN2 STUDIO', bantuan: '❓ Bantuan', game: '🎮 Akun Game' };
const MENU = { keyboard: [[{ text: BTN.saldo }, { text: BTN.setor }], [{ text: BTN.mutasi }, { text: BTN.toko }], [{ text: BTN.game }, { text: BTN.bantuan }]], resize_keyboard: true, is_persistent: true };
const BIG = 799000;   // notifikasi pembelian bot mulai nominal ini (bila /notif on)
const B32 = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const enc = new TextEncoder();

/* ---------------- util ---------------- */
const rp = n => 'Rp' + Math.round(n).toLocaleString('id-ID');
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const wib = (ms, o = {}) => new Date(ms).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', ...o });
const when = ms => wib(ms, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB';
function parseRp(s) {
  s = String(s || '').toLowerCase().replace(/\s|rp/g, '');
  const m = s.match(/^(\d+(?:[.,]\d+)*)(rb|ribu|k|jt|juta)?$/);
  if (!m) return 0;
  const mul = { rb: 1e3, ribu: 1e3, k: 1e3, jt: 1e6, juta: 1e6 }[m[2]] || 1;
  // tanpa satuan: titik/koma = pemisah ribuan (250.000). Dengan satuan: koma/titik = desimal (1,5jt)
  const v = mul === 1 ? +m[1].replace(/[.,]/g, '') : parseFloat(m[1].replace(',', '.')) * mul;
  return v > 0 && v < 1e13 ? Math.round(v) : 0;
}
async function hmacBytes(key, msg) {
  const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, enc.encode(msg)));
}
async function codeFor(env, id, sku, price) {
  const b = await hmacBytes(env.ASTER_SECRET, `${id}|${sku}|${price}`);
  let bits = 0, v = 0, s = '';
  for (const x of b) { v = (v << 8) | x; bits += 8; while (bits >= 5 && s.length < 10) { s += B32[(v >>> (bits - 5)) & 31]; bits -= 5 } if (s.length >= 10) break }
  return s.slice(0, 5) + '-' + s.slice(5);
}
async function hookSecret(env) {
  const d = new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(env.BOT_TOKEN || '')));
  return Array.from(d, x => x.toString(16).padStart(2, '0')).join('').slice(0, 32);
}
function parseTopup(t) {
  t = (t || '').trim();
  const m = t.match(/^\/start\s+aster-(AST[A-Z2-9]{8})-([a-z0-9]+)-(\d+)$/) || t.match(/^\/topup(?:@\w+)?\s+(AST[A-Z2-9]{8})\s+([a-z0-9]+)\s+(\d+)$/i);
  if (!m) return null;
  const id = m[1].toUpperCase(), sku = m[2].toLowerCase(), price = +m[3];
  return CATALOG[sku] && CATALOG[sku][1] === price ? { id, sku, price } : null;
}

/* ---------------- Telegram ---------------- */
async function tg(env, method, body) {
  if (env.TG_LOG) { (globalThis.__out ||= []).push({ method, ...body }); return { ok: true, result: {} } }
  const r = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  return r.json();
}
const send = (env, chat, text, markup = MENU) => tg(env, 'sendMessage', { chat_id: chat, text, parse_mode: 'HTML', disable_web_page_preview: true, reply_markup: markup });

/* ---------------- data ---------------- */
const kvGet = async (env, k) => (await env.DB.prepare('SELECT v FROM kv WHERE k=?').bind(k).first())?.v ?? null;
const kvSet = (env, k, v) => v == null ? env.DB.prepare('DELETE FROM kv WHERE k=?').bind(k).run() : env.DB.prepare('INSERT INTO kv (k,v) VALUES (?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v').bind(k, String(v)).run();
const acc = (env, key) => env.DB.prepare('SELECT * FROM accounts WHERE key=?').bind(key).first();
const newRef = () => { const d = new Date(Date.now() + 7 * 36e5); return 'BCU' + d.toISOString().slice(2, 10).replace(/-/g, '') + String(Math.floor(Math.random() * 1e5)).padStart(5, '0') };
// satu transaksi atomik (D1 batch = 1 transaksi)
async function record(env, kind, frm, to, amount, note) {
  amount = Math.round(amount);
  if (!(amount > 0)) throw new Error('nominal harus lebih dari 0');
  if (frm) { const a = await acc(env, frm); if (!a || a.balance < amount) throw new Error('saldo tidak cukup') }
  const ref = newRef(), ts = Date.now(), st = [];
  if (frm) st.push(env.DB.prepare('UPDATE accounts SET balance=balance-? WHERE key=?').bind(amount, frm));
  if (to) st.push(env.DB.prepare('UPDATE accounts SET balance=balance+? WHERE key=?').bind(amount, to));
  st.push(env.DB.prepare('INSERT INTO tx (ref,ts,kind,frm,too,amount,note) VALUES (?,?,?,?,?,?,?)').bind(ref, ts, kind, frm, to, amount, (note || '').slice(0, 120)));
  return { st, ref, ts, amount };
}

/* ---------------- kartu ---------------- */
async function cardSaldo(env) {
  const a = await acc(env, 'egi');
  return `🏦 <b>${BANK}</b>\n\n👤 ${esc(a.name)}\n💳 ${a.number}\n\n💰 Saldo: <b>${rp(a.balance)}</b>\n🕒 ${when(Date.now())}`;
}
async function cardMutasi(env) {
  const { results } = await env.DB.prepare("SELECT * FROM tx WHERE frm='egi' OR too='egi' ORDER BY id DESC LIMIT 12").all();
  if (!results.length) return '📜 <b>Mutasi rekening</b>\n\nBelum ada transaksi.';
  const what = t => ({ saldo_awal: 'Saldo awal', setor: 'Setor tunai', tarik: 'Tarik tunai', bayar: `Bayar ${t.note}` }[t.kind] || t.kind);
  const rows = results.map(t => `${wib(t.ts, { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' })}  ${t.too === 'egi' ? '+' : '-'}${rp(t.amount)}\n      ${what(t)}`);
  return `📜 <b>Mutasi rekening</b> (12 terakhir)\n\n<code>${esc(rows.join('\n'))}</code>\n\n💰 Saldo: <b>${rp((await acc(env, 'egi')).balance)}</b>`;
}
const HELP = `🏦 <b>${BANK}</b>\n\nPakai tombol di bawah, atau ketik:\n• /saldo\n• /mutasi\n• /setor 5jt\n• /tarik 500rb\n• /toko — pemasukan HUN2 STUDIO dari pemain\n• /notif on|off — kabar pembelian besar\n• /admin — cek & ubah akun pemain/bot Aster (UID atau username)\n\n🎮 <b>Top Up Aster Chronicles</b>: buka Toko › Top Up di game, pilih paket, lalu tekan <i>Bayar di Telegram</i>. Permata masuk otomatis setelah kamu menekan ✅ Bayar.\n\nNominal boleh ditulis 250000, 250.000, 250rb, 1,5jt.`;

/* ---------------- rekening HUN2 STUDIO (penjualan pemain bot) ---------------- */
const dayStartWIB = ms => { const d = new Date(ms + 7 * 36e5); d.setUTCHours(0, 0, 0, 0); return d.getTime() - 7 * 36e5 };
async function cardToko(env) {
  const m = await acc(env, MERCHANT.key), now = Date.now(), d0 = dayStartWIB(now), w0 = now - 7 * 864e5;
  const q = (a, b) => env.DB.prepare('SELECT COUNT(*) n, COALESCE(SUM(price),0) s FROM botsales WHERE ts>=? AND ts<?').bind(a, b).first();
  const [today, week, all] = await Promise.all([q(d0, now + 1), q(w0, now + 1), q(0, now + 1)]);
  const { results: last } = await env.DB.prepare('SELECT * FROM botsales ORDER BY ts DESC LIMIT 10').all();
  const top = await env.DB.prepare('SELECT name, SUM(price) s, COUNT(*) n FROM botsales WHERE ts>=? GROUP BY name ORDER BY s DESC LIMIT 3').bind(d0).all();
  const rows = last.map(t => `${wib(t.ts, { hour: '2-digit', minute: '2-digit' })}  +${rp(t.price)}\n      ${t.name} · ${(CATALOG[t.sku] || [t.sku])[0]}`);
  return `🏢 <b>${MERCHANT.name}</b> · ${m.number}\n💰 Saldo: <b>${rp(m.balance)}</b>\n\n📈 Penjualan Aster Chronicles\n• Hari ini: <b>${rp(today.s)}</b> (${today.n} transaksi)\n• 7 hari: ${rp(week.s)} (${week.n})\n• Total: ${rp(all.s)} (${all.n})` +
    (top.results.length ? `\n\n👑 Pembeli terbesar hari ini\n${top.results.map((t, k) => `${k + 1}. ${esc(t.name)} — ${rp(t.s)} (${t.n}x)`).join('\n')}` : '') +
    (rows.length ? `\n\n🧾 Terakhir\n<code>${esc(rows.join('\n'))}</code>` : '\n\nBelum ada penjualan.') + `\n\n🔔 Kabar pembelian besar: ${(await kvGet(env, 'notif')) === 'on' ? 'aktif' : 'mati'} (/notif on|off)`;
}
async function botSale(env, req) {
  let body; try { body = JSON.parse(await req.text()) } catch (e) { return json({ ok: false, e: 'json' }, 400) }
  const L = Array.isArray(body.sales) ? body.sales.slice(0, 50) : [];
  if (!L.length) return json({ ok: true, n: 0 });
  const sig = Array.from(await hmacBytes(env.ASTER_SECRET, L.map(s => [s.k, s.n, s.sku, s.p, s.t].join('|')).join('\n')), x => x.toString(16).padStart(2, '0')).join('');
  if (sig !== body.sig) return json({ ok: false, e: 'sig' }, 403);
  const now = Date.now(), ok = L.filter(s => typeof s.k === 'string' && s.k.length <= 90 && /^[A-Za-z0-9]{3,16}$/.test(s.n) && CATALOG[s.sku] && CATALOG[s.sku][1] === s.p && s.t > now - 3 * 864e5 && s.t < now + 12e4);
  if (!ok.length) return json({ ok: true, n: 0 });
  const have = new Set((await env.DB.prepare(`SELECT k FROM botsales WHERE k IN (${ok.map(() => '?').join(',')})`).bind(...ok.map(s => s.k)).all()).results.map(r => r.k));
  const fresh = ok.filter(s => !have.has(s.k)), st = [], big = [];
  for (const s of fresh) {
    const ref = newRef(), label = CATALOG[s.sku][0];
    // hanya yang benar-benar menyisipkan baris (ref cocok) yang menambah saldo -> aman dari laporan ganda bersamaan
    st.push(env.DB.prepare('INSERT OR IGNORE INTO botsales (k,name,sku,price,ts,ref) VALUES (?,?,?,?,?,?)').bind(s.k, s.n, s.sku, s.p, s.t, ref));
    st.push(env.DB.prepare("UPDATE accounts SET balance=balance+? WHERE key=? AND (SELECT ref FROM botsales WHERE k=?)=?").bind(s.p, MERCHANT.key, s.k, ref));
    st.push(env.DB.prepare("INSERT INTO tx (ref,ts,kind,frm,too,amount,note) SELECT ?,?,'jual',NULL,?,?,? WHERE (SELECT ref FROM botsales WHERE k=?)=?").bind(ref, s.t, MERCHANT.key, s.p, `Top up Aster: ${label} (${s.n})`.slice(0, 120), s.k, ref));
    if (s.p >= BIG) big.push(s);
  }
  if (st.length) await env.DB.batch(st);
  const owner = await kvGet(env, 'owner');
  if (big.length && owner && (await kvGet(env, 'notif')) === 'on')
    await send(env, owner, `💎 <b>Pembelian besar di Aster Chronicles</b>\n\n${big.slice(0, 6).map(s => `• ${esc(s.n)} — ${CATALOG[s.sku][0]} <b>${rp(s.p)}</b> (${wib(s.t, { hour: '2-digit', minute: '2-digit' })})`).join('\n')}${big.length > 6 ? `\n…dan ${big.length - 6} lagi` : ''}\n\nMasuk ke rekening ${MERCHANT.name}.`);
  return json({ ok: true, n: fresh.length });
}

/* ---------------- top up ---------------- */
async function invoice(env, chat, o) {
  const paid = await env.DB.prepare('SELECT * FROM orders WHERE id=?').bind(o.id).first();
  if (paid) return send(env, chat, `ℹ️ Pesanan <code>${o.id}</code> sudah dibayar (Ref <code>${paid.ref}</code>).\nPermata sudah dikirim ke game.\n\n🎟️ Kode cadangan: <code>${paid.code}</code>`);
  const bal = (await acc(env, 'egi')).balance;
  return send(env, chat, `🎮 <b>Tagihan Aster Chronicles</b>\n\n🛒 ${CATALOG[o.sku][0]}\n🏷️ ID Pesanan: <code>${o.id}</code>\n🏢 Penerima: ${MERCHANT.name}\n\n💳 Total: <b>${rp(o.price)}</b>\n💰 Saldo kamu: ${rp(bal)}` +
    (bal < o.price ? '\n\n⚠️ Saldo tidak cukup. Setor tunai dulu, lalu buka lagi tagihan ini dari game.' : ''),
    { inline_keyboard: [[{ text: '✅ Bayar', callback_data: `pay:${o.id}:${o.sku}:${o.price}` }, { text: '❌ Batal', callback_data: 'cancel' }]] });
}
async function pay(env, chat, o) {
  if (!CATALOG[o.sku] || CATALOG[o.sku][1] !== o.price) return send(env, chat, '❌ Tagihan tidak valid.');
  if (await env.DB.prepare('SELECT 1 FROM orders WHERE id=?').bind(o.id).first()) return invoice(env, chat, o);
  let r;
  try { r = await record(env, 'bayar', 'egi', MERCHANT.key, o.price, `Aster Chronicles: ${CATALOG[o.sku][0]} ${o.id}`) } catch (e) { return send(env, chat, `❌ Pembayaran gagal: ${e.message}.`) }
  const code = await codeFor(env, o.id, o.sku, o.price);
  r.st.push(env.DB.prepare('INSERT INTO orders (id,sku,price,ref,code,ts) VALUES (?,?,?,?,?,?)').bind(o.id, o.sku, o.price, r.ref, code, r.ts));
  try { await env.DB.batch(r.st) } catch (e) { return invoice(env, chat, o) }  // pesanan sudah ada = dibayar bersamaan
  const bal = (await acc(env, 'egi')).balance;
  return send(env, chat, `✅ <b>Pembayaran berhasil</b>\n\n🛒 ${CATALOG[o.sku][0]}\n🏷️ ${o.id}\n💳 ${rp(o.price)} ke ${MERCHANT.name}\n🧾 Ref: <code>${r.ref}</code>\n🕒 ${when(r.ts)}\n\n⚡ Permata masuk otomatis ke game dalam beberapa detik.\n🎟️ Kode cadangan: <code>${code}</code>\n\n💰 Sisa saldo: <b>${rp(bal)}</b>`);
}

/* ---------------- percakapan ---------------- */
async function onMessage(env, m) {
  if (m.chat.type !== 'private') return;
  const chat = m.chat.id, uid = String(m.from.id), t = (m.text || '').trim(), low = t.toLowerCase();
  let owner = await kvGet(env, 'owner');
  if (!owner) {  // klaim pertama: rekening dibuat untuk akun ini
    owner = uid; await kvSet(env, 'owner', uid);
    const r = await record(env, 'saldo_awal', null, 'egi', +env.SALDO_AWAL || 10000000, 'saldo awal');
    await env.DB.batch([env.DB.prepare('INSERT OR IGNORE INTO accounts (key,name,number,balance) VALUES (?,?,?,0)').bind('egi', m.from.first_name || 'Nasabah', '8801-2026-0001'), ...r.st]);
    await send(env, chat, `🎉 Rekeningmu sudah dibuka di <b>${BANK}</b> dengan saldo awal <b>${rp(r.amount)}</b>.`);
  }
  if (uid !== owner) return send(env, chat, `🏦 ${BANK}\n\nMaaf, layanan ini hanya untuk nasabah terdaftar.`, { remove_keyboard: true });
  const o = parseTopup(t);
  if (o) { await kvSet(env, 'flow', null); return invoice(env, chat, o) }
  if (low.startsWith('/start aster') || low.startsWith('/topup')) return send(env, chat, '❌ Tagihan top up tidak valid atau harganya tidak cocok.\nBuat pesanan lagi dari game (Toko › Top Up).');
  if (['/start', '/bantuan', '/help', 'menu', BTN.bantuan.toLowerCase()].includes(low)) { await kvSet(env, 'flow', null); return send(env, chat, `Selamat datang di <b>${BANK}</b>, ${esc((await acc(env, 'egi')).name)} 👋\n\n` + HELP) }
  if (low === '/batal' || low === 'batal') { await kvSet(env, 'flow', null); return send(env, chat, 'Transaksi dibatalkan.') }
  if (t === BTN.saldo || low === '/saldo') return send(env, chat, await cardSaldo(env));
  if (t === BTN.mutasi || low === '/mutasi') return send(env, chat, await cardMutasi(env));
  if (t === BTN.toko || low === '/toko') return send(env, chat, await cardToko(env));
  const nm = low.match(/^\/notif(?:@\w+)?\s*(on|off)?$/);
  if (nm) { if (nm[1]) await kvSet(env, 'notif', nm[1]); return send(env, chat, `🔔 Kabar pembelian besar (≥ ${rp(BIG)}) dari pemain Aster: <b>${(await kvGet(env, 'notif')) === 'on' ? 'aktif' : 'mati'}</b>.\nUbah dengan /notif on atau /notif off.`) }
  if (t === BTN.setor) { await kvSet(env, 'flow', 'setor'); return send(env, chat, '📥 <b>Setor tunai</b>\n\nKetik nominal yang mau disetor (contoh: 5jt).\nKetik /batal untuk membatalkan.') }
  let mm = t.match(/^\/(setor|tarik)(?:@\w+)?\s+(\S+)/i), flow = await kvGet(env, 'flow');
  if (mm || flow === 'setor') {
    const kind = mm ? mm[1].toLowerCase() : 'setor', amt = parseRp(mm ? mm[2] : t);
    if (!amt) return send(env, chat, `Nominalnya tidak valid. Contoh: /${kind} 5jt`);
    await kvSet(env, 'flow', null);
    try {
      const r = kind === 'setor' ? await record(env, 'setor', null, 'egi', amt, '') : await record(env, 'tarik', 'egi', null, amt, '');
      await env.DB.batch(r.st);
      return send(env, chat, `✅ <b>${kind === 'setor' ? 'Setor' : 'Tarik'} tunai berhasil</b>\n\n💵 Nominal: ${rp(amt)}\n🧾 Ref: <code>${r.ref}</code>\n🕒 ${when(r.ts)}\n\n💰 Sisa saldo: <b>${rp((await acc(env, 'egi')).balance)}</b>`);
    } catch (e) { return send(env, chat, `❌ Gagal: ${e.message}.`) }
  }
  if (t === BTN.game) return adminMessage(env, chat, '/admin', '/admin', send).then(() => adminMessage(env, chat, '/pemain', '/pemain', send));
  if (await adminMessage(env, chat, t, low, send)) return;
  return send(env, chat, 'Pilih menu di bawah ya.');
}
async function onCallback(env, q) {
  const owner = await kvGet(env, 'owner');
  if (String(q.from.id) !== owner) return tg(env, 'answerCallbackQuery', { callback_query_id: q.id, text: 'Bukan rekeningmu.', show_alert: true });
  await tg(env, 'answerCallbackQuery', { callback_query_id: q.id });
  if (q.message) await tg(env, 'editMessageReplyMarkup', { chat_id: q.message.chat.id, message_id: q.message.message_id, reply_markup: { inline_keyboard: [] } });
  const chat = q.message?.chat.id || q.from.id, d = q.data || '';
  if (d === 'cancel') return send(env, chat, 'Dibatalkan.');
  if (await adminCallback(env, chat, d, send)) return;
  const m = d.match(/^pay:(AST[A-Z2-9]{8}):([a-z0-9]+):(\d+)$/);
  if (m) return pay(env, chat, { id: m[1], sku: m[2], price: +m[3] });
}

/* ---------------- HTTP ---------------- */
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'content-type', 'Cache-Control': 'no-store' };
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json', ...CORS } });
/* Cadangan bila webhook Telegram gagal terpasang (mis. DNS Telegram error):
   cron tiap menit mencoba pasang ulang webhook; bila masih gagal, ambil pesan via getUpdates (long-poll ±50 dtk). */
async function onUpdate(env, u) {
  try { if (u.message) await onMessage(env, u.message); else if (u.callback_query) await onCallback(env, u.callback_query) } catch (e) { console.error(e) }
}
async function tgGuard(env, origin) {
  const info = await tg(env, 'getWebhookInfo', {});
  if (info.ok && info.result && info.result.url) return 'webhook';
  const a = await tg(env, 'setWebhook', { url: `${origin}/tg`, secret_token: await hookSecret(env), allowed_updates: ['message', 'callback_query'] });
  if (a.ok) return 'webhook-set';
  const end = Date.now() + 50000;
  let off = +(await kvGet(env, 'tg_off') || 0), n = 0;
  while (Date.now() < end - 3000) {
    const t = Math.max(1, Math.min(20, Math.floor((end - Date.now()) / 1000) - 3));
    const r = await tg(env, 'getUpdates', { offset: off, timeout: t, allowed_updates: ['message', 'callback_query'] });
    if (!r.ok) break;
    for (const u of r.result || []) { off = u.update_id + 1; await kvSet(env, 'tg_off', off); await onUpdate(env, u); n++ }
  }
  return 'poll:' + n + ' (' + (a.description || '') + ')';
}
const ORIGIN = 'https://aster-bank.valberryv.workers.dev';
export default {
  async scheduled(ev, env, ctx) { if (env.BOT_TOKEN && !env.TG_LOG) ctx.waitUntil(tgGuard(env, ORIGIN).then(r => console.log('tgGuard', r))) },
  async fetch(req, env) {
    const url = new URL(req.url), p = url.pathname;
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
    const om = p.match(/^\/api\/order\/(AST[A-Z2-9]{8})$/);
    if (om) {
      const o = await env.DB.prepare('SELECT id,sku,price,code,ts FROM orders WHERE id=?').bind(om[1]).first();
      return json(o ? { st: 'paid', id: o.id, sku: o.sku, p: o.price, c: o.code, t: o.ts } : { st: 'wait' });
    }
    if (p === '/api/ai' || p === '/api/ai/status') return aiRoute(req, env, url, json, hookSecret);
    if (p.startsWith('/api/') && !p.startsWith('/api/order') && !p.startsWith('/api/ai') && p !== '/api/botsale') {
      try { const r = await gameRoute(req, env, url, json); if (r) return r } catch (e) { console.error(e); return json({ ok: false, e: 'server' }, 500) }
    }
    if (p === '/api/botsale' && req.method === 'POST') { try { return await botSale(env, req) } catch (e) { console.error(e); return json({ ok: false, e: 'server' }, 500) } }
    if (p === '/tg' && req.method === 'POST') {
      if (req.headers.get('X-Telegram-Bot-Api-Secret-Token') !== await hookSecret(env)) return new Response('forbidden', { status: 403 });
      await onUpdate(env, await req.json());
      return new Response('ok');
    }
    if (p === '/setup') {
      if (url.searchParams.get('k') !== await hookSecret(env)) return new Response('forbidden', { status: 403 });
      const a = await tg(env, 'setWebhook', { url: `${url.origin}/tg`, secret_token: await hookSecret(env), allowed_updates: ['message', 'callback_query'], drop_pending_updates: true });
      const b = await tg(env, 'setMyCommands', { commands: [{ command: 'saldo', description: 'Cek saldo' }, { command: 'mutasi', description: 'Mutasi rekening' }, { command: 'setor', description: 'Setor tunai, mis. /setor 5jt' }, { command: 'tarik', description: 'Tarik tunai, mis. /tarik 500rb' }, { command: 'toko', description: 'Pemasukan HUN2 STUDIO' }, { command: 'notif', description: 'Kabar pembelian besar: /notif on|off' }, { command: 'akun', description: 'Cek/ubah akun game: /akun UID|username' }, { command: 'cari', description: 'Cari username pemain/bot' }, { command: 'pemain', description: 'Daftar pemain asli' }, { command: 'set', description: '/set UID kolom nilai' }, { command: 'gm', description: 'Jadikan/cabut GM: /gm UID|username' }, { command: 'server', description: 'Server: daftar, buka baru, reset bot' }, { command: 'hype', description: 'Tingkat hype rilis (1-10)' }, { command: 'rilis', description: 'Rilis serentak semua server' }, { command: 'resetbot', description: 'Reset bot satu server' }, { command: 'ai', description: 'Mode AI Obrolan Dunia: /ai on|off' }, { command: 'bantuan', description: 'Bantuan' }] });
      const w = await tg(env, 'getWebhookInfo', {});
      return json({ webhook: a, commands: b, info: w.result ? { url: w.result.url, pending: w.result.pending_update_count, err: w.result.last_error_message } : w });
    }
    if (env.TG_LOG && p === '/__out') { const o = globalThis.__out || []; globalThis.__out = []; return json(o) }
    return new Response(`${BANK} aktif ✅`, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
  },
};
