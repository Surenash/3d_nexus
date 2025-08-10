import React, from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadIcon, CubeIcon } from './icons';

interface UploadPageProps {
  onFileSelect: (file: File) => void;
}

const supportedFormats = {
    "Implemented": ["GLB", "GLTF", "OBJ", "STL", "FBX", "3MF", "WRL"],
    "Native CAD (Planned)": ["SLDPRT", "SLDASM", "CATPART", "CATPRODUCT", "IPT", "IAM", "PRT", "ASM", "PAR", "X_T", "X_B"],
    "Neutral (Planned)": ["STEP", "IGES", "JT"],
};

const UploadPage: React.FC<UploadPageProps> = ({ onFileSelect }) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    multiple: false,
  });

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
            <CubeIcon className="w-16 h-16 mx-auto text-cyan-400 mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold text-white">Nexus 3D Viewer</h1>
          <p className="mt-2 text-lg text-gray-400">An advanced viewer for your 3D models, right in the browser.</p>
        </div>

        <div {...getRootProps()} className={`w-full max-w-xl mx-auto border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-all duration-300 ${isDragActive ? 'border-cyan-400 bg-gray-800' : 'border-gray-600 hover:border-cyan-500 hover:bg-gray-800/50'}`}>
          <input {...getInputProps()} />
          <UploadIcon className="w-12 h-12 mx-auto text-gray-500 mb-4" />
          {isDragActive ? (
            <p className="text-xl text-cyan-300">Drop the file here ...</p>
          ) : (
            <p className="text-xl text-gray-400">Drag & drop a 3D file here, or click to select</p>
          )}
          <p className="text-sm text-gray-500 mt-2">Supported: GLB, GLTF, OBJ, STL, FBX, 3MF, WRL</p>
        </div>

        <div className="mt-10 max-w-4xl mx-auto">
            <h3 className="text-xl font-semibold text-center text-white mb-4">Full File Format Support</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {Object.entries(supportedFormats).filter(([, formats]) => formats.length > 0).map(([category, formats]) => (
                     <div key={category} className="bg-gray-800 p-4 rounded-lg">
                        <h4 className={`font-bold mb-2 ${category === 'Implemented' ? 'text-green-400' : 'text-amber-400'}`}>{category}</h4>
                        <div className="flex flex-wrap gap-2">
                            {formats.map(format => (
                                <span key={format} className={`px-2 py-1 text-xs rounded-full ${category === 'Implemented' ? 'bg-green-900 text-green-200' : 'bg-amber-900 text-amber-200'}`}>{format}</span>
                            ))}
                        </div>
                     </div>
                 ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;