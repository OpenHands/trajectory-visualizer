import { describe, it, expect } from 'vitest';
import { extractTarGz, isArchiveUrl } from '../archive-extractor';

describe('isArchiveUrl', () => {
  it('should return true for .tar.gz URLs', () => {
    expect(isArchiveUrl('https://example.com/results.tar.gz')).toBe(true);
    expect(isArchiveUrl('https://example.com/path/to/archive.TAR.GZ')).toBe(true);
  });

  it('should return true for .tgz URLs', () => {
    expect(isArchiveUrl('https://example.com/results.tgz')).toBe(true);
  });

  it('should return true for URLs containing results.tar.gz', () => {
    expect(isArchiveUrl('https://github.com/org/repo/results.tar.gz')).toBe(true);
    expect(isArchiveUrl('https://example.com/artifact-results.tar.gz?version=1')).toBe(true);
  });

  it('should return false for non-archive URLs', () => {
    expect(isArchiveUrl('https://example.com/data.json')).toBe(false);
    expect(isArchiveUrl('https://example.com/trajectory.jsonl')).toBe(false);
    expect(isArchiveUrl('https://example.com/file.zip')).toBe(false);
  });
});

describe('extractTarGz', () => {
  it('should handle extraction with invalid data gracefully', async () => {
    // Create an invalid ArrayBuffer that should fail to parse as an archive
    const invalidBuffer = new ArrayBuffer(10);
    const view = new Uint8Array(invalidBuffer);
    view.set([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09]);

    // This should throw since the data is not a valid archive
    await expect(extractTarGz(invalidBuffer)).rejects.toThrow();
  });
});
