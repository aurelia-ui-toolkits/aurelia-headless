import { templateCompilerHooks } from 'aurelia';

@templateCompilerHooks
export class EnhanceUiSwitch {
  compiling(template: HTMLElement | HTMLTemplateElement) {
    template.innerHTML = template.innerHTML.replaceAll('ui-switch=""','as-element="ui-switch" ui-switch-element');
  }
}
