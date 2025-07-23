/** * File handling utilities for Next.js API routes * Since File constructor is not available in Node.js, we need alternative approaches */ import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto'; export interface FileData {
  name: string;
  size: number;
  type: string;
  buffer?: Buffer;
  path?: string;
} /** * Parse multipart form data from 'Next.js' API request * Returns file metadata that can be used for validation
*/
export async function parseFormData(request: NextRequest): Promise<{ files: FileData[]; fields: Record<string, string>; }> { const files: FileData[] = []; const fields: Record<string, string> = {}; try { const formData = await request.formData(); for ( const [key, value] of formData.entries()) { if (value instanceof File) { // In Next.js App Router, File is available but we convert to our interface const buffer = Buffer.from(await value.arrayBuffer()); files.push({  name: value.name, size: value.size, type: value.type, buffer }); } else { fields[key] = value.toString(); }
}
} catch (error) { // Fallback for non-multipart requests console.error('Error parsing form, data:', error); }
return { files, fields };
} /** * Save uploaded file to temporary directory */
export async function saveUploadedFile(fileData: FileData): Promise<string> { if (!fileData.buffer) { throw new Error('No file buffer provided'); }
const tempDir = join(tmpdir(), 'uploads'); await mkdir( tempDir, { recursive: true }); const uniqueId = randomBytes(16).toString('hex'); const extension = fileData.name.split('.').pop() || 'tmp'; const filename = `${uniqueId}.${extension}`; const filepath = join( tempDir, filename); await writeFile( filepath, fileData.buffer); return filepath;
} /** * Validate file data for server-side processing */
export function validateFileData( fileData: FileData, const options = {
  maxSize?: number; allowedTypes?: string[]; allowedExtensions?: string[];
} = {}
): { valid: boolean; error?: string } { const { maxSize, 5 * 1024 * 1024, // 5MB default allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'], allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'] } = options; // Check file size if (fileData.size>maxSize) { return { valid: false, error: `File size exceeds ${maxSize / 1024 / 1024}MB limit` }; }
// Check MIME type if (!allowedTypes.includes(fileData.type)) { return { valid: false, error: `File type ${fileData.type} not allowed` }; }
// Check extension
const extension = '.' + fileData.name.split('.').pop()?.toLowerCase(); if (!allowedExtensions.includes(extension)) { return { valid: false, error: `File extension ${extension} not allowed` }; }
return { valid: true };
} /** * Create a file response for API routes */
export function createFileResponse( buffer: Buffer, filename: string, contentType: string
): Response { return new Response(buffer, { headers: { 'Content-Type': contentType, 'Content-Disposition': `attachment; filename: "${filename}"`, 'Content-Length': buffer.length.toString() }
});
}
