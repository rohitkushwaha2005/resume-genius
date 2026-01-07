import { Experience } from '@/types/resume';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Briefcase, Sparkles, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ExperienceSectionProps {
  data: Experience[];
  onChange: (data: Experience[]) => void;
}

export const ExperienceSection: React.FC<ExperienceSectionProps> = ({
  data,
  onChange,
}) => {
  const { toast } = useToast();
  const [improvingId, setImprovingId] = useState<string | null>(null);

  const addExperience = () => {
    const newExperience: Experience = {
      id: crypto.randomUUID(),
      company: '',
      position: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: [''],
    };
    onChange([...data, newExperience]);
  };

  const updateExperience = (id: string, field: keyof Experience, value: any) => {
    onChange(
      data.map((exp) => (exp.id === id ? { ...exp, [field]: value } : exp))
    );
  };

  const removeExperience = (id: string) => {
    onChange(data.filter((exp) => exp.id !== id));
  };

  const updateBullet = (expId: string, index: number, value: string) => {
    const exp = data.find((e) => e.id === expId);
    if (exp) {
      const newDescription = [...exp.description];
      newDescription[index] = value;
      updateExperience(expId, 'description', newDescription);
    }
  };

  const addBullet = (expId: string) => {
    const exp = data.find((e) => e.id === expId);
    if (exp) {
      updateExperience(expId, 'description', [...exp.description, '']);
    }
  };

  const removeBullet = (expId: string, index: number) => {
    const exp = data.find((e) => e.id === expId);
    if (exp && exp.description.length > 1) {
      const newDescription = exp.description.filter((_, i) => i !== index);
      updateExperience(expId, 'description', newDescription);
    }
  };

  const improveWithAI = async (expId: string) => {
    const exp = data.find((e) => e.id === expId);
    if (!exp) return;

    const bulletPoints = exp.description.filter((b) => b.trim()).join('\n');
    if (!bulletPoints) {
      toast({
        title: 'No content to improve',
        description: 'Please add some bullet points first.',
        variant: 'destructive',
      });
      return;
    }

    setImprovingId(expId);

    try {
      const { data: result, error } = await supabase.functions.invoke('ai-enhance', {
        body: {
          type: 'improve-experience',
          content: bulletPoints,
          context: { position: exp.position, company: exp.company },
        },
      });

      if (error) throw error;

      if (result.improved) {
        const improvedBullets = result.improved.split('\n').filter((b: string) => b.trim());
        updateExperience(expId, 'description', improvedBullets);
        toast({
          title: 'Content improved!',
          description: 'Your experience bullets have been enhanced.',
        });
      }
    } catch (error: any) {
      console.error('AI enhance error:', error);
      if (error.message?.includes('429')) {
        toast({
          title: 'Rate limit reached',
          description: 'Please wait a moment before trying again.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Failed to improve',
          description: 'Unable to enhance content. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setImprovingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {data.length === 0 ? (
        <div className="text-center py-8 rounded-lg border border-dashed border-border">
          <Briefcase className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-muted-foreground mb-4">No experience added yet</p>
          <Button variant="outline" size="sm" onClick={addExperience}>
            <Plus className="h-4 w-4 mr-2" />
            Add Experience
          </Button>
        </div>
      ) : (
        <>
          {data.map((exp) => (
            <Card key={exp.id} className="relative">
              <CardContent className="pt-6">
                <div className="absolute top-4 right-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => improveWithAI(exp.id)}
                    disabled={improvingId === exp.id}
                    className="text-primary"
                  >
                    {improvingId === exp.id ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-1" />
                    )}
                    Improve with AI
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => removeExperience(exp.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Company</Label>
                      <Input
                        placeholder="Company Name"
                        value={exp.company}
                        onChange={(e) =>
                          updateExperience(exp.id, 'company', e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Position</Label>
                      <Input
                        placeholder="Software Engineer"
                        value={exp.position}
                        onChange={(e) =>
                          updateExperience(exp.id, 'position', e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Input
                        placeholder="San Francisco, CA"
                        value={exp.location}
                        onChange={(e) =>
                          updateExperience(exp.id, 'location', e.target.value)
                        }
                      />
                    </div>
                    <div className="flex items-center space-x-2 pt-8">
                      <Checkbox
                        id={`current-${exp.id}`}
                        checked={exp.current}
                        onCheckedChange={(checked) =>
                          updateExperience(exp.id, 'current', checked)
                        }
                      />
                      <Label htmlFor={`current-${exp.id}`}>Currently working here</Label>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        placeholder="Jan 2022"
                        value={exp.startDate}
                        onChange={(e) =>
                          updateExperience(exp.id, 'startDate', e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        placeholder={exp.current ? 'Present' : 'Dec 2023'}
                        value={exp.current ? 'Present' : exp.endDate}
                        onChange={(e) =>
                          updateExperience(exp.id, 'endDate', e.target.value)
                        }
                        disabled={exp.current}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Responsibilities & Achievements</Label>
                    {exp.description.map((bullet, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder="Describe your responsibility or achievement..."
                          value={bullet}
                          onChange={(e) =>
                            updateBullet(exp.id, index, e.target.value)
                          }
                        />
                        {exp.description.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0"
                            onClick={() => removeBullet(exp.id, index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => addBullet(exp.id)}
                      className="text-muted-foreground"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add bullet point
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          <Button variant="outline" onClick={addExperience} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Another Experience
          </Button>
        </>
      )}
    </div>
  );
};
