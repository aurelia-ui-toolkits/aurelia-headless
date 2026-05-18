import { DialogConfigurationStandard } from '@aurelia/dialog';
import { AppTask, IAttrMapper, IContainer, NodeObserverLocator, Registration } from 'aurelia';
import { AlertConfiguration } from './alert-service/alert-configuration';
import { AlertModal } from './alert-service/alert-modal/alert-modal';
import { AlertService } from './alert-service/alert-service';
import { ExceptionsTracker } from './alert-service/exceptions-tracker';
import { PromptDialog } from './alert-service/prompt-dialog/prompt-dialog';
import { UiAlert } from './alert/ui-alert';
import { UiBadge } from './badge/ui-badge';
import { UiButton } from './button/ui-button';
import { UiIconButton } from './button/ui-icon-button';
import { UiCheckbox } from './checkbox/ui-checkbox';
import { UiChip } from './chip/ui-chip';
import { UiCombobox } from './combobox/ui-combobox';
import { UiDisclosure } from './disclosure/ui-disclosure';
import { UiDrawer } from './drawer/ui-drawer';
import { IError, UiInput } from './input/ui-input';
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
import { UiTree } from './tree/ui-tree';
import { EnhanceUiButton } from './button/enhance-ui-button';
import { EnhanceUiCombobox } from './combobox/enhance-ui-combobox';
import { EnhanceUiInput } from './input/enhance-ui-input';
import { EnhanceUiSelect } from './select/enhance-ui-select';
import { EnhanceUiTable } from './table/enhance-ui-table';
import { UiValidationControllerFactory } from './validation/ui-validation-controller-factory';

export { UiButton };
export { AlertConfiguration };
export { AlertModal };
export { AlertService };
export { UiAlert };
export { UiBadge };
export { UiIconButton };
export { UiCheckbox };
export { UiChip };
export { UiCombobox };
export { UiDisclosure };
export { UiDrawer };
export { UiInput };
export { UiMenu };
export { UiValidationControllerFactory };
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
export { UiTree };
export { ExceptionsTracker };
export { PromptDialog };
export { confirmAction } from './alert-service/decorators/confirm-action';
export { usingProgress } from './alert-service/decorators/using-progress';
export type { IWithAlertService } from './alert-service/decorators/using-progress';
export type { IAlertModalPayload } from './alert-service/alert-modal/i-alert-modal-payload';
export type { IPromptDialogData } from './alert-service/prompt-dialog/prompt-dialog';

let registered = false; //

export const AureliaHeadlessConfiguration = {
  register(container: IContainer): IContainer {
    if (registered) {
      return container;
    }
    registered = true;
    AppTask.creating(IContainer, c => {
      const attrMapper = c.get(IAttrMapper);
      const nodeObserverLocator = c.get(NodeObserverLocator);

      // attrMapper.useTwoWay((el, property) => el.tagName === 'MDC-CHECKBOX' ? property === 'checked' : false);
      // nodeObserverLocator.useConfig('MDC-CHECKBOX', 'checked', { events: ['change'], type: CheckedObserver });

      // attrMapper.useTwoWay((el, property) => el.tagName === 'MDC-CHIP' ? property === 'checked' : false);
      // nodeObserverLocator.useConfig('MDC-CHIP', 'checked', { events: ['change'], type: CheckedObserver });

      // attrMapper.useTwoWay((el, property) => el.tagName === 'MDC-RADIO' ? property === 'checked' : false);
      // nodeObserverLocator.useConfig('MDC-RADIO', 'checked', { events: ['change'], type: CheckedObserver });

      // attrMapper.useTwoWay((el, property) => el.hasAttribute('mdc-segmented-button-segment-element') ? property === 'checked' : false);
      // nodeObserverLocator.useConfig('MDC-SEGMENTED-BUTTON-SEGMENT', 'checked', { events: [segmentedButtonEvents.SELECTED, 'unselected'], type: CheckedObserver });

      // attrMapper.useTwoWay((el, property) => el.tagName === 'MDC-SELECT' ? property === 'value' : false);
      // nodeObserverLocator.useConfig('MDC-SELECT', 'value', { events: [strings.CHANGE_EVENT], type: MdcSelectValueObserver });

      // attrMapper.useTwoWay((el, property) => el.tagName === 'MDC-SLIDER' ? property === 'value' || property === 'valuestart' : false);
      // nodeObserverLocator.useConfig({
      //   'MDC-SLIDER': {
      //     value: { events: [sliderEvents.CHANGE, sliderEvents.INPUT] },
      //     valuestart: { events: [sliderEvents.CHANGE, sliderEvents.INPUT] }
      //   }
      // });

      // attrMapper.useTwoWay((el, property) => el.hasAttribute('mdc-switch-element') ? property === 'selected' : false);
      // nodeObserverLocator.useConfig('MDC-SWITCH', 'selected', { events: ['change'] });

      attrMapper.useTwoWay((el, property) => el.hasAttribute('ui-input-element') ? property === 'value' : false);
      nodeObserverLocator.useConfig('UI-INPUT', 'value', { events: ['input', 'change'] });
      attrMapper.useTwoWay((el, property) => el.hasAttribute('ui-select-element') ? property === 'value' : false);
      nodeObserverLocator.useConfig('UI-SELECT', 'value', { events: ['input', 'change'] });
      attrMapper.useTwoWay((el, property) => el.hasAttribute('ui-combobox-element') ? property === 'value' : false);
      nodeObserverLocator.useConfig('UI-COMBOBOX', 'value', { events: ['input', 'change'] });
      attrMapper.useTwoWay((el, property) => el.tagName === 'UI-RADIO-GROUP' ? property === 'value' : false);
      nodeObserverLocator.useConfig('UI-RADIO-GROUP', 'value', { events: ['input', 'change'] });
      attrMapper.useTwoWay((el, property) => el.tagName === 'UI-SLIDER' ? property === 'value' : false);
      nodeObserverLocator.useConfig('UI-SLIDER', 'value', { events: ['input', 'change'] });

    }).register(container);

    return container.register(DialogConfigurationStandard, AlertModal, PromptDialog, Registration.singleton(AlertConfiguration, AlertConfiguration), Registration.singleton(AlertService, AlertService), Registration.singleton(ExceptionsTracker, ExceptionsTracker), UiAlert, UiBadge, UiButton, UiIconButton, EnhanceUiButton, UiCheckbox, UiChip, UiCombobox, EnhanceUiCombobox, UiDisclosure, UiDrawer, UiInput, EnhanceUiInput, UiList, UiListItem, UiMenu, UiPopup, UiProgress, UiRadio, UiRadioGroup, UiSegment, UiSegmentedControl, UiSelect, EnhanceUiSelect, UiSlider, UiSplitter, UiSwitch, UiTab, UiTabs, UiTable, UiTableColumn, EnhanceUiTable, UiToastRegion, Registration.singleton(UiToastService, UiToastService), UiTooltip, Registration.singleton(UiTooltipService, UiTooltipService), UiTree);
  }
};
