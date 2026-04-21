import pako from 'pako';

const MAX_ARCHIVE_SIZE = 500 * 1024 * 1024; // 500MB max

function parseTarHeader(data: Uint8Array, offset: number): { name: string; size: number; type: number } | null {
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
    return new TextDecoder('utf8').decode(data.slice(start, end));
  };

  const name = getString(offset, 100).trim();
  const sizeStr = getString(offset + 124, 12);
  const size = parseInt(sizeStr, 8);
  
  // Validate size - NaN or negative sizes indicate malformed headers
  if (isNaN(size) || size < 0) {
    return null;
  }
  
  // Sanity check: size should not exceed remaining data
  if (offset + 512 + size > data.length) {
    return null;
  }

  const typeChar = getString(offset + 156, 1);
  const type = typeChar === '5' ? 5 : 0;

  return { name, size, type };
}

/**
 * Extract all output.jsonl files and output.report.json from a tar.gz archive.
 * Validates archive size and handles malformed entries gracefully.
 * Returns a map of JSONL file names to their content.
 */
export function extractFromTar(data: Uint8Array): { jsonlFiles: Record<string, string>; reportContent: any | null } {
  const blockSize = 512;
  let offset = 0;
  let pendingLongName: string | null = null;
  const jsonlFiles: Record<string, string> = {};
  let reportContent: any | null = null;
  let hasPrimaryOutput = false;
  let largestJsonlSize = 0;

  while (offset + blockSize <= data.length) {
    const header = parseTarHeader(data, offset);
    if (header === null) break;

    offset += blockSize;

    if (header.type === 0 && header.size > 0 && header.name) {
      const paddedSize = Math.ceil(header.size / blockSize) * blockSize;

      if (header.name.endsWith('@LongLink') || header.name === '././@LongLink') {
        pendingLongName = new TextDecoder('utf8').decode(data.slice(offset, offset + header.size)).replace(/\0+$/, '');
      } else {
        const fileName = pendingLongName || header.name;
        pendingLongName = null;
        const lowerName = fileName.toLowerCase();

        // Match output.jsonl files - include main output and critic_attempt files
        const isJsonl = lowerName.endsWith('/output.jsonl') || 
                        lowerName === 'output.jsonl' ||
                        lowerName.endsWith('/output.critic_attempt_1.jsonl') ||
                        lowerName === 'output.critic_attempt_1.jsonl' ||
                        lowerName.endsWith('/output.critic_attempt_2.jsonl') ||
                        lowerName === 'output.critic_attempt_2.jsonl' ||
                        lowerName.endsWith('/output.critic_attempt_3.jsonl') ||
                        lowerName === 'output.critic_attempt_3.jsonl';
        const isReport = lowerName.includes('output.report.json') || (lowerName.includes('report') && lowerName.endsWith('.json'));

        if (isJsonl || isReport) {
          const content = new TextDecoder('utf8').decode(data.slice(offset, offset + header.size));
          
          if (isJsonl) {
            // Store each JSONL file with its name as the key
            jsonlFiles[fileName] = content;
            
            // Track largest output.jsonl
            if (header.size > largestJsonlSize) {
              largestJsonlSize = header.size;
            }
            
            // Check if this is the primary output.jsonl (not a critic file)
            if (!hasPrimaryOutput && !lowerName.includes('critic')) {
              hasPrimaryOutput = true;
            }
          }
          if (isReport) {
            try {
              reportContent = JSON.parse(content);
            } catch {
              // Ignore malformed JSON in report
            }
          }
        }
      }

      offset += paddedSize;
    }

    // Early exit if we found the main output.jsonl, any critic files, and report with sufficient content
    if (hasPrimaryOutput && reportContent && largestJsonlSize > 100000) {
      // Continue to find critic files if there might be more
      if (Object.keys(jsonlFiles).length >= 4) {
        break;
      }
    }
  }

  return { jsonlFiles, reportContent };
}

/**
 * Decompress and extract data from a tar.gz archive.
 * Validates size and throws for oversized files.
 */
export async function decompressTarGz(data: Uint8Array): Promise<{ jsonlFiles: Record<string, string>; reportContent: any | null }> {
  if (data.length > MAX_ARCHIVE_SIZE) {
    throw new Error(`Archive too large: ${(data.length / 1024 / 1024).toFixed(1)}MB exceeds ${MAX_ARCHIVE_SIZE / 1024 / 1024}MB limit`);
  }
  
  let decompressed: Uint8Array;
  try {
    decompressed = pako.ungzip(data);
  } catch {
    decompressed = pako.inflate(data);
  }
  
  return extractFromTar(decompressed);
}