// ---------- Helfer & Zustand ----------
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const dstr=d=>d.toLocaleDateString('sv');
const dk=()=>dstr(new Date());
const lab=(arr,v)=>(arr.find(x=>String(x[0])===String(v))||[0,'?'])[1];
const fmt=x=>String(+(+x).toFixed(2)).replace('.',',');
const num=v=>{const n=parseFloat(String(v).replace(',','.'));return isNaN(n)?'':n};
const CHK='<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const DEF=()=>({profile:null,plan:null,planCfg:'',sets:{},w:[],meas:[],food:{},manual:null,water:{},waterDone:{},pr:{},prs:[],rank:null,lastBackup:'',dlw:{},pcount:0});
let S;try{S=JSON.parse(localStorage.getItem('adonis2'))}catch(e){}
S=Object.assign(DEF(),S||{});
if(S.log&&!Object.keys(S.sets).length){for(const d in S.log){S.sets[d]={};for(const id in S.log[d]){S.sets[d][id]=S.log[d][id].map(r=>r>0?{w:num((S.wt||{})[id])||0,r,d:true}:null)}}}
delete S.log;delete S.wt;
const save=()=>{try{localStorage.setItem('adonis2',JSON.stringify(S))}catch(e){}};
const PK='adonis2_ph';
const getPh=()=>{try{return JSON.parse(localStorage.getItem(PK)||'[]')}catch(e){return []}};
const setPh=a=>{try{localStorage.setItem(PK,JSON.stringify(a));return true}catch(e){return false}};
let tab='heute',sub='verlauf',D=null,editing=false,pedit=false,sel=0,logDate=null,calOff=0,tipOpen={},warmOpen=false,warmDone={},selEx='',cmpV=50;
const today=new Date().getDay();
const LD=()=>logDate||dk();

// ---------- Plan-Generator ----------
const hasEq=(need,eq)=>eq.includes('gym')||need.every(n=>eq.includes(n));
function cands(spec,eq,lvl){let r=[];spec.split('|').forEach(g=>{r=r.concat(DB.map((e,i)=>({e,i})).filter(x=>x.e[2]===g&&hasEq(x.e[3],eq)&&x.e[7]<=lvl).sort((a,b)=>b.e[7]-a.e[7]||b.e[6]-a.e[6]||a.i-b.i).map(x=>x.e))});return r}
const mk=(e,lvl)=>({id:e[0],n:e[1],g:e[2],s:lvl===1?Math.min(e[4],3):e[4],r:e[5],w:!!e[6]});
function genPlan(P){
 const days=WORDER.filter(d=>P.days.includes(d)).slice(0,6);if(!days.length)return [];
 const tpl=TPL[days.length],used=new Set(),seen={};
 return days.map((d,i)=>{const [t,sb,slots]=tpl[i];seen[t]=(seen[t]||0)+1;const ex=[];
  slots.forEach(([g,n])=>{const c=cands(g,P.eq,P.level).filter(e=>!ex.some(x=>x.id===e[0]));
   const fresh=c.filter(e=>!used.has(e[0])),rest=c.filter(e=>used.has(e[0]));
   fresh.concat(rest).slice(0,n).forEach(e=>{used.add(e[0]);ex.push(mk(e,P.level))})});
  return {day:d,t:t+(seen[t]>1?' '+seen[t]:''),sub:sb,ex}})}

// ---------- Berechnung ----------
function validP(P){return P.age>=10&&P.age<=99&&P.height>=120&&P.height<=230&&P.weight>=30&&P.weight<=250&&P.days.length>=1}
function calc(P){
 const w=+P.weight,h=+P.height,a=+P.age,warn=[];
 const bmr=10*w+6.25*h-5*a+(P.sex==='m'?5:P.sex==='w'?-161:-78);
 const tdee=bmr*(1.3+0.05*P.days.length+({0:0,1:.1,2:.2}[P.daily]||0));
 const bmi=w/((h/100)**2);let goal=P.goal,adj=0;
 if(goal==='abnehmen'&&bmi<18.5){goal='halten';warn.push('Bei deinem BMI ('+bmi.toFixed(1)+') wird kein Kaloriendefizit empfohlen. Ich rechne mit "Gewicht halten".')}
 if(goal==='aufbau')adj=Math.max(250,Math.min(500,tdee*(bmi<20?.15:.1)));
 if(goal==='abnehmen'){adj=-Math.max(250,Math.min(600,tdee*.15));if(a<18){adj=-250;warn.push('Unter 18: nur ein kleines Defizit. Sprich das bitte mit Arzt/Ärztin ab.')}}
 let kcal=tdee+adj;const floor=Math.max(bmr,P.sex==='m'?1700:P.sex==='w'?1400:1500);
 if(goal==='abnehmen'&&kcal<floor){kcal=floor;warn.push('Untergrenze erreicht: weniger als ca. '+Math.round(floor)+' kcal sind nicht empfehlenswert.')}
 if(bmi<17.5)warn.push('Dein BMI ist sehr niedrig. Lass das bei Gelegenheit ärztlich abklären.');
 kcal=Math.round(kcal/50)*50;
 const prot=Math.round(w*(goal==='aufbau'?2:goal==='abnehmen'?2:1.6)/5)*5,fat=Math.round(kcal*.25/9),carb=Math.max(0,Math.round((kcal-prot*4-fat*9)/4));
 return {bmr,tdee,bmi,goal,kcal,prot,fat,carb,warn}}
function T(){const c=calc(S.profile),kcal=S.manual?S.manual.kcal:c.kcal,prot=S.manual?S.manual.prot:c.prot,fat=Math.round(kcal*.25/9),carb=Math.max(0,Math.round((kcal-prot*4-fat*9)/4));return {c,kcal,prot,fat,carb}}

// ---------- Sätze, Vorschläge, Rekorde ----------
const setsDone=d=>Object.values(S.sets[d]||{}).reduce((a,arr)=>a+arr.filter(x=>x&&x.d).length,0);
function setObj(id,i){const day=S.sets[LD()]=S.sets[LD()]||{},arr=day[id]=day[id]||[];return arr[i]=arr[i]||{}}
function rng(r){const m=String(r).match(/(\d+)\s*[-–]\s*(\d+)/);if(m)return [+m[1],+m[2]];const n=String(r).match(/(\d+)/);return n?[+n[1],+n[1]]:[null,null]}
const mon=d=>{const x=new Date(d);x.setHours(12,0,0,0);x.setDate(x.getDate()-((x.getDay()+6)%7));return dstr(x)};
const isDL=()=>!!S.dlw[mon(new Date())];
const effS=e=>isDL()?Math.max(1,Math.ceil(e.s/2)):e.s;
const restFor=e=>{const g=e.g;if(g==='core')return 60;if(['quad','hintere','rueckenV'].includes(g)||(e.w&&['brust','rueckenH','schulter'].includes(g)))return 120;return 90};
function lastSess(id){const ds=Object.keys(S.sets).filter(d=>d<LD()&&(S.sets[d][id]||[]).some(x=>x&&x.d)).sort();if(!ds.length)return null;const d=ds[ds.length-1];return {d,sets:S.sets[d][id].filter(x=>x&&x.d)}}
function suggest(e){const ls=lastSess(e.id),n=effS(e);
 if(!ls)return {sets:[],hint:e.w?'Erstes Mal: wähle ein Gewicht, bei dem die letzten Wiederholungen schwer, aber sauber gehen.':''};
 const [lo,hi]=rng(e.r),prev=ls.sets,lastW=Math.max(0,...prev.map(x=>+x.w||0));
 const all=hi&&prev.length>=Math.min(e.s,3)&&prev.every(x=>x.r>=hi);
 if(all&&e.w&&lastW>0){const nw=Math.round((lastW+(lastW<20?1:2.5))*4)/4;return {sets:Array(n).fill({w:nw,r:lo||hi}),hint:`Letztes Mal alles geschafft. Heute: ${fmt(nw)} kg, Ziel ${lo||hi}+ Wdh.`}}
 if(all&&!e.w)return {sets:prev.slice(0,n),hint:'Alle Wiederholungen geschafft. Nimm eine schwerere Variante oder mach es langsamer (3 Sek. runter).'};
 const sets=[];for(let i=0;i<n;i++)sets.push(prev[Math.min(i,prev.length-1)]);
 const avg=Math.round(prev.reduce((a,x)=>a+x.r,0)/prev.length);
 return {sets,hint:`Letztes Mal: ${prev.length}×${avg}${lastW>0?' mit '+fmt(lastW)+' kg':''}. Schlag das: 1 Wdh. mehr pro Satz.`}}
