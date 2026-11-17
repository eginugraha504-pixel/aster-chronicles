#!/usr/bin/env python3
"""Salin hasil build + source ke salinan lokal repo GitHub (eginugraha504-pixel/aster-chronicles).
Pakai: python3 tools/build.py && python3 tools/sync_repo.py [/path/repo] [--zip /path/aster-source.zip]
Lalu di folder repo: git add -A && git commit && git push.

Isi repo:  index.html (= dist/index.html, dimainkan lewat GitHub Pages) · README.md (kepala repo + README proyek)
           src/ · tools/ · docs/ · bank-worker/ · .github/ · art_src/ (HANYA skrip & data: .py .json .md — PNG mentah tidak ikut)
README repo: bagian kepala (info cara main, sampai baris '---' pertama) dipertahankan, sisanya diganti README proyek.
"""
import os,shutil,sys,zipfile
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
args=sys.argv[1:];zp=None
if '--zip' in args:i=args.index('--zip');zp=args[i+1];del args[i:i+2]
REPO=args[0] if args else os.path.join(os.path.dirname(ROOT),'aster-chronicles')
TEXT=('.py','.json','.md')
def copytree(a,b,filt=None):
    if os.path.exists(b):shutil.rmtree(b)
    for d,_,fs in os.walk(a):
        for f in fs:
            if filt and not filt(f):continue
            if '/raw' in d.replace(a,''):continue
            s=os.path.join(d,f);t=os.path.join(b,os.path.relpath(s,a));os.makedirs(os.path.dirname(t),exist_ok=True);shutil.copy2(s,t)
assert os.path.isdir(os.path.join(REPO,'.git')),'bukan repo git: '+REPO
shutil.copy2(os.path.join(ROOT,'dist','index.html'),os.path.join(REPO,'index.html'))
for d in ['src','tools','docs','bank-worker','.github']:copytree(os.path.join(ROOT,d),os.path.join(REPO,d),lambda f:not f.endswith('.pyc'))
copytree(os.path.join(ROOT,'art_src'),os.path.join(REPO,'art_src'),lambda f:f.endswith(TEXT))
old=open(os.path.join(REPO,'README.md'),encoding='utf-8').read() if os.path.exists(os.path.join(REPO,'README.md')) else ''
head=old[:old.index('---\n\n')+5] if '---\n\n' in old else ''
open(os.path.join(REPO,'README.md'),'w',encoding='utf-8').write(head+open(os.path.join(ROOT,'README.md'),encoding='utf-8').read())
print('repo diperbarui:',REPO)
if zp:
    with zipfile.ZipFile(zp,'w',zipfile.ZIP_DEFLATED) as z:
        for d,_,fs in os.walk(ROOT):
            r=os.path.relpath(d,ROOT)
            if r.startswith('dist') or '__pycache__' in r or r.startswith(os.path.join('art_src','voice','raw')):continue
            for f in fs:
                if r.startswith(os.path.join('art_src','splash')) and f.endswith('.png'):continue  # splash mentah (±60 MB) tidak ikut
                z.write(os.path.join(d,f),os.path.join(r,f))
    print('zip:',zp,os.path.getsize(zp)//1024,'KB')
