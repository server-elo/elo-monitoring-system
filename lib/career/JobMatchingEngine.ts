/**
 * AI Job Matching Engine
 * Intelligent job matching system analyzing code quality, security scores, 
 * gas optimization skills, and project portfolios
 */

import { adaptiveLearningEngine } from '@/lib/learning/AdaptiveLearningEngine';
;

export interface JobListing {
  id: string;
  title: string;
  company: string;
  description: string;
  requirements: JobRequirement[];
  skillsRequired: SkillRequirement[];
  experienceLevel: 'entry' | 'mid' | 'senior' | 'lead';
  salaryRange: { min: number; max: number; currency: string };
  location: string;
  remote: boolean;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  category: 'defi' | 'nft' | 'infrastructure' | 'security' | 'tooling' | 'research';
  postedDate: Date;
  applicationDeadline?: Date;
  benefits: string[];
  companyInfo: CompanyInfo;
}

export interface JobRequirement {
  type: 'skill' | 'experience' | 'education' | 'certification';
  description: string;
  required: boolean;
  weight: number; // 0-100 importance
}

export interface SkillRequirement {
  skill: string;
  level: number; // 0-100 required proficiency
  weight: number; // 0-100 importance
  category: 'technical' | 'soft' | 'domain';
}

export interface CompanyInfo {
  name: string;
  size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  industry: string;
  description: string;
  website: string;
  culture: string[];
  techStack: string[];
  fundingStage?: string;
}

export interface JobMatch {
  jobId: string;
  userId: string;
  matchScore: number; // 0-100
  skillAlignment: SkillAlignment[];
  strengthsMatch: string[];
  skillGaps: SkillGap[];
  recommendations: string[];
  applicationReadiness: number; // 0-100
  estimatedInterviewSuccess: number; // 0-100
  careerGrowthPotential: number; // 0-100
  salaryFit: 'below' | 'within' | 'above';
  cultureFit: number; // 0-100
  matchReasons: string[];
  improvementPlan: ImprovementPlan;
}

export interface SkillAlignment {
  skill: string;
  required: number;
  current: number;
  gap: number;
  importance: number;
  evidence: string[];
}

export interface SkillGap {
  skill: string;
  currentLevel: number;
  requiredLevel: number;
  gap: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timeToClose: number; // estimated weeks
  learningResources: string[];
  projects: string[];
}

export interface ImprovementPlan {
  timeframe: number; // weeks
  focusAreas: string[];
  recommendedProjects: string[];
  skillDevelopment: SkillDevelopmentPlan[];
  certifications: string[];
  networking: string[];
}

export interface SkillDevelopmentPlan {
  skill: string;
  currentLevel: number;
  targetLevel: number;
  estimatedTime: number; // weeks
  learningPath: string[];
  practiceProjects: string[];
  milestones: string[];
}

export class JobMatchingEngine {
  private jobListings: Map<string, JobListing> = new Map();
  private userMatches: Map<string, JobMatch[]> = new Map();

  constructor() {
    this.initializeJobListings();
  }

  async findMatches(userId: string, preferences?: JobPreferences): Promise<JobMatch[]> {
    console.log(`🎯 Finding job matches for user ${userId}`);
    
    try {
      // Get user's comprehensive profile
      const profile = await adaptiveLearningEngine.analyzeUserPerformance(userId);
      const portfolio = await this.getUserPortfolio(userId);
      const skillAssessment = await this.getSkillAssessment(userId);
      
      // Get relevant job listings
      const relevantJobs = this.filterJobsByPreferences(preferences);
      
      // Calculate matches for each job
      const matches: JobMatch[] = [];
      
      for (const job of relevantJobs) {
        const match = await this.calculateJobMatch(
          userId,
          job,
          profile,
          portfolio,
          skillAssessment
        );
        
        if (match.matchScore >= 30) { // Minimum threshold
          matches.push(match);
        }
      }
      
      // Sort by match score and relevance
      const sortedMatches = matches.sort((a, b) => b.matchScore - a.matchScore);
      
      // Cache results
      this.userMatches.set(userId, sortedMatches);
      
      console.log(`✅ Found ${sortedMatches.length} job matches`);
      return sortedMatches.slice(0, 20); // Top 20 matches
      
    } catch (error) {
      console.error('Job matching failed:', error);
      throw error;
    }
  }

