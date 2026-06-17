const SC={success:{text:'#22d480',bg:'rgba(26,184,100,0.12)',bd:'rgba(26,184,100,0.3)'},warning:{text:'#f0a020',bg:'rgba(212,144,16,0.12)',bd:'rgba(212,144,16,0.3)'},danger:{text:'#ff5040',bg:'rgba(200,48,32,0.12)',bd:'rgba(200,48,32,0.3)'},info:{text:'#4db8ff',bg:'rgba(42,144,212,0.12)',bd:'rgba(42,144,212,0.3)'}};
function st(rk,txt){const c=SC[rk]||SC.info;return`<span class="stag" style="background:${c.bg};color:${c.text};border:.5px solid ${c.bd}">${txt}</span>`;}
const CLS_ACC={light:{bg:'rgba(42,144,212,0.14)',color:'#4db8ff',bd:'rgba(42,144,212,0.5)'},medium:{bg:'rgba(26,184,100,0.14)',color:'#30e890',bd:'rgba(26,184,100,0.5)'},heavy:{bg:'rgba(212,144,10,0.14)',color:'#f0a820',bd:'rgba(212,144,10,0.5)'},gunship:{bg:'rgba(220,80,20,0.14)',color:'#ff6a28',bd:'rgba(220,80,20,0.5)'},capital:{bg:'rgba(168,85,247,0.14)',color:'#c888ff',bd:'rgba(168,85,247,0.5)'}};
const CLS_ICONS={light:'ti-plane-tilt',medium:'ti-plane-tilt',heavy:'ti-plane-tilt',gunship:'ti-shield-bolt',capital:'ti-rocket'};
const CAT_ROLES={fighters:['trench','fps'],subcapital:['fps'],capital:['fps']};
const F=[{role:'Pilot',n:1}],FG=[{role:'Pilot',n:1},{role:'Gunner',n:1}];
const P1G2=[{role:'Pilot',n:1},{role:'Gunner',n:2}],P1G4=[{role:'Pilot',n:1},{role:'Gunner',n:4}],P1G5=[{role:'Pilot',n:1},{role:'Gunner',n:5}],P1G6=[{role:'Pilot',n:1},{role:'Gunner',n:6}];
const CLASSES=[{id:'light'},{id:'medium'},{id:'heavy'},{id:'gunship'},{id:'capital'}];
const LANGS=['en','fr','de','it','es','ja'];

