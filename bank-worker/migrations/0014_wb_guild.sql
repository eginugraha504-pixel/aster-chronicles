-- Bos Dunia antar guild (22 Nov 2026): HP naga ikut kekuatan pemain asli yang bergabung.
-- j = waktu pertama bergabung di raid, c0 = CP tim saat bergabung (maks) → klien menghitung HP yang sama.
ALTER TABLE wbdmg ADD COLUMN j INTEGER NOT NULL DEFAULT 0;
ALTER TABLE wbdmg ADD COLUMN c0 INTEGER NOT NULL DEFAULT 0;
