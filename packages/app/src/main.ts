import Aurelia from 'aurelia';
import { AureliaHeadlessConfiguration } from 'aurelia-headless';
import { DemoBlock } from './elements/demo-block/demo-block';
import { MyApp } from './my-app';
import './theme.css';
import './app.css';
import './ui-button-theme.css';

Aurelia
  .register(AureliaHeadlessConfiguration, DemoBlock)
  .app(MyApp)
  .start();
