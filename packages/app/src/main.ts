import Aurelia from 'aurelia';
import { AureliaHeadlessConfiguration } from '@aurelia-headless/components';
import { MyApp } from './my-app';
import './main.css';

Aurelia
  .register(AureliaHeadlessConfiguration)
  .app(MyApp)
  .start();
