export const WORK_TYPE_REGEX = /\b(remote|onsite|on-site|hybrid|anywhere|worldwide|global)(?:\s*\(([^)]{1,40})\))?/gi;
export const URL_REGEX = /(?:https?:\/\/|www\.)[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;
export const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;


export const COUNTRIES_AND_REGIONS = [
    // Regions & Abbreviations
    "US", "USA", "United States", "UK", "United Kingdom", "EU", "Europe",
    "LATAM", "EMEA", "APAC", "North America", "South America", "Asia", "Africa",

    // Common Tech Hub Countries
    "Canada", "Germany", "France", "Spain", "Italy", "Netherlands", "Sweden",
    "Switzerland", "Australia", "New Zealand", "India", "Brazil", "Argentina",
    "Mexico", "Japan", "Singapore", "Ireland", "Poland", "Romania", "Ukraine",
    "Portugal", "Israel", "UAE", "South Africa", "China", "South Korea",
    "Taiwan", "Philippines", "Vietnam", "Thailand", "Malaysia", "Indonesia",
    "Colombia", "Chile", "Peru", "Uruguay", "Turkey", "Saudi Arabia", "Austria",
    "Belgium", "Denmark", "Finland", "Norway", "Greece", "Czech Republic", "Hungary",
    "Estonia", "Latvia", "Lithuania",

    // Popular European Cities
    "London", "Berlin", "Paris", "Amsterdam", "Dublin", "Madrid", "Barcelona",
    "Munich", "Stockholm", "Copenhagen", "Zurich", "Geneva", "Vienna", "Warsaw",
    "Prague", "Lisbon", "Milan", "Rome", "Oslo", "Helsinki", "Brussels", "Budapest",
    "Bucharest", "Tallinn", "Athens", "Edinburgh", "Krakow", "Sofia", "Riga"
];

// Escape spaces in names and build the regex string. We use 'gi' for global and case-insensitive.
export const COUNTRY_REGEX = new RegExp(`\\b(${COUNTRIES_AND_REGIONS.join('|')})\\b`, 'gi');

export const US_TECH_CITIES = [
    // California
    "San Francisco", "SF", "Bay Area", "Silicon Valley",
    "San Jose", "Oakland", "Berkeley", "Palo Alto", "Mountain View",
    "Sunnyvale", "Santa Clara", "Cupertino", "Menlo Park", "Redwood City",
    "Los Angeles", "LA", "Santa Monica", "Venice", "Culver City",
    "Irvine", "San Diego", "La Jolla", "Sacramento",
    "Pasadena", "Long Beach", "Burbank", "El Segundo",

    // Pacific Northwest
    "Seattle", "Bellevue", "Redmond", "Kirkland", "Tacoma",
    "Portland",

    // Mountain / Southwest
    "Denver", "Boulder", "Colorado Springs",
    "Salt Lake City", "SLC", "Provo",
    "Phoenix", "Scottsdale", "Tempe", "Tucson",
    "Las Vegas", "Reno", "Albuquerque",

    // Texas
    "Austin", "Dallas", "Houston", "San Antonio",
    "Fort Worth", "Plano", "Round Rock", "Frisco",

    // Midwest
    "Chicago", "Detroit", "Minneapolis", "Columbus",
    "Cleveland", "Cincinnati", "Indianapolis", "Milwaukee",
    "Kansas City", "St. Louis", "Omaha",

    // Southeast
    "Atlanta", "Miami", "Orlando", "Tampa",
    "Jacksonville", "Charlotte", "Raleigh", "Durham",
    "Research Triangle", "Nashville", "Memphis",
    "New Orleans", "Louisville", "Richmond",

    // Northeast
    "New York", "New York City", "NYC",
    "Boston", "Cambridge", "Philadelphia", "Philly",
    "Washington DC", "Washington D.C.", "DC", "Arlington",
    "Pittsburgh", "Baltimore", "Providence", "Hartford",
    "Newark", "Jersey City",

    // Northwest / Other
    "Boise", "Spokane", "Anchorage", "Honolulu"
];

export const US_CITY_REGEX = new RegExp(`\\b(${US_TECH_CITIES.join('|')})\\b`, 'gi');

export const TECH_SKILLS = [
    // Languages
    "JavaScript", "TypeScript", "Python", "Java", "Kotlin", "Swift",
    "C", "C\\+\\+", "C#", "Rust", "Go", "Ruby", "PHP", "Scala", "Dart",
    "Elixir", "Erlang", "Haskell", "Clojure", "Lua", "R", "Julia",
    "MATLAB", "Perl", "Shell", "Bash", "PowerShell", "Groovy", "COBOL",
    "Fortran", "Assembly", "Objective-C", "F#", "OCaml", "Nim", "Zig",
    "Solidity", "Move", "Cairo",

    // Frontend
    "React", "Next.js", "Vue", "Nuxt.js", "Angular", "Svelte", "SvelteKit",
    "Astro", "Remix", "Vite", "Webpack", "Parcel", "Rollup",
    "HTML", "CSS", "SASS", "SCSS", "Less", "Tailwind", "TailwindCSS",
    "Bootstrap", "Material UI", "MUI", "Chakra UI", "Shadcn", "Radix UI",
    "Storybook", "Figma", "Three.js", "WebGL", "WebAssembly", "WASM",

    // Backend & Runtimes
    "Node.js", "Express", "Fastify", "NestJS", "Hono", "Koa",
    "Django", "FastAPI", "Flask", "SQLAlchemy",
    "Spring", "Spring Boot", "Quarkus", "Micronaut",
    "Rails", "Sinatra", "Laravel", "Symfony", "CodeIgniter",
    "ASP.NET", ".NET", "Blazor", "Entity Framework",
    "Gin", "Fiber", "Echo",
    "Phoenix", "Ecto",
    "GraphQL", "REST", "gRPC", "tRPC", "WebSockets",

    // Databases
    "PostgreSQL", "Postgres", "MySQL", "MariaDB", "SQLite",
    "MongoDB", "Mongoose", "DynamoDB", "Cassandra", "CouchDB",
    "Redis", "Memcached", "Elasticsearch", "OpenSearch",
    "Supabase", "Firebase", "PlanetScale", "CockroachDB", "Fauna",
    "Prisma", "Drizzle", "TypeORM", "Sequelize",
    "InfluxDB", "TimescaleDB", "ClickHouse", "Snowflake", "BigQuery",

    // Cloud & Infrastructure
    "AWS", "GCP", "Azure", "Vercel", "Netlify", "Cloudflare",
    "Docker", "Kubernetes", "K8s", "Helm", "Terraform", "Ansible",
    "Pulumi", "CDK", "CloudFormation",
    "EC2", "S3", "Lambda", "ECS", "EKS", "RDS", "SQS", "SNS",
    "Nginx", "Caddy", "HAProxy", "Traefik",

    // CI/CD & DevOps
    "GitHub Actions", "GitLab CI", "CircleCI", "Jenkins", "Travis CI",
    "ArgoCD", "Flux", "Spinnaker",
    "Git", "GitHub", "GitLab", "Bitbucket",

    // AI / ML
    "TensorFlow", "PyTorch", "Keras", "scikit-learn", "OpenCV",
    "Pandas", "NumPy", "SciPy", "Hugging Face", "LangChain",
    "LlamaIndex", "OpenAI", "Anthropic", "Ollama",
    "CUDA", "JAX", "XGBoost", "LightGBM",

    // Mobile
    "React Native", "Flutter", "Ionic", "Expo", "Capacitor",
    "Android", "iOS", "SwiftUI", "Jetpack Compose",

    // Testing
    "Jest", "Vitest", "Mocha", "Cypress", "Playwright", "Puppeteer",
    "Selenium", "JUnit", "PyTest", "RSpec", "Testing Library",

    // Message Queues & Streaming
    "Kafka", "RabbitMQ", "NATS", "Pulsar", "ActiveMQ", "ZeroMQ",

    // Monitoring & Observability
    "Datadog", "Grafana", "Prometheus", "Sentry", "New Relic",
    "Splunk", "OpenTelemetry", "Jaeger", "Loki",

    // Other Tools & Protocols
    "Linux", "Unix", "macOS", "Windows",
    "TCP/IP", "HTTP", "HTTPS", "OAuth", "JWT", "OpenID",
    "Microservices", "Serverless", "Event-Driven", "CQRS", "DDD",
    "Agile", "Scrum", "Kanban", "Jira", "Confluence"
];

// Build regex — note C++ and C# are pre-escaped in the array
export const TECH_SKILLS_REGEX = new RegExp(`(?<![\\w.])(${TECH_SKILLS.join('|')})(?![\\w.])`, 'gi');

export const SENIORITY_LEVELS = [
    // Junior variants
    "Junior", "Jr", "Jr.", "Entry-Level", "Entry Level", "Associate",
    "Graduate", "Grad", "Trainee", "Apprentice", "Intern", "Internship",

    // Mid-level variants
    "Mid-Level", "Mid Level", "Mid", "Intermediate",

    // Senior variants
    "Senior", "Sr", "Sr.", "Experienced",

    // Lead / Staff
    "Lead", "Tech Lead", "Team Lead",
    "Staff", "Staff Engineer",

    // Principal / Architect
    "Principal", "Architect", "Solutions Architect", "Enterprise Architect",

    // Management
    "Manager", "Engineering Manager", "EM",
    "Director", "VP", "Vice President",
    "Head of Engineering", "CTO", "Chief Technology Officer",

    // Individual contributor levels (FAANG-style)
    "IC3", "IC4", "IC5", "IC6",
    "L3", "L4", "L5", "L6", "L7", "L8",
    "E3", "E4", "E5", "E6", "E7",
];

// Pattern to match "5+ years", "3+ YOE", "10+ yrs of experience"
const YEARS_OF_EXPERIENCE_PATTERN = "\\d+\\+?\\s*(?:years?|yrs?|yoe)(?:\\s+of\\s+experience)?";

export const SENIORITY_REGEX = new RegExp(`\\b(${SENIORITY_LEVELS.join('|')}|${YEARS_OF_EXPERIENCE_PATTERN})\\b`, 'gi');

/**
 * Matches phrases that indicate visa sponsorship availability (or lack thereof).
 * Captures both positive ("visa sponsorship available") and negative ("no sponsorship") signals.
 * Use the named group 'signal' to determine if it's a positive or negative mention.
 */
export const VISA_SPONSORSHIP_REGEX =
    /\b(?<signal>no\s+)?(?:visa\s+sponsorship|sponsorship\s+available|sponsor(?:s|ed|ing)?\s+(?:visa|work\s+visa|h[\-\s]?1b|h[\-\s]?1|green\s+card|work\s+permit)|work\s+(?:visa|permit)\s+(?:provided|sponsored|available)|h[\-\s]?1b\s+(?:transfer|sponsorship|sponsor)|immigration\s+support|relocation\s+(?:package|assistance|support)|open\s+to\s+(?:visa|sponsorship))\b/gi;

/**
 * Matches salary or compensation ranges in job postings.
 * Supports: $120k, €80,000, £50k-£70k, $100k-$150k/yr, $50/hr, ¥15M, etc.
 *
 * Named capture groups:
 *  - currency: the currency symbol ($, €, £, ¥, ₹, CHF, CAD, AUD, SGD, SEK, DKK, NOK)
 *  - min:      the lower bound number
 *  - max:      the upper bound number (if a range)
 *  - mult:     optional multiplier suffix (k, m)
 *  - period:   optional period (yr, year, mo, month, hr, hour)
 */
export const SALARY_REGEX =
    /(?<currency>\$|€|£|¥|₹|CHF|CAD|AUD|SGD|SEK|DKK|NOK)\s*(?<min>\d{1,3}(?:,\d{3})*(?:\.\d+)?)(?<mult>[km])?(?:\s*[-–to]+\s*(?:\k<currency>)?\s*(?<max>\d{1,3}(?:,\d{3})*(?:\.\d+)?)(?:\k<mult>|(?<mult2>[km]))?)?(?:\s*\/?\s*(?<period>yr|year|yearly|annually|mo|month|monthly|hr|hour|hourly))?/gi;


export const EMPLOYMENT_TYPE_REGEX =
    /\b(full[\s-]?time|part[\s-]?time|contract(?:or)?|freelance|temporary|temp|fixed[\s-]?term|per[\s-]?diem|casual|seasonal|internship|co[\s-]?op)\b/gi;

// ---------------------------------------------------------------------------
// Job Role Detection
// ---------------------------------------------------------------------------

/**
 * Suffix words that reliably indicate a job role when preceded by qualifiers.
 * Used to build a broad catch-all pattern so we don't need to enumerate every
 * possible "<Qualifier> Engineer" combination.
 */
const ROLE_SUFFIX_WORDS = [
    "engineer", "developer", "programmer",
    "architect", "designer", "manager",
    "scientist", "analyst", "researcher",
    "lead", "director",
    "writer", "advocate", "evangelist",
    "specialist", "consultant", "coordinator",
    "strategist", "administrator", "operator",
    "technician", "editor", "officer",
];

/**
 * Two-tier job role patterns:
 *
 * Tier 1 – Specific shorthand / stack labels that don't end with a standard
 *          role-suffix word (e.g. "full-stack", "SRE", "devrel").
 *
 * Tier 2 – Broad catch-all: 0-4 optional qualifier words followed by any
 *          role-suffix word.  Handles the long tail of titles like
 *          "Founding Engineer", "BDR Engineer", "AI Operations Lead",
 *          "Performance Marketing Manager", "Compiler Engineer", etc.
 */
const JOB_ROLE_PATTERNS = [
    // ── Tier 1: specific shorthand roles ────────────────────────────────
    // Stack descriptors (these imply an engineering role on their own)
    "full[\\s-]?stack", "front[\\s-]?end", "back[\\s-]?end",

    // Acronym & short-form roles
    "sre", "devrel", "pm", "dba",
    "cybersecurity",

    // Leadership titles with "of" (Head of Engineering, VP of Product, etc.)
    "head\\s+of\\s+\\w+(?:\\s+\\w+)?",
    "vp\\s+(?:of\\s+)?\\w+(?:\\s+\\w+)?",

    // ── Tier 2: broad <qualifiers?> + <role suffix> ─────────────────────
    // Matches 0-4 qualifier words (letters, digits, +, #) separated by
    // whitespace, /, &, or - then a role suffix word.
    // Examples: "Engineer", "Software Engineer", "Senior Backend Developer",
    //           "AI/ML Research Scientist", "Founding Engineer"
    // Does not allow commas or periods to prevent matching whole sentences.
    `(?:[a-z][a-z0-9+#]*(?:[\\s/&\\-]+[a-z][a-z0-9+#]*){0,4}\\s+)?(?:${ROLE_SUFFIX_WORDS.join("|")})`,
];

export const JOB_ROLE_REGEX = new RegExp(`\\b(${JOB_ROLE_PATTERNS.join("|")})\\b`, "gi");
