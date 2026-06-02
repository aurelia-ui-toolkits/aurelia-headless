import { templateCompilerHooks } from 'aurelia';
import { hasBinding } from '../base/has-binding';

@templateCompilerHooks
export class EnhanceUiSelect {
  compiling(template: HTMLTemplateElement) {
    template.innerHTML = template.innerHTML
      .replaceAll('<ui-select ', '<label as-element="ui-select" ui-select-element ')
      .replaceAll('</ui-select>', '</label>');

    // automatically add selected binding so that the item is highlighted without the user having to add it manually
    for (const select of template.content?.querySelectorAll('label[as-element="ui-select"]') ?? []) {
      for (const list of select.querySelectorAll('ui-list')) {
        if (list.closest('label[as-element="ui-select"]') !== select) {
          continue;
        }

        if (!hasBinding(list, 'selected')) {
          list.setAttribute('selected.bind', '$host.selectedItem');
        }
        if (!hasBinding(list, 'items')) {
          list.setAttribute('items.bind', '$host.items');
        }
        if (!hasBinding(list, 'multiple')) {
          list.setAttribute('multiple.bind', '$host.multiple');
        }
        if (!hasBinding(list, 'typeahead-field')) {
          list.setAttribute('typeahead-field.bind', '$host.labelField');
        }
      }
    }
  }
}
