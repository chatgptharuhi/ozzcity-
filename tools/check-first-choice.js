{
fixture();state.month=1;state.occupationChosen=false;state.career=null;state.familyBond=50;const e=personalizeEvent(events.find(e=>e.id==='newcomer')),family=e.options.find(o=>o.title==='家族との約束を優先する');assert.equal(family.fx.familyBond,4);assert.ok(effectRows(family.fx).includes('家族との関係'));const before=state.rank;apply(family.fx);assert.equal(state.familyBond,54);assert.equal(state.rank,before);assert.equal(e.options.length,2);assert.equal(e.options[1].fx.rank,9);console.log('PASS: first choice preserves two short alternatives, family +4 and organization credit are separate.');
}
