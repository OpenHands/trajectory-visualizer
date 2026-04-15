import React from 'react';
import { CSyntaxHighlighter } from "../../syntax-highlighter";
import { TrajectoryCard } from "../trajectory-card";
import { CommandAction } from '../../../types/share';
import { CMarkdown } from '../../markdown';

interface CommandActionProps {
  extra?: React.ReactNode;
  command: CommandAction;
}

export const CommandActionComponent: React.FC<CommandActionProps> = ({ command, extra }) => {
  return (
    <TrajectoryCard 
      className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800"
      originalJson={command}
      timestamp={command.timestamp}
    >
      <TrajectoryCard.Header extra={extra} className="bg-green-100 dark:bg-green-800/50 text-green-800 dark:text-green-100">Assistant Shell Action</TrajectoryCard.Header>
      <TrajectoryCard.Body>
        {command.args.thought && <CMarkdown>{command.args.thought}</CMarkdown>}
        <CSyntaxHighlighter language="shell">{command.args.command}</CSyntaxHighlighter>
      </TrajectoryCard.Body>
    </TrajectoryCard>
  );
};