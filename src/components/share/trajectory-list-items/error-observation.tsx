import React from 'react';
import { CSyntaxHighlighter } from "../../syntax-highlighter";
import { TrajectoryCard } from "../trajectory-card";
import { ErrorObservation } from '../../../types/share';

interface ErrorObservationProps {
  extra?: React.ReactNode;
  observation: ErrorObservation;
}

export const ErrorObservationComponent: React.FC<ErrorObservationProps> = ({ observation, extra }) => {
  return (
    <TrajectoryCard 
      className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800"
      originalJson={observation}
      timestamp={observation.timestamp}
    >
      <TrajectoryCard.Header extra={extra} className="bg-red-100 dark:bg-red-800/50 text-red-800 dark:text-red-100">Error</TrajectoryCard.Header>
      <TrajectoryCard.Body>
        <CSyntaxHighlighter language="shell">{observation.content}</CSyntaxHighlighter>
      </TrajectoryCard.Body>
    </TrajectoryCard>
  );
};