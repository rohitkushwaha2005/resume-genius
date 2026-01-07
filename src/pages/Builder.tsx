import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Resume, ResumeContent } from '@/types/resume';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  FileText,
  ArrowLeft,
  Download,
  Save,
  Loader2,
  User,
  FileTextIcon,
  GraduationCap,
  Briefcase,
  FolderOpen,
  Lightbulb,
  Eye,
} from 'lucide-react';
import { PersonalInfoSection } from '@/components/resume/PersonalInfoSection';
import { SummarySection } from '@/components/resume/SummarySection';
import { EducationSection } from '@/components/resume/EducationSection';
import { ExperienceSection } from '@/components/resume/ExperienceSection';
import { ProjectsSection } from '@/components/resume/ProjectsSection';
import { SkillsSection } from '@/components/resume/SkillsSection';
import { ResumePreview } from '@/components/resume/ResumePreview';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const Builder = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [resume, setResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchResume();
  }, [id]);

  const fetchResume = async () => {
    try {
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setResume({
        ...data,
        content: data.content as unknown as ResumeContent,
      });
    } catch (error) {
      console.error('Error fetching resume:', error);
      toast({
        title: 'Error',
        description: 'Failed to load resume. Please try again.',
        variant: 'destructive',
      });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const updateContent = useCallback((updates: Partial<ResumeContent>) => {
    if (!resume) return;
    setResume({
      ...resume,
      content: { ...resume.content, ...updates },
    });
    setHasChanges(true);
  }, [resume]);

  const updateTitle = (title: string) => {
    if (!resume) return;
    setResume({ ...resume, title });
    setHasChanges(true);
  };

  const saveResume = async () => {
    if (!resume) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('resumes')
        .update({
          title: resume.title,
          content: resume.content as any,
        })
        .eq('id', resume.id);

      if (error) throw error;

      setHasChanges(false);
      toast({
        title: 'Saved!',
        description: 'Your resume has been saved.',
      });
    } catch (error) {
      console.error('Error saving resume:', error);
      toast({
        title: 'Error',
        description: 'Failed to save resume. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const exportPDF = async () => {
    setExporting(true);
    
    try {
      // Dynamic import of html2pdf
      const html2pdf = (await import('html2pdf.js')).default;
      
      const element = document.getElementById('resume-preview');
      if (!element) {
        throw new Error('Preview element not found');
      }

      const opt = {
        margin: 0.5,
        filename: `${resume?.title || 'resume'}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in' as const, format: 'letter' as const, orientation: 'portrait' as const },
      };

      await html2pdf().set(opt).from(element).save();

      toast({
        title: 'PDF exported!',
        description: 'Your resume has been downloaded.',
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export failed',
        description: 'Unable to export PDF. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!resume) {
    return null;
  }

  const latestPosition = resume.content.experience?.[0]?.position;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Link>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
                <FileText className="h-4 w-4 text-primary-foreground" />
              </div>
              <Input
                value={resume.title}
                onChange={(e) => updateTitle(e.target.value)}
                className="max-w-[200px] font-medium border-transparent hover:border-border focus:border-border"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Mobile Preview Button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden">
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-xl overflow-auto p-0">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle>Resume Preview</SheetTitle>
                </SheetHeader>
                <div className="p-4">
                  <div className="shadow-lg rounded-lg overflow-hidden border border-border">
                    <ResumePreview content={resume.content} title={resume.title} />
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Button
              variant="outline"
              size="sm"
              onClick={saveResume}
              disabled={saving || !hasChanges}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              Save
            </Button>
            <Button size="sm" onClick={exportPDF} disabled={exporting}>
              {exporting ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-1" />
              )}
              Export PDF
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Editor */}
          <div className="space-y-6">
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
                <TabsTrigger value="personal" className="gap-1">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Personal</span>
                </TabsTrigger>
                <TabsTrigger value="summary" className="gap-1">
                  <FileTextIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Summary</span>
                </TabsTrigger>
                <TabsTrigger value="experience" className="gap-1">
                  <Briefcase className="h-4 w-4" />
                  <span className="hidden sm:inline">Experience</span>
                </TabsTrigger>
                <TabsTrigger value="education" className="gap-1">
                  <GraduationCap className="h-4 w-4" />
                  <span className="hidden sm:inline">Education</span>
                </TabsTrigger>
                <TabsTrigger value="projects" className="gap-1">
                  <FolderOpen className="h-4 w-4" />
                  <span className="hidden sm:inline">Projects</span>
                </TabsTrigger>
                <TabsTrigger value="skills" className="gap-1">
                  <Lightbulb className="h-4 w-4" />
                  <span className="hidden sm:inline">Skills</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PersonalInfoSection
                      data={resume.content.personalInfo}
                      onChange={(data) => updateContent({ personalInfo: data })}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="summary" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileTextIcon className="h-5 w-5 text-primary" />
                      Professional Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SummarySection
                      data={resume.content.summary}
                      onChange={(data) => updateContent({ summary: data })}
                      resumeContent={resume.content}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="experience" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-primary" />
                      Work Experience
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ExperienceSection
                      data={resume.content.experience}
                      onChange={(data) => updateContent({ experience: data })}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="education" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-primary" />
                      Education
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <EducationSection
                      data={resume.content.education}
                      onChange={(data) => updateContent({ education: data })}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="projects" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FolderOpen className="h-5 w-5 text-primary" />
                      Projects
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ProjectsSection
                      data={resume.content.projects}
                      onChange={(data) => updateContent({ projects: data })}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="skills" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-primary" />
                      Skills
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SkillsSection
                      data={resume.content.skills}
                      onChange={(data) => updateContent({ skills: data })}
                      jobRole={latestPosition}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Preview - Desktop Only */}
          <div className="hidden lg:block sticky top-24 h-fit">
            <Card className="overflow-hidden">
              <CardHeader className="bg-muted/50 py-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Live Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 max-h-[calc(100vh-180px)] overflow-auto">
                <div className="transform scale-[0.7] origin-top-left w-[142.85%]">
                  <ResumePreview content={resume.content} title={resume.title} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Builder;
