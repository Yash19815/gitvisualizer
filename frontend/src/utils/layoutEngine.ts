import dagre from '@dagrejs/dagre';
import type { Node, Edge } from '@xyflow/react';
import type { Commit } from '../types';
import { assignBranchColors } from './branchColors';

export interface CommitNodeData extends Record<string, unknown> {
  commit: Commit;
  color: string;
}

export type CommitNode = Node<CommitNodeData, 'commit'>;
export type CommitEdge = Edge<{ isMerge: boolean; color: string }>;

const NODE_WIDTH = 280;
const NODE_HEIGHT = 100;

interface LayoutOptions {
  direction: 'TB' | 'LR';
  nodeSpacing: number;
  rankSpacing: number;
}

export function layoutCommitGraph(
  commits: Commit[],
  options: LayoutOptions = { direction: 'TB', nodeSpacing: 40, rankSpacing: 80 }
): { nodes: CommitNode[]; edges: CommitEdge[] } {
  if (commits.length === 0) {
    return { nodes: [], edges: [] };
  }

  const g = new dagre.graphlib.Graph();

  g.setGraph({
    rankdir: options.direction,
    nodesep: options.nodeSpacing,
    ranksep: options.rankSpacing,
    marginx: 50,
    marginy: 50,
  });

  g.setDefaultEdgeLabel(() => ({}));

  const branchColors = assignBranchColors(commits);
  const commitSet = new Set(commits.map(c => c.hash));

  // Add nodes
  for (const commit of commits) {
    g.setNode(commit.hash, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }

  // Add edges (child -> parent)
  const edges: CommitEdge[] = [];
  for (const commit of commits) {
    for (let i = 0; i < commit.parents.length; i++) {
      const parentHash = commit.parents[i];
      if (commitSet.has(parentHash)) {
        g.setEdge(commit.hash, parentHash);
        edges.push({
          id: `${commit.hash}-${parentHash}`,
          source: commit.hash,
          target: parentHash,
          type: 'smoothstep',
          style: {
            stroke: branchColors.get(commit.hash) || '#888',
            strokeWidth: 2,
          },
          data: {
            isMerge: i > 0,
            color: branchColors.get(commit.hash) || '#888',
          },
        });
      }
    }
  }

  // Run layout
  dagre.layout(g);

  // Extract positioned nodes
  const nodes: CommitNode[] = commits.map(commit => {
    const nodeWithPosition = g.node(commit.hash);
    return {
      id: commit.hash,
      type: 'commit',
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
      data: {
        commit,
        color: branchColors.get(commit.hash) || '#888',
      },
    };
  });

  return { nodes, edges };
}
