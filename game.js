'use strict';
const $=id=>document.getElementById(id),stage=STAGES[0];
let state=initState(stage),history=[],busy=false,raf=0,timingFn=null,primaryFn=null,secondaryFn=null;
const parSafe=solve(stage,initState(stage),false,'good'),parRisk=solve(stage,initState(stage),true,'perfect');
function say(s){$('message').textContent=s}
function modal(html,main,action,second='',alt=null){$('modalBody').innerHTML=html;$('primary').textContent=main;primaryFn=action;$('secondary').hidden=!second;$('secondary').textContent=second;secondaryFn=alt;$('timing').hidden=true;$('modal').hidden=false}
function closeModal(){cancelAnimationFrame(raf);raf=0;timingFn=null;$('modal').hidden=true;$('timing').hidden=true}
$('primary').onclick=()=>{if(primaryFn)primaryFn();else closeModal()};$('secondary').onclick=()=>{if(secondaryFn)secondaryFn();else closeModal()};
function render(){
 $('moves').textContent=state.moves;$('honey').textContent='🍯 '+state.honey.length+'/1';$('grip').textContent=state.st+'/5';
 $('pips').innerHTML=Array.from({length:5},(_,i)=>'<i class="'+(i<state.st?'on':'')+'"></i>').join('');$('needle').style.left=(50+state.b*20)+'%';$('undo').disabled=!history.length||busy;
 const open=new Set(busy||state.win||state.fell?[]:actions(stage,state).map(a=>a.id));
 const from=nodeOf(stage,state.pos);
 $('lines').innerHTML=from.links.map(id=>{const n=nodeOf(stage,id);return '<path d="M'+from.x+' '+from.y+' L'+n.x+' '+n.y+'" stroke="'+(open.has(id)?'#7ad9ad':'#fff9df')+'" />'}).join('');
 $('holds').replaceChildren(...stage.nodes.map(n=>{
 const b=document.createElement('button');b.type='button';b.className='hold';b.style.left=n.x+'%';b.style.top=n.y+'%';b.dataset.id=n.id;
 if(open.has(n.id))b.classList.add('open');if(n.id===state.pos)b.classList.add('here');if(!open.has(n.id)&&n.id!==state.pos)b.classList.add('locked');
 b.innerHTML='<img alt="" src="assets/holds/'+n.type+'.png">'+(n.goal?'<span class="tag goal">🏁 정상</span>':n.id==='L2'?'<span class="tag">💚 휴식</span>':n.id==='R2'?'<span class="tag">⚡ 타이밍</span>':'')+(n.honey&&!state.honey.includes(n.id)?'<span class="honey">🍯</span>':'');
 b.setAttribute('aria-label',n.type+' 홀드 '+n.id);b.onclick=()=>tap(n.id);return b;
 }));
 if(!state.fell){$('bear').style.left=from.x+'%';$('bear').style.top=(from.y+7)+'%'}
 $('bearImg').src='assets/characters/bear_pose_'+(state.win?3:state.b>0?1:state.b<0?2:0)+'.png';
}
function tap(id){if(busy||state.win||state.fell||id===state.pos)return;
 if(!canGrab(stage,state,id).ok){say('아직 이 홀드까지 손이 닿지 않아. 지금 빛나는 홀드를 살펴봐!');return}
 const hold=nodeOf(stage,id);if(hold.type==='crimp')return timing(id);grab(id,'good');
}
function grab(id,grade){history.push(state);const res=applyGrab(stage,state,id,grade);state=res.state;render();
 const bear=$('bear');bear.classList.remove('hop');void bear.offsetWidth;bear.classList.add('hop');
 if(res.events.includes('fall'))return fall();if(res.events.includes('win'))return win();
 if(id==='L1')say('🌿 안전 루트! 볼륨에서 체력을 회복하면서 올라가 보자.');
 else if(id==='R1')say('⚡ 지름길! 그립이 2칸 남았어. 다음 크림프는 PERFECT가 필요해!');
 else if(id==='L2')say('💚 볼륨에서 그립 회복! 이 길은 안전하지만 한 수 더 걸려.');
 else if(id==='R2')say('🍯 꿀 획득! 짧은 도전 루트를 성공했어!');
 else say('좋아! 다음 홀드를 선택해 봐.');
}
function timing(id){busy=true;let t0=performance.now(),pos=0;
 modal('<h2>⚡ 크림프 도전!</h2><p>지름길 성공의 관문!<br>바늘이 <b style="color:#419d72">중앙 초록 영역</b>에 있을 때 탭해 봐.<br>PERFECT만 현재 그립으로 버틸 수 있어!</p>','지금 잡기!',null,'취소',()=>{closeModal();busy=false;render();say('타이밍 도전을 취소했어. 다른 길을 생각해 볼까?')});
 $('timing').hidden=false;const loop=t=>{pos=(Math.sin((t-t0)/1000*4.5-Math.PI/2)+1)*50;$('timingNeedle').style.left=pos+'%';raf=requestAnimationFrame(loop)};raf=requestAnimationFrame(loop);
 timingFn=()=>{const dist=Math.abs(pos-50),grade=dist<6?'perfect':dist<20?'good':'miss';closeModal();busy=false;grab(id,grade);if(!state.fell&&!state.win)say(grade==='perfect'?'⚡ PERFECT! 그립을 아꼈어!':'그립 소모가 컸어. 다음엔 초록을 정확히 노려봐!')};primaryFn=()=>timingFn&&timingFn();
}
$('timing').onpointerdown=e=>{e.preventDefault();if(timingFn)timingFn()};
function fall(){busy=true;const bear=$('bear');bear.classList.add('fall');bear.style.top='115%';say('아앗! 그립이 바닥났어!');setTimeout(()=>modal('<h2>🐻 아슬아슬, 추락!</h2><p>도전 루트에서 크림프 타이밍을 놓쳤어.<br>되돌리거나, 안전 루트로 가봐!</p>','다시 도전',reset,'↶ 되돌리기',undo),750)}
function win(){busy=true;const gotHoney=state.honey.length===honeyIds(stage).length;
 const stars=gotHoney&&state.moves<=(parRisk?.moves||3)?3:gotHoney?2:1;
 const route=state.route==='risk'?'⚡ 위험 지름길':'🌿 안전 루트';
 say('🏁 완등 성공! '+route+' 정복!');setTimeout(()=>modal('<h2>🎉 완등 성공!</h2><p style="font-size:26px">'+('⭐'.repeat(stars))+'</p><div class="panel"><strong>'+route+'</strong><br>이동 '+state.moves+'수 · 꿀 '+state.honey.length+'/1<br><br>⭐ 정상 도착<br>⭐⭐ 꿀을 모아 완등<br>⭐⭐⭐ 꿀을 모아 '+(parRisk?.moves||3)+'수 이내 완등</div><p>이번에는 다른 경로도 도전해봐!</p>','다른 루트 해보기',reset),750)}
