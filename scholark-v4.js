(() => {
  'use strict';
  const VERSION='4.0.0';
  const STORE='scholark:v4:';
  const safeGet=(k,fallback=null)=>{try{const v=localStorage.getItem(STORE+k);return v===null?fallback:JSON.parse(v)}catch{return fallback}};
  const safeSet=(k,v)=>{try{localStorage.setItem(STORE+k,JSON.stringify(v))}catch{}};
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const money=n=>Number.isFinite(+n)?'$'+Math.round(+n).toLocaleString():'—';
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const toast=(m,t='info')=>typeof window.showToast==='function'?window.showToast(m,t):console.log(m);
  const PUBLIC=()=>window.SCHOLARK_PUBLIC_DATA||{careers:[],methodology:{publicData:[],derived:[],limitations:[]},meta:{}};
  const friendly={home:'Home',tools:'Calculators',essay:'Essay Coach',dashboard:'Dashboard',profile:'Profile',goals:'GPA Goals',planner:'Study Planner',apps:'Applications',scholarships:'Scholarships',quiz:'College Match',community:'Community',counselor:'Admissions Guide',compare:'College Compare',progress:'Progress',intelligence:'College Intelligence',careers:'Career Outcomes',methodology:'Data & Methodology'};
  const icons={home:'⌂',tools:'🧮',essay:'✍️',dashboard:'📊',profile:'👤',goals:'🎯',planner:'📅',apps:'📁',scholarships:'🎓',quiz:'✨',community:'💬',counselor:'🧭',compare:'⚖️',progress:'📈',intelligence:'🔬',careers:'🧠',methodology:'📚'};
  const currentPage=()=>document.querySelector('.page.active')?.id?.replace('page-','')||'home';

  function loadStyles(){
    if(!document.querySelector('link[href="scholark-v4.css"]')){
      const l=document.createElement('link');l.rel='stylesheet';l.href='scholark-v4.css';document.head.appendChild(l);
    }
    document.body.classList.add('scholark-v4');
    document.documentElement.dataset.scholarkUi='4.0.0';
  }

  function ensurePage(id,html){
    if(document.getElementById('page-'+id))return document.getElementById('page-'+id);
    const el=document.createElement('div');el.className='page';el.id='page-'+id;el.innerHTML=html;document.body.insertBefore(el,document.querySelector('footer')||null);return el;
  }

  function installFlagshipPages(){
    ensurePage('intelligence',`<div class="sk4-page">
      <section class="sk4-hero">
        <div class="sk4-kicker">Public-data decision workspace</div>
        <h1>College Intelligence Lab</h1>
        <p>Go beyond a ranking number. Search, compare, and pressure-test college options with cost, selectivity, student-size, salary/outcome signals, and transparent ScholarK planning metrics.</p>
        <div class="sk4-proof"><article><strong>2,000+</strong><span>College Scorecard data elements available publicly</span></article><article><strong>3</strong><span>schools side-by-side</span></article><article><strong>0–100</strong><span>transparent Value Lens</span></article><article><strong>Source-first</strong><span>raw data separated from derived metrics</span></article></div>
      </section>
      <div class="sk4-toolbar"><label class="sk4-search">⌕ <input id="sk4-college-search" placeholder="Search colleges, cities, or types"></label><div class="sk4-chipbar" id="sk4-college-chips"></div></div>
      <div class="sk4-grid">
        <section class="sk4-panel wide"><h2>Explore institutions</h2><p>Tap up to three schools to compare. The displayed institutional fields are treated as public-data attributes; always verify current figures at the official source.</p><div id="sk4-college-results" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin-top:14px"></div></section>
        <aside class="sk4-panel accent"><h3>Your comparison</h3><div class="sk4-metric" id="sk4-compare-count">0 / 3</div><div class="sk4-submetric">schools selected</div><div id="sk4-selected-schools" style="display:grid;gap:7px;margin-top:13px"></div><button class="sk4-mini-btn" id="sk4-clear-schools" style="margin-top:12px">Clear comparison</button></aside>
        <section class="sk4-panel full" id="sk4-college-compare-panel"><h2>Decision matrix</h2><p>Select at least two schools to unlock the side-by-side matrix, value lens, and cost pressure view.</p><div id="sk4-college-matrix"></div></section>
        <section class="sk4-panel dark wide"><div class="sk4-kicker">Decision support, not a ranking</div><h2>What the Value Lens actually means</h2><p>ScholarK normalizes the displayed cost and earnings/outcome signals within your selected set, then combines them into a simple planning score. It is intentionally local to your comparison and does not claim one college is universally “better.”</p><div class="sk4-formula">Value Lens = 55% normalized earnings/outcome signal + 45% inverse cost pressure</div></section>
        <section class="sk4-panel"><h3>Public data source</h3><p>U.S. Department of Education College Scorecard / College Navigator. College Scorecard publishes cost, completion, debt, repayment, earnings, and field-of-study information for student decision-making.</p><button class="sk4-mini-btn" onclick="window.showPage('methodology')" style="margin-top:12px">Open methodology →</button></section>
      </div>
      <div class="sk4-source">Data note: ScholarK’s bundled institution comparison dataset may lag the latest federal refresh. Use it for exploration, then verify current cost, aid, admissions, and outcomes on College Scorecard and each institution’s official site before making decisions.</div>
    </div>`);

    ensurePage('careers',`<div class="sk4-page">
      <section class="sk4-hero">
        <div class="sk4-kicker">BLS-backed career intelligence</div>
        <h1>Major & Career Outcomes Explorer</h1>
        <p>Connect majors to real occupations and compare pay, projected growth, typical education, skills, and pathways using Bureau of Labor Statistics public data.</p>
        <div class="sk4-proof"><article><strong id="sk4-career-count">—</strong><span>career profiles</span></article><article><strong>2024</strong><span>median wage base year</span></article><article><strong>2034</strong><span>projection horizon</span></article><article><strong>0–100</strong><span>Career Momentum lens</span></article></div>
      </section>
      <div class="sk4-toolbar"><label class="sk4-search">⌕ <input id="sk4-career-search" placeholder="Search careers, majors, skills, or clusters"></label><div class="sk4-chipbar" id="sk4-career-chips"></div></div>
      <div class="sk4-grid">
        <section class="sk4-panel wide"><div style="display:flex;justify-content:space-between;gap:12px;align-items:end;flex-wrap:wrap"><div><h2>Explore career paths</h2><p>Choose up to three careers for a detailed side-by-side comparison.</p></div><select id="sk4-career-sort" style="max-width:190px"><option value="momentum">Sort: Career Momentum</option><option value="pay">Sort: Median pay</option><option value="growth">Sort: Growth</option><option value="name">Sort: A–Z</option></select></div><div id="sk4-career-results" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin-top:14px"></div></section>
        <aside class="sk4-panel accent"><h3>Career shortlist</h3><div class="sk4-metric" id="sk4-career-selected-count">0 / 3</div><div class="sk4-submetric">careers selected</div><div id="sk4-selected-careers" style="display:grid;gap:7px;margin-top:13px"></div><button class="sk4-mini-btn" id="sk4-clear-careers" style="margin-top:12px">Clear shortlist</button></aside>
        <section class="sk4-panel full"><h2>Outcome comparison</h2><div id="sk4-career-matrix"><p>Select at least two careers to compare wage, growth, education, and momentum.</p></div></section>
        <section class="sk4-panel wide dark"><div class="sk4-kicker">Transparent methodology</div><h2>Career Momentum is intentionally simple</h2><p>It combines two public BLS signals—median annual wage and projected employment growth—normalized against the careers displayed in ScholarK. It does not predict your salary, hiring odds, or personal fit.</p><div class="sk4-formula">Career Momentum = 60% normalized projected growth + 40% normalized median pay</div></section>
        <section class="sk4-panel"><h3>Why majors ≠ jobs</h3><p>Most majors lead to multiple occupations, and many occupations recruit from multiple majors. ScholarK shows common pathways and skills rather than pretending there is a one-to-one mapping.</p><button class="sk4-mini-btn" onclick="window.showPage('methodology')" style="margin-top:12px">See data limits →</button></section>
      </div>
      <div class="sk4-source">Source: U.S. Bureau of Labor Statistics Occupational Outlook Handbook / Employment Projections. Wages are medians for workers in the occupation, not guaranteed starting salaries for new graduates.</div>
    </div>`);

    ensurePage('methodology',`<div class="sk4-page">
      <section class="sk4-hero"><div class="sk4-kicker">Transparency by design</div><h1>Data & Methodology</h1><p>Exactly what comes from public sources, what ScholarK calculates, what assumptions are used, and where the tool stops.</p><div class="sk4-proof"><article><strong>Raw</strong><span>source data labeled separately</span></article><article><strong>Derived</strong><span>formulas explained</span></article><article><strong>Limits</strong><span>prediction claims avoided</span></article><article><strong>Verify</strong><span>official sources remain final</span></article></div></section>
      <div class="sk4-method-grid" id="sk4-method-cards"></div>
      <div class="sk4-grid" style="margin-top:14px"><section class="sk4-panel wide"><h2>College Value Lens</h2><p>When two or more colleges are selected, ScholarK normalizes the displayed salary/outcome signal and tuition/cost field within that comparison set. Because it is relative to the selected schools, the score is a comparison aid—not a national ranking.</p><div class="sk4-formula">Outcome component = normalized displayed earnings signal<br>Cost component = 1 − normalized displayed tuition/cost pressure<br>Value Lens = 0.55 × outcome + 0.45 × cost</div></section><section class="sk4-panel"><h3>Career Momentum</h3><p>Career Momentum combines BLS projected employment growth and median annual pay against the careers in ScholarK.</p><div class="sk4-formula">0.60 × growth + 0.40 × pay</div></section></div>
      <div class="sk4-source" id="sk4-method-source"></div>
    </div>`);
  }

  function collegeDataset(){
    try{return typeof COLLEGE_DATA!=='undefined'&&Array.isArray(COLLEGE_DATA)?COLLEGE_DATA:[]}catch{return []}
  }
  let collegeFilter='All',selectedSchools=[];
  function collegeMetrics(c,set){
    const pays=set.map(x=>+x.salary||0).filter(Boolean), costs=set.map(x=>+x.tuition||0).filter(Boolean);
    const n=(v,arr,invert=false)=>{if(!arr.length)return 50;const min=Math.min(...arr),max=Math.max(...arr);const raw=max===min?50:((v-min)/(max-min))*100;return invert?100-raw:raw};
    const pay=n(+c.salary||0,pays), cost=n(+c.tuition||0,costs,true); return {value:Math.round(.55*pay+.45*cost),costPressure:c.salary?Math.round((c.tuition/c.salary)*100):null};
  }
  function renderCollegeChips(){
    const types=['All',...new Set(collegeDataset().map(c=>c.type).filter(Boolean))];
    const el=document.getElementById('sk4-college-chips');if(!el)return;el.innerHTML=types.map(t=>`<button class="sk4-chip ${collegeFilter===t?'active':''}" data-type="${esc(t)}">${esc(t)}</button>`).join('');el.querySelectorAll('button').forEach(b=>b.onclick=()=>{collegeFilter=b.dataset.type;renderCollegeChips();renderColleges()});
  }
  function filteredColleges(){
    const q=(document.getElementById('sk4-college-search')?.value||'').toLowerCase();return collegeDataset().filter(c=>(collegeFilter==='All'||c.type===collegeFilter)&&(!q||[c.name,c.loc,c.type,c.sat].join(' ').toLowerCase().includes(q))).slice(0,60);
  }
  function renderColleges(){
    const el=document.getElementById('sk4-college-results');if(!el)return;const list=filteredColleges();el.innerHTML=list.length?list.map(c=>{const selected=selectedSchools.some(x=>x.name===c.name);return `<article class="sk4-school-card" data-name="${esc(c.name)}" style="${selected?'border-color:var(--sk4-indigo);background:color-mix(in srgb,var(--sk4-indigo) 6%,var(--bg))':''}"><div class="sk4-card-head"><h3>${esc(c.name)}</h3><span>${selected?'✓':'+'}</span></div><small style="color:var(--ink3)">${esc(c.loc||'')} · ${esc(c.type||'Institution')}</small><div class="sk4-tags"><span class="sk4-tag">Accept ${Number.isFinite(+c.accept)?c.accept+'%':'—'}</span><span class="sk4-tag">Cost ${money(c.tuition)}</span><span class="sk4-tag">Outcome ${money(c.salary)}</span></div></article>`}).join(''):'<div class="sk4-panel full"><p>No colleges match those filters.</p></div>';
    el.querySelectorAll('.sk4-school-card').forEach(card=>card.onclick=()=>toggleSchool(card.dataset.name));
  }
  function toggleSchool(name){
    const c=collegeDataset().find(x=>x.name===name);if(!c)return;const i=selectedSchools.findIndex(x=>x.name===name);if(i>=0)selectedSchools.splice(i,1);else if(selectedSchools.length<3)selectedSchools.push(c);else return toast('You can compare up to three colleges at a time.','info');safeSet('college-shortlist',selectedSchools.map(x=>x.name));renderColleges();renderCollegeCompare();
  }
  function renderCollegeCompare(){
    const count=document.getElementById('sk4-compare-count'),sel=document.getElementById('sk4-selected-schools'),matrix=document.getElementById('sk4-college-matrix');if(count)count.textContent=selectedSchools.length+' / 3';if(sel)sel.innerHTML=selectedSchools.map(c=>`<button class="sk4-mini-btn" data-name="${esc(c.name)}">${esc(c.name)} ×</button>`).join('')||'<span style="font-size:11px;color:var(--ink3)">Nothing selected yet.</span>';sel?.querySelectorAll('button').forEach(b=>b.onclick=()=>toggleSchool(b.dataset.name));if(!matrix)return;if(selectedSchools.length<2){matrix.innerHTML='';return}
    const rows=[['Location',c=>c.loc],['Type',c=>c.type],['Acceptance',c=>Number.isFinite(+c.accept)?c.accept+'%':'—'],['Displayed cost',c=>money(c.tuition)],['SAT range',c=>c.sat||'—'],['Displayed outcome',c=>money(c.salary)],['Student ratio',c=>c.ratio||'—'],['Value Lens',c=>collegeMetrics(c,selectedSchools).value+'/100'],['Cost pressure',c=>{const x=collegeMetrics(c,selectedSchools).costPressure;return x===null?'—':x+'% of outcome signal'}]];
    matrix.innerHTML=`<div class="sk4-table-wrap"><table class="sk4-table"><thead><tr><th>Metric</th>${selectedSchools.map(c=>`<th>${esc(c.name)}</th>`).join('')}</tr></thead><tbody>${rows.map(([label,fn])=>`<tr><td><strong>${label}</strong></td>${selectedSchools.map(c=>`<td>${esc(fn(c))}</td>`).join('')}</tr>`).join('')}</tbody></table></div><div class="sk4-bars">${selectedSchools.map(c=>{const v=collegeMetrics(c,selectedSchools).value;return `<div class="sk4-bar-row"><strong>${esc(c.name.split(' ')[0])}</strong><div class="sk4-bar"><span style="width:${v}%"></span></div><b>${v}</b></div>`}).join('')}</div>`;
  }
  function initCollegeLab(){
    const stored=safeGet('college-shortlist',[]);selectedSchools=stored.map(n=>collegeDataset().find(c=>c.name===n)).filter(Boolean).slice(0,3);renderCollegeChips();renderColleges();renderCollegeCompare();document.getElementById('sk4-college-search')?.addEventListener('input',renderColleges);const clear=document.getElementById('sk4-clear-schools');if(clear)clear.onclick=()=>{selectedSchools=[];safeSet('college-shortlist',[]);renderColleges();renderCollegeCompare()};
  }

  let careerFilter='All',selectedCareers=[];
  function careerMomentum(c){
    const all=PUBLIC().careers||[];const pays=all.map(x=>x.pay),grows=all.map(x=>x.growth);const norm=(v,a)=>{const min=Math.min(...a),max=Math.max(...a);return max===min?50:(v-min)/(max-min)*100};return Math.round(.6*norm(c.growth,grows)+.4*norm(c.pay,pays));
  }
  function renderCareerChips(){
    const clusters=['All',...new Set(PUBLIC().careers.map(c=>c.cluster))];const el=document.getElementById('sk4-career-chips');if(!el)return;el.innerHTML=clusters.map(t=>`<button class="sk4-chip ${careerFilter===t?'active':''}" data-type="${esc(t)}">${esc(t)}</button>`).join('');el.querySelectorAll('button').forEach(b=>b.onclick=()=>{careerFilter=b.dataset.type;renderCareerChips();renderCareers()});
  }
  function filteredCareers(){
    const q=(document.getElementById('sk4-career-search')?.value||'').toLowerCase(),sort=document.getElementById('sk4-career-sort')?.value||'momentum';let a=PUBLIC().careers.filter(c=>(careerFilter==='All'||c.cluster===careerFilter)&&(!q||[c.name,c.cluster,c.education,...c.skills,...c.majors].join(' ').toLowerCase().includes(q)));a=[...a];if(sort==='pay')a.sort((x,y)=>y.pay-x.pay);else if(sort==='growth')a.sort((x,y)=>y.growth-x.growth);else if(sort==='name')a.sort((x,y)=>x.name.localeCompare(y.name));else a.sort((x,y)=>careerMomentum(y)-careerMomentum(x));return a;
  }
  function renderCareers(){
    const el=document.getElementById('sk4-career-results');if(!el)return;const list=filteredCareers();el.innerHTML=list.map(c=>{const selected=selectedCareers.some(x=>x.id===c.id),m=careerMomentum(c);return `<article class="sk4-career-card" data-id="${esc(c.id)}" style="${selected?'border-color:var(--sk4-indigo);background:color-mix(in srgb,var(--sk4-indigo) 6%,var(--bg))':''}"><div class="sk4-card-head"><h3>${c.icon} ${esc(c.name)}</h3><span>${selected?'✓':m}</span></div><small style="color:var(--ink3)">${esc(c.cluster)} · ${esc(c.education)}</small><div class="sk4-tags"><span class="sk4-tag">${money(c.pay)} median</span><span class="sk4-tag">${c.growth>=0?'+':''}${c.growth}% growth</span><span class="sk4-tag">Momentum ${m}</span></div><div class="sk4-tags">${c.majors.slice(0,3).map(mj=>`<span class="sk4-tag">${esc(mj)}</span>`).join('')}</div></article>`}).join('');el.querySelectorAll('.sk4-career-card').forEach(card=>card.onclick=()=>toggleCareer(card.dataset.id));
  }
  function toggleCareer(id){
    const c=PUBLIC().careers.find(x=>x.id===id);if(!c)return;const i=selectedCareers.findIndex(x=>x.id===id);if(i>=0)selectedCareers.splice(i,1);else if(selectedCareers.length<3)selectedCareers.push(c);else return toast('You can compare up to three careers at a time.');safeSet('career-shortlist',selectedCareers.map(x=>x.id));renderCareers();renderCareerCompare();
  }
  function renderCareerCompare(){
    const count=document.getElementById('sk4-career-selected-count'),sel=document.getElementById('sk4-selected-careers'),matrix=document.getElementById('sk4-career-matrix');if(count)count.textContent=selectedCareers.length+' / 3';if(sel)sel.innerHTML=selectedCareers.map(c=>`<button class="sk4-mini-btn" data-id="${esc(c.id)}">${c.icon} ${esc(c.name)} ×</button>`).join('')||'<span style="font-size:11px;color:var(--ink3)">No careers shortlisted.</span>';sel?.querySelectorAll('button').forEach(b=>b.onclick=()=>toggleCareer(b.dataset.id));if(!matrix)return;if(selectedCareers.length<2){matrix.innerHTML='<p>Select at least two careers to compare wage, growth, education, and momentum.</p>';return}
    const rows=[['Median annual wage',c=>money(c.pay)],['Projected growth',c=>(c.growth>=0?'+':'')+c.growth+'%'],['Typical education',c=>c.education],['Annual openings',c=>c.openings?Math.round(c.openings).toLocaleString():'—'],['Common majors',c=>c.majors.join(', ')],['Core skills',c=>c.skills.join(', ')],['Career Momentum',c=>careerMomentum(c)+'/100']];matrix.innerHTML=`<div class="sk4-table-wrap"><table class="sk4-table"><thead><tr><th>Metric</th>${selectedCareers.map(c=>`<th>${c.icon} ${esc(c.name)}</th>`).join('')}</tr></thead><tbody>${rows.map(([l,f])=>`<tr><td><strong>${l}</strong></td>${selectedCareers.map(c=>`<td>${esc(f(c))}</td>`).join('')}</tr>`).join('')}</tbody></table></div><div class="sk4-bars">${selectedCareers.map(c=>{const m=careerMomentum(c);return `<div class="sk4-bar-row"><strong>${esc(c.name.split(' ')[0])}</strong><div class="sk4-bar"><span style="width:${m}%"></span></div><b>${m}</b></div>`}).join('')}</div>`;
  }
  function initCareerLab(){
    document.getElementById('sk4-career-count').textContent=PUBLIC().careers.length;const stored=safeGet('career-shortlist',[]);selectedCareers=stored.map(id=>PUBLIC().careers.find(c=>c.id===id)).filter(Boolean).slice(0,3);renderCareerChips();renderCareers();renderCareerCompare();document.getElementById('sk4-career-search')?.addEventListener('input',renderCareers);document.getElementById('sk4-career-sort')?.addEventListener('change',renderCareers);const clear=document.getElementById('sk4-clear-careers');if(clear)clear.onclick=()=>{selectedCareers=[];safeSet('career-shortlist',[]);renderCareers();renderCareerCompare()};
  }

  function renderMethodology(){
    const m=PUBLIC().methodology,el=document.getElementById('sk4-method-cards');if(el)el.innerHTML=[['Public source data',m.publicData,'🔎'],['ScholarK-derived metrics',m.derived,'🧮'],['Limitations & verification',m.limitations,'⚠️']].map(([t,a,i])=>`<article class="sk4-method-card"><h3>${i} ${t}</h3><ul>${a.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></article>`).join('');const s=document.getElementById('sk4-method-source');if(s)s.innerHTML=`Primary public sources: <strong>${esc(PUBLIC().meta.collegeSource||'U.S. Department of Education College Scorecard')}</strong> and <strong>${esc(PUBLIC().meta.careerSource||'U.S. Bureau of Labor Statistics')}</strong>. Data publication periods differ by field and can lag the current school year.`;
  }

  /* MINI FEATURES */
  const commands=[
    ['home','Home','Return to ScholarK home'],['tools','Calculators','GPA, grades, loans, conversions'],['planner','Study Planner','Tasks and deadlines'],['apps','Application Tracker','Track college applications'],['essay','Essay Coach','Draft and revise essays'],['scholarships','Scholarships','Explore scholarship matches'],['intelligence','College Intelligence Lab','Public-data college decision workspace'],['careers','Career Outcomes Explorer','BLS-backed career comparison'],['compare','College Compare','Head-to-head college view'],['goals','GPA Goal Tracker','Model your GPA path'],['progress','Progress','Study activity and streaks'],['methodology','Data & Methodology','See sources, formulas, and limits']
  ];
  function installCommandPalette(){
    if(document.getElementById('sk4-command-overlay'))return;const o=document.createElement('div');o.className='sk4-overlay';o.id='sk4-command-overlay';o.innerHTML=`<div class="sk4-modal"><div class="sk4-modal-head"><h2>Jump anywhere</h2><button class="sk4-close">×</button></div><input class="sk4-command-input" id="sk4-command-query" placeholder="Search ScholarK…"><div class="sk4-command-results" id="sk4-command-results"></div></div>`;document.body.appendChild(o);o.querySelector('.sk4-close').onclick=()=>closeOverlay(o);o.addEventListener('click',e=>{if(e.target===o)closeOverlay(o)});const q=o.querySelector('input');q.oninput=renderCommands;document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openCommand()}if(e.key==='Escape'&&o.classList.contains('open'))closeOverlay(o)});renderCommands();
  }
  function renderCommands(){
    const q=(document.getElementById('sk4-command-query')?.value||'').toLowerCase(),el=document.getElementById('sk4-command-results');if(!el)return;const items=commands.filter(c=>!q||c.join(' ').toLowerCase().includes(q));el.innerHTML=items.map(([id,title,desc])=>`<div class="sk4-command-item" data-id="${id}"><div class="ico">${icons[id]||'→'}</div><div><strong>${title}</strong><small>${desc}</small></div><kbd>↵</kbd></div>`).join('');el.querySelectorAll('.sk4-command-item').forEach(x=>x.onclick=()=>{window.showPage?.(x.dataset.id);closeOverlay(document.getElementById('sk4-command-overlay'))});
  }
  function openCommand(){const o=document.getElementById('sk4-command-overlay');o?.classList.add('open');setTimeout(()=>document.getElementById('sk4-command-query')?.focus(),20)}
  function closeOverlay(o){o?.classList.remove('open')}

  let focus={seconds:safeGet('focus-seconds',25*60),running:false,timer:null};
  function installFocus(){
    const o=document.createElement('div');o.className='sk4-overlay';o.id='sk4-focus-overlay';o.innerHTML=`<div class="sk4-modal"><div class="sk4-modal-head"><h2>Focus Timer</h2><button class="sk4-close">×</button></div><div class="sk4-focus-card"><div class="sk4-kicker">One task. No tab hopping.</div><div class="sk4-focus-time" id="sk4-focus-time">25:00</div><div class="sk4-focus-actions"><button data-min="25">25 min</button><button data-min="50">50 min</button><button class="primary" id="sk4-focus-toggle">Start</button><button id="sk4-focus-reset">Reset</button></div><p style="margin-top:14px;font-size:11px;color:var(--ink3)">The timer stays local to this browser. Completing a session updates your ScholarK focus-session count.</p></div></div>`;document.body.appendChild(o);o.querySelector('.sk4-close').onclick=()=>closeOverlay(o);o.querySelectorAll('[data-min]').forEach(b=>b.onclick=()=>setFocus(+b.dataset.min));document.getElementById('sk4-focus-toggle').onclick=toggleFocus;document.getElementById('sk4-focus-reset').onclick=()=>{stopFocus();setFocus(25)};renderFocus();
  }
  function setFocus(min){stopFocus();focus.seconds=min*60;safeSet('focus-seconds',focus.seconds);renderFocus()}
  function renderFocus(){const m=String(Math.floor(focus.seconds/60)).padStart(2,'0'),s=String(focus.seconds%60).padStart(2,'0'),txt=m+':'+s;const a=document.getElementById('sk4-focus-time'),b=document.querySelector('.sk4-focus-readout');if(a)a.textContent=txt;if(b)b.textContent='⏱ '+txt;const t=document.getElementById('sk4-focus-toggle');if(t)t.textContent=focus.running?'Pause':'Start'}
  function toggleFocus(){if(focus.running){stopFocus();return}focus.running=true;focus.timer=setInterval(()=>{focus.seconds--;safeSet('focus-seconds',focus.seconds);renderFocus();if(focus.seconds<=0){stopFocus();safeSet('focus-sessions',safeGet('focus-sessions',0)+1);toast('Focus session complete — nice work!');setFocus(25);renderHomeCommandCenter()}},1000);renderFocus()}
  function stopFocus(){focus.running=false;if(focus.timer)clearInterval(focus.timer);focus.timer=null;renderFocus()}

  function installNotes(){
    const o=document.createElement('div');o.className='sk4-overlay';o.id='sk4-note-overlay';o.innerHTML=`<div class="sk4-modal"><div class="sk4-modal-head"><h2>Quick Notes</h2><button class="sk4-close">×</button></div><textarea class="sk4-note-area" id="sk4-note-area" placeholder="Capture an idea, deadline, question, or reminder…"></textarea><div class="sk4-note-foot"><span id="sk4-note-status">Saved locally</span><button class="sk4-mini-btn" id="sk4-note-clear">Clear note</button></div></div>`;document.body.appendChild(o);o.querySelector('.sk4-close').onclick=()=>closeOverlay(o);const a=document.getElementById('sk4-note-area');a.value=safeGet('quick-note','');a.oninput=()=>{safeSet('quick-note',a.value);document.getElementById('sk4-note-status').textContent='Saved just now'};document.getElementById('sk4-note-clear').onclick=()=>{a.value='';safeSet('quick-note','');toast('Quick note cleared.')};
  }

  function installDock(){
    if(document.querySelector('.sk4-dock'))return;const d=document.createElement('div');d.className='sk4-dock';d.innerHTML=`<button title="Command palette" data-action="command">⌘</button><button title="Focus timer" data-action="focus">⏱</button><button title="Quick notes" data-action="notes">✎</button><button title="Pin this page" data-action="pin">★</button><button title="Data & Methodology" data-action="method">ⓘ</button><button class="sk4-focus-readout" data-action="focus">⏱ 25:00</button>`;document.body.appendChild(d);d.querySelectorAll('button').forEach(b=>b.onclick=()=>{const a=b.dataset.action;if(a==='command')openCommand();if(a==='focus')document.getElementById('sk4-focus-overlay')?.classList.add('open');if(a==='notes')document.getElementById('sk4-note-overlay')?.classList.add('open');if(a==='pin')togglePin(currentPage());if(a==='method')window.showPage?.('methodology')});renderFocus();
  }
  function togglePin(page){if(['home','profile','methodology'].includes(page))return toast('Pin one of your working tools instead.');let pins=safeGet('pins',[]);pins=pins.includes(page)?pins.filter(x=>x!==page):[page,...pins].slice(0,6);safeSet('pins',pins);toast(pins.includes(page)?`${friendly[page]||page} pinned.`:`${friendly[page]||page} unpinned.`);renderHomeCommandCenter()}

  function installHomeCommandCenter(){
    const home=document.getElementById('page-home');if(!home||home.querySelector('.sk4-command-center'))return;const box=document.createElement('section');box.className='sk4-command-center';const hero=home.querySelector('.hero');if(hero)hero.insertAdjacentElement('afterend',box);else home.prepend(box);renderHomeCommandCenter();
  }
  function renderHomeCommandCenter(){
    const box=document.querySelector('.sk4-command-center');if(!box)return;const pins=safeGet('pins',[]),sessions=safeGet('focus-sessions',0),last=safeGet('last-legacy-page','planner');const note=safeGet('quick-note','');box.innerHTML=`<div class="sk4-command-shell"><div class="sk4-command-head"><div><div class="sk4-kicker">ScholarK command center</div><h2>Your academic workspace, connected.</h2><p>Jump back into work, use your pinned tools, start a focus sprint, or open the new public-data intelligence labs.</p></div><div class="sk4-command-shortcut">Ctrl / ⌘ + K</div></div><div class="sk4-command-grid"><article class="sk4-command-stat"><strong>${pins.length}</strong><span>pinned tools</span></article><article class="sk4-command-stat"><strong>${sessions}</strong><span>focus sessions</span></article><article class="sk4-command-stat"><strong>${note.trim()?note.trim().split(/\s+/).length:0}</strong><span>quick-note words</span></article><article class="sk4-command-stat"><strong>2</strong><span>new intelligence labs</span></article></div><div class="sk4-quick-row"><button data-page="${esc(last)}">↗ Continue ${esc(friendly[last]||'work')}</button>${pins.map(p=>`<button data-page="${p}">${icons[p]||'★'} ${esc(friendly[p]||p)}</button>`).join('')}<button data-page="intelligence">🔬 College Intelligence</button><button data-page="careers">🧠 Career Outcomes</button><button data-action="focus">⏱ Start focus</button><button data-action="notes">✎ Quick notes</button></div></div>`;box.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>window.showPage?.(b.dataset.page));box.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>{if(b.dataset.action==='focus')document.getElementById('sk4-focus-overlay')?.classList.add('open');if(b.dataset.action==='notes')document.getElementById('sk4-note-overlay')?.classList.add('open')});
  }

  function contextCopy(page){
    const map={tools:['Calculate with confidence','Your values autosave locally so you can leave and come back.'],planner:['Plan the week, not just the day','Use Today / Week / Overdue to turn the calendar into an action list.'],goals:['Model the path before guessing','What-if scenarios make your GPA target concrete.'],apps:['Keep every application moving','Track status and use ScholarK as a single application command center.'],essay:['Write, score, revise','Use rubric feedback as a revision guide—not a replacement for your own voice.'],scholarships:['Search with intent','Prioritize fit, deadline, and effort rather than applying randomly.'],compare:['Compare tradeoffs','Cost, environment, academics, and outcomes matter more than a single rank.'],progress:['Look for patterns','Progress is more useful when it changes what you do next.'],intelligence:['Interrogate the data','Compare source data and derived metrics separately.'],careers:['Explore pathways, not guarantees','Use public labor-market data as context, not a promise.']};return map[page]||['ScholarK workspace','Pin this page, start a focus timer, or jump anywhere with Ctrl / ⌘ + K.'];
  }
  function addContextBar(page){
    if(['home','ap','prep','sat','profile','features','about','methodology'].includes(page))return;const pg=document.getElementById('page-'+page);if(!pg||pg.querySelector('.sk4-context'))return;const [a,b]=contextCopy(page),bar=document.createElement('div');bar.className='sk4-context';bar.innerHTML=`<div class="sk4-context-card"><div class="sk4-context-icon">${icons[page]||'✦'}</div><div class="sk4-context-copy"><strong>${esc(a)}</strong><span>${esc(b)}</span></div></div><div class="sk4-context-actions"><button class="sk4-mini-btn" data-pin>★ Pin</button><button class="sk4-mini-btn" data-focus>⏱ Focus</button><button class="sk4-mini-btn" data-note>✎ Note</button></div>`;pg.prepend(bar);bar.querySelector('[data-pin]')?.addEventListener('click',()=>togglePin(page));bar.querySelector('[data-focus]')?.addEventListener('click',()=>document.getElementById('sk4-focus-overlay')?.classList.add('open'));bar.querySelector('[data-note]')?.addEventListener('click',()=>document.getElementById('sk4-note-overlay')?.classList.add('open'));
  }

  function installNavigation(){
    const nav=document.querySelector('nav .nav-links');if(nav&&!nav.querySelector('[data-sk4-nav]')){
      const intel=document.createElement('button');intel.className='nav-link';intel.dataset.sk4Nav='1';intel.textContent='Intelligence';intel.onclick=()=>window.showPage?.('intelligence');const careers=document.createElement('button');careers.className='nav-link';careers.dataset.sk4Nav='1';careers.textContent='Careers';careers.onclick=()=>window.showPage?.('careers');const before=nav.querySelector('.nav-features-cta,.profile-dropdown,#nav-signin-btn');nav.insertBefore(intel,before||null);nav.insertBefore(careers,before||null);
    }
    const logo=document.querySelector('.nav-logo');if(logo&&!logo.querySelector('.sk4-nav-badge'))logo.insertAdjacentHTML('beforeend','<span class="sk4-nav-badge">Next</span>');
    if(typeof window.showPage==='function'&&!window.showPage.__sk4v4){const original=window.showPage;const wrapped=function(name,...args){const result=original.call(this,name,...args);if(result!==false){if(!['home','ap','prep','sat'].includes(name))safeSet('last-legacy-page',name);setTimeout(()=>{addContextBar(name);if(name==='intelligence'){renderColleges();renderCollegeCompare()}if(name==='careers'){renderCareers();renderCareerCompare()}if(name==='methodology')renderMethodology();},0)}return result};wrapped.__sk4v4=true;window.showPage=wrapped}
  }

  function installFeaturePromos(){
    const page=document.getElementById('page-features'),grid=page?.querySelector('.features-grid');if(!grid||grid.querySelector('[data-sk4-feature]'))return;const a=document.createElement('div');a.className='feature-overview-card featured';a.dataset.sk4Feature='1';a.innerHTML=`<div class="overview-badge">New flagship</div><div class="overview-title">Research & Decide</div><ul class="overview-list"><li><span class="feat-check">✓</span> College Intelligence Lab</li><li><span class="feat-check">✓</span> Major & Career Outcomes Explorer</li><li><span class="feat-check">✓</span> Public-data source labeling</li><li><span class="feat-check">✓</span> Transparent Value / Momentum lenses</li><li><span class="feat-check">✓</span> Data & Methodology center</li></ul><button class="overview-button filled" onclick="showPage('intelligence')">Open Intelligence Lab →</button>`;grid.appendChild(a);
    const b=document.createElement('div');b.className='feature-overview-card';b.dataset.sk4Feature='1';b.innerHTML=`<div class="overview-title">Workspace Utilities</div><ul class="overview-list"><li><span class="feat-check">✓</span> Global command palette</li><li><span class="feat-check">✓</span> Focus timer</li><li><span class="feat-check">✓</span> Quick notes</li><li><span class="feat-check">✓</span> Pinned tools</li><li><span class="feat-check">✓</span> Contextual action bars</li><li><span class="feat-check">✓</span> Continue-work command center</li></ul><button class="overview-button dark" onclick="showPage('home')">Open Command Center →</button>`;grid.appendChild(b);
  }

  function auditRuntime(){
    const required=['page-intelligence','page-careers','page-methodology','sk4-command-overlay','sk4-focus-overlay','sk4-note-overlay'];const missing=required.filter(id=>!document.getElementById(id));const report={version:VERSION,missing,careers:PUBLIC().careers.length,colleges:collegeDataset().length,checkedAt:new Date().toISOString()};window.ScholarkV4Audit=report;if(missing.length)console.error('ScholarK V4 runtime audit failed',report);else console.info('ScholarK V4 runtime audit PASS',report);
  }

  function boot(){
    loadStyles();installFlagshipPages();installCommandPalette();installFocus();installNotes();installDock();installHomeCommandCenter();installNavigation();installFeaturePromos();initCollegeLab();initCareerLab();renderMethodology();document.querySelectorAll('.page').forEach(p=>addContextBar(p.id.replace('page-','')));auditRuntime();window.ScholarkV4={version:VERSION,openCommand,togglePin,careerMomentum,collegeMetrics,audit:auditRuntime};
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();