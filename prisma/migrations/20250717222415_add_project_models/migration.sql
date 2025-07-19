-- CreateTable
CREATE TABLE "ConceptMastery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "concept" TEXT NOT NULL,
    "masteryLevel" REAL NOT NULL DEFAULT 0,
    "masteredAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ConceptMastery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "requirements" TEXT NOT NULL,
    "starterCode" TEXT NOT NULL,
    "solutionCode" TEXT,
    "testCases" JSONB NOT NULL,
    "estimatedHours" INTEGER NOT NULL DEFAULT 4,
    "xpReward" INTEGER NOT NULL DEFAULT 500,
    "moduleId" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "githubUrl" TEXT,
    "deploymentUrl" TEXT,
    "resources" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Project_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "githubUrl" TEXT,
    "deploymentUrl" TEXT,
    "demoVideoUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "feedback" TEXT,
    "score" INTEGER,
    "gasUsed" TEXT,
    "testsPassed" INTEGER NOT NULL DEFAULT 0,
    "testsTotal" INTEGER NOT NULL DEFAULT 0,
    "submittedAt" DATETIME,
    "reviewedAt" DATETIME,
    "reviewedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProjectSubmission_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectSubmission_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectCollaboration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "maxParticipants" INTEGER NOT NULL DEFAULT 4,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProjectCollaboration_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectCollaboration_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectCollaborator" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "collaborationId" TEXT,
    "submissionId" TEXT,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CONTRIBUTOR',
    "contribution" TEXT,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectCollaborator_collaborationId_fkey" FOREIGN KEY ("collaborationId") REFERENCES "ProjectCollaboration" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectCollaborator_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ProjectSubmission" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectCollaborator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "codeQuality" INTEGER,
    "functionality" INTEGER,
    "creativity" INTEGER,
    "documentation" INTEGER,
    "feedback" TEXT NOT NULL,
    "helpful" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProjectReview_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectReview_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ProjectSubmission" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectChatMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "collaborationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'TEXT',
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectChatMessage_collaborationId_fkey" FOREIGN KEY ("collaborationId") REFERENCES "ProjectCollaboration" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ConceptMastery_userId_concept_key" ON "ConceptMastery"("userId", "concept");

-- CreateIndex
CREATE INDEX "Project_difficulty_category_idx" ON "Project"("difficulty", "category");

-- CreateIndex
CREATE INDEX "Project_isPublished_category_idx" ON "Project"("isPublished", "category");

-- CreateIndex
CREATE INDEX "ProjectSubmission_status_createdAt_idx" ON "ProjectSubmission"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectSubmission_projectId_userId_key" ON "ProjectSubmission"("projectId", "userId");

-- CreateIndex
CREATE INDEX "ProjectCollaboration_status_isPublic_idx" ON "ProjectCollaboration"("status", "isPublic");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectCollaborator_collaborationId_userId_key" ON "ProjectCollaborator"("collaborationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectCollaborator_submissionId_userId_key" ON "ProjectCollaborator"("submissionId", "userId");

-- CreateIndex
CREATE INDEX "ProjectReview_projectId_rating_idx" ON "ProjectReview"("projectId", "rating");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectReview_submissionId_reviewerId_key" ON "ProjectReview"("submissionId", "reviewerId");

-- CreateIndex
CREATE INDEX "ProjectChatMessage_collaborationId_createdAt_idx" ON "ProjectChatMessage"("collaborationId", "createdAt");

-- CreateIndex
CREATE INDEX "ChatMessage_collaborationId_createdAt_idx" ON "ChatMessage"("collaborationId", "createdAt");

-- CreateIndex
CREATE INDEX "ChatMessage_userId_createdAt_idx" ON "ChatMessage"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Collaboration_status_type_idx" ON "Collaboration"("status", "type");

-- CreateIndex
CREATE INDEX "Collaboration_createdAt_idx" ON "Collaboration"("createdAt");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "User_email_role_idx" ON "User"("email", "role");

-- CreateIndex
CREATE INDEX "UserAchievement_userId_isCompleted_idx" ON "UserAchievement"("userId", "isCompleted");

-- CreateIndex
CREATE INDEX "UserAchievement_userId_unlockedAt_idx" ON "UserAchievement"("userId", "unlockedAt");

-- CreateIndex
CREATE INDEX "UserProgress_userId_status_idx" ON "UserProgress"("userId", "status");

-- CreateIndex
CREATE INDEX "UserProgress_userId_completedAt_idx" ON "UserProgress"("userId", "completedAt");

-- CreateIndex
CREATE INDEX "UserProgress_courseId_status_idx" ON "UserProgress"("courseId", "status");