const score=(w,r)=>w>0?w*(1+Math.min(r,12)/30):r;
function prCheck(e,s){const sc=score(+s.w||0,+s.r),pr=S.pr[e.id],rec={s:sc,w:+s.w||0,r:+s.r,d:LD()};
 if(!pr){S.pr[e.id]=Object.assign(rec,{cd:''});return false}
 if(sc>pr.s+0.01){const cel=pr.d<LD()&&pr.cd!==LD();S.pr[e.id]=Object.assign(rec,{cd:cel?LD():pr.cd||''});if(cel){S.prs.push({d:LD(),id:e.id,n:e.n,w:rec.w,r:rec.r});return true}}
 return false}
const curEx=id=>((S.plan||[])[sel]||{ex:[]}).ex.find(x=>x.id===id);

// ---------- Streak, Wochen, Deload ----------
function streak(){const pd=new Set((S.plan||[]).map(s=>s.day));let st=0;const t=new Date();t.setHours(12);for(let i=0;i<400;i++){const d=new Date(t);d.setDate(t.getDate()-i);if(setsDone(dstr(d))>=3)st++;else if(pd.has(d.getDay())&&i>0)break}return st}
function weekTrained(){const m=mon(new Date());let n=0;for(let k=0;k<7;k++){const x=new Date(m+'T12:00');x.setDate(x.getDate()+k);if(setsDone(dstr(x))>=3)n++}return n}
function trainedWeeks(){const need=Math.min(2,(S.plan||[]).length||2);let c=0;const now=new Date();for(let i=0;i<30;i++){const d=new Date(now);d.setDate(now.getDate()-i*7);const m=mon(d);if(S.dlw[m]&&i>0)break;let n=0;for(let k=0;k<7;k++){const x=new Date(m+'T12:00');x.setDate(x.getDate()+k);if(setsDone(dstr(x))>=3)n++}if(n>=need)c++;else if(i>0)break}return c}
const trainedDays=()=>Object.keys(S.sets).filter(d=>setsDone(d)>=3).length;

// ---------- XP & Ränge ----------
function calcXP(){let sets=0,days=0;for(const d in S.sets){const n=setsDone(d);sets+=n;if(n>=3)days++}
 const fdd=Object.values(S.food).filter(a=>a.length>=3).length;
 return sets*10+days*40+S.prs.length*50+Object.keys(S.waterDone).length*15+S.w.length*10+S.meas.length*15+S.pcount*10+fdd*10}
function rankOf(xp){let i=0;RANKS.forEach((r,k)=>{if(xp>=r.xp)i=k});const cur=RANKS[i],nx=RANKS[i+1];return {i,xp,cur,nx,pct:nx?Math.round((xp-cur.xp)/(nx.xp-cur.xp)*100):100}}
function initDefs(){$('#gdefs').innerHTML=RANKS.map((r,i)=>`<linearGradient id="eg${i}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${r.c[0]}"/><stop offset="1" stop-color="${r.c[1]}"/></linearGradient>`).join('')+'<clipPath id="hexc"><path d="M50 4L90 27V73L50 96L10 73V27Z"/></clipPath>'}
function emb(i,cls){const r=RANKS[i],sh=cls&&cls.indexOf('shine')>=0;return `<svg class="emb ${cls||''}" viewBox="0 0 100 100"><path d="M50 4L90 27V73L50 96L10 73V27Z" fill="url(#eg${i})"/><path d="M50 12L83 31V69L50 88L17 69V31Z" fill="none" stroke="rgba(0,0,0,.28)" stroke-width="2"/><text x="50" y="65" text-anchor="middle">${r.g}</text>${sh?'<g clip-path="url(#hexc)"><rect class="shn" x="-40" y="0" width="22" height="100" fill="rgba(255,255,255,.4)"/></g>':''}</svg>`}
function showRankUp(i){const r=RANKS[i];let sp='';for(let k=0;k<30;k++){const a=Math.random()*6.283,dist=120+Math.random()*190;sp+=`<i class="spark" style="--x:${Math.cos(a)*dist|0}px;--y:${Math.sin(a)*dist|0}px;--dl:${(Math.random()*.5+.4).toFixed(2)}s"></i>`}
 const el=document.createElement('div');el.className='rankup';el.innerHTML=`<div class="rays"></div>${sp}<div class="ru-emb">${emb(i,'xl shine')}</div><div class="k">Neuer Rang</div><h1>${r.n}</h1><p>${esc(r.t)}</p><button class="btn" data-act="ru">Weiter</button>`;
 document.body.appendChild(el);if(navigator.vibrate)navigator.vibrate([80,60,160])}
function checkRank(){const r=rankOf(calcXP()).i;if(S.rank==null){S.rank=r;save();return}if(r>S.rank){S.rank=r;save();showRankUp(r)}}
function toast(ic,t,s){const el=document.createElement('div');el.className='toast';el.innerHTML=`<span class="ti">${ic}</span><div><b>${esc(t)}</b>${esc(s||'')}</div>`;document.body.appendChild(el);setTimeout(()=>el.remove(),3700);if(navigator.vibrate)navigator.vibrate(40)}
function xpFloat(el,txt){const r=el.getBoundingClientRect(),f=document.createElement('span');f.className='xpf';f.textContent=txt;f.style.left=(r.left+r.width/2-24)+'px';f.style.top=(r.top-6)+'px';document.body.appendChild(f);setTimeout(()=>f.remove(),1000)}
function rankChip(){const x=calcXP(),r=rankOf(x);return `<button class="rk" data-tab="ich">${emb(r.i)}<div class="rkm"><div class="row"><b>${r.cur.n}</b><span class="mut">${r.nx?x.toLocaleString('de-DE')+' / '+r.nx.xp.toLocaleString('de-DE')+' XP':'Höchster Rang'}</span></div><div class="xpbar"><i style="width:${r.pct}%"></i></div></div></button>`}

// ---------- Navigation / Render ----------
const TABS=[['heute','Heute'],['plan','Plan'],['essen','Essen'],['fort','Fortschritt'],['ich','Ich']];
const IC={heute:'<svg viewBox="0 0 24 24"><path d="M6.5 6.5v11M17.5 6.5v11M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/></svg>',plan:'<svg viewBox="0 0 24 24"><path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/></svg>',essen:'<svg viewBox="0 0 24 24"><path d="M3.5 11h17a8.5 8.5 0 0 1-17 0zM8 7.5C8 5.5 9.5 4.5 11 4M13 7.5c0-1.5 1-2.5 2.5-3"/></svg>',fort:'<svg viewBox="0 0 24 24"><path d="M3.5 17.5l5.5-6 4 3.5 7.5-9M15.5 6h5v5"/></svg>',ich:'<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c0-3.8 3.4-6 7.5-6s7.5 2.2 7.5 6"/></svg>'};
function nav(){const n=$('#nav');n.style.display=(!S.profile||editing)?'none':'flex';n.innerHTML=TABS.map(t=>`<button data-tab="${t[0]}" class="${tab===t[0]?'on':''}">${IC[t[0]]}${t[1]}</button>`).join('')}
function render(keep){const y=window.scrollY||0;if(!S.profile&&!D)D=newD();nav();const form=!S.profile||editing;
 $('#timer').style.display=(!form&&tab==='heute')?'flex':'none';
 $('#main').innerHTML=form?formView():({heute,plan,essen,fort,ich})[tab]();
 if(!form&&tab==='heute')setTimeout(prog,0);
 (window.requestAnimationFrame||setTimeout)(()=>{if(document.querySelectorAll)document.querySelectorAll('.rfg').forEach(c=>{c.style.strokeDashoffset=c.dataset.off})});
 window.scrollTo(0,keep?y:0)}
const newD=()=>({name:'',age:'',sex:'m',height:'',weight:'',goal:'aufbau',daily:0,level:1,days:[1,3,5],eq:[]});
function initSel(){const pl=S.plan||[];let i=pl.findIndex(s=>s.day===today);if(i>=0)return i;for(let k=1;k<=7;k++){i=pl.findIndex(s=>s.day===(today+k)%7);if(i>=0)return i}return 0}

