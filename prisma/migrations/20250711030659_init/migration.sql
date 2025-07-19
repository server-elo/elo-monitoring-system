-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" DATETIME,
    "password" TEXT,
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'STUDENT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "bio" TEXT,
    "githubUsername" TEXT,
    "twitterUsername" TEXT,
    "linkedinUrl" TEXT,
    "websiteUrl" TEXT,
    "skillLevel" TEXT NOT NULL DEFAULT 'BEGINNER',
    "totalXP" INTEGER NOT NULL DEFAULT 0,
    "currentLevel" INTEGER NOT NULL DEFAULT 1,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "lastActiveDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "preferences" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "estimatedHours" INTEGER NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CourseEnrollment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "enrolledAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "progress" REAL NOT NULL DEFAULT 0.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CourseEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CourseEnrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Module" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "order" INTEGER NOT NULL,
    "xpReward" INTEGER NOT NULL DEFAULT 100,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Module_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "moduleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "type" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "xpReward" INTEGER NOT NULL DEFAULT 50,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Lesson_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "courseId" TEXT,
    "moduleId" TEXT,
    "lessonId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "score" INTEGER,
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserProgress_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserProgress_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserProgress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "requirement" JSONB NOT NULL,
    "xpReward" INTEGER NOT NULL DEFAULT 0,
    "badgeUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "UserAchievement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "unlockedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CodeSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'solidity',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "score" INTEGER,
    "feedback" TEXT,
    "gasUsed" TEXT,
    "deploymentTx" TEXT,
    "testResults" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CodeSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CodeSubmission_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Collaboration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "maxParticipants" INTEGER NOT NULL DEFAULT 2,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Mentorship" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mentorId" TEXT NOT NULL,
    "menteeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "startDate" DATETIME,
    "endDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Mentorship_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Mentorship_menteeId_fkey" FOREIGN KEY ("menteeId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "collaborationId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'TEXT',
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChatMessage_collaborationId_fkey" FOREIGN KEY ("collaborationId") REFERENCES "Collaboration" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rating" INTEGER,
    "severity" TEXT,
    "priority" TEXT NOT NULL,
    "steps" TEXT NOT NULL,
    "expectedBehavior" TEXT,
    "actualBehavior" TEXT,
    "browserInfo" TEXT,
    "screenRecording" BOOLEAN NOT NULL DEFAULT false,
    "contactEmail" TEXT,
    "allowFollowUp" BOOLEAN NOT NULL DEFAULT false,
    "page" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "uatSessionId" TEXT,
    "userId" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "assignedTeam" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Feedback_uatSessionId_fkey" FOREIGN KEY ("uatSessionId") REFERENCES "UATSession" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UATSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "testerId" TEXT NOT NULL,
    "testerExperience" TEXT,
    "testerBackground" TEXT,
    "deviceInfo" TEXT,
    "browserInfo" TEXT,
    "assignedTasks" TEXT NOT NULL,
    "startTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "errorsEncountered" INTEGER NOT NULL DEFAULT 0,
    "helpRequests" INTEGER NOT NULL DEFAULT 0,
    "feedbackCount" INTEGER NOT NULL DEFAULT 0,
    "lastFeedbackAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UATSession_testerId_fkey" FOREIGN KEY ("testerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UATTaskResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "timeSpent" INTEGER,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "helpUsed" BOOLEAN NOT NULL DEFAULT false,
    "rating" INTEGER,
    "comments" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UATTaskResult_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "UATSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AILearningContext" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "currentLevel" INTEGER NOT NULL DEFAULT 1,
    "skillLevel" TEXT NOT NULL DEFAULT 'BEGINNER',
    "learningPath" TEXT NOT NULL,
    "recentTopics" TEXT NOT NULL,
    "weakAreas" TEXT NOT NULL,
    "strongAreas" TEXT NOT NULL,
    "preferredLearningStyle" TEXT NOT NULL DEFAULT 'mixed',
    "conceptMastery" JSONB NOT NULL,
    "timeSpentPerTopic" JSONB NOT NULL,
    "errorPatterns" TEXT NOT NULL,
    "successPatterns" TEXT NOT NULL,
    "recommendedNextTopics" TEXT NOT NULL,
    "difficultyPreference" REAL NOT NULL DEFAULT 0.5,
    "lastAnalysisUpdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AILearningContext_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PersonalizedChallenge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "topic" TEXT NOT NULL,
    "starterCode" TEXT NOT NULL,
    "solutionCode" TEXT,
    "testCases" JSONB NOT NULL,
    "hints" TEXT NOT NULL,
    "learningObjectives" TEXT NOT NULL,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT true,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "bestScore" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PersonalizedChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PersonalizedSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "challengeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "score" INTEGER,
    "feedback" TEXT,
    "aiAnalysis" JSONB,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PersonalizedSubmission_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "PersonalizedChallenge" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PersonalizedSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SecurityAnalysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "vulnerabilities" JSONB NOT NULL,
    "gasOptimizations" JSONB NOT NULL,
    "bestPractices" JSONB NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "aiModel" TEXT NOT NULL,
    "analysisTime" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SecurityAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AIInteraction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "aiModel" TEXT NOT NULL,
    "responseTime" INTEGER NOT NULL,
    "confidence" REAL NOT NULL,
    "wasHelpful" BOOLEAN,
    "fallbackUsed" BOOLEAN NOT NULL DEFAULT false,
    "contextUsed" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AIInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VoiceLearningSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "audioData" TEXT,
    "transcription" TEXT,
    "command" TEXT,
    "response" TEXT,
    "accuracy" REAL,
    "sessionDuration" INTEGER NOT NULL DEFAULT 0,
    "isSuccessful" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VoiceLearningSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MultiModalContent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "concept" TEXT NOT NULL,
    "skillLevel" TEXT NOT NULL,
    "textExplanation" TEXT NOT NULL,
    "visualDiagram" TEXT,
    "interactiveDemo" TEXT,
    "codeExample" TEXT,
    "audioNarration" TEXT,
    "videoExplanation" TEXT,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT true,
    "generationModel" TEXT,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "averageRating" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "JobPosting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requirements" TEXT NOT NULL,
    "soliditySkills" TEXT NOT NULL,
    "experienceLevel" TEXT NOT NULL,
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "location" TEXT,
    "isRemote" BOOLEAN NOT NULL DEFAULT false,
    "applicationUrl" TEXT,
    "contactEmail" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "postedBy" TEXT,
    "aiMatched" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "JobApplication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'applied',
    "coverLetter" TEXT,
    "portfolio" JSONB,
    "aiScore" REAL,
    "appliedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "JobApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "JobApplication_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "JobPosting" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BlockchainCertificate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "certificateType" TEXT NOT NULL,
    "skillsVerified" TEXT NOT NULL,
    "nftTokenId" TEXT,
    "nftContractAddress" TEXT,
    "blockchainNetwork" TEXT NOT NULL DEFAULT 'polygon',
    "transactionHash" TEXT,
    "ipfsHash" TEXT,
    "issuedBy" TEXT NOT NULL DEFAULT 'SolidityLearn',
    "validUntil" DATETIME,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "verificationUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BlockchainCertificate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MentorshipMatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mentorId" TEXT NOT NULL,
    "menteeId" TEXT NOT NULL,
    "matchScore" REAL NOT NULL,
    "skillsToLearn" TEXT NOT NULL,
    "skillsToTeach" TEXT NOT NULL,
    "preferredStyle" TEXT,
    "timeZone" TEXT,
    "availability" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "aiRecommended" BOOLEAN NOT NULL DEFAULT true,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "sessionsHeld" INTEGER NOT NULL DEFAULT 0,
    "rating" REAL,
    "feedback" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MentorshipMatch_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MentorshipMatch_menteeId_fkey" FOREIGN KEY ("menteeId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_CollaborationToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_CollaborationToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Collaboration" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_CollaborationToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseEnrollment_userId_courseId_key" ON "CourseEnrollment"("userId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "Module_courseId_title_key" ON "Module"("courseId", "title");

-- CreateIndex
CREATE UNIQUE INDEX "Lesson_moduleId_title_key" ON "Lesson"("moduleId", "title");

-- CreateIndex
CREATE UNIQUE INDEX "UserProgress_userId_courseId_moduleId_lessonId_key" ON "UserProgress"("userId", "courseId", "moduleId", "lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "UserAchievement_userId_achievementId_key" ON "UserAchievement"("userId", "achievementId");

-- CreateIndex
CREATE UNIQUE INDEX "Mentorship_mentorId_menteeId_key" ON "Mentorship"("mentorId", "menteeId");

-- CreateIndex
CREATE UNIQUE INDEX "UATTaskResult_sessionId_taskId_key" ON "UATTaskResult"("sessionId", "taskId");

-- CreateIndex
CREATE UNIQUE INDEX "AILearningContext_userId_key" ON "AILearningContext"("userId");

-- CreateIndex
CREATE INDEX "SecurityAnalysis_userId_codeHash_idx" ON "SecurityAnalysis"("userId", "codeHash");

-- CreateIndex
CREATE INDEX "AIInteraction_userId_sessionId_idx" ON "AIInteraction"("userId", "sessionId");

-- CreateIndex
CREATE INDEX "AIInteraction_requestType_aiModel_idx" ON "AIInteraction"("requestType", "aiModel");

-- CreateIndex
CREATE INDEX "MultiModalContent_concept_skillLevel_idx" ON "MultiModalContent"("concept", "skillLevel");

-- CreateIndex
CREATE INDEX "JobPosting_isActive_experienceLevel_idx" ON "JobPosting"("isActive", "experienceLevel");

-- CreateIndex
CREATE INDEX "JobPosting_soliditySkills_idx" ON "JobPosting"("soliditySkills");

-- CreateIndex
CREATE UNIQUE INDEX "JobApplication_userId_jobId_key" ON "JobApplication"("userId", "jobId");

-- CreateIndex
CREATE INDEX "BlockchainCertificate_userId_certificateType_idx" ON "BlockchainCertificate"("userId", "certificateType");

-- CreateIndex
CREATE INDEX "BlockchainCertificate_nftTokenId_idx" ON "BlockchainCertificate"("nftTokenId");

-- CreateIndex
CREATE INDEX "MentorshipMatch_matchScore_idx" ON "MentorshipMatch"("matchScore");

-- CreateIndex
CREATE UNIQUE INDEX "MentorshipMatch_mentorId_menteeId_key" ON "MentorshipMatch"("mentorId", "menteeId");

-- CreateIndex
CREATE UNIQUE INDEX "_CollaborationToUser_AB_unique" ON "_CollaborationToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_CollaborationToUser_B_index" ON "_CollaborationToUser"("B");
