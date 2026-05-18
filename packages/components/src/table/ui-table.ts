import { bindable, BindingMode, customElement, INode, resolve } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';
import type { UiTableColumn } from './ui-table-column';
import template from './ui-table.html?raw';

type TableSort = { column: string; direction: 'asc' | 'desc' };
type ColumnSort = { column: string; columnViewModel: UiTableColumn; direction: 'asc' | 'desc' | undefined; multiple: boolean };

@customElement({ name: 'ui-table', template })
export class UiTable {
  private readonly host = resolve(INode) as HTMLElement;
  private columnSizes: Record<string, number> = {};
  private readonly sortedColumns = new Map<string, UiTableColumn>();

  @bindable({ mode: BindingMode.twoWay })
  sort: TableSort[] = [];
  sortChanged(): void {
    this.updateColumnSortState();
  }

  @bindable({ mode: BindingMode.twoWay })
  page: number = 1;

  @bindable({ mode: BindingMode.twoWay })
  pageSize: number = 10;

  @bindable
  total: number = 0;
  totalChanged(): void {
    this.updateTotalPages();
  }

  totalPages = 1;
  pageOptions: number[] = [1];

  @bindable
  storageKey: string | undefined;
  storageKeyChanged(): void {
    this.loadColumnSizes();
    this.applyColumnSizes();
  }

  @bindable({ set: booleanAttr })
  pagination: boolean = true;

  @bindable
  pageSizeOptions: number[] = [10, 25, 50];

  @bindable
  paginationText: string = 'Custom';

  attaching(): void {
    this.loadColumnSizes();
    this.updateTotalPages();
  }

  setColumnWidth(columnId: string, width: number, persist = false): void {
    this.columnSizes[columnId] = width;
    const column = this.host.querySelector<HTMLElement>(`#${columnId}`);
    if (column) {
      this.applyColumnWidth(column, width);
    }

    if (persist) {
      this.persistColumnSizes();
    }
  }

  onColumnSort(event: CustomEvent<ColumnSort>): void {
    event.stopPropagation();
    this.sortedColumns.set(event.detail.column, event.detail.columnViewModel);
    const next = event.detail.multiple ? this.sort.filter(sort => sort.column !== event.detail.column) : [];
    if (event.detail.direction) {
      next.push({ column: event.detail.column, direction: event.detail.direction });
    }
    this.sort = next;
    this.updateColumnSortState();
  }

  private updateColumnSortState(): void {
    for (const column of this.sortedColumns.values()) {
      column.direction = undefined;
      column.sortOrder = undefined;
    }

    for (let index = 0; index < this.sort.length; index++) {
      const sort = this.sort[index];
      const column = this.sortedColumns.get(sort.column);
      if (column) {
        column.direction = sort.direction;
        column.sortOrder = this.sort.length > 1 ? index + 1 : undefined;
      }
    }
  }

  pageSizeChanged(): void {
    this.updateTotalPages();
  }

  nextPage(): void {
    const next = this.page + 1;
    if (next <= this.totalPages) {
      this.setPage(next);
    }
  }

  firstPage(): void {
    this.setPage(1);
  }

  lastPage(): void {
    this.setPage(this.totalPages);
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
  }

  setPageSize(pageSize: number): void {
    const next = Math.max(1, Number(pageSize) || 1);
    if (this.pageSize === next) {
      this.updateTotalPages();
      return;
    }

    this.pageSize = next;
    this.page = 1;
    this.updateTotalPages();
  }

  onPageSizeChange(event: Event): void {
    const target = event.target as { value?: unknown } | null;
    this.setPageSize(Number(target?.value));
  }

  onPageChange(event: Event): void {
    const target = event.target as { value?: unknown } | null;
    this.setPage(Number(target?.value));
  }

  private updateTotalPages(): void {
    this.totalPages = Math.max(1, Math.ceil(this.total / this.pageSize));
    this.pageOptions = Array.from({ length: this.totalPages }, (_, index) => index + 1);
    this.page = Math.max(1, Math.min(this.totalPages, Number(this.page) || 1));
  }

  private applyColumnSizes(): void {
    for (const column of this.host.querySelectorAll<HTMLElement>('.ui-table-column')) {
      this.applyColumnWidth(column, this.columnSizes[column.id]);
    }
  }

  getColumnWidth(columnId: string): number | undefined {
    return this.columnSizes[columnId];
  }

  private applyColumnWidth(column: HTMLElement, width: number | undefined): void {
    if (width === undefined) {
      column.style.removeProperty('width');
      column.style.removeProperty('min-width');
      return;
    }

    column.style.width = `${width}px`;
    column.style.minWidth = `${width}px`;
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
