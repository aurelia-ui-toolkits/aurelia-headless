import { templateCompilerHooks } from 'aurelia';
import { setBindingIfNotPresent } from '../base/set-binding-if-not-present';

@templateCompilerHooks
export class EnhanceUiList {
  compiling(template: HTMLTemplateElement) {
    this.enhanceReorderLists(template.content);
  }

  // In a reorderable list, repeated items need their data index (value-identity lookup breaks
  // on duplicate values); default the binding to the repeat's $index when not set explicitly.
  // Recurses into nested <template> content, which querySelectorAll does not traverse.
  private enhanceReorderLists(root: DocumentFragment | undefined) {
    if (!root) {
      return;
    }

    const lists = root.querySelectorAll('ui-list[ui-reorder], [as-element="ui-list"][ui-reorder]');
    for (const list of lists) {
      const items = list.querySelectorAll(
        'ui-list-item[repeat\\.for], ui-list-item[virtual-repeat\\.for], [as-element="ui-list-item"][repeat\\.for], [as-element="ui-list-item"][virtual-repeat\\.for]');
      for (const item of items) {
        setBindingIfNotPresent(item, [['index', '$index']]);
      }
    }

    for (const nested of root.querySelectorAll('template')) {
      this.enhanceReorderLists(nested.content);
    }
  }
}
