import { bindable, customElement, INode, resolve } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';
import { UiTable } from './ui-table';
import template from './ui-table-column.html?raw';

@customElement({ name: 'ui-table-column', template })
export class UiTableColumn implements EventListenerObject {
  private readonly host = resolve(INode) as HTMLElement;
  private readonly table = resolve(UiTable);
  private resizeHandle: HTMLElement | undefined;
  private startX = 0;
  private startWidth = 0;
  private resizing = false;

  @bindable({ set: booleanAttr })
  sortable: boolean = false;

  @bindable({ set: booleanAttr })
  resizable: boolean = false;

  @bindable
  minWidth: number = 64;

  attaching(): void {
    this.applyWidth(this.table.getColumnWidth(this.host.id));
    this.table.syncColumnSortStateFor(this.host);
  }

  detaching(): void {
    window.removeEventListener('pointermove', this);
    window.removeEventListener('pointerup', this);
  }

  handleEvent(event: Event): void {
    if (event.type === 'pointermove') {
      this.onPointerMove(event as PointerEvent);
      return;
    }

    if (event.type === 'pointerup') {
      this.onPointerUp();
    }
  }

  applyWidth(width: number | undefined): void {
    if (width === undefined) {
      this.host.style.removeProperty('width');
      this.host.style.removeProperty('min-width');
      return;
    }

    this.host.style.width = `${width}px`;
    this.host.style.minWidth = `${width}px`;
  }

  syncSortState(): void {
    const direction = this.table.getSortDirection(this.host.id);
    this.host.dataset.sort = direction ?? '';
    if (direction === 'asc') {
      this.host.setAttribute('aria-sort', 'ascending');
    } else if (direction === 'desc') {
      this.host.setAttribute('aria-sort', 'descending');
    } else {
      this.host.removeAttribute('aria-sort');
    }
  }

  onClick(event: MouseEvent): void {
    if (!this.sortable || this.resizing || this.resizeHandle?.contains(event.target as Node | null)) {
      return;
    }

    this.table.toggleSort(this.host.id);
  }

  onPointerDown(event: PointerEvent): void {
    if (!this.resizable) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    this.resizing = true;
    this.startX = event.clientX;
    this.startWidth = this.host.getBoundingClientRect().width;
    this.resizeHandle?.setPointerCapture(event.pointerId);
    window.addEventListener('pointermove', this);
    window.addEventListener('pointerup', this);
  }

  private onPointerMove(event: PointerEvent): void {
    if (!this.resizing) {
      return;
    }

    const width = Math.max(Number(this.minWidth) || 64, this.startWidth + event.clientX - this.startX);
    this.table.setColumnWidth(this.host.id, width);
  }

  private onPointerUp(): void {
    if (!this.resizing) {
      return;
    }

    this.resizing = false;
    window.removeEventListener('pointermove', this);
    window.removeEventListener('pointerup', this);
    this.table.setColumnWidth(this.host.id, this.host.getBoundingClientRect().width, true);
  }
}
