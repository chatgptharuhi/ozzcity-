// Executed only in the audit VM, using fresh test lives and in-memory storage.
const savedRandomForChecks=Math.random;
function prisonFixture(){fixture();state.protectionPlans={guard:false,medical:false};state.protectionThrough={guard:-1,medical:-1};state.phase='prison';state.sentenceMonths=24;state.custodyElapsed=3;state.money=dollarsToUnits(5000);state.prisonStory=null;state.prisonLastActivity=null;prisonStory().nextAt=999;state.nextDecisionAt=0;state.isPaused=false;if(typeof custodyCareer==='function')custodyCareer();}
Math.random=()=>.99;
prisonFixture();preparePrison();assert.equal(state.currentEvent.options.filter(o=>PRISON_ACTIVITIES[o.legalAction]).length,6);
choose(state.currentEvent.options.findIndex(o=>o.legalAction==='study'));
const repeatChoiceCount=typeof fastForwardPrison==='function'?3:2;
assert.equal(state.prisonLastActivity,'study');assert.equal(state.custodyElapsed,6);assert.equal(state.sentenceMonths,21);assert.equal(state.currentEvent.options.length,repeatChoiceCount);
const navSnapshot=JSON.stringify([state.month,state.sentenceMonths,state.money,state.skill,state.health,state.custodyElapsed]);
choose(1);assert.equal(state.currentEvent.prisonView,'change');assert.equal(JSON.stringify([state.month,state.sentenceMonths,state.money,state.skill,state.health,state.custodyElapsed]),navSnapshot);
choose(state.currentEvent.options.findIndex(o=>o.prisonNav==='repeat'));assert.equal(state.currentEvent.options.length,repeatChoiceCount);assert.equal(JSON.stringify([state.month,state.sentenceMonths,state.money,state.skill,state.health,state.custodyElapsed]),navSnapshot);
state=JSON.parse(JSON.stringify(state));preparePrison();assert.equal(state.currentEvent.options[0].legalAction,'study');choose(0);assert.equal(state.custodyElapsed,9);assert.equal(state.sentenceMonths,18);
for(const kind of ['meet','unrest','protection','favour','bribe','visit','transfer']){
 prisonFixture();const s=prisonStory();s.met=true;s.favours=2;s.pending=kind;
 prisonMenu();const selected=state.currentEvent.options[0],beforeMonth=state.month,beforeSentence=state.sentenceMonths,beforeMoney=state.money;
 state=JSON.parse(JSON.stringify(state));Math.random=()=>{throw Error('Saved incident rerolled on reopen')};prisonMenu();assert.equal(state.currentEvent.prisonIncidentKind,kind);
 Math.random=()=>.99;resolvePrisonIncident(state.currentEvent.options[0]);assert.equal(state.month,beforeMonth);assert.equal(state.sentenceMonths,beforeSentence);assert.equal(state.money,beforeMoney-(selected.cost||0));assert.equal(prisonStory().pending,null);
 const paid=state.money;resolvePrisonIncident(selected);assert.equal(state.money,paid,'incident must settle once');
}
prisonFixture();prisonStory().pending='unrest';state.health=5;prisonMenu();Math.random=()=>0;resolvePrisonIncident(state.currentEvent.options[0]);assert.equal(state.phase,'end');assert.equal(state.health,0);
// A checked quarter cannot draw a fresh episode, including after serialization.
prisonFixture();prisonStory().checked=state.custodyStartMonth+':'+state.custodyElapsed;Math.random=()=>{throw Error('Same quarter drew again')};preparePrison();state=JSON.parse(JSON.stringify(state));preparePrison();
function leaveFixture(){fixture();state.month=20;state.money=dollarsToUnits(10000);state.payArrears=50;state.protectionPlans={guard:false,medical:false};state.protectionThrough={guard:-1,medical:-1};state.leaveStartMonth=0;state.leaveEndMonth=0;state.workRiskFactor=1;state.arrestPressure=20;state.arrestPressureMonths=6;state.currentEvent=null;state.careerRequest=false;state.nextDecisionMonth=100;state.nextDecisionAt=0;state.isPaused=false;if(typeof custodyCareer==='function')custodyCareer();}
Math.random=()=>.99;leaveFixture();renderLeave();document.getElementById('buyLeave').onclick();assert.equal(state.money,dollarsToUnits(8000));assert.equal(state.leaveStartMonth,21);assert.equal(state.leaveEndMonth,24);document.getElementById('buyLeave').onclick();assert.equal(state.money,dollarsToUnits(8000));assert.equal(state.workRiskFactor,1,'paying cannot instantly lower danger');
state.month=21;const services=state.serviceMonths,careerMonths=state.career.months,earnedBeforeLeave=state.earned,oldArrears=state.payArrears;
for(let i=0;i<3;i++){assert.ok(leaveActive());finishMonth();assert.equal(state.monthlyLedger[21+i].income,0);assert.equal(state.monthlyLedger[21+i].remittance,0)}
assert.equal(state.month,24);assert.ok(!leaveActive());assert.equal(state.serviceMonths,services);assert.equal(state.career.months,careerMonths);assert.equal(state.earned,earnedBeforeLeave);assert.equal(state.payArrears,oldArrears);assert.equal(state.workRiskFactor,.4);assert.ok(state.money<dollarsToUnits(8000));
const lowFactor=state.workRiskFactor,rested=arrestComponents(),restedRisk=riskRates();state.workRiskFactor=1;const exposed=arrestComponents(),exposedRisk=riskRates();assert.ok(rested.work<exposed.work);assert.equal(rested.investigation,exposed.investigation);assert.equal(rested.contract,exposed.contract);assert.ok(restedRisk.arrest<exposedRisk.arrest);assert.equal(restedRisk.assassination,exposedRisk.assassination);
state.workRiskFactor=lowFactor;settleMonth();assert.equal(state.career.months,careerMonths+1);assert.equal(state.workRiskFactor,.5);
leaveFixture();state.money=dollarsToUnits(1999);renderLeave();const poorCash=state.money;document.getElementById('buyLeave').onclick();assert.equal(state.money,poorCash);assert.equal(state.leaveEndMonth,0);
leaveFixture();renderLeave();document.getElementById('buyLeave').onclick();const paidCash=state.money;beginCustody();assert.equal(state.leaveEndMonth,state.month);assert.equal(state.money,paidCash);
Math.random=savedRandomForChecks;
console.log('PASS: prison repeat/change/reload, no time or money on navigation, every episode and idempotent settlement, fatal injury, paid leave timing/no salary/no career/no arrears recovery, retained investigation/contract/violence risk, return to work, custody cancellation.');

