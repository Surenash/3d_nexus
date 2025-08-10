
import React, { useState } from 'react';
import * as THREE from 'three';
import { SceneNode, Tool, CrossSectionState } from '../../types';
import ModelTree from './ModelTree';
import PropertiesPanel from './PropertiesPanel';
import PlaceholderTool from './PlaceholderTool';
import CrossSectionPanel from './CrossSectionPanel';

interface SidebarProps {
  isOpen: boolean;
  sceneTree: SceneNode | null;
  selectedObject: THREE.Object3D | null;
  onObjectSelectByUUID: (uuid: string | null) => void;
  onToggleVisibility: (uuid: string, visible: boolean) => void;
  onUpdateOpacity: (uuid: string, opacity: number) => void;
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
  crossSectionState: CrossSectionState;
  setCrossSectionState: (state: CrossSectionState) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen, sceneTree, selectedObject, onObjectSelectByUUID, onToggleVisibility, onUpdateOpacity, activeTool, setActiveTool, crossSectionState, setCrossSectionState
}) => {
  const [activeTab, setActiveTab] = useState<'tree' | 'tool'>('tree');
  
  React.useEffect(() => {
    if(activeTool !== Tool.None && activeTool !== Tool.Properties) {
      setActiveTab('tool');
    } else if (activeTool === Tool.Properties) {
      setActiveTab('tool');
    }
  }, [activeTool]);

  const renderToolPanel = () => {
    switch (activeTool) {
      case Tool.Properties:
        return selectedObject ? (
          <PropertiesPanel
            key={selectedObject.uuid}
            selectedObject={selectedObject}
            onUpdateOpacity={(opacity) => onUpdateOpacity(selectedObject.uuid, opacity)}
          />
        ) : (
          <div className="p-4 text-gray-400">Select an object to see its properties.</div>
        );
      case Tool.CrossSection:
        return <CrossSectionPanel state={crossSectionState} setState={setCrossSectionState} />;
      case Tool.Measure:
        return <PlaceholderTool tool={Tool.Measure} message="Click two points in the viewer to measure distance. (Feature in development)" />;
      case Tool.ExplodedView:
        return <PlaceholderTool tool={Tool.ExplodedView} message="Drag the slider to control the explosion distance. (Feature in development)" />;
      default:
        return <div className="p-4 text-gray-400">No tool selected.</div>;
    }
  };

  return (
    <aside className={`bg-gray-800 text-white flex flex-col transition-all duration-300 ease-in-out ${isOpen ? 'w-80' : 'w-0'} overflow-hidden shrink-0`}>
      <div className="flex-shrink-0 border-b border-gray-700">
        <div className="flex">
          <button
            onClick={() => setActiveTab('tree')}
            className={`flex-1 p-3 text-sm font-semibold transition-colors ${activeTab === 'tree' ? 'bg-gray-700 text-cyan-400' : 'text-gray-400 hover:bg-gray-700/50'}`}
          >
            Model Tree
          </button>
          <button
            onClick={() => setActiveTab('tool')}
            className={`flex-1 p-3 text-sm font-semibold transition-colors ${activeTab === 'tool' ? 'bg-gray-700 text-cyan-400' : 'text-gray-400 hover:bg-gray-700/50'}`}
          >
            Tools
          </button>
        </div>
      </div>
      <div className="flex-grow overflow-y-auto custom-scrollbar">
        {activeTab === 'tree' ? (
          sceneTree ? (
            <ModelTree
              node={sceneTree}
              selectedUUID={selectedObject?.uuid}
              onNodeSelect={onObjectSelectByUUID}
              onToggleVisibility={onToggleVisibility}
            />
          ) : (
            <div className="p-4 text-gray-400 text-center">Loading model hierarchy...</div>
          )
        ) : (
          renderToolPanel()
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
