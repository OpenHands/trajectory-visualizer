import React, { useState, useCallback } from 'react';

interface JsonVisualizerProps {
  data: any;
  excludeKeys?: string[];
  initialExpanded?: boolean;
  enableSearch?: boolean;
}

interface SearchResult {
  path: string;
  value: string;
  context: string;
}

const JsonVisualizer: React.FC<JsonVisualizerProps> = ({ 
  data, 
  excludeKeys = ['history'], 
  initialExpanded = false,
  enableSearch = false
}) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const toggleExpand = (path: string) => {
    setExpanded(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const expandPath = useCallback((path: string) => {
    // Expand all parent paths to make the target visible
    const parts = path.split('.');
    const pathsToExpand: Record<string, boolean> = {};
    let currentPath = '';
    for (const part of parts) {
      currentPath = currentPath ? `${currentPath}.${part}` : part;
      pathsToExpand[currentPath] = true;
    }
    setExpanded(prev => ({ ...prev, ...pathsToExpand }));
  }, []);

  const isExpanded = (path: string) => {
    return path === '' ? initialExpanded : expanded[path] || false;
  };

  // Search through the JSON data
  const searchInData = useCallback((obj: any, query: string, path: string = ''): SearchResult[] => {
    const results: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    if (obj === null || obj === undefined) return results;

    if (typeof obj === 'string') {
      if (obj.toLowerCase().includes(lowerQuery)) {
        const idx = obj.toLowerCase().indexOf(lowerQuery);
        const start = Math.max(0, idx - 30);
        const end = Math.min(obj.length, idx + query.length + 30);
        const context = (start > 0 ? '...' : '') + obj.slice(start, end) + (end < obj.length ? '...' : '');
        results.push({ path, value: obj, context });
      }
    } else if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        const itemPath = path ? `${path}.${index}` : `${index}`;
        results.push(...searchInData(item, query, itemPath));
      });
    } else if (typeof obj === 'object') {
      Object.entries(obj).forEach(([key, value]) => {
        const keyPath = path ? `${path}.${key}` : key;
        // Also search in keys
        if (key.toLowerCase().includes(lowerQuery)) {
          results.push({ path: keyPath, value: key, context: `Key: ${key}` });
        }
        results.push(...searchInData(value, query, keyPath));
      });
    }

    return results;
  }, []);

  const handleSearch = useCallback(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    const results = searchInData(data, searchQuery.trim());
    setSearchResults(results.slice(0, 50)); // Limit to 50 results
    setShowSearchResults(true);
  }, [data, searchQuery, searchInData]);

  const handleResultClick = useCallback((path: string) => {
    // Remove numeric indices for path expansion
    const expandablePath = path.split('.').slice(0, -1).join('.');
    if (expandablePath) {
      expandPath(expandablePath);
    }
    expandPath(path);
    setShowSearchResults(false);
  }, [expandPath]);

  const renderValue = (value: any, path: string, key: string) => {
    const currentPath = path ? `${path}.${key}` : key;
    
    // Skip excluded keys
    if (excludeKeys.includes(key)) {
      return (
        <div className="pl-4 text-gray-400 dark:text-gray-500 italic text-xs">
          [Hidden for brevity]
        </div>
      );
    }

    if (value === null) {
      return <span className="text-gray-500 dark:text-gray-400">null</span>;
    }

    if (typeof value === 'undefined') {
      return <span className="text-gray-500 dark:text-gray-400">undefined</span>;
    }

    if (typeof value === 'boolean') {
      return <span className="text-blue-600 dark:text-blue-400">{value.toString()}</span>;
    }

    if (typeof value === 'number') {
      return <span className="text-green-600 dark:text-green-400">{value}</span>;
    }

    if (typeof value === 'string') {
      if (value.length > 100) {
        return (
          <div>
            <span className="text-amber-600 dark:text-amber-400">"{value.substring(0, 100)}..."</span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(currentPath);
              }}
              className="ml-2 text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {isExpanded(currentPath) ? 'Show Less' : 'Show More'}
            </button>
            {isExpanded(currentPath) && (
              <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 whitespace-pre-wrap text-amber-600 dark:text-amber-400 max-h-96 overflow-y-auto">
                "{value}"
              </div>
            )}
          </div>
        );
      }
      return <span className="text-amber-600 dark:text-amber-400">"{value}"</span>;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-gray-500 dark:text-gray-400">[]</span>;
      }

      return (
        <div>
          <div 
            onClick={() => toggleExpand(currentPath)}
            className="cursor-pointer flex items-center"
          >
            <span className="text-gray-500 dark:text-gray-400">Array({value.length})</span>
            <button className="ml-2 text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
              {isExpanded(currentPath) ? 'Collapse' : 'Expand'}
            </button>
          </div>
          {isExpanded(currentPath) && (
            <div className="pl-4 border-l border-gray-200 dark:border-gray-700 mt-1">
              {value.map((item, index) => (
                <div key={index} className="mt-1">
                  <span className="text-gray-500 dark:text-gray-400">{index}: </span>
                  {renderValue(item, currentPath, index.toString())}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (typeof value === 'object') {
      const keys = Object.keys(value);
      if (keys.length === 0) {
        return <span className="text-gray-500 dark:text-gray-400">{'{}'}</span>;
      }

      return (
        <div>
          <div 
            onClick={() => toggleExpand(currentPath)}
            className="cursor-pointer flex items-center"
          >
            <span className="text-gray-500 dark:text-gray-400">Object({keys.length})</span>
            <button className="ml-2 text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
              {isExpanded(currentPath) ? 'Collapse' : 'Expand'}
            </button>
          </div>
          {isExpanded(currentPath) && (
            <div className="pl-4 border-l border-gray-200 dark:border-gray-700 mt-1">
              {keys.map(objKey => (
                <div key={objKey} className="mt-1">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">{objKey}: </span>
                  {renderValue(value[objKey], currentPath, objKey)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return <span>{String(value)}</span>;
  };

  return (
    <div className="font-mono text-xs bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 p-3 overflow-auto">
      {enableSearch && (
        <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search in JSON..."
              className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            <button
              onClick={handleSearch}
              className="px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded"
            >
              Search
            </button>
          </div>
          {showSearchResults && (
            <div className="mt-2 max-h-48 overflow-y-auto">
              {searchResults.length === 0 ? (
                <div className="text-gray-500 dark:text-gray-400 text-xs py-2">No results found</div>
              ) : (
                <>
                  <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">
                    Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                  </div>
                  {searchResults.map((result, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleResultClick(result.path)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                    >
                      <div className="text-blue-600 dark:text-blue-400 text-xs truncate">{result.path}</div>
                      <div className="text-gray-600 dark:text-gray-300 text-xs mt-1 truncate">{result.context}</div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      )}
      {renderValue(data, '', '')}
    </div>
  );
};

export default JsonVisualizer;