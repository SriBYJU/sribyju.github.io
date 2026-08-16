/**
 * Scholark — Automated Weekly College Tips Email
 *
 * Runs via GitHub Actions every Monday at 13:15 UTC.
 * Combines Firebase Authentication users with Firestore preferences, then
 * sends branded email via Gmail SMTP.
 *
 * Required environment variables:
 *   FIREBASE_SERVICE_ACCOUNT — JSON string of Firebase service account key
 *   EMAIL_USER              — Gmail address to send from
 *   EMAIL_PASS              — Gmail App Password (not your regular password)
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, Timestamp, getFirestore } from "firebase-admin/firestore";
import { createTransport } from "nodemailer";
import { createHash, randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";

// ── Firebase setup ──────────────────────────────────────────
let db;
let auth;
function initializeFirebaseAdmin() {
  const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!rawServiceAccount) throw new Error("Missing FIREBASE_SERVICE_ACCOUNT environment variable.");
  let serviceAccount;
  try { serviceAccount = JSON.parse(rawServiceAccount); }
  catch { throw new Error("FIREBASE_SERVICE_ACCOUNT must contain valid JSON."); }
  initializeApp({ credential: cert(serviceAccount) });
  db = getFirestore();
  auth = getAuth();
}
const RUN_LOCK_TTL_MS = 2 * 60 * 60 * 1000;

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
      "A counselor recommendation is usually required in addition to teacher recs — don't forget this one."
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
      "Use our GPA Calculator and Weighted GPA tools to see where you stand with both scales."
    ]
  },
  {
    subject: "Navigating Test-Optional Admissions",
    tips: [
      "If your test scores are at or above the school's 50th percentile, submit them — they can only help.",
      "If scores are below the 25th percentile, going test-optional is usually the stronger strategy.",
      "Test-optional doesn't mean test-blind — some schools still consider scores if submitted.",
      "Strengthen other parts of your application if going test-optional: essays, activities, and grades matter even more.",
      "Check each school's specific policy — some are permanently test-optional, others are still temporary."
    ]
  },
  {
    subject: "Building Your College Résumé",
    tips: [
      "Start with your most impressive activities — admissions officers may only spend 30 seconds scanning.",
      "Quantify your impact: 'Raised $2,400 for local food bank' is stronger than 'participated in fundraising.'",
      "Include paid work — jobs show responsibility, time management, and real-world skills.",
      "Keep it to one page — concise and focused beats lengthy and padded.",
      "Use action verbs: Led, Founded, Organized, Designed, Mentored — not 'was a member of.'"
    ]
  },
  {
    subject: "Making the Most of Your First Semester",
    tips: [
      "Go to every class for the first two weeks — even if it's 'optional.' First impressions with professors matter.",
      "Join 2–3 clubs during the activities fair, but commit seriously to just 1 — quality over quantity continues in college.",
      "Visit the writing center, tutoring center, and career office in your first month — know what resources exist before you need them urgently.",
      "Sit in the front half of the classroom — studies consistently show better grades and engagement.",
      "Call home when you need to, but push yourself to build new friendships — homesickness peaks around week 3 and fades."
    ]
  },
  {
    subject: "Scholarship Essays: What Judges Want to See",
    tips: [
      "Answer the actual prompt — many applicants write generic essays that don't address the specific question asked.",
      "Show how the scholarship aligns with YOUR goals — judges want to invest in someone with a clear vision.",
      "Include specific details about your background and experiences — vague statements don't win awards.",
      "Proofread obsessively — typos signal carelessness and can disqualify an otherwise strong application.",
      "Apply for scholarships that match your unique profile — niche awards (by major, state, heritage) have less competition."
    ]
  },
  {
    subject: "AP Exam Strategy: Maximize Your Score",
    tips: [
      "Focus on the free-response section — it's where most students lose points and where improvement is fastest.",
      "Use released past exams to practice under timed conditions — the AP Central website has official materials.",
      "A score of 3 earns credit at most state universities — you don't always need a 5 to benefit.",
      "Register for exams by the early deadline to save $40 per test — and check for fee waivers if eligible.",
      "Taking the exam even if you're unsure is worth it — there's no penalty for a low score, and you might surprise yourself."
    ]
  },
  {
    subject: "Mental Health Tips for College-Bound Students",
    tips: [
      "College stress is normal — but persistent anxiety or sadness that affects daily life deserves professional support.",
      "Most colleges offer free counseling — find your school's counseling center contact info before you need it.",
      "Exercise 30 minutes a day — it's more effective than most people realize for managing stress and improving focus.",
      "Limit social media comparison — everyone's highlight reel makes your behind-the-scenes feel worse.",
      "Build a routine that includes sleep, meals, and downtime — structure is the foundation of mental health."
    ]
  },
  {
    subject: "Understanding College Rankings",
    tips: [
      "Rankings measure institutional metrics (endowment, selectivity) — not your personal fit or happiness.",
      "A school ranked #50 might be #1 for your specific major, career goals, or learning style.",
      "Rankings change every year — a school at #20 today was probably at #25 last year. The differences are marginal.",
      "Employer surveys consistently show that skills and experience matter more than school prestige for most careers.",
      "Use rankings as one data point, not the deciding factor — visit, talk to students, and trust your gut."
    ]
  },
  {
    subject: "Part-Time Jobs in College: Balancing Work and School",
    tips: [
      "On-campus jobs (library, dining hall, research assistant) are designed around student schedules — start there.",
      "Working 10–15 hours/week actually improves time management for most students; beyond 20 hours, grades often suffer.",
      "Work-study awards are listed in your financial aid package — they guarantee you a campus job, so claim yours early.",
      "Relevant work experience (internship in your field) is more valuable than any part-time job — seek these out by sophomore year.",
      "Track your earnings and budget monthly — a simple spreadsheet prevents the 'where did my money go?' panic."
    ]
  },
  {
    subject: "Transfer Applications: A Second Chance",
    tips: [
      "Transfer acceptance rates at top schools range from 5–25% — competitive but definitely achievable with strong grades.",
      "A 3.5+ GPA in challenging courses at your current school is the single most important factor for transfers.",
      "Write a compelling 'Why Transfer?' essay that focuses on what you'll GAIN, not complaints about your current school.",
      "Get involved at your current institution — transfer committees want to see engagement, not someone just waiting to leave.",
      "Apply to a mix of schools and keep your current options open — don't put all your eggs in one transfer basket."
    ]
  },
  {
    subject: "Dorm Life Survival Guide",
    tips: [
      "Have the roommate conversation early: sleep schedules, guest policies, noise preferences, and cleaning responsibilities.",
      "Bring less than you think you need — dorm rooms are tiny and you can always buy things locally.",
      "Invest in good headphones and an eye mask — they're essential for shared living spaces.",
      "Keep your door open during the first few weeks — it's the easiest way to meet neighbors and make friends.",
      "Learn the quiet hours policy and respect it — being the 'loud neighbor' burns bridges fast."
    ]
  },
  {
    subject: "Graduate School: To Go or Not to Go?",
    tips: [
      "For some careers (medicine, law, academia, counseling), grad school is required — research your field's norms early.",
      "For business and tech, work experience first is usually the better path — many companies also offer tuition benefits.",
      "Fully funded programs exist, especially in STEM and PhD tracks — never pay full price for a doctoral program.",
      "Take a gap of 1–3 years between undergrad and grad school to gain clarity and strengthen your application.",
      "Talk to people 5–10 years into the career you want — ask whether grad school was necessary for their path."
    ]
  },
  {
    subject: "Building Professional Relationships in College",
    tips: [
      "Attend your professor's office hours at least 3 times per semester — even without questions, building rapport leads to opportunities.",
      "LinkedIn isn't just for job seekers — start connecting with classmates, professors, and guest speakers now.",
      "Join professional organizations in your field — many have student chapters with free or discounted membership.",
      "Attend campus events with guest speakers and alumni — a 2-minute conversation can open unexpected doors.",
      "Follow up after meeting someone: a simple 'It was great meeting you at [event]' email goes a long way."
    ]
  },
  {
    subject: "Study Abroad: Planning and Benefits",
    tips: [
      "Start researching programs at least a year in advance — popular destinations and terms fill up fast.",
      "Financial aid and scholarships usually transfer to study abroad programs — check with your financial aid office.",
      "Choose a program that offers courses counting toward your major — this keeps you on track to graduate on time.",
      "Learning a language abroad accelerates fluency faster than years of classroom study — immersion works.",
      "Employers value study abroad experience — it demonstrates adaptability, independence, and global awareness."
    ]
  },
  {
    subject: "How to Read a Financial Aid Award Letter",
    tips: [
      "Separate 'free money' (grants, scholarships) from 'borrowed money' (loans) — the total package number is misleading.",
      "Calculate the actual out-of-pocket cost: Total Cost of Attendance minus grants/scholarships = what you really pay.",
      "Federal Direct Loans have fixed interest rates and income-based repayment options — they're almost always better than private loans.",
      "Work-study is an opportunity to earn, not free money — you still need to work the hours to receive it.",
      "Compare award letters from multiple schools side by side — use a simple spreadsheet to see the real cost differences."
    ]
  },
  {
    subject: "Internship Hunting: Start Early, Land Smart",
    tips: [
      "Start looking for summer internships in September/October — top companies recruit 6–8 months ahead.",
      "Your campus career center is an underused goldmine — they have employer connections, résumé reviews, and mock interviews.",
      "Cold emailing professionals in your field for informational interviews has a surprisingly high success rate — be specific and brief.",
      "Unpaid internships are worth it ONLY if they offer genuine learning and mentorship — don't accept glorified filing work.",
      "After each internship, ask for a LinkedIn recommendation while the experience is fresh — these compound over time."
    ]
  },
  {
    subject: "End-of-Year GPA Recovery Strategies",
    tips: [
      "Calculate exactly what grade you need on the final to hit your target — use our Grade Needed calculator.",
      "Talk to your professor if you're struggling — many offer extra credit, grade replacement, or incomplete options.",
      "Focus your remaining study time on the courses where improvement will have the biggest impact on your GPA.",
      "Form a finals study group and teach each other — explaining concepts is the fastest path to mastery.",
      "Take care of your body during finals: sleep, eat real food, exercise — burned-out brains don't perform well."
    ]
  },
  {
    subject: "Community College to 4-Year Transfer Success",
    tips: [
      "Research transfer agreements (articulation agreements) between your CC and target 4-year schools — these guarantee credit transfer.",
      "Aim for a 3.5+ GPA at community college — this makes you competitive even at selective universities.",
      "Get involved in campus activities and leadership at CC — transfer applications evaluate engagement, not just grades.",
      "Meet with a transfer advisor in your first semester — they'll help you choose courses that transfer smoothly.",
      "The TAG (Transfer Admission Guarantee) program in California guarantees admission to certain UCs — check if your state has something similar."
    ]
  },
  {
    subject: "Dealing with Imposter Syndrome in College",
    tips: [
      "Almost everyone at a competitive school feels like they don't belong at first — you were admitted for real reasons.",
      "Compare yourself to your past self, not to others — growth is personal and non-linear.",
      "Share how you feel with a trusted friend or counselor — you'll be surprised how many people relate.",
      "Document your achievements in a 'wins' journal — review it when self-doubt creeps in.",
      "Remember that asking for help is a sign of strength, not weakness — every successful person had mentors and support."
    ]
  },
  {
    subject: "Choosing Between Early Decision and Regular Decision",
    tips: [
      "ED acceptance rates are often 2–3x higher than RD — it's a real advantage if you have a clear top choice.",
      "ED is binding — only apply ED if you're 100% sure about the school AND can afford it without comparing financial aid offers.",
      "EA (Early Action) is non-binding and gives you an early answer — it's usually the best of both worlds.",
      "Don't apply ED to a school you haven't researched thoroughly — the commitment is serious.",
      "If you're wait-listed ED, you can (and should) apply RD to other schools immediately."
    ]
  },
  {
    subject: "Technology Tools Every Student Needs",
    tips: [
      "Use Notion or Google Docs for note-taking and project management — searchability beats paper every time.",
      "Grammarly (free version) catches writing errors your spell-checker misses — install the browser extension.",
      "Scholark's GPA Calculator helps you plan your semester grades strategically — bookmark it and use it weekly.",
      "Flashcard apps like Anki use spaced repetition — scientifically proven to be the most efficient memorization method.",
      "Set up automatic cloud backups for all schoolwork — losing a term paper to a laptop crash is preventable pain."
    ]
  },
  {
    subject: "What Admissions Officers Actually Look For",
    tips: [
      "Intellectual curiosity — they want to see that you pursue interests beyond what's required for a grade.",
      "Authenticity — admissions officers read thousands of essays and can spot manufactured stories instantly.",
      "Community impact — how have you made your school, neighborhood, or online community better?",
      "Resilience — how you've handled setbacks matters as much as your successes.",
      "Fit — they're asking 'will this student thrive here AND contribute to our community?' Show them you will."
    ]
  },
  {
    subject: "College Application Timeline: Junior Year Checklist",
    tips: [
      "January–March: Research colleges, attend virtual info sessions, take the PSAT/SAT/ACT.",
      "April–May: Visit campuses during spring break, finalize your college list, prepare for AP exams.",
      "June–August: Draft your personal statement, build your activities list, ask for recommendation letters.",
      "September–October: Finalize essays, submit early applications, complete FAFSA and CSS Profile.",
      "November–December: Submit remaining applications, apply for scholarships, take final standardized tests if needed."
    ]
  },
  {
    subject: "Making Your Decision: How to Choose Your College",
    tips: [
      "Create a weighted pros/cons list for your top 3 schools — assign points to factors that matter most to YOU.",
      "Attend admitted students events (in-person or virtual) — these give you the most honest look at student life.",
      "Talk to current students about what they wish they'd known before enrolling — Instagram DMs and Reddit are great for this.",
      "Don't let prestige override fit — the 'best' school for you is the one where you'll thrive academically, socially, and financially.",
      "Trust your gut after doing your research — if a school feels right, there's usually a reason."
    ]
  },
  {
    subject: "Preparing for College Math and Science Courses",
    tips: [
      "Review prerequisite material before the semester starts — Khan Academy is perfect for refreshing algebra, calc, or chem basics.",
      "Attend supplemental instruction (SI) sessions from day one — don't wait until you're behind.",
      "Work through problems without looking at the solutions first — the struggle is where real learning happens.",
      "Form a study group that meets at the same time each week — consistency builds understanding over time.",
      "If you're struggling, switch to a different textbook or YouTube channel — sometimes a new explanation style clicks."
    ]
  },
  {
    subject: "Social Media and College Admissions",
    tips: [
      "Google yourself and clean up anything unprofessional — some admissions officers do check applicants' social media.",
      "Use social media positively: share projects, volunteer work, or thoughtful perspectives — this can actually help.",
      "Follow your target colleges' accounts — they share important deadlines, virtual events, and student stories.",
      "Don't post about acceptance/rejection decisions in ways that could hurt others' feelings.",
      "LinkedIn is appropriate for high schoolers — create a basic profile highlighting your activities and achievements."
    ]
  },
  {
    subject: "The Truth About College Prestige vs. Career Success",
    tips: [
      "Studies show that motivation and effort predict career success far better than college selectivity.",
      "For most careers, your skills, network, and experience matter more than your diploma's logo.",
      "State universities produce more Fortune 500 CEOs than Ivy League schools combined.",
      "Graduate school (if needed) offers another chance to attend a 'name brand' institution — undergrad isn't your only shot.",
      "The students who thrive most are those who fully engage wherever they are — not those who attend the 'best' school on paper."
    ]
  },
  {
    subject: "Year-End Reflection: Celebrate Your Progress",
    tips: [
      "Look back at where you started this year — you've grown more than you realize.",
      "Write down 3 accomplishments you're proud of — big or small, they all count.",
      "Identify one area where you want to grow next year — having a clear focus accelerates improvement.",
      "Thank the people who helped you this year — teachers, parents, friends, mentors. Gratitude strengthens relationships.",
      "Set one academic goal, one personal goal, and one 'just for fun' goal for the coming year. You've got this!"
    ]
  },
  {
    subject: "Hidden Costs of College (And How to Avoid Them)",
    tips: [
      "Textbooks can cost $500–$1,200/year — rent, buy used, or check if the library has copies before buying new.",
      "Meal plan overspending is real — choose the smallest plan that fits your schedule and cook when possible.",
      "Activity fees, lab fees, and technology fees add up — factor these into your budget beyond tuition and room/board.",
      "Transportation costs (flights home, parking, rideshares) are often overlooked — plan ahead for breaks.",
      "Build an emergency fund of at least $500 before starting college — unexpected costs always pop up."
    ]
  },
  {
    subject: "Effective Note-Taking Methods Compared",
    tips: [
      "Cornell Method: Divide pages into notes, cues, and summary sections — great for review and active recall.",
      "Mind Mapping: Visual learners thrive with this — use colors and connections to organize information.",
      "Outline Method: Best for structured lectures — indent subtopics under main headings for clear hierarchy.",
      "Digital vs. handwritten: research shows handwriting improves retention, but searchability favors digital — try both.",
      "Review and reorganize notes within 24 hours — this single habit separates A students from C students."
    ]
  },
  {
    subject: "How to Network as a College Student (Without Being Awkward)",
    tips: [
      "Networking isn't 'using people' — it's building genuine relationships based on shared interests and mutual help.",
      "Start with alumni from your school — they're usually eager to help current students from their alma mater.",
      "Prepare a 30-second 'elevator pitch' about yourself — who you are, what you study, and what interests you.",
      "Follow up within 48 hours after meeting someone new — reference a specific thing you discussed.",
      "Offer value before asking for favors — share an article, make an introduction, or volunteer your time."
    ]
  },
  {
    subject: "Burnout Prevention: Staying Energized All Semester",
    tips: [
      "Schedule 'rest days' just like you schedule study sessions — recovery isn't laziness, it's strategy.",
      "Break long-term projects into weekly milestones — the 'wall of work' feeling causes more burnout than actual workload.",
      "Find one hobby completely unrelated to school — music, cooking, hiking, gaming. Your brain needs variety.",
      "Learn to recognize early burnout signs: irritability, loss of motivation, poor sleep, skipping meals.",
      "Talk to an advisor if you're overwhelmed — they can help with course load adjustments, deadline extensions, or support services."
    ]
  },
  {
    subject: "Declaring Your Major: When and How",
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
  },
  // ── YEAR 2 (Weeks 53–104) ─────────────────────────────────
  {
    subject: "How to Bounce Back From a Bad Semester",
    tips: [
      "Meet with each professor in the first week — explain what happened and ask for strategies specific to their course.",
      "Identify what went wrong: was it time management, understanding, motivation, or personal issues? The fix depends on the cause.",
      "Use your school's academic coaching or tutoring center — they exist specifically for this situation.",
      "Set micro-goals: instead of 'get all A's,' aim for 'complete every assignment on time this week.'",
      "One bad semester won't define your college career — admissions officers and employers look at the overall trajectory."
    ]
  },
  {
    subject: "How to Pick the Right College Size",
    tips: [
      "Small schools (under 3,000) offer closer faculty relationships and smaller classes — great if you want mentorship.",
      "Large universities (20,000+) offer more majors, clubs, and research opportunities — great if you want options.",
      "Mid-size schools (5,000–15,000) often blend the best of both — personal attention with diverse offerings.",
      "Visit during a regular school day and sit in on a class — the energy of a 30-person seminar vs. a 300-person lecture is vastly different.",
      "Consider how you learn best: do you thrive with individual attention or in self-directed environments?"
    ]
  },
  {
    subject: "Building Strong Relationships With Professors",
    tips: [
      "Introduce yourself after the first class — most students never do this, so you'll stand out immediately.",
      "Go to office hours with a specific question, not just 'I don't get it' — shows you've tried.",
      "If you disagree with a grade, ask for feedback first, not a grade change — approach it as a learning opportunity.",
      "Professors can become mentors, research advisors, and recommendation letter writers — invest in these relationships early.",
      "Email etiquette matters: use their proper title, write a clear subject line, and keep it concise."
    ]
  },
  {
    subject: "How to Choose Between Two Colleges You Love",
    tips: [
      "Make a pros/cons list, but weight the factors — location might matter 3x more to you than campus food.",
      "Visit both schools overnight if possible — the evening and morning routines reveal a lot about daily life.",
      "Compare net cost after financial aid, not sticker price — a $20K difference over 4 years is $80K.",
      "Talk to current students in your intended major at each school — ask about internship access and career outcomes.",
      "Trust your gut after doing the research — if all factors are equal, go where you felt most at home."
    ]
  },
  {
    subject: "Productivity Apps Every Student Needs",
    tips: [
      "Notion or Google Docs for notes and project management — find one system and stick with it all year.",
      "Forest or Focus Timer for staying off your phone during study sessions — gamified focus works.",
      "Quizlet for flashcards — spaced repetition is one of the most research-backed study methods.",
      "Google Calendar with color-coded blocks — schedule study time, social time, and deadlines in one view.",
      "Scholark for GPA tracking, SAT prep, and college planning — everything in one place."
    ]
  },
  {
    subject: "How to Write a 'Why This College' Essay",
    tips: [
      "Name specific professors, programs, or courses that excite you — 'your biology program' is too generic.",
      "Connect the school's offerings to YOUR specific goals — show why this school is uniquely right for you.",
      "Mention something you learned from a campus visit, webinar, or conversation with a current student.",
      "Avoid mentioning things available at every school: 'diverse student body' and 'beautiful campus' say nothing.",
      "Keep it under 300 words unless told otherwise — concise and specific beats long and generic."
    ]
  },
  {
    subject: "Understanding Early Decision vs Early Action",
    tips: [
      "Early Decision (ED) is binding — if accepted, you must attend. Only use ED for your absolute top choice.",
      "Early Action (EA) is non-binding — you get an early answer but can still compare offers in spring.",
      "ED acceptance rates are typically 10–15% higher than regular decision — it's a real strategic advantage.",
      "Never apply ED if you need to compare financial aid packages — you lose negotiating leverage.",
      "Some schools offer ED II (January deadline) — a second chance at a binding early boost."
    ]
  },
  {
    subject: "Mental Health and Academic Performance",
    tips: [
      "Anxiety and depression directly impact grades — seeking help isn't weakness, it's a strategic academic decision.",
      "Most colleges offer free counseling — find out how to access it BEFORE you need it urgently.",
      "Exercise 3–4 times per week improves focus, memory, and mood — it's as effective as medication for mild anxiety.",
      "Build a routine that includes sleep, meals, and downtime — structure prevents the spiral of overwhelm.",
      "Tell one trusted person (friend, advisor, or family) how you're really doing — isolation makes everything worse."
    ]
  },
  {
    subject: "How to Get the Most Out of College Fairs",
    tips: [
      "Research 5–10 schools beforehand and prepare specific questions — don't just collect brochures.",
      "Ask questions you can't find on the website: 'What surprised you most about students here?'",
      "Get the admissions rep's business card and send a follow-up email within 48 hours.",
      "Demonstrated interest matters at many schools — your attendance may be tracked in their system.",
      "Wear something slightly more put-together than casual — first impressions count even at college fairs."
    ]
  },
  {
    subject: "College vs Trade School: Making the Right Choice",
    tips: [
      "Trade careers (electrician, plumber, welder) often start at $50K+ with zero student debt — don't dismiss them.",
      "A 4-year degree isn't the only path — 2-year community college plus transfer saves tens of thousands.",
      "Consider your learning style: hands-on learners often thrive in trade programs more than lecture halls.",
      "Many trades have higher job security and demand than common bachelor's degree fields.",
      "You can always go back to college later — but starting a skilled trade at 20 gives you a financial head start."
    ]
  },
  {
    subject: "How to Handle Senioritis",
    tips: [
      "Colleges can and do rescind acceptances for significant grade drops — a D or F in senior year is a real risk.",
      "Set one small academic goal per week — maintaining momentum is easier than rebuilding it.",
      "Channel your energy into something productive: a senior project, part-time job, or learning a new skill.",
      "Remember that senior year grades appear on your college transcript — they follow you.",
      "Celebrate milestones along the way — you've worked hard, and acknowledging progress keeps motivation alive."
    ]
  },
  {
    subject: "How to Afford College: A Complete Overview",
    tips: [
      "The four funding sources: grants/scholarships (free money), work-study (campus jobs), federal loans (low interest), and family savings.",
      "Apply to schools where you'd be in the top 25% — they often offer merit scholarships to attract strong students.",
      "Community college for 2 years + transfer can cut total costs by 50% or more with the same degree at the end.",
      "Negotiate with financial aid offices — many schools have discretionary funds for students who ask.",
      "Avoid private loans if possible — federal loans have income-based repayment and forgiveness options."
    ]
  },
  {
    subject: "How to Prepare for AP Exams",
    tips: [
      "Start reviewing 6–8 weeks before the exam — cramming doesn't work for AP content depth.",
      "Use AP Classroom and College Board's free resources — past free-response questions are the best practice.",
      "Focus on the free-response section — it's where most students lose points and where prep has the highest ROI.",
      "Form a study group for your hardest AP class — explaining concepts to others solidifies your understanding.",
      "A 3 or higher earns credit at most colleges — even a 3 saves you time and tuition for that course."
    ]
  },
  {
    subject: "Networking as a Student: Start Now",
    tips: [
      "LinkedIn isn't just for adults — create a profile highlighting your activities, projects, and goals.",
      "Connect with alumni from your high school who attend your target colleges — ask for informational chats.",
      "Attend local professional events or workshops — adults are often impressed and helpful when students show up.",
      "Follow up every meaningful conversation with a thank-you message — this habit will serve you for decades.",
      "Your network starts with who you know now: teachers, coaches, parents' friends, community leaders."
    ]
  },
  {
    subject: "How to Write Under Pressure: Timed Essays",
    tips: [
      "Spend the first 5 minutes outlining — a structured essay with average sentences beats a rambling brilliant one.",
      "Practice with a timer weekly — the SAT essay, AP exams, and college finals all require timed writing.",
      "Learn 3–4 flexible examples (historical events, books, personal experiences) that can fit multiple prompts.",
      "Write your thesis statement first, then build paragraphs around it — don't discover your argument while writing.",
      "Save 2 minutes at the end to re-read — catching one major error is worth more than one extra sentence."
    ]
  },
  {
    subject: "What Colleges Look For Beyond Grades",
    tips: [
      "Intellectual curiosity — do you pursue learning outside of class requirements?",
      "Leadership doesn't mean president of everything — it means taking initiative and making an impact.",
      "Community contribution — how have you made things better for people around you?",
      "Resilience — how did you handle a setback? Your response matters more than the setback itself.",
      "Authenticity — admissions officers read thousands of essays and can spot performative passion instantly."
    ]
  },
  {
    subject: "How to Research Colleges Effectively",
    tips: [
      "Start with College Scorecard (data.ed.gov) for graduation rates, average earnings, and actual costs.",
      "Read student reviews on Niche.com and Unigo — they're more honest than official marketing materials.",
      "Follow student-run social media accounts — campus Instagram and TikTok show real daily life.",
      "Use Scholark's College Comparison tool to compare schools side-by-side with radar charts.",
      "Make a spreadsheet tracking: cost, location, size, programs, acceptance rate, and 'vibe' for each school."
    ]
  },
  {
    subject: "The Art of the Follow-Up Email",
    tips: [
      "After a college interview, campus visit, or info session — send a thank-you email within 24 hours.",
      "Reference something specific from your conversation — 'I loved hearing about the undergraduate research program.'",
      "Keep it 3–5 sentences max — short, specific, and genuine beats long and generic.",
      "Use a professional email address — firstname.lastname@ is ideal, not gamertag2009@.",
      "Demonstrated interest (emails, visits, engagement) can tip the scales at schools that track it."
    ]
  },
  {
    subject: "SAT vs ACT: Which Test Is Right for You?",
    tips: [
      "Take a practice test for each — many students score significantly better on one than the other.",
      "The SAT emphasizes reasoning and evidence-based analysis — the ACT is more straightforward and fast-paced.",
      "The ACT has a science section (data interpretation, not bio/chem knowledge) — if you're strong at reading graphs, consider ACT.",
      "All colleges accept both equally — there is zero advantage to submitting one over the other.",
      "Use Scholark's SAT and ACT prep modes to practice both and see which format clicks for you."
    ]
  },
  {
    subject: "How to Stay Organized During Application Season",
    tips: [
      "Create one master spreadsheet with every school, deadline, required materials, and status (not started/in progress/done).",
      "Set calendar reminders 2 weeks, 1 week, and 1 day before each deadline.",
      "Save all essays in one folder with clear naming: 'SchoolName_EssayPrompt_v1.docx'.",
      "Track recommendation letter requests: who you asked, when, and whether they've submitted.",
      "Use Scholark's College Application Tracker to manage everything in one place."
    ]
  },
  {
    subject: "Understanding College Rankings (And When to Ignore Them)",
    tips: [
      "Rankings measure institutional reputation, not your personal experience — a #50 school might be perfect for YOUR goals.",
      "US News rankings weight factors that may not matter to you: alumni donations, faculty salaries, peer assessment.",
      "Department rankings matter more than overall rankings — a school ranked #80 overall might have a top-10 engineering program.",
      "Student satisfaction surveys (like Niche) often tell a different story than US News rankings.",
      "The best school for you is the one where you'll thrive academically, socially, and financially."
    ]
  },
  {
    subject: "How to Make a Great First Impression at College",
    tips: [
      "Keep your dorm door open during the first week — it's the easiest way to meet people on your floor.",
      "Say yes to social events for the first month, even if you're tired — early friendships form fast.",
      "Remember and use people's names — it's the simplest way to make someone feel valued.",
      "Don't bring every high school friend group dynamic with you — be open to completely new relationships.",
      "Find one campus spot that feels like 'yours' — a library corner, coffee shop, or bench — it becomes your anchor."
    ]
  },
  {
    subject: "How to Read a Financial Aid Award Letter",
    tips: [
      "Separate free money (grants and scholarships) from money you must repay (loans) — the total 'aid' is misleading.",
      "Calculate your Expected Family Contribution (EFC) and compare it to the net cost — that's your real price.",
      "Watch for gaps: if the cost is $50K and aid is $35K, you owe $15K per year — that's $60K over 4 years.",
      "Parent PLUS loans are included as 'aid' but are debt your parents take on — factor this in honestly.",
      "If the package is disappointing, appeal with competing offers — schools often have room to negotiate."
    ]
  },
  {
    subject: "How to Make the Dean's List",
    tips: [
      "Most schools require a 3.5+ GPA — find out your school's specific cutoff and keep it visible.",
      "Front-load your studying: do the reading BEFORE lecture, not after — comprehension doubles.",
      "Build relationships with TAs — they often grade your work and can clarify expectations better than professors.",
      "Take one 'joy' course per semester — a class you love keeps your motivation high across all courses.",
      "Review your grades at midterms and adjust study strategies for the second half — don't wait until finals."
    ]
  },
  {
    subject: "How to Write a Standout Activities List",
    tips: [
      "You have 150 characters per activity on the Common App — every word must count. Draft, then cut.",
      "Lead with your role and impact: 'Founded coding club; grew to 45 members; taught 3 weekly workshops.'",
      "List activities in order of importance to YOU, not prestige — authenticity shows through the ordering.",
      "Include work experience, family responsibilities, and self-taught skills — not just school clubs.",
      "Use active verbs and specific numbers — 'Led 12-person team' beats 'Was team leader.'"
    ]
  },
  {
    subject: "How to Manage Test Anxiety",
    tips: [
      "Practice under test conditions repeatedly — familiarity with the format reduces anxiety significantly.",
      "Use box breathing before the exam: inhale 4 seconds, hold 4, exhale 4, hold 4 — repeat 5 times.",
      "Arrive 10 minutes early, not 30 — too early means more time to spiral; too late means rushing.",
      "Start with the easiest questions to build confidence before tackling harder ones.",
      "Remind yourself: one test doesn't define your future — perspective reduces the pressure that kills performance."
    ]
  },
  {
    subject: "How to Build a Personal Brand for College Apps",
    tips: [
      "Identify your 'spike' — the one area where you go deepest. Colleges prefer depth over well-roundedness.",
      "Make sure your activities, essays, and recommendations all reinforce the same narrative about who you are.",
      "A personal website or portfolio showcasing your best work can set you apart — and it's free to make.",
      "Be consistent across platforms — your LinkedIn, personal site, and social media should tell the same story.",
      "Your brand isn't about being impressive — it's about being genuinely, specifically YOU."
    ]
  },
  {
    subject: "What to Do the Summer Before Senior Year",
    tips: [
      "Finalize your college list — you should have your reaches, matches, and safeties locked in by August.",
      "Draft your Common App personal essay — it's much harder to write during the school year.",
      "Request recommendation letters before school starts — teachers are more available and less overwhelmed.",
      "Visit any remaining campuses on your list — summer visits are calmer and parking is easier.",
      "Take the SAT/ACT one more time if your scores aren't where you want them — fall dates fill up fast."
    ]
  },
  {
    subject: "How to Stand Out in a Competitive Major",
    tips: [
      "For STEM majors: independent research, science fairs, or coding projects show genuine passion beyond coursework.",
      "For humanities: published writing, debate accomplishments, or a strong blog/portfolio demonstrate commitment.",
      "For business: real entrepreneurial experience (even small) matters more than business-themed clubs.",
      "For arts: a curated portfolio or performance reel is worth more than any grade or test score.",
      "Show progression: starting something sophomore year and growing it through senior year tells a compelling story."
    ]
  },
  {
    subject: "How to Use Social Media Wisely During Admissions",
    tips: [
      "Google yourself — admissions officers sometimes do. Remove anything you wouldn't want them to see.",
      "Use social media positively: share your projects, volunteer work, or creative output.",
      "Follow target schools and engage genuinely — this can count as demonstrated interest.",
      "Don't post about your admissions decisions until you've committed — it can cause unnecessary drama.",
      "LinkedIn is increasingly checked by scholarship committees — keep yours updated and professional."
    ]
  },
  {
    subject: "Transfer Students: How to Successfully Switch Schools",
    tips: [
      "Transfer acceptance rates are often higher than freshman rates — especially at state schools.",
      "Maintain a strong GPA at your current school — most transfers require 3.0+ and competitive schools want 3.5+.",
      "Get involved at your current school — 'I wasn't engaged anywhere' is not a compelling reason to transfer.",
      "Your transfer essay must answer 'Why can't you get what you need at your current school?' convincingly.",
      "Check credit transfer policies BEFORE applying — losing credits means extra semesters and cost."
    ]
  },
  {
    subject: "How to Prepare for College-Level Writing",
    tips: [
      "College papers require a thesis and evidence — opinion without support earns a C at best.",
      "Learn to cite sources properly (MLA, APA, Chicago) — plagiarism, even accidental, has severe consequences.",
      "Read academic writing in your intended field — notice the structure, tone, and argument style.",
      "Write regularly over the summer — keeping a journal or blog maintains your writing muscles.",
      "The campus writing center is your best friend — even A students use it to go from good to great."
    ]
  },
  {
    subject: "Financial Literacy for College Students",
    tips: [
      "Open a checking account with no monthly fees — many banks offer student accounts with no minimums.",
      "Track every dollar for one month — most students are shocked at how much goes to food delivery and subscriptions.",
      "Build credit early with a student credit card — pay it off IN FULL every month, no exceptions.",
      "Understand your student loans: know the interest rate, repayment start date, and monthly payment before you borrow.",
      "Cook even 3 meals a week instead of eating out — this alone can save $2,000+ per year."
    ]
  },
  {
    subject: "How to Choose the Right Extracurriculars for You",
    tips: [
      "Ask yourself: would I do this even if it didn't go on my application? If yes, it's the right activity.",
      "Leadership roles matter, but so does consistent commitment — 4 years of dedication without a title is still impressive.",
      "Create something if nothing exists for your interest — starting a club shows more initiative than joining one.",
      "Balance is important: mix academic, service, and personal interest activities for a well-rounded profile.",
      "Quality always beats quantity — 2–3 deep commitments outweigh a list of 10 superficial ones."
    ]
  },
  {
    subject: "How to Make the Most of Community College",
    tips: [
      "Take honors courses and join Phi Theta Kappa (the CC honor society) — transfer schools notice these.",
      "Build relationships with professors — their recommendations carry weight in transfer applications.",
      "Research transfer agreements: many CCs have guaranteed admission pathways to state universities.",
      "Get involved on campus — clubs, student government, and tutoring show engagement beyond academics.",
      "Complete your general education requirements strategically — knock out the hardest ones with the best professors."
    ]
  },
  {
    subject: "Year-End Reflection: Celebrate Your Progress",
    tips: [
      "Look back at where you were a year ago — you've grown more than you realize.",
      "Review your GPA trend on Scholark — even small improvements compound over semesters.",
      "Write down 3 accomplishments you're proud of — you'll reference these in future essays and interviews.",
      "Identify one area to improve next year and make a concrete plan — not a vague resolution.",
      "Thank the teachers, mentors, and friends who helped you this year — gratitude strengthens relationships and your own well-being."
    ]
  },
  {
    subject: "How to Get Internships as a High Schooler",
    tips: [
      "Email local businesses and nonprofits directly — many don't post internships but will create one for a motivated student.",
      "Your school counselor often has connections — ask specifically for internship leads, not just college advice.",
      "Virtual internships have exploded — platforms like Forage offer free virtual work experiences with real companies.",
      "Frame your pitch around what you can GIVE, not just what you'll learn — even basic tech skills are valuable.",
      "Document everything: tasks completed, skills learned, and results achieved — this becomes your résumé content."
    ]
  },
  {
    subject: "Understanding Different Types of Scholarships",
    tips: [
      "Merit scholarships reward grades and test scores — these are the most common and easiest to find.",
      "Need-based scholarships require FAFSA/CSS Profile — file even if you think you won't qualify.",
      "Identity-based scholarships exist for almost every background — first-generation, LGBTQ+, specific ethnicities, left-handed, you name it.",
      "Local scholarships (from community organizations, Rotary clubs, employers) have fewer applicants and better odds.",
      "Essay-based scholarships are often the highest value — your writing skills can literally pay for college."
    ]
  },
  {
    subject: "How to Study for Finals Week",
    tips: [
      "Start 2 weeks early with a study schedule — map out which subjects get which days based on exam dates.",
      "Use practice exams as your primary study tool — they're the closest thing to the real test.",
      "Study your hardest subject when you're most alert (usually morning) — save easier reviews for evening.",
      "Take real breaks: 10-minute walks beat 10 minutes of scrolling — your brain needs actual rest.",
      "Sleep 7+ hours the night before each exam — research consistently shows sleep beats extra cramming."
    ]
  },
  {
    subject: "How to Write a Scholarship Thank-You Letter",
    tips: [
      "Send it within 2 weeks of receiving the award — promptness shows professionalism and gratitude.",
      "Be specific about how the scholarship will help you — 'This allows me to focus on pre-med studies instead of working a third job.'",
      "Share your goals and how the scholarship connects to them — donors want to know their money makes a difference.",
      "Keep it to one page, handwritten if possible — personal touches stand out in a digital world.",
      "Many scholarships are renewable — a strong thank-you letter keeps you top of mind for future funding."
    ]
  },
  {
    subject: "How to Handle Peer Pressure Around College Choices",
    tips: [
      "Your college journey is personal — comparing yourself to classmates going to 'better' schools is a trap.",
      "A less-famous school with strong programs, scholarships, and fit can lead to a better outcome than a prestigious mismatch.",
      "Parents may have strong opinions — listen respectfully, but ultimately advocate for what's right for YOU.",
      "Social media makes everyone's acceptance look perfect — remember you're seeing highlights, not the full picture.",
      "Where you go matters less than what you do there — countless successful people attended schools you've never heard of."
    ]
  },
  {
    subject: "How to Build Good Study Habits Now",
    tips: [
      "Start with just 25 minutes of focused study per session — habit-building works better with small, consistent blocks.",
      "Study at the same time and place each day — your brain will start 'switching on' automatically.",
      "Put your phone in another room — even having it face-down on your desk reduces cognitive performance by 10%.",
      "Review notes within 24 hours of class — this single habit can boost retention by up to 60%.",
      "Track your study hours for one week — most students overestimate how much they actually study by 2-3x."
    ]
  },
  {
    subject: "How to Choose Between STEM and Humanities",
    tips: [
      "You don't have to choose permanently — many successful careers blend both (UX design, science writing, bioethics).",
      "Take at least one course in the 'other' field before deciding — you might discover an unexpected passion.",
      "STEM pays higher starting salaries on average, but humanities majors catch up significantly by mid-career.",
      "Consider your daily work preference: do you want to solve technical problems or understand human behavior?",
      "The best students in any field are those who can think critically AND communicate clearly — build both skills."
    ]
  },
  {
    subject: "How to Prepare for College Move-In Day",
    tips: [
      "Pack less than you think — dorm rooms are tiny, and you can always buy things locally or order online.",
      "Bring power strips, a good mattress topper, and a fan — the three things every freshman wishes they'd packed.",
      "Coordinate with your roommate on shared items — you don't need two mini-fridges or two printers.",
      "Say goodbye to your family before you start unpacking — the transition is easier when you rip the bandaid off.",
      "Introduce yourself to everyone on your floor on day one — these first connections often become your closest friends."
    ]
  },
  {
    subject: "How to Make the Most of Career Services",
    tips: [
      "Visit career services in your FIRST year, not just senior year — they can help shape your entire college plan.",
      "Get your résumé reviewed at least once per year — even small improvements matter for internship applications.",
      "Attend career fairs even as a freshman — the practice of networking in a low-stakes setting is invaluable.",
      "Mock interviews are free and incredibly useful — you'll discover blind spots you never knew you had.",
      "Career services often has alumni connections — ask them to introduce you to graduates in your field of interest."
    ]
  },
  {
    subject: "How to Deal With Imposter Syndrome",
    tips: [
      "Almost every student at a competitive school feels like they don't belong — you're not alone.",
      "Keep a 'wins' document — write down every accomplishment, positive feedback, and good grade. Read it when doubt creeps in.",
      "Talk to upperclassmen — they'll tell you they felt the exact same way freshman year.",
      "Compare yourself to your past self, not to others — your growth is the only metric that matters.",
      "Remember: you were admitted for a reason. The admissions committee saw something in you — trust their judgment."
    ]
  },
  {
    subject: "How to Balance Academics and Social Life",
    tips: [
      "Schedule social time like you schedule study time — if it's on the calendar, you won't feel guilty about it.",
      "Study with friends occasionally — it combines socializing and academics, even if it's slightly less efficient.",
      "Learn to say 'not tonight' without guilt — real friends respect your priorities.",
      "Join one social activity and one academic activity — this natural balance prevents burnout in either direction.",
      "Sunday planning sessions (30 minutes) prevent the week from feeling chaotic — know what's coming so you can relax when it's time."
    ]
  },
  {
    subject: "How to Get the Most Out of Online Learning",
    tips: [
      "Treat online classes like in-person: get dressed, sit at a desk, and eliminate distractions during lecture.",
      "Use the playback speed feature — 1.25x or 1.5x for review, normal speed for new concepts.",
      "Participate in discussion boards and chat — online courses reward visible engagement in grades and professor perception.",
      "Create a dedicated study space that's ONLY for schoolwork — your brain will associate the space with focus.",
      "Form virtual study groups — screen-sharing and collaborative documents make remote studying effective."
    ]
  },
  {
    subject: "How to Write a Strong Supplemental Essay",
    tips: [
      "Research the school deeply — mention specific programs, professors, traditions, or values that resonate with you.",
      "Be genuine about why this school fits YOUR life story — admissions officers can tell when you're copy-pasting between schools.",
      "Answer the actual question — supplemental prompts are specific for a reason. Don't shoehorn in an unrelated essay.",
      "Keep it concise — most supplements have tight word limits. Make every sentence earn its place.",
      "Have someone who knows nothing about the school read it — if they can tell which school it's for, you've done it right."
    ]
  },
  {
    subject: "Planning Your College Budget",
    tips: [
      "List all costs beyond tuition: housing, meal plans, textbooks, transportation, and personal expenses add up fast.",
      "Textbook hack: rent, buy used, or find PDF versions — never buy new at the campus bookstore unless required.",
      "Apply for work-study even if you don't need it urgently — campus jobs are flexible around class schedules.",
      "Set a weekly spending limit for non-essentials — having a number makes it concrete rather than abstract.",
      "Build an emergency fund of at least $500 before school starts — unexpected costs always come up."
    ]
  },
  {
    subject: "How to Use Scholark to Ace Your Goals",
    tips: [
      "Start with the GPA Calculator to know exactly where you stand — awareness is the first step to improvement.",
      "Use the SAT/ACT Prep daily — even 10 minutes of practice builds momentum and earns XP.",
      "Compare your dream schools with the College Comparison tool — data-driven decisions beat emotional ones.",
      "Run your essay through the on-device Essay Rubric Coach before submitting, then ask a trusted person for a second read.",
      "Set a GPA goal and check the Goal Tracker weekly — consistent monitoring keeps you accountable all semester."
    ]
  },
  {
    subject: "Looking Ahead: Your College Journey Starts Now",
    tips: [
      "Every great achievement started with a single step — opening Scholark today is yours.",
      "The students who succeed aren't the most talented — they're the most consistent. Show up every day.",
      "Your path doesn't need to look like anyone else's — the best outcomes come from authentic choices.",
      "Invest in relationships as much as grades — the people you meet will shape your life more than any GPA.",
      "You've got this. Seriously. The fact that you're reading college tips puts you ahead of most students. Keep going."
    ]
  }
];

// ── Email HTML template ─────────────────────────────────────
function getEmailHTML(tip, weekNum, totalWeeks, unsubscribeEmail) {
  const unsubscribeHref = `mailto:${encodeURIComponent(unsubscribeEmail)}?subject=${encodeURIComponent('Unsubscribe from Scholark weekly tips')}&body=${encodeURIComponent('Please unsubscribe this email address from Scholark weekly tips.')}`;
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
    .feature-box{background:#fdf0e8;border:1px solid #f5d5c0;border-radius:10px;padding:20px;margin:28px 0 8px;text-align:center}
    .feature-box h3{margin:0 0 8px;font-size:16px;color:#c8622a;font-weight:700}
    .feature-box p{margin:0 0 14px;font-size:13px;color:#1a1714}
    .feature-box ul{list-style:none;padding:0;margin:0 0 16px;font-size:13px;color:#1a1714;text-align:left;display:inline-block}
    .feature-box ul li{padding:3px 0}
    .signoff{padding:24px 0 0;font-size:14px;color:#1a1714;line-height:1.7}
    .signoff .name{font-weight:700}
    .footer{text-align:center;padding:24px 0;border-top:1px solid #f3f1ec;font-size:12px;color:#8a847b}
    .footer a{color:#c8622a;text-decoration:underline}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo"><span class="logo-dot"></span>Scholark</div>
      <div style="font-size:12px;color:#8a847b;margin-top:4px">Your weekly college prep tips</div>
    </div>
    <div class="content">
      <div class="week-badge">Week ${weekNum} of ${totalWeeks}</div>
      <h1>${tip.subject}</h1>
      ${tip.tips.map((t, i) => `
      <div class="tip">
        <div class="tip-row">
          <span class="tip-num">${i + 1}</span>
          <span>${t}</span>
        </div>
      </div>`).join('')}
      <div style="text-align:center">
        <a href="https://sribyju.github.io" class="cta">Open Scholark &rarr;</a>
      </div>
      <div class="feature-box">
        <h3>&#10024; Keep building momentum</h3>
        <p>Every Scholark tool is free for signed-in students:</p>
        <ul>
          <li>&#10003; <strong>Essay Rubric Coach</strong> &mdash; private, admissions-reader-style feedback</li>
          <li>&#10003; <strong>Scholarship Finder</strong> &mdash; matched to your profile</li>
          <li>&#10003; <strong>Study Planner</strong> &mdash; never miss a deadline again</li>
          <li>&#10003; <strong>College Compatibility Quiz</strong> &mdash; find your perfect fit</li>
        </ul>
      </div>
      <div class="signoff">
        <p>Regards,</p>
        <p class="name">Shriyan Avadhanula</p>
        <p style="color:#8a847b;font-size:13px">A student just like you.</p>
      </div>
    </div>
    <div class="footer">
      <p>You're receiving this because you have a Scholark account or subscribed to weekly tips.</p>
      <p><a href="${unsubscribeHref}">Unsubscribe from weekly emails</a></p>
      <p><a href="https://sribyju.github.io">Scholark</a> &middot; Free college planning tools</p>
    </div>
  </div>
</body>
</html>`;
}

export function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function recipientFingerprint(email) {
  return createHash("sha256").update(email).digest("hex").slice(0, 10);
}

export function redactEmailAddresses(value) {
  return String(value || "").replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]");
}

export async function getAllAuthEmails(authClient = auth) {
  const emails = new Set();
  let pageToken;
  do {
    const page = await authClient.listUsers(1000, pageToken);
    for (const user of page.users) {
      const email = normalizeEmail(user.email);
      if (isEmail(email)) emails.add(email);
    }
    pageToken = page.pageToken;
  } while (pageToken);
  return emails;
}

async function getSubscriberPreferences(dbClient = db) {
  const snapshot = await dbClient.collection("email_subscribers").get();
  const preferences = new Map();
  for (const document of snapshot.docs) {
    const data = document.data();
    const email = normalizeEmail(data.email || document.id);
    if (!isEmail(email)) continue;
    const existing = preferences.get(email) || { active: false, suppressed: false };
    const explicitlyInactive = data.active === false || Boolean(data.unsubscribedAt);
    preferences.set(email, {
      active: existing.active || data.active !== false,
      // Any explicit inactive duplicate wins so case-variant records cannot
      // accidentally reactivate a person who opted out.
      suppressed: existing.suppressed || explicitlyInactive,
    });
  }
  return preferences;
}

export async function getEligibleRecipients(authClient = auth, dbClient = db) {
  const [authEmails, subscriberPreferences] = await Promise.all([
    getAllAuthEmails(authClient),
    getSubscriberPreferences(dbClient),
  ]);
  const candidates = new Set(authEmails);
  for (const [email, preference] of subscriberPreferences) {
    if (preference.active) candidates.add(email);
  }
  return [...candidates]
    .filter((email) => !subscriberPreferences.get(email)?.suppressed)
    .sort();
}

async function acquireRunLock() {
  const owner = randomUUID();
  const lockRef = db.collection("email_meta").doc("weekly_run_lock");
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(lockRef);
    const expiresAt = snapshot.data()?.expiresAt?.toMillis?.() || 0;
    if (expiresAt > Date.now()) {
      const error = new Error("A weekly email run is already active.");
      error.code = "RUN_ALREADY_ACTIVE";
      throw error;
    }
    transaction.set(lockRef, {
      owner,
      startedAt: FieldValue.serverTimestamp(),
      expiresAt: Timestamp.fromMillis(Date.now() + RUN_LOCK_TTL_MS),
    });
  });
  return async () => {
    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(lockRef);
      if (snapshot.data()?.owner === owner) transaction.delete(lockRef);
    });
  };
}

async function getNextWeekNumber() {
  const counterRef = db.collection("email_meta").doc("week_counter");
  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(counterRef);
    let weekNum = (snapshot.data()?.current || 0) + 1;
    if (weekNum > WEEKLY_TIPS.length) weekNum = 1;
    transaction.set(counterRef, { current: weekNum, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return weekNum;
  });
}

// ── Main ────────────────────────────────────────────────────
async function main() {
  initializeFirebaseAdmin();
  const emailUser = normalizeEmail(process.env.EMAIL_USER);
  const emailPass = process.env.EMAIL_PASS;
  if (!emailUser || !emailPass) throw new Error("Missing EMAIL_USER or EMAIL_PASS environment variables.");

  let releaseLock;
  try {
    try {
      releaseLock = await acquireRunLock();
    } catch (error) {
      if (error.code === "RUN_ALREADY_ACTIVE") {
        console.log("Another weekly email run is active; skipping this run.");
        return;
      }
      throw error;
    }

    const weekNum = await getNextWeekNumber();
    const tip = WEEKLY_TIPS[weekNum - 1];
    const recipients = await getEligibleRecipients();
    const results = { eligible: recipients.length, attempted: 0, sent: 0, failed: 0 };

    console.log(`Week ${weekNum} of ${WEEKLY_TIPS.length} — sending: "${tip.subject}"`);
    console.log(`Total eligible: ${results.eligible}`);
    if (!recipients.length) {
      console.log("No eligible recipients; skipping sends.");
    } else {
      const transporter = createTransport({
        service: "gmail",
        auth: { user: emailUser, pass: emailPass },
      });
      const emailHTML = getEmailHTML(tip, weekNum, WEEKLY_TIPS.length, emailUser);
      const unsubscribeHeader = `<mailto:${emailUser}?subject=${encodeURIComponent("Unsubscribe from Scholark weekly tips")}>`;

      for (const email of recipients) {
        const fingerprint = recipientFingerprint(email);
        results.attempted++;
        try {
          await transporter.sendMail({
            from: `"Scholark" <${emailUser}>`,
            to: email,
            subject: `\u{1F4DA} ${tip.subject} — Scholark Weekly Tips`,
            html: emailHTML,
            headers: { "List-Unsubscribe": unsubscribeHeader },
          });
          results.sent++;
          console.log(`Sent to recipient ${fingerprint}.`);
        } catch (error) {
          results.failed++;
          console.error(`Failed recipient ${fingerprint}: ${redactEmailAddresses(error.message)}`);
        }
      }
    }

    console.log(`Totals — eligible: ${results.eligible}, attempted: ${results.attempted}, sent: ${results.sent}, failed: ${results.failed}.`);
    try {
      await db.collection("email_logs").add({
        sentAt: FieldValue.serverTimestamp(),
        weekNum,
        tipSubject: tip.subject,
        ...results,
      });
    } catch (error) {
      console.warn("Could not write aggregate email log:", redactEmailAddresses(error.message));
    }
    if (results.failed > 0) process.exitCode = 1;
  } finally {
    if (releaseLock) {
      try { await releaseLock(); }
      catch (error) { console.warn("Could not release weekly run lock:", redactEmailAddresses(error.message)); }
    }
  }
}

const isMainModule = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMainModule) {
  main().catch((error) => {
    console.error("Fatal error:", redactEmailAddresses(error.message));
    process.exit(1);
  });
}
