import { useCallback, useEffect, useMemo } from 'react';
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
import { UploadZone } from '../inputs/UploadZone';
import { useRepositoryStore } from '../../store/repositoryStore';
import { layoutCommitGraph } from '../../utils/layoutEngine';

const nodeTypes = { commit: CommitNode } as const;

export function GraphCanvas() {
  const { repository, selectedCommit, setSelectedCommit, searchQuery } = useRepositoryStore();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { fitView } = useReactFlow();

  // Filter commits based on search
  const filteredCommits = useMemo(() => {
    if (!repository?.commits) return [];
    if (!searchQuery.trim()) return repository.commits;

    const query = searchQuery.toLowerCase();
    return repository.commits.filter(commit =>
      commit.message.toLowerCase().includes(query) ||
      commit.hash.toLowerCase().includes(query) ||
      commit.shortHash.toLowerCase().includes(query) ||
      commit.author.name.toLowerCase().includes(query) ||
      commit.refs.some(ref => ref.name.toLowerCase().includes(query))
    );
  }, [repository?.commits, searchQuery]);

  // Layout commits when repository or search changes
  useEffect(() => {
    if (filteredCommits.length > 0) {
      const { nodes: layoutedNodes, edges: layoutedEdges } = layoutCommitGraph(filteredCommits);

      // Mark selected node
      const nodesWithSelection = layoutedNodes.map(node => ({
        ...node,
        selected: selectedCommit?.hash === node.id,
      }));

      setNodes(nodesWithSelection as Node[]);
      setEdges(layoutedEdges as Edge[]);

      setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 100);
    } else {
      setNodes([]);
      setEdges([]);
    }
  }, [filteredCommits, selectedCommit, setNodes, setEdges, fitView]);

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
    <div className="w-full h-full">
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
