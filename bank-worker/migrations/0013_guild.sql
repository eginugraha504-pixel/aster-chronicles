-- GUILD (21 Nov 2026). Politik guild bot dihitung game lalu dikirim sebagai tick ops; server menyimpan buku besarnya.
CREATE TABLE IF NOT EXISTS guilds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  srv INTEGER NOT NULL,
  name TEXT NOT NULL,
  lead TEXT NOT NULL,              -- uid ketua
  fdr TEXT,                        -- uid pendiri
  made INTEGER NOT NULL,
  xp INTEGER NOT NULL DEFAULT 0,   -- level dihitung dari xp (G_XP)
  emb INTEGER NOT NULL DEFAULT 0,  -- lambang: warna*10 + simbol
  mode INTEGER NOT NULL DEFAULT 0, -- 0 bebas masuk · 1 lewat lamaran · 2 tertutup
  minlv INTEGER NOT NULL DEFAULT 12,
  note TEXT,
  gone INTEGER                     -- waktu bubar (NULL = aktif)
);
CREATE INDEX IF NOT EXISTS guilds_srv ON guilds(srv, gone);
-- anggota: role 3 ketua · 2 wakil (maks 2) · 1 elit (maks 5) · 0 anggota. ci = hari WIB absen terakhir (pemain asli)
CREATE TABLE IF NOT EXISTS gmem (uid TEXT PRIMARY KEY, gid INTEGER NOT NULL, role INTEGER NOT NULL DEFAULT 0, joined INTEGER NOT NULL, contrib INTEGER NOT NULL DEFAULT 0, ci INTEGER NOT NULL DEFAULT 0);
CREATE INDEX IF NOT EXISTS gmem_gid ON gmem(gid);
-- catatan peristiwa guild (berdiri, masuk, keluar, dikeluarkan, jabatan, ganti ketua, kudeta, naik level, bubar)
CREATE TABLE IF NOT EXISTS glog (id INTEGER PRIMARY KEY AUTOINCREMENT, gid INTEGER NOT NULL, ts INTEGER NOT NULL, ty TEXT NOT NULL, a TEXT, b TEXT, x TEXT);
CREATE INDEX IF NOT EXISTS glog_g ON glog(gid, id);
-- obrolan guild (pemain asli + balasan AI bot; kalimat bot biasa dibuat game, tidak disimpan)
CREATE TABLE IF NOT EXISTS gchat (id INTEGER PRIMARY KEY AUTOINCREMENT, gid INTEGER NOT NULL, uid TEXT NOT NULL, txt TEXT NOT NULL, ts INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS gchat_g ON gchat(gid, ts);
CREATE TABLE IF NOT EXISTS gapp (gid INTEGER NOT NULL, uid TEXT NOT NULL, ts INTEGER NOT NULL, PRIMARY KEY (gid, uid));
-- relasi tersembunyi pemain asli (a) ↔ bot (b): -100..100. d/dd = hari WIB & jumlah perubahan hari itu (dibatasi)
CREATE TABLE IF NOT EXISTS rel (a TEXT NOT NULL, b TEXT NOT NULL, v INTEGER NOT NULL DEFAULT 0, n INTEGER NOT NULL DEFAULT 0, ts INTEGER NOT NULL, d INTEGER NOT NULL DEFAULT 0, dd INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (a, b));
-- mosi kudeta: who menggulingkan tgt (ketua). yes/no = {uid: waktu suara masuk}; st 0 berjalan · 1 berhasil · 2 gagal
CREATE TABLE IF NOT EXISTS gvote (id INTEGER PRIMARY KEY AUTOINCREMENT, gid INTEGER NOT NULL, who TEXT NOT NULL, tgt TEXT NOT NULL, t0 INTEGER NOT NULL, t1 INTEGER NOT NULL, st INTEGER NOT NULL DEFAULT 0, yes TEXT, no TEXT, res TEXT);
CREATE INDEX IF NOT EXISTS gvote_g ON gvote(gid, st);
