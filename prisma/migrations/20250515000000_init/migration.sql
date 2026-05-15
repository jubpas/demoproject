-- Create User table
CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT,
  "email" TEXT UNIQUE,
  "emailVerified" INTEGER,
  "image" TEXT,
  "password" TEXT,
  "systemRole" TEXT DEFAULT 'USER',
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Account table
CREATE TABLE IF NOT EXISTS "Account" (
  "id" TEXT PRIMARY KEY,
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
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Create Session table
CREATE TABLE IF NOT EXISTS "Session" (
  "id" TEXT PRIMARY KEY,
  "sessionToken" TEXT NOT NULL UNIQUE,
  "userId" TEXT NOT NULL,
  "expires" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Create VerificationToken table
CREATE TABLE IF NOT EXISTS "VerificationToken" (
  "id" TEXT PRIMARY KEY,
  "identifier" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "expires" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("identifier", "token")
);

-- Create PasswordResetToken table
CREATE TABLE IF NOT EXISTS "PasswordResetToken" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expires" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Create Organization table
CREATE TABLE IF NOT EXISTS "Organization" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT UNIQUE,
  "description" TEXT,
  "logo" TEXT,
  "approvalThreshold" TEXT DEFAULT 'NONE',
  "archivedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Membership table
CREATE TABLE IF NOT EXISTS "Membership" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'STAFF',
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE,
  UNIQUE("userId", "organizationId")
);

-- Create OrganizationInvite table
CREATE TABLE IF NOT EXISTS "OrganizationInvite" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expires" TIMESTAMP NOT NULL,
  "status" TEXT DEFAULT 'PENDING',
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE,
  FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Create OrganizationSubscription table
CREATE TABLE IF NOT EXISTS "OrganizationSubscription" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "status" TEXT DEFAULT 'ACTIVE',
  "currentPeriodEnd" TIMESTAMP,
  "cancelAtPeriodEnd" INTEGER DEFAULT 0,
  "stripeCustomerId" TEXT,
  "stripeSubscriptionId" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);

-- Create SubscriptionPlan table
CREATE TABLE IF NOT EXISTS "SubscriptionPlan" (
  "id" TEXT PRIMARY KEY,
  "code" TEXT UNIQUE NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "price" INTEGER NOT NULL,
  "currency" TEXT DEFAULT 'THB',
  "features" TEXT,
  "maxUsers" INTEGER,
  "maxProjects" INTEGER,
  "active" INTEGER DEFAULT 1,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create SubscriptionEvent table
CREATE TABLE IF NOT EXISTS "SubscriptionEvent" (
  "id" TEXT PRIMARY KEY,
  "organizationSubscriptionId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "data" TEXT,
  "stripeEventId" TEXT,
  "processed" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("organizationSubscriptionId") REFERENCES "OrganizationSubscription"("id") ON DELETE CASCADE
);

-- Create Project table
CREATE TABLE IF NOT EXISTS "Project" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT,
  "description" TEXT,
  "status" TEXT DEFAULT 'PLANNING',
  "budget" INTEGER,
  "startDate" TIMESTAMP,
  "endDate" TIMESTAMP,
  "archivedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);

-- Create ProjectTask table
CREATE TABLE IF NOT EXISTS "ProjectTask" (
  "id" TEXT PRIMARY KEY,
  "projectId" TEXT NOT NULL,
  "parentTaskId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT DEFAULT 'TODO',
  "priority" TEXT DEFAULT 'MEDIUM',
  "assignedToId" TEXT,
  "startDate" TIMESTAMP,
  "dueDate" TIMESTAMP,
  "completedAt" TIMESTAMP,
  "sortOrder" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE,
  FOREIGN KEY ("parentTaskId") REFERENCES "ProjectTask"("id") ON DELETE CASCADE
);

-- Create ProjectBudgetLine table
CREATE TABLE IF NOT EXISTS "ProjectBudgetLine" (
  "id" TEXT PRIMARY KEY,
  "projectId" TEXT NOT NULL,
  "budgetCategoryId" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "currency" TEXT DEFAULT 'THB',
  "description" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE,
  FOREIGN KEY ("budgetCategoryId") REFERENCES "BudgetCategory"("id") ON DELETE CASCADE
);

-- Create BudgetCategory table
CREATE TABLE IF NOT EXISTS "BudgetCategory" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "color" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE,
  UNIQUE("organizationId", "name")
);

