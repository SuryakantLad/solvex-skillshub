import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/guards';
import connectDB from '@/lib/db/connection';
import Employee from '@/lib/db/models/Employee';
import { syncGitHubData } from '@/lib/github/service';

export const maxDuration = 30;

// GET — return stored GitHub data for the current user
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const employee = await Employee.findOne({ user: user.id })
      .select('github githubData')
      .lean();

    if (!employee) return NextResponse.json({ error: 'Employee profile not found' }, { status: 404 });

    return NextResponse.json({
      github: employee.github ?? '',
      githubData: employee.githubData ?? null,
    });
  } catch (error) {
    console.error('GitHub GET error:', error);
    return NextResponse.json({ error: 'Failed to load GitHub data' }, { status: 500 });
  }
}

// POST — trigger a fresh sync from the GitHub API
export async function POST(request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const usernameOverride = body?.username?.trim() || null;

    await connectDB();
    const employee = await Employee.findOne({ user: user.id });
    if (!employee) return NextResponse.json({ error: 'Employee profile not found' }, { status: 404 });

    // Use override if provided, otherwise fall back to stored github field
    const githubSource = usernameOverride || employee.github;
    if (!githubSource) {
      return NextResponse.json(
        { error: 'No GitHub username or URL found. Add your GitHub URL to your profile first.' },
        { status: 400 }
      );
    }

    const githubData = await syncGitHubData(githubSource);

    // Persist synced data
    employee.githubData = githubData;

    // If username was provided manually and profile field is empty, save it
    if (usernameOverride && !employee.github) {
      employee.github = `https://github.com/${githubData.username}`;
    }

    // Queue detected skills as inferred skills (skip ones already in skills[])
    const existingSkillNames = new Set(
      employee.skills.map((s) => s.name.toLowerCase())
    );
    const existingInferredNames = new Set(
      employee.inferredSkills
        .filter((s) => s.status === 'pending')
        .map((s) => s.name.toLowerCase())
    );

    let addedCount = 0;
    for (const skillName of githubData.detectedSkills) {
      const lower = skillName.toLowerCase();
      if (!existingSkillNames.has(lower) && !existingInferredNames.has(lower)) {
        employee.inferredSkills.push({
          name: skillName,
          category: 'Other',
          confidence: 75,
          source: 'ai_inferred',
          status: 'pending',
        });
        addedCount++;
      }
    }

    await employee.save();

    return NextResponse.json({
      success: true,
      githubData,
      inferredSkillsAdded: addedCount,
    });
  } catch (error) {
    console.error('GitHub sync error:', error);

    if (error.message?.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error.message?.includes('rate limit') || error.message?.includes('403')) {
      return NextResponse.json(
        { error: 'GitHub API rate limit reached. Try again in an hour.' },
        { status: 429 }
      );
    }

    return NextResponse.json({ error: error.message || 'Sync failed' }, { status: 500 });
  }
}
