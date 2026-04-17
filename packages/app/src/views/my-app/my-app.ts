import { customElement, resolve } from 'aurelia';
import { ICurrentRoute, IRouter } from '@aurelia/router';
import { ButtonView } from '../button/button-view';
import { CheckboxView } from '../checkbox/checkbox-view';
import { DisclosureView } from '../disclosure/disclosure-view';
import { InputView } from '../input/input-view';
import { ListView } from '../list/list-view';
import { PopupView } from '../popup/popup-view';
import { SwitchView } from '../switch/switch-view';
import template from './my-app.html?raw';
import './my-app.css';

type DemoRoute = { id: string; path: string; title: string; component: unknown };

@customElement({ name: 'my-app', template })
export class MyApp {
  static routes: DemoRoute[] = [
    { id: 'button', path: '', title: 'ui-button', component: ButtonView },
    { id: 'button-alt', path: 'button', title: 'ui-button', component: ButtonView },
    { id: 'switch', path: 'switch', title: 'ui-switch', component: SwitchView },
    { id: 'checkbox', path: 'checkbox', title: 'ui-checkbox', component: CheckboxView },
    { id: 'disclosure', path: 'disclosure', title: 'ui-disclosure', component: DisclosureView },
    { id: 'input', path: 'input', title: 'ui-input', component: InputView },
    { id: 'list', path: 'list', title: 'ui-list', component: ListView },
    { id: 'popup', path: 'popup', title: 'ui-popup', component: PopupView }
  ];

  private readonly router = resolve(IRouter);
  private readonly currentRoute = resolve(ICurrentRoute);

  readonly menuItems = MyApp.routes.filter((route) => route.id !== 'button-alt');

  get selectedMenuItem(): DemoRoute | undefined {
    const current = this.normalizePath(this.currentRoute.path ?? '');
    return this.menuItems.find((item) => this.normalizePath(item.path) === current)
      ?? this.menuItems[0];
  }

  navigate(path: string): void {
    void this.router.load(path || '');
  }

  private normalizePath(path: string): string {
    return path.replace(/^\/+/, '');
  }
}
