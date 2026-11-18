# Tachie cerita (ilustrasi berdiri gaya live2d): python3 prep.py <id> [<id>...]
#   raw  : /home/claude/gen/tachie/raw/<id>.png (gpt_image_2_6_flare, latar transparan)
#   hasil: src/story/tc/<id>.webp (tinggi 1400, dipangkas) + potongan kepala /home/claude/gen/tachie/crop/<id>.png
#          (dipakai untuk edit mata tertutup / mulut terbuka / ekspresi) + geo.json (kotak potongan dalam koordinat tachie)
import sys,json,os,cv2,numpy as np
from PIL import Image
CAS=cv2.CascadeClassifier(os.path.join(os.path.dirname(os.path.abspath(__file__)),'animeface.xml'))
H=1400;R='/home/claude/gen/tachie';OUT='/home/claude/aster/src/story/tc'
os.makedirs(OUT,exist_ok=True);os.makedirs(R+'/crop',exist_ok=True)
gp=R+'/geo.json';G=json.load(open(gp)) if os.path.exists(gp) else {}
for k in sys.argv[1:]:
  im=Image.open(f'{R}/raw/{k}.png').convert('RGBA');a=np.array(im)[...,3]
  # buang sisa piksel lepas (alpha kecil) sebelum memangkas
  ys,xs=np.where(a>24);bb=(xs.min(),ys.min(),xs.max()+1,ys.max()+1)
  pad=int(0.012*(bb[3]-bb[1]));bb=(max(0,bb[0]-pad),max(0,bb[1]-pad),min(im.width,bb[2]+pad),min(im.height,bb[3]+pad))
  im=im.crop(bb);s=H/im.height;im=im.resize((round(im.width*s),H),Image.LANCZOS)
  im.save(f'{OUT}/{k}.webp',quality=90,method=6)
  A=np.array(im)[...,3].astype(float)
  # pusat kepala: rata-rata kolom berbobot alpha pada 4–14% teratas
  # wajah: detektor anime (lbpcascade_animeface, MIT) pada setengah atas; cadangan = pusat kepala berbobot alpha
  arr=np.array(im);rgb=(arr[...,:3]*(A[...,None]/255)+236*(1-A[...,None]/255)).astype(np.uint8)
  g=cv2.equalizeHist(cv2.cvtColor(rgb[:H//2],cv2.COLOR_RGB2GRAY));F=CAS.detectMultiScale(g,scaleFactor=1.04,minNeighbors=4,minSize=(70,70))
  if len(F):fx,fy,fw,fh=[int(v) for v in max(F,key=lambda r:r[2])];cx,cy,fs=fx+fw/2,fy+fh*.55,fw
  else:
    band=A[int(.04*H):int(.14*H)];cx=float((band.sum(0)*np.arange(im.width)).sum()/max(1,band.sum()));cy,fs=.15*H,.12*H;fx=fy=fw=fh=0;print(k,'WAJAH TIDAK TERDETEKSI')
  side=int(min(im.width,2.3*fs));x0=int(max(0,min(im.width-side,cx-side/2)));y0=int(max(0,min(H-side,cy-side*.52)))
  cr=im.crop((x0,y0,x0+side,y0+side));bg=Image.new('RGBA',cr.size,(236,236,240,255));bg.alpha_composite(cr)
  bg.convert('RGB').resize((1024,1024),Image.LANCZOS).save(f'{R}/crop/{k}.png')
  G[k]={'w':im.width,'h':H,'crop':[x0,y0,side],'face':[fx,fy,fw,fh]}
  print(k,im.size,'crop',x0,y0,side)
json.dump(G,open(gp,'w'),indent=1)
