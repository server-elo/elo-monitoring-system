/**
 * Mentorship Matching Platform
 * AI-powered mentorship system connecting learners with industry professionals
 */

import { adaptiveLearningEngine } from '@/lib/learning/AdaptiveLearningEngine';
;

export interface Mentor {
  id: string;
  name: string;
  title: string;
  company: string;
  expertise: string[];
  experience: number; // years
  specializations: string[];
  availability: MentorAvailability;
  rating: number;
  totalMentees: number;
  successStories: number;
  bio: string;
  linkedinUrl?: string;
  githubUrl?: string;
  calendlyUrl?: string;
  hourlyRate?: number;
  languages: string[];
  timezone: string;
  mentorshipStyle: 'structured' | 'flexible' | 'project-based' | 'career-focused';
}

export interface MentorAvailability {
  hoursPerWeek: number;
  preferredDays: string[];
  timeSlots: TimeSlot[];
  maxMentees: number;
  currentMentees: number;
}

export interface TimeSlot {
  day: string;
  startTime: string;
  endTime: string;
  timezone: string;
}

export interface MentorshipMatch {
  mentorId: string;
  menteeId: string;
  matchScore: number;
  compatibilityFactors: CompatibilityFactor[];
  recommendedDuration: number; // weeks
  suggestedMeetingFrequency: 'weekly' | 'bi-weekly' | 'monthly';
  focusAreas: string[];
  learningGoals: string[];
  successPrediction: number; // 0-100
  matchReason: string;
}

export interface CompatibilityFactor {
  factor: string;
  score: number;
  weight: number;
  description: string;
}

export interface MentorshipProgram {
  id: string;
  mentorId: string;
  menteeId: string;
  status: 'pending' | 'active' | 'completed' | 'paused' | 'cancelled';
  startDate: Date;
  endDate?: Date;
  duration: number; // weeks
  meetingFrequency: string;
  focusAreas: string[];
  goals: ProgramGoal[];
  progress: ProgramProgress;
  sessions: MentorshipSession[];
  feedback: ProgramFeedback[];
}

export interface ProgramGoal {
  id: string;
  description: string;
  targetDate: Date;
  completed: boolean;
  progress: number; // 0-100
  milestones: string[];
}

export interface ProgramProgress {
  overallProgress: number; // 0-100
  goalsCompleted: number;
  totalGoals: number;
  sessionsCompleted: number;
  skillsImproved: string[];
  achievements: string[];
  nextMilestone: string;
}

export interface MentorshipSession {
  id: string;
  programId: string;
  scheduledDate: Date;
  duration: number; // minutes
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  agenda: string[];
  notes: string;
  actionItems: ActionItem[];
  menteeRating?: number;
  mentorRating?: number;
  feedback?: string;
}

export interface ActionItem {
  id: string;
  description: string;
  assignedTo: 'mentor' | 'mentee';
  dueDate: Date;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

export interface ProgramFeedback {
  id: string;
  fromRole: 'mentor' | 'mentee';
  rating: number; // 1-5
  feedback: string;
  categories: FeedbackCategory[];
  timestamp: Date;
  anonymous: boolean;
}

export interface FeedbackCategory {
  category: string;
  rating: number;
  comment?: string;
}

export class MentorshipPlatform {
  private mentors: Map<string, Mentor> = new Map();
  private programs: Map<string, MentorshipProgram> = new Map();
  private matches: Map<string, MentorshipMatch[]> = new Map();

  constructor() {
    this.initializeMentors();
  }

