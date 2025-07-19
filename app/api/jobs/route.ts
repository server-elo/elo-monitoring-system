import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { 
  successResponse,
  errorResponse,
  validationErrorResponse,
  withErrorHandling,
  generateRequestId
} from '@/lib/api/utils';
import { ApiErrorCode, HttpStatus } from '@/lib/api/types';
import { logger } from '@/lib/monitoring/simple-logger';

// Configure for dynamic API routes
export const dynamic = 'force-dynamic';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Remote';
  salary: string;
  experience: 'Entry' | 'Mid' | 'Senior' | 'Lead';
  skills: string[];
  description: string;
  requirements: string[];
  benefits: string[];
  postedAt: Date;
  expiresAt?: Date;
  featured: boolean;
  remote: boolean;
  companyLogo?: string;
  applicationUrl?: string;
  contactEmail?: string;
  isActive: boolean;
}

// Mock job data - in production this would come from a database
const mockJobs: Job[] = [
  {
    id: '1',
    title: 'Senior Solidity Developer',
    company: 'DeFi Protocol',
    location: 'San Francisco, CA',
    type: 'Full-time',
    salary: '$120k - $180k',
    experience: 'Senior',
    skills: ['Solidity', 'Web3.js', 'Hardhat', 'OpenZeppelin', 'DeFi'],
    description: 'Build next-generation DeFi protocols with cutting-edge smart contract technology. Join our team of blockchain experts working on revolutionary financial products.',
    requirements: [
      '5+ years of software development experience',
      '3+ years of Solidity development',
      'Experience with DeFi protocols',
      'Strong understanding of blockchain security',
      'Experience with testing frameworks (Hardhat, Foundry)'
    ],
    benefits: [
      'Competitive salary and equity',
      'Remote-first culture',
      'Health, dental, and vision insurance',
      'Professional development budget',
      'Flexible PTO'
    ],
    postedAt: new Date('2024-01-10'),
    featured: true,
    remote: true,
    applicationUrl: 'https://defiprotocol.com/careers/senior-solidity-dev',
    contactEmail: 'careers@defiprotocol.com',
    isActive: true
  },
  {
    id: '2',
    title: 'Blockchain Engineer',
    company: 'CryptoStartup',
    location: 'New York, NY',
    type: 'Full-time',
    salary: '$90k - $140k',
    experience: 'Mid',
    skills: ['Solidity', 'React', 'Node.js', 'Ethereum', 'Web3'],
    description: 'Join our team building the future of decentralized applications. Work on innovative blockchain solutions that will shape the next generation of the internet.',
    requirements: [
      '3+ years of software development experience',
      '2+ years of blockchain development',
      'Experience with React and Node.js',
      'Understanding of smart contract development',
      'Knowledge of Web3 technologies'
    ],
    benefits: [
      'Competitive salary',
      'Stock options',
      'Health insurance',
      'Learning and development opportunities',
      'Team building events'
    ],
    postedAt: new Date('2024-01-08'),
    featured: false,
    remote: false,
    applicationUrl: 'https://cryptostartup.com/jobs/blockchain-engineer',
    contactEmail: 'jobs@cryptostartup.com',
    isActive: true
  },
  {
    id: '3',
    title: 'Smart Contract Auditor',
    company: 'Security Firm',
    location: 'Remote',
    type: 'Contract',
    salary: '$80 - $150/hour',
    experience: 'Senior',
    skills: ['Solidity', 'Security', 'Mythril', 'Slither', 'Formal Verification'],
    description: 'Audit smart contracts for security vulnerabilities and best practices. Help secure the DeFi ecosystem by identifying and preventing potential exploits.',
    requirements: [
      '5+ years of security experience',
      '3+ years of smart contract auditing',
      'Experience with security tools (Mythril, Slither, etc.)',
      'Knowledge of common smart contract vulnerabilities',
      'Strong analytical and problem-solving skills'
    ],
    benefits: [
      'High hourly rate',
      'Flexible schedule',
      'Remote work',
      'Professional development',
      'Industry recognition'
    ],
    postedAt: new Date('2024-01-05'),
    featured: true,
    remote: true,
    applicationUrl: 'https://securityfirm.com/auditor-position',
    contactEmail: 'auditors@securityfirm.com',
    isActive: true
  },
  {
    id: '4',
    title: 'Junior Blockchain Developer',
    company: 'Web3 Agency',
    location: 'Austin, TX',
    type: 'Full-time',
    salary: '$60k - $80k',
    experience: 'Entry',
    skills: ['Solidity', 'JavaScript', 'Git', 'Testing', 'Web3.js'],
    description: 'Perfect entry-level position for new blockchain developers. Learn from experienced team members while working on real-world blockchain projects.',
    requirements: [
      '1+ years of programming experience',
      'Basic knowledge of Solidity',
      'Understanding of blockchain concepts',
      'Experience with JavaScript',
      'Eagerness to learn and grow'
    ],
    benefits: [
      'Mentorship program',
      'Learning opportunities',
      'Health insurance',
      'Flexible hours',
      'Career growth path'
    ],
    postedAt: new Date('2024-01-03'),
    featured: false,
    remote: true,
    applicationUrl: 'https://web3agency.com/junior-dev',
    contactEmail: 'hr@web3agency.com',
    isActive: true
  }
];

