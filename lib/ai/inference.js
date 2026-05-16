import { VALID_CATEGORIES } from './schema.js';

// ─── Technology → implied skills ─────────────────────────────────────────────
// Each entry: { implies: string[], category: string, minProficiency?: string }
// minProficiency = the inferred skill's proficiency floor (defaults to source skill's proficiency)

const TECH_IMPLIES = {
  // ── Frontend frameworks
  'Next.js':          { implies: ['React', 'JavaScript', 'SSR', 'Static Site Generation'],   category: 'Frontend' },
  'Nuxt.js':          { implies: ['Vue.js', 'JavaScript', 'SSR'],                             category: 'Frontend' },
  'Gatsby':           { implies: ['React', 'GraphQL', 'JavaScript', 'Static Site Generation'],category: 'Frontend' },
  'Remix':            { implies: ['React', 'JavaScript', 'SSR'],                              category: 'Frontend' },
  'Astro':            { implies: ['JavaScript', 'Static Site Generation'],                    category: 'Frontend' },
  'React':            { implies: ['JavaScript', 'HTML', 'CSS', 'Component Architecture'],     category: 'Frontend' },
  'Vue.js':           { implies: ['JavaScript', 'HTML', 'CSS', 'Component Architecture'],     category: 'Frontend' },
  'Angular':          { implies: ['TypeScript', 'JavaScript', 'RxJS', 'HTML', 'CSS'],         category: 'Frontend' },
  'Svelte':           { implies: ['JavaScript', 'HTML', 'CSS'],                               category: 'Frontend' },
  'React Query':      { implies: ['React', 'REST APIs', 'Async JavaScript'],                  category: 'Frontend' },
  'Redux':            { implies: ['React', 'JavaScript', 'State Management'],                 category: 'Frontend' },
  'Tailwind CSS':     { implies: ['CSS', 'HTML', 'Responsive Design'],                        category: 'Frontend' },
  'Styled Components':{ implies: ['React', 'CSS', 'JavaScript'],                              category: 'Frontend' },
  'Webpack':          { implies: ['JavaScript', 'Node.js', 'Build Tools'],                    category: 'Frontend' },
  'Vite':             { implies: ['JavaScript', 'Build Tools', 'ES Modules'],                 category: 'Frontend' },
  'Jest':             { implies: ['JavaScript', 'Unit Testing', 'TDD'],                       category: 'Frontend' },
  'Cypress':          { implies: ['JavaScript', 'E2E Testing', 'Test Automation'],            category: 'Frontend' },
  'Playwright':       { implies: ['JavaScript', 'E2E Testing', 'Test Automation'],            category: 'Frontend' },
  'TypeScript':       { implies: ['JavaScript', 'Static Typing', 'OOP'],                      category: 'Backend' },

  // ── Backend frameworks
  'Express.js':       { implies: ['Node.js', 'REST APIs', 'HTTP', 'Middleware'],              category: 'Backend' },
  'Fastify':          { implies: ['Node.js', 'REST APIs', 'HTTP'],                            category: 'Backend' },
  'Nest.js':          { implies: ['Node.js', 'TypeScript', 'REST APIs', 'Dependency Injection'], category: 'Backend' },
  'Django':           { implies: ['Python', 'REST APIs', 'ORM', 'MVC'],                       category: 'Backend' },
  'FastAPI':          { implies: ['Python', 'REST APIs', 'Async Programming', 'OpenAPI'],     category: 'Backend' },
  'Flask':            { implies: ['Python', 'REST APIs', 'HTTP'],                             category: 'Backend' },
  'Spring Boot':      { implies: ['Java', 'REST APIs', 'Microservices', 'Dependency Injection'], category: 'Backend' },
  'Laravel':          { implies: ['PHP', 'REST APIs', 'MVC', 'Eloquent ORM'],                 category: 'Backend' },
  'Rails':            { implies: ['Ruby', 'REST APIs', 'MVC', 'ActiveRecord'],                category: 'Backend' },
  'Ruby on Rails':    { implies: ['Ruby', 'REST APIs', 'MVC', 'ActiveRecord'],                category: 'Backend' },
  'Gin':              { implies: ['Go', 'REST APIs', 'HTTP'],                                  category: 'Backend' },
  'Fiber':            { implies: ['Go', 'REST APIs', 'HTTP'],                                  category: 'Backend' },
  'GraphQL':          { implies: ['API Design', 'REST APIs'],                                  category: 'Backend' },
  'Apollo Server':    { implies: ['GraphQL', 'Node.js', 'API Design'],                        category: 'Backend' },
  'gRPC':             { implies: ['Microservices', 'Protocol Buffers', 'Distributed Systems'], category: 'Backend' },
  'Prisma':           { implies: ['Database Design', 'ORM', 'TypeScript'],                    category: 'Database' },
  'Sequelize':        { implies: ['Node.js', 'ORM', 'SQL'],                                   category: 'Database' },
  'SQLAlchemy':       { implies: ['Python', 'ORM', 'SQL'],                                    category: 'Database' },

  // ── Databases
  'PostgreSQL':       { implies: ['SQL', 'Database Design', 'RDBMS'],                         category: 'Database' },
  'MySQL':            { implies: ['SQL', 'Database Design', 'RDBMS'],                         category: 'Database' },
  'MongoDB':          { implies: ['NoSQL', 'Database Design', 'JSON'],                        category: 'Database' },
  'Redis':            { implies: ['Caching', 'In-memory Database', 'Performance Optimization'], category: 'Database' },
  'Elasticsearch':    { implies: ['Search Engines', 'NoSQL', 'Log Analysis'],                 category: 'Database' },
  'Cassandra':        { implies: ['NoSQL', 'Distributed Systems', 'Database Design'],         category: 'Database' },
  'DynamoDB':         { implies: ['NoSQL', 'AWS', 'Serverless Architecture'],                 category: 'Database' },
  'Firestore':        { implies: ['NoSQL', 'Firebase', 'Google Cloud'],                       category: 'Database' },
  'CockroachDB':      { implies: ['SQL', 'Distributed Systems', 'Database Design'],           category: 'Database' },

  // ── Cloud & serverless
  'AWS Lambda':       { implies: ['Serverless Architecture', 'AWS', 'Cloud Computing', 'Event-driven Architecture'], category: 'Cloud' },
  'AWS':              { implies: ['Cloud Computing', 'IAM', 'Infrastructure'],                category: 'Cloud' },
  'Google Cloud':     { implies: ['Cloud Computing', 'Infrastructure'],                       category: 'Cloud' },
  'GCP':              { implies: ['Cloud Computing', 'Google Cloud', 'Infrastructure'],       category: 'Cloud' },
  'Azure':            { implies: ['Cloud Computing', 'Microsoft', 'Infrastructure'],          category: 'Cloud' },
  'Vercel':           { implies: ['Serverless Architecture', 'CI/CD', 'JavaScript'],          category: 'Cloud' },
  'Netlify':          { implies: ['Serverless Architecture', 'CI/CD', 'JAMstack'],            category: 'Cloud' },
  'Cloudflare Workers':{ implies: ['Serverless Architecture', 'Edge Computing', 'JavaScript'], category: 'Cloud' },
  'S3':               { implies: ['AWS', 'Object Storage', 'Cloud Computing'],                category: 'Cloud' },
  'CloudFront':       { implies: ['AWS', 'CDN', 'Cloud Computing'],                           category: 'Cloud' },
  'EC2':              { implies: ['AWS', 'Cloud Computing', 'Linux'],                         category: 'Cloud' },
  'ECS':              { implies: ['AWS', 'Docker', 'Container Orchestration'],                category: 'Cloud' },
  'EKS':              { implies: ['AWS', 'Kubernetes', 'Container Orchestration'],            category: 'Cloud' },

  // ── DevOps
  'Docker':           { implies: ['Containerization', 'DevOps', 'Linux'],                     category: 'DevOps' },
  'Kubernetes':       { implies: ['Docker', 'Container Orchestration', 'DevOps', 'Cloud Computing'], category: 'DevOps' },
  'Terraform':        { implies: ['Infrastructure as Code', 'DevOps', 'Cloud Computing'],    category: 'DevOps' },
  'Pulumi':           { implies: ['Infrastructure as Code', 'DevOps', 'Cloud Computing'],    category: 'DevOps' },
  'Ansible':          { implies: ['Configuration Management', 'DevOps', 'Infrastructure as Code'], category: 'DevOps' },
  'Jenkins':          { implies: ['CI/CD', 'DevOps', 'Build Automation'],                     category: 'DevOps' },
  'GitHub Actions':   { implies: ['CI/CD', 'DevOps', 'Git', 'Build Automation'],              category: 'DevOps' },
  'GitLab CI':        { implies: ['CI/CD', 'DevOps', 'Git', 'Build Automation'],              category: 'DevOps' },
  'CircleCI':         { implies: ['CI/CD', 'DevOps', 'Build Automation'],                     category: 'DevOps' },
  'Helm':             { implies: ['Kubernetes', 'DevOps', 'Infrastructure as Code'],           category: 'DevOps' },
  'Prometheus':       { implies: ['Monitoring', 'DevOps', 'Observability'],                   category: 'DevOps' },
  'Grafana':          { implies: ['Monitoring', 'DevOps', 'Observability', 'Data Visualization'], category: 'DevOps' },
  'Datadog':          { implies: ['Monitoring', 'DevOps', 'Observability', 'APM'],            category: 'DevOps' },
  'Apache Kafka':     { implies: ['Message Queues', 'Event Streaming', 'Distributed Systems'], category: 'DevOps' },
  'RabbitMQ':         { implies: ['Message Queues', 'Async Processing', 'Distributed Systems'], category: 'DevOps' },
  'SQS':              { implies: ['Message Queues', 'AWS', 'Async Processing'],               category: 'DevOps' },

  // ── Mobile
  'React Native':     { implies: ['React', 'Mobile Development', 'JavaScript', 'Cross-platform'], category: 'Mobile' },
  'Flutter':          { implies: ['Dart', 'Mobile Development', 'Cross-platform'],            category: 'Mobile' },
  'Swift':            { implies: ['iOS Development', 'Xcode', 'Mobile Development'],          category: 'Mobile' },
  'Kotlin':           { implies: ['Android Development', 'Java', 'Mobile Development'],       category: 'Mobile' },
  'Expo':             { implies: ['React Native', 'Mobile Development', 'JavaScript'],        category: 'Mobile' },

  // ── AI/ML
  'TensorFlow':       { implies: ['Python', 'Deep Learning', 'Machine Learning', 'Neural Networks'], category: 'AI/ML' },
  'PyTorch':          { implies: ['Python', 'Deep Learning', 'Machine Learning', 'Neural Networks'], category: 'AI/ML' },
  'scikit-learn':     { implies: ['Python', 'Machine Learning', 'Data Science', 'Statistics'], category: 'AI/ML' },
  'pandas':           { implies: ['Python', 'Data Analysis', 'Data Science'],                  category: 'AI/ML' },
  'NumPy':            { implies: ['Python', 'Data Science', 'Mathematics'],                    category: 'AI/ML' },
  'Hugging Face':     { implies: ['Python', 'NLP', 'Deep Learning', 'Machine Learning'],      category: 'AI/ML' },
  'LangChain':        { implies: ['Python', 'LLMs', 'AI Engineering', 'NLP'],                 category: 'AI/ML' },
  'OpenAI API':       { implies: ['AI Engineering', 'LLMs', 'API Integration', 'Python'],     category: 'AI/ML' },
  'Apache Spark':     { implies: ['Big Data', 'Distributed Computing', 'Python', 'Scala'],    category: 'AI/ML' },
  'Databricks':       { implies: ['Apache Spark', 'Big Data', 'MLOps', 'Python'],             category: 'AI/ML' },
};

