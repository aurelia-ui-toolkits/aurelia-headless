import { createFixture } from '@aurelia/testing';
import { tasksSettled } from '@aurelia/runtime';
import { CustomElement } from 'aurelia';
import { UiSelect } from '../src/select/ui-select';
import { EnhanceUiSelect } from '../src/select/enhance-ui-select';
import { UiCombobox } from '../src/combobox/ui-combobox';
import { EnhanceUiCombobox } from '../src/combobox/enhance-ui-combobox';
import { UiMenu } from '../src/menu/ui-menu';
import { UiPopup } from '../src/popup/ui-popup';
import { UiList } from '../src/list/ui-list';
import { UiListItem } from '../src/list/ui-list-item';

export const options = [
  { id: 0, name: 'Alpha', region: 'North' },
  { id: 1, name: 'Blocked', region: 'South', disabled: true },
  { id: 2, name: 'Beta', region: 'East' },
  { id: 3, name: 'Gamma', region: 'West' },
];

export const registrations = [
  UiSelect, EnhanceUiSelect, UiCombobox, EnhanceUiCombobox, UiMenu, UiPopup, UiList, UiListItem,
];

export async function selectFixture(attributes = '', state = {}) {
  const fixture = createFixture(
    `<ui-select items.bind="items" value.bind="value" value-field="id" label-field="name"
      label="Project" placeholder="Choose project" ${attributes}>
      <ui-list><ui-list-item repeat.for="item of $host.items" value.bind="item" disabled.bind="item.disabled">
        <span textcontent.bind="item.name"></span>
      </ui-list-item></ui-list>
    </ui-select>`,
    { items: options, value: undefined as unknown, ...state }, registrations,
  );
  await fixture.started;
  const host = fixture.getBy<HTMLElement>('.ui-select')!;
  const vm = CustomElement.for<UiSelect>(host).viewModel;
  return { ...fixture, host, vm, control: fixture.getBy<HTMLElement>('.ui-select__control')! };
}

export async function comboboxFixture(attributes = '', state = {}) {
  const fixture = createFixture(
    `<ui-combobox items.bind="items" value.bind="value" text.bind="text"
      value-field="id" label-field="name" label="Project" ${attributes}>
      <ui-list><ui-list-item repeat.for="item of $host.items" value.bind="item" disabled.bind="item.disabled">
        <span textcontent.bind="item.name"></span>
      </ui-list-item></ui-list>
    </ui-combobox>`,
    { items: options, value: undefined as unknown, text: undefined as string | undefined, ...state }, registrations,
  );
  await fixture.started;
  const host = fixture.getBy<HTMLElement>('.ui-combobox')!;
  const vm = CustomElement.for<UiCombobox>(host).viewModel;
  return { ...fixture, host, vm, input: fixture.getBy<HTMLInputElement>('input')! };
}

export async function settle() {
  await tasksSettled();
  // Menu focus is scheduled with a zero-delay timer after the popup opens.
  await new Promise(resolve => setTimeout(resolve, 0));
  await tasksSettled();
}

export async function key(element: HTMLElement, value: string, init: KeyboardEventInit = {}) {
  const event = new KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true, ...init });
  element.dispatchEvent(event);
  await settle();
  return event;
}

export async function type(input: HTMLInputElement, value: string) {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await settle();
}

export function rows() {
  return Array.from(document.querySelectorAll<HTMLElement>('[role="option"]'));
}