function undo(){closeModal();if(!history.length)return;busy=false;state=history.pop();$('bear').classList.remove('fall');render();say('한 수 되돌렸어. 다른 경로를 시도해 봐!')}
function reset(){closeModal();busy=false;history=[];state=initState(stage);$('bear').classList.remove('fall');render();say('🌿 왼쪽은 안전(4수), ⚡ 오른쪽은 위험(3수). 두 길을 비교해봐!')}
function hint(){if(busy||state.win||state.fell)return;
 const good=solve(stage,state,false,'good'),perfect=solve(stage,state,true,'perfect');
 const best=perfect||good;if(!best){say('현재 자세에서는 정상에 갈 수 없어. ↶ 되돌려서 다른 루트를 선택해 봐!');return}
 const next=best.path[0]?.id;
 if(next){const el=document.querySelector('[data-id="'+next+'"]');el?.classList.add('open');if(el){el.style.filter='drop-shadow(0 0 12px #ffdf58)';setTimeout(()=>el.style.filter='',1800)}}
 say(perfect?'💡 꿀과 3성을 노리는 다음 홀드를 빛나게 표시했어.':'💡 지금은 안전하게 완등하는 길을 표시했어.');
}
$('reset').onclick=reset;$('undo').onclick=undo;$('hint').onclick=hint;
if(typeof window!=='undefined')window.__gameDebug={getState:()=>state,stage,solve,parSafe,parRisk,tap,reset};
reset();
