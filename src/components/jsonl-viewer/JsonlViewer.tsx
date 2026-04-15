import React, { useState, useEffect, useMemo, useRef } from 'react';
import { JsonlEntry, parseJsonlFile } from '../../utils/jsonl-parser';
import JsonlViewerSettings, { JsonlViewerSettings as JsonlViewerSettingsType } from './JsonlViewerSettings';
import { getNestedValue, formatValueForDisplay } from '../../utils/object-utils';
import { TrajectoryItem } from '../../types/share';
import { TrajectoryHistoryEntry } from '../../types/trajectory';
import JsonVisualizer from '../json-visualizer/JsonVisualizer';
import { DEFAULT_JSONL_VIEWER_SETTINGS } from '../../config/jsonl-viewer-config';
import {
  isAgentStateChange,
  isUserMessage,
  isAssistantMessage,
  isCommandAction,
  isCommandObservation,
  isIPythonAction,
  isIPythonObservation,
  isFinishAction,
  isErrorObservation,
  isReadAction,
  isReadObservation,
  isEditAction,
  isEditObservation,
  isThinkAction,
  isThinkObservation,
  isEnvironmentEvent,
  isAgentContextEvent,
  isSystemPrompt,
  isUserLLMMessage,
  isAgentThought,
  isAgentAction
} from "../../utils/share";
import {
  AgentStateChangeComponent,
  UserMessageComponent,
  AssistantMessageComponent,
  CommandActionComponent,
  CommandObservationComponent,
  IPythonActionComponent,
  IPythonObservationComponent,
  FinishActionComponent,
  ReadActionComponent,
  ReadObservationComponent,
  EditActionComponent,
  EditObservationComponent,
  ErrorObservationComponent,
  ThinkActionComponent,
  ThinkObservationComponent,
  EnvironmentEventComponent,
  SystemPromptComponent,
  UserLLMMessageComponent,
  AgentThoughtComponent,
  AgentActionComponent,
  AgentContextComponent
} from "../share/trajectory-list-items";
import { CSyntaxHighlighter } from "../syntax-highlighter";
import { TrajectoryCard } from "../share/trajectory-card";

interface JsonlViewerProps {
  content: string;
  instanceId?: string;
  trajectoryStep?: string;
  onInstanceSelect?: (instanceId: string) => void;
  onTrajectoryStepSelect?: (stepIndex: number) => void;
}

