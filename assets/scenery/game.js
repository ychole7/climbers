'use strict';
// 영차영차 등반대 — 화면/연출. 규칙은 rules.js, 스테이지는 stages.js
const $=id=>document.getElementById(id);
const SAVE_KEY='climbers.v2';
const INTROS={
 jug:{img:'jug',title:'저그 & 꿀단지',text:'저그를 잡으면 체력이 1 회복돼.<br>🍯 꿀단지를 모두 모으고, 파(최소 이동) 안에 정상에 오르면 ⭐⭐⭐!'},
 foot:{img:'footchip',title:'발판',text:'반짝이는 발판을 눌러 발을 디뎌.<br>발을 디뎌야만 닿는 홀드가 있어!'},
 crimp:{img:'crimp',title:'크림프 ⚡',text:'좁은 턱이라 타이밍 미니게임!<br>PERFECT 체력 −1 · GOOD −2 · MISS −3'},
 sloper:{img:'sloper',title:'슬로퍼 ⚖️',text:'미끄러운 홀드. 균형 바늘이 <b style="color:#3d9a63">가운데(초록)</b>일 때만 잡을 수 있어.<br>좌우로 크게 움직이면 몸이 기울고, 위로 곧게 오르면 다시 가운데로 와.'},
 sidepull:{img:'sidepull',title:'사이드풀 ↔️',text:'옆으로 당기는 홀드는 몸이 <b>기울어 있어야</b> 잡혀.<br>잡고 나면 균형이 가운데로 돌아와!'},
 undercling:{img:'undercling',title:'언더클링 👣',text:'아래에서 들어 올리는 홀드.<br>발판을 밟고 있어야만 잡을 수 있어.'},
 volume:{img:'volume',title:'볼륨 💤 & 포켓 ☝️',text:'볼륨은 쉼터: 체력 +1, 균형도 가운데로.<br>포켓은 손가락 하나라 체력 −2!'},
 wobble:{img:'pinch',title:'기우뚱!',text:'균형이 끝까지(빨강) 기울면 <b>움직일 때마다 체력 −1</b>.<br>발판을 디디면 한 칸 바로 서. 핀치 🤏는 체력 −1.'},
 release:{img:'footchip',title:'발이 미끄러져!',text:'손이 발판보다 훨씬 높아지면 발이 떨어져.<br>높은 곳에서 다시 발판을 디뎌야 해!'},
 final:{img:'jug',title:'정상 등정 🏔️',text:'지금까지 배운 모든 규칙이 나와.<br>체력 3으로 꿀 셋을 모을 수 있을까?'}
};
const WHY={reach:'여기서는 손이 닿지 않아! 점선이 닿는 곳이야.',foot:'발판을 먼저 디뎌야 손이 닿아! 👣',under:'언더클링은 발판을 밟고 있어야 해! 👣',sloper:'균형이 기울어서 슬로퍼가 미끄러워! ⚖️ 가운데로 맞춰 봐.',side:'사이드풀은 몸이 기울어 있어야 잡혀! ↔️ 옆에서 접근해 봐.'};
let save=loadSave(),index=Math.min(save.cur||0,STAGES.length-1),state,history=[],busy=false,raf=null,modalCb=null,altCb=null,timingFn=null,hintTimer=null;
const S=()=>STAGES[index];
const parOf=i=>{STAGES[i]._par??=(solve(STAGES[i],initState(STAGES[i]),true)||{moves:99}).moves;return STAGES[i]._par};
function loadSave(){try{return JSON.parse(localStorage.getItem(SAVE_KEY))||{stars:{},best:{},seen:{}}}catch(e){return {stars:{},best:{},seen:{}}}}
function persist(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(save))}catch(e){}}
const unlocked=i=>i===0||(save.stars[i-1]||0)>0;

