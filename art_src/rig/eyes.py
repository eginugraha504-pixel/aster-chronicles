# Atlas mata generik (dipakai Hilde dkk): python3 eyes.py <hero> <edit_mata_tertutup.png> x1,y1 x2,y2 [rx,ry] [ambang]
# x,y = pusat tiap mata di koordinat splash 1100 (src/img/splash/<hero>.webp). Hasil: src/img/rig/<hero>_eyes.png + eyegeo_<hero>.json, kotak RIG eye dicetak.
import cv2,numpy as np,json,sys
from PIL import Image
n,edit=sys.argv[1],sys.argv[2];E=[tuple(map(float,a.split(','))) for a in sys.argv[3:5]]
rx,ry=map(float,(sys.argv[5] if len(sys.argv)>5 else '60,34').split(','));thr=float(sys.argv[6]) if len(sys.argv)>6 else 38
o=cv2.imread(f'/home/claude/aster/art_src/splash/{n}.png',cv2.IMREAD_UNCHANGED)
A0=o[...,3];ys,xs=np.where(A0>40);pad=8;BB=(max(0,xs.min()-pad),max(0,ys.min()-pad),min(o.shape[1],xs.max()+1+pad),min(o.shape[0],ys.max()+1+pad))
sc=1100/(BB[3]-BB[1])
c=cv2.imread(edit,cv2.IMREAD_UNCHANGED)[...,:3]
g1=cv2.cvtColor(o[...,:3],cv2.COLOR_BGR2GRAY);cr=cv2.resize(c,(o.shape[1],o.shape[0]),interpolation=cv2.INTER_CUBIC);g2=cv2.cvtColor(cr,cv2.COLOR_BGR2GRAY)
orb=cv2.ORB_create(6000);k1,d1=orb.detectAndCompute(g1,None);k2,d2=orb.detectAndCompute(g2,None)
m=sorted(cv2.BFMatcher(cv2.NORM_HAMMING,crossCheck=True).match(d1,d2),key=lambda x:x.distance)[:1500]
M,inl=cv2.estimateAffinePartial2D(np.float32([k2[x.trainIdx].pt for x in m]),np.float32([k1[x.queryIdx].pt for x in m]),method=cv2.RANSAC,ransacReprojThreshold=2.5)
al=cv2.warpAffine(cr,M,(o.shape[1],o.shape[0]),flags=cv2.INTER_CUBIC,borderMode=cv2.BORDER_REPLICATE).astype(np.float32)
of=o.astype(np.float32);d=np.abs(al-of[...,:3]).mean(2)
C=[(BB[0]+x/sc,BB[1]+y/sc) for x,y in E];RX,RY=rx/sc*0.4822*2.07,ry/sc*0.4822*2.07   # rx,ry dalam px splash-1100 kira-kira
RX,RY=rx/sc,ry/sc
yy,xx=np.mgrid[0:o.shape[0],0:o.shape[1]]
ell=np.zeros(d.shape,bool)
for cx,cy in C:ell|=((xx-cx)/RX)**2+((yy-cy)/RY)**2<1
mm=((d>thr)&ell).astype(np.uint8);mm=cv2.morphologyEx(mm,cv2.MORPH_CLOSE,np.ones((7,7),np.uint8))
ys,xs=np.nonzero(mm);bx0,by0,bx1,by1=xs.min(),ys.min(),xs.max(),ys.max();print('eye bbox orig',bx0,by0,bx1,by1,'inliers',int(inl.sum()))
full=cv2.GaussianBlur(cv2.dilate(mm*255,np.ones((13,13),np.uint8)),(0,0),5)
p=28;X0,Y0,X1,Y1=bx0-p,by0-p,bx1+p,by1+p;box=(slice(Y0,Y1),slice(X0,X1))
ring=(d[box]<12)&(full[box]<10)&(of[box][...,3]>200)
gain=(of[box][...,:3][ring].mean(0)+1)/(al[box][ring].mean(0)+1);patch=np.clip(al[box]*gain,0,255);a=full[box]/255.
EX=[int(round((X0-BB[0])*sc)),int(round((Y0-BB[1])*sc)),int(round((X1-X0)*sc)),int(round((Y1-Y0)*sc))];print('RIG eye',EX)
def to1100(img):
    Mi=np.float32([[1/sc,0,EX[0]/sc+BB[0]],[0,1/sc,EX[1]/sc+BB[1]]]);return cv2.warpAffine(img,Mi,(EX[2],EX[3]),flags=cv2.WARP_INVERSE_MAP|cv2.INTER_AREA)
fullC=np.zeros_like(of[...,:3]);fullC[box]=patch;Af=np.zeros(d.shape,np.float32);Af[box]=a
cl=to1100(fullC);aa=to1100(Af)[...,None]
st=np.hstack([np.dstack([cl,aa*.55*255]),np.dstack([cl,aa*255])])
Image.fromarray(cv2.cvtColor(np.clip(st,0,255).astype(np.uint8),cv2.COLOR_BGRA2RGBA)).save(f'/home/claude/aster/src/img/rig/{n}_eyes.png')
json.dump({'eye':EX,'bb':[int(v) for v in BB],'s':sc,'align':'ORB+RANSAC partial affine'},open(f'eyegeo_{n}.json','w'))
sp=Image.open(f'/home/claude/aster/src/img/splash/{n}.webp').convert('RGBA');e=Image.open(f'/home/claude/aster/src/img/rig/{n}_eyes.png')
cl_im=e.crop((EX[2],0,2*EX[2],EX[3]));hf=e.crop((0,0,EX[2],EX[3]));p1=sp.copy();p1.alpha_composite(cl_im,(EX[0],EX[1]));p2=sp.copy();p2.alpha_composite(hf,(EX[0],EX[1]))
z=(EX[0]-40,EX[1]-40,EX[0]+EX[2]+40,EX[1]+EX[3]+40);S=Image.new('RGBA',((z[2]-z[0])*3,z[3]-z[1]),(60,60,80,255))
for i,im in enumerate([sp,p2,p1]):S.alpha_composite(im.crop(z),(i*(z[2]-z[0]),0))
S.resize((S.width*3,S.height*3)).convert('RGB').save(f'/tmp/eyes_{n}.jpg')
