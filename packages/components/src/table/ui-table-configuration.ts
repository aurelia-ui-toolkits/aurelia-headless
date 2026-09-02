/** App-wide defaults for ui-table: user-facing strings and column-flag defaults.
 *  Register a customized instance to configure every table at once;
 *  per-instance bindables and per-column attributes still take precedence. */
export class UiTableConfiguration {
  /** Default `sortable` for every ui-table-column; a column can override with `sortable="false"`. */
  defaultSortable: boolean = false;
  /** Default `resizable` for every ui-table-column; a column can override with `resizable="false"`. */
  defaultResizable: boolean = false;
  /** Default `movable` for every ui-table-column; a column can override with `movable="false"`. */
  defaultMovable: boolean = false;
  /** Default `hideable` for every ui-table-column; a column can override with `hideable="false"`. */
  defaultHideable: boolean = false;
  loadingText: string = 'Loading table';
  resetColumnsText: string = 'Reset columns';
  rowsPerPageText: string = 'Rows per page';
  pageText: string = 'Page';
  firstPageText: string = 'First page';
  previousPageText: string = 'Previous page';
  nextPageText: string = 'Next page';
  lastPageText: string = 'Last page';
}
