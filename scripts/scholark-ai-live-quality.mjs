import { chromium } from 'playwright';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

if (process.env.SCHOLARK_REAL_AI !== '1') {
  console.log('Live local-model evaluation downloads model weights. Run with SCHOLARK_REAL_AI=1. Optional: SCHOLARK_BASE_URL, SCHOLARK_AI_PROFILE, SCHOLARK_CHROME_PATH, SCHOLARK_AI_REPORT.');
  process.exit(0);
}
const profile = process.env.SCHOLARK_AI_PROFILE || fs.mkdtempSync(path.join(os.tmpdir(), 'scholark-ai-quality-'));
const browser = await chromium.launchPersistentContext(profile, { headless: true, ...(process.env.SCHOLARK_CHROME_PATH ? { executablePath: process.env.SCHOLARK_CHROME_PATH } : {}), args: ['--enable-unsafe-webgpu'] });
const page = browser.pages()[0];
// Disable HTTP cache for app scripts; preserve Cache API model weights.
const devtools = await browser.newCDPSession(page);
await devtools.send("Network.enable");
await devtools.send("Network.setCacheDisabled", {cacheDisabled: true});
const output = process.env.SCHOLARK_AI_REPORT || path.join(os.tmpdir(), 'scholark-ai-quality.jsonl');
console.log(`Report: ${output}`);
fs.writeFileSync(output, '');
await page.exposeFunction('reportCase', row => {const line=JSON.stringify(row); fs.appendFileSync(output,line+'\n'); console.log(line);});
try {
 await page.goto(process.env.SCHOLARK_BASE_URL || 'http://127.0.0.1:4173', {waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>!!window.ScholarkAIReliability,null,{timeout:45000});
 await page.evaluate(async()=>{
  const inputs=[
   'hey', 'who made u', 'what are the different types of AIs in Scholark?', 'Does this chat use computer vision?',
   'Recommend a good Netflix show', "What's McDonald's most popular order?", 'Where should I get pizza tonight?', 'What should I watch tonight?',
   'What is 6+7?', 'Calculate (2+3)*4', 'What is 1/2+1/4?', 'Calculate -2^2', 'What is 1/0?',
   'A plant gets most of its dry mass from soil, right? Explain.', 'Is breaking chemical bonds what releases energy? Explain.',
   'Explain random assignment and random sampling', 'Does correlation prove causation?', 'How do residuals work?',
   'Explain why binary search needs a sorted list', 'Solve 3(x - 2) = 15 and check your answer.',
   'What is the difference between a metaphor and a simile?', 'How do I write a thesis statement?', 'Why did World War I start?',
   'How should I study for a biology test?', 'How do enzymes work?', 'Explain subject-verb agreement for the SAT.',
   'How can I improve my college essay?', 'Write my college admissions essay for me', 'Can you rewrite my opening paragraph?',
   'How is my AP progress?', 'How is my SAT progress?', 'Make a study plan', 'Compare colleges', 'Find scholarships',
   'What will the exact SAT cutoff be for Harvard next year?', 'How do I know whether your reply is AI or guided help?'
  ];
  for(let i=0;i<inputs.length;i++) {
   const input=inputs[i],start=performance.now();
   try {const r=await window.ScholarkAIAgents.ask(input); await window.reportCase({index:i+1,input,route:r.route?.agent,mode:r.mode,tier:r.tier,answer:r.answer,sources:r.sources,elapsed:Math.round(performance.now()-start)});}
   catch(error){await window.reportCase({index:i+1,input,error:String(error)});}
  }
 });
} finally {await Promise.race([browser.close(), new Promise(resolve => setTimeout(resolve, 5000))]);}
process.exit(0);
