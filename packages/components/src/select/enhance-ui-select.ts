import { templateCompilerHooks } from 'aurelia';
import { setBindingIfNotPresent } from '../base/set-binding-if-not-present';

@templateCompilerHooks
export class EnhanceUiSelect {
  compiling(template: HTMLTemplateElement) {
    template.innerHTML = template.innerHTML
      .replaceAll('<ui-select ', '<label as-element="ui-select" ui-select-element ')
      .replaceAll('</ui-select>', '</label>');

    this.enhanceLists(template.content);
  }

  // automatically add bindings so that the item is highlighted without the user having to add them manually.
  // Recurses into nested <template> content (e.g. selects inside if.bind/repeat.for), which querySelectorAll
  // does not traverse on its own.
  private enhanceLists(root: DocumentFragment | undefined) {
    if (!root) {
      return;
    }

    for (const list of root.querySelectorAll('label[as-element="ui-select"] ui-list')) {
      setBindingIfNotPresent(list, [
        ['selected', '$host.selectedItem'],
        ['items', '$host.items'],
        ['multiple', '$host.multiple'],
        ['typeahead-field', '$host.labelField']
      ]);
    }

    for (const nested of root.querySelectorAll('template')) {
      this.enhanceLists(nested.content);
    }
  }
}
