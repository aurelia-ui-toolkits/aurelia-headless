export interface IReorderDetail {
  items: unknown[];
  /** Source data indexes; absent on the target of a cross-list drop (insertion intent). */
  from?: number[];
  /**
   * Insertion data index, already adjusted for same-list removals; absent on the source
   * of a cross-list drop (removal intent).
   */
  to?: number;
}
