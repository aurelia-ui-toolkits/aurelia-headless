/**
 * Detail of the bubbling `column-reorder` CustomEvent a ui-table emits after moving a column
 * (`from`/`to` are absent when the order was reset). `order` is the resulting visual order:
 * each entry is the header's ui-table-column id, or `#<index>` (authored position) for
 * headers without one.
 */
export interface IColumnReorderDetail {
  from?: number;
  to?: number;
  order: string[];
}
