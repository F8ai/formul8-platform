import {
  users,
  projects,
  queries,
  agentResponses,
  agentVerifications,
  agentStatus,
  conversations,
  userActivity,
  userArtifacts,
  agentTools,
  artifactHistory,
  baselineExamResults,
  baselineTestRuns,
  baselineTestResults,
  type User,
  type UpsertUser,
  type Project,
  type InsertProject,
  type Query,
  type InsertQuery,
  type AgentResponse,
  type InsertAgentResponse,
  type AgentVerification,
  type AgentStatusType,
  type Conversation,
  type InsertConversation,
  type UserActivity,
  type InsertUserActivity,
  type UserArtifact,
  type InsertUserArtifact,
  type AgentTool,
  type InsertAgentTool,
  type ArtifactHistory,
  type InsertArtifactHistory,
  type BaselineExamResult,
  type InsertBaselineExamResult,
  type BaselineTestRun,
  type InsertBaselineTestRun,
  type BaselineTestResult,
  type InsertBaselineTestResult,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or } from "drizzle-orm";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserActivity(userId: string): Promise<void>;
  updateUserContext(userId: string, context: Record<string, any>): Promise<User | undefined>;
  
  // Project operations
  createProject(project: InsertProject): Promise<Project>;
  getUserProjects(userId: string): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  updateProject(id: number, updates: Partial<InsertProject>): Promise<Project | undefined>;
  
  // Query operations
  createQuery(query: InsertQuery): Promise<Query>;
  getQuery(id: number): Promise<Query | undefined>;
  getUserQueries(userId: string, limit?: number): Promise<Query[]>;
  updateQuery(id: number, updates: Partial<Query>): Promise<Query | undefined>;
  
  // Agent response operations
  createAgentResponse(response: InsertAgentResponse): Promise<AgentResponse>;
  getQueryResponses(queryId: number): Promise<AgentResponse[]>;
  
  // Agent verification operations
  createVerification(verification: Omit<AgentVerification, 'id' | 'createdAt'>): Promise<AgentVerification>;
  getVerifications(limit?: number): Promise<AgentVerification[]>;
  
  // Agent status operations
  updateAgentStatus(agentType: string, updates: Partial<AgentStatusType>): Promise<AgentStatusType>;
  getAllAgentStatus(): Promise<AgentStatusType[]>;
  getAgentStatus(agentType: string): Promise<AgentStatusType | undefined>;
  
  // Conversation operations
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversation(id: number): Promise<Conversation | undefined>;
  getUserConversations(userId: string, limit?: number): Promise<Conversation[]>;
  updateConversation(id: number, updates: Partial<Conversation>): Promise<Conversation | undefined>;
  addMessageToConversation(conversationId: number, message: any): Promise<Conversation | undefined>;
  
  // User activity operations
  logUserActivity(activity: InsertUserActivity): Promise<UserActivity>;
  getUserActivity(userId: string, limit?: number): Promise<UserActivity[]>;
  
  // Baseline exam operations (legacy)
  createBaselineExamResult(result: InsertBaselineExamResult): Promise<BaselineExamResult>;
  getLatestBaselineExamResults(): Promise<BaselineExamResult[]>;
  getBaselineExamResultsForAgent(agentType: string): Promise<BaselineExamResult[]>;

  // Baseline testing operations
  createBaselineTestRun(run: InsertBaselineTestRun): Promise<BaselineTestRun>;
  updateBaselineTestRun(id: number, updates: Partial<BaselineTestRun>): Promise<BaselineTestRun | undefined>;
  getBaselineTestRun(id: number): Promise<BaselineTestRun | undefined>;
  getBaselineTestRuns(filters?: {
    agentType?: string;
    model?: string;
    state?: string;
    userId?: string;
    limit?: number;
  }): Promise<BaselineTestRun[]>;
  
  createBaselineTestResult(result: InsertBaselineTestResult): Promise<BaselineTestResult>;
  updateBaselineTestResult(id: number, updates: Partial<BaselineTestResult>): Promise<BaselineTestResult | undefined>;
  getBaselineTestResults(runId: number): Promise<BaselineTestResult[]>;
  getBaselineTestResultsWithFilters(filters: {
    runId?: number;
    agentType?: string;
    category?: string;
    difficulty?: string;
    manualGrade?: number;
    gradedBy?: string;
    limit?: number;
  }): Promise<BaselineTestResult[]>;

  // User artifacts operations
  createArtifact(artifact: InsertUserArtifact): Promise<UserArtifact>;
  getArtifact(id: number): Promise<UserArtifact | undefined>;
  getUserArtifacts(userId: string, category?: string): Promise<UserArtifact[]>;
  updateArtifact(id: number, updates: Partial<UserArtifact>, agentType?: string): Promise<UserArtifact | undefined>;
  deleteArtifact(id: number): Promise<boolean>;
  searchArtifacts(userId: string, query: string): Promise<UserArtifact[]>;

  // Agent tools operations
  createAgentTool(tool: InsertAgentTool): Promise<AgentTool>;
  getAgentTools(agentType: string): Promise<AgentTool[]>;
  updateAgentTool(id: number, updates: Partial<AgentTool>): Promise<AgentTool | undefined>;
  deleteAgentTool(id: number): Promise<boolean>;

  // Artifact history operations
  logArtifactChange(change: InsertArtifactHistory): Promise<ArtifactHistory>;
  getArtifactHistory(artifactId: number): Promise<ArtifactHistory[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations - mandatory for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          lastActiveAt: new Date(),
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserActivity(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        lastActiveAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async updateUserContext(userId: string, context: Record<string, any>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ 
        context,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Project operations
  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  async getUserProjects(userId: string): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(desc(projects.updatedAt));
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async updateProject(id: number, updates: Partial<InsertProject>): Promise<Project | undefined> {
    const [updated] = await db
      .update(projects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return updated;
  }

  // Query operations
  async createQuery(query: InsertQuery): Promise<Query> {
    const [newQuery] = await db.insert(queries).values(query).returning();
    return newQuery;
  }

  async getQuery(id: number): Promise<Query | undefined> {
    const [query] = await db.select().from(queries).where(eq(queries.id, id));
    return query;
  }

  async getUserQueries(userId: string, limit = 50): Promise<Query[]> {
    return await db
      .select()
      .from(queries)
      .where(eq(queries.userId, userId))
      .orderBy(desc(queries.createdAt))
      .limit(limit);
  }

  async updateQuery(id: number, updates: Partial<Query>): Promise<Query | undefined> {
    const [updated] = await db
      .update(queries)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(queries.id, id))
      .returning();
    return updated;
  }

  // Agent response operations
  async createAgentResponse(response: InsertAgentResponse): Promise<AgentResponse> {
    const [newResponse] = await db.insert(agentResponses).values(response).returning();
    return newResponse;
  }

  async getQueryResponses(queryId: number): Promise<AgentResponse[]> {
    return await db
      .select()
      .from(agentResponses)
      .where(eq(agentResponses.queryId, queryId))
      .orderBy(desc(agentResponses.createdAt));
  }

  // Agent verification operations
  async createVerification(verification: Omit<AgentVerification, 'id' | 'createdAt'>): Promise<AgentVerification> {
    const [newVerification] = await db.insert(agentVerifications).values(verification).returning();
    return newVerification;
  }

  async getVerifications(limit = 20): Promise<AgentVerification[]> {
    return await db
      .select()
      .from(agentVerifications)
      .orderBy(desc(agentVerifications.createdAt))
      .limit(limit);
  }

  // Agent status operations
  async updateAgentStatus(agentType: string, updates: Partial<AgentStatusType>): Promise<AgentStatusType> {
    const [updated] = await db
      .insert(agentStatus)
      .values({ agentType, ...updates })
      .onConflictDoUpdate({
        target: agentStatus.agentType,
        set: { ...updates, updatedAt: new Date() },
      })
      .returning();
    return updated;
  }

  async getAllAgentStatus(): Promise<AgentStatusType[]> {
    return await db.select().from(agentStatus).orderBy(agentStatus.agentType);
  }

  async getAgentStatus(agentType: string): Promise<AgentStatusType | undefined> {
    const [status] = await db.select().from(agentStatus).where(eq(agentStatus.agentType, agentType));
    return status;
  }

  // Conversation operations
  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const [newConversation] = await db
      .insert(conversations)
      .values(conversation)
      .returning();
    return newConversation;
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));
    return conversation;
  }

  async getUserConversations(userId: string, limit = 50): Promise<Conversation[]> {
    const userConversations = await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.lastMessageAt))
      .limit(limit);
    return userConversations;
  }

  async updateConversation(id: number, updates: Partial<Conversation>): Promise<Conversation | undefined> {
    const [conversation] = await db
      .update(conversations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(conversations.id, id))
      .returning();
    return conversation;
  }

  async addMessageToConversation(conversationId: number, message: any): Promise<Conversation | undefined> {
    // First get the current conversation
    const conversation = await this.getConversation(conversationId);
    if (!conversation) return undefined;

    // Add the new message to the messages array
    const messages = Array.isArray(conversation.messages) ? conversation.messages : [];
    messages.push({
      ...message,
      timestamp: new Date().toISOString(),
      id: messages.length + 1
    });

    // Update the conversation
    const [updated] = await db
      .update(conversations)
      .set({ 
        messages,
        lastMessageAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(conversations.id, conversationId))
      .returning();
    return updated;
  }

  // User activity operations
  async logUserActivity(activity: InsertUserActivity): Promise<UserActivity> {
    const [newActivity] = await db
      .insert(userActivity)
      .values(activity)
      .returning();
    return newActivity;
  }

  async getUserActivity(userId: string, limit = 100): Promise<UserActivity[]> {
    const activities = await db
      .select()
      .from(userActivity)
      .where(eq(userActivity.userId, userId))
      .orderBy(desc(userActivity.createdAt))
      .limit(limit);
    return activities;
  }

  // Baseline exam operations
  async createBaselineExamResult(result: InsertBaselineExamResult): Promise<BaselineExamResult> {
    const [examResult] = await db.insert(baselineExamResults).values(result).returning();
    return examResult;
  }

  async getLatestBaselineExamResults(): Promise<BaselineExamResult[]> {
    const results = await db.select().from(baselineExamResults)
      .orderBy(desc(baselineExamResults.examDate))
      .limit(50);
    return results;
  }

  async getBaselineExamResultsForAgent(agentType: string): Promise<BaselineExamResult[]> {
    const results = await db.select().from(baselineExamResults)
      .where(eq(baselineExamResults.agentType, agentType))
      .orderBy(desc(baselineExamResults.examDate))
      .limit(10);
    return results;
  }

  // Baseline testing operations
  async createBaselineTestRun(run: InsertBaselineTestRun): Promise<BaselineTestRun> {
    const [newRun] = await db.insert(baselineTestRuns).values(run).returning();
    return newRun;
  }

  async updateBaselineTestRun(id: number, updates: Partial<BaselineTestRun>): Promise<BaselineTestRun | undefined> {
    const [updated] = await db
      .update(baselineTestRuns)
      .set(updates)
      .where(eq(baselineTestRuns.id, id))
      .returning();
    return updated;
  }

  async getBaselineTestRun(id: number): Promise<BaselineTestRun | undefined> {
    const [run] = await db
      .select()
      .from(baselineTestRuns)
      .where(eq(baselineTestRuns.id, id));
    return run;
  }

  async getBaselineTestRuns(filters: {
    agentType?: string;
    model?: string;
    state?: string;
    userId?: string;
    limit?: number;
  } = {}): Promise<BaselineTestRun[]> {
    let query = db.select().from(baselineTestRuns);

    const conditions = [];
    if (filters.agentType) conditions.push(eq(baselineTestRuns.agentType, filters.agentType));
    if (filters.model) conditions.push(eq(baselineTestRuns.model, filters.model));
    if (filters.state) conditions.push(eq(baselineTestRuns.state, filters.state));
    if (filters.userId) conditions.push(eq(baselineTestRuns.userId, filters.userId));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query
      .orderBy(desc(baselineTestRuns.createdAt))
      .limit(filters.limit || 50);
  }

  async createBaselineTestResult(result: InsertBaselineTestResult): Promise<BaselineTestResult> {
    const [newResult] = await db.insert(baselineTestResults).values(result).returning();
    return newResult;
  }

  async updateBaselineTestResult(id: number, updates: Partial<BaselineTestResult>): Promise<BaselineTestResult | undefined> {
    const [updated] = await db
      .update(baselineTestResults)
      .set(updates)
      .where(eq(baselineTestResults.id, id))
      .returning();
    return updated;
  }

  async getBaselineTestResults(runId: number): Promise<BaselineTestResult[]> {
    return await db
      .select()
      .from(baselineTestResults)
      .where(eq(baselineTestResults.runId, runId))
      .orderBy(baselineTestResults.questionId);
  }

  async getBaselineTestResultsWithFilters(filters: {
    runId?: number;
    agentType?: string;
    category?: string;
    difficulty?: string;
    manualGrade?: number;
    gradedBy?: string;
    limit?: number;
  }): Promise<BaselineTestResult[]> {
    let query = db
      .select()
      .from(baselineTestResults)
      .leftJoin(baselineTestRuns, eq(baselineTestResults.runId, baselineTestRuns.id));

    const conditions = [];
    if (filters.runId) conditions.push(eq(baselineTestResults.runId, filters.runId));
    if (filters.agentType) conditions.push(eq(baselineTestRuns.agentType, filters.agentType));
    if (filters.category) conditions.push(eq(baselineTestResults.category, filters.category));
    if (filters.difficulty) conditions.push(eq(baselineTestResults.difficulty, filters.difficulty));
    if (filters.manualGrade !== undefined) conditions.push(eq(baselineTestResults.manualGrade, filters.manualGrade));
    if (filters.gradedBy) conditions.push(eq(baselineTestResults.gradedBy, filters.gradedBy));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(baselineTestResults.createdAt))
      .limit(filters.limit || 100);

    // Return only the baseline test results, not the joined run data
    return results.map(r => r.baseline_test_results);
  }

  // User artifacts operations
  async createArtifact(artifact: InsertUserArtifact): Promise<UserArtifact> {
    const [newArtifact] = await db.insert(userArtifacts).values(artifact).returning();
    
    // Log creation in history
    await this.logArtifactChange({
      artifactId: newArtifact.id,
      userId: artifact.userId,
      changeType: 'create',
      changes: { created: true },
      newVersion: 1,
    });
    
    return newArtifact;
  }

  async getArtifact(id: number): Promise<UserArtifact | undefined> {
    const [artifact] = await db.select().from(userArtifacts).where(eq(userArtifacts.id, id));
    return artifact;
  }

  async getUserArtifacts(userId: string, category?: string): Promise<UserArtifact[]> {
    let query = db.select().from(userArtifacts).where(eq(userArtifacts.userId, userId));
    
    if (category) {
      query = query.where(and(eq(userArtifacts.userId, userId), eq(userArtifacts.category, category)));
    }
    
    return await query.orderBy(desc(userArtifacts.updatedAt));
  }

  async updateArtifact(id: number, updates: Partial<UserArtifact>, agentType?: string): Promise<UserArtifact | undefined> {
    const current = await this.getArtifact(id);
    if (!current) return undefined;

    const newVersion = (current.version || 1) + 1;
    const [updated] = await db
      .update(userArtifacts)
      .set({ 
        ...updates, 
        version: newVersion,
        lastModifiedByAgent: agentType,
        updatedAt: new Date() 
      })
      .where(eq(userArtifacts.id, id))
      .returning();

    // Log the change
    await this.logArtifactChange({
      artifactId: id,
      userId: current.userId,
      agentType,
      changeType: 'update',
      changes: updates,
      previousVersion: current.version || 1,
      newVersion,
    });

    return updated;
  }

  async deleteArtifact(id: number): Promise<boolean> {
    const artifact = await this.getArtifact(id);
    if (!artifact) return false;

    await db.delete(userArtifacts).where(eq(userArtifacts.id, id));
    
    // Log deletion
    await this.logArtifactChange({
      artifactId: id,
      userId: artifact.userId,
      changeType: 'delete',
      changes: { deleted: true },
    });

    return true;
  }

  async searchArtifacts(userId: string, query: string): Promise<UserArtifact[]> {
    // Simple text search across title, description, and tags
    const artifacts = await db
      .select()
      .from(userArtifacts)
      .where(
        and(
          eq(userArtifacts.userId, userId),
          or(
            // Using ilike for case-insensitive search (PostgreSQL specific)
            // For other databases, you might need to use like with lower()
            db.sql`${userArtifacts.title} ILIKE ${'%' + query + '%'}`,
            db.sql`${userArtifacts.description} ILIKE ${'%' + query + '%'}`,
            db.sql`${userArtifacts.tags}::text ILIKE ${'%' + query + '%'}`
          )
        )
      )
      .orderBy(desc(userArtifacts.updatedAt));
    
    return artifacts;
  }

  // Agent tools operations
  async createAgentTool(tool: InsertAgentTool): Promise<AgentTool> {
    const [newTool] = await db.insert(agentTools).values(tool).returning();
    return newTool;
  }

  async getAgentTools(agentType: string): Promise<AgentTool[]> {
    const tools = await db
      .select()
      .from(agentTools)
      .where(eq(agentTools.agentType, agentType))
      .orderBy(agentTools.toolName);
    return tools;
  }

  async updateAgentTool(id: number, updates: Partial<AgentTool>): Promise<AgentTool | undefined> {
    const [updated] = await db
      .update(agentTools)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(agentTools.id, id))
      .returning();
    return updated;
  }

  async deleteAgentTool(id: number): Promise<boolean> {
    const result = await db.delete(agentTools).where(eq(agentTools.id, id));
    return result.rowCount > 0;
  }

  // Artifact history operations
  async logArtifactChange(change: InsertArtifactHistory): Promise<ArtifactHistory> {
    const [historyEntry] = await db.insert(artifactHistory).values(change).returning();
    return historyEntry;
  }

  async getArtifactHistory(artifactId: number): Promise<ArtifactHistory[]> {
    const history = await db
      .select()
      .from(artifactHistory)
      .where(eq(artifactHistory.artifactId, artifactId))
      .orderBy(desc(artifactHistory.createdAt));
    return history;
  }
}

export const storage = new DatabaseStorage();
