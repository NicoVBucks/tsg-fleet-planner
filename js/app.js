const APP_AUTHOR  = 'Daygonn';
const APP_VERSION = 'v1.1';
const FEEDBACK_HREF='mailto:'; // set to 'mailto:your@email.com' or a feedback URL
let _u=0;const gid=()=>`u${++_u}`;
let _openingUid=null;
let _clsJustChanged=false;
function mkSlots(sid){
  const def=SHIPS[sid];
  return def.slots.flatMap(({role,n})=>Array.from({length:n},()=>({uid:gid(),role,name:'',trench:false,fps:false})));
}
const mkShip=sid=>({uid:gid(),shipId:sid,ballistic:SHIPS[sid].cat==='fighters'?false:null,slots:mkSlots(sid),open:true,confirmed:false});
let S={tab:'fleet',fleet:[],selCls:null,shipQ:'',lang:'en',langOpen:false,timer:{running:false,startTs:null,elapsed:0,phases:[],intervalId:null}};

const LS_KEY='tsg_fleet_v1';

function saveState(){
  try{
    localStorage.setItem(LS_KEY,JSON.stringify({
      tab:S.tab,lang:S.lang,selCls:S.selCls,fleet:S.fleet,
      timer:{
        elapsed:S.timer.elapsed+(S.timer.running&&S.timer.startTs?Date.now()-S.timer.startTs:0),
        phases:S.timer.phases
      }
    }));
  }catch(e){}
}

function loadState(){
  try{
    const raw=localStorage.getItem(LS_KEY);
    if(!raw)return;
    const d=JSON.parse(raw);
    if(!d||typeof d!=='object')return;
    if(isValidTab(d.tab))S.tab=d.tab;
    if(d.lang&&isValidLang(d.lang))S.lang=d.lang;
    S.selCls=(d.selCls&&isValidClassId(d.selCls))?d.selCls:null;
    if(Array.isArray(d.fleet)){
      S.fleet=d.fleet.filter(s=>
        s&&typeof s==='object'&&typeof s.uid==='string'&&isValidShipId(s.shipId)&&Array.isArray(s.slots)
      ).map(s=>({
        uid:s.uid,shipId:s.shipId,
        ballistic:s.ballistic===null?null:!!s.ballistic,
        confirmed:!!s.confirmed,open:false,
        slots:s.slots.map(sl=>({
          uid:typeof sl.uid==='string'?sl.uid:gid(),
          role:typeof sl.role==='string'?sl.role:'',
          name:sanitizePlayerName(sl.name||''),
          trench:!!sl.trench,fps:!!sl.fps
        }))
      }));
      S.fleet.forEach(s=>{
        const n=parseInt(s.uid.slice(1),10);if(!isNaN(n)&&n>=_u)_u=n+1;
        s.slots.forEach(sl=>{const m=parseInt(sl.uid.slice(1),10);if(!isNaN(m)&&m>=_u)_u=m+1;});
      });
    }
    if(d.timer&&typeof d.timer==='object'){
      S.timer.elapsed=typeof d.timer.elapsed==='number'&&d.timer.elapsed>=0?d.timer.elapsed:0;
      S.timer.phases=Array.isArray(d.timer.phases)?d.timer.phases.filter(p=>
        p&&typeof p.ph==='number'&&typeof p.elapsed==='number'&&p.ph>=1&&p.ph<=5
      ).map(p=>({ph:p.ph,elapsed:p.elapsed})):[];
    }
  }catch(e){}
}

function allNamed(){return S.fleet.flatMap(ship=>ship.slots.filter(s=>s.name.trim()).map(s=>({...s,ship,def:SHIPS[ship.shipId]})));}
function rolesBadges(sl){const p=[];if(sl.trench){const TCLR={A:'#ffd000',B:'#4db8ff',C:'#22d480'};const L=['A','B','C'].includes(sl.trench)?sl.trench:'';p.push(st('warning',L?`${Tr('trench')} <span style="color:${TCLR[L]};font-weight:900;margin-left:2px">· ${L}</span>`:Tr('trench')));}if(sl.fps)p.push(st('info',Tr('fps_lbl')));return p.join(' ');}

function renderRecapRows(){
  const groups=S.fleet.map(ship=>{const def=SHIPS[ship.shipId];const members=ship.slots.filter(s=>s.name.trim()||s.trench||s.fps).map(s=>({...s,def}));return{ship,def,members};}).filter(g=>g.ship.confirmed);
  if(!groups.length)return'';
  return groups.map((g,gi)=>{
    const acc=CLS_ACC[g.def.cls];
    return`
    <div style="border-left:3px solid ${acc.bd};padding-left:14px;margin-bottom:${gi<groups.length-1?'18px':'0'}">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:9px;gap:8px">
        <div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap">
          <i class="ti ${CLS_ICONS[g.def.cls]}" style="font-size:15px;color:${acc.color}" aria-hidden="true"></i>
          <span style="font-family:'Rajdhani',sans-serif;font-size:15px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:${acc.color}">${g.def.fav?'★ ':''}${g.def.name}</span>
          ${g.def.tunnel?`<span style="font-family:'Rajdhani',sans-serif;font-size:13px;color:#22d480;letter-spacing:.08em;font-weight:700">· TUNNEL</span>`:''}
          ${g.def.cat==='fighters'?(g.ship.ballistic?st('success',Tr('bal_ok')):st('danger',Tr('bal_no'))):''}
        </div>
        <div style="display:flex;gap:4px;flex-shrink:0">
          <button class="btn" data-action="edit-ship" data-uid="${g.ship.uid}" style="padding:5px 10px" title="Edit"><i class="ti ti-pencil" style="font-size:14px" aria-hidden="true"></i></button>
          <button class="btn" data-action="rm-ship" data-uid="${g.ship.uid}" style="padding:5px 10px;border-color:rgba(255,80,64,0.35);color:#ff5040;background:rgba(200,48,32,0.06)" title="Remove"><i class="ti ti-trash" style="font-size:14px" aria-hidden="true"></i></button>
        </div>
      </div>
      ${g.members.map((m,mi)=>`<div class="recap-member" style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;${mi<g.members.length-1?'border-bottom:1px solid rgba(42,100,180,0.1)':''}">
        <div style="display:flex;align-items:baseline;gap:10px">
          ${m.name.trim()?`<span style="font-family:'Rajdhani',sans-serif;font-size:18px;font-weight:600;color:#c8dcea">${escapeHTML(m.name)}</span><span style="font-family:'Rajdhani',sans-serif;font-size:14px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#5a90b8">${m.role}</span>`:''}
        </div>
        <div style="display:flex;gap:5px">${rolesBadges(m)||`<span style="font-family:'Rajdhani',sans-serif;font-size:14px;color:#3a6080">${Tr('no_role')}</span>`}</div>
      </div>`).join('')}
    </div>
    ${gi<groups.length-1?`<div style="height:1px;background:rgba(42,100,180,0.12);margin:4px 0 16px 17px"></div>`:''}`;
  }).join('');
}

let _lsAvail=null;
function _lsOk(){if(_lsAvail!==null)return _lsAvail;try{localStorage.setItem('_tsg_chk','1');localStorage.removeItem('_tsg_chk');_lsAvail=true;}catch(e){_lsAvail=false;}return _lsAvail;}
function isObHidden(){try{return localStorage.getItem('tsg_hide_onboarding')==='1';}catch(e){return false;}}