// ---------- Profil-Formular ----------
function chipsH(items,on,attr){return `<div class="chips wrap">${items.map(([v,l])=>`<button class="chip ${on(String(v))?'on':''}" data-${attr}="${v}">${esc(l)}</button>`).join('')}</div>`}
function prevHTML(){if(!validP(D))return '<span class="mut">Fülle Alter, Größe, Gewicht und mindestens einen Trainingstag aus, dann siehst du hier deine Zahlen.</span>';
 const c=calc(D);return `<b>${c.kcal} kcal</b> pro Tag · <b>${c.prot} g</b> Protein<div class="mut" style="margin-top:4px">Grundumsatz ${Math.round(c.bmr)} · Gesamtumsatz ${Math.round(c.tdee)} kcal · BMI ${c.bmi.toFixed(1)} · ${D.days.length} Trainingstage</div>${c.warn.map(x=>`<div class="banner" style="margin-top:8px">${esc(x)}</div>`).join('')}`}
function formView(){const first=!S.profile;
 return `${first?'<div class="date">Willkommen bei</div><h1 class="hero">Adonis</h1>':'<h1>Profil</h1>'}<div class="sub">${first?'Gib deine Werte ein. Kalorien, Protein und Trainingsplan werden für dich berechnet.':'Ändere deine Werte, alles wird neu berechnet.'}</div>
 <div class="card"><label class="f" style="margin-top:0">Name (optional)</label><input class="t" data-f="name" value="${esc(D.name)}" placeholder="Dein Name">
 <div class="grid2"><div><label class="f">Alter</label><input class="t" type="number" inputmode="numeric" data-f="age" value="${D.age}"></div><div><label class="f">Größe (cm)</label><input class="t" type="number" inputmode="numeric" data-f="height" value="${D.height}"></div></div>
 <label class="f">Gewicht (kg)</label><input class="t" type="number" step="0.1" inputmode="decimal" data-f="weight" value="${D.weight}">
 <label class="f">Geschlecht (für die Kalorienformel)</label>${chipsH(SEX,v=>D.sex===v,'sex')}</div>
 <div class="card"><label class="f" style="margin-top:0">Dein Ziel</label>${chipsH(GOALS,v=>D.goal===v,'goal')}
 <label class="f">Alltag (ohne Training)</label>${chipsH(DAILY,v=>String(D.daily)===v,'daily')}
 <label class="f">Trainingserfahrung</label>${chipsH(LVS,v=>String(D.level)===v,'lvl')}</div>
 <div class="card"><label class="f" style="margin-top:0">Trainingstage (1 bis 6)</label>${chipsH(WORDER.map(d=>[d,WD[d]]),v=>D.days.includes(+v),'dd')}
 <label class="f">Was hast du zur Verfügung? (leer = nur Körpergewicht)</label>${chipsH(EQ,v=>D.eq.includes(v),'eq')}</div>
 <div class="card"><div id="prev">${prevHTML()}</div></div>
 <button class="btn full" data-act="savep">${first?'Los geht\'s':'Speichern'}</button>
 ${first?'':'<button class="btn sec full" data-act="canc">Abbrechen</button>'}
 <div class="mut" style="margin-top:12px">Die Zahlen sind Richtwerte und ersetzen keine ärztliche Beratung.</div>`}
function saveProfile(){
 if(!validP(D)){alert('Bitte prüfe deine Angaben: Alter 10–99, Größe 120–230 cm, Gewicht 30–250 kg und mindestens ein Trainingstag.');return}
 const old=S.profile,cfg=D.days.slice().sort().join()+'|'+D.eq.slice().sort().join()+'|'+D.level;
 let regen=!S.plan;
 if(S.plan&&S.planCfg!==cfg)regen=confirm('Trainingstage, Geräte oder Erfahrung wurden geändert. Neuen Plan erzeugen? Eigene Änderungen am Plan gehen dann verloren.');
 S.profile=JSON.parse(JSON.stringify(D));
 if(regen){S.plan=genPlan(S.profile);S.planCfg=cfg}
 if(!S.w.length||(old&&old.weight!==D.weight)){S.w=S.w.filter(x=>x.d!==dk());S.w.push({d:dk(),w:+D.weight})}
 editing=false;D=null;tab='heute';sel=initSel();save();render();checkRank()}

// ---------- Heute ----------
function tipH(e){const t=TIPS[e.id];return t?`<div class="tip"><b>So geht's:</b> ${esc(t[0])}<br><b>Häufiger Fehler:</b> ${esc(t[1])}</div>`:'<div class="tip">Für eigene Übungen gibt es keine Anleitung.</div>'}
function warmList(p){const g=new Set(p.ex.map(e=>e.g)),l=['2 Min. locker bewegen (Hampelmänner, Seilspringen oder zügig gehen)'],has=a=>a.some(x=>g.has(x));
 if(has(['brust','schulter','trizeps']))l.push('Armkreisen 10× je Richtung','Schulterkreisen mit Band oder Handtuch 10×','2×8 langsame Liegestütze');
 if(has(['rueckenV','rueckenH','bizeps']))l.push('Schulterblätter zusammen- und runterziehen 2×10','Hängen an der Stange 2×20 Sek. (wenn vorhanden)');
 if(has(['quad','hintere','waden']))l.push('Hüftkreisen 10× je Seite','Kniebeugen ohne Gewicht 2×10','Glute Bridge 2×10');
 if(g.has('core'))l.push('Katze-Kuh 8×','Plank 20 Sek.');
 if(p.ex.some(e=>e.w))l.push('Bei Gewichten: 1 Satz mit ca. 50 % und 1 Satz mit ca. 70 % deines Arbeitsgewichts, je 5-8 Wdh.');
 return l}
const ppOf=(e,sg,i)=>sg.sets[i]||sg.sets[sg.sets.length-1]||{r:rng(e.r)[0]||''};
function heute(){
 const pl=S.plan||[];if(!pl.length)return '<h1>Kein Plan</h1><div class="card">Es gibt noch keinen Trainingsplan. Erzeuge einen im Tab Plan.</div>';
 if(sel>=pl.length)sel=0;const p=pl[sel],ld=LD(),day=S.sets[ld]||{},tp=pl.find(s=>s.day===today);
 const ds=new Date(ld+'T12:00').toLocaleDateString('de-DE',{weekday:'long',day:'numeric',month:'long'});
 let h=`<div class="date">${ds}</div><h1>${esc(p.t)}</h1><div class="sub">${esc(p.sub)}</div>`+rankChip();
 h+=`<div class="chips">${pl.map((s,i)=>`<button class="chip ${i===sel?'on':''}" data-sess="${i}">${WD[s.day]}${s.day===today?' •':''}</button>`).join('')}</div>`;
 let opts='';for(let i=0;i<7;i++){const d=new Date();d.setDate(d.getDate()-i);const k=dstr(d);opts+=`<option value="${k}" ${k===ld?'selected':''}>${i===0?'Heute':i===1?'Gestern':d.toLocaleDateString('de-DE',{weekday:'long',day:'numeric',month:'short'})}</option>`}
 h+=`<div class="row" style="margin-bottom:6px"><span class="mut">Training eintragen für</span><select class="t sm" data-ld>${opts}</select></div>`;
 if(!tp)h+=`<div class="banner">Heute ist Ruhetag 😴 Spaziergang, dehnen, gut essen und früh schlafen. Muskeln wachsen in der Erholung.</div>`;
 else if(p!==tp&&ld===dk())h+=`<div class="banner">Das ist nicht der heutige Plan (heute: ${esc(tp.t)}).</div>`;
 if(isDL())h+=`<div class="banner">Deload-Woche aktiv: nur halbe Sätze, Gewichte etwa 10 % leichter. Erholung ist Training.<br><button class="btn sm sec" data-act="dloff">Beenden</button></div>`;
 else if(trainedWeeks()>=5)h+=`<div class="banner">Du trainierst seit ${trainedWeeks()} Wochen durchgehend. Eine Deload-Woche (halbe Sätze, etwas leichter) hilft der Erholung.<br><button class="btn sm" data-act="dlon">Deload-Woche starten</button></div>`;
 if(trainedDays()>=3&&(!S.lastBackup||(new Date()-new Date(S.lastBackup))/864e5>21))h+=`<div class="banner">Sichere deine Daten: Ich → Backup als Datei speichern.</div>`;
 const wl=warmList(p);
 h+=`<div class="card warm"><button class="row" data-act="warm" style="width:100%;background:none;border:0;color:inherit;padding:0"><b>Aufwärmen · ca. 5 Min.</b><span class="mut">${warmOpen?'Schließen':'Öffnen'}</span></button>${warmOpen?wl.map((x,i)=>`<button class="wuit" data-wu="${i}"><span class="ck ${warmDone[i]?'on':''}">${CHK}</span>${esc(x)}</button>`).join(''):''}</div>`;
 h+=`<div class="row" style="margin-top:4px"><span class="mut">Fortschritt</span><b class="num" id="prog"></b></div><div class="seg" id="seg"></div>`;
 p.ex.forEach(e=>{const arr=day[e.id]||[],sg=suggest(e),n=effS(e),open=tipOpen[e.id];
  h+=`<div class="card"><div class="row"><div class="ex-name">${esc(e.n)}</div><button class="ib ${open?'on':''}" data-tip="${esc(e.id)}" aria-label="Anleitung">i</button></div><div class="ex-meta">${n} Sätze × ${esc(e.r)}</div>`;
  if(open)h+=tipH(e);
  if(sg.hint)h+=`<div class="hint">${esc(sg.hint)}</div>`;
  h+=`<div class="shead ${e.w?'':'nb'}"><span></span>${e.w?'<span>kg</span>':''}<span>Wdh</span><span></span></div>`;
  for(let i=0;i<n;i++){const s=arr[i]||{},pp=ppOf(e,sg,i);
   h+=`<div class="srow ${e.w?'':'nb'}${s.d?' dn':''}"><span class="sn">${i+1}</span>${e.w?`<input class="sin" type="text" inputmode="decimal" data-k="${esc(e.id)}" data-i="${i}" value="${s.w!==undefined&&s.w!==''&&(s.w>0||s.d)?fmt(s.w):''}" placeholder="${pp.w?fmt(pp.w):'–'}">`:''}<input class="sin" type="number" inputmode="numeric" data-rr="${esc(e.id)}" data-i="${i}" value="${s.r||''}" placeholder="${pp.r||''}"><button class="coin ${s.d?'done':''}" data-done="${esc(e.id)},${i}" aria-label="Satz ${i+1} abhaken">${CHK}</button></div>`}
  h+=`</div>`});
 return h+`<div class="card mut">Tippe auf den Haken, um einen Satz mit den vorgeschlagenen Werten zu speichern, oder trag deine eigenen Werte ein. Der Pausentimer startet automatisch. Ziel: 1-2 Wiederholungen vor dem Muskelversagen.</div><div style="height:76px"></div>`}
