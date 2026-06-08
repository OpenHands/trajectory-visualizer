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
  /** All JSONL files extracted from the archive, keyed by file name. */
  jsonlFiles: Record<string, string>;
  /** Currently selected file (key into `jsonlFiles`). */
  selectedJsonlFile?: string;
  /**
   * Content of the currently selected JSONL file.
   * Kept for backward compatibility with consumers that don't yet use
   * `jsonlFiles` / `selectedJsonlFile`.
   */
  jsonlContent?: string;
  reportContent?: any;
  fileType: 'full_archive';
}

export type UploadContent = {
  content: JsonlUploadContent | TrajectoryUploadContent | FullArchiveUploadContent;
};