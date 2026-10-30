'use strict';
// 리치 실험 — 손발 지지 시스템 순수 로직 (DOM 없음)
// 월드 좌표: 폭 700, y는 아래로 증가. 팔다리 길이로 닿는 범위를 계산한다.
const BEAR={
  len:[230,230,210,210],                       // 왼손, 오른손, 왼발, 오른발
  off:[[-42,-40],[42,-40],[-32,48],[32,48]],    // 몸통 중심 → 어깨/엉덩이
  name:['왼손','오른손','왼발','오른발']
};
const isHand=i=>i<2;
const HOLD_RATE={jug:4,pinch:0,crimp:-2,sloper:-2,chip:0};  // 손으로 잡고 있을 때 초당 그립 변화
const HOLD_NAME={jug:'저그',crimp:'크림프',sloper:'슬로퍼',pinch:'핀치',chip:'발판'};

// 코스: 배치 패턴 하나씩. st = 시작 그립(기본 100)
const chip=(id,x,y,o={})=>({id,x,y,type:'chip',...o}),jug=(id,x,y,o={})=>({id,x,y,type:'jug',...o}),crimp=(id,x,y,o={})=>({id,x,y,type:'crimp',...o});
const BASE=()=>[chip('F1',300,1320),chip('F2',410,1320),jug('S1',290,920),jug('S2',420,920)];
const STAGES=[
 {name:'숨은 발판',pattern:'발 먼저',tip:'바로 위 홀드에 손이 안 닿아. 옆을 잘 살펴봐!',W:700,H:1500,floor:1440,goal:'G',start:['S1','S2','F1','F2'],holds:[...BASE(),
  jug('U1',330,600),jug('U2',400,610),chip('F3',600,1180),chip('F4',620,990,{honey:true}),chip('F5',120,1200),
  chip('F6',300,820),chip('F7',480,800),jug('G',360,300)]},
 {name:'아슬아슬',pattern:'끝까지 뻗기',tip:'홀드가 멀어! 팔다리를 끝까지 쭉 뻗어서 부들부들 버텨 봐.',W:700,H:1500,floor:1440,goal:'G',start:['S1','S2','F1','F2'],holds:[...BASE(),
  chip('F3',220,1170),chip('F4',500,1160),chip('F5',300,1010),chip('F6',470,1000),chip('F7',260,790),chip('F8',470,780),
  jug('A',170,680),jug('B',560,650),jug('H',660,520,{honey:true}),jug('C',330,450),jug('G',440,260)]},
 {name:'꿀이냐 안전이냐',pattern:'갈림길',tip:'왼쪽은 편한 저그 길, 오른쪽은 꿀이 있는 크림프 길. 그립이 70뿐이야!',st:70,W:700,H:1700,floor:1640,goal:'G',start:['S1','S2','F1','F2'],holds:[
  chip('F1',300,1520),chip('F2',410,1520),jug('S1',290,1120),jug('S2',420,1120),
  chip('LF0',250,1380),chip('LF1',200,1230),chip('LF2',190,1070),chip('LF3',170,900),chip('LF4',190,760),jug('L1',150,880),jug('L2',160,640),
  chip('RF0',470,1380),chip('RF1',520,1230),chip('RF2',540,1070),chip('RF3',560,900),chip('RF4',540,760),crimp('R1',570,880),crimp('R2',580,640,{honey:true}),
  jug('M',360,450),chip('MF',360,640),jug('G',360,260)]},
 {name:'쉼터',pattern:'숨 고르기',tip:'크림프만 잡으면 그립이 금방 바닥나. 가운데 저그에서 쉬어 가!',st:80,W:700,H:1500,floor:1440,goal:'G',start:['S2','S1','F2','F1'],holds:[
  chip('F1',400,1320),chip('F2',290,1320),jug('S1',410,920),jug('S2',280,920),
  chip('F3',480,1170),chip('F4',200,1160),chip('F5',400,1010),chip('F6',230,1000),chip('F7',440,790),chip('F8',230,780),
  crimp('A',530,690),crimp('B',150,680),jug('J',350,540),crimp('H',80,470,{honey:true}),crimp('C',510,430),jug('G',300,250)]},
 {
  name:'큰 벽',pattern:'종합',tip:'지금까지 배운 걸 모두! 발 먼저, 끝까지 뻗기, 쉼터에서 숨 고르기.',W:700,H:2300,floor:2240,goal:'G',
  start:['S1','S2','F1','F2'],
  holds:[
    {id:'F1',x:300,y:2120,type:'chip'},{id:'F2',x:410,y:2120,type:'chip'},
    {id:'F3',x:190,y:2010,type:'chip'},{id:'F4',x:520,y:1990,type:'chip'},
    {id:'F5',x:360,y:1880,type:'chip',honey:true},
    {id:'S1',x:290,y:1720,type:'jug'},{id:'S2',x:420,y:1720,type:'jug'},
    {id:'F6',x:210,y:1590,type:'chip'},{id:'F7',x:540,y:1610,type:'chip'},
    {id:'B',x:400,y:1490,type:'jug'},
    {id:'A',x:120,y:1450,type:'crimp',honey:true},
    {id:'F8',x:330,y:1390,type:'chip'},
    {id:'X',x:620,y:1330,type:'jug'},
    {id:'C',x:350,y:1270,type:'sloper'},
    {id:'F9',x:190,y:1180,type:'chip'},{id:'F10',x:520,y:1170,type:'chip'},
    {id:'E',x:220,y:1050,type:'crimp'},
    {id:'D',x:480,y:1020,type:'jug'},
    {id:'F11',x:370,y:950,type:'chip'},
    {id:'H',x:280,y:820,type:'pinch'},{id:'I',x:520,y:810,type:'jug'},
    {id:'F12',x:200,y:720,type:'chip'},{id:'F13',x:560,y:700,type:'chip'},
    {id:'G',x:380,y:600,type:'jug'}
  ]
}
];
const STAGE=STAGES[0];
const holdOf=(s,id)=>s.holds.find(h=>h.id===id);

