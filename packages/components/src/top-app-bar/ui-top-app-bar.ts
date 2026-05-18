import { bindable, customElement, slotted } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';
import template from './ui-top-app-bar.html?raw';

@customElement({ name: 'ui-top-app-bar', template })
export class UiTopAppBar {
  @bindable({ set: booleanAttr })
  sticky: boolean = false;

  @bindable({ set: booleanAttr })
  fixed: boolean = false;

  @bindable({ set: booleanAttr })
  dense: boolean = false;

  @bindable({ set: booleanAttr })
  elevated: boolean = false;

  @slotted({ slotName: 'navigation' })
  navigationNodes: readonly Node[] = [];

  @slotted({ slotName: 'breadcrumbs' })
  breadcrumbNodes: readonly Node[] = [];

  @slotted({ slotName: 'actions' })
  actionNodes: readonly Node[] = [];
}