  async findMentorMatches(menteeId: string, preferences?: MentorPreferences): Promise<MentorshipMatch[]> {
    console.log(`🤝 Finding mentor matches for mentee ${menteeId}`);
    
    try {
      // Get mentee's profile and learning needs
      const profile = await adaptiveLearningEngine.analyzeUserPerformance(menteeId);
      const learningNeeds = this.analyzeLearningNeeds(profile);
      
      // Get available mentors
      const availableMentors = Array.from(this.mentors.values())
        .filter(mentor => this.isMentorAvailable(mentor))
        .filter(mentor => this.matchesPreferences(mentor, preferences));
      
      // Calculate matches
      const matches: MentorshipMatch[] = [];
      
      for (const mentor of availableMentors) {
        const match = await this.calculateMentorMatch(menteeId, mentor, profile, learningNeeds);
        if (match.matchScore >= 60) { // Minimum threshold
          matches.push(match);
        }
      }
      
      // Sort by match score
      const sortedMatches = matches.sort((a, b) => b.matchScore - a.matchScore);
      
      // Cache results
      this.matches.set(menteeId, sortedMatches);
      
      console.log(`✅ Found ${sortedMatches.length} mentor matches`);
      return sortedMatches.slice(0, 10); // Top 10 matches
      
    } catch (error) {
      console.error('Mentor matching failed:', error);
      throw error;
    }
  }

  async createMentorshipProgram(
    mentorId: string,
    menteeId: string,
    duration: number,
    focusAreas: string[],
    goals: string[]
  ): Promise<MentorshipProgram> {
    console.log(`🎯 Creating mentorship program: ${mentorId} -> ${menteeId}`);
    
    const mentor = this.mentors.get(mentorId);
    if (!mentor) throw new Error('Mentor not found');
    
    // Generate program goals
    const programGoals: ProgramGoal[] = goals.map((goal, index) => ({
      id: `goal-${index + 1}`,
      description: goal,
      targetDate: new Date(Date.now() + (duration / goals.length) * 7 * 24 * 60 * 60 * 1000),
      completed: false,
      progress: 0,
      milestones: this.generateMilestones(goal)
    }));
    
    const program: MentorshipProgram = {
      id: `program-${Date.now()}`,
      mentorId,
      menteeId,
      status: 'pending',
      startDate: new Date(),
      duration,
      meetingFrequency: this.recommendMeetingFrequency(duration, focusAreas.length),
      focusAreas,
      goals: programGoals,
      progress: {
        overallProgress: 0,
        goalsCompleted: 0,
        totalGoals: programGoals.length,
        sessionsCompleted: 0,
        skillsImproved: [],
        achievements: [],
        nextMilestone: programGoals[0]?.milestones[0] || 'Get started'
      },
      sessions: [],
      feedback: []
    };
    
    this.programs.set(program.id, program);
    
    // Update mentor availability
    mentor.availability.currentMentees++;
    
    return program;
  }

  async scheduleSession(
    programId: string,
    date: Date,
    duration: number,
    agenda: string[]
  ): Promise<MentorshipSession> {
    const program = this.programs.get(programId);
    if (!program) throw new Error('Program not found');
    
    const session: MentorshipSession = {
      id: `session-${Date.now()}`,
      programId,
      scheduledDate: date,
      duration,
      status: 'scheduled',
      agenda,
      notes: '',
      actionItems: []
    };
    
    program.sessions.push(session);
    return session;
  }

  async completeSession(
    sessionId: string,
    notes: string,
    actionItems: Omit<ActionItem, 'id'>[],
    menteeRating?: number,
    mentorRating?: number
  ): Promise<void> {
    // Find session across all programs
    let targetSession: MentorshipSession | undefined;
    let targetProgram: MentorshipProgram | undefined;
    
    for (const program of this.programs.values()) {
      const session = program.sessions.find(s => s.id === sessionId);
      if (session) {
        targetSession = session;
        targetProgram = program;
        break;
      }
    }
    
    if (!targetSession || !targetProgram) {
      throw new Error('Session not found');
    }
    
    // Update session
    targetSession.status = 'completed';
    targetSession.notes = notes;
    targetSession.menteeRating = menteeRating;
    targetSession.mentorRating = mentorRating;
    targetSession.actionItems = actionItems.map((item, index) => ({
      ...item,
      id: `action-${Date.now()}-${index}`
    }));
    
    // Update program progress
    targetProgram.progress.sessionsCompleted++;
    
    // Check for goal progress
    await this.updateGoalProgress(targetProgram.id);
  }