// 이 접점을 유지할 때 몸통이 있어야 하는 영역(원 + 반평면)
function cons(s,contacts,skip){
  const c=[];
  contacts.forEach((id,i)=>{
    if(i===skip||!id)return;const h=holdOf(s,id),o=BEAR.off[i];
    c.push({t:'disc',x:h.x-o[0],y:h.y-o[1],r:BEAR.len[i]});
    if(isHand(i))c.push({t:'minY',v:h.y-70});   // 손이 몸통보다 너무 아래로 가지 않게
    else c.push({t:'maxY',v:h.y-60});           // 발은 몸통보다 아래
  });
  return c;
}
function project(p,c,iters=70){
  let x=p.x,y=p.y;
  for(let k=0;k<iters;k++){
    let moved=false;
    for(const q of c){
      if(q.t==='disc'){const dx=x-q.x,dy=y-q.y,d=Math.hypot(dx,dy);if(d>q.r){const r=q.r-.5;x=q.x+dx/d*r;y=q.y+dy/d*r;moved=true}}
      else if(q.t==='minY'&&y<q.v){y=q.v;moved=true}
      else if(q.t==='maxY'&&y>q.v){y=q.v;moved=true}
    }
    if(!moved)return {x,y,ok:true};
  }
  const ok=c.every(q=>q.t==='disc'?Math.hypot(x-q.x,y-q.y)<=q.r+1.5:q.t==='minY'?y>=q.v-1.5:y<=q.v+1.5);
  return {x,y,ok};
}
// 편한 자세: 손은 어깨 위 ~70%, 발은 엉덩이 아래 ~72%
function pref(s,contacts,skip){
  let x=0,y=0,n=0;
  contacts.forEach((id,i)=>{if(i===skip||!id)return;const h=holdOf(s,id),o=BEAR.off[i],L=BEAR.len[i];
    x+=h.x-o[0];y+=h.y-o[1]+(isHand(i)?.68*L:-.72*L);n++});
  return {x:x/n,y:y/n};
}
function anchor(t,i){return {x:t.x+BEAR.off[i][0],y:t.y+BEAR.off[i][1]}}
function strainOf(s,contacts,t,skip){
  let m=0;contacts.forEach((id,i)=>{if(i===skip||!id)return;const h=holdOf(s,id),a=anchor(t,i);m=Math.max(m,Math.hypot(h.x-a.x,h.y-a.y)/BEAR.len[i])});return m;
}
// 자세 계산. pull: 드래그 중 손가락 쪽으로 몸을 기울이는 목표점
function pose(s,contacts,skip=-1,pull=null){
  const c=cons(s,contacts,skip);let p=pref(s,contacts,skip);
  if(pull){const a=anchor(p,skip),dx=pull.x-a.x,dy=pull.y-a.y;p={x:p.x+dx*.38,y:p.y+dy*.3}}
  const r=project(p,c);return {torso:{x:r.x,y:r.y},ok:r.ok,strain:strainOf(s,contacts,r,skip)};
}
// 팔다리 i를 hold로 옮길 수 있나? → {ok, why, pose}
function canPlace(s,contacts,i,id){
  const h=holdOf(s,id);if(!h)return {ok:false,why:'none'};
  if(contacts[i]===id)return {ok:false,why:'same'};
  if(isHand(i)&&h.type==='chip')return {ok:false,why:'chip'};
  const other=contacts.findIndex((c,j)=>c===id&&j!==i&&isHand(j)!==isHand(i));
  if(other>=0)return {ok:false,why:'taken'};
  const next=contacts.slice();next[i]=id;
  // 왼쪽 팔다리가 오른쪽 팔다리를 크게 넘어가지 않게 (꼬임 방지)
  const X=k=>holdOf(s,next[k]).x;
  if(X(0)>X(1)+30||X(2)>X(3)+30)return {ok:false,why:'cross'};
  const p=pose(s,next);
  if(!p.ok)return {ok:false,why:'reach'};
  if(isHand(i)&&h.type==='sloper'&&Math.abs(p.torso.x-h.x)>70)return {ok:false,why:'sloper',pose:p};
  return {ok:true,pose:p,next};
}
const honeyIds=s=>s.holds.filter(h=>h.honey).map(h=>h.id);
const isWin=(s,contacts)=>contacts[0]===s.goal||contacts[1]===s.goal;
// BFS 솔버: needHoney면 꿀 전부 모은 완등. 반환 {moves, path:[{limb,id}]}
function solve(s,contacts,got=[],needHoney=true){
  const all=honeyIds(s),key=(c,g)=>c.join(',')+'|'+g.slice().sort().join(',');
  const q=[{c:contacts,g:got,path:[]}],seen=new Set([key(contacts,got)]);
  const near=(a,b,r)=>Math.hypot(a.x-b.x,a.y-b.y)<r;
  for(let k=0;k<q.length;k++){
    const {c,g,path}=q[k];
    for(let i=0;i<4;i++)for(const h of s.holds){
      // 빠른 거르기: 다른 팔다리 홀드와 너무 멀면 건너뜀
      if(!c.every((id,j)=>j===i||near(holdOf(s,id),h,BEAR.len[i]+BEAR.len[j]+140)))continue;
      const r=canPlace(s,c,i,h.id);if(!r.ok)continue;
      const ng=h.honey&&!g.includes(h.id)?[...g,h.id]:g,np=[...path,{limb:i,id:h.id}];
      if(isWin(s,r.next)){if(!needHoney||ng.length===all.length)return {moves:np.length,path:np};continue}
      const kk=key(r.next,ng);if(seen.has(kk))continue;seen.add(kk);q.push({c:r.next,g:ng,path:np});
    }
  }
  return null;
}
if(typeof module!=='undefined')module.exports={BEAR,STAGE,STAGES,HOLD_RATE,HOLD_NAME,isHand,holdOf,cons,pose,anchor,canPlace,solve,honeyIds,isWin,strainOf};
