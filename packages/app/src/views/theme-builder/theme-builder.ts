import { resolve } from 'aurelia';
import { buildCssVars, ThemeController } from './theme-controller';

export class ThemeBuilder {
  private readonly theme = resolve(ThemeController);
  copied = false;
  private copiedTimer: ReturnType<typeof setTimeout> | undefined;

  get primary(): string {
    return this.theme.tokens.primary;
  }
  set primary(value: string) {
    this.theme.setToken('primary', value);
  }

  get ink(): string {
    return this.theme.tokens.ink;
  }
  set ink(value: string) {
    this.theme.setToken('ink', value);
  }

  get canvas(): string {
    return this.theme.tokens.canvas;
  }
  set canvas(value: string) {
    this.theme.setToken('canvas', value);
  }

  get card(): string {
    return this.theme.tokens.card;
  }
  set card(value: string) {
    this.theme.setToken('card', value);
  }

  get cardBorder(): string {
    return this.theme.tokens.cardBorder;
  }
  set cardBorder(value: string) {
    this.theme.setToken('cardBorder', value);
  }

  get radius(): number {
    return this.theme.tokens.radius;
  }
  set radius(value: number) {
    this.theme.setToken('radius', Number(value));
  }

  get generatedCss(): string {
    const vars = buildCssVars(this.theme.tokens);
    const body = Object.entries(vars)
      .map(([name, value]) => `  ${name}: ${value};`)
      .join('\n');
    return `:root {\n${body}\n}`;
  }

  attached(): void {
    // Reflect the built theme immediately so the page previews it live.
    if (this.theme.mode !== 'custom') {
      this.theme.mode = 'custom';
    }
  }

  resetToLight(): void {
    this.theme.resetToLight();
  }

  async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.generatedCss);
      this.copied = true;
      clearTimeout(this.copiedTimer);
      this.copiedTimer = setTimeout(() => {
        this.copied = false;
      }, 1500);
    } catch {
      // Clipboard unavailable; ignore.
    }
  }
}