function renderOnboarding(){
  const steps=Tr('ob_steps');
  const stepsH=Array.isArray(steps)?steps.map((s,i)=>`<div style="display:flex;align-items:center;gap:12px;padding:9px 0;${i<steps.length-1?'border-bottom:1px solid rgba(42,100,180,0.1)':''}"><div style="min-width:22px;height:22px;border-radius:50%;background:rgba(42,144,212,0.13);border:1px solid rgba(42,144,212,0.3);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-family:'Share Tech Mono',monospace;font-size:11px;color:#4db8ff;font-weight:700">${i+1}</div><span style="font-family:'Rajdhani',sans-serif;font-size:15px;font-weight:600;color:#c8dcea">${s}</span></div>`).join(''):'';
  const hideBtn=_lsOk()?`<button class="btn" data-action="hide-onboarding" style="padding:4px 11px;border-color:rgba(90,154,184,0.28);color:#5a9ab8;background:transparent;font-size:12px;white-space:nowrap;flex-shrink:0"><i class="ti ti-eye-off" style="font-size:12px" aria-hidden="true"></i>${Tr('ob_hide')}</button>`:'';
  return`<div id="onboarding-card" class="card" style="border-left-color:rgba(42,144,212,0.55);margin-bottom:1rem">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px">
      <div>
        <div style="font-family:'Rajdhani',sans-serif;font-size:15px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#4db8ff;margin-bottom:7px"><i class="ti ti-info-circle" style="font-size:14px;vertical-align:middle;margin-right:7px" aria-hidden="true"></i>${Tr('ob_title')}</div>
        <div style="font-family:'Rajdhani',sans-serif;font-size:14px;font-weight:600;color:#5a90b8;line-height:1.55;max-width:560px">${Tr('ob_sub')}</div>
      </div>
      ${hideBtn}
    </div>
    <div style="margin-bottom:14px">${stepsH}</div>
    <div style="display:flex;align-items:center;gap:8px;padding-top:10px;border-top:1px solid rgba(42,100,180,0.12)">
      <i class="ti ti-shield-lock" style="font-size:13px;color:#3a6a8a;flex-shrink:0" aria-hidden="true"></i>
      <span style="font-family:'Rajdhani',sans-serif;font-size:12px;font-weight:600;color:#3a6a8a;letter-spacing:.03em">${Tr('ob_note')}</span>
    </div>
  </div>`;
}

function renderShipList(){
  const q=S.shipQ.trim().toLowerCase();
  if(q){
    const results=Object.entries(SHIPS).filter(([,d])=>d.name.toLowerCase().includes(q)||Tcls(d.cls).toLowerCase().includes(q)).sort(([,a],[,b])=>a.name.localeCompare(b.name));
    if(!results.length)return`<div style="margin-top:14px;padding-top:14px;border-top:1px solid rgba(42,100,180,0.14)"><div style="font-family:'Share Tech Mono',monospace;font-size:11px;color:#3a6a8a;letter-spacing:.12em">${Tr('search_no_results')}</div></div>`;
    return`<div style="margin-top:14px;padding-top:14px;border-top:1px solid rgba(42,100,180,0.14)"><div style="font-family:'Share Tech Mono',monospace;font-size:11px;color:#3a6a8a;letter-spacing:.12em;margin-bottom:10px">${Tr('search_count',results.length)}</div><div style="display:flex;gap:8px;flex-wrap:wrap">${results.map(([sid,d])=>`<button class="ship-btn${d.fav?' fav-btn':''}" data-action="add-ship" data-ship-id="${sid}">${d.fav?'★ ':''}${d.name}${d.warn?`<i class="ti ti-alert-triangle" style="font-size:12px;color:#c47a20" aria-hidden="true"></i>`:''}</button>`).join('')}</div></div>`;
  }
  if(S.selCls){const acc=CLS_ACC[S.selCls];const list=Object.entries(SHIPS).filter(([,d])=>d.cls===S.selCls).sort(([,a],[,b])=>a.name.localeCompare(b.name));const sCls=_clsJustChanged?'ships-enter':'';_clsJustChanged=false;return`<div class="${sCls}" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px;padding-top:14px;border-top:1px solid ${acc.bd}">${list.map(([sid,d])=>`<button class="ship-btn${d.fav?' fav-btn':''}" data-action="add-ship" data-ship-id="${sid}">${d.fav?'★ ':''}${d.name}${d.warn?`<i class="ti ti-alert-triangle" style="font-size:12px;color:#c47a20" aria-hidden="true"></i>`:''}</button>`).join('')}</div>`;}
  return'';
}

function renderPicker(mb='1.75rem'){
  const q=S.shipQ.trim();
  const clsBtns=CLASSES.map(c=>{const isOn=S.selCls===c.id&&!q,acc=CLS_ACC[c.id];return`<button class="cls-btn" data-action="set-cls" data-cls="${c.id}" style="${isOn?`background:${acc.bg};color:${acc.color};border-color:${acc.bd};box-shadow:0 0 12px ${acc.bg}`:''}"><i class="ti ${CLS_ICONS[c.id]}" aria-hidden="true"></i>${Tcls(c.id)}</button>`;}).join('');
  return`<div style="margin-bottom:${mb}"><div class="lbl" style="margin-bottom:10px">${Tr('add')}</div><div class="ship-search-wrap"><i class="ti ti-search" style="position:absolute;left:11px;top:50%;transform:translateY(-50%);font-size:14px;color:#4a7090;pointer-events:none" aria-hidden="true"></i><input type="text" placeholder="${Tr('search_ph')}" value="${escapeHTML(S.shipQ)}" data-action="ship-search" style="padding-left:33px;${q?'padding-right:32px;border-color:rgba(42,144,212,0.45)':'padding-right:12px'}"><button data-action="clear-ship-search" aria-label="${Tr('search_clear')}" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);display:${q?'flex':'none'};align-items:center;justify-content:center;background:none;border:none;cursor:pointer;color:#5a90b8;padding:4px;border-radius:3px"><i class="ti ti-x" style="font-size:14px" aria-hidden="true"></i></button></div><div style="display:flex;gap:8px;flex-wrap:wrap">${clsBtns}</div><div id="ship-list">${renderShipList()}</div></div>`;
}

