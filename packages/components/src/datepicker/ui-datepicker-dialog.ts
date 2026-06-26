import { IDialogController } from '@aurelia/dialog';
import { customElement, INode, resolve } from 'aurelia';
import { formatDate, getDaysInMonth, isSameDay, parseCanonical, startOfLocalDay, toCanonical, UiDatepickerI18n, UiDatepickerYearRange, withTime } from './date-utils';
import { UiDatepickerDialogConfiguration } from './ui-datepicker-dialog-configuration';

export interface UiDatepickerDialogDay {
  date: Date | undefined;
  label: string;
  disabled: boolean;
  outside: boolean;
  selected: boolean;
  today: boolean;
}

interface UiDatepickerDialogOption<T> {
  value: T;
  label: string;
  disabled?: boolean;
}

export interface UiDatepickerDialogData {
  value: string | undefined;
  label?: string;
  dialogFormat?: string;
  time?: boolean;
  minuteStep?: number;
  min?: string;
  max?: string;
  disableFunction?: (date: Date) => boolean;
  disableWeekends?: boolean;
  firstDay?: number;
  yearRange?: Partial<UiDatepickerYearRange>;
  showAll?: boolean;
  i18n?: UiDatepickerI18n;
}

@customElement('ui-datepicker-dialog')
export class UiDatepickerDialog {
  private readonly element = resolve(INode) as HTMLElement;
  private readonly dialog = resolve(IDialogController);
  private readonly configuration = resolve(UiDatepickerDialogConfiguration);

  data: UiDatepickerDialogData = { value: undefined };
  selectedDate: Date = new Date();
  visibleMonth: number = this.selectedDate.getMonth();
  visibleYear: number = this.selectedDate.getFullYear();
  years: UiDatepickerDialogOption<number>[] = [];
  months: UiDatepickerDialogOption<number>[] = [];
  selectedYear: UiDatepickerDialogOption<number> | undefined;
  selectedMonth: UiDatepickerDialogOption<number> | undefined;
  weekdays: string[] = [];
  days: UiDatepickerDialogDay[] = [];
  hour: number = 0;
  minute: number = 0;
  portalTarget: Element | undefined;

  activate(data: UiDatepickerDialogData): void {
    const i18n = { ...this.configuration.i18n, ...data.i18n };
    this.data = {
      ...data,
      label: data.label ?? this.configuration.label,
      dialogFormat: data.dialogFormat ?? this.configuration.dialogFormat,
      firstDay: data.firstDay ?? this.configuration.firstDay,
      yearRange: { ...this.configuration.yearRange, ...data.yearRange },
      showAll: data.showAll ?? this.configuration.showAll,
      i18n
    };

    const initial = parseCanonical(data.value, !!data.time) ?? new Date();
    this.selectedDate = this.clampDate(initial);
    this.hour = this.selectedDate.getHours();
    this.minute = this.selectedDate.getMinutes();
    this.visibleMonth = this.selectedDate.getMonth();
    this.visibleYear = this.selectedDate.getFullYear();
    this.buildCalendar();
  }

  attached(): void {
    this.portalTarget = this.element.closest('dialog') ?? undefined;
  }

  get title(): string {
    return formatDate(this.selectedDate, this.data.dialogFormat ?? this.configuration.dialogFormat, this.data.i18n?.dateFnsLocale);
  }

  get okText(): string {
    return this.data.i18n?.ok ?? 'OK';
  }

  get cancelText(): string {
    return this.data.i18n?.cancel ?? 'Cancel';
  }

  get minuteStep(): number {
    return Math.max(1, this.data.minuteStep ?? 1);
  }

