import { bindable, BindingMode, customElement, INode, resolve } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';
import { UiTable } from './ui-table';
import template from './ui-table-column.html?raw';

@customElement({ name: 'ui-table-column', template })
export class UiTableColumn implements EventListenerObject {
  readonly host = resolve(INode) as HTMLElement;
  readonly table = resolve(UiTable);
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

  @bindable({ mode: BindingMode.twoWay })
  direction: 'asc' | 'desc' | undefined;

  attaching(): void {
    this.applyWidth(this.table.getColumnWidth(this.host.id));
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

  onClick(event: MouseEvent): void {
    if (!this.sortable || this.resizing || this.resizeHandle?.contains(event.target as Node | null)) {
      return;
    }

    if (!this.direction) {
      this.direction = 'asc';
    } else if (this.direction === 'asc') {
      this.direction = 'desc';
    } else {
      this.direction = undefined;
    }

    this.host.dispatchEvent(new CustomEvent('sort-change', {
      bubbles: true,
      detail: this.direction ? { column: this.host.id, direction: this.direction } : undefined
    }));
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
