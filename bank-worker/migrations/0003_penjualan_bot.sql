-- penjualan top up oleh pemain bot Aster Chronicles (dilaporkan game, POST /api/botsale)
CREATE TABLE IF NOT EXISTS botsales (k TEXT PRIMARY KEY, name TEXT NOT NULL, sku TEXT NOT NULL, price INTEGER NOT NULL, ts INTEGER NOT NULL, ref TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS botsales_ts ON botsales (ts);
