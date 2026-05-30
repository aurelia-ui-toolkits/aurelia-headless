import { templateCompilerHooks } from 'aurelia';

@templateCompilerHooks
export class EnhanceUiCombobox {
  compiling(template: HTMLTemplateElement) {
    template.innerHTML = template.innerHTML
      .replaceAll('<ui-combobox ', '<label as-element="ui-combobox" ui-combobox-element ')
      .replaceAll('</ui-combobox>', '</label>');

    for (const select of template.content?.querySelectorAll('label[as-element="ui-combobox"]') ?? []) {
      for (const list of select.querySelectorAll('ui-list')) {
        if (list.closest('label[as-element="ui-combobox"]') === select && !hasSelectedBinding(list)) {
          list.setAttribute('selected.bind', '$host.selectedOption');
        }
      }
    }

  }
}

function hasSelectedBinding(element: Element): boolean {
  return element.hasAttribute('selected')
    || element.hasAttribute('selected.bind')
    || element.hasAttribute('selected.two-way')
    || element.hasAttribute('selected.to-view')
    || element.hasAttribute('selected.from-view');
}