async function getJobsHandler(request: NextRequest) {
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
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || 'all';
    const experience = searchParams.get('experience') || 'all';
    const location = searchParams.get('location') || 'all';
    const remote = searchParams.get('remote') === 'true';
    const featured = searchParams.get('featured') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Filter jobs
    let filteredJobs = mockJobs.filter(job => job.isActive);

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredJobs = filteredJobs.filter(job =>
        job.title.toLowerCase().includes(searchLower) ||
        job.company.toLowerCase().includes(searchLower) ||
        job.description.toLowerCase().includes(searchLower) ||
        job.skills.some(skill => skill.toLowerCase().includes(searchLower))
      );
    }

    // Type filter
    if (type !== 'all') {
      filteredJobs = filteredJobs.filter(job => job.type === type);
    }

    // Experience filter
    if (experience !== 'all') {
      filteredJobs = filteredJobs.filter(job => job.experience === experience);
    }

    // Location filter
    if (location !== 'all') {
      if (location === 'remote') {
        filteredJobs = filteredJobs.filter(job => job.remote);
      } else {
        filteredJobs = filteredJobs.filter(job => 
          job.location.toLowerCase().includes(location.toLowerCase())
        );
      }
    }

    // Remote filter
    if (remote) {
      filteredJobs = filteredJobs.filter(job => job.remote);
    }

    // Featured filter
    if (featured) {
      filteredJobs = filteredJobs.filter(job => job.featured);
    }

    // Sort by posted date (newest first)
    filteredJobs.sort((a, b) => b.postedAt.getTime() - a.postedAt.getTime());

    // Pagination
    const total = filteredJobs.length;
    const paginatedJobs = filteredJobs.slice(offset, offset + limit);

    const response = {
      jobs: paginatedJobs,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      },
      filters: {
        search,
        type,
        experience,
        location,
        remote,
        featured
      }
    };

    return successResponse(response, undefined, HttpStatus.OK, requestId);
    
  } catch (error) {
    logger.error('Get jobs error', error as Error);
    return errorResponse(
      ApiErrorCode.INTERNAL_SERVER_ERROR,
      'Failed to fetch jobs',
      HttpStatus.INTERNAL_SERVER_ERROR,
      undefined,
      requestId
    );
  }
}

async function createJobHandler(request: NextRequest) {
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

    // Check if user has permission to create jobs (admin or employer role)
    // For now, we'll allow any authenticated user for demo purposes
    
    const body = await request.json();
    
    // Basic validation
    const requiredFields = ['title', 'company', 'location', 'type', 'experience', 'description'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return validationErrorResponse(
        missingFields.map(field => ({
          field,
          message: `${field} is required`,
          code: 'required'
        })),
        requestId
      );
    }

    const newJob: Job = {
      id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      title: body.title,
      company: body.company,
      location: body.location,
      type: body.type,
      salary: body.salary || 'Competitive',
      experience: body.experience,
      skills: body.skills || [],
      description: body.description,
      requirements: body.requirements || [],
      benefits: body.benefits || [],
      postedAt: new Date(),
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      featured: body.featured || false,
      remote: body.remote || false,
      companyLogo: body.companyLogo,
      applicationUrl: body.applicationUrl,
      contactEmail: body.contactEmail,
      isActive: true
    };

    // Add to mock database
    mockJobs.push(newJob);

    return successResponse(newJob, undefined, HttpStatus.CREATED, requestId);
    
  } catch (error) {
    logger.error('Create job error', error as Error);
    return errorResponse(
      ApiErrorCode.INTERNAL_SERVER_ERROR,
      'Failed to create job',
      HttpStatus.INTERNAL_SERVER_ERROR,
      undefined,
      requestId
    );
  }
}

// Route handlers
export const GET = withErrorHandling(getJobsHandler);
export const POST = withErrorHandling(createJobHandler);
