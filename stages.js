'use strict';
// 좌표는 보드 기준 % (x: 18~82, y: 14~86). links = 그 홀드에서 손이 닿는 다음 홀드.
// honey: 꿀단지(⭐ 조건), needFoot: 특정 발판을 밟고 있어야 잡힘, feet[].from: 그 홀드를 잡고 있을 때 디딜 수 있음
// 파(par)는 솔버가 "꿀 전부 + 완등" 최단 이동수로 자동 계산합니다.
const STAGES=[
 {name:'첫 등반',desc:'저그는 잡을 때마다 체력 +1! 꿀단지도 챙겨볼까?',intro:'jug',start:'A',nodes:[
  {id:'A',x:50,y:85,type:'jug',links:['B','C']},
  {id:'B',x:24,y:70,type:'jug',links:['D']},
  {id:'C',x:76,y:70,type:'jug',links:['E']},
  {id:'D',x:22,y:51,type:'jug',links:['F']},
  {id:'E',x:75,y:46,type:'jug',links:['G']},
  {id:'F',x:44,y:34,type:'jug',links:['G'],honey:true},
  {id:'G',x:50,y:15,type:'jug',links:[],goal:true}]},
 {name:'발판을 찾아라',desc:'발을 먼저 디뎌야 왼쪽 저그에 손이 닿아!',intro:'foot',start:'A',nodes:[
  {id:'A',x:50,y:85,type:'jug',links:['B','X']},
  {id:'X',x:78,y:66,type:'jug',links:[]},
  {id:'B',x:24,y:64,type:'jug',links:['C'],needFoot:'F1'},
  {id:'C',x:54,y:42,type:'jug',links:['G'],honey:true},
  {id:'G',x:48,y:15,type:'jug',links:[],goal:true}],
  feet:[{id:'F1',x:30,y:80,from:['A'],honey:true}]},
 {name:'위험한 지름길',desc:'체력이 2뿐! 크림프는 PERFECT여야 버틸 수 있어. 돌아갈까, 도전할까?',intro:'crimp',st:2,start:'A',nodes:[
  {id:'A',x:48,y:85,type:'jug',links:['R','B']},
  {id:'B',x:22,y:72,type:'jug',links:['C']},
  {id:'C',x:26,y:50,type:'jug',links:['R']},
  {id:'R',x:70,y:54,type:'crimp',links:['G'],honey:true},
  {id:'G',x:50,y:16,type:'jug',links:[],goal:true}]},
 {name:'슬로퍼는 가운데로',desc:'균형 바늘이 초록(가운데)일 때만 슬로퍼를 잡을 수 있어!',intro:'sloper',start:'A',nodes:[
  {id:'A',x:50,y:85,type:'jug',links:['L','R']},
  {id:'L',x:22,y:72,type:'jug',links:['L2','S']},
  {id:'R',x:78,y:72,type:'jug',links:['R2','S']},
  {id:'L2',x:22,y:52,type:'jug',links:['S']},
  {id:'R2',x:78,y:52,type:'jug',links:['S'],honey:true},
  {id:'S',x:50,y:44,type:'sloper',links:['G'],honey:true},
  {id:'G',x:50,y:15,type:'jug',links:[],goal:true}]},
 {name:'기울어야 잡힌다',desc:'사이드풀은 몸이 기울어 있어야 잡혀. 일부러 옆으로 가 보자!',intro:'sidepull',start:'A',nodes:[
  {id:'A',x:50,y:85,type:'jug',links:['B','L']},
  {id:'B',x:50,y:68,type:'jug',links:['SP','R'],honey:true},
  {id:'L',x:22,y:66,type:'jug',links:['SP']},
  {id:'R',x:78,y:64,type:'jug',links:['SP'],honey:true},
  {id:'SP',x:50,y:45,type:'sidepull',links:['G']},
  {id:'G',x:50,y:15,type:'jug',links:[],goal:true}]},
 {name:'발로 버티기',desc:'언더클링은 발판을 밟고 있어야 해. 어느 발판이 좋을까?',intro:'undercling',start:'A',nodes:[
  {id:'A',x:50,y:85,type:'jug',links:['U','X']},
  {id:'X',x:80,y:64,type:'jug',links:[]},
  {id:'U',x:50,y:62,type:'undercling',links:['U2','C']},
  {id:'U2',x:25,y:44,type:'undercling',links:['G'],honey:true},
  {id:'C',x:75,y:42,type:'pinch',links:['G']},
  {id:'G',x:50,y:15,type:'jug',links:[],goal:true}],
  feet:[{id:'F1',x:28,y:80,from:['A']},{id:'F2',x:72,y:79,from:['A'],honey:true}]},
 {name:'쉬었다 가자',desc:'포켓은 체력 −2! 볼륨에서 먼저 쉬는 게 좋을지도?',intro:'volume',st:4,start:'A',nodes:[
  {id:'A',x:50,y:85,type:'jug',links:['P1','V']},
  {id:'P1',x:23,y:70,type:'pocket',links:['V','P2'],honey:true},
  {id:'V',x:75,y:68,type:'volume',links:['P1','K','M']},
  {id:'M',x:50,y:52,type:'pinch',links:['P2']},
  {id:'K',x:76,y:46,type:'crimp',links:['J']},
  {id:'P2',x:23,y:48,type:'pocket',links:['J'],honey:true},
  {id:'J',x:50,y:32,type:'jug',links:['G']},
  {id:'G',x:50,y:14,type:'jug',links:[],goal:true}]},
 {name:'기우뚱 조심',desc:'한쪽으로 너무 기울면(빨강) 매번 체력 −1! 발판으로 몸을 바로 세워.',intro:'wobble',st:3,start:'A',nodes:[
  {id:'A',x:22,y:85,type:'jug',links:['B','L']},
  {id:'L',x:22,y:65,type:'jug',links:['B','S']},
  {id:'B',x:50,y:72,type:'pinch',links:['C','S']},
  {id:'C',x:78,y:62,type:'pinch',links:['S','E'],honey:true},
  {id:'S',x:50,y:48,type:'sloper',links:['T']},
  {id:'E',x:79,y:40,type:'jug',links:['T']},
  {id:'T',x:50,y:31,type:'sloper',links:['G'],honey:true},
  {id:'G',x:50,y:14,type:'jug',links:[],goal:true}],
  feet:[{id:'F1',x:68,y:81,from:['B','C']}]},
 {name:'발이 미끄러져!',desc:'손이 발판보다 너무 높아지면 발이 떨어져. 더 높은 발판으로 갈아 디뎌!',intro:'release',start:'A',nodes:[
  {id:'A',x:50,y:86,type:'jug',links:['U1','J1']},
  {id:'U1',x:24,y:66,type:'undercling',links:['U2']},
  {id:'J1',x:78,y:68,type:'jug',links:['U2']},
  {id:'U2',x:50,y:48,type:'undercling',links:['U3','K']},
  {id:'K',x:79,y:32,type:'crimp',links:['G']},
  {id:'U3',x:26,y:29,type:'undercling',links:['G'],honey:true},
  {id:'G',x:52,y:13,type:'jug',links:[],goal:true}],
  feet:[{id:'F1',x:27,y:82,from:['A']},{id:'F2',x:72,y:53,from:['J1','U2'],honey:true},{id:'F3',x:30,y:45,from:['U2']}]},
 {name:'정상 등정',desc:'지금까지 배운 모든 것! 체력 3으로 꿀 셋을 모아 정상에 서 보자.',intro:'final',st:3,start:'A',nodes:[
  {id:'A',x:50,y:86,type:'jug',links:['P','V']},
  {id:'P',x:23,y:73,type:'pocket',links:['SP']},
  {id:'V',x:77,y:72,type:'volume',links:['K','M']},
  {id:'M',x:50,y:61,type:'pinch',links:['SP','S']},
  {id:'SP',x:23,y:52,type:'sidepull',links:['S','J']},
  {id:'K',x:78,y:51,type:'crimp',links:['U','S'],honey:true},
  {id:'S',x:52,y:42,type:'sloper',links:['J','U']},
  {id:'J',x:26,y:30,type:'jug',links:['G'],honey:true},
  {id:'U',x:76,y:30,type:'pinch',links:['G']},
  {id:'G',x:50,y:13,type:'jug',links:[],goal:true}],
  feet:[{id:'F1',x:31,y:86,from:['A'],honey:true}]}
];
if(typeof module!=='undefined')module.exports=STAGES;