// ─── Skill name → category ────────────────────────────────────────────────────

const SKILL_CATEGORY_MAP = {
  // Frontend
  'JavaScript': 'Frontend', 'TypeScript': 'Backend', 'HTML': 'Frontend', 'CSS': 'Frontend',
  'React': 'Frontend', 'Vue.js': 'Frontend', 'Angular': 'Frontend', 'Svelte': 'Frontend',
  'Next.js': 'Frontend', 'Nuxt.js': 'Frontend', 'Sass': 'Frontend', 'LESS': 'Frontend',
  'Tailwind CSS': 'Frontend', 'Bootstrap': 'Frontend', 'Material UI': 'Frontend',
  'Redux': 'Frontend', 'MobX': 'Frontend', 'Zustand': 'Frontend',
  'Webpack': 'Frontend', 'Vite': 'Frontend', 'Babel': 'Frontend',
  'Jest': 'Frontend', 'Cypress': 'Frontend', 'Playwright': 'Frontend',

  // Backend
  'Node.js': 'Backend', 'Python': 'Backend', 'Java': 'Backend', 'Go': 'Backend',
  'Ruby': 'Backend', 'PHP': 'Backend', 'C#': 'Backend', '.NET': 'Backend',
  'Rust': 'Backend', 'Kotlin': 'Backend', 'Scala': 'Backend', 'Elixir': 'Backend',
  'Express.js': 'Backend', 'FastAPI': 'Backend', 'Django': 'Backend', 'Flask': 'Backend',
  'Spring Boot': 'Backend', 'NestJS': 'Backend', 'Nest.js': 'Backend',
  'REST APIs': 'Backend', 'GraphQL': 'Backend', 'gRPC': 'Backend',
  'Microservices': 'Backend', 'Serverless Architecture': 'Backend',
  'OAuth': 'Backend', 'JWT': 'Backend', 'WebSockets': 'Backend',
  'Async Programming': 'Backend', 'API Design': 'Backend',

  // Database
  'PostgreSQL': 'Database', 'MySQL': 'Database', 'SQLite': 'Database',
  'MongoDB': 'Database', 'Redis': 'Database', 'Elasticsearch': 'Database',
  'DynamoDB': 'Database', 'Firestore': 'Database', 'Cassandra': 'Database',
  'SQL': 'Database', 'NoSQL': 'Database', 'ORM': 'Database', 'Database Design': 'Database',

  // Cloud
  'AWS': 'Cloud', 'GCP': 'Cloud', 'Azure': 'Cloud', 'Google Cloud': 'Cloud',
  'Cloud Computing': 'Cloud', 'Serverless': 'Cloud',
  'S3': 'Cloud', 'EC2': 'Cloud', 'Lambda': 'Cloud',

  // DevOps
  'Docker': 'DevOps', 'Kubernetes': 'DevOps', 'Terraform': 'DevOps',
  'CI/CD': 'DevOps', 'Git': 'DevOps', 'Linux': 'DevOps',
  'Jenkins': 'DevOps', 'GitHub Actions': 'DevOps',
  'Monitoring': 'DevOps', 'Observability': 'DevOps', 'Infrastructure as Code': 'DevOps',

  // Mobile
  'React Native': 'Mobile', 'Flutter': 'Mobile', 'Swift': 'Mobile',
  'Android Development': 'Mobile', 'iOS Development': 'Mobile',

  // AI/ML
  'Machine Learning': 'AI/ML', 'Deep Learning': 'AI/ML', 'NLP': 'AI/ML',
  'TensorFlow': 'AI/ML', 'PyTorch': 'AI/ML', 'scikit-learn': 'AI/ML',
  'Data Science': 'AI/ML', 'pandas': 'AI/ML', 'NumPy': 'AI/ML',
  'Big Data': 'AI/ML', 'Apache Spark': 'AI/ML', 'MLOps': 'AI/ML',
  'LLMs': 'AI/ML', 'AI Engineering': 'AI/ML',
};

