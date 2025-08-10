
import React from 'react';
import { Tool } from '../../types';

interface PlaceholderToolProps {
  tool: Tool;
  message: string;
}

const PlaceholderTool: React.FC<PlaceholderToolProps> = ({ tool, message }) => {
  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold text-cyan-400 border-b border-gray-700 pb-2">{tool}</h3>
      <div className="text-sm text-amber-400 bg-amber-900/50 p-3 rounded">
        <p className="font-semibold mb-2">Feature In Development</p>
        <p>{message}</p>
      </div>
      {tool === Tool.ExplodedView && (
         <div>
          <label htmlFor="explode-slider" className="block text-sm font-medium text-gray-300 mb-1">Explode Amount</label>
          <input
            id="explode-slider"
            type="range"
            min="0"
            max="100"
            defaultValue="0"
            disabled
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-not-allowed"
          />
        </div>
      )}
    </div>
  );
};

export default PlaceholderTool;