  async generateCareerRecommendations(userId: string): Promise<CareerRecommendation[]> {
    const profile = await adaptiveLearningEngine.analyzeUserPerformance(userId);
    const matches = await this.findMatches(userId);
    
    const recommendations: CareerRecommendation[] = [];
    
    // Analyze career progression opportunities
    const currentLevel = this.assessCurrentLevel(profile);
    const growthAreas = this.identifyGrowthAreas(matches);
    
    // Generate specific recommendations
    for (const area of growthAreas) {
      const recommendation = await this.generateAreaRecommendation(userId, area, currentLevel);
      recommendations.push(recommendation);
    }
    
    return recommendations;
  }

  async trackApplicationSuccess(
    userId: string,
    jobId: string,
    outcome: 'applied' | 'interview' | 'offer' | 'hired' | 'rejected'
  ): Promise<void> {
    // Track application outcomes to improve matching algorithm
    const match = await this.getJobMatch(userId, jobId);
    if (match) {
      await this.updateMatchingAlgorithm(match, outcome);
    }
  }

  private async calculateJobMatch(
    userId: string,
    job: JobListing,
    profile: any,
    portfolio: any,
    skillAssessment: any
  ): Promise<JobMatch> {
    // Calculate skill alignment
    const skillAlignment = this.calculateSkillAlignment(job.skillsRequired, skillAssessment);
    
    // Identify skill gaps
    const skillGaps = this.identifySkillGaps(job.skillsRequired, skillAssessment);
    
    // Calculate various match components
    const skillScore = this.calculateSkillScore(skillAlignment);
    const experienceScore = this.calculateExperienceScore(job, portfolio);
    const projectScore = this.calculateProjectScore(job, portfolio);
    const cultureScore = this.calculateCultureScore(job, profile);
    
    // Overall match score (weighted average)
    const matchScore = Math.round(
      skillScore * 0.4 +
      experienceScore * 0.25 +
      projectScore * 0.25 +
      cultureScore * 0.1
    );
    
    // Generate improvement plan
    const improvementPlan = await this.generateImprovementPlan(skillGaps, job);
    
    return {
      jobId: job.id,
      userId,
      matchScore,
      skillAlignment,
      strengthsMatch: this.identifyStrengths(skillAlignment),
      skillGaps,
      recommendations: await this.generateRecommendations(userId, job, skillGaps),
      applicationReadiness: this.calculateApplicationReadiness(skillGaps, portfolio),
      estimatedInterviewSuccess: this.estimateInterviewSuccess(skillAlignment, portfolio),
      careerGrowthPotential: this.calculateGrowthPotential(job, profile),
      salaryFit: this.assessSalaryFit(job.salaryRange, profile),
      cultureFit: cultureScore,
      matchReasons: this.generateMatchReasons(skillAlignment, job),
      improvementPlan
    };
  }

  private calculateSkillAlignment(
    required: SkillRequirement[],
    current: any
  ): SkillAlignment[] {
    return required.map(req => {
      const currentLevel = current.skills[req.skill] || 0;
      const gap = Math.max(0, req.level - currentLevel);
      
      return {
        skill: req.skill,
        required: req.level,
        current: currentLevel,
        gap,
        importance: req.weight,
        evidence: this.getSkillEvidence(req.skill, current)
      };
    });
  }

