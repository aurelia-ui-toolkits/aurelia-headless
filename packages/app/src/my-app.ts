import { customElement, resolve } from 'aurelia';
import { ICurrentRoute, IRouter } from '@aurelia/router';
import { ButtonView } from './views/button/button-view';
import { CheckboxView } from './views/checkbox/checkbox-view';
import { DisclosureView } from './views/disclosure/disclosure-view';
import { ListView } from './views/list/list-view';
import { SwitchView } from './views/switch/switch-view';
import template from './my-app.html?raw';

type DemoRoute = { id: string; path: string; title: string; component: unknown };

@customElement({ name: 'my-app', template })
export class MyApp {
  static routes: DemoRoute[] = [
    { id: 'button', path: '', title: 'ui-button', component: ButtonView },
    { id: 'button-alt', path: 'button', title: 'ui-button', component: ButtonView },
    { id: 'switch', path: 'switch', title: 'ui-switch', component: SwitchView },
    { id: 'checkbox', path: 'checkbox', title: 'ui-checkbox', component: CheckboxView },
    { id: 'disclosure', path: 'disclosure', title: 'ui-disclosure', component: DisclosureView },
    { id: 'list', path: 'list', title: 'ui-list', component: ListView }
  ];

  private readonly router = resolve(IRouter);
  private readonly currentRoute = resolve(ICurrentRoute)

  readonly menuItems = MyApp.routes.filter((route) => route.id !== 'button-alt');
  selectedMenuItem: DemoRoute | undefined;

  binding(): void {
    this.selectedMenuItem = this.menuItems.find((item) => this.isActive(item.path));
  }

  navigate(path: string): void {
    void this.router.load(path || '');
  }

  isActive(path: string): boolean {
    const current = this.currentRoute.path ?? '';
    if (path === '') {
      return current === '';
    }

    return current === path || current.startsWith(`${path}/`);
  }
}
