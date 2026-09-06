/* Scholark V4 public-data layer.
   Sources are deliberately explicit so UI can distinguish source data from Scholark-derived planning metrics. */
window.SCHOLARK_PUBLIC_DATA = {
  meta: {
    version: '2026.08',
    collegeSource: 'U.S. Department of Education — College Scorecard / College Navigator',
    collegeSourceUrl: 'https://collegescorecard.ed.gov/',
    careerSource: 'U.S. Bureau of Labor Statistics — Occupational Outlook Handbook / Employment Projections',
    careerSourceUrl: 'https://www.bls.gov/ooh/',
    careerWagePeriod: 'May 2024 median annual wage',
    careerProjectionPeriod: '2024–2034 employment projection',
    note: 'Public-data values are descriptive, not individual predictions. Scholark-derived indexes are planning aids only.'
  },
  careers: [
    {id:'software-developer',name:'Software Developer',cluster:'Technology',soc:'15-1252',pay:133080,growth:15.8,openings:115200,education:"Bachelor’s degree",icon:'💻',skills:['Programming','Systems thinking','Problem solving'],majors:['Computer Science','Software Engineering','Computer Engineering'],source:'BLS Employment Projections / OOH'},
    {id:'data-scientist',name:'Data Scientist',cluster:'Data & AI',soc:'15-2051',pay:112590,growth:34,openings:23400,education:"Bachelor’s degree",icon:'📊',skills:['Statistics','Python/R','Modeling'],majors:['Data Science','Statistics','Computer Science','Mathematics'],source:'BLS OOH'},
    {id:'financial-analyst',name:'Financial & Investment Analyst',cluster:'Finance',soc:'13-2051',pay:101350,growth:6,openings:29900,education:"Bachelor’s degree",icon:'📈',skills:['Financial modeling','Accounting','Research'],majors:['Finance','Economics','Accounting','Business'],source:'BLS OOH (financial analysts group openings)'},
    {id:'registered-nurse',name:'Registered Nurse',cluster:'Health',soc:'29-1141',pay:93600,growth:5,openings:189100,education:'Approved nursing program + licensure',icon:'🩺',skills:['Clinical judgment','Communication','Care coordination'],majors:['Nursing'],source:'BLS OOH'},
    {id:'web-developer',name:'Web Developer',cluster:'Technology',soc:'15-1254',pay:90930,growth:7.5,openings:5400,education:'Typical entry data: bachelor’s degree; requirements vary by employer',icon:'🌐',skills:['Web development','UX basics','Debugging'],majors:['Computer Science','Information Systems','Web Development'],source:'BLS Employment Projections / OOH'},
    {id:'information-security',name:'Information Security Analyst',cluster:'Cybersecurity',soc:'15-1212',pay:124910,growth:29,openings:16000,education:"Bachelor’s degree typically",icon:'🔐',skills:['Security analysis','Networks','Incident response'],majors:['Cybersecurity','Computer Science','Information Systems'],source:'BLS OOH'},
    {id:'operations-research',name:'Operations Research Analyst',cluster:'Analytics',soc:'15-2031',pay:91290,growth:21,openings:9600,education:"Bachelor’s degree",icon:'🧠',skills:['Optimization','Statistics','Decision science'],majors:['Operations Research','Industrial Engineering','Mathematics','Data Science'],source:'BLS OOH'},
    {id:'market-research',name:'Market Research Analyst',cluster:'Business',soc:'13-1161',pay:76950,growth:7,openings:87200,education:"Bachelor’s degree",icon:'🔎',skills:['Research','Consumer analysis','Presentation'],majors:['Marketing','Business','Economics','Statistics'],source:'BLS OOH'},
    {id:'economist',name:'Economist',cluster:'Economics',soc:'19-3011',pay:115440,growth:1,openings:900,education:"Master’s degree typically",icon:'🏛️',skills:['Econometrics','Research','Policy analysis'],majors:['Economics','Mathematics','Statistics'],source:'BLS OOH'}
  ],
  methodology: {
    publicData: [
      'College research surfaces public institutional attributes already used by Scholark and labels them as source data.',
      'Career outcomes use Bureau of Labor Statistics occupational wage and projection fields. Occupation outcomes are not the same as outcomes for every graduate of a particular major.',
      'College Scorecard publishes institution- and field-of-study-level outcomes including cost, completion, debt, repayment and earnings; Scholark directs users to the official source for current verification.'
    ],
    derived: [
      'Value Lens is a transparent 0–100 planning index combining normalized displayed outcome signals with inverse cost pressure inside the selected comparison set. It is not a ranking and should not replace net-price calculations.',
      'Career Momentum is a 0–100 planning index combining projected job growth and median pay relative to the careers displayed in Scholark.',
      'Fit signals reflect only preferences selected inside Scholark and are not admissions or employment predictions.'
    ],
    limitations: [
      'Published data can lag the current academic year and may represent different cohorts.',
      'Institution-wide averages can hide large differences by major, residency, aid, demographic group and credential level.',
      'Median occupational pay describes workers in an occupation, not guaranteed starting salary for a new graduate.',
      'Some BLS opening counts are published at grouped occupation levels; Scholark labels grouped values where applicable.',
      'Students should verify current cost, admissions, aid and program information on official institution and government sites before making decisions.'
    ]
  }
};