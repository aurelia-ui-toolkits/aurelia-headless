import { bindable, customElement, INode, resolve } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';

type ButtonType = 'button' | 'submit' | 'reset';

@customElement('ui-button')
export class UiButton {
  readonly element = resolve(INode) as HTMLElement;

  @bindable
  type: ButtonType = 'button';

  @bindable({ set: booleanAttr })
  disabled: boolean = false;

  @bindable({ set: booleanAttr })
  primary: boolean = false;

  @bindable({ set: booleanAttr })
  outlined: boolean = false;

  @bindable({ set: booleanAttr })
  danger: boolean = false;

  hover: boolean = false;
  focus: boolean = false;
  active: boolean = false;

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

  onClick(event: MouseEvent): void {
    if (this.disabled) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }

  /**
   * The router's load/href attributes assign the resolved URL to the view model when their host
   * is a custom element; reflect it onto the host so <a ui-button> (and <a ui-icon-button>) gets a
   * real href (open-in-new-tab, copy link, etc.).
   */
  get href(): string | null {
    return this.element.getAttribute('href');
  }
  set href(value: string | null) {
    if (value == null) {
      this.element.removeAttribute('href');
    } else {
      this.element.setAttribute('href', value);
    }
  }
}
