import React from 'react';
import { CSyntaxHighlighter } from "../../syntax-highlighter";
import { TrajectoryCard } from "../trajectory-card";
import { CMarkdown } from '../../markdown';

interface AgentThoughtProps {
  extra?: React.ReactNode;
  thought: any;
}

export const AgentThoughtComponent: React.FC<AgentThoughtProps> = ({ thought, extra }) => {
  const reasoning = thought.reasoning_content || '';
  const thoughts = thought.thought;
  const action = thought.action;

  return (
    <TrajectoryCard
      className="bg-cyan-50 dark:bg-cyan-900/10 border border-cyan-200 dark:border-cyan-800"
      originalJson={thought}
      timestamp={thought.timestamp}
    >
      <TrajectoryCard.Header extra={extra} className="bg-cyan-100 dark:bg-cyan-800/50 text-cyan-800 dark:text-cyan-100">
        💭 Agent Thought
      </TrajectoryCard.Header>
      <TrajectoryCard.Body>
        {reasoning && (
          <>
            <div className="text-xs text-gray-500 mb-1">Reasoning:</div>
            <CMarkdown>{reasoning}</CMarkdown>
          </>
        )}
        {thoughts && (
          <>
            <div className="text-xs text-gray-500 mb-1 mt-2">Thoughts:</div>
            {Array.isArray(thoughts) ? thoughts.map((t: any, i: number) => (
              <div key={i} className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                {t?.text || JSON.stringify(t)}
              </div>
            )) : <CMarkdown>{JSON.stringify(thoughts)}</CMarkdown>}
          </>
        )}
        {action && (
          <>
            <div className="text-xs text-gray-500 mb-1 mt-2">Action:</div>
            <CSyntaxHighlighter language="json">
              {JSON.stringify(action, null, 2)}
            </CSyntaxHighlighter>
          </>
        )}
      </TrajectoryCard.Body>
    </TrajectoryCard>
  );
};