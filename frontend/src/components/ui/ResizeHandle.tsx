import { useCallback, useEffect, useRef } from 'react';

interface ResizeHandleProps {
  side: 'left' | 'right';
  onResize: (delta: number) => void;
  onResizeEnd?: () => void;
}

export function ResizeHandle({ side, onResize, onResizeEnd }: ResizeHandleProps) {
  const isDragging = useRef(false);
  const startX = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    startX.current = e.clientX;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return;

    const delta = e.clientX - startX.current;
    startX.current = e.clientX;

    // For left panel, positive delta increases width
    // For right panel, negative delta increases width
    const adjustedDelta = side === 'left' ? delta : -delta;
    onResize(adjustedDelta);
  }, [side, onResize]);

  const handleMouseUp = useCallback(() => {
    if (isDragging.current) {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      onResizeEnd?.();
    }
  }, [onResizeEnd]);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div
      onMouseDown={handleMouseDown}
      className={`
        w-1 cursor-col-resize hover:bg-blue-500 active:bg-blue-600
        transition-colors flex-shrink-0 relative group
        ${side === 'left' ? '-mr-0.5' : '-ml-0.5'}
      `}
      title="Drag to resize"
    >
      <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-blue-500/20" />
    </div>
  );
}
