import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { 
  successResponse,
  errorResponse,
  notFoundResponse,
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

// Mock certificate data - should match the data from the main certificates route
const mockCertificates: Certificate[] = [
  {
    id: '1',
    userId: 'user1',
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
      completionTime: 40,
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
      completionTime: 120
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

async function getCertificateHandler(request: NextRequest, { params }: { params: { id: string } }) {
  const requestId = generateRequestId();
  
  try {
    const { id } = params;
    
    if (!id) {
      return errorResponse(
        ApiErrorCode.BAD_REQUEST,
        'Certificate ID is required',
        HttpStatus.BAD_REQUEST,
        undefined,
        requestId
      );
    }

    // Find certificate
    const certificate = mockCertificates.find(cert => cert.id === id);
    
    if (!certificate) {
      return notFoundResponse('Certificate', requestId);
    }

    // Check if this is a public certificate request (no auth required for public URLs)
    const url = new URL(request.url);
    const isPublicRequest = url.searchParams.get('public') === 'true';
    
    if (!isPublicRequest) {
      // For private access, require authentication
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

      // Check if user can access this certificate
      if (certificate.userId !== session.user.id) {
        // For now, only allow users to see their own certificates
        // In production, you might allow public access to verified certificates
        return errorResponse(
          ApiErrorCode.FORBIDDEN,
          'You can only access your own certificates',
          HttpStatus.FORBIDDEN,
          undefined,
          requestId
        );
      }
    } else {
      // For public requests, only return verified certificates
      if (!certificate.verified) {
        return notFoundResponse('Certificate', requestId);
      }
      
      // For public access, remove sensitive information
      const publicCertificate = {
        id: certificate.id,
        title: certificate.title,
        description: certificate.description,
        issuer: certificate.issuer,
        issuedAt: certificate.issuedAt,
        expiresAt: certificate.expiresAt,
        credentialId: certificate.credentialId,
        skills: certificate.skills,
        level: certificate.level,
        type: certificate.type,
        verified: certificate.verified,
        badgeUrl: certificate.badgeUrl,
        blockchainTxHash: certificate.blockchainTxHash,
        ipfsHash: certificate.ipfsHash
      };
      
      return successResponse(publicCertificate, undefined, HttpStatus.OK, requestId);
    }

    // Add verification information
    const certificateWithVerification = {
      ...certificate,
      verification: {
        isValid: certificate.verified,
        isExpired: certificate.expiresAt ? new Date() > certificate.expiresAt : false,
        onBlockchain: !!certificate.blockchainTxHash,
        ipfsStored: !!certificate.ipfsHash,
        verificationUrl: certificate.publicUrl
      }
    };

    return successResponse(certificateWithVerification, undefined, HttpStatus.OK, requestId);
    
  } catch (error) {
    logger.error('Get certificate error', error as Error);
    return errorResponse(
      ApiErrorCode.INTERNAL_SERVER_ERROR,
      'Failed to fetch certificate',
      HttpStatus.INTERNAL_SERVER_ERROR,
      undefined,
      requestId
    );
  }
}

async function updateCertificateHandler(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { id } = params;
    
    if (!id) {
      return errorResponse(
        ApiErrorCode.BAD_REQUEST,
        'Certificate ID is required',
        HttpStatus.BAD_REQUEST,
        undefined,
        requestId
      );
    }

    // Find certificate
    const certificateIndex = mockCertificates.findIndex(cert => cert.id === id);
    
    if (certificateIndex === -1) {
      return notFoundResponse('Certificate', requestId);
    }

    const certificate = mockCertificates[certificateIndex];

    // Check if user can update this certificate
    if (certificate.userId !== session.user.id) {
      return errorResponse(
        ApiErrorCode.FORBIDDEN,
        'You can only update your own certificates',
        HttpStatus.FORBIDDEN,
        undefined,
        requestId
      );
    }

    const body = await request.json();
    
    // Only allow updating certain fields
    const allowedUpdates = ['publicUrl', 'badgeUrl'];
    const updates: Partial<Certificate> = {};
    
    for (const field of allowedUpdates) {
      if (body[field] !== undefined) {
        updates[field as keyof Certificate] = body[field];
      }
    }

    // Update certificate
    const updatedCertificate = {
      ...certificate,
      ...updates
    };

    mockCertificates[certificateIndex] = updatedCertificate;

    return successResponse(updatedCertificate, undefined, HttpStatus.OK, requestId);
    
  } catch (error) {
    logger.error('Update certificate error', error as Error);
    return errorResponse(
      ApiErrorCode.INTERNAL_SERVER_ERROR,
      'Failed to update certificate',
      HttpStatus.INTERNAL_SERVER_ERROR,
      undefined,
      requestId
    );
  }
}

async function deleteCertificateHandler(_request: NextRequest, { params }: { params: { id: string } }) {
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

    const { id } = params;
    
    if (!id) {
      return errorResponse(
        ApiErrorCode.BAD_REQUEST,
        'Certificate ID is required',
        HttpStatus.BAD_REQUEST,
        undefined,
        requestId
      );
    }

    // Find certificate
    const certificateIndex = mockCertificates.findIndex(cert => cert.id === id);
    
    if (certificateIndex === -1) {
      return notFoundResponse('Certificate', requestId);
    }

    const certificate = mockCertificates[certificateIndex];

    // Check if user can delete this certificate (usually restricted)
    if (certificate.userId !== session.user.id) {
      return errorResponse(
        ApiErrorCode.FORBIDDEN,
        'You cannot delete certificates',
        HttpStatus.FORBIDDEN,
        undefined,
        requestId
      );
    }

    // In most cases, certificates should not be deletable once issued
    return errorResponse(
      ApiErrorCode.FORBIDDEN,
      'Certificates cannot be deleted once issued',
      HttpStatus.FORBIDDEN,
      undefined,
      requestId
    );
    
  } catch (error) {
    logger.error('Delete certificate error', error as Error);
    return errorResponse(
      ApiErrorCode.INTERNAL_SERVER_ERROR,
      'Failed to delete certificate',
      HttpStatus.INTERNAL_SERVER_ERROR,
      undefined,
      requestId
    );
  }
}

// Route handlers
export const GET = withErrorHandling(getCertificateHandler);
export const PUT = withErrorHandling(updateCertificateHandler);
export const DELETE = withErrorHandling(deleteCertificateHandler);
