import { createFixture } from '@aurelia/testing';
import { AppTask, CustomElement, IAttrMapper, IContainer, NodeObserverLocator } from 'aurelia';
import * as UI from '../src/index';
import { EnhanceUiButton } from '../src/button/enhance-ui-button';
import { EnhanceUiInput } from '../src/input/enhance-ui-input';
import { EnhanceUiTable } from '../src/table/enhance-ui-table';
import { registrations, settle } from './fixture';

export { UI };

export const libraryResources = [
  AppTask.creating(IContainer, container => {
    container.get(IAttrMapper).useTwoWay((el, property) => el.hasAttribute('ui-input-element') && property === 'value');
    container.get(NodeObserverLocator).useConfig('UI-INPUT', 'value', { events: ['input', 'change'] });
    container.get(NodeObserverLocator).useConfig('UI-DATEPICKER', 'value', { events: ['input', 'change'] });
  }),
  ...registrations, EnhanceUiButton, EnhanceUiInput, EnhanceUiTable,
  UI.UiAlert, UI.UiBadge, UI.UiBreadcrumbs, UI.UiButton, UI.UiIconButton,
  UI.UiCheckbox, UI.UiChip, UI.UiDisclosure, UI.UiDrawer, UI.UiFloatingActions,
  UI.UiForm, UI.UiInput, UI.UiProgress, UI.UiRadio, UI.UiRadioGroup,
  UI.UiSegment, UI.UiSegmentedControl, UI.UiSlider, UI.UiSplitter, UI.UiSwitch, UI.UiTab,
  UI.UiTabs, UI.UiTable, UI.UiTableColumn, UI.UiTopAppBar, UI.UiTree,
  UI.UiToastRegion, UI.UiValidationContainer, UI.UiFocusTrap, UI.UiSizeCustomAttribute,
  UI.UiContextMenuCustomAttribute, UI.UiReorder, UI.EnhanceUiList, UI.UiInputmaskCustomAttribute,
];

export async function mount<T extends object>(template: string, state: T, extra: unknown[] = []) {
  const f = createFixture(template, state, [...libraryResources, ...extra]);
  await f.started;
  await settle();
  return f;
}

export function viewModel<T extends object>(host: Element): T {
  return CustomElement.for<T>(host).viewModel;
}

export function dispatch(host: Element, event: string, init: MouseEventInit = {}) {
  return host.dispatchEvent(new MouseEvent(event, { bubbles: true, cancelable: true, ...init }));
}
