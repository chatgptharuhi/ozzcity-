// Apply to raw templates once. Never transform an already displayed choice or change a saved wallet.
function economyCashOption(option,dollars){const o={...option,fx:{...option.fx},moneyIsFixed:true};delete o.fx.money;delete o.cost;delete o.choiceCashCost;if(dollars){o.cost=dollarsToUnits(dollars);o.choiceCashCost=o.cost}return o}
function economyEvent(id,change){const e=events.find(e=>e.id===id);if(e)change(e)}
function economyPrice(id,index,dollars){economyEvent(id,e=>{if(e.options[index])e.options[index]=economyCashOption(e.options[index],dollars)})}
economyPrice('learning_offer',0,120);
economyEvent('learning_offer',e=>{const eligible=e.when;e.when=s=>(!eligible||eligible(s))&&s.skill<96});
economyPrice('poor_sleep',0,60);
economyEvent('poor_sleep',e=>{e.text='疲れが残っている。休日に費用を使って休むか、普段の生活のリズムを整えるか。';e.options[0].title='休日に休む環境を整える';e.options[0].desc='費用を払い、健康とストレスを回復する。通常の勤務は続ける。'});
economyPrice('body_check',0,100);economyPrice('smoke_habit',1,75);economyPrice('family_pressure',0,80);
economyPrice('arrested_friend',0,300);
economyEvent('arrested_friend',e=>{e.options[0].desc='弁護費用の一部を援助する。釈放を保証する支払いではない。'});
economyPrice('community',0,150);
economyEvent('community',e=>{e.options[0].desc='自分の取り分から援助し、街の緊張を和らげる。'});
economyPrice('police',1,0);economyPrice('hideout',0,0);economyPrice('fraud',0,0);
economyEvent('fraud',e=>{e.options[0].desc='費用なし。相談先を探す時間を使う。';e.options[0].fx.stress=2});
economyEvent('share',e=>{e.title='臨時の手当の使い道を決める';e.text='US$150の臨時手当が出る。親友は今月の生活費が足りないと話していた。';e.options=[{title:'全額を手元に残す',desc:'自分の暮らしと備えに回す。',fx:{money:dollarsToUnits(150)},moneyIsFixed:true},{title:'親友にUS$100を分ける',desc:'自分にはUS$50が残る。',fx:{money:dollarsToUnits(50),friendship:5,stress:-2},moneyIsFixed:true}]});
economyPrice('partner_time',0,45);economyPrice('partner_meet',0,25);economyPrice('partner_future',0,180);
economyEvent('family',e=>{e.text='家族から今月の生活費が足りないと連絡が来た。自分の暮らしも維持しながら、援助するか決める。';e.options[0]=economyCashOption({...e.options[0],desc:'生活費を援助し、家族との関係を支える。',fx:{familyBond:6,familyNeedsIndex:-10}},150);e.options[0].choiceFamilyAmount=dollarsToUnits(150);e.options[1]={title:'今月は援助できないと伝える',desc:'出費なし。家族の不足は残る。',fx:{stress:2}}});
economyEvent('small_reward',e=>{e.text='上役からUS$35の謝礼を受け取った。貯めるか、身近な人と分けるか。';e.options=[{title:'全額を貯める',desc:'手持ちに残す。',fx:{money:dollarsToUnits(35)},moneyIsFixed:true},{title:'親友と食事する',desc:'謝礼から食事代US$25を払い、残りを手元に残す。',fx:{money:dollarsToUnits(10),friendship:3,stress:-4},moneyIsFixed:true},{title:'家族にUS$30を送る',desc:'残りUS$5は手元に残す。',fx:{money:dollarsToUnits(5),familyBond:4,familyNeedsIndex:-3},choiceFamilyAmount:dollarsToUnits(30),moneyIsFixed:true}]});
economyEvent('old_friend',e=>{e.options=e.options.filter(o=>o.title!=='短い挨拶で別れる');e.options=e.options.map(o=>o.title==='また会う約束をする'?economyCashOption({...o,desc:'別の日に食事する約束をし、今回その費用を確保する。'},25):o)});
economyEvent('crew_loss',e=>{e.options=e.options.filter(o=>o.title!=='一人で静かに過ごす');e.options[0]={title:'仲間と静かに過ごす',desc:'役目から少し離れ、気持ちを整理する。',fx:{stress:-5}}});
economyEvent('credit_dispute',e=>{e.options=e.options.filter(o=>o.title!=='何も言わない')});
economyEvent('family_boundary',e=>{e.options=e.options.filter(o=>o.title!=='返事を後回しにする')});
economyPrice('leadership_test',0,100);economyPrice('leadership_test',1,40);
economyEvent('leadership_test',e=>{e.options[0].fx.skill=3;e.options[0].maxSkill=95});
economyPrice('grief_after',0,100);
const ECONOMY_THEME_COSTS={housing:[[120,80,150,100],[0,35,0,0]],family_requests:[[100,80,150,35],[0,0,0,0]],partner_routine:[[45,0,80,40],[0,0,0,0]],friend_boundaries:[[50,25,0,0],[0,0,0,0]],education:[[120,100,120,90],[0,0,0,0]],paperwork:[[15,20,25,0],[0,0,0,0]],grief:[[0,100,0,0],[0,0,0,0]],fatigue:[[60,100,0,40],[0,0,0,0]],recovery:[[120,90,180,100],[0,0,0,0]],debt_budget:[[60,50,40,20],[0,0,0,0]],ordinary_future:[[100,75,120,0],[0,0,0,0]],community_life:[[45,100,80,35],[0,0,0,0]],reward_fairness:[[25,35,45,40],[0,0,0,0]]};
for(const [theme,costs]of Object.entries(ECONOMY_THEME_COSTS))for(let i=0;i<4;i++)economyEvent('var_'+theme+'_'+i,e=>{e.options=e.options.map((o,n)=>economyCashOption(o,costs[n][i]));if(theme==='family_requests'&&[0,2].includes(i)){e.options[0].choiceFamilyAmount=dollarsToUnits(costs[0][i]);e.options[0].fx.familyNeedsIndex=-6}});
for(let i=0;i<4;i++)economyEvent('var_education_'+i,e=>{const eligible=e.when;e.when=s=>(!eligible||eligible(s))&&s.skill<96});
for(const theme of ['facility_life','kitchen_shared'])for(let i=0;i<4;i++)economyEvent('var_'+theme+'_'+i,e=>{e.options=e.options.map(o=>economyCashOption(o,0));if(theme==='facility_life'){e.text+=' 必要な経費は組織に申請する。';e.options[0].title=['改善を業者に依頼する','別の場所の利用を申請する','清掃を依頼する','日用品の補充を申請する'][i];delete e.options[0].fx.safety;e.options[0].fx.stress=-2}else{e.options[0].title=['食費の追加予算を申請する','負担を減らす予算を申請する','必要な買い物を申請する','皆で食べる場を用意する'][i];delete e.options[0].fx.familyBond;e.options[0].fx.stress=-2}});
for(let i=0;i<4;i++)economyEvent('var_repair_duties_'+i,e=>{e.options=e.options.map(o=>({...o,fx:{...o.fx},moneyIsFixed:true}));e.options[0].fx.money=dollarsToUnits([80,100,0,70][i]);e.options[1]=economyCashOption(e.options[1],0);if(i===0){e.text+=' 専門家の確認費は組織が負担する。'}if(i===3){e.options[1].title='組織の支援を相談し、外部に頼む'}});
for(let i=0;i<4;i++)economyEvent('var_care_peers_'+i,e=>{e.options[0]=economyCashOption(e.options[0],[35,0,80,0][i]);delete e.options[1].fx.health;e.options[1].fx.skill=2;if(i===3)e.options[0].title='補助の人員を上役に求める'});
for(const theme of ['leadership_daily','senior_choices'])for(let i=0;i<4;i++)economyEvent('var_'+theme+'_'+i,e=>{e.options=e.options.map(o=>economyCashOption(o,0));if(theme==='senior_choices'&&i===2)e.options[0]=economyCashOption(e.options[0],45)});
economyEvent('work_accounts_0',e=>{e.options[0].fx.stress=1});
