import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'home',
  },
  {
    path: 'home',
    loadComponent: () =>
      import(
        './features/resume-builder/resume-builder'
      ).then(
        (component) =>
          component.ResumeBuilderComponent,
      ),
  },
];
