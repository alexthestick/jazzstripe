import React, { useState, useRef, useCallback } from 'react';

const DraggableTag = ({ tag, updateTag, deleteTag, onSelect }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const tagRef = useRef(null);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - (tag.x * window.innerWidth / 100),
      y: e.clientY - (tag.y * window.innerHeight / 100)
    });
  }, [tag.x, tag.y]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    
    const newX = ((e.clientX - dragStart.x) / window.innerWidth) * 100;
    const newY = ((e.clientY - dragStart.y) / window.innerHeight) * 100;
    
    updateTag(tag.id, {
      x: Math.min(Math.max(newX, 5), 85),
      y: Math.min(Math.max(newY, 5), 85)
    });
  }, [isDragging, dragStart, updateTag, tag.id]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Calculate arrow path
  const arrowPath = `M ${tag.x} ${tag.y} L ${tag.targetX} ${tag.targetY}`;

  return (
    <>
      {/* Arrow pointing to clothing item */}
      <svg className="tag-arrow" viewBox="0 0 100 100">
        <defs>
          <marker
            id={`arrowhead-${tag.id}`}
            markerWidth="4"
            markerHeight="4"
            refX="3"
            refY="2"
            orient="auto"
          >
            <polygon
              points="0 0, 4 2, 0 4"
              fill={tag.color}
            />
          </marker>
        </defs>
        <path
          d={arrowPath}
          stroke={tag.color}
          strokeWidth="0.3"
          fill="none"
          markerEnd={`url(#arrowhead-${tag.id})`}
        />
      </svg>

      {/* Draggable Tag */}
      <div
        ref={tagRef}
        className={`draggable-tag ${isDragging ? 'dragging' : ''}`}
        style={{
          left: `${tag.x}%`,
          top: `${tag.y}%`,
          backgroundColor: tag.color,
          borderColor: tag.color
        }}
        onMouseDown={handleMouseDown}
        onClick={(e) => {
          e.stopPropagation();
          if (!isDragging) onSelect(tag.id);
        }}
      >
        <div className="tag-content">
          <span className="tag-label">
            {tag.brand || 'Tap to tag'}
          </span>
          {tag.category && (
            <span className="tag-category">{tag.category}</span>
          )}
        </div>
        
        <button
          className="tag-delete"
          onClick={(e) => {
            e.stopPropagation();
            deleteTag(tag.id);
          }}
        >
          ×
        </button>
      </div>
    </>
  );
};

export default DraggableTag;
