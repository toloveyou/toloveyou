interface Env {
  DISCORD_WEBHOOK_URL: string;
  INVITE_ID?: string;
  ALLOWED_ORIGIN?: string;
}

interface IncomingPayload {
  inviteId?: unknown;
  submissionId?: unknown;
  messageId?: unknown;
  dateId?: unknown;
  localDate?: unknown;
  time?: unknown;
  timeLabel?: unknown;
  dateLabel?: unknown;
  timeZone?: unknown;
  pageOpenedAt?: unknown;
  honeypot?: unknown;
}

interface ValidatedPayload {
  inviteId: string;
  submissionId: string;
  messageId?: string;
  dateId: '2026-07-26' | '2026-07-27';
  localDate: string;
  time: string;
  timeLabel: string;
  dateLabel: string;
  timeZone: 'Asia/Jerusalem';
}

interface DiscordMessage {
  id?: unknown;
  embeds?: Array<{
    footer?: {
      text?: unknown;
    };
  }>;
}

const WINDOWS = {
  '2026-07-26': {
    start: 17 * 60,
    end: 24 * 60,
    midnightDate: '2026-07-27',
    dateLabel: 'Sunday, 26 July'
  },
  '2026-07-27': {
    start: 17 * 60,
    end: 21 * 60 + 45,
    midnightDate: null,
    dateLabel: 'Monday, 27 July'
  }
} as const;

const MAX_BODY_BYTES = 8_192;
const DISCORD_MESSAGE_ID_PATTERN = /^\d{15,22}$/;
const DISCORD_WEBHOOK_PATH_PATTERN =
  /^\/api(?:\/v\d+)?\/webhooks\/\d{15,22}\/[A-Za-z0-9._-]{20,}\/?$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'no-referrer'
    }
  });

const empty = (status: number): Response =>
  new Response(null, {
    status,
    headers: {
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'no-referrer'
    }
  });

const isString = (value: unknown, max = 200): value is string =>
  typeof value === 'string' && value.length > 0 && value.length <= max;

function parseTime(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour === 24 && minute === 0) return 24 * 60;
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

function formatTimeLabel(totalMinutes: number): string {
  const minutesInDay = totalMinutes % (24 * 60);
  const hour24 = Math.floor(minutesInDay / 60);
  const minute = minutesInDay % 60;
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 || 12;
  const suffix = totalMinutes === 24 * 60 ? ' — midnight' : '';
  return `${hour12}:${String(minute).padStart(2, '0')} ${period}${suffix}`;
}

function zonedComparable(date: Date, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  });

  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)])
  );

  return (
    parts.year * 100_000_000 +
    parts.month * 1_000_000 +
    parts.day * 10_000 +
    parts.hour * 100 +
    parts.minute
  );
}

function slotComparable(localDate: string, minutes: number): number {
  const [year, month, day] = localDate.split('-').map(Number);
  const effectiveMinutes = minutes === 24 * 60 ? 0 : minutes;

  return (
    year * 100_000_000 +
    month * 1_000_000 +
    day * 10_000 +
    Math.floor(effectiveMinutes / 60) * 100 +
    effectiveMinutes % 60
  );
}

