'use strict';
// Yeongcha: data-driven climbing puzzles. The existing visual layers remain untouched.
const LEVELS=[
 {name:'첫 번째 정상',tip:'빛나는 저그를 잡으며 정상까지 올라가요.',goal:4,holds:[[28,76,'jug'],[72,76,'jug'],[46,57,'jug'],[73,56,'jug'],[46,37,'jug'],[49,17,'goal']]},
 {name:'왼쪽으로 영차!',tip:'가장 높은 홀드가 항상 다음 길은 아니에요.',goal:4,holds:[[26,78,'jug'],[75,79,'jug'],[21,59,'jug'],[59,60,'jug'],[34,40,'jug'],[78,39,'crimp'],[48,19,'goal']]},
 {name:'중앙에서 균형 잡기',tip:'한쪽으로 기울었다면 중앙의 저그를 잡아요.',goal:5,required:['sloper'],holds:[[23,79,'jug'],[74,77,'jug'],[23,59,'crimp'],[49,59,'jug'],[77,58,'crimp'],[51,40,'sloper'],[27,38,'jug'],[50,19,'goal']]},
 {name:'위험한 지름길',tip:'안전한 길과 짧은 크림프 길을 비교하세요.',goal:4,holds:[[23,79,'jug'],[76,79,'crimp'],[35,61,'jug'],[76,60,'crimp'],[37,42,'jug'],[63,42,'crimp'],[49,19,'goal']]},
 {name:'별 세 개의 비밀',tip:'완등은 기본! 더 적은 이동으로 도전해봐요.',goal:4,holds:[[22,79,'jug'],[76,79,'jug'],[26,60,'jug'],[52,58,'crimp'],[78,59,'jug'],[50,39,'jug'],[28,37,'crimp'],[50,18,'goal']]},
 {name:'동그란 슬로퍼',tip:'슬로퍼를 잡기 전에 균형을 중앙으로 되돌려요.',goal:5,required:['sloper'],holds:[[24,79,'jug'],[74,79,'jug'],[48,60,'jug'],[25,59,'crimp'],[51,41,'sloper'],[79,40,'jug'],[49,19,'goal']]},
 {name:'막다른 갈림길',tip:'막혔다면 되돌리기로 다른 루트를 찾아요.',goal:5,holds:[[24,79,'jug'],[74,79,'jug'],[22,60,'jug'],[57,59,'jug'],[82,58,'crimp'],[16,41,'crimp'],[52,40,'jug'],[48,19,'goal']]},
 {name:'볼륨을 딛고',tip:'큰 볼륨에 오르면 다음 홀드까지 멀리 뻗을 수 있어요.',goal:4,required:['volume'],holds:[[25,79,'jug'],[75,79,'jug'],[51,61,'volume'],[15,57,'crimp'],[76,57,'crimp'],[49,39,'jug'],[50,18,'goal']]},
 {name:'그립을 지켜라',tip:'그립이 모자라면 안전한 저그를 이용하세요.',goal:5,required:['crimp'],holds:[[24,79,'jug'],[75,79,'crimp'],[25,60,'crimp'],[52,60,'jug'],[78,59,'crimp'],[49,40,'jug'],[25,39,'crimp'],[78,39,'sloper'],[49,18,'goal']]},
 {name:'첫 번째 등반 마스터',tip:'모든 홀드의 특징을 활용해 별 세 개를 노려요.',goal:5,required:['volume','sloper'],holds:[[23,79,'jug'],[76,79,'crimp'],[47,61,'volume'],[18,59,'jug'],[79,60,'crimp'],[30,41,'crimp'],[52,40,'sloper'],[79,39,'jug'],[50,18,'goal']]}
];
const ASSET={jug:'jug',crimp:'crimp',sloper:'sloper',volume:'volume',goal:'jug'};
const $=id=>document.getElementById(id);
const storeKey='yeongcha-stages-v1';
let saved={unlocked:1,stars:Array(10).fill(0)};
try{const v=JSON.parse(localStorage.getItem(storeKey));if(v&&Number.isInteger(v.unlocked)&&Array.isArray(v.stars))saved={unlocked:Math.min(10,Math.max(1,v.unlocked)),stars:v.stars.slice(0,10)}}catch(e){}
let level=0,history=[],grip=3,balance=0,busy=false,timingTimer=0,timingStart=0,pending=null,unlockedAfterClear=false;
const nodes=()=>LEVELS[level].holds.map(([x,y,type],i)=>({id:i,x,y,type}));
const current=()=>history.length?nodes()[history.at(-1).id]:{x:50,y:94};
const moves=()=>history.length;
function reach(n,src=current()) { const dx=Math.abs(n.x-src.x),dy=src.y-n.y;return dy>=9&&dy<=25&&dx<=(src.type==='volume'?54:43) }
function newBalance(n,from=current(),b=balance){let v=b+(n.x>from.x+13?1:n.x<from.x-13?-1:0);if(n.type==='jug'||n.type==='volume'||n.type==='goal')v+=v>0?-1:v<0?1:0;return v}
function penalty(n){return n.type==='crimp'?1:0}
function legal(n){if(n.type==='goal'&&LEVELS[level].required&&!LEVELS[level].required.every(t=>history.some(h=>nodes()[h.id].type===t)))return false;if(history.some(x=>x.id===n.id))return false;const b=newBalance(n);return reach(n)&&Math.abs(b)<=1&&(n.type!=='sloper'||b===0)&&grip>penalty(n)}
function safeSave(){try{localStorage.setItem(storeKey,JSON.stringify(saved))}catch(e){}}
function render(){const data=LEVELS[level],arr=nodes(),pos=current();$('stageLabel').textContent='STAGE '+String(level+1).padStart(2,'0');$('stageDesc').textContent=data.name;$('moveLabel').textContent=moves()+' / '+data.goal;$('needle').style.left=(50+balance*22)+'%';$('balanceText').textContent=balance===0?'안정':balance>0?'오른쪽':'왼쪽';$('grip').textContent='✊ 그립 '+'❤️'.repeat(grip)+'♡'.repeat(3-grip);$('undo').disabled=!history.length||busy;
$('holds').replaceChildren();arr.forEach(n=>{const b=document.createElement('button');b.className='hold'+(legal(n)?' reachable':'')+(history.some(h=>h.id===n.id)?' used':'');b.style.left=n.x+'%';b.style.top=n.y+'%';b.setAttribute('aria-label',n.type==='goal'?'정상 목표 홀드':n.type+' 홀드');const img=document.createElement('img');img.src='assets/holds/'+ASSET[n.type]+'.png';img.alt='';b.append(img);if(n.type==='goal')b.dataset.goal='true';b.addEventListener('click',()=>choose(n.id));$('holds').append(b)});
const bear=$('bear');bear.style.left=pos.x+'%';bear.style.top=(pos.y-5)+'%';bear.querySelector('img').src='assets/characters/bear_pose_'+(history.length?(pos.x<38?1:pos.x>62?2:0):0)+'.png';$('tip').textContent=data.tip+(data.required?' · 필수: '+data.required.join(' + '):'');}
function modal(title,message,label,action){$('dialogTitle').textContent=title;$('dialogText').textContent=message;$('dialogAction').textContent=label;$('timingTrack').hidden=true;$('overlay').hidden=false;$('dialogAction').onclick=()=>{close();action?.()}}
function close(){clearInterval(timingTimer);timingTimer=0;$('overlay').hidden=true;pending=null}
function choose(id){if(busy)return;const n=nodes()[id];if(!n)return;if(!legal(n)){$('tip').textContent=n.type==='goal'&&LEVELS[level].required?'필수 홀드를 먼저 잡아야 정상으로 갈 수 있어요.':n.type==='sloper'?'슬로퍼를 잡으려면 균형을 맞춰야 해요.':'거리·균형·그립을 확인하고 다른 홀드를 선택해요.';return}if(n.type==='crimp'){pending=n;timing();return}advance(n,0)}
function advance(n,extra){busy=true;history.push({id:n.id,previousGrip:grip,previousBalance:balance});balance=newBalance(n);grip=Math.max(0,Math.min(3,grip-penalty(n)-extra+(n.type==='jug'||n.type==='volume'?1:0)));render();$('bear').classList.add('jump');setTimeout(()=>{busy=false;$('bear').classList.remove('jump');if(grip===0){modal('앗! 손이 미끄러졌어','그립을 모두 잃었어. 한 수 되돌려 다른 루트를 찾아보자.','되돌리기',undo);return}if(n.type==='goal')finish()},440)}
function timing(){busy=true;$('dialogTitle').textContent='⚡ 크림프! 손끝 집중';$('dialogText').textContent='바가 초록 구간을 지날 때 잡기!';$('dialogAction').textContent='지금 잡기';$('timingTrack').hidden=false;$('overlay').hidden=false;timingStart=performance.now();timingTimer=setInterval(()=>{$('cursor').style.left=(50+48*Math.sin((performance.now()-timingStart)/330))+'%'},30);$('dialogAction').onclick=()=>{const p=50+48*Math.sin((performance.now()-timingStart)/330),extra=Math.abs(p-50)<9?0:1,n=pending;close();busy=false;advance(n,extra)}}
function undo(){if(!history.length||busy)return;const last=history.pop();grip=last.previousGrip;balance=last.previousBalance;render()}
function reset(){close();history=[];grip=3;balance=0;busy=false;render()}
function finish(){const starCount=moves()<=LEVELS[level].goal?(grip>=2?3:2):1;saved.stars[level]=Math.max(saved.stars[level]||0,starCount);saved.unlocked=Math.max(saved.unlocked,Math.min(10,level+2));safeSave();modal('🏁 정상 정복!',`⭐`.repeat(starCount)+` · ${moves()}번 이동 · 그립 ${grip}/3`,'다음 스테이지',()=>{level=Math.min(9,level+1);reset()})}
function openStages(){const rows=LEVELS.map((s,i)=>`${i+1}. ${s.name} ${i<saved.unlocked?'⭐'.repeat(saved.stars[i]||0):'🔒'}`).join('\n');modal('스테이지 선택',rows+'\n\n확인을 누르면 다음 해금 스테이지로 이동해요.','이동',()=>{level=Math.min(9,saved.unlocked-1);reset()})}
$('reset').onclick=reset;$('undo').onclick=undo;$('hint').onclick=()=>{const n=nodes().find(legal);if(!n){$('tip').textContent='다른 경로를 찾거나 되돌리기를 눌러봐요.';return}const b=$('holds').children[n.id];b.style.filter='drop-shadow(0 0 18px #ffe44a)';$('tip').textContent='빛나는 홀드를 살펴보세요. 힌트는 정답 보장이 아니에요.'};$('next').onclick=openStages;$('settings').onclick=()=>modal('게임 방법','홀드를 터치해 이동! 저그는 그립 회복, 크림프는 타이밍 판정, 슬로퍼는 균형 0, 볼륨은 다음 이동 범위 확대. 되돌리기로 실수를 고칠 수 있어요.','닫기');render();