  private identifySkillGaps(
    required: SkillRequirement[],
    current: any
  ): SkillGap[] {
    return required
      .filter(req => (current.skills[req.skill] || 0) < req.level)
      .map(req => {
        const currentLevel = current.skills[req.skill] || 0;
        const gap = req.level - currentLevel;
        
        return {
          skill: req.skill,
          currentLevel,
          requiredLevel: req.level,
          gap,
          priority: this.calculateGapPriority(gap, req.weight),
          timeToClose: this.estimateTimeToClose(gap),
          learningResources: this.getLearningResources(req.skill),
          projects: this.getRelevantProjects(req.skill)
        };
      });
  }

  private async generateImprovementPlan(
    skillGaps: SkillGap[],
    job: JobListing
  ): Promise<ImprovementPlan> {
    const criticalGaps = skillGaps.filter(gap => gap.priority === 'critical' || gap.priority === 'high');
    const totalTime = criticalGaps.reduce((sum, gap) => sum + gap.timeToClose, 0);
    
    return {
      timeframe: Math.max(4, totalTime), // Minimum 4 weeks
      focusAreas: criticalGaps.map(gap => gap.skill),
      recommendedProjects: this.getProjectsForSkills(criticalGaps.map(g => g.skill)),
      skillDevelopment: criticalGaps.map(gap => ({
        skill: gap.skill,
        currentLevel: gap.currentLevel,
        targetLevel: gap.requiredLevel,
        estimatedTime: gap.timeToClose,
        learningPath: gap.learningResources,
        practiceProjects: gap.projects,
        milestones: this.generateMilestones(gap)
      })),
      certifications: this.getRelevantCertifications(job.category),
      networking: this.getNetworkingOpportunities(job.company)
    };
  }

  private initializeJobListings(): void {
    // Sample job listings for demonstration
    const sampleJobs: JobListing[] = [
      {
        id: 'job-1',
        title: 'Senior Solidity Developer',
        company: 'DeFi Protocol Inc',
        description: 'Build next-generation DeFi protocols',
        requirements: [
          { type: 'experience', description: '3+ years Solidity development', required: true, weight: 80 },
          { type: 'skill', description: 'Smart contract security expertise', required: true, weight: 90 }
        ],
        skillsRequired: [
          { skill: 'solidity', level: 85, weight: 90, category: 'technical' },
          { skill: 'defi', level: 80, weight: 85, category: 'domain' },
          { skill: 'security', level: 75, weight: 80, category: 'technical' }
        ],
        experienceLevel: 'senior',
        salaryRange: { min: 120000, max: 180000, currency: 'USD' },
        location: 'Remote',
        remote: true,
        type: 'full-time',
        category: 'defi',
        postedDate: new Date(),
        benefits: ['Health insurance', 'Token allocation', 'Remote work'],
        companyInfo: {
          name: 'DeFi Protocol Inc',
          size: 'medium',
          industry: 'DeFi',
          description: 'Leading DeFi protocol with $1B+ TVL',
          website: 'https://defiprotocol.com',
          culture: ['Innovation', 'Decentralization', 'Transparency'],
          techStack: ['Solidity', 'Hardhat', 'React', 'Node.js']
        }
      }
    ];

    sampleJobs.forEach(job => this.jobListings.set(job.id, job));
  }

  private calculateGapPriority(gap: number, weight: number): 'low' | 'medium' | 'high' | 'critical' {
    const score = gap * weight / 100;
    if (score > 60) return 'critical';
    if (score > 40) return 'high';
    if (score > 20) return 'medium';
    return 'low';
  }

  private estimateTimeToClose(gap: number): number {
    // Estimate weeks needed to close skill gap
    return Math.ceil(gap / 10) * 2; // 2 weeks per 10 skill points
  }

  // Get user portfolio
  private async getUserPortfolio(userId: string): Promise<any> {
    // In production, fetch from database
    return {
      projects: [],
      githubProfile: null,
      deployedContracts: [],
      contributions: []
    };
  }

