import React from 'react';
import { CSyntaxHighlighter } from "../../syntax-highlighter";
import { TrajectoryCard } from "../trajectory-card";
import { IPythonAction } from '../../../types/share';
import { CMarkdown } from '../../markdown';
import { ToolCallMetadataDisplay } from './tool-call-metadata';

interface IPythonActionProps {
  action: IPythonAction;
}

export const IPythonActionComponent: React.FC<IPythonActionProps> = ({ action }) => {
  return (
    <TrajectoryCard 
      className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800"
      originalJson={action}
      timestamp={action.timestamp}
    >
      <TrajectoryCard.Header className="bg-yellow-100 dark:bg-yellow-800/50 text-yellow-800 dark:text-yellow-100">IPython Action</TrajectoryCard.Header>
      <TrajectoryCard.Body>
        {action.args.thought && <CMarkdown>{action.args.thought}</CMarkdown>}
        <CSyntaxHighlighter language="python">{action.args.code}</CSyntaxHighlighter>
        <ToolCallMetadataDisplay metadata={action.tool_call_metadata} llmMetrics={action.llm_metrics} />
      </TrajectoryCard.Body>
    </TrajectoryCard>
  );
};