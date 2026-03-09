import { describe, expect, it } from 'vitest';
import {
  buildReturnReportPayload,
  deriveReturnReportMode,
  describeReturnReportEvent,
} from './returnReportForm';

describe('returnReportForm utils', () => {
  it('defaults to return_to_work when no resume fields exist', () => {
    expect(deriveReturnReportMode(null)).toBe('return_to_work');
    expect(deriveReturnReportMode({ resume_date: null, resume_study_program: undefined })).toBe(
      'return_to_work',
    );
  });

  it('uses resume_study mode when resume fields exist', () => {
    expect(
      deriveReturnReportMode({ resume_date: '2026-03-03', resume_study_program: undefined }),
    ).toBe('resume_study');
    expect(
      deriveReturnReportMode({ resume_date: null, resume_study_program: 'A' }),
    ).toBe('resume_study');
  });

  it('builds final return payload without resume fields', () => {
    expect(
      buildReturnReportPayload({
        mode: 'return_to_work',
        reportDate: '2026-04-22',
        resumeDate: '2026-05-01',
        note: 'final',
        resumeStudyProgram: 'A',
      }),
    ).toEqual({
      reportDate: '2026-04-22',
      note: 'final',
    });
  });

  it('builds resume study payload with optional resume fields', () => {
    expect(
      buildReturnReportPayload({
        mode: 'resume_study',
        reportDate: '2026-03-02',
        resumeDate: '2026-03-03',
        note: 'resume',
        resumeStudyProgram: 'A',
      }),
    ).toEqual({
      reportDate: '2026-03-02',
      resumeDate: '2026-03-03',
      note: 'resume',
      resumeStudyProgram: 'A',
    });
  });

  it('describes final return events in Thai', () => {
    expect(
      describeReturnReportEvent({ resume_date: undefined, resume_study_program: undefined }),
    ).toBe('กลับมาปฏิบัติงานตามปกติ');
    expect(
      describeReturnReportEvent({ resume_date: '2026-03-03', resume_study_program: 'A' }),
    ).toBe('กลับไปศึกษาต่อ/อบรมต่อ');
  });
});
