import { bindable, customElement } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';

type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

@customElement('ui-badge')
export class UiBadge {
  @bindable
  tone: BadgeTone = 'neutral';

  @bindable({ set: booleanAttr })
  pill = false;

  @bindable({ set: booleanAttr })
  outlined = false;
}
