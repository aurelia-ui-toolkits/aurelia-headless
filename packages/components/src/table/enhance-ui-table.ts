import { templateCompilerHooks } from 'aurelia';

@templateCompilerHooks
export class EnhanceUiTable {
  compiling(template: HTMLElement | HTMLTemplateElement) {
    template.innerHTML = template.innerHTML.replace(/\sui-table-column="([^"]*)"/g, ' as-element="ui-table-column" id="$1"');
    template.innerHTML = template.innerHTML.replace(/\sui-table-column(?:="")?(?=\s|>)/g, ' as-element="ui-table-column"');
  }
}
