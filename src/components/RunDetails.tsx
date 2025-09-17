import React, { useEffect, useState, useCallback } from 'react';
import { RunDetailsResponse, WorkflowRun, Artifact } from '../types';
import { api } from '../services/api';
import RunDetailsSkeleton from './loading/RunDetailsSkeleton';
import ArtifactDetails from './artifacts/ArtifactDetails';
import RunHeader from './header/RunHeader';
import JsonlViewer from '../components/jsonl-viewer/JsonlViewer';
import TrajectoryList from './share/trajectory-list';

interface RunDetailsProps {
  owner: string;
  repo: string;
  run: WorkflowRun;
  initialContent?: any;
}

const RunDetails: React.FC<RunDetailsProps> = ({ owner, repo, run, initialContent }) => {
  const [runDetails, setRunDetails] = useState<RunDetailsResponse | null>(null);
  const [artifactContent, setArtifactContent] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [contentLoading, setContentLoading] = useState<boolean>(false);
  const [processingArtifact, setProcessingArtifact] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleArtifactSelect = useCallback(async (artifact: Artifact) => {
    if (!artifact) return;
    setContentLoading(true);

    try {
      console.log('Loading artifact content for:', artifact.name);
      const content = await api.getArtifactContent(owner, repo, artifact.id);
      console.log('Fetched artifact content:', content);
      
      // For large artifacts, show processing state
      if (content?.content?.history?.length > 50 || content?.content?.jsonlHistory?.length > 50) {
        setProcessingArtifact(true);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      setArtifactContent(content);
    } catch (err) {
      console.error('Failed to fetch artifact content:', err);
      setArtifactContent(null);
    } finally {
      setContentLoading(false);
      setProcessingArtifact(false);
    }
  }, [owner, repo]);

  useEffect(() => {
    const fetchRunDetails = async () => {
      if (!owner || !repo || !run) return;

      try {
        setLoading(true);
        setProcessingArtifact(false);
        
        if (initialContent) {
          setRunDetails({
            run: run,
            jobs: { total_count: 0, jobs: [] },
            artifacts: { total_count: 0, artifacts: [] }
          });
          setArtifactContent(initialContent);
        } else {
          const details = await api.getRunDetails(owner, repo, run.id);
          setRunDetails(details);
          setArtifactContent(null);

          if (details.artifacts?.artifacts?.length === 1 && run.conclusion === 'success') {
            await handleArtifactSelect(details.artifacts.artifacts[0]);
          }
        }

        setError(null);
      } catch (err) {
        console.error('Failed to fetch run details:', err);
        setError('Failed to load run details. Please try again.');
      } finally {
        if (!processingArtifact) {
          setLoading(false);
        }
      }
    };

    fetchRunDetails();
  }, [owner, repo, run, handleArtifactSelect, processingArtifact, initialContent]);

  if (loading || contentLoading || processingArtifact) {
    return <RunDetailsSkeleton />;
  }

  if (error || !runDetails) {
    return (
      <div className="p-4 bg-red-100 dark:bg-red-900/10 rounded-lg">
        <p className="text-red-500 dark:text-red-400">{error || 'Failed to load run details'}</p>
      </div>
    );
  }

  // Check if we're dealing with a JSONL file
  if (artifactContent?.content?.fileType === 'jsonl' && artifactContent?.content?.jsonlContent) {
    console.log('Rendering JSONL viewer with content:', artifactContent.content.jsonlContent.substring(0, 100) + '...');
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <JsonlViewer content={artifactContent.content.jsonlContent} />
      </div>
    );
  }

  // Check if we're dealing with trajectory data
  if (artifactContent?.content?.fileType === 'trajectory' && artifactContent?.content?.trajectoryData) {
    console.log('Rendering Trajectory viewer with', artifactContent.content.trajectoryData.length, 'items');

    return (
      <div className="flex flex-col h-full">
        <TrajectoryList trajectory={artifactContent.content.trajectoryData} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden">
        {/* Run Details - full width */}
        <div className="flex-1 h-full overflow-hidden">
          <div className="h-full flex flex-col border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex-none px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Run Details</h3>
            </div>
            
            {/* Content */}
            <div className="flex-1 min-h-0 overflow-y-auto scrollbar scrollbar-w-1.5 scrollbar-thumb-gray-200/75 dark:scrollbar-thumb-gray-700/75 scrollbar-track-transparent hover:scrollbar-thumb-gray-300/75 dark:hover:scrollbar-thumb-gray-600/75 scrollbar-thumb-rounded">
              <div className="p-4">
                {/* Run Header */}
                <RunHeader run={run} artifactContent={artifactContent?.content} />
                
                {/* Artifact Details */}
                {artifactContent?.content && (artifactContent.content.metrics || (artifactContent.content && !artifactContent.content.issue)) && (
                  <>
                    <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>
                    <div>
                      <h4 className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">Artifact Data</h4>
                      <ArtifactDetails content={artifactContent?.content} />
                    </div>
                  </>
                )}

                {/* Show raw content if available */}
                {artifactContent?.content?.history && (
                  <>
                    <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>
                    <div>
                      <h4 className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
                        Trajectory Data ({artifactContent.content.history.length} entries)
                      </h4>
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 max-h-96 overflow-y-auto">
                        <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                          {JSON.stringify(artifactContent.content.history, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </>
                )}

                {/* Show JSONL history if available */}
                {artifactContent?.content?.jsonlHistory && (
                  <>
                    <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>
                    <div>
                      <h4 className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
                        JSONL History ({artifactContent.content.jsonlHistory.length} entries)
                      </h4>
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 max-h-96 overflow-y-auto">
                        <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                          {JSON.stringify(artifactContent.content.jsonlHistory, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </>
                )}

                {/* Show message if no content */}
                {!artifactContent?.content && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p>No artifact content available.</p>
                    <p className="text-sm mt-2">Select an artifact from the workflow run to view its details.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RunDetails;