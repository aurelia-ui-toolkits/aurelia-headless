import Aurelia from 'aurelia';
import { AureliaHeadlessConfiguration, UiValidationControllerFactory } from 'aurelia-headless';
import { RouterConfiguration } from '@aurelia/router';
import { SVGAnalyzer } from '@aurelia/runtime-html';
import { DemoBlock } from './elements/demo-block/demo-block';
import { DemoSection } from './elements/demo-section/demo-section';
import { MyApp } from './views/my-app/my-app';
import { DefaultVirtualizationConfiguration } from '@aurelia/ui-virtualization';
import { ValidationHtmlConfiguration } from '@aurelia/validation-html';

import './styles/theme.css';
import './styles/ui-alert-theme.css';
import './styles/ui-button-theme.css';
import './styles/ui-checkbox-theme.css';
import './styles/ui-combobox-theme.css';
import './styles/ui-disclosure-theme.css';
import './styles/ui-drawer-theme.css';
import './styles/ui-input-theme.css';
import './styles/ui-list-theme.css';
import './styles/ui-menu-theme.css';
import './styles/ui-popup-theme.css';
import './styles/ui-progress-theme.css';
import './styles/ui-radio-theme.css';
import './styles/ui-select-theme.css';
import './styles/ui-segmented-control-theme.css';
import './styles/ui-switch-theme.css';
import './styles/ui-tabs-theme.css';
import './styles/ui-toast-theme.css';
import './styles/ui-tooltip-theme.css';
import './styles/ui-tree-theme.css';
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
    DefaultVirtualizationConfiguration, AureliaHeadlessConfiguration, SVGAnalyzer, DemoBlock, DemoSection)
  .app(MyApp)
  .start();
