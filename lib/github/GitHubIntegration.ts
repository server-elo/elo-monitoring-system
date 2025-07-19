/**
 * GitHub Integration & Portfolio System
 * 
 * Build seamless GitHub integration for version control learning and automated
 * portfolio generation with our performance metrics.
 */

// import { Octokit } from '@octokit/rest'; // TODO: Install @octokit/rest package
type Octokit = any; // Temporary type until package is installed
import { adaptiveLearningEngine } from '@/lib/learning/AdaptiveLearningEngine';
import { SecurityScanner } from '@/lib/security/SecurityScanner';
import { GasOptimizationAnalyzer } from '@/lib/gas/GasOptimizationAnalyzer';

export interface GitHubRepository {
  id: string;
  name: string;
  fullName: string;
  description?: string;
  url: string;
  isPrivate: boolean;
  language: string;
  createdAt: Date;
  updatedAt: Date;
  stars: number;
  forks: number;
  size: number;
  defaultBranch: string;
  topics: string[];
  hasIssues: boolean;
  hasWiki: boolean;
  hasPages: boolean;
}

export interface GitHubCommit {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: Date;
  };
  url: string;
  additions: number;
  deletions: number;
  changedFiles: string[];
  stats: {
    total: number;
    additions: number;
    deletions: number;
  };
}

export interface CodeQualityMetrics {
  securityScore: number;
  gasOptimizationScore: number;
  codeStyleScore: number;
  testCoverage: number;
  documentation: number;
  complexity: number;
  maintainability: number;
  overall: number;
  timestamp: Date;
  commitSha: string;
}

export interface ProfessionalPortfolio {
  id: string;
  userId: string;
  githubUsername: string;
  profileSummary: string;
  skillsAssessment: SkillsAssessment;
  featuredProjects: ProjectShowcase[];
  contributionHistory: ContributionMetrics;
  certifications: Certification[];
  performanceMetrics: PerformanceHistory;
  recommendations: string[];
  lastUpdated: Date;
  visibility: 'public' | 'private' | 'employers-only';
  customizations: PortfolioCustomization;
}

export interface ProjectShowcase {
  id: string;
  name: string;
  description: string;
  repositoryUrl: string;
  liveUrl?: string;
  technologies: string[];
  category: 'defi' | 'nft' | 'dao' | 'infrastructure' | 'tools' | 'educational';
  complexity: 'beginner' | 'intermediate' | 'advanced';
  highlights: string[];
  codeQuality: CodeQualityMetrics;
  gasOptimizations: GasOptimizationHighlight[];
  securityFeatures: SecurityFeature[];
  learningOutcomes: string[];
  timeInvested: number; // hours
  collaborators?: string[];
  awards?: string[];
}

export interface SkillsAssessment {
  solidityProficiency: number; // 0-100
  securityAwareness: number;
  gasOptimization: number;
  testingSkills: number;
  architectureDesign: number;
  defiKnowledge: number;
  toolingFamiliarity: number;
  versionControl: number;
  documentation: number;
  collaboration: number;
  overallRating: number;
  verifiedSkills: string[];
  endorsements: Endorsement[];
}

export interface ContributionMetrics {
  totalCommits: number;
  totalRepositories: number;
  linesOfCode: number;
  languagesUsed: string[];
  contributionStreak: number;
  weeklyActivity: number[];
  monthlyActivity: number[];
  yearlyActivity: number[];
  peakProductivity: {
    day: string;
    commits: number;
  };
  collaborationScore: number;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  description: string;
  skillsVerified: string[];
  dateEarned: Date;
  expiryDate?: Date;
  credentialUrl?: string;
  blockchainVerified: boolean;
  verificationHash?: string;
}

export interface PerformanceHistory {
  securityScores: TimeSeriesData[];
  gasOptimizationScores: TimeSeriesData[];
  codeQualityTrends: TimeSeriesData[];
  learningVelocity: TimeSeriesData[];
  conceptMastery: ConceptMasteryData[];
  milestones: Milestone[];
  achievements: Achievement[];
}

