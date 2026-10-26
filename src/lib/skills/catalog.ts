export type SkillCategory =
  | "languages"
  | "frontend"
  | "backend"
  | "mobile"
  | "data"
  | "cloud"
  | "testing"
  | "design"
  | "product"
  | "business"
  | "soft"
  | "spoken";

export const CATEGORY_LABEL: Record<SkillCategory, string> = {
  languages: "Programming",
  frontend: "Frontend",
  backend: "Backend",
  mobile: "Mobile",
  data: "Data & AI",
  cloud: "Cloud & DevOps",
  testing: "Testing",
  design: "Design",
  product: "Product & delivery",
  business: "Business",
  soft: "Soft skills",
  spoken: "Languages",
};

export interface SkillDef {
  id: string;
  label: string;
  category: SkillCategory;
  /** Extra spellings, matched case-insensitively on word boundaries. Spaces also match hyphens. */
  aliases?: string[];
  /**
   * Case-sensitive patterns for words that are ambiguous in plain English
   * ("Go", "Excel", "Swift"). When present, the label itself is not matched
   * loosely — only the aliases and these patterns.
   */
  patterns?: RegExp[];
}

const s = (id: string, label: string, category: SkillCategory, aliases?: string[], patterns?: RegExp[]): SkillDef => ({
  id,
  label,
  category,
  aliases,
  patterns,
});

// A list position after these marks a tech list ("React, Go, Rust").
const LIST = String.raw`(?:^|[\s,(/|•·])`;
const LIST_END = String.raw`(?=\s*(?:[,/)|;.]|$|\band\b|\bor\b|\b(?:is|are|would be|preferred|experience|skills)\b))`;

