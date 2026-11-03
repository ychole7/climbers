/* 영차영차 등반대 V9-B — species-independent movement timeline.
 * No DOM, sprites, physics engine, or per-species gameplay reach values.
 * Shared movement phases: anticipation -> reach -> weight transfer -> settle.
 */
(function (root) {
  'use strict';
  const PROFILES = Object.freeze({
    bear: Object.freeze({id:'bear',name:'곰돌이',head:67,bodyX:79,bodyY:91,
      armWidth:54,legWidth:61,pawHand:21,pawFoot:25,earShape:'round',earSize:29,
      lean:0.20,follow:0.72,anticipation:12,settle:8,bodyResponse:1.0,
      fur:'#c98a53',furDark:'#b67c4b',face:'#f6e2c2'}),
    rabbit: Object.freeze({id:'rabbit',name:'토끼',head:63,bodyX:60,bodyY:96,
      armWidth:40,legWidth:46,pawHand:18,pawFoot:24,earShape:'long',earSize:32,
      lean:0.28,follow:0.85,anticipation:9,settle:12,bodyResponse:1.15,
      fur:'#e5c5a9',furDark:'#d5b28f',face:'#fff4e6'})
  });
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};
  const mix=(a,b,t)=>a+(b-a)*t;
  const vec=(a,b,t)=>({x:mix(a.x,b.x,t),y:mix(a.y,b.y,t)});
  const copy=a=>({x:a.x,y:a.y});
  const DURATIONS=Object.freeze({prepare:140,reach:260,transfer:270,settle:210});
  const TOTAL=Object.values(DURATIONS).reduce((a,b)=>a+b,0);
  function createController(){
    let move=null;
    const API={
      begin(args){
        if(move)return false;
        const {limb,from,to,torsoFrom,torsoTo,now}=args;
        const response=clamp(Number(args.response)||1,.5,1.6);
        if(![limb,from?.x,from?.y,to?.x,to?.y,torsoFrom?.x,torsoFrom?.y,torsoTo?.x,torsoTo?.y,now].every(Number.isFinite))return false;
        move={limb,from:copy(from),to:copy(to),old:copy(torsoFrom),next:copy(torsoTo),start:now,response};
        return true;
      },
      sample(now){
        if(!move)return {active:false,phase:'idle',limb:-1,body:null,paw:null,progress:1,arrived:true};
        const elapsed=Math.max(0,now-move.start);
        let phase,body,paw,progress;
        const prep=DURATIONS.prepare,reach=prep+DURATIONS.reach,transfer=reach+DURATIONS.transfer;
        if(elapsed<prep){
          phase='prepare';progress=smooth(elapsed/prep);
          const dx=move.to.x-move.from.x,dy=move.to.y-move.from.y;
          body={x:move.old.x-clamp(dx*.07,-14,14)*progress*move.response,
                y:move.old.y-clamp(dy*.05,-10,10)*progress*move.response};
          paw=copy(move.from);
        }else if(elapsed<reach){
          phase='reach';progress=smooth((elapsed-prep)/DURATIONS.reach);
          const dx=move.to.x-move.from.x,dy=move.to.y-move.from.y;
          const pre={x:move.old.x-clamp(dx*.07,-14,14)*move.response,y:move.old.y-clamp(dy*.05,-10,10)*move.response};
          body=vec(pre,vec(move.old,move.next,.36),progress);
          paw=vec(move.from,move.to,progress);
          paw.y-=Math.sin(progress*Math.PI)*10;
        }else if(elapsed<transfer){
          phase='transfer';progress=smooth((elapsed-reach)/DURATIONS.transfer);
          body=vec(vec(move.old,move.next,.36),move.next,progress);
          paw=copy(move.to);
        }else if(elapsed<TOTAL){
          phase='settle';progress=smooth((elapsed-transfer)/DURATIONS.settle);
          body={x:move.next.x,y:move.next.y-Math.sin(Math.PI*progress)*6*move.response*(1-progress)};
          paw=copy(move.to);
        }else{
          const last=move;move=null;
          return {active:false,phase:'idle',limb:last.limb,body:copy(last.next),paw:copy(last.to),progress:1,arrived:true};
        }
        return {active:true,phase,limb:move.limb,body,paw,progress,arrived:elapsed>=reach};
      },
      get active(){return !!move},
      get move(){return move},
      cancel(){move=null}
    };
    return API;
  }
  root.ClimbMotion=Object.freeze({PROFILES,createController,smooth,vec,clamp,DURATIONS,TOTAL});
})(typeof window!=='undefined'?window:globalThis);
