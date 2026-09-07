import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const file = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(file, 'utf8');
const before = html;

const primaryDescription = 'Scholark is an independent, student-built, non-commercial educational project with free tools for GPA planning, admissions research, essays, SAT/ACT prep, AP study, and more.';
html = html.replace(/<meta name="description" content="[^"]*">/i, `<meta name="description" content="${primaryDescription}">`);

const headBlock = `<!-- SCHOLARK_LEGAL_HEAD -->
<link rel="canonical" href="https://sribyju.github.io/">
<meta property="og:title" content="Scholark — Free College Planning & Academic Support">
<meta property="og:description" content="Independent, student-built, non-commercial educational tools for GPA planning, admissions research, essays, SAT/ACT prep, AP study, and more.">
<meta property="og:type" content="website">
<meta property="og:url" content="https://sribyju.github.io/">
<meta property="og:image" content="https://sribyju.github.io/scholark-social-preview.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Scholark independent student-built educational platform">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Scholark — Free College Planning & Academic Support">
<meta name="twitter:description" content="Independent, student-built, non-commercial educational tools for college planning and academic support.">
<meta name="twitter:image" content="https://sribyju.github.io/scholark-social-preview.jpg">
<meta name="referrer" content="strict-origin-when-cross-origin">
<!-- /SCHOLARK_LEGAL_HEAD -->`;

const headMarker = /<!-- SCHOLARK_LEGAL_HEAD -->[\s\S]*?<!-- \/SCHOLARK_LEGAL_HEAD -->/i;
if (headMarker.test(html)) html = html.replace(headMarker, headBlock);
else {
  const desc = /<meta name="description"[^>]*>/i;
  if (!desc.test(html)) throw new Error('Description meta tag not found');
  html = html.replace(desc, m => `${m}\n${headBlock}`);
}

const consentBootstrap = `<!-- SCHOLARK_CONSENT_BOOTSTRAP -->
<script id="scholark-consent-bootstrap">
(function(){
  var p=null;try{p=JSON.parse(localStorage.getItem('scholark:cookie-consent:v1')||'null')}catch(e){}
  var analytics=!!(p&&p.analytics);
  window.SCHOLARK_AD_SLOTS={};
  window.dataLayer=window.dataLayer||[];
  window.gtag=window.gtag||function(){window.dataLayer.push(arguments)};
  window.gtag('consent','default',{analytics_storage:analytics?'granted':'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',functionality_storage:'granted',security_storage:'granted',wait_for_update:500});
})();
</script>
<!-- /SCHOLARK_CONSENT_BOOTSTRAP -->`;

const consentMarker = /<!-- SCHOLARK_CONSENT_BOOTSTRAP -->[\s\S]*?<!-- \/SCHOLARK_CONSENT_BOOTSTRAP -->/i;
if (consentMarker.test(html)) html = html.replace(consentMarker, consentBootstrap);
else if (html.includes('</head>')) html = html.replace('</head>', `${consentBootstrap}\n</head>`);
else throw new Error('Closing head tag not found');

/* Scholark is intentionally non-commercial: remove all static ad loading and reserved ad UI. */
html = html.replace(/\s*<script[^>]+pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js[^>]*><\/script>\s*/ig, '\n');
html = html.replace(/\s*<aside\s+class="ad-(?:banner|reserve)[^"]*"[^>]*>[\s\S]*?<\/aside>\s*/ig, '\n');

/* Keep the project identity visible even if enhancement JavaScript fails. */
const aboutSubtitle = /<p class="subtitle">Scholark was created by Shriyan Avadhanula, an 11th-grade student building the college-planning platform he wanted for himself and other students\.<\/p>/i;
html = html.replace(aboutSubtitle, '<p class="subtitle">Scholark was created by Shriyan Avadhanula as an independent, student-built, non-commercial educational project. It is not an incorporated company, business, or employer, and it is not revenue-generating. The platform exists to provide free college-planning and academic-support tools for students.</p>');
html = html.replace(/© 2026 Scholark\. All rights reserved\. Results are estimates only\./g, '© 2026 Scholark · Independent student-built non-commercial educational project · Not a company or employer. Results are estimates only.');

const legacySignup = /<p style="font-size:12px;color:#8a847b;margin:8px 0 0;line-height:1\.4">By creating an account, you'll receive weekly college tips & deadline reminders\. You can unsubscribe anytime\.<\/p>/g;
const existingSignup = /<p class="sk-auth-legal">[\s\S]*?<\/p>/g;
const signupDisclosure = `<p class="sk-auth-legal">By creating an account or continuing with Google, you agree to the <a href="terms.html" target="_blank" rel="noopener noreferrer">Terms &amp; Conditions</a> and <a href="privacy.html" target="_blank" rel="noopener noreferrer">Privacy Policy</a>. Scholark is an independent, non-commercial student-built educational project, not an incorporated company or employer.</p>`;
html = html.replace(legacySignup, signupDisclosure);
html = html.replace(existingSignup, signupDisclosure);

if (!html.includes('src="scholark-legal.js"')) {
  if (!html.includes('</body>')) throw new Error('Closing body tag not found');
  html = html.replace('</body>', '<script src="scholark-legal.js" defer></script>\n</body>');
}

if (html !== before) {
  fs.writeFileSync(file, html);
  console.log('Applied Scholark non-commercial legal/security hardening to index.html');
} else {
  console.log('index.html already hardened; no changes needed');
}
