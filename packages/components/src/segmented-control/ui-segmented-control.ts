import { bindable, BindingMode, children, customElement, INode, resolve } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';
import { Keys } from '../base/keys';
import { UiSegment } from './ui-segment';
import template from './ui-segmented-control.html?raw';

@customElement({ name: 'ui-segmented-control', template })
export class UiSegmentedControl {
  private readonly host = resolve(INode) as HTMLElement;

  @bindable({ mode: BindingMode.twoWay })
  value: unknown;

  @bindable
  label: string | undefined;

  @bindable({ set: booleanAttr })
  disabled: boolean = false;

  @bindable({ set: booleanAttr })
  readonly: boolean = false;

  @children({
    query: 'ui-segment',
    map: (_node, viewModel) => viewModel
  })
  segments: UiSegment[] = [];
  segmentsChanged(): void {
    this.selectInitialSegment();
  }

  attached(): void {
    this.selectInitialSegment();
  }

  select(segment: UiSegment): void {
    if (this.disabled || this.readonly || segment.disabled || this.value === segment.value) {
      return;
    }

    this.value = segment.value;
    this.dispatchValueEvent('input');
    this.dispatchValueEvent('change');
  }

  onKeyDown(event: KeyboardEvent): void {
    if (this.disabled || this.readonly) {
      return;
    }

    const active = this.segments.find(segment => segment.element === event.target);
    if (!active) {
      return;
    }

    if (event.key === Keys.Space || event.key === Keys.Enter) {
      event.preventDefault();
      this.select(active);
      return;
    }

    const segments = this.enabledSegments;
    if (!segments.length) {
      return;
    }

    if (event.key === Keys.Home) {
      event.preventDefault();
      segments[0].element.focus();
      return;
    }

    if (event.key === Keys.End) {
      event.preventDefault();
      segments[segments.length - 1].element.focus();
      return;
    }

    const direction = this.getNavigationDirection(event.key);
    if (!direction) {
      return;
    }

    event.preventDefault();
    const index = segments.indexOf(active);
    segments[(index + direction + segments.length) % segments.length].element.focus();
  }

  get enabledSegments(): UiSegment[] {
    return this.segments.filter(segment => !segment.disabled);
  }

  private selectInitialSegment(): void {
    if (this.value !== undefined) {
      return;
    }

    const first = this.enabledSegments[0];
    if (first) {
      this.value = first.value;
    }
  }

  private getNavigationDirection(key: string): 1 | -1 | undefined {
    if (key === Keys.ArrowRight || key === Keys.ArrowDown) {
      return 1;
    }

    if (key === Keys.ArrowLeft || key === Keys.ArrowUp) {
      return -1;
    }

    return undefined;
  }

  private dispatchValueEvent(type: 'input' | 'change'): void {
    this.host.dispatchEvent(new Event(type, { bubbles: true }));
  }
}
