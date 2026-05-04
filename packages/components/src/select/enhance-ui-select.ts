import { templateCompilerHooks } from 'aurelia';

@templateCompilerHooks
export class EnhanceUiSelect {
  compiling(template: HTMLElement | HTMLTemplateElement) {
    template.innerHTML = template.innerHTML
      .replaceAll('<ui-select ', '<label as-element="ui-select" ui-select-element ')
      .replaceAll('</ui-select>', '</label>');
  }
}
