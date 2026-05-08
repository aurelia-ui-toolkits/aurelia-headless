import { AppTask, IAttrMapper, IContainer, NodeObserverLocator } from 'aurelia';
import { UiButton } from './button/ui-button';
import { UiCheckbox } from './checkbox/ui-checkbox';
import { UiCombobox } from './combobox/ui-combobox';
import { UiDisclosure } from './disclosure/ui-disclosure';
import { IError, UiInput } from './input/ui-input';
import { UiMenu } from './menu/ui-menu';
import { UiList } from './list/ui-list';
import { UiListItem } from './list/ui-list-item';
import { UiPopup } from './popup/ui-popup';
import { UiSelect } from './select/ui-select';
import { UiSwitch } from './switch/ui-switch';
import { UiTab } from './tabs/ui-tab';
import { UiTabs } from './tabs/ui-tabs';
import { EnhanceUiButton } from './button/enhance-ui-button';
import { EnhanceUiCombobox } from './combobox/enhance-ui-combobox';
import { EnhanceUiInput } from './input/enhance-ui-input';
import { EnhanceUiSelect } from './select/enhance-ui-select';
import { UiValidationControllerFactory } from './validation/ui-validation-controller-factory';

export { UiButton };
export { UiCheckbox };
export { UiCombobox };
export { UiDisclosure };
export { UiInput };
export { UiMenu };
export { UiValidationControllerFactory };
export type { IError };
export { UiList };
export { UiListItem };
export { UiPopup };
export { UiSelect };
export { UiSwitch };
export { UiTab };
export { UiTabs };

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

    }).register(container);

    return container.register(UiButton, EnhanceUiButton, UiCheckbox, UiCombobox, EnhanceUiCombobox, UiDisclosure, UiInput, EnhanceUiInput, UiList, UiListItem, UiMenu, UiPopup, UiSelect, EnhanceUiSelect, UiSwitch, UiTab, UiTabs);
  }
};
