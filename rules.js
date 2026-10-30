'use strict';
// Claude v2의 규칙 엔진과 같은 순수 함수 패턴. UI와 분리된 루트 실험판.
const RULES={MAX_ST:5,LAT:15,COST:{jug:-1,volume:-1,pinch:1,pocket:2,sloper:1,sidepull:1,undercling:1},CRIMP:{perfect:1,good:2,miss:3}};
const HOLD_INFO={jug:{name:'저그',rule:'체력 +1'},volume:{name:'볼륨',rule:'체력 +1 · 균형 초기화'},pinch:{name:'핀치',rule:'체력 -1'},crimp:{name:'크림프',rule:'타이밍 PERFECT -1, GOOD -2, MISS -3'}};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const nodeOf=(s,id)=>s.nodes.find(n=>n.id===id);
const honeyIds=s=>s.nodes.filter(n=>n.honey).map(n=>n.id);
const initState=s=>({pos:s.start,st:s.st??RULES.MAX_ST,b:0,honey:[],moves:0,win:false,fell:false,route:''});
function canGrab(s,state,id){let a=nodeOf(s,state.pos),b=nodeOf(s,id);if(!a||!b||!a.links.includes(id))return {ok:false,why:'reach'};if(b.type==='sloper'&&state.b!==0)return {ok:false,why:'sloper'};return {ok:true};}
function applyGrab(s,cur,id,grade='good'){
const st={...cur,honey:[...cur.honey]},from=nodeOf(s,cur.pos),n=nodeOf(s,id),events=['grab'];
const c=n.type==='crimp'?RULES.CRIMP[grade]:RULES.COST[n.type];
const dx=n.x-from.x;st.b=Math.abs(dx)<RULES.LAT?st.b-Math.sign(st.b):clamp(st.b+Math.sign(dx),-2,2);
if(n.type==='volume')st.b=0;
st.st=Math.min(RULES.MAX_ST,st.st-c);
st.pos=id;st.moves++;
if(id==='L1')st.route='safe';if(id==='R1')st.route='risk';
if(n.honey&&!st.honey.includes(id)){st.honey.push(id);events.push('honey')}
if(Math.abs(st.b)===2){st.st--;events.push('wobble')}
if(st.st<=0){st.st=0;st.fell=true;events.push('fall')}
else if(n.goal){st.win=true;events.push('win')}
if(c<0)events.push('rest');return {state:st,events};
}
function actions(s,st){return (nodeOf(s,st.pos)?.links||[]).filter(id=>canGrab(s,st,id).ok).map(id=>({kind:'grab',id}));}
function keyOf(s){return [s.pos,s.st,s.b,[...s.honey].sort().join(',')].join('|')}
function solve(s,start,needHoney=false,grade='good'){
const q=[{state:start,path:[]}],seen=new Set([keyOf(start)]),total=honeyIds(s).length;
for(let i=0;i<q.length;i++){
const {state,path}=q[i];for(let a of actions(s,state)){
const next=applyGrab(s,state,a.id,grade).state,p=[...path,a];if(next.fell)continue;
if(next.win){if(!needHoney||next.honey.length===total)return {moves:p.length,path:p};continue;}
const key=keyOf(next);if(!seen.has(key)){seen.add(key);q.push({state:next,path:p})}
}}
return null;
}
if(typeof module!=='undefined')module.exports={RULES,HOLD_INFO,nodeOf,honeyIds,initState,canGrab,applyGrab,actions,solve};
