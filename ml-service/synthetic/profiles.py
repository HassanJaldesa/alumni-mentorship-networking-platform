"""Synthetic student and mentor profiles for validating the engine (DR-04).

All people are fictional. Every account uses an @synthetic.test email so it
can be recognised and removed before the pilot.

Twenty evaluation scenarios each pair one student with three intended
mentors. The intended matches were written by hand to fit the student before
the engine was run, so the evaluation does not rely on the engine's own
output. The scenarios are concentrated in the five industries closest to
Strathmore's ICT and commerce programmes (5 Software & IT, 4 Data &
Analytics, 4 Fintech & Mobile Money, 4 Banking & Finance, 3 Cybersecurity),
so each student's gate pool also contains mentors written for other students
in the same industry, and the ranking has to choose between them. Ten
further students and ten general mentors (two in each remaining industry)
make the pool more realistic.
"""
from dataclasses import dataclass, field

EMAIL_DOMAIN = "synthetic.test"


@dataclass(frozen=True)
class StudentSpec:
    first_name: str
    last_name: str
    programme: str
    year_of_study: str
    industry: str
    skills: tuple[str, ...]
    interests: tuple[str, ...]
    availability: str
    biography: str
    career_goals: str

    @property
    def email(self) -> str:
        return f"{self.first_name}.{self.last_name}@{EMAIL_DOMAIN}".lower()


@dataclass(frozen=True)
class MentorSpec:
    first_name: str
    last_name: str
    years_of_experience: int
    industry: str
    skills: tuple[str, ...]
    interests: tuple[str, ...]
    availability: str
    summary: str
    focus: str
    max_mentees: int = 3

    @property
    def email(self) -> str:
        return f"{self.first_name}.{self.last_name}@{EMAIL_DOMAIN}".lower()


@dataclass(frozen=True)
class Scenario:
    scenario_id: str
    description: str
    student: StudentSpec
    intended_mentors: tuple[MentorSpec, ...] = field(default_factory=tuple)


S = StudentSpec
M = MentorSpec

