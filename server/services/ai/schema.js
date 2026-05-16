export const VALID_SENIORITY = ['junior', 'mid-level', 'senior', 'lead', 'principal', 'executive'];
export const VALID_PROFICIENCY = ['beginner', 'intermediate', 'advanced', 'expert'];
export const VALID_CATEGORIES = ['Frontend', 'Backend', 'Database', 'Cloud', 'DevOps', 'Mobile', 'AI/ML', 'Design', 'Management', 'Other'];
export const VALID_TRAJECTORIES = ['Upward', 'Lateral', 'Pivoting', 'Early Career', 'Established Expert'];

function str(v, fallback = '') { return v == null ? fallback : String(v).trim(); }
function int(v, fallback = 0, min = 0, max = 999) { const n = parseInt(v, 10); if (Number.isNaN(n)) return fallback; return Math.max(min, Math.min(max, n)); }
function enumVal(v, valid, fallback) { if (valid.includes(v)) return v; const lower = String(v || '').toLowerCase(); return valid.find((e) => e.toLowerCase() === lower) ?? fallback; }
function arr(v) { if (Array.isArray(v)) return v; if (v == null) return []; return [v]; }

function normalizeDate(v) {
  if (!v) return null;
  const s = String(v).trim();
  if (!s || s === 'null' || s === 'undefined') return null;
  if (/^\d{4}$/.test(s)) return `${s}-01-01`;
  if (/^\d{4}-\d{2}$/.test(s)) return `${s}-01`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}

export function sanitizeSkill(raw, warnings) {
  if (!raw || typeof raw !== 'object') return null;
  const name = str(raw.name);
  if (!name) { warnings.push('Skipped unnamed skill'); return null; }
  return { name, category: enumVal(raw.category, VALID_CATEGORIES, 'Other'), proficiency: enumVal(raw.proficiency, VALID_PROFICIENCY, 'intermediate'), yearsOfExperience: int(raw.yearsOfExperience, 0, 0, 40), inferred: raw.inferred === true };
}

export function sanitizeExperience(raw, warnings) {
  if (!raw || typeof raw !== 'object') return null;
  const company = str(raw.company);
  const role = str(raw.role);
  if (!company && !role) { warnings.push('Skipped experience entry with no company or role'); return null; }
  return { company: company || 'Unknown Company', role: role || 'Unknown Role', startDate: normalizeDate(raw.startDate), endDate: raw.current ? null : normalizeDate(raw.endDate), current: raw.current === true || String(raw.current).toLowerCase() === 'true', description: str(raw.description), technologies: arr(raw.technologies).map(str).filter(Boolean), location: str(raw.location) };
}

export function sanitizeEducation(raw, warnings) {
  if (!raw || typeof raw !== 'object') return null;
  const institution = str(raw.institution);
  if (!institution) { warnings.push('Skipped education entry with no institution'); return null; }
  return { institution, degree: str(raw.degree), field: str(raw.field), startYear: raw.startYear ? int(raw.startYear, null, 1950, 2035) : null, endYear: raw.endYear ? int(raw.endYear, null, 1950, 2035) : null, grade: str(raw.grade) };
}

export function sanitizeCertification(raw, warnings) {
  if (!raw || typeof raw !== 'object') return null;
  const name = str(raw.name);
  if (!name) { warnings.push('Skipped certification with no name'); return null; }
  return { name, issuer: str(raw.issuer), issueDate: normalizeDate(raw.issueDate), expiryDate: normalizeDate(raw.expiryDate), credentialId: str(raw.credentialId) };
}

export function sanitizeProject(raw, warnings) {
  if (!raw || typeof raw !== 'object') return null;
  const name = str(raw.name);
  if (!name) { warnings.push('Skipped project with no name'); return null; }
  return { name, description: str(raw.description), technologies: arr(raw.technologies).map(str).filter(Boolean), url: str(raw.url) };
}

export function validateAndSanitize(raw) {
  const warnings = [];
  if (!raw || typeof raw !== 'object') { warnings.push('Root value is not an object'); return { data: buildEmptyResume(), warnings }; }

  const data = {
    name: str(raw.name),
    email: str(raw.email).toLowerCase(),
    phone: str(raw.phone),
    location: str(raw.location),
    title: str(raw.title),
    summary: str(raw.summary),
    totalYearsExperience: int(raw.totalYearsExperience, 0, 0, 60),
    seniority: enumVal(raw.seniority, VALID_SENIORITY, 'mid-level'),
    domainExpertise: arr(raw.domainExpertise).map(str).filter(Boolean).slice(0, 6),
    aiInsights: raw.aiInsights && typeof raw.aiInsights === 'object' ? {
      strengths: arr(raw.aiInsights.strengths).map(str).filter(Boolean).slice(0, 4),
      uniqueValue: str(raw.aiInsights.uniqueValue),
      careerTrajectory: enumVal(raw.aiInsights.careerTrajectory, VALID_TRAJECTORIES, 'Upward'),
    } : null,
    skills: arr(raw.skills).map((s) => sanitizeSkill(s, warnings)).filter(Boolean),
    experience: arr(raw.experience).map((e) => sanitizeExperience(e, warnings)).filter(Boolean),
    education: arr(raw.education).map((e) => sanitizeEducation(e, warnings)).filter(Boolean),
    certifications: arr(raw.certifications).map((c) => sanitizeCertification(c, warnings)).filter(Boolean),
    projects: arr(raw.projects).map((p) => sanitizeProject(p, warnings)).filter(Boolean),
  };

  return { data, warnings };
}

export function buildEmptyResume() {
  return { name: '', email: '', phone: '', location: '', title: '', summary: '', totalYearsExperience: 0, seniority: 'mid-level', domainExpertise: [], aiInsights: null, skills: [], experience: [], education: [], certifications: [], projects: [] };
}
