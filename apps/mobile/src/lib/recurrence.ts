import { RecurrenceListItem } from '@/api/types';
import { dayMonth, fullDate, intervalLabel, year } from './format';

export function recurrenceSchedule(item: RecurrenceListItem): string {
  const base = intervalLabel(item.intervalMonths);

  if (item.endDate) {
    return `${base} de ${fullDate(item.startDate)} até ${fullDate(item.endDate)}`;
  }

  if (item.occurrences) {
    return `${base}, ${item.occurrences} vezes`;
  }

  return `${base} desde ${fullDate(item.startDate)}`;
}

export function recurrenceProgress(item: RecurrenceListItem): string | null {
  const past = item.generatedCount - item.upcomingCount;
  const bounded = Boolean(item.endDate || item.occurrences);

  const parts: string[] = [];

  if (bounded && past > 0) {
    parts.push(past === 1 ? '1 já aconteceu' : `${past} já aconteceram`);
  }

  if (item.nextOccurrenceDate && !item.endDate) {
    parts.push(`próxima em ${nextLabel(item.nextOccurrenceDate)}`);
  }

  return parts.length > 0 ? parts.join(', ') : null;
}

export function recurrenceLine(item: RecurrenceListItem): string {
  const progress = recurrenceProgress(item);
  return progress ? `${recurrenceSchedule(item)} · ${progress}` : recurrenceSchedule(item);
}

export function batchHorizon(items: RecurrenceListItem[]): string | null {
  const dates = items
    .filter((item) => item.active && item.lastOccurrenceDate)
    .map((item) => item.lastOccurrenceDate as string);

  if (dates.length === 0) return null;

  return dates.reduce((latest, date) => (date > latest ? date : latest));
}

function nextLabel(iso: string): string {
  return year(iso) === new Date().getUTCFullYear() ? dayMonth(iso) : fullDate(iso);
}
