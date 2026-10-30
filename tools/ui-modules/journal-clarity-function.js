function journalHTML(animate=true){
 const months=new Map();state.feed.forEach(f=>{if(!months.has(f.month))months.set(f.month,[]);months.get(f.month).push(f)});
 return [...months.entries()].map(([month,rows])=>{
  const actions=rows.filter(journalMoneyAction),routine=rows.filter(journalRoutineHobby),ordinaryRows=rows.filter(f=>!actions.includes(f)&&!routine.includes(f));
  const event=ordinaryRows.filter(f=>f.type==='event').at(-1),fallback=ordinaryRows.find(f=>f.type==='normal')||ordinaryRows.find(f=>f.type!=='world')||ordinaryRows[0];
  const current=month===state.month&&['game','custody','prison'].includes(state.phase)&&!!state.currentEvent,revealed=animate&&rows.some(f=>f.reveal),ledger=state.monthlyLedger?.[month];
  const outcomes=ordinaryRows.filter(f=>['choice','risk','end'].includes(f.type)||(f.type==='normal'&&/喫煙|禁煙|体調|悲しみ|役割|援助/.test(f.text)));
  const result=outcomes.filter(f=>event||f!==fallback).map(f=>'<small class="month-result '+((f.important||f.type==='risk'||/推薦.*通|後継争/.test(f.text))?((f.type==='risk'||/通らな|失敗|敗れ/.test(f.text))?'result-loss':'result-important'):'')+'">'+escapeHTML(f.text)+(f.detail?' · '+escapeHTML(f.detail):'')+'</small>').join('');
  const accounting=ledger?'<details class="month-ledger"><summary>収支の内訳</summary><p>受取 '+moneyText(ledger.income)+' · 家族への送金 '+moneyText(ledger.remittance||0)+' · 借金返済 '+moneyText(ledger.debtPayment||0)+' · 生活費支払 '+moneyText(ledger.paidLiving)+' · 手当の未受取 '+moneyText(ledger.payArrears)+' · 未払い生活費 '+moneyText(ledger.livingDebt)+'</p></details>':'';
  const hobbies=routine.length?'<details class="month-hobby-records"><summary>今月の趣味（'+routine.length+'件）</summary>'+routine.map(f=>'<p>'+escapeHTML(f.text)+(f.detail?' · '+escapeHTML(f.detail):'')+'</p>').join('')+'</details>':'';
  const text=(event?.text||fallback?.text||'').replace(/（\d+歳・[^）]*）$/,'');
  const main=(text||current||ledger||routine.length)?'<div class="feedrow '+(revealed?'reveal':'')+'" style="--delay:0s"><div class="feedage">'+ageText(month)+'</div><div class="feedtext">'+escapeHTML(text)+(!event&&fallback?.detail?'<small class="month-result">'+escapeHTML(fallback.detail)+'</small>':'')+result+accounting+hobbies+(current?'<button type="button" class="secondary reopen-decision">選択する</button>':'')+'</div></div>':'';
  return main+actions.map(f=>journalActionHTML(f,month)).join('');
 }).join('');
}
