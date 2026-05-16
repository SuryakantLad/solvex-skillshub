// GitHub public API — no auth token required, 60 req/hour per IP
const BASE = 'https://api.github.com';

const headers = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
};

async function ghFetch(path) {
  const res = await fetch(`${BASE}${path}`, { headers, next: { revalidate: 3600 } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub API error ${res.status} for ${path}`);
  return res.json();
}

export function extractUsername(raw) {
  if (!raw) return null;
  const trimmed = raw.trim();
  // Full URL: https://github.com/username or https://github.com/username/
  const urlMatch = trimmed.match(/github\.com\/([^/?\s]+)/i);
  if (urlMatch) return urlMatch[1].toLowerCase();
  // Already just a username (no slashes)
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

// Fetch languages for up to `limit` most-starred repos to avoid rate limits
export async function aggregateLanguages(username, repos, limit = 10) {
  const topRepos = [...repos]
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, limit);

  const totals = {};
  await Promise.all(
    topRepos.map(async (repo) => {
      try {
        const langs = await fetchRepoLanguages(username, repo.name);
        for (const [lang, bytes] of Object.entries(langs)) {
          totals[lang] = (totals[lang] || 0) + bytes;
        }
      } catch {
        // Skip individual repo errors
      }
    })
  );

  return Object.entries(totals)
    .sort(([, a], [, b]) => b - a)
    .map(([name, bytes]) => ({ name, bytes }));
}

// Map GitHub language names to canonical skill names used in the app
const LANGUAGE_TO_SKILLS = {
  JavaScript: ['JavaScript', 'Node.js'],
  TypeScript: ['TypeScript', 'JavaScript'],
  Python: ['Python'],
  Java: ['Java'],
  'C#': ['C#', '.NET'],
  'C++': ['C++'],
  C: ['C'],
  Go: ['Go'],
  Rust: ['Rust'],
  Ruby: ['Ruby', 'Ruby on Rails'],
  PHP: ['PHP'],
  Swift: ['Swift', 'iOS'],
  Kotlin: ['Kotlin', 'Android'],
  Dart: ['Dart', 'Flutter'],
  Scala: ['Scala'],
  R: ['R'],
  MATLAB: ['MATLAB'],
  Shell: ['Bash', 'Shell Scripting'],
  PowerShell: ['PowerShell'],
  HTML: ['HTML'],
  CSS: ['CSS'],
  SCSS: ['SCSS', 'CSS'],
  Vue: ['Vue.js'],
  Svelte: ['Svelte'],
  Dockerfile: ['Docker'],
  HCL: ['Terraform'],
  Jupyter: ['Python', 'Jupyter'],
};

// Also detect frameworks/tools from repo topics and descriptions
const TOPIC_TO_SKILLS = {
  react: 'React',
  nextjs: 'Next.js',
  'next-js': 'Next.js',
  vue: 'Vue.js',
  angular: 'Angular',
  svelte: 'Svelte',
  nodejs: 'Node.js',
  express: 'Express.js',
  fastapi: 'FastAPI',
  django: 'Django',
  flask: 'Flask',
  spring: 'Spring Boot',
  laravel: 'Laravel',
  rails: 'Ruby on Rails',
  graphql: 'GraphQL',
  postgresql: 'PostgreSQL',
  mongodb: 'MongoDB',
  redis: 'Redis',
  mysql: 'MySQL',
  docker: 'Docker',
  kubernetes: 'Kubernetes',
  terraform: 'Terraform',
  aws: 'AWS',
  gcp: 'GCP',
  azure: 'Azure',
  'machine-learning': 'Machine Learning',
  pytorch: 'PyTorch',
  tensorflow: 'TensorFlow',
  'react-native': 'React Native',
  flutter: 'Flutter',
  tailwind: 'Tailwind CSS',
  prisma: 'Prisma',
  jest: 'Jest',
  cypress: 'Cypress',
};

export function detectSkillsFromGitHub(languages, repos) {
  const skills = new Set();

  // From languages
  for (const { name } of languages) {
    const mapped = LANGUAGE_TO_SKILLS[name];
    if (mapped) mapped.forEach((s) => skills.add(s));
  }

  // From repo topics and names
  for (const repo of repos) {
    const topics = repo.topics ?? [];
    for (const topic of topics) {
      const skill = TOPIC_TO_SKILLS[topic.toLowerCase()];
      if (skill) skills.add(skill);
    }
    // Also scan repo name and description for keywords
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

  const [profile, repos] = await Promise.all([
    fetchGitHubProfile(username),
    fetchUserRepos(username, 50),
  ]);

  if (!profile) throw new Error(`GitHub user "${username}" not found`);

  const languages = await aggregateLanguages(username, repos, 12);
  const detectedSkills = detectSkillsFromGitHub(languages, repos);

  const topRepos = [...repos]
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 8)
    .map((r) => ({
      name: r.name,
      description: r.description ?? '',
      stars: r.stargazers_count,
      forks: r.forks_count,
      language: r.language ?? '',
      url: r.html_url,
      updatedAt: r.updated_at ? new Date(r.updated_at) : null,
    }));

  return {
    username,
    syncedAt: new Date(),
    publicRepos: profile.public_repos ?? 0,
    followers: profile.followers ?? 0,
    following: profile.following ?? 0,
    bio: profile.bio ?? '',
    avatarUrl: profile.avatar_url ?? '',
    languages,
    topRepos,
    detectedSkills,
  };
}
