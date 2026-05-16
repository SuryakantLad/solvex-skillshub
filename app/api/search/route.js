import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/guards';
import connectDB from '@/lib/db/connection';
import Employee from '@/lib/db/models/Employee';
import { semanticSearchEmployees } from '@/lib/ai/search';

export const maxDuration = 60;

// Max employees sent to Claude per search (cost + latency control)
const AI_CANDIDATE_LIMIT = 50;

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'hr') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    await connectDB();
    const departments = await Employee.distinct('department', { department: { $nin: ['', null] } });
    return NextResponse.json({ departments: departments.filter(Boolean).sort() });
  } catch {
    return NextResponse.json({ departments: [] });
  }
}

export async function POST(request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'hr') return NextResponse.json({ error: 'HR access required' }, { status: 403 });

    const body = await request.json();
    const { query, filters = {} } = body;

    if (!query || query.trim().length < 3) {
      return NextResponse.json({ error: 'Search query too short' }, { status: 400 });
    }

    await connectDB();

    // ── MongoDB hard-constraint pre-filter ─────────────────────────────────────
    // These are filters the user explicitly set — not semantic, just hard limits
    const mongoFilter = {};

    if (filters.available === true) {
      mongoFilter['availability.isAvailable'] = true;
    }

    if (filters.department && filters.department !== 'all') {
      mongoFilter.department = { $regex: `^${escapeRegex(filters.department)}$`, $options: 'i' };
    }

    const minExp = filters.minExperience != null ? Number(filters.minExperience) : 0;
    const maxExp = filters.maxExperience != null ? Number(filters.maxExperience) : 30;

    if (minExp > 0 || maxExp < 30) {
      mongoFilter.totalYearsExperience = {};
      if (minExp > 0) mongoFilter.totalYearsExperience.$gte = minExp;
      if (maxExp < 30) mongoFilter.totalYearsExperience.$lte = maxExp;
    }

    // ── Fetch pre-filtered candidates ─────────────────────────────────────────
    const employees = await Employee.find(mongoFilter)
      .select(
        'name title department skills certifications summary totalYearsExperience location availability domainExpertise seniority'
      )
      .sort({ profileCompleteness: -1, totalYearsExperience: -1 })
      .limit(AI_CANDIDATE_LIMIT)
      .lean();

    if (employees.length === 0) {
      const allDepts = await Employee.distinct('department', { department: { $nin: ['', null] } });
      return NextResponse.json({
        results: [],
        query,
        total: 0,
        scannedCount: 0,
        departments: allDepts.filter(Boolean).sort(),
        filters,
        message: 'No employees match your filters. Try relaxing the criteria.',
      });
    }

    // ── Claude semantic ranking ────────────────────────────────────────────────
    const aiResults = await semanticSearchEmployees(query, employees);

    // ── Enrich AI results with full employee data ──────────────────────────────
    const employeeMap = employees.reduce((acc, emp) => {
      acc[emp._id.toString()] = emp;
      return acc;
    }, {});

    let results = aiResults
      .map((r) => ({ ...r, employee: employeeMap[r.id] || null }))
      .filter((r) => r.employee !== null);

    // Drop very-low scores only when there are enough results
    if (results.length > 6) {
      results = results.filter((r) => r.matchScore > 10);
    }

    // ── Fetch departments for filter UI ────────────────────────────────────────
    const allDepts = await Employee.distinct('department', { department: { $nin: ['', null] } });

    return NextResponse.json({
      results,
      query,
      total: results.length,
      scannedCount: employees.length,
      departments: allDepts.filter(Boolean).sort(),
      filters,
    });
  } catch (error) {
    console.error('Search error:', error);

    if (error?.message?.includes('RESOURCE_EXHAUSTED') || error?.message?.includes('429')) {
      return NextResponse.json({ error: 'Claude AI rate limit reached. Please try again in a moment.' }, { status: 503 });
    }
    if (error.message?.includes('GEMINI_API_KEY') || error.message?.includes('API_KEY')) {
      return NextResponse.json({ error: 'AI service unavailable. Check your GEMINI_API_KEY configuration.' }, { status: 503 });
    }

    return NextResponse.json({ error: 'Search failed. Please try again.' }, { status: 500 });
  }
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
