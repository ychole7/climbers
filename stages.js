'use strict';
const STAGES=[{name:'절벽의 두 갈래 길',desc:'왼쪽은 안전한 휴식 루트, 오른쪽은 크림프 지름길. 어느 쪽을 선택할까?',start:'A',st:3,nodes:[
{id:'A',x:49,y:84,type:'jug',links:['L1','R1']},
{id:'L1',x:25,y:72,type:'jug',links:['L2']},
{id:'L2',x:23,y:53,type:'volume',links:['L3']},
{id:'L3',x:42,y:36,type:'jug',links:['G']},
{id:'R1',x:76,y:70,type:'pinch',links:['R2']},
{id:'R2',x:76,y:43,type:'crimp',links:['G'],honey:true},
{id:'G',x:51,y:16,type:'jug',links:[],goal:true}
]}];
if(typeof module!=='undefined')module.exports=STAGES;
