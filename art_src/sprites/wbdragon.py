# Lembar naga World Boss (4x2, latar magenta) -> strip 8 frame 208x176 grayscale transparan (src/img/sprites/wb_dragon.webp)
import numpy as np,scipy.ndimage as nd
from PIL import Image
FW,FH,BASE,AX=208,176,170,84
a=np.array(Image.open('sprites/wbdragon_sheet.png').convert('RGB')).astype(int);H,W,_=a.shape
cells=[];boxes=[]
for i in range(8):
    cx,cy=i%4,i//4;c=a[int(cy*H/2):int((cy+1)*H/2),int(cx*W/4):int((cx+1)*W/4)]
    r,g,b=c[...,0],c[...,1],c[...,2]
    bg=(r-g>70)&(b-g>70)&(abs(r-b)<90)
    fg=~bg;fg=nd.binary_opening(fg,iterations=1)
    lab,n=nd.label(fg);sz=nd.sum(fg,lab,range(1,n+1));mx=max(sz);ok=[]
    for k,s_ in enumerate(sz):
        if s_<400 or s_<.03*mx:continue
        yy,xx=np.where(lab==k+1)
        if s_<.2*mx and (xx.min()<3 or xx.max()>c.shape[1]-4 or yy.min()<3):continue   # serpihan sel tetangga
        ok.append(k+1)
    keep=np.isin(lab,ok)
    keep=nd.binary_fill_holes(keep)&fg|keep
    ys,xs=np.where(keep);boxes.append((xs.min(),ys.min(),xs.max(),ys.max()));big_=lab==max(ok,key=lambda k:(np.where(lab==k)[0].max(),sz[k-1]));cells.append((c,keep,big_))
# skala seragam: tinggi badan terbesar -> 160 px
hmax=max(b[3]-b[1] for b in boxes);sc=158/hmax
frames=[]
for (c,keep,big_),(x0,y0,x1,y1) in zip(cells,boxes):
    lum=(.3*c[...,0]+.59*c[...,1]+.11*c[...,2])
    # tepi yang kena magenta: ambil kecerahan dari kanal hijau (magenta = hijau rendah)
    edge=keep&((c[...,0]-c[...,1])>40)&((c[...,2]-c[...,1])>40)
    lum=np.where(edge,c[...,1]*1.0,lum)
    rgba=np.zeros(c.shape[:2]+(4,),np.uint8);rgba[...,0]=rgba[...,1]=rgba[...,2]=np.clip(lum,0,255);rgba[...,3]=keep*255
    im=Image.fromarray(rgba).crop((x0,y0,x1+1,y1+1));w,h=im.size
    im=im.resize((max(1,round(w*sc)),max(1,round(h*sc))),Image.LANCZOS)
    al=np.array(im)[...,3];arr=np.array(im);arr[...,3]=np.where(al>110,255,0);im=Image.fromarray(arr)
    # jangkar: bagian badan (kolom terberat) — pakai pusat massa 60% bawah
    bm=np.array(Image.fromarray((big_[y0:y1+1,x0:x1+1]*255).astype(np.uint8)).resize(im.size))>127;ys,xs=np.where(bm[int(bm.shape[0]*.4):]);cxm=int(np.median(xs))
    f=Image.new('RGBA',(FW,FH));f.paste(im,(AX-cxm,BASE-im.size[1]),im);frames.append(f)
strip=Image.new('RGBA',(FW*8,FH))
for i,f in enumerate(frames):strip.paste(f,(i*FW,0))
strip.save('../src/img/sprites/wb_dragon.webp',lossless=True,quality=100)
strip.resize((FW*4,FH//2)).save('/tmp/an/strip.png')
big=Image.new('RGBA',(FW*4,FH*2),(40,30,50,255))
for i,f in enumerate(frames):big.paste(f,((i%4)*FW,(i//4)*FH),f)
big.save('/tmp/an/stripv.png');print('ok',sc)
