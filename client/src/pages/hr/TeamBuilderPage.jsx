import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wrench, Sparkles, Loader2, Users, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { getInitials, getAvatarUrl, getMatchScoreColor, getMatchScoreBg } from '@/lib/utils';
import { buildTeam } from '@/services/teamBuilderService';
import { Link } from 'react-router-dom';

const EXAMPLES = [
  'Build a team to develop a real-time collaborative editor with WebSockets, React, and Node.js',
  'Assemble a 4-person ML team for a computer vision project using Python and PyTorch',
  'Create a DevOps team for cloud migration to AWS with Kubernetes experience',
  'Form a mobile team for a React Native app with 3+ years iOS/Android experience',
];

export default function TeamBuilderPage() {
  const [requirement, setRequirement] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showAlternatives, setShowAlternatives] = useState(false);

  async function handleBuild(req = requirement) {
    if (!req.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await buildTeam(req);
      setResult(data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to build team');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="AI Team Builder"
        description="Describe your project requirements and AI will assemble the optimal team from your talent pool."
      />

      {/* Input */}
      <div className="space-y-3">
        <Textarea
          placeholder="Describe your project requirements, team size, skills needed, and experience level..."
          className="min-h-[120px] text-sm resize-none"
          value={requirement}
          onChange={(e) => setRequirement(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => { setRequirement(ex); handleBuild(ex); }}
              className="px-3 py-1.5 rounded-full text-xs bg-secondary text-secondary-foreground hover:bg-primary/10 hover:text-primary transition-colors border border-border text-left"
            >
              {ex.slice(0, 60)}…
            </button>
          ))}
        </div>
        <Button onClick={() => handleBuild()} disabled={loading || !requirement.trim()} className="w-full sm:w-auto">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Build Optimal Team
        </Button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center py-16 gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Wrench className="w-6 h-6 text-primary animate-pulse" />
          </div>
          <p className="text-sm font-medium">Assembling optimal team…</p>
          <p className="text-xs text-muted-foreground">Analyzing skills, experience, and availability</p>
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

            {/* Summary */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm mb-1">Team Assembly Complete</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{result.reasoning}</p>
                    {result.coverageScore !== undefined && (
                      <div className="mt-3 flex items-center gap-2">
                        <Progress value={result.coverageScore} className="h-1.5 w-32" indicatorClassName={getMatchScoreBg(result.coverageScore)} />
                        <span className={`text-xs font-bold ${getMatchScoreColor(result.coverageScore)}`}>{result.coverageScore}% coverage</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Team members */}
            <div>
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Recommended Team ({result.team?.length ?? 0} members)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(result.team ?? []).map((member) => (
                  <Card key={member.employee?._id} className="hover:border-primary/20 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <Avatar className="w-10 h-10 ring-2 ring-border shrink-0">
                          <AvatarImage src={getAvatarUrl(member.employee?.name)} />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">{getInitials(member.employee?.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{member.employee?.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{member.employee?.title}</p>
                          {member.role && <Badge variant="secondary" className="text-[10px] mt-1">{member.role}</Badge>}
                        </div>
                        {member.fitScore !== undefined && (
                          <div className={`text-xl font-black tabular-nums shrink-0 ${getMatchScoreColor(member.fitScore)}`}>
                            {member.fitScore}<span className="text-xs">%</span>
                          </div>
                        )}
                      </div>
                      {member.contribution && (
                        <p className="text-xs text-muted-foreground leading-relaxed mb-2">{member.contribution}</p>
                      )}
                      {member.keySkills?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {member.keySkills.slice(0, 4).map((s) => (
                            <span key={s} className="px-1.5 py-0.5 rounded-full text-[10px] bg-primary/8 text-primary font-medium">{s}</span>
                          ))}
                        </div>
                      )}
                      <Link to={`/hr/directory/${member.employee?._id}`} className="mt-2 flex items-center text-xs text-primary hover:underline">
                        View profile →
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Skill coverage */}
            {result.skillCoverage?.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Skill Coverage Matrix</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {result.skillCoverage.map((sc) => (
                      <div key={sc.skill} className="flex items-center gap-3">
                        <span className="text-xs font-medium w-28 truncate shrink-0">{sc.skill}</span>
                        <div className="flex-1">
                          <Progress value={sc.covered ? 100 : 0} className="h-1.5" indicatorClassName={sc.covered ? 'bg-emerald-500' : 'bg-rose-400'} />
                        </div>
                        {sc.covered
                          ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          : <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        }
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Gaps */}
            {result.gaps?.length > 0 && (
              <Card className="border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-900/10">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2">Skill Gaps Identified</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.gaps.map((g) => <Badge key={g} variant="warning">{g}</Badge>)}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Alternatives */}
            {result.alternativeCandidates?.length > 0 && (
              <div>
                <button
                  onClick={() => setShowAlternatives((v) => !v)}
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showAlternatives ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  {result.alternativeCandidates.length} Alternative Candidates
                </button>
                <AnimatePresence>
                  {showAlternatives && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {result.alternativeCandidates.map((alt) => (
                          <Card key={alt.employee?._id} className="border-dashed">
                            <CardContent className="p-3 flex items-center gap-3">
                              <Avatar className="w-8 h-8 shrink-0">
                                <AvatarImage src={getAvatarUrl(alt.employee?.name)} />
                                <AvatarFallback className="text-[10px] bg-muted">{getInitials(alt.employee?.name)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">{alt.employee?.name}</p>
                                <p className="text-[10px] text-muted-foreground">Alt. for {alt.alternativeFor}</p>
                              </div>
                              {alt.fitScore !== undefined && (
                                <span className={`text-xs font-bold shrink-0 ${getMatchScoreColor(alt.fitScore)}`}>{alt.fitScore}%</span>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
