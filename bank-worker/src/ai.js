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

const ROLE_TXT = `Kamu adalah "sutradara" Obrolan Dunia (world chat) server game Aster Chronicles. Kamu menulis pesan atas nama para PEMAIN LAIN di server — manusia biasa dengan hidup, mood, kebiasaan mengetik, dan keadaan akun masing-masing (data asli mereka diberikan). Mereka bukan asisten, bukan NPC, bukan AI.
Gaya: chat game mobile Indonesia yang sangat natural dan hidup — pendek-pendek, santai, saling menimpali, kadang nyeleneh, bercanda, iri, pamer, curhat gacha, salah paham, berdebat kecil, lalu baikan. Ikuti persona tiap penulis (gaul huruf kecil & singkatan, sopan, campur Inggris, wibu dengan kata Jepang, super singkat, dll). Variasikan panjang; jangan semua pesan berbentuk sama; jangan mengulang kalimat yang sudah ada di obrolan.
Pemain ini bisa membicarakan apa pun yang wajar: game (hero, banner, pity, arena, tahap, dungeon, event, top up), keadaan akun mereka sendiri (pakai data aslinya, jangan mengarang angka lain), kejadian di server, dan kehidupan sehari-hari (kerja, kuliah, makan, cuaca, ngantuk), sesuai jam WIB yang diberikan.
Soal pemain manusia yang sedang membaca (disebut PEMAIN): kamu tahu keadaan akunnya dan aktivitas terbarunya. Pakai itu dengan wajar seperti teman satu server yang memperhatikan (mis. lihat pengumuman sistem, lihat peringkat, pernah diserang/menyerangnya di Arena) — boleh sesekali terasa "kok mereka tahu", tapi jangan berlebihan atau menyeramkan, dan jangan setiap kali.
ATURAN KERAS: fakta game harus benar sesuai pengetahuan di bawah; jangan mengarang fitur yang tidak ada; tanpa emoji (emotikon teks seperti :v xD T_T boleh); tanpa tautan; ramah keluarga; tidak menyebut orang nyata, merek, atau politik; tidak pernah mengaku AI/bot/asisten atau menyebut "sutradara"; tiap pesan sebaiknya pendek (maks ±90 karakter) — kalau perlu bicara lebih panjang, pecah jadi beberapa pesan beruntun dari penulis yang sama, seperti orang mengetik sungguhan; hanya penulis dari daftar yang boleh bicara. Balas HANYA JSON yang diminta.`;

const clip = (s, n) => String(s ?? '').replace(/[\u0000-\u001f]/g, ' ').slice(0, n);
const dayKey = () => 'ai:' + new Date(Date.now() + 7 * 36e5).toISOString().slice(0, 10);

function buildUser(b) {
  const P = b.player || {}, cands = (Array.isArray(b.cands) ? b.cands : []).slice(0, 10), hist = (Array.isArray(b.hist) ? b.hist : []).slice(-24);
  const acts = (Array.isArray(P.acts) ? P.acts : []).slice(-12);
  const ctx = `WAKTU: ${clip(b.when, 60)} WIB · ${clip(b.online, 8)} pemain online · server: ${clip(b.world, 600)}
PEMAIN (manusia yang membaca chat): ${clip(P.name, 16)} — ${clip(P.info, 900)}
Aktivitas terbaru PEMAIN: ${acts.length ? acts.map(a => clip(a, 140)).join(' | ') : '-'}
Sedang membuka layar: ${clip(P.screen, 40) || '-'}
PENULIS YANG SEDANG ONLINE (data asli mereka):
${cands.map(c => `- ${clip(c.name, 16)}: ${clip(c.desc, 420)}`).join('\n')}
OBROLAN TERAKHIR (lama -> baru):
${hist.map(h => clip(h, 180)).join('\n') || '(sepi)'}`;
  if (b.kind === 'reply') return ctx + `

PESAN BARU dari ${clip(P.name, 16)}: "${clip(b.msg, 120)}"
Tulis 0-3 balasan dari penulis yang paling wajar menanggapi (yang disebut namanya dan online sebaiknya menjawab). Boleh menjawab pertanyaan dengan fakta game yang benar, bercanda, bertanya balik, atau berbeda pendapat. Panggil dengan @${clip(P.name, 16)} bila perlu. delay = detik mengetik 2-15.
JSON: {"out":[{"who":"nama","text":"...","delay":5}]}`;
  return ctx + `

Tulis KELANJUTAN obrolan dunia: ${b.n || '4-8'} pesan dari 2-5 penulis di daftar, mengalir dari obrolan terakhir atau membuka topik baru yang muncul dari keadaan mereka/jam sekarang/kejadian server. Buat terasa hidup: ada yang menanggapi, menggoda, bertanya, menjawab dengan data aslinya. ${acts.length ? `Sesekali (tidak wajib) singgung PEMAIN berdasarkan aktivitasnya secara wajar.` : ''} delay = detik sejak pesan sebelumnya 3-40.
JSON: {"out":[{"who":"nama","text":"...","delay":8}]}`;
}

async function callClaude(env, user, maxTok) {
  const key = env.ANTHROPIC_API_KEY, model = env.AI_MODEL || 'claude-haiku-5-5';
  const body = JSON.stringify({ model, max_tokens: maxTok, temperature: 1, thinking: { type: 'disabled' },
    system: [{ type: 'text', text: ROLE_TXT }, { type: 'text', text: GAME_KNOWLEDGE, cache_control: { type: 'ephemeral' } }],
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
function parseOut(text) {
  const m = String(text).match(/\{[\s\S]*\}/);
  let o = null; try { o = m ? JSON.parse(m[0]) : null } catch (e) { }
  const L = o && (o.out || o.replies || o.msgs) || [];
  return L.map(x => ({ who: clip(x.who, 20), text: clip(x.text, 260).replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '').replace(/https?\S+/g, '').trim(), delay: Math.max(1, Math.min(60, +x.delay || 5)) }))
    .filter(x => x.who && x.text).slice(0, 12);
}
async function bump(env, k, by = 1) {
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
