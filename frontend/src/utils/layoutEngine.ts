import dagre from "@dagrejs/dagre";
import type { Node, Edge } from "@xyflow/react";
import type { Commit, Submodule } from "../types";
import { assignBranchColors, assignAuthorColors } from "./branchColors";

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

export type CommitNode = Node<CommitNodeData, "commit">;
export type SubmoduleGraphNode = Node<SubmoduleNodeData, "submodule">;
export type CommitEdge = Edge<{ isMerge: boolean; color: string }>;

// Node dimensions for different modes
const NODE_WIDTH_NORMAL = 280;
const NODE_HEIGHT_NORMAL = 100;
const NODE_WIDTH_COMPACT = 200;
const NODE_HEIGHT_COMPACT = 60;

interface LayoutOptions {
  direction: "TB" | "LR";
  nodeSpacing: number;
  rankSpacing: number;
}

export interface GraphSettings {
  compactMode: boolean;
  colorByAuthor: boolean;
  highlightedCommits: Set<string>;
}

// Simple vertical layout fallback when dagre can't be used (e.g., cycles detected)
function createSimpleLayout(
  commits: Commit[],
  graphSettings: GraphSettings,
): { nodes: CommitNode[]; edges: CommitEdge[] } {
  const { compactMode, colorByAuthor, highlightedCommits } = graphSettings;
  const nodeHeight = compactMode ? NODE_HEIGHT_COMPACT : NODE_HEIGHT_NORMAL;
  const spacing = compactMode ? 20 : 40;

  const colorMap = colorByAuthor
    ? assignAuthorColors(commits)
    : assignBranchColors(commits);

  const commitSet = new Set(commits.map((c) => c.hash));

  const nodes: CommitNode[] = commits.map((commit, index) => ({
    id: commit.hash,
    type: "commit",
    position: {
      x: 50,
      y: index * (nodeHeight + spacing),
    },
    data: {
      commit,
      color: colorMap.get(commit.hash) || "#888",
      isCompact: compactMode,
      isHighlighted: highlightedCommits.has(commit.hash),
    },
  }));

  const edges: CommitEdge[] = [];
  const addedEdges = new Set<string>();

  for (const commit of commits) {
    for (let i = 0; i < commit.parents.length; i++) {
      const parentHash = commit.parents[i];
      if (parentHash === commit.hash) continue;
      if (!commitSet.has(parentHash)) continue;
      const edgeKey = `${commit.hash}->${parentHash}`;
      if (addedEdges.has(edgeKey)) continue;
      addedEdges.add(edgeKey);

      edges.push({
        id: `${commit.hash}-${parentHash}`,
        source: commit.hash,
        target: parentHash,
        type: "smoothstep",
        style: {
          stroke: colorMap.get(commit.hash) || "#888",
          strokeWidth: 2,
        },
        data: {
          isMerge: i > 0,
          color: colorMap.get(commit.hash) || "#888",
        },
      });
    }
  }

  return { nodes, edges };
}

// Detect cycles in commit graph using iterative DFS (avoids stack overflow)
function hasCycle(commits: Commit[]): boolean {
  const commitMap = new Map(commits.map((c) => [c.hash, c]));
  const visited = new Set<string>();
  const finished = new Set<string>();

  for (const startCommit of commits) {
    if (visited.has(startCommit.hash)) continue;

    // Iterative DFS with explicit stack
    const stack: Array<{ hash: string; parentIndex: number }> = [
      { hash: startCommit.hash, parentIndex: 0 },
    ];
    const path = new Set<string>();

    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      const commit = commitMap.get(current.hash);

      if (current.parentIndex === 0) {
        // First visit to this node
        if (path.has(current.hash)) {
          console.error(`Cycle detected in commit graph at ${current.hash}`);
          return true;
        }
        if (finished.has(current.hash)) {
          stack.pop();
          continue;
        }
        visited.add(current.hash);
        path.add(current.hash);
      }

      // Find next unvisited parent
      let foundNext = false;
      if (commit) {
        while (current.parentIndex < commit.parents.length) {
          const parentHash = commit.parents[current.parentIndex];
          current.parentIndex++;

          if (parentHash === current.hash) continue; // Skip self-loop
          if (!commitMap.has(parentHash)) continue; // Skip external parents

          if (path.has(parentHash)) {
            console.error(`Cycle detected in commit graph at ${parentHash}`);
            return true;
          }

          if (!finished.has(parentHash)) {
            stack.push({ hash: parentHash, parentIndex: 0 });
            foundNext = true;
            break;
          }
        }
      }

      if (!foundNext) {
        // Done with this node
        path.delete(current.hash);
        finished.add(current.hash);
        stack.pop();
      }
    }
  }
  return false;
}

// Threshold for using simple layout instead of dagre (to avoid stack overflow)
const DAGRE_MAX_COMMITS = 5000;