  async provideFeedback(
    programId: string,
    fromRole: 'mentor' | 'mentee',
    rating: number,
    feedback: string,
    categories: FeedbackCategory[]
  ): Promise<void> {
    const program = this.programs.get(programId);
    if (!program) throw new Error('Program not found');
    
    const feedbackEntry: ProgramFeedback = {
      id: `feedback-${Date.now()}`,
      fromRole,
      rating,
      feedback,
      categories,
      timestamp: new Date(),
      anonymous: false
    };
    
    program.feedback.push(feedbackEntry);
    
    // Update mentor rating if feedback is from mentee
    if (fromRole === 'mentee') {
      const mentor = this.mentors.get(program.mentorId);
      if (mentor) {
        // Recalculate mentor rating
        const allFeedback = Array.from(this.programs.values())
          .filter(p => p.mentorId === mentor.id)
          .flatMap(p => p.feedback.filter(f => f.fromRole === 'mentee'));
        
        const avgRating = allFeedback.reduce((sum, f) => sum + f.rating, 0) / allFeedback.length;
        mentor.rating = Math.round(avgRating * 10) / 10;
      }
    }
  }

  private async calculateMentorMatch(
    menteeId: string,
    mentor: Mentor,
    profile: any,
    learningNeeds: string[]
  ): Promise<MentorshipMatch> {
    // Calculate compatibility factors
    const compatibilityFactors: CompatibilityFactor[] = [];
    
    // Expertise alignment
    const expertiseMatch = this.calculateExpertiseMatch(mentor.expertise, learningNeeds);
    compatibilityFactors.push({
      factor: 'Expertise Alignment',
      score: expertiseMatch,
      weight: 40,
      description: `${expertiseMatch}% match in required expertise areas`
    });
    
    // Experience level appropriateness
    const experienceMatch = this.calculateExperienceMatch(mentor.experience, profile);
    compatibilityFactors.push({
      factor: 'Experience Level',
      score: experienceMatch,
      weight: 25,
      description: `Appropriate experience level for mentee's current stage`
    });
    
    // Availability compatibility
    const availabilityMatch = this.calculateAvailabilityMatch(mentor.availability);
    compatibilityFactors.push({
      factor: 'Availability',
      score: availabilityMatch,
      weight: 20,
      description: `Mentor has sufficient availability for effective mentorship`
    });
    
    // Success track record
    const successMatch = this.calculateSuccessMatch(mentor);
    compatibilityFactors.push({
      factor: 'Track Record',
      score: successMatch,
      weight: 15,
      description: `Strong track record of successful mentorships`
    });
    
    // Calculate overall match score
    const matchScore = Math.round(
      compatibilityFactors.reduce((sum, factor) => 
        sum + (factor.score * factor.weight / 100), 0
      )
    );
    
    return {
      mentorId: mentor.id,
      menteeId,
      matchScore,
      compatibilityFactors,
      recommendedDuration: this.recommendDuration(learningNeeds.length),
      suggestedMeetingFrequency: this.recommendMeetingFrequency(12, learningNeeds.length),
      focusAreas: this.identifyFocusAreas(mentor.expertise, learningNeeds),
      learningGoals: await this.generateLearningGoals(menteeId, mentor.expertise),
      successPrediction: Math.min(95, matchScore + 10),
      matchReason: this.generateMatchReason(compatibilityFactors)
    };
  }

