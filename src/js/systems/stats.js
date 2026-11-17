/* =====================================================================
   STAT HERO, SENJATA & COMBAT POWER (CP)
   teamCP() dipakai juga untuk Arena PvP (pencocokan lawan & bonus stat tim)
   ===================================================================== */
const maxLvRaw=id=>MAX_LV[HD[id].r]+S.heroes[id].lb*LB_LV;
const maxLv=id=>Math.min(maxLvRaw(id),HERO_LV_BY_ACC(S.lv));
const lvCost=lv=>Math.round(80*lv*(1+lv*.06));
function wpnOf(id){const o=S.heroes[id];return o&&o.wpn&&WD[o.wpn]&&S.weapons[o.wpn]?WD[o.wpn]:null}
// stat senjata dari level, Limit Break & penempaan senjata itu sendiri
function wpnStats(wid){const w=WD[wid],o=S.weapons[wid]||newWpn(),ref=o.ref||0,lv=o.lv||1,lb=o.lb||0,k=(1+WPN_REFINE*ref)*(1+WPN_ATK_GROWTH*(lv-1))*(1+WPN_LB_BONUS*lb);
 return{atk:Math.round(w.atk*k),sub:w.sub[0],subv:Math.round(w.sub[1]*(1+WPN_REFINE*ref)*(1+WPN_SUB_LB*lb)*10)/10,ref,lv,lb}}
function heroStats(id){const h=HD[id],o=S.heroes[id],m=RAR[h.r]*(1+LV_GROWTH*(o.lv-1))*(1+LB_GROWTH*o.lb),ro=ROLE[h.role];
 let hp=Math.round(BASE_STAT.hp*m*ro.hp),atk=Math.round(BASE_STAT.atk*m*ro.atk),def=Math.round(BASE_STAT.def*m*ro.def),crit=BASE_CRIT;
 const w=wpnOf(id);
 if(w){const ws=wpnStats(S.heroes[id].wpn);atk+=ws.atk;if(ws.sub==='crit')crit+=ws.subv;if(ws.sub==='hp')hp=Math.round(hp*(1+ws.subv/100));if(ws.sub==='def')def=Math.round(def*(1+ws.subv/100))}
 const ar=gearOf(id,'armor'),ac=gearOf(id,'acc');if(ar){const g=gearStats(S.heroes[id].ar);hp+=g.hp;def+=g.def}if(ac){const g=gearStats(S.heroes[id].ac);atk+=g.atk;crit+=g.crit}
 return{hp,atk,def,crit:Math.round(crit*10)/10,sig:w&&w.owner===id?w.sig:0}}
const powerOf=s=>Math.round(s.hp*.1+s.atk*2+s.def*1.5+s.atk*((s.crit||BASE_CRIT)-BASE_CRIT)/100*2+(s.sig?s.atk*s.sig*1.5:0));
const heroPow=id=>powerOf(heroStats(id));
function teamCP(team=S.team){const ids=team.filter(Boolean);const base=ids.reduce((a,id)=>a+heroPow(id),0);const parts=[];let bonus=0;
 const add=(n,b)=>{bonus+=b;parts.push([n,b])};
 const ec={};ids.forEach(id=>ec[HD[id].el]=(ec[HD[id].el]||0)+1);const mx=Math.max(0,...Object.values(ec));
 if(CP_BONUS.elem[mx]){const e=Object.keys(ec).find(k=>ec[k]===mx);add(T('Resonansi {e} ×{n}',{e:EL[e].n,n:mx}),CP_BONUS.elem[mx])}
 const roles=new Set(ids.map(id=>HD[id].role));if(roles.has('tanker')&&roles.has('support'))add(T('Formasi Seimbang (Penjaga + Pendukung)'),CP_BONUS.balance);
 if(ids.length===4)add(T('Tim Lengkap (4 hero)'),CP_BONUS.full);
 const sigs=ids.filter(id=>{const w=wpnOf(id);return w&&w.owner===id}).length;if(sigs)add(T('Senjata Signature ×{n}',{n:sigs}),CP_BONUS.sig*sigs);
 return{total:Math.round(base*(1+bonus)),base,bonus,parts,ids}}
const teamPow=()=>teamCP().total;
