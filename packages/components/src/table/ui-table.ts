import { bindable, BindingMode, customElement, INode, resolve } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';
import type { UiTableColumn } from './ui-table-column';
import type { UiMenu } from '../menu/ui-menu';
import type { IReorderHost } from '../reorder/i-reorder-host';
import { UiTableConfiguration } from './ui-table-configuration';

type TableSort = { column: string; direction: 'asc' | 'desc' };
type ColumnSort = { column: string; columnViewModel: UiTableColumn; direction: 'asc' | 'desc' | undefined; multiple: boolean };
type ColumnWidth = { index: number; width: number };
let nextTableId = 0;

@customElement('ui-table')
export class UiTable implements IReorderHost {
  private readonly host = resolve(INode) as HTMLElement;
  private bodyEl!: HTMLElement;
  private readonly configuration = resolve(UiTableConfiguration);
  private columnSizes: Record<string, number> = {};
  private readonly sortedColumns = new Map<string, UiTableColumn>();
  readonly tableId = `ui-table-${++nextTableId}`;
  columnWidths: ColumnWidth[] = [];

  /** The header context menu (see ui-table.html), bound via ui-context-menu. */
  columnMenu: UiMenu | undefined;

  @bindable({ mode: BindingMode.twoWay })
  sort: TableSort[] = [];
  sortChanged(): void {
    this.updateColumnSortState();
  }

  @bindable({ mode: BindingMode.twoWay })
  page: number = 1;

  @bindable({ mode: BindingMode.twoWay })
  pageSize: number | string = 10;

  @bindable
  total: number = 0;
  totalChanged(): void {
    this.updateTotalPages();
  }

  totalPages = 1;
  pageOptions: number[] = [1];

  /** Row items backing the rendered tbody rows (reorder: resolves the dragged item values). */
  @bindable
  items: unknown[] | undefined;

  /** Items considered selected (reorder: dragging a selected row moves the whole selection). */
  @bindable
  selected: unknown[] | undefined;

  @bindable
  storageKey: string | undefined;
  storageKeyChanged(): void {
    this.loadColumnSizes();
    this.updateColumnStyle();
  }

  @bindable({ set: booleanAttr })
  pagination: boolean = true;

  @bindable({ set: booleanAttr })
  progress: boolean = false;

  @bindable
  pageSizeOptions: (number | string)[] = [10, 25, 50];

  @bindable
  paginationText: string | undefined;

  @bindable
  loadingText: string = this.configuration.loadingText;

  @bindable
  resetColumnsText: string = this.configuration.resetColumnsText;

  @bindable
  rowsPerPageText: string = this.configuration.rowsPerPageText;

  @bindable
  pageText: string = this.configuration.pageText;

  @bindable
  firstPageText: string = this.configuration.firstPageText;

  @bindable
  previousPageText: string = this.configuration.previousPageText;

  @bindable
  nextPageText: string = this.configuration.nextPageText;

  @bindable
  lastPageText: string = this.configuration.lastPageText;

  attaching(): void {
    this.host.dataset.uiTableId = this.tableId;
    this.loadColumnSizes();
    this.updateTotalPages();
  }

  attached(): void {
    this.updateColumnStyle();
  }

  get columnStyleText(): string {
    return this.columnWidths
      .map(column => `[data-ui-table-id="${this.tableId}"] table tr > :nth-child(${column.index}) { width: ${column.width}px !important; min-width: ${column.width}px !important; max-width: ${column.width}px !important; }`)
      .join('');
  }

  resetColumnWidths(): void {
    this.columnSizes = {};
    if (this.storageKey) {
      try {
        localStorage.removeItem(this.storageId);
      } catch {
        // Ignore unavailable storage.
      }
    }

    this.updateColumnStyle();
  }

