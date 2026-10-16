import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const A=require('../admissions/activity-engine.js');

test('numbered activity headings retain their contribution sub-bullets',()=>{
 const result=A.parseReport('1. Robotics Club\n- Built a robot for regional competition.\n- Taught 12 students programming.\n2. Food Bank\n- Prepared 100 meals each week.\n- Coordinated 8 volunteers.');
 assert.equal(result.activities.length,2);
 assert.equal(result.activities[0].organization,'Robotics Club');
 assert.match(result.activities[0].notes,/Built a robot/);
 assert.match(result.activities[0].notes,/Taught 12/);
 assert.equal(result.activities[1].organization,'Food Bank');
 assert.match(result.activities[1].notes,/Coordinated 8/);
});
test('flat contribution bullets remain distinct activities',()=>{
 assert.equal(A.parseReport('- Taught 12 students programming.\n- Prepared 100 meals weekly.').activities.length,2);
});
test('different explicit positions at one organization retain separate cards',()=>{
 const result=A.parseReport('Position\tOrganization\tDescription\nLab assistant\tCounty Hospital\tTested water samples and analyzed the results.\nReceptionist\tCounty Hospital\tScheduled patient appointments and answered telephone calls.');
 assert.equal(result.activities.length,2);
 assert.deepEqual(result.activities.map(a=>a.position),['Lab assistant','Receptionist']);
});
test('duplicate organization and role still merge their evidence',()=>{
 const result=A.parseReport('Position\tOrganization\tDescription\nVolunteer\tFood Bank\tPrepared 100 meals weekly.\nVolunteer\tFood Bank\tDistributed meals to families.');
 assert.equal(result.activities.length,1);
 assert.match(result.activities[0].notes,/Prepared 100/);assert.match(result.activities[0].notes,/Distributed meals/);
});
test('concrete food service is not penalized for an ordinary action synonym or tense',()=>{
 const scores=['Served','Serve','Serving','Prepared','Prepare','Preparing','Packed','Pack','Packing','Cooked','Cook','Cooking','Distributed','Distribute','Distributing'].map(verb=>A.grade({organization:'Food Bank',description:`${verb} 100 meals weekly with 8 volunteers.`}));
 assert.equal(new Set(scores.map(g=>g.score)).size,1);
 assert.ok(scores.every(g=>g.dimensions.impact>=20));
});
test('planned and negated contributions do not gain action credit',()=>{
 for(const description of ['I hope to prepare 100 meals weekly.','I did not prepare 100 meals weekly.','I plan to pack 100 meals weekly.']) assert.equal(A.grade({description}).score,null);
});
test('ordinary workplace contributions receive output credit across tense',()=>{
 for(const description of ['Scheduled patient appointments and answered telephone calls.','Schedule patient appointments and answer telephone calls.','Scheduling patient appointments and answering telephone calls.']) assert.ok(A.grade({description}).why.includes('A concrete output or contribution is described.'));
});
test('separated flat bullets after a completed numbered entry remain separate',()=>{
 const result=A.parseReport('1. Robotics Club\nBuilt a robot for regional competition.\n\n- Prepared 100 meals weekly.\n- Taught 12 students programming.');
 assert.equal(result.activities.length,3);
 assert.equal(result.activities[0].organization,'Robotics Club');
 assert.doesNotMatch(result.activities[0].notes,/meals/);
});
test('indented nested bullets stay attached even across paragraph breaks',()=>{
 const result=A.parseReport('1. Robotics Club\nBuilt a robot for regional competition.\n\n  - Taught 12 students programming.\n2. Food Bank\nPrepared 100 meals weekly.');
 assert.equal(result.activities.length,2);assert.match(result.activities[0].notes,/Taught 12/);
});
test('explicitly named activity bullet ends a previous numbered group',()=>{
 const result=A.parseReport('1. Robotics Club\nBuilt a robot for regional competition.\n- Food Bank: Prepared 100 meals weekly.');
 assert.equal(result.activities.length,2);assert.equal(result.activities[1].organization,'Food Bank');
});
test('labeled contribution bullets do not masquerade as new activities',()=>{
 const result=A.parseReport('1. Robotics Club\n- Role: Captain\n- Impact: Taught 12 students programming.\n2. Food Bank\n- Description: Prepared 100 meals weekly.');
 assert.equal(result.activities.length,2);assert.match(result.activities[0].notes,/Role: Captain/);assert.match(result.activities[0].notes,/Impact: Taught/);
});
test('observing others cooking is not credited as personally preparing meals',()=>{
 const observed=A.grade({description:'Observed volunteers preparing 100 meals weekly.'});
 const done=A.grade({description:'Prepared 100 meals weekly.'});
 assert.ok(observed.score<done.score);assert.ok(!observed.why.includes('A concrete output or contribution is described.'));
 const mixed=A.grade({description:'Observed volunteers preparing meals; I packed 100 meals weekly.'});
 assert.ok(mixed.why.includes('A concrete output or contribution is described.'));
});
