import { UiFieldConfiguration } from './field/ui-field-configuration';
import { UiTableConfiguration } from './table/ui-table-configuration';
import { UiDatepickerDialogConfiguration } from './datepicker/ui-datepicker-dialog-configuration';
import { AlertConfiguration } from './alert-service/alert-configuration';
import { UiAlertConfiguration } from './alert/ui-alert-configuration';
import { UiBreadcrumbsConfiguration } from './breadcrumbs/ui-breadcrumbs-configuration';
import { UiChipConfiguration } from './chip/ui-chip-configuration';
import { UiFloatingActionsConfiguration } from './floating-actions/ui-floating-actions-configuration';
import { UiProgressConfiguration } from './progress/ui-progress-configuration';
import { UiSliderConfiguration } from './slider/ui-slider-configuration';
import { UiToastRegionConfiguration } from './toast/ui-toast-region-configuration';

/** Aggregates the per-component configuration objects so a host app can tweak
 *  them all from a single AureliaHeadlessConfiguration.customize() call. */
export class HeadlessConfiguration {
  private readonly fieldConfiguration = new UiFieldConfiguration();
  private readonly tableConfiguration = new UiTableConfiguration();
  private readonly datepickerConfiguration = new UiDatepickerDialogConfiguration();
  private readonly alertServiceConfiguration = new AlertConfiguration();
  private readonly alertConfiguration = new UiAlertConfiguration();
  private readonly breadcrumbsConfiguration = new UiBreadcrumbsConfiguration();
  private readonly chipConfiguration = new UiChipConfiguration();
  private readonly floatingActionsConfiguration = new UiFloatingActionsConfiguration();
  private readonly progressConfiguration = new UiProgressConfiguration();
  private readonly sliderConfiguration = new UiSliderConfiguration();
  private readonly toastRegionConfiguration = new UiToastRegionConfiguration();

  get field(): UiFieldConfiguration {
    return this.fieldConfiguration;
  }

  get table(): UiTableConfiguration {
    return this.tableConfiguration;
  }

  get datepicker(): UiDatepickerDialogConfiguration {
    return this.datepickerConfiguration;
  }

  get alertService(): AlertConfiguration {
    return this.alertServiceConfiguration;
  }

  get alert(): UiAlertConfiguration {
    return this.alertConfiguration;
  }

  get breadcrumbs(): UiBreadcrumbsConfiguration {
    return this.breadcrumbsConfiguration;
  }

  get chip(): UiChipConfiguration {
    return this.chipConfiguration;
  }

  get floatingActions(): UiFloatingActionsConfiguration {
    return this.floatingActionsConfiguration;
  }

  get progress(): UiProgressConfiguration {
    return this.progressConfiguration;
  }

  get slider(): UiSliderConfiguration {
    return this.sliderConfiguration;
  }

  get toastRegion(): UiToastRegionConfiguration {
    return this.toastRegionConfiguration;
  }
}
