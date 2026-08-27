import { createHash } from 'node:crypto';

export const createFileHash = (fileBuffer: Buffer): string => {
  return createHash('sha256').update(fileBuffer).digest('hex');
};
