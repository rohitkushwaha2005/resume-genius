import { useMemo, useState } from 'react';
import { ResumeContent } from '@/types/resume';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContentWarningsProps {
  content: ResumeContent;
  onFixWithAI?: (warningType: string, section: string) => void;
  isFixing?: boolean;
}

interface Warning {
  id: string;
  type: 'weak-words' | 'long-text' | 'missing-metrics' | 'length' | 'missing-section';
  severity: 'warning' | 'info';
  message: string;
  section: string;
  fixable: boolean;
}

const WEAK_WORDS = [
  'helped',
  'assisted',
  'worked on',
  'responsible for',
  'duties included',
  'was in charge of',
  'participated in',
];

const detectWeakWords = (text: string): string[] => {
  const lower = text.toLowerCase();
  return WEAK_WORDS.filter((word) => lower.includes(word));
};

const hasMetrics = (text: string): boolean => {
  return /\d+%?|\$\d+|#\d+|\d+\+?\s*(users|customers|clients|projects|sales|revenue)/i.test(
    text
  );
};

export const ContentWarnings: React.FC<ContentWarningsProps> = ({
  content,
  onFixWithAI,
  isFixing,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const warnings = useMemo(() => {
    const result: Warning[] = [];

    // Check summary
    if (!content.summary || content.summary.length < 50) {
      result.push({
        id: 'summary-missing',
        type: 'missing-section',
        severity: 'warning',
        message: 'Professional summary is missing or too short',
        section: 'summary',
        fixable: true,
      });
    } else if (content.summary.length > 400) {
      result.push({
        id: 'summary-long',
        type: 'long-text',
        severity: 'info',
        message: 'Summary is quite long. Consider keeping it under 3-4 sentences.',
        section: 'summary',
        fixable: false,
      });
    }

    // Check experience bullets
    content.experience.forEach((exp, idx) => {
      exp.description.forEach((bullet, bulletIdx) => {
        if (!bullet.trim()) return;

        const weakWords = detectWeakWords(bullet);
        if (weakWords.length > 0) {
          result.push({
            id: `exp-${idx}-bullet-${bulletIdx}-weak`,
            type: 'weak-words',
            severity: 'warning',
            message: `"${exp.position}" uses weak words: ${weakWords.join(', ')}`,
            section: 'experience',
            fixable: true,
          });
        }

        if (!hasMetrics(bullet) && bullet.length > 20) {
          result.push({
            id: `exp-${idx}-bullet-${bulletIdx}-metrics`,
            type: 'missing-metrics',
            severity: 'info',
            message: `"${exp.position}" bullet lacks quantified achievements`,
            section: 'experience',
            fixable: true,
          });
        }

        if (bullet.length > 150) {
          result.push({
            id: `exp-${idx}-bullet-${bulletIdx}-long`,
            type: 'long-text',
            severity: 'info',
            message: `"${exp.position}" has a very long bullet point`,
            section: 'experience',
            fixable: false,
          });
        }
      });
    });

    // Check skills count
    if (content.skills.length < 5) {
      result.push({
        id: 'skills-few',
        type: 'missing-section',
        severity: 'warning',
        message: 'Consider adding more skills (at least 5-8 recommended)',
        section: 'skills',
        fixable: true,
      });
    }

    // Check education
    if (content.education.length === 0) {
      result.push({
        id: 'education-missing',
        type: 'missing-section',
        severity: 'info',
        message: 'No education listed. Add if applicable.',
        section: 'education',
        fixable: false,
      });
    }

    // Check overall resume length (rough estimate)
    const totalBullets = content.experience.reduce(
      (acc, exp) => acc + exp.description.filter((d) => d.trim()).length,
      0
    );
    if (totalBullets > 15) {
      result.push({
        id: 'too-long',
        type: 'length',
        severity: 'info',
        message: 'Resume may be too long. Focus on most relevant experience.',
        section: 'experience',
        fixable: false,
      });
    }

    return result;
  }, [content]);

  if (warnings.length === 0) {
    return null;
  }

  const warningCount = warnings.filter((w) => w.severity === 'warning').length;
  const infoCount = warnings.filter((w) => w.severity === 'info').length;

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden animate-fade-in">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <span className="text-sm font-medium text-foreground">Content Warnings</span>
          <div className="flex gap-1">
            {warningCount > 0 && (
              <Badge variant="destructive" className="text-xs px-1.5 py-0">
                {warningCount}
              </Badge>
            )}
            {infoCount > 0 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                {infoCount}
              </Badge>
            )}
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 space-y-2 max-h-[200px] overflow-y-auto">
          {warnings.slice(0, 5).map((warning) => (
            <div
              key={warning.id}
              className={cn(
                'flex items-start justify-between gap-2 p-2 rounded-md text-sm',
                warning.severity === 'warning'
                  ? 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              <p className="flex-1">{warning.message}</p>
              {warning.fixable && onFixWithAI && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 h-7 px-2 text-xs"
                  onClick={() => onFixWithAI(warning.type, warning.section)}
                  disabled={isFixing}
                >
                  {isFixing ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3 mr-1" />
                      Fix
                    </>
                  )}
                </Button>
              )}
            </div>
          ))}
          {warnings.length > 5 && (
            <p className="text-xs text-muted-foreground text-center">
              +{warnings.length - 5} more warnings
            </p>
          )}
        </div>
      )}
    </div>
  );
};