/* ---------- 사운드 (WebAudio 합성, 파일 불필요) ---------- */
let ac=null;
function tone(f,d=.12,type='sine',v=.18,when=0,slide=0){if(save.mute)return;try{ac=ac||new (window.AudioContext||window.webkitAudioContext)();const t=ac.currentTime+when,o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(slide,t+d);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g).connect(ac.destination);o.start(t);o.stop(t+d+.02)}catch(e){}}
const SFX={
 grab:y=>{tone(300+(100-y)*7,.09,'triangle',.2);tone(600+(100-y)*9,.06,'sine',.08,.04)},
 step:()=>tone(140,.12,'sine',.25,0,90),
 rest:()=>{tone(523,.1,'sine',.1);tone(784,.15,'sine',.08,.08)},
 honey:()=>{[880,1175,1568].forEach((f,i)=>tone(f,.14,'triangle',.14,i*.07))},
 no:()=>{tone(180,.14,'square',.06);tone(150,.16,'square',.06,.08)},
 wobble:()=>tone(400,.35,'sine',.12,0,250),
 fall:()=>tone(700,.8,'triangle',.18,0,90),
 tick:()=>tone(1200,.03,'square',.04),
 perfect:()=>{[660,880,1320].forEach((f,i)=>tone(f,.1,'square',.07,i*.05))},
 win:()=>{[523,659,784,1047,1319].forEach((f,i)=>tone(f,.22,'triangle',.16,i*.11))},
 star:i=>tone(880+i*220,.18,'triangle',.15)
};
const buzz=ms=>{if(navigator.vibrate&&!save.mute)navigator.vibrate(ms)};

/* ---------- 연출 ---------- */
function boardPt(x,y){const b=$('board').getBoundingClientRect(),g=$('game').getBoundingClientRect();return {x:b.left-g.left+b.width*x/100,y:b.top-g.top+b.height*y/100}}
function fx(cls,x,y,html='',vars={}){const p=boardPt(x,y),e=document.createElement('div');e.className='fx '+cls;e.style.left=p.x+'px';e.style.top=p.y+'px';e.innerHTML=html;for(const k in vars)e.style.setProperty(k,vars[k]);$('game').appendChild(e);setTimeout(()=>e.remove(),1500);return e}
function chalk(x,y,n=7){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,r=18+Math.random()*26;fx('puff',x,y,'',{'--dx':Math.cos(a)*r+'px','--dy':Math.sin(a)*r+'px'})}}
function floatText(x,y,t,color){const e=fx('txt',x,y-6,t);if(color)e.style.color=color}
function confetti(){const cols=['#ff7b7b','#ffd23f','#7fd6a0','#7fb8ff','#d59cff'];for(let i=0;i<46;i++){const e=fx('conf',50,18,'',{'--dx':(Math.random()-.5)*360+'px','--dy':(120+Math.random()*420)+'px','--r':(Math.random()*900-450)+'deg'});e.style.background=cols[i%5];e.style.animationDelay=Math.random()*.25+'s'}}
function honeyFly(x,y){const p=boardPt(x,y),t=$('honeyc').getBoundingClientRect(),g=$('game').getBoundingClientRect(),e=document.createElement('div');e.className='fx honeyfly';e.textContent='🍯';e.style.left=p.x+'px';e.style.top=p.y+'px';$('game').appendChild(e);requestAnimationFrame(()=>requestAnimationFrame(()=>{e.style.left=(t.left-g.left+20)+'px';e.style.top=(t.top-g.top+8)+'px';e.style.transform='translate(-50%,-50%) scale(.5)'}));setTimeout(()=>{e.remove();const h=$('honeyc');h.classList.remove('bump');void h.offsetWidth;h.classList.add('bump')},720)}
function anim(el,cls,ms=600){el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls);setTimeout(()=>el.classList.remove(cls),ms)}
function say(t){$('message').innerHTML=t;anim($('msgbox'),'pop',350)}

