import React from 'react';
import { TrajectoryCard } from "../trajectory-card";
import { CMarkdown } from '../../markdown';

interface ThinkAction {
  id: number;
  action: "think";
  message: string;
  source: "agent";
  timestamp: string;
  args: {
    thought: string;
  };
}

interface ThinkActionProps {
  extra?: React.ReactNode;
  action: ThinkAction;
}

export const ThinkActionComponent: React.FC<ThinkActionProps> = ({ action, extra }) => {
  return (
    <TrajectoryCard 
      className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800"
      originalJson={action}
      timestamp={action.timestamp}
    >
      <TrajectoryCard.Header extra={extra} className="bg-indigo-100 dark:bg-indigo-800/50 text-indigo-800 dark:text-indigo-100">Thinking</TrajectoryCard.Header>
      <TrajectoryCard.Body>
        {action.args.thought && <CMarkdown>{action.args.thought}</CMarkdown>}
      </TrajectoryCard.Body>
    </TrajectoryCard>
  );
};