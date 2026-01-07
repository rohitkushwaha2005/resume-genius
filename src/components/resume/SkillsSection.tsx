import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Sparkles, Loader2, Lightbulb } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SkillsSectionProps {
  data: string[];
  onChange: (data: string[]) => void;
  jobRole?: string;
}

export const SkillsSection: React.FC<SkillsSectionProps> = ({
  data,
  onChange,
  jobRole,
}) => {
  const { toast } = useToast();
  const [newSkill, setNewSkill] = useState('');
  const [suggesting, setSuggesting] = useState(false);

  const addSkill = (skill: string) => {
    if (!skill.trim()) return;
    if (!data.includes(skill.trim())) {
      onChange([...data, skill.trim()]);
    }
    setNewSkill('');
  };

  const removeSkill = (skill: string) => {
    onChange(data.filter((s) => s !== skill));
  };

  const suggestSkills = async () => {
    if (!jobRole) {
      toast({
        title: 'Add your job title first',
        description: 'Add at least one experience with a position to get skill suggestions.',
        variant: 'destructive',
      });
      return;
    }

    setSuggesting(true);

    try {
      const { data: result, error } = await supabase.functions.invoke('ai-enhance', {
        body: {
          type: 'suggest-skills',
          context: { jobRole, existingSkills: data },
        },
      });

      if (error) throw error;

      if (result.skills && Array.isArray(result.skills)) {
        const newSkills = result.skills.filter((s: string) => !data.includes(s));
        onChange([...data, ...newSkills]);
        toast({
          title: 'Skills suggested!',
          description: `Added ${newSkills.length} new skills based on your role.`,
        });
      }
    } catch (error: any) {
      console.error('AI suggest error:', error);
      if (error.message?.includes('429')) {
        toast({
          title: 'Rate limit reached',
          description: 'Please wait a moment before trying again.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Failed to suggest skills',
          description: 'Unable to get suggestions. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setSuggesting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Skills</Label>
        <Button
          variant="outline"
          size="sm"
          onClick={suggestSkills}
          disabled={suggesting}
          className="text-primary"
        >
          {suggesting ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-1" />
          )}
          Suggest Skills
        </Button>
      </div>

      {data.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {data.map((skill) => (
            <Badge key={skill} variant="secondary" className="gap-1 py-1.5 px-3">
              {skill}
              <button
                onClick={() => removeSkill(skill)}
                className="ml-1 hover:text-destructive transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          placeholder="Add a skill (e.g., React, Python, Project Management)"
          value={newSkill}
          onChange={(e) => setNewSkill(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addSkill(newSkill);
            }
          }}
        />
        <Button type="button" variant="outline" onClick={() => addSkill(newSkill)}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {data.length === 0 && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-accent/50 text-sm text-muted-foreground">
          <Lightbulb className="h-4 w-4 mt-0.5 shrink-0" />
          <p>
            Add skills relevant to your target job. Use the "Suggest Skills" button
            to get AI-powered recommendations based on your experience.
          </p>
        </div>
      )}
    </div>
  );
};
