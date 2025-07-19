import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { 
  successResponse,
  errorResponse,
  withErrorHandling,
  generateRequestId
} from '@/lib/api/utils';
import { ApiErrorCode, HttpStatus } from '@/lib/api/types';
import { logger } from '@/lib/monitoring/simple-logger';

// Configure for dynamic API routes
export const dynamic = 'force-dynamic';

interface Certificate {
  id: string;
  userId: string;
  title: string;
  description: string;
  issuer: string;
  issuedAt: Date;
  expiresAt?: Date;
  blockchainTxHash?: string;
  ipfsHash?: string;
  credentialId: string;
  skills: string[];
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  type: 'Course' | 'Project' | 'Assessment' | 'Certification';
  verified: boolean;
  publicUrl?: string;
  badgeUrl?: string;
  metadata?: {
    courseId?: string;
    projectId?: string;
    assessmentScore?: number;
    completionTime?: number;
    instructorId?: string;
  };
}

// Mock certificate data - in production this would come from a database
const mockCertificates: Certificate[] = [
  {
    id: '1',
    userId: 'user1', // This would be replaced with actual user IDs
    title: 'Solidity Fundamentals',
    description: 'Completed comprehensive course covering Solidity basics, smart contract development, and deployment.',
    issuer: 'SolidityLearn Academy',
    issuedAt: new Date('2024-01-15'),
    blockchainTxHash: '0x1234567890abcdef1234567890abcdef12345678',
    ipfsHash: 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
    credentialId: 'SL-FUND-2024-001',
    skills: ['Solidity', 'Smart Contracts', 'Ethereum', 'Web3'],
    level: 'Beginner',
    type: 'Course',
    verified: true,
    publicUrl: 'https://certificates.soliditylearn.com/SL-FUND-2024-001',
    badgeUrl: '/badges/solidity-fundamentals.png',
    metadata: {
      courseId: 'course_solidity_fundamentals',
      completionTime: 40, // hours
      instructorId: 'instructor_1'
    }
  },
  {
    id: '2',
    userId: 'user1',
    title: 'DeFi Protocol Development',
    description: 'Built and deployed a complete DeFi lending protocol with advanced features.',
    issuer: 'SolidityLearn Academy',
    issuedAt: new Date('2024-01-10'),
    expiresAt: new Date('2026-01-10'),
    blockchainTxHash: '0xabcdef1234567890abcdef1234567890abcdef12',
    credentialId: 'SL-DEFI-2024-002',
    skills: ['DeFi', 'Lending Protocols', 'Yield Farming', 'Governance'],
    level: 'Advanced',
    type: 'Project',
    verified: true,
    publicUrl: 'https://certificates.soliditylearn.com/SL-DEFI-2024-002',
    metadata: {
      projectId: 'project_defi_lending',
      completionTime: 120 // hours
    }
  },
  {
    id: '3',
    userId: 'user1',
    title: 'Smart Contract Security Audit',
    description: 'Demonstrated expertise in identifying and fixing smart contract vulnerabilities.',
    issuer: 'Blockchain Security Institute',
    issuedAt: new Date('2024-01-05'),
    credentialId: 'BSI-SEC-2024-003',
    skills: ['Security Auditing', 'Vulnerability Assessment', 'Code Review'],
    level: 'Expert',
    type: 'Certification',
    verified: true,
    metadata: {
      assessmentScore: 95
    }
  }
];

