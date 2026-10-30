// UI only. Reuse live DOM nodes so existing purchase handlers remain attached.
function setupReadableSpending(){
 const dialog=document.getElementById('spendDialog');
 if(dialog.querySelector('.spend-body'))return;
 const get=id=>document.getElementById(id),header=document.createElement('div'),body=document.createElement('div');
 header.className='spend-header';body.className='spend-body';
 const remittance=get('remittanceRates').closest('section'),casino=get('openCasino').closest('section'),repayment=get('repayDollars').closest('section');
 header.append(dialog.querySelector('.decision-top'),get('spendSummary'),get('spendMessage'));
 const title=document.createElement('h3');title.textContent='暮らしと楽しみに使う';body.append(title,get('personalPurchases'),get('hobbyOptions'),casino);
 casino.classList.add('spend-card');
 function fold(id,label,nodes){const detail=document.createElement('details'),summary=document.createElement('summary');detail.id=id;detail.className='spend-fold';summary.textContent=label;detail.append(summary,...nodes);body.append(detail)}
 fold('spendMonthlyGroup','毎月の生活費・家族への送金',[get('essentialBudgetOptions'),remittance]);
 fold('spendRiskGroup','仕事の負担・危険への対策',[get('workRiskActions'),get('openRiskOptions'),get('protectionOptions'),get('leaveOptions')]);
 fold('spendDebtGroup','借金を返す',[repayment]);
 fold('spendForecastGroup','翌月の収支を確認する',[get('expenseOverview')]);
 dialog.querySelectorAll(':scope>.expense-group-title').forEach(el=>el.remove());
 // This legacy element is kept for older renderers, which still address its ID.
 body.append(get('entrustedFunds'));
 dialog.append(header,body);remittance.classList.add('spend-card');repayment.classList.add('spend-card');
}
function readableSpendingDetailKey(el){const scope=el.closest('[id]');return el.id||((scope?.id||'spending')+':'+(el.querySelector(':scope>summary')?.textContent||''))}
const readablePreviousSpending=renderSpending;
renderSpending=function(...args){
 const dialog=document.getElementById('spendDialog'),scroll=dialog.scrollTop,focused=document.activeElement;
 const focusId=dialog.contains(focused)?focused.id:'',focusData=dialog.contains(focused)?Object.entries(focused.dataset).filter(([k])=>k!=='readableCard'):[];
 const opened=new Map([...dialog.querySelectorAll('details')].map(el=>[readableSpendingDetailKey(el),el.open]));
 readablePreviousSpending(...args);
 setupReadableSpending();
 const personal=document.getElementById('personalPurchases');
 // The outer lifestyle heading is now represented by the section heading above.
 const outer=personal.querySelector(':scope>details');if(outer)outer.open=true;
 for(const section of [...personal.querySelectorAll('section')]){
  const heading=section.querySelector(':scope>h4');if(!heading)continue;
  const separate=document.createElement('section');let node=heading;
  while(node){const next=node.nextSibling;separate.append(node);node=next}
  section.after(separate);
 }
 const cards=[...personal.querySelectorAll('section')].filter(el=>!el.querySelector('article'));
 cards.push(...dialog.querySelectorAll('#personalPurchases article,#hobbyOptions article,#workRiskActions article,#protectionOptions article'),document.getElementById('essentialBudgetOptions'),document.getElementById('leaveOptions'));
 for(const card of cards){
  card.classList.add('spend-card');
  // Put the existing cost text at the right; never recalculate or omit a fee.
  const list=card.querySelector(':scope>.spend-effects'),term=list&&[...list.children].find(el=>el.tagName==='DT'&&el.textContent==='資金');
  if(term&&term.nextElementSibling?.tagName==='DD'){
   const value=term.nextElementSibling,price=document.createElement('div');price.className='spend-price';price.setAttribute('aria-label','費用');
   for(const part of value.textContent.split('／')){const line=document.createElement('span');line.textContent=part;price.append(line)}
   card.prepend(price);term.remove();value.remove();
  }
 }
 for(const card of dialog.querySelectorAll('#hobbyOptions article')){
  const facts=card.querySelector(':scope>p');if(!facts)continue;
  const parts=facts.textContent.split(' · ');if(parts.length<4)continue;
  const price=document.createElement('div');price.className='spend-price';price.setAttribute('aria-label','費用');
  for(const part of parts.splice(0,2)){const line=document.createElement('span');line.textContent=part;price.append(line)}
  card.prepend(price);facts.textContent=parts.join(' · ');
 }
 for(const detail of dialog.querySelectorAll('details')){if(detail===outer)continue;const key=readableSpendingDetailKey(detail);if(opened.has(key))detail.open=opened.get(key)}
 // Restore keyboard position when an action redraws its card.
 if(!focused?.isConnected&&focusId){document.getElementById(focusId)?.focus({preventScroll:true})}else if(!focused?.isConnected&&focusData.length){
  const replacement=[...dialog.querySelectorAll('button')].find(b=>focusData.every(([k,v])=>b.dataset[k]===v));replacement?.focus({preventScroll:true});
 }
 dialog.scrollTop=scroll;
};
