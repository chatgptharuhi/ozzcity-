// Local deterministic simulation. No browser, network, API, or real saved game access.
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto'),assert=require('assert/strict');
const args=process.argv.slice(2),value=(key,fallback)=>{const i=args.indexOf(key);return i>=0?args[i+1]:fallback};
const game=path.resolve(value('--game',path.join(__dirname,'..','outputs','odds-city.html')));
const output=path.resolve(value('--out',path.join(__dirname,'audit-results')));
const lives=Math.max(5,Math.min(2000,Number(value('--lives','100'))));
const seedBase=Number(value('--seed','20261029'))>>>0;
const html=fs.readFileSync(game,'utf8'),hash=crypto.createHash('sha256').update(html).digest('hex');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const nodes=new Map();function node(id){if(!nodes.has(id))nodes.set(id,{id,value:'',innerHTML:'',textContent:'',hidden:false,disabled:false,open:false,dataset:{},classList:{add(){},remove(){},toggle(){}},setAttribute(){},addEventListener(){},showModal(){this.open=true},close(){this.open=false},querySelectorAll(){return[]},scrollTo(){},scrollIntoView(){}});return nodes.get(id)}
let seed=seedBase;const math=Object.create(Math);math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const ctx=vm.createContext({Math:math,Date,console,assert,document:{hidden:false,getElementById:node,querySelectorAll(){return[]}},window:{matchMedia(){return{matches:true}}},localStorage:{getItem(){return null},setItem(){}},setTimeout(){return 1},clearTimeout(){},confirm(){return false},resetSeed(n){seed=n>>>0}});
const population=path.join(path.dirname(game),'mexico-population.js');
if(fs.existsSync(population))vm.runInContext(fs.readFileSync(population,'utf8'),ctx);
vm.runInContext(script,ctx,{timeout:15000});
const checks=[];
// Use the real resolver and real preview renderer. The fresh fixture never touches user storage.
vm.runInContext(`
render=()=>{};renderStats=()=>{};renderDice=()=>{};save=()=>{};journalBusy=false;
function fixture(){state={...initial,phase:'game',feed:[],monthlyLedger:{},organization:{...ORGANIZATIONS[1]},occupation:'farm',occupationChosen:true,career:{job:'farm',stage:0,months:12,total:12,reviewAfter:0,version:1},rank:30,skill:10,stress:20,careerHistory:[]}}
fixture();const pYoung=promotionChance();state.age=40;assert.ok(promotionChance()>pYoung,'age changes promotion odds');
fixture();const pBase=promotionChance();state.skill=80;state.rank=100;state.leadershipSupport=3;assert.ok(promotionChance()>pBase,'prior experience, credit and support matter');
state.suspicion=90;state.orgDiscontent=90;state.stress=90;assert.ok(promotionChance()<.55,'adverse history lowers odds');
assert.equal(exactPercent(.607),'61');assert.equal(exactPercent(.003),'1未満');
fixture();const modernCareer=typeof personalBudget==='function';if(modernCareer){state.career.stage=1;state.career.months=24;state.career.total=36;state.rank=75;}const careerBefore=JSON.stringify(state.career),rankBefore=state.rank;const realRandom=Math.random;Math.random=()=>.999;resolveContextChoice(careerReviewEvent(),{careerReview:true,careerTarget:state.career.stage+1});Math.random=realRandom;
assert.equal(state.rank,rankBefore-9);assert.equal(state.stress,26);assert.equal(state.career.stage,modernCareer?1:0);assert.equal(state.career.reviewAfter,state.month+(modernCareer?6:18));assert.ok(state.feed.at(-1).important&&state.feed.at(-1).type==='risk');
fixture();Math.random=()=>0;resolveContextChoice(careerReviewEvent(),{careerReview:true,careerTarget:1});Math.random=realRandom;assert.equal(state.career.stage,1);assert.equal(state.career.months,0);assert.equal(state.career.total,12);
fixture();assert.ok(!effectRows({health:2}).includes('健康'),'zero health effect hidden at cap');assert.ok(!effectRows({heat:6,threat:4}).includes('捜査の注目'),'raw risk input hidden');
`,ctx,{timeout:15000});
checks.push('Promotion reacts to age/history; integer odds; real success/failure resolver; cooldown and highlighted result; zero effects and raw risk inputs hidden.');
const focusedChecks=args.includes('--extra-checks')?[path.resolve(value('--extra-checks',''))]:[...(script.includes('function leaveActive()')?['check-prison-leave.js']:[]),...(script.includes('function holdStart()')?['check-risk-casino.js']:[]),...(script.includes('function personalBudget()')?['check-career-spending.js']:[]),...(script.includes('function resolvePrisonWager(')?['check-paid-risk-prison.js']:[]),...(script.includes('function custodySeatChance(')?['check-custody-career.js']:[]),...(script.includes('function rolePayBase(')?['check-role-based-pay.js']:[]),...(script.includes('function richLife(')?['check-spending-lifestyle.js']:[])].map(name=>path.join(__dirname,name)).filter(file=>fs.existsSync(file));
for(const file of focusedChecks)vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{timeout:20000});
if(focusedChecks.length)checks.push('Additional focused regression checks passed.');
if(args.includes('--checks-only')){console.log(checks.join('\n'));process.exit(0)}
vm.runInContext(`if(typeof compactDecision==='function'){
 const snapshot=state;
 for(const role of ['support','mediator','mentor'])for(const rank of [0,60,120]){
  fixture();state.role=role;state.rank=rank;state.age=30;
  for(const e of events){if(!eventEligible(e))continue;const p=personalizeEvent(e);if(!['senior_table','occupation_offer'].includes(p.id))assert.ok(p.options.length<=3,'Too many ordinary choices: '+p.id);assert.ok(p.options.length>0,'Empty menu: '+p.id)}
 }
 state=snapshot;
}`,ctx,{timeout:15000});
if(args.includes('--catalog')){console.log(vm.runInContext("JSON.stringify(events.filter(e=>!e.id.startsWith('var_')&&e.options.length>3).map(e=>({id:e.id,title:e.title,options:e.options.map(o=>o.title)})))",ctx));process.exit(0)}
ctx.auditLives=lives;ctx.auditSeed=seedBase;
vm.runInContext(`
const profiles={survival:{money:.02,rank:.3,health:3,stress:-1,heat:-3,threat:-3,skill:.4,safety:2,familyBond:.2,friendship:.2,partnerBond:.2},career:{money:.01,rank:3,health:1,stress:-.3,heat:-.3,threat:-.3,skill:2,safety:.3,familyBond:.1,friendship:.1,partnerBond:.1},money:{money:.5,rank:.3,health:1,stress:-.2,heat:-.6,threat:-.6,skill:.1,safety:.5},ties:{money:.01,rank:.3,health:1,stress:-.8,heat:-1,threat:-1,skill:.3,safety:.5,familyBond:3,friendship:3,partnerBond:3}};
const flags=new Map(),choices=new Map(),results=[],errors=[];
function dollars(n){return n*MXN_PER_UNIT/MXN_PER_USD}
function plain(o){return Object.keys(o).every(k=>['title','desc','fx','credit','minAge','minRank','minSkill','role'].includes(k))}
function vector(o){const v={};for(const[k,x]of Object.entries(o.fx||{})){if(typeof state[k]!=='number')continue;const after=k==='money'?Math.max(0,state[k]+x):clamp(state[k]+x,k==='rank'?149:100);v[k]=(after-state[k])*(['heat','threat','stress','suspicion','orgDiscontent','obligation','smoking','familyNeedsIndex'].includes(k)?-1:1);if(k==='money')v.debt=-Math.max(0,-state.money-x)}return v}
function flag(e,type,pair){const k=e.id+':'+type;let f=flags.get(k);if(!f){f={event:e.id,title:e.title,type,occurrences:0,example:pair};flags.set(k,f)}f.occurrences++}
function inspect(e){const opts=e.options;if(opts.length<2)return;for(let a=0;a<opts.length;a++)for(let b=a+1;b<opts.length;b++){if(!plain(opts[a])||!plain(opts[b]))continue;const av=vector(opts[a]),bv=vector(opts[b]),keys=[...new Set([...Object.keys(av),...Object.keys(bv)])];const delta=keys.map(k=>(av[k]||0)-(bv[k]||0));if(delta.every(x=>Math.abs(x)<1e-8))flag(e,'same-immediate-effects',[opts[a].title,opts[b].title]);else if(delta.every(x=>x>=0)||delta.every(x=>x<=0))flag(e,'one-option-dominates-immediate-effects',[opts[a].title,opts[b].title]);}}
function score(o,profile){const w=profiles[profile];let s=0;for(const[k,x]of Object.entries(o.fx||{})){const actual=typeof state[k]==='number'?(k==='money'?Math.max(0,state[k]+x)-state[k]:clamp(state[k]+x,k==='rank'?149:100)-state[k]):0;s+=(w[k]||0)*(k==='money'?dollars(actual):actual)}s-=dollars(o.cost||0)*(w.money||0);
 if(o.temperament)s+=['negotiate','daring','steady','explore'].indexOf(o.temperament)===state.auditLife%4?100:0;
 if(o.careerAssign)s+=40+(o.occupationChange===(CAREER_ENTRY[state.temperament]||[])[state.auditLife%3]?10:0);
 if(o.careerReview)s+=profile==='career'?35:profile==='survival'?-5:2;
 if(o.careerAsk)s-=15;
 if(o.bossBid)s+=profile==='career'?100:profile==='money'?15:-10;
 if(o.supportGain)s+=profile==='career'?15:2;
 if(o.promotionAttempt)s+=profile==='career'?20:0;
 if(o.gambleStart)s+=profile==='money'?10:-100;if(o.gambleDecline)s+=profile==='money'?-5:10;
 if(o.contractKind||o.pressureJob||o.transferMode)s-=profile==='money'?5:50;
 if(o.legalExit)s-=100;
 if(o.legalAction==='hearing')s+=o.releaseChance*100;
 if(o.legalAction==='study')s+=profile==='career'?15:1;
 if(o.legalAction==='rest')s+=state.health<70?40:0;
 if(o.legalAction==='contact')s+=profile==='ties'?20:2;
 if(o.legalAction==='work')s+=profile==='money'?12:0;
 if(o.legalAction==='corrupt_release')s-=100;
 if(o.aftermath==='care')s+=state.health<75?50:0;
 if(o.aftermath==='retaliate')s-=50;
 return s;
}
function invariant(){for(const k of ['money','rank','health','stress','skill','month','personalDebt','livingDebt'])if(!Number.isFinite(state[k]))throw Error('Non-finite '+k);if(state.money<0||state.personalDebt<0||state.livingDebt<0)throw Error('Negative cash/debt');if(state.career&&state.career.stage>3)throw Error('Invalid career stage')}
for(const profile of Object.keys(profiles))for(let life=0;life<auditLives;life++){
 const lifeSeed=(auditSeed+life*7919)>>>0;resetSeed(lifeSeed);
 state={...initial,phase:'game',feed:[],monthlyLedger:{},careerHistory:[],auditLife:life,protectionPlans:{guard:false,medical:false},protectionThrough:{guard:-1,medical:-1}};state.region=pickRegion();state.birthplace=pickBirthplace(state.region);state.organization={...ORGANIZATIONS[Math.floor(Math.random()*ORGANIZATIONS.length)]};initializeFamilySupport();
 const row={profile,seed:lifeSeed,organization:state.organization.label,snapshots:{},boss:false,maxStage:-1,reviews:0,promotions:0,decisions:0,steps:0};
 try{
 prepareMonth();
 while(state.phase!=='end'&&state.month<=361&&row.steps++<1200){
  journalBusy=false;
  if(state.boss)row.boss=true;row.maxStage=Math.max(row.maxStage,state.career?.stage??-1);
  for(const year of [1,5,10])if(state.month>=year*12+1&&!row.snapshots[year])row.snapshots[year]={cash:Math.round(dollars(state.money)),debt:Math.round(dollars(debtTotal())),phase:state.phase,stage:state.career?.stage??null};
  if(state.diceSession){const s=state.diceSession;if(s.stage==='betting'){s.game='chinchiro';s.stake=dollarsToUnits(20);if(state.money<s.stake+diceFee(s.stake)){finishDice();continue}tableCommit()}while(s.outcome===undefined&&s.playerRolls?.length<3)tableChinRoll();tableSettle();finishDice();invariant();continue}
  if(!state.currentEvent){finishMonth();invariant();continue}
  const e=state.currentEvent;inspect(e);const affordable=e.options.map((o,i)=>({o,i})).filter(({o})=>!o.cost||o.cost<=state.money);if(!affordable.length)throw Error('No affordable choice at '+e.id);
  const best=affordable.map(x=>({...x,score:score(x.o,profile)})).sort((a,b)=>b.score-a.score||a.i-b.i)[0];
  const key=e.id+'|'+best.o.title;choices.set(key,(choices.get(key)||0)+1);row.decisions++;const oldStage=state.career?.stage;if(best.o.careerReview)row.reviews++;choose(best.i);if(best.o.careerReview&&state.career?.stage>oldStage)row.promotions++;invariant();
 }
 if(row.steps>=1200)throw Error('Step limit: '+state.currentEvent?.id);
 row.end=state.phase==='end'?state.endReason:'observation-limit';row.age=ageLabel();row.month=state.month;row.cash=Math.round(dollars(state.money));row.debt=Math.round(dollars(debtTotal()));row.boss ||=state.boss;
 }catch(error){row.error=String(error.message);errors.push({profile,seed:lifeSeed,event:state.currentEvent?.id,error:row.error})}
 results.push(row);
}
function median(a){a=a.slice().sort((a,b)=>a-b);return a.length?a[Math.floor(a.length/2)]:null}
const summary=Object.keys(profiles).map(profile=>{const runs=results.filter(x=>x.profile===profile);return{profile,lives:runs.length,bosses:runs.filter(x=>x.boss).length,reviews:runs.reduce((s,x)=>s+x.reviews,0),promotions:runs.reduce((s,x)=>s+x.promotions,0),cadres:runs.filter(x=>x.maxStage===3).length,errors:runs.filter(x=>x.error).length,medianObservedEndAge:median(runs.map(x=>x.age).filter(Number.isFinite)),year1Reached:runs.filter(x=>x.snapshots[1]).length,year1MedianCash:median(runs.filter(x=>x.snapshots[1]).map(x=>x.snapshots[1].cash)),year5Reached:runs.filter(x=>x.snapshots[5]).length,year5MedianCash:median(runs.filter(x=>x.snapshots[5]).map(x=>x.snapshots[5].cash)),ends:runs.reduce((a,x)=>(a[x.end||'error']=(a[x.end||'error']||0)+1,a),{})}});
globalThis.auditReport={summary,errors,flags:[...flags.values()].sort((a,b)=>b.occurrences-a.occurrences),choices:[...choices].map(([choice,count])=>({choice,count})).sort((a,b)=>b.count-a.count),runs:results};
`,ctx,{timeout:180000});
const report=JSON.parse(JSON.stringify(ctx.auditReport));
Object.assign(report,{createdAt:new Date().toISOString(),source:game,sourceHash:hash,seedBase,livesPerPolicy:lives,checks,limits:['State-machine simulation with stub DOM: no browser appearance, timing, or actual saved games tested.','Policies are simple heuristics, not human reasoning or calibrated optimal strategies.','Dominance and equivalence flags examine immediate numeric effects only; narrative/future consequences need human review.','Year-specific cash medians include only runs reaching that year; survivor counts are included.','Boss percentages from these policies are simulation results, not real-world success rates.']});
fs.mkdirSync(output,{recursive:true});
const previousFile=path.join(output,'latest.json');const previous=fs.existsSync(previousFile)?JSON.parse(fs.readFileSync(previousFile,'utf8')):null;
report.changedSource=previous?.sourceHash!==hash;
report.newErrors=report.errors.filter(x=>!previous?.errors?.some(y=>y.error===x.error&&y.event===x.event));
fs.writeFileSync(previousFile,JSON.stringify(report,null,2));
const lines=['# オッズシティ 周回検証',report.createdAt,'',...checks,'',...report.summary.map(s=>JSON.stringify(s)),'','## 即時効果だけを見た要確認候補',...report.flags.slice(0,12).map(f=>'- '+f.title+'：'+f.type+'／'+f.occurrences+'回。'+f.example.join(' ↔ ')),'','## エラー',...report.errors.slice(0,5).map(x=>JSON.stringify(x)),'','## 検証の限界',...report.limits.map(s=>'- '+s)];
fs.writeFileSync(path.join(output,'summary.md'),lines.join('\n'));
console.log(JSON.stringify({sourceHash:hash.slice(0,12),totalRuns:report.runs.length,summary:report.summary,errors:report.errors.slice(0,3),topFlags:report.flags.slice(0,5),report:path.join(output,'summary.md')}));
if(report.errors.length)process.exitCode=1;