/* ---------- 렌더 ---------- */
function posOf(id){return nodeOf(S(),id)||footOf(S(),id)}
function render(){
 const s=S(),par=parOf(index),hs=honeyIds(s);
 $('stageNum').innerHTML=String(index+1).padStart(2,'0')+`<small> / ${STAGES.length}</small>`;$('stageName').textContent=s.name;
 $('moves').innerHTML=`${state.moves}<small> / 파 ${par}</small>`;$('moves').style.color=state.moves>par?'#c4573f':'';
 $('honeyc').textContent=`🍯 ${state.honey.length}/${hs.length}`;
 $('stNum').textContent=state.st+'/'+RULES.MAX_ST;
 $('pips').innerHTML=Array.from({length:RULES.MAX_ST},(_,i)=>`<i class="${i<state.st?'on':''}"></i>`).join('');$('pips').classList.toggle('low',state.st<=1);
 $('balanceNeedle').style.left=50+state.b*20+'%';$('balanceName').textContent=['왼쪽 기우뚱!','왼쪽','가운데','오른쪽','오른쪽 기우뚱!'][state.b+2];
 $('undo').disabled=!history.length||busy;
 const open=new Set(busy||state.win||state.fell?[]:actions(s,state).map(a=>a.id)),cur=nodeOf(s,state.pos);
 // 손 닿는 범위 점선
 let svg='';cur.links.forEach(id=>{const n=nodeOf(s,id),ok=open.has(id);svg+=`<line x1="${cur.x}" y1="${cur.y}" x2="${n.x}" y2="${n.y}" stroke="${ok?'#5be3a0':'#ffffff'}" stroke-opacity="${ok?.9:.45}" stroke-width="${ok?3:2}" stroke-dasharray="${ok?'2 7':'1 6'}"/>`});
 (s.feet||[]).forEach(f=>{if(open.has(f.id))svg+=`<line x1="${cur.x}" y1="${cur.y}" x2="${f.x}" y2="${f.y}" stroke="#ffd54d" stroke-opacity=".8" stroke-width="2" stroke-dasharray="1 6"/>`});
 $('lines').innerHTML=svg;
 $('holds').replaceChildren(...s.nodes.map(n=>{const b=document.createElement('button');b.className='hold';b.dataset.id=n.id;b.style.left=n.x+'%';b.style.top=n.y+'%';const info=HOLD_INFO[n.type];b.setAttribute('aria-label',info.name+(n.goal?' 정상':'')+(n.honey?' 꿀':''));
  b.innerHTML=`<img alt="" src="assets/holds/${n.type}.png"><span class="tag">${n.goal?'🏁 정상':''}</span>${n.type!=='jug'?`<span class="htag">${info.icon}</span>`:''}${n.honey&&!state.honey.includes(n.id)?'<span class="honey">🍯</span>':''}`;
  b.classList.toggle('open',open.has(n.id));b.classList.toggle('here',n.id===state.pos);b.classList.toggle('locked',!open.has(n.id)&&n.id!==state.pos);b.onclick=()=>tapHold(n.id);return b}));
 $('foots').replaceChildren(...(s.feet||[]).map(f=>{const el=document.createElement('button');el.className='foothold';el.dataset.id=f.id;el.style.left=f.x+'%';el.style.top=f.y+'%';el.setAttribute('aria-label','발판');
  el.innerHTML=`<img src="assets/holds/footchip.png" alt=""><span class="tag">${state.foot===f.id?'🦶 디딤':''}</span>${f.honey&&!state.honey.includes(f.id)?'<span class="honey">🍯</span>':''}`;
  el.classList.toggle('open',open.has(f.id));el.classList.toggle('used',state.foot===f.id);el.onclick=()=>tapFoot(f.id);return el}));
 if(!state.fell){$('bear').style.left=cur.x+'%';$('bear').style.top=(cur.y+7)+'%'}
 $('bearImg').src=`assets/characters/bear_pose_${state.win?3:state.b>0?1:state.b<0?2:0}.png`;
}

