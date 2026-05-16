import { bindable, BindingMode, customElement, INode, resolve } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';
import { UiTableColumn } from './ui-table-column';
import template from './ui-table.html?raw';

export type UiTableSortDirection = 'asc' | 'desc';

export interface UiTableSort {
  column: string;
  direction: UiTableSortDirection;
}

@customElement({ name: 'ui-table', template })
export class UiTable {
  private readonly host = resolve(INode) as HTMLElement;
  private readonly columns = new Set<UiTableColumn>();
  private columnSizes: Record<string, number> = {};

  @bindable({ mode: BindingMode.twoWay })
  sort: UiTableSort | undefined;

  @bindable({ mode: BindingMode.twoWay })
  page: number = 1;

  @bindable({ mode: BindingMode.twoWay })
  pageSize: number = 10;

  @bindable
  total: number = 0;

  @bindable
  storageKey: string | undefined;
  storageKeyChanged(): void {
    this.loadColumnSizes();
    this.applyColumnSizes();
  }

  @bindable({ set: booleanAttr })
  sortable: boolean = true;

  @bindable({ set: booleanAttr })
  resizable: boolean = true;

  attaching(): void {
    this.loadColumnSizes();
  }

  registerColumn(column: UiTableColumn): void {
    this.columns.add(column);
    column.applyWidth(this.columnSizes[column.id]);
    column.syncSortState();
  }

  unregisterColumn(column: UiTableColumn): void {
    this.columns.delete(column);
  }

  toggleSort(columnId: string): void {
    if (!this.sort || this.sort.column !== columnId) {
      this.sort = { column: columnId, direction: 'asc' };
    } else if (this.sort.direction === 'asc') {
      this.sort = { column: columnId, direction: 'desc' };
    } else {
      this.sort = undefined;
    }

    this.syncColumnSortState();
    this.host.dispatchEvent(new CustomEvent('sort-change', {
      bubbles: true,
      detail: this.sort
    }));
  }

  getSortDirection(columnId: string): UiTableSortDirection | undefined {
    return this.sort?.column === columnId ? this.sort.direction : undefined;
  }

  setColumnWidth(columnId: string, width: number, persist = false): void {
    this.columnSizes[columnId] = width;
    for (const column of this.columns) {
      if (column.id === columnId) {
        column.applyWidth(width);
      }
    }

    if (persist) {
      this.persistColumnSizes();
    }
  }

  sortChanged(): void {
    this.syncColumnSortState();
  }

  nextPage(): void {
    const next = this.page + 1;
    if (next <= this.totalPages) {
      this.setPage(next);
    }
  }

  previousPage(): void {
    this.setPage(Math.max(1, this.page - 1));
  }

  setPage(page: number): void {
    const next = Math.max(1, Math.min(this.totalPages, Number(page) || 1));
    if (this.page === next) {
      return;
    }

    this.page = next;
    this.host.dispatchEvent(new CustomEvent('page-change', {
      bubbles: true,
      detail: this.page
    }));
  }

  setPageSize(pageSize: number): void {
    const next = Math.max(1, Number(pageSize) || 1);
    if (this.pageSize === next) {
      return;
    }

    this.pageSize = next;
    this.page = 1;
    this.host.dispatchEvent(new CustomEvent('page-size-change', {
      bubbles: true,
      detail: this.pageSize
    }));
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.pageSize));
  }

  private syncColumnSortState(): void {
    for (const column of this.columns) {
      column.syncSortState();
    }
  }

  private applyColumnSizes(): void {
    for (const column of this.columns) {
      column.applyWidth(this.columnSizes[column.id]);
    }
  }

  private loadColumnSizes(): void {
    this.columnSizes = {};
    if (!this.storageKey) {
      return;
    }

    try {
      const value = localStorage.getItem(this.storageId);
      this.columnSizes = value ? JSON.parse(value) : {};
    } catch {
      this.columnSizes = {};
    }
  }

  private persistColumnSizes(): void {
    if (!this.storageKey) {
      return;
    }

    try {
      localStorage.setItem(this.storageId, JSON.stringify(this.columnSizes));
    } catch {
      // Ignore unavailable storage.
    }
  }

  private get storageId(): string {
    return `ui-table:${this.storageKey}:columns`;
  }
}
