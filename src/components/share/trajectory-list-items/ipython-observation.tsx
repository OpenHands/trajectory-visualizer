import React, { useState } from 'react';
import { CSyntaxHighlighter } from "../../syntax-highlighter";
import { TrajectoryCard } from "../trajectory-card";
import { IPythonObservation } from '../../../types/share';

interface IPythonObservationProps {
  extra?: React.ReactNode;
  observation: IPythonObservation;
}

export const IPythonObservationComponent: React.FC<IPythonObservationProps> = ({ observation, extra }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Get the first 5 lines of content
  const getPreviewContent = (content: string) => {
    const lines = content.split('\n');
    if (lines.length <= 5) return content;
    return lines.slice(0, 5).join('\n');
  };
  
  // Check if content has more than 5 lines
  const hasMoreContent = observation.content.split('\n').length > 5;
  
  // Get preview or full content based on expanded state
  const displayContent = isExpanded ? observation.content : getPreviewContent(observation.content);
  
  return (
    <TrajectoryCard 
      className="bg-gray-50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700"
      originalJson={observation}
      timestamp={observation.timestamp}
    >
      <TrajectoryCard.Header extra={extra} className="bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200">IPython Output</TrajectoryCard.Header>
      <TrajectoryCard.Body>
        <CSyntaxHighlighter language="python">{displayContent}</CSyntaxHighlighter>
        
        {hasMoreContent && !isExpanded && (
          <div className="flex justify-center mt-1">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(true);
              }}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              Show all {observation.content.split('\n').length} lines
            </button>
          </div>
        )}
        
        {isExpanded && (
          <div className="flex justify-center mt-1">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(false);
              }}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              Show less
            </button>
          </div>
        )}
      </TrajectoryCard.Body>
    </TrajectoryCard>
  );
};