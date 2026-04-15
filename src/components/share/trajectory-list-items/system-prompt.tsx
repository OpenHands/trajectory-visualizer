import React from 'react';
import { CSyntaxHighlighter } from "../../syntax-highlighter";
import { TrajectoryCard } from "../trajectory-card";
import { CMarkdown } from '../../markdown';

interface SystemPromptProps {
  extra?: React.ReactNode;
  data: any;
}

export const SystemPromptComponent: React.FC<SystemPromptProps> = ({ data, extra }) => {
  const prompt = data.system_prompt?.text || data.system_prompt || '';

  return (
    <TrajectoryCard
      className="bg-slate-50 dark:bg-slate-900/10 border border-slate-200 dark:border-slate-800"
      originalJson={data}
      timestamp={data.timestamp}
    >
      <TrajectoryCard.Header extra={extra} className="bg-slate-100 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100">
        ⚙️ System Prompt
      </TrajectoryCard.Header>
      <TrajectoryCard.Body>
        <div className="max-h-64 overflow-y-auto">
          <CMarkdown>{prompt}</CMarkdown>
        </div>
        {data.tools && (
          <>
            <div className="text-xs text-gray-500 mb-1 mt-3">Tools Available:</div>
            <CSyntaxHighlighter language="json">
              {JSON.stringify(data.tools, null, 2)}
            </CSyntaxHighlighter>
          </>
        )}
      </TrajectoryCard.Body>
    </TrajectoryCard>
  );
};