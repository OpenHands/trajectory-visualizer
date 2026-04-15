import React from 'react';
import { CSyntaxHighlighter } from "../../syntax-highlighter";
import { TrajectoryCard } from "../trajectory-card";

interface EnvironmentEventProps {
  event: any;
  extra?: React.ReactNode;
}

export const EnvironmentEventComponent: React.FC<EnvironmentEventProps> = ({ event, extra }) => {
  const formatValue = (value: any): string => {
    if (typeof value === 'object') {
      // For full_state events, show a summary (detailed view is in AgentContextComponent)
      if (event.key === 'full_state' && value.agent) {
        return `Agent: ${value.agent?.llm?.model || 'unknown'}`;
      }
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const getTitle = () => {
    if (event.kind === 'ConversationStateUpdateEvent') {
      return `State: ${event.value?.execution_status || 'unknown'}`;
    }
    return event.key || 'Environment Event';
  };

  return (
    <TrajectoryCard
      className="bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800"
      originalJson={event}
      timestamp={event.timestamp}
    >
      <TrajectoryCard.Header className="bg-purple-100 dark:bg-purple-800/50 text-purple-800 dark:text-purple-100" extra={extra}>
        🌍 {getTitle()}
      </TrajectoryCard.Header>
      <TrajectoryCard.Body>
        <div className="text-xs text-gray-500 mb-2">
          Key: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{event.key}</code>
        </div>
        <CSyntaxHighlighter language="json">
          {formatValue(event.value)}
        </CSyntaxHighlighter>
      </TrajectoryCard.Body>
    </TrajectoryCard>
  );
};