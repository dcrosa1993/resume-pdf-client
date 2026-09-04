import { Injectable, computed, signal } from '@angular/core';
import { createEmptyResume, Resume } from '../models/resume';

@Injectable({
  providedIn: 'root',
})
export class ResumeStateService {
  private readonly resumeState = signal<Resume>(createEmptyResume());

  readonly resume = this.resumeState.asReadonly();

  readonly json = computed(() => JSON.stringify(this.resumeState(), null, 2));

  updateResume(resume: Resume): void {
    this.resumeState.set(this.normalizeResume(resume));
  }

  reset(): void {
    this.resumeState.set(createEmptyResume());
  }

  updateFromJson(json: string): {
    valid: boolean;
    error?: string;
  } {
    try {
      const parsed: unknown = JSON.parse(json);

      if (!this.isResume(parsed)) {
        return {
          valid: false,
          error: 'Invalid resume structure.',
        };
      }

      this.resumeState.set(this.normalizeResume(parsed));

      return {
        valid: true,
      };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Invalid JSON.',
      };
    }
  }

  private isResume(value: unknown): value is Resume {
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    const resume = value as Record<string, unknown>;

    if (
      resume['template'] !== undefined &&
      !['classic', 'modern', 'compact'].includes(resume['template'] as string)
    ) {
      return false;
    }

    const personal = resume['personal'];

    if (typeof personal !== 'object' || personal === null) {
      return false;
    }

    const personalData = personal as Record<string, unknown>;

    const requiredPersonalFields = ['firstName', 'lastName', 'jobTitle', 'email'];

    for (const field of requiredPersonalFields) {
      if (typeof personalData[field] !== 'string') {
        return false;
      }
    }

    if (!Array.isArray(resume['experience'])) {
      return false;
    }

    if (typeof resume['skills'] !== 'object' || resume['skills'] === null) {
      return false;
    }

    const skills = resume['skills'] as Record<string, unknown>;

    if (!Array.isArray(skills['technical'])) {
      return false;
    }

    return true;
  }
  private normalizeResume(resume: Resume): Resume {
    return {
      ...resume,

      template: resume.template ?? 'classic',

      personal: {
        ...resume.personal,
        phone: this.emptyToUndefined(resume.personal.phone),
        location: this.emptyToUndefined(resume.personal.location),
        linkedin: this.emptyToUndefined(resume.personal.linkedin),
        github: this.emptyToUndefined(resume.personal.github),
        website: this.emptyToUndefined(resume.personal.website),
      },

      summary: this.emptyToUndefined(resume.summary),

      projects: (resume.projects ?? []).map((project) => ({
        ...project,

        url: this.emptyToUndefined(project.url),

        technologies: project.technologies?.filter((technology) => technology.trim() !== ''),
      })),

      certifications: (resume.certifications ?? []).map((certification) => ({
        ...certification,

        date: this.emptyToUndefined(certification.date),

        url: this.emptyToUndefined(certification.url),
      })),

      experience: (resume.experience ?? []).map((experience) => ({
        ...experience,

        location: this.emptyToUndefined(experience.location),

        endDate: this.emptyToUndefined(experience.endDate),

        description: this.emptyToUndefined(experience.description),

        achievements: experience.achievements.filter((achievement) => achievement.trim() !== ''),

        technologies: experience.technologies?.filter((technology) => technology.trim() !== ''),
      })),

      education: (resume.education ?? []).map((education) => ({
        ...education,

        fieldOfStudy: this.emptyToUndefined(education.fieldOfStudy),

        location: this.emptyToUndefined(education.location),

        endDate: this.emptyToUndefined(education.endDate),
      })),

      skills: {
        technical: resume.skills.technical.filter((skill) => skill.trim() !== ''),

        soft: resume.skills.soft?.filter((skill) => skill.trim() !== ''),
      },

      languages: (resume.languages ?? []).map((language) => ({
        ...language,
        name: language.name.trim(),
        level: language.level.trim(),
      })),
    };
  }

  private emptyToUndefined(value?: string): string | undefined {
    const normalized = value?.trim();

    return normalized ? normalized : undefined;
  }
}