  private initializeMentors(): void {
    const sampleMentors: Mentor[] = [
      {
        id: 'mentor-1',
        name: 'Alex Chen',
        title: 'Senior Blockchain Engineer',
        company: 'Ethereum Foundation',
        expertise: ['solidity', 'defi', 'security', 'protocol-design'],
        experience: 6,
        specializations: ['DeFi Protocols', 'Smart Contract Security', 'Layer 2 Solutions'],
        availability: {
          hoursPerWeek: 4,
          preferredDays: ['Tuesday', 'Thursday', 'Saturday'],
          timeSlots: [
            { day: 'Tuesday', startTime: '18:00', endTime: '20:00', timezone: 'UTC' },
            { day: 'Thursday', startTime: '18:00', endTime: '20:00', timezone: 'UTC' }
          ],
          maxMentees: 3,
          currentMentees: 1
        },
        rating: 4.8,
        totalMentees: 15,
        successStories: 12,
        bio: 'Experienced blockchain engineer with expertise in DeFi protocols and smart contract security.',
        linkedinUrl: 'https://linkedin.com/in/alexchen',
        githubUrl: 'https://github.com/alexchen',
        hourlyRate: 150,
        languages: ['English', 'Mandarin'],
        timezone: 'UTC',
        mentorshipStyle: 'project-based'
      }
    ];

    sampleMentors.forEach(mentor => this.mentors.set(mentor.id, mentor));
  }

  private analyzeLearningNeeds(profile: any): string[] {
    const needs: string[] = [];
    
    // Identify areas needing improvement
    Object.entries(profile.skillLevels).forEach(([skill, level]) => {
      if ((level as number) < 70) {
        needs.push(skill);
      }
    });
    
    // Add weakness patterns
    needs.push(...profile.weaknessPatterns);
    
    return [...new Set(needs)]; // Remove duplicates
  }

  private calculateExpertiseMatch(mentorExpertise: string[], learningNeeds: string[]): number {
    const matches = learningNeeds.filter(need => 
      mentorExpertise.some(expertise => 
        expertise.toLowerCase().includes(need.toLowerCase()) ||
        need.toLowerCase().includes(expertise.toLowerCase())
      )
    );
    
    return Math.round((matches.length / learningNeeds.length) * 100);
  }

  // Check if mentor is available
  private isMentorAvailable(mentor: Mentor): boolean {
    // Check if mentor has capacity
    if (mentor.currentMentees.length >= mentor.maxMentees) {
      return false;
    }
    
    // Check if mentor is active
    return mentor.isActive;
  }

  // Check if mentor matches preferences
  private matchesPreferences(mentor: Mentor, preferences: MentorPreferences): boolean {
    // Check experience level
    if (preferences.experienceLevel && mentor.experienceLevel !== preferences.experienceLevel) {
      return false;
    }
    
    // Check specializations
    if (preferences.specializations?.length) {
      const hasSpecialization = preferences.specializations.some(spec => 
        mentor.specializations.includes(spec)
      );
      if (!hasSpecialization) return false;
    }
    
    // Check availability
    if (preferences.availability && mentor.availability < preferences.availability) {
      return false;
    }
    
    // Check communication style
    if (preferences.communicationStyle && mentor.communicationStyle !== preferences.communicationStyle) {
      return false;
    }
    
    return true;
  }

  // Calculate availability match score
  private calculateAvailabilityMatch(
    mentorAvailability: number,
    menteeNeeds: any
  ): number {
    // Higher score if mentor availability matches mentee needs
    const neededHours = menteeNeeds.estimatedHoursPerWeek || 2;
    
    if (mentorAvailability >= neededHours) {
      return 100;
    }
    
    return Math.round((mentorAvailability / neededHours) * 100);
  }

  // Generate match reason
  private generateMatchReason(
    mentor: Mentor,
    profile: LearningProfile,
    matchScore: number
  ): string {
    const reasons = [];
    
    if (matchScore >= 90) {
      reasons.push('Excellent skill alignment');
    }
    
    if (mentor.specializations.some(spec => profile.weaknessPatterns.includes(spec))) {
      reasons.push('Specializes in your growth areas');
    }
    
    if (mentor.rating >= 4.5) {
      reasons.push('Highly rated mentor');
    }
    
    return reasons.join(', ') || 'Good overall match';
  }

  // Calculate success match probability
  private calculateSuccessMatch(
    mentorshipGoals: any[],
    mentorExperience: any
  ): number {
    // Calculate based on mentor's past success with similar goals
    const relevantExperience = mentorExperience.successfulMentorships || 0;
    const totalExperience = mentorExperience.totalMentorships || 1;
    
    const successRate = relevantExperience / totalExperience;
    return Math.round(successRate * 100);
  }