/* ---------- 입력 ---------- */
function tapHold(id){
 if(busy||state.win||state.fell||id===state.pos)return;
 const c=canGrab(S(),state,id);
 if(!c.ok){SFX.no();buzz(30);say(WHY[c.why]);anim(document.querySelector(`.hold[data-id="${id}"]`),'wiggle',350);anim($('bear'),'shake',350);return}
 if(nodeOf(S(),id).type==='crimp'){crimpGame(g=>doGrab(id,g));return}
 doGrab(id,'good');
}
function tapFoot(fid){
 if(busy||state.win||state.fell)return;
 if(!canStep(S(),state,fid)){SFX.no();say(state.foot===fid?'이미 디디고 있어!':'지금 잡은 홀드에서는 그 발판에 발이 안 닿아.');anim(document.querySelector(`.foothold[data-id="${fid}"]`),'wiggle',350);return}
 history.push(state);const r=applyStep(S(),state,fid);state=r.state;const f=footOf(S(),fid);
 SFX.step();buzz(15);chalk(f.x,f.y,5);react(r.events,f,'발 디딤! 몸이 한 칸 바로 섰어.');
}
function doGrab(id,grade){
 history.push(state);const prev=state,r=applyGrab(S(),state,id,grade);state=r.state;const n=nodeOf(S(),id);
 SFX.grab(n.y);buzz(12);anim($('bear'),'hop',420);
 setTimeout(()=>chalk(n.x,n.y),200);
 const d=state.st-prev.st;if(!r.events.includes('fall'))setTimeout(()=>floatText(n.x,n.y,d>0?'+'+d+' ✊':d<0?d+' ✊':'±0',d>0?'#9fffc4':d<0?'#ffd0b0':'#fff'),180);
 const g={perfect:'PERFECT! 체력을 아꼈어!',good:'GOOD! 꽉 잡았어.',miss:'MISS… 겨우 버텼어!'};
 react(r.events,n,n.type==='crimp'?g[grade]:r.events.includes('rest')?(n.type==='volume'?'볼륨에서 숨 고르기! 체력 +1, 균형 가운데.':'저그에서 쉬었어! 체력 +1'):'좋아! 다음 홀드는?');
}
function react(ev,p,text){
 render();
 if(ev.includes('honey')){setTimeout(()=>{SFX.honey();honeyFly(p.x,p.y)},220)}
 if(ev.includes('release')){text='앗, 손이 너무 높아서 발이 떨어졌어! 🦶';}
 if(ev.includes('wobble')){setTimeout(()=>{SFX.wobble();anim($('bear'),'wob',600);anim($('pips'),'flash',400)},250);text='기우뚱! 너무 기울어서 체력 −1. 발판이나 위쪽으로 균형을 잡아!'}
 if(ev.includes('fall'))return fall();
 if(ev.includes('win'))return win();
 const left=actions(S(),state);
 if(!left.length){text='막다른 길이야! ↶ 되돌리기로 다른 길을 찾아봐.';$('undo').classList.add('nudge')}else $('undo').classList.remove('nudge');
 if(state.st===1&&!ev.includes('wobble'))text+=' (체력 1! 저그나 볼륨이 필요해)';
 say(text);
}
function fall(){
 busy=true;SFX.fall();buzz([40,40,80]);const b=$('bear');b.classList.add('fall');b.style.top='112%';
 setTimeout(()=>{anim($('game'),'quake',400);chalk(parseFloat(b.style.left),100,10)},850);
 setTimeout(()=>{b.classList.remove('fall');busy=false;
  modal(`<h2>대롱대롱… 쿵!</h2><p>체력이 바닥났어 😵<br>저그·볼륨에서 쉬거나 PERFECT로 아껴 보자.</p>`,'↶ 한 수 되돌리기',undo,'처음부터',reset)},1100);
}
function win(){
 busy=true;const s=S(),par=parOf(index),all=honeyIds(s).length,gotAll=state.honey.length===all,underPar=state.moves<=par;
 const stars=1+(gotAll?1:0)+(gotAll&&underPar?1:0);
 save.stars[index]=Math.max(save.stars[index]||0,stars);if(gotAll)save.best[index]=Math.min(save.best[index]||99,state.moves);save.cur=Math.min(index+1,STAGES.length-1);persist();
 SFX.win();buzz([20,30,20,30,60]);anim($('bear'),'cheer',1800);setTimeout(confetti,250);
 const ok=(b,t)=>`<div class="${b?'ok':'no'}">${b?'✔':'○'} ${t}</div>`,last=index===STAGES.length-1;
 const bonus=gotAll&&state.moves<par?`<p style="color:#d4881f;font-weight:900">🔥 파보다 ${par-state.moves}수 적게! 엄청난 PERFECT 실력!</p>`:'';
 setTimeout(()=>{busy=false;modal(`<h2>완등 성공!</h2><div class="stars">${[0,1,2].map(i=>`<span class="${i<stars?'on':''}" style="animation-delay:${.15+i*.25}s">⭐</span>`).join('')}</div>
  <div class="goals">${ok(true,'정상 도착')}${ok(gotAll,`꿀단지 모두 모으기 (${state.honey.length}/${all})`)}${ok(gotAll&&underPar,`꿀 다 모으고 ${par}수 이내 (이번 ${state.moves}수)`)}</div>${bonus}`,
  last?'🏔️ 처음 스테이지로':'다음 스테이지 ▶',()=>{index=last?0:index+1;start()},stars<3?'⟳ 3별 도전':'다시 하기',reset);
  [0,1,2].forEach(i=>{if(i<stars)setTimeout(()=>SFX.star(i),150+i*250)})},900);
}
function undo(){if(!history.length||busy)return;cancelTiming();state=history.pop();hideModal();$('undo').classList.remove('nudge');render();say('한 수 되돌렸어. 다른 방법을 찾아보자!')}
function reset(){cancelTiming();hideModal();busy=false;history=[];state=initState(S());$('bear').classList.remove('fall');$('undo').classList.remove('nudge');render();say(S().desc)}
function start(){save.cur=index;persist();reset();const k=S().intro;if(k&&!save.seen[k]){save.seen[k]=1;persist();showIntro(k)}}
function showIntro(k){const it=INTROS[k];modal(`<img class="intro-hold" src="assets/holds/${it.img}.png" alt=""><h2>${it.title}</h2><p>${it.text}</p>`,'알겠어!',()=>{})}

