import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url), E=require('../admissions/essay-engine.js');
const draft='I was nervous, but I folded the note and stepped forward. The blue bottle rattled against the kettle.';
const comment=E.analyze(draft).comments.find(c=>c.ruleId==='ST-01');
test('passage edits preserve source facts and offer two distinct concrete-action alternatives',()=>{
 const result=E.passageRevisions({draft,comment});assert.equal(result.options.length,2);assert.equal(E.validatePassageRevisions(result,{draft,comment}).valid,true);assert.equal(draft.slice(result.target.start,result.target.end),result.target.quote);assert.ok(result.options.every(o=>!o.text.includes('nervous')));
});
test('passage alternatives reject new facts, number changes, polarity changes, repetition and reordered actors',()=>{
 const samples=['I won a Nobel Prize.','I taught 900 children.','I never folded the note.','The note folded I.','<img src=x>'];
 for(const text of samples)assert.equal(E.validatePassageRevisions({options:[{text},{text:'I folded the note. I stepped forward.'}]},{draft,comment}).valid,false,text);
 assert.equal(E.validatePassageRevisions({options:[{text:'I folded the note.'},{text:'I folded the note.'}]},{draft,comment}).valid,false);
 assert.equal(E.validatePassageRevisions(null,{draft,comment}).valid,false);
});
test('a changed anchor and an entire short draft never become editable passage targets',()=>{
 assert.equal(E.revisionTarget(draft+' changed',{...comment,quote:'false'}),null);
 assert.equal(E.revisionTarget(comment.quote,{...comment,end:comment.quote.length}),null);
 assert.equal(E.revisionTarget(draft,{...comment,stale:true}),null);
});
test('a vague feeling alone gets a question, without invented gestures or dialogue',()=>{
 const text='I was nervous. The event mattered to me.',c=E.analyze(text).comments.find(c=>c.ruleId==='ST-01');const result=E.passageRevisions({draft:text,comment:c});assert.equal(result.options.length,0);assert.match(result.guidance,/seen|heard/);
});
test('all seven Common App prompts have distinct source-linked checks and exact draft evidence',()=>{
 const titles=new Set();for(let i=1;i<=7;i++){const result=E.analyze(draft,{promptType:'ca'+i});const r=result.promptReview;titles.add(r.title);assert.equal(r.checks.length,3);assert.ok(r.references.length>=2);for(const c of r.checks)if(c.evidence)assert.ok(draft.slice(c.start,c.end).includes(c.evidence));for(const ref of r.references)assert.match(ref.url,/^https:\/\/(apply\.jhu\.edu|admissions\.yale\.edu)\//);}
 assert.equal(titles.size,7);assert.match(E.analyze(draft,{promptType:'ca4'}).promptReview.title,/Gratitude/);
});
