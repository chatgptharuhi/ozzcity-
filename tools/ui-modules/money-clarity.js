// Presentation only: existing records and settlement logic remain authoritative.
function journalRoutineHobby(f){return /を楽しんだ。$|^カジノで過ごした後の気分が変わった。$/.test(f.text)}
function journalMoneyAction(f){
 if(journalRoutineHobby(f))return false;
 if(f.moneyAction)return true;
 if(!['choice','risk'].includes(f.type))return false;
 if(/カジノの|ホールデム|ちんちろ|ポーカー|闇金から卓用|趣味として|を休止した|を再開すること|車を|新居|部屋を|ごちそう|日用品店|店の持分|預け金|借金を返済|護衛|警護|代役.*支払|に加入した/.test(f.text))return true;
 return HOBBIES.some(h=>f.text.startsWith(h.name)&&!journalRoutineHobby(f));
}
function journalActionHTML(f,month){
 const detail=f.detail||'',casino=/ホールデム|ちんちろ|ポーカー|カジノ/.test(f.text),net=detail.match(/純損益\s*([^·]+)/),debt=detail.match(/卓の残債\s*([^·]+)/);
 const summary=casino&&net?'今回の差引 '+net[1].trim()+(debt?' · 卓の残債 '+debt[1].trim():''):detail;
 const outcome=casino&&(/勝った|勝利|大きく勝/.test(f.text)?'win':/負けた|敗れ/.test(f.text)?'loss':/引き分け/.test(f.text)?'draw':/降りた|フォールド/.test(f.text)?'fold':net?(/^[−－-]/.test(net[1].trim())?'cost':/^[＋+]/.test(net[1].trim())?'gain':'draw'):'');
 const label={win:'勝ち',loss:'負け',draw:'引き分け',fold:'フォールド',gain:'収支プラス',cost:'収支マイナス'}[outcome],color={fold:'loss',cost:'loss',gain:'win'}[outcome]||outcome;
 const result=outcome?'<details class="money-record-detail"><summary class="journal-result-toggle"><span class="journal-result-badge journal-result-'+color+'">'+label+(summary?' · '+escapeHTML(summary):'')+'</span><span class="journal-result-hint">内訳</span></summary><p>'+escapeHTML(detail||f.text)+'</p></details>':summary?'<p class="money-record-effect">'+escapeHTML(summary)+'</p>':'';
 return '<article class="feedrow money-record"><div class="feedage">'+ageText(month)+'</div><div class="feedtext"><div class="money-record-title">'+escapeHTML(f.text)+'</div>'+result+'</div></article>';
}

const clarityAddFeed=addFeed;
addFeed=function(text,type='normal',detail='',extra={}){const manual=document.getElementById('spendDialog').open&&type==='choice'&&!journalRoutineHobby({text});clarityAddFeed(text,type,detail,{...extra,...(manual?{moneyAction:true}:{})})};

renderExpenseOverview=function(){
 const active=state.phase==='game',next=state.month+1,e=essentialBudget(),settings=e.pending&&next>=e.pending.effective?e.pending:e,p=monthlyLivingParts(settings,next),b=personalBudget(),r=currentRich(),vehicle=vehicleInfo();
 const working=active&&!(next>=state.leaveStartMonth&&next<state.leaveEndMonth),forecast=salaryForecast(state.organization,state.rank,state.boss),scheduled=working?forecast.scheduledMonthly:0,average=working?forecast.monthly:0,delay=working?forecast.delay:0;
 const housing=r.home?pesos(1500):b.rent?pesos(4000):0,living=active?livingTotal(p):housing+p.family;
 const contracts=active?Object.entries(PROTECTION).reduce((n,[k,plan])=>n+(state.protectionPlans?.[k]?dollarsToUnits(plan.fee):0),0):0;
 const transport=vehicle?pesos(active&&b.car.using?vehicle.monthly:vehicle.parked):0,rate=state.pendingRemittanceRate!==null&&next>=state.remittanceEffectiveMonth?state.pendingRemittanceRate:state.remittanceRate;
 const hobbies=hobbyCostPreview(next),optional=contracts+transport+hobbies,remit=scheduled*rate,remaining=scheduled-living-optional-remit,shortage=Math.max(0,living-state.money);
 const rows=[['手当の支払予定',moneyText(scheduled)+(working?'（未払い '+Math.round(delay*100)+'%）':'（'+(active?'休業中':'収監・審理中')+'）')],['必要生活費',moneyText(living)],...(optional+remit>0?[['契約・趣味・送金',moneyText(optional+remit)]]:[]),['手当が届けば残る額',signedMoney(remaining)]];
 const breakdown=active?livingBreakdownRows(p):[['住居費',moneyText(housing)],...(p.family?[['家族の扶養分',moneyText(p.family)]]:[])];
 const extras=[['護衛・医療等',contracts],['乗り物の維持',transport],['趣味の活動費',hobbies],['任意の送金（届いた場合）',remit]].filter(([,amount])=>amount>0).map(([label,amount])=>[label,moneyText(amount)]);
 document.getElementById('expenseOverview').innerHTML='<h3>翌月の収支</h3>'+spendEffects(rows)+'<p class="clarity-caption">過去の借金返済・臨時収支は含まない。</p>'+(working?'<p class="clarity-warning">'+(shortage?'手当が届かない月は、必要生活費が '+moneyText(shortage)+'不足する。':'手当が届かなくても、今の手持ちで翌月の必要生活費を払える。')+'</p>':shortage?'<p class="clarity-warning">翌月の必要生活費が '+moneyText(shortage)+'不足する。</p>':'')+(state.livingDebt?'<p class="clarity-warning">過去の生活費未払 '+moneyText(state.livingDebt)+'は別に返す。</p>':'')+'<details id="clarityLivingBreakdown"><summary>生活費・継続支出の内訳</summary>'+spendEffects([...breakdown,...extras])+'</details><details id="clarityForecastDetail"><summary>予測の詳しい説明</summary>'+spendEffects([['未払い込みの平均受取',moneyText(average)],['平均の差引',signedMoney(average*(1-rate)-living-optional)]])+'<p>平均受取＝支払予定×（1−未払い率）。届かない月の手当は0。送金は実際に受け取った手当の'+Math.round(rate*100)+'%。未受取の回収・追加仕事・臨時手当・店の配当・臨時支出は別。</p></details>';
};
const claritySpending=renderSpending;
renderSpending=function(...args){const opened=['clarityLivingBreakdown','clarityForecastDetail'].filter(id=>document.getElementById(id)?.open);claritySpending(...args);renderExpenseOverview();opened.forEach(id=>{const el=document.getElementById(id);if(el)el.open=true})};

