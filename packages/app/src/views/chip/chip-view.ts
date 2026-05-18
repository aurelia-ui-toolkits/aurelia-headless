import { customElement } from 'aurelia';
import template from './chip-view.html?raw';
import './chip-view.css';

type ChipTag = { id: string; label: string };

@customElement({ name: 'chip-view', template })
export class ChipView {
  selectedFrontend = true;
  selectedBackend = false;
  selectedDesign = false;
  tagQuery = '';
  selectedTagId: string | undefined;

  tags: ChipTag[] = [
    { id: 'aurelia', label: 'Aurelia' },
    { id: 'typescript', label: 'TypeScript' },
    { id: 'headless', label: 'Headless UI' }
  ];

  readonly tagOptions: ChipTag[] = [
    { id: 'accessibility', label: 'Accessibility' },
    { id: 'forms', label: 'Forms' },
    { id: 'overlays', label: 'Overlays' },
    { id: 'navigation', label: 'Navigation' },
    { id: 'data', label: 'Data display' }
  ];

  availableTagOptions: ChipTag[] = this.tagOptions.filter(option => !this.tags.some(tag => tag.id === option.id));

  removeTag(event: CustomEvent<{ value: string }>): void {
    this.tags = this.tags.filter(tag => tag.id !== event.detail.value);
    this.refreshAvailableTags();
  }

  addSelectedTag(): void {
    const tag = this.tagOptions.find(option => option.id === this.selectedTagId);
    if (!tag || this.tags.some(existing => existing.id === tag.id)) {
      return;
    }

    this.tags = [...this.tags, tag];
    this.tagQuery = '';
    this.selectedTagId = undefined;
    this.refreshAvailableTags();
  }

  private refreshAvailableTags(): void {
    this.availableTagOptions = this.tagOptions.filter(option => !this.tags.some(tag => tag.id === option.id));
  }
}
