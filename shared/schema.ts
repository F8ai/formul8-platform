import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  decimal,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - mandatory for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  company: varchar("company"),
  role: varchar("role").default("user"),
  preferences: jsonb("preferences").default('{}'), // User preferences and settings
  context: jsonb("context").default('{}'), // User context and conversation history
  lastActiveAt: timestamp("last_active_at").defaultNow(),
  totalQueries: integer("total_queries").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Projects table
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  userId: varchar("user_id").notNull().references(() => users.id),
  status: varchar("status").default("active"), // active, archived
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Queries table
export const queries = pgTable("queries", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  agentType: varchar("agent_type").notNull(), // compliance, patent, operations, etc.
  status: varchar("status").default("pending"), // pending, processing, completed, failed
  requiresHumanVerification: boolean("requires_human_verification").default(false),
  confidenceScore: decimal("confidence_score", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Agent responses table
export const agentResponses = pgTable("agent_responses", {
  id: serial("id").primaryKey(),
  queryId: integer("query_id").notNull().references(() => queries.id),
  agentType: varchar("agent_type").notNull(),
  response: jsonb("response").notNull(), // stores the full response object
  confidenceScore: decimal("confidence_score", { precision: 5, scale: 2 }),
  verificationStatus: varchar("verification_status").default("pending"), // pending, verified, rejected
  createdAt: timestamp("created_at").defaultNow(),
});

// Agent verifications table - for agent-to-agent verification
export const agentVerifications = pgTable("agent_verifications", {
  id: serial("id").primaryKey(),
  primaryResponseId: integer("primary_response_id").notNull().references(() => agentResponses.id),
  verifyingResponseId: integer("verifying_response_id").notNull().references(() => agentResponses.id),
  consensusReached: boolean("consensus_reached").default(false),
  discrepancyNotes: text("discrepancy_notes"),
  finalScore: decimal("final_score", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Agent status table
export const agentStatus = pgTable("agent_status", {
  id: serial("id").primaryKey(),
  agentType: varchar("agent_type").notNull().unique(),
  status: varchar("status").default("online"), // online, offline, maintenance
  lastHeartbeat: timestamp("last_heartbeat").defaultNow(),
  confidenceScore: decimal("confidence_score", { precision: 5, scale: 2 }).default("0"),
  baselineConfidence: decimal("baseline_confidence", { precision: 5, scale: 2 }).default("0"), // our confidence in baseline quality
  totalQueries: integer("total_queries").default(0),
  successfulQueries: integer("successful_queries").default(0),
  averageResponseTime: integer("average_response_time").default(0), // in milliseconds
  llmProvider: varchar("llm_provider").default("openai"), // openai, anthropic, google, etc.
  llmModel: varchar("llm_model").default("gpt-4o"), // gpt-4o, claude-3-sonnet, gemini-pro, etc.
  llmSettings: jsonb("llm_settings").default('{}'), // temperature, max_tokens, etc.
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Desktop folders table - for organizing files and chats
export const desktopFolders = pgTable("desktop_folders", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  description: text("description"),
  parentFolderId: integer("parent_folder_id").references(() => desktopFolders.id), // For nested folders
  position: jsonb("position").default('{"x": 100, "y": 100}'), // Desktop position
  color: varchar("color").default("#3b82f6"), // Folder color theme
  isDefault: boolean("is_default").default(false), // Default folder flag
  isShared: boolean("is_shared").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Desktop files table - for files on the desktop
export const desktopFiles = pgTable("desktop_files", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  folderId: integer("folder_id").references(() => desktopFolders.id), // null means on desktop root
  fileName: varchar("file_name").notNull(),
  fileType: varchar("file_type").notNull(), // document, spreadsheet, pdf, image, etc.
  mimeType: varchar("mime_type"),
  size: integer("size"), // File size in bytes
  content: jsonb("content"), // For text files or metadata
  fileUrl: varchar("file_url"), // URL to actual file storage
  artifactId: integer("artifact_id").references(() => userArtifacts.id), // Link to artifact if applicable
  position: jsonb("position").default('{"x": 50, "y": 50}'), // Desktop position
  tags: jsonb("tags").default('[]'), // File tags
  metadata: jsonb("metadata").default('{}'), // Additional metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User conversations table for chat history
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  folderId: integer("folder_id").references(() => desktopFolders.id), // Link to folder for context
  agentType: varchar("agent_type").notNull(),
  title: varchar("title"),
  summary: text("summary"),
  messages: jsonb("messages").default('[]'), // Array of message objects
  context: jsonb("context").default('{}'), // Conversation-specific context
  folderContext: jsonb("folder_context").default('{}'), // Context from folder contents
  isActive: boolean("is_active").default(true),
  position: jsonb("position"), // Desktop position if displayed as window
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User activity log for tracking interactions
export const userActivity = pgTable("user_activity", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  activityType: varchar("activity_type").notNull(), // query, login, project_created, etc.
  details: jsonb("details").default('{}'),
  agentType: varchar("agent_type"), // if applicable
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: varchar("title").notNull(),
  message: text("message"),
  type: varchar("type").default("info"), // info, success, warning, error
  isRead: boolean("is_read").default(false),
  actionUrl: varchar("action_url"), // Optional URL for notification action
  metadata: jsonb("metadata").default('{}'), // Additional data
  createdAt: timestamp("created_at").defaultNow(),
  readAt: timestamp("read_at"),
});

// Baseline test runs table - captures each test run configuration
export const baselineTestRuns = pgTable("baseline_test_runs", {
  id: serial("id").primaryKey(),
  agentType: varchar("agent_type").notNull(),
  model: varchar("model").notNull().default("gpt-4o"),
  state: varchar("state"), // State for {{state}} substitution
  ragEnabled: boolean("rag_enabled").default(false),
  toolsEnabled: boolean("tools_enabled").default(false),
  kbEnabled: boolean("kb_enabled").default(false),
  customPrompt: text("custom_prompt"), // Custom system prompt used
  userId: varchar("user_id").references(() => users.id),
  status: varchar("status").default("running"), // running, completed, failed
  totalQuestions: integer("total_questions"),
  successfulTests: integer("successful_tests"),
  failedTests: integer("failed_tests"),
  avgAccuracy: decimal("avg_accuracy", { precision: 5, scale: 2 }),
  avgConfidence: decimal("avg_confidence", { precision: 5, scale: 2 }),
  avgResponseTime: decimal("avg_response_time", { precision: 7, scale: 2 }),
  categoryBreakdown: jsonb("category_breakdown"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Individual baseline test results table - captures each question/answer
export const baselineTestResults = pgTable("baseline_test_results", {
  id: serial("id").primaryKey(),
  runId: integer("run_id").notNull().references(() => baselineTestRuns.id),
  questionId: varchar("question_id").notNull(),
  question: text("question").notNull(),
  expectedAnswer: text("expected_answer"),
  agentResponse: text("agent_response"),
  accuracy: decimal("accuracy", { precision: 5, scale: 2 }),
  confidence: decimal("confidence", { precision: 5, scale: 2 }),
  responseTime: decimal("response_time", { precision: 7, scale: 2 }),
  category: varchar("category"),
  difficulty: varchar("difficulty"),
  maxScore: integer("max_score").default(10),
  // Token and cost tracking for model responses
  inputTokens: integer("input_tokens"),
  outputTokens: integer("output_tokens"),
  totalTokens: integer("total_tokens"),
  estimatedCost: decimal("estimated_cost", { precision: 8, scale: 6 }),
  // AI grading information
  aiGrade: decimal("ai_grade", { precision: 5, scale: 2 }),
  aiGradingTokens: integer("ai_grading_tokens"),
  aiGradingCost: decimal("ai_grading_cost", { precision: 8, scale: 6 }),
  aiGradingConfidence: decimal("ai_grading_confidence", { precision: 5, scale: 2 }),
  aiGradingReasoning: text("ai_grading_reasoning"),
  // Human grading information
  humanGrade: decimal("human_grade", { precision: 5, scale: 2 }),
  humanGradedBy: varchar("human_graded_by").references(() => users.id),
  humanGradingNotes: text("human_grading_notes"),
  humanImprovedResponse: text("human_improved_response"), // Human-suggested improved response
  humanGradedAt: timestamp("human_graded_at"),
  // Agreement between AI and human grading
  gradingAgreement: decimal("grading_agreement", { precision: 5, scale: 2 }), // Percentage agreement
  requiresReview: boolean("requires_review").default(false), // Flag for significant disagreements
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Baseline exam results table (legacy - keeping for compatibility)
export const baselineExamResults = pgTable("baseline_exam_results", {
  id: serial("id").primaryKey(),
  agentType: varchar("agent_type").notNull(),
  examDate: timestamp("exam_date").defaultNow(),
  overallScore: decimal("overall_score", { precision: 5, scale: 2 }).notNull(),
  confidenceScore: decimal("confidence_score", { precision: 5, scale: 2 }).notNull(),
  accuracyScore: decimal("accuracy_score", { precision: 5, scale: 2 }).notNull(),
  speedScore: decimal("speed_score", { precision: 5, scale: 2 }).notNull(),
  domainExpertise: jsonb("domain_expertise").$type<Record<string, number>>(),
  testResults: jsonb("test_results").$type<{
    totalQuestions: number;
    correctAnswers: number;
    averageResponseTime: number;
    categoryScores: Record<string, number>;
  }>(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Baseline history table - tracks performance over time with Git commits
export const baselineHistory = pgTable("baseline_history", {
  id: serial("id").primaryKey(),
  agentType: varchar("agent_type", { length: 50 }).notNull(),
  commitHash: varchar("commit_hash", { length: 40 }).notNull(),
  commitMessage: text("commit_message"),
  commitAuthor: varchar("commit_author", { length: 100 }),
  commitDate: timestamp("commit_date").notNull(),
  accuracy: decimal("accuracy", { precision: 5, scale: 2 }).notNull(),
  confidence: decimal("confidence", { precision: 5, scale: 4 }).notNull(),
  baselineConfidence: decimal("baseline_confidence", { precision: 5, scale: 4 }).notNull(),
  testsPassed: integer("tests_passed").notNull(),
  testsTotal: integer("tests_total").notNull(),
  averageResponseTime: integer("average_response_time").default(0),
  badgeUrls: jsonb("badge_urls").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_baseline_history_agent_commit").on(table.agentType, table.commitHash),
  index("idx_baseline_history_date").on(table.commitDate),
]);

// Cost tracking table
export const costs = pgTable("costs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  queryId: integer("query_id").references(() => queries.id),
  agentType: varchar("agent_type").notNull(),
  costType: varchar("cost_type").notNull(), // api_call, inference, training, storage
  amount: decimal("amount", { precision: 10, scale: 4 }).notNull(), // Cost in USD
  currency: varchar("currency").default("USD"),
  provider: varchar("provider").notNull(), // openai, aws, anthropic
  details: jsonb("details").default('{}'), // Additional cost breakdown
  createdAt: timestamp("created_at").defaultNow(),
});

// Budget tracking table
export const budgets = pgTable("budgets", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  period: varchar("period").notNull(), // daily, weekly, monthly, yearly
  agentTypes: jsonb("agent_types").default('[]'), // Array of agent types covered
  alertThreshold: decimal("alert_threshold", { precision: 5, scale: 2 }).default(0.8), // 80%
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User artifacts table - documents that agents can read/write/update
export const userArtifacts = pgTable("user_artifacts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: varchar("title").notNull(),
  description: text("description"),
  type: varchar("type").notNull(), // document, sheet, presentation, form, patent_search, sop, formulation, etc.
  category: varchar("category").notNull(), // compliance, formulation, marketing, science, etc.
  content: jsonb("content").notNull(), // Structured content that agents can read/write
  googleDriveFileId: varchar("google_drive_file_id"), // Link to Google Drive file
  googleDriveUrl: varchar("google_drive_url"), // Public URL for viewing
  status: varchar("status").default("draft"), // draft, active, archived
  permissions: jsonb("permissions").default('{}'), // Agent read/write permissions
  agentAccess: jsonb("agent_access").default('[]'), // Which agents have accessed this
  lastModifiedByAgent: varchar("last_modified_by_agent"),
  version: integer("version").default(1),
  tags: jsonb("tags").default('[]'), // Searchable tags
  metadata: jsonb("metadata").default('{}'), // Additional metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Agent tools configuration for OpenAI Assistant and MCP support
export const agentTools = pgTable("agent_tools", {
  id: serial("id").primaryKey(),
  agentType: varchar("agent_type").notNull(),
  toolName: varchar("tool_name").notNull(),
  toolType: varchar("tool_type").notNull(), // openai_function, mcp_tool, google_docs, api_call
  configuration: jsonb("configuration").notNull(), // Tool-specific config
  enabled: boolean("enabled").default(true),
  openaiAssistantId: varchar("openai_assistant_id"), // OpenAI Assistant ID if applicable
  mcpServerUrl: varchar("mcp_server_url"), // MCP server URL if applicable
  permissions: jsonb("permissions").default('{}'), // Access permissions
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Artifact modification history for audit trail
export const artifactHistory = pgTable("artifact_history", {
  id: serial("id").primaryKey(),
  artifactId: integer("artifact_id").notNull().references(() => userArtifacts.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  agentType: varchar("agent_type"), // Which agent made the change
  changeType: varchar("change_type").notNull(), // create, update, delete, view
  changes: jsonb("changes").default('{}'), // What changed
  previousVersion: integer("previous_version"),
  newVersion: integer("new_version"),
  changeReason: text("change_reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  queries: many(queries),
  conversations: many(conversations),
  activities: many(userActivity),
  costs: many(costs),
  budgets: many(budgets),
  artifacts: many(userArtifacts),
  desktopFolders: many(desktopFolders),
  desktopFiles: many(desktopFiles),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  queries: many(queries),
}));

export const queriesRelations = relations(queries, ({ one, many }) => ({
  user: one(users, {
    fields: [queries.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [queries.projectId],
    references: [projects.id],
  }),
  responses: many(agentResponses),
}));

export const agentResponsesRelations = relations(agentResponses, ({ one, many }) => ({
  query: one(queries, {
    fields: [agentResponses.queryId],
    references: [queries.id],
  }),
  primaryVerifications: many(agentVerifications, {
    relationName: "primaryResponse",
  }),
  verifyingVerifications: many(agentVerifications, {
    relationName: "verifyingResponse",
  }),
}));

export const agentVerificationsRelations = relations(agentVerifications, ({ one }) => ({
  primaryResponse: one(agentResponses, {
    fields: [agentVerifications.primaryResponseId],
    references: [agentResponses.id],
    relationName: "primaryResponse",
  }),
  verifyingResponse: one(agentResponses, {
    fields: [agentVerifications.verifyingResponseId],
    references: [agentResponses.id],
    relationName: "verifyingResponse",
  }),
}));

export const conversationsRelations = relations(conversations, ({ one }) => ({
  user: one(users, {
    fields: [conversations.userId],
    references: [users.id],
  }),
  folder: one(desktopFolders, {
    fields: [conversations.folderId],
    references: [desktopFolders.id],
  }),
}));

export const desktopFoldersRelations = relations(desktopFolders, ({ one, many }) => ({
  user: one(users, {
    fields: [desktopFolders.userId],
    references: [users.id],
  }),
  parentFolder: one(desktopFolders, {
    fields: [desktopFolders.parentFolderId],
    references: [desktopFolders.id],
    relationName: "parent",
  }),
  subfolders: many(desktopFolders, {
    relationName: "parent",
  }),
  files: many(desktopFiles),
  conversations: many(conversations),
}));

export const desktopFilesRelations = relations(desktopFiles, ({ one }) => ({
  user: one(users, {
    fields: [desktopFiles.userId],
    references: [users.id],
  }),
  folder: one(desktopFolders, {
    fields: [desktopFiles.folderId],
    references: [desktopFolders.id],
  }),
  artifact: one(userArtifacts, {
    fields: [desktopFiles.artifactId],
    references: [userArtifacts.id],
  }),
}));

export const userActivityRelations = relations(userActivity, ({ one }) => ({
  user: one(users, {
    fields: [userActivity.userId],
    references: [users.id],
  }),
}));

export const baselineExamResultsRelations = relations(baselineExamResults, ({ one }) => ({
  agentStatus: one(agentStatus, {
    fields: [baselineExamResults.agentType],
    references: [agentStatus.agentType],
  }),
}));

export const baselineTestRunsRelations = relations(baselineTestRuns, ({ one, many }) => ({
  user: one(users, {
    fields: [baselineTestRuns.userId],
    references: [users.id],
  }),
  results: many(baselineTestResults),
}));

export const baselineTestResultsRelations = relations(baselineTestResults, ({ one }) => ({
  run: one(baselineTestRuns, {
    fields: [baselineTestResults.runId],
    references: [baselineTestRuns.id],
  }),
  humanGrader: one(users, {
    fields: [baselineTestResults.humanGradedBy],
    references: [users.id],
  }),
}));

export const costsRelations = relations(costs, ({ one }) => ({
  user: one(users, {
    fields: [costs.userId],
    references: [users.id],
  }),
  query: one(queries, {
    fields: [costs.queryId],
    references: [queries.id],
  }),
}));

export const budgetsRelations = relations(budgets, ({ one }) => ({
  user: one(users, {
    fields: [budgets.userId],
    references: [users.id],
  }),
}));

export const userArtifactsRelations = relations(userArtifacts, ({ one, many }) => ({
  user: one(users, {
    fields: [userArtifacts.userId],
    references: [users.id],
  }),
  history: many(artifactHistory),
}));

export const agentToolsRelations = relations(agentTools, ({ one }) => ({
  agent: one(agentStatus, {
    fields: [agentTools.agentType],
    references: [agentStatus.agentType],
  }),
}));

export const artifactHistoryRelations = relations(artifactHistory, ({ one }) => ({
  artifact: one(userArtifacts, {
    fields: [artifactHistory.artifactId],
    references: [userArtifacts.id],
  }),
  user: one(users, {
    fields: [artifactHistory.userId],
    references: [users.id],
  }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  company: true,
  role: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertQuerySchema = createInsertSchema(queries).omit({
  id: true,
  status: true,
  confidenceScore: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAgentResponseSchema = createInsertSchema(agentResponses).omit({
  id: true,
  verificationStatus: true,
  createdAt: true,
});

// Types
// Insert schemas for new tables
export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserActivitySchema = createInsertSchema(userActivity).omit({
  id: true,
  createdAt: true,
});

export const insertBaselineExamResultSchema = createInsertSchema(baselineExamResults).omit({
  id: true,
  createdAt: true,
});

export const insertBaselineTestRunSchema = createInsertSchema(baselineTestRuns).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertBaselineTestResultSchema = createInsertSchema(baselineTestResults).omit({
  id: true,
  createdAt: true,
  gradedAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertQuery = z.infer<typeof insertQuerySchema>;
export type Query = typeof queries.$inferSelect;
export type InsertAgentResponse = z.infer<typeof insertAgentResponseSchema>;
export type AgentResponse = typeof agentResponses.$inferSelect;
export type AgentVerification = typeof agentVerifications.$inferSelect;
export type AgentStatusType = typeof agentStatus.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type UserActivity = typeof userActivity.$inferSelect;
export type InsertUserActivity = z.infer<typeof insertUserActivitySchema>;
export type BaselineExamResult = typeof baselineExamResults.$inferSelect;
export type InsertBaselineExamResult = z.infer<typeof insertBaselineExamResultSchema>;
export type BaselineTestRun = typeof baselineTestRuns.$inferSelect;
export type InsertBaselineTestRun = z.infer<typeof insertBaselineTestRunSchema>;
export type BaselineTestResult = typeof baselineTestResults.$inferSelect;
export type InsertBaselineTestResult = z.infer<typeof insertBaselineTestResultSchema>;

// Cost tracking schemas
export const insertCostSchema = createInsertSchema(costs).omit({
  id: true,
  createdAt: true,
});

export const insertBudgetSchema = createInsertSchema(budgets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Cost tracking types
export type Cost = typeof costs.$inferSelect;
export type InsertCost = z.infer<typeof insertCostSchema>;
export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = z.infer<typeof insertBudgetSchema>;

// Artifact schemas and types
export const insertUserArtifactSchema = createInsertSchema(userArtifacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAgentToolSchema = createInsertSchema(agentTools).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertArtifactHistorySchema = createInsertSchema(artifactHistory).omit({
  id: true,
  createdAt: true,
});

export type UserArtifact = typeof userArtifacts.$inferSelect;
export type InsertUserArtifact = z.infer<typeof insertUserArtifactSchema>;
export type AgentTool = typeof agentTools.$inferSelect;
export type InsertAgentTool = z.infer<typeof insertAgentToolSchema>;
export type ArtifactHistory = typeof artifactHistory.$inferSelect;
export type InsertArtifactHistory = z.infer<typeof insertArtifactHistorySchema>;

// Dashboard Widget Customization
export const dashboardLayouts = pgTable("dashboard_layouts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  layoutName: text("layout_name").notNull().default("default"),
  widgets: jsonb("widgets").notNull().default([]),
  gridConfig: jsonb("grid_config").notNull().default({}),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const widgetPreferences = pgTable("widget_preferences", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  widgetType: text("widget_type").notNull(),
  preferences: jsonb("preferences").notNull().default({}),
  isEnabled: boolean("is_enabled").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Dashboard widget relations
export const dashboardLayoutsRelations = relations(dashboardLayouts, ({ one }) => ({
  user: one(users, {
    fields: [dashboardLayouts.userId],
    references: [users.id],
  }),
}));

export const widgetPreferencesRelations = relations(widgetPreferences, ({ one }) => ({
  user: one(users, {
    fields: [widgetPreferences.userId],
    references: [users.id],
  }),
}));

// Zod schemas for dashboard customization
export const insertDashboardLayoutSchema = createInsertSchema(dashboardLayouts);
export const selectDashboardLayoutSchema = createSelectSchema(dashboardLayouts);
export const insertWidgetPreferencesSchema = createInsertSchema(widgetPreferences);
export const selectWidgetPreferencesSchema = createSelectSchema(widgetPreferences);

// Widget configuration types
export const WidgetConfigSchema = z.object({
  id: z.string(),
  type: z.enum(['agent-status', 'recent-activity', 'compliance-summary', 'formulation-queue', 'cost-tracker', 'chat-quick-access', 'metrics-overview', 'calendar', 'notifications']),
  position: z.object({
    x: z.number(),
    y: z.number(),
    w: z.number(),
    h: z.number(),
  }),
  title: z.string().optional(),
  settings: z.record(z.any()).optional(),
});

export const DashboardLayoutSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  layoutName: z.string(),
  widgets: z.array(WidgetConfigSchema),
  gridConfig: z.object({
    cols: z.number().default(12),
    rows: z.number().default(20),
    margin: z.array(z.number()).default([10, 10]),
    compactType: z.enum(['vertical', 'horizontal', null]).default('vertical'),
    preventCollision: z.boolean().default(false),
  }),
  isDefault: z.boolean().default(false),
});

// Dashboard widget types
export type DashboardLayout = typeof dashboardLayouts.$inferSelect;
export type InsertDashboardLayout = typeof dashboardLayouts.$inferInsert;
export type WidgetPreferences = typeof widgetPreferences.$inferSelect;
export type InsertWidgetPreferences = typeof widgetPreferences.$inferInsert;
export type WidgetConfig = z.infer<typeof WidgetConfigSchema>;
export type DashboardLayoutConfig = z.infer<typeof DashboardLayoutSchema>;

// Notification schema
export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Tool Sessions table - for AI workspace tool management
export const toolSessions = pgTable("tool_sessions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: varchar("title").notNull(),
  toolType: varchar("tool_type").notNull(), // chat, calculator, document
  agentType: varchar("agent_type"), // compliance, formulation, etc. (for chat tools)
  dataFile: varchar("data_file"), // path to data file (optional for chat tools)
  data: jsonb("data").notNull().$type<{
    type: string;
    [key: string]: any;
  }>(), // tool-specific data structure
  isActive: boolean("is_active").default(true),
  lastActive: timestamp("last_active").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// File Storage table - for generated documents and calculator data
export const fileStorage = pgTable("file_storage", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionId: text("session_id").notNull().references(() => toolSessions.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  fileName: varchar("file_name").notNull(),
  fileType: varchar("file_type").notNull(), // json, html, csv, etc.
  mimeType: varchar("mime_type"),
  content: text("content"), // for text-based files
  objectStoragePath: varchar("object_storage_path"), // path in object storage for uploaded files
  binaryData: text("binary_data"), // base64 encoded for binary files
  metadata: jsonb("metadata").default('{}'),
  version: integer("version").default(1),
  size: integer("size"), // file size in bytes
  checksum: varchar("checksum"), // for integrity verification
  isDeleted: boolean("is_deleted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tool Sessions relations
export const toolSessionsRelations = relations(toolSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [toolSessions.userId],
    references: [users.id],
  }),
  files: many(fileStorage),
}));

export const fileStorageRelations = relations(fileStorage, ({ one }) => ({
  session: one(toolSessions, {
    fields: [fileStorage.sessionId],
    references: [toolSessions.id],
  }),
  user: one(users, {
    fields: [fileStorage.userId],
    references: [users.id],
  }),
}));

// Tool Sessions schemas
export const insertToolSessionSchema = createInsertSchema(toolSessions).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertFileStorageSchema = createInsertSchema(fileStorage).omit({
  createdAt: true,
  updatedAt: true,
});

// Tool Sessions types
export type ToolSession = typeof toolSessions.$inferSelect;
export type InsertToolSession = z.infer<typeof insertToolSessionSchema>;
export type FileStorage = typeof fileStorage.$inferSelect;
export type InsertFileStorage = z.infer<typeof insertFileStorageSchema>;

// Desktop folder and file schemas
export const insertDesktopFolderSchema = createInsertSchema(desktopFolders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDesktopFileSchema = createInsertSchema(desktopFiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Desktop folder and file types
export type DesktopFolder = typeof desktopFolders.$inferSelect;
export type InsertDesktopFolder = z.infer<typeof insertDesktopFolderSchema>;
export type DesktopFile = typeof desktopFiles.$inferSelect;
export type InsertDesktopFile = z.infer<typeof insertDesktopFileSchema>;