// ─── Seniority → implied soft skills ─────────────────────────────────────────

const SENIORITY_IMPLIES = {
  lead:      ['Technical Leadership', 'Code Review', 'Mentoring', 'Architecture Design'],
  principal: ['System Design', 'Technical Strategy', 'Cross-team Collaboration', 'Architecture Design'],
  executive: ['Engineering Leadership', 'Technical Strategy', 'Team Building', 'Roadmap Planning'],
};

// ─── Inference engine ─────────────────────────────────────────────────────────

/**
 * Returns the canonical category for a skill name.
 */
export function categorizeSkill(name) {
  const exact = SKILL_CATEGORY_MAP[name];
  if (exact) return exact;
  // Fuzzy match — check if any category key is a substring
  const lower = name.toLowerCase();
  for (const [key, cat] of Object.entries(SKILL_CATEGORY_MAP)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) return cat;
  }
  return 'Other';
}

/**
 * Given the explicit skill list, returns additional inferred skills.
 * Each inferred skill is marked with inferred: true.
 * Will not add a skill that already exists (case-insensitive).
 */
export function inferRelatedSkills(explicitSkills) {
  const existingNames = new Set(explicitSkills.map((s) => s.name.toLowerCase()));
  const inferred = [];

  for (const skill of explicitSkills) {
    const rule = TECH_IMPLIES[skill.name];
    if (!rule) continue;

    for (const impliedName of rule.implies) {
      if (existingNames.has(impliedName.toLowerCase())) continue;
      existingNames.add(impliedName.toLowerCase());

      inferred.push({
        name: impliedName,
        category: SKILL_CATEGORY_MAP[impliedName] ?? rule.category ?? 'Other',
        // Inferred skills cap at one level below the source skill
        proficiency: oneLevelBelow(skill.proficiency),
        yearsOfExperience: 0,
        inferred: true,
      });
    }
  }

  return inferred;
}

