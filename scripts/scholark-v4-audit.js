import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const failures = [];
const checks = [];
const check = (name, ok, detail='') => { checks.push({name,ok,detail}); if(!ok) failures.push(name + (detail ? ` — ${detail}` : '')); };

for (const file of ['scholark-v3.js','scholark-v4-data.js','scholark-v4.js']) {
  try { execFileSync(process.execPath, ['--check', path.join(root,file)], {stdio:'pipe'}); check(`${file} syntax`, true); }
  catch (error) { check(`${file} syntax`, false, String(error.stderr || error.message)); }
}

const v3 = read('scholark-v3.js');
const v4 = read('scholark-v4.js');
const css = read('scholark-v4.css');
const data = read('scholark-v4-data.js');
const index = read('index.html');

check('V4 loader references data file', v3.includes("scholark-v4-data.js"));
check('V4 loader references app file', v3.includes("scholark-v4.js"));
check('V4 stylesheet loader exists', v4.includes("scholark-v4.css"));
check('College Intelligence page exists', v4.includes("page-intelligence") || v4.includes("ensurePage('intelligence'"));
check('Career Outcomes page exists', v4.includes("ensurePage('careers'"));
check('Methodology page exists', v4.includes("ensurePage('methodology'"));
check('Command palette exists', v4.includes('sk4-command-overlay'));
check('Focus timer exists', v4.includes('sk4-focus-overlay'));
check('Quick notes exists', v4.includes('sk4-note-overlay'));
check('Pinned tools exists', v4.includes("safeGet('pins'"));
check('College methodology formula exists', v4.includes('Value Lens ='));
check('Career methodology formula exists', v4.includes('Career Momentum ='));
check('Public source metadata exists', data.includes('U.S. Department of Education') && data.includes('U.S. Bureau of Labor Statistics'));
check('Career dataset has multiple profiles', (data.match(/source:'BLS/g)||[]).length >= 8);
check('V4 visible design layer is substantial', css.length > 12000, `${css.length} bytes`);
check('AP dedicated app preserved', index.includes('ap-v2-app.js'));
check('SAT/ACT dedicated app preserved', index.includes('prep-v2-app.js'));
check('Legacy V3 loader preserved', index.includes('scholark-v3.js'));
check('No Pro upgrade gate returned', !/Upgrade to Pro to access/i.test(index));

const idMatches = [...v4.matchAll(/id=\\?"([A-Za-z0-9_-]+)\\?"/g)].map(m=>m[1]);
const duplicates = idMatches.filter((id,i,a)=>a.indexOf(id)!==i);
check('No duplicate static V4 template IDs', duplicates.length===0, duplicates.join(', '));

console.log('\nScholarK V4 audit');
for (const c of checks) console.log(`${c.ok ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? ` (${c.detail})` : ''}`);
if (failures.length) {
  console.error(`\n${failures.length} blocking failure(s):\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log(`\nPASS — ${checks.length} checks, 0 blocking failures.`);
