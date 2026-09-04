export interface Resume {
  template?: ResumeTemplate;
  personal: PersonalInfo;
  summary?: string;
  experience: Experience[];
  education?: Education[];
  skills: Skills;
  certifications?: Certification[];
  languages?: Language[];
  projects?: Project[];
}

export type ResumeTemplate =
  | 'classic'
  | 'modern'
  | 'compact';

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  jobTitle: string;
  email: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  website?: string;
}

export interface Experience {
  company: string;
  position: string;
  location?: string;
  startDate: string;
  endDate?: string;
  description?: string;
  achievements: string[];
  technologies?: string[];
}

export interface Education {
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  location?: string;
  startDate: string;
  endDate?: string;
}

export interface Skills {
  technical: string[];
  soft?: string[];
}

export interface Certification {
  name: string;
  issuer: string;
  date?: string;
  url?: string;
}

export interface Language {
  name: string;
  level: string;
}

export interface Project {
  name: string;
  description: string;
  technologies?: string[];
  url?: string;
}