export interface TimeSeriesData {
  timestamp: Date;
  value: number;
  context?: string;
}

export interface ConceptMasteryData {
  concept: string;
  masteryLevel: number;
  dateAchieved: Date;
  projectsApplied: string[];
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  dateAchieved: Date;
  category: 'learning' | 'project' | 'collaboration' | 'recognition';
  evidence: string[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  dateEarned: Date;
  criteria: string;
  progress?: number; // 0-100 for partially completed achievements
}

export interface PortfolioCustomization {
  theme: 'professional' | 'creative' | 'minimal' | 'technical';
  primaryColor: string;
  layout: 'grid' | 'list' | 'timeline';
  sections: PortfolioSection[];
  socialLinks: SocialLink[];
  contactPreferences: ContactPreference[];
}

export interface PortfolioSection {
  id: string;
  name: string;
  type: 'projects' | 'skills' | 'experience' | 'education' | 'certifications' | 'custom';
  visible: boolean;
  order: number;
  customContent?: string;
}

export interface SocialLink {
  platform: string;
  url: string;
  verified: boolean;
}

export interface ContactPreference {
  method: 'email' | 'linkedin' | 'github' | 'discord' | 'telegram';
  value: string;
  preferred: boolean;
  public: boolean;
}

export class GitHubIntegration {
  private octokit: Octokit;
  private _securityScanner: SecurityScanner;
  private gasAnalyzer: GasOptimizationAnalyzer;
  private portfolioCache: Map<string, ProfessionalPortfolio> = new Map();

  constructor(
    githubToken: string,
    securityScanner: SecurityScanner,
    gasAnalyzer: GasOptimizationAnalyzer
  ) {
    this.octokit = new Octokit({ auth: githubToken });
    this._securityScanner = securityScanner;
    this.gasAnalyzer = gasAnalyzer;
  }

  // Connect user's GitHub account
  async connectGitHubAccount(
    userId: string,
    githubToken: string,
    githubUsername: string
  ): Promise<void> {
    console.log(`🔗 Connecting GitHub account for user ${userId}: ${githubUsername}`);
    
    try {
      // Verify GitHub token and get user info
      const { data: githubUser } = await this.octokit.rest.users.getByUsername({
        username: githubUsername
      });
      
      // Store GitHub connection in database
      await this.storeGitHubConnection(userId, githubToken, githubUser);
      
      // Initialize portfolio generation
      await this.initializePortfolio(userId, githubUsername);
      
      console.log(`✅ GitHub account connected successfully`);
    } catch (error) {
      console.error('GitHub connection failed:', error);
      throw error;
    }
  }

  // Analyze repository for code quality
  async analyzeRepository(
    userId: string,
    repositoryUrl: string
  ): Promise<CodeQualityMetrics> {
    console.log(`🔍 Analyzing repository: ${repositoryUrl}`);
    
    try {
      // Extract owner and repo from URL
      const { owner, repo } = this.parseRepositoryUrl(repositoryUrl);
      
      // Get repository contents
      const contents = await this.getRepositoryContents(owner, repo);
      
      // Analyze Solidity files
      const solidityFiles = contents.filter(file => file.name.endsWith('.sol'));
      const analysisResults = [];
      
      for (const file of solidityFiles) {
        const fileContent = await this.getFileContent(owner, repo, file.path);
        
        // Run security and gas analysis
        const [securityResult, gasResult] = await Promise.all([
          this.analyzeFileSecurity(fileContent, userId),
          this.analyzeFileGas(fileContent, userId)
        ]);
        
        analysisResults.push({
          file: file.path,
          security: securityResult,
          gas: gasResult
        });
      }
      
      // Calculate overall metrics
      const metrics = this.calculateOverallMetrics(analysisResults);
      
      console.log(`✅ Repository analysis completed`);
      return metrics;
      
    } catch (error) {
      console.error('Repository analysis failed:', error);
      throw error;
    }
  }

