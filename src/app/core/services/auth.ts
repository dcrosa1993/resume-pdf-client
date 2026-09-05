import {
  Injectable,
  signal,
} from '@angular/core';

import {
  User,
  GoogleAuthProvider,
  getIdToken,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';

import {
  firebaseAuth,
} from '../config/firebase';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly auth = firebaseAuth;

  readonly user = signal<User | null>(
    null,
  );

  readonly loading = signal(true);

  constructor() {
    onAuthStateChanged(
      this.auth,
      (user) => {
        this.user.set(user);
        this.loading.set(false);
      },
    );
  }

  async signInWithGoogle(): Promise<void> {
    const provider =
      new GoogleAuthProvider();

    await signInWithPopup(
      this.auth,
      provider,
    );
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
  }

  async getIdToken(): Promise<string | null> {
    const user = this.user();

    if (!user) {
      return null;
    }

    return getIdToken(user);
  }
}
