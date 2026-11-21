/* =====================================================================
   MODE AI — server Claude Haiku 5.5 untuk Obrolan Dunia Aster Chronicles
   ---------------------------------------------------------------------
   POST /api/ai          {kind:'reply'|'scene', player, cands, hist, msg}
                         -> {ok, out:[{who,text,delay}]}
   GET  /api/ai/status   -> {on, model, today, limit}   (?ping=<hook> = uji panggilan sungguhan)
   Token: secret ANTHROPIC_API_KEY (GitHub secret -> wrangler secret, tidak pernah ada di kode game).
   Pengetahuan game: knowledge.js (dibuat otomatis oleh tools/gen_knowledge.mjs saat build),
   dikirim sebagai system prompt yang di-cache (prompt caching) supaya murah & cepat.
   Batas: AI_DAILY panggilan/hari (semua pengguna), 20/menit per IP. Server yang menyusun
   instruksi; game hanya mengirim data konteks berukuran terbatas.
   ===================================================================== */
import { GAME_KNOWLEDGE } from './knowledge.js';

const ROLE_TXT = `Kamu menulis isi Obrolan Dunia (world chat) game mobile gacha Aster Chronicles atas nama PEMAIN LAIN di server: manusia Indonesia biasa yang lagi main sambil rebahan/kerja/kuliah. Mereka bukan asisten, bukan NPC, bukan AI, dan tidak sopan-santun berlebihan.
GAYA CHAT GAME YANG ASLI (paling penting):
- Kebanyakan pesan SANGAT pendek: 1-6 kata. Contoh nada: "gacor bgt hari ini", "pity gw 70 anjir", "wkwkwk", "ada yg punya hilde?", "gg", "sakit mata liat cp top 1", "bentar mau makan", "lah kok gw kalah", "hoki amat lu", "otw farming 3-4".
- Huruf kecil, singkatan (yg, gk, ga, bgt, udh, klo, lg, aj, sm, gw/aku, lu/kamu), salah ketik kecil wajar, tanda baca jarang. Tiap penulis punya gaya ketik sendiri (diberikan) — patuhi.
- Pesan lebih panjang (1-2 kalimat santai) HANYA saat menjawab pertanyaan atau curhat; tetap gaya chat, bukan bahasa baku.
- Orang sering motong omongan, nanya balik, ngeledek, pamer, ngeluh gacha, nyuekin topik, typo lalu ralat ("*hilde"), atau ngomong hal di luar game (makan, ngantuk, macet, tugas).
- DILARANG nada formal/robot: jangan "Benar, ...", "Semoga ...", "Tentu ...", "Selamat ...!", jangan kalimat lengkap rapi seperti artikel, jangan menyimpulkan obrolan, jangan saling memuji sopan.
Data akun tiap penulis itu asli: pakai bila relevan (hero, pity, CP, tahap), jangan mengarang angka lain. Soal pemain manusia (PEMAIN / pemain asli lain): tanggapi seperti teman satu server; sesekali boleh terasa "kok tau", jangan menyeramkan.
ATURAN KERAS: fakta game harus benar sesuai pengetahuan di bawah; jangan mengarang fitur; tanpa emoji (emotikon teks seperti :v xD T_T boleh); tanpa tautan; ramah keluarga; tidak menyebut orang nyata, merek, atau politik; tidak pernah mengaku AI/bot; hanya penulis dari daftar yang boleh bicara. Balas HANYA JSON yang diminta.`;

const clip = (s, n) => String(s ?? '').replace(/[\u0000-\u001f]/g, ' ').slice(0, n);
export const dayKey = () => 'ai:' + new Date(Date.now() + 7 * 36e5).toISOString().slice(0, 10);