export const SKILLS: SkillDef[] = [
  // Programming languages
  s("javascript", "JavaScript", "languages", ["js", "es6", "ecmascript", "vanilla js"]),
  s("typescript", "TypeScript", "languages", ["ts"]),
  s("python", "Python", "languages"),
  s("java", "Java", "languages"),
  s("kotlin", "Kotlin", "languages"),
  s("csharp", "C#", "languages", ["c sharp", "csharp"]),
  s("cpp", "C++", "languages", ["cpp"]),
  s("go", "Go", "languages", ["golang"], [new RegExp(`${LIST}Go${LIST_END}`), /\bGo (?:developer|engineer|programming|language)\b/]),
  s("rust", "Rust", "languages"),
  s("ruby", "Ruby", "languages"),
  s("php", "PHP", "languages"),
  s("swift", "Swift", "languages", ["swiftui"], [/\bSwift(?:UI)?\b/]),
  s("scala", "Scala", "languages"),
  s("dart", "Dart", "languages"),
  s("r", "R", "languages", ["rstudio", "r programming"], [new RegExp(`${LIST}R${LIST_END}`)]),
  s("sql", "SQL", "languages", ["t-sql", "pl/sql", "tsql"]),
  s("bash", "Shell scripting", "languages", ["bash", "shell scripting", "powershell"]),
  s("elixir", "Elixir", "languages"),

  // Frontend
  s("react", "React", "frontend", ["react.js", "reactjs"]),
  s("nextjs", "Next.js", "frontend", ["nextjs", "next js"]),
  s("vue", "Vue", "frontend", ["vue.js", "vuejs", "nuxt", "nuxt.js"]),
  s("angular", "Angular", "frontend", ["angularjs"]),
  s("svelte", "Svelte", "frontend", ["sveltekit"]),
  s("redux", "Redux", "frontend", ["redux toolkit"]),
  s("html", "HTML", "frontend", ["html5"]),
  s("css", "CSS", "frontend", ["css3", "sass", "scss"]),
  s("tailwind", "Tailwind CSS", "frontend", ["tailwind", "tailwindcss"]),
  s("webpack", "Build tooling", "frontend", ["webpack", "vite", "rollup", "esbuild", "babel"]),
  s("web-performance", "Web performance", "frontend", ["core web vitals", "performance optimisation", "performance optimization"]),
  s("accessibility", "Accessibility", "frontend", ["a11y", "wcag", "aria", "web accessibility"]),
  s("jquery", "jQuery", "frontend"),

  // Backend
  s("nodejs", "Node.js", "backend", ["node", "nodejs", "node js"]),
  s("express", "Express", "backend", ["express.js", "expressjs"]),
  s("nestjs", "NestJS", "backend", ["nest.js"]),
  s("django", "Django", "backend"),
  s("flask", "Flask", "backend"),
  s("fastapi", "FastAPI", "backend"),
  s("spring", "Spring Boot", "backend", ["spring boot", "spring framework"]),
  s("dotnet", ".NET", "backend", [".net", "dotnet", "asp.net", ".net core"]),
  s("rails", "Ruby on Rails", "backend", ["rails", "ror"]),
  s("laravel", "Laravel", "backend"),
  s("rest", "REST APIs", "backend", ["rest api", "rest apis", "restful", "rest services"]),
  s("graphql", "GraphQL", "backend", ["apollo"]),
  s("grpc", "gRPC", "backend"),
  s("microservices", "Microservices", "backend", ["microservice", "service-oriented architecture", "soa"]),
  s("postgres", "PostgreSQL", "backend", ["postgres", "postgresql"]),
  s("mysql", "MySQL", "backend", ["mariadb"]),
  s("mongodb", "MongoDB", "backend", ["mongo"]),
  s("redis", "Redis", "backend"),
  s("elasticsearch", "Elasticsearch", "backend", ["elastic search", "opensearch"]),
  s("kafka", "Kafka", "backend", ["apache kafka"]),
  s("rabbitmq", "RabbitMQ", "backend", ["message queues", "message queue"]),
  s("system-design", "System design", "backend", ["distributed systems", "scalable systems", "software architecture"]),
  s("security", "Security", "backend", ["cybersecurity", "cyber security", "owasp", "application security", "infosec", "security best practices"], []),
  s("oauth", "OAuth / SSO", "backend", ["oauth", "oauth2", "openid connect", "sso", "saml"]),

  // Mobile
  s("react-native", "React Native", "mobile"),
  s("flutter", "Flutter", "mobile"),
  s("ios", "iOS", "mobile"),
  s("android", "Android", "mobile"),

  // Data & AI
  s("machine-learning", "Machine learning", "data", ["ml", "machine-learning"]),
  s("deep-learning", "Deep learning", "data", ["neural networks"]),
  s("nlp", "NLP", "data", ["natural language processing"]),
  s("llm", "LLMs", "data", ["llm", "large language models", "generative ai", "genai", "prompt engineering"]),
  s("computer-vision", "Computer vision", "data"),
  s("tensorflow", "TensorFlow", "data", ["keras"]),
  s("pytorch", "PyTorch", "data"),
  s("pandas", "pandas", "data", ["numpy"]),
  s("scikit-learn", "scikit-learn", "data", ["sklearn", "scikit learn"]),
  s("spark", "Spark", "data", ["apache spark", "pyspark"]),
  s("airflow", "Airflow", "data", ["apache airflow"]),
  s("dbt", "dbt", "data"),
  s("snowflake", "Snowflake", "data"),
  s("bigquery", "BigQuery", "data", ["big query"]),
  s("etl", "ETL / data pipelines", "data", ["etl", "elt", "data pipelines", "data pipeline", "data engineering"]),
  s("data-modeling", "Data modelling", "data", ["data modeling", "data modelling", "data warehousing", "data warehouse"]),
  s("statistics", "Statistics", "data", ["statistical analysis", "statistical"]),
  s("ab-testing", "A/B testing", "data", ["a/b testing", "a/b tests", "experimentation", "split testing"]),
  s("data-analysis", "Data analysis", "data", ["data analytics", "analysing data", "analyzing data"]),
  s("data-viz", "Data visualisation", "data", ["data visualization", "data visualisation", "dashboards", "dashboarding"]),
  s("power-bi", "Power BI", "data", ["powerbi"]),
  s("tableau", "Tableau", "data"),
  s("looker", "Looker", "data", ["looker studio"]),
  s("google-analytics", "Google Analytics", "data", ["ga4"]),
  s("excel", "Excel", "data", ["microsoft excel", "ms excel", "vlookup", "pivot tables", "spreadsheets"], [/\bExcel\b(?! (?:in|at)\b)/]),

  // Cloud & DevOps
  s("aws", "AWS", "cloud", ["amazon web services", "ec2", "s3", "aws lambda"]),
  s("azure", "Azure", "cloud", ["microsoft azure"]),
  s("gcp", "Google Cloud", "cloud", ["gcp", "google cloud platform"]),
  s("docker", "Docker", "cloud", ["containerisation", "containerization"]),
  s("kubernetes", "Kubernetes", "cloud", ["k8s", "helm"]),
  s("terraform", "Terraform", "cloud", ["infrastructure as code", "iac", "pulumi", "cloudformation"]),
  s("cicd", "CI/CD", "cloud", ["ci/cd", "ci cd", "continuous integration", "continuous delivery", "continuous deployment"]),
  s("github-actions", "GitHub Actions", "cloud"),
  s("jenkins", "Jenkins", "cloud"),
  s("linux", "Linux", "cloud", ["unix"]),
  s("git", "Git", "cloud", ["github", "gitlab", "bitbucket", "version control"]),
  s("serverless", "Serverless", "cloud"),
  s("observability", "Monitoring & observability", "cloud", ["observability", "datadog", "grafana", "prometheus", "new relic", "sentry"]),
  s("sre", "SRE", "cloud", ["site reliability"]),

  // Testing
  s("unit-testing", "Unit testing", "testing", ["unit tests", "unit test", "automated testing", "test automation"]),
  s("tdd", "TDD", "testing", ["test-driven development", "test driven development"]),
  s("jest", "Jest", "testing", ["vitest"]),
  s("cypress", "Cypress", "testing"),
  s("playwright", "Playwright", "testing"),
  s("selenium", "Selenium", "testing"),
  s("qa", "QA", "testing", ["quality assurance", "manual testing"]),

  // Design
  s("figma", "Figma", "design"),
  s("sketch", "Sketch", "design", [], [/\bSketch\b(?! out\b)/]),
  s("adobe-xd", "Adobe XD", "design"),
  s("adobe-cc", "Adobe Creative Suite", "design", ["photoshop", "illustrator", "indesign", "adobe creative cloud", "creative suite"]),
  s("ux-research", "User research", "design", ["ux research", "user interviews", "usability testing"]),
  s("prototyping", "Prototyping", "design", ["prototypes", "wireframing", "wireframes"]),
  s("design-systems", "Design systems", "design", ["design system", "component library"]),
  s("ui-design", "UI design", "design", ["visual design", "interface design"]),
  s("ux-design", "UX design", "design", ["user experience", "interaction design"]),
  s("motion", "Motion design", "design", ["animation", "after effects"]),

  // Product & delivery
  s("agile", "Agile", "product", ["agile methodologies"]),
  s("scrum", "Scrum", "product", ["sprint planning", "scrum master"]),
  s("kanban", "Kanban", "product"),
  s("jira", "Jira", "product", ["confluence", "atlassian"]),
  s("product-management", "Product management", "product", ["product manager", "product ownership", "product owner"]),
  s("roadmapping", "Roadmapping", "product", ["roadmap", "roadmaps", "prioritisation", "prioritization"]),
  s("stakeholder-management", "Stakeholder management", "product", ["stakeholder management", "managing stakeholders", "stakeholders"]),
  s("project-management", "Project management", "product", ["project manager", "pmp", "prince2"]),
  s("requirements", "Requirements gathering", "product", ["business analysis", "user stories", "requirements gathering"]),
  s("analytics-tools", "Product analytics", "product", ["mixpanel", "amplitude", "product analytics"]),

  // Business
  s("microsoft-office", "Microsoft Office", "business", ["ms office", "office 365", "microsoft 365", "powerpoint"]),
  s("google-workspace", "Google Workspace", "business", ["g suite", "gsuite", "google sheets", "google docs"]),
  s("salesforce", "Salesforce", "business"),
  s("hubspot", "HubSpot", "business"),
  s("crm", "CRM", "business", ["crm systems"]),
  s("sap", "SAP", "business"),
  s("seo", "SEO", "business", ["search engine optimisation", "search engine optimization"]),
  s("sem", "Paid media", "business", ["sem", "ppc", "google ads", "paid social", "meta ads"]),
  s("content-marketing", "Content marketing", "business", ["content strategy", "content creation"]),
  s("copywriting", "Copywriting", "business", ["copy writing", "copywriter"]),
  s("social-media", "Social media", "business", ["social media marketing", "community management"]),
  s("email-marketing", "Email marketing", "business", ["mailchimp", "klaviyo"]),
  s("sales", "Sales", "business", ["b2b sales", "selling", "sales experience", "quota"]),
  s("business-development", "Business development", "business", ["lead generation", "prospecting"]),
  s("account-management", "Account management", "business", ["account manager", "client relationships", "customer success"]),
  s("customer-service", "Customer service", "business", ["customer support", "client service", "customer-facing"]),
  s("negotiation", "Negotiation", "business", ["negotiating"]),
  s("financial-modelling", "Financial modelling", "business", ["financial modeling", "financial modelling", "valuation"]),
  s("accounting", "Accounting", "business", ["bookkeeping", "ifrs", "gaap", "reconciliations", "reconciliation"]),
  s("budgeting", "Budgeting & forecasting", "business", ["budgeting", "forecasting", "budget management"]),
  s("recruitment", "Recruitment", "business", ["recruiting", "talent acquisition", "sourcing candidates"]),
  s("operations", "Operations", "business", ["operations management", "process improvement", "lean six sigma", "six sigma"], []),
  s("supply-chain", "Supply chain", "business", ["logistics", "procurement", "inventory management"]),
  s("compliance", "Compliance", "business", ["regulatory", "gdpr", "popia", "risk management"]),

  // Soft skills
  s("communication", "Communication", "soft", ["communication skills", "communicator", "communicate", "written and verbal"]),
  s("teamwork", "Teamwork", "soft", ["team player", "collaboration", "collaborative", "cross-functional", "cross functional"]),
  s("leadership", "Leadership", "soft", ["lead a team", "leading teams", "people management", "line management"]),
  s("mentoring", "Mentoring", "soft", ["mentor", "mentorship", "coaching"]),
  s("problem-solving", "Problem solving", "soft", ["problem-solving", "problem solver", "troubleshooting"]),
  s("attention-to-detail", "Attention to detail", "soft", ["detail-oriented", "detail oriented", "eye for detail", "meticulous"]),
  s("time-management", "Time management", "soft", ["organisational skills", "organizational skills", "multitasking", "multi-tasking", "deadlines"]),
  s("critical-thinking", "Critical thinking", "soft", ["analytical skills", "analytical thinking", "analytical mindset"]),
  s("ownership", "Ownership", "soft", ["self-starter", "self starter", "self-motivated", "proactive", "autonomy", "autonomous"]),
  s("adaptability", "Adaptability", "soft", ["adaptable", "fast-paced", "fast paced", "ambiguity"]),
  s("presentation", "Presenting", "soft", ["presentation skills", "public speaking", "presenting"]),
  s("customer-focus", "Customer focus", "soft", ["customer-centric", "customer centric", "user-centric", "empathy"]),

  // Spoken languages
  s("english", "English", "spoken"),
  s("german", "German", "spoken", ["deutsch"]),
  s("french", "French", "spoken"),
  s("spanish", "Spanish", "spoken"),
  s("portuguese", "Portuguese", "spoken"),
  s("dutch", "Dutch", "spoken"),
  s("italian", "Italian", "spoken"),
  s("mandarin", "Mandarin", "spoken", ["chinese"]),
  s("japanese", "Japanese", "spoken"),
  s("arabic", "Arabic", "spoken"),
  s("hindi", "Hindi", "spoken"),
  s("afrikaans", "Afrikaans", "spoken"),
  s("zulu", "isiZulu", "spoken", ["zulu"]),
  s("swahili", "Swahili", "spoken", ["kiswahili"]),
];
