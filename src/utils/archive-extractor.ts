import JSZip from 'jszip';

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
    // Use JSZip to load the tar.gz file
    const zip = await JSZip.loadAsync(arrayBuffer);
    
    // Get list of all files
    result.fileNames = Object.keys(zip.files);
    console.log('Files in archive:', result.fileNames);

    // Look for output.jsonl or similar jsonl files
    for (const [fileName, zipEntry] of Object.entries(zip.files)) {
      if (zipEntry.dir) continue; // Skip directories
      
      const lowerFileName = fileName.toLowerCase();
      
      // Check for output.jsonl
      if (lowerFileName.endsWith('output.jsonl') || lowerFileName === 'output.jsonl') {
        const content = await zipEntry.async('string');
        result.outputJsonl = content;
        result.jsonlContent = content;
        console.log(`Found output.jsonl in archive (${fileName}), size: ${content.length}`);
      }
      
      // Check for output.report.json
      if (
        lowerFileName.endsWith('output.report.json') ||
        lowerFileName === 'output.report.json'
      ) {
        const content = await zipEntry.async('string');
        try {
          result.reportContent = JSON.parse(content);
          console.log(`Found report in archive (${fileName})`);
        } catch (e) {
          console.warn(`Failed to parse report JSON from ${fileName}:`, e);
        }
      }
    }

    // If we found jsonl content, we're done
    if (result.jsonlContent) {
      return result;
    }

    // Fallback: Look for any .jsonl file in the archive
    for (const [fileName, zipEntry] of Object.entries(zip.files)) {
      if (zipEntry.dir) continue;
      const lowerFileName = fileName.toLowerCase();
      if (lowerFileName.endsWith('.jsonl')) {
        const content = await zipEntry.async('string');
        result.jsonlContent = content;
        console.log(`Found .jsonl file in archive (${fileName}), size: ${content.length}`);
        break;
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
