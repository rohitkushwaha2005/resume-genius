import { cn } from '@/lib/utils';
import { ResumeContent } from '@/types/resume';
import { Check } from 'lucide-react';

interface BuilderProgressProps {
  content: ResumeContent;
  activeTab: string;
}

const steps = [
  { id: 'personal', label: 'Personal', check: (c: ResumeContent) => !!c.personalInfo.fullName && !!c.personalInfo.email },
  { id: 'summary', label: 'Summary', check: (c: ResumeContent) => !!c.summary && c.summary.length > 20 },
  { id: 'experience', label: 'Experience', check: (c: ResumeContent) => c.experience.length > 0 },
  { id: 'education', label: 'Education', check: (c: ResumeContent) => c.education.length > 0 },
  { id: 'projects', label: 'Projects', check: (c: ResumeContent) => c.projects.length > 0 },
  { id: 'skills', label: 'Skills', check: (c: ResumeContent) => c.skills.length >= 3 },
];

export const BuilderProgress: React.FC<BuilderProgressProps> = ({ content, activeTab }) => {
  const completedCount = steps.filter((step) => step.check(content)).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-6 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-foreground">Resume Progress</span>
        <span className="text-sm font-semibold text-primary">{progressPercent}%</span>
      </div>
      
      {/* Progress bar */}
      <div className="h-2 bg-muted rounded-full mb-4 overflow-hidden">
        <div
          className="h-full gradient-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = step.check(content);
          const isActive = activeTab === step.id;

          return (
            <div key={step.id} className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300',
                  isCompleted
                    ? 'border-primary bg-primary text-primary-foreground'
                    : isActive
                    ? 'border-primary bg-accent text-primary'
                    : 'border-muted-foreground/30 bg-muted text-muted-foreground'
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="text-xs font-medium">{index + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  'text-xs hidden sm:block',
                  isActive ? 'text-primary font-medium' : 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
