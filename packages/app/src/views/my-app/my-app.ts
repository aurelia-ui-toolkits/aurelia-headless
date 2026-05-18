import { customElement, resolve } from 'aurelia';
import { ICurrentRoute, IRouter } from '@aurelia/router';
import { AlertView } from '../alert/alert-view';
import { ButtonView } from '../button/button-view';
import { CheckboxView } from '../checkbox/checkbox-view';
import { ComboboxView } from '../combobox/combobox-view';
import { DisclosureView } from '../disclosure/disclosure-view';
import { DrawerView } from '../drawer/drawer-view';
import { InputView } from '../input/input-view';
import { ListView } from '../list/list-view';
import { MenuView } from '../menu/menu-view';
import { PopupView } from '../popup/popup-view';
import { ProgressView } from '../progress/progress-view';
import { RadioView } from '../radio/radio-view';
import { SegmentedControlView } from '../segmented-control/segmented-control-view';
import { SelectView } from '../select/select-view';
import { SliderView } from '../slider/slider-view';
import { SplitterView } from '../splitter/splitter-view';
import { SwitchView } from '../switch/switch-view';
import { TabsView } from '../tabs/tabs-view';
import { TableView } from '../table/table-view';
import { ToastView } from '../toast/toast-view';
import { TooltipView } from '../tooltip/tooltip-view';
import { TreeView } from '../tree/tree-view';
import logoUrl from '../../assets/aurelia-headless-logo.png';
import template from './my-app.html?raw';
import './my-app.css';

type DemoRoute = { id: string; path: string; title: string; component: unknown };

@customElement({ name: 'my-app', template })
export class MyApp {
  menuOpen = true;

  static routes: DemoRoute[] = [
    { id: 'button', path: '', title: 'ui-button', component: ButtonView },
    { id: 'alert', path: 'alert', title: 'ui-alert', component: AlertView },
    { id: 'button-alt', path: 'button', title: 'ui-button', component: ButtonView },
    { id: 'switch', path: 'switch', title: 'ui-switch', component: SwitchView },
    { id: 'checkbox', path: 'checkbox', title: 'ui-checkbox', component: CheckboxView },
    { id: 'combobox', path: 'combobox', title: 'ui-combobox', component: ComboboxView },
    { id: 'disclosure', path: 'disclosure', title: 'ui-disclosure', component: DisclosureView },
    { id: 'drawer', path: 'drawer', title: 'ui-drawer', component: DrawerView },
    { id: 'input', path: 'input', title: 'ui-input', component: InputView },
    { id: 'list', path: 'list', title: 'ui-list', component: ListView },
    { id: 'menu', path: 'menu', title: 'ui-menu', component: MenuView },
    { id: 'popup', path: 'popup', title: 'ui-popup', component: PopupView },
    { id: 'progress', path: 'progress', title: 'ui-progress', component: ProgressView },
    { id: 'radio', path: 'radio', title: 'ui-radio-group', component: RadioView },
    { id: 'segmented-control', path: 'segmented-control', title: 'ui-segmented-control', component: SegmentedControlView },
    { id: 'select', path: 'select', title: 'ui-select', component: SelectView },
    { id: 'slider', path: 'slider', title: 'ui-slider', component: SliderView },
    { id: 'splitter', path: 'splitter', title: 'ui-splitter', component: SplitterView },
    { id: 'tabs', path: 'tabs', title: 'ui-tabs', component: TabsView },
    { id: 'table', path: 'table', title: 'ui-table', component: TableView },
    { id: 'toast', path: 'toast', title: 'ui-toast', component: ToastView },
    { id: 'tooltip', path: 'tooltip', title: 'ui-tooltip', component: TooltipView },
    { id: 'tree', path: 'tree', title: 'ui-tree', component: TreeView }
  ];

  private readonly router = resolve(IRouter);
  private readonly currentRoute = resolve(ICurrentRoute);

  readonly menuItems = MyApp.routes.filter((route) => route.id !== 'button-alt');
  readonly logoUrl = logoUrl;

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
