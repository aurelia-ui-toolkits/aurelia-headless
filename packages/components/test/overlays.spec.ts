import { CustomAttribute } from 'aurelia';
import { describe, expect, it, vi } from 'vitest';
import { key, settle } from './fixture';
import { dispatch, mount, UI, viewModel } from './library-fixture';

describe('ui-popup and ui-menu', () => {
  it('ui-popup closes outside/on Escape, ignores inside clicks and restores focus', async () => {
    const f = await mount('<button ref="anchor">Open</button><ui-popup anchor.bind="anchor" open.bind="open"><button>Inside</button></ui-popup>', { anchor: undefined as HTMLElement | undefined, open: false });
    const anchor = f.getAllBy<HTMLButtonElement>('button')[0];
    anchor.focus();
    f.component.open = true;
    await settle();
    const vm = viewModel<UI.UiPopup>(f.getBy('ui-popup')!);
    dispatch(vm.panelElement!, 'pointerdown');
    await settle();
    expect(f.component.open).toBe(true);
    await key(vm.panelElement!, 'Escape');
    expect(f.component.open).toBe(false);
    expect(document.activeElement).toBe(anchor);
    f.component.open = true;
    await settle();
    dispatch(document.body, 'pointerdown');
    await settle();
    expect(f.component.open).toBe(false);
  });

  it('ui-menu emits selection and honors close-on-select=false', async () => {
    const f = await mount('<ui-menu open.bind="open" close-on-select.bind="close"><ui-list><ui-list-item value="a">A</ui-list-item></ui-list></ui-menu>', { open: true, close: false });
    const selected = vi.fn();
    f.appHost.addEventListener('menu-select', selected);
    document.querySelector<HTMLElement>('ui-list-item')!.click();
    await settle();
    expect((selected.mock.calls[0][0] as CustomEvent).detail).toBe('a');
    expect(f.component.open).toBe(true);
    f.component.close = true;
    await settle();
    document.querySelector<HTMLElement>('ui-list-item')!.click();
    await settle();
    expect(f.component.open).toBe(false);
  });

  it('ui-context-menu filters targets and places its anchor at MouseEvent coordinates', async () => {
    const f = await mount('<div id="area" ui-context-menu="value.bind: menu; filter: .allowed"><span class="allowed">Allowed</span><span class="blocked">Blocked</span></div><ui-menu component.ref="menu"><ui-list><ui-list-item>A</ui-list-item></ui-list></ui-menu>', { menu: undefined as UI.UiMenu | undefined });
    const allowed = f.getBy('.allowed')!;
    const blocked = f.getBy('.blocked')!;
    dispatch(blocked, 'contextmenu', { clientX: 10, clientY: 20 });
    await settle();
    expect(f.component.menu!.open).toBe(false);
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 45, clientY: 60 });
    allowed.dispatchEvent(event);
    await settle();
    expect(event.defaultPrevented).toBe(true);
    expect(f.component.menu!.open).toBe(true);
    expect(f.component.menu!.anchor!.getAttribute('style')).toContain('left: 45px');
  });
});

describe('ui-drawer and ui-focus-trap', () => {
  it('ui-drawer traps focus, emits closure and restores its trigger', async () => {
    const f = await mount('<button ref="trigger">Open</button><ui-drawer open.bind="open" trigger.bind="trigger" label="Settings"><button id="first">First</button><button id="last">Last</button></ui-drawer>', { open: false, trigger: undefined as HTMLElement | undefined });
    f.component.trigger!.focus();
    const closed = vi.fn();
    f.appHost.addEventListener('drawer-close', closed);
    f.component.open = true;
    await settle();
    const first = document.querySelector<HTMLElement>('#first')!;
    const last = document.querySelector<HTMLElement>('#last')!;
    expect(document.activeElement).toBe(first);
    await key(first, 'Tab', { shiftKey: true });
    expect(document.activeElement).toBe(last);
    await key(last, 'Tab');
    expect(document.activeElement).toBe(first);
    await key(first, 'Escape');
    expect(f.component.open).toBe(false);
    expect(closed).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(f.component.trigger);
  });

  it('ui-drawer persistent mode ignores global dismissal', async () => {
    const f = await mount('<ui-drawer persistent open.bind="open"><button>Inside</button></ui-drawer>', { open: true });
    await key(document.body, 'Escape');
    dispatch(document.body, 'pointerdown');
    await settle();
    expect(f.component.open).toBe(true);
    expect(f.getBy('[role="dialog"]')!.hasAttribute('aria-modal')).toBe(false);
  });

  it('ui-focus-trap wraps Tab and releases focus/listeners during teardown', async () => {
    const f = await mount('<button id="outside">Outside</button><div id="trap" ui-focus-trap><button id="first">First</button><button id="last">Last</button></div>', {});
    const host = f.getBy<HTMLElement>('#trap')!;
    const first = f.getBy<HTMLElement>('#first')!;
    const last = f.getBy<HTMLElement>('#last')!;
    // The focus trap excludes elements without a rendered box. Supply that browser fact.
    for (const el of [first, last]) Object.defineProperty(el, 'offsetParent', { get: () => host });
    const trap = CustomAttribute.for<UI.UiFocusTrap>(host, 'ui-focus-trap')!.viewModel;
    f.getBy<HTMLElement>('#outside')!.focus();
    trap.trapFocus();
    expect(document.activeElement).toBe(first);
    await key(first, 'Tab', { shiftKey: true });
    expect(document.activeElement).toBe(last);
    await key(last, 'Tab');
    expect(document.activeElement).toBe(first);
    trap.releaseFocus();
    expect(document.activeElement).toBe(f.getBy('#outside'));
    trap.trapFocus();
    await f.stop(true);
    expect((await key(document.body, 'Tab')).defaultPrevented).toBe(false);
  });
});
