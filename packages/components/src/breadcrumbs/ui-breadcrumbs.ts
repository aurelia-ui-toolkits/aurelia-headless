import { bindable, customElement, resolve } from 'aurelia';
import { UiBreadcrumbsConfiguration } from './ui-breadcrumbs-configuration';

export interface UiBreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

@customElement('ui-breadcrumbs')
export class UiBreadcrumbs {
  readonly configuration = resolve(UiBreadcrumbsConfiguration);

  @bindable
  items: readonly UiBreadcrumbItem[] = [];
}
