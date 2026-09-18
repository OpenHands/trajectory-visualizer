import React, { useState } from 'react';
import { CSyntaxHighlighter } from '../syntax-highlighter';

interface ExpandableContentProps {
  content: string;
  maxLines: number;
  language?: string;
  renderContent?: (content: string) => React.ReactNode;
}

export const ExpandableContent: React.FC<ExpandableContentProps> = ({
  content,
  maxLines,
  language,
  renderContent
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const lines = content.split('\n');
  const isExpandable = lines.length > maxLines;
  const displayedContent = isExpanded ? content : lines.slice(0, maxLines).join('\n');
  const renderedContent = renderContent
    ? renderContent(displayedContent)
    : language
      ? <CSyntaxHighlighter language={language}>{displayedContent}</CSyntaxHighlighter>
      : <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">{displayedContent}</pre>;

  return (
    <div className="space-y-1">
      {renderedContent}
      {isExpandable && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 px-3 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </button>
        </div>
      )}
    </div>
  );
};
