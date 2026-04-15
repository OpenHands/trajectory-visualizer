import React from 'react';
import { TrajectoryCard } from "../trajectory-card";
import { AssistantMessage } from '../../../types/share';
import { CMarkdown } from '../../markdown';

interface AssistantMessageProps {
  extra?: React.ReactNode;
  message: AssistantMessage;
}

export const AssistantMessageComponent: React.FC<AssistantMessageProps> = ({ message, extra }) => {
  const content = message.content || message.args?.content || '';
  
  return (
    <TrajectoryCard 
      className="bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800"
      originalJson={message}
      timestamp={message.timestamp}
    >
      <TrajectoryCard.Header extra={extra} className="bg-purple-100 dark:bg-purple-800/50 text-purple-800 dark:text-purple-100">Assistant Message</TrajectoryCard.Header>
      <TrajectoryCard.Body>
        <CMarkdown>{content}</CMarkdown>
      </TrajectoryCard.Body>
    </TrajectoryCard>
  );
};