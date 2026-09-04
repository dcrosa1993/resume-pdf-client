import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { Resume, ResumeTemplate } from '../../core/models/resume';
import { ResumeStateService } from '../../core/services/resume-state';

@Component({
  selector: 'app-resume-builder',
  standalone: true,
  imports: [
    ReactiveFormsModule,

    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './resume-builder.html',
  styleUrl: './resume-builder.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResumeBuilderComponent {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly resumeState = inject(ResumeStateService);

  readonly showJson = signal(false);
  readonly jsonError = signal<string | null>(null);
  readonly jsonInput = signal('');

  private isEditingJson = false;

  readonly form = this.fb.nonNullable.group({
    template: ['classic' as ResumeTemplate],

    personal: this.fb.nonNullable.group({
      firstName: [''],
      lastName: [''],
      jobTitle: [''],
      email: [''],
      phone: [''],
      location: [''],
      linkedin: [''],
      github: [''],
      website: [''],
    }),

    summary: [''],
  });

  private updatingFromState = false;

  constructor() {
    this.connectFormToState();

    effect(() => {
      const resume = this.resumeState.resume();

      if (this.updatingFromState) {
        return;
      }

      this.updateFormFromResume(resume);
    });

    effect(() => {
      if (!this.isEditingJson) {
        this.jsonInput.set(this.resumeState.json());
      }
    });
  }

  toggleJson(): void {
    this.showJson.update((value) => !value);
  }

  onJsonInput(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;

    const value = textarea.value;

    this.isEditingJson = true;
    this.jsonInput.set(value);

    const result = this.resumeState.updateFromJson(value);

    this.jsonError.set(result.valid ? null : (result.error ?? 'Invalid JSON.'));

    if (result.valid) {
      this.isEditingJson = false;

      this.updateFormFromResume(this.resumeState.resume());
    }
  }

  formatJson(): void {
    const formatted = this.resumeState.json();

    this.jsonInput.set(formatted);
    this.jsonError.set(null);
  }

  copyJson(): void {
    void navigator.clipboard.writeText(this.jsonInput());
  }
  private connectFormToState(): void {
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      const current = this.resumeState.resume();

      const resume: Resume = {
        ...current,

        template: value.template ?? 'classic',

        personal: {
          firstName: value.personal?.firstName ?? '',

          lastName: value.personal?.lastName ?? '',

          jobTitle: value.personal?.jobTitle ?? '',

          email: value.personal?.email ?? '',

          phone: value.personal?.phone ?? '',

          location: value.personal?.location ?? '',

          linkedin: value.personal?.linkedin ?? '',

          github: value.personal?.github ?? '',

          website: value.personal?.website ?? '',
        },

        summary: value.summary ?? '',
      };

      this.resumeState.updateResume(resume);
    });
  }

  private updateFormFromResume(resume: Resume): void {
    this.updatingFromState = true;

    this.form.patchValue(
      {
        template: resume.template ?? 'classic',

        personal: {
          firstName: resume.personal.firstName,

          lastName: resume.personal.lastName,

          jobTitle: resume.personal.jobTitle,

          email: resume.personal.email,

          phone: resume.personal.phone ?? '',

          location: resume.personal.location ?? '',

          linkedin: resume.personal.linkedin ?? '',

          github: resume.personal.github ?? '',

          website: resume.personal.website ?? '',
        },

        summary: resume.summary ?? '',
      },
      {
        emitEvent: false,
      },
    );

    this.updatingFromState = false;
  }
}