SCENARIOS: tuple[Scenario, ...] = (
    # ---------------- Software & IT ----------------
    Scenario(
        "SC01",
        "Backend and cloud developer, weekends",
        S("Brian", "Otieno", "BSc Computer Science", "Fourth Year", "Software & IT",
          ("Python", "Java", "Cloud Computing", "DevOps"),
          ("Technical Skills", "Career Guidance", "Internships & Job Search"), "Weekends",
          "Final-year computer science student who enjoys building REST APIs and deploying services with Docker on cloud platforms.",
          "I want to become a backend engineer designing scalable cloud-native systems and microservices."),
        (
            M("Kevin", "Mwangi", 9, "Software & IT", ("Python", "Cloud Computing", "DevOps"),
              ("Technical Skills", "Career Guidance"), "Weekends",
              "Senior backend engineer who designs microservices and runs Kubernetes clusters on AWS for a regional e-commerce company.",
              "Coaching students on API design, cloud deployment and starting a backend engineering career."),
            M("Janet", "Wanjiku", 7, "Software & IT", ("Java", "Cloud Computing", "SQL"),
              ("Technical Skills", "Internships & Job Search"), "Weekends",
              "Cloud solutions architect who migrates enterprise Java applications to managed cloud services and serverless platforms.",
              "Helping students learn cloud architecture and land backend or platform engineering internships."),
            M("Samuel", "Kiprop", 12, "Software & IT", ("DevOps", "Cloud Computing", "Leadership"),
              ("Career Guidance", "Technical Skills"), "Flexible",
              "Platform engineering lead responsible for CI/CD pipelines, infrastructure as code and site reliability for distributed systems.",
              "Mentoring junior engineers on DevOps practices and growing from developer to platform engineer."),
        ),
    ),
    Scenario(
        "SC02",
        "Mobile app and UI/UX design, weekday evenings",
        S("Faith", "Achieng", "BSc Informatics", "Third Year", "Software & IT",
          ("JavaScript", "Mobile Development", "UI/UX Design"),
          ("CV & Interview Preparation", "Industry Insights", "Career Guidance"), "Weekday Evenings",
          "Informatics student who designs mobile app interfaces in Figma and builds them with React Native.",
          "I want to become a product designer creating user-friendly mobile apps for African consumers."),
        (
            M("Grace", "Njeri", 8, "Software & IT", ("UI/UX Design", "Mobile Development", "Product Management"),
              ("Industry Insights", "CV & Interview Preparation"), "Weekday Evenings",
              "Lead product designer who runs user research and designs mobile banking and e-commerce apps used by millions of customers.",
              "Reviewing design portfolios and preparing students for product design interviews."),
            M("Dennis", "Omondi", 6, "Software & IT", ("JavaScript", "Mobile Development", "UI/UX Design"),
              ("Professional Networking", "Industry Insights"), "Weekday Evenings",
              "Mobile developer and designer who builds cross-platform apps with React Native and Flutter for startups.",
              "Showing students how designers and mobile developers work together to ship apps."),
            M("Lucy", "Chebet", 10, "Software & IT", ("UI/UX Design", "Product Management", "Leadership"),
              ("CV & Interview Preparation", "Career Guidance"), "Flexible",
              "Head of user experience who leads a team of designers working on accessible mobile and web products.",
              "Guiding aspiring UX designers on building a portfolio and getting their first design role."),
        ),
    ),
    Scenario(
        "SC03",
        "Full-stack web development for startups, flexible",
        S("Moses", "Njuguna", "BSc Computer Science", "Third Year", "Software & IT",
          ("JavaScript", "Web Development", "SQL"),
          ("Technical Skills", "Entrepreneurship", "Career Guidance"), "Flexible",
          "Computer science student who freelances building websites for small businesses with React, Node.js and PostgreSQL.",
          "I want to become a full-stack developer at an early-stage startup and later build my own software product."),
        (
            M("Oscar", "Ndirangu", 8, "Software & IT", ("JavaScript", "Web Development", "Cloud Computing"),
              ("Technical Skills", "Entrepreneurship"), "Weekday Evenings",
              "Full-stack engineer and early employee at a logistics startup, building React front ends and Node.js services.",
              "Helping students ship full-stack web projects and decide whether to join a startup."),
            M("Wanjiru", "Gathoni", 6, "Software & IT", ("JavaScript", "Web Development", "SQL"),
              ("Technical Skills", "Career Guidance"), "Weekends",
              "Freelance web developer turned agency founder who builds e-commerce and booking websites for small businesses.",
              "Showing students how to turn freelance web work into a career or a business."),
            M("Hillary", "Kosgei", 11, "Software & IT", ("Web Development", "Product Management", "Leadership"),
              ("Entrepreneurship", "Career Guidance"), "Flexible",
              "Co-founder and CTO of a software-as-a-service startup serving small retailers.",
              "Mentoring student developers who want to build and launch their own web products."),
        ),
    ),
    Scenario(
        "SC04",
        "Software testing and QA automation, weekday mornings",
        S("Nelly", "Chepngetich", "BSc Informatics", "Fourth Year", "Software & IT",
          ("Python", "JavaScript", "Project Management"),
          ("Technical Skills", "Internships & Job Search", "CV & Interview Preparation"), "Weekday Mornings",
          "Informatics student who writes automated tests with Selenium and enjoys finding bugs before users do.",
          "I want to become a quality assurance automation engineer ensuring software is reliable before release."),
        (
            M("Alex", "Muchiri", 9, "Software & IT", ("Python", "JavaScript", "DevOps"),
              ("Technical Skills", "Internships & Job Search"), "Weekday Mornings",
              "QA automation lead who builds end-to-end test suites and quality gates in CI pipelines for a banking app.",
              "Teaching students test automation and how to start a career in software quality assurance."),
            M("Faith", "Mumbua", 6, "Software & IT", ("Python", "Project Management"),
              ("CV & Interview Preparation", "Technical Skills"), "Flexible",
              "Software tester specialising in mobile app testing, performance testing and bug tracking.",
              "Helping students prepare for QA and software testing interviews."),
            M("Duncan", "Kirimi", 13, "Software & IT", ("Project Management", "Leadership"),
              ("Internships & Job Search", "Career Guidance"), "Weekday Mornings",
              "Head of quality engineering who sets testing standards and release processes across product teams.",
              "Guiding students into testing roles and growing into quality engineering leadership."),
        ),
    ),
    Scenario(
        "SC05",
        "Embedded and IoT software for agriculture, weekends",
        S("Evans", "Kiprono", "BSc Computer Science", "Fourth Year", "Software & IT",
          ("Python", "Networking", "Mobile Development"),
          ("Technical Skills", "Industry Insights", "Career Guidance"), "Weekends",
          "Computer science student who built a soil moisture monitoring system with sensors and a microcontroller for farmers.",
          "I want to develop IoT and embedded software that helps farmers monitor crops and water use."),
        (
            M("Jeremiah", "Sang", 10, "Software & IT", ("Python", "Networking", "Cloud Computing"),
              ("Technical Skills", "Industry Insights"), "Weekends",
              "Embedded systems engineer developing firmware and IoT sensor networks for smart agriculture.",
              "Teaching students embedded programming and building IoT products for farmers."),
            M("Mercy", "Cherotich", 7, "Software & IT", ("Mobile Development", "Python"),
              ("Industry Insights", "Technical Skills"), "Flexible",
              "Agritech product engineer building mobile apps that connect smallholder farmers to weather and market data.",
              "Showing students how technology products are designed for rural users."),
            M("Godfrey", "Ruto", 15, "Software & IT", ("Networking", "Leadership"),
              ("Career Guidance", "Industry Insights"), "Weekends",
              "Engineering manager at an IoT company deploying connected devices for agriculture and logistics.",
              "Mentoring engineers interested in hardware, IoT and technical leadership."),
        ),
    ),
    # ---------------- Data & Analytics ----------------
    Scenario(
        "SC06",
        "Machine learning and NLP engineering, weekends",
        S("Amina", "Hussein", "BSc Computer Science", "Fourth Year", "Data & Analytics",
          ("Python", "Machine Learning", "Data Analysis"),
          ("Technical Skills", "Career Guidance", "Graduate Studies"), "Weekends",
          "Computer science student training text classification models with Python and experimenting with sentence embeddings.",
          "I want to become a machine learning engineer working on natural language processing for African languages."),
        (
            M("Michael", "Waweru", 9, "Data & Analytics", ("Python", "Machine Learning", "Cloud Computing"),
              ("Technical Skills", "Career Guidance"), "Weekends",
              "Machine learning engineer who trains and deploys natural language processing models for customer support automation.",
              "Coaching students on machine learning projects, model deployment and ML engineering careers."),
            M("Christine", "Awuor", 7, "Data & Analytics", ("Python", "Machine Learning"),
              ("Technical Skills", "Graduate Studies"), "Weekends",
              "Data scientist researching speech and text models for Swahili and other African languages.",
              "Guiding students interested in NLP research and postgraduate study in machine learning."),
            M("David", "Langat", 12, "Data & Analytics", ("Machine Learning", "Python", "Leadership"),
              ("Career Guidance", "Graduate Studies"), "Flexible",
              "Head of artificial intelligence leading a team that builds recommendation and language models.",
              "Mentoring aspiring ML engineers on building a portfolio and choosing between industry and research."),
        ),
    ),
    Scenario(
        "SC07",
        "Business intelligence and analytics, weekday evenings",
        S("Purity", "Nyokabi", "Bachelor of Business Information Technology", "Third Year", "Data & Analytics",
          ("SQL", "Data Analysis", "Business Strategy"),
          ("Industry Insights", "CV & Interview Preparation", "Career Guidance"), "Weekday Evenings",
          "Business IT student who builds sales dashboards in Power BI and writes SQL reports for a family business.",
          "I want to become a business intelligence analyst helping companies make decisions from data."),
        (
            M("Margaret", "Wanjala", 8, "Data & Analytics", ("SQL", "Data Analysis", "Business Strategy"),
              ("Industry Insights", "CV & Interview Preparation"), "Weekday Evenings",
              "Business intelligence manager who builds executive dashboards and reporting for a retail chain.",
              "Helping students prepare for analyst interviews and build dashboard portfolios."),
            M("Benson", "Kiplagat", 6, "Data & Analytics", ("SQL", "Data Analysis"),
              ("Internships & Job Search", "Industry Insights"), "Weekday Evenings",
              "Data analyst who writes SQL, cleans data and builds Power BI reports on sales and marketing performance.",
              "Sharing how to get a first data analyst internship."),
            M("Joyce", "Adhiambo", 11, "Data & Analytics", ("Data Analysis", "Business Strategy", "Leadership"),
              ("CV & Interview Preparation", "Career Guidance"), "Flexible",
              "Analytics lead who turns business questions into reporting and insight projects for commercial teams.",
              "Coaching analysts on communicating insights to business stakeholders."),
        ),
    ),
    Scenario(
        "SC08",
        "Data engineering and pipelines, weekday mornings",
        S("Tony", "Gachanja", "BSc Computer Science", "Fourth Year", "Data & Analytics",
          ("Python", "SQL", "Cloud Computing"),
          ("Technical Skills", "Internships & Job Search", "Career Guidance"), "Weekday Mornings",
          "Computer science student who builds data pipelines with Python and Airflow and enjoys designing databases.",
          "I want to become a data engineer building reliable data platforms and pipelines in the cloud."),
        (
            M("Brenda", "Wangari", 8, "Data & Analytics", ("Python", "SQL", "Cloud Computing"),
              ("Technical Skills", "Internships & Job Search"), "Weekday Mornings",
              "Data engineer who designs ETL pipelines and a cloud data warehouse for a supermarket chain.",
              "Teaching students data pipelines, warehousing and how to land a data engineering internship."),
            M("Patrick", "Ngari", 11, "Data & Analytics", ("SQL", "Cloud Computing", "DevOps"),
              ("Technical Skills", "Career Guidance"), "Flexible",
              "Data platform lead running streaming data infrastructure with Kafka and Spark for an insurance group.",
              "Mentoring engineers on building scalable data platforms."),
            M("Sylvia", "Nyawira", 6, "Data & Analytics", ("Python", "SQL"),
              ("Internships & Job Search", "Technical Skills"), "Weekday Mornings",
              "Analytics engineer who models data in SQL and maintains data quality checks for reporting.",
              "Helping students move from SQL coursework to data engineering jobs."),
        ),
    ),
    Scenario(
        "SC09",
        "Data science for public health and social impact, flexible",
        S("Mary", "Achieng", "BSc Statistics and Data Science", "Fourth Year", "Data & Analytics",
          ("Data Analysis", "Python", "Machine Learning"),
          ("Graduate Studies", "Industry Insights", "Career Guidance"), "Flexible",
          "Statistics student analysing malaria and maternal health survey data for a non-profit research project.",
          "I want to use data science to improve public health programmes and later study epidemiology."),
        (
            M("Ruth", "Kendi", 9, "Data & Analytics", ("Data Analysis", "Python", "Machine Learning"),
              ("Graduate Studies", "Industry Insights"), "Weekday Evenings",
              "Health data scientist building disease prediction and survey analysis models for a global health NGO.",
              "Guiding students who want data careers in global health and further study."),
            M("Paul", "Mwenda", 12, "Data & Analytics", ("Data Analysis", "Leadership"),
              ("Industry Insights", "Career Guidance"), "Weekends",
              "Monitoring and evaluation lead using data to measure the impact of education and health programmes.",
              "Mentoring students on impact evaluation and data for development careers."),
            M("Angela", "Wairimu", 7, "Data & Analytics", ("Python", "Data Analysis"),
              ("Graduate Studies", "Career Guidance"), "Flexible",
              "Biostatistician analysing clinical trial and epidemiology data at a research institute.",
              "Helping students choose between statistics, epidemiology and data science study paths."),
        ),
    ),
    # ---------------- Fintech & Mobile Money ----------------
    Scenario(
        "SC10",
        "Payments engineering and mobile money APIs, weekends",
        S("Ian", "Njoroge", "BSc Computer Science", "Fourth Year", "Fintech & Mobile Money",
          ("Python", "JavaScript", "Web Development", "SQL"),
          ("Technical Skills", "Industry Insights", "Internships & Job Search"), "Weekends",
          "Computer science student who has integrated mobile money payment APIs into a small e-commerce project.",
          "I want to become a payments engineer building secure transaction systems for mobile money platforms."),
        (
            M("Daniel", "Gitau", 9, "Fintech & Mobile Money", ("Python", "Web Development", "Cloud Computing"),
              ("Technical Skills", "Industry Insights"), "Weekends",
              "Payments platform engineer building transaction processing services and mobile money APIs for a fintech company.",
              "Teaching students how payment systems, reconciliation and mobile money integrations work."),
            M("Caroline", "Nyambura", 7, "Fintech & Mobile Money", ("JavaScript", "Web Development", "Cybersecurity"),
              ("Technical Skills", "Internships & Job Search"), "Weekends",
              "Software engineer who integrates banks and merchants with mobile wallets through secure payment gateways.",
              "Helping students get engineering internships at payment and fintech companies."),
            M("Moses", "Kipkemboi", 13, "Fintech & Mobile Money", ("Python", "SQL", "Leadership"),
              ("Industry Insights", "Career Guidance"), "Flexible",
              "Engineering director who leads core payments and fraud detection teams at a mobile money provider.",
              "Mentoring engineers interested in building reliable large-scale payment systems."),
        ),
    ),
    Scenario(
        "SC11",
        "Fintech entrepreneurship, weekday evenings",
        S("Sharon", "Akinyi", "Bachelor of Business Information Technology", "Fourth Year", "Fintech & Mobile Money",
          ("Business Strategy", "Product Management", "Public Speaking"),
          ("Entrepreneurship", "Professional Networking", "Industry Insights"), "Weekday Evenings",
          "Business IT student running a small savings group app with friends and pitching it at university innovation competitions.",
          "I want to found a fintech startup that helps informal traders save and access credit."),
        (
            M("Eric", "Kibet", 10, "Fintech & Mobile Money", ("Business Strategy", "Product Management", "Leadership"),
              ("Entrepreneurship", "Leadership Development"), "Weekday Evenings",
              "Founder and CEO of a lending startup that provides digital credit to small businesses, after raising seed and series A funding.",
              "Advising student founders on validating ideas, fundraising and building a startup team."),
            M("Naomi", "Wangari", 8, "Fintech & Mobile Money", ("Product Management", "Business Strategy"),
              ("Entrepreneurship", "Professional Networking"), "Weekday Evenings",
              "Startup product lead who launched a savings and insurance product for informal workers using mobile money.",
              "Helping student entrepreneurs design financial products for underserved customers."),
            M("Peter", "Muriuki", 15, "Fintech & Mobile Money", ("Business Strategy", "Financial Analysis", "Leadership"),
              ("Entrepreneurship", "Industry Insights"), "Flexible",
              "Venture partner at an early-stage fund that invests in African fintech startups.",
              "Explaining how investors evaluate fintech startups and how to prepare a pitch."),
        ),
    ),
    Scenario(
        "SC12",
        "Credit risk and digital lending analytics, weekends",
        S("Kelvin", "Omwenga", "BSc Actuarial Science", "Fourth Year", "Fintech & Mobile Money",
          ("Data Analysis", "Machine Learning", "Financial Analysis"),
          ("Technical Skills", "Industry Insights", "Career Guidance"), "Weekends",
          "Actuarial science student who built a loan default prediction model using mobile money transaction data.",
          "I want to work as a credit risk data scientist at a digital lender."),
        (
            M("Sarah", "Wanjala", 8, "Fintech & Mobile Money", ("Machine Learning", "Data Analysis", "Python"),
              ("Technical Skills", "Industry Insights"), "Weekends",
              "Credit risk data scientist who builds credit scoring models from mobile money and airtime data for a digital lender.",
              "Teaching students credit scoring and machine learning for lending."),
            M("Collins", "Kibet", 11, "Fintech & Mobile Money", ("Financial Analysis", "Data Analysis"),
              ("Career Guidance", "Industry Insights"), "Flexible",
              "Head of credit at a buy-now-pay-later company, setting lending policy and monitoring loan portfolios.",
              "Explaining risk management and credit careers in fintech."),
            M("Lynn", "Atieno", 6, "Fintech & Mobile Money", ("Python", "Machine Learning"),
              ("Technical Skills", "Career Guidance"), "Weekends",
              "Fraud analytics engineer detecting suspicious transactions and loan fraud with machine learning.",
              "Helping students build data science projects with financial data."),
        ),
    ),
    Scenario(
        "SC13",
        "Fintech compliance, KYC and anti-money laundering, weekday evenings",
        S("Rose", "Wambui", "Bachelor of Laws", "Fourth Year", "Fintech & Mobile Money",
          ("Business Strategy", "Project Management", "Public Speaking"),
          ("Industry Insights", "CV & Interview Preparation", "Professional Networking"), "Weekday Evenings",
          "Law student researching financial regulation, data protection and anti-money laundering rules for mobile money.",
          "I want to work in regulatory compliance for a fintech company."),
        (
            M("Judith", "Mwikali", 10, "Fintech & Mobile Money", ("Business Strategy", "Project Management"),
              ("Industry Insights", "CV & Interview Preparation"), "Weekday Evenings",
              "Compliance manager responsible for KYC, anti-money laundering and regulatory reporting at a mobile money company.",
              "Helping students prepare for compliance and regulatory roles in fintech."),
            M("Ken", "Oduya", 13, "Fintech & Mobile Money", ("Business Strategy", "Leadership"),
              ("Professional Networking", "Industry Insights"), "Flexible",
              "Head of legal and regulatory affairs who negotiates licences and engages central bank regulators.",
              "Mentoring law and business students on fintech regulation careers."),
            M("Nancy", "Chepkemoi", 6, "Fintech & Mobile Money", ("Project Management", "Data Analysis"),
              ("CV & Interview Preparation", "Professional Networking"), "Weekday Evenings",
              "Anti-money laundering analyst investigating suspicious transactions and customer due diligence cases.",
              "Sharing how to start a career in financial crime compliance."),
        ),
    ),
    # ---------------- Banking & Finance ----------------
    Scenario(
        "SC14",
        "Investment analysis and financial modelling, weekends",
        S("Collins", "Kamau", "Bachelor of Commerce (Finance)", "Fourth Year", "Banking & Finance",
          ("Financial Analysis", "Data Analysis", "SQL"),
          ("Career Guidance", "Industry Insights", "Graduate Studies"), "Weekends",
          "Finance student who builds valuation models in Excel and follows equity markets and the Nairobi Securities Exchange closely.",
          "I want to become an investment analyst and complete the CFA qualification."),
        (
            M("Patrick", "Mutua", 11, "Banking & Finance", ("Financial Analysis", "Business Strategy", "Leadership"),
              ("Career Guidance", "Graduate Studies"), "Weekends",
              "Portfolio manager at an asset management firm who analyses equities and builds discounted cash flow valuation models.",
              "Advising students on investment analysis careers and preparing for the CFA exams."),
            M("Esther", "Wambui", 8, "Banking & Finance", ("Financial Analysis", "Data Analysis"),
              ("Industry Insights", "Career Guidance"), "Weekends",
              "Equity research analyst covering East African banks and telecoms, writing company valuations and investment recommendations.",
              "Teaching financial modelling and how equity research teams work."),
            M("Victor", "Ouma", 14, "Banking & Finance", ("Financial Analysis", "Business Strategy"),
              ("Career Guidance", "Industry Insights"), "Flexible",
              "Investment banker who advises companies on mergers, acquisitions and capital raising across East Africa.",
              "Explaining corporate finance and investment banking careers to finance students."),
        ),
    ),
    Scenario(
        "SC15",
        "Audit and accounting, weekday evenings",
        S("Mercy", "Wairimu", "Bachelor of Commerce (Accounting)", "Third Year", "Banking & Finance",
          ("Accounting", "Financial Analysis"),
          ("CV & Interview Preparation", "Internships & Job Search", "Career Guidance"), "Weekday Evenings",
          "Accounting student studying for ACCA papers alongside my degree, with a strong interest in auditing and financial reporting.",
          "I want to join an audit firm as a graduate trainee and become a qualified chartered accountant."),
        (
            M("Agnes", "Muthoni", 9, "Banking & Finance", ("Accounting", "Financial Analysis"),
              ("CV & Interview Preparation", "Internships & Job Search"), "Weekday Evenings",
              "Audit manager at a professional services firm leading external audits of banks and insurance companies.",
              "Helping accounting students prepare for audit graduate programmes and interviews."),
            M("Joseph", "Kariuki", 12, "Banking & Finance", ("Accounting", "Leadership"),
              ("Professional Networking", "Career Guidance"), "Weekday Evenings",
              "Chartered accountant and finance manager responsible for financial reporting, IFRS compliance and budgeting at a commercial bank.",
              "Guiding students through ACCA and CPA qualifications and early accounting careers."),
            M("Ruth", "Atieno", 6, "Banking & Finance", ("Accounting", "Data Analysis"),
              ("Internships & Job Search", "Professional Networking"), "Flexible",
              "Internal auditor who reviews controls, risk and compliance processes in a microfinance bank.",
              "Sharing how to find accounting internships and build a professional network in finance."),
        ),
    ),
    Scenario(
        "SC16",
        "Credit analysis and corporate banking, weekday mornings",
        S("Dennis", "Kimutai", "Bachelor of Commerce (Finance)", "Fourth Year", "Banking & Finance",
          ("Financial Analysis", "Accounting", "Business Strategy"),
          ("Career Guidance", "Internships & Job Search", "Industry Insights"), "Weekday Mornings",
          "Finance student who analyses company financial statements and is interested in lending to businesses.",
          "I want to become a credit analyst and relationship manager in corporate banking."),
        (
            M("Hannah", "Wanjiku", 9, "Banking & Finance", ("Financial Analysis", "Accounting"),
              ("Internships & Job Search", "Career Guidance"), "Weekday Mornings",
              "Corporate credit analyst assessing loan applications and financial statements of medium-sized businesses at a commercial bank.",
              "Teaching students credit analysis and helping them find banking internships."),
            M("Geoffrey", "Mutuku", 14, "Banking & Finance", ("Business Strategy", "Financial Analysis", "Leadership"),
              ("Industry Insights", "Career Guidance"), "Flexible",
              "Corporate banking relationship director managing lending and trade finance for large companies.",
              "Mentoring students on relationship management and corporate banking careers."),
            M("Lucy", "Njoki", 7, "Banking & Finance", ("Financial Analysis", "Data Analysis"),
              ("Industry Insights", "Internships & Job Search"), "Weekday Mornings",
              "Credit risk officer who monitors loan portfolios and early warning signs of default.",
              "Explaining how banks manage credit risk."),
        ),
    ),
    Scenario(
        "SC17",
        "Treasury and market risk, flexible",
        S("Brian", "Ndungu", "BSc Financial Engineering", "Fourth Year", "Banking & Finance",
          ("Financial Analysis", "Python", "Data Analysis"),
          ("Technical Skills", "Graduate Studies", "Career Guidance"), "Flexible",
          "Financial engineering student modelling interest rates and foreign exchange risk in Python.",
          "I want to work in a bank treasury or market risk team and later do a master's in quantitative finance."),
        (
            M("Simon", "Wafula", 12, "Banking & Finance", ("Financial Analysis", "Data Analysis"),
              ("Technical Skills", "Career Guidance"), "Weekday Evenings",
              "Treasury dealer managing foreign exchange and money market positions for a commercial bank.",
              "Teaching students how bank treasuries work and how to get into trading roles."),
            M("Caroline", "Mutheu", 9, "Banking & Finance", ("Python", "Financial Analysis"),
              ("Graduate Studies", "Technical Skills"), "Weekends",
              "Market risk analyst building value-at-risk and stress testing models in Python.",
              "Guiding students on quantitative finance skills and postgraduate options."),
            M("Frank", "Otieno", 16, "Banking & Finance", ("Financial Analysis", "Leadership"),
              ("Career Guidance", "Graduate Studies"), "Flexible",
              "Chief risk officer overseeing market, liquidity and credit risk at a regional bank.",
              "Mentoring students who want careers in risk management."),
        ),
    ),
    # ---------------- Cybersecurity ----------------
    Scenario(
        "SC18",
        "Penetration testing and offensive security, weekends",
        S("Felix", "Odongo", "BSc Computer Networks and Cyber Security", "Fourth Year", "Cybersecurity",
          ("Cybersecurity", "Networking", "Python"),
          ("Technical Skills", "Career Guidance", "Internships & Job Search"), "Weekends",
          "Security student who competes in capture-the-flag events and practises web application exploitation in home labs.",
          "I want to become a penetration tester and earn the OSCP certification."),
        (
            M("Timothy", "Kirui", 9, "Cybersecurity", ("Cybersecurity", "Networking", "Python"),
              ("Technical Skills", "Career Guidance"), "Weekends",
              "Penetration tester who performs web application and network security assessments for banks and telecoms.",
              "Coaching students on ethical hacking, CTF practice and the OSCP certification."),
            M("Rose", "Nekesa", 6, "Cybersecurity", ("Cybersecurity", "Web Development"),
              ("Technical Skills", "Internships & Job Search"), "Weekends",
              "Red team operator and bug bounty hunter who finds vulnerabilities in web and mobile applications.",
              "Helping students start in offensive security and find security internships."),
            M("Paul", "Ochieng", 14, "Cybersecurity", ("Cybersecurity", "Leadership"),
              ("Career Guidance", "Technical Skills"), "Flexible",
              "Head of a security operations centre that detects and responds to cyber attacks.",
              "Mentoring students on security careers across offensive and defensive roles."),
        ),
    ),
    Scenario(
        "SC19",
        "Security governance, risk and compliance, weekday evenings",
        S("Lydia", "Jelagat", "Bachelor of Business Information Technology", "Fourth Year", "Cybersecurity",
          ("Cybersecurity", "Project Management", "Business Strategy"),
          ("Industry Insights", "CV & Interview Preparation", "Career Guidance"), "Weekday Evenings",
          "Business IT student interested in data protection law, information security policies and risk management.",
          "I want to work in IT governance, risk and compliance and help organisations meet ISO 27001 and data protection requirements."),
        (
            M("Evelyn", "Mukami", 10, "Cybersecurity", ("Cybersecurity", "Project Management"),
              ("Industry Insights", "CV & Interview Preparation"), "Weekday Evenings",
              "Information security risk manager who leads ISO 27001 certification and policy programmes at an insurance company.",
              "Helping students understand governance, risk and compliance careers and certifications."),
            M("Charles", "Owino", 8, "Cybersecurity", ("Cybersecurity", "Business Strategy"),
              ("Professional Networking", "Industry Insights"), "Weekday Evenings",
              "Data protection officer who manages privacy compliance and data protection impact assessments.",
              "Explaining data protection law and privacy careers to students."),
            M("Susan", "Cherono", 12, "Cybersecurity", ("Cybersecurity", "Leadership"),
              ("CV & Interview Preparation", "Career Guidance"), "Flexible",
              "IT audit and assurance lead reviewing security controls and regulatory compliance for financial institutions.",
              "Coaching students on IT audit and risk careers."),
        ),
    ),
    Scenario(
        "SC20",
        "Security operations and incident response, weekday evenings",
        S("Kennedy", "Wanyonyi", "BSc Computer Networks and Cyber Security", "Third Year", "Cybersecurity",
          ("Cybersecurity", "Networking", "Cloud Computing"),
          ("Technical Skills", "Internships & Job Search", "Industry Insights"), "Weekday Evenings",
          "Security student who monitors logs with a SIEM in a home lab and studies malware analysis.",
          "I want to become a security operations centre analyst responding to cyber incidents."),
        (
            M("Lilian", "Achieng", 8, "Cybersecurity", ("Cybersecurity", "Networking"),
              ("Technical Skills", "Industry Insights"), "Weekday Evenings",
              "SOC analyst who triages alerts, investigates incidents and hunts threats for a managed security provider.",
              "Teaching students SIEM tools and how to get a SOC analyst job."),
            M("Martin", "Kahiga", 10, "Cybersecurity", ("Cybersecurity", "Cloud Computing"),
              ("Industry Insights", "Technical Skills"), "Flexible",
              "Incident response and digital forensics lead who investigates breaches and ransomware attacks.",
              "Explaining incident response, forensics and cloud security careers."),
            M("Esther", "Chebet", 7, "Cybersecurity", ("Cybersecurity", "Python"),
              ("Technical Skills", "Internships & Job Search"), "Flexible",
              "Detection engineer who writes detection rules and automates security monitoring with Python.",
              "Helping students build blue-team skills for security internships."),
        ),
    ),
)

