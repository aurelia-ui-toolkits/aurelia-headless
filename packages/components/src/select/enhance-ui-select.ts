import { templateCompilerHooks } from 'aurelia';
import { setBindingIfNotPresent } from '../base/set-binding-if-not-present';

@templateCompilerHooks
export class EnhanceUiSelect {
  compiling(template: HTMLTemplateElement) {
    template.innerHTML = template.innerHTML
      .replaceAll('<ui-select ', '<label as-element="ui-select" ui-select-element ')
      .replaceAll('</ui-select>', '</label>');

    // automatically add selected binding so that the item is highlighted without the user having to add it manually
    for (const list of template.content?.querySelectorAll('label[as-element="ui-select"] ui-list') ?? []) {
      setBindingIfNotPresent(list, [
        ['selected', '$host.selectedItem'],
        ['items', '$host.items'],
        ['multiple', '$host.multiple'],
        ['typeahead-field', '$host.labelField']
      ]);
    }
  }
}