-- Create BudgetRevision table
CREATE TABLE IF NOT EXISTS "BudgetRevision" (
  "id" TEXT PRIMARY KEY,
  "budgetLineId" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "reason" TEXT,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("budgetLineId") REFERENCES "ProjectBudgetLine"("id") ON DELETE CASCADE
);

-- Create Customer table
CREATE TABLE IF NOT EXISTS "Customer" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "city" TEXT,
  "province" TEXT,
  "postalCode" TEXT,
  "country" TEXT DEFAULT 'TH',
  "type" TEXT DEFAULT 'INDIVIDUAL',
  "notes" TEXT,
  "archivedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);

-- Create Transaction table
CREATE TABLE IF NOT EXISTS "Transaction" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "projectId" TEXT,
  "customerId" TEXT,
  "type" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "currency" TEXT DEFAULT 'THB',
  "description" TEXT,
  "date" TIMESTAMP NOT NULL,
  "paymentStatus" TEXT DEFAULT 'PENDING',
  "receiptUrl" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE,
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL,
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL
);

-- Create Quotation table
CREATE TABLE IF NOT EXISTS "Quotation" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "projectId" TEXT,
  "customerId" TEXT,
  "quotationNumber" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "validUntil" TIMESTAMP,
  "status" TEXT DEFAULT 'DRAFT',
  "totalAmount" INTEGER,
  "taxAmount" INTEGER,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE,
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL,
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL
);

-- Create QuotationItem table
CREATE TABLE IF NOT EXISTS "QuotationItem" (
  "id" TEXT PRIMARY KEY,
  "quotationId" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "quantity" INTEGER DEFAULT 1,
  "unitPrice" INTEGER NOT NULL,
  "totalPrice" INTEGER NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE
);

-- Create ApprovalRequest table
CREATE TABLE IF NOT EXISTS "ApprovalRequest" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "requesterId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "amount" INTEGER,
  "description" TEXT,
  "status" TEXT DEFAULT 'PENDING',
  "approverId" TEXT,
  "approvedAt" TIMESTAMP,
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE,
  FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE,
  FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE SET NULL
);

-- Create AuditLog table
CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "userId" TEXT,
  "action" TEXT NOT NULL,
  "entity" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "changes" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL
);

-- Create Attachment table
CREATE TABLE IF NOT EXISTS "Attachment" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "mimeType" TEXT,
  "fileSize" INTEGER,
  "uploadedBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE,
  FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Create UserPreference table
CREATE TABLE IF NOT EXISTS "UserPreference" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL UNIQUE,
  "theme" TEXT DEFAULT 'LIGHT',
  "language" TEXT DEFAULT 'th',
  "notifications" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Create AuthenticatedSession table
