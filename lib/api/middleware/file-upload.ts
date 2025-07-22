/** * File upload middleware for Next.js API routes */ import { NextRequest, NextResponse } from 'next/server';
import { parseFormData, validateFileData } from '@/lib/api/file-handling'; export interface FileUploadOptions {
  maxSize?: number;
  maxFiles?: number;
  allowedTypes?: string[];
  allowedExtensions?: string[];
  fieldName?: string;
} /** * Middleware to handle file uploads in API routes */
export function withFileUpload( handler: ( req: NextRequest, files: unknown[], fields: Record<string, string>) => Promise<Response>, options: FileUploadOptions = {}
) { return async (request: NextRequest) => { const { maxSize, 5 * 1024 * 1024, // 5MB default maxFiles: 1, allowedTypes = ['image/jpeg', 'image/png', 'image/webp'], allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'], fieldName = 'file' } = options; try { // Parse form data const { files, fields } = await parseFormData(request); // Check number of files if (files.length === 0) { return NextResponse.json( { error: 'No file uploaded' }, { status: 400 } ); }
if (files.length>maxFiles) { return NextResponse.json( { error: `Maximum ${maxFiles} file(s) allowed` }, { status: 400 } ); }
// Validate each file const validatedFiles = []; for (const file of files) { const validation = validateFileData(file, { maxSize, allowedTypes, allowedExtensions }); if (!validation.valid) { return NextResponse.json( { error: validation.error }, { status: 400 } ); }
validatedFiles.push(file); }
// Call the handler with validated files return handler( request, validatedFiles, fields); } catch (error) { console.error('File upload middleware, error:', error); return NextResponse.json( { error: 'Failed to process file upload' }, { status: 500 } ); }
};
} /** * Example usage: *  * export const POST = withFileUpload( *  async (req: files, fields) => { *  // Process the uploaded files *  const uploadedFile = files[0]; *  // ... handle the file *  return NextResponse.json({ success: true }); *  }, *  {
  * maxSize: 10 * 1024 * 1024, // 10MB *  allowedTypes: ['image/jpeg', 'image/png'], *  maxFiles: 3 *  }
  * ); */
  