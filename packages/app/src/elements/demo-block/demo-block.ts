import { bindable, customElement, INode, resolve } from 'aurelia';
import template from './demo-block.html?raw';

const viewTemplates = import.meta.glob('../../views/**/*.html', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const viewModels = import.meta.glob('../../views/**/*.ts', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

@customElement({ name: 'demo-block', template })
export class DemoBlock {
  private readonly host = resolve(INode) as HTMLElement;

  @bindable title: string = '';

  sourceCode: string = '';
  tsSourceCode: string = '';
  templateSourceOpen: boolean = false;
  tsSourceOpen: boolean = false;

  attached(): void {
    this.updateSource();
  }

  titleChanged(): void {
    this.updateSource();
  }

  toggleTemplateSource(): void {
    this.templateSourceOpen = !this.templateSourceOpen;
  }

  toggleTsSource(): void {
    this.tsSourceOpen = !this.tsSourceOpen;
  }

  private findSource(): string {
    const routeTemplate = viewTemplates[this.getRouteFilePath('html')];
    const source = routeTemplate ? this.extractBlock(routeTemplate) : undefined;
    return source ?? '';
  }

  private findTsSource(): string {
    const source = viewModels[this.getRouteFilePath('ts')];
    if (!source || !this.hasRelevantTs(source)) {
      return '';
    }
    return this.normalizeSource(source);
  }

  private updateSource(): void {
    this.sourceCode = this.findSource();
    this.tsSourceCode = this.findTsSource();
  }

  private getRouteFilePath(extension: 'html' | 'ts'): string {
    const path = this.getRoutePath();
    return `../../views/${path}/${path}-view.${extension}`;
  }

  private getRoutePath(): string {
    let current = this.host.parentElement;
    while (current) {
      const name = current.tagName.toLowerCase();
      if (name.endsWith('-view')) {
        return name.slice(0, -'-view'.length);
      }
      current = current.parentElement;
    }
    return 'get-started';
  }

  private extractBlock(source: string): string | undefined {
    const title = this.escapeRegExp(this.title);
    const match = source.match(new RegExp(`<demo-block\\b(?=[^>]*\\btitle=["']${title}["'])[^>]*>([\\s\\S]*?)<\\/demo-block>`, 'i'));
    return match ? this.normalizeSource(match[1]) : undefined;
  }

  private normalizeSource(source: string): string {
    const lines = source.replace(/^\n|\s+$/g, '').split('\n');
    const indent = lines
      .filter(line => line.trim())
      .reduce((min, line) => Math.min(min, line.match(/^\s*/)?.[0].length ?? 0), Number.POSITIVE_INFINITY);
    return lines.map(line => line.slice(Number.isFinite(indent) ? indent : 0)).join('\n');
  }

  private hasRelevantTs(source: string): boolean {
    const classMatch = source.match(/export\s+class\s+\w+\s*{([\s\S]*)}\s*$/);
    return !!classMatch?.[1].trim();
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
