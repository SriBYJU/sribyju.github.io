import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const file = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(file, 'utf8');
const before = html;

const headBlock = `<!-- SCHOLARK_LEGAL_HEAD -->
<link rel="canonical" href="https://sribyju.github.io/">
<meta property="og:title" content="Scholark — Free College Planning & Academic Support">
<meta property="og:description" content="Student-built tools for GPA planning, admissions research, essays, SAT/ACT prep, AP study, and more.">
<meta property="og:type" content="website">
<meta property="og:url" content="https://sribyju.github.io/">
<meta property="og:image" content="https://sribyju.github.io/scholark-social-preview.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Scholark student-built college planning and academic support platform">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Scholark — Free College Planning & Academic Support">
<meta name="twitter:description" content="Student-built tools for GPA planning, admissions research, essays, SAT/ACT prep, AP study, and more.">
<meta name="twitter:image" content="https://sribyju.github.io/scholark-social-preview.jpg">
<meta name="referrer" content="strict-origin-when-cross-origin">
<!-- /SCHOLARK_LEGAL_HEAD -->`;

if (!html.includes('SCHOLARK_LEGAL_HEAD')) {
  const desc = /<meta name="description"[^>]*>/i;
  if (!desc.test(html)) throw new Error('Description meta tag not found');
  html = html.replace(desc, m => `${m}\n${headBlock}`);
}

const consentBootstrap = `<!-- SCHOLARK_CONSENT_BOOTSTRAP -->
<script id="scholark-consent-bootstrap">
(function(){
  var p=null;try{p=JSON.parse(localStorage.getItem('scholark:cookie-consent:v1')||'null')}catch(e){}
  var analytics=!!(p&&p.analytics),ads=!!(p&&p.ads);
  window.dataLayer=window.dataLayer||[];
  window.gtag=window.gtag||function(){window.dataLayer.push(arguments)};
  window.gtag('consent','default',{analytics_storage:analytics?'granted':'denied',ad_storage:ads?'granted':'denied',ad_user_data:ads?'granted':'denied',ad_personalization:ads?'granted':'denied',functionality_storage:'granted',security_storage:'granted',wait_for_update:500});
  window.adsbygoogle=window.adsbygoogle||[];
  window.adsbygoogle.requestNonPersonalizedAds=ads?0:1;
})();
</script>
<!-- /SCHOLARK_CONSENT_BOOTSTRAP -->`;

if (!html.includes('SCHOLARK_CONSENT_BOOTSTRAP')) {
  const ads = /<script[^>]+pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js[^>]*><\/script>/i;
  if (!ads.test(html)) throw new Error('AdSense script not found');
  html = html.replace(ads, m => `${consentBootstrap}\n${m}`);
}

const legacySignup = /<p style="font-size:12px;color:#8a847b;margin:8px 0 0;line-height:1\.4">By creating an account, you'll receive weekly college tips & deadline reminders\. You can unsubscribe anytime\.<\/p>/g;
const signupDisclosure = `<p class="sk-auth-legal">By creating an account or continuing with Google, you agree to the <a href="terms.html" target="_blank" rel="noopener noreferrer">Terms &amp; Conditions</a> and <a href="privacy.html" target="_blank" rel="noopener noreferrer">Privacy Policy</a>, and acknowledge the cookie choices you make in Cookie Preferences. Optional cookie consent can be changed at any time.</p>`;
html = html.replace(legacySignup, signupDisclosure);

if (!html.includes('src="scholark-legal.js"')) {
  if (!html.includes('</body>')) throw new Error('Closing body tag not found');
  html = html.replace('</body>', '<script src="scholark-legal.js" defer></script>\n</body>');
}

if (html !== before) {
  fs.writeFileSync(file, html);
  console.log('Applied Scholark legal/security hardening to index.html');
} else {
  console.log('index.html already hardened; no changes needed');
}
