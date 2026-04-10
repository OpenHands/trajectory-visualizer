import type { VercelRequest, VercelResponse } from '@vercel/node';
import pako from 'pako';

interface TarHeader {
  name: string;
  size: number;
  type: number;
}

function parseTarHeader(data: Uint8Array, offset: number): TarHeader | null {
  let isNull = true;
  for (let i = 0; i < 512; i++) {
    if (data[offset + i] !== 0) {
      isNull = false;
      break;
    }
  }
  if (isNull) return null;

  const getString = (start: number, length: number): string => {
    let end = start + length;
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
  const type = typeChar === '5' ? 5 : 0;

  return { name, size, type };
}

function parseTar(data: Uint8Array): { files: { name: string; content: string }[] } {
  const files: { name: string; content: string }[] = [];
  let offset = 0;
  const blockSize = 512;
  let pendingLongName: string | null = null;

  while (offset + blockSize <= data.length) {
    const header = parseTarHeader(data, offset);

    if (header === null) break;

    offset += blockSize;

    if (header.type === 0 && header.size > 0 && header.name) {
      const fileData = data.slice(offset, offset + header.size);
      const paddedSize = Math.ceil(header.size / blockSize) * blockSize;
      offset += paddedSize;

      // Handle GNU tar long link extension
      if (header.name.endsWith('@LongLink') || header.name === '././@LongLink') {
        pendingLongName = new TextDecoder('utf8').decode(fileData).replace(/\0+$/, '');
        continue;
      }

      // Use pending long name if available
      const fileName = pendingLongName || header.name;
      pendingLongName = null;

      const content = new TextDecoder('utf8').decode(fileData);
      files.push({ name: fileName, content });
    }
  }

  return { files };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  // Validate URL is a tar.gz
  const lowerUrl = url.toLowerCase();
  if (!lowerUrl.endsWith('.tar.gz') && !lowerUrl.endsWith('.tgz') && !lowerUrl.includes('results.tar.gz')) {
    return res.status(400).json({ error: 'URL must point to a .tar.gz file' });
  }

  try {
    console.log('Fetching archive from:', url);

    // Set timeout for fetch
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 300000); // 5 min timeout

    // Fetch the archive
    const response = await fetch(url, {
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }

    // Get content length for logging
    const contentLength = response.headers.get('content-length');
    console.log('Downloading archive, size:', contentLength);

    // Read as array buffer
    const arrayBuffer = await response.arrayBuffer();
    const gzippedData = new Uint8Array(arrayBuffer);
    
    console.log('Decompressing gzip...');
    
    // Use pako for decompression
    let decompressed: Uint8Array;
    try {
      const result = pako.ungzip(gzippedData);
      decompressed = result instanceof Uint8Array ? result : new Uint8Array(result);
    } catch (e) {
      // Try as raw deflate if ungzip fails
      const result = pako.inflate(gzippedData);
      decompressed = result instanceof Uint8Array ? result : new Uint8Array(result);
    }

    console.log('Decompressed, size:', decompressed.length);

    // Parse tar
    const { files } = parseTar(decompressed);

    console.log('Parsed tar, found', files.length, 'files');

    // Find output.jsonl and output.report.json
    let jsonlContent: string | null = null;
    let reportContent: any | null = null;

    console.log('Searching through', files.length, 'files...');

    for (const file of files) {
      const lowerName = file.name.toLowerCase();

      // Look for jsonl content anywhere in filename
      if (lowerName.includes('output.jsonl') || lowerName.endsWith('.jsonl')) {
        jsonlContent = file.content;
        console.log('Found output.jsonl, size:', file.content.length);
      }

      // Look for report content
      if (lowerName.includes('output.report.json') || (lowerName.includes('report') && lowerName.endsWith('.json'))) {
        try {
          reportContent = JSON.parse(file.content);
          console.log('Found report JSON:', lowerName);
        } catch (e) {
          console.warn('Failed to parse report JSON:', e);
        }
      }
    }

    console.log('Result - jsonl:', !!jsonlContent, 'report:', !!reportContent);

    return res.status(200).json({
      success: true,
      fileNames: files.map(f => f.name),
      jsonlContent,
      reportContent,
    });

  } catch (error) {
    console.error('Error extracting archive:', error);
    return res.status(500).json({
      error: `Failed to extract archive: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}
