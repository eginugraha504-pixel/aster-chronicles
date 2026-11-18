-- Akun GM (Game Master) untuk testing: dinyalakan/dimatikan dari Telegram (/gm). Game membuka Panel GM bila gm=1.
ALTER TABLE players ADD COLUMN gm INTEGER NOT NULL DEFAULT 0;