async function getCertificatesHandler(request: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return errorResponse(
        ApiErrorCode.UNAUTHORIZED,
        'Authentication required',
        HttpStatus.UNAUTHORIZED,
        undefined,
        requestId
      );
    }

    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    // Parse query parameters
    const userId = searchParams.get('userId') || session.user.id;
    const type = searchParams.get('type') || 'all';
    const verified = searchParams.get('verified');
    const level = searchParams.get('level') || 'all';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Check if user can access certificates for the requested userId
    if (userId !== session.user.id) {
      // For now, only allow users to see their own certificates
      // In production, you might allow instructors/admins to see others
      return errorResponse(
        ApiErrorCode.FORBIDDEN,
        'You can only access your own certificates',
        HttpStatus.FORBIDDEN,
        undefined,
        requestId
      );
    }

    // Filter certificates for the user
    let filteredCertificates = mockCertificates.filter(cert => cert.userId === userId);

    // Type filter
    if (type !== 'all') {
      filteredCertificates = filteredCertificates.filter(cert => 
        cert.type.toLowerCase() === type.toLowerCase()
      );
    }

    // Verified filter
    if (verified !== null) {
      const isVerified = verified === 'true';
      filteredCertificates = filteredCertificates.filter(cert => cert.verified === isVerified);
    }

    // Level filter
    if (level !== 'all') {
      filteredCertificates = filteredCertificates.filter(cert => 
        cert.level.toLowerCase() === level.toLowerCase()
      );
    }

    // Sort by issued date (newest first)
    filteredCertificates.sort((a, b) => b.issuedAt.getTime() - a.issuedAt.getTime());

    // Pagination
    const total = filteredCertificates.length;
    const paginatedCertificates = filteredCertificates.slice(offset, offset + limit);

    // Calculate statistics
    const stats = {
      total: filteredCertificates.length,
      verified: filteredCertificates.filter(c => c.verified).length,
      onBlockchain: filteredCertificates.filter(c => c.blockchainTxHash).length,
      byType: {
        Course: filteredCertificates.filter(c => c.type === 'Course').length,
        Project: filteredCertificates.filter(c => c.type === 'Project').length,
        Assessment: filteredCertificates.filter(c => c.type === 'Assessment').length,
        Certification: filteredCertificates.filter(c => c.type === 'Certification').length,
      },
      byLevel: {
        Beginner: filteredCertificates.filter(c => c.level === 'Beginner').length,
        Intermediate: filteredCertificates.filter(c => c.level === 'Intermediate').length,
        Advanced: filteredCertificates.filter(c => c.level === 'Advanced').length,
        Expert: filteredCertificates.filter(c => c.level === 'Expert').length,
      }
    };

    const response = {
      certificates: paginatedCertificates,
      stats,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      },
      filters: {
        type,
        verified,
        level
      }
    };

    return successResponse(response, undefined, HttpStatus.OK, requestId);
    
  } catch (error) {
    logger.error('Get certificates error', error as Error);
    return errorResponse(
      ApiErrorCode.INTERNAL_SERVER_ERROR,
      'Failed to fetch certificates',
      HttpStatus.INTERNAL_SERVER_ERROR,
      undefined,
      requestId
    );
  }
}

async function createCertificateHandler(_request: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return errorResponse(
        ApiErrorCode.UNAUTHORIZED,
        'Authentication required',
        HttpStatus.UNAUTHORIZED,
        undefined,
        requestId
      );
    }

    // Check if user has permission to create certificates (admin or instructor role)
    // For now, we'll restrict this to prevent abuse
    return errorResponse(
      ApiErrorCode.FORBIDDEN,
      'Certificate creation is restricted to authorized personnel',
      HttpStatus.FORBIDDEN,
      undefined,
      requestId
    );

    // The following code would be used if certificate creation was allowed:
    /*
    const body = await request.json();
    
    // Basic validation
    const requiredFields = ['title', 'description', 'issuer', 'skills', 'level', 'type'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return validationErrorResponse(
        `Missing required fields: ${missingFields.join(', ')}`,
        missingFields.map(field => ({
          field,
          message: `${field} is required`,
          code: 'required'
        })),
        requestId
      );
    }

    const newCertificate: Certificate = {
      id: `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: body.userId || session.user.id,
      title: body.title,
      description: body.description,
      issuer: body.issuer,
      issuedAt: new Date(),
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      credentialId: `SL-${body.type.toUpperCase()}-${new Date().getFullYear()}-${String(mockCertificates.length + 1).padStart(3, '0')}`,
      skills: body.skills,
      level: body.level,
      type: body.type,
      verified: false, // Certificates start unverified
      publicUrl: body.publicUrl,
      badgeUrl: body.badgeUrl,
      metadata: body.metadata
    };

    // Add to mock database
    mockCertificates.push(newCertificate);

    return successResponse(newCertificate, undefined, HttpStatus.CREATED, requestId);
    */
    
  } catch (error) {
    logger.error('Create certificate error', error as Error);
    return errorResponse(
      ApiErrorCode.INTERNAL_SERVER_ERROR,
      'Failed to create certificate',
      HttpStatus.INTERNAL_SERVER_ERROR,
      undefined,
      requestId
    );
  }
}

// Route handlers
export const GET = withErrorHandling(getCertificatesHandler);
export const POST = withErrorHandling(createCertificateHandler);
