import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Github, RefreshCw, Loader2, ExternalLink, Star, GitFork, Code2 } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { getGitHubData, syncGitHub } from '@/services/githubService';

const LANG_COLORS = {
  JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5', Go: '#00ADD8',
  Rust: '#dea584', Java: '#b07219', 'C++': '#f34b7d', CSS: '#563d7c', HTML: '#e34c26',
  Ruby: '#701516', PHP: '#4F5D95', Swift: '#F05138', Kotlin: '#A97BFF', Dart: '#00B4AB',
};

export default function GitHubPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    getGitHubData().then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function handleSync() {
    const u = username.trim() || data?.profile?.login;
    if (!u) { toast.error('Enter a GitHub username'); return; }
    setSyncing(true);
    try {
      const updated = await syncGitHub(u);
      setData(updated);
      toast.success('GitHub data synced!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  }

  if (loading) return (
    <div className="space-y-6 max-w-2xl">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-32 rounded-2xl" />
      <Skeleton className="h-48 rounded-2xl" />
    </div>
  );

  const profile = data?.profile;
  const repos = data?.repos ?? [];
  const languages = data?.languages ?? {};
  const detectedSkills = data?.detectedSkills ?? [];
  const totalBytes = Object.values(languages).reduce((s, v) => s + v, 0);

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="GitHub Integration" description="Sync your GitHub profile to showcase your open-source work." />

      {/* Sync form */}
      <Card>
        <CardContent className="p-5">
          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
              <Label>GitHub Username</Label>
              <div className="flex gap-2">
                <Input
                  placeholder={profile?.login ?? 'your-github-username'}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSync()}
                />
                <Button onClick={handleSync} disabled={syncing}>
                  {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Sync
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile summary */}
      {profile && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <img src={profile.avatarUrl} alt={profile.login} className="w-14 h-14 rounded-full ring-2 ring-border" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold">{profile.name ?? profile.login}</p>
                  <p className="text-sm text-muted-foreground">@{profile.login}</p>
                  {profile.bio && <p className="text-xs text-muted-foreground mt-1 truncate">{profile.bio}</p>}
                </div>
                <a href={`https://github.com/${profile.login}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm"><Github className="w-3.5 h-3.5" />View<ExternalLink className="w-3 h-3" /></Button>
                </a>
              </div>
              <div className="flex gap-4 mt-4 text-sm text-muted-foreground">
                <span>{profile.publicRepos ?? 0} repos</span>
                <span>{profile.followers ?? 0} followers</span>
                <span>{profile.following ?? 0} following</span>
                {data?.totalStars > 0 && <span>{data.totalStars} ⭐</span>}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Languages */}
      {Object.keys(languages).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Code2 className="w-4 h-4 text-primary" />
              Languages Used
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* Bar */}
            <div className="flex h-2 rounded-full overflow-hidden gap-px">
              {Object.entries(languages).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([lang, bytes]) => (
                <div
                  key={lang}
                  style={{ width: `${(bytes / totalBytes) * 100}%`, backgroundColor: LANG_COLORS[lang] ?? '#8b5cf6' }}
                  title={lang}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {Object.entries(languages).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([lang, bytes]) => (
                <div key={lang} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: LANG_COLORS[lang] ?? '#8b5cf6' }} />
                  <span className="text-xs text-muted-foreground">{lang}</span>
                  <span className="text-[10px] text-muted-foreground/60">{((bytes / totalBytes) * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detected skills */}
      {detectedSkills.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Skills Detected from GitHub</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {detectedSkills.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top repos */}
      {repos.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Top Repositories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {repos.slice(0, 5).map((repo) => (
              <a key={repo.name} href={repo.htmlUrl} target="_blank" rel="noopener noreferrer" className="block group">
                <div className="flex items-start gap-3 p-3 rounded-xl border border-border hover:border-primary/20 hover:bg-secondary/30 transition-all">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-primary group-hover:underline truncate">{repo.name}</p>
                    {repo.description && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{repo.description}</p>}
                    <div className="flex items-center gap-3 mt-1.5">
                      {repo.language && (
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: LANG_COLORS[repo.language] ?? '#8b5cf6' }} />
                          {repo.language}
                        </span>
                      )}
                      {repo.stargazersCount > 0 && <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><Star className="w-2.5 h-2.5" />{repo.stargazersCount}</span>}
                      {repo.forksCount > 0 && <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><GitFork className="w-2.5 h-2.5" />{repo.forksCount}</span>}
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5 group-hover:text-primary" />
                </div>
              </a>
            ))}
          </CardContent>
        </Card>
      )}

      {!profile && !syncing && (
        <div className="text-center py-12 text-muted-foreground">
          <Github className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Enter your GitHub username above to sync your profile</p>
        </div>
      )}
    </div>
  );
}
