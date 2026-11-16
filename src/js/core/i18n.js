/* =====================================================================
   BAHASA (i18n) — Indonesia (asli), English, 日本語
   ---------------------------------------------------------------------
   Teks UI   : T('teks Indonesia', {var}) -> dicari di I18N[bahasa]['teks Indonesia']
               placeholder {nama} diganti nilai var. Kalau belum diterjemahkan, teks asli dipakai.
   Teks data : nama hero, senjata, musuh, misi, event, surat, dll. ditimpa dari I18D[bahasa]
               (lihat js/lang/en.js & ja.js). Data asli (Indonesia) disimpan otomatis.
   Tambah bahasa: buat js/lang/<kode>.js, daftarkan di LANGS & manifest.
   ===================================================================== */
const LANGS={id:{n:'Bahasa Indonesia',loc:'id-ID'},en:{n:'English',loc:'en-US'},ja:{n:'日本語',loc:'ja-JP'}};
const I18N={},I18D={};
let LANG='id';
function T(s,v){let r=(LANG!=='id'&&I18N[LANG]&&I18N[LANG][s])||s;if(v)r=r.replace(/\{(\w+)\}/g,(m,k)=>v[k]!=null?v[k]:m);return r}
// daftar data yang bisa diterjemahkan: [koleksi, kunci-di-I18D, field]
const I18_FIELDS=()=>[
 [HEROES,'heroes',['name','title','lore','sk','lines','poke']],[WEAPONS,'weapons',['name','sigTxt']],[GEAR,'gear',['name']],
 [Object.entries(ENEMY).map(([id,e])=>(e.id=id,e)),'enemies',['n']],
 [BANNERS,'banners',['n','sn','desc']],[MISSIONS,'missions',['n']],[ACH,'ach',['n']],
 [EVENTS,'events',['n','desc','tag']],[MAILS,'mails',['from','title','body']],
 [WORLDS.map((w,i)=>(w.id=String(i),w)),'worlds',['n','stages','intro']],
 [DUNGEONS,'dungeons',['n','desc']],[MATS,'mats',['n','desc']],
 [Object.entries(EL).map(([id,e])=>(e.id=id,e)),'el',['n']],[Object.entries(ROLE).map(([id,e])=>(e.id=id,e)),'role',['n']]];
const I18_ORIG={};
function applyDataLang(){const D=I18D[LANG]||{};
 for(const[list,key,fields]of I18_FIELDS()){for(const o of list){const ok=key+':'+o.id;if(!I18_ORIG[ok]){I18_ORIG[ok]={};for(const f of fields)I18_ORIG[ok][f]=o[f]}
  const tr=(D[key]||{})[o.id]||{};for(const f of fields){const v=LANG==='id'?undefined:tr[f];o[f]=v!==undefined?v:I18_ORIG[ok][f]}}}
 // misi di dalam event
 for(const e of EVENTS)if(e.missions)for(const m of e.missions){const ok='evm:'+e.id+':'+m.id;if(!I18_ORIG[ok])I18_ORIG[ok]=m.n;const tr=((D.events||{})[e.id]||{}).m||{};m.n=LANG!=='id'&&tr[m.id]||I18_ORIG[ok]}
 // kamus kecil (objek kunci->teks)
 for(const[obj,key]of[[SKT,'skt'],[WCLASS,'wclass'],[SUBN,'subn']]){if(!I18_ORIG['o:'+key])I18_ORIG['o:'+key]={...obj};const tr=D[key]||{};for(const k in obj)obj[k]=LANG!=='id'&&tr[k]||I18_ORIG['o:'+key][k]}
 // nama tahap mengikuti dunia
 for(const st of SLIST)st.name=WORLDS[st.wi].stages[st.s]}
function setLang(l){if(!LANGS[l])l='id';LANG=l;if(typeof S!=='undefined'&&S)S.lang=l;document.documentElement.lang=l;applyDataLang()}
