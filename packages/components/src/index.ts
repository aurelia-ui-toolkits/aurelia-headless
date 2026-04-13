import { IContainer } from 'aurelia';
import { UiButton } from './button/ui-button';
import { UiCheckbox } from './checkbox/ui-checkbox';
import { UiSwitch } from './switch/ui-switch';
import { EnhanceUiButton } from './button/enhance-ui-button';
import { EnhanceUiSwitch } from './switch/enhance-ui-switch';

export { UiButton };
export { UiCheckbox };
export { UiSwitch };

export const AureliaHeadlessConfiguration = {
  register(container: IContainer): IContainer {
    return container.register(UiButton, EnhanceUiButton, UiCheckbox, UiSwitch, EnhanceUiSwitch);
  }
};
