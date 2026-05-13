import { Aurelia, IContainer, resolve } from 'aurelia';

type TooltipPlacement = 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
type EnhancedView = { deactivate(): void | Promise<void> };

let nextTooltipId = 0;

interface TooltipOptions {
  anchor: HTMLElement;
  text: string;
  placement: TooltipPlacement;
  offset: number;
}

export class UiTooltipService {
  private readonly container = resolve(IContainer);
  private host: HTMLElement | undefined;
  private enhanced: EnhancedView | undefined;
  private request = 0;

  open = false;
  anchor: HTMLElement | undefined;
  text = '';
  placement: TooltipPlacement = 'top-start';
  offset = 6;
  tooltipId = `ui-tooltip-${++nextTooltipId}`;

  async show(options: TooltipOptions): Promise<void> {
    const request = ++this.request;
    await this.ensureEnhanced();
    if (request !== this.request) {
      return;
    }

    this.anchor = options.anchor;
    this.text = options.text;
    this.placement = options.placement;
    this.offset = options.offset;
    this.open = true;
  }

  hide(anchor: HTMLElement): void {
    if (this.anchor !== anchor) {
      return;
    }

    this.request++;
    this.open = false;
    this.anchor = undefined;
  }

  private async ensureEnhanced(): Promise<void> {
    if (this.enhanced) {
      return;
    }

    this.host = document.createElement('div');
    this.host.className = 'ui-tooltip';
    this.host.innerHTML = `
      <ui-popup
        open.bind="open"
        anchor.bind="anchor"
        placement.bind="placement"
        offset.bind="offset"
        focus-on-open.bind="false"
        restore-focus.bind="false"
        close-on-outside.bind="false"
        close-on-escape.bind="false"
        panel-role="tooltip"
        panel-id.bind="tooltipId">
        <span class="ui-tooltip__content">\${text}</span>
      </ui-popup>
    `;
    document.body.append(this.host);

    this.enhanced = await Aurelia.enhance({
      host: this.host,
      component: this,
      container: this.container
    }) as EnhancedView;
  }
}

export type { TooltipPlacement, TooltipOptions };
