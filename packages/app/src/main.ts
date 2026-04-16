import Aurelia from 'aurelia';
import { AureliaHeadlessConfiguration } from 'aurelia-headless';
import { RouterConfiguration } from '@aurelia/router';
import { DemoBlock } from './elements/demo-block/demo-block';
import { MyApp } from './my-app';
import { DefaultVirtualizationConfiguration } from '@aurelia/ui-virtualization';

import './theme.css';
import './app.css';
import './ui-button-theme.css';
import './ui-checkbox-theme.css';
import './ui-disclosure-theme.css';
import './ui-list-theme.css';
import './ui-switch-theme.css';

Aurelia
  .register(RouterConfiguration, DefaultVirtualizationConfiguration, AureliaHeadlessConfiguration, DemoBlock)
  .app(MyApp)
  .start();
