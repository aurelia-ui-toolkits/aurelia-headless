import { IDisposable, observable, resolve } from 'aurelia';
import { ICurrentRoute, IRouter, IRouterEvents } from '@aurelia/router';
import { UiBreadcrumbItem } from '@aurelia-ui-toolkits/headless';
import { AlertView } from '../alert/alert-view';
import { BadgeView } from '../badge/badge-view';
import { ButtonView } from '../button/button-view';
import { CheckboxView } from '../checkbox/checkbox-view';
import { ChipView } from '../chip/chip-view';
import { ComboboxView } from '../combobox/combobox-view';
import { DatepickerView } from '../datepicker/datepicker-view';
import { DisclosureView } from '../disclosure/disclosure-view';
import { DrawerView } from '../drawer/drawer-view';
import { FloatingActionsView } from '../floating-actions/floating-actions-view';
import { FormView } from '../form/form-view';
import { GetStartedView } from '../get-started/get-started-view';
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
import { TopAppBarView } from '../top-app-bar/top-app-bar-view';
import { TreeView } from '../tree/tree-view';
import { ThemeBuilder } from '../theme-builder/theme-builder';
import { ThemeController } from '../theme-builder/theme-controller';
import logoUrl from '../../assets/aurelia-headless-logo.png';

type DemoRoute = { id: string; path: string; title: string; component: unknown };
const mobileQuery = '(max-width: 760px)';
type ThemePackage = 'default' | 'compact';

export class MyApp {
  mobile = this.isMobile();
  menuOpen = !this.mobile;

  static routes: DemoRoute[] = [
    { id: 'get-started', path: '', title: 'Get started', component: GetStartedView },
    { id: 'theme-builder', path: 'theme-builder', title: 'Theme builder', component: ThemeBuilder },
    { id: 'alert', path: 'alert', title: 'alert', component: AlertView },
    { id: 'badge', path: 'badge', title: 'badge', component: BadgeView },
    { id: 'button', path: 'button', title: 'button', component: ButtonView },
    { id: 'checkbox', path: 'checkbox', title: 'checkbox', component: CheckboxView },
    { id: 'chip', path: 'chip', title: 'chip', component: ChipView },
    { id: 'combobox', path: 'combobox', title: 'combobox', component: ComboboxView },
    { id: 'datepicker', path: 'datepicker', title: 'datepicker', component: DatepickerView },
    { id: 'disclosure', path: 'disclosure', title: 'disclosure', component: DisclosureView },
    { id: 'drawer', path: 'drawer', title: 'drawer', component: DrawerView },
    { id: 'floating-actions', path: 'floating-actions', title: 'floating-actions', component: FloatingActionsView },
    { id: 'form', path: 'form', title: 'form', component: FormView },
    { id: 'input', path: 'input', title: 'input', component: InputView },
    { id: 'list', path: 'list', title: 'list', component: ListView },
    { id: 'menu', path: 'menu', title: 'menu', component: MenuView },
    { id: 'popup', path: 'popup', title: 'popup', component: PopupView },
    { id: 'progress', path: 'progress', title: 'progress', component: ProgressView },
    { id: 'radio', path: 'radio', title: 'radio-group', component: RadioView },
    { id: 'segmented-control', path: 'segmented-control', title: 'segmented-control', component: SegmentedControlView },
    { id: 'select', path: 'select', title: 'select', component: SelectView },
    { id: 'slider', path: 'slider', title: 'slider', component: SliderView },
    { id: 'splitter', path: 'splitter', title: 'splitter', component: SplitterView },
    { id: 'switch', path: 'switch', title: 'switch', component: SwitchView },
    { id: 'tabs', path: 'tabs', title: 'tabs', component: TabsView },
    { id: 'table', path: 'table', title: 'table', component: TableView },
    { id: 'toast', path: 'toast', title: 'toast', component: ToastView },
    { id: 'tooltip', path: 'tooltip', title: 'tooltip', component: TooltipView },
    { id: 'top-app-bar', path: 'top-app-bar', title: 'top-app-bar', component: TopAppBarView },
    { id: 'tree', path: 'tree', title: 'tree', component: TreeView }
  ];

  private readonly router = resolve(IRouter);
  private readonly currentRoute = resolve(ICurrentRoute);
  private readonly routerEvents = resolve(IRouterEvents);
  private routeSubscription: IDisposable | undefined;
  private mobileMedia: MediaQueryList | undefined;

  readonly menuItems = MyApp.routes;
  readonly logoUrl = logoUrl;
  selectedMenuItem: DemoRoute = this.menuItems[0];
  breadcrumbs: UiBreadcrumbItem[] = [];

  readonly theme = resolve(ThemeController);

  @observable
  compactTheme = this.loadThemePackage();
  compactThemeChanged(): void {
    this.applyDensity();
    this.persistDensity();
  }

  constructor() {
    this.applyDensity();
  }

  attached(): void {
    this.applyDensity();
    this.updateRouteState();
    this.mobileMedia = globalThis.matchMedia?.(mobileQuery);
    this.mobileMedia?.addEventListener('change', this.onMobileChange);
    this.routeSubscription = this.routerEvents.subscribe('au:router:navigation-end', () => {
      this.updateRouteState();
    });
  }

  detaching(): void {
    this.mobileMedia?.removeEventListener('change', this.onMobileChange);
    this.mobileMedia = undefined;
    this.routeSubscription?.dispose();
    this.routeSubscription = undefined;
  }

  private readonly onMobileChange = (event: MediaQueryListEvent): void => {
    this.mobile = event.matches;
    this.menuOpen = !this.mobile;
  };

  private updateRouteState(): void {
    const current = this.normalizePath(this.currentRoute.path ?? '');
    this.selectedMenuItem = this.menuItems.find((item) => this.normalizePath(item.path) === current)
      ?? this.menuItems[0];
    this.breadcrumbs = [
      { label: 'Home', href: '#/' },
      { label: this.selectedMenuItem.title, current: true }
    ];
  }

  navigate(path: string): void {
    if (this.mobile) {
      this.menuOpen = false;
    }
    void this.router.load(path || '');
  }

  private isMobile(): boolean {
    return globalThis.matchMedia?.(mobileQuery).matches ?? false;
  }

  private persistDensity(): void {
    try {
      localStorage.setItem('aurelia-headless:density', this.compactTheme ? 'compact' : 'default');
    } catch {
      // Ignore unavailable storage.
    }
  }

  private applyDensity(): void {
    document.documentElement.dataset.density = this.compactTheme ? 'compact' : 'default';
  }

  private loadThemePackage(): ThemePackage {
    try {
      return localStorage.getItem('aurelia-headless:density') === 'compact' ? 'compact' : 'default';
    } catch {
      return 'default';
    }
  }

  private normalizePath(path: string): string {
    return path.replace(/^\/+/, '');
  }
}
