// Only these five events are revised. Keep monetary values and existing modifiers.
const FIRST_FIVE_CHOICE_VERSION=1;
function replaceFirstFiveEvent(id,change){const index=events.findIndex(e=>e.id===id);if(index<0)throw Error('Missing choice event: '+id);events[index]=change(events[index]);events[index].choiceQualityVersion=FIRST_FIVE_CHOICE_VERSION}
replaceFirstFiveEvent('new_face',old=>({...old,title:'新人が担当の仕事をつかめずにいる',text:'新人が仕事の割り振りを理解できず、困っている。あなたも今日中に担当の報告をまとめる必要がある。',options:[
 {title:'新人に説明する',desc:'説明を通して経験を積む。自分の作業が後に残り、気疲れする。',fx:{skill:2,stress:2}},
 {title:'自分の報告を先に終える',desc:'自分の担当を果たし、信用を積む。今回の相談は引き受けない。',fx:{rank:1}},
 ...old.options.filter(o=>o.role==='mentor').map(o=>({...o,title:'育成役として相談に乗る',desc:'教えてきた経験を使い、新人を支える。気疲れも伴う。'}))
]}));
replaceFirstFiveEvent('learning_offer',old=>({...old,text:'仲間に学び直しへ誘われた。講座なら短期間で学べるが、費用と勉強の負担がかかる。無料の教材なら少しずつ進められる。',options:old.options.filter(o=>o.title!=='今月は見送る').map(o=>o.title==='一緒に学ぶ'?{...o,title:'講座に参加する',desc:'受講費用を払い、より多くの経験を得る。勉強の疲れも残る。'}:{...o,desc:'出費なし。自分のペースで少しずつ経験を積む。'})}));
replaceFirstFiveEvent('poor_sleep',old=>({...old,text:'眠りが浅く、疲れが残っている。費用を使ってまとまった休みを取るか、今の予定のまま生活のリズムを整えるか。',options:old.options.filter(o=>o.title!=='今月はそのまま続ける').map(o=>o.title==='休みを取る'?{...o,title:'まとまった休みを取る',desc:'費用を使って体を休め、健康とストレスを回復する。'}:{...o,desc:'出費なし。大きく予定を変えず、ストレスを少し軽減する。'})}));
replaceFirstFiveEvent('family_pressure',old=>({...old,text:'家族から、無事な声を聞きたいと連絡が来た。会いに行けばゆっくり話せるが、交通費がかかる。',options:old.options.filter(o=>o.title!=='返事をしない').map(o=>({...o,desc:o.title==='会いに行く'?'交通費を払い、家族との関係とストレスを大きく改善する。':'出費なし。家族との関係とストレスを少し改善する。'}))}));
replaceFirstFiveEvent('friend_support',old=>({...old,calmMomentVersion:1}));
const firstFiveEligible=eventEligible;
eventEligible=function(e){
 if(e.id==='learning_offer'&&state.skill>=100)return false;
 if(e.id==='poor_sleep'&&state.health>=95&&state.stress<40)return false;
 if(e.id==='family_pressure'&&state.familyBond>=90&&state.stress<20&&state.familyNeedsIndex<35)return false;
 if(e.id==='friend_support'&&state.friendship>=100&&state.stress<=0&&state.suspicion<=0)return false;
 return firstFiveEligible(e);
};
function resolveFriendlyMoment(e){
 const token=state.month+':friend_support';state.currentEvent=null;
 if(state.lastFriendlyMoment===token)return;
 // Store the once-only marker with the applied outcome, before normal rendering.
 const before={friendship:state.friendship,stress:state.stress};
 apply(e.options[0].fx);state.lastFriendlyMoment=token;
 const detail=[['親友との関係',state.friendship-before.friendship],['ストレス',state.stress-before.stress]].filter(([,delta])=>delta!==0).map(([label,delta])=>label+' '+signed(delta)).join(' · ');
 addFeed('親友と近況を話した。役目の話から少し離れ、気持ちが軽くなった。','normal',detail,{calmMoment:true,eventId:e.id});
 // Use the same decision interval as the former chosen action. No extra event/month.
 state.nextDecisionMonth=state.month+2+Math.floor(Math.random()*3);
}
// Refresh only still-unanswered choices from their raw template, never transformed FX.
// A pending old friend-support choice remains manual; do not award it on page load.
if(state.phase==='game'&&['new_face','learning_offer','poor_sleep','family_pressure'].includes(state.currentEvent?.id)&&state.currentEvent.choiceQualityVersion!==FIRST_FIVE_CHOICE_VERSION){
 const template=events.find(e=>e.id===state.currentEvent.id),updated=personalizeEvent(template);
 if(updated.id===template.id){state.currentEvent=updated;const row=[...state.feed].reverse().find(f=>f.month===state.month&&f.type==='event'&&f.eventId===template.id);if(row)row.text=updated.title+'。'+updated.text;save()}
}
