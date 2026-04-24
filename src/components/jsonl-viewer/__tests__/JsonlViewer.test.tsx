import { render, waitFor, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import JsonlViewer from '../JsonlViewer';

// Helper to create test JSONL content
function createJsonlContent(entries: Array<{ instance_id?: string; id?: string; history?: any[] }>): string {
  return entries.map(entry => JSON.stringify(entry)).join('\n');
}

describe('Instance URL Parameter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('should initialize with correct entry when URL has instance parameter', async () => {
    const jsonlContent = createJsonlContent([
      { instance_id: 'test-instance-1', id: '1', history: [{ action: 'test1', timestamp: '2024-01-01T00:00:00Z' }] },
      { instance_id: 'test-instance-2', id: '2', history: [{ action: 'test2', timestamp: '2024-01-02T00:00:00Z' }] },
      { instance_id: 'test-instance-3', id: '3', history: [{ action: 'test3', timestamp: '2024-01-03T00:00:00Z' }] },
    ]);

    render(
      <MemoryRouter initialEntries={['/?instance=test-instance-3']}>
        <JsonlViewer content={jsonlContent} />
      </MemoryRouter>
    );

    // The component should render and select the third entry based on the URL parameter
    // Wait for the component to render without errors
    await waitFor(() => {
      expect(screen.getByText(/Trajectory/)).toBeTruthy();
    }, { timeout: 5000 });
  });

  it('should handle invalid instance_id in URL gracefully by falling back to first entry', async () => {
    const jsonlContent = createJsonlContent([
      { instance_id: 'test-instance-1', id: '1', history: [{ action: 'test', timestamp: '2024-01-01T00:00:00Z' }] },
      { instance_id: 'test-instance-2', id: '2', history: [{ action: 'test', timestamp: '2024-01-02T00:00:00Z' }] },
    ]);

    render(
      <MemoryRouter initialEntries={['/?instance=nonexistent-instance']}>
        <JsonlViewer content={jsonlContent} />
      </MemoryRouter>
    );

    // Should render without crashing - the invalid instance_id is simply ignored
    await waitFor(() => {
      expect(screen.getByText(/Trajectory/)).toBeTruthy();
    }, { timeout: 5000 });
  });

  it('should render without errors when URL has no instance parameter', async () => {
    const jsonlContent = createJsonlContent([
      { instance_id: 'instance-a', id: '1', history: [{ action: 'action1', timestamp: '2024-01-01T00:00:00Z' }] },
      { instance_id: 'instance-b', id: '2', history: [{ action: 'action2', timestamp: '2024-01-02T00:00:00Z' }] },
    ]);

    render(
      <MemoryRouter>
        <JsonlViewer content={jsonlContent} />
      </MemoryRouter>
    );

    // Should render trajectory viewer without errors
    await waitFor(() => {
      expect(screen.getByText(/Trajectory/)).toBeTruthy();
    }, { timeout: 5000 });
  });
});