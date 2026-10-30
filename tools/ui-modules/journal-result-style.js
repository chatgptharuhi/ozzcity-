function journalActionHTML(f,month){
 const detail=f.detail||'',casino=/ホールデム|ちんちろ|ポーカー|カジノ/.test(f.text),net=detail.match(/純損益\s*([^·]+)/),debt=detail.match(/卓の残債\s*([^·]+)/);
 const summary=casino&&net?'今回の差引 '+net[1].trim()+(debt?' · 卓の残債 '+debt[1].trim():''):detail;
 const outcome=casino&&(/勝った|勝利|大きく勝/.test(f.text)?'win':/負けた|敗れ/.test(f.text)?'loss':/引き分け/.test(f.text)?'draw':/降りた|フォールド/.test(f.text)?'fold':net?(/^[−－-]/.test(net[1].trim())?'cost':/^[＋+]/.test(net[1].trim())?'gain':'draw'):'');
 const label={win:'勝ち',loss:'負け',draw:'引き分け',fold:'フォールド',gain:'収支プラス',cost:'収支マイナス'}[outcome],color={fold:'loss',cost:'loss',gain:'win'}[outcome]||outcome;
 const result=outcome?'<details class="money-record-detail"><summary class="journal-result-toggle"><span class="journal-result-badge journal-result-'+color+'">'+label+(summary?' · '+escapeHTML(summary):'')+'</span><span class="journal-result-hint">内訳</span></summary><p>'+escapeHTML(detail||f.text)+'</p></details>':summary?'<p class="money-record-effect">'+escapeHTML(summary)+'</p>':'';
 return '<article class="feedrow money-record"><div class="feedage">'+ageText(month)+'</div><div class="feedtext"><div class="money-record-title">'+escapeHTML(f.text)+'</div>'+result+'</div></article>';
}
