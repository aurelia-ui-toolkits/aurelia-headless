import { Keys } from '../base/keys';
import type { UiTable } from './ui-table';

const DRAG_THRESHOLD = 5;
const EDGE_SIZE = 24;
const EDGE_SCROLL_SPEED = 12;

interface IColumnDropTarget {
  th: HTMLElement;
  after: boolean;
}

/**
 * Header drag for `movable` columns. Columns have no consumer-owned backing array (cells are
 * authored markup), so unlike `ui-reorder` this cannot stay a pure gesture-to-intent
 * translator: the drop resolves into {@link UiTable.moveColumn}, which owns the DOM
 * permutation. The gesture conventions (threshold, ghost, drop markers, Escape cancel,
 * click suppression) mirror `ui-reorder` so the two drags feel identical.
 */
export class UiTableColumnDrag implements EventListenerObject {
  private pointerId: number | undefined;
  private startX = 0;
  private startY = 0;
  private dragging = false;
  private sourceTh: HTMLElement | undefined;
  private ghost: HTMLElement | undefined;
  private ghostOffsetX = 0;
  private ghostOffsetY = 0;
  private target: IColumnDropTarget | undefined;
  private scrollFrame: number | undefined;
  private lastPointerX = 0;

  private table!: UiTable;

  attach(table: UiTable): void {
    this.table = table;
    table.reorderContainer.addEventListener('pointerdown', this);
  }

