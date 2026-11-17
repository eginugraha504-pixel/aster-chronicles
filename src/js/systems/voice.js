/* =====================================================================
   VOICE — dub Jepang tiap hero (ElevenLabs v4 lewat Higgsfield)
   ---------------------------------------------------------------------
   Klip ditanam oleh tools/build.py dari src/voice/<kunci>.mp3 -> VOICE_SRC.
   Kunci klip:
     <hero>_l<i>  dialog idle ke-i (HD[hero].lines[i])
     <hero>_p<i>  dialog saat disentuh ke-i (HD[hero].poke[i])
     <hero>_sk    teriakan nama skill (cut-in battle)
   Teks, aktor (voice_id) & pembuatan klip: art_src/voice/voices.json + tools/voice.py (docs/ASET.md).
   Suara selalu berbahasa Jepang apa pun bahasa UI (gaya dub gacha).
   Pengaturan: S.voice (true/false, bawaan hidup), S.vvol (0..1, bawaan .75).
   Hanya satu klip berbunyi pada satu waktu: klip baru memotong yang lama.
   ===================================================================== */
const VOX={buf:{},cur:null,gain:null,tk:0};
const voxHas=k=>typeof VOICE_SRC!=='undefined'&&!!VOICE_SRC[k];
const voxOn=()=>typeof S!=='undefined'&&S&&S.voice!==false;
const voxVol=()=>(typeof S!=='undefined'&&S&&S.vvol!=null?S.vvol:.75);
function voxGain(){const A=audInit();if(!VOX.gain){VOX.gain=A.createGain();VOX.gain.connect(A.destination)}VOX.gain.gain.value=voxVol();return VOX.gain}
function voxSetVol(){if(VOX.gain)VOX.gain.gain.setTargetAtTime(voxVol(),AUD.ctx.currentTime,.05)}
function voxBuf(k){if(VOX.buf[k])return VOX.buf[k];
 const A=audInit(),b64=VOICE_SRC[k].split(',')[1],bin=atob(b64),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);
 return VOX.buf[k]=new Promise((res,rej)=>A.decodeAudioData(u.buffer,res,rej)).catch(()=>{delete VOX.buf[k];return null})}
function voxStop(){VOX.tk++;if(VOX.cur){try{VOX.cur.stop()}catch(e){}VOX.cur=null}}
async function voice(k){if(!voxOn()||!voxHas(k))return;const tk=++VOX.tk;
 try{const A=audInit();if(A.state==='suspended')A.resume();const b=await voxBuf(k);if(!b||tk!==VOX.tk)return;
  if(VOX.cur){try{VOX.cur.stop()}catch(e){}}const s=A.createBufferSource();s.buffer=b;s.connect(voxGain());s.start();VOX.cur=s;s.onended=()=>{if(VOX.cur===s)VOX.cur=null}}catch(e){}}
