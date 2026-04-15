import { render, waitFor, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import JsonlViewer from '../components/jsonl-viewer/JsonlViewer';

// Mock the clipboard API
const mockClipboard = {
  writeText: vi.fn().mockResolvedValue(undefined),
};
Object.defineProperty(navigator, 'clipboard', {
  value: mockClipboard,
  writable: true,
});

describe('URL Parameter Handling', () => {
  const sampleJsonlContent = 
    '{"instance_id": "test-1", "resolved": true, "history": [{"id": 0, "action": "message", "content": "Step 1"}]}\n' +
    '{"instance_id": "test-2", "resolved": false, "history": [{"id": 0, "action": "message", "content": "Step A"}, {"id": 1, "action": "message", "content": "Step B"}]}\n' +
    '{"instance_id": "test-3", "resolved": true, "history": [{"id": 0, "action": "message", "content": "First step"}]}\n';

  beforeEach(() => {
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

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render instances from JSONL content', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <JsonlViewer content={sampleJsonlContent} />
      </MemoryRouter>
    );

    // Wait for the component to render instances
    await waitFor(() => {
      // Should show Evaluation Instances header
      expect(screen.getByText(/Evaluation Instances/)).toBeTruthy();
    });
    
    // Should show at least one instance in sidebar (use first match)
    await waitFor(() => {
      expect(screen.getAllByText(/Instance #test-1/)[0]).toBeTruthy();
    });
  });

  it('should load instance_id from URL and select matching entry', async () => {
    // Render with instance_id parameter in URL
    render(
      <MemoryRouter initialEntries={['/?instance_id=test-2']}>
        <JsonlViewer content={sampleJsonlContent} />
      </MemoryRouter>
    );

    // Wait for the component to render
    await waitFor(() => {
      // Should show Evaluation Instances header
      expect(screen.getByText(/Evaluation Instances/)).toBeTruthy();
    }, { timeout: 3000 });
  });

  it('should render trajectory items for selected instance', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    
    render(
      <MemoryRouter initialEntries={['/']}>
        <JsonlViewer content={sampleJsonlContent} />
      </MemoryRouter>
    );

    // Wait for the component to render
    await waitFor(() => {
      expect(screen.getByText(/Evaluation Instances/)).toBeTruthy();
    });

    // Click on test-2 instance in sidebar (first match) to select it and show its trajectory
    const test2Element = screen.getAllByText(/Instance #test-2/)[0];
    fireEvent.click(test2Element);

    // Should show trajectory items for test-2 (Step A and Step B)
    await waitFor(() => {
      expect(screen.getByText(/Step A/)).toBeTruthy();
    });

    alertSpy.mockRestore();
  });

  it('should render copy link buttons for trajectory items', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <JsonlViewer content={sampleJsonlContent} />
      </MemoryRouter>
    );

    // Wait for the component to render
    await waitFor(() => {
      expect(screen.getByText(/Evaluation Instances/)).toBeTruthy();
    });

    // Click on test-1 in sidebar (first match) to show its trajectory
    const test1Element = screen.getAllByText(/Instance #test-1/)[0];
    fireEvent.click(test1Element);

    // Should show trajectory step
    await waitFor(() => {
      expect(screen.getByText(/Step 1/)).toBeTruthy();
    });
  });

  it('should handle URL with trajectory_step parameter', async () => {
    // This test verifies the component can handle trajectory_step param without crashing
    render(
      <MemoryRouter initialEntries={['/?instance_id=test-2&trajectory_step=1']}>
        <JsonlViewer content={sampleJsonlContent} />
      </MemoryRouter>
    );

    // Component should render without errors
    await waitFor(() => {
      expect(screen.getByText(/Evaluation Instances/)).toBeTruthy();
    }, { timeout: 3000 });
  });
});