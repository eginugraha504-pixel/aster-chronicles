import numpy as np,scipy.ndimage as nd
from PIL import Image
def comps(path,minarea=0.002,crop=None):
    a=np.array(Image.open(path).convert('RGB'));
    if crop:H,W,_=a.shape;a=a[int(crop[1]*H):int(crop[3]*H),int(crop[0]*W):int(crop[2]*W)]
    r,g,b=[a[...,i].astype(int) for i in range(3)]
    bg=(g<120)&(r>140)&(b>140)&(abs(r-b)<90)
    fg=nd.binary_closing(~bg,iterations=3);fg=nd.binary_fill_holes(fg)
    lab,n=nd.label(fg);out=[]
    for i,s in enumerate(nd.find_objects(lab)):
        area=(lab[s]==i+1).sum()
        if area<minarea*fg.size:continue
        out.append((s[0].start,s[1].start,s[0].stop,s[1].stop,area))
    return a,out
if __name__=='__main__':
    import sys
    for f in sys.argv[1:]:
        a,o=comps(f);print(f,a.shape[:2],[(y0,x0,y1-y0,x1-x0) for y0,x0,y1,x1,_ in sorted(o)])
