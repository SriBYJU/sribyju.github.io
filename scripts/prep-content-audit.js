const CONTENT_AUDIT_VERSION = 'content-audit-v1';

const normalize = value => String(value ?? '').toLowerCase().replace(/[−–—]/g, '-').replace(/\s+/g, ' ').trim();
const structuralFingerprint = question => normalize(`${question.exam}|${question.skill}|${question.passage ? normalize(question.passage).slice(0,220) : ''}|${question.stem}`)
  .replace(/\b-?\d+(?:\.\d+)?\b/g, '#')
  .replace(/\$#/g, '$#');
const numeric = value => Number(String(value).replace(/[$,%°]/g, ''));
const close = (actual, expected) => Number.isFinite(actual) && Number.isFinite(expected) && Math.abs(actual - expected) < 1e-8;

export function verifyGeneratedMath(question) {
  if (question.section !== 'Math') return {status:'not-applicable'};
  const answer = numeric(question.options[question.answer]);
  if(Number.isFinite(Number(question.validation?.expectedNumeric)))return {status:close(answer,Number(question.validation.expectedNumeric))?'verified':'failed'};
  let match;
  try {
    if (/^(sat|act)-lin-\d+$/.test(question.id)) {
      match=question.stem.match(/(-?\d+)x \+ (-?\d+) = (-?\d+)/); return {status:close(answer,(+match[3]-+match[2])/(+match[1]))?'verified':'failed'};
    }
    if (/^(sat|act)-fn-\d+$/.test(question.id)) {
      match=question.stem.match(/f\((-?\d+)\) = (-?\d+) and has a slope of (-?\d+)/); return {status:close(answer,+match[2]-+match[1]*(+match[3]))?'verified':'failed'};
    }
    if (/^(sat|act)-sys-\d+$/.test(question.id)) {
      match=question.stem.match(/x \+ y = (-?\d+) and (-?\d+)x \+ (-?\d+)y = (-?\d+)/); return {status:close(answer,(+match[4]-+match[3]*(+match[1]))/(+match[2]-+match[3]))?'verified':'failed'};
    }
    if (/^(sat|act)-quad-\d+$/.test(question.id)) {
      match=question.stem.match(/x² − (-?\d+)x \+ (-?\d+) = 0 is (-?\d+)/); return {status:close(answer,+match[1]-+match[3])?'verified':'failed'};
    }
    if (/^(sat|act)-ratio-\d+$/.test(question.id)) {
      match=question.stem.match(/(\d+) identical notebooks cost \$(\d+).*how much do (\d+) notebooks/); return {status:close(answer,+match[2]/+match[1]*(+match[3]))?'verified':'failed'};
    }
    if (/^(sat|act)-pct-\d+$/.test(question.id)) {
      match=question.stem.match(/increases from (\d+) by (\d+)%/); return {status:close(answer,+match[1]*(1+(+match[2])/100))?'verified':'failed'};
    }
    if (/^(sat|act)-data-\d+$/.test(question.id)) {
      match=question.stem.match(/data set is ([\d, ]+)\. If (\d+) is added/); const values=match[1].split(',').map(Number),sum=values.reduce((a,b)=>a+b,0); return {status:close(answer,(sum+(+match[2]))/(values.length+1)-sum/values.length)?'verified':'failed'};
    }
    if (/^(sat|act)-prob-\d+$/.test(question.id)) {
      match=question.stem.match(/holds (\d+) red tiles and (\d+) blue/); const [n,d]=String(question.options[question.answer]).split('/').map(Number); return {status:close(n/d,+match[2]/(+match[1]+ +match[2]))?'verified':'failed'};
    }
    if (/^(sat|act)-geo-\d+$/.test(question.id)) {
      match=question.stem.match(/area (\d+).*length (\d+)/); return {status:close(answer,2*((+match[1])/(+match[2])+(+match[2])))?'verified':'failed'};
    }
    if (/^(sat|act)-tri-\d+$/.test(question.id)) {
      match=question.stem.match(/legs (\d+) and (\d+)/); return {status:close(answer,Math.hypot(+match[1],+match[2]))?'verified':'failed'};
    }
    if (/^(sat|act)-circle-\d+$/.test(question.id)) {
      match=question.stem.match(/= (\d+)\. What is its radius/); return {status:close(answer,Math.sqrt(+match[1]))?'verified':'failed'};
    }
    if (/^sat-linear-two-\d+$/.test(question.id)) {
      match=question.stem.match(/y = (-?\d+)x \+ (-?\d+) passes through \(k, (-?\d+)\)/); return {status:close(answer,(+match[3]-+match[2])/(+match[1]))?'verified':'failed'};
    }
    if (/^sat-ineq-\d+$/.test(question.id)) {
      match=question.stem.match(/(-?\d+)x \+ 1 > (-?\d+)/); return {status:answer>(+match[2]-1)/(+match[1])?'verified':'failed'};
    }
    if (/^sat-two-data-\d+$/.test(question.id)) {
      match=question.stem.match(/y = (-?\d+)x \+ (-?\d+).*x = (-?\d+)/); return {status:close(answer,+match[1]*(+match[3])+(+match[2]))?'verified':'failed'};
    }
    if (/^sat-angle-\d+$/.test(question.id)) {
      match=question.stem.match(/measures (\d+)°/); return {status:close(answer,180-(+match[1]))?'verified':'failed'};
    }
    if (/^act-number-\d+$/.test(question.id)) {
      match=question.stem.match(/\((\d+)\^(\d+)\)\(\1\^3\)/); return {status:normalize(question.options[question.answer])===`${match[1]}^${+match[2]+3}`?'verified':'failed'};
    }
    return {status:'unverified'};
  } catch {
    return {status:'failed'};
  }
}

export function auditPrepContent(questions, topicById) {
  const issues=[];
  const seenIds=new Set(),seenVisible=new Set(),fingerprints=new Map();
  const answerPositions={sat:[0,0,0,0],act:[0,0,0,0]};
  const lengthGroups=new Map();
  let deterministicEligible=0,deterministicVerified=0;
  for(const question of questions) {
    const prefix=question.id||'(missing id)';
    if(!question.id||seenIds.has(question.id))issues.push({severity:'error',code:'duplicate-id',id:prefix});
    seenIds.add(question.id);
    if(!topicById[question.skill])issues.push({severity:'error',code:'unknown-skill',id:prefix});
    if(!Array.isArray(question.options)||question.options.length!==4)issues.push({severity:'error',code:'choice-count',id:prefix});
    const normalizedOptions=(question.options||[]).map(normalize);
    if(new Set(normalizedOptions).size!==normalizedOptions.length)issues.push({severity:'error',code:'duplicate-choice',id:prefix});
    if(!Number.isInteger(question.answer)||question.answer<0||question.answer>3)issues.push({severity:'error',code:'answer-index',id:prefix});
    if((question.explanation||'').trim().length<40)issues.push({severity:'warning',code:'short-explanation',id:prefix});
    if(question.source!=='Scholark original')issues.push({severity:'error',code:'provenance',id:prefix});
    if(question.validation?.version!==CONTENT_AUDIT_VERSION)issues.push({severity:'error',code:'validation-version',id:prefix});
    const visible=normalize(`${question.exam}|${question.passage||''}|${question.stem}`);
    if(seenVisible.has(visible))issues.push({severity:'error',code:'duplicate-visible',id:prefix});
    seenVisible.add(visible);
    const fingerprint=structuralFingerprint(question);
    if(!fingerprints.has(fingerprint))fingerprints.set(fingerprint,[]);
    fingerprints.get(fingerprint).push(question.id);
    const lengthKey=`${question.exam}:${question.section}`;
    if(!lengthGroups.has(lengthKey))lengthGroups.set(lengthKey,{total:0,longest:0,shortest:0});
    const lengths=(question.options||[]).map(option=>normalize(option).length),correctLength=lengths[question.answer]||0,maxLength=Math.max(...lengths),minLength=Math.min(...lengths);
    const lengthRow=lengthGroups.get(lengthKey);lengthRow.total++;
    if(correctLength===maxLength&&lengths.filter(length=>length===maxLength).length===1)lengthRow.longest++;
    if(correctLength===minLength&&lengths.filter(length=>length===minLength).length===1)lengthRow.shortest++;
    if(answerPositions[question.exam]&&Number.isInteger(question.answer))answerPositions[question.exam][question.answer]++;
    const verification=verifyGeneratedMath(question);
    if(verification.status!=='not-applicable'&&verification.status!=='unverified')deterministicEligible++;
    if(verification.status==='verified')deterministicVerified++;
    if(verification.status==='failed')issues.push({severity:'error',code:'deterministic-answer',id:prefix});
  }
  for(const [fingerprint,ids] of fingerprints)if(ids.length>80)issues.push({severity:'warning',code:'oversized-structural-family',id:ids[0],count:ids.length,fingerprint});
  for(const [exam,positions] of Object.entries(answerPositions)) {
    const total=positions.reduce((a,b)=>a+b,0);
    positions.forEach((value,index)=>{const share=total?value/total:0;if(share<.18||share>.32)issues.push({severity:'warning',code:'answer-position-bias',id:exam,position:index,share});});
  }
  for(const [group,row] of lengthGroups) {
    const longestShare=row.total?row.longest/row.total:0,shortestShare=row.total?row.shortest/row.total:0;
    if(row.total>=20&&longestShare>.42)issues.push({severity:'warning',code:'longest-answer-bias',id:group,share:longestShare,count:row.longest,total:row.total});
    if(row.total>=20&&shortestShare>.42)issues.push({severity:'warning',code:'shortest-answer-bias',id:group,share:shortestShare,count:row.shortest,total:row.total});
  }
  const largestFamily=Math.max(0,...[...fingerprints.values()].map(rows=>rows.length));
  return {
    version:CONTENT_AUDIT_VERSION,
    questionCount:questions.length,
    errors:issues.filter(issue=>issue.severity==='error'),
    warnings:issues.filter(issue=>issue.severity==='warning'),
    structuralFamilies:fingerprints.size,
    largestFamily,
    deterministicEligible,
    deterministicVerified,
    deterministicCoverage:deterministicEligible?deterministicVerified/deterministicEligible:0,
    answerPositions,
    answerLengthGroups:Object.fromEntries(lengthGroups),
    issues
  };
}

export { CONTENT_AUDIT_VERSION };
