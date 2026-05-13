import { bindable, customAttribute, INode, resolve } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';
import { Keys } from '../base/keys';
import { UiTooltipService, TooltipOptions, TooltipPlacement } from './ui-tooltip-service';

@customAttribute({
  name: 'ui-tooltip',
  defaultProperty: 'text'
})
export class UiTooltip implements EventListenerObject {
  private readonly host = resolve(INode) as HTMLElement;
  private readonly tooltipService = resolve(UiTooltipService);
  private openTimer: ReturnType<typeof setTimeout> | undefined;
  private closeTimer: ReturnType<typeof setTimeout> | undefined;
  private pointerInside = false;
  private focusInside = false;
  private described = false;

  @bindable
  text: string | undefined;
  textChanged(): void {
    if (this.described && this.canOpen()) {
      void this.tooltipService.show(this.getOptions());
    } else if (this.described) {
      this.closeNow();
    }
  }

  @bindable
  placement: TooltipPlacement = 'top-start';
  placementChanged(): void {
    if (this.described && this.canOpen()) {
      void this.tooltipService.show(this.getOptions());
    }
  }

  @bindable
  offset: number = 6;
  offsetChanged(): void {
    if (this.described && this.canOpen()) {
      void this.tooltipService.show(this.getOptions());
    }
  }

  @bindable
  openDelay: number = 300;

  @bindable
  closeDelay: number = 0;

  @bindable({ set: booleanAttr })
  disabled: boolean = false;
  disabledChanged(): void {
    if (this.disabled) {
      this.closeNow();
    }
  }

  attaching(): void {
    this.host.addEventListener('pointerenter', this);
    this.host.addEventListener('pointerleave', this);
    this.host.addEventListener('focusin', this);
    this.host.addEventListener('focusout', this);
    this.host.addEventListener('keydown', this);
  }

  detaching(): void {
    this.host.removeEventListener('pointerenter', this);
    this.host.removeEventListener('pointerleave', this);
    this.host.removeEventListener('focusin', this);
    this.host.removeEventListener('focusout', this);
    this.host.removeEventListener('keydown', this);
    this.clearTimers();
    this.closeNow();
  }

  handleEvent(event: Event): void {
    switch (event.type) {
      case 'pointerenter':
        this.pointerInside = true;
        this.scheduleOpen();
        break;
      case 'pointerleave':
        this.pointerInside = false;
        this.scheduleClose();
        break;
      case 'focusin':
        this.focusInside = true;
        this.scheduleOpen();
        break;
      case 'focusout':
        this.focusInside = false;
        this.scheduleClose();
        break;
      case 'keydown':
        if ((event as KeyboardEvent).key === Keys.Escape) {
          this.closeNow();
        }
        break;
    }
  }

  private scheduleOpen(): void {
    if (!this.canOpen()) {
      return;
    }

    this.clearCloseTimer();
    this.clearOpenTimer();
    this.openTimer = setTimeout(() => {
      this.addDescribedBy();
      void this.tooltipService.show(this.getOptions());
    }, this.getDelay(this.openDelay));
  }

  private scheduleClose(): void {
    this.clearOpenTimer();
    this.clearCloseTimer();
    this.closeTimer = setTimeout(() => {
      if (!this.pointerInside && !this.focusInside) {
        this.closeNow();
      }
    }, this.getDelay(this.closeDelay));
  }

  private closeNow(): void {
    this.clearTimers();
    this.removeDescribedBy();
    this.tooltipService.hide(this.host);
  }

  private getOptions(): TooltipOptions {
    return {
      anchor: this.host,
      text: this.text ?? '',
      placement: this.placement,
      offset: Number(this.offset) || 0
    };
  }

  private canOpen(): boolean {
    return !this.disabled && !!this.text;
  }

  private getDelay(value: number): number {
    return Math.max(0, Number(value) || 0);
  }

  private clearTimers(): void {
    this.clearOpenTimer();
    this.clearCloseTimer();
  }

  private clearOpenTimer(): void {
    if (this.openTimer) {
      clearTimeout(this.openTimer);
      this.openTimer = undefined;
    }
  }

  private clearCloseTimer(): void {
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = undefined;
    }
  }

  private addDescribedBy(): void {
    if (this.described) {
      return;
    }

    const ids = this.getDescribedByIds();
    if (!ids.includes(this.tooltipService.tooltipId)) {
      ids.push(this.tooltipService.tooltipId);
      this.host.setAttribute('aria-describedby', ids.join(' '));
    }
    this.described = true;
  }

  private removeDescribedBy(): void {
    if (!this.described) {
      return;
    }

    const ids = this.getDescribedByIds().filter(id => id !== this.tooltipService.tooltipId);
    if (ids.length) {
      this.host.setAttribute('aria-describedby', ids.join(' '));
    } else {
      this.host.removeAttribute('aria-describedby');
    }
    this.described = false;
  }

  private getDescribedByIds(): string[] {
    return (this.host.getAttribute('aria-describedby') ?? '')
      .split(/\s+/)
      .filter(Boolean);
  }
}
