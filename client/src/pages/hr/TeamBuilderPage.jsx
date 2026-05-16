import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wrench, Sparkles, Loader2, Users, CheckCircle2, AlertCircle,
  ChevronDown, ChevronUp, ArrowRight, Shield, Zap,
} from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { getInitials, getAvatarUrl, getMatchScoreColor, getMatchScoreBg } from '@/lib/utils';
import { buildTeam } from '@/services/teamBuilderService';
import { Link } from 'react-router-dom';

const EXAMPLES = [
  'Build a 4-person team for a real-time collaborative editor using React, WebSockets, and Node.js',
  'Assemble a ML team for a computer vision project using Python, PyTorch, and AWS',
  'Create a DevOps team for cloud migration to AWS with Kubernetes experience',
  'Form a full-stack mobile team for a React Native fintech app with 3+ years experience',
];

function MemberCard({ member }) {
  return (
    <Card className="hover:border-primary/20 transition-all duration-200 hover:shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <Avatar className="w-11 h-11 ring-2 ring-border shrink-0">
            <AvatarImage src={getAvatarUrl(member.employee?.name)} />
            <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
              {getInitials(member.employee?.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{member.employee?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{member.employee?.title}</p>
            {member.role && (
              <Badge variant="secondary" className="text-[10px] mt-1">{member.role}</Badge>
            )}
          </div>
          {member.fitScore !== undefined && (
            <div className={`text-xl font-black tabular-nums leading-none shrink-0 ${getMatchScoreColor(member.fitScore)}`}>
              {member.fitScore}<span className="text-xs font-semibold">%</span>
            </div>
          )}
        </div>

        {member.fitScore !== undefined && (
          <Progress value={member.fitScore} className="h-1 mb-3" indicatorClassName={getMatchScoreBg(member.fitScore)} />
        )}

        {member.contribution && (
          <p className="text-xs text-muted-foreground leading-relaxed mb-2">{member.contribution}</p>
        )}

        {member.keySkills?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {member.keySkills.slice(0, 5).map((s) => (
              <span key={s} className="px-1.5 py-0.5 rounded-full text-[10px] bg-primary/8 text-primary font-medium">{s}</span>
            ))}
          </div>
        )}

        <Link
          to={`/hr/directory/${member.employee?._id}`}
          className="flex items-center text-xs text-primary hover:underline gap-1"
        >
          View full profile <ArrowRight className="w-3 h-3" />
        </Link>
      </CardContent>
    </Card>
  );
}

export default function TeamBuilderPage() {
  const [requirement, setRequirement] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showAlternatives, setShowAlternatives] = useState(false);

  const handleBuild = useCallback(async (req = requirement) => {
    if (!req.trim()) return;
    setLoading(true);
    setResult(null);
    setShowAlternatives(false);
    try {
      const data = await buildTeam(req);
      setResult(data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to build team');
    } finally {
      setLoading(false);
    }
  }, [requirement]);

  const teamData = result?.team ?? {};
  const coveredSkills = teamData.skillCoverage?.filter((s) => s.covered) ?? [];
  const missingSkills = teamData.skillCoverage?.filter((s) => !s.covered) ?? [];

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="AI Team Builder"
        description="Describe your project requirements and AI will assemble the optimal team from your talent pool."
      />

      {/* Input section */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <Textarea
            placeholder="Describe your project — include required technologies, team size, experience level, and domain (e.g. fintech, healthcare, e-commerce)…"
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
                {ex.slice(0, 55)}…
              </button>
            ))}
          </div>

          <Button
            onClick={() => handleBuild()}
            disabled={loading || !requirement.trim()}
            className="w-full sm:w-auto"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Assembling team…' : 'Build Optimal Team'}
          </Button>
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center py-16 gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Wrench className="w-8 h-8 text-primary" />
            </div>
            <div className="absolute inset-0 rounded-2xl bg-primary/10 animate-ping opacity-50" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold">Assembling optimal team…</p>
            <p className="text-xs text-muted-foreground mt-1">Analyzing skills, experience, and availability across your talent pool</p>
          </div>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

            {/* Summary card */}
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-indigo-500/5">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
                      <p className="font-semibold text-sm">
                        {teamData.teamName || 'Team Assembly Complete'}
                      </p>
                      {teamData.coverageScore !== undefined && (
                        <div className="flex items-center gap-2">
                          <Progress value={teamData.coverageScore} className="h-1.5 w-24" indicatorClassName={getMatchScoreBg(teamData.coverageScore)} />
                          <span className={`text-sm font-black tabular-nums ${getMatchScoreColor(teamData.coverageScore)}`}>
                            {teamData.coverageScore}%
                          </span>
                        </div>
                      )}
                    </div>
                    {teamData.reasoning && (
                      <p className="text-xs text-muted-foreground leading-relaxed">{teamData.reasoning}</p>
                    )}
                  </div>
                </div>

                {/* Risk flags */}
                {teamData.risks?.length > 0 && (
                  <>
                    <Separator className="my-3" />
                    <div className="flex items-start gap-2">
                      <Shield className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Risks Identified</p>
                        {teamData.risks.map((r, i) => (
                          <p key={i} className="text-xs text-muted-foreground">{typeof r === 'string' ? r : r.description ?? JSON.stringify(r)}</p>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Team members */}
            <div>
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Recommended Team
                <Badge variant="secondary">{teamData.members?.length ?? 0} members</Badge>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(teamData.members ?? []).map((member) => (
                  <MemberCard key={member.employee?._id ?? member.employee?.name} member={member} />
                ))}
              </div>
            </div>

            {/* Skill coverage */}
            {teamData.skillCoverage?.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">Skill Coverage Matrix</CardTitle>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" />{coveredSkills.length} covered
                      </span>
                      {missingSkills.length > 0 && (
                        <span className="flex items-center gap-1 text-rose-500">
                          <AlertCircle className="w-3 h-3" />{missingSkills.length} missing
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {result.skillCoverage.map((sc) => (
                      <div key={sc.skill} className={`flex items-center gap-3 px-3 py-2 rounded-xl border ${
                        sc.covered ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-900/40' : 'bg-rose-50 border-rose-200 dark:bg-rose-900/10 dark:border-rose-900/40'
                      }`}>
                        {sc.covered
                          ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          : <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        }
                        <span className="text-xs font-medium flex-1 truncate">{sc.skill}</span>
                        {sc.strength && <span className="text-[10px] text-muted-foreground capitalize shrink-0">{sc.strength}</span>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Gaps */}
            {teamData.gaps?.length > 0 && (
              <Card className="border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-900/5">
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1.5">Skill Gaps — Consider Hiring or Training</p>
                      <div className="flex flex-wrap gap-1.5">
                        {teamData.gaps.map((g) => {
                          const name = typeof g === 'string' ? g : g.skill ?? g;
                          return <Badge key={name} className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-0">{name}</Badge>;
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Alternatives */}
            {teamData.alternativeCandidates?.length > 0 && (
              <div>
                <button
                  onClick={() => setShowAlternatives((v) => !v)}
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showAlternatives ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  {teamData.alternativeCandidates.length} Alternative Candidates Available
                </button>
                <AnimatePresence>
                  {showAlternatives && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden mt-3"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {teamData.alternativeCandidates.map((alt) => (
                          <Card key={alt.employee?._id ?? alt.employee?.name} className="border-dashed">
                            <CardContent className="p-3 flex items-center gap-3">
                              <Avatar className="w-9 h-9 shrink-0">
                                <AvatarImage src={getAvatarUrl(alt.employee?.name)} />
                                <AvatarFallback className="text-[10px] bg-muted">{getInitials(alt.employee?.name)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold truncate">{alt.employee?.name}</p>
                                <p className="text-[10px] text-muted-foreground truncate">
                                  {alt.alternativeFor ? `Alt. for ${alt.alternativeFor}` : alt.employee?.title}
                                </p>
                              </div>
                              {alt.fitScore !== undefined && (
                                <span className={`text-xs font-bold shrink-0 tabular-nums ${getMatchScoreColor(alt.fitScore)}`}>
                                  {alt.fitScore}%
                                </span>
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
