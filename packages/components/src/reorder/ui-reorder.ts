import { bindable, customAttribute, CustomElement, INode, resolve } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';
import { Keys } from '../base/keys';

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
}

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

function isReorderHost(vm: unknown): vm is IReorderHost {
  const host = vm as IReorderHost;
  return !!host
    && typeof host.resolveSlot === 'function'
    && typeof host.slots === 'function'
    && typeof host.indexOf === 'function'
    && typeof host.itemAt === 'function'
    && typeof host.selectedIndexes === 'function'
    && typeof host.canReorder === 'function'
    && host.reorderContainer instanceof HTMLElement;
}

/** Attached instances, so same-`group` containers accept drags from each other. */
const registry = new Set<UiReorder>();

const DRAG_THRESHOLD = 5;
const EDGE_SIZE = 24;
const EDGE_SCROLL_SPEED = 12;

interface IDropTarget {
  attribute: UiReorder;
  slot?: Element;
  after: boolean;
}

/**
 * Drag-reorder for components implementing {@link IReorderHost} (e.g. `<ui-list ui-reorder>`).
 * Emits a bubbling `reorder` CustomEvent ({@link IReorderDetail}); the optional `from`/`to`
 * express the intent: both = same-list move, `from` only = removal (cross-list source),
 * `to` only = insertion (cross-list target). Consumers splice their arrays accordingly.
 */
@customAttribute({
  name: 'ui-reorder',
  defaultProperty: 'group'
})
export class UiReorder implements EventListenerObject {
  readonly element = resolve(INode) as HTMLElement;
  host!: IReorderHost;

  /** Containers sharing a non-empty group accept drags from each other. */
  @bindable
  group: string | undefined;

  /** CSS selector for a designated drag area inside a slot; unset = the whole slot drags. */
  @bindable
  handle: string | undefined;

  @bindable({ set: booleanAttr })
  disabled: boolean = false;

  private pointerId: number | undefined;
  private startX = 0;
  private startY = 0;
  private dragging = false;
  private sourceSlot: Element | undefined;
  private sourceIndexes: number[] = [];
  private items: unknown[] = [];
  private ghost: HTMLElement | undefined;
  private ghostOffsetX = 0;
  private ghostOffsetY = 0;
  private target: IDropTarget | undefined;
  private scrollFrame: number | undefined;
  private lastPointerX = 0;
  private lastPointerY = 0;

  attached(): void {
    const vm = CustomElement.for(this.element, { optional: true })?.viewModel;
    if (!isReorderHost(vm)) {
      throw new Error(`ui-reorder: <${this.element.tagName.toLowerCase()}> does not implement IReorderHost`);
    }
    this.host = vm;
    // The template compiler strips the ui-reorder attribute from the rendered DOM; stamp a
    // runtime marker so themes can style reorderable hosts.
    this.element.setAttribute('data-ui-reorder', '');
    this.element.addEventListener('pointerdown', this);
    registry.add(this);
  }

  detaching(): void {
    this.cancelDrag();
    this.element.removeAttribute('data-ui-reorder');
    this.element.removeEventListener('pointerdown', this);
    registry.delete(this);
  }

  handleEvent(event: Event): void {
    switch (event.type) {
      case 'pointerdown':
        this.onPointerDown(event as PointerEvent);
        break;
      case 'pointermove':
        this.onPointerMove(event as PointerEvent);
        break;
      case 'pointerup':
        this.onPointerUp(event as PointerEvent);
        break;
      case 'pointercancel':
        this.cancelDrag();
        break;
      case 'keydown':
        if ((event as KeyboardEvent).key === Keys.Escape) {
          this.cancelDrag();
        }
        break;
      case 'click':
        // One-shot capture suppressor so the click that follows a completed drag does not select.
        event.stopPropagation();
        event.preventDefault();
        window.removeEventListener('click', this, true);
        break;
    }
  }

  private onPointerDown(event: PointerEvent): void {
    if (this.disabled || this.pointerId !== undefined || event.button !== 0) {
      return;
    }
    const slot = this.host.resolveSlot(event.target);
    if (!slot || !this.host.canReorder(slot)) {
      return;
    }
    if (this.handle && !(event.target instanceof Element && event.target.closest(this.handle) && slot.contains(event.target.closest(this.handle)!))) {
      return;
    }
    this.pointerId = event.pointerId;
    this.sourceSlot = slot;
    this.startX = event.clientX;
    this.startY = event.clientY;
    window.addEventListener('pointermove', this);
    window.addEventListener('pointerup', this);
    window.addEventListener('pointercancel', this);
  }

