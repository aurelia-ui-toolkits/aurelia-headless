import { IContainer } from 'aurelia';
import { UiButton } from './button/ui-button';
import { UiSwitch } from './switch/ui-switch';
import { EnhanceUiButton } from './button/enhance-ui-button';
import { EnhanceUiSwitch } from './switch/enhance-ui-switch';

export { UiButton };
export { UiSwitch };

export const AureliaHeadlessConfiguration = {
  register(container: IContainer): IContainer {
    return container.register(UiButton, EnhanceUiButton, UiSwitch, EnhanceUiSwitch);
  }
};
