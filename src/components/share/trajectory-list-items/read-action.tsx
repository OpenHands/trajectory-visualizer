import React from 'react';
import { CSyntaxHighlighter } from "../../syntax-highlighter";
import { TrajectoryCard } from "../trajectory-card";
import { ReadAction } from '../../../types/share';
import { CMarkdown } from '../../markdown';

interface ReadActionProps {
  extra?: React.ReactNode;
  item: ReadAction;
}

export const ReadActionComponent: React.FC<ReadActionProps> = ({ item, extra }) => {
  return (
    <TrajectoryCard 
      className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800"
      originalJson={item}
      timestamp={item.timestamp}
    >
      <TrajectoryCard.Header extra={extra} className="bg-indigo-100 dark:bg-indigo-800/50 text-indigo-800 dark:text-indigo-100">File Read Action</TrajectoryCard.Header>
      <TrajectoryCard.Body>
        {item.args.thought && <CMarkdown>{item.args.thought}</CMarkdown>}
        <CSyntaxHighlighter language="shell">{`cat ${item.args.path}`}</CSyntaxHighlighter>
      </TrajectoryCard.Body>
    </TrajectoryCard>
  );
};