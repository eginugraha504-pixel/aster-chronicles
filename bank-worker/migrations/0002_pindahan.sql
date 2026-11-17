-- Pindahan dari bank lama di PC (buku_besar.json, 17 Nov 2026): saldo HUN2 STUDIO & pesanan yang sudah lunas
UPDATE accounts SET balance=1694000 WHERE key='hun2studio' AND balance=0;
INSERT OR IGNORE INTO orders (id,sku,price,ref,code,ts) VALUES ('ASTRUV8ZJ2A','g2',79000,'BCU26111700009','J63LC-ESAPX',1794907064646);
INSERT OR IGNORE INTO orders (id,sku,price,ref,code,ts) VALUES ('ASTG9A843VZ','g1',16000,'BCU26111700010','DBJXU-RE2E7',1794907064646);
INSERT OR IGNORE INTO orders (id,sku,price,ref,code,ts) VALUES ('ASTUKLCEA5G','g6',1599000,'BCU26111700011','TGYE6-SNYWJ',1794907064646);
