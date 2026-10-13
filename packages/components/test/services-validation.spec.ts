import { IDialogService } from '@aurelia/dialog';
import { Registration } from 'aurelia';
import { describe, expect, it, vi } from 'vitest';
import { mount, UI } from './library-fixture';
import { UiValidationResultPresenter } from '../src/validation/ui-validation-result-presenter';
import type { ValidationEvent } from '@aurelia/validation-html';

describe('AlertService', () => {
  it('tracks overlapping work and always releases busy state on rejection', async () => {
    const f = await mount('<div></div>', {}, [Registration.instance(IDialogService, {})]);
    const service = f.container.get(UI.AlertService);
    try {
      let resolveFirst!: (value: string) => void;
      let resolveSecond!: (value: string) => void;
      const first = service.usingProgress(() => new Promise<string>(resolve => { resolveFirst = resolve; }));
      const second = service.usingProgress(() => new Promise<string>(resolve => { resolveSecond = resolve; }));
      expect(service.busy$.value).toBe(true);
      resolveFirst('first');
      expect(await first).toBe('first');
      expect(service.busy$.value).toBe(true);
      resolveSecond('second');
      expect(await second).toBe('second');
      expect(service.busy$.value).toBe(false);
      const error = new Error('Failed');
      await expect(service.usingProgress(async () => { throw error; })).rejects.toBe(error);
      expect(service.busy$.value).toBe(false);
      expect(await service.usingProgress(async () => { throw error; }, () => 'Recovered')).toBe('Recovered');
    } finally { service.busyAccumulator$.unsubscribe(); }
  });

  it('builds defensive confirmation payloads and interprets the chosen success action', async () => {
    const f = await mount('<div></div>', {}, [Registration.instance(IDialogService, {})]);
    const service = f.container.get(UI.AlertService);
    try {
      const show = vi.spyOn(service, 'showModal').mockResolvedValue('yes');
      expect(await service.confirm({ message: 'Delete?', defensive: true })).toBe(true);
      expect(show).toHaveBeenCalledWith(expect.objectContaining({ message: 'Delete?', defaultAction: 'no', successAction: 'yes', tone: 'warning' }));
      show.mockResolvedValue('no');
      expect(await service.confirm('Delete?')).toBe(false);
    } finally { service.busyAccumulator$.unsubscribe(); }
  });

  it('updates prompt data only after acceptance and tracks critical errors', async () => {
    const f = await mount('<div></div>', {}, [Registration.instance(IDialogService, {})]);
    const service = f.container.get(UI.AlertService);
    try {
      const open = vi.spyOn(service, 'open').mockResolvedValue('Updated');
      const data = { text: 'Original' };
      expect(await service.prompt(data)).toBe(true);
      expect(data.text).toBe('Updated');
      open.mockResolvedValue('cancel');
      expect(await service.prompt(data)).toBe(false);
      expect(data.text).toBe('Updated');
      const tracker = vi.spyOn(f.container.get<UI.ExceptionsTracker>(UI.ExceptionsTracker), 'track');
      vi.spyOn(service, 'error').mockResolvedValue(true);
      const error = new Error('Critical');
      await service.criticalError('Failed', error);
      expect(tracker).toHaveBeenCalledWith(error);
    } finally { service.busyAccumulator$.unsubscribe(); }
  });
});

describe('validation result presenter', () => {
  it('routes invalid added/removed results to supported elements and ignores valid/native targets', () => {
    const element = document.createElement('div');
    const addError = vi.fn();
    const removeError = vi.fn();
    Object.defineProperties(element, { addError: { value: addError }, removeError: { value: removeError } });
    const invalid = { valid: false, message: 'Required' };
    const valid = { valid: true, message: undefined };
    new UiValidationResultPresenter().handleValidationEvent({
      removedResults: [{ result: invalid, targets: [element] }],
      addedResults: [{ result: invalid, targets: [element, document.createElement('input')] }, { result: valid, targets: [element] }],
    } as unknown as ValidationEvent);
    expect(removeError).toHaveBeenCalledExactlyOnceWith(invalid);
    expect(addError).toHaveBeenCalledExactlyOnceWith(invalid);
  });
});
