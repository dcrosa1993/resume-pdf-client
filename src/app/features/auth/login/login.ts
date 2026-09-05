import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';

import {
  MatButtonModule,
} from '@angular/material/button';

import {
  MatCardModule,
} from '@angular/material/card';

import {
  MatIconModule,
} from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth';



@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatIconModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  readonly auth =
    inject(AuthService);

  readonly error =
    signal<string | null>(null);

  readonly signingIn =
    signal(false);

  async loginWithGoogle(): Promise<void> {
    if (this.signingIn()) {
      return;
    }

    this.signingIn.set(true);
    this.error.set(null);

    try {
      await this.auth.signInWithGoogle();
    } catch (error) {
      console.error(
        'Google sign-in failed:',
        error,
      );

      this.error.set(
        'Unable to sign in with Google.',
      );
    } finally {
      this.signingIn.set(false);
    }
  }
}