  // Generate professional portfolio
  async generatePortfolio(
    userId: string,
    githubUsername: string,
    customizations?: Partial<PortfolioCustomization>
  ): Promise<ProfessionalPortfolio> {
    console.log(`📊 Generating portfolio for ${githubUsername}`);
    
    try {
      // Get user's learning profile
      const learningProfile = await adaptiveLearningEngine.analyzeUserPerformance(userId);
      
      // Get GitHub data
      const repositories = await this.getUserRepositories(githubUsername);
      const contributionMetrics = await this.getContributionMetrics(githubUsername);
      
      // Analyze featured projects
      const featuredProjects = await this.selectAndAnalyzeFeaturedProjects(
        userId,
        repositories
      );
      
      // Calculate skills assessment
      const skillsAssessment = this.calculateSkillsAssessment(
        learningProfile,
        featuredProjects,
        contributionMetrics
      );
      
      // Get performance history
      const performanceHistory = await this.getPerformanceHistory(userId);
      
      // Get certifications
      const certifications = await this.getUserCertifications(userId);
      
      // Generate recommendations
      const recommendations = await this.generateRecommendations(
        skillsAssessment,
        featuredProjects
      );
      
      const portfolio: ProfessionalPortfolio = {
        id: `portfolio-${userId}`,
        userId,
        githubUsername,
        profileSummary: await this.generateProfileSummary(
          learningProfile,
          skillsAssessment,
          featuredProjects
        ),
        skillsAssessment,
        featuredProjects,
        contributionHistory: contributionMetrics,
        certifications,
        performanceMetrics: performanceHistory,
        recommendations,
        lastUpdated: new Date(),
        visibility: 'public',
        customizations: {
          theme: 'professional',
          primaryColor: '#3B82F6',
          layout: 'grid',
          sections: this.getDefaultSections(),
          socialLinks: [],
          contactPreferences: [],
          ...customizations
        }
      };
      
      // Cache and save portfolio
      this.portfolioCache.set(userId, portfolio);
      await this.savePortfolio(portfolio);
      
      console.log(`✅ Portfolio generated successfully`);
      return portfolio;
      
    } catch (error) {
      console.error('Portfolio generation failed:', error);
      throw error;
    }
  }

  // Track code quality over time
  async trackCodeQualityProgress(
    userId: string,
    repositoryUrl: string,
    commitSha?: string
  ): Promise<void> {
    const metrics = await this.analyzeRepository(userId, repositoryUrl);
    
    // Store metrics with timestamp
    await this.storeQualityMetrics(userId, repositoryUrl, metrics, commitSha);
    
    // Update portfolio if significant improvement
    if (this.isSignificantImprovement(userId, metrics)) {
      await this.updatePortfolio(userId);
    }
  }

  // Generate project showcase
  async generateProjectShowcase(
    userId: string,
    repositoryUrl: string,
    category: ProjectShowcase['category']
  ): Promise<ProjectShowcase> {
    const { owner, repo } = this.parseRepositoryUrl(repositoryUrl);
    
    // Get repository info
    const { data: repoData } = await this.octokit.rest.repos.get({
      owner,
      repo
    });
    
    // Analyze code quality
    const codeQuality = await this.analyzeRepository(userId, repositoryUrl);
    
    // Extract gas optimizations and security features
    const gasOptimizations = await this.extractGasOptimizations(userId, repositoryUrl);
    const securityFeatures = await this.extractSecurityFeatures(userId, repositoryUrl);
    
    // Generate learning outcomes
    const learningOutcomes = await this.generateLearningOutcomes(
      userId,
      repositoryUrl,
      category
    );
    
    return {
      id: `project-${repoData.id}`,
      name: repoData.name,
      description: repoData.description || 'No description provided',
      repositoryUrl,
      technologies: this.extractTechnologies(repoData),
      category,
      complexity: this.determineComplexity(codeQuality),
      highlights: await this.generateProjectHighlights(repositoryUrl, codeQuality),
      codeQuality,
      gasOptimizations,
      securityFeatures,
      learningOutcomes,
      timeInvested: this.estimateTimeInvestment(repoData),
      collaborators: await this.getCollaborators(owner, repo)
    };
  }

