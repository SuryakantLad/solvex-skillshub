import Employee from '../models/Employee.js';
import { semanticSearchEmployees } from '../services/ai/search.js';

const AI_CANDIDATE_LIMIT = 50;

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function getDepartments(req, res) {
  const departments = await Employee.distinct('department', { department: { $nin: ['', null] } });
  return res.json({ departments: departments.filter(Boolean).sort() });
}

export async function search(req, res) {
  const { query, filters = {} } = req.body;
  if (!query || query.trim().length < 3) return res.status(400).json({ error: 'Search query too short' });

  const mongoFilter = {};
  if (filters.available === true) mongoFilter['availability.isAvailable'] = true;
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

  const employees = await Employee.find(mongoFilter)
    .select('name title department skills certifications summary totalYearsExperience location availability domainExpertise seniority')
    .sort({ profileCompleteness: -1, totalYearsExperience: -1 })
    .limit(AI_CANDIDATE_LIMIT)
    .lean();

  if (employees.length === 0) {
    const allDepts = await Employee.distinct('department', { department: { $nin: ['', null] } });
    return res.json({ results: [], query, total: 0, scannedCount: 0, departments: allDepts.filter(Boolean).sort(), filters, message: 'No employees match your filters. Try relaxing the criteria.' });
  }

  const aiResults = await semanticSearchEmployees(query, employees);
  const employeeMap = employees.reduce((acc, emp) => { acc[emp._id.toString()] = emp; return acc; }, {});
  let results = aiResults.map((r) => ({ ...r, employee: employeeMap[r.id] || null })).filter((r) => r.employee !== null);
  if (results.length > 6) results = results.filter((r) => r.matchScore > 10);

  const allDepts = await Employee.distinct('department', { department: { $nin: ['', null] } });
  return res.json({ results, query, total: results.length, scannedCount: employees.length, departments: allDepts.filter(Boolean).sort(), filters });
}

export async function chatSearch(req, res) {
  const { message, history = [], currentCandidates = [] } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  const { generateChat } = await import('../services/ai/gemini.js');
  const { parseJsonSafely } = await import('../services/ai/parser.js');
  const { buildChatPrompt } = await import('../services/ai/prompts.js');

  const prompt = buildChatPrompt(message, history, currentCandidates);
  const rawText = await generateChat(prompt);
  const response = parseJsonSafely(rawText);

  if (response.action === 'search' && response.searchQuery) {
    const mongoFilter = {};
    if (response.filters?.department) mongoFilter.department = { $regex: escapeRegex(response.filters.department), $options: 'i' };
    if (response.filters?.minExperience) mongoFilter.totalYearsExperience = { $gte: Number(response.filters.minExperience) };
    if (response.filters?.available === true) mongoFilter['availability.isAvailable'] = true;

    const employees = await Employee.find(mongoFilter)
      .select('name title department skills certifications summary totalYearsExperience location availability domainExpertise seniority')
      .limit(AI_CANDIDATE_LIMIT).lean();

    if (employees.length > 0) {
      const aiResults = await semanticSearchEmployees(response.searchQuery, employees);
      const employeeMap = employees.reduce((acc, e) => { acc[e._id.toString()] = e; return acc; }, {});
      response.searchResults = aiResults.map((r) => ({ ...r, employee: employeeMap[r.id] || null })).filter((r) => r.employee !== null).slice(0, 10);
    } else {
      response.searchResults = [];
    }
  }

  return res.json(response);
}
