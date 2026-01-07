import { Layout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { ResumeTemplate } from '@/components/resume/ResumePreview';

interface TemplateSwitcherProps {
  template: ResumeTemplate;
  onTemplateChange: (template: ResumeTemplate) => void;
}

const templates = [
  { id: 'modern' as const, name: 'Modern', description: 'Clean with accent sidebar' },
  { id: 'classic' as const, name: 'Classic', description: 'Traditional centered layout' },
  { id: 'minimal' as const, name: 'Minimal', description: 'Whitespace-focused design' },
];

export const TemplateSwitcher: React.FC<TemplateSwitcherProps> = ({
  template,
  onTemplateChange,
}) => {
  const currentTemplate = templates.find((t) => t.id === template) || templates[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Layout className="h-4 w-4" />
          <span className="hidden sm:inline">{currentTemplate.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {templates.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onClick={() => onTemplateChange(t.id)}
            className={cn('cursor-pointer flex flex-col items-start', template === t.id && 'bg-accent')}
          >
            <span className="font-medium">{t.name}</span>
            <span className="text-xs text-muted-foreground">{t.description}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
