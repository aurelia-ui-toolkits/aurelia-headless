import { describe, expect, it, vi } from 'vitest';
import { key, settle } from './fixture';
import { dispatch, mount, UI, viewModel } from './library-fixture';

describe('presentation and action components', () => {
  it.each(['ui-button', 'ui-icon-button'])('%s uses a native button and blocks disabled activation', async tag => {
    const f = await mount(`<${tag} disabled.bind="disabled" click.trigger="click()">Action</${tag}>`, { disabled: false, click: vi.fn() });
    const button = f.getBy<HTMLButtonElement>('button')!;
    expect(button.type).toBe('button');
    button.click();
    expect(f.component.click).toHaveBeenCalledTimes(1);
    dispatch(button, 'pointerdown');
    await settle();
    expect(button.hasAttribute('data-active')).toBe(true);
    dispatch(button, 'pointerup');
    f.component.disabled = true;
    await settle();
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    button.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(f.component.click).toHaveBeenCalledTimes(1);
    expect(button.tabIndex).toBe(-1);
    expect(button.getAttribute('aria-disabled')).toBe('true');
  });

  it('ui-alert renders content/actions and emits dismissal with a two-way open update', async () => {
    const f = await mount('<ui-alert open.bind="open" dismissible tone="danger" title="Problem">Details<button au-slot="actions">Retry</button></ui-alert>', { open: true });
    f.assertText('.ui-alert__title', 'Problem');
    f.assertText('.ui-alert__message', 'Details', { compact: true });
    f.assertText('.ui-alert__actions', 'Retry', { compact: true });
    const closed = vi.fn();
    f.appHost.addEventListener('alert-close', closed);
    f.getBy<HTMLButtonElement>('.ui-alert__close')!.click();
    await settle();
    expect(f.component.open).toBe(false);
    expect(closed).toHaveBeenCalledTimes(1);
    expect(window.getComputedStyle(f.getBy('.ui-alert')!).display).toBe('none');
  });

  it('ui-badge reflects tone, pill and outlined changes while projecting its label', async () => {
    const f = await mount('<ui-badge tone.bind="tone" pill.bind="pill" outlined>New</ui-badge>', { tone: 'success', pill: true });
    const badge = f.getBy('ui-badge')!;
    expect(badge.getAttribute('data-tone')).toBe('success');
    expect(badge.hasAttribute('data-pill')).toBe(true);
    expect(badge.hasAttribute('data-outlined')).toBe(true);
    f.assertText('ui-badge', 'New', { compact: true });
    f.component.pill = false;
    await settle();
    expect(badge.hasAttribute('data-pill')).toBe(false);
  });

  it('ui-breadcrumbs links ancestors and marks only the current page', async () => {
    const f = await mount('<ui-breadcrumbs items.bind="items"></ui-breadcrumbs>', { items: [
      { label: 'Home', href: '/' }, { label: 'Current', href: '/current', current: true },
    ] });
    expect(f.getAllBy('a')).toHaveLength(1);
    expect(f.getBy('a')!.getAttribute('href')).toBe('/');
    f.assertText('[aria-current="page"]', 'Current');
    expect(f.getBy('nav')!.getAttribute('aria-label')).toBe('Breadcrumb');
  });

  it('ui-chip separates selection from removal and ignores disabled keyboard actions', async () => {
    const f = await mount('<ui-chip selected.bind="selected" disabled.bind="disabled" removable value="tag">Tag</ui-chip>', { selected: false, disabled: false });
    const host = f.getBy<HTMLElement>('ui-chip')!;
    const selected = vi.fn();
    const removed = vi.fn();
    host.addEventListener('chip-select', selected);
    host.addEventListener('chip-remove', removed);
    await key(host, ' ');
    expect(f.component.selected).toBe(true);
    expect((selected.mock.calls[0][0] as CustomEvent).detail).toEqual({ selected: true, value: 'tag' });
    f.getBy<HTMLButtonElement>('.ui-chip__remove')!.click();
    expect(removed).toHaveBeenCalledTimes(1);
    expect(selected).toHaveBeenCalledTimes(1);
    await key(host, 'Delete');
    expect(removed).toHaveBeenCalledTimes(2);
    f.component.disabled = true;
    await settle();
    await key(host, 'Enter');
    await key(host, 'Delete');
    expect(selected).toHaveBeenCalledTimes(1);
    expect(removed).toHaveBeenCalledTimes(2);
  });

  it('ui-disclosure connects its header and hidden panel and toggles via click/keyboard', async () => {
    const f = await mount('<ui-disclosure open.bind="open"><span au-slot="header">More</span><span au-slot="content">Content</span></ui-disclosure>', { open: false });
    const header = f.getBy<HTMLElement>('[role="button"]')!;
    const panel = f.getBy<HTMLElement>('.ui-disclosure__content')!;
    expect(header.getAttribute('aria-controls')).toBe(panel.id);
    expect(panel.hidden).toBe(true);
    header.click();
    await settle();
    expect(f.component.open).toBe(true);
    expect(panel.hidden).toBe(false);
    await key(header, 'Enter');
    expect(f.component.open).toBe(false);
    expect(header.getAttribute('aria-expanded')).toBe('false');
  });

  it.each([undefined, -10, 25, 200, NaN])('ui-progress normalizes value %s and updates accessible progress', async value => {
    const f = await mount('<ui-progress value.bind="value" max="100" label="Upload"></ui-progress>', { value });
    const host = f.getBy('ui-progress')!;
    const indeterminate = value === undefined || Number.isNaN(value);
    expect(host.getAttribute('aria-valuenow')).toBe(indeterminate ? null : String(Math.max(0, Math.min(100, value!))));
    expect(host.hasAttribute('data-indeterminate')).toBe(indeterminate);
    expect(host.getAttribute('aria-label')).toBe('Upload');
    f.component.value = 100;
    await settle();
    expect(host.getAttribute('aria-valuenow')).toBe('100');
    expect(host.hasAttribute('data-active-determinate')).toBe(false);
  });

  it('ui-floating-actions expands multiple actions on toggle/hover and collapses on leave', async () => {
    const f = await mount('<ui-floating-actions><ui-icon-button>A</ui-icon-button><ui-icon-button>B</ui-icon-button></ui-floating-actions>', {});
    const host = f.getBy<HTMLElement>('ui-floating-actions')!;
    const vm = viewModel<UI.UiFloatingActions>(host);
    expect(vm.expanded).toBe(false);
    vm.toggle();
    await settle();
    expect(vm.expanded).toBe(true);
    dispatch(host, 'mouseleave');
    await settle();
    expect(vm.expanded).toBe(false);
    dispatch(host, 'mouseenter');
    await settle();
    expect(vm.expanded).toBe(true);
  });

  it('ui-top-app-bar projects named slots and reflects layout options', async () => {
    const f = await mount('<ui-top-app-bar sticky dense elevated><span au-slot="navigation">Menu</span><span au-slot="breadcrumbs">Path</span><span au-slot="actions">Save</span>Title</ui-top-app-bar>', {});
    const host = f.getBy('ui-top-app-bar')!;
    expect(host.hasAttribute('data-sticky')).toBe(true);
    expect(host.hasAttribute('data-dense')).toBe(true);
    f.assertTextContain('ui-top-app-bar', 'Menu');
    f.assertTextContain('ui-top-app-bar', 'Path');
    f.assertTextContain('ui-top-app-bar', 'Save');
    expect(viewModel<UI.UiTopAppBar>(host).navigationNodes).toHaveLength(1);
  });

  it('ui-form projects native fields and prevents browser form navigation', async () => {
    const f = await mount('<ui-form><input name="name"><button type="submit">Save</button></ui-form>', {});
    const event = new Event('submit', { bubbles: true, cancelable: true });
    f.getBy<HTMLFormElement>('form')!.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(f.getBy('ui-form input')!.getAttribute('name')).toBe('name');
  });
});
