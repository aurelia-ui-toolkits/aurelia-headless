import { customElement } from 'aurelia';
import template from './my-app.html?raw';

type ListDemoItem = {
  id: number;
  label: string;
  category: string;
  disabled?: boolean;
};

@customElement({ name: 'my-app', template })
export class MyApp {
  clickCount = 0;
  isLoading = false;
  emailNotifications = true;
  desktopAlerts = false;
  marketingConsent = true;
  termsAccepted = false;
  listActivation = 'None';
  listSelection = 'None';

  readonly staticList: ListDemoItem[] = [
    { id: 1, label: 'Dashboard', category: 'General' },
    { id: 2, label: 'Billing', category: 'General' },
    { id: 3, label: 'Audit logs', category: 'Security', disabled: true },
    { id: 4, label: 'Integrations', category: 'Settings' }
  ];

  readonly virtualList: ListDemoItem[] = Array.from({ length: 40 }, (_, index) => ({
    id: index + 1,
    label: `Dataset ${index + 1}`,
    category: index % 2 === 0 ? 'Primary' : 'Secondary',
    disabled: (index + 1) % 9 === 0
  }));

  handleClick(): void {
    this.clickCount++;
  }

  toggleLoading(): void {
    this.isLoading = !this.isLoading;
  }

  onListActivate(event: CustomEvent<{ index: number; value: ListDemoItem | null }>): void {
    this.listActivation = this.describeListEvent(event.detail);
  }

  onListSelect(event: CustomEvent<{ index: number; value: ListDemoItem | null }>): void {
    this.listSelection = this.describeListEvent(event.detail);
  }

  private describeListEvent(detail: { index: number; value: ListDemoItem | null }): string {
    const label = detail.value?.label ?? 'Unknown';
    return `${label} (#${detail.index + 1})`;
  }
}
