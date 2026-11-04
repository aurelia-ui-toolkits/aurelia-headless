import { createFixture } from '@aurelia/testing';
import { CustomElement } from 'aurelia';
import { describe, expect, it, vi } from 'vitest';
import { UiList } from '../src/list/ui-list';
import { UiListItem } from '../src/list/ui-list-item';
import { key, registrations, settle } from './fixture';

async function listFixture<T extends object = object>(attributes = '', state = {} as T) {
  const f = createFixture(`<ui-list ${attributes}>
    <ui-list-item value.bind="undefined">Clear</ui-list-item>
    <ui-list-item value="a">A</ui-list-item>
    <ui-list-item value="b">B</ui-list-item>
  </ui-list>`, state, registrations);
  await f.started;
  await settle();
  const host = f.getBy<HTMLElement>('ui-list')!;
  const vm = CustomElement.for<UiList>(host).viewModel;
  const rows = f.getAllBy<HTMLElement>('ui-list-item');
  const active = () => rows.findIndex(row => row.hasAttribute('data-active'));
  return { ...f, host, vm, rows, active };
}

describe('ui-list with an undefined-valued option', () => {
  it.each(['', 'items.bind="items"'])('navigates and loops with derived or merged items (%s)', async attributes => {
    const f = await listFixture(attributes, { items: ['a', 'b'] });
    const activated = vi.fn();
    f.host.addEventListener('list-activate', activated);
    expect(f.active()).toBe(-1);
    for (const index of [0, 1, 2, 0]) {
      await key(f.host, 'ArrowDown');
      expect(f.active()).toBe(index);
      expect(f.vm.activeItem).toBe([undefined, 'a', 'b'][index]);
    }
    expect((activated.mock.calls[0][0] as CustomEvent).detail).toBeUndefined();
    for (const index of [2, 1, 0]) {
      await key(f.host, 'ArrowUp');
      expect(f.active()).toBe(index);
    }
  });

  it('honors non-looping boundaries', async () => {
    const f = await listFixture('loop.bind="false"');
    for (const index of [0, 1, 2, 2]) {
      await key(f.host, 'ArrowDown');
      expect(f.active()).toBe(index);
    }
    for (const index of [1, 0, 0]) {
      await key(f.host, 'ArrowUp');
      expect(f.active()).toBe(index);
    }
  });

  it('supports Home, End and the public focus methods', async () => {
    const f = await listFixture();
    await key(f.host, 'End');
    expect(f.active()).toBe(2);
    await key(f.host, 'Home');
    expect(f.active()).toBe(0);
    f.vm.focusLast();
    await settle();
    expect(f.active()).toBe(2);
    f.vm.focusFirst();
    await settle();
    expect(f.active()).toBe(0);
    f.vm.selected = 'a';
    f.vm.focusSelected();
    await settle();
    expect(f.active()).toBe(1);
  });

  it('selects undefined with Enter and keeps no-active state distinct', async () => {
    const f = await listFixture('selected.bind="selected"', { selected: 'a' as unknown });
    const selected = vi.fn();
    f.host.addEventListener('list-select', selected);
    await key(f.host, 'Enter');
    expect(selected).not.toHaveBeenCalled();
    await key(f.host, 'ArrowDown');
    await key(f.host, 'Enter');
    expect(selected).toHaveBeenCalledTimes(1);
    expect((selected.mock.calls[0][0] as CustomEvent).detail).toBeUndefined();
    expect(f.component.selected).toBeUndefined();
    for (const clear of [() => f.vm.clearActive(), () => f.vm.onMouseLeave()]) {
      clear();
      await key(f.host, 'Enter');
      expect(f.active()).toBe(-1);
      expect(selected).toHaveBeenCalledTimes(1);
      await key(f.host, 'ArrowDown');
      expect(f.active()).toBe(0);
    }
  });

  it('finds the undefined option by its rendered label with typeahead', async () => {
    const f = await listFixture();
    await key(f.host, 'End');
    await key(f.host, 'c');
    expect(f.active()).toBe(0);
    await key(f.host, 'ArrowDown');
    expect(f.active()).toBe(1);
  });

  it('re-anchors an active undefined value after rendered rows are replaced', async () => {
    const f = createFixture(`<ui-list items.bind="items">
      <ui-list-item repeat.for="row of rows" value.bind="row.value" textcontent.bind="row.label"></ui-list-item>
    </ui-list>`, { items: [undefined, 'a'], rows: [{ value: undefined as unknown, label: 'Clear' }, { value: 'a', label: 'A' }] }, registrations);
    await f.started;
    await settle();
    const host = f.getBy<HTMLElement>('ui-list')!;
    await key(host, 'Home');
    f.component.rows = [];
    await settle();
    f.component.rows = [{ value: undefined, label: 'Reset' }, { value: 'a', label: 'A' }];
    await settle();
    expect(f.getAllBy('ui-list-item')[0].hasAttribute('data-active')).toBe(true);
    await key(host, 'ArrowDown');
    expect(f.getAllBy('ui-list-item')[1].hasAttribute('data-active')).toBe(true);
  });

  it('skips disabled rows and activates undefined non-selectable actions', async () => {
    const f = await listFixture();
    CustomElement.for<UiListItem>(f.rows[1]).viewModel.disabled = true;
    await key(f.host, 'Home');
    await key(f.host, 'ArrowDown');
    expect(f.active()).toBe(2);
    await key(f.host, 'ArrowDown');
    expect(f.active()).toBe(0);
    CustomElement.for<UiListItem>(f.rows[0]).viewModel.nonSelectable = true;
    const action = vi.fn();
    const selected = vi.fn();
    f.host.addEventListener('list-action', action);
    f.host.addEventListener('list-select', selected);
    await key(f.host, 'Enter');
    expect(action).toHaveBeenCalledTimes(1);
    expect(selected).not.toHaveBeenCalled();
  });

  it('leaves an all-disabled list inactive', async () => {
    const f = await listFixture();
    for (const row of f.rows) {
      CustomElement.for<UiListItem>(row).viewModel.disabled = true;
    }
    const activated = vi.fn();
    f.host.addEventListener('list-activate', activated);
    for (const name of ['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', 'c']) {
      await key(f.host, name);
      expect(f.active()).toBe(-1);
    }
    expect(activated).not.toHaveBeenCalled();
  });

  it('activates bound undefined values even while their row is not rendered', async () => {
    const f = createFixture('<ui-list items.bind="items"></ui-list>', { items: [undefined, 'a'] }, registrations);
    await f.started;
    const host = f.getBy<HTMLElement>('ui-list')!;
    const activated = vi.fn();
    host.addEventListener('list-activate', activated);
    await key(host, 'ArrowDown');
    expect(activated).toHaveBeenCalledTimes(1);
    expect((activated.mock.calls[0][0] as CustomEvent).detail).toBeUndefined();
    await key(host, 'ArrowDown');
    expect(CustomElement.for<UiList>(host).viewModel.activeItem).toBe('a');
  });

  it('keeps an empty list inactive when focused', async () => {
    const f = createFixture('<ui-list></ui-list>', {}, registrations);
    await f.started;
    const host = f.getBy<HTMLElement>('ui-list')!;
    const vm = CustomElement.for<UiList>(host).viewModel;
    const activated = vi.fn();
    host.addEventListener('list-activate', activated);
    vm.focusFirst();
    vm.focusLast();
    await key(host, 'Enter');
    expect(vm.activeListItem).toBeUndefined();
    expect(activated).not.toHaveBeenCalled();
  });
});

