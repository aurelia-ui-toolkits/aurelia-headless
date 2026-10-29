import type { UiDatepickerI18n, UiDatepickerYearRange } from './date-utils';

export class UiDatepickerDialogConfiguration {
  label: string = 'Select date';
  dialogFormat: string = 'E, MMM d';
  /** Initial popup time in HH:mm format for empty date-time fields. */
  defaultTime: string | undefined;
  firstDay: number = 0;
  yearRange: UiDatepickerYearRange = { min: 1900, max: 2100 };
  showAll: boolean = false;
  /** Customize individual translations through AureliaHeadlessConfiguration.customize(). */
  readonly i18n: UiDatepickerI18n = {
    cancel: 'Cancel',
    ok: 'OK',
    month: 'Month',
    year: 'Year',
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
    hour: 'Hour',
    minute: 'Minute',
    openPicker: 'Open date picker'
  };
}
