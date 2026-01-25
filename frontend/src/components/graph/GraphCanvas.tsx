import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  BackgroundVariant,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { CommitNode } from './CommitNode';
import { GraphToolbar } from './GraphToolbar';
import { UploadZone } from '../inputs/UploadZone';
import { useRepositoryStore } from '../../store/repositoryStore';
import { layoutCommitGraph } from '../../utils/layoutEngine';

const nodeTypes = { commit: CommitNode } as const;

export function GraphCanvas() {
  const {
    repository,
    selectedCommit,
    setSelectedCommit,
    searchQuery,
    graphSettings,
    highlightedCommits,
  } = useRepositoryStore();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { fitView, setCenter, getZoom } = useReactFlow();
  const prevSelectedCommitRef = useRef<string | null>(null);
  const prevFilteredCommitsRef = useRef<typeof filteredCommits>([]);

  // Filter commits based on search and merge commit settings
  const filteredCommits = useMemo(() => {
    if (!repository?.commits) return [];

    let commits = repository.commits;

    // Filter out merge commits if setting is enabled
    if (graphSettings.hideMergeCommits) {
      commits = commits.filter(commit => commit.parents.length <= 1);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      commits = commits.filter(commit =>
        commit.message.toLowerCase().includes(query) ||
        commit.hash.toLowerCase().includes(query) ||
        commit.shortHash.toLowerCase().includes(query) ||
        commit.author.name.toLowerCase().includes(query) ||
        commit.refs.some(ref => ref.name.toLowerCase().includes(query))
      );
    }

    return commits;
  }, [repository?.commits, searchQuery, graphSettings.hideMergeCommits]);

  // Memoize layout calculation - only recalculate when commits or layout-affecting settings change
  // CRITICAL: Do NOT include selectedCommit or highlightedCommits here to avoid expensive re-layouts
  const { layoutedNodes, layoutedEdges } = useMemo(() => {
    if (filteredCommits.length === 0) {
      return { layoutedNodes: [], layoutedEdges: [] };
    }

    const { nodes: layoutedNodes, edges: layoutedEdges } = layoutCommitGraph(
      filteredCommits,
      { direction: 'TB', nodeSpacing: 40, rankSpacing: 80 },
      {
        compactMode: graphSettings.compactMode,
        colorByAuthor: graphSettings.colorByAuthor,
        highlightedCommits: new Set<string>(), // Empty set - highlighting applied separately
      }
    );

    return { layoutedNodes, layoutedEdges };
  }, [filteredCommits, graphSettings.compactMode, graphSettings.colorByAuthor]);

  // Apply selection and highlighting WITHOUT re-running layout
  useEffect(() => {
    if (layoutedNodes.length > 0) {
      // Update nodes with selection and highlighting (O(n) but no layout recalc)
      const nodesWithState = layoutedNodes.map(node => ({
        ...node,
        selected: selectedCommit?.hash === node.id,
        data: {
          ...node.data,
          isHighlighted: highlightedCommits.has(node.id),
        },
      }));

      setNodes(nodesWithState as Node[]);
      setEdges(layoutedEdges as Edge[]);

      // Fit view only when commits change, not on selection
      const commitsChanged = prevFilteredCommitsRef.current !== filteredCommits;
      if (commitsChanged) {
        prevFilteredCommitsRef.current = filteredCommits;
        setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 100);
      }
    } else {
      setNodes([]);
      setEdges([]);
    }
  }, [layoutedNodes, layoutedEdges, selectedCommit, highlightedCommits, filteredCommits, setNodes, setEdges, fitView]);

  // Zoom to selected commit when it changes
  useEffect(() => {
    if (selectedCommit && prevSelectedCommitRef.current !== selectedCommit.hash) {
      const selectedNode = nodes.find(node => node.id === selectedCommit.hash);
      if (selectedNode) {
        // Calculate center position of the node
        const nodeWidth = graphSettings.compactMode ? 200 : 280;
        const nodeHeight = graphSettings.compactMode ? 60 : 100;
        const centerX = selectedNode.position.x + nodeWidth / 2;
        const centerY = selectedNode.position.y + nodeHeight / 2;

        // Zoom to the selected commit with a nice zoom level
        const currentZoom = getZoom();
        const targetZoom = Math.max(currentZoom, 1.2); // Zoom in but not too much

        setTimeout(() => {
          setCenter(centerX, centerY, { zoom: targetZoom, duration: 500 });
        }, 50);
      }
    }
    prevSelectedCommitRef.current = selectedCommit?.hash || null;
  }, [selectedCommit, nodes, graphSettings.compactMode, setCenter, getZoom]);

  // Handle node click
  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    const commit = repository?.commits.find(c => c.hash === node.id);
    if (commit) {
      setSelectedCommit(selectedCommit?.hash === commit.hash ? null : commit);
    }
  }, [repository?.commits, selectedCommit, setSelectedCommit]);

  if (!repository) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full px-6">
          <div className="text-center mb-6">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <p className="text-lg font-medium text-gray-700">Visualize Your Git History</p>
            <p className="text-sm text-gray-500 mt-1">Select a project folder or enter a local path above</p>
          </div>

          <UploadZone />

          <div className="mt-6 text-center text-xs text-gray-400">
            <p>The app will automatically detect the .git folder</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <GraphToolbar />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: false,
        }}
        proOptions={{ hideAttribution: true }}
        // Performance: Only render nodes/edges visible in viewport
        onlyRenderVisibleElements
      >
        <Controls position="bottom-right" />
        <MiniMap
          nodeColor={(node) => (node.data as { color?: string })?.color || '#888'}
          maskColor="rgba(0, 0, 0, 0.1)"
          position="bottom-left"
        />
        <Background variant={BackgroundVariant.Dots} gap={20} color="#e5e7eb" />
      </ReactFlow>
    </div>
  );
}
