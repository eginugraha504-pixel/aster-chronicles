# Rig live2d tachie cerita: python3 rig.py [id ...]  (default: semua di tc_geo.json)
#   - <id>_e.webp : atlas kedip [setengah | tertutup] dari patch _b (patch _b lalu dihapus)
#   - <id>_r.webp : masker ½ resolusi, R = bobot rambut (warna rambut di samping wajah, makin bawah makin lentur),
#                   G = bobot kain (tepi siluet antara pinggang–lutut), B = 0
#   - tc_rig.json : geometri untuk STORY_ASSET.tc  (dibaca tools/build.py)
import cv2,numpy as np,json,sys,os
from PIL import Image
D=os.path.dirname(os.path.abspath(__file__));SRC='/home/claude/aster/src/story'
G=json.load(open('/home/claude/gen/tachie/geo.json'));TG=json.load(open(D+'/tc_geo.json'))
rp=D+'/tc_rig.json';RG=json.load(open(rp)) if os.path.exists(rp) else {}
CFG=json.load(open(D+'/rig_cfg.json')) if os.path.exists(D+'/rig_cfg.json') else {}
ids=sys.argv[1:] or list(TG)
for k in ids:
  g=G.get(k) or {'npc':1,'face':[0,0,0,0]};npc=bool(g.get('npc'));c=CFG.get(k,{});T=TG.get(k,{})
  base=Image.open(f"{SRC}/{'npc' if npc else 'tc'}/{k}.webp").convert('RGBA');W,H=base.size;arr=np.array(base);A=arr[...,3].astype(np.float32)/255
  fx,fy,fw,fh=g['face']
  if not fw and 'b' in T:  # tanpa deteksi: dari kotak patch mata
    e=T['b'];fw=fh=e[2]*1.5;fx=e[0]+e[2]/2-fw/2;fy=e[1]-fh*.42
  elif not fw:  # NPC tanpa wajah terdeteksi/edit: dari npc_geo (titik wajah %)
    ng=json.load(open(D+'/../story/npc_geo.json'))[k];fw=fh=.09*H;fx=ng[2]/100*W-fw/2;fy=ng[3]/100*H-fh*.5
  cx=fx+fw/2;r={'w':W,'h':H,'npc':int(npc),'face':[round(fx),round(fy),round(fw),round(fh)]}
  # --- atlas kedip
  if 'b' in T and os.path.exists(f'{SRC}/tc/{k}_b.webp'):
    b=np.array(Image.open(f'{SRC}/tc/{k}_b.webp').convert('RGBA')).astype(np.float32);h2=b.copy();h2[...,3]*=.55
    Image.fromarray(np.hstack([h2,b]).astype(np.uint8),'RGBA').save(f'{SRC}/tc/{k}_e.webp',quality=90,method=6);os.remove(f'{SRC}/tc/{k}_b.webp')
  if 'b' in T:r['eye']=T['b']
  if 'm' in T:r['mouth']=T['m']
  r['ex']={e:T[e] for e in 'akd' if e in T}
  # --- titik tubuh (koordinat tachie)
  r['head']=[round(cx),round(fy+fh*.55)];r['chest']=[round(cx),round(fy+fh*1.6)]
  r['breast']=round(fy+fh*1.35);r['waist']=round(max(fy+fh*c.get('waist',2.3),.36*H))
  # --- masker
  lab=cv2.cvtColor(arr[...,:3],cv2.COLOR_RGB2LAB).astype(np.float32)
  yy,xx=np.mgrid[0:H,0:W]
  sideL=(xx>fx-.32*fw)&(xx<fx+.06*fw)&(yy>fy+.2*fh)&(yy<fy+.95*fh);sideR=(xx>fx+.94*fw)&(xx<fx+1.32*fw)&(yy>fy+.2*fh)&(yy<fy+.95*fh)
  seed=(sideL|sideR)&(A>.85)
  sk=(xx>fx+.35*fw)&(xx<fx+.65*fw)&(yy>fy+.55*fh)&(yy<fy+.8*fh)&(A>.9)
  skin=np.zeros((H,W),bool)
  if sk.sum()>30:sc_=np.median(lab[sk],0);skin=np.sqrt((((lab-sc_)**2)*np.array([.3,1,1],np.float32)).sum(2))<13
  R=np.zeros((H,W),np.float32)
  if seed.sum()>50 and c.get('hair',1):
    wv=np.array([.35,1,1],np.float32);dE=np.full((H,W),1e9,np.float32)
    top=(xx>fx+.25*fw)&(xx<fx+.75*fw)&(yy>fy+.02*fh)&(yy<fy+.18*fh)&(A>.85)
    for sd in (sideL&seed,sideR&seed,top):
      if sd.sum()>40:hc=np.median(lab[sd],0);dE=np.minimum(dE,np.sqrt((((lab-hc)**2)*wv).sum(2)))
    cand=((dE<c.get('tol',22))&(A>.15)&~skin).astype(np.uint8)
    cand=cv2.morphologyEx(cand,cv2.MORPH_OPEN,np.ones((3,3),np.uint8))
    n,lb,st,_=cv2.connectedComponentsWithStats(cand,connectivity=8);ok=np.zeros(n,bool)
    for i in np.unique(lb[seed&(cand>0)]):ok[i]=i>0
    hair=ok[lb]
    face=((xx-cx)/(fw*.42))**2+((yy-(fy+fh*.58))/(fh*.5))**2<1
    hair&=~face;hair&=yy<fy+fh*c.get('hmax',4.2)
    R=hair.astype(np.float32)*np.clip((yy-(fy+fh*.35))/(fh*2.4),0,1)**1.1
    R=np.maximum(R,hair*np.clip(np.abs(xx-cx)/(fw*1.6),0,1)*.6)   # rambut yang jauh ke samping ikut lentur
  # kain: tepi siluet antara pinggang dan lutut
  w0=r['waist'];dist=cv2.distanceTransform((A>.5).astype(np.uint8),cv2.DIST_L2,5)
  band=np.clip((yy-w0)/(.05*H),0,1)*np.clip(1-(yy-(w0+.16*H))/(.07*H),0,1)
  Gm=np.clip(1-dist/(.035*H),0,1)*band*c.get('cloth',1.0)*(A>.05)*~skin
  Gm=np.maximum(Gm,np.clip(1-dist/(.03*H),0,1)*np.clip((yy-(fy+fh*1.4))/(fh),0,1)*np.clip(1-(yy-w0)/(.05*H),0,1)*.35*c.get('cloth',1.0))  # sedikit di lengan baju/jubah atas
  R=cv2.GaussianBlur(R,(0,0),6)*c.get('hairw',1.0);Gm=cv2.GaussianBlur(Gm.astype(np.float32),(0,0),5)
  m=np.dstack([R,Gm,np.zeros_like(R)]);m=np.clip(m*255,0,255).astype(np.uint8)
  Image.fromarray(m,'RGB').resize((W//2,H//2),Image.BILINEAR).save(f'{SRC}/tc/{k}_r.webp',quality=92)
  vis=(arr[...,:3]*.45+np.dstack([R*255,Gm*255,np.zeros_like(R)])*.55).astype(np.uint8)
  Image.fromarray(vis).resize((W//3,H//3)).save(f'/home/claude/gen/tachie/pv/mask_{k}.jpg',quality=80)
  RG[k]=r;print(k,'hair',round(float((R>.05).mean()),3),'cloth',round(float((Gm>.05).mean()),3))
json.dump(RG,open(rp,'w'),separators=(',',':'))
