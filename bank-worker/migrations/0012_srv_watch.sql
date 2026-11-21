-- Kelola server dari Telegram: server boleh "terdaftar saja" (belum rilis: opened=0, worlds=[]); wp = persen whaler yang dipakai saat dirilis.
ALTER TABLE servers ADD COLUMN wp REAL;
-- Akun penonton (dashboard papan peringkat semua server, hanya lihat). srv=0, tidak tampil di papan / pencarian mana pun.
ALTER TABLE players ADD COLUMN watch INTEGER NOT NULL DEFAULT 0;
