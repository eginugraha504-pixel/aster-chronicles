import numpy as np
from PIL import Image
from collections import deque
def magmask(a):
    r,g,b=[a[...,i].astype(int) for i in range(3)]
    return (g<120)&(r>140)&(b>140)&(abs(r-b)<90)
def extract(path,box,out,width=None,height=None,mirror='',pad=0,flood=True):
    im=np.array(Image.open(path).convert('RGB'));H,W,_=im.shape
    x0,y0,x1,y1=[int(v*(W if i%2==0 else H)) for i,v in enumerate(box)]
    c=im[y0:y1,x0:x1];bg=magmask(c)
    if flood:
        h,w=bg.shape;m=np.zeros_like(bg);q=deque()
        for x in range(w):
            for y in(0,h-1):
                if bg[y,x]:m[y,x]=1;q.append((y,x))
        for y in range(h):
            for x in(0,w-1):
                if bg[y,x] and not m[y,x]:m[y,x]=1;q.append((y,x))
        while q:
            y,x=q.popleft()
            for dy,dx in((1,0),(-1,0),(0,1),(0,-1)):
                yy,xx=y+dy,x+dx
                if 0<=yy<h and 0<=xx<w and bg[yy,xx] and not m[yy,xx]:m[yy,xx]=1;q.append((yy,xx))
        bgm=m.astype(bool)|((c[...,1]<50)&(c[...,0]>210)&(c[...,2]>210))
    else:bgm=bg
    fg=~bgm;ys,xs=np.where(fg);yy0,yy1,xx0,xx1=ys.min(),ys.max()+1,xs.min(),xs.max()+1
    c=c[yy0:yy1,xx0:xx1].copy();fg=fg[yy0:yy1,xx0:xx1]
    c[~fg]=(59,36,22)
    rgba=np.dstack([c,(fg*255).astype(np.uint8)])
    img=Image.fromarray(rgba,'RGBA')
    if width or height:
        w,h=img.size
        if width and height:nw,nh=width,height
        elif width:nw,nh=width,round(h*width/w)
        else:nw,nh=round(w*height/h),height
        # premultiply-safe resize
        img=img.resize((nw,nh),Image.LANCZOS)
    a=np.array(img).astype(np.float32)
    if 'x' in mirror:
        w=a.shape[1];hw=w//2;a[:,w-hw:]=a[:,:hw][:,::-1]
    if 'y' in mirror:
        h=a.shape[0];hh=h//2;a[h-hh:]=a[:hh][::-1]
    a[...,3]=np.where(a[...,3]>140,255,np.where(a[...,3]<60,0,a[...,3]))
    Image.fromarray(a.clip(0,255).astype(np.uint8),'RGBA').save(out)
    return Image.open(out).size
