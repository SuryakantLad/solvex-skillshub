const SKILL_CATEGORY_MAP = {
  'JavaScript': 'Frontend', 'TypeScript': 'Backend', 'HTML': 'Frontend', 'CSS': 'Frontend',
  'React': 'Frontend', 'Vue.js': 'Frontend', 'Angular': 'Frontend', 'Svelte': 'Frontend',
  'Next.js': 'Frontend', 'Nuxt.js': 'Frontend', 'Tailwind CSS': 'Frontend', 'Redux': 'Frontend',
  'Webpack': 'Frontend', 'Vite': 'Frontend', 'Jest': 'Frontend', 'Cypress': 'Frontend',
  'Node.js': 'Backend', 'Python': 'Backend', 'Java': 'Backend', 'Go': 'Backend',
  'Ruby': 'Backend', 'PHP': 'Backend', 'C#': 'Backend', '.NET': 'Backend',
  'Express.js': 'Backend', 'FastAPI': 'Backend', 'Django': 'Backend', 'Flask': 'Backend',
  'Spring Boot': 'Backend', 'REST APIs': 'Backend', 'GraphQL': 'Backend', 'Microservices': 'Backend',
  'PostgreSQL': 'Database', 'MySQL': 'Database', 'MongoDB': 'Database', 'Redis': 'Database',
  'Elasticsearch': 'Database', 'SQL': 'Database', 'NoSQL': 'Database',
  'AWS': 'Cloud', 'GCP': 'Cloud', 'Azure': 'Cloud', 'Cloud Computing': 'Cloud',
  'Docker': 'DevOps', 'Kubernetes': 'DevOps', 'Terraform': 'DevOps', 'CI/CD': 'DevOps',
  'Git': 'DevOps', 'Linux': 'DevOps', 'GitHub Actions': 'DevOps',
  'React Native': 'Mobile', 'Flutter': 'Mobile', 'Swift': 'Mobile',
  'Machine Learning': 'AI/ML', 'Deep Learning': 'AI/ML', 'TensorFlow': 'AI/ML', 'PyTorch': 'AI/ML',
};

const TECH_IMPLIES = {
  'Next.js': { implies: ['React', 'JavaScript', 'SSR'], category: 'Frontend' },
  'React': { implies: ['JavaScript', 'HTML', 'CSS'], category: 'Frontend' },
  'Vue.js': { implies: ['JavaScript', 'HTML', 'CSS'], category: 'Frontend' },
  'Angular': { implies: ['TypeScript', 'JavaScript', 'HTML', 'CSS'], category: 'Frontend' },
  'Express.js': { implies: ['Node.js', 'REST APIs', 'HTTP'], category: 'Backend' },
  'Django': { implies: ['Python', 'REST APIs', 'ORM'], category: 'Backend' },
  'FastAPI': { implies: ['Python', 'REST APIs', 'Async Programming'], category: 'Backend' },
  'Spring Boot': { implies: ['Java', 'REST APIs', 'Microservices'], category: 'Backend' },
  'Docker': { implies: ['Containerization', 'DevOps', 'Linux'], category: 'DevOps' },
  'Kubernetes': { implies: ['Docker', 'Container Orchestration', 'DevOps'], category: 'DevOps' },
  'React Native': { implies: ['React', 'Mobile Development', 'JavaScript'], category: 'Mobile' },
  'Flutter': { implies: ['Dart', 'Mobile Development', 'Cross-platform'], category: 'Mobile' },
  'TensorFlow': { implies: ['Python', 'Deep Learning', 'Machine Learning'], category: 'AI/ML' },
  'PyTorch': { implies: ['Python', 'Deep Learning', 'Machine Learning'], category: 'AI/ML' },
};

const SENIORITY_IMPLIES = {
  lead: ['Technical Leadership', 'Code Review', 'Mentoring', 'Architecture Design'],
  principal: ['System Design', 'Technical Strategy', 'Cross-team Collaboration'],
  executive: ['Engineering Leadership', 'Technical Strategy', 'Team Building'],
};

const PROFICIENCY_ORDER = ['beginner', 'intermediate', 'advanced', 'expert'];

export function categorizeSkill(name) {
  const exact = SKILL_CATEGORY_MAP[name];
  if (exact) return exact;
  const lower = name.toLowerCase();
  for (const [key, cat] of Object.entries(SKILL_CATEGORY_MAP)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) return cat;
  }
  return 'Other';
}

export function inferRelatedSkills(explicitSkills) {
  const existingNames = new Set(explicitSkills.map((s) => s.name.toLowerCase()));
  const inferred = [];
  for (const skill of explicitSkills) {
    const rule = TECH_IMPLIES[skill.name];
    if (!rule) continue;
    for (const impliedName of rule.implies) {
      if (existingNames.has(impliedName.toLowerCase())) continue;
      existingNames.add(impliedName.toLowerCase());
      inferred.push({ name: impliedName, category: SKILL_CATEGORY_MAP[impliedName] ?? rule.category ?? 'Other', proficiency: oneLevelBelow(skill.proficiency), yearsOfExperience: 0, inferred: true });
    }
  }
  return inferred;
}

export function inferSenioritySkills(seniority, explicitSkills) {
  const rule = SENIORITY_IMPLIES[seniority];
  if (!rule) return [];
  const existingNames = new Set(explicitSkills.map((s) => s.name.toLowerCase()));
  return rule.filter((name) => !existingNames.has(name.toLowerCase())).map((name) => ({ name, category: 'Management', proficiency: seniority === 'executive' ? 'expert' : 'advanced', yearsOfExperience: 0, inferred: true }));
}

export function fillMissingCategories(skills) {
  return skills.map((s) => ({ ...s, category: s.category === 'Other' || !s.category ? categorizeSkill(s.name) : s.category }));
}

export function deduplicateSkills(skills) {
  const map = new Map();
  for (const s of skills) {
    const key = s.name.toLowerCase();
    const existing = map.get(key);
    if (!existing) { map.set(key, s); continue; }
    const existingPct = PROFICIENCY_ORDER.indexOf(existing.proficiency);
    const newPct = PROFICIENCY_ORDER.indexOf(s.proficiency);
    if (!s.inferred && existing.inferred) map.set(key, s);
    else if (newPct > existingPct) map.set(key, { ...s, inferred: existing.inferred && s.inferred });
  }
  return Array.from(map.values());
}

export function enrichWithInference(data) {
  const explicit = data.skills ?? [];
  const withCategories = fillMissingCategories(explicit);
  const techInferred = inferRelatedSkills(withCategories);
  const seniorityInferred = inferSenioritySkills(data.seniority, [...withCategories, ...techInferred]);
  const allSkills = deduplicateSkills([...withCategories, ...techInferred, ...seniorityInferred]);
  allSkills.sort((a, b) => {
    if (a.inferred !== b.inferred) return a.inferred ? 1 : -1;
    return PROFICIENCY_ORDER.indexOf(b.proficiency) - PROFICIENCY_ORDER.indexOf(a.proficiency);
  });
  return { ...data, skills: allSkills };
}

function oneLevelBelow(proficiency) {
  const idx = PROFICIENCY_ORDER.indexOf(proficiency);
  if (idx <= 0) return 'beginner';
  return PROFICIENCY_ORDER[idx - 1];
}
