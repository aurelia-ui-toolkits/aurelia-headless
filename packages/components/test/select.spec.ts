import { createFixture } from '@aurelia/testing';
import { CustomElement, ValueConverter } from 'aurelia';
import { describe, expect, it, vi } from 'vitest';
import { UiSelect } from '../src/select/ui-select';
import { key, options, registrations, rows, selectFixture, settle } from './fixture';

describe('ui-select', () => {
  it('resolves a falsy initial value and synchronizes replacement items and external resets', async () => {
    const f = await selectFixture('', { value: 0 });
    expect(f.vm.selectedItem).toBe(options[0]);
    f.assertText('.ui-select__value', 'Alpha', { compact: true });
    f.component.items = [{ id: 0, name: 'Renamed', region: 'North' }];
    await settle();
    f.assertText('.ui-select__value', 'Renamed', { compact: true });
    f.component.value = null;
    await settle();
    expect(f.vm.selectedItem).toBeUndefined();
    expect(f.vm.hasValue).toBe(false);
    f.assertText('.ui-select__value', 'Choose project', { compact: true });
  });

  it('resolves an initial value when options arrive later', async () => {
    const f = await selectFixture('', { value: 2, items: [] });
    expect(f.vm.selectedItem).toBeUndefined();
    f.component.items = options;
    await settle();
    f.assertText('.ui-select__value', 'Beta', { compact: true });
  });

  it('selects through the slotted list, updates the parent and emits bubbling form events', async () => {
    const f = await selectFixture();
    const input = vi.fn();
    const change = vi.fn();
    f.appHost.addEventListener('input', input);
    f.appHost.addEventListener('change', change);
    f.control.click();
    await settle();
    expect(f.control.getAttribute('aria-expanded')).toBe('true');
    rows()[2].click();
    await settle();
    expect(f.component.value).toBe(2);
    expect(f.vm.selectedItem).toBe(options[2]);
    expect(f.control.getAttribute('aria-expanded')).toBe('false');
    f.assertText('.ui-select__value', 'Beta', { compact: true });
    expect(input).toHaveBeenCalledTimes(1);
    expect(change).toHaveBeenCalledTimes(1);
  });

  it('toggles multiple selections without closing the popup', async () => {
    const f = await selectFixture('multiple', { value: [0] });
    f.control.click();
    await settle();
    expect(rows()[0].getAttribute('aria-selected')).toBe('true');
    rows()[2].click();
    await settle();
    expect(f.component.value).toEqual([0, 2]);
    f.assertText('.ui-select__value', 'Alpha; Beta', { compact: true });
    expect(f.vm.open).toBe(true);
    rows()[0].click();
    await settle();
    expect(f.component.value).toEqual([2]);
    expect(rows()[0].getAttribute('aria-selected')).toBe('false');
    f.component.value = [];
    await settle();
    expect(f.vm.selectedItem).toEqual([]);
    f.assertText('.ui-select__value', 'Choose project', { compact: true });
  });

  it.each(['Enter', ' '])('opens with %s and closes with Escape', async openingKey => {
    const f = await selectFixture();
    expect((await key(f.control, openingKey)).defaultPrevented).toBe(true);
    expect(f.vm.open).toBe(true);
    await key(f.control, 'Escape');
    expect(f.vm.open).toBe(false);
  });

  it('navigates around disabled options and commits with Enter', async () => {
    const f = await selectFixture();
    await key(f.control, 'ArrowDown');
    expect(f.vm.menu.list?.activeItem).toBe(options[0]);
    await key(document.querySelector<HTMLElement>('ui-list')!, 'ArrowDown');
    expect(f.vm.menu.list?.activeItem).toBe(options[2]);
    await key(document.querySelector<HTMLElement>('ui-list')!, 'Enter');
    expect(f.component.value).toBe(2);
  });

  it('opens at the last item with ArrowUp and supports printable-key typeahead', async () => {
    const f = await selectFixture();
    await key(f.control, 'ArrowUp');
    expect(f.vm.menu.list?.activeItem).toBe(options[3]);
    await key(f.control, 'Escape');
    await key(f.control, 'b');
    expect(f.vm.menu.list?.activeItem).toBe(options[2]);
  });

  it('ignores disabled list options', async () => {
    const f = await selectFixture();
    f.control.click();
    await settle();
    rows()[1].click();
    await settle();
    expect(f.component.value).toBeUndefined();
    expect(f.vm.open).toBe(true);
  });

  it.each(['disabled', 'readonly'])('blocks mouse and keyboard opening when %s', async attribute => {
    const f = await selectFixture(attribute);
    f.control.click();
    await key(f.control, 'ArrowDown');
    await key(f.control, 'Enter');
    await key(f.control, 'b');
    expect(f.vm.open).toBe(false);
    expect(f.component.value).toBeUndefined();
    if (attribute === 'disabled') {
      expect(f.control.tabIndex).toBe(-1);
      expect(f.control.getAttribute('aria-disabled')).toBe('true');
    }
  });

  it('clears static object selections when the external value changes or resets', async () => {
    const f = createFixture(`<ui-select value.bind="value" value-field="id" label-field="name">
      <ui-list><ui-list-item value.bind="option">Alpha</ui-list-item></ui-list>
    </ui-select>`, { value: undefined as unknown, option: options[0] }, registrations);
    await f.started;
    const vm = CustomElement.for<UiSelect>(f.getBy('.ui-select')!).viewModel;
    f.getBy<HTMLElement>('.ui-select__control')!.click();
    await settle();
    rows()[0].click();
    await settle();
    expect(vm.displayText).toBe('Alpha');
    f.component.value = 99;
    await settle();
    expect(vm.selectedItem).toBeUndefined();
    expect(vm.displayText).toBeUndefined();
    f.component.value = null;
    await settle();
    expect(vm.hasValue).toBe(false);
  });

  it.each(['function', 'registered'])('renders raw values with a %s label converter', async kind => {
    const converter = (value: unknown) => `Role ${value}`;
    const RoleLabel = ValueConverter.define('roleLabel', class { toView = converter; });
    const f = createFixture(`<ui-select items.bind="items" value.bind="value" multiple label-converter.bind="converter"></ui-select>`,
      { items: [0, 2], value: [0, 2], converter: kind === 'function' ? converter : 'roleLabel' },
      [...registrations, RoleLabel]);
    await f.started;
    f.assertText('.ui-select__value', 'Role 0; Role 2', { compact: true });
  });
});
