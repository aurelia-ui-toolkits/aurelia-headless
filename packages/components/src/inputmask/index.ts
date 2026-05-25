import { OptionsStore } from './options-store';
import { IContainer } from 'aurelia';
import { InputmaskCustomAttribute } from './inputmask-attribute';

let registered = false;

export const InputmaskConfiguration = {
  register(container: IContainer): IContainer {
    if (registered) {
      return container;
    } else {
      registered = true;
      return container.register(InputmaskCustomAttribute);
    }
  },
  customize(optionsProvider: (config: Record<string, unknown>) => void) {
    return {
      register(container: IContainer): IContainer {
        const store = container.get(OptionsStore);
        optionsProvider(store.options);
        return InputmaskConfiguration.register(container);
      },
    };
  }
};

export { InputmaskCustomAttribute } from './inputmask-attribute';
