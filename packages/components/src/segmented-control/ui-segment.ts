import { bindable, customElement, INode, resolve } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';
import { UiSegmentedControl } from './ui-segmented-control';
import template from './ui-segment.html?raw';

@customElement({ name: 'ui-segment', template })
export class UiSegment {
  readonly element = resolve(INode) as HTMLElement;
  readonly parentControl = resolve(UiSegmentedControl);

  @bindable
  value: unknown = this;

  @bindable({ set: booleanAttr })
  disabled: boolean = false;

  onClick(): void {
    this.parentControl.select(this);
  }
}
