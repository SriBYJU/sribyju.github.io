import {test,expect} from '@playwright/test';
test('an older rubric score is not silently reused in College Chances',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('scholark_admissions_v2_anon',JSON.stringify({activities:[],portfolio:{score:99,shape:'Strong',rubricVersion:'activities-1.0'}})));
 await page.goto('/?workspace=chances',{waitUntil:'domcontentloaded'});
 await expect(page.locator('#c-ecs')).toBeVisible();
 await expect(page.locator('#c-ecs')).toHaveValue('');
 await expect(page.locator('#sk-ec-linked')).toContainText('rubric updated');
});
async function preview(page,text){await page.goto('/?workspace=activities',{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'Bulk paste',exact:true}).click();await page.getByRole('textbox',{name:'Paste activities, one per line'}).fill(text);await page.getByRole('button',{name:'Preview cards'}).click();}
test('nested activity bullets import as two complete titled cards',async({page})=>{
 await preview(page,'1. Robotics Club\n- Built a robot for regional competition.\n- Taught 12 students programming.\n2. Food Bank\n- Prepared 100 meals each week.\n- Coordinated 8 volunteers.');
 await expect(page.locator('.sk-lab-import-row')).toHaveCount(2);await page.getByRole('button',{name:'Add 2 cards'}).click();await expect(page.locator('#sk-lab-cards>article')).toHaveCount(2);
 const rows=await page.evaluate(()=>JSON.parse(localStorage.getItem('scholark_admissions_v2_anon')).activities);
 expect(rows.map(a=>a.organization).sort()).toEqual(['Food Bank','Robotics Club']);expect(rows.find(a=>a.organization==='Robotics Club').notes).toContain('Taught 12 students');expect(rows.find(a=>a.organization==='Food Bank').notes).toContain('Coordinated 8');
});
test('two different roles at the same organization survive confirmation and reload',async({page})=>{
 await preview(page,'Position\tOrganization\tDescription\nLab assistant\tCounty Hospital\tTested water samples and analyzed the results.\nReceptionist\tCounty Hospital\tScheduled patient appointments and answered telephone calls.');
 await expect(page.locator('.sk-lab-import-row')).toHaveCount(2);await page.getByRole('button',{name:'Add 2 cards'}).click();await page.reload();await expect(page.locator('#sk-lab-cards>article')).toHaveCount(2);
 const rows=await page.evaluate(()=>JSON.parse(localStorage.getItem('scholark_admissions_v2_anon')).activities);expect(rows.map(a=>a.position).sort()).toEqual(['Lab assistant','Receptionist']);
});
test('service contribution synonyms receive equivalent preview scores',async({page})=>{
 await preview(page,'1. Service A\nServed 100 meals weekly with 8 volunteers.\n2. Service B\nPrepared 100 meals weekly with 8 volunteers.\n3. Service C\nPacking 100 meals weekly with 8 volunteers.');
 await expect(page.locator('.sk-lab-import-row')).toHaveCount(3);
 const scores=await page.locator('.sk-lab-import-row').allTextContents();expect(new Set(scores.map(t=>t.match(/Evidence rubric: (\d+)/)[1])).size).toBe(1);
});
test('reopening bulk paste preserves one pending import and its edited preview',async({page})=>{
 await preview(page,'1. Science Workshop\nTaught 18 students and created weekly science lessons.');
 await page.getByRole('textbox',{name:'Activity title / organization'}).fill('Peer Science Workshop');
 await page.getByRole('button',{name:'Bulk paste',exact:true}).click();
 await expect(page.getByRole('textbox',{name:'Paste activities, one per line'})).toHaveCount(1);
 await expect(page.getByRole('textbox',{name:'Activity title / organization'})).toHaveValue('Peer Science Workshop');
 await page.getByRole('button',{name:'Add 1 cards'}).click();
 await expect(page.locator('#sk-lab-cards>article')).toHaveCount(1);
 await expect(page.locator('#sk-lab-cards')).toContainText('Peer Science Workshop');
});
