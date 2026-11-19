-- Server (seperti game pada umumnya): tiap server punya dunia bot sendiri (maks 2.000 pemain), akun terikat ke satu server.
-- worlds = JSON [{g:gen,e:epoch,cap}] — dunia pertama milik server itu; dunia server lain yang DIGABUNG ditambahkan di belakang.
CREATE TABLE IF NOT EXISTS servers (id INTEGER PRIMARY KEY, name TEXT NOT NULL, opened INTEGER NOT NULL, merged INTEGER, worlds TEXT NOT NULL);
ALTER TABLE players ADD COLUMN srv INTEGER NOT NULL DEFAULT 1;   -- server pemain asli
ALTER TABLE players ADD COLUMN bw INTEGER;                       -- dunia (gen) asal akun bot
DROP INDEX IF EXISTS players_bot;                                -- indeks bot sekarang unik per dunia
CREATE UNIQUE INDEX IF NOT EXISTS players_bw ON players(bw, bot) WHERE bot IS NOT NULL;
ALTER TABLE wchat ADD COLUMN srv INTEGER NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS wchat_srv ON wchat(srv, ts);
