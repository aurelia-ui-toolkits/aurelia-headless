import { bindable, BindingMode, customElement, INode, resolve } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';
import { Keys } from '../base/keys';
import template from './ui-tree.html?raw';

type TreeField<T> = string | ((item: T) => unknown);
type TreeSelectionMode = 'single' | 'none';

export interface UiTreeRow {
  id: string;
  item: unknown;
  value: unknown;
  label: string;
  depth: number;
  parent: UiTreeRow | undefined;
  children: UiTreeRow[];
  expanded: boolean;
  disabled: boolean;
  posInSet: number;
  setSize: number;
  element: HTMLElement | undefined;
  slotHost: UiTreeRowSlotHost;
}

export interface UiTreeRowSlotHost {
  item: unknown;
  row: UiTreeRow;
}

@customElement({ name: 'ui-tree', template })
export class UiTree {
  private readonly host = resolve(INode) as HTMLElement;
  private expandedValues = new Set<unknown>();

  @bindable
  items: unknown[] = [];
  itemsChanged(): void {
    this.rebuildRows();
  }

  @bindable({ mode: BindingMode.twoWay })
  value: unknown;
  valueChanged(): void {
    if (this.value !== undefined) {
      this.activeValue = this.value;
    }
  }

  @bindable
  label: string | undefined;

  @bindable
  childrenField: TreeField<unknown> = 'children';
  childrenFieldChanged(): void {
    this.rebuildRows();
  }

  @bindable
  valueField: TreeField<unknown> = 'value';
  valueFieldChanged(): void {
    this.rebuildRows();
  }

  @bindable
  labelField: TreeField<unknown> = 'label';
  labelFieldChanged(): void {
    this.rebuildRows();
  }

  @bindable
  disabledField: TreeField<unknown> = 'disabled';
  disabledFieldChanged(): void {
    this.rebuildRows();
  }

  @bindable
  expandedField: TreeField<unknown> = 'expanded';
  expandedFieldChanged(): void {
    this.rebuildRows(true);
  }

  @bindable
  selectionMode: TreeSelectionMode = 'single';

  @bindable({ set: booleanAttr })
  disabled: boolean = false;

  visibleRows: UiTreeRow[] = [];
  activeValue: unknown;

  binding(): void {
    this.rebuildRows(true);
  }

  onRowClick(row: UiTreeRow): void {
    this.focusRow(row);
    this.selectRow(row);
  }

  onToggleClick(row: UiTreeRow, event: Event): void {
    event.stopPropagation();
    this.focusRow(row);
    this.toggleRow(row);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (this.disabled) {
      return;
    }

    const row = this.getFocusedRow();
    if (!row) {
      return;
    }

    if (event.key === Keys.ArrowDown) {
      event.preventDefault();
      this.focusSibling(row, 1);
      return;
    }

    if (event.key === Keys.ArrowUp) {
      event.preventDefault();
      this.focusSibling(row, -1);
      return;
    }

    if (event.key === Keys.ArrowRight) {
      event.preventDefault();
      this.expandOrEnter(row);
      return;
    }

    if (event.key === Keys.ArrowLeft) {
      event.preventDefault();
      this.collapseOrExit(row);
      return;
    }

    if (event.key === Keys.Home) {
      event.preventDefault();
      this.focusFirst();
      return;
    }

    if (event.key === Keys.End) {
      event.preventDefault();
      this.focusLast();
      return;
    }

    if (event.key === Keys.Enter || event.key === Keys.Space) {
      event.preventDefault();
      this.selectRow(row);
    }
  }

  private rebuildRows(applyInitialExpanded = false): void {
    if (applyInitialExpanded) {
      this.expandedValues.clear();
    }

    const roots = Array.isArray(this.items) ? this.items : [];
    const rows = this.buildRows(roots, 0, undefined, '0', applyInitialExpanded);
    this.visibleRows = this.flattenVisibleRows(rows);
    if (this.activeValue === undefined) {
      this.activeValue = this.value ?? this.visibleRows.find(row => !row.disabled)?.value;
    }
  }

  private buildRows(items: unknown[], depth: number, parent: UiTreeRow | undefined, path: string, applyInitialExpanded: boolean): UiTreeRow[] {
    return items.map((item, index) => {
      const value = this.getFieldValue(item, this.valueField) ?? item;
      const children = this.getChildren(item);
      if (applyInitialExpanded && this.getBooleanFieldValue(item, this.expandedField)) {
        this.expandedValues.add(value);
      }

      const row = {
        id: `${path}-${index}`,
        item,
        value,
        label: this.getLabel(item),
        depth,
        parent,
        children: [] as UiTreeRow[],
        expanded: this.expandedValues.has(value),
        disabled: this.getBooleanFieldValue(item, this.disabledField),
        posInSet: index + 1,
        setSize: items.length,
        element: undefined,
        slotHost: undefined as unknown as UiTreeRowSlotHost
      } satisfies UiTreeRow;
      row.slotHost = { item, row };
      row.children = this.buildRows(children, depth + 1, row, row.id, applyInitialExpanded);
      return row;
    });
  }

