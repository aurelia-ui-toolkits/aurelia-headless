import { format, isValid, parse } from 'date-fns';
import type { Locale } from 'date-fns';

export const DATE_VALUE_FORMAT = 'yyyy-MM-dd';
export const DATETIME_VALUE_FORMAT = "yyyy-MM-dd'T'HH:mm";

export interface DateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

export interface UiDatepickerI18n {
  cancel?: string;
  ok?: string;
  dateFnsLocale?: Locale;
}

export interface UiDatepickerYearRange {
  min: number;
  max: number;
}

export function getCanonicalFormat(time: boolean): string {
  return time ? DATETIME_VALUE_FORMAT : DATE_VALUE_FORMAT;
}

export function parseByFormat(value: string | undefined, formatString: string, locale?: Locale): Date | undefined {
  if (!value) {
    return undefined;
  }
  const date = parse(value, formatString, new Date(), { locale });
  return isValid(date) ? date : undefined;
}

export function parseCanonical(value: string | undefined, time: boolean): Date | undefined {
  return parseByFormat(value, getCanonicalFormat(time));
}

export function formatDate(date: Date, formatString: string, locale?: Locale): string {
  return format(date, formatString, { locale });
}

export function toCanonical(date: Date, time: boolean): string {
  return format(date, getCanonicalFormat(time));
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function isSameDay(a: Date | undefined, b: Date | undefined): boolean {
  return !!a && !!b
    && a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function withTime(date: Date, hour: number, minute: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute);
}

export function clampYearRange(range: Partial<UiDatepickerYearRange> | undefined): UiDatepickerYearRange {
  return {
    min: range?.min ?? 1900,
    max: range?.max ?? 2100
  };
}
