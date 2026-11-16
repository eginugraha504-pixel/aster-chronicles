import numpy as np,sys
from PIL import Image,ImageFilter
src={'raika':'079c5cae-image.jpg','sakuya':'7162eff7-image.jpg','seraphine':'65e2ff84-image.jpg'}
H=int(sys.argv[1]) if len(sys.argv)>1 else 1000
for k,f in src.items():
    a=np.asarray(Image.open('/mnt/user-data/uploads/'+f).convert('RGB')).astype(np.float32)
    r,g,b=a[...,0],a[...,1],a[...,2]
    m=np.maximum(r,b)
    d=g-m                                  # greenness
    alpha=1-np.clip((d-40)/(110-40),0,1)   # d>=110 -> transparent, d<=40 -> opaque
    # despill: green never exceeds max(r,b) on the character
    g2=np.minimum(g,m+ (d<0)*0 )  # clamp
    g2=np.where(g>m,m+ (g-m)*0.0,g)
    out=np.dstack([r,g2,b,alpha*255]).clip(0,255).astype(np.uint8)
    im=Image.fromarray(out,'RGBA')
    # clean tiny alpha noise
    A=im.getchannel('A').point(lambda v:0 if v<12 else v)
    im.putalpha(A)
    bb=A.point(lambda v:255 if v>40 else 0).getbbox()
    pad=6;bb=(max(0,bb[0]-pad),max(0,bb[1]-pad),min(im.width,bb[2]+pad),min(im.height,bb[3]+pad))
    im=im.crop(bb)
    s=H/im.height;im=im.resize((round(im.width*s),H),Image.LANCZOS)
    im.save(k+'.png');im.save(k+'.webp',quality=86,method=6)
    # preview on dark and light bg
    for nm,c in (('d',(30,24,48)),('l',(240,230,210))):
        bg=Image.new('RGBA',im.size,c+(255,));bg.alpha_composite(im);bg.convert('RGB').save(f'pv_{k}_{nm}.png')
    import os;print(k,im.size,os.path.getsize(k+'.webp')//1024,'KB')
