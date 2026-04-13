import { bindable, customElement, inject } from 'aurelia';
import template from './ui-button.html?raw';

function booleanAttr(val: unknown): boolean {
  return val === '' || !!val;
}

@inject(Element)
@customElement({ name: 'ui-button', template })
export class UiButton {
  constructor(public root: HTMLElement) { }

  @bindable({ set: booleanAttr })
  disabled: boolean = false;

  @bindable()
  hover: boolean = false;

  @bindable()
  focus: boolean = false;

  @bindable()
  active: boolean = false;

  disabledChanged(): void {
    this.syncDataAttributes();
    if (this.disabled) {
      this.hover = false;
      this.focus = false;
      this.active = false;
    }
  }

  hoverChanged(): void { this.syncDataAttributes(); }
  focusChanged(): void { this.syncDataAttributes(); }
  activeChanged(): void { this.syncDataAttributes(); }

  onMouseEnter(): void {
    if (!this.disabled) {
      this.hover = true;
    }
  }

  onMouseLeave(): void {
    this.hover = false;
  }

  onFocusIn(): void {
    if (!this.disabled) {
      try {
        this.focus = this.root.matches(':focus-visible');
      } catch {
        this.focus = true;
      }
    }
  }

  onFocusOut(): void {
    this.focus = false;
  }

  onPointerDown(): void {
    if (!this.disabled) {
      this.active = true;
    }
  }

  onPointerUp(): void {
    this.active = false;
  }

  onPointerLeave(): void {
    this.active = false;
  }

  onClick(event: MouseEvent): void {
    if (this.disabled) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }

  private syncDataAttributes(): void {
    this.setDataAttr('data-disabled', this.disabled);
    this.setDataAttr('data-hover', this.hover);
    this.setDataAttr('data-focus', this.focus);
    this.setDataAttr('data-active', this.active);
  }

  private setDataAttr(name: string, value: boolean): void {
    if (value) {
      this.root.setAttribute(name, '');
    } else {
      this.root.removeAttribute(name);
    }
  }
}
