import { ResumeContent } from '@/types/resume';
import { Mail, Phone, Linkedin, MapPin, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ResumeTemplate = 'modern' | 'classic' | 'minimal';

interface ResumePreviewProps {
  content: ResumeContent;
  title: string;
  fontFamily?: 'inter' | 'georgia' | 'merriweather';
  template?: ResumeTemplate;
}

const fontStyles = {
  inter: 'Inter, system-ui, sans-serif',
  georgia: 'Georgia, serif',
  merriweather: 'Merriweather, Georgia, serif',
};

// Modern Template - Clean with accent color sidebar indicators
const ModernTemplate: React.FC<{ content: ResumeContent; fontFamily: string }> = ({ content, fontFamily }) => {
  const { personalInfo, summary, education, experience, projects, skills } = content;
  
  return (
    <div className="bg-white text-gray-900 p-8 min-h-[1056px] text-sm" style={{ fontFamily }}>
      {/* Header with accent line */}
      <div className="border-l-4 border-indigo-600 pl-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          {personalInfo.fullName || 'Your Name'}
        </h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-gray-600 text-xs">
          {personalInfo.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{personalInfo.email}</span>}
          {personalInfo.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{personalInfo.phone}</span>}
          {personalInfo.linkedin && <span className="flex items-center gap-1"><Linkedin className="h-3 w-3" />{personalInfo.linkedin}</span>}
          {personalInfo.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{personalInfo.location}</span>}
        </div>
      </div>

      {summary && (
        <div className="mb-5">
          <h2 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">Professional Summary</h2>
          <p className="text-gray-700 leading-relaxed">{summary}</p>
        </div>
      )}

      {experience.length > 0 && (
        <div className="mb-5">
          <h2 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">Experience</h2>
          <div className="space-y-4">
            {experience.map((exp) => (
              <div key={exp.id} className="relative pl-4 border-l-2 border-gray-200">
                <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-indigo-600" />
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">{exp.position}</h3>
                    <p className="text-gray-600">{exp.company}{exp.location && ` • ${exp.location}`}</p>
                  </div>
                  <span className="text-gray-500 text-xs whitespace-nowrap">{exp.startDate} - {exp.current ? 'Present' : exp.endDate}</span>
                </div>
                {exp.description.filter((d) => d.trim()).length > 0 && (
                  <ul className="mt-2 list-disc list-outside ml-4 space-y-1 text-gray-700">
                    {exp.description.filter((d) => d.trim()).map((bullet, idx) => <li key={idx}>{bullet}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {projects.length > 0 && (
        <div className="mb-5">
          <h2 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">Projects</h2>
          <div className="space-y-3">
            {projects.map((proj) => (
              <div key={proj.id}>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{proj.name}</h3>
                  {proj.link && <a href={proj.link} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline"><ExternalLink className="h-3 w-3" /></a>}
                </div>
                {proj.description && <p className="text-gray-700 mt-1">{proj.description}</p>}
                {proj.technologies.length > 0 && <p className="text-gray-500 text-xs mt-1"><span className="font-medium">Technologies:</span> {proj.technologies.join(', ')}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {education.length > 0 && (
        <div className="mb-5">
          <h2 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">Education</h2>
          <div className="space-y-2">
            {education.map((edu) => (
              <div key={edu.id} className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900">{edu.institution}</h3>
                  <p className="text-gray-600">{edu.degree}{edu.field && ` in ${edu.field}`}{edu.gpa && ` • GPA: ${edu.gpa}`}</p>
                </div>
                <span className="text-gray-500 text-xs whitespace-nowrap">{edu.startDate} - {edu.endDate}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {skills.length > 0 && (
        <div>
          <h2 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, idx) => (
              <span key={idx} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-md">{skill}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Classic Template - Traditional with centered header and lines
const ClassicTemplate: React.FC<{ content: ResumeContent; fontFamily: string }> = ({ content, fontFamily }) => {
  const { personalInfo, summary, education, experience, projects, skills } = content;
  
  return (
    <div className="bg-white text-gray-900 p-8 min-h-[1056px] text-sm" style={{ fontFamily }}>
      <div className="text-center mb-6 pb-4 border-b-2 border-gray-800">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-wide uppercase">
          {personalInfo.fullName || 'Your Name'}
        </h1>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-gray-600 text-xs">
          {personalInfo.email && <span>{personalInfo.email}</span>}
          {personalInfo.phone && <span>| {personalInfo.phone}</span>}
          {personalInfo.linkedin && <span>| {personalInfo.linkedin}</span>}
          {personalInfo.location && <span>| {personalInfo.location}</span>}
        </div>
      </div>

      {summary && (
        <div className="mb-5">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-400 pb-1 mb-2 text-center">Summary</h2>
          <p className="text-gray-700 leading-relaxed text-center">{summary}</p>
        </div>
      )}

      {experience.length > 0 && (
        <div className="mb-5">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-400 pb-1 mb-3 text-center">Professional Experience</h2>
          <div className="space-y-4">
            {experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline">
                  <h3 className="font-bold text-gray-900">{exp.position}</h3>
                  <span className="text-gray-600 text-xs italic">{exp.startDate} - {exp.current ? 'Present' : exp.endDate}</span>
                </div>
                <p className="text-gray-700 italic">{exp.company}{exp.location && `, ${exp.location}`}</p>
                {exp.description.filter((d) => d.trim()).length > 0 && (
                  <ul className="mt-2 list-disc list-outside ml-4 space-y-1 text-gray-700">
                    {exp.description.filter((d) => d.trim()).map((bullet, idx) => <li key={idx}>{bullet}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {education.length > 0 && (
        <div className="mb-5">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-400 pb-1 mb-3 text-center">Education</h2>
          <div className="space-y-2">
            {education.map((edu) => (
              <div key={edu.id} className="flex justify-between items-baseline">
                <div>
                  <span className="font-bold text-gray-900">{edu.degree}{edu.field && ` in ${edu.field}`}</span>
                  <span className="text-gray-700"> — {edu.institution}</span>
                  {edu.gpa && <span className="text-gray-600 italic"> (GPA: {edu.gpa})</span>}
                </div>
                <span className="text-gray-600 text-xs">{edu.endDate}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {projects.length > 0 && (
        <div className="mb-5">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-400 pb-1 mb-3 text-center">Projects</h2>
          <div className="space-y-3">
            {projects.map((proj) => (
              <div key={proj.id}>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900">{proj.name}</h3>
                  {proj.link && <a href={proj.link} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:underline text-xs">[Link]</a>}
                </div>
                {proj.description && <p className="text-gray-700">{proj.description}</p>}
                {proj.technologies.length > 0 && <p className="text-gray-600 text-xs italic">Technologies: {proj.technologies.join(', ')}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {skills.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-400 pb-1 mb-2 text-center">Skills</h2>
          <p className="text-gray-700 text-center">{skills.join(' • ')}</p>
        </div>
      )}
    </div>
  );
};

// Minimal Template - Clean whitespace, subtle styling
const MinimalTemplate: React.FC<{ content: ResumeContent; fontFamily: string }> = ({ content, fontFamily }) => {
  const { personalInfo, summary, education, experience, projects, skills } = content;
  
  return (
    <div className="bg-white text-gray-800 p-10 min-h-[1056px] text-sm" style={{ fontFamily }}>
      <div className="mb-8">
        <h1 className="text-3xl font-light text-gray-900 mb-3 tracking-tight">
          {personalInfo.fullName || 'Your Name'}
        </h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-gray-500 text-xs">
          {personalInfo.email && <span>{personalInfo.email}</span>}
          {personalInfo.phone && <span>{personalInfo.phone}</span>}
          {personalInfo.linkedin && <span>{personalInfo.linkedin}</span>}
          {personalInfo.location && <span>{personalInfo.location}</span>}
        </div>
      </div>

      {summary && (
        <div className="mb-8">
          <p className="text-gray-600 leading-relaxed">{summary}</p>
        </div>
      )}

      {experience.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-4">Experience</h2>
          <div className="space-y-5">
            {experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-medium text-gray-900">{exp.position}</h3>
                  <span className="text-gray-400 text-xs">{exp.startDate} — {exp.current ? 'Present' : exp.endDate}</span>
                </div>
                <p className="text-gray-500 text-xs mb-2">{exp.company}{exp.location && ` · ${exp.location}`}</p>
                {exp.description.filter((d) => d.trim()).length > 0 && (
                  <ul className="space-y-1 text-gray-600">
                    {exp.description.filter((d) => d.trim()).map((bullet, idx) => <li key={idx} className="pl-3 relative before:content-['–'] before:absolute before:left-0 before:text-gray-400">{bullet}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {projects.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-4">Projects</h2>
          <div className="space-y-4">
            {projects.map((proj) => (
              <div key={proj.id}>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-gray-900">{proj.name}</h3>
                  {proj.link && <a href={proj.link} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600"><ExternalLink className="h-3 w-3" /></a>}
                </div>
                {proj.description && <p className="text-gray-600">{proj.description}</p>}
                {proj.technologies.length > 0 && <p className="text-gray-400 text-xs mt-1">{proj.technologies.join(' · ')}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {education.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-4">Education</h2>
          <div className="space-y-3">
            {education.map((edu) => (
              <div key={edu.id} className="flex justify-between items-baseline">
                <div>
                  <span className="font-medium text-gray-900">{edu.institution}</span>
                  <span className="text-gray-500"> · {edu.degree}{edu.field && `, ${edu.field}`}</span>
                  {edu.gpa && <span className="text-gray-400 text-xs ml-2">{edu.gpa}</span>}
                </div>
                <span className="text-gray-400 text-xs">{edu.endDate}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {skills.length > 0 && (
        <div>
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">Skills</h2>
          <p className="text-gray-600">{skills.join(' · ')}</p>
        </div>
      )}
    </div>
  );
};

export const ResumePreview: React.FC<ResumePreviewProps> = ({ 
  content, 
  title, 
  fontFamily = 'inter',
  template = 'modern'
}) => {
  const fontStyle = fontStyles[fontFamily];

  switch (template) {
    case 'classic':
      return <div id="resume-preview"><ClassicTemplate content={content} fontFamily={fontStyle} /></div>;
    case 'minimal':
      return <div id="resume-preview"><MinimalTemplate content={content} fontFamily={fontStyle} /></div>;
    case 'modern':
    default:
      return <div id="resume-preview"><ModernTemplate content={content} fontFamily={fontStyle} /></div>;
  }
};