const clarityCasinoRender=renderCasino;
renderCasino=function(){
 const s=state.casinoSession;if(!s||s.stage!=='betting'){clarityCasinoRender();return}
 const wasOpen=document.getElementById('clarityCasinoBorrow')?.open;
 // Reuse the existing game-switch action, including its dialog/time handling.
 clarityCasinoRender();const switchGame=document.getElementById('casinoChin').onclick,box=document.getElementById('casinoContent'),cash=holdCents(state.money),credit=casinoCredit(),allowed=casinoCreditAllowed();
 const seen=new Set(),offers=[{n:2000,label:'定額'},{n:10000,label:'定額'},...[.1,.25,.5].map(p=>({n:Math.floor(cash*p),label:'手持ちの'+Math.round(p*100)+'%'}))].filter(o=>{if(o.n<=0||o.n+Math.round(o.n*.05)>cash||seen.has(o.n))return false;seen.add(o.n);return true});
 const selected=s.budget>0,borrowed=!!s.creditOffer,fee=selected?Math.round(s.budget*.05):0;
 const condition=selected?'<div class="casino-entry-condition"><h3>今回の条件</h3>'+spendEffects([...(borrowed?[['卓用の借入',holdMoney(s.creditOffer)]]:[]),['持込み',holdMoney(s.budget)],['手数料（5%）',holdMoney(fee)],...(borrowed?[['最大の借金',holdMoney(Math.round(s.creditOffer*(1+casinoLoanRate(s.creditOffer))))],['手持ちからの支払い','US$0']]:[['支払う合計・最大損失',holdMoney(s.budget+fee)]])])+'<p>使わなかったチップは精算で返ります。追加購入なし。</p></div>':'<p class="casino-entry-hint">持込み額を選ぶと、手数料と最大損失を表示します。</p>';
 let borrowing;
 if(allowed)borrowing='<details id="clarityCasinoBorrow" '+(wasOpen||borrowed?'open':'')+'><summary>借りて遊ぶ</summary>'+casinoCreditPanel(s)+'</details>';
 else borrowing='<p class="casino-entry-unavailable">卓用の借入：'+(credit.outstanding>holdUnits(1)/2?'残債 '+moneyText(credit.outstanding)+'の完済が必要。':'')+(state.month<credit.nextMonth?'再借入まであと'+(credit.nextMonth-state.month)+'か月。':'')+'</p>';
 box.innerHTML='<p class="casino-entry-wallet">手持ち資金 <strong>'+holdMoney(cash)+'</strong></p><section class="casino-entry-section"><h3>1 · 遊ぶゲーム</h3><div class="casino-game-choice"><button type="button" class="secondary" aria-pressed="true">ホールデム</button><button type="button" class="secondary" id="casinoChin">ちんちろ</button></div></section><section class="casino-entry-section"><h3>2 · 卓に持ち込む額</h3><div class="casino-budget-grid">'+offers.map(o=>'<button type="button" class="secondary" data-casino-budget="'+o.n+'" aria-pressed="'+(!borrowed&&s.budget===o.n)+'"><strong>'+holdMoney(o.n)+'</strong><span>'+o.label+'</span></button>').join('')+'</div>'+(!offers.length?'<p>手持ちで参加できる額がありません。</p>':'')+'</section>'+borrowing+'<section class="casino-entry-section"><h3>3 · 条件を確認して開始</h3>'+condition+'<button type="button" class="primary casino-entry-start" id="casinoDeal" '+(!selected?'disabled':'')+'>この条件で席につく</button></section><details class="event-evidence"><summary>ホールデムのルール</summary><p>1対1。手札2枚と共通札5枚から最強の5枚を使います。新しい対局はノーリミットで、卓に持ち込んだ残り全額のオールインが可能。相手が応じられない超過分は返ります。</p><p>最低ベットはビッグブラインド、最低レイズ幅は直前の増額幅。ブラインドは持込みの約5%／10%。卓にいる間、人生の時間は進みません。</p></details>';
 document.getElementById('casinoChin').onclick=switchGame;document.getElementById('casinoDeal').onclick=holdStart;document.getElementById('closeCasino').disabled=false;
 box.querySelectorAll('[data-casino-budget]').forEach(button=>button.onclick=()=>{const amount=+button.dataset.casinoBudget;if(!offers.some(o=>o.n===amount))return;delete s.creditOffer;s.budget=amount;save();renderCasino();document.querySelector('#casinoContent [data-casino-budget="'+amount+'"]')?.focus({preventScroll:true})});
 box.querySelectorAll('[data-credit]').forEach(button=>{button.textContent=holdMoney(+button.dataset.credit);button.onclick=()=>casinoChooseLoan(+button.dataset.credit)});
};
