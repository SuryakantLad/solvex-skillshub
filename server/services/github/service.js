const BASE = 'https://api.github.com';
const headers = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };

async function ghFetch(path) {
  const res = await fetch(`${BASE}${path}`, { headers });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub API error ${res.status} for ${path}`);
  return res.json();
}

export function extractUsername(raw) {
  if (!raw) return null;
  const trimmed = raw.trim();
  const urlMatch = trimmed.match(/github\.com\/([^/?\s]+)/i);
  if (urlMatch) return urlMatch[1].toLowerCase();
  if (/^[a-zA-Z0-9-]+$/.test(trimmed)) return trimmed.toLowerCase();
  return null;
}

export async function fetchGitHubProfile(username) {
  return ghFetch(`/users/${username}`);
}

export async function fetchUserRepos(username, perPage = 30) {
  const data = await ghFetch(`/users/${username}/repos?sort=updated&per_page=${perPage}&type=owner`);
  return data ?? [];
}

export async function fetchRepoLanguages(username, repoName) {
  const data = await ghFetch(`/repos/${username}/${repoName}/languages`);
  return data ?? {};
}

export async function aggregateLanguages(username, repos, limit = 10) {
  const topRepos = [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, limit);
  const totals = {};
  await Promise.all(topRepos.map(async (repo) => {
    try {
      const langs = await fetchRepoLanguages(username, repo.name);
      for (const [lang, bytes] of Object.entries(langs)) totals[lang] = (totals[lang] || 0) + bytes;
    } catch {}
  }));
  return Object.entries(totals).sort(([, a], [, b]) => b - a).map(([name, bytes]) => ({ name, bytes }));
}

const LANGUAGE_TO_SKILLS = {
  JavaScript: ['JavaScript', 'Node.js'], TypeScript: ['TypeScript', 'JavaScript'],
  Python: ['Python'], Java: ['Java'], 'C#': ['C#', '.NET'], Go: ['Go'],
  Ruby: ['Ruby', 'Ruby on Rails'], PHP: ['PHP'], Swift: ['Swift', 'iOS'],
  Kotlin: ['Kotlin', 'Android'], Dart: ['Dart', 'Flutter'],
  Shell: ['Bash', 'Shell Scripting'], HTML: ['HTML'], CSS: ['CSS'],
  Dockerfile: ['Docker'], HCL: ['Terraform'],
};

const TOPIC_TO_SKILLS = {
  react: 'React', nextjs: 'Next.js', 'next-js': 'Next.js', vue: 'Vue.js', angular: 'Angular',
  nodejs: 'Node.js', express: 'Express.js', fastapi: 'FastAPI', django: 'Django', flask: 'Flask',
  graphql: 'GraphQL', postgresql: 'PostgreSQL', mongodb: 'MongoDB', redis: 'Redis',
  docker: 'Docker', kubernetes: 'Kubernetes', terraform: 'Terraform', aws: 'AWS', gcp: 'GCP', azure: 'Azure',
  'machine-learning': 'Machine Learning', pytorch: 'PyTorch', tensorflow: 'TensorFlow',
  'react-native': 'React Native', flutter: 'Flutter', tailwind: 'Tailwind CSS',
};

export function detectSkillsFromGitHub(languages, repos) {
  const skills = new Set();
  for (const { name } of languages) {
    const mapped = LANGUAGE_TO_SKILLS[name];
    if (mapped) mapped.forEach((s) => skills.add(s));
  }
  for (const repo of repos) {
    const topics = repo.topics ?? [];
    for (const topic of topics) {
      const skill = TOPIC_TO_SKILLS[topic.toLowerCase()];
      if (skill) skills.add(skill);
    }
    const text = `${repo.name} ${repo.description ?? ''}`.toLowerCase();
    for (const [keyword, skill] of Object.entries(TOPIC_TO_SKILLS)) {
      if (text.includes(keyword)) skills.add(skill);
    }
  }
  return [...skills].sort();
}

export async function syncGitHubData(githubFieldValue) {
  const username = extractUsername(githubFieldValue);
  if (!username) throw new Error('Could not extract a valid GitHub username');

  const [profile, repos] = await Promise.all([fetchGitHubProfile(username), fetchUserRepos(username, 50)]);
  if (!profile) throw new Error(`GitHub user "${username}" not found`);

  const languages = await aggregateLanguages(username, repos, 12);
  const detectedSkills = detectSkillsFromGitHub(languages, repos);
  const topRepos = [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 8).map((r) => ({
    name: r.name, description: r.description ?? '', stars: r.stargazers_count,
    forks: r.forks_count, language: r.language ?? '', url: r.html_url,
    updatedAt: r.updated_at ? new Date(r.updated_at) : null,
  }));

  return { username, syncedAt: new Date(), publicRepos: profile.public_repos ?? 0, followers: profile.followers ?? 0, following: profile.following ?? 0, bio: profile.bio ?? '', avatarUrl: profile.avatar_url ?? '', languages, topRepos, detectedSkills };
}
