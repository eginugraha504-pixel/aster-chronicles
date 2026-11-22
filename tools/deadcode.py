#!/usr/bin/env python3
"""Pencari kode mati untuk game (skrip non-modul yang digabung jadi satu index.html).

Semua file di manifest berbagi satu ruang nama global. Alat ini mencari fungsi/konstanta tingkat atas yang
TIDAK PERNAH dipakai dari mana pun (termasuk string HTML onclick / data-act / ACT.x), lalu menelusuri:
yang hanya dipakai oleh kode mati ikut dianggap mati.

Pakai:  python3 tools/deadcode.py [file.js ...]     (tanpa argumen: semua file di src/manifest.txt)
Hasil hanya saran — periksa dulu sebelum menghapus (pemanggilan lewat nama dinamis tidak terdeteksi).
"""
import os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src')
man = [l.strip() for l in open(os.path.join(SRC, 'manifest.txt')) if l.strip().endswith('.js') and not l.startswith('#')]
files = {f: open(os.path.join(SRC, f), encoding='utf-8').read() for f in man if os.path.exists(os.path.join(SRC, f))}
extra = ''.join(open(os.path.join(SRC, f), encoding='utf-8').read() for f in os.listdir(SRC) if f.endswith('.html'))
DEF = re.compile(r'(?m)^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(|^(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=')

def stmt_end(src, i, fn):
    """akhir pernyataan tingkat atas yang mulai di i (fungsi: kurung kurawal penutup; const: ';' / baris baru di kedalaman 0)."""
    d = 0; n = len(src); seen = False; q = None; tpl = []   # tpl: kedalaman saat masuk ${ di dalam template literal
    while i < n:
        c = src[i]
        if q:
            if c == '\\': i += 2; continue
            if q == '`' and c == '$' and i + 1 < n and src[i + 1] == '{': tpl.append(d); d += 1; q = None; i += 2; continue
            if c == q: q = None
            i += 1; continue
        if c == '}' and tpl and d - 1 == tpl[-1]: tpl.pop(); d -= 1; q = '`'; i += 1; continue
        if c in '\'"`': q = c
        elif c == '/' and i + 1 < n and src[i + 1] == '/': j = src.find('\n', i); i = n if j < 0 else j; continue
        elif c == '/' and i + 1 < n and src[i + 1] == '*': j = src.find('*/', i + 2); i = n if j < 0 else j + 2; continue
        elif c == '/':   # literal regex: '/' setelah operator / pembuka (bukan pembagian)
            k = i - 1
            while k >= 0 and src[k] in ' \t': k -= 1
            if k < 0 or src[k] in '(,=:[!&|?{};+-*%<>~^\n' or src[k - 5:k + 1] == 'return':
                j = i + 1; cls = False
                while j < n and src[j] != '\n':
                    if src[j] == '\\': j += 2; continue
                    if src[j] == '[': cls = True
                    elif src[j] == ']': cls = False
                    elif src[j] == '/' and not cls: break
                    j += 1
                i = j + 1; continue
        elif c in '([{': d += 1; seen = seen or c == '{'
        elif c in ')]}':
            d -= 1
            if fn and d == 0 and c == '}' and seen: return i + 1
        elif not fn and d == 0 and c in ';\n': return i + 1
        i += 1
    return n

def body_spans(src):
    """(nama, awal, akhir) tiap definisi tingkat atas."""
    out = []
    for m in DEF.finditer(src):
        out.append((m.group(1) or m.group(2), m.start(), stmt_end(src, m.end() - (1 if m.group(1) else 0), bool(m.group(1)))))
    return out

defs = {}  # nama -> [(file, awal, akhir), ...] (nama sama bisa muncul di beberapa tempat, mis. fungsi lokal di kolom 0)
for f, s in files.items():
    for n, a, z in body_spans(s): defs.setdefault(n, []).append((f, a, z))
# kode tingkat atas yang bukan definisi (pemanggilan langsung, setInterval, ACT={...}) = akar
roots_txt = extra
for f, s in files.items():
    sp = body_spans(s); last = 0
    for n, a, z in sp: roots_txt += s[last:a]; last = z
    roots_txt += s[last:]
words = lambda t: set(re.findall(r'[A-Za-z_$][\w$]*', t))
uses = {n: set().union(*(words(files[f][a:z]) for f, a, z in L)) - {n} for n, L in defs.items()}
# objek ACT/handler: properti di dalam objek yang dipanggil dari HTML lewat data-act → anggap semua definisi bernama ACT dsb. akar
alive = set(); stack = [n for n in words(roots_txt) if n in defs]
for n in ('ACT', 'ICON', 'I18N', 'S'):
    if n in defs: stack.append(n)
while stack:
    n = stack.pop()
    if n in alive: continue
    alive.add(n)
    stack.extend(u for u in uses.get(n, ()) if u in defs and u not in alive)
want = set(sys.argv[1:])
dead = [(L[0][0], n, sum(z - a for _, a, z in L)) for n, L in defs.items() if n not in alive and (not want or L[0][0] in want or os.path.basename(L[0][0]) in want)]
dead.sort()
tot = 0
for f, n, sz in dead: print(f'{f:38s} {n:28s} {sz:6d} b'); tot += sz
print(f'-- {len(dead)} definisi tidak terpakai, ±{tot} byte')
if os.environ.get('WHY'):
    t = os.environ['WHY']; print('akar langsung:', t in words(roots_txt))
    print('dipakai oleh:', sorted(n for n, u in uses.items() if t in u and n in alive)[:20])