  private flattenVisibleRows(rows: UiTreeRow[]): UiTreeRow[] {
    const visible: UiTreeRow[] = [];
    for (const row of rows) {
      visible.push(row);
      if (row.expanded && row.children.length) {
        visible.push(...this.flattenVisibleRows(row.children));
      }
    }
    return visible;
  }

  private getChildren(item: unknown): unknown[] {
    const children = this.getFieldValue(item, this.childrenField);
    return Array.isArray(children) ? children : [];
  }

  private getLabel(item: unknown): string {
    const label = this.getFieldValue(item, this.labelField);
    return label === undefined || label === null ? '' : String(label);
  }

  private getBooleanFieldValue(item: unknown, field: TreeField<unknown>): boolean {
    return !!this.getFieldValue(item, field);
  }

  private getFieldValue(item: unknown, field: TreeField<unknown>): unknown {
    if (typeof field === 'function') {
      return field(item);
    }

    if (item && typeof item === 'object') {
      return (item as Record<string, unknown>)[field];
    }

    return undefined;
  }

  private getFocusedRow(): UiTreeRow | undefined {
    const element = document.activeElement instanceof HTMLElement ? document.activeElement.closest('[data-tree-row-id]') : null;
    const id = element?.getAttribute('data-tree-row-id');
    return this.visibleRows.find(row => row.id === id) ?? this.visibleRows.find(row => row.value === this.activeValue);
  }

  private focusSibling(row: UiTreeRow, direction: 1 | -1): void {
    const rows = this.enabledRows;
    const index = rows.indexOf(row);
    if (index < 0) {
      return;
    }

    this.focusRow(rows[Math.max(0, Math.min(rows.length - 1, index + direction))]);
  }

  private expandOrEnter(row: UiTreeRow): void {
    if (!row.children.length) {
      return;
    }

    if (!row.expanded) {
      this.expandRow(row);
      return;
    }

    const child = row.children.find(item => !item.disabled);
    if (child) {
      this.focusRow(child);
    }
  }

  private collapseOrExit(row: UiTreeRow): void {
    if (row.children.length && row.expanded) {
      this.collapseRow(row);
      return;
    }

    if (row.parent) {
      this.focusRow(row.parent);
    }
  }

  private focusFirst(): void {
    const row = this.enabledRows[0];
    if (row) {
      this.focusRow(row);
    }
  }

  private focusLast(): void {
    const rows = this.enabledRows;
    const row = rows[rows.length - 1];
    if (row) {
      this.focusRow(row);
    }
  }

  private get enabledRows(): UiTreeRow[] {
    return this.visibleRows.filter(row => !row.disabled);
  }

  private focusRow(row: UiTreeRow): void {
    if (row.disabled) {
      return;
    }

    this.activeValue = row.value;
    row.element?.focus();
  }

  private selectRow(row: UiTreeRow): void {
    if (this.disabled || row.disabled || this.selectionMode === 'none' || this.value === row.value) {
      return;
    }

    this.value = row.value;
    this.activeValue = row.value;
    this.host.dispatchEvent(new CustomEvent('tree-select', { bubbles: true, detail: row.item }));
    this.dispatchValueEvent('input');
    this.dispatchValueEvent('change');
  }

  private toggleRow(row: UiTreeRow): void {
    if (!row.children.length || row.disabled) {
      return;
    }

    if (row.expanded) {
      this.collapseRow(row);
    } else {
      this.expandRow(row);
    }
  }

  private expandRow(row: UiTreeRow): void {
    this.expandedValues.add(row.value);
    this.host.dispatchEvent(new CustomEvent('tree-expand', { bubbles: true, detail: row.item }));
    this.rebuildRows();
  }

  private collapseRow(row: UiTreeRow): void {
    this.expandedValues.delete(row.value);
    this.host.dispatchEvent(new CustomEvent('tree-collapse', { bubbles: true, detail: row.item }));
    this.rebuildRows();
  }

  private dispatchValueEvent(type: 'input' | 'change'): void {
    this.host.dispatchEvent(new Event(type, { bubbles: true }));
  }
}
