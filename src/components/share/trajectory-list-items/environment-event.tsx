import React from 'react';
import { CSyntaxHighlighter } from "../../syntax-highlighter";
import { TrajectoryCard } from "../trajectory-card";
import JsonVisualizer from "../../json-visualizer/JsonVisualizer";

interface EnvironmentEventProps {
  event: any;
}

export const EnvironmentEventComponent: React.FC<EnvironmentEventProps> = ({ event }) => {
  const isFullState = event.key === 'full_state' && event.value?.agent;

  const formatValue = (value: any): string => {
    if (typeof value === 'object') {
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

  const getSummary = () => {
    if (isFullState) {
      const agent = event.value.agent;
      const skillsCount = agent?.agent_context?.skills?.length || 0;
      return `Agent: ${agent?.llm?.model || 'unknown'} | Skills: ${skillsCount}`;
    }
    return null;
  };

  return (
    <TrajectoryCard
      className="bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800"
      originalJson={event}
      timestamp={event.timestamp}
    >
      <TrajectoryCard.Header className="bg-purple-100 dark:bg-purple-800/50 text-purple-800 dark:text-purple-100">
        🌍 {getTitle()}
      </TrajectoryCard.Header>
      <TrajectoryCard.Body>
        <div className="text-xs text-gray-500 mb-2">
          Key: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{event.key}</code>
        </div>
        {isFullState ? (
          <>
            <div className="text-sm text-gray-700 dark:text-gray-300 mb-2 font-medium">
              {getSummary()}
            </div>
            <JsonVisualizer 
              data={event.value} 
              excludeKeys={[]} 
              initialExpanded={false} 
            />
          </>
        ) : (
          <CSyntaxHighlighter language="json">
            {formatValue(event.value)}
          </CSyntaxHighlighter>
        )}
      </TrajectoryCard.Body>
    </TrajectoryCard>
  );
};