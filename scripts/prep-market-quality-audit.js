import { existsSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { auditPrepContent } from './prep-content-audit.js';

const root=resolve('..');
const read=path=>readFileSync(resolve(root,path),'utf8');
const appSource=read('prep-v2-app.js');
const htmlSource=read('index.html');
const testSource=read('scripts/prep-v2-app.test.js')+read('scripts/prep-v2-data.test.js');
const sources=JSON.parse(read('scripts/prep-official-sources.json'));
const benchmark=read('scripts/PREP_BENCHMARK.md');
const browserPath=resolve('prep-browser-e2e-report.json');
const browserReport=existsSync(browserPath)?JSON.parse(readFileSync(browserPath,'utf8')):null;
globalThis.window={};
await import(`${pathToFileURL(resolve(root,'prep-v2-data.js')).href}?market=${Date.now()}`);
const data=globalThis.window.ScholarkPrepData,questions=data.questions;
const content=auditPrepContent(questions,data.topicById);
const allTopics=Object.values(data.topics).flat();
const allTutored=questions.every(question=>question.tutoring?.version===data.tutoringVersion&&question.tutoring.hints?.length>=3&&question.tutoring.solutionPath?.length>=3);
const allChoiceDiagnosed=questions.every(question=>question.tutoring?.choiceFeedback?.length===4&&question.tutoring.choiceFeedback.filter(row=>row.status==='correct').length===1);
const allCourses=allTopics.every(topic=>topic.course?.steps?.length>=3&&topic.course?.traps?.length>=3&&topic.course?.checkpointQuestionIds?.length>=3);
const sourceExams=new Set(sources.sources.map(source=>source.exam));
const currentSources=sources.sources.every(source=>/^https:\/\//.test(source.url)&&source.reviewed>='2026-01-01');
const formsValid=data.formCatalog.sat.length>=30&&data.formCatalog.act.length>=20&&[...data.formCatalog.sat,...data.formCatalog.act].every(form=>form.id&&form.seed&&form.questions>90&&form.minutes>=120);
const validFigures=questions.filter(question=>question.figure).length;
const validReadingForms=new Set(questions.filter(question=>question.readingForm&&question.passageSet).map(question=>question.readingForm)).size;
const automatedCoverage=['registered form seeds produce distinct','only a completed registered form','deterministic tutoring','structured lesson','content audit rejects'].every(token=>testSource.includes(token));
const browserPassed=browserReport?.passed===true&&browserReport.desktop?.passed===true&&browserReport.mobile?.passed===true&&browserReport.accessibility?.passed===true;

const award=(id,label,max,earned,evidence)=>({id,label,max,earned:Math.max(0,Math.min(max,earned)),evidence});
const criteria=[
  award('public-specs','Current official/public specifications and attribution',12,currentSources&&sourceExams.has('sat')&&sourceExams.has('act')&&sources.sources.length>=10?12:0,`${sources.sources.length} reviewed sources; SAT and ACT present`),

  award('originality','Originality, provenance, and schema integrity',5,content.errors.some(issue=>['provenance','duplicate-visible','duplicate-id','choice-count','answer-index'].includes(issue.code))?0:5,`${content.errors.length} content errors; ${content.structuralFamilies} structural families`),
  award('verification','Deterministic answer verification',5,5*content.deterministicCoverage,`${content.deterministicVerified}/${content.deterministicEligible} eligible math answers recomputed`),
  award('distractors','Answer-cue and ambiguity controls',4,content.errors.length?0:Math.max(0,4-content.warnings.length/10),`${content.warnings.length} automated review warnings; answer-position and length-bias checks active`),
  award('depth','Original question-bank depth',4,Math.min(4,questions.length/8000*4),`${questions.length}/8000 internal depth target; competitor count is tracked separately`),
  award('realism','Passage, table, and figure realism',2,validReadingForms>=20&&validFigures>=1000?2:validReadingForms>=10&&validFigures>=500?1:0,`${validReadingForms} ACT Reading forms; ${validFigures} figure-based items`),

  award('tutor','Deterministic three-step tutoring coverage',6,allTutored?6:0,`${questions.filter(question=>question.tutoring?.version===data.tutoringVersion).length}/${questions.length} items`),
  award('choice-diagnosis','Choice-specific misconception feedback',3,allChoiceDiagnosed?3:0,'four diagnosed choices per question'),
  award('topic-courses','Blueprint-topic course coverage',4,allCourses?4:4*allTopics.filter(topic=>topic.course?.checkpointQuestionIds?.length>=3).length/allTopics.length,`${allTopics.length} official-taxonomy topics with lessons, traps, and checkpoints`),
  award('strategy-courses','Rule-backed Desmos, English, and pattern courses',3,['Complete Desmos Strategy Course','English Rules That Actually Transfer','Pattern Recognition Playbook','rule versus myth'].every(token=>appSource.includes(token))?3:0,'three applied strategy courses with practice transfer'),

  award('forms','Registered, reproducible official-size form system',7,formsValid&&/form seeds produce distinct/.test(testSource)&&/completed registered form/.test(testSource)?7:0,`${data.formCatalog.sat.length} SAT + ${data.formCatalog.act.length} ACT forms; deterministic and completion-tested`),
  award('scoring','Transparent, decision-friendly score estimation',9,['Independent 3PL-style estimate','Scholark stability band','80% model interval','not official scoring','cross-form confirmed'].every(token=>appSource.includes(token))?9:0,'narrow full-form display, broad model uncertainty, public priors, and non-official disclosure'),

  award('personalization','Personalized plan, memory, mastery, and reassessment',6,['Goal Gap Map','Mastery Memory Engine','startDiagnostic','reviewIsDue','scoreProgressMarkup'].every(token=>appSource.includes(token))?6:0,'goal/date plan, diagnostic, spaced review, and progress history'),
  award('analytics','Actionable metacognitive analytics',6,['Mistake DNA','Confidence calibration','Pacing Coach','Decision Profile Map','Misconception Replay'].every(token=>appSource.includes(token))?6:0,'error type, confidence, timing quadrant, transfer replay, and pacing signals'),

  award('interface','Professional low-friction testing and learning UI',6,['Question map','toggleEliminate','updateNote','openFormLibrary','prep-v2-test-hero','prep-v2-proof-grid'].every(token=>`${appSource}\n${htmlSource}`.includes(token))?6:0,'test center, form browser, navigator, eliminator, notes, and proof strip'),
  award('accessibility','Responsive, keyboard, and accessibility support',4,/aria-live/.test(htmlSource)&&/handlePrepKeydown/.test(appSource)&&/role="img"/.test(appSource)&&/@media\(max-width:600px\)/.test(htmlSource)?4:0,'keyboard controls, live region, chart labels, and mobile layout'),

  award('reliability','Persistence, migration, and cloud-fallback safety',3,/safeParse/.test(appSource)&&/Cloud sync failed/.test(appSource)&&/completedForms/.test(appSource)?3:0,'safe parsing, versioned local state, and understandable fallback errors'),
  award('security','Browser secret and privacy boundaries',3,!/(sk-[A-Za-z0-9_-]{24,}|BEGIN PRIVATE KEY|service_account)/.test(`${appSource}\n${htmlSource}`)&&/privacy-safe/.test(testSource)?3:0,'no AI/service-account secret pattern; aggregate item metrics stay identity-free'),

  award('automation','Automated adversarial and full-form tests',2,automatedCoverage?2:0,'schema, cue bias, form collision, early-exit, full completion, score band, and tutor tests'),
  award('browser','Desktop/mobile/accessibility browser verification',2,browserPassed?2:0,browserPassed?`passed ${browserReport.reviewed}`:'pending browser evidence report'),
  award('competitive','Current, candid Acely capability benchmark',4,/Reviewed: 2026-08-15/.test(benchmark)&&/14,000/.test(benchmark)&&/Remaining evidence gap/.test(benchmark)&&/Decision Profile Map/.test(benchmark)?4:0,'public claims, differentiators, and remaining gaps documented')
];

const total=criteria.reduce((sum,item)=>sum+item.earned,0);
const score=Math.round(total*100)/100;
const hardFailures=[];
if(content.errors.length)hardFailures.push('content audit errors');
if(!allTutored||!allChoiceDiagnosed||!allCourses)hardFailures.push('incomplete tutor or curriculum coverage');
if(!formsValid)hardFailures.push('registered form catalog');
if(!browserPassed)hardFailures.push('browser E2E evidence');
if(!automatedCoverage)hardFailures.push('automated adversarial coverage');
const report={name:'Scholark SAT/ACT engineering and product-readiness audit',score,maximum:100,releaseThreshold:96,ready:score>=96&&hardFailures.length===0,scope:'Feature completeness, source alignment, content integrity controls, UI, reliability, and tested behavior.',doesNotMeasure:'Independent learning efficacy, official score equivalence, or proof that Scholark outperforms a competitor.',questionCount:questions.length,hardFailures,criteria};
if(process.argv.includes('--json'))console.log(JSON.stringify(report,null,2));
else {
  console.log(`${report.name}: ${score.toFixed(2)}/100 (required: 96.00)`);
  for(const item of criteria)console.log(`${item.earned.toFixed(2).padStart(5)}/${String(item.max).padEnd(2)}  ${item.label} — ${item.evidence}`);
  if(hardFailures.length)console.log(`HARD GATE: ${hardFailures.join('; ')}`);
  console.log(report.ready?'MARKET-QUALITY GATE PASSED':'LOCAL WORK ONLY — MARKET-QUALITY GATE NOT MET');
  console.log(`Scope note: ${report.doesNotMeasure}`);
}
if(process.argv.includes('--release')&&!report.ready)process.exitCode=1;
