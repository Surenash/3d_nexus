
import React, { useState, useEffect } from 'react';
import * as THREE from 'three';

interface PropertiesPanelProps {
  selectedObject: THREE.Object3D;
  onUpdateOpacity: (opacity: number) => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedObject, onUpdateOpacity }) => {
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    let initialOpacity = 1;
    if (selectedObject && selectedObject instanceof THREE.Mesh) {
      const material = Array.isArray(selectedObject.material) ? selectedObject.material[0] : selectedObject.material;
      if (material && material.transparent) {
        initialOpacity = material.opacity;
      }
    }
    setOpacity(initialOpacity);
  }, [selectedObject]);
  
  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newOpacity = parseFloat(e.target.value);
    setOpacity(newOpacity);
    onUpdateOpacity(newOpacity);
  };
  
  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold text-cyan-400 border-b border-gray-700 pb-2">Properties</h3>
      <div>
        <label className="block text-sm font-medium text-gray-300">Name</label>
        <p className="text-sm bg-gray-900 p-2 rounded mt-1 truncate">{selectedObject.name || 'Unnamed Object'}</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300">Type</label>
        <p className="text-sm bg-gray-900 p-2 rounded mt-1">{selectedObject.type}</p>
      </div>
      
      {selectedObject instanceof THREE.Mesh && (
        <div>
          <label htmlFor="opacity-slider" className="block text-sm font-medium text-gray-300 mb-1">Opacity: {Math.round(opacity * 100)}%</label>
          <input
            id="opacity-slider"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={opacity}
            onChange={handleOpacityChange}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      )}

       <div>
        <h4 className="text-md font-semibold text-gray-300 border-b border-gray-700 pb-1 mb-2 mt-4">Physical Properties</h4>
        <div className="text-sm text-amber-400 bg-amber-900/50 p-3 rounded">
            Physical property calculation (mass, volume, etc.) is a planned feature.
        </div>
      </div>
    </div>
  );
};

export default PropertiesPanel;
