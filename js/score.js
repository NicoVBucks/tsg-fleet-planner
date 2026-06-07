function computeScore(){
  const byC=c=>S.fleet.filter(s=>SHIPS[s.shipId].cat===c);
  const fighters=byC('fighters'),subcaps=byC('subcapital'),caps=byC('capital');
  const named=allNamed(),fpsP=named.filter(s=>s.fps),trenchP=named.filter(s=>s.trench),trenchBad=trenchP.filter(s=>!s.def.tunnel);
  function ph(label,max,fn){const iss=[],ok=[];const sc=fn(iss,ok);return{label,sc,max,iss,ok};}
  const phases=[
    ph(Tr('ph')[0],20,(iss,ok)=>{let s=0;if(fighters.length>=2){s+=10;ok.push(M('f_ok',fighters.length));}else if(fighters.length===1){s+=5;iss.push(M('f_1'));}else iss.push(M('f_0'));if(subcaps.length>=2){s+=10;ok.push(M('sub_ok',subcaps.length));}else if(subcaps.length===1){s+=5;iss.push(M('sub_1'));}else iss.push(M('sub_0'));return s;}),
    ph(Tr('ph')[1],20,(iss,ok)=>{let s=0;if(subcaps.length>=2){s+=14;ok.push(M('sub_bal_ok',subcaps.length));}else if(subcaps.length===1){s+=7;iss.push(M('sub_bal_1'));}else iss.push(M('sub_bal_0'));const fB=fighters.filter(s=>s.ballistic);if(fB.length>=1){s+=6;ok.push(M('fbal_ok',fB.length));}else if(fighters.length>0)iss.push(M('fbal_no'));return s;}),
    ph(Tr('ph')[2],15,(iss,ok)=>{let s=0;const tf=fighters.filter(s=>SHIPS[s.shipId].tunnel);if(tf.length>=3){s+=15;ok.push(M('tf_ok',tf.length));}else if(tf.length===2){s+=11;ok.push(M('tf_2',tf.length));iss.push(M('tf_2w'));}else if(tf.length===1){s+=6;iss.push(M('tf_1'));}else if(fighters.length>0)iss.push(M('tf_0f'));else iss.push(M('tf_00'));// escapeHTML: names come from user text inputs and are injected into innerHTML via score messages
if(trenchP.length>=2)ok.push(M('tr_ok',trenchP.length,trenchP.map(p=>escapeHTML(p.name)).join(', ')));else if(trenchP.length===1)iss.push(M('tr_1',escapeHTML(trenchP[0].name)));else if(named.length>0)iss.push(M('tr_0'));if(trenchBad.length>0)iss.push(M('tr_bad',trenchBad.map(t=>escapeHTML(t.name)).join(', ')));return s;}),
    ph(Tr('ph')[3],20,(iss,ok)=>{let s=0;if(fpsP.length>=2){s+=20;ok.push(M('fps_ok',fpsP.length,fpsP.map(p=>escapeHTML(p.name)).join(', ')));}else if(fpsP.length===1){s+=5;iss.push(M('fps_1',escapeHTML(fpsP[0].name)));}else if(named.length>0)iss.push(M('fps_0'));else iss.push(M('fps_none'));return s;}),
    ph(Tr('ph')[4],25,(iss,ok)=>{let s=0;if(caps.length>=1){const cap=caps[0],cd=SHIPS[cap.shipId];s+=22;ok.push(M('cap_ok',cd.name));const cn=cap.slots.filter(sl=>sl.name.trim()).length;if(cn>=4)ok.push(M('cap_cr_ok',cn,cd.name));else iss.push(M('cap_cr_no',cn,cd.name));if(caps.length>=2){s+=3;ok.push(M('cap_2',caps.length));}}else{iss.push(M('cap_0'));if(subcaps.length>=3){s+=8;ok.push(M('cap_sub'));}else if(subcaps.length>0)s+=3;}return s;}),
  ];
  const gIss=[];
  const pW=S.fleet.filter(s=>s.shipId==='perseus'&&s.slots.filter(sl=>sl.name.trim()).length<2);
  if(pW.length)gIss.push(M('gi_pers',pW.length));
  const nc=named.length;if(nc<4)gIss.push(M('gi_low'));else if(nc<7)gIss.push(M('gi_sub',nc));
  const tot=phases.reduce((a,p)=>a+p.sc,0),max=phases.reduce((a,p)=>a+p.max,0),pct=Math.round((tot/max)*100);
  const ratings=Tr('rating');let rating,rk;
  if(pct>=88){rating=ratings[0];rk='success';}else if(pct>=68){rating=ratings[1];rk='warning';}else if(pct>=45){rating=ratings[2];rk='warning';}else{rating=ratings[3];rk='danger';}
  return{phases,pct,rating,rk,namedCount:nc,fpsCount:fpsP.length,trenchCount:trenchP.length,gIss};
}
