/**
 * lib/ai/prompts.js
 * All AI prompt templates for TalentGraph AI — optimized for Gemini 2.5 Flash.
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. RESUME EXTRACTION
// ─────────────────────────────────────────────────────────────────────────────

export function buildExtractionPrompt(resumeText, attempt = 1) {
  const retryNote = attempt > 1
    ? `\n⚠️ RETRY ${attempt}: Previous response was not valid JSON. Return ONLY the JSON object — no prose, no markdown, no code fences.\n`
    : '';

  return `${retryNote}You are a Principal HR Intelligence Engineer. Extract structured data from the resume below.

OUTPUT RULES (CRITICAL):
- Return ONLY a valid JSON object. Begin with { and end with }.
- No markdown, no code fences, no preamble, no explanation.
- Use null for missing optional fields, [] for missing arrays.

PDF ARTIFACT HANDLING:
- Fix ligatures: ﬁ→fi, ﬂ→fl, ﬀ→ff
- Fix hyphenated line-breaks: "develop-\\nment" → "development"
- Ignore page numbers and headers/footers

PROFICIENCY CALIBRATION:
- expert: 6+ yrs dedicated use, lead/architect role, or "expert in"
- advanced: 3–6 yrs, "proficient in", "strong experience"
- intermediate: 1–3 yrs, "experience with", "working knowledge"
- beginner: <1 yr, "familiar with", "exposure to"
- When unsure → choose the lower level

SENIORITY (first match wins):
1. CTO/VP/Director/Head of → executive
2. Principal/Distinguished/Fellow → principal
3. Lead/Staff/Architect → lead
4. Senior/Sr. → senior
5. ≥10 years total → senior
6. ≥5 years total → senior
7. ≥2 years total → mid-level
8. Default → junior

<resume>
${resumeText.slice(0, 25000)}
</resume>

Return exactly this JSON structure (no other text):
{
  "name": "full name or empty string",
  "email": "email or empty string",
  "phone": "phone or empty string",
  "location": "City, Country or empty string",
  "title": "current or most recent job title",
  "summary": "2-3 sentence third-person summary focusing on impact",
  "totalYearsExperience": 0,
  "seniority": "junior|mid-level|senior|lead|principal|executive",
  "domainExpertise": ["1-4 broad domains"],
  "aiInsights": {
    "strengths": ["up to 3 strengths with specific resume evidence"],
    "uniqueValue": "one sentence on what makes this candidate distinctive",
    "careerTrajectory": "Upward|Lateral|Pivoting|Early Career|Established Expert"
  },
  "skills": [
    {
      "name": "React",
      "category": "Frontend|Backend|Database|Cloud|DevOps|Mobile|AI/ML|Design|Management|Other",
      "proficiency": "beginner|intermediate|advanced|expert",
      "yearsOfExperience": 0,
      "inferred": false
    }
  ],
  "experience": [
    {
      "company": "company name",
      "role": "job title",
      "startDate": "YYYY-MM-DD or null",
      "endDate": "YYYY-MM-DD or null (null if current)",
      "current": false,
      "description": "concise impact-focused description",
      "technologies": ["tech used"],
      "location": "city/country or empty string"
    }
  ],
  "education": [
    {
      "institution": "university name",
      "degree": "Bachelor's|Master's|PhD|Diploma",
      "field": "field of study",
      "startYear": null,
      "endYear": null,
      "grade": "GPA or grade or empty string"
    }
  ],
  "certifications": [
    {
      "name": "cert name",
      "issuer": "issuing org",
      "issueDate": "YYYY-MM-DD or null",
      "expiryDate": "YYYY-MM-DD or null",
      "credentialId": "id or empty string"
    }
  ],
  "projects": [
    {
      "name": "project name",
      "description": "what it does and impact",
      "technologies": ["tech used"],
      "url": "url or empty string"
    }
  ]
}`;
}

// Backward-compatible alias
export const resumeExtractionPrompt = buildExtractionPrompt;

// ─────────────────────────────────────────────────────────────────────────────
// 2. SEMANTIC SEARCH + MATCH REASONING
// ─────────────────────────────────────────────────────────────────────────────

export function buildSearchPrompt(query, candidates) {
  return `You are a senior talent acquisition specialist. Semantically rank these candidates for the search query.

OUTPUT RULES:
- Return ONLY a JSON array. Begin with [ and end with ].
- No markdown, no prose, no code fences.
- Include ALL candidates (even weak matches). Sort descending by matchScore.

SEARCH QUERY: "${query}"

SCORING:
90-100 (Excellent): Direct match — exact skills, right experience level.
70-89  (Strong):    Most requirements met, minor bridgeable gaps.
50-69  (Good):      Core match, notable gaps or mismatched seniority.
30-49  (Fair):      Tangentially related, significant ramp-up needed.
0-29   (Weak):      Does not match meaningfully.

SEMANTIC RULES:
- Infer related: Docker→DevOps, React→JS, AWS Lambda→Serverless, K8s→Docker, Next.js→React
- Synonyms: Node.js=NodeJS, Postgres=PostgreSQL, ReactJS=React, TS=TypeScript
- Domain: fintech→payment/banking, healthtech→HIPAA/medical, ecommerce→Stripe/inventory
- Score generously: Django dev IS a Python dev; React Native dev IS a mobile dev

CANDIDATES:
${JSON.stringify(candidates, null, 2)}

Return:
[
  {
    "id": "candidate id",
    "matchScore": 85,
    "matchLevel": "Excellent|Strong|Good|Fair|Weak",
    "keyStrengths": ["specific evidence — max 3"],
    "gaps": ["specific missing skills — max 3"],
    "reasoning": "2-3 sentences with specific evidence",
    "recommendedFor": "most suitable role/project based on their actual profile"
  }
]`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. TEAM BUILDER
// ─────────────────────────────────────────────────────────────────────────────

export function buildTeamPrompt(requirement, candidates, constraints = {}) {
  const hardConstraints = [];
  if (constraints.minExperience > 0) {
    hardConstraints.push(`- Minimum experience: ${constraints.minExperience} years — you MUST NOT select any candidate whose totalYearsExperience is below ${constraints.minExperience}`);
  }
  if (constraints.seniorityRequired === 'senior' || constraints.seniorityRequired === 'principal') {
    hardConstraints.push(`- Seniority: only select candidates with seniority = senior, lead, principal, or executive`);
  }

  const hardConstraintBlock = hardConstraints.length > 0
    ? `\nHARD CONSTRAINTS (non-negotiable — violating these is a critical error):\n${hardConstraints.join('\n')}\n`
    : '';

  return `You are an experienced VP of Engineering composing a high-performance project team.

OUTPUT RULES:
- Return ONLY a JSON object. Begin with { and end with }.
- No markdown, no prose, no code fences.

PROJECT REQUIREMENT: "${requirement}"
${hardConstraintBlock}
PRINCIPLES:
1. Cover every required domain (explicit + implied)
2. Diverse, non-overlapping skill sets — no redundant profiles
3. At least one senior/lead; mix seniority levels
4. Critical skills need ≥2 people; no single points of failure
5. 3–7 members maximum — lean is better
6. Prefer available candidates; use unavailable only for critical unique skills
7. ALWAYS respect HARD CONSTRAINTS above — they override all other principles

AVAILABLE POOL:
${JSON.stringify(candidates, null, 2)}

Return:
{
  "teamName": "specific descriptive team name",
  "teamSize": 4,
  "teamScore": 85,
  "members": [
    {
      "id": "employee id",
      "role": "specific function e.g. Infrastructure Lead",
      "contribution": "unique value citing specific skills",
      "fitScore": 90,
      "criticalFor": ["skills only this person covers"]
    }
  ],
  "skillCoverage": [
    {
      "skill": "required skill or domain",
      "coveredBy": ["member ids"],
      "level": "strong|partial|missing"
    }
  ],
  "seniorityBalance": {
    "description": "e.g. 2 Senior, 1 Mid-level — appropriate for this complexity",
    "score": 80
  },
  "teamStrengths": ["specific collective capabilities"],
  "potentialRisks": ["gaps or single points of failure"],
  "recommendation": "2-3 sentences on why this composition works",
  "missingSkills": ["needed but absent"],
  "alternativeCandidates": [
    {
      "id": "NOT already on team",
      "alternativeFor": "team member id",
      "reason": "why they are a viable substitute"
    }
  ]
}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. SKILL INFERENCE
// ─────────────────────────────────────────────────────────────────────────────

export function buildSkillInferencePrompt(skills, experience, title) {
  return `You are a senior technical recruiter who deeply understands how technology skills relate.

OUTPUT RULES:
- Return ONLY a JSON array. Begin with [ and end with ].
- No markdown, no prose, no code fences.
- Only infer skills with strong logical evidence.
- Do NOT include skills already in the explicit list.

EXPLICIT SKILLS: ${JSON.stringify(skills.map((s) => s.name))}
JOB TITLE: ${title || 'Not specified'}
EXPERIENCE: ${JSON.stringify(experience.slice(0, 5).map((e) => ({ role: e.role, tech: e.technologies })))}

INFERENCE EXAMPLES:
- Next.js → React, JavaScript, SSR
- Docker → Containerization, Linux, DevOps
- AWS Lambda → Serverless, AWS, Cloud Computing
- Kubernetes → Docker, Container Orchestration, DevOps
- Django → Python, REST APIs, ORM
- Spring Boot → Java, Microservices, REST APIs

Return up to 15 inferred skills:
[
  {
    "name": "canonical skill name",
    "category": "Frontend|Backend|Database|Cloud|DevOps|Mobile|AI/ML|Design|Management|Other",
    "confidence": 85,
    "reason": "inferred because candidate uses Next.js which requires React"
  }
]`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. CONVERSATIONAL HR CHAT
// ─────────────────────────────────────────────────────────────────────────────

export function buildChatPrompt(message, history, currentCandidates) {
  const candidateSummary = currentCandidates.length > 0
    ? `Currently visible: ${currentCandidates.map((c) => `${c.name} (${c.title}, ${c.totalYearsExperience}y, ${c.skills?.slice(0, 3).map((s) => s.name).join('/')})`).join('; ')}`
    : 'No candidates currently visible.';

  const historyText = history.slice(-6).map((h) =>
    `${h.role === 'user' ? 'HR' : 'AI'}: ${h.content}`
  ).join('\n');

  return `You are TalentGraph AI, an expert talent acquisition assistant.

OUTPUT RULES:
- Return ONLY a valid JSON object. Begin with { and end with }.
- No markdown, no code fences, no prose outside the JSON.
- The "message" field must be plain text — no markdown formatting.

CONVERSATION HISTORY:
${historyText || 'None.'}

CURRENT STATE: ${candidateSummary}

HR MESSAGE: "${message}"

Actions:
- action="search" — user wants to find candidates → provide searchQuery + filters
- action="answer" — answering about shown candidates or general HR questions
- action="clarify" — request is too vague

Return:
{
  "message": "conversational plain-text response (1-3 sentences)",
  "action": "search|answer|clarify",
  "searchQuery": "extracted query or null",
  "filters": {
    "department": null,
    "minExperience": null,
    "maxExperience": null,
    "available": null
  },
  "candidateIds": [],
  "followUpSuggestions": ["2-3 short follow-up suggestions"]
}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. MATCH REASONING
// ─────────────────────────────────────────────────────────────────────────────

export function buildMatchReasoningPrompt(query, candidate) {
  return `You are a senior technical recruiter. Explain concisely why this candidate matches (or doesn't) the hiring query.

OUTPUT RULES:
- Return ONLY a JSON object. Begin with { and end with }.

QUERY: "${query}"
CANDIDATE: ${JSON.stringify({
    name: candidate.name,
    title: candidate.title,
    yearsExp: candidate.totalYearsExperience,
    skills: candidate.skills?.slice(0, 10).map((s) => `${s.name} (${s.proficiency})`),
    summary: candidate.summary?.slice(0, 300),
  })}

Return:
{
  "headline": "one sentence e.g. Rahul is a strong fit because of 4 years Node.js + fintech APIs",
  "strengths": ["3 specific strengths with evidence"],
  "gaps": ["2 specific gaps"],
  "score": 85,
  "recommendation": "Hire|Strong Consider|Consider|Pass"
}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. SKILL GAP ANALYSIS
// ─────────────────────────────────────────────────────────────────────────────

export function buildSkillGapPrompt(roleTarget, currentSkills, orgTopSkills) {
  return `You are a talent development expert analyzing skill gaps for career growth.

OUTPUT RULES:
- Return ONLY a JSON object. Begin with { and end with }.

TARGET ROLE: "${roleTarget}"
CURRENT SKILLS: ${JSON.stringify(currentSkills.slice(0, 20).map((s) => `${s.name} (${s.proficiency})`))}
ORG TOP SKILLS: ${JSON.stringify(orgTopSkills.slice(0, 20).map((s) => s.name))}

Return:
{
  "readinessScore": 75,
  "missingSkills": [
    {
      "name": "skill name",
      "priority": "critical|important|nice-to-have",
      "estimatedLearningTime": "2-3 months",
      "reason": "why needed for the target role"
    }
  ],
  "existingStrengths": ["skills they have that align with the target"],
  "learningPath": ["ordered 3-5 step learning sequence"],
  "summary": "2-3 sentence coaching summary"
}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. GITHUB SKILL ANALYSIS
// ─────────────────────────────────────────────────────────────────────────────

export function buildGitHubAnalysisPrompt(username, languages, repos, existingSkills) {
  return `You are a technical talent expert analyzing a developer's GitHub profile.

OUTPUT RULES:
- Return ONLY a JSON object. Begin with { and end with }.

GITHUB USER: ${username}
LANGUAGES: ${JSON.stringify(languages.slice(0, 10).map((l) => l.name))}
TOP REPOS: ${JSON.stringify(repos.slice(0, 8).map((r) => ({ name: r.name, desc: r.description?.slice(0, 80), stars: r.stars, lang: r.language })))}
EXISTING SKILLS: ${JSON.stringify(existingSkills.slice(0, 15).map((s) => s.name))}

Return:
{
  "detectedSkills": [
    {
      "name": "canonical skill name",
      "confidence": 85,
      "evidence": "specific evidence from repos/languages"
    }
  ],
  "developerProfile": "2-3 sentence summary based on GitHub activity",
  "specializations": ["1-3 technical specialization areas"],
  "openSourceContributor": false
}`;
}
