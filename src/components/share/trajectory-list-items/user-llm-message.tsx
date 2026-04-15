import React from 'react';
import { TrajectoryCard } from "../trajectory-card";
import { CMarkdown } from '../../markdown';

interface UserLLMMessageProps {
  extra?: React.ReactNode;
  message: any;
}

export const UserLLMMessageComponent: React.FC<UserLLMMessageProps> = ({ message, extra }) => {
  const content = message.llm_message?.content;
  
  const extractText = (content: any): string => {
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
      return content.map(c => {
        if (c.type === 'text') return c.text || '';
        if (c.type === 'image_url') return '[Image]';
        return '';
      }).filter(Boolean).join('\n');
    }
    return JSON.stringify(content);
  };

  return (
    <TrajectoryCard
      className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800"
      originalJson={message}
      timestamp={message.timestamp}
    >
      <TrajectoryCard.Header extra={extra} className="bg-blue-100 dark:bg-blue-800/50 text-blue-800 dark:text-blue-100">
        👤 User Message (LLM)
      </TrajectoryCard.Header>
      <TrajectoryCard.Body>
        <CMarkdown>{extractText(content)}</CMarkdown>
      </TrajectoryCard.Body>
    </TrajectoryCard>
  );
};