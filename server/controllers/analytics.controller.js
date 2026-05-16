import Employee from '../models/Employee.js';
import { generateJSON } from '../services/ai/gemini.js';
import { parseJsonSafely } from '../services/ai/parser.js';
import { buildSkillGapPrompt } from '../services/ai/prompts.js';

export async function getAnalytics(req, res) {
  const [skillFrequency, categoryBreakdown, proficiencyDistribution, departmentSkills, seniorityStats, topStats, distinctDepts, recentEmployees, avgComplResult] = await Promise.all([
    Employee.aggregate([
      { $match: { isDeleted: false, status: 'active' } },
      { $unwind: '$skills' },
      { $group: { _id: '$skills.name', count: { $sum: 1 }, avgYears: { $avg: '$skills.yearsOfExperience' }, proficiencies: { $push: '$skills.proficiency' }, category: { $first: '$skills.category' } } },
      { $sort: { count: -1 } },
      { $limit: 40 },
      { $project: { name: '$_id', count: 1, avgYears: { $round: ['$avgYears', 1] }, category: 1, expertCount: { $size: { $filter: { input: '$proficiencies', as: 'p', cond: { $eq: ['$$p', 'expert'] } } } }, advancedCount: { $size: { $filter: { input: '$proficiencies', as: 'p', cond: { $eq: ['$$p', 'advanced'] } } } } } },
    ]),
    Employee.aggregate([
      { $match: { isDeleted: false, status: 'active' } },
      { $unwind: '$skills' },
      { $group: { _id: '$skills.category', totalSkillInstances: { $sum: 1 }, uniqueSkills: { $addToSet: '$skills.name' }, uniqueEmployees: { $addToSet: '$_id' } } },
      { $project: { category: '$_id', totalSkillInstances: 1, uniqueSkillCount: { $size: '$uniqueSkills' }, employeeCount: { $size: '$uniqueEmployees' } } },
      { $sort: { totalSkillInstances: -1 } },
    ]),
    Employee.aggregate([
      { $match: { isDeleted: false, status: 'active' } },
      { $unwind: '$skills' },
      { $group: { _id: '$skills.proficiency', count: { $sum: 1 } } },
    ]),
    Employee.aggregate([
      { $match: { isDeleted: false, status: 'active', department: { $nin: ['', null] } } },
      { $unwind: '$skills' },
      { $group: { _id: { department: '$department', skill: '$skills.name' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $group: { _id: '$_id.department', skills: { $push: { name: '$_id.skill', count: '$count' } } } },
      { $project: { department: '$_id', topSkills: { $slice: ['$skills', 6] } } },
      { $sort: { department: 1 } },
      { $limit: 8 },
    ]),
    Employee.aggregate([
      { $match: { isDeleted: false, status: 'active' } },
      { $group: { _id: { $switch: { branches: [{ case: { $lte: ['$totalYearsExperience', 2] }, then: 'Junior (0–2y)' }, { case: { $lte: ['$totalYearsExperience', 5] }, then: 'Mid-level (2–5y)' }, { case: { $lte: ['$totalYearsExperience', 10] }, then: 'Senior (5–10y)' }, { case: { $gt: ['$totalYearsExperience', 10] }, then: 'Principal (10y+)' }], default: 'Unknown' } }, count: { $sum: 1 }, avgSkills: { $avg: { $size: '$skills' } } } },
      { $project: { band: '$_id', count: 1, avgSkills: { $round: ['$avgSkills', 1] } } },
    ]),
    Employee.aggregate([
      { $match: { isDeleted: false, status: 'active' } },
      { $group: { _id: null, totalEmployees: { $sum: 1 }, avgSkillsPerEmployee: { $avg: { $size: '$skills' } }, avgYearsExperience: { $avg: '$totalYearsExperience' }, availableCount: { $sum: { $cond: ['$availability.isAvailable', 1, 0] } } } },
      { $project: { totalEmployees: 1, avgSkillsPerEmployee: { $round: ['$avgSkillsPerEmployee', 1] }, avgYearsExperience: { $round: ['$avgYearsExperience', 1] }, availableCount: 1 } },
    ]),
    Employee.distinct('department', { isDeleted: false, status: 'active', department: { $nin: ['', null] } }),
    Employee.find({ isDeleted: false, status: 'active' })
      .select('name title department availability profileCompleteness skills location totalYearsExperience')
      .sort({ createdAt: -1 })
      .limit(6)
      .lean(),
    Employee.aggregate([
      { $match: { isDeleted: false, status: 'active' } },
      { $group: { _id: null, avg: { $avg: '$profileCompleteness' } } },
    ]),
  ]);

  const summary = topStats[0] ?? { totalEmployees: 0, avgSkillsPerEmployee: 0, avgYearsExperience: 0, availableCount: 0 };
  return res.json({
    skillFrequency,
    categoryBreakdown,
    proficiencyDistribution,
    departmentSkills,
    seniorityStats,
    summary,
    stats: {
      total: summary.totalEmployees,
      departments: distinctDepts.length,
      available: summary.availableCount,
      avgCompleteness: Math.round(avgComplResult[0]?.avg ?? 0),
    },
    topSkills: skillFrequency.slice(0, 8).map((s) => ({ name: s.name, count: s.count })),
    departments: distinctDepts,
    recentEmployees,
  });
}

export async function getSkillGap(req, res) {
  const roleTarget = req.query.roleTarget || req.query.role;
  if (!roleTarget) return res.status(400).json({ error: 'role query parameter is required' });

  const orgTopSkills = await Employee.aggregate([
    { $match: { isDeleted: false, status: 'active' } },
    { $unwind: '$skills' },
    { $group: { _id: '$skills.name', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 20 },
    { $project: { name: '$_id', _id: 0 } },
  ]);

  // HR users don't have an employee profile — use org skills as the baseline.
  // Employee users compare against their own skills.
  let currentSkills = [];
  if (req.user.role !== 'hr') {
    const employee = await Employee.findOne({ user: req.user.id }).select('skills').lean();
    if (employee) currentSkills = employee.skills || [];
  } else {
    // For HR: treat org's top skills as the "current" pool being analysed
    currentSkills = orgTopSkills.map((s) => ({ name: s.name, proficiency: 'intermediate' }));
  }

  const prompt = buildSkillGapPrompt(roleTarget, currentSkills, orgTopSkills);
  const rawText = await generateJSON(prompt);
  const analysis = parseJsonSafely(rawText);

  return res.json(analysis);
}
