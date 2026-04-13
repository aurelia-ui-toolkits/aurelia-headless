import { templateCompilerHooks } from 'aurelia';

@templateCompilerHooks
export class EnhanceUiButton {
  compiling(template: HTMLElement | HTMLTemplateElement) {
    template.innerHTML = template.innerHTML.replaceAll('ui-button=""', 'as-element="ui-button"');
  }
}
