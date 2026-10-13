import { describe, expect, it, vi } from 'vitest';
import { key, settle, type } from './fixture';
import { dispatch, mount, UI, viewModel } from './library-fixture';

describe('form controls', () => {
  it.each([false, true])('ui-input synchronizes native input and host value (textarea=%s)', async textarea => {
    const f = await mount(`<ui-input ${textarea ? 'textarea rows="4"' : ''} label="Name" required maxlength="20" helper-text="Hint" value.two-way="value"></ui-input>`, { value: 'Initial' });
    const host = f.getBy('.ui-input')!;
    const vm = viewModel<UI.UiInput>(host);
    expect(vm.inputEl.value).toBe('Initial');
    await type(vm.inputEl as HTMLInputElement, 'Edited');
    expect(f.component.value).toBe('Edited');
    f.component.value = 'External';
    await settle();
    expect(vm.inputEl.value).toBe('External');
    expect(vm.inputEl.required).toBe(true);
    expect(vm.inputEl.maxLength).toBe(20);
    vm.addError({ message: 'Invalid name' });
    vm.addError({ message: 'Invalid name' });
    await settle();
    expect(vm.errors.size).toBe(1);
    expect(vm.inputEl.getAttribute('aria-invalid')).toBe('true');
    vm.removeError({ message: 'Invalid name' });
    await settle();
    expect(vm.inputEl.getAttribute('aria-invalid')).toBe('false');
  });

  it('ui-checkbox recognizes bare-text labels, clears indeterminate and updates checked', async () => {
    const f = await mount('<ui-checkbox checked.bind="checked" indeterminate.bind="mixed">Accept</ui-checkbox>', { checked: false, mixed: true });
    const host = f.getBy<HTMLElement>('ui-checkbox')!;
    const vm = viewModel<UI.UiCheckbox>(host);
    expect(vm.hasLabel).toBe(true);
    expect(vm.controlEl.indeterminate).toBe(true);
    f.getBy<HTMLElement>('[role="checkbox"]')!.click();
    await settle();
    expect(f.component.checked).toBe(true);
    expect(f.component.mixed).toBe(false);
    expect(vm.controlEl.checked).toBe(true);
    vm.controlEl.click();
    await settle();
    expect(f.component.checked).toBe(false);
  });

  it.each(['ui-checkbox', 'ui-switch'])('%s toggles on Space, emits input/change and blocks disabled interaction', async tag => {
    const f = await mount(`<${tag} checked.bind="checked" disabled.bind="disabled"></${tag}>`, { checked: false, disabled: false });
    const host = f.getBy<HTMLElement>(tag)!;
    const input = vi.fn();
    const change = vi.fn();
    host.addEventListener('input', input);
    host.addEventListener('change', change);
    const target = tag === 'ui-checkbox' ? f.getBy<HTMLElement>('input')! : host;
    target.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', bubbles: true, cancelable: true }));
    await settle();
    expect(f.component.checked).toBe(true);
    expect(input).toHaveBeenCalledTimes(1);
    expect(change).toHaveBeenCalledTimes(1);
    f.component.disabled = true;
    await settle();
    host.click();
    target.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', bubbles: true }));
    await settle();
    expect(f.component.checked).toBe(true);
    expect(change).toHaveBeenCalledTimes(1);
  });

  it('ui-radio/group navigates around disabled radios and commits only on activation', async () => {
    const f = await mount('<ui-radio-group value.bind="value" label="Choice"><ui-radio value="a">A</ui-radio><ui-radio value="b" disabled>B</ui-radio><ui-radio value="c">C</ui-radio></ui-radio-group>', { value: 'a' });
    const radios = f.getAllBy<HTMLElement>('ui-radio');
    radios[0].focus();
    await key(radios[0], 'ArrowDown');
    expect(document.activeElement).toBe(radios[2]);
    expect(f.component.value).toBe('a');
    await key(radios[2], ' ');
    expect(f.component.value).toBe('c');
    expect(radios[2].getAttribute('aria-checked')).toBe('true');
    radios[1].click();
    await settle();
    expect(f.component.value).toBe('c');
    const group = viewModel<UI.UiRadioGroup>(f.getBy('ui-radio-group')!);
    group.readonly = true;
    await settle();
    radios[0].click();
    await settle();
    expect(f.component.value).toBe('c');
  });

  it('ui-slider clamps bounds and reflects external values without clobbering endValue in single mode', async () => {
    const f = await mount('<ui-slider value.bind="value" end-value.bind="end" min="10" max="50" label="Volume"></ui-slider>', { value: 100, end: 35 });
    expect(f.component.value).toBe(50);
    expect(f.component.end).toBe(35);
    const vm = viewModel<UI.UiSlider>(f.getBy('ui-slider')!);
    f.component.value = -1;
    await settle();
    expect(f.component.value).toBe(10);
    expect(vm.inputEl.value).toBe('10');
    vm.inputEl.value = '30';
    vm.inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    await settle();
    expect(f.component.value).toBe(30);
    expect(vm.fillStyle).toContain('50%');
    vm.readonly = true;
    await settle();
    expect((await key(vm.inputEl, 'ArrowRight')).defaultPrevented).toBe(true);
  });

  it('ui-slider prevents range handles from crossing', async () => {
    const f = await mount('<ui-slider range value.bind="value" end-value.bind="end"></ui-slider>', { value: 20, end: 60 });
    const vm = viewModel<UI.UiSlider>(f.getBy('ui-slider')!);
    vm.inputEl.value = '80';
    vm.inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    await settle();
    expect(f.component.value).toBe(60);
    vm.endInputEl.value = '10';
    vm.endInputEl.dispatchEvent(new Event('change', { bubbles: true }));
    await settle();
    expect(f.component.end).toBe(60);
  });

  it('ui-validation-container renders current errors and restores valid state', async () => {
    const f = await mount('<ui-validation-container>Field</ui-validation-container>', {});
    const vm = viewModel<UI.UiValidationContainer>(f.getBy('ui-validation-container')!);
    const error = { message: 'Required' };
    vm.addError(error);
    vm.addError({ message: undefined });
    await settle();
    expect(vm.valid).toBe(false);
    expect(vm.errorMessages).toEqual(['Required']);
    f.assertTextContain('ui-validation-container', 'Required');
    vm.removeError(error);
    for (const remaining of vm.errors.keys()) vm.removeError(remaining);
    await settle();
    expect(vm.valid).toBe(true);
    expect(vm.errorMessages).toEqual([]);
  });

  it('ui-tabs/ui-tab selects the first enabled tab, navigates and retains a fallback Tab stop', async () => {
    const f = await mount('<ui-tabs value.bind="value"><ui-tab value="a" disabled>A</ui-tab><ui-tab value="b">B</ui-tab><ui-tab value="c">C</ui-tab></ui-tabs>', { value: undefined as unknown });
    const tabs = f.getAllBy<HTMLElement>('.ui-tab');
    expect(f.component.value).toBe('b');
    expect(tabs.map(tab => tab.tabIndex)).toEqual([-1, 0, -1]);
    tabs[1].focus();
    await key(tabs[1], 'ArrowRight');
    expect(f.component.value).toBe('c');
    expect(document.activeElement).toBe(tabs[2]);
    await key(tabs[2], 'Home');
    expect(f.component.value).toBe('b');
    f.component.value = 'missing';
    await settle();
    expect(tabs.map(tab => tab.tabIndex)).toEqual([-1, 0, -1]);
  });

  it('ui-segmented-control/ui-segment separates navigation from selection and blocks readonly changes', async () => {
    const f = await mount('<ui-segmented-control value.bind="value" readonly.bind="readonly"><ui-segment value="a">A</ui-segment><ui-segment value="b" disabled>B</ui-segment><ui-segment value="c">C</ui-segment></ui-segmented-control>', { value: undefined as unknown, readonly: false });
    const segments = f.getAllBy<HTMLElement>('ui-segment');
    expect(f.component.value).toBe('a');
    segments[0].focus();
    await key(segments[0], 'ArrowRight');
    expect(document.activeElement).toBe(segments[2]);
    expect(f.component.value).toBe('a');
    await key(segments[2], 'Enter');
    expect(f.component.value).toBe('c');
    f.component.readonly = true;
    await settle();
    dispatch(segments[0], 'click');
    await key(segments[0], ' ');
    expect(f.component.value).toBe('c');
  });

  it('ui-tabs recognizes tabs hosted with as-element and preserves an explicit initial value', async () => {
    const f = await mount('<ui-tabs value.bind="value"><a as-element="ui-tab" value="a">A</a><a as-element="ui-tab" value="b">B</a></ui-tabs>', { value: 'b' });
    const tabs = f.getAllBy<HTMLElement>('.ui-tab');
    expect(f.component.value).toBe('b');
    expect(tabs.map(tab => tab.tabIndex)).toEqual([-1, 0]);
    tabs[0].click();
    await settle();
    expect(f.component.value).toBe('a');
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
  });
});