# Ten general students, not used as evaluation scenarios.
EXTRA_STUDENTS: tuple[StudentSpec, ...] = (
    S("Victor", "Kiplimo", "BSc Computer Science", "Second Year", "Software & IT",
      ("JavaScript", "Web Development"), ("Career Guidance", "Technical Skills"), "Flexible",
      "Second-year student building personal websites and learning React.",
      "I want to become a full-stack web developer."),
    S("Mary", "Wangui", "Bachelor of Commerce", "Second Year", "Banking & Finance",
      ("Accounting", "Financial Analysis"), ("Career Guidance", "Professional Networking"), "Weekday Mornings",
      "Commerce student interested in corporate banking and credit analysis.",
      "I want to work in corporate banking after graduating."),
    S("Joseph", "Nzioka", "BSc Informatics", "Third Year", "Fintech & Mobile Money",
      ("Python", "SQL"), ("Technical Skills", "Industry Insights"), "Flexible",
      "Informatics student curious about credit scoring and digital lending.",
      "I want to build data products for digital lenders."),
    S("Ann", "Mumbi", "BSc Telecommunications Engineering", "Second Year", "Telecommunications",
      ("Networking",), ("Career Guidance", "Internships & Job Search"), "Weekday Mornings",
      "Engineering student learning about fibre networks and satellite internet.",
      "I want to work on internet connectivity projects in rural areas."),
    S("Kevin", "Ochieng", "Bachelor of Business Science", "Fourth Year", "Consulting",
      ("Business Strategy", "Data Analysis"), ("Career Guidance", "Work-Life Balance"), "Flexible",
      "Business science student who enjoys analysing case studies.",
      "I want to work as a business analyst."),
    S("Lucy", "Wambugu", "BSc Statistics", "Third Year", "Data & Analytics",
      ("Data Analysis", "SQL", "Python"), ("Technical Skills", "Graduate Studies"), "Flexible",
      "Statistics student working on survey data analysis with Python and R.",
      "I want to become a data scientist working on social impact projects."),
    S("Abdullahi", "Hassan", "BSc Computer Networks and Cyber Security", "Second Year", "Cybersecurity",
      ("Networking", "Cybersecurity"), ("Technical Skills", "Career Guidance"), "Weekday Mornings",
      "Security student setting up firewalls and monitoring tools in a home lab.",
      "I want to work in a security operations centre."),
    S("Beatrice", "Muthoni", "Bachelor of Commerce", "Second Year", "Healthcare",
      ("Project Management",), ("Career Guidance", "Leadership Development"), "Flexible",
      "Commerce student interested in health insurance and hospital finance.",
      "I want to work in health insurance."),
    S("Isaac", "Rotich", "BSc Electrical and Electronic Engineering", "Third Year", "Energy & Utilities",
      ("Python", "Data Analysis"), ("Technical Skills", "Internships & Job Search"), "Weekday Mornings",
      "Engineering student learning about power grids and electric vehicles.",
      "I want to work on smart grid and electric mobility projects."),
    S("Halima", "Yusuf", "Bachelor of Education (Arts)", "Fourth Year", "Education & Research",
      ("Public Speaking", "Leadership"), ("Career Guidance", "Graduate Studies"), "Flexible",
      "Education student who leads a peer tutoring programme.",
      "I want to become a school leader and education policy researcher."),
)

