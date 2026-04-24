// Types for uploaded content

export interface JsonlUploadContent {
  jsonlContent: string;
  fileType: 'jsonl';
}

export interface TrajectoryUploadContent {
  trajectoryData: any; // This could be more specific based on your trajectory format
  fileType: 'trajectory';
  trajectory?: any; // For backward compatibility
}

export interface FullArchiveUploadContent {
  jsonlFiles?: Record<string, string>;
  selectedJsonlFile?: string;
  jsonlContent?: string;
  reportContent?: any;
  fileType: 'full_archive';
}

export type UploadContent = {
  content: JsonlUploadContent | TrajectoryUploadContent | FullArchiveUploadContent;
};