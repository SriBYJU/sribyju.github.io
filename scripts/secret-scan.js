const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const allowedExt = new Set(['.html','.js','.mjs','.cjs','.json','.yml','.yaml','.md','.css','.txt']);
const ignored = new Set(['.git','node_modules','.firebase']);
const findings = [];

const rules = [
  ['Private key block', /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g],
  ['OpenAI-style secret', /\bsk-[A-Za-z0-9_-]{20,}\b/g],
  ['GitHub personal token', /\bgh[pousr]_[A-Za-z0-9]{30,}\b/g],
  ['AWS access key', /\bAKIA[0-9A-Z]{16}\b/g],
  ['Hard-coded client secret', /client_secret\s*[:=]\s*["'][^"'\n]{12,}["']/gi],
  ['Hard-coded provider secret', /(?:OPENAI|ANTHROPIC|STRIPE|SENDGRID|MAILGUN|RESEND|CLOUDFLARE|TWILIO)_[A-Z0-9_]*(?:KEY|TOKEN|SECRET)\s*[:=]\s*["'][^"'\n]{12,}["']/gi]
];

function walk(dir){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    if(ignored.has(entry.name)) continue;
    const full=path.join(dir,entry.name);
    if(entry.isDirectory()) walk(full);
    else if(allowedExt.has(path.extname(entry.name).toLowerCase())) scan(full);
  }
}
function scan(file){
  const rel=path.relative(root,file);
  const text=fs.readFileSync(file,'utf8');
  for(const [name,re] of rules){
    re.lastIndex=0;
    let m;
    while((m=re.exec(text))){
      const line=text.slice(0,m.index).split('\n').length;
      findings.push(`${rel}:${line} — ${name}`);
      if(!re.global) break;
    }
  }
}

walk(root);

if(findings.length){
  console.error('Potential frontend secrets detected:\n'+findings.join('\n'));
  process.exit(1);
}
console.log('Secret scan passed. Firebase web configuration is intentionally not treated as a private secret; access must be protected by Firebase rules and backend controls.');