  // Get skill assessment
  private async getSkillAssessment(userId: string): Promise<any> {
    const profile = await adaptiveLearningEngine.analyzeUserPerformance(userId);
    return {
      solidityLevel: profile.skillLevels.solidity || 0,
      web3Level: profile.skillLevels.web3 || 0,
      securityLevel: profile.skillLevels.security || 0,
      gasOptimizationLevel: profile.skillLevels.gasOptimization || 0,
      overallScore: Object.values(profile.skillLevels).reduce((a, b) => a + b, 0) / Object.keys(profile.skillLevels).length
    };
  }

  // Filter jobs by preferences
  private filterJobsByPreferences(preferences: JobPreferences): BlockchainJob[] {
    let jobs = Array.from(this.jobListings.values());
    
    if (preferences.location) {
      jobs = jobs.filter(job => job.location === preferences.location || job.remote);
    }
    
    if (preferences.remote !== undefined) {
      jobs = jobs.filter(job => job.remote === preferences.remote);
    }
    
    if (preferences.minSalary) {
      jobs = jobs.filter(job => job.salaryMax >= preferences.minSalary!);
    }
    
    if (preferences.companySize) {
      jobs = jobs.filter(job => job.companySize === preferences.companySize);
    }
    
    if (preferences.industries?.length) {
      jobs = jobs.filter(job => preferences.industries!.includes(job.industry));
    }
    
    return jobs;
  }

  // Calculate skill score
  private calculateSkillScore(requiredSkills: string[], userSkills: Record<string, number>): number {
    if (requiredSkills.length === 0) return 100;
    
    const scores = requiredSkills.map(skill => {
      const userLevel = userSkills[skill.toLowerCase()] || 0;
      return Math.min(100, userLevel);
    });
    
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }

  // Calculate experience score
  private calculateExperienceScore(requiredYears: number, userProfile: any): number {
    // Simulate user experience calculation
    const userYears = userProfile.experienceYears || 0;
    
    if (userYears >= requiredYears) return 100;
    if (userYears >= requiredYears * 0.8) return 80;
    if (userYears >= requiredYears * 0.6) return 60;
    if (userYears >= requiredYears * 0.4) return 40;
    return 20;
  }

  // Calculate project score
  private calculateProjectScore(job: BlockchainJob, portfolio: any): number {
    const relevantProjects = portfolio.projects?.filter((p: any) => 
      job.requiredSkills.some(skill => p.technologies?.includes(skill))
    ) || [];
    
    return Math.min(100, relevantProjects.length * 20);
  }

  // Calculate culture score
  private calculateCultureScore(companyValues: string[], userProfile: any): number {
    // Simple culture fit calculation
    const userValues = userProfile.values || [];
    const matches = companyValues.filter(value => userValues.includes(value));
    
    return Math.round((matches.length / companyValues.length) * 100);
  }

  // Assess salary fit
  private assessSalaryFit(job: BlockchainJob, preferences: JobPreferences): SalaryFit {
    const midpoint = (job.salaryMin + job.salaryMax) / 2;
    const userExpectation = preferences.minSalary || midpoint;
    
    let fit: 'below' | 'within' | 'above' = 'within';
    if (userExpectation > job.salaryMax) fit = 'below';
    else if (userExpectation < job.salaryMin) fit = 'above';
    
    return {
      fit,
      salaryRange: `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}`,
      percentMatch: Math.min(100, Math.max(0, 100 - Math.abs(midpoint - userExpectation) / midpoint * 100))
    };
  }

  // Calculate growth potential
  private calculateGrowthPotential(job: BlockchainJob, userProfile: any): number {
    let score = 50; // Base score
    
    // Higher potential for roles slightly above current level
    if (job.seniorityLevel === 'mid' && userProfile.level === 'junior') score += 30;
    if (job.seniorityLevel === 'senior' && userProfile.level === 'mid') score += 30;
    
    // Consider company size and industry
    if (job.companySize === 'startup') score += 20;
    
    return Math.min(100, score);
  }

