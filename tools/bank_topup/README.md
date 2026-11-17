# Top Up Aster Chronicles lewat Bank Central Universe

Sisi bot dari fitur Top Up (sisi game: `src/js/data/topup.js`, `systems/topup.js`, `ui/topup.js`).

## Alur
1. Game membuat pesanan `ASTxxxxxxxx` untuk satu paket (`g1`–`g6`, `mc`) dan membuka deep link
   `https://t.me/<bot_bank>?start=aster-<ID>-<paket>-<harga>` (atau pemain mengetik `/topup <ID> <paket> <harga>`).
2. Bot bank: `aster_topup.parse(teks)` → tampilkan `invoice_text()` + tombol ✅ Bayar / ❌ Batal.
3. ✅ Bayar: cek saldo rekening `egi`, catat mutasi `egi → hun2studio` (jenis `bayar`, catatan "Aster Chronicles: <paket> <ID>"),
   tolak bila ID pesanan yang sama sudah pernah dibayar, lalu balas `receipt_text()` yang berisi kode voucher.
4. Pemain menempel kode di game. Game menghitung ulang `HMAC(secret, "ID|paket|harga")`; kode cocok = permata masuk.

## Yang harus sama di kedua sisi
- `ASTER_SECRET` (bot) = `TOPUP_CFG.secret` (game)
- `CATALOG` (bot) = harga di `TOPUP_CFG.packs` & `TOPUP_CFG.card` (game)

## Pemasangan di bot
`aster_topup.py` diletakkan di folder bot. Handler di `bank.py` (BankLogic) dipasang menyesuaikan struktur bank yang sedang dipakai
(rekening merchant `hun2studio` dibuat otomatis bila belum ada). Uji: `python aster_topup.py ASTABCDEFGH g3 249000` → `3UNMX-CBJ8V`.
