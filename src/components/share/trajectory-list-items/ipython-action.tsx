import React from 'react';
import { CSyntaxHighlighter } from "../../syntax-highlighter";
import { TrajectoryCard } from "../trajectory-card";
import { IPythonAction } from '../../../types/share';
import { CMarkdown } from '../../markdown';

interface IPythonActionProps {
  extra?: React.ReactNode;
  action: IPythonAction;
}

export const IPythonActionComponent: React.FC<IPythonActionProps> = ({ action, extra }) => {
  return (
    <TrajectoryCard 
      className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800"
      originalJson={action}
      timestamp={action.timestamp}
    >
      <TrajectoryCard.Header extra={extra} className="bg-yellow-100 dark:bg-yellow-800/50 text-yellow-800 dark:text-yellow-100">IPython Action</TrajectoryCard.Header>
      <TrajectoryCard.Body>
        {action.args.thought && <CMarkdown>{action.args.thought}</CMarkdown>}
        <CSyntaxHighlighter language="python">{action.args.code}</CSyntaxHighlighter>
      </TrajectoryCard.Body>
    </TrajectoryCard>
  );
};