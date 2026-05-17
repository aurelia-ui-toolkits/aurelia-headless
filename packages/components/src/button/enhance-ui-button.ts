import { templateCompilerHooks } from 'aurelia';

@templateCompilerHooks
export class EnhanceUiButton {
  compiling(template: HTMLElement | HTMLTemplateElement) {
    template.innerHTML = template.innerHTML.replace(/\sui-button(?:="")?(?=\s|>)/g, ' as-element="ui-button"');
    template.innerHTML = template.innerHTML.replace(/\sui-icon-button(?:="")?(?=\s|>)/g, ' as-element="ui-icon-button"');
  }
}
