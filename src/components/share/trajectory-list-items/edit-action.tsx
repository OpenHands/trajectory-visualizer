import React from 'react';
import { TrajectoryCard } from "../trajectory-card";
import { EditAction } from '../../../types/share';
import { CMarkdown } from '../../markdown';
import { ToolCallMetadataDisplay } from './tool-call-metadata';

interface EditActionProps {
  item: EditAction;
}

export const EditActionComponent: React.FC<EditActionProps> = ({ item }) => {
  return (
    <TrajectoryCard 
      className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800"
      originalJson={item}
      timestamp={item.timestamp}
    >
      <TrajectoryCard.Header className="bg-orange-100 dark:bg-orange-800/50 text-orange-800 dark:text-orange-100">
        <div className="flex justify-between items-center w-full">
          <span>File Edit Action: {item.args.path}</span>
        </div>
      </TrajectoryCard.Header>
      <TrajectoryCard.Body>
        {item.args.thought && (
          <div className="mb-3">
            <div className="text-xs font-medium mb-1">Thought:</div>
            <CMarkdown>{item.args.thought}</CMarkdown>
          </div>
        )}
        
        <div className="text-xs text-gray-600 dark:text-gray-300 mt-2">
          This action will edit the file. The results will be shown in the corresponding observation.
        </div>
        <ToolCallMetadataDisplay metadata={item.tool_call_metadata} llmMetrics={item.llm_metrics} />
      </TrajectoryCard.Body>
    </TrajectoryCard>
  );
};