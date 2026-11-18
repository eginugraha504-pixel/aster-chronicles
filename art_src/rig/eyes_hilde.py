# Atlas mata Hilde: edit "mata tertutup" (nano_banana_pro, job ae3aecc5…) diselaraskan ORB+RANSAC ke splash asli (al_hilde.png),
# area mata dari selisih gambar, warna kulit disamakan, lalu atlas [setengah 55% | tertutup] di koordinat splash 1100.
import cv2,numpy as np,json
from PIL import Image
o=cv2.imread('/home/claude/aster/art_src/splash/hilde.png',cv2.IMREAD_UNCHANGED).astype(np.float32)
al=cv2.imread('al_hilde.png').astype(np.float32)
BB=(8,0,1737,2267);sc=1100/(BB[3]-BB[1])
d=np.abs(al-o[...,:3]).mean(2)
R=(880,420,1120,540)
# dua elips di sekitar mata (pusat diukur dari pratinjau), supaya rambut yang dirender ulang tidak ikut
yy,xx=np.mgrid[R[1]:R[3],R[0]:R[2]]
ell=(((xx-957)/62)**2+((yy-482)/34)**2<1)|(((xx-1057)/58)**2+((yy-474)/34)**2<1)
m=((d[R[1]:R[3],R[0]:R[2]]>38)&ell).astype(np.uint8)
m=cv2.morphologyEx(m,cv2.MORPH_CLOSE,np.ones((7,7),np.uint8))
ys,xs=np.nonzero(m);bx0,by0,bx1,by1=xs.min()+R[0],ys.min()+R[1],xs.max()+R[0],ys.max()+R[1];print('eye bbox orig',bx0,by0,bx1,by1)
full=np.zeros(d.shape,np.uint8);full[R[1]:R[3],R[0]:R[2]]=m*255
full=cv2.dilate(full,np.ones((13,13),np.uint8));full=cv2.GaussianBlur(full,(0,0),5)
pad=28;X0,Y0,X1,Y1=bx0-pad,by0-pad,bx1+pad,by1+pad
box=(slice(Y0,Y1),slice(X0,X1));ring=(d[box]<12)&(full[box]<10)&(o[box][...,3]>200)
gain=(o[box][...,:3][ring].mean(0)+1)/(al[box][ring].mean(0)+1);print('gain',gain)
patch=np.clip(al[box]*gain,0,255);a=(full[box]/255.)
EX=[int(round((X0-BB[0])*sc)),int(round((Y0-BB[1])*sc)),int(round((X1-X0)*sc)),int(round((Y1-Y0)*sc))];print('RIG eye',EX)
def to1100(img):
    M=np.float32([[1/sc,0,EX[0]/sc+BB[0]],[0,1/sc,EX[1]/sc+BB[1]]])
    return cv2.warpAffine(img,M,(EX[2],EX[3]),flags=cv2.WARP_INVERSE_MAP|cv2.INTER_AREA)
fullC=np.zeros_like(o[...,:3]);fullC[box]=patch;A=np.zeros(d.shape,np.float32);A[box]=a
cl=to1100(fullC);aa=to1100(A)[...,None]
st_=np.hstack([np.dstack([cl,aa*.55*255]),np.dstack([cl,aa*255])])
Image.fromarray(cv2.cvtColor(np.clip(st_,0,255).astype(np.uint8),cv2.COLOR_BGRA2RGBA)).save('/home/claude/aster/src/img/rig/hilde_eyes.png')
json.dump({'eye':EX,'bb':list(BB),'s':sc,'align':'ORB+RANSAC partial affine','src_job':'ae3aecc5-885e-420e-b4fb-9a5a8ac44558'},open('eyegeo_hilde.json','w'))
sp=Image.open('/home/claude/aster/src/img/splash/hilde.webp').convert('RGBA')
e=Image.open('/home/claude/aster/src/img/rig/hilde_eyes.png');cl_im=e.crop((EX[2],0,2*EX[2],EX[3]));hf=e.crop((0,0,EX[2],EX[3]))
p1=sp.copy();p1.alpha_composite(cl_im,(EX[0],EX[1]));p2=sp.copy();p2.alpha_composite(hf,(EX[0],EX[1]))
z=(EX[0]-40,EX[1]-40,EX[0]+EX[2]+40,EX[1]+EX[3]+40)
S=Image.new('RGBA',((z[2]-z[0])*3,z[3]-z[1]),(60,60,80,255))
for i,im in enumerate([sp,p2,p1]):S.alpha_composite(im.crop(z),(i*(z[2]-z[0]),0))
S=S.resize((S.width*3,S.height*3));S.convert('RGB').save('/tmp/eyes_prev.jpg')
