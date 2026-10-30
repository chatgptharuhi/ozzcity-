// Executed only in the audit VM. No real browser or save.
{
const data={experience:[],stress:[],health:[]},oldRandom=Math.random;
function metricFixture(){fixture();state.month=24;state.career.stage=1;state.career.months=24;state.career.total=36;state.rank=75;state.leadershipSupport=2;state.probationMonths=0;state.suspicion=0;state.orgDiscontent=0;state.familyBond=50;state.partner='none';state.smoking=0;state.smokeMonths=0;state.protectionPlans={guard:false,medical:false};state.protectionThrough={guard:-1,medical:-1}}
for(const skill of [0,10,25,50,75,100]){metricFixture();state.skill=skill;data.experience.push({value:skill,promotionPercent:Math.round(promotionChance()*100),experienceFactor:promotionFactors().find(([name])=>name==='積んだ経験')?.[1],careerReady:careerRequirements()?.ready})}
for(const stress of [0,26,50,70,90,100]){metricFixture();state.stress=stress;state.health=80;const chance=Math.round(promotionChance()*100),factor=promotionFactors().find(([name])=>name==='疲労')?.[1];Math.random=()=>.99;advanceWellbeing();data.stress.push({value:stress,promotionPercent:chance,fatigueFactor:factor,quarterlyHealthChange:state.health-80})}
for(const health of [15,29,50,80,100]){metricFixture();state.health=health;state.stress=26;advanceWellbeing();data.health.push({value:health,wellbeingHealthChange:state.health-health,phase:state.phase})}
metricFixture();state.month=1;state.occupationChosen=false;state.career=null;const newcomer=personalizeEvent(events.find(e=>e.id==='newcomer'));data.firstChoices=newcomer.options.map(o=>({title:o.title,effects:o.fx}));
metricFixture();state.health=50;state.pendingAfterAttack={damage:31,insured:false};data.afterAttack=afterAttackEvent().options.map(o=>({title:o.title,costUSD:Math.round((o.cost||0)*MXN_PER_UNIT/MXN_PER_USD),effects:o.fx}));
data.notes=['Experience and stress affect actual promotion formulas; scenarios hold other attributes fixed.','Low health by itself currently does not trigger a recurring major-illness system.','Immediate-effect dominance needs narrative and future-effect review before changing choices.'];
if(typeof HOBBIES!=='undefined')data.hobbies={catalogue:HOBBIES.length,offersPerLife:4,slots:3,feesUSD:{minimum:Math.min(...HOBBIES.map(h=>h.monthly)),maximum:Math.max(...HOBBIES.map(h=>h.monthly))},casinoExpectedNetUSD:.015*1000+.10*100-100,lotteryExpectedNetUSD:.000001*1000000+.03*25-15,jackpotChancePerPaidMonth:.000001,ordinaryRelationshipGain:false};
Math.random=oldRandom;console.log('DAILY_METRICS:'+JSON.stringify(data));
}