const SHIPS={
  gladius:{name:'Aegis Gladius',cls:'light',cat:'fighters',tunnel:true,fav:true,slots:F},gladius_d:{name:'Aegis Gladius Dunlevy',cls:'light',cat:'fighters',tunnel:true,slots:F},
  gladius_p:{name:'Aegis Gladius Pirate',cls:'light',cat:'fighters',tunnel:true,slots:F},gladius_v:{name:'Aegis Gladius Valiant',cls:'light',cat:'fighters',tunnel:true,slots:F},
  arrow:{name:'Anvil Arrow',cls:'light',cat:'fighters',tunnel:true,fav:true,slots:F},hawk:{name:'Anvil Hawk',cls:'light',cat:'fighters',tunnel:true,slots:F},
  khartu:{name:'Aopoa Khartu-al',cls:'light',cat:'fighters',tunnel:false,slots:F},defender:{name:'Banu Defender',cls:'light',cat:'fighters',tunnel:true,slots:FG},
  mustang:{name:'C.O. Mustang Delta',cls:'light',cat:'fighters',tunnel:true,slots:F},buccaneer:{name:'Drake Buccaneer',cls:'light',cat:'fighters',tunnel:true,fav:true,slots:F},
  blade:{name:'Esperia Blade',cls:'light',cat:'fighters',tunnel:true,slots:F},talon:{name:'Esperia Talon',cls:'light',cat:'fighters',tunnel:true,slots:F},
  talon_s:{name:'Esperia Talon Shrike',cls:'light',cat:'fighters',tunnel:true,slots:F},wolf21:{name:'Kruger L-21 Wolf',cls:'light',cat:'fighters',tunnel:true,slots:F},
  wolf22:{name:'Kruger L-22 Alpha Wolf',cls:'light',cat:'fighters',tunnel:true,slots:F},reliant:{name:'MISC Reliant Tana',cls:'light',cat:'fighters',tunnel:false,slots:F},
  origin125:{name:'Origin 125a',cls:'light',cat:'fighters',tunnel:true,slots:F},aurora_ln:{name:'RSI Aurora LN',cls:'light',cat:'fighters',tunnel:true,slots:F},
  aurora_se:{name:'RSI Aurora Mk I SE',cls:'light',cat:'fighters',tunnel:true,slots:F},aurora_mk2:{name:'RSI Aurora MK2',cls:'light',cat:'fighters',tunnel:true,slots:F},aurora_mr:{name:'RSI Aurora MR',cls:'light',cat:'fighters',tunnel:true,slots:F},
  f7a_1:{name:'Anvil F7A Hornet Mk I',cls:'medium',cat:'fighters',tunnel:true,slots:F},f7a_2:{name:'Anvil F7A Hornet Mk II',cls:'medium',cat:'fighters',tunnel:true,slots:F},
  f7c_1:{name:'Anvil F7C Hornet Mk I',cls:'medium',cat:'fighters',tunnel:true,slots:F},f7c_2:{name:'Anvil F7C Hornet Mk II',cls:'medium',cat:'fighters',tunnel:true,fav:true,slots:F},
  f7c_wf:{name:'Anvil F7C Hornet Wildfire',cls:'medium',cat:'fighters',tunnel:true,slots:F},f7cm_hs1:{name:'Anvil F7C-M Heartseeker Mk I',cls:'medium',cat:'fighters',tunnel:true,slots:F},
  f7cm_hs2:{name:'Anvil F7C-M Heartseeker Mk II',cls:'medium',cat:'fighters',tunnel:true,slots:F},f7cm_sh1:{name:'Anvil F7C-M Super Hornet Mk I',cls:'medium',cat:'fighters',tunnel:true,slots:F},
  f7cm_sh2:{name:'Anvil F7C-M Super Hornet Mk II',cls:'medium',cat:'fighters',tunnel:true,slots:F},santok:{name:"Aopoa San'tok.yāi",cls:'medium',cat:'fighters',tunnel:true,slots:F},
  cutlass:{name:'Drake Cutlass Black',cls:'medium',cat:'fighters',tunnel:false,slots:F},glaive:{name:'Esperia Glaive',cls:'medium',cat:'fighters',tunnel:false,slots:F},
  meteor:{name:'RSI Meteor',cls:'medium',cat:'fighters',tunnel:true,slots:F},scythe:{name:'Vanduul Scythe',cls:'medium',cat:'fighters',tunnel:false,slots:F},
  vg_harb:{name:'Aegis Vanguard Harbinger',cls:'heavy',cat:'fighters',tunnel:false,slots:F},vg_sent:{name:'Aegis Vanguard Sentinel',cls:'heavy',cat:'fighters',tunnel:false,slots:F},
  vg_ward:{name:'Aegis Vanguard Warden',cls:'heavy',cat:'fighters',tunnel:false,slots:F},f8c:{name:'Anvil F8C Lightning',cls:'heavy',cat:'fighters',tunnel:true,fav:true,slots:F},
  hurricane:{name:'Anvil Hurricane',cls:'heavy',cat:'fighters',tunnel:true,slots:F},ares_i:{name:'Crusader Ares Inferno',cls:'heavy',cat:'fighters',tunnel:false,slots:F},
  ares_ion:{name:'Crusader Ares Ion',cls:'heavy',cat:'fighters',tunnel:false,slots:F},stinger:{name:'Esperia Stinger',cls:'heavy',cat:'fighters',tunnel:false,slots:F},
  shiv:{name:"Grey's Shiv",cls:'heavy',cat:'fighters',tunnel:false,slots:F},guardian:{name:'Mirai Guardian',cls:'heavy',cat:'fighters',tunnel:true,slots:F},
  guardian_mx:{name:'Mirai Guardian MX',cls:'heavy',cat:'fighters',tunnel:true,slots:F},m80:{name:'Origin M80',cls:'heavy',cat:'fighters',tunnel:true,slots:F},
  scorpius:{name:'RSI Scorpius',cls:'heavy',cat:'fighters',tunnel:true,slots:FG},scorpius_a:{name:'RSI Scorpius Antares',cls:'heavy',cat:'fighters',tunnel:true,slots:FG},
  hammerhead:{name:'Aegis Hammerhead',cls:'gunship',cat:'subcapital',tunnel:false,slots:P1G6},redeemer:{name:'Aegis Redeemer',cls:'gunship',cat:'subcapital',tunnel:false,slots:FG},
  tiburon:{name:'Aegis Tiburon',cls:'gunship',cat:'subcapital',tunnel:false,slots:P1G4},paladin:{name:'Anvil Paladin',cls:'gunship',cat:'subcapital',tunnel:false,slots:FG},
  fmis:{name:'MISC Freelancer MIS',cls:'gunship',cat:'subcapital',tunnel:false,slots:FG},perseus:{name:'RSI Perseus',cls:'gunship',cat:'subcapital',tunnel:false,fav:true,note:true,slots:P1G2},
  idris_m:{name:'Aegis Idris-M',cls:'capital',cat:'capital',tunnel:false,fav:true,slots:P1G4},idris_p:{name:'Aegis Idris-P',cls:'capital',cat:'capital',tunnel:false,fav:true,slots:P1G4},
  polaris:{name:'RSI Polaris',cls:'capital',cat:'capital',tunnel:false,fav:true,slots:P1G4},
};
