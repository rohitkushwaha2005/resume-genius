import { useMemo, useState } from 'react';
import { ResumeContent } from '@/types/resume';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { aiClient, errorMessage } from '@/lib/ai-client';
import { scoreResume } from '@/lib/ats-score';
import {
  Target,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Circle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResumeScoreProps {
  content: ResumeContent;
}

interface Feedback {
  strengths: string[];
  improvements: string[];
  suggestions: string[];
}

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-600 dark:text-green-400';
  if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
};

const getScoreLabel = (score: number) => {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Needs Work';
};

const FeedbackList: React.FC<{ title: string; items: string[]; icon: React.ReactNode }> = ({ title, items, icon }) =>
  items.length === 0 ? null : (
    <div>
      <h4 className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
        {icon}
        {title}
      </h4>
      <ul className="space-y-1">
        {items.map((item, idx) => (
          <li key={idx} className="text-sm text-muted-foreground pl-6">
            • {item}
          </li>
        ))}
      </ul>
    </div>
  );

/**
 * The score is computed locally by fixed rules (see lib/ats-score.ts), so it updates as the user
 * types and is always the same for the same resume. AI feedback is optional written advice.
 */
export const ResumeScore: React.FC<ResumeScoreProps> = ({ content }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const { score, checks } = useMemo(() => scoreResume(content), [content]);
  const allPassed = checks.every((c) => c.points === c.maxPoints);

  const getFeedback = async () => {
    setLoading(true);
    try {
      setFeedback(await aiClient.reviewResume(content));
    } catch (error) {
      toast({ title: 'Feedback unavailable', description: errorMessage(error), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border overflow-hidden">
      <CardHeader
        className="cursor-pointer hover:bg-muted/50 transition-colors py-3"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-5 w-5 text-primary" />
            Resume Score & Feedback
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={cn('font-bold', getScoreColor(score))}>
              {score}/100
            </Badge>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4 pt-0 animate-fade-in">
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
            <div className="relative">
              <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="stroke-muted-foreground/20"
                  strokeWidth="3"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={cn(
                    'transition-all duration-700 ease-out',
                    score >= 80 ? 'stroke-green-500' : score >= 60 ? 'stroke-yellow-500' : 'stroke-red-500',
                  )}
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={`${score}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={cn('text-xl font-bold', getScoreColor(score))}>{score}</span>
              </div>
            </div>
            <div>
              <p className="font-semibold text-foreground">{getScoreLabel(score)}</p>
              <p className="text-sm text-muted-foreground">Based on {checks.length} resume best-practice checks</p>
            </div>
          </div>

          <ul className="space-y-1.5">
            {checks.map((check) => {
              const done = check.points === check.maxPoints;
              return (
                <li key={check.id} className="flex items-start gap-2 text-sm">
                  {done ? (
                    <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-green-500" />
                  ) : (
                    <Circle className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                  )}
                  <div className="flex-1">
                    <div className="flex justify-between gap-2">
                      <span className={done ? 'text-muted-foreground' : 'text-foreground'}>{check.label}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {check.points}/{check.maxPoints}
                      </span>
                    </div>
                    {!done && <p className="text-xs text-muted-foreground">{check.tip}</p>}
                  </div>
                </li>
              );
            })}
          </ul>
          {allPassed && <p className="text-sm text-green-600 dark:text-green-400">Every check passes. Nice work!</p>}

          <div className="border-t border-border pt-4 space-y-4">
            {feedback && (
              <>
                <FeedbackList title="Strengths" items={feedback.strengths} icon={<CheckCircle2 className="h-4 w-4 text-green-500" />} />
                <FeedbackList title="Areas to Improve" items={feedback.improvements} icon={<AlertCircle className="h-4 w-4 text-yellow-500" />} />
                <FeedbackList title="Suggestions" items={feedback.suggestions} icon={<Lightbulb className="h-4 w-4 text-primary" />} />
              </>
            )}
            <Button variant="outline" size="sm" onClick={getFeedback} disabled={loading} className="w-full">
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : feedback ? (
                <RefreshCw className="mr-2 h-4 w-4" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {feedback ? 'Refresh AI Feedback' : 'Get AI Feedback'}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