  // Calculate application readiness
  private calculateApplicationReadiness(match: JobMatch, portfolio: any): ApplicationReadiness {
    const isReady = match.matchScore >= 60 && portfolio.projects?.length > 0;
    const missingRequirements: string[] = [];
    
    if (match.matchScore < 60) {
      missingRequirements.push('Improve skill match');
    }
    if (!portfolio.projects?.length) {
      missingRequirements.push('Add portfolio projects');
    }
    
    return {
      isReady,
      missingRequirements,
      recommendedActions: missingRequirements.map(req => `Action: ${req}`),
      estimatedPrepTime: missingRequirements.length * 7 // days
    };
  }

  // Generate match reasons
  private generateMatchReasons(job: BlockchainJob, scores: any): string[] {
    const reasons: string[] = [];
    
    if (scores.skillScore >= 80) {
      reasons.push('Strong skill alignment with job requirements');
    }
    if (scores.projectScore >= 60) {
      reasons.push('Relevant project experience');
    }
    if (scores.cultureScore >= 70) {
      reasons.push('Good culture fit with company values');
    }
    
    return reasons;
  }

  // Identify strengths
  private identifyStrengths(scores: any): string[] {
    const strengths: string[] = [];
    
    if (scores.skillScore >= 80) strengths.push('Technical skills');
    if (scores.experienceScore >= 80) strengths.push('Industry experience');
    if (scores.projectScore >= 80) strengths.push('Project portfolio');
    if (scores.cultureScore >= 80) strengths.push('Culture alignment');
    
    return strengths;
  }

  // Identify growth areas
  private identifyGrowthAreas(job: BlockchainJob, userSkills: Record<string, number>): string[] {
    const areas: string[] = [];
    
    job.requiredSkills.forEach(skill => {
      const userLevel = userSkills[skill.toLowerCase()] || 0;
      if (userLevel < 60) {
        areas.push(skill);
      }
    });
    
    return areas;
  }

  // Get skill evidence
  private getSkillEvidence(skill: string, portfolio: any): any[] {
    const evidence = [];
    
    // Find projects using this skill
    const projects = portfolio.projects?.filter((p: any) => 
      p.technologies?.includes(skill)
    ) || [];
    
    evidence.push(...projects.map((p: any) => ({
      type: 'project',
      title: p.name,
      description: p.description
    })));
    
    return evidence;
  }

  // Get relevant projects
  private getRelevantProjects(requiredSkills: string[], portfolio: any): any[] {
    return portfolio.projects?.filter((project: any) => 
      requiredSkills.some(skill => 
        project.technologies?.includes(skill)
      )
    ) || [];
  }

  // Get relevant certifications
  private getRelevantCertifications(job: BlockchainJob): any[] {
    // Map job requirements to relevant certifications
    const certMap: Record<string, string[]> = {
      'solidity': ['Certified Solidity Developer', 'ConsenSys Academy'],
      'security': ['Smart Contract Auditor', 'Security+ Certification'],
      'web3': ['Web3 Developer Certification', 'Ethereum Developer']
    };
    
    const certs: string[] = [];
    job.requiredSkills.forEach(skill => {
      const skillCerts = certMap[skill.toLowerCase()];
      if (skillCerts) {
        certs.push(...skillCerts);
      }
    });
    
    return [...new Set(certs)].map(cert => ({
      name: cert,
      relevance: 'high',
      provider: 'Various'
    }));
  }

  // Get projects for skills
  private getProjectsForSkills(skills: string[]): any[] {
    const projectIdeas = {
      'solidity': ['Build a DeFi protocol', 'Create an NFT marketplace'],
      'security': ['Audit a smart contract', 'Build a security scanner'],
      'web3': ['Create a dApp frontend', 'Build a web3 wallet']
    };
    
    const projects: any[] = [];
    skills.forEach(skill => {
      const ideas = projectIdeas[skill.toLowerCase()] || [];
      ideas.forEach(idea => {
        projects.push({
          title: idea,
          skill: skill,
          difficulty: 'intermediate',
          estimatedTime: '2-4 weeks'
        });
      });
    });
    
    return projects;
  }

