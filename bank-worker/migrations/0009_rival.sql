-- Rival abadi: usaha ekstra bot rival (progres tambahan dP, terwujud selama sesi main t0..t1). Dibagikan ke semua pemain lewat /api/world.
CREATE TABLE IF NOT EXISTS rvb (id INTEGER PRIMARY KEY AUTOINCREMENT, gen INTEGER NOT NULL, bot INTEGER NOT NULL, t0 INTEGER NOT NULL, t1 INTEGER NOT NULL, dp REAL NOT NULL, uid TEXT NOT NULL, ts INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS rvb_gen ON rvb(gen, bot);
