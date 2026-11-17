import numpy as np,json
from PIL import Image,ImageDraw,ImageFilter
CFG={
'seraphine':dict(head=(420,95),dep=(70,470),
 hair=[[(0,120),(330,80),(360,140),(340,230),(230,300),(200,480),(0,480)],[(460,80),(560,120),(700,250),(730,440),(560,440),(560,300),(520,200)]],
 excl_poly=[[(290,220),(370,220),(370,330),(320,390),(230,390),(230,300)],[(405,195),(535,195),(575,250),(565,375),(480,375),(470,260)],[(320,165),(515,165),(515,480),(320,480)]],
 excl_seg=[((335,455),(38,18),26)],
 cloth_y=470,legs=[[(225,515),(585,515),(585,1100),(200,1100)]],hem=(480,450,400,400),
 glow=None),
'sakuya':dict(head=(465,140),dep=(60,480),
 hair=[[(40,150),(420,110),(440,200),(360,260),(160,330),(30,430)],[(520,190),(640,230),(770,300),(770,420),(620,380),(560,300)],[(0,330),(260,330),(270,470),(210,640),(0,640)]],
 excl_poly=[[(195,330),(305,330),(305,430),(195,430)],[(505,295),(605,295),(605,375),(505,375)],[(330,200),(560,200),(560,470),(330,470)]],
 excl_seg=[((175,372),(785,515),20),((105,655),(425,375),22)],
 cloth_y=430,legs=[[(40,820),(170,820),(170,1100),(40,1100)],[(560,870),(700,870),(700,1100),(560,1100)]],hem=(450,560,420,420),
 sleeve=[[(140,230),(340,230),(340,580),(140,580)],[(540,320),(760,320),(760,720),(540,720)]],
 glow=dict(kind='pink',zones=[[(330,430),(800,380),(800,630),(330,630)]],circles=[(175,115,45),(570,235,40),(65,600,45),(690,640,45)])),
'raika':dict(head=(415,150),dep=(90,440),
 hair=[[(20,190),(320,170),(330,300),(260,330),(200,470),(20,470)],[(160,150),(290,150),(290,270),(160,270)],[(480,90),(580,90),(580,180),(480,180)]],
 excl_poly=[[(300,220),(450,220),(450,300),(300,300)],[(480,170),(760,140),(770,260),(500,290)],[(330,230),(520,230),(520,470),(330,470)],[(175,20),(575,20),(575,150),(175,150)]],
 excl_seg=[((560,0),(760,300),40),((690,300),(560,520),40),((420,255),(795,128),12)],
 cloth_y=440,legs=[[(250,480),(560,480),(580,900),(240,900)],[(150,840),(260,840),(260,1100),(110,1100)],[(500,840),(680,840),(680,1100),(500,1100)]],hem=(460,420,420,400),
 sleeve=[[(195,290),(310,290),(310,440),(195,440)],[(495,240),(630,240),(630,400),(495,400)]],
 glow=dict(kind='cyan',zones=[[(530,0),(809,0),(809,530),(520,530)]],circles=[])),
'marisa':dict(head=(425,245),dep=(75,430),
 hair=[[(10,200),(340,180),(360,260),(330,300),(300,470),(240,520),(90,560),(0,560)],
       [(480,230),(560,250),(640,300),(800,330),(800,560),(650,560),(580,420),(540,330)],
       [(120,0),(500,0),(500,120),(330,160),(240,210),(120,210)],
       [(0,560),(330,560),(330,620),(300,700),(560,800),(560,920),(200,920),(30,860),(0,700)],
       [(600,820),(800,820),(800,920),(600,920)]],
 excl_poly=[[(365,195),(500,195),(500,330),(365,330)],[(330,290),(570,290),(570,540),(330,540)],[(225,370),(380,370),(380,480),(225,480)],
            [(280,560),(570,560),(570,1100),(280,1100)],[(600,150),(660,150),(660,215),(600,215)]],
 excl_seg=[((690,95),(515,520),14)],
 cloth_y=430,legs=[[(280,600),(560,600),(560,1100),(280,1100)]],hem=(470,420,430,330),
 sleeve=[[(560,440),(800,440),(800,940),(560,940)],[(560,120),(810,120),(810,300),(560,300)],[(0,470),(300,470),(300,690),(0,690)]],
 glow=dict(kind='cyan',zones=[],circles=[(690,95,72),(745,180,22),(605,60,20),(80,165,22),(160,545,14),(770,740,32),(525,945,26),(355,165,18),(610,960,20)])),
}
def build(n,c):
    im=Image.open(f'/home/claude/aster/src/img/splash/{n}.webp').convert('RGBA');W,H=im.size
    a=np.asarray(im).astype(np.float32)/255;al=a[...,3]
    yy,xx=np.mgrid[0:H,0:W].astype(np.float32)
    def poly(ps):
        m=Image.new('L',(W,H),0)
        for p in ps:ImageDraw.Draw(m).polygon(p,fill=255)
        return np.asarray(m)>0
    def seg(p0,p1):
        (x0,y0),(x1,y1)=p0,p1;dx,dy=x1-x0,y1-y0;t=np.clip(((xx-x0)*dx+(yy-y0)*dy)/(dx*dx+dy*dy),0,1);return np.hypot(xx-(x0+t*dx),yy-(y0+t*dy))
    def blur(b,r):return np.asarray(Image.fromarray((np.clip(b,0,1)*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r))).astype(np.float32)/255
    excl=poly(c['excl_poly'])
    for p0,p1,w in c['excl_seg']:excl|=seg(p0,p1)<w
    zone=(poly(c['hair'])&~excl).astype(np.float32)
    hx,hy=c['head'];d0,dr=c['dep'];dep=np.clip((np.hypot(xx-hx,(yy-hy)*1.1)-d0)/dr,0,1)**1.1
    hairw=blur(zone,18)*dep
    hy0,hspan,cx,lat=c['hem']
    cz=((yy>c['cloth_y'])&~poly(c['legs'])&~excl).astype(np.float32)
    hem=np.clip((yy-hy0)/hspan,0,1)**1.25*(0.4+0.6*np.clip(np.abs(xx-cx)/lat,0,1))
    clothw=blur(cz,16)*hem
    if 'sleeve' in c:
        sl=(poly(c['sleeve'])&~excl).astype(np.float32);clothw=np.maximum(clothw,blur(sl,14)*0.45*np.clip((yy-200)/400,0.3,1))
    # glow: piksel efek bercahaya yang berkedip
    g=np.zeros_like(al)
    if c['glow']:
        r,gg,b=a[...,0],a[...,1],a[...,2];mx=np.maximum(np.maximum(r,gg),b);mn=np.minimum(np.minimum(r,gg),b);sat=(mx-mn)/(mx+1e-5)
        if c['glow']['kind']=='cyan':g=((b>.75)&(gg>.6)&(r<.6)&(sat>.3)).astype(np.float32)
        else:g=((r>.8)&(sat>.15)&(gg>.3)&(b>.4)&(r>b)).astype(np.float32)
        Z=poly(c['glow']['zones'])
        for (cx0,cy0,r0) in c['glow']['circles']:Z|=np.hypot(xx-cx0,yy-cy0)<r0
        if c['glow']['kind']=='pink':g=np.maximum(g*Z,((r>.8)&(gg>.35)&(b<.75)&(sat>.25)).astype(np.float32)*np.isin(1,[1])*0)  # api rubah & tebasan
        g=g*Z;g=np.maximum(g,blur(g,3))*(al>.05)
    M=np.dstack([hairw*255,clothw*255,g*255,np.full_like(al,255)]).clip(0,255).astype(np.uint8)
    Image.fromarray(M,'RGBA').resize((W//2,H//2),Image.BILINEAR).save(f'{n}_mask.png')
    base=np.asarray(Image.alpha_composite(Image.new('RGBA',im.size,(40,40,60,255)),im).convert('RGB')).astype(np.float32)
    v=np.dstack([hairw*255,clothw*255,g*255+excl*50])
    Image.fromarray((base*.45+v*.7).clip(0,255).astype(np.uint8)).resize((W*600//H,600)).save(f'{n}_mvis.jpg',quality=85)
for n,c in CFG.items():build(n,c)
json.dump({n:{'head':c['head']} for n,c in CFG.items()},open('cfg.json','w'))
