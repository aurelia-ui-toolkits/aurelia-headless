/**
 * Contract a component must implement for its host to accept the `ui-reorder` attribute.
 * The attribute never moves DOM: it translates pointer gestures into data-index intents,
 * so any repeater (plain or virtual) stays the sole owner of the rendered items.
 */
export interface IReorderHost {
  /** Scroll/positioning container of the item slots (used for bounds and edge autoscroll). */
  readonly reorderContainer: HTMLElement;
  readonly reorderOrientation: 'vertical' | 'horizontal';
  /** The item slot owning an event target, or null (used to arm a drag on pointerdown). */
  resolveSlot(target: EventTarget | null): Element | null;
  /** Currently rendered item slots, in DOM order (used for hit-testing). */
  slots(): readonly Element[];
  /** DATA index of a rendered slot (under virtualization this is the dataset index). */
  indexOf(slot: Element): number;
  /** Resolved item value at a data index. */
  itemAt(index: number): unknown;
  /** Data indexes of the current selection ([] when nothing is selected). */
  selectedIndexes(): number[];
  canReorder(slot: Element): boolean;
  /** Optional custom drag ghost; the default is a size-pinned clone with a count badge. */
  createGhost?(slot: Element, count: number): HTMLElement;
  /**
   * Optional: reflect the dragged data indexes on the rendered items (undefined = drag ended).
   * Hosts whose items render `data-dragging` from data (ui-list items bind it off their index)
   * stay correct under virtualization; without it the attribute stamps `data-dragging` on the
   * rendered slots, which recycled rows would carry to the wrong items.
   */
  markDragging?(indexes: number[] | undefined): void;
}
