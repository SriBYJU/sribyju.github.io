/**
 * GradeScope — Automated Weekly College Tips Email
 *
 * Runs via GitHub Actions every Monday at 8 AM ET (12:00 UTC).
 * Reads subscribers from Firestore, sends branded email via Gmail SMTP.
 *
 * Required environment variables:
 *   FIREBASE_SERVICE_ACCOUNT — JSON string of Firebase service account key
 *   EMAIL_USER              — Gmail address to send from
 *   EMAIL_PASS              — Gmail App Password (not your regular password)
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { createTransport } from "nodemailer";

// ── Firebase setup ──────────────────────────────────────────
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// ── 52 unique weekly tips — one for each week of the year ───
const WEEKLY_TIPS = [
  {
    subject: "5 GPA Boosters You're Probably Ignoring",
    tips: [
      "Attend every office hour at least once — professors remember faces when grading borderline cases.",
      "Use the first week of class to scope out the syllabus and front-load readings for heavy weeks.",
      "Form a study group of exactly 3–4 people — large groups get off track, solo studying misses blind spots.",
      "Rewrite your notes within 24 hours of each lecture — this alone can boost retention by 60%.",
      "Track your grades in a spreadsheet so you know exactly what you need on finals."
    ]
  },
  {
    subject: "College App Deadlines You Can't Miss This Month",
    tips: [
      "Early Decision deadlines are typically November 1–15 — mark these NOW if you have a top choice.",
      "FAFSA opens October 1 — filing early gives you the best shot at need-based aid.",
      "Request recommendation letters at least 4 weeks before your earliest deadline.",
      "Many scholarship deadlines cluster in December and January — build a spreadsheet to track them.",
      "Check if your target schools have supplemental essays — these take longer than you think."
    ]
  },
  {
    subject: "How to Write a Common App Essay That Stands Out",
    tips: [
      "Start with a specific moment, not a broad statement — 'The smell of burnt rice filled the kitchen' beats 'I learned a lot from cooking.'",
      "Show, don't tell: describe actions and details rather than stating emotions directly.",
      "Your essay doesn't need a dramatic topic — everyday moments often make the strongest essays.",
      "Read your essay out loud to catch awkward phrasing — if you stumble, your reader will too.",
      "Have someone who doesn't know you well read it — if they can describe your personality afterward, it works."
    ]
  },
  {
    subject: "Smart Financial Moves for College-Bound Students",
    tips: [
      "Always file the FAFSA, even if you think your family earns too much — many merit scholarships require it.",
      "Compare the NET cost (after aid), not the sticker price — a $60K school might cost less than a $30K one.",
      "Apply for at least 10 scholarships — it's a numbers game, and small awards add up fast.",
      "Federal loans have better protections than private loans — always max out federal aid first.",
      "Ask about tuition payment plans — many schools let you split costs into monthly installments at 0% interest."
    ]
  },
  {
    subject: "SAT/ACT Prep Tips That Actually Work",
    tips: [
      "Take a full-length practice test under real conditions before you start studying — know your baseline.",
      "Focus 80% of your study time on your weakest areas — a 100-point jump in math is easier than 50 more in reading.",
      "Learn to eliminate wrong answers — even guessing between 2 options gives you a 50% shot.",
      "Khan Academy's free SAT prep is as effective as expensive courses — use it consistently for 6–8 weeks.",
      "Register early for your preferred test date — popular centers fill up fast, especially in October and March."
    ]
  },
  {
    subject: "Building an Extracurricular Profile That Impresses",
    tips: [
      "Depth beats breadth — leading one club for 3 years impresses more than joining 8 clubs senior year.",
      "Start something new if nothing exists for your passion — initiative is the #1 trait admissions officers cite.",
      "Document your hours, roles, and accomplishments as you go — you'll forget details by application time.",
      "Tie extracurriculars to your intended major when possible — it shows genuine interest, not résumé padding.",
      "Summer activities matter — use breaks for internships, research, volunteering, or passion projects."
    ]
  },
  {
    subject: "How to Ace Your College Interview",
    tips: [
      "Research 3 specific things about the school that excite you — generic enthusiasm is easy to spot.",
      "Prepare 2–3 stories that show your character — anecdotes are more memorable than adjectives.",
      "Ask thoughtful questions: 'What's something you wish you'd known as a freshman here?' works great.",
      "Dress one level above what students wear on campus — business casual is usually perfect.",
      "Send a thank-you email within 24 hours — mention something specific from your conversation."
    ]
  },
  {
    subject: "Making Your College List: Reach, Match, & Safety",
    tips: [
      "Aim for 2–3 reach schools, 3–4 match schools, and 2–3 safety schools — 8–10 total is the sweet spot.",
      "A 'safety' school should be somewhere you'd genuinely be happy attending — not just a backup.",
      "Look beyond rankings: class size, location, research opportunities, and campus culture matter more for your experience.",
      "Visit campuses if possible — or at minimum, attend virtual info sessions and connect with current students.",
      "Check 4-year graduation rates, not just acceptance rates — this impacts your total cost significantly."
    ]
  },
  {
    subject: "Study Hacks: Work Smarter, Not Harder",
    tips: [
      "Use the Pomodoro Technique: 25 minutes of focused work, 5-minute break — your brain retains more in short bursts.",
      "Study in the same place at the same time — routine builds automatic focus over time.",
      "Teach concepts to someone else — if you can explain it simply, you truly understand it.",
      "Switch between subjects every 60–90 minutes — interleaving actually strengthens long-term memory.",
      "Get 7–8 hours of sleep before exams — pulling all-nighters hurts performance more than it helps."
    ]
  },
  {
    subject: "Letters of Recommendation: The Complete Guide",
    tips: [
      "Ask teachers who know you well AND can speak to your growth — a B+ student who improved impresses more than a quiet A student.",
      "Provide a 'brag sheet' with your accomplishments, goals, and specific moments from their class.",
      "Ask in person first, then follow up with an email containing all deadlines and submission details.",
      "Choose recommenders from different areas — one STEM, one humanities gives a well-rounded picture.",
      "Give at least 4 weeks' notice — rushed letters are generic letters."
    ]
  },
  {
    subject: "Choosing Your College Major: What to Consider",
    tips: [
      "You don't need to know your major before applying — 'Undecided' is a perfectly valid choice at most schools.",
      "Take intro courses in 3–4 different areas freshman year — many students discover unexpected passions.",
      "Talk to upperclassmen and recent graduates in majors you're considering — they'll give you the real picture.",
      "Consider the intersection of what you enjoy, what you're good at, and what has career opportunities.",
      "Double majors and minors exist — you don't always have to choose just one path."
    ]
  },
  {
    subject: "Financial Aid Appeals: How to Ask for More Money",
    tips: [
      "Many schools will match or beat a competing offer — send your best aid package to your top-choice school.",
      "Write a professional appeal letter citing specific circumstances: job loss, medical bills, or competing offers.",
      "Call the financial aid office and be polite but direct — 'Is there any additional aid available?' works surprisingly often.",
      "Update your FAFSA if your family's financial situation has changed since filing.",
      "Deadlines for appeals vary — act within 2 weeks of receiving your initial aid package."
    ]
  },
  {
    subject: "Campus Visit Checklist: What to Look For",
    tips: [
      "Eat in the dining hall and sit with students — the vibe at lunch tells you a lot about campus culture.",
      "Visit on a regular weekday, not just admitted students day — you'll see the real campus experience.",
      "Check the dorm rooms, laundry facilities, and common spaces — you'll spend more time here than in classrooms.",
      "Ask students: 'What would you change about this school?' — their honest answers are gold.",
      "Walk around at night to get a sense of campus safety and how active the campus feels after dark."
    ]
  },
  {
    subject: "Time Management for High Schoolers",
    tips: [
      "Use a planner (digital or paper) — students who plan their week on Sunday consistently outperform those who don't.",
      "Block out study time like it's a class — if it's not scheduled, it probably won't happen.",
      "Learn to say no to low-value commitments — being busy isn't the same as being productive.",
      "Batch similar tasks together: all college research in one session, all homework in another.",
      "Build in buffer time — unexpected things always come up, and a packed schedule leads to burnout."
    ]
  },
  {
    subject: "Gap Year: Pros, Cons, and How to Decide",
    tips: [
      "A structured gap year (work, travel, volunteering) is viewed positively by most admissions offices.",
      "Apply to colleges during senior year even if you plan a gap year — you can defer most acceptances.",
      "Use a gap year to develop a skill, gain work experience, or explore a passion — don't just 'take time off.'",
      "Budget carefully — gap years can save money (through working) or cost money (through travel).",
      "Programs like AmeriCorps, City Year, and WWOOF provide structure and meaningful experience."
    ]
  },
  {
    subject: "How to Handle College Rejection",
    tips: [
      "A rejection is not a reflection of your worth — highly qualified students get rejected from top schools every year.",
      "Give yourself 24–48 hours to feel disappointed, then refocus on the schools that accepted you.",
      "Many successful people attended their 'safety' school and thrived — your effort matters more than the name.",
      "If you're set on a specific school, consider transferring after a strong freshman year elsewhere.",
      "Reach out to current students at your accepted schools — you'll likely find reasons to be excited."
    ]
  },
  {
    subject: "Summer Before College: How to Prepare",
    tips: [
      "Connect with your future roommate on social media — establish a friendly relationship before move-in.",
      "Take care of health requirements early: vaccinations, health forms, and insurance paperwork have deadlines.",
      "Set up your college email and check it regularly — important orientation info comes through early.",
      "Practice basic life skills: laundry, cooking simple meals, budgeting, and managing your own schedule.",
      "Read one or two books from your first-semester syllabi — it reduces stress and gives you a head start."
    ]
  },
  {
    subject: "Weighted vs Unweighted GPA: What Colleges Really Look At",
    tips: [
      "Most colleges recalculate your GPA using their own formula — so don't stress about small differences.",
      "Taking AP/Honors courses matters more than a perfect GPA in regular classes — rigor is key.",
      "An upward trend (improving grades over time) is viewed very favorably, even if your overall GPA isn't perfect.",
      "Some colleges only look at core academic courses — PE and electives may not count in their calculation.",
      "When in doubt, focus on taking the hardest courses available to you AND getting good grades in them."
    ]
  },
  {
    subject: "How to Choose Between Two Colleges",
    tips: [
      "Make a spreadsheet comparing: cost, programs, location, campus feel, career outcomes, and gut feeling.",
      "Visit both campuses (if possible) and picture yourself living there for 4 years — which feels right?",
      "Talk to current students and alumni — ask about their experience, not just statistics.",
      "Don't let prestige be the deciding factor — the 'best' school is the one where you'll thrive.",
      "If all else is equal, choose the school that offers the least debt — your future self will thank you."
    ]
  },
  {
    subject: "AP Classes: How Many Should You Take?",
    tips: [
      "Quality over quantity — getting 5s in 3 APs impresses more than getting 3s in 7 APs.",
      "Take APs in subjects you're genuinely interested in — your enthusiasm will show in your grades and essays.",
      "Most competitive colleges want to see 4–8 AP courses over your high school career.",
      "Check if your target colleges accept AP credits — some top schools don't, which changes the calculus.",
      "Don't sacrifice your mental health for one more AP — admissions officers can spot burnout in applications."
    ]
  },
  {
    subject: "Building Your College Resume",
    tips: [
      "Your resume should be one page — admissions officers spend about 30 seconds scanning it.",
      "Lead with your strongest activities, not chronological order — put your best foot forward.",
      "Use numbers to quantify impact: 'Raised $2,500 for charity' beats 'Organized fundraisers.'",
      "Include leadership roles, even small ones — 'trained 3 new volunteers' shows initiative.",
      "Keep formatting clean and simple — no fancy fonts, colors, or graphics."
    ]
  },
  {
    subject: "Dealing with Test Anxiety",
    tips: [
      "Practice deep breathing: 4 counts in, hold for 4, out for 4 — this activates your calm-down response.",
      "Arrive early and get settled — rushing in increases cortisol, which blocks memory recall.",
      "If you blank out, skip to easier questions first — momentum builds confidence.",
      "Reframe anxiety as excitement — your body can't tell the difference, and 'I'm excited' performs better than 'I'm nervous.'",
      "Progressive muscle relaxation (tensing and releasing muscle groups) can reduce anxiety by 40% in 5 minutes."
    ]
  },
  {
    subject: "Community Service That Makes a Difference",
    tips: [
      "Choose causes you genuinely care about — authentic passion comes through in applications.",
      "Commit to one organization long-term rather than random one-off events — consistency matters.",
      "Take initiative to create your own project — founding something new shows leadership.",
      "Document your impact with numbers: hours served, people helped, funds raised.",
      "Reflect on what you learned — the best 'community service' essays focus on personal growth, not just the work."
    ]
  },
  {
    subject: "Navigating the Common App: Tips & Tricks",
    tips: [
      "Start your Common App in August — you'll need time for the personal statement and school-specific supplements.",
      "Use the Additional Information section sparingly — only for context that doesn't fit elsewhere (family circumstances, gaps).",
      "List activities in order of importance to you, not impressiveness — authenticity wins.",
      "Have 3 people proofread everything — typos in your application look careless.",
      "Save your work frequently and keep a backup document — technical glitches happen."
    ]
  },
  {
    subject: "College Dorm Life: What to Expect",
    tips: [
      "Bring less than you think — dorm rooms are tiny, and you can always buy things locally.",
      "Establish boundaries with your roommate early: quiet hours, guests, shared items, cleaning schedule.",
      "Get a good mattress topper — dorm beds are notoriously uncomfortable and sleep affects your grades.",
      "Leave your door open during the first few weeks — this is the easiest way to meet people on your floor.",
      "Join the floor GroupChat or Discord — it's where you'll hear about free food, study groups, and events."
    ]
  },
  {
    subject: "Scholarship Essay Tips",
    tips: [
      "Answer the prompt directly — the #1 reason scholarship essays lose is going off-topic.",
      "Tell a specific story that connects your past experience to your future goals.",
      "Show financial need without being melodramatic — committees respect dignity and determination.",
      "Recycle and adapt strong essays across multiple scholarships — don't rewrite from scratch each time.",
      "Follow word counts precisely — going over or under signals that you don't follow instructions."
    ]
  },
  {
    subject: "Senior Year: Don't Let Senioritis Tank Your Grades",
    tips: [
      "Colleges CAN and DO rescind acceptances for significant grade drops — keep your grades within one letter grade.",
      "Set small, weekly goals instead of semester-long ones — it's easier to stay motivated in short sprints.",
      "Remember: your final transcript is sent to your college — D's and F's in senior year raise red flags.",
      "Stay involved in your activities — quitting everything senior year looks bad to colleges.",
      "Channel your energy into excitement for college rather than checking out of high school."
    ]
  },
  {
    subject: "Making the Most of College Fairs",
    tips: [
      "Research 5–10 schools before the fair — going in blind wastes everyone's time.",
      "Prepare 3 questions you can't easily Google: 'What makes your engineering program unique?' beats 'How many students do you have?'",
      "Collect business cards and email reps afterward — demonstrated interest matters at many schools.",
      "Bring a notebook or use your phone to take notes — you'll forget details after talking to 10+ schools.",
      "Dress neatly — first impressions matter, even at casual fairs."
    ]
  },
  {
    subject: "Understanding Financial Aid Packages",
    tips: [
      "Compare 'net cost' (total cost minus grants/scholarships) — this is what you'll actually pay.",
      "Grants and scholarships are free money; loans are not — prioritize schools that offer more gift aid.",
      "Work-study is an earning opportunity, not a discount — you still have to work the hours.",
      "Check if merit scholarships are renewable — some require maintaining a minimum GPA each year.",
      "Ask about hidden costs: lab fees, technology fees, required meal plans, parking, and textbooks."
    ]
  },
  {
    subject: "Mental Health in High School: Taking Care of Yourself",
    tips: [
      "Stress is normal during college prep, but constant anxiety isn't — talk to a counselor if you're struggling.",
      "Exercise 30 minutes a day — it's one of the most effective natural anxiety reducers available.",
      "Limit social media comparison — Instagram highlight reels of acceptances aren't the full story.",
      "Celebrate small wins — finished an essay? Applied to a scholarship? That deserves recognition.",
      "Remember: your worth isn't determined by where you go to college — it's determined by what you do there."
    ]
  },
  {
    subject: "Transfer Students: What You Need to Know",
    tips: [
      "Transfer acceptance rates are often higher than freshman rates at many schools.",
      "Strong college grades matter most — your high school record becomes less important for transfers.",
      "Get involved at your current school — transfer essays ask what you've contributed to your campus.",
      "Research credit transfer policies BEFORE applying — losing credits extends your timeline and cost.",
      "Apply to transfer by the end of your first year — sophomore transfers have the highest acceptance rates."
    ]
  },
  {
    subject: "College Application Timeline: Month by Month",
    tips: [
      "Summer before senior year: finalize your college list, start essays, request recommendation letters.",
      "September–October: polish essays, submit Early Decision/Early Action applications.",
      "November–January: submit Regular Decision applications, complete FAFSA and CSS Profile.",
      "February–March: wait patiently, continue performing well in school, apply for scholarships.",
      "April–May: compare offers, visit accepted schools, submit your deposit by May 1."
    ]
  },
  {
    subject: "How to Research Colleges Effectively",
    tips: [
      "Go beyond the website — Reddit, College Confidential, and YouTube vlogs show the real student experience.",
      "Check the school's Common Data Set (CDS) — it reveals exactly what they prioritize in admissions.",
      "Look at post-graduation outcomes: job placement rates, grad school acceptance, and average starting salaries.",
      "Reach out to current students via LinkedIn — most are happy to share their experience.",
      "Attend virtual info sessions — many schools track demonstrated interest and these count."
    ]
  },
  {
    subject: "Study Abroad: Planning Ahead",
    tips: [
      "Research study abroad options BEFORE choosing a college — some schools have far better programs than others.",
      "Start saving early — study abroad typically costs the same as a semester on campus, but flights and travel add up.",
      "Learn some basics of the local language before you go — even 50 phrases make a huge difference.",
      "Choose a program that offers transferable credits — you don't want to fall behind on graduation requirements.",
      "Apply early for study abroad scholarships — organizations like Gilman and Boren fund thousands of students annually."
    ]
  },
  {
    subject: "How to Ask for Help in College",
    tips: [
      "Visit office hours in the first two weeks — professors notice and remember early visitors.",
      "Use your school's free tutoring center — it exists for exactly this purpose, and there's no shame in using it.",
      "Form study groups for difficult classes — explaining concepts to peers strengthens your own understanding.",
      "Talk to your academic advisor at least once per semester — they can spot issues before they become problems.",
      "If you're struggling emotionally, use the campus counseling center — it's confidential and usually free."
    ]
  },
  {
    subject: "STEM Majors: What to Expect",
    tips: [
      "The first two years are foundational — calculus, physics, and chemistry are gatekeepers, so get support early.",
      "Join a STEM study group — the dropout rate for solo studiers is significantly higher.",
      "Seek undergraduate research opportunities — these are the #1 differentiator for grad school applications.",
      "Internships matter more than GPA for job placement — start applying sophomore year.",
      "Don't be discouraged by a tough first exam — STEM curves are real, and persistence pays off."
    ]
  },
  {
    subject: "Liberal Arts: Why They Still Matter",
    tips: [
      "Liberal arts graduates develop critical thinking, writing, and communication skills that employers consistently rank as most desired.",
      "Many CEOs and leaders majored in philosophy, history, or English — the skills transfer broadly.",
      "Liberal arts colleges often have smaller class sizes and more professor interaction than large universities.",
      "Pair a liberal arts major with practical experience (internships, coding bootcamps) for maximum career flexibility.",
      "Graduate school in business, law, or medicine is accessible from almost any undergraduate major."
    ]
  },
  {
    subject: "Social Life vs Academics: Finding Balance",
    tips: [
      "The students who thrive in college aren't the ones who study 24/7 — they're the ones who manage their time well.",
      "Join 2–3 clubs or organizations — enough to have a social network, not so many that you're overwhelmed.",
      "Schedule fun activities just like you schedule study time — balance prevents burnout.",
      "Your closest college friends often come from shared activities, not random socializing — invest in communities.",
      "It's okay to say no to parties or social events when you need to study — real friends will understand."
    ]
  },
  {
    subject: "Pre-Med Track: Essential Tips",
    tips: [
      "Start volunteering in healthcare settings early — clinical experience is required for most med school applications.",
      "Get to know at least 2 science professors well enough that they can write detailed recommendation letters.",
      "Shadow physicians in different specialties — this helps you write a compelling 'Why medicine?' essay.",
      "Take the MCAT seriously — start studying 3–6 months before your test date with a structured plan.",
      "Maintain a GPA above 3.5 in science courses — this is the most scrutinized part of your med school application."
    ]
  },
  {
    subject: "Digital Tools Every Student Needs",
    tips: [
      "Use Notion or Google Docs to organize college research, essay drafts, and application deadlines in one place.",
      "Grammarly (free version) catches errors that spell-check misses — use it for every essay and email.",
      "Khan Academy is genuinely one of the best free resources for SAT prep and academic subjects.",
      "Google Calendar with color-coded events for school, activities, and applications keeps you on track.",
      "Use Quizlet or Anki for flashcard-based studying — spaced repetition is proven to boost long-term retention."
    ]
  },
  {
    subject: "First-Generation College Students: You Belong",
    tips: [
      "Many colleges actively seek first-gen students — highlight this in your applications, it's an asset.",
      "Seek out first-gen student organizations and mentorship programs — they exist at most schools.",
      "Don't be afraid to ask 'obvious' questions — the college process is confusing for everyone, and there's no shame in learning.",
      "Apply for first-gen specific scholarships — QuestBridge, Gates Scholarship, and Dell Scholars are great starting points.",
      "Your perspective and resilience are exactly what college campuses need — own your story."
    ]
  },
  {
    subject: "Preparing for College-Level Writing",
    tips: [
      "Read academic articles and opinion pieces regularly — exposure to strong writing improves your own.",
      "Learn to write a clear thesis statement — every college paper starts with one.",
      "Practice the 'PIE' paragraph structure: Point, Illustration, Explanation — it works for almost any assignment.",
      "Get comfortable with citation formats (MLA, APA, Chicago) — incorrect citations lose easy points.",
      "Visit the writing center for every major paper — even strong writers benefit from a second pair of eyes."
    ]
  },
  {
    subject: "Networking in College: Start Early",
    tips: [
      "Connect with professors during office hours — these relationships lead to research opportunities, recommendations, and mentorship.",
      "Attend career fairs starting freshman year — even if you're not job hunting, practice introducing yourself.",
      "LinkedIn is essential — create a profile and start connecting with professionals in your field of interest.",
      "Join professional organizations related to your major — many have student chapters with networking events.",
      "Alumni networks are powerful — most graduates are happy to help current students from their alma mater."
    ]
  },
  {
    subject: "Understanding Student Loans",
    tips: [
      "Federal loans (Direct Subsidized and Unsubsidized) should always be your first choice over private loans.",
      "Subsidized loans don't accrue interest while you're in school — unsubsidized loans do, which adds up.",
      "Know your total debt before graduating — the general rule is: don't borrow more than your expected first-year salary.",
      "Income-driven repayment plans can lower your monthly payments after graduation if your salary is modest.",
      "Public Service Loan Forgiveness (PSLF) forgives remaining federal loan balance after 10 years of qualifying payments in public service."
    ]
  },
  {
    subject: "How to Declare Your Major Wisely",
    tips: [
      "Most schools don't require a declaration until end of sophomore year — use your first 2 years to explore.",
      "Talk to career services BEFORE declaring — they can show you what careers each major typically leads to.",
      "Check prerequisite chains early — some majors (engineering, pre-med) have sequences that must start freshman year.",
      "A minor or second major can complement your primary major — computer science minor pairs well with almost any field.",
      "Changing majors is common (over 30% of students do it) — but do it early to avoid extending your graduation timeline."
    ]
  },
  {
    subject: "College Application Mistakes to Avoid",
    tips: [
      "Don't submit without proofreading — mention a school's rival by name in your 'Why Us?' essay and it's an instant reject.",
      "Avoid listing activities you can't discuss in detail — admissions officers will ask follow-up questions.",
      "Don't wait until the last day to submit — server crashes and technical issues are real on deadline nights.",
      "Never exaggerate or lie about accomplishments — admissions officers fact-check more than you'd expect.",
      "Don't send extra materials unless asked — unsolicited recommendation letters and portfolios often annoy rather than impress."
    ]
  },
  {
    subject: "Maximizing Your Summer: Options Beyond Internships",
    tips: [
      "Research programs at local universities — many professors welcome motivated high schoolers as lab assistants.",
      "Online courses from Coursera, edX, or MIT OpenCourseWare let you explore college-level subjects for free.",
      "Start a project: a blog, YouTube channel, app, business, or community initiative — initiative impresses admissions.",
      "Volunteer consistently with one organization rather than doing random one-day events — impact and commitment matter.",
      "Read widely — 5 books over the summer in diverse topics shows intellectual curiosity that essays can reference."
    ]
  }
];

// ── Email HTML template ─────────────────────────────────────
function getEmailHTML(tip, weekNum) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    body{margin:0;padding:0;background:#faf9f6;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1714;line-height:1.6}
    .container{max-width:580px;margin:0 auto;padding:32px 24px}
    .header{text-align:center;padding:24px 0;border-bottom:2px solid #f3f1ec}
    .logo{font-size:24px;font-weight:700;color:#c8622a;letter-spacing:-0.5px}
    .logo-dot{display:inline-block;width:8px;height:8px;background:#c8622a;border-radius:50%;margin-right:4px}
    .content{padding:32px 0}
    h1{font-size:22px;color:#1a1714;margin:0 0 8px;font-weight:700}
    .week-badge{display:inline-block;padding:3px 10px;background:#fdf0e8;color:#c8622a;border-radius:100px;font-size:11px;font-weight:700;margin-bottom:16px}
    .tip{padding:16px;background:#f3f1ec;border-radius:10px;margin:12px 0;font-size:14px}
    .tip-num{display:inline-block;width:24px;height:24px;background:#c8622a;color:white;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;margin-right:8px;flex-shrink:0}
    .tip-row{display:flex;align-items:flex-start;gap:0}
    .cta{display:inline-block;padding:12px 24px;background:#c8622a;color:white;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;margin:24px 0}
    .footer{text-align:center;padding:24px 0;border-top:1px solid #f3f1ec;font-size:12px;color:#8a847b}
    .footer a{color:#c8622a;text-decoration:underline}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo"><span class="logo-dot"></span>GradeScope</div>
      <div style="font-size:12px;color:#8a847b;margin-top:4px">Your weekly college prep tips</div>
    </div>
    <div class="content">
      <div class="week-badge">Week ${weekNum} of 52</div>
      <h1>${tip.subject}</h1>
      ${tip.tips.map((t, i) => `
      <div class="tip">
        <div class="tip-row">
          <span class="tip-num">${i + 1}</span>
          <span>${t}</span>
        </div>
      </div>`).join('')}
      <div style="text-align:center">
        <a href="https://gradescope.app" class="cta">Open GradeScope &rarr;</a>
      </div>
    </div>
    <div class="footer">
      <p>You're receiving this because you signed up for GradeScope weekly tips.</p>
      <p><a href="https://gradescope.app">GradeScope</a> &middot; Free college planning tools</p>
    </div>
  </div>
</body>
</html>`;
}

// ── Main ────────────────────────────────────────────────────
async function main() {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    console.error("Missing EMAIL_USER or EMAIL_PASS environment variables.");
    process.exit(1);
  }

  // Determine which tip to send (rotate through 52 weeks)
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekOfYear = Math.ceil((now - startOfYear) / 604800000);
  const tipIndex = (weekOfYear - 1) % WEEKLY_TIPS.length;
  const tip = WEEKLY_TIPS[tipIndex];

  console.log(`Week ${weekOfYear} — sending: "${tip.subject}"`);

  // Get all active subscribers from Firestore
  const subscribersSnap = await db
    .collection("email_subscribers")
    .where("active", "==", true)
    .get();

  if (subscribersSnap.empty) {
    console.log("No active subscribers — skipping.");
    return;
  }

  console.log(`Found ${subscribersSnap.size} active subscriber(s).`);

  // Set up Gmail SMTP transport
  const transporter = createTransport({
    service: "gmail",
    auth: { user: emailUser, pass: emailPass },
  });

  const emailHTML = getEmailHTML(tip, weekOfYear);

  // Send to each subscriber
  const results = { sent: 0, failed: 0 };
  for (const docSnap of subscribersSnap.docs) {
    const sub = docSnap.data();
    try {
      await transporter.sendMail({
        from: `"GradeScope" <${emailUser}>`,
        to: sub.email,
        subject: `\u{1F4DA} ${tip.subject} — GradeScope Weekly Tips`,
        html: emailHTML,
      });
      results.sent++;
      console.log(`  Sent to ${sub.email}`);
    } catch (err) {
      console.error(`  Failed to send to ${sub.email}: ${err.message}`);
      results.failed++;
    }
  }

  console.log(`Done. ${results.sent} sent, ${results.failed} failed.`);

  // Log the send to Firestore
  try {
    const { FieldValue } = await import("firebase-admin/firestore");
    await db.collection("email_logs").add({
      sentAt: FieldValue.serverTimestamp(),
      weekOfYear,
      tipSubject: tip.subject,
      subscriberCount: subscribersSnap.size,
      sent: results.sent,
      failed: results.failed,
    });
  } catch (e) {
    console.warn("Could not log to Firestore:", e.message);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
