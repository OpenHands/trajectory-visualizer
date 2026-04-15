import React from 'react';
import { CSyntaxHighlighter } from "../../syntax-highlighter";
import { TrajectoryCard } from "../trajectory-card";
import { FinishAction } from '../../../types/share';
import { CMarkdown } from '../../markdown';

interface FinishActionProps {
  extra?: React.ReactNode;
  action: FinishAction;
}

export const FinishActionComponent: React.FC<FinishActionProps> = ({ action, extra }) => {
  return (
    <TrajectoryCard 
      className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800"
      originalJson={action}
      timestamp={action.timestamp}
    >
      <TrajectoryCard.Header extra={extra} className="bg-green-100 dark:bg-green-800/50 text-green-800 dark:text-green-100">Finish</TrajectoryCard.Header>
      <TrajectoryCard.Body>
        {action.args.thought && <CMarkdown>{action.args.thought}</CMarkdown>}
        {action.args.final_thought && (
          <>
            <div className="text-xs font-medium mt-1 mb-0.5">Final Thought:</div>
            <CMarkdown>{action.args.final_thought}</CMarkdown>
          </>
        )}
        {Object.keys(action.args.outputs).length > 0 && (
          <CSyntaxHighlighter language="json">
            {JSON.stringify(action.args.outputs, null, 2)}
          </CSyntaxHighlighter>
        )}
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Task completed: {action.args.task_completed || 'unknown'}
        </div>
      </TrajectoryCard.Body>
    </TrajectoryCard>
  );
};