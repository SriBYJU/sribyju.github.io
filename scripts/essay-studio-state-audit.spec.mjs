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

test('unsent essay question survives selecting a passage and switching tabs',async({page})=>{
 await open(page);await page.locator('#sk-essay-studio').getByRole('button',{name:'Essay chat',exact:true}).click();
 await page.locator('#sk-studio-question').fill('How can this opening convey the change in my thinking?');
 await page.locator('#essay-textarea').evaluate(t=>t.setSelectionRange(0,54));
 await page.getByRole('button',{name:'Discuss selected text',exact:true}).click();
 await expect(page.locator('#sk-studio-question')).toHaveValue('How can this opening convey the change in my thinking?');
 await page.locator('#sk-essay-studio').getByRole('button',{name:'Review & revisions',exact:true}).click();
 await page.locator('#sk-essay-studio').getByRole('button',{name:'Essay chat',exact:true}).click();
 await expect(page.locator('#sk-studio-question')).toHaveValue('How can this opening convey the change in my thinking?');
});
test('changing account clears the selected private passage from essay chat',async({page})=>{
 await open(page);await page.locator('#sk-essay-studio').getByRole('button',{name:'Essay chat',exact:true}).click();
 await page.locator('#essay-textarea').evaluate(t=>t.setSelectionRange(0,54));await page.getByRole('button',{name:'Discuss selected text',exact:true}).click();
 await expect(page.locator('#sk-essay-studio > blockquote')).toContainText('I was nervous');
 await page.evaluate(()=>{window.currentUser={uid:'another-student'};ScholarkEssayStudio.mount();});
 await expect(page.locator('#sk-essay-studio > blockquote')).toHaveCount(0);
});
test('general essay craft advice is allowed without a fabricated draft quotation',async({page})=>{
 await open(page);await page.evaluate(()=>{ScholarkAI.generateStructured=async(_,opts)=>{const value={answer:'A strong opening introduces a meaningful situation and gives the reader a reason to keep reading. Start with a specific moment that connects to the change your essay explores.',evidence_quote:''};window.generalValidation=opts.validate(value);return window.generalValidation.valid?{mode:'local-generative',value}:{mode:'guided-help'};};});
 await page.locator('#sk-essay-studio').getByRole('button',{name:'Essay chat',exact:true}).click();await page.locator('#sk-studio-question').fill('What makes a strong college essay opening?');await page.locator('#sk-studio-question').press('Enter');
 await expect(page.locator('.sk-studio-message[data-role=assistant]').last()).toContainText('A strong opening introduces');
});

test('draft-specific how questions still require exact supporting evidence',async({page})=>{
 await open(page);await page.evaluate(()=>{ScholarkAI.generateStructured=async(_,opts)=>{const value={answer:'Your opening has no scene or meaningful detail and should be replaced.',evidence_quote:''};return opts.validate(value).valid?{mode:'local-generative',value}:{mode:'guided-help'};};});
 await page.locator('#sk-essay-studio').getByRole('button',{name:'Essay chat',exact:true}).click();await page.locator('#sk-studio-question').fill('How can my opening improve?');await page.locator('#sk-studio-question').press('Enter');
 await expect(page.locator('.sk-studio-message[data-role=assistant]').last()).toContainText('did not return a supported answer');
});
test('a stopped revision failure cannot overwrite options from a later retry',async({page})=>{
 await open(page);await review(page);await page.evaluate(()=>{window.goodRevise=ScholarkEssayAI.revise;ScholarkEssayAI.revise=()=>new Promise((_,reject)=>window.failOldRevision=reject);});
 let c=page.locator('.sk-studio-comment');await c.locator('summary').click();await c.getByRole('button',{name:'Get two revision options'}).click();await page.waitForFunction(()=>!!window.failOldRevision);
 await page.locator('#sk-essay-studio').getByRole('button',{name:'Stop',exact:true}).click();await page.evaluate(()=>{ScholarkEssayAI.revise=window.goodRevise;});
 c=page.locator('.sk-studio-comment');await c.locator('summary').click();await c.getByRole('button',{name:'Get two revision options'}).click();await expect(c.getByRole('button',{name:'Apply AI option 1'})).toBeVisible();
 await page.evaluate(()=>window.failOldRevision(new Error('late old failure')));await page.locator('#sk-essay-studio').getByRole('button',{name:'Essay chat',exact:true}).click();await page.locator('#sk-essay-studio').getByRole('button',{name:'Review & revisions',exact:true}).click();
 await expect(page.getByRole('button',{name:'Apply AI option 1'})).toBeVisible();
});