CREATE TABLE IF NOT EXISTS "AuthenticatedSession" (
  "id" TEXT PRIMARY KEY,
  "sessionToken" TEXT NOT NULL UNIQUE,
  "userId" TEXT NOT NULL,
  "expires" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Create WorkerTeam table
CREATE TABLE IF NOT EXISTS "WorkerTeam" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "isActive" INTEGER DEFAULT 1,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE,
  FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Create WorkerTeamMember table
CREATE TABLE IF NOT EXISTS "WorkerTeamMember" (
  "id" TEXT PRIMARY KEY,
  "workerTeamId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" TEXT DEFAULT 'MEMBER',
  "isMainWorker" INTEGER DEFAULT 0,
  "compensationType" TEXT DEFAULT 'DAILY',
  "dailyWageInCents" INTEGER,
  "monthlyWageInCents" INTEGER,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("workerTeamId") REFERENCES "WorkerTeam"("id") ON DELETE CASCADE,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Create WorkerAssignment table
CREATE TABLE IF NOT EXISTS "WorkerAssignment" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "projectId" TEXT,
  "taskId" TEXT,
  "workerTeamId" TEXT,
  "workerId" TEXT,
  "title" TEXT NOT NULL,
  "startDate" TIMESTAMP NOT NULL,
  "endDate" TIMESTAMP,
  "plannedDays" INTEGER,
  "compensationType" TEXT DEFAULT 'DAILY',
  "wageInCents" INTEGER,
  "estimatedCostInCents" INTEGER,
  "status" TEXT DEFAULT 'PLANNED',
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE,
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL,
  FOREIGN KEY ("taskId") REFERENCES "ProjectTask"("id") ON DELETE SET NULL,
  FOREIGN KEY ("workerTeamId") REFERENCES "WorkerTeam"("id") ON DELETE SET NULL,
  FOREIGN KEY ("workerId") REFERENCES "User"("id") ON DELETE SET NULL
);

-- Create WorkLog table
CREATE TABLE IF NOT EXISTS "WorkLog" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "workerTeamId" TEXT,
  "workerUserId" TEXT NOT NULL,
  "projectId" TEXT,
  "taskId" TEXT,
  "date" TIMESTAMP NOT NULL,
  "startTime" TEXT,
  "endTime" TEXT,
  "durationMinutes" INTEGER,
  "description" TEXT,
  "status" TEXT DEFAULT 'PENDING',
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE,
  FOREIGN KEY ("workerTeamId") REFERENCES "WorkerTeam"("id") ON DELETE SET NULL,
  FOREIGN KEY ("workerUserId") REFERENCES "User"("id") ON DELETE CASCADE,
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL,
  FOREIGN KEY ("taskId") REFERENCES "ProjectTask"("id") ON DELETE SET NULL
);

