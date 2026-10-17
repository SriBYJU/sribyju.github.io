import {test,expect} from '@playwright/test';
const harness='/scripts/ap-browser-harness.html';
async function open(page,id='apcsp'){await page.goto(harness);await page.waitForFunction(()=>!!window.ScholarkAP);await page.evaluate(id=>apOpenSubject(id),id);}
async function lesson(page,index=0){await page.locator('[data-ap-action="view"][data-id="units"]').click();await page.locator('[data-ap-action="open-unit"][data-id="'+index+'"]').click();}
test('untouched courses show zero progress and no invented readiness',async({page})=>{
 await page.goto(harness);await expect(page.locator('.ap2-course')).toHaveCount(23);
 expect(await page.locator('.ap2-ring span').allTextContents()).toEqual(Array(23).fill('0%'));
 await page.evaluate(()=>apOpenSubject('apcsp'));await expect(page.locator('.ap2-format-strip article').last()).toContainText('0%');await expect(page.locator('.ap2-score-circle strong')).toHaveText('—');
 expect(await page.locator('[role="progressbar"]').evaluateAll(nodes=>nodes.every(n=>n.getAttribute('aria-valuenow')==='0'))).toBe(true);
 await lesson(page);await expect(page.locator('#ap2-lesson-progress')).toContainText('0%');await page.reload();await expect(page.locator('.ap2-format-strip article').last()).toContainText('0%');
});
test('all courses provide enriched lessons, worked reasoning and retrieval',async({page})=>{
 test.setTimeout(90000);await open(page);const ids=await page.evaluate(()=>ScholarkAPData.subjects.map(s=>s.id));
 for(const id of ids){await page.evaluate(id=>apOpenSubject(id),id);await lesson(page);expect(await page.locator('.ap2-concept').count(),id).toBeGreaterThanOrEqual(4);await expect(page.getByRole('heading',{name:'Follow the reasoning'})).toBeVisible();await expect(page.getByRole('heading',{name:'Check your understanding'})).toBeVisible();await page.locator('.ap2-answer summary').click();await expect(page.locator('.ap2-answer p')).toBeVisible();}
});
test('review checklist persists and can be undone without awarding practice credit',async({page})=>{
 await open(page);await lesson(page);await page.locator('[data-ap-action="review-topic"]').first().click();await expect(page.locator('#ap2-lesson-progress')).toContainText('1 /');
 expect(await page.evaluate(()=>ScholarkAP.practiceProgress(ScholarkAPData.subjectMap.apcsp).completed)).toBe(0);
 await page.reload();await lesson(page);await expect(page.locator('[data-ap-action="review-topic"]').first()).toHaveAttribute('aria-pressed','true');await page.locator('[data-ap-action="review-topic"]').first().click();await expect(page.locator('#ap2-lesson-progress')).toContainText('0%');
});
test('notes, retrieval answer, navigation and added-topic teachback work',async({page})=>{
 await open(page);await lesson(page);await page.locator('#ap2-unit-note').fill('My private unit note');await page.getByRole('textbox',{name:'Your retrieval answer'}).fill('My answer before revealing');
 await page.locator('[data-ap-action="teachback"]').last().click();await page.locator('#ap2-teachback-answer').fill('The process matters because it connects evidence and testing. For example, a new test can reveal a boundary.');await page.locator('[data-ap-action="teachback-check"]').click();await expect(page.locator('#ap2-teachback-feedback')).toContainText('Completeness signal');
 await page.getByRole('button',{name:'Next unit →'}).click();await page.getByRole('button',{name:'← Previous unit'}).click();await expect(page.locator('#ap2-unit-note')).toHaveValue('My private unit note');await expect(page.getByRole('textbox',{name:'Your retrieval answer'})).toHaveValue('My answer before revealing');
});
test('wrong submissions earn distinct practice coverage but zero accuracy',async({page})=>{
 await open(page);await page.evaluate(()=>ScholarkAP.startSession('unit',0));const answer=await page.evaluate(()=>{const s=ScholarkAP.getState().subjects.apcsp.currentSession;const q=ScholarkAPData.subjectMap.apcsp.questions.find(q=>q.id===s.ids[s.idx]);return(q.answer+1)%4;});
 await page.locator(`[data-ap-action="session-option"][data-id="${answer}"]`).click();await page.locator('[data-ap-action="submit-answer"]').click();
 const r=await page.evaluate(()=>({p:ScholarkAP.practiceProgress(ScholarkAPData.subjectMap.apcsp),m:ScholarkAP.getState().subjects.apcsp.mastery[0],e:ScholarkAP.estimateScore()}));expect(r.p.completed).toBe(1);expect(r.m.score).toBe(0);expect(r.m.attempts).toBe(1);expect(r.e.taskPct).toBe(0);expect(r.e.ready).toBe(false);await page.reload();expect(await page.evaluate(()=>ScholarkAP.practiceProgress(ScholarkAPData.subjectMap.apcsp).completed)).toBe(1);
});
test('legacy untouched 50-percent rows become zero while real attempts survive',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('gs_ap_v2_ap-browser-harness-v2',JSON.stringify({subjects:{apcsp:{mastery:{0:{score:50,attempts:0,correct:0},1:{score:50,attempts:4,correct:3}}}}})));await open(page);const m=await page.evaluate(()=>ScholarkAP.getState().subjects.apcsp.mastery);expect(m[0].score).toBe(0);expect(m[1].score).toBe(75);expect(m[1].attempts).toBe(4);await expect(page.locator('.ap2-format-strip article').last()).toContainText('0%');
});
test('Statistics uses the 2027 outline and preserves legacy notes for download',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('gs_ap_v2_ap-browser-harness-v2',JSON.stringify({subjects:{apstats:{notes:{'unit-1':'Earlier regression notes'},responses:[{questionId:'old',correct:true}],mastery:{1:{score:90,attempts:4,correct:3}}}}})));await open(page,'apstats');await expect(page.getByText('Statistics course outline updated for 2027')).toBeVisible();expect(await page.evaluate(()=>ScholarkAP.getState().subjects.apstats.previousCurriculum.notes['unit-1'])).toBe('Earlier regression notes');await lesson(page,2);await expect(page.getByRole('heading',{name:'Unit 3: Inference for Categorical Data: Proportions',exact:true})).toBeVisible();await expect(page.locator('#ap2-lesson-progress')).toContainText('0%');const d=page.waitForEvent('download');await page.getByRole('button',{name:'Download previous progress and notes'}).click();expect((await d).suggestedFilename()).toContain('previous-progress');
});
test('accounts isolate notes and checklist including a late cloud read',async({page})=>{
 await open(page);await lesson(page);await page.locator('[data-ap-action="review-topic"]').first().click();await page.locator('#ap2-unit-note').fill('Only account A');await page.evaluate(()=>{window._dbGetSyncState=()=>new Promise(resolve=>window.resolveOldAP=resolve);ScholarkAP.init();});await page.evaluate(()=>{window._dbGetSyncState=async()=>[];window.currentUser={uid:'ap-other'};ScholarkAP.authChanged();apOpenSubject('apcsp');});await page.evaluate(()=>resolveOldAP([{id:'ap-v2',state:{updatedAt:'2099-01-01',subjects:{apcsp:{notes:{'unit-0':'LEAK'},mastery:{}}}}}]));await lesson(page);await expect(page.locator('#ap2-unit-note')).toHaveValue('');await expect(page.locator('#ap2-lesson-progress')).toContainText('0%');await page.evaluate(()=>{window.currentUser={uid:'ap-browser-harness-v2'};ScholarkAP.authChanged();apOpenSubject('apcsp');});await lesson(page);await expect(page.locator('#ap2-unit-note')).toHaveValue('Only account A');await expect(page.locator('[data-ap-action="review-topic"]').first()).toHaveAttribute('aria-pressed','true');
});
test('lesson fits mobile and controls remain usable',async({page})=>{
 await page.setViewportSize({width:360,height:780});await open(page,'apbio');await lesson(page);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.locator('[data-ap-action="review-topic"]').first().click();await expect(page.locator('#ap2-lesson-progress')).toContainText('1 /');await page.screenshot({path:test.info().outputPath('ap-crash-mobile.png'),fullPage:true});
});
test('the full website loads crash-course lessons through its AP entry point',async({page})=>{
 await page.goto('/',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.ScholarkFeatureLoader&&window.showPage);
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 // Keep this navigation fixture stable while Firebase resolves its real signed-out session.
 await page.evaluate(()=>{window.__apTestUser={uid:'ap-integration-a'};Object.defineProperty(window,'currentUser',{configurable:true,get:()=>window.__apTestUser,set:()=>{}});window._dbGetSyncState=async()=>[];window._dbSaveSyncState=async()=>{};});await page.locator('#nav-ap').click();await page.waitForFunction(()=>!!window.ScholarkAP&&!!window.ScholarkAPLessons);await page.evaluate(()=>apOpenSubject('apcsp'));
 expect(errors.filter(e=>/initAPHub|ScholarkAP/.test(e))).toEqual([]);
 await expect(page.locator('#page-ap')).toHaveClass(/active/);await lesson(page);await expect(page.getByRole('heading',{name:'Follow the reasoning'})).toBeVisible();await page.locator('#ap2-unit-note').fill('Account A private study note');
 await page.evaluate(()=>{window.__apTestUser={uid:'ap-integration-b'};updateNavForUser();apOpenSubject('apcsp');});await lesson(page);await expect(page.locator('#ap2-unit-note')).toHaveValue('');await expect(page.locator('#ap2-lesson-progress')).toContainText('0%');
});
test('obsolete or damaged unit rows do not invent progress or crash the overview',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('gs_ap_v2_ap-browser-harness-v2',JSON.stringify({subjects:{apcsp:{responses:[null],taskAttempts:[null],scoreHistory:[null],mastery:{0:{score:80,attempts:'Infinity',correct:8},999:{score:0,attempts:3,correct:0}}}}})));
 await open(page);await expect(page.locator('.ap2-format-strip article').last()).toContainText('0%');const m=await page.evaluate(()=>ScholarkAP.getState().subjects.apcsp.mastery);expect(m[999]).toBeUndefined();expect(m[0].score).toBe(0);
});