test('stopped review progress and failure cannot replace the successful retry status',async({page})=>{
 await open(page);await page.evaluate(()=>{window.goodReview=ScholarkEssayAI.review;ScholarkEssayAI.review=({onProgress})=>new Promise((_,reject)=>{window.failOldReview=reject;window.oldReviewProgress=onProgress;});});
 await page.locator('#sk-essay-studio').getByRole('button',{name:'Run AI review',exact:true}).click();await page.waitForFunction(()=>!!window.failOldReview);
 await page.locator('#sk-essay-studio').getByRole('button',{name:'Stop',exact:true}).click();await page.evaluate(()=>{ScholarkEssayAI.review=window.goodReview;});await review(page);
 await page.evaluate(()=>{window.oldReviewProgress('Old model is still reading');window.failOldReview(new Error('late failure'));});
 await expect(page.locator('#sk-studio-status')).toContainText('AI review complete');await expect(page.locator('.sk-studio-grade strong')).toHaveText('75');
});
test('mobile selected passage options stay within the viewport and undo only the chosen edit',async({page})=>{
 await page.setViewportSize({width:360,height:800});await open(page);await review(page);const c=page.locator('.sk-studio-comment');await c.locator('summary').click();await c.getByRole('button',{name:'Get two revision options'}).click();
 await expect(c.getByRole('button',{name:'Apply AI option 2'})).toBeVisible();expect(await c.evaluate(n=>n.getBoundingClientRect().right<=innerWidth+1)).toBe(true);
 await c.getByRole('button',{name:'Apply AI option 2'}).click();await expect(page.locator('#essay-textarea')).toHaveValue('I folded the note. I stepped forward.'+DRAFT.slice(DRAFT.indexOf('.')+1));
 await page.getByRole('button',{name:'Undo AI passage edit'}).click();await expect(page.locator('#essay-textarea')).toHaveValue(DRAFT);
});
test('account changes do not retain an unsent private essay question',async({page})=>{
 await open(page);await page.locator('#sk-essay-studio').getByRole('button',{name:'Essay chat',exact:true}).click();await page.locator('#sk-studio-question').fill('Should I mention the private appointment in my opening?');
 await page.evaluate(()=>{window.currentUser={uid:'another-student'};ScholarkEssayStudio.mount();});
 await expect(page.locator('#sk-studio-question')).toHaveValue('');
});
test('sent questions and Clear conversation leave an empty composer',async({page})=>{
 await open(page);await page.locator('#sk-essay-studio').getByRole('button',{name:'Essay chat',exact:true}).click();await page.locator('#sk-studio-question').fill('Where is the nearest McDonalds?');await page.locator('#sk-studio-question').press('Enter');
 await expect(page.locator('.sk-studio-message[data-role=assistant]').last()).toContainText('focuses on your essay');await expect(page.locator('#sk-studio-question')).toHaveValue('');
 await page.locator('#sk-studio-question').fill('An unsent question');await page.getByRole('button',{name:'Clear conversation',exact:true}).click();await expect(page.locator('#sk-studio-question')).toHaveValue('');
});

