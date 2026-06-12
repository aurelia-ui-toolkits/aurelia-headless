import { DialogConfigurationStandard } from '@aurelia/dialog';
import { AppTask, IAttrMapper, IContainer, NodeObserverLocator, Registration } from 'aurelia';
import { AlertConfiguration } from './alert-service/alert-configuration';
import { UiAlertModal } from './alert-service/alert-modal/alert-modal';
import { AlertService } from './alert-service/alert-service';
import { ExceptionsTracker } from './alert-service/exceptions-tracker';
import { UiPromptDialog } from './alert-service/prompt-dialog/prompt-dialog';
import { UiAlert } from './alert/ui-alert';
import { UiBadge } from './badge/ui-badge';
import { UiBreadcrumbs } from './breadcrumbs/ui-breadcrumbs';
import { UiButton } from './button/ui-button';
import { UiIconButton } from './button/ui-icon-button';
import { UiCheckbox } from './checkbox/ui-checkbox';
import { UiChip } from './chip/ui-chip';
import { UiCombobox } from './combobox/ui-combobox';
import { UiDatepicker } from './datepicker/ui-datepicker';
import { UiDatepickerDialog } from './datepicker/ui-datepicker-dialog';
import { UiDatepickerDialogConfiguration } from './datepicker/ui-datepicker-dialog-configuration';
import { UiDisclosure } from './disclosure/ui-disclosure';
import { UiFloatingActions } from './floating-actions/ui-floating-actions';
import { UiFocusTrap } from './focus-trap/ui-focus-trap';
import { UiSizeCustomAttribute } from './base/ui-size';
import { UiContextMenuCustomAttribute } from './menu/ui-context-menu';
import { UiDrawer } from './drawer/ui-drawer';
import { UiFieldConfiguration } from './field/ui-field-configuration';
import { IError, UiInput } from './input/ui-input';
import { InputmaskConfiguration, UiInputmaskCustomAttribute } from './inputmask';
import { UiMenu } from './menu/ui-menu';
import { UiList } from './list/ui-list';
import { UiListItem } from './list/ui-list-item';
import { UiPopup } from './popup/ui-popup';
import { UiProgress } from './progress/ui-progress';
import { UiRadio } from './radio/ui-radio';
import { UiRadioGroup } from './radio/ui-radio-group';
import { UiSegment } from './segmented-control/ui-segment';
import { UiSegmentedControl } from './segmented-control/ui-segmented-control';
import { UiSelect } from './select/ui-select';
import { UiSlider } from './slider/ui-slider';
import { UiSplitter } from './splitter/ui-splitter';
import { UiSwitch } from './switch/ui-switch';
import { UiTab } from './tabs/ui-tab';
import { UiTabs } from './tabs/ui-tabs';
import { UiTable } from './table/ui-table';
import { UiTableColumn } from './table/ui-table-column';
import { UiToastRegion } from './toast/ui-toast-region';
import { UiToastService } from './toast/ui-toast-service';
import { UiTooltip } from './tooltip/ui-tooltip';
import { UiTooltipService } from './tooltip/ui-tooltip-service';
import { UiTopAppBar } from './top-app-bar/ui-top-app-bar';
import { UiTree } from './tree/ui-tree';
import { UiValidationContainer } from './validation/ui-validation-container';
import { EnhanceUiButton } from './button/enhance-ui-button';
import { EnhanceUiCombobox } from './combobox/enhance-ui-combobox';
import { UiForm } from './form/ui-form';
import { EnhanceUiInput } from './input/enhance-ui-input';
import { EnhanceUiSelect } from './select/enhance-ui-select';
import { EnhanceUiTable } from './table/enhance-ui-table';
import { UiValidationControllerFactory } from './validation/ui-validation-controller-factory';

export { UiButton };
export { AlertConfiguration };
export { UiAlertModal };
export { AlertService };
export { UiAlert };
export { UiBadge };
export { UiBreadcrumbs };
export { UiIconButton };
export { UiCheckbox };
export { UiChip };
export { UiCombobox };
export { UiDatepicker };
export { UiDatepickerDialog };
export { UiDatepickerDialogConfiguration };
export { UiDisclosure };
export { UiFloatingActions };
export { UiFocusTrap };
export { UiSizeCustomAttribute };
export type { Size } from './base/ui-size';
export { UiContextMenuCustomAttribute };
export { UiDrawer };
export { UiFieldConfiguration };
export { UiForm };
export { UiInput };
export { InputmaskConfiguration, UiInputmaskCustomAttribute };
export { UiMenu };
export { UiValidationControllerFactory };
export { UiValidationContainer };
export type { IError };
export { UiList };
export { UiListItem };
export { UiPopup };
export { UiProgress };
export { UiRadio };
export { UiRadioGroup };
export { UiSegment };
export { UiSegmentedControl };
export { UiSelect };
export { UiSlider };
export { UiSplitter };
export { UiSwitch };
export { UiTab };
export { UiTabs };
export { UiTable };
export { UiTableColumn };
export { UiToastRegion };
export { UiToastService };
export { UiTooltip };
export { UiTooltipService };
export { UiTopAppBar };
export { UiTree };
export { ExceptionsTracker };
export { UiPromptDialog as PromptDialog };
export { confirmAction } from './alert-service/decorators/confirm-action';
export { usingProgress } from './alert-service/decorators/using-progress';
export type { IWithAlertService } from './alert-service/decorators/using-progress';
export type { IAlertDialogOptions } from './alert-service/alert-service';
export type { IAlertModalPayload } from './alert-service/alert-modal/i-alert-modal-payload';
export type { IPromptDialogData } from './alert-service/prompt-dialog/prompt-dialog';
export type { UiBreadcrumbItem } from './breadcrumbs/ui-breadcrumbs';
export type { UiDatepickerDialogData, UiDatepickerDialogDay } from './datepicker/ui-datepicker-dialog';
export type { UiDatepickerI18n, UiDatepickerYearRange } from './datepicker/date-utils';
export { validate } from './validation/validate';
export { booleanAttr } from './base/boolean-attr';