  // Recommend meeting frequency
  private recommendMeetingFrequency(
    goals: any[],
    menteeLevel: string
  ): 'weekly' | 'biweekly' | 'monthly' {
    // More frequent meetings for beginners or intensive goals
    if (menteeLevel === 'beginner' || goals.length > 3) {
      return 'weekly';
    }
    
    if (menteeLevel === 'intermediate') {
      return 'biweekly';
    }
    
    return 'monthly';
  }

  // Recommend mentorship duration
  private recommendDuration(goals: any[]): number {
    // Estimate weeks based on goal complexity
    const baseWeeks = 12; // 3 months base
    const additionalWeeks = goals.length * 2;
    
    return Math.min(52, baseWeeks + additionalWeeks); // Max 1 year
  }

  // Generate learning goals
  private async generateLearningGoals(
    profile: LearningProfile,
    careerGoals: any
  ): Promise<LearningGoal[]> {
    const goals: LearningGoal[] = [];
    
    // Generate goals based on weaknesses
    profile.weaknessPatterns.forEach((weakness, index) => {
      goals.push({
        id: `goal-${index}`,
        title: `Improve ${weakness}`,
        description: `Focus on strengthening ${weakness} skills`,
        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        milestones: [],
        progress: 0,
        status: 'not_started'
      });
    });
    
    // Add career-specific goals
    if (careerGoals.targetRole) {
      goals.push({
        id: `goal-career`,
        title: `Prepare for ${careerGoals.targetRole}`,
        description: `Build skills needed for ${careerGoals.targetRole} position`,
        targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        milestones: [],
        progress: 0,
        status: 'not_started'
      });
    }
    
    return goals;
  }

  // Generate milestones for goals
  private generateMilestones(
    goal: LearningGoal,
    duration: number
  ): Milestone[] {
    const milestones: Milestone[] = [];
    const milestonesCount = Math.min(4, Math.floor(duration / 2)); // Max 4 milestones
    
    for (let i = 0; i < milestonesCount; i++) {
      milestones.push({
        id: `milestone-${i}`,
        goalId: goal.id,
        title: `${goal.title} - Phase ${i + 1}`,
        dueDate: new Date(Date.now() + (i + 1) * 14 * 24 * 60 * 60 * 1000), // Every 2 weeks
        completed: false,
        completedDate: undefined
      });
    }
    
    return milestones;
  }

  // Update goal progress
  private async updateGoalProgress(
    relationshipId: string,
    goalId: string,
    progress: number
  ): Promise<void> {
    const relationship = this.relationships.get(relationshipId);
    if (!relationship) return;
    
    const goal = relationship.goals.find(g => g.id === goalId);
    if (goal) {
      goal.progress = Math.min(100, Math.max(0, progress));
      
      if (goal.progress >= 100) {
        goal.status = 'completed';
      } else if (goal.progress > 0) {
        goal.status = 'in_progress';
      }
      
      this.relationships.set(relationshipId, relationship);
    }
  }

  // Identify focus areas based on profile
  private identifyFocusAreas(profile: LearningProfile): string[] {
    const focusAreas: string[] = [];
    
    // Add weaknesses as focus areas
    focusAreas.push(...profile.weaknessPatterns.slice(0, 3));
    
    // Add areas with low skill levels
    Object.entries(profile.skillLevels).forEach(([skill, level]) => {
      if (level < 40 && !focusAreas.includes(skill)) {
        focusAreas.push(skill);
      }
    });
    
    return focusAreas.slice(0, 5); // Top 5 focus areas
  }
}

interface MentorPreferences {
  experienceLevel?: 'junior' | 'mid' | 'senior';
  specializations?: string[];
  availability?: string[];
  mentorshipStyle?: string;
  maxHourlyRate?: number;
  languages?: string[];
}

export const mentorshipPlatform = new MentorshipPlatform();
