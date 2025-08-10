
import React from 'react';
import { CrossSectionState } from '../../types';

interface CrossSectionPanelProps {
  state: CrossSectionState;
  setState: (state: CrossSectionState) => void;
}

const CrossSectionPanel: React.FC<CrossSectionPanelProps> = ({ state, setState }) => {
  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState({ ...state, enabled: e.target.checked });
  };

  const handlePlaneChange = (plane: 'X' | 'Y' | 'Z') => {
    setState({ ...state, plane });
  };

  const handleConstantChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState({ ...state, constant: parseFloat(e.target.value) });
  };

  const handleInvertToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState({ ...state, inverted: e.target.checked });
  };

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold text-cyan-400 border-b border-gray-700 pb-2">Cross Section</h3>
      
      <div className="flex items-center justify-between">
        <label htmlFor="enable-section" className="text-sm font-medium text-gray-300">Enable Sectioning</label>
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" id="enable-section" className="sr-only peer" checked={state.enabled} onChange={handleToggle} />
          <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-cyan-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
        </label>
      </div>
      
      {state.enabled && (
        <div className="space-y-4 pt-2">
           <div className="flex items-center justify-between">
            <label htmlFor="invert-section" className="text-sm font-medium text-gray-300">Invert Section</label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" id="invert-section" className="sr-only peer" checked={state.inverted} onChange={handleInvertToggle} />
              <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-cyan-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Section Plane</label>
            <div className="flex items-center justify-between bg-gray-900 rounded-md">
              {(['X', 'Y', 'Z'] as const).map((plane) => (
                <button
                  key={plane}
                  onClick={() => handlePlaneChange(plane)}
                  className={`flex-1 p-2 text-sm font-bold rounded-md transition-colors ${state.plane === plane ? 'bg-cyan-600 text-white' : 'hover:bg-gray-700'}`}
                >
                  {plane}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="section-slider" className="block text-sm font-medium text-gray-300 mb-1">Position</label>
            <input
              id="section-slider"
              type="range"
              min="-10"
              max="10"
              step="0.1"
              value={state.constant}
              onChange={handleConstantChange}
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CrossSectionPanel;