  detach(): void {
    if (!this.table) {
      return;
    }
    this.cancelDrag();
    this.table.reorderContainer.removeEventListener('pointerdown', this);
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
          if (this.dragging) {
            // The cancelled press still ends with a click when the button is released.
            window.addEventListener('click', this, true);
            window.addEventListener('pointerup', () => setTimeout(() => window.removeEventListener('click', this, true)), { capture: true, once: true });
          }
          this.cancelDrag();
        }
        break;
      case 'click':
        // One-shot capture suppressor so the click that ends a drag does not sort the column.
        event.stopPropagation();
        event.preventDefault();
        window.removeEventListener('click', this, true);
        break;
    }
  }

  private onPointerDown(event: PointerEvent): void {
    if (this.pointerId !== undefined || event.button !== 0) {
      return;
    }
    const th = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-movable]') : null;
    // headerCells is scoped to this table's own header row, so a nested table's headers
    // never arm the outer table's drag (and vice versa).
    if (!th || !this.table.headerCells().includes(th)) {
      return;
    }
    this.pointerId = event.pointerId;
    this.sourceTh = th;
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
    if (!this.dragging) {
      if (Math.abs(event.clientX - this.startX) < DRAG_THRESHOLD && Math.abs(event.clientY - this.startY) < DRAG_THRESHOLD) {
        return;
      }
      this.startDrag();
    }
    this.positionGhost(event.clientX, event.clientY);
    this.updateTarget(event.clientX);
  }

  private onPointerUp(event: PointerEvent): void {
    if (event.pointerId !== this.pointerId) {
      return;
    }
    if (!this.dragging) {
      this.cleanup();
      return;
    }
    this.drop(this.target);
    // Suppress the click the browser fires right after the drag's pointerup (a sortable
    // header would otherwise sort). It may also never come, hence the timeout disarm.
    window.addEventListener('click', this, true);
    setTimeout(() => window.removeEventListener('click', this, true));
    this.cleanup();
  }

  private startDrag(): void {
    const th = this.sourceTh!;
    this.dragging = true;
    const rect = th.getBoundingClientRect();
    this.ghostOffsetX = this.startX - rect.left;
    this.ghostOffsetY = this.startY - rect.top;
    this.ghost = this.createGhost(th);
    this.ghost.classList.add('ui-reorder-ghost');
    this.ghost.style.position = 'fixed';
    this.ghost.style.left = '0';
    this.ghost.style.top = '0';
    this.ghost.style.pointerEvents = 'none';
    this.ghost.style.zIndex = '10000';
    document.body.appendChild(this.ghost);
    this.positionGhost(this.startX, this.startY);
    this.table.reorderContainer.setAttribute('data-column-reordering', '');
    th.setAttribute('data-dragging', '');
    window.addEventListener('keydown', this, true);
    this.scrollFrame = requestAnimationFrame(() => this.autoScroll());
  }

  /** A bare <th> does not render outside a table: wrap the clone and pin its size. */
  private createGhost(th: HTMLElement): HTMLElement {
    const rect = th.getBoundingClientRect();
    const clone = th.cloneNode(true) as HTMLElement;
    clone.removeAttribute('data-dragging');
    clone.style.width = `${rect.width}px`;
    clone.style.maxWidth = `${rect.width}px`;
    clone.style.height = `${rect.height}px`;
    clone.style.boxSizing = 'border-box';
    const table = document.createElement('table');
    table.style.borderCollapse = 'collapse';
    const thead = document.createElement('thead');
    const row = document.createElement('tr');
    row.appendChild(clone);
    thead.appendChild(row);
    table.appendChild(thead);
    const ghost = document.createElement('div');
    ghost.appendChild(table);
    return ghost;
  }

  private positionGhost(x: number, y: number): void {
    if (this.ghost) {
      this.ghost.style.transform = `translate(${x - this.ghostOffsetX}px, ${y - this.ghostOffsetY}px)`;
    }
  }

  private updateTarget(x: number): void {
    const next = this.findTarget(x);
    if (this.target && (this.target.th !== next?.th || this.target.after !== next?.after)) {
      this.clearTargetMarker(this.target);
    }
    this.target = next;
    if (next) {
      next.th.setAttribute(next.after ? 'data-drop-after' : 'data-drop-before', '');
      next.th.removeAttribute(next.after ? 'data-drop-before' : 'data-drop-after');
    }
  }

  private clearTargetMarker(target: IColumnDropTarget): void {
    target.th.removeAttribute('data-drop-before');
    target.th.removeAttribute('data-drop-after');
  }

  /**
   * Only movable headers are drop anchors, so immovable edge columns (selection, actions)
   * keep their place; a pointer outside the movable band clamps to its nearest edge.
   */
  private findTarget(x: number): IColumnDropTarget | undefined {
    const candidates = this.table.headerCells().filter(th => th.hasAttribute('data-movable') && !th.hasAttribute('data-col-hidden'));
    for (const th of candidates) {
      const rect = th.getBoundingClientRect();
      if (x <= rect.right) {
        if (x < rect.left) {
          return { th, after: false };
        }
        return { th, after: x > (rect.left + rect.right) / 2 };
      }
    }
    const last = candidates[candidates.length - 1];
    return last ? { th: last, after: true } : undefined;
  }

  private autoScroll(): void {
    if (!this.dragging) {
      return;
    }
    const container = this.table.reorderContainer;
    const bounds = container.getBoundingClientRect();
    let delta = 0;
    if (this.lastPointerX < bounds.left + EDGE_SIZE && this.lastPointerX > bounds.left - EDGE_SIZE) {
      delta = -EDGE_SCROLL_SPEED;
    } else if (this.lastPointerX > bounds.right - EDGE_SIZE && this.lastPointerX < bounds.right + EDGE_SIZE) {
      delta = EDGE_SCROLL_SPEED;
    }
    if (delta) {
      const before = container.scrollLeft;
      container.scrollLeft += delta;
      if (container.scrollLeft !== before) {
        this.updateTarget(this.lastPointerX);
      }
    }
    this.scrollFrame = requestAnimationFrame(() => this.autoScroll());
  }

  private drop(target: IColumnDropTarget | undefined): void {
    if (!target || !this.sourceTh) {
      return;
    }
    const cells = this.table.headerCells();
    const from = cells.indexOf(this.sourceTh);
    const to = cells.indexOf(target.th) + (target.after ? 1 : 0);
    if (from < 0 || to < 0) {
      return;
    }
    this.table.moveColumn(from, to);
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
    this.sourceTh?.removeAttribute('data-dragging');
    this.table.reorderContainer.removeAttribute('data-column-reordering');
    this.ghost?.remove();
    this.ghost = undefined;
    this.dragging = false;
    this.sourceTh = undefined;
    this.pointerId = undefined;
    window.removeEventListener('pointermove', this);
    window.removeEventListener('pointerup', this);
    window.removeEventListener('pointercancel', this);
    window.removeEventListener('keydown', this, true);
  }
}
