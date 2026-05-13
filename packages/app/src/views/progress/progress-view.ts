import { customElement } from 'aurelia';
import template from './progress-view.html?raw';

@customElement({ name: 'progress-view', template })
export class ProgressView {
  uploadProgress = 64;
  storageUsed = 38;
}
