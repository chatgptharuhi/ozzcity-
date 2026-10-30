// Shared casino presentation for invited draw poker and all current chinchiro tables.
// The invitation keeps cash-only rules; casino chinchiro keeps its existing credit rules.
let smallTableVisual=null;
function smallTableView(){const s=state.diceSession;if(!s?.game)return null;if(smallTableVisual?.session!==s)smallTableVisual={session:s,busy:false,result:s.stage==='result',message:'',hand:[...(s.playerHand||[])],opponent:[...(s.opponentHand||[])],playerCount:5,opponentCount:s.stage==='result'&&!s.fold?5:0,playerDice:[...(s.playerRolls?.at(-1)||[])],opponentDice:s.stage==='result'?[...(s.opponentRolls?.at(-1)||[])]:[],flip:'',cue:null,skip:false,wake:null};return smallTableVisual}
function smallTableCurrent(v){return state.diceSession===v.session&&smallTableVisual===v}
function smallTableBusy(){return !!(smallTableVisual?.session===state.diceSession&&smallTableVisual.busy)}
function smallTableSkip(){const v=smallTableView();if(!v)return;v.skip=true;v.wake?.()}
function smallTableHandName(d){if(!d||d.length!==3)return '';const rank=chinRank(d);return rank===100?'ピンゾロ':rank>=80?'ゾロ目':rank===70?'シゴロ':rank===0?'ヒフミ':rank===5?'役なし':(rank-10)+'の目'}
async function smallTableBeat(v,text,ms){if(!smallTableCurrent(v))return false;v.message=text;if(/最後/.test(text)&&!v.skip)casinoTone('tap');renderDice();await casinoWait(ms,v);return smallTableCurrent(v)}
async function smallTableResult(v){const s=v.session;await smallTableBeat(v,'勝負を見届ける…',650);if(!smallTableCurrent(v))return;v.result=true;v.cue={action:'award',actor:s.outcome>0?0:s.outcome<0?1:-1};v.message=s.fold?'フォールド':s.outcome>0?'WIN':s.outcome<0?'LOSE':'DRAW';casinoTone(s.outcome>0?'win':s.outcome<0?'lose':'tap');renderDice();await casinoWait(700,v);v.cue=null}
function smallTableUnlock(v){if(!smallTableCurrent(v))return;v.busy=false;v.skip=false;v.flip='';v.cue=null;v.result=v.session.stage==='result';renderStats();renderDice()}
tableCommit=function(){
 const s=state.diceSession;if(!s?.game||s.stage!=='betting'||!s.stake||smallTableBusy())return;
 const fee=diceFee(s.stake),cost=s.stake+fee;if(s.creditOffer?!casinoIssueLoan(s):state.money<cost)return;
 clearTimeout(diceTimer);s.cashBefore=state.money;s.fee=fee;s.stage=s.game==='poker'?'draw':'rolling';if(!s.creditLoan)state.money-=cost;
 if(s.game==='poker'){
  s.deck=Array.from({length:52},(_,i)=>i);for(let i=51;i>0;i--){const j=Math.floor(Math.random()*(i+1));[s.deck[i],s.deck[j]]=[s.deck[j],s.deck[i]]}
  s.playerHand=Array.from({length:5},()=>s.deck.pop());s.opponentHand=Array.from({length:5},()=>s.deck.pop());s.exchange=[];save();smallTableVisual=null;const v=smallTableView();v.busy=true;v.playerCount=0;v.cue={action:'chips',actor:0};
  void(async()=>{try{casinoTone('chips');if(!await smallTableBeat(v,'賭け金を中央へ…',450))return;v.cue=null;for(let i=0;i<5;i++){if(!smallTableCurrent(v))return;v.playerCount=i+1;v.flip='small-player:'+i;casinoTone('flip');if(!await smallTableBeat(v,'札を配る…',300))return;v.flip=''}v.message='交換する札を選ぶ'}finally{smallTableUnlock(v)}})();
 }else{ s.opponentRolls=chinOpponent();s.playerRolls=[];save();smallTableVisual=null;tableChinRoll() }
};
const smallTableBaseSettle=tableSettle;
tableShowdown=function(fold=false){
 const s=state.diceSession,v=smallTableView();if(s?.game!=='poker'||s.stage!=='draw'||!v||v.busy)return;
 v.busy=true;v.skip=false;s.fold=fold;const exchanged=[...s.exchange],oldOpponent=[...s.opponentHand];
 if(!fold){s.playerHand=s.playerHand.map((c,i)=>s.exchange.includes(i)?s.deck.pop():c);pokerOpponentDraw(s);s.outcome=compareHands(s.playerHand,s.opponentHand)}else s.outcome=-1;
 s.stage='rolling';save();smallTableBaseSettle();
 void(async()=>{try{
  if(fold){v.playerCount=0;v.cue={action:'fold',actor:0};casinoTone('tap');if(!await smallTableBeat(v,'札を伏せて降りる',450))return;v.cue=null}
  else{
   if(!await smallTableBeat(v,exchanged.length?exchanged.length+'枚を交換する…':'この5枚で勝負する',400))return;
   for(const i of exchanged){if(!smallTableCurrent(v))return;v.hand[i]=s.playerHand[i];v.flip='small-player:'+i;casinoTone('flip');if(!await smallTableBeat(v,'交換札を開く…',430))return;v.flip=''}
   const opponentExchanged=oldOpponent.filter(c=>!s.opponentHand.includes(c)).length;
   if(!await smallTableBeat(v,'相手は'+opponentExchanged+'枚交換した。',700))return;
   v.opponent=[...s.opponentHand];for(let i=0;i<5;i++){if(!await smallTableBeat(v,i===4?'相手の最後の1枚…':'相手の札を開く…',i===4?650:120))return;v.opponentCount=i+1;v.flip='small-opponent:'+i;casinoTone('flip');renderDice();await casinoWait(400,v);v.flip=''}
  }
  await smallTableResult(v);
 }finally{smallTableUnlock(v)}})();
};
tableChinRoll=function(){
 const s=state.diceSession,v=smallTableView();if(s?.game!=='chinchiro'||!v||v.busy||s.settled||s.outcome!==undefined||s.playerRolls.length>=3)return;
 clearTimeout(diceTimer);v.busy=true;v.skip=false;v.playerDice=[];v.opponentDice=[];v.result=false;v.cue=s.playerRolls.length===0?{action:'chips',actor:0}:null;
 s.playerRolls.push(tableRoll3());const dice=s.playerRolls.at(-1),ready=chinRank(dice)!==5||s.playerRolls.length===3;
 if(ready){s.outcome=Math.sign(chinRank(dice)-chinRank(s.opponentRolls.at(-1)));s.stage='rolling'}save();if(ready)smallTableBaseSettle();
 void(async()=>{try{
  casinoTone(s.playerRolls.length===1?'chips':'tap');if(!await smallTableBeat(v,s.playerRolls.length===1?'賭け金を置き、サイコロを振る…':'サイコロを振り直す…',850))return;v.cue=null;
  for(let i=0;i<3;i++){if(!smallTableCurrent(v))return;v.playerDice.push(dice[i]);casinoTone('tap');if(!await smallTableBeat(v,i===2?'最後の目が止まった':'目が止まる…',i===2?500:250))return}
  if(!await smallTableBeat(v,'あなた：'+smallTableHandName(dice),450))return;
  if(ready){const other=s.opponentRolls.at(-1);if(!await smallTableBeat(v,'相手の目を確かめる…',600))return;for(let i=0;i<3;i++){if(i===2&&!await smallTableBeat(v,'相手の最後の1個…',650))return;if(!smallTableCurrent(v))return;v.opponentDice.push(other[i]);casinoTone('tap');if(!await smallTableBeat(v,'相手の目を開く…',350))return}await smallTableResult(v)}
  else v.message='役なし。あと'+(3-s.playerRolls.length)+'回振り直せる。';
 }finally{smallTableUnlock(v)}})();
};
function smallTablePreferences(v){return '<div class="casino-preferences"><button type="button" class="secondary" id="smallTableSound" aria-pressed="'+!!state.tableSound+'">音 '+(state.tableSound?'ON':'OFF')+'</button><button type="button" class="secondary" id="smallTableMotion" aria-pressed="'+(state.casinoMotion!==false)+'">演出 '+(state.casinoMotion!==false?'ON':'OFF')+'</button>'+(v?.busy?'<button type="button" class="secondary" id="smallTableSkip">演出をスキップ</button>':'')+'</div>'}
const smallTableLegacyRender=renderDice;
renderDice=function(){
 const s=state.diceSession;if(!s?.game){smallTableLegacyRender();return}
 const v=smallTableView(),poker=s.game==='poker',betting=s.stage==='betting',result=v.result,busy=v.busy,casino=s.origin==='casino',root=document.getElementById('diceDialog');
 document.getElementById('diceTitle').textContent=(casino?'カジノ':'仲間の卓')+' · '+(poker?'5枚ドローポーカー':'ちんちろ');
 for(const id of ['diceCash','diceArena','diceStakes','diceRoll','diceLeave','diceContinue','diceResult'])document.getElementById(id).hidden=true;
 document.getElementById('tableBoard')?.remove();
 const cash=busy?(s.creditLoan?s.cashBefore:s.cashBefore-s.stake-s.fee):state.money;
 let html='<p class="small-table-wallet">手持ち資金 <strong>'+diceMoney(cash)+'</strong></p>';
 if(betting){
  const amounts=[20,100,...[.1,.25,.5].map(p=>Math.floor(state.money*MXN_PER_UNIT/MXN_PER_USD*p*100)/100)],seen=new Set(),offers=amounts.map((amount,i)=>({amount:dollarsToUnits(amount),label:i<2?'定額':'手持ちの'+[10,25,50][i-2]+'%'})).filter(o=>{const cents=holdCents(o.amount);if(cents<1||o.amount+diceFee(o.amount)>state.money||seen.has(cents))return false;seen.add(cents);return true});
  html+='<section class="casino-entry-section"><h3>1 · 遊ぶゲーム</h3><div class="casino-game-choice">'+(casino?['chinchiro']:['chinchiro','poker']).map(game=>'<button type="button" class="secondary" data-small-game="'+game+'" aria-pressed="'+(s.game===game)+'">'+(game==='poker'?'5枚ドロー':'ちんちろ')+'</button>').join('')+'</div></section><section class="casino-entry-section"><h3>2 · 賭け金</h3><div class="casino-budget-grid">'+offers.map(o=>'<button type="button" class="secondary" data-small-stake="'+o.amount+'" aria-pressed="'+(!s.creditOffer&&Math.abs(s.stake-o.amount)<1e-8)+'"><strong>'+diceMoney(o.amount)+'</strong><span>'+o.label+'</span></button>').join('')+'</div>'+(!offers.length?'<p class="roulette-caption">手持ちで参加できる額がありません。</p>':'')+'</section>';
  if(s.stake){const n=diceOutcomeNumbers(s.stake);html+='<div class="casino-entry-condition"><h3>今回の条件</h3>'+spendEffects([['賭け金',diceMoney(s.stake)],['手数料（5%）',diceMoney(n.fee)],...(s.creditOffer?[['借入の元本',holdMoney(s.creditOffer)],['負けた場合の最大の借金',holdMoney(Math.round(s.creditOffer*(1+casinoLoanRate(s.creditOffer))))],['手持ちからの支払い','US$0']]:[['支払う合計・最大損失',diceMoney(s.stake+n.fee)],['勝った場合の差引',diceSigned(n.win)],['引き分けの差引',diceSigned(n.tie)],...(poker?[['途中で降りた場合',diceSigned(-s.stake+tableFoldRefund(s)-n.fee)]]:[])])])+'</div>'}
  html+='<div class="casino-actions"><button type="button" class="primary" id="smallTableStart" '+(!s.stake?'disabled':'')+'>この条件で'+(poker?'札を配る':'勝負を始める')+'</button><button type="button" class="secondary" id="smallTableLeave">賭けずに戻る</button></div><p class="roulette-caption">'+(casino?'追加ベットなし。':'手持ちだけで参加。借入・追加ベットなし。')+'</p>';
  if(casino){const credit=casinoCredit();html+=casinoCreditAllowed()?'<details class="small-credit" '+(s.creditOffer?'open':'')+'><summary>借りて遊ぶ</summary>'+casinoCreditPanel(s,true)+'</details>':'<p class="roulette-caption">卓用の借入：'+(credit.outstanding>0?'残債 '+moneyText(credit.outstanding)+'の完済が必要。':'')+(state.month<credit.nextMonth?'再借入まであと'+(credit.nextMonth-state.month)+'か月。':'')+'</p>'}
 }else{
  const cue=v.cue,outcome=s.fold?'FOLD':s.outcome>0?'WIN':s.outcome<0?'LOSE':'DRAW',pot=s.stake*2;
  html+='<div class="casino-round"><span>'+(poker?'1回交換 · 追加ベットなし':'3個のサイコロ · 最大3投')+'</span><b>双方の賭け金 '+diceMoney(pot)+'</b></div><div class="table-felt casino-stage '+(result?(s.outcome>0?'casino-won':s.outcome<0?'casino-lost':'casino-drawn'):'')+'">';
  if(poker){
   const card=(c,i,other)=>casinoCard(c,(other?'small-opponent:':'small-player:')+i,i<(other?v.opponentCount:v.playerCount),v,result&&s.outcome===(other?-1:1)?(other?v.opponent:v.hand):[]);
   html+='<div class="table-seat">相手'+(result&&!s.fold?' · '+POKER_NAMES[pokerRank(s.opponentHand)[0]]:'')+'</div><div class="card-row">'+v.opponent.map((c,i)=>card(c,i,true)).join('')+'</div><div class="small-table-pot">'+(cue?.action==='chips'?'<span class="casino-moving-chips casino-from-0" aria-hidden="true">◉ ◉ ◉</span>':'')+(cue?.action==='award'?'<span class="casino-award-chips casino-to-'+cue.actor+'" aria-hidden="true">◉ ◉ ◉</span>':'')+'</div><div class="casino-table-status" role="status" aria-live="polite">'+escapeHTML(v.message||(result?outcome:'交換する札を選ぶ（0〜5枚）'))+'</div><div class="card-row '+(cue?.action==='fold'?'casino-fold':'')+'">'+v.hand.map((c,i)=>'<button type="button" class="card-pick" data-small-card="'+i+'" aria-pressed="'+s.exchange.includes(i)+'" '+(busy||result?'disabled':'')+'>'+card(c,i,false)+(s.exchange.includes(i)&&!result?'<small>交換</small>':'')+'</button>').join('')+'</div><div class="table-seat">あなた'+(!busy&&!s.fold?' · '+POKER_NAMES[pokerRank(s.playerHand)[0]]:'')+'</div>';
  }else{
   const faces=['⚀','⚁','⚂','⚃','⚄','⚅'],diceRow=(dice,other)=>'<div class="small-dice-row">'+Array.from({length:3},(_,i)=>'<span class="small-die '+(busy&&i>=dice.length&&!other?'small-die-rolling':'')+'">'+(i<dice.length?faces[dice[i]-1]:other?'？':'⚄')+'</span>').join('')+'</div>';
   html+='<div class="table-seat">相手'+(v.opponentDice.length===3?' · '+smallTableHandName(v.opponentDice):' · 目は伏せられている')+'</div>'+diceRow(v.opponentDice,true)+'<div class="small-table-pot">'+(cue?.action==='chips'?'<span class="casino-moving-chips casino-from-0" aria-hidden="true">◉ ◉ ◉</span>':'')+(cue?.action==='award'?'<span class="casino-award-chips casino-to-'+cue.actor+'" aria-hidden="true">◉ ◉ ◉</span>':'')+'</div><div class="casino-table-status" role="status" aria-live="polite">'+escapeHTML(v.message||(result?outcome:'役なし。振り直せる。'))+'</div><div class="dice-bowl">'+diceRow(v.playerDice,false)+'</div><div class="table-seat">あなた · '+s.playerRolls.length+'/3投'+(v.playerDice.length===3?' · '+smallTableHandName(v.playerDice):'')+'</div>';
  }
  html+='</div>';
  if(result){html+='<div class="casino-result casino-outcome '+(cue?.action==='award'&&casinoMotion()&&!v.skip?'casino-result-enter ':'')+(s.outcome>0?'casino-result-win':s.outcome<0?'casino-result-lose':'casino-result-draw')+'"><strong>'+outcome+'</strong><p>今回の差引 '+diceSigned(s.net)+'（手数料込み）</p>'+(s.fold?'<small>賭け金の半分を返却。残り半分と手数料を失った。</small>':'')+'</div>';if(!busy)html+='<button type="button" class="primary" id="smallTableContinue">結果を読んで戻る</button>';if(s.creditLoan)html+=casinoCreditPanel(s,true)}
  else if(!busy){html+=poker?'<div class="casino-actions"><button type="button" class="primary" id="smallTableShowdown">'+(s.exchange.length?s.exchange.length+'枚を交換して勝負':'交換せずに勝負')+'</button><button type="button" class="secondary" id="smallTableFold">降りる（半額＋手数料を失う）</button></div>':'<button type="button" class="primary" id="smallTableReroll">もう一度振る · 残り'+(3-s.playerRolls.length)+'回</button>'}
 }
 html+=smallTablePreferences(v)+'<details class="event-evidence"><summary>ルールと費用</summary><p>'+escapeHTML(TABLE_RULES[s.game])+'</p><p>手数料は賭け金の5%。'+(casino?'借入は卓専用の条件で精算。':'借金して参加することはできない。')+'卓の間、人生の時間は止まる。月末の収支は対戦後に別途発生。</p>'+(poker?'':'<p>'+chinOdds()+'</p>')+'</details>';
 const scroll=root.scrollTop;document.getElementById('diceTerms').innerHTML=html;root.scrollTop=scroll;
 root.querySelector('.casino-stage')?.classList.toggle('small-table-tension',busy&&/最後|見届ける/.test(v.message));
 if(result)root.querySelectorAll('[data-small-card]').forEach(b=>b.setAttribute('aria-pressed','false'));
 const split=root.querySelector('.casino-to--1');if(split){split.className='casino-award-chips casino-to-0';const other=split.cloneNode(true);other.className='casino-award-chips casino-to-1';split.after(other)}
 const el=id=>document.getElementById(id);
 root.querySelectorAll('[data-small-game]').forEach(b=>b.onclick=()=>{if(s.stage!=='betting')return;s.game=b.dataset.smallGame;s.stake=0;save();renderDice()});
 root.querySelectorAll('[data-small-stake]').forEach(b=>b.onclick=()=>{if(s.stage!=='betting')return;delete s.creditOffer;s.stake=+b.dataset.smallStake;save();renderDice()});
 root.querySelectorAll('[data-small-card]').forEach(b=>b.onclick=()=>{if(v.busy||s.stage!=='draw')return;const i=+b.dataset.smallCard;s.exchange=s.exchange.includes(i)?s.exchange.filter(x=>x!==i):[...s.exchange,i];save();renderDice();root.querySelector('[data-small-card="'+i+'"]')?.focus({preventScroll:true})});
 root.querySelectorAll('[data-credit]').forEach(b=>b.onclick=()=>casinoChooseLoan(+b.dataset.credit,true));
 if(el('smallTableStart'))el('smallTableStart').onclick=tableCommit;if(el('smallTableLeave'))el('smallTableLeave').onclick=finishDice;if(el('smallTableContinue'))el('smallTableContinue').onclick=finishDice;
 if(el('smallTableShowdown'))el('smallTableShowdown').onclick=()=>tableShowdown();if(el('smallTableFold'))el('smallTableFold').onclick=()=>tableShowdown(true);if(el('smallTableReroll'))el('smallTableReroll').onclick=tableChinRoll;if(el('smallTableSkip'))el('smallTableSkip').onclick=smallTableSkip;
 el('smallTableSound').onclick=()=>{state.tableSound=!state.tableSound;save();casinoTone('tap');el('smallTableSound').textContent='音 '+(state.tableSound?'ON':'OFF');el('smallTableSound').setAttribute('aria-pressed',!!state.tableSound)};
 el('smallTableMotion').onclick=()=>{state.casinoMotion=state.casinoMotion===false;save();if(!state.casinoMotion)smallTableSkip();el('smallTableMotion').textContent='演出 '+(state.casinoMotion!==false?'ON':'OFF');el('smallTableMotion').setAttribute('aria-pressed',state.casinoMotion!==false)};
};
const smallTableBaseFinish=finishDice;
finishDice=function(){if(smallTableBusy())return;smallTableVisual=null;smallTableBaseFinish()};
document.getElementById('diceLeave').onclick=finishDice;document.getElementById('diceContinue').onclick=finishDice;
const invitation=events.find(e=>e.id==='dice_invitation');invitation.text='仲間がちんちろと5枚ドローポーカーの卓を囲んでいる。参加するなら、手持ちから賭け金を決める。借入はできない。';
if(state.currentEvent?.id==='dice_invitation'){state.currentEvent.text=invitation.text}
