import { observable } from 'aurelia';
import { onPrimaryFor } from './color-utils';

export type ThemeMode = 'light' | 'dark' | 'custom';

export interface ThemeTokens {
  primary: string;
  ink: string;
  canvas: string;
  card: string;
  cardBorder: string;
  radius: number;
}

export const DEFAULT_TOKENS: ThemeTokens = {
  primary: '#0072c6',
  ink: '#212121',
  canvas: '#ffffff',
  card: '#ffffff',
  cardBorder: '#bdbdbd',
  radius: 10
};

const MODE_KEY = 'aurelia-headless:theme';
const TOKENS_KEY = 'aurelia-headless:custom-theme';
const MODES: ThemeMode[] = ['light', 'dark', 'custom'];

function mixBlack(color: string, pct: number): string {
  return `color-mix(in srgb, ${color} ${pct}%, black)`;
}

function mixWhite(color: string, pct: number): string {
  return `color-mix(in srgb, ${color} ${pct}%, white)`;
}

/**
 * Builds the full set of CSS custom properties from the curated token set.
 * The same map drives both the live preview and the copyable export, so what
 * the user sees is byte-identical to what they paste.
 */
export function buildCssVars(tokens: ThemeTokens): Record<string, string> {
  const radius = `${tokens.radius}px`;
  return {
    '--color-primary-600': tokens.primary,
    '--color-primary-700': mixBlack(tokens.primary, 82),
    '--color-primary-800': mixBlack(tokens.primary, 65),
    '--color-ring': mixWhite(tokens.primary, 45),
    '--color-selected': tokens.primary,
    '--color-selected-hover': mixBlack(tokens.primary, 82),
    '--color-on-primary': onPrimaryFor(tokens.primary),
    '--color-ink-900': tokens.ink,
    '--color-ink-700': mixWhite(tokens.ink, 80),
    '--color-ink-500': mixWhite(tokens.ink, 62),
    '--color-canvas': tokens.canvas,
    '--color-card': tokens.card,
    '--color-card-muted': `color-mix(in srgb, ${tokens.card} 94%, ${tokens.ink})`,
    '--color-card-border': tokens.cardBorder,
    '--ui-button-radius': radius,
    '--ui-field-radius': radius,
    '--ui-list-radius': radius,
    '--ui-list-item-radius': radius,
    '--ui-table-radius': radius,
    '--ui-tree-radius': radius,
    '--ui-chip-radius': radius
  };
}

/**
 * Single source of truth for the demo's colour mode. Light and Dark are the
 * pristine shipped presets; Custom applies the builder's token set inline on
 * <html> so it can never collide with the dark preset's own overrides.
 */
export class ThemeController {
  private initialised = false;
  tokens: ThemeTokens = this.loadTokens();

  @observable
  mode: ThemeMode = this.loadMode();
  modeChanged(): void {
    if (!this.initialised) {
      return;
    }
    this.apply();
    this.persistMode();
  }

  constructor() {
    this.apply();
    this.initialised = true;
  }

  /** Update a single curated token and switch into (or stay in) Custom mode. */
  setToken<K extends keyof ThemeTokens>(key: K, value: ThemeTokens[K]): void {
    this.tokens = { ...this.tokens, [key]: value };
    this.persistTokens();
    if (this.mode === 'custom') {
      this.apply();
    } else {
      this.mode = 'custom';
    }
  }

  /** Reseed the custom set from the default light theme (a clean baseline). */
  resetToLight(): void {
    this.tokens = { ...DEFAULT_TOKENS };
    this.persistTokens();
    if (this.mode === 'custom') {
      this.apply();
    } else {
      this.mode = 'custom';
    }
  }

  private apply(): void {
    const root = document.documentElement;
    const vars = buildCssVars(this.tokens);
    if (this.mode === 'custom') {
      root.dataset.theme = 'light';
      for (const [name, value] of Object.entries(vars)) {
        root.style.setProperty(name, value);
      }
    } else {
      root.dataset.theme = this.mode;
      for (const name of Object.keys(vars)) {
        root.style.removeProperty(name);
      }
    }
  }

  private persistMode(): void {
    try {
      localStorage.setItem(MODE_KEY, this.mode);
    } catch {
      // Ignore unavailable storage.
    }
  }

  private persistTokens(): void {
    try {
      localStorage.setItem(TOKENS_KEY, JSON.stringify(this.tokens));
    } catch {
      // Ignore unavailable storage.
    }
  }

  private loadMode(): ThemeMode {
    try {
      const stored = localStorage.getItem(MODE_KEY);
      if (stored && MODES.includes(stored as ThemeMode)) {
        return stored as ThemeMode;
      }
    } catch {
      // Ignore unavailable storage.
    }
    return globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  private loadTokens(): ThemeTokens {
    try {
      const stored = localStorage.getItem(TOKENS_KEY);
      if (stored) {
        return { ...DEFAULT_TOKENS, ...(JSON.parse(stored) as Partial<ThemeTokens>) };
      }
    } catch {
      // Ignore unavailable or malformed storage.
    }
    return { ...DEFAULT_TOKENS };
  }
}