  buildCalendar(): void {
    const yearRange = this.getYearRange();
    this.years = Array.from({ length: yearRange.max - yearRange.min + 1 }, (_, i) => {
      const year = yearRange.min + i;
      return { value: year, label: String(year) };
    });
    this.months = Array.from({ length: 12 }, (_, i) => ({
      value: i,
      label: formatDate(new Date(2020, i, 1), 'LLLL', this.data.i18n?.dateFnsLocale),
      disabled: this.isMonthDisabled(this.visibleYear, i)
    }));
    this.selectedMonth = this.months.find(month => month.value === this.visibleMonth);
    this.selectedYear = this.years.find(year => year.value === this.visibleYear);
    this.weekdays = Array.from({ length: 7 }, (_, i) => {
      const day = 1 + ((this.data.firstDay ?? 0) + i) % 7;
      return formatDate(new Date(2020, 10, day), 'EEEEE', this.data.i18n?.dateFnsLocale);
    });

    const first = new Date(this.visibleYear, this.visibleMonth, 1);
    const offset = (first.getDay() - (this.data.firstDay ?? 0) + 7) % 7;
    const today = startOfLocalDay(new Date());
    this.days = Array.from({ length: 42 }, (_, i) => {
      const date = new Date(this.visibleYear, this.visibleMonth, i - offset + 1, this.hour, this.minute);
      const outside = date.getMonth() !== this.visibleMonth;
      const visible = this.data.showAll || !outside;
      const disabled = !visible || this.isDayDisabled(date, outside);
      return {
        date: visible ? date : undefined,
        label: String(date.getDate()),
        disabled,
        outside,
        selected: isSameDay(date, this.selectedDate),
        today: isSameDay(date, today)
      };
    });
  }

  selectDay(day: UiDatepickerDialogDay): void {
    if (!day.date || day.disabled) {
      return;
    }
    this.selectedDate = withTime(day.date, this.hour, this.minute);
    this.visibleMonth = this.selectedDate.getMonth();
    this.visibleYear = this.selectedDate.getFullYear();
    this.buildCalendar();
  }

  prev(): void {
    const next = new Date(this.visibleYear, this.visibleMonth - 1, 1);
    this.visibleYear = next.getFullYear();
    this.visibleMonth = next.getMonth();
    this.buildCalendar();
  }

  next(): void {
    const next = new Date(this.visibleYear, this.visibleMonth + 1, 1);
    this.visibleYear = next.getFullYear();
    this.visibleMonth = next.getMonth();
    this.buildCalendar();
  }

  monthChanged(): void {
    this.buildCalendar();
  }

  yearChanged(): void {
    this.buildCalendar();
  }

  timeChanged(): void {
    this.selectedDate = withTime(this.selectedDate, this.hour, this.minute);
    this.buildCalendar();
  }

  async cancel() {
    return this.dialog.cancel();
  }

  async ok() {
    return this.dialog.ok(toCanonical(this.selectedDate, !!this.data.time));
  }

  private getYearRange(): UiDatepickerYearRange {
    const range = this.data.yearRange ?? this.configuration.yearRange;
    return { min: range.min ?? 1900, max: range.max ?? 2100 };
  }

  private isMonthDisabled(year: number, month: number): boolean {
    const first = new Date(year, month, 1);
    const last = new Date(year, month, getDaysInMonth(year, month));
    const min = parseCanonical(this.data.min, !!this.data.time);
    const max = parseCanonical(this.data.max, !!this.data.time);
    return !!min && last < startOfLocalDay(min) || !!max && first > startOfLocalDay(max);
  }

  private isDayDisabled(date: Date, outside: boolean): boolean {
    const min = parseCanonical(this.data.min, !!this.data.time);
    const max = parseCanonical(this.data.max, !!this.data.time);
    const day = startOfLocalDay(date);
    return outside && !this.data.showAll
      || !!min && day < startOfLocalDay(min)
      || !!max && day > startOfLocalDay(max)
      || !!this.data.disableWeekends && (date.getDay() === 0 || date.getDay() === 6)
      || !!this.data.disableFunction?.(date);
  }

  private clampDate(date: Date): Date {
    const min = parseCanonical(this.data.min, !!this.data.time);
    const max = parseCanonical(this.data.max, !!this.data.time);
    if (min && date < min) {
      return min;
    }
    if (max && date > max) {
      return max;
    }
    return date;
  }
}
