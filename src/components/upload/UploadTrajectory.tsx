import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadContent } from '../../types/upload';

interface UploadTrajectoryProps {
  onUpload: (content: UploadContent) => void;
  onUploadStart?: () => void;
}

export const UploadTrajectory: React.FC<UploadTrajectoryProps> = ({ 
  onUpload,
  onUploadStart
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processOpenHandsTrajectory = (content: any) => {
    // Check if it's an array (OpenHands trajectory format)
    if (Array.isArray(content)) {
      // Check if it has OpenHands specific fields
      if (content.length > 0 &&
          (('action' in content[0] && 'source' in content[0]) ||
           ('observation' in content[0] && 'source' in content[0]))) {
        console.log('Detected OpenHands trajectory format - using trajectory viewer');

        // Return the content directly for the trajectory viewer
        return content;
      }
      return content;
    }
    
    // Check if it has entries array (sample-trajectory.json format)
    if (content.entries && Array.isArray(content.entries)) {
      console.log('Detected entries array format');
      
      // Return the data directly for the trajectory viewer
      return content;
    }
    
    // Check if it has history array (trajectory-visualizer format)
    if (content.history && Array.isArray(content.history)) {
      console.log('Detected history array format - using trajectory viewer');

      // Return the history array for the trajectory viewer
      return content.history;
    }
    
    // If it's not in a recognized format, return as is and let the converter handle it
    console.log('Unknown format, passing to converter as-is');
    return content;
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsProcessing(true);
    setError(null);
    
    // Notify parent component that upload has started
    if (onUploadStart) {
      onUploadStart();
    }
    
    const file = acceptedFiles[0];
    console.log(`Processing file: ${file.name} (${file.size} bytes)`);
    
    const reader = new FileReader();

    reader.onload = () => {
      try {
        // For JSON files, we parse the content and pass it as a trajectory
        const content = JSON.parse(reader.result as string);
        
        // Log some basic info about the content to help with debugging
        if (Array.isArray(content)) {
          console.log(`Parsed JSON array with ${content.length} items`);
          if (content.length > 0) {
            console.log('First item sample:', JSON.stringify(content[0]).substring(0, 200) + '...');
          }
        } else {
          console.log('Parsed JSON object with keys:', Object.keys(content));
        }
        
        // Process the trajectory based on its format
        const processedTrajectory = processOpenHandsTrajectory(content);
        
        // Check if we've converted to JSONL format
        if (processedTrajectory && typeof processedTrajectory === 'object' && 'jsonlContent' in processedTrajectory) {
          console.log('Using JSONL viewer for OpenHands trajectory');
          onUpload({
            content: processedTrajectory
          });
          setIsProcessing(false);
        }
        // For large trajectories, add a small delay to allow the UI to update
        else if (Array.isArray(processedTrajectory) && processedTrajectory.length > 500) {
          console.log(`Processing large trajectory with ${processedTrajectory.length} items...`);
          setTimeout(() => {
            onUpload({
              content: {
                trajectoryData: processedTrajectory,
                fileType: 'trajectory'
              }
            });
            setIsProcessing(false);
          }, 100);
        } else {
          onUpload({
            content: {
              trajectoryData: processedTrajectory,
              fileType: 'trajectory'
            }
          });
          setIsProcessing(false);
        }
      } catch (error) {
        console.error('Failed to process file:', error);
        setError(`Failed to parse the trajectory file: ${error instanceof Error ? error.message : 'Unknown error'}. Please make sure it is a valid JSON file.`);
        window.alert('Failed to parse the trajectory file. Please make sure it is a valid JSON file.');
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      console.error('Error reading file:', reader.error);
      setError(`Error reading file: ${reader.error?.message || 'Unknown error'}`);
      setIsProcessing(false);
    };

    reader.readAsText(file);
  }, [onUpload, onUploadStart]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json']
    },
    multiple: false,
    disabled: isProcessing
  });

  return (
    <div className="space-y-4">
      <div 
        {...getRootProps()} 
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' 
            : isProcessing
              ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10 cursor-wait'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center">
          {isProcessing ? (
            <>
              <svg 
                className="w-12 h-12 mb-4 text-yellow-500 animate-spin" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24"
              >
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                ></circle>
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                Processing trajectory file...
              </p>
            </>
          ) : (
            <>
              <svg 
                className={`w-12 h-12 mb-4 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className={`text-sm ${isDragActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
                {isDragActive
                  ? 'Drop the trajectory file here...'
                  : 'Drag and drop a trajectory file here, or click to select'
                }
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                Supports OpenHands trajectory JSON files, only .json files are supported
              </p>
            </>
          )}
        </div>
      </div>
      
      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900/10 text-red-700 dark:text-red-400 rounded-md">
          {error}
        </div>
      )}
    </div>
  );
};