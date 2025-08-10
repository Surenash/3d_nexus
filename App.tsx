
import React, { useState, useCallback } from 'react';
import UploadPage from './components/UploadPage';
import ViewerPage from './components/ViewerPage';

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);

  const handleFileSelect = useCallback((selectedFile: File) => {
    if (file) {
      URL.revokeObjectURL(URL.createObjectURL(file));
    }
    setFile(selectedFile);
  }, [file]);

  const handleClearFile = useCallback(() => {
    if (file) {
      URL.revokeObjectURL(URL.createObjectURL(file));
    }
    setFile(null);
  }, [file]);

  if (file) {
    return <ViewerPage file={file} onClearFile={handleClearFile} />;
  }

  return <UploadPage onFileSelect={handleFileSelect} />;
};

export default App;
