import { useState } from 'react';
import { ResumeContent } from '@/types/resume';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResumeScoreProps {
  content: ResumeContent;
}

interface ScoreResult {
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

export const ResumeScore: React.FC<ResumeScoreProps> = ({ content }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [scoreData, setScoreData] = useState<ScoreResult | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const analyzeResume = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-enhance', {
        body: {
          type: 'analyze-resume',
          content: JSON.stringify(content),
          context: {
            personalInfo: content.personalInfo,
            experienceCount: content.experience.length,
            educationCount: content.education.length,
            skillsCount: content.skills.length,
            hasProjects: content.projects.length > 0,
            hasSummary: !!content.summary,
          },
        },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setScoreData(data);
      toast({
        title: 'Analysis complete',
        description: `Your resume scored ${data.score}/100`,
      });
    } catch (error) {
      console.error('Resume analysis error:', error);
      toast({
        title: 'Analysis failed',
        description: 'Unable to analyze resume. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

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
            {scoreData && (
              <Badge
                variant="secondary"
                className={cn('font-bold', getScoreColor(scoreData.score))}
              >
                {scoreData.score}/100
              </Badge>
            )}
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
          {!scoreData ? (
            <div className="text-center py-6">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent">
                <Sparkles className="h-7 w-7 text-accent-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Get AI-powered feedback on your resume's ATS compatibility, strengths, and areas for improvement.
              </p>
              <Button onClick={analyzeResume} disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Target className="mr-2 h-4 w-4" />
                )}
                Analyze Resume
              </Button>
            </div>
          ) : (
            <>
              {/* Score Display */}
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
                        'transition-all duration-1000 ease-out',
                        scoreData.score >= 80
                          ? 'stroke-green-500'
                          : scoreData.score >= 60
                          ? 'stroke-yellow-500'
                          : 'stroke-red-500'
                      )}
                      strokeWidth="3"
                      strokeLinecap="round"
                      fill="none"
                      strokeDasharray={`${scoreData.score}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={cn('text-xl font-bold', getScoreColor(scoreData.score))}>
                      {scoreData.score}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{getScoreLabel(scoreData.score)}</p>
                  <p className="text-sm text-muted-foreground">ATS Compatibility Score</p>
                </div>
              </div>

              {/* Strengths */}
              {scoreData.strengths.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Strengths
                  </h4>
                  <ul className="space-y-1">
                    {scoreData.strengths.map((strength, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground pl-6">
                        • {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Weaknesses */}
              {scoreData.weaknesses.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    Areas to Improve
                  </h4>
                  <ul className="space-y-1">
                    {scoreData.weaknesses.map((weakness, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground pl-6">
                        • {weakness}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggestions */}
              {scoreData.suggestions.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    Suggestions
                  </h4>
                  <ul className="space-y-1">
                    {scoreData.suggestions.map((suggestion, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground pl-6">
                        • {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Re-analyze button */}
              <Button
                variant="outline"
                size="sm"
                onClick={analyzeResume}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Re-analyze Resume
              </Button>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
};
