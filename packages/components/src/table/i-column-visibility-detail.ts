/**
 * Detail of the bubbling `column-visibility` CustomEvent a ui-table emits after toggling a
 * column (`column`/`visible` are absent when visibility was reset). `hidden` is the resulting
 * set of hidden column keys: the header's ui-table-column id, or `#<index>` (authored
 * position) for headers without one.
 */
export interface IColumnVisibilityDetail {
  column?: string;
  visible?: boolean;
  hidden: string[];
}
