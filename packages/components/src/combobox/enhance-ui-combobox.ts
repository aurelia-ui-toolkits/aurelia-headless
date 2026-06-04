import { templateCompilerHooks } from 'aurelia';
import { setBindingIfNotPresent } from '../base/set-binding-if-not-present';

@templateCompilerHooks
export class EnhanceUiCombobox {
  compiling(template: HTMLTemplateElement) {
    template.innerHTML = template.innerHTML
      .replaceAll('<ui-combobox ', '<label as-element="ui-combobox" ui-combobox-element ')
      .replaceAll('</ui-combobox>', '</label>');

    this.enhanceLists(template.content);
  }

  // Recurses into nested <template> content (e.g. comboboxes inside if.bind/repeat.for), which
  // querySelectorAll does not traverse on its own.
  private enhanceLists(root: DocumentFragment | undefined) {
    if (!root) {
      return;
    }

    for (const list of root.querySelectorAll('label[as-element="ui-combobox"] ui-list')) {
      setBindingIfNotPresent(list, [
        ['selected', '$host.selectedOption'],
        ['items', '$host.filteredItems'],
        ['typeahead-field', '$host.labelField']
      ]);
    }

    for (const nested of root.querySelectorAll('template')) {
      this.enhanceLists(nested.content);
    }
  }
}