function prog(){const p=(S.plan||[])[sel];if(!p)return;const day=S.sets[LD()]||{};let d=0,t=0,sg='';p.ex.forEach(e=>{const a=day[e.id]||[],n=effS(e);for(let i=0;i<n;i++){t++;const on=a[i]&&a[i].d;if(on)d++;sg+=`<i class="${on?'on':''}"></i>`}});
 const a=$('#prog');if(a){a.textContent=d+' / '+t+' Sätze';$('#seg').innerHTML=sg}}
function doneSet(id,i,btn){const e=curEx(id);if(!e)return;const s=setObj(id,i),row=btn.closest('.srow'),sg=suggest(e),pp=ppOf(e,sg,i);
 if(s.d){s.d=false;btn.classList.remove('done');row.classList.remove('dn');save();prog();return}
 if(!s.r&&pp.r)s.r=pp.r;
 if(e.w&&(s.w===undefined||s.w==='')&&pp.w)s.w=pp.w;
 if(!s.r){row.classList.remove('shake');void row.offsetWidth;row.classList.add('shake');return}
 if(e.w&&(s.w===undefined||s.w===''))s.w=0;
 s.d=true;const kin=row.querySelector('[data-k]'),rin=row.querySelector('[data-rr]');if(kin&&s.w!=='')kin.value=fmt(s.w);if(rin)rin.value=s.r;
 btn.classList.add('done');btn.classList.remove('pop');void btn.offsetWidth;btn.classList.add('pop');row.classList.add('dn');
 xpFloat(btn,'+10 XP');
 if(prCheck(e,s))toast('★','Neuer Rekord: '+e.n,(s.w>0?fmt(s.w)+' kg × ':'')+s.r+' Wdh. · +50 XP');
 save();prog();startT(restFor(e));checkRank()}

// ---------- Plan ----------
function optsFor(g,cur){const eq=S.profile.eq;return DB.filter(e=>e[2]===g&&(hasEq(e[3],eq)||e[0]===cur)).map(e=>`<option value="${e[0]}" ${e[0]===cur?'selected':''}>${esc(e[1])}</option>`).join('')}
function addOpts(){const eq=S.profile.eq;let h='<option value="">＋ Übung hinzufügen</option>';Object.keys(GN).forEach(g=>{const l=DB.filter(e=>e[2]===g&&hasEq(e[3],eq));if(l.length)h+=`<optgroup label="${GN[g]}">${l.map(e=>`<option value="${e[0]}">${esc(e[1])}</option>`).join('')}</optgroup>`});return h+'<option value="__c">Eigene Übung…</option>'}
function plan(){const pl=S.plan||[];
 let h=`<div class="row"><h1>Trainingsplan</h1><button class="btn sm ${pedit?'':'sec'}" data-act="pedit">${pedit?'Fertig':'Bearbeiten'}</button></div><div class="sub">${pl.length} Trainingstage pro Woche · ${esc(lab(LVS,S.profile.level))}</div>`;
 pl.forEach((s,si)=>{
  h+=`<div class="card"><div class="row"><b style="color:var(--gold2)">${pedit?`<select class="t sm" data-sday="${si}">${WORDER.map(d=>`<option value="${d}" ${d===s.day?'selected':''}>${WD[d]}</option>`).join('')}</select> `:WD[s.day]+' – '}${esc(s.t)}</b></div><div class="mut">${esc(s.sub)}</div>`;
  if(!pedit)h+=`<div style="margin-top:8px">${s.ex.map(e=>`<div class="xr"><span>${esc(e.n)}</span><span class="mut">${e.s} × ${esc(e.r)}</span></div>`).join('')}</div>`;
  else{s.ex.forEach((e,ei)=>{h+=`<div class="exrow"><div class="nm">${e.g&&e.g!=='custom'?`<select class="t sm" data-swap="${si},${ei}" style="width:100%">${optsFor(e.g,e.id)}</select>`:esc(e.n)}</div>
   <input class="mini" type="number" inputmode="numeric" data-ps="${si},${ei}" value="${e.s}"><span class="mut">×</span><input class="mini w" type="text" data-pr="${si},${ei}" value="${esc(e.r)}">
   <button class="del" data-up="${si},${ei}" style="color:var(--gold)">↑</button><button class="del" data-prm="${si},${ei}">✕</button></div>`});
   h+=`<select class="t" data-add="${si}" style="margin-top:8px">${addOpts()}</select>`}
  h+=`</div>`});
 h+=`<div class="card"><b>Regeln</b><ul><li>5 Min. aufwärmen (steht jeden Tag bei Heute)</li><li>Pause 60-90 Sek., bei Klimmzügen und Beinen 2 Min.</li><li>Tempo: 3 Sek. runter, kurz Pause unten</li><li>Steigern über Gewicht, Tempo, kürzere Pausen oder einarmige Varianten</li><li>Alles aufschreiben: Fortschritt ist das Ziel</li></ul></div>`;
 return h+`<button class="btn sec full" data-act="regen">Plan neu erzeugen</button>`}

