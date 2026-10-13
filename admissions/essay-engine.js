(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./essay-content.js'):root.ScholarkEssayContent);if(typeof module==='object'&&module.exports)module.exports=api;else root.ScholarkEssayCoach=api;})(globalThis,C=>{
'use strict';
const words=t=>String(t).match(/[\p{L}\p{N}’'-]+/gu)||[];
const concrete=/\b(table|door|room|kitchen|bus|street|school|cart|cable|sensor|bottle|kettle|calendar|hand|hands|eyes|floor|window|notebook|pencil|soil|tree|cup|ball|book|garden|river|chair|phone|screen|machine|stage|classroom|lab|counter|paint|oven|bike|bicycle|thread|clock|bench|ticket|violin|screw|wheel)\b/gi;
const vivid=/\b(rewired|sketched|stitched|carried|measured|counted|tapped|whispered|scraped|folded|repaired|translated|tested|wrote|called|listened|built|opened|held|asked|placed|stopped|noticed|traced|soldered|kneaded|balanced|lifted|drew)\b/gi;
const sensory=/\b(cold|warm|blue|red|yellow|bright|dark|quiet|loud|rough|smooth|sharp|sweet|bitter|rusty|cracked|buzzing|silent|smelled|heard|tasted|saw|rattled|flickered)\b/gi;
const reflective=/\b(realiz(?:e|ed)|learn(?:ed)?|underst(?:and|ood)|recogniz(?:e|ed)|instead|changed|began to|now I|no longer|used to|assumed|wonder(?:ed)?|because)\b/i;
const abstract=/\b(passion|perseverance|resilience|leadership|hard work|dedication|diversity|impact|growth|journey|excellence)\b/gi;
const stock=/\b(step(?:ped)? out of my comfort zone|think outside the box|learned the value of hard work|gave me a new perspective|mission trip taught me|follow my dreams|make a difference|change the world)\b/i;
const hits=(t,re)=>[...String(t).matchAll(new RegExp(re.source,re.flags.includes('g')?re.flags:re.flags+'g'))];
const detail=t=>hits(t,concrete).length+hits(t,vivid).length+hits(t,sensory).length+(t.match(/\b\d+\b/g)||[]).length;
const hash=t=>{let h=2166136261;for(const c of String(t)){h^=c.codePointAt(0);h=Math.imul(h,16777619);}return (h>>>0).toString(16);};
function spans(t,re){return hits(t,re).map(m=>({start:m.index,end:m.index+m[0].length,text:m[0]}));}
function safeSuggestion(id,quote){if(quote.length>160||words(quote).length>30)return null;if(id==='MC-03'){const revised=quote.replace(/\b([\p{L}]{2,})\s+\1\b/iu,'$1');return revised!==quote?revised:null;}if(id==='MC-01'){const past={am:'was',go:'went',walk:'walked',see:'saw',run:'ran',take:'took'};const revised=quote.replace(/\bI (am|go|walk|see|run|take)\b/,(_,verb)=>`I ${past[verb]}`);return revised!==quote?revised:null;}return null;}
function revisionTarget(draft,comment){
 const text=String(draft||'');if(!comment||comment.stale||!Number.isInteger(comment.start)||!Number.isInteger(comment.end)||comment.start<0||comment.end>text.length||text.slice(comment.start,comment.end)!==comment.quote)return null;
 const ss=spans(text,/[^.!?\n]+[.!?]?/g);let target=ss.find(s=>s.start<=comment.start&&s.end>=comment.end)||{start:comment.start,end:comment.end,text:comment.quote};
 let start=target.start,end=target.end;while(start<end&&/\s/.test(text[start]))start++;while(end>start&&/\s/.test(text[end-1]))end--;const quote=text.slice(start,end);
 if(!quote||quote.length>600||words(quote).length>80||quote.trim()===text.trim())return null;
 return {start,end,quote};
}
function validatePassageRevisions(value,{draft,comment}){
 const target=revisionTarget(draft,comment),errors=[];if(!target)return {valid:false,errors:['Select one unchanged passage shorter than the whole draft.']};
 if(!value||!Array.isArray(value.options)||value.options.length!==2)return {valid:false,errors:['Two distinct alternatives are required.']};
 const source=target.quote,sourceWords=new Set(words(source).map(w=>w.toLowerCase()));
 const joining=new Set('a an the and but or so as at by for from in into of on to with i me my it its this that these those is was were am are be been had have has then'.split(' '));
 const alternatives={utilize:'use',utilized:'used',utilizing:'using',plethora:'many',ameliorate:'improve',aforementioned:'earlier',approximately:'about'};
 Object.entries(alternatives).forEach(([a,b])=>{if(sourceWords.has(a))sourceWords.add(b);});
 if(comment.suggestion)words(comment.suggestion).forEach(w=>sourceWords.add(w.toLowerCase()));
 const polarity=s=>(s.toLowerCase().match(/\b(?:no|not|never|neither|nor|without|cannot|can't|couldn't|didn't|don't|doesn't|wasn't|weren't|isn't|aren't|hardly|barely|only|almost)\b/g)||[]).sort().join('|');
 const digits=s=>(s.match(/\b\d+(?:[.,]\d+)*\b/g)||[]).sort().join('|');const seen=new Set();
 for(const option of value.options){const t=option?.text;if(typeof t!=='string'||!t.trim()||t.length>600||words(t).length>80){errors.push('Keep each alternative to one short passage.');continue;}
 const normalized=t.toLowerCase().replace(/\s+/g,' ').trim();if(seen.has(normalized)||normalized===source.toLowerCase().trim())errors.push('Alternatives must be distinct edits.');seen.add(normalized);
 if(/[<>\[\]{}]/.test(t)||/\b(?:ignore.*instructions|system prompt|as an ai)\b/i.test(t))errors.push('Unsupported markup or instructions.');
 if(digits(t)!==digits(source))errors.push('Keep the original numbers.');if(polarity(t)!==polarity(source))errors.push('Keep qualifications and negation.');
 if(words(t).some(w=>!sourceWords.has(w.toLowerCase())&&!joining.has(w.toLowerCase())))errors.push('New facts or unsupported wording.');
 // A rearrangement can still reverse who did what. Preserve the order of substantive source words.
 const ordered=words(source).map(w=>w.toLowerCase()).filter(w=>!joining.has(w));let cursor=0;
 const output=words(t).map(w=>w.toLowerCase()).filter(w=>!joining.has(w));
 for(const token of output){let found=ordered.indexOf(token,cursor);if(found<0){const original=Object.keys(alternatives).find(k=>alternatives[k]===token);if(original)found=ordered.indexOf(original,cursor);}
 if(found<0&&!(comment.suggestion&&words(comment.suggestion).map(w=>w.toLowerCase()).includes(token))){errors.push('Keep the order of the original actions and facts.');break;}if(found>=0)cursor=found+1;}
 }
 return {valid:errors.length===0,errors:[...new Set(errors)]};
}
function passageRevisions({draft,comment}){
 const target=revisionTarget(draft,comment);const guidance=comment?.askYourself||'Add the true action or detail you want this passage to convey, then review it again.';if(!target)return {target:null,options:[],guidance:'Choose one short, unchanged passage within a longer draft.'};
 const s=target.quote,options=[];const add=(label,text,reason)=>{text=text.replace(/\s+([,.;!?])/g,'$1').replace(/ {2,}/g,' ').trim();if(text)text=text[0].toUpperCase()+text.slice(1);if(text!==s&&!options.some(o=>o.text===text))options.push({label,text,reason});};
 const tightened=s.replace(/\b(?:really|very|basically|actually)\s+/gi,'').replace(/\butilize\b/g,'use').replace(/\butilized\b/g,'used').replace(/\butilizing\b/g,'using').replace(/\bapproximately\b/g,'about');
 if(comment.ruleId==='ST-01'){
  const action=s.replace(/^I (?:was|felt|am) (?:so |very )?(?:nervous|proud|excited|scared|happy|devastated|sad|angry),?\s+(?:but|and|so)\s+/i,'');
  if(action!==s&&detail(action)>0){add('Let the action carry the feeling',action,'Uses the action already in your sentence; removes the emotion label.');add('Give each action room',action.replace(/\s+and\s+(?:I\s+)?(?=(?:folded|opened|held|asked|placed|stopped|stepped|carried|called|wrote|walked|ran)\b)/i,'. I '),'Creates a pause between the actions you supplied.');}
 }
 add('Tighter phrasing',tightened,'Removes filler while preserving the order of your facts.');
 if(comment.suggestion)add('Repair this phrase',s.replace(comment.quote,comment.suggestion),'Applies the local grammar repair to this sentence.');
 if(words(tightened).length>12)add('Separate the ideas',tightened.replace(/;\s*(?=I\b)/,'. ').replace(/,?\s+and\s+(?=I\b)/,'. '),'Splits at an existing clause boundary to adjust emphasis.');
 const valid=[];for(const option of options){const other=options.find(x=>x!==option);if(other&&validatePassageRevisions({options:[option,other]},{draft,comment}).valid)valid.push(option);}
 return {target,options:valid.slice(0,2),guidance:valid.length>=2?'Compare both with your intended meaning. Apply only the version that sounds like you.':guidance};
}
function promptReview(text,promptType){
 const spec=C.prompts?.[promptType]||C.prompts?.ca7;if(!spec)return null;const sentences=spans(text,/[^.!?\n]+[.!?]?/g);
 const checks=spec.checks.map(([label,question,pattern])=>{const re=new RegExp(pattern,'i'),span=sentences.find(s=>re.test(s.text));return {label,question,evidence:span?.text.trim().slice(0,350)||'',start:span?.start??null,end:span?.end??null,status:span?'Possible evidence — review its depth':'Examine in your draft'};});
 return {title:spec.title,focus:spec.focus,checks,references:spec.references.map(id=>C.references[id]),note:'These are craft comparisons with published examples, not a ranking or an admissions formula. Prompt mappings are Scholark’s editorial choices; the source does not identify which Common App prompt each writer used.'};
}

function analyze(input,options={}){
 const text=String(input||'').slice(0,30000),w=words(text);const sentences=spans(text,/[^.!?\n]+[.!?]?/g).filter(s=>words(s.text).length);const paragraphs=spans(text,/[^\n]+(?:\n(?!\s*\n)[^\n]+)*/g).filter(s=>words(s.text).length);const first=sentences[0]||{start:0,end:text.length,text};const last=paragraphs.at(-1)||first;const comments=[];
 const add=(id,span)=>{if(!span||span.end<=span.start||!C.rules[id])return;const r=C.rules[id];const quote=text.slice(span.start,span.end);comments.push({...r,ruleId:id,kind:['MC-01','MC-03'].includes(id)?'grammar':'editorial',suggestion:safeSuggestion(id,quote),start:span.start,end:span.end,quote,noticed:`“${quote}”`,pattern:C.patterns[r.type],source:C.source,severity:r.type==='grow'?2:1,key:id+':'+hash(quote)});};
 const match=(id,re,target={text,start:0})=>{for(const m of hits(target.text,re).slice(0,2))add(id,{start:target.start+m.index,end:target.start+m.index+m[0].length});};
 const whole=()=>({...first,end:Math.min(first.end,first.start+180)});
 match('ST-01',/\bI (?:was|felt|am) (?:so |very )?(?:nervous|proud|excited|scared|happy|devastated|sad|angry)\b/i);
 for(const m of hits(text,/\b(I learned that|this taught me|I realized that)\b/gi))if(detail(text.slice(Math.max(0,m.index-400),m.index))<2)add('ST-02',{start:m.index,end:m.index+m[0].length});
 for(const p of paragraphs){const n=words(p.text).length;if(hits(p.text,abstract).length>=3&&detail(p.text)<3)add('ST-03',p);if(n>=35&&detail(p.text)<2)add('ST-04',p);if(n>=35&&/\b(every day|for years|always|over time)\b/i.test(p.text)&&detail(p.text)<3)add('ST-05',p);}
 if(w.length>=70&&!/why|college|activity|diversity|expository/i.test(options.promptType||'')&&!/[“"][^”"]+[”"]/.test(text)&&hits(text,concrete).length===0&&hits(text,sensory).length===0)add('ST-06',whole());
 match('OP-01',/^(?:\s*)(?:ever since I was (?:young|little)|throughout my life|I have always been passionate about|in today[’']s society|according to (?:the dictionary|Webster)|[“"][^”"]{4,120}[”"])/i,first);
 if(w.length>=20&&detail(first.text)===0)add('OP-02',first);
 if(w.length>=100&&detail(text.slice(0,Math.ceil(text.length*.25)))<2&&!/\b(but|failed|mistake|couldn.t|wrong|risk|lost|afraid)\b/i.test(text.slice(0,text.length*.25)))add('OP-03',whole());
 match('CL-01',/\b(in conclusion|this experience taught me|I will never forget|and that is why)\b/i,last);match('CL-03',/\b(change the world|make a difference|my passion for)\b/i,last);
 const earlier=new Set(words(text.slice(0,last.start)).map(x=>x.toLowerCase()).filter(x=>x.length>4));if(paragraphs.length>=2&&words(last.text).length>=12&&!words(last.text).some(x=>x.length>4&&earlier.has(x.toLowerCase()))&&!reflective.test(last.text))add('CL-02',last);
 match('VO-01',/\b(myriad|plethora|utilize|ameliorate|aforementioned|inextricably|multifaceted|quintessential|paradigm)\b/i);match('VO-02',stock);
 for(let i=2;i<sentences.length;i++){const starts=sentences.slice(i-2,i+1).map(s=>words(s.text)[0]?.toLowerCase());if(starts[0]&&starts.every(x=>x===starts[0])){add('VO-03',sentences[i]);break;}}
 for(const p of paragraphs){const ss=sentences.filter(s=>s.start>=p.start&&s.end<=p.end);const lengths=ss.map(s=>words(s.text).length);if(lengths.length>=4){const spread=Math.max(...lengths)-Math.min(...lengths);if(spread<=3)add('VO-04',p);if(spread>=12){add('GL-04',p);break;}}}
 match('VO-05',/\b(very|really|just|kind of|a lot|basically|actually)\b/i);if(hits(text,/\b(?:was|were|is|are|been)\s+\w+(?:ed|en)\b/gi).length>=3)match('VO-06',/\b(?:was|were|is|are|been)\s+\w+(?:ed|en)\b/i);
 match('VO-07',/\b(you should|we all must)\b/i);
 const reflectionCount=sentences.filter(s=>reflective.test(s.text)).length;const reflectionRatio=reflectionCount/Math.max(sentences.length,1);
 if(w.length>=90&&(reflectionCount===0||(reflectionRatio>.7&&detail(text)<5)))add('SU-01',last);
 if(w.length>=70&&detail(text)<4)add('SU-02',whole());
 if(hits(text,/\b(president|captain|founder|award|medal|honor|varsity|volunteer|club)\b/gi).length>=5&&/[,;]/.test(text))add('SU-03',whole());
 match('SU-04',/\b(mission trip|big game|sports injury|grand(?:mother|father|parent).{0,20}(?:died|death|loss)|immigrant parents|my passion for \w+)\b/i);
 if(/why|college/i.test(options.promptType||'')&&/\b(prestigious|world.class|renowned|excellent faculty|beautiful campus|top.ranked)\b/i.test(text)&&!(/\b(course|seminar|professor|laboratory|studio|curriculum|archive)\b/i.test(text)&&detail(text)>=2))match('SU-05',/\b(prestigious|world.class|renowned|excellent faculty|beautiful campus|top.ranked)\b/i);
 const topics=['soccer','robotics','debate','piano','research','theater','business','swimming','volunteer'].filter(t=>new RegExp(`\\b${t}\\b`,'i').test(text));if(w.length>=80&&topics.length>=5)add('SU-06',whole());
 const limit=Number(options.wordLimit)||(/why|activity|diversity/i.test(options.promptType||'')?250:650);if(w.length>0&&(w.length>limit||(!/why|activity|diversity/i.test(options.promptType||'')&&w.length<450)))add('SC-01',whole());
 if((w.length>=180&&paragraphs.length===1)||(paragraphs.length>=5&&paragraphs.filter(p=>words(p.text).length<12).length>paragraphs.length*.6))add('SC-02',whole());
 for(let i=1;i<paragraphs.length;i++){const p=paragraphs[i],before=new Set(words(paragraphs[i-1].text).map(x=>x.toLowerCase()).filter(x=>x.length>4));if(words(p.text).length>=20&&!words(p.text).some(x=>x.length>4&&before.has(x.toLowerCase()))&&!/^\s*(however|instead|because|yet|later|now|then|after|but|although|meanwhile)/i.test(p.text)){add('SC-03',{...p,end:Math.min(p.end,p.start+140)});break;}}
 for(const s of sentences){const yesterday=s.text.match(/\byesterday\b/i),present=s.text.match(/\bI (?:am|go|walk|see|run|take)\b/);if(yesterday&&present&&present.index>yesterday.index&&!/\b(?:now|today|currently)\b/i.test(s.text.slice(yesterday.index,present.index)))add('MC-01',s);if(words(s.text).length>45)add('MC-02',s);if(hits(s.text,/\b\w+ly\b/g).length>=4)add('MC-04',s);}
 match('MC-03',/\b([\p{L}]{2,})\s+\1\b/iu);
 match('GL-01',sensory);match('GL-02',vivid);match('GL-03',/[“"][^”"\n]{4,100}[”"]/);match('GL-05',/\b\d+(?:\.\d+)?\b|\b(?:Dr\.|Professor|Mr\.|Ms\.)\s+[A-Z][a-z]+/);
 for(const s of sentences)if(reflective.test(s.text)&&detail(text.slice(Math.max(0,s.start-300),s.end))>=4){add('GL-06',s);break;}
 match('GL-07',/\b(?:rusty|cracked|blue|red|yellow|tiny|crooked|loose|worn|handwritten)\s+(?:cable|bottle|kettle|calendar|notebook|pencil|wheel|violin|thread|screw|ticket|cart)\b/i);
 const unique=[...new Map(comments.map(c=>[c.ruleId+':'+c.start,c])).values()];
 const sentenceKeys=sentences.map(s=>s.text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim()).filter(Boolean);
 const repeatedSentenceRatio=sentenceKeys.length<4?0:1-new Set(sentenceKeys).size/sentenceKeys.length;
 const penalty=ids=>unique.filter(c=>ids.includes(c.ruleId)).reduce((s,c)=>s+(c.type==='grow'?5:2),0);
 const bounded=n=>Math.max(0,Math.min(96,Math.round(n)));
 const specificity=Math.min(22,detail(text)*1.4);const reflection=Math.min(16,reflectionCount*4);
 const subScores={Structure:bounded(76+(paragraphs.length>=3?6:0)-penalty(['OP-01','OP-03','CL-01','CL-02','SC-02','SC-03'])-(w.length<100?12:0)),Voice:bounded(75+Math.min(12,hits(text,vivid).length*2)-penalty(['VO-01','VO-02','VO-03','VO-04','VO-05','VO-06','VO-07'])),Clarity:bounded(85-penalty(['ST-03','ST-04','MC-01','MC-02','MC-03','MC-04'])-(w.length>limit?10:0)),Impact:bounded(40+specificity+reflection+Math.min(10,unique.filter(c=>c.ruleId==='GL-07'||c.ruleId==='GL-03').length*5)-penalty(['SU-02','SU-03','ST-02','CL-03']))};
 let score=bounded(subScores.Impact*.30+subScores.Voice*.25+subScores.Structure*.25+subScores.Clarity*.20);if(w.length<20)score=Math.min(score,20);else if(w.length<50)score=Math.min(score,45);if(w.length>=80&&repeatedSentenceRatio>.5)score=Math.min(score,50);else if(w.length>=80&&repeatedSentenceRatio>.25)score=Math.min(score,65);if(score>=90&&(detail(text)<20||reflectionCount<3||w.length<250))score=89;
 return {promptReview:promptReview(text,options.promptType),score:w.length?score:null,subScores,comments:unique,wordCount:w.length,wordLimit:limit,essayHash:hash(text),rubricVersion:C.version,promptType:options.promptType||'common-app',gradedAt:new Date().toISOString(),summary:Object.fromEntries(['glow','grow','wondering'].map(t=>[t,unique.filter(c=>c.type===t).length])),nextSteps:unique.filter(c=>c.type==='grow').sort((a,b)=>b.severity-a.severity).slice(0,5),signals:{detail:detail(text),reflectionCount,paragraphs:paragraphs.length,repeatedSentenceRatio}};
}
function reanchor(comments,before,after){let prefix=0;while(prefix<before.length&&prefix<after.length&&before[prefix]===after[prefix])prefix++;let suffix=0;while(suffix<before.length-prefix&&suffix<after.length-prefix&&before[before.length-1-suffix]===after[after.length-1-suffix])suffix++;const delta=after.length-before.length;return comments.map(c=>{if(c.end<=prefix)return {...c,stale:false};if(c.start>=before.length-suffix){const shifted={...c,start:c.start+delta,end:c.end+delta};return {...shifted,stale:after.slice(shifted.start,shifted.end)!==c.quote};}return {...c,stale:true};});}
function revisionWords(text,previous={}){const counts={};for(const word of words(text)){const key=hash(word.toLowerCase());counts[key]=(counts[key]||0)+1;}let added=0,removed=0;for(const key of new Set([...Object.keys(counts),...Object.keys(previous)])){const delta=(counts[key]||0)-(previous[key]||0);added+=Math.max(0,delta);removed+=Math.max(0,-delta);}return {counts,added,removed};}
return {analyze,reanchor,hash,words,revisionWords,revisionTarget,passageRevisions,validatePassageRevisions,content:C};
});
