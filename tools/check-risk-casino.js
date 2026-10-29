// Focused checks in the isolated audit VM, never the actual browser save.
const riskCasinoRandom=Math.random;
function riskFixture(){fixture();state.protectionPlans={guard:false,medical:false};state.protectionThrough={guard:-1,medical:-1};state.riskStory=null;state.lightDuty=false;state.workRiskFactor=1;state.casinoSession=null;state.casinoDealer=0;state.money=dollarsToUnits(1000);state.nextDecisionMonth=100;state.nextDecisionAt=0;state.heat=60;state.threat=60;state.safety=50;state.leadershipSupport=2;state.careerHistory=[];state.careerRequest=false;}
riskFixture();state.rank=147;state.career.stage=0;const juniorRisk=riskRates();state.career.stage=3;const seniorRisk=riskRates();assert.ok(seniorRisk.arrest>juniorRisk.arrest);assert.ok(seniorRisk.assassination>juniorRisk.assassination);
riskFixture();const payNormal=payBase(state.rank,state.organization),riskNormal=riskRates();resolveContextChoice(riskQuestEvent('light'),{riskAction:'light',fx:{}});assert.equal(state.lightDuty,true);assert.equal(payBase(state.rank,state.organization),payNormal*.8);assert.ok(riskRates().arrest<riskNormal.arrest);assert.equal(careerRequirements().ready,false);
const serviceLight=state.serviceMonths,careerLight=state.career.months;Math.random=()=>.99;settleMonth();assert.equal(state.serviceMonths,serviceLight);assert.equal(state.career.months,careerLight);
riskFixture();const threatBefore=state.threat;resolveContextChoice(riskQuestEvent('reconcile'),{riskAction:'reconcile',fx:{rank:-7.5}});assert.ok(riskStory().reconcile);state.month+=3;const returnedQuest=personalizeEvent(events.find(e=>e.id==='quiet_month'));assert.equal(returnedQuest.options[0].riskAction,'peace');resolveContextChoice(returnedQuest,returnedQuest.options[0]);assert.equal(state.threat,threatBefore-20);assert.equal(riskStory().peaceUntil,state.month+24);
riskFixture();riskStory().war={stage:1,pending:true,nextAt:state.month+6,stance:'neutral',extended:false,enemy:'隣接地区の組織'};let we=warEvent();resolveContextChoice(we,we.options[1]);assert.ok(riskStory().factionExposure>0);state.month+=3;Math.random=()=>0;advanceWar();assert.equal(riskStory().war.stage,2);assert.ok(riskStory().war.pending);we=warEvent();resolveContextChoice(we,we.options[2]);const distantRisk=riskRates();riskStory().war.stance='front';assert.ok(riskRates().assassination>distantRisk.assassination);state.month+=3;advanceWar();assert.equal(riskStory().war.stage,3);we=warEvent();resolveContextChoice(we,we.options[0]);assert.equal(riskStory().war.stage,0);
const hc=(v,s=0)=>s*13+v-2;
assert.equal(holdemBest([hc(14),hc(2,1),hc(3,2),hc(4,3),hc(5),hc(9,1),hc(10,2)])[0],4);
assert.deepEqual(Array.from(holdemBest([hc(14),hc(14,1),hc(14,2),hc(13),hc(13,1),hc(13,2),hc(2)])),[6,14,13]);
assert.deepEqual(Array.from(holdemBest([hc(9),hc(9,1),hc(9,2),hc(9,3),hc(14),hc(5),hc(2)])),[7,9,14]);
// Opponent decisions must not inspect the player's cards or undealt cards.
riskFixture();state.casinoSession={settled:false};const noPeek={opponent:[hc(14),hc(13)],board:[],stacks:[100,100],street:[1,2],target:2,raises:0,big:2,round:0};Object.defineProperty(noPeek,'player',{get(){throw Error('Opponent read player cards')}});Object.defineProperty(noPeek,'deck',{get(){throw Error('Opponent read future cards')}});holdOpponentAction(noPeek);
Math.random=riskCasinoRandom;
let showdowns=0,folds=0;
for(let hand=0;hand<300;hand++){
 resetSeed(70000+hand);riskFixture();state.casinoDealer=hand%2;state.month=25;state.currentEvent={id:'preserved_decision',options:[]};const month=state.month,eventBefore=JSON.stringify(state.currentEvent),cashBefore=state.money;
 casinoOpen();state.casinoSession.budget=[2000,10000,3,99,237,1][hand%6];holdStart();
 let steps=0;
 while(state.casinoSession.stage==='playing'){
  assert.ok(++steps<100,'Holdem did not terminate');const h=state.casinoSession.h;
  assert.equal(h.stacks[0]+h.stacks[1]+h.total[0]+h.total[1],state.casinoSession.budget*2);
  assert.ok(h.stacks.every(v=>Number.isInteger(v)&&v>=0));assert.equal(h.turn,0);
  const serial=JSON.stringify(h);state=JSON.parse(JSON.stringify(state));holdPump();assert.equal(JSON.stringify(state.casinoSession.h),serial,'reload changed a player turn');
  const legal=holdLegal(state.casinoSession.h,0);const mode=hand%4;const action=mode===0?'fold':mode===1?(legal.includes('raise')?'raise':legal.includes('bet')?'bet':legal[0]):legal[0];holdPlayer(action);
 }
 const s=state.casinoSession,h=s.h;assert.ok(s.settled);const used=[...h.player,...h.opponent,...h.board,...h.burned,...h.deck];assert.equal(used.length,52);assert.equal(new Set(used).size,52);
 const net=s.winner===0?h.total[1]-s.fee:s.winner===1?-h.total[0]-s.fee:-s.fee;
 assert.equal(holdCents(state.money-cashBefore),net||0);assert.equal(state.month,month);assert.equal(JSON.stringify(state.currentEvent),eventBefore);
 if(s.reason==='showdown')showdowns++;else folds++;
 const settledCash=state.money;holdSettle(s.winner,s.reason);assert.equal(state.money,settledCash);state=JSON.parse(JSON.stringify(state));holdSettle(s.winner,s.reason);assert.equal(state.money,settledCash);
 casinoLeave();assert.equal(state.casinoSession,null);assert.equal(state.month,month);assert.equal(JSON.stringify(state.currentEvent),eventBefore);
}
assert.ok(showdowns>0&&folds>0);
// The board alone can win for both players; no compulsory use of private cards.
riskFixture();casinoOpen();state.casinoSession.budget=10000;holdStart();const tie=state.casinoSession;tie.h.player=[hc(2,1),hc(3,2)];tie.h.opponent=[hc(4,1),hc(5,2)];tie.h.board=[hc(10),hc(11),hc(12),hc(13),hc(14)];tie.h.stacks=[9000,9000];tie.h.total=[1000,1000];tie.h.street=[1000,1000];tie.settled=false;tie.stage='playing';holdShowdown();assert.equal(tie.winner,-1);assert.equal(holdCents(tie.net),-tie.fee);
riskFixture();state.money=holdUnits(2099);casinoOpen();state.casinoSession.budget=2000;holdStart();assert.equal(state.casinoSession.stage,'betting');assert.equal(holdCents(state.money),2099);
Math.random=riskCasinoRandom;
console.log('PASS: authority-based risks, light-duty pay/experience, reconciliation and war; Holdem rankings, no hidden-card access, 300 hands across positions/cents/all-ins, card uniqueness, reload, folds/ties/settlement once, insufficient funds, preserved life decision.');
