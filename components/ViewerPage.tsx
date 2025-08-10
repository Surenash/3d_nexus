
import React, { useState, useCallback, useRef } from 'react';
import * as THREE from 'three';
import { VisualStyle, Projection, Tool, SceneNode, CrossSectionState } from '../types';
import ThreeViewer, { ThreeViewerRef } from './viewer/ThreeViewer';
import Toolbar from './viewer/Toolbar';
import Sidebar from './viewer/Sidebar';

interface ViewerPageProps {
  file: File;
  onClearFile: () => void;
}

const ViewerPage: React.FC<ViewerPageProps> = ({ file, onClearFile }) => {
  const [visualStyle, setVisualStyle] = useState<VisualStyle>(VisualStyle.ShadedWithEdges);
  const [projection, setProjection] = useState<Projection>(Projection.Perspective);
  const [activeTool, setActiveTool] = useState<Tool>(Tool.None);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [sceneTree, setSceneTree] = useState<SceneNode | null>(null);
  const [selectedObject, setSelectedObject] = useState<THREE.Object3D | null>(null);
  const [crossSectionState, setCrossSectionState] = useState<CrossSectionState>({
    enabled: false,
    plane: 'X',
    constant: 0,
    inverted: false,
  });

  const viewerRef = useRef<ThreeViewerRef>(null);

  const handleSceneLoad = useCallback((scene: THREE.Group) => {
    const buildTree = (object: THREE.Object3D): SceneNode => ({
      uuid: object.uuid,
      name: object.name || object.type,
      type: object.type,
      visible: object.visible,
      children: object.children.map(buildTree),
    });
    setSceneTree(buildTree(scene));
    setSelectedObject(null);
  }, []);
  
  const handleObjectSelect = useCallback((object: THREE.Object3D | null) => {
    setSelectedObject(object);
    if(object) {
      setActiveTool(Tool.Properties);
    } else if (activeTool === Tool.Properties) {
      setActiveTool(Tool.None);
    }
  }, [activeTool]);

  const toggleObjectVisibility = useCallback((uuid: string, visible: boolean) => {
    viewerRef.current?.setObjectVisibility(uuid, visible);
    const updateTreeVisibility = (node: SceneNode): SceneNode => {
      if (node.uuid === uuid) {
        return { ...node, visible };
      }
      return { ...node, children: node.children.map(updateTreeVisibility) };
    };
     if(sceneTree) {
         setSceneTree(updateTreeVisibility(sceneTree));
     }
  }, [sceneTree]);
  
  const updateObjectOpacity = useCallback((uuid: string, opacity: number) => {
    viewerRef.current?.setObjectOpacity(uuid, opacity);
  }, []);

  return (
    <div className="w-screen h-screen bg-gray-800 flex flex-col overflow-hidden">
      <Toolbar
        fileName={file.name}
        onClearFile={onClearFile}
        visualStyle={visualStyle}
        setVisualStyle={setVisualStyle}
        projection={projection}
        setProjection={setProjection}
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        isSidebarOpen={isSidebarOpen}
        setSidebarOpen={setSidebarOpen}
        viewerRef={viewerRef}
      />
      <div className="flex-grow flex h-full overflow-hidden">
        <Sidebar
          isOpen={isSidebarOpen}
          sceneTree={sceneTree}
          selectedObject={selectedObject}
          onObjectSelectByUUID={(uuid) => viewerRef.current?.selectObjectByUUID(uuid)}
          onToggleVisibility={toggleObjectVisibility}
          onUpdateOpacity={updateObjectOpacity}
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          crossSectionState={crossSectionState}
          setCrossSectionState={setCrossSectionState}
        />
        <main className="flex-grow h-full relative">
          <ThreeViewer
            ref={viewerRef}
            file={file}
            visualStyle={visualStyle}
            projection={projection}
            onSceneLoad={handleSceneLoad}
            onObjectSelect={handleObjectSelect}
            crossSectionState={crossSectionState}
          />
        </main>
      </div>
    </div>
  );
};

export default ViewerPage;