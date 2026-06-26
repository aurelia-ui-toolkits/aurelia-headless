import { bindable, BindingMode, customElement, INode, resolve, slotted } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';

export type AlertTone = 'info' | 'success' | 'warning' | 'danger';

@customElement('ui-alert')
export class UiAlert {
  private readonly host = resolve(INode) as HTMLElement;

  @bindable
  tone: AlertTone = 'info';

  @bindable
  title: string | undefined;

  @bindable
  role: 'status' | 'alert' | 'note' = 'status';

  @bindable({ mode: BindingMode.twoWay, set: booleanAttr })
  open: boolean = true;

  @bindable({ set: booleanAttr })
  dismissible: boolean = false;

  @slotted({ slotName: 'actions' })
  actionNodes: readonly Node[] = [];

  close(): void {
    this.open = false;
    this.host.dispatchEvent(new CustomEvent('alert-close', { bubbles: true }));
  }
}
