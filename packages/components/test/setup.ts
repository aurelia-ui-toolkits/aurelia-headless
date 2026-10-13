import { BrowserPlatform } from '@aurelia/platform-browser';
import { onFixtureCreated, setPlatform, type IFixture } from '@aurelia/testing';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';

const fixtures: IFixture<object>[] = [];
let tracking: { dispose(): void };

// Inputmask reads matchMedia at module load, before fixture lifecycle hooks run.
vi.stubGlobal('matchMedia', (query: string) => ({
  matches: false, media: query, onchange: null,
  addListener() {}, removeListener() {},
  addEventListener() {}, removeEventListener() {}, dispatchEvent() { return true; },
}));

beforeAll(() => {
  const platform = new BrowserPlatform(window);
  setPlatform(platform);
  BrowserPlatform.set(globalThis, platform);
  tracking = onFixtureCreated(fixture => { fixtures.push(fixture); });
  // jsdom has no layout engine. Popup positioning is outside these interaction tests.
  vi.stubGlobal('ResizeObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
  // These methods depend on browser layout and are absent in jsdom.
  HTMLElement.prototype.scrollIntoView = () => {};
  HTMLElement.prototype.scrollTo = () => {};
  HTMLElement.prototype.showPopover = () => {};
  HTMLElement.prototype.hidePopover = () => {};
});

afterEach(async () => {
  const results = await Promise.allSettled(
    fixtures.splice(0).filter(fixture => !fixture.torn).map(fixture => fixture.stop(true)),
  );
  vi.restoreAllMocks();
  const errors = results.flatMap(result => result.status === 'rejected' ? [result.reason] : []);
  if (errors.length) throw new AggregateError(errors, 'Fixture cleanup failed');
});

afterAll(() => {
  tracking.dispose();
  vi.unstubAllGlobals();
});
