{
const hidden=/((?:組織(?:内)?の不満|内部不満|内部の不満|疑念|義理|幹部の支持|幹部支持|所内のつながり|(?<!の)つながり|orgDiscontent|suspicion|obligation|prisonSupport|家族の資金負担指数|捜査の注目|対立の脅威|街の治安)\s*(?:[：:]|→)?\s*[＋+−-]?\s*\d)/;
function noHidden(html,label=''){const text=String(html).replace(/<[^>]*>/g,' ');assert.ok(!hidden.test(text),label+': '+text.match(hidden)?.[0])}
fixture();state.orgDiscontent=40;state.suspicion=25;state.obligation=20;state.prisonSupport=20;state.leadershipSupport=2;state.health=60;state.skill=20;state.stress=30;state.friendship=50;riskRates();ensureCareer();const snapshot=JSON.stringify(state),fx={rank:7.5,stress:4,skill:2,orgDiscontent:-2,suspicion:3,obligation:4,prisonSupport:3};const html=effectRows(fx);noHidden(html,'effect grid');assert.ok(html.includes('信用'));assert.ok(html.includes('ストレス'));assert.ok(html.includes('経験'));assert.ok(html.includes('組内の不満が和らぐ'));assert.ok(!html.includes('<span>組織の不満</span>'));assert.equal(JSON.stringify(state),snapshot,'preview changed simulation state');
for(const input of ['幹部の支持−1','幹部支持＋1','所内のつながり＋3','義理＋25','疑念＋8','内部不満→30','orgDiscontent -2','家族の資金負担指数は最大＋3','捜査の注目＋15','対立の脅威−10','街の治安＋8'])noHidden(hideInternalMetricNumbers(input),input);
assert.ok(!hideInternalMetricNumbers('家族の資金負担指数は最大＋3').includes('3'));assert.ok(hideInternalMetricNumbers('幹部の支持：2 / 3以上で後継候補').includes('不足'));assert.ok(hideInternalMetricNumbers('職務の露出：通常の40%').includes('軽減中'));assert.ok(!hideInternalMetricNumbers('所内の借り 3').includes('3'));
const preserve='US$300、成功35%、失敗65%、信用−3、健康＋10、経験＋2、ストレス−6、親友との関係−20、6か月';assert.equal(hideInternalMetricNumbers(preserve),preserve);
const metadata=exactMetadata({sponsorDebt:true,fx:{}});noHidden(metadata);assert.ok(metadata.includes('借金'));
state.career.stage=2;state.career.months=36;state.career.total=84;state.rank=110;state.leadershipSupport=1;noHidden(careerRequirementsText(),'requirements');assert.ok(careerRequirementsText().includes('後押し'));noHidden(promotionOutcomeHTML(),'promotion');assert.ok(!promotionOutcomeHTML().includes('見込みの内訳'));
// Scan every authored option in multiple character states, including hidden-only choices.
let scanned=0;for(const stage of [0,2,3]){state.career.stage=stage;state.rank=[20,100,140][stage===0?0:stage===2?1:2];state.skill=50;state.orgDiscontent=60;for(const e of events){state.currentEvent=e;for(let i=0;i<e.options.length;i++){noHidden(optionHTML(e.options[i],i),e.id);scanned++}}}
for(const kind of ['meet','protection','visit','transfer','bribe','favour']){const e=prisonIncident(kind);if(e?.options)for(let i=0;i<e.options.length;i++)noHidden(optionHTML(e.options[i],i),'prison '+kind)}
// Old journal rows stay unchanged in storage, while displayed numbers are hidden.
state.feed=[{month:state.month,text:'待遇の話が出た。',type:'event'},{month:state.month,text:'説明を求めた。',type:'choice',detail:'組織の不満 −2 · 疑念 ＋3 · 信用 +5'}];const stored=JSON.stringify(state.feed);noHidden(journalHTML(),'old journal');assert.equal(JSON.stringify(state.feed),stored);assert.ok(journalHTML().includes('信用 +5'));
const before=state.orgDiscontent;apply({orgDiscontent:-2});assert.equal(state.orgDiscontent,before-2,'internal effects must still apply');
// Text-only cleanup must keep existing elements and click handlers intact.
let clicked=false;const text={nodeType:3,textContent:'幹部の支持−1'},button={nodeType:1,childNodes:[],onclick:()=>{clicked=true}},root={childNodes:[text,button]};cleanMetricTextNodes(root);button.onclick();assert.ok(clicked);assert.equal(root.childNodes[1],button);assert.ok(!text.textContent.includes('−1'));
console.log('PASS: hidden-stat values absent from '+scanned+' authored option previews, prison/promotion/metadata/old journals; visible amounts/probabilities/durations preserved; preview/state/effects and DOM handlers unchanged.');
}