function validate(payload: IncomingPayload, env: Env): ValidatedPayload | null {
  if (
    !isString(payload.inviteId, 80) ||
    !isString(payload.submissionId, 80) ||
    !isString(payload.dateId, 10) ||
    !isString(payload.localDate, 10) ||
    !isString(payload.time, 5) ||
    payload.timeZone !== 'Asia/Jerusalem'
  ) {
    return null;
  }

  const expectedInviteId = env.INVITE_ID ?? 'july-date-2026';
  if (payload.inviteId !== expectedInviteId) return null;
  if (!UUID_PATTERN.test(payload.submissionId)) return null;
  if (payload.dateId !== '2026-07-26' && payload.dateId !== '2026-07-27') return null;

  const window = WINDOWS[payload.dateId];
  const minutes = parseTime(payload.time);
  if (minutes === null) return null;
  if (minutes < window.start || minutes > window.end || minutes % 15 !== 0) return null;

  const expectedLocalDate = minutes === 24 * 60
    ? window.midnightDate
    : payload.dateId;
  if (!expectedLocalDate || payload.localDate !== expectedLocalDate) return null;

  const current = zonedComparable(new Date(), 'Asia/Jerusalem');
  if (slotComparable(payload.localDate, minutes) < current) return null;

  if (
    payload.messageId !== undefined &&
    (typeof payload.messageId !== 'string' ||
      !DISCORD_MESSAGE_ID_PATTERN.test(payload.messageId))
  ) {
    return null;
  }

  const messageId = payload.messageId as string | undefined;

  return {
    inviteId: payload.inviteId,
    submissionId: payload.submissionId,
    messageId,
    dateId: payload.dateId,
    localDate: payload.localDate,
    time: payload.time,
    timeLabel: formatTimeLabel(minutes),
    dateLabel: window.dateLabel,
    timeZone: 'Asia/Jerusalem'
  };
}

function responseMarker(submissionId: string): string {
  return `Date invitation response ${submissionId}`;
}

function discordPayload(payload: ValidatedPayload, isUpdate: boolean): object {
  return {
    username: 'date invitation',
    allowed_mentions: { parse: [] },
    embeds: [
      {
        title: isUpdate ? '💌 Date updated' : '💌 It’s a date',
        description: `**${payload.dateLabel}**\n**${payload.timeLabel}**`,
        color: 10_444_120,
        fields: [
          {
            name: 'Local date and time',
            value: `\`${payload.localDate} ${payload.time}\``,
            inline: true
          },
          {
            name: 'Timezone',
            value: payload.timeZone,
            inline: true
          }
        ],
        footer: {
          text: responseMarker(payload.submissionId)
        },
        timestamp: new Date().toISOString()
      }
    ]
  };
}

function parseWebhookUrl(value: string): URL | null {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    return null;
  }

  const allowedHosts = new Set(['discord.com', 'discordapp.com']);
  if (
    url.protocol !== 'https:' ||
    !allowedHosts.has(url.hostname) ||
    (url.port !== '' && url.port !== '443') ||
    url.username !== '' ||
    url.password !== '' ||
    url.hash !== '' ||
    !DISCORD_WEBHOOK_PATH_PATTERN.test(url.pathname)
  ) {
    return null;
  }

  url.search = '';
  url.hash = '';
  return url;
}

function messageUrl(webhookUrl: URL, messageId: string): URL {
  const url = new URL(webhookUrl.toString());
  url.pathname = `${url.pathname.replace(/\/$/, '')}/messages/${messageId}`;
  url.search = '';
  return url;
}

function belongsToSubmission(message: DiscordMessage, submissionId: string): boolean {
  return message.embeds?.some(
    (embed) => embed.footer?.text === responseMarker(submissionId)
  ) ?? false;
}

async function fetchDiscord(
  input: string,
  init: RequestInit,
  operation: string
): Promise<Response | null> {
  try {
    return await fetch(input, init);
  } catch (error) {
    console.error(`Discord ${operation} request failed`, error);
    return null;
  }
}