const JsonlViewer: React.FC<JsonlViewerProps> = ({ 
  content, 
  instanceId, 
  trajectoryStep,
  onInstanceSelect,
  onTrajectoryStepSelect
}) => {
  const [entries, setEntries] = useState<JsonlEntry[]>([]);
  const [currentEntryIndex, setCurrentEntryIndex] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [trajectoryItems, setTrajectoryItems] = useState<TrajectoryHistoryEntry[]>([]);
  const [settings, setSettings] = useState<JsonlViewerSettingsType>(DEFAULT_JSONL_VIEWER_SETTINGS);
  const [originalEntries, setOriginalEntries] = useState<JsonlEntry[]>([]);
  const [menuOpenIndex, setMenuOpenIndex] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpenIndex(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle copying link for a trajectory step
  const handleCopyStepLink = (index: number) => {
    const currentEntry = entries[currentEntryIndex];
    const instanceId = currentEntry?.instance_id || '';
    const baseUrl = window.location.href.split('?')[0];
    const params = new URLSearchParams();
    
    if (instanceId) {
      params.set('instance_id', instanceId);
    }
    params.set('trajectory_step', index.toString());
    
    const fullUrl = `${baseUrl}?${params.toString()}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      setMenuOpenIndex(null);
    }).catch(err => {
      console.error('Failed to copy link:', err);
      setMenuOpenIndex(null);
    });
  };

  // Parse the JSONL file on component mount or when content changes
  useEffect(() => {
    try {
      const parsedEntries = parseJsonlFile(content);
      setOriginalEntries(parsedEntries);
      
      // Apply initial sorting
      sortAndSetEntries(parsedEntries, settings);
      
      // Extract trajectory items if available
      if (parsedEntries.length > 0) {
        const currentEntry = parsedEntries[0];
        if (currentEntry.history && Array.isArray(currentEntry.history)) {
          setTrajectoryItems(currentEntry.history);
        }
      }
    } catch (err) {
      console.error('Error parsing JSONL file:', err);
      setError(`Failed to parse JSONL file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  // Handle instance_id parameter from URL - select the matching entry
  useEffect(() => {
    if (instanceId && entries.length > 0) {
      const matchingIndex = entries.findIndex(entry => 
        entry.instance_id === instanceId
      );
      if (matchingIndex !== -1 && matchingIndex !== currentEntryIndex) {
        console.log('Selecting matching instance:', instanceId, 'at index:', matchingIndex);
        setCurrentEntryIndex(matchingIndex);
        
        // Update URL with instance_id parameter to keep it in sync
        if (onInstanceSelect) {
          onInstanceSelect(instanceId);
        }
      }
    }
  }, [instanceId, entries, currentEntryIndex, onInstanceSelect]);

  // Sort entries based on settings
  const sortAndSetEntries = (entriesToSort: JsonlEntry[], currentSettings: JsonlViewerSettingsType) => {
    if (entriesToSort.length === 0) {
      setError('No valid entries found in the JSONL file');
      return;
    }
    
    // Create a copy of the entries to sort
    const sortedEntries = [...entriesToSort].sort((a, b) => {
      // Special handling for duration sorting
      if (currentSettings.sortField === 'duration') {
        const durationA = a.history && Array.isArray(a.history) ? calculateDurationMs(a.history) : 0;
        const durationB = b.history && Array.isArray(b.history) ? calculateDurationMs(b.history) : 0;
        return currentSettings.sortDirection === 'asc' ? durationA - durationB : durationB - durationA;
      }

      // Get values using the sort field
      const valueA = getNestedValue(a, currentSettings.sortField, null);
      const valueB = getNestedValue(b, currentSettings.sortField, null);
      
      // Handle null/undefined values
      if (valueA === null && valueB === null) return 0;
      if (valueA === null) return 1;
      if (valueB === null) return -1;
      
      // Compare based on type
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return currentSettings.sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
      }
      
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return currentSettings.sortDirection === 'asc' 
          ? valueA.localeCompare(valueB) 
          : valueB.localeCompare(valueA);
      }
      
      // Convert to string for other types
      const strA = String(valueA);
      const strB = String(valueB);
      return currentSettings.sortDirection === 'asc' 
        ? strA.localeCompare(strB) 
        : strB.localeCompare(strA);
    });
    
    setEntries(sortedEntries);
    
    // Set the first entry as current
    if (sortedEntries.length > 0) {
      setCurrentEntryIndex(0);
    }
  };

  // Handle settings changes
  const handleSettingsChange = (newSettings: JsonlViewerSettingsType) => {
    setSettings(newSettings);
    sortAndSetEntries(originalEntries, newSettings);
  };

  const handleSelectEntry = (index: number) => {
    setCurrentEntryIndex(index);
    
    // Update trajectory items when selecting a new entry
    if (entries.length > 0 && index < entries.length) {
      const selectedEntry = entries[index];
      if (selectedEntry.history && Array.isArray(selectedEntry.history)) {
        setTrajectoryItems(selectedEntry.history);
      } else {
        setTrajectoryItems([]);
      }
    }
  };

  // Get entry display name for the sidebar
  const getEntryDisplayName = (entry: JsonlEntry, index: number): string => {
    if (entry.instance_id) return `Instance #${entry.instance_id}`;
    if (entry.id) return `Entry #${entry.id}`;
    return `Entry ${index + 1}`;
  };

  // Helper function to calculate duration in milliseconds
  const calculateDurationMs = (history: TrajectoryHistoryEntry[]): number => {
    if (!history || history.length === 0 || !history[0].timestamp) return 0;
    
    const startTime = new Date(history[0].timestamp || new Date());
    const endTime = new Date(history[history.length - 1].timestamp || new Date());
    return endTime.getTime() - startTime.getTime();
  };

  // Helper function to format duration
  const formatDuration = (durationMs: number): string => {
    const durationSec = Math.round(durationMs / 1000);
    const durationMin = Math.floor(durationSec / 60);
    const remainingSec = durationSec % 60;
    
    return durationMin > 0 ? 
      `${durationMin}m ${remainingSec}s` : 
      `${remainingSec}s`;
  };

  // Helper function to calculate duration string
  const calculateDuration = (history: TrajectoryHistoryEntry[]): string | null => {
    const durationMs = calculateDurationMs(history);
    return durationMs > 0 ? formatDuration(durationMs) : null;
  };

  // Get a summary of the entry for the sidebar
  const getEntrySummary = (entry: JsonlEntry): React.ReactNode => {
    // If we have custom display fields, use those
    if (settings.displayFields.length > 0) {
      return (
        <div className="space-y-1">
          {settings.displayFields.map((field, idx) => {
            const value = getNestedValue(entry, field, null);
            const displayValue = formatValueForDisplay(value, field);
            
            // Format the field name for display
            let displayField = field;
            if (field.startsWith('len(') && field.endsWith(')')) {
              const innerField = field.substring(4, field.length - 1);
              displayField = `${innerField} length`;
            }
            
            return (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">{displayField}:</span>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{displayValue}</span>
              </div>
            );
          })}
        </div>
      );
    }
    
    // Default behavior if no custom fields
    // Try to find a meaningful summary from the entry
    if (entry.task) return String(entry.task).substring(0, 30) + (String(entry.task).length > 30 ? '...' : '');
    if (entry.query) return String(entry.query).substring(0, 30) + (String(entry.query).length > 30 ? '...' : '');
    if (entry.prompt) return String(entry.prompt).substring(0, 30) + (String(entry.prompt).length > 30 ? '...' : '');
    
    // If history exists, try to get the first user message
    if (entry.history && entry.history.length > 0) {
      const userMessage = entry.history.find(item => 
        (item.actorType === 'User' || item.source === 'user') && item.content
      );
      if (userMessage && userMessage.content) {
        return String(userMessage.content).substring(0, 30) + (String(userMessage.content).length > 30 ? '...' : '');
      }
    }
    
    return 'No summary available';
  };

  if (error) {
    return (
      <div className="p-4 bg-red-100 dark:bg-red-900/10 rounded-lg">
        <p className="text-red-500 dark:text-red-400">{error}</p>
      </div>
    );
  }

  // Get the current entry without the history field for the JSON visualizer
  const currentEntryWithoutHistory = useMemo(() => {
    if (!entries[currentEntryIndex]) return null;
    return { ...entries[currentEntryIndex], history: undefined };
  }, [entries, currentEntryIndex]);

  // Function to filter out unwanted trajectory items
  const shouldDisplayItem = (item: TrajectoryHistoryEntry): boolean => {
    // Filter out change_agent_state actions
    if (item.action === "change_agent_state") {
      return false;
    }

    // Filter out null observations
    if (item.observation === "null") {
      return false;
    }

    // Keep all other items
    return true;
  };

  // Filter the trajectory items
  const filteredTrajectoryItems = useMemo(() => {
    return trajectoryItems.filter(shouldDisplayItem);
  }, [trajectoryItems]);

  // Handle trajectory_step parameter from URL - scroll to that step
  useEffect(() => {
    if (trajectoryStep && filteredTrajectoryItems.length > 0) {
      const stepIndex = parseInt(trajectoryStep, 10);
      if (!isNaN(stepIndex) && stepIndex >= 0 && stepIndex < filteredTrajectoryItems.length) {
        console.log('Scrolling to trajectory step:', stepIndex);
        
        // Find the DOM element for this step and scroll to it
        setTimeout(() => {
          const element = document.getElementById(`trajectory-step-${stepIndex}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
        
        if (onTrajectoryStepSelect) {
          onTrajectoryStepSelect(stepIndex);
        }
      }
    }
  }, [trajectoryStep, filteredTrajectoryItems, onTrajectoryStepSelect]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Settings */}
      <JsonlViewerSettings 
        settings={settings} 
        onSettingsChange={handleSettingsChange} 
      />
      
      {/* Main content with sidebar and metadata */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 overflow-hidden">
        {/* Sidebar with entries list */}
        <div className="flex-none lg:w-1/5 h-full max-h-full border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm overflow-hidden flex flex-col">
          <div className="flex-none px-3 py-2 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Evaluation Instances ({entries.length})
            </h3>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Sorted by: {settings.sortField} ({settings.sortDirection === 'asc' ? 'ascending' : 'descending'})
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar scrollbar-w-1.5 scrollbar-thumb-gray-200/75 dark:scrollbar-thumb-gray-700/75 scrollbar-track-transparent hover:scrollbar-thumb-gray-300/75 dark:hover:scrollbar-thumb-gray-600/75 scrollbar-thumb-rounded">
            {entries.map((entry, index) => (
              <div 
                key={index}
                onClick={() => handleSelectEntry(index)}
                className={`px-3 py-2 cursor-pointer border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                  index === currentEntryIndex ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {getEntryDisplayName(entry, index)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {getEntrySummary(entry)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline with trajectory components - full height with scrollable content */}
        <div className="flex-grow h-full lg:w-3/5 overflow-hidden">
          <div className="h-full flex flex-col border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
            {/* Timeline Header - fixed */}
            <div className="flex-none h-10 px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                <span>Trajectory ({filteredTrajectoryItems.length} steps)</span>
                {(() => {
                  const duration = calculateDuration(filteredTrajectoryItems);
                  return duration && <span className="text-gray-500 dark:text-gray-400 ml-2">- {duration}</span>;
                })()}
              </h3>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {entries[currentEntryIndex] && (
                  <span>
                    {getEntryDisplayName(entries[currentEntryIndex], currentEntryIndex)}
                  </span>
                )}
              </div>
            </div>
            
            {/* Timeline Content - scrollable */}
            <div className="flex-1 min-h-0 overflow-y-auto scrollbar scrollbar-w-1.5 scrollbar-thumb-gray-200/75 dark:scrollbar-thumb-gray-700/75 scrollbar-track-transparent hover:scrollbar-thumb-gray-300/75 dark:hover:scrollbar-thumb-gray-600/75 scrollbar-thumb-rounded p-4" ref={menuRef}>
              {filteredTrajectoryItems.length > 0 ? (
                <div className="flex flex-col items-center gap-4">
                  {filteredTrajectoryItems.map((item, index) => {
                    const trajectoryItem = item as unknown as TrajectoryItem;
                    
                    // Render component with copy link button
                    const renderWithCopyLink = (component: React.ReactNode) => (
                      <div key={index} className="relative w-full max-w-[1000px]" id={`trajectory-step-${index}`}>
                        {component}
                        <div className="absolute top-2 right-2">
                          <button
                            onClick={() => setMenuOpenIndex(menuOpenIndex === index ? null : index)}
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                            aria-label="More options"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </button>
                          {menuOpenIndex === index && (
                            <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                              <button
                                onClick={() => handleCopyStepLink(index)}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                Copy link
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                    
                    // Check OpenHands history format first
                    if (isAgentContextEvent(item)) {
                      // Show agent context with skills as a dedicated component
                      return renderWithCopyLink(<AgentContextComponent key={index} data={item} timestamp={item.timestamp} />);
                    } else if (isEnvironmentEvent(item)) {
                      return renderWithCopyLink(<EnvironmentEventComponent key={index} event={item} />);
                    } else if (isSystemPrompt(item)) {
                      return renderWithCopyLink(<SystemPromptComponent key={index} data={item} />);
                    } else if (isUserLLMMessage(item)) {
                      return renderWithCopyLink(<UserLLMMessageComponent key={index} message={item} />);
                    } else if (isAgentThought(item)) {
                      return renderWithCopyLink(<AgentThoughtComponent key={index} thought={item} />);
                    } else if (isAgentAction(item)) {
                      return renderWithCopyLink(<AgentActionComponent key={index} action={item} />);
                    }
                    
                    // Then check standard format
                    if (isAgentStateChange(trajectoryItem)) {
                      return renderWithCopyLink(<AgentStateChangeComponent key={index} state={trajectoryItem as any} />);
                    } else if (isUserMessage(trajectoryItem)) {
                      return renderWithCopyLink(<UserMessageComponent key={index} message={trajectoryItem as any} />);
                    } else if (isAssistantMessage(trajectoryItem)) {
                      return renderWithCopyLink(<AssistantMessageComponent key={index} message={trajectoryItem as any} />);
                    } else if (isCommandAction(trajectoryItem)) {
                      return renderWithCopyLink(<CommandActionComponent key={index} command={trajectoryItem as any} />);
                    } else if (isCommandObservation(trajectoryItem)) {
                      return renderWithCopyLink(<CommandObservationComponent key={index} observation={trajectoryItem as any} />);
                    } else if (isIPythonAction(trajectoryItem)) {
                      return renderWithCopyLink(<IPythonActionComponent key={index} action={trajectoryItem as any} />);
                    } else if (isIPythonObservation(trajectoryItem)) {
                      return renderWithCopyLink(<IPythonObservationComponent key={index} observation={trajectoryItem as any} />);
                    } else if (isFinishAction(trajectoryItem)) {
                      return renderWithCopyLink(<FinishActionComponent key={index} action={trajectoryItem as any} />);
                    } else if (isErrorObservation(trajectoryItem)) {
                      return renderWithCopyLink(<ErrorObservationComponent key={index} observation={trajectoryItem as any} />);
                    } else if (isReadAction(trajectoryItem)) {
                      return renderWithCopyLink(<ReadActionComponent key={index} item={trajectoryItem as any} />);
                    } else if (isReadObservation(trajectoryItem)) {
                      return renderWithCopyLink(<ReadObservationComponent key={index} observation={trajectoryItem as any} />);
                    } else if (isEditAction(trajectoryItem)) {
                      return renderWithCopyLink(<EditActionComponent key={index} item={trajectoryItem as any} />);
                    } else if (isEditObservation(trajectoryItem)) {
                      return renderWithCopyLink(<EditObservationComponent key={index} observation={trajectoryItem as any} />);
                    } else if (isThinkAction(trajectoryItem)) {
                      return renderWithCopyLink(<ThinkActionComponent key={index} action={trajectoryItem as any} />);
                    } else if (isThinkObservation(trajectoryItem)) {
                      return renderWithCopyLink(<ThinkObservationComponent key={index} observation={trajectoryItem as any} />);
                    } else {
                      return renderWithCopyLink(
                        <TrajectoryCard key={index}>
                          <CSyntaxHighlighter
                            language="json"
                            key={index}
                          >
                            {JSON.stringify(item, null, 2)}
                          </CSyntaxHighlighter>
                        </TrajectoryCard>
                      );
                    }
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <p className="text-xl font-medium mb-2">No trajectory data available</p>
                    <p>The selected entry does not contain a valid trajectory history.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* JSON Visualizer - fixed height, no scroll */}
        <div className="flex-none lg:w-1/5 h-full max-h-full border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm overflow-hidden flex flex-col">
          <div className="flex-none px-3 py-2 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Entry Metadata</h3>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar scrollbar-w-1.5 scrollbar-thumb-gray-200/75 dark:scrollbar-thumb-gray-700/75 scrollbar-track-transparent hover:scrollbar-thumb-gray-300/75 dark:hover:scrollbar-thumb-gray-600/75 scrollbar-thumb-rounded p-3">
            {currentEntryWithoutHistory ? (
              <JsonVisualizer data={currentEntryWithoutHistory} initialExpanded={true} />
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                No metadata available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JsonlViewer;