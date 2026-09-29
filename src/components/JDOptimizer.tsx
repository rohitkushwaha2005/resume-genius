import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { aiClient, errorMessage } from '@/lib/ai-client';
import { resumeToText } from '@/lib/ats-score';
import { matchKeywords, type KeywordMatch } from '@/lib/text-match';
import { useToast } from '@/hooks/use-toast';
import { ResumeContent } from '@/types/resume';
import {
  FileSearch,
  Loader2,
  Sparkles,
  CheckCircle2,
  X,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface JDOptimizerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: ResumeContent;
  onApply: (updates: Partial<ResumeContent>) => void;
}

interface OptimizedSection {
  id: string;
  label: string;
  original: string;
  optimized: string;
  /** For the skills section, the list itself (so skills containing commas survive). */
  skills?: string[];
  accepted: boolean;
}

export const JDOptimizer: React.FC<JDOptimizerProps> = ({
  open,
  onOpenChange,
  content,
  onApply,
}) => {
  const { toast } = useToast();
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState<OptimizedSection[]>([]);
  const [step, setStep] = useState<'input' | 'review'>('input');
  const [keywords, setKeywords] = useState<KeywordMatch | null>(null);

  const handleOptimize = async () => {
    if (!jobDescription.trim()) {
      toast({
        title: 'Job description required',
        description: 'Please paste a job description to optimize your resume.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Keyword coverage is computed locally with fixed rules; only the rewrite uses AI.
      setKeywords(matchKeywords(jobDescription, resumeToText(content), content.skills));
      const data = await aiClient.tailorToJob(jobDescription, content);

      const optimizedSections: OptimizedSection[] = [];

      if (data.summary && data.summary !== content.summary) {
        optimizedSections.push({
          id: 'summary',
          label: 'Professional Summary',
          original: content.summary || 'No summary',
          optimized: data.summary,
          accepted: true,
        });
      }

      const skillsChanged =
        data.skills.length > 0 &&
        (data.skills.length !== content.skills.length || data.skills.some((s, i) => s !== content.skills[i]));
      if (skillsChanged) {
        optimizedSections.push({
          id: 'skills',
          label: 'Skills (reordered by relevance)',
          original: content.skills.join(', ') || 'No skills',
          optimized: data.skills.join(', '),
          skills: data.skills,
          accepted: true,
        });
      }

      setSections(optimizedSections);
      setStep('review');
    } catch (error) {
      toast({
        title: 'Optimization failed',
        description: errorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (id: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, accepted: !s.accepted } : s))
    );
  };

  const applyChanges = () => {
    const updates: Partial<ResumeContent> = {};

    sections.forEach((section) => {
      if (section.accepted) {
        if (section.id === 'summary') {
          updates.summary = section.optimized;
        } else if (section.id === 'skills') {
          updates.skills = section.skills ?? [];
        }
      }
    });

    if (Object.keys(updates).length > 0) {
      onApply(updates);
      toast({
        title: 'Optimizations applied',
        description: 'Your resume has been updated based on the job description.',
      });
    }

    handleClose();
  };

  const handleClose = () => {
    setJobDescription('');
    setSections([]);
    setKeywords(null);
    setStep('input');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <FileSearch className="h-5 w-5 text-primary" />
            Job Description Optimizer
          </DialogTitle>
          <DialogDescription>
            {step === 'input'
              ? 'Paste a job description to get AI-powered suggestions to tailor your resume.'
              : 'Review and accept the suggested optimizations for your resume.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'input' ? (
          <div className="space-y-4 mt-4">
            <Textarea
              placeholder="Paste the job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="min-h-[200px] resize-none"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleOptimize} disabled={loading || !jobDescription.trim()}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Optimize Resume
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            {keywords && <KeywordReport match={keywords} />}
            {sections.length === 0 && (
              <p className="text-sm text-muted-foreground">
                The AI had no changes to suggest for your summary or skills.
              </p>
            )}
            {sections.map((section) => (
              <div
                key={section.id}
                className={cn(
                  'border rounded-lg p-4 transition-all',
                  section.accepted
                    ? 'border-primary bg-accent/30'
                    : 'border-border bg-muted/30 opacity-60'
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={section.id}
                      checked={section.accepted}
                      onCheckedChange={() => toggleSection(section.id)}
                    />
                    <label htmlFor={section.id} className="font-medium text-sm cursor-pointer">
                      {section.label}
                    </label>
                  </div>
                  <Badge variant={section.accepted ? 'default' : 'secondary'}>
                    {section.accepted ? 'Accepted' : 'Rejected'}
                  </Badge>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Before</p>
                    <p className="text-sm text-foreground/80 bg-muted rounded-md p-2 line-clamp-4">
                      {section.original}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-primary">After (Optimized)</p>
                    <p className="text-sm text-foreground bg-primary/5 rounded-md p-2 line-clamp-4 border border-primary/20">
                      {section.optimized}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep('input')}>
                Back
              </Button>
              <Button onClick={applyChanges} disabled={!sections.some((s) => s.accepted)} className={cn(sections.length === 0 && 'hidden')}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Apply {sections.filter((s) => s.accepted).length} Changes
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const KeywordReport: React.FC<{ match: KeywordMatch }> = ({ match }) => (
  <div className="border rounded-lg p-4 space-y-3">
    <div className="flex items-center justify-between">
      <p className="font-medium text-sm">Keyword match</p>
      <Badge variant="secondary">
        {match.coverage === null ? 'No known keywords found' : `${match.coverage}% of job keywords`}
      </Badge>
    </div>
    {match.matched.length > 0 && (
      <div className="flex flex-wrap gap-1.5">
        {match.matched.map((k) => (
          <Badge key={k} variant="outline" className="border-green-500/50 text-green-700 dark:text-green-400">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            {k}
          </Badge>
        ))}
      </div>
    )}
    {match.missing.length > 0 && (
      <div className="space-y-1.5">
        <div className="flex flex-wrap gap-1.5">
          {match.missing.map((k) => (
            <Badge key={k} variant="outline" className="border-destructive/50 text-destructive">
              <X className="mr-1 h-3 w-3" />
              {k}
            </Badge>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Missing from your resume. Add a keyword only if you genuinely have that skill.
        </p>
      </div>
    )}
  </div>
);

// FAB Component
export const JDOptimizerFAB: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  return (
    <Button
      onClick={onClick}
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg shadow-primary/20 gradient-primary hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 z-50"
      size="icon"
      title="Optimize for Job Description"
    >
      <FileSearch className="h-6 w-6" />
    </Button>
  );
};
