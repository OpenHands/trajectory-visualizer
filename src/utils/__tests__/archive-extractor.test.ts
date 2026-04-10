import { describe, it, expect } from 'vitest';
import pako from 'pako';
import pack from 'tar-stream';
import { extractTarGz, isArchiveUrl } from '../archive-extractor';

/**
 * Creates a valid tar.gz archive with the given files
 */
async function createTarGz(files: { name: string; content: string }[]): Promise<ArrayBuffer> {
  const tarPack = pack.pack();
  
  // Add each file to the tar archive
  for (const file of files) {
    tarPack.entry({ name: file.name, size: file.content.length }, file.content);
  }
  
  // Finalize the tar archive
  tarPack.finalize();
  
  // Collect all tar data
  const tarChunks: Uint8Array[] = [];
  return new Promise((resolve) => {
    tarPack.on('data', (chunk: Uint8Array) => tarChunks.push(chunk));
    tarPack.on('end', () => {
      const tarData = Buffer.concat(tarChunks);
      // Compress with gzip using pako
      const compressed = pako.gzip(tarData);
      resolve(compressed.buffer);
    });
  });
}

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

  it('should extract output.jsonl from a valid tar.gz archive', async () => {
    const jsonlContent = '{"type":"test","id":1}\n{"type":"test2","id":2}';
    
    const archiveBuffer = await createTarGz([
      { name: 'output.jsonl', content: jsonlContent },
      { name: 'output.report.json', content: '{"status":"success"}' }
    ]);
    
    const result = await extractTarGz(archiveBuffer);
    
    expect(result.jsonlContent).toBe(jsonlContent);
    expect(result.outputJsonl).toBe(jsonlContent);
    expect(result.reportContent).toEqual({ status: 'success' });
    expect(result.fileNames).toContain('output.jsonl');
    expect(result.fileNames).toContain('output.report.json');
  });

  it('should handle archives without report.json', async () => {
    const jsonlContent = '{"test":"data"}';
    
    const archiveBuffer = await createTarGz([
      { name: 'output.jsonl', content: jsonlContent }
    ]);
    
    const result = await extractTarGz(archiveBuffer);
    
    expect(result.jsonlContent).toBe(jsonlContent);
    expect(result.reportContent).toBeNull();
    expect(result.fileNames).toContain('output.jsonl');
  });

  it('should handle archives with paths in filenames', async () => {
    const jsonlContent = '{"test":"data"}';
    
    const archiveBuffer = await createTarGz([
      { name: 'artifacts/output.jsonl', content: jsonlContent }
    ]);
    
    const result = await extractTarGz(archiveBuffer);
    
    expect(result.jsonlContent).toBe(jsonlContent);
    expect(result.fileNames).toContain('artifacts/output.jsonl');
  });
});
