import type { UiDatepickerI18n, UiDatepickerYearRange } from './date-utils';

export class UiDatepickerDialogConfiguration {
  label: string = 'Select date';
  dialogFormat: string = 'E, MMM d';
  firstDay: number = 0;
  yearRange: UiDatepickerYearRange = { min: 1900, max: 2100 };
  showAll: boolean = false;
  i18n: UiDatepickerI18n = {
    cancel: 'Cancel',
    ok: 'OK'
  };
}
