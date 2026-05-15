import { customElement } from 'aurelia';
import template from './tree-view.html?raw';
import './tree-view.css';

type TreeNode = {
  id: string;
  name: string;
  kind: 'folder' | 'file';
  expanded?: boolean;
  disabled?: boolean;
  children?: TreeNode[];
};

@customElement({ name: 'tree-view', template })
export class TreeView {
  selectedFile = 'components';
  lastAction = 'none';

  readonly files: TreeNode[] = [
    {
      id: 'src',
      name: 'src',
      kind: 'folder',
      expanded: true,
      children: [
        { id: 'main', name: 'main.ts', kind: 'file' },
        {
          id: 'components',
          name: 'components',
          kind: 'folder',
          expanded: true,
          children: [
            { id: 'button', name: 'ui-button.ts', kind: 'file' },
            { id: 'checkbox', name: 'ui-checkbox.ts', kind: 'file' },
            { id: 'combobox', name: 'ui-combobox.ts', kind: 'file' },
            { id: 'tree', name: 'ui-tree.ts', kind: 'file' },
            { id: 'tooltip', name: 'ui-tooltip.ts', kind: 'file' }
          ]
        },
        {
          id: 'views',
          name: 'views',
          kind: 'folder',
          expanded: true,
          children: [
            { id: 'app-view', name: 'my-app.ts', kind: 'file' },
            { id: 'tree-view', name: 'tree-view.ts', kind: 'file' },
            { id: 'combobox-view', name: 'combobox-view.ts', kind: 'file' },
            { id: 'toast-view', name: 'toast-view.ts', kind: 'file' }
          ]
        },
        {
          id: 'styles',
          name: 'styles',
          kind: 'folder',
          expanded: true,
          children: [
            { id: 'theme-css', name: 'theme.css', kind: 'file' },
            { id: 'tree-css', name: 'ui-tree-theme.css', kind: 'file' },
            { id: 'button-css', name: 'ui-button-theme.css', kind: 'file' },
            { id: 'toast-css', name: 'ui-toast-theme.css', kind: 'file' }
          ]
        },
        { id: 'legacy', name: 'legacy.ts', kind: 'file', disabled: true }
      ]
    },
    {
      id: 'packages',
      name: 'packages',
      kind: 'folder',
      expanded: true,
      children: [
        {
          id: 'components-package',
          name: 'components',
          kind: 'folder',
          expanded: true,
          children: [
            { id: 'components-index', name: 'index.ts', kind: 'file' },
            { id: 'components-package-json', name: 'package.json', kind: 'file' },
            { id: 'components-tsconfig', name: 'tsconfig.build.json', kind: 'file' }
          ]
        },
        {
          id: 'app-package',
          name: 'app',
          kind: 'folder',
          children: [
            { id: 'app-package-json', name: 'package.json', kind: 'file' },
            { id: 'vite-config', name: 'vite.config.ts', kind: 'file' }
          ]
        }
      ]
    },
    { id: 'package', name: 'package.json', kind: 'file' },
    { id: 'readme', name: 'README.md', kind: 'file' },
    { id: 'license', name: 'LICENSE', kind: 'file' }
  ];

  openNode(node: TreeNode, event: Event): void {
    event.stopPropagation();
    this.lastAction = `open ${node.name}`;
  }
}