  // Private helper methods
  private parseRepositoryUrl(url: string): { owner: string; repo: string } {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) throw new Error('Invalid GitHub repository URL');
    
    return {
      owner: match[1],
      repo: match[2].replace('.git', '')
    };
  }

  private async getUserRepositories(username: string): Promise<GitHubRepository[]> {
    const { data: repos } = await this.octokit.rest.repos.listForUser({
      username,
      type: 'all',
      sort: 'updated',
      per_page: 100
    });
    
    return repos.map(repo => ({
      id: repo.id.toString(),
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      url: repo.html_url,
      isPrivate: repo.private,
      language: repo.language || 'Unknown',
      createdAt: new Date(repo.created_at),
      updatedAt: new Date(repo.updated_at),
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      size: repo.size,
      defaultBranch: repo.default_branch,
      topics: repo.topics || [],
      hasIssues: repo.has_issues,
      hasWiki: repo.has_wiki,
      hasPages: repo.has_pages
    }));
  }

  private async selectAndAnalyzeFeaturedProjects(
    userId: string,
    repositories: GitHubRepository[]
  ): Promise<ProjectShowcase[]> {
    // Select top repositories based on activity, stars, and Solidity content
    const solidityRepos = repositories.filter(repo => 
      repo.language === 'Solidity' || 
      repo.topics.includes('solidity') ||
      repo.topics.includes('ethereum')
    );
    
    const topRepos = solidityRepos
      .sort((a, b) => (b.stars + b.forks) - (a.stars + a.forks))
      .slice(0, 6);
    
    const showcases: ProjectShowcase[] = [];
    
    for (const repo of topRepos) {
      try {
        const showcase = await this.generateProjectShowcase(
          userId,
          repo.url,
          this.categorizeRepository(repo)
        );
        showcases.push(showcase);
      } catch (error) {
        console.warn(`Failed to analyze repository ${repo.name}:`, error);
      }
    }
    
    return showcases;
  }

  private categorizeRepository(repo: GitHubRepository): ProjectShowcase['category'] {
    const name = repo.name.toLowerCase();
    const description = (repo.description || '').toLowerCase();
    const topics = repo.topics.join(' ').toLowerCase();
    
    if (name.includes('defi') || description.includes('defi') || topics.includes('defi')) {
      return 'defi';
    }
    if (name.includes('nft') || description.includes('nft') || topics.includes('nft')) {
      return 'nft';
    }
    if (name.includes('dao') || description.includes('dao') || topics.includes('dao')) {
      return 'dao';
    }
    if (name.includes('tool') || description.includes('tool') || topics.includes('tools')) {
      return 'tools';
    }
    if (name.includes('learn') || description.includes('tutorial') || topics.includes('education')) {
      return 'educational';
    }
    
    return 'infrastructure';
  }

  private calculateSkillsAssessment(
    learningProfile: any,
    projects: ProjectShowcase[],
    contributions: ContributionMetrics
  ): SkillsAssessment {
    // Calculate skills based on learning profile and project analysis
    const avgSecurityScore = projects.reduce((sum, p) => sum + p.codeQuality.securityScore, 0) / projects.length || 0;
    const avgGasScore = projects.reduce((sum, p) => sum + p.codeQuality.gasOptimizationScore, 0) / projects.length || 0;
    
    const skills = {
      solidityProficiency: Math.round(Object.values(learningProfile.skillLevels).reduce((sum: number, level: number) => sum + level, 0) / Object.values(learningProfile.skillLevels).length || 0),
      securityAwareness: Math.round(avgSecurityScore),
      gasOptimization: Math.round(avgGasScore),
      testingSkills: 70, // Would be calculated from test coverage
      architectureDesign: 65, // Would be calculated from project complexity
      defiKnowledge: projects.filter(p => p.category === 'defi').length * 20,
      toolingFamiliarity: 75, // Would be calculated from tool usage
      versionControl: Math.min(100, contributions.totalCommits / 10),
      documentation: 60, // Would be calculated from README quality
      collaboration: Math.min(100, contributions.collaborationScore),
      overallRating: 0, // Calculated below
      verifiedSkills: [],
      endorsements: []
    };
    
    // Calculate overall rating
    const skillValues = Object.values(skills).filter(v => typeof v === 'number' && v !== 0);
    skills.overallRating = Math.round(skillValues.reduce((sum, val) => sum + val, 0) / skillValues.length);
    
    return skills;
  }

