'use strict';
// 네 접점 IK 조작 실험. 턴제이며 래그돌/실시간 물리 없음.
const W=360,H=560;
const nodes=[
{id:'A',x:135,y:410,type:'jug',name:'시작'},{id:'B',x:223,y:405,type:'jug',name:'시작'},
{id:'C',x:105,y:323,type:'jug',name:'왼쪽 저그'},{id:'D',x:255,y:297,type:'jug',name:'오른쪽 저그'},
{id:'E',x:163,y:295,type:'jug',name:'중간 저그'},{id:'G',x:210,y:235,type:'jug',goal:true,name:'🏁 정상'},
{id:'F1',x:137,y:515,type:'foot',name:'시작 발판'},{id:'F2',x:216,y:510,type:'foot',name:'시작 발판'},
{id:'F3',x:125,y:430,type:'foot',name:'올려 디딜 발판'},{id:'F4',x:235,y:413,type:'foot',name:'높은 발판'},
{id:'F5',x:155,y:380,type:'foot',name:'높은 발판'},{id:'F6',x:234,y:280,type:'foot',name:'정상 아래 발판'}
];
const map=Object.fromEntries(nodes.map(n=>[n.id,n]));
const base={LH:'A',RH:'B',LF:'F1',RF:'F2'};let grips={...base},history=[],drag=null,moves=0,won=false;
const $=id=>document.getElementById(id),svgNS='http://www.w3.org/2000/svg';
const jointOffsets={LH:[-22,-43],RH:[22,-43],LF:[-16,40],RF:[16,40]};
const limit={LH:135,RH:135,LF:140,RF:140};
const joints=['LH','RH','LF','RF'];
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function anchor(id){return map[grips[id]]}
function solveBody(g,ignore=null){
 const items=joints.filter(k=>k!==ignore).map(k=>({k,p:map[g[k]]}));
 // 위치는 손발의 접점으로 유추하고 2본 IK 도달 범위 안에서 수렴시킨다.
 let cx=180,cy=456;
 for(let iteration=0;iteration<68;iteration++){
  let gx=0,gy=0;
  for(const {k,p} of items){const [ox,oy]=jointOffsets[k];const dx=cx+ox-p.x,dy=cy+oy-p.y;const d=Math.hypot(dx,dy)||1;
   const target=k[1]==='H'?85:86;const error=d-target;const stiffness=d>limit[k]?5:1;
   gx+=stiffness*error*dx/d;gy+=stiffness*error*dy/d;
  }
  cx-=gx*.11;cy-=gy*.11;
  cx=Math.max(37,Math.min(W-37,cx));cy=Math.max(56,Math.min(H-47,cy));
 }
 const maxStretch=Math.max(...items.map(({k,p})=>dist({x:cx+jointOffsets[k][0],y:cy+jointOffsets[k][1]},p)-limit[k]));
 return {x:cx,y:cy,stretch:maxStretch};
}
function feasible(next,limb){
 const s=solveBody(next);if(s.stretch>7)return null;
 // 목표 지점은 발을 위쪽 지지점으로 옮겼을 때만 충분한 지지 삼각형이 형성된다.
 if(map[next[limb]].goal&&!['F3','F4','F5','F6'].includes(next.LF)&&!['F3','F4','F5','F6'].includes(next.RF))return null;
 // 세 접점이 안정적으로 버티는 지 확인: 손 1개 이상, 발 1개 이상, 3점 유지.
 const other=joints.filter(k=>k!==limb);if(!other.some(k=>k.endsWith('H'))||!other.some(k=>k.endsWith('F')))return null;
 const before=solveBody(grips),p=map[next[limb]],o=jointOffsets[limb];
 if(dist({x:before.x+o[0],y:before.y+o[1]},p)>limit[limb]+10)return null;
 // 발은 손보다 높이 둘 수 없고, 두 발이 겹치지 않게 한다.
 if(limb.endsWith('F')&&p.y<Math.min(map[next.LH].y,map[next.RH].y)+10)return null;
 return s;
}
function allowed(limb,n){if(!n||n.id===grips[limb])return false;if(n.type==='foot'!==limb.endsWith('F'))return false;return !!feasible({...grips,[limb]:n.id},limb)}
function make(tag,attrs,body){const e=document.createElementNS(svgNS,tag);for(const [k,v] of Object.entries(attrs||{}))e.setAttribute(k,v);if(body)e.textContent=body;return e}
function ik(start,end,len,sign){const dx=end.x-start.x,dy=end.y-start.y,d=Math.max(0.01,Math.hypot(dx,dy)),half=d/2,perp=Math.sqrt(Math.max(0,(len*.59)**2-half**2));return{x:(start.x+end.x)/2+(-dy/d)*perp*sign,y:(start.y+end.y)/2+(dx/d)*perp*sign}}
function point(e){const b=$('rig').getBoundingClientRect();return{x:(e.clientX-b.left)*W/b.width,y:(e.clientY-b.top)*H/b.height}}
function draw(){const body=solveBody(grips),svg=$('rig');svg.replaceChildren();const left=document.createElement('div');
 const current=drag?drag.limb:null;
 if(drag){const o=jointOffsets[current],origin={x:body.x+o[0],y:body.y+o[1]};svg.appendChild(make('circle',{cx:origin.x,cy:origin.y,r:limit[current],class:'reach'}));svg.appendChild(make('line',{x1:origin.x,y1:origin.y,x2:drag.p.x,y2:drag.p.y,class:'line'}));}
 // torso and head are rendered first; limbs then overlay to make clear four separate connections.
 const torso=make('g',{class:'body',transform:`translate(${body.x} ${body.y}) rotate(${Math.max(-13,Math.min(13,(map[grips.RH].x-map[grips.LH].x-80)*.055))})`});
 torso.appendChild(make('ellipse',{cx:0,cy:0,rx:40,ry:52,class:'bearbody'}));torso.appendChild(make('path',{d:'M-27 -30 L20 42 M27 -30 L-20 42',class:'harness'}));
 torso.appendChild(make('circle',{cx:0,cy:-63,r:34,class:'bearhead'}));torso.appendChild(make('circle',{cx:-22,cy:-85,r:12,class:'bearhead'}));torso.appendChild(make('circle',{cx:22,cy:-85,r:12,class:'bearhead'}));torso.appendChild(make('rect',{x:-12,y:12,width:24,height:22,rx:7,fill:'#5b9ab5',stroke:'#e4d3af','stroke-width':2}));svg.appendChild(torso);
 for(const [i,k] of joints.entries()){
  const o=jointOffsets[k],start={x:body.x+o[0],y:body.y+o[1]},end=drag?.limb===k?drag.p:anchor(k);
  const mid=ik(start,end,limit[k],i%2===0?-1:1);
  svg.appendChild(make('polyline',{points:`${start.x},${start.y} ${mid.x},${mid.y} ${end.x},${end.y}`,class:'limb '+(k.endsWith('H')?'arm':'leg')}));
  svg.appendChild(make('circle',{cx:end.x,cy:end.y,r:14,class:'paw'}));
  const s=make('circle',{cx:end.x,cy:end.y,r:19,class:'socket '+(k.endsWith('H')?'arm':'leg')+(current===k?' active':''),'data-limb':k});svg.appendChild(s);
  svg.appendChild(make('text',{x:end.x,y:end.y+4,'text-anchor':'middle','font-size':11,'font-weight':900,'pointer-events':'none',fill:'#563e2a'},({LH:'L손',RH:'R손',LF:'L발',RF:'R발'})[k]));
 }
 $('moves').textContent=moves;$('supports').textContent='4개 접점 · 한 번에 하나';$('undo').disabled=!history.length;$('status').textContent=won?'성공!':'정상 홀드';
 document.querySelectorAll('.hold').forEach(el=>el.classList.toggle('candidate',!!drag&&allowed(drag.limb,map[el.dataset.id])));
}
function say(t){$('hint').textContent=t}
function reset(){grips={...base};history=[];moves=0;won=false;drag=null;$('modal').hidden=true;say('파란 손 / 주황 발을 드래그해 홀드에 놓아 봐!');draw()}
function undo(){if(!history.length||drag)return;const h=history.pop();grips=h.grips;moves=h.moves;won=false;say('한 동작 되돌렸어. 다른 자세를 시도해 봐.');draw()}
function renderHolds(){for(const n of nodes){const e=document.createElement('div');e.className='hold '+(n.type==='foot'?'foot ':'')+(n.goal?'goal':'');e.dataset.id=n.id;e.style.left=n.x/W*100+'%';e.style.top=n.y/H*100+'%';e.innerHTML=`<img src="assets/holds/${n.type==='foot'?'footchip':'jug'}.png" alt=""><span class="num">${n.goal?'🏁 정상':n.type==='foot'?'발판':n.name}</span>`;$('holds').appendChild(e)}}
$('rig').addEventListener('pointerdown',e=>{if(won||drag)return;const el=e.target.closest('[data-limb]');if(!el)return;const limb=el.dataset.limb;drag={limb,p:point(e)};$('rig').setPointerCapture(e.pointerId);say((limb.endsWith('F')?'발':'손')+'을 움직이는 중! 초록빛 홀드 위에서 놓아 봐.');draw()});
$('rig').addEventListener('pointermove',e=>{if(!drag)return;drag.p=point(e);draw()});
function release(e){if(!drag)return;const {limb}=drag,p=point(e);let possible=nodes.filter(n=>allowed(limb,n)).sort((a,b)=>dist(a,p)-dist(b,p));const n=possible.find(n=>dist(n,p)<34);drag=null;if(n){history.push({grips:{...grips},moves});grips[limb]=n.id;moves++;say(limb.endsWith('F')?'좋아! 발을 높게 디디니 몸이 올라가고 손도 더 높이 닿아.':'홀드를 잡았어! 다음 손발을 옮겨 봐.');if(n.goal){won=true;$('modal').hidden=false}}else say('손발이 닿지 않거나 나머지 지지점이 버티지 못해. 다른 발판을 먼저 찾아봐.');draw()}
$('rig').addEventListener('pointerup',release);$('rig').addEventListener('pointercancel',()=>{drag=null;draw()});
$('restart').onclick=reset;$('undo').onclick=undo;$('again').onclick=reset;$('help').onclick=()=>say('먼저 주황색 발을 위쪽 발판으로 옮겨 봐. 나머지 세 접점이 지탱할 수 있을 때만 이동해.');
renderHolds();reset();
