(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.ScholarkAIAlgorithms=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const MASTERY_LABELS=[
    [0,'Not Started'],[1,'Learning'],[36,'Developing'],[56,'Proficient'],[76,'Strong'],[91,'Mastered']
  ];
  const ERROR_TYPES=['concept_gap','misread','arithmetic','algebra_manipulation','evidence','grammar_rule','vocabulary_context','rushed','process_of_elimination','unknown'];
  const ESSAY_CATEGORIES=['hook','authenticity','specificity','voice','storytelling','reflection','vulnerability','structure','show_vs_tell','memorability','cliche_risk','depth','admissions_impact'];

  const clamp=(n,min=0,max=100)=>Math.max(min,Math.min(max,Number.isFinite(+n)?+n:min));
  const round=(n,p=1)=>{const m=10**p;return Math.round((Number(n)||0)*m)/m;};
  const words=text=>(String(text||'').match(/[A-Za-zÀ-ÿ0-9'’-]+/g)||[]);
  const sentences=text=>String(text||'').split(/[.!?]+/).map(x=>x.trim()).filter(Boolean);
  const paragraphs=text=>String(text||'').split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean);
  const daysUntil=date=>{
    if(!date) return Infinity;
    const t=new Date(date).getTime();
    if(!Number.isFinite(t)) return Infinity;
    return Math.max(0,Math.ceil((t-Date.now())/86400000));
  };

  function detectCapability(signals={}){
    const deviceMemory=Number(signals.deviceMemory||0);
    const cores=Number(signals.hardwareConcurrency||0);
    const mobile=!!signals.mobile;
    const webgpu=!!signals.webgpu;
    const wasm=signals.wasm!==false;
    const saveData=!!signals.saveData;
    const lowPower=mobile||saveData||(deviceMemory>0&&deviceMemory<=4)||(cores>0&&cores<=4);
    if(webgpu&&!mobile&&!saveData&&deviceMemory>=8&&cores>=8) return {tier:'high',generative:true,modelTier:'high',reason:'strong-webgpu'};
    if(webgpu&&!lowPower) return {tier:'standard',generative:true,modelTier:'standard',reason:'webgpu'};
    if(webgpu) return {tier:'low',generative:true,modelTier:'low',reason:'constrained-webgpu'};
    if(wasm) return {tier:'compatibility',generative:false,modelTier:null,reason:'wasm-task-specific'};
    return {tier:'compatibility',generative:false,modelTier:null,reason:'deterministic-only'};
  }

  function routeIntent(input=''){
    const q=String(input).toLowerCase();
    const scores={tutor:0,essay:0,planner:0,sat:0,ap:0,college:0,scholarship:0};
    const add=(key,re,weight=2)=>{if(re.test(q))scores[key]+=weight;};
    add('essay',/essay|common app|personal statement|hook|paragraph|authentic|voice|show.*tell|admissions reader/,4);
    add('planner',/study (plan|schedule)|what should i study|today|deadline|calendar|plan my|priorit/,3);
    add('sat',/\bsat\b|reading and writing|advanced math|problem solving|information and ideas|craft and structure/,4);
    add('ap',/\bap\b|advanced placement|frq|dbq|leq|mcq/,4);
    add('college',/college|university|major|minor|campus|undergraduate research|compare .* (universit(?:y|ies)|college(?:s)?)|school list/,3);
    add('scholarship',/scholarship|grant|eligib|award|financial aid|fafsa|css profile/,4);
    add('tutor',/explain|teach|help me understand|why|how do|practice|example|simpler|concept|solve|equation|biology|chemistry|physics|history|economics|english|math/,2);
    const entries=Object.entries(scores).sort((a,b)=>b[1]-a[1]);
    return {agent:entries[0][1]>0?entries[0][0]:'tutor',confidence:entries[0][1],scores};
  }

  function masteryLabel(score){
    const n=clamp(score,0,100);
    let label='Not Started';
    for(const [min,name] of MASTERY_LABELS) if(n>=min) label=name;
    return label;
  }

  function updateMastery(previous=0,evidence={}){
    const prev=clamp(previous,0,100);
    const correct=!!evidence.correct;
    const difficulty=clamp(evidence.difficulty??0.5,0,1);
    const hints=clamp(evidence.hints??0,0,5);
    const attempts=clamp(evidence.attempts??1,1,10);
    const confidence=clamp(evidence.confidence??0.5,0,1);
    const ageDays=clamp(evidence.daysSincePractice??0,0,365);
    const recencyPenalty=Math.min(9,ageDays*0.08);
    const base=correct?(8+8*difficulty):(6+5*difficulty);
    const hintPenalty=hints*1.4;
    const attemptPenalty=Math.max(0,attempts-1)*1.2;
    const confidenceAdj=(confidence-.5)*2;
    let next=correct?prev+base-hintPenalty-attemptPenalty+confidenceAdj:prev-base*0.72-hintPenalty*0.35;
    if(ageDays>21) next-=recencyPenalty;
    if(prev===0&&correct) next=Math.max(next,18);
    next=round(clamp(next,0,100),1);
    return {score:next,label:masteryLabel(next),delta:round(next-prev,1)};
  }

  function classifyError(meta={}){
    if(meta.errorType&&ERROR_TYPES.includes(meta.errorType)) return meta.errorType;
    const note=String(meta.note||meta.explanation||'').toLowerCase();
    if(/misread|didn.t read|overlook/.test(note))return'misread';
    if(/arithmetic|calculation|sign error/.test(note))return'arithmetic';
    if(/algebra|manipulat|rearrang/.test(note))return'algebra_manipulation';
    if(/evidence|passage|quote/.test(note))return'evidence';
    if(/grammar|punctuation|comma|verb/.test(note))return'grammar_rule';
    if(/vocab|context/.test(note))return'vocabulary_context';
    if(/rush|time|pacing/.test(note))return'rushed';
    if(/eliminat/.test(note))return'process_of_elimination';
    if(/concept|didn.t know|formula|rule/.test(note))return'concept_gap';
    return'unknown';
  }

  function recommendNextPractice(stats={}){
    const accuracy=clamp((stats.accuracy??0.5)*100,0,100)/100;
    const mastery=clamp(stats.mastery??50,0,100);
    const recurring=Number(stats.recurringErrors||0);
    const days=Number(stats.daysSincePractice||0);
    if(mastery<30||accuracy<0.45||recurring>=3)return{action:'prerequisite_review',difficulty:'easier',count:6,reason:'A prerequisite or recurring misconception needs reinforcement first.'};
    if(days>=14)return{action:'spaced_review',difficulty:'mixed',count:8,reason:'This skill is due for spaced review.'};
    if(accuracy<0.7)return{action:'targeted_practice',difficulty:'similar',count:8,reason:'More practice at the current level should stabilize the skill.'};
    if(accuracy>=0.88&&mastery>=78)return{action:'stretch_practice',difficulty:'harder',count:6,reason:'Performance is strong enough to increase difficulty.'};
    return{action:'mixed_practice',difficulty:'mixed',count:8,reason:'Mixing this skill with nearby skills will test durable mastery.'};
  }

  function priorityScore(item={}){
    const d=daysUntil(item.date||item.examDate||item.deadline);
    const urgency=d===Infinity?8:d<=1?100:d<=3?85:d<=7?70:d<=14?52:d<=30?35:20;
    const weakness=100-clamp(item.mastery??60,0,100);
    const importance=clamp(item.importance??60,0,100);
    const unfinished=item.completed?0:15;
    return round(urgency*.45+weakness*.3+importance*.2+unfinished*.05,1);
  }

  function buildStudyPlan(input={}){
    const tasks=(Array.isArray(input.tasks)?input.tasks:[]).filter(x=>!x.completed).map((x,i)=>({...x,_i:i,priority:priorityScore(x)})).sort((a,b)=>b.priority-a.priority);
    const dailyMinutes=Math.max(20,Math.min(360,Number(input.dailyMinutes||90)));
    const days=Math.max(1,Math.min(14,Number(input.days||7)));
    const maxBlock=Math.max(20,Math.min(60,Number(input.maxBlockMinutes||45)));
    const plan=[];
    for(let day=0;day<days;day++){
      let remaining=dailyMinutes;
      const blocks=[];
      const ranked=tasks.slice().sort((a,b)=>{
        const ad=daysUntil(a.date||a.examDate||a.deadline)-day;
        const bd=daysUntil(b.date||b.examDate||b.deadline)-day;
        const au=a.priority+(ad<=1?20:ad<=3?10:0);
        const bu=b.priority+(bd<=1?20:bd<=3?10:0);
        return bu-au;
      });
      for(const task of ranked){
        if(remaining<20)break;
        const minutes=Math.min(maxBlock,remaining,Math.max(20,Number(task.minutes||35)));
        blocks.push({taskId:task.id||`task-${task._i}`,title:task.title||task.topic||task.subject||'Study block',subject:task.subject||'',minutes,priority:task.priority,reason:task.reason||priorityReason(task)});
        remaining-=minutes;
        if(blocks.length>=4)break;
      }
      if(!blocks.length)blocks.push({taskId:'review',title:'Mixed review',subject:'',minutes:Math.min(dailyMinutes,30),priority:20,reason:'Keep momentum with a short spaced-review block.'});
      plan.push({dayOffset:day,totalMinutes:blocks.reduce((s,b)=>s+b.minutes,0),blocks});
    }
    return plan;
  }

  function priorityReason(task){
    const d=daysUntil(task.date||task.examDate||task.deadline);
    const mastery=clamp(task.mastery??60,0,100);
    if(d<=1)return'High priority because the deadline or exam is within one day.';
    if(d<=7&&mastery<60)return'High priority because the date is close and mastery is still developing.';
    if(mastery<45)return'Prioritized because current mastery is low.';
    if(d<=14)return'Prioritized to prepare before the upcoming date.';
    return'Included to maintain progress and spaced review.';
  }

  function essaySignals(text=''){
    const ws=words(text), ss=sentences(text), ps=paragraphs(text), lower=ws.map(w=>w.toLowerCase());
    const unique=new Set(lower).size/Math.max(1,ws.length);
    const first=ss[0]||'';
    const lens=ss.map(s=>words(s).length);
    const avg=lens.reduce((a,b)=>a+b,0)/Math.max(1,lens.length);
    const variance=lens.length?Math.max(...lens)-Math.min(...lens):0;
    const firstPerson=lower.filter(w=>['i','me','my','mine'].includes(w)).length;
    const concrete=(String(text).match(/\b\d+\b|[“”"]|\b[A-Z][a-z]{2,}\b/g)||[]).length;
    const sensory=lower.filter(w=>['saw','heard','felt','smelled','tasted','bright','dark','quiet','loud','warm','cold','rough','smooth','blue','red','green'].includes(w)).length;
    const reflective=lower.filter(w=>['realized','learned','understood','noticed','changed','because','meaning','meant','wondered','questioned','now','before','after'].includes(w)).length;
    const cliches=(String(text).toLowerCase().match(/hard work pays off|never give up|changed my life|everything happens for a reason|step out of my comfort zone|be the best version of myself|dreams? come true|since i was (a )?child/g)||[]).length;
    const achievement=lower.filter(w=>['award','won','winner','president','captain','founded','founder','first','best','ranked','competition','leadership'].includes(w)).length;
    const dialogue=(String(text).match(/[“"][^”"]{3,}[”"]/g)||[]).length;
    const vulnerability=lower.filter(w=>['afraid','embarrassed','wrong','failed','failure','uncertain','confused','mistake','hurt','doubt','awkward','lonely','nervous'].includes(w)).length;
    const generic=lower.filter(w=>['passion','impact','journey','success','opportunity','inspire','community','leadership','valuable','unique','important'].includes(w)).length;
    const showing=sensory+dialogue*2+Math.min(6,concrete);
    return{wordCount:ws.length,sentenceCount:ss.length,paragraphCount:ps.length,uniqueRatio:unique,avgSentence:avg,sentenceVariance:variance,firstSentence:first,firstPerson,concrete,sensory,reflective,cliches,achievement,dialogue,vulnerability,generic,showing};
  }

  function scoreEssayDeterministic(text='',prompt=''){
    const x=essaySignals(text);
    const lengthFit=x.wordCount>=350&&x.wordCount<=650?1:x.wordCount>=220&&x.wordCount<=720?.65:.3;
    const hook=clamp(4+(x.firstSentence.length>20?1:0)+(x.firstSentence.length<150?1:0)+(x.dialogue?1:0)+(x.concrete?1:0)-(x.cliches?2:0),1,10);
    const specificity=clamp(3+Math.min(4,x.concrete/3)+Math.min(2,x.sensory/2)-Math.min(2,x.generic/5),1,10);
    const voice=clamp(4+(x.uniqueRatio>.48?1.5:.5)+(x.sentenceVariance>12?1.5:.5)+(x.firstPerson>5?1:0)+(x.dialogue?1:0)-Math.min(1.5,x.generic/7),1,10);
    const authenticity=clamp(4+(x.vulnerability?1.3:0)+(x.concrete?1.2:0)+(x.firstPerson>4?1:0)+(x.uniqueRatio>.45?1:0)-Math.min(2,x.generic/6),1,10);
    const reflection=clamp(3+Math.min(4,x.reflective/3)+(x.paragraphCount>=3?1:0)+(x.wordCount>300?1:0)-Math.min(1,x.achievement/8),1,10);
    const vulnerability=clamp(3+Math.min(3,x.vulnerability)+(x.reflective>3?1:0)+(x.concrete>3?1:0)-(x.achievement>10?1:0),1,10);
    const structure=clamp(3+(x.paragraphCount>=3?2:0)+(x.paragraphCount>=5?1:0)+(lengthFit*2)+(x.sentenceVariance>8?1:0),1,10);
    const storytelling=clamp(3+Math.min(3,x.showing/4)+(x.paragraphCount>=3?1:0)+(x.dialogue?1:0)+(x.reflective>2?1:0),1,10);
    const showTell=clamp(3+Math.min(5,x.showing/3)-Math.min(2,x.generic/4),1,10);
    const memorable=clamp(3+Math.min(2.5,x.concrete/4)+Math.min(1.5,x.vulnerability/2)+Math.min(1.5,x.dialogue)+Math.min(1.5,x.reflective/5)-Math.min(2,x.cliches*1.5),1,10);
    const clicheRisk=clamp(9-x.cliches*2.5-Math.min(2,x.generic/5),1,10);
    const depth=clamp(3+Math.min(4,x.reflective/2.5)+Math.min(1.5,x.vulnerability/2)+(x.wordCount>350?1:0)-Math.min(1.5,x.achievement/8),1,10);
    const admissionsImpact=clamp((authenticity+specificity+reflection+memorable+depth)/5-(x.achievement>12&&x.reflective<4?1:0),1,10);
    const scores={hook,authenticity,specificity,voice,storytelling,reflection,vulnerability,structure,show_vs_tell:showTell,memorability:memorable,cliche_risk:clicheRisk,depth,admissions_impact:admissionsImpact};
    Object.keys(scores).forEach(k=>scores[k]=round(scores[k],1));
    const weighted=(hook*.06+authenticity*.12+specificity*.1+voice*.1+storytelling*.08+reflection*.12+vulnerability*.06+structure*.08+showTell*.07+memorable*.07+clicheRisk*.04+depth*.05+admissionsImpact*.05);
    const overall=round(clamp(weighted-(x.wordCount<150?1.5:0),1,10),1);
    const sorted=Object.entries(scores).sort((a,b)=>b[1]-a[1]);
    const weakest=[...sorted].sort((a,b)=>a[1]-b[1]);
    const strongest=sorted[0];
    const weak=weakest[0];
    return{
      kind:'deterministic-rubric-baseline',
      overall,scores,signals:x,
      strongest:{category:strongest[0],score:strongest[1]},
      biggestWeakness:{category:weak[0],score:weak[1]},
      attentionDrop:x.avgSentence>27?'Long sentence density may slow the middle of the draft.':x.paragraphCount<3?'The draft needs clearer structural turns.':'No severe mechanical attention drop detected by the baseline rubric.',
      memorableIdea:x.dialogue?'The use of dialogue creates a concrete reader anchor.':x.concrete?'Specific details are the strongest memory anchors.':'Add one concrete scene or image that a reader could recall later.',
      admissionsReaderThought:overall>=8?'Distinctive potential, but the reader would still test whether every polished line earns its place.':overall>=6?'There is a workable personal story here, but more specific reflection is needed before it feels truly distinctive.':'The current draft reads more like a summary than a revealing personal narrative.',
      keepingFromEight:overall>=8?'Sustain the strongest specificity and voice across every paragraph.':`Raise ${weak[0].replaceAll('_',' ')} without making the voice sound manufactured.`,
      recommendations:buildEssayRecommendations(scores,x,prompt)
    };
  }

  function buildEssayRecommendations(scores,x,prompt){
    const recs=[];
    if(scores.specificity<7)recs.push('Replace one broad claim with a scene containing a concrete action, object, place, or line of dialogue.');
    if(scores.reflection<7)recs.push('After the central event, add reflection that explains what changed in how you think—not only what happened.');
    if(scores.authenticity<7)recs.push('Trade polished résumé-style language for wording and observations that sound closer to how you actually notice the world.');
    if(scores.show_vs_tell<7)recs.push('Find a sentence that announces a trait and rewrite the surrounding moment so the reader can infer that trait.');
    if(scores.cliche_risk<7)recs.push('Cut or complicate the most familiar admissions phrase; keep the experience but make the interpretation more specific to you.');
    if(x.wordCount>650)recs.push(`Trim at least ${x.wordCount-650} words, starting with repeated setup or explanation.`);
    if(prompt&&String(prompt).length>10&&x.wordCount>150)recs.push('Re-read the selected prompt and make sure the reflection—not just the event—actually answers it.');
    while(recs.length<3)recs.push('Choose the least essential sentence in the middle and ask whether it reveals something new about you; cut or deepen it.');
    return recs.slice(0,3);
  }

  function validateEssayEvaluation(value){
    if(!value||typeof value!=='object')return{valid:false,reason:'not-object'};
    if(!Number.isFinite(+value.overall)||+value.overall<1||+value.overall>10)return{valid:false,reason:'overall'};
    if(!value.scores||typeof value.scores!=='object')return{valid:false,reason:'scores'};
    for(const key of ESSAY_CATEGORIES){if(!Number.isFinite(+value.scores[key])||+value.scores[key]<1||+value.scores[key]>10)return{valid:false,reason:`score:${key}`};}
    return{valid:true};
  }

  function compareEssayEvaluations(a,b){
    const before=a?.scores||{},after=b?.scores||{};
    const categories=[...new Set([...Object.keys(before),...Object.keys(after)])];
    const changes=categories.map(category=>({category,before:round(before[category]||0,1),after:round(after[category]||0,1),delta:round((after[category]||0)-(before[category]||0),1)})).sort((x,y)=>Math.abs(y.delta)-Math.abs(x.delta));
    return{overallDelta:round((b?.overall||0)-(a?.overall||0),1),improved:changes.filter(x=>x.delta>.15),weakened:changes.filter(x=>x.delta<-.15),stable:changes.filter(x=>Math.abs(x.delta)<=.15),changes};
  }

  function trimContext(messages=[],maxChars=9000){
    const safe=(Array.isArray(messages)?messages:[]).filter(m=>m&&['user','assistant'].includes(m.role)&&typeof m.content==='string');
    const out=[];let total=0;
    for(let i=safe.length-1;i>=0;i--){const m=safe[i];const room=maxChars-total;if(room<=0)break;const content=m.content.slice(-room);out.unshift({role:m.role,content});total+=content.length;}
    return out;
  }

  function stableHash(input=''){
    let h=2166136261;
    const s=String(input);
    for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}
    return(h>>>0).toString(16).padStart(8,'0');
  }

  return{
    VERSION:'1.0.0',ERROR_TYPES,ESSAY_CATEGORIES,clamp,round,words,sentences,paragraphs,daysUntil,
    detectCapability,routeIntent,masteryLabel,updateMastery,classifyError,recommendNextPractice,
    priorityScore,buildStudyPlan,scoreEssayDeterministic,validateEssayEvaluation,compareEssayEvaluations,
    trimContext,stableHash
  };
});
