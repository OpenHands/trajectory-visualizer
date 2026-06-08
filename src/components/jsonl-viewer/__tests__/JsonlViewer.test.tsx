import { render, waitFor, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import JsonlViewer from '../JsonlViewer';

// Helper to create test JSONL content
function createJsonlContent(
  entries: Array<{ instance_id?: string; id?: string; history?: any[] }>
): string {
  return entries.map(entry => JSON.stringify(entry)).join('\n');
}

// Helper component that exposes the current location so tests can assert
// URL changes made by the component under test.
function LocationProbe({ onChange }: { onChange: (search: string) => void }) {
  const location = useLocation();
  onChange(location.search);
  return null;
}

function renderWithRouter(
  content: string,
  initialEntries: string[] = ['/'],
  onLocationChange: (search: string) => void = () => {}
) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <JsonlViewer content={content} />
      <LocationProbe onChange={onLocationChange} />
    </MemoryRouter>
  );
}

describe('JsonlViewer instance URL parameter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  const baseEntries = [
    { instance_id: 'test-instance-1', id: '1', history: [{ action: 'a1', timestamp: '2024-01-01T00:00:00Z' }] },
    { instance_id: 'test-instance-2', id: '2', history: [{ action: 'a2', timestamp: '2024-01-02T00:00:00Z' }] },
    { instance_id: 'test-instance-3', id: '3', history: [{ action: 'a3', timestamp: '2024-01-03T00:00:00Z' }] },
  ];

  it('selects the entry referenced by the URL on initial render', async () => {
    const jsonlContent = createJsonlContent(baseEntries);

    renderWithRouter(jsonlContent, ['/?instance=test-instance-2']);

    // The "currently selected" header in the trajectory pane should show the
    // matched instance, not the default first entry.
    await waitFor(() => {
      const headers = screen.getAllByText('Instance #test-instance-2');
      // One in the sidebar list, one in the trajectory header.
      expect(headers.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('falls back to the first entry when the URL references an unknown instance', async () => {
    const jsonlContent = createJsonlContent(baseEntries);

    renderWithRouter(jsonlContent, ['/?instance=nonexistent']);

    await waitFor(() => {
      // First entry is the default, so its name appears in the trajectory header.
      expect(screen.getAllByText('Instance #test-instance-1').length).toBeGreaterThanOrEqual(2);
    });
  });

  it('updates the URL with the instance_id when the user selects an entry', async () => {
    const jsonlContent = createJsonlContent(baseEntries);
    let lastSearch = '';

    renderWithRouter(jsonlContent, ['/'], (search) => { lastSearch = search; });

    // Wait for the sidebar to render all entries.
    await waitFor(() => {
      expect(screen.getAllByText('Instance #test-instance-3').length).toBeGreaterThanOrEqual(1);
    });

    // Click the third entry in the sidebar.
    const sidebarEntry = screen.getAllByText('Instance #test-instance-3')[0];
    fireEvent.click(sidebarEntry);

    await waitFor(() => {
      expect(lastSearch).toBe('?instance=test-instance-3');
    });
  });

  it('renders without errors when the URL has no instance parameter', async () => {
    const jsonlContent = createJsonlContent(baseEntries);

    renderWithRouter(jsonlContent);

    await waitFor(() => {
      expect(screen.getByText(/Trajectory/)).toBeTruthy();
    });
  });

  it('preserves unrelated query parameters when updating instance', async () => {
    const jsonlContent = createJsonlContent(baseEntries);
    let lastSearch = '';

    renderWithRouter(jsonlContent, ['/?foo=bar'], (search) => { lastSearch = search; });

    await waitFor(() => {
      expect(screen.getAllByText('Instance #test-instance-2').length).toBeGreaterThanOrEqual(1);
    });

    fireEvent.click(screen.getAllByText('Instance #test-instance-2')[0]);

    await waitFor(() => {
      expect(lastSearch).toContain('foo=bar');
      expect(lastSearch).toContain('instance=test-instance-2');
    });
  });
});
