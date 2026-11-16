#!/usr/bin/env python3
"""Buat ulang subset font Jepang (M PLUS Rounded 1c ExtraBold) dari huruf yang dipakai src/js/lang/ja.js.
Perlu: pip install fonttools brotli ; npm pack @fontsource/m-plus-rounded-1c (ekstrak ke folder FONTSRC).
Pakai: python3 tools/subset_ja.py /path/ke/fontsource-m-plus-rounded-1c/package/files
Lalu jalankan tools/build.py."""
import glob,os,re,sys
from fontTools.ttLib import TTFont
from fontTools import subset
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));SRC=os.path.join(ROOT,'src')
files=sys.argv[1]
need=set(ord(c) for c in open(os.path.join(SRC,'js/lang/ja.js'),encoding='utf-8').read() if ord(c)>0x2000)
for f in glob.glob(os.path.join(SRC,'fonts/mpr-ja-*.woff2')):os.remove(f)
covered=set();rules=[];k=0
for f in sorted(glob.glob(os.path.join(files,'m-plus-rounded-1c-*-800-normal.woff2'))):
    if not re.search(r'-\d+-800-normal',f):continue
    hit=(need&set(TTFont(f).getBestCmap().keys()))-covered
    if not hit:continue
    o=subset.Options();o.flavor='woff2';fn=TTFont(f);s=subset.Subsetter(o);s.populate(unicodes=hit);s.subset(fn);fn.flavor='woff2'
    out=f'fonts/mpr-ja-800-{k}.woff2';fn.save(os.path.join(SRC,out));covered|=hit;k+=1
    cps=sorted(hit);rng=[];a=p=cps[0]
    for c in cps[1:]+[None]:
        if c is not None and c==p+1:p=c;continue
        rng.append(f'U+{a:X}' if a==p else f'U+{a:X}-{p:X}')
        if c is not None:a=p=c
    rules.append(f"@font-face{{font-family:'Aster JP';font-weight:400 900;font-display:block;src:url({out}) format('woff2');unicode-range:{','.join(rng)}}}")
css=open(os.path.join(SRC,'css/fonts.css'),encoding='utf-8').read()
css=css[:css.index('/* Jepang:')] if '/* Jepang:' in css else css
css+="/* Jepang: M PLUS Rounded 1c ExtraBold, di-subset hanya ke huruf yang dipakai js/lang/ja.js\n   (tambah teks Jepang baru? jalankan tools/subset_ja.py) */\n"+"\n".join(rules)+"\n"
open(os.path.join(SRC,'css/fonts.css'),'w',encoding='utf-8').write(css)
print(k,'file subset;','huruf tak ditemukan:',''.join(chr(c) for c in need-covered))
