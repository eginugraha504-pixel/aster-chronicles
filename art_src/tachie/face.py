# Patch wajah tachie cerita: python3 face.py <id>_<e> [...]   e: b (mata tertutup) · m (mulut bicara) · a/k/d (ekspresi)
#   input : tachie src/story/tc/<id>.webp (NPC: src/story/npc/<id>.webp), potongan /home/claude/gen/tachie/crop/<id>.png,
#           hasil edit nano_banana_pro /home/claude/gen/tachie/ed/<id>_<e>.png, geo.json (kotak potongan & wajah)
#   output: src/story/tc/<id>_<e>.webp (RGBA hanya bagian yang berubah) + tc_geo.json {id:{e:[x,y,w,h]}} koordinat tachie
import cv2,numpy as np,json,sys,os
from PIL import Image
R='/home/claude/gen/tachie';SRC='/home/claude/aster/src/story';OUT=SRC+'/tc'
G=json.load(open(R+'/geo.json'));gp=os.path.join(os.path.dirname(os.path.abspath(__file__)),'tc_geo.json')
geo=json.load(open(gp)) if os.path.exists(gp) else {}
# daerah yang boleh berubah per jenis edit (relatif kotak wajah fx,fy,fw,fh): pusat x, pusat y, jari-jari x, jari-jari y
ZONE={'b':(.5,.44,.42,.17),'m':(.5,.64,.17,.11),'a':(.5,.50,.52,.40),'k':(.5,.50,.52,.40),'d':(.5,.50,.52,.40)}
THR={'b':16,'m':16,'a':14,'k':14,'d':14}
for key in sys.argv[1:]:
  k,e=key.rsplit('_',1);g=G[k];x0,y0,side=g['crop'];S=1024
  base=Image.open(f"{SRC}/{'npc' if g.get('npc') else 'tc'}/{k}.webp").convert('RGBA')
  cr=np.array(base.crop((x0,y0,x0+side,y0+side)).resize((S,S),Image.LANCZOS)).astype(np.float32)
  A=cr[...,3:4]/255;crb=cr[...,:3]*A+236*(1-A)          # sama dengan potongan yang diunggah (latar abu terang)
  ed=np.array(Image.open(f'{R}/ed/{key}.png').convert('RGB').resize((S,S),Image.LANCZOS)).astype(np.float32)
  g1=cv2.cvtColor(crb.astype(np.uint8),cv2.COLOR_RGB2GRAY);g2=cv2.cvtColor(ed.astype(np.uint8),cv2.COLOR_RGB2GRAY)
  orb=cv2.ORB_create(6000);k1,d1=orb.detectAndCompute(g1,None);k2,d2=orb.detectAndCompute(g2,None)
  mt=sorted(cv2.BFMatcher(cv2.NORM_HAMMING,crossCheck=True).match(d1,d2),key=lambda x:x.distance)[:1500]
  M,inl=cv2.estimateAffinePartial2D(np.float32([k2[x.trainIdx].pt for x in mt]),np.float32([k1[x.queryIdx].pt for x in mt]),method=cv2.RANSAC,ransacReprojThreshold=2.0)
  al=cv2.warpAffine(ed,M,(S,S),flags=cv2.INTER_CUBIC,borderMode=cv2.BORDER_REPLICATE)
  d=np.abs(al-crb).mean(2)*(A[...,0]>.5)
  fx,fy,fw,fh=g['face']
  if fw:FX,FY,FW,FH=[(v-o)*S/side for v,o in((fx,x0),(fy,y0))]+[fw*S/side,fh*S/side]
  else:FX,FY,FW,FH=S*.28,S*.22,S*.44,S*.44
  zx,zy,rx,ry=ZONE[e];cx,cy=FX+FW*zx,FY+FH*zy;yy,xx=np.mgrid[0:S,0:S]
  ell=((xx-cx)/(FW*rx))**2+((yy-cy)/(FH*ry))**2<1
  mk=(cv2.GaussianBlur(d,(0,0),2)>THR[e])&ell
  mk=cv2.morphologyEx(mk.astype(np.uint8),cv2.MORPH_CLOSE,np.ones((15,15),np.uint8))
  n,lab,st,_=cv2.connectedComponentsWithStats(mk);keep=np.zeros_like(mk)
  for i in range(1,n):
    if st[i,4]>S*S*0.0006:keep[lab==i]=1
  if keep.sum()==0:print(key,'TIDAK ADA PERUBAHAN');continue
  keep=cv2.dilate(keep,np.ones((15,15),np.uint8))
  a=np.clip(cv2.GaussianBlur(keep.astype(np.float32),(0,0),6)*1.7,0,1)*ell*(A[...,0])
  # samakan warna kulit: gain dari cincin di sekitar patch yang tidak berubah
  ring=(cv2.dilate(keep,np.ones((41,41),np.uint8))>0)&(keep==0)&(d<10)&(A[...,0]>.9)
  if ring.sum()>200:gain=(crb[ring].mean(0)+1)/(al[ring].mean(0)+1);al=np.clip(al*np.clip(gain,.9,1.1),0,255)
  ys,xs=np.where(a>0.01);bx0,by0,bx1,by1=xs.min(),ys.min(),xs.max()+1,ys.max()+1
  rgba=np.dstack([al,a*255]).astype(np.uint8)[by0:by1,bx0:bx1]
  s=side/S;wx,wy=x0+bx0*s,y0+by0*s;ww,wh=(bx1-bx0)*s,(by1-by0)*s
  im=Image.fromarray(rgba,'RGBA').resize((max(1,round(ww)),max(1,round(wh))),Image.LANCZOS)
  im.save(f'{OUT}/{key}.webp',quality=90,method=6)
  geo.setdefault(k,{})[e]=[round(wx,1),round(wy,1),im.width,im.height]
  # pratinjau: tempel patch di potongan
  pv=crb.copy();pv=pv*(1-a[...,None])+al*a[...,None]
  Image.fromarray(np.hstack([crb,pv]).astype(np.uint8)).resize((768,384)).save(f'{R}/pv/{key}.jpg',quality=85)
  print(key,'inl',int(inl.sum()),'sc',round(float(np.sqrt(abs(np.linalg.det(M[:,:2])))),3),'patch',geo[k][e],'cover',round(float((a>.5).mean()),4))
json.dump(geo,open(gp,'w'),indent=0)
