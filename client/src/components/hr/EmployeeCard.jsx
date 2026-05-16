import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Briefcase, ArrowRight, Lightbulb, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { getInitials, getAvatarUrl, getProficiencyColor, getMatchScoreColor, getMatchScoreBg } from '@/lib/utils';

export default function EmployeeCard({ employee, matchScore, matchLevel, keyStrengths, reasoning }) {
  const topSkills = (employee?.skills ?? []).filter((s) => !s.inferred).slice(0, 4);
  const isAvailable = employee?.availability?.isAvailable;

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}>
      <Card className="group transition-all duration-200 hover:shadow-card-premium-hover hover:border-primary/20 flex flex-col h-full">
        <CardContent className="p-5 flex flex-col gap-3.5 flex-1">

          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="relative shrink-0">
              <Avatar className="w-11 h-11 ring-2 ring-border group-hover:ring-primary/20 transition-all">
                <AvatarImage src={getAvatarUrl(employee.name)} alt={employee.name} />
                <AvatarFallback className="bg-primary/8 text-primary font-semibold text-xs">
                  {getInitials(employee.name)}
                </AvatarFallback>
              </Avatar>
              {isAvailable && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-card" title="Available" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">{employee.name}</h3>
              <p className="text-xs text-muted-foreground truncate">{employee.title || 'No title set'}</p>
              {employee.department && (
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">{employee.department}</p>
              )}
            </div>
            {matchScore !== undefined && (
              <div className="text-right shrink-0">
                <div className={`text-2xl font-black tabular-nums leading-none ${getMatchScoreColor(matchScore)}`}>
                  {matchScore}<span className="text-xs font-semibold">%</span>
                </div>
                {matchLevel && <div className="text-[10px] text-muted-foreground mt-0.5 capitalize">{matchLevel}</div>}
              </div>
            )}
          </div>

          {/* Match bar */}
          {matchScore !== undefined && (
            <Progress value={matchScore} className="h-1" indicatorClassName={getMatchScoreBg(matchScore)} />
          )}

          {/* Meta */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            {employee.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span className="truncate max-w-[100px]">{employee.location}</span>
              </div>
            )}
            {(employee.totalYearsExperience ?? 0) > 0 && (
              <div className="flex items-center gap-1">
                <Briefcase className="w-3 h-3" />
                <span>{employee.totalYearsExperience}y exp</span>
              </div>
            )}
            {isAvailable && <Badge variant="success" className="text-[10px] h-4 px-1.5">Available</Badge>}
          </div>

          {/* Skills */}
          {topSkills.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {topSkills.map((skill) => (
                <span key={skill.name} className={`px-2 py-0.5 rounded-full text-xs font-medium ${getProficiencyColor(skill.proficiency)}`}>
                  {skill.name}
                </span>
              ))}
              {(employee.skills?.length ?? 0) > 4 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                  +{employee.skills.length - 4}
                </span>
              )}
            </div>
          )}

          {/* AI Reasoning */}
          {reasoning && (
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-primary mb-1.5">
                <Lightbulb className="w-3 h-3" />
                AI Analysis
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{reasoning}</p>
            </div>
          )}

          {/* Key strengths */}
          {keyStrengths?.length > 0 && (
            <div className="space-y-1">
              {keyStrengths.slice(0, 2).map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-3 h-3 mt-0.5 shrink-0 text-emerald-500" />
                  <span className="leading-relaxed">{s}</span>
                </div>
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="mt-auto pt-3 border-t border-border">
            <Link
              to={`/hr/directory/${employee._id}`}
              className="flex items-center justify-between text-xs font-medium text-primary group-hover:gap-2 transition-all gap-1"
            >
              View full profile
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

        </CardContent>
      </Card>
    </motion.div>
  );
}
