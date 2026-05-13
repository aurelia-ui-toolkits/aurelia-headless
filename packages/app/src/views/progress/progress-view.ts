import { customElement } from 'aurelia';
import template from './progress-view.html?raw';
import './progress-view.css';

@customElement({ name: 'progress-view', template })
export class ProgressView {
  uploadProgress = 64;
  storageUsed = 38;
}
