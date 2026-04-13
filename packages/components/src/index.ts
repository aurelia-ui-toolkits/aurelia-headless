import { IContainer } from 'aurelia';
import { UiButton } from './button/ui-button';
import { UiSwitch } from './switch/ui-switch';

export { UiButton };
export { UiSwitch };

export const AureliaHeadlessConfiguration = {
  register(container: IContainer): IContainer {
    return container.register(UiButton, UiSwitch);
  }
};