  // Missing method implementations
  private async storeGitHubConnection(userId: string, githubToken: string, githubUser: any): Promise<void> {
    // Implementation would store GitHub connection in database
  }

  private async initializePortfolio(userId: string, githubUsername: string): Promise<void> {
    // Implementation would initialize portfolio generation
  }

  private async getRepositoryContents(owner: string, repo: string): Promise<any[]> {
    const { data } = await this.octokit.rest.repos.getContent({
      owner,
      repo,
      path: ''
    });
    
    return Array.isArray(data) ? data : [data];
  }

  private async getFileContent(owner: string, repo: string, path: string): Promise<string> {
    const { data } = await this.octokit.rest.repos.getContent({
      owner,
      repo,
      path
    });
    
    if ('content' in data) {
      return Buffer.from(data.content, 'base64').toString('utf8');
    }
    
    return '';
  }

  private async analyzeFileSecurity(fileContent: string, userId: string): Promise<any> {
    // Mock implementation - would use actual security scanner
    return {
      issues: [],
      score: 85
    };
  }

  private async analyzeFileGas(fileContent: string, userId: string): Promise<any> {
    // Mock implementation - would use actual gas analyzer
    return {
      optimizations: [],
      score: 80
    };
  }

  private calculateOverallMetrics(analysisResults: any[]): CodeQualityMetrics {
    const avgSecurity = analysisResults.reduce((sum, r) => sum + r.security.score, 0) / analysisResults.length || 0;
    const avgGas = analysisResults.reduce((sum, r) => sum + r.gas.score, 0) / analysisResults.length || 0;
    
    return {
      securityScore: avgSecurity,
      gasOptimizationScore: avgGas,
      codeStyleScore: 75,
      testCoverage: 65,
      documentation: 60,
      complexity: 70,
      maintainability: 80,
      overall: Math.round((avgSecurity + avgGas + 75 + 65 + 60 + 70 + 80) / 7),
      timestamp: new Date(),
      commitSha: 'latest'
    };
  }

  private async getContributionMetrics(githubUsername: string): Promise<ContributionMetrics> {
    // Mock implementation - would fetch actual GitHub contribution data
    return {
      totalCommits: 150,
      totalRepositories: 12,
      linesOfCode: 25000,
      languagesUsed: ['Solidity', 'JavaScript', 'TypeScript'],
      contributionStreak: 30,
      weeklyActivity: [10, 15, 8, 12, 20, 18, 5],
      monthlyActivity: [120, 135, 140, 125],
      yearlyActivity: [1500, 1800, 2100, 1950],
      peakProductivity: {
        day: 'Tuesday',
        commits: 25
      },
      collaborationScore: 85
    };
  }

