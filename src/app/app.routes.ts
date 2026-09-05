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
  {
    path: 'Login',
    loadComponent: () =>
      import(
        './features/auth/login/login'
      ).then(
        (component) =>
          component.LoginComponent,
      ),
  },
];