let registered = false; //
const fieldConfiguration = new UiFieldConfiguration();

export const AureliaHeadlessConfiguration = {
  customize(optionsProvider: (config: UiFieldConfiguration) => void) {
    return {
      register(container: IContainer): IContainer {
        optionsProvider(fieldConfiguration);
        return AureliaHeadlessConfiguration.register(container);
      }
    };
  },

  register(container: IContainer): IContainer {
    if (registered) {
      return container;
    }
    registered = true;
    AppTask.creating(IContainer, c => {
      const attrMapper = c.get(IAttrMapper);
      const nodeObserverLocator = c.get(NodeObserverLocator);

      attrMapper.useTwoWay((el, property) => el.hasAttribute('ui-input-element') ? property === 'value' : false);
      nodeObserverLocator.useConfig('UI-INPUT', 'value', { events: ['input', 'change'] });
      attrMapper.useTwoWay((el, property) => el.hasAttribute('ui-select-element') ? property === 'value' : false);
      nodeObserverLocator.useConfig('UI-SELECT', 'value', { events: ['input', 'change'] });
      attrMapper.useTwoWay((el, property) => el.hasAttribute('ui-combobox-element') ? property === 'value' : false);
      nodeObserverLocator.useConfig('UI-COMBOBOX', 'value', { events: ['input', 'change'] });
      attrMapper.useTwoWay((el, property) => el.tagName === 'UI-DATEPICKER' ? property === 'value' : false);
      nodeObserverLocator.useConfig('UI-DATEPICKER', 'value', { events: ['input', 'change'] });
      attrMapper.useTwoWay((el, property) => el.tagName === 'UI-RADIO-GROUP' ? property === 'value' : false);
      nodeObserverLocator.useConfig('UI-RADIO-GROUP', 'value', { events: ['input', 'change'] });
      attrMapper.useTwoWay((el, property) => el.tagName === 'UI-SLIDER' ? property === 'value' : false);
      nodeObserverLocator.useConfig('UI-SLIDER', 'value', { events: ['input', 'change'] });
      attrMapper.useTwoWay((el, property) => el.tagName === 'UI-SWITCH' ? property === 'checked' : false);
      nodeObserverLocator.useConfig('UI-SWITCH', 'checked', { events: ['input', 'change'] });

    }).register(container);

    return container.register(InputmaskConfiguration, DialogConfigurationStandard, UiAlertModal, UiPromptDialog, UiDatepickerDialog, Registration.singleton(AlertConfiguration, AlertConfiguration), Registration.singleton(AlertService, AlertService), Registration.singleton(ExceptionsTracker, ExceptionsTracker), Registration.singleton(UiDatepickerDialogConfiguration, UiDatepickerDialogConfiguration), Registration.instance(UiFieldConfiguration, fieldConfiguration), UiAlert, UiBadge, UiBreadcrumbs, UiButton, UiIconButton, EnhanceUiButton, UiCheckbox, UiChip, UiCombobox, EnhanceUiCombobox, UiDatepicker, UiDisclosure, UiFloatingActions, UiFocusTrap, UiSizeCustomAttribute, UiContextMenuCustomAttribute, UiDrawer, UiForm, UiInput, EnhanceUiInput, UiList, UiListItem, UiMenu, UiPopup, UiProgress, UiRadio, UiRadioGroup, UiSegment, UiSegmentedControl, UiSelect, EnhanceUiSelect, UiSlider, UiSplitter, UiSwitch, UiTab, UiTabs, UiTable, UiTableColumn, EnhanceUiTable, UiToastRegion, Registration.singleton(UiToastService, UiToastService), UiTooltip, Registration.singleton(UiTooltipService, UiTooltipService), UiTopAppBar, UiTree, UiValidationContainer);
  }
};
