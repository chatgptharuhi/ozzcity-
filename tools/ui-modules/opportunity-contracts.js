// Fictional paid opportunities; no operational criminal methods.
const OPPORTUNITIES=[
 {key:'shopHelp',id:'opportunity_shop_help',level:1,title:'知人の店の繁忙期を手伝う',text:'店主から休日の応援を頼まれた。合法の短期仕事だが、休む時間は減る。',reward:150,success:.90,failure:.10,injury:0,arrest:0,death:0,stress:5,credit:0,healthLoss:0,pressure:0,months:0,cooldown:6,minStage:0},
 {key:'homeRepair',id:'opportunity_home_repair',level:2,title:'共同住居の改修をまとめる',text:'業者と住民の希望が食い違っている。組織が工事代を負担し、調整を終えた場合に謝礼を出す。',reward:500,success:.80,failure:.20,injury:0,arrest:0,death:0,stress:8,credit:1,healthLoss:0,pressure:0,months:0,cooldown:12,minStage:1},
 {key:'shopRebuild',id:'opportunity_shop_rebuild',level:3,title:'組織が出資する店の立て直しを任される',text:'赤字と従業員の対立を抱えた店から相談が来た。出資者である組織への捜査に巻き込まれる危険もある。事業費は依頼側が出す。',reward:1500,success:.65,failure:.25,injury:.08,arrest:.02,death:0,stress:10,credit:2,healthLoss:18,pressure:4,months:3,cooldown:18,minStage:1},
 {key:'districtReopen',id:'opportunity_district_reopen',level:4,title:'対立が続く地区の事業再開を引き受ける',text:'閉まった事業を再開したいという。地区の対立は収まらず、前任者も負傷している。必要な事業費は依頼側が負担する。',reward:5000,success:.50,failure:.30,injury:.15,arrest:.05,death:0,stress:14,credit:3,healthLoss:25,pressure:10,months:6,cooldown:24,minStage:2},
 {key:'majorRebuild',id:'large_case',level:5,title:'幹部から大規模事業の再建を託される',text:'複数の責任者と上役の利害がぶつかる大きな仕事だ。必要な資金は組織が出すが、あなた自身も捜査や暴力に巻き込まれ得る。',reward:15000,success:.40,failure:.30,injury:.16,arrest:.12,death:.02,stress:18,credit:5,healthLoss:35,pressure:18,months:9,cooldown:36,minStage:3}
];
for(const job of OPPORTUNITIES){
 JOBS[job.key]={...job,opportunity:true};
 const template=ordinary(job.id,job.title,job.text,[
  ['条件を確認して引き受ける','成功した場合だけ報酬。結果と仕事の負担は下記。',{},{contractKind:job.key}],
  ['断る','この依頼による出費・信用低下・危険の追加なし。',{}]
 ],{theme:'paid_opportunity',weight:2,when:s=>s.phase==='game'&&!leaveActive()&&!s.lightDuty&&s.month>=3&&(s.boss||((s.career?.stage||0)>=job.minStage))&&s.month>=Math.max(s.contractCooldown||0,s.opportunityAfter?.[job.key]||0)});
 const index=events.findIndex(e=>e.id===job.id);if(index<0)events.push(template);else events[index]=template;
}
// Retire old offers, retaining their definitions/resolvers for already displayed choices.
for(const id of ['dangerous_contract','lethal_contract','debt_relief_work','debt_front_work']){const e=events.find(e=>e.id===id);if(e)e.when=()=>false}
function opportunityHTML(j){
 const stress=clamp(state.stress+j.stress)-state.stress,injury=Math.min(state.health,j.healthLoss),credit=exactCredit(j.credit*1.5);
 const outcomes=[['成功',j.success,'報酬 '+moneyText(dollarsToUnits(j.reward))+(j.credit?'、信用'+signed(credit):'')],['報酬なしで終了',j.failure,'報酬0、追加の処分なし'],['負傷',j.injury,'報酬0、健康−'+injury],['逮捕',j.arrest,'報酬0、審理へ'],['死亡',j.death,'この人生は終了']].filter(([,p])=>p>0);
 return '<div class="contract-breakdown"><b>難度 '+j.level+'/5 · 結果はいずれか一つ</b><ul>'+outcomes.map(([name,p,result])=>'<li>'+name+' '+Math.round(p*100)+'%：'+result+'</li>').join('')+'</ul><p>引受時：ストレス＋'+stress+'。'+(j.pressure?'捜査による月間摘発確率を最大'+(j.pressure*.03).toFixed(2)+'ポイント追加、'+j.months+'か月継続。':'この依頼による摘発・死亡の追加判定なし。')+'</p><p>自己資金の持出しなし。同じ案件の再依頼は引受後'+j.cooldown+'か月以上先。通常の給与・月末の危険判定は別。</p></div>';
}
function resolveOpportunityContract(j){
 // A displayed offer stays valid across role changes; only the accepted-job lock is checked.
 if(state.month<(state.contractCooldown||0)||state.month<(state.opportunityAfter?.[j.key]||0))return;
 state.opportunityAfter={...state.opportunityAfter,[j.key]:state.month+j.cooldown};state.contractCooldown=state.month+3;
 state.arrestPressure=Math.min(100,state.arrestPressure+j.pressure);state.arrestPressureMonths=Math.max(state.arrestPressureMonths,j.months);
 apply({stress:j.stress});const roll=Math.random();
 if(roll<j.success){const before=state.money,beforeRank=state.rank;apply({money:dollarsToUnits(j.reward),rank:j.credit*1.5});const paid=state.money-before;state.earned+=paid;addFeed(j.title+'を終え、報酬を受け取った。','choice','受取 '+moneyText(paid)+(j.credit?' · 信用 '+rankChange(state.rank-beforeRank):'')+(paid<dollarsToUnits(j.reward)?'。保有資金の上限に達した。':''));return}
 if(roll<j.success+j.failure){addFeed(j.title+'はまとまらず、報酬を得られなかった。','choice','報酬0。引受時の負担は残るが、この失敗による処分はない。');return}
 if(roll<j.success+j.failure+j.injury){apply({health:-j.healthLoss});addFeed('案件の混乱に巻き込まれ、負傷した。','risk','報酬0 · 健康−'+j.healthLoss);if(state.health<=0){state.phase='end';state.endReason='health';addFeed('負傷により、活動を続けられなくなった。','end')}return}
 if(roll<j.success+j.failure+j.injury+j.arrest){addFeed('案件に関わる捜査で身柄を拘束された。','risk','報酬0。審理へ進む。');beginCustody(j.level===5?'large':'ordinary');return}
 state.phase='end';state.endReason='violent_job';addFeed('案件をめぐる暴力に巻き込まれ、命を失った。','end','報酬0。');
}
// Correct only the misleading quote in an old unresolved case. Keep its original rules.
if(state.currentEvent?.id==='large_case'&&!state.currentEvent.options?.[0]?.contractKind){
 state.currentEvent.options[0].desc=state.currentEvent.options[0].desc.replaceAll('US$100,000','US$10,000');save();
}