test('real auth refresh separates private drafts and pending activity imports between accounts',async({page})=>{
 await open(page);
 await page.evaluate(()=>{window.currentUser={uid:'privacy-a'};updateNavForUser();});
 await page.locator('#essay-textarea').fill('Account A private draft, retained only for its owner.');
 await page.locator('#essay-prompt').selectOption('ca2');
 await page.evaluate(()=>ScholarkAdmissionsUI.open('activities'));
 await page.getByRole('button',{name:'Bulk paste',exact:true}).click();
 await page.getByLabel('Paste activities, one per line').fill('PRIVATE A IMPORT: Tutored 12 students in algebra each week.');
 await page.evaluate(()=>{window.currentUser={uid:'privacy-b'};updateNavForUser();});
 await expect(page.getByLabel('Paste activities, one per line')).toHaveCount(0);
 await expect(page.locator('#essay-textarea')).toHaveValue('');
 await page.evaluate(()=>ScholarkAdmissionsUI.open('essay'));
 await page.locator('#essay-textarea').fill('Account B private draft.');
 await page.evaluate(()=>{window.currentUser={uid:'privacy-a'};updateNavForUser();});
 await expect(page.locator('#essay-textarea')).toHaveValue('Account A private draft, retained only for its owner.');
 await expect(page.locator('#essay-prompt')).toHaveValue('ca2');
 await expect.poll(()=>page.evaluate(()=>localStorage.getItem('scholark:v3:field:essay:main:essay-textarea'))).toBeNull();
 await page.evaluate(()=>{window.currentUser=null;updateNavForUser();});
 await expect(page.locator('#essay-textarea')).toHaveValue(DRAFT);
});

test('working draft survives reload without overwriting explicitly saved essays',async({page})=>{
 await open(page);
 await page.evaluate(()=>localStorage.setItem('gs_essays_saved-owner',JSON.stringify([{id:'keep-me',text:'Previously saved essay',title:'Saved title'}])));
 await page.locator('#essay-textarea').fill('Unsaved working copy survives a refresh.');
 await page.locator('#essay-prompt').selectOption('ca5');
 await page.reload();await page.waitForFunction(()=>window.ScholarkAdmissionsUI&&document.querySelector('#sk-essay-studio'));
 await expect(page.locator('#essay-textarea')).toHaveValue('Unsaved working copy survives a refresh.');
 await expect(page.locator('#essay-prompt')).toHaveValue('ca5');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('gs_essays_saved-owner'))[0].text)).toBe('Previously saved essay');
});

test('unowned legacy draft is preserved for recovery without exposing it to an account',async({page})=>{
 await page.addInitScript(()=>{localStorage.setItem('scholark:v3:field:essay:main:essay-textarea',JSON.stringify('Unowned legacy private essay'));localStorage.setItem('gs_essays_previous',JSON.stringify([{id:'old',text:'Old explicitly saved essay'}]));});
 await page.goto('/?workspace=essay');await page.waitForFunction(()=>window.ScholarkAdmissionsUI&&document.querySelector('#sk-essay-studio'));
 await page.evaluate(()=>{window.currentUser={uid:'new-account'};updateNavForUser();});
 await expect(page.locator('#essay-textarea')).toHaveValue('');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('scholark_legacy_unassigned_essay-textarea')))).toBe('Unowned legacy private essay');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('gs_essays_previous'))[0].text)).toBe('Old explicitly saved essay');
});

test('owned older autosave migrates once and a deliberately cleared draft stays empty',async({page})=>{
 await page.addInitScript(()=>{
   if(!localStorage.getItem('migration-seeded')){
     localStorage.setItem('migration-seeded','1');
     localStorage.setItem('scholark_ai_v1_essay_autosave_local',JSON.stringify({text:'Older private working draft',prompt:'ca2'}));
   }
 });
 await page.goto('/?workspace=essay');await page.waitForFunction(()=>window.ScholarkAIUI&&document.querySelector('#sk-essay-studio'));
 await expect(page.locator('#essay-textarea')).toHaveValue('Older private working draft');
 await expect(page.locator('#essay-prompt')).toHaveValue('ca2');
 await page.locator('#essay-textarea').fill('');
 await page.reload();await page.waitForFunction(()=>window.ScholarkAIUI&&document.querySelector('#sk-essay-studio'));
 await expect(page.locator('#essay-textarea')).toHaveValue('');
});
