import {test,expect} from '@playwright/test';
const DRAFT='I was nervous, but I folded the note and stepped forward. The blue bottle rattled against the kettle as I opened the calendar. I had counted the appointments, but I had never asked which ones mattered most to my grandmother. She pointed to the bus timetable instead of my careful chart. I realized that I had confused keeping a schedule with listening. Now I ask a question before offering an answer. The calendar still hangs on the kitchen wall, with room for her own notes between mine.';
async function open(page){
 await page.addInitScript(()=>Object.defineProperty(Navigator.prototype,'gpu',{configurable:true,get:()=>undefined}));
 await page.goto('/?workspace=essay',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.ScholarkEssayStudio&&document.querySelector('#sk-essay-studio'));
 await page.locator('#essay-textarea').fill(DRAFT);await page.locator('#feedback-btn').click();
 // Finish the real runtime installation before substituting model responses.
 await page.evaluate(()=>ScholarkFeatureLoader.ensure('ai'));
 await page.evaluate(()=>{
  const draft=document.querySelector('#essay-textarea').value;
  const quotes=['I folded the note and stepped forward','The blue bottle rattled against the kettle','I had confused keeping a schedule with listening','Now I ask a question before offering an answer','with room for her own notes between mine'];
  const value={dimensions:ScholarkEssayAI.rubric.map((r,i)=>({id:r.id,score:3,evidence_quote:quotes[i],explanation:r.label+' is visible here, but the connection to the later decision could be developed.'})),comments:[{quote:'I was nervous, but I folded the note and stepped forward.',why:'The named feeling repeats what the folded note and tentative movement can already suggest.',goal:'Let the physical action carry the feeling',question:''}]};
  window.studioReview=ScholarkEssayAI.validateReview(value,draft,document.querySelector('#essay-prompt').value||'ca7').value;
  ScholarkEssayAI.review=async()=>({ok:true,review:window.studioReview});
  ScholarkEssayAI.revise=async()=>({ok:true,options:[{label:'Action first',text:'I folded the note and stepped forward.',reason:'The action replaces the emotion label.'},{label:'Two beats',text:'I folded the note. I stepped forward.',reason:'A pause gives each action its own emphasis.'}]});
 });
}
async function review(page){await page.locator('#sk-essay-studio').getByRole('button',{name:'Run AI review',exact:true}).click();await expect(page.locator('.sk-studio-grade strong')).toHaveText('75');}
test('AI grade replaces rule score only after validated model review and links provenance',async({page})=>{
 await open(page);await review(page);await expect(page.locator('#sk-ec-summary')).toContainText('AI writing review');
 await page.locator('#sk-essay-studio').getByRole('button',{name:'Use AI score in Chances'}).click();await expect(page.locator('#c-essays')).toHaveValue('75');await expect(page.locator('#sk-essay-linked')).toContainText('AI writing review');
});
test('two AI options preview, apply only one passage, and undo restores the exact draft',async({page})=>{
 await open(page);await review(page);const comment=page.locator('.sk-studio-comment');await comment.locator('summary').click();await comment.getByRole('button',{name:'Get two revision options'}).click();
 await expect(comment.getByRole('button',{name:'Apply AI option 2'})).toBeVisible();await expect(page.locator('#essay-textarea')).toHaveValue(DRAFT);
 await comment.getByRole('button',{name:'Apply AI option 1'}).click();await expect(page.locator('#essay-textarea')).toHaveValue('I folded the note and stepped forward.'+DRAFT.slice(DRAFT.indexOf('.')+1));
 await expect(page.locator('.sk-studio-grade')).toHaveCount(0);await page.getByRole('button',{name:'Undo AI passage edit'}).click();await expect(page.locator('#essay-textarea')).toHaveValue(DRAFT);
});
test('AI grade is invalidated by edits and a late review cannot replace the new draft',async({page})=>{
 await open(page);await page.evaluate(()=>{ScholarkEssayAI.review=()=>new Promise(resolve=>window.releaseReview=resolve);});
 await page.locator('#sk-essay-studio').getByRole('button',{name:'Run AI review',exact:true}).click();await page.waitForFunction(()=>!!window.releaseReview);
 await page.locator('#essay-textarea').fill(DRAFT+' I still listen.');await page.evaluate(()=>window.releaseReview({ok:true,review:window.studioReview}));await expect(page.locator('.sk-studio-grade')).toHaveCount(0);await expect(page.locator('#essay-textarea')).toHaveValue(DRAFT+' I still listen.');
});
test('unavailable AI never displays a fabricated AI grade and can be retried',async({page})=>{
 await open(page);await page.evaluate(()=>{ScholarkEssayAI.review=async()=>({ok:false,message:'Model unavailable; no AI grade assigned.'});});
 await page.locator('#sk-essay-studio').getByRole('button',{name:'Run AI review',exact:true}).click();await expect(page.locator('#sk-studio-status')).toContainText('no AI grade assigned');await expect(page.locator('.sk-studio-grade')).toHaveCount(0);await expect(page.locator('#sk-essay-studio').getByRole('button',{name:'Run AI review',exact:true})).toBeEnabled();
});
test('essay chat carries the current draft and follow-up context without applying prose',async({page})=>{
 await open(page);await page.evaluate(()=>{ScholarkAI.generateStructured=async(messages)=>{window.chatRequest=messages;return{mode:'local-generative',value:{answer:'The schedule becomes more revealing when you contrast it with listening. What changed in the next conversation?',evidence_quote:'I had confused keeping a schedule with listening'}};};});
 await page.locator('#sk-essay-studio').getByRole('button',{name:'Essay chat',exact:true}).click();await page.locator('#sk-studio-question').fill('Why does my reflection need more depth?');await page.locator('#sk-studio-question').press('Enter');
 await expect(page.locator('.sk-studio-message[data-role=assistant]')).toContainText('What changed');expect(await page.evaluate(()=>chatRequest[1].content)).toContain(DRAFT);await expect(page.locator('#essay-textarea')).toHaveValue(DRAFT);
});
test('essay chat redirects restaurant questions and refuses whole essay replacement',async({page})=>{
 await open(page);await page.locator('#sk-essay-studio').getByRole('button',{name:'Essay chat',exact:true}).click();
 for(const [question,answer]of [['Where is the nearest McDonalds?','focuses on your essay'],['Rewrite my whole essay with your fixes','full replacement']]){await page.locator('#sk-studio-question').fill(question);await page.locator('#sk-studio-question').press('Enter');await expect(page.locator('.sk-studio-message[data-role=assistant]').last()).toContainText(answer);}
 await expect(page.locator('#essay-textarea')).toHaveValue(DRAFT);
});
test('malicious generated revisions cannot become an apply button',async({page})=>{
 await open(page);await review(page);await page.evaluate(()=>{ScholarkEssayAI.revise=async()=>({ok:true,options:[{label:'Invent',text:'I won the Nobel Prize.',reason:'Fame'},{label:'Invent again',text:'I raised $900000.',reason:'Impact'}]});});const comment=page.locator('.sk-studio-comment');await comment.locator('summary').click();await comment.getByRole('button',{name:'Get two revision options'}).click();await expect(page.locator('button').filter({hasText:/Apply AI option/})).toHaveCount(0);await expect(page.locator('#essay-textarea')).toHaveValue(DRAFT);
});
test('mobile studio fits the viewport and supports keyboard chat',async({page})=>{
 await page.setViewportSize({width:390,height:844});await open(page);expect(await page.locator('#sk-essay-studio').evaluate(n=>n.getBoundingClientRect().right<=innerWidth+1)).toBe(true);await page.locator('#sk-essay-studio').getByRole('button',{name:'Essay chat',exact:true}).click();await expect(page.locator('#sk-studio-question')).toBeFocused();
});

