// Configuration for the JSONL viewer

export interface SortField {
  value: string;
  label: string;
}

// Common sort fields with descriptions
export const COMMON_SORT_FIELDS: SortField[] = [
  { value: 'instance_id', label: 'Instance ID' },
  { value: 'metrics.accumulated_cost', label: 'Cost (metrics.accumulated_cost)' },
  { value: 'report.resolved', label: 'Resolved Status (report.resolved)' },
  { value: 'len(history)', label: 'History Length (len(history))' },
  { value: 'duration', label: 'Duration' }
];

// Common display fields
export const COMMON_DISPLAY_FIELDS: string[] = [
  'metrics.accumulated_cost',
  'report.resolved',
  'len(history)',
  'duration'
];

// Default settings
export const DEFAULT_JSONL_VIEWER_SETTINGS = {
  sortField: 'instance_id',
  sortDirection: 'asc' as const,
  displayFields: [...COMMON_DISPLAY_FIELDS],
  selectedJsonlFile: undefined as string | undefined
};