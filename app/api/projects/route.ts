import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/api/logger';
import { Prisma, ProjectCategory, SkillLevel } from '@prisma/client';

// Configure for dynamic API routes
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');
    
    // Build where clause for filtering
    const where: Prisma.ProjectWhereInput = {
      isPublished: true
    };
    
    if (category) {
      where.category = category.toUpperCase() as ProjectCategory;
    }
    
    if (difficulty) {
      where.difficulty = difficulty.toUpperCase() as SkillLevel;
    }

    // Fetch projects from database
    const projects = await prisma.project.findMany({
      where,
      include: {
        submissions: {
          where: { userId: session.user.id },
          select: {
            id: true,
            status: true,
            score: true,
            submittedAt: true
          }
        },
        _count: {
          select: {
            submissions: true,
            reviews: true
          }
        }
      },
      orderBy: [
        { difficulty: 'asc' },
        { xpReward: 'desc' }
      ]
    });

    // Transform projects to include user progress
    const projectsWithProgress = projects.map(project => {
      const userSubmission = project.submissions[0];
      return {
        ...project,
        userProgress: {
          started: !!userSubmission,
          completed: userSubmission?.status === 'APPROVED',
          score: userSubmission?.score,
          submittedAt: userSubmission?.submittedAt
        },
        totalSubmissions: project._count.submissions,
        totalReviews: project._count.reviews
      };
    });

    // If no projects exist, seed some example projects
    if (projects.length === 0) {
      await seedExampleProjects();
      return GET(request); // Retry after seeding
    }

    return NextResponse.json({ projects: projectsWithProgress });
  } catch (error) {
    logger.error('Error fetching projects', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      operation: 'get-projects'
    }, error instanceof Error ? error : undefined);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to seed example projects
