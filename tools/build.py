#!/usr/bin/env python3
"""Aster Chronicles — build: menggabungkan src/ menjadi satu file dist/index.html.
Pakai: python3 tools/build.py   (urutan file JS diatur di src/manifest.txt)"""
import os,re,sys,base64
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC=os.path.join(ROOT,'src')
def read(p): return open(os.path.join(SRC,p),encoding='utf-8').read()
man=[l.strip() for l in read('manifest.txt').splitlines() if l.strip() and not l.strip().startswith('#')]
css=[p for p in man if p.endswith('.css')]; js=[p for p in man if p.endswith('.js')]
missing=[p for p in man if not os.path.exists(os.path.join(SRC,p))]
if missing: sys.exit('File tidak ditemukan: '+', '.join(missing))
shell=read('index.html')
def inline_fonts(t):
    def rep(m):
        b=open(os.path.join(SRC,m.group(1)),'rb').read()
        return 'url(data:font/woff2;base64,'+base64.b64encode(b).decode()+')'
    return re.sub(r'url\((fonts/[^)]+\.woff2)\)',rep,t)
# skin UI (src/img/ui/<nama>.webp) -> variabel CSS --ui-<nama> (sekali saja, dipakai berkali-kali di css/skin.css)
UID=os.path.join(SRC,'img','ui')
uivars=''.join(f"--ui-{f[:-5].replace('_','-')}:url(data:image/webp;base64,{base64.b64encode(open(os.path.join(UID,f),'rb').read()).decode()});" for f in sorted(os.listdir(UID)) if f.endswith('.webp')) if os.path.isdir(UID) else ''
cssb='<style>\n'+(':root{'+uivars+'}\n' if uivars else '')+'\n'.join(f'/* ==== {p} ==== */\n'+inline_fonts(read(p)) for p in css)+'</style>'
# splash art (src/img/splash/<heroId>.webp, latar sudah transparan) -> SPLASH_SRC
SPD=os.path.join(SRC,'img','splash')
spl={f[:-5]:'data:image/webp;base64,'+base64.b64encode(open(os.path.join(SPD,f),'rb').read()).decode() for f in sorted(os.listdir(SPD)) if f.endswith('.webp')} if os.path.isdir(SPD) else {}
import json
# rig splash hidup hero ★3 (src/img/rig/<hero>_mask.png, <hero>_eyes.png) -> RIG_SRC, dipakai js/art/live2d.js
RGD=os.path.join(SRC,'img','rig')
rig={f[:-4]:'data:image/png;base64,'+base64.b64encode(open(os.path.join(RGD,f),'rb').read()).decode() for f in sorted(os.listdir(RGD)) if f.endswith('.png')} if os.path.isdir(RGD) else {}
# musik latar (src/audio/<kunci>.mp3) -> MUSIC_SRC, diputar oleh js/systems/music.js
AUDD=os.path.join(SRC,'audio')
# Sejak 18 Nov 2026 musik TIDAK ditanam (4 MB → batas 16 MB artifact): disalin ke dist/audio/ dan dirujuk relatif.
# GitHub Pages: repo/audio/*.mp3 (sync_repo.py) · artifact: diunggah sebagai file kedua (publish_files).
import shutil as _sh
mus={}
if os.path.isdir(AUDD):
    os.makedirs(os.path.join(ROOT,'dist','audio'),exist_ok=True)
    for f in sorted(os.listdir(AUDD)):
        if f.endswith('.mp3'):_sh.copy2(os.path.join(AUDD,f),os.path.join(ROOT,'dist','audio',f));mus[f[:-4]]='audio/'+f
# suara karakter (src/voice/<hero>_<l|p><i>.mp3, <hero>_sk.mp3) -> VOICE_SRC, diputar oleh js/systems/voice.js
VOD=os.path.join(SRC,'voice')
vox={f[:-4]:'data:audio/mpeg;base64,'+base64.b64encode(open(os.path.join(VOD,f),'rb').read()).decode() for f in sorted(os.listdir(VOD)) if f.endswith('.mp3')} if os.path.isdir(VOD) else {}
# sprite ilustrasi (src/img/sprites/h_<hero>.webp / e_<musuh>.webp, strip 8 frame 88x88) -> SPRITE_SRC
SPD2=os.path.join(SRC,'img','sprites')
sps={f[:-5]:'data:image/webp;base64,'+base64.b64encode(open(os.path.join(SPD2,f),'rb').read()).decode() for f in sorted(os.listdir(SPD2)) if f.endswith('.webp')} if os.path.isdir(SPD2) else {}
# ikon ilustrasi (src/img/icons/<kunci>.webp) -> ICONIMG_SRC, dipasang oleh js/art/iconart.js
ICD=os.path.join(SRC,'img','icons')
ici={f[:-5]:'data:image/webp;base64,'+base64.b64encode(open(os.path.join(ICD,f),'rb').read()).decode() for f in sorted(os.listdir(ICD)) if f.endswith('.webp')} if os.path.isdir(ICD) else {}
# latar ilustrasi (src/img/bg/*.webp: w_<art> battle, m_<art> peta, key = key art judul) -> BGIMG_SRC
BGD=os.path.join(SRC,'img','bg')
bgi={f[:-5]:'data:image/webp;base64,'+base64.b64encode(open(os.path.join(BGD,f),'rb').read()).decode() for f in sorted(os.listdir(BGD)) if f.endswith('.webp')} if os.path.isdir(BGD) else {}
jsb="<script>\n'use strict';\nconst SPLASH_SRC="+json.dumps(spl)+";\nconst BGIMG_SRC="+json.dumps(bgi)+";\nconst ICONIMG_SRC="+json.dumps(ici)+";\nconst SPRITE_SRC="+json.dumps(sps)+";\nconst VOICE_SRC="+json.dumps(vox)+";\nconst RIG_SRC="+json.dumps(rig)+";\nconst MUSIC_SRC="+json.dumps(mus)+";\n"+'\n'.join(f'/* ==== {p} ==== */\n'+read(p) for p in js)+'</script>'
# logo studio (src/img/studio/logo.webp) ditanam langsung di HTML agar splash studio tampil sebelum script besar selesai dimuat
STL=os.path.join(SRC,'img','studio','logo.webp')
stlogo='data:image/webp;base64,'+base64.b64encode(open(STL,'rb').read()).decode() if os.path.exists(STL) else ''
out=shell.replace('__STUDIO_LOGO__',stlogo).replace('<!-- @css -->',cssb).replace('<!-- @js -->',jsb)
os.makedirs(os.path.join(ROOT,'dist'),exist_ok=True)
open(os.path.join(ROOT,'dist','index.html'),'w',encoding='utf-8').write(out)
print(f'dist/index.html  {len(out)//1024} KB  ({len(css)} css, {len(js)} js)')
# pengetahuan game untuk Mode AI (server bank-worker) -> bank-worker/src/knowledge.js
import shutil,subprocess
if shutil.which('node'):
    try:subprocess.run(['node',os.path.join(ROOT,'tools','gen_knowledge.mjs')],check=True)
    except Exception as e:print('gen_knowledge gagal:',e)
