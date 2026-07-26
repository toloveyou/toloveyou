import type {
  InvitationDateOption,
  InvitationDateId,
  TimeOption
} from '$lib/types/invitation';

interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

const two = (value: number): string => String(value).padStart(2, '0');

export function formatMinutes12(minutes: number): string {
  const normalized = minutes === 24 * 60 ? 0 : minutes;
  const hour24 = Math.floor(normalized / 60);
  const minute = normalized % 60;
  const suffix = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 || 12;
  return `${hour12}:${two(minute)} ${suffix}`;
}

export function minutesToValue(minutes: number): string {
  if (minutes === 24 * 60) return '24:00';
  return `${two(Math.floor(minutes / 60))}:${two(minutes % 60)}`;
}

function addOneDay(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const value = new Date(Date.UTC(year, month - 1, day + 1));
  return `${value.getUTCFullYear()}-${two(value.getUTCMonth() + 1)}-${two(value.getUTCDate())}`;
}

function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  });

  const values = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)])
  );

  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute
  };
}

function comparable(parts: ZonedParts): number {
  return (
    parts.year * 100_000_000 +
    parts.month * 1_000_000 +
    parts.day * 10_000 +
    parts.hour * 100 +
    parts.minute
  );
}

function comparableSlot(localDate: string, minutes: number): number {
  const effectiveDate = minutes === 24 * 60 ? addOneDay(localDate) : localDate;
  const effectiveMinutes = minutes === 24 * 60 ? 0 : minutes;
  const [year, month, day] = effectiveDate.split('-').map(Number);

  return comparable({
    year,
    month,
    day,
    hour: Math.floor(effectiveMinutes / 60),
    minute: effectiveMinutes % 60
  });
}

export function buildTimeOptions(
  date: InvitationDateOption,
  intervalMinutes: number,
  timeZone: string,
  now: Date | null
): TimeOption[] {
  const current = now ? comparable(getZonedParts(now, timeZone)) : null;
  const values: TimeOption[] = [];

  for (
    let minutes = date.startMinutes;
    minutes <= date.endMinutes;
    minutes += intervalMinutes
  ) {
    const isMidnightNextDay = minutes === 24 * 60;
    values.push({
      value: minutesToValue(minutes),
      label: formatMinutes12(minutes),
      localDate: isMidnightNextDay ? addOneDay(date.id) : date.id,
      available: current === null || comparableSlot(date.id, minutes) >= current,
      isMidnightNextDay
    });
  }

  return values;
}

export function findDate(
  dates: readonly InvitationDateOption[],
  id: InvitationDateId | null
): InvitationDateOption | null {
  if (!id) return null;
  return dates.find((date) => date.id === id) ?? null;
}