async function logDiscordFailure(operation: string, response: Response): Promise<void> {
  const detail = (await response.text().catch(() => '')).slice(0, 500);
  console.error(`Discord ${operation} failed`, response.status, detail);
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.DISCORD_WEBHOOK_URL) {
    return json({ ok: false, error: 'The response channel is not configured.' }, 503);
  }

  const origin = request.headers.get('origin');
  if (env.ALLOWED_ORIGIN && origin !== env.ALLOWED_ORIGIN) {
    return json({ ok: false, error: 'Origin not allowed.' }, 403);
  }

  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().startsWith('application/json')) {
    return json({ ok: false, error: 'Expected JSON.' }, 415);
  }

  const declaredLengthHeader = request.headers.get('content-length');
  if (declaredLengthHeader !== null) {
    const declaredLength = Number(declaredLengthHeader);
    if (!Number.isFinite(declaredLength) || declaredLength < 0) {
      return json({ ok: false, error: 'Invalid content length.' }, 400);
    }
    if (declaredLength > MAX_BODY_BYTES) {
      return json({ ok: false, error: 'Request is too large.' }, 413);
    }
  }

  let bodyText: string;
  try {
    bodyText = await request.text();
  } catch {
    return json({ ok: false, error: 'The request body could not be read.' }, 400);
  }

  if (new TextEncoder().encode(bodyText).byteLength > MAX_BODY_BYTES) {
    return json({ ok: false, error: 'Request is too large.' }, 413);
  }

  let raw: IncomingPayload;
  try {
    raw = JSON.parse(bodyText) as IncomingPayload;
  } catch {
    return json({ ok: false, error: 'Invalid JSON.' }, 400);
  }

  if (typeof raw.honeypot === 'string' && raw.honeypot.trim()) {
    return empty(204);
  }

  if (
    typeof raw.pageOpenedAt !== 'number' ||
    !Number.isFinite(raw.pageOpenedAt) ||
    Date.now() - raw.pageOpenedAt < 1_500
  ) {
    return json({ ok: false, error: 'The response arrived too quickly.' }, 400);
  }

  const payload = validate(raw, env);
  if (!payload) {
    return json({ ok: false, error: 'That date or time is not available.' }, 400);
  }

  const webhookUrl = parseWebhookUrl(env.DISCORD_WEBHOOK_URL);
  if (!webhookUrl) {
    return json({ ok: false, error: 'The response channel is misconfigured.' }, 503);
  }

  let isUpdate = false;
  let deliveryUrl: URL;
  let method: 'POST' | 'PATCH';

  if (payload.messageId) {
    deliveryUrl = messageUrl(webhookUrl, payload.messageId);

    const existingResponse = await fetchDiscord(
      deliveryUrl.toString(),
      {
        method: 'GET',
        headers: { accept: 'application/json' }
      },
      'message lookup'
    );

    if (!existingResponse) {
      return json({ ok: false, error: 'The previous answer could not be verified.' }, 502);
    }
    if (existingResponse.status === 404) {
      deliveryUrl = new URL(webhookUrl.toString());
      deliveryUrl.searchParams.set('wait', 'true');
      method = 'POST';
    } else if (!existingResponse.ok) {
      await logDiscordFailure('message lookup', existingResponse);
      return json({ ok: false, error: 'The previous answer could not be verified.' }, 409);
    } else {
      const existingMessage = await existingResponse.json().catch(() => null) as
        | DiscordMessage
        | null;
      if (!existingMessage || !belongsToSubmission(existingMessage, payload.submissionId)) {
        return json({ ok: false, error: 'The previous answer does not belong to this invitation.' }, 403);
      }

      isUpdate = true;
      method = 'PATCH';
    }
  } else {
    deliveryUrl = new URL(webhookUrl.toString());
    deliveryUrl.searchParams.set('wait', 'true');
    method = 'POST';
  }

  const discordResponse = await fetchDiscord(
    deliveryUrl.toString(),
    {
      method,
      headers: {
        'content-type': 'application/json',
        accept: 'application/json'
      },
      body: JSON.stringify(discordPayload(payload, isUpdate))
    },
    isUpdate ? 'message update' : 'message creation'
  );

  if (!discordResponse) {
    return json({ ok: false, error: 'The answer could not be delivered.' }, 502);
  }
  if (!discordResponse.ok) {
    await logDiscordFailure(isUpdate ? 'message update' : 'message creation', discordResponse);
    return json({ ok: false, error: 'The answer could not be delivered.' }, 502);
  }

  const discordMessage = await discordResponse.json().catch(() => null) as
    | DiscordMessage
    | null;
  const returnedMessageId = typeof discordMessage?.id === 'string'
    ? discordMessage.id
    : payload.messageId;

  if (!returnedMessageId || !DISCORD_MESSAGE_ID_PATTERN.test(returnedMessageId)) {
    return json({ ok: false, error: 'The response channel did not confirm delivery.' }, 502);
  }

  return json({ ok: true, messageId: returnedMessageId });
};
