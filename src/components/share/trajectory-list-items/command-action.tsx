import React from 'react';
import { CSyntaxHighlighter } from "../../syntax-highlighter";
import { TrajectoryCard } from "../trajectory-card";
import { CommandAction } from '../../../types/share';
import { CMarkdown } from '../../markdown';
import { ToolCallMetadataDisplay } from './tool-call-metadata';

interface CommandActionProps {
  command: CommandAction;
}

export const CommandActionComponent: React.FC<CommandActionProps> = ({ command }) => {
  return (
    <TrajectoryCard 
      className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800"
      originalJson={command}
      timestamp={command.timestamp}
    >
      <TrajectoryCard.Header className="bg-green-100 dark:bg-green-800/50 text-green-800 dark:text-green-100">Assistant Shell Action</TrajectoryCard.Header>
      <TrajectoryCard.Body>
        {command.args.thought && <CMarkdown>{command.args.thought}</CMarkdown>}
        <CSyntaxHighlighter language="shell">{command.args.command}</CSyntaxHighlighter>
        <ToolCallMetadataDisplay metadata={command.tool_call_metadata} llmMetrics={command.llm_metrics} />
      </TrajectoryCard.Body>
    </TrajectoryCard>
  );
};