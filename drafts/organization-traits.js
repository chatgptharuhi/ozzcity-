// Fictional organization cultures: generated once per named group and saved per life.
const ORGANIZATION_TRAIT_LABELS={leader:{protective:'部下の面倒を見る',pragmatic:'働きに応じて扱う',harsh:'部下を使い潰す'},promotion:{merit:'実績重視',patronage:'後ろ盾重視'},relations:{quiet:'周辺と比較的平穏',neutral:'周辺と距離を保つ',tense:'周辺と緊張'},business:{casino:'賭場中心',farm:'農園中心',logistics:'運転・連絡の仕事が多い',local:'地域の施設を抱える'},cohesion:{united:'内部の結束が強い',mixed:'派閥が拮抗',divided:'内部の派閥争い'}};
function attachOrganizationProfile(org){
 if(!org)return org;const registry=state.organizationProfiles||(state.organizationProfiles={});
 if(!registry[org.name]){const traits=org.traits?{...org.traits}:Object.fromEntries(Object.entries(ORGANIZATION_TRAIT_LABELS).map(([key,values])=>{const keys=Object.keys(values);return [key,keys[Math.floor(Math.random()*keys.length)]]}));registry[org.name]={traits,lastChange:state.month||1,checkedMonth:-1}}
 return {...org,traits:{...registry[org.name].traits}};
}
function currentOrganizationTraits(){return state.organization?.traits||null}
function organizationReputation(org=state.organization){return org?.traits?Object.entries(ORGANIZATION_TRAIT_LABELS).map(([key,labels])=>labels[org.traits[key]]||'').filter(Boolean).join('。')+'。':''}
function organizationWarChance(){const t=currentOrganizationTraits();return t?.relations==='quiet'?.02:t?.relations==='tense'?.055:.035}
function organizationPromotionModifiers(){const t=currentOrganizationTraits();if(!t)return [];const c=ensureCareer(),merit=Math.min(6,Math.floor(state.skill/8)+Math.floor((c?.total||0)/24));return [['組の昇進慣習',t.promotion==='merit'?merit:Math.max(-6,Math.min(6,(state.leadershipSupport||0)*3-6))],['組の結束',t.cohesion==='united'?2:t.cohesion==='divided'?-3:0]]}
const traitsPromotionFactors=promotionFactors;
promotionFactors=function(){return [...traitsPromotionFactors(),...organizationPromotionModifiers()]};
const traitsReleaseAidQuote=releaseAidQuote;
releaseAidQuote=function(aid){const quote=traitsReleaseAidQuote(aid),t=currentOrganizationTraits();if(!quote||!t)return quote;return {...quote,chance:Math.max(15,Math.min(90,quote.chance+(t.leader==='protective'?10:t.leader==='harsh'?-10:0)+(t.cohesion==='united'?5:t.cohesion==='divided'?-5:0)))}};
const ORGANIZATION_JOBS={casino:{negotiate:['accounts','liaison'],daring:['casino_guard'],steady:['casino_accounts'],explore:['driver','liaison']},farm:{negotiate:['liaison'],daring:['lookout','driver'],steady:['farm'],explore:['driver']},logistics:{negotiate:['liaison','accounts'],daring:['driver','lookout'],steady:['accounts'],explore:['driver','attendant']},local:{negotiate:['attendant'],daring:['lookout'],steady:['facility','repair'],explore:['liaison']}};
const traitsCareerCandidates=careerCandidates;
careerCandidates=function(){const original=traitsCareerCandidates(),t=currentOrganizationTraits();if(!t)return original;const preferred=(ORGANIZATION_JOBS[t.business]?.[state.temperament||'steady']||[]).filter(id=>CAREERS[id]&&(!state.occupationChosen||id!==state.occupation));return [...new Set([...preferred,...original])].slice(0,3)};
const traitsEventWeight=eventWeight;
eventWeight=function(e){const base=traitsEventWeight(e),t=currentOrganizationTraits();if(!t||!['org_unrest','org_split','betrayal_offer'].includes(e.id))return base;return Math.max(1,Math.min(10,base+(t.cohesion==='divided'?3:t.cohesion==='united'?-1:0)))};
const traitsPersonalizeEvent=personalizeEvent;
personalizeEvent=function(e){const result=traitsPersonalizeEvent(e);if(result.targetOrganization)result.targetOrganization=attachOrganizationProfile(result.targetOrganization);return result};
const traitsMoveOrganization=moveOrganization;
moveOrganization=function(target,secret){traitsMoveOrganization(attachOrganizationProfile(target),secret);addFeed('新しい組織の評判を聞いた。','normal',organizationReputation())};
const traitsTransferIncomeHTML=transferIncomeHTML;
transferIncomeHTML=function(option){const html=traitsTransferIncomeHTML(option),target=state.currentEvent?.targetOrganization;return html+(target?.traits?'<p>移籍先の評判：'+escapeHTML(organizationReputation(target))+'</p>':'')};
const traitsOccupationOffer=occupationOffer;
occupationOffer=function(){const event=traitsOccupationOffer();if(currentOrganizationTraits())event.text+=' 気質と、この組で多い仕事から紹介されている。';return event};
const traitsRenderStats=renderStats;
renderStats=function(){traitsRenderStats();const t=currentOrganizationTraits();if(!t)return;document.getElementById('lifeDetails').innerHTML+='<p>組の評判：'+escapeHTML(organizationReputation())+'</p><p>昇進は'+(t.promotion==='merit'?'経験・実働が評価されやすい':'後ろ盾が薄いと通りにくい')+'。出所支援は'+(t.leader==='protective'?'手厚い':t.leader==='harsh'?'薄い':'標準')+'。'+(t.relations==='tense'?'周辺との抗争が起きやすい。':t.relations==='quiet'?'周辺との抗争は比較的起きにくい。':'')+'評判は情勢で変わることがある。</p>'};
const traitsFinishOriginReveal=finishOriginReveal;
finishOriginReveal=function(){traitsFinishOriginReveal();if(currentOrganizationTraits())document.getElementById('originGroup').textContent+='。'+organizationReputation()};
function advanceOrganizationCulture(){
 const t=currentOrganizationTraits(),entry=state.organizationProfiles?.[state.organization?.name];if(!t||!entry||state.phase!=='game'||entry.checkedMonth===state.month)return;
 entry.checkedMonth=state.month;if(state.month-entry.lastChange<36||Math.random()>=.006)return;
 const axes=state.boss?['relations','cohesion']:['leader','relations','cohesion'],axis=axes[Math.floor(Math.random()*axes.length)],keys=Object.keys(ORGANIZATION_TRAIT_LABELS[axis]).filter(key=>key!==t[axis]),value=keys[Math.floor(Math.random()*keys.length)],before=ORGANIZATION_TRAIT_LABELS[axis][t[axis]];
 entry.traits={...entry.traits,[axis]:value};entry.lastChange=state.month;state.organization={...state.organization,traits:{...entry.traits}};
 addFeed(axis==='leader'?'上役が替わり、部下への扱いが変わった。':axis==='relations'?'周辺組織との関係が変わった。':'組織内の力関係が変わった。','choice',before+' → '+ORGANIZATION_TRAIT_LABELS[axis][value]);
}
const traitsSettleMonth=settleMonth;
settleMonth=function(){traitsSettleMonth();advanceOrganizationCulture()};
// Add fields to old lives without changing money, career, current choices or table sessions.
if(state.organization){state.organization=attachOrganizationProfile(state.organization);if(state.currentEvent?.targetOrganization)state.currentEvent.targetOrganization=attachOrganizationProfile(state.currentEvent.targetOrganization);save()}
