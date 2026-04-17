import Aurelia from 'aurelia';
import { AureliaHeadlessConfiguration, UiValidationControllerFactory } from 'aurelia-headless';
import { RouterConfiguration } from '@aurelia/router';
import { DemoBlock } from './elements/demo-block/demo-block';
import { DemoSection } from './elements/demo-section/demo-section';
import { MyApp } from './views/my-app/my-app';
import { DefaultVirtualizationConfiguration } from '@aurelia/ui-virtualization';
import { ValidationHtmlConfiguration } from '@aurelia/validation-html';

import './styles/theme.css';
import './styles/ui-button-theme.css';
import './styles/ui-checkbox-theme.css';
import './styles/ui-disclosure-theme.css';
import './styles/ui-input-theme.css';
import './styles/ui-list-theme.css';
import './styles/ui-popup-theme.css';
import './styles/ui-switch-theme.css';
import { RegexRule, RequiredRule, ValidationConfiguration } from '@aurelia/validation';

Aurelia
  .register(
    RouterConfiguration.customize({ useUrlFragmentHash: true }),
    ValidationConfiguration.customize(c => {
      c.CustomMessages = [
        { rule: RequiredRule, aliases: [{ name: 'required', defaultMessage: 'is required' }] },
        { rule: RegexRule, aliases: [{ name: 'email', defaultMessage: 'is not a valid email address' }] }
      ];
    }),
    ValidationHtmlConfiguration.customize(o => {
      o.ValidationControllerFactoryType = UiValidationControllerFactory;
    }),
    DefaultVirtualizationConfiguration, AureliaHeadlessConfiguration, DemoBlock, DemoSection)
  .app(MyApp)
  .start();
