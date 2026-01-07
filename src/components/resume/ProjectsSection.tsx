import { Project } from '@/types/resume';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, FolderOpen, X } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';

interface ProjectsSectionProps {
  data: Project[];
  onChange: (data: Project[]) => void;
}

export const ProjectsSection: React.FC<ProjectsSectionProps> = ({
  data,
  onChange,
}) => {
  const [techInput, setTechInput] = useState<{ [key: string]: string }>({});

  const addProject = () => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      name: '',
      description: '',
      technologies: [],
      link: '',
    };
    onChange([...data, newProject]);
  };

  const updateProject = (id: string, field: keyof Project, value: any) => {
    onChange(
      data.map((proj) => (proj.id === id ? { ...proj, [field]: value } : proj))
    );
  };

  const removeProject = (id: string) => {
    onChange(data.filter((proj) => proj.id !== id));
  };

  const addTechnology = (projId: string, tech: string) => {
    if (!tech.trim()) return;
    const proj = data.find((p) => p.id === projId);
    if (proj && !proj.technologies.includes(tech.trim())) {
      updateProject(projId, 'technologies', [...proj.technologies, tech.trim()]);
    }
    setTechInput({ ...techInput, [projId]: '' });
  };

  const removeTechnology = (projId: string, tech: string) => {
    const proj = data.find((p) => p.id === projId);
    if (proj) {
      updateProject(
        projId,
        'technologies',
        proj.technologies.filter((t) => t !== tech)
      );
    }
  };

  return (
    <div className="space-y-4">
      {data.length === 0 ? (
        <div className="text-center py-8 rounded-lg border border-dashed border-border">
          <FolderOpen className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-muted-foreground mb-4">No projects added yet</p>
          <Button variant="outline" size="sm" onClick={addProject}>
            <Plus className="h-4 w-4 mr-2" />
            Add Project
          </Button>
        </div>
      ) : (
        <>
          {data.map((proj) => (
            <Card key={proj.id} className="relative">
              <CardContent className="pt-6">
                <div className="absolute top-4 right-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => removeProject(proj.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Project Name</Label>
                      <Input
                        placeholder="My Awesome Project"
                        value={proj.name}
                        onChange={(e) =>
                          updateProject(proj.id, 'name', e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Link (Optional)</Label>
                      <Input
                        placeholder="https://github.com/username/project"
                        value={proj.link || ''}
                        onChange={(e) =>
                          updateProject(proj.id, 'link', e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Describe your project, its purpose, and your role..."
                      value={proj.description}
                      onChange={(e) =>
                        updateProject(proj.id, 'description', e.target.value)
                      }
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Technologies Used</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {proj.technologies.map((tech) => (
                        <Badge key={tech} variant="secondary" className="gap-1">
                          {tech}
                          <button
                            onClick={() => removeTechnology(proj.id, tech)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add technology (e.g., React)"
                        value={techInput[proj.id] || ''}
                        onChange={(e) =>
                          setTechInput({ ...techInput, [proj.id]: e.target.value })
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTechnology(proj.id, techInput[proj.id] || '');
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => addTechnology(proj.id, techInput[proj.id] || '')}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          <Button variant="outline" onClick={addProject} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Another Project
          </Button>
        </>
      )}
    </div>
  );
};