// ---------- Essen ----------
function fd(){return S.food[dk()]=S.food[dk()]||[]}
function ringH(v,max,unit){const pc=Math.min(1,v/max),C=2*Math.PI*70;return `<div class="ring"><svg viewBox="0 0 160 160"><defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e8c08a"/><stop offset="1" stop-color="#c9955a"/></linearGradient></defs><circle class="tr" cx="80" cy="80" r="70" fill="none" stroke-width="12"/><circle class="rfg" cx="80" cy="80" r="70" fill="none" stroke-width="12" stroke-linecap="round" stroke="${v>=max?'#7cb5a6':'url(#rg)'}" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${C.toFixed(1)}" data-off="${(C*(1-pc)).toFixed(1)}"/></svg><div class="rc"><b>${v}</b><span>von ${max} ${unit}</span></div></div>`}
const macroH=(l,v,max,cls)=>`<div class="row" style="margin-top:12px"><span class="mut">${l}</span><b class="num">${v} / ${max} g</b></div><div class="bar ${cls}"><i style="width:${max>0?Math.min(100,v/max*100):0}%"></i></div>`;
const waterT=()=>Math.max(8,Math.round(+S.profile.weight*35/250));
const lit=x=>x.toFixed(2).replace(/0$/,'').replace('.',',');
function waterH(){const n=waterT(),v=S.water[dk()]||0;let b='';for(let i=1;i<=n;i++)b+=`<button class="${i<=v?'on':''}" data-wat="${i}" aria-label="${i} Gläser"></button>`;
 return `<div class="card"><div class="row"><span class="mut">Wasser (1 Glas = 250 ml)</span><b class="num">${lit(v*.25)} / ${lit(n*.25)} L</b></div><div class="water">${b}</div></div>`}
function essen(){const f=fd(),k=f.reduce((a,x)=>a+x.k,0),p=f.reduce((a,x)=>a+x.p,0),cb=f.reduce((a,x)=>a+(x.c||0),0),fa=f.reduce((a,x)=>a+(x.f||0),0),t=T(),c=t.c;
 let h=`<h1>Ernährung</h1><div class="sub">Ziel: ${esc(lab(GOALS,S.profile.goal))}</div>
 <div class="card" style="text-align:center">${ringH(k,t.kcal,'kcal')}${macroH('Protein',p,t.prot,'')}${macroH('Kohlenhydrate',cb,t.carb,'c')}${macroH('Fett',fa,t.fat,'f')}</div>${waterH()}
 <h2>Schnell hinzufügen <span class="mut">(ca.-Werte)</span></h2><div class="chips wrap">${PRESETS.map((x,i)=>`<button class="chip" data-pre="${i}">${esc(x[0])}</button>`).join('')}</div>
 <div class="card"><div class="grid2"><input class="t" id="fn" placeholder="Name"><input class="t" id="fk" type="number" inputmode="numeric" placeholder="kcal"></div>
 <div class="grid2" style="margin-top:8px"><input class="t" id="fp" type="number" inputmode="numeric" placeholder="Protein g"><input class="t" id="fc" type="number" inputmode="numeric" placeholder="Kohlenhydrate g"></div>
 <div class="grid2" style="margin-top:8px"><input class="t" id="ff" type="number" inputmode="numeric" placeholder="Fett g"><button class="btn" data-act="fadd">Hinzufügen</button></div></div>
 <h2>Heute gegessen</h2>`;
 h+=f.length?f.map((x,i)=>`<div class="card row"><div>${esc(x.n)}<div class="mut">${x.k} kcal · ${x.p} g Protein · ${x.c||0} g KH · ${x.f||0} g Fett</div></div><button class="del" data-del="${i}">✕</button></div>`).join(''):`<div class="mut">Noch nichts eingetragen.</div>`;
 h+=`<h2>Deine Ziele</h2><div class="card"><div class="grid2"><div><div class="mut">kcal/Tag</div><input class="t" id="tk" type="number" inputmode="numeric" value="${t.kcal}"></div><div><div class="mut">Protein g</div><input class="t" id="tp" type="number" inputmode="numeric" value="${t.prot}"></div></div>
 <div class="mut" style="margin-top:8px">Automatisch berechnet: ${c.kcal} kcal, ${c.prot} g Protein, ca. ${c.fat} g Fett, ca. ${c.carb} g Kohlenhydrate. Grundumsatz ${Math.round(c.bmr)}, Gesamtumsatz ${Math.round(c.tdee)} kcal.</div>
 ${S.manual?'<button class="btn sec sm" data-act="auto" style="margin-top:8px">Auf automatisch zurücksetzen</button>':''}
 ${c.warn.map(x=>`<div class="banner">${esc(x)}</div>`).join('')}</div>
 <h2>Gute Lebensmittel</h2><div class="card mut">Haferflocken, Eier, Skyr/Quark, Milch, Reis, Nudeln, Kartoffeln, Hähnchen, Thunfisch, Linsen, Nüsse, Olivenöl, Obst und Gemüse. Verteile das Essen auf 3 Mahlzeiten und 1-2 Snacks.</div>`;return h}
function addFood(n,k,p,c,f){if(!n||!(k>=0))return;fd().push({n,k:Math.round(k),p:Math.round(p||0),c:Math.round(c||0),f:Math.round(f||0)});save();render(1);checkRank()}

// ---------- Fortschritt ----------
function lineChart(pts,dec){if(pts.length<2)return '';const W=320,H=150,Pl=38,Pr=14,Pt=14,Pb=22,vs=pts.map(x=>x.v),lo=Math.min(...vs),hi=Math.max(...vs),pad=Math.max(.4,(hi-lo)*.15),min=lo-pad,max=hi+pad;
 const X=i=>Pl+i*(W-Pl-Pr)/(pts.length-1),Y=v=>Pt+(1-(v-min)/(max-min))*(H-Pt-Pb);
 const line=pts.map((x,i)=>(i?'L':'M')+X(i).toFixed(1)+' '+Y(x.v).toFixed(1)).join('');
 const area=line+'L'+X(pts.length-1).toFixed(1)+' '+(H-Pb)+'L'+X(0).toFixed(1)+' '+(H-Pb)+'Z';
 const gl=[0,.5,1].map(f=>{const v=min+(max-min)*f,y=Y(v);return `<line x1="${Pl}" x2="${W-Pr}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#2a3037" stroke-width="1"/><text x="${Pl-6}" y="${(y+3).toFixed(1)}" text-anchor="end">${v.toFixed(dec)}</text>`}).join('');
 const lx=X(pts.length-1),ly=Y(pts[pts.length-1].v);
 return `<div class="card"><svg viewBox="0 0 ${W} ${H}" width="100%"><defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9955a" stop-opacity=".35"/><stop offset="1" stop-color="#c9955a" stop-opacity="0"/></linearGradient></defs>${gl}<path d="${area}" fill="url(#ag)"/><path d="${line}" fill="none" stroke="#e8c08a" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="9" fill="#c9955a" fill-opacity=".25"/><circle cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="4.5" fill="#e8c08a"/></svg></div>`}
function fort(){const subs=[['verlauf','Verlauf'],['gewicht','Gewicht'],['koerper','Körper'],['uebungen','Übungen']];
 return `<h1>Fortschritt</h1><div class="chips">${subs.map(s=>`<button class="chip ${sub===s[0]?'on':''}" data-sub="${s[0]}">${s[1]}</button>`).join('')}</div>`+({verlauf,gewicht,koerper,uebungen})[sub]()}
const CG={brust:'Brust',schulter:'Schultern',trizeps:'Trizeps',rueckenV:'Rücken',rueckenH:'Rücken',bizeps:'Bizeps',quad:'Beine',hintere:'Beine',waden:'Beine',core:'Bauch'};
function grpOf(id){const e=DB.find(x=>x[0]===id);return e?CG[e[2]]:'Sonstige'}
function exName(id){const e=DB.find(x=>x[0]===id);if(e)return e[1];for(const s of (S.plan||[])){const x=s.ex.find(q=>q.id===id);if(x)return x.n}return id}
function verlauf(){
 const pd=(S.plan||[]).length;
 let h=`<div class="stats"><div class="stat"><b>${streak()}</b><span>Serie</span></div><div class="stat"><b>${weekTrained()}/${pd}</b><span>Diese Woche</span></div><div class="stat"><b>${trainedDays()}</b><span>Trainings</span></div></div>`;
 const m=new Date();m.setDate(1);m.setMonth(m.getMonth()+calOff);const y=m.getFullYear(),mo=m.getMonth(),dn=new Date(y,mo+1,0).getDate(),off=(m.getDay()+6)%7,td=dk();
 let cells=['Mo','Di','Mi','Do','Fr','Sa','So'].map(x=>`<span>${x}</span>`).join('')+'<i style="background:none"></i>'.repeat(off);
 for(let d=1;d<=dn;d++){const k=`${y}-${String(mo+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`,n=setsDone(k);cells+=`<i class="${n>=20?'l3':n>=10?'l2':n>=3?'l1':''}${k===td?' td':''}${k>td?' ft':''}">${d}</i>`}
 h+=`<div class="card"><div class="row"><button class="btn sm sec" data-cal="-1" aria-label="Vorheriger Monat">‹</button><b>${m.toLocaleDateString('de-DE',{month:'long',year:'numeric'})}</b><button class="btn sm sec" data-cal="1" aria-label="Nächster Monat">›</button></div><div class="cal">${cells}</div></div>`;
 const c={};const now=new Date();for(let i=0;i<7;i++){const d=new Date(now);d.setDate(now.getDate()-i);const o=S.sets[dstr(d)]||{};for(const id in o){const n=o[id].filter(x=>x&&x.d).length;if(n)c[grpOf(id)]=(c[grpOf(id)]||0)+n}}
 h+=`<div class="card"><b>Sätze pro Muskel (7 Tage)</b>${['Brust','Schultern','Trizeps','Rücken','Bizeps','Beine','Bauch'].map(n=>`<div class="mg"><span>${n}</span><div class="bar"><i style="width:${Math.min(100,(c[n]||0)/20*100)}%"></i></div><span>${c[n]||0}</span></div>`).join('')}<div class="mut" style="margin-top:6px">10-20 Sätze pro Muskel und Woche sind ein guter Bereich zum Aufbauen.</div></div>`;
 const pr=S.prs.slice(-5).reverse();
 h+=`<div class="card"><b>Letzte Rekorde</b>${pr.length?pr.map(x=>`<div class="xr"><span>${esc(x.n)}</span><span class="mut">${x.w>0?fmt(x.w)+' kg × ':''}${x.r} Wdh.</span></div>`).join(''):'<div class="mut" style="margin-top:6px">Noch keine. Schlage deine Werte vom letzten Training, dann erscheinen sie hier.</div>'}</div>`;
 return h}
