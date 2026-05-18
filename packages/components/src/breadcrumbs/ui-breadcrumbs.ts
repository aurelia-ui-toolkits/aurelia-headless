import { bindable, customElement } from 'aurelia';
import template from './ui-breadcrumbs.html?raw';

export interface UiBreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

@customElement({ name: 'ui-breadcrumbs', template })
export class UiBreadcrumbs {
  @bindable
  items: readonly UiBreadcrumbItem[] = [];
}
