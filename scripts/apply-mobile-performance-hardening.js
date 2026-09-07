import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename=fileURLToPath(import.meta.url);
const __dirname=path.dirname(__filename);
const root=path.resolve(__dirname,'..');
const file=path.join(root,'index.html');
let html=fs.readFileSync(file,'utf8');
const before=html;

const eagerBlock=`<script src="ap-v2-data.js"></script>\n<script src="ap-v2-app.js"></script>\n<script src="prep-v2-data.js"></script>\n<script src="prep-v2-app.js"></script>\n<script src="scholark-v3.js" defer></script>`;
const lazyBlock=`<script src="scholark-feature-loader.js" defer></script>\n<script src="scholark-v3.js" defer></script>`;
if(html.includes(eagerBlock)) html=html.replace(eagerBlock,lazyBlock);

// Analytics must not initialize before an explicit optional-consent path exists. Removing the
// unconditional Firebase Analytics import also cuts a network/module load from iPhone startup.
html=html.replace('import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-analytics.js";\n','');
html=html.replace('const analytics = getAnalytics(app);\n','');

if(html===before){
  console.log('Mobile performance hardening already applied.');
  process.exit(0);
}
fs.writeFileSync(file,html);
console.log('Applied ScholarK mobile startup hardening: AP/Test Prep are lazy-loaded and unconditional Firebase Analytics startup is removed.');
