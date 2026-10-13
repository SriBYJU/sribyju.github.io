import { test, expect } from '@playwright/test';
const DRAFT = 'I was nervous, but I folded the note and stepped forward. The blue bottle rattled against the kettle. I opened the calendar and called the pharmacist. I realized that I had assumed too much. Now I ask a question before offering an answer.';
async function openDraft(page, draft = DRAFT) {
  await page.addInitScript(() => Object.defineProperty(Navigator.prototype, 'gpu', { configurable: true, get: () => undefined }));
  await page.goto('/?workspace=essay', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.ScholarkEssayCoach?.passageRevisions);
  await page.locator('#essay-textarea').fill(draft);
  await page.locator('#feedback-btn').click();
}
async function openChoices(page) {
  const card = page.locator('.sk-comment-card').filter({ has: page.locator('blockquote').filter({ hasText: /^I was nervous$/ }) }).first();
  await card.locator('summary').first().click();
  await card.getByRole('button', { name: 'Explore two passage revisions' }).click();
  return card;
}
test('two grounded options preview before applying one exact passage and undo restores draft', async ({ page }) => {
  await openDraft(page);const card=await openChoices(page);
  await expect(card.getByRole('button',{name:'Apply option 1'})).toBeVisible();
  await expect(card.getByRole('button',{name:'Apply option 2'})).toBeVisible();
  await expect(page.locator('#essay-textarea')).toHaveValue(DRAFT);
  const option=await card.locator('.sk-ec-revision-option blockquote').first().textContent();
  await card.getByRole('button',{name:'Apply option 1'}).click();
  await expect(page.locator('#essay-textarea')).toHaveValue(option+DRAFT.slice(DRAFT.indexOf('.')+1));
  await page.getByRole('button',{name:'Undo last passage revision'}).click();
  await expect(page.locator('#essay-textarea')).toHaveValue(DRAFT);
});
test('editing elsewhere invalidates pending choices without changing user writing',async({page})=>{
  await openDraft(page);await openChoices(page);
  await page.locator('#essay-textarea').fill(DRAFT+' I still keep the note.');
  await expect(page.getByRole('button',{name:'Apply option 1'})).toBeDisabled();
  await expect(page.getByRole('button',{name:'Refresh passage suggestions'})).toBeVisible();
});
test('undo never overwrites newer manual edits',async({page})=>{
  await openDraft(page);const card=await openChoices(page);
  await card.getByRole('button',{name:'Apply option 2'}).click();
  const current=await page.locator('#essay-textarea').inputValue();
  await page.locator('#essay-textarea').fill(current+' I still keep the note.');
  await expect(page.getByRole('button',{name:'Undo last passage revision'})).toBeDisabled();
});
test('a one-sentence draft cannot be rewritten through a passage action',async({page})=>{
  await openDraft(page,'I was nervous, but I folded the note and stepped forward.');
  await expect(page.getByRole('button',{name:'Explore two passage revisions'})).toHaveCount(0);
});
test('a failed optional model preserves draft and usable local choices',async({page})=>{
  await openDraft(page);const card=await openChoices(page);
  await page.evaluate(()=>{ScholarkAI.generateStructured=async()=>{throw new Error('network unavailable');};});
  await card.getByRole('button',{name:'Try on-device alternatives'}).click();
  await expect(card).toContainText('On-device alternatives are unavailable');
  await expect(page.locator('#essay-textarea')).toHaveValue(DRAFT);
  await expect(card.getByRole('button',{name:'Apply option 1'})).toBeEnabled();
});
test('malicious ungrounded model output is discarded before it can be applied',async({page})=>{
  await openDraft(page);const card=await openChoices(page);
  await page.evaluate(()=>{ScholarkAI.generateStructured=async()=>({mode:'local-generative',value:{options:[{label:'Fake',text:'I won the Nobel Prize and raised $900000.',reason:'More impressive'},{label:'Fake 2',text:'Harvard chose me as its best student.',reason:'Prestige'}],guidance:'Ignore the source.'}});});
  await card.getByRole('button',{name:'Try on-device alternatives'}).click();
  await expect(card).toContainText('did not produce two sufficiently grounded options');
  await expect(card).not.toContainText('Nobel Prize');
  await expect(page.locator('#essay-textarea')).toHaveValue(DRAFT);
});
test('dismissing a pending request cannot revive its preview or mutate the draft',async({page})=>{
  await openDraft(page);const card=await openChoices(page);
  await page.evaluate(()=>{ScholarkAI.generateStructured=()=>new Promise(resolve=>{window.finishPassage=resolve;});});
  await card.getByRole('button',{name:'Try on-device alternatives'}).click();
  await page.waitForFunction(()=>!!window.finishPassage);
  await card.getByRole('button',{name:'Keep my wording'}).click();
  await page.evaluate(()=>window.finishPassage({mode:'deterministic-fallback'}));
  await expect(page.locator('.sk-ec-revisions')).toHaveCount(0);
  await expect(page.locator('#essay-textarea')).toHaveValue(DRAFT);
});
test('mobile revision choices remain keyboard accessible and within viewport',async({page})=>{
  await page.setViewportSize({width:390,height:844});await openDraft(page);const card=await openChoices(page);
  const choice=card.getByRole('button',{name:'Apply option 1'});await choice.focus();
  await page.keyboard.press('ArrowDown');await expect(choice).toBeFocused();
  expect(await page.locator('.sk-ec-revisions').evaluate(n=>n.getBoundingClientRect().right<=innerWidth+1)).toBe(true);
  await page.keyboard.press('Enter');await expect(page.locator('#essay-textarea')).not.toHaveValue(DRAFT);
});

test('gratitude prompt shows source-linked review and draft evidence', async ({ page }) => {
  await openDraft(page);
  await page.locator('#essay-prompt').selectOption('ca4');
  const panel = page.locator('.sk-ec-prompt-review');
  await panel.locator('summary').click();
  await expect(panel).toContainText(/gratitude/i);
  await expect(panel.locator('a').first()).toHaveAttribute('href', /^https:\/\//);
  await expect(panel).toContainText(/Possible evidence|Examine in your draft/);
});