/* ---------- 힌트 ---------- */
function hint(){
 if(busy||state.win||state.fell)return;clearTimeout(hintTimer);document.querySelectorAll('.hint').forEach(e=>e.classList.remove('hint'));
 let sol=solve(S(),state,true),txt;
 if(sol)txt=state.honey.length<honeyIds(S()).length?'반짝이는 곳으로! 꿀도 다 모을 수 있는 길이야.':'반짝이는 곳으로 가 봐!';
 else{sol=solve(S(),state,false);txt=sol?'이 길로는 꿀을 다 못 모아. 정상만 노린다면 반짝이는 곳! (↶로 다시 생각해도 좋아)':'여기선 정상에 갈 수 없어. ↶ 되돌리기!'}
 if(!sol){say(txt);$('undo').classList.add('nudge');return}
 const a=sol.path[0],el=document.querySelector(`[data-id="${a.id}"]`);el&&el.classList.add('hint');say('💡 '+txt);SFX.tick();
 hintTimer=setTimeout(()=>el&&el.classList.remove('hint'),2600);
}

/* ---------- 크림프 타이밍 ---------- */
function crimpGame(done){
 busy=true;const speed=4.6+index*.25,t0=performance.now();let pos=0,lastSide=0;
 modal('<h2>⚡ 크림프 그립!</h2><p>바늘이 <b style="color:#3d9a63">가운데 초록</b>에 올 때 탭!</p>','지금 잡기!',null);
 $('timing').hidden=false;$('modalFoot').textContent='PERFECT −1 · GOOD −2 · MISS −3 ✊';
 const loop=t=>{pos=(Math.sin((t-t0)/1000*speed-Math.PI/2)+1)*50;$('needle').style.left=pos+'%';const side=pos>50?1:-1;if(side!==lastSide){lastSide=side;SFX.tick()}raf=requestAnimationFrame(loop)};raf=requestAnimationFrame(loop);
 timingFn=()=>{cancelTiming();const d=Math.abs(pos-50),g=d<6?'perfect':d<20?'good':'miss';hideModal();busy=false;if(g==='perfect'){SFX.perfect();anim($('game'),'quake',300)}done(g)};
 modalCb=timingFn;
}
function cancelTiming(){if(raf)cancelAnimationFrame(raf);raf=null;timingFn=null}
$('timing').onpointerdown=e=>{e.preventDefault();timingFn&&timingFn()};

