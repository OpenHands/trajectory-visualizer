import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadContent } from '../../types/upload';
import pako from 'pako';
import { extractFromTar } from '../../lib/tarExtractor';

interface EvaluationUploadProps {
  onUpload: (content: UploadContent) => void;
}

export const EvaluationUpload: React.FC<EvaluationUploadProps> = ({ onUpload }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setError(null);

    try {
      if (file.name.endsWith('.tar.gz') || file.name.endsWith('.tgz')) {
        // Handle tar.gz files
        console.log('Processing tar.gz file:', file.name);
        
        const buffer = await file.arrayBuffer();
        const gzippedData = new Uint8Array(buffer);
        
        console.log('Decompressing...');
        let decompressed: Uint8Array;
        try {
          decompressed = pako.ungzip(gzippedData);
        } catch {
          decompressed = pako.inflate(gzippedData);
        }
        
        console.log('Extracting from tar...');
        const { jsonlFiles, reportContent } = extractFromTar(decompressed);
        
        if (Object.keys(jsonlFiles).length === 0) {
          throw new Error('No JSONL content found in archive');
        }
        
        // Get the first available JSONL file for backward compatibility
        const firstJsonlFile = Object.keys(jsonlFiles)[0];
        const firstJsonlContent = jsonlFiles[firstJsonlFile];
        
        onUpload({
          content: {
            fileType: 'full_archive' as const,
            jsonlFiles,
            selectedJsonlFile: firstJsonlFile,
            jsonlContent: firstJsonlContent,
            reportContent
          }
        });
      } else {
        // Handle plain JSONL files
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const fileContent = reader.result as string;
            onUpload({
              content: {
                jsonlContent: fileContent,
                fileType: 'jsonl'
              }
            });
          } catch (err) {
            setError('Failed to process file');
            console.error(err);
          } finally {
            setIsProcessing(false);
          }
        };
        reader.readAsText(file);
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    processFile(acceptedFiles[0]);
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.jsonl', '.json'],
      'application/gzip': ['.gz', '.tar.gz', '.tgz'],
      'application/x-tar': ['.tar']
    },
    multiple: false,
    disabled: isProcessing
  });

  return (
    <div className="mb-6">
      <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        Visualize OpenHands Evaluation Output
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Upload a JSONL file or drag-drop a results.tar.gz file.
      </p>
      <div 
        {...getRootProps()} 
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isProcessing 
            ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10' 
            : isDragActive 
              ? 'border-green-500 bg-green-50 dark:bg-green-900/10' 
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center">
          {isProcessing ? (
            <div className="animate-pulse">
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                Processing... (decompressing large files may take a moment)
              </p>
            </div>
          ) : (
            <>
              <svg 
                className={`w-12 h-12 mb-4 ${isDragActive ? 'text-green-500' : 'text-gray-400'}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className={`text-sm ${isDragActive ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                {isDragActive
                  ? 'Drop the file here...'
                  : 'Drag and drop a .jsonl or .tar.gz file here, or click to select'
                }
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                Supports: .jsonl files or .tar.gz archives from OpenHands evaluation
              </p>
            </>
          )}
        </div>
      </div>
      
      {error && (
        <div className="mt-2 p-3 bg-red-100 dark:bg-red-900/10 text-red-700 dark:text-red-400 rounded-md text-sm">
          {error}
        </div>
      )}
    </div>
  );
};