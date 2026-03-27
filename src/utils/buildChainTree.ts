import type { ChainNode } from '../types/domain';

export interface ChainTreeNode extends ChainNode {
  children: ChainTreeNode[];
}

/**
 * Converts a flat array of ChainNode into a tree rooted at the node
 * with no parentVideoId. Returns the root nodes (typically one).
 */
export function buildChainTree(nodes: ChainNode[]): ChainTreeNode[] {
  const treeNodes: ChainTreeNode[] = nodes.map((n) => ({ ...n, children: [] }));
  const byVideoId = new Map<string, ChainTreeNode>();

  for (const node of treeNodes) {
    byVideoId.set(node.videoId, node);
  }

  const roots: ChainTreeNode[] = [];

  for (const node of treeNodes) {
    if (node.parentVideoId) {
      const parent = byVideoId.get(node.parentVideoId);
      if (parent) {
        parent.children.push(node);
      } else {
        // Orphan — treat as root
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  }

  return roots;
}
