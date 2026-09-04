import { TestBed } from '@angular/core/testing';
import { ResumeApi } from './resume-api';

describe('ResumeApi', () => {
  let service: ResumeApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ResumeApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
