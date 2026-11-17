"""Aster Chronicles × Bank Central Universe — pembayaran top up (pura-pura).

Taruh file ini di folder bot (sebelah bank.py). Bot bank memakai fungsi di sini untuk:
  1. membaca tagihan dari game:  deep link /start aster-<ID>-<paket>-<harga>  atau  /topup <ID> <paket> <harga>
  2. menampilkan tagihan (paket, harga, penerima HUN2 STUDIO) dengan tombol ✅ Bayar / ❌ Batal
  3. setelah dibayar: memotong saldo, mencatat mutasi, dan membalas KODE VOUCHER untuk ditempel di game.

Kode voucher = HMAC-SHA256(ASTER_SECRET, "ID|paket|harga") -> base32 (tanpa I O 0 1) 10 huruf, format XXXXX-XXXXX.
ASTER_SECRET HARUS sama dengan TOPUP_CFG.secret di game (src/js/data/topup.js).
"""
import hashlib, hmac, json, re, threading, time, urllib.request

ASTER_SECRET = "HUN2-aster-7Qm4Xc9TzR2kLw8B"
MERCHANT_KEY = "hun2studio"          # kunci rekening merchant di buku besar
MERCHANT_NAME = "HUN2 STUDIO"
B32 = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

# Katalog harus sama dengan TOPUP_CFG di game (harga dicek supaya tagihan tidak bisa diubah sembarangan)
CATALOG = {
    "g1": ("120 Permata", 16000),
    "g2": ("600 Permata", 79000),
    "g3": ("1.960 Permata", 249000),
    "g4": ("3.960 Permata", 479000),
    "g5": ("6.560 Permata", 799000),
    "g6": ("12.960 Permata", 1599000),
    "mc": ("Kartu Bulanan (30 hari)", 79000),
}
_ID = re.compile(r"^AST[A-Z2-9]{8}$")

# Pengiriman otomatis ke game: bukti bayar dikirim ke topik ntfy.sh (layanan notifikasi gratis, tanpa akun).
# Game yang sedang menunggu pembayaran membaca topik ini lalu memasukkan permata sendiri (kode voucher tetap dicek).
# Nama topik diturunkan dari ASTER_SECRET, jadi game & bot otomatis memakai topik yang sama.
NTFY_URL = "https://ntfy.sh"
NTFY_TOPIC = "aster-" + hmac.new(ASTER_SECRET.encode(), b"ntfy-topic", hashlib.sha256).hexdigest()[:24]


def code_for(order_id: str, sku: str, price: int) -> str:
    mac = hmac.new(ASTER_SECRET.encode(), f"{order_id}|{sku}|{int(price)}".encode(), hashlib.sha256).digest()
    bits = val = 0
    out = ""
    for b in mac:
        val = (val << 8) | b
        bits += 8
        while bits >= 5 and len(out) < 10:
            out += B32[(val >> (bits - 5)) & 31]
            bits -= 5
        if len(out) >= 10:
            break
    return out[:5] + "-" + out[5:]


def push_paid(order_id: str, sku: str, price: int, log=None):
    """Kirim bukti bayar ke game (di thread terpisah supaya bot tidak tertahan). Gagal = pemain tetap bisa tempel kode."""
    body = json.dumps({"o": order_id, "s": sku, "p": int(price), "c": code_for(order_id, sku, price)}).encode()

    def run():
        for i in range(3):
            try:
                req = urllib.request.Request(f"{NTFY_URL}/{NTFY_TOPIC}", data=body, method="POST",
                                             headers={"Title": "Aster Chronicles top up", "Content-Type": "application/json"})
                urllib.request.urlopen(req, timeout=10).read()
                return
            except Exception as e:  # noqa: BLE001
                if log:
                    log.warning("Top up %s belum terkirim ke game (%s), coba lagi...", order_id, e)
                time.sleep(2 + i * 3)
    threading.Thread(target=run, daemon=True).start()


def parse(text: str):
    """'/start aster-ASTXXXXXXXX-g3-249000' atau '/topup ASTXXXXXXXX g3 249000' -> (id, sku, harga) atau None"""
    t = (text or "").strip()
    m = re.match(r"^/start\s+aster-(AST[A-Z2-9]{8})-([a-z0-9]+)-(\d+)$", t) or \
        re.match(r"^/topup(?:@\w+)?\s+(AST[A-Z2-9]{8})\s+([a-z0-9]+)\s+(\d+)$", t, re.I)
    if not m:
        return None
    oid, sku, price = m.group(1).upper(), m.group(2).lower(), int(m.group(3))
    if not _ID.match(oid) or sku not in CATALOG or CATALOG[sku][1] != price:
        return None
    return oid, sku, price


def fmt_rp(n: int) -> str:
    return "Rp" + f"{int(n):,}".replace(",", ".")


def invoice_text(oid, sku, price):
    name, _ = CATALOG[sku]
    return (f"🎮 <b>Tagihan Aster Chronicles</b>\n\n"
            f"🛒 {name}\n🏷️ ID Pesanan: <code>{oid}</code>\n🏢 Penerima: {MERCHANT_NAME}\n\n"
            f"💳 Total: <b>{fmt_rp(price)}</b>")


def receipt_text(oid, sku, price, ref, saldo):
    name, _ = CATALOG[sku]
    return (f"✅ <b>Pembayaran berhasil</b>\n\n🛒 {name}\n🏷️ {oid}\n💳 {fmt_rp(price)} ke {MERCHANT_NAME}\n🧾 Ref: <code>{ref}</code>\n\n"
            f"🎟️ Kode voucher (ketuk untuk menyalin):\n<code>{code_for(oid, sku, price)}</code>\n\n"
            f"⚡ Permata masuk otomatis begitu kamu kembali ke game. Kalau belum masuk, tempel kode ini di tagihan pesanan.\n"
            f"💰 Sisa saldo: <b>{fmt_rp(saldo)}</b>")


if __name__ == "__main__":   # uji cepat: python aster_topup.py ASTABCDEFGH g3 249000
    import sys
    a = sys.argv[1:] or ["ASTABCDEFGH", "g3", "249000"]
    print(code_for(a[0], a[1], int(a[2])), NTFY_TOPIC)