-- Create SurveyAppointment table
CREATE TABLE IF NOT EXISTS "SurveyAppointment" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "customerId" TEXT,
  "projectId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "scheduledAt" TIMESTAMP NOT NULL,
  "status" TEXT DEFAULT 'PENDING',
  "location" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE,
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL,
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "Account_userId_idx" ON "Account"("userId");
CREATE INDEX IF NOT EXISTS "Account_provider_providerAccountId_idx" ON "Account"("provider", "providerAccountId");
CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId");
CREATE INDEX IF NOT EXISTS "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");
CREATE INDEX IF NOT EXISTS "PasswordResetToken_tokenHash_idx" ON "PasswordResetToken"("tokenHash");
CREATE INDEX IF NOT EXISTS "Membership_userId_idx" ON "Membership"("userId");
CREATE INDEX IF NOT EXISTS "Membership_organizationId_idx" ON "Membership"("organizationId");
CREATE INDEX IF NOT EXISTS "OrganizationInvite_organizationId_idx" ON "OrganizationInvite"("organizationId");
CREATE INDEX IF NOT EXISTS "OrganizationInvite_email_status_idx" ON "OrganizationInvite"("email", "status");
CREATE INDEX IF NOT EXISTS "OrganizationSubscription_organizationId_idx" ON "OrganizationSubscription"("organizationId");
CREATE INDEX IF NOT EXISTS "Project_organizationId_idx" ON "Project"("organizationId");
CREATE INDEX IF NOT EXISTS "ProjectTask_projectId_idx" ON "ProjectTask"("projectId");
CREATE INDEX IF NOT EXISTS "ProjectTask_parentTaskId_idx" ON "ProjectTask"("parentTaskId");
CREATE INDEX IF NOT EXISTS "ProjectTask_assignedToId_status_idx" ON "ProjectTask"("assignedToId", "status");
CREATE INDEX IF NOT EXISTS "ProjectTask_projectId_status_idx" ON "ProjectTask"("projectId", "status");
CREATE INDEX IF NOT EXISTS "ProjectTask_organizationId_projectId_sortOrder_idx" ON "ProjectTask"("organizationId", "projectId", "sortOrder");
CREATE INDEX IF NOT EXISTS "ProjectBudgetLine_projectId_idx" ON "ProjectBudgetLine"("projectId");
CREATE INDEX IF NOT EXISTS "ProjectBudgetLine_budgetCategoryId_idx" ON "ProjectBudgetLine"("budgetCategoryId");
CREATE INDEX IF NOT EXISTS "ProjectBudgetLine_projectId_budgetCategoryId_idx" ON "ProjectBudgetLine"("projectId", "budgetCategoryId");
CREATE INDEX IF NOT EXISTS "BudgetCategory_organizationId_idx" ON "BudgetCategory"("organizationId");
CREATE INDEX IF NOT EXISTS "BudgetCategory_organizationId_name_idx" ON "BudgetCategory"("organizationId", "name");
CREATE INDEX IF NOT EXISTS "BudgetRevision_budgetLineId_idx" ON "BudgetRevision"("budgetLineId");
CREATE INDEX IF NOT EXISTS "Customer_organizationId_idx" ON "Customer"("organizationId");
CREATE INDEX IF NOT EXISTS "Transaction_organizationId_idx" ON "Transaction"("organizationId");
CREATE INDEX IF NOT EXISTS "Transaction_projectId_idx" ON "Transaction"("projectId");
CREATE INDEX IF NOT EXISTS "Transaction_customerId_idx" ON "Transaction"("customerId");
CREATE INDEX IF NOT EXISTS "Quotation_organizationId_idx" ON "Quotation"("organizationId");
CREATE INDEX IF NOT EXISTS "Quotation_projectId_idx" ON "Quotation"("projectId");
CREATE INDEX IF NOT EXISTS "Quotation_customerId_idx" ON "Quotation"("customerId");
CREATE INDEX IF NOT EXISTS "Quotation_organizationId_quotationNumber_idx" ON "Quotation"("organizationId", "quotationNumber");
CREATE INDEX IF NOT EXISTS "QuotationItem_quotationId_idx" ON "QuotationItem"("quotationId");
CREATE INDEX IF NOT EXISTS "ApprovalRequest_organizationId_idx" ON "ApprovalRequest"("organizationId");
CREATE INDEX IF NOT EXISTS "AuditLog_organizationId_idx" ON "AuditLog"("organizationId");
CREATE INDEX IF NOT EXISTS "Attachment_organizationId_idx" ON "Attachment"("organizationId");
CREATE INDEX IF NOT EXISTS "UserPreference_userId_idx" ON "UserPreference"("userId");
CREATE INDEX IF NOT EXISTS "WorkerTeam_organizationId_idx" ON "WorkerTeam"("organizationId");
CREATE INDEX IF NOT EXISTS "WorkerTeam_organizationId_isActive_idx" ON "WorkerTeam"("organizationId", "isActive");
CREATE INDEX IF NOT EXISTS "WorkerTeamMember_workerTeamId_idx" ON "WorkerTeamMember"("workerTeamId");
CREATE INDEX IF NOT EXISTS "WorkerTeamMember_userId_idx" ON "WorkerTeamMember"("userId");
CREATE INDEX IF NOT EXISTS "WorkerAssignment_organizationId_idx" ON "WorkerAssignment"("organizationId");
CREATE INDEX IF NOT EXISTS "WorkLog_organizationId_idx" ON "WorkLog"("organizationId");
CREATE INDEX IF NOT EXISTS "WorkLog_workerTeamId_idx" ON "WorkLog"("workerTeamId");
CREATE INDEX IF NOT EXISTS "WorkLog_workerUserId_idx" ON "WorkLog"("workerUserId");
CREATE INDEX IF NOT EXISTS "WorkLog_projectId_idx" ON "WorkLog"("projectId");
CREATE INDEX IF NOT EXISTS "WorkLog_taskId_idx" ON "WorkLog"("taskId");
CREATE INDEX IF NOT EXISTS "SurveyAppointment_organizationId_idx" ON "SurveyAppointment"("organizationId");
CREATE INDEX IF NOT EXISTS "SubscriptionEvent_organizationSubscriptionId_idx" ON "SubscriptionEvent"("organizationSubscriptionId");
CREATE INDEX IF NOT EXISTS "SubscriptionEvent_organizationSubscriptionId_createdAt_idx" ON "SubscriptionEvent"("organizationSubscriptionId", "createdAt");
CREATE INDEX IF NOT EXISTS "AuthenticatedSession_userId_idx" ON "AuthenticatedSession"("userId");
CREATE INDEX IF NOT EXISTS "VerificationToken_identifier_token_idx" ON "VerificationToken"("identifier", "token");
CREATE INDEX IF NOT EXISTS "VerificationToken_token_idx" ON "VerificationToken"("token");
