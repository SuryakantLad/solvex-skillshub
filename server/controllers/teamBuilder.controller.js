import Employee from '../models/Employee.js';
import { buildOptimalTeam } from '../services/ai/search.js';

const FIELDS = 'name title department skills certifications summary totalYearsExperience location availability domainExpertise seniority';

function parseConstraints(requirement) {
  const text = requirement.toLowerCase();
  const expPatterns = [
    /(?:at\s+least|minimum|min\.?|over|>\s*)(\d+)\s*\+?\s*years?/,
    /(\d+)\s*\+\s*years?/,
    /(\d+)\s*years?\s+(?:of\s+)?(?:experience|exp(?:erience)?)/,
    /with\s+(\d+)\s*years?/,
  ];
  let minExperience = 0;
  for (const re of expPatterns) {
    const m = text.match(re);
    if (m) { minExperience = parseInt(m[1], 10); break; }
  }
  const seniorityRequired =
    /\b(principal|staff\s+engineer|vp|director)\b/.test(text) ? 'principal' :
    /\b(senior|lead|architect|sr\.)\b/.test(text) ? 'senior' :
    /\b(junior|entry.level|graduate)\b/.test(text) ? 'junior' : null;

  return { minExperience, seniorityRequired };
}

export async function buildTeam(req, res) {
  const { requirement } = req.body;
  if (!requirement || requirement.trim().length < 10) {
    return res.status(400).json({ error: 'Please describe the project requirement in more detail' });
  }

  const constraints = parseConstraints(requirement);

  const mongoFilter = {};
  if (constraints.minExperience > 0) mongoFilter.totalYearsExperience = { $gte: constraints.minExperience };
  if (constraints.seniorityRequired === 'senior' || constraints.seniorityRequired === 'principal') {
    mongoFilter.seniority = { $in: ['senior', 'lead', 'principal', 'executive'] };
  }

  let employees = await Employee.find(mongoFilter).select(FIELDS).sort({ profileCompleteness: -1, totalYearsExperience: -1 }).limit(80).lean();

  if (employees.length < 3) {
    employees = await Employee.find({}).select(FIELDS).sort({ profileCompleteness: -1, totalYearsExperience: -1 }).limit(80).lean();
  }

  if (employees.length === 0) return res.status(404).json({ error: 'No employees found in your talent pool' });

  const team = await buildOptimalTeam(requirement, employees, constraints);

  const employeeMap = employees.reduce((acc, emp) => { acc[emp._id.toString()] = emp; return acc; }, {});
  team.members = (team.members ?? []).map((member) => ({ ...member, employee: employeeMap[member.id] ?? null })).filter((m) => m.employee !== null);
  team.alternativeCandidates = (team.alternativeCandidates ?? []).map((alt) => ({ ...alt, employee: employeeMap[alt.id] ?? null })).filter((a) => a.employee !== null);

  return res.json({ team, requirement });
}