test('stopping a pending review prevents a late grade from appearing',async({page})=>{
 await open(page);await page.evaluate(()=>{ScholarkEssayAI.review=()=>new Promise(resolve=>window.releaseStoppedReview=resolve);});
 await page.locator('#sk-essay-studio').getByRole('button',{name:'Run AI review',exact:true}).click();await page.waitForFunction(()=>!!window.releaseStoppedReview);
 await page.locator('#sk-essay-studio').getByRole('button',{name:'Stop',exact:true}).click();await page.evaluate(()=>window.releaseStoppedReview({ok:true,review:window.studioReview}));
 await expect(page.locator('.sk-studio-grade')).toHaveCount(0);await expect(page.locator('#sk-studio-status')).toContainText('Stopped');await expect(page.locator('#essay-textarea')).toHaveValue(DRAFT);
});
test('chat formats bold and bullet text without executing model HTML',async({page})=>{
 await open(page);await page.evaluate(()=>{ScholarkAI.generateStructured=async()=>({mode:'local-generative',value:{answer:'**Revision priority**\n- Clarify the choice.\n- <img src=x onerror="window.badStudioHTML=true">',evidence_quote:'I folded the note'}});});
 await page.locator('#sk-essay-studio').getByRole('button',{name:'Essay chat',exact:true}).click();await page.locator('#sk-studio-question').fill('What should I change in my opening?');await page.locator('#sk-studio-question').press('Enter');
 const reply=page.locator('.sk-studio-message[data-role=assistant]');await expect(reply.locator('strong').last()).toHaveText('Revision priority');await expect(reply.locator('li')).toHaveCount(2);await expect(reply.locator('img')).toHaveCount(0);expect(await page.evaluate(()=>window.badStudioHTML)).toBeUndefined();
});
test('a changed draft rejects late passage options and a new account loses the review',async({page})=>{
 await open(page);await review(page);await page.evaluate(()=>{ScholarkEssayAI.revise=()=>new Promise(resolve=>window.releaseOptions=resolve);});
 const c=page.locator('.sk-studio-comment');await c.locator('summary').click();await c.getByRole('button',{name:'Get two revision options'}).click();await page.waitForFunction(()=>!!window.releaseOptions);
 await page.locator('#essay-textarea').fill(DRAFT+' A new ending.');await page.evaluate(()=>window.releaseOptions({ok:true,options:[]}));await expect(page.getByRole('button',{name:/Apply AI option/})).toHaveCount(0);
 await page.locator('#essay-textarea').fill(DRAFT);await review(page);await page.evaluate(()=>{window.currentUser={uid:'studio-other-account'};ScholarkEssayStudio.mount();});await expect(page.locator('.sk-studio-grade')).toHaveCount(0);
});

test('student-selected passages are labeled honestly and whole-draft selection is refused',async({page})=>{
 await open(page);await review(page);await page.locator('#essay-textarea').evaluate(t=>{const q='The blue bottle rattled against the kettle as I opened the calendar.';const i=t.value.indexOf(q);t.setSelectionRange(i,i+q.length);});
 await page.getByRole('button',{name:'Explore selected passage',exact:true}).click();await expect(page.locator('.sk-studio-comment').last()).toContainText('Selected by you');
 await page.locator('#essay-textarea').evaluate(t=>t.setSelectionRange(0,t.value.length));await page.getByRole('button',{name:'Explore selected passage',exact:true}).click();await expect(page.locator('#sk-studio-status')).toContainText('shorter than the whole draft');await expect(page.locator('#essay-textarea')).toHaveValue(DRAFT);
});