export function buildUser(b) {
  const P = b.player || {}, cands = (Array.isArray(b.cands) ? b.cands : []).slice(0, 10), hist = (Array.isArray(b.hist) ? b.hist : []).slice(-24);
  const acts = (Array.isArray(P.acts) ? P.acts : []).slice(-12);
  const ctx = `WAKTU: ${clip(b.when, 60)} WIB · ${clip(b.online, 8)} pemain online · server: ${clip(b.world, 600)}
PEMAIN (manusia yang membaca chat): ${clip(P.name, 16)} — ${clip(P.info, 900)}
Aktivitas terbaru PEMAIN: ${acts.length ? acts.map(a => clip(a, 140)).join(' | ') : '-'}
Sedang membuka layar: ${clip(P.screen, 40) || '-'}
${b.humans ? `PEMAIN ASLI LAIN yang online (manusia sungguhan, boleh disapa/ditanggapi bila mereka bicara): ${clip(b.humans, 300)}
` : ''}PENULIS YANG SEDANG ONLINE (data asli mereka):
${cands.map(c => `- ${clip(c.name, 16)}: ${clip(c.desc, 420)}${c.style ? ` || GAYA KETIK: ${clip(c.style, 200)}` : ''}`).join('\n')}
OBROLAN TERAKHIR (lama -> baru):
${hist.map(h => clip(h, 180)).join('\n') || '(sepi)'}`;
  if (b.kind === 'reply') return ctx + `

PESAN BARU dari ${clip(P.name, 16)}: "${clip(b.msg, 120)}"
Tulis 1-4 pesan balasan dari 1-3 penulis yang paling wajar menanggapi (yang disebut namanya sebaiknya menjawab). Kalau itu pertanyaan, jawab benar tapi tetap gaya chat (boleh 1-2 kalimat santai, boleh dipecah jadi beberapa pesan); kalau sapaan/candaan, balas super singkat. Boleh @${clip(P.name, 16)}. delay = detik mengetik 2-12.
JSON: {"out":[{"who":"nama","text":"...","delay":5}]}`;
  return ctx + `

Tulis KELANJUTAN obrolan dunia: ${b.n || '4-8'} pesan dari 2-5 penulis di daftar, kebanyakan super pendek, saling sambar seperti grup chat game sungguhan; lanjutkan obrolan terakhir atau mulai topik receh baru dari keadaan mereka/jam sekarang/kejadian server. Jangan semua orang ikut menjawab hal yang sama. ${acts.length ? `Sesekali (tidak wajib) singgung PEMAIN berdasarkan aktivitasnya secara wajar.` : ''} delay = detik sejak pesan sebelumnya 3-40.
JSON: {"out":[{"who":"nama","text":"...","delay":8}]}`;
}

export async function callClaude(env, user, maxTok, role) {
  if (env.AI_FAKE) {   // uji lokal tanpa token: balasan tiruan dari daftar penulis
    if (env.TG_LOG) { (globalThis.__ai ||= []).push(user); if (globalThis.__ai.length > 20) globalThis.__ai.shift() }   // uji lokal: /__ai menampilkan prompt
    const names = [...user.matchAll(/^- ([A-Za-z0-9]+):/gm)].map(m => m[1]), last = [...user.matchAll(/^#(\d+) /gm)].map(m => +m[1]).pop() || null;
    return { text: JSON.stringify({ out: names.slice(0, 4).map((n, k) => ({ who: n, text: k === 3 ? '' : ['ada yg udh pull banner baru?', 'masih nabung wkwk', 'barusan clear 2-3'][k], stk: k === 3 ? 'sakuya_wkwk' : '', re: k === 1 ? last : null, delay: 2 })) }), usage: {}, model: 'fake' };
  }
  const key = env.ANTHROPIC_API_KEY, model = env.AI_MODEL || 'claude-haiku-5-5';
  const body = JSON.stringify({ model, max_tokens: maxTok, temperature: 1, thinking: { type: 'disabled' },
    system: [{ type: 'text', text: role || ROLE_TXT }, { type: 'text', text: GAME_KNOWLEDGE, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: user }] });
  const go = h => fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'content-type': 'application/json', 'anthropic-version': '2023-06-01', ...h }, body });
  // kunci API biasa memakai x-api-key; jenis token lain dicoba lewat Authorization Bearer
  let r = await go({ 'x-api-key': key });
  if ((r.status === 401 || r.status === 403) && !key.startsWith('sk-ant-api')) r = await go({ authorization: `Bearer ${key}`, 'anthropic-beta': 'oauth-2025-04-20' });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j?.error?.message || ('HTTP ' + r.status)), { status: r.status });
  const text = (j.content || []).filter(c => c.type === 'text').map(c => c.text).join('');
  return { text, usage: j.usage, model: j.model };
}
export function parseOut(text) {
  const m = String(text).match(/\{[\s\S]*\}/);
  let o = null; try { o = m ? JSON.parse(m[0]) : null } catch (e) { }
  const L = o && (o.out || o.replies || o.msgs) || [];
  return L.map(x => ({ who: clip(x.who, 20), text: clip(x.text, 260).replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '').replace(/https?\S+/g, '').trim(), delay: Math.max(1, Math.min(60, +x.delay || 5)) }))
    .filter(x => x.who && x.text).slice(0, 12);
}
export async function bump(env, k, by = 1) {
  const r = await env.DB.prepare("INSERT INTO kv (k,v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = CAST(v AS INTEGER) + ? RETURNING v").bind(k, String(by), by).first();
  return +(r?.v || by);
}

