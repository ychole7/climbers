'use strict';
// 영차영차 등반대 — 순수 규칙 엔진 (DOM 없음, Node 테스트에서도 사용)
const RULES={
  MAX_ST:5,        // 최대 체력(그립)
  LAT:15,          // 이 이상 좌우로 움직이면 몸이 기울어짐
  RELEASE:30,      // 손이 발판보다 이만큼 높아지면 발이 떨어짐
  COST:{jug:-1,volume:-1,pinch:1,pocket:2,sloper:1,sidepull:1,undercling:1},
  CRIMP:{perfect:1,good:2,miss:3}
};
const HOLD_INFO={
  jug:{name:'저그',icon:'🤲',rule:'크고 편한 손잡이. 잡으면 체력 +1 회복!'},
  crimp:{name:'크림프',icon:'⚡',rule:'좁은 턱. 타이밍 미니게임! PERFECT −1 · GOOD −2 · MISS −3'},
  sloper:{name:'슬로퍼',icon:'⚖️',rule:'둥글고 미끄러워. 균형이 가운데일 때만 잡을 수 있어. 체력 −1'},
  sidepull:{name:'사이드풀',icon:'↔️',rule:'옆으로 당기는 홀드. 몸이 기울어 있어야 잡혀. 잡으면 균형이 가운데로! 체력 −1'},
  undercling:{name:'언더클링',icon:'👣',rule:'아래에서 들어올리는 홀드. 발판을 밟고 있어야 잡혀. 체력 −1'},
  volume:{name:'볼륨',icon:'💤',rule:'커다란 쉼터. 체력 +1, 균형이 가운데로 돌아와.'},
  pinch:{name:'핀치',icon:'🤏',rule:'꼬집어 잡는 홀드. 체력 −1'},
  pocket:{name:'포켓',icon:'☝️',rule:'손가락 구멍. 힘들어서 체력 −2'},
  foot:{name:'발판',icon:'🦶',rule:'발을 디디면 균형이 한 칸 가운데로. 손이 너무 높이 가면 발이 떨어져!'}
};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const toward0=v=>v-Math.sign(v);
function nodeOf(s,id){return s.nodes.find(n=>n.id===id)}
function footOf(s,id){return (s.feet||[]).find(f=>f.id===id)}
function honeyIds(s){return [...s.nodes,...(s.feet||[])].filter(p=>p.honey).map(p=>p.id)}
function initState(s){return {pos:s.start,foot:null,st:s.st??RULES.MAX_ST,b:0,honey:[],moves:0,win:false,fell:false}}
function canGrab(s,st,id){
  const from=nodeOf(s,st.pos),n=nodeOf(s,id);
  if(!n||!from.links.includes(id))return {ok:false,why:'reach'};
  if(n.needFoot&&st.foot!==n.needFoot)return {ok:false,why:'foot'};
  if(n.type==='undercling'&&!st.foot)return {ok:false,why:'under'};
  if(n.type==='sloper'&&st.b!==0)return {ok:false,why:'sloper'};
  if(n.type==='sidepull'&&st.b===0)return {ok:false,why:'side'};
  return {ok:true};
}
function canStep(s,st,fid){const f=footOf(s,fid);return !!f&&f.from.includes(st.pos)&&st.foot!==fid}
function collect(st,id,s){const p=nodeOf(s,id)||footOf(s,id);if(p&&p.honey&&!st.honey.includes(id)){st.honey=[...st.honey,id];return true}return false}
function finish(s,st,ev){
  if(Math.abs(st.b)===2){st.st-=1;ev.push('wobble')}
  if(st.st<=0){st.st=0;st.fell=true;ev.push('fall')}
  else if(nodeOf(s,st.pos).goal&&st.pos!==s.start&&ev.includes('grab')){st.win=true;ev.push('win')}
  return {state:st,events:ev};
}
function applyGrab(s,cur,id,grade='good'){
  const st={...cur,honey:[...cur.honey]},from=nodeOf(s,cur.pos),n=nodeOf(s,id),ev=['grab'];
  const cost=n.type==='crimp'?RULES.CRIMP[grade]:RULES.COST[n.type];
  const dx=n.x-from.x;
  st.b=Math.abs(dx)<RULES.LAT?toward0(st.b):clamp(st.b+Math.sign(dx),-2,2);
  if(n.type==='volume'||n.type==='sidepull')st.b=0;
  st.st=Math.min(RULES.MAX_ST,st.st-cost);if(cost<0)ev.push('rest');
  st.pos=id;st.moves++;
  if(collect(st,id,s))ev.push('honey');
  if(st.foot){const f=footOf(s,st.foot);if(n.y<f.y-RULES.RELEASE){st.foot=null;ev.push('release')}}
  return finish(s,st,ev);
}
function applyStep(s,cur,fid){
  const st={...cur,honey:[...cur.honey]},ev=['step'];
  st.foot=fid;st.moves++;st.b=toward0(st.b);
  if(collect(st,fid,s))ev.push('honey');
  return finish(s,st,ev);
}
function actions(s,st){
  const out=[];
  nodeOf(s,st.pos).links.forEach(id=>{if(canGrab(s,st,id).ok)out.push({kind:'grab',id})});
  (s.feet||[]).forEach(f=>{if(canStep(s,st,f.id))out.push({kind:'step',id:f.id})});
  return out;
}
const keyOf=st=>[st.pos,st.foot,st.st,st.b,[...st.honey].sort().join('')].join('|');
// BFS. needHoney=true면 꿀을 모두 모은 완등만 인정. 반환: {moves, path:[action...]} 또는 null
function solve(s,start,needHoney,grade='good'){
  const all=honeyIds(s).length,q=[{st:start,path:[]}],seen=new Set([keyOf(start)]);
  for(let i=0;i<q.length;i++){
    const {st,path}=q[i];
    for(const a of actions(s,st)){
      const r=a.kind==='grab'?applyGrab(s,st,a.id,grade):applyStep(s,st,a.id);
      const ns=r.state,np=[...path,a];
      if(ns.fell)continue;
      if(ns.win){if(!needHoney||ns.honey.length===all)return {moves:np.length,path:np};continue}
      const k=keyOf(ns);if(seen.has(k))continue;seen.add(k);q.push({st:ns,path:np});
    }
  }
  return null;
}
if(typeof module!=='undefined')module.exports={RULES,HOLD_INFO,nodeOf,footOf,honeyIds,initState,canGrab,canStep,applyGrab,applyStep,actions,solve};
