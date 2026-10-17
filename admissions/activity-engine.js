(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ScholarkActivities=api;})(typeof globalThis!=='undefined'?globalThis:this,()=>{
  'use strict';
  const VERSION='activities-2.1';
  const categories=['Academic','Art','Athletics: Club','Athletics: JV/Varsity','Career-Oriented','Community Service','Computer/Technology','Cultural','Dance','Debate/Speech','Environmental','Family Responsibilities','Foreign Exchange','Journalism/Publication','Junior R.O.T.C.','LGBT','Music: Instrumental','Music: Vocal','Religious','Research','Robotics','School Spirit','Science/Math','Social Justice','Student Govt/Politics','Theater/Drama','Work (paid)','Other'];
  const contexts=['Family responsibility / caregiving','Paid job to support family','Limited school/community resources','Rural','First-gen','Self-initiated (no program existed)'];
  const clamp=(v,lo,hi)=>Math.min(hi,Math.max(lo,Number(v)||0));
  const count=s=>String(s||'').length;
  const cut=(s,n)=>{let out='';for(const c of String(s||'')){if(out.length+c.length>n)break;out+=c;}return out;};
  const normalize=s=>String(s||'').normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g,'').replace(/[’‘]/g,"'").toLowerCase().replace(/\bpres\.?\b/g,'president').replace(/\bvp\b/g,'vice president').replace(/\bco[- ]founder\b/g,'cofounder').replace(/\bnhs\b/g,'national honor society').replace(/\bhrs?\b/g,'hours').replace(/\s+/g,' ').trim();
  const tokens=s=>normalize(s).match(/[\p{L}\p{N}]+/gu)||[];
  const intent=/\b(?:did not|didn't|never|not selected|not accepted|wasn't selected|was not selected|have not yet|hope(?:d)? to|plan(?:ned)? to|want(?:ed)? to|applied to|application to|not\s+(?:yet\s+)?(?:an?\s+)?(?:[\w-]+\s+){0,3}(?:intern|finalist|winner|selected|qualified|accepted|founder|captain))\b/i;
  const completedClaims=s=>String(s||'').split(/\s*(?:[;.\n]|,\s*(?=but\b)|\bbut\b)\s*/i).map(part=>{const clean=part.replace(/^\s*(?:instead|however)\b[, ]*/i,'').trim();const uncertain=intent.exec(clean);if(!uncertain)return clean;const prefix=clean.slice(0,uncertain.index).replace(/\b(?:and|or)\s*$/i,'').trim();return tokens(prefix).length>=3?prefix:'';}).filter(Boolean).join('; ');
  const id=()=>globalThis.crypto?.randomUUID?.()||`a-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  function activity(raw={}){
    if(!raw||typeof raw!=='object'||Array.isArray(raw))raw={};
    return {id:cut(raw.id||id(),80),category:categories.includes(raw.category)?raw.category:'Other',position:cut(raw.position,50),organization:cut(raw.organization,100),description:cut(raw.description,150),notes:cut(raw.notes,1500),grades:[...new Set((Array.isArray(raw.grades)?raw.grades:[]).map(String))].filter(v=>['9','10','11','12','PG'].includes(v)),hours:clamp(raw.hours,0,168),weeks:clamp(raw.weeks,0,52),current:!!raw.current,context:(Array.isArray(raw.context)?raw.context:[]).filter(x=>contexts.includes(x)),versions:(Array.isArray(raw.versions)?raw.versions:[]).filter(v=>v&&typeof v==='object'&&!Array.isArray(v)).slice(-5).map(v=>({description:cut(v.description,150),position:cut(v.position,50),organization:cut(v.organization,100),savedAt:cut(v.savedAt,40)}))};
  }
  function validate(raw){const errors=[];for(const [k,n]of Object.entries({position:50,organization:100,description:150,notes:1500}))if(count(raw[k])>n)errors.push(`${k}: maximum ${n} characters`);if(!String(raw.description||raw.notes||'').trim())errors.push('Describe what you actually did.');for(const[k,n]of[['hours',168],['weeks',52]])if(raw[k]!==''&&raw[k]!=null&&(!Number.isFinite(Number(raw[k]))||Number(raw[k])<0||Number(raw[k])>n))errors.push(`${k}: use a number from 0 to ${n}`);return errors;}
  function parseReport(text){
    const warnings=[],source=String(text||'');
    if(source.length>50000)return {activities:[],warnings:['Paste is over 50,000 characters. Split it into smaller batches; no text was imported.']};
    const sourceLines=source.split(/\r?\n/);
    const rows=sourceLines.map((raw,i)=>({text:raw.trim().replace(/^\|([^|]+)\|$/, '$1').trim().replace(/\\#/g,'#').replace(/\*\*/g,''),indented:/^\s+\S/.test(raw),blankBefore:i>0&&!sourceLines[i-1].trim()})).filter(({text:line})=>line&&!/^[|\s:\-–—#]+$/.test(line)&&! /^(?:#|activity|description(?:\s*\([^)]*\))?|position|organization)$/i.test(line)&&! /^(?:here are your|here are (?:the|\d)|these are all|i would keep this ranking|each (?:description|activity) is|ranked (?:activities|list))/i.test(line));
    const lines=rows.map(row=>row.text);
    const entries=[];let group=null;
    const flush=()=>{if(group?.length)entries.push(group);group=null;};
    for(let lineIndex=0;lineIndex<lines.length;lineIndex++){
      const line=lines[lineIndex];
      const cells=line.split(/\s*[|\t]\s*/).filter(Boolean);
      if(cells.length>=2){flush();if(cells.every(c=>/^(?:#|activity|description.*|position.*|organization.*|[-: ]+)$/i.test(c)))continue;if(/^\d+$/.test(cells[0]))cells.shift();entries.push(cells.length>=3?{position:cells[0],organization:cells[1],text:cells.slice(2).join('; ')}:{organization:cells[0],text:cells[1]});continue;}
      const numbered=line.match(/^\s*(\d{1,2})(?:[.)]\s*|\s*$)(.*)$/);
      if(numbered){flush();group=[];if(numbered[2])group.push(numbered[2]);continue;}
      const bullet=line.match(/^[-*•●▪]\s+(.+)$/u);
      if(bullet){
        const separate=group&&!rows[lineIndex].indented&&(group.length>1&&rows[lineIndex].blankBefore||/^[^:]{2,80}:\s+/.test(bullet[1])&&!/^(?:role|position|description|impact|results?|outcomes?|contribution|responsibilities|hours|grades|organization):/i.test(bullet[1]));
        if(separate)flush();
        if(group)group.push(bullet[1]);else entries.push([bullet[1]]);continue;
      }
      if(group)group.push(line);else if(line.length<=80&&tokens(line).length<=10&&!/[.!?]$/.test(line)&&lines[lineIndex+1]&&tokens(lines[lineIndex+1]).length>=10&&!/^(?:I |(?:built|created|led|taught|served|worked|played|compete|founded|authored|shadowed)\b)/i.test(line))group=[line];else entries.push([line]);
    }
    flush();
    const activities=[];
    for(const entry of entries){
      let raw;
      if(Array.isArray(entry)){
        const first=entry[0]||'',title=entry.length>1&&first.length<=100&&!/[.!?]$/.test(first)&&tokens(first).length<=12;
        raw={organization:title?first:'',text:(title?entry.slice(1):entry).join('\n')};
        if(!title&&entry.length===1){const m=first.match(/^([^:]{2,80}):\s+(.+)$/);if(m)raw={organization:m[1],text:m[2]};}
      }else raw=entry;
      if(!raw.text?.trim())continue;
      if(raw.text.length>1500){warnings.push(`${raw.organization||'An activity'} exceeds the 1,500-character evidence limit and was not imported. Shorten it or keep the extra context separately.`);continue;}
      if((raw.organization||'').length>100||(raw.position||'').length>50){warnings.push('A title or role exceeds its field limit and was not imported. Shorten that field first.');continue;}
      if(activities.length===40){warnings.push('Preview supports 40 distinct activities. Additional entries remain in your paste and were not imported.');break;}
      let description=cut(raw.text.replace(/\s+/g,' '),150);if(raw.text.length>150)description=description.replace(/\s+\S*$/,'');
      const existing=raw.organization&&activities.find(a=>normalize(a.organization)===normalize(raw.organization)&&normalize(a.position)===normalize(raw.position));
      if(existing){
        if(!existing.notes.includes(raw.text)){const combined=existing.notes+'\n'+raw.text;if(combined.length>1500){warnings.push(`${raw.organization}: combined evidence exceeds 1,500 characters. The additional passage remains in your paste; shorten it before importing.`);}else {existing.notes=combined;const update=refine(existing);if(!update.errors.length)existing.description=update.variants[0].text;}}
        continue;
      }
      const item=activity({position:raw.position||'',organization:raw.organization||'',description,notes:raw.text});
      const refined=refine(item);if(!refined.errors.length&&refined.variants[0]?.text)item.description=refined.variants[0].text;
      activities.push(item);
    }
    if(!activities.length&&source.trim()&&!warnings.length)warnings.push('No activity descriptions found. Use one activity per line, a numbered list, or a table with a title and description.');
    return {activities,warnings};
  }
  function parse(text){return parseReport(text).activities.slice(0,10);}
  function nickname(raw){
    const a=activity(raw);if(a.organization.trim())return cut(a.organization.trim(),45);
    const source=[a.description,a.notes].join(' '),match=source.match(/\b(?:[\w-]+\s+)?(?:tutoring|soccer|tennis|pickleball|debate|research|robotics|caregiving|volunteering|cybersecurity|music|theater|journalism|business|coding|platform|club|report)\b/i);
    return match?match[0].replace(/^(?:a|the|my|with|for|in)\s+/i,'').replace(/^./,c=>c.toUpperCase()):cut(a.description.split(/[;.!?]/)[0],45)||'Activity';
  }
  class BM25{
    constructor(rows=[]){this.rows=rows;this.docs=rows.map(row=>{const ts=tokens([row.title,...(row.aliases||[]),...(row.keywords||[])].join(' '));const tf=new Map();for(const t of ts)tf.set(t,(tf.get(t)||0)+1);return {tf,length:ts.length};});this.average=this.docs.reduce((s,d)=>s+d.length,0)/Math.max(1,rows.length);this.df=new Map();for(const d of this.docs)for(const t of d.tf.keys())this.df.set(t,(this.df.get(t)||0)+1);}
    search(query,filter=()=>true,limit=3){const ts=[...new Set(tokens(query))];return this.rows.map((row,i)=>{if(!filter(row))return null;const d=this.docs[i];let score=0;for(const t of ts){const f=d.tf.get(t)||0;if(!f)continue;const df=this.df.get(t)||0;score+=Math.log(1+(this.rows.length-df+.5)/(df+.5))*f*2.2/(f+1.2*(.25+.75*d.length/(this.average||1)));}return {row,similarity:score};}).filter(x=>x&&x.similarity>0).sort((a,b)=>b.similarity-a.similarity).slice(0,limit);}
  }
  const outputAction=/\b(publish(?:ed|ing)?|present(?:ed|ing)?|ship(?:ped|ping)?|deploy(?:ed|ing)?|build(?:ing)?|built|creat(?:e|ed|ing)|launch(?:ed|ing)?|produc(?:e|ed|ing)|design(?:ed|ing)?|repair(?:ed|ing)?|train(?:ed|ing)?|teach(?:ing)?|taught|serv(?:e|ed|ing)|car(?:e|ed|ing)|translat(?:e|ed|ing)|manag(?:e|ed|ing)|rais(?:e|ed|ing)|develop(?:ed|ing)?|prepar(?:e|ed|ing)|cook(?:ed|ing)?|pack(?:ed|ing)?|distribut(?:e|ed|ing)|clean(?:ed|ing)?|deliver(?:ed|ing)?|schedul(?:e|ed|ing)|answer(?:ed|ing)?|stock(?:ed|ing)?)\b/;
  function signals(raw,gazetteer=[]){const a=activity(raw),original=normalize([a.position,a.organization,a.description,a.notes].join('; ')),text=completedClaims(original),has=re=>re.test(text);const metrics=[...text.matchAll(/(?:\$\s*)?(\d[\d,]*(?:\.\d+)?)\s*(?:\+\s*)?(people|students|beneficiaries|families|users|downloads|members|meals|dollars|patients|readers|children|customers|visitors|participants)\b/g)].map(m=>({value:Number(m[1].replace(/,/g,'')),unit:m[2],quote:m[0]}));const clauses=text.split(/\s*[;.\n]\s*/);const entities=gazetteer.filter(e=>e.verified===true&&[...(e.names||[]),...(e.aliases||[])].some(n=>new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\b`,'i').test(text)));
    const namedClaims=kind=>entities.filter(e=>kind==='award'?e.kind==='competition'||e.kind==='program':e.kind==='research-employer').filter(e=>clauses.some(clause=>[...(e.names||[]),...(e.aliases||[])].some(n=>{const escaped=n.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const name=`\\b${escaped}\\b`;const before=kind==='award'?`\\b(?:won|winner|medalist|finalist|qualified|qualifier|selected|award|honor|participant|attended)(?:\\s+(?:at|for|to|of|the|a|an|in|from|grand|gold|silver|bronze|program|competition|fair|national|international|mathematics|science|medal|attend)){0,5}\\s+${name}`:`\\b(?:intern(?:ed|ship)?|research assistant)(?:\\s+(?:at|for|with|in|the|a|an|summer|research|lab)){0,5}\\s+${name}`;const after=kind==='award'?`${name}(?:\\s+(?:grand|gold|silver|bronze|research|science|math|program)){0,4}\\s+(?:winner|finalist|medalist|qualifier|award|honor|participant)\\b`:`${name}(?:\\s+(?:research|summer|lab)){0,3}\\s+(?:intern(?:ed|ship)?|research assistant)\\b`;if(!new RegExp(`${before}|${after}`,'i').test(clause))return false;const pos=clause.search(new RegExp(name,'i'));return !/\b(?:read|heard|learned|watched|webinar|blog|website|article|about|dream|aspir|hope|appl(?:y|ied)|rejected)\b/i.test(clause.slice(Math.max(0,pos-30),pos+n.length+25));})));
    return {text,unverifiedIntent:text!==original,metrics,entities,awardEntities:namedClaims('award'),frontierEmployers:namedClaims('employer'),reach:Math.max(0,...metrics.map(m=>m.value)),founder:has(/\b(found(?:ed|er)|cofounder|created|built|launched|started|organized)\b/),leader:has(/\b(captain|president|director|lead|led|manager|editor|supervis(?:or|ed)|coordinator)\b/),member:has(/\b(member|participant|attend(?:ed)?|joined)\b/),casual:has(/\b(weekends?|recreational|casual|for fun)\b/),national:has(/\b(national|international|world)\b/),regional:has(/\b(state|regional|all[- ]conference|district)\b/),recognition:has(/\b(won|winner|medal(?:ist)?|finalist|qualified|qualifier|award|honor|recruited|selected|peer[- ]reviewed|published|patent)\b/),output:has(outputAction),intern:has(/\b(intern(?:ed|ship)?|research assistant)\b/),care:has(/\b(caregiv|cared for|care for|siblings?|grandparent|family|paid|work|job|employ)/),research:has(/\b(research|experiment|investigat|laboratory|lab|study)\b/),years:Math.max(a.grades.length,Number(text.match(/\b([1-9])\s*years?\b/)?.[1]||0)),selective:has(/\b(selected from \d|invitation[- ]only|acceptance rate|top \d+\s*%)\b/)};
  }
  function grade(raw,options={}){
    const a=activity(raw),s=signals(a,options.gazetteer),text=s.text,flags=[],why=[],questions=[];
    if(tokens([a.description,a.notes].join(' ')).length<3||tokens(text).length<3)return {score:null,baseScore:null,tier:'Needs detail',confidence:'Insufficient detail',dimensions:{},why:['Describe completed work you actually did, not only an activity name or plan.'],flags:s.unverifiedIntent?['Planned or negated claims were excluded.']:[],references:[],upgrade:'What did you do, for whom, and over what period?',version:VERSION};
    const has=re=>re.test(text);
    const shadow=has(/\b(shadow(?:ed|ing)?|observ(?:ed|ing)|tour(?:ed)?|attend(?:ed)? (?:a )?webinar)\b/);
    const workText=text.split(/[;.]\s*/).filter(part=>!/^\s*(?:i\s+)?(?:shadow(?:ed|ing)?|observ(?:ed|ing)|watched|learned about|explored)\b/.test(part)).join('; ');
    const does=re=>re.test(workText);
    const researchWork=does(/\b(evaluat(?:e|ed|ing)|analy[sz](?:e|ed|ing)|conduct(?:ed|ing)?|test(?:ed|ing)?|implement(?:ed|ing)?|collect(?:ed|ing)?|authored|wrote)\b/)&&has(/\b(research|data|systems?|models?|analysis|experiments?|papers?|report|valuation)\b/);
    const authored=has(/\b(authored|wrote|published|produced)\b/) &&has(/\b(report|analysis|paper|book|article|curricul(?:um|a)|lessons?)\b/);
    const invention=has(/\b(invented|prototyped|engineered)\b/);
    const output=does(outputAction)||researchWork||authored||invention||(s.founder&&has(/\b(serving|teaching|training|supporting|providing)\b/));
    const adoption=has(/\b(?:adopted|used|implemented|piloted|deployed)\s+by\s+(?:an?\s+|the\s+)?(?:[\w-]+\s+){0,4}(?:firm|company|school|district|organization|business|hospital|library|team|client)\b/);
    const sponsors=has(/\b(?:\d+\+?\s+(?:brand\s+)?sponsors?|sponsored by|sponsorships?)\b/);
    const competitive=has(/\b(tournaments?|varsity|competitive|compete|competed|competing)\b/);
    const provisional=has(/\bprovisional (?:patent|application)\b/);
    const granted=has(/\b(?:granted|issued|awarded)\s+(?:a\s+|an?\s+u\.?s\.?\s+)?patent\b|\bpatent\s+(?:was\s+)?(?:granted|issued)\b/)&&!provisional;
    const peerReview=has(/\bpeer[- ]reviewed\b/)&&has(/\b(?:published|accepted|paper|article)\b/);
    const personalRole=text.replace(/\b(?:under|with)\s+(?:a\s+)?(?:managing\s+)?(?:director|professor|supervisor|manager)(?:\s+mentorship)?/g,'');
    const responsibility=/\b(captain|president|director|lead|led|manager|editor|supervis(?:or|ed)|coordinator|manage[ds]?|managing|coordinat(?:e|ed|ing)|co[- ]lead|cared|care for|taught|teach|mentor(?:ed|ing)?)\b/.test(personalRole);
    const care=has(/\b(caregiv(?:ing|er)?|cared for|care for|siblings?|grandparents?|paid (?:work|job)|job to support|family meals|family business)\b/);
    const concrete=s.reach>0||researchWork||authored||adoption||sponsors||has(/\b(platform|website|app|lessons?|budget|finances|meals|medication|customers|inventory|curriculum|prototype)\b/);
    // Stable evidence bands: the same fact repeated or rephrased cannot accumulate points.
    let impact=output?14:responsibility?11:competitive?10:shadow?5:4;
    if(output||responsibility)impact+=s.reach>=10000?14:s.reach>=1000?12:s.reach>=500?10:s.reach>=100?8:s.reach>=10?5:s.reach>0?3:0;
    if(adoption&&output)impact=Math.max(impact,25);
    if(researchWork)impact=Math.max(impact,18);
    if(authored)impact=Math.max(impact,17);
    if(care&&responsibility)impact=Math.max(impact,19);
    let selectivity=4;
    if(s.recognition&&!provisional)selectivity=s.national?17:s.regional?13:7;
    if(s.selective)selectivity=Math.max(selectivity,17);
    if(s.awardEntities.length&&s.recognition)selectivity=Math.max(selectivity,s.awardEntities.some(e=>e.tier==='1')?24:17);
    if(adoption&&output)selectivity=Math.max(selectivity,18);
    if(sponsors&&competitive)selectivity=Math.max(selectivity,13);
    if(granted||peerReview)selectivity=Math.max(selectivity,18);
    if(s.reach>=500&&output)selectivity=Math.max(selectivity,10);
    if(researchWork&&has(/\b(team|lab|mentor(?:ship)?|professor|supervisor)\b/))selectivity=Math.max(selectivity,11);
    // An employer name never substitutes for the student's actual contribution.
    let initiative=output&&s.founder?19:responsibility?16:researchWork||authored||invention?15:output?13:competitive?10:shadow?5:4;
    if(care&&responsibility)initiative=Math.max(initiative,17);
    const annual=a.hours*a.weeks;
    const seasons=[...new Set([...text.matchAll(/\b(\d+)\s+(?:varsity\s+|jv\s+)?seasons?\b/g)].map(m=>m[0]))].reduce((n,claim)=>n+Number(claim.match(/^\d+/)[0]),0);
    const months=Number(text.match(/\b(\d+)\s*months?\b/)?.[1]||0);
    const years=Math.max(s.years,seasons),timeKnown=!!(years||months||annual);
    // Missing time is uncertainty, not evidence of a one-off commitment.
    let depth=7;
    if(timeKnown)depth=clamp(4+Math.min(6,years*2)+(annual>=250?5:annual>=100?3:annual>0?1:months>=6?3:months>=2?1:0),1,15);
    if(!timeKnown)questions.push('Add grades/years and hours per week × weeks per year; duration is unknown, not assumed brief.');
    let coherence=concrete?8:output||responsibility?6:3;
    if(concrete&&(s.reach||adoption||researchWork))coherence=9;
    if(s.awardEntities.some(e=>e.tier==='1')&&s.recognition){impact=Math.max(impact,23);initiative=Math.max(initiative,15);depth=Math.max(depth,11);coherence=Math.max(coherence,8);}
    if(s.national&&s.recognition&&has(/\brecruited\b/)){impact=Math.max(impact,23);initiative=Math.max(initiative,15);depth=Math.max(depth,12);coherence=Math.max(coherence,7);selectivity=Math.max(selectivity,20);}
    if(s.casual&&!s.recognition&&!responsibility&&!output){impact=4;selectivity=3;initiative=4;coherence=3;}
    if(s.unverifiedIntent)flags.push('Planned, negated, or application-only claims were excluded. Grade completed work and confirmed roles.');
    if(provisional){flags.push('A provisional patent filing is not an examined or granted patent. Credit comes from the invention and work described.');questions.push('What working prototype or test result demonstrates the invention?');}
    if(sponsors)questions.push('Describe sponsorship terms and tournament results; sponsorship alone does not establish athletic rank or recruitment.');
    if(shadow&&!researchWork)questions.push('Separate observation from tasks you completed independently; name a concrete deliverable if there was one.');
    if(researchWork)questions.push('State your method, individual contribution, and a result your mentor can confirm; a team affiliation is not a publication.');
    if(adoption)why.push('Reported adoption by an outside organization provides stronger evidence of use than a project title alone.');
    if(researchWork)why.push('You describe doing research or analysis, rather than only observing a team.');
    if(s.reach)why.push(`Reported reach: ${s.metrics.find(m=>m.value===s.reach).quote}. Reach alone does not establish lasting benefit.`);
    if(output)why.push('A concrete output or contribution is described.');
    if(responsibility)why.push('You describe direct responsibility for people or ongoing work.');
    if(sponsors&&competitive)why.push('Competition and outside sponsorship are reported; recruitment is not assumed.');
    if(years)why.push(`${years} reported years/seasons show continued participation.`);
    if(shadow&&!researchWork)why.push('Observation is useful exploration, with less demonstrated responsibility than independently completed work.');
    if(!why.length)why.push('Participation is described; your individual contribution and results remain unclear.');
    const specificEvidence=s.awardEntities.length>0||(a.organization.trim().length>=4&&s.recognition&&s.regional)||s.reach>=500;
    let baseScore=Math.round(clamp(impact,0,30)+clamp(selectivity,0,25)+initiative+depth+coherence);
    if(s.national&&s.recognition&&!specificEvidence){baseScore=Math.min(baseScore,84);flags.push('Name the award, organization, level, and result. An unspecified national claim cannot receive Tier 1.');}
    if(/\b(?:harvard|elite|world.class|prestigious)[- ]level\b/.test(text)&&!specificEvidence){baseScore=Math.min(baseScore,55);flags.push('Prestige wording is not evidence. Describe your method, contribution, and result.');}
    if(s.entities.length&&!s.awardEntities.length)flags.push('Organization names do not add points; the rubric uses the contribution described.');
    // Context changes interpretation and follow-up questions, never supplies unearned bonus points.
    const adjustment=0,score=clamp(baseScore,0,100);
    if(a.context.length)why.push('Your reported circumstances should inform a human review of access and responsibility; no automatic hardship bonus is added.');
    if(a.hours>40)flags.push('More than 40 hours/week: check that this describes an actual peak or sustained schedule.');
    const completeness=Math.round(100*[!!(a.description||a.notes),!!(a.position||responsibility||output),!!(s.reach||adoption||researchWork||authored||s.recognition),timeKnown,!!(a.hours&&a.weeks)].filter(Boolean).length/5);
    const uncertainty=timeKnown?5:9;
    const scoreRange={low:Math.max(0,score-uncertainty),high:Math.min(100,score+uncertainty)};
    const tier=score>=85?'Tier 1 · Exceptional':score>=65?'Tier 2 · Distinguished':score>=40?'Tier 3 · Solid':score>=15?'Tier 4 · Participation':'Needs detail';
    const rung=score>=85?6:score>=75?5:score>=65?4:score>=40?3:score>=25?2:1;
    const references=options.index?.search(text,row=>Math.abs(row.rung-rung)<=1,3).map(x=>({...x.row,similarity:x.similarity}))||[];
    if(!s.reach&&!adoption&&!researchWork)questions.push('What changed because of your work, and what person, result, or artifact supports that claim?');
    return {score,baseScore,adjustment,tier,confidence:`${completeness>=80?'Moderate':'Limited'} · self-reported; ${timeKnown?'time described':'time not provided'}`,completeness,scoreRange,rangeLabel:'Illustrative uncertainty range, not a statistical confidence interval',dimensions:{impact:clamp(impact,0,30),selectivity:clamp(selectivity,0,25),initiative,depth,coherence},why,flags,references,questions,upgrade:questions[0]||'Add an outcome or independent feedback that shows the quality of your contribution.',honors:!output&&!responsibility&&s.recognition?'This may fit Honors better if it is an award without an ongoing activity.':null,version:VERSION};
  }
  function portfolio(activities,options={}){
    const list=(Array.isArray(activities)?activities:[]).slice(0,10),categoryCounts=Object.create(null);
    list.forEach(a=>{const category=categories.includes(a.category)?a.category:'Other';categoryCounts[category]=(categoryCounts[category]||0)+1;});
    const rows=list.map(a=>({activity:a,grade:grade(a,options)}));
    const sorted=rows.filter(r=>r.grade.score!=null).sort((a,b)=>b.grade.score-a.grade.score);
    // Review the strongest three substantive activities. Extra hobbies never lower this score.
    const anchors=sorted.slice(0,3),weights=[.5,.3,.2],total=anchors.reduce((n,r,i)=>n+weights[i],0);
    const score=anchors.length>=3?Math.round(anchors.reduce((n,r,i)=>n+r.grade.score*weights[i],0)/total):null;
    const dominant=Object.entries(categoryCounts).sort((a,b)=>b[1]-a[1])[0];
    const shape=score===null?'Emerging':dominant?.[0]!=='Other'&&dominant?.[1]>=3&&sorted[0]?.grade.score>=65?'Focused':Object.keys(categoryCounts).filter(x=>x!=='Other').length>=3?'Broad interests':'Developing';
    const gaps=[];if(!rows.some(r=>r.grade.dimensions.initiative>=15))gaps.push('Your individual responsibility needs more detail. Leadership titles are optional.');
    if(!rows.some(r=>r.grade.dimensions.selectivity>=15))gaps.push('Add feedback, use, outcomes, or recognition where available; awards are not required.');
    const hours=list.reduce((n,a)=>n+activity(a).hours,0);if(hours>60)gaps.push(`You list ${hours} hours/week in total. Check seasonal overlap and avoid double-counting.`);
    const missingTime=rows.filter(r=>r.grade.score!=null&&r.grade.confidence.includes('time not provided')).length;if(missingTime)gaps.push(`${missingTime} activities lack duration. Scores use an explicit middle estimate for depth, not a penalty for missing hours.`);
    return {score,shape,rows,order:sorted.map(r=>r.activity.id),gaps,spike:dominant?.[0]||null,completeness:rows.length?Math.round(rows.reduce((n,r)=>n+(r.grade.completeness||0),0)/rows.length):0,version:VERSION,explanation:score===null?'Add at least three activities for a portfolio score.':'A 50/30/20 weighted assessment of the strongest three described activities. Additional hobbies do not dilute it. Self-reported rubric estimate, not an admissions probability.'};
  }
  const tensePairs={lead:'led',found:'founded',organize:'organized',manage:'managed',teach:'taught',build:'built',create:'created',serve:'served',raise:'raised',develop:'developed',write:'wrote',run:'ran',design:'designed',support:'supported',train:'trained',coordinate:'coordinated'};
  const numbers=s=>(String(s).match(/\d+(?:[,.]\d+)*/g)||[]).map(x=>x.replace(/,/g,''));
  function validateRefinement(result,raw){if(!result||typeof result!=='object'||Array.isArray(result))return ['invalid-object'];if(typeof result.position!=='string'||typeof result.organization!=='string')return ['invalid-fields'];if(!Array.isArray(result.variants)||result.variants.length!==3)return ['three-variants'];if(result.variants.some(v=>!v||typeof v!=='object'||typeof v.text!=='string'||typeof v.style!=='string'))return ['invalid-variant'];const confirmed=[completedClaims(raw.description),completedClaims(raw.notes)].filter(Boolean).join(' ');if(!confirmed)return ['no-confirmed-work'];const input=[raw.position,raw.organization,confirmed].join(' ');const allowed=new Set(numbers(input));const errors=[];const vocabulary=new Set(tokens(input));for(const[present,past]of Object.entries(tensePairs))if(vocabulary.has(present)||vocabulary.has(past)){vocabulary.add(present);vocabulary.add(past);}const safe=new Set('a an the and with for to of in on at by from through as per supporting supported support about students student community weekly current during using use they them their these those it its was were is are be been being has have had that which who &'.split(' '));if(normalize(result.position)!==normalize(raw.position)||normalize(result.organization)!==normalize(raw.organization))errors.push('changed-role-or-organization');if(count(result.position)>50||count(result.organization)>100)errors.push('field-length');for(const v of result.variants){if(!v.text||count(v.text)>150)errors.push('description-length');if(intent.test(v.text))errors.push('unconfirmed-claim');if(numbers(v.text).some(n=>!allowed.has(n)))errors.push('new-number');if(!input.includes(v.text)&&tokens(v.text).some(w=>!vocabulary.has(w)&&!safe.has(w)&&!/^\d+$/.test(w)))errors.push('unsupported-wording');if(/\[(?:x|insert|number|name)[^\]]*\]/i.test(v.text)&&!v.placeholder)errors.push('unfilled-placeholder');if(/\b(passionate|dedicated|hard[- ]working|impactful)\b/i.test(v.text))errors.push('empty-adjective');}if(numbers(`${result.position} ${result.organization}`).some(n=>!allowed.has(n)))errors.push('new-number');return [...new Set(errors)];}
  function refine(raw){const a=activity(raw);const input=completedClaims(a.notes)||completedClaims(a.description);if(!input.trim())return {position:a.position,organization:a.organization,variants:['Impact-first','Scope-first','Concise'].map(style=>({style,text:''})),missing_info:['What completed work did you personally do?'],mode:'Offline refine mode',notes:'Add a confirmed contribution before refining.',errors:['no-confirmed-work']};const fields=[a.position,a.organization].filter(x=>x.trim().length>2);let text=input.replace(/\b(?:I (?:have |am |was )?|very |really |passionate |dedicated |hard-working |impactful )/gi,'').replace(/\bin order to\b/gi,'to').replace(/\band\b/gi,'&').replace(/\bapproximately\b/gi,'about').replace(/\bhelped with\b/gi,'supported').replace(/\s+/g,' ').trim();for(const f of fields)text=text.replace(new RegExp(f.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi'),'').replace(/^\s*[,;:—-]+\s*/,'');
    const clauses=text.split(/\s*[;\n]\s*|(?<=[.!?])\s+/).filter(Boolean);const bounded=items=>{let result='';for(const c of items){if(count(result+(result?'; ':'')+c)<=150)result+=(result?'; ':'')+c;}if(!result){const words=(items[0]||'Describe your contribution.').split(/\s+/);for(const word of words){if(count(result+(result?' ':'')+word)>150)break;result+=(result?' ':'')+word;}}return result||cut(items[0],150);};
    const variants=[['Impact-first',[...clauses].sort((a,b)=>Number(/\d/.test(b))-Number(/\d/.test(a)))],['Scope-first',[...clauses].sort((a,b)=>Number(/\b(team|school|state|national|lab|community|family)\b/i.test(b))-Number(/\b(team|school|state|national|lab|community|family)\b/i.test(a)))],['Concise',clauses]].map(([style,c])=>({style,text:bounded(c)}));const missing=[];if(!/\d/.test(input))missing.push('How many people, projects, or outputs can you accurately count?');if(!/\b(led|built|organized|managed|created|served|taught|care|help|develop|design)/i.test(input))missing.push('What specific work did you personally do?');missing.push('What outcome or feedback can someone else corroborate?');const result={position:a.position,organization:a.organization,variants,missing_info:missing.slice(0,3),mode:'Offline refine mode',notes:'Uses your supplied wording and facts. Check tense and meaning before applying. Similar variants mean the source has few distinct facts.'};return {...result,errors:validateRefinement(result,a)};
  }
  return {VERSION,categories,contexts,count,cut,normalize,activity,validate,parse,parseReport,nickname,BM25,signals,grade,portfolio,refine,validateRefinement};
});
