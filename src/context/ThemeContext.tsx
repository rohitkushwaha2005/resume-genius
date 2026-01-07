import React, { createContext, useContext, useEffect, useState } from 'react';
import { ResumeTemplate } from '@/components/resume/ResumePreview';

type Theme = 'light' | 'dark';
type ResumeFont = 'inter' | 'georgia' | 'merriweather';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  resumeFont: ResumeFont;
  setResumeFont: (font: ResumeFont) => void;
  resumeTemplate: ResumeTemplate;
  setResumeTemplate: (template: ResumeTemplate) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme') as Theme;
      if (stored) return stored;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  const [resumeFont, setResumeFontState] = useState<ResumeFont>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('resumeFont') as ResumeFont) || 'inter';
    }
    return 'inter';
  });

  const [resumeTemplate, setResumeTemplateState] = useState<ResumeTemplate>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('resumeTemplate') as ResumeTemplate) || 'modern';
    }
    return 'modern';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('resumeFont', resumeFont);
  }, [resumeFont]);

  useEffect(() => {
    localStorage.setItem('resumeTemplate', resumeTemplate);
  }, [resumeTemplate]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const setResumeFont = (font: ResumeFont) => {
    setResumeFontState(font);
  };

  const setResumeTemplate = (template: ResumeTemplate) => {
    setResumeTemplateState(template);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, resumeFont, setResumeFont, resumeTemplate, setResumeTemplate }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
