(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ScholarkChances=api;})(globalThis,()=>{
'use strict';
const config={version:'planning-odds-2.0',bands:[{max:10,floor:.2,cap:25,academic:1.5,activity:.8,essay:.35},{max:25,floor:.5,cap:55,academic:1.8,activity:.65,essay:.3},{max:50,floor:1,cap:80,academic:2,activity:.5,essay:.25},{max:75,floor:2,cap:95,academic:2.2,activity:.35,essay:.2},{max:100,floor:3,cap:98,academic:2.4,activity:.25,essay:.15}],tierRates:{ivy:6,high:18,select:38,mod:60,open:80}};
const clamp=(x,l,h)=>Math.min(h,Math.max(l,x));const numeric=(v,l,h)=>v===''||v==null||!Number.isFinite(Number(v))?null:clamp(Number(v),l,h);
function validate(p){const errors=[];for(const[k,min,max]of[['rate',.2,99.5],['gpa',0,4],['weighted',0,5],['sat',400,1600],['act',1,36],['sat25',400,1600],['sat75',400,1600],['activities',0,100],['essay',0,100],['rigor',0,40]]){if(p[k]===''||p[k]==null)continue;const n=Number(p[k]);if(!Number.isFinite(n)||n<min||n>max||(['activities','essay'].includes(k)&&!Number.isInteger(n)))errors.push(`${k}: enter ${['activities','essay'].includes(k)?'a whole number':'a number'} from ${min} to ${max}.`);}if(p.sat25!==''&&p.sat25!=null&&p.sat75!==''&&p.sat75!=null&&Number(p.sat25)>Number(p.sat75))errors.push('School SAT 25th percentile cannot exceed its 75th percentile.');return errors;}
function estimate(p={}){
 const base=numeric(p.rate,.2,99.5)??(Object.hasOwn(config.tierRates,p.tier)?config.tierRates[p.tier]:38);const band=config.bands.find(x=>base<=x.max)||config.bands.at(-1);const missing=[];
 const get=(k,l,h)=>{const n=numeric(p[k],l,h);if(n===null)missing.push(k);return n;};
 const gpa=get('gpa',0,4),sat=numeric(p.sat,400,1600),act=numeric(p.act,1,36),activities=get('activities',0,100),essay=get('essay',0,100);
 const satEquivalent=act===null?null:400+(act-1)/35*1200;const test=sat===null?satEquivalent:satEquivalent===null?sat:Math.max(sat,satEquivalent);
 if(test===null)missing.push('test score');
 const baseline=base<10?3.85:base<25?3.65:base<50?3.4:base<75?3.1:2.8;
 const testMid=(numeric(p.sat25,400,1600)!==null&&numeric(p.sat75,400,1600)!==null)?(Number(p.sat25)+Number(p.sat75))/2:base<10?1500:base<25?1400:base<50?1250:base<75?1120:1000;
 const academic=clamp((gpa===null?0:(gpa-baseline)*1.4)+(test===null?0:(test-testMid)/300),-1,1)*band.academic;
 const rankScores={'5':.25,'10':.18,'25':.08,'50':0,bot:-.2};
 const factors={academics:academic,activities:activities===null?0:clamp((activities-50)/50,-1,1)*band.activity,essay:essay===null?0:clamp((essay-60)/40,-1,1)*band.essay,rank:Object.hasOwn(rankScores,p.rank)?rankScores[p.rank]:0,rigor:numeric(p.rigor,0,40)===null?0:Math.min(.2,Number(p.rigor)/50),earlyLegacy:0};
 const logit=Math.log(base/(100-base))+Object.values(factors).reduce((a,b)=>a+b,0);const logistic=x=>100/(1+Math.exp(-x));const center=clamp(logistic(logit),band.floor,band.cap);const uncertainty=.45+missing.length*.16;
 const high=clamp(logistic(logit+uncertainty),band.floor,band.cap);const low=Math.min(clamp(logistic(logit-uncertainty),band.floor,band.cap),Math.max(band.floor,high-2));
 const round=x=>Math.round(x*10)/10;const range=[round(low),round(high)];
 const label=center<20?'Reach':center<50?'Target':center<80?'Likely':'Safety range';
 const cautions=['Planning ranges are uncalibrated heuristics, not measured individual admission probabilities.','Activity and essay similarity is not evidence of admission. Recommendations, interviews, context, and institutional priorities are not modeled.'];
 if(numeric(p.weighted,0,5)!==null)cautions.push('Weighted GPA is recorded for context. Schools weight courses differently, so this model uses unweighted GPA and the separate course-rigor input.');
 if(p.legacy&&p.legacy!=='no')cautions.push('No automatic ED or legacy boost: policies and applicant selection differ by school.');
 if(/computer|engineering|nursing|business|cs\b/i.test(p.major||''))cautions.push('Program admission can be more selective than the overall school rate; no unsupported major multiplier was applied.');
 if(p.residency&&p.residency!=='unknown')cautions.push('Residency is recorded but cannot adjust this estimate without school-specific data.');
 if(!p.sat25||!p.sat75)cautions.push('School test-score ranges are unavailable; the academic comparison uses a broad selectivity-band assumption.');
 return {center:round(center),range,label,base,factors,missing,band,cautions,version:config.version};
}
function improvements(p){const before=estimate(p);return [['essay',80],['activities',80],['gpa',4]].map(([key,target])=>{const old=Number(p[key]);if(p[key]!==''&&p[key]!=null&&old>=target)return null;const after=estimate({...p,[key]:target});return {key,target,change:Math.max(0,Math.round((after.center-before.center)*10)/10),text:`Model sensitivity: ${key} at ${target} shifts the midpoint by about ${Math.max(0,Math.round((after.center-before.center)*10)/10)} percentage points. This is not a promised admissions gain.`};}).filter(Boolean).sort((a,b)=>b.change-a.change).slice(0,3);}
return {config,numeric,validate,estimate,improvements};
});
