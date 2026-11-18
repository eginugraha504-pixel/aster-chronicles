# Patch ekspresi wajah untuk cerita: python3 expr.py <hero_e> [<hero_e>...]
# Input : /home/claude/gen/story/crops/<hero>.png (potongan kepala dari art_src/splash/<hero>.png, kotak di crops/info.json)
#         /home/claude/gen/story/ex/<hero>_<e>.png (hasil edit nano_banana_pro)
# Output: src/story/ex/<hero>_<e>.webp (RGBA, hanya area wajah yang berubah) + art_src/story/ex_geo.json {key:[x,y,w,h]} dalam koordinat splash webp
import cv2,numpy as np,json,sys,os
from PIL import Image
G='/home/claude/gen/story';OUT='/home/claude/aster/src/story/ex';os.makedirs(OUT,exist_ok=True)
info=json.load(open(G+'/crops/info.json'));gp='/home/claude/aster/art_src/story/ex_geo.json'
geo=json.load(open(gp)) if os.path.exists(gp) else {}
for key in sys.argv[1:]:
    h=key.rsplit('_',1)[0];I=info[h]
    cr=cv2.imread(f'{G}/crops/{h}.png');ed=cv2.imread(f'{G}/ex/{key}.png')[...,:3]
    edr=cv2.resize(ed,(cr.shape[1],cr.shape[0]),interpolation=cv2.INTER_AREA)
    g1,g2=cv2.cvtColor(cr,cv2.COLOR_BGR2GRAY),cv2.cvtColor(edr,cv2.COLOR_BGR2GRAY)
    orb=cv2.ORB_create(5000);k1,d1=orb.detectAndCompute(g1,None);k2,d2=orb.detectAndCompute(g2,None)
    m=sorted(cv2.BFMatcher(cv2.NORM_HAMMING,crossCheck=True).match(d1,d2),key=lambda x:x.distance)[:1200]
    M,inl=cv2.estimateAffinePartial2D(np.float32([k2[x.trainIdx].pt for x in m]),np.float32([k1[x.queryIdx].pt for x in m]),method=cv2.RANSAC,ransacReprojThreshold=2.0)
    al=cv2.warpAffine(edr,M,(cr.shape[1],cr.shape[0]),flags=cv2.INTER_CUBIC,borderMode=cv2.BORDER_REPLICATE)
    sc_ed=np.sqrt(abs(np.linalg.det(M[:,:2])))
    d=np.abs(al.astype(np.float32)-cr.astype(np.float32)).mean(2)
    H,W=d.shape;yy,xx=np.mgrid[0:H,0:W]
    # area wajah: elips di tengah potongan (wajah ada di ~50%,~50%)
    ell=((xx-W*.5)/(W*.36))**2+((yy-H*.52)/(H*.40))**2<1
    mk=(cv2.GaussianBlur(d,(0,0),2)>14)&ell
    mk=cv2.morphologyEx(mk.astype(np.uint8),cv2.MORPH_CLOSE,np.ones((15,15),np.uint8))
    n,lab,st,_=cv2.connectedComponentsWithStats(mk);keep=np.zeros_like(mk)
    for i in range(1,n):
        if st[i,4]>W*H*0.0015:keep[lab==i]=1
    keep=cv2.dilate(keep,np.ones((13,13),np.uint8))
    a=cv2.GaussianBlur(keep.astype(np.float32),(0,0),6);a=np.clip(a*1.6,0,1)*ell
    ys,xs=np.where(a>0.01);x0,y0,x1,y1=xs.min(),ys.min(),xs.max()+1,ys.max()+1
    rgba=np.dstack([cv2.cvtColor(al,cv2.COLOR_BGR2RGB),(a*255).astype(np.uint8)])[y0:y1,x0:x1]
    # koordinat splash webp
    bb,s=I['bb'],I['sc'];bx,by=I['box'][0],I['box'][1]
    wx,wy=(bx+x0-bb[0])*s,(by+y0-bb[1])*s;ww,wh=(x1-x0)*s,(y1-y0)*s
    im=Image.fromarray(rgba,'RGBA').resize((max(1,round(ww)),max(1,round(wh))),Image.LANCZOS)
    im.save(f'{OUT}/{key}.webp',quality=88,method=6)
    geo[key]=[round(wx,1),round(wy,1),im.width,im.height]
    print(key,'inliers',int(inl.sum()),'scale',round(sc_ed,3),'patch',geo[key],'cover',round(float((a>0.5).mean()),3))
json.dump(geo,open(gp,'w'),indent=0)
