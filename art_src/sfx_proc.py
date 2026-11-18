# Proses SFX Higgsfield (mirelo) -> src/sfx/<kunci>.mp3 : trim hening, potong ekor, fade, normalisasi puncak, mono 64k
import subprocess,numpy as np,sys,os
SRC,DST=sys.argv[1],sys.argv[2];SR=44100
CAP={'click':.22,'tab':.2,'close':.3,'tap':.4,'swing':.35,'hit':.4,'hurt':.4,'block':.45,'card':.45,'deny':.45,'open':.5,'equip':.7,'coin':.8,'star':.6,'hit_crit':.6,'claim':1.0}
for f in sorted(os.listdir(SRC)):
  if not f.endswith('.mp3'):continue
  k=f[:-4];raw=subprocess.run(['ffmpeg','-v','error','-i',os.path.join(SRC,f),'-ac','1','-ar',str(SR),'-f','f32le','-'],capture_output=True).stdout
  x=np.frombuffer(raw,np.float32).copy();x-=x.mean()
  w=int(SR*.005);env=np.array([np.abs(x[i:i+w]).max() for i in range(0,len(x)-w,w)]);pk=env.max()
  on=np.where(env>pk*10**(-36/20))[0];s=max(0,on[0]*w-int(SR*.003));e=min(len(x),(on[-1]+1)*w)
  x=x[s:e]
  if k in CAP:x=x[:int(SR*CAP[k])]
  fo=min(len(x)//3,int(SR*.06));x[-fo:]*=np.linspace(1,0,fo)**2
  fi=int(SR*.002);x[:fi]*=np.linspace(0,1,fi)
  x=x/np.abs(x).max()*10**(-1/20)
  subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar',str(SR),'-ac','1','-i','-','-b:a','64k',os.path.join(DST,k+'.mp3')],input=x.astype(np.float32).tobytes())
  print(f"{k}:{len(x)/SR:.2f}",end=' ')
