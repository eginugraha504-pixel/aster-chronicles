# Potong lembar stiker (latar magenta #FF00FF) jadi stiker satuan transparan.
# Pakai: python3 art_src/sticker_cut.py <lembar.png> <out_dir> kunci1 kunci2 ... (urut kiri-atas, kanan-atas, kiri-bawah, kanan-bawah)
import sys,numpy as np
from PIL import Image
from scipy import ndimage
src,out,keys=sys.argv[1],sys.argv[2],sys.argv[3:]
im=np.array(Image.open(src).convert('RGB')).astype(float);r,g,b=im[...,0],im[...,1],im[...,2]
# kedekatan ke magenta -> alpha (tepi halus), lalu buang sisa warna magenta di tepi (despill)
mag=np.clip(((r+b)/2-g-120)/60,0,1)          # 1 = magenta murni
a=1-mag
fg=a>.5;fg=ndimage.binary_opening(fg,iterations=2)
grp=ndimage.binary_dilation(fg,iterations=28)   # gabungkan hiasan kecil (?, hati, konfeti) ke stiker terdekat
lab,n=ndimage.label(grp);sizes=ndimage.sum(fg,lab,range(1,n+1))
big=[i+1 for i in np.argsort(sizes)[::-1][:len(keys)]]
objs=[]
for L in big:
  ys,xs=np.where((lab==L)&fg);objs.append((ys.min(),ys.max(),xs.min(),xs.max(),L))
H=im.shape[0];objs.sort(key=lambda o:(int((o[0]+o[1])/2>H/2) if len(keys)>1 else 0,(o[2]+o[3])/2))
for k,(y0,y1,x0,x1,L) in zip(keys,objs):
  m=(lab==L)&(a>0.02)
  al=np.where(m,a,0)
  col=im.copy();sp=np.minimum(r,b)-g;col[...,0]=np.where(sp>0,r-sp*(1-a)*.9,r);col[...,2]=np.where(sp>0,b-sp*(1-a)*.9,b)
  rgba=np.dstack([np.clip(col,0,255),al*255]).astype('uint8')[max(0,y0-6):y1+7,max(0,x0-6):x1+7]
  o=Image.fromarray(rgba,'RGBA');o.thumbnail((256,256),Image.LANCZOS);o.save(f'{out}/{k}.webp',quality=86,method=6,alpha_quality=85);print(k,o.size)