function renderFleet(){
  if(!S.fleet.length){
    if(isObHidden())return`<div class="empty"><i class="ti ti-rocket" style="font-size:32px;display:block;margin-bottom:14px;opacity:.3" aria-hidden="true"></i>${Tr('no_ship')}<br><button class="btn" data-action="show-onboarding" style="margin-top:14px;padding:5px 12px;font-size:13px;border-color:rgba(90,154,184,0.25);color:#5a9ab8;background:transparent"><i class="ti ti-info-circle" style="font-size:13px" aria-hidden="true"></i>${Tr('ob_show')}</button></div>`;
    return renderOnboarding();
  }
  let h=`<div class="lbl" style="margin-bottom:10px">${Tr('cfg',S.fleet.length)}</div>`;
  S.fleet.forEach(ship=>{
    const def=SHIPS[ship.shipId],filled=ship.slots.filter(s=>s.name.trim()).length,total=ship.slots.length;
    const fullyFilled=filled===total;
    if(!ship.open && (ship.confirmed || fullyFilled)) return;
    const acc=CLS_ACC[def.cls],cardBd=def.cat==='fighters'&&ship.ballistic?'rgba(34,212,128,0.6)':acc.bd;
    if(!ship.open){h+=`<div id="ship-card-${ship.uid}" class="card" style="border-left-color:${cardBd};cursor:pointer;padding:12px 1.5rem" data-action="open-ship" data-uid="${ship.uid}"><div style="display:flex;justify-content:space-between;align-items:center"><div style="display:flex;align-items:center;gap:12px"><i class="ti ${CLS_ICONS[def.cls]}" style="font-size:18px;color:${acc.color}" aria-hidden="true"></i><span style="font-family:'Rajdhani',sans-serif;font-size:16px;font-weight:700;color:#c8dcea">${def.fav?'<span style="color:#d4a020">★</span> ':''}${def.name}</span>${def.tunnel?st('success',Tr('tunnel')):''}</div><div style="display:flex;align-items:center;gap:10px"><span class="stag" style="background:${SC.warning.bg};color:${SC.warning.text};border:.5px solid ${SC.warning.bd}">${filled}/${total}</span><i class="ti ti-chevron-down" style="font-size:14px;color:#4a7090" aria-hidden="true"></i></div></div></div>`;return;}
    const rkc=fullyFilled?'success':'warning',pW=ship.shipId==='perseus'&&filled<2,ar=CAT_ROLES[def.cat]||[];
    const c=SC[rkc];
    const openCls=ship.uid===_openingUid?' card-opening':'';if(ship.uid===_openingUid)_openingUid=null;
    h+=`<div id="ship-card-${ship.uid}" class="card${openCls}" style="border-left-color:${cardBd}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px">
        <div style="display:flex;align-items:center;gap:12px">
          <i class="ti ${CLS_ICONS[def.cls]}" style="font-size:22px;color:${acc.color}" aria-hidden="true"></i>
          <div><div style="font-family:'Rajdhani',sans-serif;font-size:20px;font-weight:700;color:#c8dcea">${def.fav?`<span style="color:#d4a020">★</span> `:''}${def.name}</div>
          <div style="font-family:'Rajdhani',sans-serif;font-size:14px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#5a90b8;margin-top:2px">${Tcls(def.cls)}${def.note?` · <span style="color:#c47a20">MIN 2</span>`:''}</div></div>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          ${def.tunnel?st('success',Tr('tunnel')):''}
          <span id="badge-${ship.uid}" class="stag" style="background:${c.bg};color:${c.text};border:.5px solid ${c.bd}">${filled}/${total}</span>
        </div>
      </div>
      ${pW?`<div style="font-family:'Rajdhani',sans-serif;font-size:14px;font-weight:700;text-transform:uppercase;color:#ff5040;display:flex;align-items:center;gap:8px;margin-bottom:14px"><i class="ti ti-alert-circle" aria-hidden="true"></i>${Tr('min_crew')}</div>`:''}
      <div style="display:flex;flex-direction:column;gap:10px">
        ${ship.slots.map((sl,slIdx)=>`<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          <div style="font-family:'Rajdhani',sans-serif;font-size:14px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#5a90b8;min-width:86px;flex-shrink:0">${sl.role}</div>
          <input type="text" maxlength="40" placeholder="${Tr('ph_name')}" value="${escapeHTML(sl.name)}" data-action="upd-name" data-uid="${ship.uid}" data-slot-id="${sl.uid}">
          ${slIdx===0&&def.cat==='fighters'?`<label id="lbl-${ship.uid}-bal" class="chk-wrap" style="color:${ship.ballistic?'#22d480':'#ff5040'}"><input type="checkbox" ${ship.ballistic?'checked':''} data-action="tog-bal" data-uid="${ship.uid}"><i class="ti ti-target" style="font-size:16px" aria-hidden="true"></i>${Tr('bal_lbl')}</label>`:''}
          ${ar.includes('fps')?`<label id="lbl-${sl.uid}-fps" class="chk-wrap" style="color:${sl.fps?'#4db8ff':'#4a7090'}"><input type="checkbox" ${sl.fps?'checked':''} data-action="tog-slot" data-uid="${ship.uid}" data-slot-id="${sl.uid}" data-field="fps"><i class="ti ti-shield-bolt" style="font-size:16px" aria-hidden="true"></i>${Tr('fps_lbl')}</label>`:''}
          ${ar.includes('trench')?`<label id="lbl-${sl.uid}-trench" class="chk-wrap" style="color:${sl.trench?'#f0a020':'#4a7090'}"><input type="checkbox" ${sl.trench?'checked':''} data-action="tog-slot" data-uid="${ship.uid}" data-slot-id="${sl.uid}" data-field="trench"><i class="ti ti-plane-departure" style="font-size:16px" aria-hidden="true"></i>${Tr('trench')}</label><div id="trench-sel-${sl.uid}" class="trench-sel${sl.trench?' trench-sel-on':''}">${['A','B','C'].map(t=>`<button class="trench-btn trench-btn-${t.toLowerCase()}${sl.trench===t?' active':''}" data-action="set-trench" data-uid="${ship.uid}" data-slot-id="${sl.uid}" data-val="${t}">${t}</button>`).join('')}</div>`:''}
        </div>`).join('')}
      </div>
      <div style="display:flex;justify-content:flex-end;gap:8px;padding-top:14px;margin-top:10px;border-top:1px solid rgba(42,100,180,0.15)">
        <button class="btn" data-action="cancel-ship" data-uid="${ship.uid}" style="border-color:rgba(90,154,184,0.3);color:#5a9ab8;background:rgba(42,120,200,0.05)"><i class="ti ti-x" style="font-size:16px" aria-hidden="true"></i>${Tr('cancel')}</button>
        <button class="btn" data-action="validate-ship" data-uid="${ship.uid}" style="border-color:rgba(34,212,128,0.45);color:#22d480;background:rgba(26,184,100,0.08)"><i class="ti ti-check" style="font-size:16px" aria-hidden="true"></i>${Tr('validate')}</button>
      </div>
    </div>`;
  });
  const hasConfirmed=S.fleet.some(s=>s.confirmed);
  h+=`<div id="recap-card" class="card" style="margin-top:.5rem;${!hasConfirmed?'display:none':''}"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><div class="lbl">${Tr('recap')}</div><button id="share-btn" class="btn" data-action="share-summary" style="padding:7px 16px;border-color:rgba(42,144,212,0.7);color:#fff;background:rgba(42,144,212,0.28);box-shadow:0 0 12px rgba(42,144,212,0.25)"><i class="ti ti-share" aria-hidden="true"></i>${Tr('share_btn')}</button></div><div id="recap-body">${renderRecapRows()}</div></div>`;
  return h;
}

function renderScore(){
  if(!S.fleet.length)return`<div class="empty">${Tr('score_empty')}</div>`;
  const sc=computeScore();
  const glow={success:'0 0 22px rgba(34,212,128,0.35)',warning:'0 0 22px rgba(240,160,32,0.35)',danger:'0 0 22px rgba(255,80,64,0.35)'};
  const barGrad={success:'linear-gradient(90deg,#1aab6d,#22d480)',warning:'linear-gradient(90deg,#c47a0a,#f0a020)',danger:'linear-gradient(90deg,#aa2020,#ff5040)'};
  let h=`<div class="card" style="text-align:center;padding:2rem 1.5rem;margin-bottom:1.5rem">
    <div style="font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#3a6a8a;margin-bottom:12px">OPERATIONAL SCORE</div>
    <div class="score-num" id="score-num-val" style="font-family:'Share Tech Mono',monospace;font-size:82px;line-height:1;color:${SC[sc.rk].text};text-shadow:${glow[sc.rk]}">${sc.pct}</div>
    <div style="font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:700;letter-spacing:.15em;color:#3a6a8a;margin-bottom:14px">/ 100</div>
    ${st(sc.rk,sc.rating)}
    <div style="font-family:'Rajdhani',sans-serif;font-size:15px;font-weight:600;letter-spacing:.06em;color:#5a90b8;margin-top:16px;text-transform:uppercase">${sc.namedCount} PLAYERS · ${sc.fpsCount} FPS · ${sc.trenchCount} TRENCH</div>
  </div>`;
  if(sc.gIss.length)h+=`<div class="card" style="background:rgba(200,48,32,0.1);border-color:rgba(200,48,32,0.3);margin-bottom:1rem">${sc.gIss.map(g=>`<div style="display:flex;gap:10px;font-family:'Rajdhani',sans-serif;font-size:15px;font-weight:700;letter-spacing:.04em;color:#ff6050;margin-bottom:6px;text-transform:uppercase"><i class="ti ti-alert-circle" style="font-size:17px;flex-shrink:0;margin-top:1px" aria-hidden="true"></i>${g}</div>`).join('')}</div>`;
  sc.phases.forEach(ph=>{
    const pp=Math.round((ph.sc/ph.max)*100),prk=pp>=80?'success':pp>=50?'warning':'danger';
    const okH=ph.ok.map(o=>'<div style="display:flex;gap:10px;font-family:\'Rajdhani\',sans-serif;font-size:15px;font-weight:600;color:#22d480;margin-bottom:6px"><i class="ti ti-check" style="font-size:16px;flex-shrink:0" aria-hidden="true"></i>'+o+'</div>').join('');
    const issH=ph.iss.map(i=>'<div style="display:flex;gap:10px;font-family:\'Rajdhani\',sans-serif;font-size:15px;font-weight:600;color:#ff6050;margin-bottom:6px"><i class="ti ti-alert-triangle" style="font-size:16px;flex-shrink:0" aria-hidden="true"></i>'+i+'</div>').join('');
    h+='<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><div style="font-family:\'Rajdhani\',sans-serif;font-size:15px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#6aaac8">'+ph.label+'</div>'+st(prk,ph.sc+'/'+ph.max)+'</div><div class="prog-track"><div class="prog-bar" style="width:'+pp+'%;background:'+barGrad[prk]+'"></div></div>'+okH+issH+'</div>';
  });
  return h;
}

