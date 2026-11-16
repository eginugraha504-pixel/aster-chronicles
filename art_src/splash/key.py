# Chroma key (hijau/magenta) -> RGBA terpotong, tinggi H. Despill: komponen latar tidak boleh melebihi komponen lain.
import numpy as np,sys,os
from PIL import Image
def key(path,out,bg='green',H=1100):
    a=np.asarray(Image.open(path).convert('RGB')).astype(np.float32);r,g,b=a[...,0],a[...,1],a[...,2]
    if bg=='green':
        m=np.maximum(r,b);d=g-m
        alpha=1-np.clip((d-35)/(105-35),0,1)
        g=np.where(g>m,m,g)                       # despill hijau
    else:
        m=g;d=np.minimum(r,b)-g                    # magenta: r&b tinggi, g rendah
        alpha=1-np.clip((d-45)/(130-45),0,1)
        hi=np.maximum(g,(r+b)/2*0.0)
        r=np.where((r>g)&(b>g)&(d>0),np.minimum(r,g+ (r-g)*0.55+ (1-alpha)*0),r)
        b=np.where((r>g)&(b>g)&(d>0),np.minimum(b,g+(b-g)*0.55),b)
    o=np.dstack([r,g,b,alpha*255]).clip(0,255).astype(np.uint8);im=Image.fromarray(o,'RGBA')
    A=im.getchannel('A').point(lambda v:0 if v<14 else v);im.putalpha(A)
    bb=A.point(lambda v:255 if v>40 else 0).getbbox();pad=8
    bb=(max(0,bb[0]-pad),max(0,bb[1]-pad),min(im.width,bb[2]+pad),min(im.height,bb[3]+pad));im=im.crop(bb)
    s=H/im.height;im=im.resize((round(im.width*s),H),Image.LANCZOS);im.save(out,quality=86,method=6)
    return im.size,os.path.getsize(out)//1024
if __name__=='__main__':print(key(sys.argv[1],sys.argv[2],sys.argv[3] if len(sys.argv)>3 else 'green'))
