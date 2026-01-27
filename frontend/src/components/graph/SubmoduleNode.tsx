import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import type { Submodule } from "../../types";

export interface SubmoduleNodeData {
  submodule: Submodule;
  color: string;
  isCompact: boolean;
  isSelected: boolean;
  onNavigate?: (submodulePath: string) => void;
}

interface SubmoduleNodeProps {
  data: SubmoduleNodeData;
  selected?: boolean;
}

function arePropsEqual(
  prev: SubmoduleNodeProps,
  next: SubmoduleNodeProps,
): boolean {
  return (
    prev.data.submodule.path === next.data.submodule.path &&
    prev.data.submodule.currentCommit === next.data.submodule.currentCommit &&
    prev.data.isCompact === next.data.isCompact &&
    prev.data.isSelected === next.data.isSelected &&
    prev.selected === next.selected
  );
}

export const SubmoduleNode = memo(function SubmoduleNode({
  data,
  selected,
}: SubmoduleNodeProps) {
  const { submodule, isCompact, isSelected, onNavigate } = data;

  // Hexagonal shape using clip-path
  const hexagonStyle = {
    clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
  };

  const handleClick = () => {
    if (onNavigate && submodule.initialized) {
      onNavigate(submodule.path);
    }
  };

  if (isCompact) {
    return (
      <div
        onClick={handleClick}
        className={`
          relative cursor-pointer transition-all duration-200
          ${selected || isSelected ? "scale-110" : "hover:scale-105"}
        `}
      >
        <Handle type="target" position={Position.Top} className="opacity-0" />
        <Handle
          type="source"
          position={Position.Bottom}
          className="opacity-0"
        />

        {/* Hexagon shape */}
        <div
          style={hexagonStyle}
          className={`
            w-16 h-14 flex items-center justify-center
            ${selected || isSelected ? "ring-2 ring-teal-400 ring-offset-2" : ""}
          `}
        >
          <div
            className={`
              w-full h-full flex flex-col items-center justify-center
              ${submodule.initialized ? "bg-teal-500" : "bg-teal-300"}
            `}
            style={hexagonStyle}
          >
            {/* Submodule icon */}
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <span className="text-[10px] text-white font-medium truncate max-w-[48px] px-1">
              {submodule.name}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      className={`
        relative cursor-pointer transition-all duration-200
        ${selected || isSelected ? "scale-105" : "hover:scale-102"}
      `}
    >
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Handle type="source" position={Position.Bottom} className="opacity-0" />

      {/* Card container */}
      <div
        className={`
          w-48 rounded-lg border-2 overflow-hidden shadow-sm
          ${
            selected || isSelected
              ? "border-teal-400 shadow-teal-200 shadow-md"
              : "border-teal-200 hover:border-teal-300"
          }
          ${submodule.initialized ? "bg-teal-50" : "bg-teal-50/50"}
        `}
      >
        {/* Header with color accent */}
        <div
          className={`h-1 ${submodule.initialized ? "bg-teal-500" : "bg-teal-300"}`}
        />

        <div className="p-3">
          {/* Name with icon */}
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-teal-600 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <span className="font-medium text-sm text-teal-900 truncate">
              {submodule.name}
            </span>
          </div>

          {/* Path (if different) */}
          {submodule.path !== submodule.name && (
            <div className="mt-1 text-xs text-teal-600 truncate">
              {submodule.path}
            </div>
          )}

          {/* Commit hash and status */}
          <div className="mt-2 flex items-center gap-2">
            <span className="font-mono text-xs text-teal-700 bg-teal-100 px-1.5 py-0.5 rounded">
              {submodule.currentCommit.substring(0, 7)}
            </span>
            {!submodule.initialized && (
              <span className="text-xs text-yellow-600 bg-yellow-100 px-1.5 py-0.5 rounded">
                not initialized
              </span>
            )}
          </div>

          {/* Navigate hint */}
          {submodule.initialized && (
            <div className="mt-2 text-xs text-teal-600 flex items-center gap-1">
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
              Click to open
            </div>
          )}
        </div>
      </div>
    </div>
  );
}, arePropsEqual);