  private async getPerformanceHistory(userId: string): Promise<PerformanceHistory> {
    // Mock implementation - would fetch actual performance data
    return {
      securityScores: [
        { timestamp: new Date(), value: 85 },
        { timestamp: new Date(), value: 88 },
        { timestamp: new Date(), value: 92 }
      ],
      gasOptimizationScores: [
        { timestamp: new Date(), value: 78 },
        { timestamp: new Date(), value: 82 },
        { timestamp: new Date(), value: 85 }
      ],
      codeQualityTrends: [
        { timestamp: new Date(), value: 80 },
        { timestamp: new Date(), value: 83 },
        { timestamp: new Date(), value: 87 }
      ],
      learningVelocity: [
        { timestamp: new Date(), value: 1.0 },
        { timestamp: new Date(), value: 1.2 },
        { timestamp: new Date(), value: 1.5 }
      ],
      conceptMastery: [
        { concept: 'ERC20', masteryLevel: 85, dateAchieved: new Date(), projectsApplied: ['token-project'] },
        { concept: 'Security', masteryLevel: 78, dateAchieved: new Date(), projectsApplied: ['secure-vault'] }
      ],
      milestones: [
        {
          id: 'milestone-1',
          name: 'First Smart Contract',
          description: 'Deployed first smart contract',
          dateAchieved: new Date(),
          category: 'learning',
          evidence: ['contract-address']
        }
      ],
      achievements: [
        {
          id: 'achievement-1',
          title: 'Security Expert',
          description: 'Achieved high security scores consistently',
          icon: '🛡️',
          rarity: 'rare',
          dateEarned: new Date(),
          criteria: 'Security score > 90 for 5 consecutive projects'
        }
      ]
    };
  }

  private async getUserCertifications(userId: string): Promise<Certification[]> {
    // Mock implementation - would fetch actual certifications
    return [];
  }

  private async generateRecommendations(skillsAssessment: SkillsAssessment, featuredProjects: ProjectShowcase[]): Promise<string[]> {
    const recommendations: string[] = [];
    
    if (skillsAssessment.securityAwareness < 80) {
      recommendations.push('Focus on improving security practices in smart contract development');
    }
    
    if (skillsAssessment.gasOptimization < 75) {
      recommendations.push('Learn more about gas optimization techniques');
    }
    
    if (featuredProjects.length < 3) {
      recommendations.push('Build more projects to showcase your skills');
    }
    
    return recommendations;
  }

  private async generateProfileSummary(learningProfile: any, skillsAssessment: SkillsAssessment, featuredProjects: ProjectShowcase[]): Promise<string> {
    return `Skilled Solidity developer with ${skillsAssessment.overallRating}% overall proficiency. 
    Strong in ${skillsAssessment.securityAwareness > 80 ? 'security' : 'development'} with ${featuredProjects.length} featured projects. 
    Continuously improving through adaptive learning and hands-on development.`;
  }

  private getDefaultSections(): PortfolioSection[] {
    return [
      { id: 'projects', name: 'Featured Projects', type: 'projects', visible: true, order: 1 },
      { id: 'skills', name: 'Technical Skills', type: 'skills', visible: true, order: 2 },
      { id: 'experience', name: 'Experience', type: 'experience', visible: true, order: 3 },
      { id: 'certifications', name: 'Certifications', type: 'certifications', visible: true, order: 4 }
    ];
  }

  private async savePortfolio(portfolio: ProfessionalPortfolio): Promise<void> {
    // Implementation would save portfolio to database
  }

  private async storeQualityMetrics(userId: string, repositoryUrl: string, metrics: CodeQualityMetrics, commitSha?: string): Promise<void> {
    // Implementation would store quality metrics to database
  }

  private isSignificantImprovement(userId: string, metrics: CodeQualityMetrics): boolean {
    // Implementation would check if improvement is significant
    return metrics.overall > 85;
  }

  private async updatePortfolio(userId: string): Promise<void> {
    // Implementation would update portfolio with new metrics
  }

  private async extractGasOptimizations(userId: string, repositoryUrl: string): Promise<GasOptimizationHighlight[]> {
    // Mock implementation
    return [];
  }

  private async extractSecurityFeatures(userId: string, repositoryUrl: string): Promise<SecurityFeature[]> {
    // Mock implementation
    return [];
  }

  private async generateLearningOutcomes(userId: string, repositoryUrl: string, category: string): Promise<string[]> {
    const outcomes: string[] = [];
    
    switch (category) {
      case 'defi':
        outcomes.push('Understanding of DeFi protocols', 'Token economics implementation');
        break;
      case 'nft':
        outcomes.push('NFT standard implementation', 'Metadata management');
        break;
      default:
        outcomes.push('Smart contract development', 'Blockchain fundamentals');
    }
    
    return outcomes;
  }

