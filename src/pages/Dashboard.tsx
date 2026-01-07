import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Resume, ResumeContent } from '@/types/resume';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  FileText,
  Plus,
  Edit3,
  Trash2,
  LogOut,
  Clock,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { ThemeToggle } from '@/components/ThemeToggle';
import { RoleSelector, ResumeRole } from '@/components/RoleSelector';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const transformedResumes: Resume[] = (data || []).map((resume: any) => ({
        ...resume,
        content: resume.content as ResumeContent,
      }));

      setResumes(transformedResumes);
    } catch (error) {
      console.error('Error fetching resumes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load resumes. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createNewResume = async (role: ResumeRole) => {
    setCreating(true);
    try {
      const defaultContent: ResumeContent & { role?: ResumeRole } = {
        personalInfo: {
          fullName: '',
          email: user?.email || '',
          phone: '',
          linkedin: '',
          location: '',
        },
        summary: '',
        education: [],
        experience: [],
        projects: [],
        skills: [],
        role,
      };

      const { data, error } = await supabase
        .from('resumes')
        .insert({
          user_id: user?.id,
          title: 'Untitled Resume',
          content: defaultContent as any,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Resume created',
        description: 'Your new resume has been created.',
      });

      navigate(`/builder/${data.id}`);
    } catch (error) {
      console.error('Error creating resume:', error);
      toast({
        title: 'Error',
        description: 'Failed to create resume. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleCreateClick = () => {
    setRoleModalOpen(true);
  };

  const handleRoleSelect = (role: ResumeRole) => {
    createNewResume(role);
  };

  const deleteResume = async (id: string) => {
    try {
      const { error } = await supabase.from('resumes').delete().eq('id', id);

      if (error) throw error;

      setResumes(resumes.filter((r) => r.id !== id));
      toast({
        title: 'Resume deleted',
        description: 'Your resume has been deleted.',
      });
    } catch (error) {
      console.error('Error deleting resume:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete resume. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
              <FileText className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">ResumeAI</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user?.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">My Resumes</h1>
            <p className="text-muted-foreground">Manage and edit your resumes</p>
          </div>
          <Button onClick={handleCreateClick} disabled={creating} size="lg">
            {creating ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Plus className="mr-2 h-5 w-5" />
            )}
            Create New Resume
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : resumes.length === 0 ? (
          <Card className="text-center py-16 animate-fade-in">
            <CardContent>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent">
                <FileText className="h-8 w-8 text-accent-foreground" />
              </div>
              <h3 className="mb-2 font-display text-xl font-semibold text-foreground">
                No resumes yet
              </h3>
              <p className="mb-6 text-muted-foreground">
                Create your first resume to get started
              </p>
              <Button onClick={handleCreateClick} disabled={creating}>
                {creating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Create Your First Resume
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {resumes.map((resume, index) => (
              <Card
                key={resume.id}
                className="group transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground group-hover:gradient-primary group-hover:text-primary-foreground transition-colors">
                      <FileText className="h-5 w-5" />
                    </div>
                  </div>
                  <CardTitle className="font-display text-lg line-clamp-1">
                    {resume.title}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Updated {format(new Date(resume.updated_at), 'MMM d, yyyy')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {resume.content.personalInfo.fullName || 'No name set'} •{' '}
                    {resume.content.experience?.length || 0} experience(s) •{' '}
                    {resume.content.skills?.length || 0} skill(s)
                  </p>
                </CardContent>
                <CardFooter className="gap-2">
                  <Link to={`/builder/${resume.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      <Edit3 className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  </Link>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="icon" className="shrink-0 text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Resume</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{resume.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteResume(resume.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Role Selector Modal */}
      <RoleSelector
        open={roleModalOpen}
        onOpenChange={setRoleModalOpen}
        onSelectRole={handleRoleSelect}
      />
    </div>
  );
};

export default Dashboard;
