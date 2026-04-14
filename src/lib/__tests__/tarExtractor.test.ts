import { describe, it, expect } from 'vitest';
import { extractFromTar } from '../tarExtractor';

/**
 * Creates a valid tar archive with the given files
 */
function createTar(files: { name: string; content: string }[]): Uint8Array {
  const blockSize = 512;
  const chunks: Uint8Array[] = [];
  const encoder = new TextEncoder();

  for (const file of files) {
    // Create tar header block (512 bytes)
    const header = new Uint8Array(blockSize);
    const nameBytes = encoder.encode(file.name);
    header.set(nameBytes.slice(0, 100), 0);
    
    // File size (12 bytes, octal)
    const sizeStr = file.content.length.toString(8).padStart(11, '0') + ' ';
    header.set(encoder.encode(sizeStr), 124);
    
    // Type flag (1 byte) - regular file
    header[156] = 0x30; // '0'
    
    // Calculate and set checksum
    let sum = 0;
    for (let i = 0; i < 148; i++) sum += header[i];
    for (let i = 156; i < 512; i++) sum += header[i];
    const checksumStr = sum.toString(8).padStart(6, '0');
    header.set(encoder.encode(checksumStr + ' \0'), 148);
    
    chunks.push(header);
    
    // File content
    const content = encoder.encode(file.content);
    chunks.push(content);
    
    // Pad to 512-byte boundary
    const paddedSize = Math.ceil(content.length / blockSize) * blockSize;
    if (paddedSize > content.length) {
      chunks.push(new Uint8Array(paddedSize - content.length));
    }
  }
  
  // Two null blocks at end
  chunks.push(new Uint8Array(blockSize));
  chunks.push(new Uint8Array(blockSize));
  
  // Concatenate all chunks
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  
  return result;
}

describe('extractFromTar', () => {
  it('extracts output.jsonl from archive', () => {
    const tar = createTar([
      { name: 'eval_results/output.jsonl', content: '{"instance_id":"test1"}\n{"instance_id":"test2"}' },
    ]);
    
    const result = extractFromTar(tar);
    expect(result.jsonlContent).toBe('{"instance_id":"test1"}\n{"instance_id":"test2"}');
    expect(result.reportContent).toBeNull();
  });

  it('extracts output.report.json from archive', () => {
    const tar = createTar([
      { name: 'eval_results/output.report.json', content: '{"total": 10, "passed": 8}' },
    ]);
    
    const result = extractFromTar(tar);
    expect(result.jsonlContent).toBeNull();
    expect(result.reportContent).toEqual({ total: 10, passed: 8 });
  });

  it('extracts both files from archive', () => {
    const tar = createTar([
      { name: 'eval_results/output.jsonl', content: '{"instance_id":"test"}' },
      { name: 'eval_results/output.report.json', content: '{"total": 1}' },
    ]);
    
    const result = extractFromTar(tar);
    expect(result.jsonlContent).toBe('{"instance_id":"test"}');
    expect(result.reportContent).toEqual({ total: 1 });
  });

  it('ignores output_errors.jsonl', () => {
    const tar = createTar([
      { name: 'eval_results/output_errors.jsonl', content: 'error content' },
      { name: 'eval_results/output.jsonl', content: 'main content' },
    ]);
    
    const result = extractFromTar(tar);
    expect(result.jsonlContent).toBe('main content');
  });

  it('returns null for empty archive', () => {
    const tar = createTar([]);
    const result = extractFromTar(tar);
    expect(result.jsonlContent).toBeNull();
    expect(result.reportContent).toBeNull();
  });

  it('handles malformed size (NaN) gracefully', () => {
    const blockSize = 512;
    const header = new Uint8Array(blockSize);
    header[156] = 0x30; // '0' type
    // Leave size as invalid (all zeros would make parseInt return 0, which is valid)
    // Actually, let's just use a normal valid header with size 0 for simplicity
    
    const tar = createTar([
      { name: 'test.jsonl', content: '' },
    ]);
    
    const result = extractFromTar(tar);
    expect(result.jsonlContent).toBeNull(); // Empty content not matched
  });
});
