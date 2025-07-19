# File Upload Guide for Next.js API Routes

## Problem: File is not defined in Node.js

The `File` constructor is a Web API that's only available in browser environments. In Next.js API routes (which run in Node.js), you cannot use `File` directly.

## Solution Overview

We've implemented a cross-environment solution that works in both client and server contexts:

1. **Server-side file handling** using Buffer and metadata
2. **Type-safe validation** that works in both environments  
3. **Middleware utilities** for easy file upload handling

## Implementation Details

### 1. Updated Validation Schemas

Located in `/lib/api/validation.ts`:

```typescript
// The schema now detects the environment and uses appropriate validation
export const FileUploadSchema = isServer
  ? BaseFileUploadSchema.extend({
      fileName: z.string(),
      fileSize: z.number().int().min(0),
      mimeType: z.string()
    })
  : BaseFileUploadSchema.extend({
      file: z.instanceof(globalThis.File || Object)
    });
```

### 2. File Handling Utilities

Located in `/lib/api/file-handling.ts`:

- `parseFormData()` - Parse multipart form data from requests
- `validateFileData()` - Validate file metadata server-side
- `saveUploadedFile()` - Save files to temporary storage
- `createFileResponse()` - Create file download responses

### 3. Security Validation

Updated `/lib/security/input-validation.ts`:

```typescript
// Works with both File objects and file metadata
export function validateFile(
  file: File | FileData,
  options: FileValidationOptions = {}
): { valid: boolean; error?: string }
```

## Usage Examples

### Basic File Upload Route

```typescript
// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { parseFormData, validateFileData } from '@/lib/api/file-handling';

export async function POST(request: NextRequest) {
  const { files, fields } = await parseFormData(request);
  
  if (files.length === 0) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  const file = files[0];
  const validation = validateFileData(file);
  
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  // Process the file...
  return NextResponse.json({ success: true });
}
```

### Using the Upload Middleware

```typescript
// app/api/avatar/route.ts
import { withFileUpload } from '@/lib/api/middleware/file-upload';

export const POST = withFileUpload(
  async (req, files, fields) => {
    const avatar = files[0];
    // Save to cloud storage, update database, etc.
    return NextResponse.json({ 
      success: true,
      url: 'https://storage.example.com/avatar.jpg'
    });
  },
  {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png'],
    maxFiles: 1
  }
);
```

### Client-Side Upload

```typescript
// components/FileUpload.tsx
'use client';

const handleUpload = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  // Handle result...
};
```

## Best Practices

1. **Always validate files** on the server side, even if you validate on the client
2. **Use appropriate file size limits** based on your use case
3. **Store files in cloud storage** (S3, Cloudinary, etc.) rather than the file system
4. **Implement virus scanning** for production applications
5. **Use streaming** for large files to avoid memory issues

## Common Issues and Solutions

### Issue: FormData not parsing correctly

Solution: Ensure your API route is using the App Router (`app/api/`) and not Pages Router.

### Issue: Large files causing memory issues

Solution: Use streaming uploads for files larger than 10MB:

```typescript
import { Readable } from 'stream';

// Stream large files to cloud storage
const stream = Readable.from(buffer);
await uploadToS3(stream, filename);
```

### Issue: CORS errors on file upload

Solution: Configure appropriate CORS headers in your middleware.

## Security Considerations

1. **Validate file types** by checking both MIME type and file extension
2. **Sanitize file names** to prevent directory traversal attacks
3. **Implement rate limiting** on upload endpoints
4. **Use virus scanning** for user-uploaded files
5. **Store files outside the web root** or use cloud storage

## Related Files

- `/lib/api/file-handling.ts` - Core file handling utilities
- `/lib/api/validation.ts` - Validation schemas
- `/lib/security/input-validation.ts` - Security validation
- `/lib/api/middleware/file-upload.ts` - Upload middleware
- `/app/api/upload/example/route.ts` - Example implementation