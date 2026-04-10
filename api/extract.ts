import type { VercelRequest, VercelResponse } from '@vercel/node';

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

async function decompressGzip(buffer: Buffer): Promise<Buffer> {
  const zlib = require('zlib');
  return new Promise((resolve, reject) => {
    zlib.unzip(buffer, (err: Error | null, result: Buffer) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

function parseTar(data: Buffer): { files: { name: string; content: string }[] } {
  const files: { name: string; content: string }[] = [];
  let offset = 0;
  const blockSize = 512;

  while (offset + blockSize <= data.length) {
    const header = parseTarHeader(data, offset);

    if (header === null) break;

    offset += blockSize;

    if (header.type === 0 && header.size > 0 && header.name) {
      const fileData = data.slice(offset, offset + header.size);
      const content = fileData.toString('utf8');
      files.push({ name: header.name, content });

      const paddedSize = Math.ceil(header.size / blockSize) * blockSize;
      offset += paddedSize;
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

    // Fetch the archive server-side
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log('Downloaded archive, size:', buffer.length);

    // Decompress gzip
    const decompressed = await decompressGzip(buffer);

    console.log('Decompressed, size:', decompressed.length);

    // Parse tar
    const { files } = parseTar(decompressed);

    console.log('Parsed tar, found', files.length, 'files');

    // Find output.jsonl and output.report.json
    let jsonlContent: string | null = null;
    let reportContent: any | null = null;

    for (const file of files) {
      const lowerName = file.name.toLowerCase();

      if (lowerName.endsWith('output.jsonl') || lowerName === 'output.jsonl') {
        jsonlContent = file.content;
        console.log('Found output.jsonl, size:', file.content.length);
      }

      if (lowerName.endsWith('output.report.json') || lowerName === 'output.report.json') {
        try {
          reportContent = JSON.parse(file.content);
          console.log('Found output.report.json');
        } catch (e) {
          console.warn('Failed to parse report JSON:', e);
        }
      }
    }

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
