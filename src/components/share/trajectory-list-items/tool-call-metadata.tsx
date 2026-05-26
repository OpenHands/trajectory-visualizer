import React, { useState } from 'react';
import { ToolCallMetadata, LlmMetrics } from '../../../types/share';

interface ToolCallMetadataDisplayProps {
  metadata?: ToolCallMetadata;
  llmMetrics?: LlmMetrics;
}

export const ToolCallMetadataDisplay: React.FC<ToolCallMetadataDisplayProps> = ({ metadata, llmMetrics }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!metadata && !llmMetrics) return null;

  const model = metadata?.model_response?.model;
  const usage = metadata?.model_response?.usage;
  const totalCalls = metadata?.total_calls_in_response;
  const functionName = metadata?.function_name;
  const toolCallId = metadata?.tool_call_id;

  const accumulatedCost = llmMetrics?.accumulated_cost;
  const tokenUsage = llmMetrics?.accumulated_token_usage;

  // Check if there's anything useful to show
  const hasBasicInfo = model || functionName || totalCalls !== undefined;
  const hasTokenInfo = usage || tokenUsage;
  const hasCostInfo = accumulatedCost !== undefined;

  if (!hasBasicInfo && !hasTokenInfo && !hasCostInfo) return null;

  return (
    <div className="mt-2 border-t border-gray-200 dark:border-gray-700 pt-2">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}
        className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        <svg
          className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="font-medium">LLM Metadata</span>
        {model && <span className="ml-1 text-gray-400 dark:text-gray-500">({model})</span>}
      </button>

      {isExpanded && (
        <div className="mt-1.5 space-y-1.5 pl-4">
          {model && (
            <div className="flex items-center gap-2 text-[10px]">
              <span className="text-gray-500 dark:text-gray-400 min-w-[80px]">Model:</span>
              <span className="font-medium text-gray-700 dark:text-gray-300">{model}</span>
            </div>
          )}

          {functionName && (
            <div className="flex items-center gap-2 text-[10px]">
              <span className="text-gray-500 dark:text-gray-400 min-w-[80px]">Function:</span>
              <span className="font-mono text-gray-700 dark:text-gray-300">{functionName}</span>
            </div>
          )}

          {totalCalls !== undefined && (
            <div className="flex items-center gap-2 text-[10px]">
              <span className="text-gray-500 dark:text-gray-400 min-w-[80px]">Tool calls:</span>
              <span className="text-gray-700 dark:text-gray-300">{totalCalls}</span>
            </div>
          )}

          {toolCallId && (
            <div className="flex items-center gap-2 text-[10px]">
              <span className="text-gray-500 dark:text-gray-400 min-w-[80px]">Call ID:</span>
              <span className="font-mono text-[9px] text-gray-600 dark:text-gray-400 truncate max-w-[300px]" title={toolCallId}>
                {toolCallId}
              </span>
            </div>
          )}

          {usage && (
            <div className="mt-1.5">
              <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1">Token Usage (this call):</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 pl-2">
                {usage.prompt_tokens !== undefined && (
                  <div className="flex items-center gap-1 text-[10px]">
                    <span className="text-gray-400 dark:text-gray-500">Prompt:</span>
                    <span className="text-gray-700 dark:text-gray-300">{usage.prompt_tokens.toLocaleString()}</span>
                  </div>
                )}
                {usage.completion_tokens !== undefined && (
                  <div className="flex items-center gap-1 text-[10px]">
                    <span className="text-gray-400 dark:text-gray-500">Completion:</span>
                    <span className="text-gray-700 dark:text-gray-300">{usage.completion_tokens.toLocaleString()}</span>
                  </div>
                )}
                {usage.total_tokens !== undefined && (
                  <div className="flex items-center gap-1 text-[10px]">
                    <span className="text-gray-400 dark:text-gray-500">Total:</span>
                    <span className="text-gray-700 dark:text-gray-300">{usage.total_tokens.toLocaleString()}</span>
                  </div>
                )}
                {usage.prompt_tokens_details?.cached_tokens !== undefined && usage.prompt_tokens_details.cached_tokens > 0 && (
                  <div className="flex items-center gap-1 text-[10px]">
                    <span className="text-gray-400 dark:text-gray-500">Cached:</span>
                    <span className="text-gray-700 dark:text-gray-300">{usage.prompt_tokens_details.cached_tokens.toLocaleString()}</span>
                  </div>
                )}
                {usage.cache_read_input_tokens !== undefined && usage.cache_read_input_tokens > 0 && (
                  <div className="flex items-center gap-1 text-[10px]">
                    <span className="text-gray-400 dark:text-gray-500">Cache read:</span>
                    <span className="text-gray-700 dark:text-gray-300">{usage.cache_read_input_tokens.toLocaleString()}</span>
                  </div>
                )}
                {usage.cache_creation_input_tokens !== undefined && usage.cache_creation_input_tokens > 0 && (
                  <div className="flex items-center gap-1 text-[10px]">
                    <span className="text-gray-400 dark:text-gray-500">Cache write:</span>
                    <span className="text-gray-700 dark:text-gray-300">{usage.cache_creation_input_tokens.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {tokenUsage && (
            <div className="mt-1.5">
              <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1">Accumulated Token Usage:</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 pl-2">
                {tokenUsage.prompt_tokens !== undefined && (
                  <div className="flex items-center gap-1 text-[10px]">
                    <span className="text-gray-400 dark:text-gray-500">Prompt:</span>
                    <span className="text-gray-700 dark:text-gray-300">{tokenUsage.prompt_tokens.toLocaleString()}</span>
                  </div>
                )}
                {tokenUsage.completion_tokens !== undefined && (
                  <div className="flex items-center gap-1 text-[10px]">
                    <span className="text-gray-400 dark:text-gray-500">Completion:</span>
                    <span className="text-gray-700 dark:text-gray-300">{tokenUsage.completion_tokens.toLocaleString()}</span>
                  </div>
                )}
                {tokenUsage.total_tokens !== undefined && (
                  <div className="flex items-center gap-1 text-[10px]">
                    <span className="text-gray-400 dark:text-gray-500">Total:</span>
                    <span className="text-gray-700 dark:text-gray-300">{tokenUsage.total_tokens.toLocaleString()}</span>
                  </div>
                )}
                {tokenUsage.cache_read_tokens !== undefined && tokenUsage.cache_read_tokens > 0 && (
                  <div className="flex items-center gap-1 text-[10px]">
                    <span className="text-gray-400 dark:text-gray-500">Cache read:</span>
                    <span className="text-gray-700 dark:text-gray-300">{tokenUsage.cache_read_tokens.toLocaleString()}</span>
                  </div>
                )}
                {tokenUsage.cache_write_tokens !== undefined && tokenUsage.cache_write_tokens > 0 && (
                  <div className="flex items-center gap-1 text-[10px]">
                    <span className="text-gray-400 dark:text-gray-500">Cache write:</span>
                    <span className="text-gray-700 dark:text-gray-300">{tokenUsage.cache_write_tokens.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {accumulatedCost !== undefined && (
            <div className="flex items-center gap-2 text-[10px]">
              <span className="text-gray-500 dark:text-gray-400 min-w-[80px]">Accumulated cost:</span>
              <span className="font-medium text-gray-700 dark:text-gray-300">${accumulatedCost.toFixed(4)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
