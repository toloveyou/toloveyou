import { PUBLIC_RESPONSE_ENDPOINT } from '$env/static/public';
import type { InvitationDateOption } from '$lib/types/invitation';

export const invitationConfig = {
  inviteId: 'july-date-2026',
  timeZone: 'Asia/Jerusalem',
  intervalMinutes: 15,
  revealDelayMs: 2_000,
  autoSubmitDelayMs: 3_000,
  finalFaceThreshold: 0.68,

  endpoint: PUBLIC_RESPONSE_ENDPOINT,

  dates: [
    {
      id: '2026-07-26',
      dayName: 'Sunday',
      shortLabel: '26/07',
      longLabel: 'Sunday, 26 July',
      startMinutes: 17 * 60,
      endMinutes: 24 * 60
    },
    {
      id: '2026-07-27',
      dayName: 'Monday',
      shortLabel: '27/07',
      longLabel: 'Monday, 27 July',
      startMinutes: 17 * 60,
      endMinutes: 21 * 60 + 45
    }
  ] satisfies InvitationDateOption[]
} as const;