import json,glob,sys,re,os
srcs=sys.argv[1:] or ['/tmp/s4']
# file: <kunci>_<seed>.json, kunci = profil_pengalaman[_tier]
grp={}
for d in srcs:
  for f in sorted(glob.glob(d+'/*.json')):
    k=re.sub(r'_\d+$','',os.path.basename(f)[:-5]);grp.setdefault(k,[]).append(f)
out={}
for key in sorted(grp,key=lambda k:(k.count('_'),k)):
    runs=[json.load(open(f))['rows'] for f in grp[key]]
    runs=[r for r in runs if len(r)>=30]
    if not runs:print('BELUM LENGKAP',key);continue
    pts={}
    for R in runs:
      for r in R:
        if r['day']<=3:
          for s in r['sub']:pts.setdefault(s['p'],[]).append(s)
        else:pts.setdefault(float(r['day']),[]).append(r)
    rows=[[0,1,0,1,0,0,0]]
    for p in sorted(pts):
      L=pts[p];a=lambda k:sum(x[k] for x in L)/len(L)
      rows.append([p,round(a('lv'),1),round(a('sum')),round(a('wl'),1),round(a('wlb'),2),round(a('hours'),2),round(a('stages'),1)])
    for k in range(1,len(rows)):
      for c in range(1,7):rows[k][c]=max(rows[k][c],rows[k-1][c])
    out[key]=rows
    print(key.ljust(26),len(runs),'d1',rows[[r[0] for r in rows].index(1.0)][1:],'d7',[r for r in rows if r[0]==7][0][1:],'d30',rows[-1][1:])
json.dump(out,open('curves2.json','w'));print('-> curves2.json')
# baris siap tempel untuk BOT_CFG.CURVES
num=lambda x:str(int(x)) if float(x).is_integer() else ('%g'%x)
with open('curves2.js','w') as f:
  for k,rows in out.items():f.write(f"  {k}:["+",".join("["+",".join(num(v) for v in r)+"]" for r in rows)+"],\n")
print('-> curves2.js (tempel di dalam CURVES:{...})')
