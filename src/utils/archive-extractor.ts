import pako from 'pako';

export interface ExtractedArchive {
  jsonlContent: string | null;
  outputJsonl: string | null;
  reportContent: any | null;
  fileNames: string[];
}

interface TarHeader {
  name: string;
  size: number;
  type: number;
}

/**
 * Parses a tar archive header (512 bytes)
 */
function parseTarHeader(data: Uint8Array, offset: number): TarHeader | null {
  // Check for null block (end of archive)
  let isNull = true;
  for (let i = 0; i < 512; i++) {
    if (data[offset + i] !== 0) {
      isNull = false;
      break;
    }
  }
  if (isNull) return null;

  // Parse the header fields
  const getString = (start: number, length: number): string => {
    let end = start + length;
    // Find null terminator or space
    for (let i = start; i < start + length; i++) {
      if (data[i] === 0 || data[i] === 0x20) {
        end = i;
        break;
      }
    }
    const bytes = data.slice(start, end);
    return new TextDecoder('utf8').decode(bytes);
  };

  const name = getString(offset, 100).trim();
  const sizeStr = getString(offset + 124, 12);
  const size = parseInt(sizeStr, 8);
  const typeChar = getString(offset + 156, 1);

  // Type: 0 = regular file, 5 = directory
  const type = typeChar === '5' ? 5 : 0;

  return { name, size, type };
}

/**
 * Extracts and parses a tar.gz archive using browser-compatible code
 * The archive is expected to contain output.jsonl and/or output.report.json
 * @param arrayBuffer The archive file as an ArrayBuffer
 * @returns ExtractedArchive with the contents of the archive
 */
export async function extractTarGz(
  arrayBuffer: ArrayBuffer
): Promise<ExtractedArchive> {
  const result: ExtractedArchive = {
    jsonlContent: null,
    outputJsonl: null,
    reportContent: null,
    fileNames: [],
  };

  try {
    // Decompress gzip using pako
    const decompressedData = pako.inflate(new Uint8Array(arrayBuffer));
    
    // Parse tar entries manually (browser-compatible)
    let offset = 0;
    const blockSize = 512;
    
    while (offset + blockSize <= decompressedData.length) {
      const header = parseTarHeader(decompressedData, offset);
      
      if (header === null) {
        // End of archive (two null blocks)
        break;
      }
      
      result.fileNames.push(header.name);
      
      // Move past the header
      offset += blockSize;
      
      // Read file content for regular files
      if (header.type === 0 && header.size > 0 && header.name) {
        const fileData = decompressedData.slice(offset, offset + header.size);
        const content = new TextDecoder('utf8').decode(fileData);
        
        // Process entries to find output.jsonl and output.report.json
        const lowerName = header.name.toLowerCase();
        
        // Check for output.jsonl
        if (lowerName.endsWith('output.jsonl') || lowerName === 'output.jsonl') {
          result.outputJsonl = content;
          result.jsonlContent = content;
          console.log(`Found output.jsonl in archive (${header.name}), size: ${content.length}`);
        }
        
        // Check for output.report.json
        if (lowerName.endsWith('output.report.json') || lowerName === 'output.report.json') {
          try {
            result.reportContent = JSON.parse(content);
            console.log(`Found report in archive (${header.name})`);
          } catch (e) {
            console.warn(`Failed to parse report JSON from ${header.name}:`, e);
          }
        }
        
        // Move past the file data, rounded up to 512-byte boundary
        const paddedSize = Math.ceil(header.size / blockSize) * blockSize;
        offset += paddedSize;
      }
    }
    
    return result;
  } catch (error) {
    console.error('Failed to extract tar.gz archive:', error);
    throw new Error(`Failed to extract archive: ${error}`);
  }
}

/**
 * Determines if a URL points to a tar.gz archive
 * @param url The URL to check
 * @returns true if the URL appears to point to a tar.gz archive
 */
export function isArchiveUrl(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  return (
    lowerUrl.endsWith('.tar.gz') ||
    lowerUrl.endsWith('.tgz') ||
    lowerUrl.includes('results.tar.gz')
  );
}
