import pako from 'pako';
import tar from 'tar-stream';

export interface ExtractedArchive {
  jsonlContent: string | null;
  outputJsonl: string | null;
  reportContent: any | null;
  fileNames: string[];
}

/**
 * Extracts and parses a tar.gz archive
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
    
    // Use tar-stream to parse tar format
    const extract = tar.extract();
    const entries: { name: string; content: string }[] = [];
    
    // Collect entries from tar stream
    await new Promise<void>((resolve, reject) => {
      extract.on('entry', (header, stream, next) => {
        result.fileNames.push(header.name);
        
        // Only process regular files
        if (header.type === 'file') {
          const chunks: Uint8Array[] = [];
          stream.on('data', (chunk: Uint8Array) => chunks.push(chunk));
          stream.on('end', () => {
            const content = Buffer.concat(chunks).toString('utf8');
            entries.push({ name: header.name, content });
            next();
          });
        } else {
          stream.resume();
          stream.on('end', next);
        }
      });
      
      extract.on('finish', resolve);
      extract.on('error', reject);
      
      // Write decompressed data to the stream
      extract.end(Buffer.from(decompressedData));
    });
    
    // Process entries to find output.jsonl and output.report.json
    for (const entry of entries) {
      const lowerName = entry.name.toLowerCase();
      
      // Check for output.jsonl
      if (lowerName.endsWith('output.jsonl') || lowerName === 'output.jsonl') {
        result.outputJsonl = entry.content;
        result.jsonlContent = entry.content;
        console.log(`Found output.jsonl in archive (${entry.name}), size: ${entry.content.length}`);
      }
      
      // Check for output.report.json
      if (lowerName.endsWith('output.report.json') || lowerName === 'output.report.json') {
        try {
          result.reportContent = JSON.parse(entry.content);
          console.log(`Found report in archive (${entry.name})`);
        } catch (e) {
          console.warn(`Failed to parse report JSON from ${entry.name}:`, e);
        }
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
