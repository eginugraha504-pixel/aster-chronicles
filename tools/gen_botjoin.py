#!/usr/bin/env python3
"""Membuat bank-worker/src/botjoin.js dari src/js/systems/bots.js (dipanggil tools/build.py).

Kurva bergabungnya bot (kapan bot ke-i masuk server) dipakai DUA tempat: game (dunia bot) dan server
(membuat akun bot tepat waktu). Dulu ditulis dua kali "sama persis"; sekarang server memakai salinan
otomatis ini, jadi cukup ubah src/js/systems/bots.js lalu build.
"""
import os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NAMES = ['bRng', 'wEff', 'wRng', 'wDyn', 'wE2', 'wJoinN', 'botJoinDaysW', 'botJoinWarp']

def grab(src, name):
    m = re.search(r'(?m)^function ' + re.escape(name) + r'\(', src)
    if not m: raise SystemExit('gen_botjoin: fungsi ' + name + ' tidak ditemukan di systems/bots.js')
    i = src.index('{', m.end() - 1); d = 0; j = i; q = None
    while True:
        c = src[j]
        if q:
            if c == '\\': j += 2; continue
            if c == q: q = None
        elif c in '\'"`': q = c
        elif c == '{': d += 1
        elif c == '}':
            d -= 1
            if d == 0: break
        j += 1
    return src[m.start():j + 1]

src = open(os.path.join(ROOT, 'src', 'js', 'systems', 'bots.js'), encoding='utf-8').read()
body = '\n'.join(grab(src, n) for n in NAMES)
out = ('// DIBUAT OTOMATIS oleh tools/gen_botjoin.py dari src/js/systems/bots.js — JANGAN DIEDIT DI SINI.\n'
       '// Kurva bergabung bot per dunia (sama persis dengan game karena kodenya sama).\n'
       "import { BOTCFG as BOT_CFG } from './botcfg.js';\n"
       'const BDAY = 864e5;\n' + body + '\nexport { ' + ', '.join(NAMES) + ' };\n')
p = os.path.join(ROOT, 'bank-worker', 'src', 'botjoin.js')
old = open(p, encoding='utf-8').read() if os.path.exists(p) else ''
if old != out: open(p, 'w', encoding='utf-8').write(out)
print('botjoin.js', len(out), 'byte', '(diperbarui)' if old != out else '(sama)')
