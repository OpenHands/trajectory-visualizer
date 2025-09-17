import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useParams, useNavigate, useLocation } from 'react-router-dom';
import RepositorySelector from './components/RepositorySelector';
import { WorkflowRunsList } from './components/workflow-runs';
import RunDetails from './components/RunDetails';
import RunDetailsSkeleton from './components/loading/RunDetailsSkeleton';
import { TrajectoryLoadingOverlay } from './components/loading/TrajectoryLoadingOverlay';
import { WorkflowRun } from './types';
import { UploadTrajectory } from './components/upload/UploadTrajectory';
import { EvaluationUpload } from './components/upload/EvaluationUpload';
import { UploadContent } from './types/upload';

const TokenPrompt: React.FC<{ isDark?: boolean }> = ({ isDark = false }) => {
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSaveToken = () => {
    if (!token.trim()) {
      setError('Please enter a GitHub token');
      return;
    }

    try {
      localStorage.setItem('github_token', token.trim());
      setSuccess(true);
      setError(null);
      // Reload the page after 1 second to trigger the token check
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      setError('Failed to save token. Please try again.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveToken();
    }
  };

  return (
    <div className="text-center w-full max-w-md mx-auto px-4">
      <div className="flex flex-col items-center mb-6">
        <svg 
          className={`w-16 h-16 ${isDark ? 'text-gray-600' : 'text-gray-300'}`}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5}
            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
          />
        </svg>
      </div>
      <h2 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
        Configure GitHub Token
      </h2>
      <p className={`${isDark ? 'text-gray-300' : 'text-gray-500'} mb-6 text-sm max-w-sm mx-auto`}>
        To access GitHub repositories and workflow details, configure your GitHub token with 'repo' scope. This is optional if you only want to visualize local trajectories.
      </p>
      
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow-sm border p-4 mb-6 w-full max-w-sm mx-auto`}>
        <div className="space-y-4">
          <div className="relative">
            <label htmlFor="github-token" className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              GitHub Personal Access Token
            </label>
            <div className="relative">
              <input
                id="github-token"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className={`block w-full rounded-md py-2 px-3 text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400'} focus:border-blue-500 focus:ring-1 focus:ring-blue-500`}
              />
              {token && (
                <button
                  type="button"
                  onClick={() => setToken('')}
                  className={`absolute inset-y-0 right-0 flex items-center pr-3 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-500'}`}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          <button
            onClick={handleSaveToken}
            disabled={success}
            className={`
              w-full rounded-md py-2 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${isDark ? 'focus:ring-offset-gray-800' : ''}
              ${success 
                ? 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-500' 
                : 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {success ? 'Token saved! Redirecting...' : 'Save Token'}
          </button>
          {error && (
            <div className={`${isDark ? 'bg-red-900/20 text-red-400 border-red-900/30' : 'bg-red-50 text-red-600 border-red-100'} text-sm rounded-md p-3 border flex items-start`}>
              <svg className="h-5 w-5 flex-shrink-0 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className={`${isDark ? 'bg-green-900/20 text-green-400 border-green-900/30' : 'bg-green-50 text-green-600 border-green-100'} text-sm rounded-md p-3 border flex items-start`}>
              <svg className="h-5 w-5 flex-shrink-0 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Token saved successfully!</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center gap-4">
        <a
          href="https://github.com/settings/tokens?type=beta"
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-2 text-sm ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-500 hover:text-blue-600'} font-medium transition-colors`}
        >
          <span>Generate new token on GitHub</span>
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
          </svg>
        </a>
        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} max-w-xs text-center mt-2`}>
          Make sure to create a token with <span className="font-medium">repo</span> and <span className="font-medium">workflow</span> scopes to enable all features of the application.
        </p>
      </div>
    </div>
  );
};

// RunDetails component with router parameters
const RunDetailsWithRouter: React.FC = () => {
  const { owner, repo, runId } = useParams();
  const navigate = useNavigate();
  const [run, setRun] = useState<WorkflowRun | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Fetch run details by ID
    const fetchRun = async () => {
      if (!owner || !repo || !runId) {
        setError('Missing required parameters');
        setLoading(false);
        return;
      }
      
      // Validate runId is numeric
      if (!/^\d+$/.test(runId)) {
        setError('Invalid run ID format');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Check for GitHub token
        const token = localStorage.getItem('github_token');
        if (!token) {
          setError('GitHub token not found. Please set your token first.');
          setLoading(false);
          return;
        }
        
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}`, {
          headers: {
            'Authorization': `token ${token}`
          }
        });
        
        if (!response.ok) {
          if (response.status === 404) {
            setError(`Run #${runId} not found`);
          } else if (response.status === 401) {
            setError('Authentication failed. Please check your GitHub token.');
          } else {
            setError(`Error fetching run: ${response.status} ${response.statusText}`);
          }
          setLoading(false);
          return;
        }
        
        const data = await response.json();
        setRun(data);
      } catch (err) {
        console.error('Error fetching run:', err);
        setError(`Failed to load run details: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRun();
  }, [owner, repo, runId]);

  // Show skeleton while waiting for run data or if there's an error loading the initial data
  if (loading) {
    return <RunDetailsSkeleton />;
  }
  
  if (error || !run) {
    return (
      <div className="p-6 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900/30">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-red-800 dark:text-red-400">Error</h3>
            <div className="mt-2 text-sm text-red-700 dark:text-red-300">
              {error || 'Run not found'}
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => navigate(`/${owner}/${repo}`)}
                className="inline-flex items-center rounded-md border border-transparent bg-red-100 dark:bg-red-900/40 px-3 py-2 text-sm font-medium text-red-800 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800/60 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Back to workflow runs
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <RunDetails owner={owner || ''} repo={repo || ''} run={run} />;
};

// Main App Component
const App: React.FC<{ router?: boolean }> = ({ router = true }) => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    // First check localStorage
    const storedPreference = localStorage.getItem('dark_mode');
    if (storedPreference !== null) {
      return storedPreference === 'true';
    }
    // Then check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    // Check system dark mode preference
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      // Only update if there's no stored preference
      if (localStorage.getItem('dark_mode') === null) {
        setIsDark(e.matches);
      }
    };
    darkModeMediaQuery.addEventListener('change', handleChange);

    return () => darkModeMediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    // Store preference in localStorage and apply dark mode class
    localStorage.setItem('dark_mode', isDark.toString());
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);


  
  // MainContent component with repository selection
  // Keep track of navigation state without triggering re-renders
  const navigationRef = useRef({
    navigating: false,
    initialNavigationDone: false,
    loadCount: 0
  });
  
  // Function to process trajectory data based on its format
  const processTrajectoryData = (data: any): UploadContent => {
    // Check if it's an array (OpenHands trajectory format)
    if (Array.isArray(data)) {
      // Check if it has OpenHands specific fields
      if (data.length > 0 &&
          (('action' in data[0] && 'source' in data[0]) ||
           ('observation' in data[0] && 'source' in data[0]))) {
        console.log('Detected OpenHands trajectory format - using trajectory viewer');

        // Return as trajectory data for the trajectory viewer
        return {
          content: {
            trajectoryData: data,
            fileType: 'trajectory'
          }
        };
      }

      // For other array formats
      return {
        content: {
          trajectoryData: data,
          fileType: 'trajectory'
        }
      };
    }
    
    // Check if it has entries array (sample-trajectory.json format)
    if (data.entries && Array.isArray(data.entries)) {
      console.log('Detected entries array format');
      
      // Return the data directly for the trajectory viewer
      return {
        content: {
          trajectoryData: data,
          fileType: 'trajectory'
        }
      };
    }
    
    // Check if it has history array (trajectory-visualizer format)
    if (data.history && Array.isArray(data.history)) {
      console.log('Detected history array format - using trajectory viewer');

      // Return the history array for the trajectory viewer
      return {
        content: {
          trajectoryData: data.history,
          fileType: 'trajectory'
        }
      };
    }
    
    // If it's not in a recognized format, return as is
    console.log('Unknown format, passing as trajectory data');
    return {
      content: {
        trajectoryData: data,
        fileType: 'trajectory'
      }
    };
  };

  const MainContent: React.FC = () => {
    const { owner, repo } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [uploadedContent, setUploadedContent] = useState<UploadContent | null>(null);
    const [isLoadingTrajectory, setIsLoadingTrajectory] = useState<boolean>(false);
    
    // Check for URL parameters and localStorage on initial load
    useEffect(() => {
      // Keep track of load count to prevent cycles
      navigationRef.current.loadCount++;
      
      // Safety check - if we've already tried to navigate multiple times, don't try again
      if (navigationRef.current.loadCount > 3) {
        console.warn('Too many navigation attempts, stopping to prevent loops');
        return;
      }
      
      // Only run initial navigation logic once
      if (!navigationRef.current.initialNavigationDone && !navigationRef.current.navigating) {
        console.log('Initial navigation check');
        navigationRef.current.initialNavigationDone = true;
        
        // Check for URL parameters
        const searchParams = new URLSearchParams(location.search);
        const dataParam = searchParams.get('data');
        const fileUrlParam = searchParams.get('fileUrl');
        
        // Process embedded data parameter
        if (dataParam) {
          try {
            // Decode and parse the data parameter
            const decodedData = atob(decodeURIComponent(dataParam));
            const parsedData = JSON.parse(decodedData);
            console.log('Found trajectory data in URL:', parsedData);
            
            // Set the uploaded content
            setUploadedContent(parsedData);
            
            // Clear the URL parameter to avoid reloading the same data
            navigate(location.pathname, { replace: true });
            return;
          } catch (error) {
            console.error('Failed to parse data parameter:', error);
          }
        }
        
        // Process fileUrl parameter - fetch trajectory from external URL
        if (fileUrlParam) {
          console.log('Found fileUrl parameter, fetching trajectory from:', fileUrlParam);
          
          // Show loading indicator
          setIsLoadingTrajectory(true);
          
          // Fetch the trajectory file from the provided URL
          fetch(fileUrlParam, {
            mode: 'cors', // Enable CORS
            headers: {
              'Accept': 'application/json'
            }
          })
            .then(response => {
              if (!response.ok) {
                throw new Error(`Failed to fetch trajectory: ${response.status} ${response.statusText}`);
              }
              return response.json();
            })
            .then(data => {
              console.log('Successfully fetched trajectory data from URL');
              
              // Process the trajectory data
              const processedData = processTrajectoryData(data);
              setUploadedContent(processedData);
            })
            .catch(error => {
              console.error('Error fetching trajectory from URL:', error);
              
              // If direct fetch fails, try using a CORS proxy as fallback
              console.log('Attempting to fetch via CORS proxy...');
              const proxyUrl = `https://cors-anywhere.herokuapp.com/${fileUrlParam}`;
              
              return fetch(proxyUrl, {
                headers: {
                  'Accept': 'application/json',
                  'X-Requested-With': 'XMLHttpRequest' // Required by some CORS proxies
                }
              })
                .then(response => {
                  if (!response.ok) {
                    throw new Error(`Proxy fetch failed: ${response.status} ${response.statusText}`);
                  }
                  return response.json();
                })
                .then(data => {
                  console.log('Successfully fetched trajectory data via proxy');
                  const processedData = processTrajectoryData(data);
                  setUploadedContent(processedData);
                })
                .catch(proxyError => {
                  console.error('Proxy fetch also failed:', proxyError);
                  alert(`Failed to load trajectory from URL: ${error.message}\nProxy attempt also failed: ${proxyError.message}`);
                  throw proxyError; // Re-throw to trigger the finally block
                });
            })
            .finally(() => {
              setIsLoadingTrajectory(false);
              // Clear the URL parameter to avoid reloading the same data
              navigate(location.pathname, { replace: true });
            });
          
          return;
        }
        
        // Only redirect if we're at the root path and have no owner/repo
        if ((!owner || !repo) && location.pathname === '/') {
          const savedRepo = localStorage.getItem('selected_repository');
          if (savedRepo && savedRepo.includes('/')) {
            console.log('Restoring saved repository:', savedRepo);
            navigationRef.current.navigating = true;
            // Use a timeout to avoid immediate navigation that might cause loops
            setTimeout(() => {
              navigate(`/${savedRepo}`);
              navigationRef.current.navigating = false;
            }, 50);
          }
        }
      }
    }, [owner, repo, navigate, location.pathname, location.search]);
    
    // Handle repository selection
    const handleRepositorySelect = (newOwner: string, newRepo: string) => {
      // First check if we're already on this repo to prevent unnecessary navigation
      if (owner === newOwner && repo === newRepo) {
        console.log('Already on this repository, skipping navigation');
        return;
      }
      
      localStorage.setItem('selected_repository', `${newOwner}/${newRepo}`);
      // Always navigate to the base repository route without any run ID
      // This prevents trying to find runs from previous repositories
      navigate(`/${newOwner}/${newRepo}`);
    };

    // Handle trajectory upload
    const handleTrajectoryUpload = (content: UploadContent) => {
      setIsLoadingTrajectory(false);
      setUploadedContent(content);
    };
    
    // Handle trajectory upload start
    const handleTrajectoryUploadStart = () => {
      setIsLoadingTrajectory(true);
    };
    
    return (
      <div className="h-screen max-h-screen flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
        {/* Show loading overlay when processing trajectory */}
        {isLoadingTrajectory && <TrajectoryLoadingOverlay />}
        
        {/* Header */}
        <header className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b`}>
          <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <img 
                  src="/logo.png" 
                  alt="OpenHands Resolver" 
                  className="h-8 w-auto"
                  onClick={() => navigate('/')}
                  style={{ cursor: 'pointer' }}
                />
                <h1 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Trajectory Visualizer
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsDark(!isDark)}
                  className={`p-2 rounded-full ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                  title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {isDark ? (
                    <svg className="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                    </svg>
                  )}
                </button>
                {localStorage.getItem('github_token') && (
                  <div className="flex items-center gap-4">
                    <RepositorySelector onSelectRepository={handleRepositorySelect} />
                    {uploadedContent && (
                      <button
                        onClick={() => setUploadedContent(null)}
                        className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        Back to Repository
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex-grow overflow-hidden">
          {!owner && !repo && !uploadedContent ? (
            <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
              <div className="max-w-3xl mx-auto space-y-8">
                <div>
                  <h2 className={`text-lg font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Upload OpenHands Trajectory
                  </h2>
                  <UploadTrajectory 
                    onUpload={handleTrajectoryUpload} 
                    onUploadStart={handleTrajectoryUploadStart} 
                  />
                </div>

                <div>
                  <EvaluationUpload onUpload={handleTrajectoryUpload} />
                </div>

                {!localStorage.getItem('github_token') ? (
                  <div>
                    <h2 className={`text-lg font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Configure GitHub Token (Optional)
                    </h2>
                    <TokenPrompt isDark={isDark} />
                  </div>
                ) : (
                  <div>
                    <h2 className={`text-lg font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Or Select GitHub Repository
                    </h2>
                    <RepositorySelector onSelectRepository={handleRepositorySelect} />
                  </div>
                )}
              </div>
            </div>
          ) : !localStorage.getItem('github_token') && owner && repo ? (
            <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
              <TokenPrompt isDark={isDark} />
            </div>
          ) : !owner && !repo && !uploadedContent ? (
            <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
              <div className="max-w-3xl mx-auto space-y-8">
                <div>
                  <h2 className={`text-lg font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Select GitHub Repository
                  </h2>
                  <RepositorySelector onSelectRepository={handleRepositorySelect} />
                </div>
                
                <div>
                  <h2 className={`text-lg font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Or Upload OpenHands Trajectory
                  </h2>
                  <UploadTrajectory 
                    onUpload={handleTrajectoryUpload} 
                    onUploadStart={handleTrajectoryUploadStart} 
                  />
                </div>
                
                <div>
                  <EvaluationUpload onUpload={handleTrajectoryUpload} />
                </div>
              </div>
            </div>
          ) : uploadedContent ? (
            <div className="h-[calc(100vh-8rem)] overflow-hidden">
              <RunDetails 
                owner="local" 
                repo="trajectory" 
                run={{
                  id: 0,
                  name: 'Local Trajectory',
                  head_branch: '',
                  head_sha: '',
                  run_number: 0,
                  event: 'local',
                  status: 'completed',
                  conclusion: 'success',
                  workflow_id: 0,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  html_url: '',
                  run_attempt: 1,
                  run_started_at: new Date().toISOString(),
                  jobs_url: '',
                  logs_url: '',
                  workflow_name: 'Local Trajectory'
                }}
                initialContent={uploadedContent}
              />
            </div>
          ) : owner && repo ? (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full">
              {/* Fixed Run List - no overflow */}
              <div className="lg:col-span-1 h-[calc(100vh-8rem)] overflow-hidden flex flex-col">
                <div className="flex-grow overflow-y-auto scrollbar scrollbar-w-1.5 scrollbar-thumb-gray-200/75 dark:scrollbar-thumb-gray-700/75 scrollbar-track-transparent">
                  <WorkflowRunsList
                    owner={owner}
                    repo={repo}
                    // Get current runId from URL path
                    selectedRun={(()=>{
                      const currentPathMatch = location.pathname.match(/\/run\/(\d+)$/);
                      const currentRunId = currentPathMatch ? parseInt(currentPathMatch[1], 10) : null;
                      // Only return an object with the id since that's all we need for highlighting
                      return currentRunId ? { id: currentRunId } as WorkflowRun : null;
                    })()}
                    onSelectRun={(run) => {
                      // Get current runId from URL path to prevent redundant navigation
                      const currentPathMatch = location.pathname.match(/\/run\/(\d+)$/);
                      const currentRunId = currentPathMatch ? parseInt(currentPathMatch[1], 10) : null;
                      
                      // Only navigate if we're selecting a different run
                      if (currentRunId !== run.id) {
                        console.log(`Navigating to run ${run.id}`);
                        navigate(`/${owner}/${repo}/run/${run.id}`);
                      } else {
                        console.log(`Already on run ${run.id}, skipping navigation`);
                      }
                    }}
                  />
                </div>
              </div>
              {/* Fixed Content Area - no overflow */}
              <div className="lg:col-span-3 h-[calc(100vh-8rem)] overflow-hidden">
                <Routes>
                  <Route path="run/:runId" element={<RunDetailsWithRouter />} />
                  <Route path="/" element={
                    <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow-sm border p-6 h-full flex items-center justify-center`}>
                      <div className="text-center">
                        <div className="mb-4">
                          <svg className={`mx-auto h-12 w-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-1`}>No Run Selected</h3>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          Select a workflow run from the list to view its details
                        </p>
                      </div>
                    </div>
                  } />
                </Routes>
              </div>
            </div>
          ) : (
            <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
              <div className="text-center max-w-md mx-auto px-4">
                <div className="flex justify-center mb-6">
                  <img 
                    src="/logo.png" 
                    alt="OpenHands Resolver" 
                    className="w-32 h-32 object-contain"
                  />
                </div>
                <h2 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                  Welcome to Trajectory Visualizer
                </h2>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} mb-6`}>
                  Get started by selecting a repository from the dropdown above to explore its workflow runs and execution details.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  };
  
  const content = (
    <Routes>
      <Route path="/:owner/:repo/*" element={<MainContent />} />
      {/* Specify index route to avoid double rendering */}
      <Route index element={<MainContent />} />
    </Routes>
  );

  return router ? <BrowserRouter>{content}</BrowserRouter> : content;
};

export default App; 