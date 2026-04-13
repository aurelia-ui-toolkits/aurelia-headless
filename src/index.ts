import { IContainer } from 'aurelia';
import { UiButton } from './button/ui-button';

export { UiButton };

export const AureliaHeadlessConfiguration = {
  register(container: IContainer): IContainer {
    return container.register(UiButton);
  }
};
