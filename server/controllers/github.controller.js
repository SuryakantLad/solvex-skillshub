import Employee from '../models/Employee.js';
import { syncGitHubData } from '../services/github/service.js';

export async function getGitHubData(req, res) {
  const employee = await Employee.findOne({ user: req.user.id }).select('github githubData').lean();
  if (!employee) return res.status(404).json({ error: 'Employee profile not found' });
  return res.json({ github: employee.github ?? '', githubData: employee.githubData ?? null });
}

export async function syncGitHub(req, res) {
  const usernameOverride = req.body?.username?.trim() || null;

  const employee = await Employee.findOne({ user: req.user.id });
  if (!employee) return res.status(404).json({ error: 'Employee profile not found' });

  const githubSource = usernameOverride || employee.github;
  if (!githubSource) return res.status(400).json({ error: 'No GitHub username or URL found. Add your GitHub URL to your profile first.' });

  const githubData = await syncGitHubData(githubSource);
  employee.githubData = githubData;

  if (usernameOverride && !employee.github) {
    employee.github = `https://github.com/${githubData.username}`;
  }

  const existingSkillNames = new Set(employee.skills.map((s) => s.name.toLowerCase()));
  const existingInferredNames = new Set(employee.inferredSkills.filter((s) => s.status === 'pending').map((s) => s.name.toLowerCase()));

  let addedCount = 0;
  for (const skillName of githubData.detectedSkills) {
    const lower = skillName.toLowerCase();
    if (!existingSkillNames.has(lower) && !existingInferredNames.has(lower)) {
      employee.inferredSkills.push({ name: skillName, category: 'Other', confidence: 75, source: 'ai_inferred', status: 'pending' });
      addedCount++;
    }
  }

  await employee.save();
  return res.json({ success: true, githubData, inferredSkillsAdded: addedCount });
}