  setColumnWidth(columnId: string, width: number, persist = false): void {
    this.columnSizes[columnId] = width;
    this.updateColumnStyle();

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
    const value = (event.target as { value?: unknown } | null)?.value;
    const numeric = Number(value);
    if (value === '' || value === null || value === undefined || isNaN(numeric)) {
      // Non-numeric option (e.g. "Customise") — pass through so the consumer can handle it.
      this.pageSize = value as number | string;
      return;
    }
    this.setPageSize(numeric);
  }

  onPageChange(event: Event): void {
    const target = event.target as { value?: unknown } | null;
    this.setPage(Number(target?.value));
  }

  private updateTotalPages(): void {
    const total = Number(this.total) || 0;
    const pageSize = Number(this.pageSize) || 1;
    this.totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
    this.pageOptions = Array.from({ length: this.totalPages }, (_, index) => index + 1);
    this.page = Math.max(1, Math.min(this.totalPages, Number(this.page) || 1));
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

  private updateColumnStyle(): void {
    this.columnWidths = Array.from(this.host.querySelectorAll<HTMLElement>('.ui-table-column[id]'))
      .map(column => {
        const width = this.columnSizes[column.id];
        const index = Array.from(column.parentElement?.children ?? []).indexOf(column) + 1;
        if (width === undefined || index < 1) {
          return undefined;
        }

        return { index, width };
      })
      .filter((column): column is ColumnWidth => column !== undefined);
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

  // #region IReorderHost (the ui-reorder attribute drives these; rows are consumer-owned <tr>s)

  get reorderContainer(): HTMLElement {
    // The ref may not be assigned yet when the ui-reorder attribute validates the host.
    return this.bodyEl ?? this.host;
  }

  get reorderOrientation(): 'vertical' | 'horizontal' {
    return 'vertical';
  }

  resolveSlot(target: EventTarget | null): Element | null {
    if (!(target instanceof Element)) {
      return null;
    }
    const slot = target.closest('tbody > tr');
    // Only rows of this table's own body (not a nested ui-table's).
    return slot && this.bodyEl.contains(slot) && slot.closest('.ui-table__body') === this.bodyEl ? slot : null;
  }

  slots(): readonly Element[] {
    return Array.from(this.bodyEl.querySelectorAll(':scope > table > tbody > tr'));
  }

  indexOf(slot: Element): number {
    // data-index is the windowed-repeat contract (dataset index of a windowed row, injected
    // for plain repeats by EnhanceUiTable); fall back to DOM position.
    const index = slot.getAttribute('data-index');
    return index !== null ? Number(index) : this.slots().indexOf(slot);
  }

  itemAt(index: number): unknown {
    return this.items?.[index];
  }

  selectedIndexes(): number[] {
    if (!this.items || !this.selected) {
      return [];
    }
    return this.selected.map(value => this.items!.indexOf(value)).filter(index => index >= 0);
  }

  canReorder(slot: Element): boolean {
    return !slot.hasAttribute('data-no-reorder');
  }

  createGhost(slot: Element, count: number): HTMLElement {
    // A bare <tr> does not render outside a table: wrap the clone and pin the widths so the
    // ghost keeps the source row's layout.
    const cells = Array.from(slot.children) as HTMLElement[];
    const clone = slot.cloneNode(true) as HTMLElement;
    Array.from(clone.children).forEach((cell, index) => {
      const rect = cells[index].getBoundingClientRect();
      (cell as HTMLElement).style.width = `${rect.width}px`;
      (cell as HTMLElement).style.maxWidth = `${rect.width}px`;
      (cell as HTMLElement).style.boxSizing = 'border-box';
    });
    const rect = slot.getBoundingClientRect();
    const table = document.createElement('table');
    table.style.width = `${rect.width}px`;
    table.style.borderCollapse = 'collapse';
    const tbody = document.createElement('tbody');
    tbody.appendChild(clone);
    table.appendChild(tbody);
    const ghost = document.createElement('div');
    ghost.appendChild(table);
    if (count > 1) {
      const badge = document.createElement('span');
      badge.classList.add('ui-reorder-ghost__count');
      badge.textContent = count.toString();
      ghost.appendChild(badge);
    }
    return ghost;
  }

  // #endregion
}
