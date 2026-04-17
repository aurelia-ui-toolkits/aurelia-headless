import { IContainer } from 'aurelia';
import { UiButton } from './button/ui-button';
import { UiCheckbox } from './checkbox/ui-checkbox';
import { UiDisclosure } from './disclosure/ui-disclosure';
import { IError, UiInput } from './input/ui-input';
import { UiList } from './list/ui-list';
import { UiListItem } from './list/ui-list-item';
import { UiPopup } from './popup/ui-popup';
import { UiSwitch } from './switch/ui-switch';
import { EnhanceUiButton } from './button/enhance-ui-button';

export { UiButton };
export { UiCheckbox };
export { UiDisclosure };
export { UiInput };
export type { IError };
export { UiList };
export { UiListItem };
export { UiPopup };
export { UiSwitch };

export const AureliaHeadlessConfiguration = {
  register(container: IContainer): IContainer {
    return container.register(UiButton, EnhanceUiButton, UiCheckbox, UiDisclosure, UiInput, UiList, UiListItem, UiPopup, UiSwitch);
  }
};
