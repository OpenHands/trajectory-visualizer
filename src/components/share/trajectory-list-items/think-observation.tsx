import React from 'react';
import { TrajectoryCard } from "../trajectory-card";

interface ThinkObservation {
  id: number;
  cause: number;
  observation: "think";
  message: string;
  content: string;
  source: "agent";
  timestamp: string;
  extras: Record<string, unknown>;
}

interface ThinkObservationProps {
  extra?: React.ReactNode;
  observation: ThinkObservation;
}

export const ThinkObservationComponent: React.FC<ThinkObservationProps> = ({ observation, extra }) => {
  return (
    <TrajectoryCard 
      className="bg-gray-50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700"
      originalJson={observation}
      timestamp={observation.timestamp}
    >
      <TrajectoryCard.Header extra={extra} className="bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200">Thought Logged</TrajectoryCard.Header>
      <TrajectoryCard.Body>
        <div className="text-xs text-gray-600 dark:text-gray-400">
          {observation.content || "Your thought has been logged."}
        </div>
      </TrajectoryCard.Body>
    </TrajectoryCard>
  );
};