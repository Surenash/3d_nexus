
import React, { useState } from 'react';
import { SceneNode } from '../../types';
import { EyeIcon, EyeOffIcon, ChevronDownIcon, ChevronRightIcon } from '../icons';

interface ModelTreeProps {
  node: SceneNode;
  selectedUUID?: string | null;
  onNodeSelect: (uuid: string | null) => void;
  onToggleVisibility: (uuid: string, visible: boolean) => void;
  level?: number;
}

const ModelTree: React.FC<ModelTreeProps> = ({ node, selectedUUID, onNodeSelect, onToggleVisibility, level = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expand first few levels

  const hasChildren = node.children && node.children.length > 0;
  const isSelected = node.uuid === selectedUUID;

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNodeSelect(isSelected ? null : node.uuid);
  };
  
  const handleToggleVisibility = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleVisibility(node.uuid, !node.visible);
  }

  return (
    <div>
      <div
        style={{ paddingLeft: `${level * 1.25}rem` }}
        className={`flex items-center p-1 cursor-pointer transition-colors duration-150 ${isSelected ? 'bg-cyan-600' : 'hover:bg-gray-700'}`}
        onClick={handleSelect}
      >
        <div className="flex items-center flex-grow" >
          {hasChildren ? (
            <button onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }} className="p-1 -ml-1">
              {isExpanded ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
            </button>
          ) : (
            <span className="w-6"></span>
          )}
          <span className="ml-1 text-sm truncate" title={node.name}>{node.name}</span>
        </div>
        <button onClick={handleToggleVisibility} className="p-1 mr-1 text-gray-400 hover:text-white">
          {node.visible ? <EyeIcon className="w-4 h-4" /> : <EyeOffIcon className="w-4 h-4" />}
        </button>
      </div>
      {isExpanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <ModelTree
              key={child.uuid}
              node={child}
              selectedUUID={selectedUUID}
              onNodeSelect={onNodeSelect}
              onToggleVisibility={onToggleVisibility}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ModelTree;
