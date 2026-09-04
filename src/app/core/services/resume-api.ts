import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Resume } from '../models/resume';

@Injectable({
  providedIn: 'root',
})
export class ResumeApiService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    'http://181.225.255.17:8123';

  generatePdf(
    resume: Resume,
  ): Observable<Blob> {
    return this.http.post(
      `${this.apiUrl}/resume/pdf`,
      resume,
      {
        responseType: 'blob',
      },
    );
  }
}
