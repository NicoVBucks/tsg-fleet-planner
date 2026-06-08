function escapeHTML(s){
  return String(s)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

function sanitizePlayerName(val){
  return String(val).replace(/[\x00-\x1f\x7f-\x9f]/g,'').slice(0,40);
}

function isValidTab(v){return['fleet','score','timer','feedback'].includes(v);}
function isValidLang(v){return LANGS.includes(v);}
function isValidShipId(id){return Object.prototype.hasOwnProperty.call(SHIPS,id);}
function isValidClassId(id){return CLASSES.some(c=>c.id===id);}