  private extractTechnologies(repoData: any): string[] {
    const technologies: string[] = [];
    
    if (repoData.language) {
      technologies.push(repoData.language);
    }
    
    // Add common technologies based on topics
    if (repoData.topics) {
      repoData.topics.forEach((topic: string) => {
        if (['hardhat', 'truffle', 'foundry', 'openzeppelin'].includes(topic)) {
          technologies.push(topic);
        }
      });
    }
    
    return technologies;
  }

  private determineComplexity(codeQuality: CodeQualityMetrics): 'beginner' | 'intermediate' | 'advanced' {
    if (codeQuality.complexity < 40) return 'beginner';
    if (codeQuality.complexity < 70) return 'intermediate';
    return 'advanced';
  }

  private async generateProjectHighlights(repositoryUrl: string, codeQuality: CodeQualityMetrics): Promise<string[]> {
    const highlights: string[] = [];
    
    if (codeQuality.securityScore > 90) {
      highlights.push('High security standards with comprehensive vulnerability protection');
    }
    
    if (codeQuality.gasOptimizationScore > 85) {
      highlights.push('Optimized for gas efficiency and cost-effective deployment');
    }
    
    if (codeQuality.testCoverage > 80) {
      highlights.push('Comprehensive test coverage ensuring reliability');
    }
    
    return highlights;
  }

  private estimateTimeInvestment(repoData: any): number {
    // Estimate based on repository size and complexity
    const sizeMultiplier = repoData.size / 1000; // KB to approximate hours
    const baseTime = 20; // Base hours for any project
    
    return Math.round(baseTime + sizeMultiplier * 5);
  }

  private async getCollaborators(owner: string, repo: string): Promise<string[]> {
    try {
      const { data } = await this.octokit.rest.repos.listCollaborators({
        owner,
        repo
      });
      
      return data.map(collaborator => collaborator.login);
    } catch (error) {
      return [];
    }
  }
}

// Missing interfaces for additional types
interface GasOptimizationHighlight {
  id: string;
  title: string;
  description: string;
  gasSaved: number;
  technique: string;
}

interface SecurityFeature {
  id: string;
  name: string;
  description: string;
  type: 'access-control' | 'reentrancy-guard' | 'overflow-protection' | 'input-validation';
  implementation: string;
}

interface Endorsement {
  id: string;
  endorserId: string;
  endorserName: string;
  skill: string;
  message: string;
  date: Date;
}

interface ExperienceRecord {
  id: string;
  company: string;
  position: string;
  startDate: Date;
  endDate?: Date;
  description: string;
  technologies: string[];
  achievements: string[];
}

interface EducationRecord {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: Date;
  endDate?: Date;
  description?: string;
  achievements?: string[];
}

interface TalentPreferences {
  remoteWork: boolean;
  salary: { min: number; max: number; currency: string };
  location: string[];
  industries: string[];
  roleTypes: string[];
  availability: 'immediate' | 'soon' | 'not-looking';
}

interface TalentAnalytics {
  learningVelocity: number;
  consistencyScore: number;
  collaborationRating: number;
  problemSolvingAbility: number;
  adaptabilityScore: number;
  leadershipPotential: number;
  technicalGrowth: GrowthMetrics;
  careerTrajectory: string;
}

interface GrowthMetrics {
  skillImprovement: number;
  projectComplexity: number;
  learningGoalsAchieved: number;
  mentorshipEngagement: number;
}

interface VerificationStatus {
  email: boolean;
  phone: boolean;
  github: boolean;
  linkedin: boolean;
  identity: boolean;
  skills: boolean;
}

// Export factory function
export function createGitHubIntegration(
  githubToken: string,
  securityScanner: SecurityScanner,
  gasAnalyzer: GasOptimizationAnalyzer
): GitHubIntegration {
  return new GitHubIntegration(githubToken, securityScanner, gasAnalyzer);
}
