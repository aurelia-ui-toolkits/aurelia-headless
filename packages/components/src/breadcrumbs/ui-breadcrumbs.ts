import { bindable, customElement } from 'aurelia';

export interface UiBreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

@customElement('ui-breadcrumbs')
export class UiBreadcrumbs {
  @bindable
  items: readonly UiBreadcrumbItem[] = [];
}