  private onPointerMove(event: PointerEvent): void {
    if (event.pointerId !== this.pointerId) {
      return;
    }
    this.lastPointerX = event.clientX;
    this.lastPointerY = event.clientY;
    if (!this.dragging) {
      if (Math.abs(event.clientX - this.startX) < DRAG_THRESHOLD && Math.abs(event.clientY - this.startY) < DRAG_THRESHOLD) {
        return;
      }
      this.startDrag();
    }
    this.positionGhost(event.clientX, event.clientY);
    this.updateTarget(event.clientX, event.clientY);
  }

  private onPointerUp(event: PointerEvent): void {
    if (event.pointerId !== this.pointerId) {
      return;
    }
    if (!this.dragging) {
      this.cleanup();
      return;
    }
    const target = this.target;
    this.emitDrop(target);
    // Suppress the click the browser fires after the drag's pointerup (would trigger selection).
    window.addEventListener('click', this, true);
    setTimeout(() => window.removeEventListener('click', this, true));
    this.cleanup();
  }

  private startDrag(): void {
    const slot = this.sourceSlot!;
    const grabbed = this.host.indexOf(slot);
    const selection = this.host.selectedIndexes();
    this.sourceIndexes = selection.includes(grabbed) ? [...selection].sort((a, b) => a - b) : [grabbed];
    this.items = this.sourceIndexes.map(i => this.host.itemAt(i));
    this.dragging = true;

    const rect = slot.getBoundingClientRect();
    this.ghostOffsetX = this.startX - rect.left;
    this.ghostOffsetY = this.startY - rect.top;
    this.ghost = this.host.createGhost?.(slot, this.items.length) ?? this.createDefaultGhost(slot, this.items.length);
    this.ghost.classList.add('ui-reorder-ghost');
    this.ghost.style.position = 'fixed';
    this.ghost.style.left = '0';
    this.ghost.style.top = '0';
    this.ghost.style.pointerEvents = 'none';
    this.ghost.style.zIndex = '10000';
    document.body.appendChild(this.ghost);
    this.positionGhost(this.startX, this.startY);

    this.host.reorderContainer.setAttribute('data-reordering', '');
    this.markSourceSlots();
    window.addEventListener('keydown', this, true);
    this.scrollFrame = requestAnimationFrame(() => this.autoScroll());
  }

  private createDefaultGhost(slot: Element, count: number): HTMLElement {
    const rect = slot.getBoundingClientRect();
    const ghost = slot.cloneNode(true) as HTMLElement;
    ghost.style.width = `${rect.width}px`;
    ghost.style.height = `${rect.height}px`;
    ghost.style.boxSizing = 'border-box';
    if (count > 1) {
      const badge = document.createElement('span');
      badge.classList.add('ui-reorder-ghost__count');
      badge.textContent = count.toString();
      ghost.appendChild(badge);
    }
    return ghost;
  }

  private markSourceSlots(): void {
    for (const slot of this.host.slots()) {
      if (this.sourceIndexes.includes(this.host.indexOf(slot))) {
        slot.setAttribute('data-dragging', '');
      }
    }
  }

  private positionGhost(x: number, y: number): void {
    if (this.ghost) {
      this.ghost.style.transform = `translate(${x - this.ghostOffsetX}px, ${y - this.ghostOffsetY}px)`;
    }
  }

  private updateTarget(x: number, y: number): void {
    const next = this.findTarget(x, y);
    if (this.target && (
      this.target.attribute !== next?.attribute
      || this.target.slot !== next?.slot
      || this.target.after !== next?.after
    )) {
      this.clearTargetMarker(this.target);
    }
    this.target = next;
    if (next) {
      if (next.slot) {
        next.slot.setAttribute(next.after ? 'data-drop-after' : 'data-drop-before', '');
        next.slot.removeAttribute(next.after ? 'data-drop-before' : 'data-drop-after');
      } else {
        next.attribute.host.reorderContainer.setAttribute('data-drop-empty', '');
      }
    }
  }

  private clearTargetMarker(target: IDropTarget): void {
    if (target.slot) {
      target.slot.removeAttribute('data-drop-before');
      target.slot.removeAttribute('data-drop-after');
    } else {
      target.attribute.host.reorderContainer.removeAttribute('data-drop-empty');
    }
  }

