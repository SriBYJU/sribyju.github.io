/* ScholarK V4 public-data layer.
   Sources are deliberately explicit so UI can distinguish source data from ScholarK-derived planning metrics. */
window.SCHOLARK_PUBLIC_DATA = {
  meta: {
    version: '2026.08',
    collegeSource: 'U.S. Department of Education — College Scorecard / College Navigator',
    collegeSourceUrl: 'https://collegescorecard.ed.gov/',
    careerSource: 'U.S. Bureau of Labor Statistics — Occupational Outlook Handbook / Employment Projections',
    careerSourceUrl: 'https://www.bls.gov/ooh/',
    careerWagePeriod: 'May 2024 median annual wage',
    careerProjectionPeriod: '2024–2034 employment projection',
    note: 'Public-data values are descriptive, not individual predictions. ScholarK-derived indexes are planning aids only.'
  },
  careers: [
    {id:'software-developer',name:'Software Developer',cluster:'Technology',soc:'15-1252',pay:133080,growth:16,openings:129200,education:"Bachelor’s degree",icon:'💻',skills:['Programming','Systems thinking','Problem solving'],majors:['Computer Science','Software Engineering','Computer Engineering'],source:'BLS OOH'},
    {id:'data-scientist',name:'Data Scientist',cluster:'Data & AI',soc:'15-2051',pay:112590,growth:34,openings:23400,education:"Bachelor’s degree",icon:'📊',skills:['Statistics','Python/R','Modeling'],majors:['Data Science','Statistics','Computer Science','Mathematics'],source:'BLS OOH'},
    {id:'financial-analyst',name:'Financial & Investment Analyst',cluster:'Finance',soc:'13-2051',pay:101350,growth:6,openings:29900,education:"Bachelor’s degree",icon:'📈',skills:['Financial modeling','Accounting','Research'],majors:['Finance','Economics','Accounting','Business'],source:'BLS OOH'},
    {id:'financial-risk',name:'Financial Risk Specialist',cluster:'Finance',soc:'13-2054',pay:106000,growth:6,openings:29900,education:"Bachelor’s degree",icon:'🛡️',skills:['Risk modeling','Markets','Statistics'],majors:['Finance','Economics','Statistics','Mathematics'],source:'BLS OOH'},
    {id:'registered-nurse',name:'Registered Nurse',cluster:'Health',soc:'29-1141',pay:93600,growth:5,openings:194500,education:"Bachelor’s degree often preferred",icon:'🩺',skills:['Clinical judgment','Communication','Care coordination'],majors:['Nursing'],source:'BLS OOH'},
    {id:'web-developer',name:'Web Developer',cluster:'Technology',soc:'15-1254',pay:90930,growth:8,openings:14500,education:'Varies; portfolio matters',icon:'🌐',skills:['Web development','UX basics','Debugging'],majors:['Computer Science','Information Systems','Web Development'],source:'BLS OOH'},
    {id:'information-security',name:'Information Security Analyst',cluster:'Cybersecurity',soc:'15-1212',pay:124910,growth:29,openings:16600,education:"Bachelor’s degree",icon:'🔐',skills:['Security analysis','Networks','Incident response'],majors:['Cybersecurity','Computer Science','Information Systems'],source:'BLS OOH'},
    {id:'operations-research',name:'Operations Research Analyst',cluster:'Analytics',soc:'15-2031',pay:91890,growth:23,openings:11600,education:"Bachelor’s degree",icon:'🧠',skills:['Optimization','Statistics','Decision science'],majors:['Operations Research','Industrial Engineering','Mathematics','Data Science'],source:'BLS OOH'},
    {id:'market-research',name:'Market Research Analyst',cluster:'Business',soc:'13-1161',pay:76190,growth:8,openings:88500,education:"Bachelor’s degree",icon:'🔎',skills:['Research','Consumer analysis','Presentation'],majors:['Marketing','Business','Economics','Statistics'],source:'BLS OOH'},
    {id:'accountant',name:'Accountant / Auditor',cluster:'Business',soc:'13-2011',pay:81680,growth:6,openings:130800,education:"Bachelor’s degree",icon:'🧾',skills:['Accounting','Audit','Financial reporting'],majors:['Accounting','Finance'],source:'BLS OOH'},
    {id:'civil-engineer',name:'Civil Engineer',cluster:'Engineering',soc:'17-2051',pay:99590,growth:5,openings:21600,education:"Bachelor’s degree",icon:'🏗️',skills:['Engineering design','Project planning','Math'],majors:['Civil Engineering'],source:'BLS OOH'},
    {id:'mechanical-engineer',name:'Mechanical Engineer',cluster:'Engineering',soc:'17-2141',pay:102320,growth:9,openings:19300,education:"Bachelor’s degree",icon:'⚙️',skills:['CAD','Mechanics','Product design'],majors:['Mechanical Engineering'],source:'BLS OOH'},
    {id:'lawyer',name:'Lawyer',cluster:'Law',soc:'23-1011',pay:151160,growth:5,openings:31700,education:'Professional degree (J.D.)',icon:'⚖️',skills:['Writing','Analysis','Advocacy'],majors:['Political Science','History','Economics','Philosophy'],source:'BLS OOH'},
    {id:'economist',name:'Economist',cluster:'Economics',soc:'19-3011',pay:115440,growth:1,openings:900,education:"Master’s degree typically",icon:'🏛️',skills:['Econometrics','Research','Policy analysis'],majors:['Economics','Mathematics','Statistics'],source:'BLS OOH'},
    {id:'teacher-secondary',name:'High School Teacher',cluster:'Education',soc:'25-2031',pay:64580,growth:-2,openings:66800,education:"Bachelor’s degree + licensure",icon:'🍎',skills:['Instruction','Communication','Subject expertise'],majors:['Education','Subject-specific major'],source:'BLS OOH'},
    {id:'architect',name:'Architect',cluster:'Design & Built Environment',soc:'17-1011',pay:96510,growth:4,openings:8500,education:'Professional architecture degree',icon:'📐',skills:['Design','CAD/BIM','Spatial reasoning'],majors:['Architecture'],source:'BLS OOH'},
    {id:'psychologist',name:'Psychologist',cluster:'Behavioral Science',soc:'19-3030',pay:94310,growth:6,openings:13300,education:'Advanced degree typically',icon:'🧠',skills:['Assessment','Research','Communication'],majors:['Psychology'],source:'BLS OOH'},
    {id:'biomedical-engineer',name:'Bioengineer / Biomedical Engineer',cluster:'Engineering & Health',soc:'17-2031',pay:106950,growth:5,openings:1400,education:"Bachelor’s degree",icon:'🧬',skills:['Biology','Engineering','Design'],majors:['Biomedical Engineering','Bioengineering'],source:'BLS OOH'}
  ],
  methodology: {
    publicData: [
      'College research surfaces public institutional attributes already used by ScholarK and labels them as source data.',
      'Career outcomes use Bureau of Labor Statistics occupational wage and projection fields. Occupation outcomes are not the same as outcomes for every graduate of a particular major.',
      'College Scorecard publishes institution- and field-of-study-level outcomes including cost, completion, debt, repayment and earnings; ScholarK links users back to the official source for current verification.'
    ],
    derived: [
      'Value Lens is a transparent 0–100 planning index combining normalized completion/outcome signals with cost pressure. It is not a ranking and should not replace net-price calculations.',
      'Career Momentum is a 0–100 planning index combining projected job growth and median pay relative to the displayed career set.',
      'Fit scores reflect only preferences selected inside ScholarK and are not admissions or employment predictions.'
    ],
    limitations: [
      'Published data can lag the current academic year and may represent different cohorts.',
      'Institution-wide averages can hide large differences by major, residency, aid, demographic group and credential level.',
      'Median occupational pay describes workers in an occupation, not guaranteed starting salary for a new graduate.',
      'Students should verify current cost, admissions, aid and program information on official institution and government sites before making decisions.'
    ]
  }
};