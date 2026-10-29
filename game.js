'use strict';
// Coordinates are percentages of the same board. Neighbor lists define physically plausible reaches.
const STAGES=[
 {name:'발판을 찾아라',desc:'발을 먼저 옮겨야 높은 홀드에 닿아!',par:4,start:'A',solution:['A','B','C','G'],nodes:[
 {id:'A',x:49,y:83,type:'jug',links:['B','X']},{id:'X',x:76,y:69,type:'jug',links:[]},
 {id:'B',x:24,y:66,type:'jug',links:['C'],requiresFoot:'F1'},
 {id:'C',x:55,y:40,type:'sloper',links:['G']},{id:'G',x:48,y:15,type:'jug',links:[],goal:true}],
 foot:{id:'F1',x:31,y:76,label:'왼발 디디기',unlockFrom:['A'],activeAt:['A','B'],boost:'B'},startFoot:false},
 {name:'돌아가는 길',desc:'위가 막혀 있다면 옆으로 돌아가자!',par:5,start:'A',solution:['A','L','D','E','G'],nodes:[
 {id:'A',x:50,y:84,type:'jug',links:['X','L']},{id:'X',x:54,y:62,type:'crimp',links:[]},
 {id:'L',x:18,y:73,type:'jug',links:['D']},{id:'D',x:15,y:43,type:'jug',links:['E']},
 {id:'E',x:65,y:45,type:'sloper',links:['G']},{id:'G',x:50,y:14,type:'jug',links:[],goal:true}]},
 {name:'위험한 지름길',desc:'짧고 위험한 길, 멀지만 안전한 길!',par:4,start:'A',solution:['A','R','G'],nodes:[
 {id:'A',x:47,y:85,type:'jug',links:['R','B']},
 {id:'R',x:68,y:55,type:'crimp',links:['G'],risk:true},
 {id:'B',x:18,y:75,type:'jug',links:['C']},
 {id:'C',x:20,y:49,type:'jug',links:['D']},
 {id:'D',x:54,y:38,type:'jug',links:['G']},
 {id:'G',x:49,y:15,type:'jug',links:[],goal:true}]
 }
];
const $=id=>document.getElementById(id);
let index=0,state,history=[],locked=false,pending=null,raf=null,beat=0,lastTime=0,modalCallback=null;
const safeSound=()=>{if(navigator.vibrate)navigator.vibrate(16)};
function n(id){return STAGES[index].nodes.find(p=>p.id===id)}
function available(node){if(locked||state.win)return false;let from=n(state.pos);if(!from.links.includes(node.id))return false;if(node.requiresFoot&&!state.foot)return false;if(node.type==='sloper'&&Math.abs(state.balance)>1)return false;return true}
function balanceChange(node){let base=n(state.pos);let diff=node.x-base.x;return Math.abs(diff)<22?Math.sign(state.balance)*-1:Math.sign(diff)}
function createNode(node){let b=document.createElement('button');b.className='hold';b.style.left=node.x+'%';b.style.top=node.y+'%';b.setAttribute('aria-label',node.id+' '+node.type);b.innerHTML=`<img alt="" src="assets/holds/${node.type}.png"><span class="tag">${node.goal?'🏁 GOAL':node.risk?'⚡':node.id==='X'?'?':''}</span>`;b.onclick=()=>tap(node.id);return b}
function render(){let stage=STAGES[index];$('stageNum').textContent=String(index+1).padStart(2,'0')+' / 03';$('stageName').textContent=stage.name;$('moves').textContent=state.moves;$('best').textContent=`목표 ${stage.par}회`;$('balanceName').textContent=state.balance===0?'중립':state.balance<0?'왼쪽':'오른쪽';$('balanceNeedle').style.left=50+state.balance*19+'%';$('grip').textContent='✊ 그립 '+'♥'.repeat(state.grip)+'♡'.repeat(3-state.grip);$('undo').disabled=!history.length||locked;
 $('holds').replaceChildren();stage.nodes.forEach(node=>{const b=createNode(node);b.classList.toggle('open',available(node));b.classList.toggle('locked',!available(node)&&node.id!==state.pos);b.classList.toggle('done',state.pos===node.id);$('holds').appendChild(b)});
 $('foots').replaceChildren();if(stage.foot){const f=stage.foot;let el=document.createElement('button');el.className='foothold';el.style.left=f.x+'%';el.style.top=f.y+'%';el.innerHTML=`<img src="assets/holds/footchip.png" alt=""><span class="tag">${state.foot?'✓ 발 디딤':'👣 발판'}</span>`;el.classList.toggle('open',f.unlockFrom.includes(state.pos)&&!state.foot&&!locked);el.classList.toggle('used',state.foot);el.onclick=()=>{if(locked)return;if(!f.unlockFrom.includes(state.pos)||state.foot){showMessage('지금은 발을 옮길 수 없어!');return}save();state.foot=true;safeSound();showMessage('발 디딤 성공! 이제 왼쪽 저그를 잡을 수 있어.');render()};$('foots').appendChild(el)}
 const cur=n(state.pos);$('bear').style.left=cur.x+'%';$('bear').style.top=(cur.y+7)+'%';$('bearImg').src=`assets/characters/bear_pose_${state.win?3:cur.x>60?1:cur.x<35?2:0}.png`;
}
function showMessage(t){$('message').textContent=t}
function save(){history.push(JSON.parse(JSON.stringify(state)))}
function reset(){cancelAnimationFrame(raf);raf=null;pending=null;locked=false;history=[];state={pos:STAGES[index].start,moves:0,grip:3,balance:0,foot:false,win:false};hideModal();render();showMessage(STAGES[index].desc)}
function tap(id){if(locked||state.win)return;let node=n(id);if(!node||node.id===state.pos)return;if(!available(node)){if(node.requiresFoot&&!state.foot)showMessage('발판을 먼저 밟아야 손이 닿아!');else if(node.type==='sloper'&&Math.abs(state.balance)>1)showMessage('균형이 무너져 슬로퍼를 못 잡아!');else showMessage('여기서는 손이 닿지 않아. 다른 길을 찾아봐!');shake();return}
 if(node.risk){pending=id;locked=true;showTiming();return}commit(id,'')}
