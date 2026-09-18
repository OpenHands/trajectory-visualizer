import React from 'react';
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
  isEditObservation
} from "../../utils/share";
import { CSyntaxHighlighter } from "../syntax-highlighter";
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
  ErrorObservationComponent
} from "./trajectory-list-items";
import { TrajectoryCard } from "./trajectory-card";
import { TrajectoryItem } from '../../types/share';

interface TrajectoryListProps {
  trajectory: TrajectoryItem[];
}

export const TrajectoryList: React.FC<TrajectoryListProps> = ({ trajectory }) => {
  const shouldDisplayItem = (item: TrajectoryItem): boolean => {
    // Filter out change_agent_state actions
    if ("action" in item && item.action === "change_agent_state" as const) {
      return false;
    }

    // Filter out null observations
    if ("observation" in item && typeof item.observation === "string" && item.observation === "null") {
      return false;
    }

    // Keep all other items
    return true;
  };

  // Apply filtering to remove unwanted events
  const filteredTrajectory = trajectory.filter(shouldDisplayItem);
  
  return (
    <div className="flex flex-col h-full">
      {/* Trajectory Items List */}
      <div className="flex flex-col h-full border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Trajectory Items ({filteredTrajectory.length} items)
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-col gap-4">
            {filteredTrajectory.map((item, index) => {
              if (isAgentStateChange(item)) {
                return <AgentStateChangeComponent key={index} state={item} />;
              } else if (isUserMessage(item)) {
                return <UserMessageComponent key={index} message={item} />;
              } else if (isAssistantMessage(item)) {
                return <AssistantMessageComponent key={index} message={item} />;
              } else if (isCommandAction(item)) {
                return <CommandActionComponent key={index} command={item} />;
              } else if (isCommandObservation(item)) {
                return <CommandObservationComponent key={index} observation={item} />;
              } else if (isIPythonAction(item)) {
                return <IPythonActionComponent key={index} action={item} />;
              } else if (isIPythonObservation(item)) {
                return <IPythonObservationComponent key={index} observation={item} />;
              } else if (isFinishAction(item)) {
                return <FinishActionComponent key={index} action={item} />;
              } else if (isErrorObservation(item)) {
                return <ErrorObservationComponent key={index} observation={item} />;
              } else if (isReadAction(item)) {
                return <ReadActionComponent key={index} item={item} />;
              } else if (isReadObservation(item)) {
                return <ReadObservationComponent key={index} observation={item} />;
              } else if (isEditAction(item)) {
                return <EditActionComponent key={index} item={item} />;
              } else if (isEditObservation(item)) {
                return <EditObservationComponent key={index} observation={item} />;
              } else {
                const rawItem = item as unknown as Record<string, unknown>;
                const source = typeof rawItem.source === "string" ? rawItem.source : undefined;
                const timestamp = typeof rawItem.timestamp === "string" ? rawItem.timestamp : undefined;
                const message = typeof rawItem.message === "string" ? rawItem.message : undefined;

                return (
                  <TrajectoryCard
                    key={index}
                    originalJson={item}
                    timestamp={timestamp}
                    className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700"
                  >
                    <TrajectoryCard.Header className="bg-gray-100 dark:bg-gray-800/50 text-gray-800 dark:text-gray-100">
                      {source ? `${source.charAt(0).toUpperCase()}${source.slice(1)} step` : `Item #${index + 1}`}
                    </TrajectoryCard.Header>
                    <TrajectoryCard.Body>
                      {message && (
                        <div className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                          {message}
                        </div>
                      )}
                      <CSyntaxHighlighter language="json">
                        {JSON.stringify(item, null, 2)}
                      </CSyntaxHighlighter>
                    </TrajectoryCard.Body>
                  </TrajectoryCard>
                );
              }
            })}
            
            {filteredTrajectory.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>No trajectory items to display.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrajectoryList;
