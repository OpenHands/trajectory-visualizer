import React from 'react';
import { TrajectoryCard } from "../trajectory-card";
import { UserMessage } from '../../../types/share';
import { CMarkdown } from '../../markdown';

interface UserMessageProps {
  extra?: React.ReactNode;
  message: UserMessage;
}

export const UserMessageComponent: React.FC<UserMessageProps> = ({ message, extra }) => {
  const content = message.content || message.args?.content || '';
  
  return (
    <TrajectoryCard 
      className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800"
      originalJson={message}
      timestamp={message.timestamp}
    >
      <TrajectoryCard.Header extra={extra} className="bg-blue-100 dark:bg-blue-800/50 text-blue-800 dark:text-blue-100">User Message</TrajectoryCard.Header>
      <TrajectoryCard.Body>
        <CMarkdown>{content}</CMarkdown>
      </TrajectoryCard.Body>
    </TrajectoryCard>
  );
};