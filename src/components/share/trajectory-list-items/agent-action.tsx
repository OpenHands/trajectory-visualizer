import React from 'react';
import { CSyntaxHighlighter } from "../../syntax-highlighter";
import { TrajectoryCard } from "../trajectory-card";
import { CMarkdown } from '../../markdown';

interface AgentActionProps {
  action: any;
  extra?: React.ReactNode;
}

export const AgentActionComponent: React.FC<AgentActionProps> = ({ action, extra }) => {
  const toolName = action.tool_name || action.action?.command || 'unknown';
  
  const getToolArgs = () => {
    if (action.tool_call) {
      return action.tool_call;
    }
    if (action.action) {
      return action.action;
    }
    return null;
  };

  const toolArgs = getToolArgs();

  return (
    <TrajectoryCard
      className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800"
      originalJson={action}
      timestamp={action.timestamp}
    >
      <TrajectoryCard.Header extra={extra} className="bg-amber-100 dark:bg-amber-800/50 text-amber-800 dark:text-amber-100">
        🤖 Agent Action: {toolName}
      </TrajectoryCard.Header>
      <TrajectoryCard.Body>
        {action.reasoning_content && (
          <>
            <div className="text-xs text-gray-500 mb-1">Reasoning:</div>
            <CMarkdown>{action.reasoning_content}</CMarkdown>
          </>
        )}
        {toolArgs && (
          <>
            <div className="text-xs text-gray-500 mb-1 mt-2">Tool Call:</div>
            <CSyntaxHighlighter language="json">
              {JSON.stringify(toolArgs, null, 2)}
            </CSyntaxHighlighter>
          </>
        )}
        {action.summary && (
          <>
            <div className="text-xs text-gray-500 mb-1 mt-2">Summary:</div>
            <p className="text-sm text-gray-700 dark:text-gray-300">{action.summary}</p>
          </>
        )}
      </TrajectoryCard.Body>
    </TrajectoryCard>
  );
};