function renderTimer(){
  const T=S.timer,ms=T.elapsed+(T.running&&T.startTs?Date.now()-T.startTs:0);
  const nextPh=T.phases.length+1,done=T.phases.length>=5,hasPh=T.phases.length>0;
  const canMark=T.running&&!done,canUndo=hasPh;
  let h=`<div id="timer-card-main" class="card" style="text-align:center;padding:2rem 1.5rem;margin-bottom:1.5rem">
    <div style="font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#3a6a8a;margin-bottom:12px">MISSION ELAPSED TIME</div>
    <div class="timer-big ${done?'t-done':T.running?'t-live':''}" id="timer-display">${fmtTime(ms)}</div>
    <div style="font-family:'Rajdhani',sans-serif;font-size:14px;font-weight:700;letter-spacing:.15em;color:${done?'#22d480':T.running?'#4db8ff':'#3a6a8a'};margin-top:12px;min-height:20px;text-transform:uppercase">${done?Tr('t_stopped'):T.running?'● LIVE':T.elapsed>0?Tr('t_stopped'):''}</div>
  </div>
  <div style="display:flex;gap:12px;margin-bottom:.875rem">
    ${!T.running?`<button class="btn" data-action="start-timer" ${done?'disabled':''} style="flex:1;justify-content:center;padding:13px;font-size:15px;${done?'':'border-color:rgba(42,144,212,0.4);color:#4db8ff;background:rgba(42,144,212,0.08)'}"><i class="ti ti-player-play" aria-hidden="true"></i>${T.elapsed>0&&!done?Tr('t_resume'):Tr('t_start')}</button>`
    :`<button class="btn" data-action="pause-timer" style="flex:1;justify-content:center;padding:13px;font-size:15px;border-color:rgba(240,160,32,0.4);color:#f0a020;background:rgba(212,144,10,0.08)"><i class="ti ti-player-pause" aria-hidden="true"></i>${Tr('t_pause')}</button>`}
    <button class="btn" data-action="reset-timer" style="padding:13px 20px"><i class="ti ti-refresh" aria-hidden="true"></i></button>
  </div>
  <div style="display:flex;gap:12px;margin-bottom:1.5rem">
    <button class="btn" data-action="mark-phase" ${canMark?'':'disabled'} style="flex:1;justify-content:center;padding:13px;font-size:15px;${canMark?'border-color:rgba(34,212,128,0.45);color:#22d480;background:rgba(26,184,100,0.08)':''}"><i class="ti ${done?'ti-check':'ti-flag-3'}" aria-hidden="true"></i>${done?Tr('t_done'):Tr('t_mark',nextPh)}</button>
    <button class="btn" data-action="unmark-phase" ${canUndo?'':'disabled'} style="padding:13px 20px;${canUndo?'border-color:rgba(240,160,32,0.45);color:#f0a020;background:rgba(212,144,10,0.08)':''}"><i class="ti ti-arrow-back-up" aria-hidden="true"></i>${canUndo?Tr('t_undo',T.phases[T.phases.length-1].ph):'←'}</button>
  </div>`;
  if(hasPh){
    h+=`<div id="timer-card-phases" class="card"><div class="lbl" style="margin-bottom:10px">${Tr('t_phases')}</div>`;
    T.phases.forEach((ph,i)=>{const prev=i>0?T.phases[i-1].elapsed:0,dur=ph.elapsed-prev;h+=`<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;${i<T.phases.length-1?'border-bottom:1px solid rgba(42,100,180,0.14)':''}"><div style="display:flex;align-items:center;gap:10px">${st('success',`PH${ph.ph}`)}<span style="font-family:'Rajdhani',sans-serif;font-size:15px;font-weight:700;text-transform:uppercase;color:#5a90b8">${Tr('ph')[ph.ph-1]||`Phase ${ph.ph}`}</span></div><div style="display:flex;gap:22px;font-family:'Share Tech Mono',monospace;font-size:15px"><span style="color:#4a7090">${fmtTime(ph.elapsed)}</span><span style="color:#4db8ff;min-width:70px;text-align:right">+${fmtTime(dur)}</span></div></div>`;});
    if(done)h+=`<div style="text-align:center;padding-top:12px;border-top:1px solid rgba(42,100,180,0.18);font-family:'Rajdhani',sans-serif;font-size:16px;font-weight:700;text-transform:uppercase;color:#22d480;text-shadow:0 0 8px rgba(34,212,128,0.35)">${Tr('t_done')} — ${fmtTime(T.phases[4].elapsed)}</div>`;
    h+=`</div>`;
  }else{h+=`<div style="font-family:'Rajdhani',sans-serif;font-size:15px;font-weight:600;color:#7ac8e8;text-align:center;padding:1.25rem 0;text-transform:uppercase;letter-spacing:.06em">${Tr('t_hint')}</div>`;}
  return h;
}

function renderLangDropdown(){
  return`<div style="position:relative;display:inline-block">
    <button class="lang-toggle ${S.langOpen?'open':''}" data-action="tog-lang">
      <span>${S.lang.toUpperCase()}</span>
      <i class="ti ${S.langOpen?'ti-chevron-up':'ti-chevron-down'}" style="font-size:13px" aria-hidden="true"></i>
    </button>
    ${S.langOpen?`<div class="lang-menu">
      ${LANGS.map(lg=>`<button class="lang-item ${S.lang===lg?'on':''}" data-action="set-lang" data-lang="${lg}">${lg.toUpperCase()}</button>`).join('')}
    </div>`:''}
  </div>`;
}

