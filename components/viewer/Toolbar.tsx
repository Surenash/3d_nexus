
import React from 'react';
import { VisualStyle, Projection, Tool } from '../../types';
import { ThreeViewerRef } from './ThreeViewer';
import Tooltip from '../Tooltip';
import { CubeIcon, WireframeIcon, LayersIcon, CameraIcon, RulerIcon, ChevronsRightIcon, SlashIcon, SidebarIcon, MaximizeIcon, XIcon } from '../icons';

interface ToolbarProps {
  fileName: string;
  onClearFile: () => void;
  visualStyle: VisualStyle;
  setVisualStyle: (style: VisualStyle) => void;
  projection: Projection;
  setProjection: (proj: Projection) => void;
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  viewerRef: React.RefObject<ThreeViewerRef>;
}

const ToolbarButton: React.FC<{
  onClick?: () => void;
  isActive?: boolean;
  tooltip: string;
  children: React.ReactNode;
}> = ({ onClick, isActive, tooltip, children }) => (
  <Tooltip text={tooltip} position="bottom">
    <button
      onClick={onClick}
      className={`p-2 rounded-md transition-colors duration-200 ${isActive ? 'bg-cyan-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
    >
      {children}
    </button>
  </Tooltip>
);

const Toolbar: React.FC<ToolbarProps> = ({
  fileName, onClearFile, visualStyle, setVisualStyle, projection, setProjection, activeTool, setActiveTool, isSidebarOpen, setSidebarOpen, viewerRef,
}) => {
  const toggleTool = (tool: Tool) => setActiveTool(activeTool === tool ? Tool.None : tool);
  
  return (
    <header className="bg-gray-900/80 backdrop-blur-sm text-white p-2 flex items-center justify-between shadow-md z-10 shrink-0">
      <div className="flex items-center gap-4">
        <Tooltip text={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"} position="right">
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 rounded-md hover:bg-gray-700">
            <SidebarIcon className="w-5 h-5" />
          </button>
        </Tooltip>
        <span className="font-bold text-lg text-cyan-400">Nexus 3D</span>
        <span className="text-gray-400">|</span>
        <span className="text-sm truncate max-w-xs">{fileName}</span>
        <button onClick={onClearFile} className="p-1 rounded-full hover:bg-gray-700">
          <XIcon className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        {/* Visual Style Controls */}
        <div className="flex items-center bg-gray-700 rounded-md p-1 gap-1">
          <ToolbarButton onClick={() => setVisualStyle(VisualStyle.Shaded)} isActive={visualStyle === VisualStyle.Shaded} tooltip="Shaded">
            <CubeIcon className="w-5 h-5" />
          </ToolbarButton>
          <ToolbarButton onClick={() => setVisualStyle(VisualStyle.ShadedWithEdges)} isActive={visualStyle === VisualStyle.ShadedWithEdges} tooltip="Shaded with Edges">
            <LayersIcon className="w-5 h-5" />
          </ToolbarButton>
          <ToolbarButton onClick={() => setVisualStyle(VisualStyle.Wireframe)} isActive={visualStyle === VisualStyle.Wireframe} tooltip="Wireframe">
            <WireframeIcon className="w-5 h-5" />
          </ToolbarButton>
        </div>
        
        {/* Analysis Tools */}
        <div className="flex items-center bg-gray-700 rounded-md p-1 gap-1">
            <ToolbarButton onClick={() => toggleTool(Tool.Measure)} isActive={activeTool === Tool.Measure} tooltip="Measure (Planned)">
                <RulerIcon className="w-5 h-5" />
            </ToolbarButton>
            <ToolbarButton onClick={() => toggleTool(Tool.CrossSection)} isActive={activeTool === Tool.CrossSection} tooltip="Cross Section">
                <SlashIcon className="w-5 h-5" />
            </ToolbarButton>
            <ToolbarButton onClick={() => toggleTool(Tool.ExplodedView)} isActive={activeTool === Tool.ExplodedView} tooltip="Exploded View (Planned)">
                <ChevronsRightIcon className="w-5 h-5" />
            </ToolbarButton>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* View Controls */}
         <div className="flex items-center bg-gray-700 rounded-md p-1 gap-1">
             <ToolbarButton onClick={() => viewerRef.current?.resetCamera()} tooltip="Reset View">
                 <MaximizeIcon className="w-5 h-5" />
             </ToolbarButton>
             <ToolbarButton onClick={() => viewerRef.current?.setCameraView('top')} tooltip="Top View">T</ToolbarButton>
             <ToolbarButton onClick={() => viewerRef.current?.setCameraView('front')} tooltip="Front View">F</ToolbarButton>
             <ToolbarButton onClick={() => viewerRef.current?.setCameraView('right')} tooltip="Right View">R</ToolbarButton>
        </div>
        
        {/* Projection */}
        <div className="flex items-center bg-gray-700 rounded-md p-1 gap-1">
          <ToolbarButton onClick={() => setProjection(Projection.Perspective)} isActive={projection === Projection.Perspective} tooltip="Perspective View">
            <CameraIcon className="w-5 h-5" />
          </ToolbarButton>
          <ToolbarButton onClick={() => setProjection(Projection.Orthographic)} isActive={projection === Projection.Orthographic} tooltip="Orthographic View (Planned)">
            <div className="font-bold text-lg">O</div>
          </ToolbarButton>
        </div>
      </div>
    </header>
  );
};

export default Toolbar;
