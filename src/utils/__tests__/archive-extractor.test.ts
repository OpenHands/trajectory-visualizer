import { describe, it, expect } from 'vitest';
import pako from 'pako';
import { extractTarGz, isArchiveUrl } from '../archive-extractor';

/**
 * Creates a valid tar.gz archive with the given files (browser-compatible)
 */
function createTarGz(files: { name: string; content: string }[]): ArrayBuffer {
  const blockSize = 512;
  const chunks: Uint8Array[] = [];
  
  for (const file of files) {
    // Create tar header block (512 bytes)
    const header = new Uint8Array(blockSize);
    const encoder = new TextEncoder();
    
    // File name (100 bytes)
    const nameBytes = encoder.encode(file.name);
    header.set(nameBytes.slice(0, 100), 0);
    
    // File mode (8 bytes, octal)
    const modeStr = '0000644';
    header.set(encoder.encode(modeStr), 100);
    
    // Owner ID (8 bytes, octal)
    const ownerStr = '0000000';
    header.set(encoder.encode(ownerStr), 108);
    
    // Group ID (8 bytes, octal)
    const groupStr = '0000000';
    header.set(encoder.encode(groupStr), 116);
    
    // File size (12 bytes, octal)
    const sizeStr = file.content.length.toString(8).padStart(11, '0') + ' ';
    header.set(encoder.encode(sizeStr), 124);
    
    // Modification time (12 bytes, octal)
    const mtimeStr = '00000000000 ';
    header.set(encoder.encode(mtimeStr), 136);
    
    // Checksum (8 bytes, spaces)
    header.set(encoder.encode('        '), 148);
    
    // Type flag (1 byte) - regular file
    header[156] = 0x30; // '0'
    
    // Calculate and set checksum
    let sum = 0;
    for (let i = 0; i < 148; i++) sum += header[i];
    for (let i = 156; i < 512; i++) sum += header[i];
    const checksumStr = sum.toString(8).padStart(6, '0') + '\0 ';
    header.set(encoder.encode(checksumStr), 148);
    
    chunks.push(header);
    
    // File content (padded to 512 bytes)
    const contentBytes = encoder.encode(file.content);
    chunks.push(contentBytes);
    
    // Pad content to 512 bytes
    const padding = (blockSize - (contentBytes.length % blockSize)) % blockSize;
    if (padding > 0) {
      chunks.push(new Uint8Array(padding));
    }
  }
  
  // End of archive (two null blocks)
  chunks.push(new Uint8Array(blockSize));
  chunks.push(new Uint8Array(blockSize));
  
  // Concatenate all chunks
  const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
  const tarData = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    tarData.set(chunk, offset);
    offset += chunk.length;
  }
  
  // Compress with gzip using pako
  const compressed = pako.gzip(tarData);
  return compressed.buffer;
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
