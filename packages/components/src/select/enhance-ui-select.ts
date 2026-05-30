import { templateCompilerHooks } from 'aurelia';

@templateCompilerHooks
export class EnhanceUiSelect {
  compiling(template: HTMLTemplateElement) {
    template.innerHTML = template.innerHTML
      .replaceAll('<ui-select ', '<label as-element="ui-select" ui-select-element ')
      .replaceAll('</ui-select>', '</label>');

    // automatically add selected binding so that the item is highlighted without the user having to add it manually
    for (const select of template.content?.querySelectorAll('label[as-element="ui-select"]') ?? []) {
      for (const list of select.querySelectorAll('ui-list')) {
        if (list.closest('label[as-element="ui-select"]') === select && !hasSelectedBinding(list)) {
          list.setAttribute('selected.bind', '$host.selectedItem');
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
