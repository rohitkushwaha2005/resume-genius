import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Loader2, Lightbulb } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ResumeContent } from '@/types/resume';

interface SummarySectionProps {
  data: string;
  onChange: (data: string) => void;
  resumeContent: ResumeContent;
}

export const SummarySection: React.FC<SummarySectionProps> = ({
  data,
  onChange,
  resumeContent,
}) => {
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);

  const generateSummary = async () => {
    const latestExperience = resumeContent.experience?.[0];
    const skills = resumeContent.skills || [];

    if (!latestExperience?.position && skills.length === 0) {
      toast({
        title: 'Add some details first',
        description: 'Add your experience or skills to generate a personalized summary.',
        variant: 'destructive',
      });
      return;
    }

    setGenerating(true);

    try {
      const { data: result, error } = await supabase.functions.invoke('ai-enhance', {
        body: {
          type: 'generate-summary',
          context: {
            name: resumeContent.personalInfo.fullName,
            position: latestExperience?.position || 'Professional',
            skills: skills.slice(0, 10),
            yearsExperience: resumeContent.experience?.length || 0,
          },
        },
      });

      if (error) throw error;

      if (result.summary) {
        onChange(result.summary);
        toast({
          title: 'Summary generated!',
          description: 'Your professional summary has been created.',
        });
      }
    } catch (error: any) {
      console.error('AI generate error:', error);
      if (error.message?.includes('429')) {
        toast({
          title: 'Rate limit reached',
          description: 'Please wait a moment before trying again.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Failed to generate summary',
          description: 'Unable to create summary. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="summary">Professional Summary</Label>
        <Button
          variant="outline"
          size="sm"
          onClick={generateSummary}
          disabled={generating}
          className="text-primary"
        >
          {generating ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-1" />
          )}
          Generate with AI
        </Button>
      </div>

      <Textarea
        id="summary"
        placeholder="Write a brief professional summary highlighting your experience, skills, and career goals..."
        value={data}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="resize-none"
      />

      {!data && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-accent/50 text-sm text-muted-foreground">
          <Lightbulb className="h-4 w-4 mt-0.5 shrink-0" />
          <p>
            A strong summary is 2-4 sentences highlighting your experience, key skills,
            and what you bring to the role. Use the AI button to generate one based on
            your profile.
          </p>
        </div>
      )}
    </div>
  );
};
