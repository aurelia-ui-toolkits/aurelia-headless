import { bindable, customElement, slotted } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';

@customElement('ui-top-app-bar')
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
