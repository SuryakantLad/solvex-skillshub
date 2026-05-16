import Employee from '../models/Employee.js';
import { syncGitHubData } from '../services/github/service.js';

export async function getGitHubData(req, res) {
  const employee = await Employee.findOne({ user: req.user.id }).select('github githubData').lean();
  if (!employee) return res.status(404).json({ error: 'Employee profile not found' });

  const gd = employee.githubData;
  if (!gd || !gd.username) return res.json({ profile: null, repos: [], languages: {}, detectedSkills: [], totalStars: 0 });

  const languages = {};
  for (const { name, bytes } of (gd.languages ?? [])) languages[name] = bytes;

  const repos = (gd.topRepos ?? []).map((r) => ({
    name: r.name,
    description: r.description,
    language: r.language,
    stargazersCount: r.stars,
    forksCount: r.forks,
    htmlUrl: r.url,
    updatedAt: r.updatedAt,
  }));

  const totalStars = repos.reduce((s, r) => s + (r.stargazersCount || 0), 0);

  return res.json({
    profile: {
      login: gd.username,
      name: gd.username,
      bio: gd.bio,
      avatarUrl: gd.avatarUrl,
      publicRepos: gd.publicRepos,
      followers: gd.followers,
      following: gd.following,
    },
    repos,
    languages,
    detectedSkills: gd.detectedSkills ?? [],
    totalStars,
  });
}

export async function syncGitHub(req, res) {
  const usernameOverride = req.body?.username?.trim() || req.body?.githubUsername?.trim() || null;

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

  const languages = {};
  for (const { name, bytes } of (githubData.languages ?? [])) languages[name] = bytes;

  const repos = (githubData.topRepos ?? []).map((r) => ({
    name: r.name,
    description: r.description,
    language: r.language,
    stargazersCount: r.stars,
    forksCount: r.forks,
    htmlUrl: r.url,
    updatedAt: r.updatedAt,
  }));

  const totalStars = repos.reduce((s, r) => s + (r.stargazersCount || 0), 0);

  return res.json({
    success: true,
    inferredSkillsAdded: addedCount,
    profile: {
      login: githubData.username,
      name: githubData.username,
      bio: githubData.bio,
      avatarUrl: githubData.avatarUrl,
      publicRepos: githubData.publicRepos,
      followers: githubData.followers,
      following: githubData.following,
    },
    repos,
    languages,
    detectedSkills: githubData.detectedSkills ?? [],
    totalStars,
  });
}
