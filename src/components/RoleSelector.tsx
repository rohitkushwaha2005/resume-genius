import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Code,
  Server,
  Layers,
  BarChart3,
  GraduationCap,
  Briefcase,
} from 'lucide-react';

export type ResumeRole =
  | 'frontend'
  | 'backend'
  | 'fullstack'
  | 'data-analyst'
  | 'fresher'
  | 'general';

interface RoleSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectRole: (role: ResumeRole) => void;
  currentRole?: ResumeRole;
}

const roles = [
  {
    id: 'frontend' as const,
    label: 'Frontend Developer',
    description: 'React, Vue, Angular, UI/UX',
    icon: Code,
    keywords: ['React', 'TypeScript', 'CSS', 'JavaScript', 'Vue.js', 'Angular'],
  },
  {
    id: 'backend' as const,
    label: 'Backend Developer',
    description: 'APIs, Databases, Server-side',
    icon: Server,
    keywords: ['Node.js', 'Python', 'Java', 'SQL', 'REST APIs', 'Docker'],
  },
  {
    id: 'fullstack' as const,
    label: 'Full Stack Developer',
    description: 'End-to-end development',
    icon: Layers,
    keywords: ['React', 'Node.js', 'PostgreSQL', 'TypeScript', 'AWS', 'Docker'],
  },
  {
    id: 'data-analyst' as const,
    label: 'Data Analyst',
    description: 'Analytics, SQL, Visualization',
    icon: BarChart3,
    keywords: ['Python', 'SQL', 'Tableau', 'Excel', 'Power BI', 'Statistics'],
  },
  {
    id: 'fresher' as const,
    label: 'Fresher / Student',
    description: 'Entry-level, Internships',
    icon: GraduationCap,
    keywords: ['Problem Solving', 'Quick Learner', 'Team Player', 'Communication'],
  },
  {
    id: 'general' as const,
    label: 'General / Other',
    description: 'Custom role, flexible format',
    icon: Briefcase,
    keywords: [],
  },
];

export const getRoleKeywords = (role: ResumeRole): string[] => {
  return roles.find((r) => r.id === role)?.keywords || [];
};

export const getRoleLabel = (role: ResumeRole): string => {
  return roles.find((r) => r.id === role)?.label || 'General';
};

export const RoleSelector: React.FC<RoleSelectorProps> = ({
  open,
  onOpenChange,
  onSelectRole,
  currentRole,
}) => {
  const [selectedRole, setSelectedRole] = useState<ResumeRole>(currentRole || 'general');

  const handleConfirm = () => {
    onSelectRole(selectedRole);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Choose Your Role</DialogTitle>
          <DialogDescription>
            Select your target role to get tailored suggestions and optimized content.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 mt-4">
          {roles.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;

            return (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={cn(
                  'flex flex-col items-start gap-2 p-4 rounded-lg border-2 transition-all duration-200 text-left',
                  isSelected
                    ? 'border-primary bg-accent shadow-md'
                    : 'border-border hover:border-primary/50 hover:bg-muted'
                )}
              >
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
                    isSelected ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className={cn('font-medium text-sm', isSelected && 'text-primary')}>
                    {role.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{role.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Continue</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
