import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/guards';
import connectDB from '@/lib/db/connection';
import Employee from '@/lib/db/models/Employee';

export const maxDuration = 30;

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'hr') {
      return NextResponse.json({ error: 'HR access required' }, { status: 403 });
    }

    await connectDB();

    const [
      skillFrequency,
      categoryBreakdown,
      proficiencyDistribution,
      departmentSkills,
      seniorityStats,
      topStats,
    ] = await Promise.all([
      // Top 30 skills by frequency across the org
      Employee.aggregate([
        { $match: { isDeleted: false, status: 'active' } },
        { $unwind: '$skills' },
        {
          $group: {
            _id: '$skills.name',
            count: { $sum: 1 },
            avgYears: { $avg: '$skills.yearsOfExperience' },
            proficiencies: { $push: '$skills.proficiency' },
            category: { $first: '$skills.category' },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 40 },
        {
          $project: {
            name: '$_id',
            count: 1,
            avgYears: { $round: ['$avgYears', 1] },
            category: 1,
            expertCount: {
              $size: {
                $filter: { input: '$proficiencies', as: 'p', cond: { $eq: ['$$p', 'expert'] } },
              },
            },
            advancedCount: {
              $size: {
                $filter: { input: '$proficiencies', as: 'p', cond: { $eq: ['$$p', 'advanced'] } },
              },
            },
          },
        },
      ]),

      // Skills grouped by category
      Employee.aggregate([
        { $match: { isDeleted: false, status: 'active' } },
        { $unwind: '$skills' },
        {
          $group: {
            _id: '$skills.category',
            totalSkillInstances: { $sum: 1 },
            uniqueSkills: { $addToSet: '$skills.name' },
            uniqueEmployees: { $addToSet: '$_id' },
          },
        },
        {
          $project: {
            category: '$_id',
            totalSkillInstances: 1,
            uniqueSkillCount: { $size: '$uniqueSkills' },
            employeeCount: { $size: '$uniqueEmployees' },
          },
        },
        { $sort: { totalSkillInstances: -1 } },
      ]),

      // Proficiency distribution across all skills
      Employee.aggregate([
        { $match: { isDeleted: false, status: 'active' } },
        { $unwind: '$skills' },
        {
          $group: {
            _id: '$skills.proficiency',
            count: { $sum: 1 },
          },
        },
      ]),

      // Top skills per department (top 8 departments × top 6 skills)
      Employee.aggregate([
        { $match: { isDeleted: false, status: 'active', department: { $nin: ['', null] } } },
        { $unwind: '$skills' },
        {
          $group: {
            _id: { department: '$department', skill: '$skills.name' },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        {
          $group: {
            _id: '$_id.department',
            skills: { $push: { name: '$_id.skill', count: '$count' } },
          },
        },
        {
          $project: {
            department: '$_id',
            topSkills: { $slice: ['$skills', 6] },
          },
        },
        { $sort: { department: 1 } },
        { $limit: 8 },
      ]),

      // Seniority breakdown
      Employee.aggregate([
        { $match: { isDeleted: false, status: 'active' } },
        {
          $group: {
            _id: {
              $switch: {
                branches: [
                  { case: { $lte: ['$totalYearsExperience', 2] }, then: 'Junior (0–2y)' },
                  { case: { $lte: ['$totalYearsExperience', 5] }, then: 'Mid-level (2–5y)' },
                  { case: { $lte: ['$totalYearsExperience', 10] }, then: 'Senior (5–10y)' },
                  { case: { $gt: ['$totalYearsExperience', 10] }, then: 'Principal (10y+)' },
                ],
                default: 'Unknown',
              },
            },
            count: { $sum: 1 },
            avgSkills: { $avg: { $size: '$skills' } },
          },
        },
        {
          $project: {
            band: '$_id',
            count: 1,
            avgSkills: { $round: ['$avgSkills', 1] },
          },
        },
      ]),

      // Summary stats
      Employee.aggregate([
        { $match: { isDeleted: false, status: 'active' } },
        {
          $group: {
            _id: null,
            totalEmployees: { $sum: 1 },
            avgSkillsPerEmployee: { $avg: { $size: '$skills' } },
            avgYearsExperience: { $avg: '$totalYearsExperience' },
            availableCount: { $sum: { $cond: ['$availability.isAvailable', 1, 0] } },
          },
        },
        {
          $project: {
            totalEmployees: 1,
            avgSkillsPerEmployee: { $round: ['$avgSkillsPerEmployee', 1] },
            avgYearsExperience: { $round: ['$avgYearsExperience', 1] },
            availableCount: 1,
          },
        },
      ]),
    ]);

    return NextResponse.json({
      skillFrequency,
      categoryBreakdown,
      proficiencyDistribution,
      departmentSkills,
      seniorityStats,
      summary: topStats[0] ?? {
        totalEmployees: 0,
        avgSkillsPerEmployee: 0,
        avgYearsExperience: 0,
        availableCount: 0,
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Failed to load analytics' }, { status: 500 });
  }
}
