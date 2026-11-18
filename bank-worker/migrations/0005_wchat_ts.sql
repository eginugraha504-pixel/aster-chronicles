-- Obrolan Dunia: pesan bisa dijadwalkan (adegan AI ditulis dengan jeda mengetik) -> dibaca berdasarkan waktu
CREATE INDEX IF NOT EXISTS wchat_ts ON wchat (ts);
