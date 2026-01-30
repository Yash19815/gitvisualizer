import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  useViewport,
  BackgroundVariant,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { CommitNode } from "./CommitNode";
import { SubmoduleNode } from "./SubmoduleNode";
import { GraphToolbar } from "./GraphToolbar";
import { UploadZone } from "../inputs/UploadZone";
import { useRepositoryStore } from "../../store/repositoryStore";
import {
  layoutCommitGraph,
  layoutSubmoduleNodes,
} from "../../utils/layoutEngine";
import { Legend } from "./Legend";

const nodeTypes = {
  commit: CommitNode,
  submodule: SubmoduleNode,
} as const;

export function GraphCanvas() {
  const {
    repository,
    selectedCommit,
    setSelectedCommit,
    searchQuery,
    graphSettings,
    highlightedCommits,
    submodules,
    selectedSubmodule,
    setSelectedSubmodule,
    navigateToSubmodule,
    darkMode,
    isLoading,
    loadingMessage,
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
      commits = commits.filter((commit) => commit.parents.length <= 1);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      commits = commits.filter(
        (commit) =>
          commit.message.toLowerCase().includes(query) ||
          commit.hash.toLowerCase().includes(query) ||
          commit.shortHash.toLowerCase().includes(query) ||
          commit.author.name.toLowerCase().includes(query) ||
          commit.refs.some((ref) => ref.name.toLowerCase().includes(query)),
      );
    }

    return commits;
  }, [repository?.commits, searchQuery, graphSettings.hideMergeCommits]);

  // Memoize layout calculation - only recalculate when commits or layout-affecting settings change
  // CRITICAL: Do NOT include selectedCommit or highlightedCommits here to avoid expensive re-layouts
  const { layoutedNodes, layoutedEdges, submoduleNodes, branchColorMap } =
    useMemo(() => {
      if (filteredCommits.length === 0) {
        return {
          layoutedNodes: [],
          layoutedEdges: [],
          submoduleNodes: [],
          branchColorMap: new Map<string, string>(),
        };
      }

      const {
        nodes: layoutedNodes,
        edges: layoutedEdges,
        branchColorMap,
      } = layoutCommitGraph(
        filteredCommits,
        { direction: "TB", nodeSpacing: 40, rankSpacing: 80 },
        {
          compactMode: graphSettings.compactMode,
          colorByAuthor: graphSettings.colorByAuthor,
          highlightedCommits: new Set<string>(), // Empty set - highlighting applied separately
        },
      );

      // Layout submodule nodes below the commit graph
      const submoduleNodes =
        submodules && submodules.length > 0
          ? layoutSubmoduleNodes(submodules, layoutedNodes, {
              isCompact: graphSettings.compactMode,
              selectedSubmodulePath: selectedSubmodule?.path,
              onNavigate: navigateToSubmodule,
            })
          : [];

      return { layoutedNodes, layoutedEdges, submoduleNodes, branchColorMap };
    }, [
      filteredCommits,
      graphSettings.compactMode,
      graphSettings.colorByAuthor,
      submodules,
      selectedSubmodule?.path,
      navigateToSubmodule,
    ]);

  const { x, y, zoom } = useViewport();

  // Virtualization: Filter nodes based on current viewport
  useEffect(() => {
    if (layoutedNodes.length > 0 || submoduleNodes.length > 0) {
      // Calculate viewport bounds in graph coordinates
      // Viewport transform: [x, y, zoom]
      // Graph coordinate = (Screen coordinate - x) / zoom

      // Get container dimensions (fallback to window if not available)
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Add a generous buffer (e.g., 1 viewport size in all directions) to prevent popping during scroll
      const bufferX = width / zoom;
      const bufferY = height / zoom;

      const minX = -x / zoom - bufferX;
      const maxX = (-x + width) / zoom + bufferX;
      const minY = -y / zoom - bufferY;
      const maxY = (-y + height) / zoom + bufferY;

      // Filter nodes that are roughly within visible area
      const visibleNodes = layoutedNodes.filter((node) => {
        const nodeX = node.position.x;
        const nodeY = node.position.y;
        // Simple bounding box check (assuming max node size ~300x100)
        return nodeX >= minX && nodeX <= maxX && nodeY >= minY && nodeY <= maxY;
      });

      // Update visible commit nodes with selection and highlighting
      const visibleCommitNodesWithState = visibleNodes.map((node) => ({
        ...node,
        selected: selectedCommit?.hash === node.id,
        data: {
          ...node.data,
          isHighlighted: highlightedCommits.has(node.id),
        },
      }));

      // Combine visible commit nodes with submodule nodes (always show submodules for now as they are few)
      const allVisibleNodes = [
        ...visibleCommitNodesWithState,
        ...submoduleNodes,
      ];

      // Filter edges: keep edges where BOTH source and target are visible
      // Optimization: For large graphs, we might also want to show edges connected to visible nodes
      // even if one end is off-screen, but for pure performance, strict visibility is faster.
      const visibleNodeIds = new Set(allVisibleNodes.map((n) => n.id));
      const visibleEdges = layoutedEdges.filter(
        (edge) =>
          visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target),
      );

      setNodes(allVisibleNodes as Node[]);
      setEdges(visibleEdges as Edge[]);

      // Fit view only when commits change, not on selection or pan/zoom
      const commitsChanged = prevFilteredCommitsRef.current !== filteredCommits;
      if (commitsChanged) {
        prevFilteredCommitsRef.current = filteredCommits;
        // Don't fit view constantly during virtualization updates
        // Only on initial load of new data
        if (visibleNodes.length === 0 && layoutedNodes.length > 0) {
          setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 100);
        }
      }
    } else {
      setNodes([]);
      setEdges([]);
    }
  }, [
    layoutedNodes,
    layoutedEdges,
    submoduleNodes,
    selectedCommit,
    highlightedCommits,
    filteredCommits,
    setNodes,
    setEdges,
    fitView,
    x,
    y,
    zoom, // Re-run when viewport changes
  ]);

  // Zoom to selected commit when it changes
  useEffect(() => {
    if (
      selectedCommit &&
      prevSelectedCommitRef.current !== selectedCommit.hash
    ) {
      console.log(
        "[Zoom] Selected commit changed to:",
        selectedCommit.hash.substring(0, 7),
      );
      const selectedNode = nodes.find(
        (node) => node.id === selectedCommit.hash,
      );
      console.log(
        "[Zoom] Node found in nodes array:",
        selectedNode ? "YES" : "NO",
        "| Total nodes:",
        nodes.length,
      );

      if (selectedNode) {
        // Calculate center position of the node
        const nodeWidth = graphSettings.compactMode ? 200 : 280;
        const nodeHeight = graphSettings.compactMode ? 60 : 100;
        const centerX = selectedNode.position.x + nodeWidth / 2;
        const centerY = selectedNode.position.y + nodeHeight / 2;

        // Zoom to the selected commit with a nice zoom level
        const currentZoom = getZoom();
        const targetZoom = Math.max(currentZoom, 1.2); // Zoom in but not too much

        console.log("[Zoom] Zooming to position:", {
          x: Math.round(centerX),
          y: Math.round(centerY),
          zoom: targetZoom,
        });

        setTimeout(() => {
          setCenter(centerX, centerY, { zoom: targetZoom, duration: 500 });
        }, 50);
      } else {
        console.warn(
          "[Zoom] Cannot zoom - selected commit node not found in rendered nodes. Commit may be filtered out.",
        );
      }
    }
    prevSelectedCommitRef.current = selectedCommit?.hash || null;
  }, [selectedCommit, nodes, graphSettings.compactMode, setCenter, getZoom]);

  // Handle node click
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      // Check if it's a submodule node
      if (node.type === "submodule") {
        const submodule = submodules?.find((s) => s.path === node.id);
        if (submodule) {
          // Toggle selection or navigate if already selected
          if (selectedSubmodule?.path === submodule.path) {
            // Double-click behavior: navigate into the submodule
            if (submodule.initialized) {
              navigateToSubmodule(submodule.path);
            }
          } else {
            setSelectedSubmodule(submodule);
          }
        }
        return;
      }

      // Handle commit node click
      const commit = repository?.commits.find((c) => c.hash === node.id);
      if (commit) {
        setSelectedCommit(selectedCommit?.hash === commit.hash ? null : commit);
      }
    },
    [
      repository?.commits,
      selectedCommit,
      setSelectedCommit,
      submodules,
      selectedSubmodule,
      setSelectedSubmodule,
      navigateToSubmodule,
    ],
  );

  const handleNavigateToBranch = useCallback(
    (branchName: string) => {
      console.log(
        "[Branch Nav] Clicked:",
        branchName,
        "| Total commits:",
        repository?.commits.length,
      );
      if (!repository) return;

      // Find the branch in repository.branches
      const branch = repository.branches.find((b) => b.name === branchName);
      let commitHash = branch?.commit;
      console.log(
        "[Branch Nav] Found branch object:",
        branch ? `yes (commit: ${branch.commit.substring(0, 7)})` : "NO",
      );

      // If not found in branches list (e.g. detached ref or tag treated as branch in colors), search commits
      if (!commitHash) {
        const commit = repository.commits.find((c) =>
          c.refs.some((r) => r.name === branchName),
        );
        if (commit) {
          commitHash = commit.hash;
        } else {
          console.warn(
            `Branch "${branchName}" found in legend but its commit is not in the loaded commits. ` +
              `This might be because the commit was filtered out or hasn't been loaded yet due to streaming.`,
          );
          return; // Exit early if we can't find the commit
        }
      }

      if (commitHash) {
        // Try multiple hash matching strategies
        let commit = repository.commits.find((c) => c.hash === commitHash);

        // If not found and commitHash looks like it might be short, try startsWith
        if (!commit && commitHash.length < 40) {
          commit = repository.commits.find((c) =>
            c.hash.startsWith(commitHash),
          );
        }

        // Also try comparing with commit.shortHash field
        if (!commit) {
          commit = repository.commits.find((c) => c.shortHash === commitHash);
        }

        console.log(
          "[Branch Nav] Commit found in repository.commits:",
          commit ? "YES ✓" : "NO ✗",
        );

        if (!commit) {
          console.log(
            "[Branch Nav] Branch commit hash:",
            commitHash,
            `(length: ${commitHash.length})`,
          );
          if (repository.commits.length > 0) {
            console.log("[Branch Nav] Sample commit from array:", {
              hash: repository.commits[0].hash,
              shortHash: repository.commits[0].shortHash,
            });
          }
        }

        if (commit) {
          setSelectedCommit(commit);
        } else {
          console.warn(
            `Branch "${branchName}" points to commit ${commitHash} which is not in the loaded commits. ` +
              `The commit may have been filtered out.`,
          );
        }
      }
    },
    [repository, setSelectedCommit],
  );

  // Handle pane click (clicking on blank canvas)
  // IMPORTANT: This must be defined BEFORE the early return to maintain consistent hook order
  const onPaneClick = useCallback(() => {
    setSelectedCommit(null);
    // Optionally fit view to show entire graph
    setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 50);
  }, [setSelectedCommit, fitView]);

  // Show loading state when repository is being loaded
  // OR when streaming has started but no commits loaded yet
  if (isLoading && (!repository || repository.commits.length === 0)) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          {loadingMessage && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {loadingMessage}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!repository) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full px-6">
          <div className="text-center mb-6">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
              Visualize Your Git History
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Select a project folder or enter a local path above
            </p>
          </div>

          <UploadZone />

          <div className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500">
            <p>The app will automatically detect the .git folder</p>
          </div>
        </div>
      </div>
    );
  }

  // Debug logging
  console.log("[GraphCanvas] Repository:", {
    name: repository.name,
    commitsCount: repository.commits.length,
    filteredCommitsCount: filteredCommits.length,
    layoutedNodesCount: layoutedNodes.length,
    isLoading,
  });

  // Check if repository has commits but can't render
  if (
    !isLoading &&
    repository.commits.length > 0 &&
    layoutedNodes.length === 0
  ) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md text-center px-6">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-red-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            Unable to Render Graph
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Repository loaded with {repository.commits.length} commits but graph
            layout failed.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
            Check the browser console (F12) for more details.
          </p>
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
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
        zoomOnScroll={true}
        panOnScroll={false}
        zoomActivationKeyCode={null}
        defaultEdgeOptions={{
          type: "smoothstep",
          animated: false,
        }}
        proOptions={{ hideAttribution: true }}
        // Performance: Only render nodes/edges visible in viewport
        onlyRenderVisibleElements
      >
        <Controls position="bottom-right" />
        <MiniMap
          nodeColor={(node) =>
            (node.data as { color?: string })?.color || "#888"
          }
          maskColor={darkMode ? "rgba(0, 0, 0, 0.4)" : "rgba(0, 0, 0, 0.15)"}
          style={{
            backgroundColor: darkMode ? "#1f2937" : "#f9fafb",
            borderRadius: "8px",
            border: darkMode ? "1px solid #374151" : "1px solid #e5e7eb",
            boxShadow:
              "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          }}
          position="bottom-left"
          pannable
          zoomable
        />
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          color={darkMode ? "#374151" : "#e5e7eb"}
        />
      </ReactFlow>

      {/* Legend - Only show if not coloring by author (where map is empty) */}
      {!graphSettings.colorByAuthor &&
        branchColorMap &&
        branchColorMap.size > 0 && (
          <Legend
            branchColors={
              // Filter to only show actual branches from repository.branches, not tags or other refs
              new Map(
                Array.from(branchColorMap.entries()).filter(([name]) =>
                  repository?.branches.some((b) => b.name === name),
                ),
              )
            }
            onBranchClick={handleNavigateToBranch}
          />
        )}
    </div>
  );
}
