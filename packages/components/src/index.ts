import { AppTask, IAttrMapper, IContainer, NodeObserverLocator } from 'aurelia';
import { UiButton } from './button/ui-button';
import { UiCheckbox } from './checkbox/ui-checkbox';
import { UiDisclosure } from './disclosure/ui-disclosure';
import { IError, UiInput } from './input/ui-input';
import { UiList } from './list/ui-list';
import { UiListItem } from './list/ui-list-item';
import { UiPopup } from './popup/ui-popup';
import { UiSwitch } from './switch/ui-switch';
import { EnhanceUiButton } from './button/enhance-ui-button';
import { EnhanceUiInput } from './input/enhance-ui-input';

export { UiButton };
export { UiCheckbox };
export { UiDisclosure };
export { UiInput };
export type { IError };
export { UiList };
export { UiListItem };
export { UiPopup };
export { UiSwitch };

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

    }).register(container);

    return container.register(UiButton, EnhanceUiButton, UiCheckbox, UiDisclosure, UiInput, EnhanceUiInput, UiList, UiListItem, UiPopup, UiSwitch);
  }
};