function gewicht(){const w=S.w.slice().sort((a,b)=>a.d.localeCompare(b.d));
 let h=`<div class="card"><div class="grid2"><input class="t" id="wv" type="number" step="0.1" inputmode="decimal" placeholder="kg heute"><button class="btn" data-act="wadd">Eintragen</button></div><div class="mut" style="margin-top:8px">1× pro Woche, morgens nach dem Klo.</div></div>`;
 if(w.length){const last=w[w.length-1],dl=last.w-w[0].w;h+=`<div class="card"><div class="big">${last.w.toFixed(1)}<small>kg</small></div><div class="mut">BMI ${(last.w/((S.profile.height/100)**2)).toFixed(1)}${w.length>1?' · '+(dl>0?'+':'')+dl.toFixed(1)+' kg seit dem ersten Eintrag':''}</div></div>`;h+=lineChart(w.slice(-20).map(x=>({d:x.d,v:x.w})),1)+advice(w)}
 else h+=`<div class="card mut">Trag dein Gewicht ein. Nach etwa 2 Wochen bekommst du eine Empfehlung.</div>`;
 return h+w.slice().reverse().map(x=>`<div class="card row"><span>${x.d}</span><b>${x.w.toFixed(1)} kg</b><button class="del" data-wdel="${x.d}">✕</button></div>`).join('')}
function advice(w){const last=w[w.length-1],lt=new Date(last.d),ref=w.find(x=>{const d=(lt-new Date(x.d))/864e5;return d>=9&&d<=28});
 if(!ref)return `<div class="card mut">Für eine Empfehlung brauche ich Einträge im Abstand von mindestens 10 Tagen.</div>`;
 const days=(lt-new Date(ref.d))/864e5,rate=(last.w-ref.w)/days*7,bw=last.w,g=calc(S.profile).goal;let m,c='var(--ok)',adj=0;const r=rate.toFixed(2);
 if(g==='aufbau'){if(rate<bw*.002){m=`Du nimmst kaum zu (${r} kg/Woche). Erhöhe etwa um 150-200 kcal.`;adj=175}else if(rate>bw*.0075){m=`Du nimmst schnell zu (${r} kg/Woche). Geh etwa 150 kcal runter, damit es sauber Muskeln bleiben.`;adj=-150}else m=`Perfekt: ${r} kg/Woche. Weiter so!`}
 else if(g==='abnehmen'){if(rate>-bw*.002){m=`Du nimmst kaum ab (${r} kg/Woche). Geh etwa 150 kcal runter.`;adj=-150}else if(rate<-bw*.01){m=`Du nimmst sehr schnell ab (${r} kg/Woche). Das kostet Muskeln. Erhöhe etwa um 175 kcal.`;adj=175}else m=`Perfekt: ${r} kg/Woche. Weiter so!`}
 else{if(rate>bw*.004){m=`Du nimmst zu (${r} kg/Woche). Geh etwa 150 kcal runter.`;adj=-150}else if(rate<-bw*.004){m=`Du nimmst ab (${r} kg/Woche). Erhöhe etwa um 150 kcal.`;adj=150}else m=`Dein Gewicht ist stabil (${r} kg/Woche).`}
 if(adj)c='var(--bad)';
 return `<div class="card" style="border:1px solid ${c}"><b>Auswertung</b><div style="margin-top:6px">${m}</div>${adj?`<button class="btn sm" data-adj="${adj}" style="margin-top:10px">Empfehlung übernehmen (${adj>0?'+':''}${adj} kcal)</button>`:''}</div>`}
const MS=[['sch','Schultern'],['br','Brust'],['ta','Taille'],['ar','Oberarm'],['ob','Oberschenkel']];
function koerper(){const m=S.meas.slice().sort((a,b)=>a.d.localeCompare(b.d)),last=m[m.length-1],first=m[0];let h='';
 if(last&&last.sch&&last.ta){const r=last.sch/last.ta,pc=Math.min(100,r/1.618*100);h+=`<div class="card"><div class="mut">Adonis-Index (Schulter zu Taille)</div><div class="big">${r.toFixed(2).replace('.',',')}<small>von 1,62</small></div><div class="bar"><i style="width:${pc}%"></i></div><div class="mut">${r>=1.55?'Fast am Ideal der griechischen Statuen.':r>=1.4?'Starkes V-Verhältnis. Weiter Schultern und Rücken aufbauen.':'Breitere Schultern oder eine schmalere Taille bringen dich näher an das Ideal von 1,618.'}</div></div>`}
 h+=`<div class="card"><b>Maße eintragen (cm)</b><div class="meas">${MS.map(x=>`<div><div class="mut" style="margin:0 0 4px 4px">${x[1]}</div><input class="t" id="m_${x[0]}" type="text" inputmode="decimal" placeholder="cm" value="${last&&last[x[0]]?fmt(last[x[0]]):''}"></div>`).join('')}<button class="btn" style="align-self:end" data-act="measadd">Speichern</button></div><div class="mut" style="margin-top:8px">Schultern: an der breitesten Stelle um die Delta-Muskeln, Arme locker. Taille: schmalste Stelle über dem Bauchnabel, locker ausatmen. Immer mit dem Maßband am gleichen Tag und zur gleichen Zeit messen.</div></div>`;
 if(last)h+=`<div class="card"><b>Dein Verlauf</b>${MS.filter(x=>last[x[0]]).map(x=>{const d=first&&first[x[0]]?last[x[0]]-first[x[0]]:0;return `<div class="xr"><span>${x[1]}</span><span class="mut">${fmt(last[x[0]])} cm${m.length>1?' ('+(d>0?'+':'')+fmt(d)+')':''}</span></div>`}).join('')}</div>`;
 return h+photosH()}
function photosH(){const a=getPh();let h=`<div class="card"><div class="row"><b>Fotos</b><label class="btn sm" style="cursor:pointer">Foto hinzufügen<input id="phf" type="file" accept="image/*" hidden></label></div><div class="mut" style="margin-top:6px">Gleiche Pose, gleiches Licht, alle 2-4 Wochen. Die Fotos bleiben nur auf deinem Gerät.</div>`;
 if(a.length>=2){const f=a[0],l=a[a.length-1];h+=`<div class="cmp" style="margin-top:12px"><img src="${l.i}" alt=""><img id="cmpb" src="${f.i}" alt="" style="clip-path:inset(0 ${100-cmpV}% 0 0)"><div class="cmpl" id="cmpl" style="left:${cmpV}%"></div><span class="cmpt" style="left:8px">Vorher ${esc(f.d)}</span><span class="cmpt" style="right:8px">Jetzt ${esc(l.d)}</span></div><input type="range" min="0" max="100" value="${cmpV}" data-cmp="1" aria-label="Vorher und Nachher vergleichen">`}
 if(a.length)h+=`<div class="ph">${a.map((x,i)=>`<div><img src="${x.i}" alt=""><span>${esc(x.d)}</span><button data-phd="${i}" aria-label="Foto löschen">✕</button></div>`).join('')}</div>`;
 return h+'</div>'}