function render(){
  const sc=S.fleet.length?computeScore():null;
  const tabs=[{id:'fleet',label:Tr('tab_fleet'),icon:'ti-rocket',cnt:S.fleet.length},{id:'score',label:Tr('tab_score'),icon:'ti-chart-bar'},{id:'timer',label:Tr('tab_timer'),icon:'ti-clock',cnt:S.timer.phases.length||null}];
  document.getElementById('root').innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:2rem;gap:12px">
      <div>
        <div style="font-family:'Rajdhani',sans-serif;font-size:26px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#c8dcea">
          <span id="tsg-title-text" style="${_titleDone?'':'color:transparent'}">TACTICAL STRIKE GROUPS</span>
        </div>
        <div style="font-family:'Rajdhani',sans-serif;font-size:26px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#c8dcea">
          <span id="tsg-title-text-2" style="${_titleDone?'':'color:transparent'}">FLEET PLANNER</span>
        </div>
        <div id="tsg-subtitle" style="margin-top:5px">
          <div style="font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#3a6a8a">INTERSEC DEFENSE SOLUTIONS</div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:10px">
        <div id="header-score">${sc?`<div style="display:flex;align-items:center;gap:10px"><span style="font-family:'Share Tech Mono',monospace;font-size:28px;color:${SC[sc.rk].text}"><span id="header-score-val">${sc.pct}</span><span style="font-size:14px;color:#3a6a8a;font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:.08em"> /100</span></span>${st(sc.rk,sc.rating)}</div>`:''}</div>
        <div style="display:flex;align-items:center;gap:8px">
          ${renderLangDropdown()}
          <button class="btn" data-action="reset-fleet"><i class="ti ti-refresh" aria-hidden="true"></i>${Tr('reset_fleet')}</button>
        </div>
      </div>
    </div>
    <div class="sticky-top">
      <div class="tabs-row">
        ${tabs.map(t=>`<button class="tab ${S.tab===t.id?'on':''}" data-action="set-tab" data-tab="${t.id}"><i class="ti ${t.icon}" aria-hidden="true"></i>${t.label}${t.cnt?`<span class="stag" style="background:${SC.info.bg};color:${SC.info.text};border:.5px solid ${SC.info.bd}">${t.cnt}</span>`:''}</button>`).join('')}
        <div class="tab-indicator" id="tab-indicator"></div>
      </div>
      ${S.tab==='fleet'?`<div id="picker-section" style="padding:1.25rem 0 1rem">${renderPicker('0')}</div>`:''}
    </div>
    <div id="tab-content" style="padding-top:1.75rem">${S.tab==='fleet'?renderFleet():S.tab==='score'?renderScore():renderTimer()}</div>
    <footer class="app-footer">
      <div class="footer-sep"></div>
      <div class="util-bar">
        <div class="util-bar-left">
          <img src="assets/images/logos/MadeByTheCommunity_White.png" alt="Made by the Community" class="footer-badge" style="height:52px;opacity:.95">
          <span class="util-brand">TSG Fleet Planner<span class="util-ver">${APP_VERSION}</span></span>
          <span class="util-dot">·</span>
          <span style="font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:600;color:#4a7090">Created by <button class="util-link" data-action="open-modal" data-modal="about" style="color:#d4a020">${APP_AUTHOR}</button></span>
        </div>
        <div class="util-bar-right">
          <button class="util-link" data-action="open-modal" data-modal="whats-new">${Tr('f_whats_new')}</button>
          <span class="util-dot">|</span>
          <button class="util-link" data-action="open-feedback">${Tr('f_feedback')}</button>
          <span class="util-dot">|</span>
          <button class="util-link" data-action="open-modal" data-modal="about">${Tr('f_about')}</button>
          <span class="util-dot">|</span>
          <button class="util-link" data-action="open-modal" data-modal="privacy">${Tr('f_privacy')}</button>
          <span class="util-dot">|</span>
          <a href="https://robertsspaceindustries.com/en/" target="_blank" rel="noopener noreferrer" class="footer-enlist" style="padding:5px 13px;font-size:12px"><i class="ti ti-rocket" style="font-size:12px" aria-hidden="true"></i>Enlist Today, Citizen</a>
        </div>
      </div>
      <p class="footer-legal">Star Citizen®, Squadron 42®, Roberts Space Industries, RSI and related marks are trademarks of Cloud Imperium Rights LLC and/or Cloud Imperium Rights Ltd. This tool is not endorsed by or affiliated with Cloud Imperium Group.</p>
    </footer>`;
  applyCascade();
  if(S.tab==='score'){animateProgressBars();animateScoreNum();}
  initTitleAnimation();
  initTabIndicator();
  animateHeaderScore();
  saveState();
}

function updateHeaderScore(){const sc=S.fleet.length?computeScore():null;const el=document.getElementById('header-score');if(!el)return;el.innerHTML=sc?`<div style="display:flex;align-items:center;gap:10px"><span style="font-family:'Share Tech Mono',monospace;font-size:28px;color:${SC[sc.rk].text}"><span id="header-score-val">${sc.pct}</span><span style="font-size:14px;color:#3a6a8a;font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:.08em"> /100</span></span>${st(sc.rk,sc.rating)}</div>`:'';animateHeaderScore();}
function setTab(t){
  const _ind=document.getElementById('tab-indicator'),_row=_ind?.parentElement;
  let _from=null;
  if(_ind&&_row&&!window.matchMedia('(prefers-reduced-motion:reduce)').matches){
    const rr=_row.getBoundingClientRect(),ir=_ind.getBoundingClientRect();
    _from={x:Math.round(ir.left-rr.left+(_row.scrollLeft||0)),w:Math.round(ir.width)};
  }
  S.tab=t;S.langOpen=false;render();
  if(_from){
    const ind=document.getElementById('tab-indicator'),aTab=document.querySelector('.tab.on'),row=ind?.parentElement;
    if(ind&&aTab&&row){
      const rr=row.getBoundingClientRect(),tr=aTab.getBoundingClientRect();
      ind.style.transition='none';
      ind.style.transform=`translateX(${_from.x}px)`;
      ind.style.width=`${_from.w}px`;
      void ind.offsetHeight;
      ind.style.transition='';
      ind.style.transform=`translateX(${Math.round(tr.left-rr.left+(row.scrollLeft||0))}px)`;
      ind.style.width=`${Math.round(tr.width)}px`;
    }
  }
}
function setCls(c){S.shipQ='';S.selCls=S.selCls===c?null:c;S.langOpen=false;if(S.selCls)_clsJustChanged=true;const el=document.getElementById('picker-section');if(el)el.innerHTML=renderPicker('0');else render();}
function togLang(){S.langOpen=!S.langOpen;render();}
function setLang(lg){S.lang=lg;S.langOpen=false;render();}
function animateCardClose(uid,cb){const el=document.getElementById('ship-card-'+uid);if(!el||window.matchMedia('(prefers-reduced-motion:reduce)').matches){cb();return;}el.classList.add('card-closing');setTimeout(cb,180);}
function addShip(sid){const cur=S.fleet.find(s=>s.open);const blank=cur&&!cur.confirmed&&cur.slots.every(s=>!s.name.trim());const doAdd=()=>{S.fleet.forEach(s=>s.open=false);if(blank)S.fleet=S.fleet.filter(s=>s.uid!==cur.uid);S.fleet.push(mkShip(sid));S.langOpen=false;render();};if(cur)animateCardClose(cur.uid,doAdd);else doAdd();}
function rmShip(uid){S.fleet=S.fleet.filter(s=>s.uid!==uid);render();}
function resetFleet(){S.fleet=[];S.selCls=null;S.langOpen=false;resetCardCache();render();}
function togBal(uid){const s=S.fleet.find(s=>s.uid===uid);if(!s)return;s.ballistic=!s.ballistic;const card=document.getElementById('ship-card-'+uid);if(card){const def=SHIPS[s.shipId],acc=CLS_ACC[def.cls];card.style.borderLeftColor=def.cat==='fighters'&&s.ballistic?'rgba(34,212,128,0.6)':acc.bd;}const lbl=document.getElementById('lbl-'+uid+'-bal');if(lbl)lbl.style.color=s.ballistic?'#22d480':'#ff5040';const rb=document.getElementById('recap-body');if(rb)rb.innerHTML=renderRecapRows();const rc=document.getElementById('recap-card');if(rc)rc.style.display=S.fleet.some(s=>s.confirmed)?'':'none';updateHeaderScore();saveState();}
function updName(sUid,slUid,val){const ship=S.fleet.find(s=>s.uid===sUid),sl=ship?.slots.find(s=>s.uid===slUid);if(!sl)return;sl.name=sanitizePlayerName(val);const filled=ship.slots.filter(s=>s.name.trim()).length,total=ship.slots.length;const badge=document.getElementById('badge-'+sUid);if(badge){const c=SC[filled===total?'success':'warning'];badge.textContent=filled+'/'+total;badge.style.background=c.bg;badge.style.color=c.text;badge.style.border=`.5px solid ${c.bd}`;}const rb=document.getElementById('recap-body');if(rb)rb.innerHTML=renderRecapRows();const rc=document.getElementById('recap-card');if(rc)rc.style.display=S.fleet.some(s=>s.confirmed)?'':'none';saveState();}
function togSlot(sUid,slUid,f){const ship=S.fleet.find(s=>s.uid===sUid);const sl=ship?.slots.find(s=>s.uid===slUid);if(!sl)return;if(f==='trench'){sl.trench=sl.trench?false:true;}else{sl[f]=!sl[f];}const lbl=document.getElementById(`lbl-${slUid}-${f}`);if(lbl)lbl.style.color=sl[f]?(f==='trench'?'#f0a020':'#4db8ff'):'#4a7090';if(f==='trench'){const sel=document.getElementById('trench-sel-'+slUid);if(sel){sel.classList.toggle('trench-sel-on',!!sl.trench);sel.querySelectorAll('.trench-btn').forEach(b=>b.classList.toggle('active',b.dataset.val===sl.trench));}}const rb=document.getElementById('recap-body');if(rb)rb.innerHTML=renderRecapRows();const rc=document.getElementById('recap-card');if(rc)rc.style.display=S.fleet.some(s=>s.confirmed)?'':'none';updateHeaderScore();saveState();}
function setTrench(sUid,slUid,val){const ship=S.fleet.find(s=>s.uid===sUid);const sl=ship?.slots.find(s=>s.uid===slUid);if(!sl||!sl.trench)return;sl.trench=sl.trench===val?true:val;const sel=document.getElementById('trench-sel-'+slUid);if(sel)sel.querySelectorAll('.trench-btn').forEach(b=>b.classList.toggle('active',b.dataset.val===sl.trench));const rb=document.getElementById('recap-body');if(rb)rb.innerHTML=renderRecapRows();const rc=document.getElementById('recap-card');if(rc)rc.style.display=S.fleet.some(s=>s.confirmed)?'':'none';saveState();}
function openShip(uid){const cur=S.fleet.find(s=>s.open);const doOpen=()=>{S.fleet.forEach(s=>s.open=false);const ship=S.fleet.find(s=>s.uid===uid);if(ship){ship.open=true;_openingUid=uid;}render();};if(cur&&cur.uid!==uid)animateCardClose(cur.uid,doOpen);else doOpen();}
function checkAutoClose(sUid){const ship=S.fleet.find(s=>s.uid===sUid);if(!ship||!ship.open)return;if(ship.slots.every(s=>s.name.trim())){animateCardClose(sUid,()=>{ship.open=false;render();});}}
function validateShip(uid){animateCardClose(uid,()=>{const ship=S.fleet.find(s=>s.uid===uid);if(ship){ship.open=false;ship.confirmed=true;delete ship._wasConfirmed;render();}});}
function cancelShip(uid){const ship=S.fleet.find(s=>s.uid===uid);if(!ship)return;animateCardClose(uid,()=>{if(ship._wasConfirmed){ship.open=false;ship.confirmed=true;delete ship._wasConfirmed;}else{S.fleet=S.fleet.filter(s=>s.uid!==uid);}render();});}
function editShip(uid){S.fleet.forEach(s=>{if(s.uid!==uid)s.open=false;});const ship=S.fleet.find(s=>s.uid===uid);if(ship){ship._wasConfirmed=ship.confirmed;ship.open=true;ship.confirmed=false;_openingUid=uid;}render();requestAnimationFrame(()=>{const el=document.getElementById('ship-card-'+uid);if(el)el.scrollIntoView({behavior:'smooth',block:'nearest'});});}

function handleClick(e){
  const el=e.target.closest('[data-action]');
  if(!el)return;
  const action=el.dataset.action;
  switch(action){
    case 'set-tab':{const t=el.dataset.tab;if(!isValidTab(t))return;setTab(t);break;}
    case 'tog-lang':togLang();break;
    case 'set-lang':{const l=el.dataset.lang;if(!isValidLang(l))return;setLang(l);break;}
    case 'reset-fleet':resetFleet();break;
    case 'set-cls':{const c=el.dataset.cls;if(!isValidClassId(c))return;setCls(c);break;}
    case 'clear-ship-search':{S.shipQ='';const ps=document.getElementById('picker-section');if(ps){ps.innerHTML=renderPicker('0');requestAnimationFrame(()=>{ps.querySelector('[data-action="ship-search"]')?.focus();});}break;}
    case 'add-ship':{const sid=el.dataset.shipId;if(!isValidShipId(sid))return;addShip(sid);break;}
    case 'open-ship':{const uid=el.dataset.uid;if(!uid)return;openShip(uid);break;}
    case 'cancel-ship':{const uid=el.dataset.uid;if(!uid)return;cancelShip(uid);break;}
    case 'validate-ship':{const uid=el.dataset.uid;if(!uid)return;validateShip(uid);break;}
    case 'edit-ship':{const uid=el.dataset.uid;if(!uid)return;editShip(uid);break;}
    case 'rm-ship':{const uid=el.dataset.uid;if(!uid)return;rmShip(uid);break;}
    case 'set-trench':{const uid=el.dataset.uid,slotId=el.dataset.slotId,val=el.dataset.val;if(!uid||!slotId||!val)return;setTrench(uid,slotId,val);break;}
    case 'share-summary':generateShareCard();break;
    case 'open-modal':{const m=el.dataset.modal;if(m)openModal(m);break;}
    case 'close-modal':closeModal();break;
    case 'modal-inner':break;
    case 'open-feedback':openModal('feedback');break;
    case 'hide-onboarding':try{localStorage.setItem('tsg_hide_onboarding','1');}catch(e){}render();break;
    case 'show-onboarding':try{localStorage.removeItem('tsg_hide_onboarding');}catch(e){}render();break;
    case 'start-timer':startTimer();break;
    case 'pause-timer':pauseTimer();break;
    case 'reset-timer':resetTimer();break;
    case 'mark-phase':markPhase();break;
    case 'unmark-phase':unmarkPhase();break;
    case 'scroll-top':window.scrollTo({top:0,behavior:'smooth'});break;
  }
}

function handleInput(e){
  const el=e.target;
  if(el.dataset.action==='upd-name'){
    const uid=el.dataset.uid,slotId=el.dataset.slotId;
    if(!uid||!slotId)return;
    updName(uid,slotId,el.value);
  }else if(el.dataset.action==='ship-search'){
    S.shipQ=el.value;
    const sl=document.getElementById('ship-list');
    if(sl)sl.innerHTML=renderShipList();
    const cb=document.querySelector('[data-action="clear-ship-search"]');
    if(cb)cb.style.display=S.shipQ?'flex':'none';
    el.style.paddingRight=S.shipQ?'32px':'12px';
    el.style.borderColor=S.shipQ?'rgba(42,144,212,0.45)':'rgba(42,100,180,0.25)';
    document.querySelectorAll('[data-action="set-cls"]').forEach(btn=>{const c=btn.dataset.cls,acc=CLS_ACC[c],on=S.selCls===c&&!S.shipQ;btn.style.cssText=on?`background:${acc.bg};color:${acc.color};border-color:${acc.bd};box-shadow:0 0 12px ${acc.bg}`:'';});
  }
}

function handleChange(e){
  const el=e.target;
  const action=el.dataset.action;
  if(action==='tog-bal'){
    const uid=el.dataset.uid;if(!uid)return;togBal(uid);
  }else if(action==='tog-slot'){
    const uid=el.dataset.uid,slotId=el.dataset.slotId,field=el.dataset.field;
    if(!uid||!slotId||!['trench','fps'].includes(field))return;
    togSlot(uid,slotId,field);
  }
}

// ── Modals ────────────────────────────────────────────────────────────────────
const _MODAL_TYPES=['whats-new','privacy','about','feedback'];
let _modal=null;

function renderModal(type){
  const TAG={
    new:'background:rgba(34,212,128,0.14);color:#22d480;border:.5px solid rgba(34,212,128,0.4)',
    upd:'background:rgba(42,144,212,0.14);color:#4db8ff;border:.5px solid rgba(42,144,212,0.4)',
    sec:'background:rgba(168,85,247,0.14);color:#c888ff;border:.5px solid rgba(168,85,247,0.4)',
    fix:'background:rgba(240,160,32,0.14);color:#f0a020;border:.5px solid rgba(240,160,32,0.4)'
  };
  function mrow(t,txt){return`<div style="display:flex;gap:10px;align-items:baseline;margin-bottom:9px"><span style="font-family:'Rajdhani',sans-serif;font-size:11px;font-weight:700;letter-spacing:.08em;${TAG[t]};border-radius:3px;padding:1px 7px;flex-shrink:0">${t.toUpperCase()}</span><span style="font-family:'Rajdhani',sans-serif;font-size:14px;font-weight:600;color:#c8dcea">${txt}</span></div>`;}
  function mcheck(txt){return`<div style="display:flex;gap:10px;align-items:flex-start;margin-bottom:9px"><i class="ti ti-check" style="font-size:14px;color:#22d480;flex-shrink:0;margin-top:2px" aria-hidden="true"></i><span style="font-family:'Rajdhani',sans-serif;font-size:14px;font-weight:600;color:#a8c8e0;line-height:1.5">${txt}</span></div>`;}

  const body={
    'whats-new':`<div style="font-family:'Share Tech Mono',monospace;font-size:11px;color:#4db8ff;letter-spacing:.14em;text-transform:uppercase;margin-bottom:16px">${APP_VERSION} — ${Tr('wn_latest')}</div>
      ${mrow('new',Tr('wn_11_1'))}
      ${mrow('upd',Tr('wn_11_2'))}
      <div style="height:1px;background:rgba(42,100,180,0.16);margin:16px 0 14px"></div>
      <div style="font-family:'Share Tech Mono',monospace;font-size:11px;color:#3a6a8a;letter-spacing:.14em;text-transform:uppercase;margin-bottom:16px">v1.0</div>
      ${mrow('new',Tr('wn_1'))}
      ${mrow('new',Tr('wn_2'))}
      ${mrow('upd',Tr('wn_3'))}
      ${mrow('sec',Tr('wn_4'))}
      ${mrow('fix',Tr('wn_5'))}`,
    'privacy':`<div style="font-family:'Rajdhani',sans-serif;font-size:15px;font-weight:700;color:#22d480;letter-spacing:.06em;margin-bottom:14px">${Tr('privacy_title')}</div>
      ${mcheck(Tr('privacy_1'))}
      ${mcheck(Tr('privacy_2'))}
      ${mcheck(Tr('privacy_3'))}
      ${mcheck(Tr('privacy_4'))}`,
    'about':`<div style="font-family:'Rajdhani',sans-serif;font-size:14px;font-weight:600;color:#a8c8e0;line-height:1.75;margin-bottom:16px">${Tr('about_desc',`<span style="color:#d4a020;font-weight:700">${APP_AUTHOR}</span>`)}</div>
      <div style="font-family:'Rajdhani',sans-serif;font-size:12px;font-weight:600;color:#3a5870;line-height:1.7;padding-top:12px;border-top:1px solid rgba(42,100,180,0.14)">${Tr('about_legal')}</div>`,
    'feedback':`<div style="font-family:'Rajdhani',sans-serif;font-size:14px;font-weight:600;color:#a8c8e0;line-height:1.75;margin-bottom:20px">${Tr('feedback_desc')}</div>
      <div style="display:flex;align-items:center;gap:14px;padding:13px 16px;background:rgba(154,80,212,0.06);border:1px solid rgba(154,80,212,0.22);border-radius:5px;margin-bottom:16px">
        <div style="width:38px;height:38px;border-radius:50%;background:rgba(200,136,255,0.1);border:1px solid rgba(200,136,255,0.28);display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="ti ti-user" style="font-size:16px;color:#c888ff" aria-hidden="true"></i></div>
        <div><div style="font-family:'Rajdhani',sans-serif;font-size:16px;font-weight:700;color:#c8dcea;letter-spacing:.04em">Daygon</div><div style="font-family:'Share Tech Mono',monospace;font-size:12px;color:#c888ff;margin-top:2px">@Daygonn</div></div>
      </div>
      <a href="https://robertsspaceindustries.com/en/citizens/Daygonn" target="_blank" rel="noopener noreferrer" class="btn" style="display:inline-flex;padding:9px 18px;border-color:rgba(200,136,255,0.35);color:#c888ff;background:rgba(200,136,255,0.07);font-size:13px;text-decoration:none;font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:.06em"><i class="ti ti-external-link" style="font-size:13px" aria-hidden="true"></i>${Tr('feedback_btn')}</a>`
  };
  const titles={'whats-new':"What's New",'privacy':'Privacy','about':'About TSG Fleet Planner','feedback':'Feedback'};
  return`<div class="modal-overlay" data-action="close-modal">
    <div class="modal-box" data-action="modal-inner">
      <div class="modal-header">
        <div class="modal-title">${titles[type]||''}</div>
        <button class="btn" data-action="close-modal" aria-label="Close" style="padding:4px 10px"><i class="ti ti-x" style="font-size:15px" aria-hidden="true"></i></button>
      </div>
      <div>${body[type]||''}</div>
    </div>
  </div>`;
}

function openModal(type){
  if(!_MODAL_TYPES.includes(type))return;
  closeModal();
  _modal=type;
  const root=document.createElement('div');
  root.id='modal-root';
  root.innerHTML=renderModal(type);
  document.body.appendChild(root);
  requestAnimationFrame(()=>root.querySelector('.modal-overlay')?.classList.add('visible'));
}

function closeModal(){
  _modal=null;
  const el=document.getElementById('modal-root');
  if(!el)return;
  const ov=el.querySelector('.modal-overlay');
  if(ov){ov.classList.remove('visible');setTimeout(()=>el.remove(),220);}else el.remove();
}
// ─────────────────────────────────────────────────────────────────────────────

// ── Share Summary ─────────────────────────────────────────────────────────────
let _toastTimer=null;
function showShareToast(type){
  let el=document.getElementById('share-toast');
  if(!el){el=document.createElement('div');el.id='share-toast';el.className='share-toast';document.body.appendChild(el);}
  clearTimeout(_toastTimer);
  el.className='share-toast'+(type==='success'?' success':type==='fallback'?' fallback':'');
  el.textContent=type==='success'?'✓ Downloaded & copied — paste it anywhere'
    :type==='empty'?'No confirmed ships to share'
    :'↓ Downloaded — clipboard image not available in this browser';
  requestAnimationFrame(()=>el.classList.add('visible'));
  _toastTimer=setTimeout(()=>el.classList.remove('visible'),5000);
}

function _cSep(ctx,x1,y,x2){ctx.save();ctx.strokeStyle='rgba(42,144,212,0.2)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x1,y);ctx.lineTo(x2,y);ctx.stroke();ctx.restore();}

function _cRect(ctx,x,y,w,h,r,fill,stroke){
  ctx.beginPath();
  ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.closePath();
  if(fill){ctx.fillStyle=fill;ctx.fill();}
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=0.75;ctx.stroke();}
}

function _cBadge(ctx,text,fg,bg,bd,x,y,fs){
  ctx.font=`bold ${fs}px 'Rajdhani',sans-serif`;
  const tw=ctx.measureText(text).width,px=6,py=3;
  const bw=tw+px*2,bh=fs+py*2+1;
  _cRect(ctx,x,y,bw,bh,2,bg,bd);
  ctx.fillStyle=fg;ctx.fillText(text,x+px,y+bh-py-1);
  return x+bw;
}

async function generateShareCard(){
  const groups=S.fleet
    .filter(s=>s.confirmed)
    .map(s=>({ship:s,def:SHIPS[s.shipId],members:s.slots.filter(sl=>sl.name.trim()||sl.trench||sl.fps)}));
  if(!groups.length){showShareToast('empty');return;}

  const btn=document.getElementById('share-btn');
  const orig=btn?btn.innerHTML:'';
  if(btn){btn.innerHTML='<i class="ti ti-loader-2 ti-spin" aria-hidden="true"></i>Generating…';btn.disabled=true;}

  try{
    await document.fonts.ready;
    const sc=computeScore();
    const SCALE=2,W=720,PAD=32;
    const SH=28,MH=26,GH=14;
    let shH=0;groups.forEach(g=>{shH+=SH+g.members.length*MH+GH;});
    const totalH=PAD+82+20+96+28+20+24+shH+18+20+PAD;

    const canvas=document.createElement('canvas');
    canvas.width=W*SCALE;canvas.height=totalH*SCALE;
    const ctx=canvas.getContext('2d');
    ctx.scale(SCALE,SCALE);

    // Background
    ctx.fillStyle='#0d1420';ctx.fillRect(0,0,W,totalH);

    // Corner brackets
    const CL=16;ctx.strokeStyle='rgba(42,144,212,0.55)';ctx.lineWidth=1.5;
    [[0,CL,0,0,CL,0],[W-CL,0,W,0,W,CL],[0,totalH-CL,0,totalH,CL,totalH],[W-CL,totalH,W,totalH,W,totalH-CL]]
      .forEach(([x1,y1,mx,my,x2,y2])=>{ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(mx,my);ctx.lineTo(x2,y2);ctx.stroke();});

    // Top accent bar
    ctx.fillStyle='rgba(42,144,212,0.28)';ctx.fillRect(PAD,0,W-PAD*2,2);

    let y=PAD;

    // Header
    ctx.fillStyle='#c8dcea';ctx.font="bold 20px 'Rajdhani',sans-serif";
    ctx.fillText('TACTICAL STRIKE GROUPS',PAD,y+21);
    ctx.fillText('FLEET PLANNER',PAD,y+44);
    ctx.fillStyle='rgba(42,144,212,0.42)';ctx.fillRect(PAD,y+53,38,1.5);
    ctx.fillStyle='#3a6a8a';ctx.font="bold 11px 'Rajdhani',sans-serif";
    ctx.fillText('INTERSEC DEFENSE SOLUTIONS',PAD,y+68);
    y+=82;

    // Sep
    _cSep(ctx,PAD,y,W-PAD);y+=20;

    // Score
    const sc_col={success:'#22d480',warning:'#f0a020',danger:'#ff5040'}[sc.rk];
    ctx.save();
    ctx.shadowColor=sc_col;ctx.shadowBlur=16;
    ctx.fillStyle=sc_col;ctx.font="64px 'Share Tech Mono',monospace";
    ctx.fillText(String(sc.pct),PAD,y+68);
    const pW=ctx.measureText(String(sc.pct)).width;
    ctx.restore();
    ctx.fillStyle='#3a6a8a';ctx.font="bold 14px 'Rajdhani',sans-serif";
    ctx.fillText('/100',PAD+pW+5,y+68-10);
    y+=96;

    // Rating
    const rkC={
      success:{bg:'rgba(26,184,100,0.18)',text:'#22d480',bd:'rgba(26,184,100,0.4)'},
      warning:{bg:'rgba(212,144,16,0.18)',text:'#f0a020',bd:'rgba(212,144,16,0.4)'},
      danger: {bg:'rgba(200,48,32,0.18)', text:'#ff5040',bd:'rgba(200,48,32,0.4)'}
    }[sc.rk];
    ctx.font="bold 12px 'Rajdhani',sans-serif";
    const rt=sc.rating.toUpperCase();const rW=ctx.measureText(rt).width+18;
    _cRect(ctx,PAD,y+3,rW,18,3,rkC.bg,rkC.bd);
    ctx.fillStyle=rkC.text;ctx.fillText(rt,PAD+9,y+16);
    ctx.fillStyle='#5a90b8';ctx.fillText(`  ${sc.namedCount} ${Tr('share_players')}  ·  ${sc.fpsCount} FPS  ·  ${sc.trenchCount} TRENCH`,PAD+rW+4,y+16);
    y+=28;

    // Sep
    _cSep(ctx,PAD,y,W-PAD);y+=20;

    // Crew summary label
    ctx.fillStyle='#3a6a8a';ctx.font="bold 10px 'Rajdhani',sans-serif";
    ctx.fillText(Tr('recap').toUpperCase(),PAD,y+13);y+=24;

    // Ships
    const CC={light:'#4db8ff',medium:'#30e890',heavy:'#f0a820',gunship:'#ff6a28',capital:'#c888ff'};
    groups.forEach((g,gi)=>{
      const cc=CC[g.def.cls]||'#4db8ff';
      // Left accent bar
      ctx.fillStyle=cc+'44';ctx.fillRect(PAD,y,3,SH+g.members.length*MH);
      // Ship name
      ctx.fillStyle=cc;ctx.font="bold 13px 'Rajdhani',sans-serif";
      const sn=(g.def.fav?'★ ':'')+g.def.name.toUpperCase();
      ctx.fillText(sn,PAD+10,y+18);
      const snW=ctx.measureText(sn).width;
      // Inline badges
      let bx=PAD+10+snW+8;
      if(g.def.tunnel)bx=_cBadge(ctx,Tr('tunnel').toUpperCase(),'#22d480','rgba(26,184,100,0.15)','rgba(26,184,100,0.35)',bx,y+3,10)+5;
      if(g.def.cat==='fighters'){
        if(g.ship.ballistic)bx=_cBadge(ctx,Tr('bal_ok').toUpperCase(),'#22d480','rgba(26,184,100,0.15)','rgba(26,184,100,0.35)',bx,y+3,10)+5;
        else bx=_cBadge(ctx,Tr('bal_no').toUpperCase(),'#ff5040','rgba(200,48,32,0.12)','rgba(200,48,32,0.3)',bx,y+3,10)+5;
      }
      y+=SH;
      // Members
      g.members.forEach(m=>{
        let mx=PAD+14;
        if(m.name.trim()){ctx.fillStyle='#c8dcea';ctx.font="600 13px 'Rajdhani',sans-serif";ctx.fillText(m.name,PAD+14,y+17);const nW=ctx.measureText(m.name).width;ctx.fillStyle='#5a90b8';ctx.font="bold 11px 'Rajdhani',sans-serif";ctx.fillText(m.role.toUpperCase(),PAD+14+nW+7,y+17);const roW=ctx.measureText(m.role.toUpperCase()).width;mx=PAD+14+nW+7+roW+7;}
        if(m.trench){const _TL=['A','B','C'].includes(m.trench)?m.trench:'';const _TC={A:'#ffd000',B:'#4db8ff',C:'#22d480'};const _fs=9,_px=6,_py=3;const _tLabel=Tr('trench').toUpperCase();const _tLetter=_TL?` · ${_TL}`:'';ctx.font=`bold ${_fs}px 'Rajdhani',sans-serif`;const _tw=ctx.measureText(_tLabel).width,_lw=_TL?ctx.measureText(_tLetter).width:0;const _bw=_tw+_lw+_px*2,_bh=_fs+_py*2+1;_cRect(ctx,mx,y+4,_bw,_bh,2,'rgba(212,144,16,0.12)','rgba(212,144,16,0.3)');ctx.fillStyle='#f0a020';ctx.fillText(_tLabel,mx+_px,y+4+_bh-_py-1);if(_TL){ctx.fillStyle=_TC[_TL];ctx.fillText(_tLetter,mx+_px+_tw,y+4+_bh-_py-1);}mx+=_bw+4;}
        if(m.fps)mx=_cBadge(ctx,Tr('fps_lbl').toUpperCase(),'#4db8ff','rgba(42,144,212,0.12)','rgba(42,144,212,0.3)',mx,y+4,9)+4;
        y+=MH;
      });
      // Ship divider
      if(gi<groups.length-1){
        ctx.strokeStyle='rgba(42,100,180,0.18)';ctx.lineWidth=1;
        ctx.beginPath();ctx.moveTo(PAD+16,y+4);ctx.lineTo(W-PAD,y+4);ctx.stroke();
      }
      y+=GH;
    });

    // Footer
    _cSep(ctx,PAD,y,W-PAD);y+=18;
    ctx.font="bold 10px 'Rajdhani',sans-serif";
    ctx.fillStyle='#d4a020';ctx.fillText(Tr('share_by'),PAD,y+13);
    ctx.fillStyle='#3a6a8a';
    const ft='Unofficial Star Citizen fan tool  ·  TSG Fleet Planner';
    ctx.fillText(ft,W-PAD-ctx.measureText(ft).width,y+13);

    // Export
    const blob=await new Promise(r=>canvas.toBlob(r,'image/png'));
    const url=URL.createObjectURL(blob);
    const a=Object.assign(document.createElement('a'),{href:url,download:'tsg-crew-summary.png'});
    a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);

    let ok=false;
    if(navigator.clipboard&&window.ClipboardItem){
      try{await navigator.clipboard.write([new ClipboardItem({'image/png':blob})]);ok=true;}catch(e){}
    }
    showShareToast(ok?'success':'fallback');
  }catch(e){showShareToast('fallback');}
  finally{if(btn){btn.innerHTML=orig;btn.disabled=false;}}
}
// ─────────────────────────────────────────────────────────────────────────────

loadState();render();
document.addEventListener('click',handleClick);
document.addEventListener('input',handleInput);
document.addEventListener('change',handleChange);
window.addEventListener('scroll',()=>{const btn=document.getElementById('scroll-top-btn');if(btn)btn.classList.toggle('visible',window.scrollY>200);},{passive:true});
window.addEventListener('beforeunload',saveState);
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});
