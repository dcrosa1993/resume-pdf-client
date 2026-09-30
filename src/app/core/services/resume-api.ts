import { Injectable, inject } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { Resume } from '../models/resume';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ResumeApiService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = environment.API_URL;

  generatePdf(resume: Resume, photo?: File | null): Observable<Blob> {
    const formData = new FormData();

    formData.append('resume', JSON.stringify(resume));

    if (photo) {
      formData.append('photo', photo, photo.name);
    }

    return this.http.post<Blob>(`${this.apiUrl}/resume/pdf`, formData, {
      responseType: 'blob' as 'json',
    });
  }
}
