import { Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';

const fonts = [
  { id: 'inter', name: 'Inter', className: 'font-sans' },
  { id: 'georgia', name: 'Georgia', className: 'font-serif' },
  { id: 'merriweather', name: 'Merriweather', className: 'font-serif' },
] as const;

export const FontSwitcher = () => {
  const { resumeFont, setResumeFont } = useTheme();

  const currentFont = fonts.find((f) => f.id === resumeFont) || fonts[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Type className="h-4 w-4" />
          <span className="hidden sm:inline">{currentFont.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {fonts.map((font) => (
          <DropdownMenuItem
            key={font.id}
            onClick={() => setResumeFont(font.id)}
            className={cn(
              'cursor-pointer',
              resumeFont === font.id && 'bg-accent'
            )}
          >
            <span className={font.className}>{font.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
