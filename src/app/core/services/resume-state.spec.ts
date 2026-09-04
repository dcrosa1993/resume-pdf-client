import { TestBed } from '@angular/core/testing';
import { ResumeState } from './resume-state';

describe('ResumeState', () => {
  let service: ResumeState;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ResumeState);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
