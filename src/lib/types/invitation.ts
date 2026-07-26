export type InvitationDateId = '2026-07-26' | '2026-07-27';

export interface InvitationDateOption {
  id: InvitationDateId;
  dayName: string;
  shortLabel: string;
  longLabel: string;
  startMinutes: number;
  endMinutes: number;
}

export interface TimeOption {
  value: string;
  label: string;
  localDate: string;
  available: boolean;
  isMidnightNextDay: boolean;
}

export type SubmissionStatus =
  | 'idle'
  | 'pending'
  | 'sending'
  | 'sent'
  | 'error';

export interface SubmissionState {
  status: SubmissionStatus;
  countdown: number;
  message: string;
}

export interface ResponsePayload {
  inviteId: string;
  submissionId: string;
  messageId?: string;
  dateId: InvitationDateId;
  localDate: string;
  time: string;
  timeZone: string;
  pageOpenedAt: number;
  honeypot: string;
}

export interface ResponseResult {
  ok: true;
  messageId: string;
}

export interface ConfirmationCopy {
  pendingPrefix: string;
  undo: string;
  sendNow: string;
  sending: string;
  successTitle: string;
  successNote: string;
  changeChoice: string;
  retry: string;
}

export interface InvitationCopy {
  scrollCue: string;
  prismFaces: readonly [string, string, string, string];
  questionPrefix: string;
  questionFinal: string;
  pickerPrompt: string;
  dateLegend: string;
  timeLegend: string;
  chooseDayFirst: string;
  passedLabel: string;
  midnightAfter: string;
  pausedMessage: string;
  confirmation: ConfirmationCopy;
  closing: string;
}
