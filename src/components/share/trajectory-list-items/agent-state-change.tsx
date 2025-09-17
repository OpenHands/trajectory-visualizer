import React from 'react';
import { TrajectoryCard } from "../trajectory-card";
import { AgentStateChange } from '../../../types/share';
import { CMarkdown } from '../../markdown';

interface AgentStateChangeProps {
  state: AgentStateChange;
}

export const AgentStateChangeComponent: React.FC<AgentStateChangeProps> = ({ state }) => {
  let stateText = '';
  let thought = '';
  
  if ('args' in state && state.args) {
    stateText = state.args.agent_state || '';
    thought = state.args.thought || '';
  } else if ('extras' in state && state.extras) {
    stateText = state.extras.agent_state || '';
  }
  
  return (
    <TrajectoryCard 
      className="bg-gray-50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700"
      originalJson={state}
      timestamp={state.timestamp}
    >
      <TrajectoryCard.Header className="bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200">Agent State: {stateText}</TrajectoryCard.Header>
      <TrajectoryCard.Body>
        {thought && <CMarkdown>{thought}</CMarkdown>}
      </TrajectoryCard.Body>
    </TrajectoryCard>
  );
};