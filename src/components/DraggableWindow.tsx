import React, { useState, useRef, useEffect } from 'react';
import { Minus, Square, X } from 'lucide-react';

interface DraggableWindowProps {
  id: string;
  title: string;
  icon?: React.ReactNode;
  initialPos?: { x: number; y: number };
  initialSize?: { width: number | string; height: number | string };
  minWidth?: number;
  minHeight?: number;
  isOpen: boolean;
  zIndex: number;
  onClose: () => void;
  onMinimize?: () => void;
  onFocus: () => void;
  children: React.ReactNode;
  className?: string;
  headerRightExtra?: React.ReactNode;
}

export const DraggableWindow: React.FC<DraggableWindowProps> = ({
  title,
  icon,
  initialPos = { x: 100, y: 80 },
  initialSize = { width: 440, height: 480 },
  minWidth = 320,
  minHeight = 240,
  isOpen,
  zIndex,
  onClose,
  onMinimize,
  onFocus,
  children,
  className = '',
  headerRightExtra,
}) => {
  const [pos, setPos] = useState(initialPos);
  const [isMaximized, setIsMaximized] = useState(false);
  const isDraggingRef = useRef(false);
  const dragStartOffsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setPos(initialPos);
    return () => {
      document.body.classList.remove('is-dragging');
    };
  }, []);

  const handleMouseDownHeader = (e: React.MouseEvent<HTMLDivElement>) => {
    // If clicking a button, don't drag
    if ((e.target as HTMLElement).closest('button')) return;
    if (isMaximized) return;

    isDraggingRef.current = true;
    document.body.classList.add('is-dragging');
    dragStartOffsetRef.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    };
    onFocus();

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const newX = Math.max(10, Math.min(window.innerWidth - 120, moveEvent.clientX - dragStartOffsetRef.current.x));
      const newY = Math.max(10, Math.min(window.innerHeight - 80, moveEvent.clientY - dragStartOffsetRef.current.y));
      setPos({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      document.body.classList.remove('is-dragging');
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  if (!isOpen) return null;

  return (
    <div
      onMouseDown={onFocus}
      style={{
        position: 'fixed',
        left: isMaximized ? 0 : pos.x,
        top: isMaximized ? 0 : pos.y,
        width: isMaximized ? '100vw' : typeof initialSize.width === 'number' ? `${initialSize.width}px` : initialSize.width,
        height: isMaximized ? 'calc(100vh - 48px)' : typeof initialSize.height === 'number' ? `${initialSize.height}px` : initialSize.height,
        minWidth: isMaximized ? undefined : `${minWidth}px`,
        minHeight: isMaximized ? undefined : `${minHeight}px`,
        zIndex: zIndex,
      }}
      className={`bg-neutral-900 border-[2.5px] border-slate-900/90 rounded-2xl shadow-[0_16px_36px_rgba(0,0,0,0.65)] flex flex-col overflow-hidden text-neutral-100 select-none ${className}`}
    >
      {/* Title bar - Clean cartoon retro OS style matching screenshot */}
      <div
        onMouseDown={handleMouseDownHeader}
        className="bg-[#f8fafc] text-slate-900 px-3.5 py-1.5 flex items-center justify-between border-b-2 border-slate-300 cursor-grab active:cursor-grabbing shrink-0 select-none shadow-sm"
      >
        <div className="flex items-center gap-2 pointer-events-none truncate pr-2">
          {icon && <div className="shrink-0">{icon}</div>}
          <span className="text-xs font-sans font-black text-slate-900 tracking-tight truncate">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {headerRightExtra}
          {onMinimize && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMinimize();
              }}
              title="Minimize"
              className="w-6 h-5 flex items-center justify-center hover:bg-slate-200 text-slate-700 hover:text-black rounded transition-colors cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMaximized(!isMaximized);
            }}
            title={isMaximized ? "Restore" : "Maximize"}
            className="w-6 h-5 flex items-center justify-center hover:bg-slate-200 text-slate-700 hover:text-black rounded transition-colors cursor-pointer"
          >
            <Square className="w-3 h-3 stroke-[3]" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            title="Close"
            className="w-6 h-5 flex items-center justify-center bg-rose-500/15 hover:bg-rose-600 text-rose-700 hover:text-white rounded transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5 stroke-[3]" />
          </button>
        </div>
      </div>

      {/* Window Body */}
      <div className="flex-1 overflow-hidden flex flex-col relative bg-neutral-950">
        {children}
      </div>
    </div>
  );
};
