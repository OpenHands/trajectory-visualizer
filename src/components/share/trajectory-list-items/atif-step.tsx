import React from 'react';
import { CMarkdown } from '../../markdown';
import { CSyntaxHighlighter } from '../../syntax-highlighter';
import { TrajectoryCard } from '../trajectory-card';

interface AtifToolCall {
  function_name?: string;
  arguments?: unknown;
  tool_call_id?: string;
}

interface AtifObservationResult {
  content?: unknown;
  source_call_id?: string;
}

export interface AtifStep {
  step_id?: number;
  timestamp?: string;
  source?: string;
  message?: string;
  model_name?: string;
  tool_calls?: AtifToolCall[];
  observation?: {
    results?: AtifObservationResult[];
  };
}

interface AtifStepProps {
  step: AtifStep;
}

const sourceStyles: Record<string, string> = {
  system: 'bg-slate-100 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100',
  user: 'bg-blue-100 dark:bg-blue-800/50 text-blue-800 dark:text-blue-100',
  agent: 'bg-amber-100 dark:bg-amber-800/50 text-amber-800 dark:text-amber-100'
};

const previewLines = (content: string, maxLines = 5) => {
  const lines = content.split('\n');
  return {
    text: lines.slice(0, maxLines).join('\n'),
    truncated: lines.length > maxLines
  };
};

const getArgument = (toolCall: AtifToolCall, name: string): unknown => {
  if (!toolCall.arguments || typeof toolCall.arguments !== 'object') return undefined;
  return (toolCall.arguments as Record<string, unknown>)[name];
};

export const AtifStepComponent: React.FC<AtifStepProps> = ({ step }) => {
  const source = step.source || 'unknown';
  const toolCalls = Array.isArray(step.tool_calls) ? step.tool_calls : [];
  const results = Array.isArray(step.observation?.results) ? step.observation.results : [];
  const message = typeof step.message === 'string' ? step.message : '';
  const headerSource = `${source.charAt(0).toUpperCase()}${source.slice(1)}`;
  const outputContents = results
    .map(result => typeof result.content === 'string' ? result.content : '')
    .filter(Boolean);
  const thought = toolCalls
    .map(toolCall => toolCall.function_name === 'think' ? getArgument(toolCall, 'thought') : undefined)
    .find(value => typeof value === 'string') as string | undefined;
  const previewContent = source === 'system' ? message : thought || outputContents[0] || message;
  const preview = previewLines(previewContent);
  const hasLongContent = message.split('\n').length > 5 || Boolean(thought && thought.split('\n').length > 5) || outputContents.some(content => content.split('\n').length > 5);
  const shouldCollapse = source === 'system' || hasLongContent;
  const toolNames = toolCalls.map(toolCall => toolCall.function_name || 'Unnamed tool').join(', ');

  return (
    <TrajectoryCard
      className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700"
      originalJson={step}
      timestamp={step.timestamp}
      defaultCollapsed={shouldCollapse}
      collapsedPreview={previewContent ? (
        <div className="p-2 flex flex-col gap-1">
          <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
            {toolNames ? `Preview · ${toolNames}` : 'Preview'}
          </div>
          <pre className="max-h-32 overflow-hidden whitespace-pre-wrap text-xs text-gray-700 dark:text-gray-300">{preview.text}</pre>
          {preview.truncated && <div className="text-[10px] text-gray-500 dark:text-gray-400 italic">Showing the first 5 lines. Expand to see more.</div>}
        </div>
      ) : undefined}
    >
      <TrajectoryCard.Header className={sourceStyles[source] || sourceStyles.agent}>
        {headerSource} step{step.step_id !== undefined ? ` #${step.step_id}` : ''}
        {step.model_name && <span className="ml-2 font-normal opacity-75">({step.model_name})</span>}
      </TrajectoryCard.Header>
      <TrajectoryCard.Body>
        {message && (
          <div className="text-sm text-gray-700 dark:text-gray-300">
            <CMarkdown>{message}</CMarkdown>
          </div>
        )}

        {toolCalls.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Tool calls ({toolCalls.length})
            </div>
            {toolCalls.map((toolCall, index) => (
              <div key={toolCall.tool_call_id || index} className="rounded border border-amber-200 dark:border-amber-800/60 overflow-hidden">
                <div className="px-2 py-1 bg-amber-50 dark:bg-amber-900/20 text-xs font-medium text-amber-800 dark:text-amber-200">
                  {toolCall.function_name || 'Unnamed tool'}
                </div>
                {toolCall.function_name === 'think' && typeof getArgument(toolCall, 'thought') === 'string' ? (
                  <div className="p-2 text-sm text-gray-700 dark:text-gray-300">
                    <CMarkdown>{getArgument(toolCall, 'thought') as string}</CMarkdown>
                  </div>
                ) : toolCall.function_name === 'terminal' && typeof getArgument(toolCall, 'command') === 'string' ? (
                  <CSyntaxHighlighter language="shell">
                    {getArgument(toolCall, 'command') as string}
                  </CSyntaxHighlighter>
                ) : toolCall.arguments !== undefined && (
                  <CSyntaxHighlighter language="json">
                    {JSON.stringify(toolCall.arguments, null, 2)}
                  </CSyntaxHighlighter>
                )}
              </div>
            ))}
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Tool output ({results.length})
            </div>
            {results.map((result, index) => (
              <CSyntaxHighlighter key={result.source_call_id || index} language="text">
                {typeof result.content === 'string' ? result.content : JSON.stringify(result.content, null, 2)}
              </CSyntaxHighlighter>
            ))}
          </div>
        )}

        {!message && toolCalls.length === 0 && results.length === 0 && (
          <div className="text-sm text-gray-500 dark:text-gray-400">No content in this step.</div>
        )}
      </TrajectoryCard.Body>
    </TrajectoryCard>
  );
};