function shake(){const el=$('bear');el.classList.remove('shake');void el.offsetWidth;el.classList.add('shake')}
function commit(id,result){save();const node=n(id);let delta=balanceChange(node);let next=Math.max(-2,Math.min(2,state.balance+delta));if(node.type==='jug')next=Math.sign(next)*Math.max(0,Math.abs(next)-1);if(node.type==='sloper')next=0;state.balance=next;state.pos=id;state.moves++;if(result==='good')state.grip=Math.max(0,state.grip-1);if(result==='miss')state.grip=Math.max(0,state.grip-2);if(state.grip===0){render();showMessage('앗! 그립이 다 떨어졌어. 되돌리거나 재도전!');showModal('대롱대롱!','그립이 0이 됐어. 되돌리기로 다른 경로를 찾아볼까?','되돌리기',()=>undo());return}
 state.win=!!node.goal;render();safeSound();if(state.win){const stars=state.moves<=STAGES[index].par&&state.grip>=2?3:state.moves<=STAGES[index].par?2:1;showModal('⭐'.repeat(stars)+' 완등 성공!',`${state.moves}번 이동 · 그립 ${state.grip}/3<br>${index===2?'세 가지 퍼즐 실험 완료!':'다음 퍼즐을 풀어보자!'}`,index===2?'다시 도전':'다음 스테이지',()=>{if(index<2)index++;reset()});return}
 const opts=n(state.pos).links.filter(k=>available(n(k)));showMessage(opts.length===0?'막다른 길이야! 되돌리거나 다시 시작해.':result==='perfect'?'PERFECT! 위험 홀드를 버텼어!':result==='good'?'GOOD! 그립을 1칸 썼어.':'좋아! 다음 홀드를 골라보자.')}
function showModal(title,content,label,cb){locked=false;modalCallback=cb;$('modalTitle').textContent=title;$('modalText').innerHTML=content;$('modalAction').textContent=label;$('timing').hidden=true;$('modalFoot').textContent='';$('modal').hidden=false;render()}
function hideModal(){$('modal').hidden=true;$('timing').hidden=true;modalCallback=null}
function showTiming(){let start=performance.now();beat=0;$('modal').hidden=false;$('modalTitle').textContent='⚡ 크림프 그립!';$('modalText').textContent='움직이는 바가 초록색일 때 탭!';$('modalAction').textContent='지금 잡기!';$('modalFoot').textContent='실패해도 되돌리기 가능';$('timing').hidden=false;const animate=t=>{const elapsed=(t-start)/1000;beat=(Math.sin(elapsed*5.5-Math.PI/2)+1)*50;$('needle').style.left=beat+'%';raf=requestAnimationFrame(animate)};raf=requestAnimationFrame(animate);modalCallback=()=>{cancelAnimationFrame(raf);raf=null;let score=Math.abs(beat-50);let result=score<8?'perfect':score<21?'good':'miss';let id=pending;pending=null;locked=false;hideModal();commit(id,result)}}
function undo(){if(!history.length||raf)return;state=history.pop();hideModal();locked=false;render();showMessage('한 수 되돌렸어. 다른 방법을 찾아보자!')}
$('modalAction').onclick=()=>{if(modalCallback){const fn=modalCallback;modalCallback=null;fn()}};
$('reset').onclick=reset;$('undo').onclick=undo;$('hint').onclick=()=>{const s=STAGES[index];const next=s.solution.find((id,i)=>i>0&&s.solution[i-1]===state.pos);if(index===0&&!state.foot&&state.pos==='A'){showMessage('힌트: 아래 왼쪽의 작은 발판부터 터치!');return}showMessage(next?`힌트: ${next} 홀드를 살펴봐!`:'막힌 길이야. 되돌려서 다른 분기로 가봐!')};$('select').onclick=()=>{showModal('스테이지 선택','1 발판 퍼즐 · 2 우회 퍼즐 · 3 지름길<br>아래 버튼으로 다음 스테이지를 선택해.',`현재 ${index+1} → 다음`,()=>{index=(index+1)%3;reset()})};
reset();