export function layoutCommitGraph(
  commits: Commit[],
  options: LayoutOptions = {
    direction: "TB",
    nodeSpacing: 40,
    rankSpacing: 80,
  },
  graphSettings: GraphSettings = {
    compactMode: false,
    colorByAuthor: false,
    highlightedCommits: new Set(),
  },
): { nodes: CommitNode[]; edges: CommitEdge[] } {
  if (commits.length === 0) {
    return { nodes: [], edges: [] };
  }

  // For large repos, skip dagre entirely to avoid stack overflow in its recursive DFS
  if (commits.length > DAGRE_MAX_COMMITS) {
    console.warn(
      `Large repo (${commits.length} commits) - using simple layout to avoid stack overflow`,
    );
    return createSimpleLayout(commits, graphSettings);
  }

  // Check for cycles which would cause dagre to stack overflow
  if (hasCycle(commits)) {
    console.error(
      "Commit graph contains cycles - cannot layout. Returning simple vertical layout.",
    );
    return createSimpleLayout(commits, graphSettings);
  }

  const { compactMode, colorByAuthor, highlightedCommits } = graphSettings;

  // Select node dimensions based on compact mode
  const nodeWidth = compactMode ? NODE_WIDTH_COMPACT : NODE_WIDTH_NORMAL;
  const nodeHeight = compactMode ? NODE_HEIGHT_COMPACT : NODE_HEIGHT_NORMAL;

  // Adjust spacing for compact mode
  const nodeSpacing = compactMode
    ? options.nodeSpacing * 0.6
    : options.nodeSpacing;
  const rankSpacing = compactMode
    ? options.rankSpacing * 0.6
    : options.rankSpacing;

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

  const commitSet = new Set(commits.map((c) => c.hash));

  // Add nodes
  for (const commit of commits) {
    g.setNode(commit.hash, { width: nodeWidth, height: nodeHeight });
  }

  // Add edges (child -> parent)
  // Track added edges to prevent duplicates which can cause cycles in dagre
  const addedEdges = new Set<string>();
  const edges: CommitEdge[] = [];
  for (const commit of commits) {
    for (let i = 0; i < commit.parents.length; i++) {
      const parentHash = commit.parents[i];
      // Skip self-loops (would cause infinite recursion in dagre DFS)
      if (parentHash === commit.hash) {
        console.warn(
          `Skipping self-loop: commit ${commit.hash} references itself as parent`,
        );
        continue;
      }
      // Skip if parent not in our commit set
      if (!commitSet.has(parentHash)) {
        continue;
      }
      // Skip duplicate edges (same parent listed multiple times)
      const edgeKey = `${commit.hash}->${parentHash}`;
      if (addedEdges.has(edgeKey)) {
        continue;
      }
      addedEdges.add(edgeKey);

      g.setEdge(commit.hash, parentHash);
      edges.push({
        id: `${commit.hash}-${parentHash}`,
        source: commit.hash,
        target: parentHash,
        type: "smoothstep",
        style: {
          stroke: colorMap.get(commit.hash) || "#888",
          strokeWidth: 2,
        },
        data: {
          isMerge: i > 0,
          color: colorMap.get(commit.hash) || "#888",
        },
      });
    }
  }

  // Run layout
  dagre.layout(g);

  // Extract positioned nodes
  const nodes: CommitNode[] = commits.map((commit) => {
    const nodeWithPosition = g.node(commit.hash);
    return {
      id: commit.hash,
      type: "commit",
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
      data: {
        commit,
        color: colorMap.get(commit.hash) || "#888",
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
  options: SubmoduleLayoutOptions,
): SubmoduleGraphNode[] {
  if (submodules.length === 0) return [];

  const { isCompact, selectedSubmodulePath, onNavigate } = options;

  // Select node dimensions based on compact mode
  const nodeWidth = isCompact
    ? SUBMODULE_WIDTH_COMPACT
    : SUBMODULE_WIDTH_NORMAL;
  const spacing = isCompact ? 20 : 30;

  // Find the bottom of the commit graph
  let maxY = 0;
  let minX = Infinity;
  let maxX = -Infinity;

  for (const node of commitNodes) {
    const nodeBottom = node.position.y + (isCompact ? 60 : 100);
    if (nodeBottom > maxY) maxY = nodeBottom;
    if (node.position.x < minX) minX = node.position.x;
    if (node.position.x > maxX)
      maxX = node.position.x + (isCompact ? 200 : 280);
  }

  // Position submodule nodes below the graph, centered horizontally
  const totalWidth =
    submodules.length * nodeWidth + (submodules.length - 1) * spacing;
  const graphWidth = maxX - minX;
  const startX = minX + (graphWidth - totalWidth) / 2;
  const startY = maxY + 60; // Gap below commits

  return submodules.map((submodule, index) => ({
    id: `submodule-${submodule.path}`,
    type: "submodule" as const,
    position: {
      x: startX + index * (nodeWidth + spacing),
      y: startY,
    },
    data: {
      submodule,
      color: "#14b8a6", // teal-500
      isCompact,
      isSelected: selectedSubmodulePath === submodule.path,
      onNavigate,
    },
  }));
}
