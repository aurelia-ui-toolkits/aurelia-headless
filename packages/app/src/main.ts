import Aurelia from 'aurelia';
import { AureliaHeadlessConfiguration } from 'aurelia-headless';
import { MyApp } from './my-app';
import './main.css';
import './ui-button-theme.css';

Aurelia
  .register(AureliaHeadlessConfiguration)
  .app(MyApp)
  .start();