  // Get learning resources
  private getLearningResources(skills: string[]): any[] {
    const resources: any[] = [];
    
    skills.forEach(skill => {
      resources.push({
        skill,
        type: 'course',
        title: `Master ${skill}`,
        provider: 'Learning Platform',
        duration: '4 weeks'
      });
    });
    
    return resources;
  }

  // Get networking opportunities
  private getNetworkingOpportunities(industry: string): any[] {
    return [
      {
        type: 'conference',
        name: `${industry} Summit 2024`,
        relevance: 'high'
      },
      {
        type: 'meetup',
        name: `Local ${industry} Developers`,
        relevance: 'medium'
      },
      {
        type: 'online',
        name: `${industry} Discord Community`,
        relevance: 'high'
      }
    ];
  }

  // Generate milestones
  private generateMilestones(currentLevel: string, targetLevel: string): any[] {
    const milestones = [];
    
    if (currentLevel === 'junior' && targetLevel === 'mid') {
      milestones.push(
        { week: 2, goal: 'Complete advanced Solidity course' },
        { week: 4, goal: 'Build first DeFi project' },
        { week: 6, goal: 'Contribute to open source' },
        { week: 8, goal: 'Deploy to mainnet' }
      );
    }
    
    return milestones;
  }

  // Assess current level
  private assessCurrentLevel(profile: any): string {
    const avgSkill = Object.values(profile.skillLevels).reduce((a: number, b: number) => a + b, 0) / 
                     Object.keys(profile.skillLevels).length;
    
    if (avgSkill < 30) return 'junior';
    if (avgSkill < 70) return 'mid';
    return 'senior';
  }

  // Estimate interview success
  private estimateInterviewSuccess(match: JobMatch, preparation: any): number {
    let successRate = match.matchScore;
    
    // Adjust based on preparation
    if (preparation.mockInterviews > 3) successRate += 10;
    if (preparation.companyResearch) successRate += 5;
    if (preparation.technicalPractice) successRate += 10;
    
    return Math.min(100, successRate);
  }

  // Update matching algorithm
  private async updateMatchingAlgorithm(userId: string, feedback: any): Promise<void> {
    // Store feedback for algorithm improvement
    const userFeedback = this.userFeedback.get(userId) || [];
    userFeedback.push({
      timestamp: new Date(),
      feedback,
      outcome: feedback.hired ? 'success' : 'continue'
    });
    
    this.userFeedback.set(userId, userFeedback);
    console.log(`📊 Updated matching algorithm with user feedback`);
  }

  // Get job match by ID
  private async getJobMatch(userId: string, jobId: string): Promise<JobMatch | null> {
    const job = this.jobListings.get(jobId);
    if (!job) return null;
    
    const profile = await adaptiveLearningEngine.analyzeUserPerformance(userId);
    const portfolio = await this.getUserPortfolio(userId);
    const skillAssessment = await this.getSkillAssessment(userId);
    
    return this.calculateJobMatch(userId, job, profile, portfolio, skillAssessment);
  }
}

interface JobPreferences {
  location?: string;
  remote?: boolean;
  salaryMin?: number;
  minSalary?: number;
  experienceLevel?: string[];
  categories?: string[];
  companySize?: string;
  industries?: string[];
}

interface CareerRecommendation {
  type: 'skill' | 'project' | 'certification' | 'networking';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  timeframe: string;
  resources: string[];
}

interface SalaryFit {
  fit: 'below' | 'within' | 'above';
  salaryRange: string;
  percentMatch: number;
}

interface ApplicationReadiness {
  isReady: boolean;
  missingRequirements: string[];
  recommendedActions: string[];
  estimatedPrepTime: number;
}

export const jobMatchingEngine = new JobMatchingEngine();
