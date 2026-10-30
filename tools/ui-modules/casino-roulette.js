// Single-zero roulette. Table amounts are cents, wallet amounts remain game units.
const ROULETTE_WHEEL=[0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
const ROULETTE_RED=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const ROULETTE_OUTSIDE=[['red','赤',2,18],['black','黒',2,18],['odd','奇数',2,18],['even','偶数',2,18],['low','1〜18',2,18],['high','19〜36',2,18],['dozen1','1〜12',3,12],['dozen2','13〜24',3,12],['dozen3','25〜36',3,12],['column1','1の列',3,12],['column2','2の列',3,12],['column3','3の列',3,12]];
let rouletteVisual=null;
function rouletteColor(n){return n===0?'green':ROULETTE_RED.has(n)?'red':'black'}
function rouletteBet(key){const outside=ROULETTE_OUTSIDE.find(b=>b[0]===key);if(outside)return {key,name:outside[1],multiple:outside[2],count:outside[3]};const match=/^number:(\d+)$/.exec(key||'');if(!match||+match[1]>36)return null;return {key,name:match[1]+'の1点賭け',multiple:36,count:1,number:+match[1]}}
function rouletteWins(bet,n){if(bet.number!==undefined)return n===bet.number;if(n===0)return false;switch(bet.key){case 'red':return ROULETTE_RED.has(n);case 'black':return !ROULETTE_RED.has(n);case 'odd':return n%2===1;case 'even':return n%2===0;case 'low':return n<=18;case 'high':return n>=19;case 'dozen1':return n<=12;case 'dozen2':return n>=13&&n<=24;case 'dozen3':return n>=25;case 'column1':return (n-1)%3===0;case 'column2':return (n-1)%3===1;case 'column3':return (n-1)%3===2;default:return false}}
function rouletteSpinning(){return !!(rouletteVisual?.spinning&&rouletteVisual.session===state.casinoSession)}
function rouletteFinishReveal(){const v=rouletteVisual;if(!v||!v.spinning)return;clearTimeout(v.timer);v.spinning=false;if(state.casinoSession!==v.session)return;casinoTone(v.session.won?'win':'lose');renderStats();renderCasino()}
function rouletteSpin(){
 const s=state.casinoSession,bet=rouletteBet(s?.betKey);if(s?.game!=='roulette'||s.stage!=='betting'||rouletteSpinning()||!bet||!Number.isInteger(s.budget)||s.budget<1)return;
 const fee=Math.round(s.budget*.05),cost=s.budget+fee;if(holdUnits(cost)>state.money)return;
 // Sample only once, then persist the complete settlement before starting the animation.
 const number=Math.floor(Math.random()*37),won=rouletteWins(bet,number),payout=won?s.budget*bet.multiple:0,before=state.money;
 state.money=Math.min(1000000,state.money-holdUnits(cost)+holdUnits(payout));s.game='roulette';s.cashBefore=before;s.number=number;s.won=won;s.fee=fee;s.payout=payout;s.received=holdCents(state.money-before)+cost;s.net=state.money-before;s.stage='result';s.settled=true;
 state.gamblingNet=(state.gamblingNet||0)+s.net;if(s.net>0)state.earned=(state.earned||0)+s.net;
 state.rouletteHistory=[...(state.rouletteHistory||[]),number].slice(-8);
 addFeed('カジノのルーレット：'+(won?'勝った。':'負けた。'),'choice','出目 '+number+'（'+({green:'緑',red:'赤',black:'黒'})[rouletteColor(number)]+'） · '+bet.name+' · 賭け金 '+holdMoney(s.budget)+' · 手数料 '+holdMoney(fee)+' · 払戻し '+holdMoney(s.received)+' · 純損益 '+diceSigned(s.net));
 save();rouletteVisual={session:s,spinning:casinoMotion(),timer:null};casinoTone('chips');renderCasino();
 if(rouletteVisual.spinning)rouletteVisual.timer=setTimeout(rouletteFinishReveal,4800);else{casinoTone(won?'win':'lose');renderStats()}
}
function rouletteSwitch(game){
 const s=state.casinoSession;if(!s||s.stage!=='betting'||rouletteSpinning())return;
 s.game=game==='roulette'?'roulette':'holdem';s.budget=0;delete s.creditOffer;delete s.betKey;save();
 if(game==='chinchiro'){rouletteBaseRender();document.getElementById('casinoChin').onclick();return}renderCasino();
}
function rouletteWheelHTML(s,spinning){
 const step=360/37,result=s.stage==='result'&&!spinning,index=s.number===undefined?0:ROULETTE_WHEEL.indexOf(s.number),angle=index*step+step/2;
 const segments=ROULETTE_WHEEL.map((n,i)=>({green:'#277357',red:'#963e42',black:'#152322'})[rouletteColor(n)]+' '+i*step+'deg '+(i+1)*step+'deg').join(',');
 return '<div class="roulette-arena '+(spinning?'roulette-spinning':'')+'" style="--ball-end:'+(-2160+angle)+'deg"><div class="roulette-wheel" style="background:conic-gradient('+segments+')">'+ROULETTE_WHEEL.map((n,i)=>'<span class="roulette-pocket" style="--pocket-angle:'+(i*step+step/2)+'deg">'+n+'</span>').join('')+'</div><div class="roulette-hub"><span>ODDS CITY</span><strong>'+(result?s.number:spinning?'…':'0—36')+'</strong><small>'+(result?({red:'赤',black:'黒',green:'緑'})[rouletteColor(s.number)]:spinning?'回転中':'SINGLE ZERO')+'</small></div>'+(s.stage==='result'?'<div class="roulette-ball-orbit" style="transform:rotate('+angle+'deg)"><span class="roulette-ball"></span></div>':'')+'</div>';
}
function renderRoulette(){
 const s=state.casinoSession,box=document.getElementById('casinoContent'),spinning=rouletteSpinning(),result=s.stage==='result',bet=rouletteBet(s.betKey),fee=Math.round((s.budget||0)*.05),cost=(s.budget||0)+fee,cash=holdCents(spinning?s.cashBefore-holdUnits(cost):state.money);
 document.getElementById('casinoTitle').textContent='カジノ · ルーレット';document.getElementById('closeCasino').disabled=spinning;
 const history=(state.rouletteHistory||[]).slice(0,spinning?-1:undefined);
 let html='<div class="roulette-heading"><span>0が一つ · 37数字</span><span>手持ち '+holdMoney(cash)+'</span></div>'+rouletteWheelHTML(s,spinning)+'<div class="roulette-status" role="status" aria-live="polite">'+(spinning?'賭けを締め切った。球が止まるまで…':result?'出目 '+s.number+' · '+(s.won?'WIN':'LOSE'):'賭け先と金額を選んでください')+'</div>';
 if(result&&!spinning){html+='<div class="roulette-result '+(s.won?'roulette-win':'roulette-loss')+'"><strong>'+(s.won?'WIN':'LOSE')+'</strong><p>'+escapeHTML(bet.name)+' · 払戻し '+holdMoney(s.received)+'</p><p>今回の差引 '+diceSigned(s.net)+'（手数料込み）</p>'+(s.received<s.payout?'<small>保有資金の上限を超えた分は受け取れません。</small>':'')+'</div><button type="button" class="primary" id="rouletteAgain">次の条件を見る</button>'}
 if(!result){
  const seen=new Set(),offers=[{n:2000,label:'定額'},{n:10000,label:'定額'},...[.1,.25,.5].map(p=>({n:Math.floor(cash*p),label:'手持ちの'+Math.round(p*100)+'%'}))].filter(o=>{if(o.n<1||holdUnits(o.n+Math.round(o.n*.05))>state.money||seen.has(o.n))return false;seen.add(o.n);return true});
  html+='<section class="casino-entry-section"><h3>1 · 遊ぶゲーム</h3><div class="casino-game-choice"><button type="button" class="secondary" data-roulette-game="holdem">ホールデム</button><button type="button" class="secondary" data-roulette-game="chinchiro">ちんちろ</button><button type="button" class="secondary" aria-pressed="true">ルーレット</button></div></section><section class="casino-entry-section"><h3>2 · 賭け先を選ぶ</h3><p class="roulette-caption">1回につき1種類。倍率は賭け金を含む払戻しです。</p><div class="roulette-outside">'+ROULETTE_OUTSIDE.map(b=>'<button type="button" class="secondary '+(b[0]==='red'?'roulette-red':b[0]==='black'?'roulette-black':'')+'" data-roulette-bet="'+b[0]+'" aria-pressed="'+(s.betKey===b[0])+'"><b>'+b[1]+'</b><small>払戻し '+b[2]+'倍</small></button>').join('')+'</div><details class="roulette-numbers" '+(bet?.number!==undefined?'open':'')+'><summary>数字を1つ選ぶ · 払戻し36倍</summary><div class="roulette-number-grid">'+Array.from({length:37},(_,n)=>'<button type="button" class="roulette-number roulette-'+rouletteColor(n)+'" data-roulette-bet="number:'+n+'" aria-pressed="'+(s.betKey==='number:'+n)+'">'+n+'</button>').join('')+'</div></details></section><section class="casino-entry-section"><h3>3 · 賭け金</h3><div class="casino-budget-grid">'+offers.map(o=>'<button type="button" class="secondary" data-roulette-budget="'+o.n+'" aria-pressed="'+(s.budget===o.n)+'"><strong>'+holdMoney(o.n)+'</strong><span>'+o.label+'</span></button>').join('')+'</div>'+(!offers.length?'<p class="roulette-caption">手持ちで参加できる額がありません。</p>':'')+'</section>';
  if(bet&&s.budget){const winNet=Math.min(1000000,state.money-holdUnits(cost)+holdUnits(s.budget*bet.multiple))-state.money;html+='<div class="casino-entry-condition"><h3>今回の条件 · '+escapeHTML(bet.name)+'</h3>'+spendEffects([['的中率',Math.round(bet.count/37*100)+'%（'+bet.count+'/37）'],['賭け金',holdMoney(s.budget)],['手数料（5%）',holdMoney(fee)],['支払う合計・最大損失',holdMoney(cost)],['的中時の払戻し（賭け金込み）',holdMoney(s.budget*bet.multiple)],['的中時の差引',diceSigned(winNet)]])+'<p>0は緑。赤黒・偶奇・範囲・列の賭けは、0が出ると外れです。</p></div>'}
  html+='<button type="button" class="primary casino-entry-start" id="rouletteSpin" '+(!bet||!s.budget||holdUnits(cost)>state.money?'disabled':'')+'>この条件で回す</button><p class="roulette-caption">ゲーム内の手持ち資金だけで参加。追加購入・卓用借入なし。</p>';
 }
 html+='<div class="casino-preferences"><button type="button" class="secondary" id="rouletteSound" aria-pressed="'+!!state.tableSound+'">音 '+(state.tableSound?'ON':'OFF')+'</button><button type="button" class="secondary" id="rouletteMotion" aria-pressed="'+(state.casinoMotion!==false)+'">演出 '+(state.casinoMotion!==false?'ON':'OFF')+'</button>'+(spinning?'<button type="button" class="secondary" id="rouletteSkip">演出をスキップ</button>':'')+'</div>'+(history.length?'<div class="roulette-history"><span>直近の出目</span>'+history.map(n=>'<b class="roulette-'+rouletteColor(n)+'">'+n+'</b>').join('')+'</div>':'')+'<details class="event-evidence"><summary>ルールと配当</summary><p>0〜36は各1/37で抽選。赤黒・偶奇・1〜18／19〜36は払戻し2倍、12数字と縦列は3倍、数字1点は36倍。すべて賭け金を含みます。1の列は1・4・7…34、2の列は2・5・8…35、3の列は3・6・9…36です。</p><p>既存のカジノと同じ手数料5%を別に払い、セント単位に丸めます。最低手数料の追加なし。回転中は人生の時間が止まり、結果を見てから次の賭け先と金額を選び直します。</p></details>';
 const dialog=document.getElementById('casinoDialog'),scroll=dialog.scrollTop;box.innerHTML=html;dialog.scrollTop=scroll;
 const el=id=>document.getElementById(id);
 box.querySelectorAll('[data-roulette-game]').forEach(b=>b.onclick=()=>rouletteSwitch(b.dataset.rouletteGame));
 box.querySelectorAll('[data-roulette-bet]').forEach(b=>b.onclick=()=>{if(s.stage!=='betting')return;s.betKey=b.dataset.rouletteBet;save();renderCasino();document.querySelector('[data-roulette-bet="'+s.betKey+'"]')?.focus({preventScroll:true})});
 box.querySelectorAll('[data-roulette-budget]').forEach(b=>b.onclick=()=>{if(s.stage!=='betting')return;s.budget=+b.dataset.rouletteBudget;save();renderCasino();document.querySelector('[data-roulette-budget="'+s.budget+'"]')?.focus({preventScroll:true})});
 if(el('rouletteSpin'))el('rouletteSpin').onclick=rouletteSpin;if(el('rouletteAgain'))el('rouletteAgain').onclick=casinoNewHand;if(el('rouletteSkip'))el('rouletteSkip').onclick=rouletteFinishReveal;
 el('rouletteSound').onclick=()=>{state.tableSound=!state.tableSound;save();casinoTone('tap');el('rouletteSound').textContent='音 '+(state.tableSound?'ON':'OFF');el('rouletteSound').setAttribute('aria-pressed',!!state.tableSound)};
 el('rouletteMotion').onclick=()=>{state.casinoMotion=state.casinoMotion===false;save();if(spinning&&!state.casinoMotion){rouletteFinishReveal();return}el('rouletteMotion').textContent='演出 '+(state.casinoMotion!==false?'ON':'OFF');el('rouletteMotion').setAttribute('aria-pressed',state.casinoMotion!==false)};
}
const rouletteBaseRender=renderCasino;
renderCasino=function(){const s=state.casinoSession;if(s?.game==='roulette'){renderRoulette();return}document.getElementById('casinoTitle').textContent='カジノ · ホールデム';rouletteBaseRender();if(s?.stage==='betting'){const games=document.querySelector('#casinoContent .casino-game-choice');if(games){const button=document.createElement('button');button.type='button';button.className='secondary';button.textContent='ルーレット';button.onclick=()=>rouletteSwitch('roulette');games.append(button)}}};
const rouletteBaseNewHand=casinoNewHand;
casinoNewHand=function(){if(state.casinoSession?.game!=='roulette'){rouletteBaseNewHand();return}if(rouletteSpinning()||state.casinoSession.stage!=='result')return;rouletteVisual=null;state.casinoSession={game:'roulette',stage:'betting',budget:0,settled:false};save();renderCasino()};
const rouletteBaseLeave=casinoLeave;
casinoLeave=function(){if(rouletteSpinning())return;rouletteVisual=null;rouletteBaseLeave()};
document.getElementById('closeCasino').onclick=casinoLeave;
const rouletteBaseResume=resumeCasino;
resumeCasino=function(){if(state.casinoSession?.game!=='roulette'){rouletteBaseResume();return}renderCasino();if(!document.getElementById('casinoDialog').open)document.getElementById('casinoDialog').showModal()};
