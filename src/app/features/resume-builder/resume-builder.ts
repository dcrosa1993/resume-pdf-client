import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { Resume, ResumeTemplate } from '../../core/models/resume';
import { MatChipsModule } from '@angular/material/chips';
import { ResumeStateService } from '../../core/services/resume-state';
import { ResumeApiService } from '../../core/services/resume-api';

import { MatStepperModule } from '@angular/material/stepper';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-resume-builder',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatStepperModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
  ],
  templateUrl: './resume-builder.html',
  styleUrl: './resume-builder.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResumeBuilderComponent {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly resumeState = inject(ResumeStateService);

  private readonly resumeApi = inject(ResumeApiService);

  readonly generatingPdf = signal(false);

  readonly pdfError = signal<string | null>(null);

  readonly showJson = signal(false);
  readonly jsonError = signal<string | null>(null);
  readonly jsonInput = signal('');

  private updatingFromState = false;
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

    experience: this.fb.array<ReturnType<typeof this.createExperienceGroup>>([]),

    skills: this.fb.nonNullable.group({
      technical: this.fb.array<ReturnType<typeof this.createStringControl>>([]),

      soft: this.fb.array<ReturnType<typeof this.createStringControl>>([]),
    }),

    projects: this.fb.array<ReturnType<typeof this.createProjectGroup>>([]),

    education: this.fb.array<ReturnType<typeof this.createEducationGroup>>([]),

    certifications: this.fb.array<ReturnType<typeof this.createCertificationGroup>>([]),

    languages: this.fb.array<ReturnType<typeof this.createLanguageGroup>>([]),
  });

  constructor() {
    this.connectFormToState();

    effect(() => {
      const resume = this.resumeState.resume();

      if (this.updatingFromState || this.isEditingJson) {
        return;
      }

      this.updateFormFromResume(resume);

      this.jsonInput.set(this.resumeState.json());
    });
  }

  // ----------------------------------------------------
  // UI
  // ----------------------------------------------------

  toggleJson(): void {
    this.showJson.update((value) => !value);

    if (this.showJson()) {
      this.jsonInput.set(this.resumeState.json());
    }
  }

  onJsonInput(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;

    const value = textarea.value;

    this.isEditingJson = true;
    this.jsonInput.set(value);

    const result = this.resumeState.updateFromJson(value);

    this.jsonError.set(result.valid ? null : (result.error ?? 'Invalid JSON.'));

    if (result.valid) {
      this.updateFormFromResume(this.resumeState.resume());

      this.isEditingJson = false;
    }
  }

  formatJson(): void {
    const value = this.jsonInput();

    try {
      const formatted = JSON.stringify(JSON.parse(value), null, 2);

      this.jsonInput.set(formatted);
      this.jsonError.set(null);
    } catch (error) {
      this.jsonError.set(error instanceof Error ? error.message : 'Invalid JSON.');
    }
  }

  async copyJson(): Promise<void> {
    await navigator.clipboard.writeText(this.jsonInput());
  }

  async generatePdf(): Promise<void> {
    if (this.generatingPdf()) {
      return;
    }

    this.generatingPdf.set(true);
    this.pdfError.set(null);

    try {
      const resume = this.resumeState.resume();

      const blob = await firstValueFrom(this.resumeApi.generatePdf(resume));

      this.downloadPdf(blob, this.buildFileName(resume));
    } catch (error) {
      console.error('Failed to generate PDF', error);

      this.pdfError.set('Unable to generate the PDF. Please try again.');
    } finally {
      this.generatingPdf.set(false);
    }
  }

  // ----------------------------------------------------
  // FormArray getters
  // ----------------------------------------------------

  get experienceArray(): FormArray {
    return this.form.controls.experience;
  }

  get technicalSkillsArray(): FormArray {
    return this.form.controls.skills.controls.technical;
  }

  get softSkillsArray(): FormArray {
    return this.form.controls.skills.controls.soft;
  }

  get projectsArray(): FormArray {
    return this.form.controls.projects;
  }

  get educationArray(): FormArray {
    return this.form.controls.education;
  }

  get certificationsArray(): FormArray {
    return this.form.controls.certifications;
  }

  get languagesArray(): FormArray {
    return this.form.controls.languages;
  }
  getAchievements(experienceIndex: number): FormArray {
    return this.experienceArray.at(experienceIndex).get('achievements') as FormArray;
  }

  getExperienceTechnologies(experienceIndex: number): FormArray {
    return this.experienceArray.at(experienceIndex).get('technologies') as FormArray;
  }

  getProjectTechnologies(projectIndex: number): FormArray {
    return this.projectsArray.at(projectIndex).get('technologies') as FormArray;
  }

  // ----------------------------------------------------
  // Experience
  // ----------------------------------------------------

  addExperience(): void {
    this.experienceArray.push(this.createExperienceGroup());
  }

  removeExperience(index: number): void {
    this.experienceArray.removeAt(index);
  }

  addAchievement(experienceIndex: number): void {
    const experience = this.experienceArray.at(experienceIndex);

    this.getAchievements(experienceIndex).controls.push(this.createStringControl());
  }

  removeAchievement(experienceIndex: number, achievementIndex: number): void {
    const experience = this.experienceArray.at(experienceIndex);

    this.getAchievements(experienceIndex).removeAt(achievementIndex);
  }

  addAchievementFromInput(experienceIndex: number, event: Event): void {
    const input = event.target as HTMLInputElement;

    const value = input.value.trim();

    if (!value) {
      return;
    }

    const achievements = this.getAchievements(experienceIndex);

    const exists = achievements.controls.some(
      (control) => control.value.toLowerCase() === value.toLowerCase(),
    );

    if (!exists) {
      achievements.push(this.createStringControl(value));
    }

    input.value = '';
  }

  addExperienceTechnology(experienceIndex: number): void {
    const experience = this.experienceArray.at(experienceIndex);

    this.getExperienceTechnologies(experienceIndex).push(this.createStringControl());
  }

  removeExperienceTechnology(experienceIndex: number, technologyIndex: number): void {
    const experience = this.experienceArray.at(experienceIndex);

    this.getExperienceTechnologies(experienceIndex).removeAt(technologyIndex);
  }

  addExperienceTechnologyFromInput(experienceIndex: number, event: Event): void {
    const input = event.target as HTMLInputElement;

    const value = input.value.trim();

    if (!value) {
      return;
    }

    const technologies = this.getExperienceTechnologies(experienceIndex);

    const exists = technologies.controls.some(
      (control) => control.value.toLowerCase() === value.toLowerCase(),
    );

    if (!exists) {
      technologies.push(this.createStringControl(value));
    }

    input.value = '';
  }

  // ----------------------------------------------------
  // Skills
  // ----------------------------------------------------

  addTechnicalSkill(): void {
    this.technicalSkillsArray.push(this.createStringControl());
  }

  removeTechnicalSkill(index: number): void {
    this.technicalSkillsArray.removeAt(index);
  }

  addSoftSkill(): void {
    this.softSkillsArray.push(this.createStringControl());
  }

  removeSoftSkill(index: number): void {
    this.softSkillsArray.removeAt(index);
  }
  addTechnicalSkillFromInput(event: Event): void {
    const input = event.target as HTMLInputElement;

    const value = input.value.trim();

    if (!value) {
      return;
    }

    const exists = this.technicalSkillsArray.controls.some(
      (control) => control.value.toLowerCase() === value.toLowerCase(),
    );

    if (!exists) {
      this.technicalSkillsArray.push(this.createStringControl(value));
    }

    input.value = '';
  }

  addSoftSkillFromInput(event: Event): void {
    const input = event.target as HTMLInputElement;

    const value = input.value.trim();

    if (!value) {
      return;
    }

    const exists = this.softSkillsArray.controls.some(
      (control) => control.value.toLowerCase() === value.toLowerCase(),
    );

    if (!exists) {
      this.softSkillsArray.push(this.createStringControl(value));
    }

    input.value = '';
  }

  // ----------------------------------------------------
  // Projects
  // ----------------------------------------------------

  addProject(): void {
    this.projectsArray.push(this.createProjectGroup());
  }

  removeProject(index: number): void {
    this.projectsArray.removeAt(index);
  }

  addProjectTechnology(projectIndex: number): void {
    const project = this.projectsArray.at(projectIndex);

    this.getProjectTechnologies(projectIndex).push(this.createStringControl());
  }

  removeProjectTechnology(projectIndex: number, technologyIndex: number): void {
    const project = this.projectsArray.at(projectIndex);

    this.getProjectTechnologies(projectIndex).removeAt(technologyIndex);
  }

  addProjectTechnologyFromInput(projectIndex: number, event: Event): void {
    const input = event.target as HTMLInputElement;

    const value = input.value.trim();

    if (!value) {
      return;
    }

    const technologies = this.getProjectTechnologies(projectIndex);

    const exists = technologies.controls.some(
      (control) => control.value.toLowerCase() === value.toLowerCase(),
    );

    if (!exists) {
      technologies.push(this.createStringControl(value));
    }

    input.value = '';
  }

  // ----------------------------------------------------
  // Education
  // ----------------------------------------------------

  addEducation(): void {
    this.educationArray.push(this.createEducationGroup());
  }

  removeEducation(index: number): void {
    this.educationArray.removeAt(index);
  }

  // ----------------------------------------------------
  // Certifications
  // ----------------------------------------------------

  addCertification(): void {
    this.certificationsArray.push(this.createCertificationGroup());
  }

  removeCertification(index: number): void {
    this.certificationsArray.removeAt(index);
  }

  // ----------------------------------------------------
  // Languages
  // ----------------------------------------------------

  addLanguage(): void {
    this.languagesArray.push(this.createLanguageGroup());
  }

  removeLanguage(index: number): void {
    this.languagesArray.removeAt(index);
  }

  // ----------------------------------------------------
  // State synchronization
  // ----------------------------------------------------

  private connectFormToState(): void {
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      if (this.updatingFromState || this.isEditingJson) {
        return;
      }

      const current = this.resumeState.resume();

      const resume: Resume = {
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

        experience: value.experience as Resume['experience'],

        skills: {
          technical: (value.skills?.technical ?? []).map((skill) => skill ?? ''),

          soft: (value.skills?.soft ?? []).map((skill) => skill ?? ''),
        },

        projects: value.projects as Resume['projects'],

        education: value.education as Resume['education'],

        certifications: value.certifications as Resume['certifications'],

        languages: value.languages as Resume['languages'],
      };

      this.resumeState.updateResume(resume);
    });
  }

  private updateFormFromResume(resume: Resume): void {
    this.updatingFromState = true;

    this.form.controls.template.setValue(resume.template ?? 'classic', {
      emitEvent: false,
    });

    this.form.controls.personal.patchValue(
      {
        firstName: resume.personal.firstName ?? '',

        lastName: resume.personal.lastName ?? '',

        jobTitle: resume.personal.jobTitle ?? '',

        email: resume.personal.email ?? '',

        phone: resume.personal.phone ?? '',

        location: resume.personal.location ?? '',

        linkedin: resume.personal.linkedin ?? '',

        github: resume.personal.github ?? '',

        website: resume.personal.website ?? '',
      },
      {
        emitEvent: false,
      },
    );

    this.form.controls.summary.setValue(resume.summary ?? '', {
      emitEvent: false,
    });

    this.replaceArray(
      this.experienceArray,
      (resume.experience ?? []).map((item) => this.createExperienceGroup(item)),
    );

    this.replaceArray(
      this.technicalSkillsArray,
      (resume.skills?.technical ?? []).map((skill) => this.createStringControl(skill)),
    );

    this.replaceArray(
      this.softSkillsArray,
      (resume.skills?.soft ?? []).map((skill) => this.createStringControl(skill)),
    );

    this.replaceArray(
      this.projectsArray,
      (resume.projects ?? []).map((item) => this.createProjectGroup(item)),
    );

    this.replaceArray(
      this.educationArray,
      (resume.education ?? []).map((item) => this.createEducationGroup(item)),
    );

    this.replaceArray(
      this.certificationsArray,
      (resume.certifications ?? []).map((item) => this.createCertificationGroup(item)),
    );

    this.replaceArray(
      this.languagesArray,
      (resume.languages ?? []).map((item) => this.createLanguageGroup(item)),
    );

    this.updatingFromState = false;
  }

  private replaceArray(array: FormArray, controls: any[]): void {
    array.clear({
      emitEvent: false,
    });

    for (const control of controls) {
      array.push(control, {
        emitEvent: false,
      });
    }
  }

  // ----------------------------------------------------
  // Form factories
  // ----------------------------------------------------

  private createStringControl(value = '') {
    return this.fb.nonNullable.control(value);
  }

  private createExperienceGroup(value?: Resume['experience'][number]) {
    return this.fb.nonNullable.group({
      company: [value?.company ?? ''],

      position: [value?.position ?? ''],

      location: [value?.location ?? ''],

      startDate: [value?.startDate ?? ''],

      endDate: [value?.endDate ?? ''],

      description: [value?.description ?? ''],

      achievements: this.fb.array(
        (value?.achievements ?? []).map((item) => this.createStringControl(item)),
      ),

      technologies: this.fb.array(
        (value?.technologies ?? []).map((item) => this.createStringControl(item)),
      ),
    });
  }

  private createProjectGroup(
    value?: Resume['projects'] extends (infer T)[] | undefined ? T : never,
  ) {
    return this.fb.nonNullable.group({
      name: [value?.name ?? ''],

      description: [value?.description ?? ''],

      url: [value?.url ?? ''],

      technologies: this.fb.array(
        (value?.technologies ?? []).map((item) => this.createStringControl(item)),
      ),
    });
  }

  private createEducationGroup(
    value?: Resume['education'] extends (infer T)[] | undefined ? T : never,
  ) {
    return this.fb.nonNullable.group({
      institution: [value?.institution ?? ''],

      degree: [value?.degree ?? ''],

      fieldOfStudy: [value?.fieldOfStudy ?? ''],

      location: [value?.location ?? ''],

      startDate: [value?.startDate ?? ''],

      endDate: [value?.endDate ?? ''],
    });
  }

  private createCertificationGroup(
    value?: Resume['certifications'] extends (infer T)[] | undefined ? T : never,
  ) {
    return this.fb.nonNullable.group({
      name: [value?.name ?? ''],

      issuer: [value?.issuer ?? ''],

      date: [value?.date ?? ''],

      url: [value?.url ?? ''],
    });
  }

  private createLanguageGroup(
    value?: Resume['languages'] extends (infer T)[] | undefined ? T : never,
  ) {
    return this.fb.nonNullable.group({
      name: [value?.name ?? ''],

      level: [value?.level ?? ''],
    });
  }
  private downloadPdf(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = fileName;

    document.body.appendChild(anchor);

    anchor.click();

    anchor.remove();

    URL.revokeObjectURL(url);
  }

  private buildFileName(resume: Resume): string {
    const fullName = `${resume.personal.firstName}-${resume.personal.lastName}`
      .trim()
      .replace(/\s+/g, '-')
      .toLowerCase();

    return `${fullName || 'resume'}.pdf`;
  }
}
