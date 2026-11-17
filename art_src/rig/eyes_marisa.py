import cv2,numpy as np,json
from PIL import Image
o=cv2.imread('/home/claude/aster/art_src/splash/marisa.png',cv2.IMREAD_UNCHANGED).astype(np.float32)
al=cv2.imread('al_c0.png').astype(np.float32)
s=2301/1100;cx,cy=int(28+430*s),int(14+250*s)
d=np.abs(al-o[...,:3]).mean(2)
R=(cx-230,cy-90,cx+150,cy+80)
sub=(d[R[1]:R[3],R[0]:R[2]]>45).astype(np.uint8)
n,lab,st,_=cv2.connectedComponentsWithStats(sub)
cand=[i for i in range(1,n) if st[i,4]>400 and st[i,0]>2 and st[i,1]>2]
big=sorted(cand,key=lambda i:-st[i,4])[:2];print([st[i].tolist() for i in big])
m=np.isin(lab,big).astype(np.uint8)
ys,xs=np.nonzero(m);bx0,by0,bx1,by1=xs.min()+R[0],ys.min()+R[1],xs.max()+R[0],ys.max()+R[1];print('eye bbox orig',bx0,by0,bx1,by1)
full=np.zeros(d.shape,np.uint8);full[R[1]:R[3],R[0]:R[2]]=m*255
full=cv2.dilate(full,np.ones((25,25),np.uint8));full=cv2.GaussianBlur(full,(0,0),7)
pad=30;X0,Y0,X1,Y1=bx0-pad,by0-pad,bx1+pad,by1+pad
box=(slice(Y0,Y1),slice(X0,X1));ring=(d[box]<12)&(full[box]<10)&(o[box][...,3]>200)
gain=(o[box][...,:3][ring].mean(0)+1)/(al[box][ring].mean(0)+1)
patch=np.clip(al[box]*gain,0,255);a=(full[box]/255.)
sc=1100/2301;EX=[int(round((X0-28)*sc)),int(round((Y0-14)*sc)),int(round((X1-X0)*sc)),int(round((Y1-Y0)*sc))];print('RIG eye',EX)
def to1100(img):
    M=np.float32([[1/sc,0,EX[0]/sc+28],[0,1/sc,EX[1]/sc+14]])
    return cv2.warpAffine(img,M,(EX[2],EX[3]),flags=cv2.WARP_INVERSE_MAP|cv2.INTER_AREA)
fullC=np.zeros_like(o[...,:3]);fullC[box]=patch;A=np.zeros(d.shape,np.float32);A[box]=a
cl=to1100(fullC);aa=to1100(A)[...,None]
st_=np.hstack([np.dstack([cl,aa*.55*255]),np.dstack([cl,aa*255])])
Image.fromarray(cv2.cvtColor(np.clip(st_,0,255).astype(np.uint8),cv2.COLOR_BGRA2RGBA)).save('marisa_eyes.png')
json.dump({'eye':EX,'bb':[28,14,1732,2315],'s':sc,'align':'ORB+RANSAC affine','src_job':'edd88b6e-3a3a-4879-974b-ccf0a62252c9'},open('eyegeo_marisa.json','w'))
sp=Image.open('/home/claude/aster/src/img/splash/marisa.webp').convert('RGBA')
e=Image.open('marisa_eyes.png');cl_im=e.crop((EX[2],0,2*EX[2],EX[3]));hf=e.crop((0,0,EX[2],EX[3]))
p1=sp.copy();p1.alpha_composite(cl_im,(EX[0],EX[1]));p2=sp.copy();p2.alpha_composite(hf,(EX[0],EX[1]))
z=(EX[0]-40,EX[1]-40,EX[0]+EX[2]+40,EX[1]+EX[3]+40)
S=Image.new('RGBA',((z[2]-z[0])*3,z[3]-z[1]),(60,60,80,255))
for i,im in enumerate([sp,p2,p1]):S.alpha_composite(im.crop(z),(i*(z[2]-z[0]),0))
S=S.resize((S.width*2,S.height*2));S.convert('RGB').save('eyes_prev.jpg')
