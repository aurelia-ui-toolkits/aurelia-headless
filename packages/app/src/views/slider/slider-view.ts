import { customElement } from 'aurelia';
import template from './slider-view.html?raw';
import './slider-view.css';

@customElement({ name: 'slider-view', template })
export class SliderView {
  volume = 40;
  brightness = 70;
  priceMin = 25;
  priceMax = 75;
  disabledValue = 25;
}
