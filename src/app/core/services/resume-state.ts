import { Injectable, computed, signal } from '@angular/core';
import {
  createEmptyResume,
  Resume,
} from '../models/resume';

@Injectable({
  providedIn: 'root',
})
export class ResumeStateService {
  private readonly resumeState =
    signal<Resume>(createEmptyResume());

  readonly resume = this.resumeState.asReadonly();

  readonly json = computed(() =>
    JSON.stringify(this.resumeState(), null, 2),
  );

  updateResume(resume: Resume): void {
    this.resumeState.set(resume);
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

      this.resumeState.set(parsed);

      return {
        valid: true,
      };
    } catch (error) {
      return {
        valid: false,
        error:
          error instanceof Error
            ? error.message
            : 'Invalid JSON.',
      };
    }
  }

  private isResume(value: unknown): value is Resume {
    if (
      typeof value !== 'object' ||
      value === null
    ) {
      return false;
    }

    const resume = value as Record<string, unknown>;

    if (
      resume['template'] !== undefined &&
      !['classic', 'modern', 'compact'].includes(
        resume['template'] as string,
      )
    ) {
      return false;
    }

    const personal = resume['personal'];

    if (
      typeof personal !== 'object' ||
      personal === null
    ) {
      return false;
    }

    const personalData =
      personal as Record<string, unknown>;

    const requiredPersonalFields = [
      'firstName',
      'lastName',
      'jobTitle',
      'email',
    ];

    for (const field of requiredPersonalFields) {
      if (
        typeof personalData[field] !== 'string'
      ) {
        return false;
      }
    }

    if (!Array.isArray(resume['experience'])) {
      return false;
    }

    if (
      typeof resume['skills'] !== 'object' ||
      resume['skills'] === null
    ) {
      return false;
    }

    const skills =
      resume['skills'] as Record<string, unknown>;

    if (!Array.isArray(skills['technical'])) {
      return false;
    }

    return true;
  }
}
