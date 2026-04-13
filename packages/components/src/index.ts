import { IContainer } from 'aurelia';
import { UiButton } from './button/ui-button';
import { UiCheckbox } from './checkbox/ui-checkbox';
import { UiDisclosure } from './disclosure/ui-disclosure';
import { UiDisclosureButton } from './disclosure/ui-disclosure-button';
import { UiDisclosurePanel } from './disclosure/ui-disclosure-panel';
import { UiSwitch } from './switch/ui-switch';
import { EnhanceUiButton } from './button/enhance-ui-button';

export { UiButton };
export { UiCheckbox };
export { UiDisclosure };
export { UiDisclosureButton };
export { UiDisclosurePanel };
export { UiSwitch };

export const AureliaHeadlessConfiguration = {
  register(container: IContainer): IContainer {
    return container.register(UiButton, EnhanceUiButton, UiCheckbox, UiDisclosure, UiDisclosureButton, UiDisclosurePanel, UiSwitch);
  }
};
