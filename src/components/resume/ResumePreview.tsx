import { ResumeContent } from '@/types/resume';
import { Mail, Phone, Linkedin, MapPin, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResumePreviewProps {
  content: ResumeContent;
  title: string;
  fontFamily?: 'inter' | 'georgia' | 'merriweather';
}

const fontClasses = {
  inter: 'font-sans',
  georgia: 'font-serif',
  merriweather: 'font-serif',
};

export const ResumePreview: React.FC<ResumePreviewProps> = ({ 
  content, 
  title, 
  fontFamily = 'inter' 
}) => {
  const { personalInfo, summary, education, experience, projects, skills } = content;

  return (
    <div 
      id="resume-preview" 
      className={cn(
        "bg-white text-gray-900 p-8 min-h-[1056px] text-sm",
        fontClasses[fontFamily]
      )}
      style={{
        fontFamily: fontFamily === 'inter' 
          ? 'Inter, system-ui, sans-serif' 
          : fontFamily === 'georgia'
          ? 'Georgia, serif'
          : 'Merriweather, Georgia, serif'
      }}
    >
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {personalInfo.fullName || 'Your Name'}
        </h1>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-gray-600 text-xs">
          {personalInfo.email && (
            <span className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {personalInfo.email}
            </span>
          )}
          {personalInfo.phone && (
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {personalInfo.phone}
            </span>
          )}
          {personalInfo.linkedin && (
            <span className="flex items-center gap-1">
              <Linkedin className="h-3 w-3" />
              {personalInfo.linkedin}
            </span>
          )}
          {personalInfo.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {personalInfo.location}
            </span>
          )}
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="mb-5">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-300 pb-1 mb-2">
            Professional Summary
          </h2>
          <p className="text-gray-700 leading-relaxed">{summary}</p>
        </div>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <div className="mb-5">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-300 pb-1 mb-2">
            Experience
          </h2>
          <div className="space-y-4">
            {experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">{exp.position}</h3>
                    <p className="text-gray-600">
                      {exp.company}
                      {exp.location && ` • ${exp.location}`}
                    </p>
                  </div>
                  <span className="text-gray-500 text-xs whitespace-nowrap">
                    {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                  </span>
                </div>
                {exp.description.filter((d) => d.trim()).length > 0 && (
                  <ul className="mt-2 list-disc list-outside ml-4 space-y-1 text-gray-700">
                    {exp.description
                      .filter((d) => d.trim())
                      .map((bullet, idx) => (
                        <li key={idx}>{bullet}</li>
                      ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <div className="mb-5">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-300 pb-1 mb-2">
            Projects
          </h2>
          <div className="space-y-3">
            {projects.map((proj) => (
              <div key={proj.id}>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{proj.name}</h3>
                  {proj.link && (
                    <a
                      href={proj.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                {proj.description && (
                  <p className="text-gray-700 mt-1">{proj.description}</p>
                )}
                {proj.technologies.length > 0 && (
                  <p className="text-gray-500 text-xs mt-1">
                    <span className="font-medium">Technologies:</span>{' '}
                    {proj.technologies.join(', ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {education.length > 0 && (
        <div className="mb-5">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-300 pb-1 mb-2">
            Education
          </h2>
          <div className="space-y-2">
            {education.map((edu) => (
              <div key={edu.id} className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900">{edu.institution}</h3>
                  <p className="text-gray-600">
                    {edu.degree}
                    {edu.field && ` in ${edu.field}`}
                    {edu.gpa && ` • GPA: ${edu.gpa}`}
                  </p>
                </div>
                <span className="text-gray-500 text-xs whitespace-nowrap">
                  {edu.startDate} - {edu.endDate}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-300 pb-1 mb-2">
            Skills
          </h2>
          <p className="text-gray-700">{skills.join(' • ')}</p>
        </div>
      )}
    </div>
  );
};