describe('ui-list recycled rows', () => {
  it.each([undefined, 'a'])('keeps the active value %s when its row is reused and restores its highlight on return', async active => {
    const f = createFixture(`<ui-list items.bind="items">
      <ui-list-item repeat.for="row of rows" value.bind="row.value">Row</ui-list-item>
    </ui-list>`, { items: [active, 'b', 'c'], rows: [{ value: active as unknown }, { value: 'b' as unknown }] }, registrations);
    await f.started;
    await settle();
    const host = f.getBy<HTMLElement>('ui-list')!;
    const vm = CustomElement.for<UiList>(host).viewModel;
    const rows = f.getAllBy<HTMLElement>('ui-list-item');
    await key(host, 'Home');
    expect(rows[0].hasAttribute('data-active')).toBe(true);
    const activated = vi.fn();
    host.addEventListener('list-activate', activated);

    // Virtual repeat rebinds existing row instances without replacing their DOM nodes.
    f.component.rows[0].value = 'c';
    await settle();
    expect(f.getAllBy('ui-list-item')).toEqual(rows);
    expect(vm.activeItem).toBe(active);
    expect(vm.activeListItem).toBeUndefined();
    expect(rows.some(row => row.hasAttribute('data-active'))).toBe(false);

    f.component.rows[1].value = active;
    await settle();
    expect(vm.activeItem).toBe(active);
    expect(vm.activeListItem).toBe(CustomElement.for<UiListItem>(rows[1]).viewModel);
    expect(rows[0].hasAttribute('data-active')).toBe(false);
    expect(rows[1].hasAttribute('data-active')).toBe(true);
    expect(activated).not.toHaveBeenCalled();

    const selected = vi.fn();
    host.addEventListener('list-select', selected);
    await key(host, 'Enter');
    expect(selected).toHaveBeenCalledTimes(1);
    expect((selected.mock.calls[0][0] as CustomEvent).detail).toBe(active);
    await key(host, 'ArrowDown');
    expect(vm.activeItem).toBe('b');
  });

  it.each([undefined, 'a'])('moves the highlight when active value %s is rebound to another row in the same update', async active => {
    const f = createFixture(`<ui-list items.bind="items">
      <ui-list-item value.bind="first">First</ui-list-item>
      <ui-list-item value.bind="second">Second</ui-list-item>
    </ui-list>`, { items: [active, 'b'], first: active as unknown, second: 'b' as unknown }, registrations);
    await f.started;
    await settle();
    const host = f.getBy<HTMLElement>('ui-list')!;
    await key(host, 'Home');
    f.component.second = active;
    f.component.first = 'b';
    await settle();
    const rows = f.getAllBy<HTMLElement>('ui-list-item');
    expect(rows[0].hasAttribute('data-active')).toBe(false);
    expect(rows[1].hasAttribute('data-active')).toBe(true);

    CustomElement.for<UiList>(host).viewModel.clearActive();
    f.component.first = active;
    await settle();
    expect(rows.some(row => row.hasAttribute('data-active'))).toBe(false);
  });

  it('preserves the hovered duplicate row when another row is rebound', async () => {
    const f = createFixture(`<ui-list items.bind="items">
      <ui-list-item value="a">First A</ui-list-item>
      <ui-list-item value="a">Second A</ui-list-item>
      <ui-list-item value.bind="last">Last</ui-list-item>
    </ui-list>`, { items: ['a', 'b', 'c'], last: 'b' }, registrations);
    await f.started;
    await settle();
    const rows = f.getAllBy<HTMLElement>('ui-list-item');
    rows[1].dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    await settle();
    f.component.last = 'c';
    await settle();
    expect(rows[0].hasAttribute('data-active')).toBe(false);
    expect(rows[1].hasAttribute('data-active')).toBe(true);
    expect(rows[2].hasAttribute('data-active')).toBe(false);
  });
});
