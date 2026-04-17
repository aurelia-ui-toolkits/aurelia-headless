import { templateCompilerHooks } from 'aurelia';

@templateCompilerHooks
export class EnhanceUiInput {
  compiling(template: HTMLElement | HTMLTemplateElement) {
    template.innerHTML = template.innerHTML
      .replaceAll('<ui-input ', '<label as-element="ui-input" ui-input-element ')
      .replaceAll('</ui-input>', '</label>');
  }
}
