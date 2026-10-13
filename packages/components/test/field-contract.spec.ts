import { describe, expect, it } from 'vitest';
import type { IUiSelectElement } from '../src/select/ui-select';
import type { IUiComboboxElement } from '../src/combobox/ui-combobox';
import { comboboxFixture, selectFixture, settle } from './fixture';

type FieldElement = (IUiSelectElement | IUiComboboxElement) & {
  disabled: boolean;
  readOnly: boolean;
  readonly isFocused: boolean;
};

for (const [name, build] of [['ui-select', selectFixture], ['ui-combobox', comboboxFixture]] as const) {
  describe(`${name} field contract`, () => {
    it('connects the accessible label and deduplicates validation errors by message', async () => {
      const f = await build('required');
      const host = f.host as FieldElement;
      const control = f.getBy<HTMLElement>('[aria-haspopup="listbox"]')!;
      const labelId = control.getAttribute('aria-labelledby');
      expect(labelId).toBeTruthy();
      expect(document.getElementById(labelId!)?.textContent).toBe('Project');
      expect(control.getAttribute('aria-invalid')).toBe('false');
      expect(name === 'ui-select' ? control.getAttribute('aria-required') === 'true' : (control as HTMLInputElement).required).toBe(true);

      host.addError({ message: 'Choose a project' });
      host.addError({ message: 'Choose a project' });
      await settle();
      expect(f.vm.errors.size).toBe(1);
      expect(host.hasAttribute('data-invalid')).toBe(true);
      expect(control.getAttribute('aria-invalid')).toBe('true');
      const errorsId = control.getAttribute('aria-describedby');
      expect(document.getElementById(errorsId!)?.textContent?.trim()).toBe('Choose a project');
      host.removeError({ message: 'Choose a project' });
      await settle();
      expect(control.getAttribute('aria-invalid')).toBe('false');
      expect(host.hasAttribute('data-invalid')).toBe(false);
    });

    it('exposes value, disabled, readOnly, focus and blur on the host element', async () => {
      const f = await build();
      const host = f.host as FieldElement;
      const control = f.getBy<HTMLElement>('[aria-haspopup="listbox"]')!;
      host.value = 2;
      await settle();
      expect(f.component.value).toBe(2);
      expect(host.value).toBe(2);
      host.focus();
      await settle();
      expect(document.activeElement).toBe(control);
      expect(host.isFocused).toBe(true);
      host.blur();
      await settle();
      expect(host.isFocused).toBe(false);
      host.disabled = true;
      host.readOnly = true;
      await settle();
      expect(f.vm.disabled).toBe(true);
      expect(f.vm.readonly).toBe(true);
    });
  });
}
