// New hands use no-limit rules; saved hands without noLimit retain limit rules.
// Cosmetic snapshots never replace game state. Every action settles/saves before its reveal.
let casinoVisual=null,casinoStarting=false,casinoAction=null;
const casinoCopy=value=>JSON.parse(JSON.stringify(value));
function casinoMotion(){return state.casinoMotion!==false&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches}
function casinoTone(kind){
 if(!state.tableSound)return;
 try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;const ctx=casinoTone.context||(casinoTone.context=new Audio());ctx.resume();
 const notes=kind==='win'?[440,554,660]:kind==='lose'?[220,165]:kind==='chips'?[480,330]:kind==='flip'?[600]:[250];
 notes.forEach((hz,i)=>{const oscillator=ctx.createOscillator(),gain=ctx.createGain(),now=ctx.currentTime+i*.075;oscillator.type='sine';oscillator.frequency.value=hz;gain.gain.setValueAtTime(.025,now);gain.gain.exponentialRampToValueAtTime(.001,now+.09);oscillator.connect(gain);gain.connect(ctx.destination);oscillator.start(now);oscillator.stop(now+.1)})}catch{}
}
function casinoMinPayment(h,actor){return Math.max(0,h.target-h.street[actor])+(h.minRaise||h.big)}
function casinoRaisePayment(h,actor){const min=casinoMinPayment(h,actor),selected=actor===0?Number(state.casinoSession.raisePayment):min;return Math.min(h.stacks[actor],Math.max(min,Number.isFinite(selected)?Math.round(selected):min))}
const experienceLimitLegal=holdLegal;
holdLegal=function(h,actor){
 if(!state.casinoSession?.noLimit)return experienceLimitLegal(h,actor);
 if(state.casinoSession.settled||h.stacks[actor]<=0)return [];
 const due=Math.max(0,h.target-h.street[actor]),actions=[due?'call':'check'],canRaise=h.mayRaise?.[actor]!==false&&h.stacks[1-actor]>0;
 if(canRaise&&h.stacks[actor]>=casinoMinPayment(h,actor))actions.push(h.target?'raise':'bet');
 if(h.stacks[actor]<=due||canRaise)actions.push('allin');
 if(due)actions.push('fold');return actions;
};
function casinoRefundUncalled(h){const diff=h.total[0]-h.total[1];if(!diff)return 0;const actor=diff>0?0:1,amount=Math.abs(diff);h.total[actor]-=amount;h.stacks[actor]+=amount;h.street[actor]=Math.max(0,h.street[actor]-amount);h.target=Math.max(...h.street);h.log.push('未成立分 '+holdMoney(amount)+'を'+(actor?'相手':'あなた')+'へ返却');return amount}
const experienceLimitApply=holdApply;
holdApply=function(actor,action){
 const s=state.casinoSession,h=s?.h;if(!h||s.stage!=='playing'||h.turn!==actor||!holdLegal(h,actor).includes(action))return false;
 const due=Math.max(0,h.target-h.street[actor]);
 if(!s.noLimit){const amount=action==='call'?Math.min(due,h.stacks[actor]):['bet','raise'].includes(action)?Math.min(h.stacks[actor],due+holdUnit(h)):0;const ok=experienceLimitApply(actor,action);if(ok)casinoAction={actor,action,amount};return ok}
 if(!h.mayRaise)h.mayRaise=[true,true];
 if(action==='fold'){casinoAction={actor,action,amount:0};h.log.push((actor?'相手':'あなた')+'：フォールド');casinoRefundUncalled(h);holdSettle(1-actor,actor===0?'player_fold':'opponent_fold');return true}
 const oldTarget=h.target;let paid=0;
 if(action==='call')paid=holdPay(h,actor,due);
 else if(action==='allin')paid=holdPay(h,actor,h.stacks[actor]);
 else if(action==='raise'||action==='bet')paid=holdPay(h,actor,casinoRaisePayment(h,actor));
 const increase=h.street[actor]-oldTarget;
 if(increase>0){h.target=h.street[actor];h.acted[1-actor]=false;if(increase>=(h.minRaise||h.big)){h.minRaise=increase;h.mayRaise[1-actor]=true}}
 h.acted[actor]=true;h.mayRaise[actor]=false;s.raisePayment=null;
 casinoAction={actor,action,amount:paid};h.log.push((actor?'相手':'あなた')+'：'+({check:'チェック',call:'コール',bet:'ベット',raise:'レイズ',allin:'オールイン'})[action]+(paid?' '+holdMoney(paid):''));
 const equal=h.street[0]===h.street[1],shortCall=h.stacks[actor]===0&&h.street[actor]<=h.street[1-actor];
 if((equal&&h.stacks.some(n=>n===0))||shortCall){casinoRefundUncalled(h);holdShowdown();return true}
 if(equal&&h.acted.every(Boolean)){
  if(h.round===3){holdShowdown();return true}
  h.round++;holdDeal(h);h.street=[0,0];h.target=0;h.raises=0;h.minRaise=h.big;h.acted=[false,false];h.mayRaise=[true,true];h.turn=1-h.dealer;
 }else h.turn=1-actor;
 save();return true;
};
const experienceOpponent=holdOpponentAction;
holdOpponentAction=function(h){
 if(!state.casinoSession?.noLimit)return experienceOpponent(h);
 // Only opponent hole cards and revealed board inform its choice.
 const legal=holdLegal(h,1),hole=h.opponent.map(c=>c%13+2),rank=h.board.length>=3?holdemBest([...h.opponent,...h.board]):null;
 const strength=rank?rank[0]+rank[1]/25:hole[0]===hole[1]?2:Math.max(...hole)>=12?1:.3,roll=Math.random(),due=Math.max(0,h.target-h.street[1]),pot=h.total[0]+h.total[1];
 if(legal.includes('allin')&&h.stacks[1]>due&&strength>=3&&roll<.09)return 'allin';
 if((strength>=2&&roll<.3)||roll<.045){if(legal.includes('raise'))return 'raise';if(legal.includes('bet'))return 'bet'}
 if(!due)return 'check';if(strength>=2||due<=h.big||(strength>=1&&due/Math.max(1,pot+due)<.35)||roll<.15)return 'call';return 'fold';
};
function casinoMakeVisual(s){return {session:s,h:casinoCopy(s.h),board:s.h.board.length,player:2,opponent:s.stage==='result'&&s.reason==='showdown'?2:0,result:s.stage==='result',busy:false,message:'',flip:'',cue:null,confirm:false,skip:false,wake:null}}
function casinoView(){const s=state.casinoSession;if(!s?.h)return null;if(casinoVisual?.session!==s)casinoVisual=casinoMakeVisual(s);return casinoVisual}
function casinoWait(ms,v){if(!casinoMotion()||v.skip)return Promise.resolve();return new Promise(resolve=>{const timer=setTimeout(()=>{v.wake=null;resolve()},ms);v.wake=()=>{clearTimeout(timer);v.wake=null;resolve()}})}
function casinoCurrent(v){return state.casinoSession===v.session&&casinoVisual===v}
function casinoSkip(){const v=casinoView();if(!v)return;v.skip=true;v.wake?.()}
function casinoActionText(a){return (a.actor?'相手':'あなた')+'：'+({check:'チェック',call:'コール',bet:'ベット',raise:'レイズ',allin:'オールイン',fold:'フォールド'})[a.action]+(a.amount?' '+holdMoney(a.amount):'')}
async function casinoRevealAction(v,before,a){
 const s=v.session,next=casinoCopy(s.h),showdown=s.stage==='result'&&s.reason==='showdown';
 v.cue=a;v.message=casinoActionText(a);casinoTone(a.action==='check'||a.action==='fold'?'tap':'chips');renderCasino();await casinoWait(a.action==='allin'?650:400,v);if(!casinoCurrent(v))return;
 v.cue=null;v.h=next;v.board=before.board.length;
 if(showdown){v.message='ショーダウン';renderCasino();await casinoWait(400,v);
  for(let i=0;i<2;i++){if(!casinoCurrent(v))return;v.opponent=i+1;v.flip='opponent:'+i;casinoTone('flip');renderCasino();await casinoWait(430,v);v.flip=''}
 }
 for(let i=before.board.length;i<next.board.length;i++){
  if(!casinoCurrent(v))return;
  v.message=i===4?'リバーを開く…':i===3?'ターンを開く…':'フロップを開く…';renderCasino();await casinoWait(i===4?750:i===3?350:110,v);
  if(!casinoCurrent(v))return;v.board=i+1;v.h.round=i<3?1:i===3?2:3;v.flip='board:'+i;casinoTone('flip');renderCasino();await casinoWait(i<3?250:450,v);v.flip='';
 }
 if(!casinoCurrent(v))return;
 if(s.stage==='result'){
  v.message=showdown?'役を確認…':a.actor?'相手がフォールド':'フォールドで終了';renderCasino();await casinoWait(showdown?650:150,v);if(!casinoCurrent(v))return;
  v.result=true;v.message=s.winner===0?'WIN':s.winner===1?'LOSE':'DRAW';v.cue={action:'award',actor:s.winner};casinoTone(s.winner===0?'win':s.winner===1?'lose':'tap');renderCasino();await casinoWait(700,v);v.cue=null;
 }
}
async function casinoRun(actor,action){
 const s=state.casinoSession,v=casinoView();if(!s||!v||v.busy||s.stage!=='playing'||s.h.turn!==actor)return;
 v.busy=true;v.skip=false;v.confirm=false;
 try{
  let nextActor=actor,nextAction=action;
  while(casinoCurrent(v)&&s.stage==='playing'){
   if(nextActor===1){v.message='相手が考えている…';v.cue=null;renderCasino();await casinoWait(700,v);if(!casinoCurrent(v))return;nextAction=holdOpponentAction(s.h)}
   const before=casinoCopy(s.h);if(!holdApply(nextActor,nextAction))break;
   // Persist the authoritative state before waiting for any cosmetic animation.
   save();await casinoRevealAction(v,before,casinoAction);if(!casinoCurrent(v))return;
   if(s.stage!=='playing'||s.h.turn!==1)break;nextActor=1;
  }
 }finally{if(casinoCurrent(v)){v.busy=false;v.skip=false;v.flip='';v.cue=null;v.h=casinoCopy(s.h);v.board=s.h.board.length;v.player=2;v.result=s.stage==='result';v.opponent=v.result&&s.reason==='showdown'?2:0;v.message=v.result?(s.winner===0?'WIN':s.winner===1?'LOSE':'DRAW'):'あなたの番';renderStats();renderCasino()}}
}
holdPump=function(){if(casinoStarting)return;if(state.casinoSession?.stage==='playing'&&state.casinoSession.h.turn===1)void casinoRun(1,null)};
holdPlayer=function(action){const s=state.casinoSession,v=casinoView();if(!s||!v||v.busy||s.stage!=='playing'||s.h.turn!==0||!holdLegal(s.h,0).includes(action))return;if(action==='allin'){v.confirm=true;renderCasino();document.getElementById('casinoConfirmAllin')?.focus({preventScroll:true});return}void casinoRun(0,action)};
const experienceStart=holdStart;
holdStart=function(){
 const s=state.casinoSession;if(!s||s.stage!=='betting'||!s.budget)return;s.noLimit=true;casinoStarting=true;
 try{experienceStart()}finally{casinoStarting=false}
 if(s.stage==='betting')return;
 s.h.minRaise=s.h.big;s.h.mayRaise=[true,true];save();casinoVisual=casinoMakeVisual(s);const v=casinoVisual;v.busy=true;v.board=0;v.player=0;v.result=false;v.message='札を配る…';renderCasino();
 void(async()=>{try{for(let i=0;i<2;i++){await casinoWait(180,v);if(!casinoCurrent(v))return;v.player=i+1;v.flip='player:'+i;casinoTone('flip');renderCasino();await casinoWait(380,v);v.flip=''}}finally{if(casinoCurrent(v)){v.busy=false;v.flip='';v.player=2;v.message='あなたの番';renderCasino();holdPump()}}})();
};
function casinoBestFive(cards){let best=null,chosen=[];for(let a=0;a<cards.length-4;a++)for(let b=a+1;b<cards.length-3;b++)for(let c=b+1;c<cards.length-2;c++)for(let d=c+1;d<cards.length-1;d++)for(let e=d+1;e<cards.length;e++){const five=[cards[a],cards[b],cards[c],cards[d],cards[e]],rank=pokerRank(five);if(!best||compareRanks(rank,best)>0){best=rank;chosen=five}}return chosen}
function casinoCard(card,key,visible,v,best){
 const back='<span class="playing-card card-back" aria-label="裏向きの札">◆</span>';if(!visible)return back;
 let face=tableCard(card);if(best.includes(card))face=face.replace('playing-card ','playing-card casino-best ');
 if(v.flip!==key||!casinoMotion()||v.skip)return face;
 return '<span class="casino-flip" aria-label="札をめくる"><span class="casino-flip-inner"><span class="casino-card-back">'+back+'</span><span class="casino-card-face">'+face+'</span></span></span>';
}
function casinoButtonLabel(action,h,s){const due=Math.max(0,h.target-h.street[0]),amount=s.noLimit?casinoRaisePayment(h,0):Math.min(h.stacks[0],due+holdUnit(h));return {check:'チェック',call:'コール '+holdMoney(Math.min(due,h.stacks[0])),bet:'ベット '+holdMoney(amount),raise:'レイズ（投入 '+holdMoney(amount)+'）',allin:'オールイン '+holdMoney(h.stacks[0]),fold:'フォールド'}[action]}
const experienceBaseRender=renderCasino;
renderCasino=function(){
 const s=state.casinoSession;if(!s)return;
 const box=document.getElementById('casinoContent');
 if(s.stage==='betting'){
  experienceBaseRender();const rules=box.querySelector('.event-evidence p');if(rules)rules.textContent='1対1のノーリミット・ホールデム。手札2枚と共通札5枚から最強の5枚を使う。投入額は卓の持込みの範囲内。最低ベットはビッグブラインド、最低レイズ幅は直前の増額幅。残り全額なら最低幅未満も可能。相手が応じられない分は返る。';
  if(s.creditOffer)for(const p of box.querySelectorAll(':scope>p'))if(p.textContent.includes('最大損失'))p.textContent='卓の持込み '+holdMoney(s.budget)+' ＋手数料 '+holdMoney(Math.round(s.budget*.05))+'。借入の利息込みの最大損失は下の条件を確認。';
  casinoAppend(box,'<p class="casino-note">新しい対局はオールインあり。追加購入なし。'+(s.creditOffer?'借入は下の利息込みの条件で精算。':'持込みと手数料の合計が最大損失。')+'</p>');return;
 }
 const v=casinoView(),h=v.h,result=v.result,showdown=result&&s.reason==='showdown',pot=h.total[0]+h.total[1];
 const best=showdown?casinoBestFive([...(s.winner===1?h.opponent:h.player),...h.board]):[],opponentBest=showdown&&s.winner===-1?casinoBestFive([...h.opponent,...h.board]):[];
 const cue=v.cue,actor=cue?.actor,fold=cue?.action==='fold',award=cue?.action==='award',chips=cue&&cue.amount>0;
 const rows=(cards,group,count,winning)=>cards.map((card,i)=>casinoCard(card,group+':'+i,i<count&&!(fold&&group===(actor?'opponent':'player')),v,winning)).join('');
 const board=Array.from({length:5},(_,i)=>casinoCard(h.board[i],'board:'+i,i<v.board,v,[...best,...opponentBest])).join('');
 const status=v.message||(result?(s.winner===0?'WIN':s.winner===1?'LOSE':'DRAW'):h.turn===1?'相手の番':'あなたの番');
 const controls='<div class="casino-preferences"><button type="button" class="secondary" id="casinoSound" aria-pressed="'+!!state.tableSound+'">音 '+(state.tableSound?'ON':'OFF')+'</button><button type="button" class="secondary" id="casinoMotion" aria-pressed="'+(state.casinoMotion!==false)+'">演出 '+(state.casinoMotion!==false?'ON':'OFF')+'</button>'+(v.busy?'<button type="button" class="secondary" id="casinoSkip">演出をスキップ</button>':'')+'</div>';
 let html='<div class="casino-round"><span>'+(v.board===0?'プリフロップ':v.board<=3?'フロップ':v.board===4?'ターン':'リバー')+' · '+(s.noLimit?'ノーリミット':'リミット')+'</span><b>ポット '+holdMoney(pot)+'</b></div>';
 html+='<div class="table-felt casino-stage '+(result?(s.winner===0?'casino-won':s.winner===1?'casino-lost':'casino-drawn'):'')+'"><div class="table-seat '+(cue?.action==='check'&&actor===1?'casino-tap':'')+'">相手 · 残り '+holdMoney(h.stacks[1])+'</div><div class="card-row '+(fold&&actor===1?'casino-fold':'')+'">'+rows(h.opponent,'opponent',v.opponent,s.winner===1?best:opponentBest)+'</div><div class="casino-pot-area"><span class="casino-pot">'+holdMoney(pot)+'</span>'+(chips?'<span class="casino-moving-chips casino-from-'+actor+'" aria-hidden="true">◉ ◉ ◉</span>':'')+(award?'<span class="casino-award-chips casino-to-'+actor+'" aria-hidden="true">◉ ◉ ◉</span>':'')+'</div><div class="card-row casino-board">'+board+'</div><div class="casino-table-status" role="status" aria-live="polite">'+escapeHTML(status)+'</div><div class="card-row '+(fold&&actor===0?'casino-fold':'')+'">'+rows(h.player,'player',v.player,s.winner===0||s.winner===-1?best:[])+'</div><div class="table-seat '+(cue?.action==='check'&&actor===0?'casino-tap':'')+'">あなた · 残り '+holdMoney(h.stacks[0])+'</div></div>';
 if(result){
  const outcome=s.winner===0?'WIN':s.winner===1?'LOSE':'DRAW',gross=s.winner===0?pot:s.winner===-1?s.payout-h.stacks[0]:0;
  html+='<div class="casino-result casino-outcome '+(cue?.action==='award'&&casinoMotion()&&!v.skip?'casino-result-enter ':'')+(s.winner===0?'casino-result-win':s.winner===1?'casino-result-lose':'casino-result-draw')+'"><strong>'+outcome+'</strong>'+(showdown?'<p>あなた：'+POKER_NAMES[holdemBest([...h.player,...h.board])[0]]+' ／ 相手：'+POKER_NAMES[holdemBest([...h.opponent,...h.board])[0]]+'</p>':'<p>'+ (s.reason==='opponent_fold'?'相手がフォールドした。':'あなたがフォールドした。')+'</p>')+'<p>獲得ポット '+holdMoney(gross)+' · 今回の差引 '+diceSigned(s.net)+'</p><small>差引は手数料'+(s.creditLoan?'・今回の借入利息':'')+'込み。未使用チップは返却済み。</small></div>';
  if(!v.busy)html+='<button type="button" class="primary" id="casinoAgain">もう一局の条件を見る</button>';
 }else if(!v.busy){
  const actual=s.h,due=Math.max(0,actual.target-actual.street[0]);
  html+='<p class="casino-bet-summary">あなたの投入済み '+holdMoney(actual.total[0])+(due?' · コール '+holdMoney(Math.min(due,actual.stacks[0])):'')+'</p>';
  if(s.noLimit&&holdLegal(actual,0).some(a=>a==='raise'||a==='bet')){const min=casinoMinPayment(actual,0),selected=casinoRaisePayment(actual,0);html+='<label class="casino-sizing">今回投入する額 <output id="casinoSizeValue">'+holdMoney(selected)+'</output><input id="casinoSize" type="range" min="'+min+'" max="'+actual.stacks[0]+'" step="1" value="'+selected+'"><small>コール分込み。最低 '+holdMoney(min)+' ／ 残り '+holdMoney(actual.stacks[0])+'</small></label>'}
  html+='<div class="rate-buttons casino-actions">'+holdLegal(actual,0).map(a=>'<button type="button" class="'+(a==='fold'?'secondary':a==='allin'?'casino-allin':'primary')+'" data-hold-action="'+a+'">'+casinoButtonLabel(a,actual,s)+'</button>').join('')+'</div>';
  if(v.confirm)html+='<div class="casino-allin-confirm" role="group" aria-label="オールインの確認"><p>残り '+holdMoney(actual.stacks[0])+'をすべて投入します。</p><button type="button" class="casino-allin" id="casinoConfirmAllin">全額を投入する</button> <button type="button" class="secondary" id="casinoCancelAllin">戻る</button></div>';
 }
 html+=controls+'<details class="event-evidence"><summary>ルールと費用</summary><p>'+ (s.noLimit?'最低レイズ幅は直前の増額幅。全額投入だけは最低幅未満も可能。最低幅未満の増額で、すでに行動した相手のレイズ権は復活しない。相手が応じられない超過分は返却。':'この対局は開始時のリミットルールを維持。ターン以降の賭け幅は2倍、各ラウンド最大3回のレイズ。')+'</p><p>手数料 '+holdMoney(s.fee||0)+'。追加購入なし。卓の間は人生の時間が止まる。</p></details>';
 if(s.creditLoan&&(!s.settled||result))html+=casinoCreditPanel(s);
 const previousScroll=document.getElementById('casinoDialog').scrollTop;box.innerHTML=html;document.getElementById('casinoDialog').scrollTop=previousScroll;
 const splitChips=box.querySelector('.casino-to--1');if(splitChips){splitChips.className='casino-award-chips casino-to-0';const other=splitChips.cloneNode(true);other.className='casino-award-chips casino-to-1';splitChips.after(other)}
 box.querySelectorAll('[data-hold-action]').forEach(b=>b.onclick=()=>holdPlayer(b.dataset.holdAction));
 const byId=id=>document.getElementById(id),again=byId('casinoAgain');if(again)again.onclick=casinoNewHand;
 const size=byId('casinoSize');if(size)size.oninput=()=>{s.raisePayment=+size.value;v.confirm=false;box.querySelector('.casino-allin-confirm')?.remove();byId('casinoSizeValue').textContent=holdMoney(s.raisePayment);box.querySelectorAll('[data-hold-action]').forEach(b=>b.textContent=casinoButtonLabel(b.dataset.holdAction,s.h,s));save()};
 const confirm=byId('casinoConfirmAllin');if(confirm)confirm.onclick=()=>{if(!v.busy&&v.confirm)void casinoRun(0,'allin')};
 const cancel=byId('casinoCancelAllin');if(cancel)cancel.onclick=()=>{v.confirm=false;renderCasino()};
 byId('casinoSound').onclick=()=>{state.tableSound=!state.tableSound;save();casinoTone('tap');renderCasino()};
 byId('casinoMotion').onclick=()=>{state.casinoMotion=state.casinoMotion===false;save();if(!state.casinoMotion)casinoSkip();renderCasino()};
 const skip=byId('casinoSkip');if(skip)skip.onclick=casinoSkip;
 byId('closeCasino').disabled=s.stage==='playing'||v.busy;
};
const experienceLeave=casinoLeave;
casinoLeave=function(){if(casinoVisual?.session===state.casinoSession&&casinoVisual.busy)return;casinoVisual=null;experienceLeave()};
// The original handler captured the old function before this extension loaded.
document.getElementById('closeCasino').onclick=casinoLeave;
