import { bindable, BindingMode, customElement, INode, resolve } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';
import { Keys } from '../base/keys';
import template from './ui-chip.html?raw';

type ChipTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

@customElement({ name: 'ui-chip', template })
export class UiChip {
  private readonly host = resolve(INode) as HTMLElement;

  @bindable({ mode: BindingMode.twoWay, set: booleanAttr })
  selected = false;

  @bindable({ set: booleanAttr })
  disabled = false;

  @bindable({ set: booleanAttr })
  removable = false;

  @bindable
  value: unknown;

  @bindable
  tone: ChipTone = 'neutral';

  hover = false;
  focus = false;
  active = false;

  onClick(event: MouseEvent): void {
    if (this.disabled || this.isRemoveTarget(event.target)) {
      return;
    }

    this.toggleSelected();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (this.disabled) {
      return;
    }

    if (event.key === Keys.Space || event.key === Keys.Enter) {
      event.preventDefault();
      this.toggleSelected();
      return;
    }

    if (this.removable && (event.key === 'Backspace' || event.key === 'Delete')) {
      event.preventDefault();
      this.remove();
    }
  }

  onRemoveClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.remove();
  }

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
      this.focus = true;
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

  private toggleSelected(): void {
    this.selected = !this.selected;
    this.host.dispatchEvent(new CustomEvent('chip-select', {
      bubbles: true,
      detail: { selected: this.selected, value: this.value }
    }));
  }

  private remove(): void {
    if (this.disabled || !this.removable) {
      return;
    }

    this.host.dispatchEvent(new CustomEvent('chip-remove', {
      bubbles: true,
      detail: { value: this.value }
    }));
  }

  private isRemoveTarget(target: EventTarget | null): boolean {
    return target instanceof HTMLElement && !!target.closest('.ui-chip__remove');
  }
}
