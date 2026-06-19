import { UiFieldConfiguration } from './field/ui-field-configuration';
import { UiTableConfiguration } from './table/ui-table-configuration';
import { UiDatepickerDialogConfiguration } from './datepicker/ui-datepicker-dialog-configuration';

/** Aggregates the per-component configuration objects so a host app can tweak
 *  them all from a single AureliaHeadlessConfiguration.customize() call. */
export class HeadlessConfiguration {
  readonly field = new UiFieldConfiguration();
  readonly table = new UiTableConfiguration();
  readonly datepicker = new UiDatepickerDialogConfiguration();
}
