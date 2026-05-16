'use client';

import { useState, useEffect } from 'react';
import { Github, RefreshCw, Star, GitFork, Code2, Users, BookOpen, CheckCircle, ExternalLink, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import PageHeader from '@/components/shared/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const LANG_COLORS = {
  JavaScript: '#f7df1e', TypeScript: '#3178c6', Python: '#3776ab', Java: '#ed8b00',
  'C#': '#239120', 'C++': '#00599c', Go: '#00add8', Rust: '#ce422b', Ruby: '#cc342d',
  PHP: '#777bb4', Swift: '#f05138', Kotlin: '#7f52ff', Dart: '#0175c2',
  HTML: '#e34f26', CSS: '#1572b6', SCSS: '#cf649a', Shell: '#89e051',
  Vue: '#42b883', Svelte: '#ff3e00', Dockerfile: '#384d54',
};

function getLangColor(name) {
  return LANG_COLORS[name] ?? '#6b7280';
}

function LanguageBar({ items }) {
  const total = items.reduce((sum, l) => sum + l.bytes, 0);
  if (total === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex h-3 rounded-full overflow-hidden gap-px">
        {items.slice(0, 8).map((l) => (
          <div
            key={l.name}
            style={{ width: `${(l.bytes / total) * 100}%`, backgroundColor: getLangColor(l.name) }}
            title={`${l.name}: ${((l.bytes / total) * 100).toFixed(1)}%`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {items.slice(0, 8).map((l) => (
          <div key={l.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: getLangColor(l.name) }} />
            <span className="font-medium text-foreground">{l.name}</span>
            <span>{((l.bytes / total) * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GitHubPage() {
  const [data, setData] = useState(null);
  const [github, setGithub] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [inferredCount, setInferredCount] = useState(0);

  useEffect(() => {
    fetch('/api/github/sync')
      .then((r) => r.json())
      .then(({ github: gh, githubData }) => {
        setGithub(gh || '');
        if (githubData?.username) setData(githubData);
      })
      .catch(() => setError('Failed to load GitHub data'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSync() {
    setSyncing(true);
    setError('');
    setInferredCount(0);
    try {
      const body = usernameInput.trim() ? { username: usernameInput.trim() } : {};
      const res = await fetch('/api/github/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Sync failed');
      setData(json.githubData);
      setInferredCount(json.inferredSkillsAdded ?? 0);
      setUsernameInput('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="GitHub Integration"
        description="Sync your public GitHub activity to auto-detect skills and showcase projects."
        action={
          data?.syncedAt && (
            <Badge variant="secondary" className="text-xs">
              Last synced {new Date(data.syncedAt).toLocaleDateString()}
            </Badge>
          )
        }
      />

      {/* Connect / Sync */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Github className="w-4 h-4" />
            Connect GitHub
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {github
              ? `Profile linked: ${github}`
              : 'No GitHub profile linked. Enter your username or URL below.'}
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="github.com/username or just username"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSync()}
              className="max-w-xs"
            />
            <Button onClick={handleSync} disabled={syncing || loading} className="shrink-0">
              {syncing ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Syncing…</>
              ) : (
                <><RefreshCw className="w-4 h-4 mr-2" /> Sync Now</>
              )}
            </Button>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
          {inferredCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="w-4 h-4 shrink-0" />
              {inferredCount} new skill{inferredCount !== 1 ? 's' : ''} queued for review in your profile.
            </div>
          )}
        </CardContent>
      </Card>

      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={`skel-gh-${i}`} className="h-32 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {!loading && data && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Profile stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: BookOpen, label: 'Public Repos', value: data.publicRepos },
              { icon: Users, label: 'Followers', value: data.followers },
              { icon: Users, label: 'Following', value: data.following },
              { icon: Code2, label: 'Languages', value: data.languages?.length ?? 0 },
            ].map(({ icon: Icon, label, value }) => (
              <Card key={label}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-xs">{label}</span>
                  </div>
                  <p className="text-2xl font-bold">{value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Language breakdown */}
          {data.languages?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Code2 className="w-4 h-4" />
                  Language Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LanguageBar items={data.languages} />
              </CardContent>
            </Card>
          )}

          {/* Detected skills */}
          {data.detectedSkills?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Detected Skills
                  <Badge variant="secondary" className="ml-auto">{data.detectedSkills.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Skills inferred from your repositories. New skills are queued for review in your profile.
                </p>
                <div className="flex flex-wrap gap-2">
                  {data.detectedSkills.map((skill) => (
                    <Badge key={skill} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top repos */}
          {data.topRepos?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Github className="w-4 h-4" />
                  Top Repositories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {data.topRepos.map((repo) => (
                    <a
                      key={repo.name}
                      href={repo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block rounded-lg border border-border p-3 hover:border-primary/40 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="font-medium text-sm group-hover:text-primary transition-colors truncate">{repo.name}</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                      </div>
                      {repo.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{repo.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {repo.language && (
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getLangColor(repo.language) }} />
                            {repo.language}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3" />{repo.stars}
                        </span>
                        <span className="flex items-center gap-1">
                          <GitFork className="w-3 h-3" />{repo.forks}
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}

      {!loading && !data && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center">
            <Github className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold">No GitHub data yet</p>
            <p className="text-sm text-muted-foreground mt-1">Enter your GitHub username above and click Sync Now.</p>
          </div>
        </div>
      )}
    </div>
  );
}
