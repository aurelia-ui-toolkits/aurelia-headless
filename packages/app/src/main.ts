import Aurelia from 'aurelia';
import { AureliaHeadlessConfiguration } from 'aurelia-headless';
import { RouterConfiguration } from '@aurelia/router';
import { DemoBlock } from './elements/demo-block/demo-block';
import { DemoSection } from './elements/demo-section/demo-section';
import { MyApp } from './views/my-app/my-app';
import { DefaultVirtualizationConfiguration } from '@aurelia/ui-virtualization';

import './styles/theme.css';
import './styles/ui-button-theme.css';
import './styles/ui-checkbox-theme.css';
import './styles/ui-disclosure-theme.css';
import './styles/ui-list-theme.css';
import './styles/ui-popup-theme.css';
import './styles/ui-switch-theme.css';

Aurelia
  .register(RouterConfiguration.customize({ useUrlFragmentHash: true }),
    DefaultVirtualizationConfiguration, AureliaHeadlessConfiguration, DemoBlock, DemoSection)
  .app(MyApp)
  .start();
