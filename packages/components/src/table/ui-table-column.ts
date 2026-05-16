import { bindable, customAttribute, INode, resolve } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';
import { UiTable } from './ui-table';

@customAttribute({ name: 'ui-table-column', defaultProperty: 'id' })
export class UiTableColumn implements EventListenerObject {
  private readonly host = resolve(INode) as HTMLElement;
  private readonly table = resolve(UiTable);
  private resizeHandle: HTMLElement | undefined;
  private startX = 0;
  private startWidth = 0;
  private resizing = false;

  @bindable
  id: string = '';
  idChanged(): void {
    this.syncSortState();
  }

  @bindable({ set: booleanAttr })
  sortable: boolean = false;

  @bindable({ set: booleanAttr })
  resizable: boolean = false;

  @bindable
  minWidth: number = 64;

  attaching(): void {
    this.host.classList.add('ui-table-column');
    this.host.addEventListener('click', this);
    if (this.isResizable) {
      this.ensureResizeHandle();
    }
    this.table.registerColumn(this);
  }

  detaching(): void {
    this.host.removeEventListener('click', this);
    this.resizeHandle?.removeEventListener('pointerdown', this);
    window.removeEventListener('pointermove', this);
    window.removeEventListener('pointerup', this);
    this.resizeHandle?.remove();
    this.table.unregisterColumn(this);
  }

  handleEvent(event: Event): void {
    if (event.type === 'click') {
      this.onClick(event as MouseEvent);
      return;
    }

    if (event.type === 'pointerdown') {
      this.onPointerDown(event as PointerEvent);
      return;
    }

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
      return;
    }

    this.host.style.width = `${width}px`;
  }

  syncSortState(): void {
    const direction = this.table.getSortDirection(this.id);
    this.host.dataset.sort = direction ?? '';
    if (direction === 'asc') {
      this.host.setAttribute('aria-sort', 'ascending');
    } else if (direction === 'desc') {
      this.host.setAttribute('aria-sort', 'descending');
    } else {
      this.host.removeAttribute('aria-sort');
    }
  }

  private onClick(event: MouseEvent): void {
    if (!this.isSortable || this.resizing || this.resizeHandle?.contains(event.target as Node | null)) {
      return;
    }

    this.table.toggleSort(this.id);
  }

  private onPointerDown(event: PointerEvent): void {
    if (!this.isResizable) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    this.resizing = true;
    this.startX = event.clientX;
    this.startWidth = this.host.getBoundingClientRect().width;
    window.addEventListener('pointermove', this);
    window.addEventListener('pointerup', this);
  }

  private onPointerMove(event: PointerEvent): void {
    if (!this.resizing) {
      return;
    }

    const width = Math.max(Number(this.minWidth) || 64, this.startWidth + event.clientX - this.startX);
    this.table.setColumnWidth(this.id, width);
  }

  private onPointerUp(): void {
    if (!this.resizing) {
      return;
    }

    this.resizing = false;
    window.removeEventListener('pointermove', this);
    window.removeEventListener('pointerup', this);
    this.table.setColumnWidth(this.id, this.host.getBoundingClientRect().width, true);
  }

  private ensureResizeHandle(): void {
    if (this.resizeHandle) {
      return;
    }

    this.resizeHandle = document.createElement('span');
    this.resizeHandle.className = 'ui-table-column__resize-handle';
    this.resizeHandle.addEventListener('pointerdown', this);
    this.host.append(this.resizeHandle);
  }

  private get isSortable(): boolean {
    return this.table.sortable && this.sortable && !!this.id;
  }

  private get isResizable(): boolean {
    return this.table.resizable && this.resizable && !!this.id;
  }
}
