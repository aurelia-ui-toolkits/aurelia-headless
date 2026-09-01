import { bindable, BindingMode, customElement, INode, newInstanceOf, resolve, slotted } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';
import type { UiTableColumn } from './ui-table-column';
import type { UiMenu } from '../menu/ui-menu';
import type { IReorderHost } from '../reorder/i-reorder-host';
import { UiTableConfiguration } from './ui-table-configuration';
import { UiTableColumnDrag } from './ui-table-column-drag';
import type { IColumnReorderDetail } from './i-column-reorder-detail';
import type { IColumnVisibilityDetail } from './i-column-visibility-detail';

type TableSort = { column: string; direction: 'asc' | 'desc' };
type ColumnSort = { column: string; columnViewModel: UiTableColumn; direction: 'asc' | 'desc' | undefined; multiple: boolean };
type ColumnWidth = { index: number; width: number };
type StoredColumnSettings = { widths?: Record<string, number>; order?: string[]; hidden?: string[] };
type HideableColumn = { key: string; label: string; visible: boolean };
let nextTableId = 0;

@customElement('ui-table')
export class UiTable implements IReorderHost {
  private readonly host = resolve(INode) as HTMLElement;
  private bodyEl!: HTMLElement;

  /** The consumer's <table>, projected through the default au-slot. */
  @slotted('table')
  tables: HTMLTableElement[] = [];
  private readonly configuration = resolve(UiTableConfiguration);
  private columnSizes: Record<string, number> = {};
  private readonly sortedColumns = new Map<string, UiTableColumn>();
  /** Visual column order as authored column indexes; [] until a reorder is applied. */
  private columnOrder: number[] = [];
  /** Hidden columns as authored column indexes. */
  private hiddenColumns = new Set<number>();
  /** Authored visibility defaults (`hidden` on columns), as authored column indexes. */
  private defaultHidden = new Set<number>();
  /** Hidden column keys, backing the injected style and persistence (reassigned so bindings react). */
  hiddenColumnKeys: string[] = [];
  /** Hideable columns in visual order, backing the header context menu's visibility toggles. */
  hideableColumns: HideableColumn[] = [];
  private layoutObserver: MutationObserver | undefined;
  private readonly columnDrag = resolve(newInstanceOf(UiTableColumnDrag));
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
    this.applyInitialColumnLayout();
    this.refreshHideableColumns();
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
    this.defaultHidden = this.collectDefaultHidden();
    this.applyInitialColumnLayout();
    this.updateColumnStyle();
    this.refreshHideableColumns();
    this.columnDrag.attach(this);
  }

  detaching(): void {
    this.columnDrag.detach();
    this.layoutObserver?.disconnect();
    this.layoutObserver = undefined;
  }

  get columnStyleText(): string {
    const hiddenRule = this.hiddenColumnKeys.length
      ? `[data-ui-table-id="${this.tableId}"] table tr > [data-col-hidden] { display: none !important; }`
      : '';
    return hiddenRule + this.columnWidths
      .map(column => `[data-ui-table-id="${this.tableId}"] table tr > :nth-child(${column.index}) { width: ${column.width}px !important; min-width: ${column.width}px !important; max-width: ${column.width}px !important; }`)
      .join('');
  }

  resetColumns(): void {
    this.resetColumnWidths();
    this.resetColumnOrder();
    this.resetColumnVisibility();
  }

  resetColumnWidths(): void {
    this.columnSizes = {};
    this.persistSettings();
    this.updateColumnStyle();
  }

  setColumnWidth(columnId: string, width: number, persist = false): void {
    this.columnSizes[columnId] = Math.round(width);
    this.updateColumnStyle();

    if (persist) {
      this.persistSettings();
    }
  }

  private get tableElement(): HTMLTableElement | undefined {
    return this.tables[0];
  }

  /** Header cells of the table's own first header row, in current visual order. */
  headerCells(): HTMLElement[] {
    const row = this.tableElement?.querySelector(':scope > thead > tr');
    return row ? Array.from(row.children) as HTMLElement[] : [];
  }

  /**
   * Move the column at visual index `from` to insertion point `to` (both among header
   * cells). The table owns the permutation: cells have no backing array to splice, so it
   * moves the DOM cells of every matching row (Aurelia bindings survive node moves) and
   * keeps re-applying the order to rows the repeater creates later.
   */
  moveColumn(from: number, to: number): void {
    const order = this.columnOrder.length ? [...this.columnOrder] : this.headerCells().map((_, index) => index);
    const insert = to > from ? to - 1 : to;
    if (from < 0 || from >= order.length || insert < 0 || insert >= order.length || insert === from) {
      return;
    }
    const [moved] = order.splice(from, 1);
    order.splice(insert, 0, moved);
    this.columnOrder = order;
    this.applyColumnLayoutToAll();
    this.updateColumnStyle();
    this.persistSettings();
    this.syncLayoutObserver();
    this.refreshHideableColumns();
    this.emitColumnReorder({ from, to: insert, order: this.columnOrderKeys() });
  }

  resetColumnOrder(): void {
    if (!this.columnOrder.length) {
      return;
    }
    this.columnOrder = this.columnOrder.map((_, index) => index);
    this.applyColumnLayoutToAll();
    this.columnOrder = [];
    this.updateColumnStyle();
    this.persistSettings();
    this.syncLayoutObserver();
    this.refreshHideableColumns();
    this.emitColumnReorder({ order: this.columnOrderKeys() });
  }

  /** Toggle a column's visibility by key (header id, or `#<authored index>`). */
  toggleColumn(key: string): void {
    const byKey = this.columnKeyMap();
    const original = byKey.get(key);
    if (original === undefined) {
      return;
    }
    const hide = !this.hiddenColumns.has(original);
    // Never hide the last visible column: the header would collapse and take the menu with it.
    if (hide && byKey.size - this.hiddenColumns.size <= 1) {
      return;
    }
    if (hide) {
      this.hiddenColumns.add(original);
    } else {
      this.hiddenColumns.delete(original);
    }
    this.updateHiddenColumnKeys();
    this.applyColumnLayoutToAll();
    this.updateColumnStyle();
    this.persistSettings();
    this.syncLayoutObserver();
    this.refreshHideableColumns();
    this.emitColumnVisibility({ column: key, visible: !hide, hidden: this.hiddenColumnKeys });
  }

  resetColumnVisibility(): void {
    if (this.setsEqual(this.hiddenColumns, this.defaultHidden)) {
      return;
    }
    this.hiddenColumns = new Set(this.defaultHidden);
    this.updateHiddenColumnKeys();
    this.applyColumnLayoutToAll();
    this.updateColumnStyle();
    this.persistSettings();
    this.syncLayoutObserver();
    this.refreshHideableColumns();
    this.emitColumnVisibility({ hidden: this.hiddenColumnKeys });
  }

  /** Authored defaults first, then stored settings on top when present. */
  private applyInitialColumnLayout(): void {
    if (!this.bodyEl) {
      return;
    }
    this.hiddenColumns = new Set(this.defaultHidden);
    const stored = this.readStoredSettings();
    const order = Array.isArray(stored.order) ? this.resolveColumnOrder(stored.order) : undefined;
    if (order) {
      this.columnOrder = order;
    }
    if (Array.isArray(stored.hidden)) {
      const byKey = this.columnKeyMap();
      const hidden = new Set(stored.hidden.map(key => byKey.get(key)).filter((value): value is number => value !== undefined));
      // Stale data must not hide everything: the menu to unhide lives in the header.
      if (hidden.size < byKey.size) {
        this.hiddenColumns = hidden;
      }
    }
    this.updateHiddenColumnKeys();
    if (this.columnOrder.length || this.hiddenColumns.size) {
      this.applyColumnLayoutToAll();
    }
    this.syncLayoutObserver();
  }

  private collectDefaultHidden(): Set<number> {
    const cells = this.headerCells();
    const defaults = new Set(cells
      .map((cell, position) => cell.hasAttribute('data-default-hidden') ? this.originalIndexOf(cell, position) : -1)
      .filter(index => index >= 0));
    // Defaults must not hide everything: the menu to unhide lives in the header.
    return defaults.size < cells.length ? defaults : new Set();
  }

  private setsEqual(a: Set<number>, b: Set<number>): boolean {
    return a.size === b.size && [...a].every(value => b.has(value));
  }

  /** Stored keys -> authored indexes; undefined when the keys no longer match the table. */
  private resolveColumnOrder(keys: string[]): number[] | undefined {
    const byKey = this.columnKeyMap();
    if (!byKey.size || keys.length !== byKey.size) {
      return undefined;
    }
    const order = keys.map(key => byKey.get(key));
    if (order.some(value => value === undefined) || new Set(order).size !== order.length) {
      return undefined;
    }
    return order as number[];
  }

  /** Column key (header id, or `#<authored index>`) -> authored index, for the current header row. */
  private columnKeyMap(): Map<string, number> {
    return new Map(this.headerCells().map((cell, position) => {
      const original = this.originalIndexOf(cell, position);
      return [cell.id || `#${original}`, original] as const;
    }));
  }

  private updateHiddenColumnKeys(): void {
    const keys: string[] = [];
    for (const [key, original] of this.columnKeyMap()) {
      if (this.hiddenColumns.has(original)) {
        keys.push(key);
      }
    }
    this.hiddenColumnKeys = keys;
  }

  /** Rebuild the context menu's visibility toggles (hideable columns, in visual order). */
  private refreshHideableColumns(): void {
    this.hideableColumns = this.headerCells()
      .map((cell, position) => ({ cell, original: this.originalIndexOf(cell, position) }))
      .filter(({ cell }) => cell.hasAttribute('data-hideable'))
      .map(({ cell, original }) => ({
        key: cell.id || `#${original}`,
        label: this.columnLabel(cell),
        visible: !this.hiddenColumns.has(original)
      }));
  }

  /** The header's authored text, without the sort indicator and resize handle. */
  private columnLabel(cell: HTMLElement): string {
    const clone = cell.cloneNode(true) as HTMLElement;
    for (const chrome of clone.querySelectorAll('.ui-table-column__sort-indicator, .ui-table-column__resize-handle')) {
      chrome.remove();
    }
    return clone.textContent?.trim() ?? '';
  }

  private originalIndexOf(cell: Element, position: number): number {
    const stamp = cell.getAttribute('data-col-index');
    return stamp !== null ? Number(stamp) : position;
  }

  /** Current visual order as column keys (header id, or `#<authored index>` without one). */
  private columnOrderKeys(): string[] {
    return this.headerCells().map((cell, position) => cell.id || `#${this.originalIndexOf(cell, position)}`);
  }

  private applyColumnLayoutToAll(): void {
    const expected = this.columnOrder.length || this.headerCells().length;
    const rows = this.tableElement?.querySelectorAll(':scope > thead > tr, :scope > tbody > tr, :scope > tfoot > tr') ?? [];
    for (const row of rows) {
      this.applyColumnLayout(row, expected);
    }
  }

  /**
   * Reorder a row's cells to the current column order and reflect hidden columns
   * (`data-col-hidden`, hidden by the injected style). Rows whose cell count differs
   * (colspan summary rows) keep their authored layout.
   */
  private applyColumnLayout(row: Element, expected = this.columnOrder.length || this.headerCells().length): void {
    const cells = Array.from(row.children);
    if (!expected || cells.length !== expected) {
      return;
    }
    if (!cells.some(cell => cell.hasAttribute('data-col-index'))) {
      if (!this.columnOrder.length && !this.hiddenColumns.size) {
        return; // nothing was ever permuted or hidden - leave the row unstamped
      }
      // A fresh repeater row is born in authored order; stamp it so re-applying stays idempotent.
      cells.forEach((cell, index) => cell.setAttribute('data-col-index', String(index)));
    }
    const byOriginal = new Map(cells.map(cell => [Number(cell.getAttribute('data-col-index')), cell]));
    for (const [original, cell] of byOriginal) {
      cell.toggleAttribute('data-col-hidden', this.hiddenColumns.has(original));
    }
    if (!this.columnOrder.length) {
      return;
    }
    const sequence = this.columnOrder.map(index => byOriginal.get(index));
    if (sequence.some(cell => cell === undefined) || sequence.every((cell, index) => cell === cells[index])) {
      return;
    }
    for (const cell of sequence) {
      row.appendChild(cell!);
    }
  }

  /** Rows rendered after a reorder/hide (paging, sorting, virtualization) must be re-laid-out too. */
  private syncLayoutObserver(): void {
    const active = (this.columnOrder.length > 0 && !this.isIdentityOrder()) || this.hiddenColumns.size > 0;
    if (active && !this.layoutObserver) {
      this.layoutObserver = new MutationObserver(records => this.onRowsMutated(records));
      this.layoutObserver.observe(this.bodyEl, { childList: true, subtree: true });
    } else if (!active && this.layoutObserver) {
      this.layoutObserver.disconnect();
      this.layoutObserver = undefined;
    }
  }

  private onRowsMutated(records: MutationRecord[]): void {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node instanceof HTMLTableRowElement && node.closest('table') === this.tableElement) {
          this.applyColumnLayout(node);
        }
      }
    }
  }

  private isIdentityOrder(): boolean {
    return this.columnOrder.every((value, index) => value === index);
  }

  private readStoredSettings(): StoredColumnSettings {
    if (!this.storageKey) {
      return {};
    }
    try {
      const value = localStorage.getItem(this.storageId);
      const parsed: unknown = value ? JSON.parse(value) : undefined;
      return parsed && typeof parsed === 'object' ? parsed as StoredColumnSettings : {};
    } catch {
      return {};
    }
  }

  private persistSettings(): void {
    if (!this.storageKey) {
      return;
    }
    try {
      const settings: StoredColumnSettings = {};
      if (Object.keys(this.columnSizes).length) {
        settings.widths = this.columnSizes;
      }
      if (this.columnOrder.length && !this.isIdentityOrder()) {
        settings.order = this.columnOrderKeys();
      }
      // Persisted whenever it differs from the authored defaults — an explicit empty array
      // records that the user unhid a default-hidden column.
      if (!this.setsEqual(this.hiddenColumns, this.defaultHidden)) {
        settings.hidden = this.hiddenColumnKeys;
      }
      if (Object.keys(settings).length) {
        localStorage.setItem(this.storageId, JSON.stringify(settings));
      } else {
        localStorage.removeItem(this.storageId);
      }
    } catch {
      // Ignore unavailable storage.
    }
  }

  private emitColumnReorder(detail: IColumnReorderDetail): void {
    this.host.dispatchEvent(new CustomEvent<IColumnReorderDetail>('column-reorder', { bubbles: true, detail }));
  }

  private emitColumnVisibility(detail: IColumnVisibilityDetail): void {
    this.host.dispatchEvent(new CustomEvent<IColumnVisibilityDetail>('column-visibility', { bubbles: true, detail }));
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
    const widths = this.readStoredSettings().widths;
    this.columnSizes = widths && typeof widths === 'object' ? widths : {};
  }

  private updateColumnStyle(): void {
    this.columnWidths = this.headerCells()
      .map((cell, position) => {
        const width = cell.id ? this.columnSizes[cell.id] : undefined;
        return width === undefined ? undefined : { index: position + 1, width };
      })
      .filter((column): column is ColumnWidth => column !== undefined);
  }

  private get storageId(): string {
    return `ui-table:${this.storageKey}`;
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
    // Only rows of this table's own body (not a nested table's).
    return slot && slot.closest('table') === this.tableElement ? slot : null;
  }

  slots(): readonly Element[] {
    return Array.from(this.tableElement?.querySelectorAll(':scope > tbody > tr') ?? []);
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
