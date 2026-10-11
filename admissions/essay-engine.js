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
function analyze(input,options={}){
 const text=String(input||'').slice(0,30000),w=words(text);const sentences=spans(text,/[^.!?\n]+[.!?]?/g).filter(s=>words(s.text).length);const paragraphs=spans(text,/[^\n]+(?:\n(?!\s*\n)[^\n]+)*/g).filter(s=>words(s.text).length);const first=sentences[0]||{start:0,end:text.length,text};const last=paragraphs.at(-1)||first;const comments=[];
 const add=(id,span)=>{if(!span||span.end<=span.start||!C.rules[id])return;const r=C.rules[id];const quote=text.slice(span.start,span.end);comments.push({...r,ruleId:id,start:span.start,end:span.end,quote,noticed:`“${quote}”`,pattern:C.patterns[r.type],source:C.source,severity:r.type==='grow'?2:1,key:id+':'+hash(quote)});};
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
 for(const s of sentences){if(/\byesterday\b/i.test(s.text)&&/\bI (?:am|go|walk|see|run|take)\b/.test(s.text))add('MC-01',s);if(words(s.text).length>45)add('MC-02',s);if(hits(s.text,/\b\w+ly\b/g).length>=4)add('MC-04',s);}
 match('MC-03',/\b([\p{L}]{2,})\s+\1\b/iu);
 match('GL-01',sensory);match('GL-02',vivid);match('GL-03',/[“"][^”"\n]{4,100}[”"]/);match('GL-05',/\b\d+(?:\.\d+)?\b|\b(?:Dr\.|Professor|Mr\.|Ms\.)\s+[A-Z][a-z]+/);
 for(const s of sentences)if(reflective.test(s.text)&&detail(text.slice(Math.max(0,s.start-300),s.end))>=4){add('GL-06',s);break;}
 match('GL-07',/\b(?:rusty|cracked|blue|red|yellow|tiny|crooked|loose|worn|handwritten)\s+(?:cable|bottle|kettle|calendar|notebook|pencil|wheel|violin|thread|screw|ticket|cart)\b/i);
 const unique=[...new Map(comments.map(c=>[c.ruleId+':'+c.start,c])).values()];
 const penalty=ids=>unique.filter(c=>ids.includes(c.ruleId)).reduce((s,c)=>s+(c.type==='grow'?5:2),0);
 const bounded=n=>Math.max(0,Math.min(96,Math.round(n)));
 const specificity=Math.min(22,detail(text)*1.4);const reflection=Math.min(16,reflectionCount*4);
 const subScores={Structure:bounded(76+(paragraphs.length>=3?6:0)-penalty(['OP-01','OP-03','CL-01','CL-02','SC-02','SC-03'])-(w.length<100?12:0)),Voice:bounded(75+Math.min(12,hits(text,vivid).length*2)-penalty(['VO-01','VO-02','VO-03','VO-04','VO-05','VO-06','VO-07'])),Clarity:bounded(85-penalty(['ST-03','ST-04','MC-01','MC-02','MC-03','MC-04'])-(w.length>limit?10:0)),Impact:bounded(40+specificity+reflection+Math.min(10,unique.filter(c=>c.ruleId==='GL-07'||c.ruleId==='GL-03').length*5)-penalty(['SU-02','SU-03','ST-02','CL-03']))};
 let score=bounded(subScores.Impact*.30+subScores.Voice*.25+subScores.Structure*.25+subScores.Clarity*.20);if(w.length<50)score=Math.min(score,45);if(score>=90&&(detail(text)<20||reflectionCount<3||w.length<250))score=89;
 return {score:w.length?score:null,subScores,comments:unique,wordCount:w.length,wordLimit:limit,essayHash:hash(text),rubricVersion:C.version,promptType:options.promptType||'common-app',gradedAt:new Date().toISOString(),summary:Object.fromEntries(['glow','grow','wondering'].map(t=>[t,unique.filter(c=>c.type===t).length])),nextSteps:unique.filter(c=>c.type==='grow').sort((a,b)=>b.severity-a.severity).slice(0,5),signals:{detail:detail(text),reflectionCount,paragraphs:paragraphs.length}};
}
function reanchor(comments,before,after){let prefix=0;while(prefix<before.length&&prefix<after.length&&before[prefix]===after[prefix])prefix++;let suffix=0;while(suffix<before.length-prefix&&suffix<after.length-prefix&&before[before.length-1-suffix]===after[after.length-1-suffix])suffix++;const delta=after.length-before.length;return comments.map(c=>{if(c.end<=prefix)return {...c,stale:false};if(c.start>=before.length-suffix){const shifted={...c,start:c.start+delta,end:c.end+delta};return {...shifted,stale:after.slice(shifted.start,shifted.end)!==c.quote};}return {...c,stale:true};});}
function revisionWords(text,previous={}){const counts={};for(const word of words(text)){const key=hash(word.toLowerCase());counts[key]=(counts[key]||0)+1;}let added=0,removed=0;for(const key of new Set([...Object.keys(counts),...Object.keys(previous)])){const delta=(counts[key]||0)-(previous[key]||0);added+=Math.max(0,delta);removed+=Math.max(0,-delta);}return {counts,added,removed};}
return {analyze,reanchor,hash,words,revisionWords,content:C};
});
