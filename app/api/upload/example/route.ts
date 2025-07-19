/**
 * Example file upload API route for Next.js App Router
 * Demonstrates proper file handling without using the File constructor in server context
 */

import { NextRequest, NextResponse } from 'next/server';
import { parseFormData, validateFileData, saveUploadedFile } from '@/lib/api/file-handling';
import { validateFile } from '@/lib/security/input-validation';

export async function POST(request: NextRequest) {
  try {
    // Parse the form data
    const { files, fields } = await parseFormData(request);

    if (codeSnippets.length === 0) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    const uploadedFiles = [];

    for (const fileData of files) {
      // Validate the file using our server-side validation
      const validation = validateFileData(fileData, {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
        allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp']
      });

      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        );
      }

      // Additional security validation
      const securityValidation = validateFile(fileData, {
        maxSize: 5 * 1024 * 1024,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
      });

      if (!securityValidation.valid) {
        return NextResponse.json(
          { error: securityValidation.error },
          { status: 400 }
        );
      }

      // Save the file temporarily ( in production, you'd upload to cloud storage)
      const filepath = await saveUploadedFile(_fileData);

      uploadedFiles.push({
        name: fileData.name,
        size: fileData.size,
        type: fileData.type,
        path: filepath
      });
    }

    // Return success response
    return NextResponse.json({
      success: true,
      files: uploadedFiles,
      fields: fields
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process upload' },
      { status: 500 }
    );
  }
}

// Optionally handle GET requests to provide upload information
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/upload/example',
    method: 'POST',
    accepts: 'multipart/form-data',
    maxFileSize: '5MB',
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    example: {
      curl: `curl -X POST -F "file=@image.jpg" ${process.env.NEXT_PUBLIC_APP_URL}/api/upload/example`
    }
  });
}