/**
 * Add leadership/soft skills implied by seniority level.
 */
export function inferSenioritySkills(seniority, explicitSkills) {
  const rule = SENIORITY_IMPLIES[seniority];
  if (!rule) return [];

  const existingNames = new Set(explicitSkills.map((s) => s.name.toLowerCase()));
  return rule
    .filter((name) => !existingNames.has(name.toLowerCase()))
    .map((name) => ({
      name,
      category: 'Management',
      proficiency: seniority === 'executive' ? 'expert' : 'advanced',
      yearsOfExperience: 0,
      inferred: true,
    }));
}

/**
 * Fill in missing category fields on existing skills.
 */
export function fillMissingCategories(skills) {
  return skills.map((s) => ({
    ...s,
    category: s.category === 'Other' || !s.category ? categorizeSkill(s.name) : s.category,
  }));
}

/**
 * Deduplicate skill list — keep explicit over inferred, higher proficiency wins.
 */
export function deduplicateSkills(skills) {
  const map = new Map(); // name.lower → skill
  for (const s of skills) {
    const key = s.name.toLowerCase();
    const existing = map.get(key);
    if (!existing) {
      map.set(key, s);
    } else {
      // Prefer: explicit > inferred; higher proficiency > lower
      const existingPct = PROFICIENCY_ORDER.indexOf(existing.proficiency);
      const newPct = PROFICIENCY_ORDER.indexOf(s.proficiency);
      if (!s.inferred && existing.inferred) {
        map.set(key, s); // explicit always wins
      } else if (newPct > existingPct) {
        map.set(key, { ...s, inferred: existing.inferred && s.inferred });
      }
    }
  }
  return Array.from(map.values());
}