  private findTarget(x: number, y: number): IDropTarget | undefined {
    for (const attribute of this.candidates()) {
      const container = attribute.host.reorderContainer;
      const bounds = container.getBoundingClientRect();
      if (x < bounds.left || x > bounds.right || y < bounds.top || y > bounds.bottom) {
        continue;
      }
      const slots = attribute.host.slots();
      if (!slots.length) {
        return { attribute, after: false };
      }
      const vertical = attribute.host.reorderOrientation === 'vertical';
      const pointer = vertical ? y : x;
      for (const slot of slots) {
        const rect = slot.getBoundingClientRect();
        const start = vertical ? rect.top : rect.left;
        const end = vertical ? rect.bottom : rect.right;
        if (pointer <= end) {
          if (pointer < start) {
            return { attribute, slot, after: false };
          }
          return { attribute, slot, after: pointer > (start + end) / 2 };
        }
      }
      // Past the last rendered slot: clamp to the end of the list.
      return { attribute, slot: slots[slots.length - 1], after: true };
    }
    return undefined;
  }

  private candidates(): UiReorder[] {
    const result = [this as UiReorder];
    if (this.group) {
      for (const attribute of registry) {
        if (attribute !== this && attribute.group === this.group && !attribute.disabled) {
          result.push(attribute);
        }
      }
    }
    return result;
  }

  private autoScroll(): void {
    if (!this.dragging) {
      return;
    }
    const container = (this.target?.attribute ?? this).host.reorderContainer;
    const bounds = container.getBoundingClientRect();
    const vertical = (this.target?.attribute ?? this).host.reorderOrientation === 'vertical';
    const pointer = vertical ? this.lastPointerY : this.lastPointerX;
    const start = vertical ? bounds.top : bounds.left;
    const end = vertical ? bounds.bottom : bounds.right;
    let delta = 0;
    if (pointer < start + EDGE_SIZE && pointer > start - EDGE_SIZE) {
      delta = -EDGE_SCROLL_SPEED;
    } else if (pointer > end - EDGE_SIZE && pointer < end + EDGE_SIZE) {
      delta = EDGE_SCROLL_SPEED;
    }
    if (delta) {
      if (vertical) {
        container.scrollTop += delta;
      } else {
        container.scrollLeft += delta;
      }
      this.updateTarget(this.lastPointerX, this.lastPointerY);
    }
    this.scrollFrame = requestAnimationFrame(() => this.autoScroll());
  }

  private emitDrop(target: IDropTarget | undefined): void {
    if (!target) {
      return;
    }
    const host = target.attribute.host;
    let to = target.slot ? host.indexOf(target.slot) + (target.after ? 1 : 0) : 0;
    if (target.attribute === this) {
      // Same-list move: adjust the insertion index for the items removed before it and
      // ignore no-op drops onto the dragged block itself.
      const removedBefore = this.sourceIndexes.filter(i => i < to).length;
      to -= removedBefore;
      const unadjusted = to + removedBefore;
      if (this.sourceIndexes.length === 1 && (unadjusted === this.sourceIndexes[0] || unadjusted === this.sourceIndexes[0] + 1)) {
        return;
      }
      this.emit(this.element, { items: this.items, from: this.sourceIndexes, to });
    } else {
      this.emit(this.element, { items: this.items, from: this.sourceIndexes });
      this.emit(target.attribute.element, { items: this.items, to });
    }
  }

  private emit(element: HTMLElement, detail: IReorderDetail): void {
    element.dispatchEvent(new CustomEvent<IReorderDetail>('reorder', { bubbles: true, detail }));
  }

  private cancelDrag(): void {
    if (this.pointerId !== undefined) {
      this.cleanup();
    }
  }

  private cleanup(): void {
    if (this.scrollFrame !== undefined) {
      cancelAnimationFrame(this.scrollFrame);
      this.scrollFrame = undefined;
    }
    if (this.target) {
      this.clearTargetMarker(this.target);
      this.target = undefined;
    }
    for (const attribute of this.candidates()) {
      for (const slot of attribute.host.slots()) {
        slot.removeAttribute('data-dragging');
      }
      attribute.host.reorderContainer.removeAttribute('data-reordering');
    }
    this.ghost?.remove();
    this.ghost = undefined;
    this.dragging = false;
    this.sourceSlot = undefined;
    this.sourceIndexes = [];
    this.items = [];
    this.pointerId = undefined;
    window.removeEventListener('pointermove', this);
    window.removeEventListener('pointerup', this);
    window.removeEventListener('pointercancel', this);
    window.removeEventListener('keydown', this, true);
  }
}
