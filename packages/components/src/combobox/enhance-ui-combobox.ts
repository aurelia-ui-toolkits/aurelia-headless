import { templateCompilerHooks } from 'aurelia';

@templateCompilerHooks
export class EnhanceUiCombobox {
  compiling(template: HTMLElement | HTMLTemplateElement) {
    template.innerHTML = template.innerHTML
      .replaceAll('<ui-combobox ', '<label as-element="ui-combobox" ui-combobox-element ')
      .replaceAll('</ui-combobox>', '</label>');
  }
}