const PROFICIENCY_ORDER = ['beginner', 'intermediate', 'advanced', 'expert'];

function oneLevelBelow(proficiency) {
  const idx = PROFICIENCY_ORDER.indexOf(proficiency);
  if (idx <= 0) return 'beginner';
  return PROFICIENCY_ORDER[idx - 1];
}

/**
 * Main enrichment entry point.
 * Takes validated resume data and returns it enriched with inferred skills.
 */
export function enrichWithInference(data) {
  const explicit = data.skills ?? [];

  // 1. Fill missing categories on explicit skills
  const withCategories = fillMissingCategories(explicit);

  // 2. Infer related technologies
  const techInferred = inferRelatedSkills(withCategories);

  // 3. Infer soft skills from seniority
  const seniorityInferred = inferSenioritySkills(data.seniority, [...withCategories, ...techInferred]);

  // 4. Merge and deduplicate
  const allSkills = deduplicateSkills([...withCategories, ...techInferred, ...seniorityInferred]);

  // 5. Sort: explicit first, then by proficiency desc
  allSkills.sort((a, b) => {
    if (a.inferred !== b.inferred) return a.inferred ? 1 : -1;
    return PROFICIENCY_ORDER.indexOf(b.proficiency) - PROFICIENCY_ORDER.indexOf(a.proficiency);
  });

  return { ...data, skills: allSkills };
}
