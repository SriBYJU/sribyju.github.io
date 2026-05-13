/**
 * GradeScope — Automated Weekly College Tips Email
 *
 * Sends AI-curated college prep tips to all subscribers every Monday at 8 AM ET.
 * Subscribers are stored in Firestore `email_subscribers` collection.
 *
 * Setup:
 *   1. Enable Firebase Blaze plan (required for scheduled functions)
 *   2. Set email credentials:
 *        firebase functions:config:set email.user="your-email@gmail.com"
 *        firebase functions:config:set email.pass="your-app-password"
 *      (Use a Gmail App Password: https://myaccount.google.com/apppasswords)
 *   3. Deploy:
 *        firebase deploy --only functions
 */

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();
const db = admin.firestore();

// 52 unique weekly tips — one for each week of the year
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
      "GradeScope's GPA Calculator helps you plan your semester grades strategically — bookmark it and use it weekly.",
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
  }
];

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
        <a href="https://gradescope.app" class="cta">Open GradeScope →</a>
      </div>
    </div>
    <div class="footer">
      <p>You're receiving this because you signed up for GradeScope weekly tips.</p>
      <p><a href="https://gradescope.app">GradeScope</a> · Free college planning tools</p>
    </div>
  </div>
</body>
</html>`;
}

// Weekly email — runs every Monday at 8:00 AM Eastern Time
exports.sendWeeklyEmails = onSchedule(
  {
    schedule: "every monday 08:00",
    timeZone: "America/New_York",
    region: "us-central1",
  },
  async () => {
    // Determine which tip to send (rotate through 52 weeks)
    const weekOfYear = Math.ceil(
      (Date.now() - new Date(new Date().getFullYear(), 0, 1)) / 604800000
    );
    const tipIndex = (weekOfYear - 1) % WEEKLY_TIPS.length;
    const tip = WEEKLY_TIPS[tipIndex];

    // Get all active subscribers
    const subscribersSnap = await db
      .collection("email_subscribers")
      .where("active", "==", true)
      .get();

    if (subscribersSnap.empty) {
      console.log("No active subscribers — skipping.");
      return;
    }

    // Set up email transport
    // Credentials come from Firebase environment config:
    //   firebase functions:config:set email.user="x" email.pass="y"
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
      console.error(
        "Email credentials not configured. Run:\n" +
          '  firebase functions:secrets:set EMAIL_USER\n' +
          '  firebase functions:secrets:set EMAIL_PASS'
      );
      return;
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: emailUser, pass: emailPass },
    });

    const emailHTML = getEmailHTML(tip, weekOfYear);

    // Send to each subscriber
    const results = { sent: 0, failed: 0 };
    const batch = subscribersSnap.docs.map(async (docSnap) => {
      const sub = docSnap.data();
      try {
        await transporter.sendMail({
          from: `"GradeScope" <${emailUser}>`,
          to: sub.email,
          subject: `📚 ${tip.subject} — GradeScope Weekly Tips`,
          html: emailHTML,
        });
        results.sent++;
      } catch (err) {
        console.error(`Failed to send to ${sub.email}:`, err.message);
        results.failed++;
      }
    });

    await Promise.all(batch);
    console.log(
      `Weekly email sent. ${results.sent} delivered, ${results.failed} failed.`
    );

    // Log the send
    await db.collection("email_logs").add({
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      weekOfYear,
      tipSubject: tip.subject,
      subscriberCount: subscribersSnap.size,
      sent: results.sent,
      failed: results.failed,
    });
  }
);

// Manual trigger endpoint (for testing)
exports.sendTestEmail = onRequest(
  { region: "us-central1" },
  async (req, res) => {
    const { email } = req.query;
    if (!email) {
      res.status(400).send("Provide ?email=your@email.com");
      return;
    }

    const weekOfYear = Math.ceil(
      (Date.now() - new Date(new Date().getFullYear(), 0, 1)) / 604800000
    );
    const tipIndex = (weekOfYear - 1) % WEEKLY_TIPS.length;
    const tip = WEEKLY_TIPS[tipIndex];

    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    if (!emailUser || !emailPass) {
      res.status(500).send("Email credentials not configured.");
      return;
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: emailUser, pass: emailPass },
    });

    try {
      await transporter.sendMail({
        from: `"GradeScope" <${emailUser}>`,
        to: email,
        subject: `📚 ${tip.subject} — GradeScope Weekly Tips`,
        html: getEmailHTML(tip, weekOfYear),
      });
      res.send(`Test email sent to ${email}`);
    } catch (err) {
      res.status(500).send(`Failed: ${err.message}`);
    }
  }
);