export async function aiRoute(req, env, url, json, hookSecret) {
  const limit = +(env.AI_DAILY || 2000);
  if (url.pathname === '/api/ai/status') {
    const today = +((await env.DB.prepare('SELECT v FROM kv WHERE k=?').bind(dayKey()).first())?.v || 0);
    const st = { on: !!env.ANTHROPIC_API_KEY, model: env.AI_MODEL || 'claude-haiku-5-5', today, limit, knowledge: GAME_KNOWLEDGE.length };
    if (url.searchParams.get('ping') && url.searchParams.get('ping') === await hookSecret(env) && env.ANTHROPIC_API_KEY) {
      try { const r = await callClaude(env, 'Balas JSON {"out":[{"who":"tes","text":"halo","delay":1}]}', 60); st.ping = 'ok'; st.usage = r.usage; st.served = r.model } catch (e) { st.ping = 'gagal: ' + e.message }
    }
    return json(st);
  }
  if (req.method !== 'POST') return json({ ok: false, e: 'method' }, 405);
  if (!env.ANTHROPIC_API_KEY) return json({ ok: false, e: 'off' }, 503);
  const ip = req.headers.get('cf-connecting-ip') || 'x', minute = Math.floor(Date.now() / 6e4);
  if (Math.random() < .03) aiCleanup(env).catch(() => { });
  if (await bump(env, `aip:${minute}:${ip}`) > 20) return json({ ok: false, e: 'rate' }, 429);
  if (await bump(env, dayKey()) > limit) return json({ ok: false, e: 'quota' }, 429);
  let b; try { b = JSON.parse(await req.text()) } catch (e) { return json({ ok: false, e: 'json' }, 400) }
  if (!['reply', 'scene'].includes(b.kind) || !Array.isArray(b.cands) || !b.cands.length) return json({ ok: false, e: 'bad' }, 400);
  try {
    const r = await callClaude(env, buildUser(b), b.kind === 'reply' ? 400 : 700);
    const names = new Set(b.cands.map(c => String(c.name).toLowerCase()));
    return json({ ok: true, out: parseOut(r.text).filter(x => names.has(x.who.toLowerCase())), usage: r.usage });
  } catch (e) { console.error(e); return json({ ok: false, e: 'ai', m: String(e.message).slice(0, 160) }, e.status === 429 ? 429 : 502) }
}
// bersih-bersih penghitung per menit (dipanggil sesekali)
export const aiCleanup = env => env.DB.prepare("DELETE FROM kv WHERE k >= 'aip:' AND k < ?").bind('aip:' + (Math.floor(Date.now() / 6e4) - 5)).run();
