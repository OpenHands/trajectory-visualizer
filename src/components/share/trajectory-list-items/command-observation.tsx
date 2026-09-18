import React from 'react';
import { CSyntaxHighlighter } from "../../syntax-highlighter";
import { TrajectoryCard } from "../trajectory-card";
import { CommandObservation } from '../../../types/share';
import { ToolCallMetadataDisplay } from './tool-call-metadata';

interface CommandObservationProps {
  observation: CommandObservation;
}

export const CommandObservationComponent: React.FC<CommandObservationProps> = ({ observation }) => {
  // Get the first 5 lines of content
  const getPreviewContent = (content: string) => {
    const lines = content.split('\n');
    if (lines.length <= 5) return content;
    return lines.slice(0, 5).join('\n');
  };
  
  // Check if content has more than 5 lines
  const hasMoreContent = observation.content.split('\n').length > 5;
  
  const previewContent = getPreviewContent(observation.content);
  
  return (
    <TrajectoryCard 
      className="bg-gray-50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700"
      originalJson={observation}
      timestamp={observation.timestamp}
      defaultCollapsed={hasMoreContent}
      collapsedPreview={hasMoreContent ? (
        <div className="p-2 flex flex-col gap-1">
          <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400">Output preview</div>
          <pre className="max-h-32 overflow-hidden whitespace-pre-wrap text-xs text-gray-700 dark:text-gray-300">{previewContent}</pre>
          <div className="text-[10px] text-gray-500 dark:text-gray-400 italic">Showing the first 5 lines. Expand to see all output.</div>
        </div>
      ) : undefined}
    >
      <TrajectoryCard.Header className="bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200">Shell Output</TrajectoryCard.Header>
      <TrajectoryCard.Body>
        <CSyntaxHighlighter language="shell">{observation.content}</CSyntaxHighlighter>
        
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Exit code: {String(observation.extras?.metadata?.exit_code ?? observation.extras?.exit_code ?? 'N/A')}
        </div>
        <ToolCallMetadataDisplay metadata={observation.tool_call_metadata} />
      </TrajectoryCard.Body>
    </TrajectoryCard>
  );
};
