import Aurelia from 'aurelia';
import { AureliaHeadlessConfiguration, UiValidationControllerFactory } from '@aurelia-ui-toolkits/headless';
import { RouterConfiguration } from '@aurelia/router';
import { SVGAnalyzer } from '@aurelia/runtime-html';
import { DemoBlock } from './elements/demo-block/demo-block';
import { DemoCode } from './elements/demo-code/demo-code';
import { DemoSection } from './elements/demo-section/demo-section';
import { MyApp } from './views/my-app/my-app';
import { DefaultVirtualizationConfiguration } from '@aurelia/ui-virtualization';
import { ValidationHtmlConfiguration } from '@aurelia/validation-html';
import { RoleLabelValueConverter } from './value-converters/role-label';

import { RegexRule, RequiredRule, ValidationConfiguration } from '@aurelia/validation';

const themePackage = localStorage.getItem('aurelia-headless:theme-package');
if (themePackage === 'compact') {
  await import('@aurelia-ui-toolkits/headless-tailwind-compact');
} else {
  await import('@aurelia-ui-toolkits/headless-tailwind');
}

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
    DefaultVirtualizationConfiguration, AureliaHeadlessConfiguration, SVGAnalyzer, DemoBlock, DemoCode, DemoSection,
    RoleLabelValueConverter)
  .app(MyApp)
  .start();
