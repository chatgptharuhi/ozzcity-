const fs=require('fs'),path=require('path'),cp=require('child_process');
const out=path.join(__dirname,'audit-results');
const hour=Math.floor(Date.now()/3600000);
const result=cp.spawnSync(process.execPath,[path.join(__dirname,'odds-city-audit.cjs'),'--lives','200','--seed',String(hour>>>0),'--out',out],{cwd:__dirname,encoding:'utf8',timeout:240000,windowsHide:true,maxBuffer:2*1024*1024});
if(result.error)throw result.error;
if(result.status!==0){console.error((result.stderr||result.stdout).slice(0,5000));process.exit(result.status||1)}
const report=JSON.parse(fs.readFileSync(path.join(out,'latest.json'),'utf8'));
const historyPath=path.join(out,'history.json');
const history=fs.existsSync(historyPath)?JSON.parse(fs.readFileSync(historyPath,'utf8')):[];
history.push({at:report.createdAt,hash:report.sourceHash,summary:report.summary,errorCount:report.errors.length});
fs.writeFileSync(historyPath,JSON.stringify(history.slice(-48),null,2));
const notifiedPath=path.join(out,'notified-candidates.json');
const notified=fs.existsSync(notifiedPath)?JSON.parse(fs.readFileSync(notifiedPath,'utf8')):[];
const candidates=report.flags.filter(f=>f.occurrences>=40&&!notified.includes(f.event+':'+f.type)).slice(0,3);
const digest={at:report.createdAt,totalRuns:report.runs.length,changedSource:report.changedSource,newErrors:report.newErrors,summary:report.summary,newCandidates:candidates,note:'Candidates compare immediate numeric effects only. Review narrative and future effects before calling them defects. Censored runs are observation-limit, not failures.'};
fs.writeFileSync(path.join(out,'digest.json'),JSON.stringify(digest,null,2));
if(!report.newErrors.length&&!report.changedSource&&!candidates.length)console.log('検証完了。新しい問題なし。');
else console.log(JSON.stringify(digest));
