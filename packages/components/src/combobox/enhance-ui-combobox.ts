import { templateCompilerHooks } from 'aurelia';
import { hasBinding } from '../base/has-binding';

@templateCompilerHooks
export class EnhanceUiCombobox {
  compiling(template: HTMLTemplateElement) {
    template.innerHTML = template.innerHTML
      .replaceAll('<ui-combobox ', '<label as-element="ui-combobox" ui-combobox-element ')
      .replaceAll('</ui-combobox>', '</label>');

    for (const select of template.content?.querySelectorAll('label[as-element="ui-combobox"]') ?? []) {
      for (const list of select.querySelectorAll('ui-list')) {
        if (list.closest('label[as-element="ui-combobox"]') !== select) {
          continue;
        }

        if (!hasBinding(list, 'selected')) {
          list.setAttribute('selected.bind', '$host.selectedOption');
        }
        if (!hasBinding(list, 'items')) {
          list.setAttribute('items.bind', '$host.filteredItems');
        }
        if (!hasBinding(list, 'typeahead-field')) {
          list.setAttribute('typeahead-field.bind', '$host.labelField');
        }
      }
    }
  }
}
