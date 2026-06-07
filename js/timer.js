function fmtTime(ms){const s=Math.floor(ms/1000),h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60,p=n=>n.toString().padStart(2,'0');return h>0?`${h}:${p(m)}:${p(sec)}`:`${p(m)}:${p(sec)}`;}

function startTimer(){if(S.timer.running||S.timer.phases.length>=5)return;S.timer.running=true;S.timer.startTs=Date.now();S.timer.intervalId=setInterval(tickTimer,200);render();}
function pauseTimer(){if(!S.timer.running)return;S.timer.elapsed+=Date.now()-S.timer.startTs;S.timer.running=false;clearInterval(S.timer.intervalId);S.timer.intervalId=null;render();}
function resetTimer(){clearInterval(S.timer.intervalId);S.timer={running:false,startTs:null,elapsed:0,phases:[],intervalId:null};render();}
function markPhase(){if(S.timer.phases.length>=5||!S.timer.running)return;const ms=S.timer.elapsed+(S.timer.running&&S.timer.startTs?Date.now()-S.timer.startTs:0);S.timer.phases.push({ph:S.timer.phases.length+1,elapsed:ms});if(S.timer.phases.length===5){S.timer.elapsed=ms;S.timer.running=false;clearInterval(S.timer.intervalId);S.timer.intervalId=null;}render();}
function unmarkPhase(){if(!S.timer.phases.length)return;const wasDone=S.timer.phases.length===5;S.timer.phases.pop();if(wasDone){S.timer.running=true;S.timer.startTs=Date.now();S.timer.intervalId=setInterval(tickTimer,200);}render();}
function tickTimer(){const el=document.getElementById('timer-display');if(!el||!S.timer.running)return;el.textContent=fmtTime(S.timer.elapsed+(Date.now()-S.timer.startTs));}
