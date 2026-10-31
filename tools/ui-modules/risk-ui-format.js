function monthlyRiskPercent(n){return n>0&&n<1?'1%未満':n<100&&n>99?'99%超':Math.round(n)+'%'}
function riskChangeValue(before,after){
 const a=monthlyRiskPercent(before),b=monthlyRiskPercent(after);
 if(Math.abs(before-after)<1e-9)return '';
 return a===b?(after<before?'少し下がる':'少し上がる')+'（月 '+b+'）':'月 '+a+' → '+b;
}
function riskTransition(before,after){
 return [['摘発',before.arrest,after.arrest],['襲撃',before.assassination,after.assassination]].map(([label,a,b])=>{const text=riskChangeValue(a,b);return text?label+'：'+text:''}).filter(Boolean).join('／')||'発生率は変わらない';
}
function riskActionCard(title,price,effect,details,button){
 return '<article class="risk-action-card"><h4>'+title+'</h4><p class="risk-action-price">'+price+'</p><p class="risk-action-effect">'+effect+'</p>'+(details?'<details><summary>条件・詳細</summary>'+details+'</details>':'')+button+'</article>';
}