function addPhoto(file){if(!file)return;const rd=new FileReader();rd.onload=()=>{const im=new Image();im.onload=()=>{const mx=720,sc=Math.min(1,mx/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.round(im.width*sc);c.height=Math.round(im.height*sc);c.getContext('2d').drawImage(im,0,0,c.width,c.height);const a=getPh();a.push({d:dk(),i:c.toDataURL('image/jpeg',.72)});if(!setPh(a)){alert('Kein Speicherplatz mehr für Fotos. Lösche ältere Fotos.');return}S.pcount=a.length;save();render(1);checkRank()};im.src=rd.result};rd.readAsDataURL(file)}
function uebungen(){const ids=[...new Set(Object.keys(S.sets).flatMap(d=>Object.keys(S.sets[d]).filter(id=>S.sets[d][id].some(x=>x&&x.d))))].sort((a,b)=>exName(a).localeCompare(exName(b)));
 if(!ids.length)return '<div class="card mut">Noch keine Daten. Hake auf Heute ein paar Sätze ab, dann siehst du hier deine Steigerung pro Übung.</div>';
 if(!ids.includes(selEx))selEx=ids[0];
 const dates=Object.keys(S.sets).filter(d=>(S.sets[d][selEx]||[]).some(x=>x&&x.d)).sort(),weighted=dates.some(d=>S.sets[d][selEx].some(x=>x&&x.d&&x.w>0));
 const pts=dates.map(d=>({d,v:Math.max(...S.sets[d][selEx].filter(x=>x&&x.d).map(x=>weighted?score(+x.w||0,+x.r):+x.r))})),pr=S.pr[selEx];
 let h=`<select class="t" data-exs>${ids.map(id=>`<option value="${esc(id)}" ${id===selEx?'selected':''}>${esc(exName(id))}</option>`).join('')}</select>`;
 if(pr)h+=`<div class="card"><div class="mut">Bester Satz</div><div class="big">${pr.w>0?fmt(pr.w)+'<small>kg × '+pr.r+'</small>':pr.r+'<small>Wdh.</small>'}</div></div>`;
 h+=lineChart(pts,weighted?1:0)+(pts.length>1?`<div class="mut" style="margin:-4px 4px 10px">${weighted?'Geschätztes Maximalgewicht (1RM) pro Training':'Beste Wiederholungszahl pro Training'}</div>`:'');
 return h+dates.slice(-6).reverse().map(d=>{const a=S.sets[d][selEx].filter(x=>x&&x.d);return `<div class="card row"><span>${d}</span><span class="mut">${a.map(x=>x.r).join(' · ')}${weighted?' @ '+fmt(Math.max(...a.map(x=>+x.w||0)))+' kg':''}</span></div>`}).join('')}

// ---------- Ich ----------
function ich(){const P=S.profile,x=calcXP(),r=rankOf(x);
 let h=`<div class="card rhero">${emb(r.i,'xl shine')}<h1>${r.cur.n}</h1><div class="mut">${esc(r.cur.t)}${P.name?' · '+esc(P.name):''}</div><div class="xpbar" style="margin:16px 0 6px"><i style="width:${r.pct}%"></i></div><div class="row"><span class="mut">${x.toLocaleString('de-DE')} XP</span><span class="mut">${r.nx?'Nächster Rang '+r.nx.n+' ab '+r.nx.xp.toLocaleString('de-DE'):'Höchster Rang'}</span></div></div>
 <div class="card ladder"><b>Rangleiter</b>${RANKS.map((k,i)=>`<div class="lr ${i===r.i?'cur':''}">${emb(i,i>r.i?'lk':'')}<div style="flex:1"><b>${k.n}</b><div class="mut">${esc(k.t)}</div></div><span class="mut">${k.xp.toLocaleString('de-DE')} XP</span></div>`).join('')}</div>
 <div class="card"><b>So sammelst du XP</b><ul><li>10 XP pro abgehaktem Satz</li><li>40 XP pro Trainingstag (ab 3 Sätzen)</li><li>50 XP für jeden neuen Rekord</li><li>15 XP für das Wasserziel und für neue Maße</li><li>10 XP pro Gewichtseintrag, Foto und Essenstag mit 3 Einträgen</li></ul></div>
 <div class="card"><div class="row"><b>Profil</b><button class="btn sm" data-act="editp">Bearbeiten</button></div><ul><li>${P.age} Jahre · ${P.height} cm · ${(S.w.length?S.w[S.w.length-1].w:+P.weight).toFixed(1)} kg</li><li>Ziel: ${esc(lab(GOALS,P.goal))}</li><li>Training: ${WORDER.filter(d=>P.days.includes(d)).map(d=>WD[d]).join(', ')} · ${esc(lab(LVS,P.level))}</li><li>Geräte: ${P.eq.length?P.eq.map(q=>esc(lab(EQ,q))).join(', '):'nur Körpergewicht'}</li></ul></div>`;
 const g=calc(P).goal,tips={aufbau:['Leichter Überschuss, kein Defizit: Muskeln wachsen nur mit genug Energie','Protein über den Tag verteilen, Schlaf 8-9 h','Gewicht langsam steigern (ca. 0,25-0,5 % Körpergewicht pro Woche)','Alles aufschreiben und die Belastung nach und nach erhöhen'],halten:['Iss ungefähr so viel, wie du verbrauchst','Training 2-4× pro Woche halten','Protein hoch genug halten (ca. 1,6 g pro kg)','Gewicht alle 1-2 Wochen kontrollieren'],abnehmen:['Mäßiges Defizit, nicht hungern: ca. 0,25-1 % Körpergewicht pro Woche','Protein hoch halten und weiter schwer trainieren, so bleibt die Muskelmasse','Schlaf und Schritte (z. B. 8000+ pro Tag) helfen mehr als extreme Diäten','Bei Heißhunger: mehr Ballaststoffe, Eiweiß und ausreichend Schlaf']}[g];
 h+=`<div class="card"><b>Tipps für dein Ziel</b><ul>${tips.map(q=>`<li>${q}</li>`).join('')}</ul></div>
 <div class="card"><b>Gesicht & Look</b><ul><li>Gesichtsfett lässt sich nicht gezielt abbauen. Es folgt Genetik und Gesamt-Körperfett</li><li>Wer schon schlank ist, braucht kein Defizit: Muskeln lassen Taille und Gesicht im Verhältnis markanter wirken</li><li>Schlaf 8-9 h ist der wichtigste Debloat-Hebel</li><li>Salz moderat, 2-3 L Wasser, viel Gemüse</li><li>Gerade Haltung, Kopf nicht nach vorn schieben</li><li>Alkohol meiden</li><li>Mewing & Co.: keine belastbaren Belege für Veränderungen der Knochen</li></ul></div>
 <div class="card"><b>Daten</b><div class="mut" style="margin:6px 0 10px">Alles liegt nur auf deinem Gerät. ${S.lastBackup?'Letztes Backup: '+S.lastBackup:'Noch kein Backup gemacht.'}</div><div class="chips wrap"><button class="btn sm" data-act="exportf">Backup als Datei</button><label class="btn sm sec" style="cursor:pointer">Backup laden<input id="impf" type="file" accept=".json,application/json" hidden></label><button class="btn sm sec" data-act="exp">Text kopieren</button><button class="btn sm sec" data-act="imp">Text einfügen</button><button class="btn sm sec" data-act="reset" style="color:var(--bad)">Alles löschen</button></div></div>`;return h}
function exportFile(){const b=new Blob([JSON.stringify({v:3,S,ph:getPh()})],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='adonis-backup-'+dk()+'.json';document.body.appendChild(a);a.click();a.remove();S.lastBackup=dk();save();render(1)}
function importData(txt){try{const o=JSON.parse(txt),d=o.S||o;S=Object.assign(DEF(),d);if(o.ph)setPh(o.ph);S.pcount=getPh().length;delete S.log;delete S.wt;save();sel=initSel();render();return true}catch(e){alert('Die Datei ist ungültig.');return false}}

// ---------- Timer ----------
let tI=null,tL=0,tT=1;
function tick(){tL--;const v=Math.max(tL,0);$('#tt').textContent=Math.floor(v/60)+':'+String(v%60).padStart(2,'0');$('#tfill').style.width=(tT?v/tT*100:0)+'%';if(tL<=0){clearInterval(tI);tI=null;if(navigator.vibrate)navigator.vibrate([300,100,300])}}
function startT(s){clearInterval(tI);tT=s;tL=s+1;tick();tI=setInterval(tick,1000)}

// ---------- Events ----------
const pair=s=>s.split(',').map(Number);
document.addEventListener('click',e=>{const t=e.target.closest&&e.target.closest('button');if(!t)return;const d=t.dataset,a=d.act;
 if(d.tab){if(!S.profile)return;editing=false;tab=d.tab;render()}
 else if('sex' in d){D.sex=d.sex;render(1)}
 else if('goal' in d){D.goal=d.goal;render(1)}
 else if('daily' in d){D.daily=+d.daily;render(1)}
 else if('lvl' in d){D.level=+d.lvl;render(1)}
 else if('dd' in d){const n=+d.dd,i=D.days.indexOf(n);if(i>=0)D.days.splice(i,1);else if(D.days.length<6)D.days.push(n);else alert('Maximal 6 Trainingstage, du brauchst mindestens einen Ruhetag.');render(1)}
 else if('eq' in d){const i=D.eq.indexOf(d.eq);if(i>=0)D.eq.splice(i,1);else D.eq.push(d.eq);render(1)}
 else if('sess' in d){sel=+d.sess;render()}
 else if('done' in d){const [id,i]=d.done.split(',');doneSet(id,+i,t)}
 else if('tip' in d){tipOpen[d.tip]=!tipOpen[d.tip];render(1)}
 else if('wu' in d){warmDone[d.wu]=!warmDone[d.wu];render(1)}
 else if('sub' in d){sub=d.sub;render()}
 else if('cal' in d){calOff+=+d.cal;render(1)}
 else if(d.t)startT(+d.t);
 else if('pre' in d){const x=PRESETS[+d.pre];addFood(x[0],x[1],x[2],x[3],x[4])}
 else if('del' in d){fd().splice(+d.del,1);save();render(1)}
 else if('wdel' in d){S.w=S.w.filter(x=>x.d!==d.wdel);save();render(1)}
 else if('wat' in d){const n=+d.wat,cur=S.water[dk()]||0;S.water[dk()]=n===cur?n-1:n;if(S.water[dk()]>=waterT()&&!S.waterDone[dk()]){S.waterDone[dk()]=1;toast('💧','Wasserziel erreicht','+15 XP')}save();render(1);checkRank()}
 else if('phd' in d){if(confirm('Foto löschen?')){const p=getPh();p.splice(+d.phd,1);setPh(p);S.pcount=p.length;save();render(1)}}
 else if('adj' in d){const c=T();S.manual={kcal:c.kcal+(+d.adj),prot:c.prot};save();alert('Neues Kalorienziel: '+S.manual.kcal+' kcal');render(1)}
 else if('up' in d){const [si,ei]=pair(d.up),x=S.plan[si].ex;if(ei>0&&x[ei]){[x[ei-1],x[ei]]=[x[ei],x[ei-1]];save();render(1)}}
 else if('prm' in d){const [si,ei]=pair(d.prm);S.plan[si].ex.splice(ei,1);save();render(1)}
 else if(a==='ru'){const el=t.closest('.rankup');if(el)el.remove()}
 else if(a==='warm'){warmOpen=!warmOpen;render(1)}
 else if(a==='dlon'){S.dlw[mon(new Date())]=1;save();render(1)}
 else if(a==='dloff'){delete S.dlw[mon(new Date())];save();render(1)}
 else if(a==='savep')saveProfile();
 else if(a==='canc'){editing=false;D=null;render()}
 else if(a==='editp'){D=JSON.parse(JSON.stringify(S.profile));editing=true;render()}
 else if(a==='pedit'){pedit=!pedit;render(1)}
 else if(a==='regen'){if(confirm('Neuen Plan aus deinem Profil erzeugen? Eigene Änderungen gehen verloren.')){S.plan=genPlan(S.profile);save();sel=initSel();render()}}
 else if(a==='auto'){S.manual=null;save();render(1)}
 else if(a==='fadd')addFood($('#fn').value.trim(),+$('#fk').value,+$('#fp').value,+$('#fc').value,+$('#ff').value);
 else if(a==='wadd'){const v=parseFloat($('#wv').value.replace(',','.'));if(v>20&&v<250){S.w=S.w.filter(x=>x.d!==dk());S.w.push({d:dk(),w:v});S.profile.weight=v;save();render(1);checkRank()}}
 else if(a==='measadd'){const o={d:dk()};let any=0;MS.forEach(x=>{const v=num($('#m_'+x[0]).value);if(v>0){o[x[0]]=v;any=1}});if(!any){alert('Trag mindestens ein Maß ein.');return}S.meas=S.meas.filter(x=>x.d!==dk());S.meas.push(o);save();render(1);checkRank()}
 else if(a==='exportf')exportFile();
 else if(a==='exp'){const s=JSON.stringify(S);(navigator.clipboard?navigator.clipboard.writeText(s):Promise.reject()).then(()=>alert('Backup kopiert. Fotos sind darin nicht enthalten.')).catch(()=>prompt('Backup kopieren:',s))}
 else if(a==='imp'){const s=prompt('Backup einfügen:');if(s&&importData(s))alert('Fertig.')}
 else if(a==='reset'){if(confirm('Wirklich ALLE Daten löschen?')){try{localStorage.removeItem('adonis2');localStorage.removeItem(PK)}catch(x){}location.reload()}}
});
document.addEventListener('input',e=>{const t=e.target,d=t.dataset||{};
 if('f' in d){D[d.f]=d.f==='name'?t.value:(parseFloat(String(t.value).replace(',','.'))||'');const p=$('#prev');if(p)p.innerHTML=prevHTML()}
 else if('k' in d){setObj(d.k,+d.i).w=num(t.value);save()}
 else if('rr' in d){setObj(d.rr,+d.i).r=t.value===''?'':+t.value;save()}
 else if('cmp' in d){cmpV=+t.value;$('#cmpb').style.clipPath='inset(0 '+(100-cmpV)+'% 0 0)';$('#cmpl').style.left=cmpV+'%'}
 else if('ps' in d){const [a,b]=pair(d.ps);S.plan[a].ex[b].s=Math.max(1,parseInt(t.value)||1);save()}
 else if('pr' in d){const [a,b]=pair(d.pr);S.plan[a].ex[b].r=t.value;save()}
 else if(t.id==='tk'||t.id==='tp'){const c=T(),v=+t.value;if(v>0){S.manual=S.manual||{kcal:c.kcal,prot:c.prot};if(t.id==='tk')S.manual.kcal=v;else S.manual.prot=v;save()}}
});
document.addEventListener('change',e=>{const t=e.target,d=t.dataset||{};
 if('swap' in d){const [si,ei]=pair(d.swap),x=DB.find(q=>q[0]===t.value);if(x){S.plan[si].ex[ei]=mk(x,S.profile.level);save();render(1)}}
 else if('add' in d){const si=+d.add;if(!t.value)return;
  if(t.value==='__c'){const n=(prompt('Name der Übung:')||'').trim();if(!n){render(1);return}const s=parseInt(prompt('Anzahl Sätze:','3'))||3,r=prompt('Wiederholungen (z. B. 8-12):','8-12')||'8-12',w=confirm('Mit Gewicht (kg) mitschreiben?');S.plan[si].ex.push({id:'c'+Date.now(),n,g:'custom',s,r,w})}
  else{const x=DB.find(q=>q[0]===t.value);if(x)S.plan[si].ex.push(mk(x,S.profile.level))}
  save();render(1)}
 else if('sday' in d){S.plan[+d.sday].day=+t.value;save();render(1)}
 else if('ld' in d){logDate=t.value===dk()?null:t.value;render(1)}
 else if('exs' in d){selEx=t.value;render(1)}
 else if(t.id==='phf'){addPhoto(t.files&&t.files[0]);t.value=''}
 else if(t.id==='impf'){const f=t.files&&t.files[0];if(f){const rd=new FileReader();rd.onload=()=>{if(importData(rd.result))alert('Fertig.')};rd.readAsText(f)}t.value=''}
});
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
initDefs();
sel=initSel();
render();
checkRank();
