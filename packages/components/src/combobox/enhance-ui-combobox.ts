import { templateCompilerHooks } from 'aurelia';
import { setBindingIfNotPresent } from '../base/set-binding-if-not-present';

@templateCompilerHooks
export class EnhanceUiCombobox {
  compiling(template: HTMLTemplateElement) {
    template.innerHTML = template.innerHTML
      .replaceAll('<ui-combobox ', '<label as-element="ui-combobox" ui-combobox-element ')
      .replaceAll('</ui-combobox>', '</label>');

    for (const list of template.content?.querySelectorAll('label[as-element="ui-combobox"] ui-list') ?? []) {
      setBindingIfNotPresent(list, [
        ['selected', '$host.selectedOption'],
        ['items', '$host.filteredItems'],
        ['typeahead-field', '$host.labelField']
      ]);
    }
  }
}
