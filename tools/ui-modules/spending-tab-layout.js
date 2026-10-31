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
