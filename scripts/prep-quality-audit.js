import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { auditPrepContent } from './prep-content-audit.js';

const root = resolve('..');
const sourceRegistry = JSON.parse(readFileSync(resolve('prep-official-sources.json'), 'utf8'));
const appSource = readFileSync(resolve(root, 'prep-v2-app.js'), 'utf8');
const htmlSource = readFileSync(resolve(root, 'index.html'), 'utf8');
const appTestSource = readFileSync(resolve('prep-v2-app.test.js'), 'utf8');
globalThis.window = {};
await import(`${pathToFileURL(resolve(root, 'prep-v2-data.js')).href}?audit=${Date.now()}`);
const data = globalThis.window.ScholarkPrepData;
const questions = data.questions;
const contentAudit = auditPrepContent(questions, data.topicById);

const sections = Object.groupBy(questions, question => `${question.exam}:${question.section}`);
const count = (exam, section) => sections[`${exam}:${section}`]?.length || 0;
const unique = values => new Set(values).size;
const normalizedVisible = question => `${question.exam}|${question.passage || ''}|${question.stem}`.toLowerCase().replace(/\s+/g, ' ').trim();
const duplicateVisible = questions.length - unique(questions.map(normalizedVisible));
const invalidChoices = questions.filter(question => question.options.length !== 4 || unique(question.options) !== 4 || !Number.isInteger(question.answer) || question.answer < 0 || question.answer > 3);
const missingExplanations = questions.filter(question => !question.explanation || question.explanation.length < 40);
const unknownSkills = questions.filter(question => !data.topicById[question.skill]);
const topicCoverage = Object.values(data.topics).flat().filter(topic => questions.some(question => question.skill === topic.id)).length;
const topicTotal = Object.values(data.topics).flat().length;
const groupedReading = questions.filter(question => question.passageSet);
const readingForms = Object.groupBy(groupedReading, question => question.readingForm);
const validReadingForms = Object.values(readingForms).filter(rows => {
  const sets = Object.values(Object.groupBy(rows, row => row.passageSet));
  return rows.length === 36 && sets.length === 4 && sets.every(set => set.length === 9 && set[0].passage.split(/\s+/).length >= 500);
}).length;
const englishForms = Object.groupBy(questions.filter(question=>question.englishForm&&question.englishPassageSet),question=>question.englishForm);
const validEnglishForms = Object.values(englishForms).filter(rows=>{
  const sets=Object.values(Object.groupBy(rows,row=>row.englishPassageSet));
  return rows.length>=50&&sets.length===5&&sets.every(set=>set.length>=10&&set[0].passage.split(/\s+/).length>=300);
}).length;
const validScienceSets = Object.values(Object.groupBy(questions.filter(question=>question.section==='Science'&&question.stimulusGroup),question=>question.stimulusGroup)).filter(rows=>rows.length>=8&&rows.some(row=>row.figure)).length;
const figureItems=questions.filter(question=>question.figure).length;
const sourceExams = new Set(sourceRegistry.sources.map(source => source.exam));
const sourcesCurrent = sourceRegistry.sources.every(source => /^https:\/\//.test(source.url) && source.reviewed >= '2026-01-01');
const hasTwoPools = count('sat','Reading and Writing') >= 108 && count('sat','Math') >= 88 && count('act','English') >= 100 && count('act','Math') >= 90 && count('act','Reading') >= 72 && count('act','Science') >= 80;
const noOffBlueprintSat = !/(derivative|integral|determinant|matrix multiplication|limit as x)/i.test(questions.filter(question => question.exam === 'sat').map(question => `${question.stem} ${question.explanation}`).join(' '));

const award = (id, label, max, earned, evidence) => ({id,label,max,earned:Math.max(0,Math.min(max,earned)),evidence});
const criteria = [
  award('official-sources','Versioned official-public-data registry',4,sourcesCurrent && sourceExams.has('sat') && sourceExams.has('act') ? 4 : 0,`${sourceRegistry.sources.length} sources; last reviewed ${sourceRegistry.lastReviewed}`),
  award('taxonomy','Complete official taxonomy coverage',4,4 * topicCoverage / topicTotal,`${topicCoverage}/${topicTotal} topics`),
  award('structure','Official-size structures and timing encoded',5,/snapshot\.questions\.length, 98/.test(appTestSource) && /\['English',50,2100\].*\['Math',45,3000\].*\['Reading',36,2400\]/s.test(appTestSource) ? 5 : 0,'SAT and enhanced ACT structure plus timing tests'),
  award('routing','SAT routed module-two engine',4,/function routeAdaptiveModule/.test(appSource) ? 4 : 0,'performance-based second-module replacement'),
  award('act-reading','Passage-aligned ACT Reading forms',5,Math.min(5,validReadingForms / 4 * 5),`${validReadingForms} valid forms; release target 4`),

  award('schema','Question schema and uniqueness',4,invalidChoices.length || unknownSkills.length || duplicateVisible ? 0 : 4,`${invalidChoices.length} invalid choices; ${unknownSkills.length} unknown skills; ${duplicateVisible} visible duplicates`),
  award('explanations','Substantive explanations',4,4 * (questions.length-missingExplanations.length)/questions.length,`${missingExplanations.length} short explanations`),
  award('deterministic-verification','Deterministic answer verification coverage',6,contentAudit.errors.some(issue=>issue.code==='deterministic-answer')?0:6*contentAudit.deterministicCoverage,`${contentAudit.deterministicVerified}/${contentAudit.deterministicEligible} eligible generated math items recomputed`),
  award('ambiguity','Automated ambiguity and distractor audit',5,contentAudit.errors.length?0:Math.max(0,5-contentAudit.warnings.length/questions.length*25),`${contentAudit.errors.length} errors; ${contentAudit.warnings.length} review warnings; ${contentAudit.version}`),
  award('originality','Structural originality and provenance audit',4,contentAudit.errors.some(issue=>['provenance','validation-version','duplicate-visible'].includes(issue.code))?0:contentAudit.largestFamily<=80?4:2,`${contentAudit.structuralFamilies} structural families; largest family ${contentAudit.largestFamily}`),

  award('volume','Reviewed practice depth',8,Math.min(8,questions.length/8000*8),`${questions.length}/8000 release-depth target`),
  award('full-forms','Nonrepeating full-form depth',8,Math.min(8,Math.min(count('sat','Reading and Writing')/810,count('sat','Math')/660,count('act','English')/750,count('act','Math')/675,count('act','Reading')/540,count('act','Science')/600)*8),'release target: 15 SAT/ACT section pools with balanced forms'),
  award('initial-pools','At least two complete pools everywhere',2,hasTwoPools?2:0,'minimum regression safety'),
  award('realism','Passage/figure/experiment realism audit',6,(validReadingForms>=4?2:0)+(validEnglishForms>=15?2:0)+(validScienceSets>=75&&figureItems>=500?2:0),`${validReadingForms} ACT Reading forms; ${validEnglishForms} ACT English forms; ${validScienceSets} figure-based Science sets; ${figureItems} figure items`),
  award('blueprint-exclusions','Off-blueprint exclusion checks',2,noOffBlueprintSat?2:0,'SAT calculus/matrix exclusions'),

  award('calibration','Public-data priors and Bayesian calibration',7,questions.every(question=>question.calibration?.version===data.calibrationVersion)&&/function practiceEstimate/.test(appSource)?7:0,`${data.calibrationVersion}; versioned per-item priors and 3PL-style posterior grid`),
  award('quarantine','Automatic item quarantine and minimum-sample rules',4,/quarantineThreshold/.test(appSource)&&/function questionIsEligible/.test(appSource)?4:0,'minimum-sample, accuracy, discrimination, and explicit-status gates'),
  award('score-ranges','Decision-friendly band with transparent model uncertainty',3,/lowerTheta/.test(appSource)&&/not official scoring/.test(appSource)&&/Scholark stability band/.test(appSource)&&/80% model interval/.test(appSource)?3:0,'narrow completed-form headline plus separate 80% model interval and non-official disclosure'),

  award('adaptive','Mastery, memory, confidence, pacing, and replay',5,['reviewIsDue','Confidence calibration','Pacing Coach','Misconception Replay'].every(token=>appSource.includes(token))?5:0,'five coaching signals present'),
  award('testing-ux','Professional testing controls and analytics',4,['Question map','toggleFlag','Session behavior','toggleEliminate','updateNote','scoreProgressMarkup'].every(token=>appSource.includes(token))?4:0,'question map, flags, eliminator, scratchpad, pacing analytics, and progress timeline'),
  award('accessibility','Accessibility and keyboard release gate',4,/aria-live/.test(htmlSource)&&/handlePrepKeydown/.test(appSource)&&/role="img"/.test(appSource)&&/sr-only/.test(htmlSource)?4:0,'keyboard answers/navigation, focusable chart points, text alternatives, and live region'),
  award('responsive','Responsive and mobile behavior',2,/mobile-nav-toggle/.test(htmlSource) && /@media\(max-width:600px\)/.test(htmlSource)?2:0,'responsive shell and mobile menu'),

  award('persistence','Safe local persistence and cloud fallback',3,/safeParse/.test(appSource) && /Cloud sync failed/.test(appSource)?3:0,'safe parsing and understandable fallback errors'),
  award('security','Security and secret boundaries',3,!/sk-[A-Za-z0-9_-]{24,}/.test(`${appSource}\n${htmlSource}`)?3:0,'no browser AI secret pattern'),
  award('automated-suite','Automated release suite breadth',3,readFileSync(resolve('package.json'),'utf8').includes('prep:release')&&/content audit rejects/.test(readFileSync(resolve('prep-v2-data.test.js'),'utf8'))?3:2,'unit, integrity, content-audit, and release-gate orchestration')
];

const total = criteria.reduce((sum,item)=>sum+item.earned,0);
const maximum = criteria.reduce((sum,item)=>sum+item.max,0);
const score = Math.round(total/maximum*10000)/100;
const report = {score,maximum:100,releaseThreshold:96,ready:score>=96,questionCount:questions.length,criteria};
const jsonMode = process.argv.includes('--json');
if(jsonMode) console.log(JSON.stringify(report,null,2));
else {
  console.log(`Scholark SAT/ACT release score: ${score.toFixed(2)}/100 (required: 96.00)`);
  for(const item of criteria) console.log(`${item.earned.toFixed(2).padStart(5)}/${String(item.max).padEnd(2)}  ${item.label} — ${item.evidence}`);
  console.log(report.ready?'RELEASE GATE PASSED':'LOCAL WORK ONLY — RELEASE GATE NOT MET');
}
if(process.argv.includes('--release') && !report.ready) process.exitCode=1;