/* ---------- 모달 / 메뉴 ---------- */
function modal(html,label,cb,alt,altFn){modalCb=cb;altCb=altFn||null;$('modalBody').innerHTML=html;$('modalAction').textContent=label;$('modalAlt').hidden=!alt;$('modalAlt').textContent=alt||'';$('timing').hidden=true;$('modalFoot').textContent='';$('modal').hidden=false}
function hideModal(){$('modal').hidden=true;$('timing').hidden=true;modalCb=null;altCb=null}
$('modalAction').onclick=()=>{const f=modalCb;if(f===timingFn&&f)return f();hideModal();f&&f()};
$('modalAlt').onclick=()=>{const f=altCb;hideModal();f&&f()};
function stageMenu(){
 const total=STAGES.reduce((a,_,i)=>a+(save.stars[i]||0),0);
 modal(`<h2>스테이지</h2><div class="legend">모은 별 ⭐ ${total} / ${STAGES.length*3}</div><div class="grid">${STAGES.map((s,i)=>`<button data-i="${i}" class="${i===index?'cur':''}" ${unlocked(i)?'':'disabled'}>${unlocked(i)?i+1:'🔒'}<small>${'★'.repeat(save.stars[i]||0)}${'☆'.repeat(3-(save.stars[i]||0))}</small></button>`).join('')}</div>`,'닫기',null);
 $('modalBody').querySelectorAll('.grid button').forEach(b=>b.onclick=()=>{index=+b.dataset.i;hideModal();start()});
}
function rulesMenu(){
 modal(`<h2>홀드 도감</h2><div class="rules">${Object.entries(HOLD_INFO).map(([k,v])=>`<div><img src="assets/holds/${k==='foot'?'footchip':k}.png" alt=""><span><b>${v.icon} ${v.name}</b><br>${v.rule}</span></div>`).join('')}<div><span style="font-size:30px;width:38px;text-align:center">⚖️</span><span><b>균형</b><br>좌우로 크게 움직이면 한 칸 기울고, 위로 곧게 오르면 한 칸 돌아와. 끝까지 기울면 움직일 때마다 체력 −1!</span></div></div>`,'닫기',null);
}
$('reset').onclick=reset;$('undo').onclick=undo;$('hint').onclick=hint;$('select').onclick=stageMenu;$('help').onclick=rulesMenu;
$('mute').onclick=()=>{save.mute=!save.mute;persist();$('mute').textContent=save.mute?'🔇':'🔊';if(!save.mute)SFX.tick()};$('mute').textContent=save.mute?'🔇':'🔊';
document.addEventListener('keydown',e=>{if(e.key==='z'&&(e.ctrlKey||e.metaKey))undo();if(e.key===' '&&timingFn){e.preventDefault();timingFn()}});
start();
