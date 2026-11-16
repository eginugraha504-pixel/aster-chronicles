# Lembar sprite 4x2 (latar magenta) -> strip 8 frame 88x88 transparan, kaki rata, skala seragam
import numpy as np,scipy.ndimage as nd
from PIL import Image
from collections import deque
N=88;BASE_Y=78;ANCHOR_X=42
def bgmask(c):
    r,g,b=[c[...,i].astype(int) for i in range(3)]
    cand=(g<130)&(r>120)&(b>120)&(abs(r-b)<100)&((r-g)>60)
    h,w=cand.shape;m=np.zeros_like(cand);q=deque()
    for x in range(w):
        for y in(0,h-1):
            if cand[y,x]:m[y,x]=1;q.append((y,x))
    for y in range(h):
        for x in(0,w-1):
            if cand[y,x] and not m[y,x]:m[y,x]=1;q.append((y,x))
    while q:
        y,x=q.popleft()
        for dy,dx in((1,0),(-1,0),(0,1),(0,-1)):
            yy,xx=y+dy,x+dx
            if 0<=yy<h and 0<=xx<w and cand[yy,xx] and not m[yy,xx]:m[yy,xx]=1;q.append((yy,xx))
    pure=(g<60)&(r>200)&(b>200)
    return m.astype(bool)|pure
def frames_from(path,cols=4,rows=2):
    a=np.array(Image.open(path).convert('RGB'));H,W,_=a.shape;out=[]
    for i in range(cols*rows):
        cx,cy=i%cols,i//cols
        c=a[int(cy*H/rows):int((cy+1)*H/rows),int(cx*W/cols):int((cx+1)*W/cols)]
        fg=~bgmask(c)
        fg=nd.binary_opening(fg,iterations=1)
        lab,n=nd.label(fg);sizes=nd.sum(fg,lab,range(1,n+1))
        if n==0:out.append(None);continue
        main=int(np.argmax(sizes))+1;sl=nd.find_objects(lab)[main-1];my0,my1,mx0,mx1=sl[0].start,sl[0].stop,sl[1].start,sl[1].stop
        pad=int(0.06*max(c.shape));ok=[]
        for k,s0 in enumerate(sizes):
            if s0<sizes.max()*0.003:continue
            b=nd.find_objects(lab)[k]
            # komponen harus menempel/dekat badan utama dan tidak menyentuh tepi sel (potongan dari sel tetangga)
            near=not(b[0].start>my1+pad or b[0].stop<my0-pad or b[1].start>mx1+pad or b[1].stop<mx0-pad)
            edge=b[1].start<=1 or b[1].stop>=c.shape[1]-1 or b[0].start<=1 or b[0].stop>=c.shape[0]-1
            if k+1==main or (near and not edge):ok.append(k+1)
        keep=np.isin(lab,ok)
        out.append((c,keep))
    return out
def build(path,out,target_h=72,ncolors=48,cols=4,rows=2,anchor=ANCHOR_X):
    fr=frames_from(path,cols,rows)
    c0,m0=fr[0];ys,xs=np.where(m0);h0=ys.max()-ys.min()+1;s=target_h/h0
    imgs=[]
    for c,m in fr:
        ys,xs=np.where(m);y0,y1,x0,x1=ys.min(),ys.max()+1,xs.min(),xs.max()+1
        cc=c[y0:y1,x0:x1].copy();mm=m[y0:y1,x0:x1];cc[~mm]=(40,24,30)
        # anchor horizontal: pusat massa 18% baris terbawah (kaki)
        hh=mm.shape[0];foot=mm[int(hh*0.82):];fx=np.where(foot)[1].mean() if foot.any() else mm.shape[1]/2
        nw,nh=max(1,round(mm.shape[1]*s)),max(1,round(hh*s))
        rgb=Image.fromarray(cc).resize((nw,nh),Image.LANCZOS);al=Image.fromarray((mm*255).astype(np.uint8)).resize((nw,nh),Image.LANCZOS)
        imgs.append((rgb,np.array(al)>110,fx*s))
    # palet bersama
    allpx=np.concatenate([np.array(r).reshape(-1,3)[a.reshape(-1)] for r,a,_ in imgs])
    pal_img=Image.fromarray(allpx.reshape(1,-1,3).astype(np.uint8)).quantize(colors=ncolors,method=Image.MEDIANCUT,dither=Image.Dither.NONE)
    strip=np.zeros((N,N*len(imgs),4),np.uint8);clip=[]
    for i,(rgb,a,fx) in enumerate(imgs):
        q=np.array(rgb.quantize(palette=pal_img,dither=Image.Dither.NONE).convert('RGB'))
        nh,nw=a.shape;ox=int(round(anchor-fx));oy=BASE_Y-nh
        X0,Y0=max(0,ox),max(0,oy);X1,Y1=min(N,ox+nw),min(N,oy+nh)
        if X0>ox or Y0>oy or X1<ox+nw or Y1<oy+nh:clip.append(i)
        sub=strip[:,i*N:(i+1)*N]
        sl=(slice(Y0-oy,Y1-oy),slice(X0-ox,X1-ox))
        sub[Y0:Y1,X0:X1,:3]=np.where(a[sl][...,None],q[sl],sub[Y0:Y1,X0:X1,:3]);sub[Y0:Y1,X0:X1,3]=np.where(a[sl],255,sub[Y0:Y1,X0:X1,3])
    Image.fromarray(strip,'RGBA').save(out)
    return {'scale':round(s,4),'clipped':clip}
