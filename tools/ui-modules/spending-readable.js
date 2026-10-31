// UI only. Reuse live DOM nodes so existing purchase handlers remain attached.
function selectSpendingTab(key){
 const dialog=document.getElementById('spendDialog'),allowed=['use','risk','living','debt','forecast'];
 if(!allowed.includes(key))key='use';
 dialog.dataset.spendingTab=key;
 dialog.querySelectorAll('[data-spending-pane]').forEach(el=>{el.hidden=el.dataset.spendingPane!==key});
 dialog.querySelectorAll('[data-spending-tab]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.spendingTab===key)));
 const body=dialog.querySelector('.spend-body');if(body)body.scrollTop=0;
}
function setupReadableSpending(){
 const dialog=document.getElementById('spendDialog');
 if(dialog.querySelector('.spend-body'))return;
 const get=id=>document.getElementById(id);
 // Retain references before moving nodes into detached layout containers.
 const refs=Object.fromEntries(['spendSummary','spendMessage','personalPurchases','hobbyOptions','essentialBudgetOptions','protectionOptions','workRiskActions','openRiskOptions','leaveOptions','expenseOverview','entrustedFunds'].map(id=>[id,get(id)]));
 const top=dialog.querySelector('.decision-top'),remittance=get('remittanceRates').closest('section'),casino=get('openCasino').closest('section'),repayment=get('repayDollars').closest('section');
 const header=document.createElement('div'),body=document.createElement('div'),nav=document.createElement('nav');
 header.className='spend-header';body.className='spend-body';nav.className='spend-tabs';nav.setAttribute('aria-label','お金の管理の項目');
 header.append(top,refs.spendSummary,refs.spendMessage);
 for(const [key,label]of [['use','使う'],['risk','対策'],['living','生活費'],['debt','返済'],['forecast','収支']]){const button=document.createElement('button');button.type='button';button.dataset.spendingTab=key;button.textContent=label;button.onclick=()=>selectSpendingTab(key);nav.append(button)}
 header.append(nav);
 function pane(key,id,label,nodes){const el=document.createElement('div'),heading=document.createElement('h3');el.id=id;el.className='spending-pane';el.dataset.spendingPane=key;heading.textContent=label;el.append(heading,...nodes);body.append(el)}
 pane('use','spendUseGroup','暮らしと楽しみに使う',[refs.personalPurchases,refs.hobbyOptions,casino]);
 pane('risk','spendRiskGroup','身を守る・働き方を変える',[refs.protectionOptions,refs.workRiskActions,refs.leaveOptions]);
 pane('living','spendMonthlyGroup','毎月の生活費・家族への送金',[refs.essentialBudgetOptions,remittance]);
 pane('debt','spendDebtGroup','借金を返す',[repayment]);
 pane('forecast','spendForecastGroup','翌月の収支',[refs.expenseOverview]);
 // Keep the legacy entry available to existing handlers without showing a duplicate.
 refs.openRiskOptions.hidden=true;body.append(refs.openRiskOptions,refs.entrustedFunds);
 dialog.querySelectorAll(':scope>.expense-group-title').forEach(el=>el.remove());
 dialog.append(header,body);casino.classList.add('spend-card');remittance.classList.add('spend-card');repayment.classList.add('spend-card');
 selectSpendingTab(dialog.dataset.spendingTab||'use');
}

function readableSpendingDetailKey(el){const scope=el.closest('[id]');return el.id||((scope?.id||'spending')+':'+(el.querySelector(':scope>summary')?.textContent||''))}
const readablePreviousSpending=renderSpending;
renderSpending=function(...args){
 const dialog=document.getElementById('spendDialog'),scroller=dialog.querySelector('.spend-body')||dialog,scroll=scroller.scrollTop,focused=document.activeElement;
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
  // Keep cost below the heading, in reading order. Never recalculate or omit a fee.
  const list=card.querySelector(':scope>.spend-effects'),term=list&&[...list.children].find(el=>el.tagName==='DT'&&el.textContent==='資金');
  if(term&&term.nextElementSibling?.tagName==='DD'){
   const value=term.nextElementSibling,price=document.createElement('div');price.className='spend-price';price.setAttribute('aria-label','費用');
   for(const part of value.textContent.split(/[／。]|(?=家賃 月)|(?=維持 月)/).filter(s=>s.trim())){const line=document.createElement('span');line.textContent=part;price.append(line)}
   const heading=card.querySelector(':scope>h4,:scope>h3,:scope>b');if(heading)heading.after(price);else card.prepend(price);term.remove();value.remove();
  }
 }
 for(const card of dialog.querySelectorAll('#hobbyOptions article')){
  const facts=card.querySelector(':scope>p');if(!facts)continue;
  const parts=facts.textContent.split(' · ');if(parts.length<4)continue;
  const price=document.createElement('div');price.className='spend-price';price.setAttribute('aria-label','費用');
  for(const part of parts.splice(0,2)){const line=document.createElement('span');line.textContent=part;price.append(line)}
  const heading=card.querySelector(':scope>h4,:scope>h3,:scope>b');if(heading)heading.after(price);else card.prepend(price);facts.textContent=parts.join(' · ');
 }
 for(const detail of dialog.querySelectorAll('details')){if(detail===outer)continue;const key=readableSpendingDetailKey(detail);if(opened.has(key))detail.open=opened.get(key)}
 // Restore keyboard position when an action redraws its card.
 if(!focused?.isConnected&&focusId){document.getElementById(focusId)?.focus({preventScroll:true})}else if(!focused?.isConnected&&focusData.length){
  const replacement=[...dialog.querySelectorAll('button')].find(b=>focusData.every(([k,v])=>b.dataset[k]===v));replacement?.focus({preventScroll:true});
 }
 (dialog.querySelector('.spend-body')||dialog).scrollTop=scroll;
};
