import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import App from '../App';
import pako from 'pako';

// Helper to create a minimal tar.gz file containing output.jsonl
function createTarGz(jsonlContent: string): Uint8Array {
  const encoder = new TextEncoder();
  const data = encoder.encode(jsonlContent);
  
  // Create tar header for output.jsonl
  const tarHeader = new Uint8Array(512);
  
  // File name (100 bytes)
  const filename = 'output.jsonl';
  for (let i = 0; i < filename.length; i++) {
    tarHeader[i] = filename.charCodeAt(i);
  }
  
  // File mode (8 bytes at offset 100)
  const mode = '0000644';
  for (let i = 0; i < mode.length; i++) {
    tarHeader[100 + i] = mode.charCodeAt(i);
  }
  
  // uid/gid (16 bytes at offset 108/116 - zeros)
  
  // Size in octal (12 bytes at offset 124)
  const sizeStr = data.length.toString(8).padStart(11, '0');
  for (let i = 0; i < sizeStr.length; i++) {
    tarHeader[124 + i] = sizeStr.charCodeAt(i);
  }
  
  // mtime (12 bytes at offset 136)
  const mtime = Math.floor(Date.now() / 1000).toString(8).padStart(11, '0');
  for (let i = 0; i < mtime.length; i++) {
    tarHeader[136 + i] = mtime.charCodeAt(i);
  }
  
  // Checksum placeholder - calculate after setting all other header fields
  // (8 bytes at offset 148) - fill with spaces first
  for (let i = 0; i < 8; i++) {
    tarHeader[148 + i] = 0x20;
  }
  
  // Type flag (1 byte at offset 156) - '0' for regular file
  tarHeader[156] = '0'.charCodeAt(0);
  
  // Calculate checksum
  let checksum = 0;
  for (let i = 0; i < 512; i++) {
    checksum += tarHeader[i];
  }
  const checksumStr = checksum.toString(8).padStart(6, '0');
  for (let i = 0; i < checksumStr.length; i++) {
    tarHeader[148 + i] = checksumStr.charCodeAt(i);
  }
  tarHeader[154] = 0; // null terminator
  tarHeader[155] = 0x20; // space
  
  // Calculate padded size (round up to 512 bytes)
  const paddedSize = Math.ceil(data.length / 512) * 512;
  const fileData = new Uint8Array(paddedSize);
  fileData.set(data);
  
  // Create tar file with header + data + end-of-archive (1024 zeros)
  const tar = new Uint8Array(512 + paddedSize + 1024);
  tar.set(tarHeader);
  tar.set(fileData, 512);
  
  // Compress with gzip
  return pako.gzip(tar);
}

describe('inUrl Parameter', () => {
  const originalFetch = global.fetch;

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
      getItem: vi.fn(),
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
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('should fetch and load tar.gz from inUrl parameter', async () => {
    // Create mock JSONL content
    const jsonlContent = JSON.stringify({ instance_id: 'test-1', resolved: true }) + '\n' +
                         JSON.stringify({ instance_id: 'test-2', resolved: false });
    
    // Create tar.gz data
    const tarGzData = createTarGz(jsonlContent);
    
    // Mock fetch to return the tar.gz
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      headers: new Map([['content-length', '1000']]),
      arrayBuffer: () => Promise.resolve(tarGzData.buffer)
    });
    global.fetch = fetchMock as typeof fetch;

    // Render with inUrl parameter - must use allowed domain and suffix
    const testUrl = 'https://results.eval.all-hands.dev/test/results.tar.gz';
    render(
      <MemoryRouter initialEntries={[`/?inUrl=${encodeURIComponent(testUrl)}`]}>
        <App router={false} />
      </MemoryRouter>
    );

    // Wait for fetch to be called with correct URL and options
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        testUrl,
        expect.objectContaining({
          mode: 'cors',
          headers: expect.objectContaining({
            'Accept': 'application/gzip, application/x-tar, */*'
          })
        })
      );
    });

    // Verify fetch was called exactly once (for the tar.gz)
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('should reject URLs not from allowed domain', async () => {
    // Mock alert
    const alertMock = vi.fn();
    window.alert = alertMock;
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock fetch (should not be called)
    const fetchMock = vi.fn();
    global.fetch = fetchMock as typeof fetch;

    // Render with inUrl parameter from non-allowed domain
    const testUrl = 'https://evil.example.com/malicious/results.tar.gz';
    render(
      <MemoryRouter initialEntries={[`/?inUrl=${encodeURIComponent(testUrl)}`]}>
        <App router={false} />
      </MemoryRouter>
    );

    // Wait for validation error
    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith(
        expect.stringContaining('Invalid URL format')
      );
    });

    // Fetch should NOT be called for invalid URLs
    expect(fetchMock).not.toHaveBeenCalled();
    
    consoleErrorSpy.mockRestore();
  });

  it('should reject URLs without required suffix', async () => {
    // Mock alert
    const alertMock = vi.fn();
    window.alert = alertMock;
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock fetch (should not be called)
    const fetchMock = vi.fn();
    global.fetch = fetchMock as typeof fetch;

    // Render with inUrl parameter without results.tar.gz suffix
    const testUrl = 'https://results.eval.all-hands.dev/test/other-file.json';
    render(
      <MemoryRouter initialEntries={[`/?inUrl=${encodeURIComponent(testUrl)}`]}>
        <App router={false} />
      </MemoryRouter>
    );

    // Wait for validation error
    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith(
        expect.stringContaining('Invalid URL format')
      );
    });

    // Fetch should NOT be called for invalid URLs
    expect(fetchMock).not.toHaveBeenCalled();
    
    consoleErrorSpy.mockRestore();
  });

  it('should handle fetch errors gracefully', async () => {
    // Mock console.error and alert
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const alertMock = vi.fn();
    window.alert = alertMock;

    // Mock fetch to fail
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      headers: new Map()
    });
    global.fetch = fetchMock as typeof fetch;

    // Render with inUrl parameter - must use allowed domain and suffix
    const testUrl = 'https://results.eval.all-hands.dev/nonexistent/results.tar.gz';
    render(
      <MemoryRouter initialEntries={[`/?inUrl=${encodeURIComponent(testUrl)}`]}>
        <App router={false} />
      </MemoryRouter>
    );

    // Wait for error to be shown
    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load tar.gz from URL')
      );
    }, { timeout: 5000 });

    consoleErrorSpy.mockRestore();
  });
});
