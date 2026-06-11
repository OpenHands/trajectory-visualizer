import React from 'react';
import { TrajectoryCard } from "../trajectory-card";
import { CMarkdown } from '../../markdown';
import { ToolCallMetadataDisplay } from './tool-call-metadata';

interface ThinkAction {
  id: number;
  action: "think";
  message: string;
  source: "agent";
  timestamp: string;
  args: {
    thought: string;
  };
  tool_call_metadata?: any;
  llm_metrics?: any;
}

interface ThinkActionProps {
  action: ThinkAction;
}

export const ThinkActionComponent: React.FC<ThinkActionProps> = ({ action }) => {
  return (
    <TrajectoryCard 
      className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800"
      originalJson={action}
      timestamp={action.timestamp}
    >
      <TrajectoryCard.Header className="bg-indigo-100 dark:bg-indigo-800/50 text-indigo-800 dark:text-indigo-100">Thinking</TrajectoryCard.Header>
      <TrajectoryCard.Body>
        {action.args.thought && <CMarkdown>{action.args.thought}</CMarkdown>}
        <ToolCallMetadataDisplay metadata={action.tool_call_metadata} llmMetrics={action.llm_metrics} />
      </TrajectoryCard.Body>
    </TrajectoryCard>
  );
};