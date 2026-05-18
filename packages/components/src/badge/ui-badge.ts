import { bindable, customElement } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';
import template from './ui-badge.html?raw';

type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

@customElement({ name: 'ui-badge', template })
export class UiBadge {
  @bindable
  tone: BadgeTone = 'neutral';

  @bindable({ set: booleanAttr })
  pill = false;

  @bindable({ set: booleanAttr })
  outlined = false;
}
