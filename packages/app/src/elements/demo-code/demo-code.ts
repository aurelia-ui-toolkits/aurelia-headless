import { bindable, customElement, INode, resolve } from 'aurelia';
import template from './demo-code.html?raw';

type DemoCodeLanguage = 'html' | 'ts';
type DemoCodeTheme = 'github-light' | 'github-dark-default';
type DemoCodeHighlighter = {
  codeToHtml(code: string, options: {
    lang: 'html' | 'typescript';
    theme: DemoCodeTheme;
    transformers: Array<{
      pre(this: { addClassToHast(node: unknown, className: string): void }, node: unknown): void;
      code(this: { addClassToHast(node: unknown, className: string): void }, node: unknown): void;
    }>;
  }): Promise<string>;
};

const highlighted = new Map<string, string>();
let highlighter: Promise<DemoCodeHighlighter> | undefined;

@customElement({ name: 'demo-code', template })
export class DemoCode {
  private readonly host = resolve(INode) as HTMLElement;
  private observer: MutationObserver | undefined;
  private updateId = 0;

  @bindable
  code: string = '';

  @bindable
  language: DemoCodeLanguage = 'html';

  html: string = '';

  attached(): void {
    this.updateHtml();
    this.observer = new MutationObserver(() => this.updateHtml());
    this.observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }

  detaching(): void {
    this.observer?.disconnect();
    this.observer = undefined;
  }

  codeChanged(): void {
    this.updateHtml();
  }

  languageChanged(): void {
    this.updateHtml();
  }

  private async updateHtml(): Promise<void> {
    const code = this.code;
    if (!code) {
      this.html = '';
      return;
    }

    const updateId = ++this.updateId;
    const theme = document.documentElement.dataset.theme === 'dark' ? 'github-dark-default' : 'github-light';
    const key = `${theme}:${this.language}:${code}`;
    const cached = highlighted.get(key);
    if (cached) {
      this.html = cached;
      return;
    }

    const shiki = await this.getHighlighter();
    const html = await shiki.codeToHtml(code, {
      lang: this.language === 'ts' ? 'typescript' : 'html',
      theme,
      transformers: [{
        pre(node) {
          this.addClassToHast(node, 'demo-code__pre');
        },
        code(node) {
          this.addClassToHast(node, 'demo-code__code');
        }
      }]
    });
    highlighted.set(key, html);
    if (updateId === this.updateId && this.host.isConnected) {
      this.html = html;
    }
  }

  private getHighlighter(): Promise<DemoCodeHighlighter> {
    highlighter ??= this.createHighlighter();
    return highlighter;
  }

  private async createHighlighter(): Promise<DemoCodeHighlighter> {
    const [{ createBundledHighlighter, createSingletonShorthands }, { createJavaScriptRegexEngine }] = await Promise.all([
      import('shiki/core'),
      import('shiki/engine/javascript')
    ]);
    const createHighlighter = createBundledHighlighter({
      langs: {
        html: () => import('@shikijs/langs/html'),
        typescript: () => import('@shikijs/langs/typescript')
      },
      themes: {
        'github-light': () => import('@shikijs/themes/github-light'),
        'github-dark-default': () => import('@shikijs/themes/github-dark-default')
      },
      engine: () => createJavaScriptRegexEngine()
    });
    return createSingletonShorthands(createHighlighter) as DemoCodeHighlighter;
  }
}
