import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import App from '../App';

// Mock pako for creating test tar.gz files
vi.mock('pako', async () => {
  const actual = await vi.importActual('pako');
  return actual;
});

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(''),
  },
});

describe('instance_id and trajectory_step URL Parameters', () => {
  let consoleLogSpy: any;
  
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

    // Mock localStorage
    const mockLocalStorage = {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
    
    // Spy on console.log to verify parameters are being parsed
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should parse instance_id from URL parameters', async () => {
    // Render with instance_id parameter
    render(
      <MemoryRouter initialEntries={['/?instance_id=test-instance-123']}>
        <App router={false} />
      </MemoryRouter>
    );

    // Wait for the component to process the URL
    await waitFor(() => {
      // Verify the debug console.log is NOT called (parameters should be handled silently via state)
      expect(consoleLogSpy).not.toHaveBeenCalledWith('Found instance_id parameter:', 'test-instance-123');
    });
  });

  it('should parse trajectory_step from URL parameters', async () => {
    // Render with trajectory_step parameter
    render(
      <MemoryRouter initialEntries={['/?trajectory_step=5']}>
        <App router={false} />
      </MemoryRouter>
    );

    // Wait for the component to process the URL
    await waitFor(() => {
      // Verify the debug console.log is NOT called
      expect(consoleLogSpy).not.toHaveBeenCalledWith('Found trajectory_step parameter:', '5');
    });
  });

  it('should parse both instance_id and trajectory_step from URL parameters', async () => {
    // Render with both parameters
    render(
      <MemoryRouter initialEntries={['/?instance_id=test-456&trajectory_step=10']}>
        <App router={false} />
      </MemoryRouter>
    );

    // Wait for the component to process the URL
    await waitFor(() => {
      // Verify the debug console.logs are NOT called
      expect(consoleLogSpy).not.toHaveBeenCalledWith('Found instance_id parameter:', 'test-456');
      expect(consoleLogSpy).not.toHaveBeenCalledWith('Found trajectory_step parameter:', '10');
    });
  });
});