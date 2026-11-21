-- Pengumuman server (pita berjalan di beranda + baris [Sistem] di Obrolan Dunia) & rekor pertama server.
-- k = kunci unik per server (slot ★3/VIP bot, ★3 pemain, #1 CP/Arena, rekor, MVP raid) → laporan ganda diabaikan.
CREATE TABLE IF NOT EXISTS ann (id INTEGER PRIMARY KEY AUTOINCREMENT, srv INTEGER NOT NULL, k TEXT NOT NULL, ty TEXT NOT NULL, uid TEXT, name TEXT, d TEXT, ts INTEGER NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS ann_k ON ann (srv, k);
CREATE INDEX IF NOT EXISTS ann_ts ON ann (srv, ts);
