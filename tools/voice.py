#!/usr/bin/env python3
"""Aster Chronicles — alat dub Jepang (ElevenLabs v4 lewat Higgsfield).
Data: art_src/voice/voices.json (aktor + teks tiap klip). Hasil: src/voice/<kunci>.mp3 (ditanam oleh build.py).

  python3 tools/voice.py status            ringkasan per hero: aktor, klip ada/hilang, teks 'ja' kosong
  python3 tools/voice.py sync              cocokkan dengan src/js/data/heroes.js: tambah kunci baru (ja kosong),
                                           isi ulang teks Indonesia, laporkan klip yang tidak terpakai lagi
  python3 tools/voice.py jobs [hero|kunci ...] [--all]
                                           cetak parameter Higgsfield generate_audio_batch (per 8 klip)
                                           bawaan: klip yang belum punya mp3 dan teks 'ja' sudah terisi
  python3 tools/voice.py fetch < hasil.txt baris "kunci URL" -> unduh mentah ke art_src/voice/raw/ lalu proses
  python3 tools/voice.py process KUNCI FILE.mp3
                                           proses 1 file mentah (potong hening, -16 LUFS, 24 kHz mono 48 kbps)
Setelah itu: python3 tools/build.py
Butuh: node (membaca heroes.js), ffmpeg, curl.
"""
import json,os,subprocess,sys
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VJ=os.path.join(ROOT,'art_src','voice','voices.json')
OUT=os.path.join(ROOT,'src','voice');RAW=os.path.join(ROOT,'art_src','voice','raw')
def load():return json.load(open(VJ,encoding='utf-8'))
def save(d):json.dump(d,open(VJ,'w',encoding='utf-8'),ensure_ascii=False,indent=1);open(VJ,'a').write('\n')
def heroes():
    js="const fs=require('fs');const s=fs.readFileSync(process.argv[1],'utf8');const H=new Function(s.replace(/^const HEROES=/m,'var HEROES=')+';return HEROES')();console.log(JSON.stringify(H.map(h=>({id:h.id,name:h.name,title:h.title,lines:h.lines||[],poke:h.poke||[],sk:h.sk}))))"
    return json.loads(subprocess.check_output(['node','-e',js,os.path.join(ROOT,'src','js','data','heroes.js')]))
def want_keys(H):
    """semua kunci yang dipakai game, berurutan, beserta teks Indonesianya"""
    out=[]
    for h in H:
        out+= [(f"{h['id']}_l{i}",t) for i,t in enumerate(h['lines'])]
        out+= [(f"{h['id']}_p{i}",t) for i,t in enumerate(h['poke'])]
        if h.get('sk'):out.append((f"{h['id']}_sk",h['sk']))
    return out
has=lambda k:os.path.exists(os.path.join(OUT,k+'.mp3'))
hero_of=lambda k:k.rsplit('_',1)[0]

def cmd_status(a):
    d=load();H=heroes()
    print(f"{'hero':10s} {'aktor':8s} {'klip':>6s}  hilang / ja kosong");n=0
    for h in H:
        ks=[k for k,_ in want_keys([h])];miss=[k for k in ks if not has(k)];noja=[k for k in ks if not d['clips'].get(k,{}).get('ja')]
        c=d['cast'].get(h['id']);n+=len(ks)-len(miss)
        print(f"{h['id']:10s} {(c or {}).get('aktor','-- BELUM --'):8s} {len(ks)-len(miss):>3d}/{len(ks):<3d} {' '.join(miss) or '-'} / {' '.join(noja) or '-'}")
    used={k for k,_ in want_keys(H)};extra=[k for k in d['clips'] if k not in used]
    print(f"total {n} klip siap.",('Kunci tidak dipakai lagi: '+' '.join(extra)) if extra else '')

def cmd_sync(a):
    d=load();H=heroes();new=[];chg=[]
    clips={}
    for k,t in want_keys(H):
        c=d['clips'].get(k) or {'ja':'','id':t}
        if k not in d['clips']:new.append(k)
        elif c.get('id')!=t:chg.append(k)
        c['id']=t;clips[k]=c
    extra={k:v for k,v in d['clips'].items() if k not in clips}
    for k,v in extra.items():clips[k]=dict(v,unused=True)   # disimpan agar tidak hilang; hapus manual bila yakin
    d['clips']=clips;save(d)
    for h in H:
        if h['id'] not in d['cast']:print(f"! {h['id']} belum punya aktor: tambahkan di 'cast' (lihat ASET.md cara audisi)")
    print('baru (isi teks ja):',' '.join(new) or '-')
    print('teks Indonesia berubah (cek ja & buat ulang klip):',' '.join(chg) or '-')
    print('tidak dipakai:',' '.join(extra) or '-')

def cmd_jobs(a):
    d=load();every='--all' in a;sel=[x for x in a if not x.startswith('--')]
    ks=[k for k,c in d['clips'].items() if not c.get('unused')]
    if sel:ks=[k for k in ks if k in sel or hero_of(k) in sel]
    if not every:ks=[k for k in ks if not has(k)]
    bad=[k for k in ks if not d['clips'][k].get('ja') or hero_of(k) not in d['cast']]
    if bad:print('// dilewati (ja kosong / aktor belum ada):',' '.join(bad),file=sys.stderr)
    ks=[k for k in ks if k not in bad]
    if not ks:print('// tidak ada klip yang perlu dibuat',file=sys.stderr);return
    jobs=[{"model":d['model'],"prompt":k,"use_unlim":False,"dialogue":[{"text":d['clips'][k]['ja'],"voice_type":d['voice_type'],"voice_id":d['cast'][hero_of(k)]['voice_id']}]} for k in ks]
    B=d.get('batch_max',8)
    for i in range(0,len(jobs),B):print(json.dumps(jobs[i:i+B],ensure_ascii=False))
    print(f"// {len(jobs)} klip, {(len(jobs)+B-1)//B} batch. 'prompt' = kunci klip -> pakai untuk fetch.",file=sys.stderr)

def process(k,src):
    p=load()['post'];t=p['trim_db'];os.makedirs(OUT,exist_ok=True);dst=os.path.join(OUT,k+'.mp3');tmp=dst+'.tmp.mp3'
    af=(f"silenceremove=start_periods=1:start_threshold={t}dB:start_silence=0.05,areverse,"
        f"silenceremove=start_periods=1:start_threshold={t}dB:start_silence=0.08,areverse,"
        f"loudnorm=I={p['lufs']}:TP={p['true_peak']}:LRA=11")
    subprocess.run(['ffmpeg','-y','-loglevel','error','-i',src,'-af',af,'-ar',str(p['sample_rate']),'-ac','1','-b:a',f"{p['kbps']}k",tmp],check=True)
    os.replace(tmp,dst);print('ok',k,os.path.getsize(dst)//1024,'KB')
def cmd_fetch(a):
    os.makedirs(RAW,exist_ok=True)
    for ln in sys.stdin.read().splitlines():
        ps=ln.replace(',',' ').split()
        if len(ps)<2:continue
        k,u=ps[0],ps[1];r=os.path.join(RAW,k+'.mp3')
        subprocess.run(['curl','-sSL','-o',r,u],check=True);process(k,r)
def cmd_process(a):process(a[0],a[1])

if __name__=='__main__':
    c=sys.argv[1] if len(sys.argv)>1 else 'status'
    {'status':cmd_status,'sync':cmd_sync,'jobs':cmd_jobs,'fetch':cmd_fetch,'process':cmd_process}.get(c,lambda a:print(__doc__))(sys.argv[2:])
