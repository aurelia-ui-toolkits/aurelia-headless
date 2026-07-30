import { templateCompilerHooks } from 'aurelia';

@templateCompilerHooks
export class EnhanceUiTable {
  compiling(template: HTMLElement | HTMLTemplateElement) {
    template.innerHTML = template.innerHTML.replace(/\sui-table-column="([^"]*)"/g, ' as-element="ui-table-column" id="$1"');
    template.innerHTML = template.innerHTML.replace(/\sui-table-column(?:="")?(?=\s|>)/g, ' as-element="ui-table-column"');
    this.enhanceReorderTables(template instanceof HTMLTemplateElement ? template.content : template);
  }

  // In a reorderable table, repeated rows need their data index for the ui-reorder attribute;
  // default it to the repeat's $index when not set explicitly. Recurses into nested <template>
  // content, which querySelectorAll does not traverse.
  private enhanceReorderTables(root: DocumentFragment | HTMLElement | undefined) {
    if (!root) {
      return;
    }

    for (const table of root.querySelectorAll('ui-table[ui-reorder]')) {
      const rows = table.querySelectorAll('tbody tr[repeat\\.for], tbody tr[virtual-repeat\\.for]');
      for (const row of rows) {
        if (!row.hasAttribute('data-index')) {
          row.setAttribute('data-index', '${$index}');
        }
      }
    }

    for (const nested of root.querySelectorAll('template')) {
      this.enhanceReorderTables(nested.content);
    }
  }
}