async function seedExampleProjects() {
  const exampleProjects = [
    {
      title: 'Hello World Contract',
      description: 'Create your first smart contract that stores and retrieves a message',
      difficulty: 'BEGINNER',
      category: 'EDUCATIONAL',
      tags: 'beginner,basics,hello-world,first-contract',
      requirements: JSON.stringify([
        'Create a contract that stores a message',
        'Implement functions to get and set the message',
        'Add events for message updates',
        'Deploy and test the contract'
      ]),
      starterCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract HelloWorld {
    // TODO: Add state variable for message
    
    constructor() {
        // TODO: Initialize message
    }
    
    // TODO: Add getMessage function
    
    // TODO: Add setMessage function
}`,
      testCases: JSON.stringify([
        {
          name: 'Should deploy with initial message',
          type: 'deployment',
          expected: 'Hello, World!'
        },
        {
          name: 'Should update message',
          type: 'function',
          function: 'setMessage',
          args: ['Hello, Blockchain!'],
          expected: 'Hello, Blockchain!'
        }
      ]),
      estimatedHours: 2,
      xpReward: 200,
      isPublished: true,
      resources: JSON.stringify({
        links: [
          'https://docs.soliditylang.org/en/latest/introduction-to-smart-contracts.html',
          'https://ethereum.org/en/developers/docs/smart-contracts/'
        ],
        videos: [],
        articles: []
      })
    },
    {
      title: 'Simple Storage Contract',
      description: 'Build a contract that stores and retrieves different data types',
      difficulty: 'BEGINNER',
      category: 'UTILITY',
      tags: 'storage,data-types,state-variables,functions',
      requirements: JSON.stringify([
        'Store different data types (uint, string, address, bool)',
        'Create getter and setter functions',
        'Implement access control for setters',
        'Add input validation'
      ]),
      starterCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleStorage {
    // TODO: Add state variables for different types
    
    // TODO: Add getter functions
    
    // TODO: Add setter functions with access control
}`,
      testCases: JSON.stringify([
        {
          name: 'Should store and retrieve uint',
          type: 'storage',
          variable: 'storedNumber',
          value: 42
        },
        {
          name: 'Should restrict setter access',
          type: 'access',
          function: 'setNumber',
          shouldRevert: true
        }
      ]),
      estimatedHours: 3,
      xpReward: 300,
      isPublished: true
    },
    {
      title: 'ERC-20 Token Contract',
      description: 'Create a fungible token following the ERC-20 standard',
      difficulty: 'INTERMEDIATE',
      category: 'DEFI',
      tags: 'erc20,token,defi,fungible,openzeppelin',
      requirements: JSON.stringify([
        'Implement ERC-20 interface',
        'Add minting and burning functions',
        'Implement ownership and access control',
        'Add pausable functionality',
        'Include token metadata'
      ]),
      starterCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyToken is ERC20, Ownable {
    constructor() ERC20("MyToken", "MTK") {
        // TODO: Mint initial supply
    }
    
    // TODO: Add minting function
    
    // TODO: Add burning function
}`,
      testCases: JSON.stringify([
        {
          name: 'Should have correct name and symbol',
          type: 'metadata',
          expected: { name: 'MyToken', symbol: 'MTK' }
        },
        {
          name: 'Should mint tokens correctly',
          type: 'mint',
          amount: '1000000000000000000000',
          recipient: 'owner'
        }
      ]),
      estimatedHours: 6,
      xpReward: 500,
      isPublished: true
    },
    {
      title: 'NFT Collection',
      description: 'Build an ERC-721 NFT collection with metadata and minting',
      difficulty: 'ADVANCED',
      category: 'NFT',
      tags: 'nft,erc721,metadata,minting,collection',
      requirements: JSON.stringify([
        'Implement ERC-721 standard',
        'Add metadata URI functionality',
        'Create public and whitelist minting',
        'Implement royalties (ERC-2981)',
        'Add reveal mechanism'
      ]),
      starterCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyNFTCollection is ERC721, ERC721Enumerable, Ownable {
    constructor() ERC721("MyNFTCollection", "MNC") {
        // TODO: Initialize collection
    }
    
    // TODO: Add minting functions
    
    // TODO: Add metadata functions
}`,
      testCases: JSON.stringify([
        {
          name: 'Should mint NFT with correct tokenId',
          type: 'mint',
          expectedTokenId: 1
        },
        {
          name: 'Should return correct metadata URI',
          type: 'metadata',
          tokenId: 1,
          expectedPrefix: 'ipfs://'
        }
      ]),
      estimatedHours: 8,
      xpReward: 750,
      isPublished: true
    },
    {
      title: 'Decentralized Voting System',
      description: 'Create a secure voting contract with proposals and delegation',
      difficulty: 'ADVANCED',
      category: 'DAO',
      tags: 'dao,voting,governance,delegation,proposals',
      requirements: JSON.stringify([
        'Create proposal system',
        'Implement voting with weight',
        'Add vote delegation',
        'Include time-based voting periods',
        'Prevent double voting'
      ]),
      starterCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Voting {
    struct Proposal {
        string description;
        uint256 voteCount;
        uint256 deadline;
    }
    
    // TODO: Add state variables
    
    // TODO: Add proposal creation
    
    // TODO: Add voting mechanism
    
    // TODO: Add delegation
}`,
      testCases: JSON.stringify([
        {
          name: 'Should create proposal',
          type: 'proposal',
          description: 'Increase funding',
          duration: 86400
        },
        {
          name: 'Should count votes correctly',
          type: 'voting',
          proposalId: 0,
          expectedCount: 1
        }
      ]),
      estimatedHours: 10,
      xpReward: 1000,
      isPublished: true
    }
  ];

  await prisma.project.createMany({
    data: exampleProjects as any
  });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, projectId, title, description, code, githubUrl, deploymentUrl } = body;

    switch (action) {
      case 'start_project':
        if (!projectId) {
          return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
        }

        // Check if project exists
        const project = await prisma.project.findUnique({
          where: { id: projectId }
        });

        if (!project) {
          return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        // Create or update submission
        const submission = await prisma.projectSubmission.upsert({
          where: {
            projectId_userId: {
              projectId,
              userId: session.user.id
            }
          },
          update: {
            status: 'IN_PROGRESS',
            updatedAt: new Date()
          },
          create: {
            projectId,
            userId: session.user.id,
            title: project.title,
            description: project.description,
            code: project.starterCode || '',
            status: 'IN_PROGRESS'
          }
        });

        return NextResponse.json({ 
          success: true,
          submissionId: submission.id,
          message: 'Project started successfully' 
        });

      case 'submit_project':
        if (!projectId || !code) {
          return NextResponse.json({ error: 'Project ID and code required' }, { status: 400 });
        }

        // Get existing submission
        const existingSubmission = await prisma.projectSubmission.findUnique({
          where: {
            projectId_userId: {
              projectId,
              userId: session.user.id
            }
          }
        });

        if (!existingSubmission) {
          return NextResponse.json({ error: 'Please start the project first' }, { status: 400 });
        }

        // Update submission
        const updatedSubmission = await prisma.projectSubmission.update({
          where: { id: existingSubmission.id },
          data: {
            title: title || existingSubmission.title,
            description: description || existingSubmission.description,
            code,
            githubUrl,
            deploymentUrl,
            status: 'SUBMITTED',
            submittedAt: new Date()
          }
        });

        // Award XP for submission
        const projectData = await prisma.project.findUnique({
          where: { id: projectId }
        });
        
        if (projectData) {
          await prisma.userProfile.upsert({
            where: { userId: session.user.id },
            update: {
              totalXP: {
                increment: projectData.xpReward
              }
            },
            create: {
              userId: session.user.id,
              totalXP: projectData.xpReward
            }
          });
        }

        return NextResponse.json({ 
          success: true,
          submissionId: updatedSubmission.id,
          xpAwarded: projectData?.xpReward || 0,
          message: 'Project submitted successfully' 
        });

      case 'save_progress':
        if (!projectId || !code) {
          return NextResponse.json({ error: 'Project ID and code required' }, { status: 400 });
        }

        // Update submission with latest code
        const savedSubmission = await prisma.projectSubmission.update({
          where: {
            projectId_userId: {
              projectId,
              userId: session.user.id
            }
          },
          data: {
            code,
            title: title || undefined,
            description: description || undefined,
            githubUrl: githubUrl || undefined,
            deploymentUrl: deploymentUrl || undefined,
            updatedAt: new Date()
          }
        });

        return NextResponse.json({ 
          success: true,
          submissionId: savedSubmission.id,
          message: 'Progress saved successfully' 
        });

      case 'request_review':
        if (!projectId) {
          return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
        }

        // Update submission status to under review
        const reviewSubmission = await prisma.projectSubmission.update({
          where: {
            projectId_userId: {
              projectId,
              userId: session.user.id
            }
          },
          data: {
            status: 'UNDER_REVIEW'
          }
        });

        return NextResponse.json({ 
          success: true,
          submissionId: reviewSubmission.id,
          message: 'Project submitted for review' 
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    logger.error('Error processing project action', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      operation: 'post-project-action'
    }, error instanceof Error ? error : undefined);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}