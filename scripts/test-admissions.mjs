import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const files=['activity-engine.test.js','essay-coach.test.js','essay-revisions.test.js','chances-model.test.js'];
const result=spawnSync(process.execPath,['--test',...files.map(x=>fileURLToPath(new URL(x,import.meta.url)))],{stdio:'inherit'});
process.exit(result.status??1);
