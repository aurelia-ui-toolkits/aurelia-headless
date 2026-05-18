import { customElement } from 'aurelia';
import template from './chip-view.html?raw';
import './chip-view.css';

type ChipTag = { id: string; label: string };

@customElement({ name: 'chip-view', template })
export class ChipView {
  selectedFrontend = true;
  selectedBackend = false;
  selectedDesign = false;

  tags: ChipTag[] = [
    { id: 'aurelia', label: 'Aurelia' },
    { id: 'typescript', label: 'TypeScript' },
    { id: 'headless', label: 'Headless UI' }
  ];

  removeTag(event: CustomEvent<{ value: string }>): void {
    this.tags = this.tags.filter(tag => tag.id !== event.detail.value);
  }
}
