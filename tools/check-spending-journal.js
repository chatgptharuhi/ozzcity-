{
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7);
function journalFixture(){fixture();state.money=dollarsToUnits(1000);state.personalDebt=0;state.livingDebt=0;state.casinoSession=null;state.diceSession=null;state.gamblingNet=0;state.earned=0;state.feed=[];state.currentEvent={id:'unchanged',options:[]};state.nextDecisionAt=123456;state.isPaused=true;document.getElementById('spendDialog').open=true;document.getElementById('feed').innerHTML='STALE';}
journalFixture();const m=state.month;addFeed('仲間に食事をごちそうした。','choice','手持ち資金 −US$32');let html=document.getElementById('feed').innerHTML;assert.ok(html.includes('ごちそう'));assert.ok(html.includes('−US$32'),'first outcome detail must be shown even without a normal event');assert.ok(!html.includes('feedrow reveal'));assert.equal(state.month,m);assert.equal(state.currentEvent.id,'unchanged');assert.equal(state.nextDecisionAt,123456);assert.equal(state.isPaused,true);assert.equal(state.feed.length,1);
// Actual cash Holdem settlement, not a manufactured feed entry.
journalFixture();casinoOpen();state.casinoSession.budget=2000;holdStart();if(!state.casinoSession.settled)holdSettle(0);assert.ok(document.getElementById('feed').innerHTML.includes('ホールデム'));assert.ok(document.getElementById('feed').innerHTML.includes('純損益'));const entries=state.feed.length;holdSettle(0);assert.equal(state.feed.length,entries);
// Actual cash chinchiro settlement and spending while a normal monthly event exists.
journalFixture();state.feed.push({month:state.month,text:'今月の出来事',type:'event'});state.diceSession={game:'chinchiro',origin:'casino',stage:'rolling',stake:dollarsToUnits(20),cashBefore:state.money,outcome:1,settled:false};tableSettle();html=document.getElementById('feed').innerHTML;assert.ok(html.includes('今月の出来事'));assert.ok(html.includes('ちんちろ'));assert.ok(html.includes('資産'));
// Closing the money dialog also restores stale journal display without a month tick.
journalFixture();addFeed('住宅を購入した。','choice','手持ち資金 −US$100');document.getElementById('feed').innerHTML='STALE';document.getElementById('closeSpending').onclick();assert.ok(!document.getElementById('spendDialog').open);assert.ok(document.getElementById('feed').innerHTML.includes('住宅を購入'));assert.equal(state.feed.length,1);
document.getElementById('spendDialog').open=false;
console.log('PASS: spending/cash Holdem/chinchiro journal refresh, first-outcome detail, close refresh, no duplicate entry, preserved decision/month/pause/deadline.');
}
