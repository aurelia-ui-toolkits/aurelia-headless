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
            { id: 'tree', name: 'ui-tree.ts', kind: 'file' }
          ]
        },
        { id: 'legacy', name: 'legacy.ts', kind: 'file', disabled: true }
      ]
    },
    { id: 'package', name: 'package.json', kind: 'file' },
    { id: 'readme', name: 'README.md', kind: 'file' }
  ];

  openNode(node: TreeNode, event: Event): void {
    event.stopPropagation();
    this.lastAction = `open ${node.name}`;
  }
}
