import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/guards';
import connectDB from '@/lib/db/connection';
import Employee from '@/lib/db/models/Employee';
import { buildOptimalTeam } from '@/lib/ai/search';

export const maxDuration = 120;

const FIELDS =
  'name title department skills certifications summary totalYearsExperience location availability domainExpertise seniority';

/**
 * Extract hard constraints from free-text requirement.
 * Returns { minExperience: number, seniorityRequired: string|null }
 */
function parseConstraints(requirement) {
  const text = requirement.toLowerCase();

  // Match patterns: "5 years experience", "5+ years", "with 5 years", "at least 5 years", "minimum 5 years"
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
    /\b(junior|entry.level|graduate)\b/.test(text) ? 'junior' :
    null;

  return { minExperience, seniorityRequired };
}

export async function POST(request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'hr') return NextResponse.json({ error: 'HR access required' }, { status: 403 });

    const { requirement } = await request.json();

    if (!requirement || requirement.trim().length < 10) {
      return NextResponse.json(
        { error: 'Please describe the project requirement in more detail' },
        { status: 400 }
      );
    }

    await connectDB();

    const constraints = parseConstraints(requirement);

    // Build MongoDB query — hard-filter before sending to AI
    const mongoFilter = {};
    if (constraints.minExperience > 0) {
      mongoFilter.totalYearsExperience = { $gte: constraints.minExperience };
    }
    if (constraints.seniorityRequired === 'senior' || constraints.seniorityRequired === 'principal') {
      mongoFilter.seniority = { $in: ['senior', 'lead', 'principal', 'executive'] };
    }

    let employees = await Employee.find(mongoFilter)
      .select(FIELDS)
      .sort({ profileCompleteness: -1, totalYearsExperience: -1 })
      .limit(80)
      .lean();

    // Fall back to full pool if constraints are too aggressive (< 3 candidates)
    if (employees.length < 3) {
      employees = await Employee.find({})
        .select(FIELDS)
        .sort({ profileCompleteness: -1, totalYearsExperience: -1 })
        .limit(80)
        .lean();
    }

    if (employees.length === 0) {
      return NextResponse.json({ error: 'No employees found in your talent pool' }, { status: 404 });
    }

    const team = await buildOptimalTeam(requirement, employees, constraints);

    // Build a lookup map for all employees
    const employeeMap = employees.reduce((acc, emp) => {
      acc[emp._id.toString()] = emp;
      return acc;
    }, {});

    // Enrich team members with full employee data
    team.members = (team.members ?? [])
      .map((member) => ({ ...member, employee: employeeMap[member.id] ?? null }))
      .filter((m) => m.employee !== null);

    // Enrich alternativeCandidates with full employee data
    team.alternativeCandidates = (team.alternativeCandidates ?? [])
      .map((alt) => ({ ...alt, employee: employeeMap[alt.id] ?? null }))
      .filter((a) => a.employee !== null);

    return NextResponse.json({ team, requirement });
  } catch (error) {
    console.error('Team builder error:', error?.message, error?.status, error?.error);

    if (error?.message?.includes('RESOURCE_EXHAUSTED') || error?.message?.includes('429')) {
      return NextResponse.json({ error: 'Claude AI rate limit reached. Please try again in a moment.' }, { status: 503 });
    }
    if (error?.message?.includes('GEMINI_API_KEY') || error?.message?.includes('API_KEY')) {
      return NextResponse.json({ error: 'AI service unavailable. Check your GEMINI_API_KEY configuration.' }, { status: 503 });
    }
    if (error?.message?.includes('UNAVAILABLE') || error?.message?.includes('503')) {
      return NextResponse.json({ error: 'Claude AI is temporarily overloaded. Please try again in a moment.' }, { status: 503 });
    }

    const detail = process.env.NODE_ENV === 'development' ? ` (${error?.message})` : '';
    return NextResponse.json({ error: `Failed to build team. Please try again.${detail}` }, { status: 500 });
  }
}
