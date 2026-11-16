# Potong lembar ikon NxM -> ikon piksel 32x32 transparan (disimpan 64x64 nearest)
import sys,numpy as np
from PIL import Image
from collections import deque
def bgmask(a,key,tol=70):
    r,g,b=[a[...,i].astype(int) for i in range(3)]
    if key=='auto':
        bd=np.concatenate([a[0],a[-1],a[:,0],a[:,-1]]).astype(int);bc=np.median(bd,axis=0)
        d=np.sqrt(((a.astype(int)-bc)**2).sum(-1));cand=d<tol
    elif key=='magenta':cand=(g<110)&(r>100)&(b>100)&(abs(r-b)<80)
    else:cand=(g>120)&(r<120)&(b<120)
    H,W=cand.shape;m=np.zeros((H,W),bool);q=deque()
    for x in range(W):
        for y in (0,H-1):
            if cand[y,x]:m[y,x]=True;q.append((y,x))
    for y in range(H):
        for x in (0,W-1):
            if cand[y,x] and not m[y,x]:m[y,x]=True;q.append((y,x))
    while q:
        y,x=q.popleft()
        for dy,dx in((1,0),(-1,0),(0,1),(0,-1)):
            yy,xx=y+dy,x+dx
            if 0<=yy<H and 0<=xx<W and cand[yy,xx] and not m[yy,xx]:m[yy,xx]=True;q.append((yy,xx))
    # bintik latar yang terkurung (mis. di dalam cincin) juga dibuang kalau warnanya sangat murni
    if key=='auto':pure=np.zeros_like(cand)
    elif key=='magenta':pure=(g<40)&(r>200)&(b>200)
    else:pure=(g>200)&(r<60)&(b<60)
    return m|pure
def cut(path,cols,rows,names,key,N=32,fill=30,out='out'):
    im=np.array(Image.open(path).convert('RGB'));H,W,_=im.shape;cw,ch=W/cols,H/rows;res={}
    for i,n in enumerate(names):
        if not n:continue
        cx,cy=i%cols,i//cols
        c=im[int(cy*ch):int((cy+1)*ch),int(cx*cw):int((cx+1)*cw)]
        m=~bgmask(c,key)
        # buang noda kecil: ambil bbox piksel isi
        ys,xs=np.where(m)
        if not len(ys):print('KOSONG',n);continue
        y0,y1,x0,x1=ys.min(),ys.max(),xs.min(),xs.max()
        c=c[y0:y1+1,x0:x1+1];m=m[y0:y1+1,x0:x1+1]
        h,w=m.shape;s=max(h,w);k=fill/s
        nw,nh=max(1,round(w*k)),max(1,round(h*k))
        c=c.copy();c[~m]=(59,36,22)
        rgb=Image.fromarray(c).resize((nw,nh),Image.BOX)
        al=Image.fromarray((m*255).astype('uint8')).resize((nw,nh),Image.BOX)
        a=(np.array(al)>110)
        q=rgb.quantize(colors=24,method=Image.MEDIANCUT,dither=Image.Dither.NONE).convert('RGB')
        arr=np.zeros((N,N,4),np.uint8);ox,oy=(N-nw)//2,(N-nh)//2
        arr[oy:oy+nh,ox:ox+nw,:3]=np.array(q);arr[oy:oy+nh,ox:ox+nw,3]=a*255
        Image.fromarray(arr,'RGBA').resize((N*2,N*2),Image.NEAREST).save(f'{out}/{n}.png')
        res[n]=1
    return res
if __name__=='__main__':
    import json,os;os.makedirs('out',exist_ok=True)
    spec=json.loads(sys.argv[1]);print(len(cut(**spec)))