# Ten general mentors, two in each industry without scenarios. Several have
# backgrounds close to the scenario students' interests (for example an
# analytics consultant or a health informatics engineer), so a ranking based
# on text alone may be drawn to them even though their industry differs.
EXTRA_MENTORS: tuple[MentorSpec, ...] = (
    M("Stephen", "Odhiambo", 11, "Telecommunications", ("Networking", "Cloud Computing"),
      ("Technical Skills", "Career Guidance"), "Weekends",
      "Radio access network engineer planning and optimising 4G and 5G base stations for a mobile operator.",
      "Teaching students how mobile networks are designed and how to start a network engineering career."),
    M("Irene", "Moraa", 9, "Telecommunications", ("Business Strategy", "Data Analysis", "Product Management"),
      ("Industry Insights", "CV & Interview Preparation"), "Weekday Evenings",
      "Product marketing manager who designs data bundles and consumer offers for a mobile network operator.",
      "Helping business students understand telecom product marketing and prepare for interviews."),
    M("Samuel", "Njenga", 11, "Consulting", ("Data Analysis", "Machine Learning", "Python"),
      ("Career Guidance", "Technical Skills", "Industry Insights"), "Flexible",
      "Analytics consultant who builds machine learning and data science solutions for consulting clients.",
      "Helping students who want to combine data science with consulting."),
    M("Lilian", "Wanjiru", 8, "Consulting", ("Business Strategy", "Project Management", "Public Speaking"),
      ("CV & Interview Preparation", "Career Guidance"), "Weekday Evenings",
      "Engagement manager at a strategy consulting firm advising governments and corporates on growth strategy.",
      "Preparing students for case interviews and the first years in consulting."),
    M("Rebecca", "Akoth", 9, "Healthcare", ("Web Development", "SQL", "Python"),
      ("Technical Skills", "Industry Insights"), "Weekends",
      "Health informatics engineer implementing electronic medical record systems and data exchange for hospitals.",
      "Teaching students how digital health systems and health data standards work."),
    M("Nancy", "Wairimu", 14, "Healthcare", ("Data Analysis", "Leadership"),
      ("Career Guidance", "Industry Insights", "Graduate Studies"), "Flexible",
      "Public health specialist who leads disease surveillance and health data programmes.",
      "Advice on public health careers and further study."),
    M("Gladys", "Moraa", 7, "Energy & Utilities", ("Python", "Data Analysis"),
      ("Technical Skills", "Internships & Job Search"), "Weekends",
      "Energy systems engineer using IoT monitoring and data analysis to manage remote solar installations.",
      "Helping engineering students find internships in renewable energy."),
    M("Kennedy", "Omollo", 11, "Energy & Utilities", ("Financial Analysis", "Business Strategy"),
      ("Industry Insights", "Career Guidance"), "Weekday Evenings",
      "Project finance manager structuring debt and equity for solar and wind power plants.",
      "Explaining energy project finance and financial modelling for power projects."),
    M("Fatuma", "Omar", 10, "Education & Research", ("Machine Learning", "Python", "Public Speaking"),
      ("Graduate Studies", "Career Guidance"), "Weekends",
      "University lecturer and researcher in machine learning who supervises master's and PhD students.",
      "Advising students on research careers, PhD applications and scholarships."),
    M("Lawrence", "Kioko", 9, "Education & Research", ("Product Management", "Web Development"),
      ("Entrepreneurship", "Industry Insights"), "Weekday Evenings",
      "EdTech product manager building a learning app used by secondary school students and teachers.",
      "Helping students turn classroom ideas into education technology products."),
)


def all_students() -> list[StudentSpec]:
    return [scenario.student for scenario in SCENARIOS] + list(EXTRA_STUDENTS)


def all_mentors() -> list[MentorSpec]:
    return [m for scenario in SCENARIOS for m in scenario.intended_mentors] + list(EXTRA_MENTORS)
