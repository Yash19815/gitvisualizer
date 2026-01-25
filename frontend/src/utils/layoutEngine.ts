import dagre from '@dagrejs/dagre';
import type { Node, Edge } from '@xyflow/react';
import type { Commit, Submodule } from '../types';
import { assignBranchColors, assignAuthorColors } from './branchColors';

export interface CommitNodeData extends Record<string, unknown> {
  commit: Commit;
  color: string;
  isCompact: boolean;
  isHighlighted: boolean;
}

export interface SubmoduleNodeData extends Record<string, unknown> {
  submodule: Submodule;
  color: string;
  isCompact: boolean;
  isSelected: boolean;
  onNavigate?: (submodulePath: string) => void;
}

export type CommitNode = Node<CommitNodeData, 'commit'>;
export type SubmoduleGraphNode = Node<SubmoduleNodeData, 'submodule'>;
export type CommitEdge = Edge<{ isMerge: boolean; color: string }>;

// Node dimensions for different modes
const NODE_WIDTH_NORMAL = 280;
const NODE_HEIGHT_NORMAL = 100;
const NODE_WIDTH_COMPACT = 200;
const NODE_HEIGHT_COMPACT = 60;

interface LayoutOptions {
  direction: 'TB' | 'LR';
  nodeSpacing: number;
  rankSpacing: number;
}

export interface GraphSettings {
  compactMode: boolean;
  colorByAuthor: boolean;
  highlightedCommits: Set<string>;
}

export function layoutCommitGraph(
  commits: Commit[],
  options: LayoutOptions = { direction: 'TB', nodeSpacing: 40, rankSpacing: 80 },
  graphSettings: GraphSettings = { compactMode: false, colorByAuthor: false, highlightedCommits: new Set() }
): { nodes: CommitNode[]; edges: CommitEdge[] } {
  if (commits.length === 0) {
    return { nodes: [], edges: [] };
  }

  const { compactMode, colorByAuthor, highlightedCommits } = graphSettings;

  // Select node dimensions based on compact mode
  const nodeWidth = compactMode ? NODE_WIDTH_COMPACT : NODE_WIDTH_NORMAL;
  const nodeHeight = compactMode ? NODE_HEIGHT_COMPACT : NODE_HEIGHT_NORMAL;

  // Adjust spacing for compact mode
  const nodeSpacing = compactMode ? options.nodeSpacing * 0.6 : options.nodeSpacing;
  const rankSpacing = compactMode ? options.rankSpacing * 0.6 : options.rankSpacing;

  const g = new dagre.graphlib.Graph();

  g.setGraph({
    rankdir: options.direction,
    nodesep: nodeSpacing,
    ranksep: rankSpacing,
    marginx: 50,
    marginy: 50,
  });

  g.setDefaultEdgeLabel(() => ({}));

  // Choose color assignment based on setting
  const colorMap = colorByAuthor
    ? assignAuthorColors(commits)
    : assignBranchColors(commits);

  const commitSet = new Set(commits.map(c => c.hash));

  // Add nodes
  for (const commit of commits) {
    g.setNode(commit.hash, { width: nodeWidth, height: nodeHeight });
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
            stroke: colorMap.get(commit.hash) || '#888',
            strokeWidth: 2,
          },
          data: {
            isMerge: i > 0,
            color: colorMap.get(commit.hash) || '#888',
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
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
      data: {
        commit,
        color: colorMap.get(commit.hash) || '#888',
        isCompact: compactMode,
        isHighlighted: highlightedCommits.has(commit.hash),
      },
    };
  });

  return { nodes, edges };
}

// Submodule node dimensions
const SUBMODULE_WIDTH_NORMAL = 200;
const SUBMODULE_WIDTH_COMPACT = 80;

export interface SubmoduleLayoutOptions {
  isCompact: boolean;
  selectedSubmodulePath?: string;
  onNavigate?: (submodulePath: string) => void;
}

/**
 * Layout submodule nodes in a horizontal row below the commit graph
 */
export function layoutSubmoduleNodes(
  submodules: Submodule[],
  commitNodes: CommitNode[],
  options: SubmoduleLayoutOptions
): SubmoduleGraphNode[] {
  if (submodules.length === 0) return [];

  const { isCompact, selectedSubmodulePath, onNavigate } = options;

  // Select node dimensions based on compact mode
  const nodeWidth = isCompact ? SUBMODULE_WIDTH_COMPACT : SUBMODULE_WIDTH_NORMAL;
  const spacing = isCompact ? 20 : 30;

  // Find the bottom of the commit graph
  let maxY = 0;
  let minX = Infinity;
  let maxX = -Infinity;

  for (const node of commitNodes) {
    const nodeBottom = node.position.y + (isCompact ? 60 : 100);
    if (nodeBottom > maxY) maxY = nodeBottom;
    if (node.position.x < minX) minX = node.position.x;
    if (node.position.x > maxX) maxX = node.position.x + (isCompact ? 200 : 280);
  }

  // Position submodule nodes below the graph, centered horizontally
  const totalWidth = submodules.length * nodeWidth + (submodules.length - 1) * spacing;
  const graphWidth = maxX - minX;
  const startX = minX + (graphWidth - totalWidth) / 2;
  const startY = maxY + 60; // Gap below commits

  return submodules.map((submodule, index) => ({
    id: `submodule-${submodule.path}`,
    type: 'submodule' as const,
    position: {
      x: startX + index * (nodeWidth + spacing),
      y: startY,
    },
    data: {
      submodule,
      color: '#14b8a6', // teal-500
      isCompact,
      isSelected: selectedSubmodulePath === submodule.path,
      onNavigate,
    },
  }));
}
