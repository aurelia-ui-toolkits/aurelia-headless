import { bindable, customElement } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';

@customElement('ui-progress')
export class UiProgress {
  @bindable
  value: number | undefined;
  valueChanged(): void {
    this.updateState();
  }

  @bindable
  max: number = 100;
  maxChanged(): void {
    this.updateState();
  }

  @bindable
  label: string | undefined;

  @bindable({ set: booleanAttr })
  circular: boolean = false;

  indeterminate = true;
  activeDeterminate = false;
  normalizedMax = 100;
  normalizedValue = 0;
  barStyle: string | undefined;
  circleStyle: string | undefined;

  binding(): void {
    this.updateState();
  }

  private updateState(): void {
    const max = Number(this.max);
    this.normalizedMax = max > 0 ? max : 100;
    this.indeterminate = this.value === undefined || this.value === null || Number.isNaN(Number(this.value));
    if (this.indeterminate) {
      this.activeDeterminate = false;
      this.normalizedValue = 0;
      this.barStyle = undefined;
      this.circleStyle = undefined;
      return;
    }

    this.normalizedValue = Math.max(0, Math.min(Number(this.value), this.normalizedMax));
    this.activeDeterminate = this.normalizedValue < this.normalizedMax;
    const percent = this.normalizedValue / this.normalizedMax * 100;
    this.barStyle = `width: ${percent}%`;
    this.circleStyle = `stroke-dasharray: ${percent} 100`;
  }
}
